# 📋 راهنمای نصب کامل - ویندوز

## ⚠️ مشکل فایل‌های قبلی
فایل‌هایی که قبلاً دانلود کردید نیاز به نصب Node.js و dependency ها داشتند که پیچیده است.

---

## ✅ راه‌حل نهایی: دانلود Source Code کامل

### گام 1️⃣: نصب Node.js

1. به سایت [nodejs.org](https://nodejs.org/) بروید
2. نسخه **LTS (18 یا بالاتر)** را دانلود کنید
3. نصب کنید (Next > Next > Install)
4. برای تست، Command Prompt را باز کنید و بزنید:
   ```
   node --version
   ```
   باید نسخه را نشان دهد (مثلاً `v18.17.0`)

---

### گام 2️⃣: دانلود کد کامل پروژه

**روش A: دانلود ZIP از Replit**

1. در Replit، روی منوی 3 نقطه بزنید
2. **Download as ZIP** را انتخاب کنید
3. فایل ZIP را Extract کنید

**روش B: Clone از Git (اگر Git دارید)**

```bash
git clone [YOUR_REPLIT_GIT_URL]
```

---

### گام 3️⃣: نصب و اجرا

Command Prompt را در پوشه پروژه باز کنید و:

```bash
# نصب کتابخانه‌ها
npm install

# ساخت پروژه
npm run build

# اجرا
node dist/index.js
```

مرورگر را باز کنید: **http://localhost:5000**

---

### گام 4️⃣: اطلاعات ورود

- **نام کاربری:** admin
- **رمز عبور:** admin123

⚠️ حتماً بعد از ورود رمز را تغییر دهید!

---

## 🗄️ پایگاه داده

سیستم به صورت خودکار یک فایل SQLite می‌سازد در:
```
C:\Users\[YourName]\AppData\Roaming\POS-System\pos-system.db
```

---

## 🔥 حل مشکلات احتمالی

### مشکل: `npm install` خطا می‌دهد

**علت:** بعضی package ها مثل `better-sqlite3` نیاز به build tool دارند.

**راه‌حل:**

1. نصب **Windows Build Tools**:
   ```bash
   npm install --global windows-build-tools
   ```

2. یا نصب **Visual Studio Build Tools** از [visualstudio.microsoft.com](https://visualstudio.microsoft.com/downloads/)
   - فقط **Desktop development with C++** را انتخاب کنید

3. سپس دوباره:
   ```bash
   npm install
   ```

---

### مشکل: Port 5000 اشغال است

```bash
# استفاده از پورت دیگر
set PORT=8080
node dist/index.js
```

---

### مشکل: Python خطا می‌دهد

بعضی package ها نیاز به Python دارند:

1. Python 3 نصب کنید از [python.org](https://python.org)
2. در Command Prompt:
   ```bash
   npm config set python "C:\Python3\python.exe"
   npm install
   ```

---

## 🚀 اجرای خودکار (Startup)

برای اینکه سیستم هر بار با Windows اجرا شود:

1. فایل `start-pos.bat` بسازید:
   ```batch
   @echo off
   cd C:\path\to\project
   node dist\index.js
   ```

2. این فایل را در پوشه Startup قرار دهید:
   ```
   C:\Users\[YourName]\AppData\Roaming\Microsoft\Windows\Start Menu\Programs\Startup
   ```

---

## 📞 پشتیبانی

اگر باز هم مشکل داشتید:

1. ✅ مطمئن شوید Node.js نصب شده: `node --version`
2. ✅ پوشه پروژه را در Command Prompt باز کنید
3. ✅ دستورات را دقیقاً اجرا کنید
4. ✅ خطاهای دقیق را یادداشت کنید

---

**موفق باشید! 🎉**
