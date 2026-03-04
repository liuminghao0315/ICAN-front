<template>
  <div class="help-page">
    <div class="help-container">
      <!-- 页面标题 -->
      <div class="help-header">
        <h1>帮助与文档</h1>
        <p>了解如何使用 SynSight 进行视频内容风险分析</p>
      </div>

      <!-- 快速导航 -->
      <div class="quick-nav">
        <div
          v-for="section in sections"
          :key="section.id"
          class="nav-card"
          @click="scrollToSection(section.id)"
        >
          <div class="nav-icon" v-html="section.icon"></div>
          <div class="nav-info">
            <h3>{{ section.title }}</h3>
            <p>{{ section.desc }}</p>
          </div>
        </div>
      </div>

      <!-- 详细内容 -->
      <div class="help-content">
        <!-- 快速开始 -->
        <section id="getting-started" class="content-section">
          <h2>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/>
            </svg>
            快速开始
          </h2>
          <div class="section-content">
            <div class="step-card">
              <div class="step-number">1</div>
              <div class="step-content">
                <h4>上传视频</h4>
                <p>在"记录中心"点击"新建分析任务"按钮，支持 MP4、AVI、MOV 等常见格式，单个文件最大 500MB。</p>
              </div>
            </div>
            <div class="step-card">
              <div class="step-number">2</div>
              <div class="step-content">
                <h4>分析任务</h4>
                <p>上传完成后，系统将在后台自动提取音频并进行语音识别。</p>
              </div>
            </div>
            <div class="step-card">
              <div class="step-number">3</div>
              <div class="step-content">
                <h4>查看分析结果</h4>
                <p>任务完成后，在"记录中心"点击已分析的视频来查看分析结果，包括风险评分、敏感词检测、情感分析等。</p>
              </div>
            </div>
          </div>
        </section>

        <!-- 功能介绍 -->
        <section id="features" class="content-section">
          <h2>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
              <path d="M9 3v18"/>
            </svg>
            功能介绍
          </h2>
          <div class="section-content">
            <div class="feature-card">
              <div class="feature-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z"/>
                </svg>
              </div>
              <h4>文件夹管理</h4>
              <p>创建文件夹分类管理视频，支持拖拽移动，也可包含子文件夹，让内容井然有序。</p>
            </div>
            <div class="feature-card">
              <div class="feature-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <circle cx="11" cy="11" r="8"/>
                  <path d="M21 21l-4.35-4.35"/>
                </svg>
              </div>
              <h4>筛选、搜索与排序</h4>
              <p>支持按文件名搜索，按处理来源、风险等级筛选，按日期、风险指数排序，快速定位目标视频。</p>
            </div>
            <div class="feature-card">
              <div class="feature-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M12 2L2 7l10 5 10-5-10-5z"/>
                  <path d="M2 17l10 5 10-5"/>
                  <path d="M2 12l10 5 10-5"/>
                </svg>
              </div>
              <h4>风险分析</h4>
              <p>基于 AI 模型进行敏感词检测、情感分析、高校相关性判断，生成风险评分。</p>
            </div>
            <div class="feature-card">
              <div class="feature-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M19 21l-7-5-7 5V5a2 2 0 012-2h10a2 2 0 012 2z"/>
                </svg>
              </div>
              <h4>收藏管理</h4>
              <p>收藏重要的分析结果，方便后续查看和对比。</p>
            </div>
            <div class="feature-card">
              <div class="feature-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/>
                  <path d="M14 2v6h6"/>
                </svg>
              </div>
              <h4>报告导出</h4>
              <p>将分析结果导出为 PDF 文档，方便分享和存档。</p>
            </div>
            <div class="feature-card">
              <div class="feature-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M12 2v20M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6"/>
                </svg>
              </div>
              <h4>风险词库</h4>
              <p>自定义风险词库，添加、编辑、删除敏感词，提升检测准确度。</p>
            </div>
          </div>
        </section>

        <!-- 工作流程 -->
        <section id="workflow" class="content-section">
          <h2>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M21 16V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2h14a2 2 0 002-2z"/>
              <path d="M12 8v8"/>
            </svg>
            工作流程
          </h2>
          <div class="section-content">
            <div class="workflow-diagram">
              <div class="workflow-step">
                <div class="workflow-icon">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/>
                    <polyline points="17 8 12 3 7 8"/>
                    <line x1="12" y1="3" x2="12" y2="15"/>
                  </svg>
                </div>
                <h4>上传视频</h4>
                <p>支持本地视频或流媒体链接</p>
              </div>
              <div class="workflow-arrow">→</div>
              <div class="workflow-step">
                <div class="workflow-icon">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M12 20h9"/>
                    <path d="M16.5 3.5a2.121 2.121 0 013 3L7 19l-4 1 1-4L16.5 3.5z"/>
                  </svg>
                </div>
                <h4>创建任务</h4>
                <p>选择视频并配置风险词库</p>
              </div>
              <div class="workflow-arrow">→</div>
              <div class="workflow-step">
                <div class="workflow-icon">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <circle cx="12" cy="12" r="10"/>
                    <path d="M12 6v6l4 2"/>
                  </svg>
                </div>
                <h4>系统分析</h4>
                <p>AI 自动处理和分析</p>
              </div>
              <div class="workflow-arrow">→</div>
              <div class="workflow-step">
                <div class="workflow-icon">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/>
                    <path d="M14 2v6h6"/>
                  </svg>
                </div>
                <h4>查看结果</h4>
                <p>详细的分析报告</p>
              </div>
            </div>
          </div>
        </section>

        <!-- 常见问题 -->
        <section id="faq" class="content-section">
          <h2>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <circle cx="12" cy="12" r="10"/>
              <path d="M9.09 9a3 3 0 015.83 1c0 2-3 3-3 3"/>
              <line x1="12" y1="17" x2="12.01" y2="17"/>
            </svg>
            常见问题
          </h2>
          <div class="section-content">
            <div class="faq-item">
              <h4>支持哪些视频格式？</h4>
              <p>支持 MP4、AVI、MOV、WMV、FLV、MKV 等常见视频格式，单个文件最大 500MB。</p>
            </div>
            <div class="faq-item">
              <h4>分析一个视频需要多长时间？</h4>
              <p>取决于视频时长和服务器负载，通常 10 分钟的视频需要 2-5 分钟完成分析。</p>
            </div>
            <div class="faq-item">
              <h4>如何提高检测准确度？</h4>
              <p>可以在"风险词库管理"中添加自定义敏感词，并在新建任务时选中该词库，系统会根据您的词库进行更精准的检测。</p>
            </div>
            <div class="faq-item">
              <h4>分析失败怎么办？</h4>
              <p>检查视频格式是否支持、文件是否损坏、网络是否稳定。如问题持续，请联系管理员。</p>
            </div>
            <div class="faq-item">
              <h4>可以批量操作吗？</h4>
              <p>可以。在记录中心点击批量管理按钮，选择多个视频，即可批量管理选中的视频。</p>
            </div>
            <div class="faq-item">
              <h4>如何理解风险评分？</h4>
              <p>风险评分范围 0-100，0-40 为低风险，40-70 为中风险，70-100 为高风险。评分综合考虑敏感词数量、情感倾向、高校相关性等因素。</p>
            </div>
          </div>
        </section>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts" name="Help">
import { ref } from 'vue'

const sections = ref([
  {
    id: 'getting-started',
    title: '快速开始',
    desc: '三步完成首次视频分析',
    icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg>'
  },
  {
    id: 'features',
    title: '功能介绍',
    desc: '了解系统核心功能',
    icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><path d="M9 3v18"/></svg>'
  },
  {
    id: 'workflow',
    title: '工作流程',
    desc: '完整的使用流程说明',
    icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 16V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2h14a2 2 0 002-2z"/><path d="M12 8v8"/></svg>'
  },
  {
    id: 'faq',
    title: '常见问题',
    desc: '快速解答常见疑问',
    icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 015.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>'
  }
])

const scrollToSection = (id: string) => {
  const element = document.getElementById(id)
  if (element) {
    element.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }
}
</script>

<style scoped>
.help-page {
  min-height: 100vh;
  background: var(--bg-page);
  padding: 32px 24px;
}

.help-container {
  max-width: 1200px;
  margin: 0 auto;
}

/* 页面标题 */
.help-header {
  text-align: center;
  margin-bottom: 48px;
}

.help-header h1 {
  font-size: 32px;
  font-weight: 700;
  color: var(--text-primary);
  margin-bottom: 12px;
  letter-spacing: -0.02em;
}

.help-header p {
  font-size: 16px;
  color: var(--text-secondary);
}

/* 快速导航 */
.quick-nav {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 16px;
  margin-bottom: 48px;
}

.nav-card {
  background: var(--bg-card);
  border: 1px solid var(--border-color);
  border-radius: 12px;
  padding: 20px;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  gap: 16px;
  align-items: flex-start;
}

.nav-card:hover {
  border-color: var(--color-primary);
  transform: translateY(-2px);
}

.nav-icon {
  width: 40px;
  height: 40px;
  border-radius: 8px;
  background: var(--bg-icon);
  color: var(--color-primary);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.nav-icon svg {
  width: 20px;
  height: 20px;
}

.nav-info {
  flex: 1;
}

.nav-info h3 {
  font-size: 15px;
  font-weight: 600;
  color: var(--text-primary);
  margin-bottom: 4px;
}

.nav-info p {
  font-size: 13px;
  color: var(--text-secondary);
  line-height: 1.5;
}

/* 内容区域 */
.help-content {
  display: flex;
  flex-direction: column;
  gap: 32px;
}

.content-section {
  background: var(--bg-card);
  border: 1px solid var(--border-color);
  border-radius: 12px;
  padding: 32px;
  scroll-margin-top: 24px;
}

.content-section h2 {
  font-size: 24px;
  font-weight: 700;
  color: var(--text-primary);
  margin-bottom: 24px;
  display: flex;
  align-items: center;
  gap: 12px;
}

.content-section h2 svg {
  width: 24px;
  height: 24px;
  color: var(--color-primary);
}

.section-content {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

/* 步骤卡片 */
.step-card {
  display: flex;
  gap: 20px;
  align-items: flex-start;
  padding: 20px;
  background: var(--bg-page);
  border-radius: 10px;
}

.step-number {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: var(--color-primary);
  color: #ffffff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 18px;
  font-weight: 700;
  flex-shrink: 0;
}

.step-content h4 {
  font-size: 16px;
  font-weight: 600;
  color: var(--text-primary);
  margin-bottom: 8px;
}

.step-content p {
  font-size: 14px;
  color: var(--text-secondary);
  line-height: 1.6;
}

/* 功能卡片 */
.feature-card {
  padding: 20px;
  background: var(--bg-page);
  border-radius: 10px;
  display: flex;
  gap: 16px;
  align-items: center;
}

.feature-icon {
  width: 48px;
  height: 48px;
  border-radius: 8px;
  background: var(--bg-icon);
  color: var(--color-primary);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.feature-icon svg {
  width: 24px;
  height: 24px;
}

.feature-card h4 {
  font-size: 16px;
  font-weight: 600;
  color: var(--text-primary);
  margin-bottom: 8px;
}

.feature-card p {
  font-size: 14px;
  color: var(--text-secondary);
  line-height: 1.6;
}

/* 工作流程图 */
.workflow-diagram {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 20px;
  background: var(--bg-page);
  border-radius: 10px;
  overflow-x: auto;
}

.workflow-step {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  min-width: 120px;
}

.workflow-icon {
  width: 56px;
  height: 56px;
  border-radius: 50%;
  background: var(--bg-card);
  border: 2px solid var(--color-primary);
  color: var(--color-primary);
  display: flex;
  align-items: center;
  justify-content: center;
}

.workflow-icon svg {
  width: 28px;
  height: 28px;
}

.workflow-step h4 {
  font-size: 15px;
  font-weight: 600;
  color: var(--text-primary);
  text-align: center;
}

.workflow-step p {
  font-size: 13px;
  color: var(--text-secondary);
  text-align: center;
}

.workflow-arrow {
  font-size: 24px;
  color: var(--text-tertiary);
  flex-shrink: 0;
}

/* FAQ */
.faq-item {
  padding: 20px;
  background: var(--bg-page);
  border-radius: 10px;
}

.faq-item h4 {
  font-size: 16px;
  font-weight: 600;
  color: var(--text-primary);
  margin-bottom: 8px;
}

.faq-item p {
  font-size: 14px;
  color: var(--text-secondary);
  line-height: 1.6;
}

/* 响应式 */
@media (max-width: 768px) {
  .help-page {
    padding: 24px 16px;
  }

  .help-header h1 {
    font-size: 28px;
  }

  .quick-nav {
    grid-template-columns: 1fr;
  }

  .content-section {
    padding: 24px 20px;
  }

  .content-section h2 {
    font-size: 20px;
  }

  .workflow-diagram {
    flex-direction: column;
  }

  .workflow-arrow {
    transform: rotate(90deg);
  }
}
</style>
