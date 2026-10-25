"use client";

import { useEffect } from "react";
import { BaseLayerToggle } from "./BaseLayerToggle";
import { BOUNDARY_STYLE, pinIcon, useLeafletMap } from "./useLeafletMap";
import type { LatLng } from "@/lib/geo";

export default function PlotMap({ lat, lng, boundary, sold }: { lat: number; lng: number; boundary: LatLng[]; sold?: boolean }) {
  const { ref, L, map, base, setBase } = useLeafletMap({ center: [lat, lng], zoom: 17 });

  useEffect(() => {
    if (!L || !map) return;
    const group = L.featureGroup().addTo(map);
    L.marker([lat, lng], { icon: pinIcon(L, sold) }).addTo(group);
    if (boundary.length >= 3) L.polygon(boundary, BOUNDARY_STYLE).addTo(group);
    if (boundary.length >= 3) map.fitBounds(group.getBounds(), { padding: [40, 40], maxZoom: 19 });
    else map.setView([lat, lng], 18);
    return () => void group.remove();
  }, [L, map, lat, lng, boundary, sold]);

  return (
    <div className="relative h-full w-full">
      <div ref={ref} className="h-full w-full" />
      <BaseLayerToggle value={base} onChange={setBase} />
    </div>
  );
}
