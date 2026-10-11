import { convexTest } from "convex-test";
import { describe, expect, it } from "vitest";
import type { MutationCtx } from "./_generated/server";
import type { Id } from "./_generated/dataModel";
import schema from "./schema";
import { modules } from "./test.setup";
import { postTransfer, systemAccount, verifyLedger, walletAccount } from "./domain/ledger";
import { acceptDeal, createDeal, fundDeal, releaseDeal } from "./domain/deals";
import { addDisputeMessage, openDispute, settleDispute } from "./domain/disputes";

const mkUser = (ctx: MutationCtx, email: string, role?: "user" | "admin") =>
  ctx.db.insert("users", { email, emailVerificationTime: Date.now(), role });

async function deposit(ctx: MutationCtx, userId: Id<"users">, amount: number) {
  const wallet = await walletAccount(ctx, userId);
  const ext = await systemAccount(ctx, "external");
  await postTransfer(ctx, { from: ext._id, to: wallet._id, amount, reason: "deposit" });
}

// buyer deposits 200 000, deal of 100 000, optionally funded
async function setup(fund = true) {
  const t = convexTest(schema, modules);
  const s = await t.run(async (ctx) => {
    const buyer = await mkUser(ctx, "buyer@example.com");
    const seller = await mkUser(ctx, "seller@example.com");
    const stranger = await mkUser(ctx, "stranger@example.com");
    const admin = await mkUser(ctx, "mod@example.com", "admin");
    await deposit(ctx, buyer, 200_000);
    const dealId = await createDeal(ctx, {
      userId: buyer, role: "buyer", counterpartyEmail: "seller@example.com",
      title: "Laptop", description: "Used laptop", amount: 100_000,
    });
    await acceptDeal(ctx, seller, dealId);
    if (fund) await fundDeal(ctx, buyer, dealId);
    return { buyer, seller, stranger, admin, dealId };
  });
  return { t, ...s };
}

const snapshot = (t: Awaited<ReturnType<typeof setup>>["t"], buyer: Id<"users">, seller: Id<"users">, dealId: Id<"deals">) =>
  t.run(async (ctx) => ({
    buyerW: (await walletAccount(ctx, buyer)).balance,
    sellerW: (await walletAccount(ctx, seller)).balance,
    escrow: (await ctx.db.query("accounts").withIndex("by_deal", (q) => q.eq("dealId", dealId)).first())?.balance,
    deal: await ctx.db.get(dealId),
    check: await verifyLedger(ctx),
  }));

describe("disputes", () => {
  it("either party opens a dispute and release is then blocked", async () => {
    const { t, buyer, seller, dealId } = await setup();
    await t.run((ctx) => openDispute(ctx, seller, dealId, "Buyer says the item is wrong"));
    const deal = await t.run((ctx) => ctx.db.get(dealId));
    expect(deal?.status).toBe("disputed");
    await expect(t.run((ctx) => releaseDeal(ctx, buyer, dealId))).rejects.toThrow();
  });

  it("only a party can open one, and only once the deal is funded", async () => {
    const funded = await setup();
    await expect(
      funded.t.run((ctx) => openDispute(ctx, funded.stranger, funded.dealId, "I am not part of this")),
    ).rejects.toThrow();

    const unfunded = await setup(false);
    await expect(
      unfunded.t.run((ctx) => openDispute(ctx, unfunded.buyer, unfunded.dealId, "Nothing funded yet")),
    ).rejects.toThrow();
  });

  it("rejects an empty or too-short reason", async () => {
    const { t, buyer, dealId } = await setup();
    await expect(t.run((ctx) => openDispute(ctx, buyer, dealId, "   "))).rejects.toThrow();
    await expect(t.run((ctx) => openDispute(ctx, buyer, dealId, "bad"))).rejects.toThrow();
  });

  it("settles 50/50: both sides credited, escrow emptied, ledger balanced", async () => {
    const { t, buyer, seller, admin, dealId } = await setup();
    await t.run(async (ctx) => {
      await openDispute(ctx, buyer, dealId, "The work was not delivered");
      await settleDispute(ctx, admin, dealId, 5_000, "Split evenly");
    });
    const r = await snapshot(t, buyer, seller, dealId);
    expect(r.buyerW).toBe(150_000); // 100 000 left + 50 000 back
    expect(r.sellerW).toBe(50_000);
    expect(r.escrow).toBe(0);
    expect(r.deal?.status).toBe("settled");
    expect(r.check.ok).toBe(true);
  });

  it("full refund: seller gets nothing", async () => {
    const { t, buyer, seller, admin, dealId } = await setup();
    await t.run(async (ctx) => {
      await openDispute(ctx, buyer, dealId, "Item never arrived at all");
      await settleDispute(ctx, admin, dealId, 10_000);
    });
    const r = await snapshot(t, buyer, seller, dealId);
    expect(r.buyerW).toBe(200_000);
    expect(r.sellerW).toBe(0);
    expect(r.check.ok).toBe(true);
  });

  it("full release: seller gets everything", async () => {
    const { t, buyer, seller, admin, dealId } = await setup();
    await t.run(async (ctx) => {
      await openDispute(ctx, buyer, dealId, "I changed my mind about it");
      await settleDispute(ctx, admin, dealId, 0);
    });
    const r = await snapshot(t, buyer, seller, dealId);
    expect(r.buyerW).toBe(100_000);
    expect(r.sellerW).toBe(100_000);
    expect(r.check.ok).toBe(true);
  });

  it("only a moderator who is not a party can settle", async () => {
    const { t, buyer, seller, stranger, dealId } = await setup();
    await t.run((ctx) => openDispute(ctx, buyer, dealId, "The work was not delivered"));
    await expect(t.run((ctx) => settleDispute(ctx, stranger, dealId, 5_000))).rejects.toThrow();
    await expect(t.run((ctx) => settleDispute(ctx, seller, dealId, 5_000))).rejects.toThrow();

    await t.run((ctx) => ctx.db.patch(buyer, { role: "admin" })); // admin but a party
    await expect(t.run((ctx) => settleDispute(ctx, buyer, dealId, 5_000))).rejects.toThrow();
  });

  it("cannot settle twice, nor settle a deal that is not disputed", async () => {
    const a = await setup();
    await a.t.run(async (ctx) => {
      await openDispute(ctx, a.buyer, a.dealId, "The work was not delivered");
      await settleDispute(ctx, a.admin, a.dealId, 5_000);
    });
    await expect(a.t.run((ctx) => settleDispute(ctx, a.admin, a.dealId, 5_000))).rejects.toThrow();

    const b = await setup();
    await expect(b.t.run((ctx) => settleDispute(ctx, b.admin, b.dealId, 5_000))).rejects.toThrow();
  });

  it("messages: parties and moderator can write, strangers and closed disputes cannot", async () => {
    const { t, buyer, seller, stranger, admin, dealId } = await setup();
    const disputeId = await t.run((ctx) => openDispute(ctx, buyer, dealId, "The work was not delivered"));

    await t.run(async (ctx) => {
      await addDisputeMessage(ctx, seller, disputeId, "I sent it on Monday");
      await addDisputeMessage(ctx, admin, disputeId, "Please share the tracking number");
    });
    await expect(t.run((ctx) => addDisputeMessage(ctx, stranger, disputeId, "hello"))).rejects.toThrow();
    await expect(t.run((ctx) => addDisputeMessage(ctx, buyer, disputeId, "  "))).rejects.toThrow();

    const messages = await t.run((ctx) => ctx.db.query("disputeMessages").collect());
    expect(messages).toHaveLength(2);

    await t.run((ctx) => settleDispute(ctx, admin, dealId, 5_000));
    await expect(t.run((ctx) => addDisputeMessage(ctx, buyer, disputeId, "too late"))).rejects.toThrow();
  });
});