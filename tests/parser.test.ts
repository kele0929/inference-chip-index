import { describe, expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { parseAccuracy, parseSummaryLog } from "../pipeline/parse-log";
import { parseSystemJson } from "../pipeline/parse-system";

const nvidiaSummary = readFileSync(
  "data/fixtures/pack/closed/NVIDIA/results/B300-SXM-270GBx8_TRT/gpt-oss-120b/Offline/performance/run_1/mlperf_log_summary.txt",
  "utf8",
);
const nvidiaSystem = JSON.parse(
  readFileSync("data/fixtures/pack/closed/NVIDIA/systems/B300-SXM-270GBx8_TRT.json", "utf8"),
);

describe("parser", () => {
  test("reads official tokens/s and VALID from NVIDIA Offline summary", () => {
    const parsed = parseSummaryLog(nvidiaSummary);
    expect(parsed.resultIsValid).toBe(true);
    expect(parsed.metrics["Tokens per second"]).toBe(103961);
    expect(parsed.unknownUnits).toEqual([]);
  });

  test("rejects invalid numbers", () => {
    const parsed = parseSummaryLog("Tokens per second: not-a-number\nResult is : VALID");
    expect(parsed.unknownUnits).toContain("invalid-number:Tokens per second");
  });

  test("parses exact_match accuracy", () => {
    const accuracy = parseAccuracy("'exact_match': 83.565\n");
    expect(accuracy).toEqual({ value: 83.565, unit: "exact_match_percent" });
  });

  test("reads explicit accelerator fields from system JSON", () => {
    const system = parseSystemJson("B300-SXM-270GBx8_TRT", nvidiaSystem);
    expect(system.acceleratorModelName).toBe("NVIDIA B300-SXM-270GB");
    expect(system.acceleratorsPerNode).toBe(8);
    expect(system.numberOfNodes).toBe(1);
  });
});
