import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import {
  ALLOWED_SCENARIOS,
  ALLOWED_WORKLOADS,
  DATASET_VERSION,
  DIVISION,
  FRESHNESS_POLICY_DAYS,
  NORMALIZER_VERSION,
  RELEASE,
  SOURCE_COMMIT,
  SOURCE_REPOSITORY,
  type Scenario,
  type Workload,
} from "../lib/constants";
import { freshnessState } from "../lib/freshness";
import { contentVersionId, sha256Bytes, sourceUrl, stableStringify } from "../lib/hash";
import { establishedAcceleratorCount, identityIssues, lookupAlias, parseExplicitCount } from "../lib/identity";
import { accuracyTargetFor, comparabilityText, getMetric, primaryMetricFor } from "../lib/metrics";
import type {
  Accelerator,
  BenchmarkResult,
  ComparisonSlice,
  CoverageCell,
  DatasetManifest,
  DatasetSnapshot,
  QuarantineRecord,
  SourceRef,
  SubmittedSystem,
  Tombstone,
} from "../lib/types";
import { parseAccuracy, parseSummaryLog } from "./parse-log";
import { parseSystemJson } from "./parse-system";
import { isOfficialSystemPath, listFiles, parseOfficialResultPath, readSourceFile } from "./source-walk";
import publication from "../data/registries/publication.json";
import tombstonesJson from "../data/registries/tombstones.json";

export interface PipelineOptions {
  mode: "fixture" | "full-source";
  sourceRoot: string;
  repository?: string;
  commit?: string;
}

interface ResultBundle {
  submitter: string;
  systemId: string;
  workload: Workload;
  scenario: Scenario;
  summary?: { text: string; source: SourceRef };
  measurements?: { source: SourceRef };
  accuracy?: { text: string; source: SourceRef };
}

export async function buildSnapshot(options: PipelineOptions): Promise<DatasetSnapshot> {
  const repository = options.repository ?? SOURCE_REPOSITORY;
  const commit = options.commit ?? SOURCE_COMMIT;
  const files = await listFiles(options.sourceRoot);
  const systems = new Map<string, { system: SubmittedSystem; rawName: string | null }>();
  const accelerators = new Map<string, Accelerator>();
  const bundles = new Map<string, ResultBundle>();
  const quarantine: QuarantineRecord[] = [];

  for (const absolute of files) {
    const source = await readSourceFile(absolute, options.sourceRoot);
    if (isOfficialSystemPath(source.relativePath)) {
      const parsed = parseSystemJson(path.basename(source.relativePath, ".json"), JSON.parse(source.bytes.toString("utf8")));
      const sourceRef = makeSource(repository, commit, source);
      const built = buildSystem(parsed, sourceRef);
      systems.set(`${parsed.submitter}:${parsed.systemId}`, built);
      if (built.system.status === "review-required") {
        quarantine.push({
          logicalId: built.system.logicalId,
          kind: "system",
          reasons: built.system.quarantineReasons,
          sources: built.system.sources,
        });
      } else if (built.system.acceleratorSlug) {
        const alias = lookupAlias(built.rawName ?? "");
        if (alias) {
          const logicalId = `acc:${alias.slug}`;
          const existing = accelerators.get(alias.slug);
          const next: Omit<Accelerator, "contentVersionId"> = {
            logicalId,
            slug: alias.slug,
            displayName: alias.displayName,
            vendor: alias.vendor,
            family: alias.family,
            variant: alias.variant,
            status: "published",
            sources: uniqueRefs([...(existing?.sources ?? []), sourceRef]),
          };
          accelerators.set(alias.slug, { ...next, contentVersionId: contentVersionId(next) });
        }
      }
      continue;
    }

    const resultPath = parseOfficialResultPath(source.relativePath);
    if (!resultPath) continue;
    const key = `${resultPath.submitter}:${resultPath.systemId}:${resultPath.workload}:${resultPath.scenario}`;
    const bundle = bundles.get(key) ?? {
      submitter: resultPath.submitter,
      systemId: resultPath.systemId,
      workload: resultPath.workload,
      scenario: resultPath.scenario,
    };
    const sourceRef = makeSource(repository, commit, source);
    if (resultPath.kind === "summary") bundle.summary = { text: source.bytes.toString("utf8"), source: sourceRef };
    if (resultPath.kind === "measurements") bundle.measurements = { source: sourceRef };
    if (resultPath.kind === "accuracy") bundle.accuracy = { text: source.bytes.toString("utf8"), source: sourceRef };
    bundles.set(key, bundle);
  }

  const results: BenchmarkResult[] = [];
  for (const bundle of [...bundles.values()].sort((a, b) => keyOf(a).localeCompare(keyOf(b)))) {
    const built = buildResult(bundle, systems.get(`${bundle.submitter}:${bundle.systemId}`));
    results.push(built);
    if (built.status === "review-required") {
      quarantine.push({
        logicalId: built.logicalId,
        kind: "result",
        reasons: built.quarantineReasons,
        sources: built.sources,
      });
    }
  }

  const published = results.filter((result) => result.status === "published");
  const slices = buildSlices(published);
  const coverage = buildCoverage(results, systems);
  const tombstones = (tombstonesJson as Tombstone[]).map((item) => ({
    ...item,
    contentVersionId: item.contentVersionId || contentVersionId({ ...item, contentVersionId: undefined }),
  }));

  const changelog = buildChangelog(published, quarantine, slices);
  const manifestBase: Omit<DatasetManifest, "snapshotSha256"> = {
    datasetVersion: DATASET_VERSION,
    release: RELEASE,
    division: DIVISION,
    sourceRepository: repository,
    sourceCommit: commit,
    lastReviewedAt: publication.lastReviewedAt,
    freshnessState: freshnessState(new Date(publication.lastReviewedAt), publication.lastReviewedAt),
    freshnessPolicyDays: FRESHNESS_POLICY_DAYS,
    normalizerVersion: NORMALIZER_VERSION,
    counts: {
      accelerators: accelerators.size,
      systems: systems.size,
      results: results.length,
      slices: slices.length,
      publishedResults: published.length,
      quarantinedRecords: quarantine.length,
      tombstones: tombstones.length,
    },
    sliceIds: slices.map((slice) => slice.sliceId).sort(),
    sources: [
      {
        repository,
        commit,
        path: "closed",
        url: sourceUrl(repository, commit, "closed"),
        sha256: sha256Bytes(`${repository}@${commit}`),
      },
    ],
  };

  const snapshotWithoutHash: DatasetSnapshot = {
    manifest: { ...manifestBase, snapshotSha256: "" },
    accelerators: [...accelerators.values()].sort((a, b) => a.slug.localeCompare(b.slug)),
    systems: [...systems.values()].map((item) => item.system).sort((a, b) => a.logicalId.localeCompare(b.logicalId)),
    results: results.sort((a, b) => a.logicalId.localeCompare(b.logicalId)),
    slices: slices.sort((a, b) => a.sliceId.localeCompare(b.sliceId)),
    tombstones,
    quarantine: quarantine.sort((a, b) => a.logicalId.localeCompare(b.logicalId)),
    coverage,
    changelog,
  };
  const snapshotSha256 = sha256Bytes(stableStringify({ ...snapshotWithoutHash, manifest: manifestBase }));
  return {
    ...snapshotWithoutHash,
    manifest: { ...manifestBase, snapshotSha256 },
  };
}

function makeSource(repository: string, commit: string, file: { relativePath: string; sha256: string }): SourceRef {
  return {
    repository,
    commit,
    path: file.relativePath,
    url: sourceUrl(repository, commit, file.relativePath),
    sha256: file.sha256,
  };
}

function buildSystem(
  parsed: ReturnType<typeof parseSystemJson>,
  source: SourceRef,
): { system: SubmittedSystem; rawName: string | null } {
  const reasons = identityIssues({
    modelName: parsed.acceleratorModelName,
    acceleratorsPerNode: parsed.acceleratorsPerNode,
    numberOfNodes: parsed.numberOfNodes,
  });
  if (parsed.division && parsed.division !== DIVISION) {
    reasons.push("division-not-closed");
  }
  const alias = typeof parsed.acceleratorModelName === "string" ? lookupAlias(parsed.acceleratorModelName) : undefined;
  const count = establishedAcceleratorCount({
    acceleratorsPerNode: parsed.acceleratorsPerNode,
    numberOfNodes: parsed.numberOfNodes,
  });
  const draft: Omit<SubmittedSystem, "contentVersionId"> = {
    logicalId: `sys:${parsed.submitter}:${parsed.systemId}`,
    submitter: parsed.submitter,
    systemId: parsed.systemId,
    systemName: parsed.systemName,
    acceleratorSlug: reasons.length ? null : (alias?.slug ?? null),
    acceleratorCount: reasons.includes("accelerator-count-not-established") || reasons.includes("node-count-not-established")
      ? null
      : count,
    acceleratorsPerNode: parseExplicitCount(parsed.acceleratorsPerNode),
    nodeCount: parseExplicitCount(parsed.numberOfNodes),
    hostProcessor: parsed.hostProcessor,
    framework: parsed.framework,
    systemType: parsed.systemType,
    status: reasons.length ? "review-required" : "published",
    quarantineReasons: reasons,
    sources: [source],
  };
  return {
    rawName: typeof parsed.acceleratorModelName === "string" ? parsed.acceleratorModelName : null,
    system: { ...draft, contentVersionId: contentVersionId(draft) },
  };
}

function buildResult(
  bundle: ResultBundle,
  system: { system: SubmittedSystem; rawName: string | null } | undefined,
): BenchmarkResult {
  const sources = [bundle.summary?.source, bundle.measurements?.source, bundle.accuracy?.source].filter(
    (item): item is SourceRef => Boolean(item),
  );
  const reasons: string[] = [];
  if (!bundle.summary) reasons.push("missing-official-summary");
  if (!system) reasons.push("missing-matching-system");
  if (system && system.system.status === "review-required") {
    reasons.push(...system.system.quarantineReasons.map((reason) => `system:${reason}`));
  }

  const metric = primaryMetricFor(bundle.workload, bundle.scenario);
  if (!metric) reasons.push("unknown-metric-for-slice");

  let officialValue: number | null = null;
  let valid = false;
  if (bundle.summary && metric) {
    const parsed = parseSummaryLog(bundle.summary.text);
    valid = parsed.resultIsValid;
    if (!valid) reasons.push("mlperf-result-not-valid");
    for (const requirement of metric.validityRequirements) {
      if (requirement.startsWith("Result is")) continue;
      const [flag] = requirement.split(" : ");
      if (flag && parsed.validityFlags[flag] === false) reasons.push(`validity-flag-failed:${flag}`);
    }
    for (const key of metric.upstreamLogKeys) {
      const value = parsed.metrics[key];
      if (value === undefined) reasons.push(`missing-log-key:${key}`);
      else officialValue = value;
    }
    reasons.push(...parsed.unknownUnits);
    if (officialValue !== null && !Number.isFinite(officialValue)) {
      reasons.push("invalid-number");
    }
  }

  const accuracy = bundle.accuracy ? parseAccuracy(bundle.accuracy.text) : null;
  const accuracyTarget = accuracyTargetFor(bundle.workload);
  const derived =
    metric?.derivationAllowed &&
    officialValue !== null &&
    system?.system.acceleratorCount &&
    system.system.acceleratorCount > 0
      ? officialValue / system.system.acceleratorCount
      : null;

  const draft: Omit<BenchmarkResult, "contentVersionId"> = {
    logicalId: `res:${bundle.submitter}:${bundle.systemId}:${bundle.workload}:${bundle.scenario}:${metric?.id ?? "unknown"}`,
    systemLogicalId: system?.system.logicalId ?? `sys:${bundle.submitter}:${bundle.systemId}`,
    acceleratorSlug: system?.system.acceleratorSlug ?? null,
    submitter: bundle.submitter,
    vendor: system?.system.acceleratorSlug
      ? lookupAlias(system.rawName ?? "")?.vendor ?? null
      : null,
    workload: bundle.workload,
    scenario: bundle.scenario,
    accuracyTarget,
    metricId: metric?.id ?? "unknown",
    unit: metric?.canonicalUnit ?? "unknown",
    officialValue: officialValue ?? Number.NaN,
    derivedPerAccelerator: derived,
    accuracyValue: accuracy?.value ?? null,
    accuracyUnit: accuracy?.unit ?? null,
    valid,
    status: reasons.length || officialValue === null || !valid ? "review-required" : "published",
    quarantineReasons: reasons,
    sources,
  };
  if (!Number.isFinite(draft.officialValue)) {
    draft.status = "review-required";
    if (!draft.quarantineReasons.includes("invalid-number") && officialValue === null) {
      draft.quarantineReasons.push("official-metric-missing");
    }
    draft.officialValue = 0;
  }
  return { ...draft, contentVersionId: contentVersionId(draft) };
}

function buildSlices(results: BenchmarkResult[]): ComparisonSlice[] {
  const groups = new Map<string, BenchmarkResult[]>();
  for (const result of results) {
    const id = `slice:${RELEASE}:${DIVISION}:${result.workload}:${result.scenario}:${result.accuracyTarget}:${result.metricId}`;
    const list = groups.get(id) ?? [];
    list.push(result);
    groups.set(id, list);
  }
  return [...groups.entries()].map(([id, group]) => {
    const first = group[0];
    const metric = getMetric(first.metricId);
    const draft: Omit<ComparisonSlice, "contentVersionId"> = {
      logicalId: id,
      sliceId: id,
      release: RELEASE,
      division: DIVISION,
      workload: first.workload,
      scenario: first.scenario,
      accuracyTarget: first.accuracyTarget,
      metricId: first.metricId,
      unit: first.unit,
      winningDirection: metric?.winningDirection ?? "higher",
      comparability: comparabilityText(first),
      resultLogicalIds: group.map((item) => item.logicalId).sort(),
      sources: uniqueRefs(group.flatMap((item) => item.sources)),
    };
    return { ...draft, contentVersionId: contentVersionId(draft) };
  });
}

function buildCoverage(
  results: BenchmarkResult[],
  systems: Map<string, { system: SubmittedSystem; rawName: string | null }>,
): CoverageCell[] {
  const cells = new Map<string, CoverageCell>();
  const vendors = ["NVIDIA", "AMD", "Intel"];
  for (const vendor of vendors) {
    const families = new Set<string>();
    for (const { system, rawName } of systems.values()) {
      const alias = lookupAlias(rawName ?? "");
      if (alias?.vendor === vendor) families.add(alias.family);
    }
    if (families.size === 0) families.add("none");
    for (const family of families) {
      for (const workload of ALLOWED_WORKLOADS) {
        for (const scenario of ALLOWED_SCENARIOS) {
          const matching = results.filter((result) => {
            const system = systems.get(`${result.submitter}:${result.systemLogicalId.split(":")[2]}`);
            const alias = lookupAlias(system?.rawName ?? "");
            return result.workload === workload && result.scenario === scenario && alias?.vendor === vendor && alias.family === family;
          });
          const notes: string[] = [];
          if (matching.length === 0) notes.push("no-allowlisted-official-results");
          cells.set(`${vendor}:${family}:${workload}:${scenario}`, {
            vendor,
            family,
            workload,
            scenario,
            publishedResults: matching.filter((item) => item.status === "published").length,
            quarantinedResults: matching.filter((item) => item.status === "review-required").length,
            notes,
          });
        }
      }
    }
  }
  return [...cells.values()].sort((a, b) =>
    `${a.vendor}:${a.family}:${a.workload}:${a.scenario}`.localeCompare(`${b.vendor}:${b.family}:${b.workload}:${b.scenario}`),
  );
}

function buildChangelog(
  results: BenchmarkResult[],
  quarantine: QuarantineRecord[],
  slices: ComparisonSlice[],
): string {
  const vendors = new Set(results.map((item) => item.vendor).filter(Boolean));
  return [
    `# Dataset changelog ${DATASET_VERSION}`,
    "",
    `- Pinned source: ${SOURCE_REPOSITORY}/commit/${SOURCE_COMMIT}`,
    `- Published official results: ${results.length}`,
    `- Comparison slices: ${slices.length}`,
    `- Quarantined records: ${quarantine.length}`,
    `- Vendors with published results: ${[...vendors].sort().join(", ") || "none"}`,
    "",
    "V1 publishes only Closed-division llama3.1-8b, gpt-oss-120b, and deepseek-r1 results that pass MLPerf validity checks and the checked-in metric registry. Ambiguous accelerator identity or count is excluded from rankings.",
    "",
  ].join("\n");
}

function uniqueRefs(refs: SourceRef[]): SourceRef[] {
  const seen = new Set<string>();
  const out: SourceRef[] = [];
  for (const ref of refs) {
    const key = `${ref.path}:${ref.sha256}`;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(ref);
  }
  return out;
}

function keyOf(bundle: ResultBundle): string {
  return `${bundle.submitter}:${bundle.systemId}:${bundle.workload}:${bundle.scenario}`;
}

export async function writeGenerated(snapshot: DatasetSnapshot, directory: string): Promise<void> {
  await mkdir(directory, { recursive: true });
  const snapshotText = `${stableStringify(snapshot)}\n`;
  const snapshotSha = sha256Bytes(snapshotText);
  await writeFile(path.join(directory, "snapshot.json"), snapshotText);
  await writeFile(path.join(directory, "snapshot.sha256"), `${snapshotSha}\n`);
  await writeFile(path.join(directory, "manifest.json"), `${stableStringify(snapshot.manifest)}\n`);
  await writeFile(path.join(directory, "coverage_matrix.json"), `${stableStringify(snapshot.coverage)}\n`);
  await writeFile(path.join(directory, "quarantine_report.json"), `${stableStringify(snapshot.quarantine)}\n`);
  await writeFile(path.join(directory, "changelog.md"), snapshot.changelog.endsWith("\n") ? snapshot.changelog : `${snapshot.changelog}\n`);
}

export async function assertUnchanged(snapshot: DatasetSnapshot, directory: string): Promise<void> {
  const expected = (await readFile(path.join(directory, "snapshot.sha256"), "utf8")).trim();
  const actual = sha256Bytes(`${stableStringify(snapshot)}\n`);
  if (expected !== actual) {
    throw new Error(`Generated snapshot hash mismatch in ${directory}: expected ${expected}, got ${actual}`);
  }
}
