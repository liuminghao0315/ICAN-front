<template>
  <div class="landing-page">
    <header class="topbar">
      <div class="brand" @click="goTop">
        <img src="/logo.jpg" alt="SynSight" class="brand-logo" />
        <div class="brand-text">
          <strong>SynSight</strong>
          <span>多模态内容分析平台</span>
        </div>
      </div>

      <nav class="nav-links">
        <button @click="scrollTo('case')">案例</button>
        <button @click="scrollTo('ability')">能力</button>
        <button @click="scrollTo('entry')">入口</button>
      </nav>

      <div class="top-actions">
        <button class="ghost" @click="goAuth">{{ isLoggedIn ? '切换账号' : '登录 / 注册' }}</button>
        <button class="solid" @click="goWorkbench">{{ isLoggedIn ? '进入系统' : '开始演示' }}</button>
      </div>
    </header>

    <section class="hero" :style="{ backgroundImage: `url(${activeShot})` }">
      <div class="hero-mask"></div>

      <div class="hero-inner">
        <p class="hero-badge">真实页面驱动 · 可直接答辩演示</p>
        <h1>即刻看见风险，<br />而不是事后复盘。</h1>
        <p class="hero-sub">视频 / 音频 / 文本三路联合分析，输出证据、进度与治理闭环。</p>

        <div class="hero-actions">
          <button class="solid" @click="goWorkbench">{{ isLoggedIn ? '进入工作台' : '开始演示' }}</button>
          <button class="ghost" @click="goRecords">查看记录中心</button>
        </div>

        <div class="hero-metrics">
          <div><strong>3</strong><span>模态联合</span></div>
          <div><strong>实时</strong><span>任务进度</span></div>
          <div><strong>闭环</strong><span>风险治理</span></div>
        </div>
      </div>

      <div class="hero-switcher">
        <button
          v-for="(shot, idx) in shots"
          :key="shot"
          :class="['shot-dot', { active: idx === activeShotIndex }]"
          @click="activeShotIndex = idx"
        >
          <span></span>
        </button>
      </div>
    </section>

    <main>
      <section id="case" class="case-block">
        <div class="section-head">
          <h2>真实系统截图，直接证明能力</h2>
          <p>全部来自你项目现有界面，非占位素材。</p>
        </div>

        <div class="case-layout">
          <article class="case-main">
            <img :src="shots[0]" alt="主案例" />
            <div class="caption">主案例：任务总览 + 风险分布 + 实时状态</div>
          </article>
          <article class="case-side">
            <img :src="shots[1]" alt="记录中心" />
            <div class="caption">记录中心：任务与视频统一管理</div>
          </article>
          <article class="case-side">
            <img :src="shots[2]" alt="词库管理" />
            <div class="caption">风险词库：策略可维护、可解释</div>
          </article>
        </div>

        <div class="marquee-wrap">
          <div class="marquee-track">
            <img v-for="item in marqueeShots" :key="item.key" :src="item.src" :alt="item.key" />
          </div>
        </div>
      </section>

      <section id="ability" class="ability-grid">
        <article>
          <span>01</span>
          <h3>多模态联合分析</h3>
          <p>图像内容、音频情绪、文本语义在同一任务聚合展示。</p>
        </article>
        <article>
          <span>02</span>
          <h3>异步队列 + 广播进度</h3>
          <p>上传、排队、处理中、完成全流程可视化，适配现场演示节奏。</p>
        </article>
        <article>
          <span>03</span>
          <h3>风险治理闭环</h3>
          <p>结果页、词库、收藏、反馈管理打通，持续迭代优化策略。</p>
        </article>
      </section>

      <section id="entry" class="entry-grid">
        <button class="entry" @click="goWorkbench"><h4>工作台</h4><p>总览统计与趋势</p></button>
        <button class="entry" @click="goRecords"><h4>记录中心</h4><p>任务与视频管理</p></button>
        <button class="entry" @click="goAnalysis"><h4>分析结果</h4><p>证据与详情查看</p></button>
        <button class="entry" @click="goFavorites"><h4>我的收藏</h4><p>重点案例沉淀</p></button>
        <button class="entry" @click="goRiskLibrary"><h4>风险词库</h4><p>策略与规则维护</p></button>
        <button class="entry" @click="goHelp"><h4>帮助文档</h4><p>操作与说明</p></button>
        <button class="entry" @click="goSettings"><h4>系统设置</h4><p>主题与偏好</p></button>
        <button v-if="isAdmin" class="entry" @click="goAdminFeedback"><h4>反馈管理</h4><p>问题闭环迭代</p></button>
      </section>
    </main>

    <footer class="footer-cta">
      <h3>让答辩不靠讲，直接让系统跑起来。</h3>
      <div>
        <button class="solid" @click="goWorkbench">{{ isLoggedIn ? '进入系统' : '立即演示' }}</button>
        <button class="ghost" @click="goRecords">查看任务</button>
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

const isLoggedIn = computed(() => userStore.isLoggedIn)
const isAdmin = computed(() => userStore.isAdmin)

const shots = ['/landing/1.png', '/landing/2.png', '/landing/3.png', '/landing/4.png', '/landing/5.png']
const activeShotIndex = ref(0)
const activeShot = computed(() => shots[activeShotIndex.value])

const marqueeShots = computed(() => {
  const source = [...shots, ...shots]
  return source.map((src, idx) => ({ src, key: `${idx}-${src}` }))
})

let timer: ReturnType<typeof setInterval> | null = null
onMounted(() => {
  timer = setInterval(() => {
    activeShotIndex.value = (activeShotIndex.value + 1) % shots.length
  }, 2800)
})
onUnmounted(() => {
  if (timer) clearInterval(timer)
})

const goTop = () => window.scrollTo({ top: 0, behavior: 'smooth' })
const scrollTo = (id: string) => {
  const el = document.getElementById(id)
  if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' })
}

const goAuth = () => router.push('/login')
const goWorkbench = () => router.push('/dashboard')
const goRecords = () => router.push('/records')
const goAnalysis = () => router.push('/analysis')
const goFavorites = () => router.push('/favorites')
const goRiskLibrary = () => router.push('/risk-dictionary')
const goHelp = () => router.push('/help')
const goSettings = () => router.push('/settings')
const goAdminFeedback = () => router.push('/admin/feedback')
</script>

<style scoped lang="scss">
.landing-page {
  min-height: 100vh;
  background: #020916;
  color: #eaf1ff;
  font-family: "PingFang SC", "Noto Sans SC", "Microsoft YaHei", sans-serif;
}

.topbar {
  position: fixed;
  left: 0;
  right: 0;
  top: 0;
  z-index: 80;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 26px;
  backdrop-filter: blur(12px);
  border-bottom: 1px solid rgba(255, 255, 255, 0.14);
  background: rgba(4, 10, 24, 0.48);
}

.brand {
  display: flex;
  align-items: center;
  gap: 9px;
  cursor: pointer;

  .brand-logo {
    width: 34px;
    height: 34px;
    border-radius: 8px;
  }

  .brand-text {
    display: flex;
    flex-direction: column;

    strong {
      font-size: 14px;
    }

    span {
      font-size: 10px;
      color: rgba(234, 241, 255, 0.72);
    }
  }
}

.nav-links {
  display: flex;
  gap: 6px;

  button {
    border: none;
    color: rgba(234, 241, 255, 0.82);
    background: transparent;
    padding: 7px 10px;
    border-radius: 9px;
    cursor: pointer;

    &:hover {
      background: rgba(255, 255, 255, 0.08);
      color: #fff;
    }
  }
}

.top-actions,
.hero-actions,
.footer-cta div {
  display: flex;
  gap: 10px;
}

button.solid,
button.ghost {
  border-radius: 10px;
  padding: 9px 15px;
  font-size: 13px;
  cursor: pointer;
  transition: 0.2s ease;
}

button.solid {
  border: none;
  color: #fff;
  background: linear-gradient(135deg, #1bd2ff 0%, #2f71ff 100%);

  &:hover {
    transform: translateY(-1px);
    filter: brightness(1.05);
  }
}

button.ghost {
  border: 1px solid rgba(255, 255, 255, 0.24);
  color: #d6e5ff;
  background: rgba(255, 255, 255, 0.02);

  &:hover {
    border-color: rgba(255, 255, 255, 0.38);
    background: rgba(255, 255, 255, 0.1);
  }
}

.hero {
  min-height: 100vh;
  background-size: cover;
  background-position: center;
  position: relative;
  display: flex;
  align-items: center;
  padding: 120px 24px 44px;

  .hero-mask {
    position: absolute;
    inset: 0;
    background:
      linear-gradient(112deg, rgba(2, 8, 18, 0.9) 8%, rgba(2, 8, 18, 0.58) 45%, rgba(2, 8, 18, 0.86) 100%),
      radial-gradient(980px 460px at 18% 62%, rgba(22, 116, 255, 0.38), transparent 72%);
  }
}

.hero-inner {
  position: relative;
  z-index: 3;
  width: min(960px, 100%);

  .hero-badge {
    display: inline-flex;
    padding: 6px 12px;
    border-radius: 999px;
    border: 1px solid rgba(255, 255, 255, 0.3);
    background: rgba(255, 255, 255, 0.1);
    font-size: 12px;
    margin-bottom: 14px;
  }

  h1 {
    margin: 0;
    font-size: clamp(44px, 6.2vw, 90px);
    line-height: 1.04;
    letter-spacing: -1.8px;
    text-shadow: 0 12px 34px rgba(0, 0, 0, 0.35);
  }

  .hero-sub {
    margin: 18px 0 24px;
    font-size: 17px;
    color: rgba(233, 242, 255, 0.88);
    max-width: 720px;
  }
}

.hero-metrics {
  display: flex;
  gap: 10px;
  margin-top: 16px;

  div {
    border: 1px solid rgba(255, 255, 255, 0.24);
    background: rgba(255, 255, 255, 0.09);
    border-radius: 12px;
    padding: 9px 12px;
    min-width: 120px;
  }

    strong {
    display: block;
      font-size: 17px;
    margin-bottom: 2px;
  }

  span {
    font-size: 12px;
    color: rgba(229, 240, 255, 0.82);
  }
}

.hero-switcher {
  position: absolute;
  right: 20px;
  bottom: 26px;
  z-index: 4;
  display: inline-flex;
  gap: 9px;

  .shot-dot {
    width: 22px;
    height: 22px;
    padding: 0;
    border-radius: 999px;
    opacity: 0.55;
    border: 1px solid rgba(255, 255, 255, 0.45);
    background: rgba(255, 255, 255, 0.08);
    cursor: pointer;
    transition: 0.2s ease;

    span {
      width: 100%;
      height: 100%;
      display: block;
    }

    &.active,
    &:hover {
      opacity: 1;
      transform: translateY(-2px);
      border-color: rgba(83, 196, 255, 1);
      background: rgba(83, 196, 255, 0.35);
    }
  }
}

main {
  width: min(1220px, calc(100% - 42px));
  margin: 0 auto;
  padding: 38px 0 70px;
}

.section-head {
  margin-bottom: 15px;

  h2 {
    margin: 0;
    font-size: clamp(28px, 4.2vw, 48px);
    letter-spacing: -0.8px;
  }

  p {
    margin: 7px 0 0;
    color: rgba(224, 236, 255, 0.74);
  }
}

.case-block {
  margin-bottom: 28px;
}

.case-layout {
  display: grid;
  grid-template-columns: 1.5fr 1fr;
  gap: 10px;

  .case-main,
  .case-side {
    border-radius: 14px;
    overflow: hidden;
    border: 1px solid rgba(255, 255, 255, 0.12);
    background: rgba(255, 255, 255, 0.03);

    img {
      width: 100%;
      display: block;
      object-fit: cover;
    }

    .caption {
      padding: 10px 12px;
      font-size: 12px;
      color: rgba(224, 236, 255, 0.85);
      border-top: 1px solid rgba(255, 255, 255, 0.1);
    }
  }

  .case-main {
    grid-row: span 2;

    img {
      height: 510px;
    }
  }

  .case-side img {
    height: 248px;
  }
}

.marquee-wrap {
  margin-top: 12px;
  overflow: hidden;
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: 14px;
  background: rgba(255, 255, 255, 0.03);

  .marquee-track {
    display: flex;
    gap: 10px;
    width: max-content;
    padding: 10px;
    animation: scroll-x 22s linear infinite;
  }

  img {
    width: 240px;
    height: 130px;
    object-fit: cover;
    border-radius: 10px;
    opacity: 0.9;
  }
}

.ability-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 10px;
  margin-bottom: 18px;

  article {
    border: 1px solid rgba(255, 255, 255, 0.11);
    border-radius: 14px;
    padding: 16px;
    background: linear-gradient(165deg, rgba(255, 255, 255, 0.08), rgba(255, 255, 255, 0.02));
  }

  span {
    font-size: 12px;
    color: #8eb7ff;
  }

  h3 {
    margin: 7px 0 8px;
    font-size: 20px;
  }

  p {
    margin: 0;
    line-height: 1.7;
    color: rgba(223, 236, 255, 0.82);
    font-size: 13px;
  }
}

.entry-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 10px;
}

.entry {
  border: 1px solid rgba(255, 255, 255, 0.11);
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.02);
  color: #e7f0ff;
  text-align: left;
  padding: 13px;
  cursor: pointer;
  transition: 0.2s ease;

  h4 {
    margin: 0 0 6px;
    font-size: 15px;
  }

  p {
    margin: 0;
    font-size: 12px;
    color: rgba(222, 235, 255, 0.76);
  }

  &:hover {
    transform: translateY(-2px);
    border-color: rgba(85, 170, 255, 0.9);
    background: rgba(26, 78, 164, 0.32);
  }
}

.footer-cta {
  width: min(1220px, calc(100% - 42px));
  margin: 0 auto;
  padding: 10px 0 48px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 16px;

  h3 {
    margin: 0;
    font-size: clamp(22px, 2.4vw, 34px);
    letter-spacing: -0.4px;
  }
}

@keyframes scroll-x {
  from {
    transform: translateX(0);
  }
  to {
    transform: translateX(-50%);
  }
}

@media (max-width: 1024px) {
  .hero-switcher {
    display: none;
  }

  .case-layout {
    grid-template-columns: 1fr;

    .case-main,
    .case-side {
      grid-row: auto;

      img {
        height: 260px;
      }
    }
  }

  .ability-grid,
  .entry-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .topbar {
    flex-wrap: wrap;
    gap: 10px;
  }
}

@media (max-width: 720px) {
  .topbar {
    padding: 12px 12px;
  }

  .nav-links {
    display: none;
  }

  .hero {
    padding: 108px 12px 20px;
  }

  .hero-inner h1 {
    font-size: clamp(34px, 12vw, 56px);
  }

  .hero-prompt {
    flex-direction: column;
    align-items: flex-start;
  }

  .hero-metrics,
  .entry-grid,
  .ability-grid {
    grid-template-columns: 1fr;
    flex-wrap: wrap;
  }

  .top-actions {
    width: 100%;

    .ghost,
    .solid {
      flex: 1;
    }
  }

  .footer-cta {
    flex-direction: column;
    align-items: flex-start;
  }
}
</style>