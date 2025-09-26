import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { FiltersProvider } from "@/contexts/FiltersContext";
import Dashboard from "@/pages/dashboard";
import Monitoring from "@/pages/monitoring";
import TerritoryManagement from "@/components/territories/territory-management";
import { DashboardBuilder } from "@/components/grafana/dashboard-builder";
import NotFound from "@/pages/not-found";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Dashboard} />
      <Route path="/dashboard" component={Dashboard} />
      <Route path="/analytics">
        {() => <Dashboard />}
      </Route>
      <Route path="/monitoring" component={Monitoring} />
      <Route path="/territories" component={TerritoryManagement} />
      <Route path="/grafana" component={DashboardBuilder} />
      <Route path="/grafana/dashboard/:uid">
        {() => <DashboardBuilder />}
      </Route>
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <FiltersProvider>
          <Toaster />
          <Router />
        </FiltersProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
