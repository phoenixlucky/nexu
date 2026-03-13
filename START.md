# START

本文档说明如何手动启动本地开发环境。

## 手动启动

请在仓库根目录执行以下命令。

### 1. 设置 OpenClaw 状态目录

先设置状态目录：

```bash
export OPENCLAW_STATE_DIR="$PWD/.openclaw"
```

### 2. 准备本地数据库

如果你的本地数据库 schema 落后于当前代码，先执行：

```bash
pnpm db:push
```

如果你的本地库已经有完整的 migration 历史，并且你希望按 migration 顺序应用变更，也可以执行：

```bash
pnpm db:migrate
```

### 3. 启动 API 服务

打开终端 1：

```bash
pnpm --filter @nexu/api dev
```

API 启动后，可以用下面的命令确认服务健康：

```bash
curl http://localhost:3000/health
```

### 4. 启动 Web 服务

打开终端 2：

```bash
pnpm --filter @nexu/web dev
```

### 5. 准备本地 OpenClaw Runtime

打开终端 3，先安装 `openclaw-runtime` 目录里的依赖：

```bash
npm --prefix ./openclaw-runtime run install:full
```

这个目录会安装固定版本的 `openclaw`，用于替代全局安装的 CLI。

如果你要做桌面端打包前的体积裁剪，可以改用：

```bash
npm --prefix ./openclaw-runtime run install:pruned
```

### 6. 启动 OpenClaw Gateway 运行时

安装完成后，仍然在终端 3 执行：

```bash
OPENCLAW_STATE_DIR="$PWD/.openclaw" \
./openclaw-wrapper gateway run --allow-unconfigured --bind loopback --port 18789 --force --verbose
```

这条命令不依赖全局 `openclaw`。`./openclaw-wrapper` 会自动转发到 `openclaw-runtime` 目录中的包内入口，因此用法上更接近直接执行本机上的 `openclaw ...`。

### 7. 启动 Nexu Gateway 服务

打开终端 4：

```bash
OPENCLAW_STATE_DIR="$PWD/.openclaw" RUNTIME_MANAGE_OPENCLAW_PROCESS=false pnpm --filter @nexu/gateway dev
```

因为你已经在终端 3 里手动启动了 `openclaw gateway run ...`，所以这里需要显式设置 `RUNTIME_MANAGE_OPENCLAW_PROCESS=false`，避免 Nexu Gateway 再额外拉起一个托管的 OpenClaw 进程。

## 使用 PM2 管理 OpenClaw 和 Nexu Gateway

如果你主要想方便地查看进程状态、查看日志，以及在需要时快速重启，推荐用仓库根目录下的 `ecosystem.config.cjs` 只管理以下两个常驻进程：

- `openclaw`
- `nexu-gateway`

首次使用前，先确保你已经完成前面的准备步骤：

- 已设置并使用仓库内的状态目录 `.openclaw`
- 已安装 `openclaw-runtime` 依赖
- 本地数据库 schema 已准备好

然后在仓库根目录执行：

```bash
pm2 start ecosystem.config.cjs
```

常用命令：

```bash
pm2 status
pm2 logs openclaw
pm2 restart openclaw
pm2 restart nexu-gateway
pm2 stop openclaw
pm2 stop nexu-gateway
```

说明：

- `openclaw` 适合通过 PM2 观察进程是否存活、是否反复重启，以及查看运行日志。
- `nexu-gateway` 也可以通过 PM2 重启；它本身使用 `tsx watch` 做开发态热重载，因此 PM2 配置里不额外开启 `watch`。
- `nexu-gateway` 仍然会显式设置 `RUNTIME_MANAGE_OPENCLAW_PROCESS=false`，避免它再额外拉起一个托管的 OpenClaw 进程。
- 如果 `pm2 logs openclaw` 显示进程仍在运行，但服务表现异常，仍建议结合 API 健康检查和相关日志一起判断问题。

## 说明

- 这套流程默认你已经在本机安装并配置好了 `pnpm`、`node` 和 `npm`，不再依赖全局安装的 `openclaw`。
- `openclaw-runtime` 是一个独立 runtime 目录；当前推荐通过仓库根目录下的 `./openclaw-wrapper` 启动，它内部会稳定转发到 `openclaw-runtime/node_modules/openclaw/openclaw.mjs`。
- 如果 `pnpm db:migrate` 失败，并出现类似 `relation "artifacts" already exists` 的错误，通常说明本地数据库是用别的方式建出来的，但没有对应的 Drizzle migration 历史。这种情况下，本地开发更适合先用 `pnpm db:push` 补齐 schema。
- `@nexu/gateway` 刚启动时偶尔出现几条 `fetch failed` 警告，在本地开发环境里不一定代表真实故障；如果 `http://localhost:3000/health` 正常，且这些警告没有持续刷屏，通常可以视为启动阶段的短暂抖动。
- 如果实际行为和预期不一致，优先确认 gateway 进程最终使用的 `OPENCLAW_STATE_DIR` 是否正确。
