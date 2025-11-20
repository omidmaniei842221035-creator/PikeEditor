# 🎯 ساخت نسخه Portable که واقعاً کار می‌کند

## ⚠️ چرا نسخه Replit کار نمی‌کند؟

**مشکل اصلی:** فایل‌های native module (مثل `better-sqlite3.node`) برای **Linux** compile شده‌اند، نه Windows!

وقتی روی Windows اجرا می‌کنید:
```
❌ Error: not a valid Win32 application
❌ صفحه سفید یا crash
```

---

## ✅ راه حل قطعی: Build در Windows

### مرحله 1: دانلود پروژه در Windows

```bash
# PowerShell در ویندوز
cd Desktop
git clone <repo-url>
cd pos-monitoring
```

یا دانلود ZIP از Replit و استخراج

---

### مرحله 2: نصب Node.js

از سایت https://nodejs.org نسخه LTS را دانلود و نصب کنید

---

### مرحله 3: نصب Dependencies

```bash
npm install
```

این دستور **`better-sqlite3` را برای Windows compile می‌کند** ✅

---

### مرحله 4: ساخت نسخه Portable

```bash
npm run electron:build:win -- --target portable
```

یا برای NSIS installer:
```bash
npm run electron:build:win
```

---

### مرحله 5: خروجی

**نسخه Portable:**
```
release/سامانه مانیتورینگ POS-1.0.0-portable.exe (200-300MB)
```

این یک **فایل EXE واحد** است که:
✅ بدون نیاز به نصب اجرا می‌شود
✅ همه چیز داخلش bundle شده
✅ روی هر ویندوز 10/11 کار می‌کند
✅ فقط دوبار کلیک → برنامه اجرا می‌شود

**NSIS Installer:**
```
release/سامانه مانیتورینگ POS-Setup-1.0.0.exe
```

---

## 🔧 تنظیمات برای Portable

در فایل `package.json` این تنظیمات وجود دارد:

```json
{
  "build": {
    "portable": {
      "artifactName": "${productName}-${version}-portable.exe"
    }
  }
}
```

---

## 📊 تفاوت Build در Windows vs Linux

| آیتم | Build در Replit (Linux) | Build در Windows |
|------|-------------------------|-------------------|
| better-sqlite3.node | ❌ Linux binary | ✅ Windows binary |
| اجرا در Windows | ❌ Crash | ✅ کار می‌کند |
| نیاز به rebuild | ⚠️ غیرممکن | ✅ خودکار |

---

## 💡 نکات مهم

### 1. چرا cross-compile کار نمی‌کند؟
Native modules مثل `better-sqlite3` از کد C++ استفاده می‌کنند که باید با compiler مناسب (MSVC در Windows) compile شوند.

### 2. آیا می‌توان از pre-built binaries استفاده کرد؟
خیر، چون electron-builder نیاز دارد module ها برای **Electron runtime** rebuild شوند، نه Node.js معمولی.

### 3. آیا Docker کمک می‌کند؟
خیر، حتی با Docker هم نمی‌توان Windows native modules را در Linux build کرد.

---

## 🚀 خلاصه دستورات

```bash
# در ویندوز:
npm install                                    # rebuild native modules
npm run electron:build:win -- --target portable  # ساخت portable exe
```

**خروجی:** یک فایل EXE که مثل VLC، Firefox Portable و ... کار می‌کند!

---

## 📞 اگر دسترسی به Windows ندارید

### گزینه 1: استفاده از Windows VM
- VMware Workstation
- VirtualBox
- Windows Sandbox

### گزینه 2: استفاده از CI/CD
- GitHub Actions (Windows runner)
- AppVeyor
- Azure Pipelines

### گزینه 3: استفاده از نسخه Web
برنامه را به صورت Web deploy کنید (PostgreSQL):
```bash
npm run build
# Deploy to Replit, Vercel, etc.
```

---

**متاسفانه هیچ راهی برای ساخت portable exe در Linux/Replit وجود ندارد.** 😔

باید حتماً روی **Windows** build شود! 🪟
