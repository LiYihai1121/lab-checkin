# 版本管理规范

本项目采用面向生产的 **Semantic Versioning 2.0.0（SemVer）**，并将 `server/` 与 `web/` 视为同一产品的两个交付单元。两者版本号必须保持一致。

## 版本号规则

版本格式为 `MAJOR.MINOR.PATCH`，正式版本从 `1.0.0` 开始：

| 类型 | 触发条件 | 示例 |
| --- | --- | --- |
| MAJOR | 不兼容的 API、数据库或部署变更 | `1.0.0` -> `2.0.0` |
| MINOR | 向后兼容的新功能 | `1.0.0` -> `1.1.0` |
| PATCH | 向后兼容的缺陷、安全或性能修复 | `1.0.0` -> `1.0.1` |

预发布版本使用 `MAJOR.MINOR.PATCH-rc.N`，例如 `1.2.0-rc.1`。未完成评审、测试或安全检查的版本不得标记为正式版本。

## 提交与分支

- 提交信息采用 Conventional Commits：`type(scope): summary`。
- 允许的 `type`：`feat`、`fix`、`refactor`、`perf`、`docs`、`test`、`build`、`ci`、`chore`、`revert`。
- `BREAKING CHANGE:` 或提交类型后的 `!` 表示 MAJOR 变更。
- `main` 只接受 Pull Request 合并；功能开发使用 `feature/*`，缺陷修复使用 `fix/*`，紧急生产修复使用 `hotfix/*`。
- Pull Request 必须说明影响范围、测试结果、数据库/API 兼容性和回滚方案；禁止直接修改已发布 tag。

## 发布流程

1. 从 `main` 创建 `release/vX.Y.Z` 分支，确认版本级别与 `CHANGELOG.md` 内容。
2. 同步更新 `server/package.json`、`server/package-lock.json`、`web/package.json`、`web/package-lock.json` 的版本号。
3. 执行 `npm run version:check`、后端测试和前端测试/构建；CI 必须全部通过。
4. 合并发布 PR 后创建带注释的 Git tag `vX.Y.Z`，tag 不可复用或移动。
5. 发布记录必须关联 PR、构建产物、数据库变更说明、监控观察窗口和回滚版本。

版本检查命令可在仓库根目录执行：

```bash
cd server && npm run version:check
cd ../web && npm run version:check
```

## 变更日志与回滚

- 所有面向用户或运维的变更都写入 `CHANGELOG.md` 的 `Unreleased` 区域，并按 Added、Changed、Fixed、Security、Breaking 分类。
- 发布时将 `Unreleased` 固化为对应版本和日期；不得用“若干优化”“常规修复”等不可审计描述替代具体内容。
- 数据库变更必须提供前向迁移、备份要求和回滚限制。不可逆迁移必须在发布审批中明确确认。
- 发现高风险问题时优先停止推广并回滚到上一个稳定 tag；补丁版本用于后续修复，不能通过覆盖 tag 隐藏事故。

## 责任与门禁

- 变更作者负责版本影响分析、测试和变更日志；代码所有者负责评审；发布负责人负责 tag 和发布记录。
- 版本号不一致、CI 未通过、未提供回滚方案或存在未确认的安全告警时，发布自动阻断。
