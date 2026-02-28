<template>
  <div class="records-center">

    <!-- ── 页面头部 ── -->
    <div class="page-header">
      <div class="header-left">
        <!-- 面包屑导航：在文件夹内时替换标题 -->
        <div class="breadcrumb-nav" v-if="activeFolderBreadcrumbs.length > 0">
          <button class="breadcrumb-item root-crumb" @click="folderStore.setActive('__ALL__')">
            <svg class="crumb-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
            记录中心
          </button>
          <template v-for="(crumb, idx) in activeFolderBreadcrumbs" :key="crumb.id">
            <span class="crumb-sep">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6"/></svg>
            </span>
            <button
              class="breadcrumb-item"
              :class="{ 'is-current': idx === activeFolderBreadcrumbs.length - 1 }"
              @click="folderStore.setActive(crumb.id)"
            >{{ crumb.name }}</button>
          </template>
        </div>
        <h1 class="page-title" v-else>记录中心</h1>
        <span class="record-count">共 {{ totalRecords }} 条记录</span>
      </div>
      <div class="header-actions">
        <!-- 批量操作内联区（仅批量模式下显示） -->
        <Transition name="batch-inline">
          <div class="batch-inline" v-if="batchMode">
            <span class="batch-inline-count" :class="{ empty: selectedIds.size === 0 }">
              {{ selectedIds.size === 0 ? '请选择视频' : `已选 ${selectedIds.size} 条` }}
            </span>
            <div class="batch-inline-divider"></div>
            <button
              class="ctrl-btn sm select-all"
              :class="{ 'is-all': isAllSelected, 'is-indeterminate': isIndeterminate }"
              @click="toggleSelectAll"
              :aria-label="isAllSelected ? '取消全选' : '全选'"
            >
              <span class="select-all-box">
                <svg v-if="isAllSelected" viewBox="0 0 10 8" fill="none"><path d="M1 4L3.8 7L9 1" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>
                <span v-else-if="isIndeterminate" class="indeterminate-dash"></span>
              </span>
              {{ isAllSelected ? '取消全选' : '全选' }}
            </button>
            <button
              class="ctrl-btn sm"
              :disabled="selectedIds.size === 0"
              @click="handleBatchExport"
            >
              <el-icon><Download /></el-icon>导出报告
            </button>
            <button
              class="ctrl-btn sm"
              :disabled="selectedIds.size === 0"
              @click="handleBatchMoveToFolder"
            >
              <el-icon><FolderOpened /></el-icon>移动到文件夹
            </button>
            <button
              class="ctrl-btn sm danger"
              :disabled="selectedIds.size === 0"
              @click="handleBatchDelete"
            >
              <el-icon><Delete /></el-icon>批量删除
            </button>
          </div>
        </Transition>
        <button class="ctrl-btn" :class="{ active: batchMode }" @click="toggleBatchMode">
          <el-icon><Grid /></el-icon>
          {{ batchMode ? '退出批量' : '批量管理' }}
        </button>
        <!-- 视图切换 -->
        <div class="view-switcher" ref="viewSwitcherRef">
          <button class="ctrl-btn" :class="{ active: viewMenuOpen }" @click.stop="viewMenuOpen = !viewMenuOpen">
            <el-icon v-if="viewMode === 'card'"><Grid /></el-icon>
            <el-icon v-else><List /></el-icon>
            视图
          </button>
          <Transition name="dropdown">
            <div class="view-dropdown" v-if="viewMenuOpen" @click.stop>
              <button
                class="view-option"
                :class="{ active: viewMode === 'card' }"
                @click="setViewMode('card')"
              >
                <el-icon><Grid /></el-icon>
                <span>卡片模式</span>
                <el-icon class="check-icon" v-if="viewMode === 'card'"><Check /></el-icon>
              </button>
              <button
                class="view-option"
                :class="{ active: viewMode === 'list' }"
                @click="setViewMode('list')"
              >
                <el-icon><List /></el-icon>
                <span>列表模式</span>
                <el-icon class="check-icon" v-if="viewMode === 'list'"><Check /></el-icon>
              </button>
            </div>
          </Transition>
        </div>
        <button class="ctrl-btn primary" @click="showNewTaskModal = true">
          <el-icon><Plus /></el-icon>
          新建分析任务
        </button>
      </div>
    </div>

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
        <!-- 排序下拉 -->
        <NeuSelect
          v-model="sortOrder"
          :options="sortOptions"
          placeholder="排序"
        >
          <template #icon><el-icon><DCaret /></el-icon></template>
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

    <!-- ── 视图内容区（带淡入淡出切换动画） ── -->
    <Transition name="view-fade" mode="out-in">
      <div v-if="!loading && records.length > 0" :key="viewMode">
        <!-- 空文件夹提示：当前目录本身无直接视频，展示的是子文件夹内容 -->
        <div class="subfolder-hint" v-if="showSubfolderHint">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M22 19a2 2 0 01-2 2H4a2 2 0 01-2-2V5a2 2 0 012-2h5l2 3h9a2 2 0 012 2z"/><line x1="12" y1="11" x2="12" y2="17"/><line x1="9" y1="14" x2="15" y2="14"/></svg>
          当前目录无直接视频，以下展示来自子文件夹的内容
        </div>
        <!-- 卡片模式 -->
        <CardView
          v-if="viewMode === 'card'"
          :records="records"
          :batch-mode="batchMode"
          :selected-ids="selectedIds"
          :open-menu-id="openMenuId"
          :exporting-ids="exportingIds"
          :active-folder-id="folderStore.activeFolderId"
          :folder-breadcrumbs="activeFolderBreadcrumbs"
          @card-click="handleCardClick"
          @toggle-select="toggleSelect"
          @toggle-menu="toggleMenu"
          @view-analysis="(r) => router.push(`/analysis/${r.resultId}`)"
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
          @navigate-folder="handleNavigateFolder"
        />
        <!-- 列表模式 -->
        <ListView
          v-else
          :records="records"
          :batch-mode="batchMode"
          :selected-ids="selectedIds"
          :open-menu-id="openMenuId"
          :exporting-ids="exportingIds"
          :active-folder-id="folderStore.activeFolderId"
          :folder-breadcrumbs="activeFolderBreadcrumbs"
          @card-click="handleCardClick"
          @toggle-select="toggleSelect"
          @toggle-menu="toggleMenu"
          @view-analysis="(r) => router.push(`/analysis/${r.resultId}`)"
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
          @navigate-folder="handleNavigateFolder"
        />
      </div>
    </Transition>

    <!-- 空状态 -->
    <Transition name="empty-fade">
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
          <NeuSelect
            v-model="pageSizeStr"
            :options="pageSizeOptions"
            placeholder="每页条数"
          />
        </div>
      </div>
    </Transition>

    <!-- 重命名弹窗 -->
    <Teleport to="body">
      <Transition name="modal-fade">
        <div class="neu-overlay" v-if="renameState.visible" @mousedown.self="onRenameOverlayMouseDown" @mouseup.self="onRenameOverlayMouseUp">
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
        <div class="neu-overlay" v-if="deleteState.visible" @mousedown.self="onDeleteOverlayMouseDown" @mouseup.self="onDeleteOverlayMouseUp">
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

    <!-- 全局来源 Tooltip（Teleport 到 body，避免被 overflow:hidden 裁切） -->
    <Teleport to="body">
      <Transition name="tooltip-fade">
        <div
          v-if="hoveredSourceId"
          class="source-tooltip-global"
          :style="{ top: tooltipPos.top + 'px', left: tooltipPos.left + 'px' }"
          @mouseenter="cancelHideTooltip"
          @mouseleave="scheduleHideTooltip"
        >
          <a
            :href="tooltipUrl"
            target="_blank"
            rel="noopener noreferrer"
            class="tooltip-url"
            @click.stop
          >{{ tooltipUrl }}</a>
          <button
            class="tooltip-copy-btn"
            title="复制链接"
            @click.stop="copyUrl(tooltipUrl)"
          ><el-icon><CopyDocument /></el-icon></button>
        </div>
      </Transition>
    </Teleport>

    <NewTaskModal
      v-model:visible="showNewTaskModal"
      :prefill-url="retryDownloadRecord?.sourceUrl ?? undefined"
      :folder-id="folderStore.activeFolderId !== '__ALL__' && folderStore.activeFolderId !== '__UNCATEGORIZED__' ? folderStore.activeFolderId : undefined"
      @success="handleTaskSuccess"
      @task-created="handleTaskCreated"
    />

    <!-- 视频快速预览 -->
    <VideoPreviewModal
      v-model:visible="previewVisible"
      :video-url="previewVideoUrl"
      :title="previewTitle"
    />

    <!-- 移动到文件夹弹窗 -->
    <Teleport to="body">
      <Transition name="modal-fade">
        <div class="neu-overlay" v-if="moveToFolderState.visible" @mousedown.self="onMoveToFolderOverlayMouseDown" @mouseup.self="onMoveToFolderOverlayMouseUp">
          <div class="neu-modal">
            <h3 class="modal-title">
              {{ moveToFolderState.videoIds.length > 1
                ? `移动 ${moveToFolderState.videoIds.length} 个视频到文件夹`
                : '移动到文件夹' }}
            </h3>
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
  </div>
</template>
<script setup lang="ts">
import { ref, reactive, computed, onMounted, onUnmounted, watch, nextTick } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { getTaskList, cancelTask, deleteVideo, renameVideo, retryTask } from '@/api'
import { useWebSocket } from '@/composables/useWebSocket'
import { useWebSocketStore } from '@/stores/websocket'
import { useFolderStore } from '@/stores/folder'
import { useFavoritesStore } from '@/stores/favorites'
import { useExportReport } from '@/composables/useExportReport'
import { formatDate } from '@/types'
import type { AnalysisTaskVO, TaskStatus, RiskLevel } from '@/types'
import NewTaskModal from '@/components/NewTaskModal.vue'
import NeuSelect from '@/components/NeuSelect.vue'
import CardView from '@/components/CardView.vue'
import ListView from '@/components/ListView.vue'
import VideoPreviewModal from '@/components/VideoPreviewModal.vue'

const router = useRouter()
const wsStore = useWebSocketStore()
const folderStore = useFolderStore()
const favStore = useFavoritesStore()
const { exportReportByUrl, exportReportsByUrls, exportingIds } = useExportReport()
const showNewTaskModal = ref(false)

// 模态框关闭逻辑：只有 mousedown 和 mouseup 都在外部才关闭
let renameOverlayMouseDown = false
let deleteOverlayMouseDown = false
let moveToFolderOverlayMouseDown = false

const onRenameOverlayMouseDown = () => {
  renameOverlayMouseDown = true
}

const onRenameOverlayMouseUp = () => {
  if (renameOverlayMouseDown) {
    renameState.visible = false
  }
  renameOverlayMouseDown = false
}

const onDeleteOverlayMouseDown = () => {
  deleteOverlayMouseDown = true
}

const onDeleteOverlayMouseUp = () => {
  if (deleteOverlayMouseDown) {
    deleteState.visible = false
  }
  deleteOverlayMouseDown = false
}

const onMoveToFolderOverlayMouseDown = () => {
  moveToFolderOverlayMouseDown = true
}

const onMoveToFolderOverlayMouseUp = () => {
  if (moveToFolderOverlayMouseDown) {
    moveToFolderState.visible = false
  }
  moveToFolderOverlayMouseDown = false
}

// 面包屑导航：当前激活文件夹的路径
const activeFolderBreadcrumbs = computed(() => {
  const id = folderStore.activeFolderId
  if (!id || id === '__ALL__' || id === '__UNCATEGORIZED__') return []
  return folderStore.getBreadcrumbs(id)
})

// 空文件夹提示：当前文件夹本身没有直接视频（所有视频来自子文件夹）
const showSubfolderHint = computed(() => {
  const id = folderStore.activeFolderId
  if (!id || id === '__ALL__' || id === '__UNCATEGORIZED__') return false
  return !folderStore.hasDirectVideos(id)
})

// 点击视频路径标签跳转到对应文件夹
const handleNavigateFolder = (folderId: string) => {
  folderStore.setActive(folderId)
}

// 视频预览
const previewVisible = ref(false)
const previewVideoUrl = ref<string | null>(null)
const previewTitle = ref<string | undefined>(undefined)

const handlePreview = (record: AnalysisTaskVO) => {
  previewVideoUrl.value = record.videoUrl || null
  previewTitle.value = record.videoTitle || undefined
  previewVisible.value = true
}

// 视图模式：card | list，持久化到 localStorage
const VIEW_MODE_KEY = 'records_view_mode'
const viewMode = ref<'card' | 'list'>((localStorage.getItem(VIEW_MODE_KEY) as 'card' | 'list') || 'card')
const viewMenuOpen = ref(false)
const viewSwitcherRef = ref<HTMLElement | null>(null)

const setViewMode = (mode: 'card' | 'list') => {
  viewMode.value = mode
  viewMenuOpen.value = false
  localStorage.setItem(VIEW_MODE_KEY, mode)
}

// 列表数据
const records = ref<AnalysisTaskVO[]>([])
const loading = ref(true)
const totalRecords = ref(0)
const currentPage = ref(1)
const pageSize = ref(12)
const activeStatus = ref<string>('')
const sourceFilter = ref<string>('')
const riskFilter = ref<string>('')
const sortOrder = ref<string>('newest')
const searchKeyword = ref('')

// 每页条数选择器（NeuSelect 需要 string 类型）
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
const openMenuId = ref<string | null>(null)

// 来源 Tooltip 交互式显隐
const hoveredSourceId = ref<string | null>(null)
const tooltipPos = ref({ top: 0, left: 0 })
const tooltipUrl = ref('')
let tooltipHideTimer: ReturnType<typeof setTimeout> | null = null

const showTooltip = (event: MouseEvent, recordId: string, url: string) => {
  cancelHideTooltip()
  const el = event.currentTarget as HTMLElement
  const rect = el.getBoundingClientRect()
  const TOOLTIP_WIDTH = 340  // 与 max-width 一致
  const MARGIN = 12           // 距视口边缘最小留白

  // fixed 定位直接用视口坐标，不加 scrollY
  let left = rect.left
  // 右边界保护：如果超出视口右侧，向左偏移
  if (left + TOOLTIP_WIDTH > window.innerWidth - MARGIN) {
    left = window.innerWidth - TOOLTIP_WIDTH - MARGIN
  }
  // 左边界保护
  if (left < MARGIN) left = MARGIN

  tooltipPos.value = {
    top: rect.top - 8,   // 气泡底部贴近触发元素顶部，再留 8px 间距
    left
  }
  tooltipUrl.value = url
  hoveredSourceId.value = recordId
}
const scheduleHideTooltip = () => {
  tooltipHideTimer = setTimeout(() => { hoveredSourceId.value = null }, 120)
}
const cancelHideTooltip = () => {
  if (tooltipHideTimer) { clearTimeout(tooltipHideTimer); tooltipHideTimer = null }
}

// 复制链接到剪贴板
const copyUrl = async (url: string | null | undefined) => {
  if (!url) return
  try {
    await navigator.clipboard.writeText(url)
    ElMessage.success('链接已复制')
  } catch {
    ElMessage.error('复制失败，请手动复制')
  }
}

// 批量管理
const batchMode = ref(false)
const selectedIds = reactive(new Set<string>())

const totalPages = computed(() => Math.ceil(totalRecords.value / pageSize.value))
const hasActiveFilters = computed(() => !!(activeStatus.value || sourceFilter.value || riskFilter.value || searchKeyword.value.trim() || sortOrder.value !== 'newest'))

const clearAllFilters = () => {
  activeStatus.value = ''
  sourceFilter.value = ''
  riskFilter.value = ''
  sortOrder.value = 'newest'
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
  { label: '失败', value: 'FAILED' },
  { label: '取消', value: 'CANCELLED' }
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

const sortOptions = [
  { label: '最新发布', value: 'newest' },
  { label: '最早发布', value: 'oldest' },
  { label: '风险最高', value: 'risk_desc' }
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
  // 根据排序选项决定后端排序参数
  // 后端支持的 sortBy: gmtCreated / riskScore / videoDuration
  const sortField = sortOrder.value === 'risk_desc' ? 'riskScore' : 'gmtCreated'
  const sortDir = sortOrder.value === 'oldest' ? 'asc' : 'desc'
  const folderId = folderStore.activeFolderId || undefined
  const res = await getTaskList(
    currentPage.value, pageSize.value,
    status as TaskStatus | undefined,
    riskFilter.value as RiskLevel | undefined || undefined,
    sortField, sortDir,
    folderId
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
    // 风险最高：后端已按 riskScore DESC 排序，前端无需重复处理
    // 防御性去重：按 id 去重（同一任务不重复展示）
    const seen = new Set<string>()
    records.value = list.filter((r: AnalysisTaskVO) => {
      if (seen.has(r.id)) return false
      seen.add(r.id)
      return true
    })
    totalRecords.value = total
    // 同步收藏状态到 favoritesStore，确保卡片收藏图标正确显示
    favStore.syncFromList(records.value)
  }
}

let searchTimer: ReturnType<typeof setTimeout> | null = null
const debouncedSearch = () => {
  if (searchTimer) clearTimeout(searchTimer)
  searchTimer = setTimeout(() => { currentPage.value = 1; loadRecords() }, 300)
}

watch([activeStatus, sourceFilter, riskFilter, sortOrder], () => { currentPage.value = 1; loadRecords() })

// 监听文件夹切换
watch(() => folderStore.activeFolderId, () => { currentPage.value = 1; loadRecords() })

// 批量管理
const toggleBatchMode = () => {
  batchMode.value = !batchMode.value
  if (!batchMode.value) selectedIds.clear()
}
const toggleSelect = (id: string) => {
  if (selectedIds.has(id)) selectedIds.delete(id)
  else selectedIds.add(id)
}

// 全选逻辑
const isAllSelected = computed(() =>
  records.value.length > 0 && records.value.every(r => selectedIds.has(r.id))
)
const isIndeterminate = computed(() =>
  selectedIds.size > 0 && !isAllSelected.value
)
const toggleSelectAll = () => {
  if (isAllSelected.value) {
    records.value.forEach(r => selectedIds.delete(r.id))
  } else {
    records.value.forEach(r => selectedIds.add(r.id))
  }
}

const handleCardClick = (record: AnalysisTaskVO) => {
  if (batchMode.value) { toggleSelect(record.id); return }
  if (record.status === 'COMPLETED' && record.hasResult && record.resultId) {
    router.push(`/analysis/${record.resultId}`)
  } else if (record.status === 'DOWNLOADING') {
    ElMessage.info('视频正在下载中，请稍候...')
  } else if (record.status === 'CANCELLED') {
    ElMessage.warning('该任务已取消，可点击"更多操作"重新分析')
  }
}

const toggleMenu = (id: string) => { openMenuId.value = openMenuId.value === id ? null : id }
const handleExport = (record: AnalysisTaskVO) => {
  openMenuId.value = null
  if (record.reportPdfUrl) {
    const fileName = record.videoTitle ? record.videoTitle.replace(/\.[^.]+$/, '.pdf') : undefined
    exportReportByUrl(record.reportPdfUrl, fileName)
  } else {
    ElMessage.warning('PDF 报告尚未生成')
  }
}
const handleClickOutside = (e: MouseEvent) => {
  openMenuId.value = null
  if (viewSwitcherRef.value && !viewSwitcherRef.value.contains(e.target as Node)) {
    viewMenuOpen.value = false
  }
}

const handleRename = (record: AnalysisTaskVO) => {
  openMenuId.value = null
  renameState.videoId = record.videoId
  renameState.title = record.videoTitle || ''
  renameState.visible = true
}

// 移动到文件夹
const moveToFolderState = reactive({
  visible: false,
  videoIds: [] as string[],
  targetFolderId: null as string | null,
  loading: false
})
const folderOptions = computed(() => folderStore.flatFolders())

const handleMoveToFolder = (record: AnalysisTaskVO) => {
  openMenuId.value = null
  moveToFolderState.videoIds = [record.videoId]
  moveToFolderState.targetFolderId = null
  moveToFolderState.visible = true
}

const handleBatchMoveToFolder = () => {
  if (selectedIds.size === 0) return
  // 从已选记录中取出 videoId 列表
  const videoIds = records.value
    .filter(r => selectedIds.has(r.id))
    .map(r => r.videoId)
  moveToFolderState.videoIds = videoIds
  moveToFolderState.targetFolderId = null
  moveToFolderState.visible = true
}

const confirmMoveToFolder = async () => {
  if (moveToFolderState.videoIds.length === 0) return
  moveToFolderState.loading = true
  try {
    await folderStore.moveVideos(moveToFolderState.videoIds, moveToFolderState.targetFolderId)
    const count = moveToFolderState.videoIds.length
    ElMessage.success(count > 1 ? `${count} 个视频已移动` : '视频已移动')
    moveToFolderState.visible = false
    // 批量模式下退出并清空选中
    if (batchMode.value) {
      batchMode.value = false
      selectedIds.clear()
    }
    loadRecords()
  } catch (e: any) {
    ElMessage.error(e.message || '移动失败')
  } finally {
    moveToFolderState.loading = false
  }
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

// 重试下载：打开新建任务弹窗并预填 URL（下载失败场景，文件不存在）
const retryDownloadRecord = ref<AnalysisTaskVO | null>(null)
const handleRetryDownload = (record: AnalysisTaskVO) => {
  openMenuId.value = null
  if (!record.sourceUrl) {
    ElMessage.warning('无法获取原始链接，请手动新建任务')
    return
  }
  retryDownloadRecord.value = record
  showNewTaskModal.value = true
}

// 弹窗关闭时清除预填记录
watch(showNewTaskModal, (v) => { if (!v) retryDownloadRecord.value = null })

const handleCancel = async (record: AnalysisTaskVO) => {
  openMenuId.value = null
  // 下载中的任务不支持取消，只能删除
  if (record.status === 'DOWNLOADING') {
    ElMessage.warning('只能取消等待中或处理中的任务')
    return
  }
  // 乐观更新：立即减少横幅计数 + 原地更新卡片状态，不等接口返回
  wsStore.decrementAnalyzingCount()
  const r = records.value.find(r => r.id === record.id)
  if (r) r.status = 'CANCELLED' as any
  try {
    const res = await cancelTask(record.id)
    if (res.code === 200) {
      ElMessage.success('任务已取消')
      // 乐观更新已处理 UI，无需再刷新列表
    } else {
      // 接口失败时回滚状态和计数，axios 拦截器已弹过错误提示
      if (r) r.status = record.status
      wsStore.notifyTaskChanged()
    }
  } catch (e: any) {
    // axios 拦截器已弹过错误提示，只做状态回滚
    if (r) r.status = record.status
    wsStore.notifyTaskChanged()
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
  const items = [...selectedIds]
    .map(id => records.value.find(r => r.id === id))
    .filter(r => r?.status === 'COMPLETED' && r?.reportPdfUrl)
    .map(r => ({
      url: r!.reportPdfUrl as string,
      fileName: r!.videoTitle ? r!.videoTitle.replace(/\.[^.]+$/, '.pdf') : undefined
    }))
  if (items.length === 0) {
    ElMessage.warning('所选记录中没有已完成且有PDF报告的任务')
    return
  }
  if (items.length < selectedIds.size) {
    ElMessage.info(`${selectedIds.size - items.length} 条未完成的记录将被跳过`)
  }
  exportReportsByUrls(items)
}

const confirmDelete = async () => {
  // 防止重复提交
  if (deleteState.loading) return
  deleteState.loading = true

  try {
    if (deleteState.isBatch) {
      const idsToDelete = [...deleteState.ids]
      const tasksToDelete = idsToDelete.map(id => records.value.find(r => r.id === id)).filter(Boolean) as AnalysisTaskVO[]
      const videoIdsToDelete = tasksToDelete.map(t => t.videoId).filter(Boolean)
      deleteState.visible = false

      const results = await Promise.allSettled(videoIdsToDelete.map(vid => deleteVideo(vid, true)))

      const failedNames: string[] = []
      results.forEach((r, i) => {
        if (r.status === 'rejected' || (r.status === 'fulfilled' && r.value.code !== 200)) {
          const task = tasksToDelete[i]
          failedNames.push(task?.videoTitle || '未知视频')
        }
      })

      const successCount = results.length - failedNames.length
      if (successCount > 0) {
        ElMessage.success(`已删除 ${successCount} 条记录`)
      }
      if (failedNames.length > 0) {
        ElMessage.error(`以下视频有未处理的反馈，无法删除：${failedNames.join('、')}`)
      }

      selectedIds.clear()
      wsStore.notifyTaskChanged()
      loadRecords()
      folderStore.loadTree()
    } else {
      const videoId = deleteState.videoId
      deleteState.visible = false
      try {
        const res = await deleteVideo(videoId)
        if (res.code === 200) {
          records.value = records.value.filter(r => r.videoId !== videoId)
          totalRecords.value = Math.max(0, totalRecords.value - 1)
          ElMessage.success('删除成功')
          wsStore.notifyTaskChanged()
        } else {
          ElMessage.error(res.message || '删除失败')
        }
      } catch {
        // 拦截器已弹出后端错误消息，此处不重复提示
      }
      loadRecords()
      folderStore.loadTree()
    }
  } finally {
    deleteState.loading = false
  }
}

const { subscribeProgress, subscribeCompleted, subscribeFailed } = useWebSocket()

// 新任务创建后立即插入列表首位（无需等待后端推送）
const handleTaskCreated = (task: AnalysisTaskVO) => {
  // 防重：如果已存在则跳过（极少情况下 @success 触发的 loadRecords 先到）
  if (records.value.some(r => r.id === task.id)) return
  records.value.unshift(task)
  totalRecords.value++
  // 刷新侧边栏文件夹计数
  folderStore.loadTree()
}

// 任务创建成功（本地上传走此路径）：刷新列表 + 侧边栏计数
const handleTaskSuccess = () => {
  loadRecords()
  folderStore.loadTree()
}

// 监听取消/删除等主动操作，立即刷新列表（清除幽灵卡片）
const unsubTaskChanged = wsStore.onTaskChanged(() => {
  loadRecordsSilent()
})

// 增量更新：收到进度推送时，只原地修改对应 record 的 status/progress/title/videoUrl
// 严禁调用 loadRecords()，避免全量请求导致闪烁
subscribeProgress((data) => {
  const record = records.value.find(r => r.id === data.taskId)
  if (record) {
    const prevStatus = record.status
    record.status = data.status
    // 进度只前进不后退；但状态发生切换时允许重置（新阶段有自己的起点）
    if (data.status !== prevStatus || data.progress > (record.progress ?? 0)) {
      record.progress = data.progress
    }
    // 元数据阶段：后端获取到真实标题后立即更新卡片标题
    if (data.stage === 'FETCHING_TITLE' && data.title) {
      record.videoTitle = data.title
    }
    // 下载完成阶段：后端上传 MinIO 后推送 videoUrl + thumbnailUrl，立即更新卡片
    if (data.stage === 'PENDING' && data.videoUrl) {
      record.videoUrl = data.videoUrl
    }
    if (data.stage === 'PENDING' && data.thumbnailUrl) {
      record.thumbnailUrl = data.thumbnailUrl
    }
  }
})

// 任务完成：原地更新状态，然后做一次轻量刷新（需要拿到 resultId/hasResult）
subscribeCompleted((data) => {
  const record = records.value.find(r => r.id === data.taskId)
  if (record) {
    record.status = 'COMPLETED'
    record.progress = 100
    record.hasResult = true
    record.resultId = data.resultId
  }
  // 后台静默刷新，不触发 loading，确保数据完整性
  loadRecordsSilent()
})

// 任务失败：原地更新状态 + 错误信息 + 失败类型，立即切换卡片为失败模式
subscribeFailed((data) => {
  const record = records.value.find(r => r.id === data.taskId)
  if (record) {
    record.status = 'FAILED'
    record.progress = 0
    if (data.errorMessage) {
      record.errorMessage = data.errorMessage
    }
    // 记录失败类型，用于按钮逻辑区分
    record.failureType = data.failureType ?? 'ANALYSIS_FAILED'
  }
})

onMounted(() => { loadRecords(); document.addEventListener('click', handleClickOutside) })
onUnmounted(() => { document.removeEventListener('click', handleClickOutside); if (searchTimer) clearTimeout(searchTimer); unsubTaskChanged(); if (stalePollTimer) clearInterval(stalePollTimer) })

// 兜底轮询：如果列表中有活跃任务，每 15 秒静默刷新一次，防止 WebSocket 消息丢失导致卡片卡住
let stalePollTimer: ReturnType<typeof setInterval> | null = null
const hasActiveTasks = computed(() => records.value.some(r => r.status === 'PENDING' || r.status === 'PROCESSING'))
watch(hasActiveTasks, (active) => {
  if (active && !stalePollTimer) {
    stalePollTimer = setInterval(() => { if (hasActiveTasks.value) loadRecordsSilent() }, 15000)
  } else if (!active && stalePollTimer) {
    clearInterval(stalePollTimer)
    stalePollTimer = null
  }
}, { immediate: true })

// WebSocket 重连后自动刷新列表，防止重启期间错过推送导致卡片状态过期
watch(() => wsStore.isConnected, (connected, wasConnected) => {
  if (connected && wasConnected === false) {
    loadRecordsSilent()
  }
})
</script>

<style scoped lang="scss">
// ── 设计令牌 ──────────────────────────────────────
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
.records-center { width: 100%; position: relative; }

// ── 面包屑导航 ────────────────────────────────────
.breadcrumb-nav {
  display: flex; align-items: center; gap: 4px; flex-wrap: wrap;
  .breadcrumb-item {
    display: inline-flex; align-items: center; gap: 5px;
    padding: 4px 8px; border: none; background: transparent; cursor: pointer;
    font-size: 14px; font-weight: 600; color: $gray; border-radius: 8px;
    transition: color .15s, background .15s; line-height: 1;
    .crumb-icon { width: 14px; height: 14px; flex-shrink: 0; }
    &:hover { color: $purple; background: rgba($purple, .07); }
    &.root-crumb { font-size: 15px; font-weight: 700; color: $black; }
    &.is-current { color: $black; font-weight: 700; cursor: default; pointer-events: none; }
  }
  .crumb-sep {
    display: flex; align-items: center; color: $neu-2;
    svg { width: 14px; height: 14px; }
  }
}

// ── 子文件夹内容提示 ──────────────────────────────
.subfolder-hint {
  display: flex; align-items: center; gap: 7px;
  padding: 8px 14px; margin-bottom: 14px;
  background: rgba($purple, .04); border-radius: 10px;
  border: 1px dashed rgba($purple, .2);
  font-size: 12px; color: $gray; line-height: 1.4;
  svg { width: 15px; height: 15px; flex-shrink: 0; color: rgba($purple, .5); }
}

// ── 页面头部 ──────────────────────────────────────
.page-header {
  display: flex; align-items: center; justify-content: space-between; margin-bottom: 22px;
  flex-wrap: wrap; gap: 12px;
  .header-left { display: flex; align-items: baseline; gap: 12px; flex-shrink: 0; }
  .page-title { font-size: 22px; font-weight: 700; color: $black; margin: 0; letter-spacing: -.3px; }
  .record-count { font-size: 13px; color: $gray; }
  .header-actions { display: flex; gap: 10px; align-items: center; flex-wrap: nowrap; height: 38px; overflow: visible; }
}

// ── 批量操作内联区 ────────────────────────────────
.batch-inline {
  display: inline-flex; align-items: center; gap: 0;
  padding: 0 4px 0 14px;
  height: 40px; box-sizing: border-box; align-self: center;
  background: rgba(255, 255, 255, 0.55);
  backdrop-filter: blur(6px);
  border-radius: 22px;
  border: 1.5px solid rgba($neu-2, 0.7);
  box-shadow: 2px 2px 6px rgba($neu-2, 0.5), -2px -2px 6px rgba(255,255,255,0.8);
  white-space: nowrap;

  // 状态提示文字
  .batch-inline-count {
    font-size: 12px; font-weight: 600; color: $purple; letter-spacing: 0.3px;
    line-height: 1; flex-shrink: 0;
    &.empty { color: $gray; font-weight: 500; }
  }

  // 垂直分割线
  .batch-inline-divider {
    width: 1px; height: 14px; background: rgba($neu-2, 0.9);
    flex-shrink: 0; margin: 0 8px;
  }

  // 内联区内所有 sm 按钮：轻量透明风格，严格垂直居中
  .ctrl-btn.sm {
    display: inline-flex; align-items: center; justify-content: center;
    gap: 5px; height: 28px; padding: 0 10px;
    background: transparent; box-shadow: none; border-color: transparent;
    border-radius: 8px; font-size: 12px; font-weight: 500;
    color: #4d5d7d; line-height: 1; white-space: nowrap;
    transition: background .15s, color .15s;
    &:hover:not(:disabled) {
      background: rgba($purple, 0.08); color: $purple;
    }
    &:disabled { opacity: 0.38; cursor: not-allowed; }
    &.danger:hover:not(:disabled) { background: rgba(#e74c3c, 0.08); color: #e74c3c; }

    // 全选按钮：带复选框图标
    &.select-all {
      color: $gray; font-weight: 500; gap: 6px;
      &:hover:not(:disabled) { background: rgba($purple, 0.08); color: $purple; }

      .select-all-box {
        width: 15px; height: 15px; flex-shrink: 0;
        border-radius: 4px;
        border: 1.5px solid rgba($neu-2, 1.4);
        background: linear-gradient(145deg, #f5f7fa, #ffffff);
        box-shadow: inset 1px 1px 3px rgba($neu-2, 0.55), inset -1px -1px 2px rgba(255,255,255,0.9);
        display: inline-flex; align-items: center; justify-content: center;
        transition: all .15s ease;
        color: #fff;
        .indeterminate-dash {
          width: 7px; height: 2px; border-radius: 1px; background: $purple; display: block;
        }
      }

      &.is-indeterminate {
        color: $purple;
        .select-all-box { border-color: $purple; }
      }

      &.is-all {
        color: $purple; font-weight: 600;
        .select-all-box {
          background: $purple; border-color: $purple;
          box-shadow: 0 2px 5px rgba($purple, 0.3);
        }
      }
    }
  }
}

// 批量内联入场动画
.batch-inline-enter-active { animation: batch-in .22s cubic-bezier(.34,1.56,.64,1); }
.batch-inline-leave-active { animation: batch-out .15s ease; }
@keyframes batch-in { from { opacity: 0; transform: translateX(12px) scale(.95); } to { opacity: 1; transform: translateX(0) scale(1); } }
@keyframes batch-out { from { opacity: 1; } to { opacity: 0; transform: translateX(8px) scale(.97); } }

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

// ── 空/加载状态 ───────────────────────────────────

.source-tooltip-global {
  position: fixed;
  transform: translateY(-100%) translateY(-6px);  // 上移自身高度 + 6px 间距
  z-index: 9999;
  display: flex; align-items: center; gap: 8px;
  padding: 8px 12px;
  border-radius: 10px;
  background: rgba(255, 255, 255, 0.92);
  backdrop-filter: blur(12px);
  border: 1px solid rgba($purple, 0.15);
  box-shadow: 0 4px 20px rgba($neu-2, 0.7), 0 1px 6px rgba($purple, 0.1);
  white-space: nowrap; max-width: 340px;
  pointer-events: auto;
  // 关键：不参与文档流，不触发任何 reflow
  will-change: transform, opacity;

  // 小三角
  &::after {
    content: ''; position: absolute; top: 100%; left: 16px;
    border: 5px solid transparent;
    border-top-color: rgba(255, 255, 255, 0.92);
  }
  &::before {
    content: ''; position: absolute; top: 100%; left: 15px;
    border: 6px solid transparent;
    border-top-color: rgba($purple, 0.15);
  }

  .tooltip-url {
    font-size: 11px; color: $purple; text-decoration: none;
    overflow: hidden; text-overflow: ellipsis; flex: 1; min-width: 0;
    max-width: 280px; display: block;
    &:hover { text-decoration: underline; }
  }

  .tooltip-copy-btn {
    flex-shrink: 0; width: 22px; height: 22px; border-radius: 6px;
    border: none; background: transparent; cursor: pointer;
    display: flex; align-items: center; justify-content: center;
    color: $gray; transition: background .15s, color .15s; padding: 0;
    .el-icon { font-size: 12px; }
    &:hover { background: rgba($purple, 0.1); color: $purple; }
  }
}

// Tooltip 淡入淡出
// tooltip 只做 opacity 淡入淡出，不叠加 translateY（避免与 fixed 定位的 transform 冲突）
.tooltip-fade-enter-active { transition: opacity .15s ease; }
.tooltip-fade-leave-active { transition: opacity .12s ease; }
.tooltip-fade-enter-from, .tooltip-fade-leave-to { opacity: 0; }

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
.pagination-wrapper {
  display: flex; align-items: center; justify-content: center;
  gap: 16px; margin-top: 28px;

  // 每页条数选择器：克隆分页按钮风格，胶囊化
  .page-size-select {
    :deep(.neu-select) { display: inline-flex; }

    :deep(.neu-select-trigger) {
      // 完全克隆 .page-btn 的背景 + 阴影
      height: 38px; padding: 0 14px;
      border-radius: 11px;
      background: $neu-1;
      box-shadow: $shadow-sm;
      border: none;
      // 字体与 .page-info 完全一致
      font-size: 13px; font-weight: 600; color: $black;
      gap: 8px; white-space: nowrap;
      transition: all .25s;
      // 去掉 NeuSelect 默认的金黄/蓝色边框
      outline: none;

      &:hover {
        color: $purple;
        box-shadow: 3px 3px 7px $neu-2, -3px -3px 7px $white;
      }

      // 箭头图标颜色跟随
      .trigger-arrow { color: $gray; transition: color .25s; }
      &:hover .trigger-arrow { color: $purple; }

      // 无图标插槽时隐藏 icon 占位
      .trigger-icon { display: none; }
    }
  }
}
// 底部工具栏淡入淡出
.pagination-fade-enter-active { transition: opacity .25s ease, transform .25s ease; }
.pagination-fade-leave-active { transition: opacity .2s ease; }
.pagination-fade-enter-from, .pagination-fade-leave-to { opacity: 0; }

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

// ── 视图切换器 ────────────────────────────────────
.view-switcher {
  position: relative;

  .view-dropdown {
    position: absolute; right: 0; top: calc(100% + 8px); min-width: 160px;
    background: $neu-1; border-radius: 14px; padding: 6px;
    box-shadow:
      10px 10px 24px darken($neu-2, 8%),
      -10px -10px 24px $white,
      0 4px 16px rgba(0,0,0,.1);
    z-index: 300;
  }

  .view-option {
    display: flex; align-items: center; gap: 10px; width: 100%; padding: 9px 13px;
    border: none; border-radius: 9px; background: transparent; color: $black;
    font-size: 13px; font-family: 'Montserrat', sans-serif; cursor: pointer; transition: all .2s;
    .el-icon { font-size: 14px; color: $gray; }
    .check-icon { margin-left: auto; color: $purple; font-size: 13px; }
    span { flex: 1; text-align: left; }

    &:hover {
      background: $neu-1;
      box-shadow: $shadow-in;
      .el-icon { color: $purple; }
    }
    &.active {
      color: $purple; font-weight: 600;
      .el-icon { color: $purple; }
    }
  }
}

// ── 视图切换淡入淡出 ──────────────────────────────
.view-fade-enter-active { transition: opacity .2s ease, transform .2s ease; }
.view-fade-enter-active, .view-fade-leave-active { transition: opacity .15s ease; }
.view-fade-enter-from, .view-fade-leave-to { opacity: 0; }

// ── 空状态过渡 ────────────────────────────────────
.empty-fade-enter-active { transition: opacity .35s ease .15s; }
.empty-fade-leave-active { transition: opacity .2s ease; }
.empty-fade-enter-from, .empty-fade-leave-to { opacity: 0; }

// ── 动画 ──────────────────────────────────────────
.rotating { animation: rotate 1s linear infinite; }
@keyframes rotate { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }

.modal-fade-enter-active { transition: opacity .2s ease; .neu-modal { transition: transform .2s cubic-bezier(.34,1.56,.64,1), opacity .2s ease; } }
.modal-fade-leave-active { transition: opacity .15s ease; .neu-modal { transition: transform .15s ease, opacity .15s ease; } }
.modal-fade-enter-from { opacity: 0; .neu-modal { transform: scale(.88); opacity: 0; } }
.modal-fade-leave-to { opacity: 0; .neu-modal { transform: scale(.95); opacity: 0; } }

.dropdown-enter-active { animation: dd-in .2s cubic-bezier(.34,1.56,.64,1); }
.dropdown-leave-active { animation: dd-out .15s ease; }
@keyframes dd-in { from { opacity: 0; transform: translateY(8px) scale(.95); } to { opacity: 1; transform: translateY(0) scale(1); } }
@keyframes dd-out { from { opacity: 1; } to { opacity: 0; transform: translateY(4px); } }

// 移动到文件夹弹窗
.move-folder-list {
  max-height: 300px;
  overflow-y: auto;
  margin: 12px 0;
  border-radius: 10px;
  background: $neu-1;
  padding: 6px;
  box-shadow: $shadow-in;

  .move-folder-option {
    display: block;
    width: 100%;
    padding: 10px 12px;
    border: none;
    background: transparent;
    border-radius: 8px;
    font-size: 13px;
    color: $black;
    cursor: pointer;
    text-align: left;
    transition: all 0.15s;
    &:hover { background: rgba($purple, 0.08); }
    &.active { background: linear-gradient(135deg, $purple, $purple-light); color: #fff; }
  }
}
</style>
