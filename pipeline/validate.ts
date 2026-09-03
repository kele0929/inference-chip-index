import { z } from "zod";
import { ALLOWED_SCENARIOS, ALLOWED_WORKLOADS, DIVISION, RELEASE } from "../lib/constants";
import { getMetric } from "../lib/metrics";
import { sourceRefSchema } from "../lib/schemas";
import type { DatasetSnapshot } from "../lib/types";

const publishedIds = {
  logicalId: z.string().min(1),
  contentVersionId: z.string().regex(/^cv:[0-9a-f]{64}$/),
};

const snapshotSchema = z.object({
  manifest: z.object({
    datasetVersion: z.string(),
    release: z.literal(RELEASE),
    division: z.literal(DIVISION),
    sourceRepository: z.string().url(),
    sourceCommit: z.string().min(7),
    lastReviewedAt: z.string(),
    freshnessState: z.enum(["fresh", "stale"]),
    freshnessPolicyDays: z.number(),
    normalizerVersion: z.string(),
    snapshotSha256: z.string().regex(/^[0-9a-f]{64}$/),
    counts: z.record(z.string(), z.number()),
    sliceIds: z.array(z.string()),
    sources: z.array(sourceRefSchema),
  }),
  accelerators: z.array(z.object({ ...publishedIds, slug: z.string() }).passthrough()),
  systems: z.array(z.object({ ...publishedIds, systemId: z.string() }).passthrough()),
  results: z.array(
    z
      .object({
        ...publishedIds,
        workload: z.enum(ALLOWED_WORKLOADS),
        scenario: z.enum(ALLOWED_SCENARIOS),
        metricId: z.string(),
        unit: z.string(),
        officialValue: z.number().finite(),
      })
      .passthrough(),
  ),
  slices: z.array(z.object({ ...publishedIds, sliceId: z.string() }).passthrough()),
  tombstones: z.array(z.object({ ...publishedIds, removedLogicalId: z.string() }).passthrough()),
  quarantine: z.array(z.object({ logicalId: z.string(), reasons: z.array(z.string()) }).passthrough()),
  coverage: z.array(z.object({ vendor: z.string(), workload: z.string() }).passthrough()),
  changelog: z.string().min(1),
});

export function validateSnapshot(snapshot: DatasetSnapshot): void {
  const parsed = snapshotSchema.safeParse(snapshot);
  if (!parsed.success) {
    throw new Error(`Snapshot failed Zod validation: ${parsed.error.message}`);
  }

  const ids = new Map<string, string>();
  const claim = (logicalId: string, kind: string) => {
    const existing = ids.get(logicalId);
    if (existing) throw new Error(`duplicate IDs: ${logicalId} (${existing} and ${kind})`);
    ids.set(logicalId, kind);
  };
  for (const item of snapshot.accelerators) claim(item.logicalId, "accelerator");
  for (const item of snapshot.systems) claim(item.logicalId, "system");
  for (const item of snapshot.results) claim(item.logicalId, "result");
  for (const item of snapshot.slices) claim(item.logicalId, "slice");
  for (const item of snapshot.tombstones) claim(item.logicalId, "tombstone");

  for (const result of snapshot.results) {
    if (result.status === "published") {
      const metric = getMetric(result.metricId);
      if (!metric) throw new Error(`unknown units/metric: ${result.metricId}`);
      if (metric.canonicalUnit !== result.unit) {
        throw new Error(`unknown units: result ${result.logicalId} unit ${result.unit}`);
      }
      if (!Number.isFinite(result.officialValue)) {
        throw new Error(`invalid numbers: ${result.logicalId}`);
      }
      if (!result.sources.every((source) => source.repository.startsWith("https://") && source.sha256)) {
        throw new Error(`missing provenance: ${result.logicalId}`);
      }
    }
  }

  for (const slice of snapshot.slices) {
    const members = snapshot.results.filter((result) => slice.resultLogicalIds.includes(result.logicalId));
    for (const result of members) {
      if (
        result.workload !== slice.workload ||
        result.scenario !== slice.scenario ||
        result.accuracyTarget !== slice.accuracyTarget ||
        result.metricId !== slice.metricId ||
        result.unit !== slice.unit
      ) {
        throw new Error(`incompatible merges in slice ${slice.sliceId}`);
      }
    }
  }
}
