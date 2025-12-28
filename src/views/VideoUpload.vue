<template>
  <div class="video-upload">
    <el-card class="upload-card" shadow="never">
      <template #header>
        <div class="card-header">
          <span class="card-title">
            <el-icon><Upload /></el-icon>
            上传视频
          </span>
          <span class="card-subtitle">支持 MP4、AVI、MOV 等格式，最大 500MB</span>
        </div>
      </template>
      
      <!-- 上传区域 -->
      <div class="upload-area" v-if="!uploadState.file">
        <el-upload
          ref="uploadRef"
          class="video-uploader"
          drag
          :auto-upload="false"
          :show-file-list="false"
          :on-change="handleFileChange"
          accept="video/*"
        >
          <div class="upload-content">
            <el-icon class="upload-icon"><UploadFilled /></el-icon>
            <div class="upload-text">
              <p>将视频拖到此处，或<em>点击上传</em></p>
              <p class="upload-tip">支持 MP4、AVI、MOV、WMV、MKV 等格式</p>
            </div>
          </div>
        </el-upload>
      </div>
      
      <!-- 视频信息填写 -->
      <div class="video-form" v-else>
        <div class="file-preview">
          <div class="file-info">
            <el-icon class="file-icon" :size="48"><VideoPlay /></el-icon>
            <div class="file-details">
              <div class="file-name">{{ uploadState.file.name }}</div>
              <div class="file-meta">
                {{ formatFileSize(uploadState.file.size) }}
                <span v-if="uploadState.status === 'uploading'">
                  · {{ uploadState.progress }}%
                </span>
              </div>
            </div>
            <el-button
              v-if="uploadState.status === 'pending'"
              type="danger"
              text
              @click="clearFile"
            >
              <el-icon><Delete /></el-icon>
            </el-button>
          </div>
          
          <!-- 上传进度 -->
          <el-progress
            v-if="uploadState.status === 'uploading'"
            :percentage="uploadState.progress"
            :stroke-width="8"
            :status="uploadState.progress === 100 ? 'success' : undefined"
          />
        </div>
        
        <el-form
          ref="formRef"
          :model="videoForm"
          :rules="formRules"
          label-width="80px"
          class="info-form"
        >
          <el-form-item label="标题" prop="title">
            <el-input
              v-model="videoForm.title"
              placeholder="请输入视频标题"
              maxlength="100"
              show-word-limit
            />
          </el-form-item>
          
          <el-form-item label="描述" prop="description">
            <el-input
              v-model="videoForm.description"
              type="textarea"
              placeholder="请输入视频描述（可选）"
              :rows="4"
              maxlength="500"
              show-word-limit
            />
          </el-form-item>
          
          <el-form-item>
            <el-button
              type="primary"
              size="large"
              :loading="uploadState.status === 'uploading'"
              :disabled="uploadState.status === 'success'"
              @click="handleUpload"
            >
              <el-icon v-if="uploadState.status !== 'uploading'"><Upload /></el-icon>
              {{ getUploadButtonText() }}
            </el-button>
            <el-button size="large" @click="clearFile" :disabled="uploadState.status === 'uploading'">
              取消
            </el-button>
          </el-form-item>
        </el-form>
      </div>
      
      <!-- 上传成功 -->
      <div class="upload-success" v-if="uploadState.status === 'success'">
        <el-result icon="success" title="上传成功！">
          <template #sub-title>
            <p>视频已上传，系统将自动进行分析</p>
          </template>
          <template #extra>
            <el-button type="primary" @click="goToVideos">查看视频</el-button>
            <el-button @click="uploadAnother">继续上传</el-button>
          </template>
        </el-result>
      </div>
    </el-card>
    
    <!-- 上传说明 -->
    <el-card class="tips-card" shadow="never">
      <template #header>
        <span class="card-title">
          <el-icon><InfoFilled /></el-icon>
          上传说明
        </span>
      </template>
      
      <ul class="tips-list">
        <li>
          <el-icon><Check /></el-icon>
          支持格式：MP4、AVI、MOV、WMV、FLV、MKV、WebM
        </li>
        <li>
          <el-icon><Check /></el-icon>
          文件大小：单个视频最大 500MB
        </li>
        <li>
          <el-icon><Check /></el-icon>
          大文件采用分片上传，支持断点续传
        </li>
        <li>
          <el-icon><Check /></el-icon>
          上传完成后，系统将自动进行多模态分析
        </li>
      </ul>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, type FormInstance, type FormRules, type UploadFile } from 'element-plus'
import SparkMD5 from 'spark-md5'
import { checkChunkUpload, uploadChunk, uploadVideoSimple } from '@/api'

const router = useRouter()

// 分片大小：5MB
const CHUNK_SIZE = 5 * 1024 * 1024

const uploadRef = ref()
const formRef = ref<FormInstance>()

const uploadState = reactive({
  file: null as File | null,
  status: 'pending' as 'pending' | 'uploading' | 'success' | 'error',
  progress: 0,
  videoId: ''
})

const videoForm = reactive({
  title: '',
  description: ''
})

const formRules: FormRules = {
  title: [
    { required: true, message: '请输入视频标题', trigger: 'blur' },
    { min: 2, max: 100, message: '标题长度在 2 到 100 个字符', trigger: 'blur' }
  ]
}

// 处理文件选择
const handleFileChange = (uploadFile: UploadFile) => {
  const file = uploadFile.raw
  if (!file) return
  
  // 验证文件类型
  const validTypes = ['video/mp4', 'video/avi', 'video/quicktime', 'video/x-msvideo', 
                      'video/x-ms-wmv', 'video/x-flv', 'video/x-matroska', 'video/webm']
  if (!validTypes.includes(file.type) && !file.name.match(/\.(mp4|avi|mov|wmv|flv|mkv|webm)$/i)) {
    ElMessage.error('不支持的视频格式')
    return
  }
  
  // 验证文件大小
  const maxSize = 500 * 1024 * 1024 // 500MB
  if (file.size > maxSize) {
    ElMessage.error('视频文件不能超过 500MB')
    return
  }
  
  uploadState.file = file
  uploadState.status = 'pending'
  uploadState.progress = 0
  
  // 默认使用文件名作为标题
  videoForm.title = file.name.replace(/\.[^/.]+$/, '')
}

// 计算文件MD5
const calculateMD5 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const spark = new SparkMD5.ArrayBuffer()
    const reader = new FileReader()
    const chunkSize = 2 * 1024 * 1024 // 2MB chunks for MD5
    let currentChunk = 0
    const chunks = Math.ceil(file.size / chunkSize)
    
    reader.onload = (e) => {
      spark.append(e.target?.result as ArrayBuffer)
      currentChunk++
      
      if (currentChunk < chunks) {
        loadNext()
      } else {
        resolve(spark.end())
      }
    }
    
    reader.onerror = reject
    
    const loadNext = () => {
      const start = currentChunk * chunkSize
      const end = Math.min(start + chunkSize, file.size)
      reader.readAsArrayBuffer(file.slice(start, end))
    }
    
    loadNext()
  })
}

// 开始上传
const handleUpload = async () => {
  if (!uploadState.file) return
  
  // 验证表单
  const valid = await formRef.value?.validate().catch(() => false)
  if (!valid) return
  
  const file = uploadState.file
  uploadState.status = 'uploading'
  uploadState.progress = 0
  
  try {
    // 小文件直接上传，大文件分片上传
    if (file.size <= CHUNK_SIZE) {
      await uploadSimple(file)
    } else {
      await uploadWithChunks(file)
    }
    
    uploadState.status = 'success'
    ElMessage.success('视频上传成功！')
  } catch (error: any) {
    uploadState.status = 'error'
    ElMessage.error(error.message || '上传失败，请重试')
  }
}

// 简单上传
const uploadSimple = async (file: File) => {
  const formData = new FormData()
  formData.append('file', file)
  formData.append('title', videoForm.title)
  if (videoForm.description) {
    formData.append('description', videoForm.description)
  }
  
  const response = await uploadVideoSimple(formData)
  if (response.code === 200) {
    uploadState.videoId = response.data.id
    uploadState.progress = 100
  } else {
    throw new Error(response.message || '上传失败')
  }
}

// 分片上传
const uploadWithChunks = async (file: File) => {
  // 计算文件MD5
  ElMessage.info('正在计算文件校验值...')
  const fileIdentifier = await calculateMD5(file)
  
  const totalChunks = Math.ceil(file.size / CHUNK_SIZE)
  
  // 检查已上传的分片
  const checkResponse = await checkChunkUpload(fileIdentifier, file.name, totalChunks)
  if (checkResponse.code !== 200) {
    throw new Error(checkResponse.message || '检查上传状态失败')
  }
  
  // 秒传成功
  if (checkResponse.data.finished && checkResponse.data.videoId) {
    uploadState.videoId = checkResponse.data.videoId
    uploadState.progress = 100
    return
  }
  
  // 获取已上传的分片
  const uploadedChunks = new Set(checkResponse.data.uploadedChunks || [])
  
  // 上传未完成的分片
  for (let i = 0; i < totalChunks; i++) {
    if (uploadedChunks.has(i)) {
      // 已上传，跳过
      uploadState.progress = Math.round(((i + 1) / totalChunks) * 100)
      continue
    }
    
    const start = i * CHUNK_SIZE
    const end = Math.min(start + CHUNK_SIZE, file.size)
    const chunk = file.slice(start, end)
    
    const formData = new FormData()
    formData.append('chunk', chunk)
    formData.append('fileIdentifier', fileIdentifier)
    formData.append('fileName', file.name)
    formData.append('chunkNumber', String(i))
    formData.append('totalChunks', String(totalChunks))
    formData.append('chunkSize', String(chunk.size))
    formData.append('totalSize', String(file.size))
    formData.append('title', videoForm.title)
    if (videoForm.description) {
      formData.append('description', videoForm.description)
    }
    
    const response = await uploadChunk(formData)
    if (response.code !== 200) {
      throw new Error(response.message || `分片 ${i + 1} 上传失败`)
    }
    
    uploadState.progress = Math.round(((i + 1) / totalChunks) * 100)
    
    // 最后一个分片上传完成
    if (response.data.finished && response.data.videoId) {
      uploadState.videoId = response.data.videoId
    }
  }
}

// 清除文件
const clearFile = () => {
  uploadState.file = null
  uploadState.status = 'pending'
  uploadState.progress = 0
  uploadState.videoId = ''
  videoForm.title = ''
  videoForm.description = ''
}

// 继续上传
const uploadAnother = () => {
  clearFile()
}

// 跳转到视频列表
const goToVideos = () => {
  router.push('/videos')
}

// 格式化文件大小
const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

// 获取上传按钮文本
const getUploadButtonText = () => {
  if (uploadState.status === 'uploading') {
    return `上传中 ${uploadState.progress}%`
  }
  if (uploadState.status === 'success') {
    return '上传成功'
  }
  return '开始上传'
}
</script>

<style scoped lang="scss">
.video-upload {
  max-width: 800px;
  margin: 0 auto;
  
  .upload-card {
    border-radius: 12px;
    margin-bottom: 20px;
    
    .card-header {
      .card-title {
        font-size: 18px;
        font-weight: 600;
        display: flex;
        align-items: center;
        gap: 8px;
      }
      
      .card-subtitle {
        display: block;
        font-size: 13px;
        color: #909399;
        margin-top: 4px;
      }
    }
  }
  
  .upload-area {
    .video-uploader {
      width: 100%;
      
      :deep(.el-upload-dragger) {
        width: 100%;
        height: 280px;
        border: 2px dashed #dcdfe6;
        border-radius: 12px;
        transition: all 0.3s;
        
        &:hover {
          border-color: #667eea;
          background-color: rgba(102, 126, 234, 0.04);
        }
      }
    }
    
    .upload-content {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      height: 100%;
      
      .upload-icon {
        font-size: 64px;
        color: #c0c4cc;
        margin-bottom: 16px;
      }
      
      .upload-text {
        text-align: center;
        
        p {
          margin: 0;
          color: #606266;
          font-size: 16px;
          
          em {
            color: #667eea;
            font-style: normal;
          }
        }
        
        .upload-tip {
          font-size: 13px;
          color: #909399;
          margin-top: 8px;
        }
      }
    }
  }
  
  .video-form {
    .file-preview {
      background: #f5f7fa;
      border-radius: 12px;
      padding: 20px;
      margin-bottom: 24px;
      
      .file-info {
        display: flex;
        align-items: center;
        gap: 16px;
        margin-bottom: 16px;
        
        .file-icon {
          color: #667eea;
        }
        
        .file-details {
          flex: 1;
          
          .file-name {
            font-size: 16px;
            font-weight: 500;
            color: #303133;
            word-break: break-all;
          }
          
          .file-meta {
            font-size: 13px;
            color: #909399;
            margin-top: 4px;
          }
        }
      }
    }
    
    .info-form {
      :deep(.el-form-item__label) {
        font-weight: 500;
      }
    }
  }
  
  .upload-success {
    padding: 40px 0;
  }
  
  .tips-card {
    border-radius: 12px;
    
    .card-title {
      font-size: 16px;
      font-weight: 600;
      display: flex;
      align-items: center;
      gap: 8px;
    }
    
    .tips-list {
      list-style: none;
      padding: 0;
      margin: 0;
      
      li {
        display: flex;
        align-items: center;
        gap: 12px;
        padding: 12px 0;
        border-bottom: 1px solid #f0f0f0;
        color: #606266;
        
        &:last-child {
          border-bottom: none;
        }
        
        .el-icon {
          color: #67c23a;
        }
      }
    }
  }
}
</style>

