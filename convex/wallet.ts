import { paginationOptsValidator } from "convex/server";
import { query } from "./_generated/server";
import { requireUser } from "./lib/auth";

export const me = query({
  args: {},
  handler: async (ctx) => {
    const userId = await requireUser(ctx);
    const account = await ctx.db
      .query("accounts")
      .withIndex("by_user_kind", (q) => q.eq("userId", userId).eq("kind", "wallet"))
      .unique();
    return { balance: account?.balance ?? 0 };
  },
});

export const history = query({
  args: { paginationOpts: paginationOptsValidator },
  handler: async (ctx, args) => {
    const userId = await requireUser(ctx);
    const account = await ctx.db
      .query("accounts")
      .withIndex("by_user_kind", (q) => q.eq("userId", userId).eq("kind", "wallet"))
      .unique();
    if (!account) return { page: [], isDone: true, continueCursor: "" };
    return await ctx.db
      .query("ledgerEntries")
      .withIndex("by_account", (q) => q.eq("accountId", account._id))
      .order("desc")
      .paginate(args.paginationOpts);
  },
});