import { motion } from "framer-motion";
import { Link } from "wouter";
import { MapPin, Send, Wrench, Droplets, Leaf, Trophy, Zap, Shield, CheckCircle, Clock, Users } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { useGetDashboardSummary } from "@workspace/api-client-react";

const STEPS = [
  {
    number: "01",
    icon: MapPin,
    color: "text-cyan-400",
    bg: "bg-cyan-500/10 border-cyan-500/25",
    glow: "shadow-[0_0_30px_rgba(6,182,212,0.15)]",
    title: "Spot a Leak",
    desc: "See water leaking from a pipe, overflowing from a tank, or flooding the road? Open AquaAlert on any device.",
    detail: "Works on mobile and desktop. No app download required — just open the website.",
  },
  {
    number: "02",
    icon: Send,
    color: "text-indigo-400",
    bg: "bg-indigo-500/10 border-indigo-500/25",
    glow: "shadow-[0_0_30px_rgba(99,102,241,0.15)]",
    title: "Report in 60 Seconds",
    desc: "Drop a pin on the exact spot, select the severity, write a short description, and hit Submit.",
    detail: "No signup needed. Just your name (optional) and location. Earn +10 Eco Points instantly.",
  },
  {
    number: "03",
    icon: Wrench,
    color: "text-emerald-400",
    bg: "bg-emerald-500/10 border-emerald-500/25",
    glow: "shadow-[0_0_30px_rgba(34,197,94,0.15)]",
    title: "Municipality Fixes It",
    desc: "Your report goes directly to the Brihanmumbai Municipal Corporation's Command Center for dispatch.",
    detail: "When resolved, the pin vanishes from the map. You can track status in 'My Reports'.",
  },
];

const POINTS_INFO = [
  { action: "Submit a report",          pts: "+10",  icon: Send },
  { action: "Report gets verified",     pts: "+15",  icon: CheckCircle },
  { action: "Report gets resolved",     pts: "+25",  icon: Droplets },
  { action: "First report of the week", pts: "+5",   icon: Zap },
];

const TIERS = [
  { tier: "Newcomer",  min: 0,   max: 49,  color: "bg-slate-700 text-slate-200",    desc: "Just getting started" },
  { tier: "Guardian",  min: 50,  max: 149, color: "bg-emerald-600 text-emerald-50", desc: "Active civic reporter" },
  { tier: "Hero",      min: 150, max: 349, color: "bg-indigo-500 text-indigo-50",   desc: "Committed water warrior" },
  { tier: "Champion",  min: 350, max: null, color: "bg-yellow-400 text-yellow-950", desc: "Mumbai water guardian" },
];

const cardVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({
    opacity: 1, y: 0,
    transition: { delay: i * 0.12, duration: 0.35, ease: [0.4, 0, 0.2, 1] },
  }),
};

export default function HowItWorks() {
  const { data: summary } = useGetDashboardSummary();

  return (
    <div className="h-full w-full overflow-y-auto bg-slate-950">
      <div className="max-w-3xl mx-auto p-6 lg:p-10 space-y-12">

        {/* Hero */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35 }}
          className="text-center"
        >
          <div className="inline-flex w-16 h-16 rounded-2xl bg-cyan-500/10 border border-cyan-500/25 items-center justify-center mb-5 shadow-[0_0_40px_rgba(6,182,212,0.2)]">
            <Droplets className="w-8 h-8 text-cyan-400" />
          </div>
          <h1 className="text-3xl font-black text-slate-100 mb-3">How AquaAlert Works</h1>
          <p className="text-slate-400 text-base leading-relaxed max-w-xl mx-auto">
            AquaAlert connects Mumbai citizens directly with the BMC to report and track water leaks — saving thousands of litres every week.
          </p>
        </motion.div>

        {/* Live impact bar */}
        {summary && (
          <motion.div
            initial={{ opacity: 0, scale: 0.97 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.15 }}
            className="grid grid-cols-3 gap-4"
          >
            {[
              { icon: Droplets, label: "Reports submitted", value: summary.totalReports, color: "text-cyan-400" },
              { icon: CheckCircle, label: "Resolved to date", value: summary.resolvedReports, color: "text-emerald-400" },
              { icon: Zap, label: "Litres saved (est.)", value: `${summary.nrwReductionEstimate}L`, color: "text-blue-400" },
            ].map(({ icon: Icon, label, value, color }) => (
              <Card key={label} className="bg-slate-900 border-slate-800">
                <CardContent className="p-4 text-center">
                  <Icon className={`w-5 h-5 mx-auto mb-2 ${color}`} />
                  <div className={`text-2xl font-black tabular-nums ${color}`}>{value}</div>
                  <p className="text-[10px] text-slate-500 uppercase tracking-wider mt-1">{label}</p>
                </CardContent>
              </Card>
            ))}
          </motion.div>
        )}

        {/* 3 Steps */}
        <div className="space-y-4">
          <h2 className="text-lg font-bold text-slate-300 flex items-center gap-2">
            <span className="w-1 h-5 bg-cyan-500 rounded-full" />
            Three simple steps
          </h2>
          {STEPS.map((step, i) => (
            <motion.div key={step.number} custom={i} variants={cardVariants} initial="hidden" animate="visible">
              <Card className={`bg-slate-900 border-slate-800 ${step.glow}`}>
                <CardContent className="p-6 flex gap-5">
                  <div className={`w-12 h-12 rounded-2xl border flex items-center justify-center flex-shrink-0 ${step.bg}`}>
                    <step.icon className={`w-5 h-5 ${step.color}`} />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <span className="text-[11px] font-black text-slate-600 tracking-widest">{step.number}</span>
                      <h3 className="text-base font-black text-slate-100">{step.title}</h3>
                    </div>
                    <p className="text-sm text-slate-300 leading-relaxed mb-2">{step.desc}</p>
                    <p className="text-xs text-slate-500 leading-relaxed">{step.detail}</p>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* Eco Points system */}
        <div className="space-y-4">
          <h2 className="text-lg font-bold text-slate-300 flex items-center gap-2">
            <span className="w-1 h-5 bg-yellow-500 rounded-full" />
            Earn Eco Points
          </h2>
          <Card className="bg-slate-900 border-slate-800">
            <CardContent className="p-6 space-y-3">
              <p className="text-sm text-slate-400 mb-4">
                Every action earns you points that build your reputation as a civic champion.
              </p>
              {POINTS_INFO.map(({ action, pts, icon: Icon }) => (
                <div key={action} className="flex items-center justify-between py-2.5 border-b border-slate-800/60 last:border-0">
                  <div className="flex items-center gap-3">
                    <Icon className="w-4 h-4 text-slate-500" />
                    <span className="text-sm text-slate-300">{action}</span>
                  </div>
                  <span className="text-sm font-black text-cyan-400">{pts}</span>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        {/* Tier system */}
        <div className="space-y-4">
          <h2 className="text-lg font-bold text-slate-300 flex items-center gap-2">
            <span className="w-1 h-5 bg-indigo-500 rounded-full" />
            Citizen Tiers
          </h2>
          <div className="grid grid-cols-2 gap-3">
            {TIERS.map((tier, i) => (
              <motion.div key={tier.tier} custom={i} variants={cardVariants} initial="hidden" animate="visible">
                <Card className="bg-slate-900 border-slate-800 h-full">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${tier.color}`}>{tier.tier}</span>
                    </div>
                    <p className="text-xs text-slate-400 mb-1">{tier.desc}</p>
                    <p className="text-[10px] text-slate-600">
                      {tier.max ? `${tier.min} – ${tier.max} points` : `${tier.min}+ points`}
                    </p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>

        {/* FAQ */}
        <div className="space-y-4">
          <h2 className="text-lg font-bold text-slate-300 flex items-center gap-2">
            <span className="w-1 h-5 bg-emerald-500 rounded-full" />
            Common questions
          </h2>
          {[
            {
              q: "Do I need to create an account?",
              a: "No. You can submit reports with just your name (optional). Your reports are linked to your name for tracking.",
            },
            {
              q: "What happens after I report?",
              a: "Your report appears instantly on the live map and is visible to other citizens. It's also sent to the BMC Command Center for dispatch.",
            },
            {
              q: "How do I track my reports?",
              a: "Visit 'My Reports' in the sidebar. Enter the name you used when submitting and you'll see all your reports with live status updates.",
            },
            {
              q: "What does 'Resolved' mean?",
              a: "The BMC team has repaired the leak and marked it resolved. Resolved reports are removed from the public map automatically.",
            },
            {
              q: "Can I report leaks outside Mumbai?",
              a: "AquaAlert currently serves Mumbai (Brihanmumbai Municipal Corporation jurisdiction) only.",
            },
          ].map(({ q, a }) => (
            <Card key={q} className="bg-slate-900 border-slate-800">
              <CardContent className="p-5">
                <h4 className="text-sm font-bold text-slate-200 mb-2">{q}</h4>
                <p className="text-sm text-slate-400 leading-relaxed">{a}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="text-center pb-4"
        >
          <Link href="/report">
            <motion.div
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              className="inline-flex items-center gap-2 bg-cyan-600 hover:bg-cyan-500 text-white px-8 py-3.5 rounded-2xl text-sm font-bold transition-colors shadow-[0_0_24px_rgba(6,182,212,0.35)] cursor-pointer"
            >
              <Droplets className="w-4 h-4" />
              Report a Leak Now
            </motion.div>
          </Link>
          <p className="text-xs text-slate-600 mt-3">Takes under 60 seconds · Earn Eco Points instantly</p>
        </motion.div>

      </div>
    </div>
  );
}
