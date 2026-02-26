<template>
  <el-container class="main-layout">
    <!-- 侧边栏 -->
    <el-aside
      :width="isAnalysisDetail ? '64px' : (isCollapse ? '64px' : '240px')"
      class="sidebar"
      :class="{ 'is-collapsed': isCollapse || isAnalysisDetail, 'is-analysis-mode': isAnalysisDetail }"
    >
      <!-- 普通导航模式 -->
      <Transition name="sidebar-switch" mode="out-in">
        <div v-if="!isAnalysisDetail" key="normal-nav" class="sidebar-normal">
          <!-- Logo -->
          <div class="logo" @click="router.push('/')">
            <div class="logo-icon">
              <el-icon :size="24"><VideoCamera /></el-icon>
            </div>
            <span v-show="!isCollapse" class="logo-text">SynSight</span>
          </div>

          <!-- ① 主业务区 -->
          <nav class="nav-zone nav-primary">
            <el-tooltip v-for="item in primaryNavItems" :key="item.path"
              :content="item.label" placement="right" :disabled="!isCollapse" :show-after="300">
              <div
                class="nav-item"
                :class="{ 'is-active': activeTopNav === item.path }"
                @click="handleNavClick(item.path)"
              >
                <span class="nav-icon" v-html="item.icon"></span>
                <span class="nav-label" :class="{ 'label-hidden': isCollapse }">{{ item.label }}</span>
              </div>
            </el-tooltip>
          </nav>

          <!-- ② 数据上下文区（仅记录中心模块展开） -->
          <div class="context-zone-wrapper" :class="{ 'is-visible': isRecordsModule }">
            <div class="context-divider">
              <span class="divider-label" :class="{ 'label-hidden': isCollapse }">文件夹管理</span>
            </div>
            <div class="folder-content" :class="{ 'folder-content-hidden': isCollapse }">
              <div class="folder-quick-nav">
                <div
                  v-for="node in folderStore.tree.filter(n => n.id.startsWith('__'))"
                  :key="node.id"
                  class="quick-nav-item"
                  :class="{ active: folderStore.activeFolderId === node.id && isRecordsModule }"
                  @click="handleFolderSelect(node.id)"
                >
                  <svg class="qn-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
                    <path v-if="node.id === '__ALL__'" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z"/>
                    <path v-else d="M22 19a2 2 0 01-2 2H4a2 2 0 01-2-2V5a2 2 0 012-2h5l2 3h9a2 2 0 012 2z"/>
                  </svg>
                  <span class="qn-name">{{ node.name }}</span>
                  <span class="qn-badge" v-if="node.videoCount > 0">{{ node.videoCount }}</span>
                </div>
              </div>
              <FolderTree />
            </div>
          </div>

          <!-- ③ 系统基石区（绝对沉底） -->
          <div class="system-zone">
            <el-tooltip v-for="item in systemNavItems" :key="item.key"
              :content="item.label" placement="right" :disabled="!isCollapse" :show-after="300">
              <div class="system-item" @click="item.action && item.action()">
                <span class="nav-icon" v-html="item.icon"></span>
                <span class="nav-label" :class="{ 'label-hidden': isCollapse }">{{ item.label }}</span>
              </div>
            </el-tooltip>
            <!-- 折叠按钮 -->
            <div class="collapse-btn" @click="isCollapse = !isCollapse">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path v-if="!isCollapse" d="M15 18l-6-6 6-6"/>
                <path v-else d="M9 18l6-6-6-6"/>
              </svg>
            </div>
          </div>
        </div>

        <!-- 分析详情工具栏模式 -->
        <aside v-else key="analysis-toolbar" class="mini-sidebar">
          <!-- 顶部：返回记录中心 -->
          <div class="mini-sidebar-top">
            <el-tooltip content="返回记录中心" placement="right" :show-after="300">
              <button class="analysis-tool-btn back-btn" @click="router.push('/records')">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M19 12H5"/>
                  <path d="M12 19l-7-7 7-7"/>
                </svg>
              </button>
            </el-tooltip>
          </div>

          <!-- 底部：操作工具组 -->
          <div class="mini-sidebar-bottom">
            <el-tooltip content="导出报告" placement="right" :show-after="300">
              <button 
                class="analysis-tool-btn" 
                :class="{ 'is-disabled': !analysisActionsStore.hasAnalysisData }"
                :disabled="!analysisActionsStore.hasAnalysisData"
                @click="analysisActionsStore.hasAnalysisData && analysisActionsStore.triggerExport()"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/>
                  <polyline points="7,10 12,15 17,10"/>
                  <line x1="12" y1="15" x2="12" y2="3"/>
                </svg>
              </button>
            </el-tooltip>

            <el-tooltip content="分享" placement="right" :show-after="300">
              <button 
                class="analysis-tool-btn"
                :class="{ 'is-disabled': !analysisActionsStore.hasAnalysisData }"
                :disabled="!analysisActionsStore.hasAnalysisData"
                @click="analysisActionsStore.hasAnalysisData && $emit('share')"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
                  <circle cx="18" cy="5" r="3"/>
                  <circle cx="6" cy="12" r="3"/>
                  <circle cx="18" cy="19" r="3"/>
                  <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/>
                  <line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/>
                </svg>
              </button>
            </el-tooltip>

            <el-tooltip :content="isAnalysisFavorited ? '取消收藏' : '收藏'" placement="right" :show-after="300">
              <button
                class="analysis-tool-btn"
                :class="{ 'is-favorited': isAnalysisFavorited, 'is-disabled': !analysisActionsStore.hasAnalysisData }"
                :disabled="!analysisActionsStore.hasAnalysisData"
                @click="analysisActionsStore.hasAnalysisData && handleAnalysisFavorite()"
              >
                <svg viewBox="0 0 24 24" :fill="isAnalysisFavorited ? 'currentColor' : 'none'" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
                  <polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26"/>
                </svg>
              </button>
            </el-tooltip>
          </div>
        </aside>
      </Transition>
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
            <button class="broadcast-link" @click="router.push('/records')">
              查看任务
              <el-icon>
                <ArrowRight />
              </el-icon>
            </button>
          </div>
        </div>
      </Transition>

      <!-- 上传中指示器 -->
      <Transition name="broadcast">
        <div class="upload-broadcast" v-if="uploadStore.activeCount > 0">
          <div class="broadcast-content">
            <div class="broadcast-icon">
              <el-icon><Upload class="rotating" /></el-icon>
            </div>
            <div class="broadcast-text">
              <span class="broadcast-title">正在上传</span>
              <span class="broadcast-desc">{{ uploadStore.activeCount }} 个文件上传中（{{ uploadStore.overallProgress }}%）</span>
            </div>
            <div class="upload-mini-bar">
              <div class="upload-mini-fill" :style="{ width: uploadStore.overallProgress + '%' }"></div>
            </div>
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
  import { useUploadStore } from '@/stores/upload'
  import { useFolderStore } from '@/stores/folder'
  import { useFavoritesStore } from '@/stores/favorites'
  import { useAnalysisActionsStore } from '@/stores/analysisActions'
  import { getTaskList, getMe } from '@/api'
  import { useWebSocket } from '@/composables/useWebSocket'
  import FolderTree from '@/components/FolderTree.vue'
  import { ElMessage } from 'element-plus'

  const router = useRouter()
  const route = useRoute()
  const userStore = useUserStore()
  const wsStore = useWebSocketStore()
  const uploadStore = useUploadStore()
  const folderStore = useFolderStore()
  const favStore = useFavoritesStore()
  const analysisActionsStore = useAnalysisActionsStore()

  // ===== 三段式导航配置 =====
  const primaryNavItems = [
    {
      path: '/dashboard',
      label: '工作台',
      icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg>`
    },
    {
      path: '/records',
      label: '记录中心',
      icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14,2 14,8 20,8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10,9 9,9 8,9"/></svg>`
    },
    {
      path: '/favorites',
      label: '我的收藏',
      icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26"/></svg>`
    },
    {
      path: '/risk-dictionary',
      label: '风险词库管理',
      icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>`
    }
  ]

  const systemNavItems = [
    {
      key: 'settings',
      label: '设置',
      icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z"/></svg>`,
      action: () => router.push('/settings')
    },
    {
      key: 'help',
      label: '帮助与文档',
      icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 015.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>`,
      action: () => ElMessage.info('帮助文档功能即将上线')
    }
  ]

  // ===== 排他性激活逻辑（单一数据源） =====
  // 顶级激活态：只看路由 path 的第一段
  const activeTopNav = computed(() => {
    const path = route.path
    if (path.startsWith('/records') || path.startsWith('/analysis')) return '/records'
    if (path.startsWith('/favorites')) return '/favorites'
    if (path.startsWith('/risk-dictionary')) return '/risk-dictionary'
    return '/dashboard'
  })

  // 是否处于记录中心模块（控制数据上下文区显隐）
  const isRecordsModule = computed(() =>
    activeTopNav.value === '/records'
  )

  // 顶级导航点击：清除文件夹激活态（非记录中心时）
  const handleNavClick = (path: string) => {
    if (path !== '/records') {
      // 离开记录中心时，清除文件夹选中态，避免残留高亮
      folderStore.setActive('')
    }
    router.push(path)
  }

  // 侧边栏文件夹快捷导航
  const handleFolderSelect = (folderId: string) => {
    folderStore.setActive(folderId)
    router.push('/records')
  }

  // 检测是否处于分析详情页（Analysis 路由）
  const isAnalysisDetail = computed(() => route.name === 'Analysis')

  // 分析页收藏按钮：从 store 获取当前分析数据的 taskId
  const analysisTaskId = computed(() => analysisActionsStore.currentTaskId)
  const isAnalysisFavorited = computed(() =>
    analysisTaskId.value ? favStore.isFavorited(analysisTaskId.value) : false
  )
  const handleAnalysisFavorite = async () => {
    if (!analysisTaskId.value) {
      ElMessage.warning('无法获取任务信息，请从记录中心进入分析页')
      return
    }
    const wasFavorited = isAnalysisFavorited.value
    await favStore.toggle(analysisTaskId.value)
    ElMessage.success(wasFavorited ? '已取消收藏' : '收藏成功')
  }

  const isCollapse = ref(false)
  const isDropdownOpen = ref(false)
  const showLogoutConfirm = ref(false)
  const userDropdownRef = ref<HTMLElement | null>(null)

  // 直接使用 store 中的计数，支持乐观更新
  const analyzingTaskCount = computed(() => wsStore.analyzingCount)
  const hasAnalyzingTasks = computed(() => wsStore.analyzingCount > 0)
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
      wsStore.setAnalyzingCount(0)
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
      wsStore.setAnalyzingCount(processingCount + pendingCount)
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

  // 监听取消/删除等主动操作，立即刷新横幅计数
  wsStore.onTaskChanged(() => {
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
        wsStore.setAnalyzingCount(0)
      }
    },
    { immediate: true }
  )

  // 任务检查定时器
  let taskCheckInterval: ReturnType<typeof setInterval> | null = null

  // 同时在 onMounted 中也尝试连接（双重保险）
  onMounted(() => {
    // 若 email 为空则补拉用户信息（兼容旧登录态）
    if (userStore.isLoggedIn && !userStore.userInfo?.email) {
      getMe().then(res => {
        if (res.code === 200 && res.data) {
          userStore.setUserInfo({ id: res.data.id, username: res.data.username, email: res.data.email })
        }
      }).catch(() => {})
    }
    if (userStore.isLoggedIn && !wsStore.isConnected) {
      wsStore.connect()
    }
    // 检查分析中的任务
    checkAnalyzingTasks()
    // 加载文件夹树
    if (userStore.isLoggedIn) {
      folderStore.loadTree()
    }
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

  // 从分析页退出时，若仍是收起状态，无需额外处理
  watch(isAnalysisDetail, (_val) => {
    // 保留 watch 以备后续扩展
  })

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
  overflow: hidden;

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

  // ===== 三段式导航样式 =====

  // 通用导航图标
  .nav-icon {
    width: 20px;
    height: 20px;
    flex-shrink: 0;
    display: flex;
    align-items: center;
    justify-content: center;

    :deep(svg) {
      width: 18px;
      height: 18px;
      transition: stroke 0.25s;
    }
  }

  .nav-label {
    font-size: 13.5px;
    font-weight: 500;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    opacity: 1;
    // 展开时延迟 0.2s 淡入（等宽度动画接近完成），收起时立即消失
    transition: opacity 0.15s ease 0.2s;

    &.label-hidden {
      opacity: 0;
      pointer-events: none;
      width: 0;
      overflow: hidden;
      transition: opacity 0.1s ease; // 收起时无延迟，立即消失
    }
  }

  // ① 主业务区
  .nav-primary {
    padding: 8px 10px;
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .nav-item {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 0 14px;
    height: 48px;
    border-radius: 12px;
    cursor: pointer;
    color: $gray;
    background-color: $neu-1;
    box-shadow: 3px 3px 6px $neu-2, -3px -3px 6px $white;
    transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
    user-select: none;

    &:hover {
      color: $purple;
      box-shadow: 2px 2px 4px $neu-2, -2px -2px 4px $white;
      transform: translateX(1px);
    }

    &.is-active {
      background: linear-gradient(135deg, $purple 0%, #7c9df7 100%);
      color: #fff;
      box-shadow: 4px 4px 10px rgba($purple, 0.35), -2px -2px 6px $white;
      transform: none;

      .nav-icon :deep(svg) { stroke: #fff; }
    }
  }

  // 收起状态下主业务区居中
  &.is-collapsed .nav-item {
    justify-content: center;
    padding: 0;
    gap: 0;
  }

  // ② 数据上下文区（平滑折叠）
  .context-zone-wrapper {
    overflow: hidden;
    max-height: 0;
    opacity: 0;
    transition: max-height 0.35s cubic-bezier(0.4, 0, 0.2, 1),
                opacity 0.25s ease;

    &.is-visible {
      max-height: 600px;
      opacity: 1;
    }
  }

  // 文件夹列表内容：收起时隐藏，展开时延迟显示（等宽度动画完成）
  .folder-content {
    overflow: hidden;
    max-height: 600px;
    opacity: 1;
    transition: max-height 0.15s ease 0.2s, opacity 0.15s ease 0.2s;

    &.folder-content-hidden {
      max-height: 0;
      opacity: 0;
      transition: max-height 0.1s ease, opacity 0.1s ease;
    }
  }

  .context-divider {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 10px 16px 6px;

    &::before {
      content: '';
      flex: 1;
      height: 1px;
      background: linear-gradient(90deg, transparent, rgba($neu-2, 0.8), transparent);
    }

    .divider-label {
      font-size: 11px;
      font-weight: 600;
      color: $gray;
      letter-spacing: 0.5px;
      white-space: nowrap;
      opacity: 0.7;
      transition: opacity 0.15s ease 0.2s;

      &.label-hidden {
        opacity: 0;
        pointer-events: none;
        transition: opacity 0.1s ease;
      }
    }

    &::after {
      content: '';
      flex: 1;
      height: 1px;
      background: linear-gradient(90deg, rgba($neu-2, 0.8), transparent);
    }
  }

  // 全部记录 / 未分类 快捷入口
  .folder-quick-nav {
    padding: 4px 10px;
    overflow-y: auto;
    max-height: 200px;

    &::-webkit-scrollbar { width: 3px; }
    &::-webkit-scrollbar-track { background: transparent; }
    &::-webkit-scrollbar-thumb { background: rgba($neu-2, 0.5); border-radius: 2px; }

    .quick-nav-item {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 7px 10px;
      border-radius: 10px;
      cursor: pointer;
      margin-bottom: 2px;
      transition: all 0.2s;

      .qn-icon {
        width: 16px;
        height: 16px;
        flex-shrink: 0;
        color: $gray;
        transition: color 0.2s;
      }

      .qn-name {
        flex: 1;
        font-size: 13px;
        color: rgba($black, 0.75);
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }

      .qn-badge {
        font-size: 11px;
        min-width: 18px;
        height: 16px;
        line-height: 16px;
        text-align: center;
        border-radius: 8px;
        background: $neu-2;
        color: $gray;
        padding: 0 5px;
        flex-shrink: 0;
      }

      &:hover {
        background: rgba($purple, 0.07);
        .qn-icon { color: $purple; }
        .qn-name { color: $purple; }
      }

      &.active {
        background: linear-gradient(135deg, rgba($purple, 0.12) 0%, rgba(#7c9df7, 0.12) 100%);
        .qn-icon { color: $purple; }
        .qn-name { color: $purple; font-weight: 600; }
        .qn-badge { background: rgba($purple, 0.15); color: $purple; }
      }
    }
  }

  // ③ 系统基石区（绝对沉底）
  .system-zone {
    margin-top: auto;
    padding: 8px 10px 10px;
    border-top: 1px solid rgba($neu-2, 0.4);
    display: flex;
    flex-direction: column;
    gap: 2px;
  }

  .system-item {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 8px 12px;
    border-radius: 10px;
    cursor: pointer;
    color: rgba($gray, 0.7);
    transition: all 0.2s;
    user-select: none;

    .nav-icon :deep(svg) { stroke: rgba($gray, 0.7); }

    .nav-label {
      font-size: 12.5px;
      font-weight: 400;
      color: rgba($gray, 0.7);
    }

    &:hover {
      background: rgba($neu-2, 0.4);
      color: $gray;
      .nav-icon :deep(svg) { stroke: $gray; }
      .nav-label { color: $gray; }
    }
  }

  &.is-collapsed .system-item {
    justify-content: center;
    padding: 8px;
    gap: 0;
  }

  .collapse-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    height: 36px;
    margin: 4px 2px 0;
    border-radius: 10px;
    cursor: pointer;
    color: rgba($gray, 0.5);
    transition: all 0.2s;
    user-select: none;

    svg {
      width: 16px;
      height: 16px;
    }

    &:hover {
      background: rgba($neu-2, 0.4);
      color: $purple;
    }
  }

  // ===== 分析详情工具栏 =====
  &.is-analysis-mode {
    background: transparent;
    backdrop-filter: none;
    -webkit-backdrop-filter: none;
    border-right: none;
    box-shadow: none;
  }

  .sidebar-normal,
  .sidebar-analysis {
    display: flex;
    flex-direction: column;
    height: 100%;
    width: 100%;
  }

  // mini-sidebar：工业级极简风
  .mini-sidebar {
    width: 64px;
    height: 100vh;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    align-items: center;
    padding: 20px 0;
    background: rgba(245, 247, 250, 0.4);
    backdrop-filter: blur(10px);
    -webkit-backdrop-filter: blur(10px);
    border-right: 1px solid rgba(0, 0, 0, 0.04);
    box-sizing: border-box;
  }

  .mini-sidebar-top {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 8px;
  }

  .mini-sidebar-bottom {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 16px;
  }

  .analysis-tool-btn {
    width: 40px;
    height: 40px;
    border-radius: 10px;
    border: none;
    background: transparent;
    box-shadow: none;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    transition: all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1);
    color: #5a6a85;

    svg {
      width: 18px;
      height: 18px;
      stroke-width: 2.2;
      transition: color 0.3s cubic-bezier(0.25, 0.8, 0.25, 1);
    }

    &:hover {
      background: rgba(64, 158, 255, 0.1);
      color: $purple;
    }

    &:active {
      background: rgba(64, 158, 255, 0.16);
      transform: scale(0.94);
    }

    &.is-favorited {
      color: #fbbf24;
      svg { filter: drop-shadow(0 0 3px rgba(251,191,36,.5)); }
      &:hover { background: rgba(251,191,36,.12); color: #f59e0b; }
    }

    &.is-disabled,
    &:disabled {
      opacity: 0.35;
      cursor: not-allowed;
      pointer-events: none;
    }
  }

  // 返回按钮：与其他按钮完全统一，hover 时图标向左微移
  .back-btn {
    &:hover svg {
      transform: translateX(-2px);
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

// 上传中指示器（绿色调）
.upload-broadcast {
  width: 100%;
  background: linear-gradient(135deg, #36a85a, #52c97a);
  color: white;
  padding: 10px 24px;
  box-shadow: 0 2px 8px rgba(54, 168, 90, 0.3);
  z-index: 100;

  .broadcast-content {
    display: flex;
    align-items: center;
    gap: 16px;
    max-width: 1400px;
    margin: 0 auto;
  }

  .upload-mini-bar {
    flex: 1;
    max-width: 200px;
    height: 4px;
    background: rgba(255, 255, 255, 0.3);
    border-radius: 2px;
    overflow: hidden;
    margin-left: auto;

    .upload-mini-fill {
      height: 100%;
      background: white;
      border-radius: 2px;
      transition: width 0.5s ease;
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
  position: relative;
  z-index: 1000;
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
  padding: 24px;
  padding-right: 24px;
  margin-right: 0;
  overflow-y: auto;
  overflow-x: hidden;
  width: 100%;
  min-width: 0; // 防止 flex 子元素溢出
  // 使用与 header 完全一致的纯色背景
  background-color: #ebf0f2;
  // 让子路由视图能撑满高度（词库管理等固定高度页面需要）
  display: flex;
  flex-direction: column;

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

// 分析页面交互视图专用样式 - 移除底部内边距
.main-content.interactive-mode-no-padding {
  padding-bottom: 0;
}

// 侧边栏内容切换过渡动画
.sidebar-switch-enter-active {
  transition: opacity 0.25s ease, transform 0.25s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.sidebar-switch-leave-active {
  transition: opacity 0.18s ease, transform 0.18s ease;
}

.sidebar-switch-enter-from {
  opacity: 0;
  transform: scale(0.92) translateX(-6px);
}

.sidebar-switch-enter-to {
  opacity: 1;
  transform: scale(1) translateX(0);
}

.sidebar-switch-leave-from {
  opacity: 1;
  transform: scale(1) translateX(0);
}

.sidebar-switch-leave-to {
  opacity: 0;
  transform: scale(0.92) translateX(-6px);
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
