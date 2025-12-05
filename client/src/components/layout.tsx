import { useLocation } from "wouter";
import { Sidebar } from "@/components/sidebar";
import { Header } from "@/components/header";
import { useTab } from "@/contexts/TabContext";

interface LayoutProps {
  children: React.ReactNode;
}

export function Layout({ children }: LayoutProps) {
  const [location] = useLocation();
  const { activeTab, setActiveTab } = useTab();

  const isStandalonePage = location === "/desktop-download";

  if (isStandalonePage) {
    return <>{children}</>;
  }

  return (
    <div className="min-h-screen flex relative overflow-hidden" dir="rtl">
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-gradient-to-br from-slate-50 via-blue-50/50 to-indigo-50/80 dark:from-gray-950 dark:via-gray-900/50 dark:to-blue-950/80" />
        <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-blue-600/20 to-purple-600/20 rounded-full blur-3xl transform translate-x-1/2 -translate-y-1/2" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-gradient-to-br from-emerald-600/20 to-teal-600/20 rounded-full blur-3xl transform -translate-x-1/2 translate-y-1/2" />
        <div className="absolute top-1/2 left-1/2 w-96 h-96 bg-gradient-to-br from-indigo-600/10 to-purple-600/10 rounded-full blur-3xl transform -translate-x-1/2 -translate-y-1/2" />
      </div>
      
      <div className="relative z-10 flex w-full">
        <Sidebar activeTab={activeTab} onTabChange={setActiveTab} />
        <main className="flex-1 flex flex-col min-h-screen">
          <Header activeTab={activeTab} />
          <div className="flex-1 p-8 lg:p-10 custom-scrollbar overflow-y-auto">
            <div className="max-w-8xl mx-auto">
              {children}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
