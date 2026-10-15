"use client";

import { useQuery, useConvexAuth } from "convex/react";
import Link from "next/link";
import { useState } from "react";
import { ArrowLeft, ArrowUpRight, Handshake, Plus, ShieldCheck } from "lucide-react";
import { api } from "../../../convex/_generated/api";
import { AppShell } from "@/components/AppShell";
import { formatCentimes } from "@/lib/format";
import { DEAL_STATUS } from "@/lib/labels";
import { useTranslation } from "@/lib/i18n/context";

type FilterTab = "all" | "active" | "completed" | "cancelled";

export default function DealsPage() {
  const { t } = useTranslation();
  const { isAuthenticated, isLoading } = useConvexAuth();
  
  // Conditionally skip the query if the user is not authenticated
  const deals = useQuery(api.deals.mine, isAuthenticated ? undefined : "skip");
  const [filter, setFilter] = useState<FilterTab>("all");

  const all = deals ?? [];
  const filtered = all.filter((d) => {
    if (filter === "active") return ["pending", "accepted", "funded", "disputed"].includes(d.status);
    if (filter === "completed") return ["released", "settled"].includes(d.status);
    if (filter === "cancelled") return d.status === "cancelled";
    return true;
  });

  return (
    <AppShell>
      <div className="space-y-5 animate-fadeIn">
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
              <h1 className="text-xl font-extrabold text-ink">{t.deals.title}</h1>
              <p className="text-xs font-semibold text-muted">
                {all.length} {all.length > 1 ? "deals au total" : "deal"}
              </p>
            </div>
          </div>

          <Link
            href="/deals/new"
            className="flex items-center gap-1.5 rounded-full bg-brand px-4 py-2 text-xs font-extrabold text-white shadow-md shadow-brand/30 hover:bg-brand-deep transition active:scale-95"
          >
            <Plus size={16} strokeWidth={3} />
            <span>{t.nav.newDeal}</span>
          </Link>
        </div>

        {/* Filter Pills */}
        <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
          {[
            { id: "all", label: "Tous" },
            { id: "active", label: "En cours" },
            { id: "completed", label: "Terminés" },
            { id: "cancelled", label: "Annulés" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setFilter(tab.id as FilterTab)}
              className={`rounded-full px-4 py-2 text-xs font-black transition active:scale-95 ${
                filter === tab.id
                  ? "bg-brand text-white shadow-sm"
                  : "bg-white text-muted hover:bg-gray-100 shadow-card"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Deals List & Auth States */}
        {isLoading || (isAuthenticated && deals === undefined) ? (
          <div className="rounded-[2rem] bg-white p-8 text-center text-muted font-bold shadow-card">
            {t.common.loading}
          </div>
        ) : !isAuthenticated ? (
          <div className="rounded-[2rem] bg-white p-8 text-center shadow-card space-y-4">
            <div className="mx-auto flex size-14 items-center justify-center rounded-full bg-tint-blue text-brand">
              <ShieldCheck size={28} />
            </div>
            <p className="text-sm font-bold text-ink">Vous devez être connecté pour voir vos deals.</p>
            <Link
              href="/profile"
              className="inline-flex items-center gap-1.5 rounded-full bg-brand px-5 py-2.5 text-xs font-black text-white shadow-md shadow-brand/30 hover:brightness-105 transition"
            >
              <span>Se connecter</span>
            </Link>
          </div>
        ) : filtered.length === 0 ? (
          <div className="rounded-[2rem] bg-white p-8 text-center shadow-card space-y-3">
            <div className="mx-auto flex size-14 items-center justify-center rounded-full bg-tint-blue text-brand">
              <Handshake size={28} />
            </div>
            <p className="text-sm font-bold text-ink">{t.deals.noDeals}</p>
            <Link
              href="/deals/new"
              className="inline-flex items-center gap-1.5 rounded-full bg-mint px-5 py-2.5 text-xs font-black text-white shadow-md shadow-mint/30 hover:brightness-105 transition"
            >
              <Plus size={16} strokeWidth={3} />
              <span>{t.deals.createTitle}</span>
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map((d) => {
              const statusMeta = DEAL_STATUS[d.status] || DEAL_STATUS.pending;
              return (
                <Link
                  key={d._id}
                  href={`/deals/${d._id}`}
                  className="group block rounded-[2rem] bg-white p-5 shadow-card hover:shadow-lg transition active:scale-[0.99]"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-1">
                      <h3 className="text-base font-extrabold text-ink group-hover:text-brand transition">
                        {d.title}
                      </h3>
                      <p className="text-xs text-muted line-clamp-1">
                        {d.description || "Aucune description"}
                      </p>
                    </div>
                    <span
                      className={`shrink-0 rounded-full px-3 py-1 text-[11px] font-black ${statusMeta.chip}`}
                    >
                      {statusMeta.label}
                    </span>
                  </div>

                  <div className="mt-4 flex items-end justify-between border-t border-gray-100 pt-3">
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-muted">
                        Montant du deal
                      </span>
                      <p className="text-lg font-black text-ink">
                        {formatCentimes(d.amount)}
                      </p>
                    </div>

                    <div className="flex items-center gap-1 text-xs font-bold text-brand group-hover:underline">
                      <span>Détails & Actions</span>
                      <ArrowUpRight size={14} />
                    </div>
                  </div>

                  {/* Progress track */}
                  <div className="mt-3 h-1.5 w-full rounded-full bg-page overflow-hidden">
                    <div
                      className={`h-full rounded-full ${statusMeta.bar} transition-all duration-500`}
                      style={{ width: `${statusMeta.pct}%` }}
                    />
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </AppShell>
  );
}