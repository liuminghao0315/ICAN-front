import axios from 'axios'
import type { AxiosInstance, AxiosResponse } from 'axios'

// 响应数据接口
export interface ApiResponse<T = any> {
  code: number
  message: string | null
  data: T
}

// 创建axios实例
const api: AxiosInstance = axios.create({
  baseURL: 'http://localhost:8080',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
})

// 请求拦截器 - 自动添加Token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token')
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
      localStorage.removeItem('token')
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

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

// =============================================
// 视频相关接口
// =============================================

// 视频信息
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

// 分片上传响应
export interface ChunkUploadResponse {
  needUpload: boolean
  uploadedChunks: number[]
  finished: boolean
  videoId: string | null
  videoUrl: string | null
  message: string
}

// 分页响应
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
    timeout: 60000 // 分片上传超时时间设长一些
  })
  return response.data
}

// 简单上传视频
export const uploadVideoSimple = async (formData: FormData): Promise<ApiResponse<VideoInfo>> => {
  const response = await api.post<ApiResponse<VideoInfo>>('/api/video/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
    timeout: 300000 // 5分钟超时
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

// =============================================
// 统计相关接口
// =============================================

// 上传趋势数据项
export interface UploadTrendItem {
  date: string
  displayDate: string
  count: number
  size: number
}

// 获取上传趋势
export const getUploadTrend = async (days: number = 7): Promise<ApiResponse<UploadTrendItem[]>> => {
  const response = await api.get<ApiResponse<UploadTrendItem[]>>('/api/statistics/upload-trend', {
    params: { days }
  })
  return response.data
}

// 获取总体统计
export const getTotalStats = async (): Promise<ApiResponse<{
  totalUploadCount: number
  totalUploadSize: number
}>> => {
  const response = await api.get<ApiResponse<{
    totalUploadCount: number
    totalUploadSize: number
  }>>('/api/statistics/total')
  return response.data
}

