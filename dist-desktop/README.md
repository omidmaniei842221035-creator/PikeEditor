# سامانه مانیتورینگ POS - نسخه دسکتاپ
# POS Monitoring System - Desktop Version

## نصب و راه‌اندازی / Installation

### پیش‌نیاز / Prerequisites
- Node.js 18 یا بالاتر از [nodejs.org](https://nodejs.org/)

### Windows
1. فایل `Start-POS.bat` را دوبار کلیک کنید
2. مرورگر به صورت خودکار باز می‌شود: http://localhost:5000

### Linux/Mac
```bash
chmod +x start-pos.sh
./start-pos.sh
```

## اطلاعات ورود / Login
- نام کاربری / Username: admin
- رمز عبور / Password: admin123

⚠️ حتماً پس از ورود رمز را تغییر دهید!

## ویژگی‌های نسخه دسکتاپ / Desktop Features
- ✅ دیتابیس محلی SQLite (بدون نیاز به اینترنت)
- ✅ مدیریت مشتریان با انتخاب موقعیت روی نقشه
- ✅ مدیریت واحدهای بانکی با انتخاب موقعیت روی نقشه
- ✅ ورود گروهی از اکسل
- ✅ تحلیل هوشمند و نقشه مانیتورینگ
- ✅ پشتیبان‌گیری و بازیابی دیتابیس

## دیتابیس / Database
دیتابیس SQLite در کنار برنامه ذخیره می‌شود: `pos-system.db`

## توقف سرور / Stop Server
در ترمینال دکمه `Ctrl + C` را بزنید.
