(() => {
  "use strict";

  const currentSeconds = document.querySelector("#current-seconds");
  const currentMilliseconds = document.querySelector("#current-milliseconds");
  const dateInput = document.querySelector("#date-input");
  const dateError = document.querySelector("#date-error");
  const dateResults = document.querySelector("#date-results");
  const timestampInput = document.querySelector("#timestamp-input");
  const timestampUnit = document.querySelector("#timestamp-unit");
  const timestampError = document.querySelector("#timestamp-error");
  const timestampResults = document.querySelector("#timestamp-results");

  function formatLocalInput(date) {
    const local = new Date(date.getTime() - date.getTimezoneOffset() * 60_000);
    return local.toISOString().slice(0, 16);
  }

  function renderCurrentTime() {
    const now = Date.now();
    currentSeconds.textContent = Math.floor(now / 1000).toString();
    currentMilliseconds.textContent = now.toString();
  }

  function convertDate() {
    const date = new Date(dateInput.value);
    if (Number.isNaN(date.getTime())) {
      dateError.textContent = "Choose a valid local date and time.";
      dateError.hidden = false;
      dateResults.hidden = true;
      return;
    }

    document.querySelector("#date-seconds").textContent = Math.floor(date.getTime() / 1000).toString();
    document.querySelector("#date-milliseconds").textContent = date.getTime().toString();
    document.querySelector("#date-utc").textContent = date.toISOString();
    document.querySelector("#date-local").textContent = date.toLocaleString(undefined, { dateStyle: "full", timeStyle: "long" });
    dateError.hidden = true;
    dateResults.hidden = false;
  }

  function convertTimestamp() {
    const raw = timestampInput.value.trim();
    if (!/^-?\d+$/.test(raw)) {
      timestampError.textContent = "Enter a Unix timestamp as an integer.";
      timestampError.hidden = false;
      timestampResults.hidden = true;
      return;
    }

    let value = Number(raw);
    if (!Number.isSafeInteger(value)) {
      timestampError.textContent = "This timestamp is outside JavaScript's safe integer range.";
      timestampError.hidden = false;
      timestampResults.hidden = true;
      return;
    }

    let unit = timestampUnit.value;
    if (unit === "auto") {
      unit = Math.abs(value) >= 100_000_000_000 ? "milliseconds" : "seconds";
    }

    if (unit === "seconds") value *= 1000;
    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
      timestampError.textContent = "This timestamp cannot be represented as a valid date.";
      timestampError.hidden = false;
      timestampResults.hidden = true;
      return;
    }

    document.querySelector("#timestamp-detected-unit").textContent = unit;
    document.querySelector("#timestamp-utc").textContent = date.toISOString();
    document.querySelector("#timestamp-local").textContent = date.toLocaleString(undefined, { dateStyle: "full", timeStyle: "long" });
    document.querySelector("#timestamp-relative").textContent = relativeTime(date);
    timestampError.hidden = true;
    timestampResults.hidden = false;
  }

  function relativeTime(date) {
    const differenceSeconds = Math.round((date.getTime() - Date.now()) / 1000);
    const absolute = Math.abs(differenceSeconds);
    const formatter = new Intl.RelativeTimeFormat(undefined, { numeric: "auto" });

    if (absolute < 60) return formatter.format(differenceSeconds, "second");
    if (absolute < 3600) return formatter.format(Math.round(differenceSeconds / 60), "minute");
    if (absolute < 86_400) return formatter.format(Math.round(differenceSeconds / 3600), "hour");
    if (absolute < 2_592_000) return formatter.format(Math.round(differenceSeconds / 86_400), "day");
    if (absolute < 31_536_000) return formatter.format(Math.round(differenceSeconds / 2_592_000), "month");
    return formatter.format(Math.round(differenceSeconds / 31_536_000), "year");
  }

  document.querySelector("#use-now-date")?.addEventListener("click", () => {
    dateInput.value = formatLocalInput(new Date());
    convertDate();
  });

  document.querySelector("#use-now-timestamp")?.addEventListener("click", () => {
    timestampInput.value = Math.floor(Date.now() / 1000).toString();
    timestampUnit.value = "seconds";
    convertTimestamp();
  });

  dateInput.addEventListener("input", convertDate);
  timestampInput.addEventListener("input", convertTimestamp);
  timestampUnit.addEventListener("change", convertTimestamp);

  renderCurrentTime();
  window.setInterval(renderCurrentTime, 1000);
  dateInput.value = formatLocalInput(new Date());
  timestampInput.value = Math.floor(Date.now() / 1000).toString();
  convertDate();
  convertTimestamp();
})();
