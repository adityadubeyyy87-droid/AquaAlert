import { useState, useMemo, useEffect, useRef } from "react";
import {
  useListReports, useUpdateReport, useGetDashboardSummary, useListWards, useListUsers,
  useGetSeverityBreakdown, useGetStatusBreakdown, useGetRecentActivity,
  Report, ReportUpdateStatus,
  getListReportsQueryKey, getGetDashboardSummaryQueryKey, getGetRecentActivityQueryKey,
  getGetSeverityBreakdownQueryKey, getGetStatusBreakdownQueryKey, getListWardsQueryKey,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { format, formatDistanceToNow, subDays } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";
import { useCountUp } from "@/hooks/use-count-up";
import { SEVERITY_COLORS, STATUS_COLORS, getBadgeTier, getBadgeColor, getNextTierInfo } from "@/lib/constants";
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip as RechartsTooltip,
  Cell, PieChart, Pie, Legend, AreaChart, Area, CartesianGrid,
} from "recharts";
import {
  Shield, LogOut, Droplet, AlertCircle, CheckCircle2, Clock, MapPin, Search,
  RefreshCw, ChevronDown, Activity, Zap, Droplets, AlertTriangle, CheckCircle,
  TrendingUp, List, BarChart2, Trophy, Download, Thermometer,
  ChevronUp, Star, Flame, Phone, Mail, Users, BookOpen, Building2,
  Radio, ArrowUpRight,
} from "lucide-react";

const ADMIN_ID       = "Aditya@1234";
const ADMIN_PASSWORD = "55";
const SESSION_KEY    = "aquaalert_admin_session";

const STATUS_OPTIONS   = ["pending", "verified", "in_progress", "resolved", "rejected"] as const;
const SEVERITY_OPTIONS = ["critical", "high", "medium", "low"] as const;

const CHART_STYLE = {
  backgroundColor: "#0f172a", borderColor: "#1e293b", borderRadius: "10px",
  color: "#f1f5f9", fontSize: "12px", boxShadow: "0 8px 24px rgba(0,0,0,0.5)",
};

const TABS = [
  { key: "overview",    label: "Overview",      icon: BarChart2   },
  { key: "reports",     label: "All Reports",   icon: List        },
  { key: "heatmap",     label: "Heatmap",       icon: Thermometer },
  { key: "leaderboard", label: "Leaderboard",   icon: Trophy      },
  { key: "directory",   label: "Directory",     icon: BookOpen    },
  { key: "export",      label: "Export CSV",    icon: Download    },
] as const;
type Tab = typeof TABS[number]["key"];

function fmt(s: string) { return s.replace(/_/g, " ").replace(/\b\w/g, l => l.toUpperCase()); }

function AnimatedStat({ value, suffix = "" }: { value: number; suffix?: string }) {
  const animated = useCountUp(value);
  return <span>{animated}{suffix}</span>;
}

function SeverityBadge({ severity }: { severity: string }) {
  const color = SEVERITY_COLORS[severity as keyof typeof SEVERITY_COLORS] ?? "#94a3b8";
  return (
    <Badge variant="outline" className="text-[10px] font-bold px-2 py-0.5 uppercase tracking-wide"
      style={{ color, borderColor: `${color}50`, backgroundColor: `${color}10` }}>
      {severity}
    </Badge>
  );
}

function StatusBadge({ status }: { status: string }) {
  const color = STATUS_COLORS[status as keyof typeof STATUS_COLORS] ?? "#94a3b8";
  return (
    <div className="inline-flex items-center gap-1.5">
      <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ backgroundColor: color, boxShadow: `0 0 4px ${color}80` }} />
      <span className="text-xs font-semibold" style={{ color }}>{fmt(status)}</span>
    </div>
  );
}

// ── LOGIN ─────────────────────────────────────────────────────────────────────

function LoginScreen({ onLogin }: { onLogin: () => void }) {
  const [adminId, setAdminId]   = useState("");
  const [password, setPassword] = useState("");
  const [error, setError]       = useState("");
  const [loading, setLoading]   = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true); setError("");
    setTimeout(() => {
      if (adminId === ADMIN_ID && password === ADMIN_PASSWORD) {
        sessionStorage.setItem(SESSION_KEY, "true");
        onLogin();
      } else {
        setError("Invalid Admin ID or Password. Please try again.");
      }
      setLoading(false);
    }, 600);
  };

  return (
    <div className="h-full w-full flex items-center justify-center bg-slate-950 p-6">
      <motion.div
        initial={{ opacity: 0, y: 24, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.35, ease: [0.4, 0, 0.2, 1] }}
        className="w-full max-w-sm"
      >
        <div className="text-center mb-8">
          <div className="inline-flex w-16 h-16 rounded-2xl bg-cyan-500/10 border border-cyan-500/25 items-center justify-center mb-5 shadow-[0_0_40px_rgba(6,182,212,0.2)]">
            <Shield className="w-8 h-8 text-cyan-400" />
          </div>
          <h1 className="text-2xl font-black text-slate-100 mb-1">Municipal Portal</h1>
          <p className="text-sm text-slate-500">Brihanmumbai Municipal Corporation</p>
          <div className="inline-flex items-center gap-2 mt-3 px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-xs text-slate-500">
            <Droplet className="w-3.5 h-3.5 text-cyan-500" />
            AquaAlert Water Leak Management System
          </div>
        </div>
        <Card className="bg-slate-900 border-slate-800 shadow-2xl">
          <CardContent className="p-8">
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Admin ID</label>
                <Input type="text" value={adminId} onChange={e => setAdminId(e.target.value)}
                  placeholder="Enter your Admin ID"
                  className="bg-slate-950 border-slate-800 text-slate-100 focus:border-cyan-600 rounded-xl h-11 font-mono tracking-wider"
                  autoComplete="username" required />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Password</label>
                <Input type="password" value={password} onChange={e => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  className="bg-slate-950 border-slate-800 text-slate-100 focus:border-cyan-600 rounded-xl h-11"
                  autoComplete="current-password" required />
              </div>
              <AnimatePresence>
                {error && (
                  <motion.div initial={{ opacity: 0, y: -6, height: 0 }} animate={{ opacity: 1, y: 0, height: "auto" }}
                    exit={{ opacity: 0, y: -6, height: 0 }}
                    className="flex items-center gap-2 px-3 py-2.5 bg-red-950/40 border border-red-900/50 rounded-xl text-sm text-red-400">
                    <AlertCircle className="w-4 h-4 flex-shrink-0" />{error}
                  </motion.div>
                )}
              </AnimatePresence>
              <Button type="submit" disabled={loading}
                className="w-full h-11 bg-cyan-600 hover:bg-cyan-500 text-white font-bold rounded-xl shadow-[0_0_20px_rgba(6,182,212,0.3)] hover:shadow-[0_0_28px_rgba(6,182,212,0.5)] transition-all">
                {loading
                  ? <span className="flex items-center gap-2"><RefreshCw className="w-4 h-4 animate-spin" />Authenticating…</span>
                  : <span className="flex items-center gap-2"><Shield className="w-4 h-4" />Sign In to Dashboard</span>}
              </Button>
            </form>
          </CardContent>
        </Card>
        <p className="text-center text-xs text-slate-700 mt-5">Authorised BMC personnel only · AquaAlert v2.0</p>
      </motion.div>
    </div>
  );
}

// ── LIVE FEED PANEL ───────────────────────────────────────────────────────────

function LiveFeedPanel() {
  const { data: activity, isLoading, dataUpdatedAt } = useGetRecentActivity(
    { limit: 40 },
    { query: { refetchInterval: 15_000 } }
  );
  const { data: reports } = useListReports(undefined, { query: { refetchInterval: 15_000 } });

  const feedRef      = useRef<HTMLDivElement>(null);
  const prevCount    = useRef(0);
  const [newCount, setNewCount] = useState(0);
  const [lastRefresh, setLastRefresh] = useState(new Date());

  // Detect new arrivals and flash the counter
  useEffect(() => {
    if (!activity) return;
    const curr = activity.length;
    if (prevCount.current > 0 && curr > prevCount.current) {
      setNewCount(curr - prevCount.current);
      setTimeout(() => setNewCount(0), 4000);
    }
    prevCount.current = curr;
    setLastRefresh(new Date());
  }, [activity]);

  // Merge: all reports sorted newest-first
  const feed = useMemo(() => {
    const base = activity ?? [];
    return [...base].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [activity]);

  // Count by status from live reports
  const statusCounts = useMemo(() => {
    const all = reports ?? [];
    return {
      pending:     all.filter(r => r.status === "pending").length,
      in_progress: all.filter(r => r.status === "in_progress").length,
      resolved:    all.filter(r => r.status === "resolved").length,
    };
  }, [reports]);

  return (
    <div className="flex flex-col h-full bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
      {/* Header */}
      <div className="px-5 py-4 border-b border-slate-800 flex-shrink-0">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-green-500" />
            </span>
            <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
              <Radio className="w-3.5 h-3.5 text-cyan-400" />
              Live Feed
            </h3>
          </div>
          <div className="flex items-center gap-2">
            {newCount > 0 && (
              <motion.span
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0, opacity: 0 }}
                className="text-[10px] font-bold bg-cyan-600 text-white px-2 py-0.5 rounded-full"
              >
                +{newCount} new
              </motion.span>
            )}
            <span className="text-[10px] font-semibold bg-cyan-950/60 text-cyan-400 border border-cyan-900/50 px-2 py-0.5 rounded-full">
              {feed.length} total
            </span>
          </div>
        </div>

        {/* Live status counters */}
        <div className="grid grid-cols-3 gap-2">
          {[
            { label: "Pending",     count: statusCounts.pending,     color: "#f59e0b" },
            { label: "In Progress", count: statusCounts.in_progress, color: "#3b82f6" },
            { label: "Resolved",    count: statusCounts.resolved,    color: "#22c55e" },
          ].map(({ label, count, color }) => (
            <div key={label} className="text-center px-2 py-1.5 rounded-xl bg-slate-950/60 border border-slate-800/60">
              <div className="text-base font-black tabular-nums" style={{ color }}>{count}</div>
              <div className="text-[9px] text-slate-600 leading-none mt-0.5">{label}</div>
            </div>
          ))}
        </div>

        {/* Refresh indicator */}
        <div className="mt-2 flex items-center gap-1.5 text-[10px] text-slate-600">
          <RefreshCw className="w-3 h-3" />
          Auto-refreshes every 15 s · Last: {format(lastRefresh, "HH:mm:ss")}
        </div>
      </div>

      {/* Feed items */}
      <div ref={feedRef} className="flex-1 overflow-y-auto p-3 space-y-2">
        {isLoading ? (
          Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="p-3 rounded-xl border border-slate-800 flex gap-3">
              <Skeleton className="w-2 h-2 rounded-full mt-1.5 flex-shrink-0" />
              <div className="space-y-2 flex-1">
                <Skeleton className="h-3.5 w-3/4" />
                <Skeleton className="h-3 w-1/2" />
              </div>
            </div>
          ))
        ) : feed.length === 0 ? (
          <div className="text-center py-16 text-slate-600">
            <Radio className="w-8 h-8 mx-auto mb-3 opacity-20" />
            <p className="text-sm text-slate-500">No reports yet</p>
          </div>
        ) : (
          feed.map((report, i) => {
            const sevColor  = SEVERITY_COLORS[report.severity as keyof typeof SEVERITY_COLORS];
            const statColor = STATUS_COLORS[report.status as keyof typeof STATUS_COLORS];
            const isCrit    = report.severity === "critical" && report.status !== "resolved";
            return (
              <motion.div
                key={report.id}
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: Math.min(i * 0.025, 0.5), duration: 0.2 }}
                className={`p-3 rounded-xl border transition-colors ${
                  isCrit
                    ? "border-red-900/40 bg-red-950/10"
                    : report.status === "resolved"
                    ? "border-green-900/30 bg-green-950/8"
                    : "border-slate-800/60 bg-slate-950/40"
                }`}
              >
                <div className="flex items-start justify-between gap-2 mb-1.5">
                  <div className="flex items-center gap-1.5 flex-1 min-w-0">
                    <span className="w-2 h-2 rounded-full flex-shrink-0 mt-0.5" style={{
                      backgroundColor: sevColor,
                      boxShadow: isCrit ? `0 0 6px ${sevColor}` : undefined,
                    }} />
                    <h4 className="text-[13px] font-semibold text-slate-200 truncate leading-snug">
                      {report.title}
                    </h4>
                  </div>
                  <span className="text-[10px] font-mono text-slate-600 flex-shrink-0">#{report.id.toString().padStart(4, "0")}</span>
                </div>

                <div className="flex items-center justify-between pl-3.5 mb-1.5">
                  <div className="flex items-center text-[11px] text-slate-500 gap-1">
                    <MapPin className="w-3 h-3" /><span className="truncate">{report.ward}</span>
                  </div>
                  <span className="text-[10px] text-slate-600 flex-shrink-0">
                    {formatDistanceToNow(new Date(report.createdAt), { addSuffix: true })}
                  </span>
                </div>

                <div className="pl-3.5 flex items-center gap-2 flex-wrap">
                  <Badge variant="outline" className="text-[9px] px-1.5 py-0 h-4 font-bold flex-shrink-0"
                    style={{ color: sevColor, borderColor: `${sevColor}40` }}>
                    {report.severity.toUpperCase()}
                  </Badge>
                  <span className="text-[10px] flex items-center gap-1 flex-shrink-0" style={{ color: statColor }}>
                    <span className="w-1.5 h-1.5 rounded-full inline-block" style={{ backgroundColor: statColor }} />
                    {fmt(report.status)}
                  </span>
                  {report.reporterName && (
                    <span className="text-[10px] text-slate-600 truncate">by {report.reporterName}</span>
                  )}
                  <span className="text-[10px] text-slate-700 ml-auto flex-shrink-0">▲ {report.upvotes}</span>
                </div>
              </motion.div>
            );
          })
        )}
      </div>
    </div>
  );
}

// ── TAB: OVERVIEW ─────────────────────────────────────────────────────────────

function OverviewTab() {
  const { data: summary, isLoading: isSummaryLoading } = useGetDashboardSummary(
    undefined,
    { query: { refetchInterval: 15_000 } }
  );
  const { data: wards, isLoading: isWardsLoading } = useListWards(
    undefined,
    { query: { refetchInterval: 15_000 } }
  );
  const { data: severityStats } = useGetSeverityBreakdown(
    undefined,
    { query: { refetchInterval: 15_000 } }
  );
  const { data: statusStats } = useGetStatusBreakdown(
    undefined,
    { query: { refetchInterval: 15_000 } }
  );
  const { data: allReports } = useListReports(
    undefined,
    { query: { refetchInterval: 15_000 } }
  );

  const trendData = useMemo(() => Array.from({ length: 7 }, (_, i) => {
    const d = subDays(new Date(), 6 - i);
    const dayStr = d.toDateString();
    const dayReports = (allReports ?? []).filter(r => new Date(r.createdAt).toDateString() === dayStr);
    return {
      day: format(d, "EEE"),
      reports: dayReports.length,
      critical: dayReports.filter(r => r.severity === "critical").length,
    };
  }), [allReports]);

  const severityData = (severityStats ?? []).map(s => ({
    name: s.severity.charAt(0).toUpperCase() + s.severity.slice(1),
    count: s.count,
    color: SEVERITY_COLORS[s.severity as keyof typeof SEVERITY_COLORS] ?? SEVERITY_COLORS.low,
  }));

  const statusData = (statusStats ?? []).map(s => ({
    name: fmt(s.status),
    value: s.count,
    color: STATUS_COLORS[s.status as keyof typeof STATUS_COLORS] ?? STATUS_COLORS.pending,
  }));

  const maxWardCritical = Math.max(1, ...(wards ?? []).map(w => w.criticalReports));
  const sk = <Skeleton className="h-10 w-16" />;

  const statCards = [
    { title: "Total Reports",   value: summary?.totalReports,        icon: Activity,      color: "text-slate-300",  bg: "bg-slate-800/80",    tag: "All submitted" },
    { title: "Pending",         value: summary?.pendingReports,      icon: Clock,         color: "text-amber-400",  bg: "bg-amber-950/60",    tag: "Awaiting action" },
    { title: "In Progress",     value: summary?.inProgressReports,   icon: Droplets,      color: "text-blue-400",   bg: "bg-blue-950/60",     tag: "Teams dispatched" },
    { title: "Resolved Today",  value: summary?.resolvedToday,       icon: CheckCircle,   color: "text-green-400",  bg: "bg-green-950/60",    tag: format(new Date(), "d MMM") },
    { title: "Avg Resolution",  value: summary?.avgResolutionHours,  icon: TrendingUp,    color: "text-purple-400", bg: "bg-purple-950/60",   tag: "hours per report", suffix: "h" },
    { title: "Critical Active", value: summary?.criticalReports,     icon: AlertTriangle, color: "text-red-400",    bg: "bg-red-950/60",      tag: "Immediate dispatch", urgent: true },
  ];

  const cv = {
    hidden: { opacity: 0, y: 14 },
    visible: (i: number) => ({ opacity: 1, y: 0, transition: { delay: i * 0.06, duration: 0.25 } }),
  };

  return (
    <div className="grid grid-cols-1 xl:grid-cols-[1fr_340px] gap-6 h-full">
      {/* ── Left: analytics column ── */}
      <div className="space-y-6 min-w-0">
        {/* Stat cards */}
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
          {statCards.map((s, i) => (
            <motion.div key={s.title} custom={i} variants={cv} initial="hidden" animate="visible">
              <Card className={`bg-slate-900 border-slate-800 relative overflow-hidden h-full ${s.urgent ? "border-red-900/60 shadow-[0_0_20px_rgba(239,68,68,0.08)]" : ""}`}>
                {s.urgent && (summary?.criticalReports ?? 0) > 0 && (
                  <span className="absolute top-3 right-3 flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500" />
                  </span>
                )}
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-3">
                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest leading-tight">{s.title}</p>
                    <div className={`p-2 rounded-xl flex-shrink-0 ${s.bg} ${s.color}`}>
                      <s.icon className="w-3.5 h-3.5" />
                    </div>
                  </div>
                  <div className={`text-3xl font-black tabular-nums mb-1 ${s.color}`}>
                    {isSummaryLoading || s.value === undefined ? sk : <AnimatedStat value={s.value} suffix={(s as any).suffix} />}
                  </div>
                  <p className="text-[10px] text-slate-600 mt-2 pt-2 border-t border-slate-800">{s.tag}</p>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* 7-day trend */}
        <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.42 }}>
          <Card className="bg-slate-900 border-slate-800">
            <CardHeader className="border-b border-slate-800 py-4 px-6">
              <CardTitle className="text-sm font-semibold text-slate-300 flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-cyan-400" /> 7-Day Report Activity
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 pt-6">
              <div className="h-36">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={trendData} margin={{ top: 0, right: 4, left: -24, bottom: 0 }}>
                    <defs>
                      <linearGradient id="rg" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#06b6d4" stopOpacity={0.35} />
                        <stop offset="100%" stopColor="#06b6d4" stopOpacity={0.02} />
                      </linearGradient>
                      <linearGradient id="cg" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#ef4444" stopOpacity={0.4} />
                        <stop offset="100%" stopColor="#ef4444" stopOpacity={0.02} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                    <XAxis dataKey="day" stroke="#475569" fontSize={11} tickLine={false} axisLine={false} />
                    <YAxis stroke="#475569" fontSize={11} tickLine={false} axisLine={false} allowDecimals={false} />
                    <RechartsTooltip cursor={{ stroke: "#334155" }} contentStyle={CHART_STYLE} />
                    <Area type="monotone" dataKey="reports" stroke="#06b6d4" strokeWidth={2} fill="url(#rg)" name="Reports" />
                    <Area type="monotone" dataKey="critical" stroke="#ef4444" strokeWidth={1.5} fill="url(#cg)" name="Critical" strokeDasharray="4 2" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Ward table + breakdown charts */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }} className="lg:col-span-2">
            <Card className="bg-slate-900 border-slate-800">
              <CardHeader className="border-b border-slate-800 py-4 px-5">
                <CardTitle className="text-sm font-semibold text-slate-300">Ward-wise Distribution</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="overflow-x-auto max-h-[240px]">
                  <Table>
                    <TableHeader className="sticky top-0 bg-slate-900 z-10">
                      <TableRow className="border-slate-800 hover:bg-transparent">
                        <TableHead className="pl-5 text-[10px] font-bold text-slate-500 uppercase tracking-wider">Ward / Zone</TableHead>
                        <TableHead className="text-[10px] font-bold text-slate-500 uppercase tracking-wider text-right">Pending</TableHead>
                        <TableHead className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Critical</TableHead>
                        <TableHead className="text-[10px] font-bold text-slate-500 uppercase tracking-wider text-right pr-5">Resolved</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {isWardsLoading
                        ? Array.from({ length: 5 }).map((_, i) => (
                            <TableRow key={i} className="border-slate-800">
                              <TableCell className="pl-5"><Skeleton className="h-4 w-28" /></TableCell>
                              <TableCell><Skeleton className="h-4 w-8 ml-auto" /></TableCell>
                              <TableCell><Skeleton className="h-2 w-full rounded-full" /></TableCell>
                              <TableCell className="pr-5"><Skeleton className="h-4 w-8 ml-auto" /></TableCell>
                            </TableRow>
                          ))
                        : (wards ?? []).map(ward => (
                            <TableRow key={ward.ward} className="border-slate-800 hover:bg-slate-800/30 transition-colors">
                              <TableCell className="pl-5 font-semibold text-slate-200 text-xs">{ward.ward}</TableCell>
                              <TableCell className="text-right font-bold text-amber-400 tabular-nums text-sm">{ward.pendingReports}</TableCell>
                              <TableCell className="w-36">
                                <div className="flex items-center gap-2">
                                  <div className="flex-1 h-1.5 bg-slate-800 rounded-full overflow-hidden">
                                    <motion.div className="h-full bg-red-500 rounded-full"
                                      initial={{ width: 0 }}
                                      animate={{ width: `${(ward.criticalReports / maxWardCritical) * 100}%` }}
                                      transition={{ duration: 0.8, ease: "easeOut", delay: 0.5 }} />
                                  </div>
                                  <span className="text-xs font-bold text-red-400 tabular-nums w-4 text-right">{ward.criticalReports}</span>
                                </div>
                              </TableCell>
                              <TableCell className="pr-5 text-right text-slate-400 tabular-nums text-sm">{ward.resolvedReports}</TableCell>
                            </TableRow>
                          ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.54 }} className="space-y-4">
            <Card className="bg-slate-900 border-slate-800">
              <CardHeader className="border-b border-slate-800 py-3 px-4">
                <CardTitle className="text-xs font-semibold text-slate-300">Severity</CardTitle>
              </CardHeader>
              <CardContent className="p-3 pt-4">
                <div className="h-28">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={severityData} margin={{ top: 0, right: 4, left: -24, bottom: 0 }}>
                      <XAxis dataKey="name" stroke="#475569" fontSize={10} tickLine={false} axisLine={false} />
                      <YAxis stroke="#475569" fontSize={10} tickLine={false} axisLine={false} allowDecimals={false} />
                      <RechartsTooltip cursor={{ fill: "rgba(255,255,255,0.04)" }} contentStyle={CHART_STYLE} />
                      <Bar dataKey="count" radius={[4, 4, 0, 0]} maxBarSize={32}>
                        {severityData.map((e, i) => <Cell key={i} fill={e.color} fillOpacity={0.85} />)}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-slate-900 border-slate-800">
              <CardHeader className="border-b border-slate-800 py-3 px-4">
                <CardTitle className="text-xs font-semibold text-slate-300">Status Split</CardTitle>
              </CardHeader>
              <CardContent className="p-3 pt-4">
                <div className="h-28">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={statusData} cx="40%" cy="50%" innerRadius={28} outerRadius={48} paddingAngle={3} dataKey="value" stroke="none">
                        {statusData.map((e, i) => <Cell key={i} fill={e.color} fillOpacity={0.9} />)}
                      </Pie>
                      <Legend layout="vertical" align="right" verticalAlign="middle" iconType="circle" iconSize={6}
                        formatter={v => <span className="text-[9px] text-slate-400">{v}</span>} />
                      <RechartsTooltip contentStyle={CHART_STYLE} itemStyle={{ color: "#f1f5f9" }} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>

      {/* ── Right: Live Feed ── */}
      <motion.div
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.35, delay: 0.15 }}
        className="min-h-[600px] xl:min-h-0"
        style={{ height: "calc(100vh - 140px)" }}
      >
        <LiveFeedPanel />
      </motion.div>
    </div>
  );
}

// ── TAB: REPORTS ──────────────────────────────────────────────────────────────

function ReportsTab() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [severityFilter, setSeverityFilter] = useState("all");
  const [updatingId, setUpdatingId] = useState<number | null>(null);

  const { data: reports, isLoading, refetch } = useListReports(
    undefined,
    { query: { refetchInterval: 15_000 } }
  );

  const invalidateAll = () => {
    queryClient.invalidateQueries({ queryKey: getListReportsQueryKey() });
    queryClient.invalidateQueries({ queryKey: getGetDashboardSummaryQueryKey() });
    queryClient.invalidateQueries({ queryKey: getGetRecentActivityQueryKey() });
    queryClient.invalidateQueries({ queryKey: getGetSeverityBreakdownQueryKey() });
    queryClient.invalidateQueries({ queryKey: getGetStatusBreakdownQueryKey() });
    queryClient.invalidateQueries({ queryKey: getListWardsQueryKey() });
  };

  const updateMutation = useUpdateReport({
    mutation: {
      onSuccess: (data) => {
        invalidateAll();
        setUpdatingId(null);
        toast({
          title: data.status === "resolved" ? "✓ Report Resolved" : "Status Updated",
          description: `Status changed to ${fmt(data.status)}.`,
        });
      },
      onError: () => {
        setUpdatingId(null);
        toast({ title: "Update failed", description: "Please try again.", variant: "destructive" });
      },
    },
  });

  const filtered = (reports ?? []).filter((r: Report) => {
    const ms  = search === "" || r.title.toLowerCase().includes(search.toLowerCase()) || r.ward.toLowerCase().includes(search.toLowerCase()) || r.id.toString().includes(search) || (r.reporterName ?? "").toLowerCase().includes(search.toLowerCase());
    const mst = statusFilter === "all" || r.status === statusFilter;
    const msv = severityFilter === "all" || r.severity === severityFilter;
    return ms && mst && msv;
  });

  return (
    <div className="space-y-4">
      <div className="flex flex-col md:flex-row gap-3 p-4 bg-slate-900/80 border border-slate-800 rounded-2xl">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <Input placeholder="Search by title, ward, reporter name, or ID…" value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-10 bg-slate-950 border-slate-800 text-slate-100 focus:border-cyan-600 focus:ring-0 rounded-xl h-10" />
        </div>
        <div className="flex gap-3">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[148px] bg-slate-950 border-slate-800 text-slate-300 rounded-xl h-10">
              <SelectValue placeholder="All Statuses" />
            </SelectTrigger>
            <SelectContent className="bg-slate-900 border-slate-800 text-slate-200">
              <SelectItem value="all">All Statuses</SelectItem>
              {STATUS_OPTIONS.map(s => <SelectItem key={s} value={s}>{fmt(s)}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={severityFilter} onValueChange={setSeverityFilter}>
            <SelectTrigger className="w-[148px] bg-slate-950 border-slate-800 text-slate-300 rounded-xl h-10">
              <SelectValue placeholder="All Severities" />
            </SelectTrigger>
            <SelectContent className="bg-slate-900 border-slate-800 text-slate-200">
              <SelectItem value="all">All Severities</SelectItem>
              {SEVERITY_OPTIONS.map(s => (
                <SelectItem key={s} value={s} style={{ color: SEVERITY_COLORS[s] }}>
                  {s.charAt(0).toUpperCase() + s.slice(1)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button variant="outline" size="sm" onClick={() => refetch()}
            className="h-10 px-3 border-slate-800 text-slate-400 hover:text-slate-100">
            <RefreshCw className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {!isLoading && (
        <div className="text-xs text-slate-500 px-1">
          Showing <span className="text-slate-300 font-semibold">{filtered.length}</span> of{" "}
          <span className="text-slate-300 font-semibold">{reports?.length ?? 0}</span> reports
        </div>
      )}

      <div className="space-y-2">
        {isLoading
          ? Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="p-4 rounded-2xl border border-slate-800 bg-slate-900/60 flex gap-4 items-center">
                <Skeleton className="h-4 w-32" /><Skeleton className="h-5 w-16 rounded-full" />
                <Skeleton className="h-4 w-24" /><Skeleton className="h-9 w-40 ml-auto rounded-xl" />
              </div>
            ))
          : filtered.length === 0
          ? (
              <div className="py-20 text-center text-slate-600">
                <Search className="w-10 h-10 mx-auto mb-3 opacity-30" />
                <p className="font-semibold text-slate-400">No reports match your filters</p>
              </div>
            )
          : filtered.map((report: Report, idx: number) => (
              <motion.div key={report.id}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.18, delay: Math.min(idx * 0.03, 0.5) }}
                className={`p-4 rounded-2xl border bg-slate-900/60 transition-all ${
                  report.status === "resolved"
                    ? "border-green-900/40 bg-green-950/10"
                    : report.severity === "critical" && report.status !== "rejected"
                    ? "border-red-900/40"
                    : "border-slate-800"
                }`}
              >
                <div className="flex flex-col md:flex-row md:items-center gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1.5">
                      <span className="text-[10px] font-mono text-slate-600">#{report.id.toString().padStart(5, "0")}</span>
                      <SeverityBadge severity={report.severity} />
                      <StatusBadge status={report.status} />
                    </div>
                    <h3 className="font-bold text-slate-100 text-sm leading-snug mb-1.5">{report.title}</h3>
                    {report.description && (
                      <p className="text-xs text-slate-500 leading-relaxed mb-1.5 line-clamp-2">{report.description}</p>
                    )}
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500">
                      <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{report.ward}</span>
                      <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{formatDistanceToNow(new Date(report.createdAt), { addSuffix: true })}</span>
                      <span>{format(new Date(report.createdAt), "d MMM yyyy, h:mm a")}</span>
                      {report.reporterName && <span className="text-slate-500">Reporter: <span className="text-slate-300">{report.reporterName}</span></span>}
                      <span className="text-slate-600">▲ {report.upvotes} verifications</span>
                    </div>
                    {report.status === "resolved" && report.resolvedAt && (
                      <div className="mt-1.5 flex items-center gap-1.5 text-xs text-emerald-400">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        Resolved {formatDistanceToNow(new Date(report.resolvedAt), { addSuffix: true })}
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {updatingId === report.id ? (
                      <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-800 text-slate-400 text-xs">
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" /> Updating…
                      </div>
                    ) : (
                      <Select
                        value={report.status}
                        onValueChange={v => {
                          setUpdatingId(report.id);
                          updateMutation.mutate({ id: report.id, data: { status: v as ReportUpdateStatus } });
                        }}
                        disabled={updatingId !== null}
                      >
                        <SelectTrigger className="w-[176px] rounded-xl h-9 text-xs font-bold border-2"
                          style={{
                            borderColor: `${STATUS_COLORS[report.status as keyof typeof STATUS_COLORS]}60`,
                            color: STATUS_COLORS[report.status as keyof typeof STATUS_COLORS],
                            backgroundColor: `${STATUS_COLORS[report.status as keyof typeof STATUS_COLORS]}12`,
                          }}>
                          <SelectValue />
                          <ChevronDown className="w-3.5 h-3.5 ml-auto opacity-60" />
                        </SelectTrigger>
                        <SelectContent className="bg-slate-900 border-slate-800">
                          {STATUS_OPTIONS.map(s => (
                            <SelectItem key={s} value={s} className="text-xs font-semibold"
                              style={{ color: STATUS_COLORS[s as keyof typeof STATUS_COLORS] }}>
                              {fmt(s)}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  </div>
                </div>
              </motion.div>
            ))}
      </div>
    </div>
  );
}

// ── TAB: HEATMAP ─────────────────────────────────────────────────────────────

function HeatmapTab() {
  const { data: wards, isLoading } = useListWards(undefined, { query: { refetchInterval: 15_000 } });

  const heatData = useMemo(() => {
    if (!wards) return [];
    const maxTotal = Math.max(1, ...wards.map(w => w.pendingReports + w.resolvedReports));
    return wards.map(w => {
      const total     = w.pendingReports + w.resolvedReports;
      const critRatio = w.criticalReports / Math.max(1, total);
      const intensity = total / maxTotal;
      const heatScore = Math.round((critRatio * 0.6 + intensity * 0.4) * 100);
      const hue       = Math.round(120 - heatScore * 1.2);
      return { ...w, total, heatScore, color: `hsl(${hue}, 70%, 50%)` };
    }).sort((a, b) => b.heatScore - a.heatScore);
  }, [wards]);

  const maxScore = heatData[0]?.heatScore ?? 1;

  if (isLoading) return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
      {Array.from({ length: 12 }).map((_, i) => <Skeleton key={i} className="h-28 rounded-2xl" />)}
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-bold text-slate-200">Leak Density Heatmap</h2>
          <p className="text-xs text-slate-500 mt-0.5">Wards ranked by intensity score — combines report volume and critical severity ratio.</p>
        </div>
        <div className="hidden md:flex items-center gap-3 text-xs text-slate-500">
          {[["#22c55e", "Low"], ["#eab308", "Medium"], ["#ef4444", "High"]].map(([c, l]) => (
            <div key={l} className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-sm inline-block opacity-80" style={{ backgroundColor: c }} />{l}
            </div>
          ))}
        </div>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
        {heatData.map((ward, i) => (
          <motion.div key={ward.ward}
            initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: i * 0.04, duration: 0.25 }}
            className="p-4 rounded-2xl bg-slate-900 border border-slate-800 hover:border-slate-700 transition-colors relative overflow-hidden">
            <div className="absolute inset-0 opacity-[0.06] rounded-2xl" style={{ backgroundColor: ward.color }} />
            <div className="relative z-10">
              <div className="flex items-start justify-between mb-2">
                <span className="text-[10px] font-black text-slate-600">#{i + 1}</span>
                <span className="text-[10px] font-black px-1.5 py-0.5 rounded-md"
                  style={{ backgroundColor: `${ward.color}25`, color: ward.color }}>{ward.heatScore}</span>
              </div>
              <h4 className="text-xs font-bold text-slate-200 leading-tight mb-2">{ward.ward}</h4>
              <div className="h-1 w-full bg-slate-800 rounded-full overflow-hidden mb-2">
                <motion.div className="h-full rounded-full" style={{ backgroundColor: ward.color }}
                  initial={{ width: 0 }}
                  animate={{ width: `${(ward.heatScore / maxScore) * 100}%` }}
                  transition={{ duration: 0.7, ease: "easeOut", delay: i * 0.04 + 0.3 }} />
              </div>
              <div className="grid grid-cols-2 gap-1.5">
                <div className="text-center">
                  <div className="text-sm font-black text-slate-200 tabular-nums">{ward.pendingReports}</div>
                  <div className="text-[9px] text-slate-600">Active</div>
                </div>
                <div className="text-center">
                  <div className="text-sm font-black tabular-nums" style={{ color: SEVERITY_COLORS.critical }}>{ward.criticalReports}</div>
                  <div className="text-[9px] text-slate-600">Critical</div>
                </div>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
      {heatData.length === 0 && (
        <div className="text-center py-20 text-slate-600">
          <Thermometer className="w-12 h-12 mx-auto mb-3 opacity-20" />
          <p className="font-semibold text-slate-400">No ward data available yet</p>
        </div>
      )}
    </div>
  );
}

// ── TAB: LEADERBOARD ─────────────────────────────────────────────────────────

function LeaderboardTab() {
  const { data: users, isLoading } = useListUsers();

  if (isLoading) return (
    <div className="space-y-3">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="flex items-center gap-4 p-4 rounded-2xl border border-slate-800 bg-slate-900/60">
          <Skeleton className="w-9 h-9 rounded-full" /><Skeleton className="h-4 w-40 flex-1" /><Skeleton className="h-4 w-16" />
        </div>
      ))}
    </div>
  );

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-base font-bold text-slate-200 mb-1">Top Citizen Reporters</h2>
        <p className="text-xs text-slate-500">Ranked by Eco Points — computed from all verified submissions.</p>
      </div>
      <Card className="bg-slate-900 border-slate-800 overflow-hidden">
        <CardContent className="p-0">
          <div className="divide-y divide-slate-800/60">
            {(users ?? []).map((user, i) => {
              const tier  = getBadgeTier(user.ecoPoints);
              const color = getBadgeColor(tier);
              const next  = getNextTierInfo(user.ecoPoints);
              const icon  = i === 0 ? <Trophy className="w-4 h-4 text-yellow-400" />
                          : i === 1 ? <Star   className="w-4 h-4 text-slate-300" />
                          : i === 2 ? <Flame  className="w-4 h-4 text-amber-500" />
                          : null;
              return (
                <motion.div key={user.id}
                  initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.06, duration: 0.2 }}
                  className="flex items-center gap-4 px-6 py-4 hover:bg-slate-800/30 transition-colors">
                  <div className="w-6 text-center">
                    {icon ?? <span className="text-sm font-black text-slate-600">{i + 1}</span>}
                  </div>
                  <Avatar className="w-9 h-9 border border-slate-700 flex-shrink-0">
                    <AvatarFallback className="bg-slate-800 text-slate-300 text-xs font-bold">
                      {user.name.substring(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="text-sm font-bold text-slate-200 truncate">{user.name}</span>
                      <span className={`text-[9px] font-black px-1.5 py-0.5 rounded-full ${color}`}>{tier}</span>
                    </div>
                    <div className="text-xs text-slate-500 flex items-center gap-3">
                      <span>{user.reportsSubmitted} submitted</span>
                      <span className="text-green-400">{user.reportsVerified} verified</span>
                    </div>
                    {next.tier !== "Max" && (
                      <div className="mt-1 flex items-center gap-2">
                        <div className="h-1 w-20 bg-slate-800 rounded-full overflow-hidden">
                          <div className="h-full bg-cyan-700 rounded-full" style={{ width: `${next.pct}%` }} />
                        </div>
                        <span className="text-[10px] text-slate-600 flex items-center gap-0.5">
                          <ChevronUp className="w-3 h-3" />{next.needed} to {next.tier}
                        </span>
                      </div>
                    )}
                  </div>
                  <div className="text-right">
                    <div className="text-base font-black text-cyan-400 tabular-nums">{user.ecoPoints}</div>
                    <div className="text-[10px] text-slate-600">pts</div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// ── TAB: DIRECTORY ────────────────────────────────────────────────────────────

const ZONES = [
  { zone: "City Zone (Island City)",        wards: ["A Ward","B Ward","C Ward","D Ward"],                                              engineer: "Ramesh Patil",    phone: "+91 22 2369 7000", email: "city.hydraulic@mcgm.gov.in",       teams: 3 },
  { zone: "Western Suburbs — North",        wards: ["Andheri West","Andheri East","Jogeshwari"],                                       engineer: "Suresh Nair",     phone: "+91 22 2631 4400", email: "ws.north.hydraulic@mcgm.gov.in",    teams: 4 },
  { zone: "Western Suburbs — South",        wards: ["Bandra West","Bandra East","Santacruz East","Santacruz West","Khar"],             engineer: "Meena Kulkarni",  phone: "+91 22 2642 9100", email: "ws.south.hydraulic@mcgm.gov.in",    teams: 4 },
  { zone: "Western Suburbs — Far North",    wards: ["Borivali","Kandivali East","Kandivali West","Malad East","Malad West","Goregaon East","Goregaon West"], engineer: "Dinesh Shetty", phone: "+91 22 2897 2200", email: "ws.farnorth.hydraulic@mcgm.gov.in", teams: 5 },
  { zone: "Eastern Suburbs — North",        wards: ["Powai","Vikhroli","Bhandup","Mulund"],                                            engineer: "Anjali Sharma",   phone: "+91 22 2578 3300", email: "es.north.hydraulic@mcgm.gov.in",    teams: 3 },
  { zone: "Eastern Suburbs — South",        wards: ["Ghatkopar","Chembur","Kurla","Dadar"],                                            engineer: "Prakash Desai",   phone: "+91 22 2512 8800", email: "es.south.hydraulic@mcgm.gov.in",    teams: 4 },
  { zone: "Southern Mumbai",                wards: ["Worli","Juhu","Mahim"],                                                            engineer: "Kavita Joshi",    phone: "+91 22 2437 6600", email: "south.hydraulic@mcgm.gov.in",       teams: 3 },
];
const EMERGENCY = [
  { label: "BMC Water Helpline",          number: "1916",               desc: "24 × 7 water complaints" },
  { label: "MCGM Disaster Management",    number: "1800 222 1234",      desc: "Emergency response" },
  { label: "Hydraulic Engineer HQ",       number: "+91 22 2369 7000",   desc: "Main office, Mumbai" },
  { label: "Sewerage Operations Centre",  number: "+91 22 2369 6800",   desc: "Mon–Sat 8 am – 8 pm" },
];
const DEPT = [
  { dept: "Hydraulic Engineering Dept.",   head: "Chief Engineer (HE)",        contact: "he@mcgm.gov.in",          phone: "+91 22 2369 7001" },
  { dept: "Water Supply Division",         head: "Dy. Commissioner (E&P)",     contact: "ws@mcgm.gov.in",           phone: "+91 22 2369 7002" },
  { dept: "Maintenance & Repairs",         head: "Supt. Engineer (M&R)",       contact: "mr@mcgm.gov.in",           phone: "+91 22 2369 7003" },
  { dept: "Quality Control Lab",           head: "Chemical Analyser",          contact: "qc.lab@mcgm.gov.in",       phone: "+91 22 2369 7004" },
  { dept: "Complaints & Grievances",       head: "PRO",                        contact: "complaints@mcgm.gov.in",   phone: "1916" },
];

function DirectoryTab() {
  const [search, setSearch] = useState("");
  const lc = search.toLowerCase();
  const filteredZones = ZONES.filter(z =>
    lc === "" || z.zone.toLowerCase().includes(lc) || z.engineer.toLowerCase().includes(lc) || z.wards.some(w => w.toLowerCase().includes(lc))
  );

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h2 className="text-base font-bold text-slate-200 mb-1">Field Directory</h2>
          <p className="text-xs text-slate-500">Zone-wise hydraulic engineers, field teams, and department contacts.</p>
        </div>
        <div className="relative w-full md:w-72">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <Input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search zone, ward, or engineer…"
            className="pl-10 bg-slate-950 border-slate-800 text-slate-100 focus:border-cyan-600 rounded-xl h-9 text-sm" />
        </div>
      </div>

      <div className="space-y-3">
        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
          <span className="w-1 h-4 bg-red-500 rounded-full" />Emergency Contacts
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {EMERGENCY.map(e => (
            <Card key={e.label} className="bg-red-950/10 border-red-900/30">
              <CardContent className="p-4 flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-red-950/60 border border-red-900/40 flex items-center justify-center flex-shrink-0">
                  <Phone className="w-4 h-4 text-red-400" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-bold text-slate-200 leading-tight">{e.label}</p>
                  <p className="text-xs text-slate-500 mt-0.5">{e.desc}</p>
                  <p className="text-sm font-black text-red-400 tabular-nums mt-1">{e.number}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      <div className="space-y-3">
        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
          <span className="w-1 h-4 bg-cyan-500 rounded-full" />
          Hydraulic Engineers by Zone
          {filteredZones.length !== ZONES.length && <span className="ml-2 text-cyan-500 font-normal normal-case">— {filteredZones.length} of {ZONES.length}</span>}
        </h3>
        <div className="space-y-3">
          {filteredZones.length === 0 ? (
            <div className="py-12 text-center text-slate-600">
              <Building2 className="w-10 h-10 mx-auto mb-3 opacity-20" />
              <p className="text-slate-400 font-semibold">No zones match your search</p>
            </div>
          ) : filteredZones.map((z, i) => (
            <motion.div key={z.zone} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06, duration: 0.2 }}>
              <Card className="bg-slate-900 border-slate-800">
                <CardContent className="p-5">
                  <div className="flex flex-col md:flex-row md:items-start gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start gap-3 mb-3">
                        <div className="w-10 h-10 rounded-xl bg-cyan-950/50 border border-cyan-900/40 flex items-center justify-center flex-shrink-0">
                          <Building2 className="w-4 h-4 text-cyan-400" />
                        </div>
                        <div>
                          <h4 className="text-sm font-bold text-slate-100 leading-tight">{z.zone}</h4>
                          <p className="text-xs text-slate-500 mt-0.5">Engineer: <span className="text-slate-300 font-semibold">{z.engineer}</span></p>
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-1.5 mb-3">
                        {z.wards.map(w => (
                          <span key={w} className="text-[10px] font-semibold bg-slate-800 text-slate-300 px-2 py-0.5 rounded-lg border border-slate-700/60">{w}</span>
                        ))}
                      </div>
                      <div className="flex items-center gap-1.5 text-xs text-slate-600">
                        <Users className="w-3.5 h-3.5" />{z.teams} field teams assigned
                      </div>
                    </div>
                    <div className="flex flex-col gap-2 md:items-end shrink-0">
                      <a href={`tel:${z.phone}`} className="flex items-center gap-2 text-xs font-semibold text-slate-300 hover:text-cyan-300 transition-colors">
                        <Phone className="w-3.5 h-3.5 text-slate-500" />{z.phone}
                      </a>
                      <a href={`mailto:${z.email}`} className="flex items-center gap-2 text-xs font-semibold text-slate-400 hover:text-cyan-400 transition-colors">
                        <Mail className="w-3.5 h-3.5 text-slate-600" />{z.email}
                      </a>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>

      <div className="space-y-3">
        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
          <span className="w-1 h-4 bg-indigo-500 rounded-full" />Department Contacts
        </h3>
        <Card className="bg-slate-900 border-slate-800 overflow-hidden">
          <CardContent className="p-0">
            <div className="divide-y divide-slate-800/60">
              {DEPT.map((d, i) => (
                <motion.div key={d.dept}
                  initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.06, duration: 0.2 }}
                  className="flex flex-col md:flex-row md:items-center justify-between gap-2 px-5 py-4 hover:bg-slate-800/30 transition-colors">
                  <div>
                    <p className="text-sm font-bold text-slate-200">{d.dept}</p>
                    <p className="text-xs text-slate-500 mt-0.5">Head: {d.head}</p>
                  </div>
                  <div className="flex items-center gap-5 text-xs">
                    <a href={`mailto:${d.contact}`} className="flex items-center gap-1.5 text-slate-400 hover:text-cyan-400 transition-colors">
                      <Mail className="w-3 h-3" />{d.contact}
                    </a>
                    <a href={`tel:${d.phone}`} className="flex items-center gap-1.5 text-slate-400 hover:text-cyan-400 transition-colors">
                      <Phone className="w-3 h-3" />{d.phone}
                    </a>
                  </div>
                </motion.div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

// ── TAB: EXPORT ──────────────────────────────────────────────────────────────

function ExportTab() {
  const { data: reports } = useListReports();
  const { data: summary } = useGetDashboardSummary();
  const [downloaded, setDownloaded] = useState(false);

  const downloadCSV = () => {
    if (!reports) return;
    const headers = ["ID","Title","Ward","Severity","Status","Reporter","Description","Upvotes","Created","Resolved"];
    const rows = reports.map(r => [
      r.id, `"${r.title.replace(/"/g,'""')}"`, `"${r.ward}"`, r.severity, r.status,
      `"${(r.reporterName ?? "").replace(/"/g,'""')}"`,
      `"${(r.description ?? "").replace(/"/g,'""')}"`,
      r.upvotes,
      format(new Date(r.createdAt), "yyyy-MM-dd HH:mm"),
      r.resolvedAt ? format(new Date(r.resolvedAt), "yyyy-MM-dd HH:mm") : "",
    ]);
    const csv  = [headers.join(","), ...rows.map(r => r.join(","))].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement("a");
    a.href = url;
    a.download = `aquaalert-reports-${format(new Date(), "yyyy-MM-dd")}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    setDownloaded(true);
    setTimeout(() => setDownloaded(false), 3000);
  };

  const count  = reports?.length ?? 0;
  const active = (summary?.pendingReports ?? 0) + (summary?.inProgressReports ?? 0);

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h2 className="text-base font-bold text-slate-200 mb-1">Export Report Data</h2>
        <p className="text-xs text-slate-500">Download all report records as a CSV file for internal records, GIS mapping, or analysis.</p>
      </div>
      <Card className="bg-slate-900 border-slate-800">
        <CardContent className="p-6 space-y-5">
          <div className="grid grid-cols-3 gap-4">
            {[
              { label: "Total records", value: count,                          color: "text-slate-200" },
              { label: "Active reports", value: active,                        color: "text-amber-400" },
              { label: "Resolved",       value: summary?.resolvedReports ?? 0, color: "text-emerald-400" },
            ].map(({ label, value, color }) => (
              <div key={label} className="text-center p-3 bg-slate-950/60 rounded-xl border border-slate-800/40">
                <div className={`text-2xl font-black tabular-nums ${color}`}>{value}</div>
                <div className="text-[10px] text-slate-500 mt-0.5">{label}</div>
              </div>
            ))}
          </div>
          <div className="p-4 bg-slate-950/60 rounded-xl border border-slate-800/40 text-xs text-slate-400 space-y-1">
            <p className="font-semibold text-slate-300 mb-2">Columns included:</p>
            {["Report ID","Title","Ward / Area","Severity","Status","Reporter Name","Description","Upvote Count","Date Submitted (IST)","Date Resolved (IST)"].map(col => (
              <div key={col} className="flex items-center gap-2">
                <CheckCircle2 className="w-3 h-3 text-emerald-500 flex-shrink-0" />{col}
              </div>
            ))}
          </div>
          <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
            <Button onClick={downloadCSV} disabled={!reports || count === 0}
              className="w-full h-11 bg-cyan-600 hover:bg-cyan-500 text-white font-bold rounded-xl shadow-[0_0_20px_rgba(6,182,212,0.25)] gap-2">
              {downloaded
                ? <span className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4" />Downloaded!</span>
                : <span className="flex items-center gap-2"><Download className="w-4 h-4" />Download CSV ({count} records)</span>}
            </Button>
          </motion.div>
        </CardContent>
      </Card>
      <Card className="bg-slate-900 border-slate-800">
        <CardContent className="p-5">
          <h4 className="text-sm font-bold text-slate-300 mb-3">Data notes</h4>
          <div className="space-y-2 text-xs text-slate-500">
            <p>• All timestamps are in IST (Asia/Kolkata, UTC+05:30).</p>
            <p>• Reports cover Mumbai wards within BMC jurisdiction only.</p>
            <p>• Coordinates are not included in this CSV. Use the Heatmap tab for spatial data.</p>
            <p>• Re-download to get the latest records — data is live.</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// ── MAIN DASHBOARD ────────────────────────────────────────────────────────────

function AdminDashboard({ onLogout }: { onLogout: () => void }) {
  const [activeTab, setActiveTab] = useState<Tab>("overview");

  return (
    <div className="h-full w-full flex flex-col overflow-hidden bg-slate-950">
      {/* Top bar */}
      <div className="flex items-center justify-between px-6 lg:px-8 py-4 border-b border-slate-800 bg-slate-900/60 backdrop-blur-sm flex-shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-cyan-500/10 border border-cyan-500/25 flex items-center justify-center">
            <Shield className="w-4 h-4 text-cyan-400" />
          </div>
          <div>
            <h1 className="text-lg font-black text-slate-100 leading-none">Command Center</h1>
            <p className="text-[10px] text-slate-500 mt-0.5">Brihanmumbai Municipal Corporation · AquaAlert</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="hidden sm:flex items-center gap-2 text-xs bg-slate-950 border border-slate-800 px-3 py-1.5 rounded-lg">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500" />
            </span>
            <Zap className="w-3 h-3 text-green-400" />
            <span className="text-green-400 font-semibold font-mono">Aditya@1234</span>
          </div>
          <Button variant="outline" size="sm" onClick={onLogout}
            className="border-slate-700 text-slate-400 hover:text-red-400 hover:border-red-800 gap-1.5 h-8 text-xs">
            <LogOut className="w-3.5 h-3.5" /> Sign Out
          </Button>
        </div>
      </div>

      {/* Tab nav */}
      <div className="flex gap-1 px-6 lg:px-8 py-3 border-b border-slate-800 bg-slate-900/40 flex-shrink-0 overflow-x-auto">
        {TABS.map(tab => (
          <button key={tab.key} onClick={() => setActiveTab(tab.key)}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
              activeTab === tab.key
                ? "bg-cyan-950/60 text-cyan-300 border border-cyan-900/60 shadow-[0_0_12px_rgba(6,182,212,0.1)]"
                : "text-slate-500 hover:text-slate-200 hover:bg-slate-800/60 border border-transparent"
            }`}>
            <tab.icon className="w-3.5 h-3.5" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-[1600px] mx-auto p-6 lg:p-8">
          <AnimatePresence mode="wait">
            <motion.div key={activeTab}
              initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.2 }}>
              {activeTab === "overview"    && <OverviewTab />}
              {activeTab === "reports"     && <ReportsTab />}
              {activeTab === "heatmap"     && <HeatmapTab />}
              {activeTab === "leaderboard" && <LeaderboardTab />}
              {activeTab === "directory"   && <DirectoryTab />}
              {activeTab === "export"      && <ExportTab />}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}

// ── ROOT ──────────────────────────────────────────────────────────────────────

export default function AdminPage() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() =>
    sessionStorage.getItem(SESSION_KEY) === "true"
  );
  return (
    <AnimatePresence mode="wait">
      {isAuthenticated ? (
        <motion.div key="dash" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          style={{ position: "absolute", inset: 0 }}>
          <AdminDashboard onLogout={() => { sessionStorage.removeItem(SESSION_KEY); setIsAuthenticated(false); }} />
        </motion.div>
      ) : (
        <motion.div key="login" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          style={{ position: "absolute", inset: 0 }}>
          <LoginScreen onLogin={() => setIsAuthenticated(true)} />
        </motion.div>
      )}
    </AnimatePresence>
  );
}
