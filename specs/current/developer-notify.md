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

## Notification payloads

- `scripts/notify/developer-notify.mjs` is the single payload builder and delivery entrypoint for both developer issue and developer PR notifications.
- The script selects the payload by `EVENT_KIND` (`issue` or `pr`) and sends a Feishu interactive card to the shared developer webhook.
- Payload layout details are intentionally not documented here; treat the script as the source of truth for message structure.

## Safety and isolation

- 不修改既有 `nexu-pal` workflow 或旧 Feishu issue/discussion/PR 通知 workflow。
- 新链路只复用 GitHub App credentials 做组织成员过滤；Feishu webhook 为独立开发者通知用途。
- PR 流程保持 metadata-only，仍使用 `pull_request_target`，不执行 PR 代码。
- 所有跳转链接都限制为 `https://github.com/*` 或固定官方文档链接。
- webhook 发送除了检查 HTTP 状态，还会校验 Feishu JSON 响应里的 `code/msg`，避免 200 但业务失败被误判为成功。

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
