---
name: fetch-pr-reviews
description: Use when the user asks to获取、查看、统计或列出 GitHub PR 里的评审意见。当前内置 workflow 重点支持 CodeRabbit；在该 workflow 里，“真正的评审意见”固定定义为：非 review summary、非 nitpick 的 actionable inline comments。
---

# Fetch PR Reviews

## CodeRabbit Reviews

“真正的评审意见”固定定义为：

- 是 **inline review comments**
- **不是** review summary
- **不是** nitpick

不需要分析评论内容本身。

### Data sources

CodeRabbit workflow 只需要查这两个来源：

1. **PR review comments**

   ```bash
   gh api --paginate repos/<owner>/<repo>/pulls/<pr_number>/comments
   ```

   这是真正的 inline comments 来源。

2. **PR reviews**

   ```bash
   gh api repos/<owner>/<repo>/pulls/<pr_number>/reviews
   ```

   只用于识别和排除 review summary / nitpick 汇总，不用于提取最终结果。

不要把这些当主来源：

- `gh pr view ...`
- `gh api repos/<owner>/<repo>/issues/<pr_number>/comments`

原因：它们不是 actionable inline comments 的权威来源。

### Workflow

#### 1. 拉取 inline comments

```bash
gh api --paginate repos/<owner>/<repo>/pulls/<pr_number>/comments
```

只保留满足以下条件的记录：

- `user.login` 是 `coderabbitai[bot]` 或 `coderabbitai`
- `in_reply_to_id == null`（只看顶层 inline comments，不看回复）

这是候选集合。

#### 2. 拉取 reviews，用来排除 review summary / nitpick

```bash
gh api repos/<owner>/<repo>/pulls/<pr_number>/reviews
```

识别 CodeRabbit review summary。常见特征：

- `Actionable comments posted: N`
- `Nitpick comments`
- 大段汇总文本

这些 review-level 内容**不是最终结果**，它们只用于帮助确认：

- 哪些是 summary
- 哪些 nitpick 不应计入 actionable inline comments

### Filtering rule

CodeRabbit workflow 的最终目标始终是：

> **CodeRabbit 在 `pulls/<pr_number>/comments` 中留下的、非 nitpick、非 summary 的顶层 inline comments**

实践上按下面做：

1. 从 `pulls/<pr_number>/comments` 拿到 CodeRabbit 顶层 inline comments
2. 用 `pulls/<pr_number>/reviews` 识别该 PR 是否存在 nitpick 汇总
3. 输出时只保留你确认属于 actionable 的 inline comments

### Large output handling

如果 `gh api --paginate ...` 输出太大被截断：

1. 记录工具输出文件路径
2. 不要手工整段阅读大 JSON
3. 交给 `@explorer` 提取：
   - CodeRabbit authored comments
   - 顶层 inline comments 数量
   - 每条 comment 的 `path` / `line` / `body`
