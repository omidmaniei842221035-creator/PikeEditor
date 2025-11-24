# راهنمای آپلود پروژه به GitHub

## 🎯 مشکل فعلی

Replit اجازه تغییر مستقیم `.git` را نمی‌دهد و GitHub نیاز به token دارد.

---

## ✅ راه حل 1: استفاده از Replit Git UI (توصیه می‌شود)

### مرحله 1: باز کردن Git Panel
1. در Replit، سمت چپ آیکن **Git** را کلیک کنید
2. یا `Ctrl+Shift+G` بزنید

### مرحله 2: Initialize Repository
اگر پیغام "Initialize Git Repository" دیدید:
- روی آن کلیک کنید

### مرحله 3: Commit فایل‌ها
1. تمام فایل‌های تغییر یافته را انتخاب کنید
2. Commit message: `Initial commit - POS Monitoring System`
3. روی **Commit** کلیک کنید

### مرحله 4: Add Remote
1. روی آیکن **⋮** (سه نقطه) کلیک کنید
2. **Add Remote** را انتخاب کنید
3. Remote name: `origin`
4. Remote URL:
   ```
   https://github.com/omidmaniei842221035-creator/pos-monitoring.git
   ```

### مرحله 5: Push
1. روی **Push** کلیک کنید
2. اگر از شما GitHub authentication خواست، به مرحله بعد بروید

---

## 🔐 راه حل 2: ساخت GitHub Token

### مرحله 1: ساخت Token

1. **برو به:**
   ```
   https://github.com/settings/tokens
   ```

2. **کلیک روی:**
   - `Generate new token` → `Generate new token (classic)`

3. **تنظیمات:**
   - **Note:** `Replit POS Monitoring`
   - **Expiration:** `90 days`
   - **Select scopes:**
     - ✅ `repo` (همه sub-items)
     - ✅ `workflow`

4. **کلیک روی:**
   - `Generate token`

5. **کپی کردن Token:**
   - Token فقط یک بار نشان داده می‌شود!
   - فرمت: `ghp_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx`
   - آن را یک جای امن ذخیره کنید

### مرحله 2: استفاده از Token

#### روش A: Clone جدید با Token

```bash
git clone https://YOUR_TOKEN@github.com/omidmaniei842221035-creator/pos-monitoring.git
```

#### روش B: تغییر Remote فعلی

```bash
# حذف remote فعلی
git remote remove origin

# اضافه کردن remote جدید با token
git remote add origin https://YOUR_TOKEN@github.com/omidmaniei842221035-creator/pos-monitoring.git

# تست
git remote -v
```

جایگزین کنید `YOUR_TOKEN` با token واقعی.

**مثال:**
```bash
git remote add origin https://ghp_abc123xyz789@github.com/omidmaniei842221035-creator/pos-monitoring.git
```

---

## 📤 راه حل 3: Push دستی با Token

بعد از اضافه کردن remote با token:

```bash
# 1. Add تمام فایل‌ها
git add .

# 2. Commit
git commit -m "Initial commit - POS Monitoring System"

# 3. Push
git push -u origin main
```

اگر branch شما `master` است نه `main`:
```bash
git push -u origin master
```

---

## 🔍 بررسی وضعیت

### چک کردن Remote:
```bash
git remote -v
```

**خروجی مورد انتظار:**
```
origin  https://ghp_xxx@github.com/omidmaniei842221035-creator/pos-monitoring.git (fetch)
origin  https://ghp_xxx@github.com/omidmaniei842221035-creator/pos-monitoring.git (push)
```

### چک کردن Branch:
```bash
git branch
```

### چک کردن Status:
```bash
git status
```

---

## 📋 دستورات کامل (کپی-پیست)

```bash
# 1. حذف remote قدیمی (اگر وجود دارد)
git remote remove origin 2>/dev/null || true

# 2. اضافه کردن remote جدید (جایگزین TOKEN کنید)
git remote add origin https://YOUR_GITHUB_TOKEN@github.com/omidmaniei842221035-creator/pos-monitoring.git

# 3. Add همه فایل‌ها
git add .

# 4. Commit
git commit -m "Initial commit: POS Monitoring System with Desktop & Web versions"

# 5. Push
git push -u origin main
```

---

## ⚠️ نکات امنیتی

### 1. محافظت از Token:
- ❌ Token را در کد commit نکنید
- ❌ Token را share نکنید
- ✅ Token را در جای امن نگه دارید

### 2. اگر Token لو رفت:
1. برو به: https://github.com/settings/tokens
2. Token را **Revoke** کن
3. یک token جدید بساز

### 3. استفاده از SSH (جایگزین):
اگر نمی‌خواهید از token استفاده کنید، از SSH key استفاده کنید:
```
https://docs.github.com/en/authentication/connecting-to-github-with-ssh
```

---

## ✅ تأیید موفقیت

بعد از push موفق، چک کنید:

1. **در GitHub:**
   ```
   https://github.com/omidmaniei842221035-creator/pos-monitoring
   ```
   
2. **فایل‌ها باید آپلود شده باشند:**
   - ✅ client/
   - ✅ server/
   - ✅ electron/
   - ✅ package.json
   - ✅ README.md

3. **راهنماها:**
   - ✅ راهنمای-ساخت-portable-ویندوز.md
   - ✅ BUILD_ON_WINDOWS.md
   - ✅ BUILD_COMMANDS.txt

---

## 🎉 بعد از Push موفق

حالا می‌توانید:

1. **Clone در Windows:**
   ```bash
   git clone https://github.com/omidmaniei842221035-creator/pos-monitoring.git
   cd pos-monitoring
   npm install
   npm run electron:build:win -- --target portable
   ```

2. **به اشتراک بگذارید:**
   - لینک repository را به دیگران بدهید
   - آن‌ها می‌توانند کد را دانلود کنند

3. **CI/CD راه‌اندازی کنید:**
   - GitHub Actions برای build خودکار
   - Release خودکار

---

**موفق باشید!** 🚀
