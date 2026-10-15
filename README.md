# Claude AI

A landing page and serverless endpoint for sending course inquiries to Telegram.

## Vercel deployment

Deploy this folder with `index.html` and the `api/lead.js` file at the project root. In Vercel → **Settings → Environment Variables**, set `TELEGRAM_BOT_TOKEN` and `TELEGRAM_CHAT_ID` for **Production**, then redeploy the production branch. Do not put the bot token in browser files or commit `.env`.

The form posts to `/api/lead` and sends the visitor's name, Telegram contact, and learning goal to the configured Telegram chat. The browser's device-access prompt is not required for this flow; it is unrelated to submitting the form.

Check `https://YOUR-DOMAIN/api/lead`: the endpoint should respond with JSON including `"telegramConfigured":true`. A Vercel `404 NOT_FOUND` means the deployed project/root directory does not include `api/lead.js`.

## Local preview

Create `.env` from `.env.example`, set your bot token and chat ID, run `node server.js`, then open `http://localhost:3000`.
