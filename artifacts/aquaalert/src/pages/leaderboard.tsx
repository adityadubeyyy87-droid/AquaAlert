import { useListUsers } from "@workspace/api-client-react";
import { Trophy, Star, CheckCircle, Flame, ChevronUp } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { getBadgeColor, getBadgeTier, getNextTierInfo } from "@/lib/constants";
import { motion } from "framer-motion";

const PODIUM_CONFIG: Record<number, { ring: string; glow: string; bg: string; icon: React.ReactNode; height: string }> = {
  0: { ring: "ring-2 ring-yellow-400/70 shadow-[0_0_28px_rgba(250,204,21,0.25)]", glow: "shadow-[0_0_40px_rgba(250,204,21,0.1)]", bg: "from-yellow-500/10 to-transparent border-yellow-900/40", icon: <Trophy className="w-5 h-5 text-yellow-400" />, height: "pb-8" },
  1: { ring: "ring-2 ring-slate-400/50 shadow-[0_0_18px_rgba(148,163,184,0.15)]", glow: "", bg: "from-slate-400/6 to-transparent border-slate-700/40",   icon: <Star className="w-5 h-5 text-slate-300" />,   height: "pb-4" },
  2: { ring: "ring-2 ring-amber-700/50 shadow-[0_0_18px_rgba(180,83,9,0.1)]",    glow: "", bg: "from-amber-700/8 to-transparent border-amber-900/40",    icon: <Flame className="w-5 h-5 text-amber-500" />,  height: "pb-4" },
};

function PodiumCard({ user, rank }: { user: any; rank: number }) {
  const cfg = PODIUM_CONFIG[rank];
  const badgeTier = getBadgeTier(user.ecoPoints);
  const badgeColor = getBadgeColor(badgeTier);
  const next = getNextTierInfo(user.ecoPoints);
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: rank === 0 ? 0.1 : rank === 1 ? 0.2 : 0.3, duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
    >
      <Card className={`bg-gradient-to-b ${cfg.bg} border ${cfg.glow} relative overflow-hidden ${rank === 0 ? "-mt-6" : "mt-2"}`}>
        <div className="absolute top-3 right-3 opacity-70">{cfg.icon}</div>
        <CardContent className={`p-5 flex flex-col items-center text-center ${cfg.height}`}>
          <div className="text-3xl font-black text-slate-700 mb-3">#{rank + 1}</div>
          <Avatar className={`w-14 h-14 mb-3 ${cfg.ring}`}>
            <AvatarFallback className="bg-slate-800 text-slate-200 text-lg font-bold">
              {user.name.substring(0, 2).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <h4 className="font-bold text-slate-100 text-sm mb-1.5 leading-tight">{user.name}</h4>
          <Badge className={`${badgeColor} border-none text-[10px] font-bold px-2 mb-4`}>{badgeTier}</Badge>
          <div className="text-3xl font-black text-cyan-400 tabular-nums mb-0.5">{user.ecoPoints.toLocaleString()}</div>
          <p className="text-[10px] text-slate-600 mb-3">eco points</p>
          <div className="w-full flex justify-between text-[10px] text-slate-500 mb-2">
            <span>{user.reportsSubmitted} reports</span>
            <span className="text-green-400">{user.reportsVerified} verified</span>
          </div>
          {next.tier !== "Max" && (
            <div className="w-full">
              <div className="h-1 w-full bg-slate-800 rounded-full overflow-hidden">
                <motion.div
                  className="h-full bg-cyan-600 rounded-full"
                  initial={{ width: 0 }}
                  animate={{ width: `${next.pct}%` }}
                  transition={{ delay: 0.6, duration: 0.8, ease: "easeOut" }}
                />
              </div>
              <p className="text-[10px] text-slate-600 mt-1 flex items-center justify-center gap-0.5">
                <ChevronUp className="w-3 h-3" />{next.needed} pts to {next.tier}
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}

const listVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.07, delayChildren: 0.4 } },
};
const listItem = {
  hidden: { opacity: 0, x: -10 },
  visible: { opacity: 1, x: 0, transition: { duration: 0.25 } },
};

export default function Leaderboard() {
  const { data: users, isLoading } = useListUsers();
  const totalPoints = users?.reduce((s, u) => s + u.ecoPoints, 0) ?? 0;

  return (
    <div className="h-full w-full overflow-y-auto bg-slate-950">
      <div className="max-w-3xl mx-auto p-6 lg:p-10 space-y-8">

        {/* Header */}
        <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}
          className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-slate-100 mb-1.5 flex items-center gap-3">
              <Trophy className="w-7 h-7 text-yellow-400" /> Civic Champions
            </h1>
            <p className="text-slate-500 text-sm">Mumbai citizens saving water, one report at a time.</p>
          </div>
          <Card className="bg-slate-900 border-slate-800">
            <CardContent className="p-4 flex gap-5">
              <div className="text-center">
                <p className="text-[10px] text-slate-500 uppercase tracking-wider mb-1">Community</p>
                <p className="text-lg font-bold text-slate-200">{users?.length ?? "—"} citizens</p>
              </div>
              <div className="w-px bg-slate-800" />
              <div className="text-center">
                <p className="text-[10px] text-slate-500 uppercase tracking-wider mb-1">Total Points</p>
                <p className="text-lg font-bold text-cyan-400">{totalPoints.toLocaleString()}</p>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Podium */}
        {isLoading ? (
          <div className="grid grid-cols-3 gap-4">
            {[0, 1, 2].map(i => (
              <Card key={i} className="bg-slate-900 border-slate-800">
                <CardContent className="p-5 flex flex-col items-center gap-3">
                  <Skeleton className="w-14 h-14 rounded-full" />
                  <Skeleton className="h-4 w-24" /><Skeleton className="h-6 w-16" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : users && users.length >= 3 ? (
          <div className="grid grid-cols-3 gap-4 items-end">
            <PodiumCard user={users[1]} rank={1} />
            <PodiumCard user={users[0]} rank={0} />
            <PodiumCard user={users[2]} rank={2} />
          </div>
        ) : null}

        {/* Rest of list */}
        {users && users.length > 3 && (
          <Card className="bg-slate-900 border-slate-800 overflow-hidden">
            <CardHeader className="border-b border-slate-800 py-4 px-6">
              <CardTitle className="text-sm font-semibold text-slate-300">Other Contributors</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <motion.div variants={listVariants} initial="hidden" animate="visible" className="divide-y divide-slate-800/60">
                {users.slice(3).map((user, i) => {
                  const badgeTier = getBadgeTier(user.ecoPoints);
                  const badgeColor = getBadgeColor(badgeTier);
                  const next = getNextTierInfo(user.ecoPoints);
                  return (
                    <motion.div key={user.id} variants={listItem} className="flex items-center gap-4 px-6 py-4 hover:bg-slate-800/30 transition-colors">
                      <span className="text-lg font-black text-slate-600 w-6 text-center tabular-nums">{i + 4}</span>
                      <Avatar className="w-9 h-9 border border-slate-700">
                        <AvatarFallback className="bg-slate-800 text-slate-300 text-xs font-bold">
                          {user.name.substring(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-0.5">
                          <h4 className="text-sm font-bold text-slate-200 truncate">{user.name}</h4>
                          <Badge className={`${badgeColor} border-none text-[9px] font-bold px-1.5 py-0`}>{badgeTier}</Badge>
                        </div>
                        <div className="flex items-center gap-3 text-xs text-slate-500">
                          <span>{user.reportsSubmitted} reports</span>
                          <span className="flex items-center gap-1 text-green-400/70">
                            <CheckCircle className="w-3 h-3" />{user.reportsVerified} verified
                          </span>
                        </div>
                        {next.tier !== "Max" && (
                          <div className="mt-1.5 flex items-center gap-2">
                            <div className="h-1 w-20 bg-slate-800 rounded-full overflow-hidden">
                              <div className="h-full bg-cyan-800 rounded-full" style={{ width: `${next.pct}%` }} />
                            </div>
                            <span className="text-[10px] text-slate-600">{next.needed}pts to {next.tier}</span>
                          </div>
                        )}
                      </div>
                      <span className="text-base font-bold text-cyan-400 tabular-nums">
                        {user.ecoPoints} <span className="text-xs text-slate-600 font-normal">pts</span>
                      </span>
                    </motion.div>
                  );
                })}
              </motion.div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
