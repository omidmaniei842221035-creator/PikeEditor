import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertCustomerSchema } from "@shared/schema";
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
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { z } from "zod";

type CustomerFormData = z.infer<typeof insertCustomerSchema>;

interface CustomerFormModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CustomerFormModal({ open, onOpenChange }: CustomerFormModalProps) {
  const [selectedLocation, setSelectedLocation] = useState<{lat: number, lng: number} | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: branches = [] } = useQuery({
    queryKey: ["/api/branches"],
  });

  const { data: employees = [] } = useQuery({
    queryKey: ["/api/employees"],
  });

  const form = useForm<CustomerFormData>({
    resolver: zodResolver(insertCustomerSchema),
    defaultValues: {
      shopName: "",
      ownerName: "",
      phone: "",
      businessType: "",
      address: "",
      monthlyProfit: 0,
      status: "active",
      branchId: "",
      supportEmployeeId: "",
    },
  });

  const createCustomerMutation = useMutation({
    mutationFn: async (data: CustomerFormData) => {
      const customerData = {
        ...data,
        latitude: selectedLocation?.lat?.toString(),
        longitude: selectedLocation?.lng?.toString(),
      };
      return apiRequest("POST", "/api/customers", customerData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/customers"] });
      queryClient.invalidateQueries({ queryKey: ["/api/analytics/overview"] });
      toast({
        title: "موفقیت",
        description: "مشتری جدید با موفقیت اضافه شد",
      });
      onOpenChange(false);
      form.reset();
      setSelectedLocation(null);
    },
    onError: () => {
      toast({
        title: "خطا",
        description: "خطا در افزودن مشتری",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: CustomerFormData) => {
    createCustomerMutation.mutate(data);
  };

  const businessTypes = [
    "سوپرمارکت",
    "فروشگاه عمومی", 
    "مینی‌مارکت",
    "فروشگاه زنجیره‌ای",
    "رستوران",
    "کافه",
    "فست‌فود",
    "نانوایی",
    "قنادی",
    "آبمیوه‌فروشی",
    "بستنی‌فروشی",
    "پوشاک",
    "آرایشگاه",
    "لوازم آرایشی",
    "کیف و کفش",
    "طلا و جواهر",
    "داروخانه",
    "عطاری",
    "مطب",
    "دندانپزشکی",
    "آزمایشگاه",
    "موبایل‌فروشی",
    "کامپیوتر",
    "لوازم خانگی",
    "کافه‌نت",
    "تعمیرگاه خودرو",
    "نمایشگاه خودرو",
    "پمپ بنزین",
    "لوازم یدکی",
    "بانک",
    "بیمه",
    "هتل",
    "آژانس مسافرتی",
    "باشگاه ورزشی",
    "کتابفروشی",
    "اسباب‌بازی",
    "گل‌فروشی",
    "سایر"
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto" dir="rtl">
        <DialogHeader>
          <DialogTitle>افزودن مشتری جدید</DialogTitle>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="shopName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>نام فروشگاه *</FormLabel>
                    <FormControl>
                      <Input {...field} data-testid="shop-name-input" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="ownerName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>نام مالک *</FormLabel>
                    <FormControl>
                      <Input {...field} data-testid="owner-name-input" />
                    </FormControl>
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
                    <FormLabel>شماره تلفن *</FormLabel>
                    <FormControl>
                      <Input {...field} type="tel" data-testid="phone-input" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="businessType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>نوع کسب‌وکار *</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger data-testid="business-type-select">
                          <SelectValue placeholder="انتخاب کنید" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {businessTypes.map((type) => (
                          <SelectItem key={type} value={type}>
                            {type}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            <FormField
              control={form.control}
              name="address"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>آدرس</FormLabel>
                  <FormControl>
                    <Textarea {...field} rows={3} data-testid="address-input" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="monthlyProfit"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>سود ماهانه (تومان)</FormLabel>
                    <FormControl>
                      <Input 
                        {...field} 
                        type="number"
                        onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                        data-testid="monthly-profit-input"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
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
            </div>
            
            <FormField
              control={form.control}
              name="supportEmployeeId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>کارمند پشتیبان</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value || ""}>
                    <FormControl>
                      <SelectTrigger data-testid="support-employee-select">
                        <SelectValue placeholder="انتخاب کارمند" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {employees.map((employee: any) => (
                        <SelectItem key={employee.id} value={employee.id}>
                          {employee.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <div className="border-t border-border pt-4">
              <div className="flex items-center justify-between">
                <Button type="button" variant="outline" size="sm">
                  📍 انتخاب از نقشه
                </Button>
                <span className="text-sm text-muted-foreground">
                  **موقعیت انتخاب شده:** {selectedLocation ? "انتخاب شده" : "هیچ"}
                </span>
              </div>
            </div>
            
            <div className="flex items-center gap-3 pt-4">
              <Button 
                type="submit" 
                disabled={createCustomerMutation.isPending}
                data-testid="save-customer-button"
              >
                {createCustomerMutation.isPending ? "در حال ذخیره..." : "💾 ذخیره مشتری"}
              </Button>
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => onOpenChange(false)}
                data-testid="cancel-button"
              >
                لغو
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
