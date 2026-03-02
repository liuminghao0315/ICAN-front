<template>
  <router-view />
</template>

<script setup lang="ts" name="App">
</script>

<style lang="scss">
@import '@/assets/fonts/montserrat.css';

* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

html {
  font-family: 'Montserrat', sans-serif;
  overflow-x: hidden !important;
  overflow-y: scroll;
  scrollbar-gutter: stable;
  width: 100%;
  max-width: 100vw;
  margin: 0;
  padding: 0;
  background: var(--bg-page);
}

body {
  font-family: 'Montserrat', sans-serif;
  overflow-x: hidden !important;
  width: 100%;
  max-width: 100vw;
  margin: 0;
  padding: 0;
  background: var(--bg-page);
}

/* 全局滚动条美化 - 扁平风格 */
::-webkit-scrollbar {
  width: 8px;
  height: 8px;
}

::-webkit-scrollbar-track {
  background: var(--bg-page);
  border-radius: 4px;
}

::-webkit-scrollbar-thumb {
  background: var(--text-tertiary);
  border-radius: 4px;
  transition: all 0.3s ease;
}

::-webkit-scrollbar-thumb:hover {
  background: var(--text-secondary);
}

::-webkit-scrollbar-corner {
  background: var(--bg-page);
}

/* Firefox 滚动条 */
* {
  scrollbar-width: thin;
  scrollbar-color: var(--text-tertiary) var(--bg-page);
}

body {
  position: relative;
}

#app {
  width: 100%;
  max-width: 100vw;
  overflow-x: hidden;
}

/* 美化 ElMessage 消息弹出框 - 扁平化风格 */
.el-message {
  min-width: 320px;
  padding: 12px 24px;
  border-radius: 8px;
  background: #FFFFFF;
  border: 1px solid rgba(0, 0, 0, 0.03);
  box-shadow: none;
  font-family: 'Montserrat', sans-serif;
  animation: messageSlideIn 0.3s ease;
  display: flex;
  align-items: center;
  gap: 12px;
}

@keyframes messageSlideIn {
  0% {
    transform: translateY(-20px);
    opacity: 0;
  }
  100% {
    transform: translateY(0);
    opacity: 1;
  }
}

.el-message--success {
  background: #f0f9ff;
  border-color: #67C23A;
  color: #67C23A;
}

.el-message--success .el-message__icon {
  color: #67C23A;
  font-size: 20px;
  flex-shrink: 0;
}

.el-message--error {
  background: #fef0f0;
  border-color: #F56C6C;
  color: #F56C6C;
}

.el-message--error .el-message__icon {
  color: #F56C6C;
  font-size: 20px;
  flex-shrink: 0;
}

.el-message--warning {
  background: #fdf6ec;
  border-color: #E6A23C;
  color: #E6A23C;
}

.el-message--warning .el-message__icon {
  color: #E6A23C;
  font-size: 20px;
  flex-shrink: 0;
}

.el-message--info {
  background: #f4f4f5;
  border-color: #909399;
  color: #909399;
}

.el-message--info .el-message__icon {
  color: #909399;
  font-size: 20px;
  flex-shrink: 0;
}

.el-message__content {
  font-size: 14px;
  font-weight: 500;
  line-height: 1.6;
  flex: 1;
  color: #303133;
}

.el-message__closeBtn {
  color: #909399;
  opacity: 0.8;
  font-size: 16px;
  transition: all 0.2s;
  flex-shrink: 0;
  cursor: pointer;
}

.el-message__closeBtn:hover {
  opacity: 1;
  color: #606266;
}

/* ===== 全局主题 CSS 变量 - 扁平化 ===== */
:root,
[data-theme='light'] {
  --bg-page: #F5F7FA;
  --bg-card: #FFFFFF;
  --bg-hover: #F5F7FA;
  --bg-input: #FFFFFF;
  --bg-icon: #F5F7FA;
  --border-color: #EBEEF5;
  --text-primary: #303133;
  --text-secondary: #606266;
  --text-tertiary: #909399;
  --color-primary: #409EFF;
  --shadow-sm: 0 1px 3px rgba(0, 0, 0, 0.08);
  --shadow-md: 0 2px 8px rgba(0, 0, 0, 0.1);
  --shadow-lg: 0 4px 16px rgba(0, 0, 0, 0.12);
  --shadow-primary: 0 2px 8px rgba(64, 158, 255, 0.3);
}

[data-theme='dark'] {
  --bg-page: #0f1117;
  --bg-card: #1a1d2e;
  --bg-hover: #22263a;
  --bg-input: #22263a;
  --bg-icon: #22263a;
  --border-color: #2e3248;
  --text-primary: #e8eaf6;
  --text-secondary: #9ba3c4;
  --text-tertiary: #5a6080;
  --color-primary: #409EFF;
  --shadow-sm: none;
  --shadow-md: none;
  --shadow-lg: none;
  --shadow-primary: 0 0 0 1px rgba(64, 158, 255, 0.3);

  /* 主内容区背景 */
  .main-content,
  .el-main {
    background-color: var(--bg-page) !important;
  }

  /* 所有卡片和面板 */
  .welcome-banner,
  .stat-container,
  .chart-card,
  .quick-actions,
  .card-item,
  .list-item,
  .sidebar,
  .header {
    background-color: var(--bg-card) !important;
  }

  /* 所有文本颜色 */
  h1, h2, h3, h4, h5, h6,
  .stat-label,
  .chart-title,
  .username,
  .nav-label {
    color: var(--text-primary) !important;
  }

  p, span, div {
    color: var(--text-secondary);
  }

  /* 边框颜色 */
  .welcome-banner,
  .chart-card,
  .card-item,
  .sidebar,
  .header {
    border-color: var(--border-color) !important;
  }

  /* 输入框 */
  input, textarea, select {
    background-color: var(--bg-input) !important;
    color: var(--text-primary) !important;
    border-color: var(--border-color) !important;
  }
}

/* Dashboard 首屏防闪：在路由级 scoped 样式注入前，先给关键块提供稳定底色 */
.dashboard .welcome-banner,
.dashboard .neu-card,
.dashboard .video-item,
.dashboard .task-item,
.dashboard .action-btn,
.dashboard .neu-btn {
  background-color: var(--bg-card);
  border-color: var(--border-color);
}

.dashboard .card-title,
.dashboard .video-title,
.dashboard .task-title {
  color: var(--text-primary);
}

.dashboard .video-meta,
.dashboard .task-meta,
.dashboard .chart-label,
.dashboard .count {
  color: var(--text-secondary);
}
</style>
