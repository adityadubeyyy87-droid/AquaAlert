export const SEVERITY_COLORS = {
  critical: "#ef4444",
  high: "#f97316",
  medium: "#eab308",
  low: "#3b82f6",
} as const;

export const STATUS_COLORS = {
  pending: "#94a3b8",
  verified: "#6366f1",
  in_progress: "#f59e0b",
  resolved: "#22c55e",
  rejected: "#ef4444",
} as const;

export function getBadgeTier(points: number) {
  if (points >= 350) return "Platinum";
  if (points >= 150) return "Gold";
  if (points >= 50)  return "Silver";
  return "Bronze";
}

export function getBadgeColor(tier: string) {
  switch (tier.toLowerCase()) {
    case "platinum": return "bg-cyan-300 text-cyan-950";
    case "gold":     return "bg-yellow-400 text-yellow-950";
    case "silver":   return "bg-slate-300 text-slate-900";
    case "bronze":   return "bg-amber-700 text-amber-50";
    default:         return "bg-slate-800 text-slate-300";
  }
}

export function getNextTierInfo(points: number): { tier: string; needed: number; pct: number } {
  if (points < 50)  return { tier: "Silver",   needed: 50 - points,  pct: Math.round((points / 50) * 100) };
  if (points < 150) return { tier: "Gold",     needed: 150 - points, pct: Math.round(((points - 50) / 100) * 100) };
  if (points < 350) return { tier: "Platinum", needed: 350 - points, pct: Math.round(((points - 150) / 200) * 100) };
  return { tier: "Max", needed: 0, pct: 100 };
}
