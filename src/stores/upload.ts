import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import SparkMD5 from 'spark-md5'
import {
  initUpload,
  cancelUpload as cancelUploadApi,
  checkChunkUpload,
  uploadChunk,
  uploadVideoSimple,
  createAnalysisTask
} from '@/api'
import { useWebSocketStore } from '@/stores/websocket'

const CHUNK_SIZE = 5 * 1024 * 1024 // 5MB

export interface UploadTask {
  videoId: string
  fileIdentifier: string
  fileName: string
  title: string
  progress: number
  status: 'uploading' | 'success' | 'failed' | 'cancelled'
  errorMessage?: string
  abortController: AbortController
}

export const useUploadStore = defineStore('upload', () => {
  const tasks = ref<UploadTask[]>([])

  const activeCount = computed(() => tasks.value.filter(t => t.status === 'uploading').length)

  const overallProgress = computed(() => {
    const active = tasks.value.filter(t => t.status === 'uploading')
    if (active.length === 0) return 0
    return Math.round(active.reduce((sum, t) => sum + t.progress, 0) / active.length)
  })

  // 计算 MD5（用于断点续传标识）
  function calculateMD5(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const spark = new SparkMD5.ArrayBuffer()
      const reader = new FileReader()
      const chunkSize = 2 * 1024 * 1024
      let currentChunk = 0
      const chunks = Math.ceil(file.size / chunkSize)

      reader.onload = (e) => {
        spark.append(e.target?.result as ArrayBuffer)
        currentChunk++
        if (currentChunk < chunks) loadNext()
        else resolve(spark.end())
      }
      reader.onerror = reject

      const loadNext = () => {
        const start = currentChunk * chunkSize
        const end = Math.min(start + chunkSize, file.size)
        reader.readAsArrayBuffer(file.slice(start, end))
      }
      loadNext()
    })
  }

  /**
   * 开始上传（后台运行，模态框关闭不中断）
   */
  async function startUpload(file: File, title: string): Promise<string> {
    const wsStore = useWebSocketStore()
    const abortController = new AbortController()

    // 1. 持久化先行：在 DB 写入 UPLOADING 记录，拿到 videoId
    const initRes = await initUpload({ fileName: file.name, title, fileSize: file.size })
    if (initRes.code !== 200) throw new Error(initRes.message || '初始化上传失败')
    const videoId = initRes.data.id
    const fileIdentifier = await calculateMD5(file)

    // 2. 注册到 store
    const task: UploadTask = {
      videoId,
      fileIdentifier,
      fileName: file.name,
      title,
      progress: 0,
      status: 'uploading',
      abortController
    }
    tasks.value.push(task)

    // 3. 后台异步执行上传（不 await，让调用方立即返回 videoId）
    _doUpload(task, file, title, wsStore).catch(() => {/* 错误已在内部处理 */})

    return videoId
  }

  async function _doUpload(task: UploadTask, file: File, title: string, wsStore: ReturnType<typeof useWebSocketStore>) {
    const { abortController, fileIdentifier, videoId } = task

    try {
      let finalVideoId = videoId

      if (file.size <= CHUNK_SIZE) {
        // 小文件直接上传
        const formData = new FormData()
        formData.append('file', file)
        formData.append('title', title)
        formData.append('videoId', videoId)
        const res = await uploadVideoSimple(formData, abortController.signal)
        if (res.code !== 200) throw new Error(res.message || '上传失败')
        finalVideoId = res.data.id || videoId
        _updateProgress(videoId, 100)
      } else {
        // 分片上传
        const totalChunks = Math.ceil(file.size / CHUNK_SIZE)
        const checkRes = await checkChunkUpload(fileIdentifier, file.name, totalChunks)
        if (checkRes.code !== 200) throw new Error(checkRes.message || '检查上传状态失败')

        if (checkRes.data.finished && checkRes.data.videoId) {
          // 秒传
          finalVideoId = checkRes.data.videoId
          _updateProgress(videoId, 100)
        } else {
          const uploaded = new Set(checkRes.data.uploadedChunks || [])
          for (let i = 0; i < totalChunks; i++) {
            // 检查是否已中止
            if (abortController.signal.aborted) return

            if (uploaded.has(i)) {
              _updateProgress(videoId, Math.round(((i + 1) / totalChunks) * 100))
              continue
            }

            const start = i * CHUNK_SIZE
            const end = Math.min(start + CHUNK_SIZE, file.size)
            const chunk = file.slice(start, end)
            const formData = new FormData()
            formData.append('chunk', chunk)
            formData.append('fileIdentifier', fileIdentifier)
            formData.append('fileName', file.name)
            formData.append('chunkNumber', String(i))
            formData.append('totalChunks', String(totalChunks))
            formData.append('chunkSize', String(chunk.size))
            formData.append('totalSize', String(file.size))
            formData.append('title', title)
            formData.append('videoId', videoId)

            const res = await uploadChunk(formData, abortController.signal)
            if (res.code !== 200) throw new Error(res.message || `分片 ${i + 1} 上传失败`)
            _updateProgress(videoId, Math.round(((i + 1) / totalChunks) * 100))
            if (res.data.finished && res.data.videoId) finalVideoId = res.data.videoId
          }
        }
      }

      // 4. 上传完成，创建分析任务
      if (finalVideoId) {
        // 写保护：上传完成后再次确认任务未被中止
        const currentTask = tasks.value.find(t => t.videoId === videoId)
        if (!currentTask || currentTask.status === 'cancelled') {
          return // 已被中止，放弃创建分析任务
        }
        await createAnalysisTask({ videoId: finalVideoId, taskType: 'FULL_ANALYSIS' })
      }

      _setStatus(videoId, 'success')
      wsStore.notifyTaskChanged()

      // 成功后 3 秒自动从列表移除
      setTimeout(() => removeTask(videoId), 3000)

    } catch (err: any) {
      if (abortController.signal.aborted || task.status === 'cancelled') {
        // 用户主动中止，状态已在 abortUpload 中设置，静默处理
        return
      }
      _setStatus(videoId, 'failed', err.message || '上传失败')
    } finally {
      // 无论成功/失败/中止，确保任务不会永远卡在 uploading 状态
      const finalTask = tasks.value.find(t => t.videoId === videoId)
      if (finalTask && finalTask.status === 'uploading') {
        _setStatus(videoId, 'failed', '上传意外中断')
      }
    }
  }

  /**
   * 中止上传（物理切断网络 + 并发清理 DB，防止临界点竞态）
   */
  async function abortUpload(videoId: string) {
    const task = tasks.value.find(t => t.videoId === videoId)
    if (!task) return

    // 1. 立即标记 cancelled，阻止 _doUpload 的后续逻辑
    _setStatus(videoId, 'cancelled')

    // 2. 物理切断网络请求（abort 信号）
    task.abortController.abort()

    // 3. 并发调用后端清理（不等待，防止 UI 卡顿）
    //    即使最后一个分片已触发合并，cancelUpload 会删除 video 记录
    //    后端 mergeChunks 完成后会发现 videoId 已不存在，放弃写库
    cancelUploadApi(videoId, task.fileIdentifier).catch(() => {
      // 忽略清理失败，不影响用户体验
    })

    // 4. 通知全局横幅立即刷新计数
    const wsStore = useWebSocketStore()
    wsStore.notifyTaskChanged()

    // 延迟移除任务卡片
    setTimeout(() => removeTask(videoId), 1500)
  }

  function removeTask(videoId: string) {
    const idx = tasks.value.findIndex(t => t.videoId === videoId)
    if (idx > -1) tasks.value.splice(idx, 1)
  }

  function _updateProgress(videoId: string, progress: number) {
    const task = tasks.value.find(t => t.videoId === videoId)
    if (task) task.progress = progress
  }

  function _setStatus(videoId: string, status: UploadTask['status'], errorMessage?: string) {
    const task = tasks.value.find(t => t.videoId === videoId)
    if (task) {
      task.status = status
      if (errorMessage) task.errorMessage = errorMessage
    }
  }

  return {
    tasks,
    activeCount,
    overallProgress,
    startUpload,
    abortUpload,
    removeTask
  }
})
