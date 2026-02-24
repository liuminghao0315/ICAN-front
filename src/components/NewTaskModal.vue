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
              <label>视频平台链接 / 直接视频地址</label>
              <div class="url-input-wrap">
                <input
                  v-model="urlState.url"
                  class="neu-input"
                  :class="{
                    'has-error': urlState.validateError,
                    'has-warn': urlState.errorType === 'LOGIN_REQUIRED' || urlState.errorType === 'PLATFORM_RESTRICTED',
                    'is-valid': urlState.validatedTitle
                  }"
                  placeholder="粘贴平台链接或直接视频 URL（.mp4 / .flv 等）"
                  :disabled="urlState.status === 'validating' || urlState.status === 'submitting'"
                  @input="onUrlInput"
                  @paste="onUrlPaste"
                />
                <!-- 校验中 spinner -->
                <span class="url-status-icon validating" v-if="urlState.status === 'validating'">
                  <el-icon class="rotating"><Loading /></el-icon>
                </span>
                <!-- 校验通过 -->
                <span class="url-status-icon valid" v-else-if="urlState.validatedTitle">
                  <el-icon><CircleCheck /></el-icon>
                </span>
                <!-- 警告（需要 Cookie / 受限） -->
                <span class="url-status-icon warn" v-else-if="urlState.errorType === 'LOGIN_REQUIRED' || urlState.errorType === 'PLATFORM_RESTRICTED'">
                  <el-icon><Warning /></el-icon>
                </span>
                <!-- 错误 -->
                <span class="url-status-icon error" v-else-if="urlState.validateError">
                  <el-icon><CircleClose /></el-icon>
                </span>
              </div>

              <!-- ① 链接非法 / 不存在 -->
              <div class="field-error-block" v-if="urlState.validateError && urlState.errorType === 'INVALID_URL'">
                <el-icon><CircleClose /></el-icon>
                <span>{{ urlState.validateError }}</span>
              </div>

              <!-- ② 平台不支持 -->
              <div class="field-error-block" v-else-if="urlState.validateError && urlState.errorType === 'UNSUPPORTED'">
                <el-icon><CircleClose /></el-icon>
                <span>{{ urlState.validateError }}</span>
                <a class="inline-link" href="https://github.com/yt-dlp/yt-dlp/blob/master/supportedsites.md" target="_blank">查看支持平台列表 →</a>
              </div>

              <!-- ③ 平台受限（403 / 地区限制） -->
              <div class="field-warn-block" v-else-if="urlState.validateError && urlState.errorType === 'PLATFORM_RESTRICTED'">
                <el-icon><Warning /></el-icon>
                <div class="warn-content">
                  <span>{{ urlState.validateError }}</span>
                  <p class="warn-tip">尝试配置该平台的 Cookies 可能解决此问题</p>
                  <button class="cookie-trigger-btn" @click="cookiePanel.visible = !cookiePanel.visible">
                    <el-icon><Key /></el-icon>
                    {{ cookiePanel.visible ? '收起 Cookies 配置' : '配置 Cookies' }}
                  </button>
                </div>
              </div>

              <!-- ④ 需要登录 -->
              <div class="field-warn-block login-required" v-else-if="urlState.validateError && urlState.errorType === 'LOGIN_REQUIRED'">
                <el-icon><Lock /></el-icon>
                <div class="warn-content">
                  <span>{{ urlState.validateError }}</span>
                  <p class="warn-tip">该平台（如抖音）需要登录 Cookie 才能访问。请用浏览器插件导出 Cookies 后粘贴到下方。</p>
                  <button class="cookie-trigger-btn" @click="cookiePanel.visible = !cookiePanel.visible">
                    <el-icon><Key /></el-icon>
                    {{ cookiePanel.visible ? '收起 Cookies 配置' : '立即配置 Cookies' }}
                  </button>
                </div>
              </div>

              <!-- Cookie 配置面板（内嵌展开） -->
              <Transition name="panel-slide">
                <div class="cookie-panel" v-if="cookiePanel.visible">
                  <div class="cookie-panel-header">
                    <el-icon><Key /></el-icon>
                    <span>配置平台 Cookies</span>
                  </div>
                  <div class="cookie-steps">
                    <div class="step">
                      <span class="step-num">1</span>
                      <span>安装浏览器插件 <a class="inline-link" href="https://chrome.google.com/webstore/detail/get-cookiestxt-locally/cclelndahbckbenkjhflpdbgdldlbecc" target="_blank">Get cookies.txt LOCALLY</a></span>
                    </div>
                    <div class="step">
                      <span class="step-num">2</span>
                      <span>在浏览器中登录目标平台（如抖音），然后点击插件图标导出 cookies</span>
                    </div>
                    <div class="step">
                      <span class="step-num">3</span>
                      <span>将导出的文本内容粘贴到下方，点击保存</span>
                    </div>
                  </div>
                  <textarea
                    v-model="cookiePanel.content"
                    class="cookie-textarea"
                    placeholder="# Netscape HTTP Cookie File&#10;# 粘贴从插件导出的 cookies 内容..."
                    rows="6"
                    spellcheck="false"
                  />
                  <div class="cookie-panel-footer">
                    <span class="cookie-saved-tip" v-if="cookiePanel.saved">
                      <el-icon><CircleCheck /></el-icon> 已保存，重新验证中...
                    </span>
                    <button
                      class="neu-btn primary cookie-save-btn"
                      :disabled="cookiePanel.saving || !cookiePanel.content.trim()"
                      @click="handleSaveCookies"
                    >
                      <el-icon v-if="cookiePanel.saving"><Loading class="rotating" /></el-icon>
                      {{ cookiePanel.saving ? '保存中...' : '保存并重新验证' }}
                    </button>
                  </div>
                </div>
              </Transition>

              <!-- 校验通过：显示识别到的标题 -->
              <p class="field-hint valid" v-if="urlState.validatedTitle">
                <el-icon><VideoPlay /></el-icon>
                识别到：{{ urlState.validatedTitle }}
              </p>
              <!-- 默认提示 -->
              <p class="field-hint" v-else-if="!urlState.validateError">支持抖音、B站、YouTube 等主流平台，或直接粘贴 .mp4 / .flv 等视频地址（抖音每日限 20 条）</p>
            </div>
            <div class="form-field" v-if="urlState.validatedTitle">
              <label>标题（可选）</label>
              <input
                v-model="urlState.title"
                class="neu-input"
                :placeholder="urlState.validatedTitle || '不填则自动提取'"
                maxlength="100"
                :disabled="urlState.status === 'submitting'"
              />
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
import { createUrlImportTask, validateImportUrl, savePlatformCookies } from '@/api'
import { useUploadStore } from '@/stores/upload'
import { formatFileSize } from '@/types'

const props = defineProps<{
  visible: boolean
  /** 预填 URL（重试下载场景传入，弹窗打开后自动填入并触发校验） */
  prefillUrl?: string
}>()

const emit = defineEmits<{
  (e: 'update:visible', val: boolean): void
  (e: 'success'): void
  (e: 'task-created', task: import('@/types').AnalysisTaskVO): void
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
  status: 'idle' as 'idle' | 'validating' | 'submitting',
  /** 校验通过后识别到的真实标题 */
  validatedTitle: '' as string,
  /** 校验失败的错误信息 */
  validateError: '' as string,
  /**
   * 错误类型：INVALID_URL | UNSUPPORTED | PLATFORM_RESTRICTED | LOGIN_REQUIRED
   * 用于前端分级展示不同的引导 UI
   */
  errorType: '' as string,
})

// Cookie 配置面板状态
const cookiePanel = reactive({
  visible: false,
  content: '',
  saving: false,
  saved: false,
})

// 防抖 timer
let validateTimer: ReturnType<typeof setTimeout> | null = null
// 标记本次 input 事件是由粘贴触发的，避免 paste+input 双触发
let isPasting = false

// URL 输入时重置校验状态，并触发防抖校验
const onUrlInput = () => {
  // 粘贴触发的 input 事件由 onUrlPaste 统一处理，这里直接跳过
  if (isPasting) { isPasting = false; return }
  urlState.validatedTitle = ''
  urlState.validateError = ''
  if (validateTimer) clearTimeout(validateTimer)
  const url = urlState.url.trim()
  if (!url) return
  // 简单格式检查，避免对明显非 URL 的输入发请求
  if (!url.startsWith('http://') && !url.startsWith('https://')) return
  validateTimer = setTimeout(() => triggerValidate(), 800)
}

// 粘贴时立即触发校验（不等防抖）
const onUrlPaste = () => {
  isPasting = true
  if (validateTimer) clearTimeout(validateTimer)
  urlState.validatedTitle = ''
  urlState.validateError = ''
  // nextTick 后 v-model 才更新
  setTimeout(() => triggerValidate(), 50)
}

const triggerValidate = async () => {
  const url = urlState.url.trim()
  if (!url || urlState.status === 'validating') return
  urlState.status = 'validating'
  urlState.validatedTitle = ''
  urlState.validateError = ''
  urlState.errorType = ''
  try {
    const res = await validateImportUrl(url)
    if (res.code === 200 && res.data?.title) {
      urlState.validatedTitle = res.data.title
    } else {
      urlState.errorType = res.data?.errorType || 'INVALID_URL'
      urlState.validateError = res.data?.errorMessage || res.message || '无法解析该链接'
    }
  } catch (e: any) {
    const data = e.response?.data
    urlState.errorType = data?.data?.errorType || 'INVALID_URL'
    urlState.validateError = data?.data?.errorMessage || data?.message || e.message || '链接验证失败，请检查网络或链接是否有效'
  } finally {
    urlState.status = 'idle'
  }
}

const isSubmitting = computed(() =>
  localState.status === 'uploading' || urlState.status === 'submitting' || urlState.status === 'validating'
)

const canSubmit = computed(() => {
  if (activeTab.value === 'local') {
    return localState.file && localState.title.trim() && localState.status !== 'uploading'
  }
  // URL 模式：有 URL 且不在提交/校验中即可点击（点击后若未校验则先校验）
  return urlState.url.trim() && urlState.status === 'idle'
})

const submitText = computed(() => {
  if (activeTab.value === 'local') {
    if (localState.status === 'uploading') return `上传中 ${localState.progress}%`
    return '上传并分析'
  }
  if (urlState.status === 'validating') return '正在验证链接...'
  if (urlState.status === 'submitting') return '提交中...'
  if (urlState.validatedTitle) return '开始采集分析'
  return '验证并采集'
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
    // 预填 URL：切换到 URL tab 并自动触发校验
    if (props.prefillUrl) {
      activeTab.value = 'url'
      urlState.url = props.prefillUrl
      setTimeout(() => triggerValidate(), 50)
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
  urlState.validatedTitle = ''
  urlState.validateError = ''
  urlState.errorType = ''
  cookiePanel.visible = false
  cookiePanel.content = ''
  cookiePanel.saving = false
  cookiePanel.saved = false
  if (validateTimer) { clearTimeout(validateTimer); validateTimer = null }
  uploadRef.value?.clearFiles?.()
}

// 关闭模态框：上传中时允许后台继续，不硬控；URL校验/提交中禁止关闭
const handleClose = () => {
  if (localState.status === 'uploading') {
    ElMessage.info('上传任务已转入后台，可在顶部指示器查看进度')
  }
  // URL 校验中或提交中，禁止关闭弹窗
  if (urlState.status === 'validating' || urlState.status === 'submitting') {
    return
  }
  emit('update:visible', false)
}

// 中止上传（带完整异常捕获，防止 UI 卡死）
const handleAbortUpload = async () => {
  if (!localState.videoId) return
  const videoId = localState.videoId

  // 立即停止轮询 timer，防止 abort 期间 timer 触发 success 回调
  localState.status = 'pending'
  localState.progress = 0
  localState.videoId = ''

  try {
    await uploadStore.abortUpload(videoId)
  } catch {
    // 忽略中止过程中的错误
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
      // 如果 localState.videoId 已被清空（用户点了中止），立即停止轮询
      if (!localState.videoId) { clearInterval(timer); return }
      const task = uploadStore.tasks.find(t => t.videoId === videoId)
      if (!task) { clearInterval(timer); return }
      localState.progress = task.progress
      if (task.status === 'success') {
        clearInterval(timer)
        // 再次检查：如果在 success 触发前用户已点中止，不弹成功提示
        if (!localState.videoId || localState.status !== 'uploading') return
        localState.status = 'success'
        ElMessage.success('上传成功，分析任务已创建')
        emit('success')
        emit('update:visible', false)
      } else if (task.status === 'failed') {
        clearInterval(timer)
        if (localState.status !== 'uploading') return
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

// 保存 Cookie 并重新校验
const handleSaveCookies = async () => {
  if (!cookiePanel.content.trim()) {
    ElMessage.warning('请先粘贴 Cookies 内容')
    return
  }
  cookiePanel.saving = true
  try {
    const res = await savePlatformCookies(cookiePanel.content.trim())
    if (res.code === 200) {
      cookiePanel.saved = true
      ElMessage.success('Cookies 保存成功，正在重新验证链接...')
      cookiePanel.visible = false
      // 重新触发校验
      urlState.validateError = ''
      urlState.errorType = ''
      await triggerValidate()
    } else {
      ElMessage.error(res.message || '保存失败')
    }
  } catch (e: any) {
    ElMessage.error(e.message || '保存失败，请重试')
  } finally {
    cookiePanel.saving = false
  }
}

// URL导入：先确保校验通过，再提交
const handleUrlImport = async () => {
  const url = urlState.url.trim()
  if (!url) return

  // 若尚未校验（用户直接点按钮），先触发校验
  if (!urlState.validatedTitle && !urlState.validateError) {
    await triggerValidate()
  }

  // 校验失败：拦截，不创建任何记录
  if (!urlState.validatedTitle) {
    if (!urlState.validateError) {
      urlState.validateError = '请先等待链接验证完成'
    }
    return
  }

  // 校验通过：提交任务
  urlState.status = 'submitting'
  try {
    // 优先使用用户手填标题，否则用校验阶段识别到的真实标题
    const finalTitle = urlState.title.trim() || urlState.validatedTitle
    const res = await createUrlImportTask({
      url,
      title: finalTitle,
      taskType: 'FULL_ANALYSIS'
    })
    if (res.code === 200) {
      ElMessage.success('任务创建成功，视频正在下载中')
      // 校验通过才插入卡片，消除无效占位卡片
      emit('task-created', res.data)
      emit('success')
      emit('update:visible', false)
    } else {
      throw new Error(res.message || '创建失败')
    }
  } catch (error: any) {
    const msg = error.response?.data?.message || error.message || '创建失败，请重试'
    ElMessage.error(msg)
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

  &.has-error {
    box-shadow: inset 2px 2px 4px rgba(#e74c3c, 0.2), inset -2px -2px 4px $white;
  }
  &.is-valid {
    box-shadow: inset 2px 2px 4px rgba(#2ecc71, 0.2), inset -2px -2px 4px $white;
  }
}

// URL 输入框包裹层（含状态图标）
.url-input-wrap {
  position: relative;
  .neu-input { padding-right: 40px; }
  .url-status-icon {
    position: absolute;
    right: 12px;
    top: 50%;
    transform: translateY(-50%);
    font-size: 16px;
    display: flex;
    align-items: center;
    &.validating { color: $purple; }
    &.valid { color: #2ecc71; }
  }
}

// 字段提示 / 错误
.field-error {
  margin: 5px 0 0;
  font-size: 12px;
  color: #e74c3c;
  display: flex;
  align-items: center;
  gap: 4px;
}

// 分级错误块：链接非法 / 不支持
.field-error-block {
  display: flex;
  align-items: flex-start;
  gap: 6px;
  margin: 8px 0 0;
  padding: 10px 12px;
  border-radius: 10px;
  background: rgba(#e74c3c, 0.06);
  border-left: 3px solid #e74c3c;
  font-size: 12px;
  color: #c0392b;
  line-height: 1.5;

  .el-icon { flex-shrink: 0; margin-top: 1px; font-size: 13px; }
  .inline-link {
    color: $purple;
    text-decoration: none;
    margin-left: 4px;
    &:hover { text-decoration: underline; }
  }
}

// 分级警告块：受限 / 需要登录
.field-warn-block {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  margin: 8px 0 0;
  padding: 12px 14px;
  border-radius: 10px;
  background: rgba(#f39c12, 0.07);
  border-left: 3px solid #f39c12;
  font-size: 12px;
  color: #856404;
  line-height: 1.5;

  &.login-required {
    background: rgba(#e67e22, 0.07);
    border-left-color: #e67e22;
    color: #7d4e00;
  }

  > .el-icon { flex-shrink: 0; margin-top: 2px; font-size: 14px; color: #f39c12; }
  &.login-required > .el-icon { color: #e67e22; }

  .warn-content {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 4px;
  }

  .warn-tip {
    margin: 2px 0 6px;
    color: #6c5a00;
    font-size: 11px;
    line-height: 1.6;
  }

  .cookie-trigger-btn {
    display: inline-flex;
    align-items: center;
    gap: 5px;
    padding: 5px 12px;
    border: none;
    border-radius: 7px;
    background: $neu-1;
    box-shadow: 3px 3px 6px $neu-2, -3px -3px 6px $white;
    color: $purple;
    font-size: 12px;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s;
    align-self: flex-start;

    &:hover {
      box-shadow: 2px 2px 4px $neu-2, -2px -2px 4px $white;
    }
  }
}

// Cookie 配置面板
.cookie-panel {
  margin-top: 10px;
  padding: 16px;
  border-radius: 12px;
  background: $neu-1;
  box-shadow: inset 3px 3px 6px $neu-2, inset -3px -3px 6px $white;

  .cookie-panel-header {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 13px;
    font-weight: 600;
    color: $black;
    margin-bottom: 12px;
    .el-icon { color: $purple; }
  }

  .cookie-steps {
    display: flex;
    flex-direction: column;
    gap: 6px;
    margin-bottom: 12px;

    .step {
      display: flex;
      align-items: flex-start;
      gap: 8px;
      font-size: 12px;
      color: #555;
      line-height: 1.5;

      .step-num {
        flex-shrink: 0;
        width: 18px;
        height: 18px;
        border-radius: 50%;
        background: linear-gradient(135deg, $purple 0%, #7c9df7 100%);
        color: #fff;
        font-size: 10px;
        font-weight: 700;
        display: flex;
        align-items: center;
        justify-content: center;
        margin-top: 1px;
      }
    }
  }

  .cookie-textarea {
    width: 100%;
    padding: 10px 12px;
    font-size: 11px;
    font-family: 'Courier New', monospace;
    color: $black;
    background: $neu-1;
    border: none;
    border-radius: 8px;
    box-shadow: inset 2px 2px 4px $neu-2, inset -2px -2px 4px $white;
    outline: none;
    resize: vertical;
    line-height: 1.6;
    box-sizing: border-box;

    &::placeholder { color: $gray; font-family: 'Montserrat', sans-serif; }
  }

  .cookie-panel-footer {
    display: flex;
    align-items: center;
    justify-content: flex-end;
    gap: 10px;
    margin-top: 10px;

    .cookie-saved-tip {
      display: flex;
      align-items: center;
      gap: 4px;
      font-size: 12px;
      color: #27ae60;
      .el-icon { font-size: 13px; }
    }

    .cookie-save-btn {
      padding: 8px 16px;
      font-size: 12px;
    }
  }
}

// Cookie 面板展开动画
.panel-slide-enter-active { transition: all 0.25s ease; }
.panel-slide-leave-active { transition: all 0.2s ease; }
.panel-slide-enter-from { opacity: 0; transform: translateY(-8px); }
.panel-slide-leave-to { opacity: 0; transform: translateY(-4px); }

// URL 输入框 warn 状态
.neu-input.has-warn {
  box-shadow: inset 2px 2px 4px rgba(#f39c12, 0.2), inset -2px -2px 4px $white;
}

.inline-link {
  color: $purple;
  text-decoration: none;
  &:hover { text-decoration: underline; }
}
.field-hint {
  margin: 5px 0 0;
  font-size: 12px;
  color: $gray;
  display: flex;
  align-items: center;
  gap: 4px;
  &.valid { color: #27ae60; font-weight: 500; }
  .el-icon { font-size: 12px; }
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
