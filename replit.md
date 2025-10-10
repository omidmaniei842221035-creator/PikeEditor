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

## Recent Changes (October 2025)

### Desktop Version Development - Completed ✅
- ✅ Completed SQLite schema with 21 tables (Base + Grafana + Network Analysis)
- ✅ Implemented DatabaseStorage class with 148 methods covering all features
- ✅ Fixed cross-database compatibility issues:
  - Replaced PostgreSQL-only `ilike` with `LOWER() + LIKE` for case-insensitive searches
  - Updated all delete methods to use `.returning()` instead of `rowCount` check
  - 14 delete methods fixed: deleteBranch, deleteEmployee, deleteCustomer, deleteAlert, deletePosDevice, deletePosMonthlyStats, deleteVisit, deleteBankingUnit, deleteOrganization, deleteDataSource, deleteDashboard, deleteAlertRule, deleteMlModel, deleteReport, deleteNetworkNode, deleteNetworkEdge
- ✅ Build configuration optimized with esbuild externals for better-sqlite3, lightningcss, @babel/*, @neondatabase/serverless, ws
- ✅ Electron Desktop Build completed:
  - electron packages moved to devDependencies (required by electron-builder)
  - Portable app built: win-unpacked/ with electron.exe (202MB)
  - Compressed archive: سامانه-مانیتورینگ-POS-1.0.0-Portable.tar.gz (121MB)
  - Complete documentation: README-DESKTOP.md with installation & usage guide
  - **Note**: Full Windows installer (.exe) requires building on Windows machine (Wine/Docker limitations in Replit)
- ✅ Desktop Download Feature completed:
  - API endpoints: `/api/desktop/files`, `/api/desktop/download/portable`, `/api/desktop/download/exe`
  - Frontend download page: `/desktop-download` with RTL UI and complete instructions
  - Navigation link added to sidebar under "تنظیمات سیستم"
  - Critical fix: Vite middleware now properly allows API routes (was blocking with 404)
  - Users can now download both portable archive (121MB) and electron.exe (201.4MB) directly from web interface