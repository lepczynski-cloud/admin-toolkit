(() => {
  "use strict";

  const modeInput = document.querySelector("#chmod-mode");
  const symbolicOutput = document.querySelector("#chmod-symbolic");
  const numericOutput = document.querySelector("#chmod-numeric");
  const commandOutput = document.querySelector("#chmod-command");
  const errorBox = document.querySelector("#chmod-error");
  const checkboxes = [...document.querySelectorAll("[data-permission]")];

  const groups = ["owner", "group", "other"];
  const permissions = [
    { key: "read", symbol: "r", value: 4 },
    { key: "write", symbol: "w", value: 2 },
    { key: "execute", symbol: "x", value: 1 }
  ];

  function normalizeMode(value) {
    const mode = value.trim();
    if (!/^\d{3}$/.test(mode) || [...mode].some((digit) => Number(digit) > 7)) {
      throw new Error("Enter a three-digit mode from 000 to 777.");
    }
    return mode;
  }

  function modeFromCheckboxes() {
    return groups
      .map((group) => permissions.reduce((sum, permission) => {
        const checkbox = document.querySelector(`[data-permission="${group}-${permission.key}"]`);
        return sum + (checkbox.checked ? permission.value : 0);
      }, 0))
      .join("");
  }

  function symbolicFromMode(mode) {
    return [...mode]
      .map((digit) => {
        const value = Number(digit);
        return permissions
          .map((permission) => (value & permission.value ? permission.symbol : "-"))
          .join("");
      })
      .join("");
  }

  function setCheckboxesFromMode(mode) {
    groups.forEach((group, groupIndex) => {
      const value = Number(mode[groupIndex]);
      permissions.forEach((permission) => {
        const checkbox = document.querySelector(`[data-permission="${group}-${permission.key}"]`);
        checkbox.checked = Boolean(value & permission.value);
      });
    });
  }

  function render(mode, updateInput = true) {
    const normalized = normalizeMode(mode);
    if (updateInput) modeInput.value = normalized;
    numericOutput.textContent = normalized;
    symbolicOutput.textContent = symbolicFromMode(normalized);
    commandOutput.textContent = `chmod ${normalized} filename`;
    errorBox.hidden = true;
  }

  checkboxes.forEach((checkbox) => {
    checkbox.addEventListener("change", () => {
      render(modeFromCheckboxes());
    });
  });

  modeInput.addEventListener("input", () => {
    const raw = modeInput.value.trim();
    if (!/^\d{3}$/.test(raw) || [...raw].some((digit) => Number(digit) > 7)) {
      errorBox.textContent = "Enter exactly three digits, each between 0 and 7.";
      errorBox.hidden = false;
      return;
    }

    setCheckboxesFromMode(raw);
    render(raw, false);
  });

  document.querySelectorAll("[data-chmod-preset]").forEach((button) => {
    button.addEventListener("click", () => {
      const mode = button.dataset.chmodPreset;
      setCheckboxesFromMode(mode);
      render(mode);
    });
  });

  setCheckboxesFromMode("755");
  render("755");
})();
