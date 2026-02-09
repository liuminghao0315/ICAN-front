<template>
  <div 
    ref="analysisPageRef" 
    class="analysis-page"
  >
    <div class="header-actions" :class="{ 'interactive-mode': viewMode === 'interactive' && analysisData }">
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
        <p>选择已分析的视频即可查看详细的高校舆情分析结果</p>
        <button class="neu-btn primary-btn" @click="$router.push('/videos')">
          <el-icon><VideoPlay /></el-icon>
          去我的视频
        </button>
      </div>
    </div>
    
    <!-- 分析结果展示 -->
    <AnalysisContent 
      v-if="analysisData"
      ref="analysisContentRef"
      :analysis-result="analysisData"
      :view-mode="viewMode"
      @update:view-mode="viewMode = $event"
      @export-pdf="handleExportPdf"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useWebSocket } from '@/composables/useWebSocket'
import { ElMessage } from 'element-plus'
import { VideoPlay, DataAnalysis, Close, Document, Download } from '@element-plus/icons-vue'
import { getVideoList, getResultById, getResultByVideoId, type VideoInfo } from '@/api'
import AnalysisContent from '@/components/AnalysisContent.vue'

const route = useRoute()
const router = useRouter()

// WebSocket - 当任务完成时刷新视频列表
const { subscribeCompleted } = useWebSocket()

// ==================== 父组件状态：只负责数据加载 ====================
const loading = ref(false)
const selectedVideoId = ref<string>('')
const videoList = ref<VideoInfo[]>([])
const analysisData = ref<any>(null)  // 分析结果数据
const emptyMessage = ref('请选择一个视频')
const showVideoDrawer = ref(false)
const viewMode = ref<'interactive' | 'report'>('interactive')  // 视图模式
const analysisContentRef = ref<InstanceType<typeof AnalysisContent> | null>(null)

// ==================== 数据加载方法 ====================
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

const selectVideo = (video: VideoInfo) => {
  selectedVideoId.value = video.id
  showVideoDrawer.value = false
  // 更新 URL 参数
  router.replace({ query: { videoId: video.id } })
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
    // 使用统一的API调用（指向8080后端）
    const response = await getResultByVideoId(selectedVideoId.value)
    
    if (response.code === 200 && response.data) {
      analysisData.value = response.data
      emptyMessage.value = ''
    } else {
      analysisData.value = null
      emptyMessage.value = '该视频尚未分析或分析未完成'
    }
  } catch (error: any) {
    ElMessage.error(error?.message || '加载分析结果失败')
    analysisData.value = null
    emptyMessage.value = '加载失败，请稍后重试'
  } finally {
    loading.value = false
  }
}

const loadAnalysisById = async (resultId: string) => {
  loading.value = true
  
  try {
    // 使用统一的API调用（指向8080后端）
    const response = await getResultById(resultId)
    
    if (response.code === 200 && response.data) {
      analysisData.value = response.data
      selectedVideoId.value = response.data.videoId
      emptyMessage.value = ''
    } else {
      analysisData.value = null
      emptyMessage.value = '分析结果不存在'
    }
  } catch (error: any) {
    ElMessage.error(error?.message || '加载分析结果失败')
    analysisData.value = null
    emptyMessage.value = '加载失败，请稍后重试'
  } finally {
    loading.value = false
  }
}

// ==================== 工具方法 ====================
const formatFileSize = (bytes: number) => {
  if (bytes < 1024) return bytes + ' B'
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
}

const getStatusClass = (status: string) => {
  switch (status) {
    case 'COMPLETED': return 'status-completed'
    case 'PROCESSING': return 'status-processing'
    case 'FAILED': return 'status-failed'
    default: return ''
  }
}

const getStatusText = (status: string) => {
  switch (status) {
    case 'COMPLETED': return '已完成'
    case 'PROCESSING': return '分析中'
    case 'FAILED': return '失败'
    default: return '未知'
  }
}

// 导出PDF
const handleExportPdf = () => {
  if (analysisContentRef.value && typeof analysisContentRef.value.exportToPdf === 'function') {
    analysisContentRef.value.exportToPdf()
  }
}

// ==================== WebSocket订阅 ====================
// 订阅任务完成事件，自动刷新视频列表
subscribeCompleted((data) => {
  fetchVideos()
  
  // 如果当前选中的视频刚完成分析，自动重新加载
  if (selectedVideoId.value === data.videoId) {
    loadAnalysisByVideo()
  }
})

// ==================== 生命周期 ====================
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

// 全局图标向下微调0.5px，改善视觉对齐
.el-icon {
  position: relative;
  top: 0.5px;
}

.analysis-page {
  min-height: 100vh;
  
  // 头部操作栏
  .header-actions {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 16px;
    margin-left: 0;
    transition: margin-left 0.3s ease;
    
    &.interactive-mode {
      margin-left: 20px;
    }
    
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
      border-radius: 8px;
      box-shadow: 
        inset 2px 2px 4px rgba(163, 177, 198, 0.3),
        inset -2px -2px 4px rgba(255, 255, 255, 0.8);
      
      button {
        padding: 6px 12px;
        background: transparent;
        box-shadow: none;
        
        &.active {
          background: $purple;
          color: white;
          box-shadow: 
            3px 3px 8px rgba(75, 112, 226, 0.3),
            -2px -2px 6px rgba(255, 255, 255, 0.5);
        }
      }
    }
  }

  // 视频选择侧边栏
  .video-drawer-overlay {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.3);
    z-index: 1000;
    opacity: 0;
    pointer-events: none;
    transition: opacity 0.3s ease;
    
    &.active {
      opacity: 1;
      pointer-events: auto;
    }
  }
  
  .video-drawer {
    position: fixed;
    top: 0;
    right: -400px;
    width: 400px;
    height: 100vh;
    background: $white;
    box-shadow: -4px 0 16px rgba(0, 0, 0, 0.1);
    z-index: 1001;
    transition: right 0.3s ease;
    display: flex;
    flex-direction: column;
    
    &.active {
      right: 0;
    }
    
    .drawer-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 20px 24px;
      border-bottom: 1px solid $neu-2;
      
      h3 {
        margin: 0;
        font-size: 18px;
        font-weight: 600;
        color: $black;
      }
      
      .close-btn {
        background: none;
        border: none;
        cursor: pointer;
        color: $gray;
        font-size: 20px;
        padding: 4px;
        
        &:hover {
          color: $black;
        }
      }
    }
    
    .drawer-content {
      flex: 1;
      overflow-y: auto;
      padding: 16px;
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
      padding: 12px;
      background: $neu-1;
      border-radius: 12px;
      cursor: pointer;
      transition: all 0.3s;
      box-shadow: 
        2px 2px 4px rgba(163, 177, 198, 0.3),
        -2px -2px 4px rgba(255, 255, 255, 0.8);
      
      &:hover {
        box-shadow: 
          3px 3px 6px rgba(163, 177, 198, 0.4),
          -3px -3px 6px rgba(255, 255, 255, 0.9);
      }
      
      &.active {
        box-shadow: 
          inset 2px 2px 4px rgba(163, 177, 198, 0.4),
          inset -2px -2px 4px rgba(255, 255, 255, 0.8);
        background: darken($neu-1, 2%);
      }
      
      .video-item-icon {
        color: $purple;
      }
      
      .video-item-info {
        flex: 1;
        min-width: 0;
        
        .video-item-title {
          font-size: 14px;
          font-weight: 500;
          color: $black;
          margin-bottom: 4px;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
        
        .video-item-meta {
          font-size: 12px;
          color: $gray;
        }
      }
      
      .video-item-status {
        .status-badge {
          padding: 2px 8px;
          border-radius: 4px;
          font-size: 11px;
          font-weight: 500;
          
          &.status-completed {
            background: rgba(82, 196, 26, 0.1);
            color: #52c41a;
          }
          
          &.status-processing {
            background: rgba(250, 173, 20, 0.1);
            color: #faad14;
          }
          
          &.status-failed {
            background: rgba(245, 108, 108, 0.1);
            color: #f56c6c;
          }
        }
      }
    }
    
    .empty-video-list {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 60px 20px;
      color: $gray;
      
      .el-icon {
        margin-bottom: 16px;
        color: $gray;
      }
      
      p {
        margin: 0 0 20px 0;
        font-size: 14px;
      }
    }
  }

  // 空状态卡片
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
        margin: 0 0 24px 0;
      }
    }
  }

  // 通用按钮样式
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

  // 通用卡片样式
  .neu-card {
    background: $neu-1;
    border-radius: 16px;
    padding: 20px;
    box-shadow: 
      6px 6px 12px rgba(163, 177, 198, 0.4),
      -6px -6px 12px rgba(255, 255, 255, 0.9);
    margin-bottom: 20px;
  }
}
</style>

<!-- 自定义 Tooltip 样式（全局，非scoped） -->
<style lang="scss">
.custom-tooltip.el-popper {
  background: rgba(255, 255, 255, 0.98) !important;
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  border: 1px solid rgba(0, 0, 0, 0.1) !important;
  border-radius: 8px !important;
  padding: 10px 14px !important;
  box-shadow: 0 6px 16px rgba(0, 0, 0, 0.15) !important;
  font-size: 12px !important;
  color: #303133 !important;
  line-height: 1.6 !important;
  max-width: 280px;
}

.custom-tooltip .el-popper__arrow::before {
  background: rgba(255, 255, 255, 0.98) !important;
  border: 1px solid rgba(0, 0, 0, 0.1) !important;
}

// 交互模式下移除main标签左padding
.interactive-mode-no-padding {
  padding-left: 0 !important;
}
</style>
