# 🔨 ساخت نسخه Desktop روی Windows

## ⚠️ چرا باید خودتان Build کنید؟

به دلیل محدودیت‌های فنی (native dependencies مثل better-sqlite3)، نمی‌توان روی Linux برای Windows build کرد.
**شما باید روی کامپیوتر Windows خودتان build کنید.**

---

## 📋 پیش‌نیازها (یکبار نصب کنید)

### 1️⃣ نصب Node.js

1. به [nodejs.org](https://nodejs.org/) بروید
2. نسخه **LTS** (18 یا بالاتر) را دانلود و نصب کنید
3. تست کنید:
   ```cmd
   node --version
   npm --version
   ```

### 2️⃣ نصب Python

1. به [python.org](https://www.python.org/downloads/) بروید
2. Python 3.8+ دانلود و نصب کنید
3. در نصب، حتماً گزینه **"Add Python to PATH"** را فعال کنید

### 3️⃣ نصب Windows Build Tools

Command Prompt را **به عنوان Administrator** باز کنید و اجرا کنید:

```cmd
npm install --global windows-build-tools
```

این چند دقیقه طول می‌کشد. صبر کنید تا تمام شود.

---

## 📥 دانلود پروژه

### روش 1: دانلود ZIP از Replit

1. در صفحه Replit این پروژه، روی منوی **⋮** (3 نقطه) کلیک کنید
2. **"Download as ZIP"** را انتخاب کنید
3. فایل ZIP را در یک پوشه Extract کنید (مثلاً `C:\POS-System`)

### روش 2: دانلود از Git (اگر Git دارید)

```cmd
git clone [آدرس پروژه]
cd POS-System
```

---

## 🔧 Build کردن پروژه

Command Prompt را در پوشه پروژه باز کنید و دستورات زیر را **به ترتیب** اجرا کنید:

### گام 1: نصب Dependencies

```cmd
npm install
```

اگر خطا گرفتید، این دستور را امتحان کنید:

```cmd
npm install --force
```

### گام 2: Build کردن پروژه

```cmd
npm run build
```

### گام 3: تست کردن

```cmd
node dist/index.js
```

مرورگر را باز کنید: **http://localhost:5000**

اگر کار کرد، به گام بعد بروید!

---

## 📦 ساخت Standalone Package

حالا یک پکیج مستقل می‌سازیم که روی هر کامپیوتر Windows اجرا شود.

### گام 1: ایجاد پوشه نهایی

```cmd
mkdir POS-Desktop
xcopy dist POS-Desktop\dist /E /I
xcopy package.json POS-Desktop\
xcopy README-STANDALONE.md POS-Desktop\README.md /Y
```

### گام 2: ساخت فایل Startup

یک فایل به نام `Start-POS.bat` در پوشه `POS-Desktop` بسازید:

```batch
@echo off
echo 🚀 Starting POS Monitoring System...
echo.

REM Check if Node.js is installed
where node >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo ❌ Node.js is not installed!
    echo Please install Node.js from https://nodejs.org
    pause
    exit /b 1
)

REM Start the server
echo ✅ Node.js found. Starting server...
echo.
node dist\index.js

pause
```

### گام 3: آماده برای توزیع

حالا پوشه `POS-Desktop` را:
- ZIP کنید (با WinRAR یا 7-Zip)
- یا روی فلش کپی کنید
- یا با سایر کامپیوترها به اشتراک بگذارید

---

## 🚀 استفاده روی کامپیوتر دیگر

روی هر کامپیوتر Windows که Node.js نصب است:

1. پوشه `POS-Desktop` را کپی کنید
2. `Start-POS.bat` را اجرا کنید
3. مرورگر را باز کنید: **http://localhost:5000**

---

## 🔐 اطلاعات ورود

- **نام کاربری:** admin
- **رمز عبور:** admin123

⚠️ حتماً پس از ورود رمز را تغییر دهید!

---

## 🗄️ مکان دیتابیس

دیتابیس SQLite در این مسیر ذخیره می‌شود:

```
C:\Users\[نام شما]\AppData\Roaming\POS-System\pos-system.db
```

---

## 🐛 حل مشکلات

### مشکل 1: npm install خطا می‌دهد

**راه‌حل:**
```cmd
npm cache clean --force
npm install --force
```

### مشکل 2: Python خطا می‌دهد

**راه‌حل:**
1. Python نصب کنید
2. این دستور را اجرا کنید:
```cmd
npm config set python "C:\Python3\python.exe"
```

### مشکل 3: node-gyp خطا می‌دهد

**راه‌حل:**
```cmd
npm install --global node-gyp
npm install
```

### مشکل 4: Port 5000 اشغال است

**راه‌حل:**
```cmd
set PORT=8080
node dist\index.js
```

---

## 🎯 نکات مهم

✅ این build **فقط روی Windows** کار می‌کند  
✅ کامپیوتر هدف **حتماً باید Node.js داشته باشد**  
✅ برای استفاده کاملاً آفلاین، Node.js را قبلاً نصب کنید  
✅ دیتابیس به صورت خودکار ساخته می‌شود  

---

## 📞 پشتیبانی

اگر در هر مرحله مشکل داشتید:
1. خطای دقیق را یادداشت کنید
2. نسخه Node.js را چک کنید: `node --version`
3. مطمئن شوید Command Prompt در پوشه درست باز شده

---

**موفق باشید! 🎉**
