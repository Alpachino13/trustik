import type { QueryCtx } from "../_generated/server";
import type { Id } from "../_generated/dataModel";

// Money a user has locked in escrow as a BUYER. A seller's pending payout is not "held" for them.
export async function heldForBuyer(ctx: QueryCtx, userId: Id<"users">): Promise<number> {
  const deals = await ctx.db
    .query("deals")
    .withIndex("by_buyer", (q) => q.eq("buyerId", userId))
    .collect();
  return deals
    .filter((d) => d.status === "funded" || d.status === "disputed")
    .reduce((sum, d) => sum + d.amount, 0);
}
