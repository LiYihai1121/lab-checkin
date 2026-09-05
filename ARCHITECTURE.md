# 当前项目架构

## 1. 总体结构

项目由两个独立的 Node.js 包组成：

```mermaid
flowchart LR
  Browser[Vue 3 Web SPA] --> Axios[Axios /api 客户端]
  Axios --> Express[Express API]
  Express --> Auth[JWT + 角色权限]
  Express --> Routes[业务路由模块]
  Routes --> SQLite[(Node.js 内置 SQLite)]
  Admin[管理员浏览器] --> QR[动态二维码展示]
  QR --> Browser
```

- `web/`：Vue 3 + Vite 单页应用，负责页面、路由、交互和图表。
- `server/`：Express 模块化单体 API，负责认证、权限、业务规则和数据库访问。
- `server/data/`：运行时 SQLite 数据库目录，不应提交数据库文件。
- 当前没有根级 `package.json`，前后端需要分别安装、启动和构建。

## 2. 前端架构

```text
web/src/
├── api/request.js       Axios 实例、Token 注入、401 处理
├── stores/user.js       Pinia 登录状态和用户角色
├── router/index.js      路由定义、登录守卫、管理员守卫
├── components/
│   ├── Layout.vue       登录后的侧栏、顶部栏和主内容容器
│   └── BrandLogo.vue    电子实验室品牌 Logo
└── views/
    ├── Login.vue        登录
    ├── ForgotPassword.vue 密码找回
    ├── Checkin.vue      签到、签退、摄像头/相册扫码
    ├── MyRecords.vue    学生个人记录
    └── admin/
        ├── Dashboard.vue    管理统计看板
        ├── QrCodeView.vue   动态二维码生成与展示
        ├── RecordsAdmin.vue 全部记录管理
        └── UsersAdmin.vue   用户和找回码管理
```

### 前端数据流

1. 页面通过 `api/request.js` 调用 `/api`。
2. 请求拦截器从 Pinia 用户状态读取 JWT，并写入 `Authorization: Bearer ...`。
3. 响应遇到 401 时清理登录状态并跳转登录页。
4. 路由守卫负责用户体验层面的访问控制；真正的权限必须由后端再次校验。
5. 签到页使用 `html5-qrcode` 扫描摄像头或图片中的二维码，提取 `code` 后调用签到接口。

## 3. 后端架构

```text
server/src/
├── index.js              Express 入口、CORS、JSON、中间件和路由注册
├── middleware/auth.js    JWT 签发、登录认证、管理员认证
├── db/database.js        SQLite 初始化、表结构、时间工具、默认管理员
└── routes/
    ├── auth.js           登录、当前用户、修改/找回密码
    ├── users.js          管理员用户管理和一次性找回码
    ├── checkin.js        签到、签退、当前状态
    ├── qrcode.js         60 秒动态签到码
    ├── records.js        个人记录和管理员全部记录
    └── stats.js          概览、趋势、时长排行
```

后端采用共享数据库模块直接执行参数化 SQL，没有额外 ORM 或服务层。新增接口时，应优先放入对应业务路由；只有跨模块复用的规则才考虑抽取服务模块。

## 4. 权限边界

- 公开接口：健康检查、登录、使用管理员找回码重置密码。
- 登录接口：当前用户、修改自己的密码、签到签退、个人记录。
- 管理员接口：二维码生成、全部记录、统计、用户管理、生成密码找回码。
- 后端路由通过 `authenticate` 校验 JWT，通过 `requireAdmin` 校验管理员角色。
- 前端 `adminOnly` 仅用于导航体验，不能代替后端授权。

## 5. 核心业务流程

### 动态二维码签到

```mermaid
sequenceDiagram
  participant A as 管理员页面
  participant S as Express API
  participant DB as SQLite
  participant U as 学生页面

  A->>S: POST /api/qrcode/generate
  S->>DB: 保存 60 秒有效签到码
  S-->>A: 返回 code 和 expiresAt
  A->>A: 生成二维码并投屏
  U->>U: 摄像头或相册扫描二维码
  U->>S: POST /api/checkin/in + code
  S->>DB: 校验有效期、用户状态并创建记录
  S-->>U: 返回签到结果
```

### 密码找回

管理员在用户管理中生成一次性找回码。服务端只保存找回码的 SHA-256 摘要，找回码 15 分钟有效且使用后失效；用户通过用户名、找回码和新密码完成重置。

## 6. 数据模型

- `users`：账号、密码哈希、姓名和角色。
- `checkin_codes`：动态签到码、创建时间和过期时间。
- `checkin_records`：签到时间、签退时间、持续时长和状态。
- `password_reset_tokens`：用户、找回码摘要、过期时间和使用时间。

密码使用 `bcryptjs` 哈希；JWT 默认有效期为 24 小时。服务端时间是签到和过期判断的依据，客户端时间只用于显示倒计时。

## 7. 运行与验证

```bash
# 后端
cd server
npm install
npm run dev

# 前端
cd web
npm install
npm run dev
npm run build
```

后端目前没有稳定的独立测试脚本约定时，至少对改动的 `.js` 文件运行 `node --check`；修改前端时运行 `npm run build`。完整命令和部署说明见 [README.md](README.md)。

## 8. App 演进建议

当前 Web SPA 可以通过 Capacitor 打包为 Android/iOS：

- 复用 `web/src` 的页面、路由、状态和 API 层。
- 将 `html5-qrcode` 替换为 Capacitor 原生条码扫描插件，改善摄像头权限和扫码体验。
- 学生端可打包为 App，管理员端继续保留 Web 管理后台。
- 小规模部署可继续使用 SQLite；多人并发或服务器集群部署时迁移 PostgreSQL。
- 签到仍必须在线由服务端校验，不能把动态码验证完全放到 App 本地。

## 9. 后续发展路线

项目建议从“实验室签到工具（LabTrace）”逐步发展为“校园实验室出入管理平台”。演进原则是先保证当前单实验室场景稳定，再扩展多实验室、预约和组织管理，不提前引入不必要的微服务复杂度。

### 阶段一：稳定性与安全（近期）

1. ✅ 修复并稳定后端测试环境，覆盖登录、签到、签退、权限、二维码过期和密码找回（Vitest 集成测试 + 内存库隔离，见 `server/tests/`）。
2. 引入数据库迁移机制，避免仅依靠 `CREATE TABLE IF NOT EXISTS` 管理结构变化。
3. 将签到、用户、二维码等业务规则从路由中逐步抽离到 `services/`。
4. ✅（部分完成）登录、找回码重置与签到已接入接口限流；找回码按账号限次与审计日志待做。
5. ✅（部分完成）生产环境强制要求 `JWT_SECRET`；认证中间件实时读取用户，角色调整与账号删除后旧 Token 立即失效；密码重置后旧 Token 吊销与强制 HTTPS 待做。

### 阶段二：管理能力（中期）

- 增加实验室、房间和开放时间配置。
- 支持按实验室、班级、课程或课题组设置进入权限。
- 增加预约进入、黑名单、异常签到和迟到统计。
- 增加 Excel/CSV 导出、月度报表和数据归档。
- 增加管理员操作审计和签到异常告警。

这一阶段的产品目标是从“学生扫码签到”扩展为“人员、空间、权限和出入记录的一体化管理”。

### 阶段三：App 化（中后期）

```text
Vue 3 Web SPA
  ↓
Capacitor
  ↓
Android / iOS 学生端
```

- 复用现有页面、Pinia、路由和 API 层，不重写业务前端。
- 学生端使用原生条码扫描能力，改善摄像头权限和扫码体验。
- 可增加推送通知、生物识别解锁和 App 原生权限管理。
- 管理员端继续使用 Web 后台，减少双端维护成本。

### 阶段四：部署扩展（按规模演进）

```mermaid
flowchart LR
  A[单实验室<br/>Express + SQLite] --> B[服务器部署<br/>Nginx + HTTPS]
  B --> C[多人并发<br/>PostgreSQL]
  C --> D[多实验室<br/>Redis + 通知服务]
```

- 单实验室或小规模部署继续使用 SQLite。
- 多管理员、多人并发或集中式服务器部署时迁移 PostgreSQL。
- 多实验室和高并发场景再引入 Redis、通知服务和对象存储。
- 签到验证始终由服务端完成；动态码、签到时间和权限不能完全依赖 App 本地。

### 推荐实施顺序

1. 测试环境和数据库迁移。
2. 业务服务层和审计日志。
3. 登录、找回码和 Token 安全控制。
4. 多实验室与预约模型。
5. Capacitor Android 学生端。
6. PostgreSQL 和更大规模部署。
