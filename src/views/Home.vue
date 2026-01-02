<template>
  <div class="home-container">
    <div class="home-box">
      <h1 class="welcome-title">欢迎！</h1>
      <p class="welcome-message">您已成功登录</p>
      <div class="user-info" v-if="token">
        <p>Token: {{ token.substring(0, 20) }}...</p>
      </div>
      <button class="logout-button" @click="handleLogout">退出登录</button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { logout } from '@/api'

const router = useRouter()
const token = ref('')

onMounted(() => {
  token.value = localStorage.getItem('token') || ''
  if (!token.value) {
    router.push('/login')
  }
})

const handleLogout = async () => {
  try {
    await logout()
  } catch {
    // 静默处理错误
  } finally {
    localStorage.removeItem('token')
    router.push('/login')
  }
}
</script>

<style scoped lang="scss">
$neu-1: #ecf0f3;
$neu-2: #d1d9e6;
$white: #f9f9f9;
$black: #181818;
$purple: #4b70e2;

.home-container {
  width: 100%;
  height: 100vh;
  display: flex;
  justify-content: center;
  align-items: center;
  font-family: 'Montserrat', sans-serif;
  background-color: $neu-1;
}

.home-box {
  position: relative;
  width: 500px;
  min-height: 300px;
  padding: 50px;
  background-color: $neu-1;
  box-shadow: 10px 10px 10px $neu-2, -10px -10px 10px $white;
  border-radius: 12px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}

.welcome-title {
  font-size: 42px;
  font-weight: 700;
  margin-bottom: 20px;
  color: $black;
  // 使用padding-left微调，补偿感叹号的视觉偏移，让文本看起来更居中
  padding-left: 0.5em;
  // 使用letter-spacing让字符间距更均匀
  letter-spacing: 0.02em;
}

.welcome-message {
  font-size: 18px;
  color: #a0a5a8;
  margin-bottom: 30px;
}

.user-info {
  margin-bottom: 30px;
  padding: 15px;
  background-color: $white;
  border-radius: 8px;
  box-shadow: inset 2px 2px 4px $neu-2, inset -2px -2px 4px $white;
  font-size: 12px;
  color: #666;
}

.logout-button {
  width: 180px;
  height: 50px;
  border-radius: 25px;
  font-weight: 700;
  font-size: 14px;
  letter-spacing: 1.15px;
  background-color: $purple;
  color: white;
  box-shadow: 8px 8px 16px $neu-2, -8px -8px 16px $white;
  border: none;
  outline: none;
  cursor: pointer;
  transition: 0.25s;

  &:hover {
    box-shadow: 6px 6px 10px $neu-2, -6px -6px 10px $white;
    transform: scale(0.985);
  }

  &:active {
    box-shadow: 2px 2px 6px $neu-2, -2px -2px 6px $white;
    transform: scale(0.97);
  }
}
</style>

