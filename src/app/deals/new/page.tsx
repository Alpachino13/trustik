"use client";

import { useMutation } from "convex/react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { ArrowLeft, Check, Handshake, Info, ShieldCheck } from "lucide-react";
import { api } from "../../../../convex/_generated/api";
import { AppShell } from "@/components/AppShell";
import { dzdToCentimes, errorMessage, formatDzd } from "@/lib/format";
import { useTranslation } from "@/lib/i18n/context";

export default function NewDealPage() {
  const router = useRouter();
  const { t } = useTranslation();
  const createDeal = useMutation(api.deals.create);

  const [role, setRole] = useState<"buyer" | "seller">("buyer");
  const [counterpartyEmail, setCounterpartyEmail] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [amountDzd, setAmountDzd] = useState<number | "">("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const numericAmount = typeof amountDzd === "number" ? amountDzd : 0;
  const feeRate = 0.05; // 5% Trustik fee
  const estimatedFee = numericAmount * feeRate;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!numericAmount || numericAmount <= 0) {
      setError("Veuillez saisir un montant valide supérieur à 0 DZD");
      return;
    }

    setError(null);
    setBusy(true);

    try {
      const centimes = dzdToCentimes(numericAmount);
      const dealId = await createDeal({
        role,
        counterpartyEmail: counterpartyEmail.trim().toLowerCase(),
        title: title.trim(),
        description: description.trim(),
        amount: centimes,
      });

      router.push(`/deals/${dealId}`);
    } catch (err) {
      setError(errorMessage(err));
      setBusy(false);
    }
  }

  return (
    <AppShell>
      <div className="space-y-5 animate-fadeIn">
        {/* Header */}
        <div className="flex items-center gap-3">
          <Link
            href="/deals"
            aria-label={t.common.back}
            className="flex size-10 items-center justify-center rounded-full bg-white text-ink shadow-card hover:bg-page transition active:scale-95"
          >
            <ArrowLeft size={18} />
          </Link>
          <div>
            <h1 className="text-xl font-extrabold text-ink">{t.deals.createTitle}</h1>
            <p className="text-xs font-semibold text-muted">
              Paiement bloqué jusqu'à confirmation
            </p>
          </div>
        </div>

        {/* Create Form */}
        <form
          onSubmit={handleSubmit}
          className="rounded-[2rem] bg-white p-5 shadow-card space-y-4"
        >
          {/* Role Selection */}
          <div>
            <label className="block text-xs font-bold text-muted mb-2">
              {t.deals.role}
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setRole("buyer")}
                className={`rounded-2xl p-3 text-center border-2 transition active:scale-95 ${
                  role === "buyer"
                    ? "border-brand bg-tint-blue text-brand font-black"
                    : "border-gray-100 bg-page text-muted font-bold"
                }`}
              >
                <span className="block text-sm">{t.deals.buyer}</span>
                <span className="text-[10px] text-muted font-normal">Je paie et reçois</span>
              </button>

              <button
                type="button"
                onClick={() => setRole("seller")}
                className={`rounded-2xl p-3 text-center border-2 transition active:scale-95 ${
                  role === "seller"
                    ? "border-brand bg-tint-blue text-brand font-black"
                    : "border-gray-100 bg-page text-muted font-bold"
                }`}
              >
                <span className="block text-sm">{t.deals.seller}</span>
                <span className="text-[10px] text-muted font-normal">Je livre et encaisse</span>
              </button>
            </div>
          </div>

          {/* Counterparty Email */}
          <div>
            <label className="block text-xs font-bold text-muted mb-1.5">
              {t.deals.counterpartyEmail}
            </label>
            <input
              type="email"
              required
              placeholder="partenaire@example.com"
              value={counterpartyEmail}
              onChange={(e) => setCounterpartyEmail(e.target.value)}
              className="w-full rounded-2xl bg-[#f5f6fa] px-4 py-3 text-sm font-bold text-ink outline-none focus:ring-2 focus:ring-brand transition"
            />
            <p className="mt-1 text-[10px] text-muted">
              S'il n'a pas encore de compte, le deal l'attendra dès son inscription.
            </p>
          </div>

          {/* Deal Title */}
          <div>
            <label className="block text-xs font-bold text-muted mb-1.5">
              {t.deals.dealTitle}
            </label>
            <input
              type="text"
              required
              placeholder="Ex: Smartphone iPhone 13 Pro 128Go"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full rounded-2xl bg-[#f5f6fa] px-4 py-3 text-sm font-bold text-ink outline-none focus:ring-2 focus:ring-brand transition"
            />
          </div>

          {/* Deal Description */}
          <div>
            <label className="block text-xs font-bold text-muted mb-1.5">
              {t.deals.dealDescription}
            </label>
            <textarea
              required
              rows={3}
              placeholder="Détails du produit, état, modalités de livraison ou conditions convenues…"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full rounded-2xl bg-[#f5f6fa] px-4 py-3 text-sm font-bold text-ink outline-none focus:ring-2 focus:ring-brand transition resize-none"
            />
          </div>

          {/* Amount DZD */}
          <div>
            <label className="block text-xs font-bold text-muted mb-1.5">
              {t.deals.amountDzd}
            </label>
            <div className="relative">
              <input
                type="number"
                min={100}
                step={50}
                required
                placeholder="50 000"
                value={amountDzd}
                onChange={(e) =>
                  setAmountDzd(e.target.value === "" ? "" : Number(e.target.value))
                }
                className="w-full rounded-2xl bg-[#f5f6fa] px-4 py-3 text-lg font-black text-ink outline-none focus:ring-2 focus:ring-brand transition pr-14"
              />
              <span className="absolute right-4 top-3.5 text-xs font-extrabold text-muted">
                DZD
              </span>
            </div>
          </div>

          {/* Fee & Net preview */}
          {numericAmount > 0 && (
            <div className="rounded-2xl bg-page p-3.5 space-y-1.5 text-xs">
              <div className="flex justify-between font-bold text-muted">
                <span>Montant convenu :</span>
                <span className="text-ink">{formatDzd(numericAmount)}</span>
              </div>
              <div className="flex justify-between font-bold text-muted">
                <span>Frais de séquestre (5%) :</span>
                <span className="text-brand">−{formatDzd(estimatedFee)}</span>
              </div>
              <div className="flex justify-between font-extrabold text-ink border-t border-gray-200 pt-1.5">
                <span>Net perçu par le vendeur à la libération :</span>
                <span className="text-mint-deep">
                  {formatDzd(numericAmount - estimatedFee)}
                </span>
              </div>
            </div>
          )}

          {/* Trust badge */}
          <div className="flex items-center gap-2 rounded-2xl bg-tint-mint p-3 text-xs font-bold text-mint-deep">
            <ShieldCheck size={18} className="shrink-0" />
            <span>
              Les fonds restent sous séquestre sécurisé. Le vendeur n'est payé que lorsque l'acheteur valide la réception.
            </span>
          </div>

          {error && (
            <p className="rounded-xl bg-red-50 p-3 text-xs font-bold text-danger">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={busy}
            className="w-full rounded-2xl bg-brand py-4 text-sm font-extrabold text-white shadow-lg shadow-brand/30 hover:bg-brand-deep transition active:scale-[0.99] disabled:opacity-50"
          >
            {busy ? "Création en cours…" : t.deals.createButton}
          </button>
        </form>
      </div>
    </AppShell>
  );
}
