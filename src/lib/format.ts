import { AREA_UNITS, type AreaUnit } from "./constants";

/** ₹45 Lakh, ₹1.25 Cr, ₹85,000 — the way buyers in India read prices. */
export function formatPrice(rupees: number | null | undefined): string {
  if (rupees == null || !Number.isFinite(rupees) || rupees <= 0) return "Price on request";
  const trim = (n: number) => n.toFixed(2).replace(/\.?0+$/, "");
  if (rupees >= 1e7) return `₹${trim(rupees / 1e7)} Cr`;
  if (rupees >= 1e5) return `₹${trim(rupees / 1e5)} Lakh`;
  return `₹${rupees.toLocaleString("en-IN")}`;
}

export function formatArea(area: number | null | undefined, unit: string): string {
  if (!area) return "—";
  const u = AREA_UNITS[unit as AreaUnit];
  return `${area.toLocaleString("en-IN", { maximumFractionDigits: 2 })} ${u ? u.short : unit}`;
}

export function priceLine(l: { price: number | null; price_basis: string; area_unit: string }): string {
  const p = formatPrice(l.price);
  if (l.price && l.price_basis === "per_unit") {
    const u = AREA_UNITS[l.area_unit as AreaUnit];
    return `${p} / ${u ? u.short : l.area_unit}`;
  }
  return p;
}

/** Total price when listed per-unit, so cards can show a ballpark. */
export function totalPrice(l: { price: number | null; price_basis: string; area: number | null }): number | null {
  if (!l.price) return null;
  if (l.price_basis === "per_unit") return l.area ? l.price * l.area : null;
  return l.price;
}

export function timeAgo(iso: string): string {
  const d = new Date(iso.includes("T") ? iso : iso.replace(" ", "T") + "Z");
  const days = Math.floor((Date.now() - d.getTime()) / 86400000);
  if (days < 1) return "Today";
  if (days === 1) return "Yesterday";
  if (days < 30) return `${days} days ago`;
  return d.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}

/** "Chhatikara, Mathura" — drops repeats like tehsil == district. */
export const placeLine = (...parts: (string | null | undefined)[]) =>
  [...new Set(parts.map((p) => p?.trim()).filter(Boolean))].join(", ");

export const mediaUrl = (key: string) => `/media/${key}`;
export const thumbUrl = (key: string) =>
  key.endsWith(".webp") ? `/media/${key.replace(/\.webp$/, "-t.webp")}` : `/media/${key}`;
