# سامانه مانیتورینگ هوشمند پایانه های فروشگاهی

## Overview

This project is a comprehensive POS (Point of Sale) management system designed for Persian businesses in Tabriz, Iran. It offers real-time monitoring, analytics, and management capabilities for POS devices across diverse business sectors like supermarkets, restaurants, pharmacies, and cafes. The system features a full-stack React-based dashboard with TypeScript, real-time WebSocket monitoring, AI-powered analytics, geographic mapping, and robust customer relationship management. The business vision is to provide an intelligent platform that enhances operational efficiency, improves customer engagement, and drives strategic growth for businesses utilizing POS systems, with a strong focus on regional market potential and expansion.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend
- **Framework**: React 18 with TypeScript and Vite.
- **UI/UX**: shadcn/ui components (built on Radix UI), Tailwind CSS for styling, custom Persian font (Vazirmatn), and RTL support.
- **State Management**: TanStack React Query.
- **Routing**: Wouter.
- **Forms**: React Hook Form with Zod validation.
- **Maps**: Leaflet for geographic visualization.

### Backend
- **Runtime**: Node.js with Express.js.
- **Language**: TypeScript.
- **API**: RESTful APIs with WebSocket for real-time monitoring.
- **Session Management**: Express sessions with PostgreSQL storage.
- **File Processing**: Excel import/export.
- **Real-time**: WebSocket server for live device status updates.

### Database
- **Architecture**: Dual-database approach for web and desktop.
    - **Web**: PostgreSQL (Neon serverless).
    - **Desktop**: SQLite (better-sqlite3).
- **ORM**: Drizzle ORM for type-safe operations.
- **Schema**: Comprehensive, covering users, branches, employees, customers, POS devices, transactions, alerts. Desktop version extends with Grafana Enterprise and Network Analysis tables.
- **Migrations**: Drizzle Kit.
- **Compatibility**: Cross-database compatible patterns (e.g., `.returning()` for deletes, `LOWER() + LIKE` for searches).

### Key Features
- **Business Intelligence**: AI-powered analytics for sales forecasting, customer segmentation, churn prediction, regional analysis, and performance tracking across business types.
- **Real-time Monitoring**: WebSocket-based live POS device status, alert system, and automatic status simulation.
- **Geographic Management**: Interactive map integration for branch locations, customer tracking, territory management, and coverage analysis.
- **Regional Analysis Dashboard**: Features territory management (curved drawing, polygon management), virgin region detection, automatic zone creation via customer clustering, customer distribution analysis, and integrated analytics.
- **AI Geographic Analysis (Enhanced)**: 
  - **AI Clustering (خوشه‌بندی هوشمند)**: K-means clustering of customers based on location, revenue, business type, and activity status. Identifies high/medium/low potential areas with interactive map visualization.
  - **AI Forecasting (پیش‌بینی فروش)**: Linear regression-based sales prediction per branch with monthly forecasts. Provides business expansion suggestions based on customer density and service coverage gaps.
  - **Radius Analysis (تحلیل شعاع دسترسی)**: Service coverage analysis showing customers within/outside coverage radius of branches and banking units. Suggests optimal locations for new service points based on uncovered high-revenue customers.
  - **API Endpoints**: `/api/ai/clusters`, `/api/ai/forecast`, `/api/ai/radius` with configurable parameters (cluster count, forecast horizon, coverage radius).
- **Data Management**: Excel import/export for customer data, comprehensive CRM, employee management (role-based access), branch and territory management, and a full database backup/restore system (JSON export/import).
- **Desktop Version**: Electron-based desktop application with SQLite database for standalone PC installation.
- **Map Location Picker**: Reusable LocationPickerModal component for selecting geographic locations on a Leaflet map. Available in both web and desktop versions for customers and banking units.

## External Dependencies

- **Database**: Neon PostgreSQL serverless database.
- **UI Components**: Radix UI primitives.
- **Mapping**: Leaflet (with OpenStreetMap tiles).
- **File Processing**: XLSX library.
- **Fonts**: Vazirmatn Persian font (CDN).
- **Development**: Replit integration (runtime error overlay, cartographer).
- **Real-time**: Native WebSocket implementation.