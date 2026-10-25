"use client";

import { useCallback, useEffect, useRef } from "react";
import { ChevronLeft, ChevronRight, X } from "lucide-react";

export function Lightbox({ images, index, onIndex, onClose }: {
  images: string[];
  index: number;
  onIndex: (i: number) => void;
  onClose: () => void;
}) {
  const n = images.length;
  const go = useCallback((d: number) => onIndex((index + d + n) % n), [index, n, onIndex]);
  const touchX = useRef<number | null>(null);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowRight") go(1);
      if (e.key === "ArrowLeft") go(-1);
    };
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [go, onClose]);

  return (
    <div
      role="dialog"
      aria-modal
      className="fixed inset-0 z-[2000] flex flex-col bg-black/95 text-white"
      onTouchStart={(e) => (touchX.current = e.touches[0].clientX)}
      onTouchEnd={(e) => {
        if (touchX.current == null) return;
        const dx = e.changedTouches[0].clientX - touchX.current;
        if (Math.abs(dx) > 50) go(dx < 0 ? 1 : -1);
        touchX.current = null;
      }}
    >
      <div className="flex items-center justify-between p-4 text-sm">
        <span className="text-white/70">{n > 1 ? `${index + 1} / ${n}` : ""}</span>
        <button onClick={onClose} className="grid size-10 place-items-center rounded-full bg-white/10 hover:bg-white/20" aria-label="Close">
          <X className="size-5" />
        </button>
      </div>
      <div className="relative flex min-h-0 flex-1 items-center justify-center px-2 pb-6 sm:px-16" onClick={onClose}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={images[index]} alt="" className="max-h-full max-w-full rounded-lg object-contain" onClick={(e) => e.stopPropagation()} />
        {n > 1 && (
          <>
            <button onClick={(e) => (e.stopPropagation(), go(-1))} className="absolute left-3 hidden size-12 place-items-center rounded-full bg-white/10 hover:bg-white/20 sm:grid" aria-label="Previous">
              <ChevronLeft className="size-6" />
            </button>
            <button onClick={(e) => (e.stopPropagation(), go(1))} className="absolute right-3 hidden size-12 place-items-center rounded-full bg-white/10 hover:bg-white/20 sm:grid" aria-label="Next">
              <ChevronRight className="size-6" />
            </button>
          </>
        )}
      </div>
    </div>
  );
}
