<template>
  <div class="records-grid">
    <div
      class="record-card"
      v-for="record in records" :key="record.id"
      :class="{
        'is-selected': selectedIds.has(record.id),
        'is-failed': record.status === 'FAILED'
      }"
      @click="emit('card-click', record)"
    >
      <!-- 批量勾选 -->
      <div class="card-checkbox" v-if="batchMode" @click.stop="emit('toggle-select', record.id)">
        <div class="checkbox-inner" :class="{ checked: selectedIds.has(record.id) }">
          <el-icon v-if="selectedIds.has(record.id)"><Check /></el-icon>
        </div>
      </div>

      <!-- ① 封面区 16:9 -->
      <div class="card-cover">
        <img
          v-if="record.thumbnailUrl"
          :src="record.thumbnailUrl"
          class="cover-img"
          alt="封面"
          @error="onImgError"
        />
        <video
          v-else-if="record.videoUrl"
          :src="record.videoUrl + '#t=1'"
          class="cover-img"
          preload="metadata"
          muted
        />
        <div class="cover-placeholder" v-if="!record.thumbnailUrl && !record.videoUrl">
          <el-icon :size="28"><VideoPlay /></el-icon>
          <span>暂无封面</span>
        </div>
        <span class="cover-duration" v-if="record.videoDuration">{{ formatDuration(record.videoDuration) }}</span>
        <span class="cover-source" :class="record.sourceType === 'URL_IMPORT' ? 'url' : 'local'">
          <el-icon><Link v-if="record.sourceType === 'URL_IMPORT'" /><Upload v-else /></el-icon>
        </span>
        <div class="cover-progress-mask" v-if="['DOWNLOADING','PENDING','PROCESSING'].includes(record.status)">
          <div class="mask-progress-bar" :style="{ width: record.status === 'PENDING' ? '100%' : record.progress + '%' }"></div>
          <span class="mask-label">
            {{ getStatusText(record.status) }}
            <template v-if="record.status !== 'PENDING'"> {{ record.progress }}%</template>
          </span>
        </div>
      </div>

      <!-- ② 卡片主体 -->
      <div class="card-body">
        <div class="card-title-row">
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

      <!-- ③ 卡片底部 -->
      <div class="card-footer">
        <!-- 路径标签：视频来自子文件夹时显示 -->
        <button
          v-if="getFolderPathTag(record)"
          class="folder-path-tag"
          :title="'跳转到：' + getFolderPathTag(record)"
          @click.stop="record.folderId && emit('navigate-folder', record.folderId)"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 19a2 2 0 01-2 2H4a2 2 0 01-2-2V5a2 2 0 012-2h5l2 3h9a2 2 0 012 2z"/></svg>
          {{ getFolderPathTag(record) }}
        </button>
        <div class="footer-meta">
          <span class="meta-item date-item">
            <el-icon><Calendar /></el-icon>{{ formatDate(record.gmtCreated) }}
          </span>
          <span class="meta-divider"></span>
          <div
            v-if="record.sourceType === 'URL_IMPORT' && record.sourceUrl"
            class="source-wrapper"
            @mouseenter="(e) => emit('show-tooltip', e, record.id, record.sourceUrl || '')"
            @mouseleave="emit('hide-tooltip')"
            @click.stop
          >
            <SourceBadge :url="record.sourceUrl" size="sm" />
          </div>
          <SourceBadge v-else :url="null" size="sm" />
        </div>
        <div class="footer-actions" @click.stop>
          <button
            v-if="record.videoUrl && record.status !== 'DOWNLOADING'"
            class="icon-btn" title="快速预览"
            @click.stop="emit('preview', record)"
          ><el-icon><View /></el-icon></button>
          <div class="more-menu">
            <button class="icon-btn" @click.stop="emit('toggle-menu', record.id)"><el-icon><MoreFilled /></el-icon></button>
            <Transition name="dropdown">
              <div class="dropdown-panel" v-if="openMenuId === record.id">
                <button class="dd-item" @click.stop="emit('rename', record)"><el-icon><Edit /></el-icon>重命名</button>
                <button class="dd-item" @click.stop="emit('move-to-folder', record)"><el-icon><FolderOpened /></el-icon>移动到文件夹</button>
                <button class="dd-item" v-if="record.status === 'COMPLETED' && record.resultId" @click.stop="emit('export', record)">
                  <el-icon><Download /></el-icon>
                  {{ exportingIds.has(getExportingId(record)) ? '导出中...' : '导出报告' }}
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
  </div>
</template>

<script setup lang="ts">
import { Check, VideoPlay, Link, Upload, Calendar, View, MoreFilled, Edit, Download, RefreshRight, Close, Delete, School, FolderOpened } from '@element-plus/icons-vue'
import { formatDate, formatDuration, TASK_STATUS_TEXT, RISK_LEVEL_TEXT } from '@/types'
import type { AnalysisTaskVO, TaskStatus, RiskLevel } from '@/types'
import SourceBadge from './SourceBadge.vue'

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

/**
 * 计算视频的路径标签
 * 只有当视频所在文件夹与当前激活文件夹不同时才显示
 */
const getFolderPathTag = (record: AnalysisTaskVO): string | null => {
  if (!record.folderId || !record.folderName) return null
  const activeId = props.activeFolderId
  // 全部视图或未分类视图：显示文件夹名
  if (!activeId || activeId === '__ALL__' || activeId === '__UNCATEGORIZED__') {
    return record.folderName
  }
  // 当前文件夹与视频所在文件夹相同：不显示
  if (activeId === record.folderId) return null
  // 视频来自子文件夹：显示文件夹名
  return record.folderName
}

const getStatusClass = (status: string) => ({
  DOWNLOADING: 'status-downloading', PENDING: 'status-pending',
  PROCESSING: 'status-processing', COMPLETED: 'status-completed',
  FAILED: 'status-failed', CANCELLED: 'status-cancelled'
}[status] || 'status-pending')

const getStatusText = (status: string) => TASK_STATUS_TEXT[status as TaskStatus] || status
const getRiskText = (level: string | null | undefined) => level ? (RISK_LEVEL_TEXT[level as RiskLevel] || level) : ''

const onImgError = (e: Event) => {
  const t = e.target as HTMLImageElement
  t.style.display = 'none'
  ;(t.nextElementSibling as HTMLElement)?.removeAttribute('style')
}

const getExportingId = (record: AnalysisTaskVO) => record.resultId || ''</script>

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

.records-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
  gap: 20px;
}

.record-card {
  background: $neu-1; border-radius: 18px; overflow: visible;
  display: flex; flex-direction: column; cursor: pointer; position: relative;
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
    .footer-actions { opacity: 1; pointer-events: auto; }
    // 悬浮在来源区域时，隐藏操作按钮，避免与 tooltip 叠压
    &:has(.source-wrapper:hover) .footer-actions { opacity: 0; pointer-events: none; }
  }

  &.is-selected {
    box-shadow: $shadow-in, 0 0 0 2.5px rgba($purple,.4);
    transform: none;
  }
  &.is-failed { opacity: .8; }
}

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

.card-cover {
  position: relative; width: 100%; padding-top: 56.25%;
  border-radius: 18px 18px 0 0; overflow: hidden;
  background: linear-gradient(135deg, #dde3ec, #c8d0e0);
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

.risk-badge {
  flex-shrink: 0; padding: 3px 9px; border-radius: 20px;
  font-size: 11px; font-weight: 700; white-space: nowrap;
  &.risk-high { background: linear-gradient(135deg, #ff6b6b, #e74c3c); color: #fff; box-shadow: 2px 2px 6px rgba(#e74c3c,.35); }
  &.risk-medium { background: linear-gradient(135deg, #ffa94d, #e67e22); color: #fff; box-shadow: 2px 2px 6px rgba(#e67e22,.35); }
  &.risk-low { background: linear-gradient(135deg, #69db7c, #2ecc71); color: #fff; box-shadow: 2px 2px 6px rgba(#2ecc71,.35); }
}

.status-pill {
  flex-shrink: 0; padding: 3px 9px; border-radius: 20px;
  font-size: 11px; font-weight: 600; white-space: nowrap;
  &.status-downloading { background: rgba(#1890ff,.12); color: #1890ff; }
  &.status-pending { background: rgba(#1890ff,.12); color: #1890ff; }
  &.status-processing { background: rgba(#e6a23c,.12); color: #c87d00; }
  &.status-failed { background: rgba(#e74c3c,.12); color: #e74c3c; }
  &.status-cancelled { background: rgba($gray,.12); color: $gray; }
}

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

.card-footer {
  position: relative;
  display: flex; flex-direction: column; align-items: stretch;
  padding: 10px 12px 14px 16px;
  border-top: 1px solid rgba($neu-2,.6);
  margin-top: auto; gap: 8px;
}

// 路径标签：来自子文件夹时显示
.folder-path-tag {
  display: inline-flex; align-items: center; gap: 5px;
  padding: 3px 8px; border-radius: 6px; border: none; cursor: pointer;
  background: rgba($purple, .05); color: rgba($gray, .85);
  font-size: 10.5px; font-weight: 500; line-height: 1.4;
  transition: background .15s, color .15s; align-self: flex-start;
  max-width: 100%; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
  svg { width: 11px; height: 11px; flex-shrink: 0; opacity: .6; }
  &:hover { background: rgba($purple, .12); color: $purple; svg { opacity: 1; } }
}

.footer-meta {
  display: flex; align-items: center; gap: 0; flex: 1; min-width: 0; overflow: hidden;
  .meta-item {
    display: inline-flex; align-items: center; gap: 4px;
    font-size: 11px; color: $gray; white-space: nowrap; flex-shrink: 1; min-width: 0;
    .el-icon { font-size: 11px; flex-shrink: 0; }
  }
  .date-item { flex-shrink: 0; }
  .meta-divider { width: 1px; height: 12px; background: rgba($neu-2,.8); margin: 0 6px; flex-shrink: 0; }
}

.footer-actions {
  position: absolute; right: 7px; bottom: 14px;
  display: flex; align-items: center; gap: 4px;
  opacity: 0; transition: opacity .25s;
  pointer-events: none;
}

.source-wrapper {
  position: relative; display: inline-flex; align-items: center;
  flex-shrink: 1; min-width: 0; overflow: hidden; cursor: default;
  &:hover :deep(.source-badge) { opacity: .75; }
}

.icon-btn {
  width: 30px; height: 30px; border: none; border-radius: 8px; background: $neu-1;
  box-shadow: 3px 3px 7px $neu-2, -3px -3px 7px $white;
  cursor: pointer; display: flex; align-items: center; justify-content: center;
  color: $gray; font-size: 14px; transition: all .25s;
  &:hover { color: $purple; box-shadow: 2px 2px 5px $neu-2, -2px -2px 5px $white; }
  &.primary { color: $purple; }
}

.more-menu { position: relative; }
.dropdown-panel {
  position: absolute; right: 0; bottom: 38px; min-width: 150px;
  background: $neu-1; border-radius: 14px; padding: 6px;
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
</style>
