"use client";

import { useMutation, useQuery } from "convex/react";
import Link from "next/link";
import { useState } from "react";
import {
  AlertTriangle,
  ArrowLeft,
  Check,
  CheckCircle2,
  ExternalLink,
  FileText,
  Scale,
  ShieldCheck,
  Users,
  X,
} from "lucide-react";
import { api } from "../../../convex/_generated/api";
import type { Id } from "../../../convex/_generated/dataModel";
import { AppShell } from "@/components/AppShell";
import { errorMessage, formatCentimes } from "@/lib/format";
import { useTranslation } from "@/lib/i18n/context";

type AdminTab = "kyc" | "withdrawals" | "deals";

export default function AdminPage() {
  const { t } = useTranslation();
  const [tab, setTab] = useState<AdminTab>("kyc");

  const pendingKyc = useQuery(api.kyc.pending);
  const pendingWithdrawals = useQuery(api.withdrawals.pending);

  const reviewKyc = useMutation(api.kyc.review);
  const approveWithdrawal = useMutation(api.withdrawals.approve);
  const rejectWithdrawal = useMutation(api.withdrawals.reject);

  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleKycReview(submissionId: Id<"kycSubmissions">, approve: boolean) {
    setError(null);
    setBusy(true);
    try {
      await reviewKyc({ submissionId, approve, note: note || undefined });
      setNote("");
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  async function handleWithdrawalApprove(withdrawalId: Id<"withdrawals">) {
    setError(null);
    setBusy(true);
    try {
      await approveWithdrawal({ withdrawalId, note: note || undefined });
      setNote("");
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  async function handleWithdrawalReject(withdrawalId: Id<"withdrawals">) {
    if (!confirm("Voulez-vous rejeter ce retrait ? Le solde sera restitué à l'utilisateur.")) return;
    setError(null);
    setBusy(true);
    try {
      await rejectWithdrawal({ withdrawalId, note: note || undefined });
      setNote("");
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
              href="/"
              aria-label={t.common.back}
              className="flex size-10 items-center justify-center rounded-full bg-white text-ink shadow-card hover:bg-page transition active:scale-95"
            >
              <ArrowLeft size={18} />
            </Link>
            <div>
              <h1 className="text-xl font-extrabold text-ink">{t.admin.title}</h1>
              <p className="text-xs font-semibold text-muted">Opérateur Trustik</p>
            </div>
          </div>
        </div>

        {/* Tab switch */}
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={() => setTab("kyc")}
            className={`rounded-2xl py-3 text-xs font-black transition active:scale-95 ${
              tab === "kyc"
                ? "bg-brand text-white shadow-md shadow-brand/20"
                : "bg-white text-muted hover:bg-gray-100 shadow-card"
            }`}
          >
            {t.admin.kycTab} ({pendingKyc?.length ?? "…"})
          </button>
          <button
            onClick={() => setTab("withdrawals")}
            className={`rounded-2xl py-3 text-xs font-black transition active:scale-95 ${
              tab === "withdrawals"
                ? "bg-brand text-white shadow-md shadow-brand/20"
                : "bg-white text-muted hover:bg-gray-100 shadow-card"
            }`}
          >
            {t.admin.withdrawalsTab} ({pendingWithdrawals?.length ?? "…"})
          </button>
        </div>

        {error && (
          <p className="rounded-2xl bg-red-50 p-3 text-xs font-bold text-danger">
            {error}
          </p>
        )}

        {/* Tab 1: KYC Submissions */}
        {tab === "kyc" && (
          <div className="space-y-4">
            {pendingKyc === undefined ? (
              <div className="rounded-[2rem] bg-white p-8 text-center text-muted font-bold shadow-card">
                {t.common.loading}
              </div>
            ) : pendingKyc.length === 0 ? (
              <div className="rounded-[2rem] bg-white p-8 text-center shadow-card text-muted font-bold text-xs">
                Aucun dossier KYC en attente de validation.
              </div>
            ) : (
              pendingKyc.map((item) => (
                <div
                  key={item._id}
                  className="rounded-[2rem] bg-white p-5 shadow-card space-y-3"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-sm font-black text-ink">{item.fullName}</p>
                      <p className="text-[11px] font-bold text-muted capitalize">
                        {item.documentType} • N° {item.documentNumber}
                      </p>
                    </div>
                    {item.fileUrl && (
                      <a
                        href={item.fileUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="flex items-center gap-1 rounded-full bg-tint-blue px-3 py-1 text-[11px] font-extrabold text-brand hover:underline"
                      >
                        <span>Voir document</span>
                        <ExternalLink size={12} />
                      </a>
                    )}
                  </div>

                  <input
                    type="text"
                    placeholder={t.admin.notePlaceholder}
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    className="w-full rounded-xl bg-page px-3 py-2 text-xs font-semibold text-ink outline-none"
                  />

                  <div className="grid grid-cols-2 gap-2 pt-1">
                    <button
                      onClick={() => handleKycReview(item._id, true)}
                      disabled={busy}
                      className="rounded-xl bg-mint py-2.5 text-xs font-black text-white hover:brightness-105 disabled:opacity-50"
                    >
                      {t.admin.approve}
                    </button>
                    <button
                      onClick={() => handleKycReview(item._id, false)}
                      disabled={busy}
                      className="rounded-xl bg-red-50 py-2.5 text-xs font-bold text-danger hover:bg-red-100 disabled:opacity-50"
                    >
                      {t.admin.reject}
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* Tab 2: Withdrawals */}
        {tab === "withdrawals" && (
          <div className="space-y-4">
            {pendingWithdrawals === undefined ? (
              <div className="rounded-[2rem] bg-white p-8 text-center text-muted font-bold shadow-card">
                {t.common.loading}
              </div>
            ) : pendingWithdrawals.length === 0 ? (
              <div className="rounded-[2rem] bg-white p-8 text-center shadow-card text-muted font-bold text-xs">
                Aucun virement de retrait en attente.
              </div>
            ) : (
              pendingWithdrawals.map((w) => (
                <div
                  key={w._id}
                  className="rounded-[2rem] bg-white p-5 shadow-card space-y-3"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="rounded-full bg-tint-blue px-2.5 py-0.5 text-[10px] font-black uppercase text-brand">
                        {w.method}
                      </span>
                      <p className="text-base font-black text-ink mt-1">
                        {formatCentimes(w.amount)}
                      </p>
                      <p className="text-xs font-extrabold text-ink mt-0.5">
                        {w.accountHolder}
                      </p>
                      <p className="text-xs font-mono text-muted">{w.accountNumber}</p>
                    </div>
                  </div>

                  <input
                    type="text"
                    placeholder="Numéro de transaction bancaire ou note…"
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    className="w-full rounded-xl bg-page px-3 py-2 text-xs font-semibold text-ink outline-none"
                  />

                  <div className="grid grid-cols-2 gap-2 pt-1">
                    <button
                      onClick={() => handleWithdrawalApprove(w._id)}
                      disabled={busy}
                      className="rounded-xl bg-brand py-2.5 text-xs font-black text-white hover:bg-brand-deep disabled:opacity-50"
                    >
                      {t.admin.paid}
                    </button>
                    <button
                      onClick={() => handleWithdrawalReject(w._id)}
                      disabled={busy}
                      className="rounded-xl bg-red-50 py-2.5 text-xs font-bold text-danger hover:bg-red-100 disabled:opacity-50"
                    >
                      {t.admin.reject}
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </AppShell>
  );
}
