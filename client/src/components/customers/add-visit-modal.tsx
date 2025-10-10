import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useMutation, useQuery } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { queryClient, apiRequest } from '@/lib/queryClient';
import { insertVisitSchema } from '@shared/schema';
import { z } from 'zod';
import type { Customer } from '@shared/schema';

interface AddVisitModalProps {
  customer: Customer | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

const addVisitFormSchema = insertVisitSchema.extend({
  visitDate: z.string().min(1, "تاریخ ویزیت الزامی است"),
});

type AddVisitFormData = z.infer<typeof addVisitFormSchema>;

export function AddVisitModal({ customer, isOpen, onClose, onSuccess }: AddVisitModalProps) {
  const { toast } = useToast();
  
  const { data: employees = [] } = useQuery({
    queryKey: ['/api/employees'],
  });

  const form = useForm<AddVisitFormData>({
    resolver: zodResolver(addVisitFormSchema),
    defaultValues: {
      customerId: customer?.id || '',
      employeeId: '',
      visitDate: new Date().toISOString().slice(0, 16),
      notes: '',
      visitType: 'routine' as const,
      duration: 60,
      result: '',
    },
  });

  const addVisitMutation = useMutation({
    mutationFn: async (data: AddVisitFormData) => {
      const visitData = {
        ...data,
        customerId: customer?.id || '',
        visitDate: new Date(data.visitDate),
      };
      return apiRequest('/api/visits', 'POST', visitData);
    },
    onSuccess: () => {
      toast({
        title: 'موفقیت',
        description: 'ویزیت با موفقیت ثبت شد',
      });
      queryClient.invalidateQueries({ queryKey: ['/api/visits'] });
      if (onSuccess) onSuccess();
      form.reset();
    },
    onError: (error: any) => {
      toast({
        title: 'خطا',
        description: error.message || 'خطا در ثبت ویزیت',
        variant: 'destructive',
      });
    },
  });

  const onSubmit = (data: AddVisitFormData) => {
    addVisitMutation.mutate(data);
  };

  if (!customer) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto" dir="rtl">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">
            ثبت ویزیت جدید - {customer.shopName}
          </DialogTitle>
        </DialogHeader>

        <div className="bg-gray-50 p-4 rounded-lg mb-4">
          <h4 className="font-semibold mb-2">اطلاعات مشتری:</h4>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="font-medium">نام فروشگاه:</span> {customer.shopName}
            </div>
            <div>
              <span className="font-medium">مالک:</span> {customer.ownerName}
            </div>
            <div>
              <span className="font-medium">تلفن:</span> {customer.phone}
            </div>
            <div>
              <span className="font-medium">نوع کسب‌وکار:</span> {customer.businessType}
            </div>
          </div>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="employeeId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>کارمند ویزیت کننده *</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value || undefined}>
                      <FormControl>
                        <SelectTrigger data-testid="select-employee">
                          <SelectValue placeholder="انتخاب کارمند" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {(employees as any[]).map((employee: any) => (
                          <SelectItem key={employee.id} value={employee.id}>
                            {employee.name} - {employee.position}
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
                name="visitType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>نوع ویزیت</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger data-testid="select-visit-type">
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="routine">معمولی</SelectItem>
                        <SelectItem value="support">پشتیبانی</SelectItem>
                        <SelectItem value="installation">نصب</SelectItem>
                        <SelectItem value="maintenance">تعمیر و نگهداری</SelectItem>
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
                name="visitDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>تاریخ و ساعت ویزیت *</FormLabel>
                    <FormControl>
                      <Input
                        type="datetime-local"
                        {...field}
                        data-testid="input-visit-date"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="duration"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>مدت زمان (دقیقه)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min="1"
                        value={field.value || ''}
                        onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                        data-testid="input-duration"
                      />
                    </FormControl>
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
                  <FormLabel>توضیحات ویزیت</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="جزئیات ویزیت، مسائل مطرح شده، راه‌حل‌های ارائه شده و..."
                      className="min-h-[100px]"
                      value={field.value || ''}
                      onChange={field.onChange}
                      data-testid="textarea-notes"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="result"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>نتیجه ویزیت</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="نتیجه نهایی ویزیت، اقدامات انجام شده، پیگیری‌های لازم و..."
                      className="min-h-[80px]"
                      value={field.value || ''}
                      onChange={field.onChange}
                      data-testid="textarea-result"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex gap-3 pt-4">
              <Button
                type="submit"
                disabled={addVisitMutation.isPending}
                className="flex-1"
                data-testid="button-submit-visit"
              >
                {addVisitMutation.isPending ? 'در حال ثبت...' : '✅ ثبت ویزیت'}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                className="flex-1"
                data-testid="button-cancel-visit"
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