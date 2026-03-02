<template>
  <div class="report-view">
    <div class="report-actions" v-if="!hideExport">
      <button class="export-btn" @click="handleExport">
        <el-icon><Download /></el-icon>
        导出报告
      </button>
    </div>
    <div v-else class="report-actions-placeholder"></div>

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
        <h2 class="section-heading no-border first">综合结论</h2>
        <table class="info-table">
          <tr>
            <td class="it-key">最终建议</td>
            <td><span class="risk-tag" :class="getConclusionClass()">{{ data.action.actionSuggestion }}</span></td>
          </tr>
          <tr><td class="it-key">详细说明</td><td>{{ data.action.actionDetail }}</td></tr>
          <tr><td class="it-key">身份判定</td><td>{{ data.identity.identityLabel }}（置信度 {{ data.identity.modalityFusion.finalScore }}%）</td></tr>
          <tr><td class="it-key">涉及高校</td><td>{{ data.university.universityName }}（关联度 {{ data.university.modalityFusion.finalScore }}%）</td></tr>
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
          <p v-if="data.videoInfo.mainCharacter.gender" class="char-item"><strong class="char-key">性别：</strong>{{ data.videoInfo.mainCharacter.gender }}</p>
          <p v-if="data.videoInfo.mainCharacter.ageRange" class="char-item"><strong class="char-key">年龄段：</strong>{{ data.videoInfo.mainCharacter.ageRange }}</p>
          <p v-if="data.videoInfo.mainCharacter.voiceProfile" class="char-item"><strong class="char-key">语音特征：</strong>{{ data.videoInfo.mainCharacter.voiceProfile }}</p>
          <p v-if="data.videoInfo.mainCharacter.clothing" class="char-item"><strong class="char-key">着装：</strong>{{ data.videoInfo.mainCharacter.clothing }}</p>
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
            <h3 class="sub-heading center">综合风险评估</h3>
            <table class="radar-table">
              <thead><tr><th>维度</th><th class="bar-cell"></th><th class="center">得分</th></tr></thead>
              <tbody>
                <tr v-for="rd in radarRows" :key="rd.name">
                  <td>{{ rd.name }}</td>
                  <td class="bar-cell"><div class="radar-bar-bg"><div class="radar-bar-fill" :style="{ width: rd.value + '%' }"></div></div></td>
                  <td class="score-cell">{{ rd.value }}</td>
                </tr>
              </tbody>
            </table>
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
        <table class="trend-table">
          <thead><tr><th style="width:18%">时间段</th><th class="bar-cell">风险强度</th><th style="width:12%;text-align:center">数值</th><th style="width:12%;text-align:center">等级</th></tr></thead>
          <tbody>
            <tr v-for="(point, idx) in riskTrendRows" :key="idx">
              <td>{{ point.timeLabel }}</td>
              <td class="bar-cell">
                <div class="trend-bar-bg">
                  <div class="trend-bar-fill" :class="point.fillClass" :style="{ width: (point.intensity * 100) + '%' }"></div>
                </div>
              </td>
              <td class="center">{{ (point.intensity * 100).toFixed(1) }}%</td>
              <td class="center">
                <span v-if="point.intensity >= 0.667" class="tag-danger">高风险</span>
                <span v-else-if="point.intensity >= 0.333">中风险</span>
                <span v-else>低风险</span>
              </td>
            </tr>
          </tbody>
        </table>
        <div class="note-box">
          <template v-if="riskPeakAnalysis.peakIntensity >= 0.9"><strong>【极高风险红色预警】</strong></template>
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
        <h2 class="section-heading no-border">五、详细证据清单</h2>
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
            <tr v-for="event in data.timelineEvents" :key="event.id">
              <td>{{ formatTime(event.startTime) }}-{{ formatTime(event.endTime) }}</td>
              <td>{{ getModalityText(event.modality) }}</td>
              <td>
                <span v-if="event.riskScore > 66.7" class="tag-danger">高危</span>
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
        <h2 class="section-heading no-border">六、场景识别轨迹</h2>
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
        <table class="sign-table">
          <tr>
            <td><span class="sign-label">分析员：</span>________________</td>
            <td><span class="sign-label">审核员：</span>________________</td>
          </tr>
          <tr>
            <td><span class="sign-label">签发日期：</span>________________</td>
            <td></td>
          </tr>
        </table>
      </div>

      <!-- 页脚 -->
      <div class="report-foot">
        <div class="foot-rule"></div>
        <div class="foot-row">生成时间：{{ currentDateTime }}&nbsp;&nbsp;&nbsp;&nbsp;报告编号：{{ data.videoInfo.videoId }}</div>
        <div class="foot-row">系统版本：多模态高校内容创作者行为分析系统 v1.0</div>
      </div>
    </div>
  </div>
</template>

<!-- SCRIPT_PLACEHOLDER -->
<script setup lang="ts">
import { computed } from 'vue'
import { ElMessage } from 'element-plus'
import { Download } from '@element-plus/icons-vue'
import type { AnalysisResult } from '@/data/mockAnalysisResult'
import { useExportReport } from '@/composables/useExportReport'

defineEmits<{ 'export-pdf': [] }>()
const props = defineProps<{ data: AnalysisResult; hideExport?: boolean }>()
const { exportReportByUrl } = useExportReport()

const handleExport = () => {
  const pdfUrl = (props.data as any).reportPdfUrl
  if (pdfUrl) {
    const fileName = props.data.videoInfo?.fileName
      ? props.data.videoInfo.fileName.replace(/\.[^.]+$/, '.pdf')
      : undefined
    exportReportByUrl(pdfUrl, fileName)
  } else {
    ElMessage.warning('PDF 报告尚未生成，请稍后重试')
  }
}

const radarRows = computed(() => {
  const names = ['身份置信', '学校关联', '负面情感', '传播风险', '影响范围', '处置紧迫']
  const values = props.data.timelineData.averageRadarData
  return names.map((name, i) => ({ name, value: values[i] ?? 0 }))
})

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
    positive, neutral, negative,
    positivePercent: ((positive / total) * 100).toFixed(1),
    neutralPercent: ((neutral / total) * 100).toFixed(1),
    negativePercent: ((negative / total) * 100).toFixed(1)
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

const riskTrendRows = computed(() => {
  const risks = props.data.timelineData.comprehensiveRisks
  const g = props.data.timelineData.timeGranularity
  return risks.map((r, i) => ({
    timeLabel: `${formatTime(i * g)} - ${formatTime((i + 1) * g)}`,
    intensity: r.intensity,
    fillClass: r.intensity >= 0.667 ? 'trend-fill-high' : r.intensity >= 0.333 ? 'trend-fill-mid' : 'trend-fill-low'
  }))
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
  const cls = (score: number) => score >= 67 ? 'sc-high' : score >= 34 ? 'sc-mid' : 'sc-low'
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
  return s >= 67 ? 'risk-high' : s >= 34 ? 'risk-mid' : 'risk-low'
}
const getModalityText = (m: string) => ({ speech: '语音', visual: '视觉', 'audio-effect': '声学' }[m] || m)
</script>

<!-- STYLE_PLACEHOLDER -->
<style scoped lang="scss">
@page { size: A4 portrait; margin: 20mm; }

.report-view {
  background: var(--bg-page);
  min-height: 100vh;
  padding: 24px;
  position: relative;
}

.report-actions {
  position: sticky; top: 8px; z-index: 10;
  display: flex; justify-content: flex-end;
  padding: 0 0 10px 0; pointer-events: none;
}
.report-actions-placeholder {
  height: 45px;
}
.export-btn {
  pointer-events: auto;
  display: inline-flex; align-items: center; gap: 6px;
  padding: 7px 16px; background: #4461f2; border: none; border-radius: 6px;
  font-size: 13px; font-weight: 500; color: #fff; cursor: pointer;
  box-shadow: none;
  transition: all 0.25s cubic-bezier(0.25, 0.8, 0.25, 1);
  letter-spacing: 0.5px;
  .el-icon { font-size: 14px; color: #fff; }
  &:hover { background: #3451d1; box-shadow: none; transform: scale(1.02); }
  &:active { transform: scale(0.98); box-shadow: none; }
}

.report-paper {
  position: relative; max-width: 794px; min-height: 297mm;
  margin: 0 auto; transform: translateY(-50px);
  background: var(--bg-card); box-shadow: var(--shadow-md);
  padding: 20mm; color: var(--text-primary);
  font-size: 14px; line-height: 1.8;
  font-family: "SimSun", "Songti SC", "Microsoft YaHei", "PingFang SC", serif;
}

// ===== 封面 =====
.cover {
  text-align: center; padding-top: 60px; margin-bottom: 0;
  page-break-after: always; break-after: page;
}
.cover-rule-thick { height: 3px; background: var(--text-primary); }
.cover-rule-thin { height: 1px; background: var(--text-primary); margin-top: 2px; margin-bottom: 2px; }
.cover-confidential { margin-top: 40px; font-size: 13.3px; color: var(--text-tertiary); letter-spacing: 6px; }
.cover-title {
  font-size: 29.3px; font-weight: 800; letter-spacing: 8px;
  margin: 36px 0 8px; color: var(--text-primary);
  font-family: "SimHei", "Microsoft YaHei", sans-serif;
}
.cover-subtitle { font-size: 13.3px; color: var(--text-tertiary); letter-spacing: 2px; margin-bottom: 52px; }
.cover-info { display: flex; justify-content: center; margin-bottom: 52px; }
.cover-table {
  border-collapse: collapse; font-size: 14px; text-align: left;
  td { padding: 10px 8px; color: var(--text-secondary); }
  .ct-key { font-weight: 600; color: var(--text-primary); white-space: nowrap; text-align: right; padding-right: 0; letter-spacing: 1px; }
  .ct-sep { padding: 10px 10px 10px 4px; color: var(--text-tertiary); width: 20px; }
}
.cover-org { font-size: 14.7px; font-weight: 600; color: var(--text-secondary); letter-spacing: 2px; margin-bottom: 6px; }
.cover-version { font-size: 13.3px; color: var(--text-tertiary); margin-bottom: 40px; }
.text-link { color: #1565c0; text-decoration: none; word-break: break-all; &:hover { text-decoration: underline; } }

// ===== 通用区块 =====
.section { margin-bottom: 20px; page-break-inside: avoid; break-inside: avoid; }
.page-break { page-break-before: always; break-before: page; }
.section-heading {
  font-size: 17.3px; font-weight: 700; color: var(--text-primary);
  border-bottom: 2px solid var(--text-primary); padding-bottom: 6px;
  margin: 24px 0 12px; letter-spacing: 1px;
  font-family: "SimHei", "Microsoft YaHei", sans-serif;
  &:first-child, &.first { margin-top: 8px; }
  &.no-border { border-bottom: none; padding-bottom: 0; margin-bottom: 8px; }
}
.sub-block { margin-bottom: 12px; }
.sub-heading {
  font-size: 14.7px; font-weight: 600; color: var(--text-primary); margin-bottom: 6px; margin-top: 10px;
  &.center { text-align: center; }
}
.body-text { font-size: 14px; color: var(--text-secondary); line-height: 1.8; margin: 0 0 6px; }
.indent-text { text-indent: 2em; }

// ===== 三线表 =====
.info-table {
  width: 100%; border-collapse: collapse; font-size: 14px;
  line-height: 1.8; margin-bottom: 10px;
  border-top: 2px solid var(--border-color); border-bottom: 2px solid var(--border-color);
  th, td { border: none; padding: 10px 10px; text-align: left; vertical-align: top; }
  th { border-bottom: 1px solid var(--border-color); background: none; font-weight: 600; color: var(--text-primary); padding: 8px 10px; }
  .it-key { background: none; font-weight: 600; color: var(--text-primary); white-space: nowrap; width: 100px; }
}

// ===== 风险标签 =====
.risk-tag {
  display: inline; padding: 2px 12px; font-size: 14px;
  font-weight: 700;
}
.risk-high { background: #C00000; color: #fff; }
.risk-mid  { background: #e8a000; color: #fff; }
.risk-low  { background: #2e7d32; color: #fff; }

// ===== 关键词 =====
.kw-list { display: flex; flex-wrap: wrap; gap: 3px 4px; width: 100%; align-items: center; }
.kw-item {
  padding: 1px 6px; font-size: 12px; border: 1px solid var(--border-color);
  color: var(--text-secondary); flex-shrink: 0; white-space: nowrap;
}
.kw-highlight { border-color: var(--text-primary); font-weight: 700; color: var(--text-primary); }

// ===== 两栏布局 =====
.two-col {
  display: grid; grid-template-columns: 1fr 1fr; gap: 0;
  align-items: stretch;
  page-break-inside: avoid; break-inside: avoid;
}
.col {
  display: flex; flex-direction: column;
  page-break-inside: avoid; break-inside: avoid;
  &:first-child { padding-right: 10px; }
  &:last-child { padding-left: 10px; }
}

// ===== 雷达数据表 =====
.radar-table {
  width: 100%; border-collapse: collapse; font-size: 13.3px;
  border-top: 1.5pt solid var(--border-color); border-bottom: 1.5pt solid var(--border-color); margin-top: 8px;
  th {
    padding: 6px 8px; text-align: left; font-weight: 700; color: var(--text-primary);
    border-bottom: 1pt solid var(--border-color); border-top: none;
  }
  td { padding: 5px 8px; border: none; }
  .bar-cell { width: 45%; }
  .score-cell { text-align: center; font-weight: 600; }
}
.radar-bar-bg { background: var(--bg-hover); height: 8px; width: 100%; }
.radar-bar-fill { height: 8px; background: var(--text-secondary); }

// ===== 贡献度 =====
.contrib-list {
  display: flex; flex-direction: column; gap: 0;
  justify-content: center; flex: 1;
  margin-top: 8px;
}
.contrib-row {
  display: grid; grid-template-columns: 60px 1fr 50px;
  align-items: center; gap: 6px; padding: 8px 6px;
}
.contrib-label { font-size: 13.3px; font-weight: 600; color: var(--text-primary); white-space: nowrap; }
.contrib-bar { height: 8px; background: var(--bg-hover); min-width: 0; }
.contrib-fill { height: 100%; }
.fill-video { background: #444; }
.fill-audio { background: #777; }
.fill-text  { background: #aaa; }
.contrib-num { font-size: 12px; color: var(--text-secondary); text-align: right; }

// ===== 风险走势表 =====
.trend-table {
  width: 100%; border-collapse: collapse; font-size: 13.3px; line-height: 1.8;
  border-top: 1.5pt solid var(--border-color); border-bottom: 1.5pt solid var(--border-color);
  thead {
    background: var(--bg-hover);
    th {
      padding: 6px 8px; text-align: left; font-weight: 700; color: var(--text-primary);
      background: var(--bg-hover); border: none;
      border-bottom: 1pt solid var(--border-color);
    }
  }
  tbody {
    tr { page-break-inside: avoid; break-inside: avoid; }
    td { padding: 4px 8px; border: none; color: var(--text-secondary); vertical-align: middle; }
  }
  .bar-cell { width: 40%; }
}
.trend-bar-bg { background: var(--bg-hover); height: 6px; width: 100%; }
.trend-bar-fill { height: 6px; }
.trend-fill-low  { background: #2e7d32; }
.trend-fill-mid  { background: #e8a000; }
.trend-fill-high { background: #C00000; }

// ===== 提示框 =====
.note-box {
  margin-top: 12px; padding: 10px 14px;
   background: none;
  font-size: 14px; color: var(--text-secondary); line-height: 1.8;
  page-break-inside: avoid; break-inside: avoid;
  strong { color: #C00000; }
}

// ===== 六大维度卡片 =====
.dim-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px 16px; }
.dim-card {
  border-top: 1px solid var(--border-color); padding-top: 6px;
  page-break-inside: avoid; break-inside: avoid;
}
.dim-header {
  margin-bottom: 4px;
}
.dim-title { font-size: 14px; font-weight: 700; color: var(--text-primary); }
.dim-score { font-size: 12px; font-weight: 600; padding: 1px 6px; margin-left: 8px; }
.sc-high { background: #f5e0e0; color: #C00000; }
.sc-mid  { background: #fdf0d5; color: #9a5f00; }
.sc-low  { background: #e0f0e0; color: #1b5e20; }
.dim-body { padding: 4px 0 0; font-size: 13.3px; line-height: 1.8; }
.dim-row { margin-bottom: 3px; }
.dim-row-key { font-weight: 600; color: var(--text-secondary); margin-right: 4px; }
.dim-modality {
  display: flex; gap: 14px; margin-top: 6px;
  font-size: 12px; color: var(--text-secondary);
}
.dim-evidence { text-align: right; font-size: 12px; color: var(--text-tertiary); margin-top: 3px; }

// ===== 证据表格 =====
.ev-table {
  width: 100%; border-collapse: collapse; font-size: 13.3px; line-height: 1.8;
  border-top: 1.5pt solid var(--border-color); border-bottom: 1.5pt solid var(--border-color);
  thead {
    background: var(--bg-hover);
    th {
      padding: 8px 8px; text-align: left; font-weight: 700; color: var(--text-primary);
      background: var(--bg-hover); border: none;
      border-bottom: 1.5pt solid var(--border-color);
    }
  }
  tbody {
    tr { page-break-inside: avoid; break-inside: avoid; }
    td { padding: 8px 8px; border: none; color: var(--text-secondary); vertical-align: top; }
  }
  .center { text-align: center; vertical-align: middle; }
}
.center { text-align: center; }
.tag-danger {
  display: inline; padding: 1px 4px; background: #C00000; color: #fff !important;
  font-size: 10.7px; font-weight: 700; margin-right: 4px;
}
.ev-kw { color: var(--text-tertiary); font-size: 12px; }
.score-critical { font-weight: 700; color: #C00000; }

// ===== 人物特征 =====
.char-item { font-size: 14px; color: var(--text-secondary); line-height: 1.8; margin: 0 0 2px; }
.char-key { font-weight: 700; color: var(--text-primary); }

// ===== 签章区 =====
.sign-area {
  margin-top: 40px; padding-top: 20px; border-top: 1px solid var(--border-color);
  page-break-inside: avoid; break-inside: avoid;
}
.sign-table {
  width: 100%; border-collapse: collapse;
  td { padding: 10px 0; width: 50%; }
}
.sign-label { font-size: 14px; font-weight: 600; color: var(--text-primary); white-space: nowrap; }

// ===== 页脚 =====
.report-foot { margin-top: 30px; page-break-inside: avoid; break-inside: avoid; }
.foot-rule { height: 1px; background: var(--border-color); margin-bottom: 6px; }
.foot-row { font-size: 10.7px; color: var(--text-tertiary); margin-bottom: 2px; }

// ===== 打印 =====
@media print {
  * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
  .report-actions, .export-btn { display: none !important; }
  .report-view { padding: 0; background: #fff; }
  .report-paper { max-width: 100%; box-shadow: none; margin: 0; padding: 0; background: #fff; color: #333; }
  .cover { page-break-after: always; break-after: page; }
  .section { page-break-inside: avoid; break-inside: avoid; }
  .page-break { page-break-before: always; break-before: page; }
  .two-col, .col, .note-box, .dim-card, .sign-area, .report-foot { page-break-inside: avoid; break-inside: avoid; }
  .ev-table { thead { display: table-header-group; } tr { page-break-inside: avoid; break-inside: avoid; } }
  .info-table tr { page-break-inside: avoid; break-inside: avoid; }
}
</style>