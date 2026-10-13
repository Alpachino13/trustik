"use client";

import { useAction } from "convex/react";
import { ArrowRight, X } from "lucide-react";
import { useEffect, useState } from "react";
import { api } from "../../convex/_generated/api";
import { errorMessage } from "@/lib/format";

interface TopUpSheetProps {
  open: boolean;
  onClose: () => void;
  currencyMode?: "USD" | "DZD";
}

const CHIPS_USD = [50, 100, 150, 200];
const CHIPS_DZD = [500, 1000, 2000, 5000];

export function TopUpSheet({ open, onClose, currencyMode = "DZD" }: TopUpSheetProps) {
  const start = useAction(api.deposits.start);
  const [amount, setAmount] = useState(currencyMode === "USD" ? 150 : 1000);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  async function pay() {
    setError(null);
    setBusy(true);
    try {
      // Amount in DZD for the backend Chargily integration
      const dzdVal = currencyMode === "USD" ? amount * 10 : amount;
      const { checkoutUrl } = await start({ amountDzd: dzdVal, locale: "fr" });
      window.location.href = checkoutUrl;
    } catch (err) {
      setError(errorMessage(err));
      setBusy(false);
    }
  }

  const chips = currencyMode === "USD" ? CHIPS_USD : CHIPS_DZD;
  const currencySymbol = currencyMode === "USD" ? "$" : "DZD ";

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 backdrop-blur-sm animate-fadeIn"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Transfer Amount"
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md animate-[sheet_0.25s_ease-out] rounded-t-[2.5rem] bg-white p-6 pb-8 shadow-2xl"
      >
        {/* Header matching Screen 12 */}
        <div className="mb-2 flex items-center justify-between">
          <h2 className="text-xl font-extrabold text-ink">Transfer Amount</h2>
          <button
            aria-label="Close"
            onClick={onClose}
            className="flex size-9 items-center justify-center rounded-full bg-page text-muted hover:text-ink transition active:scale-95"
          >
            <X size={18} />
          </button>
        </div>

        <p className="text-center text-xs font-semibold text-muted mt-2">
          {currencyMode === "USD" ? "Enter Amount from $1.00 to $500.00 for Quick Transfer" : "Montant entre 100 et 500 000 DZD (cartes CIB / EDAHABIA)"}
        </p>

        {/* Big formatted amount field ($150.00) */}
        <div className="my-5 flex items-center justify-center">
          <div className="flex items-baseline gap-1 text-ink">
            <span className="text-2xl font-black text-muted">{currencySymbol}</span>
            <input
              aria-label="Amount"
              type="number"
              min={1}
              step={1}
              value={amount}
              onChange={(e) => setAmount(Math.max(1, Number(e.target.value)))}
              className="w-48 bg-transparent text-center text-4xl font-black tracking-tight outline-none focus:ring-0"
            />
            {currencyMode === "USD" && (
              <span className="text-xl font-bold text-muted">.00</span>
            )}
          </div>
        </div>

        {/* Quick Amount Chips ($50, $100, $150, $200) */}
        <div className="mb-6 grid grid-cols-4 gap-2">
          {chips.map((c) => (
            <button
              key={c}
              onClick={() => setAmount(c)}
              className={`rounded-2xl py-2.5 text-xs font-black transition active:scale-95 ${
                amount === c
                  ? "bg-brand text-white shadow-md shadow-brand/25"
                  : "bg-page text-ink hover:bg-gray-200"
              }`}
            >
              {currencySymbol}{c}
            </button>
          ))}
        </div>

        {error && (
          <p className="mb-4 text-center text-xs font-bold text-danger bg-red-50 p-2.5 rounded-xl">
            {error}
          </p>
        )}

        {/* Transfer Action Button */}
        <button
          onClick={pay}
          disabled={busy}
          className="flex w-full items-center justify-center gap-2 rounded-2xl bg-brand py-4 text-sm font-black text-white shadow-lg shadow-brand/30 transition hover:bg-brand-deep active:scale-[0.99] disabled:opacity-50"
        >
          {busy ? (
            "Connecting..."
          ) : (
            <>
              <span>Transfer</span>
              <ArrowRight size={18} strokeWidth={2.5} />
            </>
          )}
        </button>
      </div>
    </div>
  );
}