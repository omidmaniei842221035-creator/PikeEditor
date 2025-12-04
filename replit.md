# سامانه مانیتورینگ هوشمند پایانه های فروشگاهی

## Overview

This is a comprehensive POS (Point of Sale) management system designed specifically for Persian businesses in Tabriz, Iran. The application provides real-time monitoring, analytics, and management capabilities for POS devices across various business types including supermarkets, restaurants, pharmacies, and cafes. It features a full-stack React-based dashboard with TypeScript, real-time WebSocket monitoring, AI-powered analytics, geographic mapping, and comprehensive customer relationship management.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript and Vite as the build tool
- **UI Library**: shadcn/ui components built on Radix UI primitives
- **Styling**: Tailwind CSS with custom Persian font (Vazirmatn) and RTL support
- **State Management**: TanStack React Query for server state and caching
- **Routing**: Wouter for lightweight client-side routing
- **Forms**: React Hook Form with Zod validation
- **Maps**: Leaflet for geographic visualization of branches and customers

### Backend Architecture
- **Runtime**: Node.js with Express.js server
- **Language**: TypeScript with ES modules
- **API Design**: RESTful APIs with WebSocket support for real-time monitoring
- **Session Management**: Express sessions with PostgreSQL storage
- **File Processing**: Excel file parsing and export capabilities
- **Real-time Communication**: WebSocket server for live device status updates

### Database Layer
- **Dual-Database Architecture**: 
  - **Web Version**: PostgreSQL with Neon serverless hosting (shared/schema.ts)
  - **Desktop Version**: SQLite with better-sqlite3 (shared/schema.sqlite.ts)
- **ORM**: Drizzle ORM for type-safe database operations
- **Schema**: Comprehensive schema covering users, branches, employees, customers, POS devices, transactions, and alerts
- **Extended Schema (Desktop)**: 21 tables including Grafana Enterprise (organizations, dataSources, dashboards, alertRules, mlModels, reports) and Network Analysis (networkNodes, networkEdges)
- **Migrations**: Managed through Drizzle Kit
- **Cross-Database Compatibility**: All storage methods use compatible patterns (`.returning()` for deletes, `LOWER() + LIKE` for searches) that work in both PostgreSQL and SQLite

### Key Features and Components

#### Business Intelligence
- AI-powered analytics engine with machine learning algorithms for sales forecasting, customer segmentation, and churn prediction
- Regional analysis for coverage optimization and market expansion
- Performance tracking across business types (supermarkets, restaurants, pharmacies, cafes, bakeries)

#### Real-time Monitoring
- WebSocket-based live monitoring of POS device status
- Alert system for device failures and performance issues
- Automatic status simulation for demonstration purposes

#### Geographic Management
- Interactive map integration showing branch locations and coverage areas
- Customer location tracking and territory management
- Coverage radius analysis for service optimization

#### Regional Analysis Dashboard (New Feature)
- **Territory Management**: Curved territory drawing with Bezier support and polygon management
- **Virgin Region Detection**: Grid-based analysis to identify areas with no customer presence
- **Automatic Zone Creation**: Proximity-based customer clustering with convex hull boundaries
- **Customer Distribution Analysis**: Coverage scoring and strategic recommendations
- **Integrated Analytics**: 4-tab interface within main analytics dashboard for comprehensive territorial insights

#### Data Management
- Excel import/export functionality for bulk customer data operations
- Comprehensive customer relationship management
- Employee management with role-based access
- Branch and territory management
- **Backup & Restore System**: Complete database export to JSON format with restore capability for data portability and disaster recovery

### External Dependencies

- **Database**: Neon PostgreSQL serverless database
- **UI Components**: Radix UI primitives for accessible components
- **Mapping**: Leaflet for interactive maps with OpenStreetMap tiles
- **File Processing**: XLSX library for Excel file operations
- **Fonts**: Vazirmatn Persian font from CDN
- **Development**: Replit integration with runtime error overlay and cartographer for development environment
- **WebSocket**: Native WebSocket implementation for real-time features

### Development and Deployment
- **Build System**: Vite for frontend, esbuild for backend bundling
- **Type Safety**: Comprehensive TypeScript coverage with strict configuration
- **Path Mapping**: Organized imports with @ aliases for cleaner code structure
- **Environment**: Configured for both development and production deployments with Replit-specific optimizations
- **Data Portability**: Backup/Restore system enabling database export to JSON and restoration on different systems for deployment flexibility
- **Desktop Deployment**: Electron-based desktop application with SQLite database for standalone PC installation via .exe installer

## Project Cleanup & Final Preparation (November 24, 2025)

✅ **Repository Cleanup:**
- Removed temporary files: GIT_SETUP.md, push-to-github.sh, build-icon.* files
- Consolidated old documentation versions (BUILD_GUIDE.md, DESKTOP-INSTALL-GUIDE.md, INSTALL-WINDOWS.md, ELECTRON_USAGE.md, README-DESKTOP.md, README-STANDALONE.md)
- Created comprehensive primary documentation:
  - `راهنمای-ساخت-portable-ویندوز.md` (612 lines) - Complete Persian guide for building portable Windows exe
  - `BUILD_ON_WINDOWS.md` - Step-by-step English guide
  - `BUILD_COMMANDS.txt` - Quick reference commands
  - `BUILD_PORTABLE_ON_WINDOWS.md` - Portable-specific build instructions
  - `README.md` - Project overview in English + Persian
- Updated `.gitignore` with proper patterns (dist/, release/, build/, node_modules/, *.db, etc.)
- **Status**: Ready for GitHub push - all temporary and build files are properly ignored

## Recent Changes (November 2025)

### Version 1.0.2 - FINAL BUILD ✅ (November 25, 2025)
**Critical Fix: Dual package.json Architecture**

The main issue was that `package.json` has `"type": "module"` for the web app, but Electron requires CommonJS. When electron-builder copied package.json into app.asar, Node.js treated .cjs files as ES modules and threw "exports is not defined" error.

**Solution Implemented:**
- ✅ **electron-package.json** - CommonJS package.json (no "type": "module") → copied into app.asar
- ✅ **server-package.json** - ESM package.json (`"type": "module"`) → copied to resources/server/
- ✅ **electron-builder config updated**:
  - `files`: excludes root package.json, copies electron-package.json as package.json
  - `extraResources`: copies server-package.json to server/package.json
- ✅ **Server remains ESM format** (required for import.meta and top-level await)
- ✅ **Electron compiles to CommonJS** (.cjs extension)

**File Structure in Packaged App:**
```
app.asar/
  ├── dist-electron/main.cjs, preload.cjs, logger.js
  └── package.json (from electron-package.json, NO "type": "module")

resources/
  ├── server/
  │   ├── index.js (ESM format)
  │   └── package.json (from server-package.json, HAS "type": "module")
  └── node_modules/better-sqlite3/
```

**Build Files:**
- `BUILD_FINAL_v1.0.2.bat` - Complete build script
- `FIX_NPM_IRAN.bat` - npm configuration for Iran
- `WINDOWS_BUILD_README.md` - Comprehensive documentation

### Previous: Windows Build Fixed ✅ (November 24, 2025)
- ✅ **ES Module Error FIXED**: Changed main.js to main.cjs to fix "exports is not defined" error
- ✅ **TensorFlow/Rollup Error FIXED**: Removed @tensorflow/tfjs from package.json, replaced with CDN loader
- ✅ **Canvas Dependency Removed**: Eliminated cairo.h build requirements
- ✅ **Server Path Corrected**: Fixed from app.asar (non-executable) to resources/server/index.js
- ✅ **File Logging Added**: All errors now logged to AppData/Roaming/logs with timestamps
- ✅ **Error Dialogs Implemented**: User-friendly Persian error messages when server fails
- ✅ **Startup Delay Increased**: From 3s to 5s for reliable server initialization
- ✅ **Path Validation**: Server checks if files exist before attempting to spawn
- ✅ **Electron Compile Script**: Auto-converts .js to .cjs to prevent CommonJS/ESM conflicts
- ✅ **Documentation Complete**: FINAL_BUILD_STEPS.md, BUILD_FINAL_VERSION.md, and DEBUG_WINDOWS.md added

### Windows Installer Development - Blocked by Environment Limitations ⚠️ (November 20, 2025)
- ✅ **Fixed all TypeScript compilation errors** (reduced from 16 to 0):
  - Added `target: ES2017` and `downlevelIteration: true` to tsconfig.json for Set iteration support
  - Fixed schema type mismatches in insertCustomerAccessLogSchema and insertBankingUnitSchema
  - Added union type validation for `accessType` and `unitType` fields
  - Resolved color nullable type issues in territories schema
- ❌ **Critical Discovery**: Portable exe built in Replit (Linux) does NOT work on Windows due to native module incompatibility
  - Root cause: `better-sqlite3.node` compiled for Linux, not Windows (causes "not a valid Win32 application" error)
  - Cross-compilation from Linux to Windows is impossible for native Electron modules
  - Wine cannot solve this - MSVC toolchain required on actual Windows
- ✅ **All Code Ready for Windows Build**: electron/main.ts fixed, package.json configured, icon.ico prepared
- ⚠️ **Portable exe MUST be built on Windows**:
  - Command: `npm install && npm run electron:build:win -- --target portable`
  - Output: Single .exe file (200-300MB) that works on any Windows without prerequisites
  - Alternative: Full NSIS installer with `npm run electron:build:win`
- ✅ **Electron-builder configuration finalized**:
  - NSIS installer configuration (assisted install with custom directory selection)
  - Portable exe target for no-install deployment
  - SVG icon support with automatic conversion
  - Native dependency rebuilding (better-sqlite3, tensorflow, bufferutil)
- ✅ **Schema harmonization complete**:
  - SQLite schema perfectly aligned with PostgreSQL schema
  - Cross-database compatibility verified
  - Dynamic schema exports based on runtime environment
- ✅ **Zero TypeScript errors** - Production-ready codebase

### Desktop Version Development - Previously Completed ✅
- ✅ Completed SQLite schema with 21 tables (Base + Grafana + Network Analysis)
- ✅ Implemented DatabaseStorage class with 148 methods covering all features
- ✅ Fixed cross-database compatibility issues (ilike → LOWER() + LIKE, .returning() for deletes)
- ✅ Build configuration optimized with esbuild externals
- ✅ Desktop Download Feature completed:
  - API endpoints: `/api/desktop/files`, `/api/desktop/download/portable`, `/api/desktop/download/exe`
  - Frontend download page: `/desktop-download` with RTL UI and complete instructions
  - Navigation link added to sidebar under "تنظیمات سیستم"
  - Critical fix: Vite middleware now properly allows API routes (was blocking with 404)
  - Users can now download both portable archive (121MB) and electron.exe (201.4MB) directly from web interface

### Customer Save Functionality Fix - Completed ✅ (December 4, 2025)
- ✅ **Fixed Critical Bug**: Customer creation and Excel import were failing due to Drizzle ORM timestamp handling issues
  - Root cause: `createInsertSchema` from `drizzle-zod` was generating Unix timestamps for optional timestamp fields
  - Error: "date/time field value out of range" when inserting customers
  - Solution: Used Drizzle's parameterized sql`` template for raw SQL insert (safe from SQL injection)
- ✅ **Enhanced Zod Schema Validation**: Added proper type coercion transforms in `insertCustomerSchema`:
  - `monthlyProfit`: Accepts string/number, coerces to valid integer with `Math.max(0, num)`
  - `latitude`: Validates range (-90 to 90), converts to string for database
  - `longitude`: Validates range (-180 to 180), converts to string for database
  - `installDate`: Accepts Date/string/null, parses strings to Date objects
- ✅ **Updated Storage Layer**: `storage.createCustomer()` uses Drizzle's sql`` tagged template (parameterized queries)
- ✅ **Updated Route Handlers**: POST and PUT /api/customers pass Zod-transformed data directly
- ✅ **Fixed TerritoryManagement Export**: Changed from named export to default export import in regional-analysis-dashboard.tsx
- ✅ **All Customer Operations Working**: Create, Update, Delete, and Excel import all functioning correctly

### Map Enhancements - Completed ✅ (October 31, 2025)
- ✅ Monthly Status History Timeline on Customer Markers:
  - Added color-coded 6-month status timeline to customer popup tooltips
  - Lazy-loads data from `/api/pos-stats/customer/:customerId` endpoint when popup opens
  - Interactive bars with hover tooltips showing month/year, status, and revenue
  - Persian month abbreviations (فر, ار, خر, etc.) for better UX
  - Handles loading states and error messages gracefully
- ✅ Fixed Analytics Map Lazy Loading Issue:
  - Regional analysis dashboard map now initializes correctly after tab switch
  - Added 100ms DOM rendering delay before map initialization
  - Eliminates zero-dimension container failures
  - Early return pattern prevents unnecessary initialization attempts
- ✅ Customer Location Selection System (Already Implemented):
  - Click-to-select mode with crosshair cursor
  - "افزودن مشتری از نقشه" button toggles selection mode
  - CustomerFormModal integration with initialLocation prop
  - Temporary marker shows selected location for 3 seconds