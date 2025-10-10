import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Building, MapPin, Users, Filter } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

interface BankingUnit {
  id: string;
  code: string;
  name: string;
  unitType: "branch" | "counter" | "shahrbnet_kiosk";
  managerName?: string;
  phone?: string;
  address?: string;
  isActive: boolean;
}

interface Customer {
  id: string;
  shopName: string;
  ownerName: string;
  businessType: string;
  status: string;
  bankingUnitId?: string;
}

interface BankingUnitFilterProps {
  selectedUnitId: string | null;
  onUnitChange: (unitId: string | null) => void;
  className?: string;
}

export function BankingUnitFilter({ selectedUnitId, onUnitChange, className }: BankingUnitFilterProps) {
  const { data: bankingUnits } = useQuery<BankingUnit[]>({
    queryKey: ["/api/banking-units"],
  });

  const { data: customers } = useQuery<Customer[]>({
    queryKey: ["/api/customers"],
  });

  const handleUnitChange = (value: string) => {
    if (value === "all") {
      onUnitChange(null);
    } else {
      onUnitChange(value);
    }
  };

  // حساب تعداد مشتریان هر واحد بانکی
  const getCustomerCount = (unitId: string) => {
    return customers?.filter(customer => customer.bankingUnitId === unitId).length || 0;
  };

  // حساب تعداد مشتریان فعال هر واحد بانکی
  const getActiveCustomerCount = (unitId: string) => {
    return customers?.filter(customer => 
      customer.bankingUnitId === unitId && customer.status === 'active'
    ).length || 0;
  };

  const selectedUnit = bankingUnits?.find(unit => unit.id === selectedUnitId);

  const getUnitTypeLabel = (type: string) => {
    const labels = {
      branch: "شعبه",
      counter: "باجه", 
      shahrbnet_kiosk: "پیشخوان شهربانک"
    };
    return labels[type as keyof typeof labels] || type;
  };

  return (
    <Card className={`${className}`}>
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Filter className="h-5 w-5 text-primary" />
          فیلتر بر اساس واحد بانکی
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Select 
          value={selectedUnitId || "all"} 
          onValueChange={handleUnitChange}
          data-testid="banking-unit-filter"
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder="انتخاب واحد بانکی..." />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all" data-testid="option-all">
              <div className="flex items-center gap-2">
                <Building className="h-4 w-4" />
                همه واحدهای بانکی
              </div>
            </SelectItem>
            {bankingUnits?.map((unit) => (
              <SelectItem 
                key={unit.id} 
                value={unit.id}
                data-testid={`option-${unit.id}`}
              >
                <div className="flex items-center justify-between w-full">
                  <div className="flex items-center gap-2">
                    <Building className="h-4 w-4" />
                    <span className="font-medium">{unit.name}</span>
                    <Badge variant="outline" className="text-xs">
                      {getUnitTypeLabel(unit.unitType)}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Users className="h-3 w-3" />
                    {getCustomerCount(unit.id)}
                  </div>
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {selectedUnit && (
          <Card className="bg-muted/50 border border-primary/20">
            <CardContent className="p-4">
              <div className="space-y-3">
                <div className="flex items-start justify-between">
                  <div>
                    <h4 className="font-semibold text-primary">{selectedUnit.name}</h4>
                    <p className="text-sm text-muted-foreground">{selectedUnit.code}</p>
                  </div>
                  <Badge variant="secondary">
                    {getUnitTypeLabel(selectedUnit.unitType)}
                  </Badge>
                </div>
                
                {selectedUnit.managerName && (
                  <div className="flex items-center gap-2 text-sm">
                    <span className="font-medium">مدیر:</span>
                    <span>{selectedUnit.managerName}</span>
                  </div>
                )}
                
                {selectedUnit.address && (
                  <div className="flex items-start gap-2 text-sm">
                    <MapPin className="h-4 w-4 mt-0.5 text-muted-foreground" />
                    <span className="text-muted-foreground">{selectedUnit.address}</span>
                  </div>
                )}
                
                <div className="grid grid-cols-2 gap-4 mt-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-primary" data-testid="total-customers">
                      {getCustomerCount(selectedUnit.id)}
                    </div>
                    <div className="text-xs text-muted-foreground">کل مشتریان</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600" data-testid="active-customers">
                      {getActiveCustomerCount(selectedUnit.id)}
                    </div>
                    <div className="text-xs text-muted-foreground">فعال</div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        <div className="flex gap-2">
          <Button
            variant="outline" 
            size="sm"
            onClick={() => onUnitChange(null)}
            className="flex-1"
            data-testid="clear-filter"
          >
            پاک کردن فیلتر
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}