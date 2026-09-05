---
name: lab-trace-security
description: lab-trace 安全审查与安全修改指南。Use when touching auth, passwords, tokens, reset codes, rate limiting, CORS, or any user-input handling in this repository, when reviewing code for security issues before release, or when the Mimosa security hook reports a finding that needs triage. Covers the auth boundary, secret management, injection surfaces, and the pre-release security checklist.
---

# 安全模块指南（lab-trace）

借鉴业界 security-review / 对抗式审查实践：安全改动**先列威胁面再动手**，发布前过一遍自查清单。

## 1. 威胁面地图（改到这些区域必须过第 4 节清单）

| 区域 | 位置 | 威胁 |
|------|------|------|
| 登录/会话 | `middleware/auth.ts`、`routes/auth.ts` | 弱口令爆破、token 伪造、时序侧信道 |
| 找回码 | `routes/users.ts`（生成）、`routes/auth.ts`（消费） | 重放、爆破、明文落日志 |
| 签到码 | `routes/qrcode.ts`、`routes/checkin.ts` | 代签、遍历猜码 |
| 用户输入 | 全部路由 `req.body/params/query` | SQL 注入、XSS 存储、参数污染 |
| 限流 | `index.ts` | 爆破、代理后按假 IP 计数 |
| 跨域/回跳 | `index.ts` CORS、`utils/security.ts` | 未授权来源、开放重定向 |

## 2. 既有安全设计（不许削弱）

1. 密码 bcrypt（10 轮）哈希存储；登录对不存在用户执行同开销 DUMMY_HASH 比较，抹平时序
2. JWT 24h；`authenticate` 实时查库——降级/删号立即失效；生产强制 `JWT_SECRET`，缺失拒绝启动
3. 动态签到码 60s 轮换、服务端校验、密码学安全随机（`crypto.randomInt`，字符集剔除易混淆字符）
4. 找回码 12 位随机、SHA-256 哈希存储、15 分钟过期、一次性（消费与改密同事务）
5. 敏感接口三层限流：登录 10/15min、找回码重置 5/15min、签到 10/min；`TRUST_PROXY` 控制真实 IP
6. 同用户唯一进行中签到由数据库部分唯一索引兜底；签退条件更新防并发双结算
7. `safeRedirect` 只放行站内相对路径（拒绝 `//` 与外部协议）；CORS 默认全放行仅限本地，生产必须 `CORS_ORIGIN`
8. 不记录密码、JWT、找回码明文；错误响应不泄漏内部细节（统一中文 message）

## 3. 修改安全代码的规则

- 新增用户输入消费点：先想「这个字段最坏能是什么」——数组、超长、空字节、模板串
- 权限永远是「后端中间件判定」，前端隐藏菜单只是体验；新增管理接口三件套：`authenticate` + `requireAdmin` + 测试（401/403/200）
- 密钥只经环境变量注入；禁止任何密钥/口令字面量入库（测试口令用随机生成）
- 依赖变更后跑 `npm audit`；锁文件变更要在提交说明里说明原因

## 4. 发布前安全自查清单（对照执行）

- [ ] 新接口全部挂了正确中间件，且测试覆盖 401/403
- [ ] 所有 SQL 参数化，LIKE 有 ESCAPE；无任何字符串拼接 SQL
- [ ] 用户输入展示处无 v-html / 直接 innerHTML
- [ ] 日志中无密码、token、找回码、Cookie
- [ ] 生产环境变量齐全：JWT_SECRET（强随机）、CORS_ORIGIN、CREATE_DEFAULT_ADMIN=false（首启建号后）
- [ ] 限流对新敏感接口同样挂载
- [ ] `npm audit` 无 high/critical；Mimosa 深度扫描通过（钩子误报按 lab-trace-backend 第 4 节 triage）

## 5. Mimosa 钩子处置

扫描钩子（PreToolUse）拦截常见误报：SQL `.get()` 判 SSRF、`db.exec` 判注入、测试口令判硬编码凭据。先按 lab-trace-backend 第 4 节的写法规避/分步重试；确属误报时向用户说明依据，**不要为通过钩子改变运行时安全语义**。git commit/push 时 `scanner_enobufs / library_source` 提示为兼容策略放行，不代表已通过完整审计——正式结论需单独跑完整深度扫描。
