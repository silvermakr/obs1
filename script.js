const form = document.getElementById("grant-form");

form?.addEventListener("submit", (event) => {
  event.preventDefault();
  const data = new FormData(form);
  const name = String(data.get("name") || "").trim();
  const contact = String(data.get("contact") || "").trim();

  if (!name || !contact) {
    form.reportValidity();
    return;
  }

  const ok = form.querySelector(".form__ok");
  form.querySelectorAll("input, textarea, button").forEach((el) => {
    el.disabled = true;
  });
  if (ok) ok.hidden = false;
});
