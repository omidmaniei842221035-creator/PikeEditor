import { useState } from "react";
import { Sidebar } from "@/components/sidebar";
import { Header } from "@/components/header";
import { OverviewStats } from "@/components/dashboard/overview-stats";
import { BusinessCategories } from "@/components/dashboard/business-categories";
import { AlertsPanel } from "@/components/dashboard/alerts-panel";
import { BranchPerformance } from "@/components/dashboard/branch-performance";
import { AIAnalytics } from "@/components/dashboard/ai-analytics";
import { PosMap } from "@/components/pos-map";
import { CustomerManagement } from "@/components/customers/customer-management";
import { EmployeeManagement } from "@/components/employees/employee-management";
import { AnalyticsDashboard } from "@/components/analytics/analytics-dashboard";
import { ReportsDashboard } from "@/components/reports/reports-dashboard";
import { ExcelManagement } from "@/components/excel/excel-management";
import { RealtimeDashboard } from "@/components/monitoring/realtime-dashboard";

export type TabType = 
  | "dashboard" 
  | "customers" 
  | "employees" 
  | "branches" 
  | "analytics" 
  | "ai" 
  | "regional" 
  | "excel"
  | "monitoring"
  | "reports";

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState<TabType>("dashboard");

  const renderContent = () => {
    switch (activeTab) {
      case "dashboard":
        return (
          <div className="space-y-6">
            <OverviewStats />
            <BusinessCategories />
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2">
                <PosMap />
              </div>
              <div className="space-y-6">
                <AlertsPanel />
                <BranchPerformance />
              </div>
            </div>
            <AIAnalytics />
          </div>
        );
      case "customers":
        return <CustomerManagement />;
      case "employees":
        return <EmployeeManagement />;
      case "analytics":
        return <AnalyticsDashboard />;
      case "regional":
        return <PosMap />;
      case "excel":
        return <ExcelManagement />;
      case "monitoring":
        return <RealtimeDashboard />;
      case "reports":
        return <ReportsDashboard />;
      case "ai":
        return <AIAnalytics />;
      case "branches":
        return (
          <div className="space-y-6">
            <div className="mb-6">
              <h3 className="text-2xl font-bold">مدیریت واحدهای بانکی</h3>
              <p className="text-muted-foreground">مدیریت شعب و واحدهای بانکی در سراسر تبریز</p>
            </div>
            <ReportsDashboard />
          </div>
        );
      default:
        return (
          <div className="space-y-6">
            <OverviewStats />
            <BusinessCategories />
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2">
                <PosMap />
              </div>
              <div className="space-y-6">
                <AlertsPanel />
                <BranchPerformance />
              </div>
            </div>
            <AIAnalytics />
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen flex bg-muted/30" dir="rtl">
      <Sidebar activeTab={activeTab} onTabChange={setActiveTab} />
      <main className="flex-1 flex flex-col min-h-screen">
        <Header activeTab={activeTab} />
        <div className="flex-1 p-8 custom-scrollbar overflow-y-auto">
          {renderContent()}
        </div>
      </main>
    </div>
  );
}
