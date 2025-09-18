export interface MapInstance {
  map: any;
  markers: any[]; // Customer markers only
  bankingUnitMarkers: any[]; // Banking unit markers separately
  drawnItems?: any;
  drawControl?: any;
  onRegionChange?: (hasRegions: boolean) => void;
}

// Function to log customer access
async function logCustomerAccess(customerId: string, accessType: 'view_details' | 'add_visit', customer: any) {
  try {
    const customerSummary = {
      shopName: customer.shopName,
      ownerName: customer.ownerName,
      businessType: customer.businessType,
      phone: customer.phone,
      status: customer.status,
      monthlyProfit: customer.monthlyProfit,
      address: customer.address,
      accessedAt: new Date().toISOString()
    };

    const response = await fetch('/api/customer-access-logs', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        customerId,
        accessType,
        userAgent: navigator.userAgent,
        customerSummary
      }),
    });

    if (!response.ok) {
      console.warn('Failed to log customer access:', response.statusText);
    }
  } catch (error) {
    console.warn('Error logging customer access:', error);
  }
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

export async function initializeMap(container: HTMLElement, onRegionChange?: (hasRegions: boolean) => void): Promise<MapInstance> {
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

    // Initialize draw controls for region selection
    const drawnItems = new L.FeatureGroup();
    map.addLayer(drawnItems);

    const drawControl = new L.Control.Draw({
      position: 'topleft',
      draw: {
        polygon: {
          allowIntersection: false,
          drawError: {
            color: '#e1e100',
            message: '<strong>خطا!</strong> شکل نمی‌تواند با خودش تداخل داشته باشد.'
          },
          shapeOptions: {
            color: '#3b82f6',
            fillColor: '#3b82f6',
            fillOpacity: 0.2
          }
        },
        rectangle: {
          shapeOptions: {
            color: '#3b82f6',
            fillColor: '#3b82f6',
            fillOpacity: 0.2
          }
        },
        circle: {
          shapeOptions: {
            color: '#3b82f6',
            fillColor: '#3b82f6',
            fillOpacity: 0.2
          }
        },
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

    // Add event listeners for draw operations
    map.on('draw:created', function (event: any) {
      const layer = event.layer;
      drawnItems.addLayer(layer);
      
      // Notify that regions have changed
      if (onRegionChange) {
        onRegionChange(drawnItems.getLayers().length > 0);
      }
    });

    map.on('draw:edited', function (event: any) {
      // Notify that regions have changed
      if (onRegionChange) {
        onRegionChange(drawnItems.getLayers().length > 0);
      }
    });

    map.on('draw:deleted', function (event: any) {
      // Notify that regions have changed
      if (onRegionChange) {
        onRegionChange(drawnItems.getLayers().length > 0);
      }
    });

    return {
      map,
      markers: [],
      bankingUnitMarkers: [],
      drawnItems,
      drawControl,
      onRegionChange,
    };
  } catch (error) {
    console.warn('Failed to initialize map:', error);
    return {
      map: null,
      markers: [],
      bankingUnitMarkers: [],
    };
  }
}

export function addBankingUnitMarker(
  mapInstance: MapInstance,
  unit: any,
  lat: number,
  lng: number,
  onUnitClick?: (unit: any) => void
): any {
  if (!mapInstance.map || typeof window === 'undefined' || !(window as any).L) {
    return;
  }

  const L = (window as any).L;

  // Choose color and icon based on unit type
  const getUnitStyle = (unitType: string) => {
    switch (unitType) {
      case 'branch': // شعبه
        return { color: '#1e40af', icon: '🏦', label: 'شعبه' };
      case 'counter': // باجه
        return { color: '#059669', icon: '🏪', label: 'باجه' };
      case 'shahrbnet_kiosk': // پیشخوان شهرنت
        return { color: '#dc2626', icon: '🏧', label: 'پیشخوان شهرنت' };
      default:
        return { color: '#6b7280', icon: '🏢', label: 'واحد' };
    }
  };

  const { color, icon, label } = getUnitStyle(unit.unitType);

  // Create custom banking unit icon
  const customIcon = L.divIcon({
    html: `
      <div style="
        background: ${color};
        width: 44px;
        height: 44px;
        border-radius: 8px;
        display: flex;
        align-items: center;
        justify-content: center;
        border: 3px solid white;
        box-shadow: 0 3px 6px rgba(0,0,0,0.4);
        font-weight: bold;
      ">
        <span style="
          font-size: 20px;
          color: white;
        ">${icon}</span>
      </div>
    `,
    iconSize: [44, 44],
    iconAnchor: [22, 22],
    popupAnchor: [0, -22],
    className: 'banking-unit-marker'
  });

  // Create marker
  const marker = L.marker([lat, lng], { icon: customIcon });

  // Create popup content safely to prevent XSS
  const escapeHtml = (text: string) => {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  };

  const safeName = escapeHtml(unit.name || '');
  const safeCode = escapeHtml(unit.code || '');
  const safeManagerName = unit.managerName ? escapeHtml(unit.managerName) : '';
  const safePhone = unit.phone ? escapeHtml(unit.phone) : '';
  const safeAddress = unit.address ? escapeHtml(unit.address) : '';
  const safeId = escapeHtml(unit.id || '');

  const popupContent = `
    <div style="min-width: 250px; font-family: Vazirmatn, sans-serif; direction: rtl;">
      <div style="border-bottom: 2px solid ${color}; padding-bottom: 8px; margin-bottom: 12px;">
        <h3 style="margin: 0; color: ${color}; font-size: 16px; font-weight: bold;">${safeName}</h3>
        <p style="margin: 4px 0 0 0; color: #666; font-size: 14px;">${label} - کد: ${safeCode}</p>
      </div>
      
      <div style="margin-bottom: 12px;">
        ${safeManagerName ? `<p style="margin: 0 0 4px 0;"><strong>مسئول:</strong> ${safeManagerName}</p>` : ''}
        ${safePhone ? `<p style="margin: 0 0 4px 0;"><strong>تلفن:</strong> ${safePhone}</p>` : ''}
        ${safeAddress ? `<p style="margin: 0 0 4px 0;"><strong>آدرس:</strong> ${safeAddress}</p>` : ''}
      </div>

      <div style="display: flex; gap: 8px; margin-top: 12px;">
        <button 
          id="view-unit-btn-${safeId}" 
          data-testid="button-view-unit-details"
          style="
            flex: 1;
            background: ${color};
            color: white;
            border: none;
            padding: 8px 12px;
            border-radius: 6px;
            cursor: pointer;
            font-size: 13px;
            font-weight: bold;
          "
        >
          📊 مشاهده جزئیات
        </button>
      </div>
    </div>
  `;

  // Bind popup
  marker.bindPopup(popupContent, {
    maxWidth: 300,
    autoClose: true,
    closeOnEscapeKey: true 
  });

  // Add click handler for view details button
  if (onUnitClick) {
    marker.on('popupopen', () => {
      const viewBtn = document.getElementById(`view-unit-btn-${unit.id}`);
      if (viewBtn) {
        viewBtn.addEventListener('click', async (e) => {
          e.stopPropagation();
          marker.closePopup();
          onUnitClick(unit);
        });
      }
    });
  }

  // Add marker to map and store reference in separate banking unit markers array
  marker.addTo(mapInstance.map);
  mapInstance.bankingUnitMarkers.push(marker);

  return marker;
}

export function addCustomerMarker(
  mapInstance: MapInstance,
  customer: any,
  lat: number,
  lng: number,
  onCustomerClick?: (customer: any) => void,
  onVisitClick?: (customer: any) => void
): any {
  if (!mapInstance.map || typeof window === 'undefined' || !(window as any).L) {
    return;
  }

  const L = (window as any).L;

  // Choose marker color based on status - 5 color system
  const getMarkerColor = (status: string) => {
    switch (status) {
      case 'active': // کارآمد (سبز)
        return 'green';
      case 'normal': // معمولی (زرد) 
        return 'yellow';
      case 'loss': // زیان‌ده (قرمز)
        return 'red';
      case 'marketing': // در حال بازاریابی (طوسی)
        return 'gray';
      case 'collected': // جمع‌آوری شده (خاکستری تیره)
        return 'darkgray';
      default:
        return 'gray';
    }
  };

  // Choose icon based on business type
  const getBusinessIcon = (businessType: string) => {
    const icons: Record<string, string> = {
      // خوراکی و غذایی
      'سوپرمارکت': '🛒', 'فروشگاه عمومی': '🏪', 'مینی‌مارکت': '🏪', 'فروشگاه زنجیره‌ای': '🏬', 'هایپرمارکت': '🛍️',
      'رستوران': '🍽️', 'کافه': '☕', 'فست‌فود': '🍟', 'نانوایی': '🍞', 'قنادی': '🧁', 'شیرینی‌پزی': '🎂', 'کباب‌سرا': '🥙', 
      'چلوکباب': '🍛', 'سالن پذیرایی': '🏛️', 'کافه‌رستوران': '☕', 'بوفه': '🍴', 'کانتین': '🥪', 'آشپزخانه صنعتی': '👨‍🍳',
      'آبمیوه‌فروشی': '🥤', 'بستنی‌فروشی': '🍦', 'قهوه‌خانه': '☕', 'چای‌خانه': '🍵', 'ساندویچی': '🥪', 'پیتزا فروشی': '🍕',
      'مغازه میوه': '🍎', 'سبزی‌فروشی': '🥬', 'گوشت‌فروشی': '🥩', 'مرغ‌فروشی': '🐔', 'ماهی‌فروشی': '🐟', 'لبنیات': '🥛',
      'عسل فروشی': '🍯', 'ادویه فروشی': '🌶️', 'خشکبار': '🥜', 'چای و قهوه': '🍵', 'نوشیدنی': '🥤', 'بستنی ساز': '🍧',
      
      // پوشاک و مد
      'پوشاک': '👕', 'بوتیک': '👗', 'پوشاک مردانه': '🤵', 'پوشاک زنانه': '👩‍🦱', 'پوشاک بچگانه': '👶', 'کیف و کفش': '👜', 
      'کفش‌فروشی': '👟', 'کیف فروشی': '👜', 'چرم فروشی': '🧥', 'پارچه فروشی': '🧵', 'خیاطی': '🧷', 'طراحی مد': '✂️',
      'لباس عروس': '👰', 'کراوات و پیراهن': '👔', 'لباس ورزشی': '👕', 'زیرپوش': '👙', 'جوراب': '🧦', 'کلاه': '👒',
      'عینک آفتابی': '🕶️', 'ساعت': '⌚', 'جواهرات': '💎', 'طلا و جواهر': '💰', 'نقره فروشی': '⚪', 'سکه و طلا': '🪙',
      
      // زیبایی و سلامت
      'آرایشگاه': '💇', 'سالن زیبایی': '💅', 'لوازم آرایشی': '💄', 'آرایشگاه مردانه': '💇‍♂️', 'آرایشگاه زنانه': '💇‍♀️', 
      'پیرایش مردانه': '✂️', 'مانیکور پدیکور': '💅', 'ماساژ درمانی': '💆', 'سولاریوم': '☀️', 'لیزر موهای زائد': '⚡',
      'داروخانه': '💊', 'عطاری': '🌿', 'طب سنتی': '🌱', 'مطب': '🏥', 'دندانپزشکی': '🦷', 'چشم‌پزشکی': '👁️', 'آزمایشگاه': '🔬',
      'رادیولوژی': '📡', 'فیزیوتراپی': '🏋️', 'کلینیک': '🏥', 'درمانگاه': '⚕️', 'طب طبیعی': '🍃', 'داروخانه آنلاین': '💻',
      'عطر و ادکلن': '🌸', 'محصولات بهداشتی': '🧴', 'لوازم پزشکی': '🩺', 'اپتیک': '👓', 'سمعک': '👂', 'ارتوپدی': '🦴',
      
      // فناوری و الکترونیک
      'موبایل‌فروشی': '📱', 'کامپیوتر': '💻', 'لپ‌تاپ': '💻', 'لوازم الکترونیکی': '⚡', 'لوازم خانگی': '🏠', 'تلویزیون': '📺',
      'سیستم صوتی': '🔊', 'دوربین': '📷', 'گوشی همراه': '📞', 'تبلت': '📱', 'کنسول بازی': '🎮', 'بازی کامپیوتری': '🎯',
      'کافه‌نت': '🖥️', 'تعمیر کامپیوتر': '🔧', 'تعمیر موبایل': '🔧', 'شارژر و کابل': '🔌', 'هدفون': '🎧', 'اسپیکر': '🔊',
      'ساعت هوشمند': '⌚', 'لوازم جانبی': '🔌', 'پرینتر': '🖨️', 'اسکنر': '📄', 'سرور': '🖥️', 'شبکه': '🌐', 'امنیت الکترونیک': '📹',
      
      // خودرو و حمل‌ونقل
      'تعمیرگاه خودرو': '🔧', 'نمایشگاه خودرو': '🚗', 'خودروی کارکرده': '🚙', 'پمپ بنزین': '⛽', 'لوازم یدکی': '🔩',
      'تایر فروشی': '🛞', 'باتری خودرو': '🔋', 'روغن موتور': '🛢️', 'کارواش': '🚿', 'صافکاری': '🔨', 'نقاشی خودرو': '🎨',
      'تعمیرات موتورسیکلت': '🏍️', 'فروش موتور': '🏍️', 'دوچرخه': '🚲', 'لوازم دوچرخه': '🚲', 'اتوگاز': '🚗',
      'خدمات رانندگی': '🚖', 'تاکسی تلفنی': '🚕', 'اتوبوس': '🚌', 'کامیون': '🚛', 'ماشین‌آلات راهسازی': '🚜',
      
      // خدمات مالی
      'بانک': '🏦', 'صرافی': '💱', 'بیمه': '🛡️', 'صندوق قرض‌الحسنه': '💰', 'لیزینگ': '💳', 'حسابداری': '📊', 'مالیاتی': '📋',
      'مشاوره سرمایه‌گذاری': '📈', 'املاک': '🏡', 'مشاورین املاک': '🏘️', 'رهن و اجاره': '🏠', 'خرید و فروش': '🏪',
      'ارزیابی املاک': '📏', 'مسکن مهر': '🏗️', 'پروژه ساختمانی': '🏗️', 'پیمانکاری': '👷', 'معماری': '📐',
      
      // اقامت و گردشگری  
      'هتل': '🏨', 'مهمان‌خانه': '🏠', 'هتل آپارتمان': '🏢', 'اقامتگاه بوم‌گردی': '🏕️', 'ویلا': '🏡', 'کمپ': '⛺',
      'آژانس مسافرتی': '✈️', 'تور مسافرتی': '🎒', 'بلیت هواپیما': '🎫', 'رزرواسیون': '📅', 'راهنمای تور': '🗺️',
      'اجاره ماشین': '🚗', 'تاکسی گردشگری': '🚕', 'راهنمای گردشگری': '👨‍💼', 'کشتی تفریحی': '⛵',
      
      // ورزش و تفریح
      'باشگاه ورزشی': '🏋️', 'زورخانه': '💪', 'استخر': '🏊', 'زمین فوتبال': '⚽', 'سالن بدمینتون': '🏸', 'تنیس': '🎾',
      'کوهنوردی': '⛰️', 'ورزش‌های آبی': '🏄', 'لوازم ورزشی': '⚽', 'بازی‌های کامپیوتری': '🎮', 'تفریحگاه': '🎡',
      'پارک آبی': '🏊', 'شهربازی': '🎠', 'سالن بولینگ': '🎳', 'بیلیارد': '🎱', 'اسکیت': '⛸️', 'دوچرخه‌سواری': '🚴',
      
      // آموزش و فرهنگ
      'کتابفروشی': '📚', 'لوازم التحریر': '✏️', 'آموزشگاه': '🎓', 'مدرسه خصوصی': '🏫', 'کلاس خصوصی': '👨‍🏫', 
      'آموزش زبان': '🌍', 'کامپیوتر آموز': '💻', 'آموزش موسیقی': '🎵', 'آموزش رانندگی': '🚗', 'مهد کودک': '👶',
      'کتابخانه': '📖', 'نشریات': '📰', 'مطبوعات': '📄', 'تایپ و تکثیر': '🖨️', 'طراحی گرافیک': '🎨', 'چاپخانه': '🖨️',
      'عکاسی': '📸', 'فیلم‌برداری': '🎬', 'استودیو': '🎥', 'گالری هنری': '🖼️', 'صنایع دستی': '🎭', 'آنتیک': '🏺',
      
      // کشاورزی و دامپروری
      'کشاورزی': '🌾', 'باغداری': '🌳', 'گلخانه': '🏡', 'فروش بذر': '🌱', 'کود کشاورزی': '🌿', 'ماشین‌آلات کشاورزی': '🚜',
      'دامپروری': '🐄', 'مرغداری': '🐔', 'زنبورداری': '🐝', 'پرورش ماهی': '🐟', 'قارچ پروری': '🍄', 'گل و گیاه': '🌺',
      'گل‌فروشی': '🌹', 'باغبانی': '🌸', 'محصولات ارگانیک': '🥬', 'کنسرو و غذاهای آماده': '🥫',
      
      // صنعت و تولید
      'کارخانه': '🏭', 'صنایع غذایی': '🏭', 'صنایع نساجی': '🧵', 'فلزکاری': '🔨', 'جوشکاری': '⚡', 'نجاری': '🪚',
      'کابینت‌سازی': '🪑', 'صنایع چوب': '🌲', 'پلاستیک‌سازی': '♻️', 'شیشه‌سازی': '🪟', 'سرامیک': '🏺', 'موزاییک': '🎨',
      'رنگ‌سازی': '🎨', 'محصولات شیمیایی': '🧪', 'دارو‌سازی': '💊', 'کارگاه مونتاژ': '🔧', 'تعمیرگاه صنعتی': '⚙️',
      
      // خدمات عمومی
      'اسباب‌بازی': '🧸', 'هدایا و سوغات': '🎁', 'پارتی و جشن': '🎉', 'تولد و مراسم': '🎂', 'عکس‌فوری': '📸', 
      'خدمات نظافت': '🧹', 'خدمات باغبانی': '🌿', 'نگهبانی': '👮', 'حمل و نقل': '🚚', 'بسته‌بندی': '📦', 'بار': '📦',
      'انبار': '🏪', 'حمل اثاثیه': '🚛', 'آسانسور': '🛗', 'تاسیسات': '🔧', 'برق‌کاری': '⚡', 'آب و فاضلاب': '💧',
      'گاز': '🔥', 'بازیافت': '♻️', 'مواد بازیافتی': '♻️', 'ضایعات': '🗑️', 'زباله': '🗑️', 'محیط زیست': '🌍'
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
                     markerColor === 'darkgray' ? '#374151' :
                     markerColor === 'gray' ? '#9ca3af' : '#6b7280'};
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
  popupContainer.style.cssText = "font-family: 'Vazirmatn', sans-serif; min-width: 220px; max-width: 280px; padding: 4px;";

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

  // Add action buttons section
  const actionsDiv = document.createElement('div');
  actionsDiv.style.cssText = 'margin: 12px 0 0 0; border-top: 1px solid #e5e7eb; padding-top: 12px; display: flex; gap: 8px; justify-content: space-between;';
  
  // View Details Button
  const detailsBtn = document.createElement('button');
  detailsBtn.textContent = '📋 مشاهدة جزئیات';
  detailsBtn.style.cssText = 'flex: 1; padding: 8px 12px; background: #3b82f6; color: white; border: none; border-radius: 6px; font-size: 12px; cursor: pointer; font-family: inherit;';
  detailsBtn.setAttribute('data-testid', 'button-view-details');
  
  // Add Visit Button  
  const visitBtn = document.createElement('button');
  visitBtn.textContent = '📝 ثبت ویزیت';
  visitBtn.style.cssText = 'flex: 1; padding: 8px 12px; background: #059669; color: white; border: none; border-radius: 6px; font-size: 12px; cursor: pointer; font-family: inherit;';
  visitBtn.setAttribute('data-testid', 'button-add-visit');
  
  actionsDiv.appendChild(detailsBtn);
  actionsDiv.appendChild(visitBtn);
  popupContainer.appendChild(actionsDiv);

  marker.bindPopup(popupContainer, { 
    maxWidth: 280,
    className: 'custom-popup',
    closeButton: true,
    autoClose: true,
    closeOnEscapeKey: true 
  });

  // Add click handlers for action buttons
  if (onCustomerClick) {
    detailsBtn.addEventListener('click', async (e) => {
      e.stopPropagation();
      marker.closePopup();
      
      // Log the customer access
      await logCustomerAccess(customer.id, 'view_details', customer);
      
      onCustomerClick(customer);
    });
  }

  if (onVisitClick) {
    visitBtn.addEventListener('click', async (e) => {
      e.stopPropagation(); 
      marker.closePopup();
      
      // Log the customer access
      await logCustomerAccess(customer.id, 'add_visit', customer);
      
      onVisitClick(customer);
    });
  }

  // Add marker to map and store reference
  marker.addTo(mapInstance.map);
  mapInstance.markers.push(marker);
  
  return marker;
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

// Helper function to check if a marker is inside any drawn regions
export function isMarkerInRegion(mapInstance: MapInstance, marker: any): boolean {
  if (!mapInstance.drawnItems || mapInstance.drawnItems.getLayers().length === 0) {
    return true; // If no regions drawn, show all markers
  }

  const markerLatLng = marker.getLatLng();
  const L = (window as any).L;
  
  // Check if marker is inside any drawn region
  const layers = mapInstance.drawnItems.getLayers();
  for (const layer of layers) {
    if (layer instanceof L.Polygon || layer instanceof L.Rectangle) {
      // For polygons and rectangles, check if point is inside
      if (isPointInPolygon(markerLatLng, layer.getLatLngs()[0])) {
        return true;
      }
    } else if (layer instanceof L.Circle) {
      // For circles, check distance from center
      const center = layer.getLatLng();
      const radius = layer.getRadius();
      const distance = markerLatLng.distanceTo(center);
      if (distance <= radius) {
        return true;
      }
    }
  }
  return false;
}

// Point-in-polygon algorithm - FIXED: Use proper x=lng, y=lat coordinates
function isPointInPolygon(point: any, polygon: any[]): boolean {
  const x = point.lng, y = point.lat; // FIXED: x=longitude, y=latitude
  let inside = false;
  
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const xi = polygon[i].lng, yi = polygon[i].lat; // FIXED: use lng/lat correctly
    const xj = polygon[j].lng, yj = polygon[j].lat; // FIXED: use lng/lat correctly
    
    if (((yi > y) !== (yj > y)) && (x < (xj - xi) * (y - yi) / (yj - yi) + xi)) {
      inside = !inside;
    }
  }
  
  return inside;
}

// Function to get statistics for customers within drawn regions
export function getRegionStatistics(mapInstance: MapInstance, customers: any[]): {
  totalInRegion: number;
  activeInRegion: number;
  regionRevenue: number;
} {
  if (!mapInstance.drawnItems || mapInstance.drawnItems.getLayers().length === 0) {
    return {
      totalInRegion: customers.length,
      activeInRegion: customers.filter(c => c.status === 'active').length,
      regionRevenue: customers.reduce((sum, c) => sum + (c.monthlyProfit || 0), 0)
    };
  }

  let totalInRegion = 0;
  let activeInRegion = 0;
  let regionRevenue = 0;

  customers.forEach(customer => {
    if (!customer.latitude || !customer.longitude) return;
    
    const customerLatLng = { lat: parseFloat(customer.latitude), lng: parseFloat(customer.longitude) };
    const L = (window as any).L;
    
    // Check if customer is in any drawn region
    const layers = mapInstance.drawnItems.getLayers();
    let inRegion = false;
    
    for (const layer of layers) {
      if (layer instanceof L.Polygon || layer instanceof L.Rectangle) {
        if (isPointInPolygon(customerLatLng, layer.getLatLngs()[0])) {
          inRegion = true;
          break;
        }
      } else if (layer instanceof L.Circle) {
        const center = layer.getLatLng();
        const radius = layer.getRadius();
        const distance = L.latLng(customerLatLng.lat, customerLatLng.lng).distanceTo(center);
        if (distance <= radius) {
          inRegion = true;
          break;
        }
      }
    }
    
    if (inRegion) {
      totalInRegion++;
      if (customer.status === 'active') activeInRegion++;
      regionRevenue += customer.monthlyProfit || 0;
    }
  });

  return { totalInRegion, activeInRegion, regionRevenue };
}
