import snapshot from "../../data/generated/v1/snapshot.json";

export default function UpdatesPage() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-10">
      <h1 className="serif text-4xl">Updates</h1>
      <p className="mt-3 text-[var(--muted)]">
        Dataset {snapshot.manifest.datasetVersion} is immutable. Promotion happens only after a complete
        candidate passes validation. Automated publication is out of scope.
      </p>
      <section className="mt-8">
        <h2 className="serif text-2xl">Manifest</h2>
        <pre className="mt-3 overflow-x-auto border border-[var(--rule)] bg-[#efe8d8] p-3 text-xs">
          {JSON.stringify(snapshot.manifest, null, 2)}
        </pre>
      </section>
      <section className="mt-8">
        <h2 className="serif text-2xl">Changelog</h2>
        <pre className="mt-3 whitespace-pre-wrap border border-[var(--rule)] bg-[#efe8d8] p-3 text-sm">{snapshot.changelog}</pre>
      </section>
      <section className="mt-8">
        <h2 className="serif text-2xl">Coverage matrix</h2>
        <div className="table-wrap mt-4">
          <table className="data">
            <thead>
              <tr>
                <th>Vendor</th>
                <th>Family</th>
                <th>Workload</th>
                <th>Scenario</th>
                <th className="num">Published</th>
                <th className="num">Quarantined</th>
                <th>Notes</th>
              </tr>
            </thead>
            <tbody>
              {snapshot.coverage.map((cell) => (
                <tr key={`${cell.vendor}-${cell.family}-${cell.workload}-${cell.scenario}`}>
                  <td>{cell.vendor}</td>
                  <td>{cell.family}</td>
                  <td>{cell.workload}</td>
                  <td>{cell.scenario}</td>
                  <td className="num">{cell.publishedResults}</td>
                  <td className="num">{cell.quarantinedResults}</td>
                  <td>{cell.notes.join("; ")}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
      <section className="mt-8">
        <h2 className="serif text-2xl">Quarantine report</h2>
        <p className="mt-2 text-sm text-[var(--muted)]">{snapshot.quarantine.length} review-required records.</p>
        <div className="table-wrap mt-4">
          <table className="data">
            <thead>
              <tr>
                <th>ID</th>
                <th>Kind</th>
                <th>Reasons</th>
              </tr>
            </thead>
            <tbody>
              {snapshot.quarantine.slice(0, 40).map((item) => (
                <tr key={item.logicalId}>
                  <td className="mono text-[11px]">{item.logicalId}</td>
                  <td>{item.kind}</td>
                  <td>{item.reasons.join(", ")}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
