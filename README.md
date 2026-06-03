# SynSight Frontend

面向高校场景的内容风险分析平台前端工程。

本仓库为 SynSight 的 Vue 3 前端，服务于大创项目展示与网络信息安全类竞赛场景，负责工作台、记录中心、分析结果展示、风险词库管理、通知反馈交互以及任务实时进度呈现。

## 项目定位

`frontend/` 是平台的用户交互层与展示层，主要承担：

- 用户登录、注册、找回密码
- 工作台统计展示
- 视频上传与链接导入入口
- 记录中心与分析详情展示
- 风险词库与管理员页面
- WebSocket 实时状态同步

本仓库不直接运行后端服务，也不直接执行算法推理。  
它通过 REST API 与 WebSocket 与 `../backend` 协作。

## 适用场景

本前端面向：

- 大创项目展示
- 网络信息安全类竞赛路演与答辩
- 高校内容风险分析、舆情治理与结果演示

## 技术栈

| 类别 | 技术 |
| --- | --- |
| 前端框架 | Vue 3 |
| 语言 | TypeScript |
| 构建工具 | Vite |
| 路由 | Vue Router |
| 状态管理 | Pinia |
| UI 组件 | Element Plus |
| 图表 | ECharts / vue-echarts |
| 网络请求 | Axios |
| 实时通信 | WebSocket |
| 报告导出 | jsPDF、html2canvas |

## 主要页面

| 页面 | 说明 |
| --- | --- |
| `Home.vue` | 项目首页 / 展示页 |
| `Auth.vue` | 登录、注册、找回密码 |
| `Dashboard.vue` | 工作台 |
| `RecordsCenter.vue` | 记录中心 |
| `Analysis.vue` | 分析结果页 |
| `Favorites.vue` | 我的收藏 |
| `RiskWordLibrary.vue` | 风险词库管理 |
| `Settings.vue` | 设置页 |
| `Help.vue` | 帮助与文档 |
| `AdminFeedback.vue` | 管理员反馈页 |
| `AdminSettings.vue` | 管理员系统设置页 |

## 主要功能

### 1. 任务创建与接入

- 本地视频上传
- 链接导入任务
- 任务创建后即时插入记录列表

### 2. 任务过程可视化

- WebSocket 实时进度更新
- 顶部状态横幅
- 记录中心状态增量刷新

### 3. 分析结果展示

- 风险标签与结构化字段展示
- 图表与时间轴展示
- 报告预览与导出

### 4. 治理配套能力

- 风险词库包管理
- 收藏与分类
- 用户反馈与通知中心
- 管理员反馈处理与系统设置

## 目录结构

```text
frontend/
├─ src/
│  ├─ api/
│  ├─ components/
│  ├─ composables/
│  ├─ config/
│  ├─ layouts/
│  ├─ router/
│  ├─ stores/
│  ├─ types/
│  ├─ utils/
│  └─ views/
├─ public/
├─ tests/
├─ package.json
└─ 配置说明.md
```

## 本地启动

### 环境要求

- Node.js 20+
- npm

### 安装依赖

```powershell
cd frontend
npm install
```

### 启动开发环境

```powershell
cd frontend
npm run dev
```

默认开发地址通常为：

- `http://localhost:5173`

## 生产构建

```powershell
cd frontend
npm run build
```

该命令会先执行类型检查，再执行生产构建。

## 配置说明

前端运行配置位于：

- `src/config/index.ts`

主要配置项包括：

- `apiBaseUrl`
- `wsBaseUrl`
- `mockMode`
- `timeout`
- `websocket.maxReconnect`
- `websocket.reconnectInterval`
- `websocket.heartbeatInterval`

详细说明请参考 `配置说明.md`。

## 路由与权限

当前页面分为两类：

- 公开页面：首页、登录注册、分享页
- 需要登录页面：工作台、记录中心、分析结果、收藏、词库、设置等

管理员可访问：

- `/admin/feedback`
- `/admin/settings`

## 与后端 / 算法的协同关系

### 与后端

- 调用 REST API 获取数据、创建任务、管理词库与通知
- 通过 WebSocket 接收任务状态与通知事件

### 与算法

- 不直接通信
- 所有算法结果均经由后端统一消费、落库并返回前端

## 项目特点

- 面向高校内容治理场景
- 具备完整的产品展示链路
- 强调任务实时性与结果可解释性
- 适合在大创与网安类比赛中作为前端展示平台使用

## 版权说明

Copyright (c) 2026 Liu Minghao. All rights reserved.
