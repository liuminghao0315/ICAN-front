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
$color-primary: #4b70e2;
$color-primary-light: #7c9df7;

.not-found-page {
  --nf-bg: var(--bg-page);
  --nf-title: var(--text-primary);
  --nf-message: var(--text-secondary);
  --nf-btn-bg: var(--bg-card);
  --nf-btn-color: var(--text-secondary);
  --nf-btn-border: var(--border-color);
  --nf-code-shadow-1: rgba(209, 217, 230, 0.5);
  --nf-code-shadow-2: rgba(255, 255, 255, 0.9);
  --nf-code-start: #4b70e2;
  --nf-code-end: #7c9df7;

  width: 100%;
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--nf-bg);
  padding: 20px;
}

.not-found-content {
  text-align: center;
  max-width: 600px;

  .error-code {
    font-size: 120px;
    font-weight: 800;
    color: $color-primary;
    line-height: 1;
    margin-bottom: 20px;
    text-shadow:
      8px 8px 16px var(--nf-code-shadow-1),
      -8px -8px 16px var(--nf-code-shadow-2);
    background: linear-gradient(135deg, var(--nf-code-start) 0%, var(--nf-code-end) 100%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
  }

  .error-title {
    font-size: 32px;
    font-weight: 700;
    color: var(--nf-title);
    margin-bottom: 16px;
  }

  .error-message {
    font-size: 16px;
    color: var(--nf-message);
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

.neu-btn {
  background: var(--nf-btn-bg);
  border: 1px solid var(--nf-btn-border);
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1);
  box-shadow: none;
  color: var(--nf-btn-color);
  font-family: 'Montserrat', sans-serif;
  padding: 12px 24px;
  font-size: 14px;
  display: flex;
  align-items: center;
  gap: 8px;

  &:hover {
    color: $color-primary;
    transform: scale(1.02);
  }

  &:active {
    transform: scale(0.98);
  }

  &:focus-visible {
    outline: 2px solid rgba(64, 158, 255, 0.45);
    outline-offset: 2px;
  }

  &.primary-btn {
    background: linear-gradient(135deg, $color-primary 0%, $color-primary-light 100%);
    border-color: transparent;
    color: #fff !important;

    &:hover {
      color: #fff !important;
    }
  }
}

[data-theme='dark'] .not-found-page {
  --nf-code-shadow-1: rgba(0, 0, 0, 0.35);
  --nf-code-shadow-2: rgba(255, 255, 255, 0.08);
  --nf-btn-bg: #1f2438;
  --nf-btn-color: #c2c8e3;
  --nf-btn-border: #2e3248;
}
</style>

