# سامانه مانیتورینگ هوشمند پایانه‌های فروشگاهی - نسخه دسکتاپ

## 📦 راهنمای نصب و استفاده

این سامانه به صورت یک برنامه دسکتاپ مستقل با پایگاه داده SQLite برای نصب روی کامپیوترهای ویندوز طراحی شده است.

---

## 🚀 نصب و راه‌اندازی

### استفاده از نسخه Portable (بدون نیاز به نصب)

1. **دانلود فایل**
   - فایل `سامانه-مانیتورینگ-POS-1.0.0-Portable.tar.gz` را دانلود کنید

2. **استخراج فایل‌ها**
   - از نرم‌افزار 7-Zip یا WinRAR برای استخراج استفاده کنید
   - فایل‌ها را در یک پوشه دلخواه استخراج کنید (مثلاً `C:\POS-Monitoring`)

3. **اجرای برنامه**
   - وارد پوشه `win-unpacked` شوید
   - فایل `electron.exe` را اجرا کنید
   - برنامه به صورت خودکار:
     - سرور backend را راه‌اندازی می‌کند (پورت 5000)
     - پایگاه داده SQLite را در مسیر `%APPDATA%/pos-system.db` ایجاد می‌کند
     - رابط کاربری را باز می‌کند

4. **میانبر Desktop** (اختیاری)
   - کلیک راست روی `electron.exe` → `Send to` → `Desktop (create shortcut)`

---

## 🗄️ پایگاه داده

### موقعیت پایگاه داده
```
C:\Users\[YourUsername]\AppData\Roaming\سامانه مانیتورینگ POS\pos-system.db
```

### ویژگی‌های پایگاه داده
- **نوع**: SQLite (بدون نیاز به نصب سرور جداگانه)
- **تعداد جداول**: 21 جدول شامل:
  - **Core**: Users, Branches, Employees, Customers, POS Devices, Transactions, Alerts
  - **Analytics**: POS Monthly Stats, Visits, Customer Access Logs, Banking Units
  - **Grafana Enterprise**: Organizations, Data Sources, Dashboards, Alert Rules, ML Models, Reports
  - **Network Analysis**: Network Nodes, Network Edges

### پشتیبان‌گیری (Backup)
از منوی برنامه می‌توانید:
- **Export Database**: کل پایگاه داده را به فرمت JSON صادر کنید
- **Import Database**: از یک backup قبلی بازیابی کنید

---

## 🔧 پیکربندی اولیه

### 1. ورود به سیستم
- **Username پیش‌فرض**: admin
- **Password پیش‌فرض**: admin123

⚠️ **هشدار امنیتی**: پس از اولین ورود، حتماً رمز عبور را تغییر دهید!

### 2. تنظیمات اولیه
1. **اطلاعات شعب**: از منوی "شعب" اطلاعات شعب خود را اضافه کنید
2. **کارمندان**: کارمندان سیستم را ثبت کنید
3. **مشتریان**: اطلاعات مشتریان را وارد کنید (می‌توانید از Excel Import استفاده کنید)
4. **دستگاه‌های POS**: دستگاه‌های فروشگاهی را به سیستم اضافه کنید

---

## 📊 امکانات سامانه

### 1. مانیتورینگ Real-time
- نمایش وضعیت لحظه‌ای دستگاه‌های POS
- هشدارهای خودکار برای خرابی دستگاه‌ها
- WebSocket برای به‌روزرسانی زنده

### 2. تحلیل و گزارش‌گیری
- **Dashboard تحلیلی**: نمودارها و آمار کلیدی
- **AI Analytics**: پیش‌بینی فروش، تحلیل مشتریان
- **Regional Analysis**: تحلیل پوشش جغرافیایی
  - مدیریت سرزمین (Territory Management)
  - تشخیص مناطق بکر (Virgin Region Detection)
  - ایجاد خودکار زون‌ها (Automatic Zone Creation)

### 3. نقشه جغرافیایی
- نمایش موقعیت شعب و مشتریان روی نقشه
- تحلیل محدوده پوشش
- مدیریت سرزمین با ابزارهای ترسیم

### 4. مدیریت مشتریان (CRM)
- پروفایل کامل مشتریان
- تاریخچه تراکنش‌ها
- آمار ماهانه POS
- لاگ بازدیدها

### 5. Grafana Enterprise (پیشرفته)
- **Organizations**: مدیریت سازمان‌های چندگانه
- **Data Sources**: اتصال به منابع داده مختلف
- **Dashboards**: داشبوردهای قابل تنظیم
- **Alert Rules**: قوانین هشدار پیشرفته
- **ML Models**: مدل‌های یادگیری ماشین
- **Reports**: گزارش‌های زمان‌بندی شده

### 6. Network Analysis
- تحلیل شبکه گراف
- نمایش روابط بین entities
- تحلیل connectivity و centrality

---

## 📁 ساختار پروژه

```
win-unpacked/
├── electron.exe          # فایل اصلی برنامه
├── resources/
│   └── server/
│       └── index.js      # Backend server (Express + WebSocket)
├── node_modules/
│   └── better-sqlite3/   # SQLite driver
└── ...                   # فایل‌های Electron
```

---

## 🔄 به‌روزرسانی

### نصب نسخه جدید
1. فایل portable جدید را دانلود کنید
2. پایگاه داده قدیمی را backup بگیرید (از منوی Export)
3. فایل‌های جدید را استخراج کنید
4. برنامه جدید را اجرا کنید (به صورت خودکار پایگاه داده قبلی را تشخیص می‌دهد)

⚠️ **نکته**: پایگاه داده در پوشه AppData ذخیره می‌شود و با تعویض برنامه پاک نمی‌شود.

---

## 🐛 عیب‌یابی

### مشکل: برنامه اجرا نمی‌شود
- **راه‌حل 1**: مطمئن شوید .NET Framework 4.5+ نصب است
- **راه‌حل 2**: به صورت Administrator اجرا کنید
- **راه‌حل 3**: Antivirus را موقتاً غیرفعال کنید

### مشکل: پورت 5000 در حال استفاده است
- **راه‌حل**: برنامه‌ای که پورت 5000 را اشغال کرده را ببندید
- یا از Task Manager پروسس مربوطه را kill کنید

### مشکل: پایگاه داده corrupt شده
- **راه‌حل 1**: از آخرین backup استفاده کنید (Import)
- **راه‌حل 2**: فایل `pos-system.db` را پاک کنید (سیستم یک DB جدید می‌سازد)

### مشکل: نقشه نمایش داده نمی‌شود
- **راه‌حل**: مطمئن شوید اتصال اینترنت فعال است (برای OpenStreetMap tiles)

---

## 🔐 امنیت

### توصیه‌های امنیتی
1. **رمز عبور**: رمز پیش‌فرض را حتماً تغییر دهید
2. **Backup منظم**: هر هفته از پایگاه داده backup بگیرید
3. **دسترسی**: دسترسی به پوشه AppData را محدود کنید
4. **Firewall**: اگر به شبکه متصل است، Firewall را تنظیم کنید

### پورت‌های استفاده شده
- **5000**: HTTP Server (localhost only)
- **WebSocket**: برای real-time monitoring (همان پورت 5000)

---

## 📞 پشتیبانی

### اطلاعات تماس
- **Email**: info@posmonitoring.ir
- **تیم توسعه**: POS Monitoring Team
- **نسخه**: 1.0.0

### منابع آموزشی
- راهنمای کامل کاربر: مراجعه به بخش Help در برنامه
- ویدیوهای آموزشی: [لینک]
- پرسش‌های متداول (FAQ): [لینک]

---

## 🆕 تاریخچه نسخه‌ها

### نسخه 1.0.0 (اکتبر 2025)
- ✅ راه‌اندازی اولیه نسخه Desktop
- ✅ پایگاه داده SQLite با 21 جدول
- ✅ Cross-database compatibility (PostgreSQL ↔ SQLite)
- ✅ Grafana Enterprise features
- ✅ Network Analysis tools
- ✅ Regional Analysis Dashboard
- ✅ Backup & Restore system
- ✅ Persian RTL support
- ✅ Real-time monitoring با WebSocket

---

## 📋 الزامات سیستم

### حداقل
- **OS**: Windows 7 SP1 یا بالاتر (64-bit)
- **RAM**: 2GB
- **فضای دیسک**: 500MB
- **پردازنده**: Intel Core i3 یا معادل
- **نمایشگر**: 1366x768

### پیشنهادی
- **OS**: Windows 10/11 (64-bit)
- **RAM**: 4GB یا بیشتر
- **فضای دیسک**: 1GB
- **پردازنده**: Intel Core i5 یا بالاتر
- **نمایشگر**: 1920x1080
- **اینترنت**: برای نقشه و به‌روزرسانی

---

## 🛠️ برای توسعه‌دهندگان

### ساخت Portable App در Replit

⚠️ **محدودیت**: در محیط Replit (Linux) امکان ساخت Windows installer (.exe) وجود ندارد، اما می‌توانید portable app بسازید:

```bash
# Build frontend & backend
npm run build

# Compile Electron TypeScript
npm run electron:compile

# Build unpacked app
electron-builder --win --x64 --dir

# Create portable archive manually
cd release
tar -czf "../POS-Monitoring-Portable.tar.gz" win-unpacked/
```

### ساخت Installer روی کامپیوتر ویندوزی

برای ساخت installer کامل (.exe):

1. **نصب Node.js** (18+) و **Git**
2. **کلون کردن پروژه**:
   ```bash
   git clone <repository-url>
   cd <project-folder>
   npm install
   ```

3. **ساخت installer**:
   ```bash
   npm run electron:build:win
   ```

4. **فایل installer** در:
   ```
   release/سامانه-مانیتورینگ-POS-1.0.0-win-x64.exe
   ```

---

## 🙏 تشکر

این سامانه با استفاده از تکنولوژی‌های زیر توسعه یافته است:
- **Electron**: برای برنامه Desktop
- **React**: رابط کاربری
- **Express**: Backend server
- **SQLite**: پایگاه داده
- **Leaflet**: نقشه‌های جغرافیایی
- **shadcn/ui**: کامپوننت‌های UI
- **Drizzle ORM**: مدیریت پایگاه داده

---

## 📄 مجوز

این نرم‌افزار تحت مجوز MIT منتشر شده است.

---

**موفق باشید! 🚀**
