import {
  Banknote, CreditCard, HandCoins, Lock, Percent, Scale, SlidersHorizontal, Undo2,
  type LucideIcon,
} from "lucide-react";

export const LEDGER: Record<string, { label: string; Icon: LucideIcon; tile: string }> = {
  deposit: { label: "Recharge", Icon: CreditCard, tile: "bg-tint-blue text-brand" },
  withdrawal: { label: "Retrait", Icon: Banknote, tile: "bg-tint-amber text-amber" },
  withdrawal_refund: { label: "Retrait annulé", Icon: Undo2, tile: "bg-tint-blue text-brand" },
  escrow_funding: { label: "Mise en séquestre", Icon: Lock, tile: "bg-tint-violet text-violet" },
  escrow_release: { label: "Paiement reçu", Icon: HandCoins, tile: "bg-tint-mint text-mint-deep" },
  escrow_fee: { label: "Frais Trustik", Icon: Percent, tile: "bg-tint-amber text-amber" },
  dispute_refund: { label: "Remboursement", Icon: Undo2, tile: "bg-tint-mint text-mint-deep" },
  dispute_settlement: { label: "Règlement de litige", Icon: Scale, tile: "bg-tint-violet text-violet" },
  admin_adjustment: { label: "Ajustement", Icon: SlidersHorizontal, tile: "bg-tint-blue text-brand" },
};

export const DEAL_STATUS: Record<string, { label: string; pct: number; bar: string; chip: string }> = {
  pending: { label: "En attente", pct: 20, bar: "bg-amber", chip: "bg-tint-amber text-amber" },
  accepted: { label: "Accepté", pct: 45, bar: "bg-brand", chip: "bg-tint-blue text-brand" },
  funded: { label: "Financé", pct: 70, bar: "bg-mint", chip: "bg-tint-mint text-mint-deep" },
  disputed: { label: "Litige", pct: 70, bar: "bg-danger", chip: "bg-red-50 text-danger" },
  released: { label: "Terminé", pct: 100, bar: "bg-mint-deep", chip: "bg-tint-mint text-mint-deep" },
  settled: { label: "Réglé", pct: 100, bar: "bg-violet", chip: "bg-tint-violet text-violet" },
  cancelled: { label: "Annulé", pct: 0, bar: "bg-muted", chip: "bg-page text-muted" },
};

export const ACTIVE_STATUSES = ["pending", "accepted", "funded", "disputed"];