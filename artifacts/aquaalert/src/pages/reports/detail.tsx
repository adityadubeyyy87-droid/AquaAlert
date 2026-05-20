import { useParams, Link } from "wouter";
import { useGetReport, useUpvoteReport, useUpdateReport, ReportUpdateStatus, ReportUpdateSeverity } from "@workspace/api-client-react";
import { format, formatDistanceToNow } from "date-fns";
import { MapContainer, TileLayer, CircleMarker } from "react-leaflet";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import {
  MapPin, ArrowLeft, ThumbsUp, Calendar, User, Info, ShieldAlert,
  CheckCircle2, CheckCircle, Clock, Wrench, FileText, Droplets, AlertTriangle,
} from "lucide-react";
import { SEVERITY_COLORS, STATUS_COLORS } from "@/lib/constants";
import { useQueryClient } from "@tanstack/react-query";
import { getGetReportQueryKey } from "@workspace/api-client-react";
import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";

const WASTE_RATE: Record<string, number> = { critical: 480, high: 150, medium: 28, low: 4 };

const STATUS_STEPS = [
  { key: "pending",     label: "Reported",   desc: "Report received",     icon: FileText },
  { key: "verified",   label: "Verified",    desc: "Citizens confirmed",  icon: CheckCircle2 },
  { key: "in_progress",label: "Dispatched",  desc: "Team en route",       icon: Wrench },
  { key: "resolved",   label: "Resolved",    desc: "Leak fixed",          icon: CheckCircle },
];

function StatusTimeline({ status }: { status: string }) {
  if (status === "rejected") {
    return (
      <div className="flex items-center gap-3 py-3 px-4 bg-red-950/30 border border-red-900/30 rounded-xl">
        <ShieldAlert className="w-5 h-5 text-red-400 flex-shrink-0" />
        <div>
          <p className="text-sm font-semibold text-red-400">Report Rejected</p>
          <p className="text-xs text-slate-500">Could not be verified by field team</p>
        </div>
      </div>
    );
  }
  const currentIdx = STATUS_STEPS.findIndex(s => s.key === status);
  return (
    <div className="relative">
      <div className="flex items-start justify-between relative">
        {/* connector line */}
        <div className="absolute top-5 left-5 right-5 h-0.5 bg-slate-800 z-0" />
        <motion.div
          className="absolute top-5 left-5 h-0.5 bg-cyan-600 z-0"
          initial={{ width: 0 }}
          animate={{ width: currentIdx === 0 ? 0 : `${(currentIdx / (STATUS_STEPS.length - 1)) * (100 - (10 / STATUS_STEPS.length))}%` }}
          transition={{ duration: 0.8, delay: 0.3, ease: "easeOut" }}
        />
        {STATUS_STEPS.map((step, i) => {
          const done = i <= currentIdx;
          const active = i === currentIdx;
          return (
            <div key={step.key} className="flex flex-col items-center gap-2 z-10 flex-1">
              <motion.div
                initial={{ scale: 0.6, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: i * 0.12, duration: 0.3 }}
                className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all ${
                  active ? "border-cyan-400 bg-cyan-950 shadow-[0_0_16px_rgba(6,182,212,0.4)]"
                  : done ? "border-green-500 bg-green-950/50"
                  : "border-slate-700 bg-slate-900"
                }`}
              >
                <step.icon className={`w-4 h-4 ${active ? "text-cyan-400" : done ? "text-green-400" : "text-slate-600"}`} />
              </motion.div>
              <div className="text-center">
                <p className={`text-xs font-bold ${active ? "text-cyan-300" : done ? "text-green-400" : "text-slate-600"}`}>{step.label}</p>
                <p className="text-[10px] text-slate-600 mt-0.5">{step.desc}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function WasteEstimate({ severity, createdAt, status }: { severity: string; createdAt: string; status: string }) {
  if (status === "resolved") return null;
  const hours = Math.round((Date.now() - new Date(createdAt).getTime()) / 3_600_000);
  const liters = Math.round(WASTE_RATE[severity] * hours);
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.5 }}
      className="p-4 bg-red-950/20 border border-red-900/30 rounded-xl"
    >
      <div className="flex items-center gap-2 mb-2">
        <Droplets className="w-4 h-4 text-red-400" />
        <h4 className="text-sm font-bold text-red-300">Estimated Water Waste</h4>
      </div>
      <div className="flex items-baseline gap-2 mb-1">
        <span className="text-3xl font-black text-red-400 tabular-nums">{liters.toLocaleString()}L</span>
        <span className="text-xs text-slate-500">wasted in ~{hours}h open</span>
      </div>
      <p className="text-[11px] text-slate-500">
        At ~{WASTE_RATE[severity]}L/hr for a <span className="capitalize font-semibold text-red-400">{severity}</span> severity leak.
        Every hour matters.
      </p>
    </motion.div>
  );
}

export default function ReportDetail() {
  const { id } = useParams<{ id: string }>();
  const reportId = parseInt(id || "0", 10);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [upvoted, setUpvoted] = useState(false);

  const { data: report, isLoading } = useGetReport(reportId, {
    query: { enabled: !!reportId, queryKey: getGetReportQueryKey(reportId) },
  });

  const upvoteMutation = useUpvoteReport({
    mutation: {
      onSuccess: (data) => {
        queryClient.setQueryData(getGetReportQueryKey(reportId), data);
        setUpvoted(true);
        toast({ title: "✓ Verified!", description: "Thanks for confirming this report." });
      },
    },
  });

  const updateMutation = useUpdateReport({
    mutation: {
      onSuccess: (data) => {
        queryClient.setQueryData(getGetReportQueryKey(reportId), data);
        toast({ title: "Status updated", description: "Report has been updated successfully." });
      },
    },
  });

  if (isLoading) {
    return (
      <div className="h-full w-full p-6 lg:p-10 bg-slate-950 space-y-6 overflow-y-auto">
        <Skeleton className="h-8 w-28 mb-4" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-5"><Skeleton className="h-64 rounded-2xl" /><Skeleton className="h-32 rounded-2xl" /></div>
          <div className="space-y-5"><Skeleton className="h-48 rounded-2xl" /><Skeleton className="h-48 rounded-2xl" /></div>
        </div>
      </div>
    );
  }

  if (!report) {
    return (
      <div className="h-full flex flex-col items-center justify-center p-6 bg-slate-950 text-center">
        <ShieldAlert className="w-16 h-16 text-red-500 mb-4 opacity-60" />
        <h2 className="text-2xl font-bold text-slate-100 mb-2">Report Not Found</h2>
        <p className="text-slate-400 mb-6">This report doesn't exist or has been removed.</p>
        <Link href="/reports"><Button className="bg-cyan-600 hover:bg-cyan-500 text-white">Back to Directory</Button></Link>
      </div>
    );
  }

  const severityColor = SEVERITY_COLORS[report.severity as keyof typeof SEVERITY_COLORS];
  const statusColor = STATUS_COLORS[report.status as keyof typeof STATUS_COLORS];

  return (
    <div className="h-full w-full overflow-y-auto bg-slate-950">
      <div className="max-w-6xl mx-auto p-6 lg:p-10">

        {/* Breadcrumb */}
        <motion.div initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} className="mb-6">
          <Link href="/reports">
            <div className="inline-flex items-center text-slate-400 hover:text-cyan-400 cursor-pointer transition-colors text-sm font-medium gap-1.5">
              <ArrowLeft className="w-4 h-4" /> Back to Directory
            </div>
          </Link>
        </motion.div>

        {/* Hero header */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}
          className="mb-8 p-6 rounded-2xl border border-slate-800 bg-slate-900/60 relative overflow-hidden">
          <div className="absolute inset-0 opacity-[0.04] pointer-events-none" style={{ background: `radial-gradient(ellipse at 0% 0%, ${severityColor}, transparent 70%)` }} />
          <div className="flex flex-wrap items-center gap-3 mb-4">
            <Badge className="px-3 py-1 text-xs font-bold border-0" style={{ backgroundColor: `${statusColor}20`, color: statusColor }}>
              ● {report.status.replace("_", " ").toUpperCase()}
            </Badge>
            <Badge variant="outline" className="px-3 py-1 text-xs font-bold border-2" style={{ color: severityColor, borderColor: severityColor }}>
              {report.severity.toUpperCase()} SEVERITY
            </Badge>
            <span className="ml-auto text-xs text-slate-600 font-mono">REPORT #{report.id.toString().padStart(5, "0")}</span>
          </div>
          <h1 className="text-2xl lg:text-3xl font-black text-slate-100 mb-5 leading-tight">{report.title}</h1>
          <div className="flex flex-wrap gap-5 text-sm text-slate-400">
            <span className="flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5 text-slate-500" />{report.ward}</span>
            <span className="flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5 text-slate-500" />{format(new Date(report.createdAt), "MMM d, yyyy 'at' h:mm a")}</span>
            <span className="flex items-center gap-1.5"><User className="w-3.5 h-3.5 text-slate-500" />{report.reporterName || "Anonymous Citizen"}</span>
            <span className="flex items-center gap-1.5"><Clock className="w-3.5 h-3.5 text-slate-500" />{formatDistanceToNow(new Date(report.createdAt), { addSuffix: true })}</span>
          </div>
        </motion.div>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          {/* Left column */}
          <div className="xl:col-span-2 space-y-6">

            {/* Map */}
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.12 }}>
              <Card className="bg-slate-900 border-slate-800 overflow-hidden">
                <div className="h-[320px] relative z-0">
                  <MapContainer center={[report.latitude, report.longitude]} zoom={15} className="w-full h-full" zoomControl={false}>
                    <TileLayer url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png" />
                    <CircleMarker
                      center={[report.latitude, report.longitude]}
                      radius={14}
                      pathOptions={{ color: "white", fillColor: severityColor, fillOpacity: 0.85, weight: 2.5 }}
                    />
                    <CircleMarker
                      center={[report.latitude, report.longitude]}
                      radius={24}
                      pathOptions={{ color: severityColor, fillColor: severityColor, fillOpacity: 0.12, weight: 1 }}
                    />
                  </MapContainer>
                </div>
                <div className="px-5 py-3 bg-slate-950/80 flex justify-between items-center text-xs font-mono text-slate-500">
                  <span>LAT {report.latitude.toFixed(6)}</span>
                  <span className="text-slate-700">●</span>
                  <span>LNG {report.longitude.toFixed(6)}</span>
                </div>
              </Card>
            </motion.div>

            {/* Status timeline */}
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.18 }}>
              <Card className="bg-slate-900 border-slate-800">
                <CardHeader className="border-b border-slate-800 py-4 px-6">
                  <CardTitle className="text-sm font-semibold text-slate-300">Resolution Progress</CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                  <StatusTimeline status={report.status} />
                </CardContent>
              </Card>
            </motion.div>

            {/* Description */}
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.22 }}>
              <Card className="bg-slate-900 border-slate-800">
                <CardHeader className="border-b border-slate-800 py-4 px-6">
                  <CardTitle className="text-sm font-semibold text-slate-300 flex items-center gap-2">
                    <Info className="w-4 h-4 text-cyan-400" /> Description
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                  <p className="text-slate-300 leading-relaxed text-sm">{report.description}</p>
                </CardContent>
              </Card>
            </motion.div>

            {/* Waste estimate */}
            <WasteEstimate severity={report.severity} createdAt={report.createdAt} status={report.status} />
          </div>

          {/* Right column */}
          <div className="space-y-5">

            {/* Upvote card */}
            <motion.div initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.15 }}>
              <Card className="bg-slate-900 border-slate-800">
                <CardContent className="p-6">
                  <h3 className="font-bold text-slate-100 mb-1">Citizen Verification</h3>
                  <p className="text-xs text-slate-400 mb-5">At this location and can see the leak? Verify it.</p>
                  <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 mb-4 flex items-center justify-between">
                    <div>
                      <div className="text-3xl font-black text-slate-100 tabular-nums leading-none">
                        <AnimatePresence mode="wait">
                          <motion.span key={report.upvotes} initial={{ y: -10, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 10, opacity: 0 }}>
                            {report.upvotes}
                          </motion.span>
                        </AnimatePresence>
                      </div>
                      <div className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mt-0.5">verifications</div>
                    </div>
                    <div className="text-right">
                      <div className="text-xs text-slate-500 mb-1">community trust</div>
                      <div className="flex gap-0.5">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <div key={i} className="w-5 h-1.5 rounded-full" style={{ backgroundColor: i < Math.min(Math.ceil(report.upvotes / 5), 5) ? "#06b6d4" : "#1e293b" }} />
                        ))}
                      </div>
                    </div>
                  </div>
                  <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}>
                    <Button
                      onClick={() => upvoteMutation.mutate({ id: reportId })}
                      disabled={upvoteMutation.isPending || upvoted}
                      className={`w-full gap-2 font-bold ${upvoted ? "bg-green-700 hover:bg-green-700 text-white" : "bg-cyan-600 hover:bg-cyan-500 text-white"}`}
                    >
                      <ThumbsUp className="w-4 h-4" />
                      {upvoted ? "Verified ✓" : "Verify This Report"}
                    </Button>
                  </motion.div>
                  {upvoted && <p className="text-[11px] text-center text-green-400 mt-2">+5 Eco Points earned</p>}
                </CardContent>
              </Card>
            </motion.div>

            {/* Authority controls */}
            <motion.div initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.22 }}>
              <Card className="bg-slate-900 border-slate-800 border-l-4" style={{ borderLeftColor: severityColor }}>
                <CardContent className="p-6 space-y-5">
                  <div>
                    <h3 className="font-bold text-slate-100 mb-0.5 flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4" style={{ color: severityColor }} />
                      Authority Controls
                    </h3>
                    <p className="text-[11px] text-slate-500">Update status as work progresses.</p>
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Update Status</label>
                    <Select value={report.status} onValueChange={v => updateMutation.mutate({ id: reportId, data: { status: v as ReportUpdateStatus } })}>
                      <SelectTrigger className="bg-slate-950 border-slate-800 text-slate-200 rounded-xl">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-slate-900 border-slate-800 text-slate-200">
                        {["pending", "verified", "in_progress", "resolved", "rejected"].map(s => (
                          <SelectItem key={s} value={s}>{s.replace("_", " ").replace(/\b\w/g, l => l.toUpperCase())}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Reclassify Severity</label>
                    <Select value={report.severity} onValueChange={v => updateMutation.mutate({ id: reportId, data: { severity: v as ReportUpdateSeverity } })}>
                      <SelectTrigger className="bg-slate-950 border-slate-800 text-slate-200 rounded-xl">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-slate-900 border-slate-800 text-slate-200">
                        {["critical", "high", "medium", "low"].map(s => (
                          <SelectItem key={s} value={s} style={{ color: SEVERITY_COLORS[s as keyof typeof SEVERITY_COLORS] }}>
                            {s.charAt(0).toUpperCase() + s.slice(1)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  {updateMutation.isPending && <p className="text-xs text-cyan-400 animate-pulse text-center">Saving…</p>}
                </CardContent>
              </Card>
            </motion.div>

            {/* Quick stats */}
            <motion.div initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.3 }}>
              <Card className="bg-slate-900 border-slate-800">
                <CardContent className="p-5 space-y-3">
                  <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Report Details</h4>
                  {[
                    { label: "Report ID",    value: `#${report.id.toString().padStart(5, "0")}` },
                    { label: "Ward",         value: report.ward },
                    { label: "Reporter",     value: report.reporterName || "Anonymous" },
                    { label: "Filed",        value: format(new Date(report.createdAt), "MMM d, yyyy") },
                    { label: "Last Updated", value: formatDistanceToNow(new Date(report.updatedAt), { addSuffix: true }) },
                  ].map(({ label, value }) => (
                    <div key={label} className="flex justify-between items-center text-sm">
                      <span className="text-slate-500">{label}</span>
                      <span className="text-slate-300 font-medium text-right">{value}</span>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
}
