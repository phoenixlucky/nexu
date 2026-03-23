# WeChat ClawBot Setup Guide

::: tip Note
**Nexu** is a third-party open-source client with no official affiliation to WeChat. ClawBot plugin rules follow WeChat's official documentation; model access and entitlements are defined on the Nexu website.
:::

WeChat recently added a new capability: **you can chat with AI directly inside WeChat**. It works through the **ClawBot plugin** — essentially a new "AI chat window" within WeChat.

Here is what it looks like:

![AI conversation inside WeChat](/assets/wechat-clawbot-conversation.jpeg)

Yes — **chat with AI right inside WeChat**, just like talking to a friend. Available on your phone anytime, even on the go.

The catch is that the official setup requires a **command line**, which puts off a lot of people. Today we will show an easier way: **Nexu** — an open-source desktop client by the **Refly** team. **It is entirely GUI-based** — no code to write, just scan a QR code and you are done.

During the beta, signing in with a Nexu account gives you access to models like Claude, GPT, and Gemini (quotas are shown in the client). You can also use your own API keys — that is called **BYOK** — you pay your own provider, no lock-in.

Nexu is fully open source: [github.com/nexu-io/nexu](https://github.com/nexu-io/nexu). If it helps, a Star on GitHub goes a long way.

## What Nexu is

**In one line: the simplest OpenClaw 🦞 desktop client.** Built by the **Refly** team, open source and free.

What does it do? **It connects an AI assistant to the chat apps you already use** — WeChat, Feishu, Slack, Discord. No server to set up, no technical knowledge required. **Install, scan, done.**

![Nexu client and channels overview](/assets/wechat-clawbot-overview.png)

**Where to download:** the [github.com/nexu-io/nexu](https://github.com/nexu-io/nexu) repo has installers and documentation.

## What you need before starting

Just two things:

- A **Mac** (macOS 12+, Apple Silicon)
- WeChat updated to a **recent version** (one that supports the ClawBot plugin)

That is it. No server, no WeCom, no Official Account.

## Step by step: from download to chatting in WeChat

**Step 1: Update WeChat**

Open WeChat and check the version. If it is too old, update from the App Store.

**Step 2: Download Nexu**

Go to [github.com/nexu-io/nexu](https://github.com/nexu-io/nexu), download the Mac installer from the Releases page. You get a .dmg file — drag the icon into Applications, just like any other Mac app.

**Step 3: Open Nexu and choose how to sign in**

You will see a welcome screen with sign-in options:

![Welcome and sign-in options](/assets/wechat-clawbot-welcome.png)

**Recommended: "Use your Nexu account"** — sign in with a Nexu account and get instant access to Claude, GPT, and more during the beta. No API keys needed. Easiest path for new users.

**If you already have an API key** (e.g. OpenAI or Anthropic), choose "Use your own models" and paste your key. You can skip account registration entirely.

Most people should start with the first option.

**Step 4: Select WeChat**

After signing in, the home screen shows four channels: WeChat, Feishu, Slack, Discord. **Click WeChat.**

![Selecting the WeChat channel](/assets/wechat-clawbot-channel-wechat.png)

**Step 5: Scan to connect**

A "Connect WeChat" window appears. Click the green **"Scan to connect"** button.

![Connect WeChat / QR flow](/assets/wechat-clawbot-connect-qr.png)

Nexu automatically installs the WeChat ClawBot plugin and generates a QR code. **Open WeChat on your phone, scan the code**, and confirm on your phone. Binding is complete.

**Step 6: Done**

Back on the Nexu home screen, the WeChat channel now shows **"Connected"**. The whole process takes less than 5 minutes.

![WeChat channel connected](/assets/wechat-clawbot-channel-connected.png)

**Step 7: Open WeChat and start chatting**

Back in WeChat, you will find a new conversation called **"WeChat ClawBot"**. Send it a message — the AI model you selected in Nexu is behind it.

Use it **anytime, anywhere**: commuting, eating, before bed — whenever a question comes to mind, just open WeChat and ask.

![WeChat-side assistant entry](/assets/wechat-clawbot-wechat-entry.jpeg)

## Common questions

**Does it cost money?**

Nexu itself is open source and free. During the beta, signing in with a Nexu account lets you try multiple models. You can also use your own API keys and pay through your own account.

**Do I need to keep my computer on?**

Nexu needs to run in the background. As long as your Mac is awake and Nexu is open, the AI will keep replying to WeChat messages.

**Does it only work with WeChat?**

No. Nexu supports **WeChat, Feishu, Slack, and Discord** simultaneously.

**Can I switch models?**

Yes. There is a model selector at the top of the Nexu home screen — switch with one click.

**Do I need technical skills?**

Not at all. Everything is GUI-based, zero command line. If you can install an app, you can use Nexu.

## How Nexu compares

| | OpenClaw official / self-hosted | Typical hosted | Nexu |
| --- | --- | --- | --- |
| **Getting started** | Command line and config work | Depends on vendor, often tied to plans | **GUI** — install and scan |
| **Data** | Can be local, complex to deploy | Goes through a third party | **Runs on your machine**, local-first |
| **Models** | Flexible but technical | Often locked by platform | **Beta models included**, or BYOK |
| **Cost** | You pay for infra | Monthly subscriptions | **Client is open source and free** |
| **Channels** | Wire them yourself | Usually one platform | **WeChat / Feishu / Slack / Discord** |
| **Source** | Varies by component | Mostly closed | **MIT open source** |

## What you can do with it

- **E-commerce**: have AI write multi-platform listings, translate product highlights.
- **Content**: chase trends, outline articles, revise copy — ask in WeChat anytime.
- **Engineering**: paste error logs and get analysis.
- **Contracts**: extract key points and flag risk clauses (always have a professional review).
- **Small business**: auto-reply to stock queries, organize support scripts.
- **Creative**: toss in a brief, get directions and references.

## Questions? Find us on GitHub

All conversation is **centralized on GitHub** — bug reports, feature ideas, usage discussions:

**Issues** (bugs, feature requests): [github.com/nexu-io/nexu/issues](https://github.com/nexu-io/nexu/issues)

![GitHub Issues](/assets/wechat-clawbot-github-issues.png)

**Discussions** (ideas, Q&A, roadmap): [github.com/nexu-io/nexu/discussions](https://github.com/nexu-io/nexu/discussions)

![GitHub Discussions](/assets/wechat-clawbot-github-discussions.png)

The team **responds in both channels**. For **active contributors** — great issues, code contributions, quality discussions — we run **periodic token rewards** (see repo announcements for details).

## Why we built Nexu

We believe: **which model you use, where your data lives, and how you pay should be your choice** — not locked in by a platform.

Nexu is **MIT open source**: you can read every line, fork it, and make it your own. **Personal intelligence starts from the computer you control.**

**Repository:** [github.com/nexu-io/nexu](https://github.com/nexu-io/nexu)

Found it useful? Feel free to **save and share**. Got questions? Head to GitHub — we will be there.
