import { useEffect, useRef, useState, useMemo } from "react";
import { MapContainer, TileLayer, CircleMarker, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import { Report, useGetDashboardSummary, useUpvoteReport, getListReportsQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { SEVERITY_COLORS, STATUS_COLORS, getBadgeTier, getBadgeColor, getNextTierInfo } from "@/lib/constants";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/contexts/LanguageContext";
import { motion, AnimatePresence } from "framer-motion";
import { format, formatDistanceToNow } from "date-fns";
import {
  Clock, ThumbsUp, Share2, ShieldCheck, X, User, MapPin,
  Activity, CheckCircle2, Droplets, Heart, TrendingDown, TrendingUp,
  Star, ChevronUp, AlertCircle,
} from "lucide-react";

// ── Haversine distance in km ──────────────────────────────────────────────────
function haversineKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a = Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// ── City Health Score ─────────────────────────────────────────────────────────
function computeHealthScore(reports: Report[]): number {
  const active = reports.filter(r => r.status !== "resolved" && r.status !== "rejected");
  const deduction = active.reduce((acc, r) => {
    if (r.severity === "critical") return acc + 8;
    if (r.severity === "high")     return acc + 4;
    if (r.severity === "medium")   return acc + 2;
    return acc + 1;
  }, 0);
  return Math.max(0, Math.min(100, 100 - deduction));
}

// ── Map updater ───────────────────────────────────────────────────────────────
function MapUpdater({ center }: { center: [number, number] }) {
  const map = useMap();
  useEffect(() => { map.setView(center, map.getZoom()); }, [center, map]);
  return null;
}

// ── Critical pin icon ─────────────────────────────────────────────────────────
function createCriticalIcon(color: string) {
  return L.divIcon({
    className: "leaflet-div-icon",
    html: `<div style="position:relative;width:22px;height:22px;display:flex;align-items:center;justify-content:center;">
      <div class="aqua-ping-ring" style="position:absolute;inset:-3px;border-radius:50%;background:${color};opacity:0.45;"></div>
      <div class="aqua-pulse-dot" style="width:14px;height:14px;border-radius:50%;background:${color};border:2.5px solid rgba(255,255,255,0.9);position:relative;z-index:1;box-shadow:0 0 8px ${color}cc;"></div>
    </div>`,
    iconSize: [22, 22], iconAnchor: [11, 11], popupAnchor: [0, -14],
  });
}

const SEVERITY_RADIUS: Record<string, number> = { critical: 11, high: 8, medium: 6, low: 4 };
const LEGEND = [
  { key: "critical", label: "Critical", color: SEVERITY_COLORS.critical },
  { key: "high",     label: "High",     color: SEVERITY_COLORS.high },
  { key: "medium",   label: "Medium",   color: SEVERITY_COLORS.medium },
  { key: "low",      label: "Low",      color: SEVERITY_COLORS.low },
];

// ── Nearby leaks alert hook ───────────────────────────────────────────────────
function useNearbyLeaksAlert(reports: Report[]) {
  const { toast } = useToast();
  const { t } = useLanguage();
  const userLocation = useRef<{ lat: number; lon: number } | null>(null);
  const alertedIds   = useRef<Set<number>>(new Set());
  const initialized  = useRef(false);

  useEffect(() => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      pos => { userLocation.current = { lat: pos.coords.latitude, lon: pos.coords.longitude }; },
      () => {}
    );
  }, []);

  useEffect(() => {
    // Skip first render to avoid alerting on page load
    if (!initialized.current) { initialized.current = true; return; }
    if (!userLocation.current) return;
    const { lat, lon } = userLocation.current;
    const active = reports.filter(r => r.status !== "resolved" && r.status !== "rejected");
    for (const report of active) {
      if (alertedIds.current.has(report.id)) continue;
      const dist = haversineKm(lat, lon, report.latitude, report.longitude);
      if (dist <= 2) {
        alertedIds.current.add(report.id);
        toast({
          title: `⚠️ ${t("nearbyAlert")}`,
          description: `${report.title} — ${report.ward} (${dist.toFixed(1)} km away)`,
        });
      }
    }
  }, [reports]);
}

// ── Stats Banner ──────────────────────────────────────────────────────────────
function StatsBanner() {
  const { t } = useLanguage();
  const { data: summary } = useGetDashboardSummary();
  if (!summary) return null;
  const items = [
    { label: t("totalReported"), value: summary.totalReports,        color: "#06b6d4", icon: Activity },
    { label: t("resolvedWeek"),  value: summary.resolvedThisWeek,    color: "#22c55e", icon: CheckCircle2 },
    { label: t("litresSaved"),   value: `${summary.nrwReductionEstimate}L`, color: "#3b82f6", icon: Droplets },
  ];
  return (
    <motion.div
      initial={{ opacity: 0, y: -16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.1 }}
      className="absolute top-4 left-1/2 -translate-x-1/2 z-[400] flex items-center bg-slate-900/95 backdrop-blur-lg border border-slate-800/80 rounded-2xl shadow-2xl divide-x divide-slate-800 overflow-hidden"
    >
      {items.map(({ label, value, color, icon: Icon }) => (
        <div key={label} className="flex items-center gap-2.5 px-4 py-3">
          <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0" style={{ backgroundColor: `${color}20` }}>
            <Icon className="w-3.5 h-3.5" style={{ color }} />
          </div>
          <div>
            <p className="text-[9px] font-semibold text-slate-500 leading-none uppercase tracking-wider">{label}</p>
            <div className="text-lg font-black text-slate-100 leading-none tabular-nums mt-0.5">{value}</div>
          </div>
        </div>
      ))}
    </motion.div>
  );
}

// ── City Health Score ─────────────────────────────────────────────────────────
function HealthScorePill({ score }: { score: number }) {
  const { t } = useLanguage();
  const color = score >= 80 ? "#22c55e" : score >= 55 ? "#eab308" : score >= 30 ? "#f97316" : "#ef4444";
  const label = score >= 80 ? "Good" : score >= 55 ? "Fair" : score >= 30 ? "Poor" : "Critical";
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: 0.3 }}
      className="absolute top-[84px] right-4 z-[400] bg-slate-900/95 backdrop-blur border border-slate-800 rounded-xl px-3 py-2 shadow-xl flex items-center gap-2"
    >
      <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ backgroundColor: `${color}20`, border: `1px solid ${color}40` }}>
        <Heart className="w-3.5 h-3.5" style={{ color }} />
      </div>
      <div>
        <div className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">{t("cityHealth")}</div>
        <div className="flex items-baseline gap-1">
          <span className="text-lg font-black tabular-nums leading-none" style={{ color }}>{score}</span>
          <span className="text-[9px] text-slate-600">/100</span>
          <span className="text-[10px] font-bold ml-1" style={{ color }}>{label}</span>
        </div>
      </div>
    </motion.div>
  );
}

// ── Report Popup Content ──────────────────────────────────────────────────────
function ReportPopupContent({ report }: { report: Report }) {
  const { toast } = useToast();
  const { t } = useLanguage();
  const queryClient = useQueryClient();
  const color = SEVERITY_COLORS[report.severity as keyof typeof SEVERITY_COLORS] || SEVERITY_COLORS.low;
  const statusColor = STATUS_COLORS[report.status as keyof typeof STATUS_COLORS];

  const [upvoteCount, setUpvoteCount] = useState(report.upvotes);
  const [hasVoted, setHasVoted] = useState(() => {
    try {
      const voted: number[] = JSON.parse(localStorage.getItem("aquaalert_upvoted") ?? "[]");
      return voted.includes(report.id);
    } catch { return false; }
  });

  const upvoteMutation = useUpvoteReport({
    mutation: {
      onSuccess: (data) => {
        setUpvoteCount(data.upvotes);
        const voted: number[] = JSON.parse(localStorage.getItem("aquaalert_upvoted") ?? "[]");
        localStorage.setItem("aquaalert_upvoted", JSON.stringify([...voted, report.id]));
        setHasVoted(true);
        queryClient.invalidateQueries({ queryKey: getListReportsQueryKey() });
        toast({ title: "Upvoted!", description: "Report marked as urgent. Thank you." });
      },
      onError: () => toast({ title: "Upvote failed", description: "Please try again.", variant: "destructive" }),
    },
  });

  const handleUpvote = () => {
    if (hasVoted || upvoteMutation.isPending) return;
    setUpvoteCount(c => c + 1);
    upvoteMutation.mutate({ id: report.id });
  };

  const handleWhatsApp = () => {
    const msg = `🚨 Water Leak Reported!\n📍 Location: ${report.ward}, Mumbai\n⚠️ Severity: ${report.severity.toUpperCase()}\n📝 ${report.description ?? report.title}\n✅ Status: ${report.status.replace("_", " ").toUpperCase()}\n\nReported via AquaAlert Mumbai.`;
    const isMobile = /Android|iPhone|iPad/i.test(navigator.userAgent);
    const url = isMobile
      ? `whatsapp://send?text=${encodeURIComponent(msg)}`
      : `https://web.whatsapp.com/send?text=${encodeURIComponent(msg)}`;
    window.open(url, "_blank", "noopener,noreferrer");
  };

  const isVerified = upvoteCount >= 3;

  return (
    <div className="min-w-[240px] text-slate-100 font-sans">
      {/* Severity + Status header */}
      <div className="px-4 py-3 border-b border-slate-800 flex justify-between items-center gap-3">
        <Badge variant="outline" style={{ color, borderColor: `${color}60`, backgroundColor: `${color}15` }}
          className="text-[10px] font-bold uppercase tracking-wide">
          {report.severity}
        </Badge>
        <span className="text-[10px] font-semibold flex items-center gap-1" style={{ color: statusColor }}>
          <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: statusColor }} />
          {report.status.replace("_", " ").toUpperCase()}
        </span>
      </div>

      <div className="px-4 py-3 space-y-2.5">
        {/* Community Verified badge */}
        {isVerified && (
          <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
            className="flex items-center gap-1.5 px-2.5 py-1.5 bg-green-950/40 border border-green-900/50 rounded-lg">
            <ShieldCheck className="w-3.5 h-3.5 text-green-400 flex-shrink-0" />
            <span className="text-[11px] font-bold text-green-400">{t("communityVerified")}</span>
          </motion.div>
        )}

        {/* Photo */}
        {report.imageUrl && (
          <div className="rounded-xl overflow-hidden border border-slate-800">
            <img src={report.imageUrl} alt="Report photo" className="w-full h-28 object-cover" />
          </div>
        )}

        <h4 className="font-bold text-slate-100 text-sm leading-snug">{report.title}</h4>
        {report.description && (
          <p className="text-xs text-slate-400 leading-relaxed line-clamp-2">{report.description}</p>
        )}

        <div className="flex items-center text-xs text-slate-500 gap-3">
          <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{report.ward}</span>
          <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{formatDistanceToNow(new Date(report.createdAt), { addSuffix: true })}</span>
        </div>

        {/* Upvote count + bar */}
        <div className="flex items-center gap-2">
          <div className="flex-1 h-1.5 bg-slate-800 rounded-full overflow-hidden">
            <div className="h-full rounded-full transition-all duration-500"
              style={{ width: `${Math.min(100, upvoteCount * 15)}%`, backgroundColor: isVerified ? "#22c55e" : color }} />
          </div>
          <span className="text-[11px] font-bold tabular-nums" style={{ color: isVerified ? "#22c55e" : "#94a3b8" }}>
            ▲ {upvoteCount} {isVerified ? "✓" : ""}
          </span>
        </div>

        {/* Action buttons */}
        <div className="grid grid-cols-2 gap-2 pt-1">
          <button
            onClick={handleUpvote}
            disabled={hasVoted || upvoteMutation.isPending}
            className={`flex items-center justify-center gap-1.5 py-2 rounded-xl text-[11px] font-bold transition-all border ${
              hasVoted
                ? "bg-green-950/40 border-green-900/50 text-green-400 cursor-default"
                : "bg-cyan-950/60 hover:bg-cyan-900/60 border-cyan-900/50 text-cyan-400 cursor-pointer hover:border-cyan-700"
            }`}
          >
            <ThumbsUp className="w-3 h-3" />
            {hasVoted ? t("upvoted") : t("upvote")}
          </button>

          <button
            onClick={handleWhatsApp}
            className="flex items-center justify-center gap-1.5 py-2 rounded-xl text-[11px] font-bold bg-green-950/40 hover:bg-green-900/50 border border-green-900/50 hover:border-green-700 text-green-400 transition-all cursor-pointer"
          >
            <Share2 className="w-3 h-3" />
            WhatsApp
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Profile Panel ─────────────────────────────────────────────────────────────
function ProfilePanel({ open, onClose, reports }: { open: boolean; onClose: () => void; reports: Report[] }) {
  const { t } = useLanguage();
  const [name, setName] = useState(() => localStorage.getItem("aquaalert_reporter_name") ?? "");
  const [inputName, setInputName] = useState(name);
  const memberSince = localStorage.getItem("aquaalert_member_since") ?? new Date().toISOString();

  const myReports = useMemo(() =>
    reports.filter(r => r.reporterName && r.reporterName.toLowerCase() === name.toLowerCase()),
    [reports, name]
  );

  const ecoPoints        = myReports.length * 10;
  const reportsSubmitted = myReports.length;
  const reportsResolved  = myReports.filter(r => r.status === "resolved").length;
  const reportsVerified  = myReports.filter(r => r.upvotes >= 3).length;
  const tier             = getBadgeTier(ecoPoints);
  const tierColor        = getBadgeColor(tier);
  const nextTier         = getNextTierInfo(ecoPoints);

  const saveName = () => {
    const trimmed = inputName.trim();
    if (!trimmed) return;
    localStorage.setItem("aquaalert_reporter_name", trimmed);
    if (!localStorage.getItem("aquaalert_member_since")) {
      localStorage.setItem("aquaalert_member_since", new Date().toISOString());
    }
    setName(trimmed);
  };

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 z-[450] bg-black/40 backdrop-blur-sm"
          />
          {/* Panel */}
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 28, stiffness: 260 }}
            className="absolute right-0 top-0 bottom-0 w-80 z-[460] bg-slate-900 border-l border-slate-800 flex flex-col shadow-2xl"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800 flex-shrink-0">
              <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                <User className="w-4 h-4 text-cyan-400" /> {t("profile")}
              </h3>
              <button onClick={onClose} className="w-7 h-7 rounded-lg bg-slate-800 hover:bg-slate-700 flex items-center justify-center transition-colors">
                <X className="w-3.5 h-3.5 text-slate-400" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto">
              {!name ? (
                /* No name set — prompt */
                <div className="p-6 space-y-4">
                  <div className="w-16 h-16 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center mx-auto">
                    <User className="w-8 h-8 text-slate-500" />
                  </div>
                  <div className="text-center">
                    <h4 className="font-bold text-slate-200 mb-1">{t("setYourName")}</h4>
                    <p className="text-xs text-slate-500 leading-relaxed">{t("setNameDesc")}</p>
                  </div>
                  <input
                    type="text"
                    value={inputName}
                    onChange={e => setInputName(e.target.value)}
                    onKeyDown={e => e.key === "Enter" && saveName()}
                    placeholder="Your name…"
                    className="w-full bg-slate-950 border border-slate-800 text-slate-100 rounded-xl h-11 px-4 text-sm focus:border-cyan-600 focus:outline-none"
                  />
                  <button onClick={saveName}
                    className="w-full bg-cyan-600 hover:bg-cyan-500 text-white font-bold py-2.5 rounded-xl text-sm transition-colors">
                    {t("save")}
                  </button>
                </div>
              ) : (
                <div className="p-5 space-y-5">
                  {/* Avatar + identity */}
                  <div className="text-center">
                    <div className="w-16 h-16 rounded-full bg-gradient-to-br from-cyan-500/20 to-blue-500/20 border-2 border-cyan-500/40 flex items-center justify-center mx-auto mb-3 shadow-[0_0_24px_rgba(6,182,212,0.3)]">
                      <span className="text-2xl font-black text-cyan-300">{name.substring(0, 1).toUpperCase()}</span>
                    </div>
                    <h4 className="font-black text-slate-100 text-base mb-1">{name}</h4>
                    <span className={`text-[11px] font-black px-3 py-1 rounded-full ${tierColor}`}>{tier}</span>
                    <div className="text-[11px] text-slate-600 mt-2 flex items-center justify-center gap-1">
                      <Clock className="w-3 h-3" />
                      Member since {format(new Date(memberSince), "MMM yyyy")}
                    </div>
                  </div>

                  {/* Eco Points + progress */}
                  <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-semibold text-slate-400">{t("ecoPoints")}</span>
                      <span className="text-2xl font-black text-cyan-400 tabular-nums">{ecoPoints}</span>
                    </div>
                    {nextTier.tier !== "Max" && (
                      <>
                        <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden mb-1">
                          <motion.div className="h-full bg-cyan-500 rounded-full"
                            initial={{ width: 0 }}
                            animate={{ width: `${nextTier.pct}%` }}
                            transition={{ duration: 0.8, ease: "easeOut" }} />
                        </div>
                        <div className="text-[10px] text-slate-600 flex items-center gap-1">
                          <ChevronUp className="w-3 h-3" />{nextTier.needed} pts to {nextTier.tier}
                        </div>
                      </>
                    )}
                  </div>

                  {/* Stats grid */}
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { label: t("reportsSubmitted"), value: reportsSubmitted, color: "#06b6d4" },
                      { label: t("reportsResolved"),  value: reportsResolved,  color: "#22c55e" },
                      { label: t("reportsVerified"),  value: reportsVerified,  color: "#a855f7" },
                    ].map(({ label, value, color }) => (
                      <div key={label} className="text-center p-2.5 bg-slate-950/50 border border-slate-800/60 rounded-xl">
                        <div className="text-xl font-black tabular-nums" style={{ color }}>{value}</div>
                        <div className="text-[9px] text-slate-600 mt-0.5 leading-tight">{label}</div>
                      </div>
                    ))}
                  </div>

                  {/* Change name */}
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Update Name</label>
                    <div className="flex gap-2">
                      <input type="text" value={inputName} onChange={e => setInputName(e.target.value)}
                        onKeyDown={e => e.key === "Enter" && saveName()}
                        className="flex-1 bg-slate-950 border border-slate-800 text-slate-200 rounded-xl h-9 px-3 text-sm focus:border-cyan-600 focus:outline-none"
                      />
                      <button onClick={saveName}
                        className="px-3 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold transition-colors border border-slate-700">
                        {t("save")}
                      </button>
                    </div>
                  </div>

                  {/* My reports history */}
                  <div className="space-y-2">
                    <h5 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{t("myActivity")}</h5>
                    {myReports.length === 0 ? (
                      <div className="text-center py-6 text-slate-600 text-xs">{t("noReportsYet")}</div>
                    ) : (
                      <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                        {myReports.slice(0, 15).map(r => {
                          const sevColor  = SEVERITY_COLORS[r.severity as keyof typeof SEVERITY_COLORS];
                          const statColor = STATUS_COLORS[r.status as keyof typeof STATUS_COLORS];
                          return (
                            <div key={r.id} className="p-3 bg-slate-950/60 border border-slate-800/60 rounded-xl">
                              <div className="flex items-start justify-between gap-2 mb-1">
                                <span className="text-xs font-semibold text-slate-200 leading-tight line-clamp-1 flex-1">{r.title}</span>
                                <span className="text-[10px] font-bold flex-shrink-0" style={{ color: statColor }}>
                                  ● {r.status.replace("_", " ")}
                                </span>
                              </div>
                              <div className="flex items-center gap-2 text-[10px] text-slate-600">
                                <span style={{ color: sevColor }}>■ {r.severity}</span>
                                <span>{r.ward}</span>
                                <span className="ml-auto">{formatDistanceToNow(new Date(r.createdAt), { addSuffix: true })}</span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

// ── Main LiveMap ──────────────────────────────────────────────────────────────
interface LiveMapProps {
  reports: Report[];
  center?: [number, number];
  zoom?: number;
}

export default function LiveMap({ reports, center = [19.076, 72.877], zoom = 12 }: LiveMapProps) {
  const [profileOpen, setProfileOpen] = useState(false);
  const { t } = useLanguage();

  const activeReports = useMemo(
    () => reports.filter(r => r.status !== "resolved" && r.status !== "rejected"),
    [reports]
  );
  const healthScore = useMemo(() => computeHealthScore(reports), [reports]);

  useNearbyLeaksAlert(reports);

  return (
    <div className="relative w-full h-full">

      {/* ── Stats Banner ── */}
      <StatsBanner />

      {/* ── City Health Score ── */}
      <HealthScorePill score={healthScore} />

      {/* ── Profile Avatar Button ── */}
      <motion.button
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.4 }}
        onClick={() => setProfileOpen(true)}
        className="absolute top-[148px] right-4 z-[400] w-10 h-10 bg-slate-900/95 backdrop-blur border border-slate-800 rounded-full flex items-center justify-center hover:border-cyan-700 hover:bg-slate-800 transition-all shadow-xl group"
        title="My Profile"
      >
        <User className="w-4.5 h-4.5 text-slate-400 group-hover:text-cyan-400 transition-colors" style={{ width: 18, height: 18 }} />
      </motion.button>

      {/* ── Active count badge ── */}
      <div className="absolute top-[196px] right-4 z-[400] bg-slate-900/95 backdrop-blur border border-slate-800 rounded-xl px-3 py-2 shadow-xl">
        <div className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider">Active</div>
        <div className="text-xl font-black text-cyan-400 tabular-nums leading-none">{activeReports.length}</div>
      </div>

      {/* ── Leaflet Map ── */}
      <MapContainer center={center} zoom={zoom} className="w-full h-full z-0" zoomControl={false}>
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
        />
        <MapUpdater center={center} />

        {activeReports.map((report) => {
          const color = SEVERITY_COLORS[report.severity as keyof typeof SEVERITY_COLORS] || SEVERITY_COLORS.low;
          const popup = (
            <Popup minWidth={240} className="aqua-popup">
              <ReportPopupContent report={report} />
            </Popup>
          );

          if (report.severity === "critical") {
            return (
              <Marker key={report.id} position={[report.latitude, report.longitude]} icon={createCriticalIcon(color)}>
                {popup}
              </Marker>
            );
          }
          return (
            <CircleMarker key={report.id}
              center={[report.latitude, report.longitude]}
              radius={SEVERITY_RADIUS[report.severity] ?? 6}
              pathOptions={{ color, fillColor: color, fillOpacity: 0.75, weight: 1.5 }}>
              {popup}
            </CircleMarker>
          );
        })}
      </MapContainer>

      {/* ── Severity Legend ── */}
      <div className="absolute bottom-6 left-4 z-[400] bg-slate-900/95 backdrop-blur border border-slate-800 rounded-2xl px-4 py-3 shadow-2xl">
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

      {/* ── Profile Panel (outside map, but inside outer div) ── */}
      <ProfilePanel open={profileOpen} onClose={() => setProfileOpen(false)} reports={reports} />
    </div>
  );
}
