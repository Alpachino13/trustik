import { convexTest } from "convex-test";
import { describe, expect, it } from "vitest";
import type { MutationCtx } from "./_generated/server";
import type { Id } from "./_generated/dataModel";
import { api } from "./_generated/api";
import schema from "./schema";
import { modules } from "./test.setup";
import { postTransfer, systemAccount, verifyLedger, walletAccount } from "./domain/ledger";
import { fundDeal, releaseDeal } from "./domain/deals";
import { heldForBuyer } from "./domain/escrow";
import { acceptListing, createListing, removeListing } from "./domain/listings";

const mkUser = (ctx: MutationCtx, email: string, firstName: string) =>
  ctx.db.insert("users", { email, firstName, lastName: "Test", emailVerificationTime: Date.now() });

const base = {
  side: "selling" as const, title: "Used laptop", description: "Good condition, 1 year old",
  category: "electronics" as const, amountDzd: 1_000,
};

async function setup() {
  const t = convexTest(schema, modules);
  const s = await t.run(async (ctx) => ({
    alice: await mkUser(ctx, "alice@example.com", "Alice"),
    bob: await mkUser(ctx, "bob@example.com", "Bob"),
  }));
  return { t, ...s };
}

async function deposit(ctx: MutationCtx, userId: Id<"users">, amount: number) {
  const w = await walletAccount(ctx, userId);
  const ext = await systemAccount(ctx, "external");
  await postTransfer(ctx, { from: ext._id, to: w._id, amount, reason: "deposit" });
}

describe("listings", () => {
  it("validates input and caps open listings", async () => {
    const { t, alice } = await setup();
    for (const bad of [
      { ...base, title: "abc" }, { ...base, description: "short" },
      { ...base, amountDzd: 50 }, { ...base, amountDzd: 10.5 }, { ...base, amountDzd: 10_000_001 },
      { ...base, city: "x".repeat(61) },
    ]) {
      await expect(t.run((ctx) => createListing(ctx, alice, bad))).rejects.toThrow();
    }
    for (let i = 0; i < 10; i++) await t.run((ctx) => createListing(ctx, alice, base));
    await expect(t.run((ctx) => createListing(ctx, alice, base))).rejects.toThrow();
  });

  it("accepting a selling listing: acceptor buys, and the deal works end to end", async () => {
    const { t, alice, bob } = await setup();
    const listingId = await t.run((ctx) => createListing(ctx, alice, base)); // Alice sells 1000 DZD
    const dealId = await t.run(async (ctx) => {
      await deposit(ctx, bob, 200_000);
      return acceptListing(ctx, bob, listingId);
    });

    const r = await t.run(async (ctx) => ({
      deal: await ctx.db.get(dealId), listing: await ctx.db.get(listingId),
    }));
    expect(r.deal).toMatchObject({ status: "accepted", buyerId: bob, sellerId: alice, amount: 100_000 });
    expect(r.deal?.escrowAccountId).toBeDefined();
    expect(r.listing).toMatchObject({ status: "accepted", dealId });

    await t.run((ctx) => fundDeal(ctx, bob, dealId));
    expect(await t.run((ctx) => heldForBuyer(ctx, bob))).toBe(100_000); // buyer's money is held
    expect(await t.run((ctx) => heldForBuyer(ctx, alice))).toBe(0); // the seller holds nothing

    await t.run((ctx) => releaseDeal(ctx, bob, dealId));
    const out = await t.run(async (ctx) => ({
      seller: (await walletAccount(ctx, alice)).balance,
      held: await heldForBuyer(ctx, bob),
      check: await verifyLedger(ctx),
    }));
    expect(out.seller).toBe(97_500); // 100 000 minus the 2.5 % fee
    expect(out.held).toBe(0);
    expect(out.check.ok).toBe(true);
  });

  it("accepting a buying listing: acceptor becomes the seller", async () => {
    const { t, alice, bob } = await setup();
    const listingId = await t.run((ctx) => createListing(ctx, alice, { ...base, side: "buying" }));
    const dealId = await t.run((ctx) => acceptListing(ctx, bob, listingId));
    const deal = await t.run((ctx) => ctx.db.get(dealId));
    expect(deal).toMatchObject({ buyerId: alice, sellerId: bob, creatorRole: "buyer" });
  });

  it("cannot accept your own, twice, or a removed listing", async () => {
    const { t, alice, bob } = await setup();
    const a = await t.run((ctx) => createListing(ctx, alice, base));
    await expect(t.run((ctx) => acceptListing(ctx, alice, a))).rejects.toThrow();
    await t.run((ctx) => acceptListing(ctx, bob, a));
    await expect(t.run((ctx) => acceptListing(ctx, bob, a))).rejects.toThrow();

    const b = await t.run((ctx) => createListing(ctx, alice, base));
    await t.run((ctx) => removeListing(ctx, alice, b));
    await expect(t.run((ctx) => acceptListing(ctx, bob, b))).rejects.toThrow();
  });

  it("only the creator can remove, and only while open", async () => {
    const { t, alice, bob } = await setup();
    const id = await t.run((ctx) => createListing(ctx, alice, base));
    await expect(t.run((ctx) => removeListing(ctx, bob, id))).rejects.toThrow();
    await t.run((ctx) => acceptListing(ctx, bob, id));
    await expect(t.run((ctx) => removeListing(ctx, alice, id))).rejects.toThrow();
  });

  it("browse hides your own and non-open listings, applies filters, never leaks emails", async () => {
    const { t, alice, bob } = await setup();
    await t.run(async (ctx) => {
      await createListing(ctx, alice, { ...base, title: "Cheap phone", category: "electronics", amountDzd: 500, city: "Tlemcen" });
      await createListing(ctx, alice, { ...base, title: "Old sofa set", category: "home", amountDzd: 3_000 });
      await createListing(ctx, alice, { ...base, title: "Web design job", category: "services", side: "buying", amountDzd: 2_000 });
      const gone = await createListing(ctx, alice, { ...base, title: "Removed item" });
      await removeListing(ctx, alice, gone);
      await createListing(ctx, bob, { ...base, title: "Bob own listing" });
    });

    const asBob = t.withIdentity({ subject: `${bob}|session` });
    const run = async (extra: object = {}) =>
      (await asBob.query(api.listings.browse, { paginationOpts: { numItems: 20, cursor: null }, ...extra })).page;
    const titles = async (extra: object = {}) => (await run(extra)).map((l) => l.title);

    expect((await titles()).sort()).toEqual(["Cheap phone", "Old sofa set", "Web design job"]);
    expect(await titles({ category: "home" })).toEqual(["Old sofa set"]);
    expect(await titles({ side: "buying" })).toEqual(["Web design job"]);
    expect(await titles({ minDzd: 1_000, maxDzd: 2_500 })).toEqual(["Web design job"]);

    const first = (await run())[0];
    expect(first.posterName).toBe("Alice T.");
    expect(JSON.stringify(await run())).not.toContain("alice@example.com");
  });

  it("anonymous callers cannot browse", async () => {
    const { t } = await setup();
    await expect(
      t.query(api.listings.browse, { paginationOpts: { numItems: 5, cursor: null } }),
    ).rejects.toThrow();
  });
});
