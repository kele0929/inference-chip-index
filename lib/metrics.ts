import metricsRegistry from "../data/registries/metrics.json";
import type { Scenario, Workload } from "./constants";
import type { WinningDirection } from "./types";

export interface MetricDefinition {
  id: string;
  displayName: string;
  canonicalUnit: string;
  winningDirection: WinningDirection;
  allowedWorkloads: Workload[];
  allowedScenarios: Scenario[];
  upstreamLogKeys: string[];
  validityRequirements: string[];
  latencyRequirements: string[];
  derivationAllowed: boolean;
  isPrimaryOfficial: boolean;
}

const registry = metricsRegistry as Record<string, MetricDefinition>;

export function listMetrics(): MetricDefinition[] {
  return Object.values(registry);
}

export function getMetric(id: string): MetricDefinition | undefined {
  return registry[id];
}

export function primaryMetricFor(workload: Workload, scenario: Scenario): MetricDefinition | undefined {
  return listMetrics().find(
    (metric) =>
      metric.isPrimaryOfficial &&
      metric.allowedWorkloads.includes(workload) &&
      metric.allowedScenarios.includes(scenario),
  );
}

export function accuracyTargetFor(workload: Workload): string {
  if (workload === "llama3.1-8b") return "official-rouge";
  if (workload === "gpt-oss-120b") return "official-exact-match";
  return "official-default";
}

export function sliceId(input: {
  workload: Workload;
  scenario: Scenario;
  accuracyTarget: string;
  metricId: string;
}): string {
  return `slice:v6.0:closed:${input.workload}:${input.scenario}:${input.accuracyTarget}:${input.metricId}`;
}

export function comparabilityText(input: {
  workload: Workload;
  scenario: Scenario;
  accuracyTarget: string;
  metricId: string;
  unit: string;
}): string {
  const metric = getMetric(input.metricId);
  const direction = metric?.winningDirection === "lower" ? "lower is better" : "higher is better";
  return `These rows are comparable only for MLPerf Inference v6.0, Closed division, workload ${input.workload}, scenario ${input.scenario}, accuracy target ${input.accuracyTarget}, metric ${input.metricId} (${input.unit}, ${direction}). They are not a universal ranking of chips.`;
}
