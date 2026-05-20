import { Link } from "wouter";
import { useListReports, useGetDashboardSummary, useGetRecentActivity } from "@workspace/api-client-react";
import LiveMap from "@/components/map/LiveMap";
import { AlertCircle, CheckCircle2, Droplets, Activity, MapPin, ArrowUpRight, Zap } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { SEVERITY_COLORS } from "@/lib/constants";
import { formatDistanceToNow } from "date-fns";

function StatPill({ icon: Icon, label, value, color, pulse }: {
  icon: React.ElementType; label: string; value: React.ReactNode;
  color: string; pulse?: boolean;
}) {
  return (
    <div className="flex items-center gap-3 px-5">
      <div className={`relative w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${color}`}>
        {pulse && (
          <span className="absolute inset-0 rounded-lg animate-ping opacity-30" style={{ background: "currentColor" }} />
        )}
        <Icon className="w-4 h-4 relative z-10" />
      </div>
      <div>
        <p className="text-[11px] font-medium text-slate-500 leading-none mb-1">{label}</p>
        <div className="text-xl font-bold text-slate-100 leading-none">{value}</div>
      </div>
    </div>
  );
}

export default function Home() {
  const { data: reports, isLoading: isReportsLoading } = useListReports();
  const { data: summary, isLoading: isSummaryLoading } = useGetDashboardSummary();
  const { data: recentActivity, isLoading: isActivityLoading } = useGetRecentActivity({ limit: 20 });

  const loadingNum = <Skeleton className="h-5 w-10 inline-block" />;

  return (
    <div className="flex h-full w-full">
      {/* Map */}
      <div className="flex-1 relative">
        {/* Stats bar */}
        <div className="absolute top-5 left-1/2 -translate-x-1/2 z-[400] w-auto max-w-2xl">
          <div className="flex items-center bg-slate-900/92 backdrop-blur-md border border-slate-800/80 rounded-2xl shadow-2xl divide-x divide-slate-800 overflow-hidden">
            <StatPill
              icon={Droplets}
              label="Active Leaks"
              value={isSummaryLoading ? loadingNum : summary?.pendingReports ?? 0}
              color="bg-cyan-500/15 text-cyan-400"
            />
            <StatPill
              icon={AlertCircle}
              label="Critical"
              value={isSummaryLoading ? loadingNum : summary?.criticalReports ?? 0}
              color="bg-red-500/15 text-red-400"
              pulse={(summary?.criticalReports ?? 0) > 0}
            />
            <StatPill
              icon={CheckCircle2}
              label="Resolved"
              value={isSummaryLoading ? loadingNum : summary?.resolvedReports ?? 0}
              color="bg-green-500/15 text-green-400"
            />
            <div className="px-5">
              <p className="text-[11px] font-medium text-slate-500 leading-none mb-1">NRW Saved</p>
              <div className="text-xl font-bold text-blue-400 leading-none">
                {isSummaryLoading ? loadingNum : `${summary?.nrwReductionEstimate ?? 0}L`}
              </div>
            </div>
          </div>
        </div>

        {isReportsLoading ? (
          <div className="w-full h-full flex items-center justify-center bg-slate-900">
            <div className="flex flex-col items-center gap-3">
              <Activity className="w-10 h-10 text-cyan-500 animate-spin" />
              <p className="text-sm text-slate-500">Loading map data…</p>
            </div>
          </div>
        ) : (
          <LiveMap reports={reports || []} />
        )}
      </div>

      {/* Live Feed sidebar */}
      <div className="w-88 w-[340px] border-l border-slate-800 bg-slate-900/80 flex flex-col z-10 relative shadow-[-12px_0_40px_rgba(0,0,0,0.4)] backdrop-blur-sm">
        <div className="px-5 py-4 border-b border-slate-800 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
              <Zap className="w-3.5 h-3.5 text-cyan-400" />
              Live Feed
            </h3>
            <p className="text-[11px] text-slate-500 mt-0.5">Latest citizen reports</p>
          </div>
          {recentActivity && (
            <span className="text-[10px] font-bold bg-cyan-950/60 text-cyan-400 border border-cyan-900/50 px-2 py-0.5 rounded-full">
              {recentActivity.length} recent
            </span>
          )}
        </div>

        <div className="flex-1 overflow-y-auto p-3 space-y-2">
          {isActivityLoading ? (
            Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="flex gap-3 p-3 rounded-xl border border-slate-800">
                <Skeleton className="w-2 h-2 rounded-full mt-1.5 flex-shrink-0" />
                <div className="space-y-2 flex-1">
                  <Skeleton className="h-3.5 w-3/4" />
                  <Skeleton className="h-3 w-1/2" />
                </div>
              </div>
            ))
          ) : recentActivity && recentActivity.length > 0 ? (
            recentActivity.map((report) => {
              const color = SEVERITY_COLORS[report.severity as keyof typeof SEVERITY_COLORS];
              return (
                <Link key={report.id} href={`/reports/${report.id}`}>
                  <div className="group p-3 rounded-xl border border-slate-800/60 bg-slate-950/40 hover:bg-slate-800/60 hover:border-slate-700 transition-all cursor-pointer">
                    <div className="flex items-start justify-between gap-2 mb-1.5">
                      <div className="flex items-center gap-1.5 flex-1 min-w-0">
                        <span
                          className="w-2 h-2 rounded-full flex-shrink-0 mt-0.5"
                          style={{ backgroundColor: color, boxShadow: report.severity === "critical" ? `0 0 6px ${color}` : undefined }}
                        />
                        <h4 className="text-sm font-medium text-slate-200 group-hover:text-cyan-300 transition-colors truncate leading-snug">
                          {report.title}
                        </h4>
                      </div>
                      <ArrowUpRight className="w-3.5 h-3.5 text-slate-600 group-hover:text-cyan-400 transition-colors flex-shrink-0 mt-0.5" />
                    </div>
                    <div className="flex items-center justify-between pl-3.5">
                      <div className="flex items-center text-[11px] text-slate-500 gap-1">
                        <MapPin className="w-3 h-3" />
                        <span>{report.ward}</span>
                      </div>
                      <span className="text-[10px] text-slate-600">
                        {formatDistanceToNow(new Date(report.createdAt), { addSuffix: true })}
                      </span>
                    </div>
                    <div className="mt-2 pl-3.5">
                      <Badge
                        variant="outline"
                        className="text-[9px] px-1.5 py-0 h-4 font-semibold"
                        style={{ color, borderColor: `${color}40` }}
                      >
                        {report.severity.toUpperCase()}
                      </Badge>
                    </div>
                  </div>
                </Link>
              );
            })
          ) : (
            <div className="text-center py-16 text-slate-600">
              <MapPin className="w-10 h-10 mx-auto mb-3 opacity-20" />
              <p className="text-sm">No active reports</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
