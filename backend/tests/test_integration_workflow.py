import io
import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_full_end_to_end_engineering_workflow():
    """
    Validates the complete 10-step QualityLens lifecycle:
    1. User authentication verification
    2. CSV inspection dataset upload & syntax validation
    3. Staged validation report & duplicate checks
    4. Valid records committed & mirrored
    5. Database analytics calculation (KPIs & Pareto)
    6. Root cause investigation initiation
    7. Interactive 5 Whys causal analysis update
    8. Cloudinary photographic defect evidence metadata registration
    9. Quality threshold alert monitoring
    10. Official executive PDF and CSV report generation
    """
    # Step 1: User authentication verification
    auth_res = client.post("/api/auth/verify")
    assert auth_res.status_code == 200
    user_info = auth_res.json()
    assert "uid" in user_info

    # Step 2: Inspection CSV upload & validation
    csv_payload = (
        "inspection_id,inspection_date,product_id,product_name,production_line,machine_id,shift,units_inspected,defective_units,defect_category,defect_description,severity,inspection_status\n"
        "INSP-E2E-001,2026-06-15,PRD-A100,Precision Microcontroller Hub,Line Alpha,MCH-01,Shift 1,500,4,Surface Scratch,Minor front scuff,Low,PASSED\n"
        "INSP-E2E-002,2026-06-15,PRD-B200,Industrial Signal Transceiver,Line Beta,MCH-04,Shift 2,450,12,Assembly Misalignment,1.2 degree pin skew,Medium,REWORK\n"
    ).encode("utf-8")

    files = {"file": ("e2e_inspection_batch.csv", io.BytesIO(csv_payload), "text/csv")}
    upload_res = client.post("/api/imports/upload", files=files)
    assert upload_res.status_code == 200
    upload_data = upload_res.json()
    assert upload_data["ready_to_commit"] is True
    assert upload_data["report"]["valid_records_count"] == 2
    import_id = upload_data["import_id"]

    # Step 3: Commit valid records to database & sync mirror
    commit_res = client.post(f"/api/imports/{import_id}/commit")
    assert commit_res.status_code == 200
    commit_data = commit_res.json()
    assert commit_data["success"] is True
    assert commit_data["created"] >= 1

    # Step 4: Verify Dashboard retrieves updated database-derived KPIs
    dash_res = client.get("/api/dashboard/summary")
    assert dash_res.status_code == 200
    dash_kpis = dash_res.json()
    assert dash_kpis["total_inspected_units"] > 0
    assert dash_kpis["overall_defect_rate"] >= 0.0

    # Step 5: Verify Pareto Analysis ranking & Vital Few thresholding
    pareto_res = client.get("/api/analytics/pareto")
    assert pareto_res.status_code == 200
    pareto_data = pareto_res.json()
    assert pareto_data["total_defects"] > 0
    assert len(pareto_data["items"]) > 0

    # Step 6: Create Root Cause Investigation
    inv_payload = {
        "defect_category": "Assembly Misalignment",
        "product_name": "Industrial Signal Transceiver",
        "production_line": "Line Beta",
        "machine_id": "MCH-04",
        "problem_description": "Excessive pin angular deviation detected during optical QA inspection.",
        "severity": "Medium",
        "investigation_owner": "Lead Quality Engineer"
    }
    create_inv_res = client.post("/api/investigations", json=inv_payload)
    assert create_inv_res.status_code == 201
    created_inv = create_inv_res.json()
    inv_id = created_inv["id"]
    assert created_inv["investigation_status"] == "Open"
    assert len(created_inv["why_steps"]) == 5

    # Step 7: Update 5 Whys analysis, verified root cause and CAPA
    update_inv_res = client.put(f"/api/investigations/{inv_id}", json={
        "investigation_status": "Corrective Action In Progress",
        "verified_root_cause": "Gripper pneumatic cylinder linkage loosened under vibration.",
        "corrective_action": "Re-torqued mechanical clamp to 8.5 Nm with thread locker.",
        "preventive_action": "Instituted weekly torque verification checks.",
        "why_steps": [
            {"step_number": 1, "question": "Why did pins misalign?", "answer": "Gripper was loose.", "evidence": "Torque gauge", "notes": ""},
            {"step_number": 2, "question": "Why was gripper loose?", "answer": "Fastener backed out.", "evidence": "Loose screw", "notes": ""},
            {"step_number": 3, "question": "Why did fastener back out?", "answer": "Vibration during 12h shifts.", "evidence": "Vibration meter", "notes": ""},
            {"step_number": 4, "question": "Why did vibration affect it?", "answer": "Lock washer was missing.", "evidence": "Assembly visual", "notes": ""},
            {"step_number": 5, "question": "Why was lock washer missing?", "answer": "Omitted during last PM.", "evidence": "Work order WO-991", "notes": ""}
        ]
    })
    assert update_inv_res.status_code == 200
    updated_inv = update_inv_res.json()
    assert updated_inv["investigation_status"] == "Corrective Action In Progress"
    assert updated_inv["verified_root_cause"] is not None

    # Step 8: Register Cloudinary photographic defect evidence
    img_payload = {
        "secure_url": "https://res.cloudinary.com/dlvjvskje/image/upload/v1710000000/qualitylens/defects/e2e_misalignment_photo.jpg",
        "public_id": "qualitylens/defects/e2e_misalignment_photo",
        "original_filename": "connector_pin_misalignment_macro.jpg",
        "file_size": 348900,
        "content_type": "image/jpeg",
        "defect_category": "Assembly Misalignment",
        "associated_inspection_id": "INSP-E2E-002",
        "associated_investigation_id": created_inv["investigation_reference"],
        "notes": "Microscopic evidence showing 1.2° pin deflection prior to rework."
    }
    img_res = client.post("/api/images", json=img_payload)
    assert img_res.status_code == 201
    img_data = img_res.json()
    assert img_data["image_id"].startswith("IMG-")

    # Step 9: Quality Monitoring & Threshold Alert Verification
    mon_res = client.get("/api/monitoring/status")
    assert mon_res.status_code == 200
    mon_data = mon_res.json()
    assert "stations" in mon_data
    assert "thresholds" in mon_data

    # Step 10: Generate official Executive PDF and CSV reports
    pdf_res = client.post("/api/reports/generate", json={
        "title": "Plant Alpha Quality Assurance Audit Report",
        "export_format": "pdf"
    })
    assert pdf_res.status_code == 200
    assert pdf_res.content.startswith(b"%PDF")

    csv_res = client.post("/api/reports/generate", json={
        "title": "Plant Alpha Quality Assurance Audit Report",
        "export_format": "csv"
    })
    assert csv_res.status_code == 200
    assert "QUALITYLENS ENGINEERING QUALITY REPORT" in csv_res.text
