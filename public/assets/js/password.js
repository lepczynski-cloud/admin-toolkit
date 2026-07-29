(() => {
  "use strict";

  const CHARSETS = {
    lowercase: "abcdefghijklmnopqrstuvwxyz",
    uppercase: "ABCDEFGHIJKLMNOPQRSTUVWXYZ",
    numbers: "0123456789",
    symbols: "!@#$%^&*()-_=+[]{};:,.?/"
  };

  const AMBIGUOUS = new Set("O0oIilL1|`'\"\\");
  const PRESETS = {
    readable: { length: 20, lowercase: true, uppercase: true, numbers: true, symbols: false, excludeAmbiguous: true },
    strong: { length: 24, lowercase: true, uppercase: true, numbers: true, symbols: true, excludeAmbiguous: true },
    maximum: { length: 32, lowercase: true, uppercase: true, numbers: true, symbols: true, excludeAmbiguous: false }
  };

  const form = document.querySelector("#password-form");
  const lengthRange = document.querySelector("#password-length");
  const lengthNumber = document.querySelector("#password-length-number");
  const lowercase = document.querySelector("#include-lowercase");
  const uppercase = document.querySelector("#include-uppercase");
  const numbers = document.querySelector("#include-numbers");
  const symbols = document.querySelector("#include-symbols");
  const excludeAmbiguous = document.querySelector("#exclude-ambiguous");
  const output = document.querySelector("#password-output");
  const error = document.querySelector("#password-error");
  const regenerate = document.querySelector("#regenerate-password");
  const strengthLabel = document.querySelector("#password-strength-label");
  const strengthMeter = document.querySelector("#password-strength-meter");
  const strengthDetail = document.querySelector("#password-strength-detail");
  const resultLength = document.querySelector("#password-result-length");
  const poolSize = document.querySelector("#password-pool-size");

  if (!form || !window.crypto?.getRandomValues) {
    if (error) {
      error.hidden = false;
      error.textContent = "This browser does not support secure random password generation.";
    }
    return;
  }

  function secureRandomIndex(maxExclusive) {
    if (!Number.isInteger(maxExclusive) || maxExclusive <= 0) throw new RangeError("Invalid random range");

    const maxUint32 = 0x100000000;
    const limit = maxUint32 - (maxUint32 % maxExclusive);
    const values = new Uint32Array(1);
    let value;

    do {
      window.crypto.getRandomValues(values);
      value = values[0];
    } while (value >= limit);

    return value % maxExclusive;
  }

  function pick(text) {
    return text[secureRandomIndex(text.length)];
  }

  function shuffle(characters) {
    for (let index = characters.length - 1; index > 0; index -= 1) {
      const swapIndex = secureRandomIndex(index + 1);
      [characters[index], characters[swapIndex]] = [characters[swapIndex], characters[index]];
    }
    return characters;
  }

  function filtered(text) {
    if (!excludeAmbiguous.checked) return text;
    return [...text].filter((character) => !AMBIGUOUS.has(character)).join("");
  }

  function selectedSets() {
    const sets = [];
    if (lowercase.checked) sets.push(filtered(CHARSETS.lowercase));
    if (uppercase.checked) sets.push(filtered(CHARSETS.uppercase));
    if (numbers.checked) sets.push(filtered(CHARSETS.numbers));
    if (symbols.checked) sets.push(filtered(CHARSETS.symbols));
    return sets.filter(Boolean);
  }

  function normalizedLength() {
    const value = Number.parseInt(lengthNumber.value, 10);
    return Math.min(64, Math.max(8, Number.isFinite(value) ? value : 24));
  }

  function updateLength(value) {
    const normalized = Math.min(64, Math.max(8, Number.parseInt(value, 10) || 24));
    lengthRange.value = String(normalized);
    lengthNumber.value = String(normalized);
  }

  function estimateStrength(length, pool) {
    const entropy = length * Math.log2(pool);
    let label = "Weak";
    let score = 25;

    if (entropy >= 120) {
      label = "Very strong";
      score = 100;
    } else if (entropy >= 80) {
      label = "Strong";
      score = 82;
    } else if (entropy >= 60) {
      label = "Good";
      score = 62;
    } else if (entropy >= 40) {
      label = "Fair";
      score = 42;
    }

    return { entropy, label, score };
  }

  function showError(message = "") {
    error.textContent = message;
    error.hidden = !message;
  }

  function updatePresetButtons(activePreset = "") {
    document.querySelectorAll("[data-password-preset]").forEach((button) => {
      const isActive = button.dataset.passwordPreset === activePreset;
      button.setAttribute("aria-pressed", String(isActive));
      button.classList.toggle("secondary", isActive);
      button.classList.toggle("ghost", !isActive);
    });
  }

  function generatePassword() {
    const sets = selectedSets();
    const length = normalizedLength();
    updateLength(length);

    if (!sets.length) {
      showError("Select at least one character type.");
      output.textContent = "";
      return;
    }

    if (length < sets.length) {
      showError(`Use at least ${sets.length} characters for the selected character types.`);
      return;
    }

    showError();
    const pool = sets.join("");
    const characters = sets.map((set) => pick(set));

    while (characters.length < length) characters.push(pick(pool));

    const password = shuffle(characters).join("");
    const strength = estimateStrength(length, pool.length);

    output.textContent = password;
    resultLength.textContent = String(length);
    poolSize.textContent = String(pool.length);
    strengthLabel.textContent = strength.label;
    strengthMeter.value = strength.score;
    strengthDetail.textContent = `Approximately ${Math.round(strength.entropy)} bits of entropy for a randomly generated password with the selected pool.`;
  }

  function applyPreset(name) {
    const preset = PRESETS[name];
    if (!preset) return;

    updateLength(preset.length);
    lowercase.checked = preset.lowercase;
    uppercase.checked = preset.uppercase;
    numbers.checked = preset.numbers;
    symbols.checked = preset.symbols;
    excludeAmbiguous.checked = preset.excludeAmbiguous;
    updatePresetButtons(name);
    generatePassword();
  }

  lengthRange.addEventListener("input", () => {
    lengthNumber.value = lengthRange.value;
    updatePresetButtons();
    generatePassword();
  });

  lengthNumber.addEventListener("change", () => {
    updateLength(lengthNumber.value);
    updatePresetButtons();
    generatePassword();
  });

  [lowercase, uppercase, numbers, symbols, excludeAmbiguous].forEach((input) => {
    input.addEventListener("change", () => {
      updatePresetButtons();
      generatePassword();
    });
  });

  document.querySelectorAll("[data-password-preset]").forEach((button) => {
    button.addEventListener("click", () => applyPreset(button.dataset.passwordPreset));
  });

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    generatePassword();
  });

  regenerate.addEventListener("click", generatePassword);
  applyPreset("strong");
})();
