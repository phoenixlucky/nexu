# Discord

Get an Application ID and Bot Token to connect your Discord bot to nexu.

## Step 1: Create a Discord Application

1. Open the [Discord Developer Portal](https://discord.com/developers/applications) and click **New Application**.

![Discord Applications page](/assets/discord/step1-applications.webp)

2. Enter an application name and click **Create**.

![Create application](/assets/discord/step1-create-app.webp)

3. On the **General Information** page, copy and save:
   - **Application ID**

![Get Application ID](/assets/discord/step1-general-info.webp)

4. Go to **Bot** in the left menu, click **Reset Token** to generate a Bot Token, then copy and save:
   - **Bot Token**

![Generate Bot Token](/assets/discord/step3-bot-token.webp)

## Step 2: Enter Credentials in nexu

Open the nexu client, enter the App ID and Bot Token in the Discord channel configuration, and click **Connect**.

![Enter credentials in nexu](/assets/discord/step2-nexu-connect.webp)

## Step 3: Configure Permissions and Invite the Bot

1. Back in the Discord Developer Portal, go to **Bot** and enable the following under Privileged Gateway Intents:
   - **Message Content Intent**

![Enable Message Content Intent](/assets/discord/step4-intents.webp)

2. Go to **OAuth2** in the left menu. Under Scopes, check `bot`. Under Bot Permissions, check `Administrator`.

![Select Scopes and Bot Permissions](/assets/discord/step5-scopes.webp)

3. Copy the generated URL at the bottom of the page and open it in your browser.

![Copy generated URL](/assets/discord/step5-generated-url.webp)

4. Select your server and click **Continue**.

![Select server](/assets/discord/step3-select-server.webp)

5. Review the permissions and click **Authorize** to add the bot.

![Authorize bot](/assets/discord/step3-authorize.webp)

## Step 4: Test

Once connected, click **Chat** in the nexu client to jump to Discord and start chatting with your bot 🎉

![Discord connected](/assets/discord/step4-connected.webp)

## FAQ

**Q: Do I need a public server?**

No. nexu uses Discord Gateway (WebSocket) — no public IP or callback URL required.

**Q: The bot isn't responding to messages?**

Make sure **Message Content Intent** is enabled. Without it, the bot cannot read message content.
