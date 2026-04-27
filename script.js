const SHEETS_ENDPOINT = "https://script.google.com/macros/s/AKfycbwJzu-C8bQKH2IwmkGtds-BKM-1mD9lDbMMiXNAoy7oumFxCydJbm3RsO5_mF4fmaQ2/exec";

// ── Smooth-scroll for in-page anchors without leaving a #hash in the URL ──
document.querySelectorAll('a[href^="#"]').forEach((link) => {
  link.addEventListener("click", (event) => {
    const href = link.getAttribute("href");
    if (!href || href === "#") return;
    const target = document.querySelector(href);
    if (!target) return;
    event.preventDefault();
    target.scrollIntoView({ behavior: "smooth", block: "start" });
    // Strip the hash from the address bar
    history.replaceState(null, "", window.location.pathname + window.location.search);
  });
});

const form = document.getElementById("interest-form");
const statusNode = document.getElementById("form-status");

function setStatus(message, isError = false) {
  statusNode.textContent = message;
  statusNode.style.color = isError ? "#b42318" : "#4d647d";
}

function isEndpointConfigured(endpoint) {
  return Boolean(endpoint) && !endpoint.includes("REPLACE_WITH_DEPLOYMENT_ID");
}

function serializeFormData(formElement) {
  const formData = new FormData(formElement);
  return {
    ...Object.fromEntries(formData.entries()),
    consent: formData.has("consent") ? "yes" : "no",
  };
}

async function submitToGoogleSheets(payload) {
  const requestBody = new URLSearchParams(payload);

  await fetch(SHEETS_ENDPOINT, {
    method: "POST",
    mode: "no-cors",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded;charset=UTF-8",
    },
    body: requestBody.toString(),
  });
}

form?.addEventListener("submit", async (event) => {
  event.preventDefault();

  if (!form.checkValidity()) {
    form.reportValidity();
    return;
  }

  if (!isEndpointConfigured(SHEETS_ENDPOINT)) {
    setStatus(
      "Google Sheets endpoint is not configured yet. Set your Apps Script URL in docs/script.js.",
      true
    );
    return;
  }

  const submitButton = form.querySelector('button[type="submit"]');
  submitButton.disabled = true;
  setStatus("Sending your request...");

  try {
    const payload = {
      ...serializeFormData(form),
      submitted_at: new Date().toISOString(),
      source: window.location.href,
    };

    await submitToGoogleSheets(payload);
    form.reset();
    setStatus("Thanks - your interest and inquiry were sent. We will follow up shortly.");
  } catch (error) {
    console.error("[Landing Form] Submission error:", error);
    setStatus("Submission failed. Please try again or contact the team directly.", true);
  } finally {
    submitButton.disabled = false;
  }
});
