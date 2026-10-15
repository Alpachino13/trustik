"use client";

import { useAuthActions } from "@convex-dev/auth/react";
import { useQuery, useConvexAuth } from "convex/react";
import Link from "next/link";
import { useState } from "react";
import {
  ArrowLeft,
  ChevronRight,
  Globe,
  LogOut,
  ShieldCheck,
  User,
} from "lucide-react";
import { api } from "../../../convex/_generated/api";
import { AppShell } from "@/components/AppShell";
import { type Locale, useTranslation } from "@/lib/i18n/context";

// Imports pour la Balance et le Dashboard
import { BalanceCard } from "@/components/BalanceCard";
import { TopUpSheet } from "@/components/TopUpSheet";

export default function ProfilePage() {
  const { signOut } = useAuthActions();
  const { locale, setLocale, t } = useTranslation();
  
  // État d'authentification
  const { isAuthenticated, isLoading } = useConvexAuth();

  // Requête KYC ignorée si non connecté
  const kycQuery = useQuery(api.kyc.status, isAuthenticated ? undefined : "skip");

  // État pour le modal de rechargement depuis la BalanceCard
  const [topUpOpen, setTopUpOpen] = useState(false);

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
            <h1 className="text-xl font-extrabold text-ink">{t.nav.profile}</h1>
            <p className="text-xs font-semibold text-muted">
              Paramètres du compte & sécurité
            </p>
          </div>
        </div>

        {/* Etats de chargement et d'authentification */}
        {isLoading ? (
          <div className="rounded-[2rem] bg-white p-8 text-center text-muted font-bold shadow-card">
            {t.common.loading}
          </div>
        ) : !isAuthenticated ? (
          <div className="rounded-[2.5rem] bg-white p-8 text-center shadow-card space-y-4">
            <div className="mx-auto flex size-14 items-center justify-center rounded-full bg-tint-blue text-brand">
              <ShieldCheck size={28} />
            </div>
            <p className="text-sm font-bold text-ink">
              Vous devez être connecté pour accéder à votre profil et paramètres.
            </p>
          </div>
        ) : (
          <>
            {/* User Card */}
            <div className="rounded-[2.5rem] bg-white p-6 shadow-card flex items-center gap-4">
              <div className="flex size-16 items-center justify-center rounded-full bg-gradient-to-tr from-[#3552dc] to-[#637cf6] text-white shadow-md shadow-brand/25 text-xl font-black">
                <User size={30} />
              </div>
              <div className="space-y-1">
                <p className="text-lg font-black text-ink">Utilisateur Trustik</p>
                <span
                  className={`inline-block rounded-full px-2.5 py-0.5 text-[10px] font-black uppercase ${
                    kycQuery?.kycStatus === "approved"
                      ? "bg-tint-mint text-mint-deep"
                      : "bg-tint-amber text-amber"
                  }`}
                >
                  {kycQuery?.kycStatus === "approved" ? "KYC Vérifié ✓" : "KYC Non vérifié"}
                </span>
              </div>
            </div>

            {/* Carte de Solde Dynamique (Graphique SVG) */}
            <div className="mt-4">
              <BalanceCard onTopUp={() => setTopUpOpen(true)} />
            </div>



            {/* Settings Links */}
            <div className="rounded-[2rem] bg-white p-4 shadow-card divide-y divide-gray-100 mt-4">
              {/* KYC link */}
              <Link
                href="/kyc"
                className="flex items-center justify-between p-3 hover:bg-page rounded-2xl transition"
              >
                <div className="flex items-center gap-3">
                  <div className="flex size-10 items-center justify-center rounded-xl bg-tint-mint text-mint-deep">
                    <ShieldCheck size={20} />
                  </div>
                  <div>
                    <p className="text-sm font-extrabold text-ink">{t.nav.kyc}</p>
                    <p className="text-[11px] font-semibold text-muted">
                      Requis avant le premier retrait
                    </p>
                  </div>
                </div>
                <ChevronRight size={18} className="text-muted" />
              </Link>

              {/* Admin panel link */}
              <Link
                href="/admin"
                className="flex items-center justify-between p-3 hover:bg-page rounded-2xl transition"
              >
                <div className="flex items-center gap-3">
                  <div className="flex size-10 items-center justify-center rounded-xl bg-tint-blue text-brand">
                    <User size={20} />
                  </div>
                  <div>
                    <p className="text-sm font-extrabold text-ink">{t.nav.admin}</p>
                    <p className="text-[11px] font-semibold text-muted">
                      Espace opérateur & modération
                    </p>
                  </div>
                </div>
                <ChevronRight size={18} className="text-muted" />
              </Link>
            </div>
          </>
        )}

        {/* Language selector (Toujours accessible) */}
        <div className="rounded-[2rem] bg-white p-5 shadow-card space-y-3">
          <div className="flex items-center gap-2">
            <Globe size={18} className="text-brand" />
            <h2 className="text-sm font-extrabold text-ink">Langue de l'interface / اللغة</h2>
          </div>

          <div className="grid grid-cols-3 gap-2">
            {[
              { id: "fr", label: "Français" },
              { id: "ar", label: "العربية (RTL)" },
              { id: "en", label: "English" },
            ].map((l) => (
              <button
                key={l.id}
                onClick={() => setLocale(l.id as Locale)}
                className={`rounded-2xl py-2.5 text-xs font-black transition active:scale-95 ${
                  locale === l.id
                    ? "bg-brand text-white shadow-md shadow-brand/20"
                    : "bg-page text-muted hover:bg-gray-200"
                }`}
              >
                {l.label}
              </button>
            ))}
          </div>
        </div>

        {/* Logout (Affiché si connecté) */}
        {isAuthenticated && (
          <button
            onClick={() => void signOut()}
            className="flex w-full items-center justify-center gap-2 rounded-2xl bg-red-50 py-4 text-xs font-black text-danger hover:bg-red-100 transition active:scale-95"
          >
            <LogOut size={16} />
            <span>{t.common.logout}</span>
          </button>
        )}
      </div>

      {/* Modal Recharger depuis le bouton + de la BalanceCard */}
      <TopUpSheet open={topUpOpen} onClose={() => setTopUpOpen(false)} />
    </AppShell>
  );
}