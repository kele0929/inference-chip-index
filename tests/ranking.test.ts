import { describe, expect, test } from "bun:test";
import { compareSlice } from "../lib/compare";
import { RankError, rankSlice } from "../lib/ranking";
import type { DatasetSnapshot } from "../lib/types";

function snapshot(): DatasetSnapshot {
  const source = {
    repository: "https://github.com/mlcommons/inference_results_v6.0",
    commit: "4d3916ac9cf474b679cdfcf492d43a0559418ad1",
    path: "closed/example",
    url: "https://github.com/mlcommons/inference_results_v6.0/blob/4d3916ac9cf474b679cdfcf492d43a0559418ad1/closed/example",
    sha256: "a".repeat(64),
  };
  return {
    manifest: {
      datasetVersion: "v1",
      release: "v6.0",
      division: "closed",
      sourceRepository: source.repository,
      sourceCommit: source.commit,
      lastReviewedAt: "2026-09-03T00:00:00.000Z",
      freshnessState: "fresh",
      freshnessPolicyDays: 120,
      normalizerVersion: "1.0.0",
      snapshotSha256: "b".repeat(64),
      counts: {
        accelerators: 2,
        systems: 3,
        results: 3,
        slices: 1,
        publishedResults: 3,
        quarantinedRecords: 0,
        tombstones: 0,
      },
      sliceIds: ["slice:v6.0:closed:gpt-oss-120b:Offline:official-exact-match:tokens_per_second"],
      sources: [source],
    },
    accelerators: [
      {
        logicalId: "acc:nvidia-b300-sxm-270gb",
        contentVersionId: `cv:${"c".repeat(64)}`,
        slug: "nvidia-b300-sxm-270gb",
        displayName: "NVIDIA B300",
        vendor: "NVIDIA",
        family: "blackwell-ultra",
        variant: null,
        status: "published",
        sources: [source],
      },
      {
        logicalId: "acc:amd-instinct-mi355x-288gb",
        contentVersionId: `cv:${"d".repeat(64)}`,
        slug: "amd-instinct-mi355x-288gb",
        displayName: "AMD MI355X",
        vendor: "AMD",
        family: "cdna4",
        variant: null,
        status: "published",
        sources: [source],
      },
    ],
    systems: [],
    results: [
      row("nvidia-a", "NVIDIA", "nvidia-b300-sxm-270gb", 100, source),
      row("nvidia-b", "NVIDIA", "nvidia-b300-sxm-270gb", 90, source),
      row("amd-a", "AMD", "amd-instinct-mi355x-288gb", 100, source),
    ],
    slices: [
      {
        logicalId: "slice:v6.0:closed:gpt-oss-120b:Offline:official-exact-match:tokens_per_second",
        contentVersionId: `cv:${"e".repeat(64)}`,
        sliceId: "slice:v6.0:closed:gpt-oss-120b:Offline:official-exact-match:tokens_per_second",
        release: "v6.0",
        division: "closed",
        workload: "gpt-oss-120b",
        scenario: "Offline",
        accuracyTarget: "official-exact-match",
        metricId: "tokens_per_second",
        unit: "tokens/s",
        winningDirection: "higher",
        comparability: "exact slice only",
        resultLogicalIds: ["res:nvidia-a", "res:nvidia-b", "res:amd-a"],
        sources: [source],
      },
    ],
    tombstones: [],
    quarantine: [],
    coverage: [],
    changelog: "test",
  };
}

function row(
  id: string,
  vendor: string,
  slug: string,
  value: number,
  source: DatasetSnapshot["manifest"]["sources"][number],
) {
  return {
    logicalId: `res:${id}`,
    contentVersionId: `cv:${id.padEnd(64, "0")}`,
    systemLogicalId: `sys:${id}`,
    acceleratorSlug: slug,
    submitter: vendor,
    vendor,
    workload: "gpt-oss-120b" as const,
    scenario: "Offline" as const,
    accuracyTarget: "official-exact-match",
    metricId: "tokens_per_second",
    unit: "tokens/s",
    officialValue: value,
    derivedPerAccelerator: value / 8,
    accuracyValue: 80,
    accuracyUnit: "exact_match_percent",
    valid: true,
    status: "published" as const,
    quarantineReasons: [],
    sources: [source],
  };
}

describe("ranking", () => {
  test("assigns competition ranks and keeps them stable across pagination", () => {
    const data = snapshot();
    const all = rankSlice(data, {
      sliceId: data.slices[0].sliceId,
      limit: 50,
    });
    expect(all.rows.map((item) => [item.resultLogicalId, item.rank, item.position])).toEqual([
      ["res:amd-a", 1, 1],
      ["res:nvidia-a", 1, 2],
      ["res:nvidia-b", 3, 3],
    ]);
    const page = rankSlice(data, {
      sliceId: data.slices[0].sliceId,
      offset: 2,
      limit: 1,
    });
    expect(page.rows[0]?.rank).toBe(3);
    expect(page.rows[0]?.position).toBe(3);
    expect(page.total).toBe(3);
  });

  test("best-per-accelerator does not mix systems into one chip score incorrectly", () => {
    const data = snapshot();
    const ranked = rankSlice(data, {
      sliceId: data.slices[0].sliceId,
      grouping: "best-per-accelerator",
    });
    expect(ranked.rows).toHaveLength(2);
    expect(ranked.rows[0]?.value).toBe(100);
  });

  test("rejects unknown slices instead of merging", () => {
    expect(() => rankSlice(snapshot(), { sliceId: "slice:other" })).toThrow(RankError);
  });
});

describe("compare and derivation", () => {
  test("emits deltas only against an explicit baseline", () => {
    const data = snapshot();
    const compared = compareSlice(data, {
      sliceId: data.slices[0].sliceId,
      acceleratorSlugs: ["nvidia-b300-sxm-270gb", "amd-instinct-mi355x-288gb"],
      baselineSlug: "amd-instinct-mi355x-288gb",
    });
    expect(compared.deltas).toHaveLength(1);
    expect(compared.deltas[0]?.absolute).toBe(0);
    expect(compared.missing).toEqual([]);
  });

  test("records missing evidence", () => {
    const data = snapshot();
    const compared = compareSlice(data, {
      sliceId: data.slices[0].sliceId,
      acceleratorSlugs: ["nvidia-b300-sxm-270gb", "intel-arc-pro-b60"],
    });
    expect(compared.missing[0]?.reason).toBe("unknown-accelerator-slug");
  });

  test("derived view uses per-accelerator values", () => {
    const data = snapshot();
    const ranked = rankSlice(data, {
      sliceId: data.slices[0].sliceId,
      metricView: "derived",
    });
    expect(ranked.rows[0]?.derivedFromOfficial).toBe(true);
    expect(ranked.rows[0]?.value).toBe(12.5);
  });
});
