# ⚠️ راهنمای مهم نصب نسخه دسکتاپ

## مشکل اصلی

فایل‌های Electron که در Replit (Linux) ساخته می‌شوند، **dependency های native** مثل `better-sqlite3` را برای **Linux** دارند، نه Windows.

به همین دلیل وقتی فایل را در Windows اجرا می‌کنید:
- ❌ electron.exe اجرا می‌شود اما پنجره باز نمی‌شود
- ❌ SQLite database کار نمی‌کند (چون better-sqlite3.node برای Windows نیست)
- ❌ هیچ خطایی نمایش داده نمی‌شود

---

## ✅ راه‌حل‌های موجود

### راه‌حل 1: ساخت روی Windows (توصیه می‌شود)

این تنها راه برای داشتن نسخه دسکتاپ کاملاً کاربردی است:

1. **دانلود کد پروژه**:
   ```bash
   # از Replit یا GitHub کد را دانلود کنید
   git clone <repository-url>
   cd <project-folder>
   ```

2. **نصب Node.js** (نسخه 18 یا بالاتر) از [nodejs.org](https://nodejs.org/)

3. **نصب Dependencies**:
   ```bash
   npm install
   ```

4. **ساخت نسخه Windows**:
   ```bash
   npm run electron:build:win
   ```

5. **فایل نصبی** در:
   ```
   release/سامانه-مانیتورینگ-POS-1.0.0-win-x64.exe
   ```

---

### راه‌حل 2: استفاده از نسخه Web با PostgreSQL

به جای نسخه دسکتاپ، می‌توانید از نسخه Web استفاده کنید:

1. **راه‌اندازی سرور در Windows**:
   ```bash
   # نصب dependencies
   npm install
   
   # تنظیم DATABASE_URL برای PostgreSQL
   set DATABASE_URL=postgresql://user:pass@host:5432/dbname
   
   # اجرای سرور
   npm run build
   npm start
   ```

2. **دسترسی**: مرورگر را باز کرده و به `http://localhost:5000` بروید

---

### راه‌حل 3: Electron با PostgreSQL (بدون SQLite)

می‌توانید electron را طوری تنظیم کنید که از PostgreSQL استفاده کند:

1. یک PostgreSQL local نصب کنید (مثل PostgreSQL 15)
2. DATABASE_URL را تنظیم کنید
3. electron.exe را اجرا کنید

---

## 🔍 چرا در Replit کار نمی‌کند؟

| مورد | Replit (Linux) | Windows |
|------|---------------|---------|
| OS | Linux | Windows |
| better-sqlite3 | `.node` compiled for Linux | نیاز به `.node` برای Windows |
| electron-builder | می‌تواند فقط electron.exe بسازد | نیاز به Windows برای native deps |

---

## 📋 خلاصه

**فایل‌های فعلی که دانلود می‌کنید:**
- ✅ electron.exe کار می‌کند
- ❌ اما better-sqlite3 برای Windows compiled نیست
- ❌ در نتیجه database کار نمی‌کند
- ❌ و app هیچ پنجره‌ای باز نمی‌کند

**بهترین راه‌حل:**
1. کد پروژه را در Windows دانلود کنید
2. `npm install` و `npm run electron:build:win` را اجرا کنید
3. فایل installer واقعی را دریافت کنید

---

## 🛠️ Debug در Windows

اگر می‌خواهید ببینید چه خطایی می‌دهد:

1. فایل `run-debug.bat` بسازید:
   ```batch
   @echo off
   echo Starting Electron App...
   cd win-unpacked
   electron.exe
   pause
   ```

2. اجرا کنید - خطاها را در console می‌بینید

---

## 💡 پیشنهاد

بهترین کار این است که:
1. از **نسخه Web** استفاده کنید (با PostgreSQL یا حتی SQLite local)
2. یا پروژه را در **Windows بسازید** تا native dependencies درست compiled شوند

---

**متأسفانه محدودیت‌های Replit/Linux اجازه نمی‌دهند portable Windows app کاملی بسازیم که SQLite داشته باشد.** 😔
