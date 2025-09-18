import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface SankeyNode {
  id: string;
  label: string;
  value: number;
  type: "source" | "target" | "intermediate";
}

interface SankeyLink {
  source: string;
  target: string;
  value: number;
  label?: string;
}

interface SankeyFlowChartProps {
  nodes: SankeyNode[];
  links: SankeyLink[];
  title: string;
  metric: "revenue" | "profit" | "transactions";
}

export function SankeyFlowChart({ nodes, links, title, metric }: SankeyFlowChartProps) {
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
  
  // محاسبه حداکثر مقدار برای نرمال‌سازی
  const maxValue = Math.max(...nodes.map(n => n.value));
  
  // رنگ‌بندی بر اساس نوع گره
  const getNodeColor = (type: string) => {
    switch (type) {
      case "source": return "bg-blue-500";
      case "target": return "bg-green-500";
      case "intermediate": return "bg-yellow-500";
      default: return "bg-gray-500";
    }
  };

  const getNodeTextColor = (type: string) => {
    switch (type) {
      case "source": return "text-blue-700";
      case "target": return "text-green-700";
      case "intermediate": return "text-yellow-700";
      default: return "text-gray-700";
    }
  };

  // گروه‌بندی گره‌ها بر اساس نوع
  const sourceNodes = nodes.filter(n => n.type === "source");
  const intermediateNodes = nodes.filter(n => n.type === "intermediate");
  const targetNodes = nodes.filter(n => n.type === "target");

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg font-semibold" data-testid="sankey-flow-title">
          🌊 {title}
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          نمایش جریان {config.label} از منشأ تا مقصد
        </p>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {/* Simplified Flow Visualization */}
          <div className="relative bg-gray-50 rounded-lg p-6 min-h-96">
            <div className="grid grid-cols-3 gap-8 h-full">
              
              {/* Source Column */}
              <div className="space-y-4">
                <h4 className="text-sm font-medium text-center text-blue-700">
                  منابع
                </h4>
                {sourceNodes.map((node, index) => {
                  const height = Math.max(40, (node.value / maxValue) * 120);
                  return (
                    <div
                      key={node.id}
                      className="bg-blue-100 border-l-4 border-blue-500 rounded-r-lg p-3 transition-all hover:shadow-md"
                      style={{ minHeight: `${height}px` }}
                      data-testid={`source-node-${node.id}`}
                    >
                      <div className="text-sm font-medium text-blue-900">
                        {node.label}
                      </div>
                      <div className="text-xs text-blue-700">
                        {node.value.toFixed(1)} {config.unit}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Intermediate Column */}
              <div className="space-y-4">
                <h4 className="text-sm font-medium text-center text-yellow-700">
                  واسط‌ها
                </h4>
                {intermediateNodes.map((node, index) => {
                  const height = Math.max(40, (node.value / maxValue) * 120);
                  return (
                    <div
                      key={node.id}
                      className="bg-yellow-100 border-l-4 border-yellow-500 rounded-r-lg p-3 transition-all hover:shadow-md"
                      style={{ minHeight: `${height}px` }}
                      data-testid={`intermediate-node-${node.id}`}
                    >
                      <div className="text-sm font-medium text-yellow-900">
                        {node.label}
                      </div>
                      <div className="text-xs text-yellow-700">
                        {node.value.toFixed(1)} {config.unit}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Target Column */}
              <div className="space-y-4">
                <h4 className="text-sm font-medium text-center text-green-700">
                  مقاصد
                </h4>
                {targetNodes.map((node, index) => {
                  const height = Math.max(40, (node.value / maxValue) * 120);
                  return (
                    <div
                      key={node.id}
                      className="bg-green-100 border-l-4 border-green-500 rounded-r-lg p-3 transition-all hover:shadow-md"
                      style={{ minHeight: `${height}px` }}
                      data-testid={`target-node-${node.id}`}
                    >
                      <div className="text-sm font-medium text-green-900">
                        {node.label}
                      </div>
                      <div className="text-xs text-green-700">
                        {node.value.toFixed(1)} {config.unit}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Flow Links Summary */}
          <div className="space-y-3">
            <h4 className="font-medium">جزئیات جریان:</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {links.map((link, index) => {
                const sourceNode = nodes.find(n => n.id === link.source);
                const targetNode = nodes.find(n => n.id === link.target);
                const percentage = sourceNode ? (link.value / sourceNode.value) * 100 : 0;
                
                return (
                  <div
                    key={index}
                    className="bg-muted/50 rounded-lg p-3 border-l-4 border-blue-400"
                    data-testid={`flow-link-${index}`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="text-sm">
                        <span className="font-medium">{sourceNode?.label}</span>
                        <span className="mx-2 text-muted-foreground">←</span>
                        <span className="font-medium">{targetNode?.label}</span>
                      </div>
                      <Badge variant="outline" className="text-xs">
                        {percentage.toFixed(1)}%
                      </Badge>
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">
                      {link.value.toFixed(1)} {config.unit}
                      {link.label && <span className="ml-2">({link.label})</span>}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Summary Statistics */}
          <div className="bg-muted/30 rounded-lg p-4">
            <h4 className="font-medium mb-2">خلاصه آمار:</h4>
            <div className="grid grid-cols-3 gap-4 text-sm">
              <div>
                <span className="text-muted-foreground">کل منابع:</span>
                <div className="font-medium">
                  {sourceNodes.reduce((sum, n) => sum + n.value, 0).toFixed(1)} {config.unit}
                </div>
              </div>
              <div>
                <span className="text-muted-foreground">کل مقاصد:</span>
                <div className="font-medium">
                  {targetNodes.reduce((sum, n) => sum + n.value, 0).toFixed(1)} {config.unit}
                </div>
              </div>
              <div>
                <span className="text-muted-foreground">تعداد جریان:</span>
                <div className="font-medium">
                  {links.length} جریان
                </div>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}