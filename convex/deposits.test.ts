import { convexTest } from "convex-test";
import { describe, expect, it } from "vitest";
import schema from "./schema";
import { modules } from "./test.setup";
import { closeDeposit, confirmDeposit, createPendingDeposit, attachCheckout } from "./domain/deposits";
import { systemAccount, verifyLedger, walletAccount } from "./domain/ledger";
import { hmacSha256Hex, verifySignature } from "./lib/hmac";

async function setup() {
  const t = convexTest(schema, modules);
  const { userId, depositId } = await t.run(async (ctx) => {
    const userId = await ctx.db.insert("users", { email: "u@example.com" });
    const depositId = await createPendingDeposit(ctx, userId, 2_000);
    await attachCheckout(ctx, depositId, "chk_1", "https://pay.example/chk_1");
    return { userId, depositId };
  });
  return { t, userId, depositId };
}

describe("deposits", () => {
  it("credits the wallet once the paid event is confirmed", async () => {
    const { t, userId, depositId } = await setup();
    const result = await t.run((ctx) => confirmDeposit(ctx, { checkoutId: "chk_1", paidAmountDzd: 2_000 }));
    expect(result).toBe("credited");
    const r = await t.run(async (ctx) => ({
      wallet: (await walletAccount(ctx, userId)).balance,
      deposit: await ctx.db.get(depositId),
      check: await verifyLedger(ctx),
    }));
    expect(r.wallet).toBe(200_000); // 2 000 DZD in centimes
    expect(r.deposit?.status).toBe("paid");
    expect(r.check.ok).toBe(true);
  });

  it("never credits twice when the webhook is retried", async () => {
    const { t, userId } = await setup();
    const first = await t.run((ctx) => confirmDeposit(ctx, { checkoutId: "chk_1", paidAmountDzd: 2_000 }));
    const second = await t.run((ctx) => confirmDeposit(ctx, { checkoutId: "chk_1", paidAmountDzd: 2_000 }));
    expect(first).toBe("credited");
    expect(second).toBe("replayed");
    const wallet = await t.run(async (ctx) => (await walletAccount(ctx, userId)).balance);
    expect(wallet).toBe(200_000);
  });

  it("refuses to credit when the paid amount differs", async () => {
    const { t, userId } = await setup();
    const result = await t.run((ctx) => confirmDeposit(ctx, { checkoutId: "chk_1", paidAmountDzd: 9_999 }));
    expect(result).toBe("amount_mismatch");
    const wallet = await t.run(async (ctx) => (await walletAccount(ctx, userId)).balance);
    expect(wallet).toBe(0);
  });

  it("ignores unknown checkouts", async () => {
    const { t } = await setup();
    const result = await t.run((ctx) => confirmDeposit(ctx, { checkoutId: "nope", paidAmountDzd: 2_000 }));
    expect(result).toBe("unknown_checkout");
  });

  it("a late failed event cannot undo a paid deposit", async () => {
    const { t, depositId } = await setup();
    await t.run((ctx) => confirmDeposit(ctx, { checkoutId: "chk_1", paidAmountDzd: 2_000 }));
    await t.run((ctx) => closeDeposit(ctx, "chk_1", "failed"));
    const deposit = await t.run((ctx) => ctx.db.get(depositId));
    expect(deposit?.status).toBe("paid");
  });

  it("marks a pending deposit failed or expired", async () => {
    const { t, depositId } = await setup();
    await t.run((ctx) => closeDeposit(ctx, "chk_1", "expired"));
    expect((await t.run((ctx) => ctx.db.get(depositId)))?.status).toBe("expired");
  });

  it("rejects out-of-range and fractional top-ups", async () => {
    const t = convexTest(schema, modules);
    const userId = await t.run((ctx) => ctx.db.insert("users", {}));
    for (const amount of [0, 50, 99, 500_001, 150.5, -200]) {
      await expect(t.run((ctx) => createPendingDeposit(ctx, userId, amount))).rejects.toThrow();
    }
  });

  it("verifies webhook signatures and rejects tampering", async () => {
    const secret = "test_secret";
    const payload = JSON.stringify({ type: "checkout.paid", data: { id: "chk_1", amount: 2000 } });
    const sig = await hmacSha256Hex(secret, payload);
    expect(await verifySignature(secret, payload, sig)).toBe(true);
    expect(await verifySignature(secret, payload.replace("2000", "9000"), sig)).toBe(false);
    expect(await verifySignature("other_secret", payload, sig)).toBe(false);
    expect(await verifySignature(secret, payload, "")).toBe(false);
  });
});