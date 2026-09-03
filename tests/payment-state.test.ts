import { describe, expect, test } from "bun:test";
import { handlers } from "../lib/agent";

const sliceId = "slice:v6.0:closed:gpt-oss-120b:Offline:official-exact-match:tokens_per_second";

describe("payment state", () => {
  test("free entrypoints work without payment configuration", async () => {
    const status = await handlers.invoke(
      new Request("http://localhost/api/agent/entrypoints/get-dataset-status/invoke", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ input: {} }),
      }),
      { key: "get-dataset-status" },
    );
    expect(status.status).toBe(200);
    const preview = await handlers.invoke(
      new Request("http://localhost/api/agent/entrypoints/preview-inference-chips/invoke", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ input: { sliceId } }),
      }),
      { key: "preview-inference-chips" },
    );
    expect(preview.status).toBe(200);
  });

  test("paid entrypoints fail closed when payment config is absent", async () => {
    const ranked = await handlers.invoke(
      new Request("http://localhost/api/agent/entrypoints/rank-inference-chips/invoke", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          input: { sliceId, metricView: "official", grouping: "all-systems", offset: 0, limit: 5 },
        }),
      }),
      { key: "rank-inference-chips" },
    );
    expect([402, 503]).toContain(ranked.status);
    expect(ranked.status).not.toBe(200);
    const body = await ranked.text();
    expect(body.includes("103961") && ranked.status === 200).toBe(false);
  });
});
