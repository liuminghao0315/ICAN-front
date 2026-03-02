<template>
  <div class="task-list-page">
    <!-- 顶部操作栏 -->
    <div class="header-actions">
      <h2 class="page-title">分析任务</h2>
    </div>
    
    <!-- 筛选工具栏 -->
    <div class="filter-toolbar">
      <div class="filter-group">
        <div class="filter-label">
          <el-icon><Filter /></el-icon>
          <span>筛选</span>
        </div>
        <div class="filter-chips">
          <div 
            class="filter-chip" 
            :class="{ active: statusFilter === '' }"
            @click="handleStatusFilterChange('')"
          >
            全部
          </div>
          <div 
            class="filter-chip" 
            :class="{ active: statusFilter === 'COMPLETED' }"
            @click="handleStatusFilterChange('COMPLETED')"
          >
            <span class="chip-dot success"></span>
            已完成
          </div>
          <div 
            class="filter-chip" 
            :class="{ active: statusFilter === 'PROCESSING' }"
            @click="handleStatusFilterChange('PROCESSING')"
          >
            <span class="chip-dot warning"></span>
            处理中
          </div>
          <div 
            class="filter-chip" 
            :class="{ active: statusFilter === 'PENDING' }"
            @click="handleStatusFilterChange('PENDING')"
          >
            <span class="chip-dot info"></span>
            排队中
          </div>
          <div 
            class="filter-chip" 
            :class="{ active: statusFilter === 'FAILED' }"
            @click="handleStatusFilterChange('FAILED')"
          >
            <span class="chip-dot danger"></span>
            失败
          </div>
        </div>
      </div>
      
      <div class="filter-divider"></div>
      
      <div class="filter-group">
        <div class="filter-label">
          <el-icon><Warning /></el-icon>
          <span>风险</span>
        </div>
        <div class="filter-chips">
          <div 
            class="filter-chip" 
            :class="{ active: riskFilter === '' }"
            @click="handleRiskFilterChange('')"
          >
            全部
          </div>
          <div 
            class="filter-chip risk-high" 
            :class="{ active: riskFilter === 'HIGH' }"
            @click="handleRiskFilterChange('HIGH')"
          >
            🔴 高风险
          </div>
          <div 
            class="filter-chip risk-medium" 
            :class="{ active: riskFilter === 'MEDIUM' }"
            @click="handleRiskFilterChange('MEDIUM')"
          >
            🟡 中风险
          </div>
          <div 
            class="filter-chip risk-low" 
            :class="{ active: riskFilter === 'LOW' }"
            @click="handleRiskFilterChange('LOW')"
          >
            🟢 低风险
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
              active: sortBy.startsWith('riskScore'),
              'sort-desc': sortBy.startsWith('riskScore') && sortBy.endsWith('_desc'),
              'sort-asc': sortBy.startsWith('riskScore') && sortBy.endsWith('_asc')
            }"
            @click="toggleSort('riskScore')"
            title="点击切换排序方向"
          >
            <el-icon><Warning /></el-icon>
            <span class="sort-label">风险</span>
            <span class="sort-indicator">
              <el-icon v-if="!sortBy.startsWith('riskScore')" class="sort-icon-placeholder"><Sort /></el-icon>
              <el-icon v-else-if="sortBy.endsWith('_desc')" class="sort-icon-desc"><ArrowDown /></el-icon>
              <el-icon v-else class="sort-icon-asc"><ArrowUp /></el-icon>
            </span>
          </button>
          <button 
            class="sort-btn" 
            :class="{ 
              active: sortBy.startsWith('videoDuration'),
              'sort-desc': sortBy.startsWith('videoDuration') && sortBy.endsWith('_desc'),
              'sort-asc': sortBy.startsWith('videoDuration') && sortBy.endsWith('_asc')
            }"
            @click="toggleSort('videoDuration')"
            title="点击切换排序方向"
          >
            <el-icon><Timer /></el-icon>
            <span class="sort-label">时长</span>
            <span class="sort-indicator">
              <el-icon v-if="!sortBy.startsWith('videoDuration')" class="sort-icon-placeholder"><Sort /></el-icon>
              <el-icon v-else-if="sortBy.endsWith('_desc')" class="sort-icon-desc"><ArrowDown /></el-icon>
              <el-icon v-else class="sort-icon-asc"><ArrowUp /></el-icon>
            </span>
          </button>
        </div>
      </div>
      
      <div class="filter-actions">
        <button class="refresh-btn" @click="fetchTasks">
          <el-icon><Refresh /></el-icon>
        </button>
      </div>
    </div>
    
    <!-- 自定义取消确认弹框 -->
    <Transition name="modal-fade">
      <div class="neu-modal-overlay" v-if="showCancelModal" @mousedown.self="onCancelOverlayMouseDown" @mouseup.self="onCancelOverlayMouseUp">
        <div class="neu-modal">
          <div class="neu-modal-icon warning">
            <el-icon :size="28"><Warning /></el-icon>
          </div>
          <div class="neu-modal-body">
            <h3 class="neu-modal-title">确认取消</h3>
            <p class="neu-modal-desc">确定要取消这个分析任务吗？</p>
          </div>
          <div class="neu-modal-actions">
            <button class="neu-btn" @click="showCancelModal = false">再想想</button>
            <button class="neu-btn danger-btn" @click="confirmCancel">确认取消</button>
          </div>
        </div>
      </div>
    </Transition>

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
              <template v-if="task.videoDuration">
                <span class="separator">·</span>
                <span>{{ formatDuration(task.videoDuration) }}</span>
              </template>
            </div>
          </div>
          
          <!-- 分析结果/进度区域 - 统一位置 -->
          <div class="task-result-area">
            <!-- 已完成任务显示分析结果摘要 -->
            <div class="task-result-summary" v-if="task.status === 'COMPLETED' && task.hasResult">
              <div class="risk-badge" :class="getRiskClass(task.riskLevel)">
                <span class="risk-icon">{{ getRiskIcon(task.riskLevel) }}</span>
                <span class="risk-text">{{ getRiskText(task.riskLevel) }}</span>
                <span class="risk-score" v-if="task.riskScore !== null">{{ Math.round((task.riskScore || 0) * 100) }}%</span>
              </div>
              <div class="sentiment-badge" :class="getSentimentClass(task.sentimentLabel)" v-if="task.sentimentLabel">
                {{ getSentimentText(task.sentimentLabel) }}
              </div>
            </div>
            
            <!-- 处理中显示进度条 -->
            <div class="task-progress" v-else-if="task.status === 'PROCESSING'">
              <div class="progress-bar">
                <div class="progress-fill" :style="{ width: task.progress + '%' }"></div>
              </div>
              <span class="progress-text">{{ task.progress }}%</span>
            </div>
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
            去我的视频
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
import { ElMessage } from 'element-plus'
import {
  getTaskList,
  getTaskById,
  cancelTask,
  retryTask
} from '@/api'
import type { AnalysisTaskVO, TaskStatus, TaskType, RiskLevel } from '@/types'
import { useWebSocket } from '@/composables/useWebSocket'

const router = useRouter()

// 模态框关闭逻辑：只有 mousedown 和 mouseup 都在外部才关闭
let cancelOverlayMouseDown = false

const onCancelOverlayMouseDown = () => {
  cancelOverlayMouseDown = true
}

const onCancelOverlayMouseUp = () => {
  if (cancelOverlayMouseDown) {
    showCancelModal.value = false
  }
  cancelOverlayMouseDown = false
}

const loading = ref(false)
const taskList = ref<AnalysisTaskVO[]>([])
const currentPage = ref(1)
const pageSize = ref(10)
const total = ref(0)
const statusFilter = ref<TaskStatus | ''>('')
const riskFilter = ref<string>('')
const sortBy = ref<string>('gmtCreated_desc')

const totalPages = computed(() => Math.ceil(total.value / pageSize.value))

// WebSocket 连接 - 使用订阅模式
const { subscribeProgress, subscribeCompleted, subscribeFailed } = useWebSocket()

// 订阅任务进度更新
subscribeProgress((data) => {
  const task = taskList.value.find(t => t.id === data.taskId)
  if (task) {
    task.status = data.status
    task.progress = data.progress
  }
})

// 订阅任务完成通知
subscribeCompleted(async (data) => {
  const idx = taskList.value.findIndex(t => t.id === data.taskId)
  if (idx === -1) {
    ElMessage.success('分析任务已完成！')
    return
  }

  // 直接从后端拉取完整任务数据，整体替换列表中的对象，确保 Vue 响应式正确触发
  try {
    const response = await getTaskById(data.taskId)
    if (response.code === 200 && response.data) {
      taskList.value[idx] = response.data
    } else {
      // 接口异常时至少更新状态字段
      taskList.value[idx] = {
        ...taskList.value[idx],
        status: 'COMPLETED',
        progress: 100,
        resultId: data.resultId,
        hasResult: true
      }
    }
  } catch {
    taskList.value[idx] = {
      ...taskList.value[idx],
      status: 'COMPLETED',
      progress: 100,
      resultId: data.resultId,
      hasResult: true
    }
  }

  ElMessage.success('分析任务已完成！')
})

// 订阅任务失败通知
subscribeFailed((data) => {
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
    const riskLevel = riskFilter.value || undefined
    const [field, order] = sortBy.value.split('_')
    const response = await getTaskList(
      currentPage.value, 
      pageSize.value, 
      status as TaskStatus | undefined,
      riskLevel as RiskLevel | undefined,
      field, 
      order
    )
    if (response.code === 200) {
      taskList.value = response.data.records
      total.value = response.data.total
    }
  } catch (error) {
    // 错误已在axios拦截器中处理并显示Toast
  } finally {
    loading.value = false
  }
}

// 处理状态筛选切换
const handleStatusFilterChange = (status: TaskStatus | '') => {
  statusFilter.value = status
  currentPage.value = 1 // 重置到第一页
  fetchTasks()
}

// 处理风险筛选切换
const handleRiskFilterChange = (risk: string) => {
  riskFilter.value = risk
  currentPage.value = 1 // 重置到第一页
  fetchTasks()
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
    router.push(`/analysis/${task.resultId}`)
  }
}

// 取消任务
const showCancelModal = ref(false)
const pendingCancelTask = ref<AnalysisTaskVO | null>(null)

const handleCancel = (task: AnalysisTaskVO) => {
  pendingCancelTask.value = task
  showCancelModal.value = true
}

const confirmCancel = async () => {
  if (!pendingCancelTask.value) return
  showCancelModal.value = false
  const task = pendingCancelTask.value
  pendingCancelTask.value = null
  try {
    const response = await cancelTask(task.id)
    if (response.code === 200) {
      ElMessage.success('任务已取消')
      task.status = 'CANCELLED'
    } else {
      ElMessage.error(response.message || '取消失败')
    }
  } catch {
    // 静默处理
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

// 风险等级相关
const getRiskClass = (level: string | null | undefined) => {
  if (!level) return 'unknown'
  const classes: Record<string, string> = {
    'HIGH': 'high',
    'MEDIUM': 'medium',
    'LOW': 'low'
  }
  return classes[level] || 'unknown'
}

const getRiskIcon = (level: string | null | undefined) => {
  if (!level) return '❓'
  const icons: Record<string, string> = {
    'HIGH': '🔴',
    'MEDIUM': '🟡',
    'LOW': '🟢'
  }
  return icons[level] || '❓'
}

const getRiskText = (level: string | null | undefined) => {
  if (!level) return '未知'
  const texts: Record<string, string> = {
    'HIGH': '高风险',
    'MEDIUM': '中风险',
    'LOW': '低风险'
  }
  return texts[level] || '未知'
}

// 情感相关
const getSentimentClass = (label: string | null | undefined) => {
  if (!label) return 'neutral'
  const classes: Record<string, string> = {
    'POSITIVE': 'positive',
    'NEUTRAL': 'neutral',
    'NEGATIVE': 'negative'
  }
  return classes[label] || 'neutral'
}

const getSentimentText = (label: string | null | undefined) => {
  if (!label) return '中性'
  const texts: Record<string, string> = {
    'POSITIVE': '😊 积极',
    'NEUTRAL': '😐 中性',
    'NEGATIVE': '😞 消极'
  }
  return texts[label] || '中性'
}

// 格式化时长
const formatDuration = (seconds: number | null | undefined) => {
  if (!seconds) return '0:00'
  const mins = Math.floor(seconds / 60)
  const secs = Math.floor(seconds % 60)
  return `${mins}:${secs.toString().padStart(2, '0')}`
}

// 切换排序 - 同时重新从后端获取数据
const toggleSort = (field: string) => {
  const currentField = sortBy.value.split('_')[0]
  const currentOrder = sortBy.value.split('_')[1]
  
  if (currentField === field) {
    // 同一字段，切换升降序
    sortBy.value = `${field}_${currentOrder === 'desc' ? 'asc' : 'desc'}`
  } else {
    // 不同字段，默认降序
    sortBy.value = `${field}_desc`
  }
  
  // 重置到第一页并重新获取数据
  currentPage.value = 1
  fetchTasks()
}

onMounted(() => {
  fetchTasks()
})
</script>

<style scoped lang="scss">
// 扁平化配色变量
$bg: #F5F7FA;
$neu-1: #F5F7FA;
$neu-2: #DCDFE6;
$white: #FFFFFF;
$gray: #909399;
$black: #303133;
$purple: #409EFF;

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
  }

  // 美化的筛选工具栏
  .filter-toolbar {
    display: flex;
    align-items: center;
    gap: 20px;
    padding: 16px 24px;
    margin-bottom: 20px;
    background: $white;
    border: 1px solid #EBEEF5;
    border-radius: 12px;
    box-shadow: none;
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
        border-radius: 8px;
        font-size: 12px;
        font-weight: 500;
        cursor: pointer;
        transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
        background: $white;
        color: $gray;
        border: 1px solid #DCDFE6;
        box-shadow: none;
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
          border-color: $purple;
        }

        &.active {
          background: $purple;
          border-color: $purple;
          color: white !important;

          .chip-dot {
            background: white;
          }
        }

        &.risk-high.active {
          background: #f56c6c;
          border-color: #f56c6c;
        }

        &.risk-medium.active {
          background: #e6a23c;
          border-color: #e6a23c;
        }

        &.risk-low.active {
          background: #67c23a;
          border-color: #67c23a;
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
          border: 1px solid #DCDFE6;
          border-radius: 8px;
          font-size: 13px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          background: $white;
          color: $gray;
          box-shadow: none;
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
            background: $purple;
            color: white !important;
            border-color: $purple;

            .el-icon {
              color: white !important;
            }

            .sort-indicator {
              background: rgba(255, 255, 255, 0.25);

              .el-icon {
                color: white !important;
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
      background: #EBEEF5;
    }

    .filter-actions {
      margin-left: auto;

      .refresh-btn {
        display: flex;
        align-items: center;
        justify-content: center;
        width: 40px;
        height: 40px;
        border: 1px solid #DCDFE6;
        border-radius: 8px;
        cursor: pointer;
        transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
        background: $white;
        color: $gray;
        box-shadow: none;

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
  box-shadow: none;
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

// 扁平化按钮
.neu-btn {
  background: $white;
  border: 1px solid #DCDFE6;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.25s;
  box-shadow: none;
  color: $gray;
  font-family: 'Montserrat', sans-serif;
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 10px 18px;
  font-size: 13px;

  &:hover {
    border-color: $purple;
    color: $purple;
  }

  &:active {
    transform: translateY(1px);
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
    background: $purple;
    border-color: $purple;
    color: #fff !important;

    &:hover {
      background: #66b1ff;
      border-color: #66b1ff;
      color: #fff !important;
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
    border-radius: 12px;
    transition: all 0.3s;
    margin-bottom: 12px;
    background: $white;
    border: 1px solid #EBEEF5;
    box-shadow: none;

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
    
    .task-result-area {
      min-width: 200px;
      display: flex;
      align-items: center;
      justify-content: flex-end;
      flex-shrink: 0;
    }
    
    .task-result-summary {
      display: flex;
      align-items: center;
      gap: 8px;
      
      .risk-badge {
        display: flex;
        align-items: center;
        gap: 4px;
        padding: 4px 10px;
        border-radius: 16px;
        font-size: 12px;
        font-weight: 500;
        
        &.high {
          background: rgba(#f56c6c, 0.15);
          color: #f56c6c;
        }
        
        &.medium {
          background: rgba(#e6a23c, 0.15);
          color: #e6a23c;
        }
        
        &.low {
          background: rgba(#67c23a, 0.15);
          color: #67c23a;
        }
        
        &.unknown {
          background: rgba($gray, 0.15);
          color: $gray;
        }
        
        .risk-icon {
          font-size: 10px;
        }
        
        .risk-score {
          font-weight: 600;
          margin-left: 2px;
        }
      }
      
      .sentiment-badge {
        padding: 4px 8px;
        border-radius: 12px;
        font-size: 11px;
        
        &.positive {
          background: rgba(#67c23a, 0.1);
          color: #67c23a;
        }
        
        &.neutral {
          background: rgba($gray, 0.1);
          color: $gray;
        }
        
        &.negative {
          background: rgba(#f56c6c, 0.1);
          color: #f56c6c;
        }
      }
    }
    
    .task-progress {
      width: 100%;
      max-width: 180px;
      display: flex;
      align-items: center;
      gap: 10px;
      
      .progress-bar {
        flex: 1;
        height: 8px;
        background: $neu-1;
        border-radius: 4px;
        box-shadow: none;
        overflow: hidden;
        
        .progress-fill {
          height: 100%;
          background: #e6a23c;
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

// 自定义新拟态弹框
.neu-modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.25);
  backdrop-filter: blur(4px);
  -webkit-backdrop-filter: blur(4px);
  z-index: 2000;
  display: flex;
  align-items: center;
  justify-content: center;
}

.neu-modal {
  background: $neu-1;
  border-radius: 20px;
  padding: 32px 28px 24px;
  width: 320px;
  box-shadow:
    12px 12px 24px rgba(163, 177, 198, 0.5),
    -12px -12px 24px rgba(255, 255, 255, 0.95);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;

  .neu-modal-icon {
    width: 60px;
    height: 60px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    box-shadow:
      4px 4px 10px rgba(163, 177, 198, 0.4),
      -4px -4px 10px rgba(255, 255, 255, 0.9);

    &.warning {
      background: rgba(#e6a23c, 0.12);
      color: #e6a23c;
    }
  }

  .neu-modal-body {
    text-align: center;

    .neu-modal-title {
      font-size: 17px;
      font-weight: 700;
      color: $black;
      margin: 0 0 8px;
    }

    .neu-modal-desc {
      font-size: 14px;
      color: $gray;
      margin: 0;
      line-height: 1.6;
    }
  }

  .neu-modal-actions {
    display: flex;
    gap: 12px;
    width: 100%;
    margin-top: 4px;

    .neu-btn {
      flex: 1;
      justify-content: center;
      padding: 10px 0;
      font-size: 14px;
      font-weight: 500;
    }

    .danger-btn {
      background: #e6a23c;
      color: #fff !important;
      border-color: #e6a23c;
      box-shadow: none;

      &:hover {
        background: #ebb563;
        border-color: #ebb563;
        color: #fff !important;
      }
    }
  }
}

// 弹框过渡动画
.modal-fade-enter-active,
.modal-fade-leave-active {
  transition: opacity 0.2s ease;

  .neu-modal {
    transition: transform 0.2s cubic-bezier(0.34, 1.56, 0.64, 1), opacity 0.2s ease;
  }
}

.modal-fade-enter-from,
.modal-fade-leave-to {
  opacity: 0;

  .neu-modal {
    transform: scale(0.88);
    opacity: 0;
  }
}
</style>

