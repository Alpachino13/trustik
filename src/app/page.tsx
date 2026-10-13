"use client";

import { Authenticated, AuthLoading, Unauthenticated } from "convex/react";
import { useState } from "react";
import { AppShell } from "@/components/AppShell";
import { AuthForm } from "@/components/AuthForm";
import { Dashboard } from "@/components/Dashboard";
import { Marketplace } from "@/components/Marketplace";

export default function Home() {
  const [previewMode, setPreviewMode] = useState(false);

  return (
    <>
      <AuthLoading>
        <div suppressHydrationWarning className="flex min-h-screen items-center justify-center">
          <p className="text-center font-bold text-muted animate-pulse">Chargement…</p>
        </div>
      </AuthLoading>
      <Unauthenticated>
        {previewMode ? (
          <AppShell>
            <Dashboard />
          </AppShell>
        ) : (
          <div suppressHydrationWarning className="space-y-4">
            <AuthForm />
            <div suppressHydrationWarning className="mx-auto max-w-sm text-center px-4 pb-12">
              <button
                onClick={() => setPreviewMode(true)}
                className="rounded-full bg-white px-4 py-2 text-xs font-black text-brand shadow-card hover:bg-page transition active:scale-95"
              >
                Explorer la maquette (Mode Démo) →
              </button>
            </div>
          </div>
        )}
      </Unauthenticated>
      <Authenticated>
        <AppShell>
          <Marketplace />
        </AppShell>
      </Authenticated>
    </>
  );
}