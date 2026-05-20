import { Link } from "wouter";
import { useListReports, useGetDashboardSummary, useGetRecentActivity } from "@workspace/api-client-react";
import LiveMap from "@/components/map/LiveMap";
import { AlertCircle, CheckCircle2, Clock, MapPin, Activity, Droplets } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { SEVERITY_COLORS, STATUS_COLORS } from "@/lib/constants";
import { formatDistanceToNow } from "date-fns";

export default function Home() {
  const { data: reports, isLoading: isReportsLoading } = useListReports();
  const { data: summary, isLoading: isSummaryLoading } = useGetDashboardSummary();
  const { data: recentActivity, isLoading: isActivityLoading } = useGetRecentActivity({ limit: 20 });
  
  return (
    <div className="flex h-full w-full">
      {/* Main Map Area */}
      <div className="flex-1 relative">
        <div className="absolute top-6 left-1/2 -translate-x-1/2 z-10 w-11/12 max-w-4xl flex gap-4">
          <Card className="flex-1 bg-slate-900/90 backdrop-blur border-slate-800 shadow-2xl">
            <CardContent className="p-4 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-cyan-950/50 rounded-lg text-cyan-400">
                  <Droplets className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-sm text-slate-400 font-medium">Total Active Leaks</p>
                  <div className="flex items-baseline gap-2">
                    <h2 className="text-2xl font-bold text-slate-100">
                      {isSummaryLoading ? <Skeleton className="h-8 w-16" /> : summary?.pendingReports || 0}
                    </h2>
                  </div>
                </div>
              </div>
              <div className="w-px h-12 bg-slate-800"></div>
              <div className="flex items-center gap-4">
                <div className="p-3 bg-red-950/30 rounded-lg text-red-500">
                  <AlertCircle className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-sm text-slate-400 font-medium">Critical Priority</p>
                  <div className="flex items-baseline gap-2">
                    <h2 className="text-2xl font-bold text-slate-100">
                      {isSummaryLoading ? <Skeleton className="h-8 w-16" /> : summary?.criticalReports || 0}
                    </h2>
                  </div>
                </div>
              </div>
              <div className="w-px h-12 bg-slate-800"></div>
              <div className="flex items-center gap-4">
                <div className="p-3 bg-green-950/30 rounded-lg text-green-500">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-sm text-slate-400 font-medium">Resolved This Month</p>
                  <div className="flex items-baseline gap-2">
                    <h2 className="text-2xl font-bold text-slate-100">
                      {isSummaryLoading ? <Skeleton className="h-8 w-16" /> : summary?.resolvedReports || 0}
                    </h2>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {isReportsLoading ? (
          <div className="w-full h-full flex items-center justify-center bg-slate-900">
            <div className="animate-spin text-cyan-500">
              <Activity className="w-12 h-12" />
            </div>
          </div>
        ) : (
          <LiveMap reports={reports || []} />
        )}
      </div>

      {/* Sidebar */}
      <div className="w-96 border-l border-slate-800 bg-slate-900 flex flex-col z-10 relative shadow-[-10px_0_30px_rgba(0,0,0,0.5)]">
        <div className="p-6 border-b border-slate-800">
          <h3 className="text-lg font-semibold text-slate-100 mb-2 flex items-center">
            <Activity className="w-5 h-5 mr-2 text-cyan-500" />
            Live Feed
          </h3>
          <p className="text-sm text-slate-400">Real-time reports from citizens</p>
        </div>
        
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {isActivityLoading ? (
            Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex gap-3 p-3 rounded-lg border border-slate-800">
                <Skeleton className="w-10 h-10 rounded-full" />
                <div className="space-y-2 flex-1">
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-3 w-1/2" />
                </div>
              </div>
            ))
          ) : recentActivity && recentActivity.length > 0 ? (
            recentActivity.map((report) => (
              <Link key={report.id} href={`/reports/${report.id}`}>
                <div className="group p-4 rounded-xl border border-slate-800 bg-slate-950/50 hover:bg-slate-800/80 transition-all cursor-pointer hover:border-slate-700">
                  <div className="flex justify-between items-start mb-2">
                    <Badge variant="outline" style={{ color: SEVERITY_COLORS[report.severity as keyof typeof SEVERITY_COLORS], borderColor: SEVERITY_COLORS[report.severity as keyof typeof SEVERITY_COLORS] }}>
                      {report.severity.toUpperCase()}
                    </Badge>
                    <span className="text-xs text-slate-500">
                      {formatDistanceToNow(new Date(report.createdAt), { addSuffix: true })}
                    </span>
                  </div>
                  <h4 className="font-medium text-slate-200 mb-1 group-hover:text-cyan-400 transition-colors">{report.title}</h4>
                  <div className="flex items-center text-xs text-slate-400 mt-2">
                    <MapPin className="w-3 h-3 mr-1" />
                    <span className="truncate">{report.ward}</span>
                  </div>
                </div>
              </Link>
            ))
          ) : (
            <div className="text-center py-12 text-slate-500">
              <MapPin className="w-12 h-12 mx-auto mb-3 opacity-20" />
              <p>No active reports</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
