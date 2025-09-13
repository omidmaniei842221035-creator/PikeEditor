import { useQuery } from "@tanstack/react-query";
import type { TabType } from "@/pages/dashboard";

interface HeaderProps {
  activeTab: TabType;
}

const tabTitles: Record<TabType, string> = {
  dashboard: "سامانه مانیتورینگ هوشمند POS",
  customers: "مدیریت مشتریان",
  employees: "مدیریت کارمندان",
  branches: "واحدهای بانکی",
  analytics: "تحلیل و گزارش",
  ai: "هوش مصنوعی",
  regional: "تحلیل منطقه‌ای",
  excel: "بارگزاری اکسل",
  monitoring: "مانیتورینگ لحظه‌ای",
  reports: "گزارش‌گیری پیشرفته",
};

const tabDescriptions: Record<TabType, string> = {
  dashboard: "سامانه مانیتورینگ هوشمند پایانه های فروشگاهی - تبریز",
  customers: "مدیریت کامل مشتریان و 170+ نوع کسب‌وکار",
  employees: "کارمندان، دسترسی‌ها و بارگذاری Excel",
  branches: "شعب، باجه‌ها، گیشه‌ها و پیشخوان‌های شهرنت",
  analytics: "آمار تفصیلی عملکرد و گزارش‌های مالی",
  ai: "سیستم‌های یادگیری ماشین و تحلیل رفتاری",
  regional: "تحلیل پوشش جغرافیایی و شناسایی مناطق توسعه",
  excel: "بارگذاری اکسل کارمندان و مشتریان",
  monitoring: "مانیتورینگ لحظه‌ای وضعیت POS و تراکنش‌ها",
  reports: "گزارش‌گیری پیشرفته و تحلیل روند",
};

export function Header({ activeTab }: HeaderProps) {
  const { data: unreadAlerts } = useQuery<any[]>({
    queryKey: ["/api/alerts/unread"],
  });

  const currentTime = new Date().toLocaleString("fa-IR", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <header className="bg-card border-b border-border px-8 py-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-6">
          <div>
            <h2 className="text-2xl font-bold">{tabTitles[activeTab]}</h2>
            <p className="text-muted-foreground">{tabDescriptions[activeTab]}</p>
          </div>
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <span>{currentTime}</span>
            <span>|</span>
            <span className="flex items-center gap-1">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              آنلاین
            </span>
          </div>
        </div>
        
        <div className="flex items-center gap-4">
          <button 
            className="relative p-2 text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg transition-colors"
            data-testid="notifications-button"
          >
            <span className="text-xl">🔔</span>
            {unreadAlerts && Array.isArray(unreadAlerts) && unreadAlerts.length > 0 && (
              <span 
                className="absolute -top-1 -left-1 bg-destructive text-destructive-foreground text-xs rounded-full w-5 h-5 flex items-center justify-center"
                data-testid="notification-count"
              >
                {Array.isArray(unreadAlerts) ? unreadAlerts.length : 0}
              </span>
            )}
          </button>
          
          <div className="flex items-center gap-3">
            <div className="text-right">
              <p className="text-sm font-medium">علی احمدی</p>
              <p className="text-xs text-muted-foreground">مدیر سیستم</p>
            </div>
            <div className="w-10 h-10 bg-primary/20 rounded-full flex items-center justify-center">
              <span className="text-primary font-bold">ع</span>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
