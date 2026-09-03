# Inference Chip Index

Find the fastest verified inference hardware for your workload — and only for that workload.

This is a public Next.js site plus a commercial Lucid Agents API that turns official MLPerf Inference v6.0 Closed results into source-linked comparisons. Rankings never claim that one accelerator is universally fastest. Every rank or compare call is bound to one exact slice: the same release, division, workload, scenario, accuracy target, metric, and unit.

- Task: TSK-WAN8H9G1
- Source: [mlcommons/inference_results_v6.0](https://github.com/mlcommons/inference_results_v6.0) commit `4d3916ac9cf474b679cdfcf492d43a0559418ad1`
- Repository: https://github.com/kele0929/inference-chip-index
- Default branch: `main`
- Public preview (Vercel, verified live): https://temporary-sonic-fluorine-exqm5bc.vercel.app
- That is an anonymous Vercel Next.js deployment of this App Router + Lucid app. Pages and `/api/agent` were curl-checked from this VM.
- It expires at **2026-09-03T23:57:27Z** (about one hour after deploy) unless claimed. Claim (browser login, do not paste a token into chat): https://vercel.com/claim-deployment?code=f51b8e85-097f-4d77-a47d-b28a8c659a7a
- No Cloudflare / Vercel / Netlify account token is present on this VM, so there is no unattended ~7-day workers.dev or Hobby project. See `docs/DEPLOYMENT.md`.

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
