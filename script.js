const form = document.getElementById("grant-form");
const responseFrame = document.getElementById("lead-response");
const submitButton = form?.querySelector('button[type="submit"]');
const success = form?.querySelector(".form__ok");
const error = form?.querySelector(".form__error");
let requestPending = false;
let requestTimeout;

form?.addEventListener("submit", () => {
  success.hidden = true;
  error.hidden = true;
  submitButton.disabled = true;
  submitButton.textContent = "Sending…";
  requestPending = true;
  clearTimeout(requestTimeout);
  requestTimeout = setTimeout(() => {
    if (!requestPending) return;
    requestPending = false;
    showResult(false, "Could not reach the course server. Please refresh the page and try again.");
  }, 15000);
});

window.addEventListener("message", (event) => {
  if (!requestPending || event.source !== responseFrame.contentWindow || event.data?.type !== "lead-form-result") return;

  requestPending = false;
  clearTimeout(requestTimeout);
  showResult(event.data.success, event.data.message);
});

function showResult(sent, message) {
  submitButton.disabled = false;
  submitButton.textContent = "Send request via Telegram";
  if (sent) {
    form.reset();
    success.textContent = message || "Thanks! Your request was sent. We’ll reply to you on Telegram.";
    success.hidden = false;
    return;
  }

  error.textContent = message || "We couldn’t send your request. Please try again.";
  error.hidden = false;
}
