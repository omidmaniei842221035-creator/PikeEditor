# Persian POS Management Dashboard

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
- **Primary Database**: PostgreSQL with Neon serverless hosting
- **ORM**: Drizzle ORM for type-safe database operations
- **Schema**: Comprehensive schema covering users, branches, employees, customers, POS devices, transactions, and alerts
- **Migrations**: Managed through Drizzle Kit

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

#### Data Management
- Excel import/export functionality for bulk customer data operations
- Comprehensive customer relationship management
- Employee management with role-based access
- Branch and territory management

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