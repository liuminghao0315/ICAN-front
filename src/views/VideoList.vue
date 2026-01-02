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
    
    <!-- 筛选工具栏 -->
    <div class="filter-toolbar">
      <div class="filter-group">
        <div class="filter-label">
          <el-icon><Filter /></el-icon>
          <span>状态</span>
        </div>
        <div class="filter-chips">
          <div 
            class="filter-chip" 
            :class="{ active: statusFilter === '' }"
            @click="statusFilter = ''; fetchVideos()"
          >
            全部
          </div>
          <div 
            class="filter-chip" 
            :class="{ active: statusFilter === 'UPLOADED' }"
            @click="statusFilter = 'UPLOADED'; fetchVideos()"
          >
            <span class="chip-dot info"></span>
            待分析
          </div>
          <div 
            class="filter-chip" 
            :class="{ active: statusFilter === 'ANALYZING' }"
            @click="statusFilter = 'ANALYZING'; fetchVideos()"
          >
            <span class="chip-dot warning"></span>
            分析中
          </div>
          <div 
            class="filter-chip" 
            :class="{ active: statusFilter === 'COMPLETED' }"
            @click="statusFilter = 'COMPLETED'; fetchVideos()"
          >
            <span class="chip-dot success"></span>
            已完成
          </div>
          <div 
            class="filter-chip" 
            :class="{ active: statusFilter === 'FAILED' }"
            @click="statusFilter = 'FAILED'; fetchVideos()"
          >
            <span class="chip-dot danger"></span>
            失败
          </div>
        </div>
      </div>
      
      <div class="filter-divider"></div>
      
      <div class="filter-group">
        <div class="filter-label">
          <el-icon><Sort /></el-icon>
          <span>排序</span>
        </div>
        <div class="sort-buttons">
          <button 
            class="sort-btn" 
            :class="{ 
              active: sortBy.startsWith('gmtCreated'),
              'sort-desc': sortBy.startsWith('gmtCreated') && sortBy.endsWith('_desc'),
              'sort-asc': sortBy.startsWith('gmtCreated') && sortBy.endsWith('_asc')
            }"
            @click="toggleSort('gmtCreated')"
            title="点击切换排序方向"
          >
            <el-icon><Clock /></el-icon>
            <span class="sort-label">时间</span>
            <span class="sort-indicator">
              <el-icon v-if="!sortBy.startsWith('gmtCreated')" class="sort-icon-placeholder"><Sort /></el-icon>
              <el-icon v-else-if="sortBy.endsWith('_desc')" class="sort-icon-desc"><ArrowDown /></el-icon>
              <el-icon v-else class="sort-icon-asc"><ArrowUp /></el-icon>
            </span>
          </button>
          <button 
            class="sort-btn" 
            :class="{ 
              active: sortBy.startsWith('fileSize'),
              'sort-desc': sortBy.startsWith('fileSize') && sortBy.endsWith('_desc'),
              'sort-asc': sortBy.startsWith('fileSize') && sortBy.endsWith('_asc')
            }"
            @click="toggleSort('fileSize')"
            title="点击切换排序方向"
          >
            <el-icon><Files /></el-icon>
            <span class="sort-label">大小</span>
            <span class="sort-indicator">
              <el-icon v-if="!sortBy.startsWith('fileSize')" class="sort-icon-placeholder"><Sort /></el-icon>
              <el-icon v-else-if="sortBy.endsWith('_desc')" class="sort-icon-desc"><ArrowDown /></el-icon>
              <el-icon v-else class="sort-icon-asc"><ArrowUp /></el-icon>
            </span>
          </button>
          <button 
            class="sort-btn" 
            :class="{ 
              active: sortBy.startsWith('title'),
              'sort-desc': sortBy.startsWith('title') && sortBy.endsWith('_desc'),
              'sort-asc': sortBy.startsWith('title') && sortBy.endsWith('_asc')
            }"
            @click="toggleSort('title')"
            title="点击切换排序方向"
          >
            <el-icon><Document /></el-icon>
            <span class="sort-label">名称</span>
            <span class="sort-indicator">
              <el-icon v-if="!sortBy.startsWith('title')" class="sort-icon-placeholder"><Sort /></el-icon>
              <el-icon v-else-if="sortBy.endsWith('_desc')" class="sort-icon-desc"><ArrowDown /></el-icon>
              <el-icon v-else class="sort-icon-asc"><ArrowUp /></el-icon>
            </span>
          </button>
        </div>
      </div>
      
      <div class="filter-actions">
        <button class="refresh-btn" @click="fetchVideos" title="刷新">
          <el-icon><Refresh /></el-icon>
        </button>
      </div>
    </div>
    
    <!-- 视频列表 -->
    <div class="neu-card">
      <div class="card-header">
        <span class="card-title">视频列表 <span class="count">共 {{ total }} 条</span></span>
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
            <span class="status-tag" :class="getStatusClass(video)">
              {{ getStatusText(video) }}
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
              class="neu-btn icon-btn small warning" 
              v-if="isAnalysisTimeout(video) || video.status === 'FAILED'"
              @click="startAnalysis(video)"
              title="重新分析"
            >
              <el-icon><RefreshRight /></el-icon>
            </button>
            <button 
              class="neu-btn icon-btn small info" 
              v-if="video.status === 'ANALYZING' && !isAnalysisTimeout(video)"
              disabled
              title="正在分析"
            >
              <el-icon><Loading /></el-icon>
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
    
    <!-- 自定义视频详情模态框 -->
    <Teleport to="body">
      <Transition name="modal">
        <div class="video-modal-overlay" v-if="detailDialogVisible" @click.self="detailDialogVisible = false">
          <div class="video-modal" v-if="selectedVideo">
            <!-- 模态框头部 -->
            <div class="video-modal-header">
              <div class="modal-title-section">
                <div class="modal-icon">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <polygon points="23 7 16 12 23 17 23 7"/>
                    <rect x="1" y="5" width="15" height="14" rx="2" ry="2"/>
                  </svg>
                </div>
                <h3 class="modal-title">{{ selectedVideo.title }}</h3>
              </div>
              <button class="modal-close-btn" @click="detailDialogVisible = false">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <line x1="18" y1="6" x2="6" y2="18"/>
                  <line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
              </button>
            </div>
            
            <!-- 模态框内容 -->
            <div class="video-modal-body">
              <!-- 视频播放器 -->
              <div class="video-player-wrapper" v-if="selectedVideo.videoUrl">
                <video
                  ref="videoPlayerRef"
                  :src="selectedVideo.videoUrl"
                  controls
                  class="custom-video-player"
                ></video>
                <div class="video-player-overlay"></div>
              </div>
              
              <!-- 视频信息网格 -->
              <div class="video-info-grid">
                <div class="info-card">
                  <div class="info-icon size">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                      <polyline points="17 8 12 3 7 8"/>
                      <line x1="12" y1="3" x2="12" y2="15"/>
                    </svg>
                  </div>
                  <div class="info-content">
                    <span class="info-label">文件大小</span>
                    <span class="info-value">{{ formatFileSize(selectedVideo.fileSize) }}</span>
                  </div>
                </div>
                
                <div class="info-card">
                  <div class="info-icon time">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
                      <line x1="16" y1="2" x2="16" y2="6"/>
                      <line x1="8" y1="2" x2="8" y2="6"/>
                      <line x1="3" y1="10" x2="21" y2="10"/>
                    </svg>
                  </div>
                  <div class="info-content">
                    <span class="info-label">上传时间</span>
                    <span class="info-value">{{ formatDate(selectedVideo.gmtCreated) }}</span>
                  </div>
                </div>
              </div>
              
              <!-- 视频描述 -->
              <div class="video-description">
                <div class="desc-header">
                  <div class="desc-icon">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                      <polyline points="14 2 14 8 20 8"/>
                      <line x1="16" y1="13" x2="8" y2="13"/>
                      <line x1="16" y1="17" x2="8" y2="17"/>
                      <polyline points="10 9 9 9 8 9"/>
                    </svg>
                  </div>
                  <span class="desc-label">视频描述</span>
                  <span class="status-tag" :class="getStatusClass(selectedVideo)">
                    {{ getStatusText(selectedVideo) }}
                  </span>
                </div>
                <p class="desc-text">{{ selectedVideo.description || '暂无描述信息' }}</p>
              </div>
            </div>
            
            <!-- 模态框底部操作 -->
            <div class="video-modal-footer">
              <button class="neu-btn" @click="detailDialogVisible = false">
                关闭
              </button>
              <button class="neu-btn primary-btn" v-if="selectedVideo.status === 'UPLOADED'" @click="startAnalysisFromDialog">
                <el-icon><DataAnalysis /></el-icon>
                开始分析
              </button>
              <button class="neu-btn warning-btn" v-else-if="isAnalysisTimeout(selectedVideo) || selectedVideo.status === 'FAILED'" @click="startAnalysisFromDialog">
                <el-icon><RefreshRight /></el-icon>
                重新分析
              </button>
              <button class="neu-btn primary-btn" v-else-if="selectedVideo.status === 'COMPLETED'" @click="viewResultFromDialog">
                <el-icon><Document /></el-icon>
                查看分析结果
              </button>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>
    
    <!-- 创建分析任务对话框 -->
    <el-dialog
      v-model="analysisDialogVisible"
      title="开始分析"
      width="450px"
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
        
        <div class="analysis-tips">
          <p>将对该视频进行<strong>完整分析</strong>，包含：</p>
          <ul class="analysis-feature-list">
            <li>🎬 视频特征提取</li>
            <li>🔊 音频分析</li>
            <li>📝 语音转文字</li>
            <li>💭 情感分析</li>
            <li>⚠️ 风险评估</li>
          </ul>
        </div>
      </div>
      
      <template #footer>
        <div class="dialog-footer-buttons">
          <button class="neu-btn" @click="analysisDialogVisible = false">取消</button>
          <button 
            class="neu-btn primary-btn" 
            @click="confirmCreateTask"
            :disabled="creatingTask"
          >
            {{ creatingTask ? '分析中...' : '开始分析' }}
          </button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { 
  getVideoList, 
  deleteVideo, 
  createAnalysisTask,
  type VideoInfo 
} from '@/api'
import { useWebSocket } from '@/composables/useWebSocket'

const router = useRouter()

const loading = ref(false)
const videoList = ref<VideoInfo[]>([])
const currentPage = ref(1)
const pageSize = ref(10)
const total = ref(0)
const statusFilter = ref<string>('')
const sortBy = ref<string>('gmtCreated_desc')

const totalPages = computed(() => Math.ceil(total.value / pageSize.value))

const detailDialogVisible = ref(false)
const analysisDialogVisible = ref(false)
const selectedVideo = ref<VideoInfo | null>(null)
const creatingTask = ref(false)
const videoPlayerRef = ref<HTMLVideoElement | null>(null)

// 分析选项（仅用于控制是否强制重新分析）
const analysisOptions = ref({
  forceRestart: false
})

// 记录重新分析的开始时间（用于正确判断超时）
const analysisStartTimes = ref<Record<string, number>>({})

// WebSocket 连接 - 使用订阅模式
const { subscribeProgress, subscribeCompleted, subscribeFailed } = useWebSocket()

// 订阅任务进度更新
subscribeProgress((data) => {
  const video = videoList.value.find(v => v.id === data.videoId)
  if (video) {
    video.status = 'ANALYZING'
  }
})

// 订阅任务完成通知
subscribeCompleted((data) => {
  console.log('[VideoList] 收到任务完成通知:', data)
  ElMessage.success('分析任务已完成！')
  const video = videoList.value.find(v => v.id === data.videoId)
  console.log('[VideoList] 找到视频:', video?.id, video?.status)
  if (video) {
    video.status = 'COMPLETED'
    // 清除分析开始时间记录
    delete analysisStartTimes.value[video.id]
    console.log('[VideoList] 视频状态已更新为 COMPLETED')
  }
})

// 订阅任务失败通知
subscribeFailed((data) => {
  ElMessage.error(`分析任务失败：${data.errorMessage}`)
  const video = videoList.value.find(v => v.id === data.videoId)
  if (video) {
    video.status = 'FAILED'
    // 清除分析开始时间记录
    delete analysisStartTimes.value[video.id]
  }
})

// 切换排序 - 同时重新从后端获取数据
const toggleSort = (field: string) => {
  const currentField = sortBy.value.split('_')[0]
  const currentOrder = sortBy.value.split('_')[1]
  
  if (currentField === field) {
    sortBy.value = `${field}_${currentOrder === 'desc' ? 'asc' : 'desc'}`
  } else {
    sortBy.value = `${field}_desc`
  }
  
  // 重置到第一页并重新获取数据
  currentPage.value = 1
  fetchVideos()
}

// 获取视频列表
const fetchVideos = async () => {
  loading.value = true
  try {
    const status = statusFilter.value || undefined
    const [field, order] = sortBy.value.split('_')
    const response = await getVideoList(currentPage.value, pageSize.value, status, field, order)
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
  // 如果是超时的任务或失败的任务，需要强制重新分析
  analysisOptions.value.forceRestart = isAnalysisTimeout(video) || video.status === 'FAILED'
  analysisDialogVisible.value = true
}

// 从详情对话框开始分析
const startAnalysisFromDialog = () => {
  detailDialogVisible.value = false
  // 如果是超时的任务或失败的任务，需要强制重新分析
  if (selectedVideo.value) {
    analysisOptions.value.forceRestart = isAnalysisTimeout(selectedVideo.value) || selectedVideo.value.status === 'FAILED'
  }
  analysisDialogVisible.value = true
}

// 确认创建任务
const confirmCreateTask = async () => {
  if (!selectedVideo.value) return
  
  creatingTask.value = true
  try {
    const response = await createAnalysisTask({
      videoId: selectedVideo.value.id,
      taskType: 'FULL_ANALYSIS',
      forceRestart: analysisOptions.value.forceRestart
    })
    
    if (response.code === 200) {
      ElMessage.success('分析任务创建成功，正在处理中...')
      analysisDialogVisible.value = false
      // 更新视频状态
      const video = videoList.value.find(v => v.id === selectedVideo.value?.id)
      if (video) {
        video.status = 'ANALYZING'
        // 记录分析开始时间，用于正确判断超时
        analysisStartTimes.value[video.id] = Date.now()
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

// 分析超时时间（10分钟）
const ANALYSIS_TIMEOUT_MS = 10 * 60 * 1000

// 检查视频分析是否超时
const isAnalysisTimeout = (video: VideoInfo): boolean => {
  if (video.status !== 'ANALYZING') return false
  // 优先使用记录的分析开始时间，否则使用视频创建时间
  const startTime = analysisStartTimes.value[video.id] || new Date(video.gmtCreated).getTime()
  const now = Date.now()
  return (now - startTime) > ANALYSIS_TIMEOUT_MS
}

// 获取状态类型
const getStatusClass = (video: VideoInfo) => {
  if (isAnalysisTimeout(video)) {
    return 'timeout'
  }
  const classes: Record<string, string> = {
    'UPLOADED': 'pending',
    'ANALYZING': 'processing',
    'COMPLETED': 'completed',
    'FAILED': 'failed'
  }
  return classes[video.status] || 'pending'
}

// 获取状态文本
const getStatusText = (video: VideoInfo) => {
  if (isAnalysisTimeout(video)) {
    return '分析异常'
  }
  const texts: Record<string, string> = {
    'UPLOADED': '待分析',
    'ANALYZING': '分析中',
    'COMPLETED': '已完成',
    'FAILED': '分析异常'
  }
  return texts[video.status] || video.status
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
  
  // 美化的筛选工具栏
  .filter-toolbar {
    display: flex;
    align-items: center;
    gap: 20px;
    padding: 16px 24px;
    margin-bottom: 20px;
    background: linear-gradient(145deg, #f5f7fa, #e8ecef);
    border-radius: 16px;
    box-shadow: 
      6px 6px 12px rgba(163, 177, 198, 0.35),
      -6px -6px 12px rgba(255, 255, 255, 0.8);
    flex-wrap: wrap;
    
    .filter-group {
      display: flex;
      align-items: center;
      gap: 12px;
      
      .filter-label {
        display: flex;
        align-items: center;
        gap: 6px;
        color: $gray;
        font-size: 13px;
        font-weight: 500;
        white-space: nowrap;
        
        .el-icon {
          font-size: 14px;
        }
      }
      
      .filter-chips {
        display: flex;
        gap: 8px;
        flex-wrap: wrap;
      }
      
      .filter-chip {
        padding: 6px 14px;
        border-radius: 20px;
        font-size: 12px;
        font-weight: 500;
        cursor: pointer;
        transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
        background: $neu-1;
        color: $gray;
        box-shadow: 
          3px 3px 6px rgba(163, 177, 198, 0.4),
          -3px -3px 6px rgba(255, 255, 255, 0.9);
        display: flex;
        align-items: center;
        gap: 6px;
        user-select: none;
        
        .chip-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          
          &.success { background: #67c23a; }
          &.warning { background: #e6a23c; }
          &.info { background: #909399; }
          &.danger { background: #f56c6c; }
        }
        
        &:hover {
          transform: translateY(-1px);
          box-shadow: 
            4px 4px 8px rgba(163, 177, 198, 0.5),
            -4px -4px 8px rgba(255, 255, 255, 1);
        }
        
        &.active {
          background: linear-gradient(135deg, $purple, #6b8be8);
          color: white;
          box-shadow: 
            inset 2px 2px 4px rgba(0, 0, 0, 0.1),
            0 4px 12px rgba(75, 112, 226, 0.3);
          
          .chip-dot {
            background: white;
            box-shadow: 0 0 6px rgba(255, 255, 255, 0.6);
          }
        }
      }
      
      .sort-buttons {
        display: flex;
        gap: 8px;
        
        .sort-btn {
          position: relative;
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 8px 16px;
          border: 2px solid transparent;
          border-radius: 12px;
          font-size: 13px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          background: $neu-1;
          color: $gray;
          box-shadow: 
            4px 4px 8px rgba(163, 177, 198, 0.4),
            -4px -4px 8px rgba(255, 255, 255, 0.9);
          min-width: 90px;
          justify-content: space-between;
          
          .el-icon {
            font-size: 14px;
            transition: transform 0.3s ease;
          }
          
          .sort-label {
            flex: 1;
            text-align: left;
          }
          
          .sort-indicator {
            display: flex;
            align-items: center;
            justify-content: center;
            width: 20px;
            height: 20px;
            border-radius: 50%;
            background: rgba($purple, 0.1);
            transition: all 0.3s ease;
            
            .el-icon {
              font-size: 12px;
              color: $purple;
            }
            
            .sort-icon-placeholder {
              opacity: 0.5;
              color: $gray;
            }
            
            .sort-icon-desc,
            .sort-icon-asc {
              animation: pulse 1.5s ease-in-out infinite;
            }
          }
          
          &:hover {
            transform: translateY(-2px);
            color: $purple;
            border-color: rgba($purple, 0.3);
            box-shadow: 
              6px 6px 12px rgba(163, 177, 198, 0.5),
              -6px -6px 12px rgba(255, 255, 255, 1),
              0 0 0 3px rgba($purple, 0.1);
            
            .sort-indicator {
              background: rgba($purple, 0.2);
              transform: scale(1.1);
              
              .el-icon {
                color: $purple;
              }
            }
          }
          
          &:active {
            transform: translateY(0);
            box-shadow: 
              inset 3px 3px 6px rgba(163, 177, 198, 0.5),
              inset -3px -3px 6px rgba(255, 255, 255, 0.8);
          }
          
          &.active {
            background: linear-gradient(135deg, $purple, #6b8be8);
            color: white;
            border-color: $purple;
            box-shadow: 
              inset 2px 2px 4px rgba(0, 0, 0, 0.15),
              0 6px 16px rgba(75, 112, 226, 0.4),
              0 0 0 2px rgba(255, 255, 255, 0.1);
            
            .el-icon {
              color: white;
            }
            
            .sort-indicator {
              background: rgba(255, 255, 255, 0.25);
              backdrop-filter: blur(4px);
              
              .el-icon {
                color: white;
                animation: bounce 0.6s ease;
              }
            }
            
            &.sort-desc .sort-indicator .el-icon {
              animation: bounceDown 0.6s ease;
            }
            
            &.sort-asc .sort-indicator .el-icon {
              animation: bounceUp 0.6s ease;
            }
          }
        }
      }
      
      @keyframes pulse {
        0%, 100% {
          opacity: 1;
          transform: scale(1);
        }
        50% {
          opacity: 0.7;
          transform: scale(0.95);
        }
      }
      
      @keyframes bounce {
        0%, 100% {
          transform: translateY(0);
        }
        50% {
          transform: translateY(-3px);
        }
      }
      
      @keyframes bounceDown {
        0%, 100% {
          transform: translateY(0);
        }
        50% {
          transform: translateY(3px);
        }
      }
      
      @keyframes bounceUp {
        0%, 100% {
          transform: translateY(0);
        }
        50% {
          transform: translateY(-3px);
        }
      }
    }
    
    .filter-divider {
      width: 1px;
      height: 32px;
      background: linear-gradient(to bottom, transparent, rgba(160, 165, 168, 0.3), transparent);
    }
    
    .filter-actions {
      margin-left: auto;
      
      .refresh-btn {
        display: flex;
        align-items: center;
        justify-content: center;
        width: 40px;
        height: 40px;
        border: none;
        border-radius: 12px;
        cursor: pointer;
        transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
        background: $neu-1;
        color: $gray;
        box-shadow: 
          4px 4px 8px rgba(163, 177, 198, 0.4),
          -4px -4px 8px rgba(255, 255, 255, 0.9);
        
        .el-icon {
          font-size: 18px;
        }
        
        &:hover {
          color: $purple;
          transform: rotate(180deg);
        }
        
        &:active {
          box-shadow: 
            inset 3px 3px 6px rgba(163, 177, 198, 0.5),
            inset -3px -3px 6px rgba(255, 255, 255, 0.8);
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
      
      .count {
        font-size: 12px;
        color: $gray;
        font-weight: 400;
        margin-left: 8px;
      }
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
    
    &.warning {
      color: #e6a23c;
    }
    
    &.info {
      color: #909399;
      
      // 正在分析按钮的旋转动画
      .el-icon {
        animation: iconRotate 2s linear infinite;
      }
    }
    
    &.danger {
      color: #f56c6c;
    }
  }
  
  @keyframes iconRotate {
    from {
      transform: rotate(0deg);
    }
    to {
      transform: rotate(360deg);
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
  
  &.warning-btn {
    background: linear-gradient(135deg, #e6a23c 0%, #f0c78a 100%);
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
  
  &.timeout {
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

// 自定义视频模态框
.video-modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.35);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 2000;
  padding: 20px;
}

.video-modal {
  background: $white;
  border-radius: 24px;
  width: 100%;
  max-width: 800px;
  max-height: 90vh;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  box-shadow: 
    16px 16px 40px rgba(0, 0, 0, 0.15),
    -8px -8px 30px rgba(255, 255, 255, 0.8),
    0 20px 60px rgba(0, 0, 0, 0.2);
  border: 1px solid rgba(255, 255, 255, 0.9);
  
  .video-modal-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 20px 24px;
    border-bottom: 1px solid rgba($neu-2, 0.4);
    background: linear-gradient(135deg, $neu-1, $white);
    
    .modal-title-section {
      display: flex;
      align-items: center;
      gap: 14px;
      
      .modal-icon {
        width: 40px;
        height: 40px;
        border-radius: 12px;
        background: linear-gradient(135deg, $purple, #7c9df7);
        display: flex;
        align-items: center;
        justify-content: center;
        box-shadow: 
          4px 4px 8px rgba(75, 112, 226, 0.3),
          -2px -2px 4px $white;
        
        svg {
          width: 20px;
          height: 20px;
          color: white;
        }
      }
      
      .modal-title {
        font-size: 18px;
        font-weight: 600;
        color: $black;
        margin: 0;
        max-width: 500px;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }
    }
    
    .modal-close-btn {
      width: 36px;
      height: 36px;
      border: none;
      border-radius: 10px;
      background: $neu-1;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: all 0.3s ease;
      box-shadow: 
        3px 3px 6px $neu-2,
        -3px -3px 6px $white;
      
      svg {
        width: 18px;
        height: 18px;
        color: $gray;
        transition: color 0.3s ease;
      }
      
      &:hover {
        box-shadow: 
          2px 2px 4px $neu-2,
          -2px -2px 4px $white;
        
        svg {
          color: #ef4444;
        }
      }
      
      &:active {
        box-shadow: 
          inset 2px 2px 4px $neu-2,
          inset -2px -2px 4px $white;
      }
    }
  }
  
  .video-modal-body {
    padding: 24px;
    overflow-y: auto;
    flex: 1;
    
    // 自定义滚动条
    &::-webkit-scrollbar {
      width: 8px;
    }
    
    &::-webkit-scrollbar-track {
      background: rgba($neu-2, 0.3);
      border-radius: 4px;
    }
    
    &::-webkit-scrollbar-thumb {
      background: linear-gradient(135deg, $purple, #7c9df7);
      border-radius: 4px;
      
      &:hover {
        background: linear-gradient(135deg, darken($purple, 10%), $purple);
      }
    }
  }
  
  .video-modal-footer {
    display: flex;
    justify-content: flex-end;
    gap: 12px;
    padding: 16px 24px;
    border-top: 1px solid rgba($neu-2, 0.4);
    background: linear-gradient(135deg, $white, $neu-1);
  }
}

// 视频播放器
.video-player-wrapper {
  position: relative;
  border-radius: 16px;
  overflow: hidden;
  margin-bottom: 24px;
  background: #000;
  box-shadow: 
    inset 4px 4px 8px rgba(0, 0, 0, 0.3),
    8px 8px 20px rgba(0, 0, 0, 0.2);
  
  .custom-video-player {
    width: 100%;
    max-height: 380px;
    display: block;
    background: #000;
  }
  
  .video-player-overlay {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 60px;
    background: linear-gradient(to bottom, rgba(0, 0, 0, 0.3), transparent);
    pointer-events: none;
    border-radius: 16px 16px 0 0;
  }
}

// 视频信息网格
.video-info-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 16px;
  margin-bottom: 20px;
  
  .info-card {
    display: flex;
    align-items: center;
    gap: 14px;
    padding: 16px 18px;
    background: $neu-1;
    border-radius: 14px;
    box-shadow: 
      inset 2px 2px 5px $neu-2,
      inset -2px -2px 5px $white;
    transition: all 0.3s ease;
    
    &:hover {
      box-shadow: 
        inset 3px 3px 6px $neu-2,
        inset -3px -3px 6px $white;
    }
    
    .info-icon {
      width: 40px;
      height: 40px;
      border-radius: 10px;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
      box-shadow: 
        3px 3px 6px $neu-2,
        -2px -2px 4px $white;
      
      svg {
        width: 18px;
        height: 18px;
        color: white;
      }
      
      &.file {
        background: linear-gradient(135deg, #6366f1, #8b5cf6);
      }
      
      &.size {
        background: linear-gradient(135deg, #10b981, #34d399);
      }
      
      &.status {
        background: linear-gradient(135deg, #f59e0b, #fbbf24);
      }
      
      &.time {
        background: linear-gradient(135deg, #ec4899, #f472b6);
      }
    }
    
    .info-content {
      flex: 1;
      min-width: 0;
      
      .info-label {
        display: block;
        font-size: 11px;
        color: $gray;
        margin-bottom: 4px;
        text-transform: uppercase;
        letter-spacing: 0.5px;
      }
      
      .info-value {
        font-size: 14px;
        color: $black;
        font-weight: 600;
        display: block;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }
    }
  }
}

// 视频描述
.video-description {
  background: $neu-1;
  border-radius: 14px;
  padding: 18px 20px;
  box-shadow: 
    inset 2px 2px 5px $neu-2,
    inset -2px -2px 5px $white;
  
  .desc-header {
    display: flex;
    align-items: center;
    gap: 12px;
    margin-bottom: 14px;
    padding-bottom: 12px;
    border-bottom: 1px solid rgba($neu-2, 0.5);
    
    .desc-icon {
      width: 36px;
      height: 36px;
      border-radius: 10px;
      background: linear-gradient(135deg, $purple, #7c9df7);
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 
        3px 3px 6px $neu-2,
        -2px -2px 4px $white;
      
      svg {
        width: 18px;
        height: 18px;
        color: white;
      }
    }
    
    .desc-label {
      font-size: 14px;
      font-weight: 600;
      color: $black;
      flex: 1;
    }
  }
  
  .desc-text {
    font-size: 14px;
    color: $gray;
    line-height: 1.7;
    margin: 0;
  }
}

// 模态框动画
.modal-enter-active {
  animation: modal-in 0.35s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.modal-leave-active {
  animation: modal-out 0.2s ease-out;
}

@keyframes modal-in {
  0% {
    opacity: 0;
    transform: scale(0.95) translateY(10px);
  }
  100% {
    opacity: 1;
    transform: scale(1) translateY(0);
  }
}

@keyframes modal-out {
  0% {
    opacity: 1;
  }
  100% {
    opacity: 0;
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
      margin: 0 0 10px 0;
      font-size: 13px;
      color: $gray;
      line-height: 1.6;
      
      strong {
        color: $purple;
      }
    }
    
    .analysis-feature-list {
      margin: 0;
      padding: 0;
      list-style: none;
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 8px;
      
      li {
        font-size: 13px;
        color: $black;
        padding: 6px 0;
      }
    }
  }
}

// 对话框底部按钮
.dialog-footer-buttons {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  width: 100%;
}

</style>
