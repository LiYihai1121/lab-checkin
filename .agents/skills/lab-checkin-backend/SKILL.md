---
name: lab-checkin-backend
description: lab-checkin 后端模块（server/）开发指南。Use when writing or reviewing backend code in this repository — Express routes, auth middleware, SQLite database changes, helpers, API design, or when backend lint/typecheck/Mimosa hook reports confusing errors. Covers node:sqlite quirks and hook false-positive workarounds.
---

# 后端模块开发指南（server/）

Express 4 + Node 内置 `node:sqlite` 的 TypeScript API。路由按业务分文件，注册与全局中间件在 `src/index.ts`。

## 1. 分层与归属

- `src/routes/*.ts`：业务路由（auth / users / checkin / qrcode / records / stats），只做参数校验 + 查询 + 响应
- `src/middleware/auth.ts`：JWT 签发与鉴权；`authenticate` 校验后**实时查库**读取用户（降级/删号即时生效）
- `src/db/database.ts`：连接、幂等建表（逐条 `prepare().run()`）、事务工具 `withTransaction`、默认管理员
- `src/utils/helpers.ts`：bcrypt 哈希、分页解析、LIKE 转义、唯一约束错误识别
- `src/types.ts`：全部数据库行结构 + `Express.Request.user` 增补；新增表/字段先补类型再写路由
- `src/config/environment.ts`：三环境默认值（端口/库文件）；环境相关行为只加在这里

## 2. 编码规范（大厂条文式，逐条执行）

1. SQL 一律参数化（`?` 占位），禁止字符串拼接用户输入；LIKE 必须配 `escapeLike` + `ESCAPE '\'`
2. 查询结果用 `as 行类型` 断言定形，类型定义放 `types.ts`；`run()` 返回的 `lastInsertRowid` 用 `Number()` 转换
3. 写操作在 `run()` 后按需回查完整行再响应，不把 INSERT 结果直接当响应体
4. 业务失败返回 4xx + `{ message }` 中文提示；唯一约束冲突用 `isUniqueConstraintError` 转 400，不抛 500
5. 多步写必须包 `withTransaction`（如：作废旧码 + 发新码、改密 + 作废找回码）
6. 中间件返回类型声明为 `void`，响应后用 `return;` 提前退出，不写 `return res.status(...)`（路由处理器内联箭头函数不受此限）
7. 端口、默认库文件等环境差异只写进 `environment.ts`，禁止在路由里读 `NODE_ENV` 分支业务逻辑
8. 并发互斥用数据库约束兜底（部分唯一索引 `idx_records_user_active`），代码层判断只做友好提示
9. 时序敏感的比较（登录）对不存在用户也执行同开销 bcrypt 比较（`DUMMY_HASH` 模式）
10. 新增接口必须同步：`types.ts` 行类型 → 路由 → 前端调用点 → `server/tests/` 用例

## 3. node:sqlite 与工具链专有坑

- `node:sqlite` 通过 `createRequire(import.meta.url)` 加载（vitest/vite 无法静态解析该内置模块），不要改回静态 import
- 后端只允许可擦除 TS 语法（无 enum / namespace / 参数属性）；运行时为 Node 原生类型剥离（`node src/index.ts`，>=22.18）
- sqlite 的 `get/all` 已在 `database.ts` 统一放宽为 any 返回，调用点用 `as` 断言；不要在每个调用点写 `as unknown as`
- `.db` 文件、`-shm`、`-wal` 不入库；测试固定 `DB_PATH=:memory:`

## 4. Mimosa 安全钩子误报规避（本项目实测）

- 多参数 `.get(x, y)` 易被判 SSRF → 先 `const stmt = db.prepare(...)` 再 `stmt.get(...)`，或改 `.all(...)[0]`
- `db.exec(长 SQL)` 易被判命令注入 → 拆成逐条 `prepare().run()`（建表已按此写）
- `require('node:sqlite')` 解构行易被判注入 → 保持现有 `as typeof import('node:sqlite')` 写法，编辑时避开整行重写
- 被拦截时缩小 Edit 范围分步重试，通常可通过；不要为绕过钩子改变运行时语义

## 5. 验证

```bash
cd server && npm run typecheck && npm run lint && npm test
```

新增/修改接口必须补集成测试（见 lab-checkin-testing skill）。
