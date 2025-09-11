import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function BranchPerformance() {
  const { data: branches = [] } = useQuery({
    queryKey: ["/api/branches"],
  });

  const getPerformanceColor = (performance: number) => {
    if (performance >= 90) return "text-green-600 bg-green-100";
    if (performance >= 70) return "text-yellow-600 bg-yellow-100";
    return "text-red-600 bg-red-100";
  };

  const getPerformanceBarColor = (performance: number) => {
    if (performance >= 90) return "bg-green-600";
    if (performance >= 70) return "bg-yellow-600";
    return "bg-red-600";
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg font-semibold">📍 عملکرد شعب</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {branches.slice(0, 3).map((branch: any, index: number) => (
            <div key={branch.id} data-testid={`branch-${index}`}>
              <div className="flex items-center justify-between mb-2">
                <span className="font-medium">{branch.name}</span>
                <span className={`text-sm font-bold px-2 py-1 rounded-full ${getPerformanceColor(branch.performance)}`}>
                  {branch.performance}%
                </span>
              </div>
              <p className="text-sm text-muted-foreground mb-2">
                مدیر: {branch.manager}
              </p>
              <div className="w-full bg-muted rounded-full h-2">
                <div
                  className={`h-2 rounded-full ${getPerformanceBarColor(branch.performance)}`}
                  style={{ width: `${branch.performance}%` }}
                ></div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
