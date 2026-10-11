import type { MutationCtx } from "../_generated/server";
import type { Id } from "../_generated/dataModel";
import { fail } from "../lib/errors";
import { CENTIMES_PER_DZD } from "../lib/money";
import { postTransfer, systemAccount, walletAccount } from "./ledger";

export const MIN_DEPOSIT_DZD = 100;
export const MAX_DEPOSIT_DZD = 500_000;

export async function createPendingDeposit(
  ctx: MutationCtx,
  userId: Id<"users">,
  amountDzd: number,
): Promise<Id<"deposits">> {
  if (!Number.isInteger(amountDzd) || amountDzd < MIN_DEPOSIT_DZD || amountDzd > MAX_DEPOSIT_DZD) {
    fail("INVALID_AMOUNT", `top-up must be a whole number between ${MIN_DEPOSIT_DZD} and ${MAX_DEPOSIT_DZD} DZD`);
  }
  return await ctx.db.insert("deposits", {
    userId,
    amount: amountDzd * CENTIMES_PER_DZD,
    status: "pending",
    provider: "chargily",
  });
}

export async function attachCheckout(
  ctx: MutationCtx,
  depositId: Id<"deposits">,
  checkoutId: string,
  checkoutUrl: string,
) {
  await ctx.db.patch(depositId, { providerCheckoutId: checkoutId, checkoutUrl });
}

export type ConfirmResult = "credited" | "replayed" | "unknown_checkout" | "amount_mismatch";

// Called only from the signed webhook. Safe to call many times for the same checkout.
export async function confirmDeposit(
  ctx: MutationCtx,
  args: { checkoutId: string; paidAmountDzd: number },
): Promise<ConfirmResult> {
  const deposit = await ctx.db
    .query("deposits")
    .withIndex("by_checkout", (q) => q.eq("providerCheckoutId", args.checkoutId))
    .first();
  if (!deposit) return "unknown_checkout";
  if (deposit.status === "paid") return "replayed";
  if (args.paidAmountDzd * CENTIMES_PER_DZD !== deposit.amount) return "amount_mismatch";

  const wallet = await walletAccount(ctx, deposit.userId);
  const external = await systemAccount(ctx, "external");
  await postTransfer(ctx, {
    from: external._id,
    to: wallet._id,
    amount: deposit.amount,
    reason: "deposit",
    idempotencyKey: `deposit:${args.checkoutId}`,
  });
  await ctx.db.patch(deposit._id, { status: "paid" });
  return "credited";
}

// A paid deposit is never downgraded by a late failed/expired event.
export async function closeDeposit(
  ctx: MutationCtx,
  checkoutId: string,
  status: "failed" | "expired",
) {
  const deposit = await ctx.db
    .query("deposits")
    .withIndex("by_checkout", (q) => q.eq("providerCheckoutId", checkoutId))
    .first();
  if (deposit && deposit.status === "pending") await ctx.db.patch(deposit._id, { status });
}