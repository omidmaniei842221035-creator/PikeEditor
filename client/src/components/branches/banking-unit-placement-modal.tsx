import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { insertBranchSchema, type InsertBranch } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface BankingUnitPlacementModalProps {
  isOpen: boolean;
  onClose: () => void;
  location: { lat: number; lng: number } | null;
}

const branchFormSchema = insertBranchSchema.extend({
  coverageRadius: insertBranchSchema.shape.coverageRadius.default(5),
  monthlyTarget: insertBranchSchema.shape.monthlyTarget.default(0),
  performance: insertBranchSchema.shape.performance.default(0),
});

export function BankingUnitPlacementModal({ 
  isOpen, 
  onClose, 
  location 
}: BankingUnitPlacementModalProps) {
  const { toast } = useToast();
  
  const form = useForm<InsertBranch>({
    resolver: zodResolver(branchFormSchema),
    defaultValues: {
      name: "",
      code: "",
      type: "شعبه",
      manager: "",
      phone: "",
      address: "",
      latitude: location?.lat.toString() || "",
      longitude: location?.lng.toString() || "",
      coverageRadius: 5,
      monthlyTarget: 0,
      performance: 0,
    },
  });

  const createBranchMutation = useMutation({
    mutationFn: (data: InsertBranch) => apiRequest("POST", "/api/branches", data),
    onSuccess: () => {
      toast({
        title: "✅ موفق",
        description: "واحد بانکی جدید با موفقیت ایجاد شد",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/branches"] });
      form.reset();
      onClose();
    },
    onError: (error: any) => {
      toast({
        title: "❌ خطا",
        description: error.message || "خطا در ایجاد واحد بانکی",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: InsertBranch) => {
    // Update coordinates from location if available
    if (location) {
      data.latitude = location.lat.toString();
      data.longitude = location.lng.toString();
    }
    createBranchMutation.mutate(data);
  };

  const handleClose = () => {
    form.reset();
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto" dir="rtl">
        <DialogHeader>
          <DialogTitle className="text-lg font-semibold">
            🏦 ایجاد واحد بانکی جدید
          </DialogTitle>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Branch Name */}
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>نام واحد *</FormLabel>
                    <FormControl>
                      <Input 
                        {...field} 
                        placeholder="مثال: شعبه مرکزی تبریز"
                        data-testid="input-branch-name"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Branch Code */}
              <FormField
                control={form.control}
                name="code"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>کد واحد *</FormLabel>
                    <FormControl>
                      <Input 
                        {...field} 
                        placeholder="مثال: TBR-005"
                        data-testid="input-branch-code"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Branch Type */}
              <FormField
                control={form.control}
                name="type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>نوع واحد *</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger data-testid="select-branch-type">
                          <SelectValue placeholder="انتخاب نوع واحد" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="شعبه">🏦 شعبه</SelectItem>
                        <SelectItem value="باجه">🏪 باجه</SelectItem>
                        <SelectItem value="گیشه">🎫 گیشه</SelectItem>
                        <SelectItem value="پیشخوان">🛒 پیشخوان</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Manager */}
              <FormField
                control={form.control}
                name="manager"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>مدیر واحد</FormLabel>
                    <FormControl>
                      <Input 
                        {...field} 
                        value={field.value || ""}
                        placeholder="نام و نام خانوادگی مدیر"
                        data-testid="input-branch-manager"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Phone */}
              <FormField
                control={form.control}
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>تلفن تماس</FormLabel>
                    <FormControl>
                      <Input 
                        {...field} 
                        value={field.value || ""}
                        placeholder="041-12345678"
                        dir="ltr"
                        data-testid="input-branch-phone"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Coverage Radius */}
              <FormField
                control={form.control}
                name="coverageRadius"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>شعاع پوشش (کیلومتر)</FormLabel>
                    <FormControl>
                      <Input 
                        {...field} 
                        value={field.value ?? 0}
                        type="number"
                        placeholder="5"
                        onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                        data-testid="input-coverage-radius"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Monthly Target */}
              <FormField
                control={form.control}
                name="monthlyTarget"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>هدف ماهانه (میلیون تومان)</FormLabel>
                    <FormControl>
                      <Input 
                        {...field} 
                        value={field.value ?? 0}
                        type="number"
                        placeholder="1000"
                        onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                        data-testid="input-monthly-target"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Performance */}
              <FormField
                control={form.control}
                name="performance"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>عملکرد (درصد)</FormLabel>
                    <FormControl>
                      <Input 
                        {...field} 
                        value={field.value ?? 0}
                        type="number"
                        placeholder="85"
                        min="0"
                        max="100"
                        onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                        data-testid="input-performance"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Address */}
            <FormField
              control={form.control}
              name="address"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>آدرس</FormLabel>
                  <FormControl>
                    <Textarea 
                      {...field} 
                      value={field.value || ""}
                      placeholder="آدرس کامل واحد بانکی..."
                      className="resize-none"
                      rows={3}
                      data-testid="textarea-address"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Location Info */}
            {location && (
              <div className="bg-muted p-3 rounded-lg">
                <h4 className="font-medium text-sm mb-2">📍 موقعیت مکانی:</h4>
                <div className="grid grid-cols-2 gap-2 text-sm text-muted-foreground">
                  <div>
                    <span className="font-medium">عرض جغرافیایی:</span>{" "}
                    <span dir="ltr">{location.lat.toFixed(6)}</span>
                  </div>
                  <div>
                    <span className="font-medium">طول جغرافیایی:</span>{" "}
                    <span dir="ltr">{location.lng.toFixed(6)}</span>
                  </div>
                </div>
              </div>
            )}

            <DialogFooter>
              <Button 
                type="button" 
                variant="outline" 
                onClick={handleClose}
                data-testid="button-cancel"
              >
                انصراف
              </Button>
              <Button 
                type="submit" 
                disabled={createBranchMutation.isPending}
                data-testid="button-create-branch"
              >
                {createBranchMutation.isPending ? "در حال ایجاد..." : "ایجاد واحد"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}