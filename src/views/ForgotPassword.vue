<template>
  <div class="forgot-password-container">
    <div class="forgot-password-box">
      <h2 v-if="step !== 3" class="title">找回密码</h2>
      <p v-if="step === 1" class="description">请输入您的用户名，我们将向您的注册邮箱发送验证码</p>
      <p v-if="step === 2" class="description">请输入验证码，我们将重置您的密码</p>

      <!-- 第一步：输入用户名 -->
      <div v-if="step === 1" class="step-content">
        <input
          v-model="username"
          class="form__input"
          type="text"
          name="reset-username"
          autocomplete="username"
          placeholder="请输入用户名"
          required
        />
        <div v-if="error" class="error-message">{{ error }}</div>
        <button class="form__button button" @click="handleSendCode" :disabled="sendingCode">
          {{ sendingCode ? '发送中...' : '发送验证码' }}
        </button>
        <router-link to="/login" class="back-link">返回登录</router-link>
      </div>

      <!-- 第二步：输入验证码和新密码 -->
      <div v-if="step === 2" class="step-content">
        <input
          v-model="verifyCode"
          class="form__input"
          type="text"
          name="reset-verify-code"
          autocomplete="one-time-code"
          inputmode="numeric"
          placeholder="请输入验证码"
          required
        />
        <input
          v-model="newPassword"
          class="form__input"
          type="password"
          name="reset-new-password"
          autocomplete="new-password"
          placeholder="请输入新密码（6-20个字符）"
          required
        />
        <input
          v-model="confirmPassword"
          class="form__input"
          type="password"
          name="reset-confirm-password"
          autocomplete="new-password"
          placeholder="请确认新密码"
          required
        />
        <div v-if="error" class="error-message">{{ error }}</div>
        <button class="form__button button" @click="handleResetPassword" :disabled="resetting">
          {{ resetting ? '重置中...' : '重置密码' }}
        </button>
        <button class="form__button button secondary" @click="handleBackToStep1">
          返回上一步
        </button>
      </div>

      <!-- 成功提示 -->
      <div v-if="step === 3" class="success-content">
        <div class="success-icon">✓</div>
        <h3 class="success-title">密码重置成功！</h3>
        <p class="success-message">您的密码已成功重置，请使用新密码登录</p>
        <router-link to="/login" class="form__button button">前往登录</router-link>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { sendResetPwdCode, resetPwd } from '@/api'
import type { SendResetPwdCodeParams, ResetPwdParams } from '@/api'

const router = useRouter()

const step = ref(1) // 1: 输入用户名, 2: 输入验证码和新密码, 3: 成功
const username = ref('')
const verifyCode = ref('')
const newPassword = ref('')
const confirmPassword = ref('')
const error = ref('')
const sendingCode = ref(false)
const resetting = ref(false)

// 返回第一步
const handleBackToStep1 = () => {
  step.value = 1
  error.value = '' // 清除错误信息
  // 清空第二步的表单数据
  verifyCode.value = ''
  newPassword.value = ''
  confirmPassword.value = ''
}

// 发送验证码
const handleSendCode = async () => {
  if (!username.value.trim()) {
    error.value = '请输入用户名'
    return
  }

  sendingCode.value = true
  error.value = ''

  try {
    const params: SendResetPwdCodeParams = {
      username: username.value.trim(),
    }
    const response = await sendResetPwdCode(params)

    if (response.code === 200) {
      // 发送成功，进入下一步
      step.value = 2
      error.value = ''
    } else {
      error.value = response.message || '发送验证码失败'
    }
  } catch (err: any) {
    error.value = err.response?.data?.message || '网络错误，请稍后重试'
  } finally {
    sendingCode.value = false
  }
}

// 重置密码
const handleResetPassword = async () => {
  error.value = ''

  // 验证密码
  if (newPassword.value.length < 6 || newPassword.value.length > 20) {
    error.value = '密码长度必须在6-20个字符之间'
    return
  }

  if (newPassword.value !== confirmPassword.value) {
    error.value = '两次输入的密码不一致'
    return
  }

  if (!verifyCode.value.trim()) {
    error.value = '请输入验证码'
    return
  }

  resetting.value = true

  try {
    const params: ResetPwdParams = {
      verifyCode: verifyCode.value.trim(),
      newPwd: newPassword.value,
    }
    const response = await resetPwd(params)

    if (response.code === 200) {
      // 重置成功
      step.value = 3
      error.value = ''
    } else {
      error.value = response.message || '重置密码失败'
    }
  } catch (err: any) {
    error.value = err.response?.data?.message || '网络错误，请稍后重试'
  } finally {
    resetting.value = false
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
$green: #27ae60;

.forgot-password-container {
  width: 100%;
  height: 100vh;
  display: flex;
  justify-content: center;
  align-items: center;
  font-family: 'Montserrat', sans-serif;
  background-color: $neu-1;
  color: $gray;
}

.forgot-password-box {
  position: relative;
  width: 500px;
  min-height: 400px;
  padding: 50px;
  background-color: $neu-1;
  box-shadow: 10px 10px 10px $neu-2, -10px -10px 10px $white;
  border-radius: 12px;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.title {
  font-size: 34px;
  font-weight: 700;
  margin-bottom: 20px;
  color: $black;
}

.description {
  font-size: 14px;
  letter-spacing: 0.25px;
  text-align: center;
  line-height: 1.6;
  margin-bottom: 40px;
  color: $gray;
}

.step-content {
  width: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.form__input {
  width: 100%;
  max-width: 350px;
  height: 40px;
  margin: 10px 0;
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

.form__button {
  width: 180px;
  height: 50px;
  border-radius: 25px;
  margin-top: 30px;
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
  text-decoration: none;
  display: flex;
  align-items: center;
  justify-content: center;

  &:hover:not(:disabled) {
    box-shadow: 6px 6px 10px $neu-2, -6px -6px 10px $white;
    transform: scale(0.985);
  }

  &:active:not(:disabled),
  &:focus:not(:disabled) {
    box-shadow: 2px 2px 6px $neu-2, -2px -2px 6px $white;
    transform: scale(0.97);
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }

  &.secondary {
    background-color: $gray;
    margin-top: 15px;
  }
}

.error-message {
  color: #e74c3c;
  font-size: 12px;
  margin-top: 10px;
  text-align: center;
  min-height: 20px;
}

.back-link {
  margin-top: 20px;
  color: $black;
  font-size: 14px;
  text-decoration: none;
  border-bottom: 1px solid $gray;
  line-height: 2;
  cursor: pointer;

  &:hover {
    color: $purple;
  }
}

.success-content {
  width: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
}

.success-icon {
  width: 80px;
  height: 80px;
  border-radius: 50%;
  background-color: $green;
  color: white;
  font-size: 50px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 20px;
  box-shadow: 4px 4px 8px $neu-2, -4px -4px 8px $white;
}

.success-title {
  font-size: 24px;
  font-weight: 700;
  color: $black;
  margin-bottom: 15px;
}

.success-message {
  font-size: 14px;
  color: $gray;
  margin-bottom: 30px;
  line-height: 1.6;
}
</style>

