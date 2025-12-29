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
    // 方式1: 从 userStore 获取（最可靠）
    const userStore = useUserStore()
    if (userStore.userInfo?.id) {
      console.log('[WebSocket] 从 userStore 获取 userId:', userStore.userInfo.id)
      return userStore.userInfo.id
    }
    
    // 方式2: 从 userStore.token 解析
    const token = userStore.token
    if (!token) {
      console.warn('[WebSocket] token 不存在')
      return null
    }

    try {
      const parts = token.split('.')
      if (parts.length !== 3) {
        console.warn('[WebSocket] token 格式无效')
        return null
      }
      const payload = JSON.parse(atob(parts[1]!))
      
      // JWT subject 格式为 "userId:xxx"，需要去掉前缀
      let userId = payload.sub || payload.id || null
      if (userId && typeof userId === 'string' && userId.startsWith('userId:')) {
        userId = userId.replace('userId:', '')
      }
      
      console.log('[WebSocket] 从 token 解析 userId:', userId)
      return userId
    } catch (e) {
      console.warn('[WebSocket] 无法解析Token获取用户ID:', e)
      return null
    }
  }
  
  // 连接 WebSocket
  function connect() {
    console.log('[WebSocket] connect() 被调用')
    const userId = getUserId()
    if (!userId) {
      console.warn('[WebSocket] 无法获取 userId，无法连接')
      return
    }

    // 已连接则跳过
    if (ws && ws.readyState === WebSocket.OPEN) {
      console.log('[WebSocket] 已连接，跳过')
      return
    }
    
    // 正在连接中则跳过
    if (ws && ws.readyState === WebSocket.CONNECTING) {
      console.log('[WebSocket] 正在连接中，跳过')
      return
    }

    const wsUrl = `ws://localhost:8080/ws/task-progress/${userId}`
    console.log('[WebSocket] 正在连接:', wsUrl)

    try {
      ws = new WebSocket(wsUrl)

      ws.onopen = () => {
        console.log('[WebSocket] ✅ 连接成功!')
        isConnected.value = true
        reconnectCount.value = 0
        startHeartbeat()
      }

      ws.onmessage = (event) => {
        handleMessage(event.data)
      }

      ws.onclose = (event) => {
        console.log('WebSocket连接关闭:', event.code, event.reason)
        isConnected.value = false
        stopHeartbeat()
        // 只有非正常关闭才尝试重连
        if (event.code !== 1000) {
          attemptReconnect()
        }
      }

      ws.onerror = (error) => {
        console.error('WebSocket错误:', error)
        isConnected.value = false
      }
    } catch (error) {
      console.error('WebSocket连接失败:', error)
      attemptReconnect()
    }
  }
  
  // 处理消息
  function handleMessage(data: string) {
    if (data === 'pong') {
      console.debug('收到心跳响应')
      return
    }

    try {
      const message: WSMessage = JSON.parse(data)
      console.log('收到WebSocket消息:', message.type, message)

      switch (message.type) {
        case 'connected':
          console.log('WebSocket连接确认')
          break

        case 'task_progress':
          if (message.data) {
            const progressData = message.data as TaskProgressData
            console.log('分发任务进度更新给', taskProgressHandlers.value.length, '个订阅者')
            taskProgressHandlers.value.forEach(handler => {
              try {
                handler(progressData)
              } catch (e) {
                console.error('任务进度处理器执行失败:', e)
              }
            })
          }
          break

        case 'task_completed':
          if (message.data) {
            const completedData = message.data as TaskCompletedData
            console.log('[WebSocket] 任务完成通知 - videoId:', completedData.videoId, 
                        ', taskId:', completedData.taskId,
                        ', 订阅者数量:', taskCompletedHandlers.value.length)
            if (taskCompletedHandlers.value.length === 0) {
              console.warn('[WebSocket] 警告: 没有订阅者接收任务完成通知!')
            }
            taskCompletedHandlers.value.forEach((handler, index) => {
              try {
                console.log('[WebSocket] 调用第', index + 1, '个订阅者')
                handler(completedData)
              } catch (e) {
                console.error('[WebSocket] 任务完成处理器执行失败:', e)
              }
            })
          }
          break

        case 'task_failed':
          if (message.data) {
            const failedData = message.data as TaskFailedData
            console.log('分发任务失败通知给', taskFailedHandlers.value.length, '个订阅者')
            taskFailedHandlers.value.forEach(handler => {
              try {
                handler(failedData)
              } catch (e) {
                console.error('任务失败处理器执行失败:', e)
              }
            })
          }
          break

        default:
          console.log('未知消息类型:', message.type)
      }
    } catch (e) {
      console.warn('WebSocket消息解析失败:', data, e)
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
      console.log(`尝试重连 (${reconnectCount.value}/${maxReconnect})，${delay / 1000}秒后...`)

      reconnectTimer = setTimeout(() => {
        connect()
      }, delay)
    } else {
      console.error('WebSocket重连失败，已达最大重试次数')
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
    console.log('[WebSocket] 添加进度订阅者，当前数量:', taskProgressHandlers.value.length)
    // 返回取消订阅函数
    return () => {
      const index = taskProgressHandlers.value.indexOf(handler)
      if (index > -1) {
        taskProgressHandlers.value.splice(index, 1)
        console.log('[WebSocket] 移除进度订阅者，剩余数量:', taskProgressHandlers.value.length)
      }
    }
  }
  
  // 订阅任务完成
  function onTaskCompleted(handler: (data: TaskCompletedData) => void) {
    taskCompletedHandlers.value.push(handler)
    console.log('[WebSocket] 添加完成订阅者，当前数量:', taskCompletedHandlers.value.length)
    return () => {
      const index = taskCompletedHandlers.value.indexOf(handler)
      if (index > -1) {
        taskCompletedHandlers.value.splice(index, 1)
        console.log('[WebSocket] 移除完成订阅者，剩余数量:', taskCompletedHandlers.value.length)
      }
    }
  }
  
  // 订阅任务失败
  function onTaskFailed(handler: (data: TaskFailedData) => void) {
    taskFailedHandlers.value.push(handler)
    console.log('[WebSocket] 添加失败订阅者，当前数量:', taskFailedHandlers.value.length)
    return () => {
      const index = taskFailedHandlers.value.indexOf(handler)
      if (index > -1) {
        taskFailedHandlers.value.splice(index, 1)
        console.log('[WebSocket] 移除失败订阅者，剩余数量:', taskFailedHandlers.value.length)
      }
    }
  }
  
  // 发送消息
  function send(data: string | object) {
    if (ws && ws.readyState === WebSocket.OPEN) {
      const message = typeof data === 'string' ? data : JSON.stringify(data)
      ws.send(message)
    } else {
      console.warn('WebSocket未连接，无法发送消息')
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

