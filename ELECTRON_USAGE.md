# راهنمای استفاده از نسخه Desktop (Electron)

## اجرای نسخه Desktop در حالت توسعه (Development)

برای تست نرم‌افزار Electron در حالت development:

```bash
npm run electron:dev
```

این دستور:
1. کد Electron را کامپایل می‌کند
2. دیتابیس SQLite محلی در `./dev-pos.db` ایجاد می‌کند  
3. نرم‌افزار desktop را با سرور داخلی اجرا می‌کند

## تفاوت‌های کلیدی بین نسخه Web و Desktop

### نسخه Web (Replit):
- دیتابیس: **PostgreSQL** (Neon)
- متغیر محیطی: `DATABASE_URL` (به صورت خودکار تنظیم می‌شود)
- اجرا: `npm run dev`
- مسیر: متصل به اینترنت

### نسخه Desktop (Electron):
- دیتابیس: **SQLite** (محلی)
- متغیر محیطی: `DATABASE_PATH=./dev-pos.db`
- اجرا: `npm run electron:dev`
- مسیر: ذخیره‌سازی محلی روی کامپیوتر کاربر

## ساخت نسخه قابل توزیع

برای ساخت نسخه نهایی نرم‌افزار، به فایل `BUILD_GUIDE.md` مراجعه کنید.

مراحل خلاصه:
```bash
npm install                  # نصب وابستگی‌ها
npm run build                # ساخت frontend و backend
npm run electron:compile     # کامپایل کد Electron
npm run electron:build:win   # ساخت برای Windows
```

## مسیر ذخیره‌سازی داده‌ها

داده‌های کاربران در فایل SQLite ذخیره می‌شوند:

**Windows:**
```
C:\Users\[نام کاربر]\AppData\Roaming\سامانه مانیتورینگ POS\pos-system.db
```

**macOS:**
```
~/Library/Application Support/سامانه مانیتورینگ POS/pos-system.db
```

**Linux:**
```
~/.config/سامانه مانیتورینگ POS/pos-system.db
```

## مهاجرت از Web به Desktop

برای انتقال داده‌ها از نسخه وب به desktop:

1. داده‌ها را از PostgreSQL Export کنید (به فرمت JSON یا CSV)
2. داده‌ها را در نسخه desktop Import کنید
3. یا از ابزارهای migration استفاده کنید

## نکات مهم

✅ **انجام دهید:**
- قبل از توزیع، آیکون‌های واقعی را جایگزین فایل‌های placeholder کنید
- نرم‌افزار را روی سیستم‌های مختلف تست کنید
- از Code Signing برای امنیت بیشتر استفاده کنید

⚠️ **نکنید:**
- فایل `pos-system.db` را مستقیماً ویرایش نکنید (از رابط نرم‌افزار استفاده کنید)
- DATABASE_URL و DATABASE_PATH را همزمان تنظیم نکنید

## رفع مشکلات

### دیتابیس خالی است یا seed نمی‌شود
```bash
# حذف دیتابیس قدیمی و ساخت دوباره
rm ./dev-pos.db
npm run electron:dev
```

### خطای "Module not found"
```bash
# نصب مجدد وابستگی‌ها
npm install
npm rebuild better-sqlite3
npm run electron:dev
```

### نرم‌افزار باز نمی‌شود
1. از Antivirus/Firewall مطمئن شوید که نرم‌افزار را block نکرده
2. لاگ‌های Console را بررسی کنید
3. نرم‌افزار را به عنوان Administrator اجرا کنید

---

**نسخه:** 1.0.0  
**تاریخ:** {{ current_date }}
