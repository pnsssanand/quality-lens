import datetime
from typing import Optional, List, Dict, Any
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.database.session import get_db
from app.core.security import verify_firebase_token
from app.models.models import Inspection, Defect, ProductionLine, Product, Machine, Investigation
from app.analytics.engine import QualityAnalyticsEngine
from app.schemas.schemas import (
    KPISummary,
    DefectTrendResponse,
    LineComparisonItem,
    InvestigationResponse
)

router = APIRouter(prefix="/dashboard", tags=["Dashboard"])

def apply_inspection_filters(
    query,
    days: Optional[int] = None,
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    production_line: Optional[str] = None,
    machine_id: Optional[str] = None,
    product_name: Optional[str] = None,
    shift: Optional[str] = None,
    defect_category: Optional[str] = None
):
    if days:
        cutoff = datetime.datetime.utcnow() - datetime.timedelta(days=days)
        query = query.filter(Inspection.inspection_date >= cutoff)
    if start_date:
        try:
            s_dt = datetime.datetime.fromisoformat(start_date)
            query = query.filter(Inspection.inspection_date >= s_dt)
        except ValueError:
            pass
    if end_date:
        try:
            e_dt = datetime.datetime.fromisoformat(end_date)
            query = query.filter(Inspection.inspection_date <= e_dt)
        except ValueError:
            pass
    if production_line and production_line != "ALL":
        query = query.join(Inspection.production_line).filter(ProductionLine.line_name == production_line)
    if machine_id and machine_id != "ALL":
        query = query.join(Inspection.machine).filter(Machine.machine_id == machine_id)
    if product_name and product_name != "ALL":
        query = query.join(Inspection.product).filter(Product.product_name == product_name)
    if shift and shift != "ALL":
        query = query.filter(Inspection.shift == shift)
    if defect_category and defect_category != "ALL":
        query = query.join(Inspection.defects).filter(Defect.defect_category == defect_category)
    return query

def fetch_inspections_data(db: Session, **kwargs) -> List[Dict[str, Any]]:
    query = db.query(Inspection)
    query = apply_inspection_filters(query, **kwargs)
    records = query.all()

    results = []
    for r in records:
        cat = r.defects[0].defect_category if r.defects else "None"
        line_name = r.production_line.line_name if r.production_line else "Unknown Line"
        mch_id = r.machine.machine_id if r.machine else "MCH-01"
        prod_name = r.product.product_name if r.product else "PRD"

        results.append({
            "inspection_id": r.inspection_id,
            "inspection_date": r.inspection_date,
            "production_line": line_name,
            "machine_id": mch_id,
            "product_name": prod_name,
            "shift": r.shift,
            "units_inspected": r.units_inspected,
            "defective_units": r.defective_units,
            "units_passed_first_inspection": r.units_passed_first_inspection,
            "defect_category": cat,
            "inspection_status": r.inspection_status
        })
    return results

@router.get("/summary", response_model=KPISummary)
def get_dashboard_summary(
    days: Optional[int] = Query(None),
    start_date: Optional[str] = Query(None),
    end_date: Optional[str] = Query(None),
    production_line: Optional[str] = Query(None),
    machine_id: Optional[str] = Query(None),
    product_name: Optional[str] = Query(None),
    shift: Optional[str] = Query(None),
    db: Session = Depends(get_db),
    user: Dict[str, Any] = Depends(verify_firebase_token)
):
    """
    Computes primary executive KPIs calculated dynamically from actual imported records.
    """
    data = fetch_inspections_data(
        db, days=days, start_date=start_date, end_date=end_date,
        production_line=production_line, machine_id=machine_id,
        product_name=product_name, shift=shift
    )
    open_inv_count = db.query(Investigation).filter(Investigation.investigation_status.in_(["Open", "Under Investigation", "Root Cause Identified"])).count()
    return QualityAnalyticsEngine.calculate_kpis(data, open_investigations_count=open_inv_count)

@router.get("/defect-trends", response_model=DefectTrendResponse)
def get_defect_trends(
    grouping: str = Query("daily", pattern="^(daily|weekly|monthly)$"),
    days: Optional[int] = Query(None),
    start_date: Optional[str] = Query(None),
    end_date: Optional[str] = Query(None),
    production_line: Optional[str] = Query(None),
    machine_id: Optional[str] = Query(None),
    product_name: Optional[str] = Query(None),
    db: Session = Depends(get_db),
    user: Dict[str, Any] = Depends(verify_firebase_token)
):
    """
    Returns time-series defect trend analysis grouped by daily, weekly, or monthly intervals.
    """
    data = fetch_inspections_data(
        db, days=days, start_date=start_date, end_date=end_date,
        production_line=production_line, machine_id=machine_id,
        product_name=product_name
    )
    return QualityAnalyticsEngine.calculate_defect_trends(data, grouping=grouping)

@router.get("/defects-by-category")
def get_defects_by_category(
    days: Optional[int] = Query(None),
    production_line: Optional[str] = Query(None),
    product_name: Optional[str] = Query(None),
    db: Session = Depends(get_db),
    user: Dict[str, Any] = Depends(verify_firebase_token)
):
    """
    Ranks defect categories by defect count.
    """
    data = fetch_inspections_data(
        db, days=days, production_line=production_line, product_name=product_name
    )
    pareto_res = QualityAnalyticsEngine.calculate_pareto(data)
    return [
        {"category": item.category, "defect_count": item.defect_count, "percentage": item.percentage}
        for item in pareto_res.items
    ]

@router.get("/production-line-comparison", response_model=List[LineComparisonItem])
def get_production_line_comparison(
    days: Optional[int] = Query(None),
    start_date: Optional[str] = Query(None),
    end_date: Optional[str] = Query(None),
    db: Session = Depends(get_db),
    user: Dict[str, Any] = Depends(verify_firebase_token)
):
    """
    Compares production lines by total inspected, defective units, and defect rate.
    """
    data = fetch_inspections_data(db, days=days, start_date=start_date, end_date=end_date)
    return QualityAnalyticsEngine.calculate_production_line_comparison(data)

@router.get("/recent-investigations")
def get_recent_investigations(
    limit: int = 5,
    db: Session = Depends(get_db),
    user: Dict[str, Any] = Depends(verify_firebase_token)
):
    """
    Retrieves the most recent investigations and current status.
    """
    invs = db.query(Investigation).order_by(Investigation.updated_at.desc()).limit(limit).all()
    return [
        {
            "id": inv.id,
            "investigation_reference": inv.investigation_reference,
            "defect_category": inv.defect_category,
            "production_line": inv.production_line,
            "investigation_status": inv.investigation_status,
            "severity": inv.severity,
            "date_opened": inv.date_opened,
            "investigation_owner": inv.investigation_owner
        }
        for inv in invs
    ]
