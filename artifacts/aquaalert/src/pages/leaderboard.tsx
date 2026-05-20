import { useListUsers } from "@workspace/api-client-react";
import { Trophy, Star, CheckCircle, Flame, ChevronUp } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { getBadgeColor, getBadgeTier, getNextTierInfo } from "@/lib/constants";

const PODIUM_RING: Record<number, string> = {
  0: "ring-2 ring-yellow-400/60 shadow-[0_0_24px_rgba(250,204,21,0.2)]",
  1: "ring-2 ring-slate-400/50 shadow-[0_0_16px_rgba(148,163,184,0.15)]",
  2: "ring-2 ring-amber-700/50 shadow-[0_0_16px_rgba(180,83,9,0.15)]",
};

const PODIUM_LABEL: Record<number, { icon: React.ReactNode; glow: string; bg: string }> = {
  0: { icon: <Trophy className="w-5 h-5 text-yellow-400" />, glow: "shadow-[0_0_30px_rgba(250,204,21,0.15)]", bg: "from-yellow-500/8 to-transparent border-yellow-900/30" },
  1: { icon: <Star className="w-5 h-5 text-slate-300" />,   glow: "shadow-[0_0_20px_rgba(148,163,184,0.1)]",  bg: "from-slate-400/6 to-transparent border-slate-700/50" },
  2: { icon: <Flame className="w-5 h-5 text-amber-600" />,  glow: "shadow-[0_0_20px_rgba(180,83,9,0.1)]",    bg: "from-amber-700/6 to-transparent border-amber-900/40" },
};

function PodiumCard({ user, rank }: { user: any; rank: number }) {
  const badgeTier = getBadgeTier(user.ecoPoints);
  const badgeColor = getBadgeColor(badgeTier);
  const { icon, glow, bg } = PODIUM_LABEL[rank];
  const next = getNextTierInfo(user.ecoPoints);

  return (
    <Card className={`bg-gradient-to-b ${bg} border ${glow} relative overflow-hidden ${rank === 0 ? "-mt-5" : "mt-2"}`}>
      <div className="absolute top-3 right-3 opacity-60">{icon}</div>
      <CardContent className="p-5 flex flex-col items-center text-center">
        <div className="text-2xl font-black text-slate-600 mb-3">#{rank + 1}</div>
        <Avatar className={`w-14 h-14 mb-3 ${PODIUM_RING[rank]}`}>
          <AvatarFallback className="bg-slate-800 text-slate-200 text-lg font-bold">
            {user.name.substring(0, 2).toUpperCase()}
          </AvatarFallback>
        </Avatar>
        <h4 className="font-bold text-slate-100 text-sm mb-1 leading-tight">{user.name}</h4>
        <Badge className={`${badgeColor} border-none text-[10px] font-bold px-2 mb-3`}>{badgeTier}</Badge>
        <div className="text-2xl font-black text-cyan-400 tabular-nums mb-0.5">
          {user.ecoPoints.toLocaleString()}
        </div>
        <p className="text-[10px] text-slate-600 mb-3">eco points</p>
        <div className="w-full text-[10px] text-slate-500 flex justify-between mb-1">
          <span>{user.reportsSubmitted} reports</span>
          <span className="text-green-400">{user.reportsVerified} verified</span>
        </div>
        {next.tier !== "Max" && (
          <div className="w-full">
            <div className="h-1 w-full bg-slate-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-cyan-600 rounded-full transition-all"
                style={{ width: `${next.pct}%` }}
              />
            </div>
            <p className="text-[10px] text-slate-600 mt-1 flex items-center justify-center gap-0.5">
              <ChevronUp className="w-3 h-3" />{next.needed} pts to {next.tier}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default function Leaderboard() {
  const { data: users, isLoading } = useListUsers();

  return (
    <div className="h-full w-full overflow-y-auto bg-slate-950">
      <div className="max-w-3xl mx-auto p-6 lg:p-10 space-y-8">

        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-slate-100 mb-1.5 flex items-center gap-3">
              <Trophy className="w-7 h-7 text-yellow-400" />
              Civic Champions
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
                <p className="text-lg font-bold text-cyan-400">
                  {users ? users.reduce((s, u) => s + u.ecoPoints, 0).toLocaleString() : "—"}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Podium */}
        {isLoading ? (
          <div className="grid grid-cols-3 gap-4">
            {[1, 0, 2].map((i) => (
              <Card key={i} className="bg-slate-900 border-slate-800">
                <CardContent className="p-5 flex flex-col items-center gap-3">
                  <Skeleton className="w-14 h-14 rounded-full" />
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-6 w-16" />
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
              <div className="divide-y divide-slate-800/60">
                {users.slice(3).map((user, i) => {
                  const badgeTier = getBadgeTier(user.ecoPoints);
                  const badgeColor = getBadgeColor(badgeTier);
                  const next = getNextTierInfo(user.ecoPoints);
                  return (
                    <div key={user.id} className="flex items-center gap-4 px-6 py-4 hover:bg-slate-800/30 transition-colors">
                      <span className="text-base font-black text-slate-600 w-6 text-center tabular-nums">{i + 4}</span>
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
                          <div className="mt-2 flex items-center gap-2">
                            <div className="h-1 w-24 bg-slate-800 rounded-full overflow-hidden">
                              <div className="h-full bg-cyan-800 rounded-full" style={{ width: `${next.pct}%` }} />
                            </div>
                            <span className="text-[10px] text-slate-600">{next.needed}pts to {next.tier}</span>
                          </div>
                        )}
                      </div>
                      <span className="text-base font-bold text-cyan-400 tabular-nums">
                        {user.ecoPoints} <span className="text-xs text-slate-600 font-normal">pts</span>
                      </span>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
