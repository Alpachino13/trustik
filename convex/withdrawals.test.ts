import { convexTest } from "convex-test";
import { describe, expect, it } from "vitest";
import type { MutationCtx } from "./_generated/server";
import type { Id } from "./_generated/dataModel";
import schema from "./schema";
import { modules } from "./test.setup";
import { postTransfer, systemAccount, verifyLedger, walletAccount } from "./domain/ledger";
import { reviewKyc, submitKyc } from "./domain/kyc";
import { approveWithdrawal, rejectWithdrawal, requestWithdrawal } from "./domain/withdrawals";

const payout = { method: "ccp" as const, accountHolder: "Test User", accountNumber: "0012345678 90" };

async function deposit(ctx: MutationCtx, userId: Id<"users">, amount: number) {
  const w = await walletAccount(ctx, userId);
  const ext = await systemAccount(ctx, "external");
  await postTransfer(ctx, { from: ext._id, to: w._id, amount, reason: "deposit" });
}

async function setup(kyc: "approved" | "none" = "approved") {
  const t = convexTest(schema, modules);
  const s = await t.run(async (ctx) => {
    const user = await ctx.db.insert("users", { email: "u@example.com", kycStatus: kyc });
    const admin = await ctx.db.insert("users", { email: "admin@example.com", role: "admin" });
    await deposit(ctx, user, 1_000_000); // 10 000 DZD
    return { user, admin };
  });
  return { t, ...s };
}

describe("withdrawals", () => {
  it("deducts the balance immediately and keeps the ledger balanced", async () => {
    const { t, user } = await setup();
    const id = await t.run((ctx) => requestWithdrawal(ctx, user, { amountDzd: 2_000, ...payout }));
    const r = await t.run(async (ctx) => ({
      w: await ctx.db.get(id),
      bal: (await walletAccount(ctx, user)).balance,
      check: await verifyLedger(ctx),
    }));
    expect(r.w?.status).toBe("pending");
    expect(r.w?.accountNumber).toBe("001234567890"); // spaces stripped
    expect(r.bal).toBe(800_000);
    expect(r.check.ok).toBe(true);
  });

  it("requires approved identity verification", async () => {
    const { t, user } = await setup("none");
    await expect(t.run((ctx) => requestWithdrawal(ctx, user, { amountDzd: 1_000, ...payout }))).rejects.toThrow();
  });

  it("rejects too little, too much, fractional and over-balance amounts", async () => {
    const { t, user } = await setup();
    for (const amountDzd of [0, 499, 1_000_001, 700.5, 20_000]) {
      await expect(t.run((ctx) => requestWithdrawal(ctx, user, { amountDzd, ...payout }))).rejects.toThrow();
    }
    const bal = await t.run(async (ctx) => (await walletAccount(ctx, user)).balance);
    expect(bal).toBe(1_000_000);
  });

  it("limits the number of pending withdrawals", async () => {
    const { t, user } = await setup();
    for (let i = 0; i < 3; i++) {
      await t.run((ctx) => requestWithdrawal(ctx, user, { amountDzd: 500, ...payout }));
    }
    await expect(t.run((ctx) => requestWithdrawal(ctx, user, { amountDzd: 500, ...payout }))).rejects.toThrow();
  });

  it("approval keeps the money out and cannot be repeated", async () => {
    const { t, user, admin } = await setup();
    const id = await t.run((ctx) => requestWithdrawal(ctx, user, { amountDzd: 2_000, ...payout }));
    await t.run((ctx) => approveWithdrawal(ctx, admin, id, "paid by CCP"));
    const r = await t.run(async (ctx) => ({
      w: await ctx.db.get(id), bal: (await walletAccount(ctx, user)).balance,
    }));
    expect(r.w?.status).toBe("approved");
    expect(r.bal).toBe(800_000);
    await expect(t.run((ctx) => approveWithdrawal(ctx, admin, id))).rejects.toThrow();
    await expect(t.run((ctx) => rejectWithdrawal(ctx, admin, id))).rejects.toThrow();
  });

  it("rejection returns the money exactly once", async () => {
    const { t, user, admin } = await setup();
    const id = await t.run((ctx) => requestWithdrawal(ctx, user, { amountDzd: 2_000, ...payout }));
    await t.run((ctx) => rejectWithdrawal(ctx, admin, id, "wrong account number"));
    await expect(t.run((ctx) => rejectWithdrawal(ctx, admin, id))).rejects.toThrow();
    const r = await t.run(async (ctx) => ({
      bal: (await walletAccount(ctx, user)).balance, check: await verifyLedger(ctx),
    }));
    expect(r.bal).toBe(1_000_000);
    expect(r.check.ok).toBe(true);
  });

  it("only moderators can review, and never their own withdrawal", async () => {
    const { t, user, admin } = await setup();
    const id = await t.run((ctx) => requestWithdrawal(ctx, user, { amountDzd: 1_000, ...payout }));
    await expect(t.run((ctx) => approveWithdrawal(ctx, user, id))).rejects.toThrow();

    await t.run(async (ctx) => {
      await ctx.db.patch(admin, { kycStatus: "approved" });
      await deposit(ctx, admin, 500_000);
    });
    const own = await t.run((ctx) => requestWithdrawal(ctx, admin, { amountDzd: 1_000, ...payout }));
    await expect(t.run((ctx) => approveWithdrawal(ctx, admin, own))).rejects.toThrow();
  });
});

describe("kyc", () => {
  const mkFile = (t: ReturnType<typeof convexTest>) => t.run((ctx) => ctx.storage.store(new Blob(["id-scan"])));
  const doc = { fullName: "Test User", documentType: "national_id" as const, documentNumber: "123456789" };

  it("submit sets pending, approval unlocks, a second submit is blocked", async () => {
    const t = convexTest(schema, modules);
    const { user, admin } = await t.run(async (ctx) => ({
      user: await ctx.db.insert("users", { email: "u@example.com", kycStatus: "none" as const }),
      admin: await ctx.db.insert("users", { email: "a@example.com", role: "admin" as const }),
    }));
    const file = await mkFile(t);

    const sub = await t.run((ctx) => submitKyc(ctx, user, { ...doc, documentFileId: file }));
    expect((await t.run((ctx) => ctx.db.get(user)))?.kycStatus).toBe("pending");
    await expect(t.run((ctx) => submitKyc(ctx, user, { ...doc, documentFileId: file }))).rejects.toThrow();

    await t.run((ctx) => reviewKyc(ctx, admin, sub, true));
    expect((await t.run((ctx) => ctx.db.get(user)))?.kycStatus).toBe("approved");
    await expect(t.run((ctx) => reviewKyc(ctx, admin, sub, true))).rejects.toThrow();
  });

  it("a rejected user can resubmit; non-moderators cannot review", async () => {
    const t = convexTest(schema, modules);
    const { user, admin, other } = await t.run(async (ctx) => ({
      user: await ctx.db.insert("users", { email: "u@example.com", kycStatus: "none" as const }),
      admin: await ctx.db.insert("users", { email: "a@example.com", role: "admin" as const }),
      other: await ctx.db.insert("users", { email: "o@example.com" }),
    }));
    const file = await mkFile(t);
    const sub = await t.run((ctx) => submitKyc(ctx, user, { ...doc, documentFileId: file }));

    await expect(t.run((ctx) => reviewKyc(ctx, other, sub, true))).rejects.toThrow();
    await t.run((ctx) => reviewKyc(ctx, admin, sub, false, "blurry photo"));
    expect((await t.run((ctx) => ctx.db.get(user)))?.kycStatus).toBe("rejected");

    await t.run((ctx) => submitKyc(ctx, user, { ...doc, documentFileId: file }));
    expect((await t.run((ctx) => ctx.db.get(user)))?.kycStatus).toBe("pending");
  });
});