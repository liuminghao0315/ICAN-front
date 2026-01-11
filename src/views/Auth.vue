<template>
  <!-- Toast 消息提示组件 -->
  <Toast :message="toast.message.value" :type="toast.type.value" @close="toast.hideToast" />

  <div class="auth-wrapper">
    <div class="main">
    <!-- 注册容器 -->
    <div class="container a-container" :class="{ 'is-txl': isLogin }" id="a-container">
      <form class="form" @submit.prevent="handleRegister">
        <h2 class="form__title title">创建账户</h2>
        <p class="form__subtitle">
          <span class="subtitle-icon">📧</span>
          请使用邮箱注册，仅支持 QQ 邮箱或网易邮箱
        </p>
        <input
          v-model="registerForm.username"
          class="form__input"
          type="text"
          name="register-username"
          autocomplete="username"
          placeholder="用户名（2-20个字符）"
          required
        />
        <input
          v-model="registerForm.password"
          class="form__input"
          type="password"
          name="register-password"
          autocomplete="new-password"
          placeholder="密码（6-20个字符）"
          required
          @blur="handlePasswordBlur"
        />
        <input
          v-model="confirmPassword"
          class="form__input"
          type="password"
          name="register-confirm-password"
          autocomplete="new-password"
          placeholder="确认密码"
          required
          @blur="handleConfirmPasswordBlur"
        />
        <input
          v-model="registerForm.email"
          class="form__input"
          type="email"
          name="register-email"
          autocomplete="email"
          placeholder="邮箱（仅支持 @qq.com、@163.com、@126.com）"
          required
        />
        <div class="verify-code-group">
          <input
            v-model="registerForm.verifyCode"
            class="form__input verify-code-input"
            type="text"
            name="register-verify-code"
            autocomplete="one-time-code"
            inputmode="numeric"
            placeholder="验证码"
            required
          />
          <button
            type="button"
            class="send-code-btn"
            :disabled="sendCodeDisabled || sendingCode"
            @click="handleSendRegisterCode"
          >
            {{ sendCodeText }}
          </button>
        </div>
        <div v-if="registerError" class="error-message">{{ registerError }}</div>
        <button type="submit" class="form__button button submit" :disabled="registering">
          {{ registering ? '注册中...' : '注册' }}
        </button>
      </form>
    </div>

    <!-- 登录容器 -->
    <div class="container b-container" :class="{ 'is-txl': isLogin, 'is-z200': isLogin }" id="b-container">
      <form class="form" @submit.prevent="handleLogin">
        <h2 class="form__title title">登录</h2>
        <p class="form__subtitle">
          <span class="subtitle-icon">📧</span>
          请使用您的用户名登录
        </p>
        <input
          v-model="loginForm.username"
          class="form__input"
          type="text"
          name="login-username"
          autocomplete="username"
          placeholder="用户名"
          required
        />
        <input
          v-model="loginForm.password"
          class="form__input"
          type="password"
          name="login-password"
          autocomplete="current-password"
          placeholder="密码"
          required
        />
        <router-link to="/forgot-password" class="form__link">忘记密码？</router-link>
        <div v-if="loginError" class="error-message">{{ loginError }}</div>
        <button type="submit" class="form__button button submit" :disabled="logging">
          {{ logging ? '登录中...' : '登录' }}
        </button>
      </form>
    </div>

    <!-- 切换容器 -->
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
import { ref, computed, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { login, register, sendRegisterCode } from '@/api'
import type { LoginParams, RegisterParams, SendRegisterCodeParams } from '@/api'
import Toast from '@/components/Toast.vue'
import { useToast } from '@/composables/useToast'
import { validateUsername, validatePassword, validateEmail } from '@/utils/validation'
import { useUserStore } from '@/stores/user'

const router = useRouter()
const route = useRoute()
const userStore = useUserStore()

// 表单状态 - 根据路由路径初始化
const isLogin = ref(route.path === '/login')
const isAnimating = ref(false)

// 监听路由变化，同步更新表单状态
watch(() => route.path, (newPath) => {
  if (newPath === '/login') {
    isLogin.value = true
  } else if (newPath === '/register') {
    isLogin.value = false
  }
})

// 登录表单
const loginForm = ref<LoginParams>({
  username: '',
  password: '',
})

// 注册表单
const registerForm = ref<RegisterParams>({
  username: '',
  password: '',
  email: '',
  verifyCode: '',
})

// 确认密码
const confirmPassword = ref('')

// 状态
const logging = ref(false)
const registering = ref(false)
const sendingCode = ref(false)
const loginError = ref('')
const registerError = ref('')

// Toast消息提示
const toast = useToast()

// 验证码倒计时
const countdown = ref(0)
const sendCodeDisabled = computed(() => countdown.value > 0)
const sendCodeText = computed(() => {
  if (countdown.value > 0) {
    return `${countdown.value}秒后重试`
  }
  return '发送验证码'
})

// 切换表单
const switchToLogin = () => {
  if (isAnimating.value) return
  isAnimating.value = true
  setTimeout(() => {
    isAnimating.value = false
  }, 1500)
  isLogin.value = true
  // 更新路由
  router.push('/login')
  // 清空注册表单和确认密码
  registerForm.value = {
    username: '',
    password: '',
    email: '',
    verifyCode: '',
  }
  confirmPassword.value = ''
  registerError.value = ''
}

const switchToRegister = () => {
  if (isAnimating.value) return
  isAnimating.value = true
  setTimeout(() => {
    isAnimating.value = false
  }, 1500)
  isLogin.value = false
  // 更新路由
  router.push('/register')
  // 清空登录表单
  loginForm.value = {
    username: '',
    password: '',
  }
  loginError.value = ''
}

// 密码失去焦点时的验证（当确认密码已输入时，重新验证）
const handlePasswordBlur = () => {
  if (confirmPassword.value) {
    if (confirmPassword.value !== registerForm.value.password) {
      registerError.value = '两次输入的密码不一致，请重新输入'
    } else {
      // 如果密码一致，清除密码不一致的错误信息
      if (registerError.value === '两次输入的密码不一致，请重新输入') {
        registerError.value = ''
      }
    }
  }
}

// 确认密码失去焦点时的验证
const handleConfirmPasswordBlur = () => {
  if (!confirmPassword.value) {
    // 如果确认密码为空，清除密码不一致的错误信息
    if (registerError.value === '两次输入的密码不一致，请重新输入') {
      registerError.value = ''
    }
    return
  }
  
  if (confirmPassword.value !== registerForm.value.password) {
    registerError.value = '两次输入的密码不一致，请重新输入'
  } else {
    // 如果密码一致，清除错误信息
    if (registerError.value === '两次输入的密码不一致，请重新输入') {
      registerError.value = ''
    }
  }
}

// 发送注册验证码
const handleSendRegisterCode = async () => {
  // 验证邮箱
  const emailValidation = validateEmail(registerForm.value.email)
  if (!emailValidation.valid) {
    registerError.value = emailValidation.error || '请先输入邮箱'
    return
  }

  const mailType = emailValidation.mailType!

  sendingCode.value = true
  registerError.value = ''

  try {
    const params: SendRegisterCodeParams = {
      mailType,
      mailTo: registerForm.value.email,
    }
    const response = await sendRegisterCode(params)

    if (response.code === 200) {
      // 开始倒计时
      countdown.value = 60
      const timer = setInterval(() => {
        countdown.value--
        if (countdown.value <= 0) {
          clearInterval(timer)
        }
      }, 1000)
      registerError.value = '' // 清除错误信息
    } else {
      registerError.value = response.message || '发送验证码失败'
    }
  } catch (error: any) {
    
    // 更详细的错误处理
    if (error.code === 'ECONNREFUSED' || error.message?.includes('Network Error')) {
      registerError.value = '无法连接到服务器，请确保后端服务已启动（http://localhost:8080）'
    } else if (error.response) {
      // 服务器返回了错误响应
      const errorMessage = error.response.data?.message || error.response.data?.error || '服务器错误'
      registerError.value = errorMessage
    } else if (error.request) {
      // 请求已发出但没有收到响应
      registerError.value = '请求超时，请检查网络连接或稍后重试'
    } else {
      registerError.value = error.message || '网络错误，请稍后重试'
    }
  } finally {
    sendingCode.value = false
  }
}

// 注册
const handleRegister = async () => {
  registerError.value = ''

  // 验证用户名
  const usernameError = validateUsername(registerForm.value.username)
  if (usernameError) {
    registerError.value = `用户名错误：${usernameError}`
    return
  }

  // 验证密码
  const passwordError = validatePassword(registerForm.value.password)
  if (passwordError) {
    registerError.value = `密码错误：${passwordError}`
    return
  }

  // 验证确认密码
  if (registerForm.value.password !== confirmPassword.value) {
    registerError.value = '两次输入的密码不一致，请重新输入'
    return
  }

  // 验证邮箱
  const emailValidation = validateEmail(registerForm.value.email)
  if (!emailValidation.valid) {
    registerError.value = emailValidation.error || '请输入邮箱'
    return
  }

  // 验证验证码
  if (!registerForm.value.verifyCode) {
    registerError.value = '请输入验证码'
    return
  }

  registering.value = true

  try {
    const response = await register(registerForm.value)

    if (response.code === 200) {
      // 注册成功，显示提示并切换到登录页面
      toast.showToast('注册成功！请登录', 'success')
      switchToLogin()
      // 清空注册表单
      registerForm.value = {
        username: '',
        password: '',
        email: '',
        verifyCode: '',
      }
      confirmPassword.value = ''
      registerError.value = '' // 清除错误信息
    } else {
      registerError.value = response.message || '注册失败'
    }
  } catch (error: any) {
    
    if (error.code === 'ECONNREFUSED' || error.message?.includes('Network Error')) {
      registerError.value = '无法连接到服务器，请确保后端服务已启动（http://localhost:8080）'
    } else if (error.response) {
      registerError.value = error.response.data?.message || '注册失败'
    } else if (error.request) {
      registerError.value = '请求超时，请检查网络连接或稍后重试'
    } else {
      registerError.value = error.message || '网络错误，请稍后重试'
    }
  } finally {
    registering.value = false
  }
}

// 登录
const handleLogin = async () => {
  loginError.value = ''
  logging.value = true

  try {
    const response = await login(loginForm.value)

    if (response.code === 200) {
      // 登录成功，保存双token到store（store会自动同步到localStorage）
      const tokenData = response.data
      if (typeof tokenData === 'object' && tokenData !== null && 'accessToken' in tokenData && 'refreshToken' in tokenData) {
        // 新格式：TokenResponse对象
        userStore.setTokens(tokenData.accessToken, tokenData.refreshToken)
        
        // 从accessToken中解析用户信息
        try {
          const parts = tokenData.accessToken.split('.')
          if (parts.length === 3 && parts[1]) {
            const payload = JSON.parse(atob(parts[1]))
            // token subject 格式为 "userId:xxx"
            let userId = payload.sub || payload.id || ''
            if (userId.startsWith('userId:')) {
              userId = userId.replace('userId:', '')
            }
            userStore.setUserInfo({
              id: userId,
              username: loginForm.value.username,
              email: ''
            })
          }
        } catch {
          // 静默处理错误
        }
      } else if (typeof tokenData === 'string') {
        // 兼容旧格式：单个token字符串
        userStore.setToken(tokenData)
        
        // 从token中解析用户信息
        try {
          const parts = tokenData.split('.')
          if (parts.length === 3 && parts[1]) {
            const payload = JSON.parse(atob(parts[1]))
            let userId = payload.sub || payload.id || ''
            if (userId.startsWith('userId:')) {
              userId = userId.replace('userId:', '')
            }
            userStore.setUserInfo({
              id: userId,
              username: loginForm.value.username,
              email: ''
            })
          }
        } catch {
          // 静默处理错误
        }
      }
      
      // 跳转到首页或其他页面
      router.push('/')
    } else {
      loginError.value = response.message || '登录失败'
    }
  } catch (error: any) {
    
    if (error.code === 'ECONNREFUSED' || error.message?.includes('Network Error')) {
      loginError.value = '无法连接到服务器，请确保后端服务已启动（http://localhost:8080）'
    } else if (error.response) {
      loginError.value = error.response.data?.message || '登录失败，请检查用户名和密码'
    } else if (error.request) {
      loginError.value = '请求超时，请检查网络连接或稍后重试'
    } else {
      loginError.value = error.message || '网络错误，请稍后重试'
    }
  } finally {
    logging.value = false
  }
}
</script>

<style scoped lang="scss">
$bg: #edf2f0;
$neu-1: #ecf0f3;
$neu-2: #d1d9e6;
$white: #f9f9f9;
$gray: #a0a5a8;
$black: #181818;
$purple: #4b70e2;
$transition: 1.25s;

*,
*::after,
*::before {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
  user-select: none;
}

.auth-wrapper {
  width: 100vw;
  height: 100vh;
  display: flex;
  justify-content: center;
  align-items: center;
  background-color: rgb(236, 241, 244);
  overflow: auto;
}

.main {
  position: relative;
  width: 1000px;
  min-width: 1000px;
  min-height: 600px;
  height: 600px;
  padding: 25px;
  background-color: $neu-1;
  box-shadow: 10px 10px 10px $neu-2, -10px -10px 10px $white;
  border-radius: 12px;
  overflow: hidden;

  @media (max-width: 1200px) {
    transform: scale(0.7);
  }
  @media (max-width: 1000px) {
    transform: scale(0.6);
  }
  @media (max-width: 800px) {
    transform: scale(0.5);
  }
  @media (max-width: 600px) {
    transform: scale(0.4);
  }
}

.container {
  display: flex;
  justify-content: center;
  align-items: center;
  position: absolute;
  top: 0;
  width: 600px;
  height: 100%;
  padding: 25px;
  background-color: $neu-1;
  transition: $transition;
}

.form {
  display: flex;
  justify-content: center;
  align-items: center;
  flex-direction: column;
  width: 100%;
  height: 100%;

  &__icon {
    object-fit: contain;
    width: 30px;
    margin: 0 5px;
    opacity: 0.5;
    transition: 0.15s;

    &:hover {
      opacity: 1;
      transition: 0.15s;
      cursor: pointer;
    }
  }

  &__input {
    width: 350px;
    height: 40px;
    margin: 4px 0;
    padding-left: 25px;
    font-size: 13px;
    letter-spacing: 0.15px;
    border: none;
    outline: none;
    font-family: 'Montserrat', sans-serif;
    background-color: $neu-1;
    transition: 0.25s ease;
    border-radius: 8px;
    box-shadow: inset 2px 2px 4px $neu-2, inset -2px -2px 4px $white;

    &:focus {
      box-shadow: inset 4px 4px 4px $neu-2, inset -4px -4px 4px $white;
    }
  }

  &__subtitle {
    font-size: 13px;
    color: $gray;
    margin-top: -15px;
    margin-bottom: 25px;
    text-align: center;
    letter-spacing: 0.3px;
    line-height: 1.6;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 6px;
    padding: 8px 16px;
    background-color: rgba(75, 112, 226, 0.08);
    border-radius: 8px;
    box-shadow: inset 1px 1px 2px rgba(209, 217, 230, 0.3),
      inset -1px -1px 2px rgba(249, 249, 249, 0.5);
    width: 350px;

    .subtitle-icon {
      font-size: 16px;
      flex-shrink: 0;
    }
  }

  &__span {
    margin-top: 30px;
    margin-bottom: 12px;
  }

  &__link {
    color: $black;
    font-size: 15px;
    margin-top: 25px;
    border-bottom: 1px solid $gray;
    line-height: 2;
    text-decoration: none;
    cursor: pointer;

    &:hover {
      color: $purple;
    }
  }
}

.title {
  font-size: 34px;
  font-weight: 700;
  line-height: 3;
  color: $black;
  text-align: center;
}

.description {
  font-size: 14px;
  letter-spacing: 0.25px;
  text-align: center;
  line-height: 1.6;
  color: $gray;
  margin-top: -10px;
  margin-bottom: 20px;
}

.button {
  width: 180px;
  height: 50px;
  border-radius: 25px;
  margin-top: 50px;
  font-weight: 700;
  font-size: 14px;
  letter-spacing: 1.15px;
  background-color: $purple;
  color: $white;
  box-shadow: 8px 8px 16px $neu-2, -8px -8px 16px $white;
  border: none;
  outline: none;
  cursor: pointer;
  transition: 0.25s;

  &:hover {
    box-shadow: 6px 6px 10px $neu-2, -6px -6px 10px $white;
    transform: scale(0.985);
  }

  &:active,
  &:focus {
    box-shadow: 2px 2px 6px $neu-2, -2px -2px 6px $white;
    transform: scale(0.97);
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
}

.a-container {
  z-index: 100;
  left: calc(100% - 600px);
}

.b-container {
  left: calc(100% - 600px);
  z-index: 0;
}

.switch {
  display: flex;
  justify-content: center;
  align-items: center;
  position: absolute;
  top: 0;
  left: 0;
  height: 100%;
  width: 400px;
  padding: 50px;
  z-index: 200;
  transition: $transition;
  background-color: $neu-1;
  overflow: hidden;
  box-shadow: 4px 4px 10px $neu-2, -4px -4px 10px $white;

  &__circle {
    position: absolute;
    width: 500px;
    height: 500px;
    border-radius: 50%;
    background-color: $neu-1;
    box-shadow: inset 8px 8px 12px $neu-2, inset -8px -8px 12px $white;
    bottom: -60%;
    left: -60%;
    transition: $transition;

    &--t {
      top: -30%;
      left: 60%;
      width: 300px;
      height: 300px;
    }
  }

  &__container {
    display: flex;
    justify-content: center;
    align-items: center;
    flex-direction: column;
    position: absolute;
    width: 400px;
    padding: 50px 55px;
    transition: $transition;
    text-align: center;
  }

  &__title {
    text-align: center;
    width: 100%;
    // 使用padding-left微调，补偿感叹号的视觉偏移，让文本看起来更居中
    padding-left: 0.5em;
    // 使用letter-spacing让字符间距更均匀
    letter-spacing: 0.02em;
  }

  &__description {
    text-align: center;
    width: 100%;
    color: $gray;
    font-size: 15px;
    letter-spacing: 0.4px;
    line-height: 1.8;
    margin-top: -10px;
    margin-bottom: 30px;
    padding: 0 20px;
    font-weight: 400;
    opacity: 0.85;
  }

  &__button {
    cursor: pointer;
  }
}

.is-txr {
  left: calc(100% - 400px);
  transition: $transition;
  transform-origin: left;
}

.is-txl {
  left: 0;
  transition: $transition;
  transform-origin: right;
}

.is-z200 {
  z-index: 200;
  transition: $transition;
}

.is-hidden {
  visibility: hidden;
  opacity: 0;
  position: absolute;
  transition: $transition;
}

.is-gx {
  animation: is-gx $transition;
}

@keyframes is-gx {
  0%,
  10%,
  100% {
    width: 400px;
  }
  30%,
  50% {
    width: 500px;
  }
}

.error-message {
  color: #e74c3c;
  font-size: 12px;
  margin-top: 10px;
  text-align: center;
}

.verify-code-group {
  display: flex;
  width: 350px;
  gap: 10px;
  align-items: center;
}

.verify-code-input {
  flex: 1;
  width: auto;
}

.send-code-btn {
  height: 40px;
  padding: 0 15px;
  font-size: 12px;
  border-radius: 8px;
  background-color: $purple;
  color: $white;
  border: none;
  cursor: pointer;
  white-space: nowrap;
  box-shadow: 4px 4px 8px $neu-2, -4px -4px 8px $white;
  transition: 0.25s;

  &:hover:not(:disabled) {
    box-shadow: 2px 2px 4px $neu-2, -2px -2px 4px $white;
    transform: scale(0.98);
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
}

</style>

