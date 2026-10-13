import type { MutationCtx } from "../_generated/server";
import type { Doc, Id } from "../_generated/dataModel";
import { fail } from "../lib/errors";
import { CENTIMES_PER_DZD, assertAmount } from "../lib/money";
import { DEFAULT_FEE_BPS } from "./fees";
import { escrowAccount } from "./ledger";

export const MIN_LISTING_DZD = 100;
export const MAX_LISTING_DZD = 10_000_000;
export const MAX_OPEN_LISTINGS = 10;

export async function createListing(
  ctx: MutationCtx,
  userId: Id<"users">,
  args: {
    side: Doc<"listings">["side"];
    title: string;
    description: string;
    category: Doc<"listings">["category"];
    city?: string;
    amountDzd: number;
  },
): Promise<Id<"listings">> {
  const title = args.title.trim();
  const description = args.description.trim();
  const city = args.city?.trim() || undefined;
  if (title.length < 5 || title.length > 100) fail("INVALID_INPUT", "title must be 5 to 100 characters");
  if (description.length < 10 || description.length > 2000) {
    fail("INVALID_INPUT", "description must be 10 to 2000 characters");
  }
  if (city && city.length > 60) fail("INVALID_INPUT", "city is too long");
  if (!Number.isInteger(args.amountDzd) || args.amountDzd < MIN_LISTING_DZD || args.amountDzd > MAX_LISTING_DZD) {
    fail("INVALID_AMOUNT", `price must be a whole number between ${MIN_LISTING_DZD} and ${MAX_LISTING_DZD} DZD`);
  }
  const amount = args.amountDzd * CENTIMES_PER_DZD;
  assertAmount(amount);

  const open = await ctx.db
    .query("listings")
    .withIndex("by_creator", (q) => q.eq("creatorId", userId).eq("status", "open"))
    .collect();
  if (open.length >= MAX_OPEN_LISTINGS) fail("INVALID_STATE", "too many open listings");

  return await ctx.db.insert("listings", {
    creatorId: userId,
    side: args.side,
    title,
    description,
    category: args.category,
    city,
    amount,
    searchText: city ? `${title} ${city}` : title,
    status: "open",
  });
}

export async function removeListing(ctx: MutationCtx, userId: Id<"users">, listingId: Id<"listings">) {
  const listing = await ctx.db.get(listingId);
  if (!listing) fail("NOT_FOUND");
  if (listing.creatorId !== userId) fail("FORBIDDEN");
  if (listing.status !== "open") fail("INVALID_STATE", "only an open listing can be removed");
  await ctx.db.patch(listingId, { status: "removed" });
}

// Accepting turns the listing into an active deal in one transaction.
// Convex serializes conflicting writes, so two simultaneous accepts cannot both win.
export async function acceptListing(
  ctx: MutationCtx,
  userId: Id<"users">,
  listingId: Id<"listings">,
): Promise<Id<"deals">> {
  const listing = await ctx.db.get(listingId);
  if (!listing) fail("NOT_FOUND");
  if (listing.status !== "open") fail("INVALID_STATE", "this listing is no longer available");
  if (listing.creatorId === userId) fail("FORBIDDEN", "you cannot accept your own listing");

  const sellingListing = listing.side === "selling"; // creator sells, acceptor buys
  const dealId = await ctx.db.insert("deals", {
    creatorId: listing.creatorId,
    creatorRole: sellingListing ? "seller" : "buyer",
    buyerId: sellingListing ? userId : listing.creatorId,
    sellerId: sellingListing ? listing.creatorId : userId,
    title: listing.title,
    description: listing.description,
    amount: listing.amount,
    feeBps: DEFAULT_FEE_BPS,
    status: "accepted",
  });
  const escrow = await escrowAccount(ctx, dealId);
  await ctx.db.patch(dealId, { escrowAccountId: escrow._id });
  await ctx.db.patch(listingId, { status: "accepted", dealId });
  return dealId;
}
