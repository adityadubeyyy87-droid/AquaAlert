import { useState, useEffect, useMemo } from "react";
import {
  useListReports, useUpdateReport, useGetDashboardSummary, useListWards,
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
import { useToast } from "@/hooks/use-toast";
import { useCountUp } from "@/hooks/use-count-up";
import { SEVERITY_COLORS, STATUS_COLORS } from "@/lib/constants";
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip as RechartsTooltip,
  Cell, PieChart, Pie, Legend, AreaChart, Area, CartesianGrid,
} from "recharts";
import {
  Shield, LogOut, Droplet, AlertCircle, CheckCircle2, Clock,
  MapPin, Search, RefreshCw, ChevronDown, Activity, Zap,
  Droplets, AlertTriangle, CheckCircle, TrendingUp, TrendingDown, Minus, List,
} from "lucide-react";

const ADMIN_ID = "Aditya@1234";
const ADMIN_PASSWORD = "55";
const SESSION_KEY = "aquaalert_admin_session";

const STATUS_OPTIONS = ["pending", "verified", "in_progress", "resolved", "rejected"] as const;
const SEVERITY_OPTIONS = ["critical", "high", "medium", "low"] as const;

const CHART_STYLE = {
  backgroundColor: "#0f172a", borderColor: "#1e293b", borderRadius: "10px",
  color: "#f1f5f9", fontSize: "12px", boxShadow: "0 8px 24px rgba(0,0,0,0.5)",
};

function formatStatus(s: string) {
  return s.replace("_", " ").replace(/\b\w/g, l => l.toUpperCase());
}

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
      <span className="text-xs font-semibold" style={{ color }}>{formatStatus(status)}</span>
    </div>
  );
}

function ImpactEquivalent({ liters }: { liters: number }) {
  const buckets = Math.round(liters / 15);
  const drinks = Math.round(liters / 2);
  const families = Math.round(liters / 25);
  return (
    <div className="grid grid-cols-3 gap-3 mt-4">
      {[
        { value: buckets, unit: "buckets",    icon: "🪣" },
        { value: drinks,  unit: "days water", icon: "💧" },
        { value: families,unit: "families",   icon: "🏠" },
      ].map(({ value, unit, icon }) => (
        <div key={unit} className="bg-slate-950/60 rounded-xl p-3 text-center border border-slate-800/40">
          <div className="text-xl mb-1">{icon}</div>
          <div className="text-lg font-black text-blue-400 tabular-nums">{value}</div>
          <div className="text-[10px] text-slate-500">{unit}</div>
        </div>
      ))}
    </div>
  );
}

function LoginScreen({ onLogin }: { onLogin: () => void }) {
  const [adminId, setAdminId] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
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
                <Input
                  type="text"
                  value={adminId}
                  onChange={e => setAdminId(e.target.value)}
                  placeholder="Enter your Admin ID"
                  className="bg-slate-950 border-slate-800 text-slate-100 focus:border-cyan-600 rounded-xl h-11 font-mono tracking-wider"
                  autoComplete="username"
                  required
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Password</label>
                <Input
                  type="password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  className="bg-slate-950 border-slate-800 text-slate-100 focus:border-cyan-600 rounded-xl h-11"
                  autoComplete="current-password"
                  required
                />
              </div>

              <AnimatePresence>
                {error && (
                  <motion.div
                    initial={{ opacity: 0, y: -6, height: 0 }}
                    animate={{ opacity: 1, y: 0, height: "auto" }}
                    exit={{ opacity: 0, y: -6, height: 0 }}
                    className="flex items-center gap-2 px-3 py-2.5 bg-red-950/40 border border-red-900/50 rounded-xl text-sm text-red-400"
                  >
                    <AlertCircle className="w-4 h-4 flex-shrink-0" />
                    {error}
                  </motion.div>
                )}
              </AnimatePresence>

              <Button
                type="submit"
                disabled={loading}
                className="w-full h-11 bg-cyan-600 hover:bg-cyan-500 text-white font-bold rounded-xl shadow-[0_0_20px_rgba(6,182,212,0.3)] hover:shadow-[0_0_28px_rgba(6,182,212,0.5)] transition-all"
              >
                {loading ? (
                  <span className="flex items-center gap-2">
                    <RefreshCw className="w-4 h-4 animate-spin" /> Authenticating…
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    <Shield className="w-4 h-4" /> Sign In to Dashboard
                  </span>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        <p className="text-center text-xs text-slate-700 mt-5">
          Authorised BMC personnel only · AquaAlert v2.0
        </p>
      </motion.div>
    </div>
  );
}

function AdminDashboard({ onLogout }: { onLogout: () => void }) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [severityFilter, setSeverityFilter] = useState("all");
  const [updatingId, setUpdatingId] = useState<number | null>(null);

  const { data: reports, isLoading: isReportsLoading, refetch } = useListReports();
  const { data: summary, isLoading: isSummaryLoading } = useGetDashboardSummary();
  const { data: wards, isLoading: isWardsLoading } = useListWards();
  const { data: severityStats } = useGetSeverityBreakdown();
  const { data: statusStats } = useGetStatusBreakdown();

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
            ? "The report has been resolved and removed from the public map and feed."
            : `Status changed to ${formatStatus(data.status)}.`,
        });
      },
      onError: () => {
        setUpdatingId(null);
        toast({ title: "Update failed", description: "Please try again.", variant: "destructive" });
      },
    },
  });

  const handleStatusChange = (report: Report, newStatus: string) => {
    setUpdatingId(report.id);
    updateMutation.mutate({ id: report.id, data: { status: newStatus as ReportUpdateStatus } });
  };

  const filtered = (reports ?? []).filter((r: Report) => {
    const matchSearch = search === "" ||
      r.title.toLowerCase().includes(search.toLowerCase()) ||
      r.ward.toLowerCase().includes(search.toLowerCase()) ||
      r.id.toString().includes(search);
    const matchStatus = statusFilter === "all" || r.status === statusFilter;
    const matchSeverity = severityFilter === "all" || r.severity === severityFilter;
    return matchSearch && matchStatus && matchSeverity;
  });

  const trendData = useMemo(() => {
    return Array.from({ length: 7 }, (_, i) => {
      const d = subDays(new Date(), 6 - i);
      const dayStr = d.toDateString();
      const dayReports = (reports ?? []).filter(r => new Date(r.createdAt).toDateString() === dayStr);
      return {
        day: format(d, "EEE"),
        reports: dayReports.length,
        critical: dayReports.filter(r => r.severity === "critical").length,
      };
    });
  }, [reports]);

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
  const resolutionRate = summary ? Math.round((summary.resolvedReports / (summary.totalReports || 1)) * 100) : 0;

  const cardVariants = {
    hidden: { opacity: 0, y: 14 },
    visible: (i: number) => ({ opacity: 1, y: 0, transition: { delay: i * 0.08, duration: 0.3, ease: [0.4, 0, 0.2, 1] } }),
  };

  const statCards = [
    { title: "Active Leaks",       value: summary?.pendingReports,          icon: Droplets,      color: "bg-cyan-950/50 text-cyan-400",   tag: "Pending resolution",           trend: null },
    { title: "Critical Incidents", value: summary?.criticalReports,         icon: AlertTriangle, color: "bg-red-950/50 text-red-400",    tag: "Immediate dispatch",            trend: "up"  },
    { title: "Total Resolved",     value: summary?.resolvedReports,         icon: CheckCircle,   color: "bg-green-950/50 text-green-400", tag: `${resolutionRate}% resolution rate`, trend: "up" },
    { title: "NRW Saved (Est.)",   value: summary?.nrwReductionEstimate,    icon: Activity,      color: "bg-blue-950/50 text-blue-400",   tag: "@ 0.5 KL per resolved",        suffix: "L", trend: null },
  ];

  const skeleton = <Skeleton className="h-7 w-12 inline-block" />;

  return (
    <div className="h-full w-full overflow-y-auto bg-slate-950">
      <div className="max-w-7xl mx-auto p-6 lg:p-8 space-y-8">

        {/* ── Header ─────────────────────────────────────────────────────── */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/25 flex items-center justify-center">
              <Shield className="w-5 h-5 text-cyan-400" />
            </div>
            <div>
              <h1 className="text-2xl font-black text-slate-100 leading-none">Command Center</h1>
              <p className="text-xs text-slate-500 mt-0.5">Brihanmumbai Municipal Corporation · AquaAlert</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 text-xs bg-slate-900 border border-slate-800 px-3 py-2 rounded-lg">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500" />
              </span>
              <Zap className="w-3 h-3 text-green-400" />
              <span className="text-green-400 font-semibold font-mono">Aditya@1234</span>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={onLogout}
              className="border-slate-700 text-slate-400 hover:text-red-400 hover:border-red-800 gap-1.5"
            >
              <LogOut className="w-3.5 h-3.5" /> Sign Out
            </Button>
          </div>
        </div>

        {/* ── Stat Cards ─────────────────────────────────────────────────── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {statCards.map((s, i) => (
            <motion.div key={s.title} custom={i} variants={cardVariants} initial="hidden" animate="visible">
              <Card className="bg-slate-900 border-slate-800 overflow-hidden relative h-full">
                <div className="absolute inset-0 opacity-[0.025] bg-gradient-to-br from-white to-transparent pointer-events-none" />
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-3">
                    <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">{s.title}</p>
                    <div className={`p-3 rounded-xl ${s.color} flex-shrink-0`}><s.icon className="w-4 h-4" /></div>
                  </div>
                  <div className="text-4xl font-black text-slate-100 tabular-nums mb-1">
                    {s.value === undefined ? <Skeleton className="h-10 w-16" /> : (
                      <AnimatedStat value={s.value} suffix={(s as any).suffix} />
                    )}
                  </div>
                  <div className="flex items-center gap-1 mt-2 pt-2 border-t border-slate-800">
                    {s.trend === "up" ? <TrendingUp className="w-3 h-3 text-green-400" /> : s.trend === "down" ? <TrendingDown className="w-3 h-3 text-red-400" /> : <Minus className="w-3 h-3 text-slate-600" />}
                    <span className="text-[11px] text-slate-500">{s.tag}</span>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* ── 7-day Trend ────────────────────────────────────────────────── */}
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
                      <linearGradient id="reportGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#06b6d4" stopOpacity={0.35} />
                        <stop offset="100%" stopColor="#06b6d4" stopOpacity={0.02} />
                      </linearGradient>
                      <linearGradient id="critGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#ef4444" stopOpacity={0.4} />
                        <stop offset="100%" stopColor="#ef4444" stopOpacity={0.02} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                    <XAxis dataKey="day" stroke="#475569" fontSize={11} tickLine={false} axisLine={false} />
                    <YAxis stroke="#475569" fontSize={11} tickLine={false} axisLine={false} allowDecimals={false} />
                    <RechartsTooltip cursor={{ stroke: "#334155" }} contentStyle={CHART_STYLE} />
                    <Area type="monotone" dataKey="reports" stroke="#06b6d4" strokeWidth={2} fill="url(#reportGrad)" name="Reports" />
                    <Area type="monotone" dataKey="critical" stroke="#ef4444" strokeWidth={1.5} fill="url(#critGrad)" name="Critical" strokeDasharray="4 2" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* ── Ward table + Charts ────────────────────────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.42 }} className="col-span-1 lg:col-span-2">
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
                        : wards?.map((ward) => (
                            <TableRow key={ward.ward} className="border-slate-800 hover:bg-slate-800/30 transition-colors">
                              <TableCell className="pl-6 font-semibold text-slate-200">{ward.ward}</TableCell>
                              <TableCell className="text-right font-bold text-cyan-400 tabular-nums">{ward.pendingReports}</TableCell>
                              <TableCell className="w-44">
                                <div className="flex items-center gap-2">
                                  <div className="flex-1 h-1.5 bg-slate-800 rounded-full overflow-hidden">
                                    <motion.div
                                      className="h-full bg-red-500 rounded-full"
                                      initial={{ width: 0 }}
                                      animate={{ width: `${(ward.criticalReports / maxWardCritical) * 100}%` }}
                                      transition={{ duration: 0.8, ease: "easeOut", delay: 0.5 }}
                                    />
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
                  <span className="text-blue-400 font-bold">{summary?.nrwReductionEstimate ?? 0}L</span> of water recovered equals…
                </p>
                {summary && <ImpactEquivalent liters={summary.nrwReductionEstimate} />}
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* ── Reports Management ─────────────────────────────────────────── */}
        <div className="space-y-4">
          <div className="flex items-center gap-3 pt-2 border-t border-slate-800">
            <List className="w-5 h-5 text-cyan-400" />
            <div>
              <h2 className="text-lg font-black text-slate-100 leading-none">Reports Management</h2>
              <p className="text-xs text-slate-500 mt-0.5">Review and update the status of all citizen-submitted reports</p>
            </div>
          </div>

          <div className="flex flex-col md:flex-row gap-3 p-4 bg-slate-900/80 border border-slate-800 rounded-2xl">
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <Input
                placeholder="Search by title, ward, or report ID…"
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="pl-10 bg-slate-950 border-slate-800 text-slate-100 focus:border-cyan-600 focus:ring-0 rounded-xl h-10"
              />
            </div>
            <div className="flex gap-3">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[160px] bg-slate-950 border-slate-800 text-slate-300 rounded-xl h-10">
                  <SelectValue placeholder="All Statuses" />
                </SelectTrigger>
                <SelectContent className="bg-slate-900 border-slate-800 text-slate-200">
                  <SelectItem value="all">All Statuses</SelectItem>
                  {STATUS_OPTIONS.map(s => (
                    <SelectItem key={s} value={s}>{formatStatus(s)}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={severityFilter} onValueChange={setSeverityFilter}>
                <SelectTrigger className="w-[160px] bg-slate-950 border-slate-800 text-slate-300 rounded-xl h-10">
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
              <Button
                variant="outline"
                size="sm"
                onClick={() => refetch()}
                className="h-10 px-3 border-slate-800 text-slate-400 hover:text-slate-100 hover:border-slate-700"
              >
                <RefreshCw className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {!isReportsLoading && filtered.length > 0 && (
            <div className="text-xs text-slate-500 px-1">
              Showing <span className="text-slate-300 font-semibold">{filtered.length}</span> of {reports?.length ?? 0} reports
            </div>
          )}

          <div className="space-y-2">
            {isReportsLoading ? (
              Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="p-4 rounded-2xl border border-slate-800 bg-slate-900/60 flex gap-4 items-center">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-5 w-16 rounded-full" />
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-9 w-40 ml-auto rounded-xl" />
                </div>
              ))
            ) : filtered.length === 0 ? (
              <div className="py-20 text-center text-slate-600">
                <Search className="w-10 h-10 mx-auto mb-3 opacity-30" />
                <p className="font-semibold text-slate-400">No reports match your filters</p>
                <p className="text-sm mt-1">Try adjusting the search or filter criteria</p>
              </div>
            ) : (
              filtered.map((report: Report, idx: number) => (
                <motion.div
                  key={report.id}
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
                        <Select
                          value={report.status}
                          onValueChange={v => handleStatusChange(report, v)}
                          disabled={updatingId !== null}
                        >
                          <SelectTrigger
                            className="w-[176px] rounded-xl h-9 text-xs font-bold border-2"
                            style={{
                              borderColor: `${STATUS_COLORS[report.status as keyof typeof STATUS_COLORS]}60`,
                              color: STATUS_COLORS[report.status as keyof typeof STATUS_COLORS],
                              backgroundColor: `${STATUS_COLORS[report.status as keyof typeof STATUS_COLORS]}12`,
                            }}
                          >
                            <SelectValue />
                            <ChevronDown className="w-3.5 h-3.5 ml-auto opacity-60" />
                          </SelectTrigger>
                          <SelectContent className="bg-slate-900 border-slate-800">
                            {STATUS_OPTIONS.map(s => (
                              <SelectItem
                                key={s}
                                value={s}
                                className="text-xs font-semibold"
                                style={{ color: STATUS_COLORS[s as keyof typeof STATUS_COLORS] }}
                              >
                                {formatStatus(s)}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      )}
                    </div>
                  </div>
                </motion.div>
              ))
            )}
          </div>
        </div>

      </div>
    </div>
  );
}

export default function AdminPage() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    return sessionStorage.getItem(SESSION_KEY) === "true";
  });

  const handleLogin = () => setIsAuthenticated(true);
  const handleLogout = () => {
    sessionStorage.removeItem(SESSION_KEY);
    setIsAuthenticated(false);
  };

  return (
    <AnimatePresence mode="wait">
      {isAuthenticated ? (
        <motion.div
          key="dashboard"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          style={{ position: "absolute", inset: 0 }}
        >
          <AdminDashboard onLogout={handleLogout} />
        </motion.div>
      ) : (
        <motion.div
          key="login"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          style={{ position: "absolute", inset: 0 }}
        >
          <LoginScreen onLogin={handleLogin} />
        </motion.div>
      )}
    </AnimatePresence>
  );
}
