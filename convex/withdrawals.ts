import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { requireAdmin, requireUser } from "./lib/auth";
import { approveWithdrawal, rejectWithdrawal, requestWithdrawal } from "./domain/withdrawals";

export const request = mutation({
  args: {
    amountDzd: v.number(),
    method: v.union(v.literal("ccp"), v.literal("bank"), v.literal("baridimob")),
    accountHolder: v.string(),
    accountNumber: v.string(),
  },
  handler: async (ctx, args) => requestWithdrawal(ctx, await requireUser(ctx), args),
});

export const mine = query({
  args: {},
  handler: async (ctx) => {
    const userId = await requireUser(ctx);
    return await ctx.db.query("withdrawals").withIndex("by_user", (q) => q.eq("userId", userId)).order("desc").take(50);
  },
});

export const pending = query({
  args: {},
  handler: async (ctx) => {
    await requireAdmin(ctx);
    return await ctx.db.query("withdrawals").withIndex("by_status", (q) => q.eq("status", "pending")).collect();
  },
});

export const approve = mutation({
  args: { withdrawalId: v.id("withdrawals"), note: v.optional(v.string()) },
  handler: async (ctx, { withdrawalId, note }) => {
    const admin = await requireAdmin(ctx);
    return approveWithdrawal(ctx, admin._id, withdrawalId, note);
  },
});

export const reject = mutation({
  args: { withdrawalId: v.id("withdrawals"), note: v.optional(v.string()) },
  handler: async (ctx, { withdrawalId, note }) => {
    const admin = await requireAdmin(ctx);
    return rejectWithdrawal(ctx, admin._id, withdrawalId, note);
  },
});