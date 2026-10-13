"use client";

import { useAuthActions } from "@convex-dev/auth/react";
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
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, type ReactNode } from "react";
import { TopUpSheet } from "./TopUpSheet";
import { type Locale, useTranslation } from "@/lib/i18n/context";

export function AppShell({ children }: { children: ReactNode }) {
  const { signOut } = useAuthActions();
  const pathname = usePathname();
  const { locale, setLocale, t } = useTranslation();
  const [topUpOpen, setTopUpOpen] = useState(false);

  const navItems = [
    { href: "/", label: t.nav.home, Icon: Home },
    { href: "/deals", label: t.nav.deals, Icon: Handshake },
    { href: "/wallet", label: t.nav.wallet, Icon: Wallet },
    { href: "/profile", label: t.nav.profile, Icon: User },
  ];

  return (
    <div className="mx-auto min-h-screen max-w-md px-4 pb-32 pt-5">
      {/* Header */}
      <header className="mb-5 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-3 group">
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

        <div className="flex items-center gap-1.5">
          {/* Language Switcher Quick Pill */}
          <button
            onClick={() => {
              const next: Locale = locale === "fr" ? "ar" : locale === "ar" ? "en" : "fr";
              setLocale(next);
            }}
            title="Changer de langue / تغيير اللغة"
            className="flex items-center gap-1 rounded-full bg-white px-2.5 py-1 text-xs font-black text-ink shadow-card hover:bg-page transition active:scale-95"
          >
            <Globe size={13} className="text-brand" />
            <span className="uppercase">{locale}</span>
          </button>

          {/* Notifications */}
          <Link
            href="/deals"
            aria-label="Notifications"
            className="relative flex size-9 items-center justify-center rounded-full bg-white text-ink shadow-card hover:bg-page transition active:scale-95"
          >
            <Bell size={16} />
            <span className="absolute right-2 top-2 size-2 rounded-full bg-mint" />
          </Link>

          {/* Sign Out */}
          <button
            aria-label={t.common.logout}
            onClick={() => void signOut()}
            title={t.common.logout}
            className="flex size-9 items-center justify-center rounded-full bg-white text-muted shadow-card hover:text-danger hover:bg-page transition active:scale-95"
          >
            <LogOut size={16} />
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main>{children}</main>

      {/* Floating Bottom Navigation */}
      <nav
        aria-label="Navigation principale"
        className="fixed inset-x-0 bottom-0 z-30 mx-auto flex max-w-md items-end rounded-t-[2.5rem] bg-white px-4 pb-[max(0.35rem,env(safe-area-inset-bottom))] shadow-[0_-10px_32px_-12px_rgba(53,82,220,0.18)]"
      >
        {/* Tab 1: Home */}
        <Link
          href="/"
          aria-label={navItems[0].label}
          className={`flex flex-1 flex-col items-center gap-1 py-3 text-[11px] font-extrabold transition ${
            pathname === "/" ? "text-brand" : "text-muted hover:text-ink"
          }`}
        >
          <Home size={22} strokeWidth={pathname === "/" ? 2.5 : 2} />
          <span>{navItems[0].label}</span>
        </Link>

        {/* Tab 2: Deals */}
        <Link
          href="/deals"
          aria-label={navItems[1].label}
          className={`flex flex-1 flex-col items-center gap-1 py-3 text-[11px] font-extrabold transition ${
            pathname.startsWith("/deals") && pathname !== "/deals/new"
              ? "text-brand"
              : "text-muted hover:text-ink"
          }`}
        >
          <Handshake
            size={22}
            strokeWidth={pathname.startsWith("/deals") && pathname !== "/deals/new" ? 2.5 : 2}
          />
          <span>{navItems[1].label}</span>
        </Link>

        {/* Center Floating (+) Mint Button: Create Deal */}
        <Link
          href="/deals/new"
          aria-label={t.nav.newDeal}
          className="-mt-7 mb-3.5 flex size-14 shrink-0 items-center justify-center rounded-full bg-mint text-white shadow-lg shadow-mint/45 transition hover:brightness-105 active:scale-95"
        >
          <Plus size={28} strokeWidth={3} />
        </Link>

        {/* Tab 3: Wallet */}
        <Link
          href="/wallet"
          aria-label={navItems[2].label}
          className={`flex flex-1 flex-col items-center gap-1 py-3 text-[11px] font-extrabold transition ${
            pathname.startsWith("/wallet") ? "text-brand" : "text-muted hover:text-ink"
          }`}
        >
          <Wallet size={22} strokeWidth={pathname.startsWith("/wallet") ? 2.5 : 2} />
          <span>{navItems[2].label}</span>
        </Link>

        {/* Tab 4: Profile */}
        <Link
          href="/profile"
          aria-label={navItems[3].label}
          className={`flex flex-1 flex-col items-center gap-1 py-3 text-[11px] font-extrabold transition ${
            pathname.startsWith("/profile") ? "text-brand" : "text-muted hover:text-ink"
          }`}
        >
          <User size={22} strokeWidth={pathname.startsWith("/profile") ? 2.5 : 2} />
          <span>{navItems[3].label}</span>
        </Link>
      </nav>

      {/* Global TopUp Sheet */}
      <TopUpSheet open={topUpOpen} onClose={() => setTopUpOpen(false)} />
    </div>
  );
}