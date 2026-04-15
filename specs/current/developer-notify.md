# developer-notify

独立于既有 `nexu-pal` 与旧 Feishu 通知链路的开发者社群通知流程。

## Workflows

| Workflow | Trigger | Script |
|----------|---------|--------|
| `Developer Issue Notification` | `issues: [opened]` | `scripts/notify/developer-notify.mjs` |
| `Developer Pull Request Notification` | `pull_request_target: [opened]` | `scripts/notify/developer-notify.mjs` |

## Behavior

### Issue notification

Runs on `issues: [opened]` via `.github/workflows/developer-issue-notify.yml`.

1. Creates a short-lived GitHub App token using `NEXU_PAL_APP_ID` and `NEXU_PAL_PRIVATE_KEY_PEM`.
2. Runs `scripts/notify/developer-notify.mjs` with `EVENT_KIND=issue`.
3. Skips notifications for `sentry[bot]`.
4. Checks whether the issue author is a member of the repository-owner organization; internal authors are skipped.
5. Sends the developer-community issue card to the shared developer webhook.

### Pull request notification

Runs on `pull_request_target: [opened]` via `.github/workflows/developer-pr-notify.yml`.

1. Job runs only when `github.event.pull_request.head.repo.fork` is true.
2. Runs `scripts/notify/developer-notify.mjs` with `EVENT_KIND=pr`.
3. Skips notifications for `sentry[bot]`.
4. Sends the external-contributor PR card to the shared developer webhook.

## Card content

### PR card

- 标题：`🎉 又新增 1 位贡献者给 Nexu 提 PR 啦～ 立即派出奖励💰！`
- 内容包含 author、labels、PR 链接按钮
- 额外提供：`贡献者指南`、`立即贡献`

### Issue card

- 标题：`一批新手友好 Issue 等你领取，做贡献领积分奖励💰🎉`
- 内容包含社区引导文案
- 按钮：`查看 issue`、`领取新手友好 issue`、`贡献者指南`

## Safety and isolation

- 不修改既有 `nexu-pal` workflow 或旧 Feishu issue/discussion/PR 通知 workflow。
- 新链路只复用 GitHub App credentials 做组织成员过滤；Feishu webhook 为独立开发者通知用途。
- PR 流程保持 metadata-only，仍使用 `pull_request_target`，不执行 PR 代码。
- 所有跳转链接都限制为 `https://github.com/*` 或固定官方文档链接。

## Secrets

| Secret | Purpose |
|--------|---------|
| `NOTIFY_DEVELOPER_FEISHU_WEBHOOK` | Shared Feishu incoming webhook URL for both developer issue and PR notifications |
| `NEXU_PAL_APP_ID` | GitHub App ID used for issue-author org-membership filtering |
| `NEXU_PAL_PRIVATE_KEY_PEM` | GitHub App private key used for issue-author org-membership filtering |

## File map

```
.github/workflows/
  developer-issue-notify.yml
  developer-pr-notify.yml
scripts/notify/
  developer-notify.mjs
tests/notify/
  developer-notify.test.ts
```
