import { ConvexError } from "convex/values";

export function formatDzd(amount: number): string {
  return new Intl.NumberFormat("fr-DZ", {
    style: "currency",
    currency: "DZD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

export function formatCentimes(centimes: number): string {
  return formatDzd(centimes / 100);
}

export function centimesToDzd(centimes: number): number {
  return centimes / 100;
}

export function dzdToCentimes(dzd: number): number {
  return Math.round(dzd * 100);
}

const CODE_MESSAGES: Record<string, string> = {
  INSUFFICIENT_FUNDS: "Solde insuffisant.",
  FORBIDDEN: "Action non autorisée.",
  NOT_FOUND: "Élément introuvable.",
  UNAUTHENTICATED: "Veuillez vous connecter.",
  INVALID_AMOUNT: "Montant invalide.",
  INVALID_STATE: "Action impossible dans l'état actuel.",
  INVALID_INPUT: "Données invalides.",
  CONFLICT: "Conflit, veuillez réessayer.",
};

export function errorMessage(error: unknown): string {
  if (error instanceof ConvexError) {
    const data = error.data as { code?: string; message?: string } | string;
    if (typeof data === "string") return CODE_MESSAGES[data] ?? data;
    const msg = data.message ?? "";
    // `fail(code)` without a message repeats the code: show the friendly text instead
    return msg && msg !== data.code ? msg : (CODE_MESSAGES[data.code ?? ""] ?? "Une erreur est survenue.");
  }
  if (error instanceof Error) return error.message;
  if (typeof error === "string") return error;
  if (typeof error === "object" && error !== null && "message" in error) {
    return String((error as { message: unknown }).message);
  }
  return "Une erreur est survenue.";
}