import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { requireUser } from "./lib/auth";
import { fail } from "./lib/errors";
import { acceptDeal, cancelDeal, createDeal, fundDeal, releaseDeal, roleOf } from "./domain/deals";
import { openDispute } from "./domain/disputes";

export const create = mutation({
  args: {
    role: v.union(v.literal("buyer"), v.literal("seller")),
    counterpartyEmail: v.string(),
    title: v.string(),
    description: v.string(),
    amount: v.number(),
  },
  handler: async (ctx, args) => {
    const userId = await requireUser(ctx);
    return await createDeal(ctx, { userId, ...args });
  },
});

export const accept = mutation({
  args: { dealId: v.id("deals") },
  handler: async (ctx, { dealId }) => acceptDeal(ctx, await requireUser(ctx), dealId),
});

export const cancel = mutation({
  args: { dealId: v.id("deals") },
  handler: async (ctx, { dealId }) => cancelDeal(ctx, await requireUser(ctx), dealId),
});

export const fund = mutation({
  args: { dealId: v.id("deals") },
  handler: async (ctx, { dealId }) => fundDeal(ctx, await requireUser(ctx), dealId),
});

export const release = mutation({
  args: { dealId: v.id("deals") },
  handler: async (ctx, { dealId }) => releaseDeal(ctx, await requireUser(ctx), dealId),
});

export const dispute = mutation({
  args: { dealId: v.id("deals"), reason: v.string() },
  handler: async (ctx, { dealId, reason }) =>
    openDispute(ctx, await requireUser(ctx), dealId, reason),
});

export const mine = query({
  args: {},
  handler: async (ctx) => {
    const userId = await requireUser(ctx);
    const me = await ctx.db.get(userId);
    const asBuyer = await ctx.db.query("deals").withIndex("by_buyer", (q) => q.eq("buyerId", userId)).collect();
    const asSeller = await ctx.db.query("deals").withIndex("by_seller", (q) => q.eq("sellerId", userId)).collect();
    const invited =
      me?.email && me.emailVerificationTime
        ? await ctx.db.query("deals").withIndex("by_invite_email", (q) => q.eq("inviteEmail", me.email!.toLowerCase())).collect()
        : [];
    const all = [...asBuyer, ...asSeller, ...invited];
    const unique = [...new Map(all.map((d) => [d._id, d])).values()];
    return unique.sort((a, b) => b._creationTime - a._creationTime);
  },
});

export const get = query({
  args: { dealId: v.id("deals") },
  handler: async (ctx, { dealId }) => {
    const userId = await requireUser(ctx);
    const deal = await ctx.db.get(dealId);
    if (!deal) fail("NOT_FOUND");
    const me = await ctx.db.get(userId);
    const isInvitee = !!deal.inviteEmail && !!me?.emailVerificationTime && me.email?.toLowerCase() === deal.inviteEmail;
    if (roleOf(deal, userId) === null && !isInvitee) fail("FORBIDDEN");
    return { ...deal, myRole: roleOf(deal, userId) };
  },
});