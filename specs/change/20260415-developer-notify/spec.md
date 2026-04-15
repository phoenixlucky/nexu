---
id: 20260415-developer-notify
name: Developer Notify
status: implemented
created: '2026-04-15'
---

## Overview

开发者社群运营需求：当有新增外部 PR 或外部 issue 时，推送通知到开发者飞书群。

### Problem Statement

- 现有 `nexu-pal` 与既有 Feishu 通知链路已承担当前 issue / discussion / PR 自动化，不适合直接叠加新的开发者社区运营文案。
- 需要一条独立的新通知链路，面向开发者社群推送“外部贡献者 PR”和“外部 issue”两类消息，同时避免影响既有自动化。

### Goals

- 为外部 fork PR 新增一条独立的 GitHub Actions + Feishu webhook 通知链路。
- 为外部 issue 新增一条独立的 GitHub Actions + Feishu webhook 通知链路，并使用新的卡片文案与按钮。

### Scope

- 新增 workflow、通知脚本、测试，以及所需文档化说明。
- 不修改已有 `nexu-pal` workflow、已有 Feishu issue/discussion/PR 通知链路。

### Constraints

- 新链路必须使用全新的 Feishu webhook secret，不能复用已有 secret。
- issue 通知继续只面向“外部作者”；PR 通知继续只面向 fork PR；无需实现飞书 @ 功能。

### Success Criteria

- 新增外部 issue / fork PR 时能发送符合产品文案的 Feishu 卡片。
- 既有 `nexu-pal` 与原有通知 workflow 文件及脚本保持不变。

### 新增外部贡献者 pr 推送

1. 触发条件：每新增一个外部 pr ，立即推送至飞书群
2. 推送格式

```
标题：🎉 又新增 1 位贡献者给 Nexu 提 PR 啦～ 立即派出奖励💰！
Author: teddyli18000   
Labels: none
1. 按钮文案： 查看贡献Pr  跳转Pr 地址
Nexu 准备好一批对新手友好任务的 Good First Issue 👇 
只需 3 步💥，选任务 —认领 —— 提交 ，即可获得 GitHub README 公开致谢+积分奖励+Github 社区徽章🎉。（详情请看群公告）
1. 按钮文案：贡献者指南 /   跳转链接：https://docs.nexu.io/zh/guide/first-pr
2. 按钮文案：立即贡献  /  跳转 good first issue 链接：https://github.com/nexu-io/nexu/labels/good-first-issue
```

### 新增 issue 推送至开发者飞书交流群

1. 触发条件：只要新增外部 issue 就立即发布
1. 推送格式

```
1. 标题：一批新手友好 Issue 等你领取，做贡献领积分奖励💰🎉
只需 3 步💥，选任务 —认领 —— 提交 ，即可获得 GitHub README 公开致谢+积分奖励+Github 社区徽章🎉。（详情请阅览群公告）
1. 按钮文案：查看 issue 
按钮跳转新增 issue 地址：例如 https://github.com/nexu-io/nexu/issues/1097
2. 按钮文案：领取新手友好 issue 
按钮跳转 good first issue 链接：https://github.com/nexu-io/nexu/labels/good-first-issue
3. 按钮文案：贡献者指南 
跳转链接：https://docs.nexu.io/zh/guide/first-pr
```


## Research

### Existing System

- 现有 issue / discussion 通知分别由 `.github/workflows/feishu-issue-notify.yml:1` 与 `.github/workflows/feishu-discussion-notify.yml:1` 触发，复用 `scripts/notify/feishu-notify.mjs:1`。
- 现有 PR 通知由 `.github/workflows/feishu-pr-notify.yml:1` 处理，使用 `pull_request_target` + fork 判断，并在 workflow 内联 Node 脚本直接发 webhook。
- `nexu-pal` 主链路在 `.github/workflows/nexu-pal-issue-opened.yml:1`、`.github/workflows/nexu-pal-triage-command.yml`、`.github/workflows/nexu-pal-needs-triage-notify.yml:1`，其职责已在 `specs/current/nexu-pal.md:5` 说明。
- issue/discussion 通知会用 GitHub App token 调用组织成员检查，过滤内部作者；相关模式见 `scripts/notify/feishu-notify.mjs:3-66`。

### Available Approaches

1. 直接修改已有 `feishu-issue-notify.yml` / `feishu-pr-notify.yml` 与 `scripts/notify/feishu-notify.mjs`，在原链路上追加新文案与分支逻辑。
2. 保留旧链路不动，新增独立 workflow 与独立通知脚本，只参考现有的触发方式、外部作者判定和 webhook 发送模式。
3. 新 workflow 仍复用旧 `feishu-notify.mjs`，仅通过环境变量切换模板。

### Constraints

- 设计原则明确要求“不修改已有的 nexu-pal 和 workflow 通知链路”，因此旧 workflow 与旧脚本不应改动。
- PR 通知应保持 metadata-only 安全模式，继续使用 `pull_request_target`，且仅处理 fork PR，参考 `.github/workflows/feishu-pr-notify.yml:3-24`。
- issue 通知仍需过滤 repo owner 组织成员和 `sentry[bot]` 这类内部等价作者，参考 `scripts/notify/feishu-notify.mjs:45-66`。
- 飞书 @ 功能已确认不需要实现。

### Key References

- `.github/workflows/feishu-issue-notify.yml:1`
- `.github/workflows/feishu-pr-notify.yml:1`
- `.github/workflows/nexu-pal-issue-opened.yml:1`
- `scripts/notify/feishu-notify.mjs:1`
- `scripts/notify/feishu-triage-notify.mjs:1`
- `specs/current/nexu-pal.md:5`

## Design

### Architecture

```text
GitHub issue opened ──> developer-issue-notify.yml ──> developer-notify.mjs(issue) ──> new issue webhook

GitHub fork PR opened ─> developer-pr-notify.yml ─────> developer-notify.mjs(pr) ────> new pr webhook

existing nexu-pal / feishu-* workflows ───────────────> 保持不变
```

### Implementation Steps

1. 新增独立 workflow：一个处理外部 issue opened，一个处理 fork PR opened。
2. 新增独立脚本 `scripts/notify/developer-notify.mjs`，封装外部作者判断、文案模板、按钮卡片、webhook 发送。
3. issue workflow 使用新的 GitHub App token 做组织成员过滤；PR workflow 仅处理 fork PR，不 checkout PR 代码。
4. 为新脚本补充 Vitest 测试，覆盖 payload 生成、文本清洗、外部作者过滤逻辑。

### Pseudocode

```text
main():
  read EVENT_KIND and inputs
  validate webhook/url/author
  if sentry bot: skip
  if issue:
    check org membership via GitHub API
    if internal member: skip
    payload = build issue developer card
  if pr:
    payload = build external contributor PR card
  post payload to webhook
```

### Files to Create or Modify

- `.github/workflows/developer-issue-notify.yml` - 新 issue 开发者社群通知 workflow
- `.github/workflows/developer-pr-notify.yml` - 新 PR 开发者社群通知 workflow
- `scripts/notify/developer-notify.mjs` - 新独立 Feishu 通知脚本
- `tests/notify/developer-notify.test.ts` - 新脚本测试
- `specs/change/20260415-developer-notify/spec.md` - 更新研究、设计、实现记录

### Edge Cases and Error Handling

- 缺少 webhook、author、GitHub token 等必要 env 时直接失败退出。
- issue 作者属于组织成员或为 `sentry[bot]` 时跳过通知。
- PR 链路仅在 fork PR 上运行，避免同仓库分支 PR 干扰。
- GitHub URL 必须为 `https://github.com/*`，避免 webhook 卡片跳转到非预期站点。

## Plan

- [x] Phase 1: Add independent developer notification workflows
  - [x] Add external issue workflow with shared developer webhook secret
  - [x] Add external PR workflow with shared developer webhook secret
- [x] Phase 2: Implement independent developer Feishu notifier
  - [x] Add dedicated payload templates for issue and PR cards
  - [x] Preserve external-author filtering without touching old notify chain
- [x] Phase 3: Test and verify
  - [x] Add Vitest coverage for payload and filter behavior
  - [x] Run targeted tests plus required repo checks

## Implementation

### Files created or modified

- `.github/workflows/developer-issue-notify.yml` - 新增外部 issue 开发者社群通知 workflow，使用独立 webhook secret。
- `.github/workflows/developer-pr-notify.yml` - 新增 fork PR 开发者社群通知 workflow，保持 metadata-only 模式并显式声明 `contents: read`。
- `scripts/notify/developer-notify.mjs` - 新增独立通知脚本，封装 issue / PR 卡片模板、外部作者过滤、URL 校验与 webhook 发送。
- `tests/notify/developer-notify.test.ts` - 新增脚本单测，覆盖 payload 结构、文本清洗、组织成员过滤和 PR 发送路径。
- `specs/change/20260415-developer-notify/spec.md` - 补齐 research / design / implementation 记录。

### Testing results

- `pnpm typecheck` ✅
- `pnpm lint` ✅
- `pnpm exec vitest run tests/notify/developer-notify.test.ts` ✅
- `pnpm test` 已执行过一次，但用户随后明确说明“不需要跑 test”，因此未再继续基于全量测试结果做后续处理。

### Deviations from design

- issue 新链路复用了现有 GitHub App credentials 做组织成员过滤，但 webhook secret 仍是全新的，旧通知链路未改动。
- PR 卡片实现阶段按最终评审修正为 `action` 容器包裹按钮，避免直接把 `button` 放入 `elements`。

## Notes

- A single new webhook secret `NOTIFY_DEVELOPER_FEISHU_WEBHOOK` is used for both developer issue and PR notifications instead of reusing existing notify secrets.
- The new issue workflow intentionally reuses the existing GitHub App credentials only for org-membership filtering; the delivery webhook remains fully new and isolated from the old notify chain.
- Feishu @ mention was explicitly dropped from scope during clarification.
