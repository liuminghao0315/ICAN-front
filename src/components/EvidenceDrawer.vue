<template>
  <div>
    <!-- 遮罩层 -->
    <transition name="fade">
      <div 
        v-if="visible" 
        class="drawer-overlay" 
        @click="handleClose"
      ></div>
    </transition>

    <!-- 侧边抽屉 -->
    <transition name="slide">
      <div v-if="visible" class="evidence-drawer">
        <!-- 抽屉头部 -->
        <div class="drawer-header">
          <div class="header-left">
            <div class="card-icon" :class="cardData.iconClass">
              <component :is="cardData.icon" />
            </div>
            <div class="header-info">
              <h3 class="drawer-title">{{ cardData.label }}</h3>
              <p class="drawer-subtitle">{{ cardData.value }}</p>
            </div>
          </div>
          <button class="close-btn" @click="handleClose">
            <el-icon><Close /></el-icon>
          </button>
        </div>

        <!-- 抽屉内容 -->
        <div class="drawer-body">
          <!-- 综合指标（根据卡片类型显示不同名称） -->
          <div class="confidence-section">
            <div class="confidence-label">{{ cardData.confidenceLabel || '综合置信度' }}</div>
            <div class="confidence-value">{{ cardData.confidence }}%</div>
            <div class="confidence-bar">
              <div 
                class="confidence-fill" 
                :style="{ width: cardData.confidence + '%' }"
              ></div>
            </div>
          </div>

          <!-- 证据时间线 -->
          <div class="timeline-section">
            <div class="section-title">
              <el-icon><Clock /></el-icon>
              <span>证据时间线</span>
              <span class="evidence-count">({{ evidences.length }}处证据)</span>
            </div>
            
            <div class="timeline-marks">
              <div class="timeline-bar">
                <div 
                  v-for="(evidence, index) in evidences" 
                  :key="index"
                  class="timeline-mark"
                  :style="{ left: (evidence.timestamp / videoDuration * 100) + '%' }"
                  :class="getEvidenceTypeClass(evidence.type)"
                >
                  <div class="mark-dot"></div>
                  <div class="mark-time">{{ formatTime(evidence.timestamp) }}</div>
                </div>
              </div>
            </div>
          </div>

          <!-- 证据列表 -->
          <div class="evidences-section">
            <div class="section-title">
              <el-icon><Document /></el-icon>
              <span>详细证据</span>
            </div>

            <div class="evidences-list">
              <!-- 视频证据 -->
              <div v-if="videoEvidences.length > 0" class="evidence-group">
                <div class="group-title">
                  <el-icon><VideoCamera /></el-icon>
                  <span>视频证据 ({{ videoEvidences.length }})</span>
                </div>
                <div 
                  v-for="(evidence, index) in videoEvidences" 
                  :key="'video-' + index"
                  class="evidence-item"
                  @click="handleJumpToTime(evidence.timestamp)"
                >
                  <div class="evidence-thumbnail">
                    <img 
                      v-if="evidence.thumbnail" 
                      :src="evidence.thumbnail" 
                      :alt="`${formatTime(evidence.timestamp)} 截图`"
                    />
                    <div v-else class="thumbnail-placeholder">
                      <el-icon><Picture /></el-icon>
                    </div>
                    <div class="thumbnail-time">{{ formatTime(evidence.timestamp) }}</div>
                  </div>
                  <div class="evidence-content">
                    <div class="evidence-desc">{{ evidence.description }}</div>
                    <div class="evidence-meta">
                      <span class="confidence-tag">置信度: {{ evidence.confidence }}%</span>
                      <span class="jump-hint">
                        <el-icon><VideoPlay /></el-icon>
                        点击跳转
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <!-- 音频证据 -->
              <div v-if="audioEvidences.length > 0" class="evidence-group">
                <div class="group-title">
                  <el-icon><Microphone /></el-icon>
                  <span>音频证据 ({{ audioEvidences.length }})</span>
                </div>
                <div 
                  v-for="(evidence, index) in audioEvidences" 
                  :key="'audio-' + index"
                  class="evidence-item evidence-item-audio"
                  @click="handleJumpToTime(evidence.timestamp)"
                >
                  <div class="evidence-icon">
                    <el-icon :size="24"><Microphone /></el-icon>
                  </div>
                  <div class="evidence-content">
                    <div class="evidence-time">{{ formatTime(evidence.timestamp) }}</div>
                    <div class="evidence-desc">{{ evidence.description }}</div>
                    <div class="evidence-meta">
                      <span class="confidence-tag">置信度: {{ evidence.confidence }}%</span>
                      <span class="jump-hint">
                        <el-icon><VideoPlay /></el-icon>
                        点击跳转
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <!-- 文本证据 -->
              <div v-if="textEvidences.length > 0" class="evidence-group">
                <div class="group-title">
                  <el-icon><ChatLineRound /></el-icon>
                  <span>文本证据 ({{ textEvidences.length }})</span>
                </div>
                <div class="text-evidences-grid">
                  <div 
                    v-for="(evidence, index) in textEvidences" 
                    :key="'text-' + index"
                    class="text-evidence-item"
                    @click="evidence.timestamp !== undefined && handleJumpToTime(evidence.timestamp)"
                  >
                    <div class="text-keyword">{{ evidence.keyword }}</div>
                    <div 
                      v-if="evidence.timestamp !== undefined" 
                      class="text-time"
                    >
                      {{ formatTime(evidence.timestamp) }}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </transition>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { 
  Close, Clock, Document, VideoCamera, Microphone, 
  ChatLineRound, Picture, VideoPlay 
} from '@element-plus/icons-vue'

// 证据数据类型
export interface Evidence {
  timestamp: number         // 时间点（秒）
  type: 'video' | 'audio' | 'text'  // 证据类型
  description: string      // 描述
  confidence: number       // 置信度 0-100
  thumbnail?: string       // 视频证据的缩略图
  keyword?: string         // 文本证据的关键词
  sentimentScore?: number  // 情感分数 0-100（用于统计类卡片，前端根据区间判断）
}

// 卡片数据类型
export interface CardData {
  id: string
  label: string            // 卡片标题
  value: string            // 卡片值
  confidence: number       // 综合置信度/指数/评分
  confidenceLabel?: string // 指标名称（如"置信度"/"风险指数"/"紧急程度"）
  icon: any                // 图标组件
  iconClass: string        // 图标样式类
}

// Props
const props = withDefaults(defineProps<{
  visible: boolean
  cardData: CardData
  evidences: Evidence[]
  videoDuration: number    // 视频总时长（秒）
}>(), {
  visible: false,
  videoDuration: 180
})

// Emits
const emit = defineEmits<{
  (e: 'update:visible', value: boolean): void
  (e: 'jump-to-time', timestamp: number): void
}>()

// 分类证据
const videoEvidences = computed(() => 
  props.evidences.filter(e => e.type === 'video')
)

const audioEvidences = computed(() => 
  props.evidences.filter(e => e.type === 'audio')
)

const textEvidences = computed(() => 
  props.evidences.filter(e => e.type === 'text')
)

// 格式化时间
const formatTime = (seconds: number): string => {
  const mins = Math.floor(seconds / 60)
  const secs = Math.floor(seconds % 60)
  return `${mins}:${secs.toString().padStart(2, '0')}`
}

// 获取证据类型样式
const getEvidenceTypeClass = (type: string): string => {
  const classMap: Record<string, string> = {
    video: 'mark-video',
    audio: 'mark-audio',
    text: 'mark-text'
  }
  return classMap[type] || ''
}

// 关闭抽屉
const handleClose = () => {
  emit('update:visible', false)
}

// 跳转到指定时间
const handleJumpToTime = (timestamp: number) => {
  emit('jump-to-time', timestamp)
}
</script>

<style scoped lang="scss">
// 遮罩层
.drawer-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  backdrop-filter: blur(4px);
  z-index: 1000;
}

// 抽屉容器
.evidence-drawer {
  position: fixed;
  top: 0;
  right: 0;
  bottom: 0;
  width: 480px;
  background: linear-gradient(135deg, #f0f2f5 0%, #f5f7fa 100%);
  box-shadow: -4px 0 24px rgba(0, 0, 0, 0.15);
  z-index: 1001;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

// 抽屉头部
.drawer-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 24px;
  border-bottom: 1px solid #e8ecef;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  flex-shrink: 0;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 16px;
  flex: 1;
  min-width: 0;
}

.card-icon {
  width: 48px;
  height: 48px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
  background: rgba(255, 255, 255, 0.2);
  backdrop-filter: blur(10px);
  flex-shrink: 0;
}

.header-info {
  flex: 1;
  min-width: 0;
}

.drawer-title {
  font-size: 18px;
  font-weight: 600;
  margin: 0 0 4px 0;
  color: white;
}

.drawer-subtitle {
  font-size: 14px;
  margin: 0;
  color: rgba(255, 255, 255, 0.9);
  font-weight: 500;
}

.close-btn {
  width: 36px;
  height: 36px;
  border-radius: 8px;
  border: none;
  background: rgba(255, 255, 255, 0.2);
  color: white;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
  flex-shrink: 0;

  &:hover {
    background: rgba(255, 255, 255, 0.3);
    transform: scale(1.05);
  }
}

// 抽屉内容
.drawer-body {
  flex: 1;
  overflow-y: auto;
  padding: 24px;
}

// 置信度区域
.confidence-section {
  padding: 20px;
  background: white;
  border-radius: 12px;
  margin-bottom: 24px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
}

.confidence-label {
  font-size: 13px;
  color: #666;
  margin-bottom: 8px;
}

.confidence-value {
  font-size: 32px;
  font-weight: 700;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  margin-bottom: 12px;
}

.confidence-bar {
  height: 8px;
  background: #e8ecef;
  border-radius: 4px;
  overflow: hidden;
}

.confidence-fill {
  height: 100%;
  background: linear-gradient(90deg, #667eea 0%, #764ba2 100%);
  border-radius: 4px;
  transition: width 0.6s ease;
}

// 区块标题
.section-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 15px;
  font-weight: 600;
  color: #333;
  margin-bottom: 16px;

  .el-icon {
    color: #667eea;
  }
}

.evidence-count {
  font-size: 13px;
  color: #999;
  font-weight: 400;
}

// 时间线区域
.timeline-section {
  margin-bottom: 24px;
}

.timeline-marks {
  padding: 20px;
  background: white;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
}

.timeline-bar {
  position: relative;
  height: 40px;
  background: #d1d9e6;
  border-radius: 20px;
  margin: 20px 0;
}

.timeline-mark {
  position: absolute;
  top: 50%;
  transform: translateX(-50%) translateY(-50%);
  cursor: pointer;
  
  &:hover {
    .mark-dot {
      transform: scale(1.3);
    }
    .mark-time {
      opacity: 1;
      transform: translateY(-30px);
    }
  }
}

.mark-dot {
  width: 16px;
  height: 16px;
  border-radius: 50%;
  border: 3px solid white;
  transition: all 0.2s;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
}

.mark-video .mark-dot {
  background: #667eea;
}

.mark-audio .mark-dot {
  background: #f093fb;
}

.mark-text .mark-dot {
  background: #4facfe;
}

.mark-time {
  position: absolute;
  top: -35px;
  left: 50%;
  transform: translateX(-50%) translateY(-20px);
  font-size: 11px;
  color: #666;
  background: white;
  padding: 4px 8px;
  border-radius: 4px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  white-space: nowrap;
  opacity: 0;
  transition: all 0.2s;
  pointer-events: none;
}

// 证据列表区域
.evidences-section {
  .section-title {
    margin-bottom: 16px;
  }
}

.evidences-list {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.evidence-group {
  background: white;
  border-radius: 12px;
  padding: 16px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
}

.group-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  font-weight: 600;
  color: #555;
  margin-bottom: 12px;
  padding-bottom: 12px;
  border-bottom: 1px solid #e8ecef;

  .el-icon {
    color: #667eea;
  }
}

// 视频/音频证据项
.evidence-item {
  display: flex;
  gap: 12px;
  padding: 12px;
  border-radius: 8px;
  background: #f8f9fa;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    background: #f0f2f5;
    transform: translateX(4px);
  }

  &:not(:last-child) {
    margin-bottom: 12px;
  }
}

.evidence-item-audio {
  .evidence-icon {
    width: 80px;
    height: 60px;
    border-radius: 8px;
    background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
    display: flex;
    align-items: center;
    justify-content: center;
    color: white;
    flex-shrink: 0;
  }
}

.evidence-thumbnail {
  width: 120px;
  height: 68px;
  border-radius: 8px;
  overflow: hidden;
  position: relative;
  flex-shrink: 0;
  background: #d1d9e6;

  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
}

.thumbnail-placeholder {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #999;
  font-size: 32px;
}

.thumbnail-time {
  position: absolute;
  bottom: 4px;
  right: 4px;
  background: rgba(0, 0, 0, 0.7);
  color: white;
  padding: 2px 6px;
  border-radius: 4px;
  font-size: 11px;
  font-weight: 500;
}

.evidence-content {
  flex: 1;
  min-width: 0;
}

.evidence-time {
  font-size: 13px;
  font-weight: 600;
  color: #667eea;
  margin-bottom: 4px;
}

.evidence-desc {
  font-size: 13px;
  color: #333;
  line-height: 1.5;
  margin-bottom: 8px;
}

.evidence-meta {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 8px;
}

.confidence-tag {
  font-size: 11px;
  color: #666;
  background: #e8ecef;
  padding: 2px 8px;
  border-radius: 4px;
}

.jump-hint {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 11px;
  color: #667eea;
  font-weight: 500;

  .el-icon {
    font-size: 14px;
  }
}

// 文本证据网格
.text-evidences-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 8px;
}

.text-evidence-item {
  padding: 12px;
  background: #f8f9fa;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    background: #f0f2f5;
    transform: translateY(-2px);
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
  }
}

.text-keyword {
  font-size: 13px;
  font-weight: 500;
  color: #333;
  margin-bottom: 4px;
}

.text-time {
  font-size: 11px;
  color: #667eea;
}

// 过渡动画
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

.slide-enter-active,
.slide-leave-active {
  transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.slide-enter-from,
.slide-leave-to {
  transform: translateX(100%);
}
</style>
