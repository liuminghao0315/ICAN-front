<template>
  <div class="analysis-page">
    <div class="header-actions">
      <h2 class="page-title">分析结果</h2>
      <div class="header-select">
        <el-select 
          v-model="selectedVideoId" 
          placeholder="选择视频" 
          @change="loadAnalysisByVideo" 
          clearable 
          class="neu-select"
        >
          <el-option
            v-for="video in videoList"
            :key="video.id"
            :label="video.title"
            :value="video.id"
          />
        </el-select>
      </div>
    </div>
    
    <!-- 加载中 -->
    <div class="neu-card" v-loading="loading" v-if="loading">
      <div style="height: 400px;"></div>
    </div>
    
    <!-- 空状态 -->
    <div class="neu-card empty-card" v-else-if="!analysisData">
      <div class="empty-state">
        <div class="empty-icon">
          <el-icon :size="48"><DataAnalysis /></el-icon>
        </div>
        <h3>{{ emptyMessage }}</h3>
        <p>选择已分析的视频即可查看详细的多模态分析结果</p>
        <button class="neu-btn primary-btn" @click="$router.push('/videos')">
          <el-icon><VideoPlay /></el-icon>
          去选择视频
        </button>
      </div>
    </div>
    
    <!-- 分析结果展示 -->
    <div v-else class="analysis-content">
      <!-- 视频信息 -->
      <div class="video-info-bar">
        <div class="video-icon">
          <el-icon :size="24"><VideoPlay /></el-icon>
        </div>
        <div class="video-details">
          <div class="video-title">{{ analysisData.videoTitle }}</div>
          <div class="video-meta">分析时间：{{ formatDate(analysisData.gmtCreated) }}</div>
        </div>
        <button class="neu-btn" @click="playVideo" v-if="analysisData.videoUrl">
          <el-icon><VideoPlay /></el-icon>
          播放视频
        </button>
      </div>
      
      <!-- 风险评分卡片 -->
      <div class="risk-cards-grid">
        <div class="neu-card risk-card" :class="getRiskClass(analysisData.riskLevel)">
          <div class="risk-icon">
            <el-icon :size="28"><Warning /></el-icon>
          </div>
          <div class="risk-info">
            <div class="risk-score">{{ formatScore(analysisData.riskScore) }}</div>
            <div class="risk-label">风险评分</div>
            <div class="risk-level">{{ analysisData.riskLevelDesc || getRiskLevelText(analysisData.riskLevel) }}</div>
          </div>
        </div>
        
        <div class="neu-card stat-card">
          <div class="stat-icon primary">
            <el-icon :size="24"><School /></el-icon>
          </div>
          <div class="stat-info">
            <div class="stat-value">{{ analysisData.isUniversityRelated ? '是' : '否' }}</div>
            <div class="stat-label">高校相关</div>
            <div class="stat-detail" v-if="analysisData.universityName">
              {{ analysisData.universityName }} ({{ formatScore(analysisData.universityConfidence) }})
            </div>
          </div>
        </div>
        
        <div class="neu-card stat-card">
          <div class="stat-icon" :class="getSentimentClass(analysisData.sentimentLabel)">
            <el-icon :size="24"><ChatDotRound /></el-icon>
          </div>
          <div class="stat-info">
            <div class="stat-value">{{ analysisData.sentimentLabelDesc || getSentimentText(analysisData.sentimentLabel) }}</div>
            <div class="stat-label">情感倾向</div>
            <div class="stat-detail">
              评分: {{ (analysisData.sentimentScore * 100).toFixed(1) }}%
            </div>
          </div>
        </div>
        
        <div class="neu-card stat-card">
          <div class="stat-icon warning">
            <el-icon :size="24"><Document /></el-icon>
          </div>
          <div class="stat-info">
            <div class="stat-value">{{ analysisData.topicCategory || '未分类' }}</div>
            <div class="stat-label">主题分类</div>
            <div class="stat-detail" v-if="analysisData.spreadPotential">
              传播潜力: {{ formatScore(analysisData.spreadPotential) }}
            </div>
          </div>
        </div>
      </div>
      
      <!-- 图表展示区域 -->
      <div class="charts-grid">
        <div class="neu-card">
          <div class="card-header">
            <span class="card-title">风险评分分布</span>
          </div>
          <v-chart :option="riskChartOption" class="chart" />
        </div>
        
        <div class="neu-card">
          <div class="card-header">
            <span class="card-title">受众年龄分布</span>
          </div>
          <v-chart :option="audienceChartOption" class="chart" />
        </div>
      </div>
      
      <!-- 详细分析结果 -->
      <div class="details-grid">
        <div class="neu-card">
          <div class="card-header">
            <span class="card-title">
              <el-icon><VideoCamera /></el-icon>
              视频特征
            </span>
          </div>
          <div class="feature-details" v-if="analysisData.videoFeatures">
            <div class="feature-item">
              <span class="feature-label">视频时长</span>
              <span class="feature-value">{{ formatDuration(analysisData.videoFeatures.duration) }}</span>
            </div>
            <div class="feature-item">
              <span class="feature-label">分辨率</span>
              <span class="feature-value">{{ analysisData.videoFeatures.width }} x {{ analysisData.videoFeatures.height }}</span>
            </div>
            <div class="feature-item">
              <span class="feature-label">帧率</span>
              <span class="feature-value">{{ analysisData.videoFeatures.fps }} fps</span>
            </div>
            <div class="feature-item">
              <span class="feature-label">场景类型</span>
              <span class="feature-value">{{ analysisData.videoFeatures.sceneType || '未知' }}</span>
            </div>
            <div class="feature-item">
              <span class="feature-label">人物检测</span>
              <span class="feature-value">
                {{ analysisData.videoFeatures.hasPerson ? '是' : '否' }}
                <span v-if="analysisData.videoFeatures.faceCount">({{ analysisData.videoFeatures.faceCount }}人)</span>
              </span>
            </div>
            <div class="feature-item">
              <span class="feature-label">画面质量</span>
              <span class="feature-value">{{ formatScore(analysisData.videoFeatures.qualityScore) }}</span>
            </div>
          </div>
          <div v-else class="empty-feature">
            <el-icon :size="36"><VideoCamera /></el-icon>
            <span>暂无视频特征数据</span>
          </div>
        </div>
        
        <div class="neu-card">
          <div class="card-header">
            <span class="card-title">
              <el-icon><Microphone /></el-icon>
              音频分析
            </span>
          </div>
          <div class="feature-details" v-if="analysisData.audioFeatures">
            <div class="feature-item">
              <span class="feature-label">音频检测</span>
              <span class="feature-value">{{ analysisData.audioFeatures.hasAudio ? '有音频' : '无音频' }}</span>
            </div>
            <div class="feature-item">
              <span class="feature-label">音频质量</span>
              <span class="feature-value">{{ formatScore(analysisData.audioFeatures.audioQuality) }}</span>
            </div>
            <div class="feature-item">
              <span class="feature-label">语音占比</span>
              <span class="feature-value">{{ formatScore(analysisData.audioFeatures.speechRatio) }}</span>
            </div>
            <div class="feature-item">
              <span class="feature-label">音乐占比</span>
              <span class="feature-value">{{ formatScore(analysisData.audioFeatures.musicRatio) }}</span>
            </div>
            <div class="feature-item">
              <span class="feature-label">语音情感</span>
              <span class="feature-value">{{ analysisData.audioFeatures.emotionInVoice || '未知' }}</span>
            </div>
            <div class="feature-item full" v-if="analysisData.transcription">
              <span class="feature-label">语音转文字</span>
              <div class="feature-value transcription">
                {{ analysisData.transcription }}
              </div>
            </div>
          </div>
          <div v-else class="empty-feature">
            <el-icon :size="36"><Microphone /></el-icon>
            <span>暂无音频特征数据</span>
          </div>
        </div>
      </div>
      
      <!-- 主题关键词 -->
      <div class="neu-card keywords-card" v-if="analysisData.topicKeywords && analysisData.topicKeywords.length > 0">
        <div class="card-header">
          <span class="card-title">
            <el-icon><Collection /></el-icon>
            主题关键词
          </span>
        </div>
        <div class="keywords-content">
          <span
            v-for="(keyword, index) in analysisData.topicKeywords"
            :key="index"
            class="keyword-tag"
            :class="{ primary: index < 3 }"
          >
            {{ keyword }}
          </span>
        </div>
      </div>
      
      <!-- 受众分析 -->
      <div class="neu-card audience-card" v-if="analysisData.audienceAnalysis">
        <div class="card-header">
          <span class="card-title">
            <el-icon><User /></el-icon>
            受众预测
          </span>
        </div>
        <div class="audience-content">
          <div class="audience-stats">
            <div class="stat-box">
              <div class="stat-number">{{ analysisData.audienceAnalysis.predictedViews?.toLocaleString() }}</div>
              <div class="stat-name">预计播放量</div>
            </div>
            <div class="stat-box">
              <div class="stat-number">{{ formatScore(analysisData.audienceAnalysis.predictedEngagement) }}</div>
              <div class="stat-name">预计互动率</div>
            </div>
          </div>
          <div class="interests-section" v-if="analysisData.audienceAnalysis.predictedInterests">
            <h4>预测受众兴趣</h4>
            <div class="interests-list">
              <span 
                v-for="(interest, index) in analysisData.audienceAnalysis.predictedInterests" 
                :key="index"
                class="interest-tag"
              >
                {{ interest }}
              </span>
            </div>
          </div>
        </div>
      </div>
      
      <!-- 操作按钮 -->
      <div class="action-buttons">
        <button class="neu-btn primary-btn" @click="exportReport">
          <el-icon><Download /></el-icon>
          导出PDF报告
        </button>
        <button class="neu-btn" @click="$router.push('/videos')">
          <el-icon><VideoPlay /></el-icon>
          返回视频列表
        </button>
      </div>
    </div>
    
    <!-- 视频播放对话框 -->
    <el-dialog
      v-model="videoDialogVisible"
      :title="analysisData?.videoTitle"
      width="800px"
      destroy-on-close
    >
      <video
        v-if="analysisData?.videoUrl"
        :src="analysisData.videoUrl"
        controls
        autoplay
        class="video-player"
      ></video>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { use } from 'echarts/core'
import { CanvasRenderer } from 'echarts/renderers'
import { PieChart, BarChart } from 'echarts/charts'
import {
  TitleComponent,
  TooltipComponent,
  LegendComponent,
  GridComponent
} from 'echarts/components'
import VChart from 'vue-echarts'
import { ElMessage } from 'element-plus'
import { 
  getVideoList, 
  getResultByVideoId,
  getResultById,
  type VideoInfo 
} from '@/api'
import type { AnalysisResultVO, RiskLevel, SentimentLabel } from '@/types'

// 注册ECharts组件
use([
  CanvasRenderer,
  PieChart,
  BarChart,
  TitleComponent,
  TooltipComponent,
  LegendComponent,
  GridComponent
])

const route = useRoute()
const router = useRouter()

const loading = ref(false)
const selectedVideoId = ref<string>('')
const videoList = ref<VideoInfo[]>([])
const analysisData = ref<AnalysisResultVO | null>(null)
const videoDialogVisible = ref(false)
const emptyMessage = ref('请选择一个视频')

// 新拟态配色
const neuColors = {
  purple: '#4b70e2',
  gray: '#a0a5a8',
  black: '#181818',
  neu1: '#ecf0f3',
  neu2: '#d1d9e6'
}

// 风险评分图表配置
const riskChartOption = computed(() => {
  if (!analysisData.value) return {}
  
  return {
    tooltip: {
      trigger: 'item',
      formatter: '{b}: {c}%'
    },
    series: [
      {
        type: 'pie',
        radius: ['45%', '70%'],
        avoidLabelOverlap: false,
        itemStyle: {
          borderRadius: 8,
          borderColor: neuColors.neu1,
          borderWidth: 3
        },
        label: {
          show: true,
          formatter: '{b}\n{d}%',
          color: neuColors.black
        },
        emphasis: {
          label: {
            show: true,
            fontSize: 14,
            fontWeight: 'bold'
          }
        },
        data: [
          { 
            value: Math.round(analysisData.value.riskScore * 100), 
            name: '风险评分', 
            itemStyle: { color: '#f56c6c' } 
          },
          { 
            value: Math.round((1 - analysisData.value.riskScore) * 100), 
            name: '安全评分', 
            itemStyle: { color: '#52c41a' } 
          }
        ]
      }
    ]
  }
})

// 受众年龄分布图表
const audienceChartOption = computed(() => {
  if (!analysisData.value?.audienceAnalysis?.ageDistribution) return {}
  
  const dist = analysisData.value.audienceAnalysis.ageDistribution
  
  return {
    tooltip: {
      trigger: 'axis',
      axisPointer: { type: 'shadow' }
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '3%',
      top: '10%',
      containLabel: true
    },
    xAxis: {
      type: 'category',
      data: ['18-24岁', '25-34岁', '35-44岁', '45岁+'],
      axisLine: { lineStyle: { color: neuColors.neu2 } },
      axisLabel: { color: neuColors.gray, fontSize: 11 }
    },
    yAxis: {
      type: 'value',
      max: 100,
      axisLine: { show: false },
      splitLine: { lineStyle: { color: '#e8edf3' } },
      axisLabel: { 
        color: neuColors.gray, 
        fontSize: 11,
        formatter: '{value}%'
      }
    },
    series: [
      {
        type: 'bar',
        barWidth: '50%',
        data: [
          { value: Math.round(dist['18-24'] * 100), itemStyle: { color: neuColors.purple } },
          { value: Math.round(dist['25-34'] * 100), itemStyle: { color: '#7c9df7' } },
          { value: Math.round(dist['35-44'] * 100), itemStyle: { color: '#a3bef9' } },
          { value: Math.round(dist['45+'] * 100), itemStyle: { color: '#c5d5fb' } }
        ],
        itemStyle: {
          borderRadius: [6, 6, 0, 0]
        }
      }
    ]
  }
})

// 方法
const loadAnalysisByVideo = async () => {
  if (!selectedVideoId.value) {
    analysisData.value = null
    emptyMessage.value = '请选择一个视频'
    return
  }
  
  loading.value = true
  try {
    const response = await getResultByVideoId(selectedVideoId.value)
    if (response.code === 200 && response.data) {
      analysisData.value = response.data
    } else {
      analysisData.value = null
      emptyMessage.value = '该视频尚未分析或分析未完成'
    }
  } catch (error) {
    console.error('加载分析结果失败:', error)
    ElMessage.error('加载分析结果失败')
    analysisData.value = null
  } finally {
    loading.value = false
  }
}

const loadAnalysisById = async (resultId: string) => {
  loading.value = true
  try {
    const response = await getResultById(resultId)
    if (response.code === 200 && response.data) {
      analysisData.value = response.data
      selectedVideoId.value = response.data.videoId
    } else {
      analysisData.value = null
      emptyMessage.value = '分析结果不存在'
    }
  } catch (error) {
    console.error('加载分析结果失败:', error)
    ElMessage.error('加载分析结果失败')
    analysisData.value = null
  } finally {
    loading.value = false
  }
}

const fetchVideos = async () => {
  try {
    const response = await getVideoList(1, 100)
    if (response.code === 200) {
      // 只显示已完成分析的视频
      videoList.value = response.data.records.filter(v => v.status === 'COMPLETED')
    }
  } catch (error) {
    console.error('获取视频列表失败:', error)
  }
}

const playVideo = () => {
  videoDialogVisible.value = true
}

const formatScore = (score: number | null | undefined): string => {
  if (score === null || score === undefined) return '0%'
  return (score * 100).toFixed(1) + '%'
}

const formatDate = (dateStr: string): string => {
  return new Date(dateStr).toLocaleString('zh-CN')
}

const formatDuration = (seconds: number): string => {
  const m = Math.floor(seconds / 60)
  const s = Math.floor(seconds % 60)
  return `${m}分${s}秒`
}

const getRiskClass = (level: RiskLevel): string => {
  const classes: Record<RiskLevel, string> = {
    'LOW': 'risk-low',
    'MEDIUM': 'risk-medium',
    'HIGH': 'risk-high'
  }
  return classes[level] || 'risk-medium'
}

const getRiskLevelText = (level: RiskLevel): string => {
  const texts: Record<RiskLevel, string> = {
    'LOW': '低风险',
    'MEDIUM': '中风险',
    'HIGH': '高风险'
  }
  return texts[level] || '未知'
}

const getSentimentClass = (label: SentimentLabel): string => {
  const classes: Record<SentimentLabel, string> = {
    'POSITIVE': 'success',
    'NEUTRAL': 'primary',
    'NEGATIVE': 'danger'
  }
  return classes[label] || 'primary'
}

const getSentimentText = (label: SentimentLabel): string => {
  const texts: Record<SentimentLabel, string> = {
    'POSITIVE': '积极',
    'NEUTRAL': '中性',
    'NEGATIVE': '消极'
  }
  return texts[label] || '未知'
}

const exportReport = () => {
  ElMessage.info('PDF报告导出功能开发中...')
}

// 监听路由参数变化
watch(() => route.query, (query) => {
  if (query.videoId) {
    selectedVideoId.value = query.videoId as string
    loadAnalysisByVideo()
  } else if (query.resultId) {
    loadAnalysisById(query.resultId as string)
  }
}, { immediate: true })

onMounted(() => {
  fetchVideos()
  
  // 如果有路由参数，加载对应数据
  if (route.query.videoId) {
    selectedVideoId.value = route.query.videoId as string
    loadAnalysisByVideo()
  } else if (route.query.resultId) {
    loadAnalysisById(route.query.resultId as string)
  }
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

.analysis-page {
  .header-actions {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 24px;
    
    .page-title {
      font-size: 22px;
      font-weight: 700;
      margin: 0;
      color: $black;
    }
    
    .header-select {
      .neu-select {
        width: 280px;
        
        :deep(.el-input__wrapper) {
          background: $neu-1;
          box-shadow: inset 2px 2px 4px $neu-2, inset -2px -2px 4px $white;
          border: none;
          border-radius: 12px;
        }
      }
    }
  }
}

// 视频信息栏
.video-info-bar {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 18px 24px;
  background: $neu-1;
  border-radius: 16px;
  box-shadow: 6px 6px 12px $neu-2, -6px -6px 12px $white;
  margin-bottom: 24px;
  
  .video-icon {
    width: 48px;
    height: 48px;
    border-radius: 12px;
    background: linear-gradient(135deg, $purple 0%, #7c9df7 100%);
    display: flex;
    align-items: center;
    justify-content: center;
    color: #fff;
  }
  
  .video-details {
    flex: 1;
    
    .video-title {
      font-size: 16px;
      font-weight: 600;
      color: $black;
      margin-bottom: 4px;
    }
    
    .video-meta {
      font-size: 13px;
      color: $gray;
    }
  }
}

// 新拟态卡片
.neu-card {
  background: $neu-1;
  border-radius: 20px;
  box-shadow: 8px 8px 16px $neu-2, -8px -8px 16px $white;
  overflow: hidden;
  
  .card-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 18px 24px;
    border-bottom: 1px solid rgba($neu-2, 0.5);
    
    .card-title {
      font-size: 15px;
      font-weight: 600;
      color: $black;
      display: flex;
      align-items: center;
      gap: 8px;
    }
  }
  
  .chart {
    height: 280px;
    width: 100%;
    padding: 16px;
  }
}

// 新拟态按钮
.neu-btn {
  background: $neu-1;
  border: none;
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.25s;
  box-shadow: 4px 4px 8px $neu-2, -4px -4px 8px $white;
  color: $gray;
  font-family: 'Montserrat', sans-serif;
  padding: 12px 24px;
  font-size: 14px;
  display: flex;
  align-items: center;
  gap: 8px;
  
  &:hover {
    box-shadow: 2px 2px 4px $neu-2, -2px -2px 4px $white;
    color: $purple;
  }
  
  &:active {
    box-shadow: inset 2px 2px 4px $neu-2, inset -2px -2px 4px $white;
  }
  
  &.primary-btn {
    background: linear-gradient(135deg, $purple 0%, #7c9df7 100%);
    color: #fff;
    
    &:hover {
      box-shadow: 4px 4px 8px $neu-2, -2px -2px 6px $white;
      color: #fff;
    }
  }
}

// 空状态
.empty-card {
  .empty-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 64px 20px;
    
    .empty-icon {
      width: 100px;
      height: 100px;
      border-radius: 50%;
      background: $neu-1;
      box-shadow: 8px 8px 16px $neu-2, -8px -8px 16px $white;
      display: flex;
      align-items: center;
      justify-content: center;
      color: $gray;
      margin-bottom: 24px;
    }
    
    h3 {
      font-size: 18px;
      font-weight: 600;
      color: $black;
      margin: 0 0 10px;
    }
    
    p {
      font-size: 14px;
      color: $gray;
      margin: 0 0 28px;
    }
  }
}

// 风险卡片网格
.risk-cards-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 20px;
  margin-bottom: 24px;
  
  @media (max-width: 1200px) {
    grid-template-columns: repeat(2, 1fr);
  }
  
  @media (max-width: 600px) {
    grid-template-columns: 1fr;
  }
  
  .risk-card {
    display: flex;
    align-items: center;
    gap: 18px;
    padding: 24px;
    
    &.risk-low {
      border-left: 4px solid #52c41a;
      .risk-icon { background: rgba(82, 196, 26, 0.12); color: #52c41a; }
      .risk-level { color: #52c41a; }
    }
    
    &.risk-medium {
      border-left: 4px solid #faad14;
      .risk-icon { background: rgba(250, 173, 20, 0.12); color: #faad14; }
      .risk-level { color: #faad14; }
    }
    
    &.risk-high {
      border-left: 4px solid #f56c6c;
      .risk-icon { background: rgba(245, 108, 108, 0.12); color: #f56c6c; }
      .risk-level { color: #f56c6c; }
    }
    
    .risk-icon {
      width: 52px;
      height: 52px;
      border-radius: 14px;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }
    
    .risk-info {
      flex: 1;
      
      .risk-score {
        font-size: 28px;
        font-weight: 700;
        color: $black;
        line-height: 1;
      }
      
      .risk-label {
        font-size: 12px;
        color: $gray;
        margin-top: 4px;
      }
      
      .risk-level {
        font-size: 14px;
        font-weight: 600;
        margin-top: 6px;
      }
    }
  }
  
  .stat-card {
    display: flex;
    align-items: center;
    gap: 18px;
    padding: 24px;
    
    .stat-icon {
      width: 52px;
      height: 52px;
      border-radius: 14px;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
      
      &.primary {
        background: rgba($purple, 0.12);
        color: $purple;
      }
      
      &.success {
        background: rgba(82, 196, 26, 0.12);
        color: #52c41a;
      }
      
      &.warning {
        background: rgba(250, 173, 20, 0.12);
        color: #faad14;
      }
      
      &.danger {
        background: rgba(245, 108, 108, 0.12);
        color: #f56c6c;
      }
    }
    
    .stat-info {
      flex: 1;
      
      .stat-value {
        font-size: 20px;
        font-weight: 700;
        color: $black;
      }
      
      .stat-label {
        font-size: 12px;
        color: $gray;
        margin-top: 4px;
      }
      
      .stat-detail {
        font-size: 11px;
        color: $gray;
        margin-top: 4px;
      }
    }
  }
}

// 图表网格
.charts-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 24px;
  margin-bottom: 24px;
  
  @media (max-width: 900px) {
    grid-template-columns: 1fr;
  }
}

// 详情网格
.details-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 24px;
  margin-bottom: 24px;
  
  @media (max-width: 900px) {
    grid-template-columns: 1fr;
  }
  
  .feature-details {
    padding: 20px 24px;
    
    .feature-item {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      padding: 14px 0;
      border-bottom: 1px solid rgba($neu-2, 0.5);
      
      &:last-child {
        border-bottom: none;
      }
      
      &.full {
        flex-direction: column;
        gap: 10px;
      }
      
      .feature-label {
        font-size: 13px;
        color: $gray;
        font-weight: 500;
      }
      
      .feature-value {
        font-size: 14px;
        color: $black;
        font-weight: 600;
        text-align: right;
        
        &.transcription {
          text-align: left;
          line-height: 1.7;
          background: $neu-1;
          padding: 12px 16px;
          border-radius: 12px;
          box-shadow: inset 2px 2px 4px $neu-2, inset -2px -2px 4px $white;
          width: 100%;
        }
      }
    }
  }
  
  .empty-feature {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 48px 20px;
    color: $gray;
    gap: 12px;
    
    span {
      font-size: 13px;
    }
  }
}

// 关键词卡片
.keywords-card {
  margin-bottom: 24px;
  
  .keywords-content {
    padding: 24px;
    display: flex;
    flex-wrap: wrap;
    gap: 10px;
    
    .keyword-tag {
      padding: 8px 16px;
      border-radius: 20px;
      font-size: 13px;
      font-weight: 500;
      background: $neu-1;
      color: $gray;
      box-shadow: 3px 3px 6px $neu-2, -3px -3px 6px $white;
      
      &.primary {
        background: linear-gradient(135deg, $purple 0%, #7c9df7 100%);
        color: #fff;
        box-shadow: 3px 3px 8px $neu-2, -2px -2px 6px $white;
      }
    }
  }
}

// 受众分析卡片
.audience-card {
  margin-bottom: 24px;
  
  .audience-content {
    padding: 24px;
    
    .audience-stats {
      display: flex;
      gap: 24px;
      margin-bottom: 24px;
      
      .stat-box {
        flex: 1;
        text-align: center;
        padding: 20px;
        background: $neu-1;
        border-radius: 16px;
        box-shadow: inset 2px 2px 4px $neu-2, inset -2px -2px 4px $white;
        
        .stat-number {
          font-size: 28px;
          font-weight: 700;
          color: $purple;
        }
        
        .stat-name {
          font-size: 13px;
          color: $gray;
          margin-top: 6px;
        }
      }
    }
    
    .interests-section {
      h4 {
        font-size: 14px;
        font-weight: 600;
        color: $black;
        margin: 0 0 14px;
      }
      
      .interests-list {
        display: flex;
        flex-wrap: wrap;
        gap: 10px;
        
        .interest-tag {
          padding: 6px 14px;
          border-radius: 16px;
          font-size: 12px;
          background: rgba($purple, 0.1);
          color: $purple;
        }
      }
    }
  }
}

// 操作按钮
.action-buttons {
  display: flex;
  gap: 16px;
  justify-content: center;
  padding-top: 8px;
}

// 视频播放器
.video-player {
  width: 100%;
  max-height: 450px;
  background: #000;
  border-radius: 12px;
}

:deep(.el-dialog) {
  border-radius: 20px;
  
  .el-dialog__header {
    border-bottom: 1px solid rgba($neu-2, 0.5);
    padding: 20px 24px;
    margin: 0;
  }
  
  .el-dialog__body {
    padding: 24px;
  }
}
</style>
