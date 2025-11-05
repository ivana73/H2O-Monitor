import "./MapPage.css";
import "leaflet/dist/leaflet.css";

import React, { useState, useEffect, useRef } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import type { Map as LeafletMap, LatLngBoundsExpression, DivIcon } from "leaflet";
import L from "leaflet";
import { useI18n } from "../i18n.js";
import { API_BASE_URL } from "../lib/apiClient.js"

// Fix Leaflet icons (for Vite)
import marker2x from "leaflet/dist/images/marker-icon-2x.png";
import marker1x from "leaflet/dist/images/marker-icon.png";
import markerShadow from "leaflet/dist/images/marker-shadow.png";
L.Icon.Default.mergeOptions({
  iconRetinaUrl: marker2x,
  iconUrl: marker1x,
  shadowUrl: markerShadow,
});

// Belgrade center and map bounds
const BELGRADE_CENTER: [number, number] = [44.8125, 20.4612];
const BELGRADE_BOUNDS: LatLngBoundsExpression = [
  [44.68, 20.20], // SW
  [44.95, 20.65], // NE
];

type Failure = {
  id: number;
  lat: number;
  lon: number;
  address: string;
  description: string;
  status: "active" | "resolved" | "planned";
};

function dot(status: "active" | "resolved" | "planned"): DivIcon {
  const color =
    status === "active" ? "#ef4444" : status === "resolved" ? "#10b981" : "#f59e0b";
  return new L.DivIcon({
    className: "marker-dot",
    html: `<span style="display:inline-block;width:12px;height:12px;border-radius:999px;background:${color};box-shadow:0 0 0 2px #fff,0 0 0 4px rgba(0,0,0,.15)"></span>`,
    iconSize: [14, 14],
    iconAnchor: [7, 7],
  });
}

function AssignMapRef({ onReady }: { onReady: (m: LeafletMap) => void }) {
  const map = useMap();
  useEffect(() => {
    onReady(map);
  }, [map, onReady]);
  return null;
}

export default function MapPage() {
  const { t } = useI18n();
  const mapRef = useRef<LeafletMap | null>(null);
  const [failures, setFailures] = useState<Failure[]>([]);

  const apiKey = import.meta.env.VITE_GEOAPIFY_KEY;

   useEffect(() => {
    // 🔹 Demo incidents only (no fetch)
    setFailures([
      {
        id: 1,
        lat: 44.8128,
        lon: 20.4599,
        address: "Knez Mihailova 5",
        description: "Pipe burst - partial outage in the center.",
        status: "active",
      },
      {
        id: 2,
        lat: 44.8205,
        lon: 20.4082,
        address: "New Belgrade Pump Station",
        description: "Scheduled maintenance - reduced pressure.",
        status: "planned",
      },
      {
        id: 3,
        lat: 44.848,
        lon: 20.4105,
        address: "Zemun Riverside",
        description: "Incident resolved, full service restored.",
        status: "resolved",
      },
    ]);
  }, []);

  if (!apiKey) {
    return (
      <div className="container" style={{ padding: "16px 0" }}>
        <h1 className="mapbar__title">{t("map_title")}</h1>
        <p style={{ color: "#ef4444" }}>
          Missing Geoapify API key. Create <code>.env.local</code> in <code>frontend/</code> with:
        </p>
        <pre style={{ background: "#f3f4f6", padding: 12, borderRadius: 8 }}>
{`VITE_GEOAPIFY_KEY=VITE_GEOAPIFY_KEY`}
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
          <AssignMapRef onReady={(m) => (mapRef.current = m)} />

          <TileLayer
            url={`https://maps.geoapify.com/v1/tile/osm-bright/{z}/{x}/{y}.png?apiKey=${apiKey}`}
            attribution='&copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a> contributors, &copy; <a href="https://www.geoapify.com/">Geoapify</a>'
            tileSize={256}
            keepBuffer={1}
            noWrap
            detectRetina={false}
          />

          {failures.map((f) =>
            Number.isFinite(f.lat) && Number.isFinite(f.lon) ? (
              <Marker key={f.id} position={[f.lat, f.lon]} icon={dot(f.status)}>
                <Popup>
                  <strong>{f.address}</strong>
                  <div style={{ marginTop: 6, fontSize: 12, color: "#6b7280" }}>
                    {t("map_legend_active")}
                  </div>
                </Popup>
              </Marker>
            ) : null
          )}
        </MapContainer>
      </div>
    </div>
  );
}
