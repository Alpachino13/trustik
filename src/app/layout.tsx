import type { Metadata } from "next";
import { Quicksand } from "next/font/google";
import type { ReactNode } from "react";
import "./globals.css";
import { ConvexClientProvider } from "./ConvexClientProvider";

const quicksand = Quicksand({ subsets: ["latin"], variable: "--font-quicksand" });

export const metadata: Metadata = {
  title: "Trustik",
  description: "Paiements sécurisés par séquestre en Algérie",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="fr" className={quicksand.variable} suppressHydrationWarning>
      <body className="min-h-screen antialiased" suppressHydrationWarning>
        <ConvexClientProvider>{children}</ConvexClientProvider>
      </body>
    </html>
  );
}