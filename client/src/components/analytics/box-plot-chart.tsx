import { ChartContainer } from "@/components/ui/chart";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface BoxPlotData {
  branchId: string;
  branchName: string;
  values: number[];
  stats: {
    min: number;
    q1: number;
    median: number;
    q3: number;
    max: number;
    outliers: number[];
  } | null;
}

interface BoxPlotChartProps {
  data: BoxPlotData[];
  metric: "revenue" | "profit" | "transactions";
  title: string;
}

// محاسبه آمار Box Plot
function calculateBoxPlotStats(values: number[]) {
  const sorted = [...values].sort((a, b) => a - b);
  const n = sorted.length;
  
  if (n === 0) return null;
  
  const q1Index = Math.floor((n + 1) / 4) - 1;
  const medianIndex = Math.floor((n + 1) / 2) - 1;
  const q3Index = Math.floor(3 * (n + 1) / 4) - 1;
  
  const q1 = sorted[Math.max(0, q1Index)];
  const median = sorted[Math.max(0, medianIndex)];
  const q3 = sorted[Math.max(0, q3Index)];
  const iqr = q3 - q1;
  
  const lowerFence = q1 - 1.5 * iqr;
  const upperFence = q3 + 1.5 * iqr;
  
  const outliers = sorted.filter(v => v < lowerFence || v > upperFence);
  const cleanValues = sorted.filter(v => v >= lowerFence && v <= upperFence);
  
  return {
    min: cleanValues.length > 0 ? Math.min(...cleanValues) : sorted[0],
    q1,
    median,
    q3,
    max: cleanValues.length > 0 ? Math.max(...cleanValues) : sorted[sorted.length - 1],
    outliers
  };
}

export function BoxPlotChart({ data, metric, title }: BoxPlotChartProps) {
  const chartConfig = {
    revenue: { label: "درآمد (میلیون تومان)", color: "#3b82f6", unit: "M" },
    profit: { label: "سود (میلیون تومان)", color: "#10b981", unit: "M" },
    transactions: { label: "تعداد تراکنش", color: "#f59e0b", unit: "" },
  };

  const config = chartConfig[metric];
  const processedData = data.map(branch => {
    const stats = calculateBoxPlotStats(branch.values);
    return { ...branch, stats };
  }).filter(branch => branch.stats !== null);

  const allValues = data.flatMap(d => d.values);
  const globalMin = Math.min(...allValues);
  const globalMax = Math.max(...allValues);
  const range = globalMax - globalMin;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg font-semibold" data-testid="box-plot-title">
          📦 {title}
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          نمایش توزیع و پراکندگی {config.label} - نقاط قرمز نشان‌دهنده داده‌های پرت هستند
        </p>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {processedData.map((branch, index) => {
            if (!branch.stats) return null;
            
            const { min, q1, median, q3, max, outliers } = branch.stats;
            
            return (
              <div key={branch.branchId} className="space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="font-medium" data-testid={`box-plot-branch-${branch.branchId}`}>
                    {branch.branchName}
                  </h4>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-xs">
                      میانه: {median.toFixed(1)}{config.unit}
                    </Badge>
                    {outliers.length > 0 && (
                      <Badge variant="destructive" className="text-xs">
                        {outliers.length} پرت
                      </Badge>
                    )}
                  </div>
                </div>
                
                <div className="relative h-12 bg-muted/30 rounded-lg p-2">
                  {/* Box Plot visualization */}
                  <div className="relative h-8 w-full">
                    {/* Whiskers */}
                    <div 
                      className="absolute h-0.5 bg-gray-400"
                      style={{
                        left: `${((min - globalMin) / range) * 100}%`,
                        width: `${((q1 - min) / range) * 100}%`,
                        top: '50%',
                        transform: 'translateY(-50%)'
                      }}
                    />
                    <div 
                      className="absolute h-0.5 bg-gray-400"
                      style={{
                        left: `${((q3 - globalMin) / range) * 100}%`,
                        width: `${((max - q3) / range) * 100}%`,
                        top: '50%',
                        transform: 'translateY(-50%)'
                      }}
                    />
                    
                    {/* Box */}
                    <div 
                      className="absolute bg-blue-200 border-2 border-blue-500 rounded"
                      style={{
                        left: `${((q1 - globalMin) / range) * 100}%`,
                        width: `${((q3 - q1) / range) * 100}%`,
                        height: '100%'
                      }}
                    />
                    
                    {/* Median line */}
                    <div 
                      className="absolute w-0.5 bg-blue-800 h-full"
                      style={{
                        left: `${((median - globalMin) / range) * 100}%`
                      }}
                    />
                    
                    {/* Min/Max lines */}
                    <div 
                      className="absolute w-0.5 bg-gray-600 h-2"
                      style={{
                        left: `${((min - globalMin) / range) * 100}%`,
                        top: '25%'
                      }}
                    />
                    <div 
                      className="absolute w-0.5 bg-gray-600 h-2"
                      style={{
                        left: `${((max - globalMin) / range) * 100}%`,
                        top: '25%'
                      }}
                    />
                    
                    {/* Outliers */}
                    {outliers.map((outlier, outIndex) => (
                      <div
                        key={outIndex}
                        className="absolute w-1.5 h-1.5 bg-red-500 rounded-full"
                        style={{
                          left: `${((outlier - globalMin) / range) * 100}%`,
                          top: '50%',
                          transform: 'translate(-50%, -50%)'
                        }}
                        title={`داده پرت: ${outlier.toFixed(1)}${config.unit}`}
                      />
                    ))}
                  </div>
                </div>
                
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>حداقل: {min.toFixed(1)}{config.unit}</span>
                  <span>Q1: {q1.toFixed(1)}{config.unit}</span>
                  <span>میانه: {median.toFixed(1)}{config.unit}</span>
                  <span>Q3: {q3.toFixed(1)}{config.unit}</span>
                  <span>حداکثر: {max.toFixed(1)}{config.unit}</span>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}