# SynSight 前端

> SynSight 高校内容风险分析平台前端工程。  
> Copyright (c) 2026 Liu Minghao. All rights reserved.

## 模块定位

`frontend/` 是 SynSight 的 Web 用户界面，负责视频上传、分析任务创建、实时进度展示、分析报告浏览、风险词库管理、通知提醒与用户反馈交互。

后端服务见 `../backend/`。前端通过 REST API、WebSocket 与后端通信，不在浏览器端保存第三方 API Key 或邮件授权码。

## 技术栈

| 类型 | 技术 |
|---|---|
| 框架 | Vue 3 |
| 语言 | TypeScript |
| 构建 | Vite |
| 状态管理 | Pinia |
| UI 组件 | Element Plus |
| 图表 | ECharts / vue-echarts |
| HTTP | Axios |
| 实时通信 | WebSocket |
| 文档导出 | jsPDF / html2canvas |

## 主要目录

| 路径 | 说明 |
|---|---|
| `src/views/` | 页面级视图：上传、分析结果、Dashboard、词库、反馈等 |
| `src/components/` | 通用组件：通知铃、风险图表、分析卡片等 |
| `src/stores/` | Pinia 状态：用户、WebSocket、通知等 |
| `src/composables/` | 组合式逻辑封装 |
| `src/utils/` | 安全、校验、时间轴验证等工具 |
| `src/types/` | 前端领域类型定义 |

## 本地启动

```sh
npm install
npm run dev
```

## 构建检查

```sh
npm run build
```

构建脚本会先执行 TypeScript / Vue 类型检查，再生成生产包。

## 软著申报注意

- 项目名已从默认模板名 `vue3` 调整为 `synsight-frontend`。
- `package-lock.json` 顶部名称已同步。
- 调试验证工具的控制台输出仅在 `import.meta.env.DEV` 环境执行，避免生产构建暴露调试日志。
- 前端不得硬编码七牛云 LLM、SMTP、MinIO、数据库等密钥；AI 扩词等能力必须通过后端受控接口代调。
