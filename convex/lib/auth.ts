import { getAuthUserId } from "@convex-dev/auth/server";
import type { MutationCtx, QueryCtx } from "../_generated/server";
import type { Doc, Id } from "../_generated/dataModel";
import { fail } from "./errors";

// The user always comes from the session, never from client arguments.
export async function requireUser(ctx: QueryCtx | MutationCtx): Promise<Id<"users">> {
  const userId = await getAuthUserId(ctx);
  if (!userId) fail("UNAUTHENTICATED");
  return userId;
}

export async function requireAdmin(ctx: QueryCtx | MutationCtx): Promise<Doc<"users">> {
  const userId = await requireUser(ctx);
  const user = await ctx.db.get(userId);
  if (user?.role !== "admin") fail("FORBIDDEN");
  return user;
}