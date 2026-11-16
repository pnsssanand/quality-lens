# QualityLens – API Reference & Endpoints

Base URL: `http://localhost:8000/api`

Interactive Swagger UI: `http://localhost:8000/docs`  
ReDoc Documentation: `http://localhost:8000/redoc`

---

## 1. Authentication
- `POST /api/auth/verify`: Verifies Firebase Bearer token and returns current user profile.

## 2. Ingestion & Validation
- `GET /api/imports/template`: Downloads standard CSV inspection template with valid headers.
- `POST /api/imports/upload`: Multi-part CSV upload. Runs validation checks and returns `ValidationReport`.
- `POST /api/imports/{import_id}/commit`: Commits staged valid records to database & triggers sync.
- `GET /api/imports`: Returns historical data import logs.
- `GET /api/imports/{import_id}`: Fetches metadata for a specific import batch.

## 3. Executive Dashboard
- `GET /api/dashboard/summary`: Computes executive KPIs (inspected units, defective units, defect rate, FPY, threshold status).
- `GET /api/dashboard/defect-trends?grouping=daily|weekly|monthly`: Returns time-series defect trend points.
- `GET /api/dashboard/defects-by-category`: Defect category frequencies.
- `GET /api/dashboard/production-line-comparison`: Production line benchmark metrics.
- `GET /api/dashboard/recent-investigations`: Retrieves active root cause investigation cases.

## 4. Defect Analytics
- `GET /api/analytics/filter-options`: Dynamic distinct values for lines, machines, products, categories.
- `GET /api/analytics/pareto`: Pareto ranking, cumulative percentages, and 80% vital-few flags.
- `GET /api/analytics/defect-analysis`: Comprehensive defect and severity breakdown.
- `GET /api/analytics/machine-performance`: Station-level defect metrics and primary failure modes.
- `GET /api/analytics/anomalies`: Statistical anomaly detection list.

## 5. Root Cause Investigations
- `GET /api/investigations`: Lists investigations with optional status filter.
- `POST /api/investigations`: Initiates new investigation case with pre-populated 5 Whys steps.
- `GET /api/investigations/{id}`: Detailed investigation dossier with full 5 Whys sequence.
- `PUT /api/investigations/{id}`: Updates status, hypotheses, verified root cause, CAPA, and Why steps.

## 6. Process Monitoring
- `GET /api/monitoring/thresholds`: Returns active normal and warning threshold boundaries.
- `PUT /api/monitoring/thresholds`: Updates threshold parameters.
- `GET /api/monitoring/status`: Live station monitoring table with warning/critical flags.

## 7. Photographic Evidence
- `GET /api/images`: Lists image evidence records with category and text search.
- `POST /api/images`: Registers image metadata after Cloudinary upload.
- `DELETE /api/images/{id}`: Safely removes image metadata record.

## 8. Executive Reports
- `POST /api/reports/generate`: Dynamically compiles and downloads PDF or CSV executive report.

## 9. Mirror Synchronization
- `GET /api/sync/status`: Overall synchronization health and mirror counts.
- `POST /api/sync/run`: Triggers manual sync audit.
