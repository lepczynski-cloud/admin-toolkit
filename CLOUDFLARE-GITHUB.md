# Cloudflare Workers Builds + GitHub

The repository is deployed as a static-assets-only Cloudflare Worker. Cloudflare reads `wrangler.jsonc` from the repository root and uploads only the files stored in `public/`.

## Required repository layout

```text
admin-toolkit/
├── public/
│   ├── index.html
│   ├── assets/
│   ├── cidr/
│   ├── chmod/
│   ├── cron/
│   └── timestamp/
└── wrangler.jsonc
```

The Worker name in `wrangler.jsonc` must exactly match the existing Worker that owns the custom domain:

```json
"name": "admin-toolkit"
```

## Cloudflare dashboard settings

In **Workers & Pages → admin-toolkit → Settings → Builds**, connect the GitHub repository and use:

| Setting | Value |
|---|---|
| Git account | your connected GitHub account |
| Repository | `admin-toolkit` |
| Production branch | `main` |
| Builds for non-production branches | optional; disabled initially |
| Build command | leave empty |
| Deploy command | `npx wrangler deploy` |
| Non-production branch deploy command | `npx wrangler versions upload` |
| Root directory | `/` or leave at repository root |
| API token | create a new token automatically |
| Build variables | none |
| Build caching | default |

Do not set the root directory to `/public`. Wrangler must start in the repository root so it can find `wrangler.jsonc`; the configuration file itself points to `./public`.

## Deployment flow

```text
git push to main
→ Cloudflare Workers Build starts
→ npx wrangler deploy
→ wrangler.jsonc is loaded
→ files from public/ are uploaded
→ the existing admin-toolkit Worker is updated
```

The existing custom domain remains attached when the same Worker name is deployed:

```text
https://admintoolkit.lepczynski.it/
```

## First verification

After the first GitHub deployment, test:

```text
https://admintoolkit.lepczynski.it/
https://admintoolkit.lepczynski.it/cidr/
https://admintoolkit.lepczynski.it/chmod/
https://admintoolkit.lepczynski.it/cron/
https://admintoolkit.lepczynski.it/timestamp/
https://admintoolkit.lepczynski.it/robots.txt
https://admintoolkit.lepczynski.it/sitemap.xml
```

Then make a small commit to `main` and confirm that a new build appears in Cloudflare.
