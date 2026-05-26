import { useEffect } from "react";
import { MapContainer, TileLayer, CircleMarker, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import { Link } from "wouter";
import { Report } from "@workspace/api-client-react";
import { SEVERITY_COLORS, STATUS_COLORS } from "@/lib/constants";
import { Badge } from "@/components/ui/badge";
import { ExternalLink, Clock } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

function MapUpdater({ center }: { center: [number, number] }) {
  const map = useMap();
  useEffect(() => { map.setView(center, map.getZoom()); }, [center, map]);
  return null;
}

function createCriticalIcon(color: string) {
  return L.divIcon({
    className: "leaflet-div-icon",
    html: `
      <div style="position:relative;width:22px;height:22px;display:flex;align-items:center;justify-content:center;">
        <div class="aqua-ping-ring" style="position:absolute;inset:-3px;border-radius:50%;background:${color};opacity:0.45;"></div>
        <div class="aqua-pulse-dot" style="width:14px;height:14px;border-radius:50%;background:${color};border:2.5px solid rgba(255,255,255,0.9);position:relative;z-index:1;box-shadow:0 0 8px ${color}cc;"></div>
      </div>`,
    iconSize: [22, 22],
    iconAnchor: [11, 11],
    popupAnchor: [0, -14],
  });
}

const SEVERITY_RADIUS: Record<string, number> = { critical: 11, high: 8, medium: 6, low: 4 };

const LEGEND = [
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
      <MapContainer center={center} zoom={zoom} className="w-full h-full z-0" zoomControl={false}>
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
        />
        <MapUpdater center={center} />

        {reports.filter(r => r.status !== "resolved" && r.status !== "rejected").map((report) => {
          const color = SEVERITY_COLORS[report.severity as keyof typeof SEVERITY_COLORS] || SEVERITY_COLORS.low;
          const statusColor = STATUS_COLORS[report.status as keyof typeof STATUS_COLORS];

          const popupContent = (
            <div className="bg-transparent min-w-[230px]">
              <div className="px-4 py-3 border-b border-slate-800 flex justify-between items-center">
                <Badge variant="outline" style={{ color, borderColor: `${color}60`, backgroundColor: `${color}15` }} className="text-[10px] font-bold">
                  {report.severity.toUpperCase()}
                </Badge>
                <span className="text-[10px] font-medium" style={{ color: statusColor }}>
                  ● {report.status.replace("_", " ").toUpperCase()}
                </span>
              </div>
              <div className="px-4 py-3">
                <h4 className="font-semibold text-slate-100 leading-snug mb-1 text-sm">{report.title}</h4>
                <p className="text-xs text-slate-400 mb-3">{report.ward}</p>
                <div className="flex items-center text-xs text-slate-500 mb-3">
                  <Clock className="w-3 h-3 mr-1.5" />
                  {formatDistanceToNow(new Date(report.createdAt), { addSuffix: true })}
                  <span className="ml-auto font-medium text-slate-400">▲ {report.upvotes}</span>
                </div>
                <Link href={`/reports/${report.id}`}>
                  <div className="w-full flex items-center justify-center py-2 bg-cyan-950/60 hover:bg-cyan-900/60 border border-cyan-900/50 rounded-lg text-xs font-semibold text-cyan-400 cursor-pointer transition-colors gap-1.5">
                    View Details <ExternalLink className="w-3 h-3" />
                  </div>
                </Link>
              </div>
            </div>
          );

          if (report.severity === "critical") {
            return (
              <Marker key={report.id} position={[report.latitude, report.longitude]} icon={createCriticalIcon(color)}>
                <Popup minWidth={230}>{popupContent}</Popup>
              </Marker>
            );
          }

          return (
            <CircleMarker
              key={report.id}
              center={[report.latitude, report.longitude]}
              radius={SEVERITY_RADIUS[report.severity] ?? 6}
              pathOptions={{ color: color, fillColor: color, fillOpacity: 0.75, weight: 1.5 }}
            >
              <Popup minWidth={230}>{popupContent}</Popup>
            </CircleMarker>
          );
        })}
      </MapContainer>

      {/* Severity Legend */}
      <div className="absolute bottom-6 left-4 z-[400] bg-slate-900/92 backdrop-blur border border-slate-800 rounded-2xl px-4 py-3 shadow-2xl">
        <p className="text-[9px] font-bold text-slate-600 uppercase tracking-widest mb-2.5">Severity</p>
        <div className="space-y-2">
          {LEGEND.map(({ key, label, color }) => (
            <div key={key} className="flex items-center gap-2.5">
              <div className="relative flex items-center justify-center" style={{ width: 14, height: 14 }}>
                {key === "critical" && (
                  <span className="absolute inset-0 rounded-full opacity-40" style={{ backgroundColor: color, animation: "aqua-ping 1.8s cubic-bezier(0,0,0.2,1) infinite" }} />
                )}
                <span className="rounded-full" style={{ width: SEVERITY_RADIUS[key] * 1.4, height: SEVERITY_RADIUS[key] * 1.4, backgroundColor: color, display: "block", boxShadow: key === "critical" ? `0 0 6px ${color}` : undefined }} />
              </div>
              <span className="text-xs text-slate-300 font-medium">{label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Total count badge */}
      <div className="absolute top-[88px] right-4 z-[400] bg-slate-900/92 backdrop-blur border border-slate-800 rounded-xl px-3 py-2 shadow-xl">
        <div className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider">Active</div>
        <div className="text-xl font-black text-cyan-400 tabular-nums leading-none">
          {reports.filter(r => r.status !== "resolved" && r.status !== "rejected").length}
        </div>
      </div>
    </div>
  );
}
