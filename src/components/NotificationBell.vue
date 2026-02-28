<template>
  <div class="notification-bell" ref="bellRef">
    <button class="bell-btn" @click="togglePanel" :class="{ 'has-unread': displayUnreadCount > 0 }">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9"/>
        <path d="M13.73 21a2 2 0 01-3.46 0"/>
      </svg>
      <span class="badge" v-if="displayUnreadCount > 0">{{ displayUnreadCount > 99 ? '99+' : displayUnreadCount }}</span>
    </button>

    <Teleport to="body">
      <Transition name="notification-panel">
        <div class="notification-panel" v-if="showPanel" :style="panelStyle">
          <div class="panel-header">
            <span class="panel-title">通知</span>
            <button
              v-if="displayUnreadCount > 0"
              class="mark-all-btn"
              @click="handleMarkAllRead"
            >全部已读</button>
          </div>
          <div class="panel-body" @scroll="handleScroll">
            <div v-if="loading && notifications.length === 0" class="panel-loading">
              加载中...
            </div>
            <div v-else-if="notifications.length === 0" class="panel-empty">
              暂无通知
            </div>
            <template v-else>
              <div
                v-for="item in notifications"
                :key="item.id"
                class="notification-item"
                :class="{ unread: !item.isRead }"
                @click="handleClickNotification(item)"
              >
                <div class="item-dot" v-if="!item.isRead"></div>
                <div class="item-content">
                  <div class="item-title" :title="item.title || ''">{{ item.title || '系统通知' }}</div>
                  <div class="item-desc" v-if="item.content" :title="item.content">{{ item.content }}</div>
                  <div class="item-time">{{ formatTime(item.gmtCreated) }}</div>
                </div>
              </div>
            </template>
          </div>
        </div>
      </Transition>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { ElMessage } from 'element-plus'
import { useUserStore } from '@/stores'
import { useWebSocket } from '@/composables/useWebSocket'
import {
  getNotificationList,
  getUnreadNotificationCount,
  markNotificationRead,
  markAllNotificationsRead,
  markNotificationsReadByContext,
  getVideoById,
  type NotificationVO
} from '@/api'

const router = useRouter()
const route = useRoute()
const userStore = useUserStore()
const { subscribeFeedbackNew, subscribeFeedbackUpdated, subscribeVideoDeleted } = useWebSocket({ autoConnect: false })
const bellRef = ref<HTMLElement | null>(null)
const showPanel = ref(false)
const loading = ref(false)
const notifications = ref<NotificationVO[]>([])
const unreadCount = ref(0)
let pollTimer: ReturnType<typeof setInterval> | null = null

const panelStyle = computed(() => {
  if (!bellRef.value) return {}
  const rect = bellRef.value.getBoundingClientRect()
  return {
    position: 'fixed' as const,
    top: `${rect.bottom + 8}px`,
    right: `${window.innerWidth - rect.right}px`,
    zIndex: 2000
  }
})

const isFeedbackPage = computed(() => route.path === '/admin/feedback')
const displayUnreadCount = computed(() => (isFeedbackPage.value ? 0 : unreadCount.value))

const togglePanel = async () => {
  showPanel.value = !showPanel.value
  if (showPanel.value) {
    await fetchNotifications()
  }
}

const fetchUnreadCount = async () => {
  if (!userStore.isLoggedIn) return
  try {
    await markCurrentContextAsRead()
    const res = await getUnreadNotificationCount()
    if (res.code === 200) {
      unreadCount.value = res.data ?? 0
    }
  } catch { /* silent */ }
}

const shouldAutoRead = (item: NotificationVO) => {
  if (item.targetPath === '/admin/feedback' && route.path === '/admin/feedback') return true
  if (item.targetPath === '/analysis' && route.path === '/analysis') {
    const currentVideoId = route.query.videoId as string | undefined
    const currentFeedbackId = route.query.feedbackId as string | undefined
    if (item.videoId && currentVideoId && item.videoId === currentVideoId) return true
    if (item.feedbackId && currentFeedbackId && item.feedbackId === currentFeedbackId) return true
  }
  return false
}

const markCurrentContextAsRead = async () => {
  try {
    if (route.path === '/admin/feedback') {
      await markNotificationsReadByContext({ targetPath: '/admin/feedback', relatedType: 'FEEDBACK' })
      return
    }
    if (route.path === '/analysis') {
      const videoId = route.query.videoId as string | undefined
      const feedbackId = route.query.feedbackId as string | undefined
      if (videoId || feedbackId) {
        await markNotificationsReadByContext({
          targetPath: '/analysis',
          relatedType: 'FEEDBACK',
          videoId,
          feedbackId
        })
      }
    }
  } catch { /* silent */ }
}

const fetchNotifications = async () => {
  loading.value = true
  try {
    const res = await getNotificationList(1, 30)
    if (res.code === 200 && res.data) {
      notifications.value = res.data.records.filter((item: NotificationVO) => !shouldAutoRead(item))
    }
  } catch { /* silent */ }
  loading.value = false
}

const handleClickNotification = async (item: NotificationVO) => {
  if (!item.isRead) {
    try {
      await markNotificationRead(item.id)
      item.isRead = true
      unreadCount.value = Math.max(0, unreadCount.value - 1)
    } catch { /* silent */ }
  }
  showPanel.value = false

  if (item.targetPath === '/analysis') {
    if (item.videoId) {
      try {
        const res = await getVideoById(item.videoId, true)
        if (res.code !== 200 || !res.data) {
          ElMessage.warning('该反馈对应的视频已被删除')
          return
        }
      } catch {
        ElMessage.warning('该反馈对应的视频已被删除')
        return
      }
    }

    router.push({
      path: '/analysis',
      query: {
        ...(item.videoId ? { videoId: item.videoId } : {})
      }
    })
    return
  }
  if (item.targetPath === '/admin/feedback') {
    router.push({
      path: '/admin/feedback',
      query: {
        ...(item.feedbackId ? { feedbackId: item.feedbackId } : {})
      }
    })
    return
  }

  if (item.type === 'FEEDBACK_NEW' && item.relatedId) {
    router.push('/admin/feedback')
  }
}

const handleMarkAllRead = async () => {
  try {
    await markAllNotificationsRead()
    notifications.value.forEach(n => n.isRead = true)
    unreadCount.value = 0
  } catch { /* silent */ }
}

const handleScroll = () => { /* 预留分页加载 */ }

const refreshNotificationState = async () => {
  await fetchUnreadCount()
  if (showPanel.value) {
    await fetchNotifications()
  }
}

// WebSocket 实时通知：收到相关业务事件时立即刷新铃铛未读数
subscribeFeedbackNew(() => { void refreshNotificationState() })
subscribeFeedbackUpdated(() => { void refreshNotificationState() })
subscribeVideoDeleted(() => { void refreshNotificationState() })

const formatTime = (dateStr: string) => {
  const date = new Date(dateStr)
  const now = new Date()
  const diff = now.getTime() - date.getTime()
  const minutes = Math.floor(diff / 60000)
  if (minutes < 1) return '刚刚'
  if (minutes < 60) return `${minutes}分钟前`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}小时前`
  const days = Math.floor(hours / 24)
  if (days < 7) return `${days}天前`
  return date.toLocaleDateString()
}

const handleClickOutside = (e: MouseEvent) => {
  if (!showPanel.value) return
  const target = e.target as HTMLElement
  if (bellRef.value?.contains(target)) return
  const panel = document.querySelector('.notification-panel')
  if (panel?.contains(target)) return
  showPanel.value = false
}

watch(
  () => route.fullPath,
  async () => {
    await fetchUnreadCount()
    if (showPanel.value) await fetchNotifications()
  }
)

onMounted(() => {
  fetchUnreadCount()
  pollTimer = setInterval(fetchUnreadCount, 30000)
  document.addEventListener('click', handleClickOutside)
})

onUnmounted(() => {
  if (pollTimer) clearInterval(pollTimer)
  document.removeEventListener('click', handleClickOutside)
})
</script>

<style scoped lang="scss">
$bg: #edf2f0;
$neu-1: #ecf0f3;
$neu-2: #d1d9e6;
$white: #f9f9f9;
$gray: #a0a5a8;
$black: #181818;
$purple: #4b70e2;

.notification-bell {
  position: relative;
  display: flex;
  align-items: center;
}

.bell-btn {
  position: relative;
  background: none;
  border: none;
  cursor: pointer;
  padding: 8px;
  border-radius: 10px;
  color: $gray;
  transition: all 0.3s;
  display: flex;
  align-items: center;
  justify-content: center;

  svg {
    width: 20px;
    height: 20px;
  }

  &:hover {
    color: $purple;
    background: rgba($purple, 0.08);
  }

  &.has-unread svg {
    animation: bell-shake 0.5s ease-in-out;
  }

  .badge {
    position: absolute;
    top: 2px;
    right: 2px;
    min-width: 16px;
    height: 16px;
    padding: 0 4px;
    border-radius: 8px;
    background: #f56c6c;
    color: #fff;
    font-size: 10px;
    font-weight: 600;
    line-height: 16px;
    text-align: center;
  }
}

@keyframes bell-shake {
  0%, 100% { transform: rotate(0); }
  25% { transform: rotate(8deg); }
  50% { transform: rotate(-8deg); }
  75% { transform: rotate(4deg); }
}
</style>

<style lang="scss">
.notification-panel {
  width: 360px;
  max-height: 480px;
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.4);
  border-radius: 16px;
  box-shadow: 0 12px 40px rgba(31, 38, 135, 0.12);
  overflow: hidden;
  display: flex;
  flex-direction: column;

  .panel-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 16px 20px 12px;
    border-bottom: 1px solid rgba(0, 0, 0, 0.06);

    .panel-title {
      font-size: 16px;
      font-weight: 600;
      color: #181818;
    }

    .mark-all-btn {
      background: none;
      border: none;
      color: #4b70e2;
      font-size: 13px;
      cursor: pointer;
      padding: 4px 8px;
      border-radius: 6px;
      transition: background 0.2s;

      &:hover {
        background: rgba(75, 112, 226, 0.08);
      }
    }
  }

  .panel-body {
    flex: 1;
    overflow-y: auto;
    padding: 8px 0;

    &::-webkit-scrollbar {
      width: 4px;
    }
    &::-webkit-scrollbar-thumb {
      background: rgba(0, 0, 0, 0.1);
      border-radius: 2px;
    }
  }

  .panel-loading,
  .panel-empty {
    padding: 40px 20px;
    text-align: center;
    color: #a0a5a8;
    font-size: 14px;
  }

  .notification-item {
    display: flex;
    align-items: flex-start;
    gap: 10px;
    padding: 12px 20px;
    cursor: pointer;
    transition: background 0.2s;

    &:hover {
      background: rgba(75, 112, 226, 0.04);
    }

    &.unread {
      background: rgba(75, 112, 226, 0.03);
    }

    .item-dot {
      width: 8px;
      height: 8px;
      min-width: 8px;
      border-radius: 50%;
      background: #4b70e2;
      margin-top: 6px;
    }

    .item-content {
      flex: 1;
      min-width: 0;

      .item-title {
        font-size: 14px;
        font-weight: 500;
        color: #181818;
        margin-bottom: 4px;
        line-height: 1.4;
      }

      .item-desc {
        font-size: 13px;
        color: #666;
        margin-bottom: 4px;
        line-height: 1.4;
        overflow: hidden;
        text-overflow: ellipsis;
        display: -webkit-box;
        -webkit-line-clamp: 2;
        -webkit-box-orient: vertical;
      }

      .item-time {
        font-size: 12px;
        color: #a0a5a8;
      }
    }
  }
}

.notification-panel-enter-active,
.notification-panel-leave-active {
  transition: all 0.25s cubic-bezier(0.25, 0.8, 0.25, 1);
}
.notification-panel-enter-from,
.notification-panel-leave-to {
  opacity: 0;
  transform: translateY(-8px);
}
</style>
