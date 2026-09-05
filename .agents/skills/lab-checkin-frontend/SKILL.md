---
name: lab-checkin-frontend
description: lab-checkin 前端模块（web/）开发指南。Use when writing or reviewing frontend code in this repository — Vue 3 SFC components, Element Plus pages, router guards, Pinia stores, the axios request layer, Vite modes/builds, or frontend type errors from vue-tsc. Covers environment badges and the request-shell-stripping convention.
---

# 前端模块开发指南（web/）

Vue 3.5 + Vite 6 + Element Plus + Pinia，全量 `<script setup lang="ts">`，strict 类型（`vue-tsc` 校验）。

## 1. 分层与归属

- `src/api/request.ts`：唯一出口的 Axios 实例。**响应拦截器已剥壳**——`await request.get<T>()` 直接拿到响应体，形状由调用点泛型 `T` 声明；`{ silent: true }` 表示调用方自管错误提示（轮询/探活场景）
- `src/stores/user.ts`：登录态（token + user）与 localStorage 持久化；`isAdmin`/`isLoggedIn` 是唯一角色判断入口
- `src/router/index.ts`：路由表与守卫；`meta.title` 驱动标签页标题，`meta.adminOnly` 仅做体验跳转，**后端必须重新校验**
- `src/config/env.ts`：三环境前端标识（`appEnv.label/tag/baseTitle`），标题后缀与界面徽标的唯一来源
- `src/types.ts`：跨视图 API 行类型（`CheckinRecordRow` / `UserRow`）
- `src/views/`：页面（管理员页面在 `admin/` 子目录）；`components/`：跨页组件（Layout / BrandLogo）

## 2. 编码规范（逐条执行）

1. SFC 一律 `<script setup lang="ts">`；props 用类型声明 `defineProps<{ compact?: boolean }>()`
2. 表单 ref 用 `ref<FormInstance>()`，规则用 `FormRules`；`formRef.value?.validate().catch(() => false)` 是标准取值方式
3. 列表数据 `ref<行类型[]>([])`，行类型来自 `src/types.ts`；el-table 模板内 `{ row }` 不做断言，按 any 使用即可
4. 页面数据获取必须三态齐全：`v-loading` 加载态、`el-empty` 空态、错误态（静默请求用 `silent: true` + 局部 banner，如 Dashboard 轮询）
5. 定时器类型统一 `ReturnType<typeof setInterval>`；组件卸载必须清理 interval 与副作用（如摄像头扫码）
6. 所有请求走 `request.ts`，禁止裸 `fetch`（健康探活除外——它依赖 `res.ok`，不走拦截器）
7. 环境相关展示（徽标/标题）只从 `config/env.ts` 读 `appEnv`，禁止组件里自己判断 `import.meta.env.MODE`
8. 错误提示统一 `ElMessage`，确认/输入弹窗用 `ElMessageBox`；错误文案由拦截器兜底，调用方 catch 里只做静默或状态标记
9. 样式跟随现有视觉体系（`--lab-*` CSS 变量、暖纸色系），新组件优先复用 `el-card` + 现有 class 命名风格
10. 新增页面三步：views 建组件 → router 注册（按需 `meta.adminOnly`）→ Layout 菜单补导航

## 3. 环境与构建

- 构建标识 `VITE_APP_ENV` 由 `web/.env.development / .env.test / .env.production`（入库）注入，缺省回退 `import.meta.env.MODE`；自定义变量先在 `src/vite-env.d.ts` 声明
- `npm run dev`（5173→后端3000）、`npm run dev:test`（5174→3100）、`npm run build`（dist）、`npm run build:test`（dist-test）；产物目录由 vite.config.ts 按 mode 决定，不要手动指定
- 代理目标默认按 mode 区分，个人覆盖用 `web/.env` 的 `VITE_API_PROXY_TARGET`（不入库）

## 4. 常见坑

- `request.ts` 的默认泛型是 `any`（文件级 ESLint 豁免）——调用点尽量写显式泛型，别让 any 蔓延
- `html5-qrcode` 在对话框 `@opened` 后才能初始化；`@closed` 必须停止并清理，否则摄像头占用
- 模板内联箭头参数（如 `@size-change="(s) => ..."`）必须标类型，否则 noImplicitAny 报错
- 动态菜单图标数组要标 `Component` 类型并整体类型化，避免 vue-tsc 对 `:is` 的宽类型告警

## 5. 验证

```bash
cd web && npm run typecheck && npm run lint && npm test && npm run build
```

改了共享契约时连同后端一起验证（见 lab-checkin-testing skill）。
