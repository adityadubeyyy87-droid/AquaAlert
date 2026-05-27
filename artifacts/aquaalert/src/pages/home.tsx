import { useListReports } from "@workspace/api-client-react";
import LiveMap from "@/components/map/LiveMap";
import { Droplet } from "lucide-react";
import { motion } from "framer-motion";

export default function Home() {
  const { data: reports, isLoading } = useListReports();

  if (isLoading) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-slate-900">
        <div className="flex flex-col items-center gap-3">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
          >
            <Droplet className="w-10 h-10 text-cyan-500" />
          </motion.div>
          <p className="text-sm text-slate-500">Loading Mumbai water grid…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-full">
      <LiveMap reports={reports || []} />
    </div>
  );
}
