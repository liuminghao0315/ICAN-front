<template>
  <div class="records-center">

    <!-- ── 页面头部 ── -->
    <div class="page-header">
      <div class="header-left">
        <h1 class="page-title">记录中心</h1>
        <span class="record-count">共 {{ totalRecords }} 条记录</span>
      </div>
      <div class="header-actions">
        <button class="ctrl-btn" :class="{ active: batchMode }" @click="toggleBatchMode">
          <el-icon><Grid /></el-icon>
          {{ batchMode ? '退出批量' : '批量管理' }}
        </button>
        <button class="ctrl-btn primary" @click="showNewTaskModal = true">
          <el-icon><Plus /></el-icon>
          新建分析任务
        </button>
      </div>
    </div>

    <!-- ── 批量操作栏 ── -->
    <Transition name="slide-down">
      <div class="batch-bar" v-if="batchMode && selectedIds.size > 0">
        <span class="batch-count">已选 <strong>{{ selectedIds.size }}</strong> 条</span>
        <div class="batch-actions">
          <button class="ctrl-btn sm" @click="handleBatchExport">
            <el-icon><Download /></el-icon>导出报告
          </button>
          <button class="ctrl-btn sm danger" @click="handleBatchDelete">
            <el-icon><Delete /></el-icon>批量删除
          </button>
        </div>
        <button class="batch-clear" @click="selectedIds.clear()">清空选择</button>
      </div>
    </Transition>

    <!-- ── 筛选工具栏 ── -->
    <div class="filter-bar">
      <div class="filter-chips">
        <button
          v-for="f in statusFilters" :key="f.value"
          class="filter-chip" :class="{ active: activeStatus === f.value }"
          @click="activeStatus = f.value"
        >{{ f.label }}</button>
      </div>
      <div class="filter-right">
        <!-- 来源下拉 -->
        <NeuSelect
          v-model="sourceFilter"
          :options="sourceOptions"
          placeholder="全部来源"
        >
          <template #icon><el-icon><Connection /></el-icon></template>
        </NeuSelect>
        <!-- 风险下拉 -->
        <NeuSelect
          v-model="riskFilter"
          :options="riskOptions"
          placeholder="全部风险"
        >
          <template #icon><el-icon><Warning /></el-icon></template>
        </NeuSelect>
        <!-- 搜索 -->
        <div class="search-box">
          <el-icon class="search-icon"><Search /></el-icon>
          <input v-model="searchKeyword" class="search-input" placeholder="搜索标题 / 高校 / 关键词" @input="debouncedSearch" />
          <button v-if="searchKeyword" class="search-clear" @click="searchKeyword = ''; loadRecords()">
            <el-icon><Close /></el-icon>
          </button>
        </div>
      </div>
    </div>

    <!-- ── 卡片网格 ── -->
    <div class="records-grid" v-if="!loading && records.length > 0">
      <div
        class="record-card"
        v-for="record in records" :key="record.videoId"
        :class="{
          'is-selected': selectedIds.has(record.id),
          'is-failed': record.status === 'FAILED'
        }"
        @click="handleCardClick(record)"
      >
        <!-- 批量勾选 -->
        <div class="card-checkbox" v-if="batchMode" @click.stop="toggleSelect(record.id)">
          <div class="checkbox-inner" :class="{ checked: selectedIds.has(record.id) }">
            <el-icon v-if="selectedIds.has(record.id)"><Check /></el-icon>
          </div>
        </div>

        <!-- ① 封面区 16:9 — v-memo 锁定封面，仅 status/progress 变化时重绘遮罩 -->
        <div class="card-cover" v-memo="[record.thumbnailUrl, record.videoUrl, record.videoDuration, record.sourceType, record.status, record.progress]">
          <!-- 优先展示服务端缩略图 -->
          <img
            v-if="record.thumbnailUrl"
            :src="record.thumbnailUrl"
            class="cover-img"
            alt="封面"
            @error="(e) => { (e.target as HTMLImageElement).style.display='none'; (e.target as HTMLImageElement).nextElementSibling?.removeAttribute('style') }"
          />
          <!-- 降级：用 video 标签截取第一帧作为封面 -->
          <video
            v-else-if="record.videoUrl"
            :src="record.videoUrl + '#t=1'"
            class="cover-img"
            preload="metadata"
            muted
          />
          <!-- 兜底：静态占位 -->
          <div class="cover-placeholder" v-if="!record.thumbnailUrl && !record.videoUrl">
            <el-icon :size="28"><VideoPlay /></el-icon>
            <span>暂无封面</span>
          </div>
          <!-- 时长角标 -->
          <span class="cover-duration" v-if="record.videoDuration">{{ formatDuration(record.videoDuration) }}</span>
          <!-- 来源角标 -->
          <span class="cover-source" :class="record.sourceType === 'URL_IMPORT' ? 'url' : 'local'">
            <el-icon><Link v-if="record.sourceType === 'URL_IMPORT'" /><Upload v-else /></el-icon>
          </span>
          <!-- 进行中遮罩 -->
          <div class="cover-progress-mask" v-if="['DOWNLOADING','PENDING','PROCESSING'].includes(record.status)">
            <div class="mask-progress-bar" :style="{ width: record.progress + '%' }"></div>
            <span class="mask-label">{{ getStatusText(record.status) }} {{ record.progress }}%</span>
          </div>
        </div>

        <!-- ② 卡片主体 -->
        <div class="card-body">
          <!-- 标题行 + 风险 Badge — v-memo 锁定标题，仅状态/风险变化时重绘 -->
          <div class="card-title-row" v-memo="[record.videoTitle, record.status, record.riskLevel]">
            <h3 class="card-title" :title="record.videoTitle">{{ record.videoTitle || '未命名' }}</h3>
            <span
              v-if="record.status === 'COMPLETED' && record.riskLevel"
              class="risk-badge"
              :class="'risk-' + record.riskLevel.toLowerCase()"
            >{{ getRiskText(record.riskLevel) }}</span>
            <span v-else class="status-pill" :class="getStatusClass(record.status)">
              {{ getStatusText(record.status) }}
            </span>
          </div>

          <!-- 关键词 + 高校标签 -->
          <div class="card-tags" v-if="record.status === 'COMPLETED'">
            <span v-for="kw in (record.keywords || []).slice(0, 3)" :key="kw" class="tag kw">{{ kw }}</span>
            <span v-if="record.universityName" class="tag uni">
              <el-icon><School /></el-icon>{{ record.universityName }}
            </span>
            <span v-if="record.topicCategory" class="tag topic">{{ record.topicCategory }}</span>
          </div>
          <div class="card-tags" v-else-if="record.errorMessage">
            <span class="tag error">{{ record.errorMessage.slice(0, 40) }}</span>
          </div>
          <div class="card-tags-placeholder" v-else></div>
        </div>

        <!-- ③ 卡片底部：元信息均布 + 操作 -->
        <div class="card-footer">
          <div class="footer-meta">
            <span class="meta-item">
              <el-icon><Calendar /></el-icon>{{ formatDate(record.gmtCreated) }}
            </span>
            <span class="meta-divider"></span>
            <span class="meta-item" v-if="record.sourceType === 'URL_IMPORT' && record.sourceUrl">
              <el-icon><Link /></el-icon>{{ truncateUrl(record.sourceUrl) }}
            </span>
            <span class="meta-item" v-else>
              <el-icon><Document /></el-icon>本地文件
            </span>
          </div>
          <div class="footer-actions" @click.stop>
            <button
              v-if="record.status === 'COMPLETED' && record.hasResult"
              class="icon-btn primary" title="查看分析"
              @click.stop="viewResult(record)"
            ><el-icon><View /></el-icon></button>
            <div class="more-menu">
              <button class="icon-btn" @click.stop="toggleMenu(record.id)"><el-icon><MoreFilled /></el-icon></button>
              <Transition name="dropdown">
                <div class="dropdown-panel" v-if="openMenuId === record.id">
                  <button class="dd-item" @click.stop="handleRename(record)"><el-icon><Edit /></el-icon>重命名</button>
                  <button class="dd-item" v-if="record.status === 'FAILED' || record.status === 'CANCELLED'" @click.stop="handleReanalyze(record)"><el-icon><RefreshRight /></el-icon>重新分析</button>
                  <button class="dd-item" v-if="['PENDING','PROCESSING','DOWNLOADING'].includes(record.status)" @click.stop="handleCancel(record)"><el-icon><Close /></el-icon>取消任务</button>
                  <div class="dd-divider"></div>
                  <button class="dd-item danger" @click.stop="handleDelete(record)"><el-icon><Delete /></el-icon>删除</button>
                </div>
              </Transition>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 空状态 -->
    <div class="empty-state" v-if="!loading && records.length === 0">
      <div class="empty-icon"><el-icon :size="36"><FolderOpened /></el-icon></div>
      <h3>{{ hasActiveFilters ? '未找到匹配的记录' : '暂无记录' }}</h3>
      <p>{{ hasActiveFilters ? '尝试调整筛选条件或清除搜索关键词' : '点击"新建分析任务"开始你的第一次舆情分析' }}</p>
      <button v-if="hasActiveFilters" class="ctrl-btn" @click="clearAllFilters">
        <el-icon><RefreshRight /></el-icon>清除筛选
      </button>
      <button v-else class="ctrl-btn primary" @click="showNewTaskModal = true">
        <el-icon><Plus /></el-icon>新建分析任务
      </button>
    </div>

    <!-- 加载 -->
    <div class="loading-state" v-if="loading">
      <el-icon class="rotating" :size="28"><Loading /></el-icon>
      <span>加载中...</span>
    </div>

    <!-- 分页 -->
    <div class="pagination-wrapper" v-if="totalRecords > pageSize">
      <div class="neu-pagination">
        <button class="page-btn" :disabled="currentPage <= 1" @click="currentPage--; loadRecords()"><el-icon><ArrowLeft /></el-icon></button>
        <span class="page-info">{{ currentPage }} / {{ totalPages }}</span>
        <button class="page-btn" :disabled="currentPage >= totalPages" @click="currentPage++; loadRecords()"><el-icon><ArrowRight /></el-icon></button>
      </div>
    </div>

    <!-- 重命名弹窗 -->
    <Teleport to="body">
      <Transition name="modal-fade">
        <div class="neu-overlay" v-if="renameState.visible" @click.self="renameState.visible = false">
          <div class="neu-modal">
            <h3 class="modal-title">重命名</h3>
            <input v-model="renameState.title" class="neu-input" placeholder="请输入新标题" maxlength="200" @keyup.enter="confirmRename" />
            <div class="modal-footer">
              <button class="ctrl-btn" @click="renameState.visible = false">取消</button>
              <button class="ctrl-btn primary" @click="confirmRename" :disabled="!renameState.title.trim()">确定</button>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>

    <!-- 删除确认 -->
    <Teleport to="body">
      <Transition name="modal-fade">
        <div class="neu-overlay" v-if="deleteState.visible" @click.self="deleteState.visible = false">
          <div class="neu-modal">
            <div class="confirm-header">
              <div class="confirm-icon"><el-icon><Warning /></el-icon></div>
              <h3 class="modal-title">{{ deleteState.isBatch ? `批量删除 ${deleteState.count} 条` : '确认删除' }}</h3>
            </div>
            <p class="confirm-desc">{{ deleteState.isBatch ? `将删除选中的 ${deleteState.count} 条记录，此操作不可恢复。` : `删除后将无法恢复，确定要删除「${deleteState.title}」吗？` }}</p>
            <div class="modal-footer">
              <button class="ctrl-btn" @click="deleteState.visible = false">取消</button>
              <button class="ctrl-btn danger" @click="confirmDelete" :disabled="deleteState.loading">{{ deleteState.loading ? '删除中...' : '删除' }}</button>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>

    <NewTaskModal v-model:visible="showNewTaskModal" @success="loadRecords" />
  </div>
</template>
<script setup lang="ts">
import { ref, reactive, computed, onMounted, onUnmounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { getTaskList, cancelTask, deleteVideo, renameVideo, createAnalysisTask, retryTask } from '@/api'
import { useWebSocket } from '@/composables/useWebSocket'
import { useWebSocketStore } from '@/stores/websocket'
import { formatDate, formatDuration, TASK_STATUS_TEXT, RISK_LEVEL_TEXT } from '@/types'
import type { AnalysisTaskVO, TaskStatus, RiskLevel } from '@/types'
import NewTaskModal from '@/components/NewTaskModal.vue'
import NeuSelect from '@/components/NeuSelect.vue'

const router = useRouter()
const wsStore = useWebSocketStore()
const showNewTaskModal = ref(false)

// 列表数据
const records = ref<AnalysisTaskVO[]>([])
const loading = ref(false)
const totalRecords = ref(0)
const currentPage = ref(1)
const pageSize = ref(12)
const activeStatus = ref<string>('')
const sourceFilter = ref<string>('')
const riskFilter = ref<string>('')
const searchKeyword = ref('')
const openMenuId = ref<string | null>(null)

// 批量管理
const batchMode = ref(false)
const selectedIds = reactive(new Set<string>())

const totalPages = computed(() => Math.ceil(totalRecords.value / pageSize.value))
const hasActiveFilters = computed(() => !!(activeStatus.value || sourceFilter.value || riskFilter.value || searchKeyword.value.trim()))

const clearAllFilters = () => {
  activeStatus.value = ''
  sourceFilter.value = ''
  riskFilter.value = ''
  searchKeyword.value = ''
  currentPage.value = 1
  loadRecords()
}

const statusFilters = [
  { label: '全部', value: '' },
  { label: '下载中', value: 'DOWNLOADING' },
  { label: '排队中', value: 'PENDING' },
  { label: '分析中', value: 'PROCESSING' },
  { label: '已完成', value: 'COMPLETED' },
  { label: '失败', value: 'FAILED' }
]

const sourceOptions = [
  { label: '全部来源', value: '' },
  { label: '本地导入', value: 'LOCAL_UPLOAD' },
  { label: '链接采集', value: 'URL_IMPORT' }
]

const riskOptions = [
  { label: '全部风险', value: '' },
  { label: '高风险', value: 'HIGH' },
  { label: '中风险', value: 'MEDIUM' },
  { label: '低风险', value: 'LOW' }
]

const renameState = reactive({ visible: false, videoId: '', title: '' })
const deleteState = reactive({ visible: false, videoId: '', title: '', isBatch: false, count: 0, ids: [] as string[], loading: false })

const loadRecords = async () => {
  loading.value = true
  try {
    await fetchAndApplyRecords()
  } finally {
    loading.value = false
  }
}

// 静默刷新：不触发 loading 遮罩，用于 WebSocket 完成/失败事件后的数据同步
const loadRecordsSilent = async () => {
  try {
    await fetchAndApplyRecords()
  } catch (_) { /* 静默 */ }
}

const fetchAndApplyRecords = async () => {
  const status = activeStatus.value || undefined
  const res = await getTaskList(
    currentPage.value, pageSize.value,
    status as TaskStatus | undefined,
    riskFilter.value || undefined,
    'gmtCreated', 'desc'
  )
  if (res.code === 200) {
    let list = res.data.records || []
    let total = res.data.total || 0

    // 前端来源筛选（后端暂不支持 sourceType 参数）
    if (sourceFilter.value) {
      list = list.filter((r: AnalysisTaskVO) => r.sourceType === sourceFilter.value)
      total = list.length
    }
    // 关键词搜索
    if (searchKeyword.value.trim()) {
      const kw = searchKeyword.value.trim().toLowerCase()
      list = list.filter((r: AnalysisTaskVO) =>
        (r.videoTitle || '').toLowerCase().includes(kw) ||
        (r.universityName || '').toLowerCase().includes(kw) ||
        (r.keywords || []).some((k: string) => k.toLowerCase().includes(kw))
      )
      total = list.length
    }
    // 防御性去重：按 videoId 去重，保留最新一条（列表已按 gmtCreated desc 排序）
    const seen = new Set<string>()
    records.value = list.filter((r: AnalysisTaskVO) => {
      if (seen.has(r.videoId)) return false
      seen.add(r.videoId)
      return true
    })
    totalRecords.value = total
  }
}

let searchTimer: ReturnType<typeof setTimeout> | null = null
const debouncedSearch = () => {
  if (searchTimer) clearTimeout(searchTimer)
  searchTimer = setTimeout(() => { currentPage.value = 1; loadRecords() }, 300)
}

watch([activeStatus, sourceFilter, riskFilter], () => { currentPage.value = 1; loadRecords() })

const getStatusClass = (status: string) => ({
  DOWNLOADING: 'status-downloading', PENDING: 'status-pending',
  PROCESSING: 'status-processing', COMPLETED: 'status-completed',
  FAILED: 'status-failed', CANCELLED: 'status-cancelled'
}[status] || 'status-pending')

const getStatusText = (status: string) => TASK_STATUS_TEXT[status as TaskStatus] || status
const getRiskText = (level: string | null | undefined) => level ? (RISK_LEVEL_TEXT[level as RiskLevel] || level) : ''

const truncateUrl = (url: string | null | undefined) => {
  if (!url) return ''
  try {
    const u = new URL(url)
    const path = u.pathname.length > 18 ? u.pathname.substring(0, 18) + '…' : u.pathname
    return u.hostname + path
  } catch { return url.length > 30 ? url.substring(0, 30) + '…' : url }
}

// 批量管理
const toggleBatchMode = () => {
  batchMode.value = !batchMode.value
  if (!batchMode.value) selectedIds.clear()
}
const toggleSelect = (id: string) => {
  if (selectedIds.has(id)) selectedIds.delete(id)
  else selectedIds.add(id)
}

const handleCardClick = (record: AnalysisTaskVO) => {
  if (batchMode.value) { toggleSelect(record.id); return }
  if (record.status === 'COMPLETED' && record.hasResult && record.resultId) {
    router.push({ path: '/analysis', query: { resultId: record.resultId } })
  } else if (record.status === 'DOWNLOADING') {
    ElMessage.info('视频正在下载中，请稍候...')
  } else if (record.status === 'CANCELLED') {
    ElMessage.warning('该任务已取消，可点击"更多操作"重新分析')
  }
}

const viewResult = (record: AnalysisTaskVO) => {
  if (record.resultId) {
    router.push({ path: '/analysis', query: { resultId: record.resultId } })
  }
}

const toggleMenu = (id: string) => { openMenuId.value = openMenuId.value === id ? null : id }
const handleClickOutside = () => { openMenuId.value = null }

const handleRename = (record: AnalysisTaskVO) => {
  openMenuId.value = null
  renameState.videoId = record.videoId
  renameState.title = record.videoTitle || ''
  renameState.visible = true
}
const confirmRename = async () => {
  if (!renameState.title.trim()) return
  try {
    const res = await renameVideo(renameState.videoId, renameState.title.trim())
    if (res.code === 200) { ElMessage.success('重命名成功'); renameState.visible = false; loadRecords() }
    else ElMessage.error(res.message || '重命名失败')
  } catch (e: any) { ElMessage.error(e.message || '重命名失败') }
}

const handleReanalyze = async (record: AnalysisTaskVO) => {
  openMenuId.value = null
  try {
    const res = await retryTask(record.id)
    if (res.code === 200) { ElMessage.success('重新分析任务已提交'); loadRecords() }
    else ElMessage.error(res.message || '提交失败')
  } catch (e: any) { ElMessage.error(e.message || '提交失败') }
}

const handleCancel = async (record: AnalysisTaskVO) => {
  openMenuId.value = null
  // 乐观更新：立即通知顶部横幅减计数，不等接口返回
  wsStore.notifyTaskChanged()
  // 原地更新卡片状态，避免闪烁
  const r = records.value.find(r => r.id === record.id)
  if (r) r.status = 'CANCELLED' as any
  try {
    const res = await cancelTask(record.id)
    if (res.code === 200) {
      ElMessage.success('任务已取消')
      loadRecordsSilent()
    } else {
      // 接口失败时回滚状态
      if (r) r.status = record.status
      wsStore.notifyTaskChanged()
      ElMessage.error(res.message || '取消失败')
    }
  } catch (e: any) {
    if (r) r.status = record.status
    wsStore.notifyTaskChanged()
    ElMessage.error(e.message || '取消失败')
  }
}

const handleDelete = (record: AnalysisTaskVO) => {
  openMenuId.value = null
  Object.assign(deleteState, { visible: true, videoId: record.videoId, title: record.videoTitle || '未命名', isBatch: false, count: 0, ids: [] })
}

const handleBatchDelete = () => {
  if (selectedIds.size === 0) return
  Object.assign(deleteState, { visible: true, isBatch: true, count: selectedIds.size, ids: [...selectedIds], videoId: '', title: '' })
}

const handleBatchExport = () => {
  if (selectedIds.size === 0) return
  ElMessage.info(`导出 ${selectedIds.size} 条记录的报告（功能开发中）`)
}

const confirmDelete = async () => {
  // 防止重复提交
  if (deleteState.loading) return
  deleteState.loading = true

  try {
    if (deleteState.isBatch) {
      // 批量删除：乐观UI先移除，再并发请求
      const idsToDelete = [...deleteState.ids]
      const videoIdsToDelete = idsToDelete.map(id => records.value.find(r => r.id === id)?.videoId).filter(Boolean) as string[]
      // 先关闭弹窗，再乐观移除
      deleteState.visible = false
      records.value = records.value.filter(r => !idsToDelete.includes(r.id))
      totalRecords.value = Math.max(0, totalRecords.value - idsToDelete.length)
      selectedIds.clear()
      ElMessage.success(`已删除 ${idsToDelete.length} 条记录`)
      // 后台执行实际删除
      await Promise.all(videoIdsToDelete.map(vid => deleteVideo(vid)))
      wsStore.notifyTaskChanged()
      loadRecords()
    } else {
      const videoId = deleteState.videoId
      // 先关闭弹窗（同步，立即生效）
      deleteState.visible = false
      // 乐观UI：立即从列表移除
      records.value = records.value.filter(r => r.videoId !== videoId)
      totalRecords.value = Math.max(0, totalRecords.value - 1)
      ElMessage.success('删除成功')
      // 后台执行实际删除
      try {
        const res = await deleteVideo(videoId)
        if (res.code !== 200) {
          // 后端报错：回滚需要重新拉取列表
          ElMessage.error(res.message || '删除失败')
        } else {
          wsStore.notifyTaskChanged()
        }
      } catch (e: any) {
        ElMessage.error(e.message || '删除失败')
      }
      loadRecords()
    }
  } finally {
    deleteState.loading = false
  }
}

const { subscribeProgress, subscribeCompleted, subscribeFailed } = useWebSocket()

// 增量更新：收到进度推送时，只原地修改对应 record 的 status/progress
// 严禁调用 loadRecords()，避免全量请求导致闪烁
subscribeProgress((data) => {
  const record = records.value.find(r => r.videoId === data.videoId)
  if (record) {
    record.status = data.status
    record.progress = data.progress
  }
})

// 任务完成：原地更新状态，然后做一次轻量刷新（需要拿到 resultId/hasResult）
subscribeCompleted((data) => {
  const record = records.value.find(r => r.videoId === data.videoId)
  if (record) {
    record.status = 'COMPLETED'
    record.progress = 100
    record.hasResult = true
    record.resultId = data.resultId
  }
  // 后台静默刷新，不触发 loading，确保数据完整性
  loadRecordsSilent()
})

// 任务失败：原地更新状态
subscribeFailed((data) => {
  const record = records.value.find(r => r.videoId === data.videoId)
  if (record) {
    record.status = 'FAILED'
    record.progress = 0
  }
})

onMounted(() => { loadRecords(); document.addEventListener('click', handleClickOutside) })
onUnmounted(() => { document.removeEventListener('click', handleClickOutside); if (searchTimer) clearTimeout(searchTimer) })
</script>

<style scoped lang="scss">
// ── 设计令牌 ──────────────────────────────────────
$bg:     #edf2f0;
$neu-1:  #ecf0f3;
$neu-2:  #c8d0e7;   // 加深阴影色，增强对比
$white:  #ffffff;
$gray:   #8a9bb0;
$black:  #1a1f2e;
$purple: #4b70e2;
$purple-light: #7c9df7;

// 阴影系统（三档）
$shadow-sm:  4px 4px 10px $neu-2, -4px -4px 10px $white;
$shadow-md:  8px 8px 18px $neu-2, -8px -8px 18px $white;
$shadow-lg:  12px 12px 28px darken($neu-2, 8%), -12px -12px 28px $white;
$shadow-in:  inset 3px 3px 7px $neu-2, inset -3px -3px 7px $white;

// ── 布局 ──────────────────────────────────────────
.records-center { max-width: 1280px; margin: 0 auto; }

// ── 页面头部 ──────────────────────────────────────
.page-header {
  display: flex; align-items: center; justify-content: space-between; margin-bottom: 22px;
  .header-left { display: flex; align-items: baseline; gap: 12px; }
  .page-title { font-size: 22px; font-weight: 700; color: $black; margin: 0; letter-spacing: -.3px; }
  .record-count { font-size: 13px; color: $gray; }
  .header-actions { display: flex; gap: 10px; align-items: center; }
}

// ── 通用控件按钮（高对比度） ──────────────────────
.ctrl-btn {
  display: inline-flex; align-items: center; gap: 7px;
  padding: 9px 18px; border-radius: 11px;
  font-size: 13px; font-weight: 600; font-family: 'Montserrat', sans-serif;
  cursor: pointer; transition: all .25s cubic-bezier(.4,0,.2,1);
  // 线性渐变：光感从左上角射入
  background: linear-gradient(145deg, #ffffff, #dcdcdc);
  // 深蓝灰文字，提升对比度
  color: #4d5d7d;
  letter-spacing: 0.5px;
  // 环境色阴影（清透有水分感）
  box-shadow: 4px 4px 8px #c8d0e7, -4px -4px 8px #ffffff;
  // 轮廓光：白边划出轮廓
  border: 1.5px solid rgba(255, 255, 255, 0.8);

  // 图标发光
  .el-icon { filter: drop-shadow(0 0 1px rgba(0,0,0,0.1)); }

  &:hover {
    color: $black;
    box-shadow: 3px 3px 6px #c8d0e7, -3px -3px 6px #ffffff;
    transform: translateY(-1px);
  }
  &:active { box-shadow: $shadow-in; transform: none; }

  &.primary {
    background: linear-gradient(135deg, $purple 0%, $purple-light 100%);
    color: #fff; letter-spacing: 0.5px;
    border: 1.5px solid rgba(255, 255, 255, 0.35);
    box-shadow: 5px 5px 14px rgba($purple,.35), -3px -3px 8px $white;
    &:hover { box-shadow: 6px 6px 18px rgba($purple,.45), -3px -3px 8px $white; transform: translateY(-1px); }
    &:disabled { opacity: .5; cursor: not-allowed; transform: none; }
  }
  // 批量管理按钮激活态：偏向淡蓝白，功能上区别于筛选框
  &.active {
    background: linear-gradient(145deg, #eef3ff, #d6e0f8);
    color: $purple;
    border: 1.5px solid rgba($purple, 0.2);
    box-shadow: $shadow-in;
  }
  &.danger { color: #e74c3c; &:hover { background: linear-gradient(145deg, #fff5f5, #f5d5d5); } }
  &.sm { padding: 7px 14px; font-size: 12px; border-radius: 9px; }
}

// ── 批量操作栏 ────────────────────────────────────
.batch-bar {
  display: flex; align-items: center; gap: 14px; padding: 12px 20px;
  // 淡蓝白渐变，区别于普通筛选区
  background: linear-gradient(145deg, #f0f4ff, #dce5f8);
  border-radius: 14px; margin-bottom: 16px;
  box-shadow: 4px 4px 8px #c8d0e7, -4px -4px 8px #ffffff;
  border: 1.5px solid rgba(255, 255, 255, 0.8);
  .batch-count { font-size: 13px; color: #4d5d7d; letter-spacing: 0.3px; strong { color: $purple; } }
  .batch-actions { display: flex; gap: 10px; margin-left: auto; }
  .batch-clear { background: none; border: none; font-size: 12px; color: $gray; cursor: pointer; font-family: 'Montserrat', sans-serif; &:hover { color: $black; } }
}

// ── 筛选工具栏 ────────────────────────────────────
.filter-bar {
  display: flex; align-items: center; justify-content: space-between;
  margin-bottom: 24px; gap: 14px; flex-wrap: wrap;
  .filter-chips { display: flex; gap: 8px; flex-wrap: wrap; }
  .filter-right { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; }
}

.filter-chip {
  padding: 6px 15px; border-radius: 20px; font-size: 12px; font-weight: 600;
  // 线性渐变背景
  background: linear-gradient(145deg, #ffffff, #dcdcdc);
  color: #4d5d7d; letter-spacing: 0.5px;
  cursor: pointer; font-family: 'Montserrat', sans-serif;
  // 环境色阴影 + 轮廓光
  box-shadow: 4px 4px 8px #c8d0e7, -4px -4px 8px #ffffff;
  border: 1.5px solid rgba(255, 255, 255, 0.8);
  transition: all .25s;
  // 图标发光
  .el-icon { filter: drop-shadow(0 0 1px rgba(0,0,0,0.1)); }
  &:hover { color: $purple; transform: translateY(-1px); filter: drop-shadow(0 2px 5px rgba(100,130,200,0.15)); }
  &.active {
    background: linear-gradient(135deg, $purple, $purple-light); color: #fff;
    border: 1.5px solid rgba(255, 255, 255, 0.35);
    box-shadow: 3px 3px 8px rgba($purple,.3), -2px -2px 6px $white;
    letter-spacing: 0.5px;
  }
}

// 搜索框
.search-box {
  position: relative; display: flex; align-items: center;
  // 线性渐变背景
  background: linear-gradient(145deg, #ffffff, #dcdcdc);
  border-radius: 20px;
  // 环境色阴影 + 轮廓光
  box-shadow: 4px 4px 8px #c8d0e7, -4px -4px 8px #ffffff;
  border: 1.5px solid rgba(255, 255, 255, 0.8);
  transition: box-shadow .25s;
  &:focus-within {
    box-shadow: $shadow-in;
    border-color: rgba($purple, 0.3);
  }
  .search-icon {
    position: absolute; left: 13px; color: #4d5d7d; font-size: 13px;
    pointer-events: none;
    filter: drop-shadow(0 0 1px rgba(0,0,0,0.1));
  }
  .search-input {
    width: 220px; padding: 8px 32px 8px 36px; font-size: 12px; font-weight: 500;
    color: #4d5d7d; letter-spacing: 0.3px;
    background: transparent; border: none; border-radius: 20px; outline: none;
    font-family: 'Montserrat', sans-serif;
    &::placeholder { color: $gray; }
  }
  .search-clear {
    position: absolute; right: 10px; background: none; border: none; cursor: pointer;
    color: $gray; font-size: 12px; display: flex; align-items: center;
    &:hover { color: $black; }
  }
}

// ── 卡片网格 ──────────────────────────────────────
.records-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 20px;
}

.record-card {
  background: $neu-1; border-radius: 18px; overflow: visible;
  display: flex; flex-direction: column; cursor: pointer; position: relative;
  // 深度三层阴影
  box-shadow:
    10px 10px 22px darken($neu-2, 6%),
    -10px -10px 22px $white,
    0 2px 6px rgba(0,0,0,.06);
  transition:
    box-shadow .35s cubic-bezier(.4,0,.2,1),
    transform .35s cubic-bezier(.34,1.56,.64,1);

  &:hover {
    box-shadow:
      16px 16px 36px darken($neu-2, 10%),
      -16px -16px 36px $white,
      0 12px 28px rgba($purple,.1);
    transform: translateY(-6px);
    .footer-actions { opacity: 1; }
  }

  &.is-selected {
    box-shadow: $shadow-in, 0 0 0 2.5px rgba($purple,.4);
    transform: none;
  }
  &.is-failed { opacity: .8; }
}

// 批量勾选
.card-checkbox {
  position: absolute; top: 10px; left: 10px; z-index: 10;
  .checkbox-inner {
    width: 22px; height: 22px; border-radius: 7px;
    background: $neu-1; box-shadow: $shadow-sm;
    display: flex; align-items: center; justify-content: center;
    transition: all .2s; cursor: pointer;
    &.checked {
      background: linear-gradient(135deg, $purple, $purple-light);
      box-shadow: 3px 3px 8px rgba($purple,.35);
      color: #fff; font-size: 12px;
    }
  }
}

// ① 封面区 16:9
.card-cover {
  position: relative; width: 100%; padding-top: 56.25%; // 16:9
  border-radius: 18px 18px 0 0; overflow: hidden;
  background: linear-gradient(135deg, #dde3ec, #c8d0e0);
  // 内凹感
  box-shadow: inset 0 2px 8px rgba(0,0,0,.08);

  .cover-img {
    position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; display: block;
  }
  .cover-placeholder {
    position: absolute; inset: 0; display: flex; flex-direction: column;
    align-items: center; justify-content: center; gap: 6px;
    color: $gray; font-size: 11px; font-weight: 500;
    background: linear-gradient(145deg, #d8dfe8, #e8edf4);
    box-shadow: inset 4px 4px 10px rgba(0,0,0,.1), inset -4px -4px 10px rgba(255,255,255,.7);
    .el-icon { opacity: .4; }
  }
  .cover-duration {
    position: absolute; bottom: 8px; right: 8px;
    background: rgba(0,0,0,.7); color: #fff;
    font-size: 10px; font-weight: 600; padding: 2px 7px; border-radius: 5px;
  }
  .cover-source {
    position: absolute; top: 8px; right: 8px; width: 24px; height: 24px; border-radius: 6px;
    display: flex; align-items: center; justify-content: center; font-size: 11px;
    &.local { background: rgba($purple,.85); color: #fff; }
    &.url { background: rgba(#1890ff,.85); color: #fff; }
  }
  .cover-progress-mask {
    position: absolute; inset: 0; background: rgba(0,0,0,.55);
    display: flex; flex-direction: column; align-items: center; justify-content: flex-end;
    padding-bottom: 14px; gap: 6px;
    .mask-progress-bar {
      position: absolute; bottom: 0; left: 0; height: 3px;
      background: linear-gradient(90deg, $purple, $purple-light);
      transition: width .5s ease;
    }
    .mask-label { font-size: 11px; color: rgba(255,255,255,.9); font-weight: 600; }
  }
}

// ② 卡片主体
.card-body {
  padding: 14px 16px 10px; flex: 1; display: flex; flex-direction: column; gap: 8px;
}

.card-title-row {
  display: flex; align-items: flex-start; gap: 8px;
  .card-title {
    flex: 1; font-size: 14px; font-weight: 700; color: $black; margin: 0; line-height: 1.4;
    display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden;
  }
}

// 风险 Badge（回归小按钮样式）
.risk-badge {
  flex-shrink: 0; padding: 3px 9px; border-radius: 20px;
  font-size: 11px; font-weight: 700; white-space: nowrap;
  &.risk-high {
    background: linear-gradient(135deg, #ff6b6b, #e74c3c);
    color: #fff; box-shadow: 2px 2px 6px rgba(#e74c3c,.35);
  }
  &.risk-medium {
    background: linear-gradient(135deg, #ffa94d, #e67e22);
    color: #fff; box-shadow: 2px 2px 6px rgba(#e67e22,.35);
  }
  &.risk-low {
    background: linear-gradient(135deg, #69db7c, #2ecc71);
    color: #fff; box-shadow: 2px 2px 6px rgba(#2ecc71,.35);
  }
}

// 状态 Pill（非完成状态）
.status-pill {
  flex-shrink: 0; padding: 3px 9px; border-radius: 20px;
  font-size: 11px; font-weight: 600; white-space: nowrap;
  &.status-downloading { background: rgba(#1890ff,.12); color: #1890ff; }
  &.status-pending { background: rgba(#1890ff,.12); color: #1890ff; }
  &.status-processing { background: rgba(#e6a23c,.12); color: #c87d00; }
  &.status-failed { background: rgba(#e74c3c,.12); color: #e74c3c; }
  &.status-cancelled { background: rgba($gray,.12); color: $gray; }
}

// 内容标签
.card-tags {
  display: flex; align-items: center; gap: 5px; flex-wrap: wrap; min-height: 22px;
  .tag {
    padding: 2px 8px; border-radius: 4px; font-size: 11px; font-weight: 500;
    &.kw { background: rgba($purple,.08); color: darken($purple,5%); border: 1px solid rgba($purple,.15); }
    &.uni { display: inline-flex; align-items: center; gap: 3px; background: rgba(#e6a23c,.1); color: #9a6200; border: 1px solid rgba(#e6a23c,.2); .el-icon { font-size: 11px; } }
    &.topic { background: rgba(#2ecc71,.08); color: #1a7a40; border: 1px solid rgba(#2ecc71,.2); }
    &.error { background: rgba(#e74c3c,.08); color: #c0392b; border: 1px solid rgba(#e74c3c,.15); font-size: 10px; }
  }
}
.card-tags-placeholder { min-height: 22px; }

// ③ 卡片底部
.card-footer {
  display: flex; align-items: center; justify-content: space-between;
  padding: 10px 16px 14px;
  border-top: 1px solid rgba($neu-2,.6);
  margin-top: auto;
}

.footer-meta {
  display: flex; align-items: center; gap: 0; flex: 1; min-width: 0;
  .meta-item {
    display: inline-flex; align-items: center; gap: 4px;
    font-size: 11px; color: $gray; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
    .el-icon { font-size: 11px; flex-shrink: 0; }
  }
  .meta-divider {
    width: 1px; height: 12px; background: rgba($neu-2,.8); margin: 0 8px; flex-shrink: 0;
  }
}

.footer-actions {
  display: flex; align-items: center; gap: 6px; opacity: 0; transition: opacity .25s; flex-shrink: 0;
}

.icon-btn {
  width: 30px; height: 30px; border: none; border-radius: 8px; background: $neu-1;
  box-shadow: 3px 3px 7px $neu-2, -3px -3px 7px $white;
  cursor: pointer; display: flex; align-items: center; justify-content: center;
  color: $gray; font-size: 14px; transition: all .25s;
  &:hover { color: $purple; box-shadow: 2px 2px 5px $neu-2, -2px -2px 5px $white; }
  &.primary { color: $purple; }
}

// 更多菜单（完全自定义，无原生样式）
.more-menu { position: relative; }
.dropdown-panel {
  position: absolute; right: 0; bottom: 38px; min-width: 150px;
  background: $neu-1; border-radius: 14px; padding: 6px;
  box-shadow:
    10px 10px 24px darken($neu-2, 8%),
    -10px -10px 24px $white,
    0 4px 16px rgba(0,0,0,.1);
  z-index: 200;
}
.dd-item {
  display: flex; align-items: center; gap: 10px; width: 100%; padding: 9px 13px;
  border: none; border-radius: 9px; background: transparent; color: $black;
  font-size: 13px; font-family: 'Montserrat', sans-serif; cursor: pointer; transition: all .2s;
  .el-icon { font-size: 14px; color: $gray; }
  &:hover { background: $neu-1; box-shadow: $shadow-in; .el-icon { color: $purple; } }
  &.danger { color: #e74c3c; .el-icon { color: #e74c3c; } &:hover { background: rgba(#e74c3c,.06); box-shadow: none; } }
}
.dd-divider { height: 1px; background: rgba($neu-2,.7); margin: 4px 8px; }

// ── 空/加载状态 ───────────────────────────────────
.empty-state {
  text-align: center; padding: 70px 20px;
  .empty-icon {
    width: 76px; height: 76px; border-radius: 50%; background: $neu-1;
    box-shadow: $shadow-md; display: flex; align-items: center; justify-content: center;
    color: $gray; margin: 0 auto 20px;
  }
  h3 { font-size: 16px; color: $black; margin: 0 0 8px; font-weight: 700; }
  p { font-size: 13px; color: $gray; margin: 0 0 24px; }
}
.loading-state {
  display: flex; align-items: center; justify-content: center; gap: 12px;
  padding: 70px 20px; color: $gray; font-size: 14px;
}

// ── 分页 ──────────────────────────────────────────
.pagination-wrapper { display: flex; justify-content: center; margin-top: 28px; }
.neu-pagination {
  display: flex; align-items: center; gap: 16px;
  .page-btn {
    width: 38px; height: 38px; border: none; border-radius: 11px; background: $neu-1;
    box-shadow: $shadow-sm; cursor: pointer; display: flex; align-items: center; justify-content: center;
    color: $gray; transition: all .25s;
    &:hover:not(:disabled) { color: $purple; box-shadow: 3px 3px 7px $neu-2, -3px -3px 7px $white; }
    &:disabled { opacity: .4; cursor: not-allowed; }
  }
  .page-info { font-size: 13px; color: $black; font-weight: 600; }
}

// ── 模态框 ────────────────────────────────────────
.neu-overlay {
  position: fixed; inset: 0; background: rgba(0,0,0,.28); backdrop-filter: blur(5px);
  z-index: 2000; display: flex; align-items: center; justify-content: center;
}
.neu-modal {
  background: $neu-1; border-radius: 20px; padding: 28px; width: 380px; max-width: 90vw;
  box-shadow: $shadow-lg;
  .modal-title { font-size: 17px; font-weight: 700; color: $black; margin: 0 0 16px; }
  .modal-footer { display: flex; justify-content: flex-end; gap: 12px; margin-top: 20px; }
}
.neu-input {
  width: 100%; padding: 12px 16px; font-size: 13px; color: $black; background: $neu-1;
  border: none; border-radius: 11px; box-shadow: $shadow-in; outline: none;
  font-family: 'Montserrat', sans-serif; transition: all .25s;
  &:focus { box-shadow: inset 4px 4px 9px $neu-2, inset -4px -4px 9px $white; }
  &::placeholder { color: $gray; }
}
.confirm-header {
  display: flex; align-items: center; gap: 12px; margin-bottom: 12px;
  .confirm-icon {
    width: 42px; height: 42px; border-radius: 11px; display: flex; align-items: center; justify-content: center;
    font-size: 20px; background: linear-gradient(135deg, #ff6b6b, #e74c3c); color: #fff;
    box-shadow: 4px 4px 12px rgba(#e74c3c,.35);
  }
}
.confirm-desc { font-size: 13px; color: $gray; margin: 0; line-height: 1.6; }

// ── 动画 ──────────────────────────────────────────
.rotating { animation: rotate 1s linear infinite; }
@keyframes rotate { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }

.slide-down-enter-active { animation: slide-down-in .25s cubic-bezier(.34,1.56,.64,1); }
.slide-down-leave-active { animation: slide-down-out .15s ease; }
@keyframes slide-down-in { from { opacity: 0; transform: translateY(-12px); } to { opacity: 1; transform: translateY(0); } }
@keyframes slide-down-out { from { opacity: 1; } to { opacity: 0; transform: translateY(-8px); } }

.modal-fade-enter-active { transition: opacity .2s ease; .neu-modal { transition: transform .2s cubic-bezier(.34,1.56,.64,1), opacity .2s ease; } }
.modal-fade-leave-active { transition: opacity .15s ease; .neu-modal { transition: transform .15s ease, opacity .15s ease; } }
.modal-fade-enter-from { opacity: 0; .neu-modal { transform: scale(.88); opacity: 0; } }
.modal-fade-leave-to { opacity: 0; .neu-modal { transform: scale(.95); opacity: 0; } }

.dropdown-enter-active { animation: dd-in .2s cubic-bezier(.34,1.56,.64,1); }
.dropdown-leave-active { animation: dd-out .15s ease; }
@keyframes dd-in { from { opacity: 0; transform: translateY(8px) scale(.95); } to { opacity: 1; transform: translateY(0) scale(1); } }
@keyframes dd-out { from { opacity: 1; } to { opacity: 0; transform: translateY(4px); } }
</style>
