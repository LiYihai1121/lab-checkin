---
name: lab-trace-delivery
description: lab-trace 项目交付部署指南。Use when the user asks to deploy, release, publish, ship, or roll back the lab-trace project, or asks about Docker / docker-compose / CI / 版本发布 / 上线 / 回滚 / 构建产物 for this repository. Covers the three-environment delivery pipeline, quality gates, container orchestration, and versioning.
---

# lab-trace 交付部署指南

三大环境（开发 / 测试 / 生产）的交付流水线、质量门禁、容器编排与版本发布规范。

## 1. 环境矩阵与可区分标识

| | 开发 | 测试 | 生产 |
|------|------|------|------|
| 启动 | `npm run dev` | `npm run dev:test` | `npm start` |
| 前端端口 | 5173 | 5174 | 同源部署 |
| 后端端口 | 3000 | 3100 | 3000 / 容器 |
| 数据库 | `server/data/lab-checkin.db` | `server/data/lab-checkin-test.db` | `DB_PATH` 指定 |
| 构建产物 | `web/dist-dev` | `web/dist-test` | `web/dist` |
| 容器编排 | 本地开发（不进容器） | compose `--profile test` | compose `--profile prod` |

可区分标识（防止误操作环境）：

- 页面标题后缀：开发/测试为 `电子实验室签到系统（开发/测试环境）`，生产无后缀
- 界面徽标：开发（橙）/ 测试（红）在页头与登录页显示，生产不显示
- `GET /api/health` 返回 `{ status, service, environment, environmentLabel, version, timestamp }`
- 后端启动日志以 `[环境] 开发环境/测试环境/生产环境（NODE_ENV=…）| 版本 v…` 开头

## 2. 质量门禁（大厂交付规范）

三层防线，全部通过才允许进入发布流程：

1. **本地 pre-commit**（`.githooks/`，需 `git config core.hooksPath .githooks`）：按本次变更包自动执行 typecheck + lint；commit-msg 校验 Conventional Commits（`feat/fix/chore/refactor/style/docs/test/perf/ci/build/revert` + 中文描述，scope 可含 `a-zA-Z0-9/_-`，描述 ≤100 字符）。
2. **CI**（`.github/workflows/ci.yml`，push/PR 触发）：后端与前端并行跑 `typecheck + lint + test`；前端追加生产构建（`npm run build`）与测试构建（`npm run build:test`）；另有 `scripts/check-version.ts` 校验 server/web 版本一致。
3. **发布前手动**：`cd web && npm run test` 与 `npm run build`（或 VSCode 任务「全栈：质量门禁」）；双包 lint/format 保持零告警。

代码格式：根 `.prettierrc.json`（120 列/单引号/尾逗号），`npx prettier --check .` 校验、`npm run format` 修复。

## 3. 构建产物

```bash
cd web && npm run build        # 生产 → web/dist
cd web && npm run build:test   # 测试 → web/dist-test
```

产物目录按环境分离，**测试构建不可用于生产**。构建是纯静态文件，由后端同源托管或 Nginx 托管。

### 镜像发布（GHCR）

镜像由 `.github/workflows/release.yml` 自动构建：push `v*` tag 或手动 dispatch（`gh workflow run release.yml -f tag=vX.Y.Z`）触发，发布到 `ghcr.io/liyihai1121/lab-trace`（tag 号 + latest），构建后 CI 内做容器冒烟验收——`/api/health` 必须返回 `environment=production` 且 `version` 与 tag 一致。本机无 Docker 时走此通道；部署机直接 `docker compose --profile prod up -d`（会拉取 GHCR 镜像时需将 compose 的 build 改为 image 引用，或继续本地 build）。

## 4. 部署方式

### 方式一：Docker Compose（推荐，三环境编排见 docker-compose.yml）

```bash
# 测试环境：宿主 3100 端口，environment=test，独立数据卷 lab-trace-test-data
docker compose --profile test up -d --build

# 生产环境：宿主 3000 端口；未设置 JWT_SECRET 时 compose 直接报错拒绝启动
export JWT_SECRET=强随机密钥
docker compose --profile prod up -d --build

docker compose --profile test down   # 停止（数据保留在命名卷）
```

- 同一镜像（`lab-trace:local`），环境差异只在 compose 的 `environment` 与数据卷
- 两套环境自带 `/api/health` 健康自检（wget 探活，30s 间隔）
- 可追加 `CORS_ORIGIN` / `TRUST_PROXY` / `CREATE_DEFAULT_ADMIN` / `ADMIN_PASSWORD`

### 方式二：Docker 单容器（docker build）

```bash
docker build -t lab-trace .
docker run -d -p 3000:3000 -e JWT_SECRET=强随机密钥 \
  -e CREATE_DEFAULT_ADMIN=false -v lab-trace-data:/app/server/data \
  --name lab-trace lab-trace
```

镜像内已设 `NODE_ENV=production`；入口 `node src/index.ts`（Node 24 原生类型剥离）。

### 方式三：裸机 + Nginx

```bash
cd web && npm run build
cd ../server && npm start        # 自动加载 server/.env（复制 .env.production.example）
```

Nginx 将静态资源与 `/api` 反向代理到后端即可；生产变量推荐用系统环境变量或进程管理器注入，而不是写入 `.env`。

## 5. 部署后验收清单

1. `curl http://<host>:<port>/api/health` → 确认 `environment` 字段是预期环境、`version` 正确
2. 打开页面 → 确认标题/徽标与预期环境一致（生产应**无**徽标）
3. 首次启动用默认管理员 `admin` / `admin123`（或 `ADMIN_PASSWORD`）登录，**立即改密**，然后设 `CREATE_DEFAULT_ADMIN=false`
4. 走一遍完整业务流：生成签到码 → 扫码/输码签到 → 签退 → 记录/统计可见
5. 确认数据卷已持久化（容器重建后数据仍在）

## 6. 回滚

- 容器：按镜像 tag 回退（`docker compose --profile prod up -d --no-deps` + 旧镜像），数据在命名卷中不受影响
- 裸机：保留上一版 `web/dist` 备份目录，回滚构建产物 + 重启 `npm start`
- 数据库 schema 向前兼容（幂等建表），回滚旧版本应用不破坏新数据

## 7. 版本与变更记录

- 版本号在 `server/package.json` 与 `web/package.json` 中**必须一致**，由 `npm run version:check`（两包各自）校验，CI 强制
- 显著变更必须记录进 `CHANGELOG.md`（Keep a Changelog 格式，语义化版本）
- 发布流程：改版本号 → 更新 CHANGELOG → 提交（`chore(release): vX.Y.Z`）→ 打 tag → 推送 → 构建镜像（可打 `vX.Y.Z` tag）
