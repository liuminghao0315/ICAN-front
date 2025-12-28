<template>
  <div class="dashboard">
    <!-- 统计卡片 -->
    <el-row :gutter="20" class="stat-cards">
      <el-col :xs="24" :sm="12" :lg="6">
        <div class="stat-card" style="--accent: #667eea">
          <div class="stat-icon">
            <el-icon :size="28"><VideoPlay /></el-icon>
          </div>
          <div class="stat-info">
            <div class="stat-value">{{ stats.totalVideos }}</div>
            <div class="stat-label">视频总数</div>
          </div>
        </div>
      </el-col>
      
      <el-col :xs="24" :sm="12" :lg="6">
        <div class="stat-card" style="--accent: #f093fb">
          <div class="stat-icon">
            <el-icon :size="28"><TrendCharts /></el-icon>
          </div>
          <div class="stat-info">
            <div class="stat-value">{{ stats.analyzedCount }}</div>
            <div class="stat-label">已分析</div>
          </div>
        </div>
      </el-col>
      
      <el-col :xs="24" :sm="12" :lg="6">
        <div class="stat-card" style="--accent: #4facfe">
          <div class="stat-icon">
            <el-icon :size="28"><Loading /></el-icon>
          </div>
          <div class="stat-info">
            <div class="stat-value">{{ stats.pendingCount }}</div>
            <div class="stat-label">待处理</div>
          </div>
        </div>
      </el-col>
      
      <el-col :xs="24" :sm="12" :lg="6">
        <div class="stat-card" style="--accent: #f5576c">
          <div class="stat-icon">
            <el-icon :size="28"><Warning /></el-icon>
          </div>
          <div class="stat-info">
            <div class="stat-value">{{ stats.riskCount }}</div>
            <div class="stat-label">风险预警</div>
          </div>
        </div>
      </el-col>
    </el-row>
    
    <!-- 快捷操作 -->
    <el-card class="quick-actions" shadow="never">
      <template #header>
        <span class="card-title">快捷操作</span>
      </template>
      
      <div class="action-buttons">
        <el-button type="primary" size="large" @click="router.push('/upload')">
          <el-icon><Upload /></el-icon>
          上传视频
        </el-button>
        <el-button size="large" @click="router.push('/videos')">
          <el-icon><VideoPlay /></el-icon>
          查看视频
        </el-button>
        <el-button size="large" @click="router.push('/analysis')">
          <el-icon><DataAnalysis /></el-icon>
          分析报告
        </el-button>
      </div>
    </el-card>
    
    <!-- 最近上传 -->
    <el-card class="recent-videos" shadow="never">
      <template #header>
        <div class="card-header">
          <span class="card-title">最近上传</span>
          <el-button text type="primary" @click="router.push('/videos')">
            查看全部 <el-icon><ArrowRight /></el-icon>
          </el-button>
        </div>
      </template>
      
      <el-table :data="recentVideos" v-loading="loading" style="width: 100%">
        <el-table-column prop="title" label="视频标题" min-width="200">
          <template #default="{ row }">
            <div class="video-title">
              <el-icon class="video-icon"><VideoPlay /></el-icon>
              {{ row.title }}
            </div>
          </template>
        </el-table-column>
        <el-table-column prop="fileSize" label="文件大小" width="120">
          <template #default="{ row }">
            {{ formatFileSize(row.fileSize) }}
          </template>
        </el-table-column>
        <el-table-column prop="status" label="状态" width="120">
          <template #default="{ row }">
            <el-tag :type="getStatusType(row.status)" size="small">
              {{ getStatusText(row.status) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="gmtCreated" label="上传时间" width="180">
          <template #default="{ row }">
            {{ formatDate(row.gmtCreated) }}
          </template>
        </el-table-column>
      </el-table>
      
      <el-empty v-if="!loading && recentVideos.length === 0" description="暂无视频，快去上传吧~">
        <el-button type="primary" @click="router.push('/upload')">上传视频</el-button>
      </el-empty>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { getVideoList, type VideoInfo } from '@/api'

const router = useRouter()

const loading = ref(false)
const recentVideos = ref<VideoInfo[]>([])

const stats = ref({
  totalVideos: 0,
  analyzedCount: 0,
  pendingCount: 0,
  riskCount: 0
})

const fetchData = async () => {
  loading.value = true
  try {
    const response = await getVideoList(1, 5)
    if (response.code === 200) {
      recentVideos.value = response.data.records
      stats.value.totalVideos = response.data.total
      
      // 统计各状态数量
      stats.value.analyzedCount = recentVideos.value.filter(v => v.status === 'COMPLETED').length
      stats.value.pendingCount = recentVideos.value.filter(v => v.status === 'UPLOADED' || v.status === 'ANALYZING').length
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
  return new Date(dateStr).toLocaleString('zh-CN')
}

const getStatusType = (status: string) => {
  const types: Record<string, '' | 'success' | 'warning' | 'danger' | 'info'> = {
    'UPLOADED': 'info',
    'ANALYZING': 'warning',
    'COMPLETED': 'success',
    'FAILED': 'danger'
  }
  return types[status] || 'info'
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

onMounted(() => {
  fetchData()
})
</script>

<style scoped lang="scss">
.dashboard {
  .stat-cards {
    margin-bottom: 20px;
    
    .el-col {
      margin-bottom: 20px;
    }
  }
  
  .stat-card {
    background: #fff;
    border-radius: 12px;
    padding: 24px;
    display: flex;
    align-items: center;
    gap: 20px;
    box-shadow: 0 2px 12px rgba(0, 0, 0, 0.04);
    transition: transform 0.3s, box-shadow 0.3s;
    
    &:hover {
      transform: translateY(-4px);
      box-shadow: 0 8px 24px rgba(0, 0, 0, 0.08);
    }
    
    .stat-icon {
      width: 60px;
      height: 60px;
      border-radius: 12px;
      background: linear-gradient(135deg, var(--accent), color-mix(in srgb, var(--accent) 70%, white));
      display: flex;
      align-items: center;
      justify-content: center;
      color: #fff;
    }
    
    .stat-info {
      .stat-value {
        font-size: 28px;
        font-weight: 700;
        color: #303133;
      }
      
      .stat-label {
        font-size: 14px;
        color: #909399;
        margin-top: 4px;
      }
    }
  }
  
  .quick-actions,
  .recent-videos {
    margin-bottom: 20px;
    border-radius: 12px;
    
    .card-title {
      font-size: 16px;
      font-weight: 600;
    }
    
    .card-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
  }
  
  .action-buttons {
    display: flex;
    gap: 16px;
    flex-wrap: wrap;
    
    .el-button {
      padding: 20px 32px;
      
      .el-icon {
        margin-right: 8px;
      }
    }
  }
  
  .video-title {
    display: flex;
    align-items: center;
    gap: 8px;
    
    .video-icon {
      color: #667eea;
    }
  }
}
</style>

