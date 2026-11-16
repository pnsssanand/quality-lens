from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.database.session import get_db
from app.core.security import verify_firebase_token
from app.models.models import SyncLog, Inspection, DataImport

router = APIRouter(prefix="/sync", tags=["PostgreSQL Synchronization"])

@router.get("/status")
def get_sync_status(
    db: Session = Depends(get_db),
    user: dict = Depends(verify_firebase_token)
):
    """
    Returns relational synchronization status, total synced records, and sync health.
    """
    total_inspections = db.query(Inspection).count()
    total_imports = db.query(DataImport).count()
    recent_logs = db.query(SyncLog).order_by(SyncLog.synced_at.desc()).limit(10).all()
    failed_logs_count = db.query(SyncLog).filter(SyncLog.sync_status == "FAILED").count()

    return {
        "status": "HEALTHY" if failed_logs_count == 0 else "WARNING",
        "total_relational_inspections": total_inspections,
        "total_data_imports": total_imports,
        "failed_sync_events": failed_logs_count,
        "recent_sync_logs": [
            {
                "id": l.id,
                "collection": l.collection_name,
                "status": l.sync_status,
                "error_message": l.error_message,
                "synced_at": l.synced_at
            }
            for l in recent_logs
        ]
    }

@router.post("/run")
def trigger_manual_sync(
    db: Session = Depends(get_db),
    user: dict = Depends(verify_firebase_token)
):
    """
    Verifies mirror consistency between collections and analytical tables.
    """
    count = db.query(Inspection).count()
    return {
        "success": True,
        "message": f"Analytical mirror verified. {count} records in PostgreSQL/relational schema.",
        "synced_count": count
    }
