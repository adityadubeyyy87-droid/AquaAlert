import {
  useGetDashboardSummary, useListWards, useGetSeverityBreakdown, useGetStatusBreakdown,
} from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Activity, AlertTriangle, Droplets, CheckCircle, Zap, Clock, TrendingUp } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip as RechartsTooltip,
  Cell, PieChart, Pie, Legend,
} from "recharts";
import { SEVERITY_COLORS, STATUS_COLORS } from "@/lib/constants";

function StatCard({
  title, value, icon: Icon, colorClass, subtitle, tag,
}: {
  title: string; value: React.ReactNode; icon: React.ElementType;
  colorClass: string; subtitle?: string; tag?: string;
}) {
  return (
    <Card className="bg-slate-900 border-slate-800 overflow-hidden relative">
      <div className="absolute inset-0 opacity-[0.03] bg-gradient-to-br from-white to-transparent pointer-events-none" />
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">{title}</p>
            <div className="text-3xl font-bold text-slate-100 tabular-nums">{value}</div>
            {subtitle && <p className="text-xs text-slate-500 mt-1.5">{subtitle}</p>}
          </div>
          <div className={`p-3.5 rounded-xl ${colorClass} flex-shrink-0`}>
            <Icon className="w-5 h-5" />
          </div>
        </div>
        {tag && (
          <div className="mt-3 pt-3 border-t border-slate-800">
            <span className="text-xs text-slate-500 flex items-center gap-1">
              <TrendingUp className="w-3 h-3" />{tag}
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

const CHART_TOOLTIP_STYLE = {
  backgroundColor: "#0f172a",
  borderColor: "#1e293b",
  borderRadius: "10px",
  color: "#f1f5f9",
  fontSize: "12px",
  boxShadow: "0 8px 24px rgba(0,0,0,0.4)",
};

export default function Dashboard() {
  const { data: summary, isLoading: isSummaryLoading } = useGetDashboardSummary();
  const { data: wards, isLoading: isWardsLoading } = useListWards();
  const { data: severityStats } = useGetSeverityBreakdown();
  const { data: statusStats } = useGetStatusBreakdown();

  const severityData = (severityStats ?? []).map((s) => ({
    name: s.severity.charAt(0).toUpperCase() + s.severity.slice(1),
    count: s.count,
    color: SEVERITY_COLORS[s.severity as keyof typeof SEVERITY_COLORS] ?? SEVERITY_COLORS.low,
  }));

  const statusData = (statusStats ?? []).map((s) => ({
    name: s.status.replace("_", " ").replace(/\b\w/g, (l) => l.toUpperCase()),
    value: s.count,
    color: STATUS_COLORS[s.status as keyof typeof STATUS_COLORS] ?? STATUS_COLORS.pending,
  }));

  const maxWardCritical = Math.max(1, ...(wards ?? []).map((w) => w.criticalReports));

  return (
    <div className="h-full w-full overflow-y-auto bg-slate-950">
      <div className="max-w-7xl mx-auto p-6 lg:p-10 space-y-8">

        {/* Header */}
        <div className="flex items-end justify-between">
          <div>
            <h1 className="text-3xl font-bold text-slate-100 mb-1">Command Center</h1>
            <p className="text-slate-500 text-sm">City-wide overview of active leak reports and resolution metrics.</p>
          </div>
          <div className="flex items-center gap-2 text-xs text-slate-500 bg-slate-900 border border-slate-800 px-3 py-2 rounded-lg">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500" />
            </span>
            <Zap className="w-3 h-3 text-green-400" />
            <span className="text-green-400 font-medium">Live</span>
            <span className="text-slate-600 ml-1 flex items-center gap-1">
              <Clock className="w-3 h-3" /> Auto-refreshes
            </span>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          <StatCard
            title="Active Leaks"
            value={isSummaryLoading ? <Skeleton className="h-8 w-12" /> : summary?.pendingReports ?? 0}
            icon={Droplets}
            colorClass="bg-cyan-950/50 text-cyan-400 shadow-[0_0_20px_rgba(6,182,212,0.15)]"
            tag="Pending resolution"
          />
          <StatCard
            title="Critical Incidents"
            value={isSummaryLoading ? <Skeleton className="h-8 w-12" /> : summary?.criticalReports ?? 0}
            icon={AlertTriangle}
            colorClass="bg-red-950/50 text-red-400 shadow-[0_0_20px_rgba(239,68,68,0.15)]"
            subtitle="Immediate action required"
            tag="Requires dispatch today"
          />
          <StatCard
            title="Resolved (All Time)"
            value={isSummaryLoading ? <Skeleton className="h-8 w-12" /> : summary?.resolvedReports ?? 0}
            icon={CheckCircle}
            colorClass="bg-green-950/50 text-green-400"
            tag="Avg. response tracked"
          />
          <StatCard
            title="NRW Saved (Est.)"
            value={isSummaryLoading ? <Skeleton className="h-8 w-12" /> : `${summary?.nrwReductionEstimate ?? 0}L`}
            icon={Activity}
            colorClass="bg-blue-950/50 text-blue-400"
            subtitle="Non-Revenue Water"
            tag="@ 0.5 KL per resolved report"
          />
        </div>

        {/* Main grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* Ward table */}
          <Card className="col-span-1 lg:col-span-2 bg-slate-900 border-slate-800">
            <CardHeader className="border-b border-slate-800 py-4 px-6">
              <CardTitle className="text-base font-semibold text-slate-100">Ward-wise Distribution</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto max-h-[380px]">
                <Table>
                  <TableHeader className="sticky top-0 bg-slate-900 z-10">
                    <TableRow className="border-slate-800 hover:bg-transparent">
                      <TableHead className="text-xs font-semibold text-slate-500 uppercase tracking-wider pl-6">Ward / Zone</TableHead>
                      <TableHead className="text-xs font-semibold text-slate-500 uppercase tracking-wider text-right">Active</TableHead>
                      <TableHead className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Critical</TableHead>
                      <TableHead className="text-xs font-semibold text-slate-500 uppercase tracking-wider text-right pr-6">Resolved</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {isWardsLoading
                      ? Array.from({ length: 6 }).map((_, i) => (
                          <TableRow key={i} className="border-slate-800">
                            <TableCell className="pl-6"><Skeleton className="h-4 w-28" /></TableCell>
                            <TableCell className="text-right"><Skeleton className="h-4 w-8 ml-auto" /></TableCell>
                            <TableCell><Skeleton className="h-3 w-24 rounded-full" /></TableCell>
                            <TableCell className="pr-6 text-right"><Skeleton className="h-4 w-8 ml-auto" /></TableCell>
                          </TableRow>
                        ))
                      : wards && wards.length > 0
                      ? wards.map((ward) => (
                          <TableRow key={ward.ward} className="border-slate-800 hover:bg-slate-800/40 transition-colors">
                            <TableCell className="pl-6 font-medium text-slate-200">{ward.ward}</TableCell>
                            <TableCell className="text-right">
                              <span className="font-bold text-cyan-400 tabular-nums">{ward.pendingReports}</span>
                            </TableCell>
                            <TableCell className="w-40">
                              <div className="flex items-center gap-2">
                                <div className="flex-1 h-1.5 bg-slate-800 rounded-full overflow-hidden">
                                  <div
                                    className="h-full bg-red-500 rounded-full transition-all"
                                    style={{ width: `${(ward.criticalReports / maxWardCritical) * 100}%` }}
                                  />
                                </div>
                                <span className="text-xs font-bold text-red-400 tabular-nums w-4 text-right">{ward.criticalReports}</span>
                              </div>
                            </TableCell>
                            <TableCell className="pr-6 text-right">
                              <span className="text-slate-400 tabular-nums">{ward.resolvedReports}</span>
                            </TableCell>
                          </TableRow>
                        ))
                      : (
                          <TableRow>
                            <TableCell colSpan={4} className="text-center py-10 text-slate-500">No ward data</TableCell>
                          </TableRow>
                        )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>

          {/* Charts */}
          <div className="col-span-1 space-y-5">
            <Card className="bg-slate-900 border-slate-800">
              <CardHeader className="border-b border-slate-800 py-3 px-5">
                <CardTitle className="text-sm font-semibold text-slate-300">Severity Breakdown</CardTitle>
              </CardHeader>
              <CardContent className="p-4 pt-5">
                <div className="h-44">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={severityData} margin={{ top: 0, right: 4, left: -24, bottom: 0 }}>
                      <XAxis dataKey="name" stroke="#475569" fontSize={11} tickLine={false} axisLine={false} />
                      <YAxis stroke="#475569" fontSize={11} tickLine={false} axisLine={false} allowDecimals={false} />
                      <RechartsTooltip cursor={{ fill: "rgba(255,255,255,0.04)" }} contentStyle={CHART_TOOLTIP_STYLE} />
                      <Bar dataKey="count" radius={[5, 5, 0, 0]} maxBarSize={40}>
                        {severityData.map((entry, i) => (
                          <Cell key={i} fill={entry.color} fillOpacity={0.85} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-slate-900 border-slate-800">
              <CardHeader className="border-b border-slate-800 py-3 px-5">
                <CardTitle className="text-sm font-semibold text-slate-300">Status Distribution</CardTitle>
              </CardHeader>
              <CardContent className="p-4 pt-5">
                <div className="h-44">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={statusData}
                        cx="40%"
                        cy="50%"
                        innerRadius={38}
                        outerRadius={62}
                        paddingAngle={3}
                        dataKey="value"
                        stroke="none"
                      >
                        {statusData.map((entry, i) => (
                          <Cell key={i} fill={entry.color} fillOpacity={0.9} />
                        ))}
                      </Pie>
                      <Legend
                        layout="vertical"
                        align="right"
                        verticalAlign="middle"
                        iconType="circle"
                        iconSize={7}
                        formatter={(v) => <span className="text-[11px] text-slate-400">{v}</span>}
                      />
                      <RechartsTooltip contentStyle={CHART_TOOLTIP_STYLE} itemStyle={{ color: "#f1f5f9" }} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
