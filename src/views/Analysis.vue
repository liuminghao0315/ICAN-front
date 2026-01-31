<template>
  <div class="analysis-page">
    <div class="header-actions">
      <h2 class="page-title">分析结果</h2>
      <div class="header-actions-right">
        <!-- 视图切换按钮 -->
        <div class="view-mode-toggle" v-if="analysisData">
          <button 
            class="neu-btn" 
            :class="{ 'active': viewMode === 'interactive' }"
            @click="viewMode = 'interactive'"
          >
            <el-icon><VideoPlay /></el-icon>
            交互分析
          </button>
          <button 
            class="neu-btn" 
            :class="{ 'active': viewMode === 'report' }"
            @click="viewMode = 'report'"
          >
            <el-icon><Document /></el-icon>
            报告视图
          </button>
        </div>
        <button class="neu-btn primary-btn video-selector-btn" @click="showVideoDrawer = true">
          <el-icon><VideoPlay /></el-icon>
          选择视频
        </button>
      </div>
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
    <div v-else>
      <!-- 交互式分析视图 -->
      <transition name="fade" mode="out-in">
      <div v-if="viewMode === 'interactive'" key="interactive" class="interactive-view">
        <div class="multi-modal-container">
          <!-- 左侧：视频播放器区域 -->
          <div class="video-section">
            <div class="video-player-wrapper">
              <video
                v-if="analysisData?.videoUrl"
                :src="analysisData.videoUrl"
                controls
                class="main-video-player"
                ref="mainVideoPlayerRef"
                @timeupdate="onVideoTimeUpdate"
                @loadedmetadata="onVideoLoaded"
              ></video>
              
              <!-- 视频占位符 -->
              <div v-else class="video-placeholder">
                <el-icon :size="80" color="#a0a5a8"><VideoPlay /></el-icon>
                <p>视频加载中...</p>
              </div>
              
              <!-- 检测框叠加层 -->
              <div class="detection-overlay" v-if="currentDetection">
                <div 
                  class="detection-box"
                  :style="getDetectionBoxStyle(currentDetection)"
                >
                  <span class="detection-label">{{ currentDetection.type }} ({{ Math.round(currentDetection.confidence * 100) }}%)</span>
                </div>
              </div>
            </div>
            
            <!-- 视频信息 -->
            <div class="video-meta-bar">
              <div class="video-title-info">
                <el-icon :size="20"><VideoPlay /></el-icon>
                <span class="title-text">{{ analysisData.videoTitle }}</span>
              </div>
              <div class="video-stats">
                <span class="risk-badge" :class="getRiskClass(analysisData.riskLevel)">
                  {{ analysisData.riskLevelDesc || getRiskLevelText(analysisData.riskLevel) }}
                </span>
                <span class="score-badge">风险: {{ formatScore(analysisData.riskScore) }}</span>
              </div>
            </div>
          </div>
          
          <!-- 右侧：台词列表区域 -->
          <div class="transcript-panel">
            <div class="panel-header">
              <div class="panel-title">
                <el-icon><Microphone /></el-icon>
                语音转文字与风险定位
              </div>
              <div class="panel-subtitle">点击台词跳转播放 · 当前段落自动高亮</div>
            </div>
            
            <div class="transcript-list">
              <div 
                v-for="(segment, index) in mockTranscriptSegments" 
                :key="index"
                class="transcript-segment"
                :class="{ 
                  'active': currentSegmentIndex === index,
                  'high-risk': segment.riskLevel === 'high',
                  'medium-risk': segment.riskLevel === 'medium'
                }"
                @click="jumpToTime(segment.start)"
              >
                <div class="segment-header">
                  <span class="time-range">{{ formatTimestamp(segment.start) }} - {{ formatTimestamp(segment.end) }}</span>
                  <span class="emotion-badge" :class="getEmotionClass(segment.emotion)">
                    {{ getEmotionText(segment.emotion) }}
                  </span>
                  <span v-if="segment.riskLevel !== 'low'" class="risk-tag" :class="segment.riskLevel">
                    {{ segment.riskLevel === 'high' ? '高风险' : '中风险' }}
                  </span>
                </div>
                <div class="segment-text" v-html="highlightKeywords(segment.text, segment.keywords)"></div>
              </div>
              
              <div v-if="mockTranscriptSegments.length === 0" class="empty-transcript">
                <el-icon :size="36"><Microphone /></el-icon>
                <p>暂无语音转录数据</p>
              </div>
            </div>
          </div>
        </div>
        
        <!-- 多轨道时间轴 -->
        <div class="multi-track-timeline neu-card">
          <div class="card-header">
            <span class="card-title">
              <el-icon><DataLine /></el-icon>
              多模态风险时间轴
            </span>
            <span class="card-subtitle">点击任意位置跳转播放 · 三模态风险一目了然</span>
          </div>
          <div class="timeline-content">
            <v-chart :option="multiModalTimelineOption" class="timeline-chart" @click="onTimelineClick" />
          </div>
        </div>
        
        <!-- 关键指标卡片 -->
        <div class="stats-summary-grid">
          <div class="neu-card stat-summary">
            <div class="stat-icon video-icon">
              <el-icon :size="24"><VideoCamera /></el-icon>
            </div>
            <div class="stat-content">
              <div class="stat-value">{{ mockVideoRisks.length }}</div>
              <div class="stat-label">视频风险点</div>
            </div>
          </div>
          
          <div class="neu-card stat-summary">
            <div class="stat-icon audio-icon">
              <el-icon :size="24"><Microphone /></el-icon>
            </div>
            <div class="stat-content">
              <div class="stat-value">{{ angryEmotionCount }}</div>
              <div class="stat-label">情绪波动</div>
            </div>
          </div>
          
          <div class="neu-card stat-summary">
            <div class="stat-icon text-icon">
              <el-icon :size="24"><Document /></el-icon>
            </div>
            <div class="stat-content">
              <div class="stat-value">{{ highRiskSegmentCount }}</div>
              <div class="stat-label">高风险台词</div>
            </div>
          </div>
          
          <div class="neu-card stat-summary">
            <div class="stat-icon university-icon">
              <el-icon :size="24"><School /></el-icon>
            </div>
            <div class="stat-content">
              <div class="stat-value">{{ analysisData.isUniversityRelated ? '是' : '否' }}</div>
              <div class="stat-label">高校相关</div>
            </div>
          </div>
        </div>
      </div>
      
      <!-- 报告视图（原有的完整报告，用于PDF导出） -->
      <div v-else key="report" class="analysis-content" ref="reportContentRef">
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
        <button class="neu-btn play-video-btn" @click="playVideo()" v-if="analysisData.videoUrl">
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
      
      <!-- 详细分析结果 - 聚焦风险预警 -->
      <div class="details-grid">
        <!-- 视频内容分析 -->
        <div class="neu-card">
          <div class="card-header">
            <span class="card-title">
              <el-icon><VideoCamera /></el-icon>
              视频内容分析
            </span>
          </div>
          <div class="feature-details" v-if="analysisData.videoFeatures">
            <div class="feature-item">
              <span class="feature-label">内容类型</span>
              <span class="feature-value">{{ analysisData.videoFeatures.sceneType || '未知' }}</span>
            </div>
            <div class="feature-item">
              <span class="feature-label">高校场景识别</span>
              <span class="feature-value">
                {{ isUniversityScene(analysisData.videoFeatures.sceneType) ? '是' : '否' }}
              </span>
            </div>
            <div class="feature-item">
              <span class="feature-label">人物出现</span>
              <span class="feature-value">
                {{ analysisData.videoFeatures.hasPerson ? '是' : '否' }}
                <span v-if="analysisData.videoFeatures.faceCount > 0">({{ analysisData.videoFeatures.faceCount }}人)</span>
              </span>
            </div>
            <div class="feature-item">
              <span class="feature-label">视频时长</span>
              <span class="feature-value">{{ formatDuration(analysisData.videoFeatures.duration) }}</span>
            </div>
          </div>
          <div v-else class="empty-feature">
            <el-icon :size="36"><VideoCamera /></el-icon>
            <span>暂无视频分析数据</span>
          </div>
        </div>
        
        <!-- 语音内容分析 -->
        <div class="neu-card">
          <div class="card-header">
            <span class="card-title">
              <el-icon><Microphone /></el-icon>
              语音内容识别
            </span>
          </div>
          <div class="feature-details" v-if="analysisData.transcription">
            <div class="feature-item full">
              <span class="feature-label">语音转文字内容</span>
              <div class="feature-value transcription">
                {{ analysisData.transcription }}
              </div>
            </div>
            <div class="feature-item">
              <span class="feature-label">检测到语音</span>
              <span class="feature-value">{{ analysisData.audioFeatures?.hasAudio ? '是' : '否' }}</span>
            </div>
            <div class="feature-item">
              <span class="feature-label">语音清晰度</span>
              <span class="feature-value">{{ analysisData.audioFeatures?.speechRatio > 0.5 ? '清晰' : '模糊' }}</span>
            </div>
          </div>
          <div v-else class="empty-feature">
            <el-icon :size="36"><Microphone /></el-icon>
            <span>暂无语音内容</span>
          </div>
        </div>
        
        <!-- 文本风险分析 -->
        <div class="neu-card">
          <div class="card-header">
            <span class="card-title">
              <el-icon><Document /></el-icon>
              内容风险分析
            </span>
          </div>
          <div class="feature-details" v-if="analysisData.topicKeywords || analysisData.sentimentLabel">
            <div class="feature-item">
              <span class="feature-label">主题分类</span>
              <span class="feature-value">{{ analysisData.topicCategory || '未分类' }}</span>
            </div>
            <div class="feature-item">
              <span class="feature-label">言论倾向</span>
              <span class="feature-value">
                <span :class="getSentimentRiskClass(analysisData.sentimentLabel)">
                  {{ getSentimentText(analysisData.sentimentLabel) }}
                </span>
              </span>
            </div>
            <div class="feature-item full" v-if="analysisData.topicKeywords && analysisData.topicKeywords.length > 0">
              <span class="feature-label">提取关键词</span>
              <div class="feature-value keywords-inline">
                <span 
                  v-for="(keyword, index) in analysisData.topicKeywords.slice(0, 7)" 
                  :key="index"
                  class="keyword-tag-small"
                  :class="{ primary: index < 3 }"
                >
                  {{ keyword }}
                </span>
              </div>
            </div>
            <div class="feature-item" v-if="analysisData.isUniversityRelated !== undefined">
              <span class="feature-label">高校相关内容</span>
              <span class="feature-value">
                <span :class="analysisData.isUniversityRelated ? 'text-warning' : 'text-muted'">
                  {{ analysisData.isUniversityRelated ? '是' : '否' }}
                </span>
                <span v-if="analysisData.universityName" class="text-primary"> - {{ analysisData.universityName }}</span>
              </span>
            </div>
          </div>
          <div v-else class="empty-feature">
            <el-icon :size="36"><Document /></el-icon>
            <span>暂无文本分析数据</span>
          </div>
        </div>
      </div>
      
      <!-- 内容词云图 -->
      <div class="neu-card wordcloud-card" v-if="getWordCloudData().length > 0">
        <div class="card-header">
          <span class="card-title">
            <el-icon><DataAnalysis /></el-icon>
            内容词云分析
          </span>
          <span class="card-subtitle">基于语音识别文本的关键词频统计</span>
        </div>
        <div class="wordcloud-content">
          <div class="wordcloud-visual">
            <span
              v-for="(item, index) in getWordCloudData().slice(0, 20)"
              :key="index"
              class="word-item"
              :style="getWordStyle(item.value, index)"
            >
              {{ item.name }}
            </span>
          </div>
        </div>
      </div>
      
      <!-- 敏感内容检测 -->
      <div class="neu-card sensitive-card">
        <div class="card-header">
          <span class="card-title">
            <el-icon><Warning /></el-icon>
            敏感内容检测
          </span>
        </div>
        <div class="sensitive-content">
          <div v-if="getSensitiveWords().length === 0" class="no-sensitive">
            <el-icon :size="36" color="#52c41a"><Select /></el-icon>
            <p>✅ 未检测到敏感词汇</p>
            <p class="hint">内容安全，无明显风险</p>
          </div>
          <div v-else class="sensitive-list">
            <div class="sensitive-warning">
              <el-icon color="#f56c6c"><Warning /></el-icon>
              <span>检测到 {{ getSensitiveWords().length }} 个敏感词</span>
            </div>
            <div 
              v-for="(item, index) in getSensitiveWords()"
              :key="index"
              class="sensitive-item"
            >
              <span class="sensitive-word">{{ item.word }}</span>
              <span class="sensitive-category">{{ item.category }}</span>
            </div>
          </div>
        </div>
      </div>
      
      <!-- 影响力评估 -->
      <div class="neu-card audience-card" v-if="analysisData.audienceAnalysis">
        <div class="card-header">
          <span class="card-title">
            <el-icon><User /></el-icon>
            影响力评估
          </span>
          <span class="card-subtitle">基于内容特征的传播潜力分析</span>
        </div>
        <div class="audience-content">
          <div class="audience-stats">
            <div class="stat-box">
              <div class="stat-number">{{ formatScore(analysisData.spreadPotential) }}</div>
              <div class="stat-name">传播潜力</div>
              <div class="stat-hint">如发布到公开平台的预期传播范围</div>
            </div>
            <div class="stat-box" v-if="analysisData.audienceAnalysis.ageDistribution">
              <div class="stat-number">{{ getPrimaryAudience(analysisData.audienceAnalysis.ageDistribution) }}</div>
              <div class="stat-name">主要受众</div>
              <div class="stat-hint">最可能关注此内容的人群</div>
            </div>
          </div>
          <div class="interests-section" v-if="analysisData.audienceAnalysis.predictedInterests">
            <h4>潜在受众兴趣标签</h4>
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
      
      <!-- 风险时间轴可视化 -->
      <div class="neu-card timeline-card" v-if="getRiskTimelineData()">
        <div class="card-header">
          <span class="card-title">
            <el-icon><DataLine /></el-icon>
            风险时间分布
          </span>
          <span class="card-subtitle">视频全时段风险指数变化趋势（点击跳转播放 | 悬停查看详情）</span>
        </div>
        <v-chart 
          :option="riskTimelineOption" 
          class="risk-timeline-chart"
          @click="onTimelineClick"
        />
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
      </div> <!-- 闭合报告视图 -->
      </transition>
    </div> <!-- 闭合分析结果展示区域 -->
    
    <!-- 视频播放对话框 -->
    <el-dialog
      v-model="videoDialogVisible"
      :title="analysisData?.videoTitle"
      width="800px"
      destroy-on-close
      @opened="onVideoDialogOpened"
    >
      <video
        v-if="analysisData?.videoUrl"
        :src="analysisData.videoUrl"
        controls
        autoplay
        class="video-player"
        ref="videoPlayerRef"
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
import { PieChart, BarChart, LineChart } from 'echarts/charts'
import {
  TitleComponent,
  TooltipComponent,
  LegendComponent,
  GridComponent,
  MarkPointComponent,
  MarkLineComponent
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
  LineChart,
  TitleComponent,
  TooltipComponent,
  LegendComponent,
  GridComponent,
  MarkPointComponent,
  MarkLineComponent
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
const videoStartTime = ref(0)  // 视频起始播放时间
const emptyMessage = ref('请选择一个视频')
const showVideoDrawer = ref(false)

// 视图模式：交互式 or 报告式
const viewMode = ref<'interactive' | 'report'>('interactive')

// 主视频播放器引用
const mainVideoPlayerRef = ref<HTMLVideoElement | null>(null)

// 当前播放时间
const currentPlayTime = ref(0)

// 当前激活的台词段落索引
const currentSegmentIndex = ref(-1)

// 当前显示的检测框
const currentDetection = ref<any>(null)

// 模拟数据：带时间戳的转录文本
const mockTranscriptSegments = computed(() => {
  if (!analysisData.value) return []
  
  // 基于实际转录文本生成模拟分段
  const transcription = analysisData.value.transcription || ''
  const duration = (analysisData.value.videoFeatures as any)?.duration || 180
  
  return [
    {
      start: 0,
      end: 15,
      text: '大家好，我是今天的视频发布者，主要想聊聊最近发生的一些事情...',
      emotion: 'calm',
      riskLevel: 'low',
      keywords: []
    },
    {
      start: 15,
      end: 42,
      text: '首先声明一下，这个视频的内容都是基于事实的，没有任何夸张成分...',
      emotion: 'calm',
      riskLevel: 'low',
      keywords: []
    },
    {
      start: 42,
      end: 68,
      text: '但是学校的这个政策完全是欺骗学生的，大家千万不要相信，我们应该联合起来抵制这种行为！',
      emotion: 'angry',
      riskLevel: 'high',
      keywords: ['欺骗', '抵制', '联合']
    },
    {
      start: 68,
      end: 95,
      text: '我知道说这些话可能会有风险，但是我觉得必须要站出来说明真相...',
      emotion: 'serious',
      riskLevel: 'medium',
      keywords: ['风险', '真相']
    },
    {
      start: 95,
      end: 125,
      text: '如果不给我们一个合理的解释，这件事情没完，我们会一直追究下去...',
      emotion: 'tense',
      riskLevel: 'medium',
      keywords: ['追究']
    },
    {
      start: 125,
      end: Math.min(duration, 155),
      text: '希望能引起相关部门的注意，也希望更多的同学能够看到这个视频，了解真实情况。',
      emotion: 'calm',
      riskLevel: 'low',
      keywords: []
    }
  ].filter(seg => seg.end <= duration)
})

// 模拟数据：视频风险点
const mockVideoRisks = computed(() => {
  if (!analysisData.value) return []
  
  return [
    {
      time: 45,
      type: '非官方横幅',
      confidence: 0.98,
      boundingBox: { x: 20, y: 30, width: 40, height: 30 }
    },
    {
      time: 52,
      type: '激动手势',
      confidence: 0.85,
      boundingBox: { x: 35, y: 45, width: 25, height: 30 }
    },
    {
      time: 105,
      type: '违规标识',
      confidence: 0.91,
      boundingBox: { x: 15, y: 25, width: 35, height: 25 }
    }
  ]
})

// 模拟数据：音频情绪波动
const mockAudioEmotions = computed(() => {
  if (!analysisData.value) return []
  
  return [
    { start: 0, end: 15, emotion: 'calm', intensity: 0.3 },
    { start: 15, end: 42, emotion: 'calm', intensity: 0.4 },
    { start: 42, end: 68, emotion: 'angry', intensity: 0.9 },
    { start: 68, end: 95, emotion: 'tense', intensity: 0.7 },
    { start: 95, end: 125, emotion: 'tense', intensity: 0.6 },
    { start: 125, end: 155, emotion: 'calm', intensity: 0.4 }
  ]
})

// 统计数据（用于模板）
const angryEmotionCount = computed(() => {
  return mockAudioEmotions.value.filter(e => e.emotion === 'angry').length
})

const highRiskSegmentCount = computed(() => {
  return mockTranscriptSegments.value.filter(s => s.riskLevel === 'high').length
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

// 多模态时间轴配置（交互视图专用）
const multiModalTimelineOption = computed(() => {
  if (!analysisData.value) return {}
  
  const duration = (analysisData.value.videoFeatures as any)?.duration || 180
  const timePoints: number[] = []
  for (let t = 0; t <= duration; t += 5) {
    timePoints.push(t)
  }
  
  // 视频风险点数据
  const videoData = timePoints.map(t => {
    const risk = mockVideoRisks.value.find(r => Math.abs(r.time - t) < 3)
    return risk ? 1 : 0
  })
  
  // 音频情绪强度数据
  const audioData = timePoints.map(t => {
    const emotion = mockAudioEmotions.value.find(e => t >= e.start && t < e.end)
    return emotion ? emotion.intensity : 0
  })
  
  // 文本风险数据
  const textData = timePoints.map(t => {
    const segment = mockTranscriptSegments.value.find(s => t >= s.start && t < s.end)
    if (!segment) return 0
    return segment.riskLevel === 'high' ? 1 : segment.riskLevel === 'medium' ? 0.6 : 0
  })
  
  return {
    tooltip: {
      trigger: 'axis',
      axisPointer: { type: 'line' },
      formatter: (params: any) => {
        if (!params || params.length === 0) return ''
        const time = params[0].axisValue
        const m = Math.floor(time / 60)
        const s = Math.floor(time % 60)
        const timeStr = `${m}:${s.toString().padStart(2, '0')}`
        
        let html = `<div style="padding: 8px;"><b>时间: ${timeStr}</b><br/>`
        params.forEach((p: any) => {
          html += `${p.marker} ${p.seriesName}: ${p.value > 0 ? '检测到风险' : '正常'}<br/>`
        })
        html += '<div style="margin-top: 6px; color: #4b70e2; font-size: 11px;">💡 点击跳转播放</div></div>'
        return html
      }
    },
    legend: {
      data: ['视频风险', '音频情绪', '文本风险'],
      bottom: 5,
      textStyle: { color: neuColors.gray, fontSize: 12 }
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '15%',
      top: '8%',
      containLabel: true
    },
    xAxis: {
      type: 'category',
      data: timePoints,
      name: '时间（秒）',
      nameTextStyle: { color: neuColors.gray, fontSize: 11 },
      axisLine: { lineStyle: { color: neuColors.neu2 } },
      axisLabel: {
        color: neuColors.gray,
        fontSize: 11,
        formatter: (value: number) => formatTimestamp(value)
      }
    },
    yAxis: {
      type: 'value',
      max: 1,
      axisLine: { show: false },
      splitLine: { lineStyle: { color: '#e8edf3', type: 'dashed' } },
      axisLabel: { show: false }
    },
    series: [
      {
        name: '视频风险',
        type: 'bar',
        data: videoData,
        itemStyle: { color: '#f56c6c', borderRadius: [4, 4, 0, 0] },
        barWidth: '30%',
        barGap: '-100%'
      },
      {
        name: '音频情绪',
        type: 'line',
        data: audioData,
        smooth: true,
        lineStyle: { width: 3, color: '#faad14' },
        areaStyle: {
          color: {
            type: 'linear',
            x: 0, y: 0, x2: 0, y2: 1,
            colorStops: [
              { offset: 0, color: 'rgba(250, 173, 20, 0.4)' },
              { offset: 1, color: 'rgba(250, 173, 20, 0.1)' }
            ]
          }
        },
        showSymbol: false
      },
      {
        name: '文本风险',
        type: 'scatter',
        data: textData.map((v, i) => v > 0 ? [timePoints[i], v] : null).filter(Boolean),
        symbolSize: 12,
        itemStyle: { color: '#4b70e2' }
      }
    ]
  }
})

// 风险时间轴图表配置
const riskTimelineOption = computed(() => {
  const timelineData = getRiskTimelineData()
  if (!timelineData || !timelineData.timeSeriesData || timelineData.timeSeriesData.length === 0) {
    return {}
  }
  
  const times = timelineData.timeSeriesData.map((d: any) => d.time)
  const risks = timelineData.timeSeriesData.map((d: any) => d.risk * 100) // 转为百分比
  const riskPoints = timelineData.riskPoints || []
  
  // 构建风险点映射表（优化查找性能）
  const riskPointsMap = new Map()
  riskPoints.forEach((p: any) => {
    riskPointsMap.set(p.time, p)
  })
  
  return {
    tooltip: {
      trigger: 'axis',
      confine: true,  // 限制在图表区域内，防止被遮挡
      position: function (point: any, params: any, dom: any, rect: any, size: any) {
        // 智能定位：优先显示在右侧，空间不足时显示在左侧
        const x = point[0] < size.viewSize[0] / 2 ? point[0] + 20 : point[0] - size.contentSize[0] - 20
        return [x, point[1] - size.contentSize[1] / 2]
      },
      axisPointer: { 
        type: 'line',
        lineStyle: { color: '#4b70e2', width: 2, type: 'solid' }
      },
      formatter: (params: any) => {
        if (!params || !params[0]) return ''
        
        const dataIndex = params[0].dataIndex
        const timeValue = timelineData.timeSeriesData[dataIndex].time
        const riskValue = timelineData.timeSeriesData[dataIndex].risk * 100
        
        const m = Math.floor(timeValue / 60)
        const s = Math.floor(timeValue % 60)
        const timeStr = `${m}:${s.toString().padStart(2, '0')}`
        
        const color = riskValue > 70 ? '#f56c6c' : riskValue > 40 ? '#faad14' : '#52c41a'
        
        let html = `<div style="padding: 10px; min-width: 180px;">
          <div style="font-weight: 700; margin-bottom: 8px; font-size: 14px;">⏱️ 时间: ${timeStr}</div>
          <div style="color: ${color}; font-weight: 600; font-size: 15px;">
            📊 风险指数: ${riskValue.toFixed(1)}%
          </div>`
        
        // 查找最近的风险点
        const nearbyPoint = riskPoints.find((p: any) => Math.abs(p.time - timeValue) < 15)
        if (nearbyPoint) {
          html += `<div style="margin-top: 10px; padding-top: 8px; border-top: 1px solid #eee;">
            <div style="font-size: 12px; color: #f56c6c; font-weight: 600;">⚠️ 检测到风险</div>
            <div style="font-size: 11px; color: #666; margin-top: 4px;">${nearbyPoint.description}</div>
          </div>`
        } else {
          html += `<div style="margin-top: 10px; padding-top: 8px; border-top: 1px solid #eee;">
            <div style="font-size: 11px; color: #52c41a;">✅ 该时段无明显风险</div>
          </div>`
        }
        
        html += `<div style="margin-top: 10px; text-align: center;">
          <div style="font-size: 11px; color: #4b70e2; padding: 6px 12px; background: rgba(75,112,226,0.1); border-radius: 6px;">
            💡 点击图表跳转播放此时段
          </div>
        </div></div>`
        return html
      }
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '12%',
      top: '10%',
      containLabel: true
    },
    xAxis: {
      type: 'value',
      name: '时间（秒）',
      nameTextStyle: { color: neuColors.gray, fontSize: 11 },
      axisLine: { lineStyle: { color: neuColors.neu2 } },
      axisLabel: { 
        color: neuColors.gray, 
        fontSize: 11,
        formatter: (value: number) => formatTimestamp(value)
      },
      splitLine: { lineStyle: { color: '#e8edf3', type: 'dashed' } }
    },
    yAxis: {
      type: 'value',
      name: '风险指数',
      max: 100,
      nameTextStyle: { color: neuColors.gray, fontSize: 11 },
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
        name: '风险指数',
        type: 'line',
        smooth: true,
        data: times.map((time: number, index: number) => [time, risks[index]]),
        lineStyle: {
          width: 3,
          color: {
            type: 'linear',
            x: 0, y: 0, x2: 1, y2: 0,
            colorStops: [
              { offset: 0, color: '#52c41a' },
              { offset: 0.5, color: '#faad14' },
              { offset: 1, color: '#f56c6c' }
            ]
          }
        },
        areaStyle: {
          color: {
            type: 'linear',
            x: 0, y: 0, x2: 0, y2: 1,
            colorStops: [
              { offset: 0, color: 'rgba(75, 112, 226, 0.3)' },
              { offset: 1, color: 'rgba(75, 112, 226, 0.05)' }
            ]
          }
        },
        markPoint: {
          symbol: 'pin',
          symbolSize: 50,
          data: riskPoints.map((p: any) => ({
            coord: [p.time, p.riskScore * 100],
            value: '⚠',
            itemStyle: { color: p.level === 'high' ? '#f56c6c' : '#faad14' }
          }))
        },
        markLine: {
          silent: true,
          lineStyle: { type: 'dashed', color: '#faad14', width: 1 },
          data: [
            { yAxis: 40, label: { formatter: '中风险线', position: 'end' } },
            { yAxis: 70, label: { formatter: '高风险线', position: 'end' } }
          ]
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

const playVideo = (startTime: number = 0) => {
  videoStartTime.value = startTime
  videoDialogVisible.value = true
}

// 视频对话框打开后，跳转到指定时间
const onVideoDialogOpened = () => {
  setTimeout(() => {
    const videoElement = videoPlayerRef.value || document.querySelector('.video-player') as HTMLVideoElement
    if (videoElement) {
      console.log('视频元素找到，准备跳转到:', videoStartTime.value, '秒')
      
      // 等待视频元数据加载完成
      const jumpToTime = () => {
        if (videoStartTime.value > 0) {
          videoElement.currentTime = videoStartTime.value
          console.log('✅ 视频已跳转到:', videoStartTime.value, '秒，当前时间:', videoElement.currentTime)
        }
        videoElement.play().catch(e => console.log('自动播放失败:', e))
      }
      
      if (videoElement.readyState >= 2) {
        // 视频已经加载了元数据，直接跳转
        jumpToTime()
      } else {
        // 等待元数据加载
        videoElement.addEventListener('loadedmetadata', jumpToTime, { once: true })
      }
    } else {
      console.error('未找到视频元素')
    }
  }, 300)
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

// 获取主要受众年龄段
const getPrimaryAudience = (ageDistribution: Record<string, number>): string => {
  if (!ageDistribution) return '未知'
  
  let maxAge = ''
  let maxValue = 0
  
  Object.entries(ageDistribution).forEach(([age, value]) => {
    if (value > maxValue) {
      maxValue = value
      maxAge = age
    }
  })
  
  return maxAge ? `${maxAge}岁` : '未知'
}

// 判断是否为高校场景
const isUniversityScene = (sceneType: string | null | undefined): boolean => {
  if (!sceneType) return false
  const universityScenes = ['教室', '图书馆', '实验室', '报告厅', '宿舍', '食堂', '校园户外']
  return universityScenes.includes(sceneType)
}

// 情感风险样式
const getSentimentRiskClass = (label: SentimentLabel): string => {
  const classes: Record<SentimentLabel, string> = {
    'POSITIVE': 'text-success',
    'NEUTRAL': 'text-muted',
    'NEGATIVE': 'text-danger'
  }
  return classes[label] || 'text-muted'
}

// 词云样式（根据权重和索引）
const getWordStyle = (value: number, index: number) => {
  const maxSize = 32
  const minSize = 12
  const size = minSize + (maxSize - minSize) * (value / 1000)
  
  const colors = [
    '#4b70e2', '#7c9df7', '#a3bef9', '#6b8be8', 
    '#8ba3e8', '#5a7fd6', '#91a9f5', '#7589d8'
  ]
  const color = colors[index % colors.length]
  
  return {
    fontSize: `${size}px`,
    color: color,
    opacity: 0.7 + (value / 2000),
    margin: '8px',
    fontWeight: index < 5 ? '700' : '500'
  }
}

// 格式化时间戳
const formatTimestamp = (seconds: number): string => {
  const m = Math.floor(seconds / 60)
  const s = Math.floor(seconds % 60)
  return `${m}:${s.toString().padStart(2, '0')}`
}

// 获取词云数据（处理JSON字符串）
const getWordCloudData = (): Array<{name: string, value: number}> => {
  if (!analysisData.value) return []
  
  try {
    // textFeatures可能是JSON字符串，需要解析
    const textFeatures = analysisData.value.textFeatures
    if (typeof textFeatures === 'string') {
      const parsed = JSON.parse(textFeatures)
      return parsed.wordCloud || []
    } else if (textFeatures && typeof textFeatures === 'object') {
      return (textFeatures as any).wordCloud || []
    }
    return []
  } catch {
    return []
  }
}

// 获取敏感词列表（处理JSON字符串）
const getSensitiveWords = (): Array<{word: string, category: string}> => {
  if (!analysisData.value) return []
  
  try {
    const textFeatures = analysisData.value.textFeatures
    if (typeof textFeatures === 'string') {
      const parsed = JSON.parse(textFeatures)
      return parsed.sensitiveWords || []
    } else if (textFeatures && typeof textFeatures === 'object') {
      return (textFeatures as any).sensitiveWords || []
    }
    return []
  } catch {
    return []
  }
}

// 获取风险时间轴数据（处理JSON字符串）
const getRiskTimelineData = (): any => {
  if (!analysisData.value) return null
  
  try {
    const videoFeatures = analysisData.value.videoFeatures
    
    console.log('videoFeatures类型:', typeof videoFeatures)
    console.log('videoFeatures数据:', videoFeatures)
    
    let riskTimeline = null
    
    if (typeof videoFeatures === 'string') {
      const parsed = JSON.parse(videoFeatures)
      console.log('解析后的videoFeatures:', parsed)
      riskTimeline = parsed.riskTimeline
    } else if (videoFeatures && typeof videoFeatures === 'object') {
      riskTimeline = (videoFeatures as any).riskTimeline
    }
    
    console.log('riskTimeline数据:', riskTimeline)
    
    // 如果没有数据，生成示例数据用于测试
    if (!riskTimeline || !riskTimeline.timeSeriesData || riskTimeline.timeSeriesData.length === 0) {
      console.warn('风险时间轴数据为空，生成示例数据')
      const duration = (videoFeatures as any)?.duration || 300
      return generateMockRiskTimeline(duration)
    }
    
    return riskTimeline
  } catch (e) {
    console.error('解析风险时间轴数据失败:', e)
    return null
  }
}

// 生成模拟风险时间轴（临时测试用）
const generateMockRiskTimeline = (duration: number) => {
  const timeSeriesData = []
  const riskPoints = []
  
  for (let t = 0; t <= duration; t += 30) {
    const risk = 0.15 + Math.random() * 0.25
    timeSeriesData.push({ time: t, risk: risk })
    
    if (Math.random() > 0.7 && risk > 0.3) {
      riskPoints.push({
        time: t,
        type: "内容特征",
        level: "medium",
        description: "检测到内容特征波动",
        riskScore: risk
      })
    }
  }
  
  return { timeSeriesData, riskPoints, duration }
}

// 时间轴点击事件 - 跳转播放
const onTimelineClick = (params: any) => {
  if (!params || !params.data) return
  
  // 交互视图：直接在主播放器跳转
  if (viewMode.value === 'interactive') {
    const clickedTime = params.data[0] || params.value?.[0]
    if (clickedTime !== undefined && mainVideoPlayerRef.value) {
      jumpToTime(clickedTime)
    }
    return
  }
  
  // 报告视图：原有逻辑
  const timelineData = getRiskTimelineData()
  if (!timelineData || !timelineData.timeSeriesData) return
  
  const clickedTime = params.data[0]
  console.log('点击时间轴:', clickedTime, '秒')
  playVideo(clickedTime)
  ElMessage.success(`正在跳转到 ${formatTimestamp(clickedTime)} 播放`)
}

// 视频时间更新事件
const onVideoTimeUpdate = () => {
  if (!mainVideoPlayerRef.value) return
  
  currentPlayTime.value = mainVideoPlayerRef.value.currentTime
  
  // 更新当前台词段落高亮
  const index = mockTranscriptSegments.value.findIndex(
    seg => currentPlayTime.value >= seg.start && currentPlayTime.value < seg.end
  )
  currentSegmentIndex.value = index
  
  // 更新当前检测框
  const detection = mockVideoRisks.value.find(
    risk => Math.abs(currentPlayTime.value - risk.time) < 3
  )
  currentDetection.value = detection || null
}

// 视频加载完成
const onVideoLoaded = () => {
  console.log('视频加载完成')
}

// 跳转到指定时间
const jumpToTime = (time: number) => {
  if (mainVideoPlayerRef.value) {
    mainVideoPlayerRef.value.currentTime = time
    mainVideoPlayerRef.value.play().catch(e => console.log('播放失败:', e))
    ElMessage.success(`跳转到 ${formatTimestamp(time)}`)
  }
}

// 获取检测框样式
const getDetectionBoxStyle = (detection: any) => {
  const box = detection.boundingBox
  return {
    left: `${box.x}%`,
    top: `${box.y}%`,
    width: `${box.width}%`,
    height: `${box.height}%`
  }
}

// 高亮关键词
const highlightKeywords = (text: string, keywords: string[]) => {
  if (!keywords || keywords.length === 0) return text
  
  let result = text
  keywords.forEach(keyword => {
    const regex = new RegExp(keyword, 'g')
    result = result.replace(regex, `<span class="risk-keyword">${keyword}</span>`)
  })
  return result
}

// 获取情绪类别样式
const getEmotionClass = (emotion: string) => {
  const classMap: Record<string, string> = {
    'angry': 'emotion-angry',
    'calm': 'emotion-calm',
    'tense': 'emotion-tense',
    'serious': 'emotion-serious'
  }
  return classMap[emotion] || 'emotion-neutral'
}

// PDF导出状态
const exportingPdf = ref(false)

// 报告内容区域引用
const reportContentRef = ref<HTMLElement | null>(null)
// 操作按钮区域引用（导出时需要隐藏）
const actionButtonsRef = ref<HTMLElement | null>(null)
// 播放视频按钮引用（导出时需要隐藏）
const playVideoBtnRef = ref<HTMLElement | null>(null)
// 视频播放器引用
const videoPlayerRef = ref<HTMLVideoElement | null>(null)

/**
 * 导出PDF报告
 * 使用 html2canvas 将页面内容转换为图片，然后使用 jsPDF 生成PDF
 * 支持多页PDF和中文显示
 */
const exportReport = async () => {
  // 数据验证
  if (!analysisData.value) {
    ElMessage.warning('没有可导出的分析数据')
    return
  }
  
  if (!reportContentRef.value) {
    ElMessage.error('无法获取报告内容')
    return
  }
  
  // 防止重复导出
  if (exportingPdf.value) {
    return
  }
  
  exportingPdf.value = true
  ElMessage.info('正在生成PDF报告，请稍候...')
  
  // 隐藏操作按钮区域和播放视频按钮，确保PDF中不包含这些元素
  const actionButtons = actionButtonsRef.value
  const playVideoBtn = playVideoBtnRef.value
  const originalActionDisplay = actionButtons?.style.display
  const originalPlayBtnDisplay = playVideoBtn?.style.display
  
  if (actionButtons) {
    actionButtons.style.display = 'none'
  }
  if (playVideoBtn) {
    playVideoBtn.style.display = 'none'
  }
  
  try {
    // 动态导入依赖，减少初始包大小
    const html2canvasModule = await import('html2canvas')
    const html2canvas = html2canvasModule.default
    const jsPDFModule = await import('jspdf')
    const jsPDF = jsPDFModule.default || jsPDFModule.jsPDF
    
    if (!html2canvas || !jsPDF) {
      throw new Error('PDF导出依赖加载失败')
    }
    
    const element = reportContentRef.value
    
    // 使用 html2canvas 将内容渲染为图片
    // scale: 2 提高清晰度，适合打印
    const canvas = await html2canvas(element, {
      scale: 2, // 提高清晰度
      useCORS: true, // 允许跨域图片
      allowTaint: true, // 允许跨域图片污染画布
      backgroundColor: '#ecf0f3', // 背景色与新拟态风格一致
      logging: false, // 关闭调试日志
      width: element.scrollWidth,
      height: element.scrollHeight
    })
    
    // 验证canvas生成成功
    if (!canvas || canvas.width === 0 || canvas.height === 0) {
      throw new Error('无法生成报告图片')
    }
    
    const imgWidth = canvas.width
    const imgHeight = canvas.height
    
    // 创建 PDF (纵向, 毫米单位, A4纸张)
    const pdf = new jsPDF('p', 'mm', 'a4')
    const pageWidth = pdf.internal.pageSize.getWidth()
    const pageHeight = pdf.internal.pageSize.getHeight()
    const margin = 10 // 页边距 10mm
    const contentWidth = pageWidth - margin * 2
    const availableHeight = pageHeight - margin * 2
    
    // 计算图片在PDF中的缩放比例和尺寸
    const ratio = contentWidth / imgWidth
    const scaledHeight = imgHeight * ratio
    
    // 如果内容超过一页，需要分页处理
    let yPos = margin
    let remainingHeight = scaledHeight
    let sourceY = 0
    
    while (remainingHeight > 0) {
      const heightToDraw = Math.min(remainingHeight, availableHeight)
      
      // 计算源图片中对应的区域高度
      const sourceHeight = heightToDraw / ratio
      
      // 创建临时画布来裁剪当前页的内容
      const tempCanvas = document.createElement('canvas')
      tempCanvas.width = imgWidth
      tempCanvas.height = sourceHeight
      const ctx = tempCanvas.getContext('2d')
      
      if (!ctx) {
        throw new Error('无法创建画布上下文')
      }
      
      // 从原canvas中裁剪当前页的内容
      ctx.drawImage(
        canvas,
        0, sourceY, imgWidth, sourceHeight, // 源区域
        0, 0, imgWidth, sourceHeight // 目标区域
      )
      
      // 将裁剪后的内容添加到PDF
      const tempImgData = tempCanvas.toDataURL('image/png', 0.95)
      pdf.addImage(tempImgData, 'PNG', margin, yPos, contentWidth, heightToDraw)
      
      // 更新剩余高度和源图片位置
      remainingHeight -= heightToDraw
      sourceY += sourceHeight
      
      // 如果还有剩余内容，添加新页
      if (remainingHeight > 0) {
        pdf.addPage()
        yPos = margin
      }
    }
    
    // 生成文件名：分析报告_视频标题_日期.pdf
    const data = analysisData.value
    const dateStr = new Date().toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    }).replace(/\//g, '-')
    
    // 清理文件名中的非法字符
    const safeTitle = (data.videoTitle || '视频')
      .replace(/[<>:"/\\|?*]/g, '_')
      .substring(0, 50) // 限制长度
    
    const fileName = `分析报告_${safeTitle}_${dateStr}.pdf`
    
    // 保存PDF文件
    pdf.save(fileName)
    
    ElMessage.success('PDF报告导出成功！')
  } catch (error: any) {
    console.error('PDF导出失败:', error)
    const errorMessage = error?.message || 'PDF导出失败，请稍后重试'
    ElMessage.error(errorMessage)
  } finally {
    // 恢复按钮显示
    if (actionButtons) {
      actionButtons.style.display = originalActionDisplay || ''
    }
    if (playVideoBtn) {
      playVideoBtn.style.display = originalPlayBtnDisplay || ''
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
      border-radius: 12px;
      box-shadow: inset 2px 2px 4px $neu-2, inset -2px -2px 4px $white;
      
      .neu-btn {
        padding: 8px 16px;
        box-shadow: none;
        transition: all 0.3s;
        
        &:hover {
          color: $purple;
        }
        
        &.active {
          background: linear-gradient(135deg, $purple 0%, #7c9df7 100%);
          color: white;
          box-shadow: 2px 2px 6px $neu-2;
        }
      }
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

// 详情网格 - 三模态平级展示
.details-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 24px;
  margin-bottom: 24px;
  
  @media (max-width: 1200px) {
    grid-template-columns: repeat(2, 1fr);
  }
  
  @media (max-width: 768px) {
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
        
        &.keywords-inline {
          display: flex;
          flex-wrap: wrap;
          gap: 6px;
          text-align: left;
          
          .keyword-tag-small {
            padding: 4px 10px;
            border-radius: 12px;
            font-size: 11px;
            font-weight: 500;
            background: $neu-1;
            color: $gray;
            box-shadow: 2px 2px 4px $neu-2, -2px -2px 4px $white;
            
            &.primary {
              background: linear-gradient(135deg, $purple 0%, #7c9df7 100%);
              color: #fff;
              box-shadow: 2px 2px 6px $neu-2, -1px -1px 4px $white;
            }
          }
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
  
  .card-subtitle {
    font-size: 11px;
    color: $gray;
    font-weight: 400;
  }
  
  .audience-content {
    padding: 24px;
    
    .audience-stats {
      display: flex;
      gap: 24px;
      margin-bottom: 24px;
      
      @media (max-width: 768px) {
        flex-direction: column;
      }
      
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
          color: $black;
          margin-top: 6px;
          font-weight: 600;
        }
        
        .stat-hint {
          font-size: 11px;
          color: $gray;
          margin-top: 4px;
          line-height: 1.4;
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

// 文本颜色类
.text-success {
  color: #52c41a;
  font-weight: 600;
}

.text-danger {
  color: #f56c6c;
  font-weight: 600;
}

.text-warning {
  color: #faad14;
  font-weight: 600;
}

.text-primary {
  color: $purple;
  font-weight: 600;
}

.text-muted {
  color: $gray;
}

// 风险时间轴卡片
.timeline-card {
  margin-bottom: 24px;
  
  .risk-timeline-chart {
    height: 300px;
    width: 100%;
    padding: 20px;
  }
}

// 词云卡片
.wordcloud-card {
  margin-bottom: 24px;
  
  .card-subtitle {
    font-size: 11px;
    color: $gray;
    font-weight: 400;
  }
  
  .wordcloud-content {
    padding: 32px 24px;
    
    .wordcloud-visual {
      display: flex;
      flex-wrap: wrap;
      justify-content: center;
      align-items: center;
      min-height: 200px;
      gap: 4px;
      
      .word-item {
        display: inline-block;
        padding: 4px 8px;
        cursor: default;
        transition: all 0.3s ease;
        
        &:hover {
          transform: scale(1.1);
          opacity: 1 !important;
        }
      }
    }
  }
}

// 敏感内容检测卡片
.sensitive-card {
  margin-bottom: 24px;
  
  .sensitive-content {
    padding: 24px;
    
    .no-sensitive {
      text-align: center;
      padding: 32px 20px;
      
      .el-icon {
        margin-bottom: 16px;
      }
      
      p {
        margin: 8px 0;
        color: $black;
        font-weight: 600;
        
        &.hint {
          color: $gray;
          font-size: 13px;
          font-weight: 400;
        }
      }
    }
    
    .sensitive-list {
      .sensitive-warning {
        display: flex;
        align-items: center;
        gap: 10px;
        padding: 12px 16px;
        background: rgba(245, 108, 108, 0.1);
        border-radius: 12px;
        margin-bottom: 16px;
        color: #f56c6c;
        font-weight: 600;
      }
      
      .sensitive-item {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 12px 16px;
        background: $neu-1;
        border-radius: 12px;
        margin-bottom: 8px;
        box-shadow: inset 2px 2px 4px $neu-2, inset -2px -2px 4px $white;
        
        .sensitive-word {
          color: #f56c6c;
          font-weight: 700;
          font-size: 15px;
        }
        
        .sensitive-category {
          font-size: 12px;
          color: $gray;
          padding: 4px 12px;
          background: rgba(245, 108, 108, 0.1);
          border-radius: 12px;
        }
      }
    }
  }
}

// 风险时间轴卡片
.timeline-card {
  margin-bottom: 24px;
  
  .risk-timeline-chart {
    height: 300px;
    width: 100%;
    padding: 20px;
  }
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

// ==================== 视图切换过渡动画 ====================
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease, transform 0.3s ease;
}

.fade-enter-from {
  opacity: 0;
  transform: translateY(10px);
}

.fade-leave-to {
  opacity: 0;
  transform: translateY(-10px);
}

// ==================== 交互式分析视图样式 ====================
.interactive-view {
  .multi-modal-container {
    display: grid;
    grid-template-columns: 1.5fr 1fr;
    gap: 20px;
    margin-bottom: 20px;
    
    @media (max-width: 1400px) {
      grid-template-columns: 1.2fr 1fr;
    }
    
    @media (max-width: 1200px) {
      grid-template-columns: 1fr;
    }
  }
  
  // 视频区域
  .video-section {
    display: flex;
    flex-direction: column;
    gap: 16px;
  }
  
  .video-player-wrapper {
    position: relative;
    width: 100%;
    min-height: 400px;
    border-radius: 20px;
    overflow: hidden;
    background: #000;
    box-shadow: 8px 8px 16px $neu-2, -8px -8px 16px $white;
    display: flex;
    align-items: center;
    justify-content: center;
    
    .main-video-player {
      width: 100%;
      height: auto;
      display: block;
      background: #000;
    }
    
    .video-placeholder {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      width: 100%;
      height: 400px;
      color: $gray;
      
      p {
        margin-top: 16px;
        font-size: 14px;
      }
    }
    
    .detection-overlay {
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      pointer-events: none;
      
      .detection-box {
        position: absolute;
        border: 3px solid #f56c6c;
        background: rgba(245, 108, 108, 0.15);
        box-shadow: 0 0 10px rgba(245, 108, 108, 0.8);
        transition: all 0.3s ease;
        
        .detection-label {
          position: absolute;
          top: -28px;
          left: -3px;
          background: #f56c6c;
          color: white;
          padding: 4px 10px;
          font-size: 12px;
          font-weight: 600;
          border-radius: 6px;
          white-space: nowrap;
        }
      }
    }
  }
  
  .video-meta-bar {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 16px 20px;
    background: $neu-1;
    border-radius: 16px;
    box-shadow: 4px 4px 8px $neu-2, -4px -4px 8px $white;
    
    .video-title-info {
      display: flex;
      align-items: center;
      gap: 10px;
      flex: 1;
      
      .title-text {
        font-size: 15px;
        font-weight: 600;
        color: $black;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }
    }
    
    .video-stats {
      display: flex;
      gap: 10px;
      
      .risk-badge {
        padding: 6px 12px;
        border-radius: 12px;
        font-size: 12px;
        font-weight: 600;
        
        &.risk-high {
          background: rgba(245, 108, 108, 0.15);
          color: #f56c6c;
        }
        
        &.risk-medium {
          background: rgba(250, 173, 20, 0.15);
          color: #faad14;
        }
        
        &.risk-low {
          background: rgba(82, 196, 26, 0.15);
          color: #52c41a;
        }
      }
      
      .score-badge {
        padding: 6px 12px;
        border-radius: 12px;
        font-size: 12px;
        font-weight: 600;
        background: rgba(75, 112, 226, 0.15);
        color: $purple;
      }
    }
  }
  
  // 台词面板
  .transcript-panel {
    display: flex;
    flex-direction: column;
    background: $neu-1;
    border-radius: 20px;
    box-shadow: 8px 8px 16px $neu-2, -8px -8px 16px $white;
    overflow: hidden;
    
    .panel-header {
      padding: 18px 20px;
      border-bottom: 1px solid rgba($neu-2, 0.5);
      background: rgba(255, 255, 255, 0.5);
      
      .panel-title {
        font-size: 15px;
        font-weight: 600;
        color: $black;
        display: flex;
        align-items: center;
        gap: 8px;
        margin-bottom: 4px;
      }
      
      .panel-subtitle {
        font-size: 11px;
        color: $gray;
      }
    }
    
    .transcript-list {
      flex: 1;
      overflow-y: auto;
      padding: 16px;
      
      &::-webkit-scrollbar {
        width: 6px;
      }
      
      &::-webkit-scrollbar-thumb {
        background: rgba(160, 165, 168, 0.3);
        border-radius: 3px;
      }
    }
    
    .transcript-segment {
      padding: 12px 14px;
      margin-bottom: 10px;
      background: $bg;
      border-radius: 10px;
      border-left: 4px solid transparent;
      cursor: pointer;
      transition: all 0.25s ease;
      
      &:hover {
        background: #fff;
        transform: translateX(-4px);
        box-shadow: 4px 4px 10px $neu-2;
      }
      
      &.active {
        background: #fff;
        border-left-color: $purple;
        box-shadow: 4px 4px 10px $neu-2;
        transform: scale(1.02);
      }
      
      &.high-risk {
        background: rgba(245, 108, 108, 0.08);
        
        &.active {
          border-left-color: #f56c6c;
        }
      }
      
      &.medium-risk {
        background: rgba(250, 173, 20, 0.08);
        
        &.active {
          border-left-color: #faad14;
        }
      }
      
      .segment-header {
        display: flex;
        align-items: center;
        gap: 8px;
        margin-bottom: 8px;
        flex-wrap: wrap;
        
        .time-range {
          font-size: 11px;
          color: $gray;
          font-family: monospace;
        }
        
        .emotion-badge {
          padding: 3px 8px;
          border-radius: 8px;
          font-size: 10px;
          font-weight: 600;
          
          &.emotion-calm {
            background: rgba(82, 196, 26, 0.15);
            color: #52c41a;
          }
          
          &.emotion-angry {
            background: rgba(245, 108, 108, 0.15);
            color: #f56c6c;
          }
          
          &.emotion-tense {
            background: rgba(250, 173, 20, 0.15);
            color: #faad14;
          }
          
          &.emotion-serious {
            background: rgba(75, 112, 226, 0.15);
            color: $purple;
          }
        }
        
        .risk-tag {
          padding: 3px 8px;
          border-radius: 8px;
          font-size: 10px;
          font-weight: 600;
          
          &.high {
            background: #f56c6c;
            color: white;
          }
          
          &.medium {
            background: #faad14;
            color: white;
          }
        }
      }
      
      .segment-text {
        font-size: 13px;
        color: $black;
        line-height: 1.7;
        word-break: break-word;
        
        :deep(.risk-keyword) {
          color: #f56c6c;
          font-weight: 700;
          background: rgba(245, 108, 108, 0.2);
          padding: 2px 6px;
          border-radius: 4px;
          display: inline-block;
          margin: 0 2px;
        }
      }
    }
    
    .empty-transcript {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 60px 20px;
      color: $gray;
      
      p {
        margin-top: 12px;
        font-size: 13px;
      }
    }
  }
  
  // 多轨道时间轴
  .multi-track-timeline {
    margin-bottom: 24px;
    
    .card-subtitle {
      font-size: 11px;
      color: $gray;
      font-weight: 400;
    }
    
    .timeline-content {
      padding: 16px 20px;
    }
    
    .timeline-chart {
      height: 180px;
      width: 100%;
    }
  }
  
  // 统计摘要网格
  .stats-summary-grid {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 20px;
    
    @media (max-width: 1200px) {
      grid-template-columns: repeat(2, 1fr);
    }
    
    @media (max-width: 600px) {
      grid-template-columns: 1fr;
    }
    
    .stat-summary {
      display: flex;
      align-items: center;
      gap: 14px;
      padding: 18px;
      
      .stat-icon {
        width: 50px;
        height: 50px;
        border-radius: 14px;
        display: flex;
        align-items: center;
        justify-content: center;
        
        &.video-icon {
          background: rgba(245, 108, 108, 0.12);
          color: #f56c6c;
        }
        
        &.audio-icon {
          background: rgba(250, 173, 20, 0.12);
          color: #faad14;
        }
        
        &.text-icon {
          background: rgba(75, 112, 226, 0.12);
          color: $purple;
        }
        
        &.university-icon {
          background: rgba(82, 196, 26, 0.12);
          color: #52c41a;
        }
      }
      
      .stat-content {
        flex: 1;
        
        .stat-value {
          font-size: 24px;
          font-weight: 700;
          color: $black;
          line-height: 1;
        }
        
        .stat-label {
          font-size: 12px;
          color: $gray;
          margin-top: 6px;
        }
      }
    }
  }
}
</style>
