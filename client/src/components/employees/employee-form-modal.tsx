import { useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertEmployeeSchema } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { z } from "zod";

type EmployeeFormData = z.infer<typeof insertEmployeeSchema>;

interface EmployeeFormModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  employee?: any;
}

export function EmployeeFormModal({ open, onOpenChange, employee }: EmployeeFormModalProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const isEditing = !!employee;

  const { data: branches = [] } = useQuery({
    queryKey: ["/api/branches"],
  });

  const form = useForm<EmployeeFormData>({
    resolver: zodResolver(insertEmployeeSchema),
    defaultValues: {
      employeeCode: "",
      name: "",
      position: "",
      phone: "",
      email: "",
      branchId: "",
      salary: 0,
      isActive: true,
    },
  });

  useEffect(() => {
    if (employee && open) {
      form.reset({
        employeeCode: employee.employeeCode,
        name: employee.name,
        position: employee.position,
        phone: employee.phone || "",
        email: employee.email || "",
        branchId: employee.branchId || "",
        salary: employee.salary || 0,
        isActive: employee.isActive ?? true,
      });
    } else if (!employee) {
      form.reset({
        employeeCode: "",
        name: "",
        position: "",
        phone: "",
        email: "",
        branchId: "",
        salary: 0,
        isActive: true,
      });
    }
  }, [employee, open, form]);

  const createEmployeeMutation = useMutation({
    mutationFn: async (data: EmployeeFormData) => {
      if (isEditing) {
        return apiRequest("PUT", `/api/employees/${employee.id}`, data);
      } else {
        return apiRequest("POST", "/api/employees", data);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/employees"] });
      toast({
        title: "موفقیت",
        description: isEditing ? "کارمند با موفقیت ویرایش شد" : "کارمند جدید با موفقیت اضافه شد",
      });
      onOpenChange(false);
      form.reset();
    },
    onError: () => {
      toast({
        title: "خطا",
        description: isEditing ? "خطا در ویرایش کارمند" : "خطا در افزودن کارمند",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: EmployeeFormData) => {
    createEmployeeMutation.mutate(data);
  };

  const positions = [
    "مدیر فروش",
    "کارشناس پشتیبانی",
    "نماینده فروش",
    "مدیر شعبه",
    "کارشناس فنی",
    "کارشناس بازاریابی",
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg" dir="rtl">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? "ویرایش کارمند" : "افزودن کارمند جدید"}
          </DialogTitle>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>نام کارمند *</FormLabel>
                  <FormControl>
                    <Input {...field} data-testid="employee-name-input" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="employeeCode"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>کد کارمندی *</FormLabel>
                    <FormControl>
                      <Input {...field} data-testid="employee-code-input" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="position"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>سمت *</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger data-testid="position-select">
                          <SelectValue placeholder="انتخاب سمت" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {positions.map((position) => (
                          <SelectItem key={position} value={position}>
                            {position}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>شماره تماس</FormLabel>
                    <FormControl>
                      <Input {...field} type="tel" data-testid="phone-input" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>ایمیل</FormLabel>
                    <FormControl>
                      <Input {...field} type="email" data-testid="email-input" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="branchId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>شعبه</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value || ""}>
                      <FormControl>
                        <SelectTrigger data-testid="branch-select">
                          <SelectValue placeholder="انتخاب شعبه" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {branches.map((branch: any) => (
                          <SelectItem key={branch.id} value={branch.id}>
                            {branch.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="salary"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>حقوق ماهانه (تومان)</FormLabel>
                    <FormControl>
                      <Input 
                        {...field} 
                        type="number"
                        onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                        data-testid="salary-input"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            <FormField
              control={form.control}
              name="isActive"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                  <div className="space-y-0.5">
                    <FormLabel>وضعیت کارمند</FormLabel>
                    <div className="text-sm text-muted-foreground">
                      کارمند در حال حاضر فعال است؟
                    </div>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                      data-testid="active-switch"
                    />
                  </FormControl>
                </FormItem>
              )}
            />
            
            <div className="flex items-center gap-3 pt-4">
              <Button 
                type="submit" 
                disabled={createEmployeeMutation.isPending}
                data-testid="save-employee-button"
              >
                {createEmployeeMutation.isPending 
                  ? "در حال ذخیره..." 
                  : isEditing 
                    ? "💾 ذخیره تغییرات" 
                    : "💾 ذخیره کارمند"
                }
              </Button>
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => onOpenChange(false)}
                data-testid="cancel-button"
              >
                ❌ انصراف
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
