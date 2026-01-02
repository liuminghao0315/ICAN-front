<template>
  <div class="not-found-page">
    <div class="not-found-content">
      <div class="error-code">404</div>
      <h1 class="error-title">页面未找到</h1>
      <p class="error-message">抱歉，您访问的页面不存在或已被移除</p>
      <div class="error-actions">
        <button class="neu-btn primary-btn" @click="goHome">
          <el-icon><HomeFilled /></el-icon>
          返回首页
        </button>
        <button class="neu-btn" @click="goBack">
          <el-icon><ArrowLeft /></el-icon>
          返回上一页
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router'

const router = useRouter()

const goHome = () => {
  router.push('/dashboard')
}

const goBack = () => {
  router.back()
}
</script>

<style scoped lang="scss">
$neu-1: #ecf0f3;
$neu-2: #d1d9e6;
$white: #f9f9f9;
$gray: #a0a5a8;
$black: #181818;
$purple: #4b70e2;

.not-found-page {
  width: 100%;
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: $neu-1;
  padding: 20px;
}

.not-found-content {
  text-align: center;
  max-width: 600px;
  
  .error-code {
    font-size: 120px;
    font-weight: 800;
    color: $purple;
    line-height: 1;
    margin-bottom: 20px;
    text-shadow: 
      8px 8px 16px rgba(209, 217, 230, 0.5),
      -8px -8px 16px rgba(255, 255, 255, 0.9);
    background: linear-gradient(135deg, $purple 0%, #7c9df7 100%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
  }
  
  .error-title {
    font-size: 32px;
    font-weight: 700;
    color: $black;
    margin-bottom: 16px;
  }
  
  .error-message {
    font-size: 16px;
    color: $gray;
    margin-bottom: 40px;
    line-height: 1.6;
  }
  
  .error-actions {
    display: flex;
    gap: 16px;
    justify-content: center;
    flex-wrap: wrap;
  }
}

// 新拟态按钮
.neu-btn {
  background: $neu-1;
  border: none;
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.25s;
  box-shadow: 4px 4px 8px $neu-2, -4px -4px 8px $white;
  color: $gray;
  font-family: 'Montserrat', sans-serif;
  padding: 12px 24px;
  font-size: 14px;
  display: flex;
  align-items: center;
  gap: 8px;
  
  &:hover {
    box-shadow: 2px 2px 4px $neu-2, -2px -2px 4px $white;
    color: $purple;
  }
  
  &:active {
    box-shadow: inset 2px 2px 4px $neu-2, inset -2px -2px 4px $white;
  }
  
  &.primary-btn {
    background: linear-gradient(135deg, $purple 0%, #7c9df7 100%);
    color: #fff;
    
    &:hover {
      box-shadow: 4px 4px 8px $neu-2, -2px -2px 6px $white;
      color: #fff;
    }
  }
}
</style>

