# 🏦 NC Performance Dashboard
### Sterling Bank · North Central Region · Performance Management System

> **A real-time performance monitoring and analytics platform built for Sterling Bank's North Central sales force. It tracks FSO performance, team rankings, KPI achievement, and AI-powered insights across 88 Field Sales Officers and 12 Cluster Heads.**

---

## 🌐 Live Application

| Environment | URL | Status |
|---|---|---|
| Production | https://ncperformancedashboard.space | 🟢 Live |
| API Documentation | https://ncperformancedashboard.space/api/v1/docs | 🟢 Live |
| Health Check | https://ncperformancedashboard.space/health | 🟢 Live |

---

## 📋 Table of Contents

- [Overview](#-overview)
- [Features](#-features)
- [Tech Stack](#-tech-stack)
- [User Roles](#-user-roles)
- [Performance KPIs](#-performance-kpis)
- [Scorecard Engine](#-scorecard-engine)
- [Dashboard Design](#-dashboard-design)
- [AI Insight Engine](#-ai-insight-engine)
- [Project Phases](#-project-phases)
- [Installation](#️-installation)
- [Environment Variables](#-environment-variables)
- [API Endpoints](#-api-endpoints)
- [Deployment](#-deployment)
- [Business Objective](#-business-objective)

---

## 🎯 Overview

The **NC Performance Dashboard** is a full-stack performance management and monitoring system. It helps **FSOs (Field Sales Officers)**, **Cluster Heads**, **RSMs (Regional Sales Managers)**, and **Administrators** track sales performance across Sterling Bank's North Central region in real time.

The system gives each user a clear view of their:
- 📊 Target and actual performance
- ✅ Valid and invalid account counts
- 📈 Percentage achievement
- 🏆 Regional scorecard and ranking
- ⚡ Current and required daily run rates
- 🤖 AI-powered performance insights

> Every user knows exactly where they stand, what they have achieved, and what they need to do to meet their targets before month end.

---

## ✨ Features

### 📤 Smart Report Upload
- Admin uploads the daily Excel NTB report.
- The system automatically extracts the report date from the file header.
- New FSOs found in the Excel are auto-registered, so there is no manual entry.
- Terminated FSOs that are no longer in the Excel are auto-removed.
- Existing FSOs keep all their login credentials untouched.
- Every upload runs a full sync, so there is zero manual work.

### 📊 KPI Calculation Engine
- Calculates all KPIs fresh from the raw data, and never reuses pre-calculated values.
- Computes Invalid Count, % Invalid, and % Achievement.
- Current Daily Run Rate is based on the report date.
- Required Daily Run Rate is based on the days remaining in the month.
- All values are rounded to whole numbers, with zero decimals anywhere.

### 🏆 Ranking Engine
- Ranks all 88 FSOs across North Central by Final Scorecard.
- Handles ties correctly, so equal scores share a rank and the next rank skips.
- Ranks all 12 Cluster Heads by combined team performance.
- Displays ordinal positions such as 1st, 2nd, and 3rd.

### 📱 Responsive Design
- Works cleanly on desktop (1920 x 1080) and laptop (1366 x 768).
- Fully responsive on iPad (768px) and mobile (375px).
- Bottom navigation bar on mobile.
- Tables scroll horizontally on small screens.

### 🤖 AI Insight Engine (Cerebras)
- Powered by the Cerebras `gpt-oss-120b` model.
- Role-based AI prompts for FSO, Cluster Head, RSM, and Admin.
- Insights generate automatically after every report upload.
- A fallback rule-based engine takes over when Cerebras is unavailable.
- Dashboards stay fully functional regardless of AI status.

### 📥 Excel Export
- The full FSO leaderboard exports to Excel.
- 26 exact columns with Sterling Bank styling.
- Color-coded rows: green for on track, amber for at risk, red for critical.
- Sterling Red title header row.

---

## 🛠 Tech Stack

| Layer | Technology |
|---|---|
| **Frontend** | React.js + TypeScript |
| **UI Framework** | Material UI (MUI) |
| **Charts** | Recharts |
| **State Management** | Zustand |
| **Data Fetching** | TanStack React Query |
| **Forms** | React Hook Form |
| **Backend API** | FastAPI (Python) |
| **Database** | PostgreSQL |
| **ORM** | SQLAlchemy |
| **Migrations** | Alembic |
| **Authentication** | JWT + bcrypt |
| **Email** | SMTP (Gmail) |
| **File Processing** | Pandas + OpenPyXL |
| **AI Engine** | Cerebras API (gpt-oss-120b) |
| **Web Server** | Nginx |
| **App Server** | Uvicorn |
| **Process Manager** | systemd |
| **OS** | Ubuntu Server (Contabo VPS) |
| **Version Control** | Git + GitHub |

---

## 👥 User Roles

### 🔴 Admin
- Full system access.
- Uploads the daily NTB performance reports.
- Manages all staff (add, edit, delete, bulk upload).
- Views all dashboards and analytics.
- Triggers KPI recalculations.
- Generates AI insights.
- Monitors system status.

### 🟠 RSM (Regional Sales Manager)
- Views the full regional performance overview.
- Sees all 12 Cluster Heads with team KPIs.
- Opens expandable cluster cards that show all FSOs.
- Works with the full FSO leaderboard and its 26 columns.
- Filters and sorts by any KPI.
- Exports to Excel.

### 🟡 Cluster Head
- Views a personal performance dashboard.
- Sees all FSOs in their team with full KPIs.
- Tracks the team scorecard and cluster ranking.
- Reviews top and bottom performer cards.
- Exports team data to Excel.

### 🟢 FSO (Field Sales Officer)
- Views a personal performance dashboard only.
- Sees Individual and Business account KPIs.
- Tracks a personal scorecard and regional ranking.
- Reads an AI-powered personal performance insight.
- Uses progress bars, pie charts, and a DRR comparison.

---

## 📊 Performance KPIs

For each of the two KPI groups (Individual Accounts and Business Accounts):

| KPI | Formula |
|---|---|
| **Invalid Count** | Actual − Valid |
| **% Invalid** | Invalid ÷ Actual × 100 |
| **% Achievement** | Valid ÷ Target × 100 |
| **Current DRR** | Valid ÷ Days Elapsed |
| **Required DRR** | (Target − Valid) ÷ Days Remaining |

> All results are rounded to the nearest whole number. No decimals are displayed anywhere.

**Days Elapsed** is the report date day of the month (for example, May 28 is 28 days).

**Days Remaining** is the last day of the month minus the report date (for example, May 31 minus 28 is 3 days).

---

## 🏆 Scorecard Engine

```
Individual Score  = MIN(Ind % Achievement, 100%) × 50%
Business Score    = MIN(Bus % Achievement, 100%) × 50%
Final Scorecard   = Individual Score + Business Score
Maximum           = 100 points
```

**Examples:**

| Ind Achievement | Bus Achievement | Ind Score | Bus Score | Final Scorecard |
|---|---|---|---|---|
| 100% | 100% | 50 | 50 | **100** |
| 120% | 80% | 50 | 40 | **90** |
| 80% | 60% | 40 | 30 | **70** |
| 50% | 40% | 25 | 20 | **45** |

**Status Labels:**

| Achievement | Status |
|---|---|
| ≥ 100% | 🟢 TARGET MET |
| ≥ 80% | 🟢 ON TRACK |
| ≥ 50% | 🟡 AT RISK |
| < 50% | 🔴 CRITICAL |

---

## 🖥 Dashboard Design

### FSO Dashboard

```
┌─────────────────────────────────────────────────┐
│  New to Bank Report as at May 28, 2026          │  ← Red banner
├──────────────┬──────────────┬───────────────────┤
│ My Scorecard │ My Ranking   │ Achievement Status│  ← Hero row
├──────────────┴──────────────┴───────────────────┤
│  INDIVIDUAL ACCOUNTS                            │
│  Target │ Actual │ Valid │ Invalid              │
│  % Inv  │ % Ach  │ Curr DRR │ Req DRR           │
│  Progress Bar ████████░░░░   Pie Chart 🔴🟢      │
│  DRR Comparison Card                            │
├─────────────────────────────────────────────────┤
│  BUSINESS ACCOUNTS  (same structure)            │
├─────────────────────────────────────────────────┤
│  Performance Bar Chart │ Scorecard Gauge        │
├─────────────────────────────────────────────────┤
│  🤖 AI Performance Insight                      │
└─────────────────────────────────────────────────┘
```

### RSM / Admin Dashboard Tabs

| Tab | Content |
|---|---|
| **Regional Overview** | Regional KPIs, charts, cluster comparison |
| **Cluster Summary** | 12 expandable cluster cards with full team data |
| **FSO Leaderboard** | All 88 FSOs, 26 columns, filters, sort, export |
| **Report Management** | Upload, validate, recalculate *(Admin only)* |
| **Staff Management** | Add, edit, delete, bulk upload *(Admin only)* |
| **System Status** | DB, AI, health checks *(Admin only)* |

### Excel Export Columns (26 total)

```
S/N | FSO Name | DAO Code | Cluster Head | State Cluster |
Ind Target | Ind Actual | Ind Valid | Ind Invalid | Ind % Invalid |
Ind % Achievement | Ind Score | Ind Current DRR | Ind Required DRR |
Bus Target | Bus Actual | Bus Valid | Bus Invalid | Bus % Invalid |
Bus % Achievement | Bus Score | Bus Current DRR | Bus Required DRR |
Final Scorecard | Position | Status
```

---

## 🤖 AI Insight Engine

Powered by **Cerebras AI** (`gpt-oss-120b`):

```
Upload Report
   ↓
KPI Calculations
   ↓
Rankings Generated
   ↓
AI Insights Generated (background)
   ├── FSO Insights (88 personal insights)
   ├── Cluster Head Insights (12 team insights)
   └── Regional Insight (1 executive insight)
   ↓
Dashboards Refresh
```

**Fallback:** If Cerebras is unavailable, a rule-based engine generates insights automatically, so the dashboards are always 100% functional.

---

## 🚀 Project Phases

| Phase | Title | Status |
|---|---|---|
| **Phase 1** | System Foundation & User Management | ✅ Complete |
| **Phase 2** | Frontend & Performance Upload Module | ✅ Complete |
| **Phase 3** | KPI, Scorecard & Ranking Engine | ✅ Complete |
| **Phase 4** | Dashboard Analytics & Visualization | ✅ Complete |
| **Phase 5** | AI Insight Engine with Cerebras | ✅ Complete |
| **Phase 6** | Testing, Systemd & Production Deployment | ✅ Complete |
| **Phase 7** | Mobile Responsive Design | ✅ Complete |
| **Phase 8** | Smart FSO Sync & Auto-Registration | ✅ Complete |

### Phase 1: System Foundation
- PostgreSQL database design.
- JWT authentication with bcrypt.
- Role-based access control (ADMIN, RSM, CLUSTER_HEAD, FSO).
- First-time login workflow with SMTP email.
- Staff management CRUD operations.

### Phase 2: Frontend & Upload
- React + TypeScript + Material UI.
- Sterling Bank branding (Primary: #E4002B).
- All dashboard layouts for all 4 roles.
- Excel upload engine with validation.
- Active report management.

### Phase 3: KPI Engine
- KPICalculator class with a full calculation suite.
- ProcessorService for batch calculations.
- FSO Ranking Engine with tie handling.
- Cluster Head Aggregation Engine.
- Regional Performance Engine.

### Phase 4: Dashboards
- Full component library (KPICard, ScoreCard, RankingCard, DRRCard).
- Recharts integration (donut, bar, gauge, horizontal bar).
- FSO, Cluster Head, RSM, and Admin dashboards.
- Loading skeletons and empty states.

### Phase 5: AI Engine
- Cerebras API integration.
- Role-specific prompt engineering.
- Background insight generation.
- Fallback rule-based engine.
- AI Insight Cards with refresh functionality.

### Phase 6: Production
- systemd service configuration.
- Nginx reverse proxy, isolated from n8n.
- SSL certificate via Let's Encrypt.
- Database backup, daily at 2am.
- Health checks every 5 minutes.

### Phase 7: Mobile Responsive
- Bottom navigation bar on mobile.
- All tables scroll horizontally.
- Charts stay responsive on 375px screens.
- iPad sidebar with icons only.

### Phase 8: Smart Sync
- Auto-register new FSOs on upload.
- Auto-remove terminated FSOs.
- Existing users never lose login credentials.
- The daily upload workflow is fully automated.

---

## ⚙️ Installation

### Prerequisites
- Ubuntu Server 22.04+
- Python 3.11+
- Node.js 18+
- PostgreSQL 15+
- Nginx

### Backend Setup
```bash
cd ~/projects/NC_Performance_Dashboard/backend
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
alembic upgrade head
uvicorn app.main:app --host 0.0.0.0 --port 8001
```

### Frontend Setup
```bash
cd ~/projects/NC_Performance_Dashboard/frontend
npm install
npm run build
cp -r dist/* /var/www/nc_dashboard/
```

### Systemd Service
```bash
systemctl enable nc-dashboard
systemctl start nc-dashboard
systemctl status nc-dashboard
```

---

## 🔐 Environment Variables

```env
# Application
APP_ENV=production
APP_PORT=8001
DEBUG=False

# Database
DATABASE_URL=postgresql://nc_admin:password@localhost:5432/nc_performance_db

# Authentication
SECRET_KEY=your_secret_key
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=480

# Email (SMTP)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USERNAME=your_email@gmail.com
SMTP_PASSWORD=your_app_password

# Cerebras AI
CEREBRAS_API_KEY=your_cerebras_api_key
CEREBRAS_MODEL=gpt-oss-120b
CEREBRAS_ENABLED=True

# Frontend
VITE_API_BASE_URL=https://ncperformancedashboard.space/api/v1
```

---

## 📡 API Endpoints

### Authentication
| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/v1/auth/first-login` | First time setup |
| POST | `/api/v1/auth/login` | Login with DAO Code or email |
| POST | `/api/v1/auth/change-password` | Change password |

### Reports
| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/v1/reports/upload` | Upload NTB Excel report |
| GET | `/api/v1/reports/active` | Get active report |
| GET | `/api/v1/reports/status` | Get report status |

### Dashboards
| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/v1/dashboard/fso/me` | FSO personal dashboard |
| GET | `/api/v1/dashboard/cluster/me` | Cluster Head dashboard |
| GET | `/api/v1/dashboard/cluster/team-full` | Full team data |
| GET | `/api/v1/dashboard/rsm/full` | Full regional data |
| GET | `/api/v1/dashboard/admin/full` | Admin full dashboard |

### AI Insights
| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/v1/insights/me` | Personal AI insight |
| POST | `/api/v1/insights/refresh` | Refresh insight |
| GET | `/api/v1/insights/regional` | Regional insight |
| POST | `/api/v1/insights/generate-all` | Generate all insights |

---

## 🚀 Deployment

**Server:** Contabo VPS · Ubuntu Server

**Domain:** ncperformancedashboard.space

**Architecture:**

```
Internet
   ↓
Nginx (port 443 SSL)
   ├── /        → /var/www/nc_dashboard (React frontend)
   └── /api/v1/ → localhost:8001 (FastAPI backend)
   ↓
PostgreSQL :5432
```

**Other services on the same server (isolated):**
- n8n (port 5678)
- Qdrant (port 6333)
- Ollama (port 11434)
- Streamlit (port 8501)

---

## 🎯 Business Objective

> The primary objective is to provide a **single source of truth** for performance management across North Central. It creates **visibility**, **accountability**, **competition**, and **performance ownership** across the entire region.

**Every user immediately knows:**
- ✅ What their target is
- ✅ What they have achieved
- ✅ How many valid accounts they have delivered
- ✅ Their percentage achievement
- ✅ Their scorecard out of 100
- ✅ Their regional ranking
- ✅ Their current daily performance pace
- ✅ The daily pace required to achieve target

**Management immediately identifies:**
- 🏆 Top performing FSOs
- ⚠️ FSOs needing support
- 🥇 Strongest Cluster Heads
- 📊 Regional performance trends

---

## 👤 Author

**Built for Sterling Bank North Central Region**

Repository: https://github.com/Ogbunugafor-Philip/NC-PERFORMANCE-DASHBOARD

---

*NC Performance Dashboard · Powered by Sterling Bank · North Central Region · 2026*
