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
          <img v-if="record.thumbnailUrl" :src="record.thumbnailUrl" class="thumb-img" alt="封面" />
          <div class="thumb-placeholder" v-else>
            <el-icon><VideoPlay /></el-icon>
          </div>
          <!-- 进度遮罩 -->
          <div class="thumb-mask" v-if="['DOWNLOADING','PENDING','PROCESSING'].includes(record.status)">
            <div class="thumb-progress" :style="{ width: record.status === 'PENDING' ? '100%' : record.progress + '%' }"></div>
          </div>
          <!-- 来源角标 -->
          <span class="thumb-source" :class="record.sourceType === 'URL_IMPORT' ? 'url' : 'local'">
            <el-icon><Link v-if="record.sourceType === 'URL_IMPORT'" /><Upload v-else /></el-icon>
          </span>
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
        <span v-else class="location-empty">—</span>
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
import { Check, VideoPlay, Link, Upload, Calendar, View, MoreFilled, Edit, Download, RefreshRight, Close, Delete, School, FolderOpened } from '@element-plus/icons-vue'
import { formatDate, formatDuration, TASK_STATUS_TEXT, RISK_LEVEL_TEXT } from '@/types'
import type { AnalysisTaskVO, TaskStatus, RiskLevel } from '@/types'
import SourceBadge from './SourceBadge.vue'
import { computed } from 'vue'

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
}>()

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
</script>

<style scoped lang="scss">
$neu-1:  #ecf0f3;
$neu-2:  #c8d0e7;
$white:  #ffffff;
$gray:   #8a9bb0;
$black:  #1a1f2e;
$purple: #4b70e2;
$purple-light: #7c9df7;

$shadow-sm:  4px 4px 10px $neu-2, -4px -4px 10px $white;
$shadow-in:  inset 3px 3px 7px $neu-2, inset -3px -3px 7px $white;

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
  border-bottom: 1.5px solid rgba($neu-2, 0.5);

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
    color: #6b7a99;
    letter-spacing: 0.4px;
    white-space: nowrap;
  }

  // 通用表头单元格样式（覆盖 col-* 的内容样式）
  .hd-cell {
    font-size: 13px;
    font-weight: 700;
    color: #6b7a99;
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
  border-radius: 16px;
  background: $neu-1;
  box-shadow: 4px 4px 12px darken($neu-2, 4%), -4px -4px 12px $white;
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
    background: #f4f8ff;
    box-shadow: 5px 5px 14px darken($neu-2, 4%), -5px -5px 14px $white;
    transform: translateY(-1px);
  }

  // 选中态：稍深蓝背景 + 明显蓝色边框，与 hover 有清晰差异
  &.is-selected {
    background: #eaf0ff;
    box-shadow: $shadow-in;
    border: 1.5px solid rgba($purple, 0.35);
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
    width: 20px; height: 20px; border-radius: 6px;
    background: $neu-1; box-shadow: $shadow-sm;
    display: flex; align-items: center; justify-content: center;
    transition: all .2s; cursor: pointer; flex-shrink: 0;

    &.checked {
      background: linear-gradient(135deg, $purple, $purple-light);
      box-shadow: 2px 2px 6px rgba($purple, .35);
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
  border-radius: 10px;
  overflow: hidden;
  background: linear-gradient(135deg, #dde3ec, #c8d0e0);
  position: relative;
  box-shadow: inset 0 1px 4px rgba(0,0,0,.1), 2px 2px 6px rgba($neu-2, .6);

  .thumb-img {
    width: 100%; height: 100%; object-fit: cover; display: block;
  }

  .thumb-placeholder {
    width: 100%; height: 100%;
    display: flex; align-items: center; justify-content: center;
    color: $gray; font-size: 22px; opacity: .45;
  }

  .thumb-mask {
    position: absolute; inset: 0;
    background: rgba(0,0,0,.32);
    display: flex; align-items: flex-end;

    .thumb-progress {
      height: 3px;
      background: linear-gradient(90deg, $purple, $purple-light);
      transition: width .5s ease;
    }
  }

  .thumb-source {
    position: absolute; top: 5px; right: 5px;
    width: 18px; height: 18px; border-radius: 5px;
    display: flex; align-items: center; justify-content: center;
    font-size: 10px;
    backdrop-filter: blur(4px);

    &.local { background: rgba($purple, .85); color: #fff; }
    &.url   { background: rgba(#1890ff, .85); color: #fff; }
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
    color: $black;
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
  color: $gray;
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
  border: none;
  border-radius: 7px;
  background: $neu-1;
  box-shadow: 3px 3px 7px $neu-2, -3px -3px 7px $white;
  cursor: pointer;
  color: $gray;
  font-size: 12px;
  font-weight: 500;
  transition: all .2s;
  white-space: nowrap;

  .el-icon { font-size: 13px; }

  &:hover {
    color: $purple;
    box-shadow: 2px 2px 5px $neu-2, -2px -2px 5px $white;
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
  box-shadow: 0 2px 6px rgba(0,0,0,.12);

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
  &.status-cancelled   { background: rgba($gray,.1);   color: $gray;   border: 1px solid rgba($gray,.2); }
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
    color: darken($purple, 8%);
    border: 1px solid rgba($purple, .25);
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
  background: $neu-1;
  border-radius: 14px;
  padding: 6px;
  box-shadow: 10px 10px 24px darken($neu-2, 8%), -10px -10px 24px $white, 0 4px 16px rgba(0,0,0,.1);
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

.dropdown-enter-active { animation: dd-in .2s cubic-bezier(.34,1.56,.64,1); }
.dropdown-leave-active { animation: dd-out .15s ease; }
@keyframes dd-in { from { opacity: 0; transform: translateY(8px) scale(.95); } to { opacity: 1; transform: translateY(0) scale(1); } }
@keyframes dd-out { from { opacity: 1; } to { opacity: 0; transform: translateY(4px); } }

// ── 所在位置列 ────────────────────────────────────────────
.col-location {
  display: flex; align-items: center; overflow: hidden;
}

.location-btn {
  display: inline-flex; align-items: center; gap: 5px;
  padding: 3px 8px; border: none; border-radius: 6px; cursor: pointer;
  background: rgba($purple, .05); color: rgba($gray, .85);
  font-size: 11px; font-weight: 500; line-height: 1.4;
  transition: background .15s, color .15s;
  max-width: 100%; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
  svg { width: 11px; height: 11px; flex-shrink: 0; opacity: .6; }
  &:hover { background: rgba($purple, .12); color: $purple; svg { opacity: 1; } }
}

.location-empty {
  font-size: 12px; color: rgba($gray, .4);
}
</style>
