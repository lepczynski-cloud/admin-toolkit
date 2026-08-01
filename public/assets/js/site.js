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
    offlineGithub: safeHttpsUrl(config.offlineGithubUrl),
    article: safeHttpsUrl(config.projectArticleUrl),
    video: safeHttpsUrl(config.projectVideoUrl)
  };

  document.querySelectorAll("[data-external-link]").forEach((link) => {
    const url = linkMap[link.dataset.externalLink];
    if (!url) {
      link.hidden = true;
      return;
    }
    link.href = url;
    link.target = "_blank";
    link.rel = "noopener noreferrer";
  });

  document.querySelectorAll("[data-current-year]").forEach((element) => {
    element.textContent = String(new Date().getFullYear());
  });

  const navToggle = document.querySelector("[data-nav-toggle]");
  const navigation = document.querySelector("[data-site-nav]");
  if (navToggle && navigation) {
    const closeNavigation = () => {
      navigation.classList.remove("is-open");
      navToggle.setAttribute("aria-expanded", "false");
    };

    navToggle.addEventListener("click", () => {
      const willOpen = !navigation.classList.contains("is-open");
      navigation.classList.toggle("is-open", willOpen);
      navToggle.setAttribute("aria-expanded", String(willOpen));
    });

    navigation.addEventListener("click", (event) => {
      if (event.target.closest("a")) closeNavigation();
    });

    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape") closeNavigation();
    });

    window.addEventListener("resize", () => {
      if (window.innerWidth > 920) closeNavigation();
    });
  }

  function youtubeId(urlValue) {
    if (!urlValue) return null;
    try {
      const url = new URL(urlValue);
      if (url.hostname === "youtu.be") return url.pathname.slice(1) || null;
      if (url.hostname.endsWith("youtube.com")) {
        if (url.pathname.startsWith("/embed/")) return url.pathname.split("/")[2] || null;
        return url.searchParams.get("v");
      }
    } catch {
      return null;
    }
    return null;
  }

  const videoId = youtubeId(linkMap.video);
  document.querySelectorAll("[data-video-embed]").forEach((frame) => {
    if (!videoId) {
      frame.closest(".video-card")?.setAttribute("hidden", "");
      return;
    }
    frame.src = `https://www.youtube-nocookie.com/embed/${encodeURIComponent(videoId)}?rel=0`;
  });

  document.querySelectorAll("[data-copy-target]").forEach((button) => {
    button.addEventListener("click", async () => {
      const target = document.querySelector(button.dataset.copyTarget);
      if (!target) return;
      const text = "value" in target ? target.value : target.textContent;
      try {
        await navigator.clipboard.writeText(text || "");
        const previous = button.textContent;
        button.textContent = "Copied";
        button.classList.add("is-success");
        window.setTimeout(() => {
          button.textContent = previous;
          button.classList.remove("is-success");
        }, 1400);
      } catch (error) {
        console.error("Copy failed", error);
      }
    });
  });

  let installPrompt = null;
  const installButtons = [...document.querySelectorAll("[data-install-app]")];

  window.addEventListener("beforeinstallprompt", (event) => {
    event.preventDefault();
    installPrompt = event;
    installButtons.forEach((button) => {
      button.hidden = false;
    });
  });

  installButtons.forEach((button) => {
    button.addEventListener("click", async () => {
      if (!installPrompt) return;
      installPrompt.prompt();
      await installPrompt.userChoice;
      installPrompt = null;
      installButtons.forEach((item) => {
        item.hidden = true;
      });
    });
  });

  window.addEventListener("appinstalled", () => {
    installPrompt = null;
    installButtons.forEach((button) => {
      button.hidden = true;
    });
  });

  if ("serviceWorker" in navigator) {
    window.addEventListener("load", () => {
      navigator.serviceWorker.register("/sw.js").catch((error) => {
        console.error("Service Worker registration failed", error);
      });
    });
  }
})();
