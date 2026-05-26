import { useState, useEffect } from "react";
import { Link } from "wouter";
import { useListReports, Report } from "@workspace/api-client-react";
import { motion, AnimatePresence } from "framer-motion";
import { format, formatDistanceToNow } from "date-fns";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { getBadgeTier, getBadgeColor, SEVERITY_COLORS, STATUS_COLORS } from "@/lib/constants";
import {
  User, Search, MapPin, Clock, ThumbsUp, Leaf, Trophy,
  CheckCircle, ArrowUpRight, FileX, ChevronUp,
} from "lucide-react";

const REPORTER_NAME_KEY = "aquaalert_reporter_name";

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

function EcoPointsCard({ reports }: { reports: Report[] }) {
  const pts = reports.length * 10
    + reports.filter(r => r.status === "verified" || r.status === "in_progress").length * 15
    + reports.filter(r => r.status === "resolved").length * 25;
  const tier = getBadgeTier(pts);
  const color = getBadgeColor(tier);

  const resolved = reports.filter(r => r.status === "resolved").length;
  const active   = reports.filter(r => r.status !== "resolved" && r.status !== "rejected").length;

  return (
    <Card className="bg-slate-900 border-slate-800">
      <CardContent className="p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Leaf className="w-4 h-4 text-cyan-400" />
            <h3 className="text-sm font-bold text-slate-200">Your Impact</h3>
          </div>
          <span className={`text-[11px] font-black px-2 py-0.5 rounded-full ${color}`}>{tier}</span>
        </div>
        <div className="grid grid-cols-3 gap-3 mb-4">
          <div className="text-center p-3 bg-slate-950/60 rounded-xl border border-slate-800/40">
            <div className="text-xl font-black text-cyan-400 tabular-nums">{pts}</div>
            <div className="text-[10px] text-slate-500 mt-0.5">Eco Points</div>
          </div>
          <div className="text-center p-3 bg-slate-950/60 rounded-xl border border-slate-800/40">
            <div className="text-xl font-black text-emerald-400 tabular-nums">{resolved}</div>
            <div className="text-[10px] text-slate-500 mt-0.5">Resolved</div>
          </div>
          <div className="text-center p-3 bg-slate-950/60 rounded-xl border border-slate-800/40">
            <div className="text-xl font-black text-amber-400 tabular-nums">{active}</div>
            <div className="text-[10px] text-slate-500 mt-0.5">Active</div>
          </div>
        </div>
        <div className="flex items-center gap-2 text-xs text-slate-500">
          <Trophy className="w-3.5 h-3.5 text-yellow-400" />
          <span>Check the <Link href="/leaderboard"><span className="text-cyan-400 hover:underline cursor-pointer">Leaderboard</span></Link> to see your ranking</span>
        </div>
      </CardContent>
    </Card>
  );
}

export default function MyReports() {
  const [inputName, setInputName] = useState("");
  const [activeName, setActiveName] = useState<string | null>(null);

  useEffect(() => {
    const saved = localStorage.getItem(REPORTER_NAME_KEY);
    if (saved) {
      setInputName(saved);
      setActiveName(saved);
    }
  }, []);

  const { data: allReports, isLoading } = useListReports();

  const myReports: Report[] = activeName
    ? (allReports ?? []).filter(r =>
        r.reporterName?.toLowerCase().trim() === activeName.toLowerCase().trim()
      )
    : [];

  const handleSearch = () => {
    const name = inputName.trim();
    if (!name) return;
    setActiveName(name);
    localStorage.setItem(REPORTER_NAME_KEY, name);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") handleSearch();
  };

  return (
    <div className="h-full w-full overflow-y-auto bg-slate-950">
      <div className="max-w-2xl mx-auto p-6 lg:p-10 space-y-7">

        {/* Header */}
        <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
          <h1 className="text-3xl font-black text-slate-100 mb-1.5 flex items-center gap-3">
            <User className="w-7 h-7 text-cyan-400" /> My Reports
          </h1>
          <p className="text-slate-500 text-sm">Track the status of every leak you've reported across Mumbai.</p>
        </motion.div>

        {/* Name lookup */}
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <Card className="bg-slate-900 border-slate-800">
            <CardContent className="p-5">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-3">
                Your Name
              </label>
              <div className="flex gap-3">
                <div className="relative flex-1">
                  <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                  <Input
                    value={inputName}
                    onChange={e => setInputName(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Enter the name you used when reporting…"
                    className="pl-10 bg-slate-950 border-slate-800 text-slate-100 focus:border-cyan-600 rounded-xl h-10"
                  />
                </div>
                <Button
                  onClick={handleSearch}
                  disabled={!inputName.trim()}
                  className="bg-cyan-600 hover:bg-cyan-500 text-white rounded-xl px-5 h-10"
                >
                  <Search className="w-4 h-4" />
                </Button>
              </div>
              <p className="text-[11px] text-slate-600 mt-2">
                Reports are matched by the name you entered at submission time.
              </p>
            </CardContent>
          </Card>
        </motion.div>

        <AnimatePresence mode="wait">
          {activeName && !isLoading && (
            <motion.div
              key={activeName}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="space-y-5"
            >
              {myReports.length > 0 ? (
                <>
                  <EcoPointsCard reports={myReports} />

                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <h2 className="text-sm font-bold text-slate-300">
                        {myReports.length} report{myReports.length !== 1 ? "s" : ""} by{" "}
                        <span className="text-cyan-400">{activeName}</span>
                      </h2>
                    </div>

                    <div className="space-y-2">
                      {myReports.map((report, idx) => (
                        <motion.div
                          key={report.id}
                          initial={{ opacity: 0, y: 6 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.2, delay: idx * 0.04 }}
                        >
                          <Link href={`/reports/${report.id}`}>
                            <div className={`group p-4 rounded-2xl border transition-all cursor-pointer hover:border-slate-700 ${
                              report.status === "resolved"
                                ? "border-green-900/40 bg-green-950/10"
                                : report.severity === "critical"
                                ? "border-red-900/30 bg-slate-900/60"
                                : "border-slate-800 bg-slate-900/60"
                            }`}>
                              <div className="flex items-start justify-between gap-2 mb-2">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <SeverityBadge severity={report.severity} />
                                  <StatusBadge status={report.status} />
                                </div>
                                <ArrowUpRight className="w-4 h-4 text-slate-600 group-hover:text-cyan-400 transition-colors flex-shrink-0 mt-0.5" />
                              </div>

                              <h3 className="font-bold text-slate-100 text-sm leading-snug mb-2 group-hover:text-cyan-300 transition-colors">
                                {report.title}
                              </h3>

                              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500">
                                <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{report.ward}</span>
                                <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{formatDistanceToNow(new Date(report.createdAt), { addSuffix: true })}</span>
                                <span>{format(new Date(report.createdAt), "MMM d, yyyy")}</span>
                                <span className="flex items-center gap-1"><ThumbsUp className="w-3 h-3" />{report.upvotes} verified</span>
                              </div>

                              {report.status === "resolved" && report.resolvedAt && (
                                <div className="mt-2 flex items-center gap-1.5 text-xs text-emerald-400">
                                  <CheckCircle className="w-3.5 h-3.5" />
                                  Resolved {formatDistanceToNow(new Date(report.resolvedAt), { addSuffix: true })}
                                </div>
                              )}
                            </div>
                          </Link>
                        </motion.div>
                      ))}
                    </div>
                  </div>
                </>
              ) : (
                <div className="text-center py-16">
                  <FileX className="w-12 h-12 text-slate-700 mx-auto mb-4" />
                  <h3 className="text-slate-300 font-bold mb-2">No reports found for "{activeName}"</h3>
                  <p className="text-slate-500 text-sm mb-6">
                    Make sure the name matches exactly what you typed when submitting.
                  </p>
                  <Link href="/report">
                    <motion.div
                      whileHover={{ scale: 1.03 }}
                      whileTap={{ scale: 0.97 }}
                      className="inline-flex items-center gap-2 bg-cyan-600 hover:bg-cyan-500 text-white px-6 py-2.5 rounded-xl text-sm font-bold cursor-pointer"
                    >
                      Submit your first report
                    </motion.div>
                  </Link>
                </div>
              )}
            </motion.div>
          )}

          {!activeName && !isLoading && (
            <motion.div
              key="empty"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-16"
            >
              <User className="w-12 h-12 text-slate-700 mx-auto mb-4" />
              <h3 className="text-slate-400 font-bold mb-2">Enter your name above</h3>
              <p className="text-slate-600 text-sm">
                Use the same name you submitted your reports with.
              </p>
            </motion.div>
          )}

          {isLoading && (
            <motion.div key="loading" className="space-y-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="p-4 rounded-2xl border border-slate-800 bg-slate-900/60">
                  <div className="flex gap-2 mb-2">
                    <Skeleton className="h-5 w-16 rounded-full" />
                    <Skeleton className="h-5 w-20 rounded-full" />
                  </div>
                  <Skeleton className="h-4 w-3/4 mb-2" />
                  <Skeleton className="h-3 w-1/2" />
                </div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>

      </div>
    </div>
  );
}
