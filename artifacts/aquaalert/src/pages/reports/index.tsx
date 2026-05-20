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
import { Search, MapPin, ExternalLink, Filter } from "lucide-react";

export default function Reports() {
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [severityFilter, setSeverityFilter] = useState<string>("all");
  const [search, setSearch] = useState("");

  const { data: reports, isLoading } = useListReports({
    status: statusFilter !== "all" ? (statusFilter as ListReportsStatus) : undefined,
    severity: severityFilter !== "all" ? (severityFilter as ListReportsSeverity) : undefined,
  });

  const filteredReports = reports?.filter(r => 
    search === "" || 
    r.title.toLowerCase().includes(search.toLowerCase()) || 
    r.ward.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="h-full w-full overflow-y-auto p-6 lg:p-10 bg-slate-950">
      <div className="max-w-7xl mx-auto space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-slate-100 mb-2">Report Directory</h1>
          <p className="text-slate-400">Search and filter through all reported water leaks.</p>
        </div>

        <div className="flex flex-col md:flex-row gap-4 p-4 bg-slate-900 border border-slate-800 rounded-xl shadow-lg">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <Input 
              placeholder="Search by title or ward..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 bg-slate-950 border-slate-800 text-slate-100 focus:border-cyan-500"
            />
          </div>
          <div className="flex gap-4">
            <Select value={severityFilter} onValueChange={setSeverityFilter}>
              <SelectTrigger className="w-[160px] bg-slate-950 border-slate-800 text-slate-200">
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
              <SelectTrigger className="w-[160px] bg-slate-950 border-slate-800 text-slate-200">
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

        <Card className="bg-slate-900 border-slate-800 shadow-xl">
          <CardContent className="p-0">
            <Table>
              <TableHeader className="bg-slate-950/50">
                <TableRow className="border-slate-800 hover:bg-transparent">
                  <TableHead className="text-slate-400 pl-6">ID & Title</TableHead>
                  <TableHead className="text-slate-400">Severity</TableHead>
                  <TableHead className="text-slate-400">Status</TableHead>
                  <TableHead className="text-slate-400">Location</TableHead>
                  <TableHead className="text-slate-400">Reported</TableHead>
                  <TableHead className="text-slate-400 pr-6 text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  Array.from({ length: 10 }).map((_, i) => (
                    <TableRow key={i} className="border-slate-800">
                      <TableCell className="pl-6"><Skeleton className="h-5 w-48" /></TableCell>
                      <TableCell><Skeleton className="h-6 w-20" /></TableCell>
                      <TableCell><Skeleton className="h-6 w-24" /></TableCell>
                      <TableCell><Skeleton className="h-5 w-32" /></TableCell>
                      <TableCell><Skeleton className="h-5 w-24" /></TableCell>
                      <TableCell className="pr-6 text-right"><Skeleton className="h-8 w-8 ml-auto" /></TableCell>
                    </TableRow>
                  ))
                ) : filteredReports && filteredReports.length > 0 ? (
                  filteredReports.map((report) => (
                    <TableRow key={report.id} className="border-slate-800 hover:bg-slate-800/50 transition-colors group cursor-pointer" onClick={() => window.location.href = `/reports/${report.id}`}>
                      <TableCell className="pl-6">
                        <div className="font-medium text-slate-200 group-hover:text-cyan-400 transition-colors">
                          {report.title}
                        </div>
                        <div className="text-xs text-slate-500 mt-1 font-mono">#{report.id.toString().padStart(5, '0')}</div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" style={{ color: SEVERITY_COLORS[report.severity as keyof typeof SEVERITY_COLORS], borderColor: SEVERITY_COLORS[report.severity as keyof typeof SEVERITY_COLORS] }}>
                          {report.severity.toUpperCase()}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center">
                          <span className="w-2 h-2 rounded-full mr-2" style={{ backgroundColor: STATUS_COLORS[report.status as keyof typeof STATUS_COLORS] }}></span>
                          <span className="text-sm font-medium" style={{ color: STATUS_COLORS[report.status as keyof typeof STATUS_COLORS] }}>
                            {report.status.replace("_", " ").replace(/\b\w/g, l => l.toUpperCase())}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center text-sm text-slate-300">
                          <MapPin className="w-3.5 h-3.5 mr-1.5 text-slate-500" />
                          {report.ward}
                        </div>
                      </TableCell>
                      <TableCell className="text-sm text-slate-400">
                        {format(new Date(report.createdAt), "MMM d, yyyy")}
                      </TableCell>
                      <TableCell className="pr-6 text-right">
                        <Link href={`/reports/${report.id}`}>
                          <div className="inline-flex items-center justify-center w-8 h-8 rounded-md bg-slate-800 text-slate-300 hover:bg-cyan-600 hover:text-white transition-colors">
                            <ExternalLink className="w-4 h-4" />
                          </div>
                        </Link>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-12">
                      <Filter className="w-12 h-12 text-slate-600 mx-auto mb-3" />
                      <p className="text-slate-400 text-lg">No reports found matching your criteria</p>
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
