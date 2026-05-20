import { useMemo } from "react";
import { useGetDashboardSummary, useListWards, useGetSeverityBreakdown, useGetStatusBreakdown, useListReports } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Activity, AlertTriangle, Droplets, CheckCircle, Zap, Clock, TrendingUp, TrendingDown, Minus } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip as RechartsTooltip,
  Cell, PieChart, Pie, Legend, AreaChart, Area, CartesianGrid,
} from "recharts";
import { SEVERITY_COLORS, STATUS_COLORS } from "@/lib/constants";
import { useCountUp } from "@/hooks/use-count-up";
import { motion } from "framer-motion";
import { format, subDays } from "date-fns";

const CHART_STYLE = {
  backgroundColor: "#0f172a", borderColor: "#1e293b", borderRadius: "10px",
  color: "#f1f5f9", fontSize: "12px", boxShadow: "0 8px 24px rgba(0,0,0,0.5)",
};

const cardVariants = {
  hidden: { opacity: 0, y: 14 },
  visible: (i: number) => ({ opacity: 1, y: 0, transition: { delay: i * 0.08, duration: 0.3, ease: [0.4, 0, 0.2, 1] } }),
};

function AnimatedStat({ value, suffix = "" }: { value: number; suffix?: string }) {
  const animated = useCountUp(value);
  return <span>{animated}{suffix}</span>;
}

function ImpactEquivalent({ liters }: { liters: number }) {
  const buckets = Math.round(liters / 15);
  const drinks = Math.round(liters / 2);
  const families = Math.round(liters / 25);
  return (
    <div className="grid grid-cols-3 gap-3 mt-4">
      {[
        { value: buckets, unit: "buckets", icon: "🪣" },
        { value: drinks,  unit: "days water", icon: "💧" },
        { value: families,unit: "families",  icon: "🏠" },
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

export default function Dashboard() {
  const { data: summary, isLoading: isSummaryLoading } = useGetDashboardSummary();
  const { data: wards, isLoading: isWardsLoading } = useListWards();
  const { data: severityStats } = useGetSeverityBreakdown();
  const { data: statusStats } = useGetStatusBreakdown();
  const { data: allReports } = useListReports();

  const trendData = useMemo(() => {
    return Array.from({ length: 7 }, (_, i) => {
      const d = subDays(new Date(), 6 - i);
      const dayStr = d.toDateString();
      const dayReports = (allReports ?? []).filter(r => new Date(r.createdAt).toDateString() === dayStr);
      return {
        day: format(d, "EEE"),
        reports: dayReports.length,
        critical: dayReports.filter(r => r.severity === "critical").length,
      };
    });
  }, [allReports]);

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

  const stats = [
    { title: "Active Leaks",      value: summary?.pendingReports, icon: Droplets,     color: "bg-cyan-950/50 text-cyan-400 shadow-[0_0_20px_rgba(6,182,212,0.15)]", tag: "Pending resolution", trend: null },
    { title: "Critical Incidents",value: summary?.criticalReports, icon: AlertTriangle, color: "bg-red-950/50 text-red-400 shadow-[0_0_20px_rgba(239,68,68,0.15)]",   tag: "Immediate dispatch", trend: "up" },
    { title: "Total Resolved",    value: summary?.resolvedReports, icon: CheckCircle,  color: "bg-green-950/50 text-green-400",                                        tag: `${resolutionRate}% resolution rate`, trend: "up" },
    { title: "NRW Saved (Est.)",  value: summary?.nrwReductionEstimate, icon: Activity, color: "bg-blue-950/50 text-blue-400",                                         tag: "@ 0.5 KL per resolved", suffix: "L", trend: null },
  ];

  return (
    <div className="h-full w-full overflow-y-auto bg-slate-950">
      <div className="max-w-7xl mx-auto p-6 lg:p-10 space-y-8">

        {/* Header */}
        <div className="flex items-end justify-between">
          <div>
            <h1 className="text-3xl font-bold text-slate-100 mb-1">Command Center</h1>
            <p className="text-slate-500 text-sm">City-wide overview — Mumbai water leak resolution metrics.</p>
          </div>
          <div className="flex items-center gap-2 text-xs bg-slate-900 border border-slate-800 px-3 py-2 rounded-lg">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500" />
            </span>
            <Zap className="w-3 h-3 text-green-400" /><span className="text-green-400 font-semibold">Live</span>
            <span className="text-slate-600 ml-1 flex items-center gap-1"><Clock className="w-3 h-3" /> Auto-refreshes</span>
          </div>
        </div>

        {/* Stat cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {stats.map((s, i) => (
            <motion.div key={s.title} custom={i} variants={cardVariants} initial="hidden" animate="visible">
              <Card className="bg-slate-900 border-slate-800 overflow-hidden relative h-full">
                <div className="absolute inset-0 opacity-[0.025] bg-gradient-to-br from-white to-transparent pointer-events-none" />
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-3">
                    <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">{s.title}</p>
                    <div className={`p-3 rounded-xl ${s.color} flex-shrink-0`}><s.icon className="w-4.5 h-4.5" /></div>
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

        {/* Main grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Ward table */}
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

          {/* Charts + impact */}
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

            {/* Water impact card */}
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
      </div>
    </div>
  );
}
