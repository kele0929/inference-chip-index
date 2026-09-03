# Verification

Commands below were run in this repository. Results are factual, not estimated.

## Environment

- bun 1.4.0
- `@lucid-agents/core@5.0.0`, `@lucid-agents/http@4.0.0`, `@lucid-agents/payments@5.0.0`
- Next.js 16.0.10
- OpenNext `@opennextjs/cloudflare@1.14.8` (Lucid CLI 5.0.0 generates Next 16; this pin matches that runtime)

## Dataset hashes

| Mode | SHA-256 |
| --- | --- |
| Fixture | `68e9053d5f1cf4e5349e09dcc5b28b7e70608b31133831de14584c46e47c1e07` |
| Full-source snapshot | `5de2d52e830a5a01ad214000aa6c950dcff181e12aaf737fffd6d8c9095a4fd7` |

- Published official results: 141
- Comparison slices: 9
- Quarantined records: 16

## Multi-vendor slice (facts)

`slice:v6.0:closed:gpt-oss-120b:Offline:official-exact-match:tokens_per_second`

25 published results spanning NVIDIA, AMD, and Intel, including families battlemage, blackwell, blackwell-professional, blackwell-ultra, cdna4, and hopper.

The matching Server slice is also multi-vendor. Llama 3.1 8B and DeepSeek-R1 Closed results at this pin are NVIDIA-only after quarantine. That absence is in the coverage matrix and is not fabricated.

## Commands run

```bash
bun install --frozen-lockfile
bun run pipeline:check
bun run type-check
bun test
bun run build
bun run deploy
```

| Command | Result |
| --- | --- |
| `bun run pipeline:check` | passed (both hashes) |
| `bun run type-check` | passed |
| `bun test` | 24 pass, 0 fail |
| `bun run build` | passed (Next.js 16.0.10) |
| `bun run deploy` | OpenNext bundle succeeded; Wrangler stopped with missing `CLOUDFLARE_API_TOKEN` |

## Local runtime smoke (`bun run start`, http://127.0.0.1:3000)

| Path | Status |
| --- | --- |
| `/`, `/leaderboard`, `/methodology`, `/api-docs`, `/updates` | 200 |
| `GET /api/agent/health` | 200 `{"ok":true,"version":"1.0.0"}` |
| `GET /api/agent/entrypoints` | 200, four keys present |
| `GET /api/agent/.well-known/agent-card.json` | 200 |
| `GET /api/agent/.well-known/agent.json` | 200 |
| `GET /api/agent/.well-known/oasf-record.json` | 404 Lucid `not_found` (identity extension not installed; route still delegates to `handlers.oasf`) |
| `POST .../get-dataset-status/invoke` | 200 |
| `POST .../preview-inference-chips/invoke` | 200, five rows |
| `POST .../rank-inference-chips/invoke` | **503** `payment_configuration_error` — fail closed, not a free 200 |
| `POST .../rank-inference-chips/stream` | 400 `stream_not_supported` (route mounted, no invented stream use case) |

Leaderboard `/leaderboard?workload=not-a-workload` shows invalid filters. `/leaderboard?workload=llama3.1-8b&scenario=Offline&vendor=AMD` shows no comparable results.

## Paid endpoints without payment config

`paymentsFromEnv()` returns no config in this environment. Priced entrypoints stay priced. Rank/compare return Lucid `payment_configuration_error` (503) and do not return ranking JSON.

When `PAYMENTS_FACILITATOR_URL`, `PAYMENTS_NETWORK=eip155:84532`, and `PAYMENTS_RECEIVABLE_ADDRESS` are set, Lucid advertises x402 offers on Base Sepolia. That configuration was not present here, so live 402 offer headers were not captured.

## Public preview

**Vercel (verified 2026-09-03):** https://temporary-sonic-fluorine-exqm5bc.vercel.app

Anonymous `npx vercel deploy --temporary --yes --prebuilt` after a local `next build`. `next.config.ts` skips `initOpenNextCloudflareForDev` on production / Vercel so the OpenNext Wrangler hook does not break the Next build. Lucid routes stay App Router handlers.

| Path | Status |
| --- | --- |
| `/`, `/leaderboard`, `/methodology`, `/api-docs`, `/updates` | 200 |
| `GET /api/agent/health` | 200 `{"ok":true,"version":"1.0.0"}` |
| `POST .../preview-inference-chips/invoke` | 200 |
| `POST .../rank-inference-chips/invoke` with official slice ID | **503** `payment_configuration_error` |

CLI expiry: **2026-09-03T23:57:27Z**. Claim to keep: https://vercel.com/claim-deployment?code=f51b8e85-097f-4d77-a47d-b28a8c659a7a

**~7-day unattended preview blocker:** no `VERCEL_TOKEN`, Netlify PAT, or `CLOUDFLARE_API_TOKEN` on this VM. Anonymous Vercel and Netlify both require a claim within one hour. No workers.dev URL was invented.

Operator credentials for a durable preview (do not commit):

```bash
export CLOUDFLARE_API_TOKEN=...   # Cloudflare API token from the "Edit Cloudflare Workers" template
export CLOUDFLARE_ACCOUNT_ID=...  # 32-char account id from the Cloudflare dashboard
bun run deploy
```

Expected workers.dev hostname after a successful deploy: `https://inference-chip-index.<account>.workers.dev` (exact hostname is assigned by Cloudflare; do not invent it).

## Unmet acceptance items

- Unattended ~7-day preview is blocked: the live Vercel URL is anonymous and expires ~1 hour unless claimed. No Vercel/Netlify/Cloudflare account token is on this VM.
- Live x402 402 offer headers on Base Sepolia were not exercised (no payment config). Fail-closed behavior was verified.
- OASF document is mounted but returns Lucid’s official not-found until an identity extension is added (out of the required HTTP+payments composition).
