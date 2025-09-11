import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export function AlertsPanel() {
  const { data: alerts = [] } = useQuery({
    queryKey: ["/api/alerts/unread"],
  });

  const getAlertTypeStyle = (type: string) => {
    switch (type) {
      case "error":
        return "bg-red-50 border-red-200 text-red-800";
      case "warning":
        return "bg-yellow-50 border-yellow-200 text-yellow-800";
      case "info":
        return "bg-blue-50 border-blue-200 text-blue-800";
      default:
        return "bg-gray-50 border-gray-200 text-gray-800";
    }
  };

  const getAlertIcon = (type: string) => {
    switch (type) {
      case "error":
        return "🚨";
      case "warning":
        return "⚠️";
      case "info":
        return "ℹ️";
      default:
        return "📢";
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold">🚨 هشدارهای مهم</CardTitle>
          {alerts.length > 0 && (
            <Badge variant="destructive" data-testid="alerts-count">
              {alerts.length} جدید
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {alerts.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <span className="text-4xl mb-4 block">🎉</span>
            <p>هیچ هشدار جدیدی وجود ندارد</p>
          </div>
        ) : (
          <div className="space-y-4">
            {alerts.slice(0, 3).map((alert: any, index: number) => (
              <div
                key={alert.id}
                className={`flex items-start gap-3 p-3 rounded-lg border ${getAlertTypeStyle(alert.type)}`}
                data-testid={`alert-${index}`}
              >
                <span className="text-lg">{getAlertIcon(alert.type)}</span>
                <div className="flex-1">
                  <p className="font-medium text-sm">{alert.title}</p>
                  <p className="text-sm opacity-80">{alert.message}</p>
                  <p className="text-xs opacity-60 mt-1">
                    {new Date(alert.createdAt).toLocaleString("fa-IR")}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
