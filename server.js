const http = require("node:http");

const port = Number(process.env.PORT || 3000);
const botToken = process.env.TELEGRAM_BOT_TOKEN;
const chatId = process.env.TELEGRAM_CHAT_ID;
const maxBodyBytes = 16 * 1024;

const server = http.createServer(async (request, response) => {
  if (request.method === "GET" && request.url === "/api/health") {
    response.writeHead(200, { "Content-Type": "application/json" });
    response.end(JSON.stringify({ ready: Boolean(botToken && chatId) }));
    return;
  }

  if (request.method !== "POST" || request.url !== "/api/lead") {
    response.writeHead(404).end();
    return;
  }

  if (!botToken || !chatId) {
    response.writeHead(503, { "Content-Type": "application/json" });
    response.end(JSON.stringify({ error: "Telegram is not configured" }));
    return;
  }

  let rawBody = "";
  try {
    for await (const chunk of request) {
      rawBody += chunk;
      if (Buffer.byteLength(rawBody) > maxBodyBytes) {
        response.writeHead(413).end();
        return;
      }
    }

    const lead = JSON.parse(rawBody);
    const name = cleanField(lead.name, 100);
    const contact = cleanField(lead.contact, 100);
    const goal = cleanField(lead.goal, 1000);
    if (!name || !contact) {
      response.writeHead(400, { "Content-Type": "application/json" });
      response.end(JSON.stringify({ error: "Name and Telegram contact are required" }));
      return;
    }

    const message = [
      "Нова заявка на курс AI Практикум",
      `Ім’я: ${name}`,
      `Telegram: ${contact}`,
      `Мета: ${goal || "Не вказано"}`,
    ].join("\n");

    const telegramResponse = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chat_id: chatId, text: message }),
      signal: AbortSignal.timeout(10000),
    });
    const telegramResult = await telegramResponse.json();
    if (!telegramResponse.ok || !telegramResult.ok) throw new Error("Telegram delivery failed");

    response.writeHead(200, { "Content-Type": "application/json" });
    response.end(JSON.stringify({ sent: true }));
  } catch {
    response.writeHead(500, { "Content-Type": "application/json" });
    response.end(JSON.stringify({ error: "Unable to deliver the request" }));
  }
});

function cleanField(value, maxLength) {
  return typeof value === "string" ? value.replace(/[<>]/g, "").trim().slice(0, maxLength) : "";
}

server.listen(port, () => {
  console.log(`AI course site listening on port ${port}`);
});
