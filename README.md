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

## Related project

The browser toolkit is a companion to the offline ESP32 Pocket Admin Toolkit:

- [ESP32 source code](https://github.com/lepczynski-cloud/crowpanel-Admin-Pocket-Toolkit)
- [Build article](https://lepczynski.it/en/other/pocket-admin-toolkit-a-practical-admin-tool-built-on-esp32/)
- [ESP_32 Project video](https://www.youtube.com/watch?v=In7P1azFg-0)

## Deployment

`wrangler.jsonc` publishes the `public/` directory as static Cloudflare Worker assets. No build command is required.

## License

MIT License. See [LICENSE](LICENSE).

Created by [Wojciech Lepczyński](https://lepczynski.it/).
