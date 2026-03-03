<template>
  <div class="analysis-content-wrapper">
    <transition name="fade" mode="out-in">
      <div
        v-if="viewMode === 'interactive'"
        key="interactive"
        class="interactive-view"
      >
        <!-- 逻辑修复：视频档案卡（本地上传场景） -->
        <div class="video-archive-card neu-card">
          <!-- 数据来源标识 -->
          <div class="video-source-badge">
            <div class="source-label">
              <el-icon :size="14"><Upload /></el-icon>
              <span>{{ mockVideoArchive?.uploadSource || "本地" }}视频</span>
            </div>
            <span class="source-hint">以下传播相关数据为AI预测值</span>
          </div>

          <div class="archive-header">
            <div class="file-section">
              <div class="file-icon">
                <img
                  v-if="analysisArchiveCoverUrl && !archiveCoverLoadFailed"
                  :src="analysisArchiveCoverUrl"
                  :alt="mockVideoArchive?.fileName || '视频封面'"
                  class="file-cover-img"
                  @error="handleArchiveCoverError"
                />
                <div v-else class="file-cover-placeholder">
                  <el-icon :size="28"><VideoCamera /></el-icon>
                </div>
              </div>

              <div class="file-info">
                <!-- 文件名 + 时长 -->
                <div class="file-main">
                  <span class="file-name">{{
                    mockVideoArchive?.fileName || "视频"
                  }}</span>
                  <span class="duration-badge">
                    <el-icon :size="11"><Clock /></el-icon>
                    {{ formatDuration(videoDuration) }}
                  </span>
                </div>

                <!-- AI分析摘要(如果有) -->
                <div
                  class="video-description"
                  v-if="mockVideoArchive.description"
                >
                  <span class="description-label">AI分析摘要：</span>
                  <span class="description-text">{{
                    mockVideoArchive.description
                  }}</span>
                </div>

                <!-- 视频内容人物特征 -->
                <div
                  v-if="
                    analysisResult.videoInfo.mainCharacter &&
                    (analysisResult.videoInfo.mainCharacter.gender ||
                      analysisResult.videoInfo.mainCharacter.ageRange ||
                      analysisResult.videoInfo.mainCharacter.clothing ||
                      analysisResult.videoInfo.mainCharacter.voiceProfile)
                  "
                  class="content-features-row"
                >
                  <div class="feature-label">
                    <el-icon :size="14"><User /></el-icon>
                    视频主要人物:
                  </div>
                  <span
                    v-if="analysisResult.videoInfo.mainCharacter.gender"
                    class="profile-tag"
                  >
                    <el-icon
                      ><Male
                        v-if="
                          analysisResult.videoInfo.mainCharacter.gender.includes(
                            '男',
                          )
                        " /><Female v-else
                    /></el-icon>
                    {{ analysisResult.videoInfo.mainCharacter.gender }}
                  </span>
                  <span
                    v-if="analysisResult.videoInfo.mainCharacter.ageRange"
                    class="profile-tag"
                  >
                    <el-icon><Calendar /></el-icon>
                    {{ analysisResult.videoInfo.mainCharacter.ageRange }}
                  </span>
                  <span
                    v-if="analysisResult.videoInfo.mainCharacter.clothing"
                    class="profile-tag"
                  >
                    <el-icon><School /></el-icon>
                    {{ analysisResult.videoInfo.mainCharacter.clothing }}
                  </span>
                  <span
                    v-if="analysisResult.videoInfo.mainCharacter.voiceProfile"
                    class="profile-tag"
                  >
                    <el-icon><Microphone /></el-icon>
                    {{ analysisResult.videoInfo.mainCharacter.voiceProfile }}
                  </span>
                </div>

                <!-- 检测到的关键内容 -->
                <div
                  v-if="
                    analysisResult.videoInfo.detectedKeywords &&
                    analysisResult.videoInfo.detectedKeywords.length > 0
                  "
                  class="detected-keywords-row"
                >
                  <div class="feature-label">
                    <el-icon :size="14"><Search /></el-icon>
                    内容关键词:
                  </div>
                  <div class="keywords-container">
                    <span
                      v-for="(kw, idx) in analysisResult.videoInfo
                        .detectedKeywords"
                      :key="idx"
                      class="keyword-tag-detected"
                      :class="{ 'university-related': kw.isUniversityRelated }"
                    >
                      {{ kw.word }}
                    </span>
                  </div>
                </div>

                <!-- 挂载的风险词库包 -->
                <div
                  v-if="analysisResult.wordPacks && analysisResult.wordPacks.length > 0"
                  class="detected-keywords-row word-packs-row"
                >
                  <div class="feature-label">
                    <el-icon :size="14"><Warning /></el-icon>
                    分析词库:
                  </div>
                  <div class="keywords-container">
                    <el-tooltip
                      v-for="pack in analysisResult.wordPacks"
                      :key="pack.id"
                      placement="bottom"
                      :show-after="200"
                      popper-class="pack-tooltip-popper"
                    >
                      <template #content>
                        <div class="pack-tooltip-content">
                          <div class="pack-tooltip-header">{{ pack.name }}</div>
                          <div v-if="pack.description" class="pack-tooltip-desc">{{ pack.description }}</div>
                          <div class="pack-tooltip-words">
                            <span v-for="(w, wi) in (pack.words || [])" :key="wi" class="pack-tooltip-word">{{ w.text }}</span>
                            <span v-if="!pack.words || pack.words.length === 0" class="pack-tooltip-empty">暂无词汇</span>
                          </div>
                        </div>
                      </template>
                      <span
                        class="keyword-tag-detected word-pack-tag"
                        :class="`pack-level-${pack.level || 'medium'}`"
                      >
                        <el-icon :size="12"><Collection /></el-icon>
                        {{ pack.name }}
                        <span class="pack-word-count">({{ pack.wordCount || (pack.words && pack.words.length) || 0 }})</span>
                      </span>
                    </el-tooltip>
                  </div>
                </div>
              </div>
            </div>

            <div class="global-stats-section stats-pro-container">
              <!-- 高校舆情分析核心指标 -->
              <div
                class="stat-pro-item"
                :class="{ active: currentCardId === 'identity' }"
                @click="openEvidenceDrawer('identity')"
              >
                <div class="card-tooltip">
                  {{
                    currentCardId === "identity"
                      ? "点击关闭详细证据"
                      : "点击查看详细证据"
                  }}
                </div>
                <div class="pro-icon icon-bg-identity">
                  <el-icon><User /></el-icon>
                </div>
                <div class="pro-content">
                  <div class="pro-label">
                    身份判定
                    <span class="evidence-badge"
                      >({{
                        analysisResult.identity.evidences?.length || 0
                      }})</span
                    >
                  </div>
                  <div class="pro-value text-identity">
                    {{ mockIdentityAnalysis?.identityLabel || "-" }}
                  </div>
                  <div class="pro-subtitle">
                    置信度
                    {{ mockIdentityAnalysis?.modalityFusion?.finalScore || 0 }}%
                  </div>
                </div>
              </div>

              <div
                class="stat-pro-item"
                :class="{ active: currentCardId === 'university' }"
                @click="openEvidenceDrawer('university')"
              >
                <div class="card-tooltip">
                  {{
                    currentCardId === "university"
                      ? "点击关闭详细证据"
                      : "点击查看详细证据"
                  }}
                </div>
                <div class="pro-icon icon-bg-uni">
                  <el-icon><School /></el-icon>
                </div>
                <div class="pro-content">
                  <div class="pro-label">
                    涉及高校
                    <span class="evidence-badge"
                      >({{
                        analysisResult.university.evidences?.length || 0
                      }})</span
                    >
                  </div>
                  <div class="pro-value text-uni">
                    {{ mockUniversityBaseline?.universityName || "-" }}
                  </div>
                  <div class="pro-subtitle">
                    匹配度
                    {{
                      mockUniversityBaseline?.modalityFusion?.finalScore || 0
                    }}%
                  </div>
                </div>
              </div>

              <div
                class="stat-pro-item"
                :class="{ active: currentCardId === 'topic' }"
                @click="openEvidenceDrawer('topic')"
              >
                <div class="card-tooltip">
                  {{
                    currentCardId === "topic"
                      ? "点击关闭详细证据"
                      : "点击查看详细证据"
                  }}
                </div>
                <div class="pro-icon icon-bg-topic">
                  <el-icon><ChatDotRound /></el-icon>
                </div>
                <div class="pro-content">
                  <div class="pro-label">
                    内容主题
                    <span class="evidence-badge"
                      >({{ analysisResult.topic.evidences?.length || 0 }})</span
                    >
                  </div>
                  <div class="pro-value text-topic">
                    {{ mockContentAnalysis?.topicCategory || "-" }}
                  </div>
                  <div class="pro-subtitle">
                    {{ mockContentAnalysis?.topicSubCategory || "" }}
                  </div>
                </div>
              </div>

              <div
                class="stat-pro-item"
                :class="{ active: currentCardId === 'attitude' }"
                @click="openEvidenceDrawer('attitude')"
              >
                <div class="card-tooltip">
                  {{
                    currentCardId === "attitude"
                      ? "点击关闭详细证据"
                      : "点击查看详细证据"
                  }}
                </div>
                <div
                  class="pro-icon"
                  :class="
                    getSentimentIconClass(
                      getSentimentByScore(
                        (attitudeStatistics.negative /
                          attitudeStatistics.total) *
                          100,
                      ),
                    )
                  "
                >
                  <el-icon><TrendCharts /></el-icon>
                </div>
                <div class="pro-content">
                  <div class="pro-label">
                    对学校态度
                    <span class="evidence-badge"
                      >({{
                        analysisResult.attitude.evidences?.length || 0
                      }})</span
                    >
                  </div>
                  <div
                    class="pro-value"
                    :class="
                      getSentimentTextClass(
                        getSentimentByScore(
                          (attitudeStatistics.negative /
                            attitudeStatistics.total) *
                            100,
                        ),
                      )
                    "
                  >
                    {{
                      getSentimentLabel(
                        getSentimentByScore(
                          (attitudeStatistics.negative /
                            attitudeStatistics.total) *
                            100,
                        ),
                      )
                    }}
                  </div>
                  <div class="pro-subtitle">
                    {{
                      mockContentAnalysis?.negativeMentionCount || 0
                    }}处负面，占比
                    {{
                      mockContentAnalysis
                        ? Math.round(
                            (mockContentAnalysis.negativeMentionCount /
                              mockContentAnalysis.schoolMentionCount) *
                              100,
                          )
                        : 0
                    }}%
                  </div>
                </div>
              </div>

              <div
                class="stat-pro-item"
                :class="{ active: currentCardId === 'opinionRisk' }"
                @click="openEvidenceDrawer('opinionRisk')"
              >
                <div class="card-tooltip">
                  {{
                    currentCardId === "opinionRisk"
                      ? "点击关闭详细证据"
                      : "点击查看详细证据"
                  }}
                </div>
                <div
                  class="pro-icon"
                  :class="
                    getOpinionRiskIconClass(
                      getRiskLevelByScore(
                        analysisResult.opinionRisk.modalityFusion.finalScore,
                      ),
                    )
                  "
                >
                  <el-icon><WarningFilled /></el-icon>
                </div>
                <div class="pro-content">
                  <div class="pro-label">
                    潜在舆论风险
                    <span class="evidence-badge"
                      >({{
                        analysisResult.opinionRisk.evidences?.length || 0
                      }})</span
                    >
                    <span class="ai-predict-badge">AI预测</span>
                  </div>
                  <div
                    class="pro-value"
                    :class="
                      getOpinionRiskTextClass(
                        getRiskLevelByScore(
                          analysisResult.opinionRisk.modalityFusion.finalScore,
                        ),
                      )
                    "
                  >
                    {{ mockOpinionRisk?.riskLabel || "-" }}
                  </div>
                  <div class="pro-subtitle">
                    {{ mockOpinionRisk?.riskReason || "" }}
                  </div>
                </div>
              </div>

              <div
                class="stat-pro-item"
                :class="{ active: currentCardId === 'action' }"
                @click="openEvidenceDrawer('action')"
              >
                <div class="card-tooltip">
                  {{
                    currentCardId === "action"
                      ? "点击关闭详细证据"
                      : "点击查看详细证据"
                  }}
                </div>
                <div class="pro-icon icon-bg-action">
                  <el-icon><DocumentChecked /></el-icon>
                </div>
                <div class="pro-content">
                  <div class="pro-label">
                    处置建议
                    <span class="evidence-badge"
                      >({{
                        analysisResult.action.evidences?.length || 0
                      }})</span
                    >
                  </div>
                  <div class="pro-value text-action">
                    {{ mockOpinionRisk?.actionSuggestion || "-" }}
                  </div>
                  <div class="pro-subtitle">
                    {{ mockOpinionRisk?.actionDetail || "" }}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- 视频 + 证据/台词（左右布局，保持宽敞） -->
        <div class="multi-modal-container">
          <!-- 左侧：证据截图区域 -->
          <div
            class="video-section"
            :style="{
              flex: currentCardId ? '1.2' : '1.5',
            }"
          >
            <div class="video-player-wrapper">
              <!-- 真实视频播放器 -->
              <video
                v-if="realVideoUrl"
                ref="mainVideoPlayerRef"
                :src="realVideoUrl"
                class="evidence-snapshot"
                @timeupdate="onVideoTimeUpdate"
                @loadedmetadata="onVideoLoaded"
                controls
                crossorigin="anonymous"
              ></video>

              <!-- 视频占位符 -->
              <div v-else class="video-placeholder">
                <el-icon :size="80" color="#a0a5a8"><VideoPlay /></el-icon>
                <p>请选择风险证据</p>
              </div>

              <!-- 实时风险状态指示器（左上角呼吸灯） -->
              <div
                v-show="realVideoUrl"
                class="risk-status-indicator"
                :class="getCurrentRiskClass()"
              >
                <span class="breathing-dot"></span>
                <span class="risk-label">{{ getCurrentRiskLabel() }}</span>
              </div>

              <!-- 证据时间轴标记 - 只在分屏模式下显示当前卡片的证据 -->
              <div
                v-show="realVideoUrl && currentCardId"
                class="evidence-timeline-overlay"
              >
                <div class="timeline-progress-bar">
                  <!-- 当前播放进度指示器 -->
                  <div
                    class="play-progress-indicator"
                    :style="{
                      left: (currentPlayTime / videoDuration) * 100 + '%',
                    }"
                  ></div>

                  <!-- 证据标记点 - 只显示当前卡片的证据 -->
                  <div
                    v-for="(evidence, index) in currentEvidences"
                    :key="`mark-${index}`"
                    class="evidence-mark"
                    :class="[
                      `mark-type-${evidence.type}`,
                      `mark-card-${currentCardId}`,
                      evidence.sentimentScore !== undefined
                        ? `mark-sentiment-${getSentimentBySentimentScore(evidence.sentimentScore)}`
                        : '',
                      { 'mark-active': isNearCurrentTime(evidence.timestamp) },
                      {
                        'mark-near-start':
                          evidence.timestamp / videoDuration < 0.15,
                      },
                      {
                        'mark-near-end':
                          evidence.timestamp / videoDuration > 0.85,
                      },
                    ]"
                    :style="{
                      left: (evidence.timestamp / videoDuration) * 100 + '%',
                    }"
                    @click="jumpToTime(evidence.timestamp)"
                  >
                    <div class="mark-dot"></div>
                    <div class="mark-popup">
                      <div class="popup-time">
                        {{ formatTimeDisplay(evidence.timestamp) }}
                      </div>
                      <div class="popup-card">{{ currentCardData.label }}</div>
                      <div class="popup-desc">{{ evidence.description }}</div>
                    </div>
                  </div>
                </div>
              </div>

              <!-- CV视觉模态：多检测框叠加层（业界标准） -->
              <div class="detections-overlay" v-show="showDetectionBoxes">
                <div
                  v-for="detection in currentDetections"
                  :key="detection.id"
                  class="detection-box"
                  :class="[
                    `detection-type-${detection.type}`,
                    detection.labelPlacement === 'below' ? 'label-below' : 'label-above',
                    detection.confidence > 0.9 ? 'high-confidence' : '',
                  ]"
                  :style="getDetectionBoxStyle(detection)"
                >
                  <div class="detection-label-container">
                    <span
                      class="detection-label"
                      :style="{ color: getDetectionLabelTextColor(detection.type) }"
                    >
                      {{ detection.label }}
                      <span class="confidence-badge"
                        >{{ Math.round(detection.confidence * 100) }}%</span
                      >
                    </span>
                  </div>
                </div>
              </div>

              <!-- 扫描线特效 -->
              <div class="scanline-effect"></div>

              <!-- CV视觉模态：场景标签（右上角半透明悬浮） -->
              <div class="scene-badge-overlay" v-if="currentScene">
                <div class="scene-badge">
                  <span class="scene-icon">{{ currentScene.icon }}</span>
                  <span class="scene-content">
                    <span class="scene-name">{{ currentScene.name }}</span>
                    <span class="scene-confidence"
                      >置信度
                      {{ Math.round(currentScene.confidence * 100) }}%</span
                    >
                  </span>
                </div>
              </div>

              <!-- CV视觉模态：检测类型图例（左上角） -->
              <div
                class="detection-legend"
                :class="{
                  collapsed: !legendExpanded,
                  'evidence-mode-shift': currentCardId,
                }"
              >
                <div
                  class="legend-header"
                  @click="legendExpanded = !legendExpanded"
                >
                  <div class="legend-title-row">
                    <span class="legend-title">检测类型</span>
                    <span class="expand-icon">
                      {{
                        currentCardId
                          ? legendExpanded
                            ? "▲"
                            : "▼"
                          : legendExpanded
                            ? "▼"
                            : "▲"
                      }}
                    </span>
                  </div>
                  <div
                    class="detection-toggle"
                    :class="{ active: showDetectionBoxes }"
                    @click.stop="showDetectionBoxes = !showDetectionBoxes"
                  >
                    <span class="toggle-icon">{{
                      showDetectionBoxes ? "👁️" : "👁️‍🗨️"
                    }}</span>
                  </div>
                </div>
                <div class="legend-items" v-show="legendExpanded">
                  <div
                    v-for="(color, type) in DETECTION_COLORS"
                    :key="type"
                    class="legend-item"
                  >
                    <span
                      class="legend-color"
                      :style="{ backgroundColor: color }"
                    ></span>
                    <span class="legend-label">{{
                      DETECTION_LABELS[type]
                    }}</span>
                  </div>
                </div>
              </div>

              <!-- 【废弃】当前帧信息叠加 - 已移至事件卡片中显示 -->

              <!-- 伪进度条（已禁用，使用HTML5原生控制条） -->
              <div class="fake-controls" v-if="false">
                <div class="control-left">
                  <el-icon class="control-icon"><VideoPlay /></el-icon>
                  <span class="time-display"
                    >{{ formatCurrentTime() }} /
                    {{ formatTotalDuration() }}</span
                  >
                </div>
                <div class="progress-bar-wrapper">
                  <div class="progress-bar">
                    <div
                      class="progress-now"
                      :style="{ width: getProgressWidth() }"
                    ></div>
                  </div>
                </div>
                <div class="control-right">
                  <el-icon class="control-icon"><Sound /></el-icon>
                  <el-icon class="control-icon"><FullScreen /></el-icon>
                </div>
              </div>
            </div>

            <!-- 多轨道时间轴（去背景，融合风格） -->
            <div
              class="multi-track-timeline-inline"
              @click="onChartContainerClick"
            >
              <v-chart
                ref="timelineChartRef"
                :option="multiModalTimelineOption"
                class="timeline-chart-inline"
                @click="onTimelineClick"
              />
            </div>
          </div>

          <!-- 右侧：字幕 + 雷达图容器 / 证据详情 -->
          <div
            class="right-panel-container"
            :class="{ 'evidence-detail-mode': currentCardId }"
            :style="{ flex: '1' }"
          >
            <!-- 证据详情面板（点击卡片后显示） -->
            <div v-show="currentCardId" class="evidence-detail-panel">
              <div class="evidence-panel-header">
                <div class="header-left">
                  <div
                    class="card-icon-large"
                    :class="currentCardData.iconClass"
                  >
                    <component :is="currentCardData.icon" />
                  </div>
                  <div class="header-info">
                    <div class="panel-title-row">
                      <span class="panel-category">{{
                        currentCardData.label
                      }}</span>
                      <span class="panel-confidence-inline">
                        {{ currentCardData.confidenceLabel || "置信度" }}
                        {{ currentCardData.confidence }}%
                        <el-tooltip
                          v-if="currentCardId === 'opinionRisk'"
                          content="基于视频内容分析，预测如上传到公开平台后可能引发的舆论反应"
                          placement="top"
                          popper-class="custom-tooltip"
                        >
                          <span class="ai-predict-badge-panel">AI预测</span>
                        </el-tooltip>
                      </span>
                    </div>
                    <h2 class="panel-main-value" :class="getPanelValueClass()">
                      {{ currentCardData.value }}
                    </h2>
                  </div>
                </div>
                <button class="close-evidence-btn" @click="closeEvidencePanel">
                  <el-icon><Close /></el-icon>
                </button>
              </div>

              <!-- 证据详情区域（融合分析 + 详细证据） -->
              <div class="evidence-list-section">
                <!-- 多模态融合分析 -->
                <div class="section-title-inline">
                  <el-icon><Link /></el-icon>
                  <span>多模态融合分析</span>
                </div>

                <!-- 三模态卡片 - 横向排列 -->
                <div class="modality-cards-row">
                  <!-- 视频模态 -->
                  <div
                    class="modality-card video-modality"
                    :class="{ 'statistics-type': isStatisticsCard }"
                  >
                    <div class="modality-header">
                      <div class="modality-icon video-icon">
                        <el-icon :size="18"><VideoCamera /></el-icon>
                      </div>
                      <span class="modality-name">视频模态</span>
                    </div>

                    <!-- 加权计算类型 -->
                    <template v-if="!isStatisticsCard && currentFusion">
                      <div class="modality-score">
                        {{ currentFusion.videoScore
                        }}<span class="score-unit">分</span>
                      </div>
                      <div class="modality-details">
                        <span class="detail-item">
                          <el-icon :size="12"><DataLine /></el-icon>
                          贡献度
                          {{
                            currentFusion.videoContribution?.toFixed(1) || "0.0"
                          }}
                        </span>
                        <span class="detail-item">
                          <el-icon :size="12"><Memo /></el-icon>
                          {{ videoEvidences.length }}处证据
                        </span>
                      </div>
                    </template>

                    <!-- 统计类型 -->
                    <template v-else>
                      <div class="modality-stats">
                        <span class="stat-count">{{
                          getModalityStatistics("video").total
                        }}</span>
                        <span class="stat-label">处证据</span>
                      </div>
                      <div class="mini-breakdown">
                        <span
                          v-if="getModalityStatistics('video').positive > 0"
                          class="mini-stat positive"
                        >
                          +{{ getModalityStatistics("video").positive }}
                        </span>
                        <span
                          v-if="getModalityStatistics('video').neutral > 0"
                          class="mini-stat neutral"
                        >
                          {{ getModalityStatistics("video").neutral }}
                        </span>
                        <span
                          v-if="getModalityStatistics('video').negative > 0"
                          class="mini-stat negative"
                        >
                          -{{ getModalityStatistics("video").negative }}
                        </span>
                      </div>
                    </template>
                  </div>

                  <!-- 音频模态 -->
                  <div
                    class="modality-card audio-modality"
                    :class="{ 'statistics-type': isStatisticsCard }"
                  >
                    <div class="modality-header">
                      <div class="modality-icon audio-icon">
                        <el-icon :size="18"><Microphone /></el-icon>
                      </div>
                      <span class="modality-name">音频模态</span>
                    </div>

                    <!-- 加权计算类型 -->
                    <template v-if="!isStatisticsCard && currentFusion">
                      <div class="modality-score">
                        {{ currentFusion.audioScore
                        }}<span class="score-unit">分</span>
                      </div>
                      <div class="modality-details">
                        <span class="detail-item">
                          <el-icon :size="12"><DataLine /></el-icon>
                          贡献度
                          {{
                            currentFusion.audioContribution?.toFixed(1) || "0.0"
                          }}
                        </span>
                        <span class="detail-item">
                          <el-icon :size="12"><Memo /></el-icon>
                          {{ audioEvidences.length }}处证据
                        </span>
                      </div>
                    </template>

                    <!-- 统计类型 -->
                    <template v-else>
                      <div class="modality-stats">
                        <span class="stat-count">{{
                          getModalityStatistics("audio").total
                        }}</span>
                        <span class="stat-label">处证据</span>
                      </div>
                      <div class="mini-breakdown">
                        <span
                          v-if="getModalityStatistics('audio').positive > 0"
                          class="mini-stat positive"
                        >
                          +{{ getModalityStatistics("audio").positive }}
                        </span>
                        <span
                          v-if="getModalityStatistics('audio').neutral > 0"
                          class="mini-stat neutral"
                        >
                          {{ getModalityStatistics("audio").neutral }}
                        </span>
                        <span
                          v-if="getModalityStatistics('audio').negative > 0"
                          class="mini-stat negative"
                        >
                          -{{ getModalityStatistics("audio").negative }}
                        </span>
                      </div>
                    </template>
                  </div>

                  <!-- 文本模态 -->
                  <div
                    class="modality-card text-modality"
                    :class="{ 'statistics-type': isStatisticsCard }"
                  >
                    <div class="modality-header">
                      <div class="modality-icon text-icon">
                        <el-icon :size="18"><ChatLineRound /></el-icon>
                      </div>
                      <span class="modality-name">文本模态</span>
                    </div>

                    <!-- 加权计算类型 -->
                    <template v-if="!isStatisticsCard && currentFusion">
                      <div class="modality-score">
                        {{ currentFusion.textScore
                        }}<span class="score-unit">分</span>
                      </div>
                      <div class="modality-details">
                        <span class="detail-item">
                          <el-icon :size="12"><DataLine /></el-icon>
                          贡献度
                          {{
                            currentFusion.textContribution?.toFixed(1) || "0.0"
                          }}
                        </span>
                        <span class="detail-item">
                          <el-icon :size="12"><Memo /></el-icon>
                          {{ textEvidences.length }}处证据
                        </span>
                      </div>
                    </template>

                    <!-- 统计类型 -->
                    <template v-else>
                      <div class="modality-stats">
                        <span class="stat-count">{{
                          getModalityStatistics("text").total
                        }}</span>
                        <span class="stat-label">处证据</span>
                      </div>
                      <div class="mini-breakdown">
                        <span
                          v-if="getModalityStatistics('text').positive > 0"
                          class="mini-stat positive"
                        >
                          +{{ getModalityStatistics("text").positive }}
                        </span>
                        <span
                          v-if="getModalityStatistics('text').neutral > 0"
                          class="mini-stat neutral"
                        >
                          {{ getModalityStatistics("text").neutral }}
                        </span>
                        <span
                          v-if="getModalityStatistics('text').negative > 0"
                          class="mini-stat negative"
                        >
                          -{{ getModalityStatistics("text").negative }}
                        </span>
                      </div>
                    </template>
                  </div>

                  <!-- 箭头指向结果 -->
                  <div class="fusion-arrow">
                    <el-icon :size="24" color="#999"><Right /></el-icon>
                  </div>

                  <!-- 融合结果卡片 -->
                  <div
                    class="modality-card result-card"
                    :class="{ 'statistics-type': isStatisticsCard }"
                  >
                    <div class="modality-header">
                      <div class="modality-icon result-icon">
                        <el-icon :size="18"><Select /></el-icon>
                      </div>
                      <span class="modality-name">融合结果</span>
                    </div>

                    <!-- 加权计算类型 -->
                    <template v-if="!isStatisticsCard && currentFusion">
                      <div class="modality-score final-score">
                        {{ currentFusion.finalScore
                        }}<span class="score-unit">分</span>
                      </div>
                      <div class="result-label">
                        {{ getResultLabel(currentCardId) }}
                      </div>
                    </template>

                    <!-- 统计类型 -->
                    <template v-else>
                      <div class="statistics-result">
                        <div class="statistics-total">
                          共
                          <span class="total-count">{{
                            currentStatistics?.total || 0
                          }}</span>
                          处
                        </div>
                        <div class="statistics-breakdown">
                          <span
                            v-if="currentStatistics?.positive"
                            class="stat-item positive"
                          >
                            <span class="stat-dot"></span>
                            {{ currentStatistics.positive }}正面
                          </span>
                          <span
                            v-if="currentStatistics?.neutral"
                            class="stat-item neutral"
                          >
                            <span class="stat-dot"></span>
                            {{ currentStatistics.neutral }}中性
                          </span>
                          <span
                            v-if="currentStatistics?.negative"
                            class="stat-item negative"
                          >
                            <span class="stat-dot"></span>
                            {{ currentStatistics.negative }}负面
                          </span>
                        </div>
                      </div>
                      <div class="result-label">情感分布统计</div>
                    </template>
                  </div>
                </div>

                <!-- 详细证据标题 -->
                <div class="section-title-inline" style="margin-top: 18px">
                  <el-icon><Document /></el-icon>
                  <span>详细证据</span>
                </div>

                <div class="evidence-list-scroll">
                  <!-- 视频证据 -->
                  <div
                    v-if="videoEvidences.length > 0"
                    class="evidence-group-inline"
                  >
                    <div class="group-title-inline">
                      <el-icon><VideoCamera /></el-icon>
                      <span>视频证据 ({{ videoEvidences.length }})</span>
                    </div>
                    <div
                      v-for="(evidence, index) in videoEvidences"
                      :key="'video-' + index"
                      class="evidence-item-inline"
                      @click="jumpToTime(evidence.timestamp)"
                    >
                      <div class="evidence-time-badge">
                        {{ formatTimeDisplay(evidence.timestamp) }}
                      </div>
                      <div class="evidence-content-inline">
                        <div class="evidence-desc-inline">
                          <!-- 情感标签（只对"对学校态度"卡片显示） -->
                          <span
                            v-if="
                              currentCardId === 'attitude' &&
                              evidence.sentimentScore !== undefined
                            "
                            class="sentiment-tag-inline"
                            :class="
                              'sentiment-' +
                              getSentimentBySentimentScore(
                                evidence.sentimentScore,
                              )
                            "
                          >
                            {{
                              getSentimentText(
                                getSentimentBySentimentScore(
                                  evidence.sentimentScore,
                                ),
                              )
                            }}
                          </span>
                          {{ evidence.description }}
                        </div>
                        <div class="evidence-actions-inline">
                          <span class="confidence-badge-inline"
                            >{{ evidence.confidence }}%</span
                          >
                          <span class="jump-hint-inline">
                            <el-icon><VideoPlay /></el-icon>
                            点击跳转
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <!-- 音频证据 -->
                  <div
                    v-if="audioEvidences.length > 0"
                    class="evidence-group-inline"
                  >
                    <div class="group-title-inline">
                      <el-icon><Microphone /></el-icon>
                      <span>音频证据 ({{ audioEvidences.length }})</span>
                    </div>
                    <div
                      v-for="(evidence, index) in audioEvidences"
                      :key="'audio-' + index"
                      class="evidence-item-inline"
                      @click="jumpToTime(evidence.timestamp)"
                    >
                      <div class="evidence-time-badge">
                        {{ formatTimeDisplay(evidence.timestamp) }}
                      </div>
                      <div class="evidence-content-inline">
                        <div class="evidence-desc-inline">
                          <!-- 情感标签（只对"对学校态度"卡片显示） -->
                          <span
                            v-if="
                              currentCardId === 'attitude' &&
                              evidence.sentimentScore !== undefined
                            "
                            class="sentiment-tag-inline"
                            :class="
                              'sentiment-' +
                              getSentimentBySentimentScore(
                                evidence.sentimentScore,
                              )
                            "
                          >
                            {{
                              getSentimentText(
                                getSentimentBySentimentScore(
                                  evidence.sentimentScore,
                                ),
                              )
                            }}
                          </span>
                          {{ evidence.description }}
                        </div>
                        <div class="evidence-actions-inline">
                          <span class="confidence-badge-inline"
                            >{{ evidence.confidence }}%</span
                          >
                          <span class="jump-hint-inline">
                            <el-icon><VideoPlay /></el-icon>
                            点击跳转
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <!-- 文本证据 -->
                  <div
                    v-if="textEvidences.length > 0"
                    class="evidence-group-inline"
                  >
                    <div class="group-title-inline">
                      <el-icon><ChatLineRound /></el-icon>
                      <span>文本证据 ({{ textEvidences.length }})</span>
                    </div>
                    <div class="text-evidences-grid-inline">
                      <el-tooltip
                        v-for="(evidence, index) in textEvidences"
                        :key="'text-' + index"
                        :content="evidence.description"
                        placement="top"
                        popper-class="text-evidence-tooltip"
                        :show-after="300"
                        :hide-after="0"
                        :disabled="!evidence.description"
                        teleported
                      >
                      <div
                        class="text-evidence-item-inline"
                        @click="
                          evidence.timestamp !== undefined &&
                          jumpToTime(evidence.timestamp)
                        "
                      >
                        <div class="text-keyword-inline">
                          <!-- 情感标签（只对"对学校态度"卡片显示） -->
                          <span
                            v-if="
                              currentCardId === 'attitude' &&
                              evidence.sentimentScore !== undefined
                            "
                            class="sentiment-tag-inline"
                            :class="
                              'sentiment-' +
                              getSentimentBySentimentScore(
                                evidence.sentimentScore,
                              )
                            "
                          >
                            {{
                              getSentimentText(
                                getSentimentBySentimentScore(
                                  evidence.sentimentScore,
                                ),
                              )
                            }}
                          </span>
                          {{ evidence.keyword }}
                        </div>
                        <div class="text-meta-inline">
                          <span
                            v-if="evidence.timestamp !== undefined"
                            class="text-time-inline"
                          >
                            {{ formatTimeDisplay(evidence.timestamp) }}
                          </span>
                          <span class="confidence-badge-inline"
                            >{{ evidence.confidence }}%</span
                          >
                        </div>
                      </div>
                      </el-tooltip>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- 台词列表区域（精简版）（默认显示） -->
            <div v-show="!currentCardId" class="transcript-panel">
              <div class="panel-header-compact">
                <span class="panel-title-compact">
                  <el-icon :size="14"><Microphone /></el-icon>
                  全模态事件流
                </span>
                <div class="header-actions-group">
                  <div class="risk-filter-group">
                    <!-- 新增：模态筛选器 -->
                    <el-tooltip
                      content="显示所有类型的事件"
                      placement="bottom"
                      :show-after="300"
                    >
                      <button
                        class="filter-btn modality-filter"
                        :class="{ active: modalityFilter === 'all' }"
                        @click="modalityFilter = 'all'"
                      >
                        <el-icon :size="12"><Menu /></el-icon>
                        全模态
                      </button>
                    </el-tooltip>
                    <el-tooltip
                      content="只显示中高风险事件"
                      placement="bottom"
                      :show-after="300"
                    >
                      <button
                        class="filter-btn modality-filter risk"
                        :class="{ active: modalityFilter === 'risk-only' }"
                        @click="modalityFilter = 'risk-only'"
                      >
                        <el-icon :size="12"><WarningFilled /></el-icon>
                        风险优先
                      </button>
                    </el-tooltip>
                    <el-tooltip
                      content="只显示语音台词"
                      placement="bottom"
                      :show-after="300"
                    >
                      <button
                        class="filter-btn modality-filter speech"
                        :class="{ active: modalityFilter === 'speech-only' }"
                        @click="modalityFilter = 'speech-only'"
                      >
                        <el-icon :size="12"><Microphone /></el-icon>
                        纯字幕
                      </button>
                    </el-tooltip>
                  </div>

                  <!-- 同步状态按钮 -->
                  <transition name="fade">
                    <div v-if="!isSyncActive" style="display: inline-block">
                      <el-tooltip
                        content="点击恢复自动跟随"
                        placement="bottom"
                        :show-after="300"
                      >
                        <button class="sync-control-btn" @click="resumeSync">
                          <el-icon :size="12"><VideoPause /></el-icon>
                          暂停中
                          <span class="resume-text">恢复</span>
                        </button>
                      </el-tooltip>
                    </div>
                  </transition>
                </div>
              </div>

              <div
                ref="timelineEventsListRef"
                class="transcript-list timeline-events-list"
                @wheel="handleUserScroll"
                @touchstart="handleUserScroll"
              >
                <!-- 【垂直时间线】视觉锚点 -->
                <div class="timeline-vertical-line"></div>

                <!-- 【新逻辑】渲染事件流卡片 -->
                <div
                  v-for="event in filteredTimelineEvents"
                  :key="event.id"
                  class="timeline-event-item"
                  :class="[
                    `modality-${event.modality}`,
                    `risk-${getRiskLevel(event.riskScore)}`,
                    {
                      'is-active':
                        currentPlayTime >= event.startTime &&
                        currentPlayTime <= event.endTime,
                    },
                  ]"
                  @click="jumpToTime(event.startTime)"
                >
                  <!-- 时间标签 + 图标锚点 -->
                  <div class="event-timeline-anchor">
                    <div class="event-time">
                      {{ formatTime(event.startTime) }}
                    </div>
                    <div
                      class="event-dot"
                      :class="[
                        `risk-${getRiskLevel(event.riskScore)}`,
                        `modality-${event.modality}`,
                      ]"
                    >
                      <el-icon :size="12">
                        <Microphone v-if="event.modality === 'speech'" />
                        <View v-else-if="event.modality === 'visual'" />
                        <Headset
                          v-else-if="event.modality === 'audio-effect'"
                        />
                      </el-icon>
                    </div>
                  </div>

                  <!-- 内容区 -->
                  <div class="event-body">
                    <!-- Speech：字幕式大字排版 -->
                    <template v-if="event.modality === 'speech'">
                      <div
                        class="speech-transcript"
                        v-html="
                          highlightKeywords(event.transcript, event.keywords)
                        "
                      ></div>

                      <!-- 激活时展开的详情 -->
                      <transition name="expand">
                        <div
                          v-if="
                            currentPlayTime >= event.startTime &&
                            currentPlayTime <= event.endTime
                          "
                          class="speech-meta"
                        >
                          <span
                            v-if="event.emotion"
                            class="meta-tag emotion"
                            :style="{
                              background: event.emotion.bgColor,
                              color: event.emotion.textColor,
                            }"
                          >
                            {{ event.emotion.label }} ({{
                              Math.round(event.emotion.intensity * 100)
                            }}%)
                          </span>
                          <span
                            v-if="getRiskLevel(event.riskScore) !== 'low'"
                            class="meta-tag risk"
                            :class="`risk-${getRiskLevel(event.riskScore)}`"
                          >
                            {{
                              getRiskLevel(event.riskScore) === "high"
                                ? "高风险"
                                : "中风险"
                            }}
                          </span>
                          <el-tooltip
                            v-if="getRiskLevel(event.riskScore) === 'high'"
                            :content="`置信度 ${event.confidence}%`"
                            placement="top"
                          >
                            <span class="meta-tag info">
                              <el-icon :size="12"><InfoFilled /></el-icon>
                            </span>
                          </el-tooltip>
                        </div>
                      </transition>
                    </template>

                    <!-- Visual/AudioEffect：系统通知式紧凑排版 -->
                    <template v-else>
                      <div
                        class="system-notification"
                        :class="`notif-${event.modality}`"
                      >
                        <div class="notif-main">
                          <span class="notif-badge">{{
                            event.modality === "visual" ? "[画面]" : "[音效]"
                          }}</span>
                          <span class="notif-label">
                            {{
                              event.modality === "visual"
                                ? event.detectionLabel
                                : event.description
                            }}
                          </span>
                        </div>

                        <!-- 激活时展开的详情 -->
                        <transition name="expand">
                          <div
                            v-if="
                              currentPlayTime >= event.startTime &&
                              currentPlayTime <= event.endTime
                            "
                            class="notif-detail"
                          >
                            <span
                              v-if="event.modality === 'visual'"
                              class="detail-chip"
                            >
                              置信度 {{ event.confidence }}%
                            </span>
                            <span
                              v-if="event.modality === 'audio-effect'"
                              class="detail-chip"
                            >
                              强度 {{ Math.round(event.intensity * 100) }}%
                            </span>
                            <el-tooltip
                              v-if="event.modality === 'audio-effect'"
                              :content="`置信度 ${event.confidence}%`"
                              placement="top"
                            >
                              <span class="detail-chip info">
                                <el-icon :size="12"><InfoFilled /></el-icon>
                              </span>
                            </el-tooltip>
                            <span
                              v-if="getRiskLevel(event.riskScore) !== 'low'"
                              class="detail-chip risk"
                              :class="`risk-${getRiskLevel(event.riskScore)}`"
                            >
                              {{
                                getRiskLevel(event.riskScore) === "high"
                                  ? "高风险"
                                  : "中风险"
                              }}
                            </span>
                          </div>
                        </transition>
                      </div>
                    </template>
                  </div>
                </div>

                <div
                  v-if="filteredTimelineEvents.length === 0"
                  class="empty-transcript"
                >
                  <el-icon :size="36"><Menu /></el-icon>
                  <p>当前筛选条件下无事件</p>
                </div>
              </div>
            </div>

            <!-- 雷达图（含风险分）- 证据模式时隐藏 -->
            <div v-show="!currentCardId" class="neu-card dashboard-radar">
              <div class="card-header-compact">
                <span class="card-title-compact">
                  <el-icon :size="14"><DataAnalysis /></el-icon>
                  高校舆情风险画像
                </span>
                <span class="current-frame-badge-small">
                  <el-icon :size="12"><VideoPlay /></el-icon>
                  当前帧: {{ formattedCurrentTime }}
                </span>
              </div>
              <div class="radar-container">
                <div class="radar-with-score">
                  <div class="radar-chart-area">
                    <v-chart
                      ref="radarChartRef"
                      :option="multiModalRadarOption"
                      :update-options="{ notMerge: false, lazyUpdate: false }"
                      class="radar-chart-compact"
                      @mouseenter="isMouseOnRadar = true"
                      @mouseleave="isMouseOnRadar = false"
                      @finished="onRadarChartFinished"
                    />
                  </div>
                  <div class="score-side-panel">
                    <div
                      class="score-number-side"
                      :class="getCurrentRiskClass()"
                    >
                      {{ getCurrentRiskScore() }}
                    </div>
                    <div class="score-label-side">当前风险分</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- 右侧关键指标（简化版，移到顶部雷达图旁边） -->
        <div class="side-metrics-wrapper" v-if="false">
          <div class="key-metrics-grid">
            <div class="neu-card metric-mini">
              <div class="metric-icon video-icon">
                <el-icon :size="20"><VideoCamera /></el-icon>
              </div>
              <div class="metric-content">
                <div class="metric-value">{{ mockVideoRisks.length }}</div>
                <div class="metric-label">视频风险点</div>
              </div>
            </div>

            <div class="neu-card metric-mini">
              <div class="metric-icon audio-icon">
                <el-icon :size="20"><Microphone /></el-icon>
              </div>
              <div class="metric-content">
                <div class="metric-value">{{ angryEmotionCount }}</div>
                <div class="metric-label">情绪波动</div>
              </div>
            </div>

            <div class="neu-card metric-mini">
              <div class="metric-icon text-icon">
                <el-icon :size="20"><Document /></el-icon>
              </div>
              <div class="metric-content">
                <div class="metric-value">{{ highRiskSegmentCount }}</div>
                <div class="metric-label">高风险台词</div>
              </div>
            </div>

            <div class="neu-card metric-mini">
              <div class="metric-icon university-icon">
                <el-icon :size="20"><School /></el-icon>
              </div>
              <div class="metric-content">
                <div class="metric-value">
                  {{ analysisResult.isUniversityRelated ? "是" : "否" }}
                </div>
                <div class="metric-label">高校相关</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 报告视图（独立组件） -->
      <ReportView 
        v-else 
        key="report" 
        :data="analysisResult" 
        @export-pdf="emit('export-pdf')"
      />
    </transition>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch, nextTick } from "vue";
import { useRoute, useRouter } from "vue-router";
import { use } from "echarts/core";
import { CanvasRenderer } from "echarts/renderers";
import { PieChart, BarChart, LineChart, RadarChart } from "echarts/charts";
import {
  TitleComponent,
  TooltipComponent,
  LegendComponent,
  GridComponent,
  MarkPointComponent,
  MarkLineComponent,
  RadarComponent,
} from "echarts/components";
import VChart from "vue-echarts";
import { ElMessage } from "element-plus";
import type { RiskLevel, SentimentLabel } from "@/types";

// 导入证据抽屉组件和数据
import EvidenceDrawer from "@/components/EvidenceDrawer.vue";
import type { CardData } from "@/components/EvidenceDrawer.vue";
import ReportView from "@/components/ReportView.vue";
// 导入统一的分析结果mock数据（核心数据源 - 唯一数据源）
import { mockAnalysisResult } from "@/data/mockAnalysisResult";
import type {
  ModalityFusion,
  Evidence,
  SceneInfo,
  TimelineEvent,
  SpeechEvent,
  VisualEvent,
  AudioEffectEvent,
} from "@/data/mockAnalysisResult";
// 导入Element Plus图标
import {
  User,
  School,
  ChatDotRound,
  TrendCharts,
  WarningFilled,
  Warning,
  Collection,
  DocumentChecked,
  Male,
  Female,
  Menu,
  View,
  Headset,
  VideoPause,
  InfoFilled,
  Download,
  Upload,
  VideoCamera,
  Clock,
  Calendar,
  Search,
  Microphone,
  VideoPlay,
} from "@element-plus/icons-vue";

// ==================== Props 定义 ====================
// 接收从父组件传入的分析结果数据
const props = defineProps<{
  analysisResult: typeof mockAnalysisResult; // 分析结果数据
  viewMode: "interactive" | "report"; // 视图模式
}>();

// Emits 定义
const emit = defineEmits<{
  "update:viewMode": [mode: "interactive" | "report"];
  "export-pdf": [];
}>();

// 注册ECharts组件
use([
  CanvasRenderer,
  PieChart,
  BarChart,
  LineChart,
  RadarChart,
  TitleComponent,
  TooltipComponent,
  LegendComponent,
  GridComponent,
  RadarComponent,
  MarkPointComponent,
  MarkLineComponent,
]);

// ==================== 组件内部状态 ====================
// 路由相关（仅用于某些watch逻辑）
const route = useRoute();
const router = useRouter();

// 视频对话框相关（如果需要的话）
const videoDialogVisible = ref(false);
const videoStartTime = ref(0); // 视频起始播放时间

// 视图模式：使用 props 传入
const viewMode = computed(() => props.viewMode);

// ==================== 数据源：直接使用 props ====================
// 当前分析结果（直接使用传入的 props）
const currentResult = computed(() => {
  return props.analysisResult;
});

// 模板中直接使用的别名
const analysisResult = computed(() => props.analysisResult);

// 提取各个分析结果（便捷引用）
const mockVideoArchive = computed(() => currentResult.value?.videoInfo || null);
const analysisArchiveCoverUrl = computed(() => {
  const videoInfo = (currentResult.value?.videoInfo || {}) as {
    thumbnailUrl?: string | null;
    coverUrl?: string | null;
    posterUrl?: string | null;
  };
  return (
    videoInfo.thumbnailUrl ||
    videoInfo.coverUrl ||
    videoInfo.posterUrl ||
    ""
  );
});
const archiveCoverLoadFailed = ref(false);
const handleArchiveCoverError = () => {
  archiveCoverLoadFailed.value = true;
};
watch(analysisArchiveCoverUrl, () => {
  archiveCoverLoadFailed.value = false;
});
const mockIdentityAnalysis = computed(
  () => currentResult.value?.identity || null,
);
const mockUniversityBaseline = computed(
  () => currentResult.value?.university || null,
);

// 计算attitude的统计数据（前端根据sentimentScore统计）
const attitudeStatistics = computed(() => {
  if (!currentResult.value)
    return { positive: 0, neutral: 0, negative: 0, total: 0 };
  const evidences = currentResult.value.attitude.evidences;
  const positive = evidences.filter(
    (e) => e.sentimentScore !== undefined && e.sentimentScore < 33.3,
  ).length;
  const neutral = evidences.filter(
    (e) =>
      e.sentimentScore !== undefined &&
      e.sentimentScore >= 33.3 &&
      e.sentimentScore <= 66.7,
  ).length;
  const negative = evidences.filter(
    (e) => e.sentimentScore !== undefined && e.sentimentScore > 66.7,
  ).length;
  const total = evidences.length;
  return { positive, neutral, negative, total };
});

const mockContentAnalysis = computed(() => {
  if (!currentResult.value) return null;
  return {
    topicCategory: currentResult.value.topic.topicCategory,
    topicSubCategory: currentResult.value.topic.topicSubCategory,
    negativeMentionCount: attitudeStatistics.value.negative,
    schoolMentionCount: attitudeStatistics.value.total,
  };
});

const mockOpinionRisk = computed(() => {
  if (!currentResult.value) return null;
  const riskLevel = getRiskLevelByScore(
    currentResult.value.opinionRisk.modalityFusion.finalScore,
  );
  return {
    riskLabel: getRiskLabel(riskLevel),
    riskReason: currentResult.value.opinionRisk.riskReason,
    actionSuggestion: currentResult.value.action.actionSuggestion,
    actionDetail: currentResult.value.action.actionDetail,
  };
});
// 提取时间轴数据（响应式）
const timeGranularity = computed(
  () => currentResult.value?.timelineData.timeGranularity || 5,
);
const mockVideoRisksData = computed(
  () => currentResult.value?.timelineData.videoRisks || [],
);
const mockAudioEmotionsData = computed(
  () => currentResult.value?.timelineData.audioEmotions || [],
);
const mockTextRisksData = computed(
  () => currentResult.value?.timelineData.textRisks || [],
);
const mockComprehensiveRisksData = computed(
  () => currentResult.value?.timelineData.comprehensiveRisks || [],
);
const mockRadarDataByTime = computed(
  () => currentResult.value?.timelineData.radarByTime || [],
);
const mockAverageRadarData = computed(
  () =>
    currentResult.value?.timelineData.averageRadarData || [0, 0, 0, 0, 0, 0],
);
// 提取辅助分析数据
const mockScenes = computed(() => currentResult.value?.sceneRecognition || []);

// 卡片UI配置（动态从currentResult获取数据）
const cardsData = computed<CardData[]>(() => {
  const result = currentResult.value;
  if (!result) return [];

  return [
    {
      id: "identity",
      label: "身份判定",
      value: result.identity.identityLabel,
      confidence: result.identity.modalityFusion.finalScore,
      confidenceLabel: "识别置信度",
      icon: User,
      iconClass: "icon-bg-identity",
    },
    {
      id: "university",
      label: "涉及高校",
      value: result.university.universityName,
      confidence: result.university.modalityFusion.finalScore,
      confidenceLabel: "匹配度",
      icon: School,
      iconClass: "icon-bg-uni",
    },
    {
      id: "topic",
      label: "内容主题",
      value: result.topic.topicCategory,
      confidence: result.topic.modalityFusion.finalScore,
      confidenceLabel: "主题置信度",
      icon: ChatDotRound,
      iconClass: "icon-bg-topic",
    },
    {
      id: "attitude",
      label: "对学校态度",
      get value() {
        const negativeRatio =
          (attitudeStatistics.value.negative / attitudeStatistics.value.total) *
          100;
        const sentiment = getSentimentByScore(negativeRatio);
        return getSentimentLabel(sentiment);
      },
      confidence: Math.round(
        (attitudeStatistics.value.negative / attitudeStatistics.value.total) *
          100,
      ),
      confidenceLabel: "负面占比",
      icon: TrendCharts,
      get iconClass() {
        const negativeRatio =
          (attitudeStatistics.value.negative / attitudeStatistics.value.total) *
          100;
        const sentiment = getSentimentByScore(negativeRatio);
        return getSentimentIconClass(sentiment);
      },
    },
    {
      id: "opinionRisk",
      label: "潜在舆论风险",
      get value() {
        const riskLevel = getRiskLevelByScore(
          result.opinionRisk.modalityFusion.finalScore,
        );
        return getRiskLabel(riskLevel);
      },
      confidence: result.opinionRisk.modalityFusion.finalScore,
      confidenceLabel: "风险指数",
      icon: WarningFilled,
      get iconClass() {
        const riskLevel = getRiskLevelByScore(
          result.opinionRisk.modalityFusion.finalScore,
        );
        return getOpinionRiskIconClass(riskLevel);
      },
    },
    {
      id: "action",
      label: "处置建议",
      value: result.action.actionSuggestion,
      confidence: result.action.modalityFusion.finalScore,
      confidenceLabel: "紧急程度",
      icon: DocumentChecked,
      iconClass: "icon-bg-action",
    },
  ];
});

// ==================== 证据详情面板相关状态 ====================
const currentCardId = ref<string>("");
const currentCardData = computed<CardData>(() => {
  const card = cardsData.value.find((c) => c.id === currentCardId.value);
  return card || cardsData.value[0];
});

// 当前卡片的证据和融合数据（从对应的分析对象中获取）
const currentEvidences = computed(() => {
  const result = currentResult.value;
  if (!result) return [];

  const cardId = currentCardId.value;
  if (cardId === "identity") return result.identity.evidences;
  if (cardId === "university") return result.university.evidences;
  if (cardId === "topic") return result.topic.evidences;
  if (cardId === "attitude") return result.attitude.evidences;
  if (cardId === "opinionRisk") return result.opinionRisk.evidences;
  if (cardId === "action") return result.action.evidences;
  return [];
});

// 当前卡片的多模态融合数据（仅加权融合分类使用）
const currentFusion = computed<ModalityFusion | null>(() => {
  const result = currentResult.value;
  if (!result) return null;

  const cardId = currentCardId.value;
  if (cardId === "identity") return result.identity.modalityFusion;
  if (cardId === "university") return result.university.modalityFusion;
  if (cardId === "topic") return result.topic.modalityFusion;
  if (cardId === "attitude") return null; // 统计分类，无融合数据
  if (cardId === "opinionRisk") return result.opinionRisk.modalityFusion;
  if (cardId === "action") return result.action.modalityFusion;
  return result.identity.modalityFusion;
});

// 判断当前卡片是否为统计分类
const isStatisticsCard = computed(() => currentCardId.value === "attitude");

// 当前卡片的统计数据（仅attitude使用）
const currentStatistics = computed(() => {
  if (currentCardId.value === "attitude") {
    return attitudeStatistics.value;
  }
  return null;
});

// 根据cardId获取结果标签
const getResultLabel = (cardId: string): string => {
  const labels: Record<string, string> = {
    identity: "识别置信度",
    university: "关联置信度",
    topic: "主题置信度",
    opinionRisk: "风险指数",
    action: "紧急程度",
  };
  return labels[cardId] || "置信度";
};

// 前端生成融合公式
const getFusionFormula = (fusion: ModalityFusion | null): string => {
  if (!fusion) return "";
  return `视频${fusion.videoContribution.toFixed(1)} + 音频${fusion.audioContribution.toFixed(1)} + 文本${fusion.textContribution.toFixed(1)}`;
};

// 分类证据
const videoEvidences = computed(() =>
  currentEvidences.value.filter((e) => e.type === "video"),
);

const audioEvidences = computed(() =>
  currentEvidences.value.filter((e) => e.type === "audio"),
);

const textEvidences = computed(() =>
  currentEvidences.value.filter((e) => e.type === "text"),
);

// 计算各模态的统计数据（用于统计类型卡片）
const getModalityStatistics = (modalityType: "video" | "audio" | "text") => {
  const evidences = currentEvidences.value.filter(
    (e) => e.type === modalityType,
  );
  const positive = evidences.filter(
    (e) => e.sentimentScore !== undefined && e.sentimentScore < 33.3,
  ).length;
  const neutral = evidences.filter(
    (e) =>
      e.sentimentScore !== undefined &&
      e.sentimentScore >= 33.3 &&
      e.sentimentScore <= 66.7,
  ).length;
  const negative = evidences.filter(
    (e) => e.sentimentScore !== undefined && e.sentimentScore > 66.7,
  ).length;
  const total = evidences.length;

  return { positive, neutral, negative, total };
};

// 打开/切换证据详情面板（点击卡片）
const openEvidenceDrawer = (cardId: string) => {
  // 如果点击的是当前已打开的卡片，则关闭证据面板
  if (currentCardId.value === cardId) {
    closeEvidencePanel();
    return;
  }

  // 否则打开或切换到新卡片
  currentCardId.value = cardId;

  // 等待DOM更新后resize图表
  nextTick(() => {
    setTimeout(() => {
      handleChartResize();
    }, 350); // 等待flex动画完成（300ms + 50ms buffer）
  });
};

// 关闭证据详情面板
const closeEvidencePanel = () => {
  currentCardId.value = "";

  // 等待DOM更新后resize图表
  nextTick(() => {
    setTimeout(() => {
      handleChartResize();
    }, 350);
  });
};

// 获取证据类型样式类
const getEvidenceTypeClass = (type: string): string => {
  const classMap: Record<string, string> = {
    video: "mark-video",
    audio: "mark-audio",
    text: "mark-text",
  };
  return classMap[type] || "";
};

// 格式化时间显示
const formatTimeDisplay = (seconds: number): string => {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, "0")}`;
};

// 判断是否接近当前播放时间（±2秒内）
const isNearCurrentTime = (timestamp: number): boolean => {
  return Math.abs(currentPlayTime.value - timestamp) <= 2;
};

// 主视频播放器引用
const mainVideoPlayerRef = ref<HTMLVideoElement | null>(null);

// 当前播放时间
const currentPlayTime = ref(0);

// 视频真实时长（秒）- 初始值为0，视频加载成功后会更新为真实时长
const videoDuration = ref(0);

// 当前显示的检测框
const currentDetection = ref<any>(null);

// 控制检测框的显示/隐藏
const showDetectionBoxes = ref(true);

// 控制图例的展开/收起
const legendExpanded = ref(false);

// 主题状态（用于图表深色适配 + 检测框文字色）
const isDarkTheme = ref(document.documentElement.getAttribute("data-theme") === "dark");
let themeObserver: MutationObserver | null = null;

const syncThemeState = () => {
  const rootTheme = document.documentElement.getAttribute("data-theme");
  const bodyTheme = document.body?.getAttribute("data-theme");
  isDarkTheme.value = rootTheme === "dark" || bodyTheme === "dark";
};

// ==================== 检测框颜色配置（业界标准） ====================
const DETECTION_COLORS: Record<string, string> = {
  face: "#00ff88", // 人脸识别 - 绿色
  ocr: "#ffd700", // 文字识别 - 金色
  logo: "#4a90e2", // 校徽/Logo - 蓝色
  scene: "#a29bfe", // 校园场景 - 紫色
  emotion: "#ff6348", // 情绪检测 - 橙红色
  mention: "#ff4757", // 学校提及 - 红色（重点关注）
  uniform: "#ff9500", // 校服检测 - 橙色
  banner: "#ff3b30", // 横幅检测 - 红色
  gesture: "#ff1493", // 手势检测 - 深粉红
  object: "#7bed9f", // 物体检测 - 薄荷绿
};

const DETECTION_LABELS: Record<string, string> = {
  face: "人脸识别",
  ocr: "文字识别",
  logo: "校徽/Logo",
  scene: "校园场景",
  emotion: "情绪检测",
  mention: "学校提及",
  uniform: "校服检测",
  banner: "横幅检测",
  gesture: "手势检测",
  object: "物体检测",
};

// 后端检测类型归一化（兼容 YOLO/YOLO-World 输出）
const normalizeDetectionType = (
  rawType: string | undefined,
  rawLabel: string | undefined,
): string => {
  const type = String(rawType || "").toLowerCase();
  const label = String(rawLabel || "").toLowerCase();
  const text = `${type} ${label}`;

  // 前后端一致的标准类型，直接透传
  if (
    [
      "face",
      "ocr",
      "logo",
      "scene",
      "emotion",
      "mention",
      "uniform",
      "banner",
      "gesture",
      "object",
    ].includes(type)
  ) {
    return type;
  }

  // YOLO-World / 开放词汇：按 label 二次归类
  if (
    text.includes("person") ||
    text.includes("face") ||
    text.includes("人") ||
    text.includes("人脸")
  ) {
    return "face";
  }
  if (
    text.includes("uniform") ||
    text.includes("校服") ||
    text.includes("student card") ||
    text.includes("学生证")
  ) {
    return "uniform";
  }
  if (
    text.includes("banner") ||
    text.includes("flag") ||
    text.includes("protest") ||
    text.includes("横幅") ||
    text.includes("标语")
  ) {
    return "banner";
  }
  if (text.includes("logo") || text.includes("校徽")) {
    return "logo";
  }
  if (text.includes("text") || text.includes("ocr") || text.includes("文字")) {
    return "ocr";
  }
  if (
    text.includes("gesture") ||
    text.includes("hand") ||
    text.includes("手势")
  ) {
    return "gesture";
  }

  // 无法识别时，统一归为 object（避免出现白框）
  return "object";
};

// 检测框标签文本颜色（保证不同底色下可读性）
// 深色模式下统一白色（避免内联色覆盖 CSS）
const getDetectionLabelTextColor = (type: string): string => {
  if (isDarkTheme.value) return "#ffffff";
  const darkTextTypes = new Set(["ocr", "uniform", "object"]);
  return darkTextTypes.has(type) ? "#111827" : "#ffffff";
};

// ==================== 风险等级计算工具函数 ====================
/**
 * 根据 riskScore 计算风险等级
 * @param riskScore 风险分数 0-100
 * @returns 'low' | 'medium' | 'high'
 */
const getRiskLevel = (riskScore: number): "low" | "medium" | "high" => {
  if (riskScore < 33.3) return "low";
  if (riskScore > 66.7) return "high";
  return "medium";
};

// 时间轴图表引用
const timelineChartRef = ref<any>(null);

// 雷达图表引用
const radarChartRef = ref<any>(null);

// 记录鼠标是否在雷达图上（用于保持tooltip显示）
const isMouseOnRadar = ref(false);

// 分析页面根容器引用
const analysisPageRef = ref<HTMLDivElement | null>(null);

// 页面级ResizeObserver实例
let pageResizeObserver: ResizeObserver | null = null;

// 图表容器 ResizeObserver，精准监听图表父容器尺寸变化
let chartContainerResizeObserver: ResizeObserver | null = null;

// ==================== CV视觉模态：视频显示区域计算（精确定位检测框） ====================
// 视频播放器ResizeObserver实例
let videoResizeObserver: ResizeObserver | null = null;

// 视频实际显示区域信息（用于精确定位检测框）
interface VideoDisplayArea {
  offsetX: number; // 视频显示区域左侧偏移（像素）
  offsetY: number; // 视频显示区域顶部偏移（像素）
  displayWidth: number; // 视频实际显示宽度（像素）
  displayHeight: number; // 视频实际显示高度（像素）
  containerWidth: number; // 容器宽度（像素）
  containerHeight: number; // 容器高度（像素）
}

const videoDisplayArea = ref<VideoDisplayArea>({
  offsetX: 0,
  offsetY: 0,
  displayWidth: 0,
  displayHeight: 0,
  containerWidth: 0,
  containerHeight: 0,
});

// 当前选中的证据ID
const selectedEvidenceId = ref<string>("");

// 【新增】模态筛选器：全模态/风险优先/纯字幕
const modalityFilter = ref<"all" | "risk-only" | "speech-only">("all");

// 真实视频URL
const realVideoUrl = ref("");

// 【全模态智能事件流】事件流数据（响应式）
const timelineEvents = ref<TimelineEvent[]>([]);

// ==================== 【智能跟随滚动】核心状态 ====================
// 自动同步开关
const isSyncActive = ref(true);
// 内部滚动标记（防止误触发用户介入）
const isInternalScrolling = ref(false);
// 事件列表容器 ref
const timelineEventsListRef = ref<HTMLElement | null>(null);

// ==================== 动态雷达图数据（根据视频时间变化） ====================
// 雷达图时间段数据已从mockAnalysisResult导入（第1307行）

// 当前时间点的雷达图数据（基于索引计算）
const currentRadarData = computed(() => {
  const currentTime = currentPlayTime.value;
  const radarData = mockRadarDataByTime.value;
  if (!radarData || radarData.length === 0) return [0, 0, 0, 0, 0, 0];
  const index = Math.min(
    Math.floor(currentTime / timeGranularity.value),
    radarData.length - 1,
  );
  return radarData[index]?.data || [0, 0, 0, 0, 0, 0];
});

// 【新逻辑】过滤后的事件流列表
const filteredTimelineEvents = computed(() => {
  let events = timelineEvents.value;

  // 模态筛选
  if (modalityFilter.value === "speech-only") {
    events = events.filter((e) => e.modality === "speech");
  } else if (modalityFilter.value === "risk-only") {
    events = events.filter(
      (e) =>
        getRiskLevel(e.riskScore) === "high" ||
        getRiskLevel(e.riskScore) === "medium",
    );
  }
  // 'all' 模式：显示所有模态

  return events;
});

// ==================== CV视觉模态：当前显示的检测框和场景 ====================
// 【新逻辑】当前激活的事件（视频播放驱动）
const activeTimelineEvents = computed(() => {
  const currentTime = currentPlayTime.value;
  return timelineEvents.value.filter(
    (event) => currentTime >= event.startTime && currentTime <= event.endTime,
  );
});

// 【智能跟随】当前激活事件 ID 集合（用于 watch 触发）
const activeEventIds = computed(() => {
  return activeTimelineEvents.value.map((e) => e.id).join(",");
});

// 【新逻辑】当前显示的检测框（从激活事件中提取）
const currentDetections = computed(() => {
  const detections: any[] = [];

  // 从激活的 Visual 事件中提取检测框
  activeTimelineEvents.value.forEach((event) => {
    if (event.modality === "visual" && event.boundingBox) {
      const visualEvent = event as any;
      const normalizedType = normalizeDetectionType(
        visualEvent.detectionType,
        visualEvent.detectionLabel,
      );
      detections.push({
        id: visualEvent.id,
        type: normalizedType,
        labelPlacement:
          (Number(visualEvent?.boundingBox?.y) || 0) <= 8 ? "below" : "above",
        boundingBox: {
          x: visualEvent.boundingBox.x,
          y: visualEvent.boundingBox.y,
          width: visualEvent.boundingBox.width,
          height: visualEvent.boundingBox.height,
        },
        confidence: visualEvent.confidence / 100,
        label: visualEvent.detectionLabel,
        timeStart: visualEvent.startTime,
        timeEnd: visualEvent.endTime,
        metadata: visualEvent.metadata || {},
      });
    }
  });

  return detections;
});

// 当前场景信息
const currentScene = computed(() => {
  const currentTime = currentPlayTime.value;
  const scenes = mockScenes.value;
  if (!scenes || scenes.length === 0) return null;
  return scenes.find(
    (scene) => currentTime >= scene.timeStart && currentTime <= scene.timeEnd,
  );
});

// 格式化当前播放时间为 MM:SS 格式
const formattedCurrentTime = computed(() => {
  const seconds = Math.floor(currentPlayTime.value);
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
});

// ==================== 视频档案数据已从mockAnalysisResult导入 ====================

// ==================== 旧的interface定义已删除，统一使用mockAnalysisResult ====================

// 辅助函数：根据finalScore获取情感类别（用于态度分析）
const getSentimentByScore = (negativeRatio: number): string => {
  // 负面占比 < 33.3% 为正面（绿色）
  if (negativeRatio < 33.3) return "positive";
  // 负面占比 > 66.7% 为负面（红色）
  if (negativeRatio > 66.7) return "negative";
  // 其余为中性（橙色）
  return "neutral";
};

// 辅助函数：根据finalScore获取风险等级（用于舆论风险）
const getRiskLevelByScore = (score: number): string => {
  // finalScore < 33.3 为低风险（绿色）
  if (score < 33.3) return "low";
  // finalScore > 66.7 为高风险（红色）
  if (score > 66.7) return "high";
  // 其余为中等风险（橙色）
  return "medium";
};

// 辅助函数：获取风险等级标签
const getRiskLabel = (riskLevel: string): string => {
  const labels: Record<string, string> = {
    low: "低风险",
    medium: "中等风险",
    high: "高风险",
  };
  return labels[riskLevel] || "未知";
};

// 辅助函数：获取情感标签
const getSentimentLabel = (sentiment: string): string => {
  const labels: Record<string, string> = {
    positive: "正面/积极",
    neutral: "中性/客观",
    negative: "负面/不满",
  };
  return labels[sentiment] || "未知";
};

// 辅助函数：根据sentimentScore获取sentiment标签
const getSentimentBySentimentScore = (
  sentimentScore: number | undefined,
): string => {
  if (sentimentScore === undefined) return "neutral";
  if (sentimentScore < 33.3) return "positive";
  if (sentimentScore > 66.7) return "negative";
  return "neutral";
};

// 辅助函数：根据sentiment标签获取中文文本
const getSentimentText = (sentiment: string): string => {
  const labels: Record<string, string> = {
    positive: "正面",
    neutral: "中性",
    negative: "负面",
  };
  return labels[sentiment] || "中性";
};

// 辅助函数：获取情感图标样式
const getSentimentIconClass = (sentiment: string): string => {
  const classes: Record<string, string> = {
    positive: "icon-bg-positive",
    neutral: "icon-bg-neutral",
    negative: "icon-bg-negative",
  };
  return classes[sentiment] || "icon-bg-neutral";
};

// 辅助函数：获取情感文字样式
const getSentimentTextClass = (sentiment: string): string => {
  const classes: Record<string, string> = {
    positive: "text-positive",
    neutral: "text-neutral",
    negative: "text-negative",
  };
  return classes[sentiment] || "text-neutral";
};

// 辅助函数：获取舆论风险图标样式
const getOpinionRiskIconClass = (level: string): string => {
  const classes: Record<string, string> = {
    low: "icon-bg-risk-low",
    medium: "icon-bg-risk-medium",
    high: "icon-bg-risk-high",
  };
  return classes[level] || "icon-bg-risk-medium";
};

// 辅助函数：获取舆论风险文字样式
const getOpinionRiskTextClass = (level: string): string => {
  const classes: Record<string, string> = {
    low: "text-risk-low",
    medium: "text-risk-medium",
    high: "text-risk-high",
  };
  return classes[level] || "text-risk-medium";
};

// 辅助函数：获取证据面板主值的颜色类（确保与卡片颜色一致）
const getPanelValueClass = (): string => {
  if (!currentCardId.value) return "";

  // 根据不同的卡片ID返回对应的颜色类
  switch (currentCardId.value) {
    case "identity":
      return "text-identity";
    case "university":
      return "text-uni";
    case "topic":
      return "text-topic";
    case "attitude": {
      // 基于负面占比动态计算
      const negativeRatio =
        (attitudeStatistics.value.negative / attitudeStatistics.value.total) *
        100;
      const sentiment = getSentimentByScore(negativeRatio);
      return getSentimentTextClass(sentiment);
    }
    case "opinionRisk": {
      // 基于finalScore动态计算
      const result = currentResult.value;
      if (!result) return "";
      const riskLevel = getRiskLevelByScore(
        result.opinionRisk.modalityFusion.finalScore,
      );
      return getOpinionRiskTextClass(riskLevel);
    }
    case "action":
      return "text-action";
    default:
      return "";
  }
};

// 传播潜力标签应该由Python后端判断并返回，前端不再自己判断

// ==================== 高校舆情分析核心数据 END ====================

// 视频风险点（直接使用统一数据源）
const mockVideoRisks = computed(() => mockVideoRisksData.value);

// 音频情绪数据（直接使用统一数据源）
const mockAudioEmotions = computed(() => mockAudioEmotionsData.value);

// 文本风险数据（直接使用统一数据源）
const mockTextRisks = computed(() => mockTextRisksData.value);

// 综合风险数据（直接使用统一数据源）
const mockComprehensiveRisks = computed(() => mockComprehensiveRisksData.value);

// 统计数据（用于模板）- 根据 intensity 阈值统计高强度情绪
const angryEmotionCount = computed(() => {
  return mockAudioEmotions.value.filter((e) => e.intensity > 0.8).length;
});

const highRiskSegmentCount = computed(() => {
  return timelineEvents.value.filter(
    (e) => getRiskLevel(e.riskScore) === "high",
  ).length;
});

// ==================== Gemini优化：多模态融合雷达图数据 ====================
const multiModalRadarOption = computed(() => {
  // 高校舆情分析维度说明映射
  const dimensionDesc: Record<string, string> = {
    身份置信度: "判定发布者为本校学生/校友的置信程度",
    学校关联度: "视频内容与学校相关话题的关联程度",
    负面情感度: "对学校表达负面情绪的强度",
    传播风险: "内容引发校园舆论传播的可能性",
    影响范围: "对学校声誉的潜在影响程度",
    处置紧迫度: "需要校方介入处理的紧迫程度",
  };

  const dark = isDarkTheme.value;
  const radarNameColor = dark ? "#c8d1e8" : "#666";
  const radarSplitLineColor = dark
    ? "rgba(120, 136, 175, 0.45)"
    : "rgba(209, 217, 230, 0.4)";
  const radarAxisLineColor = dark
    ? "rgba(140, 156, 190, 0.55)"
    : "rgba(209, 217, 230, 0.5)";
  const baseAreaA = dark ? "rgba(65, 74, 104, 0.3)" : "rgba(236, 240, 243, 0.3)";
  const baseAreaB = dark ? "rgba(48, 57, 84, 0.45)" : "rgba(236, 240, 243, 0.5)";

  return {
    tooltip: {
      trigger: "item",
      appendToBody: true, // 允许自由移动
      confine: false,
      // 强制左上方，无任何判断
      position: function (
        point: number[],
        params: any,
        dom: HTMLElement,
        rect: any,
        size: { contentSize: number[]; viewSize: number[] },
      ) {
        const [mouseX, mouseY] = point;
        const [contentWidth, contentHeight] = size.contentSize;

        // 强制左上方（永远！）
        return [mouseX - contentWidth - 15, mouseY - contentHeight - 15];
      },
      enterable: true,
      backgroundColor: dark ? "rgba(24, 30, 48, 0.96)" : "rgba(255, 255, 255, 0.98)",
      borderColor: dark ? "rgba(110, 125, 160, 0.45)" : "rgba(209, 217, 230, 0.4)",
      borderWidth: 1,
      padding: 16,
      textStyle: {
        color: dark ? "#e8ecf7" : "#181818",
        fontSize: 13,
        lineHeight: 20,
      },
      extraCssText:
        "box-shadow: 0 4px 20px rgba(0,0,0,0.12); border-radius: 12px; max-width: 340px; max-height: 550px; overflow-y: auto;",
      formatter: (params: any) => {
        if (!params || !params.name) return "";

        const values = params.value || [];
        const dimensions = [
          "身份置信度",
          "学校关联度",
          "负面情感度",
          "传播风险",
          "影响范围",
          "处置紧迫度",
        ];

        // 深色模式：formatter 内联样式需随主题切换，否则悬浮窗内容在深色背景下不可读
        const titleColor = dark ? "#e8ecf7" : "#111827";
        const titleBorder = dark ? "rgba(200, 209, 232, 0.4)" : "#111827";
        const dimColor = dark ? "#b6c2df" : "#333";
        const itemBg = dark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.02)";
        const barBg = dark ? "rgba(255,255,255,0.12)" : "rgba(0,0,0,0.08)";

        let html = `
          <div style="min-width: 260px;">
            <div style="font-size: 14px; font-weight: 600; color: ${titleColor}; margin-bottom: 8px; border-bottom: 1.5px solid ${titleBorder}; padding-bottom: 6px;">
              <i class="fas fa-chart-area" style="margin-right: 4px;"></i>
              ${params.name}
            </div>
            <div style="display: flex; flex-direction: column; gap: 6px;">
        `;

        dimensions.forEach((dim, index) => {
          const value = values[index] || 0;
          let levelText = "正常";
          let levelColor = "#10b981"; // 默认绿色

          // 根据风险值动态设置颜色
          if (value > 66.7) {
            levelText = "高";
            levelColor = "#ef4444"; // 红色
          } else if (value >= 33.3) {
            levelText = "中";
            levelColor = "#f59e0b"; // 橙色
          } else {
            levelText = "低";
            levelColor = "#10b981"; // 绿色
          }

          html += `
            <div style="background: ${itemBg}; padding: 6px 8px; border-radius: 4px;">
              <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 3px;">
                <span style="font-weight: 600; color: ${dimColor}; font-size: 12px;">${dim}</span>
                <span style="font-weight: 700; font-size: 14px; color: ${levelColor};">${value}%</span>
              </div>
              <div style="display: flex; align-items: center; gap: 6px;">
                <div style="flex: 1; height: 5px; background: ${barBg}; border-radius: 2px; overflow: hidden;">
                  <div style="width: ${value}%; height: 100%; background: ${levelColor};"></div>
                </div>
                <span style="font-size: 10px; font-weight: 600; color: ${levelColor}; min-width: 40px; text-align: right;">${levelText}</span>
              </div>
            </div>
          `;
        });

        // 获取当前时间对应的综合风险分（直接引用 comprehensiveRisks）
        const currentTime = currentPlayTime.value;
        const comprehensiveRisks = mockComprehensiveRisksData.value;
        if (!comprehensiveRisks || comprehensiveRisks.length === 0) return 0;
        const index = Math.min(
          Math.floor(currentTime / timeGranularity.value),
          comprehensiveRisks.length - 1,
        );
        const comprehensiveRisk = comprehensiveRisks[index];
        const avgRisk = comprehensiveRisk?.intensity
          ? comprehensiveRisk.intensity * 100
          : 0; // 转为百分比

        let overallLevel = "低风险";
        let overallColor = "#10b981"; // 默认绿色

        if (avgRisk > 66.7) {
          overallLevel = "高风险";
          overallColor = "#ef4444"; // 红色
        } else if (avgRisk >= 33.3) {
          overallLevel = "中等风险";
          overallColor = "#f59e0b"; // 橙色
        }

        html += `
            </div>
            <div style="margin-top: 8px; padding-top: 8px; border-top: 1px solid #e8e8e8; text-align: center;">
              <span style="font-size: 11px; color: #666;">综合风险：</span>
              <span style="font-size: 16px; font-weight: 700; color: ${overallColor}; margin-left: 4px;">
                ${Math.round(avgRisk)}
              </span>
              <span style="font-size: 11px; font-weight: 600; color: ${overallColor}; margin-left: 4px;">
                (${overallLevel})
              </span>
            </div>
          </div>
        `;

        return html;
      },
    },
    radar: {
      center: ["50%", "50%"], // 👈 雷达图中心位置 [左右, 上下]，左移以减少右侧空白
      radius: "75%",
      indicator: [
        { name: "身份置信度", max: 100 },
        { name: "学校关联度", max: 100 },
        { name: "负面情感度", max: 100 },
        { name: "传播风险", max: 100 },
        { name: "影响范围", max: 100 },
        { name: "处置紧迫度", max: 100 },
      ],
      shape: "polygon",
      splitNumber: 4,
      name: {
        textStyle: {
          color: radarNameColor,
          fontSize: 11,
        },
      },
      splitLine: {
        lineStyle: {
          color: radarSplitLineColor,
        },
      },
      splitArea: {
        areaStyle: {
          color: [baseAreaA, baseAreaB],
        },
      },
      axisLine: {
        lineStyle: {
          color: radarAxisLineColor,
        },
      },
    },
    series: [
      // 底层（基准层）：全片平均雷达数据 - 静态参考线
      {
        type: "radar",
        symbol: "none", // 不显示数据点
        data: [
          {
            value: mockAverageRadarData.value, // 静态数据：全片平均值
            name: "全片平均水平",
            lineStyle: {
              color: dark ? "rgba(160, 178, 220, 0.7)" : "rgba(180, 188, 208, 0.6)", // 浅灰蓝色
              width: 2,
              type: "dashed", // 虚线
            },
            areaStyle: {
              color: dark ? "rgba(90, 108, 152, 0.18)" : "rgba(180, 188, 208, 0.08)", // 极低透明度填充
            },
          },
        ],
        label: {
          show: false,
        },
        z: 1, // 层级较低
      },
      // 顶层（实时层）：当前时刻雷达数据 - 动态变化
      {
        type: "radar",
        symbol: "circle",
        symbolSize: 6,
        data: [
          {
            value: currentRadarData.value, // 动态数据：根据视频时间变化
            name: "高校舆情风险画像",
            itemStyle: {
              color: dark ? "#ff7a7a" : "#f56c6c",
            },
            lineStyle: {
              color: dark ? "#ff7a7a" : "#f56c6c",
              width: 2,
            },
            areaStyle: {
              color: dark ? "rgba(255, 122, 122, 0.3)" : "rgba(245, 108, 108, 0.25)",
            },
          },
        ],
        label: {
          show: false,
        },
        z: 2, // 层级较高
      },
    ],
    // 动画配置：平滑过渡动画
    animation: true,
    animationDuration: 800, // 初始加载动画：800ms
    animationEasing: "cubicInOut",
    animationDurationUpdate: 600, // 数据更新动画：600ms，平滑过渡
    animationEasingUpdate: "cubicOut", // 缓出效果，更自然
    // 静默更新：不触发鼠标事件重置
    silent: false,
  };
});

// ==================== 报告视图专用雷达图配置 ====================
// 1. 最高风险雷达图 - 找出综合风险最高的时间段
const peakRiskData = computed(() => {
  const radarData = mockRadarDataByTime.value;
  if (!radarData || radarData.length === 0) return { data: [0, 0, 0, 0, 0, 0] };

  let maxRisk = 0;
  let peakData = radarData[0] || { data: [0, 0, 0, 0, 0, 0] };

  radarData.forEach((timeData) => {
    const avgRisk =
      timeData.data.reduce((a, b) => a + b, 0) / timeData.data.length;
    if (avgRisk > maxRisk) {
      maxRisk = avgRisk;
      peakData = timeData;
    }
  });

  return {
    data: peakData?.data || [0, 0, 0, 0, 0, 0],
    avgRisk: Math.round(maxRisk),
  };
});

// 2. 平均雷达图配置 - 使用后端提供的全片平均数据
const averageRadarOption = computed(() => {
  const dark = isDarkTheme.value;
  const splitColor = dark ? "rgba(120, 136, 175, 0.45)" : "rgba(209, 217, 230, 0.4)";
  const axisColor = dark ? "rgba(140, 156, 190, 0.55)" : "rgba(209, 217, 230, 0.5)";
  const areaColors = dark
    ? ["rgba(65, 74, 104, 0.3)", "rgba(48, 57, 84, 0.45)"]
    : ["rgba(236, 240, 243, 0.3)", "rgba(236, 240, 243, 0.5)"];
  const nameColor = dark ? "#c8d1e8" : "#666";

  const dimensionNames = [
    "身份置信度",
    "学校关联度",
    "负面情感度",
    "传播风险",
    "影响范围",
    "处置紧迫度",
  ];

  return {
    tooltip: {
      trigger: "item",
    },
    radar: {
      indicator: dimensionNames.map((name) => ({
        name,
        max: 100,
      })),
      radius: "65%",
      splitNumber: 4,
      name: {
        textStyle: {
          color: nameColor,
          fontSize: 12,
        },
      },
      splitLine: {
        lineStyle: { color: splitColor },
      },
      splitArea: {
        areaStyle: { color: areaColors },
      },
      axisLine: {
        lineStyle: { color: axisColor },
      },
    },
    series: [
      {
        type: "radar",
        symbol: "circle",
        symbolSize: 6,
        data: [
          {
            value: mockAverageRadarData.value, // 直接使用后端提供的平均数据
            name: "平均风险画像",
            areaStyle: {
              color: "rgba(75, 112, 226, 0.2)",
            },
            lineStyle: {
              color: "#4b70e2",
              width: 2,
            },
            itemStyle: {
              color: "#4b70e2",
            },
          },
        ],
      },
    ],
  };
});

// 最高风险雷达图配置
const peakRiskRadarOption = computed(() => {
  const dark = isDarkTheme.value;
  const splitColor = dark ? "rgba(120, 136, 175, 0.45)" : "rgba(209, 217, 230, 0.4)";
  const axisColor = dark ? "rgba(140, 156, 190, 0.55)" : "rgba(209, 217, 230, 0.5)";
  const areaColors = dark
    ? ["rgba(65, 74, 104, 0.3)", "rgba(48, 57, 84, 0.45)"]
    : ["rgba(236, 240, 243, 0.3)", "rgba(236, 240, 243, 0.5)"];
  const nameColor = dark ? "#c8d1e8" : "#666";

  const dimensionNames = [
    "身份置信度",
    "学校关联度",
    "负面情感度",
    "传播风险",
    "影响范围",
    "处置紧迫度",
  ];
  const peak = peakRiskData.value;

  return {
    title: {
      text: `峰值时段：${formatTimeDisplay(peak.timeStart)} - ${formatTimeDisplay(peak.timeEnd)}`,
      left: "center",
      top: 10,
      textStyle: {
        fontSize: 13,
        color: "#f56c6c",
        fontWeight: 600,
      },
    },
    tooltip: {
      trigger: "item",
    },
    radar: {
      indicator: dimensionNames.map((name) => ({
        name,
        max: 100,
      })),
      radius: "60%",
      center: ["50%", "55%"],
      splitNumber: 4,
      name: {
        textStyle: {
          color: nameColor,
          fontSize: 12,
        },
      },
      splitLine: {
        lineStyle: { color: splitColor },
      },
      splitArea: {
        areaStyle: { color: areaColors },
      },
      axisLine: {
        lineStyle: { color: axisColor },
      },
    },
    series: [
      {
        type: "radar",
        symbol: "circle",
        symbolSize: 6,
        data: [
          {
            value: peak.data,
            name: `最高风险画像（${peak.avgRisk}分）`,
            areaStyle: {
              color: "rgba(245, 108, 108, 0.25)",
            },
            lineStyle: {
              color: "#f56c6c",
              width: 2,
            },
            itemStyle: {
              color: "#f56c6c",
            },
          },
        ],
      },
    ],
  };
});

// 新拟态配色
const neuColors = {
  purple: "#4b70e2",
  gray: "#a0a5a8",
  black: "#181818",
  neu1: "#ecf0f3",
  neu2: "#d1d9e6",
};

// 风险评分图表配置
const riskChartOption = computed(() => {
  const result = currentResult.value;
  if (!result) return {};

  return {
    tooltip: {
      trigger: "item",
      formatter: "{b}: {c}%",
    },
    series: [
      {
        type: "pie",
        radius: ["45%", "70%"],
        avoidLabelOverlap: false,
        itemStyle: {
          borderRadius: 8,
          borderColor: neuColors.neu1,
          borderWidth: 3,
        },
        label: {
          show: true,
          formatter: "{b}\n{d}%",
          color: neuColors.black,
        },
        emphasis: {
          label: {
            show: true,
            fontSize: 14,
            fontWeight: "bold",
          },
        },
        data: [
          {
            value: Math.round(
              result.opinionRisk.modalityFusion?.finalScore || 0,
            ),
            name: "风险评分",
            itemStyle: { color: "#f56c6c" },
          },
          {
            value: Math.round(
              100 - (result.opinionRisk.modalityFusion?.finalScore || 0),
            ),
            name: "安全评分",
            itemStyle: { color: "#52c41a" },
          },
        ],
      },
    ],
  };
});

// 受众年龄分布图表
const audienceChartOption = computed(() => {
  const result = currentResult.value;
  if (!result?.audienceAnalysis?.ageDistribution) return {};

  const dist = result.audienceAnalysis.ageDistribution;

  return {
    tooltip: {
      trigger: "axis",
      axisPointer: { type: "shadow" },
    },
    grid: {
      left: "3%",
      right: "4%",
      bottom: "3%",
      top: "10%",
      containLabel: true,
    },
    xAxis: {
      type: "category",
      data: ["18-24岁", "25-34岁", "35-44岁", "45岁+"],
      axisLine: { lineStyle: { color: neuColors.neu2 } },
      axisLabel: { color: neuColors.gray, fontSize: 11 },
    },
    yAxis: {
      type: "value",
      max: 100,
      axisLine: { show: false },
      splitLine: { lineStyle: { color: "#e8edf3" } },
      axisLabel: {
        color: neuColors.gray,
        fontSize: 11,
        formatter: "{value}%",
      },
    },
    series: [
      {
        type: "bar",
        barWidth: "50%",
        data: [
          {
            value: Math.round(dist["18-24"] * 100),
            itemStyle: { color: neuColors.purple },
          },
          {
            value: Math.round(dist["25-34"] * 100),
            itemStyle: { color: "#7c9df7" },
          },
          {
            value: Math.round(dist["35-44"] * 100),
            itemStyle: { color: "#a3bef9" },
          },
          {
            value: Math.round(dist["45+"] * 100),
            itemStyle: { color: "#c5d5fb" },
          },
        ],
        itemStyle: {
          borderRadius: [6, 6, 0, 0],
        },
      },
    ],
  };
});

// 多模态时间轴配置（交互视图专用 - 增强版）
const multiModalTimelineOption = computed(() => {
  // 使用视频真实时长，确保时间轴与视频进度精确对齐（不依赖analysisData，使用mock数据）
  const duration = videoDuration.value;
  const dark = isDarkTheme.value;
  const axisColor = dark ? "#b6c2df" : "#666";
  const borderColor = dark ? "rgba(110, 126, 166, 0.45)" : "rgba(209, 217, 230, 0.3)";
  const splitColor = dark ? "rgba(108, 122, 160, 0.35)" : "rgba(209, 217, 230, 0.4)";
  const timePoints: number[] = [];
  for (let t = 0; t <= duration; t += 5) {
    timePoints.push(t);
  }

  // 多模态数据（三条独立曲线）
  const multiModalData = timePoints.map((t) => {
    // 根据时间计算索引（使用时间粒度），限制不越界
    const rawIndex = Math.floor(t / timeGranularity.value);
    const index = Math.min(rawIndex, mockVideoRisks.value.length - 1);

    // 视频风险（使用索引查询，O(1)复杂度）
    const videoRisk = mockVideoRisks.value[index];
    const videoScore = videoRisk ? videoRisk.intensity * 100 : 0;

    // 音频情绪风险（使用索引查询，O(1)复杂度）
    const audioEmotion = mockAudioEmotions.value[index];
    const audioScore = audioEmotion ? audioEmotion.intensity * 100 : 0;

    // 文本风险（使用索引查询，O(1)复杂度）
    const textRisk = mockTextRisks.value[index];
    const textScore = textRisk ? textRisk.intensity * 100 : 0;

    // 综合风险（使用索引查询，O(1)复杂度）
    const comprehensiveRisk = mockComprehensiveRisks.value[index];
    const comprehensiveScore = comprehensiveRisk
      ? comprehensiveRisk.intensity * 100
      : 0;

    return {
      time: t,
      videoScore,
      audioScore,
      textScore,
      comprehensiveScore,
      videoRisk,
      audioEmotion,
      textSegment: textRisk,
      comprehensiveRisk,
    };
  });

  // 提取四个模态的独立数据数组（改为二维数组格式 [x, y]）
  const videoData = multiModalData.map((d) => [d.time, d.videoScore]);
  const audioData = multiModalData.map((d) => [d.time, d.audioScore]);
  const textData = multiModalData.map((d) => [d.time, d.textScore]);
  const comprehensiveData = multiModalData.map((d) => [
    d.time,
    d.comprehensiveScore,
  ]);

  return {
    tooltip: {
      trigger: "axis",
      appendToBody: true, // 允许自由移动
      confine: false,
      // 强制上方显示，不做任何判断
      position: function (
        point: number[],
        params: any,
        dom: HTMLElement,
        rect: any,
        size: { contentSize: number[]; viewSize: number[] },
      ) {
        const [mouseX, mouseY] = point;
        const [contentWidth, contentHeight] = size.contentSize;
        const viewWidth = window.innerWidth;

        // 强制在鼠标上方
        let x = mouseX + 15;
        let y = mouseY - contentHeight - 15;

        // 只检测左右边界
        if (x + contentWidth > viewWidth - 20) {
          x = mouseX - contentWidth - 15;
        }
        if (x < 20) {
          x = 20;
        }

        return [x, y];
      },
      axisPointer: {
        type: "line",
        snap: false, // 不吸附到数据点，精确跟随鼠标位置
        lineStyle: {
          color: "rgba(75, 112, 226, 0.4)",
          width: 1,
          type: "dashed",
        },
        label: {
          show: true,
          backgroundColor: "#4b70e2",
          borderColor: "#4b70e2",
          borderWidth: 1,
          color: "#fff",
          fontSize: 12,
          fontWeight: "bold",
          padding: [4, 8],
          borderRadius: 4,
          shadowBlur: 4,
          shadowColor: "rgba(75, 112, 226, 0.3)",
          formatter: (params: any) => {
            const value = params.value;
            const m = Math.floor(value / 60);
            const s = Math.floor(value % 60);
            return `${m}:${s.toString().padStart(2, "0")}`;
          },
        },
      },
      backgroundColor: dark ? "rgba(24, 30, 48, 0.96)" : "rgba(255, 255, 255, 0.98)",
      borderColor: dark ? "rgba(110, 125, 160, 0.45)" : "rgba(209, 217, 230, 0.4)",
      borderWidth: 1,
      padding: [8, 15],
      textStyle: { color: dark ? "#e8ecf7" : "#181818", fontSize: 12 },
      extraCssText:
        "box-shadow: 0 4px 16px rgba(0,0,0,0.08); border-radius: 10px;",
      formatter: (params: any) => {
        if (!params || params.length === 0) return "";

        const dataIndex = params[0].dataIndex;
        const data = multiModalData[dataIndex];
        if (!data) return "";

        // 使用comprehensiveScore作为综合风险
        const comprehensiveScore = data.comprehensiveScore;
        let riskColor = "#10b981";
        let riskBg = "rgba(16, 185, 129, 0.1)";
        if (comprehensiveScore >= 70) {
          riskColor = "#ef4444";
          riskBg = "rgba(239, 68, 68, 0.1)";
        } else if (comprehensiveScore >= 40) {
          riskColor = "#f59e0b";
          riskBg = "rgba(245, 158, 11, 0.1)";
        }

        // 深色模式：formatter 内联样式需随主题切换
        const titleColor = dark ? "#e8ecf7" : "#111827";
        const dividerColor = dark ? "rgba(200, 209, 232, 0.3)" : "#e5e7eb";
        const labelColor = dark ? "#b6c2df" : "#374151";
        const descColor = dark ? "#9ca8c4" : "#6b7280";
        const hintColor = dark ? "#8b95b0" : "#9ca3af";
        const borderColor = dark ? "rgba(200, 209, 232, 0.3)" : "#e5e7eb";
        const linkColor = dark ? "#7c9aff" : "#6588ed";

        let html = `
          <div style="min-width: 200px; max-width: 320px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;">
            <!-- 综合风险标题 -->
            <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 8px;">
              <span style="color: ${titleColor}; font-weight: 600; font-size: 15px; flex-shrink: 0; margin-right: 10px;">综合风险</span>
              <div style="display: inline-flex; align-items: center; gap: 6px; background: ${riskBg}; padding: 5px 12px; border-radius: 6px;">
                <div style="width: 6px; height: 6px; border-radius: 50%; background: ${riskColor};"></div>
                <span style="color: ${riskColor}; font-weight: 700; font-size: 16px;">${comprehensiveScore.toFixed(0)}%</span>
              </div>
            </div>
            
            <div style="width: 100%; height: 1px; background: ${dividerColor}; margin-bottom: 14px;"></div>
        `;

        // 1. 视频风险
        const videoColor =
          data.videoScore < 33.3
            ? "#10b981"
            : data.videoScore > 66.7
              ? "#ef4444"
              : "#f59e0b";
        html += `
          <div style="margin-bottom: 12px;">
            <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 6px;">
              <span style="color: ${labelColor}; font-size: 13px; font-weight: 600; min-width: 60px; margin-right: 20px;">视频风险</span>
              <span style="color: ${videoColor}; font-weight: 700; font-size: 15px;">${data.videoScore.toFixed(0)}%</span>
            </div>
            ${
              data.videoRisk
                ? `<div style="color: ${descColor}; font-size: 12px; line-height: 1.5; padding-left: 8px; border-left: 2px solid ${videoColor};">${data.videoRisk.reason}</div>`
                : `<div style="color: ${hintColor}; font-size: 12px; padding-left: 8px;">该时段画面正常</div>`
            }
          </div>
        `;

        // 2. 音频情绪
        const audioColor =
          data.audioScore < 33.3
            ? "#10b981"
            : data.audioScore > 66.7
              ? "#ef4444"
              : "#f59e0b";
        html += `
          <div style="margin-bottom: 12px;">
            <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 6px;">
              <span style="color: ${labelColor}; font-size: 13px; font-weight: 600; min-width: 60px; margin-right: 20px;">音频情绪</span>
              <span style="color: ${audioColor}; font-weight: 700; font-size: 15px;">${data.audioScore.toFixed(0)}%</span>
            </div>
            ${
              data.audioEmotion
                ? `<div style="color: ${descColor}; font-size: 12px; line-height: 1.5; padding-left: 8px; border-left: 2px solid ${audioColor};">${data.audioEmotion.reason}</div>`
                : `<div style="color: ${hintColor}; font-size: 12px; padding-left: 8px;">该时段情绪稳定</div>`
            }
          </div>
        `;

        // 3. 文本内容
        const textColor =
          data.textScore < 33.3
            ? "#10b981"
            : data.textScore > 66.7
              ? "#ef4444"
              : "#f59e0b";
        html += `
          <div style="margin-bottom: 12px;">
            <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 6px;">
              <span style="color: ${labelColor}; font-size: 13px; font-weight: 600; min-width: 60px; margin-right: 20px;">文本内容</span>
              <span style="color: ${textColor}; font-weight: 700; font-size: 15px;">${data.textScore.toFixed(0)}%</span>
            </div>
            ${
              data.textSegment
                ? `<div style="color: ${descColor}; font-size: 12px; line-height: 1.5; padding-left: 8px; border-left: 2px solid ${textColor};">${data.textSegment.reason}</div>`
                : `<div style="color: ${hintColor}; font-size: 12px; padding-left: 8px;">该时段内容正常</div>`
            }
          </div>
        `;

        html += `
            <!-- 底部操作提示 -->
            <div style="margin-top: 14px; padding-top: 8px; border-top: 1px solid ${borderColor}; text-align: center;">
              <span style="color: ${linkColor}; font-size: 14px; font-weight: 500;">点 击 跳 转</span>
            </div>
          </div>
        `;

        return html;
      },
    },
    legend: {
      data: ["视频风险", "音频情绪", "文本风险", "综合风险"],
      bottom: 5,
      textStyle: {
        color: axisColor,
        fontSize: 11,
        fontWeight: "normal",
      },
      itemGap: 20,
      itemWidth: 30,
      itemHeight: 12,
      icon: "rect",
      padding: [5, 10],
    },
    grid: {
      left: 45,
      right: 22,
      bottom: 65, // 从30%改为固定50px，缩小图例与折线图的间距
      top: "5%",
      containLabel: false,
    },
    xAxis: {
      type: "value",
      min: 0,
      max: duration,
      name: "", // 移除"时间（秒）"文字
      nameTextStyle: {
        color: "#999",
        fontSize: 11,
        padding: [5, 0, 0, 0],
      },
      nameGap: 5,
      axisLine: {
        show: true,
        lineStyle: {
          color: borderColor,
          width: 1,
        },
      },
      axisTick: {
        show: true,
        length: 4,
        lineStyle: {
          color: dark ? "rgba(140, 156, 190, 0.6)" : "rgba(209, 217, 230, 0.5)",
          width: 1,
        },
      },
      axisLabel: {
        color: axisColor,
        fontSize: 11,
        formatter: (value: number) => formatTimestamp(value),
        margin: 8,
      },
      // 深色模式：时间节点处的竖直线（splitLine）需适配，否则在深色背景下显示为刺眼白色
      splitLine: {
        show: true,
        lineStyle: {
          color: splitColor,
          type: "dashed",
          width: 1,
        },
      },
      axisPointer: {
        snap: false, // 关键！让axisPointer不吸附到数据点，精确跟随鼠标
        label: {
          show: true,
          backgroundColor: "#4b70e2",
          borderColor: "#4b70e2",
          borderWidth: 1,
          color: "#fff",
          fontSize: 12,
          fontWeight: "bold",
          padding: [4, 8],
          borderRadius: 4,
          shadowBlur: 4,
          shadowColor: "rgba(75, 112, 226, 0.3)",
          formatter: (params: any) => {
            const value = params.value;
            const m = Math.floor(value / 60);
            const s = Math.floor(value % 60);
            return `${m}:${s.toString().padStart(2, "0")}`;
          },
        },
      },
    },
    yAxis: {
      type: "value",
      name: "", // 移除"风险指数"文字
      nameTextStyle: {
        color: "#999",
        fontSize: 11,
      },
      min: 0,
      max: 100,
      interval: 20, // 每20%一个刻度（0, 20, 40, 60, 80, 100）
      axisLine: {
        show: true,
        lineStyle: {
          color: borderColor,
          width: 1,
        },
      },
      axisTick: {
        show: true,
        length: 4,
        lineStyle: {
          color: dark ? "rgba(140, 156, 190, 0.6)" : "rgba(209, 217, 230, 0.5)",
          width: 1,
        },
      },
      splitLine: {
        show: true,
        lineStyle: {
          color: splitColor,
          type: "solid",
          width: 1,
        },
      },
      axisLabel: {
        show: true, // 显示Y轴标签（0%、20%、40%等）
        color: axisColor,
        fontSize: 11,
        formatter: "{value}%",
        margin: 8,
      },
    },
    series: [
      // 1. 视频风险曲线（参考1.0版本 - 更细更柔和）
      {
        name: "视频风险",
        type: "line",
        data: videoData,
        smooth: 0.35,
        symbol: "none", // 移除密集圆点
        showSymbol: false, // 不显示标记点
        lineStyle: {
          width: 2,
          color: "#ff7875",
          opacity: 0.8,
        },
        itemStyle: {
          color: "#ff7875",
          borderColor: "#fff",
          borderWidth: 2,
        },
        areaStyle: {
          color: {
            type: "linear",
            x: 0,
            y: 0,
            x2: 0,
            y2: 1,
            colorStops: [
              { offset: 0, color: "rgba(255, 120, 117, 0.12)" },
              { offset: 1, color: "rgba(255, 120, 117, 0.02)" },
            ],
          },
        },
        emphasis: {
          lineStyle: { width: 2.5 },
          itemStyle: { borderWidth: 3 },
        },
      },

      // 2. 音频情绪曲线（参考1.0版本 - 更细更柔和）
      {
        name: "音频情绪",
        type: "line",
        data: audioData,
        smooth: 0.35,
        symbol: "none", // 移除密集圆点
        showSymbol: false, // 不显示标记点
        lineStyle: {
          width: 2,
          color: "#ffa940",
          opacity: 0.8,
        },
        itemStyle: {
          color: "#ffa940",
          borderColor: "#fff",
          borderWidth: 2,
        },
        areaStyle: {
          color: {
            type: "linear",
            x: 0,
            y: 0,
            x2: 0,
            y2: 1,
            colorStops: [
              { offset: 0, color: "rgba(255, 169, 64, 0.12)" },
              { offset: 1, color: "rgba(255, 169, 64, 0.02)" },
            ],
          },
        },
        emphasis: {
          lineStyle: { width: 2.5 },
          itemStyle: { borderWidth: 3 },
        },
      },

      // 3. 文本风险曲线（参考1.0版本 - 更细更柔和）
      {
        name: "文本风险",
        type: "line",
        data: textData,
        smooth: 0.35,
        symbol: "none", // 移除密集圆点
        symbolSize: 0,
        lineStyle: {
          width: 2,
          color: "#597ef7",
          opacity: 0.8,
        },
        itemStyle: {
          color: "#597ef7",
          borderColor: "#fff",
          borderWidth: 2,
        },
        areaStyle: {
          color: {
            type: "linear",
            x: 0,
            y: 0,
            x2: 0,
            y2: 1,
            colorStops: [
              { offset: 0, color: "rgba(89, 126, 247, 0.12)" },
              { offset: 1, color: "rgba(89, 126, 247, 0.02)" },
            ],
          },
        },
        emphasis: {
          lineStyle: { width: 2.5 },
          itemStyle: { borderWidth: 3 },
        },
        markLine: {
          silent: true,
          symbol: "none",
          animation: false,
          label: {
            show: true,
            position: "insideEndTop",
            formatter: "{b}",
            fontSize: 10,
            fontWeight: "normal",
            padding: [0, 5, 0, 0],
          },
          lineStyle: {
            type: "dashed",
            width: 1,
            dashOffset: 0,
          },
          data: [
            {
              yAxis: 70,
              name: "高风险线",
              lineStyle: {
                color: "rgba(255, 120, 117, 0.35)",
                type: "dashed",
              },
              label: {
                color: "rgba(255, 120, 117, 0.65)",
                backgroundColor: "transparent",
              },
            },
            {
              yAxis: 40,
              name: "中风险线",
              lineStyle: {
                color: "rgba(255, 169, 64, 0.35)",
                type: "dashed",
              },
              label: {
                color: "rgba(255, 169, 64, 0.65)",
                backgroundColor: "transparent",
              },
            },
          ],
        },
      },

      // 4. 综合风险曲线（加粗显示，突出重要性）
      {
        name: "综合风险",
        type: "line",
        data: comprehensiveData,
        smooth: 0.35,
        symbol: "none",
        showSymbol: false,
        lineStyle: {
          width: 3, // 比其他曲线粗一点
          color: "#722ed1", // 紫色
          opacity: 0.9,
        },
        itemStyle: {
          color: "#722ed1",
          borderColor: "#fff",
          borderWidth: 2,
        },
        areaStyle: {
          color: {
            type: "linear",
            x: 0,
            y: 0,
            x2: 0,
            y2: 1,
            colorStops: [
              { offset: 0, color: "rgba(114, 46, 209, 0.15)" },
              { offset: 1, color: "rgba(114, 46, 209, 0.03)" },
            ],
          },
        },
        emphasis: {
          lineStyle: { width: 3.5 },
          itemStyle: { borderWidth: 3 },
        },
        zlevel: 1, // 显示在其他曲线上方
      },
    ],
  };
});

// 风险时间轴图表配置
const riskTimelineOption = computed(() => {
  const timelineData = getRiskTimelineData();
  if (
    !timelineData ||
    !timelineData.timeSeriesData ||
    timelineData.timeSeriesData.length === 0
  ) {
    return {};
  }

  const dark = isDarkTheme.value;
  const times = timelineData.timeSeriesData.map((d: any) => d.time);
  const risks = timelineData.timeSeriesData.map((d: any) => d.risk * 100); // 转为百分比
  const riskPoints = timelineData.riskPoints || [];

  // 构建风险点映射表（优化查找性能）
  const riskPointsMap = new Map();
  riskPoints.forEach((p: any) => {
    riskPointsMap.set(p.time, p);
  });

  const tooltipTitleColor = dark ? "#e8ecf7" : "#181818";
  const tooltipBorderColor = dark ? "rgba(200, 209, 232, 0.3)" : "#eee";
  const tooltipDescColor = dark ? "#9ca8c4" : "#666";
  const tooltipHintColor = dark ? "#8b95b0" : "#6b7280";

  return {
    tooltip: {
      trigger: "axis",
      confine: true, // 限制在图表区域内，防止被遮挡
      backgroundColor: dark ? "rgba(24, 30, 48, 0.96)" : "rgba(255, 255, 255, 0.98)",
      borderColor: dark ? "rgba(110, 125, 160, 0.45)" : "rgba(209, 217, 230, 0.4)",
      textStyle: { color: tooltipTitleColor, fontSize: 12 },
      position: function (
        point: any,
        params: any,
        dom: any,
        rect: any,
        size: any,
      ) {
        // 智能定位：优先显示在右侧，空间不足时显示在左侧
        const x =
          point[0] < size.viewSize[0] / 2
            ? point[0] + 20
            : point[0] - size.contentSize[0] - 20;
        return [x, point[1] - size.contentSize[1] / 2];
      },
      axisPointer: {
        type: "line",
        lineStyle: { color: "#4b70e2", width: 2, type: "solid" },
      },
      formatter: (params: any) => {
        if (!params || !params[0]) return "";

        const dataIndex = params[0].dataIndex;
        const timeValue = timelineData.timeSeriesData[dataIndex].time;
        const riskValue = timelineData.timeSeriesData[dataIndex].risk * 100;

        const m = Math.floor(timeValue / 60);
        const s = Math.floor(timeValue % 60);
        const timeStr = `${m}:${s.toString().padStart(2, "0")}`;

        const color =
          riskValue > 70 ? "#f56c6c" : riskValue > 40 ? "#faad14" : "#52c41a";

        let html = `<div style="padding: 10px; min-width: 180px;">
          <div style="font-weight: 700; margin-bottom: 8px; font-size: 14px; color: ${tooltipTitleColor};">⏱️ 时间: ${timeStr}</div>
          <div style="color: ${color}; font-weight: 600; font-size: 15px;">
            📊 风险指数: ${riskValue.toFixed(1)}%
          </div>`;

        // 查找最近的风险点
        const nearbyPoint = riskPoints.find(
          (p: any) => Math.abs(p.time - timeValue) < 15,
        );
        if (nearbyPoint) {
          html += `<div style="margin-top: 10px; padding-top: 8px; border-top: 1px solid ${tooltipBorderColor};">
            <div style="font-size: 12px; color: #f56c6c; font-weight: 600;">⚠️ 检测到风险</div>
            <div style="font-size: 11px; color: ${tooltipDescColor}; margin-top: 4px;">${nearbyPoint.description}</div>
          </div>`;
        } else {
          html += `<div style="margin-top: 10px; padding-top: 8px; border-top: 1px solid ${tooltipBorderColor};">
            <div style="font-size: 11px; color: #52c41a;">✅ 该时段无明显风险</div>
          </div>`;
        }

        html += `<div style="margin-top: 10px; text-align: center;">
          <div style="font-size: 11px; color: #7c9aff; padding: 6px 12px; background: ${dark ? "rgba(75,112,226,0.2)" : "rgba(75,112,226,0.1)"}; border-radius: 6px;">
            💡 点击图表跳转播放此时段
          </div>
        </div></div>`;
        return html;
      },
    },
    grid: {
      left: "3%",
      right: "4%",
      bottom: "12%",
      top: "10%",
      containLabel: true,
    },
    xAxis: {
      type: "value",
      name: "时间（秒）",
      nameTextStyle: { color: neuColors.gray, fontSize: 11 },
      axisLine: { lineStyle: { color: neuColors.neu2 } },
      axisLabel: {
        color: neuColors.gray,
        fontSize: 11,
        formatter: (value: number) => formatTimestamp(value),
      },
      // 深色模式：时间节点竖直线，避免 #e8edf3 在深色背景下显示为刺眼白色
      splitLine: {
        lineStyle: {
          color: dark ? "rgba(108, 122, 160, 0.35)" : "#e8edf3",
          type: "dashed",
        },
      },
    },
    yAxis: {
      type: "value",
      name: "风险指数",
      max: 100,
      nameTextStyle: { color: neuColors.gray, fontSize: 11 },
      axisLine: { show: false },
      splitLine: {
        lineStyle: {
          color: dark ? "rgba(108, 122, 160, 0.35)" : "#e8edf3",
        },
      },
      axisLabel: {
        color: neuColors.gray,
        fontSize: 11,
        formatter: "{value}%",
      },
    },
    series: [
      {
        name: "风险指数",
        type: "line",
        smooth: true,
        data: times.map((time: number, index: number) => [time, risks[index]]),
        lineStyle: {
          width: 3,
          color: {
            type: "linear",
            x: 0,
            y: 0,
            x2: 1,
            y2: 0,
            colorStops: [
              { offset: 0, color: "#52c41a" },
              { offset: 0.5, color: "#faad14" },
              { offset: 1, color: "#f56c6c" },
            ],
          },
        },
        areaStyle: {
          color: {
            type: "linear",
            x: 0,
            y: 0,
            x2: 0,
            y2: 1,
            colorStops: [
              { offset: 0, color: "rgba(75, 112, 226, 0.3)" },
              { offset: 1, color: "rgba(75, 112, 226, 0.05)" },
            ],
          },
        },
        markPoint: {
          symbol: "pin",
          symbolSize: 50,
          data: riskPoints.map((p: any) => ({
            coord: [p.time, p.riskScore * 100],
            value: "⚠",
            itemStyle: { color: p.level === "high" ? "#f56c6c" : "#faad14" },
          })),
        },
        markLine: {
          silent: true,
          lineStyle: { type: "dashed", color: "#faad14", width: 1 },
          data: [
            { yAxis: 40, label: { formatter: "中风险线", position: "end" } },
            { yAxis: 70, label: { formatter: "高风险线", position: "end" } },
          ],
        },
      },
    ],
  };
});

// ==================== 组件初始化逻辑 ====================
// 组件挂载时初始化数据
const initializeComponent = () => {
  const result = props.analysisResult;

  // 1. 加载时间轴事件数据
  timelineEvents.value = result.timelineEvents || [];

  // 2. 设置视频URL和时长
  realVideoUrl.value = result.videoInfo?.videoUrl || "";
  videoDuration.value = result.videoInfo?.duration || 0;

  // 3. 初始化默认选中第一个高风险事件
  nextTick(() => {
    const firstHighRisk = timelineEvents.value.find(
      (e) => getRiskLevel(e.riskScore) === "high",
    );
    if (firstHighRisk) {
      selectedEvidenceId.value = firstHighRisk.id;
    } else if (timelineEvents.value.length > 0) {
      selectedEvidenceId.value = timelineEvents.value[0].id;
    }

    // 4. 初始化文本证据tooltip位置
    updateTextEvidenceTooltipPosition();
  });

  // 5. 【开发模式】验证事件流数据
  if (import.meta.env.DEV && timelineEvents.value.length > 0) {
    import("@/utils/verifyTimelineEvents").then(({ printValidationReport }) => {
      printValidationReport();
    });
  }
};

// ==================== 其他方法 ====================

const playVideo = (startTime: number = 0) => {
  videoStartTime.value = startTime;
  videoDialogVisible.value = true;
};

// 视频对话框打开后，跳转到指定时间
const onVideoDialogOpened = () => {
  setTimeout(() => {
    const videoElement =
      videoPlayerRef.value ||
      (document.querySelector(".video-player") as HTMLVideoElement);
    if (videoElement) {
      console.log("视频元素找到，准备跳转到:", videoStartTime.value, "秒");

      // 等待视频元数据加载完成
      const jumpToTime = () => {
        if (videoStartTime.value > 0) {
          videoElement.currentTime = videoStartTime.value;
          console.log(
            "✅ 视频已跳转到:",
            videoStartTime.value,
            "秒，当前时间:",
            videoElement.currentTime,
          );
        }
        videoElement.play().catch((e) => console.log("自动播放失败:", e));
      };

      if (videoElement.readyState >= 2) {
        // 视频已经加载了元数据，直接跳转
        jumpToTime();
      } else {
        // 等待元数据加载
        videoElement.addEventListener("loadedmetadata", jumpToTime, {
          once: true,
        });
      }
    } else {
      console.error("未找到视频元素");
    }
  }, 300);
};

const formatScore = (score: number | null | undefined): string => {
  if (score === null || score === undefined) return "0%";
  return (score * 100).toFixed(1) + "%";
};

// 风险等级应该由Python后端直接返回，前端不再根据数值判断

const formatDate = (dateStr: string): string => {
  return new Date(dateStr).toLocaleString("zh-CN");
};

const formatDuration = (seconds: number): string => {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}分${s}秒`;
};

const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + " " + sizes[i];
};

// 格式化时间范围（秒 -> mm:ss-mm:ss）
// 格式化单个时间点
const formatTime = (seconds: number): string => {
  const m = Math.floor(seconds / 60)
    .toString()
    .padStart(2, "0");
  const s = Math.floor(seconds % 60)
    .toString()
    .padStart(2, "0");
  return `${m}:${s}`;
};

const formatTimeRange = (startSeconds: number, endSeconds?: number): string => {
  if (endSeconds) {
    return `${formatTime(startSeconds)}-${formatTime(endSeconds)}`;
  }
  return formatTime(startSeconds);
};

// 判断逻辑已移到Python后端，通过isUniversityRelated字段控制

const getStatusText = (status: string): string => {
  const texts: Record<string, string> = {
    UPLOADED: "待分析",
    ANALYZING: "分析中",
    COMPLETED: "已完成",
    FAILED: "失败",
  };
  return texts[status] || status;
};

const getStatusClass = (status: string): string => {
  const classes: Record<string, string> = {
    UPLOADED: "pending",
    ANALYZING: "processing",
    COMPLETED: "completed",
    FAILED: "failed",
  };
  return classes[status] || "pending";
};

const getRiskClass = (level: RiskLevel): string => {
  const classes: Record<RiskLevel, string> = {
    LOW: "risk-low",
    MEDIUM: "risk-medium",
    HIGH: "risk-high",
  };
  return classes[level] || "risk-medium";
};

const getRiskLevelText = (level: RiskLevel): string => {
  const texts: Record<RiskLevel, string> = {
    LOW: "低风险",
    MEDIUM: "中风险",
    HIGH: "高风险",
  };
  return texts[level] || "未知";
};

const getSentimentClass = (label: SentimentLabel): string => {
  const classes: Record<SentimentLabel, string> = {
    POSITIVE: "success",
    NEUTRAL: "primary",
    NEGATIVE: "danger",
  };
  return classes[label] || "primary";
};

const getSentimentTextForAPI = (label: SentimentLabel): string => {
  const texts: Record<SentimentLabel, string> = {
    POSITIVE: "积极",
    NEUTRAL: "中性",
    NEGATIVE: "消极",
  };
  return texts[label] || "未知";
};

// 所有业务逻辑判断已移到Python后端

// 情感风险样式
const getSentimentRiskClass = (label: SentimentLabel): string => {
  const classes: Record<SentimentLabel, string> = {
    POSITIVE: "text-success",
    NEUTRAL: "text-muted",
    NEGATIVE: "text-danger",
  };
  return classes[label] || "text-muted";
};

// 词云样式（根据权重和索引）
const getWordStyle = (value: number, index: number) => {
  const maxSize = 32;
  const minSize = 12;
  const size = minSize + (maxSize - minSize) * (value / 1000);

  const colors = [
    "#4b70e2",
    "#7c9df7",
    "#a3bef9",
    "#6b8be8",
    "#8ba3e8",
    "#5a7fd6",
    "#91a9f5",
    "#7589d8",
  ];
  const color = colors[index % colors.length];

  return {
    fontSize: `${size}px`,
    color: color,
    opacity: 0.7 + value / 2000,
    margin: "8px",
    fontWeight: index < 5 ? "700" : "500",
  };
};

// 格式化时间戳
const formatTimestamp = (seconds: number): string => {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
};

// 获取词云数据（处理JSON字符串）
const getWordCloudData = (): Array<{ name: string; value: number }> => {
  const result = currentResult.value;
  if (!result) return [];

  try {
    // textFeatures可能是JSON字符串，需要解析
    const textFeatures = result.textFeatures;
    if (typeof textFeatures === "string") {
      const parsed = JSON.parse(textFeatures);
      return parsed.wordCloud || [];
    } else if (textFeatures && typeof textFeatures === "object") {
      return (textFeatures as any).wordCloud || [];
    }
    return [];
  } catch {
    return [];
  }
};

// 获取敏感词列表（处理JSON字符串）
const getSensitiveWords = (): Array<{ word: string; category: string }> => {
  const result = currentResult.value;
  if (!result) return [];

  try {
    const textFeatures = result.textFeatures;
    if (typeof textFeatures === "string") {
      const parsed = JSON.parse(textFeatures);
      return parsed.sensitiveWords || [];
    } else if (textFeatures && typeof textFeatures === "object") {
      return (textFeatures as any).sensitiveWords || [];
    }
    return [];
  } catch {
    return [];
  }
};

// 获取风险时间轴数据（处理JSON字符串）
const getRiskTimelineData = (): any => {
  const result = currentResult.value;
  if (!result) return null;

  try {
    const videoFeatures = result.videoFeatures;

    console.log("videoFeatures类型:", typeof videoFeatures);
    console.log("videoFeatures数据:", videoFeatures);

    let riskTimeline = null;

    if (typeof videoFeatures === "string") {
      const parsed = JSON.parse(videoFeatures);
      console.log("解析后的videoFeatures:", parsed);
      riskTimeline = parsed.riskTimeline;
    } else if (videoFeatures && typeof videoFeatures === "object") {
      riskTimeline = (videoFeatures as any).riskTimeline;
    }

    console.log("riskTimeline数据:", riskTimeline);

    // 如果没有数据，生成示例数据用于测试
    if (
      !riskTimeline ||
      !riskTimeline.timeSeriesData ||
      riskTimeline.timeSeriesData.length === 0
    ) {
      console.warn("风险时间轴数据为空，生成示例数据");
      const duration = videoDuration.value || 50;
      return generateMockRiskTimeline(duration);
    }

    return riskTimeline;
  } catch (e) {
    console.error("解析风险时间轴数据失败:", e);
    return null;
  }
};

// 生成模拟风险时间轴（临时测试用）
const generateMockRiskTimeline = (duration: number) => {
  const timeSeriesData = [];
  const riskPoints = [];

  for (let t = 0; t <= duration; t += 30) {
    const risk = 0.15 + Math.random() * 0.25;
    timeSeriesData.push({ time: t, risk: risk });

    if (Math.random() > 0.7 && risk > 0.3) {
      riskPoints.push({
        time: t,
        type: "内容特征",
        level: "medium",
        description: "检测到内容特征波动",
        riskScore: risk,
      });
    }
  }

  return { timeSeriesData, riskPoints, duration };
};

// 时间轴点击事件 - 跳转播放
// 图表容器点击处理（支持点击任意位置跳转）
const onChartContainerClick = (event: MouseEvent) => {
  if (viewMode.value !== "interactive") return;

  const target = event.currentTarget as HTMLElement;
  if (!target) return;

  // 计算点击位置相对于容器的百分比
  const rect = target.getBoundingClientRect();
  const clickX = event.clientX - rect.left;
  const containerWidth = rect.width;
  const percentage = clickX / containerWidth;

  // 转换为视频时间（考虑grid的left/right padding）
  const gridLeft = 45; // 对应grid.left配置
  const gridRight = 22; // 对应grid.right配置
  const effectiveWidth = containerWidth - gridLeft - gridRight;
  const effectiveClickX = clickX - gridLeft;
  const actualPercentage = Math.max(
    0,
    Math.min(1, effectiveClickX / effectiveWidth),
  );

  const clickedTime = actualPercentage * videoDuration.value;

  // 跳转视频到点击的时间
  if (
    mainVideoPlayerRef.value &&
    clickedTime >= 0 &&
    clickedTime <= videoDuration.value
  ) {
    mainVideoPlayerRef.value.currentTime = clickedTime;
    mainVideoPlayerRef.value.play().catch((e) => console.log("播放失败:", e));

    // 【新逻辑】找到最接近的事件并更新选中状态
    if (timelineEvents.value.length > 0) {
      let nearestEvent = timelineEvents.value[0];
      let minDiff = Math.abs(timelineEvents.value[0].startTime - clickedTime);

      timelineEvents.value.forEach((event) => {
        const diff = Math.abs(event.startTime - clickedTime);
        if (diff < minDiff) {
          minDiff = diff;
          nearestEvent = event;
        }
      });

      if (nearestEvent) {
        selectedEvidenceId.value = nearestEvent.id;
      }
    }
    // 跳转已完成，无需提示消息
  }
};

const onTimelineClick = (params: any) => {
  if (!params || !params.data) return;

  // 交互视图：V1.5 切换到最近的证据并跳转视频
  if (viewMode.value === "interactive") {
    const clickedTime = params.data[0] || params.value?.[0];
    if (clickedTime !== undefined) {
      // 直接跳转视频到点击的时间
      if (mainVideoPlayerRef.value) {
        mainVideoPlayerRef.value.currentTime = clickedTime;
        mainVideoPlayerRef.value
          .play()
          .catch((e) => console.log("播放失败:", e));
      }

      // 【新逻辑】找到最接近点击时间的事件，更新选中状态
      if (timelineEvents.value.length > 0) {
        let nearestEvent = timelineEvents.value[0];
        let minDiff = Math.abs(timelineEvents.value[0].startTime - clickedTime);

        timelineEvents.value.forEach((event) => {
          const diff = Math.abs(event.startTime - clickedTime);
          if (diff < minDiff) {
            minDiff = diff;
            nearestEvent = event;
          }
        });

        // 更新选中的事件ID（不触发selectEvidence，避免重复跳转）
        if (nearestEvent) {
          selectedEvidenceId.value = nearestEvent.id;
        }
      }

      // 跳转已完成，无需提示消息
    }
    return;
  }

  // 报告视图：原有逻辑
  const timelineData = getRiskTimelineData();
  if (!timelineData || !timelineData.timeSeriesData) return;

  const clickedTime = params.data[0];
  playVideo(clickedTime);
  // 报告视图跳转，无需提示消息
};

// 视频时间更新事件
const onVideoTimeUpdate = () => {
  if (!mainVideoPlayerRef.value) return;

  const newTime = mainVideoPlayerRef.value.currentTime;
  currentPlayTime.value = newTime;

  // 更新进度线（不影响tooltip）
  updateProgressLine(newTime);

  const currentTime = newTime;
  // 【新逻辑】从事件流中查找当前时间的事件
  const currentEventByTime = timelineEvents.value.find(
    (e) => currentTime >= e.startTime && currentTime < e.endTime,
  );

  if (
    currentEventByTime &&
    currentEventByTime.id !== selectedEvidenceId.value
  ) {
    selectedEvidenceId.value = currentEventByTime.id;
  }

  // 根据索引查找当前时间对应的风险点
  const currentIndex = Math.floor(currentTime / timeGranularity);
  const detection = mockVideoRisks.value[currentIndex];
  currentDetection.value = detection || null;
};

// 独立更新进度线（使用setOption局部更新，避免tooltip闪烁）
let progressLineUpdatePending = false;
const updateProgressLine = (time: number) => {
  if (!timelineChartRef.value || progressLineUpdatePending || time <= 0) return;

  progressLineUpdatePending = true;

  requestAnimationFrame(() => {
    if (!timelineChartRef.value) {
      progressLineUpdatePending = false;
      return;
    }

    const m = Math.floor(time / 60);
    const s = Math.floor(time % 60);
    const timeLabel = `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;

    // 只更新 series[3]（融合风险），避免覆盖 series[2] 的高/中/低风险系列
    timelineChartRef.value.setOption(
      {
        series: [
          {
            // series[3]: 融合风险 - 通过名称锁定，避免误伤
            name: "融合风险",
            markLine: {
              symbol: "none",
              animation: false,
              silent: true,
              data: [
                [
                  { coord: [time, 0], symbol: "none" },
                  {
                    coord: [time, 100],
                    symbol: "none",
                    lineStyle: {
                      color: "#ff4d4f",
                      width: 3,
                      type: "solid",
                      opacity: 0.9,
                      shadowBlur: 6,
                      shadowColor: "rgba(255, 77, 79, 0.3)",
                    },
                    label: {
                      show: true,
                      position: "insideStartTop",
                      formatter: timeLabel,
                      color: "#fff",
                      fontSize: 11,
                      fontWeight: "bold",
                      backgroundColor: "#ff4d4f",
                      padding: [4, 8],
                      borderRadius: 4,
                    },
                  },
                ],
              ],
            },
          },
        ],
      },
      { notMerge: false, lazyUpdate: false, silent: true },
    );

    progressLineUpdatePending = false;
  });
};

// ==================== CV视觉模态：精确计算视频显示区域（object-fit: contain） ====================
/**
 * 计算视频在 object-fit: contain 模式下的实际显示区域
 * 用于精确定位检测框，避免容器尺寸变化时检测框错位
 */
const calculateVideoDisplayArea = () => {
  const videoElement = mainVideoPlayerRef.value;
  if (!videoElement) {
    console.warn("[检测框定位] 视频元素不存在");
    return;
  }

  // 获取容器元素（video的父元素）
  const container = videoElement.parentElement;
  if (!container) {
    console.warn("[检测框定位] 容器元素不存在");
    return;
  }

  // 获取视频原始尺寸
  const videoWidth = videoElement.videoWidth;
  const videoHeight = videoElement.videoHeight;

  // 视频元数据未加载完成
  if (!videoWidth || !videoHeight) {
    console.warn(
      "[检测框定位] 视频元数据未加载，videoWidth:",
      videoWidth,
      "videoHeight:",
      videoHeight,
    );
    return;
  }

  // 获取容器实际尺寸
  const containerWidth = container.clientWidth;
  const containerHeight = container.clientHeight;

  // 容器尺寸异常
  if (!containerWidth || !containerHeight) {
    console.warn(
      "[检测框定位] 容器尺寸异常，containerWidth:",
      containerWidth,
      "containerHeight:",
      containerHeight,
    );
    return;
  }

  // 计算宽高比
  const videoRatio = videoWidth / videoHeight;
  const containerRatio = containerWidth / containerHeight;

  let displayWidth: number;
  let displayHeight: number;
  let offsetX: number;
  let offsetY: number;

  // 根据 object-fit: contain 规则计算实际显示区域
  if (videoRatio > containerRatio) {
    // 视频更宽 → 视频宽度填满容器，高度按比例缩放，上下有黑边
    displayWidth = containerWidth;
    displayHeight = containerWidth / videoRatio;
    offsetX = 0;
    offsetY = (containerHeight - displayHeight) / 2;
  } else {
    // 视频更高（或相等）→ 视频高度填满容器，宽度按比例缩放，左右有黑边（或无黑边）
    displayWidth = containerHeight * videoRatio;
    displayHeight = containerHeight;
    offsetX = (containerWidth - displayWidth) / 2;
    offsetY = 0;
  }

  // 更新响应式数据
  videoDisplayArea.value = {
    offsetX,
    offsetY,
    displayWidth,
    displayHeight,
    containerWidth,
    containerHeight,
  };

  console.log("[检测框定位] 计算完成:", {
    视频原始尺寸: `${videoWidth}x${videoHeight}`,
    容器尺寸: `${containerWidth}x${containerHeight}`,
    视频宽高比: videoRatio.toFixed(3),
    容器宽高比: containerRatio.toFixed(3),
    显示区域: `${displayWidth.toFixed(1)}x${displayHeight.toFixed(1)}`,
    偏移量: `(${offsetX.toFixed(1)}, ${offsetY.toFixed(1)})`,
  });
};

// 视频加载完成
const onVideoLoaded = () => {
  // 更新视频真实时长，确保图表时间轴与视频进度精确对齐
  if (mainVideoPlayerRef.value && mainVideoPlayerRef.value.duration) {
    videoDuration.value = mainVideoPlayerRef.value.duration;
  }

  // 计算视频显示区域（用于精确定位检测框）
  calculateVideoDisplayArea();

  // 【新逻辑】自动跳转到第一个高风险事件
  if (selectedEvidenceId.value) {
    const event = timelineEvents.value.find(
      (e) => e.id === selectedEvidenceId.value,
    );
    if (event && mainVideoPlayerRef.value) {
      mainVideoPlayerRef.value.currentTime = event.startTime;
    }
  }
};

// 跳转到指定时间（不显示提示消息，避免刷屏）
const jumpToTime = (time: number) => {
  if (mainVideoPlayerRef.value) {
    mainVideoPlayerRef.value.currentTime = time;
    mainVideoPlayerRef.value.play().catch((e) => console.log("播放失败:", e));
    // 视频已跳转，用户能看到，无需提示消息
  }
};

// 获取检测框样式（业界标准：支持分类颜色 + 精确定位）
const getDetectionBoxStyle = (detection: any) => {
  const box = detection.boundingBox;
  const color = DETECTION_COLORS[detection.type] || "#fff";
  const area = videoDisplayArea.value;

  // 如果视频显示区域尚未计算，返回默认样式（避免闪烁）
  if (
    !area.displayWidth ||
    !area.displayHeight ||
    !area.containerWidth ||
    !area.containerHeight
  ) {
    return {
      left: "0%",
      top: "0%",
      width: "0%",
      height: "0%",
      borderColor: color,
      "--detection-color": color,
      opacity: "0", // 隐藏未定位的检测框
    };
  }

  // ==================== 精确坐标转换 ====================
  // 步骤1：将检测框的百分比坐标转换为相对于视频内容的像素坐标
  const boxLeftInVideo = (box.x / 100) * area.displayWidth;
  const boxTopInVideo = (box.y / 100) * area.displayHeight;
  const boxWidthInVideo = (box.width / 100) * area.displayWidth;
  const boxHeightInVideo = (box.height / 100) * area.displayHeight;

  // 步骤2：加上视频在容器中的偏移量，得到相对于容器的像素坐标
  const boxLeftInContainer = area.offsetX + boxLeftInVideo;
  const boxTopInContainer = area.offsetY + boxTopInVideo;

  // 步骤3：转换为相对于容器的百分比坐标
  const leftPercent = (boxLeftInContainer / area.containerWidth) * 100;
  const topPercent = (boxTopInContainer / area.containerHeight) * 100;
  const widthPercent = (boxWidthInVideo / area.containerWidth) * 100;
  const heightPercent = (boxHeightInVideo / area.containerHeight) * 100;

  return {
    left: `${leftPercent}%`,
    top: `${topPercent}%`,
    width: `${widthPercent}%`,
    height: `${heightPercent}%`,
    borderColor: color,
    "--detection-color": color,
    opacity: "1",
  };
};

// 高亮关键词
const highlightKeywords = (text: string, keywords: string[]) => {
  if (!keywords || keywords.length === 0) return text;

  let result = text;
  keywords.forEach((keyword) => {
    const regex = new RegExp(keyword, "g");
    result = result.replace(
      regex,
      `<span class="risk-keyword">${keyword}</span>`,
    );
  });
  return result;
};

// ==================== V1.5 新增：证据选择逻辑 ====================
/**
 * 选择证据，切换左侧截图和高亮对应台词
 */
const selectEvidence = (evidenceId: string) => {
  selectedEvidenceId.value = evidenceId;

  // 【新逻辑】跳转视频到对应时间
  const event = timelineEvents.value.find((e) => e.id === evidenceId);
  if (event && mainVideoPlayerRef.value) {
    mainVideoPlayerRef.value.currentTime = event.startTime;
    mainVideoPlayerRef.value
      .play()
      .catch((e) => console.log("自动播放失败:", e));
  }
  // 已定位，无需提示消息
};

/**
 * 计算进度条宽度（基于真实视频播放进度）
 */
const getProgressWidth = (): string => {
  if (!mainVideoPlayerRef.value) return "0%";
  const duration = mainVideoPlayerRef.value.duration || 195;
  const current = mainVideoPlayerRef.value.currentTime || 0;
  const percentage = (current / duration) * 100;
  return `${Math.min(percentage, 100)}%`;
};

/**
 * 格式化当前播放时间
 */
const formatCurrentTime = (): string => {
  if (!mainVideoPlayerRef.value) return "00:00";
  const current = mainVideoPlayerRef.value.currentTime || 0;
  const m = Math.floor(current / 60);
  const s = Math.floor(current % 60);
  return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
};

/**
 * 格式化视频总时长
 */
const formatTotalDuration = (): string => {
  if (!mainVideoPlayerRef.value || !mainVideoPlayerRef.value.duration)
    return "03:15";
  const duration = mainVideoPlayerRef.value.duration;
  const m = Math.floor(duration / 60);
  const s = Math.floor(duration % 60);
  return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
};

// ==================== 绿圈实时分析栏：获取当前风险分 ====================
/**
 * 获取当前帧的综合风险分数（直接引用 comprehensiveRisks）
 */
const getCurrentRiskScore = (): number => {
  const currentTime = currentPlayTime.value;
  const comprehensiveRisks = mockComprehensiveRisksData.value;
  if (!comprehensiveRisks || comprehensiveRisks.length === 0) return 0;
  const index = Math.min(
    Math.floor(currentTime / timeGranularity.value),
    comprehensiveRisks.length - 1,
  );
  const riskPoint = comprehensiveRisks[index];
  return riskPoint?.intensity ? Math.round(riskPoint.intensity * 100) : 0; // 转为百分比
};

/**
 * 获取当前风险等级类名
 */
const getCurrentRiskClass = (): string => {
  const score = getCurrentRiskScore();
  if (score > 66.7) return "high";
  if (score >= 33.3) return "medium";
  return "low";
};

/**
 * 获取当前风险等级文字
 */
const getCurrentRiskLabel = (): string => {
  const score = getCurrentRiskScore();
  if (score >= 70) return "高风险";
  if (score >= 40) return "中风险";
  return "低风险";
};

// PDF导出状态
const exportingPdf = ref(false);

// 视频播放器引用
const videoPlayerRef = ref<HTMLVideoElement | null>(null);

/**
 * 导出报告为PDF（智能分页，避免截断内容）
 */
const exportToPdf = async () => {
  const result = props.analysisResult;
  if (!result) {
    ElMessage.warning("没有可导出的分析数据");
    return;
  }

  // 防止重复导出
  if (exportingPdf.value) {
    return;
  }

  exportingPdf.value = true;
  const loadingMsg = ElMessage.info({
    message: "正在生成PDF报告，请稍候...",
    duration: 0,
  });

  try {
    // 动态导入依赖
    const html2canvasModule = await import("html2canvas");
    const html2canvas = html2canvasModule.default;
    const jsPDFModule = await import("jspdf");
    const jsPDF = jsPDFModule.default || jsPDFModule.jsPDF;

    if (!html2canvas || !jsPDF) {
      throw new Error("PDF导出依赖加载失败");
    }

    // 获取报告容器和所有需要避免分页截断的区块
    const reportContainer = document.querySelector(
      ".report-container",
    ) as HTMLElement;
    if (!reportContainer) {
      throw new Error("无法获取报告内容");
    }

    // 获取所有标记为避免分页的元素
    const avoidBreakElements = reportContainer.querySelectorAll(
      ".report-section, .dimension-card, .risk-peak-analysis, .portrait-item",
    );
    const breakPoints = new Set<number>();

    // 计算每个区块的边界位置
    const containerTop = reportContainer.offsetTop;
    avoidBreakElements.forEach((el) => {
      const htmlEl = el as HTMLElement;
      const top = htmlEl.offsetTop - containerTop;
      const bottom = top + htmlEl.offsetHeight;
      breakPoints.add(top);
      breakPoints.add(bottom);
    });

    // 使用 html2canvas 将内容渲染为图片
    const canvas = await html2canvas(reportContainer, {
      scale: 2, // 2倍保证清晰度
      useCORS: true,
      allowTaint: true,
      backgroundColor: "#ffffff",
      logging: false,
      width: reportContainer.scrollWidth,
      height: reportContainer.scrollHeight,
    });

    if (!canvas || canvas.width === 0 || canvas.height === 0) {
      throw new Error("无法生成报告图片");
    }

    const imgWidth = canvas.width;
    const imgHeight = canvas.height;

    // 创建 PDF (纵向, 毫米单位, A4纸张)
    const pdf = new jsPDF("p", "mm", "a4");
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    const margin = 10;
    const contentWidth = pageWidth - margin * 2;
    const availableHeight = pageHeight - margin * 2;

    // 计算图片在PDF中的缩放比例和尺寸
    const ratio = contentWidth / imgWidth;
    const scaledHeight = imgHeight * ratio;

    // 将breakPoints转换为canvas像素坐标并排序
    const sortedBreakPoints = Array.from(breakPoints)
      .map((bp) => bp * 2) // scale=2，所以要乘2
      .sort((a, b) => a - b);

    // 智能分页处理
    let currentPage = 0;
    let sourceY = 0;
    let pageContentHeight = 0;

    // 查找最接近但不超过目标高度的分页点
    const findBestBreakPoint = (currentY: number, maxHeight: number) => {
      const targetY = currentY + maxHeight;
      // 找到小于targetY但最接近的breakPoint
      let bestPoint = targetY;
      for (let i = sortedBreakPoints.length - 1; i >= 0; i--) {
        const bp = sortedBreakPoints[i];
        if (bp > currentY && bp <= targetY) {
          // 检查这个分页点会不会太小（至少要有一半页面内容）
          if (bp - currentY >= maxHeight * 0.4) {
            bestPoint = bp;
            break;
          }
        }
      }
      return bestPoint;
    };

    while (sourceY < imgHeight) {
      const remainingHeight = imgHeight - sourceY;
      const maxSourceHeight = availableHeight / ratio;

      let actualSourceHeight: number;
      if (remainingHeight <= maxSourceHeight) {
        // 最后一页，直接用剩余高度
        actualSourceHeight = remainingHeight;
      } else {
        // 查找最佳分页点
        const bestBreakY = findBestBreakPoint(sourceY, maxSourceHeight);
        actualSourceHeight = Math.min(bestBreakY - sourceY, remainingHeight);
      }

      const actualPdfHeight = actualSourceHeight * ratio;

      // 创建临时画布来裁剪当前页的内容
      const tempCanvas = document.createElement("canvas");
      tempCanvas.width = imgWidth;
      tempCanvas.height = actualSourceHeight;
      const ctx = tempCanvas.getContext("2d");

      if (!ctx) {
        throw new Error("无法创建画布上下文");
      }

      // 从原canvas中裁剪当前页的内容
      ctx.drawImage(
        canvas,
        0,
        sourceY,
        imgWidth,
        actualSourceHeight,
        0,
        0,
        imgWidth,
        actualSourceHeight,
      );

      // 将裁剪后的内容添加到PDF（使用JPEG格式，0.85质量平衡清晰度和大小）
      const tempImgData = tempCanvas.toDataURL("image/jpeg", 0.85);

      // 如果不是第一页，先添加新页
      if (currentPage > 0) {
        pdf.addPage();
      }

      pdf.addImage(
        tempImgData,
        "JPEG",
        margin,
        margin,
        contentWidth,
        actualPdfHeight,
      );

      // 更新位置
      sourceY += actualSourceHeight;
      currentPage++;

      // 避免无限循环
      if (actualSourceHeight < 1) {
        break;
      }
    }

    // 生成文件名
    const dateStr = new Date()
      .toLocaleDateString("zh-CN", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
      })
      .replace(/\//g, "-");

    const result = currentResult.value;
    const safeTitle = (result?.videoInfo.fileName || "视频")
      .replace(/[<>:"/\\|?*]/g, "_")
      .substring(0, 50);

    const fileName = `分析报告_${safeTitle}_${dateStr}.pdf`;

    // 保存PDF文件
    pdf.save(fileName);

    loadingMsg.close();
    ElMessage.success("PDF报告导出成功！");
  } catch (error: any) {
    console.error("PDF导出失败:", error);
    loadingMsg.close();
    let errorMessage: string = error?.message || "";
    // 将英文浏览器错误翻译为中文
    if (!errorMessage || /failed to fetch/i.test(errorMessage) || /network/i.test(errorMessage)) {
      errorMessage = "网络错误，PDF导出失败，请检查网络连接后重试";
    } else if (/timeout/i.test(errorMessage)) {
      errorMessage = "请求超时，PDF导出失败，请稍后重试";
    } else if (/memory/i.test(errorMessage) || /out of/i.test(errorMessage)) {
      errorMessage = "内存不足，请尝试关闭其他标签页后重试";
    } else if (!/[\u4e00-\u9fa5]/.test(errorMessage)) {
      // 如果错误信息中没有中文，统一替换
      errorMessage = "PDF导出失败，请稍后重试";
    }
    ElMessage.error(errorMessage);
  } finally {
    exportingPdf.value = false;
  }
};

// 监听 viewMode 变化，控制父容器的 padding-bottom
const updateContainerPadding = () => {
  const mainContent = document.querySelector(".main-content");
  if (mainContent) {
    // 只有在交互模式时才移除左padding
    if (viewMode.value === "interactive") {
      mainContent.classList.add("interactive-mode-no-padding");
    } else {
      mainContent.classList.remove("interactive-mode-no-padding");
    }
  }
};

watch(viewMode, () => {
  updateContainerPadding();
});

// ==================== 【智能跟随滚动】核心逻辑 ====================

/**
 * 重心居中定位算法
 * 将当前激活的事件居中显示在列表容器中
 */
const scrollToActiveEvents = () => {
  if (!isSyncActive.value) return;
  if (!timelineEventsListRef.value) return;

  const container = timelineEventsListRef.value;
  const activeElements = container.querySelectorAll(
    ".timeline-event-item.is-active",
  );

  if (activeElements.length === 0) return;

  // 标记为内部滚动（防止误触发用户介入）
  isInternalScrolling.value = true;

  // 使用 requestAnimationFrame 确保平滑滚动
  requestAnimationFrame(() => {
    const containerRect = container.getBoundingClientRect();
    const containerCenter = containerRect.height / 2;

    let targetScrollTop: number;

    if (activeElements.length === 1) {
      // 单项激活：将该项垂直中心与容器中心对齐
      const activeRect = activeElements[0].getBoundingClientRect();
      const activeCenter =
        activeRect.top -
        containerRect.top +
        container.scrollTop +
        activeRect.height / 2;
      targetScrollTop = activeCenter - containerCenter;
    } else {
      // 多项激活：计算包围盒中心
      const firstRect = activeElements[0].getBoundingClientRect();
      const lastRect =
        activeElements[activeElements.length - 1].getBoundingClientRect();

      const boundingBoxTop =
        firstRect.top - containerRect.top + container.scrollTop;
      const boundingBoxBottom =
        lastRect.bottom - containerRect.top + container.scrollTop;
      const boundingBoxCenter = (boundingBoxTop + boundingBoxBottom) / 2;

      targetScrollTop = boundingBoxCenter - containerCenter;
    }

    // 边界检查
    const maxScroll = container.scrollHeight - container.clientHeight;
    targetScrollTop = Math.max(0, Math.min(targetScrollTop, maxScroll));

    // 执行平滑滚动
    container.scrollTo({
      top: targetScrollTop,
      behavior: "smooth",
    });

    // 滚动结束后清除内部滚动标记（延迟500ms，等待滚动动画完成）
    setTimeout(() => {
      isInternalScrolling.value = false;
    }, 500);
  });
};

/**
 * 监听活跃事件 ID 集合变化（Efficiency First）
 * 只有当活跃事件发生变更时才触发滚动
 */
watch(activeEventIds, (newIds, oldIds) => {
  if (newIds !== oldIds && isSyncActive.value) {
    scrollToActiveEvents();
  }
});

/**
 * 用户主动介入检测（Interaction Lock）
 * 检测到用户滚轮或触摸事件时暂停自动同步
 */
const handleUserScroll = (event: Event) => {
  // 如果是内部滚动触发的，忽略
  if (isInternalScrolling.value) return;

  // 判定为用户主动介入，暂停同步
  if (isSyncActive.value) {
    isSyncActive.value = false;
  }
};

/**
 * 恢复自动同步
 */
const resumeSync = () => {
  isSyncActive.value = true;
  // 立即执行一次居中滚动
  scrollToActiveEvents();
};

// 字幕自动滚动函数（提取为独立函数，多处复用）
const scrollToActiveSubtitle = () => {
  if (!selectedEvidenceId.value) return;

  nextTick(() => {
    // 找到字幕容器和当前高亮的字幕元素
    const transcriptContainer = document.querySelector(".transcript-list");
    const activeSegment = document.querySelector(".transcript-segment.active");

    if (transcriptContainer && activeSegment) {
      // 计算滚动位置，使当前字幕居中
      const containerRect = transcriptContainer.getBoundingClientRect();
      const segmentRect = activeSegment.getBoundingClientRect();

      // 计算目标 scrollTop：将字幕滚动到容器中央
      const containerScrollTop = transcriptContainer.scrollTop;
      const segmentOffsetTop = segmentRect.top - containerRect.top;
      const targetScrollTop =
        containerScrollTop +
        segmentOffsetTop -
        containerRect.height / 2 +
        segmentRect.height / 2;

      // 平滑滚动到目标位置
      transcriptContainer.scrollTo({
        top: targetScrollTop,
        behavior: "smooth",
      });
    }
  });
};

// 监听字幕切换，自动滚动到当前字幕（歌词滚动效果）
watch(selectedEvidenceId, () => {
  scrollToActiveSubtitle();
});

// 监听文本证据数据变化，更新tooltip位置
watch(
  textEvidences,
  () => {
    updateTextEvidenceTooltipPosition();
  },
  { flush: "post" },
);

// 【废弃】旧的字幕活跃状态监听 - 已不需要

// 雷达图渲染完成事件处理
const onRadarChartFinished = () => {
  // 如果鼠标在雷达图上，在渲染完成后立即触发 tooltip
  if (isMouseOnRadar.value && radarChartRef.value) {
    // 使用 setTimeout 确保在下一个事件循环中执行
    setTimeout(() => {
      try {
        // 获取 ECharts 实例
        const chartInstance =
          (radarChartRef.value as any)?.$refs?.chart ||
          (radarChartRef.value as any)?.chart ||
          (radarChartRef.value as any);

        if (
          chartInstance &&
          typeof chartInstance.dispatchAction === "function"
        ) {
          chartInstance.dispatchAction({
            type: "showTip",
            seriesIndex: 0,
            dataIndex: 0,
          });
        }
      } catch (e) {
        console.warn("触发tooltip失败:", e);
      }
    }, 10);
  }
};

// 检测文本证据元素的边界位置，动态添加类名
const updateTextEvidenceTooltipPosition = () => {
  nextTick(() => {
    const items = document.querySelectorAll(".text-evidence-item-inline");
    if (items.length === 0) return;

    // 清除所有现有的位置类名
    items.forEach((item) => {
      item.classList.remove("tooltip-left", "tooltip-right", "tooltip-center");
    });

    // 检测每一行的元素
    let rowItems: Element[] = [];

    items.forEach((item, index) => {
      const rect = item.getBoundingClientRect();

      // 如果是新的一行（top值不同），处理上一行的元素
      if (
        rowItems.length > 0 &&
        Math.abs(rect.top - rowItems[0].getBoundingClientRect().top) > 5
      ) {
        // 处理上一行：第一个元素左对齐，最后一个元素右对齐
        if (rowItems.length > 0) {
          rowItems[0].classList.add("tooltip-left");
        }
        if (rowItems.length > 1) {
          rowItems[rowItems.length - 1].classList.add("tooltip-right");
        }
        // 清空当前行
        rowItems = [];
      }

      // 将当前元素加入当前行
      rowItems.push(item);

      // 如果是最后一个元素，处理当前行
      if (index === items.length - 1) {
        if (rowItems.length > 0) {
          rowItems[0].classList.add("tooltip-left");
        }
        if (rowItems.length > 1) {
          rowItems[rowItems.length - 1].classList.add("tooltip-right");
        }
      }
    });
  });
};

// 图表resize处理函数
const handleChartResize = () => {
  // 调用ECharts实例的resize方法，让图表响应尺寸变化
  if (
    timelineChartRef.value &&
    typeof timelineChartRef.value.resize === "function"
  ) {
    timelineChartRef.value.resize();
  }

  // 同时重新计算视频显示区域，确保检测框位置正确
  calculateVideoDisplayArea();

  // 重新计算文本证据tooltip位置
  updateTextEvidenceTooltipPosition();
};

onMounted(() => {
  // 初始化组件数据
  initializeComponent();

  // 初始化主题并监听 data-theme 变化
  syncThemeState();
  themeObserver = new MutationObserver(() => {
    syncThemeState();
  });
  themeObserver.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ["data-theme", "class"],
  });
  if (document.body) {
    themeObserver.observe(document.body, {
      attributes: true,
      attributeFilter: ["data-theme", "class"],
    });
  }

  // 立即调用一次，确保初始状态正确
  updateContainerPadding();

  // 等待 DOM 和布局稳定后，主动 resize 图表，修复初始渲染时宽度不正确的问题
  // 分多个时间点触发，确保各阶段布局（flex、过渡动画等）都能被捕获
  nextTick(() => {
    handleChartResize();
    setTimeout(() => handleChartResize(), 100);
    setTimeout(() => handleChartResize(), 300);
    setTimeout(() => handleChartResize(), 600);
  });

  // 添加窗口resize监听（浏览器窗口大小变化）
  window.addEventListener("resize", handleChartResize);

  // 【智能跟随】监听容器高度变化，自适应重新计算
  window.addEventListener("resize", () => {
    if (isSyncActive.value && activeTimelineEvents.value.length > 0) {
      scrollToActiveEvents();
    }
  });

  // 监听整个页面容器的宽度变化（捕获侧边栏收起/展开）
  if (analysisPageRef.value) {
    pageResizeObserver = new ResizeObserver(() => {
      // 页面宽度变化时，延迟调用图表resize，等待CSS过渡动画完成
      setTimeout(() => {
        handleChartResize();
      }, 350);
    });

    pageResizeObserver.observe(analysisPageRef.value);
  }

  // 监听图表父容器尺寸变化，精准修复初始渲染及任何布局变化导致的图表宽度偏差
  nextTick(() => {
    const chartContainer = timelineChartRef.value?.$el?.parentElement;
    if (chartContainer) {
      chartContainerResizeObserver = new ResizeObserver(() => {
        handleChartResize();
      });
      chartContainerResizeObserver.observe(chartContainer);
    }
  });

  // ==================== CV视觉模态：监听视频播放器容器尺寸变化 ====================
  // 当容器尺寸变化时（浏览器缩放、侧边栏收缩等），重新计算检测框位置
  if (mainVideoPlayerRef.value && mainVideoPlayerRef.value.parentElement) {
    videoResizeObserver = new ResizeObserver(() => {
      // 使用防抖，避免频繁计算
      setTimeout(() => {
        calculateVideoDisplayArea();
      }, 100);
    });

    videoResizeObserver.observe(mainVideoPlayerRef.value.parentElement);
  }

  // 初始化容器 padding 控制
  updateContainerPadding();
});

// 组件卸载时清理监听器
onUnmounted(() => {
  window.removeEventListener("resize", handleChartResize);

  if (themeObserver) {
    themeObserver.disconnect();
    themeObserver = null;
  }

  if (pageResizeObserver) {
    pageResizeObserver.disconnect();
    pageResizeObserver = null;
  }

  if (chartContainerResizeObserver) {
    chartContainerResizeObserver.disconnect();
    chartContainerResizeObserver = null;
  }

  // 清理视频播放器 ResizeObserver
  if (videoResizeObserver) {
    videoResizeObserver.disconnect();
    videoResizeObserver = null;
  }

  // 清理容器 padding 控制
  const mainContent = document.querySelector(".main-content");
  if (mainContent) {
    mainContent.classList.remove("interactive-mode-no-padding");
  }
});

// ==================== 暴露给父组件的方法 ====================
defineExpose({
  exportToPdf,
});
</script>

<style scoped lang="scss">
// 新拟态配色变量（接入全局主题变量）
$bg: var(--bg-page);
$neu-1: var(--bg-card);
$neu-2: var(--border-color);
$white: var(--bg-card);
$gray: var(--text-secondary);
$black: var(--text-primary);
$purple: #409eff;

// 全局图标向下微调0.5px，改善视觉对齐
.el-icon {
  position: relative;
  top: 0.5px;
}

.analysis-content-wrapper {
  .header-actions {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 16px;
    transition: margin-left 0.3s ease;

    .page-title {
      font-size: 22px;
      font-weight: 700;
      margin: 0;
      color: $black;
    }

    .header-actions-right {
      display: flex;
      align-items: center;
      gap: 16px;
    }

    .global-stats-header {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 8px 16px;
      background: $neu-1;
      border-radius: 12px;
      box-shadow:
        2px 2px 6px $neu-2,
        -2px -2px 6px $white;

      .stat-item-header {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 2px;

        .stat-label-header {
          font-size: 11px;
          color: $gray;
          white-space: nowrap;
        }

        .stat-value-header {
          font-size: 16px;
          font-weight: 700;
          color: $black;
          white-space: nowrap;

          &.risk-high {
            color: #f56c6c;
          }
        }
      }

      .stat-divider {
        width: 1px;
        height: 30px;
        background: linear-gradient(180deg, transparent, $neu-2, transparent);
      }
    }

    .view-mode-toggle {
      display: flex;
      gap: 8px;
      padding: 4px;
      background: $neu-1;
      border-radius: 12px;
      box-shadow:
        inset 2px 2px 4px $neu-2,
        inset -2px -2px 4px $white;

      .neu-btn {
        background: $neu-1;
        border: none;
        border-radius: 12px;
        cursor: pointer;
        transition: all 0.25s;
        box-shadow:
          4px 4px 8px $neu-2,
          -4px -4px 8px $white;
        color: $gray;
        font-family: "Montserrat", sans-serif;
        padding: 12px 24px;
        font-size: 14px;
        display: flex;
        align-items: center;
        gap: 8px;

        &:hover {
          box-shadow:
            2px 2px 4px $neu-2,
            -2px -2px 4px $white;
          color: $purple;
        }

        &:active {
          box-shadow:
            inset 2px 2px 4px $neu-2,
            inset -2px -2px 4px $white;
        }

        &.primary-btn {
          background: linear-gradient(135deg, $purple 0%, #7c9df7 100%);
          color: #fff;

          &:hover {
            box-shadow:
              4px 4px 8px $neu-2,
              -2px -2px 6px $white;
            color: #fff;
          }
        }
      }
    }

    .video-selector-btn {
      display: flex;
      align-items: center;
      gap: 8px;
    }
  }

  // 交互模式专属样式
  &.view-mode-interactive {
    .header-actions {
      margin-left: 20px;
    }
  }

  // 视频选择侧边栏
  .video-drawer-overlay {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0);
    z-index: 998;
    pointer-events: none;
    transition: background 0.3s cubic-bezier(0.4, 0, 0.2, 1);

    &.active {
      background: rgba(0, 0, 0, 0.5);
      backdrop-filter: blur(4px);
      pointer-events: all;
    }
  }

  .video-drawer {
    position: fixed;
    top: 0;
    right: -420px;
    width: 400px;
    height: 100vh;
    background: linear-gradient(145deg, #f5f7fa, #e8ecef);
    box-shadow:
      -8px 0 24px rgba(0, 0, 0, 0.15),
      -4px 0 12px rgba(0, 0, 0, 0.1);
    z-index: 999;
    transition: right 0.4s cubic-bezier(0.4, 0, 0.2, 1);
    display: flex;
    flex-direction: column;
    overflow: hidden;

    &.active {
      right: 0;
    }

    .drawer-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 20px 24px;
      border-bottom: 1px solid rgba(209, 217, 230, 0.5);
      background: rgba(255, 255, 255, 0.5);
      backdrop-filter: blur(10px);

      h3 {
        margin: 0;
        font-size: 18px;
        font-weight: 700;
        color: $black;
      }

      .close-btn {
        display: flex;
        align-items: center;
        justify-content: center;
        width: 36px;
        height: 36px;
        border: none;
        border-radius: 10px;
        background: $neu-1;
        color: $gray;
        cursor: pointer;
        transition: all 0.25s ease;
        box-shadow:
          3px 3px 6px rgba(163, 177, 198, 0.4),
          -3px -3px 6px rgba(255, 255, 255, 0.9);

        .el-icon {
          font-size: 18px;
        }

        &:hover {
          color: $purple;
          transform: rotate(90deg);
        }

        &:active {
          box-shadow:
            inset 3px 3px 6px rgba(163, 177, 198, 0.5),
            inset -3px -3px 6px rgba(255, 255, 255, 0.8);
        }
      }
    }

    .drawer-content {
      flex: 1;
      overflow-y: auto;
      padding: 16px;

      &::-webkit-scrollbar {
        width: 6px;
      }

      &::-webkit-scrollbar-track {
        background: transparent;
      }

      &::-webkit-scrollbar-thumb {
        background: rgba(160, 165, 168, 0.3);
        border-radius: 3px;

        &:hover {
          background: rgba(160, 165, 168, 0.5);
        }
      }
    }

    .video-list-container {
      display: flex;
      flex-direction: column;
      gap: 12px;
    }

    .video-item {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 16px;
      border-radius: 16px;
      background: $neu-1;
      cursor: pointer;
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      box-shadow:
        4px 4px 8px rgba(163, 177, 198, 0.3),
        -4px -4px 8px rgba(255, 255, 255, 0.9);
      border: 2px solid transparent;

      .video-item-icon {
        display: flex;
        align-items: center;
        justify-content: center;
        width: 40px;
        height: 40px;
        border-radius: 12px;
        background: linear-gradient(135deg, $purple, #6b8be8);
        color: white;
        flex-shrink: 0;
        box-shadow:
          0 4px 12px rgba(75, 112, 226, 0.3),
          inset 0 1px 2px rgba(255, 255, 255, 0.2);
      }

      .video-item-info {
        flex: 1;
        min-width: 0;

        .video-item-title {
          font-size: 14px;
          font-weight: 600;
          color: $black;
          margin-bottom: 4px;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .video-item-meta {
          font-size: 12px;
          color: $gray;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
      }

      .video-item-status {
        flex-shrink: 0;

        .status-badge {
          padding: 4px 10px;
          border-radius: 12px;
          font-size: 11px;
          font-weight: 500;

          &.pending {
            background: rgba(144, 147, 153, 0.15);
            color: var(--text-tertiary);
          }

          &.processing {
            background: rgba(230, 162, 60, 0.15);
            color: #e6a23c;
          }

          &.completed {
            background: rgba(103, 194, 58, 0.15);
            color: #67c23a;
          }

          &.failed {
            background: rgba(245, 108, 108, 0.15);
            color: #f56c6c;
          }
        }
      }

      &:hover {
        transform: translateX(-4px);
        border-color: rgba($purple, 0.3);
        box-shadow:
          6px 6px 12px rgba(163, 177, 198, 0.4),
          -6px -6px 12px rgba(255, 255, 255, 1),
          0 0 0 3px rgba($purple, 0.1);
      }

      &.active {
        background: linear-gradient(
          135deg,
          rgba($purple, 0.1),
          rgba(107, 139, 232, 0.05)
        );
        border-color: $purple;
        box-shadow:
          inset 2px 2px 4px rgba(0, 0, 0, 0.05),
          0 6px 16px rgba(75, 112, 226, 0.2),
          0 0 0 2px rgba($purple, 0.15);

        .video-item-icon {
          box-shadow:
            0 6px 16px rgba(75, 112, 226, 0.4),
            inset 0 1px 2px rgba(255, 255, 255, 0.3);
        }
      }

      &:active {
        transform: translateX(-2px) scale(0.98);
      }
    }

    .empty-video-list {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 60px 20px;
      text-align: center;
      color: $gray;

      .el-icon {
        margin-bottom: 16px;
        opacity: 0.5;
      }

      p {
        margin: 0 0 20px 0;
        font-size: 14px;
      }
    }
  }
}

// 视频信息栏
.video-info-bar {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 18px 24px;
  background: $neu-1;
  border-radius: 16px;
  box-shadow:
    6px 6px 12px $neu-2,
    -6px -6px 12px $white;
  margin-bottom: 24px;

  .video-icon {
    width: 48px;
    height: 48px;
    border-radius: 12px;
    background: linear-gradient(135deg, $purple 0%, #7c9df7 100%);
    display: flex;
    align-items: center;
    justify-content: center;
    color: #fff;
  }

  .video-details {
    flex: 1;

    .video-title-row {
      display: flex;
      align-items: center;
      gap: 16px;
      flex-wrap: wrap;

      .video-title {
        font-size: 16px;
        font-weight: 600;
        color: $black;
      }

      .video-meta {
        font-size: 13px;
        color: $gray;
      }
    }

    .video-description {
      margin-top: 8px;
      font-size: 13px;
      color: $gray;
      line-height: 1.5;
    }
  }
}

// 新拟态卡片
.neu-card {
  background: $neu-1;
  border-radius: 20px;
  box-shadow:
    8px 8px 16px $neu-2,
    -8px -8px 16px $white;
  overflow: hidden;

  .card-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 18px 24px;
    border-bottom: 1px solid rgba($neu-2, 0.5);

    .card-title {
      font-size: 15px;
      font-weight: 600;
      color: $black;
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .predict-badge-small {
      display: inline-flex;
      align-items: center;
      padding: 2px 8px;
      font-size: 11px;
      font-weight: 500;
      color: var(--text-tertiary);
      background: var(--bg-hover);
      border-radius: 4px;
      border: 1px solid var(--border-color);
    }
  }

  .chart {
    height: 280px;
    width: 100%;
    padding: 16px;
  }
}

.neu-btn {
  background: $neu-1;
  border: none;
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.25s;
  box-shadow:
    4px 4px 8px $neu-2,
    -4px -4px 8px $white;
  color: $gray;
  font-family: "Montserrat", sans-serif;
  padding: 12px 24px;
  font-size: 14px;
  display: flex;
  align-items: center;
  gap: 8px;

  &:hover {
    box-shadow:
      2px 2px 4px $neu-2,
      -2px -2px 4px $white;
    color: $purple;
  }

  &:active {
    box-shadow:
      inset 2px 2px 4px $neu-2,
      inset -2px -2px 4px $white;
  }

  &.primary-btn {
    background: linear-gradient(135deg, $purple 0%, #7c9df7 100%);
    color: #fff;

    &:hover {
      box-shadow:
        4px 4px 8px $neu-2,
        -2px -2px 6px $white;
      color: #fff;
    }
  }
}

// 空状态
.empty-card {
  .empty-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 64px 20px;

    .empty-icon {
      width: 100px;
      height: 100px;
      border-radius: 50%;
      background: $neu-1;
      box-shadow:
        8px 8px 16px $neu-2,
        -8px -8px 16px $white;
      display: flex;
      align-items: center;
      justify-content: center;
      color: $gray;
      margin-bottom: 24px;
    }

    h3 {
      font-size: 18px;
      font-weight: 600;
      color: $black;
      margin: 0 0 10px;
    }

    p {
      font-size: 14px;
      color: $gray;
      margin: 0 0 28px;
    }
  }
}

// 风险卡片网格
.risk-cards-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 20px;
  margin-bottom: 24px;

  @media (max-width: 1200px) {
    grid-template-columns: repeat(2, 1fr);
  }

  @media (max-width: 600px) {
    grid-template-columns: 1fr;
  }

  .risk-card {
    display: flex;
    align-items: center;
    gap: 18px;
    padding: 24px;

    &.risk-low {
      border-left: 4px solid #52c41a;
      .risk-icon {
        background: rgba(82, 196, 26, 0.12);
        color: #52c41a;
      }
      .risk-level {
        color: #52c41a;
      }
    }

    &.risk-medium {
      border-left: 4px solid #faad14;
      .risk-icon {
        background: rgba(250, 173, 20, 0.12);
        color: #faad14;
      }
      .risk-level {
        color: #faad14;
      }
    }

    &.risk-high {
      border-left: 4px solid #f56c6c;
      .risk-icon {
        background: rgba(245, 108, 108, 0.12);
        color: #f56c6c;
      }
      .risk-level {
        color: #f56c6c;
      }
    }

    .risk-icon {
      width: 52px;
      height: 52px;
      border-radius: 14px;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }

    .risk-info {
      flex: 1;

      .risk-score {
        font-size: 28px;
        font-weight: 700;
        color: $black;
        line-height: 1;
      }

      .risk-label {
        font-size: 12px;
        color: $gray;
        margin-top: 4px;
      }

      .risk-level {
        font-size: 14px;
        font-weight: 600;
        margin-top: 6px;
      }
    }
  }

  .stat-card {
    display: flex;
    align-items: center;
    gap: 18px;
    padding: 24px;

    .stat-icon {
      width: 52px;
      height: 52px;
      border-radius: 14px;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;

      &.primary {
        background: rgba($purple, 0.12);
        color: $purple;
      }

      &.success {
        background: rgba(82, 196, 26, 0.12);
        color: #52c41a;
      }

      &.warning {
        background: rgba(250, 173, 20, 0.12);
        color: #faad14;
      }

      &.danger {
        background: rgba(245, 108, 108, 0.12);
        color: #f56c6c;
      }
    }

    .stat-info {
      flex: 1;

      .stat-value {
        font-size: 20px;
        font-weight: 700;
        color: $black;
      }

      .stat-label {
        font-size: 12px;
        color: $gray;
        margin-top: 4px;
      }

      .stat-detail {
        font-size: 11px;
        color: $gray;
        margin-top: 4px;
      }
    }
  }
}

// 图表网格
.charts-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 24px;
  margin-bottom: 24px;

  @media (max-width: 900px) {
    grid-template-columns: 1fr;
  }
}

// 详情网格 - 三模态平级展示
.details-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 24px;
  margin-bottom: 24px;

  @media (max-width: 1200px) {
    grid-template-columns: repeat(2, 1fr);
  }

  @media (max-width: 768px) {
    grid-template-columns: 1fr;
  }

  .feature-details {
    padding: 20px 24px;

    .feature-item {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      padding: 14px 0;
      border-bottom: 1px solid rgba($neu-2, 0.5);

      &:last-child {
        border-bottom: none;
      }

      &.full {
        flex-direction: column;
        gap: 10px;
      }

      .feature-label {
        font-size: 13px;
        color: $gray;
        font-weight: 500;
      }

      .feature-value {
        font-size: 14px;
        color: $black;
        font-weight: 600;
        text-align: right;

        &.transcription {
          text-align: left;
          line-height: 1.7;
          background: $neu-1;
          padding: 12px 16px;
          border-radius: 12px;
          box-shadow:
            inset 2px 2px 4px $neu-2,
            inset -2px -2px 4px $white;
          width: 100%;
        }

        &.keywords-inline {
          display: flex;
          flex-wrap: wrap;
          gap: 6px;
          text-align: left;

          .keyword-tag-small {
            padding: 4px 10px;
            border-radius: 12px;
            font-size: 11px;
            font-weight: 500;
            background: $neu-1;
            color: $gray;
            box-shadow:
              2px 2px 4px $neu-2,
              -2px -2px 4px $white;

            &.primary {
              background: linear-gradient(135deg, $purple 0%, #7c9df7 100%);
              color: #fff;
              box-shadow:
                2px 2px 6px $neu-2,
                -1px -1px 4px $white;
            }
          }
        }
      }
    }
  }

  .empty-feature {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 48px 20px;
    color: $gray;
    gap: 12px;

    span {
      font-size: 13px;
    }
  }
}

// 关键词卡片
.keywords-card {
  margin-bottom: 24px;

  .keywords-content {
    padding: 24px;
    display: flex;
    flex-wrap: wrap;
    gap: 10px;

    .keyword-tag {
      padding: 8px 16px;
      border-radius: 20px;
      font-size: 13px;
      font-weight: 500;
      background: $neu-1;
      color: $gray;
      box-shadow:
        3px 3px 6px $neu-2,
        -3px -3px 6px $white;

      &.primary {
        background: linear-gradient(135deg, $purple 0%, #7c9df7 100%);
        color: #fff;
        box-shadow:
          3px 3px 8px $neu-2,
          -2px -2px 6px $white;
      }
    }
  }
}

// 受众分析卡片
.audience-card {
  margin-bottom: 24px;

  .card-subtitle {
    font-size: 11px;
    color: $gray;
    font-weight: 400;
    display: flex;
    align-items: center;
    gap: 6px;
    flex-wrap: wrap;
  }

  .audience-content {
    padding: 24px;

    .audience-stats {
      display: flex;
      gap: 24px;
      margin-bottom: 24px;

      @media (max-width: 768px) {
        flex-direction: column;
      }

      .stat-box {
        flex: 1;
        text-align: center;
        padding: 20px;
        background: $neu-1;
        border-radius: 16px;
        box-shadow:
          inset 2px 2px 4px $neu-2,
          inset -2px -2px 4px $white;

        .stat-number {
          font-size: 28px;
          font-weight: 700;
          color: $purple;
        }

        .stat-name {
          font-size: 13px;
          color: $black;
          margin-top: 6px;
          font-weight: 600;
        }

        .stat-hint {
          font-size: 11px;
          color: $gray;
          margin-top: 4px;
          line-height: 1.4;
        }
      }
    }

    .interests-section {
      h4 {
        font-size: 14px;
        font-weight: 600;
        color: $black;
        margin: 0 0 14px;
      }

      .interests-list {
        display: flex;
        flex-wrap: wrap;
        gap: 10px;

        .interest-tag {
          padding: 6px 14px;
          border-radius: 16px;
          font-size: 12px;
          background: rgba($purple, 0.1);
          color: $purple;
        }
      }
    }
  }
}

// 操作按钮
.action-buttons {
  display: flex;
  gap: 16px;
  justify-content: center;
  padding-top: 8px;
}

// 文本颜色类
.text-success {
  color: #52c41a;
  font-weight: 600;
}

.text-danger {
  color: #f56c6c;
  font-weight: 600;
}

.text-warning {
  color: #faad14;
  font-weight: 600;
}

.text-primary {
  color: $purple;
  font-weight: 600;
}

.text-muted {
  color: $gray;
}

// 风险时间轴卡片
.timeline-card {
  margin-bottom: 24px;

  .risk-timeline-chart {
    height: 300px;
    width: 100%;
    padding: 20px;
  }
}

// 词云卡片
.wordcloud-card {
  margin-bottom: 24px;

  .card-subtitle {
    font-size: 11px;
    color: $gray;
    font-weight: 400;
  }

  .wordcloud-content {
    padding: 32px 24px;

    .wordcloud-visual {
      display: flex;
      flex-wrap: wrap;
      justify-content: center;
      align-items: center;
      min-height: 200px;
      gap: 4px;

      .word-item {
        display: inline-block;
        padding: 4px 8px;
        cursor: default;
        transition: all 0.3s ease;

        &:hover {
          transform: scale(1.1);
          opacity: 1 !important;
        }
      }
    }
  }
}

// 敏感内容检测卡片
.sensitive-card {
  margin-bottom: 24px;

  .sensitive-content {
    padding: 24px;

    .no-sensitive {
      text-align: center;
      padding: 32px 20px;

      .el-icon {
        margin-bottom: 16px;
      }

      p {
        margin: 8px 0;
        color: $black;
        font-weight: 600;

        &.hint {
          color: $gray;
          font-size: 13px;
          font-weight: 400;
        }
      }
    }

    .sensitive-list {
      .sensitive-warning {
        display: flex;
        align-items: center;
        gap: 10px;
        padding: 12px 16px;
        background: rgba(245, 108, 108, 0.1);
        border-radius: 12px;
        margin-bottom: 16px;
        color: #f56c6c;
        font-weight: 600;
      }

      .sensitive-item {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 12px 16px;
        background: $neu-1;
        border-radius: 12px;
        margin-bottom: 8px;
        box-shadow:
          inset 2px 2px 4px $neu-2,
          inset -2px -2px 4px $white;

        .sensitive-word {
          color: #f56c6c;
          font-weight: 700;
          font-size: 15px;
        }

        .sensitive-category {
          font-size: 12px;
          color: $gray;
          padding: 4px 12px;
          background: rgba(245, 108, 108, 0.1);
          border-radius: 12px;
        }
      }
    }
  }
}

// 风险时间轴卡片
.timeline-card {
  margin-bottom: 24px;

  .risk-timeline-chart {
    height: 300px;
    width: 100%;
    padding: 20px;
  }
}

// 视频播放器
.video-player {
  width: 100%;
  max-height: 450px;
  background: #000;
  border-radius: 12px;
}

:deep(.el-dialog) {
  border-radius: 20px;

  .el-dialog__header {
    border-bottom: 1px solid rgba($neu-2, 0.5);
    padding: 20px 24px;
    margin: 0;
  }

  .el-dialog__body {
    padding: 24px;
  }
}

// ==================== 视图切换过渡动画 ====================
.fade-enter-active,
.fade-leave-active {
  transition:
    opacity 0.3s ease,
    transform 0.3s ease;
}

.fade-enter-from {
  opacity: 0;
  transform: translateY(10px);
}

.fade-leave-to {
  opacity: 0;
  transform: translateY(-10px);
}

// ==================== 交互式分析视图样式 ====================
.interactive-view {
  // 逻辑修复：视频档案卡（本地上传场景）
  .video-archive-card {
    padding: 0;
    margin-bottom: 16px;
    margin-left: 20px;
    overflow: hidden;

    // 数据来源标识
    .video-source-badge {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 8px 20px;
      background: var(--bg-hover);
      border-bottom: 1px solid var(--border-color);

      .source-label {
        display: flex;
        align-items: center;
        gap: 6px;
        font-size: 13px;
        font-weight: 500;
        color: var(--text-secondary);

        .el-icon {
          color: var(--text-tertiary);
        }
      }

      .source-hint {
        font-size: 12px;
        color: var(--text-tertiary);
      }
    }

    .archive-header {
      padding: 10px 24px 6px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 16px;
      flex-wrap: wrap;

      .file-section {
        display: flex;
        align-items: center;
        gap: 14px;
        flex: 1;

        .file-icon {
          width: 52px;
          height: 52px;
          border-radius: 14px;
          background: linear-gradient(135deg, $purple, #7c9df7);
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          box-shadow: none;
          border: 1px solid var(--border-color);
          margin-left: -10px;
          overflow: hidden;

          .file-cover-img {
            width: 100%;
            height: 100%;
            object-fit: cover;
            display: block;
          }

          .file-cover-placeholder {
            width: 100%;
            height: 100%;
            display: flex;
            align-items: center;
            justify-content: center;
            color: white;
            background: linear-gradient(135deg, $purple, #7c9df7);
          }
        }

        .file-info {
          flex: 1;

          .file-main {
            position: relative;
            padding-right: 120px; // 为右上角的时长标签留出空间
            min-height: 28px; // 确保至少一行的高度

            .file-name {
              font-size: 16px;
              font-weight: 700;
              color: $black;
              font-family: "Courier New", monospace;
              line-height: 1.4;
              word-break: break-word; // 长文件名自动换行
            }

            .status-badge {
              display: inline-flex;
              align-items: center;
              gap: 4px;
              padding: 4px 10px;
              border-radius: 10px;
              font-size: 11px;
              font-weight: 600;

              &.success {
                background: rgba(82, 196, 26, 0.15);
                color: #52c41a;
              }
            }
          }

          .file-meta {
            display: flex;
            flex-wrap: wrap;
            gap: 12px;
            margin-bottom: 8px;

            .meta-item {
              display: inline-flex;
              align-items: center;
              gap: 4px;
              font-size: 11px;
              color: $gray;

              &:not(:last-child)::after {
                content: "|";
                margin-left: 12px;
                color: rgba(160, 165, 168, 0.3);
              }
            }
          }

          .baseline-info {
            display: flex;
            align-items: center;
            gap: 6px;
            padding: 6px 10px;
            background: rgba(75, 112, 226, 0.08);
            border-radius: 8px;
            font-size: 10px;
            color: $purple;
            width: fit-content;

            .baseline-text {
              font-weight: 600;
            }

            .baseline-version {
              font-size: 9px;
              opacity: 0.7;
              margin-left: 4px;
            }
          }
        }
      }

      .identity-section {
        display: flex;
        flex-direction: column;
        gap: 8px;
        align-items: flex-end;

        .identity-info-group {
          display: flex;
          flex-direction: column;
          gap: 5px;
          align-items: flex-end;
        }

        .identity-badge {
          display: inline-flex;
          align-items: center;
          gap: 5px;
          padding: 6px 14px;
          border-radius: 12px;
          font-size: 12px;
          font-weight: 600;

          &.identity-suspected {
            background: rgba(250, 173, 20, 0.15);
            color: #faad14;
            border: 1px solid rgba(250, 173, 20, 0.3);
          }

          &.identity-confirmed {
            background: rgba(82, 196, 26, 0.15);
            color: #52c41a;
            border: 1px solid rgba(82, 196, 26, 0.3);
          }

          &.identity-unknown {
            background: rgba(160, 165, 168, 0.15);
            color: $gray;
            border: 1px solid rgba(160, 165, 168, 0.3);
          }

          .confidence {
            font-size: 11px;
            opacity: 0.85;
          }
        }

        .match-source-hint {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          font-size: 10px;
          color: #52c41a;
          background: rgba(82, 196, 26, 0.08);
          padding: 3px 8px;
          border-radius: 6px;
          font-weight: 500;
        }
      }

      .scene-badge {
        display: flex;
        align-items: center;
        gap: 5px;
        padding: 6px 12px;
        background: rgba(75, 112, 226, 0.08);
        border-radius: 10px;
        color: $purple;
        font-size: 11px;
        font-weight: 600;

        .scene-conf {
          font-size: 10px;
          opacity: 0.75;
        }
      }
    }

    .global-stats-section {
      display: grid;
      grid-template-columns: repeat(3, 1fr); // 改为3列
      gap: 16px 12px; // 增加列间距
      padding: 0;

      .stat-item-archive {
        background: $neu-1;
        border-radius: 12px;
        padding: 14px 16px;
        box-shadow:
          2px 2px 6px $neu-2,
          -2px -2px 6px $white;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        gap: 6px;
        transition: all 0.3s ease;

        &:hover {
          transform: translateY(-2px);
          box-shadow:
            3px 3px 8px $neu-2,
            -3px -3px 8px $white;
        }

        .stat-label-archive {
          font-size: 11px;
          color: $gray;
          font-weight: 500;
          text-align: center;
        }

        .stat-value-archive {
          font-size: 24px;
          font-weight: 700;
          color: $black;
          display: flex;
          align-items: baseline;

          &.risk-high {
            background: linear-gradient(135deg, #f56c6c, #ff8585);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            background-clip: text;
          }

          .stat-unit {
            font-size: 14px;
            font-weight: 600;
            margin-left: 2px;
          }
        }
      }
    }
  }
}

// Gemini优化：AI目标侧写卡片
.ai-profiling-card {
  .card-header {
    .profiling-hint {
      font-size: 10px;
      color: $gray;
      background: rgba(250, 173, 20, 0.1);
      padding: 3px 8px;
      border-radius: 6px;
      font-style: italic;
    }
  }

  .profiling-content {
    padding: 18px 20px;
    display: flex;
    flex-direction: column;
    gap: 14px;

    .profiling-section {
      .section-title {
        display: flex;
        align-items: center;
        gap: 5px;
        font-size: 11px;
        color: $gray;
        font-weight: 600;
        margin-bottom: 8px;
      }

      .keyword-chips,
      .feature-chips {
        display: flex;
        flex-wrap: wrap;
        gap: 6px;
      }

      .keyword-chip {
        padding: 4px 10px;
        background: rgba(75, 112, 226, 0.1);
        border: 1px solid rgba(75, 112, 226, 0.25);
        border-radius: 8px;
        font-size: 11px;
        color: $purple;
        font-weight: 500;
      }

      .feature-chip {
        padding: 4px 9px;
        border-radius: 8px;
        font-size: 10px;
        font-weight: 500;
        display: inline-flex;
        align-items: center;
        gap: 4px;

        &.visual {
          background: rgba(245, 108, 108, 0.1);
          border: 1px solid rgba(245, 108, 108, 0.25);
          color: #f56c6c;
        }

        &.audio {
          background: rgba(250, 173, 20, 0.1);
          border: 1px solid rgba(250, 173, 20, 0.25);
          color: #faad14;
        }

        &.static {
          background: rgba(75, 112, 226, 0.1);
          border: 1px solid rgba(75, 112, 226, 0.25);
          color: $purple;
        }
      }

      &.static-features {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 8px;

        .feature-chip {
          justify-content: flex-start;
        }
      }
    }
  }
}

// 侧边指标包装器
.side-metrics-wrapper {
  .key-metrics-grid {
    display: flex;
    flex-direction: column;
    gap: 12px;
  }
}

// 绿圈：实时分析栏样式（参考设计图）
.realtime-analysis-bar-inner,
.realtime-analysis-bar {
  // 大版雷达图卡片（按设计图优化）
  .radar-card-large {
    // 缩减后的标题栏（减少上下尺度）
    .radar-card-header-slim {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 10px 20px; /* 缩减：16px → 10px */
      border-bottom: 1px solid rgba($neu-2, 0.25);
      gap: 10px;

      .card-title-main {
        font-size: 14px; /* 缩减：15px → 14px */
        font-weight: 700;
        color: $black;
        display: flex;
        align-items: center;
        gap: 6px;
      }

      .current-frame-badge {
        display: inline-flex;
        align-items: center;
        gap: 4px;
        padding: 4px 10px; /* 缩减：5px → 4px */
        background: rgba(245, 108, 108, 0.12);
        border-radius: 8px;
        font-size: 10px;
        font-weight: 600;
        color: #f56c6c;
        animation: pulse-dot 2s ease-in-out infinite;
      }
    }

    // 雷达图主体 + 右侧风险数值
    .radar-with-gauge {
      display: flex;
      gap: 20px;
      padding: 20px;
      position: relative;

      .radar-main {
        flex: 1;
        display: flex;
        flex-direction: column;

        .radar-chart-large {
          height: 340px; /* 增加：320px → 340px */
          width: 100%;
        }

        .fusion-formula-bottom {
          text-align: center;
          padding: 8px 16px;
          margin-top: 8px;
          font-size: 11px;
          color: $gray;
          font-family: "Courier New", monospace;
          background: rgba(75, 112, 226, 0.05);
          border-radius: 8px;
        }
      }

      .gauge-side {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        min-width: 120px;

        .gauge-number-side {
          font-size: 68px; /* 放大：42px → 68px */
          font-weight: 800;
          line-height: 1;

          &.risk-high {
            color: #f56c6c;
            text-shadow: 0 0 25px rgba(245, 108, 108, 0.5);
          }

          &.risk-medium {
            color: #faad14;
            text-shadow: 0 0 25px rgba(250, 173, 20, 0.5);
          }

          &.risk-low {
            color: #52c41a;
            text-shadow: 0 0 25px rgba(82, 196, 26, 0.5);
          }
        }

        .gauge-label-side {
          font-size: 12px;
          color: $gray;
          margin-top: 10px;
          font-weight: 600;
        }
      }
    }
  }
}

// 底部静态区：AI侧写 + 全局统计
.static-archive-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
  margin-bottom: 24px;

  @media (max-width: 1200px) {
    grid-template-columns: 1fr;
  }
}

// 全局统计卡片
.global-stats-card {
  .global-stats-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 16px;
    padding: 20px;

    .stat-item {
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 14px;
      background: $bg;
      border-radius: 12px;

      .stat-label {
        font-size: 11px;
        color: $gray;
        margin-bottom: 6px;
      }

      .stat-value {
        font-size: 18px;
        font-weight: 700;
        color: $black;

        &.risk-high {
          color: #f56c6c;
        }
      }
    }
  }
}

// 原 fusion-analysis-grid 改为 static-archive-grid
.fusion-analysis-grid {
  display: grid;
  grid-template-columns: 1fr 1fr 0.6fr;
  gap: 20px;
  margin-bottom: 24px;

  @media (max-width: 1400px) {
    grid-template-columns: 1fr 1fr;

    .side-metrics-wrapper {
      grid-column: 1 / -1;
    }
  }

  @media (max-width: 900px) {
    grid-template-columns: 1fr;
  }

  .radar-card {
    .card-header {
      flex-direction: column;
      align-items: flex-start;
      gap: 8px;

      .card-title {
        display: flex;
        align-items: center;
        gap: 8px;
        flex-wrap: wrap;

        .current-frame-badge {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          padding: 3px 8px;
          background: rgba(245, 108, 108, 0.12);
          border-radius: 8px;
          font-size: 10px;
          font-weight: 600;
          color: #f56c6c;
          animation: pulse-dot 2s ease-in-out infinite;
        }
      }

      .fusion-formula {
        font-size: 11px;
        color: $gray;
        background: rgba(75, 112, 226, 0.08);
        padding: 4px 10px;
        border-radius: 8px;
        font-family: "Courier New", monospace;
      }
    }

    .radar-chart {
      height: 280px;
      width: 100%;
      padding: 10px;
    }
  }
}

.side-metrics-wrapper {
  .key-metrics-grid {
    display: grid;
    grid-template-columns: 1fr;
    gap: 12px;

    @media (max-width: 1400px) {
      grid-template-columns: repeat(4, 1fr);
    }

    @media (max-width: 768px) {
      grid-template-columns: repeat(2, 1fr);
    }

    .metric-mini {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 14px;

      .metric-icon {
        width: 38px;
        height: 38px;
        border-radius: 10px;
        display: flex;
        align-items: center;
        justify-content: center;
        flex-shrink: 0;

        &.video-icon {
          background: rgba(245, 108, 108, 0.12);
          color: #f56c6c;
        }

        &.audio-icon {
          background: rgba(250, 173, 20, 0.12);
          color: #faad14;
        }

        &.text-icon {
          background: rgba(75, 112, 226, 0.12);
          color: $purple;
        }

        &.university-icon {
          background: rgba(82, 196, 26, 0.12);
          color: #52c41a;
        }
      }

      .metric-content {
        flex: 1;
        min-width: 0;

        .metric-value {
          font-size: 18px;
          font-weight: 700;
          color: $black;
          line-height: 1;
        }

        .metric-label {
          font-size: 10px;
          color: $gray;
          margin-top: 4px;
        }
      }
    }
  }
}

.multi-modal-container {
  display: flex; // 改用flex布局
  gap: 20px;
  align-items: start; // 关键：顶部对齐，防止拉伸

  @media (max-width: 1200px) {
    flex-direction: column;
  }
}

// 右侧面板容器（字幕 + 雷达图）
.right-panel-container {
  display: flex;
  flex-direction: column;
  gap: 16px;
  min-width: 0; // 防止flex子元素溢出
  transition:
    background 0.3s cubic-bezier(0.4, 0, 0.2, 1),
    border-radius 0.3s cubic-bezier(0.4, 0, 0.2, 1),
    padding 0.3s cubic-bezier(0.4, 0, 0.2, 1),
    gap 0.3s cubic-bezier(0.4, 0, 0.2, 1),
    box-shadow 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  // 移除 align-self: stretch，让它自然高度

  &.evidence-detail-mode {
    background: var(--bg-hover);
    border: 1px solid var(--border-color);
    border-radius: 20px;
    padding: 14px 16px 12px 16px; // 保持内边距
    box-shadow: none;
    gap: 0; // 移除间距，让证据面板占满
    max-height: calc(806px - 15px); // 限制高度并预留底部10px间距
    overflow: hidden; // 裁剪溢出内容
  }
}

// 证据详情面板（内嵌模式）
.evidence-detail-panel {
  display: flex;
  flex-direction: column;
  height: 100%;
  min-height: 0; // 关键：允许 flex 子元素缩小
  gap: 12px;
  overflow: hidden; // 裁剪溢出内容，让内部的 evidence-list-scroll 处理滚动
}

// ==================== 多模态融合区域 - 新拟态风格 ====================
// 模态卡片行 - 优化间距
.modality-cards-row {
  display: flex;
  align-items: stretch;
  justify-content: space-between; // 均匀分布卡片
  gap: 10px;
  margin-top: 12px;
  overflow: visible; // 纵向允许可见（用于悬停效果）
  flex-shrink: 0; // 防止被压缩
  padding-bottom: 4px; // 给滚动条留空间

  // 优化滚动条样式
  &::-webkit-scrollbar {
    height: 6px;
  }

  &::-webkit-scrollbar-thumb {
    background: #d0d5dd;
    border-radius: 3px;

    &:hover {
      background: #a0a5a8;
    }
  }

  &::-webkit-scrollbar-track {
    background: rgba(0, 0, 0, 0.03);
    border-radius: 3px;
  }
}

// 模态卡片 - 扁平化风格（深色模式完整适配）
.modality-card {
  flex: 1 1 auto; // 允许伸缩以适应容器
  background: var(--bg-card);
  border: 1px solid var(--border-color);
  border-radius: 14px;
  padding: 14px 12px;
  box-shadow: none;
  transition: all 0.2s ease;
  min-width: 90px; // 减小最小宽度，允许更紧凑
  max-width: 150px; // 添加最大宽度，防止过宽
  display: flex;
  flex-direction: column;

  &:hover {
    transform: translateY(-2px);
    box-shadow: none;
  }

  // 🎯 统计类型 - 三个模态小卡片（视频、音频、文本）
  &.statistics-type:not(.result-card) {
    align-self: center; // 卡片高度自适应且垂直居中
    justify-content: center; // 内容垂直居中
    height: 140px;

    .modality-header {
      margin-bottom: 0; // 头部下边距为0
    }

    // 👇 在这里添加三个模态小卡片的专属样式
    // 例如：
    // padding: 16px 12px;
    // min-height: 140px;
  }

  // 结果卡片 - 外凸弹出效果，给更多空间
  &.result-card {
    box-shadow:
      4px 4px 8px $neu-2,
      -4px -4px 8px $white;
    flex: 1.2 1 auto; // 允许适度伸缩
    min-width: 100px; // 减小最小宽度
    max-width: 160px; // 添加最大宽度限制，防止超出容器
    margin-right: 8px;

    .result-label {
      font-size: 11px;
      color: var(--text-secondary);
      margin-top: 8px;
      text-align: center;
      font-weight: 500;
    }

    // 🎯 统计类型 - 融合结果卡片专属样式
    &.statistics-type {
      .modality-header {
        margin-bottom: 0; // 头部下边距为0
      }

      // 👇 在这里添加统计类型融合结果的其他专属样式
      // 例如：
      // align-self: center;
      // justify-content: center;
      // padding: 18px 14px;
    }

    // 统计类型结果 - 增大字体
    .statistics-result {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 8px;
      // padding: 8px 0;

      .statistics-total {
        font-size: 20px;
        font-weight: 600;
        color: $purple;
        line-height: 1.2;

        .total-count {
          font-size: 36px;
          font-weight: 700;
          color: $purple;
        }
      }

      .statistics-breakdown {
        display: flex;
        gap: 10px;
        font-size: 12px;
        font-weight: 600;
        flex-wrap: wrap;
        justify-content: center;

        .stat-item {
          display: flex;
          align-items: center;
          gap: 4px;
          padding: 4px 8px;
          border-radius: 6px;

          .stat-dot {
            width: 7px;
            height: 7px;
            border-radius: 50%;
            display: inline-block;
          }

          &.positive {
            color: #52c41a;
            background: rgba(82, 196, 26, 0.12);
            .stat-dot {
              background: #52c41a;
            }
          }

          &.neutral {
            color: #1890ff;
            background: rgba(24, 144, 255, 0.12);
            .stat-dot {
              background: #1890ff;
            }
          }

          &.negative {
            color: #f56c6c;
            background: rgba(245, 108, 108, 0.12);
            .stat-dot {
              background: #f56c6c;
            }
          }
        }
      }
    }
  }
}

// 模态头部 - 图标+文字组合居中，图标紧贴文字左侧
.modality-header {
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: center;
  gap: 8px;
  margin-bottom: 10px; // 默认值
}

// 🎯 非statistics类型（5个卡片）的融合结果 - 增大下边距
.modality-card:not(.statistics-type) .modality-header {
  margin-bottom: 23px;
}

.result-card:not(.statistics-type) .modality-header {
  margin-bottom: 23px;
}

// 模态图标 - 使用系统配色，减小尺寸
.modality-icon {
  width: 32px;
  height: 32px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;

  &.video-icon {
    background: rgba(59, 130, 246, 0.1);
    color: #3b82f6;
  }

  &.audio-icon {
    background: rgba(236, 72, 153, 0.1);
    color: #ec4899;
  }

  &.text-icon {
    background: rgba(16, 185, 129, 0.1);
    color: #10b981;
  }

  &.result-icon {
    background: rgba(139, 92, 246, 0.1);
    color: $purple;
  }
}

// 模态名称
.modality-name {
  font-size: 12px;
  font-weight: 600;
  color: $black;
  white-space: nowrap;
}

// 模态得分 - 增大字体，更醒目
.modality-score {
  font-size: 34px;
  font-weight: 700;
  color: $black;
  line-height: 1.1;
  margin-bottom: 4px;
  text-align: center;

  .score-unit {
    font-size: 16px;
    font-weight: 500;
    color: var(--text-tertiary);
    margin-left: 2px;
  }

  &.final-score {
    color: $purple;
    font-size: 38px;
  }
}

// 🎯 非statistics类型（5个卡片）- 数字向右偏移，平衡视觉重心
.modality-card:not(.statistics-type) .modality-score,
.result-card:not(.statistics-type) .modality-score {
  padding-left: 13px;
}

// 模态详情 - 居中显示
.modality-details {
  display: flex;
  flex-direction: column;
  gap: 4px;
  margin-top: 8px;
  align-items: center;
}

.detail-item {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
  font-size: 11px;
  color: var(--text-secondary);
  line-height: 1.4;

  .el-icon {
    color: var(--text-tertiary);
  }
}

// 贡献文本 - 优化尺寸
.contribution-text {
  font-size: 11px;
  color: $purple;
  text-align: center;
  margin-top: 6px;
  font-weight: 500;
  padding: 4px 8px;
  background: rgba($purple, 0.1);
  border-radius: 6px;
  line-height: 1.3;
}

// 统计类型模态展示 - 增大字体，垂直居中
.modality-stats {
  display: flex;
  align-items: baseline;
  justify-content: center;
  margin: 10px 0 8px 0;

  .stat-count {
    font-size: 32px;
    font-weight: 700;
    color: $purple;
  }

  .stat-label {
    font-size: 13px;
    color: var(--text-secondary);
    margin-left: 4px;
  }
}

.mini-breakdown {
  display: flex;
  justify-content: center;
  gap: 6px;
  font-size: 11px;
  font-weight: 600;
  flex-wrap: wrap;
  margin-top: 4px;

  .mini-stat {
    padding: 3px 7px;
    border-radius: 4px;
    white-space: nowrap;

    &.positive {
      color: #52c41a;
      background: rgba(82, 196, 26, 0.12);
    }

    &.neutral {
      color: #1890ff;
      background: rgba(24, 144, 255, 0.12);
    }

    &.negative {
      color: #f56c6c;
      background: rgba(245, 108, 108, 0.12);
    }
  }
}

// 融合箭头 - 简洁设计
.fusion-arrow {
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  padding: 0 4px;
}

.evidence-panel-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-bottom: 12px;
  border-bottom: 1px solid var(--border-color);
  flex-shrink: 0; // 头部不缩小
}

.header-left {
  display: flex;
  align-items: center;
  gap: 16px;
  flex: 1;
}

.card-icon-large {
  width: 56px;
  height: 56px;
  border-radius: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 32px; // 增大图标字体
  padding: 12px; // 增加内边距
  flex-shrink: 0;
  box-shadow: none;
  border: 1px solid var(--border-color);
}

.header-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 2px; // 紧凑间距
  min-width: 0;
}

.panel-title-row {
  display: flex;
  align-items: center;
  gap: 12px;
}

.panel-category {
  font-size: 11px;
  font-weight: 600;
  color: var(--text-tertiary);
  text-transform: uppercase;
  letter-spacing: 0.8px;
}

.panel-confidence-inline {
  font-size: 11px;
  font-weight: 600;
  color: var(--text-secondary);
  white-space: nowrap;
  display: flex;
  align-items: center;

  .ai-predict-badge-panel {
    display: inline-flex;
    align-items: center;
    padding: 2px 6px;
    font-size: 10px;
    font-weight: 500;
    color: var(--text-tertiary);
    background: var(--bg-hover);
    border-radius: 3px;
    border: 1px solid var(--border-color);
    cursor: help;
    margin-left: 12px;
  }

  &::before {
    content: "●";
    color: $purple;
    margin-right: 3px;
  }
}

.panel-main-value {
  font-size: 20px;
  font-weight: 700;
  margin: 3px 0 0 0;
  line-height: 1.2;
  // 默认使用紫色，但会被动态类覆盖
  color: $purple;
  // 移除渐变背景，让动态颜色类生效
}

.close-evidence-btn {
  width: 40px;
  height: 40px;
  border-radius: 10px;
  border: 1px solid var(--border-color);
  background: var(--bg-hover);
  box-shadow: none;
  color: var(--text-secondary);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
  margin-right: 8px;

  &:hover {
    color: var(--color-primary);
    transform: scale(1.05);
  }

  &:active {
    box-shadow:
      inset 2px 2px 4px $neu-2,
      inset -2px -2px 4px $white;
  }
}

.section-title-inline {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  font-weight: 600;
  color: var(--text-primary);
  margin-bottom: 10px;
  padding-bottom: 8px;
  border-bottom: 1px solid var(--border-color);
}

.evidence-count {
  font-size: 12px;
  color: var(--text-tertiary);
  font-weight: 400;
}

// 证据列表区域（内嵌版）
.evidence-list-section {
  flex: 1; // 占据剩余空间
  display: flex;
  flex-direction: column;
  min-height: 0; // 关键：允许缩小
  overflow: visible; // 允许tooltip超出边界显示，内部滚动由evidence-list-scroll处理
}

.section-title-inline {
  flex-shrink: 0; // 标题不缩小
}

.evidence-list-scroll {
  flex: 1; // 占据剩余空间
  overflow-y: auto; // 可滚动
  overflow-x: visible; // 允许tooltip超出横向边界正常显示（clip会截断::before伪元素tooltip）
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding-right: 4px; // 给滚动条留空间

  &::-webkit-scrollbar {
    width: 6px;
  }

  &::-webkit-scrollbar-thumb {
    background: #d0d5dd;
    border-radius: 3px;

    &:hover {
      background: #b0b5bd;
    }
  }

  &::-webkit-scrollbar-track {
    background: transparent;
  }
}

.evidence-group-inline {
  background: var(--bg-card);
  border: 1px solid var(--border-color);
  border-radius: 12px;
  padding: 12px;
  box-shadow: none;
  overflow: visible;
}

.group-title-inline {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  font-weight: 600;
  color: var(--text-secondary);
  margin-bottom: 10px;
  padding-bottom: 8px;
  border-bottom: 1px solid var(--border-color);

  .el-icon {
    color: var(--text-secondary);
  }
}

.evidence-item-inline {
  display: flex;
  align-items: center; // ✅ 垂直居中
  gap: 10px;
  padding: 10px;
  border-radius: 8px;
  background: var(--bg-card);
  cursor: pointer;
  transition: all 0.2s;
  border-left: 3px solid transparent;

  &:hover {
    background: var(--bg-hover);
    border-left-color: var(--color-primary);
    transform: translateX(3px);
  }

  &:not(:last-child) {
    margin-bottom: 8px;
  }
}

.evidence-time-badge {
  flex-shrink: 0;
  min-width: 50px; // 固定最小宽度，确保等宽
  padding: 0;
  background: transparent; // 无背景
  color: #667eea; // 紫色文字
  font-size: 13px; // 稍大的字体
  font-weight: 700; // 加粗
  font-family: "Consolas", "Monaco", monospace; // 等宽字体
  text-align: left; // 左对齐
  letter-spacing: 0.5px; // 字间距
}

.evidence-content-inline {
  flex: 1;
  min-width: 0;
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
}

.evidence-desc-inline {
  font-size: 13px;
  color: var(--text-primary);
  line-height: 1.5;
  flex: 1;
  min-width: 0;
}

.evidence-actions-inline {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-shrink: 0;
}

// 情感标签 - 只在"对学校态度"卡片显示
.sentiment-tag-inline {
  display: inline-flex;
  align-items: center;
  font-size: 10px;
  font-weight: 700;
  padding: 2px 6px;
  border-radius: 3px;
  white-space: nowrap;
  flex-shrink: 0; // 防止被压缩

  &.sentiment-positive {
    color: #52c41a;
    background: rgba(82, 196, 26, 0.15);
  }

  &.sentiment-neutral {
    color: #1890ff;
    background: rgba(24, 144, 255, 0.15);
  }

  &.sentiment-negative {
    color: #f56c6c;
    background: rgba(245, 108, 108, 0.15);
  }
}

// 置信度小徽章 - 放在右侧
.confidence-badge-inline {
  display: inline-block;
  font-size: 10px;
  font-weight: 600;
  color: #667eea;
  background: rgba(102, 126, 234, 0.1);
  padding: 3px 7px;
  border-radius: 4px;
  white-space: nowrap;
}

.evidence-meta-inline {
  display: flex;
  justify-content: flex-end;
  align-items: center;
}

.confidence-tag-inline {
  font-size: 11px;
  color: var(--text-secondary);
  background: var(--bg-hover);
  padding: 2px 6px;
  border-radius: 4px;
}

.jump-hint-inline {
  display: inline-flex;
  align-items: center;
  gap: 3px;
  font-size: 10px;
  color: #1976d2;
  font-weight: 500;
  white-space: nowrap;
  cursor: pointer;

  .el-icon {
    font-size: 12px;
  }

  &:hover {
    color: #667eea;
  }
}

// 文本证据网格（内嵌版）
.text-evidences-grid-inline {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
  gap: 8px;
}

.text-evidence-item-inline {
  padding: 10px;
  background: var(--bg-card);
  border: 1px solid var(--border-color);
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  flex-direction: column;
  gap: 6px;
  position: relative;

  &:hover {
    background: var(--bg-hover);
    transform: translateY(-2px);
    box-shadow: var(--shadow-sm);
  }

  // tooltip 已换为 el-tooltip（teleported to body），不再需要 CSS ::before 方案
  // tooltip-left / tooltip-right：已废弃，tooltip 由 el-tooltip 处理
  &.tooltip-left, &.tooltip-right {
    // 无需额外样式
  }
}

.text-keyword-inline {
  font-size: 13px;
  font-weight: 500;
  color: var(--text-primary);
  line-height: 1.6;
  word-break: break-word;
}

.text-meta-inline {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-shrink: 0;
}

.text-time-inline {
  font-size: 11px;
  font-weight: 700;
  color: #667eea;
  font-family: "Consolas", "Monaco", monospace;
  white-space: nowrap;
  flex-shrink: 0;
}

.confidence-badge-inline {
  font-size: 10px;
  padding: 2px 6px;
  background: rgba(103, 194, 58, 0.12);
  color: #67c23a;
  border-radius: 3px;
  white-space: nowrap;
  flex-shrink: 0;
}

// 视频区域
.video-section {
  display: flex;
  flex-direction: column;
  gap: 16px;
  transition: flex 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  min-width: 0; // 防止flex子元素溢出

  // 视频下方的实时分析栏（单列，雷达图为主）
  .realtime-analysis-bar-inner {
    width: 100%;
  }
}

.video-player-wrapper {
  position: relative;
  width: calc(100% - 20px);
  min-height: 480px; /* 修复：增加视频高度 */
  border-radius: 20px;
  overflow: hidden; // 恢复 hidden，防止内部动画影响页面高度
  background: #000;
  box-shadow:
    8px 8px 16px $neu-2,
    -8px -8px 16px $white;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-left: 20px;

  .main-video-player {
    width: 100%;
    height: auto;
    display: block;
    background: #000;
    border-radius: 20px; // 保持视频本身的圆角
  }

  // V1.5: 证据截图样式（支持视频播放器）
  .evidence-snapshot {
    width: 100%;
    height: auto;
    max-height: 480px;
    object-fit: contain;
    display: block;
    transition: opacity 0.4s ease;
    opacity: 0.95;
    background: #000;
    border-radius: 20px; // 保持视频本身的圆角

    &:hover {
      opacity: 1;
    }
  }

  .video-placeholder {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    width: 100%;
    height: 400px;
    color: $gray;

    p {
      margin-top: 16px;
      font-size: 14px;
    }
  }

  // CV视觉模态：多检测框容器（业界标准）
  .detections-overlay {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    pointer-events: none;
    z-index: 10;
  }

  // 证据时间轴标记
  .evidence-timeline-overlay {
    position: absolute;
    bottom: 50px; // 在视频控制条上方
    left: 0;
    right: 0;
    height: 40px;
    padding: 0 16px;
    z-index: 20;
    pointer-events: none;
  }

  .timeline-progress-bar {
    position: relative;
    width: 100%;
    height: 100%;
    display: flex;
    align-items: center;
  }

  // 当前播放进度指示器
  .play-progress-indicator {
    position: absolute;
    top: 50%;
    transform: translateX(-50%) translateY(-50%);
    width: 3px;
    height: 30px;
    background: linear-gradient(
      180deg,
      rgba(255, 255, 255, 0.9) 0%,
      rgba(255, 255, 255, 0.6) 100%
    );
    border-radius: 2px;
    box-shadow: 0 0 10px rgba(255, 255, 255, 0.5);
    transition: left 0.1s linear;
    z-index: 2;
  }

  // 证据标记点
  .evidence-mark {
    position: absolute;
    top: 50%;
    transform: translateX(-50%) translateY(-50%);
    cursor: pointer;
    pointer-events: all;
    z-index: 3;
    transition: all 0.2s ease;

    &:hover {
      z-index: 9998; // 悬停时提升到最高层级，确保悬浮窗口不被遮挡

      .mark-dot {
        transform: scale(1.5);
        box-shadow: 0 0 20px currentColor;
      }

      .mark-popup {
        opacity: 1;
        visibility: visible;
        transform: translateX(-50%) translateY(-10px);
      }
    }

    // 靠近起始位置时的悬停效果
    &.mark-near-start:hover .mark-popup {
      transform: translateX(-5%) translateY(-10px) !important;

      &::after {
        left: 5% !important; // 精确对齐：窗口偏移-5%，三角在5%处
        transform: translateX(0) !important;
      }
    }

    // 靠近结束位置时的悬停效果
    &.mark-near-end:hover .mark-popup {
      transform: translateX(-95%) translateY(-10px) !important;
      border-bottom-right-radius: 2px !important;

      &::after {
        left: 95% !important; // 精确指向标记点
        transform: translateX(-50%) !important;
        border-width: 8px !important;
        border-top-width: 10px !important;
      }
    }

    &.mark-active {
      .mark-dot {
        transform: scale(1.3);
        box-shadow: 0 0 15px currentColor;
        animation: pulse-mark 2s infinite;
      }
    }
  }

  .mark-dot {
    width: 14px;
    height: 14px;
    border-radius: 50%;
    border: 3px solid white;
    transition: all 0.2s ease;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
  }

  // 不同类型的标记颜色（默认，会被卡片特定样式覆盖）
  .mark-type-video .mark-dot {
    background: #667eea;
    color: #667eea;
  }

  .mark-type-audio .mark-dot {
    background: #f093fb;
    color: #f093fb;
  }

  .mark-type-text .mark-dot {
    background: #4facfe;
    color: #4facfe;
  }

  // 对学校态度卡片 - 根据情感使用不同颜色
  .mark-card-attitude.mark-sentiment-positive .mark-dot {
    background: #52c41a !important; // 正面 - 绿色
    color: #52c41a !important;
    border-color: white;
  }

  .mark-card-attitude.mark-sentiment-neutral .mark-dot {
    background: #1890ff !important; // 中性 - 蓝色
    color: #1890ff !important;
    border-color: white;
  }

  .mark-card-attitude.mark-sentiment-negative .mark-dot {
    background: #f56c6c !important; // 负面 - 红色
    color: #f56c6c !important;
    border-color: white;
  }

  // 其他卡片 - 统一使用紫色（覆盖原有的类型颜色）
  .mark-card-identity .mark-dot,
  .mark-card-university .mark-dot,
  .mark-card-topic .mark-dot,
  .mark-card-opinionRisk .mark-dot,
  .mark-card-action .mark-dot {
    background: #8b5cf6 !important; // 紫色
    color: #8b5cf6 !important;
    border-color: white;
  }

  // 悬停弹窗
  .mark-popup {
    position: absolute;
    bottom: 100%;
    left: 50%;
    transform: translateX(-50%) translateY(-20px);
    background: rgba(0, 0, 0, 0.9);
    backdrop-filter: blur(10px);
    color: white;
    padding: 12px;
    border-radius: 8px;
    font-size: 12px;
    white-space: nowrap;
    opacity: 0;
    visibility: hidden;
    transition: all 0.2s ease;
    pointer-events: none;
    min-width: 200px;
    max-width: 300px;
    white-space: normal;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
    z-index: 9999;

    &::after {
      content: "";
      position: absolute;
      top: 100%;
      left: 50%;
      transform: translateX(-50%);
      border: 6px solid transparent;
      border-top-color: rgba(0, 0, 0, 0.9);
    }
  }

  // 靠近起始位置：悬浮窗口向右偏移，远离左边界
  &.mark-near-start .mark-popup {
    left: 50%;
    transform: translateX(-8%) translateY(-20px) !important;
    min-width: 180px; // 减小宽度

    &::after {
      left: 12%; // 避开左下角圆角，稍微向内
      transform: translateX(-50%) !important;
    }
  }

  // 靠近结束位置：悬浮窗口向左偏移，远离右边界
  &.mark-near-end .mark-popup {
    left: 50%;
    transform: translateX(-95%) translateY(-20px) !important;
    min-width: 180px;
    border-bottom-right-radius: 2px; // 减小右下角圆角，避免空隙

    &::after {
      left: 95%; // 精确指向标记点
      transform: translateX(-50%) !important;
      border-width: 8px; // 增大三角尺寸，填补空隙
      border-top-width: 10px;
    }
  }

  .popup-time {
    font-weight: 600;
    color: #667eea;
    margin-bottom: 4px;
  }

  .popup-card {
    font-size: 11px;
    color: rgba(255, 255, 255, 0.7);
    margin-bottom: 6px;
  }

  .popup-desc {
    font-size: 11px;
    line-height: 1.4;
    color: rgba(255, 255, 255, 0.9);
  }

  // 标记点脉冲动画
  @keyframes pulse-mark {
    0%,
    100% {
      box-shadow: 0 0 15px currentColor;
    }
    50% {
      box-shadow: 0 0 25px currentColor;
    }
  }

  // 单个检测框（业界标准样式：YOLO/OpenCV风格）
  .detection-box {
    position: absolute;
    border-width: 2px;
    border-style: solid;
    border-radius: 2px;
    box-shadow: 0 0 8px rgba(0, 0, 0, 0.4);
    transition: all 0.3s ease;
    animation: fadeIn 0.3s ease;

    // 高置信度框：脉冲动画
    &.high-confidence {
      animation:
        fadeIn 0.3s ease,
        pulse 2s ease-in-out infinite;
    }

    // 标签容器（左上角外部显示，业界标准）
    .detection-label-container {
      position: absolute;
      left: 0;
      bottom: 100%;
      margin-bottom: 2px;
      white-space: nowrap;
    }

    // 顶部检测框：标签切到框内下方，避免被播放器裁切
    &.label-below {
      .detection-label-container {
        bottom: auto;
        top: -1px;
        margin-bottom: 0;
        margin-top: 0;
      }
    }

    // 标签样式
    .detection-label {
      display: inline-flex;
      align-items: center;
      gap: 4px;
      padding: 2px 8px;
      background: var(--detection-color);
      color: #fff;
      font-size: 12px;
      font-weight: 600;
      border-radius: 2px;
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
      font-family:
        "SF Pro Display",
        -apple-system,
        sans-serif;

      .emotion-icon {
        font-size: 14px;
      }

      .confidence-badge {
        font-size: 11px;
        opacity: 0.9;
        color: #fff !important;
      }
    }
  }

  // V1.5: 扫描线特效
  .scanline-effect {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: linear-gradient(
      to bottom,
      transparent 0%,
      rgba(75, 112, 226, 0.03) 50%,
      transparent 100%
    );
    animation: scanline 4s linear infinite;
    pointer-events: none;
    z-index: 1;
  }

  // 实时风险状态指示器（左上角呼吸灯）
  .risk-status-indicator {
    position: absolute;
    top: 12px;
    left: 12px;
    z-index: 20;
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 4px 12px 5px;
    border-radius: 20px;
    font-size: 13px;
    font-weight: 600;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
    transition: all 0.3s ease;

    .breathing-dot {
      width: 10px;
      height: 10px;
      border-radius: 50%;
      flex-shrink: 0;
    }

    .risk-label {
      white-space: nowrap;
      color: #fff !important;
    }

    // 低风险：绿色呼吸灯
    &.low {
      background: rgba(16, 185, 129, 0.95);
      border: 1px solid rgba(16, 185, 129, 1);
      color: #fff;

      .breathing-dot {
        background: #fff;
        box-shadow: 0 0 8px rgba(255, 255, 255, 0.8);
        animation: breathing-green 2s ease-in-out infinite;
      }
    }

    // 中风险：橙色呼吸灯
    &.medium {
      background: rgba(245, 158, 11, 0.95);
      border: 1px solid rgba(245, 158, 11, 1);
      color: #fff;

      .breathing-dot {
        background: #fff;
        box-shadow: 0 0 8px rgba(255, 255, 255, 0.8);
        animation: breathing-orange 1.5s ease-in-out infinite;
      }
    }

    // 高风险：红色呼吸灯
    &.high {
      background: rgba(239, 68, 68, 0.95);
      border: 1px solid rgba(239, 68, 68, 1);
      color: #fff;

      .breathing-dot {
        background: #fff;
        box-shadow: 0 0 10px rgba(255, 255, 255, 0.9);
        animation: breathing-red 1s ease-in-out infinite;
      }
    }
  }

  // CV视觉模态：场景标签容器（右上角）
  .scene-badge-overlay {
    position: absolute;
    top: 12px;
    right: 12px;
    z-index: 20;
    pointer-events: none;
  }

  .scene-badge {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 8px 16px;
    background: rgba(0, 0, 0, 0.7);
    backdrop-filter: blur(10px);
    border-radius: 20px;
    border: 1px solid rgba(255, 255, 255, 0.2);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
    animation: slideInRight 0.4s ease;

    .scene-icon {
      font-size: 20px;
    }

    .scene-content {
      display: flex;
      flex-direction: column;
      gap: 2px;
    }

    .scene-name {
      color: #fff;
      font-size: 14px;
      font-weight: 600;
    }

    .scene-confidence {
      color: rgba(255, 255, 255, 0.7);
      font-size: 11px;
    }
  }

  // CV视觉模态：检测类型图例（左下角，避免遮挡）- 可折叠紧凑模式
  .detection-legend {
    position: absolute;
    top: 380px; /* 默认在左下位置 */
    left: 5px;
    z-index: 20;
    background: rgba(0, 0, 0, 0.75);
    backdrop-filter: blur(8px);
    border-radius: 8px;
    padding: 6px 8px; /* 紧凑模式：从 8px 12px 减少 */
    border: 1px solid rgba(255, 255, 255, 0.1);
    animation: fadeIn 0.5s ease;
    pointer-events: auto;
    transition:
      top 0.4s cubic-bezier(0.4, 0, 0.2, 1),
      opacity 0.3s ease;

    /* 分屏模式：移到顶部，有平滑过渡动画 */
    &.evidence-mode-shift {
      top: 52px; /* 移动到顶部位置 */

      /* 分屏模式下，展开内容向下 */
      .legend-items {
        top: 100%;
        bottom: auto;
        margin-top: 6px;
        margin-bottom: 0;
      }
    }

    /* 收起状态 */
    &.collapsed {
      .legend-header {
        margin-bottom: 0;
      }
    }

    .legend-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 6px; /* 紧凑模式：从 12px 减少 */
      margin-bottom: 4px; /* 紧凑模式：从 6px 减少 */
      cursor: pointer;
      transition: all 0.3s ease;

      &:hover {
        .legend-title-row {
          color: rgba(255, 255, 255, 0.9);
        }
      }
    }

    .legend-title-row {
      display: flex;
      align-items: center;
      gap: 3px;
      color: rgba(255, 255, 255, 0.6);
      transition: color 0.3s ease;
    }

    .legend-title {
      font-size: 10px; /* 紧凑模式：从 11px 减少 */
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    .expand-icon {
      font-size: 10px;
      color: rgba(255, 255, 255, 0.5);
      transition: transform 0.3s ease;
    }

    .detection-toggle {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 22px; /* 紧凑模式：从 24px 减少 */
      height: 22px;
      border-radius: 4px;
      background: rgba(255, 255, 255, 0.1);
      cursor: pointer;
      transition: all 0.3s ease;
      flex-shrink: 0;

      &:hover {
        background: rgba(255, 255, 255, 0.2);
        transform: scale(1.1);
      }

      &.active {
        background: rgba(64, 158, 255, 0.3);
      }

      .toggle-icon {
        font-size: 13px; /* 紧凑模式：从 14px 减少 */
        line-height: 1;
      }
    }

    .legend-items {
      position: absolute;
      left: 0;
      right: 0;
      bottom: 100%; /* 默认向上展开 */
      margin-bottom: 6px;
      display: flex;
      flex-direction: column;
      gap: 3px; /* 紧凑模式：从 4px 减少 */
      background: rgba(0, 0, 0, 0.75);
      backdrop-filter: blur(8px);
      border-radius: 8px;
      padding: 6px 10px;
      border: 1px solid rgba(255, 255, 255, 0.1);
      animation: slideDown 0.3s ease;
      overflow: hidden;
      transition: all 0.3s ease;
    }

    .legend-item {
      display: flex;
      align-items: center;
      gap: 6px; /* 紧凑模式：从 6px 减少 */
    }

    .legend-color {
      width: 10px; /* 紧凑模式：从 12px 减少 */
      height: 10px;
      border-radius: 2px;
      border: 1px solid rgba(255, 255, 255, 0.3);
      flex-shrink: 0;
    }

    .legend-label {
      color: #fff;
      font-size: 11px; /* 紧凑模式：从 12px 减少 */
    }
  }

  // 当前帧信息叠加层（视频顶部）
  .frame-info-overlay {
    position: absolute;
    top: 12px;
    left: 12px;
    right: 12px;
    z-index: 3;
    pointer-events: none;

    .info-tags-row {
      display: flex;
      gap: 8px;
      flex-wrap: wrap;

      .info-tag {
        display: inline-flex;
        align-items: center;
        gap: 5px;
        padding: 5px 12px;
        border-radius: 10px;
        font-size: 11px;
        font-weight: 600;
        backdrop-filter: blur(8px);
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);

        &.emotion {
          &.emotion-angry {
            background: rgba(245, 108, 108, 0.9);
            color: white;
          }

          &.emotion-calm {
            background: rgba(82, 196, 26, 0.9);
            color: white;
          }

          &.emotion-tense,
          &.emotion-serious {
            background: rgba(250, 173, 20, 0.9);
            color: white;
          }
        }

        &.risk-alert {
          background: rgba(245, 108, 108, 0.95);
          color: white;
          animation: pulse-glow 1.5s ease-in-out infinite;
        }
      }
    }
  }

  // V1.5: 伪进度条
  .fake-controls {
    position: absolute;
    bottom: 0;
    left: 0;
    right: 0;
    height: 48px;
    background: rgba(0, 0, 0, 0.75);
    backdrop-filter: blur(8px);
    display: flex;
    align-items: center;
    padding: 0 16px;
    gap: 12px;
    z-index: 2;

    .control-left,
    .control-right {
      display: flex;
      align-items: center;
      gap: 10px;
      color: white;
    }

    .control-icon {
      font-size: 16px;
      cursor: default;
      opacity: 0.85;
      transition: opacity 0.2s;

      &:hover {
        opacity: 1;
      }
    }

    .time-display {
      font-size: 12px;
      font-family: monospace;
      color: rgba(255, 255, 255, 0.9);
      min-width: 80px;
    }

    .progress-bar-wrapper {
      flex: 1;
      display: flex;
      align-items: center;
    }

    .progress-bar {
      width: 100%;
      height: 5px;
      background: rgba(255, 255, 255, 0.25);
      border-radius: 3px;
      overflow: hidden;
      position: relative;

      .progress-now {
        height: 100%;
        background: linear-gradient(90deg, $purple, #7c9df7);
        border-radius: 3px;
        transition: width 0.5s ease;
        box-shadow: 0 0 8px rgba(75, 112, 226, 0.6);
        position: relative;

        &::after {
          content: "";
          position: absolute;
          right: 0;
          top: 0;
          width: 8px;
          height: 100%;
          background: rgba(255, 255, 255, 0.4);
          border-radius: 0 3px 3px 0;
        }
      }
    }
  }
}

// V1.5: 关键帧动画定义
@keyframes pulse-glow {
  0%,
  100% {
    box-shadow:
      0 0 10px rgba(245, 108, 108, 0.8),
      0 0 20px rgba(245, 108, 108, 0.4);
  }
  50% {
    box-shadow:
      0 0 20px rgba(245, 108, 108, 1),
      0 0 35px rgba(245, 108, 108, 0.7),
      0 0 50px rgba(245, 108, 108, 0.4);
  }
}

@keyframes scanline {
  0% {
    transform: translateY(-100%);
  }
  100% {
    transform: translateY(100%);
  }
}

@keyframes pulse-dot {
  0%,
  100% {
    opacity: 1;
    transform: scale(1);
  }
  50% {
    opacity: 0.4;
    transform: scale(0.8);
  }
}

// 呼吸灯动画 - 绿色（低风险）
@keyframes breathing-green {
  0%,
  100% {
    box-shadow: 0 0 6px rgba(16, 185, 129, 0.6);
    opacity: 1;
  }
  50% {
    box-shadow:
      0 0 12px rgba(16, 185, 129, 0.9),
      0 0 20px rgba(16, 185, 129, 0.4);
    opacity: 0.7;
  }
}

// 呼吸灯动画 - 橙色（中风险）
@keyframes breathing-orange {
  0%,
  100% {
    box-shadow: 0 0 8px rgba(245, 158, 11, 0.6);
    opacity: 1;
  }
  50% {
    box-shadow:
      0 0 16px rgba(245, 158, 11, 0.9),
      0 0 24px rgba(245, 158, 11, 0.5);
    opacity: 0.6;
  }
}

// 呼吸灯动画 - 红色（高风险）
@keyframes breathing-red {
  0%,
  100% {
    box-shadow: 0 0 10px rgba(239, 68, 68, 0.8);
    opacity: 1;
  }
  50% {
    box-shadow:
      0 0 20px rgba(239, 68, 68, 1),
      0 0 30px rgba(239, 68, 68, 0.6);
    opacity: 0.5;
  }
}

// CV视觉模态：检测框动画（业界标准）
@keyframes fadeIn {
  from {
    opacity: 0;
    transform: scale(0.95);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}

// 图例展开动画
@keyframes slideDown {
  from {
    opacity: 0;
    max-height: 0;
    transform: translateY(-5px);
  }
  to {
    opacity: 1;
    max-height: 300px;
    transform: translateY(0);
  }
}

@keyframes pulse {
  0%,
  100% {
    box-shadow: 0 0 8px rgba(0, 0, 0, 0.4);
  }
  50% {
    box-shadow: 0 0 20px var(--detection-color);
  }
}

@keyframes slideInRight {
  from {
    opacity: 0;
    transform: translateX(20px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}

.video-meta-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  background: $neu-1;
  border-radius: 16px;
  box-shadow:
    4px 4px 8px $neu-2,
    -4px -4px 8px $white;
  gap: 12px;
  flex-wrap: wrap;

  .video-title-info {
    display: flex;
    align-items: center;
    gap: 10px;
    flex: 1;

    .title-text {
      font-size: 15px;
      font-weight: 600;
      color: $black;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    // V1.5: AI实时分析状态指示器
    .ai-status-badge {
      padding: 4px 10px;
      border-radius: 12px;
      font-size: 11px;
      font-weight: 600;
      background: rgba(75, 112, 226, 0.12);
      color: $purple;
      display: inline-flex;
      align-items: center;
      gap: 6px;

      .pulse-dot {
        width: 6px;
        height: 6px;
        border-radius: 50%;
        background: $purple;
        animation: pulse-dot 1.5s ease-in-out infinite;
      }
    }
  }

  .video-stats {
    display: flex;
    gap: 10px;

    .risk-badge {
      padding: 6px 12px;
      border-radius: 12px;
      font-size: 12px;
      font-weight: 600;

      &.risk-high {
        background: rgba(245, 108, 108, 0.15);
        color: #f56c6c;
      }

      &.risk-medium {
        background: rgba(250, 173, 20, 0.15);
        color: #faad14;
      }

      &.risk-low {
        background: rgba(82, 196, 26, 0.15);
        color: #52c41a;
      }
    }

    .score-badge {
      padding: 6px 12px;
      border-radius: 12px;
      font-size: 12px;
      font-weight: 600;
      background: rgba(75, 112, 226, 0.15);
      color: $purple;
    }
  }
}

// 台词面板
.transcript-panel {
  display: flex;
  flex-direction: column;
  background: var(--bg-card);
  border: 1px solid var(--border-color);
  border-radius: 20px;
  box-shadow: none;
  overflow: hidden;
  max-height: 480px;

  .panel-header-compact {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 8px 16px;
    border-bottom: 1px solid var(--border-color);
    background: var(--bg-card);
    flex-wrap: wrap;
    gap: 8px;

    .panel-title-compact {
      font-size: 13px;
      font-weight: 600;
      color: $black;
      display: flex;
      align-items: center;
      gap: 6px;
    }

    .detection-badge {
      display: inline-flex;
      align-items: center;
      gap: 4px;
      padding: 4px 10px;
      background: rgba(75, 112, 226, 0.1);
      border-radius: 8px;
      font-size: 10px;
      font-weight: 600;
      color: $purple;
    }

    // 头部操作按钮组（包含筛选器和同步按钮）
    .header-actions-group {
      display: flex;
      align-items: center;
      gap: 12px;
    }

    // 风险过滤器按钮组
    .risk-filter-group {
      display: flex;
      gap: 6px;

      .filter-btn {
        padding: 4px 12px;
        font-size: 11px;
        font-weight: 600;
        border: 1px solid var(--border-color);
        border-radius: 6px;
        background: var(--bg-card);
        color: var(--text-secondary);
        cursor: pointer;
        transition: all 0.2s ease;
        display: inline-flex;
        align-items: center;
        gap: 4px;

        &:hover {
          border-color: $purple;
          color: $purple;
          background: rgba($purple, 0.05);
        }

        &.active {
          border-color: $purple;
          background: $purple;
          color: #fff;
          box-shadow: 0 2px 6px rgba($purple, 0.25);
        }

        // 【新增】模态筛选器特定样式
        &.modality-filter {
          &.risk.active {
            border-color: #f56c6c;
            background: linear-gradient(135deg, #f56c6c, #ff8a80);
            color: white;
            box-shadow: 0 2px 8px rgba(245, 108, 108, 0.35);
          }

          &.speech.active {
            border-color: #52c41a;
            background: linear-gradient(135deg, #52c41a, #73d13d);
            color: white;
            box-shadow: 0 2px 8px rgba(82, 196, 26, 0.35);
          }
        }
      }
    }

    // 同步控制按钮
    .sync-control-btn {
      display: flex;
      align-items: center;
      gap: 4px;
      padding: 4px 12px;
      font-size: 11px;
      font-weight: 600;
      border: 1px solid rgba(250, 173, 20, 0.6);
      border-radius: 6px;
      background: rgba(250, 173, 20, 0.1);
      color: #f59e0b;
      cursor: pointer;
      transition: all 0.2s ease;
      white-space: nowrap;

      &:hover {
        border-color: #f59e0b;
        background: rgba(250, 173, 20, 0.15);
        transform: translateY(-1px);
        box-shadow: 0 2px 6px rgba(250, 173, 20, 0.25);

        .resume-text {
          opacity: 1;
          max-width: 40px;
          margin-left: 4px;
        }
      }

      .resume-text {
        opacity: 0;
        max-width: 0;
        overflow: hidden;
        transition: all 0.2s ease;
        margin-left: 0;
      }
    }
  }

  .transcript-list {
    flex: 1;
    overflow-y: auto;
    padding: 16px 16px 16px 24px; // 左侧减少padding为时间线留空间
    position: relative; // 支持垂直时间线的绝对定位

    &::-webkit-scrollbar {
      width: 6px;
    }

    &::-webkit-scrollbar-thumb {
      background: rgba(160, 165, 168, 0.3);
      border-radius: 3px;
    }
  }

  .transcript-segment {
    position: relative;
    padding: 12px 14px;
    margin-bottom: 10px;
    background: $bg;
    border-radius: 10px;
    border-left: 4px solid transparent;
    cursor: pointer;
    transition: all 0.25s ease;

    &:hover {
      background: var(--bg-card);
      transform: translateX(-4px);
      box-shadow: none;
    }

    &.active {
      background: var(--bg-card);
      border-left-color: $purple;
      box-shadow: none;
      transform: scale(1.02);
    }

    // 已结束状态：降低亮度，保持上下文但视觉上区分
    &.inactive {
      opacity: 0.5;
      transform: scale(1);

      &::after {
        content: "已结束";
        position: absolute;
        top: 8px;
        right: 8px;
        font-size: 10px;
        color: $gray;
        background: rgba($neu-2, 0.5);
        padding: 2px 8px;
        border-radius: 4px;
      }
    }

    &.high-risk {
      background: rgba(245, 108, 108, 0.08);

      &.active {
        border-left-color: #f56c6c;
      }
    }

    &.medium-risk {
      background: rgba(250, 173, 20, 0.08);

      &.active {
        border-left-color: #faad14;
      }
    }

    .segment-header {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-bottom: 8px;
      flex-wrap: wrap;

      .time-range {
        font-size: 11px;
        color: $gray;
        font-family: monospace;
      }

      .emotion-badge {
        padding: 3px 8px;
        border-radius: 8px;
        font-size: 10px;
        font-weight: 600;

        &.emotion-calm {
          background: rgba(82, 196, 26, 0.15);
          color: #52c41a;
        }

        &.emotion-angry {
          background: rgba(245, 108, 108, 0.15);
          color: #f56c6c;
        }

        &.emotion-tense {
          background: rgba(250, 173, 20, 0.15);
          color: #faad14;
        }

        &.emotion-serious {
          background: rgba(75, 112, 226, 0.15);
          color: $purple;
        }
      }

      .risk-tag {
        padding: 3px 8px;
        border-radius: 8px;
        font-size: 10px;
        font-weight: 600;

        &.high {
          background: #f56c6c;
          color: white;
        }

        &.medium {
          background: #faad14;
          color: white;
        }
      }
    }

    .segment-text {
      font-size: 13px;
      color: $black;
      line-height: 1.7;
      word-break: break-word;

      :deep(.risk-keyword) {
        color: #f56c6c;
        font-weight: 700;
        background: rgba(245, 108, 108, 0.2);
        padding: 2px 6px;
        border-radius: 4px;
        display: inline-block;
        margin: 0 2px;
      }
    }

    // Gemini优化：音频特征标签
    .audio-features {
      display: flex;
      flex-wrap: wrap;
      gap: 6px;
      margin-top: 8px;

      .audio-feature-tag {
        display: inline-flex;
        align-items: center;
        gap: 4px;
        padding: 3px 8px;
        border-radius: 8px;
        font-size: 10px;
        font-weight: 500;

        &.emotion-angry {
          background: rgba(245, 108, 108, 0.12);
          color: #f56c6c;
          border: 1px solid rgba(245, 108, 108, 0.3);
        }

        &.emotion-calm {
          background: rgba(82, 196, 26, 0.12);
          color: #52c41a;
          border: 1px solid rgba(82, 196, 26, 0.3);
        }

        &.emotion-tense,
        &.emotion-serious {
          background: rgba(250, 173, 20, 0.12);
          color: #faad14;
          border: 1px solid rgba(250, 173, 20, 0.3);
        }

        &.volume {
          background: rgba(245, 108, 108, 0.12);
          color: #f56c6c;
          border: 1px solid rgba(245, 108, 108, 0.3);
        }

        &.pitch {
          background: rgba(250, 173, 20, 0.12);
          color: #faad14;
          border: 1px solid rgba(250, 173, 20, 0.3);
        }
      }
    }

    // V1.5: 检测信息样式
    .detection-info {
      display: flex;
      align-items: center;
      gap: 6px;
      margin-top: 8px;
      padding: 6px 10px;
      background: rgba(245, 108, 108, 0.08);
      border-radius: 8px;
      font-size: 11px;
      color: #f56c6c;
      font-weight: 500;
      border-left: 3px solid #f56c6c;
    }
  }

  // 【极简转录文稿】垂直时间线
  .timeline-vertical-line {
    position: absolute;
    left: 50px;
    top: 0;
    bottom: 0;
    width: 2px;
    background: linear-gradient(
      to bottom,
      transparent 0%,
      rgba($neu-2, 0.3) 5%,
      rgba($neu-2, 0.3) 95%,
      transparent 100%
    );
    z-index: 0;
  }

  // 【极简转录文稿】事件项
  .timeline-event-item {
    position: relative;
    display: flex;
    align-items: flex-start;
    gap: 16px;
    margin-bottom: 4px; // 压缩间距
    padding: 6px 0; // 最小化内边距
    cursor: pointer;
    transition: all 0.2s ease;

    &:hover {
      .event-timeline-anchor .event-dot {
        transform: scale(1.3);
      }
    }

    &.is-active {
      .event-timeline-anchor .event-dot {
        transform: scale(1.5);
      }

      .event-body {
        // 激活态微动画：轻微右移
        transform: translateX(2px);
      }

      // 【双轨编码】激活态外发光 = 风险色
      &.risk-high .event-timeline-anchor .event-dot {
        box-shadow: 0 0 0 4px rgba(245, 108, 108, 0.25); // 红色外发光
      }

      &.risk-medium .event-timeline-anchor .event-dot {
        box-shadow: 0 0 0 4px rgba(250, 173, 20, 0.25); // 橙色外发光
      }

      &.risk-low .event-timeline-anchor .event-dot {
        box-shadow: 0 0 0 4px rgba(82, 196, 26, 0.25); // 绿色外发光
      }
    }

    // 时间锚点
    .event-timeline-anchor {
      position: relative;
      display: flex;
      align-items: center;
      gap: 8px;
      flex-shrink: 0;
      width: 70px;
      z-index: 1;

      .event-time {
        font-size: 10px;
        color: $gray;
        font-family: "Monaco", "Consolas", monospace;
        font-weight: 500;
        text-align: right;
        width: 42px;
      }

      .event-dot {
        width: 20px;
        height: 20px;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        border: 2px solid transparent;
        transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
        box-shadow: 0 2px 4px rgba($neu-2, 0.3);
        color: white; // 【统一】图标颜色为白色

        // 【双轨编码】圆点背景色 = 风险等级（所有模态统一）
        &.risk-high {
          background: #f56c6c; // 红色背景
          border-color: #f56c6c;
        }

        &.risk-medium {
          background: #faad14; // 橙色背景
          border-color: #faad14;
        }

        &.risk-low {
          background: #52c41a; // 绿色背景
          border-color: #52c41a;
        }
      }
    }

    // 内容区
    .event-body {
      flex: 1;
      transition: all 0.2s ease;
    }

    // 【Speech】字幕式大字排版
    &.modality-speech {
      padding: 8px 0; // Speech 增加些许垂直空间

      .speech-transcript {
        font-size: 15px; // 大字号
        line-height: 1.8;
        color: $black;
        font-weight: 400;
        word-break: break-word;

        :deep(.risk-keyword) {
          color: #f56c6c;
          font-weight: 700;
          background: rgba(245, 108, 108, 0.15);
          padding: 2px 6px;
          border-radius: 4px;
        }
      }

      .speech-meta {
        display: flex;
        align-items: center;
        gap: 6px;
        margin-top: 6px;

        .meta-tag {
          padding: 2px 8px;
          border-radius: 4px;
          font-size: 10px;
          font-weight: 600;

          &.risk {
            &.risk-high {
              background: rgba(245, 108, 108, 0.15);
              color: #f56c6c;
            }

            &.risk-medium {
              background: rgba(250, 173, 20, 0.15);
              color: #faad14;
            }
          }

          &.info {
            background: rgba(64, 158, 255, 0.15);
            color: #409eff;
            cursor: help;
            padding: 2px 6px;

            &:hover {
              background: rgba(64, 158, 255, 0.25);
            }
          }
        }
      }
    }

    // 【Visual/AudioEffect】系统通知式紧凑排版
    &.modality-visual,
    &.modality-audio-effect {
      .system-notification {
        display: inline-block;
        max-width: 85%;
        padding: 6px 12px; // 紧凑内边距
        border-radius: 6px;
        border-left: 3px solid;
        transition: all 0.2s ease;

        // 【模态色标系统】蓝色系 - Visual
        &.notif-visual {
          border-color: #3b82f6;
          background: rgba(59, 130, 246, 0.05); // 5%透明度蓝色背景
        }

        // 【模态色标系统】琥珀色系 - AudioEffect
        &.notif-audio-effect {
          border-color: #f59e0b;
          background: rgba(245, 158, 11, 0.05); // 5%透明度琥珀色背景
        }

        .notif-main {
          display: flex;
          align-items: baseline;
          gap: 6px;

          .notif-badge {
            font-size: 11px;
            font-weight: 700;
            flex-shrink: 0;
          }

          .notif-label {
            font-size: 12px; // 小字号
            line-height: 1.5;
            color: var(--text-primary);
            font-weight: 400; // 浅色模式更细腻

            [data-theme='dark'] & {
              font-weight: 500; // 深色模式恢复可读性
            }
          }
        }

        // 【模态色标】显式标签颜色
        &.notif-visual .notif-badge {
          color: #3b82f6; // 蓝色
        }

        &.notif-audio-effect .notif-badge {
          color: #f59e0b; // 琥珀色
        }

        .notif-detail {
          display: flex;
          align-items: center;
          gap: 6px;
          margin-top: 4px;
          padding-top: 4px;
          border-top: 1px solid rgba($neu-2, 0.15);

          .detail-chip {
            padding: 1px 6px;
            border-radius: 3px;
            font-size: 9px;
            font-weight: 600;
            background: var(--bg-hover);
            color: var(--text-secondary);

            &.risk {
              &.risk-high {
                background: rgba(245, 108, 108, 0.15);
                color: #f56c6c;
              }

              &.risk-medium {
                background: rgba(250, 173, 20, 0.15);
                color: #faad14;
              }
            }

            &.info {
              background: rgba(64, 158, 255, 0.15);
              color: #409eff;
              cursor: help;

              &:hover {
                background: rgba(64, 158, 255, 0.25);
              }
            }
          }
        }
      }
    }
  }

  // 展开动画
  .expand-enter-active,
  .expand-leave-active {
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    max-height: 100px;
    overflow: hidden;
  }

  .expand-enter-from,
  .expand-leave-to {
    max-height: 0;
    opacity: 0;
    margin-top: 0;
  }

  .empty-transcript {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 60px 20px;
    color: $gray;

    p {
      margin-top: 12px;
      font-size: 13px;
    }
  }
}

// 多轨道时间轴
.multi-track-timeline {
  margin-bottom: 24px;

  .card-subtitle {
    font-size: 11px;
    color: $gray;
    font-weight: 400;
  }

  .timeline-content {
    padding: 16px 20px;
  }

  .timeline-chart {
    height: 180px;
    width: 100%;
  }
}

// 内联时间轴（去背景版，优化间距和高度）
.multi-track-timeline-inline {
  margin: -10px 0 16px -5px; // 上间距减小，与视频更紧凑
  padding: 0;

  .timeline-chart-inline {
    height: 300px; // 增加高度，填补空白
    width: 100%;
  }
}

// 底部仪表盘横向布局（两栏）
.bottom-dashboard-grid {
  margin-top: 20px;
}

// 仪表盘雷达图（紧凑版）
.dashboard-radar {
  .card-header-compact {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 12px 16px 8px;
    border-bottom: 1px solid var(--border-color);

    .card-title-compact {
      font-size: 13px;
      font-weight: 600;
      color: $black;
      display: flex;
      align-items: center;
      gap: 6px;
    }

    .current-frame-badge-small {
      font-size: 14px;
      font-weight: 600;
      color: $gray;
      display: flex;
      align-items: center;
      gap: 4px;
    }
  }

  .radar-container {
    display: flex;
    flex-direction: column;
    padding: 10px 12px 8px 12px;

    .radar-with-score {
      display: flex;
      align-items: center;
      padding-left: 30px;
      margin-bottom: 12px;

      .radar-chart-area {
        flex: 0 0 350px;
        max-width: 350px;

        .radar-chart-compact {
          height: 220px;
          width: 100%;
        }
      }

      .score-side-panel {
        flex: 1;
        display: flex;
        margin-left: -40px;
        flex-direction: column;
        align-items: center;
        justify-content: center;

        .score-number-side {
          font-size: 64px;
          font-weight: 700;
          line-height: 1;
          margin-top: -12px;
          margin-bottom: 4px;
          transition: color 0.3s ease;

          &.low {
            color: #10b981;
          } // 绿色
          &.medium {
            color: #f59e0b;
          } // 橙色
          &.high {
            color: #ef4444;
          } // 红色
        }

        .score-label-side {
          font-size: 13px;
          color: $gray;
          font-weight: 500;
        }
      }
    }

    .fusion-formula-compact {
      text-align: center;
      font-size: 11px;
      color: $gray;
      padding: 8px 16px;
      background: rgba($purple, 0.05);
      border-radius: 8px;
      line-height: 1.6;
    }
  }
}

// 仪表盘信息面板（右侧）
.dashboard-info-panel {
  display: flex;
  flex-direction: column;
  gap: 16px;

  .ai-profiling-compact,
  .global-stats-compact {
    flex: 1;

    .card-header-compact {
      padding: 12px 16px;
      border-bottom: 1px solid var(--border-color);
      display: flex;
      justify-content: space-between;
      align-items: center;

      .card-title-compact {
        font-size: 13px;
        font-weight: 600;
        color: $black;
        display: flex;
        align-items: center;
        gap: 6px;
      }

      .profiling-hint-small {
        font-size: 10px;
        color: $gray;
      }
    }

    .profiling-content-compact {
      padding: 12px 16px;

      .profiling-section-inline {
        margin-bottom: 12px;

        &:last-child {
          margin-bottom: 0;
        }

        .section-title-small {
          font-size: 11px;
          font-weight: 600;
          color: $gray;
          margin-bottom: 8px;
          display: flex;
          align-items: center;
          gap: 4px;
        }

        .keyword-chips-small {
          display: flex;
          flex-wrap: wrap;
          gap: 6px;

          .keyword-chip-small {
            padding: 3px 8px;
            background: linear-gradient(135deg, #667eea20 0%, #764ba220 100%);
            border-radius: 10px;
            font-size: 11px;
            color: #667eea;
            font-weight: 500;
          }
        }

        .feature-chips-small {
          display: flex;
          flex-wrap: wrap;
          gap: 6px;

          .feature-chip-small {
            padding: 3px 8px;
            background: var(--bg-hover);
            border-radius: 10px;
            font-size: 11px;
            color: var(--text-secondary);
            display: flex;
            align-items: center;
            gap: 4px;
          }
        }
      }
    }

    .global-stats-grid-compact {
      padding: 12px 16px;
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 12px;

      .stat-item-compact {
        text-align: center;

        .stat-label-compact {
          font-size: 11px;
          color: $gray;
          margin-bottom: 4px;
        }

        .stat-value-compact {
          font-size: 18px;
          font-weight: 700;
          color: $black;

          &.risk-high {
            color: #f56c6c;
          }
        }
      }
    }
  }
}

// 全局统计汇总（置顶版，4列横向布局）
.global-stats-top {
  .card-header-compact {
    padding: 12px 16px;
    border-bottom: 1px solid var(--border-color);
    display: flex;
    justify-content: space-between;
    align-items: center;

    .card-title-compact {
      font-size: 13px;
      font-weight: 600;
      color: $black;
      display: flex;
      align-items: center;
      gap: 6px;
    }
  }

  .global-stats-grid-top {
    padding: 16px;
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 16px;

    @media (max-width: 1200px) {
      grid-template-columns: repeat(2, 1fr);
    }

    .stat-item-compact {
      text-align: center;

      .stat-label-compact {
        font-size: 12px;
        color: $gray;
        margin-bottom: 6px;
      }

      .stat-value-compact {
        font-size: 20px;
        font-weight: 700;
        color: $black;

        &.risk-high {
          color: #f56c6c;
        }
      }
    }
  }
}

// 统计摘要网格
.stats-summary-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 20px;

  @media (max-width: 1200px) {
    grid-template-columns: repeat(2, 1fr);
  }

  @media (max-width: 600px) {
    grid-template-columns: 1fr;
  }

  .stat-summary {
    display: flex;
    align-items: center;
    gap: 14px;
    padding: 18px;

    .stat-icon {
      width: 50px;
      height: 50px;
      border-radius: 14px;
      display: flex;
      align-items: center;
      justify-content: center;

      &.video-icon {
        background: rgba(245, 108, 108, 0.12);
        color: #f56c6c;
      }

      &.audio-icon {
        background: rgba(250, 173, 20, 0.12);
        color: #faad14;
      }

      &.text-icon {
        background: rgba(75, 112, 226, 0.12);
        color: $purple;
      }

      &.university-icon {
        background: rgba(82, 196, 26, 0.12);
        color: #52c41a;
      }
    }

    .stat-content {
      flex: 1;

      .stat-value {
        font-size: 24px;
        font-weight: 700;
        color: $black;
        line-height: 1;
      }

      .stat-label {
        font-size: 12px;
        color: $gray;
        margin-top: 6px;
      }
    }
  }
}

/* 视频内容特征样式 */
.duration-badge {
  position: absolute;
  top: 0;
  right: 0;
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 4px 10px;
  background: rgba(64, 158, 255, 0.1);
  border-radius: 6px;
  font-size: 12px;
  color: #409eff;
  white-space: nowrap; // 确保不换行
}

.video-description {
  margin: 0 0 10px 0;
  line-height: 1.6;
}

.description-label {
  font-size: 12px;
  color: $purple;
  font-weight: 600;
}

.description-text {
  font-size: 12px;
  color: var(--text-secondary);
  line-height: 1.6;
}

.content-features-row,
.detected-keywords-row {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 10px;
  flex-wrap: wrap;
}

.feature-label {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-size: 13px;
  color: var(--text-secondary);
  font-weight: 600;
  min-width: 100px;
}

.keywords-container {
  display: flex;
  gap: 2px;
  flex-wrap: wrap;
  flex: 1;
  align-items: center;
}

.keyword-tag-detected {
  display: inline-flex;
  align-items: center;
  padding: 2px 8px;
  background: transparent;
  border: none;
  border-radius: 4px;
  font-size: 12px;
  color: var(--text-secondary);
  box-shadow: none;
  cursor: default;
  transition: color 0.15s;
}

.keyword-tag-detected:hover {
  color: var(--text-primary);
}

.keyword-tag-detected.university-related {
  background: transparent;
  border: none;
  box-shadow: none;
  color: #b07d1a;
  font-weight: 600;
}

/* 词库包标签样式 */
.word-packs-row {
  margin-top: 4px;
}

.word-pack-tag {
  gap: 5px;
  cursor: pointer;
  font-weight: 500;
}

.word-pack-tag .pack-word-count {
  opacity: 0.5;
  font-size: 11px;
  margin-left: 1px;
}

.word-pack-tag.pack-level-high {
  background: transparent;
  border: none;
  box-shadow: none;
  color: #c0392b;
}

.word-pack-tag.pack-level-medium {
  background: transparent;
  border: none;
  box-shadow: none;
  color: #b07d1a;
}

.word-pack-tag.pack-level-low {
  background: transparent;
  border: none;
  box-shadow: none;
  color: #2d7a1f;
}

/* 词库包悬浮提示样式 */
.pack-tooltip-content {
  max-width: 260px;
  padding: 2px 0;
}

.pack-tooltip-header {
  font-weight: 600;
  font-size: 13px;
  margin-bottom: 5px;
  color: var(--text-primary);
}

.pack-tooltip-desc {
  font-size: 12px;
  color: var(--text-tertiary);
  margin-bottom: 8px;
  line-height: 1.5;
}

.pack-tooltip-words {
  display: flex;
  flex-wrap: wrap;
  gap: 0;
  margin-top: 2px;
}

.pack-tooltip-word {
  display: inline-block;
  padding: 0;
  background: transparent;
  border-radius: 0;
  font-size: 12px;
  color: var(--text-secondary);
  line-height: 1.8;
  box-shadow: none;
}

.pack-tooltip-word::after {
  content: '、';
  color: var(--text-tertiary);
}

.pack-tooltip-word:last-child::after {
  content: '';
}

.pack-tooltip-empty {
  font-size: 12px;
  color: var(--text-tertiary);
}

/* AI 侧写相关样式 */
.ai-profile-row {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
}

.identity-badge {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 4px 10px;
  border-radius: 6px;
  font-size: 12px;
  font-weight: 700;
  margin-left: 12px;
}
.identity-badge.identity-suspected {
  background: #fef0f0;
  color: #f56c6c;
  border: 1px solid #fde2e2;
}

.profile-tag {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 2px 8px;
  background: var(--bg-hover);
  color: var(--text-secondary);
  border: 1px solid var(--border-color);
  border-radius: 4px;
  font-size: 11px;
}

.keyword-tag-mini {
  font-size: 11px;
  color: #4b70e2;
  background: rgba(75, 112, 226, 0.1);
  padding: 2px 6px;
  border-radius: 4px;
}

.divider-vertical {
  color: #dcdfe6;
  margin: 0 4px;
  font-size: 10px;
}

/* --- Data Ribbon 一体化状态栏样式 --- */
.stats-ribbon-container {
  display: flex;
  align-items: center;
  background: rgba(255, 255, 255, 0.7);
  border: 1px solid #ebeef5;
  border-radius: 12px;
  padding: 10px 0;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.03);
  height: auto;
  min-height: 70px;
}

.ribbon-item {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  padding: 0 20px;
  transition: all 0.3s ease;
}

.ribbon-item:hover {
  background-color: #fafafa;
}

.ribbon-divider {
  width: 1px;
  height: 40px;
  background: var(--border-color);
}

/* 图标容器 */
.ribbon-icon-wrapper {
  width: 42px;
  height: 42px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
  flex-shrink: 0;
}

.icon-risk {
  background: rgba(245, 108, 108, 0.1);
  color: #f56c6c;
}

.icon-uni {
  background: rgba(64, 158, 255, 0.1);
  color: #409eff;
}

.icon-warn {
  background: rgba(230, 162, 60, 0.1);
  color: #e6a23c;
}

.icon-emotion {
  background: rgba(103, 194, 58, 0.1);
  color: #67c23a;
}

/* 内容区域 */
.ribbon-content {
  display: flex;
  flex-direction: column;
  justify-content: center;
}

.ribbon-label {
  font-size: 11px;
  color: var(--text-tertiary);
  margin-bottom: 2px;
}

.ribbon-value {
  font-size: 18px;
  font-weight: 700;
  color: #303133;
  line-height: 1.2;
  display: flex;
  align-items: center;
  gap: 6px;
}

.ribbon-value .unit {
  font-size: 12px;
  color: var(--text-tertiary);
  font-weight: 400;
}

.ribbon-sub-text {
  font-size: 10px;
  color: #409eff;
  margin-top: 2px;
}

/* 特殊文字颜色 */
.text-risk {
  color: #f56c6c;
}

.text-uni {
  color: #409eff;
}

.ribbon-badge {
  font-size: 10px;
  background: #f56c6c;
  color: white;
  padding: 1px 5px;
  border-radius: 4px;
  vertical-align: middle;
}

/* --- 修复版：极简无框统计样式 --- */
/* 容器：完全透明，靠右对齐 */
.minimal-stats-row {
  display: flex;
  align-items: center;
  justify-content: flex-end; /* 靠右 */
  gap: 32px; /* 大间距，代替分割线 */
  background: transparent !important; /* 移除背景 */
  border: none !important; /* 移除边框 */
  box-shadow: none !important; /* 移除阴影 */
  padding: 0;
  height: auto;
}

/* 单个数据组 */
.stat-group {
  display: flex;
  align-items: center;
  gap: 10px;
}

/* 浮动图标：变小，变淡 */
.stat-icon-floating {
  font-size: 24px;
  color: #d1d9e6; /* 与背景融合的灰色 */
}

.group-risk .stat-icon-floating {
  color: rgba(245, 108, 108, 0.3);
}

.group-uni .stat-icon-floating {
  color: rgba(64, 158, 255, 0.3);
}

/* 文本列 */
.stat-text-col {
  display: flex;
  flex-direction: column;
}

/* 极小标签 */
.stat-label-tiny {
  font-size: 10px;
  color: var(--text-tertiary);
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin-bottom: 2px;
}

/* 数值样式：纯排版冲击力 */
.stat-value-huge {
  font-size: 24px;
  font-weight: 800;
  line-height: 1;
  display: flex;
  align-items: center;
  gap: 6px;
}

.stat-value-large {
  font-size: 18px;
  font-weight: 700;
  color: #303133;
}

.stat-value-medium {
  font-size: 18px;
  font-weight: 600;
  color: var(--text-secondary);
}

.unit-text {
  font-size: 12px;
  color: var(--text-tertiary);
  font-weight: 400;
}

/* 颜色强调 */
.text-risk {
  color: #f56c6c;
}

.text-uni {
  color: #409eff;
}

/* 呼吸红点（替代复杂的 Badge） */
.risk-dot {
  width: 8px;
  height: 8px;
  background: #f56c6c;
  border-radius: 50%;
  display: inline-block;
  box-shadow: 0 0 0 0 rgba(245, 108, 108, 0.7);
  animation: pulse-red 2s infinite;
}

@keyframes pulse-red {
  0% {
    box-shadow: 0 0 0 0 rgba(245, 108, 108, 0.7);
  }
  70% {
    box-shadow: 0 0 0 6px rgba(245, 108, 108, 0);
  }
  100% {
    box-shadow: 0 0 0 0 rgba(245, 108, 108, 0);
  }
}

/* --- V4 最终版：彩色胶囊样式 --- */
/* 1. 大容器：半透明白色底座 */
.stats-ribbon-container {
  display: flex;
  align-items: center;
  background: rgba(255, 255, 255, 0.7);
  border-radius: 16px; /* 更圆润 */
  padding: 6px; /* 内边距，让胶囊悬浮 */
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.04); /* 恢复阴影 */
  gap: 8px; /* 胶囊之间的间距 */
  height: auto;
  border: 1px solid rgba(255, 255, 255, 0.6);
}

/* 2. 通用胶囊块 */
.stat-capsule {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 16px;
  border-radius: 12px;
  transition: all 0.2s;
  height: 56px;
}

/* 3. 红色胶囊 (风险) */
.capsule-risk {
  background: #fef2f2; /* 浅红背景 */
  border: 1px solid #fee2e2;
}

.capsule-risk .capsule-icon {
  color: #f56c6c;
  background: rgba(255, 255, 255, 0.6);
}

.text-risk {
  color: #f56c6c;
  font-weight: 800;
}

/* 4. 蓝色胶囊 (高校) */
.capsule-uni {
  background: #ecf5ff; /* 浅蓝背景 */
  border: 1px solid #d9ecff;
}

.capsule-uni .capsule-icon {
  color: #409eff;
  background: rgba(255, 255, 255, 0.6);
}

.text-uni {
  color: #409eff;
  font-weight: 700;
}

/* 5. 普通胶囊 (透明) */
.capsule-normal {
  background: transparent;
  padding-left: 12px;
  border: 1px solid transparent;
}

.capsule-normal:hover {
  background: var(--bg-hover);
}

/* 内部元素细节 */
.capsule-icon {
  width: 32px;
  height: 32px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 16px;
}

.capsule-content {
  display: flex;
  flex-direction: column;
  justify-content: center;
}

.capsule-label {
  font-size: 11px;
  color: var(--text-tertiary);
  margin-bottom: 2px;
}

.capsule-value {
  font-size: 16px;
  font-weight: 600;
  color: #303133;
  display: flex;
  align-items: center;
  gap: 6px;
}

.capsule-tag {
  font-size: 10px;
  background: #f56c6c;
  color: white;
  padding: 1px 5px;
  border-radius: 4px;
  line-height: 1.4;
}

.unit {
  font-size: 12px;
  color: var(--text-tertiary);
  font-weight: 400;
}

/* --- V5 最终版：专业仪表盘样式 --- */
/* 容器：4列x2行网格布局 */
.stats-pro-container {
  display: grid;
  grid-template-columns: repeat(3, 1fr); // 改为3列
  grid-template-rows: repeat(2, 1fr); // 2行
  background: transparent;
  padding: 0 10px;
  gap: 16px 12px; // 行间距16px, 列间距12px（增加列间距）
  border: none;
  margin-right: -12px;
  box-shadow: none;
}

/* 单个数据项 */
.stat-pro-item {
  display: flex;
  align-items: center;
  gap: 11px;
  padding: 4px 8px; /* 保持原来的内边距 */
  transition: all 0.2s ease;
  cursor: pointer;
  border-radius: 8px;
  position: relative;

  &::after {
    content: "";
    position: absolute;
    inset: 0;
    border-radius: 8px;
    background: transparent;
    transition: background 0.2s ease;
  }

  // 自定义tooltip
  .card-tooltip {
    position: absolute;
    bottom: calc(100% + 8px);
    left: 50%;
    transform: translateX(-50%);
    padding: 8px 12px;
    background: rgba(75, 112, 226, 0.95);
    color: white;
    font-size: 12px;
    font-weight: 500;
    border-radius: 6px;
    white-space: nowrap;
    pointer-events: none;
    opacity: 0;
    transition: opacity 0.3s ease;
    transition-delay: 0s;
    z-index: 1000;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);

    // 小箭头
    &::after {
      content: "";
      position: absolute;
      top: 100%;
      left: 50%;
      transform: translateX(-50%);
      border: 5px solid transparent;
      border-top-color: rgba(75, 112, 226, 0.95);
    }
  }

  &:hover {
    transform: translateY(-2px); /* 微动效 */

    // 悬浮1秒后显示tooltip
    .card-tooltip {
      opacity: 1;
      transition-delay: 1s;
    }

    &::after {
      background: rgba(102, 126, 234, 0.05);
    }
  }

  &:active {
    transform: translateY(0px);
  }

  // 激活状态 - 新拟态内凹效果（按下的感觉）
  &.active {
    box-shadow:
      inset 4px 4px 8px rgba(209, 217, 230, 0.8),
      inset -4px -4px 8px rgba(255, 255, 255, 0.4);
    transform: translateY(1px) scale(0.98); // 轻微下沉和缩小

    &::after {
      background: linear-gradient(
        135deg,
        rgba(75, 112, 226, 0.08) 0%,
        rgba(102, 126, 234, 0.06) 100%
      );
    }

    &:hover {
      transform: translateY(1px) scale(0.98); // 激活时保持按下状态
    }

    // 暗色模式覆盖：浅色内嵌阴影在深色背景下会产生"白边框"观感
    [data-theme='dark'] & {
      box-shadow:
        inset 4px 4px 8px rgba(0, 0, 0, 0.45),
        inset -4px -4px 8px rgba(255, 255, 255, 0.04);

      &::after {
        background: linear-gradient(
          135deg,
          rgba(75, 112, 226, 0.04) 0%,
          rgba(102, 126, 234, 0.03) 100%
        );
      }
    }
  }
}

/* 证据数量徽章 */
.evidence-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 18px;
  height: 18px;
  padding: 0 5px;
  margin-left: 4px;
  font-size: 10px;
  font-weight: 600;
  color: #667eea;
  background: rgba(102, 126, 234, 0.1);
  border-radius: 9px;
  vertical-align: middle;
}

/* 针对不同列的卡片设置不同的padding */
/* 第1列（1,4）- 左侧：增加左边距 */
.stat-pro-item:nth-child(3n + 1) {
  padding-left: 10px;
}

/* 第3列（3,6）- 右侧：右边距减为0 */
.stat-pro-item:nth-child(3n + 3) {
  padding-right: 0;
}

/* 图标容器：大、方、淡色背景 */
.pro-icon {
  width: 42px;
  height: 42px;
  border-radius: 10px; /* 方圆形 */
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
  flex-shrink: 0;
}

/* 图标配色 */
.icon-bg-risk {
  background: rgba(245, 108, 108, 0.1);
  color: #f56c6c;
}

.icon-bg-uni {
  background: rgba(64, 158, 255, 0.1);
  color: #409eff;
}

.icon-bg-normal {
  background: rgba(144, 147, 153, 0.1);
  color: var(--text-tertiary);
}

.icon-bg-account {
  background: rgba(250, 173, 20, 0.1);
  color: #faad14;
}

.icon-bg-action {
  background: rgba(82, 196, 26, 0.1);
  color: #52c41a;
}

.icon-bg-spread {
  background: rgba(114, 46, 209, 0.1);
  color: #722ed1;
}

.icon-bg-tone {
  background: rgba(235, 47, 150, 0.1);
  color: #eb2f96;
}

/* 高校舆情分析新增样式 */
.icon-bg-identity {
  background: rgba(64, 158, 255, 0.1);
  color: #409eff;
}

.icon-bg-topic {
  background: rgba(114, 46, 209, 0.1);
  color: #722ed1;
}

.icon-bg-mention {
  background: rgba(250, 173, 20, 0.1);
  color: #faad14;
}

/* 情感倾向样式 */
.icon-bg-positive {
  background: rgba(82, 196, 26, 0.1);
  color: #52c41a;
}

.icon-bg-neutral {
  background: rgba(250, 173, 20, 0.1);
  color: #faad14;
}

.icon-bg-negative {
  background: rgba(245, 108, 108, 0.1);
  color: #f56c6c;
}

/* 舆论风险等级样式 */
.icon-bg-risk-low {
  background: rgba(82, 196, 26, 0.1);
  color: #52c41a;
}

.icon-bg-risk-medium {
  background: rgba(250, 173, 20, 0.1);
  color: #faad14;
}

.icon-bg-risk-high {
  background: rgba(245, 108, 108, 0.1);
  color: #f56c6c;
}

/* 情感倾向文字样式 */
.text-positive {
  color: #52c41a;
}

.text-neutral {
  color: #faad14;
}

.text-negative {
  color: #f56c6c;
}

/* 舆论风险文字样式 */
.text-risk-low {
  color: #52c41a;
}

.text-risk-medium {
  color: #faad14;
}

.text-risk-high {
  color: #f56c6c;
}

.text-identity {
  color: #409eff;
}

.text-topic {
  color: #722ed1;
}

.text-mention {
  color: #faad14;
}

/* 内容排版 */
.pro-content {
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: 2px;
}

.pro-label {
  font-size: 11px;
  color: var(--text-tertiary);
  display: flex;
  align-items: center;
  gap: 6px;

  .ai-predict-badge {
    display: inline-flex;
    align-items: center;
    padding: 2px 6px;
    font-size: 10px;
    font-weight: 500;
    color: var(--text-tertiary);
    background: var(--bg-hover);
    border-radius: 3px;
    border: 1px solid var(--border-color);
  }
}

.pro-value {
  font-size: 18px;
  font-weight: 700;
  line-height: 1.2;
  display: flex;
  align-items: center;
  gap: 6px;
}

/* 文字颜色 */
.text-risk {
  color: #f56c6c;
}

.text-uni {
  color: #409eff;
}

.text-normal {
  color: var(--text-primary);
}

.text-account {
  color: #faad14;
}

.text-action {
  color: #52c41a;
}

.text-spread {
  color: #722ed1;
}

.text-tone {
  color: #eb2f96;
}

.pro-unit {
  font-size: 12px;
  color: var(--text-tertiary);
  font-weight: 400;
  margin-top: 4px;
}

.pro-subtitle {
  font-size: 12px;
  color: var(--text-secondary);
  font-weight: 500;
  margin-top: 3px;
}

/* 风险标签 LV.5 */
.pro-tag-risk {
  font-size: 10px;
  background: #f56c6c;
  color: white;
  padding: 1px 5px;
  border-radius: 4px;
  vertical-align: middle;
  font-weight: 600;
}

// ==================== 报告视图样式已迁移到ReportView.vue组件 ====================
// 以下样式已删除，现在由ReportView.vue组件管理
/*
  .report-view {
    max-width: 1200px;
    margin: 0 auto;
    padding: 40px 30px;
    background: white;
    
    // PDF打印优化
    @media print {
      padding: 20px;
      
      .report-actions {
        display: none !important;
      }
    }
  }

  .report-header {
    text-align: center;
    margin-bottom: 40px;
    padding-bottom: 30px;
    border-bottom: 3px solid $purple;
  }

  .report-title {
    font-size: 32px;
    font-weight: 700;
    color: $black;
    margin: 0 0 20px 0;
  }

  .report-meta {
    display: flex;
    justify-content: center;
    gap: 30px;
    flex-wrap: wrap;
    margin-bottom: 15px;
  }

  .meta-item {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 14px;
    color: $gray;
    
    .el-icon {
      color: $purple;
    }
  }

  .report-description {
    font-size: 14px;
    color: #666;
    line-height: 1.8;
    max-width: 900px;
    margin: 0 auto;
    text-align: justify;
  }

  .report-section {
    margin-bottom: 35px;
    page-break-inside: avoid;
  }

  .section-title {
    font-size: 22px;
    font-weight: 700;
    color: $black;
    margin: 0 0 20px 0;
    padding-bottom: 10px;
    border-bottom: 2px solid #e8ecef;
  }

  // 核心卡片网格
  .report-cards-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 20px;
  }

  .report-card {
    background: $neu-1;
    border-radius: 12px;
    padding: 20px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
    page-break-inside: avoid;
  }

  .card-header-flex {
    display: flex;
    align-items: center;
    gap: 10px;
    margin-bottom: 12px;
  }

  .card-icon-small {
    width: 36px;
    height: 36px;
    border-radius: 8px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 18px;
  }

  .card-title-small {
    font-size: 14px;
    font-weight: 600;
    color: #666;
  }

  .card-value {
    font-size: 20px;
    font-weight: 700;
    margin-bottom: 8px;
    line-height: 1.2;
  }

  .card-meta {
    font-size: 12px;
    color: #999;
  }

  // 证据清单样式
  .evidence-section {
    margin-bottom: 30px;
    page-break-inside: avoid;
  }

  .evidence-section-title {
    display: flex;
    align-items: center;
    gap: 12px;
    margin-bottom: 15px;
  }

  .evidence-badge-report {
    font-size: 16px;
    font-weight: 600;
    color: $black;
  }

  .evidence-count-report {
    font-size: 13px;
    color: #999;
  }

  .evidence-list-report {
    display: flex;
    flex-direction: column;
    gap: 12px;
  }

  .evidence-item-report {
    display: flex;
    gap: 15px;
    background: #f8f9fa;
    padding: 15px;
    border-radius: 8px;
    page-break-inside: avoid;
  }

  .evidence-timeline-mark {
    width: 4px;
    border-radius: 2px;
    flex-shrink: 0;
    
    &.mark-video { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); }
    &.mark-audio { background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%); }
    &.mark-text { background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%); }
  }

  .evidence-content-report {
    flex: 1;
  }

  .evidence-header-report {
    display: flex;
    align-items: center;
    gap: 10px;
    margin-bottom: 8px;
  }

  .evidence-type-badge {
    font-size: 11px;
    padding: 3px 8px;
    border-radius: 4px;
    font-weight: 600;
    
    &.type-video { background: rgba(102, 126, 234, 0.15); color: #667eea; }
    &.type-audio { background: rgba(240, 147, 251, 0.15); color: #f093fb; }
    &.type-text { background: rgba(79, 172, 254, 0.15); color: #4facfe; }
  }

  .evidence-time-report {
    font-size: 12px;
    color: $purple;
    font-weight: 600;
  }

  .evidence-confidence-report {
    font-size: 11px;
    color: #999;
  }

  .evidence-desc-report {
    font-size: 13px;
    color: #333;
    line-height: 1.6;
    margin-bottom: 5px;
  }

  .evidence-keyword-report {
    font-size: 13px;
    color: $purple;
    font-weight: 600;
    font-style: italic;
  }

  // 多模态融合分析样式
  .fusion-section {
    margin-bottom: 25px;
    padding: 20px;
    background: #f8f9fa;
    border-radius: 10px;
    page-break-inside: avoid;
  }

  .fusion-title {
    font-size: 16px;
    font-weight: 600;
    color: #333;
    margin: 0 0 15px 0;
  }

  .fusion-grid {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 15px;
  }

  .fusion-card {
    background: white;
    padding: 15px;
    border-radius: 8px;
    text-align: center;
    box-shadow: 0 2px 6px rgba(0, 0, 0, 0.06);
  }

  .fusion-header {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 6px;
    font-size: 12px;
    color: #666;
    margin-bottom: 10px;
    
    .el-icon {
      font-size: 16px;
    }
  }

  .video-fusion .fusion-header .el-icon { color: #667eea; }
  .audio-fusion .fusion-header .el-icon { color: #f093fb; }
  .text-fusion .fusion-header .el-icon { color: #4facfe; }
  .result-fusion .fusion-header .el-icon { color: #52c41a; }

  .fusion-score {
    font-size: 28px;
    font-weight: 700;
    color: $black;
    
    span {
      font-size: 14px;
      color: #999;
      margin-left: 3px;
    }
  }

  .fusion-meta {
    display: flex;
    flex-direction: column;
    gap: 3px;
    font-size: 11px;
    color: #999;
    margin-top: 8px;
  }

  .fusion-result {
    font-size: 20px;
    font-weight: 700;
    color: $purple;
    margin-bottom: 8px;
  }

  .fusion-formula {
    font-size: 10px;
    color: #999;
    font-family: monospace;
  }

  // 高风险台词列表样式
  .transcript-risk-list {
    display: flex;
    flex-direction: column;
    gap: 12px;
  }

  .transcript-item-report {
    display: flex;
    gap: 15px;
    background: #fff8f0;
    padding: 15px;
    border-radius: 8px;
    border-left: 4px solid #faad14;
    page-break-inside: avoid;
  }

  .transcript-timeline {
    font-size: 13px;
    font-weight: 600;
    color: $purple;
    white-space: nowrap;
  }

  .transcript-content-report {
    flex: 1;
  }

  .transcript-text {
    font-size: 14px;
    color: #333;
    line-height: 1.8;
    margin-bottom: 10px;
  }

  .transcript-meta {
    display: flex;
    align-items: center;
    gap: 15px;
  }

  .risk-badge-report {
    font-size: 12px;
    padding: 3px 10px;
    border-radius: 4px;
    font-weight: 600;
    
    &.risk-high {
      background: rgba(245, 108, 108, 0.15);
      color: #f56c6c;
    }
    
    &.risk-medium {
      background: rgba(250, 173, 20, 0.15);
      color: #faad14;
    }
  }

  .risk-reason {
    font-size: 12px;
    color: #666;
  }

  // 图表容器样式
  .chart-container-report {
    background: white;
    padding: 20px;
    border-radius: 12px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
    margin-bottom: 10px;
  }

  .timeline-chart-report {
    width: 100%;
    height: 300px;
  }

  .radar-chart-report {
    width: 100%;
    height: 400px;
  }

  // 两个雷达图并排显示
  .radar-charts-grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 25px;
    margin-bottom: 15px;
  }

  .radar-chart-wrapper {
    display: flex;
    flex-direction: column;
  }

  .radar-subtitle {
    font-size: 16px;
    font-weight: 600;
    color: #333;
    margin: 0 0 12px 0;
    text-align: center;
  }

  .radar-note {
    font-size: 11px;
    color: #999;
    margin: 8px 0 0 0;
    text-align: center;
  }

  .chart-note {
    font-size: 12px;
    color: #999;
    margin: 0;
    text-align: center;
  }

  // 操作按钮样式
  .report-actions {
    display: flex;
    justify-content: center;
    gap: 15px;
    margin-top: 40px;
    padding-top: 30px;
    border-top: 2px solid #e8ecef;
  }

  .report-btn {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 12px 24px;
    font-size: 14px;
    font-weight: 600;
    border: none;
    border-radius: 8px;
    cursor: pointer;
    transition: all 0.3s;
    background: $neu-1;
    color: $gray;
    box-shadow: 
      3px 3px 6px rgba(163, 177, 198, 0.4),
      -3px -3px 6px rgba(255, 255, 255, 0.9);
    
    &:hover {
      transform: translateY(-2px);
      box-shadow: 
        4px 4px 8px rgba(163, 177, 198, 0.5),
        -4px -4px 8px rgba(255, 255, 255, 1);
    }
    
    &:active {
      transform: translateY(0);
    }
    
    &.primary {
      background: $purple;
      color: white;
      
      &:hover {
        background: darken($purple, 5%);
      }
    }
  }
  */

// 深色模式兜底：覆盖仍使用浅色硬编码的分析页局部样式
:deep(html[data-theme='dark'] .analysis-content-wrapper) {
  .video-archive-card,
  .transcript-panel,
  .dashboard-radar,
  .video-item,
  .evidence-group-inline,
  .evidence-item-inline,
  .text-evidence-item-inline,
  .modality-card,
  .neu-card {
    background: var(--bg-card) !important;
    border-color: var(--border-color) !important;
    color: var(--text-primary) !important;
    box-shadow: none !important;
  }

  .video-source-badge,
  .panel-header-compact,
  .card-header-compact,
  .group-title-inline,
  .section-title-inline,
  .drawer-header {
    background: var(--bg-hover) !important;
    border-color: var(--border-color) !important;
    color: var(--text-primary) !important;
  }

  .right-panel-container.evidence-detail-mode {
    background: var(--bg-hover) !important;
    box-shadow: none !important;
  }

  .evidence-item-inline:hover,
  .text-evidence-item-inline:hover,
  .stat-pro-item:hover::after {
    background: rgba(64, 158, 255, 0.12) !important;
  }

  .file-name,
  .panel-main-value,
  .speech-transcript,
  .event-body,
  .pro-value,
  .modality-score,
  .stat-count,
  .statistics-total,
  .text-keyword-inline {
    color: var(--text-primary) !important;
  }

  // 视频属性栏 + 六卡副标题增强对比度
  .feature-label,
  .description-text,
  .panel-category,
  .panel-confidence-inline,
  .event-time,
  .notif-label,
  .card-title-compact,
  .current-frame-badge-small,
  .stat-label,
  .stat-label-compact,
  .modality-name,
  .detail-item,
  .result-label,
  .pro-label,
  .video-source-badge .source-label,
  .video-source-badge .source-hint,
  .description-label,
  .profile-tag,
  .keyword-tag-detected,
  .word-pack-tag,
  .word-pack-tag .pack-word-count {
    color: #cdd7ef !important;
  }

  // profile-tag 深色模式背景也需要覆盖
  .profile-tag {
    background: rgba(120, 140, 180, 0.15) !important;
    border-color: rgba(120, 140, 180, 0.3) !important;
  }

  .pro-subtitle {
    color: #b0bdd8 !important;
  }

  .pro-label .ai-predict-badge {
    background: rgba(120, 140, 180, 0.12) !important;
    border-color: rgba(120, 140, 180, 0.25) !important;
    color: #9ba3c4 !important;
  }

  /* 播放器左上角风险状态 + CV 框：样式已移至 App.vue [data-theme='dark'] 全局块确保生效 */

  .risk-status-indicator {
    border-width: 1px !important;
    border-style: solid !important;

    &.low {
      background: rgba(16, 140, 103, 0.96) !important;
      border-color: rgba(88, 215, 175, 0.5) !important;
    }

    &.medium {
      background: rgba(180, 108, 20, 0.96) !important;
      border-color: rgba(251, 191, 36, 0.55) !important;
    }

    &.high {
      background: rgba(190, 52, 52, 0.96) !important;
      border-color: rgba(248, 113, 113, 0.55) !important;
    }
  }

  .timeline-vertical-line {
    background: linear-gradient(
      to bottom,
      transparent 0%,
      rgba(90, 96, 128, 0.35) 5%,
      rgba(90, 96, 128, 0.35) 95%,
      transparent 100%
    ) !important;
  }

  .video-drawer {
    background: var(--bg-card) !important;
    border-left: 1px solid var(--border-color) !important;
    box-shadow: none !important;
  }
}

/* 浅色模式 risk-keyword 字重已移至 App.vue [data-theme='light'] 全局块 */

// 词库包悬浮提示（neumorphic风格，浅色固定）
:global(.pack-tooltip-popper.el-popper) {
  background: var(--bg-card) !important;
  border: 1px solid var(--border-color) !important;
  border-radius: 10px !important;
  box-shadow: var(--shadow-md) !important;
  padding: 12px 14px !important;
  color: var(--text-primary) !important;
}

:global(.pack-tooltip-popper.el-popper .el-popper__arrow::before) {
  background: var(--bg-card) !important;
  border-color: var(--border-color) !important;
  box-shadow: none !important;
}

// 文本证据悬浮提示（挂载到body，避免overflow截断）
:global(.text-evidence-tooltip.el-popper) {
  max-width: 320px !important;
  padding: 12px 16px !important;
  background: var(--bg-card) !important;
  border: 1px solid var(--border-color) !important;
  border-radius: 10px !important;
  box-shadow: var(--shadow-md) !important;
  color: var(--text-primary) !important;
  font-size: 13px !important;
  line-height: 1.7 !important;
  font-weight: 400 !important;
}

:global(.text-evidence-tooltip.el-popper .el-popper__arrow::before) {
  background: var(--bg-card) !important;
  border-color: var(--border-color) !important;
}
</style>

<!-- 非 scoped：分析页主题覆盖，确保 html[data-theme] 选择器优先级生效 -->
<style lang="scss">
html[data-theme='dark'] .analysis-content-wrapper .risk-status-indicator .risk-label {
  color: #ffffff !important;
  font-weight: 700 !important;
}
html[data-theme='dark'] .analysis-content-wrapper .detection-label,
html[data-theme='dark'] .analysis-content-wrapper .detection-label .confidence-badge {
  color: #ffffff !important;
}
html[data-theme='dark'] .analysis-content-wrapper .detection-label .confidence-badge {
  opacity: 1 !important;
  font-weight: 700 !important;
  letter-spacing: 0.2px;
}
/* 六卡主标题在深色模式下要明显可见 */
html[data-theme='dark'] .analysis-content-wrapper .pro-label {
  color: #8fa3c8 !important;
}
html[data-theme='dark'] .analysis-content-wrapper .panel-category {
  color: #8fa3c8 !important;
}
html[data-theme='light'] .analysis-content-wrapper .risk-keyword {
  font-weight: 400 !important;
}
</style>
