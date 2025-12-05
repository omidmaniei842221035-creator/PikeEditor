import { useEffect, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertBankingUnitSchema } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { LocationPickerModal } from "@/components/common/location-picker-modal";
import { MapPin } from "lucide-react";
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
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { z } from "zod";

type BankingUnitFormData = z.infer<typeof insertBankingUnitSchema>;

interface BankingUnitFormModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editData?: any;
}

export function BankingUnitFormModal({ open, onOpenChange, editData }: BankingUnitFormModalProps) {
  const [selectedLocation, setSelectedLocation] = useState<{lat: number, lng: number} | null>(null);
  const [showMapPicker, setShowMapPicker] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const isEditing = !!editData;

  const form = useForm<BankingUnitFormData>({
    resolver: zodResolver(insertBankingUnitSchema),
    defaultValues: {
      code: "",
      name: "",
      unitType: "branch",
      managerName: "",
      phone: "",
      address: "",
      latitude: "",
      longitude: "",
      isActive: true,
    },
  });

  useEffect(() => {
    if (editData && open) {
      form.reset({
        code: editData.code || "",
        name: editData.name || "",
        unitType: editData.unitType || "branch",
        managerName: editData.managerName || "",
        phone: editData.phone || "",
        address: editData.address || "",
        latitude: editData.latitude || "",
        longitude: editData.longitude || "",
        isActive: Boolean(editData.isActive ?? true),
      });
      
      // Set location for map if coordinates exist
      if (editData.latitude && editData.longitude) {
        setSelectedLocation({
          lat: parseFloat(editData.latitude),
          lng: parseFloat(editData.longitude)
        });
      }
    } else if (!editData) {
      form.reset({
        code: "",
        name: "",
        unitType: "branch",
        managerName: "",
        phone: "",
        address: "",
        latitude: "",
        longitude: "",
        isActive: true,
      });
      setSelectedLocation(null);
    }
  }, [editData, open, form]);

  const createBankingUnitMutation = useMutation({
    mutationFn: async (data: BankingUnitFormData) => {
      const unitData = {
        ...data,
        latitude: selectedLocation?.lat?.toString() || data.latitude,
        longitude: selectedLocation?.lng?.toString() || data.longitude,
      };
      
      if (isEditing) {
        return apiRequest("PUT", `/api/banking-units/${editData.id}`, unitData);
      } else {
        return apiRequest("POST", "/api/banking-units", unitData);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/banking-units"] });
      toast({
        title: "موفقیت",
        description: isEditing ? "واحد مصرفی با موفقیت ویرایش شد" : "واحد مصرفی جدید با موفقیت اضافه شد",
      });
      onOpenChange(false);
      form.reset();
      setSelectedLocation(null);
    },
    onError: (error) => {
      toast({
        title: "خطا",
        description: "خطا در ذخیره اطلاعات واحد مصرفی",
        variant: "destructive",
      });
      console.error("Error saving banking unit:", error);
    },
  });

  const onSubmit = (data: BankingUnitFormData) => {
    // Clean up coordinate data - prevent empty strings from being sent
    const cleanData = {
      ...data,
      latitude: selectedLocation?.lat?.toString() || (data.latitude && data.latitude.trim() !== "" ? data.latitude : undefined),
      longitude: selectedLocation?.lng?.toString() || (data.longitude && data.longitude.trim() !== "" ? data.longitude : undefined),
    };
    createBankingUnitMutation.mutate(cleanData);
  };

  const handleMapLocationSelected = (lat: number, lng: number) => {
    setSelectedLocation({ lat, lng });
    form.setValue("latitude", lat.toString());
    form.setValue("longitude", lng.toString());
  };

  const getUnitTypeLabel = (type: string) => {
    switch (type) {
      case "branch":
        return "🏦 شعبه";
      case "counter":
        return "🏪 باجه";
      case "shahrbnet_kiosk":
        return "🏧 پیشخوان شهرنت";
      default:
        return type;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto" data-testid="banking-unit-form-modal">
        <DialogHeader>
          <DialogTitle className="text-right">
            {isEditing ? "ویرایش واحد مصرفی" : "افزودن واحد مصرفی جدید"}
          </DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="code"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>کد واحد *</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="مثال: BR001"
                        {...field}
                        data-testid="input-banking-unit-code"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="unitType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>نوع واحد *</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger data-testid="select-unit-type">
                          <SelectValue placeholder="انتخاب نوع واحد" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="branch">🏦 شعبه</SelectItem>
                        <SelectItem value="counter">🏪 باجه</SelectItem>
                        <SelectItem value="shahrbnet_kiosk">🏧 پیشخوان شهرنت</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>نام واحد *</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="مثال: شعبه مرکزی تبریز"
                      {...field}
                      data-testid="input-banking-unit-name"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="managerName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>نام مسئول</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="نام مسئول واحد"
                      {...field}
                      value={field.value ?? ""}
                      data-testid="input-manager-name"
                    />
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
                    <Input
                      placeholder="09123456789"
                      {...field}
                      value={field.value ?? ""}
                      data-testid="input-phone"
                    />
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
                    <Textarea
                      placeholder="آدرس کامل واحد"
                      {...field}
                      value={field.value ?? ""}
                      data-testid="textarea-address"
                      rows={2}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setShowMapPicker(true)}
                  data-testid="button-select-location-banking-unit"
                >
                  <MapPin className="w-4 h-4 ml-1" />
                  انتخاب روی نقشه
                </Button>
                {selectedLocation && (
                  <span className="text-sm text-green-600">
                    موقعیت انتخاب شده
                  </span>
                )}
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="latitude"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>عرض جغرافیایی</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="38.0962"
                          {...field}
                          data-testid="input-latitude"
                          value={selectedLocation?.lat?.toString() || field.value || ""}
                          onChange={(e) => {
                            field.onChange(e.target.value);
                            const lat = parseFloat(e.target.value);
                            if (!isNaN(lat)) {
                              setSelectedLocation(prev => ({ lat, lng: prev?.lng || 0 }));
                            }
                          }}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="longitude"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>طول جغرافیایی</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="46.2738"
                          {...field}
                          data-testid="input-longitude"
                          value={selectedLocation?.lng?.toString() || field.value || ""}
                          onChange={(e) => {
                            field.onChange(e.target.value);
                            const lng = parseFloat(e.target.value);
                            if (!isNaN(lng)) {
                              setSelectedLocation(prev => ({ lat: prev?.lat || 0, lng }));
                            }
                          }}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            <FormField
              control={form.control}
              name="isActive"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                  <div className="space-y-0.5">
                    <FormLabel>وضعیت فعال</FormLabel>
                    <div className="text-sm text-muted-foreground">
                      واحد در سیستم فعال باشد
                    </div>
                  </div>
                  <FormControl>
                    <Switch
                      checked={Boolean(field.value ?? true)}
                      onCheckedChange={field.onChange}
                      data-testid="switch-is-active"
                    />
                  </FormControl>
                </FormItem>
              )}
            />

            <div className="flex gap-2 pt-4">
              <Button
                type="submit"
                className="flex-1"
                disabled={createBankingUnitMutation.isPending}
                data-testid="button-save-banking-unit"
              >
                {createBankingUnitMutation.isPending ? (
                  <>⏳ در حال ذخیره...</>
                ) : (
                  <>💾 {isEditing ? "ویرایش" : "ذخیره"}</>
                )}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                data-testid="button-cancel"
              >
                ❌ انصراف
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
      
      <LocationPickerModal
        open={showMapPicker}
        onOpenChange={setShowMapPicker}
        onLocationSelected={handleMapLocationSelected}
        initialLocation={selectedLocation}
        title="انتخاب موقعیت واحد بانکی روی نقشه"
      />
    </Dialog>
  );
}