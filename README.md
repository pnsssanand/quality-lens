# QualityLens – Engineering Quality Analytics & Root Cause Intelligence Platform

[![Build Status](https://img.shields.io/badge/build-passing-brightgreen)](https://github.com/)
[![Tests](https://img.shields.io/badge/tests-11%20backend%20%7C%202%20frontend%20passing-success)](https://github.com/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.110+-009688?logo=fastapi)](https://fastapi.tiangolo.com/)
[![React](https://img.shields.io/badge/React-19.0-61DAFB?logo=react)](https://react.dev/)
[![Firebase](https://img.shields.io/badge/Firebase-Auth%20%26%20Firestore-FFCA28?logo=firebase)](https://firebase.google.com/)
[![Cloudinary](https://img.shields.io/badge/Cloudinary-Media%20Storage-3448C5?logo=cloudinary)](https://cloudinary.com/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-15-336791?logo=postgresql)](https://www.postgresql.org/)

> **Graduate Engineering Analytics Portfolio Project**  
> Demonstrating production-grade full-stack engineering, mathematical quality analytics, relational database modeling, and automated root cause investigation workflows relevant to **Engineering Quality Analytics and Automation Engineer** positions.

---

## 1. Executive Summary & Problem Statement

Modern manufacturing environments generate extensive operational inspection data across production lines, automated optical inspection (AOI) stations, and manual quality checkpoints. However, engineering teams frequently struggle with:
1. **Disconnected Data Silos**: Non-conformance records, visual evidence photographs, and root cause notes stored across fragmented spreadsheets and email threads.
2. **Delayed Feedback**: Inability to identify statistical defect rate drift before it breaches upper control limits and causes scrap batches.
3. **Superficial Root Cause Analysis**: Stopping at operational symptoms rather than drilling down into systemic engineering weaknesses using structured methods like the **5 Whys**.

**QualityLens** solves this by providing a unified, full-stack intelligence platform that ingests, validates, cleans, and mirrors engineering inspection records, computes dynamic quality KPIs (Overall Defect Rate, First Pass Yield, Pareto curves), tracks assembly station thresholds, records photographic failure evidence via Cloudinary, and structures 5 Whys CAPA (Corrective and Preventive Action) investigations.

> **Ethical Data Declaration:** All inspection records, machine names, and defect logs in this portfolio project are **100% synthetic demonstration data** generated to model real-world manufacturing statistics. This project does not contain or claim to use real Arm manufacturing data.

---

## 2. Key Features

- **Executive Quality Dashboard**: Real-time KPI summary (Total Inspected, Defective Units, Defect Rate, First Pass Yield, Defect Categories, Open Cases).
- **Interactive Visualizations**: Time-series defect trend analysis (daily, weekly, monthly), category frequency rankings, production line comparisons, and severity breakdowns using **Recharts**.
- **Pareto Intelligence (80/20 Rule)**: Automated descending failure mode ranking, cumulative contribution curve, and mathematical isolation of the "Vital Few" target categories.
- **CSV Ingestion & Validation Engine**: Upload datasets with pre-import validation checking:
  - Header integrity & required schema
  - Type constraints (positive integers, dates)
  - Logical rules ($0 \le \text{Defective} \le \text{Inspected}$)
  - Duplicate inspection ID detection
  - Missing-value audit and quarantine reporting
- **Structured 5 Whys Root Cause Investigation Module**:
  - Interactive 5 Whys iterative causal forms
  - Evidence and supporting notes logging for every step
  - Separation of statistical correlation, candidate hypotheses, and engineer-verified root causes
  - Full CAPA (Corrective and Preventive Action) tracking and review scheduling
- **Photographic Defect Evidence Library**:
  - Direct integration with **Cloudinary** for image uploads (JPEG, PNG, WEBP)
  - Image metadata stored with inspection and investigation associations
  - Searchable by defect category, machine ID, and visual observation notes
- **Process Quality Monitoring & Threshold Alerts**:
  - Configurable boundaries: Normal ($\le 2\%$), Warning ($2\% - 5\%$), Critical ($> 5\%$)
  - Station-level capability tracking table highlighting machines in out-of-control states
- **Automated Report Generation**:
  - Download official executive PDF dossiers with ReportLab
  - Export comprehensive dataset analytics in CSV format
- **PostgreSQL Relational Analytical Mirror**:
  - Demonstrates advanced SQL queries with joins, window functions (`DENSE_RANK`, `SUM() OVER ()`), aggregations, and `CASE` expressions.

---

## 3. Technology Stack

### Frontend
- **Framework**: React 19 + TypeScript + Vite
- **Styling**: Tailwind CSS (Professional navy, white, and slate enterprise theme)
- **Data Visualization**: Recharts (Composed Pareto charts, Line charts, Bar charts, Pie charts)
- **Routing**: React Router DOM v7
- **HTTP Client**: Axios with automated Firebase token attachment interceptors
- **Icons**: Lucide React
- **Cloud SDK**: Firebase Modular JavaScript SDK (v13+)

### Backend
- **Framework**: Python 3.11+ / FastAPI (REST API with OpenAPI / Swagger)
- **Validation**: Pydantic v2 & Pydantic-Settings
- **ORM & Database**: SQLAlchemy 2.0 + PostgreSQL (with SQLite zero-config fallback)
- **Migrations**: Alembic
- **Analytics Engine**: Pure Python mathematical and statistical package with Pandas compatibility
- **PDF Generation**: ReportLab
- **Testing**: Pytest, HTTPX, Starlette TestClient

### Cloud Services
- **Firebase Authentication**: User identity, JWT issuance, and session state
- **Firebase Firestore**: Reactive document store for user preferences, inspections, and 5 Whys subcollections
- **Cloudinary**: High-performance image storage and CDN for defect photographs

---

## 4. System Architecture & Dual-Store Rationale

```
+-------------------------------------------------------------------------------+
|                            REACT 19 FRONTEND                                  |
|   Dashboard | CSV Imports | Defect Analysis | 5 Whys | Monitoring | Reports   |
+----------------------+---------------------------------+----------------------+
                       |                                 |
           Auth State & Direct Uploads          Authenticated REST API (JWT)
                       |                                 |
                       v                                 v
+----------------------+------------+      +-------------+----------------------+
|       FIREBASE & CLOUDINARY       |      |           FASTAPI BACKEND          |
|  - Firebase Auth                  |      |  - Token Verification Middleware   |
|  - Cloud Firestore Documents      |      |  - CSV Ingestion & Quality Engine  |
|  - Cloudinary Image Storage       |      |  - 5 Whys CAPA Investigation Logic |
+-----------------------------------+      +-------------+----------------------+
                                                         |
                                             SQLAlchemy Idempotent Sync
                                                         |
                                                         v
                                           +-------------+----------------------+
                                           |    POSTGRESQL RELATIONAL MIRROR    |
                                           |  - Normalized Star Schema          |
                                           |  - Window Functions & Aggregations |
                                           |  - Idempotent Sync Logs            |
                                           +------------------------------------+
```

### Why a Dual-Store Architecture?
1. **Firestore as Primary Application Document Store**: Offers schema flexibility for evolving operational checklists, real-time client reactivity, and nested subcollections (`why_steps`, `activity_history`).
2. **PostgreSQL as Analytical Mirror**: In industrial analytics, querying 100,000+ inspection rows across multiple dimensions requires indexed SQL window functions (`SUM() OVER (ORDER BY ...)`), multi-table joins, and grouped aggregations. Running these directly on document databases leads to costly collection scans. The FastAPI synchronization service idempotently mirrors validated records into normalized relational tables.

---

## 5. Configuration & Project Credentials

### Firebase Configuration (Supplied in Frontend)
Initialised in `frontend/src/config/firebase.ts`:
```typescript
const firebaseConfig = {
  apiKey: "AIzaSyAa96WjvGauwQTUf-_KKG8AId4KwNyHeTQ",
  authDomain: "quality-lens-c174e.firebaseapp.com",
  projectId: "quality-lens-c174e",
  storageBucket: "quality-lens-c174e.firebasestorage.app",
  messagingSenderId: "835016759265",
  appId: "1:835016759265:web:d4dfaa3cb4fdc28ec324a0",
  measurementId: "G-0LPHBW1KT0"
};
```

### Cloudinary Configuration
- **Cloud Name**: `dlvjvskje`
- **Upload Preset**: `Quality lens`
- Configured for unsigned uploads directly from client with MIME and file size validation (10 MB cap).

---

## 6. Installation & Quick Start

### Prerequisites
- Python 3.10+
- Node.js 18+ and npm
- (Optional) Docker & Docker Compose for PostgreSQL container

### 1. Clone & Setup Environment
```bash
git clone https://github.com/your-username/qualitylens.git
cd qualitylens

# Copy environment configuration
cp .env.example .env
```

### 2. Backend Setup
```bash
# Install backend requirements
pip install -r backend/requirements.txt

# Seed database with 1,200 synthetic manufacturing inspection records
python scripts/generate_sample_data.py
python scripts/seed_database.py

# Run FastAPI backend server
python -m uvicorn app.main:app --app-dir backend --reload --port 8000
```
Backend API will be accessible at `http://localhost:8000` with Swagger documentation at `http://localhost:8000/docs`.

### 3. Frontend Setup
```bash
cd frontend
npm install
npm run dev
```
Frontend application will be accessible at `http://localhost:5173`.

### 4. Reviewer One-Click Demo Login
On the login screen, click **"One-Click Reviewer / Demo Login"** to enter the application immediately with full engineer privileges without needing to manually register an email address!

---

## 7. Running via Docker Compose

```bash
docker-compose up --build
```
This launches:
- **PostgreSQL 15** container on port 5432
- **FastAPI backend** container on port 8000
- **Nginx production frontend** on port 80

---

## 8. Automated Testing

### Backend Test Suite (Pytest)
```bash
python -m pytest backend/tests
```
Executes 11 automated test suites covering:
- Health check & Firebase token verification
- CSV schema & syntax validation
- Deliberate error detection (negative units, corrupted dates, defect count exceeding inspected units)
- Mathematical calculations (Defect Rate, First Pass Yield, Pareto ranking)
- Root cause investigation creation & 5 Whys updates
- Official PDF & CSV report generation
- Full 10-step end-to-end engineering integration lifecycle

### Frontend Test Suite (Vitest + React Testing Library)
```bash
cd frontend
npm run test
```
Executes component tests verifying KPI card rendering, badge coloring, and Cloudinary file upload validation.

---

## 9. Advanced SQL Query Portfolio

QualityLens includes 10 production SQL queries demonstrating relational analytics in `documentation/database_schema.md`. Example of Query 2 (Pareto Analysis with Window Functions):

```sql
WITH CategoryAgg AS (
    SELECT 
        d.defect_category,
        COUNT(d.id) AS failure_count,
        SUM(i.defective_units) AS total_defects
    FROM defects d
    JOIN inspections i ON d.inspection_id = i.id
    WHERE d.defect_category != 'None'
    GROUP BY d.defect_category
),
CategoryMetrics AS (
    SELECT 
        defect_category,
        total_defects,
        ROUND((total_defects::numeric / SUM(total_defects) OVER ()) * 100.0, 2) AS contribution_pct,
        ROUND(
            SUM(total_defects::numeric) OVER (
                ORDER BY total_defects DESC 
                ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW
            ) / SUM(total_defects) OVER () * 100.0, 
            2
        ) AS cumulative_pct
    FROM CategoryAgg
)
SELECT 
    defect_category,
    total_defects,
    contribution_pct,
    cumulative_pct,
    CASE 
        WHEN cumulative_pct <= 80.0 OR (cumulative_pct > 80.0 AND LAG(cumulative_pct, 1, 0) OVER () < 80.0) 
        THEN 'Vital Few (Priority 1 Target)'
        ELSE 'Useful Many'
    END AS pareto_classification
FROM CategoryMetrics
ORDER BY total_defects DESC;
```

---

## 10. Navigation Pages Overview

| Page | Description | Key Components |
| :--- | :--- | :--- |
| **1. Overview** | Executive summary & real-time monitoring | 6 KPI Cards, Defect Trend Line Chart, Pareto Chart with 80% line, Line Comparison Bar Chart, Severity Breakdown Pie Chart, Recent Investigations |
| **2. Data Imports** | CSV ingestion & pre-import validation engine | File drag & drop, downloadable template, validation report (missing values, duplicates, rule failures), valid record preview, batch commit |
| **3. Defect Analysis** | Statistical failure mode exploration | Filters by line, machine, shift, product, category; dynamic Pareto table; vital few classification; worst-performing station isolation |
| **4. Investigations** | Root cause problem solving module | 5 Whys causal analysis form, hypothesis verification notes, CAPA planning (corrective & preventive actions), Cloudinary evidence links |
| **5. Quality Monitoring** | Real-time station compliance tracking | Normal / Warning / Critical thresholds; station capability matrix; breach alert notifications; configurable limits dialog |
| **6. Reports** | Executive documentation generator | Filtered scope selection; dynamic KPI summary; downloadable official PDF dossier; CSV raw data export |
| **7. Image Evidence** | Visual defect photo archive | Cloudinary integration; upload progress; search by category and notes; photo modal with inspection IDs |
| **8. Settings** | System architecture & mirror health | User profile, PostgreSQL mirror status, sync log audit, Cloudinary parameters, architecture rationale |

---

## 11. Project Directory Structure

```
qualitylens/
├── backend/
│   ├── app/
│   │   ├── api/             # FastAPI routers (auth, dashboard, analytics, imports, investigations, etc.)
│   │   ├── core/            # Config, security, and Firebase Admin setup
│   │   ├── database/        # SQLAlchemy engine and session
│   │   ├── models/          # Relational tables (products, lines, machines, inspections, defects, etc.)
│   │   ├── schemas/         # Pydantic v2 schemas for all requests and responses
│   │   ├── imports/         # CSV validation engine & error reporter
│   │   ├── analytics/       # Mathematical formulas (KPIs, Pareto, trends, anomalies)
│   │   ├── services/        # Relational sync service & ReportLab PDF generator
│   │   └── main.py          # FastAPI application entrypoint
│   ├── tests/               # Pytest suite & end-to-end integration tests
│   ├── Dockerfile
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── components/      # Common UI (KPICard, FilterBar, AppLayout, Navbar, Sidebar)
│   │   ├── contexts/        # AuthContext (Firebase auth & one-click demo mode)
│   │   ├── pages/           # 8 primary navigation pages
│   │   ├── services/        # Axios API client & Cloudinary upload service
│   │   ├── config/          # Firebase modular client initialization
│   │   ├── tests/           # Vitest and React Testing Library tests
│   │   └── App.tsx          # React Router setup
│   ├── Dockerfile
│   ├── nginx.conf
│   └── package.json
├── sample_data/
│   ├── sample_quality_data.csv   # 1,200 valid synthetic inspection records across 6 months
│   └── invalid_quality_data.csv  # Deliberately malformed CSV to test validation engine
├── documentation/
│   ├── architecture.md           # System architecture & data flow diagrams
│   ├── database_schema.md        # Relational ERD & 10 analytical SQL queries
│   ├── firestore_schema.md       # Firestore document schemas & security rules
│   ├── analytics_methodology.md  # KPI formulas & Pareto mathematical definitions
│   ├── api_documentation.md      # API endpoint catalog
│   └── security.md               # Credential hygiene & token verification
├── scripts/
│   ├── generate_sample_data.py   # Synthetic data generator
│   └── seed_database.py          # Database seeding script
├── docker-compose.yml
├── .env.example
├── .gitignore
└── README.md
```

---

## 12. Known Limitations & Future Enhancements

- **Real-Time Streaming**: Currently, inspection data is ingested via CSV batches. A future enhancement is integrating Apache Kafka or MQTT for sub-second telemetry ingestion directly from factory PLC controllers.
- **AI-Assisted Causal Hypothesis Generation**: Machine learning anomaly models (e.g. Isolation Forests) can be connected to propose candidate questions for the human investigator during the 5 Whys workflow, while preserving the strict rule that human engineers must verify true root causes.

---

## 13. License & Author

Developed by a Graduate Quality Analytics & Automation Engineer as a technical demonstration portfolio project.  
Licensed under the **MIT License**.
