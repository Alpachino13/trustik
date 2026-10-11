import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export const ledgerReason = v.union(
  v.literal("deposit"),
  v.literal("withdrawal"),
  v.literal("withdrawal_refund"),
  v.literal("escrow_funding"),
  v.literal("escrow_release"),
  v.literal("escrow_fee"),
  v.literal("dispute_refund"),
  v.literal("dispute_settlement"),
  v.literal("admin_adjustment"),
);

export const dealStatus = v.union(
  v.literal("pending"),
  v.literal("accepted"),
  v.literal("funded"),
  v.literal("released"),
  v.literal("disputed"),
  v.literal("settled"),
  v.literal("cancelled"),
);

export default defineSchema({
  users: defineTable({
    // fields Convex Auth expects (all optional)
    name: v.optional(v.string()),
    image: v.optional(v.string()),
    email: v.optional(v.string()),
    emailVerificationTime: v.optional(v.number()),
    phone: v.optional(v.string()),
    phoneVerificationTime: v.optional(v.number()),
    isAnonymous: v.optional(v.boolean()),
    // Trustik fields
    firstName: v.optional(v.string()),
    lastName: v.optional(v.string()),
    username: v.optional(v.string()),
    mobile: v.optional(v.string()), // with dial code
    country: v.optional(v.string()),
    role: v.optional(v.union(v.literal("user"), v.literal("admin"))),
    kycStatus: v.optional(
      v.union(
        v.literal("none"),
        v.literal("pending"),
        v.literal("approved"),
        v.literal("rejected"),
      ),
    ),
  })
    .index("email", ["email"])
    .index("username", ["username"])
    .index("mobile", ["mobile"]),

  // wallet (per user), escrow (per deal), fees (platform), external (the outside world)
  accounts: defineTable({
    kind: v.union(
      v.literal("wallet"),
      v.literal("escrow"),
      v.literal("fees"),
      v.literal("external"),
    ),
    userId: v.optional(v.id("users")),
    dealId: v.optional(v.id("deals")),
    balance: v.number(), // integer centimes
  })
    .index("by_user_kind", ["userId", "kind"])
    .index("by_deal", ["dealId"])
    .index("by_kind", ["kind"]),

  // immutable: never patched or deleted
  ledgerEntries: defineTable({
    txId: v.string(),
    accountId: v.id("accounts"),
    counterAccountId: v.id("accounts"),
    direction: v.union(v.literal("debit"), v.literal("credit")), // debit = money leaves
    amount: v.number(),
    balanceAfter: v.number(),
    reason: ledgerReason,
    dealId: v.optional(v.id("deals")),
    idempotencyKey: v.optional(v.string()),
  })
    .index("by_account", ["accountId"])
    .index("by_tx", ["txId"])
    .index("by_deal", ["dealId"])
    .index("by_idempotency", ["idempotencyKey"]),

  deals: defineTable({
    creatorId: v.id("users"),
    creatorRole: v.union(v.literal("buyer"), v.literal("seller")),
    buyerId: v.optional(v.id("users")),
    sellerId: v.optional(v.id("users")),
    inviteEmail: v.optional(v.string()),
    title: v.string(),
    description: v.string(),
    amount: v.number(), // centimes
    feeBps: v.number(), // fee snapshot at creation
    status: dealStatus,
    escrowAccountId: v.optional(v.id("accounts")),
  })
    .index("by_buyer", ["buyerId"])
    .index("by_seller", ["sellerId"])
    .index("by_status", ["status"])
    .index("by_invite_email", ["inviteEmail"]),

    disputes: defineTable({
    dealId: v.id("deals"),
    openedBy: v.id("users"),
    reason: v.string(),
    status: v.union(v.literal("open"), v.literal("settled")),
    moderatorId: v.optional(v.id("users")),
    buyerBps: v.optional(v.number()), // share of the funds returned to the buyer
    resolutionNote: v.optional(v.string()),
  })
    .index("by_deal", ["dealId"])
    .index("by_status", ["status"]),

  disputeMessages: defineTable({
    disputeId: v.id("disputes"),
    authorId: v.id("users"),
    body: v.string(),
  }).index("by_dispute", ["disputeId"]),
});