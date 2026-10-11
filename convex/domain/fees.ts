import { feeFromBps } from "../lib/money";

// 2.5 %, charged to the seller at release. Operator-configurable later.
export const DEFAULT_FEE_BPS = 250;

export function releaseSplit(amount: number, feeBps: number) {
  const fee = feeFromBps(amount, feeBps);
  return { fee, net: amount - fee };
}