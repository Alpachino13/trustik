"use client";

import { useState } from "react";
import {
  Briefcase,
  ChevronRight,
  CreditCard,
  Plus,
  ShoppingBag,
  UtensilsCrossed,
  X,
} from "lucide-react";

interface BudgetCategory {
  id: string;
  name: string;
  spent: number;
  limit: number;
  transactionsCount: number;
  color: string;
  barColor: string;
  Icon: typeof UtensilsCrossed;
}

const BUDGET_CATEGORIES: BudgetCategory[] = [
  {
    id: "food",
    name: "Food & Drinks",
    spent: 960,
    limit: 1200,
    transactionsCount: 80,
    color: "#22c55e",
    barColor: "bg-emerald-500",
    Icon: UtensilsCrossed,
  },
  {
    id: "business",
    name: "Business Expenses",
    spent: 750,
    limit: 1000,
    transactionsCount: 14,
    color: "#3b82f6",
    barColor: "bg-blue-500",
    Icon: Briefcase,
  },
  {
    id: "shopping",
    name: "Shopping",
    spent: 450,
    limit: 600,
    transactionsCount: 28,
    color: "#f97316",
    barColor: "bg-orange-500",
    Icon: ShoppingBag,
  },
];

export function BudgetsView() {
  const [detailOpen, setDetailOpen] = useState(false);
  const [activeCategory, setActiveCategory] = useState<BudgetCategory>(BUDGET_CATEGORIES[0]);

  const totalSpent = BUDGET_CATEGORIES.reduce((s, c) => s + c.spent, 0);

  // Speedometer semicircle arc configuration
  // Radius = 70, arc circumference = Math.PI * 70 = ~220
  const r = 70;
  const arcLength = Math.PI * r;
  const spentPct = Math.min(totalSpent / 3000, 1);
  const dashoffset = arcLength * (1 - spentPct);

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <span className="text-xs font-bold text-muted uppercase">Analytics</span>
          <h2 className="text-xl font-extrabold text-ink">Monthly Budgets</h2>
        </div>
        <button
          onClick={() => {
            setActiveCategory(BUDGET_CATEGORIES[0]);
            setDetailOpen(true);
          }}
          className="flex size-9 items-center justify-center rounded-full bg-mint text-white shadow-md shadow-mint/30 transition hover:brightness-105 active:scale-95"
          aria-label="Add Budget"
        >
          <Plus size={20} strokeWidth={3} />
        </button>
      </div>

      {/* Mini Card Preview from Screen 8 */}
      <div className="flex items-center justify-between rounded-[1.75rem] bg-gradient-to-r from-[#214bd1] to-[#1636ad] p-4 text-white shadow-lg shadow-brand/20">
        <div className="flex items-center gap-3">
          <div className="flex size-10 items-center justify-center rounded-xl bg-white/15 backdrop-blur-md">
            <CreditCard size={20} />
          </div>
          <div>
            <p className="text-[10px] font-semibold text-white/70">Primary Card</p>
            <p className="text-base font-extrabold">$15,254.37</p>
          </div>
        </div>
        <div className="flex -space-x-2">
          <span className="size-5 rounded-full bg-[#eb001b]/90" />
          <span className="size-5 rounded-full bg-[#f79e1b]/90" />
        </div>
      </div>

      {/* Speedometer Radial Gauge Chart (Screen 8) */}
      <div className="rounded-[2rem] bg-white p-6 text-center shadow-[0_8px_24px_-10px_rgba(53,82,220,0.1)]">
        <div className="relative mx-auto h-36 w-64">
          <svg viewBox="0 0 180 100" className="size-full overflow-visible">
            <defs>
              <linearGradient id="gaugeGradient" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor="#3cd7a4" />
                <stop offset="50%" stopColor="#3552dc" />
                <stop offset="100%" stopColor="#e8893a" />
              </linearGradient>
            </defs>

            {/* Gray background track arc */}
            <path
              d="M 20 90 A 70 70 0 0 1 160 90"
              fill="none"
              stroke="#eef1f8"
              strokeWidth="14"
              strokeLinecap="round"
            />

            {/* Filled progress arc */}
            <path
              d="M 20 90 A 70 70 0 0 1 160 90"
              fill="none"
              stroke="url(#gaugeGradient)"
              strokeWidth="14"
              strokeLinecap="round"
              strokeDasharray={arcLength}
              strokeDashoffset={dashoffset}
              className="transition-all duration-1000 ease-out"
            />
          </svg>

          {/* Speedometer Center Value ($5,624 / Spent this Month) */}
          <div className="absolute inset-x-0 bottom-2 flex flex-col items-center justify-center">
            <div className="text-3xl font-black tracking-tight text-ink">
              ${totalSpent.toLocaleString("en-US")}
            </div>
            <div className="text-xs font-bold text-muted">Spent this Month</div>
          </div>
        </div>

        <p className="mt-2 text-xs font-semibold text-muted">
          You have reached {Math.round(spentPct * 100)}% of your monthly limit
        </p>
      </div>

      {/* Category Limits Breakdown */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-extrabold text-ink">Category Budgets</h3>
          <span className="text-xs font-semibold text-muted">3 categories</span>
        </div>

        {BUDGET_CATEGORIES.map((cat) => {
          const pct = Math.round((cat.spent / cat.limit) * 100);
          return (
            <div
              key={cat.id}
              onClick={() => {
                setActiveCategory(cat);
                setDetailOpen(true);
              }}
              className="group cursor-pointer rounded-[1.75rem] bg-white p-4 shadow-[0_8px_24px_-10px_rgba(53,82,220,0.08)] transition hover:shadow-md active:scale-[0.99]"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div
                    className="flex size-10 items-center justify-center rounded-2xl bg-page text-ink"
                  >
                    <cat.Icon size={18} />
                  </div>
                  <div>
                    <p className="font-extrabold text-ink text-sm group-hover:text-brand transition">
                      {cat.name}
                    </p>
                    <p className="text-[11px] font-semibold text-muted">
                      {cat.transactionsCount} Transactions
                    </p>
                  </div>
                </div>

                <div className="text-right">
                  <p className="font-extrabold text-ink text-sm">${cat.spent}</p>
                  <p className="text-[10px] font-semibold text-muted">
                    left ${cat.limit - cat.spent}
                  </p>
                </div>
              </div>

              {/* Progress bar */}
              <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-gray-100">
                <div
                  className={`h-full rounded-full ${cat.barColor} transition-all duration-500`}
                  style={{ width: `${Math.min(pct, 100)}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>

      {/* Dark Theme Budget Detail Sheet matching Screen 3 */}
      {detailOpen && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 backdrop-blur-sm animate-fadeIn"
          onClick={() => setDetailOpen(false)}
        >
          <div
            role="dialog"
            aria-modal="true"
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md animate-[sheet_0.25s_ease-out] rounded-t-[2.5rem] bg-[#12151d] p-6 pb-8 text-white shadow-2xl"
          >
            {/* Modal header */}
            <div className="flex items-center justify-between pb-4">
              <span className="text-xs font-bold uppercase tracking-wider text-white/50">
                Budget Detail
              </span>
              <button
                onClick={() => setDetailOpen(false)}
                className="flex size-8 items-center justify-center rounded-full bg-white/10 text-white/70 hover:text-white"
              >
                <X size={18} />
              </button>
            </div>

            {/* Target Category Info */}
            <div className="text-center my-4">
              <h3 className="text-base font-bold text-white/80">{activeCategory.name}</h3>
              <p className="mt-1 text-3xl font-black text-white">
                ${activeCategory.limit - activeCategory.spent}.00
              </p>
              <p className="text-xs font-semibold text-white/50">
                left out of ${activeCategory.limit}.00
              </p>
            </div>

            {/* Spent vs Balance 2-card stats */}
            <div className="grid grid-cols-2 gap-3 my-5">
              <div className="rounded-2xl bg-white/5 p-4 text-center border border-white/10">
                <p className="text-[10px] font-bold uppercase tracking-wider text-white/50">
                  Spent
                </p>
                <p className="mt-1 text-lg font-black text-white">
                  ${activeCategory.spent}.00
                </p>
              </div>
              <div className="rounded-2xl bg-white/5 p-4 text-center border border-white/10">
                <p className="text-[10px] font-bold uppercase tracking-wider text-white/50">
                  Balance
                </p>
                <p className="mt-1 text-lg font-black text-mint">
                  ${activeCategory.limit - activeCategory.spent}.00
                </p>
              </div>
            </div>

            {/* Recent activity in this category */}
            <div className="space-y-2">
              <p className="text-xs font-bold text-white/60">Recent Activity</p>
              <div className="rounded-2xl bg-white/5 p-3 text-xs divide-y divide-white/5">
                <div className="flex justify-between py-2">
                  <span className="text-white/80">Supermarket Groceries</span>
                  <span className="font-bold text-red-400">-$64.00</span>
                </div>
                <div className="flex justify-between py-2">
                  <span className="text-white/80">Cafe Express</span>
                  <span className="font-bold text-red-400">-$12.50</span>
                </div>
              </div>
            </div>

            <button
              onClick={() => setDetailOpen(false)}
              className="mt-6 w-full rounded-2xl bg-mint py-3.5 text-center font-extrabold text-[#12151d] transition hover:brightness-105 active:scale-95"
            >
              Done
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
