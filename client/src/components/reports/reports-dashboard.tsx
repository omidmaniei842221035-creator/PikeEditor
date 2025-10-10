import { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { apiRequest } from "@/lib/queryClient";
import { Badge } from "@/components/ui/badge";
import { exportToExcel } from "@/lib/excel-utils";

export function ReportsDashboard() {
  const [branchFilter, setBranchFilter] = useState("all");
  const [employeeFilter, setEmployeeFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [businessTypeFilter, setBusinessTypeFilter] = useState("all");
  const [reportData, setReportData] = useState<any>(null);

  const { data: branches = [] } = useQuery<any[]>({
    queryKey: ["/api/branches"],
  });

  const { data: employees = [] } = useQuery<any[]>({
    queryKey: ["/api/employees"],
  });

  const generateReportMutation = useMutation({
    mutationFn: async (filters: any) => {
      return apiRequest("POST", "/api/reports/generate", filters);
    },
    onSuccess: (data) => {
      setReportData(data);
    },
  });

  const handleGenerateReport = () => {
    const filters = {
      branchId: branchFilter === "all" ? undefined : branchFilter,
      employeeId: employeeFilter === "all" ? undefined : employeeFilter,
      status: statusFilter === "all" ? undefined : statusFilter,
      businessType: businessTypeFilter === "all" ? undefined : businessTypeFilter,
    };
    
    generateReportMutation.mutate(filters);
  };

  const handleExcelExport = () => {
    if (reportData?.customers) {
      const excelData = reportData.customers.map((customer: any) => ({
        "نام فروشگاه": customer.shopName,
        "نام مالک": customer.ownerName,
        "نوع کسب‌وکار": customer.businessType,
        "وضعیت": customer.status,
        "سود ماهانه": customer.monthlyProfit || 0,
        "شماره تماس": customer.phone,
        "آدرس": customer.address || "",
      }));
      
      exportToExcel(excelData, "گزارش_مشتریان.xlsx");
    }
  };

  const getStatusBadge = (status: string) => {
    const styles = {
      active: "bg-green-100 text-green-800",
      inactive: "bg-gray-100 text-gray-800", 
      marketing: "bg-yellow-100 text-yellow-800",
      loss: "bg-red-100 text-red-800",
      collected: "bg-blue-100 text-blue-800",
    };
    
    const labels = {
      active: "✅ کارآمد",
      inactive: "⏸️ غیرفعال",
      marketing: "📢 بازاریابی",
      loss: "❌ زیان‌ده",
      collected: "📦 جمع‌آوری شده",
    };

    return (
      <Badge className={styles[status as keyof typeof styles] || styles.inactive}>
        {labels[status as keyof typeof labels] || status}
      </Badge>
    );
  };

  const businessTypes = [
    "سوپرمارکت", "رستوران", "داروخانه", "فروشگاه", "کافه", "نانوایی",
    "پوشاک", "آرایشگاه", "موبایل‌فروشی", "کامپیوتر", "کافه‌نت"
  ];

  return (
    <div className="space-y-6">
      <div className="mb-6">
        <h3 className="text-2xl font-bold">گزارش‌گیری پیشرفته</h3>
        <p className="text-muted-foreground">گزارش‌های تفکیکی بر اساس شعبه، کارمند، وضعیت و منطقه</p>
      </div>

      {/* Report Filters */}
      <Card>
        <CardHeader>
          <CardTitle>فیلترهای گزارش‌گیری</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <div>
              <label className="block text-sm font-medium mb-2">شعبه:</label>
              <Select value={branchFilter} onValueChange={setBranchFilter}>
                <SelectTrigger data-testid="branch-filter">
                  <SelectValue placeholder="همه شعب" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">همه شعب</SelectItem>
                  {branches.map((branch: any) => (
                    <SelectItem key={branch.id} value={branch.id}>
                      {branch.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-2">کارمند:</label>
              <Select value={employeeFilter} onValueChange={setEmployeeFilter}>
                <SelectTrigger data-testid="employee-filter">
                  <SelectValue placeholder="همه کارمندان" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">همه کارمندان</SelectItem>
                  {employees.map((employee: any) => (
                    <SelectItem key={employee.id} value={employee.id}>
                      {employee.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-2">وضعیت POS:</label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger data-testid="status-filter">
                  <SelectValue placeholder="همه وضعیت‌ها" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">همه وضعیت‌ها</SelectItem>
                  <SelectItem value="active">کارآمد</SelectItem>
                  <SelectItem value="marketing">در حال بازاریابی</SelectItem>
                  <SelectItem value="loss">زیان‌ده</SelectItem>
                  <SelectItem value="inactive">غیرفعال</SelectItem>
                  <SelectItem value="collected">جمع‌آوری شده</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-2">نوع کسب‌وکار:</label>
              <Select value={businessTypeFilter} onValueChange={setBusinessTypeFilter}>
                <SelectTrigger data-testid="business-type-filter">
                  <SelectValue placeholder="همه انواع" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">همه انواع</SelectItem>
                  {businessTypes.map((type) => (
                    <SelectItem key={type} value={type}>
                      {type}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <Button 
              onClick={handleGenerateReport}
              disabled={generateReportMutation.isPending}
              data-testid="generate-report-button"
            >
              {generateReportMutation.isPending ? "در حال تولید..." : "🔍 تولید گزارش"}
            </Button>
            
            {reportData && (
              <Button 
                variant="outline"
                onClick={handleExcelExport}
                data-testid="export-excel-button"
              >
                📊 خروجی اکسل
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Report Results */}
      {reportData && (
        <Card>
          <CardHeader>
            <CardTitle>نتایج گزارش</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
              <div className="text-center p-4 bg-primary/5 rounded-lg">
                <p className="text-3xl font-bold text-primary" data-testid="report-total">
                  {reportData.summary?.total || 0}
                </p>
                <p className="text-sm text-muted-foreground">تعداد کل</p>
              </div>
              <div className="text-center p-4 bg-secondary/5 rounded-lg">
                <p className="text-3xl font-bold text-secondary" data-testid="report-total-profit">
                  {Math.round((reportData.summary?.totalProfit || 0) / 1000000)}M
                </p>
                <p className="text-sm text-muted-foreground">مجموع سود (میلیون تومان)</p>
              </div>
              <div className="text-center p-4 bg-green-500/5 rounded-lg">
                <p className="text-3xl font-bold text-green-600" data-testid="report-avg-profit">
                  {Math.round((reportData.summary?.avgProfit || 0) / 1000000)}M
                </p>
                <p className="text-sm text-muted-foreground">متوسط سود (میلیون تومان)</p>
              </div>
            </div>
            
            {/* Report Table */}
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-muted/50">
                  <tr>
                    <th className="text-right p-3 font-medium">نام فروشگاه</th>
                    <th className="text-right p-3 font-medium">مالک</th>
                    <th className="text-right p-3 font-medium">نوع کسب‌وکار</th>
                    <th className="text-right p-3 font-medium">وضعیت</th>
                    <th className="text-right p-3 font-medium">سود ماهانه</th>
                    <th className="text-right p-3 font-medium">شماره تماس</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {reportData.customers?.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="p-8 text-center text-muted-foreground">
                        <div className="flex flex-col items-center gap-4">
                          <span className="text-4xl">📊</span>
                          <p>هیچ نتیجه‌ای برای فیلترهای انتخاب شده یافت نشد</p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    reportData.customers?.map((customer: any, index: number) => (
                      <tr 
                        key={customer.id} 
                        className="hover:bg-muted/30 transition-colors"
                        data-testid={`report-row-${index}`}
                      >
                        <td className="p-3 font-medium">{customer.shopName}</td>
                        <td className="p-3">{customer.ownerName}</td>
                        <td className="p-3">
                          <Badge variant="outline">
                            {customer.businessType}
                          </Badge>
                        </td>
                        <td className="p-3">
                          {getStatusBadge(customer.status)}
                        </td>
                        <td className="p-3 font-medium">
                          {customer.monthlyProfit 
                            ? `${Math.round(customer.monthlyProfit / 1000000)}M تومان`
                            : "نامشخص"
                          }
                        </td>
                        <td className="p-3" dir="ltr">{customer.phone}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination for large datasets */}
            {reportData.customers?.length > 0 && (
              <div className="mt-6 flex items-center justify-between">
                <div className="text-sm text-muted-foreground">
                  نمایش 1-{reportData.customers.length} از {reportData.customers.length} نتیجه
                </div>
                <div className="text-sm text-muted-foreground">
                  آخرین به‌روزرسانی: {new Date().toLocaleString("fa-IR")}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Empty State */}
      {!reportData && !generateReportMutation.isPending && (
        <Card>
          <CardContent className="p-12 text-center text-muted-foreground">
            <div className="flex flex-col items-center gap-4">
              <span className="text-6xl">📋</span>
              <h3 className="text-lg font-medium">تولید گزارش</h3>
              <p>برای مشاهده نتایج گزارش، فیلترهای مورد نظر را انتخاب کرده و دکمه "تولید گزارش" را کلیک کنید.</p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
