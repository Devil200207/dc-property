import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import { site } from "@/lib/site";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter", display: "swap" });

export const metadata: Metadata = {
  metadataBase: new URL(site.url),
  title: { default: `${site.name} — Plots & Land in Braj, Mathura`, template: `%s · ${site.name}` },
  description:
    "Verified residential, agricultural and commercial plots across Mathura, Vrindavan and Govardhan with khasra details, satellite maps and photos.",
  openGraph: { siteName: site.name, type: "website", locale: "en_IN" },
};

export const viewport: Viewport = { themeColor: "#115a3b" };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={inter.variable}>
      <body className="min-h-dvh font-sans">{children}</body>
    </html>
  );
}
