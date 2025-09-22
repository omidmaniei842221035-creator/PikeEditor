import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { AlertDialog, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from '@/components/ui/tooltip';
import { useToast } from '@/hooks/use-toast';
import { 
  MapPin, 
  Plus, 
  Edit, 
  Trash2, 
  Building2, 
  Target, 
  Palette, 
  Save,
  X,
  Lightbulb,
  Users,
  DollarSign,
  BarChart3,
  Layers,
  Compass,
  Pencil,
  Square,
  PenTool,
  Circle
} from 'lucide-react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet-draw/dist/leaflet.draw.css';
import 'leaflet-draw';
import { apiRequest } from '@/lib/queryClient';

// Extend Leaflet Draw types
declare module 'leaflet' {
  namespace Control {
    class Draw extends L.Control {
      constructor(options?: any);
    }
  }
  namespace Draw {
    class Event {
      static CREATED: string;
      static DRAWSTART: string;
      static DRAWSTOP: string;
    }
  }
}

// Add global Draw to L
(window as any).L = L;

// Types
interface Territory {
  id: string;
  name: string;
  color: string;
  assignedBankingUnitId?: string | null;
  businessFocus?: string | null;
  autoNamed: boolean;
  geometry: GeoJSON.Polygon | GeoJSON.MultiPolygon;
  bbox: [number, number, number, number];
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

interface TerritoryStats {
  territoryId: string;
  territoryName: string;
  totalCustomers: number;
  totalRevenue: number;
  totalTransactions: number;
  businessTypes: Record<string, number>;
  topBusinessType: string | null;
}

interface SuggestNameResponse {
  suggestedName: string;
  autoNamed: boolean;
  businessFocus: string | null;
  stats: {
    totalCustomers: number;
    businessTypes: Record<string, number>;
    topBusinessType: string;
    topBusinessTypeCount: number;
    topBusinessTypePercentage: number;
  };
}

export function TerritoryManagement() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const mapRef = useRef<L.Map | null>(null);
  const drawControlRef = useRef<L.Control.Draw | null>(null);
  const territoryLayersRef = useRef<L.LayerGroup | null>(null);
  const [selectedTerritoryId, setSelectedTerritoryId] = useState<string | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showEditForm, setShowEditForm] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showStatsDialog, setShowStatsDialog] = useState(false);
  const [currentGeometry, setCurrentGeometry] = useState<GeoJSON.Polygon | null>(null);
  const [currentBbox, setCurrentBbox] = useState<[number, number, number, number] | null>(null);

  // Form states
  const [territoryForm, setTerritoryForm] = useState({
    name: '',
    color: '#3b82f6',
    assignedBankingUnitId: '',
    businessFocus: '',
    autoNamed: false
  });

  // Data queries
  const { data: territories = [], isLoading } = useQuery<Territory[]>({
    queryKey: ['/api/territories']
  });

  const { data: bankingUnits = [] } = useQuery<any[]>({
    queryKey: ['/api/banking-units']
  });

  const { data: customers = [] } = useQuery<any[]>({
    queryKey: ['/api/customers']
  });

  const { data: territoryStats } = useQuery<TerritoryStats | null>({
    queryKey: ['/api/territories', selectedTerritoryId, 'stats'],
    enabled: !!selectedTerritoryId && showStatsDialog
  });

  // Mutations
  const createTerritoryMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await fetch('/api/territories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      if (!response.ok) throw new Error('Failed to create territory');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/territories'] });
      toast({ title: 'منطقه جدید با موفقیت ایجاد شد' });
      setShowCreateForm(false);
      resetForm();
    },
    onError: () => {
      toast({ title: 'خطا در ایجاد منطقه', variant: 'destructive' });
    }
  });

  const updateTerritoryMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      const response = await fetch(`/api/territories/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      if (!response.ok) throw new Error('Failed to update territory');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/territories'] });
      toast({ title: 'منطقه با موفقیت به‌روزرسانی شد' });
      setShowEditForm(false);
      setSelectedTerritoryId(null);
      resetForm();
    },
    onError: () => {
      toast({ title: 'خطا در به‌روزرسانی منطقه', variant: 'destructive' });
    }
  });

  const deleteTerritoryMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`/api/territories/${id}`, {
        method: 'DELETE'
      });
      if (!response.ok) throw new Error('Failed to delete territory');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/territories'] });
      toast({ title: 'منطقه با موفقیت حذف شد' });
      setShowDeleteDialog(false);
      setSelectedTerritoryId(null);
    },
    onError: () => {
      toast({ title: 'خطا در حذف منطقه', variant: 'destructive' });
    }
  });

  const assignTerritoryMutation = useMutation({
    mutationFn: async ({ id, bankingUnitId }: { id: string; bankingUnitId: string | null }) => {
      const response = await fetch(`/api/territories/${id}/assign`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bankingUnitId })
      });
      if (!response.ok) throw new Error('Failed to assign territory');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/territories'] });
      toast({ title: 'تخصیص منطقه با موفقیت انجام شد' });
    },
    onError: () => {
      toast({ title: 'خطا در تخصیص منطقه', variant: 'destructive' });
    }
  });

  const suggestNameMutation = useMutation({
    mutationFn: async (data: { geometry: GeoJSON.Polygon; bbox: [number, number, number, number] }): Promise<SuggestNameResponse> => {
      const response = await fetch('/api/territories/suggest-name', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      if (!response.ok) throw new Error('Failed to suggest name');
      return response.json();
    },
    onSuccess: (data: SuggestNameResponse) => {
      setTerritoryForm(prev => ({
        ...prev,
        name: data.suggestedName,
        businessFocus: data.businessFocus || '',
        autoNamed: data.autoNamed
      }));
    }
  });

  // Helper functions
  const resetForm = useCallback(() => {
    setTerritoryForm({
      name: '',
      color: '#3b82f6',
      assignedBankingUnitId: '',
      businessFocus: '',
      autoNamed: false
    });
    setCurrentGeometry(null);
    setCurrentBbox(null);
  }, []);

  const getBBoxFromGeometry = useCallback((geometry: GeoJSON.Polygon): [number, number, number, number] => {
    const coordinates = geometry.coordinates[0];
    const lngs = coordinates.map(coord => coord[0]);
    const lats = coordinates.map(coord => coord[1]);
    return [
      Math.min(...lngs), // minLng
      Math.min(...lats), // minLat  
      Math.max(...lngs), // maxLng
      Math.max(...lats)  // maxLat
    ];
  }, []);

  const handleSuggestName = useCallback(() => {
    if (currentGeometry && currentBbox) {
      suggestNameMutation.mutate({
        geometry: currentGeometry,
        bbox: currentBbox
      });
    }
  }, [currentGeometry, currentBbox, suggestNameMutation]);

  // Map initialization
  useEffect(() => {
    if (!mapRef.current) {
      // Initialize map
      const map = L.map('territory-map', {
        center: [38.0962, 46.2738], // Tabriz coordinates
        zoom: 12,
        zoomControl: true
      });

      // Add tile layer
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors',
        maxZoom: 19
      }).addTo(map);

      // Initialize territory layers group
      const territoryLayers = L.layerGroup().addTo(map);
      territoryLayersRef.current = territoryLayers;

      // Add drawing controls
      const drawnItems = new L.FeatureGroup();
      map.addLayer(drawnItems);

      const drawControl = new L.Control.Draw({
        position: 'topright',
        draw: {
          polygon: {
            allowIntersection: false,
            drawError: {
              color: '#e74c3c',
              message: 'شکل‌ها نباید با یکدیگر تداخل داشته باشند!'
            },
            shapeOptions: {
              color: '#3b82f6',
              weight: 3,
              fillOpacity: 0.1
            }
          },
          rectangle: {
            shapeOptions: {
              color: '#3b82f6', 
              weight: 3,
              fillOpacity: 0.1
            }
          },
          circle: false,
          marker: false,
          circlemarker: false,
          polyline: false
        },
        edit: {
          featureGroup: drawnItems,
          remove: true
        }
      });
      map.addControl(drawControl);
      drawControlRef.current = drawControl;

      // Handle drawing events
      map.on(L.Draw.Event.CREATED, (e: any) => {
        const layer = e.layer;
        const geoJSON = layer.toGeoJSON() as GeoJSON.Feature<GeoJSON.Polygon>;
        const geometry = geoJSON.geometry;
        const bbox = getBBoxFromGeometry(geometry);

        setCurrentGeometry(geometry);
        setCurrentBbox(bbox);
        setIsDrawing(false);
        setShowCreateForm(true);
      });

      map.on(L.Draw.Event.DRAWSTART, () => {
        setIsDrawing(true);
      });

      map.on(L.Draw.Event.DRAWSTOP, () => {
        setIsDrawing(false);
      });

      mapRef.current = map;
    }

    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, [getBBoxFromGeometry]);

  // Load territories on map
  useEffect(() => {
    if (!mapRef.current || !territoryLayersRef.current) return;

    // Clear existing territory layers
    territoryLayersRef.current.clearLayers();

    territories.forEach(territory => {
      const layer = L.geoJSON(territory.geometry, {
        style: {
          color: territory.color,
          weight: 3,
          fillOpacity: 0.2,
          opacity: 0.8
        }
      });

      // Add popup with territory info
      const assignedUnit = bankingUnits.find(unit => unit.id === territory.assignedBankingUnitId);
      const popupContent = `
        <div style="direction: rtl; text-align: right; font-family: 'Vazirmatn', sans-serif;">
          <h3 style="margin: 0 0 8px 0; color: ${territory.color};">${territory.name}</h3>
          <p style="margin: 4px 0;"><strong>واحد تخصیص‌یافته:</strong> ${assignedUnit?.name || 'تخصیص نداده شده'}</p>
          ${territory.businessFocus ? `<p style="margin: 4px 0;"><strong>تمرکز کسب‌وکار:</strong> ${territory.businessFocus}</p>` : ''}
          <div style="margin-top: 8px;">
            <button onclick="window.selectTerritory('${territory.id}')" 
                    style="background: ${territory.color}; color: white; border: none; padding: 4px 8px; border-radius: 4px; cursor: pointer;">
              مدیریت منطقه
            </button>
          </div>
        </div>
      `;
      
      layer.bindPopup(popupContent);
      
      layer.on('click', () => {
        setSelectedTerritoryId(territory.id);
      });

      territoryLayersRef.current?.addLayer(layer);
    });

    // Global function for popup buttons
    (window as any).selectTerritory = (id: string) => {
      setSelectedTerritoryId(id);
    };
  }, [territories, bankingUnits]);

  // Load territory data for editing
  useEffect(() => {
    if (selectedTerritoryId && showEditForm) {
      const territory = territories.find(t => t.id === selectedTerritoryId);
      if (territory) {
        setTerritoryForm({
          name: territory.name,
          color: territory.color,
          assignedBankingUnitId: territory.assignedBankingUnitId || '',
          businessFocus: territory.businessFocus || '',
          autoNamed: territory.autoNamed
        });
      }
    }
  }, [selectedTerritoryId, showEditForm, territories]);

  const handleSubmitCreate = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    if (!currentGeometry || !currentBbox) {
      toast({ title: 'لطفاً ابتدا یک منطقه روی نقشه ترسیم کنید', variant: 'destructive' });
      return;
    }

    createTerritoryMutation.mutate({
      name: territoryForm.name,
      color: territoryForm.color,
      assignedBankingUnitId: territoryForm.assignedBankingUnitId || null,
      businessFocus: territoryForm.businessFocus || null,
      autoNamed: territoryForm.autoNamed,
      geometry: currentGeometry,
      bbox: currentBbox
    });
  }, [territoryForm, currentGeometry, currentBbox, createTerritoryMutation, toast]);

  const handleSubmitEdit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTerritoryId) return;

    updateTerritoryMutation.mutate({
      id: selectedTerritoryId,
      data: {
        name: territoryForm.name,
        color: territoryForm.color,
        assignedBankingUnitId: territoryForm.assignedBankingUnitId || null,
        businessFocus: territoryForm.businessFocus || null
      }
    });
  }, [selectedTerritoryId, territoryForm, updateTerritoryMutation]);

  const handleDelete = useCallback(() => {
    if (!selectedTerritoryId) return;
    deleteTerritoryMutation.mutate(selectedTerritoryId);
  }, [selectedTerritoryId, deleteTerritoryMutation]);

  const handleAssign = useCallback((bankingUnitId: string | null) => {
    if (!selectedTerritoryId) return;
    assignTerritoryMutation.mutate({
      id: selectedTerritoryId,
      bankingUnitId
    });
  }, [selectedTerritoryId, assignTerritoryMutation]);

  const selectedTerritory = useMemo(() => 
    territories.find(t => t.id === selectedTerritoryId), 
    [territories, selectedTerritoryId]
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p>در حال بارگیری مناطق...</p>
        </div>
      </div>
    );
  }

  return (
    <TooltipProvider>
      <div className="h-screen flex flex-col" data-testid="territory-management">
      {/* Header */}
      <div className="bg-white border-b p-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <MapPin className="w-6 h-6 text-blue-600" />
              مدیریت مناطق جغرافیایی
            </h1>
            <p className="text-gray-600 mt-1">
              ترسیم، مدیریت و تخصیص مناطق به واحدهای بانکی
            </p>
          </div>
          <div className="flex gap-2">
            <Badge variant="outline" className="text-sm">
              <Layers className="w-4 h-4 mr-1" />
              {territories.length} منطقه
            </Badge>
            <Badge variant="outline" className="text-sm">
              <Users className="w-4 h-4 mr-1" />
              {customers.length} مشتری
            </Badge>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar */}
        <div className="w-80 bg-white border-r overflow-y-auto">
          <div className="p-4 border-b">
            <h2 className="font-semibold text-gray-900 mb-3">لیست مناطق</h2>
            <div className="space-y-2">
              {territories.map(territory => {
                const assignedUnit = bankingUnits.find(unit => unit.id === territory.assignedBankingUnitId);
                const isSelected = selectedTerritoryId === territory.id;
                
                return (
                  <div
                    key={territory.id}
                    className={`p-3 border rounded-lg cursor-pointer transition-all ${
                      isSelected ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300'
                    }`}
                    onClick={() => setSelectedTerritoryId(territory.id)}
                    data-testid={`territory-item-${territory.id}`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <div 
                            className="w-3 h-3 rounded-full border-2"
                            style={{ backgroundColor: territory.color, borderColor: territory.color }}
                          />
                          <h3 className="font-medium text-gray-900">{territory.name}</h3>
                          {territory.autoNamed && (
                            <Tooltip>
                              <TooltipTrigger>
                                <Lightbulb className="w-3 h-3 text-yellow-500" />
                              </TooltipTrigger>
                              <TooltipContent>نام خودکار تولید شده</TooltipContent>
                            </Tooltip>
                          )}
                        </div>
                        {assignedUnit && (
                          <p className="text-xs text-gray-600 mb-1">
                            <Building2 className="w-3 h-3 inline mr-1" />
                            {assignedUnit.name}
                          </p>
                        )}
                        {territory.businessFocus && (
                          <p className="text-xs text-gray-600">
                            <Target className="w-3 h-3 inline mr-1" />
                            {territory.businessFocus}
                          </p>
                        )}
                      </div>
                      {isSelected && (
                        <div className="flex gap-1">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={(e) => {
                              e.stopPropagation();
                              setShowEditForm(true);
                            }}
                            data-testid={`edit-territory-${territory.id}`}
                          >
                            <Edit className="w-3 h-3" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={(e) => {
                              e.stopPropagation();
                              setShowStatsDialog(true);
                            }}
                            data-testid={`stats-territory-${territory.id}`}
                          >
                            <BarChart3 className="w-3 h-3" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={(e) => {
                              e.stopPropagation();
                              setShowDeleteDialog(true);
                            }}
                            data-testid={`delete-territory-${territory.id}`}
                          >
                            <Trash2 className="w-3 h-3 text-red-500" />
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Territory Actions */}
          {selectedTerritory && (
            <div className="p-4 border-b">
              <h3 className="font-medium text-gray-900 mb-3">عملیات منطقه</h3>
              <div className="space-y-2">
                <Label className="text-sm">تخصیص به واحد بانکی</Label>
                <Select
                  value={selectedTerritory.assignedBankingUnitId || ''}
                  onValueChange={(value) => handleAssign(value || null)}
                  data-testid="assign-banking-unit-select"
                >
                  <SelectTrigger>
                    <SelectValue placeholder="انتخاب واحد بانکی" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">بدون تخصیص</SelectItem>
                    {bankingUnits.map(unit => (
                      <SelectItem key={unit.id} value={unit.id}>
                        {unit.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}

          {/* Drawing Tools */}
          <div className="p-4">
            <h3 className="font-medium text-gray-900 mb-3">ابزارهای ترسیم</h3>
            <div className="space-y-2">
              <p className="text-sm text-gray-600 mb-3">
                برای ایجاد منطقه جدید، از ابزارهای ترسیم روی نقشه استفاده کنید
              </p>
              <div className="grid grid-cols-2 gap-2">
                <div className="p-2 border rounded text-center">
                  <PenTool className="w-6 h-6 mx-auto mb-1 text-gray-600" />
                  <p className="text-xs text-gray-600">چندضلعی</p>
                </div>
                <div className="p-2 border rounded text-center">
                  <Square className="w-6 h-6 mx-auto mb-1 text-gray-600" />
                  <p className="text-xs text-gray-600">مربع</p>
                </div>
              </div>
              {isDrawing && (
                <div className="p-3 bg-blue-50 border border-blue-200 rounded text-center">
                  <Pencil className="w-6 h-6 mx-auto mb-2 text-blue-600 animate-pulse" />
                  <p className="text-sm text-blue-700">در حال ترسیم...</p>
                  <p className="text-xs text-blue-600">برای تکمیل دابل کلیک کنید</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Map */}
        <div className="flex-1 relative">
          <div id="territory-map" className="w-full h-full"></div>
        </div>
      </div>

      {/* Create Territory Dialog */}
      <Dialog open={showCreateForm} onOpenChange={setShowCreateForm}>
        <DialogContent className="max-w-md" data-testid="create-territory-dialog">
          <DialogHeader>
            <DialogTitle>ایجاد منطقه جدید</DialogTitle>
            <DialogDescription>
              اطلاعات منطقه جدید را وارد کنید
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmitCreate}>
            <div className="space-y-4">
              <div className="flex gap-2">
                <div className="flex-1">
                  <Label>نام منطقه</Label>
                  <Input
                    value={territoryForm.name}
                    onChange={(e) => setTerritoryForm(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="نام منطقه را وارد کنید"
                    required
                    data-testid="territory-name-input"
                  />
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleSuggestName}
                  disabled={suggestNameMutation.isPending || !currentGeometry}
                  className="mt-6"
                  data-testid="suggest-name-button"
                >
                  <Lightbulb className="w-4 h-4" />
                </Button>
              </div>

              <div>
                <Label>رنگ نمایش</Label>
                <div className="flex gap-2 items-center">
                  <input
                    type="color"
                    value={territoryForm.color}
                    onChange={(e) => setTerritoryForm(prev => ({ ...prev, color: e.target.value }))}
                    className="w-12 h-10 border rounded cursor-pointer"
                    data-testid="territory-color-input"
                  />
                  <div className="flex-1 px-3 py-2 border rounded bg-gray-50 text-sm">
                    {territoryForm.color}
                  </div>
                </div>
              </div>

              <div>
                <Label>واحد بانکی</Label>
                <Select
                  value={territoryForm.assignedBankingUnitId}
                  onValueChange={(value) => setTerritoryForm(prev => ({ ...prev, assignedBankingUnitId: value }))}
                  data-testid="create-banking-unit-select"
                >
                  <SelectTrigger>
                    <SelectValue placeholder="انتخاب واحد بانکی (اختیاری)" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">بدون تخصیص</SelectItem>
                    {bankingUnits.map(unit => (
                      <SelectItem key={unit.id} value={unit.id}>
                        {unit.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>تمرکز کسب‌وکار</Label>
                <Input
                  value={territoryForm.businessFocus}
                  onChange={(e) => setTerritoryForm(prev => ({ ...prev, businessFocus: e.target.value }))}
                  placeholder="نوع کسب‌وکار غالب (اختیاری)"
                  data-testid="territory-business-focus-input"
                />
              </div>
            </div>
            <DialogFooter className="mt-6">
              <Button type="button" variant="outline" onClick={() => setShowCreateForm(false)}>
                انصراف
              </Button>
              <Button type="submit" disabled={createTerritoryMutation.isPending} data-testid="create-territory-submit">
                <Save className="w-4 h-4 mr-2" />
                {createTerritoryMutation.isPending ? 'در حال ایجاد...' : 'ایجاد منطقه'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit Territory Dialog */}
      <Dialog open={showEditForm} onOpenChange={setShowEditForm}>
        <DialogContent className="max-w-md" data-testid="edit-territory-dialog">
          <DialogHeader>
            <DialogTitle>ویرایش منطقه</DialogTitle>
            <DialogDescription>
              اطلاعات منطقه را ویرایش کنید
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmitEdit}>
            <div className="space-y-4">
              <div>
                <Label>نام منطقه</Label>
                <Input
                  value={territoryForm.name}
                  onChange={(e) => setTerritoryForm(prev => ({ ...prev, name: e.target.value }))}
                  required
                  data-testid="edit-territory-name-input"
                />
              </div>

              <div>
                <Label>رنگ نمایش</Label>
                <div className="flex gap-2 items-center">
                  <input
                    type="color"
                    value={territoryForm.color}
                    onChange={(e) => setTerritoryForm(prev => ({ ...prev, color: e.target.value }))}
                    className="w-12 h-10 border rounded cursor-pointer"
                    data-testid="edit-territory-color-input"
                  />
                  <div className="flex-1 px-3 py-2 border rounded bg-gray-50 text-sm">
                    {territoryForm.color}
                  </div>
                </div>
              </div>

              <div>
                <Label>واحد بانکی</Label>
                <Select
                  value={territoryForm.assignedBankingUnitId}
                  onValueChange={(value) => setTerritoryForm(prev => ({ ...prev, assignedBankingUnitId: value }))}
                  data-testid="edit-banking-unit-select"
                >
                  <SelectTrigger>
                    <SelectValue placeholder="انتخاب واحد بانکی (اختیاری)" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">بدون تخصیص</SelectItem>
                    {bankingUnits.map(unit => (
                      <SelectItem key={unit.id} value={unit.id}>
                        {unit.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>تمرکز کسب‌وکار</Label>
                <Input
                  value={territoryForm.businessFocus}
                  onChange={(e) => setTerritoryForm(prev => ({ ...prev, businessFocus: e.target.value }))}
                  placeholder="نوع کسب‌وکار غالب (اختیاری)"
                  data-testid="edit-territory-business-focus-input"
                />
              </div>
            </div>
            <DialogFooter className="mt-6">
              <Button type="button" variant="outline" onClick={() => setShowEditForm(false)}>
                انصراف
              </Button>
              <Button type="submit" disabled={updateTerritoryMutation.isPending} data-testid="update-territory-submit">
                <Save className="w-4 h-4 mr-2" />
                {updateTerritoryMutation.isPending ? 'در حال به‌روزرسانی...' : 'به‌روزرسانی'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent data-testid="delete-territory-dialog">
          <AlertDialogHeader>
            <AlertDialogTitle>تأیید حذف منطقه</AlertDialogTitle>
            <AlertDialogDescription>
              آیا از حذف منطقه "{selectedTerritory?.name}" اطمینان دارید؟
              این عمل قابل بازگشت نیست.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>
              انصراف
            </Button>
            <Button 
              variant="destructive" 
              onClick={handleDelete}
              disabled={deleteTerritoryMutation.isPending}
              data-testid="confirm-delete-territory"
            >
              {deleteTerritoryMutation.isPending ? 'در حال حذف...' : 'حذف منطقه'}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Territory Stats Dialog */}
      <Dialog open={showStatsDialog} onOpenChange={setShowStatsDialog}>
        <DialogContent className="max-w-lg" data-testid="territory-stats-dialog">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5" />
              آمار منطقه: {selectedTerritory?.name}
            </DialogTitle>
          </DialogHeader>
          {territoryStats ? (
            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-4">
                <div className="text-center p-3 bg-blue-50 rounded-lg">
                  <div className="text-2xl font-bold text-blue-600">{territoryStats.totalCustomers}</div>
                  <div className="text-sm text-gray-600">مشتریان</div>
                </div>
                <div className="text-center p-3 bg-green-50 rounded-lg">
                  <div className="text-2xl font-bold text-green-600">
                    {(territoryStats.totalRevenue / 1000000).toFixed(1)}M
                  </div>
                  <div className="text-sm text-gray-600">درآمد</div>
                </div>
                <div className="text-center p-3 bg-purple-50 rounded-lg">
                  <div className="text-2xl font-bold text-purple-600">
                    {territoryStats.totalTransactions.toLocaleString('fa-IR')}
                  </div>
                  <div className="text-sm text-gray-600">تراکنش</div>
                </div>
              </div>
              
              <div>
                <h4 className="font-medium mb-2">توزیع انواع کسب‌وکار</h4>
                <div className="space-y-2">
                  {Object.entries(territoryStats.businessTypes)
                    .sort(([,a], [,b]) => b - a)
                    .slice(0, 5)
                    .map(([type, count]) => (
                    <div key={type} className="flex justify-between items-center">
                      <span className="text-sm">{type}</span>
                      <Badge variant="outline">{count}</Badge>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
              <p className="text-sm text-gray-600">در حال محاسبه آمار...</p>
            </div>
          )}
        </DialogContent>
      </Dialog>
      </div>
    </TooltipProvider>
  );
}

export default TerritoryManagement;