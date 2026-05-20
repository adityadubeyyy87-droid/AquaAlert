import { useParams, Link } from "wouter";
import { useGetReport, useUpvoteReport, useUpdateReport, ReportUpdateStatus, ReportUpdateSeverity } from "@workspace/api-client-react";
import { format } from "date-fns";
import { MapContainer, TileLayer, Marker } from "react-leaflet";
import L from "leaflet";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { MapPin, ArrowLeft, ThumbsUp, Calendar, User, Info, CheckCircle2, ShieldAlert } from "lucide-react";
import { SEVERITY_COLORS, STATUS_COLORS } from "@/lib/constants";
import { useQueryClient } from "@tanstack/react-query";
import { getGetReportQueryKey } from "@workspace/api-client-react";

// Fix leaflet icon
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

export default function ReportDetail() {
  const { id } = useParams<{ id: string }>();
  const reportId = parseInt(id || "0", 10);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: report, isLoading } = useGetReport(reportId, {
    query: { enabled: !!reportId, queryKey: getGetReportQueryKey(reportId) }
  });

  const upvoteMutation = useUpvoteReport({
    mutation: {
      onSuccess: (data) => {
        queryClient.setQueryData(getGetReportQueryKey(reportId), data);
        toast({ title: "Upvoted!", description: "Thanks for verifying this report." });
      }
    }
  });

  const updateMutation = useUpdateReport({
    mutation: {
      onSuccess: (data) => {
        queryClient.setQueryData(getGetReportQueryKey(reportId), data);
        toast({ title: "Status Updated", description: "The report status has been updated." });
      }
    }
  });

  if (isLoading) {
    return (
      <div className="h-full w-full p-6 lg:p-10 bg-slate-950 space-y-6">
        <Skeleton className="h-10 w-32 mb-8" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <Skeleton className="h-[400px] w-full rounded-xl" />
            <Skeleton className="h-32 w-full rounded-xl" />
          </div>
          <div className="space-y-6">
            <Skeleton className="h-[300px] w-full rounded-xl" />
            <Skeleton className="h-48 w-full rounded-xl" />
          </div>
        </div>
      </div>
    );
  }

  if (!report) {
    return (
      <div className="h-full w-full flex flex-col items-center justify-center p-6 bg-slate-950 text-center">
        <ShieldAlert className="w-16 h-16 text-red-500 mb-4" />
        <h2 className="text-2xl font-bold text-slate-100 mb-2">Report Not Found</h2>
        <p className="text-slate-400 mb-6">The report you're looking for doesn't exist or has been removed.</p>
        <Link href="/reports">
          <Button className="bg-cyan-600 hover:bg-cyan-500 text-white">Back to Directory</Button>
        </Link>
      </div>
    );
  }

  const handleStatusChange = (newStatus: string) => {
    updateMutation.mutate({
      id: reportId,
      data: { status: newStatus as ReportUpdateStatus }
    });
  };

  const handleSeverityChange = (newSeverity: string) => {
    updateMutation.mutate({
      id: reportId,
      data: { severity: newSeverity as ReportUpdateSeverity }
    });
  };

  return (
    <div className="h-full w-full overflow-y-auto p-6 lg:p-10 bg-slate-950">
      <div className="max-w-6xl mx-auto">
        <div className="mb-6 flex items-center">
          <Link href="/reports">
            <div className="flex items-center text-slate-400 hover:text-cyan-400 cursor-pointer transition-colors text-sm font-medium">
              <ArrowLeft className="w-4 h-4 mr-1" /> Back to List
            </div>
          </Link>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
          {/* Left Column - Main Details */}
          <div className="xl:col-span-2 space-y-8">
            <div>
              <div className="flex flex-wrap items-center gap-3 mb-4">
                <Badge className="px-3 py-1 text-sm font-medium" style={{ backgroundColor: `${STATUS_COLORS[report.status as keyof typeof STATUS_COLORS]}20`, color: STATUS_COLORS[report.status as keyof typeof STATUS_COLORS] }}>
                  {report.status.replace("_", " ").toUpperCase()}
                </Badge>
                <Badge variant="outline" className="px-3 py-1 text-sm font-medium border-2" style={{ color: SEVERITY_COLORS[report.severity as keyof typeof SEVERITY_COLORS], borderColor: SEVERITY_COLORS[report.severity as keyof typeof SEVERITY_COLORS] }}>
                  {report.severity.toUpperCase()} SEVERITY
                </Badge>
                <div className="text-slate-500 text-sm font-mono ml-auto">
                  REPORT #{report.id.toString().padStart(5, '0')}
                </div>
              </div>
              <h1 className="text-3xl lg:text-4xl font-bold text-slate-100 mb-4 leading-tight">{report.title}</h1>
              <div className="flex flex-wrap items-center gap-6 text-sm text-slate-400">
                <div className="flex items-center">
                  <MapPin className="w-4 h-4 mr-2 text-slate-500" />
                  {report.ward}
                </div>
                <div className="flex items-center">
                  <Calendar className="w-4 h-4 mr-2 text-slate-500" />
                  {format(new Date(report.createdAt), "MMM d, yyyy 'at' h:mm a")}
                </div>
                <div className="flex items-center">
                  <User className="w-4 h-4 mr-2 text-slate-500" />
                  {report.reporterName || "Anonymous Citizen"}
                </div>
              </div>
            </div>

            <Card className="bg-slate-900 border-slate-800 shadow-lg overflow-hidden">
              <div className="h-[400px] w-full relative z-0">
                <MapContainer 
                  center={[report.latitude, report.longitude]} 
                  zoom={15} 
                  className="w-full h-full"
                >
                  <TileLayer
                    url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
                  />
                  <Marker position={[report.latitude, report.longitude]} />
                </MapContainer>
              </div>
              <div className="p-4 bg-slate-950 flex justify-between items-center text-sm font-mono text-slate-500">
                <span>LAT: {report.latitude.toFixed(6)}</span>
                <span>LNG: {report.longitude.toFixed(6)}</span>
              </div>
            </Card>

            <div>
              <h3 className="text-xl font-bold text-slate-100 mb-3 flex items-center">
                <Info className="w-5 h-5 mr-2 text-cyan-500" /> Description
              </h3>
              <div className="p-6 bg-slate-900 border border-slate-800 rounded-xl text-slate-300 leading-relaxed whitespace-pre-wrap">
                {report.description}
              </div>
            </div>
            
            {report.imageUrl && (
              <div>
                <h3 className="text-xl font-bold text-slate-100 mb-3">Attached Image</h3>
                <img src={report.imageUrl} alt="Leak site" className="rounded-xl border border-slate-800 max-w-full h-auto max-h-[500px] object-cover" />
              </div>
            )}
          </div>

          {/* Right Column - Actions & Admin */}
          <div className="space-y-6">
            <Card className="bg-slate-900 border-slate-800 shadow-lg shadow-cyan-900/10">
              <CardContent className="p-6">
                <h3 className="font-bold text-slate-100 mb-2">Citizen Verification</h3>
                <p className="text-sm text-slate-400 mb-6">If you are at this location and can verify the leak, please upvote.</p>
                
                <div className="flex items-center justify-between p-4 bg-slate-950 rounded-lg border border-slate-800 mb-4">
                  <div className="flex items-center gap-3">
                    <div className="bg-cyan-950 p-2 rounded-md text-cyan-400">
                      <CheckCircle2 className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-slate-100 leading-none">{report.upvotes}</div>
                      <div className="text-xs text-slate-500 font-medium">VERIFICATIONS</div>
                    </div>
                  </div>
                  <Button 
                    onClick={() => upvoteMutation.mutate({ id: reportId })}
                    disabled={upvoteMutation.isPending}
                    className="bg-cyan-600 hover:bg-cyan-500 text-white"
                  >
                    <ThumbsUp className="w-4 h-4 mr-2" />
                    Verify
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-slate-900 border-slate-800 shadow-lg border-l-4 border-l-cyan-500">
              <CardContent className="p-6 space-y-6">
                <div>
                  <h3 className="font-bold text-slate-100 mb-1">Authority Controls</h3>
                  <p className="text-xs text-slate-500">Update status and severity as work progresses.</p>
                </div>

                <div className="space-y-3">
                  <label className="text-sm font-medium text-slate-300">Update Status</label>
                  <Select value={report.status} onValueChange={handleStatusChange}>
                    <SelectTrigger className="bg-slate-950 border-slate-800 text-slate-200">
                      <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-900 border-slate-800 text-slate-200">
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="verified">Verified</SelectItem>
                      <SelectItem value="in_progress">In Progress</SelectItem>
                      <SelectItem value="resolved">Resolved</SelectItem>
                      <SelectItem value="rejected">Rejected</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-3">
                  <label className="text-sm font-medium text-slate-300">Reclassify Severity</label>
                  <Select value={report.severity} onValueChange={handleSeverityChange}>
                    <SelectTrigger className="bg-slate-950 border-slate-800 text-slate-200">
                      <SelectValue placeholder="Severity" />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-900 border-slate-800 text-slate-200">
                      <SelectItem value="critical">Critical</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="low">Low</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
