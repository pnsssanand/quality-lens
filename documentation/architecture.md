# QualityLens – System Architecture Documentation

## 1. Executive Summary

**QualityLens** is an enterprise-grade engineering quality monitoring and root cause intelligence platform designed for manufacturing operations, quality analytics, and automation engineering.

The application bridges two distinct data paradigms:
1. **Application State & Document Store (Firebase Firestore)**: Fast, schema-flexible reactive storage for user profiles, inspection metadata, image references, and interactive 5 Whys investigation steps.
2. **Relational Analytical Mirror (PostgreSQL / SQLAlchemy)**: Normalized, relational schema optimized for aggregations, SQL joins, grouping, Pareto distribution calculations, and window functions.

---

## 2. High-Level Architecture Diagram

```
+-----------------------------------------------------------------------------------+
|                                  USER BROWSER                                     |
|  React 19 + TypeScript + Vite + Tailwind CSS + Recharts + Lucide Icons           |
+--------------------------+------------------------------+-------------------------+
                           |                              |
               Auth & Token Retrieval          API Requests / Multi-part Uploads
                           |                              |
                           v                              v
+--------------------------+--------+    +----------------+-------------------------+
|    FIREBASE CLOUD SERVICES        |    |         FASTAPI PYTHON BACKEND           |
|                                   |    |                                          |
|  - Firebase Authentication        |    |  - Pydantic Schemas & Request Validation |
|  - Cloud Firestore Document Store |    |  - CSV Ingestion & Quality Validation    |
|    - users/                       |    |  - Math & Statistical Analytics Engine   |
|    - inspections/                 |    |  - 5 Whys Root Cause Workflow Manager    |
|    - investigations/              |    |  - ReportLab PDF Generation Service      |
|    - image_evidence/              |    |  - Idempotent Database Synchronizer      |
+-----------------------------------+    +----------------+-------------------------+
                           ^                              |
               Direct Unsigned Image                      | SQLAlchemy Session
                      Uploads                             v
                           |             +----------------+-------------------------+
                           v             |       POSTGRESQL ANALYTICAL MIRROR       |
+--------------------------+--------+    |                                          |
|       CLOUDINARY STORAGE          |    |  - products, production_lines, machines  |
|                                   |    |  - inspections, defects, investigations  |
|  - Cloud Name: dlvjvskje          |    |  - sync_logs, quality_thresholds         |
|  - Preset: Quality lens           |    |  - Indexes & Relational Foreign Keys     |
+-----------------------------------+    +------------------------------------------+
```

---

## 3. Data Pipeline & Synchronization Workflow

```
[User CSV Upload]
       |
       v
[Validator Module] ---> (Errors Found) ---> [Quarantine & Validation Report Returned]
       |
 (All Rows Valid)
       |
       v
[Staged in Cache]
       |
       v
[Commit & Sync Pipeline]
       |
       +---> Write Document Records to Firebase Firestore
       |
       +---> Idempotent Upsert to PostgreSQL Analytical Mirror
                - Ensure Product, Line, Machine entities exist
                - Insert/Update Inspections & Defects
                - Log Sync Status in sync_logs table
```

---

## 4. Key Architectural Trade-Offs

| Decision | Alternative Considered | Rationale |
| :--- | :--- | :--- |
| **Dual Data Store (Firestore + PostgreSQL)** | Single database only | Mirrors real-world enterprise architectures where reactive frontends interact with flexible document state, while analytical engines execute heavy relational SQL window functions and aggregations without degrading client read performance. |
| **Client-Direct Cloudinary Uploads** | Routing binary images through FastAPI backend | Drastically reduces backend server bandwidth, eliminates memory bottlenecks for high-resolution defect macro photos, and leverages Cloudinary's global CDN. |
| **Strict Pre-Commit Validation** | Permissive import with lazy cleaning | In high-precision engineering quality control, malformed data (negative units, defects exceeding inspected units) degrades analytics and destroys confidence in FPY and Pareto results. |
