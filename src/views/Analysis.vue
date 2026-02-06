<template>
  <div ref="analysisPageRef" class="analysis-page">
    <div class="header-actions">
      <h2 class="page-title">分析结果</h2>
      <div class="header-actions-right">
        <!-- 视图切换按钮 -->
        <div class="view-mode-toggle" v-if="analysisData">
          <button 
            class="neu-btn" 
            :class="{ 'active': viewMode === 'interactive' }"
            @click="viewMode = 'interactive'"
          >
            <el-icon><VideoPlay /></el-icon>
            交互分析
          </button>
          <button 
            class="neu-btn" 
            :class="{ 'active': viewMode === 'report' }"
            @click="viewMode = 'report'"
          >
            <el-icon><Document /></el-icon>
            报告视图
          </button>
        </div>
        <button class="neu-btn primary-btn video-selector-btn" @click="showVideoDrawer = true">
          <el-icon><VideoPlay /></el-icon>
          选择视频
        </button>
      </div>
    </div>
    
    <!-- 视频选择侧边栏 -->
    <div class="video-drawer-overlay" :class="{ active: showVideoDrawer }" @click="showVideoDrawer = false"></div>
    <div class="video-drawer" :class="{ active: showVideoDrawer }">
      <div class="drawer-header">
        <h3>选择视频</h3>
        <button class="close-btn" @click="showVideoDrawer = false">
          <el-icon><Close /></el-icon>
        </button>
      </div>
      <div class="drawer-content">
        <div class="video-list-container">
          <div 
            v-for="video in videoList" 
            :key="video.id"
            class="video-item"
            :class="{ active: selectedVideoId === video.id }"
            @click="selectVideo(video)"
          >
            <div class="video-item-icon">
              <el-icon :size="20"><VideoPlay /></el-icon>
            </div>
            <div class="video-item-info">
              <div class="video-item-title">{{ video.title }}</div>
              <div class="video-item-meta">
                {{ video.fileName }} · {{ formatFileSize(video.fileSize) }}
              </div>
            </div>
            <div class="video-item-status">
              <span class="status-badge" :class="getStatusClass(video.status)">
                {{ getStatusText(video.status) }}
              </span>
            </div>
          </div>
          
          <div v-if="videoList.length === 0" class="empty-video-list">
            <el-icon :size="48"><VideoPlay /></el-icon>
            <p>暂无已分析的视频</p>
            <button class="neu-btn primary-btn" @click="$router.push('/videos')">
              去上传视频
            </button>
          </div>
        </div>
      </div>
    </div>
    
    <!-- 加载中 -->
    <div class="neu-card" v-loading="loading" v-if="loading">
      <div style="height: 400px;"></div>
    </div>
    
    <!-- 空状态 -->
    <div class="neu-card empty-card" v-else-if="!analysisData">
      <div class="empty-state">
        <div class="empty-icon">
          <el-icon :size="48"><DataAnalysis /></el-icon>
        </div>
        <h3>{{ emptyMessage }}</h3>
        <p>选择已分析的视频即可查看详细的高校舆情分析结果</p>
        <button class="neu-btn primary-btn" @click="$router.push('/videos')">
          <el-icon><VideoPlay /></el-icon>
          去我的视频
        </button>
      </div>
    </div>
    
    <!-- 分析结果展示 -->
    <div v-else>
      <!-- 交互式分析视图 -->
      <transition name="fade" mode="out-in">
      <div v-if="viewMode === 'interactive'" key="interactive" class="interactive-view">
        <!-- 逻辑修复：视频档案卡（本地上传场景） -->
        <div class="video-archive-card neu-card">
          <!-- 数据来源标识 -->
          <div class="video-source-badge">
            <div class="source-label">
              <el-icon :size="14"><Upload /></el-icon>
              <span>{{ mockVideoArchive.uploadSource }}视频</span>
            </div>
            <span class="source-hint">以下传播相关数据为AI预测值</span>
          </div>
          
          <div class="archive-header">
            <div class="file-section">
              <div class="file-icon">
                <el-icon :size="28"><VideoCamera /></el-icon>
              </div>
              
              <div class="file-info">
                <!-- 文件名 + 时长 -->
                <div class="file-main">
                  <span class="file-name">{{ mockVideoArchive.fileName }}</span>
                  <span class="duration-badge">
                    <el-icon :size="11"><Clock /></el-icon>
                    {{ formatDuration(videoDuration) }}
                  </span>
                </div>

                <!-- AI分析摘要(如果有) -->
                <div class="video-description" v-if="mockVideoArchive.description">
                  <span class="description-label">AI分析摘要：</span>
                  <span class="description-text">{{ mockVideoArchive.description }}</span>
                </div>

                <!-- 视频内容人物特征 -->
                <div class="content-features-row">
                  <div class="feature-label">
                    <el-icon :size="14"><User /></el-icon>
                    视频主要人物:
                  </div>
                  <span class="profile-tag">
                    <el-icon><Male /></el-icon> {{ mockAIProfile.staticFeatures.gender }}
                  </span>
                  <span class="profile-tag">
                    <el-icon><Calendar /></el-icon> {{ mockAIProfile.staticFeatures.ageRange }}
                  </span>
                  <span class="profile-tag">
                    <el-icon><School /></el-icon> {{ mockAIProfile.staticFeatures.clothing }}
                  </span>
                  <span class="profile-tag">
                    <el-icon><Microphone /></el-icon> {{ mockAIProfile.staticFeatures.voiceProfile }}
                  </span>
                </div>

                <!-- 检测到的关键内容 -->
                <div class="detected-keywords-row">
                  <div class="feature-label">
                    <el-icon :size="14"><Search /></el-icon>
                    内容关键词:
                  </div>
                  <div class="keywords-container">
                    <span v-for="(kw, idx) in mockAIProfile.detectedKeywords" :key="idx" 
                          class="keyword-tag-detected"
                          :class="{ 'university-related': kw.isUniversityRelated }">
                      {{ kw.word }}
                    </span>
                  </div>
                </div>
              </div>
            </div>
            
            <div class="global-stats-section stats-pro-container">
              <!-- 高校舆情分析核心指标 -->
              <div class="stat-pro-item" :class="{ 'active': currentCardId === 'identity' }" @click="openEvidenceDrawer('identity')">
                <div class="card-tooltip">{{ currentCardId === 'identity' ? '点击关闭详细证据' : '点击查看详细证据' }}</div>
                <div class="pro-icon icon-bg-identity">
                  <el-icon><User /></el-icon>
                </div>
                <div class="pro-content">
                  <div class="pro-label">身份判定 <span class="evidence-badge">({{ mockAnalysisResult.identity.evidences?.length || 0 }})</span></div>
                  <div class="pro-value text-identity">
                    {{ mockIdentityAnalysis.identityLabel }}
                  </div>
                  <div class="pro-subtitle">置信度 {{ mockIdentityAnalysis.modalityFusion.finalScore }}%</div>
                </div>
              </div>
              
              <div class="stat-pro-item" :class="{ 'active': currentCardId === 'university' }" @click="openEvidenceDrawer('university')">
                <div class="card-tooltip">{{ currentCardId === 'university' ? '点击关闭详细证据' : '点击查看详细证据' }}</div>
                <div class="pro-icon icon-bg-uni">
                  <el-icon><School /></el-icon>
                </div>
                <div class="pro-content">
                  <div class="pro-label">涉及高校 <span class="evidence-badge">({{ mockAnalysisResult.university.evidences?.length || 0 }})</span></div>
                  <div class="pro-value text-uni">
                    {{ mockUniversityBaseline.universityName }}
                  </div>
                  <div class="pro-subtitle">匹配度 {{ mockUniversityBaseline.modalityFusion.finalScore }}%</div>
                </div>
              </div>
              
              <div class="stat-pro-item" :class="{ 'active': currentCardId === 'topic' }" @click="openEvidenceDrawer('topic')">
                <div class="card-tooltip">{{ currentCardId === 'topic' ? '点击关闭详细证据' : '点击查看详细证据' }}</div>
                <div class="pro-icon icon-bg-topic">
                  <el-icon><ChatDotRound /></el-icon>
                </div>
                <div class="pro-content">
                  <div class="pro-label">内容主题 <span class="evidence-badge">({{ mockAnalysisResult.topic.evidences?.length || 0 }})</span></div>
                  <div class="pro-value text-topic">
                    {{ mockContentAnalysis.topicCategory }}
                  </div>
                  <div class="pro-subtitle">{{ mockContentAnalysis.topicSubCategory }}</div>
                </div>
              </div>
              
              <div class="stat-pro-item" :class="{ 'active': currentCardId === 'attitude' }" @click="openEvidenceDrawer('attitude')">
                <div class="card-tooltip">{{ currentCardId === 'attitude' ? '点击关闭详细证据' : '点击查看详细证据' }}</div>
                <div class="pro-icon" :class="getSentimentIconClass(mockContentAnalysis.sentimentTowardSchool)">
                  <el-icon><TrendCharts /></el-icon>
                </div>
                <div class="pro-content">
                  <div class="pro-label">对学校态度 <span class="evidence-badge">({{ mockAnalysisResult.attitude.evidences?.length || 0 }})</span></div>
                  <div class="pro-value" :class="getSentimentTextClass(mockContentAnalysis.sentimentTowardSchool)">
                    {{ getSentimentLabel(mockContentAnalysis.sentimentTowardSchool) }}
                  </div>
                  <div class="pro-subtitle">{{ mockContentAnalysis.negativeMentionCount }}处负面，占比 {{ Math.round((mockContentAnalysis.negativeMentionCount / mockContentAnalysis.schoolMentionCount) * 100) }}%</div>
                </div>
              </div>
              
              <div class="stat-pro-item" :class="{ 'active': currentCardId === 'opinionRisk' }" @click="openEvidenceDrawer('opinionRisk')">
                <div class="card-tooltip">{{ currentCardId === 'opinionRisk' ? '点击关闭详细证据' : '点击查看详细证据' }}</div>
                <div class="pro-icon" :class="getOpinionRiskIconClass(mockOpinionRisk.riskLevel)">
                  <el-icon><WarningFilled /></el-icon>
                </div>
                <div class="pro-content">
                  <div class="pro-label">
                    潜在舆论风险 <span class="evidence-badge">({{ mockAnalysisResult.opinionRisk.evidences?.length || 0 }})</span>
                    <span class="ai-predict-badge">AI预测</span>
                  </div>
                  <div class="pro-value" :class="getOpinionRiskTextClass(mockOpinionRisk.riskLevel)">
                    {{ mockOpinionRisk.riskLabel }}
                  </div>
                  <div class="pro-subtitle">{{ mockOpinionRisk.riskReason }}</div>
                </div>
              </div>
              
              <div class="stat-pro-item" :class="{ 'active': currentCardId === 'action' }" @click="openEvidenceDrawer('action')">
                <div class="card-tooltip">{{ currentCardId === 'action' ? '点击关闭详细证据' : '点击查看详细证据' }}</div>
                <div class="pro-icon icon-bg-action">
                  <el-icon><DocumentChecked /></el-icon>
                </div>
                <div class="pro-content">
                  <div class="pro-label">处置建议 <span class="evidence-badge">({{ mockAnalysisResult.action.evidences?.length || 0 }})</span></div>
                  <div class="pro-value text-action">
                    {{ mockOpinionRisk.actionSuggestion }}
                  </div>
                  <div class="pro-subtitle">{{ mockOpinionRisk.actionDetail }}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <!-- 视频 + 证据/台词（左右布局，保持宽敞） -->
        <div class="multi-modal-container" :class="{ 'evidence-mode': currentCardId }">
          <!-- 左侧：证据截图区域 -->
          <div class="video-section" :class="{ 'half-width': currentCardId }">
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
              
              <!-- 证据时间轴标记 - 只在分屏模式下显示当前卡片的证据 -->
              <div v-show="realVideoUrl && currentCardId" class="evidence-timeline-overlay">
                <div class="timeline-progress-bar">
                  <!-- 当前播放进度指示器 -->
                  <div 
                    class="play-progress-indicator" 
                    :style="{ left: (currentPlayTime / videoDuration * 100) + '%' }"
                  ></div>
                  
                  <!-- 证据标记点 - 只显示当前卡片的证据 -->
                  <div 
                    v-for="(evidence, index) in currentEvidences" 
                    :key="`mark-${index}`"
                    class="evidence-mark"
                    :class="[
                      `mark-type-${evidence.type}`,
                      `mark-card-${currentCardId}`,
                      evidence.sentiment ? `mark-sentiment-${evidence.sentiment}` : '',
                      { 'mark-active': isNearCurrentTime(evidence.timestamp) },
                      { 'mark-near-start': (evidence.timestamp / videoDuration) < 0.15 },
                      { 'mark-near-end': (evidence.timestamp / videoDuration) > 0.85 }
                    ]"
                    :style="{ left: (evidence.timestamp / videoDuration * 100) + '%' }"
                    @click="jumpToTime(evidence.timestamp)"
                  >
                    <div class="mark-dot"></div>
                    <div class="mark-popup">
                      <div class="popup-time">{{ formatTimeDisplay(evidence.timestamp) }}</div>
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
                    detection.confidence > 0.9 ? 'high-confidence' : ''
                  ]"
                  :style="getDetectionBoxStyle(detection)"
                >
                  <div class="detection-label-container">
                    <span class="detection-label">
                      <span v-if="detection.metadata?.emotionIcon" class="emotion-icon">
                        {{ detection.metadata.emotionIcon }}
                      </span>
                      {{ detection.label }}
                      <span class="confidence-badge">{{ Math.round(detection.confidence * 100) }}%</span>
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
                    <span class="scene-confidence">置信度 {{ Math.round(currentScene.confidence * 100) }}%</span>
                  </span>
                </div>
              </div>
              
              <!-- CV视觉模态：检测类型图例（左上角） -->
              <div class="detection-legend" :class="{ 
                collapsed: !legendExpanded,
                'evidence-mode-shift': currentCardId 
              }">
                <div 
                  class="legend-header" 
                  @click="legendExpanded = !legendExpanded"
                  title="点击展开/收起图例"
                >
                  <div class="legend-title-row">
                    <span class="legend-title">检测类型</span>
                    <span class="expand-icon">
                      {{ currentCardId ? (legendExpanded ? '▲' : '▼') : (legendExpanded ? '▼' : '▲') }}
                    </span>
                  </div>
                  <div 
                    class="detection-toggle" 
                    :class="{ active: showDetectionBoxes }"
                    @click.stop="showDetectionBoxes = !showDetectionBoxes"
                    title="显示/隐藏检测框"
                  >
                    <span class="toggle-icon">{{ showDetectionBoxes ? '👁️' : '👁️‍🗨️' }}</span>
                  </div>
                </div>
                <div class="legend-items" v-show="legendExpanded">
                  <div 
                    v-for="(color, type) in DETECTION_COLORS" 
                    :key="type"
                    class="legend-item"
                  >
                    <span class="legend-color" :style="{ backgroundColor: color }"></span>
                    <span class="legend-label">{{ DETECTION_LABELS[type] }}</span>
                  </div>
                </div>
              </div>
              
              <!-- 当前帧信息叠加（顶部） -->
              <div class="frame-info-overlay" v-if="currentEvidence">
                <div class="info-tags-row">
                  <span v-if="currentEvidence.emotion" class="info-tag emotion" :class="'emotion-' + currentEvidence.emotion">
                    <el-icon :size="11"><Microphone /></el-icon>
                    {{ getEmotionText(currentEvidence.emotion) }}
                  </span>
                  <span v-if="currentEvidence.riskLevel === 'high'" class="info-tag risk-alert">
                    <el-icon :size="11"><Warning /></el-icon>
                    高风险告警
                  </span>
                </div>
              </div>
              
              <!-- 伪进度条（已禁用，使用HTML5原生控制条） -->
              <div class="fake-controls" v-if="false">
                <div class="control-left">
                  <el-icon class="control-icon"><VideoPlay /></el-icon>
                  <span class="time-display">{{ formatCurrentTime() }} / {{ formatTotalDuration() }}</span>
                </div>
                <div class="progress-bar-wrapper">
                  <div class="progress-bar">
                    <div class="progress-now" :style="{ width: getProgressWidth() }"></div>
                  </div>
                </div>
                <div class="control-right">
                  <el-icon class="control-icon"><Sound /></el-icon>
                  <el-icon class="control-icon"><FullScreen /></el-icon>
                </div>
              </div>
            </div>
            
            <!-- 多轨道时间轴（去背景，融合风格） -->
            <div class="multi-track-timeline-inline" @click="onChartContainerClick">
              <v-chart 
                ref="timelineChartRef" 
                :option="multiModalTimelineOption" 
                class="timeline-chart-inline" 
                @click="onTimelineClick"
              />
            </div>
          </div>
          
          <!-- 右侧：字幕 + 雷达图容器 / 证据详情 -->
          <div class="right-panel-container" :class="{ 'evidence-detail-mode': currentCardId }">
            
            <!-- 证据详情面板（点击卡片后显示） -->
            <div v-show="currentCardId" class="evidence-detail-panel">
              <div class="evidence-panel-header">
                <div class="header-left">
                  <div class="card-icon-large" :class="currentCardData.iconClass">
                    <component :is="currentCardData.icon" />
                  </div>
                  <div class="header-info">
                    <div class="panel-title-row">
                      <span class="panel-category">{{ currentCardData.label }}</span>
                      <span class="panel-confidence-inline">
                        {{ currentCardData.confidenceLabel || '置信度' }} {{ currentCardData.confidence }}%
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
                    <h2 class="panel-main-value" :class="getPanelValueClass()">{{ currentCardData.value }}</h2>
                  </div>
                </div>
                <button class="close-evidence-btn" @click="closeEvidencePanel" title="返回台词视图">
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
                  <div class="modality-card video-modality" :class="{ 'statistics-type': isStatisticsCard }">
                    <div class="modality-header">
                      <div class="modality-icon video-icon">
                        <el-icon :size="18"><VideoCamera /></el-icon>
                      </div>
                      <span class="modality-name">视频模态</span>
                    </div>
                    
                    <!-- 加权计算类型 -->
                    <template v-if="!isStatisticsCard && currentFusion">
                      <div class="modality-score">{{ currentFusion.videoScore }}<span class="score-unit">分</span></div>
                      <div class="modality-details">
                        <span class="detail-item">
                          <el-icon :size="12"><DataLine /></el-icon>
                          贡献度 {{ currentFusion.videoContribution?.toFixed(1) || '0.0' }}
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
                        <span class="stat-count">{{ getModalityStatistics('video').total }}</span>
                        <span class="stat-label">处证据</span>
                      </div>
                      <div class="mini-breakdown">
                        <span v-if="getModalityStatistics('video').positive > 0" class="mini-stat positive">
                          +{{ getModalityStatistics('video').positive }}
                        </span>
                        <span v-if="getModalityStatistics('video').neutral > 0" class="mini-stat neutral">
                          {{ getModalityStatistics('video').neutral }}
                        </span>
                        <span v-if="getModalityStatistics('video').negative > 0" class="mini-stat negative">
                          -{{ getModalityStatistics('video').negative }}
                        </span>
                      </div>
                    </template>
                  </div>

                  <!-- 音频模态 -->
                  <div class="modality-card audio-modality" :class="{ 'statistics-type': isStatisticsCard }">
                    <div class="modality-header">
                      <div class="modality-icon audio-icon">
                        <el-icon :size="18"><Microphone /></el-icon>
                      </div>
                      <span class="modality-name">音频模态</span>
                    </div>
                    
                    <!-- 加权计算类型 -->
                    <template v-if="!isStatisticsCard && currentFusion">
                      <div class="modality-score">{{ currentFusion.audioScore }}<span class="score-unit">分</span></div>
                      <div class="modality-details">
                        <span class="detail-item">
                          <el-icon :size="12"><DataLine /></el-icon>
                          贡献度 {{ currentFusion.audioContribution?.toFixed(1) || '0.0' }}
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
                        <span class="stat-count">{{ getModalityStatistics('audio').total }}</span>
                        <span class="stat-label">处证据</span>
                      </div>
                      <div class="mini-breakdown">
                        <span v-if="getModalityStatistics('audio').positive > 0" class="mini-stat positive">
                          +{{ getModalityStatistics('audio').positive }}
                        </span>
                        <span v-if="getModalityStatistics('audio').neutral > 0" class="mini-stat neutral">
                          {{ getModalityStatistics('audio').neutral }}
                        </span>
                        <span v-if="getModalityStatistics('audio').negative > 0" class="mini-stat negative">
                          -{{ getModalityStatistics('audio').negative }}
                        </span>
                      </div>
                    </template>
                  </div>

                  <!-- 文本模态 -->
                  <div class="modality-card text-modality" :class="{ 'statistics-type': isStatisticsCard }">
                    <div class="modality-header">
                      <div class="modality-icon text-icon">
                        <el-icon :size="18"><ChatLineRound /></el-icon>
                      </div>
                      <span class="modality-name">文本模态</span>
                    </div>
                    
                    <!-- 加权计算类型 -->
                    <template v-if="!isStatisticsCard && currentFusion">
                      <div class="modality-score">{{ currentFusion.textScore }}<span class="score-unit">分</span></div>
                      <div class="modality-details">
                        <span class="detail-item">
                          <el-icon :size="12"><DataLine /></el-icon>
                          贡献度 {{ currentFusion.textContribution?.toFixed(1) || '0.0' }}
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
                        <span class="stat-count">{{ getModalityStatistics('text').total }}</span>
                        <span class="stat-label">处证据</span>
                      </div>
                      <div class="mini-breakdown">
                        <span v-if="getModalityStatistics('text').positive > 0" class="mini-stat positive">
                          +{{ getModalityStatistics('text').positive }}
                        </span>
                        <span v-if="getModalityStatistics('text').neutral > 0" class="mini-stat neutral">
                          {{ getModalityStatistics('text').neutral }}
                        </span>
                        <span v-if="getModalityStatistics('text').negative > 0" class="mini-stat negative">
                          -{{ getModalityStatistics('text').negative }}
                        </span>
                      </div>
                    </template>
                  </div>

                  <!-- 箭头指向结果 -->
                  <div class="fusion-arrow">
                    <el-icon :size="24" color="#999"><Right /></el-icon>
                  </div>

                  <!-- 融合结果卡片 -->
                  <div class="modality-card result-card" :class="{ 'statistics-type': isStatisticsCard }">
                    <div class="modality-header">
                      <div class="modality-icon result-icon">
                        <el-icon :size="18"><Select /></el-icon>
                      </div>
                      <span class="modality-name">融合结果</span>
                    </div>
                    
                    <!-- 加权计算类型 -->
                    <template v-if="!isStatisticsCard && currentFusion">
                      <div class="modality-score final-score">
                        {{ currentFusion.finalScore }}<span class="score-unit">分</span>
                      </div>
                      <div class="result-label">{{ getResultLabel(currentCardId) }}</div>
                    </template>
                    
                    <!-- 统计类型 -->
                    <template v-else>
                      <div class="statistics-result">
                        <div class="statistics-total">
                          共 <span class="total-count">{{ currentStatistics?.total || 0 }}</span> 处
                        </div>
                        <div class="statistics-breakdown">
                          <span v-if="currentStatistics?.positive" class="stat-item positive">
                            <span class="stat-dot"></span>
                            {{ currentStatistics.positive }}正面
                          </span>
                          <span v-if="currentStatistics?.neutral" class="stat-item neutral">
                            <span class="stat-dot"></span>
                            {{ currentStatistics.neutral }}中性
                          </span>
                          <span v-if="currentStatistics?.negative" class="stat-item negative">
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
                <div class="section-title-inline" style="margin-top: 18px;">
                  <el-icon><Document /></el-icon>
                  <span>详细证据</span>
                </div>

                <div class="evidence-list-scroll">
                  <!-- 视频证据 -->
                  <div v-if="videoEvidences.length > 0" class="evidence-group-inline">
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
                      <div class="evidence-time-badge">{{ formatTimeDisplay(evidence.timestamp) }}</div>
                      <div class="evidence-content-inline">
                        <div class="evidence-desc-inline">
                          <!-- 情感标签（只对"对学校态度"卡片显示） -->
                          <span v-if="currentCardId === 'attitude' && evidence.sentiment" 
                                class="sentiment-tag-inline" 
                                :class="'sentiment-' + evidence.sentiment">
                            {{ evidence.sentiment === 'positive' ? '正面' : evidence.sentiment === 'neutral' ? '中性' : '负面' }}
                          </span>
                          {{ evidence.description }}
                        </div>
                        <div class="evidence-actions-inline">
                          <span class="confidence-badge-inline">{{ evidence.confidence }}%</span>
                          <span class="jump-hint-inline">
                            <el-icon><VideoPlay /></el-icon>
                            点击跳转
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <!-- 音频证据 -->
                  <div v-if="audioEvidences.length > 0" class="evidence-group-inline">
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
                      <div class="evidence-time-badge">{{ formatTimeDisplay(evidence.timestamp) }}</div>
                      <div class="evidence-content-inline">
                        <div class="evidence-desc-inline">
                          <!-- 情感标签（只对"对学校态度"卡片显示） -->
                          <span v-if="currentCardId === 'attitude' && evidence.sentiment" 
                                class="sentiment-tag-inline" 
                                :class="'sentiment-' + evidence.sentiment">
                            {{ evidence.sentiment === 'positive' ? '正面' : evidence.sentiment === 'neutral' ? '中性' : '负面' }}
                          </span>
                          {{ evidence.description }}
                        </div>
                        <div class="evidence-actions-inline">
                          <span class="confidence-badge-inline">{{ evidence.confidence }}%</span>
                          <span class="jump-hint-inline">
                            <el-icon><VideoPlay /></el-icon>
                            点击跳转
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <!-- 文本证据 -->
                  <div v-if="textEvidences.length > 0" class="evidence-group-inline">
                    <div class="group-title-inline">
                      <el-icon><ChatLineRound /></el-icon>
                      <span>文本证据 ({{ textEvidences.length }})</span>
                    </div>
                    <div class="text-evidences-grid-inline">
                      <div 
                        v-for="(evidence, index) in textEvidences" 
                        :key="'text-' + index"
                        class="text-evidence-item-inline"
                        :data-description="evidence.description"
                        @click="evidence.timestamp !== undefined && jumpToTime(evidence.timestamp)"
                      >
                        <div class="text-keyword-inline">
                          <!-- 情感标签（只对"对学校态度"卡片显示） -->
                          <span v-if="currentCardId === 'attitude' && evidence.sentiment" 
                                class="sentiment-tag-inline" 
                                :class="'sentiment-' + evidence.sentiment">
                            {{ evidence.sentiment === 'positive' ? '正面' : evidence.sentiment === 'neutral' ? '中性' : '负面' }}
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
                          <span class="confidence-badge-inline">{{ evidence.confidence }}%</span>
                        </div>
                      </div>
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
                  语音转文字与风险定位
                </span>
                <div class="risk-filter-group">
                  <button 
                    class="filter-btn"
                    :class="{ active: riskFilter === 'all' }"
                    @click="riskFilter = 'all'"
                  >
                    全部
                  </button>
                  <button 
                    class="filter-btn"
                    :class="{ active: riskFilter === 'medium-high' }"
                    @click="riskFilter = 'medium-high'"
                  >
                    中/高风险
                  </button>
                  <button 
                    class="filter-btn"
                    :class="{ active: riskFilter === 'high' }"
                    @click="riskFilter = 'high'"
                  >
                    高风险
                  </button>
                </div>
              </div>
              
              <div class="transcript-list">
                <div 
                  v-for="evidence in filteredRiskEvidence" 
                  :key="evidence.id"
                  class="transcript-segment"
                  :class="{ 
                    'active': selectedEvidenceId === evidence.id,
                    'inactive': selectedEvidenceId === evidence.id && !isCurrentEvidenceActive,
                    'high-risk': evidence.riskLevel === 'high',
                    'medium-risk': evidence.riskLevel === 'medium'
                  }"
                  @click="selectEvidence(evidence.id)"
                >
                  <div class="segment-header">
                    <span class="time-range">{{ evidence.time }}</span>
                    <span v-if="evidence.emotion" class="emotion-badge" :class="getEmotionClass(evidence.emotion)">
                      {{ getEmotionText(evidence.emotion) }}
                    </span>
                    <span v-if="evidence.riskLevel !== 'low'" class="risk-tag" :class="evidence.riskLevel.toLowerCase()">
                      {{ evidence.riskLevel === 'high' ? '高风险' : '中风险' }}
                    </span>
                  </div>
                  <div class="segment-text" v-html="highlightKeywords(evidence.content, evidence.keywords)"></div>
                  
                  <!-- Gemini优化：音频特征展示 -->
                  <div v-if="evidence.emotion" class="audio-features">
                    <span class="audio-feature-tag" :class="'emotion-' + evidence.emotion">
                      <el-icon :size="11"><Headset /></el-icon>
                      情绪: {{ getEmotionText(evidence.emotion) }}
                    </span>
                    <span v-if="evidence.riskLevel === 'high'" class="audio-feature-tag volume">
                      <el-icon :size="11"><Sound /></el-icon>
                      音量: 嘶吼
                    </span>
                    <span v-if="evidence.emotion === 'angry'" class="audio-feature-tag pitch">
                      <el-icon :size="11"><TrendCharts /></el-icon>
                      音调: 升高
                    </span>
                  </div>
                  
                  <div v-if="evidence.label" class="detection-info">
                    <el-icon :size="12" color="#f56c6c"><Warning /></el-icon>
                    <span>检测到: {{ evidence.label }} (置信度: {{ Math.round(evidence.confidence * 100) }}%)</span>
                  </div>
                </div>
                
                <div v-if="mockTranscriptSegments.length === 0" class="empty-transcript">
                  <el-icon :size="36"><Microphone /></el-icon>
                  <p>暂无语音转录数据</p>
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
                    <div class="score-number-side" :class="getCurrentRiskClass()">
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
                <div class="metric-value">{{ analysisData.isUniversityRelated ? '是' : '否' }}</div>
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
        :analysis-data="mockAnalysisResult"
        :timeline-chart-option="multiModalTimelineOption"
        :average-radar-chart-option="averageRadarOption"
        :peak-radar-chart-option="peakRiskRadarOption"
        @export-pdf="exportReport"
        @back-to-list="$router.push('/videos')"
        ref="reportViewRef"
      />
      </transition>
    </div> <!-- 闭合分析结果展示区域 -->
    
    <!-- 视频播放对话框 -->
    <el-dialog
      v-model="videoDialogVisible"
      :title="analysisData?.videoTitle"
      width="800px"
      destroy-on-close
      @opened="onVideoDialogOpened"
    >
      <video
        v-if="analysisData?.videoUrl"
        :src="analysisData.videoUrl"
        controls
        autoplay
        class="video-player"
        ref="videoPlayerRef"
      ></video>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch, nextTick } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useWebSocket } from '@/composables/useWebSocket'
import { use } from 'echarts/core'
import { CanvasRenderer } from 'echarts/renderers'
import { PieChart, BarChart, LineChart, RadarChart } from 'echarts/charts'
import {
  TitleComponent,
  TooltipComponent,
  LegendComponent,
  GridComponent,
  MarkPointComponent,
  MarkLineComponent,
  RadarComponent
} from 'echarts/components'
import VChart from 'vue-echarts'
import { ElMessage } from 'element-plus'
import { 
  getVideoList, 
  getResultByVideoId,
  getResultById,
  type VideoInfo 
} from '@/api'
import type { AnalysisResultVO, RiskLevel, SentimentLabel } from '@/types'
// 导入证据抽屉组件和数据
import EvidenceDrawer from '@/components/EvidenceDrawer.vue'
import type { CardData } from '@/components/EvidenceDrawer.vue'
import ReportView from '@/components/ReportView.vue'
// 导入统一的分析结果mock数据（核心数据源 - 唯一数据源）
import { mockAnalysisResult } from '@/data/mockAnalysisResult'
import type { ModalityFusion, StatisticsData, Evidence, Detection, RiskEvidence, AIProfileResult, SceneInfo } from '@/data/mockAnalysisResult'
// 导入Element Plus图标
import { User, School, ChatDotRound, TrendCharts, WarningFilled, DocumentChecked } from '@element-plus/icons-vue'

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
  MarkLineComponent
])

const route = useRoute()
const router = useRouter()

// WebSocket - 当任务完成时刷新视频列表
const { subscribeCompleted } = useWebSocket()

const loading = ref(false)
const selectedVideoId = ref<string>('')
const videoList = ref<VideoInfo[]>([])
const analysisData = ref<AnalysisResultVO | null>(null)
const videoDialogVisible = ref(false)
const videoStartTime = ref(0)  // 视频起始播放时间
const emptyMessage = ref('请选择一个视频')
const showVideoDrawer = ref(false)

// 视图模式：交互式 or 报告式
const viewMode = ref<'interactive' | 'report'>('interactive')

// ==================== 从统一数据源提取数据（替代散落的mock定义） ====================
// 提取各个分析结果（便捷引用）
const mockVideoArchive = mockAnalysisResult.videoInfo
const mockIdentityAnalysis = mockAnalysisResult.identity
const mockUniversityBaseline = mockAnalysisResult.university

// 计算attitude的统计数据（前端统计）
const attitudeStatistics = computed(() => {
  const evidences = mockAnalysisResult.attitude.evidences
  const positive = evidences.filter(e => e.sentiment === 'positive').length
  const neutral = evidences.filter(e => e.sentiment === 'neutral').length
  const negative = evidences.filter(e => e.sentiment === 'negative').length
  const total = evidences.length
  return { positive, neutral, negative, total }
})

const mockContentAnalysis = {
  topicCategory: mockAnalysisResult.topic.topicCategory,
  topicSubCategory: mockAnalysisResult.topic.topicSubCategory,
  sentimentTowardSchool: mockAnalysisResult.attitude.sentimentTowardSchool,
  get negativeMentionCount() { return attitudeStatistics.value.negative },
  get schoolMentionCount() { return attitudeStatistics.value.total }
}
const mockOpinionRisk = {
  riskLevel: mockAnalysisResult.opinionRisk.riskLevel,
  riskLabel: mockAnalysisResult.opinionRisk.riskLabel,
  riskReason: mockAnalysisResult.opinionRisk.riskReason,
  actionSuggestion: mockAnalysisResult.action.actionSuggestion,
  actionDetail: mockAnalysisResult.action.actionDetail
}
// 提取台词转录数据
const mockTranscriptSegmentsData = mockAnalysisResult.transcriptSegments
// 提取时间轴数据
const timeGranularity = mockAnalysisResult.timelineData.timeGranularity  // 时间粒度
const mockVideoRisksData = mockAnalysisResult.timelineData.videoRisks
const mockAudioEmotionsData = mockAnalysisResult.timelineData.audioEmotions
const mockTextRisksData = mockAnalysisResult.timelineData.textRisks
const mockComprehensiveRisksData = mockAnalysisResult.timelineData.comprehensiveRisks
const mockRadarDataByTime = mockAnalysisResult.timelineData.radarByTime
const mockAverageRadarData = mockAnalysisResult.timelineData.averageRadarData  // 全片平均雷达数据
// 提取辅助分析数据
const mockRiskEvidence = mockAnalysisResult.riskEvidences
const mockAIProfile = mockAnalysisResult.aiProfile
const mockDetections = mockAnalysisResult.cvDetections
const mockScenes = mockAnalysisResult.sceneRecognition

// 卡片UI配置（动态从mockAnalysisResult获取数据）
const cardsData = computed<CardData[]>(() => [
  {
    id: 'identity',
    label: '身份判定',
    value: mockAnalysisResult.identity.identityLabel,
    confidence: mockAnalysisResult.identity.modalityFusion.finalScore,
    confidenceLabel: '识别置信度',
    icon: User,
    iconClass: 'icon-bg-identity'
  },
  {
    id: 'university',
    label: '涉及高校',
    value: mockAnalysisResult.university.universityName,
    confidence: mockAnalysisResult.university.modalityFusion.finalScore,
    confidenceLabel: '匹配度',
    icon: School,
    iconClass: 'icon-bg-uni'
  },
  {
    id: 'topic',
    label: '内容主题',
    value: mockAnalysisResult.topic.topicCategory,
    confidence: mockAnalysisResult.topic.modalityFusion.finalScore,
    confidenceLabel: '主题置信度',
    icon: ChatDotRound,
    iconClass: 'icon-bg-topic'
  },
  {
    id: 'attitude',
    label: '对学校态度',
    value: mockAnalysisResult.attitude.sentimentLabel,
    confidence: Math.round((attitudeStatistics.value.negative / attitudeStatistics.value.total) * 100),
    confidenceLabel: '负面占比',
    icon: TrendCharts,
    iconClass: 'icon-bg-negative'
  },
  {
    id: 'opinionRisk',
    label: '潜在舆论风险',
    value: mockAnalysisResult.opinionRisk.riskLabel,
    confidence: mockAnalysisResult.opinionRisk.modalityFusion.finalScore,
    confidenceLabel: '风险指数',
    icon: WarningFilled,
    iconClass: 'icon-bg-risk-medium'
  },
  {
    id: 'action',
    label: '处置建议',
    value: mockAnalysisResult.action.actionSuggestion,
    confidence: mockAnalysisResult.action.modalityFusion.finalScore,
    confidenceLabel: '紧急程度',
    icon: DocumentChecked,
    iconClass: 'icon-bg-action'
  }
])

// ==================== 证据详情面板相关状态 ====================
const currentCardId = ref<string>('')
const currentCardData = computed<CardData>(() => {
  const card = cardsData.value.find(c => c.id === currentCardId.value)
  return card || cardsData.value[0]
})

// 当前卡片的证据和融合数据（从对应的分析对象中获取）
const currentEvidences = computed(() => {
  const cardId = currentCardId.value
  if (cardId === 'identity') return mockAnalysisResult.identity.evidences
  if (cardId === 'university') return mockAnalysisResult.university.evidences
  if (cardId === 'topic') return mockAnalysisResult.topic.evidences
  if (cardId === 'attitude') return mockAnalysisResult.attitude.evidences
  if (cardId === 'opinionRisk') return mockAnalysisResult.opinionRisk.evidences
  if (cardId === 'action') return mockAnalysisResult.action.evidences
  return []
})

// 当前卡片的多模态融合数据（仅加权融合分类使用）
const currentFusion = computed<ModalityFusion | null>(() => {
  const cardId = currentCardId.value
  if (cardId === 'identity') return mockAnalysisResult.identity.modalityFusion
  if (cardId === 'university') return mockAnalysisResult.university.modalityFusion
  if (cardId === 'topic') return mockAnalysisResult.topic.modalityFusion
  if (cardId === 'attitude') return null  // 统计分类，无融合数据
  if (cardId === 'opinionRisk') return mockAnalysisResult.opinionRisk.modalityFusion
  if (cardId === 'action') return mockAnalysisResult.action.modalityFusion
  return mockAnalysisResult.identity.modalityFusion
})

// 判断当前卡片是否为统计分类
const isStatisticsCard = computed(() => currentCardId.value === 'attitude')

// 当前卡片的统计数据（仅attitude使用）
const currentStatistics = computed(() => {
  if (currentCardId.value === 'attitude') {
    return attitudeStatistics.value
  }
  return null
})

// 根据cardId获取结果标签
const getResultLabel = (cardId: string): string => {
  const labels: Record<string, string> = {
    'identity': '识别置信度',
    'university': '关联置信度',
    'topic': '主题置信度',
    'opinionRisk': '风险指数',
    'action': '紧急程度'
  }
  return labels[cardId] || '置信度'
}

// 前端生成融合公式
const getFusionFormula = (fusion: ModalityFusion | null): string => {
  if (!fusion) return ''
  return `视频${fusion.videoContribution.toFixed(1)} + 音频${fusion.audioContribution.toFixed(1)} + 文本${fusion.textContribution.toFixed(1)}`
}

// 分类证据
const videoEvidences = computed(() => 
  currentEvidences.value.filter(e => e.type === 'video')
)

const audioEvidences = computed(() => 
  currentEvidences.value.filter(e => e.type === 'audio')
)

const textEvidences = computed(() => 
  currentEvidences.value.filter(e => e.type === 'text')
)

// 计算各模态的统计数据（用于统计类型卡片）
const getModalityStatistics = (modalityType: 'video' | 'audio' | 'text') => {
  const evidences = currentEvidences.value.filter(e => e.type === modalityType)
  const positive = evidences.filter(e => e.sentiment === 'positive').length
  const neutral = evidences.filter(e => e.sentiment === 'neutral').length
  const negative = evidences.filter(e => e.sentiment === 'negative').length
  const total = evidences.length
  
  return { positive, neutral, negative, total }
}

// 打开/切换证据详情面板（点击卡片）
const openEvidenceDrawer = (cardId: string) => {
  // 如果点击的是当前已打开的卡片，则关闭证据面板
  if (currentCardId.value === cardId) {
    closeEvidencePanel()
    return
  }
  
  // 否则打开或切换到新卡片
  currentCardId.value = cardId
  // 设置证据面板高度
  nextTick(() => {
    const videoSection = document.querySelector('.video-section') as HTMLElement
    const rightPanel = document.querySelector('.right-panel-container') as HTMLElement
    
    if (videoSection && rightPanel) {
      // 设置右侧面板的最大高度等于左侧视频区域的高度
      setTimeout(() => {
        const videoSectionHeight = videoSection.offsetHeight
        rightPanel.style.maxHeight = `${videoSectionHeight}px`
      }, 100)
    }
  })
}

// 关闭证据详情面板
const closeEvidencePanel = () => {
  currentCardId.value = ''
  // 清除高度限制
  nextTick(() => {
    const rightPanel = document.querySelector('.right-panel-container') as HTMLElement
    if (rightPanel) {
      rightPanel.style.maxHeight = ''
    }
  })
}

// 获取证据类型样式类
const getEvidenceTypeClass = (type: string): string => {
  const classMap: Record<string, string> = {
    video: 'mark-video',
    audio: 'mark-audio',
    text: 'mark-text'
  }
  return classMap[type] || ''
}

// 格式化时间显示
const formatTimeDisplay = (seconds: number): string => {
  const mins = Math.floor(seconds / 60)
  const secs = Math.floor(seconds % 60)
  return `${mins}:${secs.toString().padStart(2, '0')}`
}

// 判断是否接近当前播放时间（±2秒内）
const isNearCurrentTime = (timestamp: number): boolean => {
  return Math.abs(currentPlayTime.value - timestamp) <= 2
}

// 主视频播放器引用
const mainVideoPlayerRef = ref<HTMLVideoElement | null>(null)

// 当前播放时间
const currentPlayTime = ref(0)

// 视频真实时长（秒）- 从 mock 数据初始化，视频加载成功后会更新为真实时长
const videoDuration = ref(mockAnalysisResult.videoInfo.duration)

// 当前激活的台词段落索引
const currentSegmentIndex = ref(-1)

// 当前显示的检测框
const currentDetection = ref<any>(null)

// 控制检测框的显示/隐藏
const showDetectionBoxes = ref(true)

// 控制图例的展开/收起
const legendExpanded = ref(false)

// ==================== 检测框颜色配置（业界标准） ====================
const DETECTION_COLORS: Record<string, string> = {
  face: '#00ff88',      // 人脸识别 - 绿色
  ocr: '#ffd700',       // 文字识别 - 金色
  logo: '#4a90e2',      // 校徽/Logo - 蓝色
  scene: '#a29bfe',     // 校园场景 - 紫色
  emotion: '#ff6348',   // 情绪检测 - 橙红色
  mention: '#ff4757',   // 学校提及 - 红色（重点关注）
  uniform: '#ff9500',   // 校服检测 - 橙色
  banner: '#ff3b30'     // 横幅检测 - 红色
}

const DETECTION_LABELS: Record<string, string> = {
  face: '人脸识别',
  ocr: '文字识别',
  logo: '校徽/Logo',
  scene: '校园场景',
  emotion: '情绪检测',
  mention: '学校提及',
  uniform: '校服检测',
  banner: '横幅检测'
}

// 时间轴图表引用
const timelineChartRef = ref<any>(null)

// 雷达图表引用
const radarChartRef = ref<any>(null)

// 记录鼠标是否在雷达图上（用于保持tooltip显示）
const isMouseOnRadar = ref(false)

// 分析页面根容器引用
const analysisPageRef = ref<HTMLDivElement | null>(null)

// 页面级ResizeObserver实例
let pageResizeObserver: ResizeObserver | null = null

// ==================== CV视觉模态：视频显示区域计算（精确定位检测框） ====================
// 视频播放器ResizeObserver实例
let videoResizeObserver: ResizeObserver | null = null

// 视频实际显示区域信息（用于精确定位检测框）
interface VideoDisplayArea {
  offsetX: number      // 视频显示区域左侧偏移（像素）
  offsetY: number      // 视频显示区域顶部偏移（像素）
  displayWidth: number // 视频实际显示宽度（像素）
  displayHeight: number // 视频实际显示高度（像素）
  containerWidth: number // 容器宽度（像素）
  containerHeight: number // 容器高度（像素）
}

const videoDisplayArea = ref<VideoDisplayArea>({
  offsetX: 0,
  offsetY: 0,
  displayWidth: 0,
  displayHeight: 0,
  containerWidth: 0,
  containerHeight: 0
})


// 当前选中的证据ID
const selectedEvidenceId = ref<string>('')

// 风险过滤器状态
const riskFilter = ref<'all' | 'medium-high' | 'high'>('all')

// 真实视频URL
// const realVideoUrl = ref('https://5aedd2d8.r12.cpolar.top/ican-videos/videos/2026/02/01/ae8f478c008b448c865a03cabdeeec1a.mp4')
const realVideoUrl = ref('http://47.110.33.16:9000/ican-videos/videos/2026/02/06/1329d3084a9448bb9e211c2245aeffa1.mp4?X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Credential=minioadmin%2F20260206%2Fus-east-1%2Fs3%2Faws4_request&X-Amz-Date=20260206T192651Z&X-Amz-Expires=604800&X-Amz-SignedHeaders=host&X-Amz-Signature=107ffdf57a21829d6930d2392ccea41c3c5eb288f73289b7260814ed58ca7548')


// ==================== 动态雷达图数据（根据视频时间变化） ====================
// 雷达图时间段数据已从mockAnalysisResult导入（第1307行）

// 当前时间点的雷达图数据（基于索引计算）
const currentRadarData = computed(() => {
  const currentTime = currentPlayTime.value
  const index = Math.min(Math.floor(currentTime / timeGranularity), mockRadarDataByTime.length - 1)
  return mockRadarDataByTime[index].data
})

// 当前选中的证据对象
const currentEvidence = computed(() => {
  return mockRiskEvidence.find(e => e.id === selectedEvidenceId.value) || mockRiskEvidence[0]
})

// 过滤后的风险证据列表
const filteredRiskEvidence = computed(() => {
  if (riskFilter.value === 'all') {
    return mockRiskEvidence
  } else if (riskFilter.value === 'medium-high') {
    return mockRiskEvidence.filter(e => e.riskLevel === 'high' || e.riskLevel === 'medium')
  } else if (riskFilter.value === 'high') {
    return mockRiskEvidence.filter(e => e.riskLevel === 'high')
  }
  return mockRiskEvidence
})

// 判断当前选中的字幕是否正在播放中（用于区分"正在播放"和"已结束"状态）
const isCurrentEvidenceActive = computed(() => {
  if (!selectedEvidenceId.value || !currentEvidence.value) return false
  const currentTime = currentPlayTime.value
  const evidence = currentEvidence.value
  return currentTime >= evidence.timeSeconds && currentTime < (evidence.timeEndSeconds || evidence.timeSeconds + 10)
})

// ==================== CV视觉模态：当前显示的检测框和场景 ====================
// 当前显示的所有检测框（根据视频时间筛选）
const currentDetections = computed(() => {
  const currentTime = currentPlayTime.value
  return mockDetections.filter(detection => 
    currentTime >= detection.timeStart && currentTime <= detection.timeEnd
  )
})

// 当前场景信息
const currentScene = computed(() => {
  const currentTime = currentPlayTime.value
  return mockScenes.find(scene => 
    currentTime >= scene.timeStart && currentTime <= scene.timeEnd
  )
})

// 格式化当前播放时间为 MM:SS 格式
const formattedCurrentTime = computed(() => {
  const seconds = Math.floor(currentPlayTime.value)
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
})

// ==================== 视频档案数据已从mockAnalysisResult导入 ====================

// ==================== 旧的interface定义已删除，统一使用mockAnalysisResult ====================

// 辅助函数：获取情感标签
const getSentimentLabel = (sentiment: string): string => {
  const labels: Record<string, string> = {
    'positive': '正面/积极',
    'neutral': '中性/客观',
    'negative': '负面/不满'
  }
  return labels[sentiment] || '未知'
}

// 辅助函数：获取情感图标样式
const getSentimentIconClass = (sentiment: string): string => {
  const classes: Record<string, string> = {
    'positive': 'icon-bg-positive',
    'neutral': 'icon-bg-neutral',
    'negative': 'icon-bg-negative'
  }
  return classes[sentiment] || 'icon-bg-neutral'
}

// 辅助函数：获取情感文字样式
const getSentimentTextClass = (sentiment: string): string => {
  const classes: Record<string, string> = {
    'positive': 'text-positive',
    'neutral': 'text-neutral',
    'negative': 'text-negative'
  }
  return classes[sentiment] || 'text-neutral'
}

// 辅助函数：获取舆论风险图标样式
const getOpinionRiskIconClass = (level: string): string => {
  const classes: Record<string, string> = {
    'low': 'icon-bg-risk-low',
    'medium': 'icon-bg-risk-medium',
    'high': 'icon-bg-risk-high'
  }
  return classes[level] || 'icon-bg-risk-medium'
}

// 辅助函数：获取舆论风险文字样式
const getOpinionRiskTextClass = (level: string): string => {
  const classes: Record<string, string> = {
    'low': 'text-risk-low',
    'medium': 'text-risk-medium',
    'high': 'text-risk-high'
  }
  return classes[level] || 'text-risk-medium'
}

// 辅助函数：获取证据面板主值的颜色类（确保与卡片颜色一致）
const getPanelValueClass = (): string => {
  if (!currentCardId.value) return ''
  
  // 根据不同的卡片ID返回对应的颜色类
  switch (currentCardId.value) {
    case 'identity':
      return 'text-identity'
    case 'university':
      return 'text-uni'
    case 'topic':
      return 'text-topic'
    case 'attitude':
      return getSentimentTextClass(mockContentAnalysis.sentimentTowardSchool)
    case 'opinionRisk':
      return getOpinionRiskTextClass(mockOpinionRisk.riskLevel)
    case 'action':
      return 'text-action'
    default:
      return ''
  }
}

// 传播潜力标签应该由Python后端判断并返回，前端不再自己判断

// ==================== 高校舆情分析核心数据 END ====================


// 台词转录数据（直接使用统一数据源）
const mockTranscriptSegments = computed(() => mockTranscriptSegmentsData)

// 视频风险点（直接使用统一数据源）
const mockVideoRisks = computed(() => mockVideoRisksData)


// 音频情绪数据（直接使用统一数据源）
const mockAudioEmotions = computed(() => mockAudioEmotionsData)

// 文本风险数据（直接使用统一数据源）
const mockTextRisks = computed(() => mockTextRisksData)

// 综合风险数据（直接使用统一数据源）
const mockComprehensiveRisks = computed(() => mockComprehensiveRisksData)

// 统计数据（用于模板）
const angryEmotionCount = computed(() => {
  return mockAudioEmotions.value.filter(e => e.emotion === 'angry').length
})

const highRiskSegmentCount = computed(() => {
  return mockTranscriptSegments.value.filter(s => s.riskLevel === 'high').length
})

// ==================== Gemini优化：多模态融合雷达图数据 ====================
const multiModalRadarOption = computed(() => {
  // 高校舆情分析维度说明映射
  const dimensionDesc: Record<string, string> = {
    '身份置信度': '判定发布者为本校学生/校友的置信程度',
    '学校关联度': '视频内容与学校相关话题的关联程度',
    '负面情感度': '对学校表达负面情绪的强度',
    '传播风险': '内容引发校园舆论传播的可能性',
    '影响范围': '对学校声誉的潜在影响程度',
    '处置紧迫度': '需要校方介入处理的紧迫程度'
  }
  
  return {
    tooltip: {
      trigger: 'item',
      appendToBody: true,  // 允许自由移动
      confine: false,
      // 强制左上方，无任何判断
      position: function (point: number[], params: any, dom: HTMLElement, rect: any, size: {contentSize: number[], viewSize: number[]}) {
        const [mouseX, mouseY] = point
        const [contentWidth, contentHeight] = size.contentSize
        
        // 强制左上方（永远！）
        return [mouseX - contentWidth - 15, mouseY - contentHeight - 15]
      },
      enterable: true,
      backgroundColor: 'rgba(255, 255, 255, 0.98)',
      borderColor: 'rgba(209, 217, 230, 0.4)',
      borderWidth: 1,
      padding: 16,
      textStyle: { 
        color: '#181818', 
        fontSize: 13,
        lineHeight: 20
      },
      extraCssText: 'box-shadow: 0 4px 20px rgba(0,0,0,0.12); border-radius: 12px; max-width: 340px; max-height: 550px; overflow-y: auto;',
      formatter: (params: any) => {
        if (!params || !params.name) return ''
        
        const values = params.value || []
        const dimensions = ['身份置信度', '学校关联度', '负面情感度', '传播风险', '影响范围', '处置紧迫度']
        
        let html = `
          <div style="min-width: 260px;">
            <div style="font-size: 14px; font-weight: 600; color: #111827; margin-bottom: 8px; border-bottom: 1.5px solid #111827; padding-bottom: 6px;">
              <i class="fas fa-chart-area" style="margin-right: 4px;"></i>
              ${params.name}
            </div>
            <div style="display: flex; flex-direction: column; gap: 6px;">
        `
        
        dimensions.forEach((dim, index) => {
          const value = values[index] || 0
          let levelText = '正常'
          let levelColor = '#10b981'  // 默认绿色
          
          // 根据风险值动态设置颜色
          if (value > 66.7) {
            levelText = '高'
            levelColor = '#ef4444'  // 红色
          } else if (value >= 33.3) {
            levelText = '中'
            levelColor = '#f59e0b'  // 橙色
          } else {
            levelText = '低'
            levelColor = '#10b981'  // 绿色
          }
          
          html += `
            <div style="background: rgba(0,0,0,0.02); padding: 6px 8px; border-radius: 4px;">
              <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 3px;">
                <span style="font-weight: 600; color: #333; font-size: 12px;">${dim}</span>
                <span style="font-weight: 700; font-size: 14px; color: ${levelColor};">${value}%</span>
              </div>
              <div style="display: flex; align-items: center; gap: 6px;">
                <div style="flex: 1; height: 5px; background: rgba(0,0,0,0.08); border-radius: 2px; overflow: hidden;">
                  <div style="width: ${value}%; height: 100%; background: ${levelColor};"></div>
                </div>
                <span style="font-size: 10px; font-weight: 600; color: ${levelColor}; min-width: 40px; text-align: right;">${levelText}</span>
              </div>
            </div>
          `
        })
        
        // 获取当前时间对应的综合风险分（直接引用 comprehensiveRisks）
        const currentTime = currentPlayTime.value
        const index = Math.min(Math.floor(currentTime / timeGranularity), mockComprehensiveRisksData.length - 1)
        const comprehensiveRisk = mockComprehensiveRisksData[index]
        const avgRisk = comprehensiveRisk.intensity * 100  // 转为百分比
        
        let overallLevel = '低风险'
        let overallColor = '#10b981'  // 默认绿色
        
        if (avgRisk > 66.7) {
          overallLevel = '高风险'
          overallColor = '#ef4444'  // 红色
        } else if (avgRisk >= 33.3) {
          overallLevel = '中等风险'
          overallColor = '#f59e0b'  // 橙色
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
        `
        
        return html
      }
    },
    radar: {
      center: ['45%', '50%'],  // 👈 添加这行：雷达图中心位置 [左右, 上下]
      radius: '75%', 
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
      name: {
        textStyle: {
          color: '#666',
          fontSize: 11
        }
      },
      splitLine: {
        lineStyle: {
          color: 'rgba(209, 217, 230, 0.4)'
        }
      },
      splitArea: {
        areaStyle: {
          color: ['rgba(236, 240, 243, 0.3)', 'rgba(236, 240, 243, 0.5)']
        }
      },
      axisLine: {
        lineStyle: {
          color: 'rgba(209, 217, 230, 0.5)'
        }
      }
    },
    series: [
      // 底层（基准层）：全片平均雷达数据 - 静态参考线
      {
        type: 'radar',
        symbol: 'none',  // 不显示数据点
        data: [
          {
            value: mockAverageRadarData,  // 静态数据：全片平均值
            name: '全片平均水平',
            lineStyle: {
              color: 'rgba(180, 188, 208, 0.6)',  // 浅灰蓝色
              width: 2,
              type: 'dashed'  // 虚线
            },
            areaStyle: {
              color: 'rgba(180, 188, 208, 0.08)'  // 极低透明度填充
            }
          }
        ],
        label: {
          show: false
        },
        z: 1  // 层级较低
      },
      // 顶层（实时层）：当前时刻雷达数据 - 动态变化
      {
        type: 'radar',
        symbol: 'circle',
        symbolSize: 6,
        data: [
          {
            value: currentRadarData.value, // 动态数据：根据视频时间变化
            name: '高校舆情风险画像',
            itemStyle: {
              color: '#f56c6c'
            },
            lineStyle: {
              color: '#f56c6c',
              width: 2
            },
            areaStyle: {
              color: 'rgba(245, 108, 108, 0.25)'
            }
          }
        ],
        label: {
          show: false
        },
        z: 2  // 层级较高
      }
    ],
    // 动画配置：平滑过渡动画
    animation: true,
    animationDuration: 800,        // 初始加载动画：800ms
    animationEasing: 'cubicInOut',
    animationDurationUpdate: 600,  // 数据更新动画：600ms，平滑过渡
    animationEasingUpdate: 'cubicOut', // 缓出效果，更自然
    // 静默更新：不触发鼠标事件重置
    silent: false
  }
})

// ==================== 报告视图专用雷达图配置 ====================
// 1. 最高风险雷达图 - 找出综合风险最高的时间段
const peakRiskData = computed(() => {
  let maxRisk = 0
  let peakData = mockRadarDataByTime[0] || { data: [0, 0, 0, 0, 0, 0] }
  
  mockRadarDataByTime.forEach(timeData => {
    const avgRisk = timeData.data.reduce((a, b) => a + b, 0) / timeData.data.length
    if (avgRisk > maxRisk) {
      maxRisk = avgRisk
      peakData = timeData
    }
  })
  
  return {
    data: peakData?.data || [0, 0, 0, 0, 0, 0],
    avgRisk: Math.round(maxRisk)
  }
})

// 2. 平均雷达图配置 - 使用后端提供的全片平均数据
const averageRadarOption = computed(() => {
  const dimensionNames = ['身份置信度', '学校关联度', '负面情感度', '传播风险', '影响范围', '处置紧迫度']
  
  return {
    tooltip: {
      trigger: 'item'
    },
    radar: {
      indicator: dimensionNames.map(name => ({
        name,
        max: 100
      })),
      radius: '65%',
      splitNumber: 4,
      name: {
        textStyle: {
          color: '#666',
          fontSize: 12
        }
      },
      splitLine: {
        lineStyle: {
          color: 'rgba(209, 217, 230, 0.4)'
        }
      },
      splitArea: {
        areaStyle: {
          color: ['rgba(236, 240, 243, 0.3)', 'rgba(236, 240, 243, 0.5)']
        }
      },
      axisLine: {
        lineStyle: {
          color: 'rgba(209, 217, 230, 0.5)'
        }
      }
    },
    series: [
      {
        type: 'radar',
        symbol: 'circle',
        symbolSize: 6,
        data: [
          {
            value: mockAverageRadarData,  // 直接使用后端提供的平均数据
            name: '平均风险画像',
            areaStyle: {
              color: 'rgba(75, 112, 226, 0.2)'
            },
            lineStyle: {
              color: '#4b70e2',
              width: 2
            },
            itemStyle: {
              color: '#4b70e2'
            }
          }
        ]
      }
    ]
  }
})

// 最高风险雷达图配置
const peakRiskRadarOption = computed(() => {
  const dimensionNames = ['身份置信度', '学校关联度', '负面情感度', '传播风险', '影响范围', '处置紧迫度']
  const peak = peakRiskData.value
  
  return {
    title: {
      text: `峰值时段：${formatTimeDisplay(peak.timeStart)} - ${formatTimeDisplay(peak.timeEnd)}`,
      left: 'center',
      top: 10,
      textStyle: {
        fontSize: 13,
        color: '#f56c6c',
        fontWeight: 600
      }
    },
    tooltip: {
      trigger: 'item'
    },
    radar: {
      indicator: dimensionNames.map(name => ({
        name,
        max: 100
      })),
      radius: '60%',
      center: ['50%', '55%'],
      splitNumber: 4,
      name: {
        textStyle: {
          color: '#666',
          fontSize: 12
        }
      },
      splitLine: {
        lineStyle: {
          color: 'rgba(209, 217, 230, 0.4)'
        }
      },
      splitArea: {
        areaStyle: {
          color: ['rgba(236, 240, 243, 0.3)', 'rgba(236, 240, 243, 0.5)']
        }
      },
      axisLine: {
        lineStyle: {
          color: 'rgba(209, 217, 230, 0.5)'
        }
      }
    },
    series: [
      {
        type: 'radar',
        symbol: 'circle',
        symbolSize: 6,
        data: [
          {
            value: peak.data,
            name: `最高风险画像（${peak.avgRisk}分）`,
            areaStyle: {
              color: 'rgba(245, 108, 108, 0.25)'
            },
            lineStyle: {
              color: '#f56c6c',
              width: 2
            },
            itemStyle: {
              color: '#f56c6c'
            }
          }
        ]
      }
    ]
  }
})

// 新拟态配色
const neuColors = {
  purple: '#4b70e2',
  gray: '#a0a5a8',
  black: '#181818',
  neu1: '#ecf0f3',
  neu2: '#d1d9e6'
}

// 风险评分图表配置
const riskChartOption = computed(() => {
  if (!analysisData.value) return {}
  
  return {
    tooltip: {
      trigger: 'item',
      formatter: '{b}: {c}%'
    },
    series: [
      {
        type: 'pie',
        radius: ['45%', '70%'],
        avoidLabelOverlap: false,
        itemStyle: {
          borderRadius: 8,
          borderColor: neuColors.neu1,
          borderWidth: 3
        },
        label: {
          show: true,
          formatter: '{b}\n{d}%',
          color: neuColors.black
        },
        emphasis: {
          label: {
            show: true,
            fontSize: 14,
            fontWeight: 'bold'
          }
        },
        data: [
          { 
            value: Math.round((mockAnalysisResult.opinionRisk.modalityFusion?.finalScore || 0)), 
            name: '风险评分', 
            itemStyle: { color: '#f56c6c' } 
          },
          { 
            value: Math.round(100 - (mockAnalysisResult.opinionRisk.modalityFusion?.finalScore || 0)), 
            name: '安全评分', 
            itemStyle: { color: '#52c41a' } 
          }
        ]
      }
    ]
  }
})

// 受众年龄分布图表
const audienceChartOption = computed(() => {
  if (!analysisData.value?.audienceAnalysis?.ageDistribution) return {}
  
  const dist = analysisData.value.audienceAnalysis.ageDistribution
  
  return {
    tooltip: {
      trigger: 'axis',
      axisPointer: { type: 'shadow' }
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '3%',
      top: '10%',
      containLabel: true
    },
    xAxis: {
      type: 'category',
      data: ['18-24岁', '25-34岁', '35-44岁', '45岁+'],
      axisLine: { lineStyle: { color: neuColors.neu2 } },
      axisLabel: { color: neuColors.gray, fontSize: 11 }
    },
    yAxis: {
      type: 'value',
      max: 100,
      axisLine: { show: false },
      splitLine: { lineStyle: { color: '#e8edf3' } },
      axisLabel: { 
        color: neuColors.gray, 
        fontSize: 11,
        formatter: '{value}%'
      }
    },
    series: [
      {
        type: 'bar',
        barWidth: '50%',
        data: [
          { value: Math.round(dist['18-24'] * 100), itemStyle: { color: neuColors.purple } },
          { value: Math.round(dist['25-34'] * 100), itemStyle: { color: '#7c9df7' } },
          { value: Math.round(dist['35-44'] * 100), itemStyle: { color: '#a3bef9' } },
          { value: Math.round(dist['45+'] * 100), itemStyle: { color: '#c5d5fb' } }
        ],
        itemStyle: {
          borderRadius: [6, 6, 0, 0]
        }
      }
    ]
  }
})

// 多模态时间轴配置（交互视图专用 - 增强版）
const multiModalTimelineOption = computed(() => {
  // 使用视频真实时长，确保时间轴与视频进度精确对齐（不依赖analysisData，使用mock数据）
  const duration = videoDuration.value
  const timePoints: number[] = []
  for (let t = 0; t <= duration; t += 5) {
    timePoints.push(t)
  }
  
  // 多模态数据（三条独立曲线）
  const multiModalData = timePoints.map(t => {
    // 根据时间计算索引（使用时间粒度），限制不越界
    const rawIndex = Math.floor(t / timeGranularity)
    const index = Math.min(rawIndex, mockVideoRisks.value.length - 1)
    
    // 视频风险（使用索引查询，O(1)复杂度）
    const videoRisk = mockVideoRisks.value[index]
    const videoScore = videoRisk ? videoRisk.intensity * 100 : 0
    
    // 音频情绪风险（使用索引查询，O(1)复杂度）
    const audioEmotion = mockAudioEmotions.value[index]
    const audioScore = audioEmotion ? audioEmotion.intensity * 100 : 0
    
    // 文本风险（使用索引查询，O(1)复杂度）
    const textRisk = mockTextRisks.value[index]
    const textScore = textRisk ? textRisk.intensity * 100 : 0
    
    // 综合风险（使用索引查询，O(1)复杂度）
    const comprehensiveRisk = mockComprehensiveRisks.value[index]
    const comprehensiveScore = comprehensiveRisk ? comprehensiveRisk.intensity * 100 : 0
    
    return {
      time: t,
      videoScore,
      audioScore,
      textScore,
      comprehensiveScore,
      videoRisk,
      audioEmotion,
      textSegment: textRisk,
      comprehensiveRisk
    }
  })
  
  // 提取四个模态的独立数据数组（改为二维数组格式 [x, y]）
  const videoData = multiModalData.map(d => [d.time, d.videoScore])
  const audioData = multiModalData.map(d => [d.time, d.audioScore])
  const textData = multiModalData.map(d => [d.time, d.textScore])
  const comprehensiveData = multiModalData.map(d => [d.time, d.comprehensiveScore])
  
  return {
    tooltip: {
      trigger: 'axis',
      appendToBody: true,  // 允许自由移动
      confine: false,
      // 强制上方显示，不做任何判断
      position: function (point: number[], params: any, dom: HTMLElement, rect: any, size: {contentSize: number[], viewSize: number[]}) {
        const [mouseX, mouseY] = point
        const [contentWidth, contentHeight] = size.contentSize
        const viewWidth = window.innerWidth
        
        // 强制在鼠标上方
        let x = mouseX + 15
        let y = mouseY - contentHeight - 15
        
        // 只检测左右边界
        if (x + contentWidth > viewWidth - 20) {
          x = mouseX - contentWidth - 15
        }
        if (x < 20) {
          x = 20
        }
        
        return [x, y]
      },
      axisPointer: { 
        type: 'line',
        snap: false,  // 不吸附到数据点，精确跟随鼠标位置
        lineStyle: { 
          color: 'rgba(75, 112, 226, 0.4)', 
          width: 1,
          type: 'dashed'
        },
        label: {
          show: true,
          backgroundColor: '#4b70e2',
          borderColor: '#4b70e2',
          borderWidth: 1,
          color: '#fff',
          fontSize: 12,
          fontWeight: 'bold',
          padding: [4, 8],
          borderRadius: 4,
          shadowBlur: 4,
          shadowColor: 'rgba(75, 112, 226, 0.3)',
          formatter: (params: any) => {
            const value = params.value
            const m = Math.floor(value / 60)
            const s = Math.floor(value % 60)
            return `${m}:${s.toString().padStart(2, '0')}`
          }
        }
      },
      backgroundColor: 'rgba(255, 255, 255, 0.98)',
      borderColor: 'rgba(209, 217, 230, 0.4)',
      borderWidth: 1,
      padding: [8, 15],
      textStyle: { color: '#181818', fontSize: 12 },
      extraCssText: 'box-shadow: 0 4px 16px rgba(0,0,0,0.08); border-radius: 10px;',
      formatter: (params: any) => {
        if (!params || params.length === 0) return ''
        
        const dataIndex = params[0].dataIndex
        const data = multiModalData[dataIndex]
        if (!data) return ''
        
        // 使用comprehensiveScore作为综合风险
        const comprehensiveScore = data.comprehensiveScore
        let riskColor = '#10b981'
        let riskBg = 'rgba(16, 185, 129, 0.1)'
        if (comprehensiveScore >= 70) {
          riskColor = '#ef4444'
          riskBg = 'rgba(239, 68, 68, 0.1)'
        } else if (comprehensiveScore >= 40) {
          riskColor = '#f59e0b'
          riskBg = 'rgba(245, 158, 11, 0.1)'
        }
        
        let html = `
          <div style="min-width: 200px; max-width: 320px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;">
            <!-- 综合风险标题 -->
            <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 8px;">
              <span style="color: #111827; font-weight: 600; font-size: 15px; flex-shrink: 0; margin-right: 10px;">综合风险</span>
              <div style="display: inline-flex; align-items: center; gap: 6px; background: ${riskBg}; padding: 5px 12px; border-radius: 6px;">
                <div style="width: 6px; height: 6px; border-radius: 50%; background: ${riskColor};"></div>
                <span style="color: ${riskColor}; font-weight: 700; font-size: 16px;">${comprehensiveScore.toFixed(0)}%</span>
              </div>
            </div>
            
            <div style="width: 100%; height: 1px; background: #e5e7eb; margin-bottom: 14px;"></div>
        `
        
        // 1. 视频风险
        const videoColor = data.videoScore < 33.3 ? '#10b981' : data.videoScore > 66.7 ? '#ef4444' : '#f59e0b'
        html += `
          <div style="margin-bottom: 12px;">
            <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 6px;">
              <span style="color: #374151; font-size: 13px; font-weight: 600; min-width: 60px; margin-right: 20px;">视频风险</span>
              <span style="color: ${videoColor}; font-weight: 700; font-size: 15px;">${data.videoScore.toFixed(0)}%</span>
            </div>
            ${data.videoRisk 
              ? `<div style="color: #6b7280; font-size: 12px; line-height: 1.5; padding-left: 8px; border-left: 2px solid ${videoColor};">${data.videoRisk.reason}</div>` 
              : `<div style="color: #9ca3af; font-size: 12px; padding-left: 8px;">该时段画面正常</div>`
            }
          </div>
        `
        
        // 2. 音频情绪
        const audioColor = data.audioScore < 33.3 ? '#10b981' : data.audioScore > 66.7 ? '#ef4444' : '#f59e0b'
        html += `
          <div style="margin-bottom: 12px;">
            <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 6px;">
              <span style="color: #374151; font-size: 13px; font-weight: 600; min-width: 60px; margin-right: 20px;">音频情绪</span>
              <span style="color: ${audioColor}; font-weight: 700; font-size: 15px;">${data.audioScore.toFixed(0)}%</span>
            </div>
            ${data.audioEmotion 
              ? `<div style="color: #6b7280; font-size: 12px; line-height: 1.5; padding-left: 8px; border-left: 2px solid ${audioColor};">${data.audioEmotion.reason}</div>` 
              : `<div style="color: #9ca3af; font-size: 12px; padding-left: 8px;">该时段情绪稳定</div>`
            }
          </div>
        `
        
        // 3. 文本内容
        const textColor = data.textScore < 33.3 ? '#10b981' : data.textScore > 66.7 ? '#ef4444' : '#f59e0b'
        html += `
          <div style="margin-bottom: 12px;">
            <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 6px;">
              <span style="color: #374151; font-size: 13px; font-weight: 600; min-width: 60px; margin-right: 20px;">文本内容</span>
              <span style="color: ${textColor}; font-weight: 700; font-size: 15px;">${data.textScore.toFixed(0)}%</span>
            </div>
            ${data.textSegment 
              ? `<div style="color: #6b7280; font-size: 12px; line-height: 1.5; padding-left: 8px; border-left: 2px solid ${textColor};">${data.textSegment.reason}</div>` 
              : `<div style="color: #9ca3af; font-size: 12px; padding-left: 8px;">该时段内容正常</div>`
            }
          </div>
        `
        
        html += `
            <!-- 底部操作提示 -->
            <div style="margin-top: 14px; padding-top: 8px; border-top: 1px solid #e5e7eb; text-align: center;">
              <span style="color: #6588ed; font-size: 14px; font-weight: 500;">点 击 跳 转</span>
            </div>
          </div>
        `
        
        return html
      }
    },
    legend: {
      data: ['视频风险', '音频情绪', '文本风险', '综合风险'],
      bottom: 5,
      textStyle: { 
        color: '#666', 
        fontSize: 11,
        fontWeight: 'normal'
      },
      itemGap: 20,
      itemWidth: 30,
      itemHeight: 12,
      icon: 'rect',
      padding: [5, 10]
    },
    grid: {
      left: 21,
      right: 22,
      bottom:65, // 从30%改为固定50px，缩小图例与折线图的间距
      top: '5%',
      containLabel: false
    },
    xAxis: {
      type: 'value',
      min: 0,
      max: duration,
      name: '',  // 移除"时间（秒）"文字
      nameTextStyle: { 
        color: '#999', 
        fontSize: 11,
        padding: [5, 0, 0, 0]
      },
      nameGap: 5,
      axisLine: { 
        show: true,
        lineStyle: { 
          color: 'rgba(209, 217, 230, 0.3)',
          width: 1
        } 
      },
      axisTick: { 
        show: true,
        length: 4,
        lineStyle: {
          color: 'rgba(209, 217, 230, 0.5)',
          width: 1
        }
      },
      axisLabel: {
        color: '#666',
        fontSize: 11,
        formatter: (value: number) => formatTimestamp(value),
        margin: 8
      },
      axisPointer: {
        snap: false,  // 关键！让axisPointer不吸附到数据点，精确跟随鼠标
        label: {
          show: true,
          backgroundColor: '#4b70e2',
          borderColor: '#4b70e2',
          borderWidth: 1,
          color: '#fff',
          fontSize: 12,
          fontWeight: 'bold',
          padding: [4, 8],
          borderRadius: 4,
          shadowBlur: 4,
          shadowColor: 'rgba(75, 112, 226, 0.3)',
          formatter: (params: any) => {
            const value = params.value
            const m = Math.floor(value / 60)
            const s = Math.floor(value % 60)
            return `${m}:${s.toString().padStart(2, '0')}`
          }
        }
      }
    },
    yAxis: {
      type: 'value',
      name: '',  // 移除"风险指数"文字
      nameTextStyle: { 
        color: '#999', 
        fontSize: 11 
      },
      min: 0,
      max: 100,
      interval: 20, // 每20%一个刻度（0, 20, 40, 60, 80, 100）
      axisLine: { 
        show: true,
        lineStyle: {
          color: 'rgba(209, 217, 230, 0.3)',
          width: 1
        }
      },
      axisTick: { 
        show: true,
        length: 4,
        lineStyle: {
          color: 'rgba(209, 217, 230, 0.5)',
          width: 1
        }
      },
      splitLine: { 
        show: true,
        lineStyle: { 
          color: 'rgba(209, 217, 230, 0.4)',
          type: 'solid',
          width: 1
        } 
      },
      axisLabel: {
        show: false,  // 隐藏Y轴标签（0%、20%、40%等）
        color: '#666',
        fontSize: 11,
        formatter: '{value}%',
        margin: 8
      }
    },
    series: [
      // 1. 视频风险曲线（参考1.0版本 - 更细更柔和）
      {
        name: '视频风险',
        type: 'line',
        data: videoData,
        smooth: 0.35,
        symbol: 'none',  // 移除密集圆点
        showSymbol: false,  // 不显示标记点
        lineStyle: {
          width: 2,
          color: '#ff7875',
          opacity: 0.8
        },
        itemStyle: {
          color: '#ff7875',
          borderColor: '#fff',
          borderWidth: 2
        },
        areaStyle: {
          color: {
            type: 'linear',
            x: 0, y: 0, x2: 0, y2: 1,
            colorStops: [
              { offset: 0, color: 'rgba(255, 120, 117, 0.12)' },
              { offset: 1, color: 'rgba(255, 120, 117, 0.02)' }
            ]
          }
        },
        emphasis: {
          lineStyle: { width: 2.5 },
          itemStyle: { borderWidth: 3 }
        }
      },
      
      // 2. 音频情绪曲线（参考1.0版本 - 更细更柔和）
      {
        name: '音频情绪',
        type: 'line',
        data: audioData,
        smooth: 0.35,
        symbol: 'none',  // 移除密集圆点
        showSymbol: false,  // 不显示标记点
        lineStyle: {
          width: 2,
          color: '#ffa940',
          opacity: 0.8
        },
        itemStyle: {
          color: '#ffa940',
          borderColor: '#fff',
          borderWidth: 2
        },
        areaStyle: {
          color: {
            type: 'linear',
            x: 0, y: 0, x2: 0, y2: 1,
            colorStops: [
              { offset: 0, color: 'rgba(255, 169, 64, 0.12)' },
              { offset: 1, color: 'rgba(255, 169, 64, 0.02)' }
            ]
          }
        },
        emphasis: {
          lineStyle: { width: 2.5 },
          itemStyle: { borderWidth: 3 }
        }
      },
      
      // 3. 文本风险曲线（参考1.0版本 - 更细更柔和）
      {
        name: '文本风险',
        type: 'line',
        data: textData,
        smooth: 0.35,
        symbol: 'none',  // 移除密集圆点
        symbolSize: 0,
        lineStyle: {
          width: 2,
          color: '#597ef7',
          opacity: 0.8
        },
        itemStyle: {
          color: '#597ef7',
          borderColor: '#fff',
          borderWidth: 2
        },
        areaStyle: {
          color: {
            type: 'linear',
            x: 0, y: 0, x2: 0, y2: 1,
            colorStops: [
              { offset: 0, color: 'rgba(89, 126, 247, 0.12)' },
              { offset: 1, color: 'rgba(89, 126, 247, 0.02)' }
            ]
          }
        },
        emphasis: {
          lineStyle: { width: 2.5 },
          itemStyle: { borderWidth: 3 }
        },
        markLine: {
          silent: true,
          symbol: 'none',
          animation: false,
          label: {
            show: true,
            position: 'insideEndTop',
            formatter: '{b}',
            fontSize: 10,
            fontWeight: 'normal',
            padding: [0, 5, 0, 0]
          },
          lineStyle: {
            type: 'dashed',
            width: 1,
            dashOffset: 0
          },
          data: [
            { 
              yAxis: 70, 
              name: '高风险线',
              lineStyle: { 
                color: 'rgba(255, 120, 117, 0.35)',
                type: 'dashed'
              },
              label: { 
                color: 'rgba(255, 120, 117, 0.65)',
                backgroundColor: 'transparent'
              }
            },
            { 
              yAxis: 40, 
              name: '中风险线',
              lineStyle: { 
                color: 'rgba(255, 169, 64, 0.35)',
                type: 'dashed'
              },
              label: { 
                color: 'rgba(255, 169, 64, 0.65)',
                backgroundColor: 'transparent'
              }
            }
          ]
        }
      },
      
      // 4. 综合风险曲线（加粗显示，突出重要性）
      {
        name: '综合风险',
        type: 'line',
        data: comprehensiveData,
        smooth: 0.35,
        symbol: 'none',
        showSymbol: false,
        lineStyle: {
          width: 3,  // 比其他曲线粗一点
          color: '#722ed1',  // 紫色
          opacity: 0.9
        },
        itemStyle: {
          color: '#722ed1',
          borderColor: '#fff',
          borderWidth: 2
        },
        areaStyle: {
          color: {
            type: 'linear',
            x: 0, y: 0, x2: 0, y2: 1,
            colorStops: [
              { offset: 0, color: 'rgba(114, 46, 209, 0.15)' },
              { offset: 1, color: 'rgba(114, 46, 209, 0.03)' }
            ]
          }
        },
        emphasis: {
          lineStyle: { width: 3.5 },
          itemStyle: { borderWidth: 3 }
        },
        zlevel: 1  // 显示在其他曲线上方
      }
    ]
  }
})

// 风险时间轴图表配置
const riskTimelineOption = computed(() => {
  const timelineData = getRiskTimelineData()
  if (!timelineData || !timelineData.timeSeriesData || timelineData.timeSeriesData.length === 0) {
    return {}
  }
  
  const times = timelineData.timeSeriesData.map((d: any) => d.time)
  const risks = timelineData.timeSeriesData.map((d: any) => d.risk * 100) // 转为百分比
  const riskPoints = timelineData.riskPoints || []
  
  // 构建风险点映射表（优化查找性能）
  const riskPointsMap = new Map()
  riskPoints.forEach((p: any) => {
    riskPointsMap.set(p.time, p)
  })
  
  return {
    tooltip: {
      trigger: 'axis',
      confine: true,  // 限制在图表区域内，防止被遮挡
      position: function (point: any, params: any, dom: any, rect: any, size: any) {
        // 智能定位：优先显示在右侧，空间不足时显示在左侧
        const x = point[0] < size.viewSize[0] / 2 ? point[0] + 20 : point[0] - size.contentSize[0] - 20
        return [x, point[1] - size.contentSize[1] / 2]
      },
      axisPointer: { 
        type: 'line',
        lineStyle: { color: '#4b70e2', width: 2, type: 'solid' }
      },
      formatter: (params: any) => {
        if (!params || !params[0]) return ''
        
        const dataIndex = params[0].dataIndex
        const timeValue = timelineData.timeSeriesData[dataIndex].time
        const riskValue = timelineData.timeSeriesData[dataIndex].risk * 100
        
        const m = Math.floor(timeValue / 60)
        const s = Math.floor(timeValue % 60)
        const timeStr = `${m}:${s.toString().padStart(2, '0')}`
        
        const color = riskValue > 70 ? '#f56c6c' : riskValue > 40 ? '#faad14' : '#52c41a'
        
        let html = `<div style="padding: 10px; min-width: 180px;">
          <div style="font-weight: 700; margin-bottom: 8px; font-size: 14px;">⏱️ 时间: ${timeStr}</div>
          <div style="color: ${color}; font-weight: 600; font-size: 15px;">
            📊 风险指数: ${riskValue.toFixed(1)}%
          </div>`
        
        // 查找最近的风险点
        const nearbyPoint = riskPoints.find((p: any) => Math.abs(p.time - timeValue) < 15)
        if (nearbyPoint) {
          html += `<div style="margin-top: 10px; padding-top: 8px; border-top: 1px solid #eee;">
            <div style="font-size: 12px; color: #f56c6c; font-weight: 600;">⚠️ 检测到风险</div>
            <div style="font-size: 11px; color: #666; margin-top: 4px;">${nearbyPoint.description}</div>
          </div>`
        } else {
          html += `<div style="margin-top: 10px; padding-top: 8px; border-top: 1px solid #eee;">
            <div style="font-size: 11px; color: #52c41a;">✅ 该时段无明显风险</div>
          </div>`
        }
        
        html += `<div style="margin-top: 10px; text-align: center;">
          <div style="font-size: 11px; color: #4b70e2; padding: 6px 12px; background: rgba(75,112,226,0.1); border-radius: 6px;">
            💡 点击图表跳转播放此时段
          </div>
        </div></div>`
        return html
      }
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '12%',
      top: '10%',
      containLabel: true
    },
    xAxis: {
      type: 'value',
      name: '时间（秒）',
      nameTextStyle: { color: neuColors.gray, fontSize: 11 },
      axisLine: { lineStyle: { color: neuColors.neu2 } },
      axisLabel: { 
        color: neuColors.gray, 
        fontSize: 11,
        formatter: (value: number) => formatTimestamp(value)
      },
      splitLine: { lineStyle: { color: '#e8edf3', type: 'dashed' } }
    },
    yAxis: {
      type: 'value',
      name: '风险指数',
      max: 100,
      nameTextStyle: { color: neuColors.gray, fontSize: 11 },
      axisLine: { show: false },
      splitLine: { lineStyle: { color: '#e8edf3' } },
      axisLabel: { 
        color: neuColors.gray, 
        fontSize: 11,
        formatter: '{value}%'
      }
    },
    series: [
      {
        name: '风险指数',
        type: 'line',
        smooth: true,
        data: times.map((time: number, index: number) => [time, risks[index]]),
        lineStyle: {
          width: 3,
          color: {
            type: 'linear',
            x: 0, y: 0, x2: 1, y2: 0,
            colorStops: [
              { offset: 0, color: '#52c41a' },
              { offset: 0.5, color: '#faad14' },
              { offset: 1, color: '#f56c6c' }
            ]
          }
        },
        areaStyle: {
          color: {
            type: 'linear',
            x: 0, y: 0, x2: 0, y2: 1,
            colorStops: [
              { offset: 0, color: 'rgba(75, 112, 226, 0.3)' },
              { offset: 1, color: 'rgba(75, 112, 226, 0.05)' }
            ]
          }
        },
        markPoint: {
          symbol: 'pin',
          symbolSize: 50,
          data: riskPoints.map((p: any) => ({
            coord: [p.time, p.riskScore * 100],
            value: '⚠',
            itemStyle: { color: p.level === 'high' ? '#f56c6c' : '#faad14' }
          }))
        },
        markLine: {
          silent: true,
          lineStyle: { type: 'dashed', color: '#faad14', width: 1 },
          data: [
            { yAxis: 40, label: { formatter: '中风险线', position: 'end' } },
            { yAxis: 70, label: { formatter: '高风险线', position: 'end' } }
          ]
        }
      }
    ]
  }
})

// 方法
const selectVideo = (video: VideoInfo) => {
  selectedVideoId.value = video.id
  showVideoDrawer.value = false
  // 更新 URL 参数，确保地址栏显示当前选中的视频ID
  router.replace({ query: { videoId: video.id } })
  loadAnalysisByVideo()
}

const loadAnalysisByVideo = async () => {
  if (!selectedVideoId.value) {
    analysisData.value = null
    emptyMessage.value = '请选择一个视频'
    return
  }
  
  loading.value = true
  
  try {
    // Mock模式：直接使用本地mock数据，不发起网络请求
    if (import.meta.env.VITE_MOCK_MODE === 'true') {
      // 模拟网络延迟，让加载动画更真实
      await new Promise(resolve => setTimeout(resolve, 300))
      
      // 直接使用mockAnalysisResult作为分析数据
      analysisData.value = mockAnalysisResult as any
      emptyMessage.value = ''
      loading.value = false
      return
    }
    
    // 正常模式：调用真实API
    const response = await getResultByVideoId(selectedVideoId.value)
    if (response.code === 200 && response.data) {
      analysisData.value = response.data
    } else {
      analysisData.value = null
      emptyMessage.value = '该视频尚未分析或分析未完成'
    }
  } catch (error: any) {
    // Mock模式下不显示错误（已经在上面处理）
    if (import.meta.env.VITE_MOCK_MODE !== 'true') {
      ElMessage.error(error?.message || '加载分析结果失败')
    }
    analysisData.value = null
    emptyMessage.value = '加载失败，请稍后重试'
  } finally {
    loading.value = false
  }
}

const loadAnalysisById = async (resultId: string) => {
  loading.value = true
  
  try {
    // Mock模式：直接使用本地mock数据
    if (import.meta.env.VITE_MOCK_MODE === 'true') {
      await new Promise(resolve => setTimeout(resolve, 300))
      analysisData.value = mockAnalysisResult as any
      selectedVideoId.value = mockAnalysisResult.videoInfo.videoId || ''
      loading.value = false
      return
    }
    
    // 正常模式：调用真实API
    const response = await getResultById(resultId)
    if (response.code === 200 && response.data) {
      analysisData.value = response.data
      selectedVideoId.value = response.data.videoId
    } else {
      analysisData.value = null
      emptyMessage.value = '分析结果不存在'
    }
  } catch (error: any) {
    if (import.meta.env.VITE_MOCK_MODE !== 'true') {
      ElMessage.error(error?.message || '加载分析结果失败')
    }
    analysisData.value = null
  } finally {
    loading.value = false
  }
}

const fetchVideos = async () => {
  try {
    const response = await getVideoList(1, 100)
    if (response.code === 200) {
      // 只显示已完成分析的视频
      videoList.value = response.data.records.filter(v => v.status === 'COMPLETED')
    }
  } catch {
    // 静默处理错误
  }
}

const playVideo = (startTime: number = 0) => {
  videoStartTime.value = startTime
  videoDialogVisible.value = true
}

// 视频对话框打开后，跳转到指定时间
const onVideoDialogOpened = () => {
  setTimeout(() => {
    const videoElement = videoPlayerRef.value || document.querySelector('.video-player') as HTMLVideoElement
    if (videoElement) {
      console.log('视频元素找到，准备跳转到:', videoStartTime.value, '秒')
      
      // 等待视频元数据加载完成
      const jumpToTime = () => {
        if (videoStartTime.value > 0) {
          videoElement.currentTime = videoStartTime.value
          console.log('✅ 视频已跳转到:', videoStartTime.value, '秒，当前时间:', videoElement.currentTime)
        }
        videoElement.play().catch(e => console.log('自动播放失败:', e))
      }
      
      if (videoElement.readyState >= 2) {
        // 视频已经加载了元数据，直接跳转
        jumpToTime()
      } else {
        // 等待元数据加载
        videoElement.addEventListener('loadedmetadata', jumpToTime, { once: true })
      }
    } else {
      console.error('未找到视频元素')
    }
  }, 300)
}

const formatScore = (score: number | null | undefined): string => {
  if (score === null || score === undefined) return '0%'
  return (score * 100).toFixed(1) + '%'
}

// 风险等级应该由Python后端直接返回，前端不再根据数值判断

const formatDate = (dateStr: string): string => {
  return new Date(dateStr).toLocaleString('zh-CN')
}

const formatDuration = (seconds: number): string => {
  const m = Math.floor(seconds / 60)
  const s = Math.floor(seconds % 60)
  return `${m}分${s}秒`
}

const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i]
}

// 判断逻辑已移到Python后端，通过isUniversityRelated字段控制

const getStatusText = (status: string): string => {
  const texts: Record<string, string> = {
    'UPLOADED': '待分析',
    'ANALYZING': '分析中',
    'COMPLETED': '已完成',
    'FAILED': '失败'
  }
  return texts[status] || status
}

const getStatusClass = (status: string): string => {
  const classes: Record<string, string> = {
    'UPLOADED': 'pending',
    'ANALYZING': 'processing',
    'COMPLETED': 'completed',
    'FAILED': 'failed'
  }
  return classes[status] || 'pending'
}

const getRiskClass = (level: RiskLevel): string => {
  const classes: Record<RiskLevel, string> = {
    'LOW': 'risk-low',
    'MEDIUM': 'risk-medium',
    'HIGH': 'risk-high'
  }
  return classes[level] || 'risk-medium'
}

const getRiskLevelText = (level: RiskLevel): string => {
  const texts: Record<RiskLevel, string> = {
    'LOW': '低风险',
    'MEDIUM': '中风险',
    'HIGH': '高风险'
  }
  return texts[level] || '未知'
}

const getSentimentClass = (label: SentimentLabel): string => {
  const classes: Record<SentimentLabel, string> = {
    'POSITIVE': 'success',
    'NEUTRAL': 'primary',
    'NEGATIVE': 'danger'
  }
  return classes[label] || 'primary'
}

const getSentimentText = (label: SentimentLabel): string => {
  const texts: Record<SentimentLabel, string> = {
    'POSITIVE': '积极',
    'NEUTRAL': '中性',
    'NEGATIVE': '消极'
  }
  return texts[label] || '未知'
}

// 语音情感英文转中文映射
const getEmotionText = (emotion: string | null | undefined): string => {
  if (!emotion) return '未知'
  const emotionMap: Record<string, string> = {
    'energetic': '充满活力',
    'calm': '平静',
    'happy': '开心',
    'sad': '悲伤',
    'angry': '愤怒',
    'fear': '恐惧',
    'surprise': '惊讶',
    'disgust': '厌恶',
    'neutral': '中性',
    'excited': '兴奋',
    'relaxed': '放松',
    'tense': '紧张',
    'bored': '无聊',
    'confident': '自信',
    'nervous': '紧张不安',
    'passionate': '热情',
    'melancholic': '忧郁',
    'cheerful': '欢快',
    'serious': '严肃',
    'humorous': '幽默'
  }
  return emotionMap[emotion.toLowerCase()] || emotion
}

// 所有业务逻辑判断已移到Python后端

// 情感风险样式
const getSentimentRiskClass = (label: SentimentLabel): string => {
  const classes: Record<SentimentLabel, string> = {
    'POSITIVE': 'text-success',
    'NEUTRAL': 'text-muted',
    'NEGATIVE': 'text-danger'
  }
  return classes[label] || 'text-muted'
}

// 词云样式（根据权重和索引）
const getWordStyle = (value: number, index: number) => {
  const maxSize = 32
  const minSize = 12
  const size = minSize + (maxSize - minSize) * (value / 1000)
  
  const colors = [
    '#4b70e2', '#7c9df7', '#a3bef9', '#6b8be8', 
    '#8ba3e8', '#5a7fd6', '#91a9f5', '#7589d8'
  ]
  const color = colors[index % colors.length]
  
  return {
    fontSize: `${size}px`,
    color: color,
    opacity: 0.7 + (value / 2000),
    margin: '8px',
    fontWeight: index < 5 ? '700' : '500'
  }
}

// 格式化时间戳
const formatTimestamp = (seconds: number): string => {
  const m = Math.floor(seconds / 60)
  const s = Math.floor(seconds % 60)
  return `${m}:${s.toString().padStart(2, '0')}`
}

// 获取词云数据（处理JSON字符串）
const getWordCloudData = (): Array<{name: string, value: number}> => {
  if (!analysisData.value) return []
  
  try {
    // textFeatures可能是JSON字符串，需要解析
    const textFeatures = analysisData.value.textFeatures
    if (typeof textFeatures === 'string') {
      const parsed = JSON.parse(textFeatures)
      return parsed.wordCloud || []
    } else if (textFeatures && typeof textFeatures === 'object') {
      return (textFeatures as any).wordCloud || []
    }
    return []
  } catch {
    return []
  }
}

// 获取敏感词列表（处理JSON字符串）
const getSensitiveWords = (): Array<{word: string, category: string}> => {
  if (!analysisData.value) return []
  
  try {
    const textFeatures = analysisData.value.textFeatures
    if (typeof textFeatures === 'string') {
      const parsed = JSON.parse(textFeatures)
      return parsed.sensitiveWords || []
    } else if (textFeatures && typeof textFeatures === 'object') {
      return (textFeatures as any).sensitiveWords || []
    }
    return []
  } catch {
    return []
  }
}

// 获取风险时间轴数据（处理JSON字符串）
const getRiskTimelineData = (): any => {
  if (!analysisData.value) return null
  
  try {
    const videoFeatures = analysisData.value.videoFeatures
    
    console.log('videoFeatures类型:', typeof videoFeatures)
    console.log('videoFeatures数据:', videoFeatures)
    
    let riskTimeline = null
    
    if (typeof videoFeatures === 'string') {
      const parsed = JSON.parse(videoFeatures)
      console.log('解析后的videoFeatures:', parsed)
      riskTimeline = parsed.riskTimeline
    } else if (videoFeatures && typeof videoFeatures === 'object') {
      riskTimeline = (videoFeatures as any).riskTimeline
    }
    
    console.log('riskTimeline数据:', riskTimeline)
    
    // 如果没有数据，生成示例数据用于测试
    if (!riskTimeline || !riskTimeline.timeSeriesData || riskTimeline.timeSeriesData.length === 0) {
      console.warn('风险时间轴数据为空，生成示例数据')
      const duration = mockAnalysisResult.videoInfo.duration
      return generateMockRiskTimeline(duration)
    }
    
    return riskTimeline
  } catch (e) {
    console.error('解析风险时间轴数据失败:', e)
    return null
  }
}

// 生成模拟风险时间轴（临时测试用）
const generateMockRiskTimeline = (duration: number) => {
  const timeSeriesData = []
  const riskPoints = []
  
  for (let t = 0; t <= duration; t += 30) {
    const risk = 0.15 + Math.random() * 0.25
    timeSeriesData.push({ time: t, risk: risk })
    
    if (Math.random() > 0.7 && risk > 0.3) {
      riskPoints.push({
        time: t,
        type: "内容特征",
        level: "medium",
        description: "检测到内容特征波动",
        riskScore: risk
      })
    }
  }
  
  return { timeSeriesData, riskPoints, duration }
}

// 时间轴点击事件 - 跳转播放
// 图表容器点击处理（支持点击任意位置跳转）
const onChartContainerClick = (event: MouseEvent) => {
  if (viewMode.value !== 'interactive') return
  
  const target = event.currentTarget as HTMLElement
  if (!target) return
  
  // 计算点击位置相对于容器的百分比
  const rect = target.getBoundingClientRect()
  const clickX = event.clientX - rect.left
  const containerWidth = rect.width
  const percentage = clickX / containerWidth
  
  // 转换为视频时间（考虑grid的left/right padding）
  const gridLeft = 21 // 对应grid.left配置
  const gridRight = 22 // 对应grid.right配置
  const effectiveWidth = containerWidth - gridLeft - gridRight
  const effectiveClickX = clickX - gridLeft
  const actualPercentage = Math.max(0, Math.min(1, effectiveClickX / effectiveWidth))
  
  const clickedTime = actualPercentage * videoDuration.value
  
  // 跳转视频到点击的时间
  if (mainVideoPlayerRef.value && clickedTime >= 0 && clickedTime <= videoDuration.value) {
    mainVideoPlayerRef.value.currentTime = clickedTime
    mainVideoPlayerRef.value.play().catch(e => console.log('播放失败:', e))
    
    // 找到最接近的证据并更新选中状态
    if (mockRiskEvidence.length > 0) {
      let nearestEvidence = mockRiskEvidence[0]
      let minDiff = Math.abs(mockRiskEvidence[0].timeSeconds - clickedTime)
      
      mockRiskEvidence.forEach(evidence => {
        const diff = Math.abs(evidence.timeSeconds - clickedTime)
        if (diff < minDiff) {
          minDiff = diff
          nearestEvidence = evidence
        }
      })
      
      if (nearestEvidence) {
        selectedEvidenceId.value = nearestEvidence.id
      }
    }
    // 跳转已完成，无需提示消息
  }
}

const onTimelineClick = (params: any) => {
  if (!params || !params.data) return
  
  // 交互视图：V1.5 切换到最近的证据并跳转视频
  if (viewMode.value === 'interactive') {
    const clickedTime = params.data[0] || params.value?.[0]
    if (clickedTime !== undefined) {
      // 直接跳转视频到点击的时间
      if (mainVideoPlayerRef.value) {
        mainVideoPlayerRef.value.currentTime = clickedTime
        mainVideoPlayerRef.value.play().catch(e => console.log('播放失败:', e))
      }
      
      // 找到最接近点击时间的证据，更新选中状态
      let nearestEvidence = mockRiskEvidence[0]
      let minDiff = Math.abs(mockRiskEvidence[0].timeSeconds - clickedTime)
      
      mockRiskEvidence.forEach(evidence => {
        const diff = Math.abs(evidence.timeSeconds - clickedTime)
        if (diff < minDiff) {
          minDiff = diff
          nearestEvidence = evidence
        }
      })
      
      // 更新选中的证据ID（不触发selectEvidence，避免重复跳转）
      if (nearestEvidence) {
        selectedEvidenceId.value = nearestEvidence.id
      }
      
      // 跳转已完成，无需提示消息
    }
    return
  }
  
  // 报告视图：原有逻辑
  const timelineData = getRiskTimelineData()
  if (!timelineData || !timelineData.timeSeriesData) return
  
  const clickedTime = params.data[0]
  playVideo(clickedTime)
  // 报告视图跳转，无需提示消息
}

// 视频时间更新事件
const onVideoTimeUpdate = () => {
  if (!mainVideoPlayerRef.value) return
  
  const newTime = mainVideoPlayerRef.value.currentTime
  currentPlayTime.value = newTime
  
  // 更新进度线（不影响tooltip）
  updateProgressLine(newTime)
  
  const currentTime = newTime
  const currentEvidenceByTime = mockRiskEvidence.find(
    e => currentTime >= e.timeSeconds && currentTime < (e.timeEndSeconds || e.timeSeconds + 10)
  )
  
  if (currentEvidenceByTime && currentEvidenceByTime.id !== selectedEvidenceId.value) {
    selectedEvidenceId.value = currentEvidenceByTime.id
  }
  
  const index = mockTranscriptSegments.value.findIndex(
    seg => currentTime >= seg.start && currentTime < seg.end
  )
  currentSegmentIndex.value = index
  
  const detection = mockVideoRisks.value.find(
    risk => Math.abs(currentTime - risk.time) < 3
  )
  currentDetection.value = detection || null
}

// 独立更新进度线（使用setOption局部更新，避免tooltip闪烁）
let progressLineUpdatePending = false
const updateProgressLine = (time: number) => {
  if (!timelineChartRef.value || progressLineUpdatePending || time <= 0) return
  
  progressLineUpdatePending = true
  
  requestAnimationFrame(() => {
    if (!timelineChartRef.value) {
      progressLineUpdatePending = false
      return
    }
    
    const m = Math.floor(time / 60)
    const s = Math.floor(time % 60)
    const timeLabel = `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
    
    // 使用notMerge: false 保持其他配置，只更新markLine
    timelineChartRef.value.setOption({
      series: [
        { seriesIndex: 0 },
        { seriesIndex: 1 },
        { seriesIndex: 2 },
        {
          seriesIndex: 3,
          markLine: {
            symbol: 'none',
            animation: false,
            silent: true,  // 关键：不触发事件
            data: [
              [
                { coord: [time, 0], symbol: 'none' },
                {
                  coord: [time, 100],
                  symbol: 'none',
                  lineStyle: {
                    color: '#ff4d4f',
                    width: 3,
                    type: 'solid',
                    opacity: 0.9,
                    shadowBlur: 6,
                    shadowColor: 'rgba(255, 77, 79, 0.3)'
                  },
                  label: {
                    show: true,
                    position: 'insideStartTop',
                    formatter: timeLabel,
                    color: '#fff',
                    fontSize: 11,
                    fontWeight: 'bold',
                    backgroundColor: '#ff4d4f',
                    padding: [4, 8],
                    borderRadius: 4
                  }
                }
              ]
            ]
          }
        }
      ]
    }, { notMerge: false, lazyUpdate: false, silent: true })
    
    progressLineUpdatePending = false
  })
}

// ==================== CV视觉模态：精确计算视频显示区域（object-fit: contain） ====================
/**
 * 计算视频在 object-fit: contain 模式下的实际显示区域
 * 用于精确定位检测框，避免容器尺寸变化时检测框错位
 */
const calculateVideoDisplayArea = () => {
  const videoElement = mainVideoPlayerRef.value
  if (!videoElement) {
    console.warn('[检测框定位] 视频元素不存在')
    return
  }
  
  // 获取容器元素（video的父元素）
  const container = videoElement.parentElement
  if (!container) {
    console.warn('[检测框定位] 容器元素不存在')
    return
  }
  
  // 获取视频原始尺寸
  const videoWidth = videoElement.videoWidth
  const videoHeight = videoElement.videoHeight
  
  // 视频元数据未加载完成
  if (!videoWidth || !videoHeight) {
    console.warn('[检测框定位] 视频元数据未加载，videoWidth:', videoWidth, 'videoHeight:', videoHeight)
    return
  }
  
  // 获取容器实际尺寸
  const containerWidth = container.clientWidth
  const containerHeight = container.clientHeight
  
  // 容器尺寸异常
  if (!containerWidth || !containerHeight) {
    console.warn('[检测框定位] 容器尺寸异常，containerWidth:', containerWidth, 'containerHeight:', containerHeight)
    return
  }
  
  // 计算宽高比
  const videoRatio = videoWidth / videoHeight
  const containerRatio = containerWidth / containerHeight
  
  let displayWidth: number
  let displayHeight: number
  let offsetX: number
  let offsetY: number
  
  // 根据 object-fit: contain 规则计算实际显示区域
  if (videoRatio > containerRatio) {
    // 视频更宽 → 视频宽度填满容器，高度按比例缩放，上下有黑边
    displayWidth = containerWidth
    displayHeight = containerWidth / videoRatio
    offsetX = 0
    offsetY = (containerHeight - displayHeight) / 2
  } else {
    // 视频更高（或相等）→ 视频高度填满容器，宽度按比例缩放，左右有黑边（或无黑边）
    displayWidth = containerHeight * videoRatio
    displayHeight = containerHeight
    offsetX = (containerWidth - displayWidth) / 2
    offsetY = 0
  }
  
  // 更新响应式数据
  videoDisplayArea.value = {
    offsetX,
    offsetY,
    displayWidth,
    displayHeight,
    containerWidth,
    containerHeight
  }
  
  console.log('[检测框定位] 计算完成:', {
    视频原始尺寸: `${videoWidth}x${videoHeight}`,
    容器尺寸: `${containerWidth}x${containerHeight}`,
    视频宽高比: videoRatio.toFixed(3),
    容器宽高比: containerRatio.toFixed(3),
    显示区域: `${displayWidth.toFixed(1)}x${displayHeight.toFixed(1)}`,
    偏移量: `(${offsetX.toFixed(1)}, ${offsetY.toFixed(1)})`
  })
}

// 视频加载完成
const onVideoLoaded = () => {
  // 更新视频真实时长，确保图表时间轴与视频进度精确对齐
  if (mainVideoPlayerRef.value && mainVideoPlayerRef.value.duration) {
    videoDuration.value = mainVideoPlayerRef.value.duration
  }
  
  // 计算视频显示区域（用于精确定位检测框）
  calculateVideoDisplayArea()
  
  // 自动跳转到第一个高风险证据
  if (selectedEvidenceId.value) {
    const evidence = mockRiskEvidence.find(e => e.id === selectedEvidenceId.value)
    if (evidence && mainVideoPlayerRef.value) {
      mainVideoPlayerRef.value.currentTime = evidence.timeSeconds
    }
  }
}

// 跳转到指定时间（不显示提示消息，避免刷屏）
const jumpToTime = (time: number) => {
  if (mainVideoPlayerRef.value) {
    mainVideoPlayerRef.value.currentTime = time
    mainVideoPlayerRef.value.play().catch(e => console.log('播放失败:', e))
    // 视频已跳转，用户能看到，无需提示消息
  }
}

// 获取检测框样式（业界标准：支持分类颜色 + 精确定位）
const getDetectionBoxStyle = (detection: Detection) => {
  const box = detection.boundingBox
  const color = DETECTION_COLORS[detection.type] || '#fff'
  const area = videoDisplayArea.value
  
  // 如果视频显示区域尚未计算，返回默认样式（避免闪烁）
  if (!area.displayWidth || !area.displayHeight || !area.containerWidth || !area.containerHeight) {
    return {
      left: '0%',
      top: '0%',
      width: '0%',
      height: '0%',
      borderColor: color,
      '--detection-color': color,
      opacity: '0' // 隐藏未定位的检测框
    }
  }
  
  // ==================== 精确坐标转换 ====================
  // 步骤1：将检测框的百分比坐标转换为相对于视频内容的像素坐标
  const boxLeftInVideo = (box.x / 100) * area.displayWidth
  const boxTopInVideo = (box.y / 100) * area.displayHeight
  const boxWidthInVideo = (box.width / 100) * area.displayWidth
  const boxHeightInVideo = (box.height / 100) * area.displayHeight
  
  // 步骤2：加上视频在容器中的偏移量，得到相对于容器的像素坐标
  const boxLeftInContainer = area.offsetX + boxLeftInVideo
  const boxTopInContainer = area.offsetY + boxTopInVideo
  
  // 步骤3：转换为相对于容器的百分比坐标
  const leftPercent = (boxLeftInContainer / area.containerWidth) * 100
  const topPercent = (boxTopInContainer / area.containerHeight) * 100
  const widthPercent = (boxWidthInVideo / area.containerWidth) * 100
  const heightPercent = (boxHeightInVideo / area.containerHeight) * 100
  
  return {
    left: `${leftPercent}%`,
    top: `${topPercent}%`,
    width: `${widthPercent}%`,
    height: `${heightPercent}%`,
    borderColor: color,
    '--detection-color': color,
    opacity: '1'
  }
}

// 高亮关键词
const highlightKeywords = (text: string, keywords: string[]) => {
  if (!keywords || keywords.length === 0) return text
  
  let result = text
  keywords.forEach(keyword => {
    const regex = new RegExp(keyword, 'g')
    result = result.replace(regex, `<span class="risk-keyword">${keyword}</span>`)
  })
  return result
}

// 获取情绪类别样式
const getEmotionClass = (emotion: string) => {
  const classMap: Record<string, string> = {
    'angry': 'emotion-angry',
    'calm': 'emotion-calm',
    'tense': 'emotion-tense',
    'serious': 'emotion-serious'
  }
  return classMap[emotion] || 'emotion-neutral'
}

// ==================== V1.5 新增：证据选择逻辑 ====================
/**
 * 选择证据，切换左侧截图和高亮对应台词
 */
const selectEvidence = (evidenceId: string) => {
  selectedEvidenceId.value = evidenceId
  
  // 跳转视频到对应时间
  const evidence = mockRiskEvidence.find(e => e.id === evidenceId)
  if (evidence && mainVideoPlayerRef.value) {
    mainVideoPlayerRef.value.currentTime = evidence.timeSeconds
    mainVideoPlayerRef.value.play().catch(e => console.log('自动播放失败:', e))
  }
  // 已定位，无需提示消息
}

/**
 * 计算进度条宽度（基于真实视频播放进度）
 */
const getProgressWidth = (): string => {
  if (!mainVideoPlayerRef.value) return '0%'
  const duration = mainVideoPlayerRef.value.duration || 195
  const current = mainVideoPlayerRef.value.currentTime || 0
  const percentage = (current / duration) * 100
  return `${Math.min(percentage, 100)}%`
}

/**
 * 格式化当前播放时间
 */
const formatCurrentTime = (): string => {
  if (!mainVideoPlayerRef.value) return '00:00'
  const current = mainVideoPlayerRef.value.currentTime || 0
  const m = Math.floor(current / 60)
  const s = Math.floor(current % 60)
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
}

/**
 * 格式化视频总时长
 */
const formatTotalDuration = (): string => {
  if (!mainVideoPlayerRef.value || !mainVideoPlayerRef.value.duration) return '03:15'
  const duration = mainVideoPlayerRef.value.duration
  const m = Math.floor(duration / 60)
  const s = Math.floor(duration % 60)
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
}

// ==================== 绿圈实时分析栏：获取当前风险分 ====================
/**
 * 获取当前帧的综合风险分数（直接引用 comprehensiveRisks）
 */
const getCurrentRiskScore = (): number => {
  const currentTime = currentPlayTime.value
  const index = Math.min(Math.floor(currentTime / timeGranularity), mockComprehensiveRisksData.length - 1)
  const riskPoint = mockComprehensiveRisksData[index]
  return Math.round(riskPoint.intensity * 100) // 转为百分比
}

/**
 * 获取当前风险等级类名
 */
const getCurrentRiskClass = (): string => {
  const score = getCurrentRiskScore()
  if (score > 66.7) return 'high'
  if (score >= 33.3) return 'medium'
  return 'low'
}

/**
 * 获取当前风险等级文字
 */
const getCurrentRiskLabel = (): string => {
  const score = getCurrentRiskScore()
  if (score >= 70) return '高风险'
  if (score >= 40) return '中风险'
  return '低风险'
}

// PDF导出状态
const exportingPdf = ref(false)

// 报告视图组件引用
const reportViewRef = ref<InstanceType<typeof ReportView> | null>(null)
// 播放视频按钮引用（导出时需要隐藏）
const playVideoBtnRef = ref<HTMLElement | null>(null)
// 视频播放器引用
const videoPlayerRef = ref<HTMLVideoElement | null>(null)

/**
 * 导出PDF报告
 * 使用 html2canvas 将页面内容转换为图片，然后使用 jsPDF 生成PDF
 * 支持多页PDF和中文显示
 */
const exportReport = async () => {
  // 数据验证
  if (!analysisData.value) {
    ElMessage.warning('没有可导出的分析数据')
    return
  }
  
  // 获取报告视图组件的refs
  const reportContent = reportViewRef.value?.reportContentRef
  const actionButtons = reportViewRef.value?.actionButtonsRef
  
  if (!reportContent) {
    ElMessage.error('无法获取报告内容')
    return
  }
  
  // 防止重复导出
  if (exportingPdf.value) {
    return
  }
  
  exportingPdf.value = true
  ElMessage.info('正在生成PDF报告，请稍候...')
  const playVideoBtn = playVideoBtnRef.value
  const originalActionDisplay = actionButtons?.style.display
  const originalPlayBtnDisplay = playVideoBtn?.style.display
  
  if (actionButtons) {
    actionButtons.style.display = 'none'
  }
  if (playVideoBtn) {
    playVideoBtn.style.display = 'none'
  }
  
  try {
    // 动态导入依赖，减少初始包大小
    const html2canvasModule = await import('html2canvas')
    const html2canvas = html2canvasModule.default
    const jsPDFModule = await import('jspdf')
    const jsPDF = jsPDFModule.default || jsPDFModule.jsPDF
    
    if (!html2canvas || !jsPDF) {
      throw new Error('PDF导出依赖加载失败')
    }
    
    const element = reportContent
    
    // 使用 html2canvas 将内容渲染为图片
    // scale: 2 提高清晰度，适合打印
    const canvas = await html2canvas(element, {
      scale: 2, // 提高清晰度
      useCORS: true, // 允许跨域图片
      allowTaint: true, // 允许跨域图片污染画布
      backgroundColor: '#ecf0f3', // 背景色与新拟态风格一致
      logging: false, // 关闭调试日志
      width: element.scrollWidth,
      height: element.scrollHeight
    })
    
    // 验证canvas生成成功
    if (!canvas || canvas.width === 0 || canvas.height === 0) {
      throw new Error('无法生成报告图片')
    }
    
    const imgWidth = canvas.width
    const imgHeight = canvas.height
    
    // 创建 PDF (纵向, 毫米单位, A4纸张)
    const pdf = new jsPDF('p', 'mm', 'a4')
    const pageWidth = pdf.internal.pageSize.getWidth()
    const pageHeight = pdf.internal.pageSize.getHeight()
    const margin = 10 // 页边距 10mm
    const contentWidth = pageWidth - margin * 2
    const availableHeight = pageHeight - margin * 2
    
    // 计算图片在PDF中的缩放比例和尺寸
    const ratio = contentWidth / imgWidth
    const scaledHeight = imgHeight * ratio
    
    // 如果内容超过一页，需要分页处理
    let yPos = margin
    let remainingHeight = scaledHeight
    let sourceY = 0
    
    while (remainingHeight > 0) {
      const heightToDraw = Math.min(remainingHeight, availableHeight)
      
      // 计算源图片中对应的区域高度
      const sourceHeight = heightToDraw / ratio
      
      // 创建临时画布来裁剪当前页的内容
      const tempCanvas = document.createElement('canvas')
      tempCanvas.width = imgWidth
      tempCanvas.height = sourceHeight
      const ctx = tempCanvas.getContext('2d')
      
      if (!ctx) {
        throw new Error('无法创建画布上下文')
      }
      
      // 从原canvas中裁剪当前页的内容
      ctx.drawImage(
        canvas,
        0, sourceY, imgWidth, sourceHeight, // 源区域
        0, 0, imgWidth, sourceHeight // 目标区域
      )
      
      // 将裁剪后的内容添加到PDF
      const tempImgData = tempCanvas.toDataURL('image/png', 0.95)
      pdf.addImage(tempImgData, 'PNG', margin, yPos, contentWidth, heightToDraw)
      
      // 更新剩余高度和源图片位置
      remainingHeight -= heightToDraw
      sourceY += sourceHeight
      
      // 如果还有剩余内容，添加新页
      if (remainingHeight > 0) {
        pdf.addPage()
        yPos = margin
      }
    }
    
    // 生成文件名：分析报告_视频标题_日期.pdf
    const data = analysisData.value
    const dateStr = new Date().toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    }).replace(/\//g, '-')
    
    // 清理文件名中的非法字符
    const safeTitle = (data.videoTitle || '视频')
      .replace(/[<>:"/\\|?*]/g, '_')
      .substring(0, 50) // 限制长度
    
    const fileName = `分析报告_${safeTitle}_${dateStr}.pdf`
    
    // 保存PDF文件
    pdf.save(fileName)
    
    ElMessage.success('PDF报告导出成功！')
  } catch (error: any) {
    console.error('PDF导出失败:', error)
    const errorMessage = error?.message || 'PDF导出失败，请稍后重试'
    ElMessage.error(errorMessage)
  } finally {
    // 恢复按钮显示
    if (actionButtons) {
      actionButtons.style.display = originalActionDisplay || ''
    }
    if (playVideoBtn) {
      playVideoBtn.style.display = originalPlayBtnDisplay || ''
    }
    exportingPdf.value = false
  }
}

// 监听路由参数变化
watch(() => route.query, (query) => {
  if (query.videoId) {
    selectedVideoId.value = query.videoId as string
    loadAnalysisByVideo()
  } else if (query.resultId) {
    loadAnalysisById(query.resultId as string)
  }
}, { immediate: true })

// 监听 viewMode 变化，控制父容器的 padding-bottom
const updateContainerPadding = () => {
  const mainContent = document.querySelector('.main-content')
  if (mainContent) {
    if (viewMode.value === 'interactive') {
      mainContent.classList.add('interactive-mode-no-padding')
    } else {
      mainContent.classList.remove('interactive-mode-no-padding')
    }
  }
}

watch(viewMode, () => {
  updateContainerPadding()
})

// 字幕自动滚动函数（提取为独立函数，多处复用）
const scrollToActiveSubtitle = () => {
  if (!selectedEvidenceId.value) return
  
  nextTick(() => {
    // 找到字幕容器和当前高亮的字幕元素
    const transcriptContainer = document.querySelector('.transcript-list')
    const activeSegment = document.querySelector('.transcript-segment.active')
    
    if (transcriptContainer && activeSegment) {
      // 计算滚动位置，使当前字幕居中
      const containerRect = transcriptContainer.getBoundingClientRect()
      const segmentRect = activeSegment.getBoundingClientRect()
      
      // 计算目标 scrollTop：将字幕滚动到容器中央
      const containerScrollTop = transcriptContainer.scrollTop
      const segmentOffsetTop = segmentRect.top - containerRect.top
      const targetScrollTop = containerScrollTop + segmentOffsetTop - (containerRect.height / 2) + (segmentRect.height / 2)
      
      // 平滑滚动到目标位置
      transcriptContainer.scrollTo({
        top: targetScrollTop,
        behavior: 'smooth'
      })
    }
  })
}

// 监听字幕切换，自动滚动到当前字幕（歌词滚动效果）
watch(selectedEvidenceId, () => {
  scrollToActiveSubtitle()
})

// 监听字幕活跃状态变化，从停顿恢复到播放时也要滚动
watch(isCurrentEvidenceActive, (newActive, oldActive) => {
  // 从非活跃变为活跃时，触发滚动（处理第一条字幕的边界情况）
  if (newActive && !oldActive) {
    scrollToActiveSubtitle()
  }
})

// 订阅任务完成事件，自动刷新视频列表
subscribeCompleted((data) => {
  fetchVideos()
  
  // 如果当前选中的视频刚完成分析，自动加载结果
  if (selectedVideoId.value === data.videoId) {
    loadAnalysisByVideo()
  }
})

// 雷达图渲染完成事件处理
const onRadarChartFinished = () => {
  // 如果鼠标在雷达图上，在渲染完成后立即触发 tooltip
  if (isMouseOnRadar.value && radarChartRef.value) {
    // 使用 setTimeout 确保在下一个事件循环中执行
    setTimeout(() => {
      try {
        // 获取 ECharts 实例
        const chartInstance = (radarChartRef.value as any)?.$refs?.chart || 
                             (radarChartRef.value as any)?.chart ||
                             (radarChartRef.value as any)
        
        if (chartInstance && typeof chartInstance.dispatchAction === 'function') {
          chartInstance.dispatchAction({
            type: 'showTip',
            seriesIndex: 0,
            dataIndex: 0
          })
        }
      } catch (e) {
        console.warn('触发tooltip失败:', e)
      }
    }, 10)
  }
}

// 图表resize处理函数
const handleChartResize = () => {
  // 调用ECharts实例的resize方法，让图表响应尺寸变化
  if (timelineChartRef.value && typeof timelineChartRef.value.resize === 'function') {
    timelineChartRef.value.resize()
  }
  
  // 同时重新计算视频显示区域，确保检测框位置正确
  calculateVideoDisplayArea()
}

onMounted(() => {
  fetchVideos()
  
  // 如果有路由参数，加载对应数据
  if (route.query.videoId) {
    selectedVideoId.value = route.query.videoId as string
    loadAnalysisByVideo()
  } else if (route.query.resultId) {
    loadAnalysisById(route.query.resultId as string)
  }
  
  // V1.5: 初始化默认选中第一个高风险证据
  const firstHighRisk = mockRiskEvidence.find(e => e.riskLevel === 'high')
  if (firstHighRisk) {
    selectedEvidenceId.value = firstHighRisk.id
  } else if (mockRiskEvidence.length > 0) {
    selectedEvidenceId.value = mockRiskEvidence[0].id
  }
  
  // 添加窗口resize监听（浏览器窗口大小变化）
  window.addEventListener('resize', handleChartResize)
  
  // 监听整个页面容器的宽度变化（捕获侧边栏收起/展开）
  if (analysisPageRef.value) {
    pageResizeObserver = new ResizeObserver(() => {
      // 页面宽度变化时，延迟调用图表resize，等待CSS过渡动画完成
      setTimeout(() => {
        handleChartResize()
      }, 350)
    })
    
    pageResizeObserver.observe(analysisPageRef.value)
  }
  
  // ==================== CV视觉模态：监听视频播放器容器尺寸变化 ====================
  // 当容器尺寸变化时（浏览器缩放、侧边栏收缩等），重新计算检测框位置
  if (mainVideoPlayerRef.value && mainVideoPlayerRef.value.parentElement) {
    videoResizeObserver = new ResizeObserver(() => {
      // 使用防抖，避免频繁计算
      setTimeout(() => {
        calculateVideoDisplayArea()
      }, 100)
    })
    
    videoResizeObserver.observe(mainVideoPlayerRef.value.parentElement)
  }
  
  // 初始化容器 padding 控制
  updateContainerPadding()
})

// 组件卸载时清理监听器
onUnmounted(() => {
  window.removeEventListener('resize', handleChartResize)
  
  if (pageResizeObserver) {
    pageResizeObserver.disconnect()
    pageResizeObserver = null
  }
  
  // 清理视频播放器 ResizeObserver
  if (videoResizeObserver) {
    videoResizeObserver.disconnect()
    videoResizeObserver = null
  }
  
  // 清理容器 padding 控制
  const mainContent = document.querySelector('.main-content')
  if (mainContent) {
    mainContent.classList.remove('interactive-mode-no-padding')
  }
})
</script>

<style scoped lang="scss">
// 新拟态配色变量
$bg: #edf2f0;
$neu-1: #ecf0f3;
$neu-2: #d1d9e6;
$white: #f9f9f9;
$gray: #a0a5a8;
$black: #181818;
$purple: #4b70e2;

// 全局图标向下微调0.5px，改善视觉对齐
.el-icon {
  position: relative;
  top: 0.5px;
}

.analysis-page {
  .header-actions {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 24px;
    
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
      box-shadow: 2px 2px 6px $neu-2, -2px -2px 6px $white;
      
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
      box-shadow: inset 2px 2px 4px $neu-2, inset -2px -2px 4px $white;
      
      .neu-btn {
        padding: 8px 16px;
        box-shadow: none;
        transition: all 0.3s;
        
        &:hover {
          color: $purple;
        }
        
        &.active {
          background: linear-gradient(135deg, $purple 0%, #7c9df7 100%);
          color: white;
          box-shadow: 2px 2px 6px $neu-2;
        }
      }
    }
    
    .video-selector-btn {
      display: flex;
      align-items: center;
      gap: 8px;
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
            color: #909399;
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
        background: linear-gradient(135deg, rgba($purple, 0.1), rgba(107, 139, 232, 0.05));
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
  box-shadow: 6px 6px 12px $neu-2, -6px -6px 12px $white;
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
  box-shadow: 8px 8px 16px $neu-2, -8px -8px 16px $white;
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
      color: #909399;
      background: rgba(0, 0, 0, 0.04);
      border-radius: 4px;
      border: 1px solid rgba(0, 0, 0, 0.06);
    }
  }
  
  .chart {
    height: 280px;
    width: 100%;
    padding: 16px;
  }
}

// 新拟态按钮
.neu-btn {
  background: $neu-1;
  border: none;
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.25s;
  box-shadow: 4px 4px 8px $neu-2, -4px -4px 8px $white;
  color: $gray;
  font-family: 'Montserrat', sans-serif;
  padding: 12px 24px;
  font-size: 14px;
  display: flex;
  align-items: center;
  gap: 8px;
  
  &:hover {
    box-shadow: 2px 2px 4px $neu-2, -2px -2px 4px $white;
    color: $purple;
  }
  
  &:active {
    box-shadow: inset 2px 2px 4px $neu-2, inset -2px -2px 4px $white;
  }
  
  &.primary-btn {
    background: linear-gradient(135deg, $purple 0%, #7c9df7 100%);
    color: #fff;
    
    &:hover {
      box-shadow: 4px 4px 8px $neu-2, -2px -2px 6px $white;
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
      box-shadow: 8px 8px 16px $neu-2, -8px -8px 16px $white;
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
      .risk-icon { background: rgba(82, 196, 26, 0.12); color: #52c41a; }
      .risk-level { color: #52c41a; }
    }
    
    &.risk-medium {
      border-left: 4px solid #faad14;
      .risk-icon { background: rgba(250, 173, 20, 0.12); color: #faad14; }
      .risk-level { color: #faad14; }
    }
    
    &.risk-high {
      border-left: 4px solid #f56c6c;
      .risk-icon { background: rgba(245, 108, 108, 0.12); color: #f56c6c; }
      .risk-level { color: #f56c6c; }
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
          box-shadow: inset 2px 2px 4px $neu-2, inset -2px -2px 4px $white;
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
            box-shadow: 2px 2px 4px $neu-2, -2px -2px 4px $white;
            
            &.primary {
              background: linear-gradient(135deg, $purple 0%, #7c9df7 100%);
              color: #fff;
              box-shadow: 2px 2px 6px $neu-2, -1px -1px 4px $white;
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
      box-shadow: 3px 3px 6px $neu-2, -3px -3px 6px $white;
      
      &.primary {
        background: linear-gradient(135deg, $purple 0%, #7c9df7 100%);
        color: #fff;
        box-shadow: 3px 3px 8px $neu-2, -2px -2px 6px $white;
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
        box-shadow: inset 2px 2px 4px $neu-2, inset -2px -2px 4px $white;
        
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
        box-shadow: inset 2px 2px 4px $neu-2, inset -2px -2px 4px $white;
        
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
  transition: opacity 0.3s ease, transform 0.3s ease;
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
    overflow: hidden;
    
    // 数据来源标识
    .video-source-badge {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 10px 20px;
      background: rgba(245, 247, 250, 0.6);
      border-bottom: 1px solid rgba(0, 0, 0, 0.06);
      
      .source-label {
        display: flex;
        align-items: center;
        gap: 6px;
        font-size: 13px;
        font-weight: 500;
        color: #606266;
        
        .el-icon {
          color: #909399;
        }
      }
      
      .source-hint {
        font-size: 12px;
        color: #909399;
      }
    }
    
    .archive-header {
      padding: 12px 24px 10px;
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
          box-shadow: 0 4px 12px rgba(75, 112, 226, 0.3);
          margin-left:-10px;
        }
        
        .file-info {
          flex: 1;
          
          .file-main {
            position: relative;
            margin-bottom: 8px;
            padding-right: 120px; // 为右上角的时长标签留出空间
            min-height: 28px; // 确保至少一行的高度
            
            .file-name {
              font-size: 16px;
              font-weight: 700;
              color: $black;
              font-family: 'Courier New', monospace;
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
                content: '|';
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
        grid-template-columns: repeat(3, 1fr);  // 改为3列
        gap: 16px 12px;  // 增加列间距
        padding: 0;
        
        .stat-item-archive {
          background: $neu-1;
          border-radius: 12px;
          padding: 14px 16px;
          box-shadow: 2px 2px 6px $neu-2, -2px -2px 6px $white;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 6px;
          transition: all 0.3s ease;
          
          &:hover {
            transform: translateY(-2px);
            box-shadow: 3px 3px 8px $neu-2, -3px -3px 8px $white;
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
            font-family: 'Courier New', monospace;
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
          font-family: 'Courier New', monospace;
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
    display: grid;
    grid-template-columns: 1.5fr 1fr;
    gap: 20px;
    margin-bottom: 20px;
    transition: all 0.3s ease;
    align-items: start; // 关键：顶部对齐，防止拉伸
    
    // 证据模式：左右等宽
    &.evidence-mode {
      grid-template-columns: 1.2fr 1fr;
    }
    
    @media (max-width: 1400px) {
      grid-template-columns: 1.2fr 1fr;
    }
    
    @media (max-width: 1200px) {
      grid-template-columns: 1fr;
    }
  }
  
  // 右侧面板容器（字幕 + 雷达图）
  .right-panel-container {
    display: flex;
    flex-direction: column;
    gap: 16px;
    transition: all 0.3s ease;
    // 移除 align-self: stretch，让它自然高度
    
    &.evidence-detail-mode {
      background: linear-gradient(135deg, #f0f2f5 0%, #f5f7fa 100%);
      border-radius: 20px;
      padding: 16px 16px 12px 16px; // 保持内边距
      box-shadow: 8px 8px 16px $neu-2, -8px -8px 16px $white;
      gap: 0; // 移除间距，让证据面板占满
      overflow: visible; // 完全允许内容可见，防止被裁剪
      // 关键：确保高度不会无限增长
      max-height: 100vh; // 临时设置，后面会用 JS 动态计算
    }
  }
  
  // 证据详情面板（内嵌模式）
  .evidence-detail-panel {
    display: flex;
    flex-direction: column;
    height: 100%;
    min-height: 0; // 关键：允许 flex 子元素缩小
    gap: 12px;
    overflow: visible; // 完全允许内容可见
  }
  
  // ==================== 多模态融合区域 - 新拟态风格 ====================
  // 模态卡片行 - 优化间距
  .modality-cards-row {
    display: flex;
    align-items: stretch;
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
  
  // 模态卡片 - 新拟态风格，内容从上到下自然排列
  .modality-card {
    flex: 1 1 auto; // 允许伸缩以适应容器
    background: $neu-1;
    border-radius: 14px;
    padding: 14px 12px;
    box-shadow: 4px 4px 8px $neu-2, -4px -4px 8px $white;
    transition: all 0.2s ease;
    min-width: 90px; // 减小最小宽度，允许更紧凑
    max-width: 150px; // 添加最大宽度，防止过宽
    display: flex;
    flex-direction: column;
    
    &:hover {
      transform: translateY(-2px);
      box-shadow: 6px 6px 12px $neu-2, -6px -6px 12px $white;
    }
    
    // 🎯 统计类型 - 三个模态小卡片（视频、音频、文本）
    &.statistics-type:not(.result-card) {
      align-self: center;           // 卡片高度自适应且垂直居中
      justify-content: center;      // 内容垂直居中
      height:140px;
      
      .modality-header {
        margin-bottom: 0;           // 头部下边距为0
      }
      
      // 👇 在这里添加三个模态小卡片的专属样式
      // 例如：
      // padding: 16px 12px;
      // min-height: 140px;
    }
    
    // 结果卡片 - 外凸弹出效果，给更多空间
    &.result-card {
      box-shadow: 4px 4px 8px $neu-2, -4px -4px 8px $white;
      flex: 1.2 1 auto; // 允许适度伸缩
      min-width: 100px; // 减小最小宽度
      max-width: 160px; // 添加最大宽度限制，防止超出容器
      
      .result-label {
        font-size: 11px;
        color: #666;
        margin-top: 8px;
        text-align: center;
        font-weight: 500;
      }
      
      // 🎯 统计类型 - 融合结果卡片专属样式
      &.statistics-type {
        .modality-header {
          margin-bottom: 0;     // 头部下边距为0
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
    margin-bottom: 10px;  // 默认值
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
      color: #999;
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
    color: #666;
    line-height: 1.4;
    
    .el-icon {
      color: #999;
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
      color: #666;
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
    border-bottom: 2px solid rgba(102, 126, 234, 0.1);
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
    box-shadow: 4px 4px 8px $neu-2, -4px -4px 8px $white;
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
    color: #999;
    text-transform: uppercase;
    letter-spacing: 0.8px;
  }
  
  .panel-confidence-inline {
    font-size: 11px;
    font-weight: 600;
    color: #666;
    white-space: nowrap;
    display: flex;
    align-items: center;
    
    .ai-predict-badge-panel {
      display: inline-flex;
      align-items: center;
      padding: 2px 6px;
      font-size: 10px;
      font-weight: 500;
      color: #909399;
      background: rgba(0, 0, 0, 0.04);
      border-radius: 3px;
      border: 1px solid rgba(0, 0, 0, 0.06);
      cursor: help;
      margin-left: 12px;
    }
    
    &::before {
      content: '●';
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
    border: none;
    background: $neu-1;
    box-shadow: 4px 4px 8px $neu-2, -4px -4px 8px $white;
    color: #666;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.2s;
    
    &:hover {
      color: #667eea;
      transform: scale(1.05);
    }
    
    &:active {
      box-shadow: inset 2px 2px 4px $neu-2, inset -2px -2px 4px $white;
    }
  }
  
  
  .section-title-inline {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 14px;
    font-weight: 600;
    color: #333;
    margin-bottom: 10px;
    padding-bottom: 8px;
    border-bottom: 2px solid #e0e0e0;
  }
  
  .evidence-count {
    font-size: 12px;
    color: #999;
    font-weight: 400;
  }
  
  // 证据列表区域（内嵌版）
  .evidence-list-section {
    flex: 1; // 占据剩余空间
    display: flex;
    flex-direction: column;
    min-height: 0; // 关键：允许缩小
    overflow: visible; // 完全允许内容可见，防止被裁剪
  }
  
  .section-title-inline {
    flex-shrink: 0; // 标题不缩小
  }
  
  .evidence-list-scroll {
    flex: 1; // 占据剩余空间
    overflow-y: auto; // 可滚动
    overflow-x: hidden;
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
    background: rgba(255, 255, 255, 0.6);
    border-radius: 12px;
    padding: 12px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
  }
  
  .group-title-inline {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 13px;
    font-weight: 600;
    color: #555;
    margin-bottom: 10px;
    padding-bottom: 8px;
    border-bottom: 1px solid #e8ecef;
    
    .el-icon {
      color: #666;
    }
  }
  
  .evidence-item-inline {
    display: flex;
    align-items: center;           // ✅ 垂直居中
    gap: 10px;
    padding: 10px;
    border-radius: 8px;
    background: white;
    cursor: pointer;
    transition: all 0.2s;
    border-left: 3px solid transparent;
    
    &:hover {
      background: #f0f2f5;
      border-left-color: #1976d2;
      transform: translateX(3px);
    }
    
    &:not(:last-child) {
      margin-bottom: 8px;
    }
  }
  
  .evidence-time-badge {
    flex-shrink: 0;
    min-width: 50px;                    // 固定最小宽度，确保等宽
    padding: 0;
    background: transparent;            // 无背景
    color: #667eea;                     // 紫色文字
    font-size: 13px;                    // 稍大的字体
    font-weight: 700;                   // 加粗
    font-family: 'Consolas', 'Monaco', monospace;  // 等宽字体
    text-align: left;                   // 左对齐
    letter-spacing: 0.5px;              // 字间距
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
    color: #333;
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
    color: #666;
    background: #d1d9e6;
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
    background: white;
    border-radius: 8px;
    cursor: pointer;
    transition: all 0.2s;
    display: flex;
    flex-direction: column;
    gap: 6px;
    position: relative;
    
    &:hover {
      background: #f0f2f5;
      transform: translateY(-2px);
      box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
    }
    
    // 原生CSS tooltip
    &::before {
      content: attr(data-description);
      position: absolute;
      bottom: calc(100% + 12px);
      left: 50%;
      transform: translateX(-50%);
      padding: 14px 18px;
      max-width: 320px;
      width: max-content;
      min-width: 180px;
      
      // 玻璃态背景
      background: linear-gradient(135deg, rgba(255, 255, 255, 0.95), rgba(248, 250, 252, 0.98));
      backdrop-filter: blur(16px);
      -webkit-backdrop-filter: blur(16px);
      
      // 样式
      color: #1f2937;
      font-size: 13px;
      line-height: 1.7;
      font-weight: 500;
      border-radius: 12px;
      border: 1px solid rgba(203, 213, 225, 0.8);
      box-shadow: 
        0 8px 24px rgba(15, 23, 42, 0.08),
        0 2px 8px rgba(15, 23, 42, 0.04),
        inset 0 1px 0 rgba(255, 255, 255, 0.8);
      
      // 隐藏状态
      opacity: 0;
      visibility: hidden;
      pointer-events: none;
      z-index: 9999;
      
      // 动画
      transition: opacity 0.2s cubic-bezier(0.4, 0, 0.2, 1),
                  visibility 0.2s cubic-bezier(0.4, 0, 0.2, 1),
                  transform 0.2s cubic-bezier(0.4, 0, 0.2, 1);
      transform: translateX(-50%) translateY(4px);
    }
    
    // 箭头
    &::after {
      content: '';
      position: absolute;
      bottom: calc(100% - 3.8px);
      left: 50%;
      transform: translateX(-50%);
      border: 8px solid transparent;
      border-top-color: rgba(255, 255, 255, 0.95);
      filter: drop-shadow(0 2px 4px rgba(15, 23, 42, 0.04));
      
      opacity: 0;
      visibility: hidden;
      pointer-events: none;
      z-index: 9999;
      
      transition: opacity 0.2s cubic-bezier(0.4, 0, 0.2, 1),
                  visibility 0.2s cubic-bezier(0.4, 0, 0.2, 1);
    }
    
    // 悬停显示
    &:hover::before,
    &:hover::after {
      opacity: 1;
      visibility: visible;
      transition-delay: 0.1s;
    }
    
    &:hover::before {
      transform: translateX(-50%) translateY(0);
    }
  }
  
  .text-keyword-inline {
    font-size: 13px;
    font-weight: 500;
    color: #333;
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
    font-family: 'Consolas', 'Monaco', monospace;
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
    
    // 视频下方的实时分析栏（单列，雷达图为主）
    .realtime-analysis-bar-inner {
      width: 100%;
    }
  }
  
  .video-player-wrapper {
    position: relative;
    width: 100%;
    min-height: 480px; /* 修复：增加视频高度 */
    border-radius: 20px;
    overflow: hidden; // 恢复 hidden，防止内部动画影响页面高度
    background: #000;
    box-shadow: 8px 8px 16px $neu-2, -8px -8px 16px $white;
    display: flex;
    align-items: center;
    justify-content: center;
    
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
      background: linear-gradient(180deg, rgba(255, 255, 255, 0.9) 0%, rgba(255, 255, 255, 0.6) 100%);
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
        content: '';
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
      0%, 100% {
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
        animation: fadeIn 0.3s ease, pulse 2s ease-in-out infinite;
      }
      
      // 标签容器（左上角外部显示，业界标准）
      .detection-label-container {
        position: absolute;
        left: 0;
        bottom: 100%;
        margin-bottom: 2px;
        white-space: nowrap;
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
        font-family: 'SF Pro Display', -apple-system, sans-serif;
        
        .emotion-icon {
          font-size: 14px;
        }
        
        .confidence-badge {
          font-size: 11px;
          opacity: 0.9;
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
      transition: top 0.4s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.3s ease;
      
      /* 分屏模式：移到顶部，有平滑过渡动画 */
      &.evidence-mode-shift {
        top: 48px; /* 移动到顶部位置 */
        
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
            
            &.emotion-tense, &.emotion-serious {
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
      
      .control-left, .control-right {
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
            content: '';
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
    0%, 100% {
      box-shadow: 0 0 10px rgba(245, 108, 108, 0.8), 0 0 20px rgba(245, 108, 108, 0.4);
    }
    50% {
      box-shadow: 0 0 20px rgba(245, 108, 108, 1), 0 0 35px rgba(245, 108, 108, 0.7), 0 0 50px rgba(245, 108, 108, 0.4);
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
    0%, 100% {
      opacity: 1;
      transform: scale(1);
    }
    50% {
      opacity: 0.4;
      transform: scale(0.8);
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
    0%, 100% {
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
    box-shadow: 4px 4px 8px $neu-2, -4px -4px 8px $white;
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
    background: $neu-1;
    border-radius: 20px;
    box-shadow: 8px 8px 16px $neu-2, -8px -8px 16px $white;
    overflow: hidden;
    max-height: 480px;
    
    .panel-header-compact {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 12px 16px;
      border-bottom: 1px solid rgba($neu-2, 0.3);
      background: rgba(255, 255, 255, 0.4);
      
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
      
      // 风险过滤器按钮组
      .risk-filter-group {
        display: flex;
        gap: 6px;
        
        .filter-btn {
          padding: 4px 12px;
          font-size: 11px;
          font-weight: 600;
          border: 1px solid rgba($neu-2, 0.6);
          border-radius: 6px;
          background: white;
          color: $gray;
          cursor: pointer;
          transition: all 0.2s ease;
          
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
        }
      }
    }
    
    .transcript-list {
      flex: 1;
      overflow-y: auto;
      padding: 16px;
      
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
        background: white;
        transform: translateX(-4px);
        box-shadow: 4px 4px 10px $neu-2;
      }
      
      &.active {
        background: white;
        border-left-color: $purple;
        box-shadow: 4px 4px 10px $neu-2;
        transform: scale(1.02);
      }
      
      // 已结束状态：降低亮度，保持上下文但视觉上区分
      &.inactive {
        opacity: 0.5;
        transform: scale(1);
        
        &::after {
          content: '已结束';
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
          
          &.emotion-tense, &.emotion-serious {
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
    margin: -10px 0 16px 0; // 上间距减小，与视频更紧凑
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
      padding: 12px 16px;
      border-bottom: 1px solid #f0f0f0;
      
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
      padding: 12px;
      
      .radar-with-score {
        display: flex;
        align-items: center;
        padding-left: 40px;
        gap: 20px;
        margin-bottom: 12px;
        
        .radar-chart-area {
          flex: 1;
          max-width: 380px;
          
          .radar-chart-compact {
            height: 220px;
            width: 100%;
          }
        }
        
        .score-side-panel {
          display: flex;
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
            
            &.low { color: #10b981; }      // 绿色
            &.medium { color: #f59e0b; }   // 橙色
            &.high { color: #ef4444; }     // 红色
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
        border-bottom: 1px solid #f0f0f0;
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
              background: #f5f7fa;
              border-radius: 10px;
              font-size: 11px;
              color: $gray;
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
      border-bottom: 1px solid #f0f0f0;
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
    color: #409EFF;
    white-space: nowrap; // 确保不换行
  }

  .video-description {
    margin: 6px 0 10px 0;
    line-height: 1.6;
  }

  .description-label {
    font-size: 12px;
    color: $purple;
    font-weight: 600;
  }

  .description-text {
    font-size: 12px;
    color: #666;
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
    color: #606266;
    font-weight: 600;
    min-width: 100px;
  }

  .keywords-container {
    display: flex;
    gap: 6px;
    flex-wrap: wrap;
    flex: 1;
  }

  .keyword-tag-detected {
    display: inline-flex;
    align-items: center;
    padding: 4px 12px;
    background: rgba(144, 147, 153, 0.1);
    border: 1px solid rgba(144, 147, 153, 0.2);
    border-radius: 6px;
    font-size: 12px;
    color: #606266;
    transition: all 0.3s;
  }

  .keyword-tag-detected.university-related {
    background: rgba(230, 162, 60, 0.15);
    border-color: rgba(230, 162, 60, 0.4);
    color: #E6A23C;
    font-weight: 600;
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
    background: #f0f2f5;
    color: #606266;
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
    background: #f0f2f5;
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
    color: #909399;
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
    color: #909399;
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
    color: #909399;
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
    color: #606266;
  }

  .unit-text {
    font-size: 12px;
    color: #909399;
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
    border: 1px solid rgba(255,255,255,0.6);
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
    background: #FEF2F2; /* 浅红背景 */
    border: 1px solid #FEE2E2;
  }

  .capsule-risk .capsule-icon {
    color: #F56C6C;
    background: rgba(255,255,255,0.6);
  }

  .text-risk {
    color: #F56C6C;
    font-weight: 800;
  }

  /* 4. 蓝色胶囊 (高校) */
  .capsule-uni {
    background: #ECF5FF; /* 浅蓝背景 */
    border: 1px solid #D9ECFF;
  }

  .capsule-uni .capsule-icon {
    color: #409EFF;
    background: rgba(255,255,255,0.6);
  }

  .text-uni {
    color: #409EFF;
    font-weight: 700;
  }

  /* 5. 普通胶囊 (透明) */
  .capsule-normal {
    background: transparent;
    padding-left: 12px;
    border: 1px solid transparent;
  }

  .capsule-normal:hover {
    background: #F5F7FA; /* 悬停微灰 */
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
    color: #909399;
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
    background: #F56C6C;
    color: white;
    padding: 1px 5px;
    border-radius: 4px;
    line-height: 1.4;
  }

  .unit {
    font-size: 12px;
    color: #909399;
    font-weight: 400;
  }

  /* --- V5 最终版：专业仪表盘样式 --- */
  /* 容器：4列x2行网格布局 */
  .stats-pro-container {
    display: grid;
    grid-template-columns: repeat(3, 1fr);  // 改为3列
    grid-template-rows: repeat(2, 1fr);     // 2行
    background: transparent;
    padding: 0 10px;
    gap: 16px 12px;  // 行间距16px, 列间距12px（增加列间距）
    border: none;
    margin-right:-12px;
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
      content: '';
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
        content: '';
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
      box-shadow: inset 4px 4px 8px rgba(209, 217, 230, 0.8), 
                  inset -4px -4px 8px rgba(255, 255, 255, 0.4);
      transform: translateY(1px) scale(0.98); // 轻微下沉和缩小
      
      &::after {
        background: linear-gradient(135deg, 
          rgba(75, 112, 226, 0.08) 0%, 
          rgba(102, 126, 234, 0.06) 100%);
      }
      
      &:hover {
        transform: translateY(1px) scale(0.98); // 激活时保持按下状态
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
  .stat-pro-item:nth-child(3n+1) {
    padding-left:10px;
  }

  /* 第3列（3,6）- 右侧：右边距减为0 */
  .stat-pro-item:nth-child(3n+3) {
    padding-right:0;
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
    color: #F56C6C;
  }

  .icon-bg-uni {
    background: rgba(64, 158, 255, 0.1);
    color: #409EFF;
  }

  .icon-bg-normal {
    background: rgba(144, 147, 153, 0.1);
    color: #909399;
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
    color: #409EFF;
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
    background: rgba(144, 147, 153, 0.1);
    color: #909399;
  }

  .icon-bg-negative {
    background: rgba(245, 108, 108, 0.1);
    color: #F56C6C;
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
    color: #F56C6C;
  }

  /* 情感倾向文字样式 */
  .text-positive {
    color: #52c41a;
  }

  .text-neutral {
    color: #909399;
  }

  .text-negative {
    color: #F56C6C;
  }

  /* 舆论风险文字样式 */
  .text-risk-low {
    color: #52c41a;
  }

  .text-risk-medium {
    color: #faad14;
  }

  .text-risk-high {
    color: #F56C6C;
  }

  .text-identity {
    color: #409EFF;
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
    color: #909399;
    display: flex;
    align-items: center;
    gap: 6px;
    
    .ai-predict-badge {
      display: inline-flex;
      align-items: center;
      padding: 2px 6px;
      font-size: 10px;
      font-weight: 500;
      color: #909399;
      background: rgba(0, 0, 0, 0.04);
      border-radius: 3px;
      border: 1px solid rgba(0, 0, 0, 0.06);
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
    color: #F56C6C;
  }

  .text-uni {
    color: #409EFF;
  }

  .text-normal {
    color: #303133;
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
    color: #C0C4CC;
    font-weight: 400;
    margin-top: 4px;
  }

  .pro-subtitle {
    font-size: 12px;
    color: #606266;
    font-weight: 500;
    margin-top: 3px;
  }

  /* 风险标签 LV.5 */
  .pro-tag-risk {
    font-size: 10px;
    background: #F56C6C;
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
</style>

<!-- 自定义 Tooltip 样式（全局，非scoped） -->
<style lang="scss">
.custom-tooltip.el-popper {
  background: rgba(255, 255, 255, 0.98) !important;
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  border: 1px solid rgba(0, 0, 0, 0.1) !important;
  border-radius: 8px !important;
  padding: 10px 14px !important;
  box-shadow: 0 6px 16px rgba(0, 0, 0, 0.15) !important;
  font-size: 12px !important;
  color: #303133 !important;
  line-height: 1.6 !important;
  max-width: 280px;
}

.custom-tooltip .el-popper__arrow::before {
  background: rgba(255, 255, 255, 0.98) !important;
  border: 1px solid rgba(0, 0, 0, 0.1) !important;
}
</style>
