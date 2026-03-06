/**
 * 应用配置文件
 * 替代 .env 文件，所有配置集中管理
 */

export const config = {
  /**
   * API 基础地址
   * 开发环境：填写你的本地后端地址，例如 'http://localhost:8080'
   * 生产环境：填写你的线上后端地址，例如 'https://api.yourdomain.com'
   */
  apiBaseUrl: 'http://localhost:8080',

  /**
   * WebSocket 基础地址
   * 开发环境：填写你的本地 WebSocket 地址，例如 'ws://localhost:8080'
   * 生产环境：填写你的线上 WebSocket 地址，例如 'wss://api.yourdomain.com'
   */
  wsBaseUrl: 'ws://localhost:8080',

  /**
   * DeepSeek API 配置
   * 用于风险词库的 AI 智能生成功能
   * 获取方式：访问 https://platform.deepseek.com/ 注册并获取 API Key
   */
  deepseek: {
    /** DeepSeek API Key - 必填 */
    apiKey: 'sk-510f09778e48403283036126240de79d',
    /** DeepSeek API 地址 */
    apiUrl: 'https://api.deepseek.com/chat/completions',
    /** DeepSeek 模型名称 */
    model: 'deepseek-chat',
  },

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
