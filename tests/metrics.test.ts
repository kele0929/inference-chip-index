import { describe, expect, test } from "bun:test";
import { getMetric, primaryMetricFor, sliceId } from "../lib/metrics";

describe("metrics", () => {
  test("keeps Offline and Server metrics distinct", () => {
    const offline = primaryMetricFor("gpt-oss-120b", "Offline");
    const server = primaryMetricFor("gpt-oss-120b", "Server");
    expect(offline?.id).toBe("tokens_per_second");
    expect(server?.id).toBe("completed_tokens_per_second");
    expect(offline?.canonicalUnit).toBe("tokens/s");
    expect(server?.canonicalUnit).toBe("tokens/s");
    expect(sliceId({
      workload: "gpt-oss-120b",
      scenario: "Offline",
      accuracyTarget: "official-exact-match",
      metricId: "tokens_per_second",
    })).not.toBe(
      sliceId({
        workload: "gpt-oss-120b",
        scenario: "Server",
        accuracyTarget: "official-exact-match",
        metricId: "completed_tokens_per_second",
      }),
    );
  });

  test("derivation is allowed only when the registry says so", () => {
    expect(getMetric("tokens_per_second")?.derivationAllowed).toBe(true);
    expect(getMetric("tokens_per_second")?.upstreamLogKeys).toContain("Tokens per second");
  });
});
