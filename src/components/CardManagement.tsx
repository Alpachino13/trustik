"use client";

import { useState } from "react";
import { ArrowLeft, Bell, Check, CreditCard, ShieldCheck } from "lucide-react";

interface CardManagementProps {
  onBack?: () => void;
  onSuccess?: () => void;
}

const COLOR_PRESETS = [
  { id: "blue", label: "Ocean Blue", gradient: "from-[#204ecf] via-[#2c5ff2] to-[#173cb0]" },
  { id: "purple", label: "Royal Violet", gradient: "from-[#6938d3] via-[#7d48eb] to-[#45209c]" },
  { id: "emerald", label: "Mint Emerald", gradient: "from-[#10b981] via-[#059669] to-[#047857]" },
  { id: "coral", label: "Sunset Amber", gradient: "from-[#ea580c] via-[#f97316] to-[#c2410c]" },
  { id: "dark", label: "Onyx Midnight", gradient: "from-[#1e293b] via-[#0f172a] to-[#020617]" },
];

export function CardManagement({ onBack, onSuccess }: CardManagementProps) {
  const [bankName, setBankName] = useState("Axis Bank");
  const [cardNumber, setCardNumber] = useState("3571 399507 50832");
  const [cardHolder, setCardHolder] = useState("Surinder Thakur");
  const [expiry, setExpiry] = useState("11/22");
  const [cvv, setCvv] = useState("090");
  const [selectedColor, setSelectedColor] = useState(COLOR_PRESETS[0]);
  const [isDefault, setIsDefault] = useState(true);
  const [isSaved, setIsSaved] = useState(false);

  function formatCardNumber(val: string) {
    const raw = val.replace(/\D/g, "").slice(0, 16);
    const parts = raw.match(/[\s\S]{1,4}/g) || [];
    return parts.join(" ");
  }

  function handleCardNumberChange(e: React.ChangeEvent<HTMLInputElement>) {
    setCardNumber(formatCardNumber(e.target.value));
  }

  function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setIsSaved(true);
    setTimeout(() => {
      setIsSaved(false);
      if (onSuccess) onSuccess();
    }, 1800);
  }

  return (
    <div className="space-y-5 animate-fadeIn">
      {/* Header */}
      <div className="flex items-center justify-between">
        <button
          onClick={onBack}
          aria-label="Go back"
          className="flex size-10 items-center justify-center rounded-full bg-white text-ink shadow-[0_4px_12px_rgba(0,0,0,0.06)] active:scale-95 transition"
        >
          <ArrowLeft size={18} />
        </button>
        <h2 className="text-lg font-extrabold text-ink">Add Your First Card</h2>
        <button
          aria-label="Notifications"
          className="flex size-10 items-center justify-center rounded-full bg-white text-ink shadow-[0_4px_12px_rgba(0,0,0,0.06)] active:scale-95 transition"
        >
          <Bell size={18} />
        </button>
      </div>

      {/* Credit Card Preview */}
      <div
        className={`relative overflow-hidden rounded-[2rem] bg-gradient-to-tr ${selectedColor.gradient} p-6 text-white shadow-[0_16px_36px_-12px_rgba(32,78,207,0.45)] transition-all duration-300`}
      >
        {/* Glow & chip reflection */}
        <div className="pointer-events-none absolute -right-10 -top-10 size-40 rounded-full bg-white/10 blur-xl" />
        <div className="pointer-events-none absolute -left-10 -bottom-10 size-40 rounded-full bg-black/10 blur-xl" />

        {/* Top: Mastercard logo */}
        <div className="relative flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            {/* Mastercard overlapping circles */}
            <div className="flex -space-x-2.5">
              <span className="size-6 rounded-full bg-[#eb001b]/90 inline-block" />
              <span className="size-6 rounded-full bg-[#f79e1b]/90 inline-block" />
            </div>
            <span className="text-[10px] font-bold tracking-wider text-white/90 uppercase ml-1">
              MasterCard
            </span>
          </div>
          <span className="text-xs font-semibold tracking-wider text-white/80">
            {bankName || "Debit Card"}
          </span>
        </div>

        {/* Card Number */}
        <div className="relative my-7 font-mono text-xl sm:text-2xl font-bold tracking-widest drop-shadow-sm">
          {cardNumber || "•••• •••• •••• ••••"}
        </div>

        {/* Bottom row: Cardholder & Expiry */}
        <div className="relative flex items-end justify-between">
          <div>
            <p className="text-[9px] font-medium uppercase tracking-wider text-white/60">
              Card Holder Name
            </p>
            <p className="font-extrabold tracking-wide text-sm sm:text-base capitalize">
              {cardHolder || "YOUR NAME"}
            </p>
          </div>
          <div className="text-right">
            <p className="text-[9px] font-medium uppercase tracking-wider text-white/60">
              Expires
            </p>
            <p className="font-bold tracking-wider text-sm">{expiry || "MM/YY"}</p>
          </div>
        </div>
      </div>

      {/* Interactive Form */}
      <form onSubmit={handleSave} className="rounded-[2rem] bg-white p-5 shadow-[0_8px_24px_-10px_rgba(53,82,220,0.1)] space-y-4">
        <div>
          <label className="block text-xs font-bold text-muted mb-1.5">Market / Bank Name</label>
          <input
            type="text"
            value={bankName}
            onChange={(e) => setBankName(e.target.value)}
            placeholder="Axis Bank, BEA, CIB..."
            required
            className="w-full rounded-2xl bg-[#f5f6fa] px-4 py-3 text-sm font-bold text-ink outline-none focus:ring-2 focus:ring-brand transition"
          />
        </div>

        <div>
          <label className="block text-xs font-bold text-muted mb-1.5">Card Number</label>
          <div className="relative">
            <input
              type="text"
              value={cardNumber}
              onChange={handleCardNumberChange}
              placeholder="3571 399507 50832"
              required
              className="w-full rounded-2xl bg-[#f5f6fa] px-4 py-3 font-mono text-sm font-bold text-ink outline-none focus:ring-2 focus:ring-brand transition pr-10"
            />
            <div className="absolute right-3.5 top-3 flex -space-x-1.5 pointer-events-none">
              <span className="size-4 rounded-full bg-[#eb001b]" />
              <span className="size-4 rounded-full bg-[#f79e1b]" />
            </div>
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold text-muted mb-1.5">Card Holder Name</label>
          <input
            type="text"
            value={cardHolder}
            onChange={(e) => setCardHolder(e.target.value)}
            placeholder="Surinder Thakur"
            required
            className="w-full rounded-2xl bg-[#f5f6fa] px-4 py-3 text-sm font-bold text-ink outline-none focus:ring-2 focus:ring-brand transition"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-bold text-muted mb-1.5">Expiration Date</label>
            <input
              type="text"
              value={expiry}
              onChange={(e) => setExpiry(e.target.value)}
              placeholder="11/22"
              maxLength={5}
              required
              className="w-full rounded-2xl bg-[#f5f6fa] px-4 py-3 text-sm font-bold text-ink outline-none focus:ring-2 focus:ring-brand transition"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-muted mb-1.5">CVV</label>
            <input
              type="password"
              value={cvv}
              onChange={(e) => setCvv(e.target.value)}
              placeholder="090"
              maxLength={4}
              required
              className="w-full rounded-2xl bg-[#f5f6fa] px-4 py-3 text-sm font-bold text-ink outline-none focus:ring-2 focus:ring-brand transition"
            />
          </div>
        </div>

        {/* Wallet Color Preset Picker */}
        <div>
          <label className="block text-xs font-bold text-muted mb-2">Wallet Card Color</label>
          <div className="flex items-center gap-3">
            {COLOR_PRESETS.map((p) => {
              const active = selectedColor.id === p.id;
              return (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => setSelectedColor(p)}
                  className={`relative size-8 rounded-full bg-gradient-to-tr ${p.gradient} transition-transform active:scale-95 ${
                    active ? "ring-2 ring-offset-2 ring-brand scale-110" : "opacity-80 hover:opacity-100"
                  }`}
                  aria-label={p.label}
                >
                  {active && <Check size={14} className="mx-auto text-white" strokeWidth={3} />}
                </button>
              );
            })}
          </div>
        </div>

        {/* Save as Default Toggle */}
        <div className="flex items-center justify-between pt-2">
          <span className="text-xs font-bold text-ink">Save this Card as Default</span>
          <button
            type="button"
            role="switch"
            aria-checked={isDefault}
            onClick={() => setIsDefault(!isDefault)}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200 ${
              isDefault ? "bg-brand" : "bg-gray-300"
            }`}
          >
            <span
              className={`inline-block size-4 transform rounded-full bg-white shadow transition duration-200 ${
                isDefault ? "translate-x-6" : "translate-x-1"
              }`}
            />
          </button>
        </div>

        {/* Security badge */}
        <div className="flex items-center justify-center gap-1.5 text-[11px] font-semibold text-muted pt-1">
          <ShieldCheck size={14} className="text-mint-deep" />
          <span>Your card data is end-to-end encrypted</span>
        </div>

        {/* Submit */}
        <button
          type="submit"
          className="w-full rounded-2xl bg-brand py-3.5 text-sm font-extrabold text-white shadow-lg shadow-brand/30 transition hover:bg-brand-deep active:scale-[0.99]"
        >
          {isSaved ? "Card Saved Successfully!" : "Continue"}
        </button>
      </form>
    </div>
  );
}
