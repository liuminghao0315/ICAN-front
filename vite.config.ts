/*
 * SynSight - 高校内容风险分析平台
 * Copyright (c) 2026 Liu Minghao. All rights reserved.
 */

import { fileURLToPath, URL } from 'node:url'

import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import vueDevTools from 'vite-plugin-vue-devtools'
import VueSetupExtend from 'vite-plugin-vue-setup-extend'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    vue(),
    vueDevTools(),
    VueSetupExtend()
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
      'resize-detector': 'element-resize-detector'
    },
  },
  optimizeDeps: {
    include: ['echarts', 'vue-echarts', 'element-resize-detector']
  },
  // B17：生产构建：去 console + 拆 vendor chunk，降低首屏体积
  esbuild: {
    drop: ['console', 'debugger']
  },
  build: {
    target: 'es2020',
    chunkSizeWarningLimit: 1500,
    rollupOptions: {
      output: {
        manualChunks: {
          'vendor-vue': ['vue', 'vue-router', 'pinia'],
          'vendor-element': ['element-plus', '@element-plus/icons-vue'],
          'vendor-echarts': ['echarts', 'vue-echarts'],
          'vendor-utils': ['axios']
        }
      }
    }
  }
})
