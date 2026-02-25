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
      v-if="previewRecord"
      :record="previewRecord"
      @close="previewRecord = null"
    />

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
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { Check, Grid, List, Warning, DCaret, Search, Close, Loading, ArrowLeft, ArrowRight, Connection } from '@element-plus/icons-vue'
import { getFavoriteList, renameVideo } from '@/api'
import type { AnalysisTaskVO } from '@/types'
import { useFavoritesStore } from '@/stores/favorites'
import { useExportReport } from '@/composables/useExportReport'
import CardView from '@/components/CardView.vue'
import ListView from '@/components/ListView.vue'
import NeuSelect from '@/components/NeuSelect.vue'
import VideoPreviewModal from '@/components/VideoPreviewModal.vue'

const router = useRouter()
const favStore = useFavoritesStore()
const { exportReportById, exportingIds } = useExportReport()

// ── 视图 ──
const viewMode = ref<'card' | 'list'>('card')
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
const previewRecord = ref<AnalysisTaskVO | null>(null)

const toggleMenu = (id: string) => { openMenuId.value = openMenuId.value === id ? null : id }

const handleCardClick = (record: AnalysisTaskVO) => {
  if (record.status === 'COMPLETED' && record.resultId) {
    router.push({ path: '/analysis', query: { resultId: record.resultId, taskId: record.id } })
  }
}

const handlePreview = (record: AnalysisTaskVO) => { previewRecord.value = record }

const handleRename = async (record: AnalysisTaskVO) => {
  const newTitle = prompt('重命名', record.videoTitle)
  if (newTitle && newTitle.trim() && newTitle !== record.videoTitle) {
    await renameVideo(record.videoId, newTitle.trim())
    await loadRecords()
  }
}

const handleExport = (record: AnalysisTaskVO) => {
  if (record.resultId) exportReportById(record.resultId)
}
const handleRetryDownload = () => { loadRecords() }
const handleReanalyze = () => { loadRecords() }
const handleCancel = () => { loadRecords() }
const handleDelete = () => { loadRecords() }
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
$neu-1: #ecf0f3;
$neu-2: #c8d0e7;
$white: #ffffff;
$gray: #8a9bb0;
$black: #1a1f2e;
$purple: #4b70e2;
$purple-light: #7c9df7;
$shadow-sm: 4px 4px 10px $neu-2, -4px -4px 10px $white;

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
  .page-title { font-size: 22px; font-weight: 700; color: $black; margin: 0; letter-spacing: -.3px; }
  .record-count { font-size: 13px; color: $gray; }
  .header-actions { display: flex; gap: 10px; align-items: center; flex-wrap: nowrap; height: 38px; overflow: visible; }
}

.search-box {
  position: relative; display: flex; align-items: center;
  background: $neu-1; border-radius: 12px;
  box-shadow: $shadow-sm; padding: 0 12px; height: 38px; min-width: 220px;
  .search-icon { color: $gray; font-size: 14px; flex-shrink: 0; }
  .search-input {
    flex: 1; border: none; background: transparent; outline: none;
    font-size: 13px; color: $black; padding: 0 8px;
    &::placeholder { color: rgba($gray,.6); }
  }
  .search-clear {
    border: none; background: transparent; cursor: pointer; color: $gray;
    display: flex; align-items: center; padding: 0;
    &:hover { color: $black; }
  }
}

// ── 视图切换 ──
.view-switcher { position: relative; }
.view-dropdown {
  position: absolute; right: 0; top: calc(100% + 8px); min-width: 150px;
  background: $neu-1; border-radius: 14px; padding: 6px;
  box-shadow: 10px 10px 24px darken($neu-2, 8%), -10px -10px 24px $white, 0 4px 16px rgba(0,0,0,.1);
  z-index: 200;
}
.view-option {
  display: flex; align-items: center; gap: 10px; width: 100%; padding: 9px 13px;
  border: none; border-radius: 9px; background: transparent; color: $black;
  font-size: 13px; cursor: pointer; transition: all .2s;
  .el-icon { font-size: 14px; color: $gray; }
  .check-icon { margin-left: auto; color: $purple; }
  &:hover, &.active { background: $neu-1; box-shadow: inset 3px 3px 7px $neu-2, inset -3px -3px 7px $white; }
}

// ── 控制按钮 ──
.ctrl-btn {
  display: inline-flex; align-items: center; gap: 6px;
  padding: 8px 16px; border: none; border-radius: 12px; cursor: pointer;
  font-size: 13px; font-weight: 600; color: $gray; background: $neu-1;
  box-shadow: $shadow-sm; transition: all .25s;
  .el-icon { font-size: 14px; }
  &:hover { color: $purple; box-shadow: 6px 6px 14px darken($neu-2,4%), -6px -6px 14px $white; }
  &.active { box-shadow: inset 3px 3px 7px $neu-2, inset -3px -3px 7px $white; color: $purple; }
  &.primary {
    background: linear-gradient(135deg, $purple, $purple-light); color: #fff;
    box-shadow: 4px 4px 12px rgba($purple,.35), -2px -2px 8px $white;
    &:hover { box-shadow: 6px 6px 18px rgba($purple,.45), -2px -2px 8px $white; }
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
.empty-title { font-size: 18px; font-weight: 700; color: $black; margin: 0; }
.empty-desc { font-size: 13px; color: $gray; margin: 0; max-width: 320px; line-height: 1.6; }

// ── 加载 ──
.loading-state {
  display: flex; align-items: center; justify-content: center; gap: 12px;
  padding: 60px; color: $gray; font-size: 14px;
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
      font-size: 13px; font-weight: 600; color: $black;
      gap: 8px; white-space: nowrap;
      transition: all .25s;
      outline: none;
      &:hover { color: $purple; box-shadow: 3px 3px 7px $neu-2, -3px -3px 7px $white; }
    }
    :deep(.neu-select-dropdown) { min-width: 130px; }
  }
}

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

// ── Tooltip ──
.source-tooltip-global {
  position: fixed; z-index: 9999; max-width: 320px;
  background: rgba(26,31,46,.92); color: #fff; font-size: 12px;
  padding: 6px 12px; border-radius: 8px; pointer-events: auto;
  backdrop-filter: blur(8px); word-break: break-all;
}

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
