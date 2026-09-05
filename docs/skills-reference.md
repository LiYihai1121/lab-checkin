# AI Skill 体系参考（模块 × Skill 矩阵与业界选型）

> 本仓库的 skill 位于 `.agents/skills/`（Agent Skills 开放标准格式：`SKILL.md` + frontmatter），随 git 分发，克隆即用。本文记录每个模块对应的 skill、业界（大厂/官方）正在使用的同模式实践，以及可选的外部 skill 选型。

## 1. 模块 × Skill 矩阵

| 项目模块 | 仓库内 Skill | 核心内容 |
|----------|--------------|----------|
| 全局约定 / 项目结构 | `lab-trace` | 三环境矩阵、目录速查、修改约定、验证流程 |
| 后端 API（routes/middleware/utils） | `lab-trace-backend` | 编码条文、node:sqlite 专有坑、Mimosa 误报规避 |
| 数据库（db/） | 并入 backend | 幂等建表、事务、唯一约束兜底、行类型 |
| 前端 UI（views/components/router/stores） | `lab-trace-frontend` | SFC 规范、请求层剥壳约定、三态 UI、环境标识 |
| 测试（server/tests、web/tests） | `lab-trace-testing` | 内存库隔离模型、既有用例模式、TDD 流程、权限矩阵覆盖 |
| 安全（auth/密钥/限流/输入） | `lab-trace-security` | 威胁面地图、既有设计清单、发布前安全自查 |
| 交付部署（构建/容器/CI/发布） | `lab-trace-delivery` | 三层门禁、三种部署方式、验收清单、回滚、版本规范 |

## 2. 业界正在使用的 Skill（2026 调研）

### 规范类（大厂编码规范 → skill）

- **阿里巴巴《Java 开发手册》Skill**：把手册条文固化为可被 AI 执行的审查/生成规则，是「大厂规范 → skill」的标志性实践（[开源实现](https://github.com/ns3154/alibaba-java-coding-guidelines-skill)、[介绍文章](https://www.codefather.cn/post/2073310633348038657)）。本仓库 `lab-trace-backend` 的「条文式规范」即采用同一模式，内容本地化为 TS/Express/node:sqlite 语境。
- **腾讯 CodeBuddy 技能系统**：兼容 Agent Skills 标准的官方技能体系（[文档](https://www.codebuddy.cn/docs/cli/skills)）；**字节火山引擎** AI Code 平台同样支持 Claude/Codex skills（[指南](https://developer.volcengine.com/articles/7577301013976383498)）。

### 流程类（官方与社区主流）

- **TDD skill**（红-绿-重构）：[Anthropic 官方 test-driven-development skill](https://github.com/anthropics/skills) 与 [社区版](https://mcpservers.org/agent-skills/sanity-io/tdd)；共识是必须显式强制「先测试后实现」。`lab-trace-testing` 采用该流程并与本仓库内存库隔离模型结合。
- **Code Review skill**：[官方 Code Review 能力](https://code.claude.com/docs/en/code-review)（多智能体、PR 行内评论、可自定义检查项）、[双层审查 skill](https://github.com/anthropics/skills/discussions/812)（通用检查 + 项目感知清单）、[awesome-skills/code-review-skill](https://github.com/awesome-skills/code-review-skill)。`lab-trace-security` 的「威胁面地图 + 发布前自查清单」即项目感知层。
- **多 Skill 组合流水线**：澄清 → 设计 → TDD 实现 → code-review / simplify / verify（[知乎：Claude Code 进阶指南](https://zhuanlan.zhihu.com/p/2021903465396405826)、[智源：4 个自查 Skill](https://hub.baai.ac.cn/view/56652)）。本仓库由「主 skill + 模块 skill + pre-commit/CI 门禁」承担同一流水线。

### 资源聚合

- [anthropics/skills](https://github.com/anthropics/skills) — 官方公共 skill 仓库（Agent Skills 标准范例）
- [awesome-claude-skills](https://github.com/karanb192/awesome-claude-skills)（50+ 已验证）、[26k+ star 精选](https://www.cnblogs.com/javastack/p/19547420)
- [claude-code-skills-zh](https://github.com/laolaoshiren/claude-code-skills-zh) — 中文开发者技能包集合
- [阿里云：企业级 Skills 库设计模式](https://developer.aliyun.com/article/1732973) — 团队级技能体系组织方式（按模块拆分、随仓库共享，与本仓库一致）

## 3. 本环境已安装的外部 Skill（插件）

| Skill | 来源 | 对本项目的用途 |
|-------|------|----------------|
| `mimosa-security-scan` | Mimosa 插件 | 深度安全审计（security skill 的第 4 节清单引用其结论；注意钩子误报 triage） |
| `cloudbase` | 腾讯云 CloudBase 插件 | 如需迁移/托管到腾讯云开发平台时使用 |
| `docx` / `xlsx` / `pptx` / `pdf` | document-skills | 交付物导出（报告/对账表/演示） |
| `skill-creator` | 官方 | 新建/修订本仓库 skill 时的工具 |
| `browser-use` / `web-gui-tester` | 插件 | 前端 GUI 黑盒验收（配合测试 skill） |

## 4. 选型与维护约定

1. 新 skill 先问「触发场景是否与现有 skill 重叠」——宁可在现有 skill 加小节，不轻易新建
2. 每个 skill 必须有互斥的 description（触发词不互相抢）
3. skill 内容以本仓库实测为准（踩过的坑、钩子误报、既有模式），外部经验只做模式参考
4. skill 改动随常规提交入库（`docs(skills): ...`），CI 不校验但要求描述与现状一致
