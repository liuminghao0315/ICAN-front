<template>
  <router-view />
</template>

<script setup lang="ts" name="App">
</script>

<style>
@import url('https://fonts.googleapis.com/css2?family=Montserrat:wght@400;700;800&display=swap');

* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

html, body {
  font-family: 'Montserrat', sans-serif;
  overflow-x: hidden !important;
  width: 100%;
  max-width: 100vw;
  margin: 0;
  padding: 0;
}

/* 全局滚动条美化 - 柔和风格 */
::-webkit-scrollbar {
  width: 8px;
  height: 8px;
}

::-webkit-scrollbar-track {
  background: #e8ecef;
  border-radius: 4px;
}

::-webkit-scrollbar-thumb {
  background: #c5cdd5;
  border-radius: 4px;
  transition: all 0.3s ease;
}

::-webkit-scrollbar-thumb:hover {
  background: #a8b4c0;
}

::-webkit-scrollbar-corner {
  background: #e8ecef;
}

/* Firefox 滚动条 */
* {
  scrollbar-width: thin;
  scrollbar-color: #c5cdd5 #e8ecef;
}

body {
  position: relative;
  overflow-x: hidden !important;
}

#app {
  width: 100%;
  max-width: 100vw;
  overflow-x: hidden;
}

/* 美化 ElMessage 消息弹出框 - 新拟态风格 */
.el-message {
  min-width: 320px;
  padding: 12px 24px;
  border-radius: 16px;
  box-shadow: 8px 8px 20px rgba(209, 217, 230, 0.5), -8px -8px 20px rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(12px);
  border: 1px solid rgba(255, 255, 255, 0.5);
  font-family: 'Montserrat', sans-serif;
  animation: messageSlideIn 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
  display: flex;
  align-items: center;
  gap: 12px;
}

@keyframes messageSlideIn {
  0% {
    transform: translateY(-30px) scale(0.9);
    opacity: 0;
  }
  100% {
    transform: translateY(0) scale(1);
    opacity: 1;
  }
}

.el-message--success {
  background: linear-gradient(135deg, #f0f9f4 0%, #e8f5e9 100%);
  color: #2e7d32;
}

.el-message--success .el-message__icon {
  color: #4caf50;
  font-size: 22px;
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  background: rgba(76, 175, 80, 0.15);
  flex-shrink: 0;
}

.el-message--error {
  background: linear-gradient(135deg, #fef0f0 0%, #fde8e8 100%);
  color: #c62828;
}

.el-message--error .el-message__icon {
  color: #f44336;
  font-size: 22px;
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  background: rgba(244, 67, 54, 0.15);
  flex-shrink: 0;
}

.el-message--warning {
  background: linear-gradient(135deg, #fff8e8 0%, #fff3e0 100%);
  color: #e65100;
}

.el-message--warning .el-message__icon {
  color: #ff9800;
  font-size: 22px;
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  background: rgba(255, 152, 0, 0.15);
  flex-shrink: 0;
}

.el-message--info {
  background: linear-gradient(135deg, #e8f4f8 0%, #e3f2fd 100%);
  color: #1565c0;
}

.el-message--info .el-message__icon {
  color: #2196f3;
  font-size: 22px;
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  background: rgba(33, 150, 243, 0.15);
  flex-shrink: 0;
}

.el-message__content {
  font-size: 14px;
  font-weight: 500;
  line-height: 1.6;
  flex: 1;
}

.el-message__closeBtn {
  color: inherit;
  opacity: 0.5;
  font-size: 18px;
  transition: all 0.2s;
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  flex-shrink: 0;
}

.el-message__closeBtn:hover {
  opacity: 1;
  background: rgba(0, 0, 0, 0.05);
  transform: scale(1.1);
}
</style>
