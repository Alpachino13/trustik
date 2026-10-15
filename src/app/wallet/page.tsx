"use client";

import { useMutation, usePaginatedQuery, useQuery, useConvexAuth } from "convex/react";
import Link from "next/link";
import { useState } from "react";
import {
  AlertCircle,
  ArrowDownLeft,
  ArrowLeft,
  ArrowUpRight,
  Banknote,
  Building2,
  CheckCircle2,
  Clock,
  CreditCard,
  Lock,
  Plus,
  ShieldCheck,
  X,
} from "lucide-react";
import { api } from "../../../convex/_generated/api";
import { AppShell } from "@/components/AppShell";
import { TopUpSheet } from "@/components/TopUpSheet";
import { dzdToCentimes, errorMessage, formatCentimes, formatDzd } from "@/lib/format";
import { LEDGER } from "@/lib/labels";
import { useTranslation } from "@/lib/i18n/context";

type WithdrawalMethod = "ccp" | "bank" | "baridimob";

export default function WalletPage() {
  const { t } = useTranslation();
  
  // 1. Fetch authentication state
  const { isAuthenticated, isLoading } = useConvexAuth();

  // 2. Conditionally skip queries if the user is not authenticated
  const wallet = useQuery(api.wallet.me, isAuthenticated ? undefined : "skip");
  const kycQuery = useQuery(api.kyc.status, isAuthenticated ? undefined : "skip");
  const withdrawalsQuery = useQuery(api.withdrawals.mine, isAuthenticated ? undefined : "skip");
  const escrow = useQuery(api.escrow.heldForMe, isAuthenticated ? undefined : "skip");
  const history = usePaginatedQuery(
    api.wallet.history, 
    isAuthenticated ? {} : "skip", 
    { initialNumItems: 15 }
  );
  
  const requestWithdrawal = useMutation(api.withdrawals.request);

  const [topUpOpen, setTopUpOpen] = useState(false);
  const [withdrawModalOpen, setWithdrawModalOpen] = useState(false);

  // Form states for withdrawal
  const [amountDzd, setAmountDzd] = useState<number | "">("");
  const [method, setMethod] = useState<WithdrawalMethod>("baridimob");
  const [accountHolder, setAccountHolder] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [withdrawSuccess, setWithdrawSuccess] = useState(false);

  const availableCentimes = wallet?.balance ?? 0;
  const isKycApproved = kycQuery?.kycStatus === "approved";

  // Funds the user has locked in escrow as a buyer (computed server-side)
  const heldCentimes = escrow?.held ?? 0;

  async function handleWithdrawalSubmit(e: React.FormEvent) {
    e.preventDefault();
    const val = typeof amountDzd === "number" ? amountDzd : 0;
    if (val <= 0) {
      setError("Montant invalide");
      return;
    }
    if (dzdToCentimes(val) > availableCentimes) {
      setError("Le montant demandé dépasse votre solde disponible.");
      return;
    }

    setError(null);
    setBusy(true);

    try {
      await requestWithdrawal({
        amountDzd: val,
        method,
        accountHolder: accountHolder.trim(),
        accountNumber: accountNumber.trim(),
      });
      setWithdrawSuccess(true);
      setTimeout(() => {
        setWithdrawSuccess(false);
        setWithdrawModalOpen(false);
        setAmountDzd("");
      }, 2000);
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <AppShell>
      <div className="space-y-5 animate-fadeIn pb-6">
        {/* Header */}
        <div className="flex items-center gap-3">
          <Link
            href="/"
            aria-label={t.common.back}
            className="flex size-10 items-center justify-center rounded-full bg-white text-ink shadow-card hover:bg-page transition active:scale-95"
          >
            <ArrowLeft size={18} />
          </Link>
          <div>
            <h1 className="text-xl font-extrabold text-ink">{t.wallet.title}</h1>
            <p className="text-xs font-semibold text-muted">
              Grand livre comptable et règlements
            </p>
          </div>
        </div>

        {/* Authentication & Loading States */}
        {isLoading || (isAuthenticated && wallet === undefined) ? (
          <div className="rounded-[2rem] bg-white p-8 text-center text-muted font-bold shadow-card">
            {t.common.loading}
          </div>
        ) : !isAuthenticated ? (
          <div className="rounded-[2rem] bg-white p-8 text-center shadow-card space-y-4">
            <div className="mx-auto flex size-14 items-center justify-center rounded-full bg-tint-blue text-brand">
              <ShieldCheck size={28} />
            </div>
            <p className="text-sm font-bold text-ink">Vous devez être connecté pour accéder à votre portefeuille.</p>
            <Link
              href="/profile"
              className="inline-flex items-center gap-1.5 rounded-full bg-brand px-5 py-2.5 text-xs font-black text-white shadow-md shadow-brand/30 hover:brightness-105 transition"
            >
              <span>Se connecter</span>
            </Link>
          </div>
        ) : (
          <>
            {/* Dual Balance Card */}
            <div className="rounded-[2.5rem] bg-gradient-to-br from-[#2f55ea] via-[#284be0] to-[#1c36b8] p-6 text-white shadow-[0_12px_36px_-10px_rgba(43,75,230,0.45)] space-y-5">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-white/70">
                  {t.wallet.availableBalance}
                </span>
                <p className="text-3xl sm:text-4xl font-black tracking-tight mt-1">
                  {formatCentimes(availableCentimes)}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-1">
                <div className="rounded-2xl bg-white/10 p-3 backdrop-blur-md">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-white/70 block">
                    {t.wallet.heldBalance}
                  </span>
                  <p className="text-base font-extrabold mt-0.5 text-mint">
                    {formatCentimes(heldCentimes)}
                  </p>
                </div>
                <div className="rounded-2xl bg-white/10 p-3 backdrop-blur-md">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-white/70 block">
                    Statut KYC
                  </span>
                  <p className="text-xs font-black mt-1 capitalize">
                    {kycQuery?.kycStatus === "approved" ? "Vérifié ✓" : "Non vérifié"}
                  </p>
                </div>
              </div>

              {/* Quick Actions */}
              <div className="grid grid-cols-2 gap-2 pt-1">
                <button
                  onClick={() => setTopUpOpen(true)}
                  className="flex items-center justify-center gap-1.5 rounded-2xl bg-mint py-3.5 text-xs font-black text-white shadow-md shadow-mint/40 hover:brightness-105 transition active:scale-95"
                >
                  <Plus size={16} strokeWidth={3} />
                  <span>{t.wallet.topUp}</span>
                </button>

                <button
                  onClick={() => setWithdrawModalOpen(true)}
                  className="flex items-center justify-center gap-1.5 rounded-2xl bg-white/15 py-3.5 text-xs font-black text-white backdrop-blur-md hover:bg-white/25 transition active:scale-95"
                >
                  <ArrowDownLeft size={16} strokeWidth={2.5} />
                  <span>{t.wallet.withdraw}</span>
                </button>
              </div>
            </div>

            {/* Pending / Recent Withdrawals */}
            {withdrawalsQuery && withdrawalsQuery.length > 0 && (
              <section className="rounded-[2rem] bg-white p-5 shadow-card space-y-3">
                <h2 className="text-sm font-extrabold text-ink">Vos demandes de retrait</h2>
                <div className="divide-y divide-gray-100">
                  {withdrawalsQuery.map((w) => (
                    <div key={w._id} className="py-2.5 flex items-center justify-between text-xs first:pt-0 last:pb-0">
                      <div>
                        <span className="font-extrabold text-ink uppercase tracking-wider text-[11px]">
                          {w.method} • {w.accountHolder}
                        </span>
                        <p className="text-[10px] text-muted font-mono">{w.accountNumber}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-black text-ink">{formatCentimes(w.amount)}</p>
                        <span
                          className={`text-[10px] font-bold rounded-full px-2 py-0.5 inline-block ${
                            w.status === "approved"
                              ? "bg-tint-mint text-mint-deep"
                              : w.status === "rejected"
                                ? "bg-red-50 text-danger"
                                : "bg-tint-amber text-amber"
                          }`}
                        >
                          {w.status === "approved" ? "Payé" : w.status === "rejected" ? "Rejeté" : "En cours"}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Ledger Transaction History */}
            <section className="space-y-3">
              <div className="flex items-center justify-between">
                <h2 className="text-base font-extrabold text-ink">{t.wallet.transactions}</h2>
                <span className="text-xs font-semibold text-muted">Grand livre certifié</span>
              </div>

              <div className="rounded-[2rem] bg-white p-5 shadow-card">
                {history.status === "LoadingFirstPage" ? (
                  <p className="text-center text-xs text-muted font-bold py-4">
                    {t.common.loading}
                  </p>
                ) : history.results.length === 0 ? (
                  <p className="text-center text-xs text-muted font-semibold py-4">
                    {t.wallet.noTransactions}
                  </p>
                ) : (
                  <ul className="space-y-3.5 divide-y divide-gray-100">
                    {history.results.map((e) => {
                      const meta = LEDGER[e.reason] ?? LEDGER.admin_adjustment;
                      const credit = e.direction === "credit";
                      return (
                        <li key={e._id} className="flex items-center gap-3.5 pt-3 first:pt-0">
                          <span className={`flex size-11 items-center justify-center rounded-2xl ${meta.tile}`}>
                            <meta.Icon size={20} />
                          </span>
                          <div className="flex-1">
                            <p className="text-sm font-extrabold text-ink">{meta.label}</p>
                            <p className="text-[10px] font-semibold text-muted">
                              {new Date(e._creationTime).toLocaleDateString("fr-DZ", {
                                day: "numeric",
                                month: "short",
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className={`text-sm font-black ${credit ? "text-mint-deep" : "text-danger"}`}>
                              {credit ? "+" : "−"}{formatCentimes(e.amount)}
                            </p>
                            <p className="text-[10px] font-bold text-muted">
                              Solde : {formatCentimes(e.balanceAfter)}
                            </p>
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </div>
            </section>

            {/* Withdrawal Modal */}
            {withdrawModalOpen && (
              <div
                className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 backdrop-blur-sm animate-fadeIn"
                onClick={() => setWithdrawModalOpen(false)}
              >
                <div
                  role="dialog"
                  onClick={(e) => e.stopPropagation()}
                  className="w-full max-w-md animate-[sheet_0.25s_ease-out] rounded-t-[2.5rem] bg-white p-6 pb-8 shadow-2xl space-y-4"
                >
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-black text-ink">{t.wallet.withdrawTitle}</h3>
                    <button
                      onClick={() => setWithdrawModalOpen(false)}
                      className="size-8 flex items-center justify-center rounded-full bg-page text-muted"
                    >
                      <X size={18} />
                    </button>
                  </div>

                  {!isKycApproved ? (
                    /* KYC Requirement Block */
                    <div className="rounded-2xl bg-tint-amber p-4 text-amber space-y-3">
                      <div className="flex items-center gap-2 font-black text-sm">
                        <AlertCircle size={18} />
                        <span>Vérification requise</span>
                      </div>
                      <p className="text-xs font-semibold leading-relaxed">
                        {t.wallet.kycRequired}
                      </p>
                      <Link
                        href="/kyc"
                        className="block text-center rounded-xl bg-amber py-2.5 text-xs font-black text-white hover:brightness-105 transition"
                      >
                        {t.wallet.verifyNow}
                      </Link>
                    </div>
                  ) : (
                    /* Withdrawal Form */
                    <form onSubmit={handleWithdrawalSubmit} className="space-y-3">
                      {/* Method selector */}
                      <div>
                        <label className="block text-xs font-bold text-muted mb-1.5">
                          {t.wallet.method}
                        </label>
                        <div className="grid grid-cols-3 gap-1.5">
                          {[
                            { id: "baridimob", label: "BaridiMob" },
                            { id: "ccp", label: "CCP" },
                            { id: "bank", label: "Banque" },
                          ].map((m) => (
                            <button
                              key={m.id}
                              type="button"
                              onClick={() => setMethod(m.id as WithdrawalMethod)}
                              className={`rounded-xl py-2 text-xs font-bold transition ${
                                method === m.id
                                  ? "bg-brand text-white shadow-sm"
                                  : "bg-page text-muted"
                              }`}
                            >
                              {m.label}
                            </button>
                          ))}
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-muted mb-1.5">
                          {t.wallet.amount} (Max: {formatCentimes(availableCentimes)})
                        </label>
                        <input
                          type="number"
                          required
                          min={500}
                          step={100}
                          value={amountDzd}
                          onChange={(e) =>
                            setAmountDzd(e.target.value === "" ? "" : Number(e.target.value))
                          }
                          placeholder="10 000"
                          className="w-full rounded-2xl bg-page px-4 py-3 text-sm font-bold text-ink outline-none focus:ring-2 focus:ring-brand"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-muted mb-1.5">
                          {t.wallet.accountHolder}
                        </label>
                        <input
                          type="text"
                          required
                          placeholder="Nom et prénom officiel"
                          value={accountHolder}
                          onChange={(e) => setAccountHolder(e.target.value)}
                          className="w-full rounded-2xl bg-page px-4 py-3 text-sm font-bold text-ink outline-none focus:ring-2 focus:ring-brand"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-muted mb-1.5">
                          {t.wallet.accountNumber}
                        </label>
                        <input
                          type="text"
                          required
                          placeholder="Ex: 00799999000123456789 (RIP)"
                          value={accountNumber}
                          onChange={(e) => setAccountNumber(e.target.value)}
                          className="w-full rounded-2xl bg-page px-4 py-3 text-sm font-bold text-ink outline-none focus:ring-2 focus:ring-brand font-mono"
                        />
                      </div>

                      {error && (
                        <p className="rounded-xl bg-red-50 p-2.5 text-xs font-bold text-danger">
                          {error}
                        </p>
                      )}

                      {withdrawSuccess && (
                        <div className="flex items-center gap-1.5 text-xs font-bold text-mint-deep">
                          <CheckCircle2 size={16} /> Demande de retrait enregistrée !
                        </div>
                      )}

                      <button
                        type="submit"
                        disabled={busy || withdrawSuccess}
                        className="w-full rounded-2xl bg-brand py-3.5 text-sm font-black text-white shadow-md shadow-brand/30 hover:bg-brand-deep disabled:opacity-50"
                      >
                        {busy ? "Envoi…" : "Confirmer le retrait"}
                      </button>
                    </form>
                  )}
                </div>
              </div>
            )}

            {/* Chargily TopUp Sheet */}
            <TopUpSheet open={topUpOpen} onClose={() => setTopUpOpen(false)} />
          </>
        )}
      </div>
    </AppShell>
  );
}