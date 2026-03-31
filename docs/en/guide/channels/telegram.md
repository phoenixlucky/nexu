# Telegram

Get a Bot Token and connect your Telegram bot to nexu in minutes.

## Step 1: Create a Telegram Bot

1. Open Telegram, search for **BotFather**, and tap "Open" to start a conversation.

![Search and open BotFather](/assets/telegram/step1-search-botfather.webp)

2. Send the `/newbot` command.

![Send /newbot](/assets/telegram/step1-newbot.webp)

3. Follow the prompts to enter:
   - **Bot name** (display name, e.g. `nexu_eli`)
   - **Bot username** (must end with `bot`, e.g. `nexu_elibot`)

4. Once created, BotFather will reply with a message containing your **Bot Token** (format: `8549010317:AAEZw-DEou...`). Copy and save it.

![Get Bot Token](/assets/telegram/step1-bot-token.webp)

## Step 2: Connect Telegram in nexu

1. Open the nexu client and click **Telegram** in the "Choose a channel to get started" section.

![Select Telegram channel](/assets/telegram/step2-choose-telegram.webp)

2. In the "Connect Telegram" dialog, paste your Bot Token and click "Connect Telegram".

![Paste Bot Token and connect](/assets/telegram/step2-nexu-connect.webp)

## Step 3: Start Chatting

Once connected, search for your bot's username in Telegram and send `/start` to begin chatting with your OpenClaw Agent 🎉

![Chat with bot in Telegram](/assets/telegram/step3-chat.webp)

---

## FAQ

**Q: Do I need a public server?**

No. nexu uses Telegram Bot API's long-polling mode — no public IP or webhook URL required.

**Q: The bot isn't responding to messages?**

Make sure the Bot Token is correct and the nexu client is running.

**Q: Can I use it in a group?**

Yes. Add the bot to a Telegram group and @mention the bot username to trigger a reply.

**Q: Can the Agent reply when my computer is off?**

nexu needs to be running. As long as the nexu client is active in the background (and your computer isn't asleep), the Agent can reply to Telegram messages 24/7.
