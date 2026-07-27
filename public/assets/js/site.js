(() => {
  "use strict";

  const config = window.ADMIN_TOOLKIT_CONFIG || {};

  function safeHttpsUrl(value) {
    if (typeof value !== "string" || !value.trim()) return null;

    try {
      const url = new URL(value);
      return url.protocol === "https:" ? url.href : null;
    } catch {
      return null;
    }
  }

  const linkMap = {
    blog: safeHttpsUrl(config.blogUrl),
    youtube: safeHttpsUrl(config.youtubeUrl),
    github: safeHttpsUrl(config.githubUrl),
    article: safeHttpsUrl(config.projectArticleUrl),
    video: safeHttpsUrl(config.projectVideoUrl)
  };

  document.querySelectorAll("[data-external-link]").forEach((link) => {
    const key = link.dataset.externalLink;
    const url = linkMap[key];

    if (!url) {
      link.hidden = true;
      return;
    }

    link.href = url;
    link.target = "_blank";
    link.rel = "noopener noreferrer";
  });

  document.querySelectorAll("[data-current-year]").forEach((element) => {
    element.textContent = new Date().getFullYear().toString();
  });

  document.querySelectorAll("[data-copy-target]").forEach((button) => {
    button.addEventListener("click", async () => {
      const selector = button.dataset.copyTarget;
      if (!selector || !selector.startsWith("#")) return;

      const target = document.querySelector(selector);
      if (!target) return;

      const text = "value" in target ? target.value : target.textContent;
      if (!text) return;

      try {
        await navigator.clipboard.writeText(text.trim());
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
  });

  const installButton = document.querySelector("[data-install-app]");
  let deferredInstallPrompt = null;

  window.addEventListener("beforeinstallprompt", (event) => {
    event.preventDefault();
    deferredInstallPrompt = event;
    if (installButton) installButton.hidden = false;
  });

  installButton?.addEventListener("click", async () => {
    if (!deferredInstallPrompt) return;
    deferredInstallPrompt.prompt();
    await deferredInstallPrompt.userChoice;
    deferredInstallPrompt = null;
    installButton.hidden = true;
  });

  window.addEventListener("appinstalled", () => {
    if (installButton) installButton.hidden = true;
  });

  if ("serviceWorker" in navigator) {
    window.addEventListener("load", () => {
      navigator.serviceWorker.register("/sw.js").catch((error) => {
        console.error("Service worker registration failed", error);
      });
    });
  }
})();
