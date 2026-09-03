import { createHash } from "node:crypto";

export function sha256Bytes(bytes: Uint8Array | Buffer | string): string {
  return createHash("sha256").update(bytes).digest("hex");
}

export function stableStringify(value: unknown): string {
  return JSON.stringify(sortValue(value));
}

function sortValue(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map(sortValue);
  }
  if (value && typeof value === "object") {
    const entries = Object.entries(value as Record<string, unknown>).sort(([a], [b]) =>
      a < b ? -1 : a > b ? 1 : 0,
    );
    const out: Record<string, unknown> = {};
    for (const [key, nested] of entries) {
      out[key] = sortValue(nested);
    }
    return out;
  }
  return value;
}

export function contentVersionId(record: unknown): string {
  return `cv:${sha256Bytes(stableStringify(record))}`;
}

export function sourceUrl(repository: string, commit: string, path: string): string {
  return `${repository}/blob/${commit}/${path}`;
}
