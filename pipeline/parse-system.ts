export interface RawSystem {
  submitter: string;
  systemId: string;
  systemName: string;
  division: string;
  acceleratorModelName: unknown;
  acceleratorsPerNode: unknown;
  numberOfNodes: unknown;
  hostProcessor: string | null;
  framework: string | null;
  systemType: string | null;
  raw: Record<string, unknown>;
}

export function parseSystemJson(systemId: string, raw: unknown): RawSystem {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) {
    throw new Error(`System ${systemId} is not a JSON object`);
  }
  const record = raw as Record<string, unknown>;
  return {
    submitter: stringField(record.submitter) ?? "unknown",
    systemId,
    systemName: stringField(record.system_name) ?? systemId,
    division: stringField(record.division) ?? "",
    acceleratorModelName: record.accelerator_model_name,
    acceleratorsPerNode: record.accelerators_per_node,
    numberOfNodes: record.number_of_nodes,
    hostProcessor: stringField(record.host_processor_model_name),
    framework: stringField(record.framework),
    systemType: stringField(record.system_type),
    raw: record,
  };
}

function stringField(value: unknown): string | null {
  return typeof value === "string" && value.trim() !== "" ? value.trim() : null;
}
