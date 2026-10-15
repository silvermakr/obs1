const form = document.getElementById("grant-form");
const submitButton = form?.querySelector('button[type="submit"]');
const success = form?.querySelector(".form__ok");
const error = form?.querySelector(".form__error");

form?.addEventListener("submit", (event) => {
  event.preventDefault();
  success.hidden = true;
  error.hidden = true;

  if (!form.reportValidity()) return;

  const values = new FormData(form);
  const message = [
    "Claude AI course inquiry",
    `Name: ${values.get("name")}`,
    `Telegram: ${values.get("contact")}`,
    `Learning goal: ${values.get("goal") || "Not provided"}`,
  ].join("\n");
  const telegramUrl = `https://t.me/share/url?text=${encodeURIComponent(message)}`;
  const telegramWindow = window.open(telegramUrl, "_blank");

  if (!telegramWindow) {
    window.location.assign(telegramUrl);
    return;
  }
  telegramWindow.opener = null;

  submitButton.textContent = "Continue to Telegram";
  success.hidden = false;
});
