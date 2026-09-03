import { readdir, readFile, stat } from "node:fs/promises";
import path from "node:path";
import { ALLOWED_SCENARIOS, ALLOWED_WORKLOADS, type Scenario, type Workload } from "../lib/constants";
import { sha256Bytes } from "../lib/hash";

export interface SourceFile {
  relativePath: string;
  absolutePath: string;
  bytes: Buffer;
  sha256: string;
}

export async function listFiles(root: string): Promise<string[]> {
  const out: string[] = [];
  async function walk(current: string) {
    const entries = await readdir(current, { withFileTypes: true });
    entries.sort((a, b) => a.name.localeCompare(b.name));
    for (const entry of entries) {
      const next = path.join(current, entry.name);
      if (entry.isDirectory()) await walk(next);
      else if (entry.isFile()) out.push(next);
    }
  }
  const exists = await stat(root).then(
    () => true,
    () => false,
  );
  if (exists) await walk(root);
  return out;
}

export async function readSourceFile(absolutePath: string, root: string): Promise<SourceFile> {
  const bytes = await readFile(absolutePath);
  return {
    relativePath: path.relative(root, absolutePath).split(path.sep).join("/"),
    absolutePath,
    bytes,
    sha256: sha256Bytes(bytes),
  };
}

export function isOfficialSystemPath(relativePath: string): boolean {
  const parts = relativePath.split("/");
  return parts.length === 4 && parts[0] === "closed" && parts[2] === "systems" && parts[3].endsWith(".json");
}

export function parseOfficialResultPath(relativePath: string): {
  submitter: string;
  systemId: string;
  workload: Workload;
  scenario: Scenario;
  kind: "measurements" | "summary" | "accuracy";
} | null {
  const parts = relativePath.split("/");
  if (parts[0] !== "closed" || parts[2] !== "results") return null;
  if (parts.some((part) => part.startsWith("TEST"))) return null;
  if (parts.length < 6) return null;
  const submitter = parts[1];
  const systemId = parts[3];
  const workload = parts[4];
  const scenario = parts[5];
  if (!ALLOWED_WORKLOADS.includes(workload as Workload)) return null;
  if (!ALLOWED_SCENARIOS.includes(scenario as Scenario)) return null;
  if (relativePath.endsWith("/measurements.json")) {
    return { submitter, systemId, workload: workload as Workload, scenario: scenario as Scenario, kind: "measurements" };
  }
  if (relativePath.endsWith("/performance/run_1/mlperf_log_summary.txt")) {
    return { submitter, systemId, workload: workload as Workload, scenario: scenario as Scenario, kind: "summary" };
  }
  if (relativePath.endsWith("/accuracy/accuracy.txt")) {
    return { submitter, systemId, workload: workload as Workload, scenario: scenario as Scenario, kind: "accuracy" };
  }
  return null;
}
