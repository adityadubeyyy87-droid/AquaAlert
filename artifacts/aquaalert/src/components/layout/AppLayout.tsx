import { Link, useLocation } from "wouter";
import { Droplet, Activity, Map, Trophy, List, PlusCircle } from "lucide-react";
import { cn } from "@/lib/utils";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();

  const navItems = [
    { href: "/", label: "Live Map", icon: Map },
    { href: "/dashboard", label: "Dashboard", icon: Activity },
    { href: "/reports", label: "All Reports", icon: List },
    { href: "/leaderboard", label: "Leaderboard", icon: Trophy },
  ];

  return (
    <div className="flex h-screen w-full bg-slate-950 text-slate-50 overflow-hidden font-sans">
      {/* Sidebar */}
      <aside className="w-64 border-r border-slate-800 bg-slate-900/50 flex flex-col backdrop-blur-md relative z-20">
        <div className="h-16 flex items-center px-6 border-b border-slate-800">
          <Droplet className="w-6 h-6 text-cyan-500 mr-3" />
          <span className="font-bold text-lg tracking-tight text-slate-100">Aqua<span className="text-cyan-500">Alert</span></span>
        </div>

        <div className="flex-1 py-6 px-4 space-y-1">
          {navItems.map((item) => {
            const isActive = location === item.href || (item.href !== "/" && location.startsWith(item.href));
            return (
              <Link key={item.href} href={item.href}>
                <div
                  className={cn(
                    "flex items-center px-3 py-2.5 rounded-md text-sm font-medium transition-all duration-200 cursor-pointer",
                    isActive
                      ? "bg-cyan-950/40 text-cyan-400 border border-cyan-900/50 shadow-[0_0_15px_rgba(6,182,212,0.15)]"
                      : "text-slate-400 hover:text-slate-100 hover:bg-slate-800/50"
                  )}
                >
                  <item.icon className="w-4 h-4 mr-3" />
                  {item.label}
                </div>
              </Link>
            );
          })}
        </div>

        <div className="p-4 border-t border-slate-800">
          <Link href="/report">
            <div className="flex items-center justify-center w-full bg-cyan-600 hover:bg-cyan-500 text-white px-4 py-2.5 rounded-md text-sm font-bold transition-all shadow-[0_0_20px_rgba(6,182,212,0.3)] hover:shadow-[0_0_25px_rgba(6,182,212,0.5)] cursor-pointer">
              <PlusCircle className="w-4 h-4 mr-2" />
              Report a Leak
            </div>
          </Link>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col relative overflow-hidden bg-slate-950">
        {children}
      </main>
    </div>
  );
}
