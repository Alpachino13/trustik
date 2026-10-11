import { fail } from "./errors";

// All amounts are integer centimes (1 DZD = 100 centimes).
export const CENTIMES_PER_DZD = 100;
const BPS = 10_000; // 100 bps = 1 %

export function assertAmount(value: number, label = "amount"): void {
  if (!Number.isSafeInteger(value) || value <= 0) {
    fail("INVALID_AMOUNT", `${label} must be a positive integer (centimes)`);
  }
}

export function dzdToCentimes(dzd: number): number {
  return Math.round(dzd * CENTIMES_PER_DZD);
}

export function centimesToDzd(centimes: number): number {
  return centimes / CENTIMES_PER_DZD;
}

export function feeFromBps(amount: number, bps: number): number {
  if (!Number.isInteger(bps) || bps < 0 || bps > BPS) {
    fail("INVALID_AMOUNT", "fee must be between 0 and 10000 bps");
  }
  return Math.round((amount * bps) / BPS);
}

// Dispute split: buyerBps share goes back to the buyer, the rest to the seller.
export function splitByBps(total: number, buyerBps: number) {
  if (!Number.isInteger(buyerBps) || buyerBps < 0 || buyerBps > BPS) {
    fail("INVALID_AMOUNT", "split must be between 0 and 10000 bps");
  }
  const buyer = Math.round((total * buyerBps) / BPS);
  return { buyer, seller: total - buyer };
}