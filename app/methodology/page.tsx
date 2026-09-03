export default function MethodologyPage() {
  return (
    <article className="mx-auto max-w-3xl px-4 py-10 leading-relaxed">
      <h1 className="serif text-4xl">Methodology</h1>
      <p className="mt-4 text-[var(--muted)]">
        This index republishes official MLPerf Inference v6.0 Closed results. It does not benchmark
        hardware and it does not invent missing numbers.
      </p>
      <h2 className="serif mt-10 text-2xl">Systems versus chips</h2>
      <p className="mt-3">
        An MLPerf submission is a submitted system: host, software stack, and one or more
        accelerators. The official primary metric is the system result recorded in
        <code> performance/run_1/mlperf_log_summary.txt</code>. A chip ranking is a derived view
        and is shown only when <code>accelerators_per_node</code> and <code>number_of_nodes</code>
        are explicit numeric fields. Tokens such as <code>x8</code> or <code>NVL72</code> in a name
        are never used as a count.
      </p>
      <h2 className="serif mt-10 text-2xl">Official versus derived</h2>
      <p className="mt-3">
        Official is the default. Derived per-accelerator values divide the official metric by the
        established accelerator count, and only for metrics whose registry entry allows derivation.
        Derived rows stay labelled. They are never mixed into an official ranking.
      </p>
      <h2 className="serif mt-10 text-2xl">Scenarios and accuracy targets</h2>
      <p className="mt-3">
        Offline, Server, and Interactive are different slices even when a log file prints
        <code> Scenario : Server</code> inside an Interactive directory. The submission path is the
        scenario. Accuracy targets are the official Closed defaults for each workload:
        <code> official-rouge</code> for llama3.1-8b, <code> official-exact-match</code> for
        gpt-oss-120b, and <code> official-default</code> for deepseek-r1.
      </p>
      <h2 className="serif mt-10 text-2xl">Comparability limits</h2>
      <ul className="mt-3 list-disc space-y-2 pl-5">
        <li>Release, division, workload, scenario, accuracy target, metric, and unit must match.</li>
        <li>Open, Network, edge, vision, speech, training, and vendor-marketing claims are out of scope.</li>
        <li>Ambiguous identity, topology, partitioning, count, metric, unit, or validity is quarantined.</li>
        <li>No page on this site claims that one accelerator is universally fastest.</li>
      </ul>
    </article>
  );
}
