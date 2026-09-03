import { describe, expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { sha256Bytes, stableStringify } from "../lib/hash";
import { buildSnapshot } from "../pipeline/generate";
import { validateSnapshot } from "../pipeline/validate";

describe("pipeline hashes", () => {
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
