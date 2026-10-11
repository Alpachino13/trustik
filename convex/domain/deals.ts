import type { MutationCtx } from "../_generated/server";
import type { Doc, Id } from "../_generated/dataModel";
import { fail } from "../lib/errors";
import { assertAmount } from "../lib/money";
import { assertTransition } from "./dealMachine";
import { DEFAULT_FEE_BPS, releaseSplit } from "./fees";
import { escrowAccount, postTransfer, systemAccount, walletAccount } from "./ledger";

async function loadDeal(ctx: MutationCtx, dealId: Id<"deals">): Promise<Doc<"deals">> {
  const deal = await ctx.db.get(dealId);
  if (!deal) fail("NOT_FOUND", "deal not found");
  return deal;
}

export function roleOf(deal: Doc<"deals">, userId: Id<"users">): "buyer" | "seller" | null {
  if (deal.buyerId === userId) return "buyer";
  if (deal.sellerId === userId) return "seller";
  return null;
}

export async function createDeal(
  ctx: MutationCtx,
  args: {
    userId: Id<"users">;
    role: "buyer" | "seller";
    counterpartyEmail: string;
    title: string;
    description: string;
    amount: number;
  },
): Promise<Id<"deals">> {
  assertAmount(args.amount);
  const me = await ctx.db.get(args.userId);
  if (!me) fail("UNAUTHENTICATED");

  const email = args.counterpartyEmail.trim().toLowerCase();
  if (me.email?.toLowerCase() === email) {
    fail("INVALID_STATE", "cannot open a deal with yourself");
  }

  const other = await ctx.db
    .query("users")
    .withIndex("email", (q) => q.eq("email", email))
    .first();

  const sides =
    args.role === "buyer"
      ? { buyerId: args.userId, sellerId: other?._id }
      : { sellerId: args.userId, buyerId: other?._id };

  const dealId = await ctx.db.insert("deals", {
    creatorId: args.userId,
    creatorRole: args.role,
    ...sides,
    inviteEmail: other ? undefined : email, // deal waits for them to register
    title: args.title,
    description: args.description,
    amount: args.amount,
    feeBps: DEFAULT_FEE_BPS,
    status: "pending",
  });

  const escrow = await escrowAccount(ctx, dealId);
  await ctx.db.patch(dealId, { escrowAccountId: escrow._id });
  return dealId;
}

export async function acceptDeal(ctx: MutationCtx, userId: Id<"users">, dealId: Id<"deals">) {
  const deal = await loadDeal(ctx, dealId);
  assertTransition(deal.status, "accepted");
  if (deal.creatorId === userId) fail("FORBIDDEN", "the creator cannot accept their own deal");

  const assigned = deal.creatorRole === "buyer" ? deal.sellerId : deal.buyerId;
  if (assigned) {
    if (assigned !== userId) fail("FORBIDDEN", "this deal is for someone else");
    await ctx.db.patch(dealId, { status: "accepted" });
    return;
  }

  // invited by email before registering: claim the deal
  const user = await ctx.db.get(userId);
  if (!user?.email || user.email.toLowerCase() !== deal.inviteEmail) {
    fail("FORBIDDEN", "this deal is for someone else");
  }
  if (!user.emailVerificationTime) {
    fail("FORBIDDEN", "verify your email before accepting this invitation");
  }
  const claim = deal.creatorRole === "buyer" ? { sellerId: userId } : { buyerId: userId };
  await ctx.db.patch(dealId, { ...claim, inviteEmail: undefined, status: "accepted" });
}

export async function cancelDeal(ctx: MutationCtx, userId: Id<"users">, dealId: Id<"deals">) {
  const deal = await loadDeal(ctx, dealId);
  if (deal.creatorId !== userId && roleOf(deal, userId) === null) {
    fail("FORBIDDEN");
  }
  assertTransition(deal.status, "cancelled"); // impossible once funded
  await ctx.db.patch(dealId, { status: "cancelled" });
}

export async function fundDeal(ctx: MutationCtx, userId: Id<"users">, dealId: Id<"deals">) {
  const deal = await loadDeal(ctx, dealId);
  if (roleOf(deal, userId) !== "buyer") fail("FORBIDDEN", "only the buyer can fund");
  assertTransition(deal.status, "funded");

  const wallet = await walletAccount(ctx, userId);
  const escrow = await escrowAccount(ctx, dealId);
  await postTransfer(ctx, {
    from: wallet._id,
    to: escrow._id,
    amount: deal.amount,
    reason: "escrow_funding",
    dealId,
    idempotencyKey: `fund:${dealId}`,
  });
  await ctx.db.patch(dealId, { status: "funded" });
}

export async function releaseDeal(ctx: MutationCtx, userId: Id<"users">, dealId: Id<"deals">) {
  const deal = await loadDeal(ctx, dealId);
  if (roleOf(deal, userId) !== "buyer") fail("FORBIDDEN", "only the buyer can release");
  assertTransition(deal.status, "released");
  if (!deal.sellerId) fail("INVALID_STATE", "deal has no seller");

  const { fee, net } = releaseSplit(deal.amount, deal.feeBps);
  const escrow = await escrowAccount(ctx, dealId);
  const sellerWallet = await walletAccount(ctx, deal.sellerId);

  await postTransfer(ctx, {
    from: escrow._id,
    to: sellerWallet._id,
    amount: net,
    reason: "escrow_release",
    dealId,
    idempotencyKey: `release:${dealId}`,
  });
  if (fee > 0) {
    const fees = await systemAccount(ctx, "fees");
    await postTransfer(ctx, {
      from: escrow._id,
      to: fees._id,
      amount: fee,
      reason: "escrow_fee",
      dealId,
      idempotencyKey: `release-fee:${dealId}`,
    });
  }
  await ctx.db.patch(dealId, { status: "released" });
}