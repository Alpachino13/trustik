import { convexTest } from "convex-test";
import { describe, expect, it } from "vitest";
import schema from "./schema";
import { modules } from "./test.setup";
import {
  postTransfer,
  systemAccount,
  verifyLedger,
  walletAccount,
} from "./domain/ledger";

async function setup() {
  const t = convexTest(schema, modules);
  const ids = await t.run(async (ctx) => {
    const userId = await ctx.db.insert("users", {});
    const wallet = await walletAccount(ctx, userId);
    const external = await systemAccount(ctx, "external");
    return { walletId: wallet._id, externalId: external._id };
  });
  return { t, ...ids };
}

describe("ledger", () => {
  it("moves money and records balanceAfter on both sides", async () => {
    const { t, walletId, externalId } = await setup();

    await t.run(async (ctx) => {
      await postTransfer(ctx, {
        from: externalId,
        to: walletId,
        amount: 500_000,
        reason: "deposit",
      });
    });

    const { wallet, entries } = await t.run(async (ctx) => ({
      wallet: await ctx.db.get(walletId),
      entries: await ctx.db.query("ledgerEntries").collect(),
    }));
    expect(wallet?.balance).toBe(500_000);
    expect(entries).toHaveLength(2);
    expect(entries.find((e) => e.accountId === walletId)?.balanceAfter).toBe(500_000);
    expect(entries.find((e) => e.accountId === externalId)?.balanceAfter).toBe(-500_000);
  });

  it("rejects a transfer that exceeds the balance and changes nothing", async () => {
    const { t, walletId, externalId } = await setup();

    await t.run(async (ctx) => {
      await postTransfer(ctx, { from: externalId, to: walletId, amount: 1_000, reason: "deposit" });
    });

    await expect(
      t.run(async (ctx) => {
        const other = await systemAccount(ctx, "fees");
        await postTransfer(ctx, { from: walletId, to: other._id, amount: 2_000, reason: "escrow_fee" });
      }),
    ).rejects.toThrow();

    const wallet = await t.run(async (ctx) => ctx.db.get(walletId));
    expect(wallet?.balance).toBe(1_000);
  });

  it("is idempotent: the same key credits only once", async () => {
    const { t, walletId, externalId } = await setup();
    const transfer = {
      from: externalId,
      to: walletId,
      amount: 7_500,
      reason: "deposit" as const,
      idempotencyKey: "deposit:chargily_123",
    };

    const first = await t.run((ctx) => postTransfer(ctx, transfer));
    const second = await t.run((ctx) => postTransfer(ctx, transfer));

    expect(first.replayed).toBe(false);
    expect(second.replayed).toBe(true);
    expect(second.txId).toBe(first.txId);
    const wallet = await t.run(async (ctx) => ctx.db.get(walletId));
    expect(wallet?.balance).toBe(7_500);
  });

  it("rejects zero, negative and fractional amounts", async () => {
    const { t, walletId, externalId } = await setup();
    for (const amount of [0, -100, 10.5]) {
      await expect(
        t.run((ctx) =>
          postTransfer(ctx, { from: externalId, to: walletId, amount, reason: "deposit" }),
        ),
      ).rejects.toThrow();
    }
  });

  it("rejects a transfer to the same account", async () => {
    const { t, walletId } = await setup();
    await expect(
      t.run((ctx) =>
        postTransfer(ctx, { from: walletId, to: walletId, amount: 100, reason: "admin_adjustment" }),
      ),
    ).rejects.toThrow();
  });

  it("keeps the whole ledger balanced to zero", async () => {
    const { t, walletId, externalId } = await setup();

    await t.run(async (ctx) => {
      const fees = await systemAccount(ctx, "fees");
      await postTransfer(ctx, { from: externalId, to: walletId, amount: 100_000, reason: "deposit" });
      await postTransfer(ctx, { from: walletId, to: fees._id, amount: 2_500, reason: "escrow_fee" });
      await postTransfer(ctx, { from: walletId, to: externalId, amount: 50_000, reason: "withdrawal" });
    });

    const check = await t.run((ctx) => verifyLedger(ctx));
    expect(check).toEqual({ ok: true, total: 0, mismatches: [] });
  });
});