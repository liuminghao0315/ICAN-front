<template>
  <div class="home-page">
    <nav class="top-nav">
      <div class="nav-inner">
        <div class="brand" @click="goTop">
          <img src="/logo.jpg" alt="SynSight" />
          <span>SynSight</span>
        </div>

        <div class="nav-links">
          <button @click="scrollTo('video')">视频分析</button>
          <button @click="scrollTo('canvas')">智能画布</button>
          <button @click="scrollTo('community')">探索</button>
          <button @click="scrollTo('functions')">功能入口</button>
        </div>

        <div class="nav-actions">
          <button class="ghost" @click="goAuth">切换账号</button>
          <button class="solid" @click="goWorkbench">开启系统</button>
        </div>
      </div>
    </nav>

    <section class="hero">
      <div
        v-for="(bg, idx) in heroBackgrounds"
        :key="bg"
        class="hero-bg"
        :class="{ active: idx === activeBgIndex }"
      >
        <img :src="bg" :alt="`背景${idx + 1}`" />
        <div class="hero-mask" />
      </div>

      <div class="hero-content">
        <div class="hero-label">面向高校场景的多模态风控平台</div>
        <h1>高校舆情研判</h1>
        <div class="accent">单视频 · 可复核 · 可追踪</div>
        <p>本地上传视频，一键生成身份线索、涉及高校、态度判断与风险建议。</p>

        <div class="hero-input">
          <span>示例：分析“自称某高校学生”视频的舆情风险</span>
          <button @click="goWorkbench">立即分析</button>
        </div>
      </div>

      <div class="hero-previews">
        <button
          v-for="(bg, idx) in heroBackgrounds"
          :key="`preview-${bg}`"
          :class="{ active: idx === activeBgIndex }"
          @click="activeBgIndex = idx"
        >
          <img :src="bg" :alt="`预览${idx + 1}`" />
        </button>
      </div>
    </section>

    <section id="video" class="video-section section-blue">
      <div class="container">
        <div class="section-head">
          <span>支持视频 / 音频 / 文本联合研判</span>
          <h2>多模态内容风险识别</h2>
          <p>针对单条视频抽取关键线索，围绕高校相关表达、情绪倾向与风险等级形成结构化结果。</p>
        </div>

        <div class="video-list">
          <article v-for="item in videoFeatures" :key="item.index" class="video-row">
            <div class="left">
              <div class="index">{{ item.index }}</div>
              <h3>{{ item.title }}</h3>
              <p>{{ item.desc }}</p>
              <button class="outline-btn" @click="goWorkbench">进入研判</button>
            </div>
            <div class="media">
              <img :src="item.image" :alt="item.title" />
            </div>
          </article>
        </div>
      </div>
    </section>

    <div class="section-bridge blue-to-dark" />

    <section id="canvas" class="canvas-section section-dark">
      <div class="container narrow">
        <div class="section-head center">
          <span>证据整理 / 对比分析 / 结果归档</span>
          <h2>智能画布 · 证据协同</h2>
          <p>将时间轴证据、语音转写、风险点与处置建议放在同一视图，便于高校管理场景复核与汇报。</p>
        </div>

        <div class="double-gallery">
          <img :src="shots[3]" alt="AI 绘画效果 1" />
          <img :src="shots[4]" alt="AI 绘画效果 2" />
        </div>

        <div class="canvas-board">
          <h3>风险看板 · 多线索联动</h3>
          <p>支持查看风险词命中、情绪变化、关键帧证据与融合评分，减少人工逐段排查成本。</p>
          <button class="outline-btn" @click="goWorkbench">进入画布</button>
          <div class="tabs">
            <span class="active">多维线索总览</span>
            <span>证据时间定位</span>
          </div>
          <img :src="shots[0]" alt="智能画布预览" />
        </div>
      </div>
    </section>

    <div class="section-bridge dark-to-purple" />

    <section id="community" class="community section-purple">
      <div class="container narrow">
        <div class="section-head center">
          <h2>案例复盘 经验沉淀</h2>
          <p>基于历史分析任务沉淀复盘样例，支持快速检索、比对与复用，提升高校舆情研判一致性。</p>
          <button class="outline-btn" @click="goRecords">查看任务记录</button>
        </div>

        <div class="waterfall">
          <article v-for="(card, idx) in communityCards" :key="`${card}-${idx}`">
            <img :src="card" :alt="`社区作品${idx + 1}`" />
            <div class="meta">
              <span>任务样例 {{ idx + 1 }}</span>
              <span>❤ {{ 12 + idx * 3 }}</span>
            </div>
          </article>
        </div>
      </div>
    </section>

    <section id="functions" class="functions section-dark">
      <div class="container narrow">
        <div class="section-head center">
          <h2>功能入口</h2>
          <p>保持原有业务路径，入口更聚焦、更易找。</p>
        </div>

        <div class="func-grid">
          <button v-for="item in functionCards" :key="item.title" class="func-card" @click="item.action">
            <div class="func-icon">{{ item.badge }}</div>
            <div>
              <h4>{{ item.title }}</h4>
              <p>{{ item.desc }}</p>
            </div>
          </button>
        </div>
      </div>
    </section>

    <footer class="bottom-cta">
      <img src="/logo.jpg" alt="logo" />
      <h3>SynSight · 高校内容风险分析平台</h3>
      <div class="hero-cta">
        <button class="solid large" @click="goWorkbench">开启智能分析</button>
        <button class="ghost large" @click="goHelp">查看帮助</button>
      </div>
    </footer>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '@/stores/user'

const router = useRouter()
const userStore = useUserStore()

const shots = ['/landing/1.png', '/landing/2.png', '/landing/3.png', '/landing/4.png', '/landing/5.png']
const heroBackgrounds = computed(() => [shots[0], shots[4], shots[3]])
const activeBgIndex = ref(0)

const videoFeatures = [
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

const communityCards = computed(() => [...shots, ...shots, shots[1], shots[2]])

const isAdmin = computed(() => userStore.isAdmin)

const functionCards = computed(() => {
  const list = [
    { badge: '01', title: '工作台', desc: '多模态分析主控台', action: () => router.push('/dashboard') },
    { badge: '02', title: '记录中心', desc: '历史任务全览', action: () => router.push('/records') },
    { badge: '03', title: '分析结果', desc: '风险报告查阅', action: () => router.push('/analysis') },
    { badge: '04', title: '我的收藏', desc: '关注内容快速访问', action: () => router.push('/favorites') },
    { badge: '05', title: '高校知识库', desc: '高校别称与风险词维护', action: () => router.push('/risk-dictionary') },
    { badge: '06', title: '帮助文档', desc: '使用指南与API', action: () => router.push('/help') },
    { badge: '07', title: '系统设置', desc: '偏好与权限配置', action: () => router.push('/settings') }
  ]

  if (isAdmin.value) {
    list.push({ badge: '08', title: '反馈管理', desc: '用户反馈处理（管理员）', action: () => router.push('/admin/feedback') })
  }

  return list
})

let timer: ReturnType<typeof setInterval> | null = null
onMounted(() => {
  timer = setInterval(() => {
    activeBgIndex.value = (activeBgIndex.value + 1) % heroBackgrounds.value.length
  }, 3200)
})
onUnmounted(() => timer && clearInterval(timer))

const goTop = () => window.scrollTo({ top: 0, behavior: 'smooth' })
const scrollTo = (id: string) => document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' })
const goAuth = () => router.push('/login')
const goWorkbench = () => router.push('/dashboard')
const goRecords = () => router.push('/records')
const goHelp = () => router.push('/help')
</script>

<style scoped lang="scss">
.home-page {
  min-height: 100vh;
  color: #fff;
  background: #06060d;
}

.container {
  max-width: 1320px;
  margin: 0 auto;
  padding: 0 32px;

  &.narrow {
    max-width: 1180px;
  }
}

.top-nav {
  position: fixed;
  inset: 0 0 auto;
  z-index: 60;
  height: 72px;
  background: rgba(8, 13, 27, 0.62);
  backdrop-filter: blur(18px);

  .nav-inner {
    height: 100%;
    padding: 0 24px;
    display: flex;
    align-items: center;
    justify-content: space-between;
  }
}

.brand {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;

  img {
    width: 30px;
    height: 30px;
    border-radius: 6px;
  }

  span {
    font-size: 24px;
    font-weight: 600;
    background: linear-gradient(90deg, #e8fbff, #7de7ff);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
  }
}

.nav-links,
.nav-actions,
.hero-cta {
  display: flex;
  align-items: center;
  gap: 14px;
}

.nav-links button {
  border: none;
  background: transparent;
  color: rgba(255, 255, 255, 0.8);
  font-size: 14px;
  padding: 8px 10px;
  border-radius: 999px;
  transition: all 0.2s ease;

  &:hover {
    color: #c6f5ff;
    background: rgba(255, 255, 255, 0.12);
    transform: translateY(-1px);
  }
}

.solid,
.ghost {
  border-radius: 12px;
  font-size: 14px;
  white-space: nowrap;
  transition: 0.25s;

  &:focus-visible {
    outline: 2px solid rgba(18, 221, 255, 0.9);
    outline-offset: 2px;
  }
}

.solid {
  border: none;
  color: #0a1624;
  font-weight: 600;
  background: linear-gradient(90deg, #34f4ff, #1ec3ff);

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 10px 24px rgba(31, 195, 255, 0.36);
  }
}

.ghost {
  border: 1px solid rgba(117, 220, 255, 0.4);
  color: rgba(255, 255, 255, 0.85);
  background: rgba(7, 26, 46, 0.45);

  &:hover {
    transform: translateY(-2px);
    border-color: rgba(117, 220, 255, 0.8);
    background: rgba(8, 31, 56, 0.7);
  }
}

.large {
  width: 170px;
  height: 48px;
  font-size: 16px;
}

.top-nav .solid,
.top-nav .ghost {
  height: 38px;
  padding: 0 18px;
}

.hero {
  position: relative;
  height: 100vh;
  min-height: 740px;
  overflow: hidden;
}

.hero-bg {
  position: absolute;
  inset: 0;
  opacity: 0;
  transform: scale(1.02);
  transition: 0.9s ease-in-out;

  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }

  &.active {
    opacity: 1;
    transform: scale(1.09);
  }
}

.hero-mask {
  position: absolute;
  inset: 0;
  background: linear-gradient(180deg, rgba(4, 14, 31, 0.58), rgba(5, 9, 18, 0.9));
}

.hero-content {
  position: relative;
  z-index: 2;
  max-width: 920px;
  margin: 0 auto;
  padding: 116px 40px 40px;
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;

  &::before {
    content: '';
    position: absolute;
    width: min(860px, 88vw);
    height: 280px;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    background: radial-gradient(ellipse at center, rgba(7, 16, 34, 0.52), rgba(7, 16, 34, 0));
    pointer-events: none;
    z-index: -1;
  }

  .hero-label {
    font-size: 13px;
    letter-spacing: 0.8px;
    padding: 6px 14px;
    border-radius: 999px;
    border: 1px solid rgba(255, 255, 255, 0.28);
    background: rgba(255, 255, 255, 0.1);
    margin-bottom: 14px;
  }

  h1 {
    margin: 0;
    font-size: clamp(34px, 3.6vw, 54px);
    line-height: 1.14;
    letter-spacing: 0.2px;
    text-shadow: 0 4px 10px rgba(0, 0, 0, 0.3);
    font-weight: 700;
  }

  .accent {
    margin: 8px 0 14px;
    font-size: clamp(20px, 1.8vw, 30px);
    font-weight: 600;
    letter-spacing: 1px;
    background: linear-gradient(90deg, #dffbff, #7de7ff);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
  }

  p {
    margin: 0 0 24px;
    font-size: 15px;
    color: rgba(255, 255, 255, 0.86);
    max-width: 680px;
  }
}

.hero-previews {
  position: absolute;
  right: 24px;
  top: 50%;
  transform: translateY(-50%);
  z-index: 4;
  display: flex;
  flex-direction: column;
  gap: 10px;

  button {
    width: 58px;
    height: 58px;
    padding: 0;
    border-radius: 10px;
    overflow: hidden;
    border: 1px solid rgba(255, 255, 255, 0.35);
    opacity: 0.58;
    background: #0f1f33;

    img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }

    transition: all 0.24s ease;

    &.active,
    &:hover {
      opacity: 0.98;
      border-color: rgba(49, 245, 255, 0.95);
      box-shadow: 0 8px 18px rgba(23, 210, 255, 0.35);
      transform: translateX(-4px);
    }
  }
}

.hero-input {
  margin-top: 10px;
  width: min(680px, 100%);
  border: 1px solid rgba(255, 255, 255, 0.24);
  background: rgba(255, 255, 255, 0.14);
  backdrop-filter: blur(10px);
  border-radius: 14px;
  padding: 10px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
  transition: all 0.24s ease;

  &:hover {
    border-color: rgba(114, 236, 255, 0.52);
    box-shadow: 0 10px 28px rgba(0, 0, 0, 0.22);
  }

  span {
    font-size: 14px;
    color: rgba(255, 255, 255, 0.9);
  }

  button {
    border: none;
    border-radius: 10px;
    padding: 10px 18px;
    color: #062236;
    font-weight: 600;
    background: linear-gradient(90deg, #39f2ff, #20c6ff);
    transition: all 0.24s ease;

    &:hover {
      transform: translateY(-2px);
      box-shadow: 0 10px 24px rgba(32, 198, 255, 0.35);
    }
  }
}

.section {
  padding: 100px 0;
}

.section-bridge {
  display: none;
  height: 0;
}

.blue-to-dark {
  background: transparent;
}

.dark-to-purple {
  background:
    radial-gradient(72% 100% at 50% 0%, rgba(74, 98, 196, 0.22), transparent 70%),
    linear-gradient(180deg, #05080f 0%, #0a0b19 45%, #0f1021 100%);
}

.section-blue {
  position: relative;
  padding: 148px 0 150px;
  background:
    radial-gradient(60% 50% at 22% 42%, rgba(141, 214, 255, 0.16), transparent 74%),
    radial-gradient(46% 36% at 86% 24%, rgba(52, 145, 255, 0.14), transparent 80%),
    linear-gradient(180deg, #05080f 0%, #071a45 14%, #0f4cae 34%, #2a8fff 58%, #1f7dea 74%, #0d4aa8 86%, #061b48 94%, #05080f 100%);

  &::after {
    content: none;
  }
}

.section-dark {
  padding-top: 98px;
  background:
    radial-gradient(58% 35% at 50% 0%, rgba(27, 83, 198, 0.09), transparent 70%),
    #05080f;
}

.canvas-section {
  position: relative;
  overflow: hidden;
  padding-top: 118px;

  &::before {
    content: '';
    position: absolute;
    inset: 0 0 auto;
    height: 120px;
    background: linear-gradient(180deg, rgba(5, 8, 15, 0), #05080f 88%);
    pointer-events: none;
  }
}

.section-purple {
  position: relative;
  padding: 132px 0 132px;
  background:
    radial-gradient(60% 42% at 50% 0%, rgba(95, 72, 174, 0.18), transparent 76%),
    linear-gradient(180deg, #05080f 0%, #0d1024 30%, #07070f 72%);

  &::before {
    content: '';
    position: absolute;
    inset: 0 0 auto;
    height: 110px;
    background: linear-gradient(180deg, rgba(5, 8, 15, 1), rgba(5, 8, 15, 0));
    pointer-events: none;
  }
}

.section-head {
  max-width: 960px;
  margin-bottom: 44px;

  span {
    font-size: 13px;
    color: rgba(226, 243, 255, 0.82);
  }

  h2 {
    margin: 12px 0;
    font-size: clamp(36px, 4vw, 58px);
    line-height: 1.15;
  }

  p {
    margin: 0;
    color: rgba(233, 246, 255, 0.78);
    line-height: 1.8;
  }

  &.center {
    text-align: center;
    margin-left: auto;
    margin-right: auto;
  }
}

.video-list {
  display: grid;
  gap: 48px;
  position: relative;
  z-index: 1;
}

.video-row {
  display: grid;
  grid-template-columns: 360px 1fr;
  gap: 28px;
  align-items: center;

  .left {
    padding: 8px 8px 8px 0;
  }

  .index {
    font-size: 40px;
    color: rgba(211, 243, 255, 0.5);
    margin-bottom: 8px;
  }

  h3 {
    margin: 0 0 10px;
    font-size: 34px;
  }

  p {
    margin: 0 0 20px;
    line-height: 1.8;
    color: rgba(220, 245, 255, 0.84);
  }

  .media {
    border-radius: 18px;
    overflow: hidden;
    border: 1px solid rgba(255, 255, 255, 0.25);
    box-shadow: 0 16px 38px rgba(1, 20, 58, 0.28);
    clip-path: polygon(3% 0, 100% 0, 97% 100%, 0 100%);
    position: relative;
    transition: transform 0.34s ease, box-shadow 0.34s ease;

    &::after {
      content: '';
      position: absolute;
      inset: 0;
      background: linear-gradient(115deg, rgba(43, 189, 255, 0.12), rgba(7, 17, 53, 0.22));
      pointer-events: none;
    }

    img {
      width: 100%;
      height: 300px;
      object-fit: cover;
      display: block;
    }
  }

  &:hover .media {
    transform: translateY(-4px) scale(1.01);
    box-shadow: 0 20px 40px rgba(1, 20, 58, 0.42);
  }

  &:nth-child(2) .media {
    transform: translateX(-8px);
  }

  &:nth-child(3) .media {
    transform: translateX(8px);
  }
}

.outline-btn {
  width: 180px;
  height: 44px;
  border-radius: 12px;
  border: 1px solid rgba(216, 244, 255, 0.5);
  background: rgba(255, 255, 255, 0.08);
  color: #fff;
  transition: all 0.24s ease;

  &:hover {
    transform: translateY(-2px);
    border-color: rgba(97, 230, 255, 0.86);
    background: rgba(31, 115, 165, 0.26);
    box-shadow: 0 8px 20px rgba(34, 177, 255, 0.2);
  }
}

.double-gallery {
  position: relative;
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
  margin-bottom: 62px;

  &::after {
    content: '';
    position: absolute;
    inset: auto 0 -1px;
    height: 72px;
    background: linear-gradient(180deg, rgba(5, 8, 15, 0), #05080f 94%);
    pointer-events: none;
  }

  img {
    width: 100%;
    height: 320px;
    object-fit: cover;
    display: block;
    border-radius: 14px;
  }
}

.canvas-board {
  text-align: center;
  margin-top: 62px;

  h3 {
    margin: 0 0 12px;
    font-size: 54px;
  }

  p {
    margin: 0 auto 18px;
    max-width: 920px;
    color: rgba(255, 255, 255, 0.7);
  }

  .outline-btn {
    margin: 0 auto 18px;
  }

  .tabs {
    display: flex;
    justify-content: center;
    gap: 26px;
    margin-bottom: 20px;

    span {
      color: rgba(255, 255, 255, 0.55);
      padding-bottom: 8px;
    }

    .active {
      color: #53e9ff;
      border-bottom: 2px solid #53e9ff;
    }
  }

  img {
    width: min(980px, 100%);
    border-radius: 18px;
    border: 1px solid rgba(255, 255, 255, 0.12);
    box-shadow: 0 18px 46px rgba(0, 0, 0, 0.44);
  }
}

.waterfall {
  display: grid;
  grid-template-columns: repeat(6, minmax(0, 1fr));
  gap: 12px;

  article {
    border-radius: 12px;
    overflow: hidden;
    border: 1px solid rgba(255, 255, 255, 0.08);
    background: rgba(10, 15, 28, 0.66);
    transition: all 0.26s ease;

    &:hover {
      transform: translateY(-5px);
      border-color: rgba(117, 220, 255, 0.34);
      box-shadow: 0 14px 28px rgba(2, 8, 22, 0.42);
    }

    img {
      width: 100%;
      height: 170px;
      object-fit: cover;
      display: block;
      transition: transform 0.28s ease;
    }

    &:hover img {
      transform: scale(1.04);
    }

    .meta {
      height: 34px;
      padding: 0 8px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      font-size: 12px;
      color: rgba(255, 255, 255, 0.75);
      background: rgba(0, 0, 0, 0.3);
    }
  }
}

.functions {
  padding-top: 132px;
}

.func-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 16px;
}

.func-card {
  min-height: 142px;
  border-radius: 12px;
  padding: 20px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  background: rgba(255, 255, 255, 0.02);
  color: #fff;
  text-align: left;
  display: flex;
  gap: 12px;
  align-items: flex-start;
  transition: all 0.22s ease;

  &:hover {
    transform: translateY(-3px);
    border-color: rgba(23, 210, 255, 0.34);
    background: rgba(17, 37, 68, 0.32);
    box-shadow: 0 12px 28px rgba(5, 20, 40, 0.38);
  }

  .func-icon {
    color: #39e8ff;
    font-size: 12px;
    font-weight: 700;
    border: 1px solid rgba(23, 210, 255, 0.45);
    border-radius: 999px;
    min-width: 40px;
    height: 24px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
  }

  h4 {
    font-size: 22px;
    margin: 0 0 4px;
  }

  p {
    font-size: 13px;
    color: rgba(255, 255, 255, 0.58);
  }
}

.bottom-cta {
  padding: 70px 20px 90px;
  text-align: center;
  background: #080808;

  img {
    width: 64px;
    height: 64px;
    border-radius: 14px;
    margin-bottom: 10px;
  }

  h3 {
    margin: 0 0 20px;
    font-size: 42px;
  }

  .hero-cta {
    justify-content: center;
  }
}

@media (max-width: 1280px) {
  .nav-links {
    display: none;
  }

  .video-row {
    grid-template-columns: 1fr;

    .media img {
      height: 260px;
    }
  }

  .waterfall,
  .func-grid,
  .double-gallery {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 768px) {
  .canvas-section {
    padding-top: 92px;
  }

  .section-blue {
    padding: 118px 0 112px;
  }

  .section-dark {
    padding-top: 86px;
  }

  .section-purple {
    padding: 96px 0 100px;
  }

  .functions {
    padding-top: 92px;
  }

  .container,
  .top-nav .nav-inner,
  .hero-content {
    padding-left: 14px;
    padding-right: 14px;
  }

  .brand span {
    font-size: 22px;
  }

  .top-nav .nav-actions {
    display: none;
  }

  .hero-content {
    padding-top: 100px;

    h1 {
      font-size: clamp(28px, 8.2vw, 40px);
    }

    .accent {
      font-size: 18px;
      letter-spacing: 0.6px;
    }
  }

  .hero-content p,
  .hero-input span {
    font-size: 15px;
  }

  .hero-input {
    flex-direction: column;
    align-items: stretch;

    button {
      width: 100%;
    }
  }

  .func-grid,
  .double-gallery,
  .waterfall {
    grid-template-columns: 1fr;
  }

  .hero-previews {
    display: none;
  }

  .canvas-board h3 {
    font-size: 38px;
  }

  .video-row h3 {
    font-size: 28px;
  }
}
</style>