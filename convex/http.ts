import { httpRouter } from "convex/server";
import { httpAction } from "./_generated/server";
import { internal } from "./_generated/api";
import { auth } from "./auth";
import { verifySignature } from "./lib/hmac";

const http = httpRouter();
auth.addHttpRoutes(http);

http.route({
  path: "/chargily/webhook",
  method: "POST",
  handler: httpAction(async (ctx, request) => {
    const secret = process.env.CHARGILY_SECRET_KEY;
    if (!secret) return new Response("not configured", { status: 500 });

    const payload = await request.text(); // raw body: the signature covers these exact bytes
    const signature = request.headers.get("signature") ?? "";
    if (!signature || !(await verifySignature(secret, payload, signature))) {
      return new Response("invalid signature", { status: 403 });
    }

    let event: any;
    try {
      event = JSON.parse(payload);
    } catch {
      return new Response("bad json", { status: 400 });
    }
    console.log("chargily webhook", event?.type); // check the real payload shape on the first test
    const checkout = event?.data ?? event;
    if (!checkout?.id) return new Response("no checkout", { status: 400 });

    if (event.type === "checkout.paid") {
      const result = await ctx.runMutation(internal.deposits.confirm, {
        checkoutId: String(checkout.id),
        paidAmountDzd: Number(checkout.amount),
      });
      if (result === "unknown_checkout") return new Response("unknown checkout", { status: 404 });
      if (result === "amount_mismatch") {
        console.error("AMOUNT MISMATCH, needs manual review", checkout.id, checkout.amount);
      }
    } else if (event.type === "checkout.failed" || event.type === "checkout.expired") {
      await ctx.runMutation(internal.deposits.close, {
        checkoutId: String(checkout.id),
        status: event.type === "checkout.expired" ? "expired" : "failed",
      });
    }
    return new Response(null, { status: 200 });
  }),
});

export default http;