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

## Publish with GitHub and Vercel

The Vercel API function is `api/lead.js`. Keep this folder in the repository root (the same level as `index.html`). In Vercel, set the project's **Root Directory** to the folder containing `index.html` and `api/lead.js`.

1. Create a **private** GitHub repository and upload the project files: `api/`, `index.html`, `script.js`, `styles.css`, `README.md`, and `.gitignore`. Do not upload `.env`, `server-debug.log`, or any bot token. The provided `.gitignore` excludes the secret file and logs.
2. In Vercel, open the existing project and choose **Settings → Git → Connect Git Repository**. Select that GitHub repository. If your current Vercel project is already connected to another repo, connect the repo that contains these files or import this repository as a Vercel project.
3. In **Settings → General**, confirm **Root Directory** points to the directory containing `index.html` and `api/lead.js` (usually `./`).
4. In **Settings → Environment Variables**, add `TELEGRAM_BOT_TOKEN` and `TELEGRAM_CHAT_ID`, both scoped to **Production**. Use the values from your bot setup; never put them in GitHub or frontend files.
5. Deploy the `main` branch from **Deployments**. New commits pushed to the configured production branch will redeploy automatically.
6. Verify `https://YOUR-DOMAIN/api/lead` returns JSON with `"endpoint":"ready"` and `"telegramConfigured":true`. Then submit a test request on the site and check Telegram.

If the endpoint returns Vercel's `404 NOT_FOUND`, the deployed project's repository or Root Directory does not contain `api/lead.js` at its root. If `telegramConfigured` is `false`, check the Production environment variables and redeploy.

### Local development

Keep the `.env` setup above for local use, then run `node server.js` and open `http://localhost:3000`.

Create the bot through BotFather from your own Telegram account. Creating a bot or retrieving its token requires access to that account. Never share your `.env` file or commit it; it is excluded by `.gitignore`.
