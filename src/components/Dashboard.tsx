"use client";

import { useConvexAuth, usePaginatedQuery, useQuery } from "convex/react";
import Link from "next/link";
import { useState } from "react";
import {
  Calendar,
  Laptop,
  ShoppingBag,
  UtensilsCrossed,
} from "lucide-react";
import { api } from "../../convex/_generated/api";
import { formatCentimes } from "@/lib/format";
import { ACTIVE_STATUSES, DEAL_STATUS, LEDGER } from "@/lib/labels";
import { BalanceCard } from "./BalanceCard";
import { SpendingDonut } from "./SpendingDonut";
import { SubscriptionsList } from "./SubscriptionsList";
import { TopUpSheet } from "./TopUpSheet";

const CARD_CLASS =
  "rounded-[2rem] bg-white p-5 shadow-[0_8px_24px_-10px_rgba(53,82,220,0.1)]";

const MOCK_RECENT_TRANSACTIONS = [
  {
    id: "m-1",
    label: "Food & Drinks",
    time: "Today, 12:45 PM",
    amount: "-$20",
    credit: false,
    Icon: UtensilsCrossed,
    tile: "bg-rose-50 text-rose-500",
  },
  {
    id: "m-2",
    label: "Freelancing Work",
    time: "Yesterday, 04:30 PM",
    amount: "+$22",
    credit: true,
    Icon: Laptop,
    tile: "bg-teal-50 text-teal-500",
  },
  {
    id: "m-3",
    label: "Shopping",
    time: "28 Sep, 02:15 PM",
    amount: "-$20",
    credit: false,
    Icon: ShoppingBag,
    tile: "bg-amber-50 text-amber-500",
  },
];

export function Dashboard() {
  const { isAuthenticated } = useConvexAuth();
  const wallet = useQuery(api.wallet.me, isAuthenticated ? {} : "skip");
  const deals = useQuery(api.deals.mine, isAuthenticated ? {} : "skip");
  const deposits = useQuery(api.deposits.mine, isAuthenticated ? {} : "skip");
  const history = usePaginatedQuery(
    api.wallet.history,
    isAuthenticated ? {} : "skip",
    { initialNumItems: 5 }
  );
  const [topUp, setTopUp] = useState(false);

  const allDeals = deals ?? [];
  const activeDeals = allDeals.filter((d) => ACTIVE_STATUSES.includes(d.status));

  return (
    <div className="space-y-6 animate-fadeIn pb-6">
      {/* Screen 1 Balance Card */}
      <BalanceCard
        balance={wallet?.balance}
        activeDeals={deals === undefined ? undefined : activeDeals.length}
        pendingTopUps={
          deposits === undefined
            ? undefined
            : deposits.filter((d) => d.status === "pending").length
        }
        onTopUp={() => setTopUp(true)}
      />

      {/* Screen 1 Transactions Section */}
      <section>
        <div className="mb-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h2 className="text-base font-extrabold text-ink">Transactions</h2>
            <span className="inline-flex items-center gap-1 rounded-full bg-white px-2.5 py-0.5 text-[11px] font-bold text-muted shadow-sm">
              <Calendar size={12} />
              28/09/21
            </span>
          </div>
          <Link
            href="/wallet"
            className="text-xs font-bold text-brand hover:underline"
          >
            See all
          </Link>
        </div>

        <div className={CARD_CLASS}>
          {history.status !== "LoadingFirstPage" && history.results.length > 0 ? (
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
            /* Fallback to Screen 1 design transactions */
            <ul className="space-y-3.5 divide-y divide-gray-100">
              {MOCK_RECENT_TRANSACTIONS.map((tx) => (
                <li
                  key={tx.id}
                  className="flex items-center gap-3.5 pt-3 first:pt-0"
                >
                  <span
                    className={`flex size-11 items-center justify-center rounded-2xl ${tx.tile}`}
                  >
                    <tx.Icon size={20} />
                  </span>
                  <div className="flex-1">
                    <p className="text-sm font-extrabold text-ink">{tx.label}</p>
                    <p className="text-[11px] font-semibold text-muted">{tx.time}</p>
                  </div>
                  <span
                    className={`text-sm font-black ${
                      tx.credit ? "text-mint-deep" : "text-danger"
                    }`}
                  >
                    {tx.amount}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>

      {/* Screen 1 Monthly Budgets Preview */}
      <section>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-base font-extrabold text-ink">Monthly Budgets</h2>
          <span className="text-xs font-bold text-brand cursor-pointer hover:underline">
            Manage
          </span>
        </div>

        <div className={`${CARD_CLASS} flex items-center justify-between`}>
          <div className="flex items-center gap-3.5">
            <div className="flex size-12 items-center justify-center rounded-2xl bg-tint-mint text-mint-deep">
              <UtensilsCrossed size={22} />
            </div>
            <div>
              <p className="text-sm font-extrabold text-ink">Food & Drinks</p>
              <div className="mt-1 flex items-center gap-2">
                <div className="h-2 w-28 overflow-hidden rounded-full bg-page">
                  <div className="h-full rounded-full bg-mint" style={{ width: "85%" }} />
                </div>
                <span className="text-[11px] font-bold text-muted">85%</span>
              </div>
            </div>
          </div>
          <div className="text-right">
            <span className="text-sm font-black text-ink">$850</span>
            <p className="text-[10px] font-semibold text-muted">of $1,000</p>
          </div>
        </div>
      </section>

      {/* Screen 1 Spendings Donut Chart */}
      <SpendingDonut />

      {/* Screen 1 Subscriptions List */}
      <SubscriptionsList />

      {/* Escrow Deals in Progress (Trustik Core Feature) */}
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