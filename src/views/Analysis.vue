<template>
  <div class="analysis-page">
    <div class="header-actions">
      <h2 class="page-title">分析结果</h2>
      <div class="header-select">
        <el-select 
          v-model="selectedVideoId" 
          placeholder="选择视频" 
          @change="loadAnalysis" 
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
        <h3>请选择一个视频</h3>
        <p>选择已分析的视频即可查看详细的多模态分析结果</p>
        <button class="neu-btn primary-btn" @click="$router.push('/videos')">
          <el-icon><VideoPlay /></el-icon>
          去选择视频
        </button>
      </div>
    </div>
    
    <!-- 分析结果展示 -->
    <div v-else class="analysis-content">
      <!-- 风险评分卡片 -->
      <div class="risk-cards-grid">
        <div class="neu-card risk-card" :class="getRiskClass(analysisData.riskLevel)">
          <div class="risk-icon">
            <el-icon :size="28"><Warning /></el-icon>
          </div>
          <div class="risk-info">
            <div class="risk-score">{{ formatScore(analysisData.riskScore) }}</div>
            <div class="risk-label">风险评分</div>
            <div class="risk-level">{{ getRiskLevelText(analysisData.riskLevel) }}</div>
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
              {{ analysisData.universityName }}
            </div>
          </div>
        </div>
        
        <div class="neu-card stat-card">
          <div class="stat-icon success">
            <el-icon :size="24"><ChatDotRound /></el-icon>
          </div>
          <div class="stat-info">
            <div class="stat-value">{{ getSentimentText(analysisData.sentimentLabel) }}</div>
            <div class="stat-label">情感倾向</div>
            <div class="stat-detail">
              评分: {{ formatScore(analysisData.sentimentScore) }}
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
            <span class="card-title">多模态特征分析</span>
          </div>
          <v-chart :option="featureChartOption" class="chart" />
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
          <div class="feature-details" v-if="videoFeatures">
            <div class="feature-item">
              <span class="feature-label">视频时长</span>
              <span class="feature-value">{{ videoFeatures.duration }}秒</span>
            </div>
            <div class="feature-item">
              <span class="feature-label">帧数</span>
              <span class="feature-value">{{ videoFeatures.frameCount }}</span>
            </div>
            <div class="feature-item">
              <span class="feature-label">场景类型</span>
              <span class="feature-value">{{ videoFeatures.sceneType || '未知' }}</span>
            </div>
            <div class="feature-item">
              <span class="feature-label">是否有人物</span>
              <span class="feature-value">{{ videoFeatures.hasPerson ? '是' : '否' }}</span>
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
          <div class="feature-details" v-if="audioFeatures">
            <div class="feature-item full">
              <span class="feature-label">语音转文字</span>
              <div class="feature-value transcription">
                {{ analysisData.transcription || '暂无转录内容' }}
              </div>
            </div>
            <div class="feature-item">
              <span class="feature-label">音频时长</span>
              <span class="feature-value">{{ audioFeatures.duration }}秒</span>
            </div>
            <div class="feature-item">
              <span class="feature-label">说话人数量</span>
              <span class="feature-value">{{ audioFeatures.speakerCount || 1 }}</span>
            </div>
          </div>
          <div v-else class="empty-feature">
            <el-icon :size="36"><Microphone /></el-icon>
            <span>暂无音频特征数据</span>
          </div>
        </div>
      </div>
      
      <!-- 文本分析 -->
      <div class="neu-card text-analysis-card">
        <div class="card-header">
          <span class="card-title">
            <el-icon><Document /></el-icon>
            文本分析
          </span>
        </div>
        <div class="text-analysis-content" v-if="textFeatures">
          <div class="keywords-section">
            <h4>主题关键词</h4>
            <div class="keywords-list">
              <span
                v-for="(keyword, index) in textFeatures.keywords"
                :key="index"
                class="keyword-tag"
                :class="{ primary: Number(index) < 3 }"
              >
                {{ keyword }}
              </span>
            </div>
          </div>
          <div class="topic-section" v-if="textFeatures.topics">
            <h4>主题分布</h4>
            <div class="topics-list">
              <div
                v-for="(topic, index) in textFeatures.topics"
                :key="index"
                class="topic-item"
              >
                <span class="topic-name">{{ topic.name }}</span>
                <div class="topic-bar">
                  <div class="topic-fill" :style="{ width: (topic.score * 100) + '%' }"></div>
                </div>
                <span class="topic-score">{{ (topic.score * 100).toFixed(1) }}%</span>
              </div>
            </div>
          </div>
        </div>
        <div v-else class="empty-feature centered">
          <el-icon :size="36"><Document /></el-icon>
          <span>暂无文本特征数据</span>
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
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { use } from 'echarts/core'
import { CanvasRenderer } from 'echarts/renderers'
import { PieChart, BarChart, RadarChart } from 'echarts/charts'
import {
  TitleComponent,
  TooltipComponent,
  LegendComponent,
  GridComponent
} from 'echarts/components'
import VChart from 'vue-echarts'
import { ElMessage } from 'element-plus'
import { getVideoList, type VideoInfo } from '@/api'

// 注册ECharts组件
use([
  CanvasRenderer,
  PieChart,
  BarChart,
  RadarChart,
  TitleComponent,
  TooltipComponent,
  LegendComponent,
  GridComponent
])

const loading = ref(false)
const selectedVideoId = ref<string>('')
const videoList = ref<VideoInfo[]>([])
const analysisData = ref<any>(null)

// 模拟分析数据
const mockAnalysisData = {
  riskScore: 0.65,
  riskLevel: 'MEDIUM',
  isUniversityRelated: true,
  universityName: '清华大学',
  universityConfidence: 0.92,
  topicCategory: '学习生活',
  sentimentScore: -0.3,
  sentimentLabel: 'NEGATIVE',
  transcription: '大家好，今天想和大家分享一下我在大学的学习经历...',
  videoFeatures: {
    duration: 120.5,
    frameCount: 2892,
    sceneType: 'indoor',
    hasPerson: true
  },
  audioFeatures: {
    duration: 120.5,
    speakerCount: 1
  },
  textFeatures: {
    keywords: ['大学', '学习', '生活', '经验', '分享', '校园'],
    topics: [
      { name: '学习生活', score: 0.45 },
      { name: '校园恋爱', score: 0.15 },
      { name: '考试经验', score: 0.25 },
      { name: '专业介绍', score: 0.15 }
    ]
  }
}

// 计算属性
const videoFeatures = computed(() => {
  if (!analysisData.value) return null
  return typeof analysisData.value.videoFeatures === 'string'
    ? JSON.parse(analysisData.value.videoFeatures)
    : analysisData.value.videoFeatures
})

const audioFeatures = computed(() => {
  if (!analysisData.value) return null
  return typeof analysisData.value.audioFeatures === 'string'
    ? JSON.parse(analysisData.value.audioFeatures)
    : analysisData.value.audioFeatures
})

const textFeatures = computed(() => {
  if (!analysisData.value) return null
  return typeof analysisData.value.textFeatures === 'string'
    ? JSON.parse(analysisData.value.textFeatures)
    : analysisData.value.textFeatures
})

// 新拟态配色
const neuColors = {
  purple: '#4b70e2',
  gray: '#a0a5a8',
  black: '#181818',
  neu1: '#ecf0f3',
  neu2: '#d1d9e6'
}

// 风险评分图表配置
const riskChartOption = computed(() => ({
  tooltip: {
    trigger: 'item',
    formatter: '{b}: {c} ({d}%)'
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
        { value: analysisData.value?.riskScore || 0, name: '风险评分', itemStyle: { color: '#f56c6c' } },
        { value: 1 - (analysisData.value?.riskScore || 0), name: '安全评分', itemStyle: { color: '#52c41a' } }
      ]
    }
  ]
}))

// 多模态特征雷达图配置
const featureChartOption = computed(() => {
  const data = analysisData.value
  if (!data) return {}
  
  return {
    tooltip: {},
    radar: {
      indicator: [
        { name: '视频特征', max: 1 },
        { name: '音频特征', max: 1 },
        { name: '文本特征', max: 1 },
        { name: '高校关联', max: 1 },
        { name: '情感分析', max: 1 }
      ],
      center: ['50%', '50%'],
      radius: '70%',
      axisLine: { lineStyle: { color: neuColors.neu2 } },
      splitLine: { lineStyle: { color: neuColors.neu2 } },
      splitArea: { areaStyle: { color: ['rgba(75, 112, 226, 0.02)', 'rgba(75, 112, 226, 0.05)'] } }
    },
    series: [
      {
        type: 'radar',
        data: [
          {
            value: [
              data.riskScore || 0,
              Math.abs(data.sentimentScore || 0),
              data.universityConfidence || 0,
              data.isUniversityRelated ? 1 : 0,
              Math.abs(data.sentimentScore || 0)
            ],
            name: '综合评分',
            areaStyle: {
              color: 'rgba(75, 112, 226, 0.2)'
            },
            lineStyle: {
              color: neuColors.purple,
              width: 2
            },
            itemStyle: {
              color: neuColors.purple
            }
          }
        ]
      }
    ]
  }
})

// 方法
const loadAnalysis = async () => {
  if (!selectedVideoId.value) {
    analysisData.value = null
    return
  }
  
  loading.value = true
  try {
    await new Promise(resolve => setTimeout(resolve, 1000))
    analysisData.value = mockAnalysisData
  } catch (error) {
    ElMessage.error('加载分析结果失败')
    console.error(error)
  } finally {
    loading.value = false
  }
}

const fetchVideos = async () => {
  try {
    const response = await getVideoList(1, 100)
    if (response.code === 200) {
      videoList.value = response.data.records.filter(v => v.status === 'COMPLETED')
    }
  } catch (error) {
    console.error('获取视频列表失败:', error)
  }
}

const formatScore = (score: number | null | undefined): string => {
  if (score === null || score === undefined) return '0.00'
  return (score * 100).toFixed(2) + '%'
}

const getRiskClass = (level: string): string => {
  const classes: Record<string, string> = {
    'LOW': 'risk-low',
    'MEDIUM': 'risk-medium',
    'HIGH': 'risk-high'
  }
  return classes[level] || 'risk-medium'
}

const getRiskLevelText = (level: string): string => {
  const texts: Record<string, string> = {
    'LOW': '低风险',
    'MEDIUM': '中风险',
    'HIGH': '高风险'
  }
  return texts[level] || '未知'
}

const getSentimentText = (label: string): string => {
  const texts: Record<string, string> = {
    'POSITIVE': '积极',
    'NEUTRAL': '中性',
    'NEGATIVE': '消极'
  }
  return texts[label] || '未知'
}

const exportReport = () => {
  ElMessage.info('PDF报告导出功能开发中...')
}

onMounted(() => {
  fetchVideos()
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
  padding: 14px 28px;
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

// 文本分析卡片
.text-analysis-card {
  margin-bottom: 24px;
  
  .text-analysis-content {
    padding: 24px;
    
    h4 {
      font-size: 14px;
      font-weight: 600;
      color: $black;
      margin: 0 0 14px;
    }
    
    .keywords-section {
      margin-bottom: 28px;
      
      .keywords-list {
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
    
    .topic-section {
      .topics-list {
        .topic-item {
          display: flex;
          align-items: center;
          gap: 14px;
          margin-bottom: 14px;
          
          .topic-name {
            width: 90px;
            font-size: 13px;
            color: $black;
            font-weight: 500;
          }
          
          .topic-bar {
            flex: 1;
            height: 10px;
            background: $neu-1;
            border-radius: 5px;
            box-shadow: inset 2px 2px 4px $neu-2, inset -2px -2px 4px $white;
            overflow: hidden;
            
            .topic-fill {
              height: 100%;
              background: linear-gradient(135deg, $purple 0%, #7c9df7 100%);
              border-radius: 5px;
            }
          }
          
          .topic-score {
            width: 50px;
            text-align: right;
            font-size: 13px;
            color: $gray;
            font-weight: 500;
          }
        }
      }
    }
  }
  
  .empty-feature.centered {
    padding: 64px 20px;
  }
}

// 操作按钮
.action-buttons {
  display: flex;
  gap: 16px;
  justify-content: center;
  padding-top: 8px;
}
</style>
