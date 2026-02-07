<template>
  <div class="report-view" ref="reportContentRef">
    <!-- 报告标题 -->
    <div class="report-header">
      <h1 class="report-title">高校舆情视频分析报告</h1>
      
      <div class="report-info-grid">
        <div class="info-item">
          <span class="info-label">视频文件</span>
          <span class="info-value">{{ analysisData.videoInfo.fileName }}</span>
        </div>
        <div class="info-item">
          <span class="info-label">视频时长</span>
          <span class="info-value">{{ formatDuration(analysisData.videoInfo.duration) }}</span>
        </div>
        <div class="info-item">
          <span class="info-label">上传来源</span>
          <span class="info-value">{{ analysisData.videoInfo.uploadSource }}</span>
        </div>
      </div>
      
      <div v-if="analysisData.videoInfo.description" class="report-summary">
        <h3 class="summary-title">AI分析摘要</h3>
        <p class="summary-content">{{ analysisData.videoInfo.description }}</p>
      </div>
    </div>

    <!-- 核心分析结果 - 6个卡片 -->
    <div class="report-section">
      <h2 class="section-title">一、核心分析结果</h2>
      <div class="report-cards-grid">
        <!-- 1. 身份判定 -->
        <div class="report-card">
          <div class="card-header-flex">
            <div class="card-icon-small icon-bg-identity"><el-icon><User /></el-icon></div>
            <span class="card-title-small">身份判定</span>
          </div>
          <div class="card-value text-identity">{{ analysisData.identity.identityLabel }}</div>
          <div class="card-meta">置信度 {{ analysisData.identity.modalityFusion.finalScore }}%</div>
        </div>

        <!-- 2. 涉及高校 -->
        <div class="report-card">
          <div class="card-header-flex">
            <div class="card-icon-small icon-bg-uni"><el-icon><School /></el-icon></div>
            <span class="card-title-small">涉及高校</span>
          </div>
          <div class="card-value text-uni">{{ analysisData.university.universityName }}</div>
          <div class="card-meta">匹配度 {{ analysisData.university.modalityFusion.finalScore }}%</div>
        </div>

        <!-- 3. 内容主题 -->
        <div class="report-card">
          <div class="card-header-flex">
            <div class="card-icon-small icon-bg-topic"><el-icon><ChatDotRound /></el-icon></div>
            <span class="card-title-small">内容主题</span>
          </div>
          <div class="card-value text-topic">{{ analysisData.topic.topicCategory }}</div>
          <div class="card-meta">{{ analysisData.topic.topicSubCategory }}</div>
        </div>

        <!-- 4. 对学校态度 -->
        <div class="report-card">
          <div class="card-header-flex">
            <div class="card-icon-small" :class="getSentimentIconClass(getSentimentByScore((getAttitudeStatistics().negative / getAttitudeStatistics().total) * 100))">
              <el-icon><TrendCharts /></el-icon>
            </div>
            <span class="card-title-small">对学校态度</span>
          </div>
          <div class="card-value" :class="getSentimentTextClass(getSentimentByScore((getAttitudeStatistics().negative / getAttitudeStatistics().total) * 100))">
            {{ getSentimentLabel(getSentimentByScore((getAttitudeStatistics().negative / getAttitudeStatistics().total) * 100)) }}
          </div>
          <div class="card-meta">{{ getAttitudeStatistics().negative }}处负面，占比 {{ Math.round((getAttitudeStatistics().negative / getAttitudeStatistics().total) * 100) }}%</div>
        </div>

        <!-- 5. 潜在舆论风险 -->
        <div class="report-card">
          <div class="card-header-flex">
            <div class="card-icon-small" :class="getOpinionRiskIconClass(getRiskLevelByScore(analysisData.opinionRisk.modalityFusion.finalScore))">
              <el-icon><WarningFilled /></el-icon>
            </div>
            <span class="card-title-small">潜在舆论风险</span>
          </div>
          <div class="card-value" :class="getOpinionRiskTextClass(getRiskLevelByScore(analysisData.opinionRisk.modalityFusion.finalScore))">
            {{ analysisData.opinionRisk.riskLabel }}
          </div>
          <div class="card-meta">风险指数 {{ analysisData.opinionRisk.modalityFusion.finalScore }}分</div>
        </div>

        <!-- 6. 处置建议 -->
        <div class="report-card">
          <div class="card-header-flex">
            <div class="card-icon-small icon-bg-action"><el-icon><DocumentChecked /></el-icon></div>
            <span class="card-title-small">处置建议</span>
          </div>
          <div class="card-value text-action">{{ analysisData.action.actionSuggestion }}</div>
          <div class="card-meta">{{ analysisData.action.actionDetail }}</div>
        </div>
      </div>
    </div>

    <!-- 详细证据清单 -->
    <div class="report-section">
      <h2 class="section-title">二、详细证据清单</h2>
      
      <div v-for="(card, cardKey) in evidenceCards" :key="cardKey" class="evidence-section">
        <h3 class="evidence-section-title">
          <span class="evidence-badge-report">{{ card.label }}</span>
          <span class="evidence-count-report">{{ analysisData[cardKey]?.evidences?.length || 0 }}处证据</span>
        </h3>
        
        <div v-if="analysisData[cardKey]?.evidences && analysisData[cardKey].evidences.length > 0" class="evidence-list-report">
          <div v-for="(evidence, index) in analysisData[cardKey].evidences" :key="index" class="evidence-item-report">
            <div class="evidence-timeline-mark" :class="'mark-' + evidence.type"></div>
            <div class="evidence-content-report">
              <div class="evidence-header-report">
                <span class="evidence-type-badge" :class="'type-' + evidence.type">
                  {{ evidence.type === 'video' ? '📹 视频' : evidence.type === 'audio' ? '🎤 音频' : '📝 文本' }}
                </span>
                <span class="evidence-time-report">{{ formatTimeDisplay(evidence.timestamp) }}</span>
                <span class="evidence-confidence-report">{{ evidence.confidence }}%</span>
              </div>
              <div class="evidence-desc-report">{{ evidence.description }}</div>
              <div v-if="evidence.keyword" class="evidence-keyword-report">关键词："{{ evidence.keyword }}"</div>
            </div>
          </div>
        </div>
        <div v-else class="empty-evidence">
          <p>暂无证据数据</p>
        </div>
      </div>
    </div>

    <!-- 多模态融合分析 -->
    <div class="report-section">
      <h2 class="section-title">三、多模态融合分析</h2>
      <p class="section-desc">AI通过视频画面、音频声纹、文本内容三个维度进行综合分析，加权计算得出最终结果</p>
      
      <div v-for="(card, cardKey) in evidenceCards" :key="cardKey + '-fusion'" class="fusion-section">
        <div class="fusion-header-bar">
          <h3 class="fusion-title">{{ card.label }}</h3>
          <span class="fusion-result-badge" v-if="cardKey === 'attitude'">{{ getResultLabel(cardKey) }}：{{ getAttitudeStatistics().total }}处（{{ getAttitudeStatistics().positive }}正 {{ getAttitudeStatistics().neutral }}中 {{ getAttitudeStatistics().negative }}负）</span>
          <span class="fusion-result-badge" v-else>{{ getResultLabel(cardKey) }}：{{ analysisData[cardKey]?.modalityFusion?.finalScore || 0 }}%</span>
        </div>
        
        <!-- 统计类型卡片特殊处理 -->
        <div v-if="cardKey === 'attitude'" class="fusion-statistics">
          <div class="stats-summary">
            <div class="stats-item positive">
              <span class="stats-icon">✅</span>
              <span class="stats-label">正面</span>
              <span class="stats-count">{{ getAttitudeStatistics().positive }}次</span>
            </div>
            <div class="stats-item neutral">
              <span class="stats-icon">➖</span>
              <span class="stats-label">中性</span>
              <span class="stats-count">{{ getAttitudeStatistics().neutral }}次</span>
            </div>
            <div class="stats-item negative">
              <span class="stats-icon">❌</span>
              <span class="stats-label">负面</span>
              <span class="stats-count">{{ getAttitudeStatistics().negative }}次</span>
            </div>
          </div>
          <p class="stats-note">共分析{{ getAttitudeStatistics().total }}处情感表达，采用统计方法而非加权计算</p>
        </div>
        
        <!-- 加权计算类型 -->
        <div v-else class="fusion-grid">
          <div class="fusion-card video-fusion">
            <div class="fusion-header">
              <el-icon><VideoCamera /></el-icon>
              <span>视频模态</span>
            </div>
            <div class="fusion-score">{{ analysisData[cardKey]?.modalityFusion?.videoScore || 0 }}<span>分</span></div>
            <div class="fusion-meta">
              <span>贡献度 {{ (analysisData[cardKey]?.modalityFusion?.videoContribution || 0).toFixed(1) }}</span>
              <span>{{ getModalityEvidenceCount(cardKey, 'video') }}处证据</span>
            </div>
          </div>
          
          <div class="fusion-card audio-fusion">
            <div class="fusion-header">
              <el-icon><Microphone /></el-icon>
              <span>音频模态</span>
            </div>
            <div class="fusion-score">{{ analysisData[cardKey]?.modalityFusion?.audioScore || 0 }}<span>分</span></div>
            <div class="fusion-meta">
              <span>贡献度 {{ (analysisData[cardKey]?.modalityFusion?.audioContribution || 0).toFixed(1) }}</span>
              <span>{{ getModalityEvidenceCount(cardKey, 'audio') }}处证据</span>
            </div>
          </div>
          
          <div class="fusion-card text-fusion">
            <div class="fusion-header">
              <el-icon><ChatLineRound /></el-icon>
              <span>文本模态</span>
            </div>
            <div class="fusion-score">{{ analysisData[cardKey]?.modalityFusion?.textScore || 0 }}<span>分</span></div>
            <div class="fusion-meta">
              <span>贡献度 {{ (analysisData[cardKey]?.modalityFusion?.textContribution || 0).toFixed(1) }}</span>
              <span>{{ getModalityEvidenceCount(cardKey, 'text') }}处证据</span>
            </div>
          </div>
          
          <div class="fusion-card result-fusion">
            <div class="fusion-header">
              <el-icon><Check /></el-icon>
              <span>融合结果</span>
            </div>
            <div class="fusion-result">{{ analysisData[cardKey]?.modalityFusion?.finalScore || 0 }}%</div>
            <div class="fusion-formula">{{ getFusionFormula(cardKey) }}</div>
          </div>
        </div>
      </div>
    </div>

    <!-- 高风险台词定位 -->
    <div class="report-section">
      <h2 class="section-title">四、高风险台词定位</h2>
      <div v-if="highRiskSegments.length > 0" class="transcript-risk-list">
        <div v-for="(segment, index) in highRiskSegments" :key="index" class="transcript-item-report">
          <div class="transcript-timeline">{{ formatTimeDisplay(segment.timeSeconds) }}</div>
          <div class="transcript-content-report">
            <div class="transcript-text">"{{ segment.content }}"</div>
            <div class="transcript-meta">
              <span class="risk-badge-report" :class="'risk-' + segment.riskLevel.toLowerCase()">
                {{ segment.riskLevel === 'high' ? '⚠️ 高风险' : '⚡ 中等风险' }}
              </span>
              <span v-if="segment.label" class="risk-reason">{{ segment.label }}</span>
            </div>
          </div>
        </div>
      </div>
      <div v-else class="empty-risk">
        <p>✅ 未检测到高风险或中等风险台词</p>
      </div>
    </div>

    <!-- 多模态风险时间分布 -->
    <div class="report-section">
      <h2 class="section-title">五、风险时间分布分析</h2>
      <p class="section-desc">展示视频播放全过程中，视频画面、音频情绪、文本内容三个维度的风险指数变化曲线</p>
      <div class="chart-container-report">
        <v-chart :option="timelineChartOption" class="timeline-chart-report" />
      </div>
      <div class="chart-legend">
        <span class="legend-item"><span class="legend-dot video"></span>蓝色曲线 = 视频画面风险</span>
        <span class="legend-item"><span class="legend-dot audio"></span>粉色曲线 = 音频情绪风险</span>
        <span class="legend-item"><span class="legend-dot text"></span>青色曲线 = 文本内容风险</span>
      </div>
    </div>

    <!-- 高校舆情风险画像 -->
    <div class="report-section">
      <h2 class="section-title">六、综合风险评估（六维度雷达图）</h2>
      <p class="section-desc">从六个关键维度对视频进行综合风险评估：身份置信度、学校关联度、负面情感度、传播风险、影响范围、处置紧迫度</p>
      
      <div class="radar-charts-grid">
        <!-- 平均雷达图 -->
        <div class="radar-chart-wrapper">
          <div class="radar-header">
            <h3 class="radar-subtitle">📊 整体平均风险画像</h3>
            <p class="radar-desc">基于视频全时段的平均风险水平</p>
          </div>
          <div class="chart-container-report">
            <v-chart :option="averageRadarChartOption" class="radar-chart-report" />
          </div>
        </div>
        
        <!-- 最高风险雷达图 -->
        <div class="radar-chart-wrapper peak-risk">
          <div class="radar-header">
            <h3 class="radar-subtitle">🔴 峰值风险画像</h3>
            <p class="radar-desc">最高风险时段：{{ formatTimeDisplay(peakRisk.timeStart) }} - {{ formatTimeDisplay(peakRisk.timeEnd) }}</p>
          </div>
          <div class="chart-container-report">
            <v-chart :option="peakRadarChartOption" class="radar-chart-report" />
          </div>
          <p class="peak-score">综合风险值：<strong>{{ peakRisk.avgRisk }}</strong>分</p>
        </div>
      </div>
    </div>

    <!-- 操作按钮 -->
    <div class="report-actions" ref="actionButtonsRef">
      <button class="report-btn primary" @click="handleExportPDF">
        <el-icon><Download /></el-icon>
        导出PDF报告
      </button>
      <button class="report-btn" @click="handleBackToList">
        <el-icon><ArrowLeft /></el-icon>
        返回列表
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import VChart from 'vue-echarts'
import { 
  VideoPlay, Clock, TrendCharts, Timer, User, School, ChatDotRound, 
  WarningFilled, DocumentChecked, VideoCamera, Microphone, ChatLineRound, 
  Check, Download, ArrowLeft 
} from '@element-plus/icons-vue'
import type { AnalysisResult } from '@/data/mockAnalysisResult'

// Props
const props = defineProps<{
  analysisData: AnalysisResult
  timelineChartOption: any
  averageRadarChartOption: any
  peakRadarChartOption: any
}>()

// Emits
const emit = defineEmits<{
  (e: 'export-pdf'): void
  (e: 'back-to-list'): void
}>()

const router = useRouter()
const reportContentRef = ref<HTMLElement | null>(null)
const actionButtonsRef = ref<HTMLElement | null>(null)

// 证据卡片配置
const evidenceCards = {
  identity: { label: '身份判定' },
  university: { label: '涉及高校' },
  topic: { label: '内容主题' },
  attitude: { label: '对学校态度' },
  opinionRisk: { label: '潜在舆论风险' },
  action: { label: '处置建议' }
}

// 高风险台词（过滤低风险）
const highRiskSegments = computed(() => 
  props.analysisData.riskEvidences.filter(e => e.riskLevel !== 'low')
)

// 峰值风险数据
const peakRisk = computed(() => {
  let maxRisk = 0
  let peak = props.analysisData.timelineData.radarByTime[0]
  
  props.analysisData.timelineData.radarByTime.forEach(timeData => {
    const avgRisk = timeData.data.reduce((a, b) => a + b, 0) / timeData.data.length
    if (avgRisk > maxRisk) {
      maxRisk = avgRisk
      peak = timeData
    }
  })
  
  return {
    ...peak,
    avgRisk: Math.round(maxRisk)
  }
})

// 工具函数
const formatDuration = (seconds: number): string => {
  const m = Math.floor(seconds / 60)
  const s = Math.floor(seconds % 60)
  return `${m}:${s.toString().padStart(2, '0')}`
}

const formatTimeDisplay = (seconds: number): string => {
  const mins = Math.floor(seconds / 60)
  const secs = Math.floor(seconds % 60)
  return `${mins}:${secs.toString().padStart(2, '0')}`
}

// 辅助函数：根据cardKey获取结果标签
const getResultLabel = (cardKey: string): string => {
  const labels: Record<string, string> = {
    'identity': '识别置信度',
    'university': '关联置信度',
    'topic': '主题置信度',
    'opinionRisk': '风险指数',
    'action': '紧急程度',
    'attitude': '情感分布统计'
  }
  return labels[cardKey] || '置信度'
}

// 前端生成融合公式
const getFusionFormula = (cardKey: string): string => {
  const fusion = props.analysisData[cardKey as keyof typeof props.analysisData]
  if (!fusion || typeof fusion !== 'object' || !('modalityFusion' in fusion)) return ''
  const mf = (fusion as any).modalityFusion
  if (!mf) return ''
  return `视频${mf.videoContribution?.toFixed(1) || 0} + 音频${mf.audioContribution?.toFixed(1) || 0} + 文本${mf.textContribution?.toFixed(1) || 0}`
}

// 统计evidences中各模态的数量
const getModalityEvidenceCount = (cardKey: string, modalityType: 'video' | 'audio' | 'text'): number => {
  const card = props.analysisData[cardKey as keyof typeof props.analysisData]
  if (!card || typeof card !== 'object' || !('evidences' in card)) return 0
  const evidences = (card as any).evidences || []
  return evidences.filter((e: any) => e.type === modalityType).length
}

// 统计attitude的情感数据
const getAttitudeStatistics = () => {
  const evidences = props.analysisData.attitude.evidences
  const positive = evidences.filter(e => e.sentiment === 'positive').length
  const neutral = evidences.filter(e => e.sentiment === 'neutral').length
  const negative = evidences.filter(e => e.sentiment === 'negative').length
  const total = evidences.length
  return { positive, neutral, negative, total }
}

// 辅助函数：获取情感图标样式
const getSentimentIconClass = (sentiment: string): string => {
  const classes: Record<string, string> = {
    'positive': 'icon-bg-positive',
    'neutral': 'icon-bg-neutral',
    'negative': 'icon-bg-negative'
  }
  return classes[sentiment] || 'icon-bg-neutral'
}

// 辅助函数：获取情感文字样式
const getSentimentTextClass = (sentiment: string): string => {
  const classes: Record<string, string> = {
    'positive': 'text-positive',
    'neutral': 'text-neutral',
    'negative': 'text-negative'
  }
  return classes[sentiment] || 'text-neutral'
}

// 辅助函数：获取情感标签
const getSentimentLabel = (sentiment: string): string => {
  const labels: Record<string, string> = {
    'positive': '正面/满意',
    'neutral': '中性/客观',
    'negative': '负面/不满'
  }
  return labels[sentiment] || '未知'
}

// 辅助函数：获取舆论风险图标样式
const getOpinionRiskIconClass = (level: string): string => {
  const classes: Record<string, string> = {
    'low': 'icon-bg-risk-low',
    'medium': 'icon-bg-risk-medium',
    'high': 'icon-bg-risk-high'
  }
  return classes[level] || 'icon-bg-risk-medium'
}

// 辅助函数：获取舆论风险文字样式
const getOpinionRiskTextClass = (level: string): string => {
  const classes: Record<string, string> = {
    'low': 'text-risk-low',
    'medium': 'text-risk-medium',
    'high': 'text-risk-high'
  }
  return classes[level] || 'text-risk-medium'
}

// 事件处理
const handleExportPDF = () => {
  emit('export-pdf')
}

const handleBackToList = () => {
  emit('back-to-list')
}

// 暴露ref供父组件访问
defineExpose({
  reportContentRef,
  actionButtonsRef
})
</script>

<style scoped lang="scss">
// 新拟态配色变量
$bg: #edf2f0;
$neu-1: #ecf0f3;
$neu-2: #d1d9e6;
$white: #f9f9f9;
$gray: #a0a5a8;
$black: #181818;
$purple: #4b70e2;

// 全局图标向下微调0.5px，改善视觉对齐
.el-icon {
  position: relative;
  top: 0.5px;
}

// ==================== 报告视图样式（PDF友好） ====================
.report-view {
  max-width: 1200px;
  margin: 0 auto;
  padding: 40px 30px;
  background: white;
  
  // PDF打印优化
  @media print {
    padding: 20px;
    
    .report-actions {
      display: none !important;
    }
  }
}

.report-header {
  margin-bottom: 45px;
  padding-bottom: 35px;
  border-bottom: 3px solid $purple;
}

.report-title {
  font-size: 36px;
  font-weight: 700;
  color: $black;
  margin: 0 0 30px 0;
  text-align: center;
  letter-spacing: 1px;
}

.report-info-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 20px;
  margin-bottom: 25px;
  padding: 25px;
  background: linear-gradient(135deg, #f0f2f5 0%, #f5f7fa 100%);
  border-radius: 12px;
}

.info-item {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.info-label {
  font-size: 12px;
  color: #999;
  font-weight: 500;
}

.info-value {
  font-size: 14px;
  color: $black;
  font-weight: 600;
  
  &.status-completed {
    color: #52c41a;
  }
}

.report-summary {
  background: #fffbf0;
  border-left: 4px solid $purple;
  padding: 20px;
  border-radius: 8px;
}

.summary-title {
  font-size: 14px;
  font-weight: 600;
  color: $purple;
  margin: 0 0 10px 0;
}

.summary-content {
  font-size: 14px;
  color: #666;
  line-height: 1.8;
  margin: 0;
  text-align: justify;
}

.report-section {
  margin-bottom: 35px;
  page-break-inside: avoid;
}

.section-title {
  font-size: 22px;
  font-weight: 700;
  color: $black;
  margin: 0 0 12px 0;
  padding-bottom: 10px;
  border-bottom: 2px solid #e8ecef;
}

.section-desc {
  font-size: 13px;
  color: #999;
  margin: -8px 0 20px 0;
  font-style: italic;
}

// 核心卡片网格
.report-cards-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 20px;
}

.report-card {
  background: $neu-1;
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  page-break-inside: avoid;
}

.card-header-flex {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 12px;
}

.card-icon-small {
  width: 36px;
  height: 36px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 18px;
}

.card-title-small {
  font-size: 14px;
  font-weight: 600;
  color: #666;
}

.card-value {
  font-size: 20px;
  font-weight: 700;
  margin-bottom: 8px;
  line-height: 1.2;
}

.card-meta {
  font-size: 12px;
  color: #999;
}

// 证据清单样式
.evidence-section {
  margin-bottom: 30px;
  page-break-inside: avoid;
}

.evidence-section-title {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 15px;
}

.evidence-badge-report {
  font-size: 16px;
  font-weight: 600;
  color: $black;
}

.evidence-count-report {
  font-size: 13px;
  color: #999;
}

.evidence-list-report {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.evidence-item-report {
  display: flex;
  gap: 15px;
  background: #f8f9fa;
  padding: 15px;
  border-radius: 8px;
  page-break-inside: avoid;
}

.evidence-timeline-mark {
  width: 4px;
  border-radius: 2px;
  flex-shrink: 0;
  
  &.mark-video { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); }
  &.mark-audio { background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%); }
  &.mark-text { background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%); }
}

.evidence-content-report {
  flex: 1;
}

.evidence-header-report {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 8px;
}

.evidence-type-badge {
  font-size: 11px;
  padding: 3px 8px;
  border-radius: 4px;
  font-weight: 600;
  
  &.type-video { background: rgba(102, 126, 234, 0.15); color: #667eea; }
  &.type-audio { background: rgba(240, 147, 251, 0.15); color: #f093fb; }
  &.type-text { background: rgba(79, 172, 254, 0.15); color: #4facfe; }
}

.evidence-time-report {
  font-size: 12px;
  color: $purple;
  font-weight: 600;
}

.evidence-confidence-report {
  font-size: 11px;
  color: #999;
}

.evidence-desc-report {
  font-size: 13px;
  color: #333;
  line-height: 1.6;
  margin-bottom: 5px;
}

.evidence-keyword-report {
  font-size: 13px;
  color: $purple;
  font-weight: 600;
  margin-top: 5px;
  padding: 5px 10px;
  background: rgba(75, 112, 226, 0.08);
  border-radius: 4px;
  display: inline-block;
}

.empty-evidence {
  text-align: center;
  padding: 20px;
  color: #999;
  font-size: 13px;
}

// 多模态融合分析样式
.fusion-section {
  margin-bottom: 25px;
  padding: 25px;
  background: linear-gradient(135deg, #f8f9fa 0%, #ffffff 100%);
  border-radius: 12px;
  border: 1px solid #e8ecef;
  page-break-inside: avoid;
}

.fusion-header-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 18px;
  padding-bottom: 12px;
  border-bottom: 1px solid #e8ecef;
}

.fusion-title {
  font-size: 17px;
  font-weight: 600;
  color: $black;
  margin: 0;
}

.fusion-result-badge {
  font-size: 13px;
  font-weight: 600;
  color: $purple;
  background: rgba(75, 112, 226, 0.1);
  padding: 6px 12px;
  border-radius: 6px;
}

.fusion-statistics {
  padding: 15px 0;
}

.stats-summary {
  display: flex;
  justify-content: space-around;
  gap: 20px;
  margin-bottom: 12px;
}

.stats-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  padding: 15px 25px;
  border-radius: 10px;
  background: white;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.06);
  
  &.positive {
    border-top: 3px solid #67c23a;
    .stats-count { color: #67c23a; }
  }
  
  &.neutral {
    border-top: 3px solid #909399;
    .stats-count { color: #909399; }
  }
  
  &.negative {
    border-top: 3px solid #f56c6c;
    .stats-count { color: #f56c6c; }
  }
}

.stats-icon {
  font-size: 24px;
}

.stats-label {
  font-size: 12px;
  color: #999;
}

.stats-count {
  font-size: 24px;
  font-weight: 700;
}

.stats-note {
  text-align: center;
  font-size: 12px;
  color: #999;
  margin: 10px 0 0 0;
  font-style: italic;
}

.fusion-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 15px;
}

.fusion-card {
  background: white;
  padding: 15px;
  border-radius: 8px;
  text-align: center;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.06);
}

.fusion-header {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  font-size: 12px;
  color: #666;
  margin-bottom: 10px;
  
  .el-icon {
    font-size: 16px;
  }
}

.video-fusion .fusion-header .el-icon { color: #667eea; }
.audio-fusion .fusion-header .el-icon { color: #f093fb; }
.text-fusion .fusion-header .el-icon { color: #4facfe; }
.result-fusion .fusion-header .el-icon { color: #52c41a; }

.fusion-score {
  font-size: 28px;
  font-weight: 700;
  color: $black;
  
  span {
    font-size: 14px;
    color: #999;
    margin-left: 3px;
  }
}

.fusion-meta {
  display: flex;
  flex-direction: column;
  gap: 3px;
  font-size: 11px;
  color: #999;
  margin-top: 8px;
}

.fusion-result {
  font-size: 20px;
  font-weight: 700;
  color: $purple;
  margin-bottom: 8px;
}

.fusion-formula {
  font-size: 10px;
  color: #999;
  font-family: monospace;
}

// 高风险台词列表样式
.transcript-risk-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.transcript-item-report {
  display: flex;
  gap: 15px;
  background: #fff8f0;
  padding: 15px;
  border-radius: 8px;
  border-left: 4px solid #faad14;
  page-break-inside: avoid;
}

.transcript-timeline {
  font-size: 13px;
  font-weight: 600;
  color: $purple;
  white-space: nowrap;
}

.transcript-content-report {
  flex: 1;
}

.transcript-text {
  font-size: 14px;
  color: #333;
  line-height: 1.8;
  margin-bottom: 10px;
  font-style: italic;
  quotes: '"' '"';
}

.transcript-meta {
  display: flex;
  align-items: center;
  gap: 15px;
}

.risk-badge-report {
  font-size: 12px;
  padding: 3px 10px;
  border-radius: 4px;
  font-weight: 600;
  
  &.risk-high {
    background: rgba(245, 108, 108, 0.15);
    color: #f56c6c;
  }
  
  &.risk-medium {
    background: rgba(250, 173, 20, 0.15);
    color: #faad14;
  }
}

.risk-reason {
  font-size: 12px;
  color: #666;
}

.empty-risk {
  text-align: center;
  padding: 40px;
  background: #f0fdf4;
  border-radius: 12px;
  
  p {
    margin: 0;
    font-size: 15px;
    color: #52c41a;
    font-weight: 600;
  }
}

// 图表容器样式
.chart-container-report {
  background: white;
  padding: 25px;
  border-radius: 12px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
}

.timeline-chart-report {
  width: 100%;
  height: 350px;
}

.radar-chart-report {
  width: 100%;
  height: 380px;
}

.chart-legend {
  display: flex;
  justify-content: center;
  gap: 30px;
  margin-top: 15px;
  padding: 12px;
  background: #f8f9fa;
  border-radius: 8px;
}

.legend-item {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  color: #666;
}

.legend-dot {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  
  &.video { background: #667eea; }
  &.audio { background: #f093fb; }
  &.text { background: #4facfe; }
}

// 两个雷达图并排显示
.radar-charts-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 30px;
}

.radar-chart-wrapper {
  display: flex;
  flex-direction: column;
  background: white;
  padding: 20px;
  border-radius: 12px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
  
  &.peak-risk {
    border: 2px solid #f56c6c;
  }
}

.radar-header {
  margin-bottom: 15px;
}

.radar-subtitle {
  font-size: 17px;
  font-weight: 600;
  color: $black;
  margin: 0 0 6px 0;
  text-align: center;
}

.radar-desc {
  font-size: 12px;
  color: #999;
  margin: 0;
  text-align: center;
}

.peak-score {
  text-align: center;
  font-size: 13px;
  color: #666;
  margin: 12px 0 0 0;
  
  strong {
    font-size: 20px;
    color: #f56c6c;
    font-weight: 700;
  }
}

// 操作按钮样式
.report-actions {
  display: flex;
  justify-content: center;
  gap: 15px;
  margin-top: 40px;
  padding-top: 30px;
  border-top: 2px solid #e8ecef;
}

.report-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 24px;
  font-size: 14px;
  font-weight: 600;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s;
  background: $neu-1;
  color: $gray;
  box-shadow: 
    3px 3px 6px rgba(163, 177, 198, 0.4),
    -3px -3px 6px rgba(255, 255, 255, 0.9);
  
  &:hover {
    transform: translateY(-2px);
    box-shadow: 
      4px 4px 8px rgba(163, 177, 198, 0.5),
      -4px -4px 8px rgba(255, 255, 255, 1);
  }
  
  &:active {
    transform: translateY(0);
  }
  
  &.primary {
    background: $purple;
    color: white;
    
    &:hover {
      background: darken($purple, 5%);
    }
  }
}

// 图标背景样式
.icon-bg-identity { background: rgba(64, 158, 255, 0.12); color: #409EFF; }
.icon-bg-uni { background: rgba(64, 158, 255, 0.12); color: #409eff; }
.icon-bg-topic { background: rgba(114, 46, 209, 0.12); color: #722ed1; }
.icon-bg-positive { background: rgba(103, 194, 58, 0.12); color: #67c23a; }
.icon-bg-neutral { background: rgba(250, 173, 20, 0.12); color: #faad14; }
.icon-bg-negative { background: rgba(245, 108, 108, 0.12); color: #f56c6c; }
.icon-bg-risk-low { background: rgba(82, 196, 26, 0.12); color: #52c41a; }
.icon-bg-risk-medium { background: rgba(250, 173, 20, 0.12); color: #faad14; }
.icon-bg-risk-high { background: rgba(245, 108, 108, 0.12); color: #f56c6c; }
.icon-bg-action { background: rgba(82, 196, 26, 0.12); color: #52c41a; }

// 文字颜色样式
.text-identity { color: #409EFF; }
.text-uni { color: #409eff; }
.text-topic { color: #722ed1; }
.text-positive { color: #67c23a; }
.text-neutral { color: #faad14; }
.text-negative { color: #F56C6C; }
.text-risk-low { color: #52c41a; }
.text-risk-medium { color: #faad14; }
.text-risk-high { color: #F56C6C; }
.text-action { color: #52c41a; }
</style>
