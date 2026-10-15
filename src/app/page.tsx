"use client";

import { AppShell } from "@/components/AppShell";
import { Search, Filter, Loader2, ShieldCheck } from "lucide-react";
import { useQuery, useConvexAuth } from "convex/react";
import { api } from "../../convex/_generated/api";
import Link from "next/link";

export default function MarketplacePage() {
  const { isAuthenticated, isLoading } = useConvexAuth();
  const deals = useQuery(api.deals.mine, isAuthenticated ? undefined : "skip");

  const getFallbackImage = (title: string = "") => {
    const t = title.toLowerCase();
    if (t.includes("macbook") || t.includes("pc") || t.includes("ordinateur")) return "https://images.unsplash.com/photo-1517336714731-489689fd1ca8?q=80&w=800&auto=format&fit=crop";
    if (t.includes("site") || t.includes("web") || t.includes("dev")) return "https://images.unsplash.com/photo-1461749280684-dccba630e2f6?q=80&w=800&auto=format&fit=crop";
    if (t.includes("instagram") || t.includes("compte") || t.includes("social")) return "https://images.unsplash.com/photo-1611162617474-5b21e879e113?q=80&w=800&auto=format&fit=crop";
    if (t.includes("voiture") || t.includes("auto")) return "https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?q=80&w=800&auto=format&fit=crop";
    
    return "https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?q=80&w=800&auto=format&fit=crop";
  };

  return (
    <AppShell>
      {/* Added max-w-7xl and mx-auto to center and constrain width on massive screens */}
      <div className="pb-6 animate-fadeIn mt-2 max-w-7xl mx-auto w-full">
        
        {/* Titre & Barre de recherche */}
        {/* Added md:flex md:items-center md:justify-between to put title and search on the same line on desktop */}
        <div className="mb-6 md:flex md:items-center md:justify-between md:gap-8">
          <h2 className="text-2xl font-bold text-slate-800 mb-4 md:mb-0 whitespace-nowrap">
            Trouver un Deal
          </h2>
          <div className="flex gap-2 w-full md:max-w-md">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input
                type="text"
                placeholder="Rechercher un service, un objet..."
                className="w-full bg-white py-3 pl-10 pr-4 rounded-2xl shadow-sm border-none focus:ring-2 focus:ring-blue-500 outline-none text-sm"
              />
            </div>
            <button className="bg-white p-3 rounded-2xl shadow-sm text-slate-600 flex items-center justify-center hover:bg-slate-50 transition-colors">
              <Filter className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Filtres par catégories */}
        {/* Added md:flex-wrap md:overflow-visible so chips wrap to a new line on desktop instead of scrolling */}
        <div className="flex gap-2 overflow-x-auto pb-2 mb-6 scrollbar-hide md:flex-wrap md:overflow-visible">
          {["Tous", "Services Digitaux", "Électronique", "Véhicules", "Comptes"].map(
            (cat, i) => (
              <button
                key={cat}
                className={`whitespace-nowrap px-4 py-2 rounded-full text-sm font-medium transition-colors hover:opacity-90 ${
                  i === 0
                    ? "bg-blue-600 text-white shadow-md shadow-blue-200"
                    : "bg-white text-slate-600 shadow-sm"
                }`}
              >
                {cat}
              </button>
            )
          )}
        </div>

        {/* Liste des Deals ou États de connexion */}
        {/* CHANGED from "space-y-5" to a responsive CSS Grid: 1 col on mobile, 2 on tablet, 3 on desktop, 4 on large screens */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {isLoading ? (
            <div className="col-span-full flex justify-center items-center py-10">
              <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
            </div>
          ) : !isAuthenticated ? (
            <div className="col-span-full text-center py-12 px-4 bg-white rounded-[2rem] shadow-sm border border-slate-50 flex flex-col items-center gap-4">
              <ShieldCheck className="w-12 h-12 text-blue-100 mb-2" />
              <p className="text-slate-500 font-medium">Vous devez être connecté pour voir vos deals sécurisés.</p>
              <Link href="/profile" className="bg-blue-600 text-white px-6 py-3 rounded-2xl text-sm font-bold hover:bg-blue-700 transition-colors shadow-md shadow-blue-600/20 mt-2">
                Se connecter
              </Link>
            </div>
          ) : deals === undefined ? (
            <div className="col-span-full flex justify-center items-center py-10">
              <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
            </div>
          ) : deals.length === 0 ? (
            <div className="col-span-full text-center py-10 text-slate-500 bg-white rounded-3xl border border-slate-50">
              Aucun deal disponible pour le moment.
            </div>
          ) : (
            deals.map((deal) => (
              <div
                key={deal._id}
                className="bg-white p-4 rounded-[2rem] shadow-sm border border-slate-50 flex flex-col gap-4 relative overflow-hidden group hover:shadow-md transition-shadow"
              >
                <div className="w-full h-40 bg-slate-100 rounded-[1.5rem] overflow-hidden relative">
                  <img
                    src={(deal as any).imageUrl || getFallbackImage(deal.title)}
                    alt={deal.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute top-3 left-3">
                    <span className="text-[10px] font-black uppercase text-blue-700 bg-white/90 backdrop-blur px-3 py-1.5 rounded-full shadow-sm">
                      {(deal as any).category || "Deal Sécurisé"}
                    </span>
                  </div>
                </div>

                {/* Added flex-1 to push the bottom border/pricing section to the bottom of the card uniformly */}
                <div className="flex flex-col flex-1 justify-between items-start px-2">
                  <div className="w-full mb-4">
                    <h3 className="font-extrabold text-slate-800 text-lg leading-tight mb-1">
                      {deal.title}
                    </h3>
                    <p className="text-sm font-medium text-slate-500 line-clamp-2">
                      {deal.description}
                    </p>
                  </div>
                  
                  <div className="w-full flex items-center justify-between border-t border-slate-100 pt-4 px-2">
                    <div>
                      <p className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">
                        Montant
                      </p>
                      <p className="font-black text-slate-800 text-lg">
                        {deal.amount} DA
                      </p>
                    </div>
                    <Link
                      href={`/deals/${deal._id}`}
                      className="bg-slate-900 text-white px-6 py-3 rounded-2xl text-sm font-bold hover:bg-slate-800 transition-colors shadow-md shadow-slate-900/20 whitespace-nowrap"
                    >
                      Voir le deal
                    </Link>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </AppShell>
  );
}