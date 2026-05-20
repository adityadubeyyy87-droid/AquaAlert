import { useEffect } from "react";
import { MapContainer, TileLayer, CircleMarker, Popup, useMap } from "react-leaflet";
import { Link } from "wouter";
import { Report } from "@workspace/api-client-react";
import { SEVERITY_COLORS, STATUS_COLORS } from "@/lib/constants";
import { Badge } from "@/components/ui/badge";
import { Droplet, ExternalLink } from "lucide-react";

function MapUpdater({ center }: { center: [number, number] }) {
  const map = useMap();
  useEffect(() => {
    map.setView(center, map.getZoom());
  }, [center, map]);
  return null;
}

interface LiveMapProps {
  reports: Report[];
  center?: [number, number];
  zoom?: number;
}

export default function LiveMap({ reports, center = [19.076, 72.877], zoom = 12 }: LiveMapProps) {
  return (
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
      
      {reports.map((report) => (
        <CircleMarker
          key={report.id}
          center={[report.latitude, report.longitude]}
          radius={report.severity === "critical" ? 12 : report.severity === "high" ? 9 : report.severity === "medium" ? 7 : 5}
          pathOptions={{
            color: SEVERITY_COLORS[report.severity as keyof typeof SEVERITY_COLORS] || SEVERITY_COLORS.low,
            fillColor: SEVERITY_COLORS[report.severity as keyof typeof SEVERITY_COLORS] || SEVERITY_COLORS.low,
            fillOpacity: 0.6,
            weight: 2,
          }}
        >
          <Popup className="bg-slate-900 border-slate-800 text-slate-100 rounded-lg overflow-hidden p-0">
            <div className="p-3 bg-slate-900 min-w-[200px]">
              <div className="flex justify-between items-start mb-2">
                <Badge variant="outline" style={{ color: SEVERITY_COLORS[report.severity as keyof typeof SEVERITY_COLORS], borderColor: SEVERITY_COLORS[report.severity as keyof typeof SEVERITY_COLORS] }}>
                  {report.severity.toUpperCase()}
                </Badge>
                <Badge variant="outline" style={{ color: STATUS_COLORS[report.status as keyof typeof STATUS_COLORS], borderColor: STATUS_COLORS[report.status as keyof typeof STATUS_COLORS] }}>
                  {report.status.replace("_", " ").toUpperCase()}
                </Badge>
              </div>
              <h4 className="font-semibold text-slate-100 mb-1 leading-tight">{report.title}</h4>
              <p className="text-xs text-slate-400 mb-3 truncate">{report.ward}</p>
              
              <Link href={`/reports/${report.id}`}>
                <div className="w-full flex items-center justify-center py-1.5 bg-slate-800 hover:bg-slate-700 rounded text-xs font-medium text-cyan-400 cursor-pointer transition-colors">
                  View Details
                  <ExternalLink className="w-3 h-3 ml-1.5" />
                </div>
              </Link>
            </div>
          </Popup>
        </CircleMarker>
      ))}
    </MapContainer>
  );
}
