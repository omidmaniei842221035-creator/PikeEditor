import { useState, createContext, useContext } from "react";
import { useTab } from "@/contexts/TabContext";
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
import { BranchManagement } from "@/components/branches/branch-management";
import { PosStatsManagement } from "@/components/pos-stats/pos-stats-management";
import { AdvancedAnalytics } from "@/components/dashboard/advanced-analytics";
import { BankingUnitFilter } from "@/components/filters/banking-unit-filter";
import { SpiderWebNetwork } from "@/components/spider-web-network";

// Context for banking unit filter
interface FilterContextType {
  selectedBankingUnitId: string | null;
  setSelectedBankingUnitId: (id: string | null) => void;
}

const FilterContext = createContext<FilterContextType | undefined>(undefined);

export const useFilter = () => {
  const context = useContext(FilterContext);
  if (!context) {
    throw new Error('useFilter must be used within a FilterProvider');
  }
  return context;
};

import { TabType } from "@/types/tabs";
export type { TabType };

interface DashboardProps {
  defaultTab?: TabType;
}

export default function Dashboard({ defaultTab = "dashboard" }: DashboardProps) {
  const { activeTab } = useTab();
  const [selectedBankingUnitId, setSelectedBankingUnitId] = useState<string | null>(null);

  const renderContent = () => {
    switch (activeTab) {
      case "dashboard":
        return (
          <div className="space-y-8">
            {/* Header Section with Hero Stats */}
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-blue-600/10 via-purple-600/10 to-indigo-600/10 rounded-3xl blur-3xl" />
              <div className="relative">
                <OverviewStats />
              </div>
            </div>
            
            {/* Business Categories Section */}
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-emerald-600/10 via-teal-600/10 to-cyan-600/10 rounded-3xl blur-3xl" />
              <div className="relative">
                <BusinessCategories />
              </div>
            </div>
            
            {/* Main Dashboard Grid */}
            <div className="grid grid-cols-1 xl:grid-cols-12 gap-8">
              <div className="xl:col-span-8">
                <div className="relative">
                  <div className="absolute inset-0 bg-gradient-to-r from-indigo-600/10 via-blue-600/10 to-sky-600/10 rounded-3xl blur-3xl" />
                  <div className="relative">
                    <PosMap />
                  </div>
                </div>
              </div>
              <div className="xl:col-span-4 space-y-6">
                <div className="relative">
                  <div className="absolute inset-0 bg-gradient-to-r from-orange-600/10 via-red-600/10 to-rose-600/10 rounded-3xl blur-3xl" />
                  <div className="relative">
                    <AlertsPanel />
                  </div>
                </div>
                <div className="relative">
                  <div className="absolute inset-0 bg-gradient-to-r from-violet-600/10 via-purple-600/10 to-fuchsia-600/10 rounded-3xl blur-3xl" />
                  <div className="relative">
                    <BranchPerformance />
                  </div>
                </div>
              </div>
            </div>
            
            {/* Advanced Analytics Section */}
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-cyan-600/10 via-teal-600/10 to-emerald-600/10 rounded-3xl blur-3xl" />
              <div className="relative">
                <AdvancedAnalytics />
              </div>
            </div>
            
            {/* AI Analytics Section */}
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-amber-600/10 via-orange-600/10 to-red-600/10 rounded-3xl blur-3xl" />
              <div className="relative">
                <AIAnalytics />
              </div>
            </div>
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
        return <BranchManagement />;
      case "pos-stats":
        return <PosStatsManagement />;
      case "spider-web":
        return <SpiderWebNetwork />;
      default:
        return (
          <div className="space-y-8">
            {/* Header Section with Hero Stats */}
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-blue-600/10 via-purple-600/10 to-indigo-600/10 rounded-3xl blur-3xl" />
              <div className="relative">
                <OverviewStats />
              </div>
            </div>
            
            {/* Business Categories Section */}
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-emerald-600/10 via-teal-600/10 to-cyan-600/10 rounded-3xl blur-3xl" />
              <div className="relative">
                <BusinessCategories />
              </div>
            </div>
            
            {/* Main Dashboard Grid */}
            <div className="grid grid-cols-1 xl:grid-cols-12 gap-8">
              <div className="xl:col-span-8">
                <div className="relative">
                  <div className="absolute inset-0 bg-gradient-to-r from-indigo-600/10 via-blue-600/10 to-sky-600/10 rounded-3xl blur-3xl" />
                  <div className="relative">
                    <PosMap />
                  </div>
                </div>
              </div>
              <div className="xl:col-span-4 space-y-6">
                <div className="relative">
                  <div className="absolute inset-0 bg-gradient-to-r from-orange-600/10 via-red-600/10 to-rose-600/10 rounded-3xl blur-3xl" />
                  <div className="relative">
                    <AlertsPanel />
                  </div>
                </div>
                <div className="relative">
                  <div className="absolute inset-0 bg-gradient-to-r from-violet-600/10 via-purple-600/10 to-fuchsia-600/10 rounded-3xl blur-3xl" />
                  <div className="relative">
                    <BranchPerformance />
                  </div>
                </div>
              </div>
            </div>
            
            {/* AI Analytics Section */}
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-amber-600/10 via-orange-600/10 to-red-600/10 rounded-3xl blur-3xl" />
              <div className="relative">
                <AIAnalytics />
              </div>
            </div>
          </div>
        );
    }
  };

  return (
    <FilterContext.Provider value={{ selectedBankingUnitId, setSelectedBankingUnitId }}>
      {renderContent()}
    </FilterContext.Provider>
  );
}
