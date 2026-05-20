import { Switch, Route, Router as WouterRouter, useLocation } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AnimatePresence, motion } from "framer-motion";
import AppLayout from "@/components/layout/AppLayout";
import NotFound from "@/pages/not-found";

import Home from "@/pages/home";
import Report from "@/pages/report";
import Dashboard from "@/pages/dashboard";
import Leaderboard from "@/pages/leaderboard";
import Reports from "@/pages/reports/index";
import ReportDetail from "@/pages/reports/detail";

const queryClient = new QueryClient({
  defaultOptions: { queries: { staleTime: 30_000, refetchInterval: 60_000 } },
});

const pageVariants = {
  initial: { opacity: 0, y: 10 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.22, ease: [0.4, 0, 0.2, 1] } },
  exit:    { opacity: 0, y: -6, transition: { duration: 0.15 } },
};

function AnimatedRoutes() {
  const [location] = useLocation();
  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={location}
        variants={pageVariants}
        initial="initial"
        animate="animate"
        exit="exit"
        style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column" }}
      >
        <Switch>
          <Route path="/" component={Home} />
          <Route path="/report" component={Report} />
          <Route path="/dashboard" component={Dashboard} />
          <Route path="/leaderboard" component={Leaderboard} />
          <Route path="/reports" component={Reports} />
          <Route path="/reports/:id" component={ReportDetail} />
          <Route component={NotFound} />
        </Switch>
      </motion.div>
    </AnimatePresence>
  );
}

function Router() {
  return (
    <AppLayout>
      <AnimatedRoutes />
    </AppLayout>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
          <Router />
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
