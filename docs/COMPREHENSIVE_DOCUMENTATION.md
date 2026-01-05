# مستندات جامع سامانه مانیتورینگ هوشمند پایانه‌های فروشگاهی (POS)
## نسخه 1.0.2

---

## فهرست مطالب

1. [معرفی کلی سیستم](#1-معرفی-کلی-سیستم)
2. [معماری نرم‌افزار](#2-معماری-نرم‌افزار)
3. [مدل داده و پایگاه‌داده](#3-مدل-داده-و-پایگاه‌داده)
4. [ماژول‌های اصلی سیستم](#4-ماژول‌های-اصلی-سیستم)
5. [الگوریتم‌های هوش مصنوعی و یادگیری ماشین](#5-الگوریتم‌های-هوش-مصنوعی-و-یادگیری-ماشین)
6. [تحلیل‌های جغرافیایی پیشرفته](#6-تحلیل‌های-جغرافیایی-پیشرفته)
7. [سیستم مانیتورینگ بلادرنگ](#7-سیستم-مانیتورینگ-بلادرنگ)
8. [APIها و سرویس‌های Backend](#8-apiها-و-سرویس‌های-backend)
9. [واسط کاربری و کامپوننت‌ها](#9-واسط-کاربری-و-کامپوننت‌ها)
10. [ویژگی‌های پیشرفته](#10-ویژگی‌های-پیشرفته)
11. [امنیت و عملکرد](#11-امنیت-و-عملکرد)
12. [راهنمای استقرار](#12-راهنمای-استقرار)

---

## 1. معرفی کلی سیستم

### 1.1 هدف و چشم‌انداز

سامانه مانیتورینگ هوشمند پایانه‌های فروشگاهی (POS) یک پلتفرم جامع مدیریت، تحلیل و پیش‌بینی برای شبکه دستگاه‌های کارت‌خوان است. این سیستم با استفاده از فناوری‌های پیشرفته هوش مصنوعی، یادگیری ماشین و تحلیل‌های جغرافیایی، امکان:

- **مانیتورینگ بلادرنگ** وضعیت تمامی دستگاه‌ها
- **پیش‌بینی هوشمند** روندهای فروش و تراکنش
- **شناسایی خودکار** مشتریان در معرض ریسک
- **بهینه‌سازی مکان‌یابی** واحدهای بانکی
- **تحلیل جغرافیایی** با نقشه‌های حرارتی پیشرفته

را فراهم می‌کند.

### 1.2 ویژگی‌های کلیدی

| ویژگی | توضیحات |
|-------|---------|
| داشبورد هوشمند | نمایش آماری کامل با بروزرسانی لحظه‌ای |
| نقشه تعاملی | نمایش موقعیت مشتریان و واحدهای بانکی |
| هوش مصنوعی | پیش‌بینی فروش، ریزش مشتری، بهینه‌سازی قیمت |
| گزارش‌گیری پیشرفته | تولید PDF/Excel با نمودارهای تحلیلی |
| مدیریت مشتریان | ثبت، ویرایش و پیگیری کامل اطلاعات |
| واردات دسته‌ای | بارگذاری Excel برای داده‌های حجیم |
| نسخه دسکتاپ | اجرای آفلاین با Electron |

---

## 2. معماری نرم‌افزار

### 2.1 نمای کلی معماری

```
┌─────────────────────────────────────────────────────────────────┐
│                        Client Layer                              │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────────┐  │
│  │   React 18  │  │  TanStack   │  │    Shadcn/ui + Radix   │  │
│  │   + Wouter  │  │   Query v5  │  │    Component Library    │  │
│  └─────────────┘  └─────────────┘  └─────────────────────────┘  │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────────┐  │
│  │   Leaflet   │  │  Recharts   │  │     TensorFlow.js      │  │
│  │   + H3-js   │  │  + D3.js    │  │   (AI Predictions)     │  │
│  └─────────────┘  └─────────────┘  └─────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                       Server Layer                               │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────────┐  │
│  │  Express.js │  │  WebSocket  │  │      Drizzle ORM       │  │
│  │   REST API  │  │    Server   │  │   Type-safe Database   │  │
│  └─────────────┘  └─────────────┘  └─────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                      Database Layer                              │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │                    PostgreSQL (Neon)                        ││
│  │   - Real-time replication                                   ││
│  │   - Serverless scaling                                      ││
│  │   - Point-in-time recovery                                  ││
│  └─────────────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────────┘
```

### 2.2 پشته فناوری

#### Frontend
| فناوری | نسخه | کاربرد |
|--------|------|--------|
| React | 18.3.1 | فریم‌ورک UI اصلی |
| TypeScript | 5.6.3 | تایپ استاتیک |
| TanStack Query | 5.60.5 | مدیریت state سرور |
| Wouter | 3.3.5 | مسیریابی سبک |
| Tailwind CSS | 3.4.17 | استایل‌دهی |
| Shadcn/ui | - | کامپوننت‌های UI |
| Leaflet | 1.9.4 | نقشه تعاملی |
| Recharts | 2.15.2 | نمودارها |
| D3.js | 7.9.0 | تجسم داده پیشرفته |
| H3-js | 4.3.0 | سیستم شبکه‌بندی شش‌ضلعی |

#### Backend
| فناوری | نسخه | کاربرد |
|--------|------|--------|
| Node.js | 20.x | محیط اجرا |
| Express | 4.21.2 | فریم‌ورک HTTP |
| Drizzle ORM | 0.39.1 | ORM تایپ‌سیف |
| WebSocket (ws) | 8.18.0 | ارتباط بلادرنگ |
| Zod | 3.24.2 | اعتبارسنجی داده |

#### Database
| فناوری | کاربرد |
|--------|--------|
| PostgreSQL | پایگاه داده اصلی |
| Neon Serverless | زیرساخت ابری |
| Better-SQLite3 | دیتابیس محلی (Electron) |

---

## 3. مدل داده و پایگاه‌داده

### 3.1 نمودار موجودیت-رابطه (ERD)

```
┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│   branches   │     │  employees   │     │  customers   │
├──────────────┤     ├──────────────┤     ├──────────────┤
│ id (PK)      │     │ id (PK)      │     │ id (PK)      │
│ name         │◄───┐│ name         │◄───┐│ shopName     │
│ code         │    ││ employeeCode │    ││ ownerName    │
│ type         │    ││ position     │    ││ phone        │
│ manager      │    ││ branchId(FK) │────┘│ businessType │
│ latitude     │    │└──────────────┘     │ latitude     │
│ longitude    │    │                     │ longitude    │
│ monthlyTarget│    │                     │ monthlyProfit│
└──────────────┘    │                     │ branchId(FK) │───┐
                    │                     │ bankingUnitId│   │
                    │                     └──────────────┘   │
                    │                           │            │
                    │                           ▼            │
┌──────────────┐    │                    ┌──────────────┐   │
│ posDevices   │    │                    │ transactions │   │
├──────────────┤    │                    ├──────────────┤   │
│ id (PK)      │    │                    │ id (PK)      │   │
│ customerId   │────┼────────────────────│ posDeviceId  │   │
│ deviceCode   │    │                    │ amount       │   │
│ status       │    │                    │ date         │   │
│ lastConnection    │                    └──────────────┘   │
└──────────────┘    │                                       │
                    │     ┌──────────────┐                  │
                    │     │bankingUnits  │◄─────────────────┘
                    │     ├──────────────┤
                    │     │ id (PK)      │
                    └─────│ code         │
                          │ name         │
                          │ unitType     │
                          │ latitude     │
                          │ longitude    │
                          └──────────────┘
```

### 3.2 جداول اصلی

#### customers (مشتریان)
| فیلد | نوع | توضیحات |
|------|-----|---------|
| id | VARCHAR (UUID) | شناسه یکتا |
| nationalId | TEXT | کد ملی |
| shopName | TEXT | نام فروشگاه |
| ownerName | TEXT | نام مالک |
| phone | TEXT | شماره تماس |
| businessType | TEXT | نوع کسب‌وکار |
| latitude/longitude | DECIMAL | موقعیت جغرافیایی |
| monthlyProfit | INTEGER | سود ماهانه (تومان) |
| status | TEXT | وضعیت (active/inactive) |
| bankingUnitId | VARCHAR (FK) | واحد بانکی مرتبط |

#### posDevices (دستگاه‌های POS)
| فیلد | نوع | توضیحات |
|------|-----|---------|
| id | VARCHAR (UUID) | شناسه یکتا |
| customerId | VARCHAR (FK) | مشتری مالک |
| deviceCode | TEXT | کد دستگاه |
| status | TEXT | وضعیت (active/offline/maintenance) |
| lastConnection | TIMESTAMP | آخرین اتصال |

#### posMonthlyStats (آمار ماهانه)
| فیلد | نوع | توضیحات |
|------|-----|---------|
| id | VARCHAR (UUID) | شناسه یکتا |
| customerId | VARCHAR (FK) | مشتری |
| year/month | INTEGER | سال و ماه |
| totalTransactions | INTEGER | تعداد تراکنش |
| totalAmount | INTEGER | مبلغ کل |
| revenue | INTEGER | درآمد |
| profit | INTEGER | سود |

#### bankingUnits (واحدهای بانکی)
| فیلد | نوع | توضیحات |
|------|-----|---------|
| id | VARCHAR (UUID) | شناسه یکتا |
| code | VARCHAR | کد واحد |
| name | VARCHAR | نام واحد |
| unitType | TEXT | نوع (branch/counter/shahrbnet_kiosk) |
| latitude/longitude | DECIMAL | موقعیت |
| isActive | BOOLEAN | وضعیت فعال |

#### territories (مناطق جغرافیایی)
| فیلد | نوع | توضیحات |
|------|-----|---------|
| id | VARCHAR (UUID) | شناسه یکتا |
| name | TEXT | نام منطقه |
| color | VARCHAR | رنگ نمایش |
| geometry | JSONB | شکل هندسی (GeoJSON) |
| bbox | JSONB | محدوده مختصات |
| assignedBankingUnitId | VARCHAR (FK) | واحد تخصیص‌یافته |

---

## 4. ماژول‌های اصلی سیستم

### 4.1 داشبورد اصلی (Dashboard)

**مسیر:** `/` (صفحه اصلی)

**کامپوننت‌های فرعی:**
- `overview-stats.tsx` - نمایش آمار کلی
- `business-categories.tsx` - توزیع اصناف
- `alerts-panel.tsx` - هشدارهای مهم
- `branch-performance.tsx` - عملکرد واحدها

**قابلیت‌ها:**
- نمایش تعداد کل دستگاه‌ها، مشتریان، واحدهای بانکی
- نرخ پوشش و بهره‌وری
- نقشه حرارتی تعاملی
- فیلترهای پیشرفته

### 4.2 مدیریت مشتریان (Customer Management)

**کامپوننت‌ها:**
- `customer-management.tsx` - لیست و مدیریت
- `customer-form-modal.tsx` - فرم ثبت/ویرایش
- `customer-info-modal.tsx` - جزئیات مشتری
- `visit-dialog.tsx` - ثبت ویزیت

**ویژگی‌ها:**
- جستجوی پیشرفته با فیلتر
- ثبت سریع از روی نقشه
- مدیریت وضعیت مشتری
- تاریخچه ویزیت‌ها

### 4.3 نقشه هوشمند (Intelligent Map)

**مسیر:** `/intelligent-map`

**کامپوننت‌ها:**
- `pos-map.tsx` - نقشه اصلی
- `smart-heatmap.tsx` - نقشه حرارتی
- `territory-management.tsx` - مدیریت مناطق

**قابلیت‌ها:**
- نمایش موقعیت مشتریان و واحدها
- نقشه حرارتی تراکنش‌ها
- ترسیم مناطق جغرافیایی
- خوشه‌بندی خودکار

### 4.4 مانیتورینگ بلادرنگ (Real-time Monitoring)

**مسیر:** `/monitoring`

**کامپوننت:** `realtime-dashboard.tsx`

**ویژگی‌ها:**
- وضعیت لحظه‌ای دستگاه‌ها
- هشدارهای آنی قطعی
- نمودار زنده تراکنش‌ها
- WebSocket برای بروزرسانی

### 4.5 تحلیل و گزارش‌گیری (Analytics)

**مسیر:** `/strategic-analysis`

**کامپوننت‌ها:**
- `analytics-dashboard.tsx` - داشبورد تحلیلی
- `advanced-analytics.tsx` - تحلیل پیشرفته
- `ai-analytics.tsx` - تحلیل هوش مصنوعی
- `reports-dashboard.tsx` - گزارش‌گیری

### 4.6 هوش مصنوعی (AI Features)

**مسیر:** `/ai-features`

**کامپوننت‌ها:**
- `ai-forecasting.tsx` - پیش‌بینی فروش
- `ai-clustering.tsx` - خوشه‌بندی مشتریان
- `what-if-simulator.tsx` - شبیه‌ساز What-If

---

## 5. الگوریتم‌های هوش مصنوعی و یادگیری ماشین

### 5.1 پیش‌بینی فروش (Sales Forecasting)

**فایل:** `client/src/lib/ai-analytics.ts`

**الگوریتم: رگرسیون خطی با تحلیل فصلی**

```typescript
// مراحل الگوریتم:
1. گروه‌بندی تراکنش‌ها بر اساس ماه
2. محاسبه رگرسیون خطی (Least Squares)
3. تعیین روند (صعودی/نزولی/ثابت)
4. پیش‌بینی 6 ماه آینده
5. محاسبه ضریب اطمینان (R²)
```

**فرمول رگرسیون:**
```
y = mx + b

که:
m = (n∑xy - ∑x∑y) / (n∑x² - (∑x)²)
b = (∑y - m∑x) / n
R² = 1 - (SS_res / SS_tot)
```

**خروجی:**
- نرخ رشد ماه آینده (درصد)
- روند کلی (growing/stable/declining)
- ضریب اطمینان (0-1)
- پیش‌بینی 6 ماهه

### 5.2 خوشه‌بندی مشتریان (Customer Segmentation)

**الگوریتم: K-Means Clustering**

```typescript
// پارامترهای ورودی برای هر مشتری:
[monthlyProfit, accountAge, statusScore]

// مراحل:
1. نرمال‌سازی داده‌ها (Min-Max Scaling)
2. انتخاب مراکز اولیه (Deterministic)
3. تخصیص نقاط به نزدیک‌ترین مرکز
4. بروزرسانی مراکز
5. تکرار تا همگرایی
```

**فرمول فاصله اقلیدسی:**
```
d(p,c) = √(∑(pᵢ - cᵢ)²)
```

**خروجی بخش‌بندی:**
- مشتریان VIP (درآمد بالا)
- مشتریان متوسط
- مشتریان در حال رشد
- مشتریان پرخطر

### 5.3 پیش‌بینی ریزش مشتری (Churn Prediction)

**الگوریتم: امتیازدهی ریسک قطعی (Deterministic Risk Scoring)**

```typescript
// عوامل ریسک و وزن‌ها:
وضعیت غیرفعال: +0.40
کاهش فعالیت اخیر: +0.30
درآمد پایین: +0.20
مشتری جدید: +0.10
تراکنش‌های کم: +0.15

// آستانه ریسک بالا:
if (churnScore > 0.5) → مشتری پرخطر
```

**اقدامات پیشنهادی:**
- ریسک > 0.8: تماس فوری و تخفیف ویژه
- ریسک > 0.6: پیگیری نیازهای مشتری
- ریسک > 0.5: پیام تشویقی

### 5.4 بهینه‌سازی قیمت (Pricing Optimization)

**الگوریتم: تحلیل کشش قیمت (Price Elasticity Analysis)**

```typescript
// کشش قیمت بر اساس نوع کسب‌وکار:
رستوران: -0.8 (کم‌کشش - خدمات ضروری)
فروشگاه: -1.5 (پرکشش)
کافه: -1.0 (کشش واحد)

// فرمول قیمت بهینه:
optimalPriceIncrease = |1 / (elasticity + 1)|
recommendedIncrease = min(0.20, optimalPriceIncrease)
```

### 5.5 پیش‌بینی تقاضا (Demand Forecasting)

**الگوریتم: تحلیل فصلی با تقویم ایرانی**

```typescript
// ضرایب فصلی:
بهار (نوروز): 1.3 (افزایش 30%)
تابستان: 0.9 (کاهش 10%)
پاییز: 1.1 (افزایش 10%)
زمستان: 0.8 (کاهش 20%)

// تعدیل بر اساس نوع کسب‌وکار:
if (businessType === 'رستوران' && زمستان) {
  seasonalMultiplier *= 1.2; // افزایش اضافی
}
```

### 5.6 شبیه‌ساز What-If با TensorFlow.js

**فایل:** `client/src/lib/prediction-models.ts`

**معماری شبکه عصبی:**

```typescript
// مدل پیش‌بینی درآمد:
Layer 1: Dense(32 units, ReLU) + Dropout(0.2)
Layer 2: Dense(16 units, ReLU)
Layer 3: Dense(8 units, ReLU)
Output: Dense(1 unit, Linear)

// ویژگی‌های ورودی (8 فیچر):
[posCount, operatingHours, population, avgIncome,
 businessDensity, competitionLevel, internetQuality, transportAccess]
```

**سناریوهای قابل شبیه‌سازی:**
- افزودن دستگاه POS
- افزایش ساعات کاری
- افزایش کاربران
- افزودن شعبه جدید
- بهینه‌سازی مکان

---

## 6. تحلیل‌های جغرافیایی پیشرفته

### 6.1 سیستم شبکه‌بندی H3

**فایل:** `client/src/lib/geo-forecasting.ts`

**مفهوم:** H3 یک سیستم شبکه‌بندی شش‌ضلعی جهانی توسعه‌یافته توسط Uber است.

```typescript
// تبدیل مختصات به سلول H3:
const h3Index = latLngToCell(lat, lng, resolution);

// Resolution 9 = شش‌ضلعی‌های ~200 متری
// مزایا:
// - پوشش یکنواخت سطح زمین
// - همسایگی‌های منظم
// - تجمیع سلسله‌مراتبی
```

### 6.2 پیش‌بینی جغرافیایی (Geo-Forecasting)

**الگوریتم ترکیبی:**

```typescript
// مدل‌های رگرسیون:
1. رگرسیون خطی (Linear)
2. رگرسیون چندجمله‌ای (Polynomial, order=2)

// انتخاب بهترین مدل بر اساس R²
const bestModel = models.sort((a,b) => b.r2 - a.r2)[0];

// تأثیر همسایگان (Spillover Effect):
neighborInfluence = 0.15; // 15% تأثیر
adjustedPrediction = prediction * 0.85 + neighborAvg * 0.15;
```

**خروجی‌ها:**
- پیش‌بینی تراکنش هر سلول
- فاصله اطمینان 95%
- روند (surge/decline/stable)
- سطح ریسک

### 6.3 امتیاز سلامت جغرافیایی (Geo Health Score)

**فایل:** `client/src/lib/geo-health-score.ts`

**شاخص‌های ارزیابی:**

| شاخص | وزن | محاسبه |
|------|-----|--------|
| سلامت تراکنش | 30% | رشد (50%) + ثبات (30%) + ارزش (20%) |
| تنوع کسب‌وکار | 20% | تنوع اصناف (60%) + تراکم (40%) |
| زیرساخت | 20% | Uptime (50%) + شبکه (30%) + برق (20%) |
| پروفایل ریسک | 15% | تشخیص تقلب (70%) + رقابت (30%) |
| پتانسیل بازار | 15% | جمعیت (40%) + درآمد (35%) + تردد (25%) |

**فرمول امتیاز کلی:**
```
Score = Σ(categoryScore × weight)

وضعیت:
≥ 0.85: عالی (excellent)
≥ 0.70: خوب (good)
≥ 0.50: متوسط (fair)
≥ 0.30: ضعیف (poor)
< 0.30: بحرانی (critical)
```

### 6.4 تحلیل جریان O-D (Origin-Destination)

**فایل:** `client/src/lib/flow-analysis.ts`

**کاربرد:** تحلیل جریان تراکنش‌ها بین مبدأ و مقصد

**تجسم‌سازی:**
- نمودار Sankey برای جریان‌ها
- نقشه خطوط منحنی (Flow Maps)
- تحلیل شبکه Spider Web

---

## 7. سیستم مانیتورینگ بلادرنگ

### 7.1 معماری WebSocket

```typescript
// سمت سرور (server/routes.ts):
const wss = new WebSocketServer({ noServer: true });

// مدیریت اتصال‌ها:
wsClients.add(ws);

// ارسال بروزرسانی:
wsClients.forEach(client => {
  client.send(JSON.stringify(deviceStatus));
});
```

### 7.2 شبیه‌سازی وضعیت دستگاه‌ها

```typescript
// هر 30 ثانیه:
setInterval(() => {
  for (const device of devices) {
    // شبیه‌سازی تغییر وضعیت
    const statusChange = Math.random();
    if (statusChange < 0.05) {
      device.status = 'offline';
      // ایجاد هشدار
    }
  }
  // ارسال به کلاینت‌ها
  broadcast(deviceStatuses);
}, 30000);
```

### 7.3 سیستم هشدار

**انواع هشدار:**
- `error`: قطعی دستگاه
- `warning`: کاهش عملکرد
- `info`: اطلاع‌رسانی

**اولویت‌ها:**
- `high`: نیازمند اقدام فوری
- `medium`: بررسی در ساعات کاری
- `low`: اطلاع‌رسانی

---

## 8. APIها و سرویس‌های Backend

### 8.1 فهرست کامل Endpoints

#### مشتریان (Customers)
| متد | مسیر | توضیحات |
|-----|------|---------|
| GET | /api/customers | لیست تمام مشتریان |
| GET | /api/customers/:id | جزئیات یک مشتری |
| POST | /api/customers | ثبت مشتری جدید |
| PUT | /api/customers/:id | ویرایش مشتری |
| DELETE | /api/customers/:id | حذف مشتری |

#### دستگاه‌های POS
| متد | مسیر | توضیحات |
|-----|------|---------|
| GET | /api/pos-devices | لیست دستگاه‌ها |
| GET | /api/pos-devices/customer/:id | دستگاه‌های یک مشتری |
| GET | /api/pos-devices/banking-unit/:id | دستگاه‌های واحد بانکی |

#### واحدهای بانکی
| متد | مسیر | توضیحات |
|-----|------|---------|
| GET | /api/banking-units | لیست واحدها |
| POST | /api/banking-units | ثبت واحد جدید |
| POST | /api/banking-units/bulk-import | واردات دسته‌ای |
| PATCH | /api/banking-units/:id | ویرایش واحد |
| DELETE | /api/banking-units/:id | حذف واحد |

#### آمار و تحلیل
| متد | مسیر | توضیحات |
|-----|------|---------|
| GET | /api/stats | آمار کلی سیستم |
| GET | /api/monthly-stats | آمار ماهانه |
| GET | /api/monthly-stats/customer/:id | آمار یک مشتری |

#### مناطق (Territories)
| متد | مسیر | توضیحات |
|-----|------|---------|
| GET | /api/territories | لیست مناطق |
| POST | /api/territories | ایجاد منطقه |
| PATCH | /api/territories/:id | ویرایش منطقه |
| DELETE | /api/territories/:id | حذف منطقه |

#### تحلیل جغرافیایی
| متد | مسیر | توضیحات |
|-----|------|---------|
| GET | /api/geo-analysis | تحلیل جغرافیایی |
| GET | /api/geo-clusters | خوشه‌های جغرافیایی |
| GET | /api/heatmap-data | داده نقشه حرارتی |

### 8.2 اعتبارسنجی داده‌ها

**استفاده از Zod برای اعتبارسنجی:**

```typescript
const insertCustomerSchema = createInsertSchema(customers)
  .extend({
    shopName: z.string().min(2, "نام فروشگاه باید حداقل ۲ کاراکتر باشد"),
    phone: z.string().regex(/^09\d{9}$/, "شماره تلفن نامعتبر"),
    latitude: z.number().min(-90).max(90),
    longitude: z.number().min(-180).max(180),
  });
```

---

## 9. واسط کاربری و کامپوننت‌ها

### 9.1 ساختار صفحات

```
client/src/pages/
├── dashboard.tsx          # داشبورد اصلی
├── monitoring.tsx         # مانیتورینگ بلادرنگ
├── intelligent-map.tsx    # نقشه هوشمند
├── ai-features.tsx        # ویژگی‌های AI
├── strategic-analysis.tsx # تحلیل استراتژیک
├── region-manager.tsx     # مدیریت مناطق
├── bulk-import.tsx        # واردات دسته‌ای
├── backup-restore.tsx     # پشتیبان‌گیری
├── geo-spider-network.tsx # شبکه عنکبوتی
└── DesktopDownload.tsx    # دانلود نسخه دسکتاپ
```

### 9.2 کامپوننت‌های کلیدی

#### نقشه (Map Components)
- `pos-map.tsx`: نقشه اصلی با Leaflet
- `pos-map-fullscreen.tsx`: نسخه تمام‌صفحه
- `smart-heatmap.tsx`: نقشه حرارتی

#### نمودارها (Chart Components)
- `sankey-flow-chart.tsx`: نمودار Sankey
- `box-plot-chart.tsx`: نمودار Box Plot
- `bullet-chart.tsx`: نمودار Bullet
- `small-multiples-chart.tsx`: نمودارهای چندگانه

#### مدیریت داده (Data Management)
- `excel-management.tsx`: مدیریت Excel
- `banking-unit-excel-import-modal.tsx`: واردات Excel
- `location-picker-modal.tsx`: انتخاب موقعیت

### 9.3 سیستم تم (Theming)

**پشتیبانی از حالت تاریک/روشن:**

```typescript
// ThemeProvider با localStorage sync
const [theme, setTheme] = useState("light");

useEffect(() => {
  document.documentElement.classList.toggle("dark", theme === "dark");
  localStorage.setItem("theme", theme);
}, [theme]);
```

---

## 10. ویژگی‌های پیشرفته

### 10.1 سیستم گرافانا داخلی

**جداول مرتبط:**
- `dashboards`: داشبوردهای سفارشی
- `dataSources`: منابع داده
- `alertRules`: قوانین هشدار
- `reports`: گزارش‌های زمان‌بندی‌شده

**امکانات:**
- ساخت داشبورد سفارشی
- تعریف پنل‌های مختلف
- متغیرهای پویا
- گزارش‌گیری زمان‌بندی‌شده

### 10.2 تحلیل شبکه Spider Web

**جداول:**
- `networkNodes`: گره‌های شبکه
- `networkEdges`: یال‌های ارتباطی

**کاربرد:**
- تجسم روابط بین کسب‌وکارها
- تحلیل جریان درآمد
- شناسایی خوشه‌های تجاری

### 10.3 یادگیری ماشین پیشرفته

**جداول:**
- `mlModels`: مدل‌های ML ذخیره‌شده
- `mlPredictions`: پیش‌بینی‌های ثبت‌شده

**قابلیت‌ها:**
- مدل‌های تشخیص ناهنجاری
- پیش‌بینی سری‌های زمانی
- طبقه‌بندی مشتریان

---

## 11. امنیت و عملکرد

### 11.1 اعتبارسنجی و امنیت

**سطح API:**
- اعتبارسنجی ورودی با Zod
- محدودیت حجم درخواست
- محافظت از SQL Injection

**سطح داده:**
- رمزنگاری اطلاعات حساس
- UUID برای شناسه‌ها
- ثبت لاگ دسترسی

### 11.2 بهینه‌سازی عملکرد

**Frontend:**
- React Query برای کش
- Lazy Loading کامپوننت‌ها
- Virtual Scrolling برای لیست‌های بزرگ

**Backend:**
- Connection Pooling برای دیتابیس
- Indexed Queries
- Pagination در APIها

**Database:**
- ایندکس‌های بهینه
- JSONB برای داده‌های انعطاف‌پذیر
- Partial Indexes

---

## 12. راهنمای استقرار

### 12.1 نسخه وب (Replit)

```bash
# توسعه
npm run dev

# ساخت Production
npm run build

# اجرای Production
npm start
```

### 12.2 نسخه دسکتاپ (Electron)

```bash
# ساخت برای ویندوز
npm run electron:build:win

# خروجی
release/POS-Monitoring-1.0.2.exe
```

### 12.3 متغیرهای محیطی

| متغیر | توضیحات |
|-------|---------|
| DATABASE_URL | رشته اتصال PostgreSQL |
| NODE_ENV | محیط (development/production) |
| PGHOST | هاست دیتابیس |
| PGPORT | پورت دیتابیس |
| PGUSER | کاربر دیتابیس |
| PGPASSWORD | رمز دیتابیس |
| PGDATABASE | نام دیتابیس |

---

## پیوست‌ها

### پیوست A: معادله‌های ریاضی کلیدی

**1. فرمول Haversine (محاسبه فاصله جغرافیایی):**
```
a = sin²(Δlat/2) + cos(lat1)·cos(lat2)·sin²(Δlng/2)
c = 2·atan2(√a, √(1-a))
d = R·c (km)
```

**2. انحراف معیار:**
```
σ = √(Σ(xᵢ - μ)² / n)
```

**3. ضریب تعیین (R²):**
```
R² = 1 - (SS_res / SS_tot)
SS_res = Σ(yᵢ - ŷᵢ)²
SS_tot = Σ(yᵢ - ȳ)²
```

### پیوست B: کدهای وضعیت

**وضعیت مشتری:**
- `active`: فعال
- `normal`: عادی
- `marketing`: نیازمند بازاریابی
- `collected`: وصول‌شده
- `loss`: از دست رفته

**وضعیت دستگاه:**
- `active`: فعال و متصل
- `offline`: قطع ارتباط
- `maintenance`: در حال تعمیر

**نوع واحد بانکی:**
- `branch`: شعبه
- `counter`: باجه
- `shahrbnet_kiosk`: پیشخوان شهرنت

---

## نتیجه‌گیری

سامانه مانیتورینگ هوشمند POS یک راه‌حل جامع و یکپارچه برای مدیریت شبکه دستگاه‌های کارت‌خوان است. با استفاده از الگوریتم‌های پیشرفته یادگیری ماشین، تحلیل‌های جغرافیایی مبتنی بر H3، و معماری مدرن React/Node.js، این سیستم امکان تصمیم‌گیری هوشمند و مبتنی بر داده را برای مدیران فراهم می‌کند.

**نسخه:** 1.0.2  
**تاریخ مستندات:** دی ۱۴۰۴  
**نویسنده:** تیم توسعه POS Monitoring
