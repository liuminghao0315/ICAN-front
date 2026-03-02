<template>
  <div class="auth-wrapper">
    <Toast :message="toast.message.value" :type="toast.type.value" @close="toast.hideToast" />
    <div class="auth-page-header">
      <div class="brand-block">
        <div class="brand-logo">
          <img src="/logo.jpg" alt="SynSight" class="brand-logo-img" />
        </div>
        <div class="brand-text">
          <h1>SynSight</h1>
          <p>智能内容创作者行为分析平台</p>
        </div>
      </div>
      <div class="header-actions">
        <span class="auth-tip">首次使用请先注册账号</span>
        <button class="theme-toggle-btn" @click="toggleTheme" :title="isDarkMode ? '切换到浅色模式' : '切换到深色模式'">
          <svg v-if="isDarkMode" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
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
          <svg v-else viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
          </svg>
        </button>
      </div>
    </div>

    <div class="main">
      <div class="container a-container" :class="{ 'is-txl': isLogin }" id="a-container">
        <form class="form" @submit.prevent="handleRegister">
          <h2 class="form__title title">创建账户</h2>
          <p class="form__subtitle">
            <span class="subtitle-icon">📧</span>
            请使用邮箱注册，仅支持 QQ 邮箱或网易邮箱
          </p>
          <input v-model="registerForm.username" class="form__input" type="text" name="register-username" autocomplete="username" placeholder="用户名（2-20个字符）" required />
          <input v-model="registerForm.password" class="form__input" type="password" name="register-password" autocomplete="new-password" placeholder="密码（6-20个字符）" required @blur="handlePasswordBlur" />
          <input v-model="confirmPassword" class="form__input" type="password" name="register-confirm-password" autocomplete="new-password" placeholder="确认密码" required @blur="handleConfirmPasswordBlur" />
          <input v-model="registerForm.email" class="form__input" type="email" name="register-email" autocomplete="email" placeholder="邮箱（仅支持 @qq.com、@163.com、@126.com）" required />
          <div class="verify-code-group">
            <input v-model="registerForm.verifyCode" class="form__input verify-code-input" type="text" name="register-verify-code" autocomplete="one-time-code" inputmode="numeric" placeholder="验证码" required />
            <button type="button" class="send-code-btn" :disabled="sendCodeDisabled || sendingCode" @click="handleSendRegisterCode">{{ sendCodeText }}</button>
          </div>
          <div v-if="registerError" class="error-message">{{ registerError }}</div>
          <button type="submit" class="form__button button submit" :disabled="registering">{{ registering ? '注册中...' : '注册' }}</button>
        </form>
      </div>

      <div class="container b-container" :class="{ 'is-txl': isLogin, 'is-z200': isLogin }" id="b-container">
        <div v-if="!showForgotPassword" class="form">
          <h2 class="form__title title">登录</h2>
          <p class="form__subtitle">
            <span class="subtitle-icon">📧</span>
            请使用您的用户名登录
          </p>
          <input v-model="loginForm.username" class="form__input" type="text" name="login-username" autocomplete="username" placeholder="用户名" required />
          <input v-model="loginForm.password" class="form__input" type="password" name="login-password" autocomplete="current-password" placeholder="密码" required />
          <button type="button" class="form__link" @click="openForgotPassword">忘记密码？</button>
          <div v-if="loginError" class="error-message">{{ loginError }}</div>
          <button type="button" class="form__button button submit" :disabled="logging" @click="handleLogin">{{ logging ? '登录中...' : '登录' }}</button>
        </div>

        <div v-else class="form forgot-form">
          <h2 class="form__title title">找回密码</h2>
          <p v-if="forgotStep === 1" class="form__subtitle"><span class="subtitle-icon">👤</span>请输入用户名，我们将发送验证码</p>
          <p v-else-if="forgotStep === 2" class="form__subtitle"><span class="subtitle-icon">🔐</span>请输入验证码并设置新密码</p>

          <template v-if="forgotStep === 1">
            <input v-model="forgotUsername" class="form__input" type="text" autocomplete="username" placeholder="请输入用户名" required />
            <div v-if="forgotError" class="error-message">{{ forgotError }}</div>
            <button type="button" class="form__button button submit" :disabled="sendingResetCode" @click="handleSendResetCode">{{ sendingResetCode ? '发送中...' : '发送验证码' }}</button>
            <button type="button" class="form__link" @click="closeForgotPassword">返回登录</button>
          </template>

          <template v-else-if="forgotStep === 2">
            <input v-model="forgotVerifyCode" class="form__input" type="text" autocomplete="one-time-code" inputmode="numeric" placeholder="请输入验证码" required />
            <input v-model="forgotNewPassword" class="form__input" type="password" autocomplete="new-password" placeholder="请输入新密码（6-20个字符）" required />
            <input v-model="forgotConfirmPassword" class="form__input" type="password" autocomplete="new-password" placeholder="请确认新密码" required />
            <div v-if="forgotError" class="error-message">{{ forgotError }}</div>
            <button type="button" class="form__button button submit" :disabled="resettingPassword" @click="handleResetPassword">{{ resettingPassword ? '重置中...' : '重置密码' }}</button>
            <button type="button" class="form__button button secondary" @click="backForgotStep1">返回上一步</button>
            <button type="button" class="form__link" @click="closeForgotPassword">返回登录</button>
          </template>

          <template v-else>
            <div class="success-icon">✓</div>
            <h3 class="success-title">密码重置成功！</h3>
            <p class="success-message">请使用新密码登录</p>
            <button type="button" class="form__button button submit" @click="closeForgotPassword">前往登录</button>
          </template>
        </div>
      </div>

      <div class="switch" :class="{ 'is-txr': isLogin, 'is-gx': isAnimating }" id="switch-cnt">
        <div class="switch__circle" :class="{ 'is-txr': isLogin }"></div>
        <div class="switch__circle switch__circle--t" :class="{ 'is-txr': isLogin }"></div>
        <div class="switch__container" :class="{ 'is-hidden': isLogin }" id="switch-c1">
          <h2 class="switch__title title">你好，朋友！</h2>
          <p class="switch__description description">还没有账号？立即免费注册</p>
          <button class="switch__button button switch-btn" @click="switchToLogin">登录</button>
        </div>
        <div class="switch__container" :class="{ 'is-hidden': !isLogin }" id="switch-c2">
          <h2 class="switch__title title">欢迎回来！</h2>
          <p class="switch__description description">输入您的个人信息，开始您的旅程</p>
          <button class="switch__button button switch-btn" @click="switchToRegister">注册</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { login, register, sendRegisterCode, getMe, sendResetPwdCode, resetPwd } from '@/api'
import type { LoginParams, RegisterParams, SendRegisterCodeParams, SendResetPwdCodeParams, ResetPwdParams } from '@/api'
import Toast from '@/components/Toast.vue'
import { useToast } from '@/composables/useToast'
import { validateUsername, validatePassword, validateEmail } from '@/utils/validation'
import { useUserStore } from '@/stores/user'
import { useSettingsStore } from '@/stores/settings'

const router = useRouter()
const route = useRoute()
const userStore = useUserStore()
const settingsStore = useSettingsStore()

const isDarkMode = ref(document.documentElement.getAttribute('data-theme') === 'dark')
const syncThemeState = () => {
  isDarkMode.value = document.documentElement.getAttribute('data-theme') === 'dark'
}
const toggleTheme = () => {
  settingsStore.setTheme(isDarkMode.value ? 'light' : 'dark')
  syncThemeState()
}

let themeObserver: MutationObserver | null = null

const isLogin = ref(route.path === '/login' || route.path === '/forgot-password')
const isAnimating = ref(false)
const showForgotPassword = ref(route.path === '/forgot-password')

watch(() => route.path, (newPath) => {
  if (newPath === '/login') {
    isLogin.value = true
    showForgotPassword.value = false
  } else if (newPath === '/register') {
    isLogin.value = false
    showForgotPassword.value = false
  } else if (newPath === '/forgot-password') {
    isLogin.value = true
    showForgotPassword.value = true
  }
})

onMounted(() => {
  syncThemeState()
  themeObserver = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
      if (mutation.type === 'attributes' && mutation.attributeName === 'data-theme') syncThemeState()
    })
  })
  themeObserver.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] })
})

onUnmounted(() => {
  if (themeObserver) {
    themeObserver.disconnect()
    themeObserver = null
  }
})

const loginForm = ref<LoginParams>({ username: '', password: '' })
const registerForm = ref<RegisterParams>({ username: '', password: '', email: '', verifyCode: '' })
const confirmPassword = ref('')

const logging = ref(false)
const registering = ref(false)
const sendingCode = ref(false)
const loginError = ref('')
const registerError = ref('')

const toast = useToast()
const countdown = ref(0)
const sendCodeDisabled = computed(() => countdown.value > 0)
const sendCodeText = computed(() => (countdown.value > 0 ? `${countdown.value}秒后重试` : '发送验证码'))

const forgotStep = ref(1)
const forgotUsername = ref('')
const forgotVerifyCode = ref('')
const forgotNewPassword = ref('')
const forgotConfirmPassword = ref('')
const forgotError = ref('')
const sendingResetCode = ref(false)
const resettingPassword = ref(false)

const openForgotPassword = () => {
  showForgotPassword.value = true
  forgotError.value = ''
  forgotStep.value = 1
  router.push('/forgot-password')
}

const closeForgotPassword = () => {
  showForgotPassword.value = false
  forgotStep.value = 1
  forgotVerifyCode.value = ''
  forgotNewPassword.value = ''
  forgotConfirmPassword.value = ''
  forgotError.value = ''
  router.push('/login')
}

const backForgotStep1 = () => {
  forgotStep.value = 1
  forgotVerifyCode.value = ''
  forgotNewPassword.value = ''
  forgotConfirmPassword.value = ''
  forgotError.value = ''
}

const switchToLogin = () => {
  if (isAnimating.value) return
  isAnimating.value = true
  setTimeout(() => (isAnimating.value = false), 1500)
  isLogin.value = true
  showForgotPassword.value = false
  router.push('/login')
  registerForm.value = { username: '', password: '', email: '', verifyCode: '' }
  confirmPassword.value = ''
  registerError.value = ''
}

const switchToRegister = () => {
  if (isAnimating.value) return
  isAnimating.value = true
  setTimeout(() => (isAnimating.value = false), 1500)
  isLogin.value = false
  showForgotPassword.value = false
  router.push('/register')
  loginForm.value = { username: '', password: '' }
  loginError.value = ''
}

const handlePasswordBlur = () => {
  if (confirmPassword.value) {
    if (confirmPassword.value !== registerForm.value.password) registerError.value = '两次输入的密码不一致，请重新输入'
    else if (registerError.value === '两次输入的密码不一致，请重新输入') registerError.value = ''
  }
}

const handleConfirmPasswordBlur = () => {
  if (!confirmPassword.value) {
    if (registerError.value === '两次输入的密码不一致，请重新输入') registerError.value = ''
    return
  }
  if (confirmPassword.value !== registerForm.value.password) registerError.value = '两次输入的密码不一致，请重新输入'
  else if (registerError.value === '两次输入的密码不一致，请重新输入') registerError.value = ''
}

const handleSendRegisterCode = async () => {
  const emailValidation = validateEmail(registerForm.value.email)
  if (!emailValidation.valid) {
    registerError.value = emailValidation.error || '请先输入邮箱'
    return
  }
  sendingCode.value = true
  registerError.value = ''
  try {
    const params: SendRegisterCodeParams = { mailType: emailValidation.mailType!, mailTo: registerForm.value.email }
    const response = await sendRegisterCode(params)
    if (response.code === 200) {
      countdown.value = 60
      const timer = setInterval(() => {
        countdown.value--
        if (countdown.value <= 0) clearInterval(timer)
      }, 1000)
    } else registerError.value = response.message || '发送验证码失败'
  } catch (error: any) {
    if (error.code === 'ECONNREFUSED' || error.message?.includes('Network Error')) registerError.value = '无法连接到服务器，请确保后端服务已启动（http://localhost:8080）'
    else if (error.response) registerError.value = error.response.data?.message || error.response.data?.error || '服务器错误'
    else if (error.request) registerError.value = '请求超时，请检查网络连接或稍后重试'
    else registerError.value = error.message || '网络错误，请稍后重试'
  } finally {
    sendingCode.value = false
  }
}

const handleSendResetCode = async () => {
  if (!forgotUsername.value.trim()) {
    forgotError.value = '请输入用户名'
    return
  }
  sendingResetCode.value = true
  forgotError.value = ''
  try {
    const params: SendResetPwdCodeParams = { username: forgotUsername.value.trim() }
    const response = await sendResetPwdCode(params)
    if (response.code === 200) forgotStep.value = 2
    else forgotError.value = response.message || '发送验证码失败'
  } catch (error: any) {
    forgotError.value = error.response?.data?.message || '网络错误，请稍后重试'
  } finally {
    sendingResetCode.value = false
  }
}

const handleResetPassword = async () => {
  forgotError.value = ''
  if (forgotNewPassword.value.length < 6 || forgotNewPassword.value.length > 20) {
    forgotError.value = '密码长度必须在6-20个字符之间'
    return
  }
  if (forgotNewPassword.value !== forgotConfirmPassword.value) {
    forgotError.value = '两次输入的密码不一致'
    return
  }
  if (!forgotVerifyCode.value.trim()) {
    forgotError.value = '请输入验证码'
    return
  }
  resettingPassword.value = true
  try {
    const params: ResetPwdParams = { verifyCode: forgotVerifyCode.value.trim(), newPwd: forgotNewPassword.value }
    const response = await resetPwd(params)
    if (response.code === 200) forgotStep.value = 3
    else forgotError.value = response.message || '重置密码失败'
  } catch (error: any) {
    forgotError.value = error.response?.data?.message || '网络错误，请稍后重试'
  } finally {
    resettingPassword.value = false
  }
}

const handleRegister = async () => {
  registerError.value = ''
  const usernameError = validateUsername(registerForm.value.username)
  if (usernameError) return void (registerError.value = `用户名错误：${usernameError}`)
  const passwordError = validatePassword(registerForm.value.password)
  if (passwordError) return void (registerError.value = `密码错误：${passwordError}`)
  if (registerForm.value.password !== confirmPassword.value) return void (registerError.value = '两次输入的密码不一致，请重新输入')
  const emailValidation = validateEmail(registerForm.value.email)
  if (!emailValidation.valid) return void (registerError.value = emailValidation.error || '请输入邮箱')
  if (!registerForm.value.verifyCode) return void (registerError.value = '请输入验证码')

  registering.value = true
  try {
    const response = await register(registerForm.value)
    if (response.code === 200) {
      toast.showToast('注册成功！请登录', 'success')
      switchToLogin()
    } else registerError.value = response.message || '注册失败'
  } catch (error: any) {
    if (error.code === 'ECONNREFUSED' || error.message?.includes('Network Error')) registerError.value = '无法连接到服务器，请确保后端服务已启动（http://localhost:8080）'
    else if (error.response) registerError.value = error.response.data?.message || '注册失败'
    else if (error.request) registerError.value = '请求超时，请检查网络连接或稍后重试'
    else registerError.value = error.message || '网络错误，请稍后重试'
  } finally {
    registering.value = false
  }
}

const handleLogin = async () => {
  loginError.value = ''
  logging.value = true
  try {
    const response = await login(loginForm.value)
    if (response.code === 200) {
      const tokenData = response.data
      if (typeof tokenData === 'object' && tokenData && 'accessToken' in tokenData && 'refreshToken' in tokenData) {
        userStore.setTokens(tokenData.accessToken, tokenData.refreshToken)
      } else if (typeof tokenData === 'string') {
        userStore.setToken(tokenData)
      }
      try {
        const meRes = await getMe()
        if (meRes.code === 200 && meRes.data) userStore.setUserInfo({ id: meRes.data.id, username: meRes.data.username, email: meRes.data.email, avatarUrl: meRes.data.avatarUrl || '' })
      } catch {}
      router.push('/')
    } else loginError.value = response.message || '登录失败'
  } catch (error: any) {
    if (error.code === 'ECONNREFUSED' || error.message?.includes('Network Error')) loginError.value = '无法连接到服务器，请确保后端服务已启动（http://localhost:8080）'
    else if (error.response) loginError.value = error.response.data?.message || '登录失败，请检查用户名和密码'
    else if (error.request) loginError.value = '请求超时，请检查网络连接或稍后重试'
    else loginError.value = error.message || '网络错误，请稍后重试'
  } finally {
    logging.value = false
  }
}
</script>

<style scoped lang="scss">
$bg: #edf2f0;
$neu-1: #f5f7fa;
$white: #ffffff;
$gray: #a0a5a8;
$black: #181818;
$purple: #409eff;
$transition: 1.25s;

* { box-sizing: border-box; }

.auth-wrapper {
  width: 100vw;
  height: 100vh;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  background-color: var(--bg-page, rgb(236, 241, 244));
  overflow: auto;
  padding: 24px;
  gap: 18px;
}

.auth-page-header,
.main,
.container,
.switch {
  background: var(--bg-card, #fff);
  border: 1px solid var(--border-color, #ebeef5);
}

.auth-page-header { width: 1000px; min-width: 1000px; display: flex; justify-content: space-between; align-items: center; padding: 14px 18px; border-radius: 8px; }
.brand-block { display: flex; align-items: center; gap: 12px; }
.brand-logo { width: 40px; height: 40px; min-width: 40px; min-height: 40px; border-radius: 8px; overflow: hidden; display: flex; align-items: center; justify-content: center; }
.brand-logo-img { width: 100%; height: 100%; object-fit: cover; display: block; }
.brand-text h1 { font-size: 20px; line-height: 1.2; color: var(--text-primary, #181818); }
.brand-text p { font-size: 12px; color: var(--text-secondary, #909399); margin-top: 2px; }
.header-actions { display: flex; align-items: center; gap: 12px; }
.auth-tip { font-size: 12px; color: var(--text-secondary, #909399); }
.theme-toggle-btn { width: 40px; height: 40px; border-radius: 8px; border: 1px solid var(--border-color, #ebeef5); background: transparent; color: var(--text-secondary, #606266); cursor: pointer; display: flex; align-items: center; justify-content: center; }
.theme-toggle-btn svg { width: 20px; height: 20px; }

.main { position: relative; width: 1000px; min-width: 1000px; min-height: 600px; height: 600px; padding: 25px; border-radius: 8px; overflow: hidden; }
.container { display: flex; justify-content: center; align-items: center; position: absolute; top: 0; width: 600px; height: 100%; padding: 25px; transition: $transition; }
.form { display: flex; flex-direction: column; justify-content: center; align-items: center; width: 100%; height: 100%; }
.form__input { width: 350px; height: 40px; margin: 4px 0; padding-left: 25px; border: 1px solid var(--border-color, #dcdfe6); border-radius: 8px; background: var(--bg-card, #fff); color: var(--text-primary, #303133); }
.form__input:focus { border-color: var(--color-primary, #409eff); outline: none; }
.form__subtitle { font-size: 13px; color: var(--text-secondary, #909399); margin-top: -15px; margin-bottom: 25px; display: flex; align-items: center; justify-content: center; gap: 6px; padding: 8px 16px; background: rgba(64, 158, 255, 0.1); border-radius: 8px; border: 1px solid var(--border-color, #ebeef5); width: 350px; }
.form__link { margin-top: 18px; border: none; background: transparent; color: var(--text-secondary, #606266); border-bottom: 1px solid var(--border-color, #dcdfe6); cursor: pointer; }
.title { font-size: 34px; font-weight: 700; line-height: 2.2; color: var(--text-primary, #303133); }
.button { width: 180px; height: 50px; border-radius: 8px; margin-top: 18px; border: none; background: $purple; color: $white; font-weight: 700; cursor: pointer; }
.button.secondary { background: #909399; }

.a-container { z-index: 100; left: calc(100% - 600px); }
.b-container { left: calc(100% - 600px); z-index: 0; }
.switch { display: flex; justify-content: center; align-items: center; position: absolute; top: 0; left: 0; height: 100%; width: 400px; padding: 50px; z-index: 200; transition: $transition; overflow: hidden; }
.switch__circle { position: absolute; width: 500px; height: 500px; border-radius: 50%; background: var(--bg-page, #f5f7fa); border: 1px solid var(--border-color, #ebeef5); bottom: -60%; left: -60%; transition: $transition; }
.switch__circle--t { top: -30%; left: 60%; width: 300px; height: 300px; }
.switch__container { position: absolute; width: 400px; padding: 50px 55px; text-align: center; transition: $transition; }
.switch__description { color: var(--text-secondary, #909399); margin-bottom: 20px; }

.is-txr { left: calc(100% - 400px); transform-origin: left; transition: $transition; }
.is-txl { left: 0; transform-origin: right; transition: $transition; }
.is-z200 { z-index: 200; transition: $transition; }
.is-hidden { visibility: hidden; opacity: 0; position: absolute; transition: $transition; }

.error-message { color: #e74c3c; font-size: 12px; margin-top: 10px; text-align: center; }
.verify-code-group { display: flex; width: 350px; gap: 10px; align-items: center; }
.verify-code-input { flex: 1; width: auto; }
.send-code-btn { height: 40px; padding: 0 15px; border-radius: 8px; border: none; background: $purple; color: #fff; cursor: pointer; }
.success-icon { width: 72px; height: 72px; border-radius: 50%; background: #27ae60; color: #fff; display: flex; align-items: center; justify-content: center; font-size: 40px; margin: 14px 0; }
.success-title { color: var(--text-primary, #303133); margin-bottom: 8px; }
.success-message { color: var(--text-secondary, #909399); }

:deep(html[data-theme='dark']) .form__subtitle { background: rgba(64, 158, 255, 0.2); }
</style>
