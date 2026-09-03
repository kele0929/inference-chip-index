# Data sources

V1 uses only the official MLPerf Inference v6.0 results repository.

- Repository: https://github.com/mlcommons/inference_results_v6.0
- Pinned commit: `4d3916ac9cf474b679cdfcf492d43a0559418ad1`
- Allowlist: `closed/<submitter>/systems/*.json` and matching `closed/<submitter>/results/<system>/<workload>/<scenario>/`
- Workloads: `llama3.1-8b`, `gpt-oss-120b`, `deepseek-r1`
- Scenarios: `Offline`, `Server`, `Interactive`
- Official files: `measurements.json`, `performance/run_1/mlperf_log_summary.txt`, optional `accuracy/accuracy.txt`

Out of scope: `open/`, Network, edge, vision, speech, training, `backup_systems/`, `TEST*` audit folders, `src/` code trees, vendor blogs, and supplemental marketing datasets.

Vendored copies live in `data/source/` so reviewers can reproduce hashes without a live clone. Re-fetch from the pinned commit if those files are deleted:

```bash
# example: download a single official file
curl -fsSL \
  https://raw.githubusercontent.com/mlcommons/inference_results_v6.0/4d3916ac9cf474b679cdfcf492d43a0559418ad1/closed/NVIDIA/systems/B300-SXM-270GBx8_TRT.json
```

Every published record stores repository, commit, path, HTTPS blob URL, and SHA-256 of the exact bytes parsed.
