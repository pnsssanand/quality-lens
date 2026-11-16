from typing import Optional, List, Dict, Any
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from app.database.session import get_db
from app.core.security import verify_firebase_token
from app.models.models import Inspection, Defect, ProductionLine, Product, Machine
from app.api.dashboard import fetch_inspections_data
from app.analytics.engine import QualityAnalyticsEngine
from app.schemas.schemas import (
    ParetoAnalysisResponse,
    MachinePerformanceItem,
    LineComparisonItem,
    AnomalyItem
)

router = APIRouter(prefix="/analytics", tags=["Analytics"])

@router.get("/filter-options")
def get_filter_options(
    db: Session = Depends(get_db),
    user: Dict[str, Any] = Depends(verify_firebase_token)
):
    """
    Returns dynamic filter options discovered directly from database records.
    """
    products = [p[0] for p in db.query(Product.product_name).distinct().all() if p[0]]
    lines = [l[0] for l in db.query(ProductionLine.line_name).distinct().all() if l[0]]
    machines = [m[0] for m in db.query(Machine.machine_id).distinct().all() if m[0]]
    shifts = [s[0] for s in db.query(Inspection.shift).distinct().all() if s[0]]
    categories = [
        c[0] for c in db.query(Defect.defect_category).distinct().all() 
        if c[0] and c[0] != "None"
    ]

    return {
        "products": sorted(products),
        "production_lines": sorted(lines),
        "machines": sorted(machines),
        "shifts": sorted(shifts),
        "defect_categories": sorted(categories)
    }

@router.get("/pareto", response_model=ParetoAnalysisResponse)
def get_pareto_analysis(
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
    Returns Pareto defect distribution ranking and 80% cumulative threshold items.
    """
    data = fetch_inspections_data(
        db, days=days, start_date=start_date, end_date=end_date,
        production_line=production_line, machine_id=machine_id,
        product_name=product_name
    )
    return QualityAnalyticsEngine.calculate_pareto(data)

@router.get("/defect-analysis")
def get_defect_analysis(
    days: Optional[int] = Query(None),
    production_line: Optional[str] = Query(None),
    product_name: Optional[str] = Query(None),
    db: Session = Depends(get_db),
    user: Dict[str, Any] = Depends(verify_firebase_token)
):
    """
    Comprehensive defect analytics including frequency, rates, and severity breakdown.
    """
    data = fetch_inspections_data(db, days=days, production_line=production_line, product_name=product_name)
    kpis = QualityAnalyticsEngine.calculate_kpis(data)
    pareto = QualityAnalyticsEngine.calculate_pareto(data)
    lines = QualityAnalyticsEngine.calculate_production_line_comparison(data)
    
    # Severity distribution
    severity_counts = {"Low": 0, "Medium": 0, "High": 0, "Critical": 0}
    for r in db.query(Defect.severity).all():
        if r[0] in severity_counts:
            severity_counts[r[0]] += 1

    return {
        "kpis": kpis,
        "pareto": pareto,
        "production_lines": lines,
        "severity_distribution": severity_counts,
        "total_records_analyzed": len(data)
    }

@router.get("/machine-performance", response_model=List[MachinePerformanceItem])
def get_machine_performance(
    days: Optional[int] = Query(None),
    production_line: Optional[str] = Query(None),
    db: Session = Depends(get_db),
    user: Dict[str, Any] = Depends(verify_firebase_token)
):
    """
    Evaluates individual workstation/machine defect rates and prominent failure modes.
    """
    data = fetch_inspections_data(db, days=days, production_line=production_line)
    return QualityAnalyticsEngine.calculate_machine_performance(data)

@router.get("/anomalies", response_model=List[AnomalyItem])
def get_quality_anomalies(
    db: Session = Depends(get_db),
    user: Dict[str, Any] = Depends(verify_firebase_token)
):
    """
    Identifies sudden defect spikes and out-of-control statistical conditions.
    """
    data = fetch_inspections_data(db)
    return QualityAnalyticsEngine.detect_anomalies(data)
