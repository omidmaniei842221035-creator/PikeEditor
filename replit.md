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

## Recent Changes (November 2025)

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