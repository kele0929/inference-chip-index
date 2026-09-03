import { z } from "zod";
import { MAX_PAGE_LIMIT } from "./constants";

export const sourceRefSchema = z.object({
  repository: z.string(),
  commit: z.string(),
  path: z.string(),
  url: z.string(),
  sha256: z.string(),
});

export const rankedRowSchema = z.object({
  rank: z.number().int(),
  position: z.number().int(),
  tied: z.boolean(),
  metricView: z.enum(["official", "derived"]),
  value: z.number(),
  unit: z.string(),
  acceleratorSlug: z.string(),
  acceleratorName: z.string(),
  vendor: z.string(),
  family: z.string(),
  submitter: z.string(),
  systemName: z.string(),
  systemLogicalId: z.string(),
  resultLogicalId: z.string(),
  acceleratorCount: z.number().int().nullable(),
  derivedFromOfficial: z.boolean(),
  sources: z.array(sourceRefSchema),
});

export const datasetStatusInputSchema = z.object({}).strict();

export const datasetStatusOutputSchema = z.object({
  manifest: z.object({
    datasetVersion: z.string(),
    release: z.string(),
    division: z.string(),
    sourceRepository: z.string(),
    sourceCommit: z.string(),
    lastReviewedAt: z.string(),
    freshnessState: z.enum(["fresh", "stale"]),
    freshnessPolicyDays: z.number(),
    normalizerVersion: z.string(),
    snapshotSha256: z.string(),
    counts: z.object({
      accelerators: z.number(),
      systems: z.number(),
      results: z.number(),
      slices: z.number(),
      publishedResults: z.number(),
      quarantinedRecords: z.number(),
      tombstones: z.number(),
    }),
    sliceIds: z.array(z.string()),
    sources: z.array(sourceRefSchema),
  }),
  freshnessState: z.enum(["fresh", "stale"]),
  sourceCommit: z.string(),
  counts: z.object({
    accelerators: z.number(),
    systems: z.number(),
    results: z.number(),
    slices: z.number(),
    publishedResults: z.number(),
    quarantinedRecords: z.number(),
    tombstones: z.number(),
  }),
  sliceIds: z.array(z.string()),
  sources: z.array(sourceRefSchema),
});

export const previewInputSchema = z
  .object({
    sliceId: z.string().min(1).optional(),
  })
  .strict();

export const previewOutputSchema = z.object({
  sliceId: z.string().nullable(),
  comparability: z.string(),
  datasetVersion: z.string(),
  sourceCommit: z.string(),
  rows: z.array(rankedRowSchema).max(5),
  sources: z.array(sourceRefSchema),
});

export const rankInputSchema = z
  .object({
    sliceId: z.string().min(1),
    vendor: z.string().min(1).optional(),
    metricView: z.enum(["official", "derived"]).default("official"),
    grouping: z.enum(["all-systems", "best-per-accelerator"]).default("all-systems"),
    offset: z.number().int().min(0).default(0),
    limit: z.number().int().min(1).max(MAX_PAGE_LIMIT).default(25),
  })
  .strict();

export const rankOutputSchema = z.object({
  sliceId: z.string(),
  comparability: z.string(),
  datasetVersion: z.string(),
  sourceCommit: z.string(),
  metricView: z.enum(["official", "derived"]),
  grouping: z.enum(["all-systems", "best-per-accelerator"]),
  total: z.number().int(),
  offset: z.number().int(),
  limit: z.number().int(),
  rows: z.array(rankedRowSchema),
  sources: z.array(sourceRefSchema),
});

export const compareInputSchema = z
  .object({
    sliceId: z.string().min(1),
    acceleratorSlugs: z.array(z.string().min(1)).min(2).max(8),
    baselineSlug: z.string().min(1).optional(),
    metricView: z.enum(["official", "derived"]).default("official"),
  })
  .strict();

export const compareOutputSchema = z.object({
  sliceId: z.string(),
  comparability: z.string(),
  datasetVersion: z.string(),
  sourceCommit: z.string(),
  metricView: z.enum(["official", "derived"]),
  baselineSlug: z.string().nullable(),
  results: z.array(rankedRowSchema),
  missing: z.array(
    z.object({
      acceleratorSlug: z.string(),
      reason: z.string(),
    }),
  ),
  deltas: z.array(
    z.object({
      acceleratorSlug: z.string(),
      baselineSlug: z.string(),
      absolute: z.number(),
      relative: z.number().nullable(),
    }),
  ),
  sources: z.array(sourceRefSchema),
});
