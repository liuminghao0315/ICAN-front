/**
 * 高校内容创作者行为分析平台 - 前端TypeScript类型定义
 */

// ==================== 基础类型 ====================

/**
 * 统一响应格式
 */
export interface Result<T = any> {
  code: number
  message: string | null
  data: T
}

/**
 * 分页响应格式
 */
export interface PageResult<T> {
  records: T[]
  total: number
  size: number
  current: number
  pages: number
}

// ==================== 用户模块 ====================

/**
 * 登录请求
 */
export interface LoginDTO {
  username: string
  password: string
}

/**
 * 注册请求
 */
export interface RegisterDTO {
  username: string
  password: string
  email: string
  verifyCode: string
}

/**
 * 用户信息
 */
export interface UserInfo {
  id: string
  username: string
  email?: string
}

// ==================== 视频模块 ====================

/**
 * 视频状态枚举
 */
export type VideoStatus = 'UPLOADED' | 'ANALYZING' | 'COMPLETED' | 'FAILED'

/**
 * 视频信息
 */
export interface VideoVO {
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
  status: VideoStatus
  gmtCreated: string
}

/**
 * 分片上传检查响应
 */
export interface ChunkCheckResult {
  needUpload: boolean
  uploadedChunks: number[]
  finished: boolean
  videoId?: string
  videoUrl?: string
  message: string
}

// ==================== 分析任务模块 ====================

/**
 * 任务类型枚举
 */
export type TaskType = 'FULL_ANALYSIS' | 'VIDEO_ONLY' | 'AUDIO_ONLY' | 'TEXT_ONLY'

/**
 * 任务状态枚举
 */
export type TaskStatus = 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED' | 'CANCELLED'

/**
 * 创建分析任务请求
 */
export interface AnalysisTaskDTO {
  videoId: string
  taskType?: TaskType
  forceRestart?: boolean
}

/**
 * 分析任务信息
 */
export interface AnalysisTaskVO {
  id: string
  videoId: string
  videoTitle: string
  videoUrl: string
  taskType: TaskType
  taskTypeDesc?: string
  status: TaskStatus
  statusDesc?: string
  progress: number
  errorMessage: string | null
  startedAt: string | null
  completedAt: string | null
  gmtCreated: string
  hasResult: boolean
  resultId: string | null
  // 分析结果摘要信息（已完成任务显示）
  riskScore?: number | null
  riskLevel?: RiskLevel | null
  sentimentLabel?: SentimentLabel | null
  videoDuration?: number | null
}

// ==================== 分析结果模块 ====================

/**
 * 风险等级枚举
 */
export type RiskLevel = 'LOW' | 'MEDIUM' | 'HIGH'

/**
 * 情感标签枚举
 */
export type SentimentLabel = 'POSITIVE' | 'NEUTRAL' | 'NEGATIVE'

/**
 * 视频来源枚举
 */
export type VideoSource = 'local_upload' | 'web_crawl'

/**
 * 传播数据类型枚举
 */
export type SpreadDataType = 'predicted' | 'real'

/**
 * 传播风险等级
 */
export type SpreadRiskLevel = 'low' | 'medium' | 'high'

/**
 * 预测数据（V1.0本地上传场景）
 */
export interface PredictedSpreadData {
  potentialRisk: SpreadRiskLevel              // 潜在传播风险
  targetAudience: string[]                     // 目标受众预测（基于内容特征）
  estimatedImpactLevel: SpreadRiskLevel        // 预估影响力等级
  contentAppealScore: number                   // 内容吸引力评分（0-100）
  riskIfPublished: string                      // 如果发布后的风险说明
}

/**
 * 真实数据（V2.0网络爬取场景）
 */
export interface RealSpreadData {
  platformName: string           // 平台名称（抖音、B站、小红书）
  videoUrl: string               // 原始视频链接
  publishTime: string            // 发布时间
  authorId: string               // 作者ID
  authorName: string             // 作者昵称
  authorFollowers: number        // 作者粉丝数
  
  // 传播数据
  viewCount: number              // 播放量
  likeCount: number              // 点赞数
  commentCount: number           // 评论数
  shareCount: number             // 分享数
  collectCount: number           // 收藏数
  
  // 受众数据（如果平台提供）
  audienceData?: {
    ageDistribution?: Record<string, number>
    genderRatio?: { male: number, female: number }
    regionDistribution?: Record<string, number>
  }
}

/**
 * 传播分析数据
 */
export interface SpreadAnalysis {
  dataType: SpreadDataType       // 数据类型：predicted（预测）| real（真实）
  predictedData?: PredictedSpreadData  // V1.0预测数据
  realData?: RealSpreadData            // V2.0真实数据
}

/**
 * 视频特征
 */
export interface VideoFeatures {
  duration: number
  width: number
  height: number
  fps: number
  sceneType: string
  sceneConfidence: number
  faceCount: number
  hasPerson: boolean
  qualityScore: number
  brightness: number
  clarity: number
  riskTimeline?: Array<{timestamp: number, type: string, level: string, description: string}>
}

/**
 * 音频特征
 */
export interface AudioFeatures {
  hasAudio: boolean
  audioQuality: number
  speechRatio: number
  musicRatio: number
  noiseLevel: number
  volumeLevel: number
  emotionInVoice: string
}

/**
 * 文本特征
 */
export interface TextFeatures {
  titleLength: number
  hasDescription: boolean
  descriptionLength: number
  titleSentiment: number
  containsKeywords: boolean
  languageConfidence: number
  wordCloud?: Array<{name: string, value: number}>
  sensitiveWords?: Array<{word: string, category: string}>
}

/**
 * 受众分析
 */
export interface AudienceAnalysis {
  ageDistribution: {
    '18-24': number
    '25-34': number
    '35-44': number
    '45+': number
  }
  predictedInterests: string[]
  predictedViews: number
  predictedEngagement: number
}

/**
 * 分析结果信息
 */
export interface AnalysisResultVO {
  id: string
  taskId: string
  videoId: string
  videoTitle: string
  videoDescription: string | null
  videoUrl: string
  
  // 风险评估
  riskScore: number
  riskLevel: RiskLevel
  riskLevelDesc: string
  
  // 高校识别
  isUniversityRelated: boolean
  universityName: string | null
  universityConfidence: number | null
  
  // 主题分析
  topicCategory: string
  topicKeywords: string[]
  
  // 情感分析
  sentimentScore: number
  sentimentLabel: SentimentLabel
  sentimentLabelDesc: string
  
  // 多模态特征
  videoFeatures: VideoFeatures
  audioFeatures: AudioFeatures
  transcription: string
  textFeatures: TextFeatures
  
  // 🔑 新增：视频来源标识
  videoSource: VideoSource
  
  // 🔑 新增：传播分析数据（可选）
  spreadAnalysis?: SpreadAnalysis | null
  
  // ⚠️ 保留旧字段（向后兼容，但在V2.0中会被spreadAnalysis替代）
  audienceAnalysis: AudienceAnalysis
  spreadPotential: number
  
  gmtCreated: string
}

/**
 * 分析统计数据
 */
export interface AnalysisStats {
  totalVideos: number
  analyzedVideos: number
  totalResults: number
  avgRiskScore: number
  averageRiskScore: number  // 兼容字段
  highRiskCount: number
  mediumRiskCount: number
  lowRiskCount: number
  universityRelatedCount: number
  positiveSentimentCount: number
  negativeSentimentCount: number
  neutralSentimentCount: number
  analysisCount: number  // 累计分析次数（只增不减）
}

/**
 * 风险分布
 */
export interface RiskDistribution {
  HIGH: number
  MEDIUM: number
  LOW: number
  highRiskCount: number
  mediumRiskCount: number
  lowRiskCount: number
}

// ==================== 统计模块 ====================

/**
 * 上传趋势数据点
 */
export interface UploadTrendItem {
  date: string
  displayDate?: string
  count: number
  totalSize?: number
  size?: number
}

/**
 * 总体统计数据
 */
export interface TotalStats {
  totalUploadCount: number
  totalUploadSize: number
  todayUploadCount?: number
  todayUploadSize?: number
}

// ==================== WebSocket消息 ====================

/**
 * WebSocket消息类型
 */
export type WSMessageType = 'connected' | 'task_progress' | 'task_completed' | 'task_failed' | 'pong'

/**
 * WebSocket基础消息
 */
export interface WSMessage<T = any> {
  type: WSMessageType
  message: string
  timestamp: number
  data?: T
}

/**
 * 任务进度消息数据
 */
export interface TaskProgressData {
  taskId: string
  videoId: string
  status: TaskStatus
  progress: number
  message: string
  moduleType?: string  // 模块类型：audio/video/text/integration
  resultData?: any     // 该模块的分析结果数据
}

/**
 * 受众年龄分布数据（整合分析结果）
 */
export interface AgeDistribution {
  '0-18': number
  '19-35': number
  '36-50': number
  '51+': number
}

/**
 * 整合分析结果数据
 */
export interface IntegrationResult {
  ageDistribution: AgeDistribution
  analysisTimestamp: number
}

/**
 * 任务完成消息数据
 */
export interface TaskCompletedData {
  taskId: string
  videoId: string
  resultId: string
}

/**
 * 任务失败消息数据
 */
export interface TaskFailedData {
  taskId: string
  videoId: string
  errorMessage: string
}

// ==================== 常量映射 ====================

/**
 * 风险等级颜色映射
 */
export const RISK_LEVEL_COLORS: Record<RiskLevel, string> = {
  LOW: '#52c41a',
  MEDIUM: '#faad14',
  HIGH: '#f56c6c'
}

/**
 * 风险等级中文映射
 */
export const RISK_LEVEL_TEXT: Record<RiskLevel, string> = {
  LOW: '低风险',
  MEDIUM: '中风险',
  HIGH: '高风险'
}

/**
 * 任务状态颜色映射
 */
export const TASK_STATUS_COLORS: Record<TaskStatus, string> = {
  PENDING: '#1890ff',
  PROCESSING: '#faad14',
  COMPLETED: '#52c41a',
  FAILED: '#f56c6c',
  CANCELLED: '#909399'
}

/**
 * 任务状态中文映射
 */
export const TASK_STATUS_TEXT: Record<TaskStatus, string> = {
  PENDING: '排队中',
  PROCESSING: '处理中',
  COMPLETED: '已完成',
  FAILED: '失败',
  CANCELLED: '已取消'
}

/**
 * 情感标签颜色映射
 */
export const SENTIMENT_COLORS: Record<SentimentLabel, string> = {
  POSITIVE: '#52c41a',
  NEUTRAL: '#1890ff',
  NEGATIVE: '#f56c6c'
}

/**
 * 情感标签中文映射
 */
export const SENTIMENT_TEXT: Record<SentimentLabel, string> = {
  POSITIVE: '正面',
  NEUTRAL: '中性',
  NEGATIVE: '负面'
}

/**
 * 视频状态中文映射
 */
export const VIDEO_STATUS_TEXT: Record<VideoStatus, string> = {
  UPLOADED: '已上传',
  ANALYZING: '分析中',
  COMPLETED: '已完成',
  FAILED: '分析失败'
}

/**
 * 任务类型中文映射
 */
export const TASK_TYPE_TEXT: Record<TaskType, string> = {
  FULL_ANALYSIS: '完整分析',
  VIDEO_ONLY: '仅视频分析',
  AUDIO_ONLY: '仅音频分析',
  TEXT_ONLY: '仅文本分析'
}

/**
 * 传播风险等级中文映射
 */
export const SPREAD_RISK_TEXT: Record<SpreadRiskLevel, string> = {
  low: '低风险',
  medium: '中等风险',
  high: '高风险'
}

/**
 * 视频来源中文映射
 */
export const VIDEO_SOURCE_TEXT: Record<VideoSource, string> = {
  local_upload: '本地上传',
  web_crawl: '网络爬取'
}

// ==================== 工具函数 ====================

/**
 * 文件大小格式化
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

/**
 * 时长格式化（秒转为 mm:ss 或 hh:mm:ss）
 */
export function formatDuration(seconds: number): string {
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  const s = Math.floor(seconds % 60)
  if (h > 0) {
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
  }
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
}

/**
 * 日期格式化
 */
export function formatDate(dateStr: string): string {
  const date = new Date(dateStr)
  return date.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  })
}

/**
 * 风险评分格式化（0-1 转为 百分比）
 */
export function formatRiskScore(score: number): string {
  return `${(score * 100).toFixed(1)}%`
}

/**
 * 情感评分格式化（-1到1 转为 描述）
 */
export function formatSentimentScore(score: number): string {
  if (score >= 0.3) return `正面 (${(score * 100).toFixed(0)}%)`
  if (score <= -0.3) return `负面 (${(Math.abs(score) * 100).toFixed(0)}%)`
  return `中性`
}

