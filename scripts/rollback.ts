import { copyFile, readdir } from "node:fs/promises";
import path from "node:path";

const version = process.argv[2] ?? "v1";
const from = path.resolve("data/generated", `${version}.previous`);
const to = path.resolve("data/generated", version);

const files = await readdir(from);
for (const file of files) {
  await copyFile(path.join(from, file), path.join(to, file));
}
console.log(`Rolled dataset ${version} back from ${from}`);
