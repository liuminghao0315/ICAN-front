<template>
  <div class="analysis-page">
    <div class="header-actions">
      <h2 class="page-title">分析结果</h2>
      <button class="neu-btn primary-btn video-selector-btn" @click="showVideoDrawer = true">
        <el-icon><VideoPlay /></el-icon>
        选择视频
      </button>
    </div>
    
    <!-- 视频选择侧边栏 -->
    <div class="video-drawer-overlay" :class="{ active: showVideoDrawer }" @click="showVideoDrawer = false"></div>
    <div class="video-drawer" :class="{ active: showVideoDrawer }">
      <div class="drawer-header">
        <h3>选择视频</h3>
        <button class="close-btn" @click="showVideoDrawer = false">
          <el-icon><Close /></el-icon>
        </button>
      </div>
      <div class="drawer-content">
        <div class="video-list-container">
          <div 
            v-for="video in videoList" 
            :key="video.id"
            class="video-item"
            :class="{ active: selectedVideoId === video.id }"
            @click="selectVideo(video)"
          >
            <div class="video-item-icon">
              <el-icon :size="20"><VideoPlay /></el-icon>
            </div>
            <div class="video-item-info">
              <div class="video-item-title">{{ video.title }}</div>
              <div class="video-item-meta">
                {{ video.fileName }} · {{ formatFileSize(video.fileSize) }}
              </div>
            </div>
            <div class="video-item-status">
              <span class="status-badge" :class="getStatusClass(video.status)">
                {{ getStatusText(video.status) }}
              </span>
            </div>
          </div>
          
          <div v-if="videoList.length === 0" class="empty-video-list">
            <el-icon :size="48"><VideoPlay /></el-icon>
            <p>暂无已分析的视频</p>
            <button class="neu-btn primary-btn" @click="$router.push('/videos')">
              去上传视频
            </button>
          </div>
        </div>
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
          去我的视频
        </button>
      </div>
    </div>
    
    <!-- 分析结果展示 -->
    <div v-else class="analysis-content" ref="reportContentRef">
      <!-- 视频信息 -->
      <div class="video-info-bar">
        <div class="video-icon">
          <el-icon :size="24"><VideoPlay /></el-icon>
        </div>
        <div class="video-details">
          <div class="video-title-row">
            <span class="video-title">{{ analysisData.videoTitle }}</span>
            <span class="video-meta">分析时间：{{ formatDate(analysisData.gmtCreated) }}</span>
          </div>
          <div class="video-description" v-if="analysisData.videoDescription">
            {{ analysisData.videoDescription }}
          </div>
        </div>
        <button class="neu-btn play-video-btn" @click="playVideo" v-if="analysisData.videoUrl" ref="playVideoBtnRef">
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
              <span class="feature-value">{{ getEmotionText(analysisData.audioFeatures.emotionInVoice) }}</span>
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
      
      <!-- 操作按钮 - 导出PDF时隐藏 -->
      <div class="action-buttons" ref="actionButtonsRef">
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
import { useWebSocket } from '@/composables/useWebSocket'
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

// WebSocket - 当任务完成时刷新视频列表
const { subscribeCompleted } = useWebSocket()

const loading = ref(false)
const selectedVideoId = ref<string>('')
const videoList = ref<VideoInfo[]>([])
const analysisData = ref<AnalysisResultVO | null>(null)
const videoDialogVisible = ref(false)
const emptyMessage = ref('请选择一个视频')
const showVideoDrawer = ref(false)

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
const selectVideo = (video: VideoInfo) => {
  selectedVideoId.value = video.id
  showVideoDrawer.value = false
  loadAnalysisByVideo()
}

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
  } catch (error: any) {
    ElMessage.error(error?.message || '加载分析结果失败')
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
  } catch (error: any) {
    ElMessage.error(error?.message || '加载分析结果失败')
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
  } catch {
    // 静默处理错误
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

const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i]
}

const getStatusText = (status: string): string => {
  const texts: Record<string, string> = {
    'UPLOADED': '待分析',
    'ANALYZING': '分析中',
    'COMPLETED': '已完成',
    'FAILED': '失败'
  }
  return texts[status] || status
}

const getStatusClass = (status: string): string => {
  const classes: Record<string, string> = {
    'UPLOADED': 'pending',
    'ANALYZING': 'processing',
    'COMPLETED': 'completed',
    'FAILED': 'failed'
  }
  return classes[status] || 'pending'
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

// 语音情感英文转中文映射
const getEmotionText = (emotion: string | null | undefined): string => {
  if (!emotion) return '未知'
  const emotionMap: Record<string, string> = {
    'energetic': '充满活力',
    'calm': '平静',
    'happy': '开心',
    'sad': '悲伤',
    'angry': '愤怒',
    'fear': '恐惧',
    'surprise': '惊讶',
    'disgust': '厌恶',
    'neutral': '中性',
    'excited': '兴奋',
    'relaxed': '放松',
    'tense': '紧张',
    'bored': '无聊',
    'confident': '自信',
    'nervous': '紧张不安',
    'passionate': '热情',
    'melancholic': '忧郁',
    'cheerful': '欢快',
    'serious': '严肃',
    'humorous': '幽默'
  }
  return emotionMap[emotion.toLowerCase()] || emotion
}

// PDF导出状态
const exportingPdf = ref(false)

// 报告内容区域引用
const reportContentRef = ref<HTMLElement | null>(null)
// 操作按钮区域引用（导出时需要隐藏）
const actionButtonsRef = ref<HTMLElement | null>(null)
// 播放视频按钮引用（导出时需要隐藏）
const playVideoBtnRef = ref<HTMLElement | null>(null)

// 导出PDF报告 - 使用 html2canvas 截图方式，完美支持中文
const exportReport = async () => {
  if (!analysisData.value) {
    ElMessage.warning('没有可导出的分析数据')
    return
  }
  
  if (!reportContentRef.value) {
    ElMessage.error('无法获取报告内容')
    return
  }
  
  exportingPdf.value = true
  ElMessage.info('正在生成PDF报告，请稍候...')
  
  // 隐藏操作按钮区域和播放视频按钮
  const actionButtons = actionButtonsRef.value
  const playVideoBtn = playVideoBtnRef.value
  if (actionButtons) {
    actionButtons.style.display = 'none'
  }
  if (playVideoBtn) {
    playVideoBtn.style.display = 'none'
  }
  
  try {
    // 动态导入 html2canvas 和 jsPDF
    const html2canvasModule = await import('html2canvas')
    const html2canvas = html2canvasModule.default
    // @ts-ignore
    const jsPDFModule = await import('jspdf')
    const jsPDF = jsPDFModule.default || jsPDFModule.jsPDF
    
    const element = reportContentRef.value
    
    // 使用 html2canvas 将内容渲染为图片
    const canvas = await html2canvas(element, {
      scale: 2, // 提高清晰度
      useCORS: true,
      allowTaint: true,
      backgroundColor: '#ecf0f3', // 背景色
      logging: false
    })
    
    const imgData = canvas.toDataURL('image/png')
    const imgWidth = canvas.width
    const imgHeight = canvas.height
    
    // 创建 PDF
    const pdf = new jsPDF('p', 'mm', 'a4')
    const pageWidth = pdf.internal.pageSize.getWidth()
    const pageHeight = pdf.internal.pageSize.getHeight()
    const margin = 10
    const contentWidth = pageWidth - margin * 2
    
    // 计算图片在PDF中的尺寸
    const ratio = contentWidth / imgWidth
    const scaledHeight = imgHeight * ratio
    
    // 如果内容超过一页，需要分页
    let yPos = margin
    let remainingHeight = scaledHeight
    let sourceY = 0
    
    while (remainingHeight > 0) {
      const availableHeight = pageHeight - margin * 2
      const heightToDraw = Math.min(remainingHeight, availableHeight)
      
      // 计算源图片中的对应区域
      const sourceHeight = heightToDraw / ratio
      
      // 创建临时画布来裁剪图片
      const tempCanvas = document.createElement('canvas')
      tempCanvas.width = imgWidth
      tempCanvas.height = sourceHeight
      const ctx = tempCanvas.getContext('2d')
      if (ctx) {
        ctx.drawImage(
          canvas,
          0, sourceY, imgWidth, sourceHeight,
          0, 0, imgWidth, sourceHeight
        )
        const tempImgData = tempCanvas.toDataURL('image/png')
        pdf.addImage(tempImgData, 'PNG', margin, yPos, contentWidth, heightToDraw)
      }
      
      remainingHeight -= heightToDraw
      sourceY += sourceHeight
      
      if (remainingHeight > 0) {
        pdf.addPage()
        yPos = margin
      }
    }
    
    // 保存PDF
    const data = analysisData.value
    const fileName = `分析报告_${data.videoTitle || '视频'}_${new Date().toLocaleDateString('zh-CN').replace(/\//g, '-')}.pdf`
    pdf.save(fileName)
    
    ElMessage.success('PDF报告导出成功！')
  } catch (error: any) {
    ElMessage.error(error?.message || 'PDF导出失败，请稍后重试')
  } finally {
    // 恢复按钮显示
    if (actionButtons) {
      actionButtons.style.display = ''
    }
    if (playVideoBtn) {
      playVideoBtn.style.display = ''
    }
    exportingPdf.value = false
  }
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

// 订阅任务完成事件，自动刷新视频列表
subscribeCompleted((data) => {
  fetchVideos()
  
  // 如果当前选中的视频刚完成分析，自动加载结果
  if (selectedVideoId.value === data.videoId) {
    loadAnalysisByVideo()
  }
})

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
    
    .video-selector-btn {
      display: flex;
      align-items: center;
      gap: 8px;
    }
  }
  
  // 视频选择侧边栏
  .video-drawer-overlay {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0);
    z-index: 998;
    pointer-events: none;
    transition: background 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    
    &.active {
      background: rgba(0, 0, 0, 0.5);
      backdrop-filter: blur(4px);
      pointer-events: all;
    }
  }
  
  .video-drawer {
    position: fixed;
    top: 0;
    right: -420px;
    width: 400px;
    height: 100vh;
    background: linear-gradient(145deg, #f5f7fa, #e8ecef);
    box-shadow: 
      -8px 0 24px rgba(0, 0, 0, 0.15),
      -4px 0 12px rgba(0, 0, 0, 0.1);
    z-index: 999;
    transition: right 0.4s cubic-bezier(0.4, 0, 0.2, 1);
    display: flex;
    flex-direction: column;
    overflow: hidden;
    
    &.active {
      right: 0;
    }
    
    .drawer-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 20px 24px;
      border-bottom: 1px solid rgba(209, 217, 230, 0.5);
      background: rgba(255, 255, 255, 0.5);
      backdrop-filter: blur(10px);
      
      h3 {
        margin: 0;
        font-size: 18px;
        font-weight: 700;
        color: $black;
      }
      
      .close-btn {
        display: flex;
        align-items: center;
        justify-content: center;
        width: 36px;
        height: 36px;
        border: none;
        border-radius: 10px;
        background: $neu-1;
        color: $gray;
        cursor: pointer;
        transition: all 0.25s ease;
        box-shadow: 
          3px 3px 6px rgba(163, 177, 198, 0.4),
          -3px -3px 6px rgba(255, 255, 255, 0.9);
        
        .el-icon {
          font-size: 18px;
        }
        
        &:hover {
          color: $purple;
          transform: rotate(90deg);
        }
        
        &:active {
          box-shadow: 
            inset 3px 3px 6px rgba(163, 177, 198, 0.5),
            inset -3px -3px 6px rgba(255, 255, 255, 0.8);
        }
      }
    }
    
    .drawer-content {
      flex: 1;
      overflow-y: auto;
      padding: 16px;
      
      &::-webkit-scrollbar {
        width: 6px;
      }
      
      &::-webkit-scrollbar-track {
        background: transparent;
      }
      
      &::-webkit-scrollbar-thumb {
        background: rgba(160, 165, 168, 0.3);
        border-radius: 3px;
        
        &:hover {
          background: rgba(160, 165, 168, 0.5);
        }
      }
    }
    
    .video-list-container {
      display: flex;
      flex-direction: column;
      gap: 12px;
    }
    
    .video-item {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 16px;
      border-radius: 16px;
      background: $neu-1;
      cursor: pointer;
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      box-shadow: 
        4px 4px 8px rgba(163, 177, 198, 0.3),
        -4px -4px 8px rgba(255, 255, 255, 0.9);
      border: 2px solid transparent;
      
      .video-item-icon {
        display: flex;
        align-items: center;
        justify-content: center;
        width: 40px;
        height: 40px;
        border-radius: 12px;
        background: linear-gradient(135deg, $purple, #6b8be8);
        color: white;
        flex-shrink: 0;
        box-shadow: 
          0 4px 12px rgba(75, 112, 226, 0.3),
          inset 0 1px 2px rgba(255, 255, 255, 0.2);
      }
      
      .video-item-info {
        flex: 1;
        min-width: 0;
        
        .video-item-title {
          font-size: 14px;
          font-weight: 600;
          color: $black;
          margin-bottom: 4px;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
        
        .video-item-meta {
          font-size: 12px;
          color: $gray;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
      }
      
      .video-item-status {
        flex-shrink: 0;
        
        .status-badge {
          padding: 4px 10px;
          border-radius: 12px;
          font-size: 11px;
          font-weight: 500;
          
          &.pending {
            background: rgba(144, 147, 153, 0.15);
            color: #909399;
          }
          
          &.processing {
            background: rgba(230, 162, 60, 0.15);
            color: #e6a23c;
          }
          
          &.completed {
            background: rgba(103, 194, 58, 0.15);
            color: #67c23a;
          }
          
          &.failed {
            background: rgba(245, 108, 108, 0.15);
            color: #f56c6c;
          }
        }
      }
      
      &:hover {
        transform: translateX(-4px);
        border-color: rgba($purple, 0.3);
        box-shadow: 
          6px 6px 12px rgba(163, 177, 198, 0.4),
          -6px -6px 12px rgba(255, 255, 255, 1),
          0 0 0 3px rgba($purple, 0.1);
      }
      
      &.active {
        background: linear-gradient(135deg, rgba($purple, 0.1), rgba(107, 139, 232, 0.05));
        border-color: $purple;
        box-shadow: 
          inset 2px 2px 4px rgba(0, 0, 0, 0.05),
          0 6px 16px rgba(75, 112, 226, 0.2),
          0 0 0 2px rgba($purple, 0.15);
        
        .video-item-icon {
          box-shadow: 
            0 6px 16px rgba(75, 112, 226, 0.4),
            inset 0 1px 2px rgba(255, 255, 255, 0.3);
        }
      }
      
      &:active {
        transform: translateX(-2px) scale(0.98);
      }
    }
    
    .empty-video-list {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 60px 20px;
      text-align: center;
      color: $gray;
      
      .el-icon {
        margin-bottom: 16px;
        opacity: 0.5;
      }
      
      p {
        margin: 0 0 20px 0;
        font-size: 14px;
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
    
    .video-title-row {
      display: flex;
      align-items: center;
      gap: 16px;
      flex-wrap: wrap;
      
      .video-title {
        font-size: 16px;
        font-weight: 600;
        color: $black;
      }
      
      .video-meta {
        font-size: 13px;
        color: $gray;
      }
    }
    
    .video-description {
      margin-top: 8px;
      font-size: 13px;
      color: $gray;
      line-height: 1.5;
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
