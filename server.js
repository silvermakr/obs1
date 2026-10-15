const http = require("node:http");
const fs = require("node:fs");
const path = require("node:path");

loadEnvFile();

const port = Number(process.env.PORT || 3000);
const botToken = process.env.TELEGRAM_BOT_TOKEN;
const chatId = process.env.TELEGRAM_CHAT_ID;
const maxBodyBytes = 16 * 1024;
const publicFiles = new Map([
  ["/", ["index.html", "text/html; charset=utf-8"]],
  ["/index.html", ["index.html", "text/html; charset=utf-8"]],
  ["/styles.css", ["styles.css", "text/css; charset=utf-8"]],
  ["/script.js", ["script.js", "text/javascript; charset=utf-8"]],
]);

function loadEnvFile() {
  try {
    const envFile = fs.readFileSync(path.join(__dirname, ".env"), "utf8");
    for (const line of envFile.split(/\r?\n/)) {
      const match = line.match(/^\s*([A-Z_][A-Z0-9_]*)\s*=\s*(.*?)\s*$/);
      if (!match || Object.hasOwn(process.env, match[1])) continue;
      process.env[match[1]] = match[2].replace(/^(["'])(.*)\1$/, "$2");
    }
  } catch (error) {
    if (error.code !== "ENOENT") throw error;
  }
}

const server = http.createServer(async (request, response) => {
  if (request.method === "GET" && publicFiles.has(request.url)) {
    const [fileName, contentType] = publicFiles.get(request.url);
    response.writeHead(200, { "Content-Type": contentType, "Cache-Control": "no-cache" });
    response.end(fs.readFileSync(path.join(__dirname, fileName)));
    return;
  }

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
      "New Claude AI course inquiry",
      `Name: ${name}`,
      `Telegram: ${contact}`,
      `Learning goal: ${goal || "Not provided"}`,
    ].join("\n");

    const telegramResponse = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chat_id: chatId, text: message }),
      signal: AbortSignal.timeout(10000),
    });
    const telegramResult = await telegramResponse.json();
    if (!telegramResponse.ok || !telegramResult.ok) {
      console.error("Telegram API rejected the message:", telegramResult.description || telegramResponse.status);
      response.writeHead(502, { "Content-Type": "application/json" });
      response.end(JSON.stringify({ error: "Telegram could not deliver the message. Check the server configuration and chat ID." }));
      return;
    }

    response.writeHead(200, { "Content-Type": "application/json" });
    response.end(JSON.stringify({ sent: true }));
  } catch (error) {
    console.error("Unable to process Telegram inquiry:", error.message);
    response.writeHead(500, { "Content-Type": "application/json" });
    response.end(JSON.stringify({ error: "Unable to deliver the request. Check that the server is running and Telegram is configured." }));
  }
});

function cleanField(value, maxLength) {
  return typeof value === "string" ? value.replace(/[<>]/g, "").trim().slice(0, maxLength) : "";
}

server.listen(port, () => {
  console.log(`AI course site listening on port ${port}`);
});
