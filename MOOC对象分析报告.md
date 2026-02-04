# mockAnalysisResult 对象使用情况分析报告

生成时间：2026-02-04

## 一、未使用的字段清单

### 1.1 videoInfo（视频基本信息）
- ❌ **manualTag**: 人工标签（可选字段）- 完全未使用
  - 当前值：`'校园舆情-选课系统'`
  - 建议：如果不需要可以删除，或者在报告视图中显示

### 1.2 identity（身份判定）
- ❌ **identityType**: 身份类型枚举值 - 完全未使用
  - 当前值：`'student'`
  - 说明：页面只使用了 `identityLabel`（"疑似在校学生"）
  - 建议：保留用于后端逻辑判断
  
- ❌ **evidenceCount**: 证据数量 - 完全未使用
  - 当前值：`6`
  - 说明：卡片显示的证据数量来自 `cardEvidencesMap.identity.length`（即 `evidences.identity` 数组长度）
  - **问题**：这里存在重复数据！

### 1.3 university（涉及高校）
- ❌ **universityId**: 高校ID - 完全未使用
  - 当前值：`'PKU_001'`
  - 建议：保留用于后端查询和数据关联
  
- ❌ **sceneDatabase**: 场景库版本 - 完全未使用
  - 当前值：`'V2.3.1'`
  - 建议：可在报告视图添加技术信息部分显示
  
- ❌ **evidenceCount**: 证据数量 - 完全未使用
  - 当前值：`7`
  - **问题**：重复数据！

### 1.4 topic（内容主题）
- ❌ **evidenceCount**: 证据数量 - 完全未使用
  - 当前值：`6`
  - **问题**：重复数据！

### 1.5 attitude（对学校态度）
- ✅ **sentimentLabel**: 情感标签 - 已使用（在卡片中显示）
  - 当前值：`'负面/不满'`
  
- ❌ **evidenceCount**: 证据数量 - 完全未使用
  - 当前值：`9`
  - **问题**：重复数据！

### 1.6 opinionRisk（潜在舆论风险）
- ❌ **spreadPotentialLabel**: 传播潜力标签 - 完全未使用
  - 当前值：`'较易传播'`（由Python根据 spreadPotential=6.5 判断）
  - 说明：页面只显示了数值 `spreadPotential: 6.5`
  - 建议：**应该使用这个字段而不是只显示数值！**
  
- ❌ **evidenceCount**: 证据数量 - 完全未使用
  - 当前值：`5`
  - **问题**：重复数据！

### 1.7 action（处置建议）
- ❌ **evidenceCount**: 证据数量 - 完全未使用
  - 当前值：`4`
  - **问题**：重复数据！

---

## 二、证据数量显示的数据来源问题

### 当前实现
在交互式分析视图中，卡片上显示的证据数量使用的是：
```typescript
cardEvidencesMap.identity.length  // 实际 evidences.identity 数组的长度
```

### 数据冗余问题
每个维度都有两个证据数量：
1. **直接字段**：`identity.evidenceCount` (值为 6)
2. **数组长度**：`evidences.identity.length` (实际数组中有 6 个元素)

**示例对比**：
```typescript
// mockAnalysisResult 中的定义
identity: {
  evidenceCount: 6  // ❌ 未使用
}
evidences: {
  identity: [/* 6个元素 */]  // ✅ 使用 array.length
}
```

### 建议
- **方案1（推荐）**：删除所有 `evidenceCount` 字段，统一使用数组长度
  - 优点：单一数据源，不会出现不一致
  - 缺点：需要删除字段
  
- **方案2**：使用 `evidenceCount` 字段而不是计算数组长度
  - 优点：性能更好（不需要计算长度）
  - 缺点：需要确保数据一致性

---

## 三、硬编码数据检查

### ✅ 所有显示数据均来自 mockAnalysisResult

经过全面检查，分析页面中显示的所有业务数据都来自 `mockAnalysisResult` 对象，**没有发现硬编码的业务数据**。

### 页面中的固定文本（非硬编码问题）
以下是合理的UI固定文本，不属于硬编码问题：
- "以下传播相关数据为AI预测值"
- "风险分 = 身份置信×0.15 + 学校关联×0.20 + 负面情感×0.30 + 传播×0.15 + 影响×0.10 + 紧迫度×0.10"
- 雷达图维度名称：`['身份置信度', '学校关联度', '负面情感度', '传播风险', '影响范围', '处置紧迫度']`

---

## 四、字段使用对比表

| 字段路径 | 是否使用 | 使用位置 | 当前值 | 建议 |
|---------|---------|---------|--------|------|
| **videoInfo** | | | | |
| └─ videoId | ✅ | 可能用于API | 'video_20240201_001' | 保留 |
| └─ fileName | ✅ | 交互视图/报告 | '北大学生吐槽...' | 保留 |
| └─ fileSize | ✅ | 可能用于显示 | 128MB | 保留 |
| └─ duration | ✅ | 交互视图/报告 | 195秒 | 保留 |
| └─ resolution | ✅ | 报告视图 | '1920×1080' | 保留 |
| └─ uploadTime | ✅ | 报告视图 | '2024-02-01...' | 保留 |
| └─ uploadSource | ✅ | 交互视图/报告 | '本地上传' | 保留 |
| └─ analysisStatus | ✅ | 报告视图 | '分析完成' | 保留 |
| └─ manualTag | ❌ | **未使用** | '校园舆情-选课系统' | 考虑删除或显示 |
| └─ description | ✅ | 交互视图/报告 | 'AI分析摘要' | 保留 |
| **identity** | | | | |
| └─ identityType | ❌ | **未使用** | 'student' | 保留（后端用）|
| └─ identityLabel | ✅ | 交互视图/报告 | '疑似在校学生' | 保留 |
| └─ confidence | ✅ | 交互视图/报告 | 0.85 | 保留 |
| └─ evidenceCount | ❌ | **未使用** | 6 | **考虑删除** |
| **university** | | | | |
| └─ universityName | ✅ | 交互视图/报告 | '北京大学' | 保留 |
| └─ universityId | ❌ | **未使用** | 'PKU_001' | 保留（后端用）|
| └─ logoConfidence | ✅ | 交互视图/报告 | 0.92 | 保留 |
| └─ sceneDatabase | ❌ | **未使用** | 'V2.3.1' | 考虑在报告显示 |
| └─ evidenceCount | ❌ | **未使用** | 7 | **考虑删除** |
| **topic** | | | | |
| └─ topicCategory | ✅ | 交互视图/报告 | '校园政策' | 保留 |
| └─ topicSubCategory | ✅ | 交互视图/报告 | '选课制度吐槽' | 保留 |
| └─ keyTopics | ✅ | 使用中 | [...] | 保留 |
| └─ evidenceCount | ❌ | **未使用** | 6 | **考虑删除** |
| **attitude** | | | | |
| └─ sentimentTowardSchool | ✅ | 交互视图/报告 | 'negative' | 保留 |
| └─ sentimentLabel | ✅ | 卡片显示 | '负面/不满' | 保留 |
| └─ sentimentIntensity | ✅ | 使用中 | 0.72 | 保留 |
| └─ schoolMentionCount | ✅ | 使用中 | 8 | 保留 |
| └─ negativeMentionCount | ✅ | 使用中 | 4 | 保留 |
| └─ statistics | ✅ | 交互视图/报告 | {...} | 保留 |
| └─ evidenceCount | ❌ | **未使用** | 9 | **考虑删除** |
| **opinionRisk** | | | | |
| └─ riskLevel | ✅ | 交互视图/报告 | 'medium' | 保留 |
| └─ riskLabel | ✅ | 交互视图/报告 | '中等风险' | 保留 |
| └─ riskScore | ✅ | 交互视图/报告 | 58 | 保留 |
| └─ riskReason | ✅ | 使用中 | '可能引发...' | 保留 |
| └─ spreadPotential | ✅ | 使用中 | 6.5 | 保留 |
| └─ spreadPotentialLabel | ❌ | **未使用** | '较易传播' | **应该使用！**|
| └─ potentialImpacts | ✅ | 使用中 | [...] | 保留 |
| └─ evidenceCount | ❌ | **未使用** | 5 | **考虑删除** |
| **action** | | | | |
| └─ actionSuggestion | ✅ | 交互视图/报告 | '谨慎发布' | 保留 |
| └─ actionDetail | ✅ | 使用中 | '建议人工复核...' | 保留 |
| └─ urgencyLevel | ✅ | 交互视图/报告 | 75 | 保留 |
| └─ evidenceCount | ❌ | **未使用** | 4 | **考虑删除** |

---

## 五、核心问题总结

### 🔴 严重问题
1. **spreadPotentialLabel 未使用但应该使用**
   - 当前只显示数值 `6.5`，但Python已经判断出了标签 `'较易传播'`
   - 用户看到 `6.5` 可能不知道这代表什么，应该显示 `'较易传播 (6.5)'`

### 🟡 数据冗余问题
2. **所有 evidenceCount 字段都未使用**
   - 6个维度共有6个 `evidenceCount` 字段
   - 实际使用的是 `evidences.[dimension].length`
   - 建议删除这些冗余字段

### 🟢 可优化项
3. **manualTag 和 sceneDatabase 未显示**
   - 这些是有用的元数据，可以考虑在报告视图中显示

---

## 六、修复建议

### 优先级1（立即修复）
```typescript
// 在显示传播潜力时，使用 spreadPotentialLabel
// 位置：Analysis.vue 中的传播潜力显示部分
// 修改前：
{{ mockOpinionRisk.spreadPotential }}

// 修改后：
{{ mockOpinionRisk.spreadPotentialLabel }} ({{ mockOpinionRisk.spreadPotential }})
// 或者：{{ mockAnalysisResult.opinionRisk.spreadPotentialLabel }}
```

### 优先级2（数据清理）
```typescript
// 删除所有未使用的 evidenceCount 字段
// 或者改为使用这些字段而不是计算数组长度

// 方案1：删除字段（推荐）
export interface IdentityAnalysis {
  identityType: 'student' | 'alumni' | 'staff' | 'unrelated' | 'unknown'
  identityLabel: string
  confidence: number
  // evidenceCount: number  // ❌ 删除
}

// 方案2：使用字段
<span class="evidence-badge">({{ mockAnalysisResult.identity.evidenceCount }})</span>
// 而不是：
<span class="evidence-badge">({{ cardEvidencesMap.identity.length }})</span>
```

### 优先级3（功能增强）
```typescript
// 在报告视图添加显示
<div class="info-item" v-if="analysisData.videoInfo.manualTag">
  <span class="info-label">人工标签</span>
  <span class="info-value">{{ analysisData.videoInfo.manualTag }}</span>
</div>

<div class="info-item">
  <span class="info-label">场景库版本</span>
  <span class="info-value">{{ analysisData.university.sceneDatabase }}</span>
</div>
```

---

## 七、验证清单

- [x] 检查所有 mockAnalysisResult 顶级字段是否被使用
- [x] 检查所有嵌套字段是否被使用
- [x] 检查是否有硬编码的业务数据
- [x] 对比 Analysis.vue 和 ReportView.vue 的使用情况
- [x] 生成完整的字段使用对比表
- [ ] 修复 spreadPotentialLabel 未使用的问题
- [ ] 决定是否删除 evidenceCount 字段
- [ ] 决定是否显示 manualTag 和 sceneDatabase

---

## 八、结论

✅ **数据来源检查：PASS**
- 所有业务数据都来自 mockAnalysisResult 对象
- 没有发现硬编码的业务数据

⚠️ **未使用字段：11个**
- 1个应该使用但未使用（spreadPotentialLabel）
- 6个冗余字段（evidenceCount × 6）
- 4个可选元数据字段（manualTag, universityId, sceneDatabase, identityType）

🎯 **建议优先修复**
1. 立即使用 `spreadPotentialLabel` 字段
2. 清理 `evidenceCount` 冗余字段
3. 考虑显示元数据字段（manualTag, sceneDatabase）
