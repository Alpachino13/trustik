import type { MutationCtx } from "../_generated/server";
import type { Id } from "../_generated/dataModel";
import { fail } from "../lib/errors";
import { splitByBps } from "../lib/money";
import { assertTransition } from "./dealMachine";
import { roleOf } from "./deals";
import { escrowAccount, postTransfer, walletAccount } from "./ledger";

export async function openDispute(
  ctx: MutationCtx,
  userId: Id<"users">,
  dealId: Id<"deals">,
  reason: string,
): Promise<Id<"disputes">> {
  const deal = await ctx.db.get(dealId);
  if (!deal) fail("NOT_FOUND", "deal not found");
  if (roleOf(deal, userId) === null) fail("FORBIDDEN");

  const text = reason.trim();
  if (text.length < 10 || text.length > 2000) {
    fail("INVALID_INPUT", "explain the problem in 10 to 2000 characters");
  }
  assertTransition(deal.status, "disputed"); // only from funded

  const disputeId = await ctx.db.insert("disputes", {
    dealId,
    openedBy: userId,
    reason: text,
    status: "open",
  });
  await ctx.db.patch(dealId, { status: "disputed" });
  return disputeId;
}

export async function addDisputeMessage(
  ctx: MutationCtx,
  userId: Id<"users">,
  disputeId: Id<"disputes">,
  body: string,
) {
  const dispute = await ctx.db.get(disputeId);
  if (!dispute) fail("NOT_FOUND", "dispute not found");
  const deal = await ctx.db.get(dispute.dealId);
  if (!deal) fail("NOT_FOUND", "deal not found");
  const user = await ctx.db.get(userId);

  const allowed = roleOf(deal, userId) !== null || user?.role === "admin";
  if (!allowed) fail("FORBIDDEN");
  if (dispute.status !== "open") fail("INVALID_STATE", "dispute is closed");

  const text = body.trim();
  if (text.length === 0 || text.length > 2000) {
    fail("INVALID_INPUT", "message must be 1 to 2000 characters");
  }
  await ctx.db.insert("disputeMessages", { disputeId, authorId: userId, body: text });
}

// buyerBps: share of the funded amount returned to the buyer (10000 = full refund, 0 = full release).
export async function settleDispute(
  ctx: MutationCtx,
  moderatorId: Id<"users">,
  dealId: Id<"deals">,
  buyerBps: number,
  note?: string,
) {
  const moderator = await ctx.db.get(moderatorId);
  if (moderator?.role !== "admin") fail("FORBIDDEN", "moderators only");

  const deal = await ctx.db.get(dealId);
  if (!deal) fail("NOT_FOUND", "deal not found");
  if (roleOf(deal, moderatorId) !== null) {
    fail("FORBIDDEN", "a moderator cannot rule on their own deal");
  }
  assertTransition(deal.status, "settled");
  if (!deal.buyerId || !deal.sellerId) fail("INVALID_STATE", "deal is missing a side");

  const dispute = await ctx.db
    .query("disputes")
    .withIndex("by_deal", (q) => q.eq("dealId", dealId))
    .first();
  if (!dispute) fail("NOT_FOUND", "no dispute on this deal");

  const { buyer, seller } = splitByBps(deal.amount, buyerBps);
  const escrow = await escrowAccount(ctx, dealId);

  // both sides are credited in the same transaction
  if (buyer > 0) {
    const w = await walletAccount(ctx, deal.buyerId);
    await postTransfer(ctx, {
      from: escrow._id, to: w._id, amount: buyer,
      reason: "dispute_refund", dealId,
      idempotencyKey: `dispute-refund:${dealId}`,
    });
  }
  if (seller > 0) {
    const w = await walletAccount(ctx, deal.sellerId);
    await postTransfer(ctx, {
      from: escrow._id, to: w._id, amount: seller,
      reason: "dispute_settlement", dealId,
      idempotencyKey: `dispute-settle:${dealId}`,
    });
  }

  await ctx.db.patch(dispute._id, {
    status: "settled",
    moderatorId,
    buyerBps,
    resolutionNote: note?.trim() || undefined,
  });
  await ctx.db.patch(dealId, { status: "settled" });
}