# Claude AI

A landing page and a small Node.js server that delivers course inquiries to Telegram.

## Set up the Telegram bot

1. Open `@BotFather` in Telegram, run `/newbot`, and save the token it gives you.
2. Send `/start` to your new bot from your Telegram account.
3. To find your chat ID, open `https://api.telegram.org/bot<TOKEN>/getUpdates` after sending `/start`, then find `message.chat.id` in the response. Keep the URL and token private.
4. In the project folder, make a copy of `.env.example` named `.env`. Open `.env` and replace the example values with your new bot token and chat ID:

```powershell
TELEGRAM_BOT_TOKEN=paste-your-new-bot-token-here
TELEGRAM_CHAT_ID=paste-your-chat-id-here
PORT=3000
```

5. Save `.env` and start the server:

```powershell
node server.js
```

Open `http://localhost:3000`. The server hosts the page and forwards `/api/lead` requests to the configured Telegram chat. The bot token stays on the server and is never sent to the browser. For a public deployment, host the Node.js server on a Node.js-compatible platform and set the same environment variables there.

Create the bot through BotFather from your own Telegram account. Creating a bot or retrieving its token requires access to that account. Never share your `.env` file or commit it; it is excluded by `.gitignore`.
