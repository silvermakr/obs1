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

function respondToForm(request, response, status, title, message) {
  if (!request.headers.accept?.includes("text/html")) {
    response.writeHead(status, { "Content-Type": "application/json" });
    response.end(JSON.stringify(status >= 400 ? { error: message } : { sent: true }));
    return;
  }

  const safeTitle = escapeHtml(title);
  const safeMessage = escapeHtml(message);
  const resultMessage = JSON.stringify({ type: "lead-form-result", success: status < 400, message }).replace(/</g, "\\u003c");
  response.writeHead(status, { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "no-store" });
  response.end(`<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${safeTitle} — Claude AI</title><main data-form-result="${status < 400 ? "success" : "error"}"><h1>${safeTitle}</h1><p>${safeMessage}</p></main><script>window.parent.postMessage(${resultMessage},"*")<\/script></html>`);
}

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[character]);
}

const server = http.createServer(async (request, response) => {
  const requestPath = new URL(request.url, "http://localhost").pathname.replace(/\/+$/, "") || "/";

  if (request.method === "GET" && publicFiles.has(requestPath)) {
    const [fileName, contentType] = publicFiles.get(requestPath);
    response.writeHead(200, { "Content-Type": contentType, "Cache-Control": "no-store, max-age=0" });
    response.end(fs.readFileSync(path.join(__dirname, fileName)));
    return;
  }

  if (request.method === "GET" && requestPath === "/api/health") {
    response.writeHead(200, { "Content-Type": "application/json" });
    response.end(JSON.stringify({ ready: Boolean(botToken && chatId) }));
    return;
  }

  if (request.method !== "POST" || requestPath !== "/api/lead") {
    respondToForm(request, response, 404, "Page not found", `Route not found: ${request.method} ${requestPath}`);
    return;
  }

  if (!botToken || !chatId) {
    respondToForm(request, response, 503, "Setup needed", "Telegram is not configured on the server.");
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

    const contentType = request.headers["content-type"] || "";
    const lead = contentType.includes("application/json")
      ? JSON.parse(rawBody)
      : Object.fromEntries(new URLSearchParams(rawBody));
    const name = cleanField(lead.name, 100);
    const contact = cleanField(lead.contact, 100);
    const goal = cleanField(lead.goal, 1000);
    if (!name || !contact) {
      respondToForm(request, response, 400, "Check the form", "Name and Telegram contact are required.");
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
      const telegramError = telegramResult.description || `Telegram HTTP ${telegramResponse.status}`;
      console.error("Telegram API rejected the message:", telegramError);
      respondToForm(request, response, 502, "Telegram delivery failed", `Telegram error: ${telegramError}`);
      return;
    }

    respondToForm(request, response, 200, "Request sent", "Your course request was delivered to Telegram. We’ll reply to you there.");
  } catch (error) {
    console.error("Unable to process Telegram inquiry:", error.message);
    respondToForm(request, response, 500, "Couldn’t send the request", "Please go back and try again. Check the server terminal for details.");
  }
});

function cleanField(value, maxLength) {
  return typeof value === "string" ? value.replace(/[<>]/g, "").trim().slice(0, maxLength) : "";
}

server.listen(port, () => {
  console.log(`AI course site listening on port ${port}`);
});
