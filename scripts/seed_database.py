import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parent.parent / "backend"))

from app.database.session import SessionLocal, engine, Base
from app.imports.validator import CSVInspectionValidator
from app.services.sync_service import SyncService
from app.models.models import Investigation, InvestigationWhyStep, QualityThreshold, ImageEvidence
import datetime

def seed():
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()

    # 1. Seed quality thresholds
    qt = db.query(QualityThreshold).filter(QualityThreshold.scope == "GLOBAL").first()
    if not qt:
        qt = QualityThreshold(
            threshold_id="TH-GLOBAL",
            firestore_document_id="quality_thresholds/global",
            scope="GLOBAL",
            target_identifier="ALL",
            normal_max=2.0,
            warning_max=5.0,
            updated_by="dev-engineer-seed"
        )
        db.add(qt)
        db.commit()
        print("Default quality thresholds seeded.")

    # 2. Ingest sample inspections
    csv_path = Path(__file__).resolve().parent.parent / "sample_data" / "sample_quality_data.csv"
    if csv_path.exists():
        content = csv_path.read_bytes()
        report, valid_records, _ = CSVInspectionValidator.validate_csv_content(content, "sample_quality_data.csv")
        print(f"Validated {len(valid_records)} records from sample CSV.")
        
        result = SyncService.sync_records_to_database(
            db=db,
            records=valid_records,
            import_id="IMP-SYNTHETIC-001",
            filename="sample_quality_data.csv",
            user_id="seed-user"
        )
        print(f"Sync completed: {result['created']} created, {result['updated']} updated.")

    # 3. Seed investigations with 5 Whys
    if db.query(Investigation).count() == 0:
        inv1 = Investigation(
            investigation_reference="INV-2026-0042",
            firestore_document_id="investigations/INV-2026-0042",
            defect_category="Assembly Misalignment",
            product_name="Industrial Signal Transceiver",
            production_line="Line Beta",
            machine_id="MCH-04",
            problem_description="Recurrent 1.2° pin offset on connector headers during Shift 3 pick-and-place operation.",
            severity="Medium",
            investigation_owner="Senior Quality Analyst",
            investigation_status="Corrective Action In Progress",
            observed_evidence="High rejection rate at optical inspection station; visual verification shows robotic clamp wear.",
            suspected_factors="Thermal expansion of pneumatic arm after 8 hours continuous running and worn guide bushings.",
            root_cause_hypothesis="Pneumatic suction head calibration drifting due to loose mounting screw on axis 2.",
            verified_root_cause="Fatigued mechanical coupling bracket on pneumatic head caused 0.4mm micro-play under load.",
            verification_method="High-speed camera tracking & dial indicator vibration measurement under production load.",
            corrective_action="Replaced pneumatic clamp bracket with hardened steel grade fastener and torqued to 8.5 Nm.",
            preventive_action="Added 200-hour preventive torque inspection check to shift hand-over digital checklist.",
            date_opened=datetime.datetime.utcnow() - datetime.timedelta(days=14),
            review_date=datetime.datetime.utcnow() + datetime.timedelta(days=7)
        )
        db.add(inv1)
        db.flush()

        why_steps_data = [
            (1, "Why did the pin connector fail automated optical alignment check?", "The header pins were seated 1.2 degrees askew relative to PCB solder pads.", "Station AOI camera capture log #8821", "Observed across 18 sequential boards"),
            (2, "Why were the pins seated askew by the insertion gripper?", "The vacuum pick-and-place head exhibited lateral oscillation during placement.", "Laser micrometer reading showed 0.4mm horizontal deviation", "No deviation noticed during manual dry run"),
            (3, "Why did the pick-and-place head oscillate during placement stroke?", "The guide bracket connecting the actuator to the axis rod had excessive mechanical clearance.", "Physical inspection found noticeable play when manually deflected", "Bracket had been in continuous service for 14 months"),
            (4, "Why was mechanical clearance allowed to develop beyond engineering tolerance?", "The standard aluminum bracket fatigued under cyclic stress at high acceleration.", "Metallurgical cross-section indicated fatigue striations at bolt interface", "Aluminum alloy 6061 rated below operational shear requirement"),
            (5, "Why was the bracket specified in aluminum without cyclic fatigue life threshold?", "Original machine procurement specification lacked dynamic load fatigue endurance requirement for custom tooling brackets.", "Procurement standard P-904 reviewed", "Engineering change notice ECN-881 filed to mandate steel components for dynamic fixtures")
        ]

        for num, q, a, ev, n in why_steps_data:
            db.add(InvestigationWhyStep(
                investigation_id=inv1.id,
                step_number=num,
                question=q,
                answer=a,
                evidence=ev,
                notes=n
            ))

        inv2 = Investigation(
            investigation_reference="INV-2026-0043",
            firestore_document_id="investigations/INV-2026-0043",
            defect_category="Surface Scratch",
            product_name="Precision Microcontroller Hub",
            production_line="Line Alpha",
            machine_id="MCH-01",
            problem_description="Surface scuff marks on anodized aluminum top cover.",
            severity="Low",
            investigation_owner="Lead Manufacturing Engineer",
            investigation_status="Open",
            observed_evidence="Scratches occur at output transfer conveyor guide rails.",
            suspected_factors="Accumulation of metallic burrs on nylon side guides.",
            root_cause_hypothesis="Side guide railing friction against finished housing during transfer.",
            date_opened=datetime.datetime.utcnow() - datetime.timedelta(days=4)
        )
        db.add(inv2)
        db.flush()

        for i in range(1, 6):
            db.add(InvestigationWhyStep(
                investigation_id=inv2.id,
                step_number=i,
                question=f"Why step {i}: Investigating surface scuff marks on conveyor line.",
                answer="Under active multi-disciplinary investigation.",
                evidence="Conveyor track photos uploaded to Cloudinary library.",
                notes=""
            ))

        db.commit()
        print("Root cause investigations with 5 Whys workflow seeded.")

    # 4. Seed Image Evidence with Cloudinary URLs
    if db.query(ImageEvidence).count() == 0:
        db.add(ImageEvidence(
            image_id="IMG-2026-001",
            firestore_document_id="image_evidence/IMG-2026-001",
            secure_url="https://res.cloudinary.com/dlvjvskje/image/upload/v1710000000/qualitylens/defects/sample_scratch_evidence.jpg",
            public_id="qualitylens/defects/sample_scratch_evidence",
            original_filename="housing_surface_scratch_macro.jpg",
            file_size=245890,
            content_type="image/jpeg",
            defect_category="Surface Scratch",
            associated_inspection_id="INSP-2026-00001",
            associated_investigation_id="INV-2026-0043",
            notes="Macro capture of 0.3mm micro-scratch across matte anodized finish.",
            uploaded_by="Quality Assurance Tech",
            uploaded_at=datetime.datetime.utcnow() - datetime.timedelta(days=3)
        ))
        db.add(ImageEvidence(
            image_id="IMG-2026-002",
            firestore_document_id="image_evidence/IMG-2026-002",
            secure_url="https://res.cloudinary.com/dlvjvskje/image/upload/v1710000000/qualitylens/defects/sample_misalignment_evidence.jpg",
            public_id="qualitylens/defects/sample_misalignment_evidence",
            original_filename="connector_pin_offset_aoi.png",
            file_size=412300,
            content_type="image/png",
            defect_category="Assembly Misalignment",
            associated_inspection_id="INSP-2026-00018",
            associated_investigation_id="INV-2026-0042",
            notes="AOI camera 1.2-degree pin deviation flag on J2 header.",
            uploaded_by="Senior Quality Analyst",
            uploaded_at=datetime.datetime.utcnow() - datetime.timedelta(days=12)
        ))
        db.commit()
        print("Image evidence records seeded.")

    db.close()
    print("Database seeding finished successfully!")

if __name__ == "__main__":
    seed()
