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
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          // 将 node_modules 中的依赖分包
          if (id.includes('node_modules')) {
            // Vue 核心库和 Element Plus 放在一起（Element Plus 强依赖 Vue）
            if (
              id.includes('vue') || 
              id.includes('vue-router') || 
              id.includes('pinia') ||
              id.includes('element-plus')
            ) {
              return 'vue-vendor'
            }
            // ECharts 相关库
            if (id.includes('echarts') || id.includes('vue-echarts')) {
              return 'echarts'
            }
            // PDF 相关库
            if (id.includes('jspdf') || id.includes('html2canvas')) {
              return 'pdf'
            }
            // 其他 node_modules 依赖
            return 'vendor'
          }
        }
      }
    },
    chunkSizeWarningLimit: 1000
  },
})
