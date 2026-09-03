import { describe, expect, test } from "bun:test";
import { establishedAcceleratorCount, identityIssues, lookupAlias } from "../lib/identity";

describe("identity", () => {
  test("maps reviewed NVIDIA/AMD/Intel names", () => {
    expect(lookupAlias("NVIDIA B300-SXM-270GB")?.vendor).toBe("NVIDIA");
    expect(lookupAlias("AMD Instinct MI355X 288GB HBM3e")?.family).toBe("cdna4");
    expect(lookupAlias("Intel(R) Arc Pro(R) B60")?.slug).toBe("intel-arc-pro-b60");
  });

  test("does not infer count from x8 or NVL72 names", () => {
    const issues = identityIssues({
      modelName: "MysteryAccel x8",
      acceleratorsPerNode: "",
      numberOfNodes: "1",
    });
    expect(issues).toContain("accelerator-count-not-established");
    expect(issues).toContain("accelerator-count-token-in-name");
    expect(establishedAcceleratorCount({ acceleratorsPerNode: "", numberOfNodes: "1" })).toBeNull();
  });

  test("multiplies only explicit numeric fields", () => {
    expect(establishedAcceleratorCount({ acceleratorsPerNode: 4, numberOfNodes: 16 })).toBe(64);
    expect(establishedAcceleratorCount({ acceleratorsPerNode: "8", numberOfNodes: "1" })).toBe(8);
  });

  test("quarantines mixed accelerator identity", () => {
    const issues = identityIssues({
      modelName: "AMD Instinct MI300X 192GB HBM3 (x8) and AMD Instinct MI325X 256GB HBM3e (x8)",
      acceleratorsPerNode: 8,
      numberOfNodes: 3,
    });
    expect(issues).toContain("accelerator-identity-mixed");
  });
});
