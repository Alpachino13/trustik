import { ConvexError } from "convex/values";

export type ErrorCode =
  | "INVALID_AMOUNT"
  | "INVALID_INPUT"
  | "INSUFFICIENT_FUNDS"
  | "NOT_FOUND"
  | "FORBIDDEN"
  | "UNAUTHENTICATED"
  | "INVALID_STATE"
  | "CONFLICT";

export function fail(code: ErrorCode, message?: string): never {
  throw new ConvexError({ code, message: message ?? code });
}