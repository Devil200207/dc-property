"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import type * as Leaflet from "leaflet";
import { Crosshair, Eraser, Hexagon, Link2, Loader2, MapPin, Undo2 } from "lucide-react";
import { BaseLayerToggle } from "./BaseLayerToggle";
import { BOUNDARY_STYLE, pinIcon, useLeafletMap } from "./useLeafletMap";
import { polygonAreaSqm, type LatLng } from "@/lib/geo";
import { resolveMapsLink } from "@/app/admin/actions";

type Props = {
  point: LatLng | null;
  boundary: LatLng[];
  onPoint: (p: LatLng | null) => void;
  onBoundary: (b: LatLng[]) => void;
  onUseArea?: (sqyd: number) => void;
};

export function LocationPicker({ point, boundary, onPoint, onBoundary, onUseArea }: Props) {
  const { ref, L, map, base, setBase } = useLeafletMap({
    center: point ?? undefined,
    zoom: point ? 18 : 11,
    scrollZoom: true,
  });
  const [mode, setMode] = useState<"pin" | "boundary">("pin");
  const [link, setLink] = useState("");
  const [msg, setMsg] = useState<{ error?: boolean; text: string } | null>(null);
  const [resolving, startResolve] = useTransition();
  const [locating, setLocating] = useState(false);

  // Keep latest values for Leaflet event handlers without re-binding them.
  const live = useRef({ mode, boundary, onPoint, onBoundary });
  live.current = { mode, boundary, onPoint, onBoundary };

  useEffect(() => {
    if (!map) return;
    const onClick = (e: Leaflet.LeafletMouseEvent) => {
      const p: LatLng = [+e.latlng.lat.toFixed(7), +e.latlng.lng.toFixed(7)];
      const { mode, boundary, onPoint, onBoundary } = live.current;
      if (mode === "pin") onPoint(p);
      else onBoundary([...boundary, p]);
    };
    map.on("click", onClick);
    return () => void map.off("click", onClick);
  }, [map]);

  // Draw pin + boundary
  useEffect(() => {
    if (!L || !map) return;
    const group = L.layerGroup().addTo(map);
    if (point) {
      const m = L.marker(point, { icon: pinIcon(L), draggable: true }).addTo(group);
      m.on("dragend", () => {
        const ll = m.getLatLng();
        live.current.onPoint([+ll.lat.toFixed(7), +ll.lng.toFixed(7)]);
      });
    }
    if (boundary.length >= 2) L.polygon(boundary, BOUNDARY_STYLE).addTo(group);
    boundary.forEach((p, i) => {
      const v = L.marker(p, {
        icon: L.divIcon({ className: "", html: '<div class="dc-vertex"></div>', iconSize: [14, 14], iconAnchor: [7, 7] }),
        draggable: true,
      }).addTo(group);
      v.on("dragend", () => {
        const ll = v.getLatLng();
        const next = [...live.current.boundary];
        next[i] = [+ll.lat.toFixed(7), +ll.lng.toFixed(7)];
        live.current.onBoundary(next);
      });
    });
    return () => void group.remove();
  }, [L, map, point, boundary]);

  const flyTo = (p: LatLng) => map?.flyTo(p, Math.max(map.getZoom(), 18), { duration: 0.8 });

  const findLink = () =>
    startResolve(async () => {
      setMsg(null);
      const res = await resolveMapsLink(link);
      if (res.point) {
        onPoint(res.point);
        flyTo(res.point);
        setMsg({ text: `Pin placed at ${res.point[0].toFixed(6)}, ${res.point[1].toFixed(6)}` });
        setLink("");
      } else setMsg({ error: true, text: res.error ?? "Could not read location" });
    });

  const useMyLocation = () => {
    if (!navigator.geolocation) return setMsg({ error: true, text: "Location is not available on this device" });
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const p: LatLng = [+pos.coords.latitude.toFixed(7), +pos.coords.longitude.toFixed(7)];
        onPoint(p);
        flyTo(p);
        setLocating(false);
        setMsg({ text: `Pin placed at your location (±${Math.round(pos.coords.accuracy)} m)` });
      },
      (err) => {
        setLocating(false);
        setMsg({ error: true, text: err.code === 1 ? "Location permission denied" : "Could not get your location" });
      },
      { enableHighAccuracy: true, timeout: 15000 },
    );
  };

  const sqm = polygonAreaSqm(boundary);
  const sqyd = sqm / 0.836127;

  return (
    <div className="space-y-3">
      <div className="flex flex-col gap-2 sm:flex-row">
        <div className="relative flex-1">
          <Link2 className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
          <input
            value={link}
            onChange={(e) => setLink(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), link.trim() && findLink())}
            placeholder="Paste Google Maps link or coordinates (27.49, 77.67)"
            className="input pl-10"
          />
        </div>
        <div className="flex gap-2">
          <button type="button" onClick={findLink} disabled={!link.trim() || resolving} className="btn-dark flex-1 sm:flex-none">
            {resolving ? <Loader2 className="size-4 animate-spin" /> : <MapPin className="size-4" />} Place pin
          </button>
          <button type="button" onClick={useMyLocation} disabled={locating} className="btn-ghost flex-1 sm:flex-none" title="Use my current location">
            {locating ? <Loader2 className="size-4 animate-spin" /> : <Crosshair className="size-4" />} I&apos;m here
          </button>
        </div>
      </div>
      {msg && <p className={`text-sm ${msg.error ? "text-red-600" : "text-brand-700"}`}>{msg.text}</p>}

      <div className={`relative h-[460px] overflow-hidden rounded-xl border border-line ${mode === "boundary" ? "[&_.leaflet-container]:cursor-crosshair" : ""}`}>
        {/* Leaflet owns this div's className — never re-render it with different classes. */}
        <div ref={ref} className="h-full w-full" />
        <BaseLayerToggle value={base} onChange={setBase} />
        <div className="absolute right-3 top-3 z-[500] flex rounded-xl bg-white/95 p-1 text-xs font-semibold shadow-lg">
          <button type="button" onClick={() => setMode("pin")} className={`flex items-center gap-1 rounded-lg px-3 py-1.5 ${mode === "pin" ? "bg-brand-600 text-white" : "text-slate-600"}`}>
            <MapPin className="size-3.5" /> Pin
          </button>
          <button type="button" onClick={() => setMode("boundary")} className={`flex items-center gap-1 rounded-lg px-3 py-1.5 ${mode === "boundary" ? "bg-amber-500 text-white" : "text-slate-600"}`}>
            <Hexagon className="size-3.5" /> Boundary
          </button>
        </div>
        <p className="pointer-events-none absolute inset-x-0 bottom-3 z-[500] mx-auto w-fit max-w-[90%] rounded-full bg-ink/80 px-3 py-1.5 text-center text-xs font-medium text-white">
          {mode === "pin" ? "Tap the map to place the plot pin (drag to adjust)" : "Tap each corner of the plot in order (drag corners to adjust)"}
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-2 text-sm">
        {point ? (
          <span className="text-muted">Pin: {point[0].toFixed(6)}, {point[1].toFixed(6)}</span>
        ) : (
          <span className="text-amber-700">No pin yet — buyers won&apos;t see a map.</span>
        )}
        {point && <button type="button" onClick={() => onPoint(null)} className="text-xs font-medium text-red-600 hover:underline">Remove pin</button>}
        <span className="flex-1" />
        {boundary.length > 0 && (
          <>
            <button type="button" onClick={() => onBoundary(boundary.slice(0, -1))} className="btn-ghost h-8 text-xs"><Undo2 className="size-3.5" /> Undo corner</button>
            <button type="button" onClick={() => onBoundary([])} className="btn-ghost h-8 text-xs"><Eraser className="size-3.5" /> Clear boundary</button>
          </>
        )}
      </div>
      {boundary.length >= 3 && (
        <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl bg-amber-50 px-4 py-3 text-sm text-amber-900">
          <span>
            Boundary area ≈ <b>{Math.round(sqyd).toLocaleString("en-IN")} gaj</b> ({Math.round(sqm).toLocaleString("en-IN")} m²) — approximate, from satellite.
          </span>
          {onUseArea && (
            <button type="button" onClick={() => onUseArea(Math.round(sqyd))} className="text-xs font-semibold underline">Use as area</button>
          )}
        </div>
      )}
    </div>
  );
}
