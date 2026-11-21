"use client";

import { useEffect, useRef } from "react";
import { maplibregl } from "./maplibre";
import { type Map as MapLibreMap } from "maplibre-gl";
import { useTranslations } from "next-intl";
import {
  MapStyleControl,
  boundaryPaint,
  mapStyle,
  storedMapStyle,
  type MapStyleId,
} from "./map-styles";

type Props = {
  /** Initial and externally controlled position as [lat, lng]. */
  value: [number, number];
  zoom?: number;
  boundary?: GeoJSON.Geometry | null;
  onChange: (value: [number, number]) => void;
  className?: string;
};

/** Map with a fixed pin in the center: the user pans the map to place the pin. */
export function LocationPicker({
  value,
  zoom = 17,
  boundary,
  onChange,
  className,
}: Props) {
  const container = useRef<HTMLDivElement>(null);
  const mapRef = useRef<MapLibreMap | null>(null);
  const onChangeRef = useRef(onChange);
  const lastEmitted = useRef<string>("");
  const t = useTranslations("map");

  useEffect(() => {
    onChangeRef.current = onChange;
  });

  useEffect(() => {
    if (!container.current) return;
    let styleId: MapStyleId = storedMapStyle();
    const map = new maplibregl.Map({
      container: container.current,
      style: mapStyle(styleId),
      center: [value[1], value[0]],
      zoom,
      attributionControl: { compact: true },
    });
    mapRef.current = map;
    map.addControl(
      new MapStyleControl(
        {
          title: t("style"),
          map: t("map"),
          detailed: t("detailed"),
          satellite: t("satellite"),
        },
        styleId,
        (id) => {
          styleId = id;
          map.setStyle(mapStyle(id), { diff: false });
        },
      ),
      "bottom-right",
    );
    map.addControl(
      new maplibregl.NavigationControl({ showCompass: false }),
      "bottom-right",
    );
    map.on("style.load", () => {
      if (!boundary) return;
      map.addSource("boundary", {
        type: "geojson",
        data: { type: "Feature", properties: {}, geometry: boundary },
      });
      map.addLayer({
        id: "boundary-line",
        type: "line",
        source: "boundary",
        paint: boundaryPaint(styleId),
      });
    });
    map.on("moveend", () => {
      const c = map.getCenter();
      const next: [number, number] = [
        Number(c.lat.toFixed(7)),
        Number(c.lng.toFixed(7)),
      ];
      lastEmitted.current = next.join(",");
      onChangeRef.current(next);
    });
    return () => {
      map.remove();
      mapRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || value.join(",") === lastEmitted.current) return;
    map.jumpTo({
      center: [value[1], value[0]],
      zoom: Math.max(map.getZoom(), 16),
    });
  }, [value]);

  return (
    <div className={`relative ${className ?? ""}`}>
      <div className="absolute inset-0">
        <div ref={container} className="size-full" />
      </div>
      <div className="pointer-events-none absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-full">
        <svg
          width="36"
          height="46"
          viewBox="0 0 36 46"
          aria-hidden="true"
          className="drop-shadow-md"
        >
          <path
            d="M18 1C8.6 1 1 8.6 1 18c0 12 15 25.5 15.7 26.1a2 2 0 0 0 2.6 0C20 43.5 35 30 35 18 35 8.6 27.4 1 18 1Z"
            className="fill-primary stroke-white"
            strokeWidth="2"
          />
          <circle cx="18" cy="18" r="6" fill="white" />
        </svg>
      </div>
      <div className="pointer-events-none absolute top-1/2 left-1/2 size-2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-foreground/40" />
    </div>
  );
}
