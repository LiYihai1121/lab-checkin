---
name: lab-trace
description: LabTrace 电子实验室签到系统开发助手。Use whenever the user works on the lab-trace repository, asks about the check-in/check-out system, or needs to change, debug, test, or deploy this Vue 3 + Express + SQLite project. This is the overview skill with global conventions — module-level work should also load the matching skill (backend / frontend / testing / security / delivery).
---

# LabTrace 项目开发指南

Vue 3 + Vite 前端与 Express + SQLite 后端组成的 TypeScript 实验室签到签退管理系统。前后端是两个独立 Node.js 包（全部 `.ts` 与 `lang="ts"` SFC，strict 模式），无根级 `package.json`。

## 0. 模块 skill 导航（按改动区域选用）

本仓库的 skill 按模块拆分（大厂团队惯例：模块化 skill 随 git 共享），本文件是总览与全局约定，具体改动请加载对应模块 skill：

| 模块 | Skill | 触发场景 |
|------|-------|----------|
| 后端 API / 数据库 | `lab-trace-backend` | 路由、中间件、SQL、建表、后端报错与钩子误报 |
| 前端页面 | `lab-trace-frontend` | Vue 组件、路由、store、请求层、构建与环境标识 |
| 测试 | `lab-trace-testing` | 写/跑/修测试，TDD 流程，测试失败排查 |
| 安全 | `lab-trace-security` | 认证、密钥、找回码、限流、发布前安全自查 |
| 交付部署 | `lab-trace-delivery` | 部署、发布、回滚、Docker/Compose、CI、版本 |

## 1. 项目结构速查

```text
lab-trace/
├── server/                          # 后端（Express API）
│   ├── src/
│   │   ├── index.ts                 # 入口：CORS、限流、静态托管、路由注册
│   │   ├── config/environment.ts    # 三环境定义（名称/标签/默认端口/默认库文件）
│   │   ├── types.ts                 # 数据库行结构 + req.user 类型增补
│   │   ├── middleware/auth.ts       # JWT 签发、authenticate、requireAdmin
│   │   ├── db/database.ts           # SQLite 初始化、建表、默认管理员
│   │   ├── utils/helpers.ts         # bcrypt 哈希、分页、LIKE 转义、约束错误识别
│   │   └── routes/                  # auth / users / checkin / qrcode / records / stats
│   ├── tests/                       # Vitest 集成测试（内存库隔离）
│   ├── .env.development / .env.test # 入库的环境文件（无密钥）
│   └── data/                        # 运行时 SQLite 数据库（不提交）
├── web/                             # 前端（Vue 3 SPA）
│   ├── src/
│   │   ├── api/request.ts           # Axios 实例：baseURL=/api、token 注入、401 跳转、silent 选项
│   │   ├── config/env.ts            # 三环境前端标识（标题/徽标/控制台横幅）
│   │   ├── types.ts                 # API 行类型（CheckinRecordRow / UserRow）
│   │   ├── stores/user.ts           # Pinia 登录状态与角色
│   │   ├── router/index.ts          # 路由守卫（登录 / admin / 404）
│   │   ├── components/              # Layout / BrandLogo
│   │   └── views/                   # Login / Checkin / MyRecords / ForgotPassword / NotFound / admin/*
│   ├── .env.development/.test/.production  # 构建标识 VITE_APP_ENV（入库）
│   └── vite.config.ts               # 按 mode 区分端口/代理/产物目录
├── .githooks/                       # pre-commit 门禁 + commit-msg 提交规范（core.hooksPath 指向此处）
└── docker-compose.yml               # test/prod 交付编排
```

## 2. 本地开发（三环境）

| 环境 | 后端 | 前端 | 数据库 |
|------|------|------|--------|
| 开发（默认） | `cd server && npm run dev`（3000） | `cd web && npm run dev`（5173） | `server/data/lab-checkin.db` |
| 测试 | `cd server && npm run dev:test`（3100） | `cd web && npm run dev:test`（5174） | `server/data/lab-checkin-test.db` |
| 生产 | `npm start` | `npm run build`（产物 dist） | `DB_PATH` 指定 |

- 环境差异默认值集中在 `server/src/config/environment.ts` 与 `web/src/config/env.ts`，前端靠 `VITE_APP_ENV` 注入标识（标题后缀、界面徽标、`/api/health` 的 `environment` 字段）
- 覆盖配置：系统环境变量 > 环境文件；个人覆盖放 `server/.env` / `web/.env`（均已被 git 忽略），有密钥的文件一律不入库
- 首次克隆需执行 `git config core.hooksPath .githooks` 启用提交钩子
- 调试：VSCode launch.json 已配置三环境后端/前端/浏览器与 Vitest 调试

## 3. 修改约定

- 保持 ES module（`"type": "module"`）与 strict TypeScript；后端只允许可擦除 TS 语法（无 enum/namespace/参数属性），运行时走 Node 原生类型剥离。
- 环境相关行为加到 `environment.ts` / `env.ts`，不要散落在调用点。
- 前端始终通过 `web/src/api/request.ts` 访问 `/api`（响应已剥壳，形状由调用点泛型声明）；新增接口同步更新调用点。
- 受保护路由用 `authenticate`，管理员接口再加 `requireAdmin`；不要只依赖前端 `meta.adminOnly`。
- 密码走 bcryptjs，token 走 JWT 中间件，数据库访问走 `database.ts`；不记录密码、JWT、找回码明文。
- SQLite 文件在 `server/data/` 运行时创建，不提交 `.db` 文件。
- 提交信息用 Conventional Commits（`feat/fix/chore/refactor/style/docs/test/perf/ci/build/revert` + 中文描述），pre-commit 会自动跑变更包的 typecheck + lint。

## 4. 认证与权限边界

| 类型 | 接口示例 | 中间件 |
|------|----------|--------|
| 公开 | `POST /api/auth/login`、`POST /api/auth/password/reset`、`GET /api/health` | 无 |
| 登录可访问 | `GET /api/auth/me`、`PUT /api/auth/password`、签到签退、个人记录 | `authenticate` |
| 管理员 | 二维码生成、用户管理、全部记录、统计 | `authenticate` + `requireAdmin` |

## 5. 常见任务

### 新增后端接口

1. 找到对应业务路由文件（如 `server/src/routes/checkin.ts`），按需加 `authenticate` / `requireAdmin`。
2. 参数化 SQL 访问数据库；行结构类型加到 `server/src/types.ts` 并在查询结果上 `as` 断言。
3. 同步更新前端调用（视图内 `request.ts` 或 `web/src/api/`）。

### 新增前端页面

1. 在 `web/src/views/`（管理员页面放 `admin/`）创建 `<script setup lang="ts">` 组件。
2. 在 `web/src/router/index.ts` 注册路由，按需加 `meta.adminOnly`；标题由 `appEnv.baseTitle` 自动拼接环境标识。
3. 在 `web/src/components/Layout.vue` 的菜单中补充导航项；数据获取加 loading、empty、error 状态。

### 修改密码或认证相关

- 同时检查 `middleware/auth.ts`、`routes/auth.ts` 与前端 `stores/user.ts`、`Login.vue`；密码重置涉及 `routes/users.ts` 的找回码生成。

### 调整数据库结构

- 结构由 `server/src/db/database.ts` 的幂等建表语句管理（逐条 `prepare().run()`）；修改后检查 `server/tests/` 的影响（内存库重新初始化）。

## 6. 验证流程

```bash
cd server && npm run typecheck && npm run lint && npm test
cd web    && npm run typecheck && npm run lint && npm test && npm run build
```

改了共享 API 契约时双包验证都要跑；VSCode 任务「全栈：质量门禁」可一键执行全部。

## 7. 环境变量

| 变量 | 说明 |
|------|------|
| `JWT_SECRET` | 生产环境必填，否则启动失败 |
| `PORT` | 后端端口（默认按环境：开发/生产 3000、测试 3100） |
| `CORS_ORIGIN` | 允许的前端来源，多个用逗号分隔 |
| `DB_PATH` | SQLite 路径；`:memory:` 为内存库（默认按环境区分文件名） |
| `ADMIN_PASSWORD` | 默认管理员密码，默认 `admin123` |
| `CREATE_DEFAULT_ADMIN` | `false` 时禁止自动创建默认管理员 |
| `TRUST_PROXY` | 反向代理部署时设 `true`，限流按真实 IP 计数 |

## 8. 不要做的事

- 不引入额外 SQLite 驱动或 ORM；使用 Node 内置 `node:sqlite`（经 `createRequire` 加载，vitest/vite 无法静态解析该内置模块）。
- 不把真实数据库路径用于测试；测试固定 `:memory:`，不提交 `server/data/` 下的数据库文件。
- 不把签到码验证逻辑放到客户端；动态码必须由服务端校验。
- 不提交有密钥的环境文件；`.agents/`、`.zcode/` 等本地工具目录不放入 git。
- 不按名称批量结束 `node.exe` 进程；停止进程按精确 PID 处理。
- 部署、发布、回滚、容器编排细节见 lab-trace-delivery skill。
