/*
 * SynSight - 高校内容风险分析平台
 * Copyright (c) 2026 Liu Minghao. All rights reserved.
 */

import { defineStore } from 'pinia'
import { ref } from 'vue'
import { useUserStore } from './user'
import config from '@/config'
import { pushBannerTrace } from '@/utils/bannerTrace'
import { pushWsRuntimeTrace } from '@/utils/wsRuntimeTrace'
import type { WSMessage, TaskProgressData, TaskCompletedData, TaskFailedData, VideoDeletedData, FeedbackNewData, FeedbackUpdatedData, FeedbackLockedData, FeedbackSyncData, NotificationNewData, TaskStatus } from '@/types'

/**
 * WebSocket 全局状态管理
 * 使用单例模式管理 WebSocket 连接，确保整个应用只有一个连接
 */
export const useWebSocketStore = defineStore('websocket', () => {
  const logBannerTraceFe = (message: string, payload?: unknown) => {
    pushBannerTrace(`[BANNER_TRACE_FE] ${message}`, payload)
  }

  // WebSocket 实例
  let ws: WebSocket | null = null

  // 连接状态
  const isConnected = ref(false)
  const reconnectCount = ref(0)

  // 配置
  const maxReconnect = config.websocket.maxReconnect
  const reconnectInterval = config.websocket.reconnectInterval
  const heartbeatInterval = config.websocket.heartbeatInterval
  const reconnectKeepaliveInterval = 60 * 1000
  const httpRecoverReconnectCooldown = 30 * 1000
  
  // 定时器
  let heartbeatTimer: ReturnType<typeof setInterval> | null = null
  let reconnectTimer: ReturnType<typeof setTimeout> | null = null
  let reconnectKeepaliveTimer: ReturnType<typeof setTimeout> | null = null
  let lastHttpRecoverReconnectAt = 0
  
  // 事件订阅者列表
  const taskProgressHandlers = ref<Array<(data: TaskProgressData) => void>>([])
  const taskCompletedHandlers = ref<Array<(data: TaskCompletedData) => void>>([])
  const taskFailedHandlers = ref<Array<(data: TaskFailedData) => void>>([])
  // 任务列表变更通知（取消/删除等操作后触发，用于同步顶部横幅计数）
  const taskChangedHandlers = ref<Array<() => void>>([])
  const videoDeletedHandlers = ref<Array<(data: VideoDeletedData) => void>>([])
  const feedbackNewHandlers = ref<Array<(data: FeedbackNewData) => void>>([])
  const feedbackUpdatedHandlers = ref<Array<(data: FeedbackUpdatedData) => void>>([])
  const feedbackLockedHandlers = ref<Array<(data: FeedbackLockedData) => void>>([])
  const feedbackSyncHandlers = ref<Array<(data: FeedbackSyncData) => void>>([])
  const notificationNewHandlers = ref<Array<(data: NotificationNewData) => void>>([])

  // ── 全局任务计数（乐观更新，无需等待 HTTP 轮询）──
  // MainLayout 直接绑定此值，取消/删除时立即减量，后端推送时覆盖校正
  const analyzingCount = ref(0)
  const downloadingCount = ref(0)
  const activeCountRevision = ref(0)
  const activeTaskStatuses = ref<Map<string, TaskStatus>>(new Map())
  const analyzingStatuses = new Set<TaskStatus>(['PENDING', 'PROCESSING'])
  const terminalStatuses = new Set<TaskStatus>(['COMPLETED', 'FAILED', 'CANCELLED'])
  const terminalTaskStatuses = new Map<string, TaskStatus>()
  const maxRememberedTerminalTasks = 500

  type ApplyTaskStatusOptions = {
    stage?: string
    failureType?: string
    /**
     * retryTask 会复用同一个 taskId。用户主动重试/新建时需要清掉旧终态，
     * 否则“完成后防旧消息回滚”的保护会误拦截真实的新一轮分析。
     */
    forceActive?: boolean
  }

  function knownCount(predicate: (status: TaskStatus) => boolean): number {
    let count = 0
    activeTaskStatuses.value.forEach((status) => {
      if (predicate(status)) count++
    })
    return count
  }

  function clampCount(count: number): number {
    return Math.max(0, count)
  }

  function isAnalyzingStatus(status: TaskStatus | undefined): boolean {
    return !!status && analyzingStatuses.has(status)
  }

  function isActiveStatus(status: TaskStatus | undefined): boolean {
    return status === 'DOWNLOADING' || isAnalyzingStatus(status)
  }

  function isTerminalStatus(status: TaskStatus | undefined): boolean {
    return !!status && terminalStatuses.has(status)
  }

  function rememberTerminalTask(taskId: string, status: TaskStatus) {
    terminalTaskStatuses.set(taskId, status)
    if (terminalTaskStatuses.size > maxRememberedTerminalTasks) {
      const oldestTaskId = terminalTaskStatuses.keys().next().value
      if (oldestTaskId) {
        terminalTaskStatuses.delete(oldestTaskId)
      }
    }
  }

  // 直接设置计数（由 MainLayout 的 checkAnalyzingTasks 调用）
  function setAnalyzingCount(count: number) {
    analyzingCount.value = clampCount(count)
  }

  function setDownloadingCount(count: number) {
    downloadingCount.value = clampCount(count)
  }
  function resetActiveTaskCounts(downloading: number, analyzing: number) {
    downloadingCount.value = clampCount(downloading)
    analyzingCount.value = clampCount(analyzing)
    activeCountRevision.value++
  }

  function hardResetActiveTaskCounts(downloading: number, analyzing: number) {
    downloadingCount.value = clampCount(downloading)
    analyzingCount.value = clampCount(analyzing)
    activeTaskStatuses.value.clear()
    activeCountRevision.value++
  }

  // 乐观减量（取消任务时立即调用，不等后端确认）
  function decrementAnalyzingCount() {
    analyzingCount.value = clampCount(analyzingCount.value - 1)
  }

  function decrementDownloadingCount() {
    downloadingCount.value = clampCount(downloadingCount.value - 1)
  }

  // 乐观确保横幅可见：用于收到 PENDING/PROCESSING 推送但 HTTP 计数兜底尚未返回时。
  function ensureAnalyzingVisible() {
    if (analyzingCount.value < 1) {
      analyzingCount.value = 1
    }
  }

  function ensureDownloadingVisible() {
    if (downloadingCount.value < 1) {
      downloadingCount.value = 1
    }
  }

  function applyTaskStatus(taskId: string | undefined, nextStatus: TaskStatus, options?: ApplyTaskStatusOptions): boolean {
    if (!taskId) return false

    const rememberedTerminalStatus = terminalTaskStatuses.get(taskId)
    const previousStatus = activeTaskStatuses.value.get(taskId)
    const finishLog = (accepted: boolean) => {
      logBannerTraceFe(
        `APPLY_STATUS taskId=${taskId} previousStatus=${previousStatus ?? 'NONE'} nextStatus=${nextStatus} afterDownloading=${downloadingCount.value} afterAnalyzing=${analyzingCount.value} accepted=${accepted}`,
        {
          taskId,
          previousStatus: previousStatus ?? 'NONE',
          nextStatus,
          afterDownloading: downloadingCount.value,
          afterAnalyzing: analyzingCount.value,
          accepted,
        },
      )
    }

    if (isActiveStatus(nextStatus)) {
      if (options?.forceActive) {
        terminalTaskStatuses.delete(taskId)
      } else if (rememberedTerminalStatus) {
        // 已经收到过终态后，又到达的活跃态大概率是迟到旧消息。
        // 不允许它把顶部横幅重新拉起来；真实重试必须走 forceActive。
        finishLog(false)
        return false
      }
    }

    const knownDownloadingBefore = knownCount(status => status === 'DOWNLOADING')
    const knownAnalyzingBefore = knownCount(status => isAnalyzingStatus(status))

    if (previousStatus === nextStatus) {
      if (nextStatus === 'DOWNLOADING') {
        ensureDownloadingVisible()
      } else if (isAnalyzingStatus(nextStatus)) {
        ensureAnalyzingVisible()
      }
      finishLog(true)
      return true
    }

    // 任何 WS/乐观状态变化都提升版本号，用于让 MainLayout 丢弃途中返回的旧 HTTP 计数。
    activeCountRevision.value++

    if (previousStatus === 'DOWNLOADING') {
      downloadingCount.value = clampCount(downloadingCount.value - 1)
    } else if (isAnalyzingStatus(previousStatus)) {
      analyzingCount.value = clampCount(analyzingCount.value - 1)
    } else if (!previousStatus) {
      // 处理刷新后/WS漏前序事件的状态迁移：
      // 只要收到“进入分析态”的推送，而本地下载横幅数量大于已知下载任务数，就先把一个下载名额转移到分析中。
      // 后续 HTTP 轻量计数会再校准，避免单次 WS/HTTP 时序问题导致横幅卡住。
      if (isAnalyzingStatus(nextStatus) && downloadingCount.value > knownDownloadingBefore) {
        downloadingCount.value = clampCount(downloadingCount.value - 1)
      }
    }

    if (nextStatus === 'DOWNLOADING') {
      activeTaskStatuses.value.set(taskId, nextStatus)
      if (downloadingCount.value <= knownDownloadingBefore) {
        downloadingCount.value++
      } else {
        ensureDownloadingVisible()
      }
      finishLog(true)
      return true
    }

    if (isAnalyzingStatus(nextStatus)) {
      activeTaskStatuses.value.set(taskId, nextStatus)
      if (analyzingCount.value <= knownAnalyzingBefore) {
        analyzingCount.value++
      } else {
        ensureAnalyzingVisible()
      }
      finishLog(true)
      return true
    }

    activeTaskStatuses.value.delete(taskId)
    if (isTerminalStatus(nextStatus)) {
      rememberTerminalTask(taskId, nextStatus)
    }

    // 终态事件若缺少前序状态，也要兜住横幅不消失的问题。
    if (!previousStatus) {
      if (nextStatus === 'FAILED' && options?.failureType === 'DOWNLOAD_FAILED' && downloadingCount.value > knownDownloadingBefore) {
        downloadingCount.value = clampCount(downloadingCount.value - 1)
      } else if ((nextStatus === 'COMPLETED' || nextStatus === 'FAILED' || nextStatus === 'CANCELLED') && analyzingCount.value > knownAnalyzingBefore) {
        analyzingCount.value = clampCount(analyzingCount.value - 1)
      }
    }
    finishLog(true)
    return true
  }

  function applyTaskProgress(data: TaskProgressData): boolean {
    return applyTaskStatus(data.taskId, data.status, { stage: data.stage })
  }

  function applyTaskCompleted(data: TaskCompletedData): boolean {
    return applyTaskStatus(data.taskId, 'COMPLETED')
  }

  function applyTaskFailed(data: TaskFailedData): boolean {
    return applyTaskStatus(data.taskId, 'FAILED', { failureType: data.failureType })
  }
  
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

  function decodeTokenExpMs(token: string | null | undefined): number | null {
    if (!token) return null
    try {
      const parts = token.trim().split('.')
      if (parts.length !== 3) return null
      const payload = JSON.parse(atob(parts[1]!))
      return typeof payload.exp === 'number' ? payload.exp * 1000 : null
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

    const userStore = useUserStore()
    const token = userStore.token
    if (!token) {
      return
    }

    pushWsRuntimeTrace('CONNECT_ATTEMPT', {
      readyState: ws?.readyState ?? null,
      reconnectCount: reconnectCount.value,
      userId,
      tokenExpMs: decodeTokenExpMs(token),
    })

    const wsUrl = `${config.wsBaseUrl}/ws/task-progress/${encodeURIComponent(userId)}?token=${encodeURIComponent(token)}`

    try {
      ws = new WebSocket(wsUrl)

      ws.onopen = () => {
        isConnected.value = true
        reconnectCount.value = 0
        if (reconnectKeepaliveTimer) {
          clearTimeout(reconnectKeepaliveTimer)
          reconnectKeepaliveTimer = null
        }
        pushWsRuntimeTrace('OPEN', {
          reconnectCount: reconnectCount.value,
          userId,
        })
        startHeartbeat()
      }

      ws.onmessage = (event) => {
        handleMessage(event.data)
      }

      ws.onclose = (event) => {
        isConnected.value = false
        stopHeartbeat()
        pushWsRuntimeTrace('CLOSE', {
          reconnectCount: reconnectCount.value,
          userId,
          code: event.code,
          reason: event.reason,
        })
        // 只有非正常关闭才尝试重连
        if (event.code !== 1000) {
          attemptReconnect()
        }
      }

      ws.onerror = (error) => {
        isConnected.value = false
        console.error('WebSocket连接错误:', error)
        // C11：onerror 之后浏览器必触发 onclose，由 onclose 统一处理重连，避免双重 attemptReconnect
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
            logBannerTraceFe(
              `WS_PROGRESS taskId=${progressData.taskId ?? ''} status=${progressData.status ?? ''} stage=${progressData.stage ?? ''} beforeDownloading=${downloadingCount.value} beforeAnalyzing=${analyzingCount.value}`,
              {
                taskId: progressData.taskId ?? '',
                status: progressData.status ?? '',
                stage: progressData.stage ?? '',
                beforeDownloading: downloadingCount.value,
                beforeAnalyzing: analyzingCount.value,
              },
            )
            // 全局横幅计数必须在 WebSocket 消息入口更新，不能依赖某个组件订阅是否正常执行。
            const accepted = applyTaskProgress(progressData)
            if (!accepted) break
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
            const completedData = message.data as TaskCompletedData
            const accepted = applyTaskCompleted(completedData)
            if (!accepted) break
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
            const failedData = message.data as TaskFailedData
            const accepted = applyTaskFailed(failedData)
            if (!accepted) break
            taskFailedHandlers.value.forEach(handler => {
              try {
                handler(failedData)
              } catch {
                // 忽略处理器错误
              }
            })
          }
          break

        case 'video_deleted':
          if (message.data) {
            const deletedData = message.data as VideoDeletedData
            videoDeletedHandlers.value.forEach(handler => {
              try { handler(deletedData) } catch { /* 忽略 */ }
            })
          }
          break

        case 'feedback_new':
          if (message.data) {
            const feedbackNewData = message.data as FeedbackNewData
            feedbackNewHandlers.value.forEach(handler => {
              try { handler(feedbackNewData) } catch { /* 忽略 */ }
            })
          }
          break

        case 'feedback_updated':
          if (message.data) {
            const feedbackUpdatedData = message.data as FeedbackUpdatedData
            feedbackUpdatedHandlers.value.forEach(handler => {
              try { handler(feedbackUpdatedData) } catch { /* 忽略 */ }
            })
          }
          break

        case 'feedback_locked':
          if (message.data) {
            const feedbackLockedData = message.data as FeedbackLockedData
            feedbackLockedHandlers.value.forEach(handler => {
              try { handler(feedbackLockedData) } catch { /* 忽略 */ }
            })
          }
          break

        case 'feedback_sync':
          if (message.data) {
            const feedbackSyncData = message.data as FeedbackSyncData
            feedbackSyncHandlers.value.forEach(handler => {
              try { handler(feedbackSyncData) } catch { /* 忽略 */ }
            })
          }
          break

        case 'notification_new':
          {
            const notificationNewData = (message.data || {}) as NotificationNewData
            notificationNewHandlers.value.forEach(handler => {
              try { handler(notificationNewData) } catch { /* 忽略 */ }
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
    if (reconnectKeepaliveTimer) {
      clearTimeout(reconnectKeepaliveTimer)
      reconnectKeepaliveTimer = null
    }

    if (reconnectCount.value < maxReconnect) {
      reconnectCount.value++
      const delay = reconnectInterval * reconnectCount.value
      pushWsRuntimeTrace('RECONNECT_SCHEDULE', {
        reconnectCount: reconnectCount.value,
        delayMs: delay,
      })

      console.log(`WebSocket重连尝试 ${reconnectCount.value}/${maxReconnect}，${delay}ms后重连...`)

      reconnectTimer = setTimeout(() => {
        connect()
      }, delay)
    } else {
      pushWsRuntimeTrace('RECONNECT_STOP', {
        reconnectCount: reconnectCount.value,
      })
      pushWsRuntimeTrace('RECONNECT_KEEPALIVE_SCHEDULE', {
        reconnectCount: reconnectCount.value,
        delayMs: reconnectKeepaliveInterval,
      })
      reconnectKeepaliveTimer = setTimeout(() => {
        reconnectKeepaliveTimer = null
        connect()
      }, reconnectKeepaliveInterval)
      console.error('WebSocket达到最大重连次数，进入低频保活重连')
    }
  }

  function maybeReconnectFromHttpSuccess() {
    const readyState = ws?.readyState ?? null
    const now = Date.now()
    const cooldownRemainingMs = Math.max(0, httpRecoverReconnectCooldown - (now - lastHttpRecoverReconnectAt))

    if (isConnected.value) {
      return
    }

    if (readyState === WebSocket.CONNECTING) {
      return
    }

    if (reconnectTimer) {
      return
    }

    if (cooldownRemainingMs > 0) {
      return
    }

    lastHttpRecoverReconnectAt = now
    pushWsRuntimeTrace('HTTP_RECOVER_RECONNECT_HINT', {
      readyState,
      reconnectCount: reconnectCount.value,
      cooldownMs: httpRecoverReconnectCooldown,
      promotedKeepalive: !!reconnectKeepaliveTimer,
    })
    if (reconnectKeepaliveTimer) {
      clearTimeout(reconnectKeepaliveTimer)
      reconnectKeepaliveTimer = null
    }
    connect()
  }
  
  // 断开连接
  function disconnect() {
    stopHeartbeat()

    if (reconnectTimer) {
      clearTimeout(reconnectTimer)
      reconnectTimer = null
    }
    if (reconnectKeepaliveTimer) {
      clearTimeout(reconnectKeepaliveTimer)
      reconnectKeepaliveTimer = null
    }

    if (ws) {
      ws.close(1000, '主动断开')
      ws = null
    }

    isConnected.value = false
    reconnectCount.value = 0
    lastHttpRecoverReconnectAt = 0
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

  // 订阅视频删除通知
  function onVideoDeleted(handler: (data: VideoDeletedData) => void) {
    videoDeletedHandlers.value.push(handler)
    return () => {
      const index = videoDeletedHandlers.value.indexOf(handler)
      if (index > -1) videoDeletedHandlers.value.splice(index, 1)
    }
  }

  // 订阅反馈新消息（管理员用）
  function onFeedbackNew(handler: (data: FeedbackNewData) => void) {
    feedbackNewHandlers.value.push(handler)
    return () => {
      const index = feedbackNewHandlers.value.indexOf(handler)
      if (index > -1) feedbackNewHandlers.value.splice(index, 1)
    }
  }

  // 订阅反馈更新（用户用）
  function onFeedbackUpdated(handler: (data: FeedbackUpdatedData) => void) {
    feedbackUpdatedHandlers.value.push(handler)
    return () => {
      const index = feedbackUpdatedHandlers.value.indexOf(handler)
      if (index > -1) feedbackUpdatedHandlers.value.splice(index, 1)
    }
  }

  // 订阅反馈被锁定（其他管理员用）
  function onFeedbackLocked(handler: (data: FeedbackLockedData) => void) {
    feedbackLockedHandlers.value.push(handler)
    return () => {
      const index = feedbackLockedHandlers.value.indexOf(handler)
      if (index > -1) feedbackLockedHandlers.value.splice(index, 1)
    }
  }
  
  // 订阅反馈会话更新（其他管理员刷新用，不增加未读）
  function onFeedbackSync(handler: (data: FeedbackSyncData) => void) {
    feedbackSyncHandlers.value.push(handler)
    return () => {
      const index = feedbackSyncHandlers.value.indexOf(handler)
      if (index > -1) feedbackSyncHandlers.value.splice(index, 1)
    }
  }

  // 订阅"新的系统通知"事件（铃铛实时刷新未读用，配合 30 分钟兜底轮询）
  function onNotificationNew(handler: (data: NotificationNewData) => void) {
    notificationNewHandlers.value.push(handler)
    return () => {
      const index = notificationNewHandlers.value.indexOf(handler)
      if (index > -1) notificationNewHandlers.value.splice(index, 1)
    }
  }

  // 主动通知任务列表已变更（取消/删除后调用，触发顶部横幅立即刷新）
  function notifyTaskChanged() {
    taskChangedHandlers.value.forEach(handler => {
      try { handler() } catch { /* 忽略 */ }
    })
  }
  
  // 订阅任务变更通知
  function onTaskChanged(handler: () => void) {
    taskChangedHandlers.value.push(handler)
    return () => {
      const index = taskChangedHandlers.value.indexOf(handler)
      if (index > -1) {
        taskChangedHandlers.value.splice(index, 1)
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
    analyzingCount,
    downloadingCount,
    activeCountRevision,
    connect,
    disconnect,
    send,
    onTaskProgress,
    onTaskCompleted,
    onTaskFailed,
    onVideoDeleted,
    onFeedbackNew,
    onFeedbackUpdated,
    onFeedbackLocked,
    onFeedbackSync,
    onNotificationNew,
    notifyTaskChanged,
    onTaskChanged,
    setAnalyzingCount,
    setDownloadingCount,
    resetActiveTaskCounts,
    hardResetActiveTaskCounts,
    decrementAnalyzingCount,
    decrementDownloadingCount,
    ensureAnalyzingVisible,
    ensureDownloadingVisible,
    applyTaskStatus,
    applyTaskProgress,
    applyTaskCompleted,
    applyTaskFailed,
    maybeReconnectFromHttpSuccess
  }
})




