<template>
  <div class="settings-page">
    <div class="settings-container">
      <!-- 修改密码 -->
      <div class="settings-card">
        <div class="card-header" @click="togglePanel('changePwd')">
          <div class="card-header-left">
            <span class="card-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                <path d="M7 11V7a5 5 0 0110 0v4"/>
              </svg>
            </span>
            <div class="card-info">
              <div class="card-title">修改密码</div>
              <div class="card-desc">定期更换密码有助于保护账号安全</div>
            </div>
          </div>
          <svg class="chevron" :class="{ open: openPanel === 'changePwd' }" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
            <path d="M6 9l6 6 6-6" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        </div>

        <Transition name="panel">
          <div v-if="openPanel === 'changePwd'" class="card-body">
            <div class="form-group">
              <label>验证码</label>
              <div class="input-with-btn">
                <input
                  v-model="pwdForm.verifyCode"
                  type="text"
                  placeholder="发送到当前绑定邮箱"
                  inputmode="numeric"
                  autocomplete="one-time-code"
                />
                <button
                  class="btn-send"
                  :disabled="pwdSending || pwdCooldown > 0"
                  @click="handleSendPwdCode"
                >
                  {{ pwdCooldown > 0 ? `${pwdCooldown}s` : (pwdSending ? '发送中' : '发送验证码') }}
                </button>
              </div>
              <div class="form-hint">验证码将发送至：{{ userStore.userInfo?.email || '未绑定邮箱' }}</div>
            </div>
            <div class="form-group">
              <label>新密码</label>
              <input
                v-model="pwdForm.newPwd"
                type="password"
                placeholder="6-20个字符"
                autocomplete="new-password"
              />
            </div>
            <div class="form-group">
              <label>确认新密码</label>
              <input
                v-model="pwdForm.confirmPwd"
                type="password"
                placeholder="再次输入新密码"
                autocomplete="new-password"
              />
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

      <!-- 变更邮箱 -->
      <div class="settings-card">
        <div class="card-header" @click="togglePanel('changeEmail')">
          <div class="card-header-left">
            <span class="card-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
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
          <svg class="chevron" :class="{ open: openPanel === 'changeEmail' }" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
            <path d="M6 9l6 6 6-6" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        </div>

        <Transition name="panel">
          <div v-if="openPanel === 'changeEmail'" class="card-body">
            <!-- Step 1: 输入新邮箱 -->
            <template v-if="emailStep === 1">
              <div class="form-group">
                <label>新邮箱地址</label>
                <div class="input-with-btn">
                  <input
                    v-model="emailForm.newEmail"
                    type="email"
                    placeholder="支持QQ、163、126邮箱"
                    autocomplete="email"
                  />
                  <button
                    class="btn-send"
                    :disabled="emailSending || emailCooldown > 0"
                    @click="handleSendEmailCode"
                  >
                    {{ emailCooldown > 0 ? `${emailCooldown}s` : (emailSending ? '发送中' : '发送验证码') }}
                  </button>
                </div>
              </div>
              <div class="form-group">
                <label>验证码</label>
                <input
                  v-model="emailForm.verifyCode"
                  type="text"
                  placeholder="请输入邮箱收到的验证码"
                  inputmode="numeric"
                  autocomplete="one-time-code"
                />
              </div>
              <div v-if="emailError" class="form-error">{{ emailError }}</div>
              <div class="form-actions">
                <button class="btn-secondary" @click="resetEmailForm">取消</button>
                <button class="btn-primary" :disabled="emailLoading" @click="handleChangeEmail">
                  {{ emailLoading ? '验证中...' : '下一步' }}
                </button>
              </div>
            </template>

            <!-- Step 2: 成功提示 -->
            <template v-else-if="emailStep === 2">
              <div class="success-message">
                <svg class="success-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M22 11.08V12a10 10 0 11-5.93-9.14" stroke-linecap="round" stroke-linejoin="round"/>
                  <polyline points="22 4 12 14.01 9 11.01" stroke-linecap="round" stroke-linejoin="round"/>
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
import { ref, onUnmounted } from 'vue'
import { useUserStore } from '@/stores'
import { changePwd, sendMailToChangePwd, sendMailToChangeEmail, changeEmail } from '@/api'
import { ElMessage } from 'element-plus'

const userStore = useUserStore()

// ===== 面板展开控制 =====
const openPanel = ref<'changePwd' | 'changeEmail' | null>(null)
function togglePanel(panel: 'changePwd' | 'changeEmail') {
  openPanel.value = openPanel.value === panel ? null : panel
}

// ===== 修改密码 =====
const pwdForm = ref({ verifyCode: '', newPwd: '', confirmPwd: '' })
const pwdError = ref('')
const pwdLoading = ref(false)
const pwdSending = ref(false)
const pwdCooldown = ref(0)
let pwdCooldownTimer: ReturnType<typeof setInterval> | null = null

function startPwdCooldown() {
  pwdCooldown.value = 60
  pwdCooldownTimer = setInterval(() => {
    pwdCooldown.value--
    if (pwdCooldown.value <= 0 && pwdCooldownTimer) {
      clearInterval(pwdCooldownTimer)
      pwdCooldownTimer = null
    }
  }, 1000)
}

function resetPwdForm() {
  pwdForm.value = { verifyCode: '', newPwd: '', confirmPwd: '' }
  pwdError.value = ''
  openPanel.value = null
}

async function handleSendPwdCode() {
  if (!userStore.userInfo?.email) {
    ElMessage.warning('请先绑定邮箱')
    return
  }
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

  if (!verifyCode || !newPwd || !confirmPwd) {
    pwdError.value = '请填写完整信息'
    return
  }
  if (newPwd.length < 6 || newPwd.length > 20) {
    pwdError.value = '密码长度应为6-20个字符'
    return
  }
  if (newPwd !== confirmPwd) {
    pwdError.value = '两次输入的密码不一致'
    return
  }

  pwdLoading.value = true
  try {
    await changePwd({ verifyCode, newPwd })
    ElMessage.success('密码修改成功')
    resetPwdForm()
  } catch (err: any) {
    pwdError.value = err.message || '修改失败'
  } finally {
    pwdLoading.value = false
  }
}

// ===== 变更邮箱 =====
const emailForm = ref({ newEmail: '', verifyCode: '' })
const emailError = ref('')
const emailLoading = ref(false)
const emailSending = ref(false)
const emailCooldown = ref(0)
const emailStep = ref(1)
let emailCooldownTimer: ReturnType<typeof setInterval> | null = null

function startEmailCooldown() {
  emailCooldown.value = 60
  emailCooldownTimer = setInterval(() => {
    emailCooldown.value--
    if (emailCooldown.value <= 0 && emailCooldownTimer) {
      clearInterval(emailCooldownTimer)
      emailCooldownTimer = null
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
  if (!newEmail) {
    ElMessage.warning('请输入新邮箱地址')
    return
  }
  const emailReg = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!emailReg.test(newEmail)) {
    ElMessage.warning('邮箱格式不正确')
    return
  }

  emailSending.value = true
  try {
    await sendMailToChangeEmail({ newEmail })
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

  if (!newEmail || !verifyCode) {
    emailError.value = '请填写完整信息'
    return
  }

  emailLoading.value = true
  try {
    await changeEmail({ newEmail, verifyCode })
    await userStore.fetchUserInfo()
    emailStep.value = 2
    ElMessage.success('邮箱变更成功')
  } catch (err: any) {
    emailError.value = err.message || '变更失败'
  } finally {
    emailLoading.value = false
  }
}

// ===== 清理定时器 =====
onUnmounted(() => {
  if (pwdCooldownTimer) clearInterval(pwdCooldownTimer)
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
  transition: all 0.3s ease;
}

.settings-card:hover {
  border-color: var(--color-primary);
}

/* ===== 卡片头部 ===== */
.card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 28px 28px 24px 28px;
  cursor: pointer;
  user-select: none;
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
  padding: 0 28px 28px 28px;
}

/* ===== 表单样式 ===== */
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
  transition: all 0.2s ease;
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
  box-shadow: none;
  cursor: pointer;
  transition: all 0.2s ease;
  white-space: nowrap;
  flex-shrink: 0;
  letter-spacing: -0.01em;
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
  box-shadow: none;
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
  box-shadow: none;
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

  .card-header {
    padding: 24px 22px 20px 22px;
  }

  .card-body {
    padding: 0 22px 24px 22px;
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
