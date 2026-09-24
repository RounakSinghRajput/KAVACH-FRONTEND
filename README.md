# KAVACH SURAKSHA Dashboard

A professional Pan-India Railway React JS Dashboard for KAVACH Safety Monitoring & Railway Analytics System.

## Overview

KAVACH SURAKSHA is a comprehensive web application designed for Indian Railways to manage and monitor railway safety systems across zones, divisions, and sections. This non-safety analytics and management UI supports role-based access for various stakeholders including Railway Board, Zonal Railways, Divisional officers, OEMs, and RDSO.

## Technology Stack

- **Frontend Framework**: React 18 with TypeScript
- **Build Tool**: Vite
- **UI Library**: Material UI (MUI) v5
- **State Management**: Redux Toolkit
- **Routing**: React Router v6
- **Charts**: ECharts & Recharts
- **Data Grid**: MUI DataGrid
- **Icons**: Lucide React
- **Authentication**: Mock JWT-based authentication
- **API**: Mock REST APIs with Axios
- **Storage**: LocalStorage for session management

## Key Features

### 1. Authentication & Authorization
- Mock JWT-based authentication
- Role-based access control (RBAC)
- Session management with LocalStorage
- Demo credentials:
  - **Email**: admin@kavach.com
  - **Password**: admin123
  - **Role**: SUPER_ADMIN (full access)

### 2. Role-Based Access
- **SUPER_ADMIN**: Full system access and user management
- **RAILWAY_BOARD**: All zones and divisions access
- **RDSO**: Read-only audit access
- **OEM**: Asset-specific access
- **ZONE_USER (CSTE)**: Zone-level access
- **DIVISION_USER (DY_CSTE)**: Division-level access
- **DIV_USER**: Division-specific operations
- **VIEW_ONLY**: Read-only access

### 3. Dashboard
- Real-time KPI cards (Total Failures, Open FRACAS, Critical Alarms, etc.)
- Interactive charts and visualizations
- Zone and division filtering
- MTTR and MTBF metrics
- Failure trends and analytics

### 4. Real-Time NMS Logs
- Live log streaming with auto-refresh
- Advanced filtering (Zone, Division, Asset, Severity)
- Export to CSV
- Severity-based color coding
- Pagination and sorting

### 5. SURAKSHA Module
- **Failure Reporting**: Create and track failure records
- **Failure Analysis**: Root cause analysis with linked records
- **Corrective Action**: Action tracking with SLA management
- Auto-generated report numbers
- Status tracking (Open, In Progress, Closed)
- Attachment support

### 6. Asset Management
- RFID Tags tracking
- Towers and Radio equipment
- Trackside equipment
- Onboard (LOCO) units
- Health status monitoring
- Last communication tracking

### 7. Management Modules
- LOCO Management
- Section Management
- Division Management
- Zone Management
- User Management (Admin only)

### 8. Reports & Audits
- Monthly failure reports
- Zone-wise comparison
- OEM performance reports
- Export to PDF and Excel

### 9. UI/UX Features
- Collapsible sidebar navigation
- Dark and light theme support
- Responsive design (Desktop, Tablet, Mobile)
- Professional railway-grade theme
- Intuitive navigation with icons
- Real-time updates

## Project Structure

```
src/
├── components/          # Reusable UI components
│   ├── auth/           # Authentication components
│   └── common/         # Common shared components
├── layouts/            # Layout components
│   └── MainLayout.tsx  # Main app layout with sidebar
├── pages/              # Page components
│   ├── auth/           # Authentication pages
│   ├── dashboard/      # Dashboard page
│   ├── nms/            # NMS Logs page
│   ├── fracas/         # FRACAS module pages
│   ├── assets/         # Asset management pages
│   ├── users/          # User management
│   └── reports/        # Reports and audits
├── store/              # Redux store
│   └── slices/         # Redux slices
├── services/           # API services
│   ├── api.ts          # Mock REST API methods
│   └── supabase.ts     # Legacy (not used)
├── types/              # TypeScript type definitions
├── utils/              # Utility functions
│   └── theme.ts        # MUI theme configuration
└── hooks/              # Custom React hooks
```

## Data Model

### Mock Data Entities
- **zones**: Railway zones across India (5 pre-populated)
- **divisions**: Railway divisions under zones (4 pre-populated)
- **sections**: Railway sections under divisions (2 pre-populated)
- **locos**: Locomotive units (2 pre-populated)
- **users**: User accounts (1 super admin)
- **asset_types**: Types of assets (RFID, Tower, Onboard)
- **assets**: Asset inventory (empty by default)
- **nms_logs**: Network Management System logs (empty by default)
- **fracas_records**: Failure records (empty by default)
- **filter_presets**: User-saved filter presets

### Data Storage
- In-memory JavaScript objects for runtime data
- LocalStorage for authentication session persistence
- All data resets on page reload except authentication
- CRUD operations fully functional during session

## Setup Instructions

### Prerequisites
- Node.js 18+ and npm

### Installation

1. **Install dependencies**:
```bash
npm install
```

2. **Mock Data**:
The application uses mock REST APIs with in-memory data storage and LocalStorage for session management. No backend or database setup is required.

3. **Demo Login Credentials**:
Use the following credentials to access the application:

- **Email**: admin@kavach.com
- **Password**: admin123
- **Role**: SUPER_ADMIN (Full system access)

The login page displays these credentials for easy reference.

### Running the Application

**Development mode**:
```bash
npm run dev
```

**Production build**:
```bash
npm run build
npm run preview
```

**Type checking**:
```bash
npm run typecheck
```

**Linting**:
```bash
npm run lint
```

## User Roles and Permissions

| Role | Access Level | Capabilities |
|------|-------------|-------------|
| SUPER_ADMIN | Full system | User management, all zones/divisions |
| RAILWAY_BOARD | All zones | View and manage all railway data |
| RDSO | Read-only | Audit and review access |
| OEM | Asset-specific | Manage assigned assets |
| ZONE_USER | Zone-level | Manage zone and its divisions |
| DIVISION_USER | Division-level | Manage specific division |
| DIV_USER | Division ops | Division operations |
| VIEW_ONLY | Read-only | View-only access |

## Navigation Menu Structure

- Dashboard
- Real-Time NMS Logs
- FRACAS
  - Failure Reporting
  - Failure Analysis
  - Corrective Action
- Assets Management
  - RFID Tags
  - Towers / Radios
  - Trackside Equipment
  - Onboard (LOCO) Units
- LOCO Management (Role-restricted)
- Section Management (Role-restricted)
- Division Management (Role-restricted)
- Zone Management (Admin only)
- User Management (Admin only)
- Reports & Audits
- Settings

## API Integration

All API calls use centralized mock service methods with simulated delays:
- `api.auth.*` - Authentication methods (mock login/logout)
- `api.zones.*` - Zone operations (5 dummy zones)
- `api.divisions.*` - Division operations (4 dummy divisions)
- `api.sections.*` - Section operations (2 dummy sections)
- `api.locos.*` - Loco management (2 dummy locos)
- `api.assets.*` - Asset management
- `api.nmsLogs.*` - NMS log operations
- `api.fracas.*` - FRACAS operations
- `api.dashboard.*` - Dashboard statistics
- `api.users.*` - User management
- `api.filterPresets.*` - Filter preset management

## Mock Data

The application includes pre-populated mock data:
- **Zones**: 5 railway zones (Central, Western, Northern, Southern, Eastern)
- **Divisions**: 4 divisions across zones
- **Sections**: 2 railway sections
- **Locos**: 2 locomotive units
- **User**: 1 super admin user

All CRUD operations work with in-memory data. Changes persist during the session but reset on page reload (except authentication which uses LocalStorage).

## Security Features

1. Mock JWT-based authentication with session storage
2. Role-based route protection
3. LocalStorage for session management
4. Protected routes requiring authentication
5. Automatic redirect to login when not authenticated

## Design Principles

- **Non-Safety System**: This UI never controls live KAVACH safety systems
- **Analytics Only**: Strictly for monitoring, analysis, and reporting
- **Railway-Grade Professional**: Clean, intuitive design suitable for railway operations
- **Mobile Responsive**: Works seamlessly on desktop, tablet, and mobile
- **Accessibility**: Follows WCAG guidelines for accessibility

## Important Notes

1. This is a monitoring and management dashboard only
2. It does not interface with or control any safety-critical KAVACH systems
3. All data is for analysis, reporting, and operational decision-making
4. **Mock Implementation**: Uses in-memory data and LocalStorage (no real backend)
5. Data changes persist during session but reset on page reload
6. Authentication state is maintained in LocalStorage
7. Dark and light themes are available for user preference
8. All API calls include simulated delays for realistic behavior

## Support

For technical support or questions about the KAVACH FRACAS system, please contact the railway IT department.

## License

This application is proprietary software developed for Indian Railways.
