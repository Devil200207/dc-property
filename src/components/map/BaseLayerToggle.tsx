"use client";

import type { BaseLayer } from "./useLeafletMap";

export function BaseLayerToggle({ value, onChange }: { value: BaseLayer; onChange: (v: BaseLayer) => void }) {
  return (
    <div className="absolute left-3 top-3 z-[500] flex rounded-xl bg-white/95 p-1 text-xs font-semibold shadow-lg backdrop-blur">
      {(["satellite", "street"] as const).map((b) => (
        <button
          key={b}
          type="button"
          onClick={() => onChange(b)}
          className={`rounded-lg px-3 py-1.5 capitalize transition ${value === b ? "bg-ink text-white" : "text-slate-600 hover:text-ink"}`}
        >
          {b === "satellite" ? "Satellite" : "Map"}
        </button>
      ))}
    </div>
  );
}
