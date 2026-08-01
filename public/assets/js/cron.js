(() => {
  "use strict";

  const pattern = document.querySelector("#cron-pattern");
  const expressionInput = document.querySelector("#cron-expression-input");
  const descriptionOutput = document.querySelector("#cron-description");
  const errorBox = document.querySelector("#cron-error");
  const noteBox = document.querySelector("#cron-note");
  const nextRunsOutput = document.querySelector("#cron-next-runs");
  const timezoneOutput = document.querySelector("#cron-timezone");
  const controls = {
    interval: document.querySelector("#cron-interval"),
    minute: document.querySelector("#cron-minute"),
    time: document.querySelector("#cron-time"),
    weekday: document.querySelector("#cron-weekday"),
    monthday: document.querySelector("#cron-monthday")
  };
  const groups = [...document.querySelectorAll("[data-cron-group]")];

  const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
  const weekdayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  const aliases = {
    month: Object.fromEntries(monthNames.map((name, index) => [name.slice(0, 3).toUpperCase(), index + 1])),
    dow: Object.fromEntries(weekdayNames.map((name, index) => [name.slice(0, 3).toUpperCase(), index]))
  };
  const specs = [
    { key: "minute", min: 0, max: 59 },
    { key: "hour", min: 0, max: 23 },
    { key: "dom", min: 1, max: 31 },
    { key: "month", min: 1, max: 12, aliases: aliases.month },
    { key: "dow", min: 0, max: 7, aliases: aliases.dow, normalize: (value) => value === 7 ? 0 : value }
  ];

  function pad(value) {
    return String(value).padStart(2, "0");
  }

  function parseTime() {
    const match = controls.time.value.match(/^(\d{2}):(\d{2})$/);
    if (!match) throw new Error("Choose a valid time.");
    const hour = Number(match[1]);
    const minute = Number(match[2]);
    if (hour > 23 || minute > 59) throw new Error("Choose a valid time.");
    return { hour, minute };
  }

  function parseValue(token, spec) {
    const upper = token.trim().toUpperCase();
    const aliasValue = spec.aliases?.[upper];
    const value = aliasValue ?? Number(upper);
    if (!Number.isInteger(value) || value < spec.min || value > spec.max) {
      throw new Error(`Invalid ${spec.key} value: ${token}.`);
    }
    return value;
  }

  function parseField(raw, spec) {
    if (!raw || !/^[A-Za-z0-9*/,\-]+$/.test(raw)) {
      throw new Error(`The ${spec.key} field contains unsupported characters.`);
    }

    const values = new Set();
    const segments = raw.split(",");
    for (const segment of segments) {
      if (!segment) throw new Error(`The ${spec.key} field contains an empty list item.`);
      const stepParts = segment.split("/");
      if (stepParts.length > 2) throw new Error(`The ${spec.key} field contains an invalid step.`);
      const base = stepParts[0];
      const step = stepParts.length === 2 ? Number(stepParts[1]) : 1;
      if (!Number.isInteger(step) || step < 1) throw new Error(`The ${spec.key} step must be a positive integer.`);

      let start;
      let end;
      if (base === "*") {
        start = spec.min;
        end = spec.max;
      } else if (base.includes("-")) {
        const range = base.split("-");
        if (range.length !== 2 || !range[0] || !range[1]) throw new Error(`The ${spec.key} field contains an invalid range.`);
        start = parseValue(range[0], spec);
        end = parseValue(range[1], spec);
        if (start > end) throw new Error(`The ${spec.key} range must run from a lower value to a higher value.`);
      } else {
        start = parseValue(base, spec);
        end = stepParts.length === 2 ? spec.max : start;
      }

      for (let value = start; value <= end; value += step) {
        values.add(spec.normalize ? spec.normalize(value) : value);
      }
    }

    const sorted = [...values].sort((a, b) => a - b);
    if (!sorted.length) throw new Error(`The ${spec.key} field does not select any values.`);
    return { raw, values, sorted, wildcard: raw === "*" };
  }

  function parseExpression(expression) {
    const fields = expression.trim().split(/\s+/);
    if (fields.length !== 5) throw new Error("A standard Unix cron expression must contain exactly five fields.");
    const parsed = specs.map((spec, index) => parseField(fields[index], spec));
    return {
      expression: fields.join(" "),
      minute: parsed[0],
      hour: parsed[1],
      dom: parsed[2],
      month: parsed[3],
      dow: parsed[4]
    };
  }

  function compactList(values, names) {
    if (values.length === 1) return names ? names[values[0]] : String(values[0]);
    const rendered = values.map((value) => names ? names[value] : String(value));
    return `${rendered.slice(0, -1).join(", ")} and ${rendered.at(-1)}`;
  }

  function describeField(field, unit, names) {
    if (field.raw === "*") return `every ${unit}`;
    const stepMatch = field.raw.match(/^\*\/(\d+)$/);
    if (stepMatch) return `every ${stepMatch[1]} ${unit}${stepMatch[1] === "1" ? "" : "s"}`;
    return compactList(field.sorted, names);
  }

  function describeCron(cron) {
    const { minute, hour, dom, month, dow } = cron;
    let sentence;

    if (hour.wildcard && minute.wildcard) {
      sentence = "Run every minute";
    } else if (hour.wildcard && /^\*\/\d+$/.test(minute.raw)) {
      sentence = `Run ${describeField(minute, "minute")}`;
    } else if (hour.wildcard && minute.sorted.length === 1) {
      sentence = `Run every hour at minute ${pad(minute.sorted[0])}`;
    } else if (hour.sorted.length === 1 && minute.sorted.length === 1) {
      sentence = `Run at ${pad(hour.sorted[0])}:${pad(minute.sorted[0])}`;
    } else if (minute.sorted.length === 1) {
      const times = hour.sorted.map((value) => `${pad(value)}:${pad(minute.sorted[0])}`);
      sentence = `Run at ${times.join(", ")}`;
    } else {
      sentence = `Run at minute ${describeField(minute, "minute")} during hour ${describeField(hour, "hour")}`;
    }

    const conditions = [];
    if (!dom.wildcard && !dow.wildcard) {
      conditions.push(`when either day ${describeField(dom, "day")} of the month or ${describeField(dow, "weekday", weekdayNames)} matches`);
    } else if (!dom.wildcard) {
      conditions.push(`on day ${describeField(dom, "day")} of the month`);
    } else if (!dow.wildcard) {
      conditions.push(`on ${describeField(dow, "weekday", weekdayNames)}`);
    }
    if (!month.wildcard) {
      conditions.push(`in ${describeField(month, "month", [null, ...monthNames])}`);
    }

    return `${sentence}${conditions.length ? ` ${conditions.join(" ")}` : " every day"}.`;
  }

  function dayMatches(date, cron) {
    const domMatch = cron.dom.values.has(date.getDate());
    const dowMatch = cron.dow.values.has(date.getDay());
    if (cron.dom.wildcard && cron.dow.wildcard) return true;
    if (cron.dom.wildcard) return dowMatch;
    if (cron.dow.wildcard) return domMatch;
    return domMatch || dowMatch;
  }

  function firstAtOrAfter(values, current) {
    return values.find((value) => value >= current) ?? null;
  }

  function firstAfter(values, current) {
    return values.find((value) => value > current) ?? null;
  }

  function nextRuns(cron, startDate, count) {
    const results = [];
    const candidate = new Date(startDate);
    candidate.setSeconds(0, 0);
    candidate.setMinutes(candidate.getMinutes() + 1);
    let guard = 0;

    while (results.length < count && guard < 500000) {
      guard += 1;

      const currentMonth = candidate.getMonth() + 1;
      if (!cron.month.values.has(currentMonth)) {
        const nextMonth = firstAfter(cron.month.sorted, currentMonth);
        if (nextMonth === null) {
          candidate.setFullYear(candidate.getFullYear() + 1, cron.month.sorted[0] - 1, 1);
        } else {
          candidate.setMonth(nextMonth - 1, 1);
        }
        candidate.setHours(0, 0, 0, 0);
        continue;
      }

      if (!dayMatches(candidate, cron)) {
        candidate.setDate(candidate.getDate() + 1);
        candidate.setHours(0, 0, 0, 0);
        continue;
      }

      if (!cron.hour.values.has(candidate.getHours())) {
        const nextHour = firstAtOrAfter(cron.hour.sorted, candidate.getHours());
        if (nextHour === null) {
          candidate.setDate(candidate.getDate() + 1);
          candidate.setHours(cron.hour.sorted[0], cron.minute.sorted[0], 0, 0);
        } else {
          candidate.setHours(nextHour, cron.minute.sorted[0], 0, 0);
        }
        continue;
      }

      if (!cron.minute.values.has(candidate.getMinutes())) {
        const nextMinute = firstAtOrAfter(cron.minute.sorted, candidate.getMinutes());
        if (nextMinute !== null) {
          candidate.setMinutes(nextMinute, 0, 0);
        } else {
          const nextHour = firstAfter(cron.hour.sorted, candidate.getHours());
          if (nextHour === null) {
            candidate.setDate(candidate.getDate() + 1);
            candidate.setHours(cron.hour.sorted[0], cron.minute.sorted[0], 0, 0);
          } else {
            candidate.setHours(nextHour, cron.minute.sorted[0], 0, 0);
          }
        }
        continue;
      }

      if (cron.month.values.has(candidate.getMonth() + 1) && dayMatches(candidate, cron)) {
        results.push(new Date(candidate));
      }
      candidate.setMinutes(candidate.getMinutes() + 1);
    }

    if (results.length < count) throw new Error("The next executions could not be found within the supported search range.");
    return results;
  }

  function generateExpression() {
    switch (pattern.value) {
      case "minutes": {
        const interval = Number(controls.interval.value);
        if (!Number.isInteger(interval) || interval < 1 || interval > 59) throw new Error("Minute interval must be between 1 and 59.");
        return `*/${interval} * * * *`;
      }
      case "hourly": {
        const minute = Number(controls.minute.value);
        if (!Number.isInteger(minute) || minute < 0 || minute > 59) throw new Error("Minute must be between 0 and 59.");
        return `${minute} * * * *`;
      }
      case "daily": {
        const { hour, minute } = parseTime();
        return `${minute} ${hour} * * *`;
      }
      case "weekdays": {
        const { hour, minute } = parseTime();
        return `${minute} ${hour} * * 1-5`;
      }
      case "weekly": {
        const { hour, minute } = parseTime();
        const day = Number(controls.weekday.value);
        return `${minute} ${hour} * * ${day}`;
      }
      case "monthly": {
        const { hour, minute } = parseTime();
        const day = Number(controls.monthday.value);
        if (!Number.isInteger(day) || day < 1 || day > 31) throw new Error("Day of month must be between 1 and 31.");
        return `${minute} ${hour} ${day} * *`;
      }
      case "custom":
        return expressionInput.value;
      default:
        throw new Error("Choose a schedule type.");
    }
  }

  function updateVisibleGroups() {
    const selected = pattern.value;
    groups.forEach((group) => {
      group.hidden = !group.dataset.cronGroup.split(" ").includes(selected);
    });
  }

  function renderNextRuns(cron) {
    const localFormatter = new Intl.DateTimeFormat(undefined, { dateStyle: "medium", timeStyle: "short" });
    const utcFormatter = new Intl.DateTimeFormat("en-GB", {
      timeZone: "UTC",
      year: "numeric",
      month: "short",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      hourCycle: "h23"
    });
    const runs = nextRuns(cron, new Date(), 5);
    nextRunsOutput.replaceChildren(...runs.map((date, index) => {
      const item = document.createElement("li");
      item.className = "next-run";
      const number = document.createElement("span");
      number.className = "next-run-index";
      number.textContent = String(index + 1);
      const copy = document.createElement("span");
      const local = document.createElement("strong");
      local.textContent = localFormatter.format(date);
      const utc = document.createElement("small");
      utc.textContent = `${utcFormatter.format(date)} UTC`;
      copy.append(local, utc);
      item.append(number, copy);
      return item;
    }));
  }

  function parseAndRender(expression) {
    try {
      const cron = parseExpression(expression);
      expressionInput.value = cron.expression;
      descriptionOutput.textContent = describeCron(cron);
      const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone || "browser local time";
      timezoneOutput.textContent = timezone;
      noteBox.textContent = `The next five executions are calculated in ${timezone}. Standard Unix cron uses OR semantics when both day-of-month and day-of-week are restricted.`;
      renderNextRuns(cron);
      errorBox.hidden = true;
    } catch (error) {
      errorBox.textContent = error instanceof Error ? error.message : "Unable to parse this cron expression.";
      errorBox.hidden = false;
      nextRunsOutput.replaceChildren();
      descriptionOutput.textContent = "Enter a valid five-field Unix cron expression.";
    }
  }

  function renderGenerated() {
    updateVisibleGroups();
    try {
      const expression = generateExpression();
      if (pattern.value !== "custom") expressionInput.value = expression;
      parseAndRender(expression);
    } catch (error) {
      errorBox.textContent = error instanceof Error ? error.message : "Unable to generate this expression.";
      errorBox.hidden = false;
    }
  }

  pattern.addEventListener("change", renderGenerated);
  Object.values(controls).forEach((control) => {
    control.addEventListener("input", renderGenerated);
    control.addEventListener("change", renderGenerated);
  });

  expressionInput.addEventListener("input", () => {
    pattern.value = "custom";
    updateVisibleGroups();
    parseAndRender(expressionInput.value);
  });

  document.querySelector("#parse-cron").addEventListener("click", () => parseAndRender(expressionInput.value));

  document.querySelectorAll("[data-cron-expression]").forEach((button) => {
    button.addEventListener("click", () => {
      pattern.value = "custom";
      expressionInput.value = button.dataset.cronExpression;
      updateVisibleGroups();
      parseAndRender(expressionInput.value);
    });
  });

  updateVisibleGroups();
  renderGenerated();
})();
