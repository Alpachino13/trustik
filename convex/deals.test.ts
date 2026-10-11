import { convexTest } from "convex-test";
import { describe, expect, it } from "vitest";
import type { MutationCtx } from "./_generated/server";
import type { Id } from "./_generated/dataModel";
import schema from "./schema";
import { modules } from "./test.setup";
import { postTransfer, systemAccount, verifyLedger, walletAccount } from "./domain/ledger";
import { acceptDeal, cancelDeal, createDeal, fundDeal, releaseDeal } from "./domain/deals";

const mkUser = (ctx: MutationCtx, email: string, verified = true) =>
  ctx.db.insert("users", { email, emailVerificationTime: verified ? Date.now() : undefined });

async function deposit(ctx: MutationCtx, userId: Id<"users">, amount: number) {
  const wallet = await walletAccount(ctx, userId);
  const ext = await systemAccount(ctx, "external");
  await postTransfer(ctx, { from: ext._id, to: wallet._id, amount, reason: "deposit" });
}

async function accepted(amountDeposited = 200_000) {
  const t = convexTest(schema, modules);
  const s = await t.run(async (ctx) => {
    const buyer = await mkUser(ctx, "buyer@example.com");
    const seller = await mkUser(ctx, "seller@example.com");
    await deposit(ctx, buyer, amountDeposited);
    const dealId = await createDeal(ctx, {
      userId: buyer, role: "buyer", counterpartyEmail: "seller@example.com",
      title: "Laptop", description: "Used laptop", amount: 100_000,
    });
    await acceptDeal(ctx, seller, dealId);
    return { buyer, seller, dealId };
  });
  return { t, ...s };
}

describe("deal lifecycle", () => {
  it("funds, releases, pays the seller net of fee and keeps the ledger balanced", async () => {
    const { t, buyer, seller, dealId } = await accepted();
    await t.run(async (ctx) => {
      await fundDeal(ctx, buyer, dealId);
      await releaseDeal(ctx, buyer, dealId);
    });

    const r = await t.run(async (ctx) => ({
      deal: await ctx.db.get(dealId),
      buyerW: await walletAccount(ctx, buyer),
      sellerW: await walletAccount(ctx, seller),
      escrow: await ctx.db.query("accounts").withIndex("by_deal", (q) => q.eq("dealId", dealId)).first(),
      fees: await systemAccount(ctx, "fees"),
      check: await verifyLedger(ctx),
    }));
    expect(r.deal?.status).toBe("released");
    expect(r.buyerW.balance).toBe(100_000);
    expect(r.sellerW.balance).toBe(97_500); // 100 000 - 2.5 %
    expect(r.fees.balance).toBe(2_500);
    expect(r.escrow?.balance).toBe(0);
    expect(r.check.ok).toBe(true);
  });

  it("refuses to fund without enough balance", async () => {
    const { t, buyer, dealId } = await accepted(50_000);
    await expect(t.run((ctx) => fundDeal(ctx, buyer, dealId))).rejects.toThrow();
    const deal = await t.run((ctx) => ctx.db.get(dealId));
    expect(deal?.status).toBe("accepted");
  });

  it("cannot fund twice or release before funding", async () => {
    const { t, buyer, dealId } = await accepted();
    await expect(t.run((ctx) => releaseDeal(ctx, buyer, dealId))).rejects.toThrow();
    await t.run((ctx) => fundDeal(ctx, buyer, dealId));
    await expect(t.run((ctx) => fundDeal(ctx, buyer, dealId))).rejects.toThrow();
  });

  it("only the buyer can fund or release", async () => {
    const { t, seller, dealId, buyer } = await accepted();
    await expect(t.run((ctx) => fundDeal(ctx, seller, dealId))).rejects.toThrow();
    await t.run((ctx) => fundDeal(ctx, buyer, dealId));
    await expect(t.run((ctx) => releaseDeal(ctx, seller, dealId))).rejects.toThrow();
  });

  it("only the counterparty can accept", async () => {
    const t = convexTest(schema, modules);
    const { buyer, stranger, dealId } = await t.run(async (ctx) => {
      const buyer = await mkUser(ctx, "buyer@example.com");
      await mkUser(ctx, "seller@example.com");
      const stranger = await mkUser(ctx, "stranger@example.com");
      const dealId = await createDeal(ctx, {
        userId: buyer, role: "buyer", counterpartyEmail: "seller@example.com",
        title: "x", description: "x", amount: 1_000,
      });
      return { buyer, stranger, dealId };
    });
    await expect(t.run((ctx) => acceptDeal(ctx, buyer, dealId))).rejects.toThrow();
    await expect(t.run((ctx) => acceptDeal(ctx, stranger, dealId))).rejects.toThrow();
  });

  it("invite by email: deal waits, and claiming needs a verified email", async () => {
    const t = convexTest(schema, modules);
    const { seller, dealId } = await t.run(async (ctx) => {
      const buyer = await mkUser(ctx, "buyer@example.com");
      const dealId = await createDeal(ctx, {
        userId: buyer, role: "buyer", counterpartyEmail: "New@Example.com",
        title: "x", description: "x", amount: 1_000,
      });
      const seller = await mkUser(ctx, "new@example.com", false); // registers later
      return { seller, dealId };
    });

    await expect(t.run((ctx) => acceptDeal(ctx, seller, dealId))).rejects.toThrow();
    await t.run((ctx) => ctx.db.patch(seller, { emailVerificationTime: Date.now() }));
    await t.run((ctx) => acceptDeal(ctx, seller, dealId));

    const deal = await t.run((ctx) => ctx.db.get(dealId));
    expect(deal?.status).toBe("accepted");
    expect(deal?.sellerId).toBe(seller);
    expect(deal?.inviteEmail).toBeUndefined();
  });

  it("can cancel before funding, not after", async () => {
    const { t, buyer, seller, dealId } = await accepted();
    await t.run((ctx) => fundDeal(ctx, buyer, dealId));
    await expect(t.run((ctx) => cancelDeal(ctx, seller, dealId))).rejects.toThrow();

    const second = await accepted();
    await second.t.run((ctx) => cancelDeal(ctx, second.seller, second.dealId));
    const deal = await second.t.run((ctx) => ctx.db.get(second.dealId));
    expect(deal?.status).toBe("cancelled");
  });
});