import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { EmployeeFormModal } from "./employee-form-modal";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

export function EmployeeManagement() {
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [positionFilter, setPositionFilter] = useState("all");
  const [branchFilter, setBranchFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: employees = [] } = useQuery({
    queryKey: ["/api/employees"],
  });

  const { data: branches = [] } = useQuery({
    queryKey: ["/api/branches"],
  });

  const deleteEmployeeMutation = useMutation({
    mutationFn: async (id: string) => {
      return apiRequest("DELETE", `/api/employees/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/employees"] });
      toast({
        title: "موفقیت",
        description: "کارمند با موفقیت حذف شد",
      });
    },
    onError: () => {
      toast({
        title: "خطا",
        description: "خطا در حذف کارمند",
        variant: "destructive",
      });
    },
  });

  const filteredEmployees = employees.filter((employee: any) => {
    const searchMatch = 
      employee.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      employee.employeeCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
      employee.phone?.includes(searchQuery);
    
    const positionMatch = positionFilter === "all" || employee.position === positionFilter;
    const branchMatch = branchFilter === "all" || employee.branchId === branchFilter;
    const statusMatch = statusFilter === "all" || 
      (statusFilter === "active" && employee.isActive) ||
      (statusFilter === "inactive" && !employee.isActive);

    return searchMatch && positionMatch && branchMatch && statusMatch;
  });

  const positions = ["مدیر فروش", "کارشناس پشتیبانی", "نماینده فروش", "مدیر شعبه", "کارشناس فنی", "کارشناس بازاریابی"];

  const getPositionBadge = (position: string) => {
    const colors = {
      "مدیر فروش": "bg-blue-100 text-blue-800",
      "کارشناس پشتیبانی": "bg-green-100 text-green-800",
      "نماینده فروش": "bg-purple-100 text-purple-800",
      "مدیر شعبه": "bg-red-100 text-red-800",
      "کارشناس فنی": "bg-orange-100 text-orange-800",
      "کارشناس بازاریابی": "bg-pink-100 text-pink-800",
    };

    return (
      <Badge className={colors[position as keyof typeof colors] || "bg-gray-100 text-gray-800"}>
        {position}
      </Badge>
    );
  };

  const activeEmployees = employees.filter((emp: any) => emp.isActive).length;
  const totalSalary = employees.reduce((sum: number, emp: any) => sum + (emp.salary || 0), 0);
  const avgSalary = employees.length > 0 ? totalSalary / employees.length : 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-2xl font-bold">مدیریت کارمندان</h3>
          <p className="text-muted-foreground">کارمندان، دسترسی‌ها و عملکرد</p>
        </div>
        <Button 
          onClick={() => setShowAddModal(true)}
          data-testid="add-employee-button"
        >
          ➕ افزودن کارمند جدید
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <h3 className="text-2xl font-bold" data-testid="total-employees">
              {employees.length}
            </h3>
            <p className="text-muted-foreground">کل کارمندان</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <h3 className="text-2xl font-bold text-green-600" data-testid="active-employees">
              {activeEmployees}
            </h3>
            <p className="text-muted-foreground">کارمندان فعال</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <h3 className="text-2xl font-bold" data-testid="total-salary">
              {Math.round(totalSalary / 1000000)}M
            </h3>
            <p className="text-muted-foreground">کل حقوق (میلیون تومان)</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <h3 className="text-2xl font-bold" data-testid="avg-salary">
              {Math.round(avgSalary / 1000000)}M
            </h3>
            <p className="text-muted-foreground">متوسط حقوق (میلیون تومان)</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>فیلترها و جستجو</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">جستجو:</label>
              <Input
                placeholder="نام، کد کارمندی یا شماره تماس..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                data-testid="employee-search-input"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-2">سمت:</label>
              <Select value={positionFilter} onValueChange={setPositionFilter}>
                <SelectTrigger data-testid="position-filter">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">همه سمت‌ها</SelectItem>
                  {positions.map((position) => (
                    <SelectItem key={position} value={position}>
                      {position}
                    </SelectItem>
                  ))}
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
            
            <div>
              <label className="block text-sm font-medium mb-2">وضعیت:</label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger data-testid="status-filter">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">همه وضعیت‌ها</SelectItem>
                  <SelectItem value="active">✅ فعال</SelectItem>
                  <SelectItem value="inactive">❌ غیرفعال</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Employee Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredEmployees.length === 0 ? (
          <div className="col-span-full">
            <Card>
              <CardContent className="p-8 text-center text-muted-foreground">
                <div className="flex flex-col items-center gap-4">
                  <span className="text-4xl">👥</span>
                  <p>هیچ کارمندی یافت نشد</p>
                  {searchQuery && (
                    <p className="text-sm">برای "{searchQuery}" نتیجه‌ای یافت نشد</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        ) : (
          filteredEmployees.map((employee: any, index: number) => {
            const branch = branches.find((b: any) => b.id === employee.branchId);
            const avatarColor = index % 2 === 0 ? "bg-primary/20 text-primary" : "bg-secondary/20 text-secondary";
            
            return (
              <Card 
                key={employee.id} 
                className="hover:shadow-lg transition-shadow"
                data-testid={`employee-card-${index}`}
              >
                <CardContent className="p-6">
                  <div className="flex items-center gap-4 mb-4">
                    <div className={`w-16 h-16 rounded-full flex items-center justify-center text-2xl font-bold ${avatarColor}`}>
                      {employee.name.charAt(0)}
                    </div>
                    <div className="flex-1">
                      <h4 className="font-semibold text-lg">{employee.name}</h4>
                      {getPositionBadge(employee.position)}
                      {!employee.isActive && (
                        <Badge variant="destructive" className="mr-2">غیرفعال</Badge>
                      )}
                    </div>
                  </div>
                  
                  <div className="space-y-2 text-sm mb-4">
                    <div className="flex items-center justify-between">
                      <span className="font-medium">کد کارمندی:</span>
                      <span className="text-muted-foreground">{employee.employeeCode}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="font-medium">شماره تماس:</span>
                      <span className="text-muted-foreground" dir="ltr">{employee.phone || "نامشخص"}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="font-medium">شعبه:</span>
                      <span className="text-muted-foreground">{branch?.name || "نامشخص"}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="font-medium">حقوق ماهانه:</span>
                      <span className="text-muted-foreground">
                        {employee.salary ? `${Math.round(employee.salary / 1000000)}M تومان` : "نامشخص"}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="font-medium">تاریخ استخدام:</span>
                      <span className="text-muted-foreground">
                        {employee.hireDate 
                          ? new Date(employee.hireDate).toLocaleDateString("fa-IR")
                          : "نامشخص"
                        }
                      </span>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => {
                        setEditingEmployee(employee);
                        setShowAddModal(true);
                      }}
                      data-testid={`edit-employee-${index}`}
                    >
                      ✏️ ویرایش
                    </Button>
                    
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button 
                          size="sm" 
                          variant="outline"
                          data-testid={`delete-employee-${index}`}
                        >
                          🗑️ حذف
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent dir="rtl">
                        <AlertDialogHeader>
                          <AlertDialogTitle>تأیید حذف</AlertDialogTitle>
                          <AlertDialogDescription>
                            آیا مطمئن هستید که می‌خواهید کارمند "{employee.name}" را حذف کنید؟
                            این عملیات قابل بازگشت نیست.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>انصراف</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => deleteEmployeeMutation.mutate(employee.id)}
                            disabled={deleteEmployeeMutation.isPending}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                          >
                            {deleteEmployeeMutation.isPending ? "در حال حذف..." : "حذف"}
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>

      <EmployeeFormModal 
        open={showAddModal} 
        onOpenChange={(open) => {
          setShowAddModal(open);
          if (!open) {
            setEditingEmployee(null);
          }
        }}
        employee={editingEmployee}
      />
    </div>
  );
}
