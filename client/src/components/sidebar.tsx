import { cn } from "@/lib/utils";
import type { TabType } from "@/pages/dashboard";

interface SidebarProps {
  activeTab: TabType;
  onTabChange: (tab: TabType) => void;
}

const menuItems = [
  { id: "dashboard" as TabType, label: "داشبورد اصلی", icon: "📊" },
  { id: "customers" as TabType, label: "مدیریت مشتریان", icon: "👥" },
  { id: "employees" as TabType, label: "مدیریت کارمندان", icon: "👨‍💼" },
  { id: "branches" as TabType, label: "واحدهای بانکی", icon: "🏢" },
  { id: "analytics" as TabType, label: "تحلیل و گزارش", icon: "📈" },
  { id: "reports" as TabType, label: "گزارش‌گیری پیشرفته", icon: "📋" },
  { id: "ai" as TabType, label: "هوش مصنوعی", icon: "🤖" },
  { id: "monitoring" as TabType, label: "مانیتورینگ زنده", icon: "📡" },
  { id: "regional" as TabType, label: "تحلیل منطقه‌ای", icon: "🗺️" },
  { id: "excel" as TabType, label: "بارگزاری اکسل", icon: "📋" },
];

export function Sidebar({ activeTab, onTabChange }: SidebarProps) {
  return (
    <aside className="w-72 bg-card border-l border-border flex flex-col shadow-lg">
      <div className="p-6 border-b border-border">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
            <span className="text-primary-foreground text-xl">💳</span>
          </div>
          <div>
            <h1 className="text-xl font-bold">داشبورد POS</h1>
            <p className="text-sm text-muted-foreground">مدیریت تبریز</p>
          </div>
        </div>
      </div>
      
      <nav className="flex-1 p-4 space-y-2 custom-scrollbar overflow-y-auto">
        {menuItems.map((item) => (
          <button
            key={item.id}
            onClick={() => onTabChange(item.id)}
            className={cn(
              "w-full flex items-center gap-3 px-4 py-3 text-right rounded-lg transition-colors",
              activeTab === item.id
                ? "bg-primary text-primary-foreground"
                : "text-foreground hover:bg-muted"
            )}
            data-testid={`nav-${item.id}`}
          >
            <span className="text-lg">{item.icon}</span>
            <span>{item.label}</span>
          </button>
        ))}
      </nav>
      
      <div className="p-4 border-t border-border">
        <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
          <div className="w-10 h-10 bg-primary/20 rounded-full flex items-center justify-center">
            <span className="text-primary font-bold">ع</span>
          </div>
          <div>
            <p className="font-medium">علی احمدی</p>
            <p className="text-sm text-muted-foreground">مدیر سیستم</p>
          </div>
        </div>
      </div>
    </aside>
  );
}
