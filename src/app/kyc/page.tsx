"use client";

import { useMutation, useQuery } from "convex/react";
import Link from "next/link";
import { useState } from "react";
import {
  AlertCircle,
  ArrowLeft,
  CheckCircle2,
  Clock,
  FileCheck,
  FileText,
  ShieldCheck,
  Upload,
} from "lucide-react";
import { api } from "../../../convex/_generated/api";
import type { Id } from "../../../convex/_generated/dataModel";
import { AppShell } from "@/components/AppShell";
import { errorMessage } from "@/lib/format";
import { useTranslation } from "@/lib/i18n/context";

type DocType = "national_id" | "passport" | "driver_license";

export default function KycPage() {
  const { t } = useTranslation();
  const kycStatusQuery = useQuery(api.kyc.status);
  const generateUploadUrl = useMutation(api.kyc.generateUploadUrl);
  const submitKyc = useMutation(api.kyc.submit);

  const [fullName, setFullName] = useState("");
  const [documentType, setDocumentType] = useState<DocType>("national_id");
  const [documentNumber, setDocumentNumber] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const currentStatus = kycStatusQuery?.kycStatus ?? "none";

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!file) {
      setError("Veuillez sélectionner un fichier (photo ou scan de votre document)");
      return;
    }

    setError(null);
    setBusy(true);

    try {
      // 1. Get secure storage upload URL from Convex
      const uploadUrl = await generateUploadUrl();

      // 2. Upload file to Convex Storage
      const res = await fetch(uploadUrl, {
        method: "POST",
        headers: { "Content-Type": file.type },
        body: file,
      });

      if (!res.ok) throw new Error("Échec du téléversement du document");
      const { storageId } = (await res.json()) as { storageId: Id<"_storage"> };

      // 3. Submit KYC record
      await submitKyc({
        fullName: fullName.trim(),
        documentType,
        documentNumber: documentNumber.trim(),
        documentFileId: storageId,
      });

      setSuccess(true);
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
            href="/wallet"
            aria-label={t.common.back}
            className="flex size-10 items-center justify-center rounded-full bg-white text-ink shadow-card hover:bg-page transition active:scale-95"
          >
            <ArrowLeft size={18} />
          </Link>
          <div>
            <h1 className="text-xl font-extrabold text-ink">{t.kyc.title}</h1>
            <p className="text-xs font-semibold text-muted">
              Conformité et sécurité des retraits
            </p>
          </div>
        </div>

        {/* Status Card */}
        <div className="rounded-[2rem] bg-white p-5 shadow-card space-y-3">
          <span className="text-[10px] font-bold uppercase tracking-wider text-muted">
            Statut actuel de vérification
          </span>

          {currentStatus === "approved" && (
            <div className="flex items-center gap-3 rounded-2xl bg-tint-mint p-4 text-mint-deep">
              <CheckCircle2 size={24} className="shrink-0" />
              <div>
                <p className="font-extrabold text-sm">{t.kyc.statusApproved}</p>
                <p className="text-xs font-semibold">
                  Votre identité est confirmée. Vos demandes de retrait sont autorisées.
                </p>
              </div>
            </div>
          )}

          {currentStatus === "pending" && (
            <div className="flex items-center gap-3 rounded-2xl bg-tint-blue p-4 text-brand">
              <Clock size={24} className="shrink-0 animate-spin" />
              <div>
                <p className="font-extrabold text-sm">{t.kyc.statusPending}</p>
                <p className="text-xs font-semibold">
                  Dossier reçu. L'équipe d'administration examine votre pièce sous 24h.
                </p>
              </div>
            </div>
          )}

          {currentStatus === "rejected" && (
            <div className="flex items-center gap-3 rounded-2xl bg-red-50 p-4 text-danger">
              <AlertCircle size={24} className="shrink-0" />
              <div>
                <p className="font-extrabold text-sm">{t.kyc.statusRejected}</p>
                <p className="text-xs font-semibold">
                  Document illisible ou non conforme. Merci de renvoyer une photo nette.
                </p>
              </div>
            </div>
          )}

          {currentStatus === "none" && (
            <div className="flex items-center gap-3 rounded-2xl bg-page p-4 text-ink">
              <ShieldCheck size={24} className="shrink-0 text-brand" />
              <p className="text-xs font-semibold text-muted">
                {t.kyc.subtitle}
              </p>
            </div>
          )}
        </div>

        {/* KYC Submission Form (if not approved) */}
        {currentStatus !== "approved" && currentStatus !== "pending" && !success && (
          <form
            onSubmit={handleSubmit}
            className="rounded-[2rem] bg-white p-5 shadow-card space-y-4"
          >
            <h2 className="text-base font-extrabold text-ink">
              Dépôt d'une pièce d'identité
            </h2>

            {/* Document Type Selector */}
            <div>
              <label className="block text-xs font-bold text-muted mb-1.5">
                {t.kyc.docType}
              </label>
              <div className="grid grid-cols-3 gap-1.5">
                {[
                  { id: "national_id", label: "Carte CNI" },
                  { id: "passport", label: "Passeport" },
                  { id: "driver_license", label: "Permis" },
                ].map((d) => (
                  <button
                    key={d.id}
                    type="button"
                    onClick={() => setDocumentType(d.id as DocType)}
                    className={`rounded-xl py-2.5 text-xs font-bold transition active:scale-95 ${
                      documentType === d.id
                        ? "bg-brand text-white shadow-sm"
                        : "bg-page text-muted hover:bg-gray-200"
                    }`}
                  >
                    {d.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Official Full Name */}
            <div>
              <label className="block text-xs font-bold text-muted mb-1.5">
                {t.kyc.fullName}
              </label>
              <input
                type="text"
                required
                placeholder="Tel qu'indiqué sur la pièce d'identité"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full rounded-2xl bg-page px-4 py-3 text-sm font-bold text-ink outline-none focus:ring-2 focus:ring-brand"
              />
            </div>

            {/* Document Number */}
            <div>
              <label className="block text-xs font-bold text-muted mb-1.5">
                {t.kyc.docNumber}
              </label>
              <input
                type="text"
                required
                placeholder="Numéro national ou numéro de série"
                value={documentNumber}
                onChange={(e) => setDocumentNumber(e.target.value)}
                className="w-full rounded-2xl bg-page px-4 py-3 text-sm font-bold text-ink outline-none focus:ring-2 focus:ring-brand font-mono"
              />
            </div>

            {/* File Upload */}
            <div>
              <label className="block text-xs font-bold text-muted mb-1.5">
                {t.kyc.uploadDoc}
              </label>
              <div className="relative flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-gray-300 bg-page/60 p-6 text-center hover:border-brand hover:bg-white transition cursor-pointer">
                <input
                  type="file"
                  required
                  accept="image/png,image/jpeg,image/webp,application/pdf"
                  onChange={(e) => setFile(e.target.files?.[0] || null)}
                  className="absolute inset-0 opacity-0 cursor-pointer"
                />
                <Upload size={24} className="text-muted mb-2" />
                <p className="text-xs font-bold text-ink">
                  {file ? file.name : "Cliquez ou déposez votre fichier"}
                </p>
                <p className="text-[10px] text-muted mt-1">
                  PNG, JPG ou PDF (max 10 Mo)
                </p>
              </div>
            </div>

            {error && (
              <p className="rounded-xl bg-red-50 p-3 text-xs font-bold text-danger">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={busy}
              className="w-full rounded-2xl bg-brand py-4 text-sm font-black text-white shadow-lg shadow-brand/30 hover:bg-brand-deep transition active:scale-[0.99] disabled:opacity-50"
            >
              {busy ? "Envoi du dossier…" : t.kyc.submitButton}
            </button>
          </form>
        )}

        {success && (
          <div className="rounded-[2rem] bg-tint-mint p-6 text-center text-mint-deep space-y-3">
            <CheckCircle2 size={36} className="mx-auto" />
            <p className="text-base font-black">Dossier KYC transmis avec succès</p>
            <p className="text-xs font-semibold">
              Votre document est maintenant en cours de vérification par un opérateur.
            </p>
            <Link
              href="/wallet"
              className="inline-block rounded-full bg-mint-deep px-5 py-2 text-xs font-bold text-white shadow"
            >
              Retour au portefeuille
            </Link>
          </div>
        )}
      </div>
    </AppShell>
  );
}
