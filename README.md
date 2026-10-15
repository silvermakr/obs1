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

Open `http://localhost:3000`. The local Node.js server hosts the page and forwards `/api/lead` requests to the configured Telegram chat.

## Deploy to Vercel

The `api/lead.js` function handles form submissions on the same Vercel domain, so visitors' browsers do not need access to `localhost` or the visitor's device. In Vercel, open the project settings and add `TELEGRAM_BOT_TOKEN` and `TELEGRAM_CHAT_ID` as environment variables, then redeploy. Keep the bot token out of the client-side files.

Create the bot through BotFather from your own Telegram account. Creating a bot or retrieving its token requires access to that account. Never share your `.env` file or commit it; it is excluded by `.gitignore`.
