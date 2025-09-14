import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { BranchFormModal } from "./branch-form-modal";
import { BranchExcelImportModal } from "./branch-excel-import-modal";
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
  const [editingBranch, setEditingBranch] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState("");

  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: branches = [] } = useQuery<any[]>({
    queryKey: ["/api/branches"],
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
    </div>
  );
}