import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { sha256Bytes, stableStringify } from "../lib/hash";
import { buildSnapshot, writeGenerated, assertUnchanged } from "../pipeline/generate";
import { validateSnapshot } from "../pipeline/validate";

const args = new Set(process.argv.slice(2));
const mode = args.has("--mode=fixture") ? "fixture" : "full-source";
const check = args.has("--check");
const promote = args.has("--promote") || mode === "full-source";

const sourceRoot =
  mode === "fixture"
    ? path.resolve("data/fixtures/pack")
    : path.resolve("data/source");
const outputRoot =
  mode === "fixture"
    ? path.resolve("data/fixtures/output")
    : path.resolve("data/generated/v1");

const snapshot = await buildSnapshot({ mode, sourceRoot });
validateSnapshot(snapshot);

if (check) {
  await assertUnchanged(snapshot, outputRoot);
  console.log(`${mode} hash check passed ${snapshot.manifest.snapshotSha256}`);
  process.exit(0);
}

if (mode === "full-source" && !promote) {
  throw new Error("full-source writes require --promote after validation");
}

await writeGenerated(snapshot, outputRoot);
if (mode === "fixture") {
  await mkdir(path.resolve("data/fixtures"), { recursive: true });
  await writeFile(
    path.resolve("data/fixtures/expected-output.sha256"),
    `${sha256Bytes(`${stableStringify(snapshot)}\n`)}\n`,
  );
}

console.log(`wrote ${mode} snapshot ${snapshot.manifest.snapshotSha256} to ${outputRoot}`);
console.log(
  JSON.stringify(
    {
      publishedResults: snapshot.manifest.counts.publishedResults,
      slices: snapshot.manifest.counts.slices,
      quarantined: snapshot.manifest.counts.quarantinedRecords,
    },
    null,
    2,
  ),
);
