# Claude AI

A static landing page for practical Claude AI courses. The enrollment form opens Telegram with the visitor's message prefilled. The visitor chooses the recipient and taps **Send**; the website does not request device permissions or silently transmit the form.

## Publish

Upload `index.html`, `script.js`, and `styles.css` to the GitHub repository connected to Vercel. Keep `index.html` at the configured Root Directory, then deploy the production branch. This version needs no API function, bot token, chat ID, or Vercel environment variables.

The Telegram share screen lets the visitor choose a chat. To ensure requests go to your bot, tell visitors to select your bot and tap **Send**. Telegram does not notify the website whether the message was ultimately sent.

## Local preview

Run `node server.js` and open `http://localhost:3000`. The page's Telegram share form works without the local server's `/api/lead` endpoint.
