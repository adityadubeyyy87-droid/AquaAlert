import { useState } from "react";
import { Link } from "wouter";
import { useListReports, Report, ListReportsStatus, ListReportsSeverity } from "@workspace/api-client-react";
import { format } from "date-fns";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { SEVERITY_COLORS, STATUS_COLORS } from "@/lib/constants";
import { Search, MapPin, ExternalLink, FileX } from "lucide-react";

function SeverityBadge({ severity }: { severity: string }) {
  const color = SEVERITY_COLORS[severity as keyof typeof SEVERITY_COLORS] ?? "#94a3b8";
  return (
    <Badge
      variant="outline"
      className="text-[10px] font-bold px-2 py-0.5 uppercase tracking-wide"
      style={{ color, borderColor: `${color}50`, backgroundColor: `${color}0f` }}
    >
      {severity}
    </Badge>
  );
}

function StatusDot({ status }: { status: string }) {
  const color = STATUS_COLORS[status as keyof typeof STATUS_COLORS] ?? "#94a3b8";
  const label = status.replace("_", " ").replace(/\b\w/g, (l) => l.toUpperCase());
  return (
    <div className="flex items-center gap-2">
      <span
        className="w-1.5 h-1.5 rounded-full flex-shrink-0"
        style={{ backgroundColor: color, boxShadow: `0 0 4px ${color}80` }}
      />
      <span className="text-xs font-medium" style={{ color }}>{label}</span>
    </div>
  );
}

export default function Reports() {
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [severityFilter, setSeverityFilter] = useState<string>("all");
  const [search, setSearch] = useState("");

  const { data: reports, isLoading } = useListReports({
    status: statusFilter !== "all" ? (statusFilter as ListReportsStatus) : undefined,
    severity: severityFilter !== "all" ? (severityFilter as ListReportsSeverity) : undefined,
  });

  const filteredReports = reports?.filter(
    (r) =>
      search === "" ||
      r.title.toLowerCase().includes(search.toLowerCase()) ||
      r.ward.toLowerCase().includes(search.toLowerCase())
  );

  const isFiltered = statusFilter !== "all" || severityFilter !== "all" || search !== "";

  return (
    <div className="h-full w-full overflow-y-auto bg-slate-950">
      <div className="max-w-7xl mx-auto p-6 lg:p-10 space-y-6">

        {/* Header */}
        <div className="flex items-end justify-between">
          <div>
            <h1 className="text-3xl font-bold text-slate-100 mb-1">Report Directory</h1>
            <p className="text-slate-500 text-sm">Search and filter all reported water leaks across Mumbai.</p>
          </div>
          {!isLoading && reports && (
            <span className="text-sm font-bold bg-slate-900 border border-slate-800 text-slate-400 px-3 py-1.5 rounded-lg tabular-nums">
              {filteredReports?.length ?? 0}
              <span className="text-slate-600 font-normal ml-1">
                {isFiltered ? "matching" : "total"} report{(filteredReports?.length ?? 0) !== 1 ? "s" : ""}
              </span>
            </span>
          )}
        </div>

        {/* Filters */}
        <div className="flex flex-col md:flex-row gap-3 p-4 bg-slate-900/80 border border-slate-800 rounded-2xl">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <Input
              placeholder="Search by title or ward…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10 bg-slate-950 border-slate-800 text-slate-100 focus:border-cyan-600 focus:ring-0 rounded-xl h-10"
            />
          </div>
          <div className="flex gap-3">
            <Select value={severityFilter} onValueChange={setSeverityFilter}>
              <SelectTrigger className="w-[150px] bg-slate-950 border-slate-800 text-slate-300 rounded-xl h-10">
                <SelectValue placeholder="Severity" />
              </SelectTrigger>
              <SelectContent className="bg-slate-900 border-slate-800 text-slate-200">
                <SelectItem value="all">All Severities</SelectItem>
                <SelectItem value="critical">Critical</SelectItem>
                <SelectItem value="high">High</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="low">Low</SelectItem>
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[150px] bg-slate-950 border-slate-800 text-slate-300 rounded-xl h-10">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent className="bg-slate-900 border-slate-800 text-slate-200">
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="verified">Verified</SelectItem>
                <SelectItem value="in_progress">In Progress</SelectItem>
                <SelectItem value="resolved">Resolved</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Table */}
        <Card className="bg-slate-900 border-slate-800 shadow-xl overflow-hidden">
          <CardContent className="p-0">
            <Table>
              <TableHeader className="bg-slate-950/60 border-b border-slate-800">
                <TableRow className="hover:bg-transparent">
                  <TableHead className="pl-6 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Report</TableHead>
                  <TableHead className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Severity</TableHead>
                  <TableHead className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Status</TableHead>
                  <TableHead className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Ward</TableHead>
                  <TableHead className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Reported</TableHead>
                  <TableHead className="pr-6 text-[11px] font-semibold text-slate-500 uppercase tracking-wider text-right">Upvotes</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  Array.from({ length: 8 }).map((_, i) => (
                    <TableRow key={i} className="border-slate-800/60">
                      <TableCell className="pl-6"><Skeleton className="h-4 w-48" /></TableCell>
                      <TableCell><Skeleton className="h-5 w-16 rounded-full" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-28" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                      <TableCell className="pr-6"><Skeleton className="h-4 w-8 ml-auto" /></TableCell>
                    </TableRow>
                  ))
                ) : filteredReports && filteredReports.length > 0 ? (
                  filteredReports.map((report: Report) => (
                    <TableRow
                      key={report.id}
                      className="border-slate-800/60 hover:bg-slate-800/40 transition-colors cursor-pointer group"
                      onClick={() => (window.location.href = `/reports/${report.id}`)}
                    >
                      <TableCell className="pl-6 py-4">
                        <div className="font-semibold text-sm text-slate-200 group-hover:text-cyan-300 transition-colors leading-snug">
                          {report.title}
                        </div>
                        <div className="text-[10px] text-slate-600 mt-0.5 font-mono">
                          #{report.id.toString().padStart(5, "0")}
                        </div>
                      </TableCell>
                      <TableCell><SeverityBadge severity={report.severity} /></TableCell>
                      <TableCell><StatusDot status={report.status} /></TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1.5 text-sm text-slate-400">
                          <MapPin className="w-3 h-3 text-slate-600 flex-shrink-0" />
                          {report.ward}
                        </div>
                      </TableCell>
                      <TableCell className="text-xs text-slate-500">
                        {format(new Date(report.createdAt), "MMM d, yyyy")}
                      </TableCell>
                      <TableCell className="pr-6">
                        <div className="flex items-center justify-end gap-2">
                          <span className="text-xs font-bold text-slate-400 tabular-nums">{report.upvotes}</span>
                          <Link href={`/reports/${report.id}`}>
                            <div className="w-7 h-7 rounded-lg bg-slate-800 text-slate-400 hover:bg-cyan-600 hover:text-white transition-colors flex items-center justify-center">
                              <ExternalLink className="w-3.5 h-3.5" />
                            </div>
                          </Link>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-16">
                      <FileX className="w-10 h-10 text-slate-700 mx-auto mb-3" />
                      <p className="text-slate-400 font-medium">No reports match your filters</p>
                      <p className="text-slate-600 text-sm mt-1">Try adjusting the search or filter criteria</p>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
