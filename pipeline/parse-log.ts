import type { Scenario } from "../lib/constants";

export interface ParsedLog {
  scenarioFromLog: string | null;
  resultIsValid: boolean;
  validityFlags: Record<string, boolean>;
  metrics: Record<string, number>;
  unknownUnits: string[];
}

const METRIC_PATTERNS: Array<{ key: string; pattern: RegExp }> = [
  { key: "Tokens per second", pattern: /^Tokens per second:\s*([+-]?(?:\d+\.?\d*|\.\d+)(?:[eE][+-]?\d+)?)\s*$/ },
  {
    key: "Completed tokens per second",
    pattern: /^Completed tokens per second(?:\s*)?:\s*([+-]?(?:\d+\.?\d*|\.\d+)(?:[eE][+-]?\d+)?)\s*$/,
  },
  { key: "Samples per second", pattern: /^Samples per second:\s*([+-]?(?:\d+\.?\d*|\.\d+)(?:[eE][+-]?\d+)?)\s*$/ },
  {
    key: "Completed samples per second",
    pattern: /^Completed samples per second\s*:\s*([+-]?(?:\d+\.?\d*|\.\d+)(?:[eE][+-]?\d+)?)\s*$/,
  },
];

export function parseSummaryLog(text: string): ParsedLog {
  const lines = text.replace(/\r\n/g, "\n").split("\n");
  const metrics: Record<string, number> = {};
  const unknownUnits: string[] = [];
  const validityFlags: Record<string, boolean> = {};
  let scenarioFromLog: string | null = null;
  let resultIsValid = false;

  for (const raw of lines) {
    const line = raw.trim();
    const scenario = /^Scenario\s*:\s*(.+)$/.exec(line);
    if (scenario) scenarioFromLog = scenario[1].trim();

    if (line.startsWith("Result is")) {
      resultIsValid = /Result is\s*:\s*VALID\b/.test(line);
    }
    const flag = /^(Min duration satisfied|Min queries satisfied|Early stopping satisfied|Performance constraints satisfied)\s*:\s*(Yes|No)\s*$/.exec(
      line,
    );
    if (flag) {
      validityFlags[flag[1]] = flag[2] === "Yes";
    }

    for (const { key, pattern } of METRIC_PATTERNS) {
      if (!line.toLowerCase().startsWith(key.toLowerCase())) continue;
      const match = pattern.exec(line);
      if (!match) {
        unknownUnits.push(`invalid-number:${key}`);
        continue;
      }
      const value = Number(match[1]);
      if (!Number.isFinite(value)) {
        unknownUnits.push(`invalid-number:${key}`);
        continue;
      }
      metrics[key] = value;
    }
  }

  return { scenarioFromLog, resultIsValid, validityFlags, metrics, unknownUnits };
}

export function parseAccuracy(text: string): { value: number; unit: string } | null {
  const exact = /'exact_match'\s*:\s*([+-]?(?:\d+\.?\d*|\.\d+))/.exec(text);
  if (exact) {
    const value = Number(exact[1]);
    return Number.isFinite(value) ? { value, unit: "exact_match_percent" } : null;
  }
  const rougeL = /'rougeL'\s*:\s*'([+-]?(?:\d+\.?\d*|\.\d+))'/.exec(text);
  if (rougeL) {
    const value = Number(rougeL[1]);
    return Number.isFinite(value) ? { value, unit: "rougeL" } : null;
  }
  const finalScore = /FINAL SCORE:\s*([+-]?(?:\d+\.?\d*|\.\d+))%/.exec(text);
  if (finalScore) {
    const value = Number(finalScore[1]);
    return Number.isFinite(value) ? { value, unit: "final_score_percent" } : null;
  }
  return null;
}

export function directoryScenario(pathParts: string[]): Scenario | null {
  const candidate = pathParts.find((part) => part === "Offline" || part === "Server" || part === "Interactive");
  return (candidate as Scenario | undefined) ?? null;
}
