(() => {
  "use strict";

  const lengthInput = document.querySelector("#password-length");
  const lengthOutput = document.querySelector("#password-length-value");
  const passwordOutput = document.querySelector("#password-output");
  const errorBox = document.querySelector("#password-error");
  const strengthBar = document.querySelector("#password-strength-bar");
  const strengthLabel = document.querySelector("#password-strength-label");
  const entropyOutput = document.querySelector("#password-entropy");
  const generateButton = document.querySelector("#generate-password");
  const optionInputs = [...document.querySelectorAll("[data-password-option]")];

  const groups = {
    lowercase: "abcdefghijklmnopqrstuvwxyz",
    uppercase: "ABCDEFGHIJKLMNOPQRSTUVWXYZ",
    numbers: "0123456789",
    symbols: "!@#$%^&*()-_=+[]{};:,.?/"
  };
  const ambiguous = new Set("Il1O0o|`'\"".split(""));

  function randomIndex(max) {
    if (!Number.isInteger(max) || max < 1) throw new Error("A character set is required.");
    const limit = Math.floor(0x100000000 / max) * max;
    const values = new Uint32Array(1);
    do {
      crypto.getRandomValues(values);
    } while (values[0] >= limit);
    return values[0] % max;
  }

  function shuffle(items) {
    for (let index = items.length - 1; index > 0; index -= 1) {
      const swapIndex = randomIndex(index + 1);
      [items[index], items[swapIndex]] = [items[swapIndex], items[index]];
    }
    return items;
  }

  function selectedGroups() {
    const omitAmbiguous = document.querySelector("#password-ambiguous").checked;
    return optionInputs
      .filter((input) => input.checked)
      .map((input) => groups[input.value])
      .map((characters) => omitAmbiguous ? [...characters].filter((character) => !ambiguous.has(character)).join("") : characters)
      .filter(Boolean);
  }

  function strength(entropy) {
    if (entropy < 45) return { label: "Basic", width: 26, color: "var(--rose)" };
    if (entropy < 70) return { label: "Good", width: 52, color: "var(--warning)" };
    if (entropy < 100) return { label: "Strong", width: 78, color: "var(--teal)" };
    return { label: "Very strong", width: 100, color: "var(--success)" };
  }

  function renderStrength(length, characterCount) {
    const entropy = characterCount > 0 ? length * Math.log2(characterCount) : 0;
    const result = strength(entropy);
    strengthBar.style.width = `${result.width}%`;
    strengthBar.style.background = result.color;
    strengthLabel.textContent = result.label;
    entropyOutput.textContent = `~${Math.round(entropy)} bits`;
  }

  function generate() {
    try {
      if (!window.crypto?.getRandomValues) throw new Error("This browser does not expose a secure random generator.");
      const length = Number(lengthInput.value);
      if (!Number.isInteger(length) || length < 8 || length > 128) {
        throw new Error("Choose a password length between 8 and 128 characters.");
      }
      const activeGroups = selectedGroups();
      if (!activeGroups.length) throw new Error("Select at least one character group.");
      if (length < activeGroups.length) throw new Error("The password is too short for all selected character groups.");

      const allCharacters = activeGroups.join("");
      const result = activeGroups.map((characters) => characters[randomIndex(characters.length)]);
      while (result.length < length) result.push(allCharacters[randomIndex(allCharacters.length)]);
      passwordOutput.value = shuffle(result).join("");
      renderStrength(length, new Set(allCharacters).size);
      errorBox.hidden = true;
    } catch (error) {
      errorBox.textContent = error instanceof Error ? error.message : "Unable to generate a password.";
      errorBox.hidden = false;
    }
  }

  lengthInput.addEventListener("input", () => {
    lengthOutput.textContent = lengthInput.value;
    generate();
  });
  optionInputs.forEach((input) => input.addEventListener("change", generate));
  document.querySelector("#password-ambiguous").addEventListener("change", generate);
  generateButton.addEventListener("click", generate);
  document.querySelector("#generate-password-secondary")?.addEventListener("click", generate);

  lengthOutput.textContent = lengthInput.value;
  generate();
})();
