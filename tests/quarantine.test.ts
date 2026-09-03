import { describe, expect, test } from "bun:test";
import { buildSnapshot } from "../pipeline/generate";

describe("quarantine", () => {
  test("fixture pack quarantines the authored ambiguous accelerator and keeps vendor accepted cases", async () => {
    const snapshot = await buildSnapshot({
      mode: "fixture",
      sourceRoot: "data/fixtures/pack",
    });
    const mystery = snapshot.systems.find((item) => item.systemId === "mystery-accel-x8");
    expect(mystery?.status).toBe("review-required");
    expect(mystery?.quarantineReasons).toContain("accelerator-count-not-established");
    expect(snapshot.results.some((item) => item.submitter === "FIXTURE" && item.status === "published")).toBe(false);

    const vendors = new Set(
      snapshot.results.filter((item) => item.status === "published").map((item) => item.vendor),
    );
    expect(vendors.has("NVIDIA")).toBe(true);
    expect(vendors.has("AMD")).toBe(true);
    expect(vendors.has("Intel")).toBe(true);

    const multi = snapshot.systems.find((item) => item.systemId.includes("aarch64x64"));
    expect(multi?.acceleratorCount).toBe(64);
    expect(multi?.status).toBe("published");
  });
});
