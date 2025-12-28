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

