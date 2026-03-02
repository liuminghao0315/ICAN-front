<template>
  <Teleport to="body">
    <Transition name="preview-fade">
      <div
        v-if="visible"
        class="preview-overlay"
        @mousedown.self="onOverlayMouseDown"
        @mouseup.self="onOverlayMouseUp"
      >
        <div
          class="preview-card"
          @mousemove="onMouseMove"
          @mouseleave="onMouseLeave"
        >
          <!-- ── 顶部浮层：标题 + 关闭 ── -->
          <div class="preview-topbar" :class="{ hidden: controlsHidden && isPlaying }">
            <span class="preview-title" v-if="title">{{ title }}</span>
            <button class="close-btn" @click="close" title="关闭预览">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round">
                <line x1="18" y1="6" x2="6" y2="18"/>
                <line x1="6" y1="6" x2="18" y2="18"/>
              </svg>
            </button>
          </div>

          <!-- ── 视频主体 ── -->
          <div class="video-stage">
            <!-- Loading -->
            <Transition name="fade">
              <div class="stage-loader" v-if="loading && !error">
                <div class="loader-ring"></div>
                <span>加载中...</span>
              </div>
            </Transition>

            <!-- 错误 -->
            <Transition name="fade">
              <div class="stage-error" v-if="error">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                  <circle cx="12" cy="12" r="10"/>
                  <line x1="12" y1="8" x2="12" y2="12"/>
                  <line x1="12" y1="16" x2="12.01" y2="16"/>
                </svg>
                <span>视频加载失败</span>
                <button class="retry-btn" @click="retryLoad">重试</button>
              </div>
            </Transition>

            <!-- 视频 -->
            <video
              v-if="videoSrc && !error"
              ref="videoRef"
              class="preview-video"
              :src="videoSrc"
              preload="auto"
              playsinline
              @loadedmetadata="onMetadata"
              @loadeddata="onLoaded"
              @waiting="loading = true"
              @playing="loading = false"
              @canplay="loading = false"
              @timeupdate="onTimeUpdate"
              @ended="isPlaying = false"
              @error="onError"
              @click="togglePlay"
            ></video>

            <!-- 专用截帧视频（隐藏，不影响主播放器） -->
            <video
              v-if="videoSrc"
              ref="thumbVideoRef"
              :src="videoSrc"
              preload="metadata"
              muted
              playsinline
              style="display:none"
              @seeked="onThumbSeeked"
            ></video>
            <!-- 截帧用 canvas（隐藏） -->
            <canvas ref="captureCanvasRef" style="display:none" width="160" height="90"></canvas>

            <!-- 大播放按钮（暂停时居中显示） -->
            <Transition name="fade">
              <div class="center-play" v-if="!isPlaying && !loading && !error && videoSrc" @click="togglePlay">
                <svg viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>
              </div>
            </Transition>
          </div>

          <!-- ── 自定义控制条 ── -->
          <div class="controls-bar" :class="{ hidden: controlsHidden && isPlaying }">
            <!-- 进度条 -->
            <div
              class="progress-track"
              ref="progressRef"
              @click="seekTo"
              @mousemove="onProgressHover"
              @mouseleave="onProgressLeave"
            >
              <div class="progress-fill" :style="{ width: progressPct + '%' }"></div>
              <div class="progress-thumb" :style="{ left: progressPct + '%' }"></div>

              <!-- 帧预览气泡 -->
              <Transition name="thumb-preview">
                <div
                  class="frame-preview"
                  v-if="framePreview.visible"
                  :style="{ left: framePreview.x + 'px' }"
                >
                  <canvas ref="thumbCanvasRef" class="frame-canvas" width="160" height="90"></canvas>
                  <span class="frame-time">{{ formatTime(framePreview.time) }}</span>
                </div>
              </Transition>
            </div>

            <div class="controls-row">
              <!-- 播放/暂停 -->
              <button class="ctrl-icon-btn" @click="togglePlay" :title="isPlaying ? '暂停' : '播放'">
                <svg v-if="isPlaying" viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></svg>
                <svg v-else viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>
              </button>

              <!-- 时间 -->
              <span class="time-display">{{ formatTime(currentTime) }} / {{ formatTime(duration) }}</span>

              <div class="controls-spacer"></div>

              <!-- 音量 -->
              <div class="volume-group">
                <button class="ctrl-icon-btn" @click="toggleMute" :title="muted ? '取消静音' : '静音'">
                  <svg v-if="muted || volume === 0" viewBox="0 0 24 24" fill="currentColor"><path d="M16.5 12c0-1.77-1.02-3.29-2.5-4.03v2.21l2.45 2.45c.03-.2.05-.41.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51C20.63 14.91 21 13.5 21 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3L3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06c1.38-.31 2.63-.95 3.69-1.81L19.73 21 21 19.73l-9-9L4.27 3zM12 4L9.91 6.09 12 8.18V4z"/></svg>
                  <svg v-else-if="volume < 0.5" viewBox="0 0 24 24" fill="currentColor"><path d="M18.5 12c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM5 9v6h4l5 5V4L9 9H5z"/></svg>
                  <svg v-else viewBox="0 0 24 24" fill="currentColor"><path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"/></svg>
                </button>
                <input
                  class="volume-slider"
                  type="range" min="0" max="1" step="0.05"
                  :value="muted ? 0 : volume"
                  @input="onVolumeInput"
                />
              </div>

              <!-- 全屏 -->
              <button class="ctrl-icon-btn" @click="toggleFullscreen" title="全屏">
                <svg v-if="!isFullscreen" viewBox="0 0 24 24" fill="currentColor"><path d="M7 14H5v5h5v-2H7v-3zm-2-4h2V7h3V5H5v5zm12 7h-3v2h5v-5h-2v3zM14 5v2h3v3h2V5h-5z"/></svg>
                <svg v-else viewBox="0 0 24 24" fill="currentColor"><path d="M5 16h3v3h2v-5H5v2zm3-8H5v2h5V5H8v3zm6 11h2v-3h3v-2h-5v5zm2-11V5h-2v5h5V8h-3z"/></svg>
              </button>
            </div>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, watch, onUnmounted, reactive } from 'vue'

const props = defineProps<{
  visible: boolean
  videoUrl: string | null | undefined
  title?: string
}>()

const emit = defineEmits<{
  'update:visible': [value: boolean]
}>()

// 模态框关闭逻辑：只有 mousedown 和 mouseup 都在外部才关闭
let mouseDownOnOverlay = false

const onOverlayMouseDown = () => {
  mouseDownOnOverlay = true
}

const onOverlayMouseUp = () => {
  if (mouseDownOnOverlay) {
    close()
  }
  mouseDownOnOverlay = false
}

const videoRef = ref<HTMLVideoElement | null>(null)
const thumbVideoRef = ref<HTMLVideoElement | null>(null)
const progressRef = ref<HTMLDivElement | null>(null)
const captureCanvasRef = ref<HTMLCanvasElement | null>(null)
const thumbCanvasRef = ref<HTMLCanvasElement | null>(null)
const videoSrc = ref<string | null>(null)
const loading = ref(false)
const error = ref(false)

// 播放状态
const isPlaying = ref(false)
const currentTime = ref(0)
const duration = ref(0)
const volume = ref(0.8)
const muted = ref(false)
const isFullscreen = ref(false)
const progressPct = ref(0)

// ── 进度条帧预览 ──────────────────────────────────────
const PREVIEW_W = 160
const PREVIEW_H = 90
const framePreview = reactive({ visible: false, x: 0, time: 0 })

// 节流：避免每次 mousemove 都 seek，间隔 80ms
let seekThrottleTimer: ReturnType<typeof setTimeout> | null = null
let pendingSeekTime: number | null = null
let isSeeking = false

const onProgressHover = (e: MouseEvent) => {
  if (!progressRef.value || !duration.value) return

  const rect = progressRef.value.getBoundingClientRect()
  const pct = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width))
  const hoverTime = pct * duration.value

  // 气泡水平位置：以进度条左边缘为基准，限制不超出两侧
  const rawX = e.clientX - rect.left
  const clampedX = Math.max(PREVIEW_W / 2, Math.min(rect.width - PREVIEW_W / 2, rawX))
  framePreview.x = clampedX - PREVIEW_W / 2
  framePreview.time = hoverTime
  framePreview.visible = true

  // 节流截帧：操作专用 thumbVideoRef，完全不碰主播放器
  pendingSeekTime = hoverTime
  if (!seekThrottleTimer && !isSeeking) {
    seekThrottleTimer = setTimeout(() => {
      seekThrottleTimer = null
      if (pendingSeekTime !== null && thumbVideoRef.value) {
        isSeeking = true
        thumbVideoRef.value.currentTime = pendingSeekTime
        pendingSeekTime = null
      }
    }, 80)
  }
}

// thumbVideo seek 完成后截帧，绘制到气泡 canvas
const onThumbSeeked = () => {
  const thumb = thumbVideoRef.value
  const canvas = captureCanvasRef.value
  const display = thumbCanvasRef.value
  if (!thumb || !canvas || !display) { isSeeking = false; return }

  const ctx = canvas.getContext('2d')
  if (ctx) {
    ctx.drawImage(thumb, 0, 0, PREVIEW_W, PREVIEW_H)
    const dCtx = display.getContext('2d')
    if (dCtx) dCtx.drawImage(canvas, 0, 0)
  }
  isSeeking = false

  // 如果悬浮期间又积累了新的 seek 请求，立即处理
  if (pendingSeekTime !== null && thumb) {
    isSeeking = true
    thumb.currentTime = pendingSeekTime
    pendingSeekTime = null
  }
}

const onProgressLeave = () => {
  framePreview.visible = false
  if (seekThrottleTimer) { clearTimeout(seekThrottleTimer); seekThrottleTimer = null }
  pendingSeekTime = null
  isSeeking = false
}

// captureFrame 已废弃，由 thumbVideoRef + onThumbSeeked 替代

// 控制条自动隐藏
const controlsHidden = ref(false)
let hideTimer: ReturnType<typeof setTimeout> | null = null

const scheduleHide = () => {
  if (hideTimer) clearTimeout(hideTimer)
  controlsHidden.value = false
  hideTimer = setTimeout(() => { controlsHidden.value = true }, 2000)
}

const onMouseMove = () => { scheduleHide() }
const onMouseLeave = () => {
  if (hideTimer) clearTimeout(hideTimer)
  if (isPlaying.value) controlsHidden.value = true
}

// 仅在弹出时加载视频流
watch(() => props.visible, (val) => {
  if (val) {
    error.value = false
    loading.value = true
    isPlaying.value = false
    currentTime.value = 0
    duration.value = 0
    progressPct.value = 0
    videoSrc.value = props.videoUrl || null
    document.addEventListener('keydown', onKeydown)
    document.addEventListener('fullscreenchange', onFullscreenChange)
    scheduleHide()
  } else {
    destroyPlayer()
    document.removeEventListener('keydown', onKeydown)
    document.removeEventListener('fullscreenchange', onFullscreenChange)
    if (hideTimer) clearTimeout(hideTimer)
    controlsHidden.value = false
  }
})

const onMetadata = () => {
  if (videoRef.value) {
    duration.value = videoRef.value.duration || 0
    videoRef.value.volume = volume.value
  }
}

const onLoaded = () => {
  loading.value = false
  videoRef.value?.play().catch(() => {})
}

const onError = () => {
  loading.value = false
  error.value = true
}

const onTimeUpdate = () => {
  if (!videoRef.value) return
  currentTime.value = videoRef.value.currentTime
  isPlaying.value = !videoRef.value.paused
  progressPct.value = duration.value > 0
    ? (videoRef.value.currentTime / duration.value) * 100
    : 0
}

const togglePlay = () => {
  if (!videoRef.value) return
  if (videoRef.value.paused) {
    videoRef.value.play().catch(() => {})
    isPlaying.value = true
  } else {
    videoRef.value.pause()
    isPlaying.value = false
  }
  scheduleHide()
}

const seekTo = (e: MouseEvent) => {
  if (!progressRef.value || !videoRef.value || !duration.value) return
  const rect = progressRef.value.getBoundingClientRect()
  const pct = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width))
  videoRef.value.currentTime = pct * duration.value
  progressPct.value = pct * 100
}

const toggleMute = () => {
  if (!videoRef.value) return
  muted.value = !muted.value
  videoRef.value.muted = muted.value
}

const onVolumeInput = (e: Event) => {
  const val = parseFloat((e.target as HTMLInputElement).value)
  volume.value = val
  muted.value = val === 0
  if (videoRef.value) {
    videoRef.value.volume = val
    videoRef.value.muted = val === 0
  }
}

const toggleFullscreen = async () => {
  const el = videoRef.value?.closest('.preview-card') as HTMLElement | null
  if (!el) return
  if (!document.fullscreenElement) {
    await el.requestFullscreen().catch(() => {})
  } else {
    await document.exitFullscreen().catch(() => {})
  }
}

const onFullscreenChange = () => {
  isFullscreen.value = !!document.fullscreenElement
}

const retryLoad = () => {
  error.value = false
  loading.value = true
  videoRef.value?.load()
}

const destroyPlayer = () => {
  if (videoRef.value) {
    videoRef.value.pause()
    videoRef.value.src = ''
    videoRef.value.load()
  }
  if (thumbVideoRef.value) {
    thumbVideoRef.value.src = ''
    thumbVideoRef.value.load()
  }
  videoSrc.value = null
  loading.value = false
  error.value = false
  isPlaying.value = false
  framePreview.visible = false
  if (seekThrottleTimer) { clearTimeout(seekThrottleTimer); seekThrottleTimer = null }
  pendingSeekTime = null
  isSeeking = false
}

const close = () => {
  emit('update:visible', false)
}

const onKeydown = (e: KeyboardEvent) => {
  if (e.key === 'Escape') close()
  if (e.key === ' ') { e.preventDefault(); togglePlay() }
}

const formatTime = (s: number): string => {
  if (!s || isNaN(s)) return '0:00'
  const m = Math.floor(s / 60)
  const sec = Math.floor(s % 60)
  return `${m}:${sec.toString().padStart(2, '0')}`
}

onUnmounted(() => {
  destroyPlayer()
  document.removeEventListener('keydown', onKeydown)
  document.removeEventListener('fullscreenchange', onFullscreenChange)
  if (hideTimer) clearTimeout(hideTimer)
})
</script>

<style scoped lang="scss">
// ── 设计令牌（与系统保持一致） ──────────────────────
$purple: #409EFF;
$purple-light: #66b1ff;

// ── 遮罩层：玻璃拟态 ────────────────────────────────
.preview-overlay {
  position: fixed;
  inset: 0;
  z-index: 3000;
  // 半透明 + 高斯模糊，隐约透出背景列表
  background: rgba(15, 20, 40, 0.45);
  backdrop-filter: blur(12px) saturate(1.4);
  -webkit-backdrop-filter: blur(12px) saturate(1.4);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 32px 24px;
}

// ── 主卡片：悬浮感 ──────────────────────────────────
.preview-card {
  position: relative;
  width: 100%;
  max-width: 880px;
  border-radius: 20px;
  overflow: hidden;
  // 轻盈的玻璃底色
  background: rgba(18, 22, 38, 0.82);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  // 扩散阴影：悬浮感
  box-shadow:
    0 8px 32px rgba(0, 0, 0, 0.35),
    0 32px 80px rgba(0, 0, 0, 0.25),
    0 0 0 1px rgba(255, 255, 255, 0.06),
    inset 0 1px 0 rgba(255, 255, 255, 0.08);
  display: flex;
  flex-direction: column;
  cursor: default;
}

// ── 顶部浮层 ────────────────────────────────────────
.preview-topbar {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  z-index: 20;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 16px 28px;
  // 渐变遮罩：顶部深，向下透明
  background: linear-gradient(to bottom, rgba(0, 0, 0, 0.55) 0%, transparent 100%);
  transition: opacity 0.3s ease;

  &.hidden { opacity: 0; pointer-events: none; }
}

.preview-title {
  font-size: 13px;
  font-weight: 600;
  color: rgba(255, 255, 255, 0.88);
  text-shadow: 0 1px 6px rgba(0, 0, 0, 0.6);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  flex: 1;
  margin-right: 12px;
}

// ── 关闭按钮（与系统弹窗风格一致） ──────────────────
.close-btn {
  flex-shrink: 0;
  width: 32px;
  height: 32px;
  border: none;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.14);
  backdrop-filter: blur(8px);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  color: rgba(255, 255, 255, 0.85);
  transition: background 0.2s, transform 0.2s;

  svg { width: 14px; height: 14px; }

  &:hover {
    background: rgba(255, 255, 255, 0.26);
    transform: scale(1.1);
  }
}

// ── 视频舞台 ─────────────────────────────────────────
.video-stage {
  position: relative;
  width: 100%;
  aspect-ratio: 16 / 9;
  background: #000;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 20px 20px 0 0;
  overflow: hidden;
}

.preview-video {
  width: 100%;
  height: 100%;
  display: block;
  object-fit: contain;
  cursor: pointer;
}

// ── 大播放按钮 ───────────────────────────────────────
.center-play {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  background: rgba(0, 0, 0, 0.18);

  svg {
    width: 64px;
    height: 64px;
    color: rgba(255, 255, 255, 0.9);
    filter: drop-shadow(0 4px 16px rgba(0, 0, 0, 0.5));
    transition: transform 0.2s;
  }

  &:hover svg { transform: scale(1.1); }
}

// ── Loading ──────────────────────────────────────────
.stage-loader {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 14px;
  background: rgba(0, 0, 0, 0.5);
  z-index: 5;

  span {
    font-size: 13px;
    color: rgba(255, 255, 255, 0.55);
    font-weight: 500;
  }
}

.loader-ring {
  width: 44px;
  height: 44px;
  border-radius: 50%;
  border: 3px solid rgba(255, 255, 255, 0.1);
  border-top-color: $purple-light;
  animation: spin 0.75s linear infinite;
}

@keyframes spin { to { transform: rotate(360deg); } }

// ── 错误状态 ─────────────────────────────────────────
.stage-error {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 12px;
  color: rgba(255, 255, 255, 0.45);
  z-index: 5;

  svg { width: 40px; height: 40px; opacity: 0.5; }
  span { font-size: 14px; font-weight: 500; }
}

.retry-btn {
  padding: 7px 20px;
  border: 1px solid rgba(255, 255, 255, 0.18);
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.08);
  color: rgba(255, 255, 255, 0.65);
  font-size: 13px;
  cursor: pointer;
  transition: background 0.2s, color 0.2s;

  &:hover { background: rgba(255, 255, 255, 0.16); color: #fff; }
}

// ── 自定义控制条 ─────────────────────────────────────
.controls-bar {
  padding: 0 16px 14px;
  background: linear-gradient(to top, rgba(0, 0, 0, 0.65) 0%, transparent 100%);
  // 控制条叠在视频上方（绝对定位到底部）
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  z-index: 20;
  transition: opacity 0.3s ease;

  &.hidden { opacity: 0; pointer-events: none; }
}

// 进度条
.progress-track {
  position: relative;
  height: 4px;
  background: rgba(255, 255, 255, 0.2);
  border-radius: 2px;
  cursor: pointer;
  margin-bottom: 10px;
  transition: height 0.15s;

  // 扩大可交互区域：上下各延伸 10px 的透明 hit area
  &::before {
    content: '';
    position: absolute;
    top: -10px;
    left: 0;
    right: 0;
    bottom: -10px;
  }

  &:hover {
    height: 6px;
    .progress-thumb { opacity: 1; transform: translateX(-50%) translateY(-50%) scale(1); }
  }
}

.progress-fill {
  height: 100%;
  background: $purple;
  border-radius: 2px;
  pointer-events: none;
  position: relative;
  z-index: 1;
}

.progress-thumb {
  position: absolute;
  top: 50%;
  transform: translateX(-50%) translateY(-50%) scale(0.6);
  width: 14px;
  height: 14px;
  border-radius: 50%;
  background: #fff;
  box-shadow: none;
  opacity: 0;
  transition: opacity 0.15s, transform 0.15s;
  pointer-events: none;
  z-index: 2;
}

// ── 帧预览气泡 ───────────────────────────────────────
.frame-preview {
  position: absolute;
  bottom: calc(100% + 10px);  // 进度条上方 10px
  transform: translateX(0);
  width: 160px;
  border-radius: 10px;
  overflow: hidden;
  background: rgba(12, 16, 30, 0.92);
  border: 1px solid rgba(255, 255, 255, 0.12);
  box-shadow:
    0 8px 24px rgba(0, 0, 0, 0.5),
    0 2px 8px rgba(0, 0, 0, 0.3);
  pointer-events: none;
  // 小三角
  &::after {
    content: '';
    position: absolute;
    bottom: -5px;
    left: 50%;
    transform: translateX(-50%);
    width: 10px;
    height: 5px;
    background: rgba(12, 16, 30, 0.92);
    clip-path: polygon(0 0, 100% 0, 50% 100%);
  }
}

.frame-canvas {
  display: block;
  width: 160px;
  height: 90px;
  background: #000;
}

.frame-time {
  display: block;
  text-align: center;
  font-size: 11px;
  font-weight: 600;
  color: rgba(255, 255, 255, 0.8);
  padding: 4px 0 5px;
  font-variant-numeric: tabular-nums;
  letter-spacing: 0.5px;
}

// 气泡入场动画
.thumb-preview-enter-active { transition: opacity 0.15s ease, transform 0.15s ease; }
.thumb-preview-leave-active { transition: opacity 0.1s ease; }
.thumb-preview-enter-from { opacity: 0; transform: translateY(4px); }
.thumb-preview-leave-to { opacity: 0; }

// 控制行
.controls-row {
  display: flex;
  align-items: center;
  gap: 8px;
}

.controls-spacer { flex: 1; }

// 控制图标按钮
.ctrl-icon-btn {
  width: 32px;
  height: 32px;
  border: none;
  border-radius: 8px;
  background: transparent;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  color: rgba(255, 255, 255, 0.8);
  transition: color 0.15s, background 0.15s;
  flex-shrink: 0;

  svg { width: 18px; height: 18px; }

  &:hover {
    color: #fff !important;
    background: rgba(255, 255, 255, 0.1);
  }
}

// 时间显示
.time-display {
  font-size: 12px;
  font-weight: 500;
  color: rgba(255, 255, 255, 0.65);
  white-space: nowrap;
  font-variant-numeric: tabular-nums;
  letter-spacing: 0.3px;
}

// 音量组
.volume-group {
  display: flex;
  align-items: center;
  gap: 4px;
}

.volume-slider {
  width: 72px;
  height: 4px;
  -webkit-appearance: none;
  appearance: none;
  background: rgba(255, 255, 255, 0.2);
  border-radius: 2px;
  outline: none;
  cursor: pointer;

  &::-webkit-slider-thumb {
    -webkit-appearance: none;
    width: 12px;
    height: 12px;
    border-radius: 50%;
    background: #fff;
    box-shadow: none;
    cursor: pointer;
  }

  &::-moz-range-thumb {
    width: 12px;
    height: 12px;
    border-radius: 50%;
    background: #fff;
    border: none;
    cursor: pointer;
  }
}

// ── 入场/退场动画 ────────────────────────────────────
.preview-fade-enter-active {
  transition: opacity 0.22s ease;
  .preview-card {
    transition: transform 0.25s cubic-bezier(0.34, 1.56, 0.64, 1), opacity 0.22s ease;
  }
}
.preview-fade-leave-active {
  transition: opacity 0.18s ease;
  .preview-card {
    transition: transform 0.18s ease, opacity 0.18s ease;
  }
}
.preview-fade-enter-from {
  opacity: 0;
  .preview-card { transform: scale(0.92); opacity: 0; }
}
.preview-fade-leave-to {
  opacity: 0;
  .preview-card { transform: scale(0.96); opacity: 0; }
}

// ── 通用淡入淡出 ─────────────────────────────────────
.fade-enter-active { transition: opacity 0.2s ease; }
.fade-leave-active { transition: opacity 0.15s ease; }
.fade-enter-from, .fade-leave-to { opacity: 0; }
</style>
