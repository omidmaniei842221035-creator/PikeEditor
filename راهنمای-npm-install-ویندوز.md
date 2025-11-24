# راهنمای npm install در Windows - راهنمای سریع

## مشکل:

وقتی `npm install` را می‌زنید، خطاهایی مرتبط با **Canvas** و **TensorFlow** می‌دهید:
- `cairo.h: No such file or directory`
- `tfjs-node EBUSY`

## ✅ حل شده!

**Canvas** و **TensorFlow** برای Desktop Portable ضروری نبودند. حذفشان کردم.

---

## 🚀 دستورات جدید (روی ویندوز):

### 1. Clone پروژه جدید
```bash
git clone https://github.com/omidmaniei842221035-creator/pos-monitoring.git
cd pos-monitoring
```

### 2. npm install بدون مشکلات
```bash
npm install
```

**خواهد شد:**
- ✅ تمام warnings نادیده گرفته می‌شود
- ✅ بدون هیچ error
- ✅ Canvas و TensorFlow نیست (برای portable ضروری نیست)

### 3. Rebuild native modules
```bash
npm rebuild better-sqlite3 --update-binary
```

### 4. Build Portable
```bash
npm run electron:build:win -- --target portable
```

**خروجی:**
```
release\سامانه مانیتورینگ POS-1.0.0-portable.exe
```

---

## 📋 چه حذف شد؟

```
❌ @tensorflow/tfjs (برای web AI - desktop نیاز ندارد)
❌ @tensorflow/tfjs-converter
❌ @tensorflow/tfjs-node
❌ canvas (برای image rendering - chart.js کافی است)
```

## ✅ چه نگه داشته شد؟

```
✅ better-sqlite3 (برای database)
✅ chart.js (برای charts)
✅ html2canvas (برای export - محدود)
✅ plotly.js (برای advanced charts)
✅ همه UI libraries
```

---

## 🔧 اگر باز هم مشکل داشتید:

### اگر TensorFlow لازم است:

برای web version استفاده کنید، نه desktop:
```bash
npm run dev  # Web version
```

Web version TensorFlow دارد. Desktop فقط SQLite + UI است.

### اگر Canvas لازم است:

برای حذف آن، به جای آن `html2canvas` و `chart.js` استفاده می‌کنند.

---

## 📊 مقایسه

| ویژگی | قبل | بعد |
|------|-----|-----|
| npm install | ❌ خطا | ✅ موفق |
| Canvas | ❌ خطا cairo.h | ❌ حذف (نیاز نیست) |
| TensorFlow | ❌ EBUSY | ❌ حذف (فقط web) |
| Better-sqlite3 | ✅ کار می‌کند | ✅ کار می‌کند |
| Portable exe | ❌ ناممکن | ✅ ممکن |

---

## 🎉 حالا آماده هستید!

```bash
npm install
npm rebuild better-sqlite3 --update-binary
npm run electron:build:win -- --target portable
```

بس! یک فایل `.exe` میسازد که روی هر Windows 10/11 کار می‌کند. 🚀

---

**موفق باشید!** 🎯
