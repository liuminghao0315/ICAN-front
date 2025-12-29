<template>
  <div class="video-list-page">
    <!-- 顶部操作栏 -->
    <div class="header-actions">
      <h2 class="page-title">我的视频</h2>
      <div class="header-btns">
        <button class="neu-btn" @click="router.push('/tasks')">
          <el-icon><TrendCharts /></el-icon>
          分析任务
        </button>
        <button class="neu-btn primary-btn" @click="router.push('/upload')">
          <el-icon><Upload /></el-icon>
          上传视频
        </button>
      </div>
    </div>
    
    <!-- 视频列表 -->
    <div class="neu-card">
      <div class="card-header">
        <span class="card-title">视频列表 <span class="count">共 {{ total }} 条</span></span>
        <div class="header-actions-right">
          <button class="neu-btn icon-btn" @click="fetchVideos">
            <el-icon><Refresh /></el-icon>
          </button>
        </div>
      </div>
      
      <div class="video-list" v-loading="loading">
        <div 
          class="video-item" 
          v-for="video in videoList" 
          :key="video.id"
          @click="viewVideo(video)"
        >
          <div class="video-thumbnail">
            <el-icon :size="28"><VideoPlay /></el-icon>
          </div>
          <div class="video-info">
            <div class="video-title">{{ video.title }}</div>
            <div class="video-meta">
              {{ video.fileName }} · {{ formatFileSize(video.fileSize) }}
            </div>
          </div>
          <div class="video-status">
            <span class="status-tag" :class="getStatusClass(video.status)">
              {{ getStatusText(video.status) }}
            </span>
          </div>
          <div class="video-time">
            {{ formatDate(video.gmtCreated) }}
          </div>
          <div class="video-actions" @click.stop>
            <button class="neu-btn icon-btn small" @click="viewVideo(video)" title="查看详情">
              <el-icon><View /></el-icon>
            </button>
            <button 
              class="neu-btn icon-btn small primary" 
              v-if="video.status === 'UPLOADED'"
              @click="startAnalysis(video)"
              title="开始分析"
            >
              <el-icon><DataAnalysis /></el-icon>
            </button>
            <button 
              class="neu-btn icon-btn small success" 
              v-if="video.status === 'COMPLETED'"
              @click="viewResult(video)"
              title="查看结果"
            >
              <el-icon><Document /></el-icon>
            </button>
            <button class="neu-btn icon-btn small danger" @click="handleDelete(video)" title="删除">
              <el-icon><Delete /></el-icon>
            </button>
          </div>
        </div>
        
        <!-- 空状态 -->
        <div v-if="!loading && videoList.length === 0" class="empty-state">
          <el-icon :size="64"><VideoPlay /></el-icon>
          <p>暂无视频</p>
          <button class="neu-btn primary-btn" @click="router.push('/upload')">上传视频</button>
        </div>
      </div>
      
      <!-- 分页 -->
      <div class="pagination-wrapper" v-if="total > 0">
        <div class="pagination-info">
          显示 {{ (currentPage - 1) * pageSize + 1 }} - {{ Math.min(currentPage * pageSize, total) }} 条，共 {{ total }} 条
        </div>
        <div class="pagination-controls">
          <button 
            class="neu-btn page-btn" 
            :disabled="currentPage === 1"
            @click="changePage(currentPage - 1)"
          >
            <el-icon><ArrowLeft /></el-icon>
          </button>
          <span class="page-current">{{ currentPage }} / {{ totalPages }}</span>
          <button 
            class="neu-btn page-btn" 
            :disabled="currentPage >= totalPages"
            @click="changePage(currentPage + 1)"
          >
            <el-icon><ArrowRight /></el-icon>
          </button>
        </div>
      </div>
    </div>
    
    <!-- 视频详情对话框 -->
    <el-dialog
      v-model="detailDialogVisible"
      :title="selectedVideo?.title"
      width="800px"
      destroy-on-close
      class="neu-dialog"
    >
      <div class="video-detail" v-if="selectedVideo">
        <video
          v-if="selectedVideo.videoUrl"
          :src="selectedVideo.videoUrl"
          controls
          class="video-player"
        ></video>
        
        <div class="detail-grid">
          <div class="detail-item">
            <span class="detail-label">文件名</span>
            <span class="detail-value">{{ selectedVideo.fileName }}</span>
          </div>
          <div class="detail-item">
            <span class="detail-label">文件大小</span>
            <span class="detail-value">{{ formatFileSize(selectedVideo.fileSize) }}</span>
          </div>
          <div class="detail-item">
            <span class="detail-label">状态</span>
            <span class="detail-value">
              <span class="status-tag" :class="getStatusClass(selectedVideo.status)">
                {{ getStatusText(selectedVideo.status) }}
              </span>
            </span>
          </div>
          <div class="detail-item">
            <span class="detail-label">上传时间</span>
            <span class="detail-value">{{ formatDate(selectedVideo.gmtCreated) }}</span>
          </div>
          <div class="detail-item full-width">
            <span class="detail-label">描述</span>
            <span class="detail-value">{{ selectedVideo.description || '无描述' }}</span>
          </div>
        </div>
        
        <!-- 操作按钮 -->
        <div class="dialog-actions" v-if="selectedVideo.status === 'UPLOADED'">
          <button class="neu-btn primary-btn" @click="startAnalysisFromDialog">
            <el-icon><DataAnalysis /></el-icon>
            开始分析
          </button>
        </div>
        <div class="dialog-actions" v-else-if="selectedVideo.status === 'COMPLETED'">
          <button class="neu-btn primary-btn" @click="viewResultFromDialog">
            <el-icon><Document /></el-icon>
            查看分析结果
          </button>
        </div>
      </div>
    </el-dialog>
    
    <!-- 创建分析任务对话框 -->
    <el-dialog
      v-model="analysisDialogVisible"
      title="创建分析任务"
      width="500px"
      destroy-on-close
    >
      <div class="analysis-dialog-content" v-if="selectedVideo">
        <div class="video-preview">
          <div class="preview-icon">
            <el-icon :size="32"><VideoPlay /></el-icon>
          </div>
          <div class="preview-info">
            <div class="preview-title">{{ selectedVideo.title }}</div>
            <div class="preview-meta">{{ formatFileSize(selectedVideo.fileSize) }}</div>
          </div>
        </div>
        
        <div class="form-group">
          <label class="form-label">分析类型</label>
          <el-select v-model="analysisForm.taskType" class="w-full">
            <el-option value="FULL_ANALYSIS" label="完整分析（推荐）" />
            <el-option value="VIDEO_ONLY" label="仅视频分析" />
            <el-option value="AUDIO_ONLY" label="仅音频分析" />
            <el-option value="TEXT_ONLY" label="仅文本分析" />
          </el-select>
        </div>
        
        <div class="analysis-tips">
          <p><strong>完整分析</strong>：包含视频特征提取、音频分析、语音转文字、情感分析、风险评估等全部功能</p>
        </div>
      </div>
      
      <template #footer>
        <button class="neu-btn" @click="analysisDialogVisible = false">取消</button>
        <button 
          class="neu-btn primary-btn" 
          @click="confirmCreateTask"
          :disabled="creatingTask"
        >
          {{ creatingTask ? '创建中...' : '开始分析' }}
        </button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { 
  getVideoList, 
  deleteVideo, 
  createAnalysisTask,
  type VideoInfo 
} from '@/api'
import type { TaskType } from '@/types'
import { useWebSocket } from '@/composables/useWebSocket'

const router = useRouter()

const loading = ref(false)
const videoList = ref<VideoInfo[]>([])
const currentPage = ref(1)
const pageSize = ref(10)
const total = ref(0)

const totalPages = computed(() => Math.ceil(total.value / pageSize.value))

const detailDialogVisible = ref(false)
const analysisDialogVisible = ref(false)
const selectedVideo = ref<VideoInfo | null>(null)
const creatingTask = ref(false)

const analysisForm = ref({
  taskType: 'FULL_ANALYSIS' as TaskType
})

// WebSocket 连接 - 使用订阅模式
const { subscribeProgress, subscribeCompleted, subscribeFailed } = useWebSocket()

// 订阅任务进度更新
subscribeProgress((data) => {
  console.log('VideoList: 任务进度更新:', data)
  // 使用 videoId 更新视频状态
  const video = videoList.value.find(v => v.id === data.videoId)
  if (video) {
    video.status = 'ANALYZING'
  }
})

// 订阅任务完成通知
subscribeCompleted((data) => {
  console.log('VideoList: 任务完成:', data)
  ElMessage.success('分析任务已完成！')
  // 使用 videoId 实时更新视频状态，无需刷新列表
  const video = videoList.value.find(v => v.id === data.videoId)
  if (video) {
    video.status = 'COMPLETED'
  }
})

// 订阅任务失败通知
subscribeFailed((data) => {
  console.log('VideoList: 任务失败:', data)
  ElMessage.error(`分析任务失败：${data.errorMessage}`)
  // 使用 videoId 实时更新视频状态
  const video = videoList.value.find(v => v.id === data.videoId)
  if (video) {
    video.status = 'FAILED'
  }
})

// 获取视频列表
const fetchVideos = async () => {
  loading.value = true
  try {
    const response = await getVideoList(currentPage.value, pageSize.value)
    if (response.code === 200) {
      videoList.value = response.data.records
      total.value = response.data.total
    }
  } catch (error) {
    console.error('获取视频列表失败:', error)
    ElMessage.error('获取视频列表失败')
  } finally {
    loading.value = false
  }
}

// 切换页码
const changePage = (page: number) => {
  if (page < 1 || page > totalPages.value) return
  currentPage.value = page
  fetchVideos()
}

// 查看视频
const viewVideo = (video: VideoInfo) => {
  selectedVideo.value = video
  detailDialogVisible.value = true
}

// 开始分析
const startAnalysis = (video: VideoInfo) => {
  selectedVideo.value = video
  analysisForm.value.taskType = 'FULL_ANALYSIS'
  analysisDialogVisible.value = true
}

// 从详情对话框开始分析
const startAnalysisFromDialog = () => {
  detailDialogVisible.value = false
  analysisForm.value.taskType = 'FULL_ANALYSIS'
  analysisDialogVisible.value = true
}

// 确认创建任务
const confirmCreateTask = async () => {
  if (!selectedVideo.value) return
  
  creatingTask.value = true
  try {
    const response = await createAnalysisTask({
      videoId: selectedVideo.value.id,
      taskType: analysisForm.value.taskType
    })
    
    if (response.code === 200) {
      ElMessage.success('分析任务创建成功，正在处理中...')
      analysisDialogVisible.value = false
      // 更新视频状态
      const video = videoList.value.find(v => v.id === selectedVideo.value?.id)
      if (video) {
        video.status = 'ANALYZING'
      }
    } else {
      ElMessage.error(response.message || '创建任务失败')
    }
  } catch (error: any) {
    console.error('创建分析任务失败:', error)
    ElMessage.error(error.response?.data?.message || '创建任务失败，请稍后重试')
  } finally {
    creatingTask.value = false
  }
}

// 查看结果
const viewResult = (video: VideoInfo) => {
  router.push({ path: '/analysis', query: { videoId: video.id } })
}

// 从详情对话框查看结果
const viewResultFromDialog = () => {
  if (selectedVideo.value) {
    detailDialogVisible.value = false
    router.push({ path: '/analysis', query: { videoId: selectedVideo.value.id } })
  }
}

// 删除视频
const handleDelete = async (video: VideoInfo) => {
  try {
    await ElMessageBox.confirm(
      `确定要删除视频 "${video.title}" 吗？删除后无法恢复。`,
      '确认删除',
      {
        confirmButtonText: '删除',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )
    
    const response = await deleteVideo(video.id)
    if (response.code === 200) {
      ElMessage.success('删除成功')
      fetchVideos()
    } else {
      ElMessage.error(response.message || '删除失败')
    }
  } catch {
    // 用户取消
  }
}

// 格式化文件大小
const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

// 格式化日期
const formatDate = (dateStr: string): string => {
  return new Date(dateStr).toLocaleString('zh-CN')
}

// 获取状态类型
const getStatusClass = (status: string) => {
  const classes: Record<string, string> = {
    'UPLOADED': 'pending',
    'ANALYZING': 'processing',
    'COMPLETED': 'completed',
    'FAILED': 'failed'
  }
  return classes[status] || 'pending'
}

// 获取状态文本
const getStatusText = (status: string) => {
  const texts: Record<string, string> = {
    'UPLOADED': '待分析',
    'ANALYZING': '分析中',
    'COMPLETED': '已完成',
    'FAILED': '失败'
  }
  return texts[status] || status
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

.video-list-page {
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
    
    .header-btns {
      display: flex;
      gap: 12px;
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
      
      .count {
        font-size: 12px;
        color: $gray;
        font-weight: 400;
        margin-left: 8px;
      }
    }
    
    .header-actions-right {
      display: flex;
      gap: 8px;
    }
  }
}

// 新拟态按钮
.neu-btn {
  background: $neu-1;
  border: none;
  border-radius: 10px;
  cursor: pointer;
  transition: all 0.25s;
  box-shadow: 4px 4px 8px $neu-2, -4px -4px 8px $white;
  color: $gray;
  font-family: 'Montserrat', sans-serif;
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 10px 18px;
  font-size: 13px;
  
  &:hover {
    box-shadow: 2px 2px 4px $neu-2, -2px -2px 4px $white;
    color: $purple;
  }
  
  &:active {
    box-shadow: inset 2px 2px 4px $neu-2, inset -2px -2px 4px $white;
  }
  
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
  
  &.icon-btn {
    width: 40px;
    height: 40px;
    padding: 0;
    justify-content: center;
    font-size: 16px;
    
    &.small {
      width: 34px;
      height: 34px;
      font-size: 14px;
    }
    
    &.primary {
      color: $purple;
    }
    
    &.success {
      color: #52c41a;
    }
    
    &.danger {
      color: #f56c6c;
    }
  }
  
  &.primary-btn {
    background: linear-gradient(135deg, $purple 0%, #7c9df7 100%);
    color: #fff;
    
    &:hover {
      box-shadow: 4px 4px 8px $neu-2, -2px -2px 6px $white;
      color: #fff;
    }
  }
  
  &.page-btn {
    width: 36px;
    height: 36px;
    padding: 0;
    justify-content: center;
    font-size: 14px;
  }
}

// 视频列表
.video-list {
  padding: 16px;
  
  .video-item {
    display: flex;
    align-items: center;
    gap: 16px;
    padding: 18px 20px;
    border-radius: 16px;
    cursor: pointer;
    transition: all 0.3s;
    margin-bottom: 12px;
    background: $neu-1;
    box-shadow: 4px 4px 10px $neu-2, -4px -4px 10px $white;
    
    &:hover {
      box-shadow: inset 2px 2px 4px $neu-2, inset -2px -2px 4px $white;
    }
    
    &:last-child {
      margin-bottom: 0;
    }
    
    .video-thumbnail {
      width: 56px;
      height: 56px;
      border-radius: 14px;
      background: linear-gradient(135deg, $purple 0%, #7c9df7 100%);
      display: flex;
      align-items: center;
      justify-content: center;
      color: #fff;
      flex-shrink: 0;
    }
    
    .video-info {
      flex: 1;
      min-width: 0;
      
      .video-title {
        font-size: 15px;
        font-weight: 600;
        color: $black;
        margin-bottom: 6px;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }
      
      .video-meta {
        font-size: 12px;
        color: $gray;
      }
    }
    
    .video-status {
      flex-shrink: 0;
    }
    
    .video-time {
      width: 160px;
      font-size: 13px;
      color: $gray;
      text-align: right;
      flex-shrink: 0;
    }
    
    .video-actions {
      display: flex;
      gap: 8px;
      flex-shrink: 0;
    }
  }
}

// 状态标签
.status-tag {
  display: inline-block;
  padding: 5px 14px;
  border-radius: 20px;
  font-size: 11px;
  font-weight: 500;
  
  &.pending {
    background: rgba($gray, 0.12);
    color: $gray;
  }
  
  &.processing {
    background: rgba(230, 162, 60, 0.12);
    color: #e6a23c;
  }
  
  &.completed {
    background: rgba($purple, 0.12);
    color: $purple;
  }
  
  &.failed {
    background: rgba(245, 108, 108, 0.12);
    color: #f56c6c;
  }
}

// 空状态
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 64px 20px;
  color: $gray;
  
  p {
    margin: 20px 0 24px;
    font-size: 15px;
  }
}

// 分页
.pagination-wrapper {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 18px 24px;
  border-top: 1px solid rgba($neu-2, 0.5);
  
  .pagination-info {
    font-size: 13px;
    color: $gray;
  }
  
  .pagination-controls {
    display: flex;
    align-items: center;
    gap: 16px;
    
    .page-current {
      font-size: 14px;
      color: $black;
      font-weight: 500;
    }
  }
}

// 视频详情
.video-detail {
  .video-player {
    width: 100%;
    max-height: 400px;
    background: #000;
    border-radius: 16px;
    margin-bottom: 24px;
  }
  
  .detail-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 16px;
    
    .detail-item {
      background: $neu-1;
      border-radius: 12px;
      padding: 16px;
      box-shadow: inset 2px 2px 4px $neu-2, inset -2px -2px 4px $white;
      
      &.full-width {
        grid-column: 1 / -1;
      }
      
      .detail-label {
        display: block;
        font-size: 12px;
        color: $gray;
        margin-bottom: 6px;
      }
      
      .detail-value {
        font-size: 14px;
        color: $black;
        font-weight: 500;
      }
    }
  }
  
  .dialog-actions {
    display: flex;
    justify-content: center;
    margin-top: 24px;
    gap: 16px;
  }
}

// 分析对话框
.analysis-dialog-content {
  .video-preview {
    display: flex;
    align-items: center;
    gap: 16px;
    padding: 18px 20px;
    background: $neu-1;
    border-radius: 16px;
    box-shadow: inset 2px 2px 4px $neu-2, inset -2px -2px 4px $white;
    margin-bottom: 24px;
    
    .preview-icon {
      width: 56px;
      height: 56px;
      border-radius: 14px;
      background: linear-gradient(135deg, $purple 0%, #7c9df7 100%);
      display: flex;
      align-items: center;
      justify-content: center;
      color: #fff;
    }
    
    .preview-info {
      flex: 1;
      
      .preview-title {
        font-size: 15px;
        font-weight: 600;
        color: $black;
        margin-bottom: 4px;
      }
      
      .preview-meta {
        font-size: 13px;
        color: $gray;
      }
    }
  }
  
  .form-group {
    margin-bottom: 20px;
    
    .form-label {
      display: block;
      font-size: 13px;
      font-weight: 500;
      color: $black;
      margin-bottom: 8px;
    }
    
    .w-full {
      width: 100%;
    }
  }
  
  .analysis-tips {
    background: rgba($purple, 0.08);
    border-radius: 12px;
    padding: 14px 18px;
    
    p {
      margin: 0;
      font-size: 13px;
      color: $gray;
      line-height: 1.6;
      
      strong {
        color: $purple;
      }
    }
  }
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
  
  .el-dialog__footer {
    border-top: 1px solid rgba($neu-2, 0.5);
    padding: 16px 24px;
    display: flex;
    justify-content: flex-end;
    gap: 12px;
  }
}
</style>
