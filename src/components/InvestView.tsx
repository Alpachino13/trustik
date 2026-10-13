"use client";

import { useState } from "react";
import {
  ArrowDownRight,
  ArrowUpRight,
  ChevronRight,
  Gift,
  LineChart,
  PieChart,
  Search,
  Sparkles,
  TrendingDown,
  TrendingUp,
  X,
} from "lucide-react";

type Timeframe = "1D" | "1W" | "1M" | "3M" | "ALL";

const CHART_DATA: Record<Timeframe, { points: number[]; returnPct: string; returnVal: string }> = {
  "1D": { points: [40, 48, 42, 60, 55, 68, 75], returnPct: "+1.24%", returnVal: "$182.10" },
  "1W": { points: [30, 45, 40, 52, 65, 58, 80], returnPct: "+4.15%", returnVal: "$520.40" },
  "1M": { points: [25, 40, 35, 65, 50, 72, 85], returnPct: "+13.79%", returnVal: "$1,245.32" },
  "3M": { points: [15, 30, 45, 40, 60, 75, 90], returnPct: "+28.40%", returnVal: "$3,110.00" },
  "ALL": { points: [10, 20, 35, 50, 65, 80, 95], returnPct: "+64.20%", returnVal: "$5,840.50" },
};

const GAINERS = [
  { id: "kotak", name: "Kotak Group", shares: "1,450 shares", price: "$14,691.25", change: "+2.4 (0.91%)" },
  { id: "tcs", name: "TCS", shares: "3,100 shares", price: "$11,485.26", change: "+1.2 (1.11%)" },
  { id: "hdfc", name: "HDFC Bank", shares: "840 shares", price: "$25,568.15", change: "+4.8 (1.21%)" },
];

const LOSERS = [
  { id: "reliance", name: "Reliance Industries", shares: "1,200 shares", price: "$14,691.25", change: "-4.4 (0.91%)" },
  { id: "axis", name: "Axis Bank", shares: "540 shares", price: "$11,485.26", change: "-0.2 (1.11%)" },
  { id: "parag", name: "Parag Parikh Fund", shares: "920 shares", price: "$25,568.15", change: "-0.8 (1.21%)" },
];

export function InvestView() {
  const [timeframe, setTimeframe] = useState<Timeframe>("1M");
  const [selectedStock, setSelectedStock] = useState<string | null>(null);
  const [invited, setInvited] = useState(false);

  const activeChart = CHART_DATA[timeframe];

  // SVG spline wave path from points
  const points = activeChart.points;
  const stepX = 280 / (points.length - 1);
  const pathD = points.reduce((acc, p, i) => {
    const x = i * stepX;
    const y = 90 - (p / 100) * 70;
    if (i === 0) return `M ${x} ${y}`;
    const prevX = (i - 1) * stepX;
    const prevY = 90 - (points[i - 1] / 100) * 70;
    const cpX = (prevX + x) / 2;
    return `${acc} C ${cpX} ${prevY}, ${cpX} ${y}, ${x} ${y}`;
  }, "");
  const areaD = `${pathD} L 280 90 L 0 90 Z`;

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Promotional Banner (Screen 4) */}
      <div className="relative overflow-hidden rounded-[2rem] bg-gradient-to-r from-[#204ecf] to-[#1236ad] p-5 text-white shadow-lg shadow-brand/25">
        <div className="pointer-events-none absolute -right-6 -bottom-6 size-32 rounded-full bg-white/10 blur-xl" />
        <div className="flex items-start justify-between">
          <div className="max-w-[70%]">
            <span className="inline-flex items-center gap-1 rounded-full bg-white/15 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider backdrop-blur-md">
              <Gift size={12} /> Special Reward
            </span>
            <h3 className="mt-2 text-base font-extrabold leading-snug">
              Invite your Friends to Finology and get Up to $100 benefits.
            </h3>
            <button
              onClick={() => setInvited(true)}
              className="mt-3 rounded-full bg-white px-4 py-1.5 text-xs font-black text-brand transition hover:bg-white/90 active:scale-95"
            >
              {invited ? "Invite Sent!" : "Invite Now"}
            </button>
          </div>
          <div className="flex size-14 items-center justify-center rounded-2xl bg-white/15 backdrop-blur-md text-white">
            <Sparkles size={28} />
          </div>
        </div>
      </div>

      {/* Portfolio Value Card (Screen 4 & 5) */}
      <div className="rounded-[2rem] bg-white p-5 shadow-[0_8px_24px_-10px_rgba(53,82,220,0.1)]">
        <div className="flex items-start justify-between">
          <div>
            <span className="text-xs font-bold text-muted">Portfolio Value</span>
            <h2 className="text-3xl font-black tracking-tight text-ink mt-0.5">
              $15,254.37
            </h2>
            <div className="mt-1 flex items-center gap-1.5">
              <span className="inline-flex items-center gap-0.5 rounded-full bg-tint-mint px-2 py-0.5 text-xs font-black text-mint-deep">
                <ArrowUpRight size={13} strokeWidth={3} />
                {activeChart.returnPct}
              </span>
              <span className="text-xs font-semibold text-muted">
                {activeChart.returnVal}
              </span>
            </div>
          </div>
          <button
            onClick={() => setSelectedStock("NIFTY 50")}
            className="flex size-9 items-center justify-center rounded-full bg-page text-muted hover:text-brand"
            aria-label="Stock details"
          >
            <LineChart size={18} />
          </button>
        </div>

        {/* Spline line chart */}
        <div className="relative my-4 h-28 w-full select-none">
          <svg viewBox="0 0 280 90" className="size-full overflow-visible" preserveAspectRatio="none">
            <defs>
              <linearGradient id="invGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#3552dc" stopOpacity="0.22" />
                <stop offset="100%" stopColor="#3552dc" stopOpacity="0" />
              </linearGradient>
            </defs>
            <path d={areaD} fill="url(#invGrad)" />
            <path d={pathD} fill="none" stroke="#3552dc" strokeWidth="3" strokeLinecap="round" />
          </svg>
        </div>

        {/* Timeframe Chips */}
        <div className="grid grid-cols-5 gap-1.5 pt-1">
          {(["1D", "1W", "1M", "3M", "ALL"] as Timeframe[]).map((tf) => (
            <button
              key={tf}
              onClick={() => setTimeframe(tf)}
              className={`rounded-xl py-1.5 text-xs font-extrabold transition active:scale-95 ${
                timeframe === tf
                  ? "bg-brand text-white shadow-sm shadow-brand/30"
                  : "bg-gray-100 text-muted hover:bg-gray-200"
              }`}
            >
              {tf}
            </button>
          ))}
        </div>
      </div>

      {/* Mutual Funds & Equities Cards */}
      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-[1.75rem] bg-white p-4 shadow-[0_8px_24px_-10px_rgba(53,82,220,0.08)]">
          <span className="text-xs font-bold text-muted">Mutual Funds</span>
          <p className="mt-1 text-base font-extrabold text-ink">$17,691.25</p>
          <span className="mt-2 inline-flex items-center gap-0.5 rounded-full bg-tint-mint px-2 py-0.5 text-[11px] font-black text-mint-deep">
            <ArrowUpRight size={12} strokeWidth={3} /> +12.3%
          </span>
        </div>

        <div className="rounded-[1.75rem] bg-white p-4 shadow-[0_8px_24px_-10px_rgba(53,82,220,0.08)]">
          <span className="text-xs font-bold text-muted">Equities</span>
          <p className="mt-1 text-base font-extrabold text-ink">$59,299.32</p>
          <span className="mt-2 inline-flex items-center gap-0.5 rounded-full bg-tint-mint px-2 py-0.5 text-[11px] font-black text-mint-deep">
            <ArrowUpRight size={12} strokeWidth={3} /> +11.5%
          </span>
        </div>
      </div>

      {/* Market Indices (Screen 5) */}
      <div className="rounded-[2rem] bg-white p-5 shadow-[0_8px_24px_-10px_rgba(53,82,220,0.08)]">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-base font-extrabold text-ink">Market Indices</h3>
          <span className="text-xs font-bold text-brand cursor-pointer hover:underline">
            All Stocks
          </span>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div
            onClick={() => setSelectedStock("Nifty 50")}
            className="cursor-pointer rounded-2xl bg-page p-3.5 transition hover:shadow-sm"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-black text-ink">Nifty 50</span>
              <span className="text-[10px] font-bold text-mint-deep">+0.58%</span>
            </div>
            <p className="mt-2 text-base font-black text-ink">$17,691.25</p>
          </div>

          <div
            onClick={() => setSelectedStock("Sensex")}
            className="cursor-pointer rounded-2xl bg-page p-3.5 transition hover:shadow-sm"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-black text-ink">Sensex</span>
              <span className="text-[10px] font-bold text-mint-deep">+0.45%</span>
            </div>
            <p className="mt-2 text-base font-black text-ink">$56,691.25</p>
          </div>
        </div>
      </div>

      {/* Top Gainers (Screen 5) */}
      <div className="rounded-[2rem] bg-white p-5 shadow-[0_8px_24px_-10px_rgba(53,82,220,0.08)]">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-base font-extrabold text-ink">Top Gainers</h3>
          <span className="text-xs font-bold text-mint-deep flex items-center gap-0.5">
            <TrendingUp size={14} /> Bullish
          </span>
        </div>

        <div className="divide-y divide-gray-100">
          {GAINERS.map((g) => (
            <div
              key={g.id}
              onClick={() => setSelectedStock(g.name)}
              className="flex items-center justify-between py-3 cursor-pointer first:pt-0 last:pb-0 group"
            >
              <div>
                <p className="font-extrabold text-ink text-sm group-hover:text-brand transition">
                  {g.name}
                </p>
                <p className="text-[10px] font-semibold text-muted">{g.shares}</p>
              </div>
              <div className="text-right">
                <p className="font-black text-ink text-sm">{g.price}</p>
                <span className="text-[11px] font-bold text-mint-deep">{g.change}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Top Losers (Screen 5) */}
      <div className="rounded-[2rem] bg-white p-5 shadow-[0_8px_24px_-10px_rgba(53,82,220,0.08)]">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-base font-extrabold text-ink">Top Losers</h3>
          <span className="text-xs font-bold text-danger flex items-center gap-0.5">
            <TrendingDown size={14} /> Bearish
          </span>
        </div>

        <div className="divide-y divide-gray-100">
          {LOSERS.map((l) => (
            <div
              key={l.id}
              onClick={() => setSelectedStock(l.name)}
              className="flex items-center justify-between py-3 cursor-pointer first:pt-0 last:pb-0 group"
            >
              <div>
                <p className="font-extrabold text-ink text-sm group-hover:text-brand transition">
                  {l.name}
                </p>
                <p className="text-[10px] font-semibold text-muted">{l.shares}</p>
              </div>
              <div className="text-right">
                <p className="font-black text-ink text-sm">{l.price}</p>
                <span className="text-[11px] font-bold text-danger">{l.change}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Stock Details Modal matching Screen 9 */}
      {selectedStock && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 backdrop-blur-sm animate-fadeIn"
          onClick={() => setSelectedStock(null)}
        >
          <div
            role="dialog"
            aria-modal="true"
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md animate-[sheet_0.25s_ease-out] rounded-t-[2.5rem] bg-white p-6 pb-8 shadow-2xl"
          >
            <div className="flex items-center justify-between pb-3">
              <div>
                <span className="text-xs font-bold text-muted">Stock Details</span>
                <h3 className="text-xl font-black text-ink">{selectedStock}</h3>
              </div>
              <button
                onClick={() => setSelectedStock(null)}
                className="flex size-8 items-center justify-center rounded-full bg-page text-muted hover:text-ink"
              >
                <X size={18} />
              </button>
            </div>

            <div className="my-2">
              <span className="text-3xl font-black text-ink">$8,720.76</span>
              <span className="ml-2 text-xs font-black text-mint-deep">+1.4% Today</span>
            </div>

            {/* Detailed chart preview */}
            <div className="my-4 h-32 w-full rounded-2xl bg-page/60 p-3">
              <svg viewBox="0 0 260 70" className="size-full" preserveAspectRatio="none">
                <path
                  d="M 0 50 C 30 30, 50 60, 80 40 C 120 20, 150 45, 180 25 C 210 10, 240 30, 260 15"
                  fill="none"
                  stroke="#3552dc"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                />
              </svg>
            </div>

            {/* Metrics grid (Open, High, Low, Close) */}
            <div className="grid grid-cols-4 gap-2 text-center my-4 py-2 bg-page rounded-2xl">
              <div>
                <p className="text-[10px] font-bold text-muted">Open</p>
                <p className="text-xs font-extrabold text-ink">17,532</p>
              </div>
              <div>
                <p className="text-[10px] font-bold text-muted">High</p>
                <p className="text-xs font-extrabold text-mint-deep">17,615</p>
              </div>
              <div>
                <p className="text-[10px] font-bold text-muted">Low</p>
                <p className="text-xs font-extrabold text-danger">17,490</p>
              </div>
              <div>
                <p className="text-[10px] font-bold text-muted">Close</p>
                <p className="text-xs font-extrabold text-ink">17,581</p>
              </div>
            </div>

            <button
              onClick={() => setSelectedStock(null)}
              className="w-full rounded-2xl bg-brand py-3.5 text-center font-extrabold text-white shadow-lg shadow-brand/30"
            >
              Full-featured Chart
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
