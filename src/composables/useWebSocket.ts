import { onUnmounted, watch } from 'vue'
import { useWebSocketStore } from '@/stores/websocket'
import { useUserStore } from '@/stores/user'
import type { TaskProgressData, TaskCompletedData, TaskFailedData } from '@/types'

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
    subscribeFailed
  }
}
