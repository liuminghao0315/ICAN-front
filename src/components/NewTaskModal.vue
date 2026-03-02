<template>
  <Teleport to="body">
    <Transition name="modal-fade">
      <div class="neu-modal-overlay" v-if="visible" @mousedown.self="onOverlayMouseDown" @mouseup.self="onOverlayMouseUp">
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

          <!-- 词库挂载配置区块（Slide Down） -->
          <Transition name="package-panel">
            <div class="package-panel" v-if="showPackagePanel">
              <div class="package-panel-header">
                <div class="package-panel-title">
                  <svg class="pp-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M12 2L2 7l10 5 10-5-10-5z"/>
                    <path d="M2 17l10 5 10-5"/>
                    <path d="M2 12l10 5 10-5"/>
                  </svg>
                  <span>挂载风险词库</span>
                  <span class="pp-optional">可选</span>
                  <el-tooltip
                    content="系统将根据选中的词库包，对视频语音/文本进行深度风险比对"
                    placement="top"
                    :show-after="200"
                  >
                    <svg class="pp-help" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                      <circle cx="12" cy="12" r="10"/>
                      <path d="M9.09 9a3 3 0 015.83 1c0 2-3 3-3 3"/>
                      <line x1="12" y1="17" x2="12.01" y2="17"/>
                    </svg>
                  </el-tooltip>
                </div>
                <span v-if="selectedPackageIds.length > 0" class="pp-selected-count">
                  已选 {{ selectedPackageIds.length }} 个
                </span>
              </div>

              <!-- 加载中 -->
              <div class="pp-loading" v-if="wordPacksLoading">
                <el-icon class="rotating"><Loading /></el-icon>
                <span>加载词库包...</span>
              </div>

              <!-- 空状态 -->
              <div class="pp-empty" v-else-if="wordPacks.length === 0">
                <span>暂无词库包，</span>
                <a class="pp-link" @click="router.push('/risk-dictionary'); emit('update:visible', false)">去创建</a>
              </div>

              <!-- 词库包标签阵列 -->
              <div class="pp-tags" v-else>
                <button
                  v-for="pack in wordPacks"
                  :key="pack.id"
                  class="pp-tag"
                  :class="{ 'is-selected': selectedPackageIds.includes(pack.id) }"
                  @click="togglePackage(pack.id)"
                >
                  <span
                    class="pp-tag-dot"
                    :style="{ background: levelColorMap[pack.level] }"
                  ></span>
                  <span class="pp-tag-name">{{ pack.name }}</span>
                  <span class="pp-tag-count" v-if="pack.wordCount">{{ pack.wordCount }}词</span>
                  <svg v-if="selectedPackageIds.includes(pack.id)" class="pp-tag-check" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                    <polyline points="20 6 9 17 4 12"/>
                  </svg>
                </button>
              </div>
            </div>
          </Transition>

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
import { ref, reactive, computed, watch, onMounted } from 'vue'
import { ElMessage, type UploadFile } from 'element-plus'
import { createUrlImportTask, validateImportUrl, savePlatformCookies, getWordPackBriefList } from '@/api'
import { useUploadStore } from '@/stores/upload'
import { formatFileSize } from '@/types'
import type { WordPackVO } from '@/types'
import { useRouter } from 'vue-router'

const router = useRouter()

const props = defineProps<{
  visible: boolean
  /** 预填 URL（重试下载场景传入，弹窗打开后自动填入并触发校验） */
  prefillUrl?: string
  /** 当前激活的文件夹 ID，新建任务时自动归入该文件夹 */
  folderId?: string
}>()

const emit = defineEmits<{
  (e: 'update:visible', val: boolean): void
  (e: 'success'): void
  (e: 'task-created', task: import('@/types').AnalysisTaskVO): void
}>()

// 模态框关闭逻辑：只有 mousedown 和 mouseup 都在外部才关闭
let mouseDownOnOverlay = false

const onOverlayMouseDown = () => {
  mouseDownOnOverlay = true
}

const onOverlayMouseUp = () => {
  if (mouseDownOnOverlay) {
    handleClose()
  }
  mouseDownOnOverlay = false
}

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

// 词库包状态
const wordPacks = ref<WordPackVO[]>([])
const selectedPackageIds = ref<string[]>([])
const wordPacksLoading = ref(false)

// 是否展示词库挂载区块（文件已选 or URL 已验证通过）
const showPackagePanel = computed(() => {
  if (activeTab.value === 'local') {
    return !!localState.file && localState.status !== 'uploading'
  }
  return !!urlState.validatedTitle
})

// 加载词库包列表
const loadWordPacks = async () => {
  if (wordPacks.value.length > 0) return
  wordPacksLoading.value = true
  try {
    const res = await getWordPackBriefList()
    if (res.code === 200) wordPacks.value = res.data || []
  } finally {
    wordPacksLoading.value = false
  }
}

// 切换词库包选中状态
const togglePackage = (id: string) => {
  const idx = selectedPackageIds.value.indexOf(id)
  if (idx === -1) selectedPackageIds.value.push(id)
  else selectedPackageIds.value.splice(idx, 1)
}

// 词库包风险等级颜色映射
const levelColorMap: Record<string, string> = {
  high: '#e74c3c',
  medium: '#f39c12',
  low: '#27ae60',
}

// 当展示词库面板时，自动加载
watch(showPackagePanel, (val) => {
  if (val) loadWordPacks()
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
  selectedPackageIds.value = []
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
    const videoId = await uploadStore.startUpload(
      file,
      localState.title.trim(),
      props.folderId,
      selectedPackageIds.value.length > 0 ? [...selectedPackageIds.value] : undefined
    )
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
      taskType: 'FULL_ANALYSIS',
      folderId: props.folderId,
      selectedPackageIds: selectedPackageIds.value.length > 0 ? [...selectedPackageIds.value] : undefined
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
  background: var(--bg-card);
  border: 1px solid var(--border-color);
  border-radius: 12px;
  padding: 28px;
  width: 480px;
  max-width: 90vw;
  max-height: 85vh;
  overflow-y: auto;
  box-shadow: none;
}

.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 20px;

  .modal-title {
    font-size: 17px;
    font-weight: 700;
    color: var(--text-primary);
    margin: 0;
  }

  .close-btn {
    width: 32px;
    height: 32px;
    border: 1px solid var(--border-color);
    border-radius: 8px;
    background: var(--bg-card);
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    color: var(--text-secondary);
    transition: all 0.25s;

    &:hover {
      color: #f56c6c;
      border-color: #f56c6c;
      background: #fef0f0;
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
    border: 1px solid var(--border-color);
    border-radius: 8px;
    background: var(--bg-card);
    color: var(--text-secondary);
    font-size: 13px;
    font-weight: 500;
    font-family: 'Montserrat', sans-serif;
    cursor: pointer;
    transition: all 0.25s;

    &:hover {
      color: var(--color-primary);
      border-color: var(--color-primary);
      background: rgba(64, 158, 255, 0.05);
    }

    &.active {
      background: linear-gradient(135deg, #409EFF 0%, #3a8ee6 100%);
      color: #fff !important;
      border-color: var(--color-primary);
      font-weight: 600;
      box-shadow: none;

      .el-icon {
        color: #fff !important;
      }

      span {
        color: #fff !important;
      }
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
      border: 2px dashed var(--border-color);
      border-radius: 12px;
      background: var(--bg-hover);
      transition: all 0.3s;

      &:hover {
        border-color: var(--color-primary);
        background: rgba(64, 158, 255, 0.02);
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
      background: var(--bg-card);
      border: 2px solid var(--border-color);
      display: flex;
      align-items: center;
      justify-content: center;
      color: var(--text-secondary);
      margin-bottom: 14px;
    }

    .upload-hint {
      font-size: 14px;
      color: var(--text-primary);
      margin: 0 0 6px;
      em { color: var(--color-primary); font-style: normal; font-weight: 500; }
    }

    .upload-tip {
      font-size: 12px;
      color: var(--text-secondary);
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
    border-radius: 8px;
    background: var(--bg-hover);
    border: 1px solid var(--border-color);
    margin-bottom: 16px;

    .file-icon-box {
      width: 44px;
      height: 44px;
      border-radius: 8px;
      background: var(--color-primary);
      display: flex;
      align-items: center;
      justify-content: center;
      color: #fff !important;
      flex-shrink: 0;
    }

    .file-meta {
      flex: 1;
      display: flex;
      flex-direction: column;
      gap: 2px;
      .file-name { font-size: 13px; font-weight: 600; color: var(--text-primary); word-break: break-all; }
      .file-size { font-size: 12px; color: var(--text-secondary); }
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
      background: var(--bg-hover);
      border: 1px solid var(--border-color);
      overflow: hidden;

      .progress-fill {
        height: 100%;
        background: var(--color-primary);
        border-radius: 3px;
        transition: width 0.3s;
      }
    }

    .progress-label {
      font-size: 12px;
      color: var(--color-primary);
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
    color: var(--text-primary);
    margin-bottom: 6px;
  }
}

.neu-input {
  width: 100%;
  padding: 12px 16px;
  font-size: 13px;
  color: var(--text-primary);
  background: var(--bg-card);
  border: 1px solid var(--border-color);
  border-radius: 8px;
  outline: none;
  font-family: 'Montserrat', sans-serif;
  transition: all 0.25s;

  &:focus {
    border-color: var(--color-primary);
    box-shadow: none;
  }

  &::placeholder { color: var(--text-secondary); }
  &:disabled { opacity: 0.5; }

  &.has-error {
    border-color: #e74c3c;
    background: rgba(231, 76, 60, 0.02);
  }
  &.is-valid {
    border-color: #2ecc71;
    background: rgba(46, 204, 113, 0.02);
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
    &.validating { color: var(--color-primary); }
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
  background: rgba(231, 76, 60, 0.06);
  
  font-size: 12px;
  color: #c0392b;
  line-height: 1.5;

  .el-icon { flex-shrink: 0; margin-top: 1px; font-size: 13px; }
  .inline-link {
    color: var(--color-primary);
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
  background: rgba(243, 156, 18, 0.07);
  
  font-size: 12px;
  color: #856404;
  line-height: 1.5;

  &.login-required {
    background: rgba(230, 126, 34, 0.07);
    
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
    color: var(--text-secondary);
    font-size: 11px;
    line-height: 1.6;
  }

  .cookie-trigger-btn {
    display: inline-flex;
    align-items: center;
    gap: 5px;
    padding: 5px 12px;
    border: 1px solid var(--border-color);
    border-radius: 8px;
    background: var(--bg-card);
    color: var(--color-primary);
    font-size: 12px;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s;
    align-self: flex-start;

    &:hover {
      border-color: var(--color-primary);
      background: rgba(64, 158, 255, 0.05);
    }
  }
}

// Cookie 配置面板
.cookie-panel {
  margin-top: 10px;
  padding: 16px;
  border-radius: 8px;
  background: var(--bg-hover);
  border: 1px solid var(--border-color);

  .cookie-panel-header {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 13px;
    font-weight: 600;
    color: var(--text-primary);
    margin-bottom: 12px;
    .el-icon { color: var(--color-primary); }
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
      color: var(--text-secondary);
      line-height: 1.5;

      .step-num {
        flex-shrink: 0;
        width: 18px;
        height: 18px;
        border-radius: 50%;
        background: var(--color-primary);
        color: #fff !important;
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
    color: var(--text-primary);
    background: var(--bg-card);
    border: 1px solid var(--border-color);
    border-radius: 8px;
    outline: none;
    resize: vertical;
    line-height: 1.6;
    box-sizing: border-box;

    &::placeholder { color: var(--text-secondary); font-family: 'Montserrat', sans-serif; }
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
  border-color: #f39c12;
  background: rgba(243, 156, 18, 0.02);
}

.inline-link {
  color: var(--color-primary);
  text-decoration: none;
  &:hover { text-decoration: underline; }
}
.field-hint {
  margin: 5px 0 0;
  font-size: 12px;
  color: var(--text-secondary);
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
  color: var(--text-secondary);
  padding: 10px 14px;
  border-radius: 10px;
  background: rgba(64, 158, 255, 0.06);

  .el-icon { color: var(--color-primary); font-size: 14px; }
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
  border-radius: 8px;
  font-size: 13px;
  font-weight: 500;
  font-family: 'Montserrat', sans-serif;
  cursor: pointer;
  transition: all 0.25s;

  &.cancel {
    background: var(--bg-card);
    color: var(--text-secondary);
    border: 1px solid var(--border-color);

    &:hover {
      color: var(--text-primary);
      border-color: var(--text-primary);
    }
  }

  &.primary {
    background: var(--color-primary);
    color: #fff !important;
    border: 1px solid var(--color-primary);
    display: flex;
    align-items: center;
    gap: 6px;

    &:hover:not(:disabled) {
      background: #3a8ee6;
      border-color: #3a8ee6;
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
  border: 1px solid var(--border-color);
  border-radius: 8px;
  background: var(--bg-card);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--text-secondary);
  font-size: 12px;
  transition: all 0.25s;

  &:hover {
    color: #f56c6c;
    border-color: #f56c6c;
    background: #fef0f0;
  }
}

.rotating {
  animation: rotate 1s linear infinite;
}

@keyframes rotate {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

// ===== 词库挂载配置面板 =====
.package-panel {
  margin-top: 16px;
  padding: 16px;
  border-radius: 8px;
  background: var(--bg-hover);
  border: 1px solid var(--border-color);
  overflow: hidden;
}

.package-panel-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
}

.package-panel-title {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  font-weight: 600;
  color: #444;

  .pp-icon {
    width: 14px;
    height: 14px;
    color: var(--color-primary);
    flex-shrink: 0;
  }

  .pp-optional {
    font-size: 10px;
    font-weight: 400;
    color: var(--text-secondary);
    padding: 1px 6px;
    border-radius: 20px;
    background: rgba(160, 165, 168, 0.1);
  }

  .pp-help {
    width: 13px;
    height: 13px;
    color: var(--text-secondary);
    cursor: help;
    flex-shrink: 0;
    transition: color 0.2s;

    &:hover { color: var(--color-primary); }
  }
}

.pp-selected-count {
  font-size: 11px;
  font-weight: 500;
  color: var(--color-primary);
  background: rgba(64, 158, 255, 0.08);
  padding: 2px 8px;
  border-radius: 20px;
}

.pp-loading {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  color: var(--text-secondary);
  padding: 4px 0;
}

.pp-empty {
  font-size: 12px;
  color: var(--text-secondary);
  padding: 4px 0;

  .pp-link {
    color: var(--color-primary);
    cursor: pointer;
    text-decoration: none;
    font-weight: 500;
    &:hover { text-decoration: underline; }
  }
}

.pp-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.pp-tag {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 6px 12px 6px 3px;
  border-radius: 20px;
  border: 1.5px solid var(--border-color);
  background: var(--bg-card);
  color: #6b7280;
  font-size: 12px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s cubic-bezier(0.34, 1.56, 0.64, 1);
  font-family: 'Montserrat', sans-serif;

  &:hover {
    border-color: var(--color-primary);
    color: var(--color-primary);
    background: rgba(64, 158, 255, 0.05);
  }

  &.is-selected {
    border-color: var(--color-primary);
    background: rgba(64, 158, 255, 0.1);
    color: var(--color-primary);
  }

  .pp-tag-dot {
    width: 6px;
    height: 6px;
    border-radius: 50%;
    flex-shrink: 0;
  }

  .pp-tag-name {
    line-height: 1;
  }

  .pp-tag-count {
    font-size: 10px;
    color: var(--text-secondary);
    opacity: 0.8;
  }

  &.is-selected .pp-tag-count {
    color: rgba(64, 158, 255, 0.6);
  }

  .pp-tag-check {
    width: 11px;
    height: 11px;
    flex-shrink: 0;
    color: var(--color-primary);
  }
}

// 词库面板展开动画（Slide Down）
.package-panel-enter-active {
  transition: all 0.32s cubic-bezier(0.4, 0, 0.2, 1);
  overflow: hidden;
}
.package-panel-leave-active {
  transition: all 0.22s cubic-bezier(0.4, 0, 0.2, 1);
  overflow: hidden;
}
.package-panel-enter-from {
  opacity: 0;
  max-height: 0;
  margin-top: 0;
  padding-top: 0;
  padding-bottom: 0;
}
.package-panel-enter-to {
  opacity: 1;
  max-height: 300px;
}
.package-panel-leave-from {
  opacity: 1;
  max-height: 300px;
}
.package-panel-leave-to {
  opacity: 0;
  max-height: 0;
  margin-top: 0;
  padding-top: 0;
  padding-bottom: 0;
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
