(() => {
  "use strict";

  const dateInput = document.querySelector("#date-input");
  const timestampInput = document.querySelector("#timestamp-input");
  const errorBox = document.querySelector("#timestamp-error");
  const outputs = {
    seconds: document.querySelector("#timestamp-seconds"),
    milliseconds: document.querySelector("#timestamp-milliseconds"),
    iso: document.querySelector("#timestamp-iso"),
    utc: document.querySelector("#timestamp-utc"),
    local: document.querySelector("#timestamp-local"),
    timezone: document.querySelector("#timestamp-timezone")
  };

  function localInputValue(date) {
    const offset = date.getTimezoneOffset() * 60000;
    return new Date(date.getTime() - offset).toISOString().slice(0, 16);
  }

  function parseTimestamp(value) {
    const raw = value.trim();
    if (!/^-?\d+$/.test(raw)) throw new Error("Enter a Unix timestamp containing only digits.");
    const numeric = Number(raw);
    if (!Number.isFinite(numeric)) throw new Error("The timestamp is outside the supported range.");
    const milliseconds = Math.abs(numeric) < 100000000000 ? numeric * 1000 : numeric;
    const date = new Date(milliseconds);
    if (Number.isNaN(date.getTime())) throw new Error("The timestamp could not be converted to a date.");
    return date;
  }

  function render(date, updateInputs = false) {
    const milliseconds = date.getTime();
    outputs.seconds.textContent = String(Math.floor(milliseconds / 1000));
    outputs.milliseconds.textContent = String(milliseconds);
    outputs.iso.textContent = date.toISOString();
    outputs.utc.textContent = date.toUTCString();
    outputs.local.textContent = new Intl.DateTimeFormat(undefined, {
      dateStyle: "full",
      timeStyle: "long"
    }).format(date);
    outputs.timezone.textContent = Intl.DateTimeFormat().resolvedOptions().timeZone || "Browser local time";
    if (updateInputs) {
      dateInput.value = localInputValue(date);
      timestampInput.value = String(Math.floor(milliseconds / 1000));
    }
    errorBox.hidden = true;
  }

  function renderDateInput() {
    try {
      if (!dateInput.value) throw new Error("Choose a date and time.");
      const date = new Date(dateInput.value);
      if (Number.isNaN(date.getTime())) throw new Error("Choose a valid date and time.");
      timestampInput.value = String(Math.floor(date.getTime() / 1000));
      render(date);
    } catch (error) {
      errorBox.textContent = error instanceof Error ? error.message : "Unable to convert this date.";
      errorBox.hidden = false;
    }
  }

  function renderTimestampInput() {
    try {
      const date = parseTimestamp(timestampInput.value);
      dateInput.value = localInputValue(date);
      render(date);
    } catch (error) {
      errorBox.textContent = error instanceof Error ? error.message : "Unable to convert this timestamp.";
      errorBox.hidden = false;
    }
  }

  dateInput.addEventListener("input", renderDateInput);
  timestampInput.addEventListener("input", renderTimestampInput);
  document.querySelector("#use-current-time").addEventListener("click", () => render(new Date(), true));

  const nowElement = document.querySelector("#live-unix-time");
  function updateLiveTime() {
    nowElement.textContent = String(Math.floor(Date.now() / 1000));
  }
  updateLiveTime();
  window.setInterval(updateLiveTime, 1000);
  render(new Date(), true);
})();
