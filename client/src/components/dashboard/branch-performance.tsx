import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Building2, TrendingUp } from "lucide-react";

interface Branch {
  id: string;
  name: string;
  manager: string;
  performance: number;
}

export function BranchPerformance() {
  const { data: branches = [] } = useQuery<Branch[]>({
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
    <Card className="border-0 shadow-sm">
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-blue-50 rounded-lg flex items-center justify-center">
            <Building2 className="w-4 h-4 text-blue-600" />
          </div>
          <CardTitle className="text-sm font-semibold">عملکرد شعب</CardTitle>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="space-y-4">
          {branches.slice(0, 3).map((branch, index: number) => (
            <div key={branch.id} data-testid={`branch-${index}`} className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                  <span className="font-medium text-sm">{branch.name}</span>
                </div>
                <div className="flex items-center gap-2">
                  <TrendingUp className="w-3 h-3 text-muted-foreground" />
                  <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${getPerformanceColor(branch.performance)}`}>
                    {branch.performance}%
                  </span>
                </div>
              </div>
              <p className="text-xs text-muted-foreground pl-4">
                مدیر: {branch.manager}
              </p>
              <div className="w-full bg-muted rounded-full h-1.5">
                <div
                  className={`h-1.5 rounded-full transition-all duration-300 ${getPerformanceBarColor(branch.performance)}`}
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
