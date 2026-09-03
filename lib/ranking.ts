import { MAX_PAGE_LIMIT } from "./constants";
import { comparabilityText } from "./metrics";
import type {
  BenchmarkResult,
  ComparisonSlice,
  DatasetSnapshot,
  Grouping,
  MetricView,
  RankResponse,
  RankedRow,
} from "./types";

export interface RankQuery {
  sliceId: string;
  metricView?: MetricView;
  grouping?: Grouping;
  vendor?: string;
  offset?: number;
  limit?: number;
}

export class RankError extends Error {
  readonly code: string;

  constructor(code: string, message: string) {
    super(message);
    this.code = code;
  }
}

function valueOf(result: BenchmarkResult, view: MetricView): number | null {
  if (view === "official") return result.officialValue;
  return result.derivedPerAccelerator;
}

export function comparableResults(snapshot: DatasetSnapshot, sliceId: string): BenchmarkResult[] {
  const slice = snapshot.slices.find((item) => item.sliceId === sliceId);
  if (!slice) return [];
  const allowed = new Set(slice.resultLogicalIds);
  return snapshot.results.filter(
    (result) =>
      allowed.has(result.logicalId) &&
      result.status === "published" &&
      result.valid &&
      result.metricId === slice.metricId &&
      result.unit === slice.unit &&
      result.workload === slice.workload &&
      result.scenario === slice.scenario &&
      result.accuracyTarget === slice.accuracyTarget,
  );
}

function decorate(
  snapshot: DatasetSnapshot,
  result: BenchmarkResult,
  view: MetricView,
  value: number,
): Omit<RankedRow, "rank" | "position" | "tied"> {
  const system = snapshot.systems.find((item) => item.logicalId === result.systemLogicalId);
  const accelerator = snapshot.accelerators.find((item) => item.slug === result.acceleratorSlug);
  return {
    metricView: view,
    value,
    unit: result.unit,
    acceleratorSlug: result.acceleratorSlug ?? "unknown",
    acceleratorName: accelerator?.displayName ?? result.acceleratorSlug ?? "unknown",
    vendor: result.vendor ?? accelerator?.vendor ?? "unknown",
    family: accelerator?.family ?? "unknown",
    submitter: result.submitter,
    systemName: system?.systemName ?? result.systemLogicalId,
    systemLogicalId: result.systemLogicalId,
    resultLogicalId: result.logicalId,
    acceleratorCount: system?.acceleratorCount ?? null,
    derivedFromOfficial: view === "derived",
    sources: result.sources,
  };
}

export function rankSlice(snapshot: DatasetSnapshot, query: RankQuery): RankResponse {
  const slice = snapshot.slices.find((item) => item.sliceId === query.sliceId);
  if (!slice) {
    throw new RankError("invalid_filters", `Unknown comparison slice: ${query.sliceId}`);
  }

  const view = query.metricView ?? "official";
  const grouping = query.grouping ?? "all-systems";
  const offset = query.offset ?? 0;
  const limit = query.limit ?? 25;
  if (!Number.isInteger(offset) || offset < 0) {
    throw new RankError("invalid_filters", "offset must be a non-negative integer");
  }
  if (!Number.isInteger(limit) || limit < 1 || limit > MAX_PAGE_LIMIT) {
    throw new RankError("invalid_filters", `limit must be an integer between 1 and ${MAX_PAGE_LIMIT}`);
  }

  const winning = snapshot.slices.find((item) => item.sliceId === query.sliceId)?.winningDirection ?? "higher";
  let rows = comparableResults(snapshot, slice.sliceId)
    .map((result) => {
      const value = valueOf(result, view);
      if (value === null || !Number.isFinite(value)) return null;
      return decorate(snapshot, result, view, value);
    })
    .filter((row): row is Omit<RankedRow, "rank" | "position" | "tied"> => row !== null);

  if (query.vendor) {
    rows = rows.filter((row) => row.vendor.toLowerCase() === query.vendor!.toLowerCase());
  }

  if (grouping === "best-per-accelerator") {
    const best = new Map<string, (typeof rows)[number]>();
    for (const row of rows) {
      const current = best.get(row.acceleratorSlug);
      if (!current || better(row.value, current.value, winning)) {
        best.set(row.acceleratorSlug, row);
      }
    }
    rows = [...best.values()];
  }

  rows.sort((a, b) => {
    if (a.value !== b.value) return better(a.value, b.value, winning) ? -1 : 1;
    return a.resultLogicalId.localeCompare(b.resultLogicalId);
  });

  const ranked = assignRanks(rows, winning);
  const page = ranked.slice(offset, offset + limit);

  return {
    sliceId: slice.sliceId,
    comparability: comparabilityText(slice),
    datasetVersion: snapshot.manifest.datasetVersion,
    sourceCommit: snapshot.manifest.sourceCommit,
    metricView: view,
    grouping,
    total: ranked.length,
    offset,
    limit,
    rows: page,
    sources: uniqueSources(slice, snapshot, page),
  };
}

function better(a: number, b: number, direction: ComparisonSlice["winningDirection"]): boolean {
  return direction === "lower" ? a < b : a > b;
}

function assignRanks(
  rows: Array<Omit<RankedRow, "rank" | "position" | "tied">>,
  direction: ComparisonSlice["winningDirection"],
): RankedRow[] {
  const out: RankedRow[] = [];
  let nextRank = 1;
  for (let index = 0; index < rows.length; index += 1) {
    const current = rows[index];
    if (index > 0 && rows[index - 1].value === current.value) {
      const previous = out[index - 1];
      previous.tied = true;
      out.push({ ...current, rank: previous.rank, position: index + 1, tied: true });
    } else {
      nextRank = index + 1;
      out.push({ ...current, rank: nextRank, position: index + 1, tied: false });
    }
    void direction;
  }
  return out;
}

function uniqueSources(
  slice: ComparisonSlice,
  snapshot: DatasetSnapshot,
  rows: RankedRow[],
): RankResponse["sources"] {
  const seen = new Set<string>();
  const sources = [...slice.sources];
  for (const row of rows) {
    for (const source of row.sources) {
      if (!seen.has(source.sha256)) {
        seen.add(source.sha256);
        sources.push(source);
      }
    }
  }
  for (const source of snapshot.manifest.sources) {
    if (!seen.has(source.sha256)) {
      seen.add(source.sha256);
      sources.push(source);
    }
  }
  return sources;
}
