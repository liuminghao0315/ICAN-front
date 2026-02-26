import { defineStore } from 'pinia'
import { ref, watch } from 'vue'

export type ThemeMode = 'light' | 'dark' | 'system'
export type Language = 'zh-CN' | 'en-US'

export const useSettingsStore = defineStore('settings', () => {
  const themeMode = ref<ThemeMode>('system')
  const language = ref<Language>('zh-CN')

  // 应用主题到 <html> 元素
  function applyTheme(mode: ThemeMode) {
    const html = document.documentElement
    if (mode === 'dark') {
      html.setAttribute('data-theme', 'dark')
    } else if (mode === 'light') {
      html.setAttribute('data-theme', 'light')
    } else {
      // system: 跟随系统
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
      html.setAttribute('data-theme', prefersDark ? 'dark' : 'light')
    }
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
