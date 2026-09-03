# Methodology

Inference Chip Index republishes official MLPerf Inference v6.0 Closed results. It does not run hardware and it does not invent missing scores.

## Exact slices

A ranking is comparable only when every row shares:

- release `v6.0`
- division `closed`
- workload (`llama3.1-8b`, `gpt-oss-120b`, or `deepseek-r1`)
- scenario (`Offline`, `Server`, or `Interactive`)
- accuracy target
- metric id
- unit

The Interactive directory is treated as Interactive even when a log file prints `Scenario : Server`.

## Systems versus chips

The official metric is the submitted system result from `performance/run_1/mlperf_log_summary.txt` after `Result is : VALID`.

A per-accelerator value is derived only when:

- `accelerators_per_node` and `number_of_nodes` are explicit integers
- the metric registry sets `derivationAllowed`
- the system is not quarantined

Names such as `x8` or `NVL72` never establish count.

## Quarantine

Ambiguous accelerator identity, mixed device strings, missing counts, unknown units, invalid numbers, or failed validity flags become `review-required` and are excluded from rankings.
