import { useState, useMemo } from "react";
import {
  useListReports, useUpdateReport, useGetDashboardSummary, useListWards, useListUsers,
  useGetSeverityBreakdown, useGetStatusBreakdown,
  Report, ReportUpdateStatus,
  getListReportsQueryKey, getGetDashboardSummaryQueryKey, getGetRecentActivityQueryKey,
  getGetSeverityBreakdownQueryKey, getGetStatusBreakdownQueryKey,
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
  TrendingUp, TrendingDown, Minus, List, BarChart2, Trophy, Download, Thermometer,
  ChevronUp, Star, Flame,
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
  { key: "overview",   label: "Overview",    icon: BarChart2 },
  { key: "reports",    label: "All Reports",  icon: List },
  { key: "heatmap",   label: "Heatmap",      icon: Thermometer },
  { key: "leaderboard",label: "Leaderboard", icon: Trophy },
  { key: "export",    label: "Export",       icon: Download },
] as const;
type Tab = typeof TABS[number]["key"];

function fmt(s: string) { return s.replace("_", " ").replace(/\b\w/g, l => l.toUpperCase()); }

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
                  <motion.div
                    initial={{ opacity: 0, y: -6, height: 0 }}
                    animate={{ opacity: 1, y: 0, height: "auto" }}
                    exit={{ opacity: 0, y: -6, height: 0 }}
                    className="flex items-center gap-2 px-3 py-2.5 bg-red-950/40 border border-red-900/50 rounded-xl text-sm text-red-400"
                  >
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

// ── TAB: OVERVIEW ─────────────────────────────────────────────────────────────

function OverviewTab() {
  const { data: summary, isLoading: isSummaryLoading } = useGetDashboardSummary();
  const { data: wards, isLoading: isWardsLoading } = useListWards();
  const { data: severityStats } = useGetSeverityBreakdown();
  const { data: statusStats } = useGetStatusBreakdown();
  const { data: allReports } = useListReports();

  const trendData = useMemo(() => Array.from({ length: 7 }, (_, i) => {
    const d = subDays(new Date(), 6 - i);
    const dayStr = d.toDateString();
    const dayReports = (allReports ?? []).filter(r => new Date(r.createdAt).toDateString() === dayStr);
    return { day: format(d, "EEE"), reports: dayReports.length, critical: dayReports.filter(r => r.severity === "critical").length };
  }), [allReports]);

  const severityData = (severityStats ?? []).map(s => ({
    name: s.severity.charAt(0).toUpperCase() + s.severity.slice(1),
    count: s.count,
    color: SEVERITY_COLORS[s.severity as keyof typeof SEVERITY_COLORS] ?? SEVERITY_COLORS.low,
  }));
  const statusData = (statusStats ?? []).map(s => ({
    name: s.status.replace("_", " ").replace(/\b\w/g, l => l.toUpperCase()),
    value: s.count,
    color: STATUS_COLORS[s.status as keyof typeof STATUS_COLORS] ?? STATUS_COLORS.pending,
  }));
  const maxWardCritical = Math.max(1, ...(wards ?? []).map(w => w.criticalReports));
  const resolutionRate  = summary ? Math.round((summary.resolvedReports / (summary.totalReports || 1)) * 100) : 0;
  const skelVal = <Skeleton className="h-10 w-16" />;

  const statCards = [
    { title: "Active Leaks",       value: summary?.pendingReports,       icon: Droplets,      color: "bg-cyan-950/50 text-cyan-400",   tag: "Pending resolution",         trend: null },
    { title: "Critical Incidents", value: summary?.criticalReports,      icon: AlertTriangle, color: "bg-red-950/50 text-red-400",    tag: "Immediate dispatch",          trend: "up"  },
    { title: "Total Resolved",     value: summary?.resolvedReports,      icon: CheckCircle,   color: "bg-green-950/50 text-green-400", tag: `${resolutionRate}% rate`,    trend: "up"  },
    { title: "NRW Saved (Est.)",   value: summary?.nrwReductionEstimate, icon: Activity,      color: "bg-blue-950/50 text-blue-400",   tag: "@ 0.5 KL per resolved",     suffix: "L", trend: null },
  ];

  const cv = { hidden: { opacity: 0, y: 14 }, visible: (i: number) => ({ opacity: 1, y: 0, transition: { delay: i * 0.08, duration: 0.3 } }) };

  return (
    <div className="space-y-7">
      {/* Stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {statCards.map((s, i) => (
          <motion.div key={s.title} custom={i} variants={cv} initial="hidden" animate="visible">
            <Card className="bg-slate-900 border-slate-800 overflow-hidden relative h-full">
              <div className="absolute inset-0 opacity-[0.025] bg-gradient-to-br from-white to-transparent pointer-events-none" />
              <CardContent className="p-6">
                <div className="flex items-start justify-between mb-3">
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">{s.title}</p>
                  <div className={`p-3 rounded-xl ${s.color} flex-shrink-0`}><s.icon className="w-4 h-4" /></div>
                </div>
                <div className="text-4xl font-black text-slate-100 tabular-nums mb-1">
                  {s.value === undefined ? skelVal : <AnimatedStat value={s.value} suffix={(s as any).suffix} />}
                </div>
                <div className="flex items-center gap-1 mt-2 pt-2 border-t border-slate-800">
                  {s.trend === "up" ? <TrendingUp className="w-3 h-3 text-green-400" /> : <Minus className="w-3 h-3 text-slate-600" />}
                  <span className="text-[11px] text-slate-500">{s.tag}</span>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* 7-day trend */}
      <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}>
        <Card className="bg-slate-900 border-slate-800">
          <CardHeader className="border-b border-slate-800 py-4 px-6">
            <CardTitle className="text-sm font-semibold text-slate-300 flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-cyan-400" /> 7-Day Report Activity
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-6">
            <div className="h-44">
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

      {/* Ward table + charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.42 }} className="lg:col-span-2">
          <Card className="bg-slate-900 border-slate-800 h-full">
            <CardHeader className="border-b border-slate-800 py-4 px-6">
              <CardTitle className="text-sm font-semibold text-slate-300">Ward-wise Distribution</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto max-h-[320px]">
                <Table>
                  <TableHeader className="sticky top-0 bg-slate-900 z-10">
                    <TableRow className="border-slate-800 hover:bg-transparent">
                      <TableHead className="pl-6 text-[10px] font-bold text-slate-500 uppercase tracking-wider">Ward / Zone</TableHead>
                      <TableHead className="text-[10px] font-bold text-slate-500 uppercase tracking-wider text-right">Active</TableHead>
                      <TableHead className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Critical</TableHead>
                      <TableHead className="text-[10px] font-bold text-slate-500 uppercase tracking-wider text-right pr-6">Resolved</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {isWardsLoading
                      ? Array.from({ length: 6 }).map((_, i) => (
                          <TableRow key={i} className="border-slate-800">
                            <TableCell className="pl-6"><Skeleton className="h-4 w-28" /></TableCell>
                            <TableCell><Skeleton className="h-4 w-8 ml-auto" /></TableCell>
                            <TableCell><Skeleton className="h-2 w-full rounded-full" /></TableCell>
                            <TableCell className="pr-6"><Skeleton className="h-4 w-8 ml-auto" /></TableCell>
                          </TableRow>
                        ))
                      : wards?.map(ward => (
                          <TableRow key={ward.ward} className="border-slate-800 hover:bg-slate-800/30 transition-colors">
                            <TableCell className="pl-6 font-semibold text-slate-200">{ward.ward}</TableCell>
                            <TableCell className="text-right font-bold text-cyan-400 tabular-nums">{ward.pendingReports}</TableCell>
                            <TableCell className="w-44">
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
                            <TableCell className="pr-6 text-right text-slate-400 tabular-nums">{ward.resolvedReports}</TableCell>
                          </TableRow>
                        ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.48 }} className="space-y-5">
          <Card className="bg-slate-900 border-slate-800">
            <CardHeader className="border-b border-slate-800 py-3 px-5">
              <CardTitle className="text-sm font-semibold text-slate-300">Severity Breakdown</CardTitle>
            </CardHeader>
            <CardContent className="p-4 pt-5">
              <div className="h-40">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={severityData} margin={{ top: 0, right: 4, left: -24, bottom: 0 }}>
                    <XAxis dataKey="name" stroke="#475569" fontSize={11} tickLine={false} axisLine={false} />
                    <YAxis stroke="#475569" fontSize={11} tickLine={false} axisLine={false} allowDecimals={false} />
                    <RechartsTooltip cursor={{ fill: "rgba(255,255,255,0.04)" }} contentStyle={CHART_STYLE} />
                    <Bar dataKey="count" radius={[5, 5, 0, 0]} maxBarSize={38}>
                      {severityData.map((e, i) => <Cell key={i} fill={e.color} fillOpacity={0.85} />)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-slate-900 border-slate-800">
            <CardHeader className="border-b border-slate-800 py-3 px-5">
              <CardTitle className="text-sm font-semibold text-slate-300">Status Split</CardTitle>
            </CardHeader>
            <CardContent className="p-4 pt-5">
              <div className="h-40">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={statusData} cx="40%" cy="50%" innerRadius={34} outerRadius={58} paddingAngle={3} dataKey="value" stroke="none">
                      {statusData.map((e, i) => <Cell key={i} fill={e.color} fillOpacity={0.9} />)}
                    </Pie>
                    <Legend layout="vertical" align="right" verticalAlign="middle" iconType="circle" iconSize={7}
                      formatter={v => <span className="text-[10px] text-slate-400">{v}</span>} />
                    <RechartsTooltip contentStyle={CHART_STYLE} itemStyle={{ color: "#f1f5f9" }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-blue-950/40 to-slate-900 border-blue-900/30">
            <CardContent className="p-5">
              <div className="flex items-center gap-2 mb-2">
                <Droplets className="w-4 h-4 text-blue-400" />
                <h4 className="text-sm font-bold text-slate-300">Impact Equivalent</h4>
              </div>
              <p className="text-xs text-slate-500 mb-3">
                <span className="text-blue-400 font-bold">{isSummaryLoading ? "—" : summary?.nrwReductionEstimate ?? 0}L</span> recovered equals…
              </p>
              {summary && (
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { v: Math.round(summary.nrwReductionEstimate / 15), u: "buckets", e: "🪣" },
                    { v: Math.round(summary.nrwReductionEstimate / 2),  u: "days water", e: "💧" },
                    { v: Math.round(summary.nrwReductionEstimate / 25), u: "families", e: "🏠" },
                  ].map(({ v, u, e }) => (
                    <div key={u} className="bg-slate-950/60 rounded-xl p-2.5 text-center border border-slate-800/40">
                      <div className="text-lg mb-0.5">{e}</div>
                      <div className="text-base font-black text-blue-400 tabular-nums">{v}</div>
                      <div className="text-[9px] text-slate-500">{u}</div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>
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

  const { data: reports, isLoading, refetch } = useListReports();

  const updateMutation = useUpdateReport({
    mutation: {
      onSuccess: (data) => {
        queryClient.invalidateQueries({ queryKey: getListReportsQueryKey() });
        queryClient.invalidateQueries({ queryKey: getGetDashboardSummaryQueryKey() });
        queryClient.invalidateQueries({ queryKey: getGetRecentActivityQueryKey() });
        queryClient.invalidateQueries({ queryKey: getGetSeverityBreakdownQueryKey() });
        queryClient.invalidateQueries({ queryKey: getGetStatusBreakdownQueryKey() });
        setUpdatingId(null);
        toast({
          title: data.status === "resolved" ? "✓ Report Resolved" : "Status Updated",
          description: data.status === "resolved"
            ? "Removed from the public map and feed."
            : `Status changed to ${fmt(data.status)}.`,
        });
      },
      onError: () => {
        setUpdatingId(null);
        toast({ title: "Update failed", description: "Please try again.", variant: "destructive" });
      },
    },
  });

  const filtered = (reports ?? []).filter((r: Report) => {
    const ms = search === "" || r.title.toLowerCase().includes(search.toLowerCase()) || r.ward.toLowerCase().includes(search.toLowerCase()) || r.id.toString().includes(search);
    const mst = statusFilter === "all" || r.status === statusFilter;
    const msv = severityFilter === "all" || r.severity === severityFilter;
    return ms && mst && msv;
  });

  return (
    <div className="space-y-4">
      <div className="flex flex-col md:flex-row gap-3 p-4 bg-slate-900/80 border border-slate-800 rounded-2xl">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <Input placeholder="Search by title, ward, or report ID…" value={search} onChange={e => setSearch(e.target.value)}
            className="pl-10 bg-slate-950 border-slate-800 text-slate-100 focus:border-cyan-600 focus:ring-0 rounded-xl h-10" />
        </div>
        <div className="flex gap-3">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[148px] bg-slate-950 border-slate-800 text-slate-300 rounded-xl h-10"><SelectValue placeholder="All Statuses" /></SelectTrigger>
            <SelectContent className="bg-slate-900 border-slate-800 text-slate-200">
              <SelectItem value="all">All Statuses</SelectItem>
              {STATUS_OPTIONS.map(s => <SelectItem key={s} value={s}>{fmt(s)}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={severityFilter} onValueChange={setSeverityFilter}>
            <SelectTrigger className="w-[148px] bg-slate-950 border-slate-800 text-slate-300 rounded-xl h-10"><SelectValue placeholder="All Severities" /></SelectTrigger>
            <SelectContent className="bg-slate-900 border-slate-800 text-slate-200">
              <SelectItem value="all">All Severities</SelectItem>
              {SEVERITY_OPTIONS.map(s => (
                <SelectItem key={s} value={s} style={{ color: SEVERITY_COLORS[s] }}>{s.charAt(0).toUpperCase() + s.slice(1)}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button variant="outline" size="sm" onClick={() => refetch()} className="h-10 px-3 border-slate-800 text-slate-400 hover:text-slate-100">
            <RefreshCw className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {!isLoading && filtered.length > 0 && (
        <div className="text-xs text-slate-500 px-1">
          Showing <span className="text-slate-300 font-semibold">{filtered.length}</span> of {reports?.length ?? 0} reports
        </div>
      )}

      <div className="space-y-2">
        {isLoading ? Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="p-4 rounded-2xl border border-slate-800 bg-slate-900/60 flex gap-4 items-center">
            <Skeleton className="h-4 w-32" /><Skeleton className="h-5 w-16 rounded-full" />
            <Skeleton className="h-4 w-24" /><Skeleton className="h-9 w-40 ml-auto rounded-xl" />
          </div>
        )) : filtered.length === 0 ? (
          <div className="py-20 text-center text-slate-600">
            <Search className="w-10 h-10 mx-auto mb-3 opacity-30" />
            <p className="font-semibold text-slate-400">No reports match your filters</p>
          </div>
        ) : filtered.map((report: Report, idx: number) => (
          <motion.div key={report.id}
            initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.18, delay: Math.min(idx * 0.03, 0.5) }}
            className={`p-4 rounded-2xl border bg-slate-900/60 transition-all ${
              report.status === "resolved" ? "border-green-900/40 bg-green-950/10"
              : report.severity === "critical" && report.status !== "rejected" ? "border-red-900/40"
              : "border-slate-800"}`}
          >
            <div className="flex flex-col md:flex-row md:items-center gap-3">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap mb-1.5">
                  <span className="text-[10px] font-mono text-slate-600">#{report.id.toString().padStart(5, "0")}</span>
                  <SeverityBadge severity={report.severity} />
                  <StatusBadge status={report.status} />
                </div>
                <h3 className="font-bold text-slate-100 text-sm leading-snug mb-1">{report.title}</h3>
                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500">
                  <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{report.ward}</span>
                  <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{formatDistanceToNow(new Date(report.createdAt), { addSuffix: true })}</span>
                  <span>{format(new Date(report.createdAt), "MMM d, yyyy")}</span>
                  <span className="text-slate-600">▲ {report.upvotes} verifications</span>
                  {report.reporterName && <span className="text-slate-600">by {report.reporterName}</span>}
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                {updatingId === report.id ? (
                  <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-800 text-slate-400 text-xs">
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" /> Updating…
                  </div>
                ) : (
                  <Select value={report.status} onValueChange={v => { setUpdatingId(report.id); updateMutation.mutate({ id: report.id, data: { status: v as ReportUpdateStatus } }); }} disabled={updatingId !== null}>
                    <SelectTrigger className="w-[176px] rounded-xl h-9 text-xs font-bold border-2"
                      style={{ borderColor: `${STATUS_COLORS[report.status as keyof typeof STATUS_COLORS]}60`, color: STATUS_COLORS[report.status as keyof typeof STATUS_COLORS], backgroundColor: `${STATUS_COLORS[report.status as keyof typeof STATUS_COLORS]}12` }}>
                      <SelectValue /><ChevronDown className="w-3.5 h-3.5 ml-auto opacity-60" />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-900 border-slate-800">
                      {STATUS_OPTIONS.map(s => (
                        <SelectItem key={s} value={s} className="text-xs font-semibold" style={{ color: STATUS_COLORS[s as keyof typeof STATUS_COLORS] }}>{fmt(s)}</SelectItem>
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
  const { data: wards, isLoading } = useListWards();

  const heatData = useMemo(() => {
    if (!wards) return [];
    const maxTotal = Math.max(1, ...wards.map(w => w.pendingReports + w.resolvedReports));
    return wards
      .map(w => {
        const total   = w.pendingReports + w.resolvedReports;
        const critRatio = w.criticalReports / Math.max(1, total);
        const intensity = total / maxTotal;
        const heatScore = Math.round((critRatio * 0.6 + intensity * 0.4) * 100);
        const hue = Math.round(120 - heatScore * 1.2);
        const color = `hsl(${hue}, 70%, 50%)`;
        return { ...w, total, critRatio, intensity, heatScore, color };
      })
      .sort((a, b) => b.heatScore - a.heatScore);
  }, [wards]);

  const maxScore = heatData[0]?.heatScore ?? 1;

  if (isLoading) return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
      {Array.from({ length: 12 }).map((_, i) => <Skeleton key={i} className="h-24 rounded-2xl" />)}
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-bold text-slate-200">Leak Density Heatmap</h2>
          <p className="text-xs text-slate-500 mt-0.5">Wards ranked by intensity score — combines report volume and critical severity ratio.</p>
        </div>
        <div className="flex items-center gap-2 text-xs text-slate-500">
          <div className="flex items-center gap-1">
            <span className="w-3 h-3 rounded-sm bg-green-500 inline-block opacity-70" />Low
          </div>
          <div className="flex items-center gap-1">
            <span className="w-3 h-3 rounded-sm bg-yellow-500 inline-block opacity-70" />Medium
          </div>
          <div className="flex items-center gap-1">
            <span className="w-3 h-3 rounded-sm bg-red-500 inline-block opacity-70" />High
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
        {heatData.map((ward, i) => {
          const barW = `${(ward.heatScore / maxScore) * 100}%`;
          return (
            <motion.div key={ward.ward}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.04, duration: 0.25 }}
              className="p-4 rounded-2xl bg-slate-900 border border-slate-800 hover:border-slate-700 transition-colors relative overflow-hidden"
            >
              <div className="absolute inset-0 opacity-[0.06] rounded-2xl" style={{ backgroundColor: ward.color }} />
              <div className="relative z-10">
                <div className="flex items-start justify-between mb-2">
                  <span className="text-[10px] font-black text-slate-600">#{i + 1}</span>
                  <span className="text-[10px] font-black px-1.5 py-0.5 rounded-md"
                    style={{ backgroundColor: `${ward.color}25`, color: ward.color }}>
                    {ward.heatScore}
                  </span>
                </div>
                <h4 className="text-xs font-bold text-slate-200 leading-tight mb-2">{ward.ward}</h4>
                <div className="h-1 w-full bg-slate-800 rounded-full overflow-hidden mb-2">
                  <motion.div className="h-full rounded-full"
                    style={{ backgroundColor: ward.color }}
                    initial={{ width: 0 }}
                    animate={{ width: barW }}
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
          );
        })}
      </div>

      {heatData.length === 0 && (
        <div className="text-center py-20 text-slate-600">
          <Thermometer className="w-12 h-12 mx-auto mb-3 opacity-20" />
          <p className="font-semibold text-slate-400">No ward data available</p>
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
        <p className="text-xs text-slate-500">Citizens ranked by Eco Points. Consider reaching out to top contributors for civic recognition.</p>
      </div>

      <Card className="bg-slate-900 border-slate-800 overflow-hidden">
        <CardContent className="p-0">
          <div className="divide-y divide-slate-800/60">
            {(users ?? []).map((user, i) => {
              const tier  = getBadgeTier(user.ecoPoints);
              const color = getBadgeColor(tier);
              const next  = getNextTierInfo(user.ecoPoints);
              const rankIcon = i === 0 ? <Trophy className="w-4 h-4 text-yellow-400" />
                             : i === 1 ? <Star className="w-4 h-4 text-slate-300" />
                             : i === 2 ? <Flame className="w-4 h-4 text-amber-500" />
                             : null;
              return (
                <motion.div key={user.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.06, duration: 0.2 }}
                  className="flex items-center gap-4 px-6 py-4 hover:bg-slate-800/30 transition-colors"
                >
                  <div className="w-6 text-center">
                    {rankIcon ?? <span className="text-sm font-black text-slate-600">{i + 1}</span>}
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
                      <span>{user.reportsSubmitted} reports</span>
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

// ── TAB: EXPORT ──────────────────────────────────────────────────────────────

function ExportTab() {
  const { data: reports } = useListReports();
  const { data: summary } = useGetDashboardSummary();
  const [downloaded, setDownloaded] = useState(false);

  const downloadCSV = () => {
    if (!reports) return;
    const headers = ["ID", "Title", "Ward", "Severity", "Status", "Reporter", "Upvotes", "Created", "Resolved"];
    const rows = reports.map(r => [
      r.id,
      `"${r.title.replace(/"/g, '""')}"`,
      `"${r.ward}"`,
      r.severity,
      r.status,
      `"${r.reporterName ?? ""}"`,
      r.upvotes,
      format(new Date(r.createdAt), "yyyy-MM-dd HH:mm"),
      r.resolvedAt ? format(new Date(r.resolvedAt), "yyyy-MM-dd HH:mm") : "",
    ]);
    const csv = [headers.join(","), ...rows.map(r => r.join(","))].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement("a");
    a.href = url; a.download = `aquaalert-reports-${format(new Date(), "yyyy-MM-dd")}.csv`;
    a.click(); URL.revokeObjectURL(url);
    setDownloaded(true);
    setTimeout(() => setDownloaded(false), 3000);
  };

  const count = reports?.length ?? 0;

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h2 className="text-base font-bold text-slate-200 mb-1">Export Report Data</h2>
        <p className="text-xs text-slate-500">Download all report records as a CSV file for use in internal records, GIS mapping, or further analysis.</p>
      </div>

      <Card className="bg-slate-900 border-slate-800">
        <CardContent className="p-6 space-y-5">
          <div className="grid grid-cols-3 gap-4">
            {[
              { label: "Total records", value: count, color: "text-slate-200" },
              { label: "Active reports", value: summary?.pendingReports ?? "—", color: "text-cyan-400" },
              { label: "Resolved", value: summary?.resolvedReports ?? "—", color: "text-emerald-400" },
            ].map(({ label, value, color }) => (
              <div key={label} className="text-center p-3 bg-slate-950/60 rounded-xl border border-slate-800/40">
                <div className={`text-2xl font-black tabular-nums ${color}`}>{value}</div>
                <div className="text-[10px] text-slate-500 mt-0.5">{label}</div>
              </div>
            ))}
          </div>

          <div className="p-4 bg-slate-950/60 rounded-xl border border-slate-800/40 text-xs text-slate-400 space-y-1">
            <p className="font-semibold text-slate-300 mb-2">CSV includes the following columns:</p>
            {["Report ID", "Title", "Ward / Area", "Severity (critical / high / medium / low)", "Status", "Reporter Name", "Upvotes / Verifications", "Date Submitted", "Date Resolved"].map(col => (
              <div key={col} className="flex items-center gap-2">
                <CheckCircle2 className="w-3 h-3 text-emerald-500 flex-shrink-0" />
                {col}
              </div>
            ))}
          </div>

          <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
            <Button
              onClick={downloadCSV}
              disabled={!reports || count === 0}
              className="w-full h-11 bg-cyan-600 hover:bg-cyan-500 text-white font-bold rounded-xl shadow-[0_0_20px_rgba(6,182,212,0.25)] gap-2"
            >
              {downloaded ? (
                <span className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4" />Downloaded!</span>
              ) : (
                <span className="flex items-center gap-2"><Download className="w-4 h-4" />Download CSV ({count} records)</span>
              )}
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
            <p>• Coordinates (latitude/longitude) are not included in this export. Use the map view for spatial data.</p>
            <p>• Data refreshes every 60 seconds. Re-download to get the latest records.</p>
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
            }`}
          >
            <tab.icon className="w-3.5 h-3.5" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-7xl mx-auto p-6 lg:p-8">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.2 }}
            >
              {activeTab === "overview"    && <OverviewTab />}
              {activeTab === "reports"     && <ReportsTab />}
              {activeTab === "heatmap"    && <HeatmapTab />}
              {activeTab === "leaderboard" && <LeaderboardTab />}
              {activeTab === "export"     && <ExportTab />}
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
