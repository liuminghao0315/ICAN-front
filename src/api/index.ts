import axios from 'axios'
import type { AxiosInstance, AxiosResponse } from 'axios'
import { ElMessage } from 'element-plus'
import type {
  Result,
  PageResult,
  VideoVO,
  ChunkCheckResult,
  AnalysisTaskVO,
  AnalysisTaskDTO,
  AnalysisResultVO,
  AnalysisStats,
  RiskDistribution,
  UploadTrendItem,
  TotalStats,
  WordPackVO,
  TaskStatus,
  RiskLevel,
  SourceType
} from '@/types'

// ==================== 基础配置 ====================

// 响应数据接口
export interface ApiResponse<T = any> {
  code: number
  message: string | null
  data: T
}

// 创建axios实例
const api: AxiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080',
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json'
  }
})

// 获取存储的 token
function getStoredToken(): string | null {
  try {
    // 从 pinia persist 存储的位置读取
    const stored = localStorage.getItem('user-store')
    if (stored) {
      const data = JSON.parse(stored)
      return data.token || null
    }
  } catch {
    // 解析失败
  }
  return null
}

// 获取存储的 refreshToken
function getStoredRefreshToken(): string | null {
  try {
    const stored = localStorage.getItem('user-store')
    if (stored) {
      const data = JSON.parse(stored)
      return data.refreshToken || null
    }
  } catch {
    // 解析失败
  }
  return null
}

// 刷新token的标记，防止并发刷新
let isRefreshing = false
// 等待刷新完成的请求队列
let failedQueue: Array<{
  resolve: (value?: any) => void
  reject: (reason?: any) => void
}> = []

// 处理等待队列中的请求
function processQueue(error: any, token: string | null = null) {
  failedQueue.forEach(prom => {
    if (error) {
      prom.reject(error)
    } else {
      prom.resolve(token)
    }
  })
  failedQueue = []
}

// 请求拦截器 - 自动添加Token
api.interceptors.request.use(
  (config) => {
    const token = getStoredToken()
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// 响应拦截器 - 统一处理错误和token刷新
api.interceptors.response.use(
  (response: AxiosResponse<ApiResponse>) => {
    return response
  },
  async (error) => {
    const originalRequest = error.config

    // 用户主动中止（AbortController.abort()）：静默处理，不弹任何错误通知
    if (axios.isCancel(error) || error.name === 'CanceledError' || error.code === 'ERR_CANCELED') {
      return Promise.reject(error)
    }

    if (error.response) {
      const status = error.response.status
      const message = error.response.data?.message || '请求失败'
      const silent = originalRequest?._silent === true
      
      // 401: 未授权，尝试刷新token
      if (status === 401 && originalRequest && !originalRequest._retry) {
        // 如果正在刷新，将请求加入队列
        if (isRefreshing) {
          return new Promise((resolve, reject) => {
            failedQueue.push({ resolve, reject })
          })
            .then(token => {
              originalRequest.headers.Authorization = `Bearer ${token}`
              return api(originalRequest)
            })
            .catch(err => {
              return Promise.reject(err)
            })
        }

        originalRequest._retry = true
        isRefreshing = true

        const refreshToken = getStoredRefreshToken()
        if (!refreshToken) {
          // 没有refreshToken，直接跳转登录
          isRefreshing = false
          processQueue(new Error('未登录'))
          localStorage.removeItem('user-store')
          if (window.location.pathname !== '/login') {
            window.location.href = '/login'
          }
          return Promise.reject({
            ...error,
            message: '未登录，请重新登录',
            status: 401
          })
        }

        try {
          // 调用刷新token接口（使用axios直接调用，避免循环依赖）
          const refreshResponse = await axios.post<ApiResponse<{
            accessToken: string
            refreshToken: string
          }>>(
            `${api.defaults.baseURL || 'http://localhost:8080'}/auth/refresh`,
            null,
            {
              params: { refreshToken },
              headers: {
                'Content-Type': 'application/json'
              }
            }
          )

          if (refreshResponse.data.code === 200 && refreshResponse.data.data) {
            const { accessToken, refreshToken: newRefreshToken } = refreshResponse.data.data
            
            // 更新store中的token（通过更新localStorage，pinia persist会自动同步）
            // 注意：直接更新localStorage，pinia persist会在下次访问store时自动同步
            const stored = localStorage.getItem('user-store')
            if (stored) {
              try {
                const data = JSON.parse(stored)
                data.token = accessToken
                data.refreshToken = newRefreshToken
                localStorage.setItem('user-store', JSON.stringify(data))
              } catch {
                // 解析失败，忽略
              }
            } else {
              // 如果localStorage中没有，创建一个新的
              localStorage.setItem('user-store', JSON.stringify({
                token: accessToken,
                refreshToken: newRefreshToken,
                userInfo: null
              }))
            }

            // 更新请求头
            originalRequest.headers.Authorization = `Bearer ${accessToken}`
            
            // 处理等待队列
            isRefreshing = false
            processQueue(null, accessToken)

            // 重试原始请求
            return api(originalRequest)
          } else {
            // 刷新失败
            isRefreshing = false
            processQueue(new Error('Token刷新失败'))
            localStorage.removeItem('user-store')
            if (window.location.pathname !== '/login') {
              window.location.href = '/login'
            }
            return Promise.reject({
              ...error,
              message: '登录已过期，请重新登录',
              status: 401
            })
          }
        } catch (refreshError: any) {
          // 刷新token请求失败
          isRefreshing = false
          processQueue(refreshError)
          localStorage.removeItem('user-store')
          if (window.location.pathname !== '/login') {
            window.location.href = '/login'
          }
          return Promise.reject({
            ...error,
            message: '登录已过期，请重新登录',
            status: 401
          })
        }
      }
      // 403: 禁止访问
      else if (status === 403) {
        if (!silent) ElMessage.error('权限不足，无法访问该资源')
      }
      // 404: 资源不存在
      else if (status === 404) {
        if (!silent) ElMessage.error('请求的资源不存在')
      }
      // 500: 服务器错误
      else if (status >= 500) {
        if (!silent) ElMessage.error('服务器错误，请稍后重试')
      } else if (status !== 401) {
        // 其他错误（401已在上面处理，不重复提示）
        if (!silent) ElMessage.error(message || '请求失败')
      }
      
      // 返回错误信息，让调用方处理
      return Promise.reject({
        ...error,
        message: message,
        status: status
      })
    } else if (error.request) {
      // 请求已发出但没有收到响应（排除主动中止的情况）
      ElMessage.error('网络错误，请检查网络连接')
      return Promise.reject({
        ...error,
        message: '网络错误，请检查网络连接',
        status: 0
      })
    } else {
      // 其他错误
      ElMessage.error(error.message || '未知错误')
      return Promise.reject({
        ...error,
        message: error.message || '未知错误',
        status: 0
      })
    }
  }
)

// ==================== 用户认证接口 ====================

// 登录接口
export interface LoginParams {
  username: string
  password: string
}

export const login = async (params: LoginParams): Promise<ApiResponse<{
  accessToken: string
  refreshToken: string
} | string>> => {
  const response = await api.post<ApiResponse<{
    accessToken: string
    refreshToken: string
  } | string>>('/auth/login', params)
  return response.data
}

// 发送注册验证码
export interface SendRegisterCodeParams {
  mailType: string // 'qq' | 'netease'
  mailTo: string
}

export const sendRegisterCode = async (params: SendRegisterCodeParams): Promise<ApiResponse<string>> => {
  const response = await api.get<ApiResponse<string>>('/auth/sendMailToRegister', { params })
  return response.data
}

// 用户注册
export interface RegisterParams {
  username: string
  password: string
  email: string
  verifyCode: string
}

export const register = async (params: RegisterParams): Promise<ApiResponse<RegisterParams>> => {
  const response = await api.post<ApiResponse<RegisterParams>>('/auth/register', params)
  return response.data
}

// 发送重置密码验证码
export interface SendResetPwdCodeParams {
  /** 用户名或邮箱，用于找回密码 */
  identifier: string
}

export const sendResetPwdCode = async (params: SendResetPwdCodeParams): Promise<ApiResponse<string>> => {
  const response = await api.get<ApiResponse<string>>('/account/sendMailToResetPwd', {
    params: {
      // 后端目前参数名为 username，这里复用该参数名，值为“用户名或邮箱”
      username: params.identifier
    }
  })
  return response.data
}

// 重置密码
export interface ResetPwdParams {
  verifyCode: string
  newPwd: string
}

export const resetPwd = async (params: ResetPwdParams): Promise<ApiResponse<string>> => {
  const response = await api.get<ApiResponse<string>>('/account/resetPwd', { params })
  return response.data
}

// 登出
export const logout = async (): Promise<ApiResponse<string>> => {
  const response = await api.get<ApiResponse<string>>('/account/logout')
  return response.data
}

// ==================== 视频相关接口 ====================

// 视频信息 (兼容旧代码)
export interface VideoInfo {
  id: string
  title: string
  description: string | null
  fileName: string
  fileSize: number
  fileType: string
  duration: number | null
  width: number | null
  height: number | null
  thumbnailUrl: string | null
  videoUrl: string
  status: 'UPLOADED' | 'ANALYZING' | 'COMPLETED' | 'FAILED'
  gmtCreated: string
}

// 分片上传响应 (兼容旧代码)
export interface ChunkUploadResponse {
  needUpload: boolean
  uploadedChunks: number[]
  finished: boolean
  videoId: string | null
  videoUrl: string | null
  message: string
}

// 分页响应 (兼容旧代码)
export interface PageResponse<T> {
  records: T[]
  total: number
  size: number
  current: number
  pages: number
}

// 检查分片上传状态
export const checkChunkUpload = async (
  fileIdentifier: string,
  fileName: string,
  totalChunks: number
): Promise<ApiResponse<ChunkUploadResponse>> => {
  const response = await api.get<ApiResponse<ChunkUploadResponse>>('/api/video/check-chunk', {
    params: { fileIdentifier, fileName, totalChunks }
  })
  return response.data
}

// 初始化上传（持久化先行，在分片传输前创建 UPLOADING 状态记录）
export const initUpload = async (params: { fileName: string; title?: string; fileSize: number; folderId?: string }): Promise<ApiResponse<VideoInfo>> => {
  const response = await api.post<ApiResponse<VideoInfo>>('/api/video/init-upload', null, {
    params
  })
  return response.data
}

// 取消上传（清理 DB 记录和临时分片文件）
export const cancelUpload = async (videoId: string, fileIdentifier?: string): Promise<ApiResponse<void>> => {
  const response = await api.delete<ApiResponse<void>>(`/api/video/${videoId}/cancel-upload`, {
    params: fileIdentifier ? { fileIdentifier } : {}
  })
  return response.data
}

// 上传分片
export const uploadChunk = async (formData: FormData, signal?: AbortSignal): Promise<ApiResponse<ChunkUploadResponse>> => {
  const response = await api.post<ApiResponse<ChunkUploadResponse>>('/api/video/upload-chunk', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
    timeout: 60000,
    signal
  })
  return response.data
}

// 简单上传视频
export const uploadVideoSimple = async (formData: FormData, signal?: AbortSignal): Promise<ApiResponse<VideoInfo>> => {
  const response = await api.post<ApiResponse<VideoInfo>>('/api/video/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
    timeout: 300000,
    signal
  })
  return response.data
}

// 获取视频详情
export const getVideoById = async (videoId: string, silent: boolean = false): Promise<ApiResponse<VideoInfo>> => {
  const response = await api.get<ApiResponse<VideoInfo>>(`/api/video/${videoId}`, { _silent: silent } as any)
  return response.data
}

// 获取视频列表
export const getVideoList = async (
  page: number = 1,
  size: number = 10,
  status?: string,
  sortBy: string = 'gmtCreated',
  sortOrder: string = 'desc'
): Promise<ApiResponse<PageResponse<VideoInfo>>> => {
  const response = await api.get<ApiResponse<PageResponse<VideoInfo>>>('/api/video/list', {
    params: { page, size, status, sortBy, sortOrder }
  })
  return response.data
}

// 删除视频
export const deleteVideo = async (videoId: string, silent = false): Promise<ApiResponse<void>> => {
  const response = await api.delete<ApiResponse<void>>(`/api/video/${videoId}`, { _silent: silent } as any)
  return response.data
}

// ==================== 分析任务接口 ====================

// 创建分析任务
export const createAnalysisTask = async (params: AnalysisTaskDTO): Promise<ApiResponse<AnalysisTaskVO>> => {
  const response = await api.post<ApiResponse<AnalysisTaskVO>>('/api/analysis/task', params)
  return response.data
}

// 获取任务详情
export const getTaskById = async (taskId: string): Promise<ApiResponse<AnalysisTaskVO>> => {
  const response = await api.get<ApiResponse<AnalysisTaskVO>>(`/api/analysis/task/${taskId}`)
  return response.data
}

// 根据视频ID获取最新任务
export const getTaskByVideoId = async (videoId: string): Promise<ApiResponse<AnalysisTaskVO | null>> => {
  const response = await api.get<ApiResponse<AnalysisTaskVO | null>>(`/api/analysis/task/video/${videoId}`)
  return response.data
}

// 获取任务列表查询参数
export interface TaskListParams {
  page?: number
  pageSize?: number
  status?: TaskStatus
  videoId?: string
}

// 获取任务列表
export const getTaskList = async (
  page: number = 1,
  size: number = 10,
  status?: TaskStatus,
  riskLevel?: RiskLevel,
  sortBy: string = 'gmtCreated',
  sortOrder: string = 'desc',
  folderId?: string
): Promise<ApiResponse<PageResult<AnalysisTaskVO>>> => {
  const params: Record<string, any> = { page, size, sortBy, sortOrder }
  if (status) {
    params.status = status
  }
  if (riskLevel) {
    params.riskLevel = riskLevel
  }
  if (folderId) {
    params.folderId = folderId
  }
  const response = await api.get<ApiResponse<PageResult<AnalysisTaskVO>>>('/api/analysis/task/list', { params })
  return response.data
}

// 获取任务列表（支持更多参数）
export const getAnalysisTaskList = async (params: TaskListParams): Promise<ApiResponse<PageResult<AnalysisTaskVO>>> => {
  const queryParams: Record<string, any> = {
    page: params.page || 1,
    size: params.pageSize || 10
  }
  if (params.status) {
    queryParams.status = params.status
  }
  if (params.videoId) {
    queryParams.videoId = params.videoId
  }
  const response = await api.get<ApiResponse<PageResult<AnalysisTaskVO>>>('/api/analysis/task/list', { params: queryParams })
  return response.data
}

// 取消任务
export const cancelTask = async (taskId: string): Promise<ApiResponse<void>> => {
  const response = await api.post<ApiResponse<void>>(`/api/analysis/task/${taskId}/cancel`)
  return response.data
}

// 重试任务
export const retryTask = async (taskId: string): Promise<ApiResponse<AnalysisTaskVO>> => {
  const response = await api.post<ApiResponse<AnalysisTaskVO>>(`/api/analysis/task/${taskId}/retry`)
  return response.data
}

// ==================== 分析结果接口 ====================

// 获取分析结果
export const getResultById = async (resultId: string, feedback?: string): Promise<ApiResponse<AnalysisResultVO>> => {
  const response = await api.get<ApiResponse<AnalysisResultVO>>(`/api/analysis/result/${resultId}`, {
    params: feedback ? { feedback } : undefined
  })
  return response.data
}

// 下载PDF分析报告
export const downloadReportPdf = async (resultId: string): Promise<Blob> => {
  const response = await api.get(`/api/analysis/result/${resultId}/pdf`, {
    responseType: 'blob'
  })
  return response.data
}

// 根据任务ID获取分析结果
export const getResultByTaskId = async (taskId: string, feedback?: string): Promise<ApiResponse<AnalysisResultVO | null>> => {
  const response = await api.get<ApiResponse<AnalysisResultVO | null>>(`/api/analysis/result/task/${taskId}`, {
    params: feedback ? { feedback } : undefined
  })
  return response.data
}

// 根据视频ID获取最新分析结果
export const getResultByVideoId = async (videoId: string, feedback?: string): Promise<ApiResponse<AnalysisResultVO | null>> => {
  const response = await api.get<ApiResponse<AnalysisResultVO | null>>(`/api/analysis/result/video/${videoId}`, {
    params: feedback ? { feedback } : undefined
  })
  return response.data
}

// 获取分析结果列表
export const getResultList = async (
  page: number = 1,
  size: number = 10,
  riskLevel?: RiskLevel
): Promise<ApiResponse<PageResult<AnalysisResultVO>>> => {
  const params: Record<string, any> = { page, size }
  if (riskLevel) {
    params.riskLevel = riskLevel
  }
  const response = await api.get<ApiResponse<PageResult<AnalysisResultVO>>>('/api/analysis/result/list', { params })
  return response.data
}

// 获取分析统计数据
export const getAnalysisStats = async (): Promise<ApiResponse<AnalysisStats>> => {
  const response = await api.get<ApiResponse<AnalysisStats>>('/api/analysis/result/stats')
  return response.data
}

// 获取风险分布
export const getRiskDistribution = async (): Promise<ApiResponse<RiskDistribution>> => {
  const response = await api.get<ApiResponse<RiskDistribution>>('/api/analysis/result/risk-distribution')
  return response.data
}

// 删除分析结果
export const deleteResult = async (resultId: string): Promise<ApiResponse<void>> => {
  const response = await api.delete<ApiResponse<void>>(`/api/analysis/result/${resultId}`)
  return response.data
}

// ==================== 统计相关接口 ====================

// 上传趋势数据项 (兼容旧代码)
export interface UploadTrendItemLegacy {
  date: string
  displayDate: string
  count: number
  size: number
}

// 获取上传趋势
export const getUploadTrend = async (days: number = 7): Promise<ApiResponse<UploadTrendItemLegacy[]>> => {
  const response = await api.get<ApiResponse<UploadTrendItemLegacy[]>>('/api/statistics/upload-trend', {
    params: { days }
  })
  return response.data
}

// 获取总体统计
export const getTotalStats = async (): Promise<ApiResponse<TotalStats>> => {
  const response = await api.get<ApiResponse<TotalStats>>('/api/statistics/total')
  return response.data
}

// 导出类型
export type { 
  VideoVO, 
  ChunkCheckResult, 
  AnalysisTaskVO, 
  AnalysisTaskDTO, 
  AnalysisResultVO,
  AnalysisStats,
  RiskDistribution,
  UploadTrendItem,
  TotalStats,
  TaskStatus,
  RiskLevel,
  SourceType
}

// ==================== URL导入接口 ====================

// URL导入请求
export interface UrlImportParams {
  url: string
  title?: string
  taskType?: string
  folderId?: string
  /** 挂载的风险词库包 ID 列表 */
  selectedPackageIds?: string[]
}

// URL导入创建任务
export const createUrlImportTask = async (params: UrlImportParams): Promise<ApiResponse<AnalysisTaskVO>> => {
  const response = await api.post<ApiResponse<AnalysisTaskVO>>('/api/analysis/task/url-import', params)
  return response.data
}

// URL预校验（在弹窗内调用，校验失败直接拦截，不创建任务）
export const validateImportUrl = async (url: string): Promise<ApiResponse<{ title?: string; errorType?: string; errorMessage?: string }>> => {
  const response = await api.post<ApiResponse<{ title?: string; errorType?: string; errorMessage?: string }>>('/api/analysis/task/url-validate', { url })
  return response.data
}

// 保存 Cookies（供抖音等需要登录的平台使用）
export const savePlatformCookies = async (cookies: string): Promise<ApiResponse<void>> => {
  const response = await api.post<ApiResponse<void>>('/api/analysis/task/save-cookies', { cookies })
  return response.data
}

// ==================== 视频管理扩展接口 ====================

// 重命名视频
export const renameVideo = async (videoId: string, title: string): Promise<ApiResponse<void>> => {
  const response = await api.put<ApiResponse<void>>(`/api/video/${videoId}/rename`, { title })
  return response.data
}

// ==================== 文件夹管理接口 ====================

import type { FolderVO } from '@/types'

// 获取文件夹树
export const getFolderTree = async (): Promise<ApiResponse<FolderVO[]>> => {
  const response = await api.get<ApiResponse<FolderVO[]>>('/api/folder/tree')
  return response.data
}

// 创建文件夹
export const createFolder = async (name: string, parentId?: string | null): Promise<ApiResponse<FolderVO>> => {
  const response = await api.post<ApiResponse<FolderVO>>('/api/folder', { name, parentId: parentId || null })
  return response.data
}

// 重命名文件夹
export const renameFolder = async (folderId: string, name: string): Promise<ApiResponse<void>> => {
  const response = await api.put<ApiResponse<void>>(`/api/folder/${folderId}/rename`, { name })
  return response.data
}

// 移动文件夹（支持拖拽排序）
export const moveFolder = async (folderId: string, parentId: string | null, sortOrder: number = 0): Promise<ApiResponse<void>> => {
  const response = await api.put<ApiResponse<void>>(`/api/folder/${folderId}/move`, { parentId, sortOrder })
  return response.data
}

// 删除文件夹（视频自动移至未分类，返回被移动的视频数量）
export const deleteFolder = async (folderId: string): Promise<ApiResponse<number>> => {
  const response = await api.delete<ApiResponse<number>>(`/api/folder/${folderId}`)
  return response.data
}

// 将视频移动到文件夹
export const moveVideosToFolder = async (videoIds: string[], folderId: string | null): Promise<ApiResponse<void>> => {
  const response = await api.put<ApiResponse<void>>('/api/folder/move-videos', { videoIds, folderId })
  return response.data
}

// ==================== 收藏模块 ====================

/** 收藏一个分析任务 */
export const favoriteTask = async (taskId: string): Promise<ApiResponse<void>> => {
  const response = await api.post<ApiResponse<void>>(`/api/favorite/${taskId}`)
  return response.data
}

/** 取消收藏一个分析任务 */
export const unfavoriteTask = async (taskId: string): Promise<ApiResponse<void>> => {
  const response = await api.delete<ApiResponse<void>>(`/api/favorite/${taskId}`)
  return response.data
}

/** 获取收藏列表（分页） */
export const getFavoriteList = async (params: {
  page?: number
  size?: number
  keyword?: string
  riskLevel?: string
  sourceType?: string
  sortField?: string
  sortDir?: string
}): Promise<ApiResponse<PageResult<AnalysisTaskVO>>> => {
  const response = await api.get<ApiResponse<PageResult<AnalysisTaskVO>>>('/api/favorite/list', { params })
  return response.data
}

// ==================== 词库包接口 ====================

/**
 * 获取词库包列表（含词汇详情，用于词库管理页面）
 */
export const getWordPackList = async (): Promise<ApiResponse<WordPackVO[]>> => {
  const response = await api.get<ApiResponse<WordPackVO[]>>('/api/word-pack/list')
  return response.data
}

/**
 * 获取词库包简要列表（用于新建任务时选择）
 */
export const getWordPackBriefList = async (): Promise<ApiResponse<WordPackVO[]>> => {
  const response = await api.get<ApiResponse<WordPackVO[]>>('/api/word-pack/brief')
  return response.data
}

/**
 * 创建词库包
 */
export const createWordPack = async (data: {
  name: string
  description?: string
  level?: string
  words?: { text: string; risk?: string }[]
}): Promise<ApiResponse<WordPackVO>> => {
  const response = await api.post<ApiResponse<WordPackVO>>('/api/word-pack', data)
  return response.data
}

/**
 * 更新词库包
 */
export const updateWordPack = async (packId: string, data: {
  name?: string
  description?: string
  level?: string
}): Promise<ApiResponse<WordPackVO>> => {
  const response = await api.put<ApiResponse<WordPackVO>>(`/api/word-pack/${packId}`, data)
  return response.data
}

/**
 * 删除词库包
 */
export const deleteWordPack = async (packId: string): Promise<ApiResponse<void>> => {
  const response = await api.delete<ApiResponse<void>>(`/api/word-pack/${packId}`)
  return response.data
}

/**
 * 向词库包添加词汇
 */
export const addWordsToWordPack = async (packId: string, words: { text: string; risk?: string }[]): Promise<ApiResponse<void>> => {
  const response = await api.post<ApiResponse<void>>(`/api/word-pack/${packId}/words`, words)
  return response.data
}

/**
 * 删除词汇
 */
export const deleteWordFromPack = async (wordId: string): Promise<ApiResponse<void>> => {
  const response = await api.delete<ApiResponse<void>>(`/api/word-pack/word/${wordId}`)
  return response.data
}

// ==================== 设置模块接口 ====================

/** 向当前绑定邮箱发送修改密码验证码 */
export const sendMailToChangePwd = async (): Promise<ApiResponse<string>> => {
  const response = await api.get<ApiResponse<string>>('/account/sendMailToChangePwd')
  return response.data
}

/** 验证码验证后修改密码 */
export const changePwd = async (verifyCode: string, newPwd: string): Promise<ApiResponse<string>> => {
  const response = await api.post<ApiResponse<string>>('/account/changePwd', null, {
    params: { verifyCode, newPwd }
  })
  return response.data
}


/** 发送变更邮箱验证码到新邮箱 */
export const sendMailToChangeEmail = async (newEmail: string): Promise<ApiResponse<string>> => {
  const response = await api.get<ApiResponse<string>>('/account/sendMailToChangeEmail', {
    params: { newEmail }
  })
  return response.data
}

/** 验证验证码并更新邮箱 */
export const changeEmail = async (newEmail: string, verifyCode: string): Promise<ApiResponse<string>> => {
  const response = await api.post<ApiResponse<string>>('/account/changeEmail', null, {
    params: { newEmail, verifyCode }
  })
  return response.data
}

/** 获取当前登录用户信息（id / username / email / role / avatarUrl） */
export const getMe = async (): Promise<ApiResponse<{ id: string; username: string; email: string; role: string; avatarUrl?: string }>> => {
  const response = await api.get<ApiResponse<{ id: string; username: string; email: string; role: string; avatarUrl?: string }>>('/account/me')
  return response.data
}

/** 上传头像（multipart/form-data，字段名 avatar），返回头像访问 URL */
export const uploadAvatar = async (blob: Blob, filename = 'avatar.png'): Promise<ApiResponse<{ avatarUrl: string }>> => {
  const formData = new FormData()
  formData.append('avatar', blob, filename)
  const response = await api.post<ApiResponse<{ avatarUrl: string }>>('/account/avatar', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  })
  return response.data
}

// ==================== 反馈模块接口 ====================

export interface FeedbackCreateParams {
  taskId: string
  videoId: string
  feedbackType: string
  module?: string
  content: string
}

export interface FeedbackVO {
  id: string
  userId: string
  username: string
  taskId: string
  videoId: string
  videoTitle?: string
  feedbackType: string
  module: string | null
  content: string
  status: string
  handlerId: string | null
  handlerName: string | null
  adminReply: string | null
  userUnread: number
  adminUnread: number
  analysisSnapshot?: Record<string, any> | null
  videoDeleted?: boolean
  gmtCreated: string
  gmtModified: string
}

export interface FeedbackMessage {
  role: 'user' | 'admin'
  text: string
  type?: string
  module?: string
  time: string
}

/** 提交反馈 */
export const submitFeedback = async (params: FeedbackCreateParams): Promise<ApiResponse<FeedbackVO>> => {
  const response = await api.post<ApiResponse<FeedbackVO>>('/api/feedback', params)
  return response.data
}

/** 获取我的反馈历史 */
export const getMyFeedbacks = async (page: number = 1, size: number = 10): Promise<ApiResponse<PageResult<FeedbackVO>>> => {
  const response = await api.get<ApiResponse<PageResult<FeedbackVO>>>('/api/feedback/my', { params: { page, size } })
  return response.data
}

/** 获取我对某视频的反馈 */
export const getMyFeedbackByVideo = async (videoId: string): Promise<ApiResponse<FeedbackVO | null>> => {
  const response = await api.get<ApiResponse<FeedbackVO | null>>(`/api/feedback/my/video/${videoId}`)
  return response.data
}

/** 管理员获取反馈列表 */
export const getAdminFeedbackList = async (
  page: number = 1,
  size: number = 10,
  status?: string,
  onlyMine: boolean = false
): Promise<ApiResponse<PageResult<FeedbackVO>>> => {
  const params: Record<string, any> = { page, size }
  if (status) params.status = status
  if (onlyMine) params.onlyMine = true
  const response = await api.get<ApiResponse<PageResult<FeedbackVO>>>('/api/feedback/admin/list', { params })
  return response.data
}

/** 管理员锁定反馈 */
export const lockFeedback = async (feedbackId: string): Promise<ApiResponse<void>> => {
  const response = await api.put<ApiResponse<void>>(`/api/feedback/${feedbackId}/lock`)
  return response.data
}

/** 管理员回复消息（纯聊天，不改状态） */
export const replyFeedback = async (feedbackId: string, reply: string): Promise<ApiResponse<void>> => {
  const response = await api.put<ApiResponse<void>>(`/api/feedback/${feedbackId}/reply`, { reply })
  return response.data
}

/** 管理员关闭反馈（改状态） */
export const closeFeedback = async (feedbackId: string, status: string = 'RESOLVED'): Promise<ApiResponse<void>> => {
  const response = await api.put<ApiResponse<void>>(`/api/feedback/${feedbackId}/close`, { status })
  return response.data
}

/** 获取单条反馈详情 */
export const getFeedbackById = async (feedbackId: string): Promise<ApiResponse<FeedbackVO>> => {
  const response = await api.get<ApiResponse<FeedbackVO>>(`/api/feedback/${feedbackId}`)
  return response.data
}

/** 清除未读数（打开弹窗时调用） */
export const clearFeedbackUnread = async (feedbackId: string): Promise<ApiResponse<void>> => {
  const response = await api.put<ApiResponse<void>>(`/api/feedback/${feedbackId}/clear-unread`, null, { _silent: true } as any)
  return response.data
}

// ==================== 通知模块接口 ====================

export interface NotificationVO {
  id: string
  type: string
  title: string
  content: string | null
  relatedId: string | null
  relatedType: string | null
  feedbackId: string | null
  videoId: string | null
  targetPath: string | null
  isRead: boolean
  gmtCreated: string
}

/** 获取通知列表 */
export const getNotificationList = async (page: number = 1, size: number = 20): Promise<ApiResponse<PageResult<NotificationVO>>> => {
  const response = await api.get<ApiResponse<PageResult<NotificationVO>>>('/api/notification/list', { params: { page, size } })
  return response.data
}

/** 获取未读通知数量 */
export const getUnreadNotificationCount = async (): Promise<ApiResponse<number>> => {
  const response = await api.get<ApiResponse<number>>('/api/notification/unread-count')
  return response.data
}

/** 标记单条通知已读 */
export const markNotificationRead = async (id: string): Promise<ApiResponse<void>> => {
  const response = await api.put<ApiResponse<void>>(`/api/notification/${id}/read`)
  return response.data
}

/** 全部标记已读 */
export const markAllNotificationsRead = async (): Promise<ApiResponse<void>> => {
  const response = await api.put<ApiResponse<void>>('/api/notification/read-all')
  return response.data
}

/** 按上下文标记通知已读 */
export const markNotificationsReadByContext = async (payload: {
  relatedType?: string
  feedbackId?: string
  videoId?: string
  targetPath?: string
}): Promise<ApiResponse<void>> => {
  const response = await api.put<ApiResponse<void>>('/api/notification/read-context', payload)
  return response.data
}
