(() => {
  "use strict";

  const source = document.querySelector("#base64-source");
  const result = document.querySelector("#base64-result");
  const sourceLabel = document.querySelector("#base64-source-label");
  const resultLabel = document.querySelector("#base64-result-label");
  const errorBox = document.querySelector("#base64-error");
  const urlSafe = document.querySelector("#base64-url-safe");
  const modeButtons = [...document.querySelectorAll("[data-base64-mode]")];
  let mode = "encode";

  function bytesToBinary(bytes) {
    let binary = "";
    const chunkSize = 0x8000;
    for (let index = 0; index < bytes.length; index += chunkSize) {
      binary += String.fromCharCode(...bytes.subarray(index, index + chunkSize));
    }
    return binary;
  }

  function encodeText(value) {
    const bytes = new TextEncoder().encode(value);
    let encoded = btoa(bytesToBinary(bytes));
    if (urlSafe.checked) encoded = encoded.replaceAll("+", "-").replaceAll("/", "_").replace(/=+$/g, "");
    return encoded;
  }

  function decodeText(value) {
    let normalized = value.replace(/\s+/g, "");
    if (!normalized) return "";
    if (urlSafe.checked || /[-_]/.test(normalized)) {
      normalized = normalized.replaceAll("-", "+").replaceAll("_", "/");
    }
    if (!/^[A-Za-z0-9+/]*={0,2}$/.test(normalized)) throw new Error("The input contains characters that are not valid Base64.");
    if (normalized.length % 4 === 1) throw new Error("The Base64 input has an invalid length.");
    normalized = normalized.padEnd(Math.ceil(normalized.length / 4) * 4, "=");
    let binary;
    try {
      binary = atob(normalized);
    } catch {
      throw new Error("The Base64 input could not be decoded.");
    }
    const bytes = Uint8Array.from(binary, (character) => character.charCodeAt(0));
    try {
      return new TextDecoder("utf-8", { fatal: true }).decode(bytes);
    } catch {
      throw new Error("The decoded bytes are not valid UTF-8 text.");
    }
  }

  function updateLabels() {
    const isEncode = mode === "encode";
    sourceLabel.textContent = isEncode ? "UTF-8 text" : "Base64 input";
    resultLabel.textContent = isEncode ? "Base64 result" : "Decoded UTF-8 text";
    source.placeholder = isEncode ? "Enter text to encode..." : "Paste Base64 to decode...";
    modeButtons.forEach((button) => button.setAttribute("aria-pressed", String(button.dataset.base64Mode === mode)));
  }

  function convert() {
    try {
      result.value = mode === "encode" ? encodeText(source.value) : decodeText(source.value);
      errorBox.hidden = true;
    } catch (error) {
      result.value = "";
      errorBox.textContent = error instanceof Error ? error.message : "Unable to convert this value.";
      errorBox.hidden = false;
    }
  }

  modeButtons.forEach((button) => {
    button.addEventListener("click", () => {
      mode = button.dataset.base64Mode;
      updateLabels();
      convert();
    });
  });

  source.addEventListener("input", convert);
  urlSafe.addEventListener("change", convert);

  document.querySelector("#swap-base64").addEventListener("click", () => {
    const previousResult = result.value;
    mode = mode === "encode" ? "decode" : "encode";
    source.value = previousResult;
    updateLabels();
    convert();
  });

  document.querySelector("#clear-base64").addEventListener("click", () => {
    source.value = "";
    result.value = "";
    errorBox.hidden = true;
    source.focus();
  });

  updateLabels();
  convert();
})();
