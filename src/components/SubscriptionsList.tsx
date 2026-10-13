"use client";

import { useState } from "react";
import { Check, CheckCircle2 } from "lucide-react";

interface Subscription {
  id: string;
  name: string;
  iconBg: string;
  iconLetter: string;
  isYoutube?: boolean;
  nextPayment: string;
  price: number;
  paid?: boolean;
}

const INITIAL_SUBS: Subscription[] = [
  {
    id: "google",
    name: "Google",
    iconBg: "bg-red-50 text-red-500",
    iconLetter: "G",
    nextPayment: "Next Payment on 28 May",
    price: 21,
  },
  {
    id: "youtube",
    name: "Youtube",
    iconBg: "bg-red-50 text-red-600",
    iconLetter: "▶",
    isYoutube: true,
    nextPayment: "Next Payment on 26 May",
    price: 27,
  },
];

export function SubscriptionsList() {
  const [subs, setSubs] = useState(INITIAL_SUBS);
  const [successId, setSuccessId] = useState<string | null>(null);

  function handlePay(id: string) {
    setSubs((prev) =>
      prev.map((s) => (s.id === id ? { ...s, paid: true } : s))
    );
    setSuccessId(id);
    setTimeout(() => setSuccessId(null), 2500);
  }

  return (
    <section>
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-base font-extrabold text-ink">Monthly Subscriptions</h3>
        <span className="text-xs font-semibold text-brand cursor-pointer hover:underline">
          View all
        </span>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {subs.map((sub) => (
          <div
            key={sub.id}
            className="flex flex-col items-center rounded-[2rem] bg-white p-4 text-center shadow-[0_8px_24px_-10px_rgba(53,82,220,0.1)] transition hover:shadow-md"
          >
            {/* Logo */}
            <div
              className={`flex size-11 items-center justify-center rounded-2xl font-black text-lg ${sub.iconBg}`}
            >
              {sub.iconLetter}
            </div>

            {/* Name */}
            <p className="mt-2.5 font-bold text-ink text-sm">{sub.name}</p>
            <p className="mt-0.5 text-[10px] font-semibold text-muted">
              {sub.nextPayment}
            </p>

            {/* Pay Button */}
            <button
              onClick={() => handlePay(sub.id)}
              disabled={sub.paid}
              className={`mt-3 w-full rounded-xl py-2 text-xs font-bold transition active:scale-95 ${
                sub.paid
                  ? "bg-mint/15 text-mint-deep cursor-default"
                  : "bg-brand text-white shadow-sm shadow-brand/30 hover:bg-brand-deep"
              }`}
            >
              {sub.paid ? (
                <span className="flex items-center justify-center gap-1">
                  <Check size={13} strokeWidth={3} /> Paid
                </span>
              ) : (
                `Pay Now $${sub.price}`
              )}
            </button>
          </div>
        ))}
      </div>

      {successId && (
        <div className="mt-2 flex items-center gap-2 rounded-xl bg-tint-mint p-2.5 text-xs font-bold text-mint-deep animate-fadeIn">
          <CheckCircle2 size={16} /> Subscription renewed successfully!
        </div>
      )}
    </section>
  );
}
