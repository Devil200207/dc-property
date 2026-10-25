"use client";

import { useEffect } from "react";
import { BaseLayerToggle } from "./BaseLayerToggle";
import { pinIcon, useLeafletMap } from "./useLeafletMap";

export type MapItem = {
  id: number;
  title: string;
  lat: number;
  lng: number;
  price: string;
  place: string;
  thumb: string | null;
  sold: boolean;
};

const esc = (s: string) => s.replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`);

export default function ListingsMap({ items }: { items: MapItem[] }) {
  const { ref, L, map, base, setBase } = useLeafletMap({ base: "street", zoom: 10 });

  useEffect(() => {
    if (!L || !map) return;
    const group = L.featureGroup().addTo(map);
    for (const it of items) {
      L.marker([it.lat, it.lng], { icon: pinIcon(L, it.sold), title: it.title })
        .bindPopup(
          `<a href="/plots/${it.id}" style="display:block;color:inherit;text-decoration:none">
            ${it.thumb ? `<img src="${esc(it.thumb)}" alt="" style="width:100%;height:130px;object-fit:cover;display:block">` : ""}
            <div style="padding:10px 12px 12px">
              <div style="font-weight:700;font-size:15px">${esc(it.price)}</div>
              <div style="font-size:13px;margin-top:2px;color:#0f172a">${esc(it.title)}</div>
              <div style="font-size:12px;color:#64748b;margin-top:2px">${esc(it.place)}</div>
            </div>
          </a>`,
        )
        .addTo(group);
    }
    if (items.length) map.fitBounds(group.getBounds(), { padding: [50, 50], maxZoom: 15 });
    return () => void group.remove();
  }, [L, map, items]);

  return (
    <div className="relative h-full w-full">
      <div ref={ref} className="h-full w-full" />
      <BaseLayerToggle value={base} onChange={setBase} />
    </div>
  );
}
