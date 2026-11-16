import pytest
import io
import datetime
from fastapi.testclient import TestClient
from app.main import app
from app.imports.validator import CSVInspectionValidator
from app.analytics.engine import QualityAnalyticsEngine

client = TestClient(app)

def test_health_check():
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json() == {"status": "healthy"}

def test_auth_verify():
    response = client.post("/api/auth/verify")
    assert response.status_code == 200
    data = response.json()
    assert "uid" in data
    assert "email" in data

def test_csv_template_download():
    response = client.get("/api/imports/template")
    assert response.status_code == 200
    assert response.headers["content-type"].startswith("text/csv")
    assert "inspection_id,inspection_date" in response.text

def test_csv_validation_valid():
    valid_csv = (
        "inspection_id,inspection_date,product_id,product_name,production_line,machine_id,shift,units_inspected,defective_units,defect_category,defect_description,severity,inspection_status\n"
        "INSP-VAL-001,2026-05-01,PRD-A100,Precision Hub,Line Alpha,MCH-01,Shift 1,500,5,Surface Scratch,Scratch,Low,PASSED\n"
    ).encode("utf-8")
    report, valid, invalid = CSVInspectionValidator.validate_csv_content(valid_csv, "test.csv")
    assert report.total_records == 1
    assert len(valid) == 1
    assert len(invalid) == 0
    assert report.is_valid_for_import is True

def test_csv_validation_invalid_rules():
    invalid_csv = (
        "inspection_id,inspection_date,product_id,product_name,production_line,machine_id,shift,units_inspected,defective_units,defect_category,defect_description,severity,inspection_status\n"
        "INSP-ERR-001,2026-05-01,PRD-A100,Precision Hub,Line Alpha,MCH-01,Shift 1,100,200,Surface Scratch,Exceeds,Low,FAILED\n"
        "INSP-ERR-002,NOT_A_DATE,PRD-A100,Precision Hub,Line Alpha,MCH-01,Shift 1,100,5,Surface Scratch,Bad date,Low,FAILED\n"
        "INSP-ERR-003,2026-05-02,PRD-A100,Precision Hub,Line Alpha,MCH-01,Shift 1,-50,0,None,,None,PASSED\n"
    ).encode("utf-8")
    report, valid, invalid = CSVInspectionValidator.validate_csv_content(invalid_csv, "test_err.csv")
    assert report.total_records == 3
    assert len(invalid) == 3
    assert len(valid) == 0
    assert len(report.errors) >= 3

def test_analytics_kpi_calculations():
    sample_records = [
        {"units_inspected": 500, "defective_units": 10, "units_passed_first_inspection": 490, "defect_category": "Surface Scratch"},
        {"units_inspected": 500, "defective_units": 0, "units_passed_first_inspection": 500, "defect_category": "None"},
    ]
    kpis = QualityAnalyticsEngine.calculate_kpis(sample_records)
    assert kpis.total_inspected_units == 1000
    assert kpis.total_defective_units == 10
    assert kpis.overall_defect_rate == 1.0 # 10 / 1000 * 100
    assert kpis.first_pass_yield == 99.0 # 990 / 1000 * 100
    assert kpis.threshold_status == "NORMAL"

def test_analytics_pareto_calculation():
    sample_records = [
        {"defective_units": 80, "defect_category": "Surface Scratch"},
        {"defective_units": 15, "defect_category": "Dimensional Deviation"},
        {"defective_units": 5, "defect_category": "Material Crack"},
    ]
    pareto = QualityAnalyticsEngine.calculate_pareto(sample_records)
    assert pareto.total_defects == 100
    assert len(pareto.items) == 3
    assert pareto.items[0].category == "Surface Scratch"
    assert pareto.items[0].percentage == 80.0
    assert pareto.items[0].cumulative_percentage == 80.0
    assert "Surface Scratch" in pareto.vital_few_categories

def test_dashboard_endpoints():
    res_summary = client.get("/api/dashboard/summary")
    assert res_summary.status_code == 200
    data = res_summary.json()
    assert "total_inspected_units" in data
    assert "overall_defect_rate" in data
    assert "first_pass_yield" in data

    res_trends = client.get("/api/dashboard/defect-trends?grouping=daily")
    assert res_trends.status_code == 200
    assert "points" in res_trends.json()

    res_lines = client.get("/api/dashboard/production-line-comparison")
    assert res_lines.status_code == 200
    assert isinstance(res_lines.json(), list)

def test_investigations_workflow():
    payload = {
        "defect_category": "Material Crack",
        "product_name": "Edge AI Sensor Node",
        "production_line": "Line Gamma",
        "machine_id": "MCH-05",
        "problem_description": "Micro-cracking around mounting hole during fastener tightening.",
        "severity": "High",
        "investigation_owner": "Test Quality Engineer",
        "observed_evidence": "Scanning electron microscope image showing shear stress.",
        "why_steps": [
            {"step_number": 1, "question": "Why did hole crack?", "answer": "Torque exceeded rating.", "evidence": "Torque log", "notes": ""}
        ]
    }
    create_res = client.post("/api/investigations", json=payload)
    assert create_res.status_code == 201
    inv_data = create_res.json()
    assert "id" in inv_data
    inv_id = inv_data["id"]

    # Update investigation
    update_res = client.put(f"/api/investigations/{inv_id}", json={
        "investigation_status": "Root Cause Identified",
        "verified_root_cause": "Driver calibration torque off by 2.4 Nm.",
        "corrective_action": "Recalibrated driver and added digital limiter."
    })
    assert update_res.status_code == 200
    assert update_res.json()["investigation_status"] == "Root Cause Identified"

def test_reports_generation_pdf_and_csv():
    # Test CSV report
    csv_res = client.post("/api/reports/generate", json={"export_format": "csv", "title": "Test Quality Report"})
    assert csv_res.status_code == 200
    assert "QUALITYLENS ENGINEERING QUALITY REPORT" in csv_res.text

    # Test PDF report
    pdf_res = client.post("/api/reports/generate", json={"export_format": "pdf", "title": "Test Quality Report"})
    assert pdf_res.status_code == 200
    assert pdf_res.content.startswith(b"%PDF")
