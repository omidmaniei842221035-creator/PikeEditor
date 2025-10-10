import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { MapPin, Phone, Building, Calendar, User, DollarSign, Navigation } from "lucide-react";
import { VisitDialog } from "./visit-dialog";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { Customer, Branch, Employee, Visit } from "@shared/schema";

interface CustomerInfoModalProps {
  customer: Customer | null;
  open: boolean;
  onClose: () => void;
}

const statusColors = {
  active: "bg-green-500 text-white",
  normal: "bg-blue-500 text-white", 
  marketing: "bg-yellow-500 text-black",
  loss: "bg-red-500 text-white",
  collected: "bg-gray-500 text-white",
};

const statusLabels = {
  active: "🟢 فعال",
  normal: "🔵 عادی",
  marketing: "🟡 بازاریابی", 
  loss: "🔴 زیان‌ده",
  collected: "⚫ جمع‌آوری شده",
};

export function CustomerInfoModal({ customer, open, onClose }: CustomerInfoModalProps) {
  const [showVisitDialog, setShowVisitDialog] = useState(false);

  const { data: visits = [] } = useQuery<Visit[]>({
    queryKey: [`/api/visits/customer/${customer?.id}`],
    enabled: !!customer?.id && open,
  });

  const { data: branches = [] } = useQuery<Branch[]>({
    queryKey: ["/api/branches"],
  });

  const { data: employees = [] } = useQuery<Employee[]>({
    queryKey: ["/api/employees"],
  });

  if (!customer) return null;

  const branch = branches.find(b => b.id === customer.branchId);
  const supportEmployee = employees.find(e => e.id === customer.supportEmployeeId);

  return (
    <>
      <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto" dir="rtl">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold flex items-center gap-2">
              <Building className="h-5 w-5" />
              {customer.shopName}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-6">
            {/* Customer Basic Info */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">اطلاعات پایه</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-gray-500" />
                    <span className="font-medium">مالک:</span>
                    <span>{customer.ownerName}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4 text-gray-500" />
                    <span className="font-medium">تلفن:</span>
                    <span>{customer.phone}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Building className="h-4 w-4 text-gray-500" />
                    <span className="font-medium">نوع کسب‌وکار:</span>
                    <span>{customer.businessType}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-gray-500" />
                    <span className="font-medium">تاریخ نصب:</span>
                    <span>{customer.installDate ? new Date(customer.installDate).toLocaleDateString('fa-IR') : 'نامشخص'}</span>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-gray-500" />
                  <span className="font-medium">آدرس:</span>
                  <span className="text-sm">{customer.address}</span>
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">وضعیت:</span>
                    <Badge className={statusColors[customer.status as keyof typeof statusColors]}>
                      {statusLabels[customer.status as keyof typeof statusLabels]}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-2">
                    <DollarSign className="h-4 w-4 text-gray-500" />
                    <span className="font-medium">سود ماهانه:</span>
                    <span className="font-bold text-green-600">
                      {customer.monthlyProfit?.toLocaleString('fa-IR')} تومان
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Branch and Support Info */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">اطلاعات پشتیبانی</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center gap-2">
                  <Building className="h-4 w-4 text-gray-500" />
                  <span className="font-medium">شعبه:</span>
                  <span>{branch?.name || 'نامشخص'}</span>
                </div>
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4 text-gray-500" />
                  <span className="font-medium">کارمند پشتیبان:</span>
                  <span>{supportEmployee?.name || 'نامشخص'}</span>
                </div>
              </CardContent>
            </Card>

            {/* Recent Visits */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-lg">ویزیت‌های اخیر</CardTitle>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => setShowVisitDialog(true)}
                  data-testid="add-visit-button"
                >
                  <Calendar className="h-4 w-4 mr-2" />
                  ثبت ویزیت جدید
                </Button>
              </CardHeader>
              <CardContent>
                {visits.length > 0 ? (
                  <div className="space-y-3">
                    {visits.slice(0, 3).map(visit => (
                      <div key={visit.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div>
                          <div className="font-medium">{new Date(visit.visitDate).toLocaleDateString('fa-IR')}</div>
                          <div className="text-sm text-gray-600">{visit.notes}</div>
                        </div>
                        <Badge variant="outline">{visit.visitType}</Badge>
                      </div>
                    ))}
                    {visits.length > 3 && (
                      <div className="text-center text-sm text-gray-500">
                        و {visits.length - 3} ویزیت دیگر...
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-center text-gray-500 py-4">
                    هیچ ویزیتی ثبت نشده است
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Action Buttons */}
            <div className="flex gap-3">
              <Button 
                className="flex-1"
                onClick={() => setShowVisitDialog(true)}
                data-testid="quick-visit-button"
              >
                <Calendar className="h-4 w-4 mr-2" />
                ثبت ویزیت
              </Button>
              <Button variant="outline" className="flex-1">
                <Navigation className="h-4 w-4 mr-2" />
                مسیریابی
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <VisitDialog
        open={showVisitDialog}
        onOpenChange={setShowVisitDialog}
        customerId={customer.id}
        customerName={customer.shopName}
      />
    </>
  );
}