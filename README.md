# 实验室签到系统

项目架构说明见 [ARCHITECTURE.md](ARCHITECTURE.md)。

版本管理遵循 [VERSIONING.md](VERSIONING.md)，发布历史见 [CHANGELOG.md](CHANGELOG.md)。

基于 **Vue 3 + Element Plus + Express + SQLite** 的实验室签到签退管理系统，采用动态时效二维码防止代签。

## 功能

### 学生端

- 账号密码登录
- 输入动态码 / 扫描现场二维码完成签到（60 秒有效，过期自动失效）
- 一键签退，实时显示本次已持续时长与今日累计时长
- 个人签到记录查询（支持日期筛选）

### 管理端

- 动态签到二维码大屏展示：倒计时、到期自动轮换，可手动刷新
- 统计看板：在馆人数、今日签到人次、近 30 天趋势图、累计时长 Top 10、当前在馆人员列表（30 秒自动刷新）
- 记录管理：全部签到记录查询（按用户名/姓名/日期筛选）
- 用户管理：学生与管理员账号的增删改查、重置密码

## 技术栈

| 层级 | 技术 |
| --- | --- |
| 前端 | Vue 3 · Vite · Element Plus · Pinia · Vue Router · Axios · ECharts · qrcode |
| 后端 | Node.js (Express) · JWT · bcryptjs |
| 数据库 | SQLite（Node.js 内置 `node:sqlite` 模块，无需安装数据库服务） |

## 快速开始

要求：Node.js ≥ 22.5（使用内置 sqlite 模块）。

```bash
# 终端 1：启动后端（端口 3000）
cd server
npm install
npm run dev

# 终端 2：启动前端（端口 5173）
cd web
npm install
npm run dev
```

浏览器访问 <http://localhost:5173>。

**默认管理员账号：`admin` / `admin123`**（首次登录后请修改密码；学生账号由管理员在"用户管理"中创建）

## 使用流程

1. 管理员登录 → 「签到二维码」→ 生成动态二维码并投屏
2. 学生手机扫描屏幕二维码（自动打开签到页并填入验证码），或手动输入 6 位签到码
3. 离开实验室时点击「签退」，系统自动计算本次时长
4. 管理员在「统计看板」查看出勤情况

忘记密码时，联系管理员在「用户管理」中生成一次性找回码，再在「忘记密码」页面输入用户名、找回码和新密码完成重置。找回码 15 分钟内有效且只能使用一次。

> 局域网使用提示：管理员页面若通过局域网 IP 访问（如 `http://192.168.x.x:5173`），生成的二维码链接同样指向该 IP，同一 WiFi 下的手机可直接扫码打开。

## 项目结构

```text
lab-checkin/
├── server/                  # 后端
│   ├── data/                # SQLite 数据库文件（自动创建）
│   ├── tests/               # Vitest 集成测试（内存库，不污染开发库）
│   └── src/
│       ├── index.js         # 入口，挂载路由与限流中间件
│       ├── db/database.js   # 建库建表 + 默认管理员初始化
│       ├── middleware/auth.js  # JWT 认证 + 角色权限
│       ├── utils/helpers.js # 密码哈希 / 分页 / LIKE 转义等共享工具
│       └── routes/
│           ├── auth.js      # 登录 / 当前用户 / 修改密码 / 找回码重置
│           ├── users.js     # 用户管理（管理员）
│           ├── checkin.js   # 签到 / 签退 / 状态
│           ├── qrcode.js    # 动态签到码生成（管理员）
│           ├── records.js   # 我的记录 / 全部记录
│           └── stats.js     # 概览 / 日趋势 / 时长排行
└── web/                     # 前端
    └── src/
        ├── api/request.js   # axios 封装（token 注入、401 处理、silent 模式）
        ├── stores/user.js   # 登录状态（Pinia）
        ├── router/index.js  # 路由守卫（登录校验、admin 权限、404 兜底）
        ├── components/
        │   ├── Layout.vue   # 侧栏导航 + 顶栏 + 修改密码
        │   └── BrandLogo.vue
        └── views/
            ├── Login.vue          # 登录页（含服务健康探活）
            ├── ForgotPassword.vue # 找回码重置密码
            ├── Checkin.vue        # 签到签退（支持扫码）
            ├── MyRecords.vue      # 我的记录
            ├── NotFound.vue       # 404 兜底页
            └── admin/
                ├── Dashboard.vue    # 统计看板
                ├── QrCodeView.vue   # 动态二维码
                ├── RecordsAdmin.vue # 记录管理
                └── UsersAdmin.vue   # 用户管理
```

## API 一览

| 方法 | 路径 | 权限 | 说明 |
| --- | --- | --- | --- |
| GET | `/api/health` | 公开 | 服务健康检查 |
| POST | `/api/auth/login` | 公开 | 登录，返回 JWT |
| POST | `/api/auth/password/reset` | 公开 | 使用管理员找回码重置密码 |
| GET | `/api/auth/me` | 登录 | 当前用户信息 |
| PUT | `/api/auth/password` | 登录 | 修改自己的密码 |
| POST | `/api/qrcode/generate` | 管理员 | 生成 60s 有效签到码 |
| GET | `/api/checkin/status` | 登录 | 当前签到状态 + 今日汇总 |
| POST | `/api/checkin/in` | 登录 | 签到（需有效动态码） |
| POST | `/api/checkin/out` | 登录 | 签退 |
| GET | `/api/records/my` | 登录 | 我的记录（分页/日期筛选） |
| GET | `/api/records/all` | 管理员 | 全部记录（分页/关键字/日期） |
| GET/POST/PUT/DELETE | `/api/users` | 管理员 | 用户增删改查 |
| POST | `/api/users/:id/password-reset-token` | 管理员 | 生成一次性密码找回码（12 位，15 分钟有效） |
| GET | `/api/stats/overview` | 管理员 | 实时概览 + 在馆列表 |
| GET | `/api/stats/daily?days=30` | 管理员 | 每日签到人次 |
| GET | `/api/stats/ranking` | 管理员 | 累计时长 Top 10 |

## 安全设计

- 密码 bcrypt 哈希存储；JWT 有效期 24 小时；生产环境强制要求设置 `JWT_SECRET`
- 登录、找回码重置、签到接口限流（防暴力破解）；签到码使用密码学安全随机数
- 动态签到码 60 秒过期并轮换，防止截图外传代签；同一用户同时仅允许一条进行中签到（数据库唯一约束兜底）
- 密码找回码由管理员生成，12 位、15 分钟过期且使用后失效，不依赖邮箱或手机号
- 角色权限中间件：学生无法访问管理接口；禁止删除自己、至少保留一名管理员

## 环境变量

| 变量 | 说明 |
| --- | --- |
| `JWT_SECRET` | JWT 签名密钥，**生产环境必填**（缺失时启动失败） |
| `PORT` | 后端端口，默认 3000 |
| `CORS_ORIGIN` | 允许的前端来源，多个用英文逗号分隔；未设置时放行所有来源 |
| `TRUST_PROXY` | 经反向代理部署时设为 `true`（或跳数），使限流按真实客户端 IP 计数 |
| `DB_PATH` | 自定义 SQLite 文件路径（目录需已存在，`:memory:` 为内存库；默认 `server/data/lab-checkin.db`） |
| `ADMIN_PASSWORD` | 首次启动创建的默认管理员密码，默认 `admin123` |
| `CREATE_DEFAULT_ADMIN` | 设为 `false` 禁止首次启动自动创建默认管理员 |

## 测试

```bash
cd server && npm test   # 后端集成测试（独立内存库，不影响开发数据）
cd web && npm test      # 前端测试
```

## 生产部署

```bash
cd web && npm run build     # 产物在 web/dist
cd ../server && npm start   # 后端默认 3000 端口
```

用 Nginx 等将静态资源 `web/dist` 与 `/api` 反向代理到后端即可。生产环境请通过环境变量覆盖 JWT 密钥：

```bash
JWT_SECRET=你的随机密钥 PORT=3000 npm start
```

跨域部署时可通过 `CORS_ORIGIN` 指定允许的前端地址，多个地址用英文逗号分隔：

```bash
JWT_SECRET=你的随机密钥 CORS_ORIGIN=https://lab.example.com npm start
```
