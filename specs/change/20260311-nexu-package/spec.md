---
id: "20260311-nexu-package"
name: "Nexu Package"
status: new
created: "2026-03-11"
---

## Overview

优化 Nexu 项目打包时 OpenClaw 的体积占用

## Research

### Nexu 与 OpenClaw 的关系

- Nexu 是 控制面（Control Plane），OpenClaw 是 运行时引擎（Runtime Plane）。  
- Nexu 负责多租户数据管理（bot、channel、凭证、路由、pool）并生成 OpenClaw 配置；OpenClaw 负责实际消息处理与 agent 执行。
- 当前集成的版本： 2026.3.7 (apps/gateway/Dockerfile)

#### 启动方式

OpenClaw 以 CLI 启动为独立进程，由 Nexu gateway sidecar 托管（启动、健康检查、重启）。  

- 通过 npm install -g openclaw@... 安装 CLI（apps/gateway/Dockerfile）
- @nexu/gateway 用 spawn(OPENCLAW_BIN, ["gateway", ...]) 拉起它（apps/gateway/src/openclaw-process.ts）
- 作为独立子进程运行，由 sidecar 负责配置下发、健康检查和重启治理

#### 通信方式

Nexu 通过“文件 + HTTP + CLI + 子进程管理”与 OpenClaw 通信，没有直接的 in-process API 调用

- 配置通道（主通道）：Nexu API 生成 OpenClaw JSON 配置；gateway sidecar 拉取后写到 OPENCLAW_CONFIG_PATH，OpenClaw 通过文件 watcher 热加载（apps/gateway/src/config.ts、apps/api/src/routes/pool-routes.ts）。
- 事件通道（HTTP）：Slack 事件先到 Nexu API /api/slack/events，完成路由和验签后，再转发到 OpenClaw 的 HTTP 入口 http://{podIp}:18789/slack/events/{accountId}（apps/api/src/routes/slack-events.ts）。
- 进程控制通道（本机进程）：Nexu gateway 进程直接 spawn OpenClaw 子进程，并做重启治理（apps/gateway/src/openclaw-process.ts）。
- 健康检查通道（CLI）：Nexu 定期执行 openclaw health --json / openclaw status --deep --json 来判断可用性，不是走 SDK（apps/gateway/src/gateway-health.ts）。
- 状态文件通道（共享目录）：通过 OPENCLAW_STATE_DIR 共享技能、上下文等运行时文件（如 skills、nexu-context.json），用于能力同步和运行态对齐（apps/gateway/src/config.ts、apps/gateway/src/bootstrap.ts）。

### OpenClaw 的打包体积现状估算

[nexu-openclaw-size.md](nexu-openclaw-size.md)

### 腾讯 QClaw 调研

QClaw 也是使用 Electron + OpenClaw 打包，可以参考其打包体积优化思路。

- QClaw 调研项目: /Users/william/projects/qclaw-research
- 调研报告：[qclaw-reverse-analysis-report.md](qclaw-reverse-analysis-report.md)

### 其他

https://github.com/openclaw/openclaw/issues/20464

## Design

### 1. 参考 QClaw 的体积优化思路

Nexu 未来如果采用 Electron 构建桌面端，并将 OpenClaw 一起打包，体积优化可以参考 QClaw 的整体路线，但不直接复用其具体裁剪清单。

- QClaw 已证明 `Electron + 官方 openclaw npm 包 + 安装后运行时裁剪` 这条路线是可行的。
- 从逆向结果看，QClaw 的主要做法不是修改 OpenClaw 源码或维护深度 fork，而是在安装后的运行时依赖树上做 pruning，并在外围叠加自己的桌面宿主、配置和生命周期管理。
- Nexu 当前与 OpenClaw 的集成方式也适合沿用这一路线：OpenClaw 作为独立子进程运行，Nexu 通过配置文件、HTTP、CLI、状态目录和进程管理与其交互，而不是以内嵌 SDK 的方式直接调用。

因此，本项目的基本设计方向为：

- 以官方 OpenClaw 发行包作为运行时基础；
- 优先通过安装后裁剪、allowlist 复制、依赖排除规则等方式缩小最终桌面包体积；
- 不以修改 OpenClaw 源码或维护长期 fork 作为首选方案；
- 以 Nexu 桌面端实际需要支持的能力面为边界，定义哪些 OpenClaw 运行时内容必须保留。

### 2. 依赖裁剪的原理

运行时依赖裁剪是否安全，取决于被删除的依赖是否会在实际运行路径中被加载。

- 如果某个依赖对应的能力在 Nexu 桌面端不会启用，且 OpenClaw 只会在触发该能力时才动态加载这个依赖，那么该依赖缺失通常不会影响主流程。
- 如果某个依赖在 OpenClaw 启动阶段、默认初始化阶段、常驻扩展加载阶段就会被硬加载，那么删除后通常会导致启动失败或运行时崩溃。
- 因此，能否裁剪不仅取决于“产品是否使用某能力”，还取决于 OpenClaw 对该能力相关依赖的加载语义：是启动即加载，还是 lazy import；缺失时是直接抛错，还是可以降级运行。

QClaw 的逆向结果表明，这类裁剪成立的前提是：

- OpenClaw 中部分大型依赖本身属于可选能力路径；
- 这些能力在当前桌面产品形态中未被使用，或缺失时存在可接受的降级路径；
- 体积优化的本质不是“任意删除包”，而是“移除当前产品能力面内不可达、或可容错缺失的依赖和文件”。

因此，本项目将依赖分为三类进行判断：

- 硬依赖：启动主路径或核心运行路径必须存在，不能裁剪；
- 软依赖：仅在特定能力触发时加载，若桌面端不提供该能力，可作为候选裁剪项；
- 打包噪音：不应进入最终桌面运行时的工具链、辅助入口、未使用文件或依赖子树，应优先清理。

### 3. 裁剪项分析方法

裁剪项分析不以“静态猜测哪些包大”为主要依据，而以“实际运行过程中哪些依赖被加载”作为核心证据，并结合能力边界进行判断。

分析目标包括：

- 明确 Nexu 桌面端首发必须支持的 OpenClaw 能力范围（使用一组 smoke tests 覆盖）；
- 识别核心路径实际加载的依赖集合；
- 识别未被核心路径触达的候选裁剪项；
- 区分“测试中未加载”和“运行时绝不会加载”这两类不同结论，避免误删。

具体分析原则如下：

- 实际未被加载的依赖，只能视为候选裁剪项，不能直接视为安全删除项；
- 必须结合 smoke test 覆盖范围判断其可信度；
- 必须针对 OpenClaw 的真实运行形态进行验证，而不是只看源码静态依赖图；
- 最终保留清单应以可运行的桌面包为准，而不是以开发环境中的一次追踪结果为准。

### 4. 开发态与打包态的分析和验证流程

依赖裁剪分析分为两个阶段：开发态分析和打包态验证。前者用于快速迭代和生成候选清单，后者用于确认真实桌面产物中的可交付结果。

#### 4.1 开发态分析

开发态分析在未打包的本地环境进行，目标是快速识别 OpenClaw 在 Nexu 桌面核心场景下实际加载了哪些依赖。

流程：

1. 定义 Nexu 桌面端首发支持的最小能力集，例如启动、健康检查、配置热加载、目标 channel 通路、技能加载等。
2. 为 OpenClaw 运行过程增加依赖加载追踪，记录实际加载的 JS/ESM 模块、原生模块和关键运行时文件。
3. 基于最小 smoke tests 运行核心场景，形成“已加载依赖清单”。
4. 将未被触达的依赖、扩展文件、辅助二进制入口和明显非核心子树归类为候选裁剪项。
5. 生成初步的 allowlist / denylist / pruning 规则，作为下一轮实验基础。

开发态阶段的作用：

- 分析方便、迭代快、日志和调试信息更完整；
- 适合反复调整裁剪策略；
- 产出的是候选方案，而不是最终结论。

#### 4.2 打包态验证

打包态验证在 Electron 桌面产物上进行，目标是确认经过裁剪后的真实分发形态仍然可启动、可运行、可完成核心任务。

流程：

1. 基于开发态产出的裁剪规则，构建最小桌面包。
2. 在打包产物中验证 OpenClaw 子进程能正常启动、健康检查可通过、配置和状态目录路径正确。
3. 重新执行桌面端核心 smoke tests，验证实际功能链路未被裁剪破坏。
4. 关注打包态特有问题，例如 asar / unpacked 布局、原生模块加载、资源路径变化、文件权限和子进程启动语义。
5. 若发现问题，回到开发态修正规则，再重复验证，直到形成稳定的最终保留集。

打包态阶段的作用：

- 验证裁剪策略在真实桌面发行形态下是否成立；
- 避免出现“开发态可运行、打包后崩溃”的假阳性结论；
- 作为最终交付和体积目标评估的依据。

### 5. 最终设计结论

本项目采用“开发态分析 + 打包态验证”的双阶段方案，对 OpenClaw 桌面运行时进行基于能力面的依赖裁剪。

- 开发态负责低成本识别候选裁剪项；
- 打包态负责验证这些裁剪在真实桌面产物中是否安全；
- QClaw 提供了可借鉴的方向和量级参考，但 Nexu 的最终裁剪集必须基于自身桌面能力范围、OpenClaw 版本和实际测试结果独立得出。

## Plan

<!-- Break down implementation and verification into steps -->

- [ ] Phase 1: Implement the first part of the feature
  - [ ] Task 1
  - [ ] Task 2
  - [ ] Task 3
- [ ] Phase 2: Implement the second part of the feature
  - [ ] Task 1
  - [ ] Task 2
  - [ ] Task 3
- [ ] Phase 3: Test and verify
  - [ ] Test criteria 1
  - [ ] Test criteria 2

## Notes

<!-- Optional: Alternatives considered, open questions, etc. -->
