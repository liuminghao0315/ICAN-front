import { defineStore } from 'pinia'
import { ref } from 'vue'
import { useUserStore } from './user'
import type { WSMessage, TaskProgressData, TaskCompletedData, TaskFailedData } from '@/types'

/**
 * WebSocket 全局状态管理
 * 使用单例模式管理 WebSocket 连接，确保整个应用只有一个连接
 */
export const useWebSocketStore = defineStore('websocket', () => {
  // WebSocket 实例
  let ws: WebSocket | null = null
  
  // 连接状态
  const isConnected = ref(false)
  const reconnectCount = ref(0)
  
  // 配置
  const maxReconnect = 5
  const reconnectInterval = 3000
  const heartbeatInterval = 30000
  
  // 定时器
  let heartbeatTimer: ReturnType<typeof setInterval> | null = null
  let reconnectTimer: ReturnType<typeof setTimeout> | null = null
  
  // 事件订阅者列表
  const taskProgressHandlers = ref<Array<(data: TaskProgressData) => void>>([])
  const taskCompletedHandlers = ref<Array<(data: TaskCompletedData) => void>>([])
  const taskFailedHandlers = ref<Array<(data: TaskFailedData) => void>>([])
  
  // 获取用户ID - 优先从 userStore 获取
  function getUserId(): string | null {
    const userStore = useUserStore()
    
    // 方式1: 从 userStore 获取
    if (userStore.userInfo?.id) {
      return userStore.userInfo.id
    }
    
    // 方式2: 从 userStore.token 解析
    const token = userStore.token
    if (!token) {
      return null
    }

    try {
      const parts = token.split('.')
      if (parts.length !== 3) {
        return null
      }
      const payload = JSON.parse(atob(parts[1]!))
      
      // JWT subject 格式为 "userId:xxx"，需要去掉前缀
      let userId = payload.sub || payload.id || null
      if (userId && typeof userId === 'string' && userId.startsWith('userId:')) {
        userId = userId.replace('userId:', '')
      }
      
      return userId
    } catch {
      return null
    }
  }
  
  // 连接 WebSocket
  function connect() {
    const userId = getUserId()
    if (!userId) {
      return
    }

    // 已连接则跳过
    if (ws && ws.readyState === WebSocket.OPEN) {
      return
    }
    
    // 正在连接中则跳过
    if (ws && ws.readyState === WebSocket.CONNECTING) {
      return
    }

    const wsUrl = `ws://localhost:8080/ws/task-progress/${userId}`

    try {
      ws = new WebSocket(wsUrl)

      ws.onopen = () => {
        console.log('[WebSocket] 连接成功, userId:', userId)
        isConnected.value = true
        reconnectCount.value = 0
        startHeartbeat()
      }

      ws.onmessage = (event) => {
        handleMessage(event.data)
      }

      ws.onclose = (event) => {
        isConnected.value = false
        stopHeartbeat()
        // 只有非正常关闭才尝试重连
        if (event.code !== 1000) {
          attemptReconnect()
        }
      }

      ws.onerror = () => {
        isConnected.value = false
      }
    } catch {
      attemptReconnect()
    }
  }
  
  // 处理消息
  function handleMessage(data: string) {
    if (data === 'pong') {
      return
    }

    try {
      const message: WSMessage = JSON.parse(data)

      switch (message.type) {
        case 'connected':
          break

        case 'task_progress':
          if (message.data) {
            const progressData = message.data as TaskProgressData
            taskProgressHandlers.value.forEach(handler => {
              try {
                handler(progressData)
              } catch {
                // 忽略处理器错误
              }
            })
          }
          break

        case 'task_completed':
          if (message.data) {
            console.log('[WebSocket] 收到任务完成通知:', message.data)
            const completedData = message.data as TaskCompletedData
            console.log('[WebSocket] 订阅者数量:', taskCompletedHandlers.value.length)
            taskCompletedHandlers.value.forEach(handler => {
              try {
                handler(completedData)
              } catch {
                // 忽略处理器错误
              }
            })
          }
          break

        case 'task_failed':
          if (message.data) {
            console.log('[WebSocket] 收到任务失败通知:', message.data)
            const failedData = message.data as TaskFailedData
            taskFailedHandlers.value.forEach(handler => {
              try {
                handler(failedData)
              } catch {
                // 忽略处理器错误
              }
            })
          }
          break

        default:
          break
      }
    } catch {
      // 忽略解析错误
    }
  }
  
  // 启动心跳
  function startHeartbeat() {
    stopHeartbeat()
    heartbeatTimer = setInterval(() => {
      if (ws && ws.readyState === WebSocket.OPEN) {
        ws.send('ping')
      }
    }, heartbeatInterval)
  }
  
  // 停止心跳
  function stopHeartbeat() {
    if (heartbeatTimer) {
      clearInterval(heartbeatTimer)
      heartbeatTimer = null
    }
  }
  
  // 尝试重连
  function attemptReconnect() {
    if (reconnectTimer) {
      clearTimeout(reconnectTimer)
      reconnectTimer = null
    }

    if (reconnectCount.value < maxReconnect) {
      reconnectCount.value++
      const delay = reconnectInterval * reconnectCount.value

      reconnectTimer = setTimeout(() => {
        connect()
      }, delay)
    }
  }
  
  // 断开连接
  function disconnect() {
    stopHeartbeat()

    if (reconnectTimer) {
      clearTimeout(reconnectTimer)
      reconnectTimer = null
    }

    if (ws) {
      ws.close(1000, '主动断开')
      ws = null
    }

    isConnected.value = false
    reconnectCount.value = 0
  }
  
  // 订阅任务进度
  function onTaskProgress(handler: (data: TaskProgressData) => void) {
    taskProgressHandlers.value.push(handler)
    return () => {
      const index = taskProgressHandlers.value.indexOf(handler)
      if (index > -1) {
        taskProgressHandlers.value.splice(index, 1)
      }
    }
  }
  
  // 订阅任务完成
  function onTaskCompleted(handler: (data: TaskCompletedData) => void) {
    taskCompletedHandlers.value.push(handler)
    return () => {
      const index = taskCompletedHandlers.value.indexOf(handler)
      if (index > -1) {
        taskCompletedHandlers.value.splice(index, 1)
      }
    }
  }
  
  // 订阅任务失败
  function onTaskFailed(handler: (data: TaskFailedData) => void) {
    taskFailedHandlers.value.push(handler)
    return () => {
      const index = taskFailedHandlers.value.indexOf(handler)
      if (index > -1) {
        taskFailedHandlers.value.splice(index, 1)
      }
    }
  }
  
  // 发送消息
  function send(data: string | object) {
    if (ws && ws.readyState === WebSocket.OPEN) {
      const message = typeof data === 'string' ? data : JSON.stringify(data)
      ws.send(message)
    }
  }
  
  return {
    isConnected,
    reconnectCount,
    connect,
    disconnect,
    send,
    onTaskProgress,
    onTaskCompleted,
    onTaskFailed
  }
})
