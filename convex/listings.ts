import { paginationOptsValidator, type FilterBuilder, type NamedTableInfo } from "convex/server";
import { v } from "convex/values";
import { mutation, query, type QueryCtx } from "./_generated/server";
import type { DataModel, Doc, Id } from "./_generated/dataModel";
import { listingCategory } from "./schema";
import { requireUser } from "./lib/auth";
import { fail } from "./lib/errors";
import { acceptListing, createListing, removeListing } from "./domain/listings";

const side = v.union(v.literal("selling"), v.literal("buying"));
type F = FilterBuilder<NamedTableInfo<DataModel, "listings">>;

async function completedDeals(ctx: QueryCtx, userId: Id<"users">) {
  const [asBuyer, asSeller] = await Promise.all([
    ctx.db.query("deals").withIndex("by_buyer", (q) => q.eq("buyerId", userId)).take(200),
    ctx.db.query("deals").withIndex("by_seller", (q) => q.eq("sellerId", userId)).take(200),
  ]);
  return [...asBuyer, ...asSeller].filter((d) => d.status === "released" || d.status === "settled").length;
}

// Public view of the poster: never expose email, only first name + last initial.
async function withPoster(ctx: QueryCtx, l: Doc<"listings">) {
  const u = await ctx.db.get(l.creatorId);
  const first = (u?.firstName ?? u?.name ?? "").trim();
  const last = (u?.lastName ?? "").trim();
  return {
    ...l,
    posterName: first ? `${first}${last ? ` ${last[0]}.` : ""}` : "Membre Trustik",
    posterInitial: (first || "M")[0].toUpperCase(),
    posterVerified: u?.kycStatus === "approved",
    posterCompletedDeals: await completedDeals(ctx, l.creatorId),
  };
}

export const browse = query({
  args: {
    paginationOpts: paginationOptsValidator,
    search: v.optional(v.string()),
    category: v.optional(listingCategory),
    side: v.optional(side),
    minDzd: v.optional(v.number()),
    maxDzd: v.optional(v.number()),
  },
  handler: async (ctx, a) => {
    const userId = await requireUser(ctx);
    const term = a.search?.trim().slice(0, 100);
    const min = a.minDzd !== undefined ? Math.round(a.minDzd * 100) : undefined;
    const max = a.maxDzd !== undefined ? Math.round(a.maxDzd * 100) : undefined;

    const keep = (q: F) => {
      const c = [q.neq(q.field("creatorId"), userId)]; // other members' listings only
      if (a.category) c.push(q.eq(q.field("category"), a.category));
      if (a.side) c.push(q.eq(q.field("side"), a.side));
      if (min !== undefined) c.push(q.gte(q.field("amount"), min));
      if (max !== undefined) c.push(q.lte(q.field("amount"), max));
      return q.and(...c);
    };

    const page = term
      ? await ctx.db
          .query("listings")
          .withSearchIndex("search_text", (q) => q.search("searchText", term).eq("status", "open"))
          .filter(keep)
          .paginate(a.paginationOpts)
      : await ctx.db
          .query("listings")
          .withIndex("by_status", (q) => q.eq("status", "open"))
          .order("desc")
          .filter(keep)
          .paginate(a.paginationOpts);

    return { ...page, page: await Promise.all(page.page.map((l) => withPoster(ctx, l))) };
  },
});

export const mine = query({
  args: {},
  handler: async (ctx) => {
    const userId = await requireUser(ctx);
    return await ctx.db
      .query("listings")
      .withIndex("by_creator", (q) => q.eq("creatorId", userId))
      .order("desc")
      .take(50);
  },
});

export const get = query({
  args: { listingId: v.id("listings") },
  handler: async (ctx, { listingId }) => {
    const userId = await requireUser(ctx);
    const l = await ctx.db.get(listingId);
    if (!l || (l.status === "removed" && l.creatorId !== userId)) fail("NOT_FOUND");
    return { ...(await withPoster(ctx, l)), isMine: l.creatorId === userId };
  },
});

export const create = mutation({
  args: {
    side,
    title: v.string(),
    description: v.string(),
    category: listingCategory,
    city: v.optional(v.string()),
    amountDzd: v.number(),
  },
  handler: async (ctx, args) => createListing(ctx, await requireUser(ctx), args),
});

export const remove = mutation({
  args: { listingId: v.id("listings") },
  handler: async (ctx, { listingId }) => removeListing(ctx, await requireUser(ctx), listingId),
});

export const accept = mutation({
  args: { listingId: v.id("listings") },
  handler: async (ctx, { listingId }) => acceptListing(ctx, await requireUser(ctx), listingId),
});
