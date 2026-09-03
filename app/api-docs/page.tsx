import { COMPARE_PRICE, RANK_PRICE } from "@/lib/constants";
import { datasetStatus } from "@/lib/dataset";

const exampleStatus = `{
  "input": {}
}`;

const exampleRank = `{
  "input": {
    "sliceId": "slice:v6.0:closed:gpt-oss-120b:Offline:official-exact-match:tokens_per_second",
    "metricView": "official",
    "grouping": "all-systems",
    "offset": 0,
    "limit": 25
  }
}`;

export default function ApiPage() {
  const status = datasetStatus();
  const defaultSlice = status.sliceIds.find((id) => id.includes("gpt-oss-120b:Offline")) ?? status.sliceIds[0];
  return (
    <div className="mx-auto max-w-4xl px-4 py-10">
      <h1 className="serif text-4xl">Lucid Agents API</h1>
      <p className="mt-3 text-[var(--muted)]">
        One server-only Lucid runtime is mounted at <code>/api/agent</code>. Next.js routes delegate
        to <code>runtime.http.handlers</code>. There is no second payment layer.
      </p>
      <section className="mt-8">
        <h2 className="serif text-2xl">Entrypoints</h2>
        <div className="table-wrap mt-4">
          <table className="data">
            <thead>
              <tr>
                <th>Key</th>
                <th>Price</th>
                <th>Input</th>
                <th>Output</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>get-dataset-status</td>
                <td>free</td>
                <td>empty object</td>
                <td>manifest, freshness, counts, slice IDs, source links</td>
              </tr>
              <tr>
                <td>preview-inference-chips</td>
                <td>free</td>
                <td>optional sliceId</td>
                <td>up to five verified rows</td>
              </tr>
              <tr>
                <td>rank-inference-chips</td>
                <td>${RANK_PRICE}</td>
                <td>required sliceId, vendor, metricView, grouping, pagination</td>
                <td>ranked rows, comparability, sources; max &lt; 1 MiB</td>
              </tr>
              <tr>
                <td>compare-inference-chips</td>
                <td>${COMPARE_PRICE}</td>
                <td>sliceId + 2–8 slugs, optional baseline</td>
                <td>results, missing-evidence reasons, matching-unit deltas</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>
      <section className="mt-8">
        <h2 className="serif text-2xl">Errors</h2>
        <ul className="mt-3 list-disc space-y-2 pl-5 text-sm">
          <li>Invalid input: Lucid schema error from the entrypoint Zod contract.</li>
          <li>Unknown or incompatible slice: <code>invalid_filters</code>.</li>
          <li>Paid invoke without payment configuration: fail closed (402 or 503), never a free 200.</li>
          <li>Paid invoke with Base Sepolia configured: x402 <code>PAYMENT-REQUIRED</code> offer.</li>
        </ul>
      </section>
      <section className="mt-8">
        <h2 className="serif text-2xl">Discovery, payment, invocation</h2>
        <ol className="mt-3 list-decimal space-y-2 pl-5 text-sm">
          <li>GET <code>/api/agent/.well-known/agent-card.json</code> for the Agent Card.</li>
          <li>GET <code>/api/agent/entrypoints</code> for schemas that match handler outputs.</li>
          <li>POST free <code>/api/agent/entrypoints/get-dataset-status/invoke</code>.</li>
          <li>POST paid rank/compare. Without payment config the runtime fails closed. With config, complete the x402 exact payment on Base Sepolia (<code>eip155:84532</code>) and retry with the payment header.</li>
          <li>POST <code>/stream</code> is mounted; V1 entrypoints do not stream a custom sequence.</li>
        </ol>
      </section>
      <section className="mt-8">
        <h2 className="serif text-2xl">Copyable requests</h2>
        <pre className="mt-3 overflow-x-auto border border-[var(--rule)] bg-[#efe8d8] p-3 text-xs">{`curl -sS http://localhost:3000/api/agent/health
curl -sS http://localhost:3000/api/agent/entrypoints
curl -sS -X POST http://localhost:3000/api/agent/entrypoints/get-dataset-status/invoke \\
  -H 'content-type: application/json' -d '${exampleStatus}'
curl -sS -X POST http://localhost:3000/api/agent/entrypoints/preview-inference-chips/invoke \\
  -H 'content-type: application/json' \\
  -d '{"input":{"sliceId":"${defaultSlice ?? "slice:v6.0:closed:gpt-oss-120b:Offline:official-exact-match:tokens_per_second"}"}}'
curl -i -X POST http://localhost:3000/api/agent/entrypoints/rank-inference-chips/invoke \\
  -H 'content-type: application/json' -d '${exampleRank}'`}</pre>
      </section>
      <section className="mt-8 grid gap-3">
        <div className="state" data-tone="warn">
          Payment required: a priced invoke without an x402 proof returns a challenge, not ranking rows.
        </div>
        <div className="state" data-tone="bad">
          API error: invalid slice IDs and incompatible filters do not produce a mixed ranking.
        </div>
        <div className="state" data-tone="ok">
          Paid success: after settlement the handler returns typed rank/compare JSON plus dataset version and source links.
        </div>
        <div className="state">Loading: discovery and invoke routes are dynamic and uncached.</div>
      </section>
    </div>
  );
}
