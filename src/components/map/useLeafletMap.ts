"use client";

import { useEffect, useRef, useState } from "react";
import type * as Leaflet from "leaflet";
import "leaflet/dist/leaflet.css";
import { MATHURA_CENTER } from "@/lib/site";

export type L = typeof Leaflet;
export type BaseLayer = "satellite" | "street";

const TILES = {
  satellite: [
    {
      url: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
      attribution: "Imagery © Esri, Maxar, Earthstar Geographics",
      maxNativeZoom: 19,
    },
    {
      // Village / road names on top of satellite imagery
      url: "https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}",
      attribution: "",
      maxNativeZoom: 19,
    },
  ],
  street: [
    {
      url: "https://tile.openstreetmap.org/{z}/{x}/{y}.png",
      attribution: "© OpenStreetMap contributors",
      maxNativeZoom: 19,
    },
  ],
} as const;

/**
 * Mounts a Leaflet map into `ref` (Leaflet is loaded lazily on the client only,
 * so it never slows down server rendering or the first paint).
 */
export function useLeafletMap(opts: { base?: BaseLayer; center?: [number, number]; zoom?: number; scrollZoom?: boolean } = {}) {
  const ref = useRef<HTMLDivElement>(null);
  const [state, setState] = useState<{ L: L; map: Leaflet.Map } | null>(null);
  const [base, setBase] = useState<BaseLayer>(opts.base ?? "satellite");
  const tileGroup = useRef<Leaflet.LayerGroup | null>(null);

  useEffect(() => {
    let map: Leaflet.Map | undefined;
    let cancelled = false;
    import("leaflet").then((mod) => {
      const L = (mod.default ?? mod) as L;
      if (cancelled || !ref.current) return;
      map = L.map(ref.current, {
        center: opts.center ?? MATHURA_CENTER,
        zoom: opts.zoom ?? 11,
        maxZoom: 21,
        zoomControl: false,
        scrollWheelZoom: opts.scrollZoom ?? false,
        attributionControl: true,
      });
      L.control.zoom({ position: "bottomright" }).addTo(map);
      map.attributionControl.setPrefix(false);
      tileGroup.current = L.layerGroup().addTo(map);
      setState({ L, map });
    });
    return () => {
      cancelled = true;
      map?.remove();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!state || !tileGroup.current) return;
    tileGroup.current.clearLayers();
    for (const t of TILES[base]) {
      state.L.tileLayer(t.url, { attribution: t.attribution, maxNativeZoom: t.maxNativeZoom, maxZoom: 21 }).addTo(tileGroup.current);
    }
  }, [state, base]);

  return { ref, L: state?.L ?? null, map: state?.map ?? null, base, setBase };
}

export function pinIcon(L: L, sold = false) {
  return L.divIcon({
    className: "",
    html: `<div class="dc-pin${sold ? " sold" : ""}"></div>`,
    iconSize: [34, 34],
    iconAnchor: [17, 34],
    popupAnchor: [0, -32],
  });
}

export const BOUNDARY_STYLE = { color: "#fbbf24", weight: 3, fillColor: "#fbbf24", fillOpacity: 0.18 };
