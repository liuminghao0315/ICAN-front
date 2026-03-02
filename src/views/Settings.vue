<template>
  <div class="settings-page">
    <div class="settings-container">

      <!-- ===== 头像上传 ===== -->
      <div class="settings-card avatar-card">
        <div class="card-header" @click="togglePanel('avatar')">
          <div class="card-header-left">
            <span class="card-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
                   stroke-linecap="round" stroke-linejoin="round">
                <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/>
                <circle cx="12" cy="7" r="4"/>
              </svg>
            </span>
            <div class="card-info">
              <div class="card-title">头像</div>
              <div class="card-desc">上传一张照片作为你的个人头像</div>
            </div>
          </div>
          <svg class="chevron" :class="{ open: openPanel === 'avatar' }" viewBox="0 0 24 24"
               fill="none" stroke="currentColor" stroke-width="2.5">
            <path d="M6 9l6 6 6-6" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        </div>

        <Transition name="panel">
        <div v-if="openPanel === 'avatar'" class="card-body avatar-body">
          <!-- 当前头像预览 -->
          <div class="current-avatar-wrap">
            <div class="current-avatar" :class="{ 'has-image': currentAvatarUrl }">
              <img v-if="currentAvatarUrl" :src="currentAvatarUrl" alt="当前头像" />
              <span v-else class="avatar-initials">{{ initials }}</span>
            </div>
            <div class="avatar-hint">当前头像</div>
          </div>

          <!-- 右侧操作区 -->
          <div class="avatar-editor">
            <!-- 未选图时：拖放 / 点击上传区 -->
            <div
              v-if="!rawImageSrc"
              class="drop-zone"
              :class="{ dragging: isDragging }"
              @click="triggerFilePicker"
              @dragover.prevent="isDragging = true"
              @dragleave.prevent="isDragging = false"
              @drop.prevent="handleFileDrop"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"
                   stroke-linecap="round" stroke-linejoin="round" class="drop-icon">
                <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/>
                <polyline points="17 8 12 3 7 8"/>
                <line x1="12" y1="3" x2="12" y2="15"/>
              </svg>
              <div class="drop-text">点击选择或拖拽图片至此</div>
              <div class="drop-hint">支持 JPG、PNG、WebP，最大 2 MB</div>
            </div>

            <!-- 已选图时：Canvas 裁剪器 -->
            <div v-else class="cropper-wrap">
              <div class="canvas-container">
                <!-- 离屏 canvas 用于绘制图像，交互层叠加在上面 -->
                <canvas
                  ref="cropCanvas"
                  class="crop-canvas"
                  @mousedown="startDrag"
                  @mousemove="onDrag"
                  @mouseup="stopDrag"
                  @mouseleave="stopDrag"
                  @touchstart.prevent="startTouchDrag"
                  @touchmove.prevent="onTouchDrag"
                  @touchend.prevent="stopDrag"
                  @wheel.prevent="onWheel"
                />
                <!-- 圆形遮罩（纯 CSS，不参与裁剪逻辑） -->
                <div class="circle-overlay" />
              </div>

              <div class="crop-controls">
                <span class="scale-label">缩放</span>
                <input
                  type="range"
                  :min="fitScale"
                  max="3"
                  step="0.01"
                  v-model.number="scale"
                  class="scale-slider"
                  @input="drawCanvas"
                />
                <span class="scale-value">{{ Math.round(scale * 100) }}%</span>
                <button class="btn-text-sm" @click="resetCrop">重置</button>
                <button class="btn-text-sm danger" @click="clearImage">重新选择</button>
              </div>

              <div v-if="cropError" class="form-error">{{ cropError }}</div>

              <div class="form-actions crop-actions">
                <button class="btn-secondary" @click="clearImage">取消</button>
                <button class="btn-primary" :disabled="uploading" @click="handleUpload">
                  {{ uploading ? '上传中...' : '保存头像' }}
                </button>
              </div>
            </div>
          </div>
        </div>
        </Transition>
        <!-- 隐藏文件选择器 -->
        <input
          ref="fileInputRef"
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif"
          style="display:none"
          @change="handleFileChange"
        />
      </div>

      <!-- ===== 修改密码 ===== -->
      <div class="settings-card">
        <div class="card-header" @click="togglePanel('changePwd')">
          <div class="card-header-left">
            <span class="card-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
                   stroke-linecap="round" stroke-linejoin="round">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                <path d="M7 11V7a5 5 0 0110 0v4"/>
              </svg>
            </span>
            <div class="card-info">
              <div class="card-title">修改密码</div>
              <div class="card-desc">定期更换密码有助于保护账号安全</div>
            </div>
          </div>
          <svg class="chevron" :class="{ open: openPanel === 'changePwd' }" viewBox="0 0 24 24"
               fill="none" stroke="currentColor" stroke-width="2.5">
            <path d="M6 9l6 6 6-6" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        </div>

        <Transition name="panel">
          <div v-if="openPanel === 'changePwd'" class="card-body">
            <div class="form-group">
              <label>验证码</label>
              <div class="input-with-btn">
                <input v-model="pwdForm.verifyCode" type="text" placeholder="发送到当前绑定邮箱"
                       inputmode="numeric" autocomplete="one-time-code"/>
                <button class="btn-send" :disabled="pwdSending || pwdCooldown > 0"
                        @click="handleSendPwdCode">
                  {{ pwdCooldown > 0 ? `${pwdCooldown}s` : (pwdSending ? '发送中' : '发送验证码') }}
                </button>
              </div>
              <div class="form-hint">验证码将发送至：{{ userStore.userInfo?.email || '未绑定邮箱' }}</div>
            </div>
            <div class="form-group">
              <label>新密码</label>
              <input v-model="pwdForm.newPwd" type="password" placeholder="6-20个字符"
                     autocomplete="new-password"/>
            </div>
            <div class="form-group">
              <label>确认新密码</label>
              <input v-model="pwdForm.confirmPwd" type="password" placeholder="再次输入新密码"
                     autocomplete="new-password"/>
            </div>
            <div v-if="pwdError" class="form-error">{{ pwdError }}</div>
            <div class="form-actions">
              <button class="btn-secondary" @click="resetPwdForm">取消</button>
              <button class="btn-primary" :disabled="pwdLoading" @click="handleChangePwd">
                {{ pwdLoading ? '保存中...' : '保存修改' }}
              </button>
            </div>
          </div>
        </Transition>
      </div>

      <!-- ===== 变更邮箱 ===== -->
      <div class="settings-card">
        <div class="card-header" @click="togglePanel('changeEmail')">
          <div class="card-header-left">
            <span class="card-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
                   stroke-linecap="round" stroke-linejoin="round">
                <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
                <polyline points="22,6 12,13 2,6"/>
              </svg>
            </span>
            <div class="card-info">
              <div class="card-title">变更绑定邮箱</div>
              <div class="card-desc">
                当前邮箱：<span class="current-email">{{ userStore.userInfo?.email || '未绑定' }}</span>
              </div>
            </div>
          </div>
          <svg class="chevron" :class="{ open: openPanel === 'changeEmail' }" viewBox="0 0 24 24"
               fill="none" stroke="currentColor" stroke-width="2.5">
            <path d="M6 9l6 6 6-6" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        </div>

        <Transition name="panel">
          <div v-if="openPanel === 'changeEmail'" class="card-body">
            <template v-if="emailStep === 1">
              <div class="form-group">
                <label>新邮箱地址</label>
                <div class="input-with-btn">
                  <input v-model="emailForm.newEmail" type="email"
                         placeholder="支持QQ、163、126邮箱" autocomplete="email"/>
                  <button class="btn-send" :disabled="emailSending || emailCooldown > 0"
                          @click="handleSendEmailCode">
                    {{ emailCooldown > 0 ? `${emailCooldown}s` : (emailSending ? '发送中' : '发送验证码') }}
                  </button>
                </div>
              </div>
              <div class="form-group">
                <label>验证码</label>
                <input v-model="emailForm.verifyCode" type="text"
                       placeholder="请输入邮箱收到的验证码"
                       inputmode="numeric" autocomplete="one-time-code"/>
              </div>
              <div v-if="emailError" class="form-error">{{ emailError }}</div>
              <div class="form-actions">
                <button class="btn-secondary" @click="resetEmailForm">取消</button>
                <button class="btn-primary" :disabled="emailLoading" @click="handleChangeEmail">
                  {{ emailLoading ? '验证中...' : '下一步' }}
                </button>
              </div>
            </template>

            <template v-else-if="emailStep === 2">
              <div class="success-message">
                <svg class="success-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                     stroke-width="2">
                  <path d="M22 11.08V12a10 10 0 11-5.93-9.14" stroke-linecap="round"
                        stroke-linejoin="round"/>
                  <polyline points="22 4 12 14.01 9 11.01" stroke-linecap="round"
                            stroke-linejoin="round"/>
                </svg>
                <div class="success-title">邮箱变更成功</div>
                <div class="success-desc">新邮箱：{{ emailForm.newEmail }}</div>
              </div>
              <div class="form-actions">
                <button class="btn-primary full-width" @click="resetEmailForm">完成</button>
              </div>
            </template>
          </div>
        </Transition>
      </div>

    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onUnmounted, nextTick, watch } from 'vue'
import { useUserStore } from '@/stores'
import { changePwd, sendMailToChangePwd, sendMailToChangeEmail, changeEmail, uploadAvatar } from '@/api'
import { ElMessage } from 'element-plus'

const userStore = useUserStore()

// ── 用户首字母（头像无图时显示）──────────────────────────────────────────
const initials = computed(() =>
  (userStore.userInfo?.username || '用').charAt(0).toUpperCase()
)

const currentAvatarUrl = computed(() => userStore.userInfo?.avatarUrl || '')

// ── 面板展开控制 ─────────────────────────────────────────────────────────
const openPanel = ref<'avatar' | 'changePwd' | 'changeEmail' | null>(null)
function togglePanel(panel: 'avatar' | 'changePwd' | 'changeEmail') {
  openPanel.value = openPanel.value === panel ? null : panel
}

// ═══════════════════════════════════════════════════════════════════════════
// 头像上传 + Canvas 圆形裁剪
// ═══════════════════════════════════════════════════════════════════════════

const CANVAS_SIZE = 280  // 裁剪区边长（px），圆形直径

const fileInputRef = ref<HTMLInputElement | null>(null)
const cropCanvas   = ref<HTMLCanvasElement | null>(null)

const rawImageSrc  = ref('')   // 选中图片的 base64 DataURL
const isDragging   = ref(false)
const uploading    = ref(false)
const cropError    = ref('')

// 裁剪参数
const scale        = ref(1)
const fitScale     = ref(0.1)   // 填满圆所需的最小比例，作为滑块下限
const offsetX      = ref(0)
const offsetY      = ref(0)

// 拖拽状态
let dragging = false
let lastX = 0
let lastY = 0

// 图片对象（用于 canvas 绘制）
let img: HTMLImageElement | null = null

// ─── 文件选取 ──────────────────────────────────────────────────────────

function triggerFilePicker() {
  fileInputRef.value?.click()
}

function handleFileChange(e: Event) {
  const file = (e.target as HTMLInputElement).files?.[0]
  if (file) loadFile(file)
  // 清空 input，允许重复选同一文件
  if (fileInputRef.value) fileInputRef.value.value = ''
}

function handleFileDrop(e: DragEvent) {
  isDragging.value = false
  const file = e.dataTransfer?.files[0]
  if (file) loadFile(file)
}

function loadFile(file: File) {
  if (!file.type.startsWith('image/')) {
    ElMessage.warning('请选择图片文件（JPG / PNG / WebP）')
    return
  }
  if (file.size > 2 * 1024 * 1024) {
    ElMessage.warning('图片不能超过 2 MB')
    return
  }
  const reader = new FileReader()
  reader.onload = (ev) => {
    rawImageSrc.value = ev.target?.result as string
    scale.value = 1
    offsetX.value = 0
    offsetY.value = 0
    cropError.value = ''
    nextTick(() => initCanvas())
  }
  reader.readAsDataURL(file)
}

// ─── Canvas 初始化 ─────────────────────────────────────────────────────

function initCanvas() {
  const canvas = cropCanvas.value
  if (!canvas) return
  canvas.width  = CANVAS_SIZE
  canvas.height = CANVAS_SIZE

  img = new Image()
  img.onload = () => {
    fitImageToCanvas()
    drawCanvas()
  }
  img.src = rawImageSrc.value
}

/** 让图片以适合比例居中填满圆形区域，初始不留白；同时更新滑块下限 */
function fitImageToCanvas() {
  if (!img) return
  const ratio = Math.max(CANVAS_SIZE / img.width, CANVAS_SIZE / img.height)
  fitScale.value = parseFloat(ratio.toFixed(4))
  scale.value    = fitScale.value
  offsetX.value  = (CANVAS_SIZE - img.width  * ratio) / 2
  offsetY.value  = (CANVAS_SIZE - img.height * ratio) / 2
}

/** 钳制偏移量，确保图片四边始终覆盖整个 canvas，不露出空白 */
function clampOffset() {
  if (!img) return
  const w = img.width  * scale.value
  const h = img.height * scale.value
  offsetX.value = Math.min(0, Math.max(CANVAS_SIZE - w, offsetX.value))
  offsetY.value = Math.min(0, Math.max(CANVAS_SIZE - h, offsetY.value))
}

/** 重绘 canvas */
function drawCanvas() {
  const canvas = cropCanvas.value
  if (!canvas || !img) return
  const ctx = canvas.getContext('2d')!
  ctx.clearRect(0, 0, CANVAS_SIZE, CANVAS_SIZE)
  ctx.drawImage(
    img,
    offsetX.value,
    offsetY.value,
    img.width  * scale.value,
    img.height * scale.value
  )
}

// 监听 scale 变化时重绘（滑块），缩放后重新钳制偏移
watch(scale, () => { clampOffset(); drawCanvas() })

// 面板重新展开时，若有未保存的图片则重新初始化 canvas 尺寸并重绘
// （v-if 会销毁并重建 canvas DOM，需重置 width/height 否则比例错误）
watch(
  () => openPanel.value === 'avatar',
  (isOpen) => {
    if (!isOpen || !rawImageSrc.value || !img) return
    nextTick(() => {
      const canvas = cropCanvas.value
      if (!canvas) return
      canvas.width  = CANVAS_SIZE
      canvas.height = CANVAS_SIZE
      drawCanvas()
    })
  }
)

// ─── 拖拽移动图片 ───────────────────────────────────────────────────────

function startDrag(e: MouseEvent) {
  dragging = true; lastX = e.clientX; lastY = e.clientY
}
function onDrag(e: MouseEvent) {
  if (!dragging) return
  offsetX.value += e.clientX - lastX
  offsetY.value += e.clientY - lastY
  lastX = e.clientX; lastY = e.clientY
  clampOffset()
  drawCanvas()
}
function stopDrag() { dragging = false }

function startTouchDrag(e: TouchEvent) {
  lastX = e.touches[0].clientX; lastY = e.touches[0].clientY
}
function onTouchDrag(e: TouchEvent) {
  offsetX.value += e.touches[0].clientX - lastX
  offsetY.value += e.touches[0].clientY - lastY
  lastX = e.touches[0].clientX; lastY = e.touches[0].clientY
  clampOffset()
  drawCanvas()
}

function onWheel(e: WheelEvent) {
  scale.value = Math.min(3, Math.max(fitScale.value, scale.value - e.deltaY * 0.001))
  clampOffset()
  drawCanvas()
}

function resetCrop() {
  fitImageToCanvas()
  drawCanvas()
}

function clearImage() {
  rawImageSrc.value = ''
  img = null
  cropError.value = ''
}

// ─── 裁剪并上传 ────────────────────────────────────────────────────────

async function handleUpload() {
  const canvas = cropCanvas.value
  if (!canvas) return
  cropError.value = ''
  uploading.value = true
  try {
    // 输出圆形裁剪：先在离屏 canvas 上绘圆形 clip 路径，再 toBlob
    const offscreen = document.createElement('canvas')
    offscreen.width  = CANVAS_SIZE
    offscreen.height = CANVAS_SIZE
    const ctx = offscreen.getContext('2d')!

    // 圆形裁剪蒙版
    ctx.beginPath()
    ctx.arc(CANVAS_SIZE / 2, CANVAS_SIZE / 2, CANVAS_SIZE / 2, 0, Math.PI * 2)
    ctx.clip()

    // 将可视 canvas 内容绘入离屏
    ctx.drawImage(canvas, 0, 0)

    const blob: Blob = await new Promise((resolve, reject) => {
      offscreen.toBlob(b => b ? resolve(b) : reject(new Error('导出失败')), 'image/png', 1)
    })

    const res = await uploadAvatar(blob, 'avatar.png')
    if (res.code === 200 && res.data?.avatarUrl) {
      userStore.setAvatarUrl(res.data.avatarUrl)
      clearImage()
      ElMessage.success('头像更新成功')
    } else {
      cropError.value = res.message || '上传失败，请重试'
    }
  } catch (err: any) {
    cropError.value = err.message || '上传失败，请重试'
  } finally {
    uploading.value = false
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// 修改密码
// ═══════════════════════════════════════════════════════════════════════════

const pwdForm     = ref({ verifyCode: '', newPwd: '', confirmPwd: '' })
const pwdError    = ref('')
const pwdLoading  = ref(false)
const pwdSending  = ref(false)
const pwdCooldown = ref(0)
let pwdCooldownTimer: ReturnType<typeof setInterval> | null = null

function startPwdCooldown() {
  pwdCooldown.value = 60
  pwdCooldownTimer = setInterval(() => {
    pwdCooldown.value--
    if (pwdCooldown.value <= 0 && pwdCooldownTimer) {
      clearInterval(pwdCooldownTimer); pwdCooldownTimer = null
    }
  }, 1000)
}

function resetPwdForm() {
  pwdForm.value = { verifyCode: '', newPwd: '', confirmPwd: '' }
  pwdError.value = ''
  openPanel.value = null
}

async function handleSendPwdCode() {
  if (!userStore.userInfo?.email) { ElMessage.warning('请先绑定邮箱'); return }
  pwdSending.value = true
  try {
    await sendMailToChangePwd()
    ElMessage.success('验证码已发送')
    startPwdCooldown()
  } catch (err: any) {
    ElMessage.error(err.message || '发送失败')
  } finally {
    pwdSending.value = false
  }
}

async function handleChangePwd() {
  pwdError.value = ''
  const { verifyCode, newPwd, confirmPwd } = pwdForm.value
  if (!verifyCode || !newPwd || !confirmPwd) { pwdError.value = '请填写完整信息'; return }
  if (newPwd.length < 6 || newPwd.length > 20) { pwdError.value = '密码长度应为6-20个字符'; return }
  if (newPwd !== confirmPwd) { pwdError.value = '两次输入的密码不一致'; return }
  pwdLoading.value = true
  try {
    await changePwd(verifyCode, newPwd)
    ElMessage.success('密码修改成功')
    resetPwdForm()
  } catch (err: any) {
    pwdError.value = err.message || '修改失败'
  } finally {
    pwdLoading.value = false
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// 变更邮箱
// ═══════════════════════════════════════════════════════════════════════════

const emailForm     = ref({ newEmail: '', verifyCode: '' })
const emailError    = ref('')
const emailLoading  = ref(false)
const emailSending  = ref(false)
const emailCooldown = ref(0)
const emailStep     = ref(1)
let emailCooldownTimer: ReturnType<typeof setInterval> | null = null

function startEmailCooldown() {
  emailCooldown.value = 60
  emailCooldownTimer = setInterval(() => {
    emailCooldown.value--
    if (emailCooldown.value <= 0 && emailCooldownTimer) {
      clearInterval(emailCooldownTimer); emailCooldownTimer = null
    }
  }, 1000)
}

function resetEmailForm() {
  emailForm.value = { newEmail: '', verifyCode: '' }
  emailError.value = ''
  emailStep.value = 1
  openPanel.value = null
}

async function handleSendEmailCode() {
  const { newEmail } = emailForm.value
  if (!newEmail) { ElMessage.warning('请输入新邮箱地址'); return }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(newEmail)) { ElMessage.warning('邮箱格式不正确'); return }
  emailSending.value = true
  try {
    await sendMailToChangeEmail(newEmail)
    ElMessage.success('验证码已发送')
    startEmailCooldown()
  } catch (err: any) {
    ElMessage.error(err.message || '发送失败')
  } finally {
    emailSending.value = false
  }
}

async function handleChangeEmail() {
  emailError.value = ''
  const { newEmail, verifyCode } = emailForm.value
  if (!newEmail || !verifyCode) { emailError.value = '请填写完整信息'; return }
  emailLoading.value = true
  try {
    await changeEmail(newEmail, verifyCode)
    await userStore.fetchUserInfo?.()
    emailStep.value = 2
    ElMessage.success('邮箱变更成功')
  } catch (err: any) {
    emailError.value = err.message || '变更失败'
  } finally {
    emailLoading.value = false
  }
}

// ─── 清理定时器 ──────────────────────────────────────────────────────────
onUnmounted(() => {
  if (pwdCooldownTimer)   clearInterval(pwdCooldownTimer)
  if (emailCooldownTimer) clearInterval(emailCooldownTimer)
})
</script>

<style scoped>
/* ===== 页面布局 ===== */
.settings-page {
  min-height: 100vh;
  background: var(--bg-page);
  padding: 32px 24px;
}

.settings-container {
  max-width: 680px;
  margin: 0 auto;
}

/* ===== 扁平化卡片 ===== */
.settings-card {
  background: var(--bg-card);
  border: 1px solid var(--border-color);
  border-radius: 12px;
  margin-bottom: 24px;
  box-shadow: none;
  transition: border-color 0.3s ease;
}

.settings-card:hover {
  border-color: var(--color-primary);
}

/* ===== 卡片头部 ===== */
.card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 28px 28px 24px;
  cursor: pointer;
  user-select: none;
}

.static-header {
  cursor: default;
  padding-bottom: 0;
}

.card-header-left {
  display: flex;
  align-items: flex-start;
  gap: 18px;
  flex: 1;
}

.card-icon {
  width: 48px;
  height: 48px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--bg-icon);
  color: var(--color-primary);
  flex-shrink: 0;
  margin-top: -2px;
}

.card-icon svg {
  width: 24px;
  height: 24px;
}

.card-info {
  flex: 1;
  padding-top: 2px;
}

.card-title {
  font-size: 17px;
  font-weight: 600;
  color: var(--text-primary);
  margin-bottom: 6px;
  letter-spacing: -0.01em;
}

.card-desc {
  font-size: 13px;
  color: var(--text-secondary);
  line-height: 1.6;
}

.current-email {
  color: var(--color-primary);
  font-weight: 500;
}

.chevron {
  width: 22px;
  height: 22px;
  color: var(--text-tertiary);
  transition: transform 0.25s ease;
  flex-shrink: 0;
  margin-top: 2px;
}

.chevron.open {
  transform: rotate(180deg);
}

/* ===== 卡片内容 ===== */
.card-body {
  padding: 0 28px 28px;
}

/* ===== 头像区布局 ===== */
.avatar-body {
  display: flex;
  gap: 32px;
  align-items: center;
  padding: 20px 28px 28px;
}

.current-avatar-wrap {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
  flex-shrink: 0;
}

.current-avatar {
  width: 88px;
  height: 88px;
  border-radius: 50%;
  overflow: hidden;
  background: linear-gradient(135deg, #409EFF 0%, #3072F6 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  border: 2px solid var(--border-color);
  transition: border-color 0.3s;
}

.current-avatar.has-image {
  border-color: var(--border-color);
}

.current-avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.avatar-initials {
  font-size: 36px;
  font-weight: 700;
  color: #fff !important;
  line-height: 1;
  user-select: none;
}

.avatar-hint {
  font-size: 12px;
  color: var(--text-tertiary);
}

/* ===== 拖放区 ===== */
.avatar-editor {
  flex: 1;
  min-width: 0;
}

.drop-zone {
  border: 2px dashed var(--border-color);
  border-radius: 12px;
  padding: 36px 24px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1);
  background: var(--bg-hover);
}

.drop-zone:hover,
.drop-zone.dragging {
  border-color: var(--color-primary);
  background: rgba(64, 158, 255, 0.06);
}

.drop-icon {
  width: 40px;
  height: 40px;
  color: var(--text-tertiary);
  transition: color 0.3s;
}

.drop-zone:hover .drop-icon,
.drop-zone.dragging .drop-icon {
  color: var(--color-primary);
}

.drop-text {
  font-size: 14px;
  font-weight: 500;
  color: var(--text-secondary);
}

.drop-hint {
  font-size: 12px;
  color: var(--text-tertiary);
}

/* ===== Canvas 裁剪器 ===== */
.cropper-wrap {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 14px;
  width: 100%;
}

.crop-actions {
  width: 100%;
  margin-top: 4px;
}

.canvas-container {
  position: relative;
  width: 280px;
  height: 280px;
  border-radius: 50%;
  overflow: hidden;
  border: 1.5px solid rgba(64, 158, 255, 0.35);
  box-shadow: 0 0 0 4px rgba(64, 158, 255, 0.06);
  flex-shrink: 0;
}

.crop-canvas {
  display: block;
  cursor: grab;
  width: 280px;
  height: 280px;
}

.crop-canvas:active {
  cursor: grabbing;
}

/* 纯 CSS 圆形遮罩（不参与裁剪，仅视觉提示） */
.circle-overlay {
  position: absolute;
  inset: 0;
  border-radius: 50%;
  box-shadow: 0 0 0 9999px rgba(0, 0, 0, 0.42);
  pointer-events: none;
}

/* ===== 缩放控制条 ===== */
.crop-controls {
  display: flex;
  align-items: center;
  gap: 10px;
  width: 100%;
}

.scale-label,
.scale-value {
  font-size: 12px;
  color: var(--text-secondary);
  white-space: nowrap;
  flex-shrink: 0;
}

.scale-slider {
  flex: 1;
  height: 4px;
  -webkit-appearance: none;
  appearance: none;
  background: var(--border-color);
  border-radius: 2px;
  outline: none;
  cursor: pointer;
  transition: background 0.2s;
}

.scale-slider::-webkit-slider-thumb {
  -webkit-appearance: none;
  appearance: none;
  width: 16px;
  height: 16px;
  border-radius: 50%;
  background: var(--color-primary);
  cursor: pointer;
  transition: transform 0.2s;
}

.scale-slider::-webkit-slider-thumb:hover {
  transform: scale(1.2);
}

.scale-slider::-moz-range-thumb {
  width: 16px;
  height: 16px;
  border-radius: 50%;
  background: var(--color-primary);
  cursor: pointer;
  border: none;
}

.btn-text-sm {
  background: none;
  border: none;
  font-size: 12px;
  color: var(--text-secondary);
  cursor: pointer;
  padding: 2px 6px;
  border-radius: 4px;
  transition: all 0.2s;
  white-space: nowrap;
}

.btn-text-sm:hover {
  color: var(--color-primary);
  background: rgba(64, 158, 255, 0.08);
}

.btn-text-sm.danger:hover {
  color: #f56c6c;
  background: rgba(245, 108, 108, 0.08);
}

/* ===== 通用表单 ===== */
.form-group {
  margin-bottom: 22px;
}

.form-group:last-of-type {
  margin-bottom: 26px;
}

.form-group label {
  display: block;
  font-size: 13px;
  font-weight: 600;
  color: var(--text-primary);
  margin-bottom: 10px;
  letter-spacing: -0.01em;
}

.form-group input {
  width: 100%;
  height: 46px;
  padding: 0 18px;
  font-size: 14px;
  color: var(--text-primary);
  background: var(--bg-input);
  border: 1px solid var(--border-color);
  border-radius: 8px;
  transition: border-color 0.2s ease;
  outline: none;
}

.form-group input:focus {
  border-color: var(--color-primary);
}

.form-group input::placeholder {
  color: var(--text-tertiary);
}

.input-with-btn {
  display: flex;
  gap: 10px;
}

.input-with-btn input {
  flex: 1;
}

.btn-send {
  height: 46px;
  padding: 0 22px;
  font-size: 13px;
  font-weight: 600;
  color: var(--color-primary);
  background: var(--bg-input);
  border: 1px solid var(--border-color);
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s ease;
  white-space: nowrap;
  flex-shrink: 0;
}

.btn-send:hover:not(:disabled) {
  border-color: var(--color-primary);
  transform: translateY(-1px);
}

.btn-send:active:not(:disabled) {
  transform: translateY(1px);
}

.btn-send:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.form-hint {
  font-size: 12px;
  color: var(--text-tertiary);
  margin-top: 8px;
  line-height: 1.5;
}

.form-error {
  padding: 14px 18px;
  font-size: 13px;
  color: #ff4d4f;
  background: rgba(255, 77, 79, 0.1);
  border-radius: 8px;
  margin-bottom: 18px;
  line-height: 1.5;
}

/* ===== 按钮组 ===== */
.form-actions {
  display: flex;
  gap: 12px;
  margin-top: 28px;
}

.btn-secondary,
.btn-primary {
  flex: 1;
  height: 46px;
  font-size: 14px;
  font-weight: 600;
  border: 1px solid var(--border-color);
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s ease;
  letter-spacing: -0.01em;
}

.btn-secondary {
  color: var(--text-secondary);
  background: var(--bg-input);
}

.btn-secondary:hover {
  border-color: var(--color-primary);
  color: var(--color-primary);
  transform: translateY(-1px);
}

.btn-secondary:active {
  transform: translateY(1px);
}

.btn-primary {
  color: #ffffff;
  background: var(--color-primary);
  border-color: var(--color-primary);
}

.btn-primary:hover:not(:disabled) {
  background: #66b1ff;
  border-color: #66b1ff;
  transform: translateY(-1px);
}

.btn-primary:active:not(:disabled) {
  transform: translateY(1px);
}

.btn-primary:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.btn-primary.full-width {
  width: 100%;
}

/* ===== 成功提示 ===== */
.success-message {
  text-align: center;
  padding: 36px 0;
}

.success-icon {
  width: 68px;
  height: 68px;
  color: #52c41a;
  margin: 0 auto 18px;
}

.success-title {
  font-size: 18px;
  font-weight: 600;
  color: var(--text-primary);
  margin-bottom: 10px;
  letter-spacing: -0.01em;
}

.success-desc {
  font-size: 14px;
  color: var(--text-secondary);
  line-height: 1.5;
}

/* ===== 过渡动画 ===== */
.panel-enter-active,
.panel-leave-active {
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  overflow: hidden;
}

.panel-enter-from,
.panel-leave-to {
  max-height: 0;
  opacity: 0;
  transform: translateY(-8px);
}

.panel-enter-to,
.panel-leave-from {
  max-height: 600px;
  opacity: 1;
  transform: translateY(0);
}

/* ===== 响应式 ===== */
@media (max-width: 768px) {
  .settings-page {
    padding: 24px 16px;
  }

  .avatar-body {
    flex-direction: column;
    align-items: center;
  }

  .canvas-container {
    width: 240px;
    height: 240px;
  }

  .crop-canvas {
    width: 240px;
    height: 240px;
  }

  .card-header {
    padding: 24px 22px 20px;
  }

  .card-body {
    padding: 0 22px 24px;
  }

  .card-icon {
    width: 44px;
    height: 44px;
  }

  .card-icon svg {
    width: 22px;
    height: 22px;
  }

  .input-with-btn {
    flex-direction: column;
    gap: 12px;
  }

  .btn-send {
    width: 100%;
  }
}
</style>
