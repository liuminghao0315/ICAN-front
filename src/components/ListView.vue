<template>
  <div class="list-view">
    <!-- 表头 -->
    <div class="list-header" :class="{ 'has-checkbox': batchMode, 'has-location': showLocationCol }">
      <div v-if="batchMode" class="col-checkbox"></div>
      <!-- "文件"放在 col-thumb 格，文字从缩略图左边缘起始，天然对齐 -->
      <div class="col-thumb hd-cell">文件</div>
      <div class="col-info"></div>
      <div class="col-duration hd-cell">时长</div>
      <div class="col-source hd-cell">来源</div>
      <div class="col-location hd-cell" v-if="showLocationCol">所在位置</div>
      <div class="col-date hd-cell">日期</div>
      <div class="col-actions hd-cell hd-actions">操作</div>
    </div>

    <div
      class="list-row"
      v-for="record in records" :key="record.id"
      :class="{
        'is-selected': selectedIds.has(record.id),
        'is-failed': record.status === 'FAILED',
        'has-checkbox': batchMode,
        'has-location': showLocationCol
      }"
      @click="emit('card-click', record)"
    >
      <!-- 批量勾选 -->
      <div class="col-checkbox" v-if="batchMode" @click.stop="emit('toggle-select', record.id)">
        <div class="checkbox-inner" :class="{ checked: selectedIds.has(record.id) }">
          <el-icon v-if="selectedIds.has(record.id)"><Check /></el-icon>
        </div>
      </div>

      <!-- 缩略图 -->
      <div class="col-thumb">
        <div class="thumb-wrap">
          <div
            v-if="shouldShowThumb(record)"
            class="thumb-img"
            :style="{ backgroundImage: `url(${record.thumbnailUrl || ''})` }"
            role="img"
            :aria-label="record.videoTitle || '封面'"
          >
            <img
              class="thumb-img-probe"
              :src="record.thumbnailUrl || ''"
              alt=""
              @error="onThumbError(record.id)"
            />
          </div>
          <div class="thumb-placeholder" v-else>
            <el-icon><VideoPlay /></el-icon>
          </div>
          <!-- 进度遮罩 -->
          <div class="thumb-mask" v-if="['DOWNLOADING','PENDING','PROCESSING'].includes(record.status)">
            <div class="thumb-progress" :style="{ width: record.status === 'PENDING' ? '100%' : record.progress + '%' }"></div>
          </div>
          <!-- 收藏按钮 -->
          <Transition name="fav-btn">
            <button
              v-if="record.status === 'COMPLETED'"
              class="thumb-favorite"
              :class="{ 'is-favorited': favStore.isFavorited(record.id) }"
              :title="favStore.isFavorited(record.id) ? '取消收藏' : '收藏'"
              @click.stop="handleFavorite(record)"
            >
              <svg viewBox="0 0 24 24" :fill="favStore.isFavorited(record.id) ? 'currentColor' : 'none'" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26"/>
              </svg>
            </button>
          </Transition>
        </div>
      </div>

      <!-- 标题 + 标签 -->
      <div class="col-info">
        <div class="row-title" :title="record.videoTitle">{{ record.videoTitle || '未命名' }}</div>
        <div class="row-tags">
          <!-- 风险等级：高优先级气泡 -->
          <span
            v-if="record.status === 'COMPLETED' && record.riskLevel"
            class="risk-badge"
            :class="'risk-' + record.riskLevel.toLowerCase()"
          >{{ getRiskText(record.riskLevel) }}</span>
          <!-- 状态胶囊（非完成态） -->
          <span v-else class="status-pill" :class="getStatusClass(record.status)">
            {{ getStatusText(record.status) }}
            <template v-if="['DOWNLOADING','PROCESSING'].includes(record.status) && record.progress"> {{ record.progress }}%</template>
          </span>
          <!-- 业务标签：低权重 -->
          <template v-if="record.status === 'COMPLETED'">
            <span v-for="kw in (record.keywords || []).slice(0, 2)" :key="kw" class="tag kw">{{ kw }}</span>
            <span v-if="record.universityName" class="tag uni">
              <el-icon><School /></el-icon>{{ record.universityName }}
            </span>
          </template>
          <span v-if="record.errorMessage && record.status === 'FAILED'" class="tag error">{{ record.errorMessage.slice(0, 30) }}</span>
        </div>
      </div>

      <!-- 时长 -->
      <div class="col-duration">
        <el-icon><VideoPlay /></el-icon>
        <span>{{ record.videoDuration ? formatDuration(record.videoDuration) : '—' }}</span>
      </div>

      <!-- 来源 -->
      <div
        v-if="record.sourceType === 'URL_IMPORT' && record.sourceUrl"
        class="col-source url-source"
        @mouseenter="(e) => emit('show-tooltip', e, record.id, record.sourceUrl || '')"
        @mouseleave="emit('hide-tooltip')"
        @click.stop
      >
        <SourceBadge :url="record.sourceUrl" size="sm" />
      </div>
      <div v-else class="col-source">
        <SourceBadge :url="null" size="sm" />
      </div>

      <!-- 所在位置列 -->
      <div class="col-location" v-if="showLocationCol" @click.stop>
        <button
          v-if="record.folderId && record.folderName"
          class="location-btn"
          :title="'跳转到：' + record.folderName"
          @click.stop="emit('navigate-folder', record.folderId)"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 19a2 2 0 01-2 2H4a2 2 0 01-2-2V5a2 2 0 012-2h5l2 3h9a2 2 0 012 2z"/></svg>
          {{ record.folderName }}
        </button>
        <span v-else class="location-btn is-uncategorized" title="未分类">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 19a2 2 0 01-2 2H4a2 2 0 01-2-2V5a2 2 0 012-2h5l2 3h9a2 2 0 012 2z"/></svg>
          未分类
        </span>
      </div>

      <!-- 上传日期 -->
      <div class="col-date">
        <el-icon><Calendar /></el-icon>
        <span>{{ formatDate(record.gmtCreated) }}</span>
      </div>

      <!-- 操作列（固定，始终可见） -->
      <div class="col-actions" @click.stop>
        <button
          v-if="record.videoUrl && record.status !== 'DOWNLOADING'"
          class="action-btn" title="快速预览"
          @click.stop="emit('preview', record)"
        >
          <el-icon><View /></el-icon>
        </button>
        <div class="more-menu">
          <button class="action-btn" @click.stop="emit('toggle-menu', record.id)">
            <el-icon><MoreFilled /></el-icon>
          </button>
          <Transition name="dropdown">
            <div class="dropdown-panel" v-if="openMenuId === record.id">
              <button class="dd-item" @click.stop="emit('rename', record)"><el-icon><Edit /></el-icon>重命名</button>
              <button class="dd-item" @click.stop="emit('move-to-folder', record)"><el-icon><FolderOpened /></el-icon>移动到文件夹</button>
              <button class="dd-item" v-if="record.status === 'COMPLETED' && record.resultId" @click.stop="emit('export', record)">
                <el-icon><Download /></el-icon>
                {{ exportingIds.has(record.resultId || '') ? '导出中...' : '导出报告' }}
              </button>
              <button class="dd-item" v-if="record.status === 'FAILED' && record.failureType === 'DOWNLOAD_FAILED'" @click.stop="emit('retry-download', record)">
                <el-icon><RefreshRight /></el-icon>重试下载
              </button>
              <button class="dd-item" v-if="(record.status === 'FAILED' && record.failureType !== 'DOWNLOAD_FAILED') || record.status === 'CANCELLED'" @click.stop="emit('reanalyze', record)">
                <el-icon><RefreshRight /></el-icon>重新分析
              </button>
              <button class="dd-item" v-if="['PENDING','PROCESSING','DOWNLOADING'].includes(record.status)" @click.stop="emit('cancel', record)">
                <el-icon><Close /></el-icon>取消任务
              </button>
              <div class="dd-divider"></div>
              <button class="dd-item danger" @click.stop="emit('delete', record)"><el-icon><Delete /></el-icon>删除</button>
            </div>
          </Transition>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { Check, VideoPlay, Calendar, View, MoreFilled, Edit, Download, RefreshRight, Close, Delete, School, FolderOpened } from '@element-plus/icons-vue'
import { formatDate, formatDuration, TASK_STATUS_TEXT, RISK_LEVEL_TEXT } from '@/types'
import type { AnalysisTaskVO, TaskStatus, RiskLevel } from '@/types'
import SourceBadge from './SourceBadge.vue'
import { computed, ref } from 'vue'
import { useFavoritesStore } from '@/stores/favorites'

const favStore = useFavoritesStore()

const props = defineProps<{
  records: AnalysisTaskVO[]
  batchMode: boolean
  selectedIds: Set<string>
  openMenuId: string | null
  exportingIds: Set<string>
  activeFolderId?: string
  folderBreadcrumbs?: { id: string; name: string }[]
}>()

const emit = defineEmits<{
  'card-click': [record: AnalysisTaskVO]
  'toggle-select': [id: string]
  'toggle-menu': [id: string]
  'view-analysis': [record: AnalysisTaskVO]
  'preview': [record: AnalysisTaskVO]
  'rename': [record: AnalysisTaskVO]
  'move-to-folder': [record: AnalysisTaskVO]
  'export': [record: AnalysisTaskVO]
  'retry-download': [record: AnalysisTaskVO]
  'reanalyze': [record: AnalysisTaskVO]
  'cancel': [record: AnalysisTaskVO]
  'delete': [record: AnalysisTaskVO]
  'show-tooltip': [event: MouseEvent, id: string, url: string]
  'hide-tooltip': []
  'navigate-folder': [folderId: string]
  'favorite-change': [id: string, isFavorited: boolean]
}>()

const handleFavorite = async (record: AnalysisTaskVO) => {
  const newState = await favStore.toggle(record.id)
  emit('favorite-change', record.id, newState)
}

// 是否显示"所在位置"列：在全部视图或父文件夹视图下显示
const showLocationCol = computed(() => {
  const id = props.activeFolderId
  // 全部视图 或 有文件夹上下文时显示
  return !id || id === '__ALL__' || (!!id && !id.startsWith('__'))
})

const getStatusClass = (status: string) => ({
  DOWNLOADING: 'status-downloading', PENDING: 'status-pending',
  PROCESSING: 'status-processing', COMPLETED: 'status-completed',
  FAILED: 'status-failed', CANCELLED: 'status-cancelled'
}[status] || 'status-pending')

const getStatusText = (status: string) => TASK_STATUS_TEXT[status as TaskStatus] || status
const getRiskText = (level: string | null | undefined) => level ? (RISK_LEVEL_TEXT[level as RiskLevel] || level) : ''

const thumbnailLoadFailedMap = ref<Record<string, boolean>>({})

const shouldShowThumb = (record: AnalysisTaskVO) => {
  return !!record.thumbnailUrl && !thumbnailLoadFailedMap.value[record.id]
}

const onThumbError = (recordId: string) => {
  thumbnailLoadFailedMap.value[recordId] = true
}
</script>

<style scoped lang="scss">
// ── Grid 列定义（CSS 变量，方便批量模式动态切换）──────────
// 无批量：[缩略图] [标题] [时长] [来源] [日期] [操作]
$cols-normal: 112px 1fr 90px 120px 130px 100px;
// 批量模式：[勾选] + 以上
$cols-batch:  32px 112px 1fr 90px 120px 130px 100px;
// 含位置列：[缩略图] [标题] [时长] [来源] [位置] [日期] [操作]
$cols-location: 112px 1fr 90px 120px 110px 130px 100px;
$cols-location-batch: 32px 112px 1fr 90px 120px 110px 130px 100px;

// ── 容器 ──────────────────────────────────────────────────
.list-view {
  display: flex;
  flex-direction: column;
  gap: 10px;  // 行间距：呼吸感
}

// ── 表头 ──────────────────────────────────────────────────
.list-header {
  display: grid;
  grid-template-columns: $cols-normal;
  align-items: center;
  gap: 16px;
  // 表头左侧与行内容对齐：行有 padding: 12px 20px，表头同步
  padding: 0 20px 8px;
  border-bottom: 1.5px solid var(--border-color);

  &.has-checkbox {
    grid-template-columns: $cols-batch;
  }
  &.has-location {
    grid-template-columns: $cols-location;
  }
  &.has-checkbox.has-location {
    grid-template-columns: $cols-location-batch;
  }

  > div {
    font-size: 13px;
    font-weight: 700;
    color: var(--text-secondary);
    letter-spacing: 0.4px;
    white-space: nowrap;
  }

  // 通用表头单元格样式（覆盖 col-* 的内容样式）
  .hd-cell {
    font-size: 13px;
    font-weight: 700;
    color: var(--text-secondary);
    letter-spacing: 0.4px;
    white-space: nowrap;
    // 重置 col-thumb / col-duration 等的 flex 布局，让文字直接显示
    display: block;
    height: auto;
    width: auto;
    background: none;
    box-shadow: none;
    border-radius: 0;
    padding: 0;
  }

  // "操作"列：右对齐，与按钮组右边缘对齐
  .hd-actions {
    text-align: right;
    margin-right: 36px;
  }
}

// ── 行 ────────────────────────────────────────────────────
.list-row {
  display: grid;
  grid-template-columns: $cols-normal;
  align-items: center;
  gap: 16px;
  padding: 12px 20px;
  border-radius: 8px;
  background: var(--bg-card);
  border: 1px solid var(--border-color);
  box-shadow: none;
  cursor: pointer;
  transition: background .18s ease, box-shadow .18s ease, transform .18s ease;
  position: relative;

  &.has-checkbox {
    grid-template-columns: $cols-batch;
  }
  &.has-location {
    grid-template-columns: $cols-location;
  }
  &.has-checkbox.has-location {
    grid-template-columns: $cols-location-batch;
  }

  // hover：极淡蓝背景，与选中态明显区分
  &:hover {
    background: var(--bg-hover);
    box-shadow: none;
    transform: translateY(-1px);
  }

  // 选中态：稍深蓝背景 + 明显蓝色边框，与 hover 有清晰差异
  &.is-selected {
    background: var(--bg-hover);
    border: 1.5px solid rgba(64, 158, 255, 0.35);
    box-shadow: none;
    transform: none;
  }

  &.is-failed { opacity: .75; }
}

// ── 勾选列 ────────────────────────────────────────────────
.col-checkbox {
  display: flex;
  align-items: center;
  justify-content: center;

  .checkbox-inner {
    width: 20px; height: 20px; border-radius: 8px;
    background: var(--bg-card);
    border: 1px solid var(--border-color);
    box-shadow: none;
    display: flex; align-items: center; justify-content: center;
    transition: all .2s; cursor: pointer; flex-shrink: 0;

    &.checked {
      background: var(--color-primary);
      border-color: var(--color-primary);
      box-shadow: none;
      color: #fff; font-size: 11px;
    }
  }
}

// ── 缩略图列 ──────────────────────────────────────────────
.col-thumb {
  width: 112px;
  flex-shrink: 0;
}

.thumb-wrap {
  width: 112px;
  height: 66px;   // 16:9 比例，撑起行高
  border-radius: 8px;
  overflow: hidden;
  background: linear-gradient(135deg, #dde3ec, #c8d0e0);
  position: relative;
  border: 1px solid var(--border-color);
  box-shadow: none;

  .thumb-img {
    position: relative;
    width: 100%;
    height: 100%;
    background-position: center;
    background-repeat: no-repeat;
    background-size: cover;

    .thumb-img-probe {
      position: absolute;
      width: 1px;
      height: 1px;
      opacity: 0;
      pointer-events: none;
    }
  }

  .thumb-placeholder {
    width: 100%; height: 100%;
    display: flex; align-items: center; justify-content: center;
    color: var(--text-secondary); font-size: 22px; opacity: .45;
  }

  .thumb-mask {
    position: absolute; inset: 0;
    background: rgba(0,0,0,.32);
    display: flex; align-items: flex-end;

    .thumb-progress {
      height: 3px;
      background: linear-gradient(90deg, #409EFF, #7c9df7);
      transition: width .5s ease;
    }
  }

  .thumb-favorite {
    position: absolute; top: 5px; right: 5px;
    width: 22px; height: 22px; border-radius: 50%;
    border: 1px solid rgba(255,255,255,.35);
    display: flex; align-items: center; justify-content: center;
    background: rgba(0,0,0,.4);
    cursor: pointer; color: #fff; opacity: 0; pointer-events: none;
    transition: opacity .2s, transform .2s, background .2s;
    svg { width: 11px; height: 11px; filter: drop-shadow(0 1px 2px rgba(0,0,0,.5)); }

    &:hover {
      background: rgba(0,0,0,.6);
      transform: scale(1.15);
    }

    &.is-favorited {
      opacity: 1 !important; pointer-events: auto !important;
      color: #FADB14;
      background: rgba(0,0,0,.5);
      border-color: rgba(255,255,255,.3);
    }
  }

  &:hover .thumb-favorite {
    opacity: 1;
    pointer-events: auto;
  }
}

// ── 标题 + 标签列 ─────────────────────────────────────────
.col-info {
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 6px;

  .row-title {
    font-size: 13px;
    font-weight: 600;
    color: var(--text-primary);
    line-height: 1.4;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .row-tags {
    display: flex;
    align-items: center;
    gap: 5px;
    flex-wrap: nowrap;
    overflow: hidden;
  }
}

// ── 时长 / 来源 / 日期 列（严格对齐） ─────────────────────
.col-duration,
.col-source,
.col-date {
  display: flex;
  align-items: center;
  gap: 5px;
  font-size: 12px;
  color: var(--text-secondary);
  white-space: nowrap;
  overflow: hidden;

  .el-icon { font-size: 12px; flex-shrink: 0; opacity: .7; }
  span { overflow: hidden; text-overflow: ellipsis; }
}

.col-source.url-source {
  cursor: default;
  transition: opacity .18s;

  &:hover :deep(.source-badge) { opacity: .75; }
}

// ── 操作列 ────────────────────────────────────────────────
.col-actions {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 6px;
  flex-shrink: 0;
  // 始终可见，不再依赖 hover opacity
  opacity: 1;
}

// ── 操作按钮 ──────────────────────────────────────────────
.action-btn {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  height: 28px;
  padding: 0 8px;
  border: 1px solid var(--border-color);
  border-radius: 8px;
  background: var(--bg-card);
  box-shadow: none;
  cursor: pointer;
  color: var(--text-secondary);
  font-size: 12px;
  font-weight: 500;
  transition: all .2s;
  white-space: nowrap;

  .el-icon { font-size: 13px; }

  &:hover {
    color: var(--color-primary);
    border-color: var(--color-primary);
    box-shadow: none;
    transform: translateY(-1px);
  }
}

// ── 风险 Badge（高优先级，气泡感强） ──────────────────────
.risk-badge {
  flex-shrink: 0;
  padding: 3px 10px;
  border-radius: 20px;
  font-size: 11px;
  font-weight: 700;
  white-space: nowrap;
  letter-spacing: 0.3px;
  box-shadow: none;

  &.risk-high   { background: linear-gradient(135deg, #ff6b6b, #e74c3c); color: #fff; }
  &.risk-medium { background: linear-gradient(135deg, #ffa94d, #e67e22); color: #fff; }
  &.risk-low    { background: linear-gradient(135deg, #69db7c, #2ecc71); color: #fff; }
}

// ── 状态胶囊 ──────────────────────────────────────────────
.status-pill {
  flex-shrink: 0;
  padding: 2px 8px;
  border-radius: 20px;
  font-size: 10px;
  font-weight: 600;
  white-space: nowrap;

  &.status-downloading { background: rgba(#1890ff,.1); color: #1890ff; border: 1px solid rgba(#1890ff,.2); }
  &.status-pending     { background: rgba(#1890ff,.1); color: #1890ff; border: 1px solid rgba(#1890ff,.2); }
  &.status-processing  { background: rgba(#e6a23c,.1); color: #c87d00; border: 1px solid rgba(#e6a23c,.2); }
  &.status-failed      { background: rgba(#e74c3c,.1); color: #e74c3c; border: 1px solid rgba(#e74c3c,.2); }
  &.status-cancelled   { background: rgba(138, 155, 176, .1); color: var(--text-secondary); border: 1px solid rgba(138, 155, 176, .2); }
}

// ── 业务标签（低权重：极简边框风格） ─────────────────────
.tag {
  padding: 2px 7px;
  border-radius: 5px;
  font-size: 10px;
  font-weight: 500;
  white-space: nowrap;
  // 统一降低视觉权重
  opacity: .85;

  &.kw {
    background: transparent;
    color: #3a8ee6;
    border: 1px solid rgba(64, 158, 255, .25);
  }

  &.uni {
    display: inline-flex;
    align-items: center;
    gap: 3px;
    background: transparent;
    color: #9a6200;
    border: 1px solid rgba(#e6a23c, .3);
    .el-icon { font-size: 10px; }
  }

  &.error {
    background: transparent;
    color: #c0392b;
    border: 1px solid rgba(#e74c3c, .25);
  }
}

// ── 更多菜单 ──────────────────────────────────────────────
.more-menu { position: relative; }

.dropdown-panel {
  position: absolute;
  right: 0;
  bottom: 36px;
  min-width: 150px;
  background: var(--bg-card);
  border: 1px solid var(--border-color);
  border-radius: 8px;
  padding: 6px;
  box-shadow: none;
  z-index: 200;
}

.dd-item {
  display: flex; align-items: center; gap: 10px; width: 100%; padding: 9px 13px;
  border: none; border-radius: 8px; background: transparent; color: var(--text-primary);
  font-size: 13px; font-family: 'Montserrat', sans-serif; cursor: pointer; transition: all .2s;
  .el-icon { font-size: 14px; color: var(--text-secondary); }
  &:hover { background: var(--bg-hover); .el-icon { color: var(--color-primary); } }
  &.danger { color: #e74c3c; .el-icon { color: #e74c3c; } &:hover { background: rgba(#e74c3c,.06); } }
}

.dd-divider { height: 1px; background: var(--border-color); margin: 4px 8px; }

.dropdown-enter-active { animation: dd-in .2s cubic-bezier(.34,1.56,.64,1); }
.dropdown-leave-active { animation: dd-out .15s ease; }
@keyframes dd-in { from { opacity: 0; transform: translateY(8px) scale(.95); } to { opacity: 1; transform: translateY(0) scale(1); } }
@keyframes dd-out { from { opacity: 1; } to { opacity: 0; transform: translateY(4px); } }

.fav-btn-enter-active { transition: opacity .2s, transform .2s cubic-bezier(.34,1.56,.64,1); }
.fav-btn-leave-active { transition: opacity .15s; }
.fav-btn-enter-from { opacity: 0; transform: scale(.6); }
.fav-btn-leave-to { opacity: 0; }

// ── 所在位置列 ────────────────────────────────────────────
.col-location {
  display: flex; align-items: center; overflow: hidden;
}

.location-btn {
  display: inline-flex; align-items: center; gap: 5px;
  padding: 3px 8px; border: 1px solid var(--border-color); border-radius: 8px; cursor: pointer;
  background: rgba(64, 158, 255, .05); color: var(--text-secondary);
  font-size: 11px; font-weight: 500; line-height: 1.4;
  transition: background .15s, color .15s, border-color .15s;
  max-width: 100%; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
  svg { width: 11px; height: 11px; flex-shrink: 0; opacity: .6; }
  &:hover { background: rgba(64, 158, 255, .12); color: var(--color-primary); border-color: var(--color-primary); svg { opacity: 1; } }
}

.location-btn.is-uncategorized {
  cursor: default;
  background: rgba(64, 158, 255, .05);
  color: var(--text-secondary);
  border-color: var(--border-color);
  pointer-events: none;
}
</style>
