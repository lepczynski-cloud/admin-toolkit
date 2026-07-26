(() => {
  "use strict";

  const pattern = document.querySelector("#cron-pattern");
  const expressionOutput = document.querySelector("#cron-expression");
  const descriptionOutput = document.querySelector("#cron-description");
  const errorBox = document.querySelector("#cron-error");
  const noteBox = document.querySelector("#cron-note");

  const controls = {
    interval: document.querySelector("#cron-interval"),
    minute: document.querySelector("#cron-minute"),
    time: document.querySelector("#cron-time"),
    weekday: document.querySelector("#cron-weekday"),
    monthday: document.querySelector("#cron-monthday"),
    custom: document.querySelector("#cron-custom")
  };

  const groups = [...document.querySelectorAll("[data-cron-group]")];
  const weekdays = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

  function pad(value) {
    return String(value).padStart(2, "0");
  }

  function parseTime() {
    const match = controls.time.value.match(/^(\d{2}):(\d{2})$/);
    if (!match) throw new Error("Choose a valid time.");
    return { hour: Number(match[1]), minute: Number(match[2]) };
  }

  function validateCustom(expression) {
    const fields = expression.trim().split(/\s+/);
    if (fields.length !== 5) {
      throw new Error("A standard Unix cron expression must contain five fields.");
    }
    if (fields.some((field) => !/^[\d*/,\-]+$/.test(field))) {
      throw new Error("The custom expression contains unsupported characters.");
    }
    return fields.join(" ");
  }

  function generate() {
    const selectedPattern = pattern.value;

    switch (selectedPattern) {
      case "minutes": {
        const interval = Number(controls.interval.value);
        if (!Number.isInteger(interval) || interval < 1 || interval > 59) {
          throw new Error("Minute interval must be between 1 and 59.");
        }
        return {
          expression: `*/${interval} * * * *`,
          description: `Run every ${interval} minute${interval === 1 ? "" : "s"}.`,
          note: "For intervals that do not divide 60 evenly, execution restarts at the beginning of each hour."
        };
      }
      case "hourly": {
        const minute = Number(controls.minute.value);
        if (!Number.isInteger(minute) || minute < 0 || minute > 59) {
          throw new Error("Minute must be between 0 and 59.");
        }
        return {
          expression: `${minute} * * * *`,
          description: `Run every hour at minute ${pad(minute)}.`,
          note: "The command runs according to the cron daemon's configured timezone."
        };
      }
      case "daily": {
        const { hour, minute } = parseTime();
        return {
          expression: `${minute} ${hour} * * *`,
          description: `Run every day at ${pad(hour)}:${pad(minute)}.`,
          note: "The command runs according to the cron daemon's configured timezone."
        };
      }
      case "weekdays": {
        const { hour, minute } = parseTime();
        return {
          expression: `${minute} ${hour} * * 1-5`,
          description: `Run Monday through Friday at ${pad(hour)}:${pad(minute)}.`,
          note: "Public holidays are not excluded automatically."
        };
      }
      case "weekly": {
        const { hour, minute } = parseTime();
        const day = Number(controls.weekday.value);
        return {
          expression: `${minute} ${hour} * * ${day}`,
          description: `Run every ${weekdays[day]} at ${pad(hour)}:${pad(minute)}.`,
          note: "In standard cron, both 0 and 7 can represent Sunday; this generator uses 0."
        };
      }
      case "monthly": {
        const { hour, minute } = parseTime();
        const day = Number(controls.monthday.value);
        if (!Number.isInteger(day) || day < 1 || day > 31) {
          throw new Error("Day of month must be between 1 and 31.");
        }
        return {
          expression: `${minute} ${hour} ${day} * *`,
          description: `Run on day ${day} of every month at ${pad(hour)}:${pad(minute)}.`,
          note: day > 28 ? `Months without day ${day} will not run this job.` : "The command runs according to the cron daemon's configured timezone."
        };
      }
      case "custom": {
        const expression = validateCustom(controls.custom.value);
        return {
          expression,
          description: "Custom standard five-field Unix cron expression.",
          note: "Verify custom expressions in the target system. Quartz, AWS EventBridge and some schedulers use different syntax."
        };
      }
      default:
        throw new Error("Choose a schedule type.");
    }
  }

  function updateVisibleGroups() {
    const selectedPattern = pattern.value;
    groups.forEach((group) => {
      const visibleFor = group.dataset.cronGroup.split(" ");
      group.hidden = !visibleFor.includes(selectedPattern);
    });
  }

  function render() {
    updateVisibleGroups();
    try {
      const result = generate();
      expressionOutput.textContent = result.expression;
      descriptionOutput.textContent = result.description;
      noteBox.textContent = result.note;
      errorBox.hidden = true;
    } catch (error) {
      errorBox.textContent = error instanceof Error ? error.message : "Unable to generate this expression.";
      errorBox.hidden = false;
    }
  }

  pattern.addEventListener("change", render);
  Object.values(controls).forEach((control) => {
    control.addEventListener("input", render);
    control.addEventListener("change", render);
  });

  document.querySelectorAll("[data-cron-preset]").forEach((button) => {
    button.addEventListener("click", () => {
      const preset = button.dataset.cronPreset;
      const presetTime = button.dataset.cronTime;
      pattern.value = preset;
      if (presetTime) controls.time.value = presetTime;
      render();
    });
  });

  render();
})();
