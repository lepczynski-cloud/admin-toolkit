# Admin Toolkit

Free, privacy-friendly browser tools for everyday Linux, networking and system administration tasks.

**Live site:** [admintoolkit.lepczynski.it](https://admintoolkit.lepczynski.it/)

![Admin Toolkit preview](public/assets/og/admin-toolkit.png)

- [Polish setup guide](SETUP-PL.md)
- [Cloudflare Workers Builds configuration](CLOUDFLARE-GITHUB.md)

## Included tools

- **CIDR Calculator** — network, broadcast, host range, subnet mask, wildcard mask and address counts.
- **chmod Calculator** — visual Linux read/write/execute permissions with numeric and symbolic output.
- **Cron Expression Generator** — common standard five-field Unix cron schedules.
- **Unix Timestamp Converter** — dates, Unix seconds, milliseconds, UTC and local time.

## Design goals

- Static HTML, CSS and JavaScript.
- No backend, user account, cookies or analytics.
- Calculations are performed locally in the browser.
- Installable PWA with offline support after the first successful visit.
- Separate, shareable and indexable URL for every tool.
- Automatic deployment from GitHub with Cloudflare Workers Builds.

## Project structure

```text
admin-toolkit/
├── public/                         # Files published as the website
│   ├── index.html
│   ├── 404.html
│   ├── cidr/
│   │   └── index.html
│   ├── chmod/
│   │   └── index.html
│   ├── cron/
│   │   └── index.html
│   ├── timestamp/
│   │   └── index.html
│   ├── assets/
│   │   ├── css/
│   │   │   └── styles.css
│   │   ├── js/
│   │   │   ├── config.js
│   │   │   ├── site.js
│   │   │   ├── cidr.js
│   │   │   ├── chmod.js
│   │   │   ├── cron.js
│   │   │   └── timestamp.js
│   │   ├── icons/
│   │   └── og/
│   │       └── admin-toolkit.png
│   ├── _headers
│   ├── _redirects
│   ├── robots.txt
│   ├── sitemap.xml
│   ├── site.webmanifest
│   └── sw.js
├── wrangler.jsonc                 # Cloudflare Worker configuration
├── CLOUDFLARE-GITHUB.md
├── SETUP-PL.md
├── LICENSE
├── .gitignore
└── README.md
```

The `public/` directory is the deployment source configured in `wrangler.jsonc`. Its contents become the root of the published website. Therefore:

- repository path: `public/assets/css/styles.css`
- public URL: `https://admintoolkit.lepczynski.it/assets/css/styles.css`

Do not add `/public` to links used inside HTML, CSS, JavaScript, the web manifest, sitemap or Service Worker.

## Configure blog, YouTube and project links

Edit:

```text
public/assets/js/config.js
```

The blog, YouTube channel and GitHub repository are already configured. After publishing the related article and video, add their complete URLs:

```js
projectArticleUrl: "https://lepczynski.it/...",
projectVideoUrl: "https://www.youtube.com/watch?v=..."
```

Buttons linked to empty values remain hidden.

## Run locally

No build process is required. Start a local HTTP server from the repository root and use `public/` as its document directory:

```bash
python -m http.server 8080 --directory public
```

On Windows, if `python` is not available as a command:

```powershell
py -m http.server 8080 --directory public
```

Open:

```text
http://localhost:8080/
```

Serving the repository root directly is incorrect because browser paths such as `/assets/...` are relative to the deployed `public/` directory.

## Deploy with Cloudflare Workers Builds

This project is deployed as a static-assets-only Cloudflare Worker.

Cloudflare settings:

| Setting | Value |
|---|---|
| Repository | `admin-toolkit` |
| Production branch | `main` |
| Build command | leave empty |
| Deploy command | `npx wrangler deploy` |
| Non-production deploy command | `npx wrangler versions upload` |
| Root directory | `/` or repository root |
| Build variables | none |

`wrangler.jsonc` deploys only `./public`:

```json
{
  "name": "admin-toolkit",
  "compatibility_date": "2026-07-26",
  "assets": {
    "directory": "./public",
    "not_found_handling": "404-page",
    "html_handling": "auto-trailing-slash"
  }
}
```

Every push to `main` triggers a production deployment. See [CLOUDFLARE-GITHUB.md](CLOUDFLARE-GITHUB.md) for the exact dashboard configuration.

## Offline cache

The Service Worker uses a versioned cache and refreshes static assets in the background. When you add or remove precached files, update `PRECACHE_URLS` in:

```text
public/sw.js
```

For a clean cache migration, also increment:

```js
const CACHE_NAME = "admin-toolkit-v2";
```

## License

MIT License. See [LICENSE](LICENSE).

## Author

Created by [Wojciech Lepczyński](https://lepczynski.it/).

- [Blog](https://lepczynski.it/)
- [YouTube](https://www.youtube.com/@WojciechLepczynski)
- [GitHub](https://github.com/lepczynski-cloud)
