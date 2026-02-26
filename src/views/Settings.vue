<template>
  <div class="settings-page">
    <div class="settings-container">

      <!-- 账号设置 -->
      <section class="settings-section">
        <h2 class="section-title">账号设置</h2>

        <!-- 修改密码 -->
        <div class="settings-card">
          <div class="card-header" @click="togglePanel('changePwd')">
            <div class="card-header-left">
              <span class="card-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                  <path d="M7 11V7a5 5 0 0110 0v4"/>
                </svg>
              </span>
              <div>
                <div class="card-title">修改密码</div>
                <div class="card-desc">定期更换密码有助于保护账号安全</div>
              </div>
            </div>
            <svg class="chevron" :class="{ open: openPanel === 'changePwd' }" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M6 9l6 6 6-6" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          </div>

          <Transition name="panel">
            <div v-if="openPanel === 'changePwd'" class="card-body">
              <div class="form-group">
                <label>验证码</label>
                <div class="input-with-btn">
                  <input v-model="pwdForm.verifyCode" type="text" placeholder="发送到当前绑定邮箱" inputmode="numeric" autocomplete="one-time-code" />
                  <button class="btn-send" :disabled="pwdSending || pwdCooldown > 0" @click="handleSendPwdCode">
                    {{ pwdCooldown > 0 ? `${pwdCooldown}s` : (pwdSending ? '发送中' : '发送验证码') }}
                  </button>
                </div>
                <div class="form-hint">验证码将发送至：{{ userStore.userInfo?.email || '未绑定邮箱' }}</div>
              </div>
              <div class="form-group">
                <label>新密码</label>
                <input v-model="pwdForm.newPwd" type="password" placeholder="6-20个字符" autocomplete="new-password" />
              </div>
              <div class="form-group">
                <label>确认新密码</label>
                <input v-model="pwdForm.confirmPwd" type="password" placeholder="再次输入新密码" autocomplete="new-password" />
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
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
                  <polyline points="22,6 12,13 2,6"/>
                </svg>
              </span>
              <div>
                <div class="card-title">变更绑定邮箱</div>
                <div class="card-desc">
                  当前邮箱：<span class="current-email">{{ userStore.userInfo?.email || '未绑定' }}</span>
                </div>
              </div>
            </div>
            <svg class="chevron" :class="{ open: openPanel === 'changeEmail' }" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
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
                    <input v-model="emailForm.newEmail" type="email" placeholder="支持QQ、163、126邮箱" autocomplete="email" />
                    <button class="btn-send" :disabled="emailSending || emailCooldown > 0" @click="handleSendEmailCode">
                      {{ emailCooldown > 0 ? `${emailCooldown}s` : (emailSending ? '发送中' : '发送验证码') }}
                    </button>
                  </div>
                </div>
                <div class="form-group">
                  <label>验证码</label>
                  <input v-model="emailForm.verifyCode" type="text" placeholder="请输入邮箱收到的验证码" inputmode="numeric" autocomplete="one-time-code" />
                </div>
                <div v-if="emailError" class="form-error">{{ emailError }}</div>
                <div class="form-actions">
                  <button class="btn-secondary" @click="resetEmailForm">取消</button>
                  <button class="btn-primary" :disabled="emailLoading" @click="handleChangeEmail">
                    {{ emailLoading ? '确认中...' : '确认变更' }}
                  </button>
                </div>
              </template>

              <!-- Step 2: 成功 -->
              <template v-else>
                <div class="success-tip">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M22 11.08V12a10 10 0 11-5.93-9.14" stroke-linecap="round" stroke-linejoin="round"/>
                    <polyline points="22,4 12,14.01 9,11.01" stroke-linecap="round" stroke-linejoin="round"/>
                  </svg>
                  <span>邮箱已成功变更为 {{ emailForm.newEmail }}</span>
                </div>
                <div class="form-actions">
                  <button class="btn-primary" @click="resetEmailForm">完成</button>
                </div>
              </template>
            </div>
          </Transition>
        </div>
      </section>

      <!-- 系统设置 -->
      <section class="settings-section">
        <h2 class="section-title">系统设置</h2>

        <!-- 主题模式 -->
        <div class="settings-card no-expand">
          <div class="card-header static">
            <div class="card-header-left">
              <span class="card-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
                  <circle cx="12" cy="12" r="5"/>
                  <line x1="12" y1="1" x2="12" y2="3"/>
                  <line x1="12" y1="21" x2="12" y2="23"/>
                  <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/>
                  <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/>
                  <line x1="1" y1="12" x2="3" y2="12"/>
                  <line x1="21" y1="12" x2="23" y2="12"/>
                  <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/>
                  <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>
                </svg>
              </span>
              <div>
                <div class="card-title">主题模式</div>
                <div class="card-desc">选择界面的明暗风格</div>
              </div>
            </div>
            <div class="theme-switcher">
              <button
                v-for="opt in themeOptions"
                :key="opt.value"
                class="theme-btn"
                :class="{ active: settingsStore.themeMode === opt.value }"
                @click="settingsStore.setTheme(opt.value)"
              >
                <span v-html="opt.icon"></span>
                {{ opt.label }}
              </button>
            </div>
          </div>
        </div>

        <!-- 界面语言 -->
        <div class="settings-card no-expand">
          <div class="card-header static">
            <div class="card-header-left">
              <span class="card-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
                  <circle cx="12" cy="12" r="10"/>
                  <line x1="2" y1="12" x2="22" y2="12"/>
                  <path d="M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z"/>
                </svg>
              </span>
              <div>
                <div class="card-title">界面语言</div>
                <div class="card-desc">更多语言支持即将上线</div>
              </div>
            </div>
            <div class="lang-selector">
              <button
                v-for="opt in langOptions"
                :key="opt.value"
                class="lang-btn"
                :class="{ active: settingsStore.language === opt.value, disabled: opt.disabled }"
                :disabled="opt.disabled"
                @click="!opt.disabled && settingsStore.setLanguage(opt.value)"
              >
                {{ opt.label }}
                <span v-if="opt.disabled" class="coming-soon">即将支持</span>
              </button>
            </div>
          </div>
        </div>
      </section>

    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onUnmounted } from 'vue'
import { useUserStore } from '@/stores'
import { useSettingsStore } from '@/stores/settings'
import type { ThemeMode, Language } from '@/stores/settings'
import { changePwd, sendMailToChangePwd, sendMailToChangeEmail, changeEmail } from '@/api'
import { ElMessage } from 'element-plus'

const userStore = useUserStore()
const settingsStore = useSettingsStore()

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
  pwdError.value = ''
  if (!userStore.userInfo?.email) {
    pwdError.value = '当前账号未绑定邮箱，无法发送验证码'
    return
  }
  pwdSending.value = true
  try {
    const res = await sendMailToChangePwd()
    if (res.code === 200) {
      ElMessage.success('验证码已发送，请查收邮件')
      startPwdCooldown()
    } else {
      pwdError.value = res.message || '发送失败，请重试'
    }
  } catch {
    pwdError.value = '网络异常，请稍后重试'
  } finally {
    pwdSending.value = false
  }
}

async function handleChangePwd() {
  pwdError.value = ''
  const { verifyCode, newPwd, confirmPwd } = pwdForm.value
  if (!verifyCode) {
    pwdError.value = '请先获取验证码'
    return
  }
  if (!newPwd || !confirmPwd) {
    pwdError.value = '请填写新密码'
    return
  }
  if (newPwd.length < 6 || newPwd.length > 20) {
    pwdError.value = '新密码长度须在6-20个字符之间'
    return
  }
  if (newPwd !== confirmPwd) {
    pwdError.value = '两次输入的新密码不一致'
    return
  }
  pwdLoading.value = true
  try {
    const res = await changePwd(verifyCode, newPwd)
    if (res.code === 200) {
      ElMessage.success('密码修改成功')
      resetPwdForm()
    } else {
      pwdError.value = res.message || '修改失败，请重试'
    }
  } catch {
    pwdError.value = '网络异常，请稍后重试'
  } finally {
    pwdLoading.value = false
  }
}

// ===== 变更邮箱 =====
const emailStep = ref<1 | 2>(1)
const emailForm = ref({ newEmail: '', verifyCode: '' })
const emailError = ref('')
const emailLoading = ref(false)
const emailSending = ref(false)
const emailCooldown = ref(0)
let cooldownTimer: ReturnType<typeof setInterval> | null = null

function startCooldown() {
  emailCooldown.value = 60
  cooldownTimer = setInterval(() => {
    emailCooldown.value--
    if (emailCooldown.value <= 0 && cooldownTimer) {
      clearInterval(cooldownTimer)
      cooldownTimer = null
    }
  }, 1000)
}

onUnmounted(() => {
  if (cooldownTimer) clearInterval(cooldownTimer)
  if (pwdCooldownTimer) clearInterval(pwdCooldownTimer)
})

function resetEmailForm() {
  emailStep.value = 1
  emailForm.value = { newEmail: '', verifyCode: '' }
  emailError.value = ''
  openPanel.value = null
}

async function handleSendEmailCode() {
  emailError.value = ''
  if (!emailForm.value.newEmail) {
    emailError.value = '请输入新邮箱地址'
    return
  }
  emailSending.value = true
  try {
    const res = await sendMailToChangeEmail(emailForm.value.newEmail)
    if (res.code === 200) {
      ElMessage.success('验证码已发送，请查收邮件')
      startCooldown()
    } else {
      emailError.value = res.message || '发送失败，请重试'
    }
  } catch {
    emailError.value = '网络异常，请稍后重试'
  } finally {
    emailSending.value = false
  }
}

async function handleChangeEmail() {
  emailError.value = ''
  if (!emailForm.value.newEmail || !emailForm.value.verifyCode) {
    emailError.value = '请填写新邮箱和验证码'
    return
  }
  emailLoading.value = true
  try {
    const res = await changeEmail(emailForm.value.newEmail, emailForm.value.verifyCode)
    if (res.code === 200) {
      emailStep.value = 2
      // 更新本地 userInfo 中的邮箱
      if (userStore.userInfo) {
        userStore.setUserInfo({ ...userStore.userInfo, email: emailForm.value.newEmail })
      }
    } else {
      emailError.value = res.message || '变更失败，请重试'
    }
  } catch {
    emailError.value = '网络异常，请稍后重试'
  } finally {
    emailLoading.value = false
  }
}

// ===== 主题选项 =====
const themeOptions: { value: ThemeMode; label: string; icon: string }[] = [
  {
    value: 'light',
    label: '浅色',
    icon: `<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="8" cy="8" r="3"/><line x1="8" y1="1" x2="8" y2="2.5"/><line x1="8" y1="13.5" x2="8" y2="15"/><line x1="2.93" y1="2.93" x2="3.99" y2="3.99"/><line x1="12.01" y1="12.01" x2="13.07" y2="13.07"/><line x1="1" y1="8" x2="2.5" y2="8"/><line x1="13.5" y1="8" x2="15" y2="8"/><line x1="2.93" y1="13.07" x2="3.99" y2="12.01"/><line x1="12.01" y1="3.99" x2="13.07" y2="2.93"/></svg>`
  },
  {
    value: 'dark',
    label: '深色',
    icon: `<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M14 10.5A6 6 0 015.5 2a7 7 0 108.5 8.5z"/></svg>`
  },
  {
    value: 'system',
    label: '跟随系统',
    icon: `<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><rect x="1" y="2" width="14" height="10" rx="1.5"/><line x1="5" y1="15" x2="11" y2="15"/><line x1="8" y1="12" x2="8" y2="15"/></svg>`
  }
]

// ===== 语言选项 =====
const langOptions: { value: Language; label: string; disabled?: boolean }[] = [
  { value: 'zh-CN', label: '简体中文' },
  { value: 'en-US', label: 'English', disabled: true }
]
</script>

<style scoped>
.settings-page {
  min-height: 100%;
  padding: 32px 24px;
  background: var(--bg-page, #f5f6fa);
}

.settings-container {
  max-width: 680px;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  gap: 32px;
}

/* ===== Section ===== */
.settings-section {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.section-title {
  font-size: 13px;
  font-weight: 600;
  color: var(--text-tertiary, #8b8fa8);
  text-transform: uppercase;
  letter-spacing: 0.06em;
  margin: 0 0 4px 2px;
}

/* ===== Card ===== */
.settings-card {
  background: var(--bg-card, #ffffff);
  border: 1px solid var(--border-color, #e8eaf0);
  border-radius: 12px;
  overflow: hidden;
  transition: box-shadow 0.2s;
}

.settings-card:hover {
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.06);
}

.card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 18px 20px;
  cursor: pointer;
  user-select: none;
  transition: background 0.15s;
}

.card-header:hover {
  background: var(--bg-hover, #f8f9fc);
}

.card-header.static {
  cursor: default;
}

.card-header.static:hover {
  background: transparent;
}

.card-header-left {
  display: flex;
  align-items: center;
  gap: 14px;
}

.card-icon {
  width: 36px;
  height: 36px;
  border-radius: 8px;
  background: var(--bg-icon, #f0f2f8);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.card-icon svg {
  width: 18px;
  height: 18px;
  color: var(--text-secondary, #5a5f7a);
}

.card-title {
  font-size: 14px;
  font-weight: 500;
  color: var(--text-primary, #1a1d2e);
  line-height: 1.4;
}

.card-desc {
  font-size: 12px;
  color: var(--text-tertiary, #8b8fa8);
  margin-top: 2px;
}

.current-email {
  color: var(--color-primary, #5b6af0);
  font-weight: 500;
}

.chevron {
  width: 18px;
  height: 18px;
  color: var(--text-tertiary, #8b8fa8);
  transition: transform 0.2s;
  flex-shrink: 0;
}

.chevron.open {
  transform: rotate(180deg);
}

/* ===== Card Body (form) ===== */
.card-body {
  padding: 0 20px 20px;
  border-top: 1px solid var(--border-color, #e8eaf0);
}

.form-group {
  margin-top: 16px;
}

.form-group label {
  display: block;
  font-size: 12px;
  font-weight: 500;
  color: var(--text-secondary, #5a5f7a);
  margin-bottom: 6px;
}

.form-group input {
  width: 100%;
  height: 38px;
  padding: 0 12px;
  border: 1px solid var(--border-color, #e8eaf0);
  border-radius: 8px;
  font-size: 14px;
  color: var(--text-primary, #1a1d2e);
  background: var(--bg-input, #fafbfd);
  outline: none;
  transition: border-color 0.15s, box-shadow 0.15s;
  box-sizing: border-box;
}

.form-group input:focus {
  border-color: var(--color-primary, #5b6af0);
  box-shadow: 0 0 0 3px rgba(91, 106, 240, 0.12);
  background: #fff;
}

.input-with-btn {
  display: flex;
  gap: 8px;
}

.input-with-btn input {
  flex: 1;
}

.btn-send {
  flex-shrink: 0;
  height: 38px;
  padding: 0 14px;
  border: 1px solid var(--color-primary, #5b6af0);
  border-radius: 8px;
  font-size: 13px;
  color: var(--color-primary, #5b6af0);
  background: transparent;
  cursor: pointer;
  white-space: nowrap;
  transition: background 0.15s, color 0.15s;
}

.btn-send:hover:not(:disabled) {
  background: var(--color-primary, #5b6af0);
  color: #fff;
}

.btn-send:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.form-error {
  margin-top: 10px;
  font-size: 12px;
  color: #e05252;
}

.form-hint {
  margin-top: 5px;
  font-size: 11px;
  color: var(--text-tertiary, #8b8fa8);
}

.form-actions {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  margin-top: 20px;
}

.btn-primary,
.btn-secondary {
  height: 36px;
  padding: 0 18px;
  border-radius: 8px;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  border: none;
  transition: opacity 0.15s, background 0.15s;
}

.btn-primary {
  background: var(--color-primary, #5b6af0);
  color: #fff;
}

.btn-primary:hover:not(:disabled) {
  opacity: 0.88;
}

.btn-primary:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn-secondary {
  background: var(--bg-hover, #f0f2f8);
  color: var(--text-secondary, #5a5f7a);
}

.btn-secondary:hover {
  background: var(--border-color, #e8eaf0);
}

/* ===== Success tip ===== */
.success-tip {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-top: 16px;
  padding: 12px 14px;
  background: #f0faf4;
  border-radius: 8px;
  font-size: 13px;
  color: #2d8a55;
}

.success-tip svg {
  width: 18px;
  height: 18px;
  flex-shrink: 0;
  stroke: #2d8a55;
}

/* ===== Theme switcher ===== */
.theme-switcher {
  display: flex;
  gap: 6px;
}

.theme-btn {
  display: flex;
  align-items: center;
  gap: 5px;
  height: 32px;
  padding: 0 12px;
  border: 1px solid var(--border-color, #e8eaf0);
  border-radius: 8px;
  font-size: 12px;
  color: var(--text-secondary, #5a5f7a);
  background: var(--bg-input, #fafbfd);
  cursor: pointer;
  transition: all 0.15s;
  white-space: nowrap;
}

.theme-btn :deep(svg) {
  width: 13px;
  height: 13px;
}

.theme-btn:hover {
  border-color: var(--color-primary, #5b6af0);
  color: var(--color-primary, #5b6af0);
}

.theme-btn.active {
  border-color: var(--color-primary, #5b6af0);
  background: rgba(91, 106, 240, 0.08);
  color: var(--color-primary, #5b6af0);
  font-weight: 500;
}

/* ===== Lang selector ===== */
.lang-selector {
  display: flex;
  gap: 6px;
}

.lang-btn {
  display: flex;
  align-items: center;
  gap: 5px;
  height: 32px;
  padding: 0 12px;
  border: 1px solid var(--border-color, #e8eaf0);
  border-radius: 8px;
  font-size: 12px;
  color: var(--text-secondary, #5a5f7a);
  background: var(--bg-input, #fafbfd);
  cursor: pointer;
  transition: all 0.15s;
}

.lang-btn:hover:not(.disabled) {
  border-color: var(--color-primary, #5b6af0);
  color: var(--color-primary, #5b6af0);
}

.lang-btn.active {
  border-color: var(--color-primary, #5b6af0);
  background: rgba(91, 106, 240, 0.08);
  color: var(--color-primary, #5b6af0);
  font-weight: 500;
}

.lang-btn.disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.coming-soon {
  font-size: 10px;
  background: var(--bg-hover, #f0f2f8);
  padding: 1px 5px;
  border-radius: 4px;
  color: var(--text-tertiary, #8b8fa8);
}

/* ===== Transition ===== */
.panel-enter-active,
.panel-leave-active {
  transition: max-height 0.25s ease, opacity 0.2s ease;
  overflow: hidden;
  max-height: 400px;
}

.panel-enter-from,
.panel-leave-to {
  max-height: 0;
  opacity: 0;
}

/* ===== Dark theme ===== */
[data-theme='dark'] .settings-page {
  --bg-page: #0f1117;
  --bg-card: #1a1d2e;
  --bg-hover: #22263a;
  --bg-input: #22263a;
  --bg-icon: #22263a;
  --border-color: #2e3248;
  --text-primary: #e8eaf6;
  --text-secondary: #9ba3c4;
  --text-tertiary: #5a6080;
  --color-primary: #7b8ff5;
}
</style>
