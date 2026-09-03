import { comparabilityText } from "./metrics";
import { RankError, comparableResults, rankSlice } from "./ranking";
import type { CompareDelta, CompareMissing, CompareResponse, DatasetSnapshot, MetricView } from "./types";

export interface CompareQuery {
  sliceId: string;
  acceleratorSlugs: string[];
  baselineSlug?: string;
  metricView?: MetricView;
}

export function compareSlice(snapshot: DatasetSnapshot, query: CompareQuery): CompareResponse {
  const slice = snapshot.slices.find((item) => item.sliceId === query.sliceId);
  if (!slice) {
    throw new RankError("invalid_filters", `Unknown comparison slice: ${query.sliceId}`);
  }
  const slugs = query.acceleratorSlugs;
  if (slugs.length < 2 || slugs.length > 8) {
    throw new RankError("invalid_filters", "compare requires 2 to 8 accelerator slugs");
  }
  const unique = new Set(slugs);
  if (unique.size !== slugs.length) {
    throw new RankError("invalid_filters", "accelerator slugs must be unique");
  }

  const view = query.metricView ?? "official";
  const ranked = rankSlice(snapshot, {
    sliceId: query.sliceId,
    metricView: view,
    grouping: "best-per-accelerator",
    offset: 0,
    limit: 50,
  });

  const bySlug = new Map(ranked.rows.map((row) => [row.acceleratorSlug, row]));
  const results = slugs
    .map((slug) => bySlug.get(slug))
    .filter((row): row is NonNullable<typeof row> => Boolean(row));

  const missing: CompareMissing[] = [];
  for (const slug of slugs) {
    if (bySlug.has(slug)) continue;
    const known = snapshot.accelerators.some((item) => item.slug === slug);
    const inSlice = comparableResults(snapshot, slice.sliceId).some((item) => item.acceleratorSlug === slug);
    if (!known) {
      missing.push({ acceleratorSlug: slug, reason: "unknown-accelerator-slug" });
    } else if (!inSlice) {
      missing.push({
        acceleratorSlug: slug,
        reason: "no-published-result-in-this-exact-slice",
      });
    } else if (view === "derived") {
      missing.push({
        acceleratorSlug: slug,
        reason: "derivation-not-available-for-this-result",
      });
    } else {
      missing.push({ acceleratorSlug: slug, reason: "excluded-by-validity-or-quarantine" });
    }
  }

  const deltas: CompareDelta[] = [];
  const baseline = query.baselineSlug ?? null;
  if (baseline) {
    const baselineRow = bySlug.get(baseline);
    if (!baselineRow) {
      missing.push({
        acceleratorSlug: baseline,
        reason: "baseline-missing-from-this-exact-slice",
      });
    } else {
      for (const row of results) {
        if (row.acceleratorSlug === baseline) continue;
        if (row.unit !== baselineRow.unit || row.metricView !== baselineRow.metricView) continue;
        const absolute = row.value - baselineRow.value;
        deltas.push({
          acceleratorSlug: row.acceleratorSlug,
          baselineSlug: baseline,
          absolute,
          relative: baselineRow.value === 0 ? null : absolute / baselineRow.value,
        });
      }
    }
  }

  return {
    sliceId: slice.sliceId,
    comparability: comparabilityText(slice),
    datasetVersion: snapshot.manifest.datasetVersion,
    sourceCommit: snapshot.manifest.sourceCommit,
    metricView: view,
    baselineSlug: baseline,
    results,
    missing,
    deltas,
    sources: ranked.sources,
  };
}
