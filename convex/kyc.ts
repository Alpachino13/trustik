import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { requireAdmin, requireUser } from "./lib/auth";
import { reviewKyc, submitKyc } from "./domain/kyc";

export const generateUploadUrl = mutation({
  args: {},
  handler: async (ctx) => {
    await requireUser(ctx);
    return await ctx.storage.generateUploadUrl();
  },
});

export const submit = mutation({
  args: {
    fullName: v.string(),
    documentType: v.union(v.literal("national_id"), v.literal("passport"), v.literal("driver_license")),
    documentNumber: v.string(),
    documentFileId: v.id("_storage"),
  },
  handler: async (ctx, args) => submitKyc(ctx, await requireUser(ctx), args),
});

export const status = query({
  args: {},
  handler: async (ctx) => {
    const user = await ctx.db.get(await requireUser(ctx));
    return { kycStatus: user?.kycStatus ?? "none" };
  },
});

export const pending = query({
  args: {},
  handler: async (ctx) => {
    await requireAdmin(ctx);
    const rows = await ctx.db.query("kycSubmissions").withIndex("by_status", (q) => q.eq("status", "pending")).collect();
    return await Promise.all(rows.map(async (r) => ({ ...r, fileUrl: await ctx.storage.getUrl(r.documentFileId) })));
  },
});

export const review = mutation({
  args: { submissionId: v.id("kycSubmissions"), approve: v.boolean(), note: v.optional(v.string()) },
  handler: async (ctx, { submissionId, approve, note }) => {
    const admin = await requireAdmin(ctx);
    return reviewKyc(ctx, admin._id, submissionId, approve, note);
  },
});