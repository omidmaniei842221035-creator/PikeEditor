import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { BranchFormModal } from "./branch-form-modal";
import { BranchExcelImportModal } from "./branch-excel-import-modal";
import { BankingUnitFormModal } from "./banking-unit-form-modal";
import { BankingUnitExcelImportModal } from "./banking-unit-excel-import-modal";
import { LocationPickerModal } from "@/components/common/location-picker-modal";
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
import { Plus, Upload, Edit, Trash2, MapPin, Users, Building } from "lucide-react";

export function BranchManagement() {
  const [showAddModal, setShowAddModal] = useState(false);
  const [showExcelImportModal, setShowExcelImportModal] = useState(false);
  const [showBankingUnitModal, setShowBankingUnitModal] = useState(false);
  const [showBankingUnitExcelModal, setShowBankingUnitExcelModal] = useState(false);
  const [editingBranch, setEditingBranch] = useState<any>(null);
  const [editingBankingUnit, setEditingBankingUnit] = useState<any>(null);
  const [locationBankingUnit, setLocationBankingUnit] = useState<any>(null);
  const [showLocationPicker, setShowLocationPicker] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: branches = [] } = useQuery<any[]>({
    queryKey: ["/api/branches"],
  });

  const { data: bankingUnits = [] } = useQuery<any[]>({
    queryKey: ["/api/banking-units"],
  });

  const deleteBranchMutation = useMutation({
    mutationFn: async (id: string) => {
      return apiRequest("DELETE", `/api/branches/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/branches"] });
      toast({
        title: "موفقیت",
        description: "شعبه با موفقیت حذف شد",
      });
    },
    onError: () => {
      toast({
        title: "خطا",
        description: "خطا در حذف شعبه",
        variant: "destructive",
      });
    },
  });

  const deleteBankingUnitMutation = useMutation({
    mutationFn: async (id: string) => {
      return apiRequest("DELETE", `/api/banking-units/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/banking-units"] });
      toast({
        title: "موفقیت",
        description: "واحد بانکی با موفقیت حذف شد",
      });
    },
    onError: () => {
      toast({
        title: "خطا",
        description: "خطا در حذف واحد بانکی",
        variant: "destructive",
      });
    },
  });

  const updateLocationMutation = useMutation({
    mutationFn: async ({ unitId, latitude, longitude }: { unitId: string; latitude: string; longitude: string }) => {
      return apiRequest("PATCH", `/api/banking-units/${unitId}`, { latitude, longitude });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/banking-units"] });
      toast({
        title: "موقعیت ذخیره شد",
        description: "موقعیت جغرافیایی واحد بانکی با موفقیت ثبت شد",
      });
      setShowLocationPicker(false);
      setLocationBankingUnit(null);
    },
    onError: () => {
      toast({
        title: "خطا",
        description: "خطا در ذخیره موقعیت جغرافیایی",
        variant: "destructive",
      });
    },
  });

  const handleLocationSelect = (lat: number, lng: number) => {
    if (locationBankingUnit) {
      updateLocationMutation.mutate({
        unitId: locationBankingUnit.id,
        latitude: lat.toString(),
        longitude: lng.toString(),
      });
    }
  };

  const openLocationPicker = (unit: any) => {
    setLocationBankingUnit(unit);
    setShowLocationPicker(true);
  };

  const filteredBranches = branches.filter((branch: any) => {
    return (
      branch.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      branch.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      branch.address?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      branch.manager?.toLowerCase().includes(searchQuery.toLowerCase())
    );
  });

  const handleEditBranch = (branch: any) => {
    setEditingBranch(branch);
    setShowAddModal(true);
  };

  const handleCloseModal = () => {
    setShowAddModal(false);
    setEditingBranch(null);
  };

  const handleImportComplete = () => {
    queryClient.invalidateQueries({ queryKey: ["/api/branches"] });
    setShowExcelImportModal(false);
  };

  const handleBankingUnitImportComplete = () => {
    queryClient.invalidateQueries({ queryKey: ["/api/banking-units"] });
    setShowBankingUnitExcelModal(false);
  };

  const handleEditBankingUnit = (unit: any) => {
    setEditingBankingUnit(unit);
    setShowBankingUnitModal(true);
  };

  const handleCloseBankingUnitModal = () => {
    setShowBankingUnitModal(false);
    setEditingBankingUnit(null);
  };

  return (
    <div className="space-y-6" dir="rtl">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold">مدیریت واحدهای بانکی</h2>
          <p className="text-muted-foreground">مدیریت شعب و واحدهای بانکی</p>
        </div>
        <div className="flex gap-3">
          <Button 
            onClick={() => setShowBankingUnitExcelModal(true)}
            variant="outline"
            data-testid="button-excel-import-banking-unit"
          >
            <Upload className="w-4 h-4 mr-2" />
            وارد کردن Excel واحدهای بانکی
          </Button>
          <Button 
            onClick={() => setShowBankingUnitModal(true)}
            variant="outline"
            data-testid="button-add-banking-unit"
          >
            <Plus className="w-4 h-4 mr-2" />
            افزودن واحد بانکی
          </Button>
          <Button 
            onClick={() => setShowExcelImportModal(true)}
            variant="outline"
            data-testid="button-excel-import-branch"
          >
            <Upload className="w-4 h-4 mr-2" />
            بارگزاری Excel
          </Button>
          <Button 
            onClick={() => setShowAddModal(true)}
            data-testid="button-add-branch"
          >
            <Plus className="w-4 h-4 mr-2" />
            افزودن شعبه
          </Button>
        </div>
      </div>

      {/* Search */}
      <div className="w-full max-w-md">
        <Input
          placeholder="جستجوی شعبه..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full"
          data-testid="input-search-branch"
        />
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <Building className="w-8 h-8 text-blue-600" />
              <div>
                <p className="text-sm text-muted-foreground">کل شعب</p>
                <p className="text-2xl font-bold">{branches.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <Users className="w-8 h-8 text-green-600" />
              <div>
                <p className="text-sm text-muted-foreground">شعب فعال</p>
                <p className="text-2xl font-bold">
                  {branches.filter((b: any) => b.isActive).length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <MapPin className="w-8 h-8 text-purple-600" />
              <div>
                <p className="text-sm text-muted-foreground">شهرهای فعال</p>
                <p className="text-2xl font-bold">
                  {new Set(branches.map((b: any) => b.city)).size}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <Building className="w-8 h-8 text-orange-600" />
              <div>
                <p className="text-sm text-muted-foreground">شعب غیرفعال</p>
                <p className="text-2xl font-bold">
                  {branches.filter((b: any) => !b.isActive).length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Banking Units Section */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">واحدهای بانکی</h3>
        
        {/* Banking Units List */}
        <div className="grid gap-4">
          {bankingUnits.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <p className="text-muted-foreground">
                  هنوز واحد بانکی‌ای اضافه نشده است
                </p>
              </CardContent>
            </Card>
          ) : (
            bankingUnits.map((unit: any) => (
              <Card key={unit.id} className="hover:shadow-md transition-shadow">
                <CardHeader className="pb-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-lg">{unit.name}</CardTitle>
                      <div className="flex items-center gap-2 mt-2">
                        <Badge variant="secondary">{unit.code}</Badge>
                        <Badge variant={unit.unitType === 'branch' ? "default" : "outline"}>
                          {unit.unitType === 'branch' ? '🏦 شعبه' : 
                           unit.unitType === 'counter' ? '🏪 باجه' : '🏧 خودپرداز'}
                        </Badge>
                        <Badge variant={unit.isActive ? "default" : "secondary"}>
                          {unit.isActive ? "فعال" : "غیرفعال"}
                        </Badge>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openLocationPicker(unit)}
                        data-testid={`button-location-banking-unit-${unit.id}`}
                      >
                        <MapPin className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEditBankingUnit(unit)}
                        data-testid={`button-edit-banking-unit-${unit.id}`}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            variant="outline"
                            size="sm"
                            className="text-destructive hover:text-destructive"
                            data-testid={`button-delete-banking-unit-${unit.id}`}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent dir="rtl">
                          <AlertDialogHeader>
                            <AlertDialogTitle>تأیید حذف</AlertDialogTitle>
                            <AlertDialogDescription>
                              آیا از حذف واحد بانکی "{unit.name}" اطمینان دارید؟ این عمل قابل بازگشت نیست.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>انصراف</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => deleteBankingUnitMutation.mutate(unit.id)}
                              className="bg-destructive hover:bg-destructive/90"
                            >
                              حذف
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </div>
                </CardHeader>
                
                <CardContent className="pt-0">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-sm">
                    <div>
                      <span className="font-medium text-muted-foreground">مدیر:</span>
                      <p className="mt-1">{unit.managerName || "تعیین نشده"}</p>
                    </div>
                    <div>
                      <span className="font-medium text-muted-foreground">تلفن:</span>
                      <p className="mt-1">{unit.phone || "ثبت نشده"}</p>
                    </div>
                    <div>
                      <span className="font-medium text-muted-foreground">نوع واحد:</span>
                      <p className="mt-1">{
                        unit.unitType === 'branch' ? 'شعبه' : 
                        unit.unitType === 'counter' ? 'باجه' : 'خودپرداز'
                      }</p>
                    </div>
                    <div>
                      <span className="font-medium text-muted-foreground">موقعیت جغرافیایی:</span>
                      <p className="mt-1">
                        {unit.latitude && unit.longitude ? (
                          <Badge variant="outline" className="bg-green-50 text-green-700 dark:bg-green-900/30 dark:text-green-400">
                            <MapPin className="w-3 h-3 ml-1" />
                            ثبت شده
                          </Badge>
                        ) : (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => openLocationPicker(unit)}
                            data-testid={`set-location-unit-${unit.id}`}
                          >
                            <MapPin className="w-3 h-3 ml-1" />
                            ثبت موقعیت
                          </Button>
                        )}
                      </p>
                    </div>
                    <div className="md:col-span-2">
                      <span className="font-medium text-muted-foreground">آدرس:</span>
                      <p className="mt-1">{unit.address || "آدرس ثبت نشده"}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>

      {/* Branches List */}
      <div className="grid gap-6">
        {filteredBranches.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <p className="text-muted-foreground">
                {searchQuery ? "هیچ شعبه‌ای پیدا نشد" : "هنوز شعبه‌ای اضافه نشده است"}
              </p>
            </CardContent>
          </Card>
        ) : (
          filteredBranches.map((branch: any) => (
            <Card key={branch.id} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-lg">{branch.name}</CardTitle>
                    <div className="flex items-center gap-2 mt-2">
                      <Badge variant="secondary">{branch.code}</Badge>
                      <Badge variant={branch.isActive ? "default" : "secondary"}>
                        {branch.isActive ? "فعال" : "غیرفعال"}
                      </Badge>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEditBranch(branch)}
                      data-testid={`button-edit-branch-${branch.id}`}
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-destructive hover:text-destructive"
                          data-testid={`button-delete-branch-${branch.id}`}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent dir="rtl">
                        <AlertDialogHeader>
                          <AlertDialogTitle>تأیید حذف</AlertDialogTitle>
                          <AlertDialogDescription>
                            آیا از حذف شعبه "{branch.name}" اطمینان دارید؟ این عمل قابل بازگشت نیست.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>انصراف</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => deleteBranchMutation.mutate(branch.id)}
                            className="bg-destructive hover:bg-destructive/90"
                          >
                            حذف
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
              </CardHeader>
              
              <CardContent className="pt-0">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-sm">
                  <div>
                    <span className="font-medium text-muted-foreground">مدیر:</span>
                    <p className="mt-1">{branch.manager || "تعیین نشده"}</p>
                  </div>
                  <div>
                    <span className="font-medium text-muted-foreground">تلفن:</span>
                    <p className="mt-1">{branch.phone || "ثبت نشده"}</p>
                  </div>
                  <div>
                    <span className="font-medium text-muted-foreground">شهر:</span>
                    <p className="mt-1">{branch.city || "نامشخص"}</p>
                  </div>
                  <div className="md:col-span-2 lg:col-span-3">
                    <span className="font-medium text-muted-foreground">آدرس:</span>
                    <p className="mt-1">{branch.address || "آدرس ثبت نشده"}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Modals */}
      <BranchFormModal
        open={showAddModal}
        onOpenChange={handleCloseModal}
        editData={editingBranch}
      />

      <BranchExcelImportModal
        open={showExcelImportModal}
        onOpenChange={setShowExcelImportModal}
        onImportComplete={handleImportComplete}
      />

      <BankingUnitFormModal
        open={showBankingUnitModal}
        onOpenChange={handleCloseBankingUnitModal}
        editData={editingBankingUnit}
      />

      <BankingUnitExcelImportModal
        open={showBankingUnitExcelModal}
        onOpenChange={setShowBankingUnitExcelModal}
        onImportComplete={handleBankingUnitImportComplete}
      />

      <LocationPickerModal
        open={showLocationPicker}
        onOpenChange={setShowLocationPicker}
        initialLocation={locationBankingUnit?.latitude && locationBankingUnit?.longitude 
          ? { lat: parseFloat(locationBankingUnit.latitude), lng: parseFloat(locationBankingUnit.longitude) }
          : null}
        onLocationSelected={handleLocationSelect}
        title={`تعیین موقعیت: ${locationBankingUnit?.name || ''}`}
      />
    </div>
  );
}