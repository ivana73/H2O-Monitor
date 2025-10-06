import "./MapPage.css";
import "leaflet/dist/leaflet.css";

import React, { useEffect, useRef } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import type { Map as LeafletMap, LatLngBoundsExpression, DivIcon } from "leaflet";
import L from "leaflet";
import { useI18n } from "../i18n.js";

// --- Fix Leaflet marker icons with Vite bundling ---
import marker2x from "leaflet/dist/images/marker-icon-2x.png";
import marker1x from "leaflet/dist/images/marker-icon.png";
import markerShadow from "leaflet/dist/images/marker-shadow.png";
L.Icon.Default.mergeOptions({
  iconRetinaUrl: marker2x,
  iconUrl: marker1x,
  shadowUrl: markerShadow,
});

// --- Belgrade view + bounds ---
const BELGRADE_CENTER: [number, number] = [44.8125, 20.4612];
const BELGRADE_BOUNDS: LatLngBoundsExpression = [
  [44.68, 20.20], // SW
  [44.95, 20.65], // NE
];

// Example data (replace with API later)
type Failure = {
  id: string;
  lat: number;
  lon: number;
  title: string;
  status: "active" | "resolved";
  desc?: string;
};
const SAMPLE: Failure[] = [
  { id: "1", lat: 44.8195, lon: 20.4643, title: "Pukla cev – Vračar", status: "active", desc: "Nizak pritisak, prijavljeno jutros" },
  { id: "2", lat: 44.8041, lon: 20.4144, title: "Radovi – Savski venac", status: "resolved", desc: "Završeno juče" },
];

// Simple, lightweight dot icon
function dot(status: "active" | "resolved"): DivIcon {
  const color = status === "active" ? "#ef4444" : "#10b981";
  return new L.DivIcon({
    className: "marker-dot",
    html: `<span style="display:inline-block;width:12px;height:12px;border-radius:999px;background:${color};box-shadow:0 0 0 2px #fff,0 0 0 4px rgba(0,0,0,.15)"></span>`,
    iconSize: [14, 14],
    iconAnchor: [7, 7],
  });
}

// Safe way to get the Leaflet Map instance (no apiKey usage here)
function AssignMapRef({ onReady }: { onReady: (m: LeafletMap) => void }) {
  const map = useMap();
  useEffect(() => { onReady(map); }, [map, onReady]);
  return null;
}

export default function MapPage() {
  const { t } = useI18n();
  const mapRef = useRef<LeafletMap | null>(null);

  // Read the key ONCE here. Do not use inside child helpers.
  const apiKey = import.meta.env.VITE_GEOAPIFY_KEY as string | undefined;

  // If there’s no key, do not render the map (no fallback).
  if (!apiKey) {
    return (
      <div className="container" style={{ padding: "16px 0" }}>
        <h1 className="mapbar__title">{t("map_title")}</h1>
        <p style={{ color: "#ef4444" }}>
          Missing Geoapify API key. Create <code>.env.local</code> in <code>frontend/</code> with:
        </p>
        <pre style={{ background: "#f3f4f6", padding: 12, borderRadius: 8 }}>
{`VITE_GEOAPIFY_KEY=YOUR_REAL_KEY`}
        </pre>
        <p>Then stop and start the dev server: <code>npm run dev</code>.</p>
      </div>
    );
  }

  return (
    <div className="map-page">
      <div className="container mapbar">
        <h1 className="mapbar__title">{t("map_title")}</h1>
        <div className="mapbar__legend">
          <span className="dot dot--active" /> {t("map_legend_active")}
          <span className="dot dot--resolved" /> {t("map_legend_resolved")}
        </div>
      </div>

      <div className="mapwrap">
        <MapContainer
          className="leaflet-root"
          center={BELGRADE_CENTER}
          zoom={13}
          minZoom={12}
          maxZoom={16}
          maxBounds={BELGRADE_BOUNDS}
          maxBoundsViscosity={1.0}
          scrollWheelZoom
          zoomControl
          doubleClickZoom
          dragging
          preferCanvas={false}
        >
          {/* Assign map instance to ref */}
          <AssignMapRef onReady={(m) => (mapRef.current = m)} />

          {/* Geoapify tiles ONLY (no fallback) */}
          <TileLayer
            url={`https://maps.geoapify.com/v1/tile/osm-bright/{z}/{x}/{y}.png?apiKey=${apiKey}`}
            attribution='&copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a> contributors, &copy; <a href="https://www.geoapify.com/">Geoapify</a>'
            tileSize={256}
            keepBuffer={1}
            noWrap
            detectRetina={false}
          />

          {SAMPLE.map((f) => (
            <Marker key={f.id} position={[f.lat, f.lon]} icon={dot(f.status)}>
              <Popup>
                <strong>{f.title}</strong>
                {f.desc && <div style={{ marginTop: 4 }}>{f.desc}</div>}
                <div style={{ marginTop: 6, fontSize: 12, color: "#6b7280" }}>
                  {f.status === "active" ? t("map_legend_active") : t("map_legend_resolved")}
                </div>
              </Popup>
            </Marker>
          ))}
        </MapContainer>
      </div>
    </div>
  );
}
