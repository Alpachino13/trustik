"use client";

import { useState, useEffect, useMemo } from "react";
import { ArrowDownRight, ArrowUpRight, ChevronDown, Plus, ShieldCheck } from "lucide-react";
import { formatCentimes } from "@/lib/format";
import { useConvexAuth, usePaginatedQuery, useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { ACTIVE_STATUSES } from "@/lib/labels";

interface BalanceCardProps {
  onTopUp?: () => void;
}

export function BalanceCard({ onTopUp }: BalanceCardProps) {
  const { isAuthenticated } = useConvexAuth();

  // --- 1. Récupération des données réelles ---
  const wallet = useQuery(api.wallet.me, isAuthenticated ? undefined : "skip");
  const deals = useQuery(api.deals.mine, isAuthenticated ? undefined : "skip");
  const historyQuery = usePaginatedQuery(
    api.wallet.history,
    isAuthenticated ? {} : "skip",
    { initialNumItems: 20 }
  );

  const [activePoint, setActivePoint] = useState<number | null>(null);
  const [isMonthOpen, setIsMonthOpen] = useState(false);

  // --- 2. Calculs (Balance, Revenus, Dépenses, Séquestre) ---
  const availableCentimes = wallet?.balance ?? 0;
  const currentMonthName = new Date().toLocaleString("fr-DZ", { month: "long" });
  
  const allDeals = deals ?? [];
  const activeDeals = allDeals.filter((d) => ACTIVE_STATUSES.includes(d.status));

  const currentMonthStats = useMemo(() => {
    let income = 0;
    let expense = 0;
    if (historyQuery.results) {
      const currentMonth = new Date().getMonth();
      const currentYear = new Date().getFullYear();
      historyQuery.results.forEach((tx) => {
        const txDate = new Date(tx._creationTime);
        if (txDate.getMonth() === currentMonth && txDate.getFullYear() === currentYear) {
          if (tx.direction === "credit") income += tx.amount;
          else expense += tx.amount;
        }
      });
    }
    return { income, expense };
  }, [historyQuery.results]);

  // --- 3. Génération dynamique de la courbe SVG ---
  const { points, pathD, areaD } = useMemo(() => {
    const results = historyQuery.results || [];
    
    // On prend les 7 dernières transactions, et on les inverse pour les avoir par ordre chronologique
    const recentTxs = [...results].slice(0, 7).reverse();
    
    let pointsData = recentTxs.map((tx) => ({
      date: new Date(tx._creationTime).toLocaleDateString("fr-DZ", { day: "2-digit", month: "short" }),
      value: tx.balanceAfter ?? 0,
      formattedValue: formatCentimes(tx.balanceAfter ?? 0),
    }));

    // S'il n'y a pas assez de données, on crée une ligne plate avec le solde actuel
    if (pointsData.length === 0) {
      const today = new Date().toLocaleDateString("fr-DZ", { day: "2-digit", month: "short" });
      pointsData = [
        { date: today, value: availableCentimes, formattedValue: formatCentimes(availableCentimes) },
        { date: today, value: availableCentimes, formattedValue: formatCentimes(availableCentimes) },
      ];
    } else if (pointsData.length === 1) {
      pointsData.unshift({ ...pointsData[0] });
    }

    // Paramètres SVG
    const startX = 15;
    const endX = 295;
    const drawableWidth = endX - startX;
    const svgHeight = 85;
    const paddingY = 20;
    const drawableHeight = svgHeight - 2 * paddingY;

    // Normalisation des hauteurs (Y)
    const minVal = Math.min(...pointsData.map((d) => d.value));
    const maxVal = Math.max(...pointsData.map((d) => d.value));
    const range = maxVal - minVal || 1; // Évite la division par zéro

    const calculatedPoints = pointsData.map((d, i) => {
      const x = startX + (i / (pointsData.length - 1)) * drawableWidth;
      const y = paddingY + drawableHeight - ((d.value - minVal) / range) * drawableHeight;
      return { ...d, x, y };
    });

    // Génération de la courbe de Bézier (Spline)
    let dPath = `M ${calculatedPoints[0].x} ${calculatedPoints[0].y}`;
    for (let i = 0; i < calculatedPoints.length - 1; i++) {
      const p0 = calculatedPoints[i];
      const p1 = calculatedPoints[i + 1];
      const xMid = (p0.x + p1.x) / 2;
      dPath += ` C ${xMid} ${p0.y}, ${xMid} ${p1.y}, ${p1.x} ${p1.y}`;
    }

    return {
      points: calculatedPoints,
      pathD: dPath,
      areaD: `${dPath} L ${endX} ${svgHeight} L ${startX} ${svgHeight} Z`,
    };
  }, [historyQuery.results, availableCentimes]);

  // Initialiser le point actif sur la transaction la plus récente (à droite)
  useEffect(() => {
    if (points.length > 0) {
      setActivePoint(points.length - 1);
    }
  }, [points.length]);

  return (
    <section className="relative overflow-hidden rounded-[2rem] bg-gradient-to-br from-[#2f55ea] via-[#284be0] to-[#1c36b8] p-5 pb-5 text-white shadow-[0_12px_36px_-10px_rgba(43,75,230,0.45)]">
      {/* Décoration lumineuse en fond */}
      <div className="pointer-events-none absolute -right-12 -top-12 size-48 rounded-full bg-white/10 blur-2xl" />

      {/* En-tête : Solde & Filtre */}
      <div className="relative flex items-center justify-between">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-white/70">
            Solde Disponible
          </span>
          <h2 className="mt-0.5 text-3xl font-extrabold tracking-tight">
            {formatCentimes(availableCentimes)}
          </h2>
        </div>

        <div className="flex items-center gap-1.5">
          <div className="relative">
            <button
              onClick={() => setIsMonthOpen(!isMonthOpen)}
              className="flex items-center gap-1 rounded-full bg-white/15 px-3 py-1.5 text-xs font-semibold backdrop-blur-md transition hover:bg-white/20 active:scale-95 capitalize"
            >
              <span>Total</span>
              <span className="text-white/60">•</span>
              <span>{currentMonthName}</span>
              <ChevronDown size={14} className="text-white/80" />
            </button>
          </div>

          <button
            onClick={onTopUp}
            aria-label="Recharger"
            className="flex size-8 items-center justify-center rounded-full bg-mint text-white shadow-md shadow-mint/40 transition hover:scale-105 active:scale-95"
          >
            <Plus size={18} strokeWidth={3} />
          </button>
        </div>
      </div>

      {/* Courbe SVG Dynamique */}
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

          {/* Remplissage sous la courbe */}
          <path d={areaD} fill="url(#chartGradient)" />

          {/* Ligne de la courbe */}
          <path
            d={pathD}
            fill="none"
            stroke="#ffffff"
            strokeWidth="3"
            strokeLinecap="round"
            filter="url(#glow)"
          />

          {/* Points interactifs */}
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

        {/* Tooltip (Bulle d'information) au survol */}
        {activePoint !== null && points[activePoint] && (
          <div
            className="pointer-events-none absolute -translate-x-1/2 rounded-lg bg-white/95 px-2.5 py-1 text-center shadow-lg backdrop-blur-md transition-all duration-300 z-10"
            style={{
              left: `${(points[activePoint].x / 310) * 100}%`,
              top: `${Math.max(0, (points[activePoint].y / 85) * 100 - 34)}%`,
            }}
          >
            <p className="text-[11px] font-extrabold text-ink leading-tight">
              {points[activePoint].formattedValue}
            </p>
            <p className="text-[9px] font-semibold text-muted leading-none">
              {points[activePoint].date}
            </p>
          </div>
        )}
      </div>

      {/* Résumé du bas : Revenus, Dépenses, Séquestre */}
      <div className="relative mt-2 grid grid-cols-3 divide-x divide-gray-100 rounded-2xl bg-white p-2.5 text-ink shadow-[0_6px_20px_rgba(0,0,0,0.06)]">
        {/* Revenus */}
        <div className="flex flex-col items-center px-1">
          <span className="text-[10px] font-bold uppercase text-slate-400">Revenus</span>
          <div className="mt-0.5 flex items-center gap-1 font-black text-mint-deep text-xs sm:text-sm">
            <span className="flex size-4 items-center justify-center rounded-full bg-mint/15 text-mint-deep">
              <ArrowUpRight size={11} strokeWidth={3} />
            </span>
            <span>+{formatCentimes(currentMonthStats.income)}</span>
          </div>
        </div>

        {/* Dépenses */}
        <div className="flex flex-col items-center px-1">
          <span className="text-[10px] font-bold uppercase text-slate-400">Dépenses</span>
          <div className="mt-0.5 flex items-center gap-1 font-black text-danger text-xs sm:text-sm">
            <span className="flex size-4 items-center justify-center rounded-full bg-red-100 text-danger">
              <ArrowDownRight size={11} strokeWidth={3} />
            </span>
            <span>-{formatCentimes(currentMonthStats.expense)}</span>
          </div>
        </div>

        {/* Séquestre */}
        <div className="flex flex-col items-center px-1">
          <span className="text-[10px] font-bold uppercase text-slate-400">Séquestre</span>
          <div className="mt-0.5 flex items-center gap-1 font-black text-brand text-xs sm:text-sm">
            <span className="flex size-4 items-center justify-center rounded-full bg-blue-100 text-brand">
              <ShieldCheck size={11} strokeWidth={3} />
            </span>
            <span>{activeDeals.length} Deal(s)</span>
          </div>
        </div>
      </div>
    </section>
  );
}