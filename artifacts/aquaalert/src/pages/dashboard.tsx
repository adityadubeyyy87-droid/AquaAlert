import { useGetDashboardSummary, useListWards, useGetSeverityBreakdown, useGetStatusBreakdown } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Activity, AlertTriangle, Droplets, CheckCircle, PieChart as PieChartIcon } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip as RechartsTooltip, Cell, PieChart, Pie } from "recharts";
import { SEVERITY_COLORS, STATUS_COLORS } from "@/lib/constants";

function StatCard({ title, value, icon: Icon, colorClass, subtitle }: { title: string, value: string | number | undefined, icon: any, colorClass: string, subtitle?: string }) {
  return (
    <Card className="bg-slate-900 border-slate-800">
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-slate-400 mb-1">{title}</p>
            <h3 className="text-3xl font-bold text-slate-100">
              {value === undefined ? <Skeleton className="h-8 w-16" /> : value}
            </h3>
            {subtitle && <p className="text-xs text-slate-500 mt-1">{subtitle}</p>}
          </div>
          <div className={`p-4 rounded-xl ${colorClass}`}>
            <Icon className="w-6 h-6" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function Dashboard() {
  const { data: summary, isLoading: isSummaryLoading } = useGetDashboardSummary();
  const { data: wards, isLoading: isWardsLoading } = useListWards();
  const { data: severityStats, isLoading: isSeverityLoading } = useGetSeverityBreakdown();
  const { data: statusStats, isLoading: isStatusLoading } = useGetStatusBreakdown();

  const severityData = severityStats ? severityStats.map(s => ({
    name: s.severity.charAt(0).toUpperCase() + s.severity.slice(1),
    count: s.count,
    color: SEVERITY_COLORS[s.severity as keyof typeof SEVERITY_COLORS] || SEVERITY_COLORS.low
  })) : [];

  const statusData = statusStats ? statusStats.map(s => ({
    name: s.status.replace("_", " ").replace(/\b\w/g, l => l.toUpperCase()),
    value: s.count,
    color: STATUS_COLORS[s.status as keyof typeof STATUS_COLORS] || STATUS_COLORS.pending
  })) : [];

  return (
    <div className="h-full w-full overflow-y-auto p-6 lg:p-10 bg-slate-950">
      <div className="max-w-7xl mx-auto space-y-8">
        <div>
          <h1 className="text-3xl font-bold text-slate-100 mb-2">Command Center</h1>
          <p className="text-slate-400">City-wide overview of active leak reports and resolution metrics.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard 
            title="Total Active Leaks" 
            value={summary?.pendingReports} 
            icon={Droplets} 
            colorClass="bg-cyan-950/30 text-cyan-500 shadow-[0_0_20px_rgba(6,182,212,0.2)]" 
          />
          <StatCard 
            title="Critical Incidents" 
            value={summary?.criticalReports} 
            icon={AlertTriangle} 
            colorClass="bg-red-950/30 text-red-500 shadow-[0_0_20px_rgba(239,68,68,0.2)]" 
            subtitle="Immediate action required"
          />
          <StatCard 
            title="Resolved (30d)" 
            value={summary?.resolvedReports} 
            icon={CheckCircle} 
            colorClass="bg-green-950/30 text-green-500" 
          />
          <StatCard 
            title="NRW Saved (Est)" 
            value={summary ? `${summary.nrwReductionEstimate}L` : undefined} 
            icon={Activity} 
            colorClass="bg-blue-950/30 text-blue-500" 
            subtitle="Non-Revenue Water"
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="col-span-1 lg:col-span-2 bg-slate-900 border-slate-800">
            <CardHeader className="border-b border-slate-800 pb-4">
              <CardTitle className="text-lg text-slate-100">Ward-wise Distribution</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto max-h-[350px]">
                <Table>
                  <TableHeader className="bg-slate-950/50 sticky top-0">
                    <TableRow className="border-slate-800 hover:bg-transparent">
                      <TableHead className="text-slate-400">Ward / Zone</TableHead>
                      <TableHead className="text-slate-400 text-right">Active</TableHead>
                      <TableHead className="text-slate-400 text-right">Critical</TableHead>
                      <TableHead className="text-slate-400 text-right">Resolved</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {isWardsLoading ? (
                      Array.from({ length: 5 }).map((_, i) => (
                        <TableRow key={i} className="border-slate-800">
                          <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                          <TableCell className="text-right"><Skeleton className="h-4 w-8 ml-auto" /></TableCell>
                          <TableCell className="text-right"><Skeleton className="h-4 w-8 ml-auto" /></TableCell>
                          <TableCell className="text-right"><Skeleton className="h-4 w-8 ml-auto" /></TableCell>
                        </TableRow>
                      ))
                    ) : wards && wards.length > 0 ? (
                      wards.map((ward) => (
                        <TableRow key={ward.ward} className="border-slate-800 hover:bg-slate-800/50">
                          <TableCell className="font-medium text-slate-200">{ward.ward}</TableCell>
                          <TableCell className="text-right text-cyan-400 font-medium">{ward.pendingReports}</TableCell>
                          <TableCell className="text-right text-red-400 font-medium">{ward.criticalReports}</TableCell>
                          <TableCell className="text-right text-slate-400">{ward.resolvedReports}</TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={4} className="text-center py-8 text-slate-500">No ward data available</TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>

          <div className="col-span-1 space-y-6">
            <Card className="bg-slate-900 border-slate-800">
              <CardHeader className="border-b border-slate-800 pb-4">
                <CardTitle className="text-lg text-slate-100">Severity Breakdown</CardTitle>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="h-48">
                  {isSeverityLoading ? (
                    <div className="w-full h-full flex items-center justify-center">
                      <Activity className="w-8 h-8 text-cyan-500 animate-spin" />
                    </div>
                  ) : (
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={severityData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                        <XAxis dataKey="name" stroke="#475569" fontSize={12} tickLine={false} axisLine={false} />
                        <YAxis stroke="#475569" fontSize={12} tickLine={false} axisLine={false} />
                        <RechartsTooltip 
                          cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                          contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', borderRadius: '8px', color: '#f1f5f9' }}
                        />
                        <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                          {severityData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card className="bg-slate-900 border-slate-800">
              <CardHeader className="border-b border-slate-800 pb-4">
                <CardTitle className="text-lg text-slate-100 flex items-center">
                  <PieChartIcon className="w-4 h-4 mr-2 text-slate-400" />
                  Status Distribution
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-6 pb-2">
                <div className="h-40">
                  {isStatusLoading ? (
                    <div className="w-full h-full flex items-center justify-center">
                      <Activity className="w-8 h-8 text-cyan-500 animate-spin" />
                    </div>
                  ) : (
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={statusData}
                          cx="50%"
                          cy="50%"
                          innerRadius={40}
                          outerRadius={70}
                          paddingAngle={2}
                          dataKey="value"
                          stroke="none"
                        >
                          {statusData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <RechartsTooltip 
                          contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', borderRadius: '8px', color: '#f1f5f9' }}
                          itemStyle={{ color: '#f1f5f9' }}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}

