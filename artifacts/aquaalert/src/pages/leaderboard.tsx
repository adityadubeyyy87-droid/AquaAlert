import { useListUsers } from "@workspace/api-client-react";
import { Trophy, Medal, Award, CheckCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { getBadgeColor, getBadgeTier } from "@/lib/constants";
import { Badge } from "@/components/ui/badge";

export default function Leaderboard() {
  const { data: users, isLoading } = useListUsers();

  const getRankIcon = (index: number) => {
    switch(index) {
      case 0: return <Trophy className="w-6 h-6 text-yellow-400" />;
      case 1: return <Medal className="w-6 h-6 text-slate-300" />;
      case 2: return <Award className="w-6 h-6 text-amber-600" />;
      default: return <span className="font-bold text-slate-500 text-lg w-6 text-center">{index + 1}</span>;
    }
  };

  return (
    <div className="h-full w-full overflow-y-auto p-6 lg:p-10 bg-slate-950">
      <div className="max-w-4xl mx-auto space-y-8">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-slate-100 mb-2 flex items-center">
              <Trophy className="w-8 h-8 mr-3 text-cyan-500" />
              Civic Champions
            </h1>
            <p className="text-slate-400">Top citizens contributing to water conservation via reports.</p>
          </div>
          
          <Card className="bg-slate-900 border-slate-800 inline-block w-fit">
            <CardContent className="p-4 flex gap-6">
              <div className="text-center">
                <p className="text-xs text-slate-400 mb-1">Your Points</p>
                <p className="text-xl font-bold text-cyan-400">240</p>
              </div>
              <div className="w-px bg-slate-800"></div>
              <div className="text-center">
                <p className="text-xs text-slate-400 mb-1">Your Rank</p>
                <p className="text-xl font-bold text-slate-200">#42</p>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card className="bg-slate-900 border-slate-800 shadow-xl overflow-hidden">
          <CardHeader className="border-b border-slate-800 bg-slate-950/50">
            <CardTitle className="text-slate-100">Top 50 Contributors</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {isLoading ? (
              <div className="p-4 space-y-4">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="flex items-center gap-4 p-4">
                    <Skeleton className="w-8 h-8 rounded-full" />
                    <Skeleton className="w-12 h-12 rounded-full" />
                    <div className="space-y-2 flex-1">
                      <Skeleton className="h-5 w-32" />
                      <Skeleton className="h-4 w-20" />
                    </div>
                    <Skeleton className="h-8 w-24" />
                  </div>
                ))}
              </div>
            ) : users && users.length > 0 ? (
              <div className="divide-y divide-slate-800">
                {users.map((user, index) => {
                  const badgeTier = getBadgeTier(user.ecoPoints);
                  const badgeColor = getBadgeColor(badgeTier);
                  
                  return (
                    <div 
                      key={user.id} 
                      className={`flex items-center gap-4 p-4 transition-colors hover:bg-slate-800/50 ${index < 3 ? 'bg-slate-950/30' : ''}`}
                    >
                      <div className="w-10 flex justify-center">
                        {getRankIcon(index)}
                      </div>
                      
                      <Avatar className="w-12 h-12 border border-slate-700">
                        <AvatarImage src={user.avatarUrl || ''} />
                        <AvatarFallback className="bg-slate-800 text-slate-300">
                          {user.name.substring(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      
                      <div className="flex-1">
                        <h4 className="font-bold text-slate-100">{user.name}</h4>
                        <div className="flex items-center gap-3 mt-1 text-sm text-slate-400">
                          <span className="flex items-center">
                            <span className="w-1.5 h-1.5 rounded-full bg-slate-500 mr-1.5"></span>
                            {user.reportsSubmitted} Reports
                          </span>
                          <span className="flex items-center text-green-400/80">
                            <CheckCircle className="w-3 h-3 mr-1" />
                            {user.reportsVerified} Verified
                          </span>
                        </div>
                      </div>
                      
                      <div className="flex flex-col items-end gap-2">
                        <span className="text-xl font-bold text-cyan-400 font-mono">
                          {user.ecoPoints.toLocaleString()} <span className="text-xs text-slate-500 font-sans">pts</span>
                        </span>
                        <Badge className={`${badgeColor} border-none font-semibold text-[10px] px-2 py-0.5`}>
                          {badgeTier}
                        </Badge>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="p-12 text-center text-slate-500">
                <Trophy className="w-12 h-12 mx-auto mb-4 opacity-20" />
                <p>No contributors yet</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
