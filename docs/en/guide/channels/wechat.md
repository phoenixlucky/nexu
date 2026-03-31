# WeChat

Connect your personal WeChat to nexu with a single QR scan — takes less than 5 minutes.

## Prerequisites

- **WeChat version** ≥ 8.0.7 (minimum version required for ClawBot plugin support)
- **macOS** 12+ (Apple Silicon)

## Step 1: Update WeChat to 8.0.7

Update WeChat to version 8.0.7 or higher. This is the minimum version required to support the ClawBot plugin.

## Step 2: Download and Install nexu

1. Go to the [nexu website](https://nexu.io) and click **Download Mac Client**.

![nexu download page](/assets/wechat/step1-download.webp)

2. Open the `.dmg` file and drag the **Nexu** icon into the **Applications** folder.

![Install nexu](/assets/wechat/step1-install.webp)

## Step 3: Launch nexu and Sign In

1. Open nexu from Applications.
2. On the welcome page, choose a sign-in method:
   - **Use your Nexu account** (recommended): Sign in with your nexu account to access Claude, GPT, Gemini, and more for free.
   - **Use your own models (BYOK)**: Enter your own API Key — no registration required.

![Choose sign-in method](/assets/wechat/step2-login.webp)

## Step 4: Select the WeChat Channel

After signing in, click **WeChat** in the "Choose a channel to get started" section on the nexu home screen.

![Select WeChat channel](/assets/wechat/step3-choose-wechat.webp)

## Step 5: Scan the QR Code to Connect WeChat

1. In the "Connect WeChat" dialog, click the green **Scan to Connect** button.

![Click scan to connect](/assets/wechat/step4-connect-dialog.webp)

2. nexu will automatically install the WeChat ClawBot plugin and generate a QR code. The page will show "Waiting for scan...".

![Waiting for scan](/assets/wechat/step4-scan-qrcode.webp)

3. Open **WeChat** on your phone, use **Scan** to scan the QR code on screen, then tap **Confirm** on your phone.

## Step 6: Connection Successful

After confirming the scan, the WeChat channel on the nexu home screen will show as **Connected**.

![WeChat connected](/assets/wechat/step5-connected.webp)

## Step 7: Chat in WeChat

Open WeChat and you'll see a conversation called **WeChat ClawBot**. Send a message to start chatting with your OpenClaw Agent — available anytime on mobile, not limited to desktop.

![Chat with ClawBot in WeChat](/assets/wechat/step6-chat.webp)

---

## FAQ

**Q: Do I need a public server?**

No. nexu connects directly via the WeChat ClawBot plugin — no public IP or callback URL required.

**Q: Do I need WeChat Work or an Official Account?**

No. WeChat 8.0.7 natively supports the ClawBot plugin. A personal WeChat account is all you need.

**Q: Will my account get banned?**

No. ClawBot is an officially released WeChat plugin and is fully compliant.

**Q: Can the Agent reply when my computer is off?**

nexu needs to be running. As long as the nexu client is active in the background (and your computer isn't asleep), the Agent can reply to WeChat messages 24/7.

**Q: Can I connect multiple channels at the same time?**

Yes. nexu supports connecting WeChat, Feishu, Slack, Discord, and other channels simultaneously.

**Q: How do I switch AI models?**

Use the model selector at the top of the nexu home screen to switch between Claude, GPT, Gemini, and more with one click.
