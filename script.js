const form = document.getElementById("grant-form");

form?.addEventListener("submit", async (event) => {
  event.preventDefault();
  if (!form.reportValidity()) return;

  const button = form.querySelector('button[type="submit"]');
  const success = form.querySelector(".form__ok");
  const error = form.querySelector(".form__error");
  const originalLabel = button.textContent;
  success.hidden = true;
  error.hidden = true;
  button.disabled = true;
  button.textContent = "Sending…";

  try {
    const response = await fetch("/api/lead", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(Object.fromEntries(new FormData(form))),
    });
    if (!response.ok) {
      const result = await response.json().catch(() => ({}));
      throw new Error(result.error || "Request failed");
    }
    form.reset();
    success.hidden = false;
  } catch (cause) {
    error.textContent = cause.message || "We couldn’t send your request. Check your connection and try again.";
    error.hidden = false;
  } finally {
    button.disabled = false;
    button.textContent = originalLabel;
  }
});
