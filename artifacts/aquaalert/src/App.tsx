import { Switch, Route, Router as WouterRouter, useLocation, Redirect } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AnimatePresence, motion } from "framer-motion";
import { LanguageProvider } from "@/contexts/LanguageContext";
import AppLayout from "@/components/layout/AppLayout";
import NotFound from "@/pages/not-found";

import Home            from "@/pages/home";
import Report          from "@/pages/report";
import Leaderboard     from "@/pages/leaderboard";
import AdminPage       from "@/pages/admin";
import MyReports       from "@/pages/my-reports";
import HowItWorks      from "@/pages/how-it-works";
import WaterCalculator from "@/pages/water-calculator";

const queryClient = new QueryClient({
  defaultOptions: { queries: { staleTime: 15_000, refetchInterval: 15_000 } },
});

const pageVariants = {
  initial: { opacity: 0, y: 10 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.22, ease: "easeOut" } },
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
          <Route path="/"                component={Home}            />
          <Route path="/report"          component={Report}          />
          <Route path="/leaderboard"     component={Leaderboard}     />
          <Route path="/my-reports"      component={MyReports}       />
          <Route path="/how-it-works"    component={HowItWorks}      />
          <Route path="/water-calculator" component={WaterCalculator} />
          <Route path="/admin"           component={AdminPage}       />
          <Route path="/reports">{() => <Redirect to="/admin" />}</Route>
          <Route path="/reports/:id">{() => <Redirect to="/admin" />}</Route>
          <Route path="/dashboard">{() => <Redirect to="/admin" />}</Route>
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
      <LanguageProvider>
        <TooltipProvider>
          <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
            <Router />
          </WouterRouter>
          <Toaster />
        </TooltipProvider>
      </LanguageProvider>
    </QueryClientProvider>
  );
}

export default App;
