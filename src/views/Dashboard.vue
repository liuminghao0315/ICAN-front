<template>
  <div class="dashboard">
    <!-- 顶部欢迎横幅 -->
    <div class="welcome-banner">
      <div class="banner-left">
        <div class="user-avatar">
          {{ (userStore.userInfo?.username || '用户').charAt(0).toUpperCase() }}
        </div>
        <div class="welcome-text">
          <h2>您好，{{ userStore.userInfo?.username || '用户' }}</h2>
          <p>甄视频工作台已为您服务 <strong>{{ stats.totalVideos }}</strong> 次</p>
        </div>
      </div>
      
      <div class="banner-stats">
        <div class="stat-item">
          <div class="stat-icon warning">
            <el-icon><Warning /></el-icon>
          </div>
          <div class="stat-content">
            <div class="stat-label">风险预警数</div>
            <div class="stat-value warning">{{ stats.riskCount }}</div>
          </div>
        </div>
        
        <div class="stat-item">
          <div class="stat-icon success">
            <el-icon><TrendCharts /></el-icon>
          </div>
          <div class="stat-content">
            <div class="stat-label">已分析数量</div>
            <div class="stat-value success">{{ stats.analyzedCount }}</div>
          </div>
        </div>
        
        <div class="stat-item">
          <div class="stat-icon primary">
            <el-icon><VideoPlay /></el-icon>
          </div>
          <div class="stat-content">
            <div class="stat-label">视频总数</div>
            <div class="stat-value">{{ stats.totalVideos }}</div>
          </div>
        </div>
      </div>
      
      <div class="banner-charts">
        <div class="mini-chart-item">
          <div class="chart-ring" :style="{ '--progress': completionRate }">
            <span class="chart-value">{{ completionRate }}%</span>
          </div>
          <span class="chart-label">完成率</span>
        </div>
        <div class="mini-chart-item">
          <div class="chart-ring analysis" :style="{ '--progress': analysisRate }">
            <span class="chart-value">{{ analysisRate }}%</span>
          </div>
          <span class="chart-label">分析中</span>
        </div>
        <div class="mini-chart-item">
          <div class="chart-ring pending" :style="{ '--progress': pendingRate }">
            <span class="chart-value">{{ pendingRate }}%</span>
          </div>
          <span class="chart-label">待处理</span>
        </div>
      </div>
    </div>
    
    <!-- 主内容区 -->
    <div class="main-content-grid">
      <!-- 左侧统计卡片 -->
      <div class="left-section">
        <div class="neu-card">
          <div class="card-header">
            <span class="card-title">视频状态分布</span>
            <button class="neu-btn icon-btn" @click="fetchData">
              <el-icon><Refresh /></el-icon>
            </button>
          </div>
          <v-chart :option="statusChartOption" class="chart" />
        </div>
        
        <!-- 快捷操作 -->
        <div class="neu-card quick-actions">
          <div class="card-header">
            <span class="card-title">快捷操作</span>
          </div>
          <div class="action-buttons">
            <button class="action-btn primary" @click="router.push('/upload')">
              <el-icon><Upload /></el-icon>
              <span>上传视频</span>
            </button>
            <button class="action-btn" @click="router.push('/videos')">
              <el-icon><VideoPlay /></el-icon>
              <span>视频列表</span>
            </button>
            <button class="action-btn" @click="router.push('/analysis')">
              <el-icon><DataAnalysis /></el-icon>
              <span>分析报告</span>
            </button>
          </div>
        </div>
      </div>
      
      <!-- 中间视频列表 -->
      <div class="center-section">
        <div class="neu-card">
          <div class="card-header">
            <span class="card-title">最近上传 <span class="count">{{ recentVideos.length }} 条</span></span>
            <button class="neu-btn text-btn" @click="router.push('/videos')">查看全部</button>
          </div>
          
          <div class="video-list" v-loading="loading">
            <div 
              class="video-item" 
              v-for="video in recentVideos" 
              :key="video.id"
              @click="router.push('/videos')"
            >
              <div class="video-icon">
                <el-icon><VideoPlay /></el-icon>
              </div>
              <div class="video-info">
                <div class="video-title">{{ video.title }}</div>
                <div class="video-meta">
                  {{ formatFileSize(video.fileSize) }} · {{ formatDate(video.gmtCreated) }}
                </div>
              </div>
              <div class="video-status">
                <span class="status-tag" :class="getStatusClass(video.status)">
                  {{ getStatusText(video.status) }}
                </span>
              </div>
            </div>
            
            <div v-if="!loading && recentVideos.length === 0" class="empty-state">
              <el-icon :size="48"><VideoPlay /></el-icon>
              <p>暂无视频</p>
              <button class="neu-btn primary-btn" @click="router.push('/upload')">上传视频</button>
            </div>
          </div>
        </div>
      </div>
      
      <!-- 右侧趋势图 -->
      <div class="right-section">
        <div class="neu-card">
          <div class="card-header">
            <span class="card-title">上传趋势</span>
          </div>
          <v-chart :option="trendChartOption" class="chart" />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { use } from 'echarts/core'
import { CanvasRenderer } from 'echarts/renderers'
import { PieChart, LineChart } from 'echarts/charts'
import {
  TitleComponent,
  TooltipComponent,
  LegendComponent,
  GridComponent
} from 'echarts/components'
import VChart from 'vue-echarts'
import {
  VideoPlay,
  TrendCharts,
  Warning,
  Upload,
  DataAnalysis,
  Refresh
} from '@element-plus/icons-vue'
import { getVideoList, getUploadTrend, type VideoInfo, type UploadTrendItem } from '@/api'
import { useUserStore } from '@/stores/user'

// 注册ECharts组件
use([
  CanvasRenderer,
  PieChart,
  LineChart,
  TitleComponent,
  TooltipComponent,
  LegendComponent,
  GridComponent
])

const router = useRouter()
const userStore = useUserStore()

const loading = ref(false)
const recentVideos = ref<VideoInfo[]>([])
const allVideos = ref<VideoInfo[]>([])
const uploadTrendData = ref<UploadTrendItem[]>([])

const stats = ref({
  totalVideos: 0,
  analyzedCount: 0,
  pendingCount: 0,
  riskCount: 0
})

// 计算属性
const completionRate = computed(() => {
  if (stats.value.totalVideos === 0) return 0
  return Math.round((stats.value.analyzedCount / stats.value.totalVideos) * 100)
})

const analysisRate = computed(() => {
  if (stats.value.totalVideos === 0) return 0
  const analyzing = allVideos.value.filter(v => v.status === 'ANALYZING').length
  return Math.round((analyzing / stats.value.totalVideos) * 100)
})

const pendingRate = computed(() => {
  if (stats.value.totalVideos === 0) return 0
  return Math.round((stats.value.pendingCount / stats.value.totalVideos) * 100)
})

const fetchData = async () => {
  loading.value = true
  try {
    const response = await getVideoList(1, 5)
    if (response.code === 200) {
      recentVideos.value = response.data.records
      stats.value.totalVideos = response.data.total
    }
    
    const allResponse = await getVideoList(1, 100)
    if (allResponse.code === 200) {
      allVideos.value = allResponse.data.records
      stats.value.analyzedCount = allVideos.value.filter(v => v.status === 'COMPLETED').length
      stats.value.pendingCount = allVideos.value.filter(v => v.status === 'UPLOADED' || v.status === 'ANALYZING').length
      stats.value.riskCount = 0
    }
    
    try {
      const trendResponse = await getUploadTrend(7)
      if (trendResponse.code === 200) {
        uploadTrendData.value = trendResponse.data
      }
    } catch (e) {
      console.warn('获取上传趋势失败:', e)
      uploadTrendData.value = []
    }
  } catch (error) {
    console.error('获取数据失败:', error)
  } finally {
    loading.value = false
  }
}

const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

const formatDate = (dateStr: string): string => {
  const date = new Date(dateStr)
  return `${date.getMonth() + 1}/${date.getDate()} ${date.getHours()}:${String(date.getMinutes()).padStart(2, '0')}`
}

const getStatusText = (status: string) => {
  const texts: Record<string, string> = {
    'UPLOADED': '待分析',
    'ANALYZING': '分析中',
    'COMPLETED': '已完成',
    'FAILED': '失败'
  }
  return texts[status] || status
}

const getStatusClass = (status: string) => {
  const classes: Record<string, string> = {
    'UPLOADED': 'pending',
    'ANALYZING': 'processing',
    'COMPLETED': 'completed',
    'FAILED': 'failed'
  }
  return classes[status] || 'pending'
}

// 状态分布饼图
const statusChartOption = computed(() => {
  const data = [
    { value: stats.value.analyzedCount, name: '已完成', itemStyle: { color: '#4b70e2' } },
    { value: stats.value.pendingCount, name: '待处理', itemStyle: { color: '#e6a23c' } },
    { value: stats.value.riskCount, name: '风险预警', itemStyle: { color: '#f56c6c' } }
  ]
  
  return {
    tooltip: {
      trigger: 'item',
      formatter: '{b}: {c} ({d}%)'
    },
    legend: {
      bottom: '5%',
      left: 'center',
      textStyle: { color: '#a0a5a8' }
    },
    series: [
      {
        type: 'pie',
        radius: ['45%', '70%'],
        avoidLabelOverlap: false,
        itemStyle: {
          borderRadius: 8,
          borderColor: '#ecf0f3',
          borderWidth: 3
        },
        label: {
          show: true,
          formatter: '{b}\n{d}%',
          color: '#181818'
        },
        emphasis: {
          label: {
            show: true,
            fontSize: 14,
            fontWeight: 'bold'
          }
        },
        data: data
      }
    ]
  }
})

// 上传趋势折线图
const trendChartOption = computed(() => {
  const dates = uploadTrendData.value.map(item => item.displayDate)
  const values = uploadTrendData.value.map(item => item.count)
  
  if (dates.length === 0) {
    const today = new Date()
    for (let i = 6; i >= 0; i--) {
      const date = new Date(today)
      date.setDate(date.getDate() - i)
      dates.push(`${date.getMonth() + 1}/${date.getDate()}`)
      values.push(0)
    }
  }
  
  return {
    tooltip: {
      trigger: 'axis'
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
      boundaryGap: false,
      data: dates,
      axisLine: { lineStyle: { color: '#d1d9e6' } },
      axisLabel: { color: '#a0a5a8', fontSize: 11 }
    },
    yAxis: {
      type: 'value',
      axisLine: { show: false },
      splitLine: { lineStyle: { color: '#e8edf3' } },
      axisLabel: { color: '#a0a5a8', fontSize: 11 }
    },
    series: [
      {
        name: '上传数量',
        type: 'line',
        smooth: true,
        symbol: 'circle',
        symbolSize: 8,
        areaStyle: {
          color: {
            type: 'linear',
            x: 0, y: 0, x2: 0, y2: 1,
            colorStops: [
              { offset: 0, color: 'rgba(75, 112, 226, 0.25)' },
              { offset: 1, color: 'rgba(75, 112, 226, 0.02)' }
            ]
          }
        },
        lineStyle: {
          color: '#4b70e2',
          width: 3
        },
        itemStyle: {
          color: '#4b70e2',
          borderColor: '#ecf0f3',
          borderWidth: 3
        },
        data: values
      }
    ]
  }
})

onMounted(() => {
  fetchData()
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

.dashboard {
  min-height: 100%;
}

// 欢迎横幅
.welcome-banner {
  background: linear-gradient(135deg, #e8f4fd 0%, $neu-1 100%);
  border-radius: 20px;
  padding: 28px 36px;
  margin-bottom: 24px;
  display: flex;
  align-items: center;
  gap: 40px;
  box-shadow: 8px 8px 16px $neu-2, -8px -8px 16px $white;
  
  .banner-left {
    display: flex;
    align-items: center;
    gap: 16px;
    flex-shrink: 0;
    
    .user-avatar {
      width: 60px;
      height: 60px;
      border-radius: 50%;
      background: linear-gradient(135deg, $purple 0%, #7c9df7 100%);
      color: #fff;
      font-size: 26px;
      font-weight: 700;
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 4px 4px 10px $neu-2, -4px -4px 10px $white;
    }
    
    .welcome-text {
      h2 {
        font-size: 22px;
        font-weight: 700;
        color: $black;
        margin: 0 0 6px 0;
      }
      
      p {
        font-size: 13px;
        color: $gray;
        margin: 0;
        
        strong {
          color: $purple;
          font-weight: 600;
        }
      }
    }
  }
  
  .banner-stats {
    display: flex;
    gap: 36px;
    flex: 1;
    justify-content: center;
    
    .stat-item {
      display: flex;
      align-items: center;
      gap: 14px;
      padding: 0 24px;
      border-right: 1px solid rgba($neu-2, 0.6);
      
      &:last-child {
        border-right: none;
      }
      
      .stat-icon {
        width: 44px;
        height: 44px;
        border-radius: 12px;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 20px;
        box-shadow: inset 2px 2px 4px $neu-2, inset -2px -2px 4px $white;
        
        &.warning {
          background: rgba(250, 173, 20, 0.12);
          color: #faad14;
        }
        
        &.success {
          background: rgba(82, 196, 26, 0.12);
          color: #52c41a;
        }
        
        &.primary {
          background: rgba(75, 112, 226, 0.12);
          color: $purple;
        }
      }
      
      .stat-content {
        .stat-label {
          font-size: 12px;
          color: $gray;
          margin-bottom: 4px;
        }
        
        .stat-value {
          font-size: 28px;
          font-weight: 700;
          color: $black;
          line-height: 1;
          
          &.warning { color: #faad14; }
          &.success { color: #52c41a; }
        }
      }
    }
  }
  
  .banner-charts {
    display: flex;
    gap: 24px;
    flex-shrink: 0;
    
    .mini-chart-item {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 8px;
      
      .chart-ring {
        width: 64px;
        height: 64px;
        border-radius: 50%;
        background: conic-gradient(
          $purple 0deg,
          $purple calc(var(--progress) * 3.6deg),
          $neu-1 calc(var(--progress) * 3.6deg),
          $neu-1 360deg
        );
        display: flex;
        align-items: center;
        justify-content: center;
        position: relative;
        box-shadow: 4px 4px 8px $neu-2, -4px -4px 8px $white;
        
        &.analysis {
          background: conic-gradient(
            #e6a23c 0deg,
            #e6a23c calc(var(--progress) * 3.6deg),
            $neu-1 calc(var(--progress) * 3.6deg),
            $neu-1 360deg
          );
        }
        
        &.pending {
          background: conic-gradient(
            #909399 0deg,
            #909399 calc(var(--progress) * 3.6deg),
            $neu-1 calc(var(--progress) * 3.6deg),
            $neu-1 360deg
          );
        }
        
        &::before {
          content: '';
          position: absolute;
          width: 48px;
          height: 48px;
          background: $neu-1;
          border-radius: 50%;
          box-shadow: inset 2px 2px 4px $neu-2, inset -2px -2px 4px $white;
        }
        
        .chart-value {
          position: relative;
          z-index: 1;
          font-size: 11px;
          font-weight: 700;
          color: $black;
        }
      }
      
      .chart-label {
        font-size: 11px;
        color: $gray;
      }
    }
  }
}

// 主内容网格
.main-content-grid {
  display: grid;
  grid-template-columns: 1fr 1.5fr 1fr;
  gap: 24px;
  
  @media (max-width: 1400px) {
    grid-template-columns: 1fr 1.2fr 1fr;
  }
  
  @media (max-width: 1100px) {
    grid-template-columns: 1fr;
  }
}

// 新拟态卡片
.neu-card {
  background: $neu-1;
  border-radius: 20px;
  box-shadow: 8px 8px 16px $neu-2, -8px -8px 16px $white;
  overflow: hidden;
  margin-bottom: 24px;
  
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
  
  .chart {
    height: 260px;
    width: 100%;
    padding: 16px;
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
  
  &:hover {
    box-shadow: 2px 2px 4px $neu-2, -2px -2px 4px $white;
    color: $purple;
  }
  
  &:active {
    box-shadow: inset 2px 2px 4px $neu-2, inset -2px -2px 4px $white;
  }
  
  &.icon-btn {
    width: 36px;
    height: 36px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 16px;
  }
  
  &.text-btn {
    padding: 8px 16px;
    font-size: 12px;
  }
  
  &.primary-btn {
    background: linear-gradient(135deg, $purple 0%, #7c9df7 100%);
    color: #fff;
    padding: 10px 24px;
    font-size: 13px;
    font-weight: 500;
    
    &:hover {
      box-shadow: 2px 2px 6px $neu-2, -2px -2px 6px $white;
    }
  }
}

// 快捷操作
.quick-actions {
  .action-buttons {
    display: flex;
    gap: 16px;
    padding: 20px 24px;
    
    .action-btn {
      flex: 1;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 10px;
      padding: 20px 12px;
      background: $neu-1;
      border: none;
      border-radius: 16px;
      cursor: pointer;
      box-shadow: 6px 6px 12px $neu-2, -6px -6px 12px $white;
      transition: all 0.3s;
      color: $gray;
      font-family: 'Montserrat', sans-serif;
      
      .el-icon {
        font-size: 24px;
      }
      
      span {
        font-size: 12px;
        font-weight: 500;
      }
      
      &:hover {
        box-shadow: 4px 4px 8px $neu-2, -4px -4px 8px $white;
        color: $purple;
      }
      
      &:active {
        box-shadow: inset 3px 3px 6px $neu-2, inset -3px -3px 6px $white;
      }
      
      &.primary {
        background: linear-gradient(135deg, $purple 0%, #7c9df7 100%);
        color: #fff;
        box-shadow: 6px 6px 12px $neu-2, -4px -4px 10px $white;
        
        &:hover {
          box-shadow: 4px 4px 8px $neu-2, -2px -2px 6px $white;
        }
      }
    }
  }
}

// 视频列表
.video-list {
  max-height: 400px;
  overflow-y: auto;
  padding: 16px;
  
  .video-item {
    display: flex;
    align-items: center;
    gap: 16px;
    padding: 16px;
    border-radius: 16px;
    cursor: pointer;
    transition: all 0.3s;
    margin-bottom: 12px;
    background: $neu-1;
    box-shadow: 4px 4px 8px $neu-2, -4px -4px 8px $white;
    
    &:hover {
      box-shadow: inset 2px 2px 4px $neu-2, inset -2px -2px 4px $white;
    }
    
    &:last-child {
      margin-bottom: 0;
    }
    
    .video-icon {
      width: 48px;
      height: 48px;
      border-radius: 12px;
      background: linear-gradient(135deg, $purple 0%, #7c9df7 100%);
      display: flex;
      align-items: center;
      justify-content: center;
      color: #fff;
      font-size: 20px;
      flex-shrink: 0;
    }
    
    .video-info {
      flex: 1;
      min-width: 0;
      
      .video-title {
        font-size: 14px;
        font-weight: 600;
        color: $black;
        margin-bottom: 4px;
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
  padding: 48px 20px;
  color: $gray;
  
  p {
    margin: 16px 0 20px;
    font-size: 14px;
  }
}
</style>
