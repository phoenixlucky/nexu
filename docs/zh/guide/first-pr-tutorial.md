# 提交你的第一个 Pull Request

本教程将一步步带你完成向 Nexu 提交第一个 PR 的全过程。无需开源经验，只需要一个 GitHub 账号和一个代码编辑器。

## 开始之前

确保你已准备好：

- [GitHub](https://github.com) 账号
- 安装 [Git](https://git-scm.com/)
- 安装 [Node.js](https://nodejs.org/) 24+（推荐 LTS 版本）
- 安装 [pnpm](https://pnpm.io/) 10.26+（`corepack enable && corepack prepare pnpm@latest --activate`）

## 第一步 — 找一个 Issue

浏览标记了 [`good-first-issue`](https://github.com/nexu-io/nexu/labels/good-first-issue) 或 [`help-wanted`](https://github.com/nexu-io/nexu/labels/help-wanted) 的 Issue。这些是为新贡献者精心筛选的任务，有明确的范围和预估工时。

标记了 [`mentor-available`](https://github.com/nexu-io/nexu/labels/mentor-available) 的 Issue 会有维护者全程指导你。

**在 Issue 下留言**认领任务——简单写一句 "I'd like to work on this" 即可，维护者会将任务分配给你。

## 第二步 — Fork 并克隆

```bash
# 在 GitHub 页面点击 "Fork" 按钮，然后：
git clone https://github.com/你的用户名/nexu.git
cd nexu
```

## 第三步 — 搭建开发环境

```bash
pnpm install
pnpm --filter @nexu/shared build
```

验证环境是否正常：

```bash
pnpm typecheck
pnpm lint
pnpm test
```

## 第四步 — 创建分支

使用有描述性的分支名，搭配约定式前缀：

```bash
git checkout -b fix/sidebar-alignment
# 或者：feat/model-search, docs/seedance-faq, chore/update-deps
```

## 第五步 — 开始修改

打开编辑器，开始编码。几个建议：

- **保持专注** — 一个 PR 只做一件事
- **遵循现有模式** — 参考附近代码的风格
- **频繁检查** — `pnpm lint && pnpm typecheck` 及早发现问题
- 如果修改了 API 路由/Schema：运行 `pnpm generate-types`
- 如果修改了文档：运行 `cd docs && pnpm dev` 本地预览

## 第六步 — 提交

我们使用 [Conventional Commits](https://www.conventionalcommits.org/) 规范：

```bash
git add .
git commit -m "fix: align sidebar collapse button padding"
```

常用前缀：`feat:`、`fix:`、`docs:`、`chore:`、`refactor:`

## 第七步 — 推送并开 PR

```bash
git push origin fix/sidebar-alignment
```

然后到 GitHub 上你的 Fork 页面——你会看到一个提示创建 PR 的横幅，点击即可。

### 填写 PR 模板

- **What** — 一句话概括你的改动
- **Why** — 关联 Issue，使用 `Closes #123`
- **How** — 简述你的实现思路
- **Affected areas** — 勾选涉及的模块
- **Checklist** — 确认所有检查项通过

### PR 标题

使用和 commit 相同的格式：`fix: align sidebar collapse button padding`

## 第八步 — 等待 Review

维护者会在 **48 小时内** Review 你的 PR。流程如下：

1. **CI 自动运行** — typecheck、lint、build、ESM import 验证
2. **维护者 Review** — 可能直接通过、要求修改或提问
3. **迭代** — 根据反馈推送新的 commit 到你的分支
4. **合并** — 通过后由维护者合并

::: tip
更小的 PR 会被更快地 Review。如果改动较大，考虑拆分为多个 PR。
:::

## 合并之后

- 你的贡献会出现在 [changelog](https://github.com/nexu-io/nexu/releases) 中
- 你正式成为 Nexu 贡献者 🎉
- 继续挑战更多 Issue — [`intermediate`](https://github.com/nexu-io/nexu/labels/intermediate) 和 [`advanced`](https://github.com/nexu-io/nexu/labels/advanced) 标签有更大的任务等你

## 使用 AI 编程助手？

我们欢迎使用 AI 编程工具（GitHub Copilot、Cursor、Claude Code 等）生成的 PR，请注意：

1. **添加 `agent-assisted` 标签** 到你的 PR（或由自动化工作流检测）
2. **审查生成的代码** — 你需要对最终质量负责
3. **确保所有检查通过** — `pnpm typecheck && pnpm lint && pnpm test`
4. **说明你的方法** — 在 PR 描述中注明哪些部分使用了 AI 辅助

详细的开发工作流请参阅[参与贡献指南](/zh/guide/contributing)。

## 需要帮助？

- 在你正在处理的 Issue 下留言
- 发起一个 [Discussion](https://github.com/nexu-io/nexu/discussions)
- 加入我们的 [Discord](https://discord.gg/nexu)
