<template>
  <div class="analysis-page">
    <div class="header-actions">
      <div class="header-title-group">
        <h2 class="page-title">
          分析结果
          <span class="share-badge">分享只读</span>
        </h2>
      </div>
      <div v-if="analysisData" class="header-actions-right">
        <div class="view-mode-toggle">
          <button class="neu-btn" :class="{ active: viewMode === 'interactive' }" @click="viewMode = 'interactive'">
            <el-icon><VideoPlay /></el-icon>
            交互分析
          </button>
          <button class="neu-btn" :class="{ active: viewMode === 'report' }" @click="viewMode = 'report'">
            <el-icon><Document /></el-icon>
            报告视图
          </button>
        </div>
      </div>
    </div>

    <div
      class="neu-card"
      v-loading="loading"
      :element-loading-background="'var(--analysis-loading-mask-bg)'"
      v-if="loading"
    >
      <div style="height: 400px;"></div>
    </div>

    <div v-else-if="!analysisData" class="neu-card empty-card">
      <div class="empty-state">
        <div class="empty-icon">
          <el-icon :size="48"><DataAnalysis /></el-icon>
        </div>
        <h3>分享链接不存在或已失效</h3>
        <p>请让对方重新生成分享链接后再访问</p>
      </div>
    </div>

    <AnalysisContent
      v-else
      ref="analysisContentRef"
      :analysis-result="analysisData"
      :view-mode="viewMode"
      @update:view-mode="viewMode = $event"
      @export-pdf="handleExportPdf"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch, nextTick } from 'vue'
import { useRoute } from 'vue-router'
import { ElMessage } from 'element-plus'
import { VideoPlay, Document, DataAnalysis } from '@element-plus/icons-vue'
import AnalysisContent from '@/components/AnalysisContent.vue'
import { getSharedAnalysisResult } from '@/api'
import type { AnalysisResult } from '@/data/mockAnalysisResult'
import { useExportReport } from '@/composables/useExportReport'

const route = useRoute()
const viewMode = ref<'interactive' | 'report'>('interactive')
const loading = ref(false)
const analysisData = ref<AnalysisResult | null>(null)
const analysisContentRef = ref<InstanceType<typeof AnalysisContent> | null>(null)
const { exportReportByUrl } = useExportReport()

const loadSharedResult = async () => {
  const token = route.params.token as string | undefined
  if (!token) {
    analysisData.value = null
    return
  }

  loading.value = true
  try {
    const res = await getSharedAnalysisResult(token)
    if (res.code === 200 && res.data) {
      analysisData.value = res.data as AnalysisResult
    } else {
      analysisData.value = null
    }
  } catch {
    analysisData.value = null
    ElMessage.error('分享链接不存在或已失效')
  } finally {
    loading.value = false
  }
}

const waitReportRender = () => new Promise(resolve => setTimeout(resolve, 400))

const handleExportPdf = async () => {
  const fileName = analysisData.value.videoInfo?.fileName
    ? analysisData.value.videoInfo.fileName.replace(/\.[^.]+$/, '.pdf')
    : undefined

  if (analysisData.value?.reportPdfUrl) {
    await exportReportByUrl(analysisData.value.reportPdfUrl, fileName)
    return
  }

  const exporter = analysisContentRef.value?.exportToPdf
  if (!exporter) {
    ElMessage.warning('当前报告暂不可导出，请稍后重试')
    return
  }

  const previousViewMode = viewMode.value
  if (viewMode.value !== 'report') {
    viewMode.value = 'report'
    await nextTick()
    await waitReportRender()
  }

  try {
    await exporter()
  } finally {
    if (previousViewMode !== viewMode.value) {
      viewMode.value = previousViewMode
    }
  }
}

onMounted(() => {
  void loadSharedResult()
})

watch(() => route.params.token, () => {
  void loadSharedResult()
})
</script>

<style scoped lang="scss">
$bg: var(--bg-page);
$neu-1: var(--bg-hover);
$neu-2: var(--border-color);
$white: var(--bg-card);
$gray: var(--text-secondary);
$black: var(--text-primary);
$purple: #409EFF;

.analysis-page {
  min-height: 100vh;

  :deep(.el-loading-mask) {
    background-color: var(--analysis-loading-mask-bg, rgba(255, 255, 255, 0.78)) !important;
    backdrop-filter: blur(2px);
    -webkit-backdrop-filter: blur(2px);
    border: none !important;
  }

  .header-actions {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 16px;
    margin-left: 20px;

    .page-title {
      font-size: 22px;
      font-weight: 700;
      margin: 0;
      color: $black;
      display: flex;
      align-items: center;
      gap: 10px;

      .share-badge {
        display: inline-flex;
        align-items: center;
        padding: 3px 12px;
        border-radius: 8px;
        font-size: 13px;
        font-weight: 500;
        background: rgba(#409EFF, 0.12);
        color: #409EFF;
        letter-spacing: 0.5px;
      }
    }

    .header-actions-right {
      display: flex;
      align-items: center;
      gap: 16px;
    }

    .view-mode-toggle {
      display: flex;
      gap: 8px;
      padding: 4px;
      background: $neu-1;
      border-radius: 8px;
      border: 1px solid $neu-2;
      box-shadow: none;

      button {
        padding: 6px 12px;
        background: transparent;
        box-shadow: none;
        border-color: transparent;

        &.active {
          background: $purple;
          color: white !important;
          border-color: $purple;
        }
      }
    }

  }

  .empty-card {
    .empty-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 80px 20px;

      .empty-icon {
        margin-bottom: 20px;
        color: $gray;
      }

      h3 {
        font-size: 18px;
        font-weight: 500;
        color: $black;
        margin: 0 0 8px 0;
      }

      p {
        font-size: 14px;
        color: $gray;
        margin: 0;
      }
    }
  }

  .neu-btn {
    background: $white;
    border: 1px solid $neu-2;
    border-radius: 8px;
    cursor: pointer;
    transition: all 0.25s;
    box-shadow: none;
    color: $gray;
    font-family: 'Montserrat', sans-serif;
    padding: 12px 24px;
    font-size: 14px;
    display: flex;
    align-items: center;
    gap: 8px;

    &:hover {
      border-color: $purple;
      color: $purple;
    }

    &:active {
      transform: translateY(1px);
    }

    &.primary-btn {
      background: $purple;
      border-color: $purple;
      color: #fff !important;

      &:hover {
        background: #66b1ff;
        border-color: #66b1ff;
      }
    }
  }

  .neu-card {
    background: $white;
    border: 1px solid $neu-2;
    border-radius: 12px;
    padding: 20px;
    box-shadow: none;
    margin-bottom: 20px;
  }
}
</style>
