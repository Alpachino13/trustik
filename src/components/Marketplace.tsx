"use client";

import { useMutation, usePaginatedQuery, useQuery } from "convex/react";
import type { FunctionReturnType } from "convex/server";
import { MapPin, Plus, Search, ShieldCheck, SlidersHorizontal, X } from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState, type ReactNode } from "react";
import { api } from "../../convex/_generated/api";
import type { Doc } from "../../convex/_generated/dataModel";
import { errorMessage, formatCentimes } from "@/lib/format";
import { useTranslation } from "@/lib/i18n/context";

type Category = Doc<"listings">["category"];
type Side = Doc<"listings">["side"];
type Item = FunctionReturnType<typeof api.listings.browse>["page"][number];

const CATEGORY_IDS: Category[] = [
  "electronics", "vehicles", "property", "services", "fashion", "home", "digital", "other",
];

const CARD = "rounded-[2rem] bg-white p-5 shadow-[0_8px_24px_-10px_rgba(53,82,220,0.1)]";
const FIELD =
  "w-full rounded-2xl bg-page px-4 py-3 text-sm font-bold text-ink outline-none placeholder:font-semibold placeholder:text-muted focus:ring-2 focus:ring-brand";

function useDebounced<V>(value: V, ms = 300) {
  const [v, setV] = useState(value);
  useEffect(() => {
    const id = setTimeout(() => setV(value), ms);
    return () => clearTimeout(id);
  }, [value, ms]);
  return v;
}

function Chip({ active, onClick, children }: { active: boolean; onClick: () => void; children: ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`shrink-0 rounded-full px-4 py-2 text-xs font-extrabold transition active:scale-95 ${
        active ? "bg-brand text-white shadow-md shadow-brand/25" : "bg-white text-muted shadow-sm hover:text-ink"
      }`}
    >
      {children}
    </button>
  );
}

function Sheet({ title, onClose, children }: { title: string; onClose: () => void; children: ReactNode }) {
  const { t } = useTranslation();
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        onClick={(e) => e.stopPropagation()}
        className="max-h-[90vh] w-full max-w-md animate-[sheet_0.25s_ease-out] overflow-y-auto rounded-t-[2.5rem] bg-white p-6 pb-8 shadow-2xl"
      >
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl font-extrabold text-ink">{title}</h2>
          <button
            type="button"
            aria-label={t.common.close}
            onClick={onClose}
            className="flex size-9 items-center justify-center rounded-full bg-page text-muted transition hover:text-ink active:scale-95"
          >
            <X size={18} />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

function ListingCard({ item, onAccept }: { item: Item; onAccept: () => void }) {
  const { t } = useTranslation();
  const m = t.marketplace;
  const selling = item.side === "selling";
  return (
    <article className={CARD}>
      <div className="flex items-center gap-3">
        <span className="flex size-10 items-center justify-center rounded-full bg-tint-blue text-sm font-black text-brand">
          {item.posterInitial}
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-extrabold text-ink">
            {item.posterName === "Membre Trustik" ? m.memberFallback : item.posterName}
          </p>
          <p className="flex items-center gap-1 text-[11px] font-semibold text-muted">
            {item.posterVerified && <ShieldCheck size={12} className="text-mint-deep" aria-label={m.verifiedVendor} />}
            {item.posterCompletedDeals} {m.completedDeals}
          </p>
        </div>
        <span
          className={`rounded-full px-3 py-1 text-[11px] font-extrabold ${
            selling ? "bg-tint-mint text-mint-deep" : "bg-tint-blue text-brand"
          }`}
        >
          {selling ? m.sideSelling : m.sideBuying}
        </span>
      </div>

      <h3 className="mt-3 text-base font-extrabold text-ink">{item.title}</h3>
      <p className="mt-1 line-clamp-2 text-sm font-semibold text-muted">{item.description}</p>

      <div className="mt-4 flex items-end justify-between gap-3">
        <div>
          <p className="text-lg font-black text-ink">{formatCentimes(item.amount)}</p>
          <div className="mt-1 flex flex-wrap items-center gap-1.5">
            <span className="rounded-full bg-page px-2 py-0.5 text-[11px] font-bold text-muted">
              {m.categories[item.category]}
            </span>
            {item.city && (
              <span className="flex items-center gap-0.5 text-[11px] font-bold text-muted">
                <MapPin size={11} />
                {item.city}
              </span>
            )}
          </div>
        </div>
        <button
          type="button"
          onClick={onAccept}
          className="rounded-full bg-brand px-5 py-2.5 text-xs font-extrabold text-white shadow-md shadow-brand/30 transition hover:bg-brand-deep active:scale-95"
        >
          {selling ? m.buyWithEscrow : m.makeOffer}
        </button>
      </div>
    </article>
  );
}

function AcceptSheet({ item, onClose }: { item: Item; onClose: () => void }) {
  const { t } = useTranslation();
  const m = t.marketplace;
  const accept = useMutation(api.listings.accept);
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function confirm() {
    setBusy(true);
    setError(null);
    try {
      const dealId = await accept({ listingId: item._id });
      router.push(`/deals/${dealId}`);
    } catch (e) {
      setError(errorMessage(e));
      setBusy(false);
    }
  }

  return (
    <Sheet title={m.acceptTitle} onClose={onClose}>
      <p className="font-extrabold text-ink">{item.title}</p>
      <p className="mt-1 text-2xl font-black text-ink">{formatCentimes(item.amount)}</p>
      <p className="mt-3 rounded-2xl bg-page p-3 text-sm font-semibold text-ink">
        {item.side === "selling" ? m.acceptAsBuyer : m.acceptAsSeller}
      </p>
      <p className="mt-2 text-xs font-semibold text-muted">{m.feeNote}</p>
      {error && <p className="mt-3 rounded-xl bg-red-50 p-2.5 text-center text-xs font-bold text-danger">{error}</p>}
      <button
        type="button"
        onClick={confirm}
        disabled={busy}
        className="mt-5 w-full rounded-2xl bg-brand py-4 text-sm font-black text-white shadow-lg shadow-brand/30 transition hover:bg-brand-deep active:scale-[0.99] disabled:opacity-50"
      >
        {busy ? t.common.loading : m.confirmCreateDeal}
      </button>
    </Sheet>
  );
}

function PublishSheet({ onClose }: { onClose: () => void }) {
  const { t } = useTranslation();
  const m = t.marketplace;
  const create = useMutation(api.listings.create);
  const [side, setSide] = useState<Side>("selling");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState<Category>("electronics");
  const [city, setCity] = useState("");
  const [amount, setAmount] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.SyntheticEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      await create({ side, title, description, category, city: city || undefined, amountDzd: Number(amount) });
      onClose();
    } catch (err) {
      setError(errorMessage(err));
      setBusy(false);
    }
  }

  return (
    <Sheet title={m.publishModalTitle} onClose={onClose}>
      <form onSubmit={submit} className="space-y-3">
        <div className="flex gap-2">
          <Chip active={side === "selling"} onClick={() => setSide("selling")}>{m.iSell}</Chip>
          <Chip active={side === "buying"} onClick={() => setSide("buying")}>{m.iBuy}</Chip>
        </div>
        <input className={FIELD} placeholder={m.itemTitle} value={title} onChange={(e) => setTitle(e.target.value)} required minLength={5} maxLength={100} />
        <select className={FIELD} aria-label={m.category} value={category} onChange={(e) => setCategory(e.target.value as Category)}>
          {CATEGORY_IDS.map((id) => (
            <option key={id} value={id}>{m.categories[id]}</option>
          ))}
        </select>
        <div className="grid grid-cols-2 gap-2">
          <input className={FIELD} type="number" min={100} step={1} placeholder={m.priceDzd} value={amount} onChange={(e) => setAmount(e.target.value)} required />
          <input className={FIELD} placeholder={m.vendorCity} value={city} onChange={(e) => setCity(e.target.value)} maxLength={60} />
        </div>
        <textarea className={`${FIELD} min-h-28`} placeholder={m.description} value={description} onChange={(e) => setDescription(e.target.value)} required minLength={10} maxLength={2000} />
        {error && <p className="rounded-xl bg-red-50 p-2.5 text-center text-xs font-bold text-danger">{error}</p>}
        <button
          disabled={busy}
          className="w-full rounded-2xl bg-brand py-4 text-sm font-black text-white shadow-lg shadow-brand/30 transition hover:bg-brand-deep active:scale-[0.99] disabled:opacity-50"
        >
          {busy ? t.common.loading : m.publishButton}
        </button>
      </form>
    </Sheet>
  );
}

function Discover({ onAccept }: { onAccept: (i: Item) => void }) {
  const { t } = useTranslation();
  const m = t.marketplace;
  const [search, setSearch] = useState("");
  const [side, setSide] = useState<Side | undefined>();
  const [category, setCategory] = useState<Category | undefined>();
  const [showFilters, setShowFilters] = useState(false);
  const [min, setMin] = useState("");
  const [max, setMax] = useState("");
  const debouncedSearch = useDebounced(search.trim());
  const debouncedMin = useDebounced(min);
  const debouncedMax = useDebounced(max);
  const num = (s: string) => (s !== "" && Number.isFinite(Number(s)) ? Number(s) : undefined);

  const { results, status, loadMore } = usePaginatedQuery(
    api.listings.browse,
    {
      search: debouncedSearch || undefined,
      side,
      category,
      minDzd: num(debouncedMin),
      maxDzd: num(debouncedMax),
    },
    { initialNumItems: 10 },
  );

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <label className="flex flex-1 items-center gap-2 rounded-2xl bg-white px-4 py-3 shadow-sm">
          <Search size={18} className="shrink-0 text-muted" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={m.searchPlaceholder}
            maxLength={100}
            className="w-full bg-transparent text-sm font-bold text-ink outline-none placeholder:font-semibold placeholder:text-muted"
          />
        </label>
        <button
          type="button"
          aria-label={m.filters}
          aria-expanded={showFilters}
          onClick={() => setShowFilters((s) => !s)}
          className={`rounded-2xl px-3.5 shadow-sm transition ${showFilters ? "bg-brand text-white" : "bg-white text-muted"}`}
        >
          <SlidersHorizontal size={18} />
        </button>
      </div>

      <div className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4">
        <Chip active={!side} onClick={() => setSide(undefined)}>{m.filterAll}</Chip>
        <Chip active={side === "selling"} onClick={() => setSide("selling")}>{m.filterSelling}</Chip>
        <Chip active={side === "buying"} onClick={() => setSide("buying")}>{m.filterBuying}</Chip>
      </div>
      <div className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4">
        <Chip active={!category} onClick={() => setCategory(undefined)}>{m.allCategories}</Chip>
        {CATEGORY_IDS.map((id) => (
          <Chip key={id} active={category === id} onClick={() => setCategory(id)}>{m.categories[id]}</Chip>
        ))}
      </div>

      {showFilters && (
        <div className={`${CARD} grid grid-cols-2 gap-2`}>
          <input className={FIELD} type="number" min={0} placeholder={m.minPrice} value={min} onChange={(e) => setMin(e.target.value)} />
          <input className={FIELD} type="number" min={0} placeholder={m.maxPrice} value={max} onChange={(e) => setMax(e.target.value)} />
        </div>
      )}

      {status === "LoadingFirstPage" ? (
        <p className="animate-pulse py-10 text-center text-sm font-bold text-muted">{t.common.loading}</p>
      ) : results.length === 0 ? (
        <p className={`${CARD} text-center text-sm font-semibold text-muted`}>{m.noListings}</p>
      ) : (
        <div className="space-y-3">
          {results.map((item) => (
            <ListingCard key={item._id} item={item} onAccept={() => onAccept(item)} />
          ))}
          {status === "CanLoadMore" && (
            <button
              type="button"
              onClick={() => loadMore(10)}
              className="w-full rounded-2xl bg-white py-3 text-xs font-extrabold text-brand shadow-sm transition hover:bg-page"
            >
              {m.loadMore}
            </button>
          )}
        </div>
      )}
    </div>
  );
}

function MyListings() {
  const { t } = useTranslation();
  const m = t.marketplace;
  const mine = useQuery(api.listings.mine, {});
  const remove = useMutation(api.listings.remove);
  const [error, setError] = useState<string | null>(null);
  const chip = { open: "bg-tint-mint text-mint-deep", accepted: "bg-tint-blue text-brand", removed: "bg-page text-muted" } as const;
  const label = { open: m.statusOpen, accepted: m.statusAccepted, removed: m.statusRemoved } as const;

  if (mine === undefined) {
    return <p className="animate-pulse py-10 text-center text-sm font-bold text-muted">{t.common.loading}</p>;
  }
  if (mine.length === 0) {
    return <p className={`${CARD} text-center text-sm font-semibold text-muted`}>{m.myListingsEmpty}</p>;
  }
  return (
    <div className="space-y-3">
      {error && <p className="rounded-xl bg-red-50 p-2.5 text-center text-xs font-bold text-danger">{error}</p>}
      {mine.map((l) => (
        <article key={l._id} className={CARD}>
          <div className="flex items-start justify-between gap-2">
            <h3 className="font-extrabold text-ink">{l.title}</h3>
            <span className={`rounded-full px-3 py-1 text-[11px] font-extrabold ${chip[l.status]}`}>{label[l.status]}</span>
          </div>
          <p className="mt-1 text-lg font-black text-ink">{formatCentimes(l.amount)}</p>
          <div className="mt-3 flex gap-2">
            {l.status === "open" && (
              <button
                type="button"
                onClick={() => remove({ listingId: l._id }).catch((e) => setError(errorMessage(e)))}
                className="rounded-full bg-red-50 px-4 py-2 text-xs font-extrabold text-danger transition active:scale-95"
              >
                {m.remove}
              </button>
            )}
            {l.status === "accepted" && l.dealId && (
              <Link href={`/deals/${l.dealId}`} className="rounded-full bg-tint-blue px-4 py-2 text-xs font-extrabold text-brand">
                {m.viewDeal}
              </Link>
            )}
          </div>
        </article>
      ))}
    </div>
  );
}

function DepositBanner() {
  const { t } = useTranslation();
  const result = useSearchParams().get("deposit");
  const [hidden, setHidden] = useState(false);
  if (hidden || (result !== "success" && result !== "failed")) return null;
  const ok = result === "success";
  return (
    <p
      role="status"
      onClick={() => setHidden(true)}
      className={`cursor-pointer rounded-2xl p-3 text-sm font-semibold shadow-sm ${
        ok ? "bg-tint-mint text-mint-deep" : "bg-red-50 text-danger"
      }`}
    >
      {ok ? t.marketplace.depositSuccess : t.marketplace.depositFailed}
    </p>
  );
}

export function Marketplace() {
  const { t } = useTranslation();
  const m = t.marketplace;
  const [tab, setTab] = useState<"discover" | "mine">("discover");
  const [publish, setPublish] = useState(false);
  const [target, setTarget] = useState<Item | null>(null);

  return (
    <div className="space-y-4 pb-6">
      <Suspense fallback={null}>
        <DepositBanner />
      </Suspense>

      <section className="flex items-start gap-3 rounded-[2rem] bg-[linear-gradient(135deg,var(--color-brand),var(--color-brand-deep))] p-4 text-white shadow-[0_8px_24px_-10px_rgba(53,82,220,0.35)]">
        <ShieldCheck size={22} className="mt-0.5 shrink-0 text-mint" />
        <div>
          <p className="text-sm font-extrabold">{m.escrowGuaranteeTitle}</p>
          <p className="mt-0.5 text-xs font-semibold text-white/75">{m.escrowGuaranteeDesc}</p>
        </div>
      </section>

      <div className="flex items-center justify-between gap-2">
        <div className="flex gap-2">
          <Chip active={tab === "discover"} onClick={() => setTab("discover")}>{m.tabDiscover}</Chip>
          <Chip active={tab === "mine"} onClick={() => setTab("mine")}>{m.tabMine}</Chip>
        </div>
        <button
          type="button"
          onClick={() => setPublish(true)}
          className="flex items-center gap-1 rounded-full bg-mint px-4 py-2 text-xs font-extrabold text-white shadow-lg shadow-mint/45 transition hover:brightness-105 active:scale-95"
        >
          <Plus size={14} strokeWidth={3} />
          {m.publish}
        </button>
      </div>

      {tab === "discover" ? <Discover onAccept={setTarget} /> : <MyListings />}

      {publish && <PublishSheet onClose={() => setPublish(false)} />}
      {target && <AcceptSheet item={target} onClose={() => setTarget(null)} />}
    </div>
  );
}
