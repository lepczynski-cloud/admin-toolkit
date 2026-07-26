# Cloudflare Workers Builds + GitHub

This repository is deployed as a static-assets-only Cloudflare Worker.

## Repository structure

- `public/` - files published as the website
- `wrangler.jsonc` - Cloudflare Workers deployment configuration
- `README.md`, `LICENSE`, `SETUP-PL.md` - repository-only files

## Cloudflare build settings

- Production branch: `main`
- Builds for non-production branches: optional; leave disabled initially
- Build command: leave empty
- Deploy command: `npx wrangler deploy`
- Non-production branch deploy command: `npx wrangler versions upload`
- Root directory: `/` (repository root)
- API token: create a new token automatically
- Build variables: none
- Build caching: enabled/default

The `name` field in `wrangler.jsonc` must exactly match the existing Cloudflare Worker name if the deployment should update that Worker rather than create another one.
