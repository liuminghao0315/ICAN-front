<template>
  <div class="report-view">
    <div class="report-actions">
      <button class="export-btn" @click="handleExport">
        <el-icon><Download /></el-icon>
        导出报告
      </button>
    </div>

    <div class="report-paper">
      <!-- 封面区 -->
      <div class="cover">
        <div class="cover-rule-thick"></div>
        <div class="cover-rule-thin"></div>

        <div class="cover-confidential">内部资料 · 仅供参考</div>

        <h1 class="cover-title">视频内容分析报告</h1>
        <div class="cover-subtitle">Video Content Analysis Report</div>

        <div class="cover-info">
          <table class="cover-table">
            <tbody>
              <tr><td class="ct-key">报告编号</td><td class="ct-sep">：</td><td>{{ data.videoInfo.videoId }}</td></tr>
              <tr><td class="ct-key">视频文件</td><td class="ct-sep">：</td><td>{{ data.videoInfo.fileName }}</td></tr>
              <tr><td class="ct-key">视频时长</td><td class="ct-sep">：</td><td>{{ formatDuration(data.videoInfo.duration) }}</td></tr>
              <tr><td class="ct-key">来源渠道</td><td class="ct-sep">：</td><td>{{ data.videoInfo.uploadSource }}</td></tr>
              <tr v-if="data.videoInfo.uploadSource === '网络采集' && data.videoInfo.sourceUrl">
                <td class="ct-key">视频链接</td><td class="ct-sep">：</td>
                <td><a :href="data.videoInfo.sourceUrl" target="_blank" rel="noopener noreferrer" class="text-link">{{ data.videoInfo.sourceUrl }}</a></td>
              </tr>
              <tr><td class="ct-key">生成时间</td><td class="ct-sep">：</td><td>{{ currentDateTime }}</td></tr>
            </tbody>
          </table>
        </div>

        <div class="cover-org">基于多模态深度学习的高校内容创作者行为分析平台</div>
        <div class="cover-version">系统版本 v1.0</div>

        <div class="cover-rule-thin"></div>
        <div class="cover-rule-thick"></div>
      </div>

      <!-- 综合结论 -->
      <section class="section">
        <h2 class="section-heading">综合结论</h2>
        <table class="info-table conclusion-table">
          <tbody>
            <tr>
              <td class="it-key">最终建议</td>
              <td><span class="risk-tag" :class="getConclusionClass()">{{ data.action.actionSuggestion }}</span></td>
            </tr>
            <tr><td class="it-key">详细说明</td><td>{{ data.action.actionDetail }}</td></tr>
            <tr><td class="it-key">身份判定</td><td>{{ data.identity.identityLabel }}（置信度 {{ data.identity.modalityFusion.finalScore }}%）</td></tr>
            <tr><td class="it-key">涉及高校</td><td>{{ data.university.universityName }}（关联度 {{ data.university.modalityFusion.finalScore }}%）</td></tr>
          </tbody>
        </table>
      </section>

      <!-- 一、视频概览 -->
      <section class="section">
        <h2 class="section-heading">一、视频概览</h2>
        <div v-if="data.videoInfo.description" class="sub-block">
          <h3 class="sub-heading">AI 内容摘要</h3>
          <p class="body-text indent-text">{{ data.videoInfo.description }}</p>
        </div>
        <div v-if="data.videoInfo.mainCharacter" class="sub-block">
          <h3 class="sub-heading">人物特征</h3>
          <div class="char-list">
            <p v-if="data.videoInfo.mainCharacter.gender" class="char-item">
              <strong class="char-key">性别：</strong>{{ data.videoInfo.mainCharacter.gender }}
            </p>
            <p v-if="data.videoInfo.mainCharacter.ageRange" class="char-item">
              <strong class="char-key">年龄段：</strong>{{ data.videoInfo.mainCharacter.ageRange }}
            </p>
            <p v-if="data.videoInfo.mainCharacter.voiceProfile" class="char-item">
              <strong class="char-key">语音特征：</strong>{{ data.videoInfo.mainCharacter.voiceProfile }}
            </p>
            <p v-if="data.videoInfo.mainCharacter.clothing" class="char-item">
              <strong class="char-key">着装：</strong>{{ data.videoInfo.mainCharacter.clothing }}
            </p>
          </div>
        </div>
        <div v-if="data.videoInfo.detectedKeywords && data.videoInfo.detectedKeywords.length > 0" class="sub-block">
          <h3 class="sub-heading">检测到的关键词</h3>
          <div class="kw-list">
            <span v-for="(kw, idx) in data.videoInfo.detectedKeywords" :key="idx"
              class="kw-item" :class="{ 'kw-highlight': kw.isUniversityRelated }">{{ kw.word }}</span>
          </div>
        </div>
      </section>

      <!-- 二、风险画像 -->
      <section class="section page-break">
        <h2 class="section-heading">二、风险画像</h2>
        <div class="two-col">
          <div class="col">
            <h3 class="sub-heading center">综合风险雷达图</h3>
            <div class="radar-chart" ref="radarChartRef"></div>
          </div>
          <div class="col">
            <h3 class="sub-heading center">多模态分析贡献度</h3>
            <div class="contrib-list">
              <div class="contrib-row">
                <span class="contrib-label">视频模态</span>
                <div class="contrib-bar"><div class="contrib-fill fill-video" :style="{ width: contribPercent.video + '%' }"></div></div>
                <span class="contrib-num">{{ contribPercent.video.toFixed(1) }}%</span>
              </div>
              <div class="contrib-row">
                <span class="contrib-label">音频模态</span>
                <div class="contrib-bar"><div class="contrib-fill fill-audio" :style="{ width: contribPercent.audio + '%' }"></div></div>
                <span class="contrib-num">{{ contribPercent.audio.toFixed(1) }}%</span>
              </div>
              <div class="contrib-row">
                <span class="contrib-label">文本模态</span>
                <div class="contrib-bar"><div class="contrib-fill fill-text" :style="{ width: contribPercent.text + '%' }"></div></div>
                <span class="contrib-num">{{ contribPercent.text.toFixed(1) }}%</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- 三、风险走势分析 -->
      <section class="section">
        <h2 class="section-heading">三、风险走势分析</h2>
        <div class="chart-box chart-box-wide">
          <div class="trend-chart" ref="trendChartRef"></div>
        </div>
        <div class="note-box" :class="{ 'note-danger': riskPeakAnalysis.peakIntensity >= 0.9 }">
          <template v-if="riskPeakAnalysis.peakIntensity >= 0.9"><strong>【极高风险红色预警】</strong><br/></template>
          <template v-else><strong>风险峰值分析：</strong></template>
          本视频风险峰值出现在 {{ riskPeakAnalysis.peakTime }}，风险强度达到 {{ (riskPeakAnalysis.peakIntensity * 100).toFixed(1) }}%，主要由 {{ riskPeakAnalysis.triggerEvent }} 触发。
        </div>
      </section>

      <!-- 四、六大维度分析详情 -->
      <section class="section page-break">
        <h2 class="section-heading">四、六大维度分析详情</h2>
        <div class="dim-grid">
          <div class="dim-card" v-for="dim in dimensionList" :key="dim.title">
            <div class="dim-header">
              <span class="dim-title">{{ dim.title }}</span>
              <span class="dim-score" :class="dim.scoreClass">{{ dim.scoreLabel }}</span>
            </div>
            <div class="dim-body">
              <div v-for="(row, ri) in dim.rows" :key="ri" class="dim-row">
                <span class="dim-row-key">{{ row.label }}</span>
                <span>{{ row.value }}</span>
              </div>
              <div v-if="dim.video !== null" class="dim-modality">
                <span>视频 {{ dim.video }}</span>
                <span>音频 {{ dim.audio }}</span>
                <span>文本 {{ dim.text }}</span>
              </div>
              <div class="dim-evidence">证据 {{ dim.evidenceCount }} 条</div>
            </div>
          </div>
        </div>
      </section>

      <!-- 五、详细证据清单 -->
      <section class="section page-break">
        <h2 class="section-heading">五、详细证据清单</h2>
        <table class="ev-table">
          <thead>
            <tr>
              <th style="width:14%">时间段</th>
              <th style="width:8%">模态</th>
              <th style="width:52%">具体内容</th>
              <th style="width:13%;text-align:center">风险分数</th>
              <th style="width:13%;text-align:center">置信度</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="event in data.timelineEvents" :key="event.id" :class="{ 'row-danger': event.riskScore > 70 }">
              <td>{{ formatTime(event.startTime) }}-{{ formatTime(event.endTime) }}</td>
              <td>{{ getModalityText(event.modality) }}</td>
              <td>
                <span v-if="event.riskScore > 70" class="tag-danger">高危</span>
                <template v-if="event.modality === 'speech'">{{ event.transcript }}<span v-if="event.keywords && event.keywords.length" class="ev-kw">（{{ event.keywords.join('、') }}）</span></template>
                <template v-else-if="event.modality === 'visual'">{{ event.detectionLabel }}</template>
                <template v-else-if="event.modality === 'audio-effect'">{{ event.description }}</template>
              </td>
              <td class="center" :class="{ 'score-critical': event.riskScore > 80 }">{{ event.riskScore }}</td>
              <td class="center">{{ event.confidence }}%</td>
            </tr>
          </tbody>
        </table>
      </section>

      <!-- 六、场景识别轨迹 -->
      <section class="section page-break">
        <h2 class="section-heading">六、场景识别轨迹</h2>
        <table class="info-table">
          <thead><tr><th>序号</th><th>场景名称</th><th>时间段</th><th>置信度</th></tr></thead>
          <tbody>
            <tr v-for="(scene, idx) in data.sceneRecognition" :key="scene.id">
              <td>{{ idx + 1 }}</td>
              <td>{{ scene.name }}</td>
              <td>{{ formatTime(scene.timeStart) }} - {{ formatTime(scene.timeEnd) }}</td>
              <td>{{ (scene.confidence * 100).toFixed(0) }}%</td>
            </tr>
          </tbody>
        </table>
      </section>

      <!-- 分析标准说明 -->
      <section class="section">
        <h2 class="section-heading">分析标准说明</h2>
        <p class="body-text">本报告由多模态深度学习分析系统自动生成，综合视频、音频、文本三种模态的分析结果，经融合算法计算得出。</p>
        <p class="body-text">报告结果仅供参考，具体处置决策需结合实际情况由相关部门人工审核后确定。</p>
      </section>

      <!-- 签章区 -->
      <div class="sign-area">
        <div class="sign-row">
          <div class="sign-item"><span class="sign-label">分析员：</span><span class="sign-line"></span></div>
          <div class="sign-item"><span class="sign-label">审核员：</span><span class="sign-line"></span></div>
        </div>
        <div class="sign-row">
          <div class="sign-item"><span class="sign-label">签发日期：</span><span class="sign-line"></span></div>
          <div class="sign-item"></div>
        </div>
      </div>

      <!-- 页脚 -->
      <div class="report-foot">
        <div class="foot-rule"></div>
        <div class="foot-row">
          <span>生成时间：{{ currentDateTime }}</span>
          <span>报告编号：{{ data.videoInfo.videoId }}</span>
        </div>
        <div class="foot-row">
          <span>系统版本：多模态高校内容创作者行为分析系统 v1.0</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, nextTick } from 'vue'
import * as echarts from 'echarts'
import { Download } from '@element-plus/icons-vue'
import type { AnalysisResult } from '@/data/mockAnalysisResult'

const emit = defineEmits<{ 'export-pdf': [] }>()

const props = defineProps<{ data: AnalysisResult }>()

const handleExport = () => {
  emit('export-pdf')
}

const radarChartRef = ref<HTMLElement>()
const trendChartRef = ref<HTMLElement>()

const attitudeStats = computed(() => {
  const evidences = props.data.attitude.evidences
  let positive = 0, neutral = 0, negative = 0
  evidences.forEach(ev => {
    const score = ev.sentimentScore || 50
    if (score < 40) positive++
    else if (score > 70) negative++
    else neutral++
  })
  const total = evidences.length
  const safe = (n: number) => (total > 0 ? (n / total) * 100 : 0)
  return {
    positive, neutral, negative,
    positivePercent: safe(positive).toFixed(1),
    neutralPercent: safe(neutral).toFixed(1),
    negativePercent: safe(negative).toFixed(1)
  }
})

const riskPeakAnalysis = computed(() => {
  const risks = props.data.timelineData.comprehensiveRisks
  const granularity = props.data.timelineData.timeGranularity
  let peakIndex = 0, peakIntensity = 0
  risks.forEach((risk, idx) => {
    if (risk.intensity > peakIntensity) { peakIntensity = risk.intensity; peakIndex = idx }
  })
  const peakStartSec = peakIndex * granularity
  const peakEndSec = (peakIndex + 1) * granularity

  const eventsInPeak = props.data.timelineEvents.filter(e => e.startTime >= peakStartSec && e.startTime < peakEndSec)
  const candidates = eventsInPeak.length > 0 ? eventsInPeak : [...props.data.timelineEvents]

  let triggerEvent = ''
  if (candidates.length > 0) {
    const top = candidates.reduce((a, b) => b.riskScore > a.riskScore ? b : a)
    if (top.modality === 'speech') triggerEvent = `语音内容「${top.transcript.substring(0, 30)}${top.transcript.length > 30 ? '...' : ''}」`
    else if (top.modality === 'visual') triggerEvent = `视觉特征「${top.detectionLabel}」`
    else if (top.modality === 'audio-effect') triggerEvent = `声学特征「${top.description}」`
  }

  return { peakTime: `${formatTime(peakStartSec)} - ${formatTime(peakEndSec)}`, peakIntensity, triggerEvent, peakIndex }
})

const contribPercent = computed(() => {
  const f = props.data.action.modalityFusion
  const total = f.videoContribution + f.audioContribution + f.textContribution
  if (total === 0) return { video: 0, audio: 0, text: 0 }
  return {
    video: (f.videoContribution / total) * 100,
    audio: (f.audioContribution / total) * 100,
    text: (f.textContribution / total) * 100
  }
})

const dimensionList = computed(() => {
  const d = props.data
  const cls = (score: number) => score >= 70 ? 'sc-high' : score >= 40 ? 'sc-mid' : 'sc-low'
  return [
    {
      title: '1. 身份判定', scoreLabel: `置信度 ${d.identity.modalityFusion.finalScore}%`,
      scoreClass: cls(d.identity.modalityFusion.finalScore),
      rows: [{ label: '判定结果', value: d.identity.identityLabel }],
      video: d.identity.modalityFusion.videoScore, audio: d.identity.modalityFusion.audioScore,
      text: d.identity.modalityFusion.textScore, evidenceCount: d.identity.evidences.length
    },
    {
      title: '2. 涉及高校', scoreLabel: `关联度 ${d.university.modalityFusion.finalScore}%`,
      scoreClass: cls(d.university.modalityFusion.finalScore),
      rows: [{ label: '识别结果', value: d.university.universityName }],
      video: d.university.modalityFusion.videoScore, audio: d.university.modalityFusion.audioScore,
      text: d.university.modalityFusion.textScore, evidenceCount: d.university.evidences.length
    },
    {
      title: '3. 内容主题', scoreLabel: `相关度 ${d.topic.modalityFusion.finalScore}%`,
      scoreClass: cls(d.topic.modalityFusion.finalScore),
      rows: [{ label: '主题分类', value: d.topic.topicCategory }, { label: '细分主题', value: d.topic.topicSubCategory }],
      video: d.topic.modalityFusion.videoScore, audio: d.topic.modalityFusion.audioScore,
      text: d.topic.modalityFusion.textScore, evidenceCount: d.topic.evidences.length
    },
    {
      title: '4. 对学校态度', scoreLabel: `正${attitudeStats.value.positivePercent}% / 负${attitudeStats.value.negativePercent}%`,
      scoreClass: '', rows: [
        { label: '正面', value: `${attitudeStats.value.positive}条 (${attitudeStats.value.positivePercent}%)` },
        { label: '中性', value: `${attitudeStats.value.neutral}条 (${attitudeStats.value.neutralPercent}%)` },
        { label: '负面', value: `${attitudeStats.value.negative}条 (${attitudeStats.value.negativePercent}%)` }
      ],
      video: null, audio: null, text: null, evidenceCount: d.attitude.evidences.length
    },
    {
      title: '5. 潜在舆论风险', scoreLabel: `风险值 ${d.opinionRisk.modalityFusion.finalScore}%`,
      scoreClass: cls(d.opinionRisk.modalityFusion.finalScore),
      rows: [{ label: '风险原因', value: d.opinionRisk.riskReason }],
      video: d.opinionRisk.modalityFusion.videoScore, audio: d.opinionRisk.modalityFusion.audioScore,
      text: d.opinionRisk.modalityFusion.textScore, evidenceCount: d.opinionRisk.evidences.length
    },
    {
      title: '6. 处置建议', scoreLabel: d.action.actionSuggestion,
      scoreClass: cls(d.action.modalityFusion.finalScore),
      rows: [{ label: '详细说明', value: d.action.actionDetail }],
      video: d.action.modalityFusion.videoScore, audio: d.action.modalityFusion.audioScore,
      text: d.action.modalityFusion.textScore, evidenceCount: d.action.evidences.length
    }
  ]
})

const currentDateTime = computed(() => {
  return new Date().toLocaleString('zh-CN', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' })
})

const formatDuration = (seconds: number) => `${Math.floor(seconds / 60)}分${Math.floor(seconds % 60)}秒`
const formatTime = (seconds: number) => `${Math.floor(seconds / 60).toString().padStart(2, '0')}:${Math.floor(seconds % 60).toString().padStart(2, '0')}`

const getConclusionClass = () => {
  const s = props.data.action.modalityFusion.finalScore
  return s >= 70 ? 'risk-high' : s >= 40 ? 'risk-mid' : 'risk-low'
}

const getModalityText = (m: string) => ({ speech: '语音', visual: '视觉', 'audio-effect': '声学' }[m] || m)

const initRadarChart = () => {
  if (!radarChartRef.value) return
  const chart = echarts.init(radarChartRef.value)
  chart.setOption({
    animation: false,
    radar: {
      radius: '58%',
      center: ['50%', '54%'],
      indicator: [
        { name: '身份置信', max: 100 }, { name: '学校关联', max: 100 },
        { name: '负面情感', max: 100 }, { name: '传播风险', max: 100 },
        { name: '影响范围', max: 100 }, { name: '处置紧迫', max: 100 }
      ],
      shape: 'polygon', splitNumber: 4,
      axisName: { color: '#333', fontSize: 11, padding: [0, 4] },
      splitLine: { lineStyle: { color: '#ddd' } },
      splitArea: { show: true, areaStyle: { color: ['#fafafa', '#f5f5f5'] } }
    },
    series: [{ type: 'radar', data: [{
      value: props.data.timelineData.averageRadarData, name: '综合评估',
      areaStyle: { color: 'rgba(0,0,0,0.06)' },
      lineStyle: { color: '#333', width: 1.5 },
      itemStyle: { color: '#333' }
    }] }]
  })
  window.addEventListener('beforeprint', () => chart.resize())
}

const initTrendChart = () => {
  if (!trendChartRef.value) return
  const chart = echarts.init(trendChartRef.value)
  const g = props.data.timelineData.timeGranularity
  const xData = props.data.timelineData.comprehensiveRisks.map((_, i) => formatTime(i * g))
  chart.setOption({
    animation: false,
    grid: { left: 50, right: 72, top: 28, bottom: 36 },
    xAxis: { type: 'category', data: xData, axisLabel: { color: '#666', fontSize: 10 }, axisLine: { lineStyle: { color: '#ccc' } } },
    yAxis: { type: 'value', name: '风险强度', min: 0, max: 1, axisLabel: { color: '#666', fontSize: 10 }, splitLine: { lineStyle: { color: '#eee', type: 'dashed' } } },
    series: [{
      name: '综合风险', type: 'line', smooth: true,
      data: props.data.timelineData.comprehensiveRisks.map(r => r.intensity),
      lineStyle: { color: '#333', width: 1.5 },
      areaStyle: { color: { type: 'linear', x: 0, y: 0, x2: 0, y2: 1, colorStops: [{ offset: 0, color: 'rgba(0,0,0,0.1)' }, { offset: 1, color: 'rgba(0,0,0,0.02)' }] } },
      itemStyle: { color: '#333' },
      markLine: { silent: true, symbol: 'none', lineStyle: { color: '#c00', type: 'dashed', width: 1 }, label: { show: true, position: 'end', formatter: '高风险阈值', color: '#c00', fontSize: 10 }, data: [{ yAxis: 0.70 }] },
      markArea: { silent: true, data: [[ { xAxis: riskPeakAnalysis.value.peakIndex, itemStyle: { color: 'rgba(200,0,0,0.08)' } }, { xAxis: riskPeakAnalysis.value.peakIndex } ]] }
    }]
  })
  window.addEventListener('beforeprint', () => chart.resize())
}

onMounted(() => nextTick(() => { initRadarChart(); initTrendChart() }))
</script>

<style scoped lang="scss">
// ====================================================================
//  专业研报 / 公文排版 —— A4 打印优先
// ====================================================================

// -------------------- 打印页面设置 --------------------
@page {
  size: A4 portrait;
  margin: 20mm;
}

// -------------------- 屏幕容器 --------------------
.report-view {
  background: var(--bg-page, #f5f5f5);
  min-height: 100vh;
  padding: 24px;
  position: relative;
}

// 深色模式：报告纸面保持白色（打印文档），但容器背景随主题
[data-theme='dark'] .report-view .report-paper {
  box-shadow: 0 0 0 1px rgba(255, 255, 255, 0.08), 0 4px 24px rgba(0, 0, 0, 0.4);
}

// -------------------- 导出按钮（仅屏幕可见） --------------------
.report-actions {
  position: sticky;
  top: 8px;
  z-index: 10;
  display: flex;
  justify-content: flex-end;
  padding: 0 0 10px 0;
  pointer-events: none;
}

.export-btn {
  pointer-events: auto;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 7px 16px;
  background: #4461f2;
  border: none;
  border-radius: 6px;
  font-size: 13px;
  font-weight: 500;
  color: #fff;
  cursor: pointer;
  box-shadow: 0 2px 10px rgba(68, 97, 242, 0.35);
  transition: all 0.25s cubic-bezier(0.25, 0.8, 0.25, 1);
  letter-spacing: 0.5px;

  .el-icon {
    font-size: 14px;
    color: #fff;
  }

  &:hover {
    background: #3451d1;
    box-shadow: 0 4px 16px rgba(68, 97, 242, 0.45);
    transform: scale(1.02);
  }

  &:active {
    transform: scale(0.98);
    box-shadow: 0 1px 6px rgba(68, 97, 242, 0.25);
  }
}

// -------------------- A4 纸面 --------------------
// 纸张内容始终使用印刷风格（深浅色模式均相同）
// App.vue 的 [data-theme='dark'] p/span/div 全局规则会被我们在 App.vue 中专门排除
.report-paper {
  position: relative;
  max-width: 794px;
  min-height: 297mm;
  margin: 0 auto;
  transform: translateY(-50px);
  background: #ffffff !important; // 始终白色纸张
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.12);
  padding: 28mm 24mm;
  color: #333333 !important; // 始终深色文字（打印风格）
  font-size: 14px;
  line-height: 1.8;
  font-family: "SimSun", "Songti SC", "Microsoft YaHei", "PingFang SC", serif;
}

// -------------------- 封面 --------------------
.cover {
  text-align: center;
  padding-bottom: 48px;
  margin-bottom: 48px;
  page-break-after: always;
  break-after: page;
}
.cover-rule-thick { height: 3px; background: #333; }
.cover-rule-thin { height: 1px; background: #333; margin-top: 2px; margin-bottom: 2px; }
.cover-confidential {
  margin-top: 40px;
  font-size: 13px;
  color: #888;
  letter-spacing: 6px;
}
.cover-title {
  font-size: 30px;
  font-weight: 800;
  letter-spacing: 8px;
  margin: 36px 0 8px;
  color: #000;
  font-family: "SimHei", "Microsoft YaHei", sans-serif;
}
.cover-subtitle {
  font-size: 13px;
  color: #999;
  letter-spacing: 2px;
  margin-bottom: 52px;
}
.cover-info { display: flex; justify-content: center; margin-bottom: 52px; }
.cover-table {
  border-collapse: collapse;
  font-size: 14px;
  text-align: left;
  td { padding: 10px 8px; color: #333; }
  .ct-key { font-weight: 600; color: #1a1a1a; white-space: nowrap; text-align: right; padding-right: 0; letter-spacing: 1px; }
  .ct-sep { padding: 10px 10px 10px 4px; color: #999; width: 20px; }
}
.cover-org { font-size: 15px; font-weight: 600; color: #333; letter-spacing: 2px; margin-bottom: 6px; }
.cover-version { font-size: 13px; color: #999; margin-bottom: 40px; }
.text-link { color: #1565c0; text-decoration: none; word-break: break-all; &:hover { text-decoration: underline; } }

// -------------------- 通用区块 --------------------
.section {
  margin-bottom: 24px;
  page-break-inside: avoid;
  break-inside: avoid;
}
.page-break {
  page-break-before: always;
  break-before: page;
}
.section-heading {
  font-size: 17px;
  font-weight: 700;
  color: #000;
  border-bottom: 2px solid #333;
  padding-bottom: 6px;
  // 章节感：与上方内容保持足够间距，但不过大以免页面底部大片留白
  margin: 28px 0 14px;
  letter-spacing: 1px;
  font-family: "SimHei", "Microsoft YaHei", sans-serif;

  &:first-child {
    margin-top: 0;
  }
}
.sub-block { margin-bottom: 14px; }
.sub-heading {
  font-size: 14.5px;
  font-weight: 600;
  color: #1a1a1a;
  &.center { text-align: center; }
}
.body-text { font-size: 14px; color: #333; line-height: 1.8; margin: 0 0 8px; }
.indent-text { text-indent: 2em; }

// ====================================================================
//  学术三线表 —— 所有表格通用基础
// ====================================================================
.info-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 14px;
  line-height: 1.8;
  margin-bottom: 12px;
  border-top: 2px solid #333;
  border-bottom: 2px solid #333;

  th, td {
    border: none;
    padding: 12px 12px;
    text-align: left;
    vertical-align: top;
  }
  th {
    border-bottom: 1px solid #333;
    background: none;
    font-weight: 600;
    color: #000;
    padding: 10px 12px;
  }

  .it-key {
    background: none;
    font-weight: 600;
    color: #1a1a1a;
    white-space: nowrap;
    width: 110px;
  }
}

// -------------------- 风险标签（唯一保留高饱和色的元素） --------------------
.risk-tag {
  display: inline-block;
  padding: 3px 14px;
  font-size: 14px;
  font-weight: 700;
  letter-spacing: 1px;
  // 降低圆角感，更接近公文严肃感
  border-radius: 2px;
}
// 深红色更稳重庄严
.risk-high { background: #C00000; color: #fff; font-weight: 700; }
.risk-mid  { background: #e8a000; color: #fff; font-weight: 700; }
.risk-low  { background: #2e7d32; color: #fff; font-weight: 700; }

// -------------------- 关键词（紧凑排版，避免最后一个词单独换行；减少与下节留白） --------------------
.kw-list {
  display: flex;
  flex-wrap: wrap;
  gap: 4px 8px;
  width: 100%;
  align-items: center;
}
.kw-item {
  padding: 2px 8px;
  font-size: 13px;
  border: 1px solid #d0d0d0;
  border-radius: 2px;
  background: none;
  color: #333;
  flex-shrink: 0;
  white-space: nowrap;
}
.kw-highlight {
  border-color: #333;
  font-weight: 700;
  color: #000;
}

// -------------------- 两栏布局 --------------------
.two-col {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
  page-break-inside: avoid;
  break-inside: avoid;
}
.col {
  border: 1px solid #d0d0d0;
  border-radius: 2px;
  padding: 16px;
  page-break-inside: avoid;
  break-inside: avoid;
}
.radar-chart {
  width: 100%;
  height: 300px;
  min-height: 300px;
  overflow: visible;
  page-break-inside: avoid;
  break-inside: avoid;
}
.chart-box {
  border: 1px solid #d0d0d0;
  border-radius: 2px;
  padding: 14px;
  overflow: visible;
  page-break-inside: avoid;
  break-inside: avoid;
}
.chart-box-wide {
  // 突破报告纸左右内边距，让折线图获得更大展示宽度
  margin-left: -16mm;
  margin-right: -16mm;
  border-radius: 0;
  border: none;
  padding: 16px 20px;
  overflow: visible;
}
.trend-chart {
  width: 100%;
  height: 260px;
  min-height: 260px;
  overflow: visible;
  page-break-inside: avoid;
  break-inside: avoid;
}

// -------------------- 贡献度 --------------------
.contrib-list {
  display: flex;
  flex-direction: column;
  gap: 22px;
  justify-content: center;
  height: calc(100% - 32px);
}
.contrib-row {
  display: grid;
  grid-template-columns: 70px 1fr 50px;
  align-items: center;
  gap: 10px;
}
.contrib-label { font-size: 13px; font-weight: 600; color: #1a1a1a; white-space: nowrap; }
.contrib-bar { height: 7px; background: #eee; overflow: hidden; min-width: 0; border-radius: 1px; }
.contrib-fill { height: 100%; }
.fill-video { background: #444; }
.fill-audio { background: #777; }
.fill-text  { background: #aaa; }
.contrib-num { font-size: 12px; color: #555; text-align: right; }

// -------------------- 提示框 --------------------
.note-box {
  margin-top: 14px;
  padding: 12px 16px;
  border-left: 3px solid #C00000;
  background: none;
  font-size: 14px;
  color: #333;
  line-height: 1.8;
  page-break-inside: avoid;
  break-inside: avoid;
  strong { color: #C00000; }
}
.note-danger { border-left-width: 4px; }

// ====================================================================
//  六大维度卡片
// ====================================================================
.dim-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 24px 20px;
}
.dim-card {
  border: none;
  border-top: 1px solid #e0e0e0;
  padding-top: 4px;
  page-break-inside: avoid;
  break-inside: avoid;
}
.dim-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 0;
  border-bottom: none;
  background: none;
}
.dim-title { font-size: 14px; font-weight: 700; color: #000; }
.dim-score { font-size: 12px; font-weight: 600; padding: 2px 8px; border-radius: 2px; }
// 淡化维度标签：浅色背景 + 深色文字，视觉降噪
.sc-high { background: rgba(192, 0, 0, 0.10);  color: #C00000; font-weight: 700; border-radius: 2px; }
.sc-mid  { background: rgba(200, 120, 0, 0.12); color: #9a5f00; font-weight: 700; border-radius: 2px; }
.sc-low  { background: rgba(46, 125, 50, 0.10); color: #1b5e20; font-weight: 700; border-radius: 2px; }
.dim-body { padding: 6px 0 0; font-size: 13px; line-height: 1.8; }
.dim-row { margin-bottom: 4px; }
.dim-row-key { font-weight: 600; color: #333; margin-right: 6px; }
.dim-modality {
  display: flex;
  gap: 14px;
  margin-top: 8px;
  padding: 5px 0;
  border-top: none;
  background: none;
  font-size: 12px;
  color: #555;
}
.dim-evidence { text-align: right; font-size: 12px; color: #999; margin-top: 4px; }

// ====================================================================
//  证据表格 —— 学术三线表（严格三线规范）
// ====================================================================
.ev-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 13px;
  line-height: 1.8;
  // 三线：顶线（粗）+ 底线（粗），竖线全部禁止
  border-top: 1.5pt solid #333;
  border-bottom: 1.5pt solid #333;

  thead {
    // 极微弱灰色背景作为视觉锚点，不抢夺注意力
    background: #f9f9f9;
    th {
      padding: 10px 10px;
      text-align: left;
      // 表头加粗深色，确保标题栏的锚点感
      font-weight: 700;
      color: #1a1a1a;
      background: #f9f9f9;
      // 三线：thead 下方的细分隔线
      border: none;
      border-top: 1.5pt solid #333;
      border-bottom: 1.5pt solid #333;
      // 严禁竖线
      border-left: none;
      border-right: none;
    }
  }
  tbody {
    tr {
      page-break-inside: avoid;
      break-inside: avoid;
      // 条纹区分行，替代内部横线
      &:nth-child(even) {
        background: rgba(0, 0, 0, 0.02);
      }
    }
    td {
      // 扩容：增大呼吸感
      padding: 12px 8px;
      // tbody 内部无任何边线
      border: none;
      border-left: none;
      border-right: none;
      color: #333;
      vertical-align: top;
    }
  }
  .center { text-align: center; vertical-align: middle; }
}
.row-danger {
  td:first-child { border-left: 3px solid #C00000; }
}
.tag-danger {
  display: inline-block;
  padding: 1px 6px;
  background: #C00000;
  color: #fff;
  font-size: 11px;
  font-weight: 700;
  margin-right: 6px;
  vertical-align: middle;
  border-radius: 2px;
}
.ev-kw { color: #777; font-size: 12px; }
// 风险分值超过80分加粗醒目
.score-critical { font-weight: 700; color: #C00000; }

// -------------------- 人物特征自然描述 --------------------
.char-list { margin: 0; }
.char-item {
  font-size: 14px;
  color: #333;
  line-height: 1.8;
  margin: 0 0 3px;
}
.char-key {
  font-weight: 700;
  color: #1a1a1a;
}

// -------------------- 签章 --------------------
.sign-area {
  margin-top: 48px;
  padding-top: 24px;
  border-top: 1px solid #999;
  page-break-inside: avoid;
  break-inside: avoid;
}
.sign-row { display: grid; grid-template-columns: 1fr 1fr; gap: 48px; margin-bottom: 22px; }
.sign-item { display: flex; align-items: flex-end; gap: 10px; }
.sign-label {
  font-size: 14px;
  font-weight: 600;
  color: #1a1a1a;
  white-space: nowrap;
  // 固定等宽：以最长标签"签发日期："为基准，确保签字线起点对齐
  min-width: 5.5em;
  display: inline-block;
}
.sign-line { flex: 1; border-bottom: 1px solid #888; min-height: 30px; }

// -------------------- 页脚 --------------------
.report-foot {
  margin-top: 36px;
  page-break-inside: avoid;
  break-inside: avoid;
}
.foot-rule { height: 1px; background: #999; margin-bottom: 8px; }
.foot-row { display: flex; justify-content: space-between; font-size: 11px; color: #999; margin-bottom: 3px; }

// ====================================================================
//  @media print —— 打印 / PDF 导出核心
// ====================================================================
@media print {
  * {
    -webkit-print-color-adjust: exact !important;
    print-color-adjust: exact !important;
  }

  .report-actions,
  .export-btn { display: none !important; }

  .report-view {
    padding: 0;
    background: #fff;
  }

  .report-paper {
    max-width: 100%;
    box-shadow: none;
    margin: 0;
    padding: 0;
    background: #fff;
    color: #333;
  }

  .cover {
    page-break-after: always;
    break-after: page;
  }

  .section {
    page-break-inside: avoid;
    break-inside: avoid;
  }
  .page-break {
    page-break-before: always;
    break-before: page;
  }

  .two-col,
  .col,
  .radar-chart,
  .chart-box,
  .trend-chart,
  .note-box,
  .dim-card,
  .sign-area,
  .report-foot {
    page-break-inside: avoid;
    break-inside: avoid;
  }

  .ev-table {
    thead { display: table-header-group; }
    tr {
      page-break-inside: avoid;
      break-inside: avoid;
    }
  }

  .info-table tr {
    page-break-inside: avoid;
    break-inside: avoid;
  }
}
</style>

<!-- 非 scoped：报告纸张内容完全硬编码为浅色印刷配色，不随主题变化 -->
<style>
.report-paper {
  color: #333333 !important;
  background: #ffffff !important;
}
.report-paper *:not(.risk-high):not(.risk-mid):not(.risk-low):not(.sc-high):not(.sc-mid):not(.sc-low):not(.tag-danger):not(.score-critical):not(.note-box strong) {
  color: #333333 !important;
}
.report-paper .cover-title,
.report-paper .section-heading,
.report-paper .dim-title,
.report-paper .kw-highlight {
  color: #000000 !important;
}
.report-paper .cover-confidential,
.report-paper .cover-subtitle,
.report-paper .cover-version,
.report-paper .ct-sep,
.report-paper .dim-evidence,
.report-paper .ev-kw,
.report-paper .foot-row {
  color: #999999 !important;
}
.report-paper .sub-heading,
.report-paper .ct-key,
.report-paper .it-key,
.report-paper .contrib-label,
.report-paper .char-key,
.report-paper .sign-label {
  color: #1a1a1a !important;
}
.report-paper .contrib-num,
.report-paper .dim-modality {
  color: #555555 !important;
}
.report-paper .text-link {
  color: #1565c0 !important;
}
.report-paper .risk-high { color: #ffffff !important; background: #C00000 !important; }
.report-paper .risk-mid  { color: #ffffff !important; background: #e8a000 !important; }
.report-paper .risk-low  { color: #ffffff !important; background: #2e7d32 !important; }
.report-paper .sc-high { color: #C00000 !important; }
.report-paper .sc-mid { color: #9a5f00 !important; }
.report-paper .sc-low { color: #1b5e20 !important; }
.report-paper .tag-danger { color: #ffffff !important; background: #C00000 !important; }
.report-paper .score-critical,
.report-paper .note-box strong {
  color: #C00000 !important;
}
</style>

