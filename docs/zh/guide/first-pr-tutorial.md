# 提交你的第一个 Pull Request

本教程将一步步带你完成向 Nexu 提交第一个 PR 的全过程——从挑选 Issue 到代码合并。无需开源经验。

## 前置条件

- [GitHub](https://github.com) 账号
- 安装 [Git](https://git-scm.com/)
- 安装 [Node.js](https://nodejs.org/) 24+（推荐 LTS 版本）
- 安装 [pnpm](https://pnpm.io/) 10.26+（`corepack enable && corepack prepare pnpm@latest --activate`）

## 第一步 — 挑选一个 Issue

浏览 [Good First Issues](https://github.com/nexu-io/nexu/labels/good-first-issue) 看板。每个 Issue 都有三维标签：

| 标签 | 含义 |
|------|------|
| `area/frontend`、`area/backend` 等 | 涉及的代码方向 |
| `difficulty/starter`、`difficulty/easy`、`difficulty/medium` | 预估耗时（15 分钟 → 4 小时） |
| `type/bug`、`type/docs`、`type/style` 等 | 任务类型 |

每个 Issue 都包含：
- **任务描述** — 清晰说明需要做什么
- **期望结果** — 完成后应该是什么样子
- **相关文件** — 需要修改哪些文件
- **验证方式** — 如何确认修改正确
- **AI Prompt** — 复制到 Cursor / Claude Code 快速开始
- **Mentor** — 谁来 Review 你的 PR（保证 48h 内响应）

**认领**：在 Issue 下评论 `I'd like to work on this`，Mentor 会分配给你。

## 第二步 — Fork 并克隆

```bash
# 在 GitHub 页面点击 Fork，然后：
git clone https://github.com/你的用户名/nexu.git
cd nexu
```

## 第三步 — 搭建开发环境

```bash
pnpm install
pnpm --filter @nexu/shared build
```

验证环境正常：

```bash
pnpm typecheck
pnpm lint
pnpm test
```

## 第四步 — 创建分支

```bash
git checkout -b fix/sidebar-alignment
# 命名：fix/..., feat/..., docs/..., chore/...
```

## 第五步 — 编码（可使用 AI 辅助）

每个 Good First Issue 都附带 **AI Prompt**，可以直接复制到编辑器使用：

1. 打开 GitHub 上的 Issue
2. 复制「🤖 AI 辅助 Prompt」区域的内容
3. 粘贴到 Cursor / Claude Code / GitHub Copilot Chat
4. 审查并调整生成的代码

::: tip 手写代码同样欢迎
AI Prompt 是可选的辅助工具，你完全可以手动编码。
:::

**编码时注意：**
- 保持专注——一个 PR 只解决一个 Issue
- 遵循附近代码的现有风格
- 频繁运行 `pnpm lint && pnpm typecheck`
- 如果修改了 API 路由/Schema：运行 `pnpm generate-types`
- 如果修改了文档：`cd docs && pnpm dev` 本地预览

## 第六步 — 提交

我们使用 [Conventional Commits](https://www.conventionalcommits.org/) 规范：

```bash
git add .
git commit -m "fix: align sidebar collapse button padding"
```

常用前缀：`feat:` | `fix:` | `docs:` | `chore:` | `refactor:`

## 第七步 — 推送并开 PR

```bash
git push origin fix/sidebar-alignment
```

到 GitHub 上你的 Fork 页面，点击「Compare & pull request」横幅。

### 填写 PR 模板

- **What** — 一句话概括改动
- **Why** — 关联 Issue：`Closes #123`
- **How** — 简述实现思路
- **Affected areas** — 勾选涉及的 `area/*`
- **Mentor** — @mention Issue 中指定的 Mentor

PR 标题使用同样的 Conventional Commits 格式。

## 第八步 — Review 与合并

你的 Mentor 会在 **48 小时内** Review：

1. **CI 自动运行** — typecheck、lint、build、ESM 验证
2. **Mentor Review** — 可能直接通过、要求修改或提问
3. **迭代** — 根据反馈推送新 commit（Re-review 在 24h 内）
4. **合并** — 通过后由 Mentor 合并
5. **积分** — 1 个工作日内发放 Nexu Points

::: tip
更小的 PR 被 Review 更快。改动较大时请拆分为多个 PR。
:::

## 合并之后

- 你会出现在 [changelog](https://github.com/nexu-io/nexu/releases) 和 Contributors 列表中
- 获得 Nexu Points（金额标注在 Issue 上）
- Mentor 会推荐你下一个匹配技能的 Issue
- 挑战更大的任务：[`intermediate`](https://github.com/nexu-io/nexu/labels/intermediate) 或 [`advanced`](https://github.com/nexu-io/nexu/labels/advanced) 标签

## 使用 AI 编程助手？

我们欢迎使用 AI 工具（Copilot、Cursor、Claude Code、Devin 等）辅助的 PR：

1. **勾选** PR 模板中「AI / Agent Assistance」的复选框
2. **自行审查生成的代码** — 质量由你负责
3. **确保所有检查通过** — `pnpm typecheck && pnpm lint && pnpm test`
4. CI 会自动检测并标记 agent-assisted PR，以便 Reviewer 重点关注

## 需要帮助？

- **在 Issue 下留言** — Mentor 会在 48h 内回复
- **Discord [#contributing](https://discord.gg/nexu)** — 实时沟通
- **[GitHub Discussions](https://github.com/nexu-io/nexu/discussions)** — 深度讨论

详细开发工作流请参阅[参与贡献指南](/zh/guide/contributing)。
