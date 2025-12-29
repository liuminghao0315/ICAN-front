<template>
  <el-container class="main-layout">
    <!-- 侧边栏 -->
    <el-aside :width="isCollapse ? '64px' : '220px'" class="sidebar" :class="{ 'is-collapsed': isCollapse }"
      @transitionend="handleSidebarTransitionEnd">
      <div class="logo" @click="router.push('/')">
        <div class="logo-icon">
          <el-icon :size="24">
            <VideoCamera />
          </el-icon>
        </div>
        <span v-show="!isCollapse" class="logo-text">ICAN视频</span>
      </div>

      <el-menu :default-active="route.path" :collapse="isCollapse" :router="true" class="sidebar-menu">
        <el-menu-item index="/dashboard">
          <el-icon>
            <DataAnalysis />
          </el-icon>
          <template #title>工作台</template>
        </el-menu-item>

        <el-menu-item index="/videos">
          <el-icon>
            <VideoPlay />
          </el-icon>
          <template #title>我的视频</template>
        </el-menu-item>

        <el-menu-item index="/upload">
          <el-icon>
            <Upload />
          </el-icon>
          <template #title>上传视频</template>
        </el-menu-item>

        <el-menu-item index="/tasks">
          <el-icon>
            <List />
          </el-icon>
          <template #title>分析任务</template>
        </el-menu-item>

        <el-menu-item index="/analysis">
          <el-icon>
            <TrendCharts />
          </el-icon>
          <template #title>分析结果</template>
        </el-menu-item>
      </el-menu>

      <!-- 折叠按钮 -->
      <div class="collapse-btn" @click="isCollapse = !isCollapse">
        <el-icon :size="16">
          <DArrowLeft v-if="!isCollapse" />
          <DArrowRight v-else />
        </el-icon>
      </div>
    </el-aside>

    <!-- 主内容区 -->
    <el-container class="main-container">
      <!-- 分析中任务广播提示 -->
      <Transition name="broadcast">
        <div class="analysis-broadcast" v-if="hasAnalyzingTasks">
          <div class="broadcast-content">
            <div class="broadcast-icon">
              <el-icon>
                <Loading class="rotating" />
              </el-icon>
            </div>
            <div class="broadcast-text">
              <span class="broadcast-title">正在分析中</span>
              <span class="broadcast-desc">您有 {{ analyzingTaskCount }} 个任务正在处理，请稍候...</span>
            </div>
            <button class="broadcast-link" @click="router.push('/tasks')">
              查看任务
              <el-icon>
                <ArrowRight />
              </el-icon>
            </button>
          </div>
        </div>
      </Transition>

      <!-- 顶部导航 -->
      <el-header class="header">
        <div class="header-left">
          <el-breadcrumb separator="/">
            <el-breadcrumb-item :to="{ path: '/' }">首页</el-breadcrumb-item>
            <el-breadcrumb-item v-if="route.meta.title">{{ route.meta.title }}</el-breadcrumb-item>
          </el-breadcrumb>
        </div>

        <div class="header-right">
          <div class="user-dropdown" ref="userDropdownRef">
            <div class="user-info" ref="userInfoRef" @click="toggleDropdown">
              <div class="user-avatar">
                {{ (userStore.userInfo?.username || '用户').charAt(0).toUpperCase() }}
              </div>
              <span class="username">{{ userStore.userInfo?.username || '用户' }}</span>
              <svg class="dropdown-arrow" :class="{ 'is-open': isDropdownOpen }" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M6 9l6 6 6-6" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
            </div>
            
            <Teleport to="body">
              <Transition name="dropdown">
                <div class="dropdown-menu" v-if="isDropdownOpen" :style="dropdownStyle">
                  <div class="dropdown-menu-inner">
                    <button class="logout-btn" @click="showLogoutConfirm = true; isDropdownOpen = false">
                      <div class="logout-icon">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                          <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4" stroke-linecap="round" stroke-linejoin="round"/>
                          <polyline points="16,17 21,12 16,7" stroke-linecap="round" stroke-linejoin="round"/>
                          <line x1="21" y1="12" x2="9" y2="12" stroke-linecap="round" stroke-linejoin="round"/>
                        </svg>
                      </div>
                      <span class="logout-text">退出</span>
                      <div class="logout-hover-bg"></div>
                    </button>
                  </div>
                </div>
              </Transition>
            </Teleport>
            
            <!-- 自定义退出确认对话框 -->
            <Teleport to="body">
              <Transition name="modal">
                <div class="confirm-modal-overlay" v-if="showLogoutConfirm" @click.self="showLogoutConfirm = false">
                  <div class="confirm-modal">
                    <div class="confirm-modal-header">
                      <div class="confirm-icon">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                          <circle cx="12" cy="12" r="10"/>
                          <line x1="12" y1="8" x2="12" y2="12"/>
                          <line x1="12" y1="16" x2="12.01" y2="16"/>
                        </svg>
                      </div>
                      <h3 class="confirm-title">确认退出</h3>
                    </div>
                    <p class="confirm-message">确定要退出登录吗？</p>
                    <div class="confirm-actions">
                      <button class="confirm-btn cancel-btn" @click="showLogoutConfirm = false">
                        取消
                      </button>
                      <button class="confirm-btn primary-btn" @click="handleLogout">
                        确定
                      </button>
                    </div>
                  </div>
                </div>
              </Transition>
            </Teleport>
          </div>
        </div>
      </el-header>

      <!-- 内容区 -->
      <el-main class="main-content">
        <router-view />
      </el-main>
    </el-container>
  </el-container>
</template>

<script setup lang="ts">
  import { ref, computed, onMounted, watch, onUnmounted } from 'vue'
  import { useRouter, useRoute } from 'vue-router'
  import { useUserStore } from '@/stores'
  import { useWebSocketStore } from '@/stores/websocket'
  import { getTaskList } from '@/api'
  import { useWebSocket } from '@/composables/useWebSocket'

  const router = useRouter()
  const route = useRoute()
  const userStore = useUserStore()
  const wsStore = useWebSocketStore()

  const isCollapse = ref(false)
  const hasAnalyzingTasks = ref(false)
  const analyzingTaskCount = ref(0)
  const isDropdownOpen = ref(false)
  const showLogoutConfirm = ref(false)
  const userDropdownRef = ref<HTMLElement | null>(null)
  const userInfoRef = ref<HTMLElement | null>(null)
  const dropdownPosition = ref({ top: 0, right: 0 })

  // 计算下拉菜单位置样式
  const dropdownStyle = computed(() => ({
    position: 'fixed' as const,
    top: `${dropdownPosition.value.top}px`,
    right: `${dropdownPosition.value.right}px`,
    zIndex: 2000
  }))

  // 切换下拉菜单
  const toggleDropdown = (event: MouseEvent) => {
    event.stopPropagation()
    
    // 计算下拉菜单位置
    if (userInfoRef.value) {
      const rect = userInfoRef.value.getBoundingClientRect()
      dropdownPosition.value = {
        top: rect.bottom + 8,
        right: window.innerWidth - rect.right
      }
    }
    
    isDropdownOpen.value = !isDropdownOpen.value
  }

  // 点击外部关闭下拉菜单
  const handleClickOutside = (event: MouseEvent) => {
    if (userDropdownRef.value && !userDropdownRef.value.contains(event.target as Node)) {
      isDropdownOpen.value = false
    }
  }

  // 检查分析中的任务
  const checkAnalyzingTasks = async () => {
    if (!userStore.isLoggedIn) {
      hasAnalyzingTasks.value = false
      analyzingTaskCount.value = 0
      return
    }

    try {
      // 同时查询 PROCESSING 和 PENDING 状态的任务
      const [processingResponse, pendingResponse] = await Promise.all([
        getTaskList(1, 100, 'PROCESSING'),
        getTaskList(1, 100, 'PENDING')
      ])

      const processingCount = processingResponse.code === 200 ? (processingResponse.data.total || 0) : 0
      const pendingCount = pendingResponse.code === 200 ? (pendingResponse.data.total || 0) : 0
      const totalCount = processingCount + pendingCount

      hasAnalyzingTasks.value = totalCount > 0
      analyzingTaskCount.value = totalCount
    } catch (error) {
      // 静默失败，不影响用户体验
    }
  }

  // 使用 WebSocket 监听任务状态变化
  const { subscribeProgress, subscribeCompleted, subscribeFailed } = useWebSocket()

  // 监听任务进度更新
  subscribeProgress(() => {
    checkAnalyzingTasks()
  })

  // 监听任务完成
  subscribeCompleted(() => {
    checkAnalyzingTasks()
  })

  // 监听任务失败
  subscribeFailed(() => {
    checkAnalyzingTasks()
  })

  // 监听登录状态变化，自动连接/断开 WebSocket
  watch(
    () => userStore.isLoggedIn,
    (isLoggedIn) => {
      if (isLoggedIn) {
        wsStore.connect()
        // 登录后检查分析中的任务
        checkAnalyzingTasks()
      } else {
        // 登出时清除任务状态
        hasAnalyzingTasks.value = false
        analyzingTaskCount.value = 0
      }
    },
    { immediate: true }
  )

  // 任务检查定时器
  let taskCheckInterval: ReturnType<typeof setInterval> | null = null

  // 同时在 onMounted 中也尝试连接（双重保险）
  onMounted(() => {
    if (userStore.isLoggedIn && !wsStore.isConnected) {
      wsStore.connect()
    }
    // 检查分析中的任务
    checkAnalyzingTasks()
    // 定期检查任务状态（每30秒）
    taskCheckInterval = setInterval(checkAnalyzingTasks, 30000)
    // 监听点击外部关闭下拉菜单
    document.addEventListener('click', handleClickOutside)
  })

  onUnmounted(() => {
    if (taskCheckInterval) {
      clearInterval(taskCheckInterval)
      taskCheckInterval = null
    }
    // 移除点击外部关闭下拉菜单的事件监听
    document.removeEventListener('click', handleClickOutside)
  })

  // 处理侧边栏过渡动画完成
  const handleSidebarTransitionEnd = (event: TransitionEvent) => {
    // 只处理 width 属性的过渡完成
    if (event.propertyName !== 'width') return

    // 检查是否是收起状态
    if (isCollapse.value) {
      const updateTooltipPadding = () => {
        const elemList = document.querySelectorAll<HTMLElement>('.el-menu-tooltip__trigger.el-tooltip__trigger');
        if (elemList.length > 0) {
          elemList.forEach(elem => {
            elem.style.paddingLeft = "10px";
          });
          return true;
        }
        return false;
      };

      // 初始尝试
      if (!updateTooltipPadding()) {
        // 若未找到，最多尝试10次，间隔10ms后重试
        let retryCount = 0;
        const maxRetries = 10;
        const intervalId = setInterval(() => {
          if (updateTooltipPadding() || ++retryCount >= maxRetries) {
            clearInterval(intervalId);
          }
        }, 10);
      }
    }
  }

  const handleLogout = () => {
    showLogoutConfirm.value = false
    // 退出时断开 WebSocket
    wsStore.disconnect()
    userStore.logout()
    router.push('/login')
  }
</script>

<style scoped lang="scss">
// 新拟态配色 - 与登录页保持一致
$bg: #edf2f0;
$neu-1: #ecf0f3;
$neu-2: #d1d9e6;
$white: #f9f9f9;
$gray: #a0a5a8;
$black: #181818;
$purple: #4b70e2;

.main-layout {
  height: 100vh;
  width: 100%;
  max-width: 100vw;
  overflow-x: hidden !important;
  // 使用与内容区完全一致的纯色背景
  background-color: #ebf0f2;

  // 确保 Element Plus 容器不会溢出
  :deep(.el-container) {
    width: 100%;
    max-width: 100vw;
    overflow-x: hidden;
  }

  :deep(.el-aside) {
    overflow-x: hidden;
  }
}

.sidebar {
  background-color: $neu-1;
  transition: width 0.3s;
  display: flex;
  flex-direction: column;
  position: relative;
  box-shadow: 4px 0 10px $neu-2;

  .logo {
    height: 70px;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 12px;
    cursor: pointer;
    padding: 0 16px;

    .logo-icon {
      width: 42px;
      height: 42px;
      min-width: 42px; // 确保收起时保持正方形
      min-height: 42px;
      background: linear-gradient(135deg, $purple 0%, #7c9df7 100%);
      border-radius: 12px;
      display: flex;
      align-items: center;
      justify-content: center;
      color: #fff;
      box-shadow: 4px 4px 8px $neu-2, -2px -2px 6px $white;
      flex-shrink: 0; // 防止被压缩
    }

    .logo-text {
      font-size: 18px;
      font-weight: 700;
      color: $black;
      white-space: nowrap;
      letter-spacing: 1px;
    }
  }

  // 收起状态下logo的样式
  &.is-collapsed .logo {
    padding: 0;
    justify-content: center;

    .logo-icon {
      width: 42px;
      height: 42px;
      border-radius: 12px; // 保持正方形圆角
    }
  }

  .sidebar-menu {
    flex: 1;
    border-right: none;
    background-color: transparent;
    padding: 10px;

    :deep(.el-menu-item) {
      height: 48px;
      line-height: 48px;
      margin-bottom: 8px;
      border-radius: 12px;
      color: $gray;
      background-color: $neu-1;
      box-shadow: 4px 4px 8px $neu-2, -4px -4px 8px $white;
      transition: all 0.3s;

      &:hover {
        color: $purple;
        box-shadow: 2px 2px 4px $neu-2, -2px -2px 4px $white;
      }

      &.is-active {
        background: linear-gradient(135deg, $purple 0%, #7c9df7 100%);
        color: #fff;
        box-shadow: 4px 4px 8px $neu-2, -2px -2px 6px $white;
      }
    }

    :deep(.el-menu--collapse) {
      .el-menu-item {
        padding: 0 !important;
        display: flex !important;
        justify-content: center !important;
        align-items: center !important;

        // 确保图标居中
        .el-icon {
          margin: 0 !important;
        }

        // 隐藏文字
        span {
          display: none;
        }
        
        // 收起状态下保持 active 状态的蓝色样式
        &.is-active {
          background: linear-gradient(135deg, $purple 0%, #7c9df7 100%) !important;
          color: #fff !important;
          box-shadow: 4px 4px 8px $neu-2, -2px -2px 6px $white !important;
        }
      }
    }

    // 确保菜单项在收起状态下完全居中
    :deep(.el-menu--collapse .el-menu-item) {
      width: 100% !important;
      text-align: center !important;
    }
  }

  .collapse-btn {
    height: 48px;
    display: flex;
    align-items: center;
    justify-content: center;
    color: $gray;
    cursor: pointer;
    margin: 10px;
    border-radius: 12px;
    background-color: $neu-1;
    box-shadow: 4px 4px 8px $neu-2, -4px -4px 8px $white;
    transition: all 0.3s;

    &:hover {
      color: $purple;
      box-shadow: inset 2px 2px 4px $neu-2, inset -2px -2px 4px $white;
    }
  }
}

.main-container {
  display: flex;
  flex-direction: column;
  width: 100%;
  max-width: 100vw;
  overflow-x: hidden !important;
  min-width: 0; // 防止 flex 子元素溢出

  // 确保 Element Plus 容器不会溢出
  :deep(.el-header) {
    width: 100%;
    max-width: 100%;
    overflow-x: hidden;
  }

  :deep(.el-main) {
    width: 100%;
    max-width: 100%;
    overflow-x: hidden;
  }
}

// 分析中任务广播提示过渡动画
.broadcast-enter-active {
  transition: all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.broadcast-leave-active {
  transition: all 0.3s cubic-bezier(0.55, 0.06, 0.68, 0.19);
}

.broadcast-enter-from {
  transform: translateY(-100%);
  opacity: 0;
}

.broadcast-enter-to {
  transform: translateY(0);
  opacity: 1;
}

.broadcast-leave-from {
  transform: translateY(0);
  opacity: 1;
}

.broadcast-leave-to {
  transform: translateY(-100%);
  opacity: 0;
}

// 分析中任务广播提示
.analysis-broadcast {
  width: 100%;
  background: linear-gradient(135deg, #4b70e2, #6b8be8);
  color: white;
  padding: 12px 24px;
  box-shadow: 0 2px 8px rgba(75, 112, 226, 0.3);
  z-index: 100;

  .broadcast-content {
    display: flex;
    align-items: center;
    gap: 16px;
    max-width: 1400px;
    margin: 0 auto;
  }

  .broadcast-icon {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 32px;
    height: 32px;
    border-radius: 50%;
    background: rgba(255, 255, 255, 0.2);
    backdrop-filter: blur(4px);
    flex-shrink: 0;

    .el-icon {
      font-size: 18px;
      color: white;
    }

    .rotating {
      animation: rotate 2s linear infinite;
    }
  }

  .broadcast-text {
    flex: 1;
    display: flex;
    align-items: center;
    gap: 12px;

    .broadcast-title {
      font-size: 15px;
      font-weight: 600;
      white-space: nowrap;
    }

    .broadcast-desc {
      font-size: 13px;
      opacity: 0.9;
      white-space: nowrap;
    }
  }

  .broadcast-link {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 6px 16px;
    border: 1px solid rgba(255, 255, 255, 0.3);
    border-radius: 20px;
    background: rgba(255, 255, 255, 0.15);
    color: white;
    font-size: 13px;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.3s ease;
    backdrop-filter: blur(4px);
    white-space: nowrap;

    .el-icon {
      font-size: 12px;
      transition: transform 0.3s ease;
    }

    &:hover {
      background: rgba(255, 255, 255, 0.25);
      border-color: rgba(255, 255, 255, 0.5);
      transform: translateX(2px);

      .el-icon {
        transform: translateX(2px);
      }
    }

    &:active {
      transform: translateX(1px) scale(0.98);
    }
  }
}

@keyframes slideDown {
  from {
    opacity: 0;
    transform: translateY(-100%);
  }

  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes rotate {
  from {
    transform: rotate(0deg);
  }

  to {
    transform: rotate(360deg);
  }
}

.header {
  // 使用与内容区完全一致的背景色，不使用渐变
  background-color: #ebf0f2;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 0 0 24px; // 右侧 padding 设为 0，让 user-info 延伸到边缘
  margin: 0 0 0 0; // 上、右外边距为 0，紧贴边缘
  border-radius: 0 0 16px 16px; // 只保留底部圆角
  // 移除新拟态阴影，只使用非常轻的边框来定义边界
  border: 1px solid rgba(209, 217, 230, 0.3);
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
  // 不使用 overflow: hidden，否则会裁剪下拉菜单

  :deep(.el-breadcrumb__item) {
    .el-breadcrumb__inner {
      color: $gray;
      font-weight: 500;

      &.is-link:hover {
        color: $purple;
      }
    }

    &:last-child {
      .el-breadcrumb__inner {
        color: $black;
      }
    }
  }

  .header-right {
    .user-info {
      display: flex;
      align-items: center;
      gap: 10px;
      cursor: pointer;
      padding: 8px 20px 8px 16px;
      // 左上、左下有圆角，右上、右下与 header 对齐（0 和 16px）
      border-radius: 12px 0 16px 12px;
      background-color: transparent;
      transition: all 0.3s;
      position: relative;

      // 添加悬停效果，使用伪元素创建背景
      &::before {
        content: '';
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(75, 112, 226, 0.08);
        opacity: 0;
        transition: opacity 0.3s;
        // 确保伪元素也有完整的圆角（左上、左下、右下）
        border-radius: 12px 0 16px 12px;
      }

      &:hover {
        &::before {
          opacity: 1;
        }
      }

      &:active {
        &::before {
          background: rgba(75, 112, 226, 0.12);
        }
      }

      .user-avatar {
        width: 36px;
        height: 36px;
        border-radius: 50%;
        background: linear-gradient(135deg, $purple 0%, #7c9df7 100%);
        color: #fff;
        font-size: 14px;
        font-weight: 600;
        display: flex;
        align-items: center;
        justify-content: center;
        flex-shrink: 0;
        position: relative;
        z-index: 1;
        cursor: default;
        user-select: none;
      }

      .username {
        font-size: 14px;
        color: $black;
        font-weight: 500;
        white-space: nowrap;
        position: relative;
        z-index: 1;
      }
    }
  }
}

// 自定义用户下拉菜单
.user-dropdown {
  position: relative;
}

.dropdown-arrow {
  width: 16px;
  height: 16px;
  color: $gray;
  transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  flex-shrink: 0;
  position: relative;
  z-index: 1;
  
  &.is-open {
    transform: rotate(180deg);
  }
}


.main-content {
  padding: 20px;
  padding-right: 20px;
  margin-right: 4px;
  overflow-y: auto;
  overflow-x: hidden;
  width: 100%;
  min-width: 0; // 防止 flex 子元素溢出
  // 使用与 header 完全一致的纯色背景
  background-color: #ebf0f2;

  &::-webkit-scrollbar {
    width: 6px;
  }

  &::-webkit-scrollbar-track {
    background: transparent;
    border-radius: 3px;
  }

  &::-webkit-scrollbar-thumb {
    background: rgba($neu-2, 0.5);
    border-radius: 3px;
    transition: background 0.2s;

    &:hover {
      background: rgba($neu-2, 0.7);
    }
  }
}
</style>

<!-- 全局样式用于 Teleport 的下拉菜单 -->
<style lang="scss">
// 新拟态配色
$neu-1: #ecf0f3;
$neu-2: #d1d9e6;
$white: #f9f9f9;
$gray: #a0a5a8;
$black: #181818;

.dropdown-menu {
  min-width: 150px;
}

.dropdown-menu-inner {
  background: $white;
  border-radius: 16px;
  padding: 10px;
  box-shadow: 
    8px 8px 24px rgba(209, 217, 230, 0.9),
    -8px -8px 24px rgba(255, 255, 255, 1),
    0 8px 32px rgba(0, 0, 0, 0.12);
  border: 1px solid rgba(255, 255, 255, 0.9);
}

.logout-btn {
  position: relative;
  display: flex;
  align-items: center;
  gap: 12px;
  width: 100%;
  padding: 14px 16px;
  border: none;
  border-radius: 12px;
  background: $neu-1;
  cursor: pointer;
  overflow: hidden;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow: 
    3px 3px 6px $neu-2,
    -3px -3px 6px $white;
}

.logout-hover-bg {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(135deg, rgba(239, 68, 68, 0.1), rgba(239, 68, 68, 0.15));
  border-radius: 12px;
  opacity: 0;
  transition: opacity 0.3s ease;
  z-index: 0;
}

.logout-icon {
  position: relative;
  z-index: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  border-radius: 10px;
  background: linear-gradient(135deg, $neu-1, $white);
  box-shadow: 
    3px 3px 6px $neu-2,
    -3px -3px 6px $white;
  transition: all 0.3s ease;
  
  svg {
    width: 18px;
    height: 18px;
    color: $gray;
    transition: all 0.3s ease;
  }
}

.logout-text {
  position: relative;
  z-index: 1;
  font-size: 14px;
  font-weight: 600;
  color: $black;
  transition: all 0.3s ease;
  letter-spacing: 0.5px;
}

.logout-btn:hover {
  transform: translateX(3px);
  box-shadow: 
    2px 2px 4px $neu-2,
    -2px -2px 4px $white;
  
  .logout-hover-bg {
    opacity: 1;
  }
  
  .logout-icon {
    background: linear-gradient(135deg, #ef4444, #f87171);
    box-shadow: 
      3px 3px 10px rgba(239, 68, 68, 0.4),
      -2px -2px 6px $white;
    
    svg {
      color: white;
      transform: translateX(2px);
    }
  }
  
  .logout-text {
    color: #ef4444;
  }
}

.logout-btn:active {
  transform: translateX(3px) scale(0.98);
  box-shadow: 
    inset 2px 2px 4px $neu-2,
    inset -2px -2px 4px $white;
  
  .logout-icon {
    box-shadow: 
      inset 2px 2px 4px rgba(0, 0, 0, 0.15),
      inset -2px -2px 4px rgba(255, 255, 255, 0.5);
  }
}

// 下拉菜单动画
.dropdown-enter-active {
  animation: dropdown-in 0.25s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.dropdown-leave-active {
  animation: dropdown-out 0.2s cubic-bezier(0.4, 0, 0.2, 1);
}

@keyframes dropdown-in {
  0% {
    opacity: 0;
    transform: translateY(-10px) scale(0.95);
  }
  100% {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

@keyframes dropdown-out {
  0% {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
  100% {
    opacity: 0;
    transform: translateY(-10px) scale(0.95);
  }
}

// 自定义确认对话框
.confirm-modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.35);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 3000;
}

.confirm-modal {
  background: $white;
  border-radius: 20px;
  padding: 28px 32px;
  min-width: 320px;
  max-width: 400px;
  box-shadow: 
    12px 12px 30px rgba(209, 217, 230, 0.9),
    -12px -12px 30px rgba(255, 255, 255, 1),
    0 20px 60px rgba(0, 0, 0, 0.15);
  border: 1px solid rgba(255, 255, 255, 0.9);
}

.confirm-modal-header {
  display: flex;
  align-items: center;
  gap: 14px;
  margin-bottom: 16px;
}

.confirm-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 44px;
  height: 44px;
  border-radius: 12px;
  background: linear-gradient(135deg, #fbbf24, #f59e0b);
  box-shadow: 
    4px 4px 10px rgba(251, 191, 36, 0.3),
    -2px -2px 6px $white;
  
  svg {
    width: 22px;
    height: 22px;
    color: white;
  }
}

.confirm-title {
  font-size: 18px;
  font-weight: 600;
  color: $black;
  margin: 0;
  letter-spacing: 0.5px;
}

.confirm-message {
  font-size: 14px;
  color: $gray;
  margin: 0 0 24px 0;
  padding-left: 58px;
  line-height: 1.6;
}

.confirm-actions {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}

.confirm-btn {
  padding: 10px 24px;
  border-radius: 10px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  border: none;
  letter-spacing: 0.3px;
}

.cancel-btn {
  background: $neu-1;
  color: $gray;
  box-shadow: 
    3px 3px 6px $neu-2,
    -3px -3px 6px $white;
  
  &:hover {
    color: $black;
    box-shadow: 
      2px 2px 4px $neu-2,
      -2px -2px 4px $white;
  }
  
  &:active {
    box-shadow: 
      inset 2px 2px 4px $neu-2,
      inset -2px -2px 4px $white;
  }
}

.primary-btn {
  background: linear-gradient(135deg, #4b70e2, #6b8be8);
  color: white;
  box-shadow: 
    4px 4px 10px rgba(75, 112, 226, 0.3),
    -2px -2px 6px $white;
  
  &:hover {
    background: linear-gradient(135deg, #3d5fc7, #5a7ad7);
    box-shadow: 
      4px 4px 12px rgba(75, 112, 226, 0.4),
      -2px -2px 6px $white;
    transform: translateY(-1px);
  }
  
  &:active {
    transform: translateY(0);
    box-shadow: 
      inset 2px 2px 4px rgba(0, 0, 0, 0.1),
      inset -2px -2px 4px rgba(255, 255, 255, 0.1);
  }
}

// 对话框动画
.modal-enter-active {
  animation: modal-in 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.modal-leave-active {
  animation: modal-out 0.2s ease-out;
}

@keyframes modal-in {
  0% {
    opacity: 0;
    transform: scale(0.95);
  }
  100% {
    opacity: 1;
    transform: scale(1);
  }
}

@keyframes modal-out {
  0% {
    opacity: 1;
  }
  100% {
    opacity: 0;
  }
}
</style>
