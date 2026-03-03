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
        <div
          v-if="shouldShowCover(record)"
          class="cover-img"
          :style="{ backgroundImage: `url(${record.thumbnailUrl || ''})` }"
          role="img"
          :aria-label="record.videoTitle || '封面'"
        >
          <img
            class="cover-img-probe"
            :src="record.thumbnailUrl || ''"
            alt=""
            @error="onImgError(record.id)"
          />
        </div>
        <div class="cover-placeholder" v-else>
          <el-icon :size="28"><VideoPlay /></el-icon>
          <span>暂无封面</span>
        </div>
        <span class="cover-duration" v-if="record.videoDuration">{{ formatDuration(record.videoDuration) }}</span>
        <!-- 收藏按钮（仅 COMPLETED 状态可用） -->
        <Transition name="fav-btn">
          <button
            v-if="record.status === 'COMPLETED'"
            class="cover-favorite"
            :class="{ 'is-favorited': favStore.isFavorited(record.id) }"
            :title="favStore.isFavorited(record.id) ? '取消收藏' : '收藏'"
            @click.stop="handleFavorite(record)"
          >
            <svg viewBox="0 0 24 24" :fill="favStore.isFavorited(record.id) ? 'currentColor' : 'none'" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26"/>
            </svg>
          </button>
        </Transition>
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
import { Check, VideoPlay, Calendar, View, MoreFilled, Edit, Download, RefreshRight, Close, Delete, School, FolderOpened } from '@element-plus/icons-vue'
import { formatDate, formatDuration, TASK_STATUS_TEXT, RISK_LEVEL_TEXT } from '@/types'
import type { AnalysisTaskVO, TaskStatus, RiskLevel } from '@/types'
import { ref } from 'vue'
import SourceBadge from './SourceBadge.vue'
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

const thumbnailLoadFailedMap = ref<Record<string, boolean>>({})

const shouldShowCover = (record: AnalysisTaskVO) => {
  return !!record.thumbnailUrl && !thumbnailLoadFailedMap.value[record.id]
}

const onImgError = (recordId: string) => {
  thumbnailLoadFailedMap.value[recordId] = true
}

const getExportingId = (record: AnalysisTaskVO) => record.resultId || ''

const handleFavorite = async (record: AnalysisTaskVO) => {
  const newState = await favStore.toggle(record.id)
  emit('favorite-change', record.id, newState)
}</script>

<style scoped lang="scss">
.records-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
  gap: 20px;
}

.record-card {
  background: var(--bg-card); border-radius: 12px; overflow: visible;
  display: flex; flex-direction: column; cursor: pointer; position: relative;
  border: 1px solid var(--border-color);
  box-shadow: none;
  transition:
    box-shadow .35s cubic-bezier(.4,0,.2,1),
    transform .35s cubic-bezier(.34,1.56,.64,1);

  &:hover {
    box-shadow: none;
    transform: translateY(-6px);
    .footer-actions { opacity: 1; pointer-events: auto; }
    .cover-favorite { opacity: 1; pointer-events: auto; }
    // 悬浮在来源区域时，隐藏操作按钮，避免与 tooltip 叠压
    &:has(.source-wrapper:hover) .footer-actions { opacity: 0; pointer-events: none; }
  }
  &.is-selected {
    box-shadow: none;
    transform: none;
  }
  &.is-failed { opacity: .8; }
}

.card-checkbox {
  position: absolute; top: 10px; left: 10px; z-index: 10;
  .checkbox-inner {
    width: 22px; height: 22px; border-radius: 8px;
    background: var(--bg-card); border: 1px solid var(--border-color);
    box-shadow: none;
    display: flex; align-items: center; justify-content: center;
    transition: all .2s; cursor: pointer;
    &.checked {
      background: linear-gradient(135deg, #409EFF, #7c9df7);
      box-shadow: none;
      border-color: #409EFF;
      color: #fff; font-size: 12px;
    }
  }
}

.card-cover {
  position: relative; width: 100%; padding-top: 56.25%;
  border-radius: 12px 12px 0 0; overflow: hidden;
  background: linear-gradient(135deg, #dde3ec, #c8d0e0);

  .cover-img {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    background-position: center;
    background-repeat: no-repeat;
    background-size: cover;

    .cover-img-probe {
      position: absolute;
      width: 1px;
      height: 1px;
      opacity: 0;
      pointer-events: none;
    }
  }
  .cover-placeholder {
    position: absolute; inset: 0; display: flex; flex-direction: column;
    align-items: center; justify-content: center; gap: 6px;
    color: var(--text-secondary); font-size: 11px; font-weight: 500;
    background: linear-gradient(145deg, #d8dfe8, #e8edf4);
    .el-icon { opacity: .4; }
  }
  .cover-duration {
    position: absolute; bottom: 8px; right: 8px;
    background: rgba(0,0,0,.7); color: #fff !important;
    font-size: 10px; font-weight: 600; padding: 2px 7px; border-radius: 5px;
  }
  .cover-progress-mask {
    position: absolute; inset: 0; background: rgba(0,0,0,.55);
    display: flex; flex-direction: column; align-items: center; justify-content: flex-end;
    padding-bottom: 14px; gap: 6px;
    .mask-progress-bar {
      position: absolute; bottom: 0; left: 0; height: 3px;
      background: linear-gradient(90deg, #409EFF, #7c9df7);
      transition: width .5s ease;
    }
    .mask-label { font-size: 11px; color: rgba(255,255,255,.9); font-weight: 600; }
  }
}

// 收藏按钮：独立顶层规则，确保 hover 权重能正确覆盖默认隐藏状态
.cover-favorite {
  position: absolute; top: 8px; right: 8px;
  width: 32px; height: 32px; border-radius: 50%; border: 1px solid rgba(255,255,255,.35); cursor: pointer;
  display: flex; align-items: center; justify-content: center;
  // 悬浮出现时：深色毛玻璃底座，保证在任何封面（含纯白）上都可见
  background: rgba(0,0,0,.4);
  backdrop-filter: blur(8px); -webkit-backdrop-filter: blur(8px);
  // 线框星星：纯白，带极微弱投影防极端情况
  color: #ffffff;
  opacity: 0; pointer-events: none;
  transition: opacity .22s ease, transform .3s cubic-bezier(.34,1.56,.64,1), background .3s, color .2s;
  svg {
    width: 14px; height: 14px;
    filter: drop-shadow(0 1px 2px rgba(0,0,0,.3));
  }
  &:hover {
    background: rgba(0,0,0,.55);
    transform: scale(1.1);
  }
  // 已收藏：常驻显示，深色底座 + 实心明黄星星
  &.is-favorited {
    opacity: 1 !important; pointer-events: auto !important;
    color: #FADB14;
    background: rgba(0,0,0,.5);
    border-color: rgba(255,255,255,.3);
    svg { filter: none; }
    &:hover { background: rgba(0,0,0,.65); transform: scale(1.1); }
  }
}

.card-body {
  padding: 14px 16px 10px; flex: 1; display: flex; flex-direction: column; gap: 8px;
}

.card-title-row {
  display: flex; align-items: flex-start; gap: 8px;
  .card-title {
    flex: 1; font-size: 14px; font-weight: 700; color: var(--text-primary); margin: 0; line-height: 1.4;
    display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden;
  }
}

.risk-badge {
  flex-shrink: 0; padding: 3px 9px; border-radius: 20px;
  font-size: 11px; font-weight: 700; white-space: nowrap;
  &.risk-high { background: linear-gradient(135deg, #ff6b6b, #e74c3c); color: #fff; box-shadow: none; }
  &.risk-medium { background: linear-gradient(135deg, #ffa94d, #e67e22); color: #fff; box-shadow: none; }
  &.risk-low { background: linear-gradient(135deg, #69db7c, #2ecc71); color: #fff; box-shadow: none; }
}

.status-pill {
  flex-shrink: 0; padding: 3px 9px; border-radius: 20px;
  font-size: 11px; font-weight: 600; white-space: nowrap;
  &.status-downloading { background: rgba(#1890ff,.12); color: #1890ff; }
  &.status-pending { background: rgba(#1890ff,.12); color: #1890ff; }
  &.status-processing { background: rgba(#e6a23c,.12); color: #c87d00; }
  &.status-failed { background: rgba(#e74c3c,.12); color: #e74c3c; }
  &.status-cancelled { background: rgba(138, 155, 176, .12); color: var(--text-secondary); }
}

.card-tags {
  display: flex; align-items: center; gap: 5px; flex-wrap: wrap; min-height: 22px;
  .tag {
    padding: 2px 8px; border-radius: 4px; font-size: 11px; font-weight: 500;
    &.kw { background: rgba(64, 158, 255, .08); color: #3a8ee6; border: 1px solid rgba(64, 158, 255, .15); }
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
  border-top: 1px solid var(--border-color);
  margin-top: auto; gap: 8px;
}

// 路径标签：来自子文件夹时显示
.folder-path-tag {
  display: inline-flex; align-items: center; gap: 5px;
  padding: 3px 8px; border-radius: 6px; border: none; cursor: pointer;
  background: rgba(64, 158, 255, .05); color: var(--text-secondary);
  font-size: 10.5px; font-weight: 500; line-height: 1.4;
  transition: background .15s, color .15s; align-self: flex-start;
  max-width: 100%; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
  svg { width: 11px; height: 11px; flex-shrink: 0; opacity: .6; }
  &:hover { background: rgba(64, 158, 255, .12); color: var(--color-primary); svg { opacity: 1; } }
}

.footer-meta {
  display: flex; align-items: center; gap: 0; flex: 1; min-width: 0; overflow: hidden;
  .meta-item {
    display: inline-flex; align-items: center; gap: 4px;
    font-size: 11px; color: var(--text-secondary); white-space: nowrap; flex-shrink: 1; min-width: 0;
    .el-icon { font-size: 11px; flex-shrink: 0; }
  }
  .date-item { flex-shrink: 0; }
  .meta-divider { width: 1px; height: 12px; background: var(--border-color); margin: 0 6px; flex-shrink: 0; }
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
  width: 30px; height: 30px; border: 1px solid var(--border-color); border-radius: 8px; background: var(--bg-card);
  box-shadow: none;
  cursor: pointer; display: flex; align-items: center; justify-content: center;
  color: var(--text-secondary); font-size: 14px; transition: all .25s;
  &:hover { color: var(--color-primary); box-shadow: none; }
  &.primary { color: var(--color-primary); }
}

.more-menu { position: relative; }
.dropdown-panel {
  position: absolute; right: 0; bottom: 38px; min-width: 150px;
  background: var(--bg-card); border-radius: 12px; padding: 6px;
  border: 1px solid var(--border-color);
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
</style>
