import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";

interface BulletChartData {
  branchId: string;
  branchName: string;
  actual: number;
  target: number;
  previous: number;
  benchmarks: {
    poor: number;
    satisfactory: number;
    good: number;
  };
}

interface BulletChartProps {
  data: BulletChartData[];
  metric: "revenue" | "profit" | "transactions";
  title: string;
}

export function BulletChart({ data, metric, title }: BulletChartProps) {
  const chartConfig = {
    revenue: { 
      label: "درآمد", 
      unit: "میلیون تومان",
      color: "#3b82f6" 
    },
    profit: { 
      label: "سود", 
      unit: "میلیون تومان",
      color: "#10b981" 
    },
    transactions: { 
      label: "تراکنش", 
      unit: "تراکنش",
      color: "#f59e0b" 
    },
  };

  const config = chartConfig[metric];

  const getPerformanceColor = (actual: number, target: number) => {
    const percentage = (actual / target) * 100;
    if (percentage >= 100) return "text-green-600";
    if (percentage >= 80) return "text-yellow-600";
    return "text-red-600";
  };

  const getPerformanceStatus = (actual: number, target: number) => {
    const percentage = (actual / target) * 100;
    if (percentage >= 100) return { label: "هدف محقق شده", variant: "default" as const, color: "bg-green-500" };
    if (percentage >= 80) return { label: "نزدیک به هدف", variant: "secondary" as const, color: "bg-yellow-500" };
    return { label: "زیر هدف", variant: "destructive" as const, color: "bg-red-500" };
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg font-semibold" data-testid="bullet-chart-title">
          🎯 {title}
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          مقایسه عملکرد با هدف‌های تعریف شده برای {config.label}
        </p>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {data.map((branch) => {
            const percentage = Math.min((branch.actual / branch.target) * 100, 150);
            const previousPercentage = Math.min((branch.previous / branch.target) * 100, 150);
            const status = getPerformanceStatus(branch.actual, branch.target);
            
            // محاسبه نواحی عملکرد
            const poorPercent = (branch.benchmarks.poor / branch.target) * 100;
            const satisfactoryPercent = (branch.benchmarks.satisfactory / branch.target) * 100;
            const goodPercent = (branch.benchmarks.good / branch.target) * 100;
            
            return (
              <div key={branch.branchId} className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="font-medium" data-testid={`bullet-branch-${branch.branchId}`}>
                    {branch.branchName}
                  </h4>
                  <div className="flex items-center gap-2">
                    <Badge variant={status.variant} className="text-xs">
                      {status.label}
                    </Badge>
                    <span className={`text-sm font-medium ${getPerformanceColor(branch.actual, branch.target)}`}>
                      {percentage.toFixed(1)}%
                    </span>
                  </div>
                </div>
                
                {/* Bullet Chart Visualization */}
                <div className="relative">
                  {/* Performance bands */}
                  <div className="relative h-8 bg-gray-100 rounded-lg overflow-hidden">
                    {/* Poor performance zone */}
                    <div 
                      className="absolute h-full bg-red-200"
                      style={{ width: `${Math.min(poorPercent, 100)}%` }}
                    />
                    {/* Satisfactory performance zone */}
                    <div 
                      className="absolute h-full bg-yellow-200"
                      style={{ 
                        left: `${Math.min(poorPercent, 100)}%`,
                        width: `${Math.max(0, Math.min(satisfactoryPercent - poorPercent, 100 - poorPercent))}%` 
                      }}
                    />
                    {/* Good performance zone */}
                    <div 
                      className="absolute h-full bg-green-200"
                      style={{ 
                        left: `${Math.min(satisfactoryPercent, 100)}%`,
                        width: `${Math.max(0, Math.min(goodPercent - satisfactoryPercent, 100 - satisfactoryPercent))}%` 
                      }}
                    />
                    
                    {/* Actual performance bar */}
                    <div 
                      className={`absolute h-6 ${status.color} rounded mt-1`}
                      style={{ 
                        width: `${Math.min(percentage, 100)}%`,
                        transition: 'width 0.5s ease-in-out'
                      }}
                    />
                    
                    {/* Target line */}
                    <div 
                      className="absolute w-1 h-full bg-black"
                      style={{ left: '100%', marginLeft: '-2px' }}
                    />
                    
                    {/* Previous performance marker */}
                    <div 
                      className="absolute w-1 h-4 bg-gray-600 mt-2"
                      style={{ 
                        left: `${Math.min(previousPercentage, 100)}%`,
                        marginLeft: '-2px'
                      }}
                      title={`عملکرد قبلی: ${branch.previous.toFixed(1)} ${config.unit}`}
                    />
                  </div>
                  
                  {/* Legend */}
                  <div className="flex justify-between items-center mt-2 text-xs text-muted-foreground">
                    <span>0</span>
                    <div className="flex items-center gap-4">
                      <span className="flex items-center gap-1">
                        <div className="w-2 h-2 bg-red-200 rounded"></div>
                        ضعیف
                      </span>
                      <span className="flex items-center gap-1">
                        <div className="w-2 h-2 bg-yellow-200 rounded"></div>
                        قابل قبول
                      </span>
                      <span className="flex items-center gap-1">
                        <div className="w-2 h-2 bg-green-200 rounded"></div>
                        عالی
                      </span>
                      <span className="flex items-center gap-1">
                        <div className="w-2 h-2 bg-black rounded"></div>
                        هدف
                      </span>
                    </div>
                    <span className="font-medium">
                      {branch.target.toFixed(1)} {config.unit}
                    </span>
                  </div>
                </div>
                
                {/* Metrics */}
                <div className="grid grid-cols-3 gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground">عملکرد فعلی:</span>
                    <div className="font-medium" data-testid={`actual-${branch.branchId}`}>
                      {branch.actual.toFixed(1)} {config.unit}
                    </div>
                  </div>
                  <div>
                    <span className="text-muted-foreground">هدف:</span>
                    <div className="font-medium" data-testid={`target-${branch.branchId}`}>
                      {branch.target.toFixed(1)} {config.unit}
                    </div>
                  </div>
                  <div>
                    <span className="text-muted-foreground">عملکرد قبلی:</span>
                    <div className="font-medium" data-testid={`previous-${branch.branchId}`}>
                      {branch.previous.toFixed(1)} {config.unit}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}