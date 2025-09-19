import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import { Separator } from "@/components/ui/separator";
import { MapPin, Phone, User, CreditCard, Users, TrendingUp, Building2 } from "lucide-react";

interface BankingUnitDetailsModalProps {
  open: boolean;
  onClose: () => void;
  bankingUnit: any;
}

export function BankingUnitDetailsModal({ open, onClose, bankingUnit }: BankingUnitDetailsModalProps) {
  const { data: customers = [] } = useQuery<any[]>({
    queryKey: ["/api/customers"],
    enabled: open && !!bankingUnit
  });

  const { data: posStats = [] } = useQuery<any[]>({
    queryKey: ["/api/pos-stats"],
    enabled: open && !!bankingUnit
  });

  if (!bankingUnit) return null;

  // Filter customers for this banking unit
  const unitCustomers = customers.filter(c => c.bankingUnitId === bankingUnit.id);
  
  // Filter POS stats for customers in this banking unit
  const customerIds = new Set(unitCustomers.map(c => c.id));
  const unitPosStats = posStats.filter(stat => customerIds.has(stat.customerId));

  // Calculate metrics
  const totalCustomers = unitCustomers.length;
  const activeCustomers = unitCustomers.filter(c => c.status === 'active').length;
  const totalRevenue = unitCustomers.reduce((sum, c) => sum + (c.monthlyProfit || 0), 0);
  const totalTransactions = unitPosStats.reduce((sum, stat) => sum + (stat.totalTransactions || 0), 0);

  // Unit type display
  const getUnitTypeDetails = (unitType: string) => {
    switch (unitType) {
      case 'branch':
        return { label: 'شعبه بانک', icon: '🏦', color: 'bg-blue-100 text-blue-800' };
      case 'counter':
        return { label: 'باجه بانک', icon: '🏪', color: 'bg-green-100 text-green-800' };
      case 'shahrbnet_kiosk':
        return { label: 'پیشخوان شهربانک', icon: '🏧', color: 'bg-orange-100 text-orange-800' };
      default:
        return { label: 'واحد بانکی', icon: '🏢', color: 'bg-gray-100 text-gray-800' };
    }
  };

  const unitTypeDetails = getUnitTypeDetails(bankingUnit.unitType);

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3 text-xl">
            <span className="text-2xl">{unitTypeDetails.icon}</span>
            <div>
              <span>{bankingUnit.name}</span>
              <Badge className={`mr-2 ${unitTypeDetails.color}`}>
                {unitTypeDetails.label}
              </Badge>
            </div>
          </DialogTitle>
          <DialogDescription>
            جزئیات و اطلاعات کامل واحد بانکی، شامل مشتریان و دستگاه‌های POS تحت پوشش
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Basic Information */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Building2 className="h-5 w-5" />
                اطلاعات پایه
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center gap-2">
                  <Badge variant="outline">کد واحد</Badge>
                  <span data-testid="unit-code">{bankingUnit.code}</span>
                </div>
                {bankingUnit.managerName && (
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-gray-500" />
                    <span className="font-medium">مسئول:</span>
                    <span data-testid="unit-manager">{bankingUnit.managerName}</span>
                  </div>
                )}
                {bankingUnit.phone && (
                  <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4 text-gray-500" />
                    <span className="font-medium">تلفن:</span>
                    <span data-testid="unit-phone" dir="ltr">{bankingUnit.phone}</span>
                  </div>
                )}
                {bankingUnit.address && (
                  <div className="flex items-start gap-2 col-span-1 md:col-span-2">
                    <MapPin className="h-4 w-4 text-gray-500 mt-1" />
                    <div>
                      <span className="font-medium">آدرس:</span>
                      <p data-testid="unit-address" className="text-sm text-gray-600 mt-1">
                        {bankingUnit.address}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Performance Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-4 text-center">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <Users className="h-5 w-5 text-blue-500" />
                  <span className="text-2xl font-bold text-blue-600" data-testid="total-customers">
                    {totalCustomers}
                  </span>
                </div>
                <p className="text-sm text-muted-foreground">کل مشتریان</p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4 text-center">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <span className="w-3 h-3 bg-green-500 rounded-full"></span>
                  <span className="text-2xl font-bold text-green-600" data-testid="active-customers">
                    {activeCustomers}
                  </span>
                </div>
                <p className="text-sm text-muted-foreground">مشتریان فعال</p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4 text-center">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <TrendingUp className="h-5 w-5 text-emerald-500" />
                  <span className="text-2xl font-bold text-emerald-600" data-testid="total-revenue">
                    {Math.round(totalRevenue / 1000000)}M
                  </span>
                </div>
                <p className="text-sm text-muted-foreground">درآمد (تومان)</p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4 text-center">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <CreditCard className="h-5 w-5 text-orange-500" />
                  <span className="text-2xl font-bold text-orange-600" data-testid="total-transactions">
                    {totalTransactions.toLocaleString()}
                  </span>
                </div>
                <p className="text-sm text-muted-foreground">کل تراکنش‌ها</p>
              </CardContent>
            </Card>
          </div>

          {/* POS Devices List */}
          {unitCustomers.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <CreditCard className="h-5 w-5" />
                  دستگاه‌های POS تحت پوشش ({unitCustomers.length} دستگاه)
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 max-h-64 overflow-y-auto">
                  {unitCustomers.map((customer, index) => {
                    const customerPosStats = unitPosStats.find(stat => stat.customerId === customer.id);
                    
                    return (
                      <div key={customer.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg" data-testid={`pos-device-${index}`}>
                        <div className="flex items-center gap-3">
                          <div className="text-lg">
                            {customer.businessType === 'دندانپزشکی' ? '🦷' :
                             customer.businessType === 'هواپیمایی' ? '✈️' :
                             customer.businessType === 'حمل‌ونقل' ? '🚛' :
                             customer.businessType === 'تولید شیرینی' ? '🧁' :
                             customer.businessType === 'فیزیوتراپی' ? '🏥' : '🏪'}
                          </div>
                          <div>
                            <p className="font-medium">{customer.shopName}</p>
                            <p className="text-sm text-muted-foreground">{customer.businessType}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          <Badge variant={customer.status === 'active' ? 'default' : 
                                        customer.status === 'marketing' ? 'secondary' :
                                        customer.status === 'loss' ? 'destructive' : 'outline'}>
                            {customer.status === 'active' ? '✅ فعال' :
                             customer.status === 'marketing' ? '📢 بازاریابی' :
                             customer.status === 'loss' ? '❌ زیان‌ده' :
                             customer.status === 'collected' ? '📦 جمع‌آوری شده' : customer.status}
                          </Badge>
                          {customerPosStats && (
                            <div className="text-right">
                              <p className="text-sm font-medium">
                                {customerPosStats.totalTransactions?.toLocaleString()} تراکنش
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {Math.round((customerPosStats.revenue || 0) / 1000000)}M درآمد
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Business Type Distribution */}
          {unitCustomers.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">توزیع اصناف</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
                  {Object.entries(
                    unitCustomers.reduce((acc, customer) => {
                      acc[customer.businessType] = (acc[customer.businessType] || 0) + 1;
                      return acc;
                    }, {} as Record<string, number>)
                  ).map(([businessType, count]) => (
                    <div key={businessType} className="flex items-center gap-2 p-2 bg-muted/30 rounded">
                      <span className="text-sm">
                        {businessType === 'دندانپزشکی' ? '🦷' :
                         businessType === 'هواپیمایی' ? '✈️' :
                         businessType === 'حمل‌ونقل' ? '🚛' :
                         businessType === 'تولید شیرینی' ? '🧁' :
                         businessType === 'فیزیوتراپی' ? '🏥' : '🏪'}
                      </span>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs truncate">{businessType}</p>
                        <p className="text-xs font-medium">{count as number} دستگاه</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {unitCustomers.length === 0 && (
            <Card>
              <CardContent className="p-8 text-center">
                <p className="text-muted-foreground">هیچ دستگاه POS فعالی در این واحد بانکی یافت نشد</p>
              </CardContent>
            </Card>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}