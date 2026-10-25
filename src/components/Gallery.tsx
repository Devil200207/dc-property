"use client";

import { useState } from "react";
import { Images, MapPin } from "lucide-react";
import { Lightbox } from "./Lightbox";
import { mediaUrl, thumbUrl } from "@/lib/format";

export function Gallery({ photos, title }: { photos: string[]; title: string }) {
  const [open, setOpen] = useState<number | null>(null);
  if (!photos.length) {
    return (
      <div className="grid aspect-[21/9] place-items-center rounded-2xl bg-slate-100 text-slate-400">
        <div className="text-center"><MapPin className="mx-auto size-8" /><p className="mt-2 text-sm">Photos coming soon</p></div>
      </div>
    );
  }
  const side = photos.slice(1, 5);
  return (
    <>
      {/* Mobile: swipeable strip */}
      <div className="-mx-4 flex snap-x snap-mandatory gap-2 overflow-x-auto px-4 sm:hidden [scrollbar-width:none]">
        {photos.map((p, i) => (
          <button key={p} onClick={() => setOpen(i)} className="relative aspect-[4/3] w-[88%] shrink-0 snap-center overflow-hidden rounded-2xl bg-slate-100">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={i === 0 ? mediaUrl(p) : thumbUrl(p)} alt={`${title} — photo ${i + 1}`} loading={i < 2 ? "eager" : "lazy"} className="size-full object-cover" />
            <span className="chip absolute bottom-3 right-3 bg-black/55 text-white">{i + 1}/{photos.length}</span>
          </button>
        ))}
      </div>

      {/* Desktop: hero + 2×2 grid */}
      <div className={`hidden h-[460px] gap-2 overflow-hidden rounded-2xl sm:grid ${side.length ? "grid-cols-4 grid-rows-2" : "grid-cols-1"}`}>
        <button onClick={() => setOpen(0)} className={`group relative overflow-hidden bg-slate-100 ${side.length ? "col-span-2 row-span-2" : ""}`}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={mediaUrl(photos[0])} alt={title} fetchPriority="high" className="size-full object-cover transition duration-500 group-hover:scale-[1.02]" />
        </button>
        {side.map((p, i) => (
          <button
            key={p}
            onClick={() => setOpen(i + 1)}
            className={`group relative overflow-hidden bg-slate-100 ${side.length === 1 ? "col-span-2 row-span-2" : side.length === 2 ? "col-span-2" : side.length === 3 && i === 2 ? "col-span-2" : ""}`}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={thumbUrl(p)} alt={`${title} — photo ${i + 2}`} className="size-full object-cover transition duration-500 group-hover:scale-[1.04]" />
            {i === side.length - 1 && photos.length > 5 && (
              <span className="absolute inset-0 grid place-items-center bg-black/45 text-sm font-semibold text-white">+{photos.length - 5} more</span>
            )}
          </button>
        ))}
      </div>
      {photos.length > 1 && (
        <button onClick={() => setOpen(0)} className="btn-ghost mt-3 hidden h-9 text-xs sm:inline-flex">
          <Images className="size-4" /> View all {photos.length} photos
        </button>
      )}

      {open !== null && <Lightbox images={photos.map(mediaUrl)} index={open} onIndex={setOpen} onClose={() => setOpen(null)} />}
    </>
  );
}
