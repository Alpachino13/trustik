"use client";

import { useState } from "react";
import {
  Bell,
  Building2,
  ChevronRight,
  Coffee,
  CreditCard,
  Plus,
  SlidersHorizontal,
  Utensils,
  Wallet,
} from "lucide-react";
import { formatDzd } from "@/lib/format";

interface ConnectedAccountsProps {
  onAddAccount?: () => void;
  currencyMode?: "USD" | "DZD";
}

interface AccountItem {
  id: string;
  name: string;
  accountNumber: string;
  balance: number;
  type: string;
  iconBg: string;
  iconColor: string;
}

const INITIAL_ACCOUNTS: AccountItem[] = [
  {
    id: "axis",
    name: "AXIS Bank",
    accountNumber: "•••• 4892",
    balance: 9876.54,
    type: "Savings",
    iconBg: "bg-rose-50",
    iconColor: "text-rose-600",
  },
  {
    id: "hdfc",
    name: "HDFC Bank",
    accountNumber: "•••• 8310",
    balance: 9876.54,
    type: "Checking",
    iconBg: "bg-blue-50",
    iconColor: "text-brand",
  },
];

const GROUPED_TRANSACTIONS = [
  {
    date: "27 Sep 2021",
    items: [
      {
        id: "tx-1",
        title: "McDonalds",
        time: "7:45 PM",
        amount: -135.0,
        Icon: Utensils,
        iconBg: "bg-red-50 text-red-500",
      },
      {
        id: "tx-2",
        title: "Starbucks Coffee",
        time: "4:00 PM",
        amount: -21.0,
        Icon: Coffee,
        iconBg: "bg-emerald-50 text-emerald-600",
      },
    ],
  },
  {
    date: "25 Sep 2021",
    items: [
      {
        id: "tx-3",
        title: "Hot Dog Sauce",
        time: "1:15 PM",
        amount: -33.0,
        Icon: Utensils,
        iconBg: "bg-amber-50 text-amber-500",
      },
    ],
  },
];

export function ConnectedAccounts({
  onAddAccount,
  currencyMode = "USD",
}: ConnectedAccountsProps) {
  const [accounts] = useState(INITIAL_ACCOUNTS);
  const [selectedAcc, setSelectedAcc] = useState<string>("axis");

  function renderAmount(val: number) {
    if (currencyMode === "USD") {
      const sign = val < 0 ? "-" : "+";
      return `${sign}$${Math.abs(val).toFixed(2)}`;
    }
    return formatDzd(val);
  }

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h2 className="text-xl font-extrabold text-ink">Connected Accounts</h2>
          <button
            onClick={onAddAccount}
            aria-label="Add account"
            className="flex size-7 items-center justify-center rounded-full bg-mint text-white shadow-sm hover:brightness-105 active:scale-95 transition"
          >
            <Plus size={16} strokeWidth={3} />
          </button>
        </div>
        <div className="flex items-center gap-2">
          <button
            aria-label="Filter"
            className="flex size-9 items-center justify-center rounded-full bg-white text-ink shadow-[0_4px_12px_rgba(0,0,0,0.06)]"
          >
            <SlidersHorizontal size={16} />
          </button>
          <button
            aria-label="Notifications"
            className="flex size-9 items-center justify-center rounded-full bg-white text-ink shadow-[0_4px_12px_rgba(0,0,0,0.06)]"
          >
            <Bell size={16} />
          </button>
        </div>
      </div>

      {/* Account Cards Horizontal Scroll */}
      <div className="-mx-4 flex gap-3 overflow-x-auto px-4 pb-2 no-scrollbar">
        {/* Add Account Card Button */}
        <button
          onClick={onAddAccount}
          className="flex w-24 shrink-0 flex-col items-center justify-center rounded-[1.75rem] border-2 border-dashed border-gray-300 bg-white/60 p-4 text-center transition hover:border-brand hover:bg-white active:scale-95"
        >
          <div className="flex size-9 items-center justify-center rounded-full bg-page text-muted">
            <Plus size={18} />
          </div>
          <span className="mt-2 text-[11px] font-bold text-muted">Add Account</span>
        </button>

        {accounts.map((acc) => {
          const isSelected = selectedAcc === acc.id;
          return (
            <div
              key={acc.id}
              onClick={() => setSelectedAcc(acc.id)}
              className={`w-44 shrink-0 cursor-pointer rounded-[1.75rem] p-4 transition-all duration-200 ${
                isSelected
                  ? "bg-white shadow-[0_10px_28px_-8px_rgba(53,82,220,0.2)] ring-2 ring-brand"
                  : "bg-white shadow-card hover:shadow-md"
              }`}
            >
              <div className="flex items-center justify-between">
                <div
                  className={`flex size-9 items-center justify-center rounded-xl font-black text-sm ${acc.iconBg} ${acc.iconColor}`}
                >
                  <Building2 size={18} />
                </div>
                <span className="text-[10px] font-semibold text-muted">
                  {acc.accountNumber}
                </span>
              </div>

              <p className="mt-3 text-xs font-bold text-muted">{acc.name}</p>
              <p className="mt-0.5 text-lg font-black tracking-tight text-ink">
                ${acc.balance.toLocaleString("en-US", { minimumFractionDigits: 2 })}
              </p>
            </div>
          );
        })}
      </div>

      {/* Date-Grouped Transactions */}
      <div>
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-base font-extrabold text-ink">Transactions</h3>
          <span className="text-xs font-semibold text-brand cursor-pointer hover:underline">
            View All
          </span>
        </div>

        <div className="space-y-4">
          {GROUPED_TRANSACTIONS.map((grp) => (
            <div key={grp.date} className="space-y-2">
              <span className="text-xs font-bold text-muted uppercase tracking-wider">
                {grp.date}
              </span>
              <div className="rounded-[1.75rem] bg-white p-4 shadow-[0_8px_24px_-10px_rgba(53,82,220,0.1)] divide-y divide-gray-100">
                {grp.items.map((tx) => (
                  <div key={tx.id} className="flex items-center gap-3.5 py-2.5 first:pt-0 last:pb-0">
                    <div
                      className={`flex size-11 items-center justify-center rounded-2xl ${tx.iconBg}`}
                    >
                      <tx.Icon size={20} />
                    </div>
                    <div className="flex-1">
                      <p className="font-extrabold text-ink text-sm">{tx.title}</p>
                      <p className="text-[11px] font-semibold text-muted">{tx.time}</p>
                    </div>
                    <span className="font-black text-danger text-sm">
                      {renderAmount(tx.amount)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
