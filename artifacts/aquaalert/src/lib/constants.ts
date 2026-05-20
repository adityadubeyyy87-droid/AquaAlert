export const SEVERITY_COLORS = {
  critical: "#ef4444", // red
  high: "#f97316", // orange
  medium: "#eab308", // yellow
  low: "#3b82f6", // blue
} as const;

export const STATUS_COLORS = {
  pending: "#94a3b8",
  verified: "#6366f1",
  in_progress: "#f59e0b",
  resolved: "#22c55e",
  rejected: "#ef4444",
} as const;

export function getBadgeTier(points: number) {
  if (points >= 1500) return "Platinum";
  if (points >= 500) return "Gold";
  if (points >= 100) return "Silver";
  return "Bronze";
}

export function getBadgeColor(tier: string) {
  switch (tier.toLowerCase()) {
    case "platinum": return "bg-cyan-300 text-cyan-950";
    case "gold": return "bg-yellow-400 text-yellow-950";
    case "silver": return "bg-slate-300 text-slate-900";
    case "bronze": return "bg-amber-600 text-amber-50";
    default: return "bg-slate-800 text-slate-300";
  }
}
