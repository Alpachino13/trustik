"use client";

import { useState } from "react";
import { ArrowDownRight, ArrowUpRight, ChevronDown, Plus } from "lucide-react";
import { formatCentimes, formatDzd } from "@/lib/format";

interface BalanceCardProps {
  balance?: number;
  activeDeals?: number;
  pendingTopUps?: number;
  onTopUp: () => void;
  currencyMode?: "USD" | "DZD";
}

export function BalanceCard({
  balance,
  onTopUp,
  currencyMode = "USD",
}: BalanceCardProps) {
  const [activePoint, setActivePoint] = useState<number | null>(3);
  const [selectedMonth, setSelectedMonth] = useState("September");
  const [isMonthOpen, setIsMonthOpen] = useState(false);

  const months = ["July", "August", "September", "October"];

  // Display balance
  const formattedBalance =
    currencyMode === "USD"
      ? "$8,720.76"
      : balance !== undefined
        ? formatCentimes(balance)
        : "8,720.00 DZD";

  // Data points for the spline wave chart
  const points = [
    { x: 15, y: 55, value: "$640.20", date: "02 Sep" },
    { x: 55, y: 35, value: "$890.10", date: "08 Sep" },
    { x: 105, y: 60, value: "$520.40", date: "15 Sep" },
    { x: 155, y: 25, value: "$1,098.53", date: "21 Sep" }, // Highlighted point in mockup
    { x: 205, y: 45, value: "$780.00", date: "25 Sep" },
    { x: 255, y: 20, value: "$1,210.30", date: "28 Sep" },
    { x: 295, y: 40, value: "$950.00", date: "30 Sep" },
  ];

  // SVG cubic curve path
  const pathD =
    "M 15 55 C 35 45, 40 35, 55 35 C 75 35, 85 60, 105 60 C 125 60, 135 25, 155 25 C 175 25, 185 45, 205 45 C 225 45, 235 20, 255 20 C 275 20, 285 40, 295 40";
  const areaD = `${pathD} L 295 85 L 15 85 Z`;

  return (
    <section className="relative overflow-hidden rounded-[2rem] bg-gradient-to-br from-[#2f55ea] via-[#284be0] to-[#1c36b8] p-5 pb-5 text-white shadow-[0_12px_36px_-10px_rgba(43,75,230,0.45)]">
      {/* Decorative gradient overlay */}
      <div className="pointer-events-none absolute -right-12 -top-12 size-48 rounded-full bg-white/10 blur-2xl" />

      {/* Top row: Balance title & Filter Dropdowns */}
      <div className="relative flex items-center justify-between">
        <div>
          <span className="text-xs font-medium tracking-wide text-white/70">
            Balance
          </span>
          <h2 className="mt-0.5 text-3xl font-extrabold tracking-tight">
            {formattedBalance}
          </h2>
        </div>

        <div className="flex items-center gap-1.5">
          <div className="relative">
            <button
              onClick={() => setIsMonthOpen(!isMonthOpen)}
              className="flex items-center gap-1 rounded-full bg-white/15 px-3 py-1.5 text-xs font-semibold backdrop-blur-md transition hover:bg-white/20 active:scale-95"
            >
              <span>Total</span>
              <span className="text-white/60">•</span>
              <span>{selectedMonth}</span>
              <ChevronDown size={14} className="text-white/80" />
            </button>

            {isMonthOpen && (
              <div className="absolute right-0 top-9 z-20 w-32 rounded-xl bg-white py-1 shadow-xl">
                {months.map((m) => (
                  <button
                    key={m}
                    onClick={() => {
                      setSelectedMonth(m);
                      setIsMonthOpen(false);
                    }}
                    className={`block w-full px-3 py-1.5 text-left text-xs font-bold transition hover:bg-page ${
                      selectedMonth === m ? "text-brand" : "text-ink"
                    }`}
                  >
                    {m}
                  </button>
                ))}
              </div>
            )}
          </div>

          <button
            onClick={onTopUp}
            aria-label="Add Money"
            className="flex size-8 items-center justify-center rounded-full bg-mint text-white shadow-md shadow-mint/40 transition hover:brightness-105 active:scale-95"
          >
            <Plus size={18} strokeWidth={2.5} />
          </button>
        </div>
      </div>

      {/* Spline Wave Chart */}
      <div className="relative my-3 h-28 w-full select-none">
        <svg
          viewBox="0 0 310 85"
          className="size-full overflow-visible"
          preserveAspectRatio="none"
        >
          <defs>
            <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#ffffff" stopOpacity="0.28" />
              <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
            </linearGradient>
            <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
              <feDropShadow
                dx="0"
                dy="2"
                stdDeviation="3"
                floodColor="#ffffff"
                floodOpacity="0.5"
              />
            </filter>
          </defs>

          {/* Area fill */}
          <path d={areaD} fill="url(#chartGradient)" />

          {/* Stroke path */}
          <path
            d={pathD}
            fill="none"
            stroke="#ffffff"
            strokeWidth="3"
            strokeLinecap="round"
            filter="url(#glow)"
          />

          {/* Points */}
          {points.map((p, idx) => (
            <g
              key={idx}
              className="cursor-pointer"
              onClick={() => setActivePoint(idx)}
            >
              <circle
                cx={p.x}
                cy={p.y}
                r={activePoint === idx ? 5 : 3}
                fill="#ffffff"
                className="transition-all duration-200"
              />
              {activePoint === idx && (
                <circle
                  cx={p.x}
                  cy={p.y}
                  r={8}
                  fill="none"
                  stroke="#ffffff"
                  strokeWidth="2"
                  opacity="0.6"
                />
              )}
            </g>
          ))}
        </svg>

        {/* Floating Tooltip matching mockup ($1,098.53) */}
        {activePoint !== null && (
          <div
            className="pointer-events-none absolute -translate-x-1/2 rounded-lg bg-white/95 px-2.5 py-1 text-center shadow-lg backdrop-blur-md transition-all duration-300"
            style={{
              left: `${(points[activePoint].x / 310) * 100}%`,
              top: `${Math.max(0, (points[activePoint].y / 85) * 100 - 34)}%`,
            }}
          >
            <p className="text-[11px] font-extrabold text-ink leading-tight">
              {points[activePoint].value}
            </p>
            <p className="text-[9px] font-semibold text-muted leading-none">
              {points[activePoint].date}
            </p>
          </div>
        )}
      </div>

      {/* Bottom Summary Pill: Income, Expense, Debt */}
      <div className="relative mt-2 grid grid-cols-3 divide-x divide-gray-100 rounded-2xl bg-white p-2.5 text-ink shadow-[0_6px_20px_rgba(0,0,0,0.06)]">
        {/* Income */}
        <div className="flex flex-col items-center px-1">
          <span className="text-[10px] font-semibold text-muted">Income</span>
          <div className="mt-0.5 flex items-center gap-1 font-extrabold text-mint-deep text-xs sm:text-sm">
            <span className="flex size-4 items-center justify-center rounded-full bg-mint/15 text-mint-deep">
              <ArrowUpRight size={11} strokeWidth={3} />
            </span>
            <span>+$248</span>
          </div>
        </div>

        {/* Expense */}
        <div className="flex flex-col items-center px-1">
          <span className="text-[10px] font-semibold text-muted">Expense</span>
          <div className="mt-0.5 flex items-center gap-1 font-extrabold text-danger text-xs sm:text-sm">
            <span className="flex size-4 items-center justify-center rounded-full bg-red-100 text-danger">
              <ArrowDownRight size={11} strokeWidth={3} />
            </span>
            <span>-$240</span>
          </div>
        </div>

        {/* Debt */}
        <div className="flex flex-col items-center px-1">
          <span className="text-[10px] font-semibold text-muted">Debt</span>
          <div className="mt-0.5 flex items-center gap-1 font-extrabold text-[#3b66f5] text-xs sm:text-sm">
            <span className="flex size-4 items-center justify-center rounded-full bg-blue-100 text-[#3b66f5]">
              <ArrowUpRight size={11} strokeWidth={3} />
            </span>
            <span>$120</span>
          </div>
        </div>
      </div>
    </section>
  );
}