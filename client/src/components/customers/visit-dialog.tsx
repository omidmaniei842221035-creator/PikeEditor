import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon, Clock } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { insertVisitSchema } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { z } from "zod";

const visitFormSchema = insertVisitSchema.extend({
  visitDate: z.date(),
  visitTime: z.string().min(1, "زمان ویزیت الزامی است"),
});

type VisitFormData = z.infer<typeof visitFormSchema>;

interface VisitDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  customerId: string;
  customerName: string;
}

export function VisitDialog({ open, onOpenChange, customerId, customerName }: VisitDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const form = useForm<VisitFormData>({
    resolver: zodResolver(visitFormSchema),
    defaultValues: {
      customerId,
      visitDate: new Date(),
      visitTime: "09:00",
      visitType: "routine",
      notes: "",
      duration: 30,
    },
  });

  const createVisitMutation = useMutation({
    mutationFn: async (data: VisitFormData) => {
      const visitDateTime = new Date(data.visitDate);
      const [hours, minutes] = data.visitTime.split(':').map(Number);
      visitDateTime.setHours(hours, minutes, 0, 0);

      const visitData = {
        customerId: data.customerId,
        employeeId: "emp-1", // TODO: Get from current user session
        visitDate: visitDateTime,
        notes: data.notes,
        visitType: data.visitType,
        duration: data.duration,
      };

      const response = await fetch("/api/visits", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(visitData),
      });
      
      if (!response.ok) {
        throw new Error("Failed to create visit");
      }
      
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "موفقیت",
        description: "ویزیت با موفقیت ثبت شد",
      });
      queryClient.invalidateQueries({ queryKey: [`/api/visits/customer/${customerId}`] });
      onOpenChange(false);
      form.reset();
    },
    onError: (error) => {
      toast({
        title: "خطا",
        description: "خطا در ثبت ویزیت",
        variant: "destructive",
      });
    },
  });

  const onSubmit = async (data: VisitFormData) => {
    setIsSubmitting(true);
    try {
      await createVisitMutation.mutateAsync(data);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md" dir="rtl">
        <DialogHeader>
          <DialogTitle>ثبت ویزیت جدید</DialogTitle>
          <p className="text-sm text-muted-foreground">
            ثبت ویزیت برای {customerName}
          </p>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="visitDate"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>تاریخ ویزیت</FormLabel>
                  <Popover>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant="outline"
                          className={cn(
                            "w-full pl-3 text-left font-normal",
                            !field.value && "text-muted-foreground"
                          )}
                        >
                          {field.value ? (
                            format(field.value, "yyyy/MM/dd")
                          ) : (
                            <span>انتخاب تاریخ</span>
                          )}
                          <CalendarIcon className="mr-auto h-4 w-4 opacity-50" />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={field.value}
                        onSelect={field.onChange}
                        disabled={(date) =>
                          date < new Date(new Date().setDate(new Date().getDate() - 30))
                        }
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="visitTime"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>ساعت ویزیت</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Clock className="absolute right-3 top-3 h-4 w-4 opacity-50" />
                      <Input
                        type="time"
                        {...field}
                        className="pr-10"
                        data-testid="visit-time-input"
                      />
                    </div>
                  </FormControl>
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
                      <SelectTrigger data-testid="visit-type-select">
                        <SelectValue placeholder="انتخاب نوع ویزیت" />
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

            <FormField
              control={form.control}
              name="duration"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>مدت زمان (دقیقه)</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      min="5"
                      max="480"
                      {...field}
                      onChange={(e) => field.onChange(parseInt(e.target.value) || 30)}
                      value={field.value || 30}
                      data-testid="visit-duration-input"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>توضیحات</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="توضیحات ویزیت..."
                      className="min-h-[80px]"
                      {...field}
                      value={field.value || ""}
                      data-testid="visit-notes-textarea"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end space-x-2 space-x-reverse pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                انصراف
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting}
                data-testid="submit-visit-button"
              >
                {isSubmitting ? "در حال ثبت..." : "ثبت ویزیت"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}