import snapshotJson from "../data/generated/v1/snapshot.json";
import { freshnessState } from "./freshness";
import type { DatasetSnapshot, DatasetStatusResponse, PreviewResponse } from "./types";
import { rankSlice } from "./ranking";
import { PREVIEW_LIMIT } from "./constants";

export function loadSnapshot(): DatasetSnapshot {
  return snapshotJson as DatasetSnapshot;
}

export function datasetStatus(now = new Date()): DatasetStatusResponse {
  const snapshot = loadSnapshot();
  const freshness = freshnessState(now, snapshot.manifest.lastReviewedAt);
  return {
    manifest: { ...snapshot.manifest, freshnessState: freshness },
    freshnessState: freshness,
    sourceCommit: snapshot.manifest.sourceCommit,
    counts: snapshot.manifest.counts,
    sliceIds: snapshot.manifest.sliceIds,
    sources: snapshot.manifest.sources,
  };
}

export function previewChips(sliceId?: string): PreviewResponse {
  const snapshot = loadSnapshot();
  const chosen =
    sliceId ??
    snapshot.slices.find((slice) => {
      const vendors = new Set(
        snapshot.results
          .filter((result) => slice.resultLogicalIds.includes(result.logicalId) && result.status === "published")
          .map((result) => result.vendor)
          .filter(Boolean),
      );
      return vendors.size >= 2;
    })?.sliceId ??
    snapshot.slices[0]?.sliceId ??
    null;

  if (!chosen) {
    return {
      sliceId: null,
      comparability: "No verified comparison slice is published in this dataset version.",
      datasetVersion: snapshot.manifest.datasetVersion,
      sourceCommit: snapshot.manifest.sourceCommit,
      rows: [],
      sources: snapshot.manifest.sources,
    };
  }

  const ranked = rankSlice(snapshot, {
    sliceId: chosen,
    metricView: "official",
    grouping: "all-systems",
    offset: 0,
    limit: PREVIEW_LIMIT,
  });
  return {
    sliceId: chosen,
    comparability: ranked.comparability,
    datasetVersion: ranked.datasetVersion,
    sourceCommit: ranked.sourceCommit,
    rows: ranked.rows,
    sources: ranked.sources,
  };
}
