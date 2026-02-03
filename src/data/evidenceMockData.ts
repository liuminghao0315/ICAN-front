import type { Evidence, CardData } from '@/components/EvidenceDrawer.vue'
import { User, School, ChatDotRound, TrendCharts, WarningFilled, Share, Document, DocumentChecked } from '@element-plus/icons-vue'

// 统计类数据结构（用于次数统计的卡片）
export interface StatisticsData {
  positive: number    // 正面次数
  neutral: number     // 中性次数
  negative: number    // 负面次数
  total: number       // 总次数
}

// 多模态融合数据结构
export interface ModalityFusion {
  videoScore: number      // 视频模态得分 0-100
  audioScore: number      // 音频模态得分 0-100
  textScore: number       // 文本模态得分 0-100
  videoWeight: number     // 视频权重 0-1
  audioWeight: number     // 音频权重 0-1
  textWeight: number      // 文本权重 0-1
  fusionFormula: string   // 融合公式
  finalScore: number      // 最终得分 0-100
  videoEvidenceCount: number  // 视频证据数量
  audioEvidenceCount: number  // 音频证据数量
  textEvidenceCount: number   // 文本证据数量
  resultType: string      // 结果类型：confidence/intensity/score/statistics
  resultLabel: string     // 结果标签：识别置信度/情感强度/风险等级/统计结果等
  resultValue: string     // 结果值显示：85%/中等/6.5分/8次（4负3中1正）等
  // 统计类数据（当 resultType 为 'statistics' 时使用）
  statistics?: StatisticsData
}

// 每个卡片的多模态融合配置
export const cardFusionMap: Record<string, ModalityFusion> = {
  // 1. 身份判定 - 多模态融合
  identity: {
    videoScore: 82,
    audioScore: 91,
    textScore: 85,
    videoWeight: 0.3,
    audioWeight: 0.5,  // 音频最重要（自称身份）
    textWeight: 0.2,
    fusionFormula: '(82 × 0.3) + (91 × 0.5) + (85 × 0.2)',
    finalScore: 85,
    videoEvidenceCount: 2,
    audioEvidenceCount: 2,
    textEvidenceCount: 2,
    resultType: 'confidence',
    resultLabel: '识别置信度',
    resultValue: '85%'
  },
  
  // 2. 涉及高校
  university: {
    videoScore: 88,
    audioScore: 95,
    textScore: 92,
    videoWeight: 0.2,
    audioWeight: 0.4,  // 音频最重要（口述校名）
    textWeight: 0.4,   // 文本也重要（关键词）
    fusionFormula: '(88 × 0.2) + (95 × 0.4) + (92 × 0.4)',
    finalScore: 92,
    videoEvidenceCount: 3,
    audioEvidenceCount: 3,
    textEvidenceCount: 4,
    resultType: 'confidence',
    resultLabel: '关联置信度',
    resultValue: '92%'
  },
  
  // 3. 内容主题
  topic: {
    videoScore: 85,
    audioScore: 92,
    textScore: 90,
    videoWeight: 0.2,
    audioWeight: 0.4,
    textWeight: 0.4,
    fusionFormula: '(85 × 0.2) + (92 × 0.4) + (90 × 0.4)',
    finalScore: 89,
    videoEvidenceCount: 1,
    audioEvidenceCount: 3,
    textEvidenceCount: 2,
    resultType: 'confidence',
    resultLabel: '主题置信度',
    resultValue: '89%'
  },
  
  // 4. 对学校态度 - 统计类型（统计正面/负面/中性次数）
  attitude: {
    videoScore: 0,    // 统计类型不使用分数
    audioScore: 0,
    textScore: 0,
    videoWeight: 0,
    audioWeight: 0,
    textWeight: 0,
    fusionFormula: '统计情感倾向出现次数',
    finalScore: 0,
    videoEvidenceCount: 2,
    audioEvidenceCount: 2,
    textEvidenceCount: 3,
    resultType: 'statistics',
    resultLabel: '情感分布统计',
    resultValue: '9处：3正 2中 4负',
    statistics: {
      positive: 3,
      neutral: 2,
      negative: 4,
      total: 9
    }
  },
  
  // 5. 潜在舆论风险
  opinionRisk: {
    videoScore: 55,
    audioScore: 62,
    textScore: 58,
    videoWeight: 0.2,
    audioWeight: 0.4,
    textWeight: 0.4,
    fusionFormula: '(55 × 0.2) + (62 × 0.4) + (58 × 0.4)',
    finalScore: 58,
    videoEvidenceCount: 1,
    audioEvidenceCount: 2,
    textEvidenceCount: 2,
    resultType: 'score',
    resultLabel: '风险指数',
    resultValue: '58分'
  },
  
  // 6. 处置建议
  action: {
    videoScore: 70,
    audioScore: 80,
    textScore: 75,
    videoWeight: 0.35,
    audioWeight: 0.4,
    textWeight: 0.25,
    fusionFormula: '(70 × 0.35) + (80 × 0.4) + (75 × 0.25)',
    finalScore: 75,
    videoEvidenceCount: 1,
    audioEvidenceCount: 2,
    textEvidenceCount: 1,
    resultType: 'urgency',
    resultLabel: '紧急程度',
    resultValue: '75%'
  }
}

// 8个卡片的证据数据
export const cardEvidencesMap: Record<string, Evidence[]> = {
  // 1. 身份判定 - 疑似在校学生
  identity: [
    {
      timestamp: 5,
      type: 'video',
      description: '宿舍环境背景：检测到典型学生宿舍布局（床铺、书桌、台灯）',
      confidence: 82,
      thumbnail: undefined
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

  // 2. 涉及高校 - 北京大学
  university: [
    {
      timestamp: 5,
      type: 'video',
      description: '场景识别：检测到北京大学校园标识性建筑',
      confidence: 90,
      thumbnail: undefined
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
      confidence: 85,
      thumbnail: undefined
    }
  ],

  // 3. 内容主题 - 校园政策
  topic: [
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

  // 4. 对学校态度 - 包含正面/中性/负面（带情感标签）
  attitude: [
    {
      timestamp: 5,
      type: 'video',
      description: '表情分析：检测到微笑表情',
      confidence: 88,
      thumbnail: undefined,
      sentiment: 'positive'
    },
    {
      timestamp: 15,
      type: 'audio',
      description: '语调分析：语气轻松愉快',
      confidence: 85,
      sentiment: 'positive'
    },
    {
      timestamp: 25,
      type: 'text',
      description: '正面情感词汇',
      confidence: 90,
      keyword: '喜欢',
      sentiment: 'positive'
    },
    {
      timestamp: 35,
      type: 'video',
      description: '表情分析：检测到愤怒、失望表情',
      confidence: 85,
      thumbnail: undefined,
      sentiment: 'negative'
    },
    {
      timestamp: 45,
      type: 'audio',
      description: '语调分析：声调提高，语速加快，情绪激动',
      confidence: 92,
      sentiment: 'negative'
    },
    {
      timestamp: 50,
      type: 'text',
      description: '负面情感词汇',
      confidence: 95,
      keyword: '失望',
      sentiment: 'negative'
    },
    {
      timestamp: 32,
      type: 'text',
      description: '批评性用语',
      confidence: 88,
      keyword: '不负责任',
      sentiment: 'negative'
    },
    {
      timestamp: 38,
      type: 'audio',
      description: '持续的不满情绪表达（但语气相对平静）',
      confidence: 90,
      sentiment: 'neutral'
    },
    {
      timestamp: 46,
      type: 'text',
      description: '客观描述问题',
      confidence: 87,
      keyword: '系统问题',
      sentiment: 'neutral'
    }
  ],

  // 5. 潜在舆论风险 - 中等风险
  opinionRisk: [
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

  // 6. 处置建议 - 建议关注
  action: [
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
      confidence: 85,
      thumbnail: undefined
    },
    {
      timestamp: 48,
      type: 'audio',
      description: '传播风险点：呼吁他人关注',
      confidence: 90
    }
  ]
}

// 6个核心卡片的基础信息
export const cardsData: CardData[] = [
  {
    id: 'identity',
    label: '身份判定',
    value: '疑似在校学生',
    confidence: 85,
    confidenceLabel: '识别置信度',
    icon: User,
    iconClass: 'icon-bg-identity'
  },
  {
    id: 'university',
    label: '涉及高校',
    value: '北京大学',
    confidence: 92,
    confidenceLabel: '匹配度',
    icon: School,
    iconClass: 'icon-bg-uni'
  },
  {
    id: 'topic',
    label: '内容主题',
    value: '校园政策',
    confidence: 89,
    confidenceLabel: '主题置信度',
    icon: ChatDotRound,
    iconClass: 'icon-bg-topic'
  },
  {
    id: 'attitude',
    label: '对学校态度',
    value: '负面/不满',
    confidence: 67,
    confidenceLabel: '负面占比',
    icon: TrendCharts,
    iconClass: 'icon-bg-negative'
  },
  {
    id: 'opinionRisk',
    label: '潜在舆论风险',
    value: '中等风险',
    confidence: 58,
    confidenceLabel: '风险指数',
    icon: WarningFilled,
    iconClass: 'icon-bg-risk-medium'
  },
  {
    id: 'action',
    label: '处置建议',
    value: '建议关注',
    confidence: 75,
    confidenceLabel: '紧急程度',
    icon: DocumentChecked,
    iconClass: 'icon-bg-action'
  }
]
