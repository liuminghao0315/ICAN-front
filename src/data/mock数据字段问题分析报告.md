# Mock数据字段问题分析报告

## 一、数据冗余与可计算字段问题

### 1.1 transcriptSegments vs riskEvidences
**问题描述：**
- `transcriptSegments` 定义了但未在界面中使用
- 实际使用的是 `riskEvidences`（在 `Analysis.vue` 第808行使用 `filteredRiskEvidence`）
- 两个数据结构功能重复，造成混淆

**代码证据：**
```typescript
// Analysis.vue 第808行
v-for="evidence in filteredRiskEvidence"  // 使用的是 riskEvidences

// Analysis.vue 第1078行
const mockTranscriptSegmentsData = mockAnalysisResult.transcriptSegments  // 定义了但未使用
const mockRiskEvidence = mockAnalysisResult.riskEvidences  // 实际使用
```

**建议：**
- 删除 `transcriptSegments`，统一使用 `riskEvidences`
- 或者明确两者的用途差异（如果确实需要两个）

### 1.2 text 和 content 字段重复
**问题描述：**
- `transcriptSegments` 中 `text` 和 `content` 字段值完全相同，纯冗余

**建议：**
- 删除 `content` 字段，只保留 `text`

### 1.3 多模态融合中的可计算字段
**问题描述：**
- `fusionFormula`: 字符串格式的公式，前端可以自己组合
- `finalScore`: 可以通过公式计算得出
- `resultValue`: 可以通过 `finalScore` 格式化得出（如 "85%"）
- `videoEvidenceCount`, `audioEvidenceCount`, `textEvidenceCount`: 可以通过统计 `evidences` 数组得出

**代码证据：**
```typescript
// mockAnalysisResult.ts 第665行
fusionFormula: '(82 × 0.3) + (91 × 0.5) + (85 × 0.2)',  // 可以前端生成
finalScore: 85,  // 可以前端计算
resultValue: '85%'  // 可以前端格式化
```

**建议：**
- 后端只提供原始数据：`videoScore`, `audioScore`, `textScore`, `videoWeight`, `audioWeight`, `textWeight`
- 前端负责计算和格式化

### 1.4 态度分析中的统计数据重复
**问题描述：**
- `attitude.statistics` 中的 `positive`, `neutral`, `negative`, `total` 可以通过 `evidences.attitude` 数组统计得出
- 且与 `schoolMentionCount`、`negativeMentionCount` 存在不一致（total=9，但schoolMentionCount=8）

**代码证据：**
```typescript
// mockAnalysisResult.ts 第345-351行
schoolMentionCount: 8,
negativeMentionCount: 4,
statistics: {
  positive: 3,
  neutral: 2,
  negative: 4,
  total: 9  // 与 schoolMentionCount=8 不一致
}
```

**建议：**
- 删除 `statistics` 字段，前端通过统计 `evidences.attitude` 得出
- 或者后端确保数据一致性

## 二、字段命名与枚举值问题

### 2.1 emotion 字段使用枚举值
**问题描述：**
- `emotion` 字段使用英文枚举值（'calm', 'angry', 'tense', 'serious'）
- 前端需要维护映射表转换为中文显示
- 扩展时需要修改前端代码

**代码证据：**
```typescript
// Analysis.vue 第2770行
const getEmotionText = (emotion: string | null | undefined): string => {
  const emotionMap: Record<string, string> = {
    'energetic': '充满活力',
    'calm': '平静',
    'happy': '开心',
    // ... 需要维护映射表
  }
}
```

**建议：**
- 后端直接返回中文显示文本，如 `emotionLabel: '平静'`
- 如果需要颜色区分，后端提供 `emotionColor` 或 `emotionBgColor`、`emotionTextColor`

### 2.2 riskLevel 使用枚举值判断颜色
**问题描述：**
- `riskLevel` 使用 'low'/'medium'/'high' 枚举值
- 但实际应该用数值（如 `riskScore`）来判断颜色

**代码证据：**
```typescript
// mockAnalysisResult.ts 第56行
riskLevel: 'medium',  // 枚举值
riskScore: 58,  // 数值
```

**建议：**
- 使用 `riskScore` 数值判断颜色和等级
- 或者后端直接提供 `riskColor` 字段

### 2.3 sentimentTowardSchool 枚举值
**问题描述：**
- `sentimentTowardSchool` 使用 'positive'/'neutral'/'negative'
- 但实际应该用 `sentimentIntensity` 数值来判断

**建议：**
- 删除 `sentimentTowardSchool`，使用 `sentimentIntensity` 判断
- 或者后端提供 `sentimentLabel`（已有）和 `sentimentColor`

## 三、数据一致性问题

### 3.1 雷达图风险分与二维线性图风险指数不一致
**问题描述：**
- 雷达图显示"当前风险分"（通过 `getCurrentRiskScore()` 计算）
- 二维线性图悬浮窗口显示"风险指数"（通过 `maxRisk` 计算）
- 两者计算方式不同，可能不一致

**代码证据：**
```typescript
// Analysis.vue 第3358行 - 雷达图风险分
const getCurrentRiskScore = (): number => {
  const radarData = currentRadarData.value
  const avgRisk = radarData.reduce((a, b) => a + b, 0) / radarData.length
  return Math.round(avgRisk)
}

// Analysis.vue 第2076行 - 二维图风险指数
const maxRisk = Math.max(data.videoScore, data.audioScore, data.textScore)
```

**建议：**
- 统一计算方式，都使用雷达图数据计算
- 或者后端提供统一的 `currentRiskScore` 字段

### 3.2 attitude.statistics 与 schoolMentionCount 不一致
**问题描述：**
- `statistics.total = 9`，但 `schoolMentionCount = 8`
- `statistics.negative = 4`，与 `negativeMentionCount = 4` 一致

**建议：**
- 确保数据一致性，或者删除 `statistics` 字段由前端统计

## 四、缺少的字段

### 4.1 视频风险点缺少时间段
**问题描述：**
- `videoRisks` 只有单个 `time` 时间点
- 但 `audioEmotions` 有 `start` 和 `end` 时间段
- 视频风险也应该有时间段

**代码证据：**
```typescript
// mockAnalysisResult.ts 第857行
videoRisks: [
  {
    time: 5,  // 只有单个时间点
    riskLevel: 'low',
    reason: '检测到学生宿舍场景'
  }
]

// 第878行 - audioEmotions 有时间段
audioEmotions: [
  {
    start: 0,
    end: 15,  // 有结束时间
    emotion: 'calm'
  }
]
```

**建议：**
- 改为 `timeStart` 和 `timeEnd`

### 4.2 缺少文本信息的时间轴数据
**问题描述：**
- 有 `videoRisks` 和 `audioEmotions`，但没有 `textRisks` 或类似的文本时间轴数据
- 二维线性图中需要文本数据

**建议：**
- 添加 `textRisks` 或 `textSegments` 时间轴数据

### 4.3 缺少颜色字段
**问题描述：**
- 前端需要根据数值判断颜色
- 应该由后端提供颜色值，避免前端维护枚举映射

**建议：**
- 添加 `backgroundColor`、`textColor` 等字段
- 或者提供 `colorScheme` 字段（如 'high-risk', 'medium-risk'）

## 五、未使用的字段

### 5.1 keyTopics 未使用
**问题描述：**
- `topic.keyTopics` 定义了但未在界面中使用

**建议：**
- 如果不需要，删除该字段
- 如果需要，在界面中展示

### 5.2 aiProfile 中部分字段未使用
**问题描述：**
- `identityStatus`、`identityLabel`、`confidence`、`matchSource` 未使用
- `sceneType`、`sceneConfidence` 未使用

**代码证据：**
```typescript
// mockAnalysisResult.ts 第1041-1044行
identityStatus: 'suspected',  // 未使用
identityLabel: '疑似在校学生',  // 未使用
confidence: 0.85,  // 未使用
matchSource: '语音中自称"北大计算机系学生"...',  // 未使用
```

**建议：**
- 确认是否需要这些字段，不需要则删除
- 或者明确使用场景

### 5.3 视频信息中的技术性参数
**问题描述：**
- `fileSize`、`resolution` 等技术性参数不需要
- `uploadTime` 字段名不合适（如果是自动爬虫场景）

**建议：**
- 删除 `fileSize`、`resolution`
- `uploadTime` 改为 `createTime` 或 `recordTime`

## 六、数据引用错误

### 6.1 transcriptSegments 的 reason 被错误引用
**问题描述：**
- 二维线性图悬浮窗口的文本内容使用了 `transcriptSegments` 的 `reason`
- 但实际应该使用 `riskEvidences` 或其他数据源

**代码证据：**
```typescript
// Analysis.vue 第2142行
${data.textSegment 
  ? `<div style="color: #666; font-size: 11px; line-height: 1.4;">${data.textSegment.reason}</div>` 
  : ...
}
```

**建议：**
- 检查数据引用是否正确
- 统一数据源

### 6.2 videoRisks 缺少 intensity 字段
**问题描述：**
- 二维图中显示百分比字段，但 `videoRisks` 中没有 `intensity` 字段
- `audioEmotions` 有 `intensity` 字段

**建议：**
- 添加 `intensity` 字段，或者明确数据来源

## 七、特殊问题

### 7.1 thumbnail: undefined
**问题描述：**
- 多个地方出现 `thumbnail: undefined`，无意义

**建议：**
- 如果不提供缩略图，直接不包含该字段
- 或者提供有效的 URL

### 7.2 resultType 和 resultLabel 硬编码问题
**问题描述：**
- `resultType: 'confidence'`、`resultLabel: '识别置信度'` 等字段
- 这些值应该是固定的，不需要后端提供

**建议：**
- 前端硬编码这些标签
- 后端只提供数值数据

### 7.3 多模态融合中 attitude 的特殊处理
**问题描述：**
- `attitude` 的融合数据中，`videoScore`、`audioScore`、`textScore` 都是 0
- `resultType: 'statistics'` 表示这是统计类型，不是融合类型

**建议：**
- 明确 `attitude` 不需要融合计算，只需要统计
- 删除无用的融合字段（videoScore 等为 0 的字段）

## 八、建议的优化方案

### 8.1 数据精简
1. 删除所有可计算的字段（finalScore、resultValue、fusionFormula 等）
2. 删除未使用的字段（keyTopics、identityStatus 等）
3. 删除冗余字段（content、statistics 等）

### 8.2 数据规范化
1. 统一使用数值判断颜色，而不是枚举值
2. 后端直接提供显示文本和颜色值
3. 确保数据一致性（total 与 count 一致）

### 8.3 字段补充
1. 添加时间段字段（timeStart、timeEnd）
2. 添加颜色字段（backgroundColor、textColor）
3. 添加文本时间轴数据

### 8.4 数据源统一
1. 明确 `transcriptSegments` 和 `riskEvidences` 的用途
2. 统一数据引用，避免混乱
3. 确保所有图表使用相同的数据源和计算方式

## 九、优先级建议

### 高优先级（必须修复）
1. 数据一致性问题（statistics 与 count 不一致）
2. 数据引用错误（reason 字段引用错误）
3. 雷达图与二维图风险分不一致

### 中优先级（建议修复）
1. 删除可计算字段
2. 删除未使用字段
3. 统一枚举值为显示文本

### 低优先级（可选优化）
1. 添加颜色字段
2. 优化字段命名
3. 补充缺失的时间段字段
