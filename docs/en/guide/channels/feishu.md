# Feishu (Lark)

Get an App ID and App Secret to connect your Feishu bot to nexu.

## Step 1: Create a Feishu App

1. Open the [Feishu Open Platform](https://open.feishu.cn/app), log in, and click **Create Enterprise Self-Built App**.

![Feishu Open Platform app list](/assets/feishu/step1-app-list.webp)

2. Enter the app name and description, choose an icon, and click **Create**.

![Create enterprise self-built app](/assets/feishu/step1-create-app.webp)

3. Go to **Credentials & Basic Info** and copy:
   - **App ID**
   - **App Secret**

![Get App ID and App Secret](/assets/feishu/step1-credentials.webp)

## Step 2: Enter Credentials in nexu

Open the nexu client, enter the App ID and App Secret in the Feishu channel configuration, and click **Connect**.

![Enter credentials in nexu](/assets/feishu/step3-nexu-connect.webp)

## Step 3: Import App Permissions

1. In the Feishu Open Platform, go to your app, click **Permission Management** in the left menu, then click **Bulk Import/Export Permissions**.

![Permission management page](/assets/feishu/step3-permission-management.webp)

2. In the dialog, select **Import**, paste the following JSON into the input box, and click **Next, Confirm New Permissions**.

![Paste permissions JSON](/assets/feishu/step3-paste-json.webp)

::: details Click to expand permissions JSON
```json
{
  "scopes": {
    "tenant": [
      "board:whiteboard:node:create",
      "board:whiteboard:node:delete",
      "board:whiteboard:node:read",
      "board:whiteboard:node:update",
      "calendar:calendar.acl:create",
      "calendar:calendar.acl:delete",
      "calendar:calendar.acl:read",
      "calendar:calendar.event:create",
      "calendar:calendar.event:delete",
      "calendar:calendar.event:read",
      "calendar:calendar.event:reply",
      "calendar:calendar.event:update",
      "calendar:calendar.free_busy:read",
      "calendar:calendar:create",
      "calendar:calendar:delete",
      "calendar:calendar:read",
      "calendar:calendar:subscribe",
      "calendar:calendar:update",
      "cardkit:card:write",
      "contact:contact.base:readonly",
      "contact:user.base:readonly",
      "docs:document.comment:create",
      "docs:document.comment:read",
      "docs:document.comment:update",
      "docs:document.comment:write_only",
      "docs:permission.member:create",
      "docx:document.block:convert",
      "docx:document:create",
      "docx:document:readonly",
      "docx:document:write_only",
      "drive:drive.metadata:readonly",
      "drive:drive.search:readonly",
      "drive:drive:version",
      "drive:drive:version:readonly",
      "im:app_feed_card:write",
      "im:biz_entity_tag_relation:read",
      "im:biz_entity_tag_relation:write",
      "im:chat",
      "im:chat.access_event.bot_p2p_chat:read",
      "im:chat.announcement:read",
      "im:chat.announcement:write_only",
      "im:chat.chat_pins:read",
      "im:chat.chat_pins:write_only",
      "im:chat.collab_plugins:read",
      "im:chat.collab_plugins:write_only",
      "im:chat.managers:write_only",
      "im:chat.members:bot_access",
      "im:chat.members:read",
      "im:chat.members:write_only",
      "im:chat.menu_tree:read",
      "im:chat.menu_tree:write_only",
      "im:chat.moderation:read",
      "im:chat.tabs:read",
      "im:chat.tabs:write_only",
      "im:chat.top_notice:write_only",
      "im:chat.widgets:read",
      "im:chat.widgets:write_only",
      "im:chat:create",
      "im:chat:delete",
      "im:chat:moderation:write_only",
      "im:chat:operate_as_owner",
      "im:chat:read",
      "im:chat:readonly",
      "im:chat:update",
      "im:datasync.feed_card.time_sensitive:write",
      "im:message",
      "im:message.group_at_msg:readonly",
      "im:message.group_msg",
      "im:message.p2p_msg:readonly",
      "im:message.pins:read",
      "im:message.pins:write_only",
      "im:message.reactions:read",
      "im:message.reactions:write_only",
      "im:message.urgent",
      "im:message.urgent.status:write",
      "im:message.urgent:phone",
      "im:message.urgent:sms",
      "im:message:readonly",
      "im:message:recall",
      "im:message:send_as_bot",
      "im:message:send_multi_depts",
      "im:message:send_multi_users",
      "im:message:send_sys_msg",
      "im:message:update",
      "im:resource",
      "im:tag:read",
      "im:tag:write",
      "im:url_preview.update",
      "im:user_agent:read",
      "sheets:spreadsheet.meta:read",
      "sheets:spreadsheet.meta:write_only",
      "sheets:spreadsheet:create",
      "sheets:spreadsheet:read",
      "sheets:spreadsheet:write_only",
      "task:task:read",
      "task:task:write",
      "task:tasklist:read",
      "task:tasklist:write",
      "wiki:member:create",
      "wiki:member:retrieve",
      "wiki:member:update",
      "wiki:wiki:readonly"
    ],
    "user": [
      "contact:contact.base:readonly"
    ]
  }
}
```
:::

3. Review the imported permissions list (102 total) and click **Apply**.

![Confirm imported permissions](/assets/feishu/step3-confirm-permissions.webp)

4. In the data scope confirmation dialog, click **Confirm**.

![Confirm data scope](/assets/feishu/step3-data-scope.webp)

These permissions cover messaging, document read/write, calendar management, spreadsheet operations, and more — ensuring all nexu Agent Skills work properly.

## Step 4: Configure Events and Callbacks

### Event Configuration

1. In the Feishu Open Platform, go to your app, click **Events & Callbacks** in the left menu, and open the **Event Configuration** tab.

![Events & Callbacks page](/assets/feishu/step4-event-config.webp)

2. Click the edit button next to the subscription method, select **Use persistent connection to receive events**, and click **Save**.

![Select persistent connection for events](/assets/feishu/step4-event-websocket.webp)

3. Click **Add Event**.

![Add event button](/assets/feishu/step4-add-event.webp)

4. Search for and select the following events, then click **Add**:
   - **First conversation between user and bot created** (`p2p_chat_create`)
   - **Receive message** (`im.message.receive_v1`)
   - **Bot added to group** (`im.chat.member.bot.added_v1`)
   - **User enters conversation with bot** (`im.chat.access_event.bot_p2p_chat_entered_v1`)

![Select events](/assets/feishu/step4-select-event.webp)

5. Confirm the added events in the list.

![Added events list](/assets/feishu/step4-event-list.webp)

### Callback Configuration

1. Switch to the **Callback Configuration** tab and click the edit button next to the subscription method.

![Callback configuration page](/assets/feishu/step4-callback-tab.webp)

2. Select **Use persistent connection to receive callbacks** and click **Save**.

![Select persistent connection for callbacks](/assets/feishu/step4-callback-websocket.webp)

3. Click **Add Callback**.

![Add callback button](/assets/feishu/step4-add-callback.webp)

4. Select the **Card** category, check **Card action callback** (`card.action.trigger`), and click **Add**.

![Select card action callback](/assets/feishu/step4-select-callback.webp)

## Step 5: Publish and Test

1. Go to **Version Management & Release** in the Feishu Open Platform.

![Version management & release](/assets/feishu/step4-version-manage.webp)

2. Click **Create Version**, fill in the version number and release notes, and click **Save**.

![Create version](/assets/feishu/step4-create-version.webp)

3. Click **Confirm Release** and wait for approval.

![Confirm release](/assets/feishu/step4-publish.webp)

4. Once approved, click **Chat** in the nexu client to start chatting with your bot in Feishu 🎉

![Feishu connected](/assets/feishu/step3-connected.webp)

## FAQ

**Q: Do I need a public server?**

No. nexu uses Feishu's persistent connection (WebSocket) mode — no public IP or callback URL required.

**Q: Why are so many permissions needed?**

These permissions correspond to nexu Agent Skills (messaging, documents, calendar, spreadsheets, etc.). If you only need basic chat, you can enable just the `im:` permissions.
