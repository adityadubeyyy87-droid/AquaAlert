import { useState, useEffect } from "react";
import { useListReports, useUpdateReport, useGetDashboardSummary, Report, ReportUpdateStatus, getListReportsQueryKey, getGetDashboardSummaryQueryKey, getGetRecentActivityQueryKey, getGetSeverityBreakdownQueryKey, getGetStatusBreakdownQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { format, formatDistanceToNow } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { SEVERITY_COLORS, STATUS_COLORS } from "@/lib/constants";
import {
  Shield, LogOut, Droplet, AlertCircle, CheckCircle2, Clock,
  MapPin, Search, RefreshCw, ChevronDown, Activity, Zap,
} from "lucide-react";

const ADMIN_ID = "BMC_ADMIN";
const ADMIN_PASSWORD = "aquaalert2024";
const SESSION_KEY = "aquaalert_admin_session";

const STATUS_OPTIONS = ["pending", "verified", "in_progress", "resolved", "rejected"] as const;
const SEVERITY_OPTIONS = ["critical", "high", "medium", "low"] as const;

function formatStatus(s: string) {
  return s.replace("_", " ").replace(/\b\w/g, l => l.toUpperCase());
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

function StatCard({ icon: Icon, label, value, colorClass }: { icon: React.ElementType; label: string; value: React.ReactNode; colorClass: string }) {
  return (
    <Card className="bg-slate-900 border-slate-800">
      <CardContent className="p-5 flex items-center gap-4">
        <div className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 ${colorClass}`}>
          <Icon className="w-5 h-5" />
        </div>
        <div>
          <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-0.5">{label}</p>
          <div className="text-2xl font-black text-slate-100 tabular-nums leading-none">{value}</div>
        </div>
      </CardContent>
    </Card>
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

  const skeleton = <Skeleton className="h-7 w-12 inline-block" />;

  return (
    <div className="h-full w-full overflow-y-auto bg-slate-950">
      <div className="max-w-7xl mx-auto p-6 lg:p-10 space-y-7">

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/25 flex items-center justify-center">
              <Shield className="w-5 h-5 text-cyan-400" />
            </div>
            <div>
              <h1 className="text-2xl font-black text-slate-100 leading-none">Admin Dashboard</h1>
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
              <span className="text-green-400 font-semibold">BMC_ADMIN</span>
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

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard icon={Activity} label="Total Reports" value={isSummaryLoading ? skeleton : summary?.totalReports ?? 0} colorClass="bg-slate-800 text-slate-300" />
          <StatCard icon={Droplet} label="Active Leaks" value={isSummaryLoading ? skeleton : summary?.pendingReports ?? 0} colorClass="bg-cyan-950/50 text-cyan-400" />
          <StatCard icon={AlertCircle} label="Critical" value={isSummaryLoading ? skeleton : summary?.criticalReports ?? 0} colorClass="bg-red-950/50 text-red-400" />
          <StatCard icon={CheckCircle2} label="Resolved" value={isSummaryLoading ? skeleton : summary?.resolvedReports ?? 0} colorClass="bg-green-950/50 text-green-400" />
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
          <div className="text-xs text-slate-500 -mt-3 px-1">
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
