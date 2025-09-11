export interface MapInstance {
  map: any;
  markers: any[];
}

export function initializeMap(container: HTMLElement): MapInstance {
  // Check if Leaflet is available
  if (typeof window !== 'undefined' && (window as any).L) {
    const L = (window as any).L;
    
    // Initialize map centered on Tabriz, Iran
    const map = L.map(container, {
      center: [38.0800, 46.2919], // Tabriz coordinates
      zoom: 12,
      zoomControl: true,
      scrollWheelZoom: true,
    });

    // Add OpenStreetMap tiles
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors',
      maxZoom: 19,
    }).addTo(map);

    return {
      map,
      markers: [],
    };
  } else {
    // Fallback when Leaflet is not available
    console.warn('Leaflet library not loaded');
    return {
      map: null,
      markers: [],
    };
  }
}

export function addCustomerMarker(
  mapInstance: MapInstance,
  customer: any,
  lat: number,
  lng: number
): void {
  if (!mapInstance.map || typeof window === 'undefined' || !(window as any).L) {
    return;
  }

  const L = (window as any).L;

  // Choose marker color based on status
  const getMarkerColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'green';
      case 'marketing':
        return 'yellow';
      case 'loss':
        return 'red';
      case 'inactive':
        return 'gray';
      case 'collected':
        return 'blue';
      default:
        return 'gray';
    }
  };

  // Choose icon based on business type
  const getBusinessIcon = (businessType: string) => {
    const icons: Record<string, string> = {
      'سوپرمارکت': '🛒',
      'رستوران': '🍽️',
      'داروخانه': '💊',
      'فروشگاه': '🏬',
      'کافه': '☕',
      'نانوایی': '🍞',
      'پوشاک': '👕',
      'آرایشگاه': '💇',
      'موبایل‌فروشی': '📱',
      'کامپیوتر': '💻',
      'کافه‌نت': '🖥️',
    };
    return icons[businessType] || '🏪';
  };

  // Create custom marker
  const markerColor = getMarkerColor(customer.status);
  const businessIcon = getBusinessIcon(customer.businessType);

  // Create custom div icon
  const customIcon = L.divIcon({
    className: 'custom-marker',
    html: `
      <div class="marker-container" style="
        background: ${markerColor === 'green' ? '#22c55e' : 
                     markerColor === 'yellow' ? '#eab308' :
                     markerColor === 'red' ? '#ef4444' :
                     markerColor === 'blue' ? '#3b82f6' : '#6b7280'};
        width: 40px;
        height: 40px;
        border-radius: 50% 50% 50% 0;
        transform: rotate(-45deg);
        display: flex;
        align-items: center;
        justify-content: center;
        border: 2px solid white;
        box-shadow: 0 2px 4px rgba(0,0,0,0.3);
      ">
        <span style="
          transform: rotate(45deg);
          font-size: 18px;
        ">${businessIcon}</span>
      </div>
    `,
    iconSize: [40, 40],
    iconAnchor: [20, 40],
    popupAnchor: [0, -40],
  });

  // Create marker
  const marker = L.marker([lat, lng], { icon: customIcon });

  // Create popup content
  const popupContent = `
    <div dir="rtl" style="font-family: 'Vazirmatn', sans-serif; min-width: 200px;">
      <h3 style="margin: 0 0 8px 0; font-weight: bold; color: #1f2937;">
        ${customer.shopName}
      </h3>
      <p style="margin: 4px 0; color: #6b7280; font-size: 14px;">
        <strong>مالک:</strong> ${customer.ownerName}
      </p>
      <p style="margin: 4px 0; color: #6b7280; font-size: 14px;">
        <strong>نوع کسب‌وکار:</strong> ${customer.businessType}
      </p>
      <p style="margin: 4px 0; color: #6b7280; font-size: 14px;">
        <strong>تلفن:</strong> <span dir="ltr">${customer.phone}</span>
      </p>
      ${customer.monthlyProfit ? `
        <p style="margin: 4px 0; color: #6b7280; font-size: 14px;">
          <strong>سود ماهانه:</strong> ${Math.round(customer.monthlyProfit / 1000000)}M تومان
        </p>
      ` : ''}
      <p style="margin: 8px 0 4px 0; font-size: 14px;">
        <span style="
          padding: 4px 8px;
          border-radius: 12px;
          font-size: 12px;
          background: ${markerColor === 'green' ? '#dcfce7' : 
                       markerColor === 'yellow' ? '#fef3c7' :
                       markerColor === 'red' ? '#fee2e2' :
                       markerColor === 'blue' ? '#dbeafe' : '#f3f4f6'};
          color: ${markerColor === 'green' ? '#166534' : 
                   markerColor === 'yellow' ? '#92400e' :
                   markerColor === 'red' ? '#dc2626' :
                   markerColor === 'blue' ? '#2563eb' : '#374151'};
        ">
          ${customer.status === 'active' ? '✅ کارآمد' :
            customer.status === 'marketing' ? '📢 بازاریابی' :
            customer.status === 'loss' ? '❌ زیان‌ده' :
            customer.status === 'inactive' ? '⏸️ غیرفعال' :
            customer.status === 'collected' ? '📦 جمع‌آوری شده' : customer.status}
        </span>
      </p>
      ${customer.address ? `
        <p style="margin: 8px 0 4px 0; color: #6b7280; font-size: 12px;">
          <strong>آدرس:</strong> ${customer.address}
        </p>
      ` : ''}
    </div>
  `;

  marker.bindPopup(popupContent);

  // Add marker to map and store reference
  marker.addTo(mapInstance.map);
  mapInstance.markers.push(marker);
}

export function clearMarkers(mapInstance: MapInstance): void {
  if (!mapInstance.map) return;
  
  mapInstance.markers.forEach(marker => {
    mapInstance.map.removeLayer(marker);
  });
  mapInstance.markers = [];
}

export function fitMarkersToView(mapInstance: MapInstance): void {
  if (!mapInstance.map || mapInstance.markers.length === 0) return;

  const L = (window as any).L;
  const group = new L.featureGroup(mapInstance.markers);
  mapInstance.map.fitBounds(group.getBounds().pad(0.1));
}
