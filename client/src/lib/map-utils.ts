export interface MapInstance {
  map: any;
  markers: any[];
}

// Function to wait for Leaflet to be available
function waitForLeaflet(): Promise<any> {
  return new Promise((resolve, reject) => {
    if (typeof window !== 'undefined' && (window as any).L) {
      resolve((window as any).L);
      return;
    }
    
    // Poll for Leaflet every 100ms, timeout after 10 seconds
    let attempts = 0;
    const maxAttempts = 100;
    
    const checkLeaflet = () => {
      attempts++;
      if (typeof window !== 'undefined' && (window as any).L) {
        resolve((window as any).L);
      } else if (attempts >= maxAttempts) {
        reject(new Error('Leaflet failed to load within timeout period'));
      } else {
        setTimeout(checkLeaflet, 100);
      }
    };
    
    checkLeaflet();
  });
}

export async function initializeMap(container: HTMLElement): Promise<MapInstance> {
  try {
    const L = await waitForLeaflet();
    
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

    // Configure RTL controls positioning
    map.zoomControl.setPosition('topright');
    map.attributionControl.setPosition('bottomright');

    return {
      map,
      markers: [],
    };
  } catch (error) {
    console.warn('Failed to initialize map:', error);
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

  // Create popup content safely using DOM methods to prevent XSS
  const popupContainer = document.createElement('div');
  popupContainer.dir = 'rtl';
  popupContainer.style.cssText = "font-family: 'Vazirmatn', sans-serif; min-width: 200px;";

  // Shop name (title)
  const title = document.createElement('h3');
  title.style.cssText = 'margin: 0 0 8px 0; font-weight: bold; color: #1f2937;';
  title.textContent = customer.shopName || '';
  popupContainer.appendChild(title);

  // Owner name
  const ownerP = document.createElement('p');
  ownerP.style.cssText = 'margin: 4px 0; color: #6b7280; font-size: 14px;';
  const ownerStrong = document.createElement('strong');
  ownerStrong.textContent = 'مالک: ';
  ownerP.appendChild(ownerStrong);
  ownerP.appendChild(document.createTextNode(customer.ownerName || ''));
  popupContainer.appendChild(ownerP);

  // Business type
  const businessP = document.createElement('p');
  businessP.style.cssText = 'margin: 4px 0; color: #6b7280; font-size: 14px;';
  const businessStrong = document.createElement('strong');
  businessStrong.textContent = 'نوع کسب‌وکار: ';
  businessP.appendChild(businessStrong);
  businessP.appendChild(document.createTextNode(customer.businessType || ''));
  popupContainer.appendChild(businessP);

  // Phone
  const phoneP = document.createElement('p');
  phoneP.style.cssText = 'margin: 4px 0; color: #6b7280; font-size: 14px;';
  const phoneStrong = document.createElement('strong');
  phoneStrong.textContent = 'تلفن: ';
  phoneP.appendChild(phoneStrong);
  const phoneSpan = document.createElement('span');
  phoneSpan.dir = 'ltr';
  phoneSpan.textContent = customer.phone || '';
  phoneP.appendChild(phoneSpan);
  popupContainer.appendChild(phoneP);

  // Monthly profit (if available)
  if (customer.monthlyProfit) {
    const profitP = document.createElement('p');
    profitP.style.cssText = 'margin: 4px 0; color: #6b7280; font-size: 14px;';
    const profitStrong = document.createElement('strong');
    profitStrong.textContent = 'سود ماهانه: ';
    profitP.appendChild(profitStrong);
    profitP.appendChild(document.createTextNode(`${Math.round(customer.monthlyProfit / 1000000)}M تومان`));
    popupContainer.appendChild(profitP);
  }

  // Status badge
  const statusP = document.createElement('p');
  statusP.style.cssText = 'margin: 8px 0 4px 0; font-size: 14px;';
  const statusSpan = document.createElement('span');
  const statusColors = {
    green: { bg: '#dcfce7', color: '#166534' },
    yellow: { bg: '#fef3c7', color: '#92400e' },
    red: { bg: '#fee2e2', color: '#dc2626' },
    blue: { bg: '#dbeafe', color: '#2563eb' },
    gray: { bg: '#f3f4f6', color: '#374151' }
  };
  const colors = statusColors[markerColor as keyof typeof statusColors] || statusColors.gray;
  statusSpan.style.cssText = `padding: 4px 8px; border-radius: 12px; font-size: 12px; background: ${colors.bg}; color: ${colors.color};`;
  
  const statusText = customer.status === 'active' ? '✅ کارآمد' :
                    customer.status === 'marketing' ? '📢 بازاریابی' :
                    customer.status === 'loss' ? '❌ زیان‌ده' :
                    customer.status === 'inactive' ? '⏸️ غیرفعال' :
                    customer.status === 'collected' ? '📦 جمع‌آوری شده' : customer.status;
  statusSpan.textContent = statusText || '';
  statusP.appendChild(statusSpan);
  popupContainer.appendChild(statusP);

  // Address (if available)
  if (customer.address) {
    const addressP = document.createElement('p');
    addressP.style.cssText = 'margin: 8px 0 4px 0; color: #6b7280; font-size: 12px;';
    const addressStrong = document.createElement('strong');
    addressStrong.textContent = 'آدرس: ';
    addressP.appendChild(addressStrong);
    addressP.appendChild(document.createTextNode(customer.address));
    popupContainer.appendChild(addressP);
  }

  marker.bindPopup(popupContainer);

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
