# 微信 ClawBot 接入指南

::: tip 提示
**Nexu** 是第三方开源客户端，与微信官方无合作关系；ClawBot 插件的规则以微信官方说明为准，模型与权益以 Nexu 官网公示为准。
:::

最近微信上多了个新玩法：**可以在微信里直接和 AI 对话了**。靠的是微信的 **ClawBot 插件**——简单说就是微信里多了一个「AI 聊天窗口」。

我试了一下，效果长这样：

![微信里与 AI 对话](/assets/wechat-clawbot-conversation.jpeg)

对，就是**在微信里，像聊天一样问 AI**。手机上随时都能用，走在路上也能问。

但问题是，官方的接入方式要**敲命令行**，很多人看到就劝退了。今天介绍一个更简单的路子：**Nexu**——一个 **Refly 团队**做的开源桌面客户端，**全程图形界面操作**，不用写代码，扫一次码就能搞定。

而且内测阶段，用 Nexu 账号登录就能直接体验 Claude、GPT、Gemini 等模型（具体额度以客户端显示为准）。你也可以填自己的 API Key 来用，这叫 **BYOK**——用谁家的 Key 就走谁的费用，不绑死。

Nexu 完全开源，代码在 GitHub 上：[github.com/nexu-io/nexu](https://github.com/nexu-io/nexu)。觉得好用欢迎去点个 Star 支持一下。

## Nexu 是什么

**一句话：最简单的 OpenClaw 🦞（龙虾）桌面客户端。** 由 **Refly 团队**出品，开源免费。

它能干嘛？**把 AI 助手直接接到你常用的聊天工具里**——微信、飞书、Slack、Discord 都行。不用搭服务器，不用懂技术，**双击安装、扫码绑定**，就这么简单。

![Nexu 客户端与渠道示意](/assets/wechat-clawbot-overview.png)

**去哪下载：** [github.com/nexu-io/nexu](https://github.com/nexu-io/nexu) 仓库里有安装包和使用说明。

## 开始之前你要准备什么

很简单，就两样东西：

- 一台 **Mac**（macOS 12 以上，Apple Silicon 芯片）
- 微信更新到**较新版本**（支持 ClawBot 插件的版本）

没了。不需要服务器、不需要企业微信、不需要公众号。

## 跟着做：从下载到微信里能用

**第一步：更新微信**

打开微信，检查一下版本号。如果版本太旧，去 App Store 更新一下。

**第二步：下载 Nexu**

打开 [github.com/nexu-io/nexu](https://github.com/nexu-io/nexu)，在 Release 页面下载 Mac 安装包。下载完是一个 .dmg 文件，把图标拖到「应用程序」就装好了，跟装别的 Mac 软件一模一样。

**第三步：打开 Nexu，选登录方式**

打开 Nexu 会看到一个欢迎页，让你选怎么登录：

![欢迎页与登录方式](/assets/wechat-clawbot-welcome.png)

**推荐选「Use your Nexu account」**：用 Nexu 账号登录，内测阶段直接能用 Claude、GPT 等模型，不用自己搞 Key，对新手最省事。

**如果你已经有 API Key**（比如 OpenAI 或 Anthropic 的），可以选「Use your own models」，直接填 Key 就能用，甚至不用注册账号。

大多数人选第一个就好。

**第四步：点微信**

登录后进到首页，下面有四个渠道：WeChat、Feishu、Slack、Discord。**点 WeChat。**

![在客户端中选择 WeChat 渠道](/assets/wechat-clawbot-channel-wechat.png)

**第五步：扫码连接**

会弹出一个「连接微信」的窗口，点里面的绿色 **「扫码连接」** 按钮。

![连接微信 / 扫码示意](/assets/wechat-clawbot-connect-qr.png)

Nexu 会自动帮你装好微信 ClawBot 插件，然后生成一个二维码。**掏出手机，打开微信扫一扫**，扫这个码，手机上确认一下就绑定成功了。

**第六步：搞定了**

回到 Nexu 首页，微信渠道会变成**「已连接」**的状态。整个过程不超过 5 分钟。

![微信渠道已连接](/assets/wechat-clawbot-channel-connected.png)

**第七步：打开微信，直接聊**

回到微信，你会发现多了一个叫 **「微信 ClawBot」** 的对话。直接给它发消息就行了——它背后就是你在 Nexu 里选的 AI 模型。

手机上**随时随地**都能用：通勤、吃饭、睡前想到什么问题，打开微信问就行。

![微信侧对话入口](/assets/wechat-clawbot-wechat-entry.jpeg)

## 几个大家最关心的问题

**要花钱吗？**

Nexu 本身开源免费。内测阶段用 Nexu 账号登录可以直接体验多款模型。你也可以用自己的 API Key，费用走你自己的账户。

**需要一直开着电脑吗？**

Nexu 需要在后台运行。只要你的 Mac 不休眠、Nexu 还开着，AI 就能持续回复微信消息。

**只能接微信吗？**

不是。Nexu 同时支持**微信、飞书、Slack、Discord** 四个渠道，可以一起接入。

**能换模型吗？**

能。在 Nexu 首页顶部有个模型选择器，一键就能切换不同模型。

**需要懂技术吗？**

完全不需要。全程图形界面操作，没有一行命令行。能装 App 就能用。

## 和其他方案比，Nexu 好在哪

| | OpenClaw 官方 / 纯自建 | 典型托管方案 | Nexu |
| --- | --- | --- | --- |
| **上手难度** | 要折腾命令行和配置 | 看平台，常被套餐绑定 | **图形界面**，双击安装、扫码绑定 |
| **数据** | 可本地，但部署复杂 | 数据经第三方 | **跑在你电脑上**，数据本地优先 |
| **模型** | 灵活但技术门槛高 | 常被平台锁死 | **可选内测模型**，也可自带 Key |
| **费用** | 基础设施自己出 | 常见按月订阅 | **客户端开源免费** |
| **渠道** | 需自己对接 | 通常只支持一个 | **微信 / 飞书 / Slack / Discord** |
| **源码** | 看组件而定 | 多闭源 | **MIT 开源**，代码随时可查 |

## 你可以拿它做什么

- **做电商**：让 AI 帮你写多平台 listing、翻译产品卖点。
- **做内容**：追热点、列大纲、改文案，微信里随时问一句。
- **写代码**：把报错贴给它，让它帮你分析问题。
- **看合同**：让它帮你整理要点、标注风险条款（最终还是要专业人士把关）。
- **开小店**：自动回复库存查询、整理售后话术。
- **做创意**：丢一句简报需求，让它帮你出方向、找参考。

## 遇到问题？来 GitHub 找我们

我们把所有交流**统一放在 GitHub 开源社区**——问题反馈、功能建议、使用交流，全都在这里：

**Issues**（反馈 Bug、提需求）：[github.com/nexu-io/nexu/issues](https://github.com/nexu-io/nexu/issues)

![GitHub Issues](/assets/wechat-clawbot-github-issues.png)

**Discussions**（聊想法、问问题、看路线图）：[github.com/nexu-io/nexu/discussions](https://github.com/nexu-io/nexu/discussions)

![GitHub Discussions](/assets/wechat-clawbot-github-discussions.png)

团队会**第一时间在这两个板块回复**。对于**积极互动**的同学——比如提了好 Issue、贡献了代码、写了有质量的讨论——我们会**不定期发放 token 奖励**（具体活动看仓库内公告）。

## 为什么做 Nexu

我们觉得：**模型用谁的、数据存在哪、钱怎么花，应该由你自己决定**——不应该被某个平台锁死。

Nexu 选择 **MIT 开源**：代码你都看得到，想 fork 自己改也行。**个人智能，从你能掌控的那台电脑开始。**

**开源仓库：** [github.com/nexu-io/nexu](https://github.com/nexu-io/nexu)

觉得有用？欢迎**收藏、转发**；有问题直接去 GitHub 上聊，我们在那儿等你。
