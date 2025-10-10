import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Trash2, Edit, Plus, FileSpreadsheet, Calendar, TrendingUp, TrendingDown } from "lucide-react";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { PosStatsFormModal } from "./pos-stats-form-modal";
import { PosStatsExcelImportModal } from "./pos-stats-excel-import-modal";
import type { PosMonthlyStats, Customer, Branch } from "@shared/schema";

const statusColors = {
  active: "bg-green-500",
  normal: "bg-yellow-500", 
  marketing: "bg-gray-500",
  collected: "bg-gray-700",
  loss: "bg-red-500"
};

const statusLabels = {
  active: "فعال",
  normal: "عادی",
  marketing: "بازاریابی", 
  collected: "جمع‌آوری شده",
  loss: "ضرر"
};

const persianMonths = [
  "فروردین", "اردیبهشت", "خرداد", "تیر", "مرداد", "شهریور",
  "مهر", "آبان", "آذر", "دی", "بهمن", "اسفند"
];

export function PosStatsManagement() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedYear, setSelectedYear] = useState<string>("all");
  const [selectedMonth, setSelectedMonth] = useState<string>("all");
  const [selectedBranch, setSelectedBranch] = useState<string>("all");
  const [selectedStatus, setSelectedStatus] = useState<string>("all");
  const [editingStats, setEditingStats] = useState<PosMonthlyStats | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isImportOpen, setIsImportOpen] = useState(false);
  const { toast } = useToast();

  // Fetch POS monthly stats
  const { data: stats = [], refetch: refetchStats } = useQuery({
    queryKey: ["/api/pos-stats"],
  });

  // Fetch customers for lookup
  const { data: customers = [] } = useQuery({
    queryKey: ["/api/customers"],
  });

  // Fetch branches for filtering
  const { data: branches = [] } = useQuery({
    queryKey: ["/api/branches"],
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const result = await fetch(`/api/pos-stats/${id}`, {
        method: 'DELETE',
      });
      return result.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/pos-stats'] });
      toast({
        title: "موفق",
        description: "آمار ماهانه با موفقیت حذف شد",
      });
    },
    onError: () => {
      toast({
        title: "خطا", 
        description: "خطا در حذف آمار ماهانه",
        variant: "destructive",
      });
    },
  });

  // Filter stats based on search and filters
  const filteredStats = stats.filter((stat: PosMonthlyStats) => {
    const customer = customers.find((c: Customer) => c.id === stat.customerId);
    const branch = branches.find((b: Branch) => b.id === stat.branchId);
    
    const matchesSearch = !searchTerm || 
      customer?.shopName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      customer?.ownerName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      branch?.name?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesYear = selectedYear === "all" || stat.year?.toString() === selectedYear;
    const matchesMonth = selectedMonth === "all" || stat.month?.toString() === selectedMonth;
    const matchesBranch = selectedBranch === "all" || stat.branchId === selectedBranch;
    const matchesStatus = selectedStatus === "all" || stat.status === selectedStatus;
    
    return matchesSearch && matchesYear && matchesMonth && matchesBranch && matchesStatus;
  });

  // Calculate summary statistics
  const totalStats = filteredStats.length;
  const totalRevenue = filteredStats.reduce((sum: number, stat: PosMonthlyStats) => sum + (stat.revenue || 0), 0);
  const totalProfit = filteredStats.reduce((sum: number, stat: PosMonthlyStats) => sum + (stat.profit || 0), 0);
  const avgProfit = totalStats > 0 ? totalProfit / totalStats : 0;

  const handleEdit = (stat: PosMonthlyStats) => {
    setEditingStats(stat);
    setIsFormOpen(true);
  };

  const handleAdd = () => {
    setEditingStats(null);
    setIsFormOpen(true);
  };

  const handleDelete = (id: string) => {
    if (confirm("آیا از حذف این آمار ماهانه اطمینان دارید؟")) {
      deleteMutation.mutate(id);
    }
  };

  const onFormSuccess = () => {
    setIsFormOpen(false);
    setEditingStats(null);
    refetchStats();
  };

  const onImportSuccess = () => {
    setIsImportOpen(false);
    refetchStats();
  };

  const getCustomerName = (customerId: string) => {
    const customer = customers.find((c: Customer) => c.id === customerId);
    return customer ? `${customer.shopName} (${customer.ownerName})` : "نامشخص";
  };

  const getBranchName = (branchId: string) => {
    const branch = branches.find((b: Branch) => b.id === branchId);
    return branch ? branch.name : "نامشخص";
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fa-IR').format(amount) + ' تومان';
  };

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 5 }, (_, i) => currentYear - i);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
          مدیریت آمار ماهانه POS
        </h2>
        <div className="flex gap-2">
          <Button
            onClick={() => setIsImportOpen(true)}
            variant="outline"
            className="flex items-center gap-2"
            data-testid="button-excel-import-pos-stats"
          >
            <FileSpreadsheet className="h-4 w-4" />
            بارگزاری Excel
          </Button>
          <Button
            onClick={handleAdd}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700"
            data-testid="button-add-pos-stats"
          >
            <Plus className="h-4 w-4" />
            افزودن آمار
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">
              کل آمار ماهانه
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="text-total-stats">
              {totalStats.toLocaleString('fa-IR')}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">
              کل درآمد
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600" data-testid="text-total-revenue">
              {formatCurrency(totalRevenue)}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">
              کل سود
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600" data-testid="text-total-profit">
              {formatCurrency(totalProfit)}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">
              میانگین سود
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600" data-testid="text-avg-profit">
              {formatCurrency(avgProfit)}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
        <Input
          placeholder="جستجو بر اساس نام فروشگاه، مالک یا شعبه..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="md:col-span-2"
          data-testid="input-search-pos-stats"
        />
        
        <Select value={selectedYear} onValueChange={setSelectedYear}>
          <SelectTrigger data-testid="select-year">
            <SelectValue placeholder="انتخاب سال" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">همه سال‌ها</SelectItem>
            {years.map(year => (
              <SelectItem key={year} value={String(year)}>
                {year.toLocaleString('fa-IR')}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        
        <Select value={selectedMonth} onValueChange={setSelectedMonth}>
          <SelectTrigger data-testid="select-month">
            <SelectValue placeholder="انتخاب ماه" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">همه ماه‌ها</SelectItem>
            {persianMonths.map((month, index) => (
              <SelectItem key={index + 1} value={(index + 1).toString()}>
                {month}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        
        <Select value={selectedBranch} onValueChange={setSelectedBranch}>
          <SelectTrigger data-testid="select-branch">
            <SelectValue placeholder="انتخاب شعبه" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">همه شعبه‌ها</SelectItem>
            {branches.filter((b: any) => b && b.id).map((branch: any) => (
              <SelectItem key={branch.id} value={String(branch.id)}>
                {branch.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        
        <Select value={selectedStatus} onValueChange={setSelectedStatus}>
          <SelectTrigger data-testid="select-status">
            <SelectValue placeholder="انتخاب وضعیت" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">همه وضعیت‌ها</SelectItem>
            {Object.entries(statusLabels).map(([key, label]) => (
              <SelectItem key={key} value={key}>
                {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredStats.map((stat: PosMonthlyStats) => (
          <Card key={stat.id} className="hover:shadow-md transition-shadow">
            <CardHeader>
              <div className="flex justify-between items-start">
                <div className="space-y-1">
                  <CardTitle className="text-lg">
                    {getCustomerName(stat.customerId)}
                  </CardTitle>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {getBranchName(stat.branchId)}
                  </p>
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    <span className="text-sm">
                      {persianMonths[(stat.month || 1) - 1]} {stat.year?.toLocaleString('fa-IR')}
                    </span>
                  </div>
                </div>
                <Badge
                  className={`${statusColors[stat.status as keyof typeof statusColors]} text-white`}
                  data-testid={`badge-status-${stat.id}`}
                >
                  {statusLabels[stat.status as keyof typeof statusLabels]}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>تراکنش‌ها:</span>
                  <span data-testid={`text-transactions-${stat.id}`}>
                    {(stat.totalTransactions || 0).toLocaleString('fa-IR')}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>مبلغ کل:</span>
                  <span data-testid={`text-amount-${stat.id}`}>
                    {formatCurrency(stat.totalAmount || 0)}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>درآمد:</span>
                  <span className="text-green-600" data-testid={`text-revenue-${stat.id}`}>
                    {formatCurrency(stat.revenue || 0)}
                  </span>
                </div>
                <div className="flex justify-between text-sm font-medium">
                  <span>سود:</span>
                  <span className={`${(stat.profit || 0) >= 0 ? 'text-blue-600' : 'text-red-600'} flex items-center gap-1`}>
                    {(stat.profit || 0) >= 0 ? (
                      <TrendingUp className="h-3 w-3" />
                    ) : (
                      <TrendingDown className="h-3 w-3" />
                    )}
                    {formatCurrency(stat.profit || 0)}
                  </span>
                </div>
                {stat.notes && (
                  <div className="text-xs text-gray-500 mt-2">
                    {stat.notes}
                  </div>
                )}
              </div>
              
              <div className="flex justify-end gap-2 mt-4">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleEdit(stat)}
                  data-testid={`button-edit-pos-stats-${stat.id}`}
                >
                  <Edit className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleDelete(stat.id)}
                  className="text-red-600 hover:text-red-700"
                  data-testid={`button-delete-pos-stats-${stat.id}`}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredStats.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          هیچ آمار ماهانه‌ای یافت نشد
        </div>
      )}

      {/* Modals */}
      <PosStatsFormModal
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        onSuccess={onFormSuccess}
        stats={editingStats}
        customers={customers}
        branches={branches}
      />

      <PosStatsExcelImportModal
        isOpen={isImportOpen}
        onClose={() => setIsImportOpen(false)}
        onSuccess={onImportSuccess}
        customers={customers}
        branches={branches}
      />
    </div>
  );
}