# Admin Toolkit Online deployment

This repository provides only the **browser version**. The main website at https://admintoolkit.lepczynski.it/ continues to deploy with the existing `wrangler.jsonc` and `public/` static assets configuration. No firmware is built here.

The homepage now points to the independent hardware edition at https://esp32-admin-toolkit.lepczynski.it/. The `/esp32/` route is also a redirect to that new website.

To deploy these changes, replace the corresponding source files in the existing `admin-toolkit` GitHub repository and push to `main`. Keep the present Cloudflare integration, existing Workers Builds settings, and all files in `public/`. No new Cloudflare configuration is required for this repo.

The ESP32 firmware build, browser installer and device website are configured in the separate `crowpanel-Admin-Pocket-Toolkit` repository. Refer to its `DEPLOYMENT.md` for the one-time Cloudflare setup.
