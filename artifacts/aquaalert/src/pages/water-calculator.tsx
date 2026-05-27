import { useState, useMemo } from "react";
import { Link } from "wouter";
import { motion } from "framer-motion";
import { Droplet, Droplets, AlertTriangle, Zap, ArrowRight, Calculator } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/contexts/LanguageContext";

const LEAK_TYPES = [
  {
    id: "drip",
    label: "Minor Drip",
    sublabel: "Slow, occasional drops",
    emoji: "💧",
    icon: Droplet,
    litresPerHour: 4,
    color: "#3b82f6",
    bg: "bg-blue-950/40 border-blue-900/40",
    activeBg: "bg-blue-950/70 border-blue-500/60",
  },
  {
    id: "steady",
    label: "Steady Drip",
    sublabel: "Continuous slow flow",
    emoji: "🌊",
    icon: Droplets,
    litresPerHour: 28,
    color: "#eab308",
    bg: "bg-yellow-950/40 border-yellow-900/40",
    activeBg: "bg-yellow-950/70 border-yellow-500/60",
  },
  {
    id: "stream",
    label: "Flowing Leak",
    sublabel: "Strong continuous stream",
    emoji: "⚠️",
    icon: AlertTriangle,
    litresPerHour: 150,
    color: "#f97316",
    bg: "bg-orange-950/40 border-orange-900/40",
    activeBg: "bg-orange-950/70 border-orange-500/60",
  },
  {
    id: "burst",
    label: "Burst Pipe",
    sublabel: "Major flooding or burst",
    emoji: "🚨",
    icon: Zap,
    litresPerHour: 480,
    color: "#ef4444",
    bg: "bg-red-950/40 border-red-900/40",
    activeBg: "bg-red-950/70 border-red-500/60",
  },
] as const;

const DURATIONS = [
  { label: "1 hour",   hours: 1        },
  { label: "6 hours",  hours: 6        },
  { label: "1 day",    hours: 24       },
  { label: "1 week",   hours: 24 * 7   },
  { label: "1 month",  hours: 24 * 30  },
  { label: "1 year",   hours: 24 * 365 },
];

function formatLitres(l: number): string {
  if (l >= 1_000_000) return `${(l / 1_000_000).toFixed(2)}M L`;
  if (l >= 1_000)     return `${(l / 1_000).toFixed(1)}K L`;
  return `${Math.round(l)} L`;
}

function ComparisonBar({ label, value, max, color }: { label: string; value: number; max: number; color: string }) {
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-xs">
        <span className="text-slate-400">{label}</span>
        <span className="font-bold tabular-nums" style={{ color }}>{Math.round(value).toLocaleString()}</span>
      </div>
      <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
        <motion.div
          className="h-full rounded-full"
          style={{ backgroundColor: color }}
          initial={{ width: 0 }}
          animate={{ width: `${Math.min(100, (value / max) * 100)}%` }}
          transition={{ duration: 0.6, ease: "easeOut" }}
        />
      </div>
    </div>
  );
}

export default function WaterCalculator() {
  const { t } = useLanguage();
  const [selectedType, setSelectedType] = useState<typeof LEAK_TYPES[number]["id"]>("steady");
  const [selectedDuration, setSelectedDuration] = useState(2);

  const leakType = LEAK_TYPES.find(l => l.id === selectedType)!;
  const duration = DURATIONS[selectedDuration];

  const totalLitres  = useMemo(() => leakType.litresPerHour * duration.hours, [leakType, duration]);
  const perDay       = leakType.litresPerHour * 24;
  const perWeek      = perDay * 7;
  const perMonth     = perDay * 30;
  const perYear      = perDay * 365;

  const waterBottles = Math.round(totalLitres / 0.5);
  const buckets      = Math.round(totalLitres / 15);
  const showers      = Math.round(totalLitres / 50);
  const costRs       = (totalLitres * 0.005).toFixed(2);
  const schoolKids   = Math.round(totalLitres / 2.5);

  const maxComparison = Math.max(waterBottles, buckets, showers, schoolKids, 1);

  const healthColor = leakType.id === "burst" ? "#ef4444" : leakType.id === "stream" ? "#f97316" : leakType.id === "steady" ? "#eab308" : "#3b82f6";

  return (
    <div className="h-full w-full overflow-y-auto bg-slate-950">
      <div className="max-w-2xl mx-auto p-6 lg:p-10 space-y-8">

        {/* Header */}
        <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
          <div className="flex items-center gap-3 mb-3">
            <div className="w-12 h-12 rounded-2xl bg-cyan-500/10 border border-cyan-500/25 flex items-center justify-center shadow-[0_0_30px_rgba(6,182,212,0.2)]">
              <Calculator className="w-6 h-6 text-cyan-400" />
            </div>
            <div>
              <h1 className="text-2xl font-black text-slate-100">Water Waste Calculator</h1>
              <p className="text-sm text-slate-500">See exactly how much water an unrepaired leak wastes — in real numbers.</p>
            </div>
          </div>
        </motion.div>

        {/* Leak type selector */}
        <div className="space-y-3">
          <h2 className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
            <span className="w-1 h-4 bg-cyan-500 rounded-full" />Select Leak Type
          </h2>
          <div className="grid grid-cols-2 gap-3">
            {LEAK_TYPES.map((type, i) => {
              const active = selectedType === type.id;
              return (
                <motion.button
                  key={type.id}
                  onClick={() => setSelectedType(type.id)}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.07, duration: 0.25 }}
                  className={`text-left p-4 rounded-2xl border-2 transition-all cursor-pointer ${active ? type.activeBg : type.bg}`}
                  style={{ borderColor: active ? type.color : undefined, boxShadow: active ? `0 0 20px ${type.color}20` : undefined }}
                >
                  <div className="flex items-start gap-3">
                    <span className="text-2xl">{type.emoji}</span>
                    <div>
                      <div className="text-sm font-bold text-slate-100">{type.label}</div>
                      <div className="text-xs text-slate-500 mt-0.5">{type.sublabel}</div>
                      <div className="text-xs font-black mt-2" style={{ color: type.color }}>{type.litresPerHour} L/hr</div>
                    </div>
                  </div>
                </motion.button>
              );
            })}
          </div>
        </div>

        {/* Duration selector */}
        <div className="space-y-3">
          <h2 className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
            <span className="w-1 h-4 bg-indigo-500 rounded-full" />Duration
          </h2>
          <div className="flex gap-2 flex-wrap">
            {DURATIONS.map((d, i) => (
              <button
                key={d.label}
                onClick={() => setSelectedDuration(i)}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all border ${
                  selectedDuration === i
                    ? "bg-cyan-600 text-white border-cyan-500 shadow-[0_0_12px_rgba(6,182,212,0.3)]"
                    : "bg-slate-900 text-slate-400 border-slate-800 hover:text-slate-200 hover:border-slate-700"
                }`}
              >
                {d.label}
              </button>
            ))}
          </div>
        </div>

        {/* Results */}
        <motion.div key={`${selectedType}-${selectedDuration}`} initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.25 }}>
          <Card className="bg-slate-900 border-slate-800 overflow-hidden">
            <div className="h-1.5 w-full" style={{ background: `linear-gradient(to right, ${healthColor}88, ${healthColor})` }} />
            <CardHeader className="pb-4 pt-5 px-6">
              <CardTitle className="text-sm font-semibold text-slate-300">
                A <span style={{ color: healthColor }}>{leakType.label.toLowerCase()}</span> left unrepaired for <span className="text-slate-100">{duration.label}</span> wastes:
              </CardTitle>
            </CardHeader>
            <CardContent className="px-6 pb-6 space-y-5">
              {/* Big number */}
              <div className="text-center py-6 bg-slate-950/60 rounded-2xl border border-slate-800">
                <motion.div
                  key={totalLitres}
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ type: "spring", bounce: 0.4 }}
                  className="text-5xl font-black tabular-nums mb-1"
                  style={{ color: healthColor }}
                >
                  {formatLitres(totalLitres)}
                </motion.div>
                <div className="text-sm text-slate-500">of water wasted</div>
                <div className="text-xs text-slate-600 mt-1">≈ ₹{costRs} at municipal tariff</div>
              </div>

              {/* Rate breakdown */}
              <div className="grid grid-cols-4 gap-2">
                {[
                  { label: "Per Day",   value: perDay   },
                  { label: "Per Week",  value: perWeek  },
                  { label: "Per Month", value: perMonth },
                  { label: "Per Year",  value: perYear  },
                ].map(({ label, value }) => (
                  <div key={label} className="text-center p-2.5 bg-slate-950/50 rounded-xl border border-slate-800/60">
                    <div className="text-xs font-black tabular-nums text-slate-200">{formatLitres(value)}</div>
                    <div className="text-[9px] text-slate-600 mt-0.5">{label}</div>
                  </div>
                ))}
              </div>

              {/* Visual comparisons */}
              <div>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">Equivalent to…</p>
                <div className="space-y-3">
                  <ComparisonBar label="🍾 500ml water bottles"       value={waterBottles} max={maxComparison} color="#06b6d4" />
                  <ComparisonBar label="🪣 Standard 15L buckets"      value={buckets}      max={maxComparison} color="#8b5cf6" />
                  <ComparisonBar label="🚿 Showers (50L each)"        value={showers}      max={maxComparison} color="#22c55e" />
                  <ComparisonBar label="🧒 Children's daily drinking" value={schoolKids}   max={maxComparison} color="#f59e0b" />
                </div>
                <p className="text-[10px] text-slate-600 mt-2">* Based on WHO recommendation of 2.5L per child per day for drinking</p>
              </div>

              {/* Impact message */}
              <div className={`p-4 rounded-xl border text-sm ${
                leakType.id === "burst" ? "bg-red-950/30 border-red-900/40 text-red-300" :
                leakType.id === "stream" ? "bg-orange-950/30 border-orange-900/40 text-orange-300" :
                "bg-amber-950/30 border-amber-900/40 text-amber-300"
              }`}>
                {leakType.id === "burst"  && "🚨 A burst pipe can waste an entire month's household supply in just 3 days. Report immediately."}
                {leakType.id === "stream" && "⚠️ A flowing leak wastes more than a family of 4 uses in a month. Every hour matters."}
                {leakType.id === "steady" && "💧 Even a steady drip wastes over 10,000L a year — enough for 4,000 school children's daily drinking."}
                {leakType.id === "drip"   && "💧 A minor drip seems small, but adds up to 1,460L per year. Reporting saves water for everyone."}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* CTA */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }} className="text-center pb-4">
          <Link href="/report">
            <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
              className="inline-flex items-center gap-2 bg-cyan-600 hover:bg-cyan-500 text-white px-8 py-3.5 rounded-2xl text-sm font-bold transition-colors shadow-[0_0_24px_rgba(6,182,212,0.35)] cursor-pointer">
              <Droplets className="w-4 h-4" />
              Report This Leak Now
              <ArrowRight className="w-4 h-4" />
            </motion.div>
          </Link>
          <p className="text-xs text-slate-600 mt-3">Takes under 60 seconds · Earn +10 Eco Points</p>
        </motion.div>

      </div>
    </div>
  );
}
