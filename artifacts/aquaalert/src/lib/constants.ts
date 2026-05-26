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
  if (points >= 350) return "Champion";
  if (points >= 150) return "Hero";
  if (points >= 50)  return "Guardian";
  return "Newcomer";
}

export function getBadgeColor(tier: string) {
  switch (tier.toLowerCase()) {
    case "champion": return "bg-yellow-400 text-yellow-950";
    case "hero":     return "bg-indigo-500 text-indigo-50";
    case "guardian": return "bg-emerald-600 text-emerald-50";
    case "newcomer": return "bg-slate-700 text-slate-200";
    default:         return "bg-slate-800 text-slate-300";
  }
}

export function getNextTierInfo(points: number): { tier: string; needed: number; pct: number } {
  if (points < 50)  return { tier: "Guardian", needed: 50 - points,  pct: Math.round((points / 50) * 100) };
  if (points < 150) return { tier: "Hero",     needed: 150 - points, pct: Math.round(((points - 50) / 100) * 100) };
  if (points < 350) return { tier: "Champion", needed: 350 - points, pct: Math.round(((points - 150) / 200) * 100) };
  return { tier: "Max", needed: 0, pct: 100 };
}

export const MUMBAI_WARDS = [
  "Andheri West", "Andheri East", "Bandra West", "Bandra East",
  "Juhu", "Dadar", "Powai", "Borivali", "Malad West", "Malad East",
  "Kandivali East", "Kandivali West", "Worli", "Chembur", "Kurla",
  "Ghatkopar", "Santacruz East", "Santacruz West", "Goregaon East",
  "Goregaon West", "Vikhroli", "Mulund", "Bhandup", "Khar",
] as const;
