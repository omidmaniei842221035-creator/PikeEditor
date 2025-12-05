import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { FiltersProvider } from "@/contexts/FiltersContext";
import { TabProvider } from "@/contexts/TabContext";
import { Layout } from "@/components/layout";
import Dashboard from "@/pages/dashboard";
import Monitoring from "@/pages/monitoring";
import TerritoryManagement from "@/components/territories/territory-management";
import { DashboardBuilder } from "@/components/grafana/dashboard-builder";
import { SpiderWebNetwork } from "@/components/spider-web-network";
import { StrategicAnalysisPage } from "@/pages/strategic-analysis";
import { GeoSpiderNetworkPage } from "@/pages/geo-spider-network";
import { BackupRestore } from "@/pages/backup-restore";
import DesktopDownload from "@/pages/DesktopDownload";
import AIFeatures from "@/pages/ai-features";
import BulkImport from "@/pages/bulk-import";
import NotFound from "@/pages/not-found";

function Router() {
  return (
    <Switch>
      <Route path="/">
        {() => <Dashboard />}
      </Route>
      <Route path="/dashboard">
        {() => <Dashboard />}
      </Route>
      <Route path="/analytics">
        {() => <Dashboard />}
      </Route>
      <Route path="/monitoring" component={Monitoring} />
      <Route path="/territories" component={TerritoryManagement} />
      <Route path="/spider-web" component={SpiderWebNetwork} />
      <Route path="/strategic-analysis" component={StrategicAnalysisPage} />
      <Route path="/geo-spider-network" component={GeoSpiderNetworkPage} />
      <Route path="/backup" component={BackupRestore} />
      <Route path="/desktop-download" component={DesktopDownload} />
      <Route path="/ai-features" component={AIFeatures} />
      <Route path="/bulk-import" component={BulkImport} />
      <Route path="/grafana">
        {() => <DashboardBuilder />}
      </Route>
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
          <TabProvider>
            <Toaster />
            <Layout>
              <Router />
            </Layout>
          </TabProvider>
        </FiltersProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
