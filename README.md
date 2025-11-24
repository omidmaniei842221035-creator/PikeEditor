# سامانه مانیتورینگ هوشمند پایانه‌های فروشگاهی (POS Monitoring System)

یک سیستم جامع مدیریت و نظارت بر دستگاه‌های POS با قابلیت‌های تحلیل هوشمند و نقشه‌های جغرافیایی.

## ویژگی‌ها

- 📊 داشبورد تحلیلی با نمودارهای زنده
- 🗺️ نقشه جغرافیایی شعب و مشتریان
- 🤖 تحلیل هوشمند با AI
- 💾 دو نسخه: Web (PostgreSQL) و Desktop (SQLite)
- 🖥️ نسخه Desktop با Electron

## نصب و راه‌اندازی

### نسخه Web
\`\`\`bash
npm install
npm run dev
\`\`\`

### نسخه Desktop (Windows)
مستندات کامل در فایل `راهنمای-ساخت-portable-ویندوز.md`

\`\`\`bash
npm install
npm run electron:build:win -- --target portable
\`\`\`

## مستندات

- [راهنمای ساخت Portable ویندوز](./راهنمای-ساخت-portable-ویندوز.md)
- [راهنمای Build در Windows](./BUILD_ON_WINDOWS.md)
- [دستورات سریع](./BUILD_COMMANDS.txt)

## تکنولوژی‌ها

- **Frontend:** React + TypeScript + Vite
- **Backend:** Node.js + Express
- **Database:** PostgreSQL (Web) / SQLite (Desktop)
- **Desktop:** Electron
- **UI:** shadcn/ui + Tailwind CSS
- **Maps:** Leaflet

## ساختار پروژه

\`\`\`
├── client/          # Frontend React
├── server/          # Backend Express
├── electron/        # Desktop Electron app
├── shared/          # Shared schemas
└── release/         # Build outputs
\`\`\`

## مجوز

این پروژه تحت مجوز MIT منتشر شده است.
