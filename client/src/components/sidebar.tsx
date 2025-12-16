import { cn } from "@/lib/utils";
import { useLocation } from "wouter";
import type { TabType } from "@/types/tabs";

interface SidebarProps {
  activeTab: TabType;
  onTabChange: (tab: TabType) => void;
}

const menuItems = [
  { id: "dashboard" as TabType, label: "داشبورد اصلی", icon: "📊", type: "tab" },
  { id: "customers" as TabType, label: "مدیریت مشتریان", icon: "👥", type: "tab" },
  { id: "employees" as TabType, label: "مدیریت کارمندان", icon: "👨‍💼", type: "tab" },
  { id: "branches" as TabType, label: "واحدهای بانکی", icon: "🏢", type: "tab" },
  { id: "pos-stats" as TabType, label: "آمار ماهانه POS", icon: "📈", type: "tab" },
  { id: "analytics" as TabType, label: "تحلیل و گزارش", icon: "📊", type: "tab" },
  { id: "ai" as TabType, label: "هوش مصنوعی", icon: "🤖", type: "tab" },
  { id: "monitoring" as TabType, label: "مانیتورینگ زنده", icon: "📡", type: "tab" },
  { id: "regional" as TabType, label: "تحلیل منطقه‌ای", icon: "🗺️", type: "tab" },
];

const navigationItems = [
  { path: "/intelligent-map", label: "مانیتورینگ هوشمند نقشه", icon: "🧠" },
  { path: "/region-manager", label: "مدیریت مناطق حرفه‌ای", icon: "📍" },
  { path: "/ai-features", label: "تحلیل‌های هوش مصنوعی", icon: "🔮" },
  { path: "/strategic-analysis", label: "تحلیل استراتژیک", icon: "📈" },
  { path: "/territories", label: "مدیریت مناطق (قدیمی)", icon: "🗺️" },
  { path: "/geo-spider-network", label: "نقشه تار عنکبوت شهری", icon: "🕸️" },
];

const systemItems = [
  { path: "/bulk-import", label: "ورود اطلاعات گروهی", icon: "📥" },
  { path: "/backup", label: "پشتیبان‌گیری و بازیابی", icon: "💾" },
  { path: "/desktop-download", label: "دانلود نسخه دسکتاپ", icon: "🖥️" },
];

export function Sidebar({ activeTab, onTabChange }: SidebarProps) {
  const [location, setLocation] = useLocation();

  const handleNavigation = (path: string) => {
    setLocation(path);
  };

  return (
    <aside className="w-72 h-screen bg-card border-l border-border flex flex-col shadow-lg">
      <div className="flex-shrink-0 p-6 border-b border-border">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
            <span className="text-primary-foreground text-xl">💳</span>
          </div>
          <div>
            <h1 className="text-xl font-bold">داشبورد POS</h1>
            <p className="text-sm text-muted-foreground">مدیریت تبریز - v2.0</p>
          </div>
        </div>
      </div>
      
      <nav className="flex-1 min-h-0 p-4 space-y-1 custom-scrollbar overflow-y-auto">
        {/* Dashboard Tabs */}
        <div className="space-y-1">
          <div className="px-2 py-1 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            داشبورد اصلی
          </div>
          {menuItems.map((item) => (
            <button
              key={item.id}
              onClick={() => onTabChange(item.id)}
              className={cn(
                "w-full flex items-center gap-3 px-3 py-2 text-right rounded-md transition-colors text-sm",
                activeTab === item.id && (location === "/" || location === "/dashboard")
                  ? "bg-primary text-primary-foreground"
                  : "text-foreground hover:bg-muted"
              )}
              data-testid={`nav-${item.id}`}
            >
              <span className="text-base">{item.icon}</span>
              <span>{item.label}</span>
            </button>
          ))}
        </div>

        {/* Separator */}
        <div className="my-4 border-t border-border"></div>

        {/* Navigation Items */}
        <div className="space-y-1">
          <div className="px-2 py-1 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            تحلیل پیشرفته
          </div>
          {navigationItems.map((item) => (
            <button
              key={item.path}
              onClick={() => handleNavigation(item.path)}
              className={cn(
                "w-full flex items-center gap-3 px-3 py-2 text-right rounded-md transition-colors text-sm",
                location === item.path
                  ? "bg-primary text-primary-foreground"
                  : "text-foreground hover:bg-muted"
              )}
              data-testid={`nav-${item.path.replace('/', '')}`}
            >
              <span className="text-base">{item.icon}</span>
              <span>{item.label}</span>
            </button>
          ))}
        </div>

        {/* Separator */}
        <div className="my-4 border-t border-border"></div>

        {/* System Items */}
        <div className="space-y-1">
          <div className="px-2 py-1 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            تنظیمات سیستم
          </div>
          {systemItems.map((item) => (
            <button
              key={item.path}
              onClick={() => handleNavigation(item.path)}
              className={cn(
                "w-full flex items-center gap-3 px-3 py-2 text-right rounded-md transition-colors text-sm",
                location === item.path
                  ? "bg-primary text-primary-foreground"
                  : "text-foreground hover:bg-muted"
              )}
              data-testid={`nav-${item.path.replace('/', '')}`}
            >
              <span className="text-base">{item.icon}</span>
              <span>{item.label}</span>
            </button>
          ))}
        </div>
      </nav>
      
      <div className="flex-shrink-0 p-4 border-t border-border">
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
