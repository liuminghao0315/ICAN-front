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
                    {{ formatDuration(mockVideoArchive.duration) }}
                  </span>
                </div>

                <!-- 用户描述信息(如果有) -->
                <div class="video-description" v-if="mockVideoArchive.description">
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
                          :class="{ 'university-related': isUniversityKeyword(kw) }">
                      {{ kw }}
                    </span>
                  </div>
                </div>
              </div>
            </div>
            
            <div class="global-stats-section stats-pro-container">
              <!-- 高校舆情分析核心指标 -->
              <div class="stat-pro-item">
                <div class="pro-icon icon-bg-identity">
                  <el-icon><User /></el-icon>
                </div>
                <div class="pro-content">
                  <div class="pro-label">身份判定</div>
                  <div class="pro-value text-identity">
                    {{ mockIdentityAnalysis.identityLabel }}
                  </div>
                  <div class="pro-subtitle">置信度 {{ Math.round(mockIdentityAnalysis.confidence * 100) }}%</div>
                </div>
              </div>
              
              <div class="stat-pro-item">
                <div class="pro-icon icon-bg-uni">
                  <el-icon><School /></el-icon>
                </div>
                <div class="pro-content">
                  <div class="pro-label">涉及高校</div>
                  <div class="pro-value text-uni">
                    {{ mockUniversityBaseline.universityName }}
                  </div>
                  <div class="pro-subtitle">匹配度 {{ Math.round(mockUniversityBaseline.logoConfidence * 100) }}%</div>
                </div>
              </div>
              
              <div class="stat-pro-item">
                <div class="pro-icon icon-bg-topic">
                  <el-icon><ChatDotRound /></el-icon>
                </div>
                <div class="pro-content">
                  <div class="pro-label">内容主题</div>
                  <div class="pro-value text-topic">
                    {{ mockContentAnalysis.topicCategory }}
                  </div>
                  <div class="pro-subtitle">{{ mockContentAnalysis.topicSubCategory }}</div>
                </div>
              </div>
              
              <div class="stat-pro-item">
                <div class="pro-icon" :class="getSentimentIconClass(mockContentAnalysis.sentimentTowardSchool)">
                  <el-icon><TrendCharts /></el-icon>
                </div>
                <div class="pro-content">
                  <div class="pro-label">对学校态度</div>
                  <div class="pro-value" :class="getSentimentTextClass(mockContentAnalysis.sentimentTowardSchool)">
                    {{ getSentimentLabel(mockContentAnalysis.sentimentTowardSchool) }}
                  </div>
                  <div class="pro-subtitle">情感强度 {{ Math.round(mockContentAnalysis.sentimentIntensity * 100) }}%</div>
                </div>
              </div>
              
              <div class="stat-pro-item">
                <div class="pro-icon" :class="getOpinionRiskIconClass(mockOpinionRisk.riskLevel)">
                  <el-icon><WarningFilled /></el-icon>
                </div>
                <div class="pro-content">
                  <div class="pro-label">舆论风险</div>
                  <div class="pro-value" :class="getOpinionRiskTextClass(mockOpinionRisk.riskLevel)">
                    {{ mockOpinionRisk.riskLabel }}
                  </div>
                  <div class="pro-subtitle">{{ mockOpinionRisk.riskReason }}</div>
                </div>
              </div>
              
              <div class="stat-pro-item">
                <div class="pro-icon icon-bg-spread">
                  <el-icon><Share /></el-icon>
                </div>
                <div class="pro-content">
                  <div class="pro-label">传播潜力</div>
                  <div class="pro-value text-spread">
                    {{ mockOpinionRisk.spreadPotential }} <span class="pro-unit">/ 10</span>
                  </div>
                  <div class="pro-subtitle">{{ getSpreadPotentialLabel(mockOpinionRisk.spreadPotential) }}</div>
                </div>
              </div>
              
              <div class="stat-pro-item">
                <div class="pro-icon icon-bg-mention">
                  <el-icon><Document /></el-icon>
                </div>
                <div class="pro-content">
                  <div class="pro-label">学校提及</div>
                  <div class="pro-value text-mention">
                    {{ mockContentAnalysis.schoolMentionCount }} <span class="pro-unit">次</span>
                  </div>
                  <div class="pro-subtitle">含 {{ mockContentAnalysis.negativeMentionCount }} 处负面</div>
                </div>
              </div>
              
              <div class="stat-pro-item">
                <div class="pro-icon icon-bg-action">
                  <el-icon><DocumentChecked /></el-icon>
                </div>
                <div class="pro-content">
                  <div class="pro-label">处置建议</div>
                  <div class="pro-value text-action">
                    {{ mockOpinionRisk.actionSuggestion }}
                  </div>
                  <div class="pro-subtitle">{{ mockOpinionRisk.actionDetail }}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <!-- 视频 + 台词（左右布局，保持宽敞） -->
        <div class="multi-modal-container">
          <!-- 左侧：证据截图区域 -->
          <div class="video-section">
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
              
              <!-- CV视觉模态：多检测框叠加层（业界标准） -->
              <div class="detections-overlay">
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
              <div class="detection-legend">
                <div class="legend-title">检测类型</div>
                <div class="legend-items">
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
                  <span v-if="currentEvidence.riskLevel === 'HIGH'" class="info-tag risk-alert">
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
              <v-chart ref="timelineChartRef" :option="multiModalTimelineOption" class="timeline-chart-inline" @click="onTimelineClick" />
            </div>
          </div>
          
          <!-- 右侧：字幕 + 雷达图容器 -->
          <div class="right-panel-container">
            <!-- 台词列表区域（精简版） -->
            <div class="transcript-panel">
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
                    'high-risk': evidence.riskLevel === 'HIGH',
                    'medium-risk': evidence.riskLevel === 'MEDIUM'
                  }"
                  @click="selectEvidence(evidence.id)"
                >
                  <div class="segment-header">
                    <span class="time-range">{{ evidence.time }}</span>
                    <span v-if="evidence.emotion" class="emotion-badge" :class="getEmotionClass(evidence.emotion)">
                      {{ getEmotionText(evidence.emotion) }}
                    </span>
                    <span v-if="evidence.riskLevel !== 'LOW'" class="risk-tag" :class="evidence.riskLevel.toLowerCase()">
                      {{ evidence.riskLevel === 'HIGH' ? '高风险' : '中风险' }}
                    </span>
                  </div>
                  <div class="segment-text" v-html="highlightKeywords(evidence.content, evidence.keywords)"></div>
                  
                  <!-- Gemini优化：音频特征展示 -->
                  <div v-if="evidence.emotion" class="audio-features">
                    <span class="audio-feature-tag" :class="'emotion-' + evidence.emotion">
                      <el-icon :size="11"><Headset /></el-icon>
                      情绪: {{ getEmotionText(evidence.emotion) }}
                    </span>
                    <span v-if="evidence.riskLevel === 'HIGH'" class="audio-feature-tag volume">
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
            
            <!-- 雷达图（含风险分） -->
            <div class="neu-card dashboard-radar">
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
                <div class="fusion-formula-compact">
                  风险分 = 身份置信×0.15 + 学校关联×0.20 + 负面情感×0.30 + 传播×0.15 + 影响×0.10 + 紧迫度×0.10
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
      
      <!-- 报告视图（原有的完整报告，用于PDF导出） -->
      <div v-else key="report" class="analysis-content" ref="reportContentRef">
      <!-- 视频信息 -->
      <div class="video-info-bar">
        <div class="video-icon">
          <el-icon :size="24"><VideoPlay /></el-icon>
        </div>
        <div class="video-details">
          <div class="video-title-row">
            <span class="video-title">{{ analysisData.videoTitle }}</span>
            <span class="video-meta">分析时间：{{ formatDate(analysisData.gmtCreated) }}</span>
          </div>
          <div class="video-description" v-if="analysisData.videoDescription">
            {{ analysisData.videoDescription }}
          </div>
        </div>
        <button class="neu-btn play-video-btn" @click="playVideo()" v-if="analysisData.videoUrl">
          <el-icon><VideoPlay /></el-icon>
          播放视频
        </button>
      </div>
      
      <!-- 风险评分卡片 -->
      <div class="risk-cards-grid">
        <div class="neu-card risk-card" :class="getRiskClass(analysisData.riskLevel)">
          <div class="risk-icon">
            <el-icon :size="28"><Warning /></el-icon>
          </div>
          <div class="risk-info">
            <div class="risk-score">{{ formatScore(analysisData.riskScore) }}</div>
            <div class="risk-label">风险评分</div>
            <div class="risk-level">{{ analysisData.riskLevelDesc || getRiskLevelText(analysisData.riskLevel) }}</div>
          </div>
        </div>
        
        <div class="neu-card stat-card">
          <div class="stat-icon primary">
            <el-icon :size="24"><School /></el-icon>
          </div>
          <div class="stat-info">
            <div class="stat-value">{{ analysisData.isUniversityRelated ? '是' : '否' }}</div>
            <div class="stat-label">高校相关</div>
            <div class="stat-detail" v-if="analysisData.universityName">
              {{ analysisData.universityName }} ({{ formatScore(analysisData.universityConfidence) }})
            </div>
          </div>
        </div>
        
        <div class="neu-card stat-card">
          <div class="stat-icon" :class="getSentimentClass(analysisData.sentimentLabel)">
            <el-icon :size="24"><ChatDotRound /></el-icon>
          </div>
          <div class="stat-info">
            <div class="stat-value">{{ analysisData.sentimentLabelDesc || getSentimentText(analysisData.sentimentLabel) }}</div>
            <div class="stat-label">情感倾向</div>
            <div class="stat-detail">
              评分: {{ (analysisData.sentimentScore * 100).toFixed(1) }}%
            </div>
          </div>
        </div>
        
        <div class="neu-card stat-card">
          <div class="stat-icon warning">
            <el-icon :size="24"><Document /></el-icon>
          </div>
          <div class="stat-info">
            <div class="stat-value">{{ analysisData.topicCategory || '未分类' }}</div>
            <div class="stat-label">主题分类</div>
            <div class="stat-detail" v-if="analysisData.spreadPotential">
              传播潜力: {{ formatScore(analysisData.spreadPotential) }}
            </div>
          </div>
        </div>
      </div>
      
      <!-- 图表展示区域 -->
      <div class="charts-grid">
        <div class="neu-card">
          <div class="card-header">
            <span class="card-title">风险评分分布</span>
          </div>
          <v-chart :option="riskChartOption" class="chart" />
        </div>
        
        <div class="neu-card">
          <div class="card-header">
            <span class="card-title">受众年龄分布</span>
          </div>
          <v-chart :option="audienceChartOption" class="chart" />
        </div>
      </div>
      
      <!-- 详细分析结果 - 聚焦风险预警 -->
      <div class="details-grid">
        <!-- 视频内容分析 -->
        <div class="neu-card">
          <div class="card-header">
            <span class="card-title">
              <el-icon><VideoCamera /></el-icon>
              视频内容分析
            </span>
          </div>
          <div class="feature-details" v-if="analysisData.videoFeatures">
            <div class="feature-item">
              <span class="feature-label">内容类型</span>
              <span class="feature-value">{{ analysisData.videoFeatures.sceneType || '未知' }}</span>
            </div>
            <div class="feature-item">
              <span class="feature-label">高校场景识别</span>
              <span class="feature-value">
                {{ isUniversityScene(analysisData.videoFeatures.sceneType) ? '是' : '否' }}
              </span>
            </div>
            <div class="feature-item">
              <span class="feature-label">人物出现</span>
              <span class="feature-value">
                {{ analysisData.videoFeatures.hasPerson ? '是' : '否' }}
                <span v-if="analysisData.videoFeatures.faceCount > 0">({{ analysisData.videoFeatures.faceCount }}人)</span>
              </span>
            </div>
            <div class="feature-item">
              <span class="feature-label">视频时长</span>
              <span class="feature-value">{{ formatDuration(analysisData.videoFeatures.duration) }}</span>
            </div>
          </div>
          <div v-else class="empty-feature">
            <el-icon :size="36"><VideoCamera /></el-icon>
            <span>暂无视频分析数据</span>
          </div>
        </div>
        
        <!-- 语音内容分析 -->
        <div class="neu-card">
          <div class="card-header">
            <span class="card-title">
              <el-icon><Microphone /></el-icon>
              语音内容识别
            </span>
          </div>
          <div class="feature-details" v-if="analysisData.transcription">
            <div class="feature-item full">
              <span class="feature-label">语音转文字内容</span>
              <div class="feature-value transcription">
                {{ analysisData.transcription }}
              </div>
            </div>
            <div class="feature-item">
              <span class="feature-label">检测到语音</span>
              <span class="feature-value">{{ analysisData.audioFeatures?.hasAudio ? '是' : '否' }}</span>
            </div>
            <div class="feature-item">
              <span class="feature-label">语音清晰度</span>
              <span class="feature-value">{{ analysisData.audioFeatures?.speechRatio > 0.5 ? '清晰' : '模糊' }}</span>
            </div>
          </div>
          <div v-else class="empty-feature">
            <el-icon :size="36"><Microphone /></el-icon>
            <span>暂无语音内容</span>
          </div>
        </div>
        
        <!-- 文本风险分析 -->
        <div class="neu-card">
          <div class="card-header">
            <span class="card-title">
              <el-icon><Document /></el-icon>
              内容风险分析
            </span>
          </div>
          <div class="feature-details" v-if="analysisData.topicKeywords || analysisData.sentimentLabel">
            <div class="feature-item">
              <span class="feature-label">主题分类</span>
              <span class="feature-value">{{ analysisData.topicCategory || '未分类' }}</span>
            </div>
            <div class="feature-item">
              <span class="feature-label">言论倾向</span>
              <span class="feature-value">
                <span :class="getSentimentRiskClass(analysisData.sentimentLabel)">
                  {{ getSentimentText(analysisData.sentimentLabel) }}
                </span>
              </span>
            </div>
            <div class="feature-item full" v-if="analysisData.topicKeywords && analysisData.topicKeywords.length > 0">
              <span class="feature-label">提取关键词</span>
              <div class="feature-value keywords-inline">
                <span 
                  v-for="(keyword, index) in analysisData.topicKeywords.slice(0, 7)" 
                  :key="index"
                  class="keyword-tag-small"
                  :class="{ primary: index < 3 }"
                >
                  {{ keyword }}
                </span>
              </div>
            </div>
            <div class="feature-item" v-if="analysisData.isUniversityRelated !== undefined">
              <span class="feature-label">高校相关内容</span>
              <span class="feature-value">
                <span :class="analysisData.isUniversityRelated ? 'text-warning' : 'text-muted'">
                  {{ analysisData.isUniversityRelated ? '是' : '否' }}
                </span>
                <span v-if="analysisData.universityName" class="text-primary"> - {{ analysisData.universityName }}</span>
              </span>
            </div>
          </div>
          <div v-else class="empty-feature">
            <el-icon :size="36"><Document /></el-icon>
            <span>暂无文本分析数据</span>
          </div>
        </div>
      </div>
      
      <!-- 内容词云图 -->
      <div class="neu-card wordcloud-card" v-if="getWordCloudData().length > 0">
        <div class="card-header">
          <span class="card-title">
            <el-icon><DataAnalysis /></el-icon>
            内容词云分析
          </span>
          <span class="card-subtitle">基于语音识别文本的关键词频统计</span>
        </div>
        <div class="wordcloud-content">
          <div class="wordcloud-visual">
            <span
              v-for="(item, index) in getWordCloudData().slice(0, 20)"
              :key="index"
              class="word-item"
              :style="getWordStyle(item.value, index)"
            >
              {{ item.name }}
            </span>
          </div>
        </div>
      </div>
      
      <!-- 敏感内容检测 -->
      <div class="neu-card sensitive-card">
        <div class="card-header">
          <span class="card-title">
            <el-icon><Warning /></el-icon>
            敏感内容检测
          </span>
        </div>
        <div class="sensitive-content">
          <div v-if="getSensitiveWords().length === 0" class="no-sensitive">
            <el-icon :size="36" color="#52c41a"><Select /></el-icon>
            <p>✅ 未检测到敏感词汇</p>
            <p class="hint">内容安全，无明显风险</p>
          </div>
          <div v-else class="sensitive-list">
            <div class="sensitive-warning">
              <el-icon color="#f56c6c"><Warning /></el-icon>
              <span>检测到 {{ getSensitiveWords().length }} 个敏感词</span>
            </div>
            <div 
              v-for="(item, index) in getSensitiveWords()"
              :key="index"
              class="sensitive-item"
            >
              <span class="sensitive-word">{{ item.word }}</span>
              <span class="sensitive-category">{{ item.category }}</span>
            </div>
          </div>
        </div>
      </div>
      
      <!-- 影响力评估 -->
      <div class="neu-card audience-card" v-if="analysisData.audienceAnalysis">
        <div class="card-header">
          <span class="card-title">
            <el-icon><User /></el-icon>
            影响力评估
          </span>
          <span class="card-subtitle">基于内容特征的传播潜力分析</span>
        </div>
        <div class="audience-content">
          <div class="audience-stats">
            <div class="stat-box">
              <div class="stat-number">{{ formatScore(analysisData.spreadPotential) }}</div>
              <div class="stat-name">传播潜力</div>
              <div class="stat-hint">如发布到公开平台的预期传播范围</div>
            </div>
            <div class="stat-box" v-if="analysisData.audienceAnalysis.ageDistribution">
              <div class="stat-number">{{ getPrimaryAudience(analysisData.audienceAnalysis.ageDistribution) }}</div>
              <div class="stat-name">主要受众</div>
              <div class="stat-hint">最可能关注此内容的人群</div>
            </div>
          </div>
          <div class="interests-section" v-if="analysisData.audienceAnalysis.predictedInterests">
            <h4>潜在受众兴趣标签</h4>
            <div class="interests-list">
              <span 
                v-for="(interest, index) in analysisData.audienceAnalysis.predictedInterests" 
                :key="index"
                class="interest-tag"
              >
                {{ interest }}
              </span>
            </div>
          </div>
        </div>
      </div>
      
      <!-- 风险时间轴可视化 -->
      <div class="neu-card timeline-card" v-if="getRiskTimelineData()">
        <div class="card-header">
          <span class="card-title">
            <el-icon><DataLine /></el-icon>
            风险时间分布
          </span>
          <span class="card-subtitle">视频全时段风险指数变化趋势（点击跳转播放 | 悬停查看详情）</span>
        </div>
        <v-chart 
          :option="riskTimelineOption" 
          class="risk-timeline-chart"
          @click="onTimelineClick"
        />
      </div>
      
      <!-- 操作按钮 - 导出PDF时隐藏 -->
      <div class="action-buttons" ref="actionButtonsRef">
        <button class="neu-btn primary-btn" @click="exportReport">
          <el-icon><Download /></el-icon>
          导出PDF报告
        </button>
        <button class="neu-btn" @click="$router.push('/videos')">
          <el-icon><VideoPlay /></el-icon>
          返回视频列表
        </button>
      </div>
      </div> <!-- 闭合报告视图 -->
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

// 主视频播放器引用
const mainVideoPlayerRef = ref<HTMLVideoElement | null>(null)

// 当前播放时间
const currentPlayTime = ref(0)

// 视频真实时长（秒）
const videoDuration = ref(180)

// 当前激活的台词段落索引
const currentSegmentIndex = ref(-1)

// 当前显示的检测框
const currentDetection = ref<any>(null)

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

// ==================== V1.5 新增：Mock证据数据 ====================
interface RiskEvidence {
  id: string
  time: string // 显示用，如 "00:42"
  timeSeconds: number // 起始时间（秒）
  timeEndSeconds?: number // 结束时间（秒）
  content: string // 台词
  riskLevel: 'HIGH' | 'MEDIUM' | 'LOW'
  imageUrl: string // 对应这一刻的截图URL
  boxStyle: { top: string; left: string; width: string; height: string }
  label: string // 红框上的字，如 "非官方横幅"
  confidence: number // 置信度
  keywords: string[] // 高亮关键词
  emotion?: string // 语音情绪
}

// ==================== CV视觉模态：检测框数据结构 ====================
interface Detection {
  id: string
  type: 'face' | 'ocr' | 'logo' | 'uniform' | 'banner' | 'object'
  boundingBox: { x: number; y: number; width: number; height: number } // 百分比坐标
  confidence: number // 置信度 0-1
  label: string // 检测标签，如 "愤怒表情"、"北大校徽"
  timeStart: number // 开始时间（秒）
  timeEnd: number // 结束时间（秒）
  metadata?: {
    emotion?: string // 表情：angry, calm, serious, tense
    emotionIcon?: string // 表情图标：😡, 😐, 😟
    age?: number // 年龄（仅人脸）
    gender?: string // 性别（仅人脸）
  }
}

// ==================== CV视觉模态：场景识别数据结构 ====================
interface SceneInfo {
  id: string
  name: string // 场景名称，如 "教室"、"宿舍"
  icon: string // 场景图标，如 "🏫"、"🛏️"
  confidence: number // 置信度 0-1
  timeStart: number // 开始时间（秒）
  timeEnd: number // 结束时间（秒）
}

// Mock证据数组（5条证据，覆盖高/中/低风险）
const mockRiskEvidence: RiskEvidence[] = [
  {
    id: 'evidence-1',
    time: '00:05-00:10',
    timeSeconds: 5,
    timeEndSeconds: 10,
    content: '大家好，我是今天的视频发布者，主要想聊聊最近发生的一些事情...',
    riskLevel: 'LOW',
    imageUrl: 'https://images.unsplash.com/photo-1523050854058-8df90110c9f1?w=800&h=450&fit=crop', // 大学校园
    boxStyle: { top: '0%', left: '0%', width: '0%', height: '0%' }, // 无检测框
    label: '',
    confidence: 0,
    keywords: [],
    emotion: 'calm'
  },
  {
    id: 'evidence-2',
    time: '00:15-00:22',
    timeSeconds: 15,
    timeEndSeconds: 22,
    content: '但是学校的这个政策完全是欺骗学生的，大家千万不要相信，我们应该联合起来抵制这种行为！',
    riskLevel: 'HIGH',
    imageUrl: 'https://images.unsplash.com/photo-1541339907198-e08756dedf3f?w=800&h=450&fit=crop', // 抗议场景
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
    riskLevel: 'MEDIUM',
    imageUrl: 'https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?w=800&h=450&fit=crop', // 人群讨论
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
    riskLevel: 'MEDIUM',
    imageUrl: 'https://images.unsplash.com/photo-1577896851905-4dcc0c7f1f1c?w=800&h=450&fit=crop', // 严肃场景
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
    riskLevel: 'LOW',
    imageUrl: 'https://images.unsplash.com/photo-1498243691581-b145c3f54a5a?w=800&h=450&fit=crop', // 校园环境
    boxStyle: { top: '0%', left: '0%', width: '0%', height: '0%' },
    label: '',
    confidence: 0,
    keywords: [],
    emotion: 'calm'
  }
]

// 当前选中的证据ID
const selectedEvidenceId = ref<string>('')

// 风险过滤器状态
const riskFilter = ref<'all' | 'medium-high' | 'high'>('all')

// 真实视频URL
const realVideoUrl = ref('https://5aedd2d8.r12.cpolar.top/ican-videos/videos/2026/02/01/ae8f478c008b448c865a03cabdeeec1a.mp4')

// ==================== 动态雷达图数据（根据视频时间变化） ====================
// 不同时间段的雷达图数据（高校舆情分析6个维度）
// 雷达图动态数据（高校舆情分析维度）
// 维度顺序：[身份置信度, 学校关联度, 负面情感度, 传播风险, 影响范围, 处置紧迫度]
const mockRadarDataByTime = [
  { timeStart: 0, timeEnd: 10, data: [85, 65, 15, 20, 25, 15] },      // 0-10s: 自我介绍，明确学生身份
  { timeStart: 10, timeEnd: 20, data: [85, 80, 40, 35, 45, 30] },     // 10-20s: 陈述问题，涉及学校系统
  { timeStart: 20, timeEnd: 30, data: [85, 95, 88, 70, 85, 75] },     // 20-30s: 情绪激动，强烈批评学校
  { timeStart: 30, timeEnd: 40, data: [85, 90, 65, 55, 70, 50] },     // 30-40s: 持续不满，可能引发共鸣
  { timeStart: 40, timeEnd: 50, data: [85, 85, 35, 40, 50, 35] },     // 40-50s: 提出诉求，语气缓和
  { timeStart: 50, timeEnd: 999, data: [85, 80, 25, 45, 40, 25] }     // 50s+: 呼吁传播，有一定传播风险
]

// 当前时间点的雷达图数据（动态计算）
const currentRadarData = computed(() => {
  const currentTime = currentPlayTime.value
  const dataPoint = mockRadarDataByTime.find(
    item => currentTime >= item.timeStart && currentTime < item.timeEnd
  )
  return dataPoint ? dataPoint.data : mockRadarDataByTime[0].data
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
    return mockRiskEvidence.filter(e => e.riskLevel === 'HIGH' || e.riskLevel === 'MEDIUM')
  } else if (riskFilter.value === 'high') {
    return mockRiskEvidence.filter(e => e.riskLevel === 'HIGH')
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

// ==================== 逻辑修复：视频档案数据（本地上传场景） ====================
interface VideoArchive {
  fileName: string // 视频文件名
  fileSize: number // 文件大小（字节）
  duration: number // 时长（秒）
  resolution: string // 分辨率
  uploadTime: string // 上传时间
  uploadSource: string // 来源：本地上传
  analysisStatus: string // 分析状态
  manualTag?: string // 可选：人工标记的备注对象
  description?: string // 可选：用户上传时填写的视频描述
}

const mockVideoArchive: VideoArchive = {
  fileName: '北大学生吐槽选课系统_20240201.mp4',
  fileSize: 128 * 1024 * 1024, // 128MB
  duration: 195, // 3分15秒
  resolution: '1920×1080',
  uploadTime: '2024-02-01 14:30:25',
  uploadSource: '抖音平台',
  analysisStatus: '分析完成',
  manualTag: '校园舆情-选课系统', // 人工备注
  description: '自称北京大学计算机系学生，吐槽学校选课系统经常崩溃、热门课抢不到等问题，情绪较为激动，可能引发其他学生共鸣转发。' // 视频内容摘要
}

// 匹配基准库配置
interface UniversityBaseline {
  universityName: string
  universityId: string
  logoConfidence: number // 校徽匹配置信度
  sceneDatabase: string // 场景库版本
}

const mockUniversityBaseline: UniversityBaseline = {
  universityName: '北京大学',
  universityId: 'PKU_001',
  logoConfidence: 0.92,
  sceneDatabase: 'V2.3.1'
}

// ==================== 高校舆情分析核心数据 ====================

// 身份判定分析
interface IdentityAnalysis {
  identityType: 'student' | 'alumni' | 'staff' | 'unrelated' | 'unknown'
  identityLabel: string
  confidence: number
  evidences: string[]  // 判定依据
}

const mockIdentityAnalysis: IdentityAnalysis = {
  identityType: 'student',
  identityLabel: '疑似在校学生',
  confidence: 0.85,
  evidences: [
    '语音中提及"我们学校"、"我是北大的"',
    '画面出现校园场景（图书馆、教学楼）',
    '穿着疑似校园服饰'
  ]
}

// 内容分析（高校舆情视角）
interface ContentAnalysis {
  topicCategory: string  // 内容主题大类
  topicSubCategory: string  // 内容主题细分
  sentimentTowardSchool: 'positive' | 'neutral' | 'negative'  // 对学校的情感倾向
  sentimentIntensity: number  // 情感强度 0-1
  schoolMentionCount: number  // 学校相关提及次数
  negativeMentionCount: number  // 负面提及次数
  keyTopics: string[]  // 涉及的具体话题
}

const mockContentAnalysis: ContentAnalysis = {
  topicCategory: '校园政策',
  topicSubCategory: '选课制度吐槽',
  sentimentTowardSchool: 'negative',
  sentimentIntensity: 0.72,
  schoolMentionCount: 8,
  negativeMentionCount: 5,
  keyTopics: ['选课系统崩溃', '课程名额不足', '热门课抢不到']
}

// 舆论风险评估
interface OpinionRisk {
  riskLevel: 'low' | 'medium' | 'high'
  riskLabel: string
  riskScore: number  // 0-100
  riskReason: string
  spreadPotential: number  // 传播潜力 1-10
  actionSuggestion: string
  actionDetail: string
  potentialImpacts: string[]
}

const mockOpinionRisk: OpinionRisk = {
  riskLevel: 'medium',
  riskLabel: '中等风险',
  riskScore: 58,
  riskReason: '可能引发跟风吐槽',
  spreadPotential: 6.5,
  actionSuggestion: '建议关注',
  actionDetail: '持续监控舆情动态',
  potentialImpacts: [
    '可能引发其他学生共鸣转发',
    '对学校选课系统形象有一定负面影响',
    '建议教务处关注并优化系统'
  ]
}

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

// 辅助函数：获取传播潜力标签
const getSpreadPotentialLabel = (score: number): string => {
  if (score >= 8) return '极易传播'
  if (score >= 6) return '较易传播'
  if (score >= 4) return '一般'
  return '传播性低'
}

// ==================== 高校舆情分析核心数据 END ====================

// AI目标侧写数据（从视频内容推测）
interface AIProfileResult {
  identityStatus: 'confirmed' | 'suspected' | 'unknown'
  identityLabel: string
  confidence: number
  matchSource: string // 匹配依据来源
  detectedKeywords: string[] // 从语音/字幕提取的关键词
  staticFeatures: {
    gender: string // 性别
    ageRange: string // 年龄段
    voiceProfile: string // 声纹属性
    clothing: string // 穿着
  }
  sceneType: string
  sceneConfidence: number
}

const mockAIProfile: AIProfileResult = {
  identityStatus: 'suspected',
  identityLabel: '疑似在校学生',
  confidence: 0.85,
  matchSource: `语音中自称"北大计算机系学生"，检测到校园场景`,
  detectedKeywords: [
    '北大',
    '北京大学',
    '计算机系',
    '我们学校',
    '选课系统',
    '教务处',
    '失望',
    '不负责任',
    '热门课',
    '抢不到'
  ],
  staticFeatures: {
    gender: '男性',
    ageRange: '20-24岁',
    voiceProfile: '年轻男性/情绪激动',
    clothing: '休闲装'
  },
  sceneType: '校园宿舍',
  sceneConfidence: 0.88
}

// 模拟数据：带时间戳的转录文本
const mockTranscriptSegments = computed(() => {
  if (!analysisData.value) return []
  
  // 基于实际转录文本生成模拟分段 - 高校舆情场景
  const transcription = analysisData.value.transcription || ''
  const duration = (analysisData.value.videoFeatures as any)?.duration || 180
  
  return [
    {
      start: 0,
      end: 18,
      text: '大家好，我是北大计算机系大三的学生，今天想跟大家聊聊我们学校选课系统的问题...',
      emotion: 'calm',
      riskLevel: 'low',
      keywords: ['北大', '学生'],
      reason: '自我介绍，明确表明本校学生身份'
    },
    {
      start: 18,
      end: 45,
      text: '每学期选课的时候，系统都会崩溃，这个问题已经存在好几年了，学校一直没有解决...',
      emotion: 'calm',
      riskLevel: 'low',
      keywords: ['选课', '系统崩溃'],
      reason: '陈述事实，情绪平稳，但涉及对学校的批评'
    },
    {
      start: 45,
      end: 72,
      text: '我觉得作为全国顶尖的大学，连一个选课系统都搞不好，真的太让人失望了，这是对学生的不负责任！',
      emotion: 'angry',
      riskLevel: 'high',
      keywords: ['失望', '不负责任', '顶尖大学'],
      reason: '情绪激动，对学校表达强烈不满，涉及学校声誉'
    },
    {
      start: 72,
      end: 98,
      text: '好多热门课根本抢不到，有些同学为了选上课都得半夜爬起来盯着电脑，这合理吗？',
      emotion: 'serious',
      riskLevel: 'medium',
      keywords: ['抢不到', '热门课'],
      reason: '持续表达不满，可能引发其他学生共鸣'
    },
    {
      start: 98,
      end: 125,
      text: '希望学校教务处能够重视这个问题，不要再让学生们为选课焦虑了，我们的诉求很简单...',
      emotion: 'calm',
      riskLevel: 'low',
      keywords: ['教务处', '诉求'],
      reason: '提出诉求，语气缓和，有建设性'
    },
    {
      start: 125,
      end: Math.min(duration, 155),
      text: '如果学校能改进选课系统，对学生来说是一件好事，希望这个视频能被更多人看到。',
      emotion: 'calm',
      riskLevel: 'low',
      keywords: [],
      reason: '总结性陈述，呼吁传播，有一定传播风险'
    }
  ].filter(seg => seg.end <= duration)
})

// 模拟数据：视频风险点（增强版 - 包含详细原因）
const mockVideoRisks = computed(() => {
  if (!analysisData.value) return []
  
  // 高校舆情相关检测点
  return [
    {
      time: 5,
      type: '校园场景识别',
      confidence: 0.95,
      boundingBox: { x: 10, y: 10, width: 80, height: 60 },
      reason: '检测到北京大学教学楼背景',
      riskLevel: 'low'  // 场景识别本身不是风险，是身份判定依据
    },
    {
      time: 48,
      type: '负面情绪表达',
      confidence: 0.88,
      boundingBox: { x: 30, y: 40, width: 40, height: 35 },
      reason: '说话者面部表情显示不满情绪',
      riskLevel: 'medium'
    },
    {
      time: 55,
      type: '学校名称提及',
      confidence: 0.96,
      boundingBox: { x: 20, y: 75, width: 60, height: 15 },
      reason: '语音中直接提及"北大"、"顶尖大学"等',
      riskLevel: 'high'  // 涉及学校声誉时为高风险
    },
    {
      time: 72,
      type: '情绪激动峰值',
      confidence: 0.92,
      boundingBox: { x: 25, y: 35, width: 50, height: 40 },
      reason: '音量升高，语速加快，表达强烈不满',
      riskLevel: 'high'
    }
  ]
})

// ==================== CV视觉模态：检测框Mock数据（业界标准） ====================
const mockDetections: Detection[] = [
  // 人脸检测 - 3个时间段
  {
    id: 'face-1',
    type: 'face',
    boundingBox: { x: 35, y: 20, width: 25, height: 35 },
    confidence: 0.96,
    label: '平静表情',
    timeStart: 5,
    timeEnd: 15,
    metadata: {
      emotion: 'calm',
      emotionIcon: '😐',
      age: 22,
      gender: '男性'
    }
  },
  {
    id: 'face-2',
    type: 'face',
    boundingBox: { x: 32, y: 18, width: 28, height: 38 },
    confidence: 0.98,
    label: '愤怒表情',
    timeStart: 15,
    timeEnd: 30,
    metadata: {
      emotion: 'angry',
      emotionIcon: '😡',
      age: 22,
      gender: '男性'
    }
  },
  {
    id: 'face-3',
    type: 'face',
    boundingBox: { x: 30, y: 15, width: 30, height: 40 },
    confidence: 0.94,
    label: '严肃表情',
    timeStart: 30,
    timeEnd: 50,
    metadata: {
      emotion: 'serious',
      emotionIcon: '😟',
      age: 22,
      gender: '男性'
    }
  },
  
  // OCR检测 - 2个敏感词
  {
    id: 'ocr-1',
    type: 'ocr',
    boundingBox: { x: 15, y: 55, width: 40, height: 12 },
    confidence: 0.98,
    label: 'OCR敏感词：[抵制]',
    timeStart: 15,
    timeEnd: 20,
    metadata: {}
  },
  {
    id: 'ocr-2',
    type: 'ocr',
    boundingBox: { x: 20, y: 60, width: 35, height: 10 },
    confidence: 0.91,
    label: 'OCR敏感词：[追究]',
    timeStart: 35,
    timeEnd: 40,
    metadata: {}
  },
  
  // 校徽检测 - 1个
  {
    id: 'logo-1',
    type: 'logo',
    boundingBox: { x: 70, y: 25, width: 15, height: 15 },
    confidence: 0.95,
    label: '检测到北大校徽',
    timeStart: 10,
    timeEnd: 30,
    metadata: {}
  },
  
  // 校服检测 - 1个
  {
    id: 'uniform-1',
    type: 'uniform',
    boundingBox: { x: 30, y: 45, width: 35, height: 50 },
    confidence: 0.89,
    label: '检测到北大校服',
    timeStart: 5,
    timeEnd: 35,
    metadata: {}
  },
  
  // 横幅检测 - 1个
  {
    id: 'banner-1',
    type: 'banner',
    boundingBox: { x: 10, y: 70, width: 80, height: 20 },
    confidence: 0.93,
    label: '检测到横幅标语',
    timeStart: 20,
    timeEnd: 28,
    metadata: {}
  }
]

// ==================== CV视觉模态：场景识别Mock数据 ====================
const mockScenes: SceneInfo[] = [
  {
    id: 'scene-1',
    name: '教室',
    icon: '🏫',
    confidence: 0.92,
    timeStart: 0,
    timeEnd: 20
  },
  {
    id: 'scene-2',
    name: '宿舍',
    icon: '🛏️',
    confidence: 0.88,
    timeStart: 20,
    timeEnd: 35
  },
  {
    id: 'scene-3',
    name: '户外场景',
    icon: '🌳',
    confidence: 0.85,
    timeStart: 35,
    timeEnd: 50
  }
]

// 模拟数据：音频情绪波动（增强版 - 包含详细原因）
const mockAudioEmotions = computed(() => {
  if (!analysisData.value) return []
  
  return [
    { start: 0, end: 15, emotion: 'calm', intensity: 0.3, reason: '语音平稳，无明显情绪波动' },
    { start: 15, end: 42, emotion: 'calm', intensity: 0.4, reason: '语速正常，情绪稳定' },
    { start: 42, end: 68, emotion: 'angry', intensity: 0.9, reason: '检测到愤怒咆哮，音量突然增大' },
    { start: 68, end: 95, emotion: 'tense', intensity: 0.7, reason: '语气紧张激动，音调升高' },
    { start: 95, end: 125, emotion: 'tense', intensity: 0.6, reason: '情绪持续紧张状态' },
    { start: 125, end: 155, emotion: 'calm', intensity: 0.4, reason: '情绪逐渐平复' }
  ]
})

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
            <div style="font-size: 14px; font-weight: 600; color: #f56c6c; margin-bottom: 8px; border-bottom: 2px solid #f56c6c; padding-bottom: 6px;">
              <i class="fas fa-chart-area" style="margin-right: 4px;"></i>
              ${params.name}
            </div>
            <div style="display: flex; flex-direction: column; gap: 6px;">
        `
        
        dimensions.forEach((dim, index) => {
          const value = values[index] || 0
          let levelText = '正常'
          let levelColor = '#52c41a'
          
          if (value >= 80) {
            levelText = '极高'
            levelColor = '#f56c6c'
          } else if (value >= 60) {
            levelText = '高'
            levelColor = '#ff7875'
          } else if (value >= 40) {
            levelText = '中'
            levelColor = '#faad14'
          } else if (value >= 20) {
            levelText = '低'
            levelColor = '#95de64'
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
        
        // 计算综合风险
        const avgRisk = values.reduce((a: number, b: number) => a + b, 0) / values.length
        let overallLevel = '正常'
        let overallColor = '#52c41a'
        
        if (avgRisk >= 70) {
          overallLevel = '高风险'
          overallColor = '#f56c6c'
        } else if (avgRisk >= 50) {
          overallLevel = '中等风险'
          overallColor = '#faad14'
        } else if (avgRisk >= 30) {
          overallLevel = '低风险'
          overallColor = '#95de64'
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
        }
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
            value: Math.round(analysisData.value.riskScore * 100), 
            name: '风险评分', 
            itemStyle: { color: '#f56c6c' } 
          },
          { 
            value: Math.round((1 - analysisData.value.riskScore) * 100), 
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
  if (!analysisData.value) return {}
  
  // 使用视频真实时长，确保时间轴与视频进度精确对齐
  const duration = videoDuration.value
  const timePoints: number[] = []
  for (let t = 0; t <= duration; t += 5) {
    timePoints.push(t)
  }
  
  // 多模态数据（三条独立曲线）
  const multiModalData = timePoints.map(t => {
    // 视频风险
    const videoRisk = mockVideoRisks.value.find(r => Math.abs(r.time - t) < 3)
    const videoScore = videoRisk ? (videoRisk.riskLevel === 'high' ? 90 : 60) : 0
    
    // 音频情绪风险
    const audioEmotion = mockAudioEmotions.value.find(e => t >= e.start && t < e.end)
    const audioScore = audioEmotion ? audioEmotion.intensity * 100 : 0
    
    // 文本风险
    const textSegment = mockTranscriptSegments.value.find(s => t >= s.start && t < s.end)
    const textScore = textSegment ? (textSegment.riskLevel === 'high' ? 100 : textSegment.riskLevel === 'medium' ? 60 : 20) : 0
    
    return {
      time: t,
      videoScore,
      audioScore,
      textScore,
      videoRisk,
      audioEmotion,
      textSegment
    }
  })
  
  // 提取三个模态的独立数据数组（改为二维数组格式 [x, y]）
  const videoData = multiModalData.map(d => [d.time, d.videoScore])
  const audioData = multiModalData.map(d => [d.time, d.audioScore])
  const textData = multiModalData.map(d => [d.time, d.textScore])
  
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
        }
      },
      backgroundColor: 'rgba(255, 255, 255, 0.98)',
      borderColor: 'rgba(209, 217, 230, 0.4)',
      borderWidth: 1,
      padding: 14,
      textStyle: { color: '#181818', fontSize: 12 },
      extraCssText: 'box-shadow: 0 4px 16px rgba(0,0,0,0.08); border-radius: 10px;',
      formatter: (params: any) => {
        if (!params || params.length === 0) return ''
        
        const dataIndex = params[0].dataIndex
        const data = multiModalData[dataIndex]
        if (!data) return ''
        
        const time = data.time
        const m = Math.floor(time / 60)
        const s = Math.floor(time % 60)
        const timeStr = `${m}:${s.toString().padStart(2, '0')}`
        
        // 计算综合风险
        const maxRisk = Math.max(data.videoScore, data.audioScore, data.textScore)
        let riskLevel = '低风险'
        let riskColor = '#52c41a'
        if (maxRisk >= 70) {
          riskLevel = '高风险'
          riskColor = '#f56c6c'
        } else if (maxRisk >= 40) {
          riskLevel = '中风险'
          riskColor = '#faad14'
        }
        
        let html = `
          <div style="min-width: 260px;">
            <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 10px;">
              <i class="fas fa-clock" style="color: #4b70e2;"></i>
              <strong style="font-size: 14px;">时间: ${timeStr}</strong>
            </div>
            <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 12px;">
              <i class="fas fa-chart-bar" style="color: ${riskColor};"></i>
              <span style="font-size: 15px; font-weight: 600; color: ${riskColor};">
                风险指数: ${maxRisk.toFixed(1)}% (${riskLevel})
              </span>
            </div>
            <div style="border-top: 1px solid #e8e8e8; padding-top: 10px; margin-top: 10px;">
        `
        
        // 始终显示三个模态的数据（即使是0%也要显示）
        
        // 1. 视频模态
        const videoColor = data.videoScore >= 70 ? '#f56c6c' : data.videoScore >= 40 ? '#faad14' : data.videoScore > 0 ? '#52c41a' : '#999'
        html += `
          <div style="margin-bottom: 8px;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 3px;">
              <span style="color: #f56c6c; font-weight: 600; font-size: 12px;">📹 视频风险</span>
              <span style="color: ${videoColor}; font-weight: 700; font-size: 13px;">${data.videoScore.toFixed(1)}%</span>
            </div>
            ${data.videoRisk 
              ? `<div style="color: #666; font-size: 11px; line-height: 1.4;">${data.videoRisk.reason}</div>` 
              : `<div style="color: #999; font-size: 11px; line-height: 1.4;">该时段视频画面正常</div>`
            }
          </div>
        `
        
        // 2. 音频模态
        const audioColor = data.audioScore >= 70 ? '#f56c6c' : data.audioScore >= 40 ? '#faad14' : data.audioScore > 0 ? '#52c41a' : '#999'
        html += `
          <div style="margin-bottom: 8px;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 3px;">
              <span style="color: #faad14; font-weight: 600; font-size: 12px;">🎵 音频情绪</span>
              <span style="color: ${audioColor}; font-weight: 700; font-size: 13px;">${data.audioScore.toFixed(1)}%</span>
            </div>
            ${data.audioEmotion 
              ? `<div style="color: #666; font-size: 11px; line-height: 1.4;">${data.audioEmotion.reason}</div>` 
              : `<div style="color: #999; font-size: 11px; line-height: 1.4;">该时段音频情绪稳定</div>`
            }
          </div>
        `
        
        // 3. 文本模态
        const textColor = data.textScore >= 70 ? '#f56c6c' : data.textScore >= 40 ? '#faad14' : data.textScore > 0 ? '#52c41a' : '#999'
        html += `
          <div style="margin-bottom: 6px;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 3px;">
              <span style="color: #4b70e2; font-weight: 600; font-size: 12px;">📝 文本内容</span>
              <span style="color: ${textColor}; font-weight: 700; font-size: 13px;">${data.textScore.toFixed(1)}%</span>
            </div>
            ${data.textSegment 
              ? `<div style="color: #666; font-size: 11px; line-height: 1.4;">${data.textSegment.reason}</div>` 
              : `<div style="color: #999; font-size: 11px; line-height: 1.4;">该时段文本内容正常</div>`
            }
          </div>
        `
        
        html += `
            </div>
            <div style="text-align: center; margin-top: 12px; padding-top: 10px; border-top: 1px solid #e8e8e8;">
              <div style="color: #4b70e2; font-size: 11px; font-weight: 600;">
                💡 点击图表跳转播放此时段
              </div>
            </div>
          </div>
        `
        
        return html
      }
    },
    legend: {
      data: ['视频风险', '音频情绪', '文本风险'],
      bottom: 5, // 减小图例距离底部的距离
      textStyle: { 
        color: '#666', 
        fontSize: 11,
        fontWeight: 'normal'
      },
      itemGap: 24,
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
        snap: false  // 关键！让axisPointer不吸附到数据点，精确跟随鼠标
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
        symbol: 'circle',
        symbolSize: 6,
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
        showSymbol: true,
        showAllSymbol: true,
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
        symbol: 'circle',
        symbolSize: 6,
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
        showSymbol: true,
        showAllSymbol: true,
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
        symbol: 'circle',
        symbolSize: 6,
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
        showSymbol: true,
        showAllSymbol: true,
        emphasis: {
          lineStyle: { width: 2.5 },
          itemStyle: { borderWidth: 3 }
        },
        // 参考1.0版本的参考线样式
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
    const response = await getResultByVideoId(selectedVideoId.value)
    if (response.code === 200 && response.data) {
      analysisData.value = response.data
    } else {
      analysisData.value = null
      emptyMessage.value = '该视频尚未分析或分析未完成'
    }
  } catch (error: any) {
    ElMessage.error(error?.message || '加载分析结果失败')
    analysisData.value = null
  } finally {
    loading.value = false
  }
}

const loadAnalysisById = async (resultId: string) => {
  loading.value = true
  try {
    const response = await getResultById(resultId)
    if (response.code === 200 && response.data) {
      analysisData.value = response.data
      selectedVideoId.value = response.data.videoId
    } else {
      analysisData.value = null
      emptyMessage.value = '分析结果不存在'
    }
  } catch (error: any) {
    ElMessage.error(error?.message || '加载分析结果失败')
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

// 判断是否为高校相关关键词
const isUniversityKeyword = (keyword: string): boolean => {
  const universityRelatedPatterns = [
    /大学|学院|学校/,
    /校园|校区|校徽|校服|学士服/,
    /教学楼|图书馆|实验室|宿舍|食堂/,
    /学生会|社团|选课|期末|考试/,
    /教授|导师|辅导员|班级/,
    /北大|清华|复旦|交大|浙大/
  ]
  return universityRelatedPatterns.some(pattern => pattern.test(keyword))
}

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

// 获取主要受众年龄段
const getPrimaryAudience = (ageDistribution: Record<string, number>): string => {
  if (!ageDistribution) return '未知'
  
  let maxAge = ''
  let maxValue = 0
  
  Object.entries(ageDistribution).forEach(([age, value]) => {
    if (value > maxValue) {
      maxValue = value
      maxAge = age
    }
  })
  
  return maxAge ? `${maxAge}岁` : '未知'
}

// 判断是否为高校场景
const isUniversityScene = (sceneType: string | null | undefined): boolean => {
  if (!sceneType) return false
  const universityScenes = ['教室', '图书馆', '实验室', '报告厅', '宿舍', '食堂', '校园户外']
  return universityScenes.includes(sceneType)
}

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
      const duration = (videoFeatures as any)?.duration || 300
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
    
    ElMessage.success(`跳转到 ${formatTimestamp(clickedTime)}`)
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
      
      ElMessage.success(`跳转到 ${formatTimestamp(clickedTime)}`)
    }
    return
  }
  
  // 报告视图：原有逻辑
  const timelineData = getRiskTimelineData()
  if (!timelineData || !timelineData.timeSeriesData) return
  
  const clickedTime = params.data[0]
  playVideo(clickedTime)
  ElMessage.success(`正在跳转到 ${formatTimestamp(clickedTime)} 播放`)
}

// 视频时间更新事件（优化版：分离竖线更新和状态更新）
const onVideoTimeUpdate = () => {
  if (!mainVideoPlayerRef.value) return
  
  const newTime = mainVideoPlayerRef.value.currentTime
  
  // 实时更新currentPlayTime，用于其他组件的响应式
  currentPlayTime.value = newTime
  
  // 直接更新图表的markLine，不触发computed重新计算
  updateProgressLine(newTime)
  
  // 实时更新当前证据（根据播放时间自动切换）
  const currentTime = newTime
  // 修正：根据时间段判断，只有当前时间在字幕的时间范围内才高亮
  const currentEvidenceByTime = mockRiskEvidence.find(
    e => currentTime >= e.timeSeconds && currentTime < (e.timeEndSeconds || e.timeSeconds + 10)
  )
  
  if (currentEvidenceByTime && currentEvidenceByTime.id !== selectedEvidenceId.value) {
    selectedEvidenceId.value = currentEvidenceByTime.id
  } else if (!currentEvidenceByTime && selectedEvidenceId.value) {
    // 如果当前时间不在任何字幕时间段内，保持之前的选中状态（不取消高亮）
    // selectedEvidenceId.value = '' // 可选：取消高亮
  }
  
  // 更新当前台词段落高亮
  const index = mockTranscriptSegments.value.findIndex(
    seg => currentTime >= seg.start && currentTime < seg.end
  )
  currentSegmentIndex.value = index
  
  // 更新当前检测框
  const detection = mockVideoRisks.value.find(
    risk => Math.abs(currentTime - risk.time) < 3
  )
  currentDetection.value = detection || null
}

// 直接更新进度竖线，不触发图表完全重绘
let progressLineUpdatePending = false
const updateProgressLine = (time: number) => {
  if (!timelineChartRef.value || progressLineUpdatePending) return
  
  progressLineUpdatePending = true
  
  requestAnimationFrame(() => {
    if (!timelineChartRef.value) {
      progressLineUpdatePending = false
      return
    }
    
    const m = Math.floor(time / 60)
    const s = Math.floor(time % 60)
    const timeLabel = `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
    
    // 使用setOption局部更新markLine，notMerge: false保持其他配置不变
    timelineChartRef.value.setOption({
      series: [{
        markLine: {
          symbol: 'none',
          animation: false,
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
      }]
    }, false, false) // notMerge: false, lazyUpdate: false
    
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

// 跳转到指定时间
const jumpToTime = (time: number) => {
  if (mainVideoPlayerRef.value) {
    mainVideoPlayerRef.value.currentTime = time
    mainVideoPlayerRef.value.play().catch(e => console.log('播放失败:', e))
    ElMessage.success(`跳转到 ${formatTimestamp(time)}`)
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
  
  ElMessage.success(`已定位到风险证据：${currentEvidence.value?.time || ''}`)
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

// ==================== 绿圈实时分析栏：计算当前帧风险 ====================
/**
 * 获取当前帧的综合风险分数（动态计算，与雷达图同步）
 */
const getCurrentRiskScore = (): number => {
  // 使用当前时间点的雷达图数据计算综合风险
  const radarData = currentRadarData.value
  const avgRisk = radarData.reduce((a, b) => a + b, 0) / radarData.length
  return Math.round(avgRisk) // 四舍五入到整数
}

/**
 * 获取当前风险等级类名
 */
const getCurrentRiskClass = (): string => {
  const score = getCurrentRiskScore()
  if (score >= 70) return 'high'
  if (score >= 40) return 'medium'
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

// 报告内容区域引用
const reportContentRef = ref<HTMLElement | null>(null)
// 操作按钮区域引用（导出时需要隐藏）
const actionButtonsRef = ref<HTMLElement | null>(null)
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
  
  if (!reportContentRef.value) {
    ElMessage.error('无法获取报告内容')
    return
  }
  
  // 防止重复导出
  if (exportingPdf.value) {
    return
  }
  
  exportingPdf.value = true
  ElMessage.info('正在生成PDF报告，请稍候...')
  
  // 隐藏操作按钮区域和播放视频按钮，确保PDF中不包含这些元素
  const actionButtons = actionButtonsRef.value
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
    
    const element = reportContentRef.value
    
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
  const firstHighRisk = mockRiskEvidence.find(e => e.riskLevel === 'HIGH')
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
    padding: 18px 24px;
    margin-bottom: 16px;
    
    .archive-header {
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
        }
        
        .file-info {
          flex: 1;
          
          .file-main {
            display: flex;
            align-items: center;
            gap: 10px;
            margin-bottom: 8px;
            flex-wrap: wrap;
            
            .file-name {
              font-size: 16px;
              font-weight: 700;
              color: $black;
              font-family: 'Courier New', monospace;
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
        grid-template-columns: repeat(4, 1fr);
        gap: 16px;
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
    overflow: hidden;
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
    
    // CV视觉模态：检测类型图例（左下角，避免遮挡）
    .detection-legend {
      position: absolute;
      bottom: 60px;
      left: 12px;
      z-index: 20;
      background: rgba(0, 0, 0, 0.75);
      backdrop-filter: blur(8px);
      border-radius: 8px;
      padding: 8px 12px;
      border: 1px solid rgba(255, 255, 255, 0.1);
      animation: fadeIn 0.5s ease;
      pointer-events: none;
      
      .legend-title {
        color: rgba(255, 255, 255, 0.6);
        font-size: 11px;
        margin-bottom: 6px;
        text-transform: uppercase;
        letter-spacing: 0.5px;
      }
      
      .legend-items {
        display: flex;
        flex-direction: column;
        gap: 4px;
      }
      
      .legend-item {
        display: flex;
        align-items: center;
        gap: 6px;
      }
      
      .legend-color {
        width: 12px;
        height: 12px;
        border-radius: 2px;
        border: 1px solid rgba(255, 255, 255, 0.3);
      }
      
      .legend-label {
        color: #fff;
        font-size: 12px;
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
          background: #fff;
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
        background: #fff;
        transform: translateX(-4px);
        box-shadow: 4px 4px 10px $neu-2;
      }
      
      &.active {
        background: #fff;
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
            
            &.low { color: #67c23a; }
            &.medium { color: #e6a23c; }
            &.high { color: #f56c6c; }
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
    display: inline-flex;
    align-items: center;
    gap: 4px;
    padding: 4px 10px;
    background: rgba(64, 158, 255, 0.1);
    border-radius: 6px;
    font-size: 12px;
    color: #409EFF;
    margin-left: 12px;
  }

  .video-description {
    margin: 6px 0 10px 0;
  }

  .description-text {
    font-size: 12px;
    color: #909399;
    line-height: 1.5;
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
    background: #ffffff;
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
  /* 1. 大容器：白色底座 */
  .stats-ribbon-container {
    display: flex;
    align-items: center;
    background: #ffffff;
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
    grid-template-columns: repeat(4, 1fr);
    grid-template-rows: repeat(2, 1fr);
    background: transparent;
    padding: 0 10px;
    gap: 16px 0; /* 行间距16px, 列间距0 */
    border: none;
    box-shadow: none;
  }

  /* 单个数据项 */
  .stat-pro-item {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 0 24px; /* 保持原来的内边距 */
    transition: transform 0.2s;
  }

  .stat-pro-item:hover {
    transform: translateY(-2px); /* 微动效 */
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
    font-size: 10px;
    color: #909399;
    font-weight: 400;
    margin-top: 2px;
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
</style>
