import { describe, expect, test } from "bun:test";
import { existsSync, readFileSync } from "node:fs";
import { sha256Bytes, stableStringify } from "../lib/hash";
import { buildSnapshot } from "../pipeline/generate";
import { validateSnapshot } from "../pipeline/validate";

describe("pipeline hashes", () => {
  test("fixture output hash is committed for clean-checkout CI", () => {
    expect(existsSync("data/fixtures/expected-output.sha256")).toBe(true);
    expect(existsSync("data/fixtures/output/snapshot.sha256")).toBe(true);
    expect(existsSync("data/fixtures/output/snapshot.json")).toBe(true);
    const pinned = readFileSync("data/fixtures/expected-output.sha256", "utf8").trim();
    const output = readFileSync("data/fixtures/output/snapshot.sha256", "utf8").trim();
    expect(output).toBe(pinned);
  });

  test("fixture mode reproduces the checked-in expected hash", async () => {
    const snapshot = await buildSnapshot({ mode: "fixture", sourceRoot: "data/fixtures/pack" });
    validateSnapshot(snapshot);
    const actual = sha256Bytes(`${stableStringify(snapshot)}\n`);
    const expected = readFileSync("data/fixtures/expected-output.sha256", "utf8").trim();
    expect(actual).toBe(expected);
  });

  test("full-source mode reproduces the committed snapshot hash", async () => {
    const snapshot = await buildSnapshot({ mode: "full-source", sourceRoot: "data/source" });
    validateSnapshot(snapshot);
    const actual = sha256Bytes(`${stableStringify(snapshot)}\n`);
    const expected = readFileSync("data/generated/v1/snapshot.sha256", "utf8").trim();
    expect(actual).toBe(expected);
  });
});
