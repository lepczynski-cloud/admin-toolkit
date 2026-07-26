(() => {
  "use strict";

  const MAX_IPV4 = (1n << 32n) - 1n;
  const form = document.querySelector("#cidr-form");
  const input = document.querySelector("#cidr-input");
  const errorBox = document.querySelector("#cidr-error");
  const resultBox = document.querySelector("#cidr-results");
  const summary = document.querySelector("#cidr-summary");

  const outputs = {
    input: document.querySelector("#result-input"),
    network: document.querySelector("#result-network"),
    broadcast: document.querySelector("#result-broadcast"),
    firstHost: document.querySelector("#result-first-host"),
    lastHost: document.querySelector("#result-last-host"),
    mask: document.querySelector("#result-mask"),
    wildcard: document.querySelector("#result-wildcard"),
    total: document.querySelector("#result-total"),
    usable: document.querySelector("#result-usable")
  };

  function parseIPv4(value) {
    const parts = value.split(".");
    if (parts.length !== 4) throw new Error("Enter a valid IPv4 address.");

    const octets = parts.map((part) => {
      if (!/^\d{1,3}$/.test(part)) throw new Error("IPv4 octets must contain only numbers.");
      const octet = Number(part);
      if (!Number.isInteger(octet) || octet < 0 || octet > 255) {
        throw new Error("Each IPv4 octet must be between 0 and 255.");
      }
      return octet;
    });

    return octets.reduce((result, octet) => (result << 8n) | BigInt(octet), 0n);
  }

  function formatIPv4(value) {
    return [24n, 16n, 8n, 0n]
      .map((shift) => Number((value >> shift) & 255n))
      .join(".");
  }

  function calculate(value) {
    const normalized = value.trim();
    const match = normalized.match(/^([^/]+)\/(\d{1,2})$/);
    if (!match) throw new Error("Use the format 192.168.1.10/24.");

    const ip = parseIPv4(match[1].trim());
    const prefix = Number(match[2]);
    if (!Number.isInteger(prefix) || prefix < 0 || prefix > 32) {
      throw new Error("The CIDR prefix must be between /0 and /32.");
    }

    const hostBits = 32 - prefix;
    const mask = prefix === 0 ? 0n : (MAX_IPV4 << BigInt(hostBits)) & MAX_IPV4;
    const wildcard = MAX_IPV4 ^ mask;
    const network = ip & mask;
    const broadcast = network | wildcard;
    const total = 1n << BigInt(hostBits);

    let firstHost;
    let lastHost;
    let usable;
    let note;

    if (prefix <= 30) {
      firstHost = network + 1n;
      lastHost = broadcast - 1n;
      usable = total - 2n;
      note = "Traditional subnet calculation reserves the network and broadcast addresses.";
    } else if (prefix === 31) {
      firstHost = network;
      lastHost = broadcast;
      usable = 2n;
      note = "/31 is commonly used for point-to-point links, where both addresses can be usable (RFC 3021).";
    } else {
      firstHost = network;
      lastHost = network;
      usable = 1n;
      note = "/32 identifies a single host route.";
    }

    return {
      normalized: `${formatIPv4(ip)}/${prefix}`,
      prefix,
      network: formatIPv4(network),
      broadcast: formatIPv4(broadcast),
      firstHost: formatIPv4(firstHost),
      lastHost: formatIPv4(lastHost),
      mask: formatIPv4(mask),
      wildcard: formatIPv4(wildcard),
      total: total.toLocaleString("en-US"),
      usable: usable.toLocaleString("en-US"),
      note
    };
  }

  function render(result) {
    outputs.input.textContent = result.normalized;
    outputs.network.textContent = `${result.network}/${result.prefix}`;
    outputs.broadcast.textContent = result.broadcast;
    outputs.firstHost.textContent = result.firstHost;
    outputs.lastHost.textContent = result.lastHost;
    outputs.mask.textContent = result.mask;
    outputs.wildcard.textContent = result.wildcard;
    outputs.total.textContent = result.total;
    outputs.usable.textContent = result.usable;
    summary.textContent = result.note;

    errorBox.hidden = true;
    resultBox.hidden = false;
  }

  function showError(message) {
    errorBox.textContent = message;
    errorBox.hidden = false;
    resultBox.hidden = true;
  }

  function runCalculation() {
    try {
      render(calculate(input.value));
    } catch (error) {
      showError(error instanceof Error ? error.message : "Unable to calculate this subnet.");
    }
  }

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    runCalculation();
  });

  document.querySelectorAll("[data-cidr-example]").forEach((button) => {
    button.addEventListener("click", () => {
      input.value = button.dataset.cidrExample;
      runCalculation();
    });
  });

  document.querySelector("#copy-cidr-results")?.addEventListener("click", async (event) => {
    const result = calculate(input.value);
    const text = [
      `Input: ${result.normalized}`,
      `Network: ${result.network}/${result.prefix}`,
      `Broadcast: ${result.broadcast}`,
      `First host: ${result.firstHost}`,
      `Last host: ${result.lastHost}`,
      `Subnet mask: ${result.mask}`,
      `Wildcard mask: ${result.wildcard}`,
      `Total addresses: ${result.total}`,
      `Usable hosts: ${result.usable}`
    ].join("\n");

    try {
      await navigator.clipboard.writeText(text);
      const button = event.currentTarget;
      const previousText = button.textContent;
      button.textContent = "Copied";
      button.classList.add("is-success");
      window.setTimeout(() => {
        button.textContent = previousText;
        button.classList.remove("is-success");
      }, 1400);
    } catch (error) {
      console.error("Copy failed", error);
    }
  });

  runCalculation();
})();
