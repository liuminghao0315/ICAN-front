<template>
  <div class="video-list">
    <!-- 顶部操作栏 -->
    <div class="header-actions">
      <h2 class="page-title">我的视频</h2>
      <el-button type="primary" @click="router.push('/upload')">
        <el-icon><Upload /></el-icon>
        上传视频
      </el-button>
    </div>
    
    <!-- 视频列表 -->
    <el-card class="list-card" shadow="never">
      <el-table
        v-loading="loading"
        :data="videoList"
        style="width: 100%"
        @row-click="handleRowClick"
      >
        <el-table-column label="视频" min-width="300">
          <template #default="{ row }">
            <div class="video-cell">
              <div class="video-thumbnail">
                <el-icon :size="32"><VideoPlay /></el-icon>
              </div>
              <div class="video-info">
                <div class="video-title">{{ row.title }}</div>
                <div class="video-meta">
                  {{ row.fileName }} · {{ formatFileSize(row.fileSize) }}
                </div>
              </div>
            </div>
          </template>
        </el-table-column>
        
        <el-table-column prop="status" label="状态" width="120" align="center">
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
        
        <el-table-column label="操作" width="180" align="center">
          <template #default="{ row }">
            <el-button-group>
              <el-tooltip content="查看详情" placement="top">
                <el-button size="small" @click.stop="viewVideo(row)">
                  <el-icon><View /></el-icon>
                </el-button>
              </el-tooltip>
              <el-tooltip content="开始分析" placement="top" v-if="row.status === 'UPLOADED'">
                <el-button size="small" type="primary" @click.stop="startAnalysis(row)">
                  <el-icon><DataAnalysis /></el-icon>
                </el-button>
              </el-tooltip>
              <el-tooltip content="删除" placement="top">
                <el-button size="small" type="danger" @click.stop="handleDelete(row)">
                  <el-icon><Delete /></el-icon>
                </el-button>
              </el-tooltip>
            </el-button-group>
          </template>
        </el-table-column>
      </el-table>
      
      <!-- 空状态 -->
      <el-empty v-if="!loading && videoList.length === 0" description="暂无视频">
        <el-button type="primary" @click="router.push('/upload')">上传视频</el-button>
      </el-empty>
      
      <!-- 分页 -->
      <div class="pagination-wrapper" v-if="total > 0">
        <el-pagination
          v-model:current-page="currentPage"
          v-model:page-size="pageSize"
          :page-sizes="[10, 20, 50]"
          :total="total"
          layout="total, sizes, prev, pager, next, jumper"
          @size-change="fetchVideos"
          @current-change="fetchVideos"
        />
      </div>
    </el-card>
    
    <!-- 视频详情对话框 -->
    <el-dialog
      v-model="detailDialogVisible"
      :title="selectedVideo?.title"
      width="800px"
      destroy-on-close
    >
      <div class="video-detail" v-if="selectedVideo">
        <video
          v-if="selectedVideo.videoUrl"
          :src="selectedVideo.videoUrl"
          controls
          class="video-player"
        ></video>
        
        <el-descriptions :column="2" border class="video-descriptions">
          <el-descriptions-item label="文件名">{{ selectedVideo.fileName }}</el-descriptions-item>
          <el-descriptions-item label="文件大小">{{ formatFileSize(selectedVideo.fileSize) }}</el-descriptions-item>
          <el-descriptions-item label="状态">
            <el-tag :type="getStatusType(selectedVideo.status)" size="small">
              {{ getStatusText(selectedVideo.status) }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="上传时间">{{ formatDate(selectedVideo.gmtCreated) }}</el-descriptions-item>
          <el-descriptions-item label="描述" :span="2">
            {{ selectedVideo.description || '无描述' }}
          </el-descriptions-item>
        </el-descriptions>
      </div>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { getVideoList, deleteVideo, type VideoInfo } from '@/api'

const router = useRouter()

const loading = ref(false)
const videoList = ref<VideoInfo[]>([])
const currentPage = ref(1)
const pageSize = ref(10)
const total = ref(0)

const detailDialogVisible = ref(false)
const selectedVideo = ref<VideoInfo | null>(null)

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

// 点击行
const handleRowClick = (row: VideoInfo) => {
  viewVideo(row)
}

// 查看视频
const viewVideo = (video: VideoInfo) => {
  selectedVideo.value = video
  detailDialogVisible.value = true
}

// 开始分析
const startAnalysis = async (video: VideoInfo) => {
  ElMessage.info('分析功能开发中...')
  // TODO: 调用分析接口
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
const getStatusType = (status: string) => {
  const types: Record<string, '' | 'success' | 'warning' | 'danger' | 'info'> = {
    'UPLOADED': 'info',
    'ANALYZING': 'warning',
    'COMPLETED': 'success',
    'FAILED': 'danger'
  }
  return types[status] || 'info'
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
.video-list {
  .header-actions {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 20px;
    
    .page-title {
      font-size: 20px;
      font-weight: 600;
      margin: 0;
    }
  }
  
  .list-card {
    border-radius: 12px;
    
    .video-cell {
      display: flex;
      align-items: center;
      gap: 16px;
      cursor: pointer;
      
      .video-thumbnail {
        width: 80px;
        height: 50px;
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        border-radius: 8px;
        display: flex;
        align-items: center;
        justify-content: center;
        color: #fff;
        flex-shrink: 0;
      }
      
      .video-info {
        .video-title {
          font-size: 14px;
          font-weight: 500;
          color: #303133;
          margin-bottom: 4px;
        }
        
        .video-meta {
          font-size: 12px;
          color: #909399;
        }
      }
    }
    
    .pagination-wrapper {
      margin-top: 20px;
      display: flex;
      justify-content: flex-end;
    }
  }
  
  .video-detail {
    .video-player {
      width: 100%;
      max-height: 400px;
      background: #000;
      border-radius: 8px;
      margin-bottom: 20px;
    }
    
    .video-descriptions {
      :deep(.el-descriptions__label) {
        width: 100px;
      }
    }
  }
}
</style>

