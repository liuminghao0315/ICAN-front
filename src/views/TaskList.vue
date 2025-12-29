<template>
  <div class="task-list-page">
    <!-- 顶部操作栏 -->
    <div class="header-actions">
      <h2 class="page-title">分析任务</h2>
      <div class="header-btns">
        <el-select v-model="statusFilter" placeholder="全部状态" clearable class="status-filter" @change="fetchTasks">
          <el-option value="PENDING" label="排队中" />
          <el-option value="PROCESSING" label="处理中" />
          <el-option value="COMPLETED" label="已完成" />
          <el-option value="FAILED" label="失败" />
          <el-option value="CANCELLED" label="已取消" />
        </el-select>
        <button class="neu-btn icon-btn" @click="fetchTasks">
          <el-icon><Refresh /></el-icon>
        </button>
      </div>
    </div>
    
    <!-- 任务列表 -->
    <div class="neu-card">
      <div class="card-header">
        <span class="card-title">任务列表 <span class="count">共 {{ total }} 条</span></span>
      </div>
      
      <div class="task-list" v-loading="loading">
        <div 
          class="task-item" 
          v-for="task in taskList" 
          :key="task.id"
        >
          <div class="task-icon" :class="getStatusClass(task.status)">
            <el-icon :size="24">
              <Loading v-if="task.status === 'PROCESSING'" class="rotating" />
              <Clock v-else-if="task.status === 'PENDING'" />
              <CircleCheck v-else-if="task.status === 'COMPLETED'" />
              <CircleClose v-else-if="task.status === 'FAILED'" />
              <Remove v-else />
            </el-icon>
          </div>
          
          <div class="task-info">
            <div class="task-title">{{ task.videoTitle }}</div>
            <div class="task-meta">
              <span class="task-type">{{ getTaskTypeText(task.taskType) }}</span>
              <span class="separator">·</span>
              <span>{{ formatDate(task.gmtCreated) }}</span>
            </div>
          </div>
          
          <div class="task-progress" v-if="task.status === 'PROCESSING'">
            <div class="progress-bar">
              <div class="progress-fill" :style="{ width: task.progress + '%' }"></div>
            </div>
            <span class="progress-text">{{ task.progress }}%</span>
          </div>
          
          <div class="task-status">
            <span class="status-tag" :class="getStatusClass(task.status)">
              {{ getStatusText(task.status) }}
            </span>
          </div>
          
          <div class="task-actions">
            <button 
              class="neu-btn icon-btn small primary" 
              v-if="task.status === 'COMPLETED' && task.resultId"
              @click="viewResult(task)"
              title="查看结果"
            >
              <el-icon><Document /></el-icon>
            </button>
            <button 
              class="neu-btn icon-btn small warning" 
              v-if="task.status === 'PENDING' || task.status === 'PROCESSING'"
              @click="handleCancel(task)"
              title="取消任务"
            >
              <el-icon><VideoPause /></el-icon>
            </button>
            <button 
              class="neu-btn icon-btn small success" 
              v-if="task.status === 'FAILED' || task.status === 'CANCELLED'"
              @click="handleRetry(task)"
              title="重试任务"
            >
              <el-icon><RefreshRight /></el-icon>
            </button>
          </div>
        </div>
        
        <!-- 空状态 -->
        <div v-if="!loading && taskList.length === 0" class="empty-state">
          <el-icon :size="64"><TrendCharts /></el-icon>
          <p>暂无分析任务</p>
          <button class="neu-btn primary-btn" @click="router.push('/videos')">
            去选择视频
          </button>
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
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { 
  getTaskList, 
  cancelTask, 
  retryTask
} from '@/api'
import type { AnalysisTaskVO, TaskStatus, TaskType } from '@/types'
import { useWebSocket } from '@/composables/useWebSocket'

const router = useRouter()

const loading = ref(false)
const taskList = ref<AnalysisTaskVO[]>([])
const currentPage = ref(1)
const pageSize = ref(10)
const total = ref(0)
const statusFilter = ref<TaskStatus | ''>('')

const totalPages = computed(() => Math.ceil(total.value / pageSize.value))

// WebSocket 连接 - 使用订阅模式
const { subscribeProgress, subscribeCompleted, subscribeFailed } = useWebSocket()

// 订阅任务进度更新
subscribeProgress((data) => {
  console.log('TaskList: 任务进度更新:', data)
  const task = taskList.value.find(t => t.id === data.taskId)
  if (task) {
    task.status = data.status
    task.progress = data.progress
  }
})

// 订阅任务完成通知
subscribeCompleted((data) => {
  console.log('TaskList: 任务完成:', data)
  const task = taskList.value.find(t => t.id === data.taskId)
  if (task) {
    task.status = 'COMPLETED'
    task.progress = 100
    task.resultId = data.resultId
    task.hasResult = true
  }
  ElMessage.success('分析任务已完成！')
})

// 订阅任务失败通知
subscribeFailed((data) => {
  console.log('TaskList: 任务失败:', data)
  const task = taskList.value.find(t => t.id === data.taskId)
  if (task) {
    task.status = 'FAILED'
    task.errorMessage = data.errorMessage
  }
  ElMessage.error(`分析任务失败：${data.errorMessage}`)
})

// 获取任务列表
const fetchTasks = async () => {
  loading.value = true
  try {
    const status = statusFilter.value || undefined
    const response = await getTaskList(currentPage.value, pageSize.value, status as TaskStatus | undefined)
    if (response.code === 200) {
      taskList.value = response.data.records
      total.value = response.data.total
    }
  } catch (error) {
    console.error('获取任务列表失败:', error)
    ElMessage.error('获取任务列表失败')
  } finally {
    loading.value = false
  }
}

// 切换页码
const changePage = (page: number) => {
  if (page < 1 || page > totalPages.value) return
  currentPage.value = page
  fetchTasks()
}

// 查看结果
const viewResult = (task: AnalysisTaskVO) => {
  if (task.resultId) {
    router.push({ path: '/analysis', query: { resultId: task.resultId } })
  }
}

// 取消任务
const handleCancel = async (task: AnalysisTaskVO) => {
  try {
    await ElMessageBox.confirm(
      '确定要取消这个分析任务吗？',
      '确认取消',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )
    
    const response = await cancelTask(task.id)
    if (response.code === 200) {
      ElMessage.success('任务已取消')
      task.status = 'CANCELLED'
    } else {
      ElMessage.error(response.message || '取消失败')
    }
  } catch {
    // 用户取消
  }
}

// 重试任务
const handleRetry = async (task: AnalysisTaskVO) => {
  try {
    const response = await retryTask(task.id)
    if (response.code === 200) {
      ElMessage.success('任务已重新创建')
      fetchTasks()
    } else {
      ElMessage.error(response.message || '重试失败')
    }
  } catch (error: any) {
    ElMessage.error(error.response?.data?.message || '重试失败')
  }
}

// 格式化日期
const formatDate = (dateStr: string): string => {
  return new Date(dateStr).toLocaleString('zh-CN')
}

// 获取状态类名
const getStatusClass = (status: TaskStatus) => {
  const classes: Record<TaskStatus, string> = {
    'PENDING': 'pending',
    'PROCESSING': 'processing',
    'COMPLETED': 'completed',
    'FAILED': 'failed',
    'CANCELLED': 'cancelled'
  }
  return classes[status] || 'pending'
}

// 获取状态文本
const getStatusText = (status: TaskStatus) => {
  const texts: Record<TaskStatus, string> = {
    'PENDING': '排队中',
    'PROCESSING': '处理中',
    'COMPLETED': '已完成',
    'FAILED': '失败',
    'CANCELLED': '已取消'
  }
  return texts[status] || status
}

// 获取任务类型文本
const getTaskTypeText = (type: TaskType) => {
  const texts: Record<TaskType, string> = {
    'FULL_ANALYSIS': '完整分析',
    'VIDEO_ONLY': '视频分析',
    'AUDIO_ONLY': '音频分析',
    'TEXT_ONLY': '文本分析'
  }
  return texts[type] || type
}

onMounted(() => {
  fetchTasks()
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

.task-list-page {
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
      align-items: center;
      
      .status-filter {
        width: 140px;
        
        :deep(.el-input__wrapper) {
          background: $neu-1;
          box-shadow: inset 2px 2px 4px $neu-2, inset -2px -2px 4px $white;
          border: none;
          border-radius: 10px;
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

// 任务列表
.task-list {
  padding: 16px;
  
  .task-item {
    display: flex;
    align-items: center;
    gap: 16px;
    padding: 18px 20px;
    border-radius: 16px;
    transition: all 0.3s;
    margin-bottom: 12px;
    background: $neu-1;
    box-shadow: 4px 4px 10px $neu-2, -4px -4px 10px $white;
    
    &:last-child {
      margin-bottom: 0;
    }
    
    .task-icon {
      width: 52px;
      height: 52px;
      border-radius: 14px;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
      
      &.pending {
        background: rgba($gray, 0.12);
        color: $gray;
      }
      
      &.processing {
        background: rgba(230, 162, 60, 0.12);
        color: #e6a23c;
      }
      
      &.completed {
        background: rgba(82, 196, 26, 0.12);
        color: #52c41a;
      }
      
      &.failed {
        background: rgba(245, 108, 108, 0.12);
        color: #f56c6c;
      }
      
      &.cancelled {
        background: rgba($gray, 0.12);
        color: $gray;
      }
    }
    
    .task-info {
      flex: 1;
      min-width: 0;
      
      .task-title {
        font-size: 15px;
        font-weight: 600;
        color: $black;
        margin-bottom: 6px;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }
      
      .task-meta {
        font-size: 12px;
        color: $gray;
        display: flex;
        align-items: center;
        gap: 6px;
        
        .task-type {
          padding: 2px 8px;
          background: rgba($purple, 0.1);
          color: $purple;
          border-radius: 4px;
          font-size: 11px;
        }
        
        .separator {
          color: $neu-2;
        }
      }
    }
    
    .task-progress {
      width: 150px;
      display: flex;
      align-items: center;
      gap: 10px;
      flex-shrink: 0;
      
      .progress-bar {
        flex: 1;
        height: 8px;
        background: $neu-1;
        border-radius: 4px;
        box-shadow: inset 2px 2px 4px $neu-2, inset -2px -2px 4px $white;
        overflow: hidden;
        
        .progress-fill {
          height: 100%;
          background: linear-gradient(135deg, #e6a23c 0%, #f5a55c 100%);
          border-radius: 4px;
          transition: width 0.3s;
        }
      }
      
      .progress-text {
        font-size: 12px;
        color: #e6a23c;
        font-weight: 600;
        width: 40px;
        text-align: right;
      }
    }
    
    .task-status {
      flex-shrink: 0;
      width: 80px;
    }
    
    .task-actions {
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
    background: rgba(82, 196, 26, 0.12);
    color: #52c41a;
  }
  
  &.failed {
    background: rgba(245, 108, 108, 0.12);
    color: #f56c6c;
  }
  
  &.cancelled {
    background: rgba($gray, 0.12);
    color: $gray;
  }
}

// 旋转动画
.rotating {
  animation: rotate 1s linear infinite;
}

@keyframes rotate {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
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
</style>

