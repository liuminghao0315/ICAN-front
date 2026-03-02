import { defineStore } from 'pinia'
import { ref } from 'vue'

export type ThemeMode = 'light' | 'dark' | 'system'
export type Language = 'zh-CN' | 'en-US'

export const useSettingsStore = defineStore('settings', () => {
  const themeMode = ref<ThemeMode>('system')
  const language = ref<Language>('zh-CN')

  const getThemeVars = (theme: 'light' | 'dark') => {
    return theme === 'dark'
      ? {
          '--bg-page': '#0f1117',
          '--bg-card': '#1a1d2e',
          '--bg-hover': '#22263a',
          '--bg-input': '#22263a',
          '--bg-icon': '#22263a',
          '--border-color': '#2e3248',
          '--text-primary': '#e8eaf6',
          '--text-secondary': '#9ba3c4',
          '--text-tertiary': '#5a6080',
          '--color-primary': '#409EFF',
          '--dashboard-loading-mask-bg': 'rgba(15, 17, 23, 0.68)',
          '--analysis-loading-mask-bg': 'rgba(15, 17, 23, 0.72)'
        }
      : {
          '--bg-page': '#F5F7FA',
          '--bg-card': '#FFFFFF',
          '--bg-hover': '#F5F7FA',
          '--bg-input': '#FFFFFF',
          '--bg-icon': '#F5F7FA',
          '--border-color': '#EBEEF5',
          '--text-primary': '#303133',
          '--text-secondary': '#606266',
          '--text-tertiary': '#909399',
          '--color-primary': '#409EFF',
          '--dashboard-loading-mask-bg': 'rgba(255, 255, 255, 0.78)',
          '--analysis-loading-mask-bg': 'rgba(255, 255, 255, 0.78)'
        }
  }

  // 应用主题到 <html> 元素（同时同步内联变量，确保运行时切换立即生效）
  function applyTheme(mode: ThemeMode) {
    const html = document.documentElement
    const resolvedTheme: 'light' | 'dark' = mode === 'system'
      ? (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light')
      : mode

    html.setAttribute('data-theme', resolvedTheme)
    html.style.colorScheme = resolvedTheme

    // 首屏预注入变量会成为内联样式；这里在运行时也同步更新，避免切换主题后不刷新不生效
    const themeVars = getThemeVars(resolvedTheme)
    Object.entries(themeVars).forEach(([key, value]) => {
      html.style.setProperty(key, value)
    })
  }

  function setTheme(mode: ThemeMode) {
    themeMode.value = mode
    applyTheme(mode)
  }

  function setLanguage(lang: Language) {
    language.value = lang
  }

  // 初始化时应用主题
  function init() {
    // 兼容旧版本：若还在使用 localStorage.theme，则迁移到 themeMode
    const hasAppSettings = !!localStorage.getItem('app-settings')
    const legacyTheme = localStorage.getItem('theme')
    if (!hasAppSettings && (legacyTheme === 'light' || legacyTheme === 'dark')) {
      themeMode.value = legacyTheme
      localStorage.removeItem('theme')
    }

    applyTheme(themeMode.value)
    // 监听系统主题变化（仅 system 模式下生效）
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
      if (themeMode.value === 'system') {
        applyTheme('system')
      }
    })
  }

  return { themeMode, language, setTheme, setLanguage, init }
}, {
  persist: {
    key: 'app-settings',
    pick: ['themeMode', 'language']
  }
})
