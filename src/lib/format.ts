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

export function errorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  if (typeof error === "string") return error;
  if (typeof error === "object" && error !== null && "message" in error) {
    return String((error as { message: unknown }).message);
  }
  return "Une erreur est survenue.";
}