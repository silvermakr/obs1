function cleanField(value, maxLength) {
  return typeof value === "string" ? value.replace(/[<>]/g, "").trim().slice(0, maxLength) : "";
}

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[character]);
}

function isValidName(value) {
  return /^(?=.{2,100}$)[\p{L}]+(?:[ '\u2019-][\p{L}]+)*$/u.test(value);
}

function isValidTelegramUsername(value) {
  return /^@[A-Za-z][A-Za-z0-9_]{4,31}$/.test(value);
}

function respond(response, status, title, message) {
  const safeTitle = escapeHtml(title);
  const safeMessage = escapeHtml(message);
  const resultMessage = JSON.stringify({ type: "lead-form-result", success: status < 400, message }).replace(/</g, "\\u003c");
  response.status(status).setHeader("Content-Type", "text/html; charset=utf-8");
  response.setHeader("Cache-Control", "no-store");
  response.send(`<!doctype html><html lang="en"><meta charset="utf-8"><title>${safeTitle} — Claude AI</title><main data-form-result="${status < 400 ? "success" : "error"}"><h1>${safeTitle}</h1><p>${safeMessage}</p></main><script>window.parent.postMessage(${resultMessage},"*")<\/script></html>`);
}

module.exports = async function handler(request, response) {
  const botToken = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;

  if (request.method === "GET") {
    response.setHeader("Cache-Control", "no-store");
    response.status(200).json({ endpoint: "ready", telegramConfigured: Boolean(botToken && chatId) });
    return;
  }

  if (request.method !== "POST") {
    response.setHeader("Allow", "POST");
    respond(response, 405, "Method not allowed", "Please submit the course form.");
    return;
  }

  if (!botToken || !chatId) {
    respond(response, 503, "Setup needed", "Telegram is not configured on the server.");
    return;
  }

  const lead = request.body && typeof request.body === "object" ? request.body : {};
  const name = cleanField(lead.name, 100);
  const contact = cleanField(lead.contact, 100);
  const goal = cleanField(lead.goal, 1000);
  if (!isValidName(name)) {
    respond(response, 400, "Check your name", "Enter a valid name using letters, spaces, apostrophes, or hyphens. Numbers are not allowed.");
    return;
  }
  if (!isValidTelegramUsername(contact)) {
    respond(response, 400, "Check your Telegram username", "Enter a username in the format @username (5–32 letters, numbers, or underscores).");
    return;
  }

  const message = [
    "New Claude AI course inquiry",
    `Name: ${name}`,
    `Telegram: ${contact}`,
    `Learning goal: ${goal || "Not provided"}`,
  ].join("\n");

  try {
    const telegramResponse = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chat_id: chatId, text: message }),
      signal: AbortSignal.timeout(10000),
    });
    const telegramResult = await telegramResponse.json();
    if (!telegramResponse.ok || !telegramResult.ok) {
      console.error("Telegram API rejected the message:", telegramResult.description || telegramResponse.status);
      respond(response, 502, "Telegram delivery failed", `Telegram error: ${telegramResult.description || "Please check the bot configuration."}`);
      return;
    }

    respond(response, 200, "Request sent", "Your course request was delivered to Telegram. We’ll reply to you there.");
  } catch (error) {
    console.error("Unable to deliver Telegram inquiry:", error.message);
    respond(response, 502, "Telegram delivery failed", "The request could not be delivered. Please try again later.");
  }
};
