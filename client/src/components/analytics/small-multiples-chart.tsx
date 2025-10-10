import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { LineChart, Line, XAxis, YAxis, ResponsiveContainer } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface SmallMultiplesData {
  branchId: string;
  branchName: string;
  monthlyData: {
    month: string;
    monthIndex: number;
    revenue: number;
    profit: number;
    transactions: number;
  }[];
}

interface SmallMultiplesChartProps {
  data: SmallMultiplesData[];
  metric: "revenue" | "profit" | "transactions";
  title: string;
}

const chartConfig = {
  revenue: {
    label: "درآمد (میلیون تومان)",
    color: "#3b82f6",
  },
  profit: {
    label: "سود (میلیون تومان)", 
    color: "#10b981",
  },
  transactions: {
    label: "تعداد تراکنش",
    color: "#f59e0b",
  },
};

export function SmallMultiplesChart({ data, metric, title }: SmallMultiplesChartProps) {
  const persianMonths = ["فرو", "ارد", "خرد", "تیر", "مرد", "شهر", "مهر", "آبا", "آذر", "دی", "بهم", "اسف"];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg font-semibold" data-testid="small-multiples-title">
          📊 {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {data.map((branchData) => (
            <div key={branchData.branchId} className="bg-muted/30 rounded-lg p-3">
              <h4 className="text-sm font-medium mb-2 text-center" data-testid={`branch-title-${branchData.branchId}`}>
                {branchData.branchName}
              </h4>
              <div className="h-32">
                <ChartContainer config={chartConfig} className="h-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={branchData.monthlyData}>
                      <XAxis 
                        dataKey="monthIndex" 
                        tickFormatter={(value) => persianMonths[value - 1] || ""} 
                        tick={{ fontSize: 10 }}
                        axisLine={false}
                        tickLine={false}
                      />
                      <YAxis hide />
                      <ChartTooltip 
                        content={<ChartTooltipContent />}
                        labelFormatter={(value) => persianMonths[parseInt(value) - 1] || ""}
                      />
                      <Line 
                        type="monotone" 
                        dataKey={metric} 
                        stroke={chartConfig[metric].color}
                        strokeWidth={2}
                        dot={{ r: 2 }}
                        activeDot={{ r: 3 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </ChartContainer>
              </div>
              <div className="text-xs text-center mt-1">
                <span className="text-muted-foreground">
                  {chartConfig[metric].label}
                </span>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}