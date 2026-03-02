<template>
  <div class="favorites-page">

    <!-- 页面头部 -->
    <div class="page-header">
      <div class="header-left">
        <h1 class="page-title">我的收藏</h1>
        <span class="record-count">共 {{ totalRecords }} 条</span>
      </div>
      <div class="header-actions">
        <!-- 视图切换 -->
        <div class="view-switcher" ref="viewSwitcherRef">
          <button class="ctrl-btn" :class="{ active: viewMenuOpen }" @click.stop="viewMenuOpen = !viewMenuOpen">
            <el-icon v-if="viewMode === 'card'"><Grid /></el-icon>
            <el-icon v-else><List /></el-icon>
            视图
          </button>
          <Transition name="dropdown">
            <div class="view-dropdown" v-if="viewMenuOpen" @click.stop>
              <button class="view-option" :class="{ active: viewMode === 'card' }" @click="setViewMode('card')">
                <el-icon><Grid /></el-icon><span>卡片模式</span>
                <el-icon class="check-icon" v-if="viewMode === 'card'"><Check /></el-icon>
              </button>
              <button class="view-option" :class="{ active: viewMode === 'list' }" @click="setViewMode('list')">
                <el-icon><List /></el-icon><span>列表模式</span>
                <el-icon class="check-icon" v-if="viewMode === 'list'"><Check /></el-icon>
              </button>
            </div>
          </Transition>
        </div>
        <!-- 筛选工具 -->
        <NeuSelect v-model="sourceFilter" :options="sourceOptions" placeholder="全部来源">
          <template #icon><el-icon><Connection /></el-icon></template>
        </NeuSelect>
        <NeuSelect v-model="riskFilter" :options="riskOptions" placeholder="全部风险">
          <template #icon><el-icon><Warning /></el-icon></template>
        </NeuSelect>
        <NeuSelect v-model="sortOrder" :options="sortOptions" placeholder="排序">
          <template #icon><el-icon><DCaret /></el-icon></template>
        </NeuSelect>
        <div class="search-box">
          <el-icon class="search-icon"><Search /></el-icon>
          <input v-model="searchKeyword" class="search-input" placeholder="搜索标题 / 高校 / 关键词" @input="debouncedSearch" />
          <button v-if="searchKeyword" class="search-clear" @click="searchKeyword = ''; loadRecords()">
            <el-icon><Close /></el-icon>
          </button>
        </div>
      </div>
    </div>

    <!-- 内容区 -->
    <Transition name="view-fade" mode="out-in">
      <div v-if="!loading && records.length > 0" :key="viewMode">
        <CardView
          v-if="viewMode === 'card'"
          :records="records"
          :batch-mode="false"
          :selected-ids="new Set()"
          :open-menu-id="openMenuId"
          :exporting-ids="exportingIds"
          @card-click="handleCardClick"
          @toggle-menu="toggleMenu"
          @preview="handlePreview"
          @rename="handleRename"
          @move-to-folder="handleMoveToFolder"
          @export="handleExport"
          @retry-download="handleRetryDownload"
          @reanalyze="handleReanalyze"
          @cancel="handleCancel"
          @delete="handleDelete"
          @show-tooltip="showTooltip"
          @hide-tooltip="scheduleHideTooltip"
          @favorite-change="handleFavoriteChange"
        />
        <ListView
          v-else
          :records="records"
          :batch-mode="false"
          :selected-ids="new Set()"
          :open-menu-id="openMenuId"
          :exporting-ids="exportingIds"
          @card-click="handleCardClick"
          @toggle-menu="toggleMenu"
          @preview="handlePreview"
          @rename="handleRename"
          @move-to-folder="handleMoveToFolder"
          @export="handleExport"
          @retry-download="handleRetryDownload"
          @reanalyze="handleReanalyze"
          @cancel="handleCancel"
          @delete="handleDelete"
          @show-tooltip="showTooltip"
          @hide-tooltip="scheduleHideTooltip"
          @favorite-change="handleFavoriteChange"
        />
      </div>
    </Transition>

    <!-- 空状态 -->
    <Transition name="empty-fade">
      <div class="empty-state" v-if="!loading && records.length === 0">
        <div class="empty-illustration">
          <div class="star-float">
            <svg viewBox="0 0 80 80" fill="none">
              <polygon points="40,6 48.5,27.5 72,30.5 55,47 59.5,70.5 40,59.5 20.5,70.5 25,47 8,30.5 31.5,27.5"
                fill="rgba(251,191,36,0.18)" stroke="rgba(251,191,36,0.5)" stroke-width="2"/>
            </svg>
          </div>
          <div class="star-float small">
            <svg viewBox="0 0 40 40" fill="none">
              <polygon points="20,3 24.3,13.8 36,15.3 27.5,23.5 29.8,35.2 20,29.8 10.2,35.2 12.5,23.5 4,15.3 15.7,13.8"
                fill="rgba(251,191,36,0.12)" stroke="rgba(251,191,36,0.35)" stroke-width="1.5"/>
            </svg>
          </div>
        </div>
        <h3 class="empty-title">暂无收藏</h3>
        <p class="empty-desc">去记录中心发掘有价值的分析，点击卡片上的星标即可收藏</p>
        <button class="ctrl-btn primary" @click="router.push('/records')">
          <el-icon><List /></el-icon>
          前往记录中心
        </button>
      </div>
    </Transition>

    <!-- 加载 -->
    <div class="loading-state" v-if="loading">
      <el-icon class="rotating" :size="28"><Loading /></el-icon>
      <span>加载中...</span>
    </div>

    <!-- 分页 -->
    <Transition name="pagination-fade">
      <div class="pagination-wrapper" v-if="totalRecords > 12">
        <div class="neu-pagination">
          <button class="page-btn" :disabled="currentPage <= 1" @click="currentPage--; loadRecords()"><el-icon><ArrowLeft /></el-icon></button>
          <span class="page-info">{{ currentPage }} / {{ totalPages }}</span>
          <button class="page-btn" :disabled="currentPage >= totalPages" @click="currentPage++; loadRecords()"><el-icon><ArrowRight /></el-icon></button>
        </div>
        <div class="page-size-select">
          <NeuSelect v-model="pageSizeStr" :options="pageSizeOptions" placeholder="每页条数" />
        </div>
      </div>
    </Transition>

    <!-- 视频预览弹窗 -->
    <VideoPreviewModal
      v-model:visible="previewVisible"
      :video-url="previewVideoUrl"
      :title="previewTitle"
    />

    <!-- 重命名弹窗 -->
    <Teleport to="body">
      <Transition name="modal-fade">
        <div class="neu-overlay" v-if="renameState.visible" @click.self="renameState.visible = false">
          <div class="neu-modal">
            <h3 class="modal-title">重命名</h3>
            <input
              v-model="renameState.title"
              class="neu-input"
              placeholder="请输入新标题"
              maxlength="200"
              @keyup.enter="confirmRename"
            />
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
              <h3 class="modal-title">确认删除</h3>
            </div>
            <p class="confirm-desc">删除后将无法恢复，确定要删除「{{ deleteState.title }}」吗？</p>
            <div class="modal-footer">
              <button class="ctrl-btn" @click="deleteState.visible = false">取消</button>
              <button class="ctrl-btn danger delete-confirm-btn" @click="confirmDelete" :disabled="deleteState.loading">
                {{ deleteState.loading ? '删除中...' : '删除' }}
              </button>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>

    <!-- 移动到文件夹弹窗 -->
    <Teleport to="body">
      <Transition name="modal-fade">
        <div class="neu-overlay" v-if="moveToFolderState.visible" @click.self="moveToFolderState.visible = false">
          <div class="neu-modal">
            <h3 class="modal-title">移动到文件夹</h3>
            <div class="move-folder-list">
              <button
                class="move-folder-option"
                :class="{ active: moveToFolderState.targetFolderId === null }"
                @click="moveToFolderState.targetFolderId = null"
              >📁 未分类</button>
              <button
                v-for="f in folderOptions"
                :key="f.id"
                class="move-folder-option"
                :class="{ active: moveToFolderState.targetFolderId === f.id }"
                :style="{ paddingLeft: (f.depth * 16 + 12) + 'px' }"
                @click="moveToFolderState.targetFolderId = f.id"
              >📁 {{ f.name }}</button>
            </div>
            <div class="modal-footer">
              <button class="ctrl-btn" @click="moveToFolderState.visible = false">取消</button>
              <button class="ctrl-btn primary" @click="confirmMoveToFolder" :disabled="moveToFolderState.loading">
                {{ moveToFolderState.loading ? '移动中...' : '确定' }}
              </button>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>

    <!-- 全局来源 Tooltip -->
    <Teleport to="body">
      <Transition name="tooltip-fade">
        <div
          v-if="hoveredSourceId"
          class="source-tooltip-global"
          :style="{ top: tooltipPos.top + 'px', left: tooltipPos.left + 'px' }"
          @mouseenter="cancelHideTooltip"
          @mouseleave="scheduleHideTooltip"
        >
          <span class="tooltip-url">{{ hoveredSourceUrl }}</span>
        </div>
      </Transition>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, watch, onMounted, onUnmounted } from 'vue'
import { storeToRefs } from 'pinia'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { Check, Grid, List, Warning, DCaret, Search, Close, Loading, ArrowLeft, ArrowRight, Connection } from '@element-plus/icons-vue'
import { getFavoriteList, renameVideo, deleteVideo, getResultById } from '@/api'
import type { AnalysisTaskVO } from '@/types'
import { useFavoritesStore } from '@/stores/favorites'
import { useFolderStore } from '@/stores/folder'
import { useSettingsStore } from '@/stores/settings'
import { useExportReport } from '@/composables/useExportReport'
import CardView from '@/components/CardView.vue'
import ListView from '@/components/ListView.vue'
import NeuSelect from '@/components/NeuSelect.vue'
import VideoPreviewModal from '@/components/VideoPreviewModal.vue'

const router = useRouter()
const favStore = useFavoritesStore()
const folderStore = useFolderStore()
const settingsStore = useSettingsStore()
const { exportReportByUrl, exportingIds } = useExportReport()

// ── 视图（持久化到 settings store）──
const { favoritesViewMode: viewMode } = storeToRefs(settingsStore)
const viewMenuOpen = ref(false)
const viewSwitcherRef = ref<HTMLElement | null>(null)
const setViewMode = (m: 'card' | 'list') => { viewMode.value = m; viewMenuOpen.value = false }

// ── 数据 ──
const records = ref<AnalysisTaskVO[]>([])
const loading = ref(true)
const totalRecords = ref(0)
const currentPage = ref(1)
const pageSize = ref(12)
const totalPages = computed(() => Math.max(1, Math.ceil(totalRecords.value / pageSize.value)))

// 每页条数选择器
const pageSizeOptions = [
  { label: '每页 12 条', value: '12' },
  { label: '每页 24 条', value: '24' },
  { label: '每页 48 条', value: '48' },
]
const pageSizeStr = ref('12')
watch(pageSizeStr, (val) => {
  pageSize.value = Number(val)
  currentPage.value = 1
  loadRecords()
})

// ── 筛选 ──
const sourceFilter = ref('')
const riskFilter = ref('')
const sortOrder = ref('gmtCreated,desc')
const searchKeyword = ref('')

const sourceOptions = [
  { label: '全部来源', value: '' },
  { label: '本地导入', value: 'LOCAL_UPLOAD' },
  { label: '链接采集', value: 'URL_IMPORT' },
]

const riskOptions = [
  { label: '全部风险', value: '' },
  { label: '高风险', value: 'HIGH' },
  { label: '中风险', value: 'MEDIUM' },
  { label: '低风险', value: 'LOW' },
]
const sortOptions = [
  { label: '最新收藏', value: 'gmtCreated,desc' },
  { label: '最早收藏', value: 'gmtCreated,asc' },
  { label: '风险从高到低', value: 'riskLevel,desc' },
]

watch([sourceFilter, riskFilter, sortOrder], () => { currentPage.value = 1; loadRecords() })

let searchTimer: ReturnType<typeof setTimeout> | null = null
const debouncedSearch = () => {
  if (searchTimer) clearTimeout(searchTimer)
  searchTimer = setTimeout(() => { currentPage.value = 1; loadRecords() }, 350)
}

const loadRecords = async () => {
  loading.value = true
  try {
    const [sortField, sortDir] = sortOrder.value.split(',')
    const res = await getFavoriteList({
      page: currentPage.value,
      size: pageSize.value,
      keyword: searchKeyword.value || undefined,
      riskLevel: riskFilter.value || undefined,
      sourceType: sourceFilter.value || undefined,
      sortField,
      sortDir,
    })
    if (res.code === 200) {
      records.value = res.data.records || []
      totalRecords.value = res.data.total || 0
      favStore.syncFromList(records.value)
    }
  } finally {
    loading.value = false
  }
}

// ── 操作 ──
const openMenuId = ref<string | null>(null)

// 预览（与 RecordsCenter 保持一致）
const previewVisible = ref(false)
const previewVideoUrl = ref<string | null>(null)
const previewTitle = ref<string | undefined>(undefined)

// 重命名状态（与记录中心行为对齐）
const renameState = reactive({ visible: false, videoId: '', title: '', originalTitle: '' })

// 删除状态
const deleteState = reactive({ visible: false, videoId: '', title: '', loading: false })

// 移动到文件夹状态
const moveToFolderState = reactive({
  visible: false,
  videoIds: [] as string[],
  targetFolderId: null as string | null,
  loading: false
})
const folderOptions = computed(() => folderStore.flatFolders())

const toggleMenu = (id: string) => { openMenuId.value = openMenuId.value === id ? null : id }

const handleCardClick = (record: AnalysisTaskVO) => {
  if (record.status === 'COMPLETED' && record.resultId) {
    router.push(`/analysis/${record.resultId}`)
  }
}

const handlePreview = (record: AnalysisTaskVO) => {
  openMenuId.value = null
  previewVideoUrl.value = record.videoUrl || null
  previewTitle.value = record.videoTitle || undefined
  previewVisible.value = true
}

const handleRename = (record: AnalysisTaskVO) => {
  openMenuId.value = null
  renameState.videoId = record.videoId
  renameState.title = record.videoTitle || ''
  renameState.originalTitle = record.videoTitle || ''
  renameState.visible = true
}

const confirmRename = async () => {
  const newTitle = renameState.title.trim()
  if (!newTitle) return

  // 与记录中心一致：同名时不提示，直接关闭
  if (newTitle === renameState.originalTitle.trim()) {
    renameState.visible = false
    return
  }

  try {
    const res = await renameVideo(renameState.videoId, newTitle)
    if (res.code === 200) {
      ElMessage.success('重命名成功')
      renameState.visible = false
      await loadRecords()
    } else {
      ElMessage.error(res.message || '重命名失败')
    }
  } catch {
    // 拦截器会处理错误提示
  }
}

const handleMoveToFolder = (record: AnalysisTaskVO) => {
  openMenuId.value = null
  moveToFolderState.videoIds = [record.videoId]
  moveToFolderState.targetFolderId = record.folderId ?? null
  moveToFolderState.visible = true
}

const confirmMoveToFolder = async () => {
  if (moveToFolderState.videoIds.length === 0) return
  moveToFolderState.loading = true
  try {
    await folderStore.moveVideos(moveToFolderState.videoIds, moveToFolderState.targetFolderId)
    ElMessage.success('移动成功')
    moveToFolderState.visible = false
    await loadRecords()
  } catch (e: any) {
    ElMessage.error(e.message || '移动失败')
  } finally {
    moveToFolderState.loading = false
  }
}

const handleExport = async (record: AnalysisTaskVO) => {
  openMenuId.value = null

  const fileName = record.videoTitle ? record.videoTitle.replace(/\.[^.]+$/, '.pdf') : undefined

  // 优先使用列表里携带的 PDF 地址
  if (record.reportPdfUrl) {
    await exportReportByUrl(record.reportPdfUrl, fileName)
    return
  }

  // 收藏列表可能不回传 reportPdfUrl，降级按 resultId 拉取详情
  if (record.resultId) {
    try {
      const res = await getResultById(record.resultId)
      const pdfUrl = (res.data as any)?.reportPdfUrl as string | undefined
      if (pdfUrl) {
        // 回填，避免同一条记录重复请求详情
        record.reportPdfUrl = pdfUrl
        await exportReportByUrl(pdfUrl, fileName)
        return
      }
    } catch {
      // 错误提示由拦截器处理
    }
  }

  ElMessage.warning('PDF 报告尚未生成')
}

const handleDelete = (record: AnalysisTaskVO) => {
  openMenuId.value = null
  deleteState.videoId = record.videoId
  deleteState.title = record.videoTitle || '未命名'
  deleteState.visible = true
}

const confirmDelete = async () => {
  if (deleteState.loading || !deleteState.videoId) return
  deleteState.loading = true
  try {
    const res = await deleteVideo(deleteState.videoId)
    if (res.code === 200) {
      ElMessage.success('删除成功')
      deleteState.visible = false
      await loadRecords()
    } else {
      ElMessage.error(res.message || '删除失败')
    }
  } catch {
    // 拦截器会处理错误提示
  } finally {
    deleteState.loading = false
  }
}

const handleRetryDownload = () => { loadRecords() }
const handleReanalyze = () => { loadRecords() }
const handleCancel = () => { loadRecords() }
const handleFavoriteChange = () => { loadRecords() }

// ── Tooltip ──
const hoveredSourceId = ref<string | null>(null)
const hoveredSourceUrl = ref('')
const tooltipPos = ref({ top: 0, left: 0 })
let hideTimer: ReturnType<typeof setTimeout> | null = null

const showTooltip = (e: MouseEvent, id: string, url: string) => {
  if (hideTimer) clearTimeout(hideTimer)
  hoveredSourceId.value = id
  hoveredSourceUrl.value = url
  tooltipPos.value = { top: e.clientY + 12, left: e.clientX }
}
const scheduleHideTooltip = () => { hideTimer = setTimeout(() => { hoveredSourceId.value = null }, 200) }
const cancelHideTooltip = () => { if (hideTimer) clearTimeout(hideTimer) }

const handleOutsideClick = (e: MouseEvent) => {
  if (viewSwitcherRef.value && !viewSwitcherRef.value.contains(e.target as Node)) {
    viewMenuOpen.value = false
  }
}

onMounted(() => { loadRecords(); document.addEventListener('click', handleOutsideClick) })
onUnmounted(() => { document.removeEventListener('click', handleOutsideClick) })
</script>

<style scoped lang="scss">
$neu-1: #F5F7FA;
$neu-2: #DCDFE6;
$white: #FFFFFF;
$gray: #909399;
$black: #303133;
$purple: #409EFF;
$purple-light: #66b1ff;
$shadow-sm: 0 2px 12px 0 rgba(0, 0, 0, 0.05);
$shadow-in: none;

.favorites-page {
  width: 100%;
  min-height: calc(100vh - 120px);
  display: flex;
  flex-direction: column;
  position: relative;
}

// ── 页面头部（与 RecordsCenter 完全对齐）──
.page-header {
  display: flex; align-items: center; justify-content: space-between; margin-bottom: 22px;
  flex-wrap: wrap; gap: 12px;
  .header-left { display: flex; align-items: baseline; gap: 12px; flex-shrink: 0; }
  .page-title { font-size: 22px; font-weight: 700; color: var(--text-primary); margin: 0; letter-spacing: -.3px; }
  .record-count { font-size: 13px; color: var(--text-secondary); }
  .header-actions { display: flex; gap: 10px; align-items: center; flex-wrap: nowrap; height: 38px; overflow: visible; }
}

.search-box {
  position: relative; display: flex; align-items: center;
  background: var(--bg-card); border: 1px solid var(--border-color); border-radius: 8px;
  box-shadow: $shadow-sm; padding: 0 12px; height: 38px; min-width: 220px;
  .search-icon { color: var(--text-secondary); font-size: 14px; flex-shrink: 0; }
  .search-input {
    flex: 1; border: none; background: transparent; outline: none;
    font-size: 13px; color: var(--text-primary); padding: 0 8px;
    &::placeholder { color: rgba(144, 147, 153, 0.6); }
  }
  .search-clear {
    border: none; background: transparent; cursor: pointer; color: var(--text-secondary);
    display: flex; align-items: center; padding: 0;
    &:hover { color: var(--text-primary); }
  }
  &:focus-within { border-color: var(--color-primary); }
}

// ── 视图切换 ──
.view-switcher { position: relative; }
.view-dropdown {
  position: absolute; right: 0; top: calc(100% + 8px); min-width: 150px;
  background: var(--bg-card); border: 1px solid var(--border-color); border-radius: 8px; padding: 6px;
  box-shadow: none;
  z-index: 200;
}
.view-option {
  display: flex; align-items: center; gap: 10px; width: 100%; padding: 9px 13px;
  border: none; border-radius: 8px; background: transparent; color: var(--text-primary);
  font-size: 13px; font-family: 'Montserrat', sans-serif; cursor: pointer; transition: all .2s;
  .el-icon { font-size: 14px; color: var(--text-secondary); }
  .check-icon { margin-left: auto; color: var(--color-primary); font-size: 13px; }
  span { flex: 1; text-align: left; }

  &:hover {
    background: var(--bg-hover);
    .el-icon { color: var(--color-primary); }
  }
  &.active {
    color: var(--color-primary); font-weight: 600;
    .el-icon { color: var(--color-primary); }
  }
}

// ── 控制按钮 ──
.ctrl-btn {
  display: inline-flex; align-items: center; gap: 6px;
  padding: 8px 16px; border: 1px solid var(--border-color); border-radius: 8px; cursor: pointer;
  font-size: 13px; font-weight: 600; color: var(--text-secondary); background: var(--bg-card);
  box-shadow: none; transition: all .25s;
  .el-icon { font-size: 14px; }
  &:hover { color: var(--color-primary); border-color: var(--color-primary); }
  &.active {
    background: linear-gradient(135deg, #409EFF 0%, #3a8ee6 100%);
    color: #fff !important;
    border-color: var(--color-primary);
    font-weight: 600;
    box-shadow: none;

    .el-icon {
      color: #fff !important;
    }
  }
  &.primary {
    background: var(--color-primary); border-color: var(--color-primary); color: #fff !important;
    &:hover { background: #66b1ff; border-color: #66b1ff; }
  }

  &.danger {
    color: #e74c3c;
    border-color: rgba(231, 76, 60, 0.45);
    background: rgba(231, 76, 60, 0.1);

    &:hover:not(:disabled) {
      background: #e74c3c;
      border-color: #e74c3c;
      color: #fff !important;
    }

    &:active:not(:disabled) {
      background: #d84a3a;
      border-color: #d84a3a;
      color: #fff !important;
    }

    &:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }
  }
}

// ── 空状态 ──
.empty-state {
  flex: 1; display: flex; flex-direction: column; align-items: center; justify-content: center;
  gap: 16px; padding: 20px 20px 300px; text-align: center;
  margin: auto;
  width: 100%;
}
.empty-illustration {
  position: relative; width: 120px; height: 120px; margin-bottom: 8px;
  display: flex; align-items: center; justify-content: center;
}
.star-float {
  position: absolute;
  animation: float 3.5s ease-in-out infinite;
  svg { width: 80px; height: 80px; }
  &.small {
    top: 0; right: 0;
    animation-delay: -1.2s; animation-duration: 2.8s;
    svg { width: 40px; height: 40px; }
  }
}
@keyframes float {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-10px); }
}
.empty-title { font-size: 18px; font-weight: 700; color: var(--text-primary); margin: 0; }
.empty-desc { font-size: 13px; color: var(--text-secondary); margin: 0; max-width: 320px; line-height: 1.6; }

// ── 加载 ──
.loading-state {
  display: flex; align-items: center; justify-content: center; gap: 12px;
  padding: 60px; color: var(--text-secondary); font-size: 14px;
  .rotating { animation: spin 1s linear infinite; }
}
@keyframes spin { to { transform: rotate(360deg); } }

// ── 分页 ──
.pagination-wrapper {
  display: flex; align-items: center; justify-content: center;
  gap: 16px; margin-top: 28px;

  .page-size-select {
    :deep(.neu-select) { display: inline-flex; }
    :deep(.neu-select-trigger) {
      height: 38px; padding: 0 14px;
      border-radius: 11px;
      background: $neu-1;
      box-shadow: $shadow-sm;
      border: none;
      font-size: 13px; font-weight: 600; color: var(--text-primary);
      gap: 8px; white-space: nowrap;
      transition: all .25s;
      outline: none;
      &:hover { color: var(--color-primary); box-shadow: none; }
    }
    :deep(.neu-select-dropdown) { min-width: 130px; }
  }
}

.neu-pagination {
  display: flex; align-items: center; gap: 16px;
  .page-btn {
    width: 38px; height: 38px; border: none; border-radius: 11px; background: $neu-1;
    box-shadow: $shadow-sm; cursor: pointer; display: flex; align-items: center; justify-content: center;
    color: var(--text-secondary); transition: all .25s;
    &:hover:not(:disabled) { color: var(--color-primary); box-shadow: none; }
    &:disabled { opacity: .4; cursor: not-allowed; }
  }
  .page-info { font-size: 13px; color: var(--text-primary); font-weight: 600; }
}

// ── Tooltip ──
.source-tooltip-global {
  position: fixed; z-index: 9999; max-width: 320px;
  background: rgba(26,31,46,.92); color: #fff; font-size: 12px;
  padding: 6px 12px; border-radius: 8px; pointer-events: auto;
  backdrop-filter: blur(8px); word-break: break-all;
}

// ── 弹窗（与 RecordsCenter 对齐） ──
.neu-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,.28);
  backdrop-filter: blur(5px);
  z-index: 2000;
  display: flex;
  align-items: center;
  justify-content: center;
}

.neu-modal {
  background: var(--bg-card);
  border: 1px solid var(--border-color);
  border-radius: 12px;
  padding: 28px;
  width: 380px;
  max-width: 90vw;
  box-shadow: none;

  .modal-title {
    font-size: 17px;
    font-weight: 700;
    color: var(--text-primary);
    margin: 0 0 16px;
  }

  .confirm-desc {
    font-size: 13px;
    color: var(--text-secondary);
    margin: 0;
    line-height: 1.6;
  }

  .modal-footer {
    display: flex;
    justify-content: flex-end;
    gap: 12px;
    margin-top: 20px;
  }
}

.neu-input {
  width: 100%;
  padding: 12px 16px;
  font-size: 13px;
  color: var(--text-primary);
  background: var(--bg-card);
  border: 1px solid var(--border-color);
  border-radius: 8px;
  outline: none;
  font-family: 'Montserrat', sans-serif;
  transition: all .25s;

  &:focus { border-color: var(--color-primary); }
  &::placeholder { color: var(--text-secondary); }
}

.move-folder-list {
  max-height: 300px;
  overflow-y: auto;
  margin: 12px 0;
  border-radius: 8px;
  background: var(--bg-hover);
  padding: 6px;

  .move-folder-option {
    display: block;
    width: 100%;
    padding: 10px 12px;
    border: none;
    background: transparent;
    border-radius: 8px;
    font-size: 13px;
    color: var(--text-primary);
    cursor: pointer;
    text-align: left;
    transition: all .15s;

    &:hover { background: rgba(64, 158, 255, .08); }
    &.active { background: var(--color-primary); color: #fff; }
  }
}

.delete-confirm-btn {
  color: #fff !important;
  background: #e74c3c !important;
  border-color: #e74c3c !important;

  &:hover:not(:disabled) {
    color: #fff !important;
    background: #f56c6c !important;
    border-color: #f56c6c !important;
  }

  &:active:not(:disabled) {
    color: #fff !important;
    background: #d84a3a !important;
    border-color: #d84a3a !important;
  }

  &:disabled {
    color: rgba(255, 255, 255, 0.88) !important;
    background: rgba(231, 76, 60, 0.72) !important;
    border-color: rgba(231, 76, 60, 0.72) !important;
  }
}

.modal-fade-enter-active { transition: opacity .2s ease; .neu-modal { transition: transform .2s cubic-bezier(.34,1.56,.64,1), opacity .2s ease; } }
.modal-fade-leave-active { transition: opacity .15s ease; .neu-modal { transition: transform .15s ease, opacity .15s ease; } }
.modal-fade-enter-from { opacity: 0; .neu-modal { transform: scale(.88); opacity: 0; } }
.modal-fade-leave-to { opacity: 0; .neu-modal { transform: scale(.95); opacity: 0; } }

// ── 过渡 ──
.view-fade-enter-active, .view-fade-leave-active { transition: opacity .2s; }
.view-fade-enter-from, .view-fade-leave-to { opacity: 0; }
.empty-fade-enter-active { transition: opacity .35s ease .15s; }
.empty-fade-leave-active { transition: opacity .2s ease; }
.empty-fade-enter-from, .empty-fade-leave-to { opacity: 0; }
.dropdown-enter-active { animation: dd-in .2s cubic-bezier(.34,1.56,.64,1); }
.dropdown-leave-active { animation: dd-out .15s ease; }
@keyframes dd-in { from { opacity: 0; transform: translateY(8px) scale(.95); } to { opacity: 1; transform: none; } }
@keyframes dd-out { from { opacity: 1; } to { opacity: 0; transform: translateY(4px); } }
.tooltip-fade-enter-active, .tooltip-fade-leave-active { transition: opacity .15s; }
.tooltip-fade-enter-from, .tooltip-fade-leave-to { opacity: 0; }
.pagination-fade-enter-active { transition: opacity .25s ease, transform .25s ease; }
.pagination-fade-leave-active { transition: opacity .2s ease; }
.pagination-fade-enter-from, .pagination-fade-leave-to { opacity: 0; }
</style>
