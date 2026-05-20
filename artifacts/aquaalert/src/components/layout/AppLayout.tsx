import { Link, useLocation } from "wouter";
import { Droplet, Activity, Map, Trophy, List, PlusCircle, Radio } from "lucide-react";
import { cn } from "@/lib/utils";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();

  const navItems = [
    { href: "/",           label: "Live Map",     icon: Map,      desc: "Real-time pins" },
    { href: "/dashboard",  label: "Dashboard",    icon: Activity, desc: "Command center" },
    { href: "/reports",    label: "All Reports",  icon: List,     desc: "Report directory" },
    { href: "/leaderboard",label: "Leaderboard",  icon: Trophy,   desc: "Civic champions" },
  ];

  return (
    <div className="flex h-screen w-full bg-slate-950 text-slate-50 overflow-hidden font-sans">
      <aside className="w-64 border-r border-slate-800 bg-slate-900/60 flex flex-col backdrop-blur-md relative z-20">
        {/* Logo */}
        <div className="h-16 flex items-center px-5 border-b border-slate-800 gap-3">
          <div className="w-8 h-8 rounded-lg bg-cyan-500/15 border border-cyan-500/30 flex items-center justify-center shadow-[0_0_12px_rgba(6,182,212,0.25)]">
            <Droplet className="w-4 h-4 text-cyan-400" />
          </div>
          <span className="font-bold text-lg tracking-tight text-slate-100">
            Aqua<span className="text-cyan-400">Alert</span>
          </span>
        </div>

        {/* Live status */}
        <div className="mx-4 mt-4 flex items-center gap-2 px-3 py-2 rounded-lg bg-green-950/40 border border-green-900/40">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
          </span>
          <span className="text-xs font-medium text-green-400">Live — Mumbai City</span>
          <Radio className="w-3 h-3 text-green-500 ml-auto" />
        </div>

        {/* Nav */}
        <nav className="flex-1 py-5 px-3 space-y-1">
          {navItems.map((item) => {
            const isActive = location === item.href || (item.href !== "/" && location.startsWith(item.href));
            return (
              <Link key={item.href} href={item.href}>
                <div className={cn(
                  "relative flex items-center px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 cursor-pointer group",
                  isActive
                    ? "bg-cyan-950/50 text-cyan-300 border border-cyan-900/60 shadow-[0_0_18px_rgba(6,182,212,0.12)]"
                    : "text-slate-400 hover:text-slate-100 hover:bg-slate-800/60 border border-transparent"
                )}>
                  {isActive && (
                    <span className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 bg-cyan-400 rounded-r-full" />
                  )}
                  <item.icon className={cn("w-4 h-4 mr-3 flex-shrink-0", isActive ? "text-cyan-400" : "text-slate-500 group-hover:text-slate-300")} />
                  <div>
                    <div>{item.label}</div>
                    <div className={cn("text-[10px] font-normal leading-none mt-0.5", isActive ? "text-cyan-600" : "text-slate-600 group-hover:text-slate-500")}>
                      {item.desc}
                    </div>
                  </div>
                </div>
              </Link>
            );
          })}
        </nav>

        {/* CTA */}
        <div className="p-4 border-t border-slate-800">
          <Link href="/report">
            <div className="flex items-center justify-center w-full bg-cyan-600 hover:bg-cyan-500 active:bg-cyan-700 text-white px-4 py-2.5 rounded-lg text-sm font-bold transition-all shadow-[0_0_20px_rgba(6,182,212,0.3)] hover:shadow-[0_0_28px_rgba(6,182,212,0.5)] cursor-pointer gap-2">
              <PlusCircle className="w-4 h-4" />
              Report a Leak
            </div>
          </Link>
          <p className="text-[10px] text-center text-slate-600 mt-2">Earn Eco Points for every report</p>
        </div>
      </aside>

      <main className="flex-1 flex flex-col relative overflow-hidden bg-slate-950">
        {children}
      </main>
    </div>
  );
}
