(() => {
  "use strict";

  const source = document.querySelector("#json-yaml-source");
  const result = document.querySelector("#json-yaml-result");
  const sourceLabel = document.querySelector("#json-yaml-source-label");
  const resultLabel = document.querySelector("#json-yaml-result-label");
  const indentSelect = document.querySelector("#json-indent");
  const errorBox = document.querySelector("#json-yaml-error");
  const modeButtons = [...document.querySelectorAll("[data-converter-mode]")];
  let mode = "json-to-yaml";
  let debounceTimer = null;

  function isSequenceLine(text) {
    return text === "-" || text.startsWith("- ");
  }

  function stripInlineComment(text) {
    let quote = null;
    let escaped = false;
    let bracketDepth = 0;
    for (let index = 0; index < text.length; index += 1) {
      const character = text[index];
      if (escaped) {
        escaped = false;
        continue;
      }
      if (quote === '"' && character === "\\") {
        escaped = true;
        continue;
      }
      if (quote) {
        if (character === quote) quote = null;
        continue;
      }
      if (character === '"' || character === "'") {
        quote = character;
        continue;
      }
      if (character === "[" || character === "{") bracketDepth += 1;
      if (character === "]" || character === "}") bracketDepth = Math.max(0, bracketDepth - 1);
      if (character === "#" && bracketDepth === 0 && (index === 0 || /\s/.test(text[index - 1]))) {
        return text.slice(0, index).trimEnd();
      }
    }
    return text.trimEnd();
  }

  function findMappingColon(text) {
    let quote = null;
    let escaped = false;
    let bracketDepth = 0;
    for (let index = 0; index < text.length; index += 1) {
      const character = text[index];
      if (escaped) {
        escaped = false;
        continue;
      }
      if (quote === '"' && character === "\\") {
        escaped = true;
        continue;
      }
      if (quote) {
        if (character === quote) quote = null;
        continue;
      }
      if (character === '"' || character === "'") {
        quote = character;
        continue;
      }
      if (character === "[" || character === "{") bracketDepth += 1;
      if (character === "]" || character === "}") bracketDepth = Math.max(0, bracketDepth - 1);
      if (character === ":" && bracketDepth === 0 && (index === text.length - 1 || /\s/.test(text[index + 1]))) {
        return index;
      }
    }
    return -1;
  }

  function parseQuoted(value) {
    if (value.startsWith('"')) {
      try {
        return JSON.parse(value);
      } catch {
        throw new Error("A double-quoted YAML string contains invalid escaping.");
      }
    }
    if (value.startsWith("'")) {
      if (!value.endsWith("'")) throw new Error("A single-quoted YAML string is not closed.");
      return value.slice(1, -1).replaceAll("''", "'");
    }
    return null;
  }

  function parseScalar(rawValue) {
    const value = stripInlineComment(rawValue).trim();
    if (value === "") return "";
    if (/^[&*!]/.test(value)) throw new Error("YAML anchors, aliases and custom tags are not supported by this local JSON-compatible parser.");

    if (value.startsWith('"') || value.startsWith("'")) return parseQuoted(value);
    if (/^(null|~)$/i.test(value)) return null;
    if (/^true$/i.test(value)) return true;
    if (/^false$/i.test(value)) return false;
    if (/^[-+]?(?:0|[1-9]\d*)(?:\.\d+)?(?:[eE][-+]?\d+)?$/.test(value)) {
      const number = Number(value);
      if (Number.isFinite(number)) return number;
    }
    if ((value.startsWith("[") && value.endsWith("]")) || (value.startsWith("{") && value.endsWith("}"))) {
      try {
        return JSON.parse(value);
      } catch {
        throw new Error("Flow-style arrays and objects must use valid JSON syntax.");
      }
    }
    return value;
  }

  function parseKey(rawKey) {
    const key = rawKey.trim();
    if (!key) throw new Error("A YAML mapping key cannot be empty.");
    if (key.startsWith('"') || key.startsWith("'")) {
      const parsed = parseQuoted(key);
      if (typeof parsed !== "string") throw new Error("YAML mapping keys must be strings.");
      return parsed;
    }
    return key;
  }

  function parseYaml(input) {
    if (input.length > 2_000_000) throw new Error("The YAML input is too large for this browser tool.");
    if (/\t/.test(input)) throw new Error("Use spaces instead of tabs for YAML indentation.");

    const rawLines = input.replace(/^\uFEFF/, "").replaceAll("\r\n", "\n").replaceAll("\r", "\n").split("\n");
    const lines = rawLines.map((raw, index) => {
      const indent = raw.match(/^ */)[0].length;
      return { raw, indent, text: raw.slice(indent), number: index + 1 };
    });

    function meaningfulText(line) {
      const text = stripInlineComment(line.text).trim();
      if (!text || text === "---" || text === "...") return "";
      return text;
    }

    function nextMeaningful(start) {
      for (let index = start; index < lines.length; index += 1) {
        if (meaningfulText(lines[index])) return index;
      }
      return -1;
    }

    function assign(object, key, value, lineNumber) {
      if (Object.prototype.hasOwnProperty.call(object, key)) {
        throw new Error(`Duplicate YAML key "${key}" on line ${lineNumber}.`);
      }
      object[key] = value;
    }

    function parseBlockScalar(start, parentIndent, marker) {
      let end = start;
      while (end < lines.length) {
        const line = lines[end];
        if (line.text.trim() && line.indent <= parentIndent) break;
        end += 1;
      }
      const contentLines = lines.slice(start, end);
      const nonEmptyIndents = contentLines.filter((line) => line.text.trim()).map((line) => line.indent);
      const contentIndent = nonEmptyIndents.length ? Math.min(...nonEmptyIndents) : parentIndent + 2;
      const values = contentLines.map((line) => line.raw.trim() ? line.raw.slice(Math.min(contentIndent, line.raw.length)) : "");
      let text;
      if (marker.startsWith(">")) {
        text = "";
        values.forEach((line, index) => {
          if (!line) {
            text += "\n";
          } else if (index === 0 || text.endsWith("\n")) {
            text += line;
          } else {
            text += ` ${line}`;
          }
        });
      } else {
        text = values.join("\n");
      }
      if (marker.includes("-")) return { value: text.replace(/\n+$/g, ""), next: end };
      if (marker.includes("+")) return { value: `${text}\n`, next: end };
      return { value: `${text.replace(/\n+$/g, "")}\n`, next: end };
    }

    function parseMappingEntry(text, lineIndex, indent, object) {
      const colon = findMappingColon(text);
      if (colon < 0) throw new Error(`Expected a key and value on YAML line ${lines[lineIndex].number}.`);
      const key = parseKey(text.slice(0, colon));
      const rawValue = text.slice(colon + 1).trim();
      let next = lineIndex + 1;
      let value;

      if (/^[|>][+-]?$/.test(rawValue)) {
        const parsed = parseBlockScalar(next, indent, rawValue);
        value = parsed.value;
        next = parsed.next;
      } else if (!rawValue) {
        const childIndex = nextMeaningful(next);
        if (childIndex >= 0 && lines[childIndex].indent > indent) {
          const parsed = parseNode(childIndex, lines[childIndex].indent);
          value = parsed.value;
          next = parsed.next;
        } else {
          value = null;
        }
      } else {
        value = parseScalar(rawValue);
      }

      assign(object, key, value, lines[lineIndex].number);
      return next;
    }

    function parseMapping(start, indent, initialObject = Object.create(null)) {
      const object = initialObject;
      let index = start;
      while (true) {
        const lineIndex = nextMeaningful(index);
        if (lineIndex < 0) return { value: object, next: lines.length };
        const line = lines[lineIndex];
        const text = meaningfulText(line);
        if (line.indent < indent || line.indent === indent && isSequenceLine(text)) return { value: object, next: lineIndex };
        if (line.indent > indent) throw new Error(`Unexpected indentation on YAML line ${line.number}.`);
        index = parseMappingEntry(text, lineIndex, indent, object);
      }
    }

    function parseSequence(start, indent) {
      const array = [];
      let index = start;
      while (true) {
        const lineIndex = nextMeaningful(index);
        if (lineIndex < 0) return { value: array, next: lines.length };
        const line = lines[lineIndex];
        const text = meaningfulText(line);
        if (line.indent < indent || line.indent === indent && !isSequenceLine(text)) return { value: array, next: lineIndex };
        if (line.indent > indent) throw new Error(`Unexpected indentation on YAML line ${line.number}.`);

        const rest = text.slice(1).trimStart();
        if (!rest) {
          const childIndex = nextMeaningful(lineIndex + 1);
          if (childIndex >= 0 && lines[childIndex].indent > indent) {
            const parsed = parseNode(childIndex, lines[childIndex].indent);
            array.push(parsed.value);
            index = parsed.next;
          } else {
            array.push(null);
            index = lineIndex + 1;
          }
          continue;
        }

        const colon = findMappingColon(rest);
        if (colon >= 0) {
          const object = Object.create(null);
          const logicalIndent = indent + 2;
          let next = parseMappingEntry(rest, lineIndex, logicalIndent, object);
          const continuation = nextMeaningful(next);
          if (continuation >= 0 && lines[continuation].indent === logicalIndent && !isSequenceLine(meaningfulText(lines[continuation]))) {
            const parsed = parseMapping(continuation, logicalIndent, object);
            next = parsed.next;
          }
          array.push(object);
          index = next;
        } else {
          array.push(parseScalar(rest));
          index = lineIndex + 1;
        }
      }
    }

    function parseNode(start, indent) {
      const lineIndex = nextMeaningful(start);
      if (lineIndex < 0) return { value: null, next: lines.length };
      const line = lines[lineIndex];
      if (line.indent < indent) return { value: null, next: lineIndex };
      const text = meaningfulText(line);
      return isSequenceLine(text) ? parseSequence(lineIndex, indent) : parseMapping(lineIndex, indent);
    }

    const first = nextMeaningful(0);
    if (first < 0) return null;
    const parsed = parseNode(first, lines[first].indent);
    const trailing = nextMeaningful(parsed.next);
    if (trailing >= 0) throw new Error(`Unexpected YAML content on line ${lines[trailing].number}.`);
    return parsed.value;
  }

  function plainString(value) {
    if (!value || value.trim() !== value) return false;
    if (/^(?:null|~|true|false|yes|no|on|off)$/i.test(value)) return false;
    if (/^[-+]?(?:0|[1-9]\d*)(?:\.\d+)?(?:[eE][-+]?\d+)?$/.test(value)) return false;
    if (/^\d{4}-\d{2}-\d{2}(?:[T ].*)?$/.test(value)) return false;
    if (/^[\-?:,\[\]{}#&*!|>'"%@`]/.test(value)) return false;
    if (/[:#]\s|\s#/.test(value)) return false;
    return /^[\p{L}\p{N}_./ -]+$/u.test(value);
  }

  function formatString(value) {
    return plainString(value) ? value : JSON.stringify(value);
  }

  function formatKey(key) {
    return plainString(key) && !key.includes(" ") ? key : JSON.stringify(key);
  }

  function scalarValue(value) {
    if (value === null) return "null";
    if (typeof value === "boolean") return value ? "true" : "false";
    if (typeof value === "number") {
      if (!Number.isFinite(value)) throw new Error("YAML output cannot represent non-finite JSON numbers.");
      return String(value);
    }
    if (typeof value === "string") return formatString(value);
    throw new Error("Only JSON-compatible scalar values can be converted.");
  }

  function isComplex(value) {
    return value !== null && typeof value === "object";
  }

  function dumpYaml(value, indent = 0) {
    const spacing = " ".repeat(indent);
    if (Array.isArray(value)) {
      if (!value.length) return `${spacing}[]`;
      return value.map((item) => {
        if (typeof item === "string" && item.includes("\n")) {
          const content = item.replace(/\n$/g, "").split("\n").map((line) => `${" ".repeat(indent + 2)}${line}`).join("\n");
          return `${spacing}- |-\n${content}`;
        }
        if (isComplex(item)) return `${spacing}-\n${dumpYaml(item, indent + 2)}`;
        return `${spacing}- ${scalarValue(item)}`;
      }).join("\n");
    }

    if (value && typeof value === "object") {
      const entries = Object.entries(value);
      if (!entries.length) return `${spacing}{}`;
      return entries.map(([key, item]) => {
        const renderedKey = formatKey(key);
        if (typeof item === "string" && item.includes("\n")) {
          const content = item.replace(/\n$/g, "").split("\n").map((line) => `${" ".repeat(indent + 2)}${line}`).join("\n");
          return `${spacing}${renderedKey}: |-\n${content}`;
        }
        if (isComplex(item)) return `${spacing}${renderedKey}:\n${dumpYaml(item, indent + 2)}`;
        return `${spacing}${renderedKey}: ${scalarValue(item)}`;
      }).join("\n");
    }

    return `${spacing}${scalarValue(value)}`;
  }

  function convert() {
    try {
      if (source.value.length > 2_000_000) throw new Error("The input is too large for this browser tool.");
      if (mode === "json-to-yaml") {
        const parsed = JSON.parse(source.value || "null");
        result.value = `${dumpYaml(parsed)}\n`;
      } else {
        const parsed = parseYaml(source.value);
        result.value = JSON.stringify(parsed, null, Number(indentSelect.value));
      }
      errorBox.hidden = true;
    } catch (error) {
      result.value = "";
      errorBox.textContent = error instanceof Error ? error.message : "Unable to convert this document.";
      errorBox.hidden = false;
    }
  }

  function updateLabels() {
    const jsonToYaml = mode === "json-to-yaml";
    sourceLabel.textContent = jsonToYaml ? "JSON input" : "YAML input";
    resultLabel.textContent = jsonToYaml ? "YAML result" : "JSON result";
    source.placeholder = jsonToYaml ? "Paste JSON here..." : "Paste YAML here...";
    indentSelect.closest(".form-group").hidden = jsonToYaml;
    modeButtons.forEach((button) => button.setAttribute("aria-pressed", String(button.dataset.converterMode === mode)));
  }

  function scheduleConvert() {
    window.clearTimeout(debounceTimer);
    debounceTimer = window.setTimeout(convert, 160);
  }

  modeButtons.forEach((button) => {
    button.addEventListener("click", () => {
      mode = button.dataset.converterMode;
      updateLabels();
      convert();
    });
  });

  source.addEventListener("input", scheduleConvert);
  indentSelect.addEventListener("change", convert);
  document.querySelector("#convert-json-yaml").addEventListener("click", convert);

  document.querySelector("#swap-json-yaml").addEventListener("click", () => {
    const previous = result.value;
    mode = mode === "json-to-yaml" ? "yaml-to-json" : "json-to-yaml";
    source.value = previous;
    updateLabels();
    convert();
  });

  document.querySelector("#clear-json-yaml").addEventListener("click", () => {
    source.value = "";
    result.value = "";
    errorBox.hidden = true;
    source.focus();
  });

  document.querySelector("#load-converter-example").addEventListener("click", () => {
    if (mode === "json-to-yaml") {
      source.value = JSON.stringify({
        service: "admin-toolkit",
        enabled: true,
        ports: [80, 443],
        metadata: { owner: "platform-team", environment: "production" }
      }, null, 2);
    } else {
      source.value = "service: admin-toolkit\nenabled: true\nports:\n  - 80\n  - 443\nmetadata:\n  owner: platform-team\n  environment: production\n";
    }
    convert();
  });

  source.value = JSON.stringify({
    service: "admin-toolkit",
    enabled: true,
    ports: [80, 443],
    metadata: { owner: "platform-team", environment: "production" }
  }, null, 2);
  updateLabels();
  convert();
})();
