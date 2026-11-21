import type { IControl, StyleSpecification } from "maplibre-gl";
import { mapStyleUrl } from "@/lib/config";

export const mapStyleIds = ["map", "detailed", "satellite"] as const;
export type MapStyleId = (typeof mapStyleIds)[number];

const STORAGE_KEY = "ocv-map-style";

const satelliteTilesUrl =
  process.env.NEXT_PUBLIC_SATELLITE_TILES_URL ||
  "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}";
const satelliteLabelsUrl =
  "https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}";

const satelliteStyle: StyleSpecification = {
  version: 8,
  glyphs: "https://tiles.openfreemap.org/fonts/{fontstack}/{range}.pbf",
  sources: {
    imagery: {
      type: "raster",
      tiles: [satelliteTilesUrl],
      tileSize: 256,
      maxzoom: 19,
      attribution: "Imagery © Esri, Maxar, Earthstar Geographics",
    },
    labels: {
      type: "raster",
      tiles: [satelliteLabelsUrl],
      tileSize: 256,
      maxzoom: 19,
    },
  },
  layers: [
    { id: "imagery", type: "raster", source: "imagery" },
    { id: "labels", type: "raster", source: "labels" },
  ],
};

export function mapStyle(id: MapStyleId): string | StyleSpecification {
  if (id === "satellite") return satelliteStyle;
  if (id === "detailed") return "https://tiles.openfreemap.org/styles/liberty";
  return mapStyleUrl;
}

export function boundaryPaint(id: MapStyleId) {
  return id === "satellite"
    ? {
        "line-color": "#ffffff",
        "line-width": 2,
        "line-dasharray": [2, 2],
        "line-opacity": 0.9,
      }
    : {
        "line-color": "#57534e",
        "line-width": 1.5,
        "line-dasharray": [2, 2],
        "line-opacity": 0.6,
      };
}

export function isMapStyleId(value: unknown): value is MapStyleId {
  return (mapStyleIds as readonly unknown[]).includes(value);
}

/** The visitor's saved choice, or `fallback` (the municipality's default) when there is none. */
export function storedMapStyle(fallback: MapStyleId = "map"): MapStyleId {
  if (typeof window === "undefined") return fallback;
  let value: string | null = null;
  try {
    value = window.localStorage.getItem(STORAGE_KEY);
  } catch {
    // Storage can be blocked by browser settings.
  }
  return isMapStyleId(value) ? value : fallback;
}

const layersIcon =
  '<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m12.83 2.18a2 2 0 0 0-1.66 0L2.6 6.08a1 1 0 0 0 0 1.83l8.58 3.91a2 2 0 0 0 1.66 0l8.58-3.9a1 1 0 0 0 0-1.83Z"/><path d="m22 17.65-9.17 4.16a2 2 0 0 1-1.66 0L2 17.65"/><path d="m22 12.65-9.17 4.16a2 2 0 0 1-1.66 0L2 12.65"/></svg>';

/** Map control that switches between base map styles and remembers the choice. */
export class MapStyleControl implements IControl {
  private container?: HTMLDivElement;
  private menu?: HTMLDivElement;
  private closeOnOutsideClick = (event: MouseEvent) => {
    if (!this.container?.contains(event.target as Node)) this.setOpen(false);
  };

  constructor(
    private labels: Record<MapStyleId | "title", string>,
    private current: MapStyleId,
    private onChange: (id: MapStyleId) => void,
  ) {}

  onAdd() {
    const container = document.createElement("div");
    container.className = "maplibregl-ctrl maplibregl-ctrl-group ocv-style-control";

    const toggle = document.createElement("button");
    toggle.type = "button";
    toggle.title = this.labels.title;
    toggle.setAttribute("aria-label", this.labels.title);
    toggle.setAttribute("aria-haspopup", "true");
    toggle.innerHTML = layersIcon;
    toggle.className = "ocv-style-toggle";
    toggle.addEventListener("click", () => this.setOpen(this.menu?.hidden ?? true));

    const menu = document.createElement("div");
    menu.className = "ocv-style-menu";
    menu.hidden = true;
    menu.setAttribute("role", "menu");
    for (const id of mapStyleIds) {
      const option = document.createElement("button");
      option.type = "button";
      option.setAttribute("role", "menuitemradio");
      option.dataset.style = id;
      option.textContent = this.labels[id];
      option.addEventListener("click", () => {
        this.select(id);
        this.setOpen(false);
      });
      menu.appendChild(option);
    }

    container.append(menu, toggle);
    this.container = container;
    this.menu = menu;
    this.render();
    document.addEventListener("click", this.closeOnOutsideClick);
    return container;
  }

  onRemove() {
    document.removeEventListener("click", this.closeOnOutsideClick);
    this.container?.remove();
  }

  private select(id: MapStyleId) {
    if (id === this.current) return;
    this.current = id;
    try {
      window.localStorage.setItem(STORAGE_KEY, id);
    } catch {
      // Storage can be blocked by browser settings; the choice then lasts for this page only.
    }
    this.render();
    this.onChange(id);
  }

  private setOpen(open: boolean) {
    if (this.menu) this.menu.hidden = !open;
  }

  private render() {
    this.menu?.querySelectorAll<HTMLButtonElement>("button").forEach((button) => {
      button.setAttribute("aria-checked", String(button.dataset.style === this.current));
    });
  }
}
