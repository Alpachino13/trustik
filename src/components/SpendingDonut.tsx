"use client";

import { useState } from "react";

interface SpendingCategory {
  id: string;
  name: string;
  amount: number;
  percentage: number;
  color: string;
  dotColor: string;
}

const CATEGORIES: SpendingCategory[] = [
  { id: "shopping", name: "Shopping", amount: 1680, percentage: 32, color: "#f97316", dotColor: "bg-orange-500" },
  { id: "health", name: "Health & Wellbeing", amount: 1150, percentage: 22, color: "#2dd4bf", dotColor: "bg-teal-400" },
  { id: "rent", name: "Home Rent", amount: 1200, percentage: 23, color: "#3b82f6", dotColor: "bg-blue-500" },
  { id: "vehicle", name: "Vehicle", amount: 620, percentage: 12, color: "#fbbf24", dotColor: "bg-amber-400" },
  { id: "entertainment", name: "Entertainment", amount: 550, percentage: 11, color: "#a855f7", dotColor: "bg-purple-500" },
];

export function SpendingDonut() {
  const [selected, setSelected] = useState<SpendingCategory | null>(null);

  // Donut SVG parameters
  const radius = 54;
  const strokeWidth = 14;
  const circumference = 2 * Math.PI * radius;

  let currentOffset = 0;

  return (
    <div className="rounded-[2rem] bg-white p-5 shadow-[0_8px_24px_-10px_rgba(53,82,220,0.1)]">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="font-extrabold text-ink text-base">Your Account Spendings</h3>
        <span className="text-xs font-semibold text-muted">This month</span>
      </div>

      <div className="relative mx-auto my-2 flex size-44 items-center justify-center">
        <svg viewBox="0 0 140 140" className="size-full -rotate-90">
          {/* Background circle track */}
          <circle
            cx="70"
            cy="70"
            r={radius}
            fill="none"
            stroke="#f1f3f9"
            strokeWidth={strokeWidth}
          />

          {CATEGORIES.map((cat) => {
            const strokeDasharray = `${(cat.percentage / 100) * circumference} ${circumference}`;
            const strokeDashoffset = -currentOffset;
            currentOffset += (cat.percentage / 100) * circumference;

            const isCurrent = selected?.id === cat.id;

            return (
              <circle
                key={cat.id}
                cx="70"
                cy="70"
                r={radius}
                fill="none"
                stroke={cat.color}
                strokeWidth={isCurrent ? strokeWidth + 4 : strokeWidth}
                strokeDasharray={strokeDasharray}
                strokeDashoffset={strokeDashoffset}
                strokeLinecap="round"
                className="cursor-pointer transition-all duration-300 hover:opacity-90"
                onClick={() => setSelected(isCurrent ? null : cat)}
              />
            );
          })}
        </svg>

        {/* Center label ($5.2K / 42 Transactions) */}
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
          <span className="text-2xl font-black tracking-tight text-ink">
            {selected ? `$${selected.amount}` : "$5.2K"}
          </span>
          <span className="text-[11px] font-semibold text-muted">
            {selected ? selected.name : "42 Transactions"}
          </span>
        </div>
      </div>

      {/* Category Pills/Tags */}
      <div className="mt-4 flex flex-wrap justify-center gap-1.5">
        {CATEGORIES.map((cat) => {
          const isCurrent = selected?.id === cat.id;
          return (
            <button
              key={cat.id}
              onClick={() => setSelected(isCurrent ? null : cat)}
              className={`flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold transition active:scale-95 ${
                isCurrent
                  ? "bg-ink text-white shadow-sm"
                  : "bg-gray-100 text-ink/80 hover:bg-gray-200"
              }`}
            >
              <span className={`size-2 rounded-full ${cat.dotColor}`} />
              <span>{cat.name}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
