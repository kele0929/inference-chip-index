import { existsSync, readFileSync, renameSync, rmSync, writeFileSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
process.chdir(root);

const apiSrc = resolve(root, "app/api");
const apiTmp = "/tmp/inference-chip-index-api-aside";
const wellKnownSrc = resolve(root, "app/.well-known");
const wellKnownTmp = "/tmp/inference-chip-index-well-known-aside";
const leaderboard = resolve(root, "app/leaderboard/page.tsx");
const leaderboardBackup = "/tmp/inference-chip-index-leaderboard-page.tsx";
let restored = false;

function restoreDir(tmp: string, src: string) {
  if (!existsSync(tmp)) return;
  if (existsSync(src)) rmSync(src, { recursive: true, force: true });
  renameSync(tmp, src);
}

function restore() {
  if (restored) return;
  restored = true;
  restoreDir(apiTmp, apiSrc);
  restoreDir(wellKnownTmp, wellKnownSrc);
  if (existsSync(leaderboardBackup)) {
    writeFileSync(leaderboard, readFileSync(leaderboardBackup));
    rmSync(leaderboardBackup, { force: true });
  }
}

process.on("exit", restore);
process.on("SIGINT", () => {
  restore();
  process.exit(1);
});
process.on("SIGTERM", () => {
  restore();
  process.exit(1);
});

if (existsSync(apiTmp)) rmSync(apiTmp, { recursive: true, force: true });
renameSync(apiSrc, apiTmp);
if (existsSync(wellKnownTmp)) rmSync(wellKnownTmp, { recursive: true, force: true });
if (existsSync(wellKnownSrc)) renameSync(wellKnownSrc, wellKnownTmp);

const original = readFileSync(leaderboard, "utf8");
writeFileSync(leaderboardBackup, original);
const signature = `export default async function LeaderboardPage({
  searchParams,
}: {
  searchParams: Promise<Search>;
}) {
  const params = await searchParams;`;
const replacement = `export const dynamic = "force-static";
export const dynamicParams = false;
export default async function LeaderboardPage() {
  const params = {} as Search;`;
if (!original.includes(signature)) {
  restore();
  throw new Error("leaderboard page signature changed; cannot patch for static export");
}
writeFileSync(leaderboard, original.replace(signature, replacement));

const result = spawnSync("bun", ["x", "next", "build"], {
  stdio: "inherit",
  env: {
    ...process.env,
    GITHUB_PAGES: "1",
    NEXT_PUBLIC_BASE_PATH: process.env.NEXT_PUBLIC_BASE_PATH || "/inference-chip-index",
  },
});

if ((result.status ?? 1) === 0) {
  const from = resolve(root, "out/404/index.html");
  const to = resolve(root, "out/404.html");
  if (existsSync(from)) writeFileSync(to, readFileSync(from));
}

restore();
process.exit(result.status ?? 1);
