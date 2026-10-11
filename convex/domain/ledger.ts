import type { Infer } from "convex/values";
import type { MutationCtx, QueryCtx } from "../_generated/server";
import type { Doc, Id } from "../_generated/dataModel";
import type { ledgerReason } from "../schema";
import { fail } from "../lib/errors";
import { assertAmount } from "../lib/money";

type Reason = Infer<typeof ledgerReason>;

export async function walletAccount(ctx: MutationCtx, userId: Id<"users">): Promise<Doc<"accounts">> {
  const existing = await ctx.db
    .query("accounts")
    .withIndex("by_user_kind", (q) => q.eq("userId", userId).eq("kind", "wallet"))
    .unique();
  if (existing) return existing;
  const id = await ctx.db.insert("accounts", { kind: "wallet", userId, balance: 0 });
  return (await ctx.db.get(id))!;
}

export async function escrowAccount(ctx: MutationCtx, dealId: Id<"deals">): Promise<Doc<"accounts">> {
  const existing = await ctx.db
    .query("accounts")
    .withIndex("by_deal", (q) => q.eq("dealId", dealId))
    .first();
  if (existing) return existing;
  const id = await ctx.db.insert("accounts", { kind: "escrow", dealId, balance: 0 });
  return (await ctx.db.get(id))!;
}

export async function systemAccount(ctx: MutationCtx, kind: "fees" | "external"): Promise<Doc<"accounts">> {
  const existing = await ctx.db
    .query("accounts")
    .withIndex("by_kind", (q) => q.eq("kind", kind))
    .first();
  if (existing) return existing;
  const id = await ctx.db.insert("accounts", { kind, balance: 0 });
  return (await ctx.db.get(id))!;
}

export type Transfer = {
  from: Id<"accounts">;
  to: Id<"accounts">;
  amount: number;
  reason: Reason;
  dealId?: Id<"deals">;
  idempotencyKey?: string;
};

// The only function allowed to change a balance.
export async function postTransfer(
  ctx: MutationCtx,
  t: Transfer,
): Promise<{ txId: string; replayed: boolean }> {
  assertAmount(t.amount);
  if (t.from === t.to) fail("INVALID_STATE", "cannot transfer to the same account");

  if (t.idempotencyKey) {
    const prior = await ctx.db
      .query("ledgerEntries")
      .withIndex("by_idempotency", (q) => q.eq("idempotencyKey", t.idempotencyKey))
      .first();
    if (prior) return { txId: prior.txId, replayed: true };
  }

  const from = await ctx.db.get(t.from);
  const to = await ctx.db.get(t.to);
  if (!from || !to) fail("NOT_FOUND", "account not found");

  // only the outside world may go negative
  if (from.kind !== "external" && from.balance < t.amount) {
    fail("INSUFFICIENT_FUNDS");
  }

  const fromAfter = from.balance - t.amount;
  const toAfter = to.balance + t.amount;
  await ctx.db.patch(from._id, { balance: fromAfter });
  await ctx.db.patch(to._id, { balance: toAfter });

  const txId = crypto.randomUUID();
  const common = {
    txId,
    amount: t.amount,
    reason: t.reason,
    dealId: t.dealId,
    idempotencyKey: t.idempotencyKey,
  };
  await ctx.db.insert("ledgerEntries", {
    ...common,
    accountId: from._id,
    counterAccountId: to._id,
    direction: "debit",
    balanceAfter: fromAfter,
  });
  await ctx.db.insert("ledgerEntries", {
    ...common,
    accountId: to._id,
    counterAccountId: from._id,
    direction: "credit",
    balanceAfter: toAfter,
  });
  return { txId, replayed: false };
}

// Full scan: for tests and the admin panel only.
export async function verifyLedger(ctx: QueryCtx) {
  const accounts = await ctx.db.query("accounts").collect();
  const entries = await ctx.db.query("ledgerEntries").collect();

  const sums = new Map<string, number>();
  for (const e of entries) {
    const delta = e.direction === "credit" ? e.amount : -e.amount;
    sums.set(e.accountId, (sums.get(e.accountId) ?? 0) + delta);
  }

  const total = accounts.reduce((s, a) => s + a.balance, 0);
  const mismatches = accounts
    .filter((a) => (sums.get(a._id) ?? 0) !== a.balance)
    .map((a) => a._id);

  return { ok: total === 0 && mismatches.length === 0, total, mismatches };
}