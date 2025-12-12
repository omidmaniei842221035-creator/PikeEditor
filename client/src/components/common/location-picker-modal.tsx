import { useEffect, useRef, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { MapPin, Target } from "lucide-react";
import { getBusinessIcon, getCustomerMarkerColor } from "@/lib/map-utils";

interface LocationPickerModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onLocationSelected: (lat: number, lng: number) => void;
  initialLocation?: { lat: number; lng: number } | null;
  title?: string;
  businessType?: string;
  customerStatus?: string;
}

export function LocationPickerModal({
  open,
  onOpenChange,
  onLocationSelected,
  initialLocation,
  title = "انتخاب موقعیت روی نقشه",
  businessType,
  customerStatus,
}: LocationPickerModalProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);
  const markerRef = useRef<any>(null);
  const [selectedLocation, setSelectedLocation] = useState<{ lat: number; lng: number } | null>(
    initialLocation || null
  );
  const [mapReady, setMapReady] = useState(false);

  const createMarkerIcon = (L: any) => {
    const icon = businessType ? getBusinessIcon(businessType) : null;
    const color = customerStatus ? getCustomerMarkerColor(customerStatus) : '#3b82f6';
    
    if (icon && businessType) {
      return L.divIcon({
        className: "custom-business-marker",
        html: `<div style="
          background: ${color};
          width: 40px;
          height: 40px;
          border-radius: 50% 50% 50% 0;
          transform: rotate(-45deg);
          display: flex;
          align-items: center;
          justify-content: center;
          border: 3px solid white;
          box-shadow: 0 2px 8px rgba(0,0,0,0.3);
        ">
          <span style="
            transform: rotate(45deg);
            font-size: 18px;
          ">${icon}</span>
        </div>`,
        iconSize: [40, 40],
        iconAnchor: [20, 40],
      });
    } else {
      return L.divIcon({
        className: "custom-location-marker",
        html: `<div style="background-color: ${color}; color: white; width: 40px; height: 40px; border-radius: 50%; display: flex; align-items: center; justify-content: center; border: 3px solid white; box-shadow: 0 2px 8px rgba(0,0,0,0.3); font-size: 20px;">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>
        </div>`,
        iconSize: [40, 40],
        iconAnchor: [20, 40],
      });
    }
  };

  useEffect(() => {
    if (!open) {
      setMapReady(false);
      return;
    }

    const initMap = async () => {
      if (!mapContainerRef.current) return;

      const waitForLeaflet = () => {
        return new Promise<any>((resolve) => {
          const check = () => {
            if ((window as any).L) {
              resolve((window as any).L);
            } else {
              setTimeout(check, 100);
            }
          };
          check();
        });
      };

      try {
        const L = await waitForLeaflet();

        if (mapContainerRef.current && (mapContainerRef.current as any)._leaflet_id) {
          delete (mapContainerRef.current as any)._leaflet_id;
        }

        mapContainerRef.current!.innerHTML = "";

        const defaultCenter = initialLocation 
          ? [initialLocation.lat, initialLocation.lng] 
          : [38.0800, 46.2919];

        const map = L.map(mapContainerRef.current, {
          center: defaultCenter,
          zoom: 14,
          zoomControl: true,
          scrollWheelZoom: true,
        });

        L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
          attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
          maxZoom: 19,
        }).addTo(map);

        mapRef.current = map;

        if (initialLocation) {
          const marker = L.marker([initialLocation.lat, initialLocation.lng], {
            draggable: true,
            icon: createMarkerIcon(L),
          }).addTo(map);

          marker.on("dragend", (e: any) => {
            const latlng = e.target.getLatLng();
            setSelectedLocation({ lat: latlng.lat, lng: latlng.lng });
          });

          markerRef.current = marker;
          setSelectedLocation(initialLocation);
        }

        map.on("click", (e: any) => {
          const { lat, lng } = e.latlng;
          
          if (markerRef.current) {
            markerRef.current.setLatLng([lat, lng]);
          } else {
            const marker = L.marker([lat, lng], {
              draggable: true,
              icon: createMarkerIcon(L),
            }).addTo(map);

            marker.on("dragend", (e: any) => {
              const latlng = e.target.getLatLng();
              setSelectedLocation({ lat: latlng.lat, lng: latlng.lng });
            });

            markerRef.current = marker;
          }
          
          setSelectedLocation({ lat, lng });
        });

        setTimeout(() => {
          map.invalidateSize();
          setMapReady(true);
        }, 200);

      } catch (error) {
        console.error("Error initializing map:", error);
      }
    };

    const timeoutId = setTimeout(initMap, 100);

    return () => {
      clearTimeout(timeoutId);
      if (mapRef.current) {
        try {
          mapRef.current.remove();
        } catch (e) {
          console.warn("Error removing map:", e);
        }
        mapRef.current = null;
        markerRef.current = null;
      }
    };
  }, [open, initialLocation, businessType, customerStatus]);

  const handleCenterOnTabriz = () => {
    if (mapRef.current) {
      mapRef.current.setView([38.0800, 46.2919], 14);
    }
  };

  const handleConfirm = () => {
    if (selectedLocation) {
      onLocationSelected(selectedLocation.lat, selectedLocation.lng);
      onOpenChange(false);
    }
  };

  const handleCancel = () => {
    setSelectedLocation(initialLocation || null);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh]" dir="rtl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {businessType ? (
              <span className="text-xl">{getBusinessIcon(businessType)}</span>
            ) : (
              <MapPin className="w-5 h-5 text-primary" />
            )}
            {title}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="flex items-center gap-2 flex-wrap">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleCenterOnTabriz}
              data-testid="button-center-tabriz"
            >
              <Target className="w-4 h-4 ml-1" />
              تبریز
            </Button>
            {businessType && (
              <div className="bg-muted px-3 py-1 rounded-full text-sm flex items-center gap-1">
                <span>{getBusinessIcon(businessType)}</span>
                <span>{businessType}</span>
              </div>
            )}
            <div className="text-sm text-muted-foreground">
              برای انتخاب موقعیت روی نقشه کلیک کنید یا نشانگر را بکشید
            </div>
          </div>

          <div
            ref={mapContainerRef}
            className="w-full h-[400px] rounded-lg border bg-muted"
            style={{ minHeight: "400px" }}
            data-testid="location-picker-map"
          />

          {selectedLocation && (
            <div className="bg-green-50 dark:bg-green-950 p-3 rounded-lg border border-green-200 dark:border-green-800">
              <div className="flex items-center gap-2 text-green-700 dark:text-green-300">
                <MapPin className="w-4 h-4" />
                <span className="font-medium">موقعیت انتخاب شده:</span>
              </div>
              <div className="grid grid-cols-2 gap-4 mt-2 text-sm">
                <div>
                  <span className="text-muted-foreground">عرض جغرافیایی:</span>{" "}
                  <span className="font-mono" dir="ltr">{selectedLocation.lat.toFixed(6)}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">طول جغرافیایی:</span>{" "}
                  <span className="font-mono" dir="ltr">{selectedLocation.lng.toFixed(6)}</span>
                </div>
              </div>
            </div>
          )}
        </div>

        <DialogFooter className="gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={handleCancel}
            data-testid="button-cancel-location"
          >
            انصراف
          </Button>
          <Button
            type="button"
            onClick={handleConfirm}
            disabled={!selectedLocation}
            data-testid="button-confirm-location"
          >
            <MapPin className="w-4 h-4 ml-1" />
            تایید موقعیت
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
