<template>
  <div class="home-page">
    <!-- 顶部导航：即梦式固定导航 + 玻璃拟态 -->
    <nav class="top-nav" :style="navStyleVars">
      <div class="nav-inner">
        <div class="brand" @click="goTop">
          <img src="/logo.jpg" alt="SynSight" />
          <span>SynSight</span>
        </div>
        <div class="nav-links">
          <button @click="scrollTo('multimodal')">多模态分析</button>
          <button @click="scrollTo('canvas')">智能画布</button>
          <button @click="scrollTo('cases')">任务预览</button>
          <button @click="scrollTo('functions')">功能入口</button>
        </div>
        <div class="nav-actions">
          <button class="btn-solid" @click="goWorkbench">进入系统</button>
        </div>
      </div>
    </nav>

    <!-- Hero：即梦式首屏大标题 + 轮播背景（TransitionGroup 驱动交叉淡入淡出） -->
    <section class="hero">
      <div class="hero-bg-wrap">
        <TransitionGroup name="hero-fade" tag="div" class="hero-bg-list">
          <div
            :key="activeBgIndex"
            class="hero-bg"
          >
            <img
              :src="heroBackgrounds[activeBgIndex]"
              :alt="`背景${activeBgIndex + 1}`"
            />
            <div class="hero-mask" />
          </div>
        </TransitionGroup>
      </div>
      <div class="hero-content">
        <h1>高校内容风险研判</h1>
        <p class="hero-accent">一帧一音一文，精准研判</p>
        <p class="hero-desc">
          本地上传视频，自动完成视频关键帧、语音转写与文本语义分析，输出高校身份线索、态度判断与风险建议，支持复核与证据定位。
        </p>
      </div>
      <div class="hero-cta-bar">
        <button class="btn-solid btn-hero" @click="goWorkbench">立即分析</button>
        <button class="btn-ghost btn-hero" @click="scrollTo('multimodal')">了解能力</button>
      </div>
      <div class="hero-dots">
        <button
          v-for="(_, idx) in heroBackgrounds"
          :key="idx"
          :class="{ active: idx === activeBgIndex }"
          :aria-label="`切换到背景${idx + 1}`"
          @click="activeBgIndex = idx"
        />
      </div>
    </section>

    <!-- 分区1：多模态内容风险识别（即梦式「灵感成片」结构） -->
    <section id="multimodal" class="section section-multimodal">
      <div class="container">
        <div class="multimodal-head-row">
          <div class="multimodal-tag-wrap">
            <span class="section-tag">支持视频 / 音频 / 文本联合研判</span>
          </div>
          <div class="section-head">
            <h2>多模态内容风险识别</h2>
            <p>针对单条视频抽取关键线索，围绕高校相关表达、情绪倾向与风险等级形成结构化结果。</p>
          </div>
        </div>
        <div class="feature-rows">
          <article v-for="(item, idx) in multimodalFeatures" :key="item.index" class="feature-row">
            <div class="feature-left">
              <h3>{{ item.title }}</h3>
              <p>{{ item.desc }}</p>
              <button class="btn-outline" @click="goWorkbench">进入研判</button>
            </div>

            <div class="feature-divider">
              <span class="feature-index">{{ item.index }}</span>
            </div>

            <div class="feature-right">
              <div
                class="feature-media"
                :style="getMediaStyle(idx)"
                :ref="(el) => setFeatureMediaRef(el, idx)"
              >
                <div class="feature-media-inner">
                  <img :src="item.image" :alt="item.title" />
                </div>
              </div>
            </div>
          </article>
        </div>
      </div>
    </section>

    <!-- 分区2：智能画布 · 证据协同（即梦式「智能画布」区块） -->
    <section id="canvas" class="section section-canvas">
      <div class="container narrow">
        <div class="section-head center">
          <h2>智能画布 · 证据协同</h2>
          <p>将时间轴证据、语音转写、风险点与处置建议放在同一视图，便于高校管理场景复核与汇报。</p>
        </div>
        <div class="canvas-preview">
          <div class="canvas-tabs">
            <button
              v-for="tab in canvasTabs"
              :key="tab.key"
              type="button"
              :class="['canvas-tab', { active: activeCanvasTabKey === tab.key }]"
              @click="activeCanvasTabKey = tab.key"
            >
              {{ tab.label }}
            </button>
          </div>
          <div class="canvas-frame">
            <img :src="activeCanvasTab.image" :alt="activeCanvasTab.alt" />
          </div>
          <p class="canvas-note">{{ activeCanvasTab.note }}</p>
          <button class="btn-outline" @click="goWorkbench">进入画布</button>
        </div>
      </div>
    </section>

    <!-- 分区3：任务与案例（即梦式「创意社区」卡片流） -->
    <section id="cases" class="section section-cases">
      <div class="container narrow">
        <div class="section-head center">
          <h2>任务预览 · 页面示意</h2>
          <p>这里展示系统核心页面示意（任务列表、结果查看、证据画布），帮助你快速了解实际使用流程。</p>
          <button class="btn-outline" @click="goRecords">进入任务中心</button>
        </div>
        <div class="cases-grid">
          <article v-for="(card, idx) in caseCards" :key="`case-${idx}`" class="case-card">
            <div class="case-img-wrap">
              <img :src="card.img" :alt="`界面示意${idx + 1}`" />
            </div>
            <div class="case-meta">
              <span>界面示意 {{ idx + 1 }}</span>
            </div>
          </article>
        </div>
      </div>
    </section>

    <!-- 分区4：功能入口（即梦式入口矩阵） -->
    <section id="functions" class="section section-functions">
      <div class="container narrow">
        <div class="section-head center">
          <h2>功能入口</h2>
          <p>工作台、记录中心、分析结果、收藏与词库等，一键直达。</p>
        </div>
        <div class="func-grid">
          <button
            v-for="item in functionCards"
            :key="item.title"
            class="func-card"
            @click="item.action"
          >
            <div class="func-icon">{{ item.badge }}</div>
            <div class="func-body">
              <h4>{{ item.title }}</h4>
              <p>{{ item.desc }}</p>
            </div>
          </button>
        </div>
      </div>
    </section>

    <!-- 底部 CTA（即梦式「开启即梦」） -->
    <footer class="bottom-cta">
      <div class="cta-inner">
        <img src="/logo.jpg" alt="SynSight" class="cta-logo" />
        <h3>SynSight · 高校内容风险分析平台</h3>
        <p class="cta-sub">基于多模态深度学习的本地视频上传分析系统，专为高校内容创作者行为与舆情研判设计。</p>
        <div class="cta-buttons">
          <button class="btn-solid btn-large" @click="goWorkbench">开启智能分析</button>
          <button class="btn-ghost btn-large" @click="goHelp">查看帮助</button>
        </div>
      </div>
    </footer>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref, type CSSProperties, type ComponentPublicInstance } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '@/stores/user'

const router = useRouter()
const userStore = useUserStore()

const shots = ['/landing/1.png', '/landing/2.png', '/landing/3.png', '/landing/4.png', '/landing/5.png']
const heroBackgrounds = computed(() => [shots[0], shots[4], shots[3]])
const activeBgIndex = ref(0)
const navGlassProgress = ref(0)

const NAV_GLASS_APPEAR_START = 36
const NAV_GLASS_APPEAR_END = 170

const updateNavGlassProgress = () => {
  const scrollY = window.scrollY || document.documentElement.scrollTop || 0
  const raw = clamp((scrollY - NAV_GLASS_APPEAR_START) / (NAV_GLASS_APPEAR_END - NAV_GLASS_APPEAR_START), 0, 1)
  const smooth = raw * raw * (3 - 2 * raw)
  navGlassProgress.value = smooth
}

const navStyleVars = computed(
  () =>
    ({
      '--nav-glass-opacity': navGlassProgress.value.toFixed(3),
      '--nav-blur': `${(navGlassProgress.value * 22).toFixed(2)}px`,
      '--nav-saturate': `${(100 + navGlassProgress.value * 45).toFixed(1)}%`
    }) as CSSProperties
)

const canvasTabs = [
  {
    key: 'overview',
    label: '多维线索总览',
    image: shots[0],
    alt: '多维线索总览视图',
    note: '支持查看风险词命中、情绪变化、关键帧证据与融合评分，减少人工逐段排查成本。'
  },
  {
    key: 'timeline',
    label: '证据时间定位',
    image: shots[4],
    alt: '证据时间定位视图',
    note: '按时间轴快速跳转至风险片段，联动语音转写与关键帧证据，便于复核与取证。'
  }
] as const

const activeCanvasTabKey = ref<(typeof canvasTabs)[number]['key']>('overview')
const activeCanvasTab = computed(
  () => canvasTabs.find((tab) => tab.key === activeCanvasTabKey.value) ?? canvasTabs[0]
)

const multimodalFeatures = [
  {
    index: '01',
    title: '高校身份线索识别',
    desc: '识别视频中“在校学生”相关声明及高校名称、校徽、校园场景等线索，并给出置信度。',
    image: shots[1]
  },
  {
    index: '02',
    title: '态度与风险分级评估',
    desc: '结合语音转写与文本语义判断对学校态度，输出低/中/高风险等级与风险分数。',
    image: shots[2]
  },
  {
    index: '03',
    title: '证据定位与处置建议',
    desc: '按时间点回放高风险片段，查看证据说明、关键词与融合结果，辅助人工复核与处置。',
    image: shots[0]
  }
]

const featureMediaEls = ref<HTMLElement[]>([])
const createDefaultMediaVars = (): Record<string, string> => ({
  '--mm-lift': '0px',
  '--mm-rotate-x': '0deg',
  '--mm-rotate-z': '0deg',
  '--mm-inner-scale': '1',
  '--mm-shadow-alpha': '0.24',
  '--mm-pop': '0'
})
const mediaStyleVars = ref<Record<string, string>[]>(
  multimodalFeatures.map(() => createDefaultMediaVars())
)

const setFeatureMediaRef = (el: Element | ComponentPublicInstance | null, idx: number) => {
  if (el instanceof HTMLElement) {
    featureMediaEls.value[idx] = el
    return
  }

  if (el && '$el' in el) {
    const domEl = el.$el
    if (domEl instanceof HTMLElement) {
      featureMediaEls.value[idx] = domEl
    }
  }
}

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value))

const updateFeatureMediaEffect = () => {
  const viewportHeight = window.innerHeight
  mediaStyleVars.value = multimodalFeatures.map((_, idx) => {
    const el = featureMediaEls.value[idx]
    if (!el) return createDefaultMediaVars()

    const rect = el.getBoundingClientRect()

    // 只在“图片从视口下方向上进入”的阶段变形一次：
    // 当底边还在视口外（下方）时有形变；底边进入视口后立即回归平整。
    // 这样图片继续上滚到视口上侧时不会再次变形。
    // 触发范围整体上移：即使图片下边缘刚好完全出现，仍保留一段形变，
    // 继续下滚一小段距离后才恢复平整。
    const relaxOffset = Math.min(viewportHeight * 0.16, 140)
    const overflowBottom = Math.max(rect.bottom - (viewportHeight - relaxOffset), 0)
    const warpLevel = clamp(overflowBottom / (viewportHeight * 0.5), 0, 1)

    // 即梦式“调皮跳动”：先轻微延迟出现，再在短距离内迅速上跳
    const jumpTriggerY = viewportHeight * 0.99
    const jumpDelta = jumpTriggerY - rect.top
    const holdWindow = 34
    const jumpWindow = 78

    // 到触发点时先“压住”一点，不立刻上来
    const holdDown = jumpDelta <= 0
      ? 0
      : jumpDelta < holdWindow
        ? (1 - jumpDelta / holdWindow) * 18
        : 0

    // 更顺滑的“跳起”曲线：smootherstep，减少瞬移感
    const jumpProgress = clamp((jumpDelta - holdWindow) / jumpWindow, 0, 1)
    const jumpEase = jumpProgress * jumpProgress * jumpProgress * (jumpProgress * (jumpProgress * 6 - 15) + 10)
    const jumpUp = jumpEase * 74

    const finalLift = -warpLevel * 44 + holdDown - jumpUp

    return {
      '--mm-lift': `${finalLift.toFixed(2)}px`,
      '--mm-rotate-x': `${(warpLevel * 24).toFixed(2)}deg`,
      '--mm-rotate-z': '0deg',
      '--mm-inner-scale': '1',
      '--mm-shadow-alpha': (0.24 + warpLevel * 0.3).toFixed(3),
      '--mm-pop': (warpLevel * 1.55).toFixed(3)
    }
  })
}

const getMediaStyle = (idx: number): CSSProperties =>
  (mediaStyleVars.value[idx] ?? createDefaultMediaVars()) as CSSProperties

let mediaRaf = 0
const scheduleMediaEffectUpdate = () => {
  if (mediaRaf) return
  mediaRaf = window.requestAnimationFrame(() => {
    mediaRaf = 0
    updateFeatureMediaEffect()
    updateNavGlassProgress()
  })
}

const caseCards = computed(() =>
  [...shots, shots[1], shots[2]].map((img, i) => ({ img, id: i }))
)

const isAdmin = computed(() => userStore.isAdmin)

const functionCards = computed(() => {
  const list = [
    { badge: '01', title: '工作台', desc: '多模态分析主控台', action: () => router.push('/dashboard') },
    { badge: '02', title: '记录中心', desc: '历史任务全览', action: () => router.push('/records') },
    { badge: '03', title: '分析结果', desc: '风险报告查阅', action: () => router.push('/analysis') },
    { badge: '04', title: '我的收藏', desc: '关注内容快速访问', action: () => router.push('/favorites') },
    { badge: '05', title: '风险词库', desc: '高校别称与敏感词维护', action: () => router.push('/risk-dictionary') },
    { badge: '06', title: '帮助文档', desc: '使用指南与 API', action: () => router.push('/help') },
    { badge: '07', title: '系统设置', desc: '偏好与权限配置', action: () => router.push('/settings') }
  ]
  if (isAdmin.value) {
    list.push({
      badge: '08',
      title: '反馈管理',
      desc: '用户反馈处理（管理员）',
      action: () => router.push('/admin/feedback')
    })
  }
  return list
})

let timer: ReturnType<typeof setInterval> | null = null
onMounted(() => {
  timer = setInterval(() => {
    activeBgIndex.value = (activeBgIndex.value + 1) % heroBackgrounds.value.length
  }, 4000)

  window.addEventListener('scroll', scheduleMediaEffectUpdate, { passive: true })
  window.addEventListener('resize', scheduleMediaEffectUpdate)
  scheduleMediaEffectUpdate()
})
onUnmounted(() => {
  if (timer) clearInterval(timer)
  window.removeEventListener('scroll', scheduleMediaEffectUpdate)
  window.removeEventListener('resize', scheduleMediaEffectUpdate)
  if (mediaRaf) {
    window.cancelAnimationFrame(mediaRaf)
    mediaRaf = 0
  }
})

const goTop = () => window.scrollTo({ top: 0, behavior: 'smooth' })
const scrollTo = (id: string) => document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' })
const goWorkbench = () => router.push('/dashboard')
const goRecords = () => router.push('/records')
const goHelp = () => router.push('/help')
</script>

<style scoped lang="scss">
/* ========== 设计变量：玻璃拟态 + SynSight 青蓝 ========== */
:root.home-vars {
  --glass-bg: rgba(255, 255, 255, 0.06);
  --glass-border: rgba(255, 255, 255, 0.12);
  --glass-blur: 16px;
  --accent-from: #34f4ff;
  --accent-to: #1ec3ff;
  --accent-glow: rgba(23, 210, 255, 0.4);
  --ease: cubic-bezier(0.25, 0.8, 0.25, 1);
}

.home-page {
  min-height: 100vh;
  color: #fff;
  background: #05080f;
  font-family: system-ui, -apple-system, 'Segoe UI', 'PingFang SC', 'Microsoft YaHei', sans-serif;
}

/* 自定义滚动条（与玻璃拟态一致） */
.home-page {
  scrollbar-width: thin;
  scrollbar-color: rgba(255, 255, 255, 0.25) transparent;
}
.home-page::-webkit-scrollbar {
  width: 8px;
  height: 8px;
}
.home-page::-webkit-scrollbar-track {
  background: transparent;
}
.home-page::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.2);
  border-radius: 999px;
}
.home-page::-webkit-scrollbar-thumb:hover {
  background: rgba(255, 255, 255, 0.35);
}

/* 强制所有正文与标题在深色底上为浅色，避免被全局样式覆盖 */
.home-page h1,
.home-page h2,
.home-page h3,
.home-page h4 {
  color: #ffffff;
}
.home-page p,
.home-page span {
  color: inherit;
}
.home-page .section-head p { color: rgba(255, 255, 255, 0.88); }
.home-page .feature-left p { color: rgba(255, 255, 255, 0.88); }
.home-page .func-body p { color: rgba(255, 255, 255, 0.75); }
.home-page .cta-sub { color: rgba(255, 255, 255, 0.78); }
.home-page .case-meta { color: rgba(255, 255, 255, 0.85); }
.home-page .canvas-note { color: rgba(255, 255, 255, 0.85); }
.home-page .section-tag { color: rgba(255, 255, 255, 0.85); }
.home-page .canvas-tabs span { color: rgba(255, 255, 255, 0.75); }
.home-page .canvas-tabs span.active { color: #34f4ff; }
.home-page .feature-index { color: rgba(255, 255, 255, 0.4); }
.home-page .hero-desc { color: rgba(255, 255, 255, 0.9); }
.home-page .func-icon { color: #34f4ff; }
.home-page .func-body h4 { color: #ffffff; }
.home-page .cta-inner h3 { color: #ffffff; }

.container {
  max-width: 1280px;
  margin: 0 auto;
  padding: 0 32px;

  &.narrow {
    max-width: 1120px;
  }
}

/* ========== 顶部导航 ========== */
.top-nav {
  position: fixed;
  inset: 0 0 auto;
  z-index: 60;
  height: 64px;
  background: linear-gradient(
    180deg,
    rgba(7, 12, 22, calc(var(--nav-glass-opacity, 0) * 0.58)) 0%,
    rgba(7, 12, 22, calc(var(--nav-glass-opacity, 0) * 0.42)) 100%
  );
  backdrop-filter: saturate(var(--nav-saturate, 100%)) blur(var(--nav-blur, 0px));
  -webkit-backdrop-filter: saturate(var(--nav-saturate, 100%)) blur(var(--nav-blur, 0px));
  border-bottom: 1px solid rgba(255, 255, 255, calc(var(--nav-glass-opacity, 0) * 0.12));
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, calc(var(--nav-glass-opacity, 0) * 0.06)),
    0 10px 30px rgba(0, 0, 0, calc(var(--nav-glass-opacity, 0) * 0.25));
  transition:
    background 0.36s var(--ease),
    border-color 0.36s var(--ease),
    box-shadow 0.36s var(--ease),
    backdrop-filter 0.36s var(--ease),
    -webkit-backdrop-filter 0.36s var(--ease);

  .nav-inner {
    height: 100%;
    width: 100%;
    padding: 0 clamp(12px, 1.8vw, 26px);
    display: grid;
    grid-template-columns: minmax(0, 1fr) auto minmax(0, 1fr);
    column-gap: 20px;
    align-items: center;
  }
}

.brand {
  justify-self: start;
  display: flex;
  align-items: center;
  gap: 10px;
  cursor: pointer;
  transition: transform 0.3s var(--ease);

  &:hover {
    transform: scale(1.02);
  }

  img {
    width: 32px;
    height: 32px;
    border-radius: 8px;
    object-fit: cover;
  }

  span {
    font-size: 20px;
    font-weight: 600;
    color: rgba(255, 255, 255, 0.9);
    text-shadow: 0 0 10px rgba(52, 244, 255, 0.2);
  }
}

.nav-links {
  justify-self: center;
  display: flex;
  align-items: center;
  gap: 4px;

  button {
    border: none;
    background: transparent;
    color: rgba(232, 241, 255, 0.68);
    font-size: 14px;
    font-weight: 400;
    letter-spacing: 0.01em;
    padding: 8px 14px;
    border-radius: 10px;
    transition: all 0.3s var(--ease);
    cursor: pointer;

    &:hover {
      color: rgba(242, 247, 255, 0.92);
      background: rgba(255, 255, 255, 0.07);
      transform: translateY(-1px);
    }
  }
}

.nav-actions {
  justify-self: end;
  display: flex;
  align-items: center;
}

.btn-solid,
.btn-ghost {
  border-radius: 12px;
  font-size: 14px;
  font-weight: 600;
  white-space: nowrap;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1);

  &:focus-visible {
    outline: 2px solid var(--accent-to);
    outline-offset: 2px;
  }
}

.btn-solid {
  border: none;
  color: #051a28;
  background: linear-gradient(90deg, #34f4ff, #1ec3ff);
  background-color: #17a2b8;

  &:hover {
    transform: scale(1.02);
    box-shadow: 0 8px 24px var(--accent-glow);
  }

  &:active {
    transform: scale(0.98);
  }
}

.btn-ghost {
  border: 1px solid rgba(255, 255, 255, 0.25);
  color: #ffffff;
  background: rgba(255, 255, 255, 0.06);

  &:hover {
    border-color: rgba(255, 255, 255, 0.45);
    background: rgba(255, 255, 255, 0.1);
    color: #ffffff;
    transform: translateY(-2px);
  }
}

.top-nav .btn-solid,
.top-nav .btn-ghost {
  height: 36px;
  padding: 0 18px;
  border-radius: 10px;
  font-size: 14px;
  font-weight: 500;
}

.top-nav .btn-solid {
  background: linear-gradient(90deg, #2adcf2, #21bfe3);
  box-shadow: 0 6px 16px rgba(25, 191, 227, 0.26);
}

.top-nav .btn-solid:hover {
  transform: translateY(-1px);
  box-shadow: 0 8px 20px rgba(25, 191, 227, 0.32);
}

/* ========== Hero ========== */
.hero {
  position: relative;
  height: 100vh;
  min-height: 680px;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: space-between;
}

/* 轮播层：绝对定位铺满，用 TransitionGroup 做交叉淡入淡出 */
.hero-bg-wrap {
  position: absolute;
  inset: 0;
  z-index: 0;
}

.hero-bg-list {
  position: absolute;
  inset: 0;
}

.hero-bg {
  position: absolute;
  inset: 0;
}

.hero-bg img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

/* Vue TransitionGroup：进入/离开均为 opacity 过渡，使用明确缓动避免 var(--ease) 未定义 */
.hero-fade-enter-from,
.hero-fade-leave-to {
  opacity: 0;
}

.hero-fade-enter-active,
.hero-fade-leave-active {
  transition: opacity 1.2s cubic-bezier(0.25, 0.8, 0.25, 1);
}

.hero-fade-leave-active {
  position: absolute;
  inset: 0;
  pointer-events: none;
}

/* 即梦式：更轻的遮罩，让背景图透出、更有层次 */
.hero-mask {
  position: absolute;
  inset: 0;
  background: linear-gradient(
    180deg,
    rgba(5, 8, 15, 0.25) 0%,
    rgba(5, 8, 15, 0.45) 40%,
    rgba(5, 8, 15, 0.78) 100%
  );
}

.hero-content {
  position: relative;
  z-index: 2;
  width: 100%;
  max-width: 820px;
  margin: 0 auto;
  padding: 0 32px;
  padding-top: 128px;
  text-align: center;
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}

.hero-content h1 {
  margin: 0 0 16px;
  font-size: clamp(42px, 5.2vw, 72px);
  font-weight: 800;
  line-height: 1.1;
  letter-spacing: -0.03em;
  color: #ffffff;
  text-shadow:
    0 2px 20px rgba(0, 0, 0, 0.35),
    0 0 60px rgba(52, 244, 255, 0.08);
}

.hero-accent {
  margin: 0 0 24px;
  font-size: clamp(20px, 2.2vw, 28px);
  font-weight: 600;
  letter-spacing: 0.02em;
  color: #b8f0ff;
  background: linear-gradient(90deg, #dffbff, #7de7ff);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  text-shadow: none;
}

.hero-desc {
  margin: 0 auto 0;
  font-size: 15px;
  line-height: 1.8;
  color: rgba(255, 255, 255, 0.88);
  max-width: 560px;
}

/* 即梦式底部 CTA 条：固定在首屏底部，仅按钮无外框 */
.hero-cta-bar {
  position: relative;
  z-index: 3;
  width: 100%;
  padding: 28px 32px 48px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 16px;
  flex-wrap: wrap;
  margin-top: auto;
}

.btn-hero {
  min-width: 160px;
  height: 52px;
  font-size: 16px;
  border-radius: 14px;
}

.hero-dots {
  position: absolute;
  right: 28px;
  top: 50%;
  transform: translateY(-50%);
  z-index: 3;
  display: flex;
  flex-direction: column;
  gap: 12px;

  button {
    width: 10px;
    height: 10px;
    border-radius: 50%;
    border: 2px solid rgba(255, 255, 255, 0.35);
    background: transparent;
    cursor: pointer;
    transition: all 0.3s var(--ease);
    padding: 0;

    &.active {
      background: linear-gradient(135deg, var(--accent-from), var(--accent-to));
      border-color: transparent;
      box-shadow: 0 0 12px var(--accent-glow);
    }

    &:hover:not(.active) {
      border-color: rgba(255, 255, 255, 0.6);
    }
  }
}

/* ========== 通用 section ========== */
.section {
  padding: 120px 0;
}

.section-head {
  max-width: 720px;
  margin-bottom: 56px;

  .section-tag {
    display: inline-block;
    font-size: 12px;
    letter-spacing: 0.08em;
    color: rgba(255, 255, 255, 0.85);
    margin-bottom: 12px;
  }

  h2 {
    margin: 0 0 16px;
    font-size: clamp(32px, 4vw, 48px);
    font-weight: 700;
    line-height: 1.2;
    color: #ffffff;
  }

  p {
    margin: 0;
    font-size: 16px;
    line-height: 1.75;
    color: rgba(255, 255, 255, 0.88);
  }

  &.center {
    text-align: center;
    margin-left: auto;
    margin-right: auto;
  }
}

/* ========== 多模态分区 ========== */
.section-multimodal {
  background: linear-gradient(180deg, #05080f 0%, #071a3a 25%, #0d2d5c 55%, #061b48 85%, #05080f 100%);
  position: relative;

  .container {
    position: relative;

    &::before {
      content: '';
      position: absolute;
      top: -40px;
      bottom: 0;
      left: 490px;
      width: 1px;
      background: linear-gradient(
        180deg,
        rgba(255, 255, 255, 0.32) 0%,
        rgba(255, 255, 255, 0.18) 45%,
        rgba(255, 255, 255, 0.08) 100%
      );
      pointer-events: none;
    }
  }
}

.multimodal-head-row {
  position: relative;
  z-index: 1;
  display: grid;
  grid-template-columns: 380px 86px 1fr;
  align-items: start;
  transform: translateY(-45px);
  margin-bottom: 46px;

  .section-head {
    grid-column: 3;
    max-width: none;
    width: auto;
    margin: 0;
    margin-left: 32px;
  }
}

.multimodal-tag-wrap {
  grid-column: 1;

  .section-tag {
    display: inline-block;
    margin: 13px 0 0;
    font-size: 12px;
    letter-spacing: 0.08em;
    color: rgba(255, 255, 255, 0.85);
  }
}

.feature-rows {
  position: relative;
  z-index: 1;
  display: flex;
  flex-direction: column;
  gap: 64px;
}

.feature-row {
  display: grid;
  grid-template-columns: 380px 86px 1fr;
  gap: 22px;
  align-items: center;
}

.feature-left {
  margin-top: -280px;

  h3 {
    margin: 0 0 12px;
    font-size: 36px;
    font-weight: 400;
    line-height: 1.1;
    color: #ffffff;
  }

  p {
    margin: 0 0 24px;
    font-size: 15px;
    line-height: 1.75;
    color: rgba(255, 255, 255, 0.88);
  }
}

.feature-divider {
  position: relative;
  height: 100%;
  min-height: 420px;
  display: flex;
  align-items: center;
  justify-content: center;

  .feature-index {
    position: relative;
    z-index: 1;
    font-size: 37px;
    font-weight: 300;
    line-height: 1;
    transform: translate(-28px, -208px);
    color: rgba(230, 247, 255, 0.75);
    letter-spacing: 0.02em;
    text-shadow: 0 0 18px rgba(80, 194, 255, 0.25);
  }
}

.feature-right {
  min-width: 0;
  margin-top: 100px;
}

.btn-outline {
  min-width: 160px;
  height: 46px;
  border-radius: 12px;
  border: 1px solid rgba(255, 255, 255, 0.35);
  background: rgba(255, 255, 255, 0.06);
  color: #ffffff;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s var(--ease);

  &:hover {
    border-color: rgba(52, 244, 255, 0.6);
    background: rgba(52, 244, 255, 0.1);
    color: #ffffff;
    transform: translateY(-2px);
    box-shadow: 0 8px 24px rgba(23, 210, 255, 0.2);
  }
}

.feature-media {
  --mm-lift: 0px;
  --mm-rotate-x: 0deg;
  --mm-rotate-z: 0deg;
  --mm-inner-scale: 1;
  --mm-shadow-alpha: 0.24;
  --mm-pop: 0;
  overflow: visible;
  transform: perspective(1400px) translateY(var(--mm-lift)) rotateX(var(--mm-rotate-x)) rotateZ(var(--mm-rotate-z));
  transform-origin: center 70%;
  transition: transform 0.22s var(--ease);
  will-change: transform;

  .feature-media-inner {
    width: calc(100% + (var(--mm-pop) * 180px));
    margin-left: calc(var(--mm-pop) * -90px);
    aspect-ratio: 5 / 3;
    position: relative;
    border-radius: 18px;
    overflow: hidden;
    border: 1px solid rgba(255, 255, 255, 0.15);
    box-shadow: 0 24px 64px rgba(0, 0, 0, var(--mm-shadow-alpha));
    transition: width 0.22s var(--ease), margin-left 0.22s var(--ease), box-shadow 0.22s var(--ease);
    will-change: width, margin-left;
  }

  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    display: block;
    transform: scale(var(--mm-inner-scale));
    transition: transform 0.22s var(--ease);
    will-change: transform;
  }

  .feature-row:hover & {
    .feature-media-inner {
      box-shadow: 0 30px 72px rgba(0, 0, 0, 0.52);
    }
  }
}

/* ========== 智能画布分区 ========== */
.section-canvas {
  background: linear-gradient(180deg, #05080f 0%, #080c18 50%, #05080f 100%);
}

.canvas-preview {
  text-align: center;
}

.canvas-tabs {
  display: flex;
  justify-content: center;
  gap: 24px;
  margin-bottom: 20px;

  .canvas-tab {
    border: none;
    background: transparent;
    font-size: 14px;
    color: rgba(255, 255, 255, 0.8);
    padding-bottom: 8px;
    cursor: pointer;
    border-bottom: 2px solid transparent;
    transition: color 0.2s var(--ease), border-color 0.2s var(--ease);

    &.active {
      color: #34f4ff;
      border-bottom: 2px solid #34f4ff;
    }

    &:hover {
      color: rgba(255, 255, 255, 0.95);
    }

    &:focus-visible {
      outline: 2px solid rgba(52, 244, 255, 0.55);
      outline-offset: 4px;
      border-radius: 4px;
    }
  }
}

.canvas-frame {
  border-radius: 18px;
  overflow: hidden;
  border: 1px solid rgba(255, 255, 255, 0.12);
  box-shadow: 0 20px 48px rgba(0, 0, 0, 0.4);
  margin-bottom: 20px;

  img {
    width: 100%;
    max-width: 960px;
    height: auto;
    display: block;
  }
}

.canvas-note {
  margin: 0 0 24px;
  font-size: 14px;
  color: rgba(255, 255, 255, 0.85);
  max-width: 640px;
  margin-left: auto;
  margin-right: auto;
}

/* ========== 案例分区 ========== */
.section-cases {
  background: radial-gradient(60% 40% at 50% 0%, rgba(60, 80, 140, 0.15), transparent 70%),
    linear-gradient(180deg, #05080f 0%, #0a0d1a 100%);
}

.section-head.center .btn-outline {
  margin-top: 30px;
  // margin-bottom: 10px;
}

.cases-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 20px;
}

.case-card {
  border-radius: 14px;
  overflow: hidden;
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.08);
  transition: all 0.3s var(--ease);
  cursor: pointer;

  &:hover {
    transform: translateY(-6px);
    border-color: rgba(52, 244, 255, 0.25);
    box-shadow: 0 16px 40px rgba(0, 0, 0, 0.3);
  }
}

.case-img-wrap {
  aspect-ratio: 4/3;

  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    display: block;
    transition: transform 0.35s var(--ease);
  }

  .case-card:hover img {
    transform: scale(1.05);
  }
}

.case-meta {
  padding: 12px 14px;
  font-size: 12px;
  color: rgba(255, 255, 255, 0.85);
  background: rgba(0, 0, 0, 0.25);
}

/* ========== 功能入口分区 ========== */
.section-functions {
  background: #05080f;
}

.func-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 20px;
}

.func-card {
  min-height: 140px;
  border-radius: 14px;
  padding: 24px;
  border: 1px solid rgba(255, 255, 255, 0.08);
  background: rgba(255, 255, 255, 0.02);
  backdrop-filter: blur(12px);
  color: #ffffff;
  text-align: left;
  display: flex;
  gap: 16px;
  align-items: flex-start;
  cursor: pointer;
  transition: all 0.3s var(--ease);

  &:hover {
    transform: translateY(-4px);
    border-color: rgba(52, 244, 255, 0.3);
    background: rgba(52, 244, 255, 0.06);
    box-shadow: 0 12px 32px rgba(0, 0, 0, 0.25);
  }

  &:active {
    transform: translateY(-2px) scale(0.99);
  }
}

.func-icon {
  flex-shrink: 0;
  width: 36px;
  height: 28px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 11px;
  font-weight: 700;
  color: #34f4ff;
  border: 1px solid rgba(52, 244, 255, 0.4);
  border-radius: 999px;
}

.func-body {
  flex: 1;
  min-width: 0;
}

.func-body h4 {
  margin: 0 0 6px;
  font-size: 18px;
  font-weight: 600;
  color: #ffffff;
}

.func-body p {
  margin: 0;
  font-size: 13px;
  color: rgba(255, 255, 255, 0.75);
  line-height: 1.4;
}

/* ========== 底部 CTA ========== */
.bottom-cta {
  padding: 80px 24px 100px;
  text-align: center;
  background: linear-gradient(180deg, #080b14 0%, #050508 100%);
  border-top: 1px solid rgba(255, 255, 255, 0.06);
}

.cta-inner {
  max-width: 640px;
  margin: 0 auto;
}

.cta-logo {
  width: 64px;
  height: 64px;
  border-radius: 14px;
  object-fit: cover;
  margin-bottom: 16px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.3);
}

.cta-inner h3 {
  margin: 0 0 12px;
  font-size: 28px;
  font-weight: 700;
  color: #ffffff;
}

.cta-sub {
  margin: 0 0 32px;
  font-size: 14px;
  line-height: 1.65;
  color: rgba(255, 255, 255, 0.78);
}

.cta-buttons {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 16px;
  flex-wrap: wrap;
}

.btn-large {
  min-width: 180px;
  height: 52px;
  font-size: 16px;
}

/* ========== 响应式 ========== */
@media (max-width: 1280px) {
  .hero {
    justify-content: center;
  }

  .hero-content {
    margin-left: auto;
    margin-right: auto;
    text-align: center;
    max-width: 760px;
  }

  .hero-desc {
    margin-left: auto;
    margin-right: auto;
  }

  .nav-links {
    display: none;
  }

  .section-multimodal .container::before {
    display: none;
  }

  .multimodal-head-row {
    grid-template-columns: 1fr;
    transform: none;
    margin-bottom: 40px;

    .section-head {
      grid-column: 1;
    }
  }

  .multimodal-tag-wrap {
    margin-bottom: 12px;
  }

  .feature-row {
    grid-template-columns: 1fr;
    gap: 20px;
  }

  .feature-divider {
    display: none;
  }

  .feature-left h3 {
    font-size: 34px;
  }

  .cases-grid {
    grid-template-columns: repeat(2, 1fr);
  }

  .func-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 768px) {
  .section {
    padding: 80px 0;
  }

  .container,
  .top-nav .nav-inner,
  .hero-content {
    padding-left: 20px;
    padding-right: 20px;
  }

  .top-nav .nav-actions {
    display: none;
  }

  .hero-content {
    padding-top: 96px;
    justify-content: flex-start;
    padding-bottom: 24px;
  }

  .hero-cta-bar {
    padding: 20px 20px 40px;
  }

  .btn-hero {
    min-width: 140px;
    height: 48px;
    font-size: 15px;
  }

  .hero-content h1 {
    font-size: clamp(32px, 8vw, 44px);
  }

  .hero-accent {
    font-size: 18px;
  }

  .hero-dots {
    display: none;
  }

  .feature-left h3 {
    font-size: 26px;
  }

  .cases-grid {
    grid-template-columns: 1fr;
  }

  .func-grid {
    grid-template-columns: 1fr;
  }

  .section-head h2 {
    font-size: clamp(28px, 6vw, 36px);
  }
}
</style>
