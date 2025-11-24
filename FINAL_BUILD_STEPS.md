# 🚀 دستورات نهایی برای Build نسخه Windows

## ⚠️ خطای قبلی که برطرف شد:

```
ReferenceError: exports is not defined in ES module scope
```

**علت:** Electron کد CommonJS داشت ولی package.json می‌گفت "type": "module"  
**راه‌حل:** تبدیل `main.js` و `preload.js` به `.cjs` (CommonJS explicit)

---

## 📋 دستورات Build (نسخه نهایی - اصلاح شده)

### گام 0: بررسی نسخه Node.js
```bash
node --version
# باید v18 یا بالاتر باشد
```

### گام 1: پاکسازی کامل
```bash
# حذف فایل‌های قدیمی
Remove-Item -Recurse -Force node_modules, dist, dist-electron, release -ErrorAction SilentlyContinue

# یا در Linux/Mac:
rm -rf node_modules dist dist-electron release
```

### گام 2: نصب Dependencies
```bash
npm install
```

**خروجی مورد انتظار:**
```
added XXX packages in XXs
```

### گام 3: Rebuild Native Modules (مهم!)
```bash
npm rebuild better-sqlite3 --update-binary
```

**خروجی مورد انتظار:**
```
> better-sqlite3@X.X.X install
> prebuild-install || node-gyp rebuild
prebuild-install info begin Attempting to download prebuilt binary
prebuild-install info successfully downloaded prebuilt binary
```

### گام 4: Build پروژه کامل
```bash
npm run build
```

**زمان تقریبی:** 1-2 دقیقه  
**خروجی مورد انتظار:**
```
vite v5.x.x building for production...
✓ XXX modules transformed.
dist/index.html                X.XX kB
dist/assets/index-XXXXX.js    XXX.XX kB
✓ built in XXXms

server/index.ts  XXX.XX kB
⚡ Done in XXXms
```

### گام 5: Compile Electron + Rename به .cjs
```bash
npm run electron:compile
```

**خروجی مورد انتظار:**
```
> tsc -p electron/tsconfig.json && node -e "..."
(بدون خطا)
```

### گام 6: بررسی فایل‌های Compile شده
```bash
ls dist-electron/
```

**باید این فایل‌ها را ببینید:**
```
logger.cjs
logger.d.ts
main.cjs
main.d.ts
preload.cjs
preload.d.ts
```

**نکته مهم:** اگر فقط `.js` دیدید (نه `.cjs`)، دستور قبلی را دوباره اجرا کنید.

### گام 7: ساخت Windows Installer
```bash
npm run electron:build:win
```

**زمان تقریبی:** 3-5 دقیقه

**خروجی مورد انتظار:**
```
• electron-builder  version=XX.X.XX
• loaded configuration  file=package.json
• packaging  platform=win32 arch=x64 electron=XX.X.X
• building  target=nsis file=release\سامانه مانیتورینگ POS-Setup-1.0.0.exe
• building block map  blockMapFile=release\...
```

### گام 8: بررسی فایل خروجی
```bash
ls -lh release/
```

**باید این فایل را ببینید:**
```
سامانه مانیتورینگ POS-Setup-1.0.0.exe  (حدود 200-250 MB)
```

---

## 🧪 تست نهایی

### 1. نصب برنامه
```bash
# اجرای installer
./release/سامانه\ مانیتورینگ\ POS-Setup-1.0.0.exe
```

مراحل نصب:
1. انتخاب زبان (فارسی)
2. قبول License
3. انتخاب مسیر نصب
4. نصب
5. اجرای خودکار (گزینه "Run" تیک باشد)

### 2. بررسی اجرای برنامه
- **انتظار:** 5-10 ثانیه صبر کنید تا server راه‌اندازی شود
- **نتیجه مطلوب:** داشبورد اصلی با نمودارها و نقشه نمایش داده شود
- **اگر صفحه سفید بود:** 10 ثانیه دیگر صبر کنید

### 3. بررسی Database
فایل SQLite باید ایجاد شده باشد:
```
C:\Users\[نام کاربری]\AppData\Roaming\سامانه مانیتورینگ POS\pos-system.db
```

با این دستور بررسی کنید:
```bash
explorer "%APPDATA%\سامانه مانیتورینگ POS"
```

### 4. بررسی Log Files (در صورت خطا)
```bash
explorer "%APPDATA%\سامانه مانیتورینگ POS\logs"
```

آخرین فایل `.log` را باز کنید و خطاها را بررسی کنید.

---

## ❌ مشکلات رایج

### خطا 1: "exports is not defined"
**علت:** نسخه قدیمی است که main.js بود  
**راه‌حل:** گام‌های 5 و 6 را دوباره اجرا کنید

### خطا 2: "better-sqlite3.node is not a valid Win32 application"
**علت:** Build روی Linux/Mac انجام شده  
**راه‌حل:** حتماً روی Windows build کنید

### خطا 3: صفحه سفید
**علت:** Server هنوز آماده نشده  
**راه‌حل:** 10 ثانیه صبر کنید یا log را چک کنید

### خطا 4: "Module not found"
**علت:** npm install کامل نشده  
**راه‌حل:**
```bash
Remove-Item -Recurse -Force node_modules
npm install
npm rebuild better-sqlite3 --update-binary
```

---

## 📊 چک‌لیست نهایی

قبل از توزیع برنامه:

- [ ] `npm install` بدون خطا
- [ ] `npm rebuild better-sqlite3` موفق
- [ ] `npm run build` بدون خطا
- [ ] `npm run electron:compile` فایل‌های `.cjs` ایجاد کرد
- [ ] `ls dist-electron/` نشان می‌دهد: `main.cjs`, `preload.cjs`, `logger.cjs`
- [ ] `npm run electron:build:win` فایل `.exe` ایجاد کرد
- [ ] Installer اجرا می‌شود و برنامه نصب می‌شود
- [ ] برنامه بدون خطا باز می‌شود
- [ ] داشبورد اصلی نمایش داده می‌شود
- [ ] Database در AppData ایجاد می‌شود
- [ ] تمام صفحات کار می‌کنند

---

## 🎯 نکات بسیار مهم

### 1. حتماً روی Windows Build کنید
```
❌ Linux → Windows: کار نمی‌کند (native modules)
❌ Mac → Windows: کار نمی‌کند (native modules)
✅ Windows → Windows: کار می‌کند
```

### 2. فایل‌های .cjs ضروری هستند
```javascript
// ❌ اشتباه
"main": "dist-electron/main.js"

// ✅ درست
"main": "dist-electron/main.cjs"
```

### 3. SQLite باید Rebuild شود
```bash
# این دستور را فراموش نکنید!
npm rebuild better-sqlite3 --update-binary
```

### 4. صبر کنید تا Server آماده شود
- Server initialization: **5 ثانیه**
- Database seeding: **2-3 ثانیه**
- Frontend loading: **1-2 ثانیه**
- **جمع کل: 8-10 ثانیه**

---

## 📞 در صورت مشکل

اگر باز هم خطا داشتید:

1. فایل log را باز کنید:
   ```
   %APPDATA%\سامانه مانیتورینگ POS\logs\electron-XXXX.log
   ```

2. محتوای کامل آن را برای من بفرستید

3. اطلاعات زیر را نیز بفرستید:
   - نسخه Windows (10 یا 11)
   - نسخه Node.js (`node --version`)
   - خروجی دستور `ls dist-electron/`

---

## ✅ موفقیت!

اگر تمام گام‌ها را انجام دادید و برنامه بدون خطا اجرا شد:

🎉 **تبریک! نسخه Windows شما آماده است!**

شما می‌توانید فایل `سامانه مانیتورینگ POS-Setup-1.0.0.exe` را توزیع کنید.

---

**نسخه:** 1.0.0 (Final)  
**تاریخ:** نوامبر 2025  
**وضعیت:** آماده برای Production ✅
