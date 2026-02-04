```ts
// ==================== Mock数据（模拟Python后端返回的完整分析结果） ====================

export const mockAnalysisResult: AnalysisResult = {
  // ========== 1. 视频基本信息 ==========
  videoInfo: {
1    videoId: 'video_20240201_001',⬛之后做反馈给管理员的功能的时候，需要把这个放到 API 里面。
1    fileName: '北大学生吐槽选课系统_20240201.mp4',
x    fileSize: 128 * 1024 * 1024, // 128MB⬛技术性参数不需要。 
1    duration: 50, // 3分15秒⬛假如视频无法播放，如果没有这个，就会卡死页面，真没办法。 
x    resolution: '1920×1080',⬛技术性参数不需要。 
x    uploadTime: '2024-02-01 14:30:25',⬛就算是以后做自动爬虫，也不能叫这个字段名，或也不一定需要
1    uploadSource: '本地上传',⬛这个还是要留着，以后做自动爬虫肯定是要用于区分的。 
x    analysisStatus: '分析完成',⬛既然能看到这个分析结果，当然是分析完成了。 
1    description: '自称北京大学计算机系学生，吐槽学校选课系统经常崩溃、热门课抢不到等问题，情绪较为激动，若上传到公开平台可能引发其他学生共鸣转发。'⬛可选
  },

  // ========== 2. 身份判定分析 ==========
1  identity: {
    identityLabel: '疑似在校学生',
    confidence: 0.85
  },

  // ========== 3. 涉及高校分析 ==========
1  university: {
    universityName: '北京大学',
    logoConfidence: 0.92
  },

  // ========== 4. 内容主题分析 ==========
  topic: {
1    topicCategory: '校园政策',
1    topicSubCategory: '选课制度吐槽',
0    keyTopics: ['选课系统崩溃', '课程名额不足', '热门课抢不到']⬛根本就没用到。
？⬛是否需要再添加一个置信度呢？因为在证据图中使用到了置信度。这样的话，能保证执行度在证据图和卡片中共用同一个数值。 但如此又会造成偶合过于紧密，难以拆分传递数值。反之，可能会造成数据溶于，容易填错不一致的情况。 
  },

  // ========== 5. 对学校态度分析 ==========
  attitude: {
x    sentimentTowardSchool: 'negative',
1    sentimentLabel: '负面/不满',
1    sentimentIntensity: 0.72,⬛使用这个“情感分数”来判断颜色的类型，而不是用上面的那个 negative 值。 
1    schoolMentionCount: 8,⬛提学校总次数。
1    negativeMentionCount: 4,⬛负面的 提学校次数。结合上面那个能计算百分比。 
？x    statistics: {⬛这为什么又在卡片中显示呢？不是应该在证据图中才会显示到用这个吗？ 但cursor建议我不要删。待会问问他到底在哪儿使用，是在证据图还是在卡片。 
      positive: 3,
      neutral: 2,
      negative: 4,⬛这个应该negativeMentionCount一样。 
      total: 9⬛这个和提学教总次数应该一样才对啊。 
    }
  },

  // ========== 6. 潜在舆论风险分析 ==========
  opinionRisk: {
x    riskLevel: 'medium',
1    riskLabel: '中等风险',
1    riskScore: 58,⬛应该通过这个数字风险值来判断字体颜色，而不是medium值
1    riskReason: '可能引发跟风吐槽',
x    spreadPotential: 6.5,
x    spreadPotentialLabel: '较易传播',
x    potentialImpacts: [⬛这三个都是传播潜力，并不是舆论风险。我传播潜力之前都删了，因为实在是挤不下，而且也没有必要。它和舆论风险是类似的。 
      '若上传可能引发其他学生共鸣转发',
      '对学校选课系统形象有一定负面影响',
      '建议先与教务处沟通后再决定'
    ]
  },

  // ========== 7. 处置建议 ==========
  action: {
    actionSuggestion: '谨慎发布',
    actionDetail: '建议人工复核后决定是否上传',
    urgencyLevel: 75⬛这个地方为什么又出现了置信度呢？卡片中也没有指出置信度啊。之前的校园政策也就是那种主题，也没有执行度。和这个是类似的。而这处置建议又有了。待会把这两张卡片一起决定。 
  },

  // ========== 8. 详细证据数据 ==========
  evidences: {
    // 8.1 身份判定证据
    identity: [⬛这些列举的都是详细证据中的每一条信息的内容。 那它的这个多模态融合分析中的三模态数值是怎么得出来的？ 融合结果呢？是算出来的，还是直接引用之前卡片中的？ 而且，三模态数值是否计算有点问题？ 
      {
        timestamp: 5,
        type: 'video',
        description: '宿舍环境背景：检测到典型学生宿舍布局（床铺、书桌、台灯）',
        confidence: 82,
        thumbnail: undefined ⬛这他妈是什么鬼啊？ 
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
        description: '提及学生身份相关词汇',⬛文本描述在交互分析中尚未显示出。这个要保留。我待会使用悬浮窗口显示这些字。 
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

    // 8.2 涉及高校证据
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

    // 8.3 内容主题证据
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

    // 8.4 对学校态度证据
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

    // 8.5 潜在舆论风险证据
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

    // 8.6 处置建议证据
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
  },

  // ========== 9. 多模态融合分析数据 ==========
  modalityFusion: {
    // 9.1 身份判定融合
    identity: {
      videoScore: 82,⬛
      audioScore: 91,⬛
      textScore: 85,⬛这玩意真的是让python端就直接给出来了吗？ 
      videoWeight: 0.3,
      audioWeight: 0.5,
      textWeight: 0.2,
      fusionFormula: '(82 × 0.3) + (91 × 0.5) + (85 × 0.2)',⬛这个可以自己写表达式组合，为什么要在这直接写个字符串？  
      finalScore: 85,⬛这个也可以自己就算出来了啊。前面不是有公式吗？需要给 Mock 吗？ 
      videoEvidenceCount: 2,⬛
      audioEvidenceCount: 2,⬛
      textEvidenceCount: 2,⬛这不是可以直接统计出来吗？有必要在这里写吗？ 
      resultType: 'confidence',⬛这TM又是什么鬼啊？ 
      resultLabel: '识别置信度',⬛这又是什么鬼啊？这难道不是应该硬编码才对吗？你觉得这玩意能变化的吗？ 
      resultValue: '85%'⬛这不是也能自己算出来吗？这需要给mock吗？而且和finalScore重复了吧？ 
    },

    // 9.2 涉及高校融合
    university: {
      videoScore: 88,
      audioScore: 95,
      textScore: 92,
      videoWeight: 0.2,
      audioWeight: 0.4,
      textWeight: 0.4,
      fusionFormula: '(88 × 0.2) + (95 × 0.4) + (92 × 0.4)',
      finalScore: 92,
      videoEvidenceCount: 3,
      audioEvidenceCount: 3,
      textEvidenceCount: 4,
      resultType: 'confidence',
      resultLabel: '关联置信度',
      resultValue: '92%'
    },

    // 9.3 内容主题融合
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

    // 9.4 对学校态度融合（统计类型）
    attitude: {
      videoScore: 0,⬛
      audioScore: 0,⬛
      textScore: 0,⬛
      videoWeight: 0,⬛
      audioWeight: 0,⬛
      textWeight: 0,⬛
      fusionFormula: '统计情感倾向出现次数',⬛
      finalScore: 0,⬛这根本都用不上吧？为什么还要在这儿？ 
      videoEvidenceCount: 2,⬛
      audioEvidenceCount: 2,⬛
      textEvidenceCount: 3,⬛这是不是也是虚假的啊？一点用都没有，而且也用不上啊，关键是。 
      resultType: 'statistics',⬛那你渲染的时候直接拿这一个作为判断条件就行了。 之前那些多余的字段不使用不就行了，为什么要给值0，冗余字段。 
      resultLabel: '情感分布统计',⬛这个也是。这玩意儿就应该用硬编码啊。这个又不是什么标记词。上层对象attitude不就代表了这个卡片的结果是清单分布统计吗？所以这个地方没有必要标记resultLabel，直接硬编码有问题吗。  
      resultValue: '9处：3正 2中 4负',⬛这又是什么“有病”的设计？我搞不懂。 不是可以自己统计出来吗？还需要python端给出改mock字段干嘛？ 
      statistics: {⬛之前在证据对象中，不是已经写得很准确、详细了吗？这里还需要给出mock吗，能不能直接复用证据对象中给出的东西？还是说这两种方式各有优劣应该用哪个？？？ 
        positive: 3,
        neutral: 2,
        negative: 4,
        total: 9
      }
    },

    // 9.5 潜在舆论风险融合
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

    // 9.6 处置建议融合
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
  },

  // ========== 10. 台词转录与风险定位 ==========
  transcriptSegments: [⬛奇怪哦。为什么后面还有个riskEvidences？而且，目前浏览器中字幕滚动图（语音转文字与风险定位）显示的就是riskEvidences的内容啊，反而这个transcriptSegments倒是没见到，怎么回事？？
⬛我刚才看了一下，你这个有严重的问题啊。你这里面的reason都是用在了二维线形图的鼠标悬浮窗口的文本内容了，你这数据引用的驴头不对马嘴了。  
    {
      id: '1',⬛为什么要给出ID值啊？是不是为了“v-for”循环用:key？？ 
      start: 0,
      end: 18,
      text: '大家好，我是北大计算机系的学生，今天想跟大家聊聊我们学校的选课系统。',
      content: '大家好，我是北大计算机系的学生，今天想跟大家聊聊我们学校的选课系统。',⬛这俩字端都一样的，为什么还要再给一次mock字段？纯粹冗余吧。 
      emotion: 'calm',⬛这个我也是无举了。显示“平静”才对？你这怎么是calm？都说了，不要让前端做这种枚举判断，毫无意义啊！以后扩展广度呢，你还得自己对应，这不是自己给自己找麻烦嘛！就直接让 Python 给你平净二字，让你直接渲染不就好了？  
      riskLevel: 'low',
      keywords: ['学生', '选课系统'],
      reason: '平静介绍，正常陈述'
    },
    {
      id: '2',
      start: 18,
      end: 42,
      text: '说实话，这个系统真的让人很失望。每次选课的时候都会崩溃，根本登不上去。',
      content: '说实话，这个系统真的让人很失望。每次选课的时候都会崩溃，根本登不上去。',
      emotion: 'serious',
      riskLevel: 'medium',
      keywords: ['失望', '崩溃'],
      reason: '表达不满，涉及系统问题'
    },
    {
      id: '3',
      start: 42,
      end: 68,
      text: '学校的选课系统简直就是个笑话！每到选课季就崩溃，这是什么垃圾服务器？！',
      content: '学校的选课系统简直就是个笑话！每到选课季就崩溃，这是什么垃圾服务器？！',
      emotion: 'angry',
      riskLevel: 'high',
      keywords: ['笑话', '垃圾'],
      reason: '情绪激烈，使用极端词汇批评学校'
    },
    {
      id: '4',
      start: 68,
      end: 98,
      text: '好多热门课根本抢不到，有些同学为了选上课都得半夜爬起来盯着电脑，这合理吗？',
      content: '好多热门课根本抢不到，有些同学为了选上课都得半夜爬起来盯着电脑，这合理吗？',
      emotion: 'serious',
      riskLevel: 'medium',
      keywords: ['抢不到', '热门课'],
      reason: '持续表达不满，可能引发其他学生共鸣'
    },
    {
      id: '5',
      start: 98,
      end: 125,
      text: '希望学校教务处能够重视这个问题，不要再让学生们为选课焦虑了，我们的诉求很简单...',
      content: '希望学校教务处能够重视这个问题，不要再让学生们为选课焦虑了，我们的诉求很简单...',
      emotion: 'calm',
      riskLevel: 'low',
      keywords: ['教务处', '诉求'],
      reason: '理性表达诉求，语气缓和'
    },
    {
      id: '6',
      start: 125,
      end: 155,
      text: '如果你也是北大的学生，如果你也有同样的经历，请点赞、转发，让更多人看到！',
      content: '如果你也是北大的学生，如果你也有同样的经历，请点赞、转发，让更多人看到！',
      emotion: 'tense',
      riskLevel: 'medium',
      keywords: ['点赞', '转发'],
      reason: '呼吁传播，有一定传播风险'
    },
    {
      id: '7',
      start: 155,
      end: 195,
      text: '最后想说，希望能引起相关部门的注意，也希望更多的同学能够看到这个视频，了解真实情况。',
      content: '最后想说，希望能引起相关部门的注意，也希望更多的同学能够看到这个视频，了解真实情况。',
      emotion: 'calm',
      riskLevel: 'low',
      keywords: ['相关部门', '同学'],
      reason: '结尾总结，语气平和'
    }
  ],

  // ========== 11. 时间轴数据 ==========
  timelineData: {
    // 11.1 视频风险点
    videoRisks: [
      {
        time: 5,⬛这个视频的时间没有分清是起始还是结束。最好分一下吧。 你看下面那个音频情绪人家都能分。 你这视频也要分。这样才能清楚啊。 你本身就是一个线性的图。它是连续的。你肯定要给出时间段（首末时间点）而不是单个时间点。  
        riskLevel: 'low',
        reason: '检测到学生宿舍场景',
        sceneType: 'dormitory'⬛这又是什么鬼啊？为什么要加这个字段？ 
⬛还有，为什么没有数值字段（intensity）？那为什么现在的这个浏览器二维图中会有这个百分比字段？ 你是不是又引用错地方了？你引用了哪个变量了？  
      },
      {
        time: 35,
        riskLevel: 'high',
        reason: '检测到愤怒表情和激烈手势',
        sceneType: 'emotion_anger'
      },
      {
        time: 45,
        riskLevel: 'medium',
        reason: 'OCR识别到学校选课系统界面截图',
        sceneType: 'screen_capture'
      }
    ],

    // 11.2 音频情绪
    audioEmotions: [
      {
        start: 0,
        end: 15,
        emotion: 'calm',
        intensity: 0.3,
        reason: '语音平稳，无明显情绪波动'
      },
      {
        start: 15,
        end: 42,
        emotion: 'calm',
        intensity: 0.4,
        reason: '语速正常，情绪稳定'
      },
      {
        start: 42,
        end: 68,
        emotion: 'angry',
        intensity: 0.9,
        reason: '检测到愤怒咆哮，音量突然增大'
      },
      {
        start: 68,
        end: 95,
        emotion: 'tense',
        intensity: 0.7,
        reason: '语气紧张激动，音调升高'
      },
      {
        start: 95,
        end: 125,
        emotion: 'tense',
        intensity: 0.6,
        reason: '情绪持续紧张状态'
      },
      {
        start: 125,
        end: 155,
        emotion: 'calm',
        intensity: 0.4,
        reason: '情绪逐渐平复'
      }
    ],
    ⬛你的文本信息呢？你文本的文字和开头时间节点错误地引用了之前的transcriptSegments，那你数值百分比又是引用了哪个变量？估计你又乱引用。 

⬛还有就是，你的当前时间戳的总风险指数是不是动态的，根据视频、音频、文本数据计算出来的？如果是动态计算的，那就没问题。  但我害怕你是直接用了 Mock 数字。  因为你之前那些对象数据都是这么干的。我不是很相信你了。 

    // 11.3 雷达图时间段数据（6个维度：身份置信、学校关联、负面情感、传播风险、影响范围、处置紧迫）
    radarByTime: [
      {
        timeStart: 0,
        timeEnd: 10,
        data: [85, 65, 15, 20, 25, 15],
        description: '自我介绍，明确学生身份'⬛没必要吧？我图中也没看到你显示它啊。 
      },
      {
        timeStart: 10,
        timeEnd: 20,
        data: [85, 80, 40, 35, 45, 30],
        description: '陈述问题，涉及学校系统'
      },
      {
        timeStart: 20,
        timeEnd: 30,
        data: [85, 95, 88, 70, 85, 75],
        description: '情绪激动，强烈批评学校'
      },
      {
        timeStart: 30,
        timeEnd: 40,
        data: [85, 90, 65, 55, 70, 50],
        description: '持续不满，可能引发共鸣'
      },
      {
        timeStart: 40,
        timeEnd: 50,
        data: [85, 85, 35, 40, 50, 35],
        description: '提出诉求，语气缓和'
      },
      {
        timeStart: 50,
        timeEnd: 999,
        data: [85, 80, 25, 45, 40, 25],
        description: '呼吁传播，有一定传播风险'
      }
还有就是，你这个当前风险分又是怎么算出来的？你最好是动态地根据公式算出来的而不是mock。
还有一个问题就是，你雷达图的当前风险分和你二维线性图悬浮上去的悬浮窗口的当前风险指数两个数值应该一样才对。 
这个问题详细解决一下，待会儿。
    ]
  },

  // ========== 12. 辅助分析数据 ==========
  // 12.1 风险证据列表（用于左侧证据展示，与台词转录不同）
      ⬛我浏览器中显示的这个riskEvidences，就是语音转文字与风险定位中显示的东西，而不是transcriptSegments，就很离谱啊。 
  riskEvidences: [
    {
      id: 'evidence-1',⬛这是让 v-for 使用 :Key 吗？ 
      time: '00:05-00:10',⬛这又有必要吗？下面不是有两个时间戳吗？那这个可以动态生成，还需要 mock 吗？ 
      timeSeconds: 5,
      timeEndSeconds: 10,
      content: '大家好，我是今天的视频发布者，主要想聊聊最近发生的一些事情...',
      riskLevel: 'low',
      imageUrl: 'https://images.unsplash.com/photo-1523050854058-8df90110c9f1?w=800&h=450&fit=crop',⬛这个用不上吧？本来就是字幕对应的。左边不就有视频了吗？还看imageUrl看什么？ 
      boxStyle: { top: '0%', left: '0%', width: '0%', height: '0%' },⬛这是什么东西啊？不懂。 
      label: '',
      confidence: 0,⬛这个地方你帮我思考一下，最好要不要label 和 confidence 放到同一个对象里面，这样能防止了忘记要同时填入 **libre** 和 **confidence** 了。 。 
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
    identityLabel: '疑似在校学生',⬛这也没用到啊。 
    confidence: 0.85,⬛这也没用到吧。 
    matchSource: '语音中自称"北大计算机系学生"，检测到校园场景',⬛这个也没用到啊。 
    detectedKeywords: [⬛这个是内容关键词上面的，也就是视频栏中的。 如果里面所有的元素都不存在，其数组为空，那么，“内容关键词”这五个字及图标就不能显示出来。 
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
    staticFeatures: {⬛这个是视频主要人物。也是视频栏中的。 这里面的四个字段都要做成可选的。 如果没有填入或填入的为空串，那么图标就不能显示。看起来就像是没有这数据的（给其他数据让位置）。如果这四个字段都没有“直”或都为空，那么这一行整个的视频主要人物这六个字以及图标都不能显示出来。   
      gender: '男性',⬛这个要做一下对应。就如果值为“女性”，你这个浏览器中显示的图标也要是女性的图标
      ageRange: '20-24岁',
      voiceProfile: '年轻男性/情绪激动',
      clothing: '休闲装'
    },
    sceneType: '校园宿舍',⬛这个没用上吧？我都没看到啊。 
    sceneConfidence: 0.88⬛这个也没用上。 
  },

  // 12.3 CV视觉检测框
  cvDetections: [
    { id: 'face-1'⬛这个是让v-for使用:key的吗？, type: 'face'⬛这种预设值就没问题。因为这个前端已经写好了检测类型，就那几种。这倒是没问题的。但，你现在这个直接填字符串，我害怕将来可能对应出错。   , boundingBox: { x: 35, y: 20, width: 25, height: 35 }, confidence: 0.96, label: '平静表情', timeStart: 5, timeEnd: 15, metadata: ⬛这个…没有必要。你还是…删了吧？ { emotion: 'calm', emotionIcon: '😐', age: 22, gender: '男性' } },
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
    { id: 'scene-1'⬛这是让v-for使用:key的吗？, name: '教室', icon: '🏫'⬛这个要做成可选的，如果没有，就不能显示图标。 , confidence: 0.92, timeStart: 0, timeEnd: 20 },
    { id: 'scene-2', name: '宿舍', icon: '🛏️', confidence: 0.95, timeStart: 20, timeEnd: 50 },
    { id: 'scene-3', name: '校园室外', icon: '🌳', confidence: 0.88, timeStart: 50, timeEnd: 999 }
  ]
}

```