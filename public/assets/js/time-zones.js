(() => {
  "use strict";

  const DEFAULT_ZONES = [
    { id: "Europe/Warsaw", label: "Central Europe", shortLabel: "CEST / CET", fixed: true },
    { id: "Asia/Hong_Kong", label: "Hong Kong", shortLabel: "HKT", fixed: true },
    { id: "UTC", label: "Zulu time", shortLabel: "UTC / Zulu", fixed: true }
  ];

  const AVAILABLE_ZONES = [
    ["America/Los_Angeles", "Los Angeles"],
    ["America/Denver", "Denver"],
    ["America/Chicago", "Chicago"],
    ["America/New_York", "New York"],
    ["America/Toronto", "Toronto"],
    ["America/Sao_Paulo", "São Paulo"],
    ["Europe/London", "London"],
    ["Europe/Paris", "Paris"],
    ["Europe/Berlin", "Berlin"],
    ["Europe/Helsinki", "Helsinki"],
    ["Europe/Istanbul", "Istanbul"],
    ["Africa/Johannesburg", "Johannesburg"],
    ["Asia/Dubai", "Dubai"],
    ["Asia/Kolkata", "India"],
    ["Asia/Singapore", "Singapore"],
    ["Asia/Shanghai", "Shanghai"],
    ["Asia/Tokyo", "Tokyo"],
    ["Asia/Seoul", "Seoul"],
    ["Australia/Perth", "Perth"],
    ["Australia/Sydney", "Sydney"],
    ["Pacific/Auckland", "Auckland"]
  ].map(([id, label]) => ({ id, label, shortLabel: id, fixed: false }));

  const grid = document.querySelector("#clock-grid");
  const addSelect = document.querySelector("#timezone-select");
  const addButton = document.querySelector("#add-clock");
  const nowButton = document.querySelector("#use-now");
  const liveStatus = document.querySelector("#live-status");
  const errorBox = document.querySelector("#timezone-error");
  const STORAGE_KEY = "admin-toolkit-extra-time-zones";
  const cards = new Map();
  let referenceInstant = Date.now();
  let live = true;
  let extraZones = loadExtras();

  function loadExtras() {
    try {
      const parsed = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
      if (!Array.isArray(parsed)) return [];
      return parsed.filter((id) => AVAILABLE_ZONES.some((zone) => zone.id === id));
    } catch {
      return [];
    }
  }

  function saveExtras() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(extraZones));
    } catch {
      // The tool still works when storage is disabled.
    }
  }

  function partsForInstant(timestamp, zone) {
    const formatter = new Intl.DateTimeFormat("en-CA", {
      timeZone: zone,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hourCycle: "h23"
    });
    const parts = Object.fromEntries(formatter.formatToParts(new Date(timestamp)).filter((part) => part.type !== "literal").map((part) => [part.type, part.value]));
    return {
      year: Number(parts.year),
      month: Number(parts.month),
      day: Number(parts.day),
      hour: Number(parts.hour),
      minute: Number(parts.minute),
      second: Number(parts.second)
    };
  }

  function partsAsUtc(parts) {
    return Date.UTC(parts.year, parts.month - 1, parts.day, parts.hour, parts.minute, parts.second || 0);
  }

  function instantFromZonedParts(parts, zone) {
    const desired = partsAsUtc(parts);
    let guess = desired;
    for (let iteration = 0; iteration < 4; iteration += 1) {
      const observed = partsForInstant(guess, zone);
      const difference = desired - partsAsUtc(observed);
      if (difference === 0) break;
      guess += difference;
    }
    const verified = partsForInstant(guess, zone);
    if (["year", "month", "day", "hour", "minute", "second"].some((key) => verified[key] !== (parts[key] || 0))) {
      throw new Error("That local time does not exist in this zone, usually because of a daylight-saving time change.");
    }
    return guess;
  }

  function inputValue(timestamp, zone) {
    const parts = partsForInstant(timestamp, zone);
    return `${parts.year}-${String(parts.month).padStart(2, "0")}-${String(parts.day).padStart(2, "0")}T${String(parts.hour).padStart(2, "0")}:${String(parts.minute).padStart(2, "0")}:${String(parts.second).padStart(2, "0")}`;
  }

  function parseInput(value) {
    const match = value.match(/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})(?::(\d{2}))?$/);
    if (!match) throw new Error("Enter a complete date and time.");
    return {
      year: Number(match[1]),
      month: Number(match[2]),
      day: Number(match[3]),
      hour: Number(match[4]),
      minute: Number(match[5]),
      second: Number(match[6] || 0)
    };
  }

  function offsetMinutes(timestamp, zone) {
    const parts = partsForInstant(timestamp, zone);
    return Math.round((partsAsUtc(parts) - Math.floor(timestamp / 1000) * 1000) / 60000);
  }

  function formatOffset(minutes) {
    if (minutes === 0) return "UTC±00:00";
    const sign = minutes > 0 ? "+" : "−";
    const absolute = Math.abs(minutes);
    return `UTC${sign}${String(Math.floor(absolute / 60)).padStart(2, "0")}:${String(absolute % 60).padStart(2, "0")}`;
  }

  function abbreviation(zone, timestamp) {
    if (zone.id === "UTC") return "Z";
    if (zone.id === "Asia/Hong_Kong") return "HKT";
    if (zone.id === "Europe/Warsaw") return offsetMinutes(timestamp, zone.id) === 120 ? "CEST" : "CET";
    try {
      return new Intl.DateTimeFormat("en-US", { timeZone: zone.id, timeZoneName: "short" })
        .formatToParts(new Date(timestamp))
        .find((part) => part.type === "timeZoneName")?.value || "TZ";
    } catch {
      return "TZ";
    }
  }

  function allZones() {
    const additions = extraZones.map((id) => AVAILABLE_ZONES.find((zone) => zone.id === id)).filter(Boolean);
    return [...DEFAULT_ZONES, ...additions];
  }

  function createCard(zone) {
    const card = document.createElement("article");
    card.className = `clock-card${zone.fixed ? "" : " is-custom"}`;
    card.dataset.zone = zone.id;

    const header = document.createElement("div");
    header.className = "clock-card-header";
    const heading = document.createElement("div");
    const title = document.createElement("h3");
    title.textContent = zone.label;
    const zoneId = document.createElement("div");
    zoneId.className = "clock-zone";
    zoneId.textContent = zone.id;
    heading.append(title, zoneId);

    const badge = document.createElement("span");
    badge.className = "clock-abbreviation";
    header.append(heading, badge);

    const label = document.createElement("label");
    const inputId = `clock-${zone.id.replaceAll("/", "-").toLowerCase()}`;
    label.htmlFor = inputId;
    label.textContent = "Date and time";
    const input = document.createElement("input");
    input.id = inputId;
    input.type = "datetime-local";
    input.step = "1";
    input.addEventListener("change", () => {
      try {
        referenceInstant = instantFromZonedParts(parseInput(input.value), zone.id);
        live = false;
        errorBox.hidden = true;
        renderAll();
      } catch (error) {
        errorBox.textContent = error instanceof Error ? error.message : "Unable to convert this time.";
        errorBox.hidden = false;
      }
    });

    const details = document.createElement("div");
    details.className = "clock-details";
    const offset = document.createElement("span");
    const weekday = document.createElement("span");
    details.append(offset, weekday);

    card.append(header, label, input, details);

    if (!zone.fixed) {
      const remove = document.createElement("button");
      remove.type = "button";
      remove.className = "button danger small";
      remove.textContent = "Remove clock";
      remove.style.marginTop = "0.8rem";
      remove.addEventListener("click", () => {
        extraZones = extraZones.filter((id) => id !== zone.id);
        saveExtras();
        cards.get(zone.id)?.card.remove();
        cards.delete(zone.id);
        populateSelect();
      });
      card.append(remove);
    }

    grid.append(card);
    const elements = { card, input, badge, offset, weekday };
    cards.set(zone.id, elements);
    return elements;
  }

  function renderCard(zone) {
    const elements = cards.get(zone.id) || createCard(zone);
    if (document.activeElement !== elements.input) elements.input.value = inputValue(referenceInstant, zone.id);
    elements.badge.textContent = abbreviation(zone, referenceInstant);
    elements.offset.textContent = formatOffset(offsetMinutes(referenceInstant, zone.id));
    elements.weekday.textContent = new Intl.DateTimeFormat("en-US", {
      timeZone: zone.id,
      weekday: "long",
      month: "long",
      day: "numeric",
      year: "numeric"
    }).format(new Date(referenceInstant));
  }

  function renderAll() {
    allZones().forEach(renderCard);
    liveStatus.textContent = live ? "Live time" : "Reference time paused";
    liveStatus.classList.toggle("is-paused", !live);
  }

  function populateSelect() {
    const used = new Set(allZones().map((zone) => zone.id));
    const available = AVAILABLE_ZONES.filter((zone) => !used.has(zone.id));
    addSelect.replaceChildren(...available.map((zone) => {
      const option = document.createElement("option");
      option.value = zone.id;
      option.textContent = `${zone.label} — ${zone.id}`;
      return option;
    }));
    addSelect.disabled = available.length === 0;
    addButton.disabled = available.length === 0;
  }

  addButton.addEventListener("click", () => {
    if (!addSelect.value || extraZones.includes(addSelect.value)) return;
    extraZones.push(addSelect.value);
    saveExtras();
    const zone = AVAILABLE_ZONES.find((item) => item.id === addSelect.value);
    if (zone) renderCard(zone);
    populateSelect();
  });

  nowButton.addEventListener("click", () => {
    referenceInstant = Date.now();
    live = true;
    errorBox.hidden = true;
    renderAll();
  });

  populateSelect();
  renderAll();
  window.setInterval(() => {
    if (!live) return;
    referenceInstant = Date.now();
    renderAll();
  }, 1000);
})();
