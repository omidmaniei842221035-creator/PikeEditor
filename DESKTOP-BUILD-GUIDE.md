# راهنمای کامل ساخت نسخه Desktop

## ✅ نسخه نهایی - آماده برای نصب

این راهنما به شما کمک می‌کند یک نسخه **Desktop** کامل با دیتابیس SQLite داخلی بسازید که:
- بدون نیاز به PostgreSQL کار می‌کند
- کاملاً آفلاین است
- با یک کلیک اجرا می‌شود

---

## 📋 مراحل ساخت (در محیط Replit)

### مرحله 1: دانلود پروژه

1. در Replit روی منوی **⋮ (3 نقطه)** کلیک کنید
2. **"Download as ZIP"** را انتخاب کنید
3. فایل ZIP را دانلود و Extract کنید

---

## 🖥️ مراحل نصب (روی کامپیوتر Windows)

### پیش‌نیاز: نصب Node.js

اگر قبلاً Node.js ندارید:

1. به [nodejs.org](https://nodejs.org/) بروید
2. نسخه **LTS (18+)** را دانلود و نصب کنید
3. بررسی نصب:
   ```cmd
   node --version
   ```

### مرحله 1: رفتن به پوشه پروژه

```cmd
cd C:\مسیر\پروژه
```

### مرحله 2: نصب وابستگی‌ها

```cmd
npm install
```

⏱️ این مرحله ممکن است 5-10 دقیقه طول بکشد.

### مرحله 3: ساخت نسخه Desktop

```cmd
npm run build:desktop
```

این دستور:
- ✅ Frontend را build می‌کند
- ✅ Backend را bundle می‌کند
- ✅ فایل‌های لازم را کپی می‌کند
- ✅ فایل `Start-POS.bat` را می‌سازد

⏱️ این مرحله حدود 2-3 دقیقه طول می‌کشد.

### مرحله 4: اجرا

```cmd
cd dist-desktop
Start-POS.bat
```

یا روی فایل `Start-POS.bat` دابل کلیک کنید.

### مرحله 5: باز کردن مرورگر

مرورگر را باز کنید:

```
http://localhost:5000
```

**اطلاعات ورود:**
- نام کاربری: `admin`
- رمز عبور: `admin123`

---

## 📦 اشتراک‌گذاری با دیگران

می‌توانید پوشه `dist-desktop` را:

1. ZIP کنید
2. روی فلش یا Google Drive بگذارید
3. با دیگران به اشتراک بگذارید

**⚠️ نکته:** کامپیوتر مقصد باید Node.js داشته باشد.

---

## 📁 محتویات پوشه dist-desktop

```
dist-desktop/
├── server.js              # Backend bundle شده
├── public/                # Frontend build شده
├── package.json           # Dependencies
├── Start-POS.bat          # فایل اجرای Windows
├── start-pos.sh           # فایل اجرای Linux/Mac
└── README.md              # راهنمای استفاده
```

---

## 💾 مکان دیتابیس

دیتابیس SQLite در این مسیر ذخیره می‌شود:

**Windows:**
```
C:\Users\[نام شما]\AppData\Roaming\POS-System\pos-system.db
```

**Linux/Mac:**
```
~/.config/POS-System/pos-system.db
```

---

## 🎁 ویژگی‌های نسخه Desktop

- ✅ دیتابیس SQLite داخلی (بدون نیاز به PostgreSQL)
- ✅ کاملاً آفلاین
- ✅ اجرای ساده با یک کلیک
- ✅ قابل انتقال (کل پوشه dist-desktop)
- ✅ تمام امکانات نسخه Web
- ✅ 21 جدول دیتابیس (Base + Grafana + Network Analysis)
- ✅ 148 متد DatabaseStorage

---

## 🐛 حل مشکلات

### مشکل: npm install خطا می‌دهد

```cmd
npm cache clean --force
npm install --force
```

### مشکل: Port 5000 اشغال است

فایل `Start-POS.bat` را ویرایش کنید و قبل از `node server.js` اضافه کنید:

```batch
set PORT=8080
```

### مشکل: Cannot find module 'ws'

```cmd
cd dist-desktop
npm install
```

### مشکل: SQLite database error

دیتابیس خودکار ساخته می‌شود. اگر مشکل دارید:

```cmd
del %APPDATA%\POS-System\pos-system.db
```

سپس دوباره اجرا کنید.

---

## 🔧 تنظیمات پیشرفته

### تغییر پورت

فایل `Start-POS.bat` را ویرایش کنید:

```batch
set PORT=8080
```

### تغییر مسیر دیتابیس

فایل `Start-POS.bat` را ویرایش کنید:

```batch
set DATABASE_PATH=C:\MyCustomPath\pos.db
```

---

## 📊 مقایسه نسخه‌ها

| ویژگی | Web Version | Desktop Version |
|------|-------------|-----------------|
| دیتابیس | PostgreSQL | SQLite |
| نیاز به اینترنت | بله | خیر |
| نصب | Deploy | npm + bat |
| قابل انتقال | خیر | بله |
| همه امکانات | ✅ | ✅ |

---

## 🎉 موفق باشید!

حالا یک نسخه Desktop کامل با دیتابیس SQLite دارید که:
- بدون PostgreSQL کار می‌کند
- آفلاین است
- با یک کلیک اجرا می‌شود
- قابل انتقال است

---

## 📞 پشتیبانی

در صورت بروز مشکل:
1. فایل `راهنمای-نصب-ساده-نهایی.html` را در مرورگر باز کنید
2. README.md در پوشه dist-desktop را بخوانید
