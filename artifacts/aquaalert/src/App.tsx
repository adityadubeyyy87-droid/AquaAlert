import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import AppLayout from "@/components/layout/AppLayout";
import NotFound from "@/pages/not-found";

import Home from "@/pages/home";
import Report from "@/pages/report";
import Dashboard from "@/pages/dashboard";
import Leaderboard from "@/pages/leaderboard";
import Reports from "@/pages/reports/index";
import ReportDetail from "@/pages/reports/detail";

const queryClient = new QueryClient();

function Router() {
  return (
    <AppLayout>
      <Switch>
        <Route path="/" component={Home} />
        <Route path="/report" component={Report} />
        <Route path="/dashboard" component={Dashboard} />
        <Route path="/leaderboard" component={Leaderboard} />
        <Route path="/reports" component={Reports} />
        <Route path="/reports/:id" component={ReportDetail} />
        <Route component={NotFound} />
      </Switch>
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
