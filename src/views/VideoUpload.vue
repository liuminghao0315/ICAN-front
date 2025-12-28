<template>
  <div class="video-upload-page">
    <div class="upload-container">
      <!-- 上传卡片 -->
      <div class="neu-card upload-card">
        <div class="card-header">
          <span class="card-title">
            <el-icon><Upload /></el-icon>
            上传视频
          </span>
          <span class="card-subtitle">支持 MP4、AVI、MOV 等格式，最大 500MB</span>
        </div>
        
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
              <div class="upload-icon">
                <el-icon :size="48"><UploadFilled /></el-icon>
              </div>
              <div class="upload-text">
                <p class="upload-main">将视频拖到此处，或<em>点击上传</em></p>
                <p class="upload-tip">支持 MP4、AVI、MOV、WMV、MKV 等格式</p>
              </div>
            </div>
          </el-upload>
        </div>
        
        <!-- 视频信息填写 -->
        <div class="video-form" v-else>
          <div class="file-preview">
            <div class="file-icon">
              <el-icon :size="36"><VideoPlay /></el-icon>
            </div>
            <div class="file-details">
              <div class="file-name">{{ uploadState.file.name }}</div>
              <div class="file-meta">
                {{ formatFileSize(uploadState.file.size) }}
                <span v-if="uploadState.status === 'uploading'">
                  · {{ uploadState.progress }}%
                </span>
              </div>
            </div>
            <button
              v-if="uploadState.status === 'pending'"
              class="neu-btn icon-btn danger"
              @click="clearFile"
            >
              <el-icon><Delete /></el-icon>
            </button>
          </div>
          
          <!-- 上传进度 -->
          <div class="progress-bar-wrapper" v-if="uploadState.status === 'uploading'">
            <div class="progress-bar">
              <div class="progress-fill" :style="{ width: uploadState.progress + '%' }"></div>
            </div>
            <span class="progress-text">{{ uploadState.progress }}%</span>
          </div>
          
          <div class="form-content">
            <div class="form-group">
              <label class="form-label">视频标题 <span class="required">*</span></label>
              <input
                v-model="videoForm.title"
                type="text"
                class="neu-input"
                placeholder="请输入视频标题"
                maxlength="100"
              />
            </div>
            
            <div class="form-group">
              <label class="form-label">视频描述</label>
              <textarea
                v-model="videoForm.description"
                class="neu-textarea"
                placeholder="请输入视频描述（可选）"
                rows="4"
                maxlength="500"
              ></textarea>
            </div>
            
            <div class="form-actions">
              <button
                class="neu-btn primary-btn"
                :disabled="uploadState.status === 'uploading' || uploadState.status === 'success' || !videoForm.title"
                @click="handleUpload"
              >
                <el-icon v-if="uploadState.status !== 'uploading'"><Upload /></el-icon>
                {{ getUploadButtonText() }}
              </button>
              <button 
                class="neu-btn" 
                @click="clearFile" 
                :disabled="uploadState.status === 'uploading'"
              >
                取消
              </button>
            </div>
          </div>
        </div>
        
        <!-- 上传成功 -->
        <div class="upload-success" v-if="uploadState.status === 'success'">
          <div class="success-icon">
            <el-icon :size="48"><CircleCheck /></el-icon>
          </div>
          <h3>上传成功！</h3>
          <p>视频已上传，系统将自动进行分析</p>
          <div class="success-actions">
            <button class="neu-btn primary-btn" @click="goToVideos">查看视频</button>
            <button class="neu-btn" @click="uploadAnother">继续上传</button>
          </div>
        </div>
      </div>
      
      <!-- 上传说明 -->
      <div class="neu-card tips-card">
        <div class="card-header">
          <span class="card-title">
            <el-icon><InfoFilled /></el-icon>
            上传说明
          </span>
        </div>
        
        <ul class="tips-list">
          <li>
            <div class="tip-icon"><el-icon><Check /></el-icon></div>
            <span>支持格式：MP4、AVI、MOV、WMV、FLV、MKV、WebM</span>
          </li>
          <li>
            <div class="tip-icon"><el-icon><Check /></el-icon></div>
            <span>文件大小：单个视频最大 500MB</span>
          </li>
          <li>
            <div class="tip-icon"><el-icon><Check /></el-icon></div>
            <span>大文件采用分片上传，支持断点续传</span>
          </li>
          <li>
            <div class="tip-icon"><el-icon><Check /></el-icon></div>
            <span>上传完成后，系统将自动进行多模态分析</span>
          </li>
        </ul>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, type UploadFile } from 'element-plus'
import SparkMD5 from 'spark-md5'
import { checkChunkUpload, uploadChunk, uploadVideoSimple } from '@/api'

const router = useRouter()

// 分片大小：5MB
const CHUNK_SIZE = 5 * 1024 * 1024

const uploadRef = ref()

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
  
  if (!videoForm.title.trim()) {
    ElMessage.warning('请输入视频标题')
    return
  }
  
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
// 新拟态配色变量
$bg: #edf2f0;
$neu-1: #ecf0f3;
$neu-2: #d1d9e6;
$white: #f9f9f9;
$gray: #a0a5a8;
$black: #181818;
$purple: #4b70e2;

.video-upload-page {
  max-width: 800px;
  margin: 0 auto;
  
  .upload-container {
    display: flex;
    flex-direction: column;
    gap: 24px;
  }
}

// 新拟态卡片
.neu-card {
  background: $neu-1;
  border-radius: 20px;
  box-shadow: 8px 8px 16px $neu-2, -8px -8px 16px $white;
  overflow: hidden;
  
  .card-header {
    padding: 20px 24px;
    border-bottom: 1px solid rgba($neu-2, 0.5);
    
    .card-title {
      font-size: 16px;
      font-weight: 600;
      color: $black;
      display: flex;
      align-items: center;
      gap: 8px;
    }
    
    .card-subtitle {
      display: block;
      font-size: 13px;
      color: $gray;
      margin-top: 6px;
    }
  }
}

// 上传区域
.upload-area {
  padding: 24px;
  
  .video-uploader {
    width: 100%;
    
    :deep(.el-upload-dragger) {
      width: 100%;
      height: 260px;
      border: none;
      border-radius: 16px;
      background: $neu-1;
      box-shadow: inset 4px 4px 8px $neu-2, inset -4px -4px 8px $white;
      transition: all 0.3s;
      
      &:hover {
        box-shadow: inset 2px 2px 4px $neu-2, inset -2px -2px 4px $white;
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
      width: 80px;
      height: 80px;
      border-radius: 50%;
      background: $neu-1;
      box-shadow: 6px 6px 12px $neu-2, -6px -6px 12px $white;
      display: flex;
      align-items: center;
      justify-content: center;
      color: $gray;
      margin-bottom: 20px;
    }
    
    .upload-text {
      text-align: center;
      
      .upload-main {
        margin: 0;
        color: $black;
        font-size: 16px;
        
        em {
          color: $purple;
          font-style: normal;
          font-weight: 500;
        }
      }
      
      .upload-tip {
        font-size: 13px;
        color: $gray;
        margin: 10px 0 0;
      }
    }
  }
}

// 视频表单
.video-form {
  padding: 24px;
  
  .file-preview {
    display: flex;
    align-items: center;
    gap: 16px;
    padding: 18px 20px;
    background: $neu-1;
    border-radius: 16px;
    box-shadow: inset 2px 2px 4px $neu-2, inset -2px -2px 4px $white;
    margin-bottom: 20px;
    
    .file-icon {
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
    
    .file-details {
      flex: 1;
      
      .file-name {
        font-size: 15px;
        font-weight: 600;
        color: $black;
        word-break: break-all;
        margin-bottom: 4px;
      }
      
      .file-meta {
        font-size: 13px;
        color: $gray;
      }
    }
  }
  
  .progress-bar-wrapper {
    display: flex;
    align-items: center;
    gap: 12px;
    margin-bottom: 20px;
    
    .progress-bar {
      flex: 1;
      height: 8px;
      background: $neu-1;
      border-radius: 4px;
      box-shadow: inset 2px 2px 4px $neu-2, inset -2px -2px 4px $white;
      overflow: hidden;
      
      .progress-fill {
        height: 100%;
        background: linear-gradient(135deg, $purple 0%, #7c9df7 100%);
        border-radius: 4px;
        transition: width 0.3s;
      }
    }
    
    .progress-text {
      font-size: 13px;
      color: $purple;
      font-weight: 600;
      width: 45px;
    }
  }
  
  .form-content {
    .form-group {
      margin-bottom: 20px;
      
      .form-label {
        display: block;
        font-size: 13px;
        font-weight: 500;
        color: $black;
        margin-bottom: 8px;
        
        .required {
          color: #f56c6c;
        }
      }
    }
    
    .form-actions {
      display: flex;
      gap: 16px;
      padding-top: 8px;
    }
  }
}

// 新拟态输入框
.neu-input,
.neu-textarea {
  width: 100%;
  padding: 14px 18px;
  font-size: 14px;
  color: $black;
  background: $neu-1;
  border: none;
  border-radius: 12px;
  box-shadow: inset 2px 2px 4px $neu-2, inset -2px -2px 4px $white;
  outline: none;
  font-family: 'Montserrat', sans-serif;
  transition: all 0.25s;
  
  &:focus {
    box-shadow: inset 3px 3px 6px $neu-2, inset -3px -3px 6px $white;
  }
  
  &::placeholder {
    color: $gray;
  }
}

.neu-textarea {
  resize: vertical;
  min-height: 100px;
}

// 新拟态按钮
.neu-btn {
  background: $neu-1;
  border: none;
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.25s;
  box-shadow: 4px 4px 8px $neu-2, -4px -4px 8px $white;
  color: $gray;
  font-family: 'Montserrat', sans-serif;
  padding: 14px 28px;
  font-size: 14px;
  
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
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 16px;
    
    &.danger {
      color: #f56c6c;
    }
  }
  
  &.primary-btn {
    background: linear-gradient(135deg, $purple 0%, #7c9df7 100%);
    color: #fff;
    display: flex;
    align-items: center;
    gap: 8px;
    
    &:hover {
      box-shadow: 4px 4px 8px $neu-2, -2px -2px 6px $white;
      color: #fff;
    }
  }
}

// 上传成功
.upload-success {
  padding: 48px 24px;
  text-align: center;
  
  .success-icon {
    width: 80px;
    height: 80px;
    border-radius: 50%;
    background: linear-gradient(135deg, #52c41a 0%, #73d13d 100%);
    display: flex;
    align-items: center;
    justify-content: center;
    color: #fff;
    margin: 0 auto 20px;
    box-shadow: 6px 6px 12px $neu-2, -6px -6px 12px $white;
  }
  
  h3 {
    font-size: 20px;
    font-weight: 700;
    color: $black;
    margin: 0 0 10px;
  }
  
  p {
    font-size: 14px;
    color: $gray;
    margin: 0 0 28px;
  }
  
  .success-actions {
    display: flex;
    gap: 16px;
    justify-content: center;
  }
}

// 上传说明
.tips-card {
  .tips-list {
    list-style: none;
    padding: 0;
    margin: 0;
    
    li {
      display: flex;
      align-items: center;
      gap: 14px;
      padding: 16px 24px;
      border-bottom: 1px solid rgba($neu-2, 0.5);
      color: $black;
      font-size: 14px;
      
      &:last-child {
        border-bottom: none;
      }
      
      .tip-icon {
        width: 28px;
        height: 28px;
        border-radius: 50%;
        background: rgba(82, 196, 26, 0.12);
        display: flex;
        align-items: center;
        justify-content: center;
        color: #52c41a;
        font-size: 14px;
        flex-shrink: 0;
      }
    }
  }
}
</style>
