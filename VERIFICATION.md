# Verification

Commands below were run in this repository. Update this file when the recorded results change.

## Environment

- bun 1.4.0
- Pinned Lucid packages: `@lucid-agents/core@5.0.0`, `@lucid-agents/http@4.0.0`, `@lucid-agents/payments@5.0.0`
- Next.js 16.0.10

## Dataset

- Fixture hash: `9ecc04c56b4e7bb160cfce88747e436d210e4e7a92cdcf17414408df3bfef403`
- Full-source hash: `70df2af2679b92a0b6b9ea7833ff23496e8c05394bb56b9e2cab6fc39931aae0`
- Published official results: 141
- Comparison slices: 9
- Quarantined records: 16

Verified multi-vendor slice (facts only):

`slice:v6.0:closed:gpt-oss-120b:Offline:official-exact-match:tokens_per_second`

25 published results spanning NVIDIA, AMD, and Intel, including families battlemage, blackwell, blackwell-professional, blackwell-ultra, cdna4, and hopper.

The matching Server slice is also multi-vendor. Llama 3.1 8B and DeepSeek-R1 Closed results in this pin are NVIDIA-only after quarantine; that absence is recorded in the coverage matrix, not fabricated.

## Commands run

```bash
bun install --frozen-lockfile
bun run pipeline:check
bun run type-check
bun test
```

Results recorded when this file was last updated:

- `bun run pipeline:check`: passed
- `bun run type-check`: passed
- `bun test`: 23 pass, 0 fail
- `bun run build`: pending in this revision
- Public preview URL: pending deploy attempt
