import { Link, useLocation } from "wouter";
import {
  Droplet, Map, Trophy, PlusCircle, Radio, Clock, Shield,
  User, HelpCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { useGetDashboardSummary } from "@workspace/api-client-react";

function LiveClock() {
  const [time, setTime] = useState(new Date());
  useEffect(() => {
    const t = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(t);
  }, []);
  const ist  = time.toLocaleTimeString("en-IN", { timeZone: "Asia/Kolkata", hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false });
  const date = time.toLocaleDateString("en-IN", { timeZone: "Asia/Kolkata", day: "numeric", month: "short", year: "numeric" });
  return (
    <div className="mx-4 mb-4 px-3 py-2.5 rounded-xl bg-slate-950/60 border border-slate-800/60">
      <div className="flex items-center gap-2 mb-0.5">
        <Clock className="w-3 h-3 text-slate-600" />
        <span className="text-[10px] font-semibold text-slate-600 uppercase tracking-widest">IST — Mumbai</span>
      </div>
      <div className="font-mono text-lg font-bold text-slate-300 tabular-nums leading-none">{ist}</div>
      <div className="text-[10px] text-slate-600 mt-0.5">{date}</div>
    </div>
  );
}

function ImpactTicker() {
  const { data: summary } = useGetDashboardSummary();
  if (!summary) return null;
  return (
    <div className="mx-4 mb-3 px-3 py-2 rounded-xl bg-blue-950/30 border border-blue-900/30">
      <div className="text-[10px] font-semibold text-blue-500/80 uppercase tracking-widest mb-1">Water Saved</div>
      <div className="flex items-baseline gap-1">
        <span className="text-lg font-black text-blue-400 tabular-nums">{summary.nrwReductionEstimate}L</span>
        <span className="text-[10px] text-blue-600">non-revenue water recovered</span>
      </div>
    </div>
  );
}

const PUBLIC_NAV = [
  { href: "/",             label: "Live Map",     icon: Map,        desc: "Real-time pins"  },
  { href: "/leaderboard",  label: "Leaderboard",  icon: Trophy,     desc: "Civic champions" },
  { href: "/my-reports",   label: "My Reports",   icon: User,       desc: "Your submissions" },
  { href: "/how-it-works", label: "How It Works", icon: HelpCircle, desc: "3-step guide"    },
];

const ADMIN_NAV = [
  { href: "/admin", label: "Municipality", icon: Shield, desc: "Command center" },
];

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();

  const isActive = (href: string) =>
    href === "/" ? location === "/" : location === href || location.startsWith(href + "/");

  const NavItem = ({ item, i }: { item: typeof PUBLIC_NAV[0]; i: number }) => {
    const active = isActive(item.href);
    return (
      <motion.div
        custom={i}
        initial={{ x: -12, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ delay: i * 0.05, duration: 0.22 }}
      >
        <Link href={item.href}>
          <div className={cn(
            "relative flex items-center px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 cursor-pointer group border",
            active
              ? "bg-cyan-950/50 text-cyan-300 border-cyan-900/60 shadow-[0_0_20px_rgba(6,182,212,0.1)]"
              : "text-slate-400 hover:text-slate-100 hover:bg-slate-800/60 border-transparent"
          )}>
            {active && (
              <motion.span layoutId="nav-indicator"
                className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 bg-cyan-400 rounded-r-full" />
            )}
            <item.icon className={cn("w-4 h-4 mr-3 flex-shrink-0 transition-colors", active ? "text-cyan-400" : "text-slate-500 group-hover:text-slate-300")} />
            <div>
              <div className="leading-none">{item.label}</div>
              <div className={cn("text-[10px] font-normal leading-none mt-0.5", active ? "text-cyan-600" : "text-slate-600 group-hover:text-slate-500")}>
                {item.desc}
              </div>
            </div>
          </div>
        </Link>
      </motion.div>
    );
  };

  return (
    <div className="flex h-screen w-full bg-slate-950 text-slate-50 overflow-hidden font-sans">
      {/* Sidebar */}
      <motion.aside
        initial={{ x: -20, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ duration: 0.35, ease: [0.4, 0, 0.2, 1] }}
        className="w-60 border-r border-slate-800 bg-slate-900/60 flex flex-col backdrop-blur-md relative z-20 shrink-0"
      >
        {/* Logo */}
        <div className="h-16 flex items-center px-5 border-b border-slate-800 gap-3">
          <div className="w-8 h-8 rounded-lg bg-cyan-500/15 border border-cyan-500/30 flex items-center justify-center shadow-[0_0_14px_rgba(6,182,212,0.3)]">
            <Droplet className="w-4 h-4 text-cyan-400" />
          </div>
          <div>
            <span className="font-bold text-lg tracking-tight text-slate-100">Aqua<span className="text-cyan-400">Alert</span></span>
            <div className="text-[9px] text-slate-600 font-medium tracking-widest uppercase -mt-0.5">Mumbai Water Grid</div>
          </div>
        </div>

        {/* Live badge */}
        <div className="mx-4 mt-4 mb-3 flex items-center gap-2 px-3 py-2 rounded-lg bg-green-950/40 border border-green-900/40">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500" />
          </span>
          <span className="text-xs font-semibold text-green-400">System Live</span>
          <Radio className="w-3 h-3 text-green-500 ml-auto" />
        </div>

        <LiveClock />

        {/* Public nav */}
        <nav className="flex-1 px-3 space-y-0.5 overflow-y-auto">
          {PUBLIC_NAV.map((item, i) => <NavItem key={item.href} item={item} i={i} />)}

          {/* Divider */}
          <div className="my-2 mx-2 border-t border-slate-800/60" />

          {/* Admin nav */}
          {ADMIN_NAV.map((item, i) => <NavItem key={item.href} item={item} i={PUBLIC_NAV.length + 1 + i} />)}
        </nav>

        <ImpactTicker />

        {/* CTA */}
        <div className="p-4 border-t border-slate-800">
          <Link href="/report">
            <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
              className="flex items-center justify-center w-full bg-cyan-600 hover:bg-cyan-500 text-white px-4 py-2.5 rounded-xl text-sm font-bold transition-colors shadow-[0_0_20px_rgba(6,182,212,0.3)] hover:shadow-[0_0_28px_rgba(6,182,212,0.5)] cursor-pointer gap-2">
              <PlusCircle className="w-4 h-4" />
              Report a Leak
            </motion.div>
          </Link>
          <p className="text-[10px] text-center text-slate-600 mt-2">Earn Eco Points for every report</p>
        </div>
      </motion.aside>

      {/* Main */}
      <main className="flex-1 relative overflow-hidden bg-slate-950">{children}</main>
    </div>
  );
}
