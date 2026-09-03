# Deployment runbook

Target: Cloudflare Workers through OpenNext.

## Local

```bash
bun install --frozen-lockfile
bun run dev
```

## Production build

```bash
bun run type-check
bun test
bun run build
```

## Workers preview / deploy

```bash
bun run preview    # OpenNext + wrangler local
bun run deploy     # OpenNext + wrangler deploy to workers.dev
```

Required credentials (do not commit):

- `CLOUDFLARE_API_TOKEN`
- `CLOUDFLARE_ACCOUNT_ID`

Wrangler worker name: `inference-chip-index` in `wrangler.jsonc`.

If credentials are missing, the app remains buildable. Record the exact blocker in `VERIFICATION.md` instead of inventing a URL.
