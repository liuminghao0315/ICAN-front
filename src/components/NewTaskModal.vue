<template>
  <Teleport to="body">
    <Transition name="modal-fade">
      <div class="neu-modal-overlay" v-if="visible" @click.self="handleClose">
        <div class="neu-modal task-modal">
          <!-- 模态框头部 -->
          <div class="modal-header">
            <h3 class="modal-title">新建分析任务</h3>
            <button class="close-btn" @click="handleClose">
              <el-icon><Close /></el-icon>
            </button>
          </div>

          <!-- 来源选择 Tab -->
          <div class="source-tabs">
            <button
              class="source-tab"
              :class="{ active: activeTab === 'local' }"
              @click="activeTab = 'local'"
            >
              <el-icon><Upload /></el-icon>
              <span>本地采集</span>
            </button>
            <button
              class="source-tab"
              :class="{ active: activeTab === 'url' }"
              @click="activeTab = 'url'"
            >
              <el-icon><Link /></el-icon>
              <span>网络采搜</span>
            </button>
          </div>

          <!-- 本地上传面板 -->
          <div class="tab-content" v-if="activeTab === 'local'">
            <div class="upload-zone" v-if="!localState.file">
              <el-upload
                ref="uploadRef"
                class="upload-dragger"
                drag
                :auto-upload="false"
                :show-file-list="false"
                :on-change="handleFileChange"
                accept="video/*"
              >
                <div class="upload-inner">
                  <div class="upload-icon-wrapper">
                    <el-icon :size="32"><UploadFilled /></el-icon>
                  </div>
                  <p class="upload-hint">拖拽视频到此处，或<em>点击选择</em></p>
                  <p class="upload-tip">MP4/AVI/MOV/MKV 等，最大 500MB</p>
                </div>
              </el-upload>
            </div>

            <!-- 文件已选择 -->
            <div class="file-selected" v-else>
              <div class="file-info-bar">
                <div class="file-icon-box">
                  <el-icon :size="24"><VideoPlay /></el-icon>
                </div>
                <div class="file-meta">
                  <span class="file-name">{{ localState.file.name }}</span>
                  <span class="file-size">{{ formatFileSize(localState.file.size) }}</span>
                </div>
                <button class="neu-btn-sm" @click="clearLocalFile" v-if="localState.status === 'pending'">
                  <el-icon><Close /></el-icon>
                </button>
              </div>

              <!-- 上传进度 -->
              <div class="progress-wrapper" v-if="localState.status === 'uploading'">
                <div class="progress-track">
                  <div class="progress-fill" :style="{ width: localState.progress + '%' }"></div>
                </div>
                <span class="progress-label">{{ localState.progress }}%</span>
              </div>

              <div class="form-field">
                <label>视频标题</label>
                <input
                  v-model="localState.title"
                  class="neu-input"
                  placeholder="请输入视频标题"
                  maxlength="100"
                  :disabled="localState.status === 'uploading'"
                />
              </div>
            </div>
          </div>

          <!-- URL导入面板 -->
          <div class="tab-content" v-if="activeTab === 'url'">
            <div class="form-field">
              <label>视频链接</label>
              <input
                v-model="urlState.url"
                class="neu-input"
                placeholder="粘贴视频链接（支持主流平台）"
                :disabled="urlState.status === 'submitting'"
              />
            </div>
            <div class="form-field">
              <label>标题（可选）</label>
              <input
                v-model="urlState.title"
                class="neu-input"
                placeholder="不填则自动提取"
                maxlength="100"
                :disabled="urlState.status === 'submitting'"
              />
            </div>
            <div class="url-tips">
              <el-icon><InfoFilled /></el-icon>
              <span>支持抖音、B站、YouTube 等主流平台链接</span>
            </div>
          </div>

          <!-- 底部操作 -->
          <div class="modal-footer">
            <template v-if="localState.status === 'uploading' && activeTab === 'local'">
              <button class="neu-btn cancel" @click="handleAbortUpload">中止上传</button>
              <button class="neu-btn" @click="handleClose">后台上传</button>
            </template>
            <template v-else>
              <button class="neu-btn cancel" @click="handleClose">取消</button>
              <button
                class="neu-btn primary"
                :disabled="!canSubmit"
                @click="handleSubmit"
              >
                <el-icon v-if="isSubmitting"><Loading class="rotating" /></el-icon>
                {{ submitText }}
              </button>
            </template>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, reactive, computed, watch } from 'vue'
import { ElMessage, type UploadFile } from 'element-plus'
import { createUrlImportTask } from '@/api'
import { useUploadStore } from '@/stores/upload'
import { formatFileSize } from '@/types'

const props = defineProps<{
  visible: boolean
}>()

const emit = defineEmits<{
  (e: 'update:visible', val: boolean): void
  (e: 'success'): void
}>()

const activeTab = ref<'local' | 'url'>('local')
const uploadRef = ref()
const uploadStore = useUploadStore()

// 本地上传状态
const localState = reactive({
  file: null as File | null,
  title: '',
  status: 'pending' as 'pending' | 'uploading' | 'success',
  progress: 0,
  videoId: ''
})

// URL导入状态
const urlState = reactive({
  url: '',
  title: '',
  status: 'idle' as 'idle' | 'submitting'
})

const isSubmitting = computed(() =>
  localState.status === 'uploading' || urlState.status === 'submitting'
)

const canSubmit = computed(() => {
  if (activeTab.value === 'local') {
    return localState.file && localState.title.trim() && localState.status !== 'uploading'
  }
  return urlState.url.trim() && urlState.status !== 'submitting'
})

const submitText = computed(() => {
  if (activeTab.value === 'local') {
    if (localState.status === 'uploading') return `上传中 ${localState.progress}%`
    return '上传并分析'
  }
  if (urlState.status === 'submitting') return '提交中...'
  return '开始采集分析'
})

// 每次打开模态框时强制重置为纯净初始态
watch(() => props.visible, (val) => {
  if (val) {
    // 打开时：如果有正在上传的任务，保留进度显示；否则完全重置
    const activeTask = localState.videoId
      ? uploadStore.tasks.find(t => t.videoId === localState.videoId && t.status === 'uploading')
      : null
    if (!activeTask) {
      resetForm()
    }
  } else {
    // 关闭时：非上传中则重置（上传中的任务已转入后台）
    if (localState.status !== 'uploading') {
      setTimeout(resetForm, 300)
    }
  }
})

function resetForm() {
  activeTab.value = 'local'
  localState.file = null
  localState.title = ''
  localState.status = 'pending'
  localState.progress = 0
  localState.videoId = ''
  urlState.url = ''
  urlState.title = ''
  urlState.status = 'idle'
  // 清空 el-upload 组件的文件列表
  uploadRef.value?.clearFiles?.()
}

// 关闭模态框：上传中时允许后台继续，不硬控
const handleClose = () => {
  if (localState.status === 'uploading') {
    ElMessage.info('上传任务已转入后台，可在顶部指示器查看进度')
  }
  emit('update:visible', false)
}

// 中止上传（带完整异常捕获，防止 UI 卡死）
const handleAbortUpload = async () => {
  if (!localState.videoId) return
  const videoId = localState.videoId
  try {
    await uploadStore.abortUpload(videoId)
  } catch {
    // 忽略中止过程中的错误
  } finally {
    // 无论如何恢复按钮状态，允许模态框关闭
    localState.status = 'pending'
    localState.progress = 0
    localState.videoId = ''
  }
  ElMessage.warning('上传已中止')
}

const handleFileChange = (uploadFile: UploadFile) => {
  const file = uploadFile.raw
  if (!file) return

  const allowedExt = ['mp4', 'avi', 'mov', 'wmv', 'flv', 'mkv', 'webm', 'm4v', 'mpeg', 'mpg']
  const ext = file.name.split('.').pop()?.toLowerCase()
  if (!ext || !allowedExt.includes(ext)) {
    ElMessage.error('不支持的视频格式')
    return
  }
  if (file.size > 500 * 1024 * 1024) {
    ElMessage.error('视频文件不能超过 500MB')
    return
  }
  if (file.size === 0) {
    ElMessage.error('文件大小不能为0')
    return
  }

  localState.file = file
  localState.title = file.name.replace(/\.[^/.]+$/, '')
  localState.status = 'pending'
}

const clearLocalFile = () => {
  localState.file = null
  localState.title = ''
  localState.status = 'pending'
  localState.progress = 0
}

const handleSubmit = async () => {
  if (activeTab.value === 'local') {
    await handleLocalUpload()
  } else {
    await handleUrlImport()
  }
}

// 本地上传：委托给 uploadStore，模态框可自由关闭
const handleLocalUpload = async () => {
  if (!localState.file || !localState.title.trim()) return

  const file = localState.file
  localState.status = 'uploading'
  localState.progress = 0

  try {
    const videoId = await uploadStore.startUpload(file, localState.title.trim())
    localState.videoId = videoId

    // 轮询 store 中该任务的进度，同步到本地 UI
    const timer = setInterval(() => {
      const task = uploadStore.tasks.find(t => t.videoId === videoId)
      if (!task) { clearInterval(timer); return }
      localState.progress = task.progress
      if (task.status === 'success') {
        clearInterval(timer)
        localState.status = 'success'
        ElMessage.success('上传成功，分析任务已创建')
        emit('success')
        emit('update:visible', false)
      } else if (task.status === 'failed') {
        clearInterval(timer)
        localState.status = 'pending'
        ElMessage.error(task.errorMessage || '上传失败，请重试')
      } else if (task.status === 'cancelled') {
        clearInterval(timer)
        localState.status = 'pending'
      }
    }, 500)
  } catch (error: any) {
    // 捕获 startUpload（initUpload 阶段）的错误
    ElMessage.error(error.message || '上传失败，请重试')
  } finally {
    // 如果 startUpload 抛出异常（initUpload 失败），恢复按钮状态
    if (localState.status === 'uploading' && !localState.videoId) {
      localState.status = 'pending'
    }
  }
}

// URL导入
const handleUrlImport = async () => {
  if (!urlState.url.trim()) return

  urlState.status = 'submitting'
  try {
    const res = await createUrlImportTask({
      url: urlState.url.trim(),
      title: urlState.title.trim() || undefined,
      taskType: 'FULL_ANALYSIS'
    })
    if (res.code === 200) {
      ElMessage.success('任务创建成功，视频正在下载中')
      emit('success')
      emit('update:visible', false)
    } else {
      throw new Error(res.message || '创建失败')
    }
  } catch (error: any) {
    ElMessage.error(error.message || '创建失败，请重试')
  } finally {
    urlState.status = 'idle'
  }
}
</script>

<style scoped lang="scss">
$neu-1: #ecf0f3;
$neu-2: #d1d9e6;
$white: #f9f9f9;
$gray: #a0a5a8;
$black: #181818;
$purple: #4b70e2;

.neu-modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.25);
  backdrop-filter: blur(4px);
  z-index: 2000;
  display: flex;
  align-items: center;
  justify-content: center;
}

.task-modal {
  background: $neu-1;
  border-radius: 20px;
  padding: 28px;
  width: 480px;
  max-width: 90vw;
  max-height: 85vh;
  overflow-y: auto;
  box-shadow: 12px 12px 24px rgba(163, 177, 198, 0.5),
              -12px -12px 24px rgba(255, 255, 255, 0.95);
}

.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 20px;

  .modal-title {
    font-size: 17px;
    font-weight: 700;
    color: $black;
    margin: 0;
  }

  .close-btn {
    width: 32px;
    height: 32px;
    border: none;
    border-radius: 50%;
    background: $neu-1;
    box-shadow: 3px 3px 6px $neu-2, -3px -3px 6px $white;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    color: $gray;
    transition: all 0.25s;

    &:hover {
      color: #f56c6c;
      box-shadow: 2px 2px 4px $neu-2, -2px -2px 4px $white;
    }
  }
}

// 来源选择 Tab
.source-tabs {
  display: flex;
  gap: 12px;
  margin-bottom: 20px;

  .source-tab {
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    padding: 12px 16px;
    border: none;
    border-radius: 12px;
    background: $neu-1;
    box-shadow: 4px 4px 8px $neu-2, -4px -4px 8px $white;
    color: $gray;
    font-size: 13px;
    font-weight: 500;
    font-family: 'Montserrat', sans-serif;
    cursor: pointer;
    transition: all 0.25s;

    &:hover {
      color: $purple;
      box-shadow: 2px 2px 4px $neu-2, -2px -2px 4px $white;
    }

    &.active {
      background: linear-gradient(135deg, $purple 0%, #7c9df7 100%);
      color: #fff;
      box-shadow: inset 2px 2px 4px rgba(0, 0, 0, 0.1),
                  0 4px 12px rgba(75, 112, 226, 0.3);
    }
  }
}

.tab-content {
  min-height: 160px;
}

// 上传区域
.upload-zone {
  .upload-dragger {
    width: 100%;

    :deep(.el-upload-dragger) {
      width: 100%;
      height: 180px;
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

  .upload-inner {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    height: 100%;

    .upload-icon-wrapper {
      width: 56px;
      height: 56px;
      border-radius: 50%;
      background: $neu-1;
      box-shadow: 4px 4px 8px $neu-2, -4px -4px 8px $white;
      display: flex;
      align-items: center;
      justify-content: center;
      color: $gray;
      margin-bottom: 14px;
    }

    .upload-hint {
      font-size: 14px;
      color: $black;
      margin: 0 0 6px;
      em { color: $purple; font-style: normal; font-weight: 500; }
    }

    .upload-tip {
      font-size: 12px;
      color: $gray;
      margin: 0;
    }
  }
}

// 文件已选择
.file-selected {
  .file-info-bar {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 14px 16px;
    border-radius: 12px;
    background: $neu-1;
    box-shadow: inset 2px 2px 4px $neu-2, inset -2px -2px 4px $white;
    margin-bottom: 16px;

    .file-icon-box {
      width: 44px;
      height: 44px;
      border-radius: 10px;
      background: linear-gradient(135deg, $purple 0%, #7c9df7 100%);
      display: flex;
      align-items: center;
      justify-content: center;
      color: #fff;
      flex-shrink: 0;
    }

    .file-meta {
      flex: 1;
      display: flex;
      flex-direction: column;
      gap: 2px;
      .file-name { font-size: 13px; font-weight: 600; color: $black; word-break: break-all; }
      .file-size { font-size: 12px; color: $gray; }
    }
  }

  .progress-wrapper {
    display: flex;
    align-items: center;
    gap: 10px;
    margin-bottom: 16px;

    .progress-track {
      flex: 1;
      height: 6px;
      border-radius: 3px;
      background: $neu-1;
      box-shadow: inset 2px 2px 4px $neu-2, inset -2px -2px 4px $white;
      overflow: hidden;

      .progress-fill {
        height: 100%;
        background: linear-gradient(135deg, $purple 0%, #7c9df7 100%);
        border-radius: 3px;
        transition: width 0.3s;
      }
    }

    .progress-label {
      font-size: 12px;
      color: $purple;
      font-weight: 600;
      width: 40px;
    }
  }
}

// 表单字段
.form-field {
  margin-bottom: 16px;

  label {
    display: block;
    font-size: 12px;
    font-weight: 500;
    color: $black;
    margin-bottom: 6px;
  }
}

.neu-input {
  width: 100%;
  padding: 12px 16px;
  font-size: 13px;
  color: $black;
  background: $neu-1;
  border: none;
  border-radius: 10px;
  box-shadow: inset 2px 2px 4px $neu-2, inset -2px -2px 4px $white;
  outline: none;
  font-family: 'Montserrat', sans-serif;
  transition: all 0.25s;

  &:focus {
    box-shadow: inset 3px 3px 6px $neu-2, inset -3px -3px 6px $white;
  }

  &::placeholder { color: $gray; }
  &:disabled { opacity: 0.5; }
}

.url-tips {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 12px;
  color: $gray;
  padding: 10px 14px;
  border-radius: 10px;
  background: rgba($purple, 0.06);

  .el-icon { color: $purple; font-size: 14px; }
}

// 底部操作
.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  margin-top: 24px;
}

.neu-btn {
  padding: 10px 22px;
  border: none;
  border-radius: 10px;
  font-size: 13px;
  font-weight: 500;
  font-family: 'Montserrat', sans-serif;
  cursor: pointer;
  transition: all 0.25s;

  &.cancel {
    background: $neu-1;
    color: $gray;
    box-shadow: 4px 4px 8px $neu-2, -4px -4px 8px $white;

    &:hover {
      color: $black;
      box-shadow: 2px 2px 4px $neu-2, -2px -2px 4px $white;
    }
  }

  &.primary {
    background: linear-gradient(135deg, $purple 0%, #7c9df7 100%);
    color: #fff;
    box-shadow: 4px 4px 8px $neu-2, -2px -2px 6px $white;
    display: flex;
    align-items: center;
    gap: 6px;

    &:hover:not(:disabled) {
      box-shadow: 4px 4px 10px rgba(75, 112, 226, 0.3), -2px -2px 6px $white;
    }

    &:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }
  }
}

.neu-btn-sm {
  width: 28px;
  height: 28px;
  border: none;
  border-radius: 50%;
  background: $neu-1;
  box-shadow: 2px 2px 4px $neu-2, -2px -2px 4px $white;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  color: $gray;
  font-size: 12px;
  transition: all 0.25s;

  &:hover { color: #f56c6c; }
}

.rotating {
  animation: rotate 1s linear infinite;
}

@keyframes rotate {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

// 模态框动画
.modal-fade-enter-active {
  transition: opacity 0.2s ease;
  .task-modal { transition: transform 0.2s cubic-bezier(0.34, 1.56, 0.64, 1), opacity 0.2s ease; }
}
.modal-fade-leave-active {
  transition: opacity 0.15s ease;
  .task-modal { transition: transform 0.15s ease, opacity 0.15s ease; }
}
.modal-fade-enter-from {
  opacity: 0;
  .task-modal { transform: scale(0.88); opacity: 0; }
}
.modal-fade-leave-to {
  opacity: 0;
  .task-modal { transform: scale(0.95); opacity: 0; }
}
</style>
