from fastapi import APIRouter, Depends, Response
from sqlalchemy.orm import Session
from app.database.session import get_db
from app.core.security import verify_firebase_token
from app.schemas.schemas import ReportGenerateRequest
from app.api.dashboard import fetch_inspections_data
from app.analytics.engine import QualityAnalyticsEngine
from app.services.report_service import ReportGenerationService
from app.models.models import Investigation

router = APIRouter(prefix="/reports", tags=["Reports"])

@router.post("/generate")
def generate_quality_report(
    req: ReportGenerateRequest,
    db: Session = Depends(get_db),
    user: dict = Depends(verify_firebase_token)
):
    """
    Generates downloadable engineering report in PDF or CSV format using live database records.
    """
    data = fetch_inspections_data(
        db,
        start_date=req.start_date,
        end_date=req.end_date,
        production_line=req.production_line,
        machine_id=req.machine_id,
        product_name=req.product_name,
        defect_category=req.defect_category
    )

    open_invs = db.query(Investigation).filter(Investigation.investigation_status != "Closed").all()
    kpis = QualityAnalyticsEngine.calculate_kpis(data, open_investigations_count=len(open_invs))
    pareto = QualityAnalyticsEngine.calculate_pareto(data)
    lines = QualityAnalyticsEngine.calculate_production_line_comparison(data)

    report_payload = {
        "title": req.title,
        "period": f"{req.start_date or 'Start'} to {req.end_date or 'Present'}",
        "kpis": kpis.dict(),
        "pareto": [p.dict() for p in pareto.items],
        "lines": [l.dict() for l in lines],
        "investigations": [
            {
                "investigation_reference": i.investigation_reference,
                "defect_category": i.defect_category,
                "production_line": i.production_line,
                "investigation_status": i.investigation_status,
                "verified_root_cause": i.verified_root_cause,
                "corrective_action": i.corrective_action
            }
            for i in open_invs
        ]
    }

    if req.export_format.lower() == "csv":
        csv_text = ReportGenerationService.generate_csv_report(report_payload)
        return Response(
            content=csv_text,
            media_type="text/csv",
            headers={"Content-Disposition": "attachment; filename=qualitylens_report.csv"}
        )
    else:
        pdf_bytes = ReportGenerationService.generate_pdf_report(report_payload)
        return Response(
            content=pdf_bytes,
            media_type="application/pdf",
            headers={"Content-Disposition": "attachment; filename=qualitylens_report.pdf"}
        )
