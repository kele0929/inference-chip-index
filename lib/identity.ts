import aliases from "../data/registries/aliases.json";

export interface AcceleratorAlias {
  slug: string;
  displayName: string;
  vendor: string;
  family: string;
  variant: string | null;
}

const registry = aliases as Record<string, AcceleratorAlias>;

const COUNT_TOKEN = /\b(?:x|×)\s*\d+\b/i;
const MIXED_ACCELERATOR = /\band\b/i;

export function lookupAlias(modelName: string | null | undefined): AcceleratorAlias | undefined {
  if (!modelName) return undefined;
  return registry[modelName.trim()];
}

export function parseExplicitCount(value: unknown): number | null {
  if (typeof value === "number" && Number.isInteger(value) && value > 0) {
    return value;
  }
  if (typeof value === "string" && /^(?:0|[1-9]\d*)$/.test(value.trim())) {
    const parsed = Number.parseInt(value.trim(), 10);
    return parsed > 0 ? parsed : null;
  }
  return null;
}

export function identityIssues(input: {
  modelName: unknown;
  acceleratorsPerNode: unknown;
  numberOfNodes: unknown;
}): string[] {
  const reasons: string[] = [];
  if (typeof input.modelName !== "string" || input.modelName.trim() === "" || input.modelName.trim() === "N/A") {
    reasons.push("accelerator-identity-missing");
  } else {
    const name = input.modelName.trim();
    if (MIXED_ACCELERATOR.test(name)) {
      reasons.push("accelerator-identity-mixed");
    }
    if (!lookupAlias(name)) {
      reasons.push("accelerator-identity-unreviewed");
    }
    if (COUNT_TOKEN.test(name)) {
      reasons.push("accelerator-count-token-in-name");
    }
  }

  const perNode = parseExplicitCount(input.acceleratorsPerNode);
  const nodes = parseExplicitCount(input.numberOfNodes);
  if (perNode === null) {
    reasons.push("accelerator-count-not-established");
  }
  if (nodes === null) {
    reasons.push("node-count-not-established");
  }
  return reasons;
}

export function establishedAcceleratorCount(input: {
  acceleratorsPerNode: unknown;
  numberOfNodes: unknown;
}): number | null {
  const perNode = parseExplicitCount(input.acceleratorsPerNode);
  const nodes = parseExplicitCount(input.numberOfNodes);
  if (perNode === null || nodes === null) return null;
  return perNode * nodes;
}

export function listAliases(): Record<string, AcceleratorAlias> {
  return registry;
}
