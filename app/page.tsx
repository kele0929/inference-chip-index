import Link from "next/link";
import { datasetStatus, previewChips } from "@/lib/dataset";

export default function HomePage() {
  const status = datasetStatus();
  const preview = previewChips();
  return (
    <div className="mx-auto max-w-6xl px-4 py-12">
      <p className="mono text-[11px] tracking-[0.2em] uppercase text-[var(--muted)]">Workload-specific index</p>
      <h1 className="serif mt-3 max-w-4xl text-5xl leading-[1.05] sm:text-6xl">
        Find the fastest verified inference hardware for your workload
      </h1>
      <p className="mt-6 max-w-3xl text-lg leading-relaxed text-[var(--muted)]">
        That promise is only true inside one exact benchmark slice: the same MLPerf Inference
        release, Closed division, workload, scenario, accuracy target, metric, and unit. A chip that
        leads Llama 3.1 8B Offline is not thereby the fastest chip.
      </p>
      <div className="mt-8 flex flex-wrap gap-3">
        <Link className="bg-[var(--ink)] px-4 py-2 text-sm text-[var(--paper)]" href="/leaderboard">
          Open the leaderboard
        </Link>
        <Link className="border border-[var(--ink)] px-4 py-2 text-sm" href="/methodology">
          Read the methodology
        </Link>
      </div>
      <section className="mt-14 grid gap-4 md:grid-cols-3">
        <article className="border border-[var(--rule)] p-4">
          <h2 className="serif text-xl">Official first</h2>
          <p className="mt-2 text-sm text-[var(--muted)]">
            Rankings use the submitted system result. Per-accelerator values appear only when the
            source states accelerator count and the metric registry allows derivation.
          </p>
        </article>
        <article className="border border-[var(--rule)] p-4">
          <h2 className="serif text-xl">Quarantine over inference</h2>
          <p className="mt-2 text-sm text-[var(--muted)]">
            Names such as x8 or NVL72 never establish count by themselves. Ambiguous identity is
            review-required and excluded from rankings.
          </p>
        </article>
        <article className="border border-[var(--rule)] p-4">
          <h2 className="serif text-xl">Paid agent API</h2>
          <p className="mt-2 text-sm text-[var(--muted)]">
            Status and preview are free. Rank and compare advertise x402 offers on Base Sepolia when
            configured and fail closed when they are not.
          </p>
        </article>
      </section>
      <section className="mt-14">
        <h2 className="serif text-2xl">Verified preview</h2>
        <p className="mt-2 text-sm text-[var(--muted)]">{preview.comparability}</p>
        {preview.rows.length === 0 ? (
          <p className="state mt-4" data-tone="warn">
            No comparable results are published for the default slice.
          </p>
        ) : (
          <div className="table-wrap mt-4">
            <table className="data">
              <thead>
                <tr>
                  <th className="num">Rank</th>
                  <th>Accelerator</th>
                  <th>Vendor</th>
                  <th>Submitter</th>
                  <th className="num">Official value</th>
                  <th>Source</th>
                </tr>
              </thead>
              <tbody>
                {preview.rows.map((row) => (
                  <tr key={row.resultLogicalId}>
                    <td className="num">{row.rank}</td>
                    <td>{row.acceleratorName}</td>
                    <td>{row.vendor}</td>
                    <td>{row.submitter}</td>
                    <td className="num">
                      {row.value.toLocaleString()} {row.unit}
                    </td>
                    <td>
                      <a className="underline" href={row.sources[0]?.url}>
                        {row.sources[0]?.commit.slice(0, 8)}
                      </a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <p className="mt-3 mono text-[11px] text-[var(--muted)]">
          Dataset {status.manifest.datasetVersion} · {status.counts.publishedResults} published results ·{" "}
          {status.counts.quarantinedRecords} quarantined
        </p>
      </section>
    </div>
  );
}
