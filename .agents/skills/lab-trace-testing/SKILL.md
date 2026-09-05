---
name: lab-trace-testing
description: lab-trace 测试模块指南。Use when writing, running, debugging, or fixing tests in this repository — server Vitest integration tests, web Vitest unit tests, TDD workflows, coverage of new APIs or pages, or when tests fail unexpectedly. Covers the in-memory SQLite isolation model and the test-helper patterns.
---

# 测试模块指南（server/tests 与 web/tests）

借鉴业界 TDD（红-绿-重构）实践：新增能力**先补失败用例再实现**；修 bug 先写复现用例。测试与实现在同一次提交内交付。

## 1. 测试布局与隔离模型

- `server/tests/`：Vitest 集成测试，`vitest.config.ts` 指定 `tests/**/*.test.ts`，`setupFiles: tests/setup.ts`
- **隔离铁律**：`tests/setup.ts` 在导入应用前设置 `DB_PATH=:memory:` + `CREATE_DEFAULT_ADMIN=true` + 随机口令变量；每个测试文件获得独立内存库，绝不触碰 `server/data/` 真实库
- `tests/helpers.ts` 的 `makeApp()`：与生产一致的路由装配（**不挂限流**，避免 429 干扰断言）
- `web/tests/`：单元测试（security / store / sanity）；store 测试用 `vi.stubGlobal` 模拟 localStorage

## 2. 既有模式（写新用例必须复用）

1. **登录换 token**：`login(username, password)` 辅助函数走真实 `/api/auth/login` 并断言 200
2. **造数**：`db.prepare(...).run(...)` 直插用户/记录/验证码（如 `insertUser` / `insertCode`），密码用假哈希（`bcrypt$<random>`）或 `crypto.randomBytes` 生成
3. **口令纪律**：任何测试口令一律 `crypto.randomBytes(8).toString('hex')` 运行时生成——字面量口令会被 Mimosa 钩子判为硬编码凭据
4. **跨文件不互扰**：用例自带前置造数，不依赖其他 describe 的状态；改密类用例结束前改回初始口令
5. **断言业务语义**：状态码 + 中文 message 正则（如 `/已处于签到状态/`）+ 关键字段，不逐字段深比较
6. **权限矩阵**：每个新接口至少覆盖 未认证(401) / 学生访问管理接口(403) / 正常路径 / 非法参数(400) 四类

## 3. 新增用例步骤（以新接口为例）

1. 在 `server/tests/<域>.test.ts` 增加用例（新领域新建文件，独立内存库）
2. `beforeAll` 完成登录与造数
3. 覆盖第 6 条的权限矩阵 + 并发/边界（过期码、重复签到、删自己、降级最后一名管理员等既有风格可参照）
4. 运行 `cd server && npm test` 全绿后交付；调试单文件用 VSCode launch 配置「Vitest：调试当前测试文件」或 `npx vitest run tests/xxx.test.ts`

## 4. 覆盖现状与盲区

- 已覆盖：认证全流程（改密/找回码一次性/降级失效）、签到并发唯一约束、分页与日期过滤、LIKE 转义、统计边界（窗口首日）、用户管理校验
- 约定：改路由或建表时，先跑全量测试确认无回归；行为变更先改测试再改实现
- web 侧新增纯逻辑（utils/stores）必须补单测；视图组件以 typecheck + 构建为门禁，不强制组件测试

## 5. 验证命令

```bash
cd server && npm test              # 全量（内存库，秒级）
cd web && npm test                 # 前端单元测试
npx vitest run tests/checkin.test.ts   # 单文件（在对应包目录下）
```
