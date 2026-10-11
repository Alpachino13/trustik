import type { MutationCtx } from "../_generated/server";
import type { Id } from "../_generated/dataModel";
import { fail } from "../lib/errors";
import { CENTIMES_PER_DZD } from "../lib/money";
import { postTransfer, systemAccount, walletAccount } from "./ledger";

export const MIN_WITHDRAWAL_DZD = 500;
export const MAX_WITHDRAWAL_DZD = 1_000_000;
export const MAX_PENDING_WITHDRAWALS = 3;

export async function requestWithdrawal(
  ctx: MutationCtx,
  userId: Id<"users">,
  args: {
    amountDzd: number;
    method: "ccp" | "bank" | "baridimob";
    accountHolder: string;
    accountNumber: string;
  },
): Promise<Id<"withdrawals">> {
  const user = await ctx.db.get(userId);
  if (!user) fail("UNAUTHENTICATED");
  if (user.kycStatus !== "approved") {
    fail("FORBIDDEN", "identity verification is required before withdrawing");
  }

  const { amountDzd } = args;
  if (!Number.isInteger(amountDzd) || amountDzd < MIN_WITHDRAWAL_DZD || amountDzd > MAX_WITHDRAWAL_DZD) {
    fail("INVALID_AMOUNT", `withdrawal must be a whole number between ${MIN_WITHDRAWAL_DZD} and ${MAX_WITHDRAWAL_DZD} DZD`);
  }
  const accountHolder = args.accountHolder.trim();
  const accountNumber = args.accountNumber.replace(/\s+/g, "");
  if (accountHolder.length < 3 || accountHolder.length > 80) fail("INVALID_INPUT", "invalid account holder");
  if (accountNumber.length < 5 || accountNumber.length > 40) fail("INVALID_INPUT", "invalid account number");

  const pending = await ctx.db
    .query("withdrawals")
    .withIndex("by_user", (q) => q.eq("userId", userId))
    .collect();
  if (pending.filter((w) => w.status === "pending").length >= MAX_PENDING_WITHDRAWALS) {
    fail("INVALID_STATE", "too many pending withdrawals");
  }

  const amount = amountDzd * CENTIMES_PER_DZD;
  const wallet = await walletAccount(ctx, userId);
  if (wallet.balance < amount) fail("INSUFFICIENT_FUNDS");

  const id = await ctx.db.insert("withdrawals", {
    userId, amount, method: args.method, accountHolder, accountNumber, status: "pending",
  });
  const external = await systemAccount(ctx, "external");
  await postTransfer(ctx, {
    from: wallet._id, to: external._id, amount,
    reason: "withdrawal", idempotencyKey: `withdrawal:${id}`,
  });
  return id;
}

async function loadReviewable(ctx: MutationCtx, adminId: Id<"users">, id: Id<"withdrawals">) {
  const admin = await ctx.db.get(adminId);
  if (admin?.role !== "admin") fail("FORBIDDEN", "moderators only");
  const w = await ctx.db.get(id);
  if (!w) fail("NOT_FOUND");
  if (w.userId === adminId) fail("FORBIDDEN", "cannot review your own withdrawal");
  if (w.status !== "pending") fail("INVALID_STATE", "already reviewed");
  return w;
}

// The operator has paid out by hand: the money already left the wallet at request time.
export async function approveWithdrawal(
  ctx: MutationCtx, adminId: Id<"users">, id: Id<"withdrawals">, note?: string,
) {
  await loadReviewable(ctx, adminId, id);
  await ctx.db.patch(id, { status: "approved", reviewedBy: adminId, reviewNote: note?.trim() || undefined });
}

export async function rejectWithdrawal(
  ctx: MutationCtx, adminId: Id<"users">, id: Id<"withdrawals">, note?: string,
) {
  const w = await loadReviewable(ctx, adminId, id);
  const wallet = await walletAccount(ctx, w.userId);
  const external = await systemAccount(ctx, "external");
  await postTransfer(ctx, {
    from: external._id, to: wallet._id, amount: w.amount,
    reason: "withdrawal_refund", idempotencyKey: `withdrawal-refund:${id}`,
  });
  await ctx.db.patch(id, { status: "rejected", reviewedBy: adminId, reviewNote: note?.trim() || undefined });
}