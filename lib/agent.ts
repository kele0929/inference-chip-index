import { createAgent } from "@lucid-agents/core";
import { http } from "@lucid-agents/http";
import { payments, paymentsFromEnv } from "@lucid-agents/payments";
import { COMPARE_PRICE, MAX_RANK_RESPONSE_BYTES, RANK_PRICE } from "./constants";
import { compareSlice } from "./compare";
import { datasetStatus, loadSnapshot, previewChips } from "./dataset";
import { RankError, rankSlice } from "./ranking";
import {
  compareInputSchema,
  compareOutputSchema,
  datasetStatusInputSchema,
  datasetStatusOutputSchema,
  previewInputSchema,
  previewOutputSchema,
  rankInputSchema,
  rankOutputSchema,
} from "./schemas";

const agent = await createAgent({
  name: process.env.AGENT_NAME ?? "inference-chip-index",
  version: process.env.AGENT_VERSION ?? "1.0.0",
  description:
    process.env.AGENT_DESCRIPTION ??
    "Exact-slice, source-linked MLPerf Inference v6.0 comparisons of inference accelerators",
})
  .use(payments({ config: paymentsFromEnv() }))
  .use(http({ basePath: "/api/agent" }))
  .build();

const runtime = agent;
const { handlers } = runtime.http;

const addEntrypoint = (def: Parameters<typeof runtime.entrypoints.add>[0]) => {
  runtime.entrypoints.add(def);
};

addEntrypoint({
  key: "get-dataset-status",
  description:
    "Free dataset manifest, freshness, source commit, record counts, source links, and exact comparison slice IDs.",
  input: datasetStatusInputSchema,
  output: datasetStatusOutputSchema,
  handler: async () => ({ output: datasetStatus() }),
});

addEntrypoint({
  key: "preview-inference-chips",
  description: "Free preview of up to five verified rows for an optional exact comparison slice.",
  input: previewInputSchema,
  output: previewOutputSchema,
  handler: async ({ input }) => {
    const parsed = previewInputSchema.parse(input);
    return { output: previewChips(parsed.sliceId) };
  },
});

addEntrypoint({
  key: "rank-inference-chips",
  description:
    "Paid exact-slice ranking of official or derived MLPerf Inference v6.0 Closed results. Never mixes incompatible dimensions.",
  price: RANK_PRICE,
  input: rankInputSchema,
  output: rankOutputSchema,
  handler: async ({ input }) => {
    const parsed = rankInputSchema.parse(input);
    try {
      const output = rankSlice(loadSnapshot(), parsed);
      const size = Buffer.byteLength(JSON.stringify(output), "utf8");
      if (size >= MAX_RANK_RESPONSE_BYTES) {
        throw new RankError("response_too_large", "Ranking response exceeded the 1 MiB bound");
      }
      return { output };
    } catch (error) {
      if (error instanceof RankError) {
        throw error;
      }
      throw error;
    }
  },
});

addEntrypoint({
  key: "compare-inference-chips",
  description:
    "Paid exact-slice comparison of 2-8 accelerator slugs, with missing-evidence reasons and deltas only versus an explicit baseline.",
  price: COMPARE_PRICE,
  input: compareInputSchema,
  output: compareOutputSchema,
  handler: async ({ input }) => {
    const parsed = compareInputSchema.parse(input);
    const output = compareSlice(loadSnapshot(), parsed);
    const size = Buffer.byteLength(JSON.stringify(output), "utf8");
    if (size >= MAX_RANK_RESPONSE_BYTES) {
      throw new RankError("response_too_large", "Compare response exceeded the 1 MiB bound");
    }
    return { output };
  },
});

export { handlers, runtime };
export const agentCore = runtime.agent;
