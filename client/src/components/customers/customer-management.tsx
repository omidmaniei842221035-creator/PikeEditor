import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { CustomerFormModal } from "./customer-form-modal";

export function CustomerManagement() {
  const [showAddModal, setShowAddModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [businessTypeFilter, setBusinessTypeFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [branchFilter, setBranchFilter] = useState("all");

  const { data: customers = [] } = useQuery({
    queryKey: ["/api/customers", { 
      search: searchQuery,
      businessType: businessTypeFilter === "all" ? undefined : businessTypeFilter,
      status: statusFilter === "all" ? undefined : statusFilter,
      branch: branchFilter === "all" ? undefined : branchFilter,
    }],
  });

  const { data: branches = [] } = useQuery({
    queryKey: ["/api/branches"],
  });

  const { data: analytics } = useQuery({
    queryKey: ["/api/analytics/overview"],
  });

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

  const getBusinessTypeBadge = (type: string) => {
    const icons = {
      "سوپرمارکت": "🛒",
      "رستوران": "🍽️",
      "داروخانه": "💊",
      "فروشگاه": "🏬",
      "کافه": "☕",
      "نانوایی": "🍞",
    };

    return (
      <Badge variant="outline" className="business-supermarket">
        {icons[type as keyof typeof icons] || "🏪"} {type}
      </Badge>
    );
  };

  const totalRevenue = customers.reduce((sum: number, customer: any) => 
    sum + (customer.monthlyProfit || 0), 0
  );
  
  const avgProfit = customers.length > 0 ? totalRevenue / customers.length : 0;
  const activeCustomers = customers.filter((c: any) => c.status === 'active').length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-2xl font-bold">مدیریت مشتریان</h3>
          <p className="text-muted-foreground">لیست کامل مشتریان و جزئیات آن‌ها</p>
        </div>
        <Button 
          onClick={() => setShowAddModal(true)}
          data-testid="add-customer-button"
        >
          ➕ افزودن مشتری جدید
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <h3 className="text-2xl font-bold" data-testid="total-customers">
              {customers.length}
            </h3>
            <p className="text-muted-foreground">کل مشتریان</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <h3 className="text-2xl font-bold text-green-600" data-testid="active-customers">
              {activeCustomers}
            </h3>
            <p className="text-muted-foreground">مشتریان فعال</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <h3 className="text-2xl font-bold" data-testid="total-revenue">
              {Math.round(totalRevenue / 1000000)}M
            </h3>
            <p className="text-muted-foreground">درآمد (میلیون تومان)</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <h3 className="text-2xl font-bold" data-testid="avg-profit">
              {Math.round(avgProfit / 1000)}K
            </h3>
            <p className="text-muted-foreground">متوسط سود (هزار تومان)</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>فیلترها و جستجو</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium mb-2">جستجو:</label>
              <Input
                placeholder="نام فروشگاه، مالک یا شماره تماس..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                data-testid="search-input"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-2">نوع کسب‌وکار:</label>
              <Select value={businessTypeFilter} onValueChange={setBusinessTypeFilter}>
                <SelectTrigger data-testid="business-type-filter">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">همه انواع</SelectItem>
                  <SelectItem value="سوپرمارکت">سوپرمارکت</SelectItem>
                  <SelectItem value="رستوران">رستوران</SelectItem>
                  <SelectItem value="داروخانه">داروخانه</SelectItem>
                  <SelectItem value="فروشگاه">فروشگاه</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-2">وضعیت:</label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger data-testid="status-filter">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">همه وضعیت‌ها</SelectItem>
                  <SelectItem value="active">✅ کارآمد</SelectItem>
                  <SelectItem value="marketing">📢 بازاریابی</SelectItem>
                  <SelectItem value="loss">❌ زیان‌ده</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-2">شعبه:</label>
              <Select value={branchFilter} onValueChange={setBranchFilter}>
                <SelectTrigger data-testid="branch-filter">
                  <SelectValue />
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
          </div>
          
          <div className="flex items-center gap-3">
            <Button variant="outline">پاک کردن فیلتر</Button>
            <div className="mr-auto">
              <Button variant="outline" size="sm">
                📊 خروجی اکسل
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Customers Table */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-muted/50">
                <tr>
                  <th className="text-right p-4 font-medium">نام فروشگاه</th>
                  <th className="text-right p-4 font-medium">مالک</th>
                  <th className="text-right p-4 font-medium">نوع کسب‌وکار</th>
                  <th className="text-right p-4 font-medium">وضعیت</th>
                  <th className="text-right p-4 font-medium">سود ماهانه</th>
                  <th className="text-right p-4 font-medium">شعبه</th>
                  <th className="text-right p-4 font-medium">عملیات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {customers.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="p-8 text-center text-muted-foreground">
                      <div className="flex flex-col items-center gap-4">
                        <span className="text-4xl">📁</span>
                        <p>هیچ مشتری یافت نشد</p>
                        {searchQuery && (
                          <p className="text-sm">برای "{searchQuery}" نتیجه‌ای یافت نشد</p>
                        )}
                      </div>
                    </td>
                  </tr>
                ) : (
                  customers.map((customer: any, index: number) => {
                    const branch = branches.find((b: any) => b.id === customer.branchId);
                    return (
                      <tr 
                        key={customer.id} 
                        className="hover:bg-muted/30 transition-colors"
                        data-testid={`customer-row-${index}`}
                      >
                        <td className="p-4">
                          <div className="font-medium">{customer.shopName}</div>
                          <div className="text-sm text-muted-foreground">
                            شناسه: {customer.id.slice(0, 8)}
                          </div>
                        </td>
                        <td className="p-4">{customer.ownerName}</td>
                        <td className="p-4">
                          {getBusinessTypeBadge(customer.businessType)}
                        </td>
                        <td className="p-4">
                          {getStatusBadge(customer.status)}
                        </td>
                        <td className="p-4 font-medium">
                          {customer.monthlyProfit 
                            ? `${Math.round(customer.monthlyProfit / 1000000)}M تومان`
                            : "نامشخص"
                          }
                        </td>
                        <td className="p-4">{branch?.name || "نامشخص"}</td>
                        <td className="p-4">
                          <div className="flex items-center gap-2">
                            <Button 
                              size="sm" 
                              variant="outline"
                              data-testid={`edit-customer-${index}`}
                            >
                              ✏️
                            </Button>
                            <Button 
                              size="sm" 
                              variant="outline"
                              data-testid={`delete-customer-${index}`}
                            >
                              🗑️
                            </Button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
          
          {/* Pagination */}
          {customers.length > 0 && (
            <div className="p-4 border-t border-border flex items-center justify-between">
              <div className="text-sm text-muted-foreground">
                نمایش 1-{customers.length} از {customers.length} نتیجه
              </div>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" disabled>
                  قبلی
                </Button>
                <Button variant="outline" size="sm" className="bg-primary text-primary-foreground">
                  1
                </Button>
                <Button variant="outline" size="sm" disabled>
                  بعدی
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <CustomerFormModal 
        open={showAddModal} 
        onOpenChange={setShowAddModal}
      />
    </div>
  );
}
