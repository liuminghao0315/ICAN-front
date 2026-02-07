/**
 * 统一的分析结果Mock数据
 * 
 * 这个文件模拟Python后端返回的完整视频分析结果数据
 * 包含所有交互分析和报告视图需要的数据
 * 
 * 重要：这是整个分析页面的核心数据源！
 * 修改时请务必保持数据一致性！
 */

// ==================== 类型定义 ====================

/**
 * 证据类型定义
 */
export interface Evidence {
  timestamp: number         // 时间点（秒）
  type: 'video' | 'audio' | 'text'  // 证据类型
  description: string      // 描述
  confidence: number       // 置信度 0-100
  keyword?: string         // 文本证据的关键词
  sentimentScore?: number  // 情感分数 0-100（态度分析专用，前端根据区间判断：<33.3正面，>66.7负面）
}

/**
 * 多模态融合数据结构
 * 注：仅用于加权融合分类（identity, university, topic, opinionRisk, action）
 * 统计分类（attitude）不使用此结构
 */
export interface ModalityFusion {
  videoScore: number           // 视频模态得分 0-100（Python给出）
  audioScore: number           // 音频模态得分 0-100（Python给出）
  textScore: number            // 文本模态得分 0-100（Python给出）
  videoContribution: number    // 视频模态贡献度（Python给出）
  audioContribution: number    // 音频模态贡献度（Python给出）
  textContribution: number     // 文本模态贡献度（Python给出）
  finalScore: number           // 最终融合得分 0-100（Python给出）
}


/**
 * 视频风险点（基于索引的时间序列数据）
 */
export interface VideoRiskPoint {
  reason: string        // 风险原因
  intensity: number     // 风险强度 0-1（前端根据区间判断：<0.333低风险，>0.667高风险）
}

/**
 * 文本风险点（基于索引的时间序列数据）
 */
export interface TextRiskPoint {
  reason: string        // 风险原因
  intensity: number     // 风险强度 0-1（前端根据区间判断：<0.333低风险，>0.667高风险）
}

/**
 * 综合风险点（基于索引的时间序列数据）
 */
export interface ComprehensiveRiskPoint {
  intensity: number     // 风险强度 0-1（三个模态的最大值，前端根据区间判断：<0.333低风险，>0.667高风险）
}

/**
 * 音频情绪片段（基于索引的时间序列数据）
 */
export interface AudioEmotion {
  intensity: number     // 强度 0-1
  reason: string        // 检测原因
}

/**
 * 雷达图时间段数据（索引对应时间段，类似 videoRisks）
 */
export interface RadarDataByTime {
  data: number[]        // 6个维度的数据 [身份置信度, 学校关联度, 负面情感度, 传播风险, 影响范围, 处置紧迫度]
}

/**
 * 【全模态智能事件流】核心接口
 * 
 * 唯一证据数据库，彻底解决"哑剧漏洞"
 * 统一管理所有时间轴事件，驱动视频检测框显示
 */

/**
 * 事件卡片模态类型
 */
export type EventModalityType = 'speech' | 'visual' | 'audio-effect'

/**
 * 时间轴事件基础接口
 */
export interface TimelineEventBase {
  id: string
  modality: EventModalityType        // 模态类型：语音/视觉/声学
  startTime: number                  // 开始时间（秒）
  endTime: number                    // 结束时间（秒）
  riskScore: number                  // 风险分数 0-100（<33.3低风险，>66.7高风险，否则中风险）
}

/**
 * 语音事件卡片（Speech）
 * 包含台词、情绪、风险评估
 */
export interface SpeechEvent extends TimelineEventBase {
  modality: 'speech'
  transcript: string                 // 语音转文字内容
  keywords: string[]                 // 敏感关键词
  emotion: {
    label: string                    // 情绪标签
    intensity: number                // 情绪强度 0-1
    bgColor: string
    textColor: string
  }
  confidence: number                 // 识别置信度 0-100
}

/**
 * 视觉事件卡片（Visual）
 * 记录无语音但有画面风险的时刻
 */
export interface VisualEvent extends TimelineEventBase {
  modality: 'visual'
  detectionType: 'face' | 'ocr' | 'logo' | 'uniform' | 'banner' | 'object' | 'gesture'
  detectionLabel: string             // 检测结论（如：检测到校徽、敏感手势）
  boundingBox?: {                    // CV检测框坐标（如果有）
    x: number                        // 百分比 0-100
    y: number
    width: number
    height: number
  }
  confidence: number                 // 检测置信度 0-100
  metadata?: Record<string, any>     // 扩展元数据
}

/**
 * 声学事件卡片（Audio Effect）
 * 非语言声音异响
 */
export interface AudioEffectEvent extends TimelineEventBase {
  modality: 'audio-effect'
  description: string                // 声音描述
  intensity: number                  // 声音强度 0-1
  confidence: number                 // 检测置信度 0-100
}

/**
 * 联合类型：所有事件卡片
 */
export type TimelineEvent = SpeechEvent | VisualEvent | AudioEffectEvent

/**
 * 检测到的关键词（带高亮标记）
 */
export interface DetectedKeyword {
  word: string                    // 关键词文本
  isUniversityRelated: boolean   // 是否高校相关（由Python后端判断）
}

/**
 * 场景识别数据
 */
export interface SceneInfo {
  id: string
  name: string
  icon: string
  confidence: number
  timeStart: number
  timeEnd: number
}

/**
 * 视频主要人物特征
 */
export interface MainCharacter {
  gender?: string          // 性别（可选）
  ageRange?: string        // 年龄范围（可选）
  voiceProfile?: string    // 声音特征（可选）
  clothing?: string        // 着装（可选）
}

/**
 * 视频基本信息
 */
export interface VideoInfo {
  videoId: string                       // 视频ID
  videoUrl: string                      // 视频播放地址（Python后端提供）
  fileName: string                      // 文件名
  duration: number                      // 时长（秒）
  uploadSource: string                  // 来源
  description?: string                  // AI自动生成的视频内容摘要（可选）
  detectedKeywords?: DetectedKeyword[]  // 检测到的关键词（可选）
  mainCharacter?: MainCharacter         // 视频主要人物特征（可选）
}

/**
 * 身份判定分析结果
 */
export interface IdentityAnalysis {
  identityLabel: string     // 显示标签
  evidences: Evidence[]     // 详细证据列表
  modalityFusion: ModalityFusion  // 多模态融合分析
}

/**
 * 高校关联分析结果
 */
export interface UniversityAnalysis {
  universityName: string    // 高校名称
  evidences: Evidence[]     // 详细证据列表
  modalityFusion: ModalityFusion  // 多模态融合分析
}

/**
 * 内容主题分析结果
 */
export interface TopicAnalysis {
  topicCategory: string         // 主题大类
  topicSubCategory: string      // 主题细分
  evidences: Evidence[]         // 详细证据列表
  modalityFusion: ModalityFusion  // 多模态融合分析
}

/**
 * 对学校态度分析结果（统计分类）
 */
export interface AttitudeAnalysis {
  evidences: Evidence[]         // 详细证据列表（前端统计情感分布，根据sentimentScore计算）
}

/**
 * 潜在舆论风险分析结果
 */
export interface OpinionRiskAnalysis {
  riskReason: string            // 风险原因
  evidences: Evidence[]         // 详细证据列表
  modalityFusion: ModalityFusion  // 多模态融合分析（前端根据finalScore计算风险等级：<33.3低风险，>66.7高风险）
}

/**
 * 处置建议分析结果
 */
export interface ActionSuggestion {
  actionSuggestion: string      // 建议
  actionDetail: string          // 详细说明
  evidences: Evidence[]         // 详细证据列表
  modalityFusion: ModalityFusion  // 多模态融合分析
}

/**
 * 完整的视频分析结果（模拟Python后端返回）
 */
export interface AnalysisResult {
  // 视频基本信息
  videoInfo: VideoInfo
  
  // 核心分析结果（6个维度，每个维度包含自己的证据和融合数据）
  identity: IdentityAnalysis
  university: UniversityAnalysis
  topic: TopicAnalysis
  attitude: AttitudeAnalysis
  opinionRisk: OpinionRiskAnalysis
  action: ActionSuggestion
  
  // 时间轴数据
  timelineData: {
    timeGranularity: number               // 时间粒度（秒），表示数组元素之间的时间间隔
    videoRisks: VideoRiskPoint[]          // 视频风险点（索引即时间段）
    audioEmotions: AudioEmotion[]         // 音频情绪（索引即时间段）
    textRisks: TextRiskPoint[]            // 文本风险点（索引即时间段）
    comprehensiveRisks: ComprehensiveRiskPoint[]  // 综合风险点（索引即时间段）
    radarByTime: RadarDataByTime[]        // 雷达图时间段数据（实时动态）
    averageRadarData: number[]            // 全片平均雷达数据（6个维度的平均值，用于底层参考线）
  }
  
  // 【全模态智能事件流】唯一证据数据库
  timelineEvents: TimelineEvent[]     // 按时间排序的事件流，驱动右侧列表和检测框
  
  // 场景识别
  sceneRecognition: SceneInfo[]
}

// ==================== Mock数据（模拟Python后端返回的完整分析结果） ====================

export const mockAnalysisResult: AnalysisResult = {
  // ========== 1. 视频基本信息 ==========
  videoInfo: {
    videoId: 'video_20240201_001',
    videoUrl: 'http://47.110.33.16:9000/ican-videos/videos/2026/02/06/1329d3084a9448bb9e211c2245aeffa1.mp4?X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Credential=minioadmin%2F20260206%2Fus-east-1%2Fs3%2Faws4_request&X-Amz-Date=20260206T192651Z&X-Amz-Expires=604800&X-Amz-SignedHeaders=host&X-Amz-Signature=107ffdf57a21829d6930d2392ccea41c3c5eb288f73289b7260814ed58ca7548', // 视频地址（由Python后端提供）
    fileName: '北大学生吐槽选课系统_20240201.mp4',
    duration: 50, // 50秒
    uploadSource: '本地上传',
    description: '自称北京大学计算机系学生，吐槽学校选课系统经常崩溃、热门课抢不到等问题，情绪较为激动，若上传到公开平台可能引发其他学生共鸣转发。',
    
    // 检测到的关键词
    detectedKeywords: [
      { word: '北大', isUniversityRelated: true },
      { word: '北京大学', isUniversityRelated: true },
      { word: '计算机系', isUniversityRelated: true },
      { word: '我们学校', isUniversityRelated: true },
      { word: '选课系统', isUniversityRelated: true },
      { word: '教务处', isUniversityRelated: true },
      { word: '失望', isUniversityRelated: false },
      { word: '不负责任', isUniversityRelated: false },
      { word: '热门课', isUniversityRelated: true },
      { word: '抢不到', isUniversityRelated: false }
    ],
    
    // 视频主要人物特征
    mainCharacter: {
      gender: '男性',
      ageRange: '20-24岁',
      voiceProfile: '年轻男性/情绪激动',
      clothing: '休闲装'
    }
  },

  // ========== 2. 身份判定分析 ==========
  identity: {
    identityLabel: '疑似在校学生',
    
    // 详细证据
    evidences: [
      {
        timestamp: 5,
        type: 'video',
        description: '宿舍环境背景：检测到典型学生宿舍布局（床铺、书桌、台灯）',
        confidence: 82
      },
      {
        timestamp: 12,
        type: 'audio',
        description: '语音识别：自称"我是北大计算机系学生"',
        confidence: 95
      },
      {
        timestamp: 18,
        type: 'audio',
        description: '年轻人语速和语气：快速口语、使用学生群体常用语',
        confidence: 88
      },
      {
        timestamp: 28,
        type: 'video',
        description: '穿着打扮：休闲装，符合在校学生特征',
        confidence: 78
      },
      {
        timestamp: 35,
        type: 'text',
        description: '提及学生身份相关词汇',
        confidence: 91,
        keyword: '我们学生'
      },
      {
        timestamp: 42,
        type: 'text',
        description: '学生群体用语',
        confidence: 85,
        keyword: '同学们'
      }
    ],
    
    // 多模态融合分析
    modalityFusion: {
      videoScore: 82,
      audioScore: 91,
      textScore: 85,
      videoContribution: 25.5,
      audioContribution: 45.5,
      textContribution: 17.0,
      finalScore: 88
    }
  },

  // ========== 3. 涉及高校分析 ==========
  university: {
    universityName: '北京大学',
    
    // 详细证据
    evidences: [
      {
        timestamp: 5,
        type: 'video',
        description: '场景识别：检测到北京大学校园标识性建筑',
        confidence: 90
      },
      {
        timestamp: 12,
        type: 'audio',
        description: '明确提及"北京大学"',
        confidence: 98
      },
      {
        timestamp: 18,
        type: 'audio',
        description: '提及"北大"（北京大学简称）',
        confidence: 95
      },
      {
        timestamp: 24,
        type: 'text',
        description: '高频关键词',
        confidence: 92,
        keyword: '北京大学'
      },
      {
        timestamp: 30,
        type: 'text',
        description: '简称使用',
        confidence: 90,
        keyword: '北大'
      },
      {
        timestamp: 38,
        type: 'audio',
        description: '提及学校部门"教务处"',
        confidence: 87
      },
      {
        timestamp: 45,
        type: 'video',
        description: 'OCR识别：屏幕上显示学校选课系统界面',
        confidence: 85
      }
    ],
    
    // 多模态融合分析
    modalityFusion: {
      videoScore: 88,
      audioScore: 95,
      textScore: 92,
      videoContribution: 18.4,
      audioContribution: 38.0,
      textContribution: 36.8,
      finalScore: 93
    }
  },

  // ========== 4. 内容主题分析 ==========
  topic: {
    topicCategory: '校园政策',
    topicSubCategory: '选课制度吐槽',
    
    // 详细证据
    evidences: [
      {
        timestamp: 8,
        type: 'audio',
        description: '讨论"选课系统"相关话题',
        confidence: 95
      },
      {
        timestamp: 15,
        type: 'text',
        description: '主题关键词',
        confidence: 92,
        keyword: '选课系统'
      },
      {
        timestamp: 22,
        type: 'audio',
        description: '提及"系统崩溃"等技术问题',
        confidence: 88
      },
      {
        timestamp: 30,
        type: 'text',
        description: '政策相关词汇',
        confidence: 85,
        keyword: '选课制度'
      },
      {
        timestamp: 38,
        type: 'audio',
        description: '讨论"热门课抢不到"等政策性问题',
        confidence: 90
      },
      {
        timestamp: 46,
        type: 'text',
        description: '学校管理部门',
        confidence: 87,
        keyword: '教务处'
      }
    ],
    
    // 多模态融合分析
    modalityFusion: {
      videoScore: 85,
      audioScore: 92,
      textScore: 90,
      videoContribution: 17.8,
      audioContribution: 40.5,
      textContribution: 36.0,
      finalScore: 94
    }
  },

  // ========== 5. 对学校态度分析（统计分类）==========
  attitude: {
    // 详细证据（前端统计情感分布）
    evidences: [
      {
        timestamp: 5,
        type: 'video',
        description: '表情分析：检测到微笑表情',
        confidence: 88,
        sentimentScore: 15  // 正面（<33.3）
      },
      {
        timestamp: 15,
        type: 'audio',
        description: '语调分析：语气轻松愉快',
        confidence: 85,
        sentimentScore: 20  // 正面
      },
      {
        timestamp: 25,
        type: 'text',
        description: '正面情感词汇',
        confidence: 90,
        keyword: '喜欢',
        sentimentScore: 10  // 正面
      },
      {
        timestamp: 35,
        type: 'video',
        description: '表情分析：检测到愤怒、失望表情',
        confidence: 85,
        sentimentScore: 85  // 负面（>66.7）
      },
      {
        timestamp: 45,
        type: 'audio',
        description: '语调分析：声调提高，语速加快，情绪激动',
        confidence: 92,
        sentimentScore: 92  // 负面
      },
      {
        timestamp: 50,
        type: 'text',
        description: '负面情感词汇',
        confidence: 95,
        keyword: '失望',
        sentimentScore: 95  // 负面
      },
      {
        timestamp: 32,
        type: 'text',
        description: '批评性用语',
        confidence: 88,
        keyword: '不负责任',
        sentimentScore: 88  // 负面
      },
      {
        timestamp: 38,
        type: 'audio',
        description: '持续的不满情绪表达（但语气相对平静）',
        confidence: 90,
        sentimentScore: 50  // 中性（33.3-66.7）
      },
      {
        timestamp: 46,
        type: 'text',
        description: '客观描述问题',
        confidence: 87,
        keyword: '系统问题',
        sentimentScore: 45  // 中性
      }
    ]
  },

  // ========== 6. 潜在舆论风险分析 ==========
  opinionRisk: {
    riskReason: '可能引发跟风吐槽',
    
    // 详细证据
    evidences: [
      {
        timestamp: 20,
        type: 'audio',
        description: '情绪激动点：对学校的强烈批评',
        confidence: 88
      },
      {
        timestamp: 28,
        type: 'text',
        description: '可能引发共鸣的措辞',
        confidence: 85,
        keyword: '让人失望'
      },
      {
        timestamp: 35,
        type: 'audio',
        description: '呼吁性语句：可能引发跟风吐槽',
        confidence: 82
      },
      {
        timestamp: 42,
        type: 'text',
        description: '普遍性问题描述',
        confidence: 80,
        keyword: '大家都抢不到'
      },
      {
        timestamp: 48,
        type: 'audio',
        description: '希望传播：呼吁更多人看到此视频',
        confidence: 78
      }
    ],
    
    // 多模态融合分析
    modalityFusion: {
      videoScore: 55,
      audioScore: 62,
      textScore: 58,
      videoContribution: 11.6,
      audioContribution: 26.0,
      textContribution: 24.3,
      finalScore: 62
    }
  },

  // ========== 7. 处置建议 ==========
  action: {
    actionSuggestion: '谨慎发布',
    actionDetail: '建议人工复核后决定是否上传',
    
    // 详细证据
    evidences: [
      {
        timestamp: 20,
        type: 'audio',
        description: '高风险时段：情绪最激动的片段',
        confidence: 92
      },
      {
        timestamp: 28,
        type: 'text',
        description: '关键负面词汇出现',
        confidence: 88,
        keyword: '失望'
      },
      {
        timestamp: 35,
        type: 'video',
        description: '可能需要人工复核的关键画面',
        confidence: 85
      },
      {
        timestamp: 48,
        type: 'audio',
        description: '传播风险点：呼吁他人关注',
        confidence: 90
      }
    ],
    
    // 多模态融合分析
    modalityFusion: {
      videoScore: 70,
      audioScore: 80,
      textScore: 75,
      videoContribution: 24.5,
      audioContribution: 32.0,
      textContribution: 18.8,
      finalScore: 75
    }
  },

  // ========== 8. 时间轴数据 ==========
  timelineData: {
    timeGranularity: 5,  // 时间粒度：5秒

    // 11.1 视频风险点（10个元素，索引0-9对应0-5s, 5-10s, 10-15s, 15-20s, 20-25s, 25-30s, 30-35s, 35-40s, 40-45s, 45-50s）
    videoRisks: [
      {
        reason: '检测到学生宿舍场景，视频开场',
        intensity: 0.20
      },
      {
        reason: '背景环境稳定，无明显风险画面',
        intensity: 0.28
      },
      {
        reason: '正常陈述画面，表情平静',
        intensity: 0.32
      },
      {
        reason: '开始出现不满表情',
        intensity: 0.45
      },
      {
        reason: '检测到愤怒表情和激烈手势',
        intensity: 0.92
      },
      {
        reason: '持续激动状态，肢体动作幅度大',
        intensity: 0.88
      },
      {
        reason: '情绪仍较激动，但开始平复',
        intensity: 0.70
      },
      {
        reason: '持续的不满情绪表达',
        intensity: 0.65
      },
      {
        reason: 'OCR识别到学校选课系统界面截图',
        intensity: 0.55
      },
      {
        reason: '画面趋于平静，结束陈述',
        intensity: 0.38
      }
    ],

    // 11.2 音频情绪（10个元素，索引0-9对应0-5s, 5-10s, 10-15s, 15-20s, 20-25s, 25-30s, 30-35s, 35-40s, 40-45s, 45-50s）
    audioEmotions: [
      {
        intensity: 0.25,
        reason: '视频开场，无语音'
      },
      {
        intensity: 0.35,
        reason: '语音平稳，开始介绍'
      },
      {
        intensity: 0.42,
        reason: '语速正常，平静陈述'
      },
      {
        intensity: 0.58,
        reason: '语气开始严肃，表达不满'
      },
      {
        intensity: 0.95,
        reason: '检测到愤怒咆哮，音量突然增大'
      },
      {
        intensity: 0.85,
        reason: '持续愤怒情绪，语速加快'
      },
      {
        intensity: 0.72,
        reason: '语气紧张激动，音调升高'
      },
      {
        intensity: 0.68,
        reason: '情绪仍然紧张，但略有缓和'
      },
      {
        intensity: 0.52,
        reason: '情绪逐渐平复，语气严肃'
      },
      {
        intensity: 0.40,
        reason: '趋于平静，结束陈述'
      }
    ],

    // 11.3 文本风险点（10个元素，索引0-9对应0-5s, 5-10s, 10-15s, 15-20s, 20-25s, 25-30s, 30-35s, 35-40s, 40-45s, 45-50s）
    textRisks: [
      {
        reason: '开场无语音，无文本风险',
        intensity: 0.15
      },
      {
        reason: '平静介绍，正常陈述',
        intensity: 0.22
      },
      {
        reason: '提及学生身份，陈述基本信息',
        intensity: 0.30
      },
      {
        reason: '开始表达不满，涉及系统问题',
        intensity: 0.55
      },
      {
        reason: '情绪激烈，使用极端词汇批评学校',
        intensity: 1.0
      },
      {
        reason: '持续批评，出现煽动性词汇',
        intensity: 0.92
      },
      {
        reason: '表达不满，可能引发共鸣',
        intensity: 0.68
      },
      {
        reason: '持续表达不满情绪',
        intensity: 0.62
      },
      {
        reason: '呼吁传播，有一定传播风险',
        intensity: 0.50
      },
      {
        reason: '总结陈述，情绪平复',
        intensity: 0.35
      }
    ],

    // 11.4 综合风险点（10个元素，索引0-9对应0-5s, 5-10s, 10-15s, 15-20s, 20-25s, 25-30s, 30-35s, 35-40s, 40-45s, 45-50s）
    comprehensiveRisks: [
      { intensity: 0.25 },
      { intensity: 0.35 },
      { intensity: 0.42 },
      { intensity: 0.58 },
      { intensity: 1.0 },
      { intensity: 0.92 },
      { intensity: 0.72 },
      { intensity: 0.68 },
      { intensity: 0.55 },
      { intensity: 0.40 }
    ],

    // 11.5 雷达图时间段数据（10个元素，索引0-9对应0-5s, 5-10s, 10-15s, 15-20s, 20-25s, 25-30s, 30-35s, 35-40s, 40-45s, 45-50s）
    // 6个维度：[身份置信度, 学校关联度, 负面情感度, 传播风险, 影响范围, 处置紧迫度]
    radarByTime: [
      { data: [82, 60, 12, 15, 20, 12] },   // 0-5s: 开场，低风险
      { data: [85, 68, 18, 22, 28, 18] },   // 5-10s: 开始介绍
      { data: [88, 75, 28, 30, 38, 25] },   // 10-15s: 自称学生
      { data: [88, 82, 45, 38, 48, 32] },   // 15-20s: 开始表达不满
      { data: [88, 95, 92, 75, 88, 78] },   // 20-25s: 高风险时段-愤怒爆发
      { data: [88, 95, 85, 68, 82, 72] },   // 25-30s: 持续高风险-激烈批评
      { data: [88, 92, 70, 60, 75, 55] },   // 30-35s: 风险开始下降
      { data: [85, 88, 62, 52, 68, 48] },   // 35-40s: 持续不满但情绪缓和
      { data: [85, 85, 42, 42, 52, 38] },   // 40-45s: 呼吁传播
      { data: [85, 82, 30, 35, 45, 30] }    // 45-50s: 结束陈述，趋于平静
    ],

    // 11.6 全片平均雷达数据（6个维度：身份置信、学校关联、负面情感、传播风险、影响范围、处置紧迫）
    // 后端计算整个视频的平均值，用于雷达图底层参考线
    averageRadarData: [86, 82, 48, 44, 54, 41]
  },

  // ========== 12. 【全模态智能事件流】唯一证据数据库 ==========
  timelineEvents: [
    // 0-5秒：视频开场，检测到敏感画面（无语音）
    {
      id: 'visual-001',
      modality: 'visual',
      startTime: 0,
      endTime: 5,
      riskScore: 55,
      detectionType: 'logo',
      detectionLabel: '检测到北京大学校徽',
      boundingBox: { x: 70, y: 25, width: 15, height: 15 },
      confidence: 95
    } as VisualEvent,
    
    // 5-10秒：开始说话，平静介绍
    {
      id: 'speech-001',
      modality: 'speech',
      startTime: 5,
      endTime: 10,
      riskScore: 20,
      transcript: '大家好，我是今天的视频发布者，主要想聊聊最近发生的一些事情...',
      keywords: [],
      emotion: {
        label: '平静',
        intensity: 0.3,
        bgColor: 'rgba(82, 196, 26, 0.15)',
        textColor: '#52c41a'
      },
      confidence: 92
    } as SpeechEvent,
    
    // 10-12秒：声学事件（拍桌子）
    {
      id: 'audio-001',
      modality: 'audio-effect',
      startTime: 10,
      endTime: 12,
      riskScore: 58,
      description: '检测到重物撞击声（疑似拍桌动作）',
      intensity: 0.75,
      confidence: 88
    } as AudioEffectEvent,
    
    // 12-15秒：语音（自称学生）+ 画面检测到校服
    {
      id: 'speech-002',
      modality: 'speech',
      startTime: 12,
      endTime: 15,
      riskScore: 25,
      transcript: '我是北京大学计算机系的学生，今天想说说选课的问题...',
      keywords: ['北京大学', '计算机系', '学生'],
      emotion: {
        label: '平静',
        intensity: 0.4,
        bgColor: 'rgba(82, 196, 26, 0.15)',
        textColor: '#52c41a'
      },
      confidence: 95
    } as SpeechEvent,
    
    {
      id: 'visual-002',
      modality: 'visual',
      startTime: 12,
      endTime: 18,
      riskScore: 60,
      detectionType: 'uniform',
      detectionLabel: '检测到北大校服',
      boundingBox: { x: 30, y: 45, width: 35, height: 50 },
      confidence: 89
    } as VisualEvent,
    
    // 15-22秒：高风险语音段（煽动性内容）
    {
      id: 'speech-003',
      modality: 'speech',
      startTime: 15,
      endTime: 22,
      riskScore: 95,
      transcript: '但是学校的这个政策完全是欺骗学生的，大家千万不要相信，我们应该联合起来抵制这种行为！',
      keywords: ['欺骗', '抵制', '联合'],
      emotion: {
        label: '愤怒',
        intensity: 0.95,
        bgColor: 'rgba(245, 108, 108, 0.15)',
        textColor: '#f56c6c'
      },
      confidence: 98
    } as SpeechEvent,
    
    // 16-20秒：OCR检测到敏感文字（与语音重叠）
    {
      id: 'visual-003',
      modality: 'visual',
      startTime: 16,
      endTime: 20,
      riskScore: 98,
      detectionType: 'ocr',
      detectionLabel: 'OCR敏感词：[抵制]',
      boundingBox: { x: 15, y: 55, width: 40, height: 12 },
      confidence: 98
    } as VisualEvent,
    
    // 20-22秒：愤怒表情特写（无语音，纯视觉风险）
    {
      id: 'visual-004',
      modality: 'visual',
      startTime: 20,
      endTime: 22,
      riskScore: 92,
      detectionType: 'face',
      detectionLabel: '愤怒表情 + 过激手势',
      boundingBox: { x: 32, y: 18, width: 28, height: 38 },
      confidence: 98
    } as VisualEvent,
    
    // 22-24秒：声学事件（尖叫/嘶吼）
    {
      id: 'audio-002',
      modality: 'audio-effect',
      startTime: 22,
      endTime: 24,
      riskScore: 90,
      description: '检测到愤怒咆哮声，音量骤升',
      intensity: 0.95,
      confidence: 92
    } as AudioEffectEvent,
    
    // 24-28秒：横幅标语画面（无语音，哑剧时段）
    {
      id: 'visual-005',
      modality: 'visual',
      startTime: 24,
      endTime: 28,
      riskScore: 88,
      detectionType: 'banner',
      detectionLabel: '检测到抗议性横幅标语',
      boundingBox: { x: 10, y: 70, width: 80, height: 20 },
      confidence: 93
    } as VisualEvent,
    
    // 25-32秒：继续吐槽
    {
      id: 'speech-004',
      modality: 'speech',
      startTime: 25,
      endTime: 32,
      riskScore: 68,
      transcript: '我知道说这些话可能会有风险，但是我觉得必须要站出来说明真相...',
      keywords: ['风险', '真相'],
      emotion: {
        label: '严肃',
        intensity: 0.7,
        bgColor: 'rgba(75, 112, 226, 0.15)',
        textColor: '#4b70e2'
      },
      confidence: 85
    } as SpeechEvent,
    
    // 30-34秒：违规手势（与语音重叠）
    {
      id: 'visual-006',
      modality: 'visual',
      startTime: 30,
      endTime: 34,
      riskScore: 85,
      detectionType: 'gesture',
      detectionLabel: '检测到过激肢体动作',
      boundingBox: { x: 35, y: 40, width: 30, height: 35 },
      confidence: 87
    } as VisualEvent,
    
    // 35-42秒：追究威胁
    {
      id: 'speech-005',
      modality: 'speech',
      startTime: 35,
      endTime: 42,
      riskScore: 72,
      transcript: '如果不给我们一个合理的解释，这件事情没完，我们会一直追究下去...',
      keywords: ['追究', '没完'],
      emotion: {
        label: '紧张',
        intensity: 0.68,
        bgColor: 'rgba(250, 173, 20, 0.15)',
        textColor: '#faad14'
      },
      confidence: 91
    } as SpeechEvent,
    
    // 36-40秒：OCR检测到追究相关文字
    {
      id: 'visual-007',
      modality: 'visual',
      startTime: 36,
      endTime: 40,
      riskScore: 70,
      detectionType: 'ocr',
      detectionLabel: 'OCR敏感词：[追究]',
      boundingBox: { x: 20, y: 60, width: 35, height: 10 },
      confidence: 91
    } as VisualEvent,
    
    // 42-44秒：沉默段，但画面显示学校选课系统（纯视觉）
    {
      id: 'visual-008',
      modality: 'visual',
      startTime: 42,
      endTime: 44,
      riskScore: 55,
      detectionType: 'ocr',
      detectionLabel: 'OCR识别：屏幕显示学校选课系统界面',
      boundingBox: { x: 5, y: 10, width: 90, height: 70 },
      confidence: 85
    } as VisualEvent,
    
    // 45-50秒：呼吁传播
    {
      id: 'speech-006',
      modality: 'speech',
      startTime: 45,
      endTime: 50,
      riskScore: 35,
      transcript: '希望能引起相关部门的注意，也希望更多的同学能够看到这个视频，了解真实情况。',
      keywords: ['相关部门', '真实情况'],
      emotion: {
        label: '平静',
        intensity: 0.3,
        bgColor: 'rgba(82, 196, 26, 0.15)',
        textColor: '#52c41a'
      },
      confidence: 88
    } as SpeechEvent
  ],
  
  // ========== 13. 场景识别 ==========
  sceneRecognition: [
    { id: 'scene-1', name: '教室', icon: '🏫', confidence: 0.92, timeStart: 0, timeEnd: 15 },
    { id: 'scene-2', name: '宿舍', icon: '🛏️', confidence: 0.95, timeStart: 15, timeEnd: 35 },
    { id: 'scene-3', name: '校园室外', icon: '🌳', confidence: 0.88, timeStart: 35, timeEnd: 50 }
  ]
}
