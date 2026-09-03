import { ALLOWED_SCENARIOS, ALLOWED_WORKLOADS } from "@/lib/constants";
import { datasetStatus, loadSnapshot } from "@/lib/dataset";
import { RankError, rankSlice } from "@/lib/ranking";
import type { Grouping, MetricView } from "@/lib/types";

interface Search {
  workload?: string;
  scenario?: string;
  accuracyTarget?: string;
  submitter?: string;
  vendor?: string;
  metricView?: string;
  grouping?: string;
  sliceId?: string;
}

export default async function LeaderboardPage({
  searchParams,
}: {
  searchParams: Promise<Search>;
}) {
  const params = await searchParams;
  const snapshot = loadSnapshot();
  const status = datasetStatus();
  const slices = snapshot.slices;
  const selected =
    params.sliceId && slices.some((slice) => slice.sliceId === params.sliceId)
      ? params.sliceId
      : slices.find((slice) => slice.workload === (params.workload ?? "gpt-oss-120b") && slice.scenario === (params.scenario ?? "Offline"))
          ?.sliceId ?? slices[0]?.sliceId;

  const slice = slices.find((item) => item.sliceId === selected);
  const invalid =
    Boolean(params.workload && !ALLOWED_WORKLOADS.includes(params.workload as (typeof ALLOWED_WORKLOADS)[number])) ||
    Boolean(params.scenario && !ALLOWED_SCENARIOS.includes(params.scenario as (typeof ALLOWED_SCENARIOS)[number])) ||
    Boolean(params.sliceId && !slice);

  let ranked = null;
  let error: string | null = null;
  if (selected && !invalid) {
    try {
      ranked = rankSlice(snapshot, {
        sliceId: selected,
        vendor: params.vendor || undefined,
        metricView: (params.metricView as MetricView) || "official",
        grouping: (params.grouping as Grouping) || "all-systems",
      });
    } catch (caught) {
      error = caught instanceof RankError ? caught.message : "Ranking failed";
    }
  }

  const submitters = [...new Set(snapshot.systems.map((item) => item.submitter))].sort();
  const vendors = [...new Set(snapshot.accelerators.map((item) => item.vendor))].sort();
  const accuracyTargets = [...new Set(slices.map((item) => item.accuracyTarget))].sort();
  const filteredRows =
    ranked?.rows.filter((row) => {
      if (params.submitter && row.submitter !== params.submitter) return false;
      return true;
    }) ?? [];

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <h1 className="serif text-4xl">Leaderboard</h1>
      <p className="mt-3 max-w-3xl text-[var(--muted)]">
        Release is fixed to v6.0 and division to Closed. Changing workload, scenario, accuracy
        target, or metric opens a different comparison — never a combined ranking.
      </p>
      {status.freshnessState === "stale" ? (
        <p className="state mt-4" data-tone="warn">
          Dataset last reviewed {status.manifest.lastReviewedAt} is stale under the {status.manifest.freshnessPolicyDays}-day policy.
        </p>
      ) : null}
      <form className="mt-6 grid gap-3 border border-[var(--rule)] p-4 md:grid-cols-3">
        <label className="text-sm">
          Workload
          <select name="workload" defaultValue={params.workload ?? "gpt-oss-120b"} className="mt-1 w-full border border-[var(--rule)] bg-transparent p-2">
            {ALLOWED_WORKLOADS.map((item) => (
              <option key={item}>{item}</option>
            ))}
          </select>
        </label>
        <label className="text-sm">
          Scenario
          <select name="scenario" defaultValue={params.scenario ?? "Offline"} className="mt-1 w-full border border-[var(--rule)] bg-transparent p-2">
            {ALLOWED_SCENARIOS.map((item) => (
              <option key={item}>{item}</option>
            ))}
          </select>
        </label>
        <label className="text-sm">
          Accuracy target
          <select name="accuracyTarget" defaultValue={params.accuracyTarget ?? ""} className="mt-1 w-full border border-[var(--rule)] bg-transparent p-2">
            <option value="">Any in selected slice</option>
            {accuracyTargets.map((item) => (
              <option key={item}>{item}</option>
            ))}
          </select>
        </label>
        <label className="text-sm">
          Submitter
          <select name="submitter" defaultValue={params.submitter ?? ""} className="mt-1 w-full border border-[var(--rule)] bg-transparent p-2">
            <option value="">All</option>
            {submitters.map((item) => (
              <option key={item}>{item}</option>
            ))}
          </select>
        </label>
        <label className="text-sm">
          Vendor
          <select name="vendor" defaultValue={params.vendor ?? ""} className="mt-1 w-full border border-[var(--rule)] bg-transparent p-2">
            <option value="">All</option>
            {vendors.map((item) => (
              <option key={item}>{item}</option>
            ))}
          </select>
        </label>
        <label className="text-sm">
          Metric view
          <select name="metricView" defaultValue={params.metricView ?? "official"} className="mt-1 w-full border border-[var(--rule)] bg-transparent p-2">
            <option value="official">Official system result</option>
            <option value="derived">Derived per accelerator</option>
          </select>
        </label>
        <label className="text-sm md:col-span-2">
          Grouping
          <select name="grouping" defaultValue={params.grouping ?? "all-systems"} className="mt-1 w-full border border-[var(--rule)] bg-transparent p-2">
            <option value="all-systems">All submitted systems</option>
            <option value="best-per-accelerator">Best per accelerator</option>
          </select>
        </label>
        <div className="flex items-end">
          <button className="bg-[var(--ink)] px-4 py-2 text-sm text-[var(--paper)]" type="submit">
            Apply exact slice
          </button>
        </div>
      </form>

      {invalid ? (
        <p className="state mt-6" data-tone="bad">
          Invalid filters. Workload, scenario, and slice ID must match a published Closed v6.0 slice.
        </p>
      ) : null}
      {error ? (
        <p className="state mt-6" data-tone="bad">
          API error: {error}
        </p>
      ) : null}
      {!invalid && !error && slice ? (
        <>
          <p className="mt-6 text-sm">{slice.comparability}</p>
          <p className="mono mt-2 text-[11px] text-[var(--muted)]">{slice.sliceId}</p>
          {params.metricView === "derived" ? (
            <p className="state mt-4" data-tone="warn">
              Derived per-accelerator values are labelled and never the default ranking. Missing
              counts stay excluded.
            </p>
          ) : null}
          {filteredRows.length === 0 ? (
            <p className="state mt-6" data-tone="warn">
              No comparable results for this exact slice and filter set.
            </p>
          ) : (
            <div className="table-wrap mt-6">
              <table className="data">
                <caption className="sr-only">Exact-slice leaderboard</caption>
                <thead>
                  <tr>
                    <th className="num">Rank</th>
                    <th className="num">Pos</th>
                    <th>Accelerator</th>
                    <th>Family</th>
                    <th>Submitter</th>
                    <th>System</th>
                    <th className="num">Value</th>
                    <th>View</th>
                    <th>Source</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredRows.map((row) => (
                    <tr key={row.resultLogicalId}>
                      <td className="num">{row.rank}{row.tied ? "*" : ""}</td>
                      <td className="num">{row.position}</td>
                      <td>{row.acceleratorName}</td>
                      <td>{row.family}</td>
                      <td>{row.submitter}</td>
                      <td>{row.systemName}</td>
                      <td className="num">
                        {row.value.toLocaleString(undefined, { maximumFractionDigits: 3 })} {row.unit}
                      </td>
                      <td>{row.derivedFromOfficial ? "derived" : "official"}</td>
                      <td>
                        <a className="underline" href={row.sources[0]?.url}>
                          {row.sources[0]?.path.split("/").slice(-2).join("/")}
                        </a>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          {snapshot.quarantine.some((item) => item.reasons.length > 0) ? (
            <p className="state mt-6">
              Partial evidence: {status.counts.quarantinedRecords} records are review-required and
              excluded from this ranking. See the updates page for the quarantine report.
            </p>
          ) : null}
        </>
      ) : null}
    </div>
  );
}
