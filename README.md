# Inference Chip Index

Find the fastest verified inference hardware for your workload — and only for that workload.

This is a public Next.js site plus a commercial Lucid Agents API that turns official MLPerf Inference v6.0 Closed results into source-linked comparisons. Rankings never claim that one accelerator is universally fastest. Every rank or compare call is bound to one exact slice: the same release, division, workload, scenario, accuracy target, metric, and unit.

- Task: TSK-WAN8H9G1
- Source: [mlcommons/inference_results_v6.0](https://github.com/mlcommons/inference_results_v6.0) commit `4d3916ac9cf474b679cdfcf492d43a0559418ad1`
- Repository: https://github.com/kele0929/inference-chip-index
- Default branch: `main`
- Public preview (ephemeral Quick Tunnel, verified live from this agent VM): https://phys-kitchen-hands-mission.trycloudflare.com
- That hostname is a Cloudflare Quick Tunnel to `127.0.0.1:3000`. It dies when this VM or `cloudflared` stops and **does not** satisfy a workers.dev preview that stays up through review + 7 days.
- Durable workers.dev deploy is still blocked: this environment has no `CLOUDFLARE_API_TOKEN` or `CLOUDFLARE_ACCOUNT_ID`. OpenNext build succeeds; Wrangler is unauthenticated. Operator must provide those two values (do not commit them), then `bun run deploy`. See `docs/DEPLOYMENT.md` and `VERIFICATION.md`.

## Stack

- Next.js App Router + TypeScript
- `@lucid-agents/core@5.0.0`, `@lucid-agents/http@4.0.0`, `@lucid-agents/payments@5.0.0`
- One server-only Lucid runtime at `/api/agent`
- Next.js route modules delegate to `runtime.http.handlers`
- Cloudflare Workers via OpenNext (`@opennextjs/cloudflare`)

Lucid CLI 5.0.0 generates Next 16 projects, so this app pins Next `16.0.10` with those exact Lucid packages.

## Commands

```bash
bun install --frozen-lockfile
bun run pipeline:check
bun run type-check
bun test
bun run build
bun run dev
```

Dataset:

```bash
bun run pipeline:fixture
bun run dataset:update
bun run dataset:rollback
```

Deploy:

```bash
bun run preview
bun run deploy
```

## Pages

- `/` landing promise, immediately qualified as workload-specific
- `/leaderboard` exact-slice filters (release and division fixed)
- `/methodology` systems vs chips, official vs derived
- `/api-docs` Lucid inputs, prices, x402 flow
- `/updates` manifest, changelog, coverage, quarantine

## Agent entrypoints

| Key | Price | Notes |
| --- | --- | --- |
| `get-dataset-status` | free | Manifest, freshness, slice IDs |
| `preview-inference-chips` | free | Up to five verified rows |
| `rank-inference-chips` | $0.02 | Requires exact slice ID; fails closed without payment config |
| `compare-inference-chips` | $0.03 | 2–8 slugs; deltas only vs explicit baseline |

Mounted routes: `/api/agent/health`, `/entrypoints`, `/entrypoints/:key/invoke`, `/entrypoints/:key/stream`, and the three `/.well-known` discovery documents.

## Documentation

- [Methodology](docs/METHODOLOGY.md)
- [Data sources](docs/DATA_SOURCES.md)
- [Payments](docs/PAYMENTS.md)
- [Update / rollback](docs/UPDATE_ROLLBACK.md)
- [Deployment](docs/DEPLOYMENT.md)
- [Verification](VERIFICATION.md)
