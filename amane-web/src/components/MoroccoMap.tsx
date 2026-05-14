"use client";

import "leaflet/dist/leaflet.css";

import { CircleMarker, MapContainer, Popup, TileLayer, Tooltip } from "react-leaflet";

import { REGIONS_COORDS } from "@/app/admin/map/page";

interface Props {
  regionStats: Map<string, { count: number; urgent: number }>;
  /** Hauteur en px (default 600) ou "100%" pour parent-driven */
  height?: number | string;
  /** Zoom initial (default 5) */
  zoom?: number;
}

export default function MoroccoMap({ regionStats, height = 600, zoom = 5 }: Props) {
  const maxCount = Math.max(1, ...Array.from(regionStats.values()).map((s) => s.count));
  const heightStyle = typeof height === "number" ? `${height}px` : height;

  return (
    <div className="relative w-full" style={{ height: heightStyle }}>
      <MapContainer
        center={[31.5, -7.5]}
        zoom={zoom}
        scrollWheelZoom={true}
        style={{ height: "100%", width: "100%" }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {Object.entries(REGIONS_COORDS).map(([key, region]) => {
          const stats = regionStats.get(key);
          const count = stats?.count ?? 0;
          const urgent = stats?.urgent ?? 0;
          const hasUrgent = urgent > 0;

          // Rayon proportionnel + radius minimum pour visibilité
          const radius = count === 0 ? 6 : 6 + Math.sqrt(count / maxCount) * 18;
          const color = hasUrgent ? "#ef4444" : count > 0 ? "#2563eb" : "#94a3b8";
          const fillColor = hasUrgent ? "#fca5a5" : count > 0 ? "#bfdbfe" : "#e2e8f0";

          return (
            <CircleMarker
              key={key}
              center={[region.lat, region.lng]}
              radius={radius}
              pathOptions={{
                color,
                fillColor,
                fillOpacity: count > 0 ? 0.6 : 0.3,
                weight: 2,
              }}
            >
              <Tooltip direction="top" offset={[0, -10]} opacity={1}>
                <div className="text-xs">
                  <strong>{region.name}</strong>
                  <br />
                  {count} consultation{count > 1 ? "s" : ""}
                  {urgent > 0 && (
                    <>
                      <br />
                      <span className="text-red-600 font-semibold">
                        {urgent} urgent{urgent > 1 ? "s" : ""}
                      </span>
                    </>
                  )}
                </div>
              </Tooltip>
              <Popup>
                <div className="text-sm">
                  <p className="font-bold text-zinc-900 mb-1">{region.name}</p>
                  <p className="text-zinc-600">
                    <strong>{count}</strong> consultation{count > 1 ? "s" : ""} envoyée{count > 1 ? "s" : ""}
                  </p>
                  {urgent > 0 && (
                    <p className="text-red-600 font-semibold mt-1">
                      {urgent} cas à haut risque
                    </p>
                  )}
                  {count === 0 && (
                    <p className="text-zinc-400 text-xs mt-1 italic">
                      Aucune activité
                    </p>
                  )}
                </div>
              </Popup>
            </CircleMarker>
          );
        })}
      </MapContainer>
    </div>
  );
}
