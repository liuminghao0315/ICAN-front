<script setup lang="ts" name="AnalysisClean">
import { ref, reactive, computed, onMounted } from 'vue'
import type { AnalysisResultVO } from '@/types'

// Mock 数据（符合 AnalysisResultVO 结构）
const mockData = reactive<Partial<AnalysisResultVO>>({
  id: '1',
  taskId: 'task-001',
  videoId: 'video-001',
  videoTitle: '校园生活日常 Vlog - 图书馆学习打卡',
  videoDescription: '今天在图书馆度过了充实的一天，和大家分享我的学习日常',
  videoUrl: '/sample-video.mp4',
  
  // 风险评估
  riskScore: 0.88,
  riskLevel: 'HIGH',
  riskLevelDesc: '高风险',
  
  // 高校识别
  isUniversityRelated: true,
  universityName: '北京大学',
  universityConfidence: 92.5,
  
  // 主题分析
  topicCategory: '校园生活',
  topicKeywords: ['学习', '图书馆', '日常', '打卡'],
  
  // 情感分析
  sentimentScore: 0.65,
  sentimentLabel: 'POSITIVE',
  sentimentLabelDesc: '正面',
  
  // 多模态特征
  videoFeatures: {
    duration: 180,
    width: 1920,
    height: 1080,
    fps: 30,
    sceneType: '室内',
    sceneConfidence: 0.95,
    faceCount: 1,
    hasPerson: true,
    qualityScore: 0.88,
    brightness: 0.72,
    clarity: 0.85,
    riskTimeline: [
      { timestamp: 12.5, type: 'face', level: 'medium', description: '检测到人脸特写镜头' },
      { timestamp: 45.2, type: 'scene', level: 'low', description: '校园标识物出现' },
      { timestamp: 120.8, type: 'text', level: 'high', description: '敏感词汇出现' }
    ]
  },
  audioFeatures: {
    hasAudio: true,
    audioQuality: 0.85,
    speechRatio: 0.65,
    musicRatio: 0.25,
    noiseLevel: 0.1,
    volumeLevel: 0.7,
    emotionInVoice: '积极愉悦'
  },
  transcription: '大家好，我是小王，今天来到图书馆...',
  textFeatures: {
    titleLength: 18,
    hasDescription: true,
    descriptionLength: 28,
    titleSentiment: 0.6,
    containsKeywords: true,
    languageConfidence: 0.98,
    wordCloud: [
      { name: '学习', value: 85 },
      { name: '图书馆', value: 72 },
      { name: '日常', value: 65 },
      { name: '打卡', value: 58 }
    ],
    sensitiveWords: [
      { word: '校园', category: '高校相关' }
    ]
  },
  audienceAnalysis: {
    ageDistribution: {
      '18-24': 45,
      '25-34': 30,
      '35-44': 15,
      '45+': 10
    },
    predictedInterests: ['教育', '生活方式', '学习方法'],
    predictedViews: 15000,
    predictedEngagement: 8.5
  },
  spreadPotential: 0.75,
  gmtCreated: '2024-01-15T10:30:00'
})

// 用于后续 Canvas AI 视觉层的视频事件数据
const videoEvents = ref([
  {
    timestamp: 12.5,
    bbox: { x: 0.3, y: 0.2, w: 0.3, h: 0.4 },
    label: '人脸检测',
    emotion: '愤怒',
    confidence: 0.98
  },
  {
    timestamp: 45.2,
    bbox: { x: 0.5, y: 0.5, w: 0.2, h: 0.3 },
    label: '校园标识',
    confidence: 0.85
  }
])

// 响应式变量
const currentRiskScore = computed(() => Math.round(mockData.riskScore! * 100))
const universityConfidence = computed(() => mockData.universityConfidence || 0)

// 身份标签
const identityTags = computed(() => {
  const tags = []
  if (mockData.isUniversityRelated) {
    tags.push({
      text: `疑似${mockData.universityName}学生`,
      type: 'danger'
    })
  }
  tags.push({
    text: mockData.topicCategory || '未分类',
    type: 'info'
  })
  return tags
})
</script>

<template>
  <div class="analysis-clean">
    <!-- 顶部核心情报看板 -->
    <div class="header-dashboard glass-card">
      <!-- 左侧：目标对象信息 -->
      <div class="target-info">
        <div class="video-thumbnail">
          <div class="thumbnail-placeholder">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" class="icon-play">
              <path d="M8 5v14l11-7z"/>
            </svg>
          </div>
        </div>
        <div class="target-details">
          <h3 class="video-title">{{ mockData.videoTitle }}</h3>
          <div class="identity-tags">
            <span 
              v-for="(tag, index) in identityTags" 
              :key="index"
              class="badge-pill"
              :class="`badge-${tag.type}`"
            >
              {{ tag.text }}
            </span>
          </div>
        </div>
      </div>

      <!-- 右侧：风险指数仪 -->
      <div class="risk-gauge">
        <div class="risk-number-wrapper">
          <span class="risk-number">{{ currentRiskScore }}</span>
          <span class="breathing-dot"></span>
        </div>
        <div class="risk-label">风险评分</div>
        
        <div class="match-section">
          <div class="match-label">
            <span>高校指纹匹配度</span>
            <span class="match-value">{{ universityConfidence }}%</span>
          </div>
          <div class="progress-bar">
            <div class="progress-fill" :style="{ width: `${universityConfidence}%` }"></div>
          </div>
        </div>
      </div>
    </div>

    <!-- Bento Grid 主内容区 -->
    <div class="bento-grid">
      <!-- AI 增强播放区 -->
      <div class="video-player-area glass-card">
        <div class="section-title">AI 增强视频分析</div>
        <div class="video-container">
          <div class="video-placeholder">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" class="icon-video">
              <rect x="2" y="2" width="20" height="20" rx="2.18" stroke-width="2"/>
              <line x1="7" y1="2" x2="7" y2="22" stroke-width="2"/>
              <line x1="17" y1="2" x2="17" y2="22" stroke-width="2"/>
              <line x1="2" y1="12" x2="22" y2="12" stroke-width="2"/>
              <line x1="2" y1="7" x2="7" y2="7" stroke-width="2"/>
              <line x1="2" y1="17" x2="7" y2="17" stroke-width="2"/>
              <line x1="17" y1="7" x2="22" y2="7" stroke-width="2"/>
              <line x1="17" y1="17" x2="22" y2="17" stroke-width="2"/>
            </svg>
            <p>视频播放器区域</p>
            <span class="placeholder-hint">Canvas AI 覆盖层将在此实现</span>
          </div>
        </div>
      </div>

      <!-- 智能脚本与证据链 -->
      <div class="transcript-flow glass-card">
        <div class="section-title">智能脚本流</div>
        <div class="flow-container">
          <div class="flow-placeholder">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" class="icon-flow">
              <line x1="12" y1="5" x2="12" y2="19" stroke-width="2"/>
              <circle cx="12" cy="5" r="2" fill="currentColor"/>
              <circle cx="12" cy="12" r="2" fill="currentColor"/>
              <circle cx="12" cy="19" r="2" fill="currentColor"/>
            </svg>
            <p>时间轴数据流</p>
          </div>
        </div>
      </div>

      <!-- 时序波浪图 -->
      <div class="waveform-area glass-card">
        <div class="section-title">多模态风险时序</div>
        <div class="chart-placeholder">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 80" fill="none" class="wave-icon">
            <path d="M0,40 Q25,20 50,40 T100,40 T150,40 T200,40" stroke="currentColor" stroke-width="2" opacity="0.6"/>
            <path d="M0,45 Q25,30 50,45 T100,45 T150,45 T200,45" stroke="currentColor" stroke-width="2" opacity="0.4"/>
            <path d="M0,50 Q25,35 50,50 T100,50 T150,50 T200,50" stroke="currentColor" stroke-width="2" opacity="0.3"/>
          </svg>
          <p>波浪图区域</p>
        </div>
      </div>

      <!-- 雷达图与处置建议 -->
      <div class="radar-area glass-card">
        <div class="section-title">多维风险画像</div>
        <div class="chart-placeholder">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" fill="none" class="radar-icon">
            <polygon points="50,10 85,35 75,70 25,70 15,35" stroke="currentColor" stroke-width="1.5" opacity="0.4"/>
            <polygon points="50,25 72,40 65,60 35,60 28,40" stroke="currentColor" stroke-width="1.5" opacity="0.6"/>
            <line x1="50" y1="50" x2="50" y2="10" stroke="currentColor" stroke-width="1" opacity="0.3"/>
            <line x1="50" y1="50" x2="85" y2="35" stroke="currentColor" stroke-width="1" opacity="0.3"/>
            <line x1="50" y1="50" x2="75" y2="70" stroke="currentColor" stroke-width="1" opacity="0.3"/>
            <line x1="50" y1="50" x2="25" y2="70" stroke="currentColor" stroke-width="1" opacity="0.3"/>
            <line x1="50" y1="50" x2="15" y2="35" stroke="currentColor" stroke-width="1" opacity="0.3"/>
          </svg>
          <p>雷达图区域</p>
        </div>
      </div>

      <!-- 处置建议卡片 -->
      <div class="action-card glass-card alert-card">
        <div class="alert-icon">⚠️</div>
        <div class="alert-content">
          <div class="alert-title">处置建议</div>
          <div class="alert-text">建议人工复核，关注敏感词汇及校园标识</div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
/* ==================== 色彩系统 ==================== */
:root {
  --bg-base: #f8fafc;
  --glass-white: rgba(255, 255, 255, 0.7);
  --border-glass: rgba(255, 255, 255, 0.3);
  --text-primary: #0f172a;
  --text-secondary: #64748b;
  --accent-tech: #3b82f6;
  --risk-high: #ef4444;
  --risk-medium: #f59e0b;
  --risk-low: #10b981;
  --shadow-soft: rgba(31, 38, 135, 0.15);
}

/* ==================== 根容器 ==================== */
.analysis-clean {
  min-height: 100vh;
  padding: 32px;
  background: 
    /* 流体渐变光晕 */
    radial-gradient(ellipse at 20% 30%, rgba(59, 130, 246, 0.08) 0%, transparent 50%),
    radial-gradient(ellipse at 80% 70%, rgba(139, 92, 246, 0.06) 0%, transparent 50%),
    radial-gradient(ellipse at 50% 50%, rgba(236, 72, 153, 0.04) 0%, transparent 50%),
    /* 极淡网格背景 */
    linear-gradient(var(--border-glass) 1px, transparent 1px),
    linear-gradient(90deg, var(--border-glass) 1px, transparent 1px),
    /* 基础底色 */
    var(--bg-base);
  background-size: 
    100% 100%,
    100% 100%,
    100% 100%,
    40px 40px,
    40px 40px,
    100% 100%;
  background-position: 
    0 0,
    0 0,
    0 0,
    -1px -1px,
    -1px -1px,
    0 0;
}

/* ==================== 磨砂玻璃卡片 ==================== */
.glass-card {
  background: var(--glass-white);
  backdrop-filter: blur(20px) saturate(180%);
  -webkit-backdrop-filter: blur(20px) saturate(180%);
  border: 1px solid var(--border-glass);
  border-radius: 24px;
  box-shadow: 0 8px 32px var(--shadow-soft);
  padding: 24px;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.glass-card:hover {
  box-shadow: 0 12px 48px rgba(31, 38, 135, 0.2);
  transform: translateY(-2px);
}

/* ==================== 顶部情报看板 ==================== */
.header-dashboard {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 32px;
  padding: 32px;
  gap: 48px;
}

/* 左侧：目标信息 */
.target-info {
  display: flex;
  align-items: center;
  gap: 24px;
  flex: 1;
}

.video-thumbnail {
  width: 120px;
  height: 120px;
  border-radius: 16px;
  overflow: hidden;
  flex-shrink: 0;
  background: linear-gradient(135deg, rgba(59, 130, 246, 0.1) 0%, rgba(139, 92, 246, 0.1) 100%);
  border: 2px solid var(--border-glass);
}

.thumbnail-placeholder {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--accent-tech);
}

.icon-play {
  width: 48px;
  height: 48px;
  opacity: 0.6;
}

.target-details {
  flex: 1;
  min-width: 0;
}

.video-title {
  font-size: 20px;
  font-weight: 700;
  color: var(--text-primary);
  margin: 0 0 12px 0;
  line-height: 1.4;
}

.identity-tags {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.badge-pill {
  display: inline-flex;
  align-items: center;
  padding: 6px 16px;
  border-radius: 9999px;
  font-size: 13px;
  font-weight: 600;
  letter-spacing: 0.3px;
  transition: all 0.2s;
}

.badge-danger {
  background: linear-gradient(135deg, #fee2e2 0%, #fecaca 100%);
  color: #dc2626;
  border: 1px solid rgba(239, 68, 68, 0.2);
  box-shadow: 0 0 20px rgba(239, 68, 68, 0.15);
}

.badge-info {
  background: linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%);
  color: #1d4ed8;
  border: 1px solid rgba(59, 130, 246, 0.2);
}

/* 右侧：风险指数仪 */
.risk-gauge {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 16px;
  flex-shrink: 0;
}

.risk-number-wrapper {
  display: flex;
  align-items: center;
  gap: 12px;
}

.risk-number {
  font-size: 72px;
  font-weight: 800;
  line-height: 1;
  background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  letter-spacing: -2px;
}

.breathing-dot {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background: var(--risk-high);
  animation: breathe 2s ease-in-out infinite;
  box-shadow: 0 0 20px rgba(239, 68, 68, 0.6);
  flex-shrink: 0;
}

@keyframes breathe {
  0%, 100% { 
    transform: scale(1); 
    opacity: 1; 
  }
  50% { 
    transform: scale(1.3); 
    opacity: 0.7; 
  }
}

.risk-label {
  font-size: 14px;
  font-weight: 600;
  color: var(--text-secondary);
  text-transform: uppercase;
  letter-spacing: 1px;
}

.match-section {
  width: 280px;
}

.match-label {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
  font-size: 13px;
  color: var(--text-secondary);
}

.match-value {
  font-weight: 700;
  font-size: 15px;
  color: var(--text-primary);
}

.progress-bar {
  width: 100%;
  height: 8px;
  background: rgba(0, 0, 0, 0.05);
  border-radius: 9999px;
  overflow: hidden;
  position: relative;
}

.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #10b981 0%, #f59e0b 50%, #ef4444 100%);
  border-radius: inherit;
  transition: width 0.8s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow: 0 0 12px rgba(239, 68, 68, 0.4);
  position: relative;
}

.progress-fill::after {
  content: '';
  position: absolute;
  top: 0;
  right: 0;
  width: 40px;
  height: 100%;
  background: linear-gradient(90deg, transparent 0%, rgba(255, 255, 255, 0.6) 100%);
  animation: shimmer 2s infinite;
}

@keyframes shimmer {
  0% { transform: translateX(-100%); }
  100% { transform: translateX(100%); }
}

/* ==================== Bento Grid 布局 ==================== */
.bento-grid {
  display: grid;
  grid-template-columns: repeat(12, 1fr);
  gap: 24px;
  grid-auto-rows: minmax(200px, auto);
}

/* 视频播放区 - 占据左侧 8 列 x 2 行 */
.video-player-area {
  grid-column: 1 / 9;
  grid-row: 1 / 3;
}

/* 智能脚本流 - 占据右侧 4 列 x 2 行 */
.transcript-flow {
  grid-column: 9 / 13;
  grid-row: 1 / 3;
}

/* 时序波浪图 - 占据下方 6 列 */
.waveform-area {
  grid-column: 1 / 7;
  grid-row: 3 / 4;
}

/* 雷达图 - 占据下方 4 列 */
.radar-area {
  grid-column: 7 / 11;
  grid-row: 3 / 4;
}

/* 处置建议 - 占据下方 2 列 */
.action-card {
  grid-column: 11 / 13;
  grid-row: 3 / 4;
}

/* ==================== 区块标题 ==================== */
.section-title {
  font-size: 16px;
  font-weight: 700;
  color: var(--text-primary);
  margin-bottom: 20px;
  padding-bottom: 12px;
  border-bottom: 2px solid rgba(59, 130, 246, 0.1);
  display: flex;
  align-items: center;
  gap: 8px;
}

.section-title::before {
  content: '';
  width: 4px;
  height: 18px;
  background: linear-gradient(180deg, var(--accent-tech) 0%, #8b5cf6 100%);
  border-radius: 2px;
}

/* ==================== 占位符样式 ==================== */
.video-container,
.flow-container,
.chart-placeholder {
  width: 100%;
  height: 100%;
  min-height: 300px;
}

.video-placeholder,
.flow-placeholder,
.chart-placeholder {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 16px;
  color: var(--text-secondary);
  background: linear-gradient(135deg, rgba(59, 130, 246, 0.03) 0%, rgba(139, 92, 246, 0.03) 100%);
  border-radius: 16px;
  border: 2px dashed var(--border-glass);
}

.icon-video,
.icon-flow,
.wave-icon,
.radar-icon {
  width: 80px;
  height: 80px;
  opacity: 0.4;
  color: var(--accent-tech);
}

.video-placeholder p,
.flow-placeholder p,
.chart-placeholder p {
  font-size: 15px;
  font-weight: 600;
  margin: 0;
}

.placeholder-hint {
  font-size: 12px;
  color: var(--text-secondary);
  opacity: 0.6;
}

/* ==================== 处置建议卡片 ==================== */
.alert-card {
  display: flex;
  align-items: flex-start;
  gap: 16px;
  background: linear-gradient(135deg, rgba(239, 68, 68, 0.08) 0%, rgba(220, 38, 38, 0.05) 100%);
  border: 1px solid rgba(239, 68, 68, 0.2);
}

.alert-icon {
  font-size: 32px;
  flex-shrink: 0;
  animation: pulse 2s ease-in-out infinite;
}

@keyframes pulse {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.1); }
}

.alert-content {
  flex: 1;
}

.alert-title {
  font-size: 14px;
  font-weight: 700;
  color: var(--risk-high);
  margin-bottom: 8px;
}

.alert-text {
  font-size: 13px;
  color: var(--text-primary);
  line-height: 1.6;
}

/* ==================== 响应式 ==================== */
@media (max-width: 1400px) {
  .bento-grid {
    grid-template-columns: repeat(8, 1fr);
  }
  
  .video-player-area {
    grid-column: 1 / 6;
  }
  
  .transcript-flow {
    grid-column: 6 / 9;
  }
  
  .waveform-area {
    grid-column: 1 / 5;
  }
  
  .radar-area {
    grid-column: 5 / 7;
  }
  
  .action-card {
    grid-column: 7 / 9;
  }
}

@media (max-width: 1024px) {
  .header-dashboard {
    flex-direction: column;
    align-items: flex-start;
    gap: 24px;
  }
  
  .risk-gauge {
    align-items: flex-start;
    width: 100%;
  }
  
  .match-section {
    width: 100%;
  }
  
  .bento-grid {
    grid-template-columns: repeat(4, 1fr);
  }
  
  .video-player-area,
  .transcript-flow,
  .waveform-area,
  .radar-area,
  .action-card {
    grid-column: 1 / 5;
    grid-row: auto;
  }
}

@media (max-width: 768px) {
  .analysis-clean {
    padding: 16px;
  }
  
  .header-dashboard {
    padding: 20px;
  }
  
  .target-info {
    flex-direction: column;
    align-items: flex-start;
  }
  
  .risk-number {
    font-size: 56px;
  }
}
</style>
