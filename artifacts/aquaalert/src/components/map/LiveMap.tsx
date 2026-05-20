import { useEffect } from "react";
import { MapContainer, TileLayer, CircleMarker, Popup, useMap } from "react-leaflet";
import { Link } from "wouter";
import { Report } from "@workspace/api-client-react";
import { SEVERITY_COLORS, STATUS_COLORS } from "@/lib/constants";
import { Badge } from "@/components/ui/badge";
import { ExternalLink, Clock } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

function MapUpdater({ center }: { center: [number, number] }) {
  const map = useMap();
  useEffect(() => {
    map.setView(center, map.getZoom());
  }, [center, map]);
  return null;
}

const SEVERITY_RADIUS: Record<string, number> = {
  critical: 13,
  high: 10,
  medium: 7,
  low: 5,
};

const SEVERITY_LABELS: { key: string; label: string; color: string }[] = [
  { key: "critical", label: "Critical",  color: SEVERITY_COLORS.critical },
  { key: "high",     label: "High",      color: SEVERITY_COLORS.high },
  { key: "medium",   label: "Medium",    color: SEVERITY_COLORS.medium },
  { key: "low",      label: "Low",       color: SEVERITY_COLORS.low },
];

interface LiveMapProps {
  reports: Report[];
  center?: [number, number];
  zoom?: number;
}

export default function LiveMap({ reports, center = [19.076, 72.877], zoom = 12 }: LiveMapProps) {
  return (
    <div className="relative w-full h-full">
      <MapContainer
        center={center}
        zoom={zoom}
        className="w-full h-full z-0"
        zoomControl={false}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
        />
        <MapUpdater center={center} />

        {reports.map((report) => {
          const color = SEVERITY_COLORS[report.severity as keyof typeof SEVERITY_COLORS] || SEVERITY_COLORS.low;
          const radius = SEVERITY_RADIUS[report.severity] ?? 7;
          const isCritical = report.severity === "critical";

          return (
            <CircleMarker
              key={report.id}
              center={[report.latitude, report.longitude]}
              radius={radius}
              pathOptions={{
                color: isCritical ? "#ffffff" : color,
                fillColor: color,
                fillOpacity: isCritical ? 0.85 : 0.7,
                weight: isCritical ? 2 : 1.5,
              }}
            >
              <Popup className="leaflet-popup-dark" minWidth={220}>
                <div className="bg-slate-900 rounded-lg overflow-hidden min-w-[220px]">
                  <div className="px-4 py-3 border-b border-slate-800 flex justify-between items-center">
                    <Badge variant="outline" style={{ color, borderColor: color }} className="text-xs font-bold">
                      {report.severity.toUpperCase()}
                    </Badge>
                    <Badge
                      variant="outline"
                      style={{
                        color: STATUS_COLORS[report.status as keyof typeof STATUS_COLORS],
                        borderColor: STATUS_COLORS[report.status as keyof typeof STATUS_COLORS],
                      }}
                      className="text-xs"
                    >
                      {report.status.replace("_", " ").toUpperCase()}
                    </Badge>
                  </div>
                  <div className="px-4 py-3">
                    <h4 className="font-semibold text-slate-100 leading-snug mb-1">{report.title}</h4>
                    <p className="text-xs text-slate-400 mb-3">{report.ward}</p>
                    <div className="flex items-center text-xs text-slate-500 mb-3">
                      <Clock className="w-3 h-3 mr-1" />
                      {formatDistanceToNow(new Date(report.createdAt), { addSuffix: true })}
                    </div>
                    <Link href={`/reports/${report.id}`}>
                      <div className="w-full flex items-center justify-center py-2 bg-cyan-950/60 hover:bg-cyan-900/60 border border-cyan-900/50 rounded-lg text-xs font-semibold text-cyan-400 cursor-pointer transition-colors gap-1.5">
                        View Details
                        <ExternalLink className="w-3 h-3" />
                      </div>
                    </Link>
                  </div>
                </div>
              </Popup>
            </CircleMarker>
          );
        })}
      </MapContainer>

      {/* Severity Legend */}
      <div className="absolute bottom-6 left-4 z-[400] bg-slate-900/90 backdrop-blur border border-slate-800 rounded-xl px-4 py-3 shadow-xl">
        <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-widest mb-2">Severity</p>
        <div className="space-y-1.5">
          {SEVERITY_LABELS.map(({ key, label, color }) => (
            <div key={key} className="flex items-center gap-2.5">
              <span
                className="rounded-full flex-shrink-0"
                style={{
                  width: SEVERITY_RADIUS[key] * 1.6,
                  height: SEVERITY_RADIUS[key] * 1.6,
                  backgroundColor: color,
                  boxShadow: key === "critical" ? `0 0 6px ${color}80` : undefined,
                }}
              />
              <span className="text-xs text-slate-300">{label}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
