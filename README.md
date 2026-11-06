# Admin Toolkit

Free, privacy-friendly browser tools for everyday Linux, networking, security, automation and system administration tasks.

**Live site:** [admintoolkit.lepczynski.it](https://admintoolkit.lepczynski.it/)

![Admin Toolkit preview](public/assets/og/admin-toolkit.png)

## Included tools

- **CIDR Calculator** — IPv4 network, broadcast, host range, subnet mask and wildcard mask.
- **chmod Calculator** — visual Linux permissions with numeric and symbolic output.
- **Secure Password Generator** — configurable passwords using the browser cryptography API.
- **Cron Generator and Parser** — build or decode five-field Unix cron expressions and calculate the next five runs.
- **Unix Timestamp Converter** — convert between dates, Unix seconds, milliseconds, UTC and local time.
- **Base64 Encoder and Decoder** — UTF-8 and URL-safe Base64 conversion.
- **Time Zone Converter** — synchronized CET/CEST, HKT and Zulu clocks with additional IANA zones.
- **JSON ⇄ YAML Converter** — local conversion for JSON-compatible YAML documents.

## Design goals

- Static HTML, CSS and JavaScript with no build step.
- No application backend, user account, cookies or analytics.
- Calculations are performed locally in the browser.
- Installable PWA with offline support after the first successful visit.
- Separate, shareable and indexable URL for every tool.
- Automatic deployment from GitHub with Cloudflare Workers Builds.

## Run locally

From the repository root:

```bash
python3 -m http.server 8080 --directory public
```

Then open `http://localhost:8080/`.

## Separate ESP32 hardware edition

This repository is the **online browser version** at [admintoolkit.lepczynski.it](https://admintoolkit.lepczynski.it/). Its calculators are implemented in local JavaScript and it does not use an application backend. The PWA supports offline use after the necessary pages have been cached.

The physical **Admin Pocket Toolkit** is a separate open-source project with eight touchscreen tools for the Elecrow 2.8-inch ESP32 CrowPanel. The online homepage shows its real device cover image, served by the companion ESP32 site, and links to its browser-based firmware installer:

**[ESP32 Admin Pocket Toolkit: device page and browser firmware installer](https://esp32-admin-toolkit.lepczynski.it/)**

The installer provides the most recent *successfully built* firmware from the ESP32 repository. For the supported device, you can install it over USB using a compatible desktop browser, without setting up a local IDE or compiling the firmware yourself. It is not intended for other ESP32 board variants.

- [ESP32 source code](https://github.com/lepczynski-cloud/crowpanel-Admin-Pocket-Toolkit)
- [ESP32 Toolkit v2 video](https://www.youtube.com/watch?v=In7P1azFg-0)
- [ESP32 Toolkit v2 article](https://lepczynski.it/en/other/pocket-admin-toolkit-v2-for-esp32-more-admin-tools-in-your-pocket/)

## Deployment

`wrangler.jsonc` publishes the `public/` directory as static Cloudflare Worker assets. No build command, GitHub Actions workflow or backend is required. Updating `main` triggers deployment through the existing Cloudflare Git integration. The optional ESP32 image is loaded from the separate project website; all browser calculators remain local and PWA tools work offline after caching.

## License

MIT License. See [LICENSE](LICENSE).

Created by [Wojciech Lepczyński](https://lepczynski.it/).
