```ts
// ==================== Mock数据（模拟Python后端返回的完整分析结果） ====================

export const mockAnalysisResult: AnalysisResult = {
  // ========== 1. 视频基本信息 ==========
  videoInfo: {
    videoId: 'video_20240201_001',⬛之后做反馈给管理员的功能的时候，需要把这个放到 API 里面，保留。
      ⬛这里要加一个视频url地址。 目前的视频连接是前端硬编码的。 这样不对，应该放到这个字段里。
    fileName: '北大学生吐槽选课系统_20240201.mp4',
    fileSize: 128 * 1024 * 1024, // 128MB⬛技术性参数不需要。 
    duration: 50, // 50秒⬛浏览器渲染的时候，如果视频播放器加载成功了，那么就渲染视频加载器读取出来的视频实际时长；如果加载失败，那就选择渲染 Duration。。
    resolution: '1920×1080',⬛技术性参数不需要。 
    uploadTime: '2024-02-01 14:30:25',⬛就算是以后做自动爬虫，也不能叫这个字段名，或也不一定需要
    uploadSource: '本地上传',⬛这个还是要留着，以后做自动爬虫肯定是要用于区分的。 
    analysisStatus: '分析完成',⬛既然能看到这个分析结果，当然是分析完成了。 
    description: '自称北京大学计算机系学生，吐槽学校选课系统经常崩溃、热门课抢不到等问题，情绪较为激动，若上传到公开平台可能引发其他学生共鸣转发。'⬛可选
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
    sentimentLabel: '负面/不满',
    
    // 详细证据（前端统计情感分布）
    evidences: [
      {
        timestamp: 5,
        type: 'video',
        description: '表情分析：检测到微笑表情',
        confidence: 88,
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
    ]
  },

  // ========== 6. 潜在舆论风险分析 ==========
  opinionRisk: {
    riskLabel: '中等风险',
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

  // ========== 8. 台词转录与风险定位 ==========
  transcriptSegments: [⬛奇怪哦。为什么后面还有个riskEvidences？而且，目前浏览器中字幕滚动图（语音转文字与风险定位）显示的就是riskEvidences的内容啊，反而这个transcriptSegments倒是没见到，怎么回事？？
    {
      id: '1',
      start: 0,
      end: 10,
      text: '大家好，我是北大计算机系的学生，今天想跟大家聊聊我们学校的选课系统。',
      content: '大家好，我是北大计算机系的学生，今天想跟大家聊聊我们学校的选课系统。',
      emotion: 'calm',
      riskLevel: 'low',
      keywords: ['学生', '选课系统'],
      reason: '平静介绍，正常陈述'
    },
    {
      id: '2',
      start: 10,
      end: 22,
      text: '说实话，这个系统真的让人很失望。每次选课的时候都会崩溃，根本登不上去。',
      content: '说实话，这个系统真的让人很失望。每次选课的时候都会崩溃，根本登不上去。',
      emotion: 'serious',
      riskLevel: 'medium',
      keywords: ['失望', '崩溃'],
      reason: '表达不满，涉及系统问题'
    },
    {
      id: '3',
      start: 22,
      end: 32,
      text: '学校的选课系统简直就是个笑话！每到选课季就崩溃，这是什么垃圾服务器？！',
      content: '学校的选课系统简直就是个笑话！每到选课季就崩溃，这是什么垃圾服务器？！',
      emotion: 'angry',
      riskLevel: 'high',
      keywords: ['笑话', '垃圾'],
      reason: '情绪激烈，使用极端词汇批评学校'
    },
    {
      id: '4',
      start: 32,
      end: 42,
      text: '好多热门课根本抢不到，有些同学为了选上课都得半夜爬起来盯着电脑，这合理吗？',
      content: '好多热门课根本抢不到，有些同学为了选上课都得半夜爬起来盯着电脑，这合理吗？',
      emotion: 'serious',
      riskLevel: 'medium',
      keywords: ['抢不到', '热门课'],
      reason: '持续表达不满，可能引发其他学生共鸣'
    },
    {
      id: '5',
      start: 42,
      end: 48,
      text: '希望学校教务处能够重视这个问题，不要再让学生们为选课焦虑了，我们的诉求很简单...',
      content: '希望学校教务处能够重视这个问题，不要再让学生们为选课焦虑了，我们的诉求很简单...',
      emotion: 'calm',
      riskLevel: 'low',
      keywords: ['教务处', '诉求'],
      reason: '理性表达诉求，语气缓和'
    },
    {
      id: '6',
      start: 48,
      end: 50,
      text: '如果你也是北大的学生，如果你也有同样的经历，请点赞、转发，让更多人看到！',
      content: '如果你也是北大的学生，如果你也有同样的经历，请点赞、转发，让更多人看到！',
      emotion: 'tense',
      riskLevel: 'medium',
      keywords: ['点赞', '转发'],
      reason: '呼吁传播，有一定传播风险'
    }
  ],

  // ========== 11. 时间轴数据 ==========
  timelineData: {
    timeGranularity: 10,  // 时间粒度：10秒

    // 11.1 视频风险点（5个元素，索引0-4对应0-10s, 10-20s, 20-30s, 30-40s, 40-50s）
    videoRisks: [
      {
        riskLevel: 'low',
        reason: '检测到学生宿舍场景',
        intensity: 0.25
      },
      {
        riskLevel: 'low',
        reason: '正常陈述，无明显风险',
        intensity: 0.30
      },
      {
        riskLevel: 'high',
        reason: '检测到愤怒表情和激烈手势',
        intensity: 0.92
      },
      {
        riskLevel: 'medium',
        reason: '持续的不满情绪表达',
        intensity: 0.68
      },
      {
        riskLevel: 'medium',
        reason: 'OCR识别到学校选课系统界面截图',
        intensity: 0.55
      }
    ],

    // 11.2 音频情绪（5个元素，索引0-4对应0-10s, 10-20s, 20-30s, 30-40s, 40-50s）
    audioEmotions: [
      {
        emotion: 'calm',
        intensity: 0.30,
        reason: '语音平稳，无明显情绪波动'
      },
      {
        emotion: 'calm',
        intensity: 0.42,
        reason: '语速正常，开始表达不满'
      },
      {
        emotion: 'angry',
        intensity: 0.95,
        reason: '检测到愤怒咆哮，音量突然增大'
      },
      {
        emotion: 'tense',
        intensity: 0.70,
        reason: '语气紧张激动，音调升高'
      },
      {
        emotion: 'tense',
        intensity: 0.52,
        reason: '情绪逐渐平复，但仍有紧张感'
      }
    ],

    // 11.3 文本风险点（5个元素，索引0-4对应0-10s, 10-20s, 20-30s, 30-40s, 40-50s）
    textRisks: [
      {
        riskLevel: 'low',
        reason: '平静介绍，正常陈述',
        intensity: 0.20
      },
      {
        riskLevel: 'medium',
        reason: '表达不满，涉及系统问题',
        intensity: 0.58
      },
      {
        riskLevel: 'high',
        reason: '情绪激烈，使用极端词汇批评学校',
        intensity: 1.0
      },
      {
        riskLevel: 'medium',
        reason: '持续表达不满，可能引发其他学生共鸣',
        intensity: 0.65
      },
      {
        riskLevel: 'medium',
        reason: '呼吁传播，有一定传播风险',
        intensity: 0.50
      }
    ],

    // 11.4 综合风险点（5个元素，索引0-4对应0-10s, 10-20s, 20-30s, 30-40s, 40-50s）
    comprehensiveRisks: [
      { riskLevel: 'low', intensity: 0.30 },
      { riskLevel: 'medium', intensity: 0.58 },
      { riskLevel: 'high', intensity: 1.0 },
      { riskLevel: 'medium', intensity: 0.70 },
      { riskLevel: 'medium', intensity: 0.55 }
    ],

    // 11.5 雷达图时间段数据（5个元素，索引0-4对应0-10s, 10-20s, 20-30s, 30-40s, 40-50s）
    radarByTime: [
      { data: [85, 65, 15, 20, 25, 15] },
      { data: [85, 80, 40, 35, 45, 30] },
      { data: [85, 95, 88, 70, 85, 75] },
      { data: [85, 90, 65, 55, 70, 50] },
      { data: [85, 85, 35, 40, 50, 35] }
    ],

    // 11.6 全片平均雷达数据（6个维度：身份置信、学校关联、负面情感、传播风险、影响范围、处置紧迫）
    // 后端计算整个视频的平均值，用于雷达图底层参考线
    averageRadarData: [85, 83, 49, 44, 55, 41]
  },

  // ========== 12. 辅助分析数据 ==========
  // 12.1 风险证据列表（用于左侧证据展示，与台词转录不同）
      ⬛我浏览器中显示的这个riskEvidences，就是语音转文字与风险定位中显示的东西，而不是transcriptSegments，就很离谱啊。 
  riskEvidences: [
    {
      id: 'evidence-1',
      time: '00:05-00:10',⬛这又有必要吗？下面不是有两个时间戳吗？那这个可以动态生成，还需要 mock 吗？ 
      timeSeconds: 5,
      timeEndSeconds: 10,
      content: '大家好，我是今天的视频发布者，主要想聊聊最近发生的一些事情...',
      riskLevel: 'low',
      imageUrl: 'https://images.unsplash.com/photo-1523050854058-8df90110c9f1?w=800&h=450&fit=crop',⬛这个用不上吧？本来就是字幕对应的。左边不就有视频了吗？还看imageUrl看什么？
      boxStyle: { top: '0%', left: '0%', width: '0%', height: '0%' },
      label: '',
      confidence: 0,
      keywords: [],
      emotion: 'calm'⬛这是老问题了。你不要用这种预设词，这种枚举之类的预设词全部让后端给你。你不要自己去下定义，不然后面如果要增加广度，你还得自己匹配，纯给自己找麻烦，真是无聊之举。 然后我还发现了，你视频框左上角的标记也是用这个值的。我建议就是像这种由于文字不同，会导致文字的颜色和文字底部的颜色要变化的话，那你还是用加几个字段吧。 比如加两个字段，一个是“底”的颜色，一个是“字”的颜色。通过字段读取给你，而不是你自己在前端去自己定义枚举匹配之类的。你再检查一下，还有哪些地方需要改成这种模式？ 
    },
    {
      id: 'evidence-2',
      time: '00:15-00:22',
      timeSeconds: 15,
      timeEndSeconds: 22,
      content: '但是学校的这个政策完全是欺骗学生的，大家千万不要相信，我们应该联合起来抵制这种行为！',
      riskLevel: 'high',
      imageUrl: 'https://images.unsplash.com/photo-1541339907198-e08756dedf3f?w=800&h=450&fit=crop',
      boxStyle: { top: '25%', left: '15%', width: '45%', height: '35%' },
      label: 'OCR敏感词：[抵制]',
      confidence: 0.98,
      keywords: ['欺骗', '抵制', '联合'],
      emotion: 'angry'
    },
    {
      id: 'evidence-3',
      time: '00:25-00:32',
      timeSeconds: 25,
      timeEndSeconds: 32,
      content: '我知道说这些话可能会有风险，但是我觉得必须要站出来说明真相...',
      riskLevel: 'medium',
      imageUrl: 'https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?w=800&h=450&fit=crop',
      boxStyle: { top: '35%', left: '30%', width: '30%', height: '40%' },
      label: '肢体动作：过激手势',
      confidence: 0.85,
      keywords: ['风险', '真相'],
      emotion: 'serious'
    },
    {
      id: 'evidence-4',
      time: '00:35-00:42',
      timeSeconds: 35,
      timeEndSeconds: 42,
      content: '如果不给我们一个合理的解释，这件事情没完，我们会一直追究下去...',
      riskLevel: 'medium',
      imageUrl: 'https://images.unsplash.com/photo-1577896851905-4dcc0c7f1f1c?w=800&h=450&fit=crop',
      boxStyle: { top: '20%', left: '25%', width: '35%', height: '30%' },
      label: '抗议性标语区域',
      confidence: 0.91,
      keywords: ['追究'],
      emotion: 'tense'
    },
    {
      id: 'evidence-5',
      time: '00:45-00:50',
      timeSeconds: 45,
      timeEndSeconds: 50,
      content: '希望能引起相关部门的注意，也希望更多的同学能够看到这个视频，了解真实情况。',
      riskLevel: 'low',
      imageUrl: 'https://images.unsplash.com/photo-1498243691581-b145c3f54a5a?w=800&h=450&fit=crop',
      boxStyle: { top: '0%', left: '0%', width: '0%', height: '0%' },
      label: '',
      confidence: 0,
      keywords: [],
      emotion: 'calm'
    }
  ],

  // 12.2 AI目标侧写
  aiProfile: {
    identityStatus: 'suspected',⬛这个数据没用到啊。 
    identityLabel: '疑似在校学生',⬛这个数据没用到啊。 
    confidence: 0.85,⬛这个数据没用到啊。 
    matchSource: '语音中自称"北大计算机系学生"，检测到校园场景',⬛这个数据没用到啊。 
    detectedKeywords: [⬛这个是内容关键词上面的，也就是视频栏中的。 如果里面所有的元素都不存在，其数组为空，那么，“内容关键词”这五个字及图标就不能显示出来。 应该把这个字段移动到videoInfo。 
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
    staticFeatures: {⬛这个是视频主要人物。也是视频栏中的。 这里面的四个字段都要做成可选的。 如果没有填入或填入的为空串，那么图标就不能显示。看起来就像是没有这数据的（给其他数据让位置）。如果这四个字段都没有“直”或都为空，那么这一行整个的视频主要人物这六个字以及图标都不能显示出来。    应该把这个字段移动到videoInfo。 
      gender: '男性',⬛这个要做一下对应。就如果值为“女性”，你这个浏览器中显示的图标也要是女性的图标
      ageRange: '20-24岁',
      voiceProfile: '年轻男性/情绪激动',
      clothing: '休闲装'
    },
    sceneType: '校园宿舍',⬛这个数据没用到啊。 
    sceneConfidence: 0.88⬛这个数据没用到啊。 
  },

  // 12.3 CV视觉检测框
  cvDetections: [
    { id: 'face-1', type: 'face', boundingBox: { x: 35, y: 20, width: 25, height: 35 }, confidence: 0.96, label: '平静表情', timeStart: 5, timeEnd: 15, metadata: { emotion: 'calm', emotionIcon: '😐', age: 22, gender: '男性' } },
    { id: 'face-2', type: 'face', boundingBox: { x: 32, y: 18, width: 28, height: 38 }, confidence: 0.98, label: '愤怒表情', timeStart: 15, timeEnd: 30, metadata: { emotion: 'angry', emotionIcon: '😡', age: 22, gender: '男性' } },
    { id: 'face-3', type: 'face', boundingBox: { x: 30, y: 15, width: 30, height: 40 }, confidence: 0.94, label: '严肃表情', timeStart: 30, timeEnd: 50, metadata: { emotion: 'serious', emotionIcon: '😟', age: 22, gender: '男性' } },
    { id: 'ocr-1', type: 'ocr', boundingBox: { x: 15, y: 55, width: 40, height: 12 }, confidence: 0.98, label: 'OCR敏感词：[抵制]', timeStart: 15, timeEnd: 20, metadata: {} },
    { id: 'ocr-2', type: 'ocr', boundingBox: { x: 20, y: 60, width: 35, height: 10 }, confidence: 0.91, label: 'OCR敏感词：[追究]', timeStart: 35, timeEnd: 40, metadata: {} },
    { id: 'logo-1', type: 'logo', boundingBox: { x: 70, y: 25, width: 15, height: 15 }, confidence: 0.95, label: '检测到北大校徽', timeStart: 10, timeEnd: 30, metadata: {} },
    { id: 'uniform-1', type: 'uniform', boundingBox: { x: 30, y: 45, width: 35, height: 50 }, confidence: 0.89, label: '检测到北大校服', timeStart: 5, timeEnd: 35, metadata: {} },
    { id: 'banner-1', type: 'banner', boundingBox: { x: 10, y: 70, width: 80, height: 20 }, confidence: 0.93, label: '检测到横幅标语', timeStart: 20, timeEnd: 28, metadata: {} }
  ],

  // 12.4 场景识别
  sceneRecognition: [
    { id: 'scene-1', name: '教室', icon: '🏫', confidence: 0.92, timeStart: 0, timeEnd: 15 },
    { id: 'scene-2', name: '宿舍', icon: '🛏️', confidence: 0.95, timeStart: 15, timeEnd: 35 },
    { id: 'scene-3', name: '校园室外', icon: '🌳', confidence: 0.88, timeStart: 35, timeEnd: 50 }
  ]
}

```