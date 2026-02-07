<template>
  <div class="report-view">
    <div class="report-container">
      
      <!-- 1. 报告头部 -->
      <header class="report-header">
        <div class="header-left">
          <h1 class="report-title">{{ data.videoInfo.fileName }}</h1>
          <div class="archive-info">
            <div class="info-item">
              <span class="label">视频编号：</span>
              <span class="value">{{ data.videoInfo.videoId }}</span>
            </div>
            <div class="info-item">
              <span class="label">视频时长：</span>
              <span class="value">{{ formatDuration(data.videoInfo.duration) }}</span>
            </div>
            <div class="info-item">
              <span class="label">来源渠道：</span>
              <span class="value">{{ data.videoInfo.uploadSource }}</span>
            </div>
          </div>
        </div>
        <div class="header-right">
          <div class="final-conclusion" :class="getConclusionClass()">
            <div class="conclusion-label">最终结论</div>
            <div class="conclusion-value">{{ data.action.actionSuggestion }}</div>
            <div class="conclusion-detail">{{ data.action.actionDetail }}</div>
          </div>
        </div>
      </header>

      <!-- 身份认定结论区 -->
      <section class="identity-conclusion-section">
        <div class="identity-conclusion-box">
          <div class="conclusion-item">
            <div class="conclusion-icon identity-icon">👤</div>
            <div class="conclusion-info">
              <div class="conclusion-title">身份判定</div>
              <div class="conclusion-result">{{ data.identity.identityLabel }}</div>
              <div class="conclusion-meta">置信度 {{ data.identity.modalityFusion.finalScore }}%</div>
            </div>
          </div>
          <div class="conclusion-divider"></div>
          <div class="conclusion-item">
            <div class="conclusion-icon university-icon">🏛️</div>
            <div class="conclusion-info">
              <div class="conclusion-title">涉及高校</div>
              <div class="conclusion-result">{{ data.university.universityName }}</div>
              <div class="conclusion-meta">关联度 {{ data.university.modalityFusion.finalScore }}%</div>
            </div>
          </div>
        </div>
      </section>

      <!-- 2. 视频概览 -->
      <section class="report-section">
        <h2 class="section-title">一、视频概览</h2>
        
        <div class="overview-content">
          <!-- AI摘要 -->
          <div class="overview-item" v-if="data.videoInfo.description">
            <div class="item-label">AI内容摘要</div>
            <div class="item-value summary-text">{{ data.videoInfo.description }}</div>
          </div>

          <!-- 人物特征 -->
          <div class="overview-item" v-if="data.videoInfo.mainCharacter">
            <div class="item-label">人物特征</div>
            <div class="character-grid">
              <div class="char-item" v-if="data.videoInfo.mainCharacter.gender">
                <span class="char-label">性别：</span>
                <span>{{ data.videoInfo.mainCharacter.gender }}</span>
              </div>
              <div class="char-item" v-if="data.videoInfo.mainCharacter.ageRange">
                <span class="char-label">年龄段：</span>
                <span>{{ data.videoInfo.mainCharacter.ageRange }}</span>
              </div>
              <div class="char-item" v-if="data.videoInfo.mainCharacter.voiceProfile">
                <span class="char-label">语音特征：</span>
                <span>{{ data.videoInfo.mainCharacter.voiceProfile }}</span>
              </div>
              <div class="char-item" v-if="data.videoInfo.mainCharacter.clothing">
                <span class="char-label">着装：</span>
                <span>{{ data.videoInfo.mainCharacter.clothing }}</span>
              </div>
            </div>
          </div>

          <!-- 关键词云 -->
          <div class="overview-item" v-if="data.videoInfo.detectedKeywords && data.videoInfo.detectedKeywords.length > 0">
            <div class="item-label">检测到的关键词</div>
            <div class="keywords-cloud">
              <span 
                v-for="(kw, idx) in data.videoInfo.detectedKeywords" 
                :key="idx" 
                class="keyword-tag"
                :class="{ 'university-keyword': kw.isUniversityRelated }">
                {{ kw.word }}
              </span>
            </div>
          </div>
        </div>
      </section>

      <!-- 3. 风险画像 -->
      <section class="report-section">
        <h2 class="section-title">二、风险画像</h2>
        
        <div class="risk-portrait">
          <!-- 全局雷达图 -->
          <div class="portrait-item portrait-left">
            <h3 class="subsection-title">综合风险雷达图</h3>
            <div class="radar-chart" ref="radarChartRef"></div>
          </div>

          <!-- 模态贡献比 -->
          <div class="portrait-item portrait-right">
            <h3 class="subsection-title">多模态分析贡献度</h3>
            <div class="modality-contribution-compact">
              <!-- 视频模态 -->
              <div class="contribution-row">
                <div class="contribution-label">
                  <span class="modality-icon-semantic video-semantic">👁</span>
                  <span class="modality-dot video-dot"></span>
                  <span class="modality-text">视频模态</span>
                </div>
                <div class="contribution-progress-compact">
                  <div class="progress-bar-compact video-bar" :style="{ width: data.action.modalityFusion.videoContribution + '%' }"></div>
                </div>
                <div class="contribution-metrics">
                  <span class="metric-score">{{ data.action.modalityFusion.videoScore }}</span>
                  <span class="metric-percent">{{ data.action.modalityFusion.videoContribution.toFixed(1) }}%</span>
                </div>
              </div>
              
              <!-- 音频模态 -->
              <div class="contribution-row">
                <div class="contribution-label">
                  <span class="modality-icon-semantic audio-semantic">🎤</span>
                  <span class="modality-dot audio-dot"></span>
                  <span class="modality-text">音频模态</span>
                </div>
                <div class="contribution-progress-compact">
                  <div class="progress-bar-compact audio-bar" :style="{ width: data.action.modalityFusion.audioContribution + '%' }"></div>
                </div>
                <div class="contribution-metrics">
                  <span class="metric-score">{{ data.action.modalityFusion.audioScore }}</span>
                  <span class="metric-percent">{{ data.action.modalityFusion.audioContribution.toFixed(1) }}%</span>
                </div>
              </div>
              
              <!-- 文本模态 -->
              <div class="contribution-row">
                <div class="contribution-label">
                  <span class="modality-icon-semantic text-semantic">T</span>
                  <span class="modality-dot text-dot"></span>
                  <span class="modality-text">文本模态</span>
                </div>
                <div class="contribution-progress-compact">
                  <div class="progress-bar-compact text-bar" :style="{ width: data.action.modalityFusion.textContribution + '%' }"></div>
                </div>
                <div class="contribution-metrics">
                  <span class="metric-score">{{ data.action.modalityFusion.textScore }}</span>
                  <span class="metric-percent">{{ data.action.modalityFusion.textContribution.toFixed(1) }}%</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- 4. 风险走势 -->
      <section class="report-section">
        <h2 class="section-title">三、风险走势分析</h2>
        <div class="risk-trend-container">
          <div class="trend-chart" ref="trendChartRef"></div>
        </div>
        
        <!-- 风险峰值分析 -->
        <div class="risk-peak-analysis" :class="{ 'extreme-risk': riskPeakAnalysis.peakIntensity >= 0.9 }">
          <div class="peak-indicator">{{ riskPeakAnalysis.peakIntensity >= 0.9 ? '🚨' : '⚠️' }}</div>
          <div class="peak-content">
            <strong v-if="riskPeakAnalysis.peakIntensity >= 0.9" class="extreme-warning">【极高风险红色预警】</strong>
            <strong v-else>风险峰值分析：</strong>
            本视频风险峰值出现在 <strong>{{ riskPeakAnalysis.peakTime }}</strong>，
            风险强度达到 <strong>{{ (riskPeakAnalysis.peakIntensity * 100).toFixed(1) }}%</strong>，
            主要由 <strong>{{ riskPeakAnalysis.triggerEvent }}</strong> 触发。
          </div>
        </div>
      </section>

      <!-- 5. 维度详情 -->
      <section class="report-section dimensions-section">
        <h2 class="section-title">四、六大维度分析详情</h2>
        
        <div class="dimensions-grid">
          <!-- 身份判定 -->
          <div class="dimension-card">
            <div class="card-header">
              <h3 class="card-title">1. 身份判定</h3>
              <div class="card-score">置信度：{{ data.identity.modalityFusion.finalScore }}%</div>
            </div>
            <div class="card-content">
              <div class="conclusion-row">
                <span class="conclusion-label">判定结果：</span>
                <span class="conclusion-value">{{ data.identity.identityLabel }}</span>
              </div>
              <div class="modality-scores">
                <div class="score-item">视频：<span class="score-value">{{ data.identity.modalityFusion.videoScore }}</span></div>
                <div class="score-item">音频：<span class="score-value">{{ data.identity.modalityFusion.audioScore }}</span></div>
                <div class="score-item">文本：<span class="score-value">{{ data.identity.modalityFusion.textScore }}</span></div>
              </div>
              <div class="evidence-summary">证据数量：{{ data.identity.evidences.length }} 条</div>
            </div>
          </div>

          <!-- 涉及高校 -->
          <div class="dimension-card">
            <div class="card-header">
              <h3 class="card-title">2. 涉及高校</h3>
              <div class="card-score">关联度：{{ data.university.modalityFusion.finalScore }}%</div>
            </div>
            <div class="card-content">
              <div class="conclusion-row">
                <span class="conclusion-label">识别结果：</span>
                <span class="conclusion-value">{{ data.university.universityName }}</span>
              </div>
              <div class="modality-scores">
                <div class="score-item">视频：<span class="score-value">{{ data.university.modalityFusion.videoScore }}</span></div>
                <div class="score-item">音频：<span class="score-value">{{ data.university.modalityFusion.audioScore }}</span></div>
                <div class="score-item">文本：<span class="score-value">{{ data.university.modalityFusion.textScore }}</span></div>
              </div>
              <div class="evidence-summary">证据数量：{{ data.university.evidences.length }} 条</div>
            </div>
          </div>

          <!-- 内容主题 -->
          <div class="dimension-card">
            <div class="card-header">
              <h3 class="card-title">3. 内容主题</h3>
              <div class="card-score">相关度：{{ data.topic.modalityFusion.finalScore }}%</div>
            </div>
            <div class="card-content">
              <div class="conclusion-row">
                <span class="conclusion-label">主题分类：</span>
                <span class="conclusion-value">{{ data.topic.topicCategory }}</span>
              </div>
              <div class="conclusion-row">
                <span class="conclusion-label">细分主题：</span>
                <span class="conclusion-value">{{ data.topic.topicSubCategory }}</span>
              </div>
              <div class="modality-scores">
                <div class="score-item">视频：<span class="score-value">{{ data.topic.modalityFusion.videoScore }}</span></div>
                <div class="score-item">音频：<span class="score-value">{{ data.topic.modalityFusion.audioScore }}</span></div>
                <div class="score-item">文本：<span class="score-value">{{ data.topic.modalityFusion.textScore }}</span></div>
              </div>
              <div class="evidence-summary">证据数量：{{ data.topic.evidences.length }} 条</div>
            </div>
          </div>

          <!-- 态度分析（特殊处理） -->
          <div class="dimension-card">
            <div class="card-header">
              <h3 class="card-title">4. 对学校态度分析</h3>
            </div>
            <div class="card-content">
              <div class="attitude-distribution">
                <div class="distribution-item positive">
                  <div class="dist-label">正面</div>
                  <div class="dist-value">{{ attitudeStats.positive }}条 ({{ attitudeStats.positivePercent }}%)</div>
                </div>
                <div class="distribution-item neutral">
                  <div class="dist-label">中性</div>
                  <div class="dist-value">{{ attitudeStats.neutral }}条 ({{ attitudeStats.neutralPercent }}%)</div>
                </div>
                <div class="distribution-item negative">
                  <div class="dist-label">负面</div>
                  <div class="dist-value">{{ attitudeStats.negative }}条 ({{ attitudeStats.negativePercent }}%)</div>
                </div>
              </div>
              <div class="evidence-summary">证据总数：{{ data.attitude.evidences.length }} 条</div>
            </div>
          </div>

          <!-- 潜在舆论风险 -->
          <div class="dimension-card">
            <div class="card-header">
              <h3 class="card-title">5. 潜在舆论风险</h3>
              <div class="card-score" :class="getRiskLevelClass(data.opinionRisk.modalityFusion.finalScore)">
                风险值：{{ data.opinionRisk.modalityFusion.finalScore }}%
              </div>
            </div>
            <div class="card-content">
              <div class="conclusion-row">
                <span class="conclusion-label">风险原因：</span>
                <span class="conclusion-value">{{ data.opinionRisk.riskReason }}</span>
              </div>
              <div class="modality-scores">
                <div class="score-item">视频：<span class="score-value">{{ data.opinionRisk.modalityFusion.videoScore }}</span></div>
                <div class="score-item">音频：<span class="score-value">{{ data.opinionRisk.modalityFusion.audioScore }}</span></div>
                <div class="score-item">文本：<span class="score-value">{{ data.opinionRisk.modalityFusion.textScore }}</span></div>
              </div>
              <div class="evidence-summary">证据数量：{{ data.opinionRisk.evidences.length }} 条</div>
            </div>
          </div>

          <!-- 处置建议 -->
          <div class="dimension-card">
            <div class="card-header">
              <h3 class="card-title">6. 处置建议</h3>
              <div class="card-score" :class="getConclusionClass()">
                {{ data.action.actionSuggestion }}
              </div>
            </div>
            <div class="card-content">
              <div class="conclusion-row">
                <span class="conclusion-label">详细说明：</span>
                <span class="conclusion-value">{{ data.action.actionDetail }}</span>
              </div>
              <div class="modality-scores">
                <div class="score-item">视频：<span class="score-value">{{ data.action.modalityFusion.videoScore }}</span></div>
                <div class="score-item">音频：<span class="score-value">{{ data.action.modalityFusion.audioScore }}</span></div>
                <div class="score-item">文本：<span class="score-value">{{ data.action.modalityFusion.textScore }}</span></div>
              </div>
              <div class="evidence-summary">证据数量：{{ data.action.evidences.length }} 条</div>
            </div>
          </div>
        </div>
      </section>

      <!-- 6. 详细证据清单 -->
      <section class="report-section evidence-section">
        <h2 class="section-title">五、详细证据清单</h2>
        
        <table class="evidence-table">
          <thead>
            <tr>
              <th style="width: 15%">时间段</th>
              <th style="width: 10%">模态类型</th>
              <th style="width: 50%">具体内容</th>
              <th style="width: 12%; text-align: center;">风险分数</th>
              <th style="width: 13%; text-align: center;">置信度</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="event in data.timelineEvents" :key="event.id" :class="{ 'high-risk-row': event.riskScore > 66.7 }">
              <td>{{ formatTime(event.startTime) }} - {{ formatTime(event.endTime) }}</td>
              <td>
                <div class="modality-badge" :class="'modality-' + event.modality">
                  <span class="modality-dot" :class="getModalityDotClass(event)"></span>
                  {{ getModalityText(event.modality) }}
                </div>
              </td>
              <td class="content-cell">
                <div class="content-with-label">
                  <span v-if="event.riskScore > 66.7" class="high-risk-label">⚠️ 高危</span>
                  <div :class="{ 'high-risk-content': event.riskScore > 66.7 }">
                    <template v-if="event.modality === 'speech'">
                      <span class="content-text">{{ event.transcript }}</span>
                      <div v-if="event.keywords && event.keywords.length > 0" class="keywords-tags">
                        <span v-for="(kw, idx) in event.keywords" :key="idx" class="keyword-tag">{{ kw }}</span>
                      </div>
                    </template>
                    <template v-else-if="event.modality === 'visual'">
                      <span class="content-text">{{ event.detectionLabel }}</span>
                    </template>
                    <template v-else-if="event.modality === 'audio-effect'">
                      <span class="content-text">{{ event.description }}</span>
                    </template>
                  </div>
                </div>
              </td>
              <td class="numeric-cell">
                <div class="risk-score-badge" :class="getRiskScoreClass(event.riskScore)">
                  {{ event.riskScore }}
                </div>
              </td>
              <td class="numeric-cell">{{ event.confidence }}%</td>
            </tr>
          </tbody>
        </table>
      </section>

      <!-- 7. 场景流 -->
      <section class="report-section scene-section">
        <h2 class="section-title">六、场景识别轨迹</h2>
        
        <div class="scene-flow">
          <div v-for="(scene, idx) in data.sceneRecognition" :key="scene.id" class="scene-item">
            <div class="scene-icon">{{ scene.icon }}</div>
            <div class="scene-info">
              <div class="scene-name">{{ scene.name }}</div>
              <div class="scene-time">{{ formatTime(scene.timeStart) }} - {{ formatTime(scene.timeEnd) }}</div>
              <div class="scene-confidence">置信度 {{ (scene.confidence * 100).toFixed(0) }}%</div>
            </div>
            <div v-if="idx < data.sceneRecognition.length - 1" class="scene-arrow">→</div>
          </div>
        </div>
      </section>

      <!-- 分析标准说明 -->
      <section class="compliance-section">
        <h2 class="section-title">分析标准说明</h2>
        <div class="compliance-content">
          <p>本报告基于<strong>多模态深度学习 V1.0 算法</strong>生成，综合计算权重：<strong>视频(30%)、音频(30%)、文本(40%)</strong>，符合国家网络言论治理规范。</p>
          <p>报告结果仅供参考，具体处置决策需结合实际情况由相关部门人工审核后确定。</p>
        </div>
      </section>

      <!-- 行政落款 -->
      <section class="signature-section">
        <div class="signature-row">
          <div class="signature-item">
            <span class="signature-label">分析员：</span>
            <span class="signature-line"></span>
          </div>
          <div class="signature-item">
            <span class="signature-label">审核员：</span>
            <span class="signature-line"></span>
          </div>
          <div class="signature-item">
            <span class="signature-label">签发日期：</span>
            <span class="signature-line"></span>
          </div>
        </div>
      </section>

      <!-- 报告页脚 -->
      <footer class="report-footer">
        <div class="footer-line"></div>
        <div class="footer-content">
          <div class="footer-left">
            <div>生成时间：{{ currentDateTime }}</div>
            <div>系统版本：多模态高校内容创作者行为分析系统 v1.0</div>
          </div>
          <div class="footer-right">
            <div>报告编号：{{ data.videoInfo.videoId }}</div>
          </div>
        </div>
      </footer>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, nextTick } from 'vue'
import * as echarts from 'echarts'
import type { AnalysisResult } from '@/data/mockAnalysisResult'

// Props
const props = defineProps<{
  data: AnalysisResult
}>()

// Refs
const radarChartRef = ref<HTMLElement>()
const trendChartRef = ref<HTMLElement>()

// 计算态度分析统计
const attitudeStats = computed(() => {
  const evidences = props.data.attitude.evidences
  let positive = 0, neutral = 0, negative = 0
  
  evidences.forEach(ev => {
    const score = ev.sentimentScore || 50
    if (score < 33.3) positive++
    else if (score > 66.7) negative++
    else neutral++
  })
  
  const total = evidences.length
  return {
    positive,
    neutral,
    negative,
    positivePercent: ((positive / total) * 100).toFixed(1),
    neutralPercent: ((neutral / total) * 100).toFixed(1),
    negativePercent: ((negative / total) * 100).toFixed(1)
  }
})

// 计算风险峰值分析
const riskPeakAnalysis = computed(() => {
  const risks = props.data.timelineData.comprehensiveRisks
  const granularity = props.data.timelineData.timeGranularity
  
  // 找到最高风险点
  let peakIndex = 0
  let peakIntensity = 0
  risks.forEach((risk, idx) => {
    if (risk.intensity > peakIntensity) {
      peakIntensity = risk.intensity
      peakIndex = idx
    }
  })
  
  // 计算峰值时间（秒）
  const peakStartSec = peakIndex * granularity
  const peakEndSec = (peakIndex + 1) * granularity
  
  // 找到该时间段内的事件
  const eventsInPeak = props.data.timelineEvents.filter(event => {
    return event.startTime >= peakStartSec && event.startTime < peakEndSec
  })
  
  // 找到风险分数最高的事件作为触发事件
  let triggerEvent = '未知事件'
  if (eventsInPeak.length > 0) {
    const highestRiskEvent = eventsInPeak.reduce((prev, curr) => 
      curr.riskScore > prev.riskScore ? curr : prev
    )
    
    if (highestRiskEvent.modality === 'speech') {
      // 截取前30个字符
      triggerEvent = `语音事件「${highestRiskEvent.transcript.substring(0, 30)}${highestRiskEvent.transcript.length > 30 ? '...' : ''}」`
    } else if (highestRiskEvent.modality === 'visual') {
      triggerEvent = `视觉事件「${highestRiskEvent.detectionLabel}」`
    } else if (highestRiskEvent.modality === 'audio-effect') {
      triggerEvent = `声学事件「${highestRiskEvent.description}」`
    }
  }
  
  return {
    peakTime: `${formatTime(peakStartSec)} - ${formatTime(peakEndSec)}`,
    peakIntensity,
    triggerEvent,
    peakIndex
  }
})

// 当前日期时间
const currentDateTime = computed(() => {
  const now = new Date()
  return now.toLocaleString('zh-CN', { 
    year: 'numeric', 
    month: '2-digit', 
    day: '2-digit', 
    hour: '2-digit', 
    minute: '2-digit' 
  })
})

// 格式化时长
const formatDuration = (seconds: number) => {
  const mins = Math.floor(seconds / 60)
  const secs = seconds % 60
  return `${mins}分${secs}秒`
}

// 格式化时间
const formatTime = (seconds: number) => {
  const mins = Math.floor(seconds / 60)
  const secs = Math.floor(seconds % 60)
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
}

// 获取结论样式类
const getConclusionClass = () => {
  const score = props.data.action.modalityFusion.finalScore
  if (score >= 67) return 'conclusion-high'
  if (score >= 34) return 'conclusion-medium'
  return 'conclusion-low'
}

// 获取风险等级样式类
const getRiskLevelClass = (score: number) => {
  if (score >= 67) return 'risk-high'
  if (score >= 34) return 'risk-medium'
  return 'risk-low'
}

// 获取风险分数样式类
const getRiskScoreClass = (score: number) => {
  if (score >= 67) return 'score-high'
  if (score >= 34) return 'score-medium'
  return 'score-low'
}

// 获取模态类型文本
const getModalityText = (modality: string) => {
  const map: Record<string, string> = {
    'speech': '语音',
    'visual': '视觉',
    'audio-effect': '声学'
  }
  return map[modality] || modality
}

// 获取模态圆点样式类
const getModalityDotClass = (event: any) => {
  if (event.modality === 'visual') {
    return 'dot-visual'
  } else if (event.modality === 'audio-effect') {
    return 'dot-audio'
  } else if (event.modality === 'speech') {
    // speech根据风险分数动态着色
    if (event.riskScore >= 67) return 'dot-speech-high'
    if (event.riskScore >= 34) return 'dot-speech-medium'
    return 'dot-speech-low'
  }
  return ''
}

// 初始化雷达图
const initRadarChart = () => {
  if (!radarChartRef.value) return
  
  const chart = echarts.init(radarChartRef.value)
  const option = {
    radar: {
      indicator: [
        { name: '身份置信度', max: 100 },
        { name: '学校关联度', max: 100 },
        { name: '负面情感度', max: 100 },
        { name: '传播风险', max: 100 },
        { name: '影响范围', max: 100 },
        { name: '处置紧迫度', max: 100 }
      ],
      shape: 'polygon',
      splitNumber: 4,
      axisName: {
        color: '#333',
        fontSize: 12
      },
      splitLine: {
        lineStyle: {
          color: '#ddd'
        }
      },
      splitArea: {
        show: true,
        areaStyle: {
          color: ['#fafafa', '#f5f5f5']
        }
      }
    },
    series: [{
      type: 'radar',
      data: [{
        value: props.data.timelineData.averageRadarData,
        name: '综合评估',
        areaStyle: {
          color: 'rgba(64, 158, 255, 0.2)'
        },
        lineStyle: {
          color: '#409EFF',
          width: 2
        },
        itemStyle: {
          color: '#409EFF'
        }
      }]
    }]
  }
  
  chart.setOption(option)
  
  // 打印时重新渲染
  window.addEventListener('beforeprint', () => {
    chart.resize()
  })
}

// 初始化走势图
const initTrendChart = () => {
  if (!trendChartRef.value) return
  
  const chart = echarts.init(trendChartRef.value)
  const granularity = props.data.timelineData.timeGranularity
  const xAxisData = props.data.timelineData.comprehensiveRisks.map((_, idx) => {
    const startSec = idx * granularity
    return formatTime(startSec)
  })
  
  const option = {
    grid: {
      left: '60px',
      right: '40px',
      top: '40px',
      bottom: '50px'
    },
    xAxis: {
      type: 'category',
      data: xAxisData,
      axisLabel: {
        color: '#666',
        fontSize: 11
      },
      axisLine: {
        lineStyle: {
          color: '#ddd'
        }
      }
    },
    yAxis: {
      type: 'value',
      name: '风险强度',
      min: 0,
      max: 1,
      axisLabel: {
        color: '#666',
        fontSize: 11
      },
      splitLine: {
        lineStyle: {
          color: '#eee',
          type: 'dashed'
        }
      }
    },
    series: [{
      name: '综合风险',
      type: 'line',
      data: props.data.timelineData.comprehensiveRisks.map(r => r.intensity),
      smooth: true,
      lineStyle: {
        color: '#409EFF',
        width: 2
      },
      areaStyle: {
        color: {
          type: 'linear',
          x: 0,
          y: 0,
          x2: 0,
          y2: 1,
          colorStops: [
            { offset: 0, color: 'rgba(64, 158, 255, 0.3)' },
            { offset: 1, color: 'rgba(64, 158, 255, 0.05)' }
          ]
        }
      },
      itemStyle: {
        color: '#409EFF'
      },
      markLine: {
        silent: true,
        symbol: 'none',
        lineStyle: {
          color: '#f56c6c',
          type: 'dashed',
          width: 2
        },
        label: {
          show: true,
          position: 'end',
          formatter: '高风险阈值',
          color: '#f56c6c',
          fontSize: 11,
          fontWeight: 600
        },
        data: [{
          yAxis: 0.67
        }]
      },
      markArea: {
        silent: true,
        data: [[
          {
            xAxis: riskPeakAnalysis.value.peakIndex,
            itemStyle: {
              color: 'rgba(245, 108, 108, 0.15)'
            }
          },
          {
            xAxis: riskPeakAnalysis.value.peakIndex
          }
        ]]
      }
    }]
  }
  
  chart.setOption(option)
  
  // 打印时重新渲染
  window.addEventListener('beforeprint', () => {
    chart.resize()
  })
}

onMounted(() => {
  nextTick(() => {
    initRadarChart()
    initTrendChart()
  })
})
</script>

<style scoped lang="scss">
.report-view {
  background: #f5f5f5;
  min-height: 100vh;
  padding: 20px;
}

.report-container {
  max-width: 210mm; /* A4 width */
  margin: 0 auto;
  background: white;
  box-shadow: 0 0 20px rgba(0,0,0,0.1);
  padding: 30mm 20mm; /* A4 margins */
}

/* ===== 1. 报告头部 ===== */
.report-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  padding-bottom: 24px;
  border-bottom: 3px solid #000;
  margin-bottom: 32px;
}

.header-left {
  flex: 1;
}

.report-title {
  font-size: 24px;
  font-weight: bold;
  color: #000;
  margin: 0 0 16px 0;
  line-height: 1.4;
}

.archive-info {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.info-item {
  font-size: 13px;
  color: #333;
  
  .label {
    font-weight: 600;
    color: #000;
  }
  
  .value {
    color: #333;
  }
}

.header-right {
  margin-left: 24px;
}

.final-conclusion {
  border: 2px solid;
  padding: 16px 20px;
  border-radius: 4px;
  text-align: center;
  min-width: 180px;
  
  &.conclusion-high {
    border-color: #f56c6c;
    background: #fef0f0;
    
    .conclusion-value {
      color: #f56c6c;
    }
  }
  
  &.conclusion-medium {
    border-color: #e6a23c;
    background: #fdf6ec;
    
    .conclusion-value {
      color: #e6a23c;
    }
  }
  
  &.conclusion-low {
    border-color: #67c23a;
    background: #f0f9ff;
    
    .conclusion-value {
      color: #67c23a;
    }
  }
}

.conclusion-label {
  font-size: 12px;
  color: #666;
  margin-bottom: 8px;
}

.conclusion-value {
  font-size: 20px;
  font-weight: bold;
  margin-bottom: 8px;
}

.conclusion-detail {
  font-size: 12px;
  color: #333;
}

/* ===== 身份认定结论区 ===== */
.identity-conclusion-section {
  margin-bottom: 32px;
}

.identity-conclusion-box {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 40px;
  padding: 24px;
  background: linear-gradient(135deg, #f0f2f5 0%, #fafafa 100%);
  border: 2px solid #409EFF;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(64, 158, 255, 0.15);
}

.conclusion-item {
  display: flex;
  align-items: center;
  gap: 16px;
}

.conclusion-icon {
  width: 56px;
  height: 56px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 28px;
  border-radius: 12px;
  
  &.identity-icon {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  }
  
  &.university-icon {
    background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
  }
}

.conclusion-info {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.conclusion-title {
  font-size: 12px;
  color: #999;
  font-weight: 500;
}

.conclusion-result {
  font-size: 20px;
  font-weight: bold;
  color: #000;
}

.conclusion-meta {
  font-size: 11px;
  color: #666;
}

.conclusion-divider {
  width: 2px;
  height: 60px;
  background: linear-gradient(to bottom, transparent, #409EFF, transparent);
}

/* ===== 2. 报告区块 ===== */
.report-section {
  margin-bottom: 40px;
  page-break-inside: avoid;
}

.section-title {
  font-size: 18px;
  font-weight: bold;
  color: #000;
  border-left: 4px solid #409EFF;
  padding-left: 12px;
  margin: 0 0 20px 0;
}

/* ===== 3. 视频概览 ===== */
.overview-content {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.overview-item {
  page-break-inside: avoid;
  
  .item-label {
    font-size: 14px;
    font-weight: 600;
    color: #000;
    margin-bottom: 10px;
  }
  
  .item-value {
    font-size: 13px;
    color: #333;
    line-height: 1.8;
  }
}

.summary-text {
  padding: 12px;
  background: transparent;
  border-left: 4px solid #409EFF;
  line-height: 1.8;
}

.character-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
}

.char-item {
  font-size: 13px;
  color: #333;
  
  .char-label {
    font-weight: 600;
    color: #000;
  }
}

.keywords-cloud {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.keyword-tag {
  padding: 4px 12px;
  font-size: 12px;
  border: 1px solid #ddd;
  border-radius: 4px;
  background: #fafafa;
  color: #333;
  
  &.university-keyword {
    border-color: #409EFF;
    background: #ecf5ff;
    color: #409EFF;
    font-weight: 600;
  }
}

/* ===== 4. 风险画像 ===== */
.risk-portrait {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 24px;
}

.portrait-item {
  border: 1px solid #ddd;
  padding: 20px;
  border-radius: 4px;
  page-break-inside: avoid;
}

.portrait-left {
  display: flex;
  flex-direction: column;
}

.portrait-right {
  display: flex;
  flex-direction: column;
}

.subsection-title {
  font-size: 14px;
  font-weight: 600;
  color: #000;
  margin: 0 0 16px 0;
  text-align: center;
}

.radar-chart {
  width: 100%;
  height: 350px;
}

/* 一行式模态贡献度 */
.modality-contribution-compact {
  display: flex;
  flex-direction: column;
  gap: 28px;
  justify-content: center;
  height: 100%;
}

.contribution-row {
  display: grid;
  grid-template-columns: 100px 1fr 90px;
  align-items: center;
  gap: 12px;
}

.contribution-label {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 12px;
  font-weight: 600;
  color: #000;
}

.modality-icon {
  font-size: 16px;
  flex-shrink: 0;
}

.modality-icon-semantic {
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 4px;
  font-size: 14px;
  font-weight: 700;
  flex-shrink: 0;
  
  &.video-semantic {
    background: rgba(64, 158, 255, 0.15);
    color: #409EFF;
  }
  
  &.audio-semantic {
    background: rgba(103, 194, 58, 0.15);
    color: #67C23A;
  }
  
  &.text-semantic {
    background: rgba(230, 162, 60, 0.15);
    color: #E6A23C;
    font-family: 'Courier New', monospace;
  }
}

.modality-dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  flex-shrink: 0;
  
  &.video-dot {
    background: #409EFF;
  }
  
  &.audio-dot {
    background: #67C23A;
  }
  
  &.text-dot {
    background: #E6A23C;
  }
}

.modality-text {
  white-space: nowrap;
}

.contribution-progress-compact {
  width: 100%;
  height: 8px;
  background: #f0f0f0;
  border-radius: 4px;
  overflow: hidden;
}

.progress-bar-compact {
  height: 100%;
  transition: width 0.3s ease;
  
  &.video-bar {
    background: #409EFF;
  }
  
  &.audio-bar {
    background: #67C23A;
  }
  
  &.text-bar {
    background: #E6A23C;
  }
}

.contribution-metrics {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 2px;
}

.metric-score {
  font-size: 13px;
  font-weight: 600;
  color: #333;
}

.metric-percent {
  font-size: 11px;
  color: #999;
}

/* ===== 5. 风险走势 ===== */
.risk-trend-container {
  border: 1px solid #ddd;
  padding: 20px;
  border-radius: 4px;
}

.trend-chart {
  width: 100%;
  height: 300px;
}

/* 风险峰值分析 */
.risk-peak-analysis {
  margin-top: 20px;
  padding: 16px 20px;
  background: linear-gradient(135deg, #fff5f5 0%, #ffe8e8 100%);
  border-left: 4px solid #f56c6c;
  border-radius: 4px;
  display: flex;
  align-items: flex-start;
  gap: 12px;
  page-break-inside: avoid;
  
  &.extreme-risk {
    background: linear-gradient(135deg, #fff1f0 0%, #ffccc7 100%);
    border-left: 6px solid #cf1322;
    box-shadow: 0 4px 12px rgba(207, 19, 34, 0.2);
  }
}

.peak-indicator {
  font-size: 24px;
  line-height: 1;
  flex-shrink: 0;
}

.peak-content {
  font-size: 13px;
  color: #333;
  line-height: 1.8;
  
  strong {
    color: #f56c6c;
    font-weight: 700;
  }
  
  .extreme-warning {
    display: block;
    color: #cf1322;
    font-size: 15px;
    margin-bottom: 8px;
    text-transform: uppercase;
    letter-spacing: 1px;
  }
}

/* ===== 6. 维度详情 ===== */
.dimensions-section {
  page-break-before: always;
}

.dimensions-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 16px;
}

.dimension-card {
  border: 1px solid #f0f0f0;
  border-radius: 4px;
  overflow: hidden;
  page-break-inside: avoid;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.08), inset 0 1px 0 rgba(255, 255, 255, 0.8);
  background: white;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  background: #f9f9f9;
  border-bottom: 1px solid #eeeeee;
}

.card-title {
  font-size: 14px;
  font-weight: 600;
  color: #000;
  margin: 0;
}

.card-score {
  font-size: 13px;
  font-weight: 600;
  padding: 4px 10px;
  border-radius: 4px;
  
  &.risk-high, &.conclusion-high {
    background: #fef0f0;
    color: #f56c6c;
  }
  
  &.risk-medium, &.conclusion-medium {
    background: #fdf6ec;
    color: #e6a23c;
  }
  
  &.risk-low, &.conclusion-low {
    background: #f0f9ff;
    color: #67c23a;
  }
}

.card-content {
  padding: 16px;
}

.conclusion-row {
  margin-bottom: 12px;
  font-size: 13px;
  
  .conclusion-label {
    font-weight: 600;
    color: #000;
  }
  
  .conclusion-value {
    color: #333;
  }
}

.modality-scores {
  display: flex;
  gap: 12px;
  margin-bottom: 12px;
  padding: 8px;
  background: #fafafa;
  border-radius: 4px;
}

.score-item {
  font-size: 12px;
  color: #666;
}

.score-value {
  display: inline-block;
  padding: 2px 8px;
  background: #f0f0f0;
  color: #333;
  font-weight: 600;
  border-radius: 4px;
  font-size: 12px;
}

.evidence-summary {
  font-size: 12px;
  color: #999;
  text-align: right;
}

/* 态度分析特殊样式 */
.attitude-distribution {
  display: flex;
  justify-content: space-between;
  margin-bottom: 12px;
  gap: 8px;
}

.distribution-item {
  flex: 1;
  padding: 12px 8px;
  border-radius: 4px;
  text-align: center;
  
  &.positive {
    background: #f0f9ff;
    border: 1px solid #b3d8ff;
  }
  
  &.neutral {
    background: #fafafa;
    border: 1px solid #ddd;
  }
  
  &.negative {
    background: #fef0f0;
    border: 1px solid #fbc4c4;
  }
  
  .dist-label {
    font-size: 12px;
    font-weight: 600;
    margin-bottom: 6px;
  }
  
  .dist-value {
    font-size: 13px;
    font-weight: bold;
  }
}

/* ===== 7. 证据清单 ===== */
.evidence-section {
  page-break-before: always;
}

.evidence-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 12px;
  
  thead {
    background: #f5f5f5;
    
    th {
      padding: 10px 8px;
      text-align: left;
      font-weight: 600;
      color: #000;
      border: 1px solid #ddd;
    }
  }
  
  tbody {
    tr {
      page-break-inside: avoid;
      page-break-after: auto;
      
      &:nth-child(even) {
        background: #fafafa;
      }
      
      &.high-risk-row {
        background: #fff5f5 !important;
        border-left: 3px solid #f56c6c;
      }
      
      td {
        padding: 14px 10px;
        border: 1px solid #ddd;
        color: #333;
        vertical-align: top;
      }
    }
  }
}

.content-cell {
  line-height: 1.8;
}

.content-with-label {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.high-risk-label {
  display: inline-block;
  padding: 4px 12px;
  background: linear-gradient(135deg, #f56c6c 0%, #ff6b6b 100%);
  color: white;
  font-size: 11px;
  font-weight: bold;
  border-radius: 6px;
  box-shadow: 0 2px 6px rgba(245, 108, 108, 0.3);
  align-self: flex-start;
}

.high-risk-content {
  font-weight: 700;
  color: #000;
}

.high-risk-row {
  td {
    padding: 16px 10px !important;
  }
}

/* 关键词标签样式 */
.keywords-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 10px;
}

.keyword-tag {
  display: inline-block;
  padding: 4px 10px;
  background: #f0f0f0;
  color: #666;
  font-size: 11px;
  border-radius: 8px;
  font-weight: 500;
  border: 1px solid #e0e0e0;
}

.content-text {
  display: block;
  line-height: 1.6;
}

/* 数值列样式 */
.numeric-cell {
  text-align: center !important;
  vertical-align: middle !important;
}

.modality-badge {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 4px 8px;
  border-radius: 3px;
  font-size: 11px;
  font-weight: 600;
  
  .modality-dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    flex-shrink: 0;
    
    /* Visual - 蓝色 */
    &.dot-visual {
      background: #3b82f6;
      box-shadow: 0 0 4px rgba(59, 130, 246, 0.5);
    }
    
    /* Audio Effect - 琥珀色 */
    &.dot-audio {
      background: #f59e0b;
      box-shadow: 0 0 4px rgba(245, 158, 11, 0.5);
    }
    
    /* Speech - 风险动态色 */
    &.dot-speech-high {
      background: #f56c6c;
      box-shadow: 0 0 4px rgba(245, 108, 108, 0.5);
    }
    
    &.dot-speech-medium {
      background: #e6a23c;
      box-shadow: 0 0 4px rgba(230, 162, 60, 0.5);
    }
    
    &.dot-speech-low {
      background: #67c23a;
      box-shadow: 0 0 4px rgba(103, 194, 58, 0.5);
    }
  }
  
  &.modality-speech {
    background: #ecf5ff;
    color: #409EFF;
  }
  
  &.modality-visual {
    background: #f0f9ff;
    color: #67C23A;
  }
  
  &.modality-audio-effect {
    background: #fdf6ec;
    color: #E6A23C;
  }
}

.risk-score-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 4px 10px;
  border-radius: 4px;
  font-weight: 600;
  min-width: 40px;
  
  &.score-high {
    background: #fef0f0;
    color: #f56c6c;
  }
  
  &.score-medium {
    background: #fdf6ec;
    color: #e6a23c;
  }
  
  &.score-low {
    background: #f0f9ff;
    color: #67c23a;
  }
}

/* ===== 8. 场景流 ===== */
.scene-flow {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 20px;
  border: 1px solid #ddd;
  border-radius: 4px;
  background: #fafafa;
  flex-wrap: wrap;
}

.scene-item {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-shrink: 0;
}

.scene-icon {
  font-size: 32px;
}

.scene-info {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.scene-name {
  font-size: 14px;
  font-weight: 600;
  color: #000;
}

.scene-time {
  font-size: 11px;
  color: #666;
}

.scene-confidence {
  font-size: 11px;
  color: #999;
}

.scene-arrow {
  font-size: 20px;
  color: #999;
  margin: 0 8px;
}

/* ===== 分析标准说明 ===== */
.compliance-section {
  margin-top: 40px;
  padding: 24px;
  background: linear-gradient(135deg, #f0f9ff 0%, #e6f7ff 100%);
  border: 2px solid #409EFF;
  border-radius: 8px;
}

.compliance-content {
  font-size: 13px;
  color: #333;
  line-height: 1.8;
  
  p {
    margin: 0 0 12px 0;
    
    &:last-child {
      margin-bottom: 0;
    }
  }
  
  strong {
    color: #409EFF;
    font-weight: 700;
  }
}

/* ===== 行政落款 ===== */
.signature-section {
  margin-top: 60px;
  padding: 32px 0;
  border-top: 1px solid #eee;
}

.signature-row {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 60px;
}

.signature-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 20px 0;
}

.signature-label {
  font-size: 13px;
  font-weight: 600;
  color: #333;
  white-space: nowrap;
}

.signature-line {
  flex: 1;
  min-height: 30px;
  border-bottom: 1px solid #ddd;
  position: relative;
}

/* ===== 9. 报告页脚 ===== */
.report-footer {
  margin-top: 40px;
  padding-top: 24px;
}

.footer-line {
  height: 2px;
  background: #ddd;
  margin-bottom: 16px;
}

.footer-content {
  display: flex;
  justify-content: space-between;
  font-size: 11px;
  color: #999;
}

.footer-left,
.footer-right {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

/* ===== 打印样式 ===== */
@media print {
  .report-view {
    padding: 0;
    background: white;
  }
  
  .report-container {
    max-width: 100%;
    box-shadow: none;
    margin: 0;
    padding: 15mm 15mm;
  }
  
  /* 防止关键区块被截断 */
  .report-section {
    page-break-inside: avoid;
  }
  
  .report-header {
    page-break-inside: avoid;
    page-break-after: avoid;
  }
  
  .identity-conclusion-section {
    page-break-inside: avoid;
    page-break-after: avoid;
  }
  
  .portrait-item {
    page-break-inside: avoid;
  }
  
  .radar-chart {
    page-break-inside: avoid;
  }
  
  .risk-trend-container {
    page-break-inside: avoid;
  }
  
  .trend-chart {
    page-break-inside: avoid;
  }
  
  .risk-peak-analysis {
    page-break-inside: avoid;
  }
  
  .risk-portrait {
    page-break-inside: avoid;
  }
  
  .dimension-card {
    page-break-inside: avoid;
  }
  
  .dimensions-section {
    page-break-before: always;
  }
  
  .evidence-section {
    page-break-before: always;
  }
  
  .evidence-table {
    tr {
      page-break-inside: avoid;
      page-break-after: auto;
    }
    
    thead {
      display: table-header-group;
    }
  }
  
  .scene-section {
    page-break-inside: avoid;
  }
  
  .compliance-section {
    page-break-inside: avoid;
  }
  
  .signature-section {
    page-break-inside: avoid;
  }
  
  .report-footer {
    page-break-inside: avoid;
  }
}
</style>
