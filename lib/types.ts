import type { Scenario, Workload } from "./constants";

export type WinningDirection = "higher" | "lower";
export type MetricView = "official" | "derived";
export type Grouping = "all-systems" | "best-per-accelerator";
export type FreshnessState = "fresh" | "stale";
export type RecordStatus = "published" | "review-required" | "tombstoned";

export interface SourceRef {
  repository: string;
  commit: string;
  path: string;
  url: string;
  sha256: string;
}

export interface PublishedIds {
  logicalId: string;
  contentVersionId: string;
}

export interface Accelerator extends PublishedIds {
  slug: string;
  displayName: string;
  vendor: string;
  family: string;
  variant: string | null;
  status: RecordStatus;
  sources: SourceRef[];
}

export interface SubmittedSystem extends PublishedIds {
  submitter: string;
  systemId: string;
  systemName: string;
  acceleratorSlug: string | null;
  acceleratorCount: number | null;
  acceleratorsPerNode: number | null;
  nodeCount: number | null;
  hostProcessor: string | null;
  framework: string | null;
  systemType: string | null;
  status: RecordStatus;
  quarantineReasons: string[];
  sources: SourceRef[];
}

export interface BenchmarkResult extends PublishedIds {
  systemLogicalId: string;
  acceleratorSlug: string | null;
  submitter: string;
  vendor: string | null;
  workload: Workload;
  scenario: Scenario;
  accuracyTarget: string;
  metricId: string;
  unit: string;
  officialValue: number;
  derivedPerAccelerator: number | null;
  accuracyValue: number | null;
  accuracyUnit: string | null;
  valid: boolean;
  status: RecordStatus;
  quarantineReasons: string[];
  sources: SourceRef[];
}

export interface ComparisonSlice extends PublishedIds {
  sliceId: string;
  release: string;
  division: string;
  workload: Workload;
  scenario: Scenario;
  accuracyTarget: string;
  metricId: string;
  unit: string;
  winningDirection: WinningDirection;
  comparability: string;
  resultLogicalIds: string[];
  sources: SourceRef[];
}

export interface Tombstone extends PublishedIds {
  removedLogicalId: string;
  reason: string;
  removedAt: string;
  sources: SourceRef[];
}

export interface DatasetManifest {
  datasetVersion: string;
  release: string;
  division: string;
  sourceRepository: string;
  sourceCommit: string;
  lastReviewedAt: string;
  freshnessState: FreshnessState;
  freshnessPolicyDays: number;
  normalizerVersion: string;
  snapshotSha256: string;
  counts: {
    accelerators: number;
    systems: number;
    results: number;
    slices: number;
    publishedResults: number;
    quarantinedRecords: number;
    tombstones: number;
  };
  sliceIds: string[];
  sources: SourceRef[];
}

export interface QuarantineRecord {
  logicalId: string;
  kind: "accelerator" | "system" | "result";
  reasons: string[];
  sources: SourceRef[];
}

export interface CoverageCell {
  vendor: string;
  family: string;
  workload: Workload;
  scenario: Scenario;
  publishedResults: number;
  quarantinedResults: number;
  notes: string[];
}

export interface DatasetSnapshot {
  manifest: DatasetManifest;
  accelerators: Accelerator[];
  systems: SubmittedSystem[];
  results: BenchmarkResult[];
  slices: ComparisonSlice[];
  tombstones: Tombstone[];
  quarantine: QuarantineRecord[];
  coverage: CoverageCell[];
  changelog: string;
}

export interface RankedRow {
  rank: number;
  position: number;
  tied: boolean;
  metricView: MetricView;
  value: number;
  unit: string;
  acceleratorSlug: string;
  acceleratorName: string;
  vendor: string;
  family: string;
  submitter: string;
  systemName: string;
  systemLogicalId: string;
  resultLogicalId: string;
  acceleratorCount: number | null;
  derivedFromOfficial: boolean;
  sources: SourceRef[];
}

export interface RankResponse {
  sliceId: string;
  comparability: string;
  datasetVersion: string;
  sourceCommit: string;
  metricView: MetricView;
  grouping: Grouping;
  total: number;
  offset: number;
  limit: number;
  rows: RankedRow[];
  sources: SourceRef[];
}

export interface CompareMissing {
  acceleratorSlug: string;
  reason: string;
}

export interface CompareDelta {
  acceleratorSlug: string;
  baselineSlug: string;
  absolute: number;
  relative: number | null;
}

export interface CompareResponse {
  sliceId: string;
  comparability: string;
  datasetVersion: string;
  sourceCommit: string;
  metricView: MetricView;
  baselineSlug: string | null;
  results: RankedRow[];
  missing: CompareMissing[];
  deltas: CompareDelta[];
  sources: SourceRef[];
}

export interface DatasetStatusResponse {
  manifest: DatasetManifest;
  freshnessState: FreshnessState;
  sourceCommit: string;
  counts: DatasetManifest["counts"];
  sliceIds: string[];
  sources: SourceRef[];
}

export interface PreviewResponse {
  sliceId: string | null;
  comparability: string;
  datasetVersion: string;
  sourceCommit: string;
  rows: RankedRow[];
  sources: SourceRef[];
}
