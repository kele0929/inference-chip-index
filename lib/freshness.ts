import publication from "../data/registries/publication.json";
import type { FreshnessState } from "./types";

export function freshnessState(now = new Date(), lastReviewedAt = publication.lastReviewedAt): FreshnessState {
  const reviewed = Date.parse(lastReviewedAt);
  if (!Number.isFinite(reviewed)) return "stale";
  const ageMs = now.getTime() - reviewed;
  const maxMs = publication.freshnessPolicyDays * 24 * 60 * 60 * 1000;
  return ageMs >= 0 && ageMs <= maxMs ? "fresh" : "stale";
}
