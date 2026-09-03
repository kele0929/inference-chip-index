import { describe, expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { handlers } from "../lib/agent";

const routes = [
  "app/api/agent/health/route.ts",
  "app/api/agent/entrypoints/route.ts",
  "app/api/agent/entrypoints/[key]/invoke/route.ts",
  "app/api/agent/entrypoints/[key]/stream/route.ts",
  "app/api/agent/.well-known/agent-card.json/route.ts",
  "app/api/agent/.well-known/agent.json/route.ts",
  "app/api/agent/.well-known/oasf-record.json/route.ts",
];

describe("route smoke", () => {
  test("Next.js modules only delegate to runtime.http.handlers", () => {
    for (const file of routes) {
      const source = readFileSync(file, "utf8");
      expect(source).toContain("from \"@/lib/agent\"");
      expect(source).toContain("handlers.");
      expect(source).not.toContain("x402-express");
      expect(source).not.toContain("new Map");
    }
  });

  test("health, entrypoints, and discovery resolve", async () => {
    const health = await handlers.health(new Request("http://localhost/api/agent/health"));
    expect(health.status).toBe(200);
    const entrypoints = await handlers.entrypoints(new Request("http://localhost/api/agent/entrypoints"));
    expect(entrypoints.status).toBe(200);
    const listed = (await entrypoints.json()) as { entrypoints?: Array<{ key: string; output?: unknown }> };
    const keys = (listed.entrypoints ?? (listed as { items?: Array<{ key: string }> }).items ?? []).map(
      (item) => item.key,
    );
    const raw = JSON.stringify(listed);
    expect(raw).toContain("get-dataset-status");
    expect(raw).toContain("rank-inference-chips");
    void keys;
    const card = await handlers.manifest(new Request("http://localhost/api/agent/.well-known/agent-card.json"));
    expect(card.status).toBe(200);
    const oasf = await handlers.oasf(new Request("http://localhost/api/agent/.well-known/oasf-record.json"));
    // V1 does not install the identity extension; Lucid still mounts OASF and
    // returns its own not-found contract instead of a hand-rolled document.
    expect([200, 404]).toContain(oasf.status);
    const oasfBody = await oasf.json();
    expect(oasfBody).toBeTruthy();
  });
});
