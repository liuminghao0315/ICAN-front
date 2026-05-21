/// <reference types="vite/client" />

/**
 * C16：自定义环境变量类型声明
 * 配合 vite.config / config/index.ts 的环境变量驱动模式（C20）
 *
 * VITE_API_BASE_URL  - 后端 API 基础地址；留空则使用相对路径，由 nginx 反代到 Java
 * VITE_WS_BASE_URL   - WebSocket 基础地址；留空则按 window.location 推导（同源）
 */
interface ImportMetaEnv {
  readonly VITE_API_BASE_URL?: string
  readonly VITE_WS_BASE_URL?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}

declare module '*.vue' {
  import type { DefineComponent } from 'vue'
  const component: DefineComponent<{}, {}, any>
  export default component
}
