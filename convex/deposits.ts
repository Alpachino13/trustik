import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";
import { internal } from "./_generated/api";
import { action, internalMutation, query } from "./_generated/server";
import { fail } from "./lib/errors";
import { requireUser } from "./lib/auth";
import {
  attachCheckout,
  closeDeposit,
  confirmDeposit,
  createPendingDeposit,
} from "./domain/deposits";

export const mine = query({
  args: {},
  handler: async (ctx) => {
    const userId = await requireUser(ctx);
    return await ctx.db
      .query("deposits")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .order("desc")
      .take(50);
  },
});

// Public entry point: creates a Chargily checkout and returns the URL to redirect to.
export const start = action({
  args: {
    amountDzd: v.number(),
    locale: v.optional(v.union(v.literal("ar"), v.literal("fr"), v.literal("en"))),
  },
  handler: async (ctx, { amountDzd, locale }): Promise<{ checkoutUrl: string }> => {
    const userId = await getAuthUserId(ctx);
    if (!userId) fail("UNAUTHENTICATED");

    const secret = process.env.CHARGILY_SECRET_KEY;
    const apiUrl = process.env.CHARGILY_API_URL;
    const siteUrl = process.env.SITE_URL;
    const hookBase = process.env.CONVEX_SITE_URL;
    if (!secret || !apiUrl || !siteUrl || !hookBase) {
      fail("INVALID_STATE", "payments are not configured");
    }

    const depositId = await ctx.runMutation(internal.deposits.createPending, { userId, amountDzd });

    const res = await fetch(`${apiUrl}/checkouts`, {
      method: "POST",
      headers: { Authorization: `Bearer ${secret}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        amount: amountDzd,
        currency: "dzd",
        locale: locale ?? "fr",
        success_url: `${siteUrl}/wallet?deposit=success`,
        failure_url: `${siteUrl}/wallet?deposit=failed`,
        webhook_endpoint: `${hookBase}/chargily/webhook`,
        chargily_pay_fees_allocation: "customer",
        description: "Trustik wallet top-up",
        metadata: { depositId },
      }),
    });

    if (!res.ok) {
      console.error("Chargily checkout failed", res.status, await res.text());
      await ctx.runMutation(internal.deposits.close, { checkoutId: "", depositId });
      fail("INVALID_STATE", "payment provider error");
    }
    const checkout = (await res.json()) as { id: string; checkout_url: string };
    await ctx.runMutation(internal.deposits.attach, {
      depositId,
      checkoutId: checkout.id,
      checkoutUrl: checkout.checkout_url,
    });
    return { checkoutUrl: checkout.checkout_url };
  },
});

export const createPending = internalMutation({
  args: { userId: v.id("users"), amountDzd: v.number() },
  handler: (ctx, { userId, amountDzd }) => createPendingDeposit(ctx, userId, amountDzd),
});

export const attach = internalMutation({
  args: { depositId: v.id("deposits"), checkoutId: v.string(), checkoutUrl: v.string() },
  handler: (ctx, a) => attachCheckout(ctx, a.depositId, a.checkoutId, a.checkoutUrl),
});

export const confirm = internalMutation({
  args: { checkoutId: v.string(), paidAmountDzd: v.number() },
  handler: (ctx, args) => confirmDeposit(ctx, args),
});

export const close = internalMutation({
  args: {
    checkoutId: v.string(),
    status: v.optional(v.union(v.literal("failed"), v.literal("expired"))),
    depositId: v.optional(v.id("deposits")),
  },
  handler: async (ctx, { checkoutId, status, depositId }) => {
    if (depositId) {
      const d = await ctx.db.get(depositId);
      if (d?.status === "pending") await ctx.db.patch(depositId, { status: "failed" });
      return;
    }
    await closeDeposit(ctx, checkoutId, status ?? "failed");
  },
});