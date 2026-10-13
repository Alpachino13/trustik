"use client";

import { useAction, useMutation, useQuery } from "convex/react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Suspense, use, useState } from "react";
import {
  AlertTriangle,
  ArrowLeft,
  CheckCircle2,
  Clock,
  DollarSign,
  HandCoins,
  Lock,
  MessageSquare,
  ShieldAlert,
  ShieldCheck,
  XCircle,
} from "lucide-react";
import { api } from "../../../../convex/_generated/api";
import type { Id } from "../../../../convex/_generated/dataModel";
import { AppShell } from "@/components/AppShell";
import { TopUpSheet } from "@/components/TopUpSheet";
import { errorMessage, formatCentimes, formatDzd } from "@/lib/format";
import { DEAL_STATUS } from "@/lib/labels";
import { useTranslation } from "@/lib/i18n/context";

function DealDetailView({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const resolvedParams = use(params);
  const router = useRouter();
  const { t } = useTranslation();
  const dealId = resolvedParams.id as Id<"deals">;

  const deal = useQuery(api.deals.get, dealId ? { dealId } : "skip");
  const wallet = useQuery(api.wallet.me);

  const acceptDeal = useMutation(api.deals.accept);
  const cancelDeal = useMutation(api.deals.cancel);
  const fundDeal = useMutation(api.deals.fund);
  const releaseDeal = useMutation(api.deals.release);
  const disputeDeal = useMutation(api.deals.dispute);

  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [disputeModalOpen, setDisputeModalOpen] = useState(false);
  const [disputeReason, setDisputeReason] = useState("");
  const [topUpOpen, setTopUpOpen] = useState(false);

  if (deal === undefined) {
    return (
      <AppShell>
        <div className="rounded-[2rem] bg-white p-8 text-center text-muted font-bold shadow-card">
          {t.common.loading}
        </div>
      </AppShell>
    );
  }

  if (deal === null) {
    return (
      <AppShell>
        <div className="rounded-[2rem] bg-white p-8 text-center shadow-card space-y-3">
          <p className="text-base font-black text-ink">Deal introuvable</p>
          <Link
            href="/deals"
            className="inline-block rounded-full bg-brand px-5 py-2 text-xs font-bold text-white"
          >
            Retour aux deals
          </Link>
        </div>
      </AppShell>
    );
  }

  const statusMeta = DEAL_STATUS[deal.status] || DEAL_STATUS.pending;
  const isBuyer = deal.myRole === "buyer";
  const isSeller = deal.myRole === "seller";
  const isCreator = deal.creatorRole === deal.myRole;
  const walletBalance = wallet?.balance ?? 0;
  const hasEnoughFunds = walletBalance >= deal.amount;

  async function handleAccept() {
    setError(null);
    setBusy(true);
    try {
      await acceptDeal({ dealId });
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  async function handleCancel() {
    if (!confirm("Voulez-vous vraiment annuler ce deal ?")) return;
    setError(null);
    setBusy(true);
    try {
      await cancelDeal({ dealId });
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  async function handleFund() {
    setError(null);
    setBusy(true);
    try {
      await fundDeal({ dealId });
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  async function handleRelease() {
    if (!confirm("Confirmez-vous la bonne réception ? Les fonds seront transférés au vendeur.")) return;
    setError(null);
    setBusy(true);
    try {
      await releaseDeal({ dealId });
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  async function handleDisputeSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (disputeReason.trim().length < 10) {
      setError("Veuillez expliquer le motif en au moins 10 caractères.");
      return;
    }
    setError(null);
    setBusy(true);
    try {
      await disputeDeal({ dealId, reason: disputeReason.trim() });
      setDisputeModalOpen(false);
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
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link
              href="/deals"
              aria-label={t.common.back}
              className="flex size-10 items-center justify-center rounded-full bg-white text-ink shadow-card hover:bg-page transition active:scale-95"
            >
              <ArrowLeft size={18} />
            </Link>
            <div>
              <h1 className="text-xl font-extrabold text-ink line-clamp-1">
                {deal.title}
              </h1>
              <p className="text-xs font-semibold text-muted">
                Votre rôle : {isBuyer ? "Acheteur" : isSeller ? "Vendeur" : "Partenaire invité"}
              </p>
            </div>
          </div>

          <span
            className={`rounded-full px-3 py-1 text-xs font-black ${statusMeta.chip}`}
          >
            {statusMeta.label}
          </span>
        </div>

        {/* State Banner & Progress */}
        <div className="rounded-[2rem] bg-white p-5 shadow-card space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-muted">
                Montant en jeu
              </span>
              <p className="text-2xl font-black text-ink">
                {formatCentimes(deal.amount)}
              </p>
            </div>
            <div className="text-right">
              <span className="text-[10px] font-bold uppercase tracking-wider text-muted">
                Protection Trustik
              </span>
              <p className="text-xs font-extrabold text-mint-deep flex items-center gap-1 justify-end">
                <ShieldCheck size={14} /> Séquestre Garanti
              </p>
            </div>
          </div>

          {/* Machine à état progress */}
          <div className="space-y-1.5 pt-2">
            <div className="flex justify-between text-[11px] font-bold text-muted">
              <span>Étape : {statusMeta.label}</span>
              <span>{statusMeta.pct}%</span>
            </div>
            <div className="h-2 w-full rounded-full bg-page overflow-hidden">
              <div
                className={`h-full rounded-full ${statusMeta.bar} transition-all duration-500`}
                style={{ width: `${statusMeta.pct}%` }}
              />
            </div>
          </div>
        </div>

        {/* Deal Description & Terms */}
        <div className="rounded-[2rem] bg-white p-5 shadow-card space-y-3">
          <h2 className="text-sm font-extrabold text-ink">Conditions du deal</h2>
          <p className="text-xs leading-relaxed text-ink/80 whitespace-pre-wrap bg-page p-3.5 rounded-2xl">
            {deal.description || "Aucune condition spécifiée."}
          </p>

          <div className="grid grid-cols-2 gap-2 text-xs pt-1">
            <div className="rounded-2xl border border-gray-100 p-3">
              <span className="text-[10px] font-bold text-muted block">Rôle créateur</span>
              <span className="font-extrabold text-ink capitalize">{deal.creatorRole}</span>
            </div>
            <div className="rounded-2xl border border-gray-100 p-3">
              <span className="text-[10px] font-bold text-muted block">Frais plateforme</span>
              <span className="font-extrabold text-brand">5% à la libération</span>
            </div>
          </div>
        </div>

        {/* Action Notifications & Contextual Buttons */}
        {error && (
          <p className="rounded-2xl bg-red-50 p-3 text-xs font-bold text-danger">
            {error}
          </p>
        )}

        {/* State: Pending */}
        {deal.status === "pending" && (
          <div className="rounded-[2rem] bg-white p-5 shadow-card space-y-3">
            <div className="flex items-center gap-2 text-xs font-bold text-amber">
              <Clock size={16} />
              <span>En attente de confirmation de la contrepartie</span>
            </div>

            {/* If I am the counterparty: Accept or Decline */}
            {!isCreator && (
              <div className="grid grid-cols-2 gap-2 pt-2">
                <button
                  onClick={handleAccept}
                  disabled={busy}
                  className="rounded-2xl bg-brand py-3.5 text-xs font-black text-white shadow-md shadow-brand/30 hover:bg-brand-deep transition active:scale-95 disabled:opacity-50"
                >
                  {busy ? "Traitement…" : t.deals.accept}
                </button>
                <button
                  onClick={handleCancel}
                  disabled={busy}
                  className="rounded-2xl bg-page py-3.5 text-xs font-bold text-muted hover:text-danger hover:bg-red-50 transition active:scale-95 disabled:opacity-50"
                >
                  {t.deals.reject}
                </button>
              </div>
            )}

            {/* If I am creator: Cancel */}
            {isCreator && (
              <button
                onClick={handleCancel}
                disabled={busy}
                className="w-full rounded-2xl bg-page py-3.5 text-xs font-bold text-muted hover:text-danger hover:bg-red-50 transition active:scale-95 disabled:opacity-50"
              >
                {t.deals.cancelDeal}
              </button>
            )}
          </div>
        )}

        {/* State: Accepted -> Needs Funding */}
        {deal.status === "accepted" && (
          <div className="rounded-[2rem] bg-white p-5 shadow-card space-y-3">
            <div className="flex items-center gap-2 text-xs font-bold text-brand">
              <Lock size={16} />
              <span>Deal accepté. L'acheteur doit bloquer les fonds en séquestre.</span>
            </div>

            {isBuyer && (
              <div className="space-y-2 pt-1">
                {hasEnoughFunds ? (
                  <button
                    onClick={handleFund}
                    disabled={busy}
                    className="w-full rounded-2xl bg-brand py-4 text-sm font-black text-white shadow-lg shadow-brand/30 hover:bg-brand-deep transition active:scale-[0.99] disabled:opacity-50"
                  >
                    {busy ? "Séquestration en cours…" : t.deals.fundDeal}
                  </button>
                ) : (
                  <div className="space-y-2">
                    <p className="text-xs font-bold text-danger">
                      Solde insuffisant ({formatCentimes(walletBalance)} disponibles pour {formatCentimes(deal.amount)} requis).
                    </p>
                    <button
                      onClick={() => setTopUpOpen(true)}
                      className="w-full rounded-2xl bg-mint py-3.5 text-xs font-black text-white shadow-md shadow-mint/30 hover:brightness-105 transition active:scale-95"
                    >
                      Recharger mon portefeuille par carte CIB/EDAHABIA
                    </button>
                  </div>
                )}
              </div>
            )}

            <button
              onClick={handleCancel}
              disabled={busy}
              className="w-full rounded-2xl bg-page py-3 text-xs font-bold text-muted hover:text-danger hover:bg-red-50 transition active:scale-95 disabled:opacity-50"
            >
              {t.deals.cancelDeal}
            </button>
          </div>
        )}

        {/* State: Funded -> Buyer can release or either can dispute */}
        {deal.status === "funded" && (
          <div className="rounded-[2rem] bg-white p-5 shadow-card space-y-3">
            <div className="flex items-center gap-2 text-xs font-bold text-mint-deep">
              <ShieldCheck size={18} />
              <span>Fonds sécurisés en séquestre. Le vendeur peut procéder à la livraison.</span>
            </div>

            {isBuyer && (
              <button
                onClick={handleRelease}
                disabled={busy}
                className="w-full rounded-2xl bg-mint py-4 text-sm font-black text-white shadow-lg shadow-mint/40 hover:brightness-105 transition active:scale-[0.99] disabled:opacity-50"
              >
                {busy ? "Libération…" : t.deals.releaseFunds}
              </button>
            )}

            <button
              onClick={() => setDisputeModalOpen(true)}
              className="w-full rounded-2xl bg-red-50 py-3 text-xs font-extrabold text-danger hover:bg-red-100 transition active:scale-95"
            >
              {t.deals.openDispute}
            </button>
          </div>
        )}

        {/* State: Disputed */}
        {deal.status === "disputed" && (
          <div className="rounded-[2rem] bg-red-50 p-5 border border-red-200 text-danger space-y-2">
            <div className="flex items-center gap-2 font-black text-sm">
              <AlertTriangle size={18} />
              <span>Litige en cours d'examen</span>
            </div>
            <p className="text-xs leading-relaxed text-danger/90">
              Un arbitre Trustik examine ce deal. Les fonds restent bloqués en sécurité jusqu'à la décision.
            </p>
          </div>
        )}

        {/* State: Released / Settled */}
        {deal.status === "released" && (
          <div className="rounded-[2rem] bg-tint-mint p-5 text-mint-deep space-y-2">
            <div className="flex items-center gap-2 font-black text-sm">
              <CheckCircle2 size={18} />
              <span>Deal terminé avec succès</span>
            </div>
            <p className="text-xs font-semibold">
              Les fonds ont été libérés et crédités sur le portefeuille du vendeur.
            </p>
          </div>
        )}

        {/* Dispute Reason Modal */}
        {disputeModalOpen && (
          <div
            className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 backdrop-blur-sm animate-fadeIn"
            onClick={() => setDisputeModalOpen(false)}
          >
            <div
              role="dialog"
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-md animate-[sheet_0.25s_ease-out] rounded-t-[2.5rem] bg-white p-6 pb-8 shadow-2xl space-y-4"
            >
              <h3 className="text-lg font-black text-ink">{t.deals.openDispute}</h3>
              <p className="text-xs font-semibold text-muted">
                {t.deals.disputeReason}
              </p>

              <textarea
                rows={4}
                required
                value={disputeReason}
                onChange={(e) => setDisputeReason(e.target.value)}
                placeholder="Ex: Le colis n'a jamais été livré après 10 jours, ou l'article reçu ne correspond pas à la description…"
                className="w-full rounded-2xl bg-page p-4 text-xs font-bold text-ink outline-none focus:ring-2 focus:ring-brand resize-none"
              />

              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setDisputeModalOpen(false)}
                  className="rounded-2xl bg-page py-3 text-xs font-bold text-muted hover:bg-gray-200"
                >
                  {t.common.cancel}
                </button>
                <button
                  type="button"
                  onClick={handleDisputeSubmit}
                  disabled={busy}
                  className="rounded-2xl bg-danger py-3 text-xs font-black text-white shadow-md shadow-danger/30 hover:brightness-105 disabled:opacity-50"
                >
                  {busy ? "Envoi…" : t.deals.submitDispute}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Top up modal if needed */}
        <TopUpSheet open={topUpOpen} onClose={() => setTopUpOpen(false)} />
      </div>
    </AppShell>
  );
}

export default function DealDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  return (
    <Suspense
      fallback={
        <div className="mx-auto min-h-screen max-w-md px-4 pt-16 text-center text-muted font-bold">
          Chargement…
        </div>
      }
    >
      <DealDetailView params={params} />
    </Suspense>
  );
}
