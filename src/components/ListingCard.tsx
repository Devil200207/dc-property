import Link from "next/link";
import { Camera, MapPin, Ruler, FileText } from "lucide-react";
import type { Listing } from "@/lib/db";
import { PROPERTY_TYPES, type PropertyType } from "@/lib/constants";
import { formatArea, placeLine, priceLine, thumbUrl } from "@/lib/format";
import { StatusBadge } from "./StatusBadge";

export function ListingCard({ l, priority = false }: { l: Listing; priority?: boolean }) {
  const cover = l.photos[0];
  return (
    <Link
      href={`/plots/${l.id}`}
      className="group card flex flex-col overflow-hidden transition duration-300 hover:-translate-y-0.5 hover:shadow-[0_18px_40px_-18px_rgb(15_23_42/0.35)]"
    >
      <div className="relative aspect-[4/3] overflow-hidden bg-slate-100">
        {cover ? (
          // Already resized + WebP on upload, so a plain <img> is the fastest path.
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={thumbUrl(cover)}
            alt={l.title}
            loading={priority ? "eager" : "lazy"}
            decoding="async"
            className={`size-full object-cover transition duration-500 group-hover:scale-[1.04] ${l.status === "sold" ? "grayscale-[60%]" : ""}`}
          />
        ) : (
          <div className="grid size-full place-items-center text-slate-400">
            <MapPin className="size-8" />
          </div>
        )}
        <div className="absolute left-3 top-3 flex gap-1.5">
          {l.featured && l.status === "available" && <span className="chip bg-amber-400 text-amber-950">Featured</span>}
          {l.status !== "available" && <StatusBadge status={l.status} />}
        </div>
        {l.photos.length > 1 && (
          <span className="chip absolute bottom-3 right-3 bg-black/55 text-white backdrop-blur">
            <Camera className="size-3" /> {l.photos.length}
          </span>
        )}
      </div>

      <div className="flex flex-1 flex-col p-4">
        <div className="flex items-start justify-between gap-3">
          <p className="text-lg font-bold tracking-tight text-ink">{priceLine(l)}</p>
          <span className="chip shrink-0 bg-brand-50 text-brand-700">{PROPERTY_TYPES[l.type as PropertyType] ?? l.type}</span>
        </div>
        <h3 className="mt-1 line-clamp-1 text-[15px] font-medium text-slate-800">{l.title}</h3>
        <p className="mt-1 flex items-center gap-1 text-sm text-muted">
          <MapPin className="size-3.5 shrink-0" />
          <span className="line-clamp-1">{placeLine(l.village, l.tehsil, l.district)}</span>
        </p>
        <div className="mt-auto pt-4" />
        <div className="grid grid-cols-2 gap-2 border-t border-line pt-3 text-xs text-slate-600">
          <span className="flex items-center gap-1.5">
            <Ruler className="size-3.5 text-slate-400" /> {formatArea(l.area, l.area_unit)}
          </span>
          <span className="flex items-center gap-1.5 truncate">
            <FileText className="size-3.5 shrink-0 text-slate-400" /> Khasra {l.khasra_no}
          </span>
        </div>
      </div>
    </Link>
  );
}
