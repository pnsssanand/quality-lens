import uuid
from typing import Dict, Any, List, Optional
from fastapi import APIRouter, Depends, UploadFile, File, HTTPException, Response, status
from sqlalchemy.orm import Session
from app.database.session import get_db
from app.core.security import verify_firebase_token
from app.schemas.schemas import ValidationReport, ImportSummary, ImportCommitRequest
from app.imports.validator import CSVInspectionValidator
from app.services.sync_service import SyncService
from app.models.models import DataImport, Inspection

router = APIRouter(prefix="/imports", tags=["Imports"])

# In-memory staging cache for pending import files (by import_id)
_staging_cache: Dict[str, Dict[str, Any]] = {}

@router.get("/template")
def download_csv_template():
    """
    Returns standard engineering inspection CSV template with sample data.
    """
    csv_content = CSVInspectionValidator.get_template_csv()
    return Response(
        content=csv_content,
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=qualitylens_inspection_template.csv"}
    )

@router.post("/upload", response_model=Dict[str, Any])
async def upload_inspection_csv(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    user: Dict[str, Any] = Depends(verify_firebase_token)
):
    """
    Accepts CSV upload, validates schema, constraints, data types, and duplicates.
    Returns comprehensive validation report and preview without committing invalid data.
    """
    if not file.filename.endswith(".csv"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Uploaded file must be a .csv file"
        )

    content = await file.read()
    if len(content) == 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Uploaded file is empty"
        )

    # Get existing inspection IDs in DB for duplicate checking
    existing_ids = set(r[0] for r in db.query(Inspection.inspection_id).all())

    import_id = f"IMP-{uuid.uuid4().hex[:8].upper()}"
    report, valid_records, invalid_records = CSVInspectionValidator.validate_csv_content(
        content_bytes=content,
        filename=file.filename,
        existing_inspection_ids=existing_ids
    )

    # Cache pending import in staging
    _staging_cache[import_id] = {
        "import_id": import_id,
        "filename": file.filename,
        "report": report,
        "valid_records": valid_records,
        "invalid_records": invalid_records,
        "user_id": user.get("uid")
    }

    return {
        "import_id": import_id,
        "filename": file.filename,
        "report": report.dict(),
        "ready_to_commit": len(valid_records) > 0
    }

@router.post("/{import_id}/commit")
def commit_import(
    import_id: str,
    db: Session = Depends(get_db),
    user: Dict[str, Any] = Depends(verify_firebase_token)
):
    """
    Commits staged valid records from the upload into the database and syncs to PostgreSQL mirror.
    """
    staged = _staging_cache.get(import_id)
    if not staged:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Staged import not found or expired. Please re-upload the file."
        )

    valid_records = staged["valid_records"]
    if not valid_records:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No valid records available to commit."
        )

    result = SyncService.sync_records_to_database(
        db=db,
        records=valid_records,
        import_id=import_id,
        filename=staged["filename"],
        user_id=user.get("uid")
    )

    # Clean staging cache
    _staging_cache.pop(import_id, None)

    return result

@router.get("", response_model=List[ImportSummary])
def list_imports(
    db: Session = Depends(get_db),
    user: Dict[str, Any] = Depends(verify_firebase_token)
):
    """
    Returns list of historical data imports.
    """
    imports = db.query(DataImport).order_by(DataImport.created_at.desc()).limit(50).all()
    return [
        ImportSummary(
            import_id=imp.import_id,
            filename=imp.filename,
            total_records=imp.total_records,
            valid_records=imp.valid_records,
            invalid_records=imp.invalid_records,
            status=imp.status,
            created_at=imp.created_at,
            uploaded_by=imp.uploaded_by
        )
        for imp in imports
    ]

@router.get("/{import_id}")
def get_import_details(
    import_id: str,
    db: Session = Depends(get_db),
    user: Dict[str, Any] = Depends(verify_firebase_token)
):
    """
    Gets details of a specific import.
    """
    imp = db.query(DataImport).filter(DataImport.import_id == import_id).first()
    if not imp:
        raise HTTPException(status_code=404, detail="Import not found")
    
    inspections_count = db.query(Inspection).filter(Inspection.source_import_id == imp.id).count()
    return {
        "import_id": imp.import_id,
        "filename": imp.filename,
        "total_records": imp.total_records,
        "valid_records": imp.valid_records,
        "status": imp.status,
        "created_at": imp.created_at,
        "inspections_stored": inspections_count
    }
