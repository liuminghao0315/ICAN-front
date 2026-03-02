import { onUnmounted, watch } from 'vue'
import { useWebSocketStore } from '@/stores/websocket'
import { useUserStore } from '@/stores/user'
import type { TaskProgressData, TaskCompletedData, TaskFailedData, VideoDeletedData, FeedbackNewData, FeedbackUpdatedData, FeedbackLockedData, FeedbackSyncData } from '@/types'

export interface UseWebSocketOptions {
  autoConnect?: boolean
}

/**
 * WebSocket composable
 * 使用全局 WebSocket store，提供订阅/取消订阅功能
 */
export function useWebSocket(options: UseWebSocketOptions = {}) {
  const { autoConnect = true } = options
  
  const wsStore = useWebSocketStore()
  const userStore = useUserStore()
  
  // 存储取消订阅函数
  const unsubscribers: Array<() => void> = []
  
  // 订阅任务进度
  function subscribeProgress(handler: (data: TaskProgressData) => void) {
    const unsubscribe = wsStore.onTaskProgress(handler)
    unsubscribers.push(unsubscribe)
    return unsubscribe
  }
  
  // 订阅任务完成
  function subscribeCompleted(handler: (data: TaskCompletedData) => void) {
    const unsubscribe = wsStore.onTaskCompleted(handler)
    unsubscribers.push(unsubscribe)
    return unsubscribe
  }
  
  // 订阅任务失败
  function subscribeFailed(handler: (data: TaskFailedData) => void) {
    const unsubscribe = wsStore.onTaskFailed(handler)
    unsubscribers.push(unsubscribe)
    return unsubscribe
  }

  // 订阅视频删除通知
  function subscribeVideoDeleted(handler: (data: VideoDeletedData) => void) {
    const unsubscribe = wsStore.onVideoDeleted(handler)
    unsubscribers.push(unsubscribe)
    return unsubscribe
  }

  // 订阅反馈新消息（管理员用）
  function subscribeFeedbackNew(handler: (data: FeedbackNewData) => void) {
    const unsubscribe = wsStore.onFeedbackNew(handler)
    unsubscribers.push(unsubscribe)
    return unsubscribe
  }

  // 订阅反馈更新（用户用）
  function subscribeFeedbackUpdated(handler: (data: FeedbackUpdatedData) => void) {
    const unsubscribe = wsStore.onFeedbackUpdated(handler)
    unsubscribers.push(unsubscribe)
    return unsubscribe
  }

  // 订阅反馈被锁定（其他管理员用）
  function subscribeFeedbackLocked(handler: (data: FeedbackLockedData) => void) {
    const unsubscribe = wsStore.onFeedbackLocked(handler)
    unsubscribers.push(unsubscribe)
    return unsubscribe
  }
  
  // 订阅反馈会话更新（其他管理员刷新用，不增加未读）
  function subscribeFeedbackSync(handler: (data: FeedbackSyncData) => void) {
    const unsubscribe = wsStore.onFeedbackSync(handler)
    unsubscribers.push(unsubscribe)
    return unsubscribe
  }

  // 订阅任务/视频数据变更通知（删除、新建分析任务等本地操作后触发，用于跨页面同步统计数据）
  function subscribeTaskChanged(handler: () => void) {
    const unsubscribe = wsStore.onTaskChanged(handler)
    unsubscribers.push(unsubscribe)
    return unsubscribe
  }

  // 主动通知数据已变更（在删除或创建分析任务成功后调用）
  function notifyTaskChanged() {
    wsStore.notifyTaskChanged()
  }

  // 监听登录状态变化，自动连接 WebSocket
  watch(
    () => userStore.isLoggedIn,
    (isLoggedIn) => {
      if (isLoggedIn && autoConnect) {
        wsStore.connect()
      } else if (!isLoggedIn) {
        wsStore.disconnect()
      }
    },
    { immediate: true }
  )
  
  onUnmounted(() => {
    // 组件卸载时取消所有订阅，但不断开 WebSocket 连接
    unsubscribers.forEach(unsubscribe => unsubscribe())
    unsubscribers.length = 0
  })
  
  return {
    isConnected: wsStore.isConnected,
    reconnectCount: wsStore.reconnectCount,
    connect: wsStore.connect,
    disconnect: wsStore.disconnect,
    send: wsStore.send,
    subscribeProgress,
    subscribeCompleted,
    subscribeFailed,
    subscribeVideoDeleted,
    subscribeFeedbackNew,
    subscribeFeedbackUpdated,
    subscribeFeedbackLocked,
    subscribeFeedbackSync,
    subscribeTaskChanged,
    notifyTaskChanged
  }
}
