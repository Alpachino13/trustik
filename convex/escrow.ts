import { query } from "./_generated/server";
import { requireUser } from "./lib/auth";
import { heldForBuyer } from "./domain/escrow";

export const heldForMe = query({
  args: {},
  handler: async (ctx) => ({ held: await heldForBuyer(ctx, await requireUser(ctx)) }),
});
