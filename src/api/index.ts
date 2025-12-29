import axios from 'axios'
import type { AxiosInstance, AxiosResponse } from 'axios'
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
  TaskStatus,
  RiskLevel
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
  baseURL: 'http://localhost:8080',
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

// 响应拦截器 - 统一处理错误
api.interceptors.response.use(
  (response: AxiosResponse<ApiResponse>) => {
    return response
  },
  (error) => {
    if (error.response?.status === 401) {
      // Token过期，清除并跳转到登录页
      localStorage.removeItem('user-store')
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

// ==================== 用户认证接口 ====================

// 登录接口
export interface LoginParams {
  username: string
  password: string
}

export const login = async (params: LoginParams): Promise<ApiResponse<string>> => {
  const response = await api.post<ApiResponse<string>>('/auth/login', params)
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
  username: string
}

export const sendResetPwdCode = async (params: SendResetPwdCodeParams): Promise<ApiResponse<string>> => {
  const response = await api.get<ApiResponse<string>>('/account/sendMailToResetPwd', { params })
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

// 上传分片
export const uploadChunk = async (formData: FormData): Promise<ApiResponse<ChunkUploadResponse>> => {
  const response = await api.post<ApiResponse<ChunkUploadResponse>>('/api/video/upload-chunk', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
    timeout: 60000
  })
  return response.data
}

// 简单上传视频
export const uploadVideoSimple = async (formData: FormData): Promise<ApiResponse<VideoInfo>> => {
  const response = await api.post<ApiResponse<VideoInfo>>('/api/video/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
    timeout: 300000
  })
  return response.data
}

// 获取视频详情
export const getVideoById = async (videoId: string): Promise<ApiResponse<VideoInfo>> => {
  const response = await api.get<ApiResponse<VideoInfo>>(`/api/video/${videoId}`)
  return response.data
}

// 获取视频列表
export const getVideoList = async (
  page: number = 1,
  size: number = 10
): Promise<ApiResponse<PageResponse<VideoInfo>>> => {
  const response = await api.get<ApiResponse<PageResponse<VideoInfo>>>('/api/video/list', {
    params: { page, size }
  })
  return response.data
}

// 删除视频
export const deleteVideo = async (videoId: string): Promise<ApiResponse<void>> => {
  const response = await api.delete<ApiResponse<void>>(`/api/video/${videoId}`)
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
  status?: TaskStatus
): Promise<ApiResponse<PageResult<AnalysisTaskVO>>> => {
  const params: Record<string, any> = { page, size }
  if (status) {
    params.status = status
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
export const getResultById = async (resultId: string): Promise<ApiResponse<AnalysisResultVO>> => {
  const response = await api.get<ApiResponse<AnalysisResultVO>>(`/api/analysis/result/${resultId}`)
  return response.data
}

// 根据任务ID获取分析结果
export const getResultByTaskId = async (taskId: string): Promise<ApiResponse<AnalysisResultVO | null>> => {
  const response = await api.get<ApiResponse<AnalysisResultVO | null>>(`/api/analysis/result/task/${taskId}`)
  return response.data
}

// 根据视频ID获取最新分析结果
export const getResultByVideoId = async (videoId: string): Promise<ApiResponse<AnalysisResultVO | null>> => {
  const response = await api.get<ApiResponse<AnalysisResultVO | null>>(`/api/analysis/result/video/${videoId}`)
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
  RiskLevel
}
