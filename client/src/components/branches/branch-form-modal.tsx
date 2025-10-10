import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

const branchFormSchema = z.object({
  name: z.string().min(2, "نام شعبه باید حداقل ۲ کاراکتر باشد"),
  code: z.string().min(2, "کد شعبه باید حداقل ۲ کاراکتر باشد"),
  manager: z.string().optional(),
  phone: z.string().optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  isActive: z.boolean().default(true),
});

type BranchFormData = z.infer<typeof branchFormSchema>;

interface BranchFormModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editData?: any;
}

export function BranchFormModal({ open, onOpenChange, editData }: BranchFormModalProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const form = useForm<BranchFormData>({
    resolver: zodResolver(branchFormSchema),
    defaultValues: {
      name: "",
      code: "",
      manager: "",
      phone: "",
      address: "",
      city: "",
      isActive: true,
    },
  });

  useEffect(() => {
    if (editData) {
      form.reset({
        name: editData.name || "",
        code: editData.code || "",
        manager: editData.manager || "",
        phone: editData.phone || "",
        address: editData.address || "",
        city: editData.city || "",
        isActive: editData.isActive ?? true,
      });
    } else {
      form.reset({
        name: "",
        code: "",
        manager: "",
        phone: "",
        address: "",
        city: "",
        isActive: true,
      });
    }
  }, [editData, form]);

  const createBranchMutation = useMutation({
    mutationFn: async (data: BranchFormData) => {
      if (editData) {
        return apiRequest("PUT", `/api/branches/${editData.id}`, data);
      } else {
        return apiRequest("POST", "/api/branches", data);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/branches"] });
      toast({
        title: "موفقیت",
        description: editData ? "شعبه با موفقیت ویرایش شد" : "شعبه جدید با موفقیت اضافه شد",
      });
      onOpenChange(false);
      form.reset();
    },
    onError: () => {
      toast({
        title: "خطا",
        description: editData ? "خطا در ویرایش شعبه" : "خطا در افزودن شعبه",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: BranchFormData) => {
    createBranchMutation.mutate(data);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg" dir="rtl">
        <DialogHeader>
          <DialogTitle>
            {editData ? "ویرایش شعبه" : "افزودن شعبه جدید"}
          </DialogTitle>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>نام شعبه *</FormLabel>
                    <FormControl>
                      <Input {...field} data-testid="branch-name-input" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="code"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>کد شعبه *</FormLabel>
                    <FormControl>
                      <Input {...field} data-testid="branch-code-input" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="manager"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>نام مدیر</FormLabel>
                    <FormControl>
                      <Input {...field} data-testid="branch-manager-input" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>تلفن</FormLabel>
                    <FormControl>
                      <Input {...field} type="tel" data-testid="branch-phone-input" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="city"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>شهر</FormLabel>
                  <FormControl>
                    <Input {...field} data-testid="branch-city-input" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="address"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>آدرس</FormLabel>
                  <FormControl>
                    <Input {...field} data-testid="branch-address-input" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="isActive"
              render={({ field }) => (
                <FormItem className="flex items-center justify-between p-4 border rounded">
                  <div>
                    <FormLabel>وضعیت شعبه</FormLabel>
                    <p className="text-sm text-muted-foreground">
                      آیا این شعبه فعال است؟
                    </p>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                      data-testid="branch-active-switch"
                    />
                  </FormControl>
                </FormItem>
              )}
            />
            
            <div className="flex justify-end gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                data-testid="button-cancel-branch"
              >
                انصراف
              </Button>
              <Button 
                type="submit"
                disabled={createBranchMutation.isPending}
                data-testid="button-submit-branch"
              >
                {createBranchMutation.isPending ? "در حال ذخیره..." : 
                 editData ? "ویرایش" : "افزودن"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}