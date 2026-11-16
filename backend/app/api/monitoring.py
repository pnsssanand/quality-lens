import datetime
from typing import List, Dict, Any, Optional
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.database.session import get_db
from app.core.security import verify_firebase_token
from app.core.config import settings
from app.models.models import QualityThreshold, Machine, ProductionLine, Inspection
from app.schemas.schemas import QualityThresholdConfig
from app.analytics.engine import QualityAnalyticsEngine
from app.api.dashboard import fetch_inspections_data

router = APIRouter(prefix="/monitoring", tags=["Quality Monitoring"])

@router.get("/thresholds", response_model=QualityThresholdConfig)
def get_thresholds(
    db: Session = Depends(get_db),
    user: Dict[str, Any] = Depends(verify_firebase_token)
):
    """
    Returns active quality monitoring threshold configuration.
    """
    qt = db.query(QualityThreshold).filter(QualityThreshold.scope == "GLOBAL").first()
    if qt:
        return QualityThresholdConfig(normal_max=qt.normal_max, warning_max=qt.warning_max)
    return QualityThresholdConfig(
        normal_max=settings.THRESHOLD_NORMAL_MAX,
        warning_max=settings.THRESHOLD_WARNING_MAX
    )

@router.put("/thresholds", response_model=QualityThresholdConfig)
def update_thresholds(
    config: QualityThresholdConfig,
    db: Session = Depends(get_db),
    user: Dict[str, Any] = Depends(verify_firebase_token)
):
    """
    Updates configurable threshold boundaries for warnings and critical alerts.
    """
    qt = db.query(QualityThreshold).filter(QualityThreshold.scope == "GLOBAL").first()
    if not qt:
        qt = QualityThreshold(
            threshold_id="TH-GLOBAL",
            firestore_document_id="quality_thresholds/global",
            scope="GLOBAL",
            target_identifier="ALL",
            normal_max=config.normal_max,
            warning_max=config.warning_max,
            updated_by=user.get("uid")
        )
        db.add(qt)
    else:
        qt.normal_max = config.normal_max
        qt.warning_max = config.warning_max
        qt.updated_by = user.get("uid")
        qt.updated_at = datetime.datetime.utcnow()

    db.commit()
    return QualityThresholdConfig(normal_max=qt.normal_max, warning_max=qt.warning_max)

@router.get("/status")
def get_monitoring_status(
    db: Session = Depends(get_db),
    user: Dict[str, Any] = Depends(verify_firebase_token)
):
    """
    Builds real-time quality monitoring table across all machines and lines.
    Flags warning and critical threshold breaches.
    """
    qt = db.query(QualityThreshold).filter(QualityThreshold.scope == "GLOBAL").first()
    normal_max = qt.normal_max if qt else settings.THRESHOLD_NORMAL_MAX
    warning_max = qt.warning_max if qt else settings.THRESHOLD_WARNING_MAX

    data = fetch_inspections_data(db)
    machine_metrics = QualityAnalyticsEngine.calculate_machine_performance(
        data, warning_threshold=warning_max
    )
    line_metrics = QualityAnalyticsEngine.calculate_production_line_comparison(
        data, normal_threshold=normal_max, warning_threshold=warning_max
    )

    # Compile monitoring items
    monitoring_rows = []
    for m in machine_metrics:
        monitoring_rows.append({
            "machine_id": m.machine_id,
            "machine_name": m.machine_name,
            "production_line": m.production_line,
            "units_inspected": m.inspected_units,
            "defective_units": m.defective_units,
            "defect_rate": m.defect_rate,
            "threshold_limit": f"Warning: {normal_max}%, Critical: {warning_max}%",
            "status": m.status,
            "alert": m.alert,
            "top_defect_category": m.top_defect_category or "None",
            "last_updated": datetime.datetime.utcnow().strftime("%Y-%m-%d %H:%M UTC")
        })

    critical_count = sum(1 for r in monitoring_rows if r["status"] == "CRITICAL")
    warning_count = sum(1 for r in monitoring_rows if r["status"] == "WARNING")

    return {
        "thresholds": {"normal_max": normal_max, "warning_max": warning_max},
        "total_monitored_stations": len(monitoring_rows),
        "critical_alerts_count": critical_count,
        "warning_alerts_count": warning_count,
        "stations": monitoring_rows,
        "lines": [l.dict() for l in line_metrics]
    }
