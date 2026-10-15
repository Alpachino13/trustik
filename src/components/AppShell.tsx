"use client";

import { useAuthActions } from "@convex-dev/auth/react";
import { useConvexAuth } from "convex/react";
import {
  Bell,
  Globe,
  Handshake,
  Home,
  LogOut,
  Plus,
  ShieldCheck,
  User,
  Wallet,
  Loader2,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, type ReactNode } from "react";
import { TopUpSheet } from "./TopUpSheet";
import { type Locale, useTranslation } from "@/lib/i18n/context";

export function AppShell({ children }: { children: ReactNode }) {
  const { signOut } = useAuthActions();
  const { isAuthenticated, isLoading } = useConvexAuth();
  const pathname = usePathname();
  const { locale, setLocale, t } = useTranslation();
  const [topUpOpen, setTopUpOpen] = useState(false);

  // 1. Définir les routes publiques liées à l'authentification
  const isAuthRoute = pathname === "/login" || pathname === "/signin" || pathname === "/register";

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <Loader2 className="size-8 animate-spin text-brand" />
      </div>
    );
  }

  // 2. Bloquer l'application UNIQUEMENT si l'utilisateur n'est pas connecté 
  // ET qu'il n'est pas déjà en train d'essayer de se connecter (isAuthRoute)
  if (!isAuthenticated && !isAuthRoute) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 p-4">
        <div className="w-full max-w-md rounded-[2.5rem] bg-white p-8 text-center shadow-card space-y-6">
          <div className="mx-auto flex size-16 items-center justify-center rounded-3xl bg-gradient-to-tr from-[#3552dc] to-[#5b75f0] text-white shadow-md shadow-brand/25">
            <ShieldCheck size={32} />
          </div>

          <div>
            <h1 className="text-2xl font-black text-ink">Bienvenue sur Trustik</h1>
            <p className="text-xs font-semibold text-muted mt-1">
              Paiements sécurisés par séquestre en Algérie
            </p>
          </div>

          <div className="space-y-3 pt-2">
            {/* 3. Ce bouton pointe désormais vers la route de connexion */}
            <Link
              href="/login"
              className="flex w-full items-center justify-center rounded-2xl bg-brand py-4 text-sm font-black text-white shadow-md shadow-brand/30 hover:bg-brand-deep transition active:scale-95"
            >
              Se connecter / S'inscrire
            </Link>
          </div>
        </div>
      </div>
    );
  }
  // --- ÉTAPE 3 : Application normale (Utilisateur connecté) ---
  const navItems = [
    { href: "/", label: t.nav.home, Icon: Home },
    { href: "/deals", label: t.nav.deals, Icon: Handshake },
    { href: "/wallet", label: t.nav.wallet, Icon: Wallet },
    { href: "/profile", label: t.nav.profile, Icon: User },
  ];

  // Extracted Logo component for reuse in mobile header and desktop sidebar
  const Logo = ({ className = "" }: { className?: string }) => (
    <Link href="/" className={`flex items-center gap-3 group ${className}`}>
      <div className="relative">
        <div className="flex size-11 items-center justify-center rounded-2xl bg-gradient-to-tr from-[#3552dc] to-[#5b75f0] text-white shadow-md shadow-brand/25">
          <ShieldCheck size={22} />
        </div>
        <span className="absolute bottom-0 right-0 size-3 rounded-full border-2 border-white bg-mint" />
      </div>
      <div>
        <p className="text-[10px] font-bold uppercase tracking-wider text-muted">
          {t.common.appTitle}
        </p>
        <p className="font-extrabold text-ink text-base group-hover:text-brand transition">
          Séquestre Algérie
        </p>
      </div>
    </Link>
  );

  return (
    <div className="min-h-screen bg-slate-50 md:flex">
      
      {/* Sidebar (Desktop) / Bottom Nav (Mobile) */}
      <nav
        aria-label="Navigation principale"
        className="fixed inset-x-0 bottom-0 z-40 mx-auto flex max-w-md items-end justify-between rounded-t-[2.5rem] bg-white px-4 pb-[max(0.35rem,env(safe-area-inset-bottom))] shadow-[0_-10px_32px_-12px_rgba(53,82,220,0.18)] 
        md:inset-auto md:left-0 md:top-0 md:h-screen md:w-[280px] md:max-w-none md:flex-col md:items-stretch md:justify-start md:rounded-none md:border-r md:border-slate-100 md:px-6 md:py-8 md:shadow-none"
      >
        {/* Desktop Logo in Sidebar */}
        <Logo className="hidden md:flex mb-10" />

        <div className="flex w-full items-end justify-between md:flex-col md:items-stretch md:gap-2">
          {/* Tab 1: Home */}
          <Link
            href="/"
            aria-label={navItems[0].label}
            className={`flex flex-1 flex-col items-center gap-1 py-3 text-[11px] font-extrabold transition md:flex-row md:px-4 md:py-3 md:text-sm md:rounded-xl md:flex-none ${
              pathname === "/" ? "text-brand md:bg-blue-50/50" : "text-muted hover:text-ink md:hover:bg-slate-50"
            }`}
          >
            <Home size={22} strokeWidth={pathname === "/" ? 2.5 : 2} className="md:size-5" />
            <span>{navItems[0].label}</span>
          </Link>

          {/* Tab 2: Deals */}
          <Link
            href="/deals"
            aria-label={navItems[1].label}
            className={`flex flex-1 flex-col items-center gap-1 py-3 text-[11px] font-extrabold transition md:flex-row md:px-4 md:py-3 md:text-sm md:rounded-xl md:flex-none ${
              pathname.startsWith("/deals") && pathname !== "/deals/new"
                ? "text-brand md:bg-blue-50/50"
                : "text-muted hover:text-ink md:hover:bg-slate-50"
            }`}
          >
            <Handshake
              size={22}
              strokeWidth={pathname.startsWith("/deals") && pathname !== "/deals/new" ? 2.5 : 2}
              className="md:size-5"
            />
            <span>{navItems[1].label}</span>
          </Link>

          {/* Center Floating (+) Mint Button: Create Deal */}
          <Link
            href="/deals/new"
            aria-label={t.nav.newDeal}
            className="-mt-7 mb-3.5 flex size-14 shrink-0 items-center justify-center rounded-full bg-mint text-white shadow-lg shadow-mint/45 transition hover:brightness-105 active:scale-95 md:mt-4 md:mb-6 md:h-12 md:w-full md:rounded-xl md:gap-2 md:shadow-md md:justify-center"
          >
            <Plus size={28} strokeWidth={3} className="md:size-5 md:stroke-2" />
            <span className="hidden md:inline font-bold">{t.nav.newDeal || "Créer un Deal"}</span>
          </Link>

          {/* Tab 3: Wallet */}
          <Link
            href="/wallet"
            aria-label={navItems[2].label}
            className={`flex flex-1 flex-col items-center gap-1 py-3 text-[11px] font-extrabold transition md:flex-row md:px-4 md:py-3 md:text-sm md:rounded-xl md:flex-none ${
              pathname.startsWith("/wallet") ? "text-brand md:bg-blue-50/50" : "text-muted hover:text-ink md:hover:bg-slate-50"
            }`}
          >
            <Wallet size={22} strokeWidth={pathname.startsWith("/wallet") ? 2.5 : 2} className="md:size-5" />
            <span>{navItems[2].label}</span>
          </Link>

          {/* Tab 4: Profile */}
          <Link
            href="/profile"
            aria-label={navItems[3].label}
            className={`flex flex-1 flex-col items-center gap-1 py-3 text-[11px] font-extrabold transition md:flex-row md:px-4 md:py-3 md:text-sm md:rounded-xl md:flex-none ${
              pathname.startsWith("/profile") ? "text-brand md:bg-blue-50/50" : "text-muted hover:text-ink md:hover:bg-slate-50"
            }`}
          >
            <User size={22} strokeWidth={pathname.startsWith("/profile") ? 2.5 : 2} className="md:size-5" />
            <span>{navItems[3].label}</span>
          </Link>
        </div>
      </nav>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 md:pl-[280px]">
        {/* Header Container */}
        <div className="mx-auto w-full max-w-md px-4 pt-5 md:max-w-7xl md:px-8 md:pt-8">
          <header className="mb-5 flex items-center justify-between md:mb-8 md:justify-end">
            {/* Mobile Logo Only */}
            <Logo className="md:hidden" />

            {/* Quick Actions Menu */}
            <div className="flex items-center gap-1.5 md:gap-3">
              {/* Language Switcher */}
              <button
                onClick={() => {
                  const next: Locale = locale === "fr" ? "ar" : locale === "ar" ? "en" : "fr";
                  setLocale(next);
                }}
                title="Changer de langue / تغيير اللغة"
                className="flex items-center gap-1 rounded-full bg-white px-2.5 py-1 text-xs font-black text-ink shadow-sm border border-slate-100 hover:bg-slate-50 transition active:scale-95 md:px-4 md:py-2 md:text-sm"
              >
                <Globe size={13} className="text-brand md:size-4" />
                <span className="uppercase">{locale}</span>
              </button>

              {/* Notifications */}
              <Link
                href="/deals"
                aria-label="Notifications"
                className="relative flex size-9 items-center justify-center rounded-full bg-white text-ink shadow-sm border border-slate-100 hover:bg-slate-50 transition active:scale-95 md:size-10"
              >
                <Bell size={16} className="md:size-5" />
                <span className="absolute right-2 top-2 size-2 rounded-full bg-mint" />
              </Link>

              {/* Sign Out */}
              <button
                aria-label={t.common.logout}
                onClick={() => void signOut()}
                title={t.common.logout}
                className="flex size-9 items-center justify-center rounded-full bg-white text-muted shadow-sm border border-slate-100 hover:text-danger hover:bg-slate-50 transition active:scale-95 md:size-10"
              >
                <LogOut size={16} className="md:size-5" />
              </button>
            </div>
          </header>
        </div>

        {/* Page Content */}
        <main className="mx-auto w-full max-w-md px-4 pb-32 md:max-w-7xl md:px-8 md:pb-12">
          {children}
        </main>
      </div>

      {/* Global TopUp Sheet */}
      <TopUpSheet open={topUpOpen} onClose={() => setTopUpOpen(false)} />
    </div>
  );
}