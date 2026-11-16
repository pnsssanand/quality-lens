# QualityLens – Relational Database Schema & Analytical SQL Queries

## 1. Relational Entity-Relationship Model

```
+------------------+         +--------------------+         +------------------+
|     products     |         |  production_lines  |         |     machines     |
+------------------+         +--------------------+         +------------------+
| id (PK)          |         | id (PK)            |         | id (PK)          |
| product_id (UK)  |         | line_name (UK)     |         | machine_id (UK)  |
| product_name     |         | location           |         | machine_name     |
| description      |         | created_at         |         | production_line_id (FK)|
| created_at       |         +---------+----------+         | created_at       |
+--------+---------+                   |                    +--------+---------+
         |                             |                             |
         |                             +---------------+             |
         +-----------------------+                     |             |
                                 v                     v             v
                           +-----+---------------------+-------------+----+
                           |                  inspections                 |
                           +----------------------------------------------+
                           | id (PK)                                      |
                           | inspection_id (UK)                           |
                           | inspection_date (INDEX)                      |
                           | product_id (FK)                              |
                           | production_line_id (FK)                      |
                           | machine_id (FK)                              |
                           | shift                                        |
                           | units_inspected                              |
                           | defective_units                              |
                           | units_passed_first_inspection                |
                           | inspection_status                            |
                           | source_import_id (FK)                        |
                           | created_at / updated_at                      |
                           +----------------------+-----------------------+
                                                  |
                                                  v
                                       +----------+-----------+
                                       |        defects       |
                                       +----------------------+
                                       | id (PK)              |
                                       | inspection_id (FK)   |
                                       | defect_category (IDX)|
                                       | defect_description   |
                                       | severity (IDX)       |
                                       | image_url            |
                                       | created_at           |
                                       +----------+-----------+
                                                  |
                                                  v
                                       +----------+-----------+
                                       |    investigations    |
                                       +----------------------+
                                       | id (PK)              |
                                       | investigation_ref    |
                                       | defect_id (FK)       |
                                       | problem_description  |
                                       | severity             |
                                       | investigation_status |
                                       | verified_root_cause  |
                                       | corrective_action    |
                                       | preventive_action    |
                                       +----------------------+
```

---

## 2. Documented Analytical SQL Queries (Demonstrating Advanced SQL)

The following ten SQL queries demonstrate production analytical patterns used by quality analytics and automation engineers:

### Query 1: Executive KPI Aggregation with Safe Division
Computes total inspected, total defective, overall defect rate, and First Pass Yield across all lines.
```sql
SELECT 
    COUNT(i.id) AS total_inspections,
    SUM(i.units_inspected) AS total_units_inspected,
    SUM(i.defective_units) AS total_defective_units,
    ROUND(
        (SUM(i.defective_units)::numeric / NULLIF(SUM(i.units_inspected), 0)) * 100.0, 
        2
    ) AS overall_defect_rate_pct,
    ROUND(
        (SUM(i.units_passed_first_inspection)::numeric / NULLIF(SUM(i.units_inspected), 0)) * 100.0, 
        2
    ) AS first_pass_yield_pct
FROM inspections i;
```

### Query 2: Pareto Failure Mode Distribution with Cumulative Window Functions
Calculates defect frequency, percentage contribution, running cumulative percentage, and applies the 80% vital-few threshold cutoff.
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

### Query 3: Machine Performance Benchmark with Defect Rate Thresholding
Joins machines, production lines, and inspections to benchmark station performance and classify status using `CASE`.
```sql
SELECT 
    m.machine_id,
    m.machine_name,
    pl.line_name,
    SUM(i.units_inspected) AS inspected_units,
    SUM(i.defective_units) AS defective_units,
    ROUND((SUM(i.defective_units)::numeric / NULLIF(SUM(i.units_inspected), 0)) * 100.0, 2) AS defect_rate_pct,
    CASE 
        WHEN (SUM(i.defective_units)::numeric / NULLIF(SUM(i.units_inspected), 0)) * 100.0 > 5.0 THEN 'CRITICAL'
        WHEN (SUM(i.defective_units)::numeric / NULLIF(SUM(i.units_inspected), 0)) * 100.0 > 2.0 THEN 'WARNING'
        ELSE 'NORMAL'
    END AS station_quality_status
FROM machines m
JOIN production_lines pl ON m.production_line_id = pl.id
LEFT JOIN inspections i ON m.id = i.machine_id
GROUP BY m.id, m.machine_id, m.machine_name, pl.line_name
ORDER BY defect_rate_pct DESC;
```

### Query 4: Shift-to-Shift Variance Analysis (Morning vs. Evening vs. Night)
Examines whether specific manufacturing shifts display statistically significant differences in defect generation.
```sql
SELECT 
    i.shift,
    COUNT(i.id) AS inspection_count,
    SUM(i.units_inspected) AS total_units_inspected,
    SUM(i.defective_units) AS total_defective_units,
    ROUND((SUM(i.defective_units)::numeric / NULLIF(SUM(i.units_inspected), 0)) * 100.0, 2) AS shift_defect_rate,
    ROUND(AVG(i.defective_units), 2) AS avg_defects_per_inspection
FROM inspections i
GROUP BY i.shift
ORDER BY shift_defect_rate DESC;
```

### Query 5: Weekly Moving Average Trend (Rolling Quality Capability)
Computes a 3-week rolling average defect rate to filter out high-frequency noise and reveal true process drift.
```sql
WITH WeeklyStats AS (
    SELECT 
        DATE_TRUNC('week', i.inspection_date) AS inspection_week,
        SUM(i.units_inspected) AS weekly_inspected,
        SUM(i.defective_units) AS weekly_defective,
        ROUND((SUM(i.defective_units)::numeric / NULLIF(SUM(i.units_inspected), 0)) * 100.0, 2) AS weekly_defect_rate
    FROM inspections i
    GROUP BY DATE_TRUNC('week', i.inspection_date)
)
SELECT 
    inspection_week,
    weekly_inspected,
    weekly_defective,
    weekly_defect_rate,
    ROUND(
        AVG(weekly_defect_rate) OVER (
            ORDER BY inspection_week 
            ROWS BETWEEN 2 PRECEDING AND CURRENT ROW
        ), 
        2
    ) AS rolling_3week_avg_defect_rate
FROM WeeklyStats
ORDER BY inspection_week ASC;
```

### Query 6: Top Failure Mode for Each Workstation (Using DENSE_RANK)
Pinpoints the dominant defect category per machine station using window partitioning.
```sql
WITH MachineFailureModes AS (
    SELECT 
        m.machine_id,
        d.defect_category,
        COUNT(d.id) AS mode_occurrences,
        SUM(i.defective_units) AS total_mode_defects,
        DENSE_RANK() OVER (
            PARTITION BY m.machine_id 
            ORDER BY SUM(i.defective_units) DESC
        ) AS rank_order
    FROM machines m
    JOIN inspections i ON m.id = i.machine_id
    JOIN defects d ON i.id = d.inspection_id
    WHERE d.defect_category != 'None'
    GROUP BY m.machine_id, d.defect_category
)
SELECT 
    machine_id,
    defect_category AS primary_failure_mode,
    total_mode_defects
FROM MachineFailureModes
WHERE rank_order = 1
ORDER BY total_mode_defects DESC;
```

### Query 7: Product Model Non-Conformance Profiling
Ranks manufactured products by non-conformance rate and rework volume.
```sql
SELECT 
    p.product_id,
    p.product_name,
    COUNT(i.id) AS total_batches,
    SUM(i.units_inspected) AS units_inspected,
    SUM(i.defective_units) AS defective_units,
    ROUND((SUM(i.defective_units)::numeric / NULLIF(SUM(i.units_inspected), 0)) * 100.0, 2) AS defect_rate_pct,
    COUNT(CASE WHEN i.inspection_status = 'REWORK' THEN 1 END) AS rework_events_count
FROM products p
JOIN inspections i ON p.id = i.product_id
GROUP BY p.id, p.product_id, p.product_name
ORDER BY defect_rate_pct DESC;
```

### Query 8: Statistical Anomaly Detection (Stations Exceeding 2 Standard Deviations)
Identifies inspections with defect rates exceeding 2 standard deviations above line mean.
```sql
WITH LineStats AS (
    SELECT 
        production_line_id,
        AVG((defective_units::numeric / NULLIF(units_inspected, 0)) * 100.0) AS mean_line_rate,
        STDDEV_POP((defective_units::numeric / NULLIF(units_inspected, 0)) * 100.0) AS std_line_rate
    FROM inspections
    GROUP BY production_line_id
)
SELECT 
    i.inspection_id,
    i.inspection_date,
    pl.line_name,
    m.machine_id,
    i.units_inspected,
    i.defective_units,
    ROUND(((i.defective_units::numeric / i.units_inspected) * 100.0), 2) AS actual_defect_rate,
    ROUND(ls.mean_line_rate, 2) AS expected_line_mean,
    ROUND(ls.mean_line_rate + (2 * ls.std_line_rate), 2) AS upper_control_limit_2sigma
FROM inspections i
JOIN LineStats ls ON i.production_line_id = ls.production_line_id
JOIN production_lines pl ON i.production_line_id = pl.id
JOIN machines m ON i.machine_id = m.id
WHERE ((i.defective_units::numeric / i.units_inspected) * 100.0) > (ls.mean_line_rate + (2 * ls.std_line_rate))
  AND i.units_inspected >= 200
ORDER BY actual_defect_rate DESC;
```

### Query 9: Root Cause Investigation Closure & CAPA Cycle Time
Measures engineering response time and corrective action progress across departments.
```sql
SELECT 
    inv.investigation_reference,
    inv.defect_category,
    inv.severity,
    inv.investigation_owner,
    inv.investigation_status,
    inv.date_opened,
    inv.date_closed,
    CASE 
        WHEN inv.date_closed IS NOT NULL THEN (DATE_PART('day', inv.date_closed - inv.date_opened))
        ELSE (DATE_PART('day', NOW() - inv.date_opened))
    END AS days_open,
    CASE 
        WHEN inv.verified_root_cause IS NOT NULL THEN 'Root Cause Verified'
        ELSE 'Under Causal Investigation'
    END AS engineering_status
FROM investigations inv
ORDER BY days_open DESC;
```

### Query 10: Relational Mirror Consistency & Ingestion Sync Audit
Verifies synchronization health between incoming ingestion batches and relational tables.
```sql
SELECT 
    di.import_id,
    di.filename,
    di.total_records AS declared_in_csv,
    di.valid_records AS valid_in_csv,
    COUNT(i.id) AS mirrored_in_postgres,
    sl.sync_status AS last_logged_sync_status,
    sl.synced_at
FROM data_imports di
LEFT JOIN inspections i ON di.id = i.source_import_id
LEFT JOIN sync_logs sl ON di.firestore_document_id = sl.firestore_document_id
GROUP BY di.id, di.import_id, di.filename, di.total_records, di.valid_records, sl.sync_status, sl.synced_at
ORDER BY di.created_at DESC;
```
