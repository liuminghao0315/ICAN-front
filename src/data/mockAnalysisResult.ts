/*
 * SynSight - 高校内容风险分析平台
 * Copyright (c) 2026 Liu Minghao. All rights reserved.
 */

export type Evidence = any
export type ModalityFusion = any
export type SceneInfo = any
export type TimelineEvent = any
export type SpeechEvent = any
export type VisualEvent = any
export type AudioEffectEvent = any
export type AnalysisResult = any

export const mockAnalysisResult: AnalysisResult = JSON.parse(String.raw`{
  "videoInfo": {
    "videoId": "vid-pku-course",
    "videoUrl": "https://videos.pexels.com/video-files/5940309/5940309-hd_1920_1080_25fps.mp4",
    "fileName": "北大选课系统深夜吐槽：热门课秒空与反馈失联.mp4",
    "duration": 52.0,
    "uploadSource": "网络采集",
    "description": "深夜宿舍口播，围绕热门课程秒空、系统高峰期崩溃与反馈链路失效展开持续吐槽，情绪张力高，具备明显学生圈层二次传播潜力。",
    "detectedKeywords": [
      { "word": "北大", "isUniversityRelated": true },
      { "word": "选课系统", "isUniversityRelated": false },
      { "word": "热门课", "isUniversityRelated": false },
      { "word": "教务处", "isUniversityRelated": true },
      { "word": "系统崩溃", "isUniversityRelated": false },
      { "word": "学生反馈", "isUniversityRelated": false }
    ],
    "mainCharacter": {
      "gender": "男性",
      "ageRange": "20-24岁",
      "clothing": "深色卫衣",
      "voiceProfile": "年轻男性 / 情绪压抑后集中爆发"
    },
    "sourceUrl": "https://www.douyin.com/video/7419201458890013997",
    "thumbnailUrl": "https://images.unsplash.com/photo-1513258496099-48168024aec0?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1280"
  },
  "identity": {
    "identityLabel": "疑似在校学生",
    "evidences": [
      { "timestamp": 5, "type": "video", "description": "宿舍环境背景：检测到典型学生宿舍布局（床铺、书桌、台灯）", "confidence": 82 },
      { "timestamp": 12, "type": "audio", "description": "语音识别：自称\"我是北大计算机学院学生\"", "confidence": 95 },
      { "timestamp": 18, "type": "audio", "description": "年轻人语速和语气：快速口语、使用学生群体常用语", "confidence": 88 },
      { "timestamp": 28, "type": "video", "description": "穿着打扮：休闲装，符合在校学生特征", "confidence": 78 },
      { "timestamp": 35, "type": "text", "description": "提及学生身份相关词汇", "confidence": 91, "keyword": "我们学生" },
      { "timestamp": 42, "type": "text", "description": "学生群体用语", "confidence": 85, "keyword": "同学们" }
    ],
    "modalityFusion": { "videoScore": 82, "audioScore": 91, "textScore": 85, "videoContribution": 25.5, "audioContribution": 45.5, "textContribution": 17.0, "finalScore": 88 }
  },
  "university": {
    "universityName": "北京大学",
    "evidences": [
      { "timestamp": 5, "type": "video", "description": "场景识别：检测到北京大学校园标识性建筑", "confidence": 90 },
      { "timestamp": 12, "type": "audio", "description": "明确提及\"北京大学\"", "confidence": 98 },
      { "timestamp": 18, "type": "audio", "description": "提及\"北大\"（北京大学简称）", "confidence": 95 },
      { "timestamp": 24, "type": "text", "description": "高频关键词", "confidence": 92, "keyword": "北京大学" },
      { "timestamp": 30, "type": "text", "description": "简称使用", "confidence": 90, "keyword": "北大" },
      { "timestamp": 38, "type": "audio", "description": "提及学校部门\"教务处\"", "confidence": 87 },
      { "timestamp": 45, "type": "video", "description": "OCR识别：屏幕上显示学校选课系统界面", "confidence": 85 }
    ],
    "modalityFusion": { "videoScore": 88, "audioScore": 95, "textScore": 92, "videoContribution": 18.4, "audioContribution": 38.0, "textContribution": 36.8, "finalScore": 93 }
  },
  "topic": {
    "topicCategory": "校园治理",
    "topicSubCategory": "选课制度吐槽",
    "evidences": [
      { "timestamp": 8, "type": "audio", "description": "讨论\"选课系统\"相关话题", "confidence": 95 },
      { "timestamp": 15, "type": "text", "description": "主题关键词", "confidence": 92, "keyword": "选课系统" },
      { "timestamp": 22, "type": "audio", "description": "提及\"系统崩溃\"等技术问题", "confidence": 88 },
      { "timestamp": 30, "type": "text", "description": "政策相关词汇", "confidence": 85, "keyword": "选课制度" },
      { "timestamp": 38, "type": "audio", "description": "讨论\"热门课抢不到\"等政策性问题", "confidence": 90 },
      { "timestamp": 46, "type": "text", "description": "学校管理部门", "confidence": 87, "keyword": "教务处" }
    ],
    "modalityFusion": { "videoScore": 85, "audioScore": 92, "textScore": 90, "videoContribution": 17.8, "audioContribution": 40.5, "textContribution": 36.0, "finalScore": 94 }
  },
  "attitude": {
    "evidences": [
      { "timestamp": 5, "type": "video", "description": "表情分析：检测到微笑表情", "confidence": 88, "sentimentScore": 88 },
      { "timestamp": 15, "type": "audio", "description": "语调分析：语气轻松愉快", "confidence": 85, "sentimentScore": 84 },
      { "timestamp": 25, "type": "text", "description": "正面情感词汇", "confidence": 90, "keyword": "喜欢", "sentimentScore": 76 },
      { "timestamp": 35, "type": "video", "description": "表情分析：检测到愤怒、失望表情", "confidence": 85, "sentimentScore": 81 },
      { "timestamp": 45, "type": "audio", "description": "语调分析：声调提高，语速加快，情绪激动", "confidence": 92, "sentimentScore": 92 },
      { "timestamp": 50, "type": "text", "description": "负面情感词汇", "confidence": 95, "keyword": "失望", "sentimentScore": 90 },
      { "timestamp": 32, "type": "text", "description": "批评性用语", "confidence": 88, "keyword": "不负责任", "sentimentScore": 72 },
      { "timestamp": 38, "type": "audio", "description": "持续的不满情绪表达（但语气相对平静）", "confidence": 90, "sentimentScore": 68 },
      { "timestamp": 46, "type": "text", "description": "客观描述问题", "confidence": 87, "keyword": "系统问题", "sentimentScore": 58 }
    ]
  },
  "opinionRisk": {
    "riskReason": "容易在高校社交圈层形成“共同遭遇”叙事，触发接力转发与情绪堆叠。",
    "evidences": [
      { "timestamp": 20, "type": "audio", "description": "情绪激动点：对学校的强烈批评", "confidence": 88 },
      { "timestamp": 28, "type": "text", "description": "可能引发共鸣的措辞", "confidence": 85, "keyword": "让人失望" },
      { "timestamp": 35, "type": "audio", "description": "呼吁性语句：可能引发跟风吐槽", "confidence": 82 },
      { "timestamp": 42, "type": "text", "description": "普遍性问题描述", "confidence": 80, "keyword": "大家都抢不到" },
      { "timestamp": 48, "type": "audio", "description": "希望传播：呼吁更多人看到此视频", "confidence": 78 }
    ],
    "modalityFusion": { "videoScore": 55, "audioScore": 62, "textScore": 58, "videoContribution": 11.6, "audioContribution": 26.0, "textContribution": 24.3, "finalScore": 62 }
  },
  "action": {
    "actionSuggestion": "限流观察",
    "actionDetail": "建议先完成人工复核，确认是否涉及失实指控，再决定是否进入公开传播链路。",
    "evidences": [
      { "timestamp": 20, "type": "audio", "description": "高风险时段：情绪最激动的片段", "confidence": 92 },
      { "timestamp": 28, "type": "text", "description": "关键负面词汇出现", "confidence": 88, "keyword": "失望" },
      { "timestamp": 35, "type": "video", "description": "可能需要人工复核的关键画面", "confidence": 85 },
      { "timestamp": 48, "type": "audio", "description": "传播风险点：呼吁他人关注", "confidence": 90 }
    ],
    "modalityFusion": { "videoScore": 70, "audioScore": 80, "textScore": 75, "videoContribution": 24.5, "audioContribution": 32.0, "textContribution": 18.8, "finalScore": 75 }
  },
  "timelineData": {
    "timeGranularity": 5,
    "videoRisks": [
      { "reason": "检测到学生宿舍场景，视频开场", "intensity": 0.12 },
      { "reason": "背景环境稳定，无明显风险画面", "intensity": 0.2 },
      { "reason": "正常陈述画面，表情平静", "intensity": 0.28 },
      { "reason": "开始出现不满表情", "intensity": 0.36 },
      { "reason": "检测到愤怒表情和激烈手势", "intensity": 0.62 },
      { "reason": "持续激动状态，肢体动作幅度大", "intensity": 0.68 },
      { "reason": "情绪仍较激动，但开始平复", "intensity": 0.58 },
      { "reason": "持续的不满情绪表达", "intensity": 0.52 },
      { "reason": "OCR识别到学校选课系统界面截图", "intensity": 0.46 },
      { "reason": "画面趋于平静，结束陈述", "intensity": 0.32 }
    ],
    "audioEmotions": [
      { "intensity": 0.14, "reason": "视频开场，无语音" },
      { "intensity": 0.22, "reason": "语音平稳，开始介绍" },
      { "intensity": 0.3, "reason": "语速正常，平静陈述" },
      { "intensity": 0.42, "reason": "语气开始严肃，表达不满" },
      { "intensity": 0.66, "reason": "检测到愤怒咆哮，音量突然增大" },
      { "intensity": 0.71, "reason": "持续愤怒情绪，语速加快" },
      { "intensity": 0.6, "reason": "语气紧张激动，音调升高" },
      { "intensity": 0.54, "reason": "情绪仍然紧张，但略有缓和" },
      { "intensity": 0.45, "reason": "情绪逐渐平复，语气严肃" },
      { "intensity": 0.3, "reason": "趋于平静，结束陈述" }
    ],
    "textRisks": [
      { "reason": "开场无语音，无文本风险", "intensity": 0.08 },
      { "reason": "平静介绍，正常陈述", "intensity": 0.18 },
      { "reason": "提及学生身份，陈述基本信息", "intensity": 0.24 },
      { "reason": "开始表达不满，涉及系统问题", "intensity": 0.38 },
      { "reason": "情绪激烈，使用极端词汇批评学校", "intensity": 0.63 },
      { "reason": "持续批评，出现煽动性词汇", "intensity": 0.67 },
      { "reason": "表达不满，可能引发共鸣", "intensity": 0.58 },
      { "reason": "持续表达不满情绪", "intensity": 0.5 },
      { "reason": "呼吁传播，有一定传播风险", "intensity": 0.43 },
      { "reason": "总结陈述，情绪平复", "intensity": 0.28 }
    ],
    "comprehensiveRisks": [
      { "intensity": 0.14 },
      { "intensity": 0.22 },
      { "intensity": 0.3 },
      { "intensity": 0.42 },
      { "intensity": 0.66 },
      { "intensity": 0.71 },
      { "intensity": 0.6 },
      { "intensity": 0.54 },
      { "intensity": 0.46 },
      { "intensity": 0.32 }
    ],
    "radarByTime": [
      { "data": [82,60,12,15,20,12] },
      { "data": [85,68,18,22,28,18] },
      { "data": [88,75,28,30,38,25] },
      { "data": [88,82,45,38,48,32] },
      { "data": [88,95,92,75,88,78] },
      { "data": [88,95,85,68,82,72] },
      { "data": [88,92,70,60,75,55] },
      { "data": [85,88,62,52,68,48] },
      { "data": [85,85,42,42,52,38] },
      { "data": [85,82,30,35,45,30] }
    ],
    "averageRadarData": [86,82,48,44,54,41]
  },
  "timelineEvents": [
    { "id": "visual-001", "modality": "visual", "startTime": 0, "endTime": 5, "riskScore": 55, "detectionType": "logo", "detectionLabel": "检测到北京大学校徽", "boundingBox": { "x": 70, "y": 25, "width": 15, "height": 15 }, "confidence": 95 },
    { "id": "speech-001", "modality": "speech", "startTime": 5, "endTime": 10, "riskScore": 20, "transcript": "今晚必须把这个事说清楚，北大的选课系统一到高峰期就像定时失灵，大家抢课全靠运气。", "keywords": ["今晚必须把这", "个事说清楚", "北大的选课系", "统一到高峰期"], "emotion": { "label": "平稳表达", "intensity": 0.26, "bgColor": "rgba(82, 196, 26, 0.16)", "textColor": "#52c41a" }, "confidence": 92 },
    { "id": "audio-001", "modality": "audio-effect", "startTime": 10, "endTime": 12, "riskScore": 58, "description": "检测到重物撞击声（疑似拍桌动作）", "intensity": 0.75, "confidence": 88 },
    { "id": "speech-002", "modality": "speech", "startTime": 12, "endTime": 15, "riskScore": 25, "transcript": "我是北大在校学生，这学期热门课又是秒空，系统卡在提交页面根本刷新不出来。", "keywords": ["我是北大在校", "学生", "这学期热门课", "又是秒空"], "emotion": { "label": "平稳表达", "intensity": 0.26, "bgColor": "rgba(82, 196, 26, 0.16)", "textColor": "#52c41a" }, "confidence": 95 },
    { "id": "visual-002", "modality": "visual", "startTime": 12, "endTime": 18, "riskScore": 60, "detectionType": "uniform", "detectionLabel": "检测到北大校服", "boundingBox": { "x": 30, "y": 45, "width": 35, "height": 50 }, "confidence": 89 },
    { "id": "speech-003", "modality": "speech", "startTime": 15, "endTime": 22, "riskScore": 95, "transcript": "如果只是技术波动我能理解，但问题是反馈窗口长期沉默，学生体验被完全放在最后一位。", "keywords": ["如果只是技术", "波动我能理解", "但问题是反馈", "窗口长期沉默"], "emotion": { "label": "高压表达", "intensity": 0.88, "bgColor": "rgba(245, 108, 108, 0.18)", "textColor": "#f56c6c" }, "confidence": 98 },
    { "id": "visual-003", "modality": "visual", "startTime": 16, "endTime": 20, "riskScore": 98, "detectionType": "ocr", "detectionLabel": "OCR敏感词：[抵制]", "boundingBox": { "x": 15, "y": 55, "width": 40, "height": 12 }, "confidence": 98 },
    { "id": "visual-004", "modality": "visual", "startTime": 20, "endTime": 22, "riskScore": 92, "detectionType": "face", "detectionLabel": "愤怒表情 + 过激手势", "boundingBox": { "x": 32, "y": 18, "width": 28, "height": 38 }, "confidence": 98 },
    { "id": "audio-002", "modality": "audio-effect", "startTime": 22, "endTime": 24, "riskScore": 90, "description": "检测到愤怒咆哮声，音量骤升", "intensity": 0.95, "confidence": 92 },
    { "id": "visual-005", "modality": "visual", "startTime": 24, "endTime": 28, "riskScore": 88, "detectionType": "banner", "detectionLabel": "检测到抗议性横幅标语", "boundingBox": { "x": 10, "y": 70, "width": 80, "height": 20 }, "confidence": 93 },
    { "id": "speech-004", "modality": "speech", "startTime": 25, "endTime": 32, "riskScore": 68, "transcript": "很多同学凌晨守着屏幕，最后只能看着系统转圈，这种治理方式真的让人非常失望。", "keywords": ["很多同学凌晨", "守着屏幕", "最后只能看着", "系统转圈"], "emotion": { "label": "审慎陈述", "intensity": 0.58, "bgColor": "rgba(230, 162, 60, 0.16)", "textColor": "#e6a23c" }, "confidence": 85 },
    { "id": "visual-006", "modality": "visual", "startTime": 30, "endTime": 34, "riskScore": 85, "detectionType": "gesture", "detectionLabel": "检测到过激肢体动作", "boundingBox": { "x": 35, "y": 40, "width": 30, "height": 35 }, "confidence": 87 },
    { "id": "speech-005", "modality": "speech", "startTime": 35, "endTime": 42, "riskScore": 72, "transcript": "我们不是为了制造情绪，而是想让学校看到真实使用压力，希望正式回应排课与系统容量的问题。", "keywords": ["我们不是为了", "制造情绪", "而是想让学校", "看到真实使用"], "emotion": { "label": "审慎陈述", "intensity": 0.58, "bgColor": "rgba(230, 162, 60, 0.16)", "textColor": "#e6a23c" }, "confidence": 91 },
    { "id": "visual-007", "modality": "visual", "startTime": 36, "endTime": 40, "riskScore": 70, "detectionType": "ocr", "detectionLabel": "OCR敏感词：[追究]", "boundingBox": { "x": 20, "y": 60, "width": 35, "height": 10 }, "confidence": 91 },
    { "id": "visual-008", "modality": "visual", "startTime": 42, "endTime": 44, "riskScore": 55, "detectionType": "ocr", "detectionLabel": "OCR识别：屏幕显示学校选课系统界面", "boundingBox": { "x": 5, "y": 10, "width": 90, "height": 70 }, "confidence": 85 },
    { "id": "speech-006", "modality": "speech", "startTime": 45, "endTime": 50, "riskScore": 35, "transcript": "如果这条视频能被更多同学看到，至少能把一线体验完整留下来，而不是继续被当成个例。", "keywords": ["如果这条视频", "能被更多同学", "看到", "至少能把一线"], "emotion": { "label": "平稳表达", "intensity": 0.26, "bgColor": "rgba(82, 196, 26, 0.16)", "textColor": "#52c41a" }, "confidence": 88 }
  ],
  "sceneRecognition": [
    { "id": "vid-pku-course-scene-1", "name": "宿舍口播", "icon": "🎥", "confidence": 0.86, "timeStart": 0, "timeEnd": 15 },
    { "id": "vid-pku-course-scene-2", "name": "电脑桌前录屏", "icon": "🏫", "confidence": 0.82, "timeStart": 15, "timeEnd": 30 },
    { "id": "vid-pku-course-scene-3", "name": "校园夜景切片", "icon": "🧭", "confidence": 0.78, "timeStart": 30, "timeEnd": 50 }
  ],
  "wordPacks": [
    {
      "id": "pack-campus-crisis",
      "name": "高校舆情高危词包",
      "description": "覆盖投诉、抵制、曝光、联合发声等高传播风险表达，适用于舆情跟进与人工复核场景。",
      "level": "high",
      "wordCount": 8,
      "words": [
        { "id": "pack-campus-crisis-word-1", "text": "抵制", "risk": "high" },
        { "id": "pack-campus-crisis-word-2", "text": "曝光", "risk": "high" },
        { "id": "pack-campus-crisis-word-3", "text": "联合发声", "risk": "high" },
        { "id": "pack-campus-crisis-word-4", "text": "系统崩溃", "risk": "high" },
        { "id": "pack-campus-crisis-word-5", "text": "失望透顶", "risk": "high" },
        { "id": "pack-campus-crisis-word-6", "text": "维权", "risk": "high" },
        { "id": "pack-campus-crisis-word-7", "text": "投诉升级", "risk": "high" },
        { "id": "pack-campus-crisis-word-8", "text": "舆论发酵", "risk": "high" }
      ]
    },
    {
      "id": "pack-governance",
      "name": "校园治理争议词包",
      "description": "适合选课、宿舍、后勤、食堂等治理议题的中高风险识别。",
      "level": "medium",
      "wordCount": 8,
      "words": [
        { "id": "pack-governance-word-1", "text": "后勤反馈", "risk": "medium" },
        { "id": "pack-governance-word-2", "text": "窗口差异", "risk": "medium" },
        { "id": "pack-governance-word-3", "text": "系统容量", "risk": "medium" },
        { "id": "pack-governance-word-4", "text": "治理回应", "risk": "high" },
        { "id": "pack-governance-word-5", "text": "学生体验", "risk": "high" },
        { "id": "pack-governance-word-6", "text": "管理问题", "risk": "high" },
        { "id": "pack-governance-word-7", "text": "公开解释", "risk": "high" },
        { "id": "pack-governance-word-8", "text": "价格波动", "risk": "high" }
      ]
    }
  ],
  "id": "result-pku-course",
  "taskId": "task-pku-course",
  "reportPdfUrl": "blob:http://localhost:5174/e556d952-3697-4f7a-8245-c55dbe233c5d",
  "isUniversityRelated": true,
  "gmtCreated": "2026-03-20T18:37:18.565Z"
}`)

export default mockAnalysisResult