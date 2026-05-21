/*
 * SynSight - 高校内容风险分析平台
 * Copyright (c) 2026 Liu Minghao. All rights reserved.
 */

/**
 * 应用配置文件
 * 替代 .env 文件，所有配置集中管理
 */

/**
 * C20：解析 API 基础地址
 * 优先级：环境变量 VITE_API_BASE_URL > 开发默认 (localhost:8080) > 生产默认 (相对路径，由 nginx 反代)
 *
 * 生产构建不再把 'http://localhost:8080' 字面量打进 dist，
 * 而是返回空串让 axios 使用相对路径（同源），由 nginx 通过 location /api/ proxy_pass 转发。
 */
function resolveApiBaseUrl(): string {
  const envValue = import.meta.env.VITE_API_BASE_URL
  if (typeof envValue === 'string') return envValue
  return import.meta.env.DEV ? 'http://localhost:8080' : ''
}

/**
 * C20：解析 WebSocket 基础地址
 * 优先级：环境变量 VITE_WS_BASE_URL > 开发默认 (ws://localhost:8080) > 生产默认 (按 window.location 推导)
 */
function resolveWsBaseUrl(): string {
  const envValue = import.meta.env.VITE_WS_BASE_URL
  if (typeof envValue === 'string') return envValue
  if (import.meta.env.DEV) return 'ws://localhost:8080'
  if (typeof window !== 'undefined' && window.location) {
    const proto = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
    return `${proto}//${window.location.host}`
  }
  return ''
}

export const config = {
  /**
   * API 基础地址
   * 开发环境：默认 'http://localhost:8080'，可通过 VITE_API_BASE_URL 覆盖
   * 生产环境：默认相对路径 ''（由 nginx 反代到后端），可通过 VITE_API_BASE_URL 覆盖
   */
  apiBaseUrl: resolveApiBaseUrl(),

  /**
   * WebSocket 基础地址
   * 开发环境：默认 'ws://localhost:8080'，可通过 VITE_WS_BASE_URL 覆盖
   * 生产环境：默认按 window.location 推导（同源 ws/wss），可通过 VITE_WS_BASE_URL 覆盖
   */
  wsBaseUrl: resolveWsBaseUrl(),

  /**
   * Mock 模式开关
   * true: 启用 mock 数据，跳过 token 校验
   * false: 使用真实后端接口
   */
  mockMode: false,

  /**
   * 请求超时时间（毫秒）
   */
  timeout: 30000,

  /**
   * Token 刷新提前时间（毫秒）
   * 在 accessToken 过期前多久主动刷新
   */
  proactiveRefreshBeforeMs: 5 * 60 * 1000,

  /**
   * WebSocket 配置
   */
  websocket: {
    /** 最大重连次数 */
    maxReconnect: 5,
    /** 重连间隔（毫秒） */
    reconnectInterval: 3000,
    /** 心跳间隔（毫秒） */
    heartbeatInterval: 30000,
  },
} as const

export default config
