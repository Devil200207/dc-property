"use client";

import { useState } from "react";
import { Expand, FileDown } from "lucide-react";
import { Lightbox } from "./Lightbox";
import { mediaUrl } from "@/lib/format";

export function KhasraMapViewer({ file, khasra }: { file: string; khasra: string }) {
  const [open, setOpen] = useState(false);
  const url = mediaUrl(file);

  if (file.endsWith(".pdf")) {
    return (
      <div className="overflow-hidden rounded-xl border border-line">
        <iframe src={`${url}#view=FitH`} title={`Khasra map ${khasra}`} className="hidden h-[520px] w-full bg-slate-50 md:block" />
        <div className="flex items-center justify-between gap-3 bg-slate-50 p-3">
          <span className="text-sm text-muted">Khasra map (PDF)</span>
          <a href={url} target="_blank" rel="noopener" className="btn-ghost h-9 text-xs"><FileDown className="size-4" /> Open PDF</a>
        </div>
      </div>
    );
  }
  return (
    <>
      <button onClick={() => setOpen(true)} className="group relative block w-full overflow-hidden rounded-xl border border-line bg-white">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={url} alt={`Khasra map for khasra no. ${khasra}`} loading="lazy" className="max-h-[520px] w-full object-contain" />
        <span className="chip absolute bottom-3 right-3 bg-ink/80 text-white opacity-90 group-hover:opacity-100">
          <Expand className="size-3.5" /> View full size
        </span>
      </button>
      {open && <Lightbox images={[url]} index={0} onIndex={() => {}} onClose={() => setOpen(false)} />}
    </>
  );
}
