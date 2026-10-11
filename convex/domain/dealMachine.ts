import type { Infer } from "convex/values";
import type { dealStatus } from "../schema";
import { fail } from "../lib/errors";

export type DealStatus = Infer<typeof dealStatus>;

const TRANSITIONS: Record<DealStatus, readonly DealStatus[]> = {
  pending: ["accepted", "cancelled"],
  accepted: ["funded", "cancelled"],
  funded: ["released", "disputed"],
  disputed: ["settled"],
  released: [],
  settled: [],
  cancelled: [],
};

export function canTransition(from: DealStatus, to: DealStatus): boolean {
  return TRANSITIONS[from].includes(to);
}

export function assertTransition(from: DealStatus, to: DealStatus): void {
  if (!canTransition(from, to)) {
    fail("INVALID_STATE", `cannot go from ${from} to ${to}`);
  }
}