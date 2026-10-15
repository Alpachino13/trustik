"use client";

import { useConvexAuth, usePaginatedQuery, useQuery } from "convex/react";
import Link from "next/link";
import { useState, useMemo } from "react";
import {
  Calendar,
  Handshake,
  ArrowUpRight,
  ArrowDownRight,
  ShieldCheck,
  Plus
} from "lucide-react";
import { api } from "../../convex/_generated/api";
import { formatCentimes } from "@/lib/format";
import { ACTIVE_STATUSES, DEAL_STATUS, LEDGER } from "@/lib/labels";
import { TopUpSheet } from "./TopUpSheet";

const CARD_CLASS =
  "rounded-[2rem] bg-white p-5 shadow-[0_8px_24px_-10px_rgba(53,82,220,0.1)]";

export function Dashboard() {
  const { isAuthenticated } = useConvexAuth();
  
  // Real Convex Queries
  const wallet = useQuery(api.wallet.me, isAuthenticated ? undefined : "skip");
  const deals = useQuery(api.deals.mine, isAuthenticated ? undefined : "skip");
  const history = usePaginatedQuery(
    api.wallet.history,
    isAuthenticated ? {} : "skip",
    { initialNumItems: 5 }
  );
  
  const [topUp, setTopUp] = useState(false);

  // Computed Values based on Real Data
  const allDeals = deals ?? [];
  const activeDeals = allDeals.filter((d) => ACTIVE_STATUSES.includes(d.status));
  const availableCentimes = wallet?.balance ?? 0;

  // Calculate Income/Expense for the current month from history
  const currentMonthStats = useMemo(() => {
    let income = 0;
    let expense = 0;
    
    if (history.results) {
      const currentMonth = new Date().getMonth();
      const currentYear = new Date().getFullYear();

      history.results.forEach((tx) => {
        const txDate = new Date(tx._creationTime);
        if (txDate.getMonth() === currentMonth && txDate.getFullYear() === currentYear) {
          if (tx.direction === "credit") {
            income += tx.amount;
          } else {
            expense += tx.amount;
          }
        }
      });
    }
    return { income, expense };
  }, [history.results]);

  const currentMonthName = new Date().toLocaleString('fr-DZ', { month: 'long' });

  return (
    <div className="space-y-6 animate-fadeIn pb-6">
      
      {/* 1. Main Balance Card (Matches image_f4193f.jpg) */}
      <div className="rounded-[2.5rem] bg-gradient-to-br from-[#2f55ea] via-[#284be0] to-[#1c36b8] p-6 text-white shadow-[0_12px_36px_-10px_rgba(43,75,230,0.45)] relative overflow-hidden">
        {/* Background Graphic Curve */}
        <div className="absolute inset-0 opacity-20 pointer-events-none">
          <svg viewBox="0 0 400 150" preserveAspectRatio="none" className="w-full h-full">
            <path d="M0,100 C150,150 250,20 400,80 L400,150 L0,150 Z" fill="white" />
          </svg>
        </div>

        <div className="relative z-10 space-y-6">
          <div className="flex justify-between items-start">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-white/70 block mb-1">
                Balance
              </span>
              <p className="text-3xl sm:text-4xl font-black tracking-tight">
                {formatCentimes(availableCentimes)}
              </p>
            </div>
            
            <div className="flex items-center gap-2">
              <span className="bg-white/10 backdrop-blur-md rounded-full px-3 py-1.5 text-xs font-bold capitalize">
                Total • {currentMonthName}
              </span>
              <button 
                onClick={() => setTopUp(true)}
                className="size-8 bg-mint rounded-full flex items-center justify-center shadow-lg shadow-mint/40 hover:scale-105 transition"
              >
                <Plus size={18} strokeWidth={3} />
              </button>
            </div>
          </div>

          {/* Stats Bar (Income, Expense, Debt) */}
          <div className="bg-white rounded-3xl p-4 flex justify-between items-center text-center shadow-md">
            <div className="flex-1">
              <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Revenus</span>
              <div className="flex items-center justify-center gap-1 text-mint-deep font-black text-sm">
                <ArrowUpRight size={14} /> +{formatCentimes(currentMonthStats.income)}
              </div>
            </div>
            
            <div className="w-px h-8 bg-slate-100"></div>
            
            <div className="flex-1">
              <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Dépenses</span>
              <div className="flex items-center justify-center gap-1 text-danger font-black text-sm">
                <ArrowDownRight size={14} /> -{formatCentimes(currentMonthStats.expense)}
              </div>
            </div>
            
            <div className="w-px h-8 bg-slate-100"></div>
            
            <div className="flex-1">
              <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Séquestre</span>
              <div className="flex items-center justify-center gap-1 text-brand font-black text-sm">
                <ShieldCheck size={14} /> {activeDeals.length} Deal{activeDeals.length > 1 ? 's' : ''}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Real Transactions Section */}
      <section>
        <div className="mb-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h2 className="text-base font-extrabold text-ink">Transactions</h2>
            <span className="inline-flex items-center gap-1 rounded-full bg-white px-2.5 py-0.5 text-[11px] font-bold text-muted shadow-sm">
              <Calendar size={12} />
              {new Date().toLocaleDateString('fr-DZ', { day: '2-digit', month: '2-digit', year: '2-digit' })}
            </span>
          </div>
          <Link
            href="/wallet"
            className="text-xs font-bold text-brand hover:underline"
          >
            Tout voir
          </Link>
        </div>

        <div className={CARD_CLASS}>
          {history.status === "LoadingFirstPage" ? (
            <p className="text-center text-xs font-bold text-muted py-4">Chargement...</p>
          ) : history.results.length > 0 ? (
            <ul className="space-y-3.5 divide-y divide-gray-100">
              {history.results.map((e) => {
                const meta = LEDGER[e.reason] ?? LEDGER.admin_adjustment;
                const credit = e.direction === "credit";
                return (
                  <li
                    key={e._id}
                    className="flex items-center gap-3.5 pt-3 first:pt-0"
                  >
                    <span
                      className={`flex size-11 items-center justify-center rounded-2xl ${meta.tile}`}
                    >
                      <meta.Icon size={20} />
                    </span>
                    <div className="flex-1">
                      <p className="text-sm font-extrabold text-ink">{meta.label}</p>
                      <p className="text-[11px] font-semibold text-muted">
                        {new Date(e._creationTime).toLocaleDateString("fr-DZ", {
                          day: "numeric",
                          month: "short",
                        })}
                      </p>
                    </div>
                    <span
                      className={`text-sm font-black ${
                        credit ? "text-mint-deep" : "text-danger"
                      }`}
                    >
                      {credit ? "+" : "−"}
                      {formatCentimes(e.amount)}
                    </span>
                  </li>
                );
              })}
            </ul>
          ) : (
            <p className="text-center text-xs font-bold text-muted py-4">
              Aucune transaction récente.
            </p>
          )}
        </div>
      </section>

      {/* 3. Escrow Deals in Progress */}
      {activeDeals.length > 0 && (
        <section>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-base font-extrabold text-ink">Deals en cours</h2>
            <Link
              href="/deals"
              className="text-xs font-bold text-brand hover:underline"
            >
              Tout voir
            </Link>
          </div>

          <div className="-mx-4 flex gap-3 overflow-x-auto px-4 pb-2 no-scrollbar">
            {activeDeals.slice(0, 6).map((d) => {
              const s = DEAL_STATUS[d.status];
              return (
                <Link
                  key={d._id}
                  href={`/deals/${d._id}`}
                  className="w-60 shrink-0 rounded-[1.75rem] bg-white p-4 shadow-[0_8px_24px_-10px_rgba(53,82,220,0.1)] transition hover:shadow-md"
                >
                  <div className="flex items-start justify-between gap-2">
                    <p className="line-clamp-1 font-bold text-sm text-ink">{d.title}</p>
                    <span
                      className={`rounded-full px-2 py-0.5 text-[10px] font-extrabold ${s.chip}`}
                    >
                      {s.label}
                    </span>
                  </div>
                  <p className="mt-1 text-base font-black text-ink">
                    {formatCentimes(d.amount)}
                  </p>
                  <div className="mt-3 h-1.5 rounded-full bg-page">
                    <div
                      className={`h-full rounded-full ${s.bar}`}
                      style={{ width: `${s.pct}%` }}
                    />
                  </div>
                </Link>
              );
            })}
          </div>
        </section>
      )}

      {/* Modal Recharger / Transfer */}
      <TopUpSheet open={topUp} onClose={() => setTopUp(false)} />
    </div>
  );
}