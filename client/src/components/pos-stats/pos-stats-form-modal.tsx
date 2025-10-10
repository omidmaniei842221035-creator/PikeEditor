import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { insertPosMonthlyStatsSchema } from "@shared/schema";
import type { PosMonthlyStats, Customer, Branch } from "@shared/schema";
import { z } from "zod";

const formSchema = insertPosMonthlyStatsSchema.extend({
  customerId: z.string().min(1, "انتخاب مشتری الزامی است"),
  branchId: z.string().min(1, "انتخاب شعبه الزامی است"),
  year: z.coerce.number().min(1400, "سال نامعتبر است").max(1500, "سال نامعتبر است"),
  month: z.coerce.number().min(1, "ماه باید بین 1 تا 12 باشد").max(12, "ماه باید بین 1 تا 12 باشد"),
  totalTransactions: z.coerce.number().min(0, "تعداد تراکنش نمی‌تواند منفی باشد"),
  totalAmount: z.coerce.number().min(0, "مبلغ کل نمی‌تواند منفی باشد"),
  revenue: z.coerce.number().min(0, "درآمد نمی‌تواند منفی باشد"),
  profit: z.coerce.number(), // Can be negative
});

type FormData = z.infer<typeof formSchema>;

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

interface PosStatsFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  stats?: PosMonthlyStats | null;
  customers: Customer[];
  branches: Branch[];
}

export function PosStatsFormModal({
  isOpen,
  onClose,
  onSuccess,
  stats,
  customers,
  branches
}: PosStatsFormModalProps) {
  const { toast } = useToast();
  const isEditing = !!stats;

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      customerId: stats?.customerId || "",
      branchId: stats?.branchId || "",
      year: stats?.year || new Date().getFullYear(),
      month: stats?.month || new Date().getMonth() + 1,
      totalTransactions: stats?.totalTransactions || 0,
      totalAmount: stats?.totalAmount || 0,
      revenue: stats?.revenue || 0,
      profit: stats?.profit || 0,
      status: stats?.status || "active",
      notes: stats?.notes || "",
    },
  });

  const mutation = useMutation({
    mutationFn: async (data: FormData) => {
      const response = isEditing 
        ? await fetch(`/api/pos-stats/${stats.id}`, {
            method: 'PUT',
            body: JSON.stringify(data),
            headers: { 'Content-Type': 'application/json' },
          })
        : await fetch('/api/pos-stats', {
            method: 'POST',
            body: JSON.stringify(data),
            headers: { 'Content-Type': 'application/json' },
          });
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "موفق",
        description: isEditing 
          ? "آمار ماهانه با موفقیت به‌روزرسانی شد"
          : "آمار ماهانه با موفقیت ایجاد شد",
      });
      onSuccess();
    },
    onError: () => {
      toast({
        title: "خطا",
        description: isEditing 
          ? "خطا در به‌روزرسانی آمار ماهانه"
          : "خطا در ایجاد آمار ماهانه",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: FormData) => {
    mutation.mutate(data);
  };

  const handleClose = () => {
    form.reset();
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto" dir="rtl">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? "ویرایش آمار ماهانه" : "افزودن آمار ماهانه"}
          </DialogTitle>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="customerId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>مشتری</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger data-testid="select-customer">
                          <SelectValue placeholder="انتخاب مشتری" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {customers.filter(c => c && c.id).map((customer) => (
                          <SelectItem key={customer.id} value={String(customer.id)}>
                            {customer.shopName} ({customer.ownerName})
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
                name="branchId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>شعبه</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger data-testid="select-branch">
                          <SelectValue placeholder="انتخاب شعبه" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {branches.filter(b => b && b.id).map((branch) => (
                          <SelectItem key={branch.id} value={String(branch.id)}>
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
                name="year"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>سال</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        placeholder="1403"
                        {...field}
                        data-testid="input-year"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="month"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>ماه</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value?.toString()}>
                      <FormControl>
                        <SelectTrigger data-testid="select-month">
                          <SelectValue placeholder="انتخاب ماه" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {persianMonths.map((month, index) => (
                          <SelectItem key={index + 1} value={(index + 1).toString()}>
                            {month}
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
                name="totalTransactions"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>تعداد تراکنش</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        placeholder="0"
                        {...field}
                        data-testid="input-total-transactions"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="totalAmount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>مبلغ کل (تومان)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        placeholder="0"
                        {...field}
                        data-testid="input-total-amount"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="revenue"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>درآمد (تومان)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        placeholder="0"
                        {...field}
                        data-testid="input-revenue"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="profit"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>سود (تومان)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        placeholder="0"
                        {...field}
                        data-testid="input-profit"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>وضعیت</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger data-testid="select-status">
                          <SelectValue placeholder="انتخاب وضعیت" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {Object.entries(statusLabels).map(([key, label]) => (
                          <SelectItem key={key} value={key}>
                            {label}
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
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>یادداشت‌ها (اختیاری)</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="یادداشت‌های اضافی..."
                      {...field}
                      value={field.value || ""}
                      data-testid="input-notes"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end gap-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={handleClose}
                data-testid="button-cancel"
              >
                لغو
              </Button>
              <Button
                type="submit"
                disabled={mutation.isPending}
                className="bg-blue-600 hover:bg-blue-700"
                data-testid="button-submit"
              >
                {mutation.isPending
                  ? "در حال پردازش..."
                  : isEditing
                  ? "به‌روزرسانی"
                  : "ایجاد"
                }
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}