import logging
import datetime
from typing import List, Dict, Any, Optional
from sqlalchemy.orm import Session
from app.models.models import (
    Product,
    ProductionLine,
    Machine,
    DataImport,
    Inspection,
    Defect,
    Investigation,
    InvestigationWhyStep,
    SyncLog
)

logger = logging.getLogger(__name__)

class SyncService:
    """
    Handles idempotent synchronization from validated Firestore records into
    the structured PostgreSQL/SQL relational analytical mirror.
    Ensures relational integrity, deduplication, and detailed sync status logging.
    """

    @classmethod
    def sync_records_to_database(
        cls,
        db: Session,
        records: List[Dict[str, Any]],
        import_id: str,
        filename: str,
        user_id: Optional[str] = "dev-user-demo-123"
    ) -> Dict[str, Any]:
        """
        Takes validated records and idempotently mirrors them into the relational schema.
        Logs every stage and prevents duplicates using stable natural and document keys.
        """
        created_count = 0
        updated_count = 0
        failed_count = 0
        errors: List[str] = []

        try:
            # 1. Ensure or update DataImport record
            data_import = db.query(DataImport).filter(DataImport.import_id == import_id).first()
            if not data_import:
                data_import = DataImport(
                    import_id=import_id,
                    firestore_document_id=f"data_imports/{import_id}",
                    filename=filename,
                    total_records=len(records),
                    valid_records=len(records),
                    invalid_records=0,
                    status="COMPLETED",
                    uploaded_by=user_id
                )
                db.add(data_import)
                db.flush()

            # Cache reference tables to minimize queries
            products_cache = {p.product_id: p for p in db.query(Product).all()}
            lines_cache = {l.line_name: l for l in db.query(ProductionLine).all()}
            machines_cache = {m.machine_id: m for m in db.query(Machine).all()}

            for rec in records:
                try:
                    insp_id = rec["inspection_id"]
                    
                    # Ensure Product exists
                    prod_id = rec.get("product_id") or "PRD-GEN"
                    prod_name = rec.get("product_name") or prod_id
                    if prod_id not in products_cache:
                        p_obj = Product(
                            product_id=prod_id,
                            product_name=prod_name,
                            firestore_document_id=f"products/{prod_id}",
                            description=f"Automated reference for {prod_name}"
                        )
                        db.add(p_obj)
                        db.flush()
                        products_cache[prod_id] = p_obj
                    product = products_cache[prod_id]

                    # Ensure ProductionLine exists
                    line_name = rec.get("production_line") or "Line Alpha"
                    if line_name not in lines_cache:
                        l_obj = ProductionLine(
                            line_name=line_name,
                            firestore_document_id=f"production_lines/{line_name.replace(' ', '_').lower()}",
                            location="Main Assembly Facility"
                        )
                        db.add(l_obj)
                        db.flush()
                        lines_cache[line_name] = l_obj
                    prod_line = lines_cache[line_name]

                    # Ensure Machine exists
                    mch_id = rec.get("machine_id") or "MCH-01"
                    if mch_id not in machines_cache:
                        m_obj = Machine(
                            machine_id=mch_id,
                            machine_name=f"Workstation {mch_id}",
                            firestore_document_id=f"machines/{mch_id.lower()}",
                            production_line_id=prod_line.id
                        )
                        db.add(m_obj)
                        db.flush()
                        machines_cache[mch_id] = m_obj
                    machine = machines_cache[mch_id]

                    # Check if inspection already exists
                    inspection = db.query(Inspection).filter(Inspection.inspection_id == insp_id).first()
                    is_new = False
                    if not inspection:
                        is_new = True
                        inspection = Inspection(
                            inspection_id=insp_id,
                            firestore_document_id=f"inspections/{insp_id}",
                            source_import_id=data_import.id
                        )
                        db.add(inspection)

                    # Update attributes
                    insp_date = rec["inspection_date"]
                    if isinstance(insp_date, str):
                        try:
                            insp_date = datetime.datetime.fromisoformat(insp_date)
                        except ValueError:
                            insp_date = datetime.datetime.utcnow()

                    inspection.inspection_date = insp_date
                    inspection.product_id = product.id
                    inspection.production_line_id = prod_line.id
                    inspection.machine_id = machine.id
                    inspection.shift = rec.get("shift", "Shift 1")
                    inspection.units_inspected = int(rec.get("units_inspected", 0))
                    inspection.defective_units = int(rec.get("defective_units", 0))
                    inspection.units_passed_first_inspection = int(rec.get("units_passed_first_inspection", max(0, inspection.units_inspected - inspection.defective_units)))
                    inspection.inspection_status = rec.get("inspection_status", "PASSED")
                    db.flush()

                    # Handle Defect records
                    defective_units = inspection.defective_units
                    cat = rec.get("defect_category")
                    if defective_units > 0 and cat and cat != "None":
                        # Check if defect already recorded for this inspection
                        defect = db.query(Defect).filter(Defect.inspection_id == inspection.id).first()
                        if not defect:
                            defect = Defect(
                                inspection_id=inspection.id,
                                firestore_document_id=f"defects/{insp_id}_defect",
                                defect_category=cat,
                                defect_description=rec.get("defect_description", ""),
                                severity=rec.get("severity", "Medium"),
                                image_url=rec.get("image_url")
                            )
                            db.add(defect)
                        else:
                            defect.defect_category = cat
                            defect.defect_description = rec.get("defect_description", "")
                            defect.severity = rec.get("severity", "Medium")
                            if rec.get("image_url"):
                                defect.image_url = rec.get("image_url")

                    if is_new:
                        created_count += 1
                    else:
                        updated_count += 1

                except Exception as row_err:
                    failed_count += 1
                    err_msg = f"Failed sync for row {rec.get('inspection_id', 'unknown')}: {str(row_err)}"
                    errors.append(err_msg)
                    logger.error(err_msg)

            # Log successful sync
            sync_log = SyncLog(
                firestore_document_id=f"data_imports/{import_id}",
                collection_name="inspections",
                sync_status="SUCCESS" if failed_count == 0 else ("PARTIAL" if created_count + updated_count > 0 else "FAILED"),
                error_message="; ".join(errors[:5]) if errors else None,
                synced_at=datetime.datetime.utcnow()
            )
            db.add(sync_log)
            db.commit()

            return {
                "success": True,
                "import_id": import_id,
                "created": created_count,
                "updated": updated_count,
                "failed": failed_count,
                "errors": errors[:10]
            }

        except Exception as e:
            db.rollback()
            logger.error(f"SyncService batch error: {e}", exc_info=True)
            # Log failed sync
            try:
                sync_log = SyncLog(
                    firestore_document_id=f"data_imports/{import_id}",
                    collection_name="inspections",
                    sync_status="FAILED",
                    error_message=str(e),
                    synced_at=datetime.datetime.utcnow()
                )
                db.add(sync_log)
                db.commit()
            except Exception:
                pass

            return {
                "success": False,
                "import_id": import_id,
                "error": str(e),
                "created": created_count,
                "updated": updated_count,
                "failed": len(records)
            }
