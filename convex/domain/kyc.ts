import type { MutationCtx } from "../_generated/server";
import type { Id } from "../_generated/dataModel";
import { fail } from "../lib/errors";

export async function submitKyc(
  ctx: MutationCtx,
  userId: Id<"users">,
  args: {
    fullName: string;
    documentType: "national_id" | "passport" | "driver_license";
    documentNumber: string;
    documentFileId: Id<"_storage">;
  },
): Promise<Id<"kycSubmissions">> {
  const user = await ctx.db.get(userId);
  if (!user) fail("UNAUTHENTICATED");
  if (user.kycStatus === "approved") fail("INVALID_STATE", "identity already verified");
  if (user.kycStatus === "pending") fail("INVALID_STATE", "a submission is already under review");

  const fullName = args.fullName.trim();
  const documentNumber = args.documentNumber.trim();
  if (fullName.length < 3 || fullName.length > 100) fail("INVALID_INPUT", "invalid full name");
  if (documentNumber.length < 4 || documentNumber.length > 40) fail("INVALID_INPUT", "invalid document number");

  const id = await ctx.db.insert("kycSubmissions", {
    userId,
    fullName,
    documentType: args.documentType,
    documentNumber,
    documentFileId: args.documentFileId,
    status: "pending",
  });
  await ctx.db.patch(userId, { kycStatus: "pending" });
  return id;
}

export async function reviewKyc(
  ctx: MutationCtx,
  adminId: Id<"users">,
  submissionId: Id<"kycSubmissions">,
  approve: boolean,
  note?: string,
) {
  const admin = await ctx.db.get(adminId);
  if (admin?.role !== "admin") fail("FORBIDDEN", "moderators only");

  const submission = await ctx.db.get(submissionId);
  if (!submission) fail("NOT_FOUND");
  if (submission.userId === adminId) fail("FORBIDDEN", "cannot review your own submission");
  if (submission.status !== "pending") fail("INVALID_STATE", "already reviewed");

  const status = approve ? "approved" : "rejected";
  await ctx.db.patch(submissionId, { status, reviewedBy: adminId, reviewNote: note?.trim() || undefined });
  await ctx.db.patch(submission.userId, { kycStatus: status });
}