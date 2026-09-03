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

Required credentials (do not commit secrets or `.env` files):

- `CLOUDFLARE_API_TOKEN` — API token created with Cloudflare’s **Edit Cloudflare Workers** template (Workers Scripts: Edit).
- `CLOUDFLARE_ACCOUNT_ID` — the 32-character account id from the Cloudflare dashboard.

Wrangler worker name: `inference-chip-index` in `wrangler.jsonc`.

If those two values are missing, Wrangler stays unauthenticated (`wrangler whoami` → not authenticated). The app remains buildable. Do not invent a workers.dev hostname.

### Ephemeral fallback (not a 7-day preview)

When Workers credentials are absent, a Cloudflare Quick Tunnel can front a local `bun run start` without an account:

```bash
cloudflared tunnel --url http://127.0.0.1:3000
```

That hostname dies with the process/VM and does not replace `bun run deploy`. Record whichever URL is actually live in `VERIFICATION.md`.
