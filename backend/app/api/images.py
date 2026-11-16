import uuid
import datetime
from typing import List, Optional, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from app.database.session import get_db
from app.core.security import verify_firebase_token
from app.models.models import ImageEvidence
from app.schemas.schemas import ImageEvidenceCreate, ImageEvidenceResponse

router = APIRouter(prefix="/images", tags=["Image Evidence"])

@router.get("", response_model=List[ImageEvidenceResponse])
def list_images(
    defect_category: Optional[str] = Query(None),
    inspection_id: Optional[str] = Query(None),
    investigation_id: Optional[str] = Query(None),
    search: Optional[str] = Query(None),
    db: Session = Depends(get_db),
    user: Dict[str, Any] = Depends(verify_firebase_token)
):
    """
    Retrieves gallery of inspection and defect image evidence stored in Cloudinary.
    """
    query = db.query(ImageEvidence)
    if defect_category and defect_category != "ALL":
        query = query.filter(ImageEvidence.defect_category == defect_category)
    if inspection_id:
        query = query.filter(ImageEvidence.associated_inspection_id == inspection_id)
    if investigation_id:
        query = query.filter(ImageEvidence.associated_investigation_id == investigation_id)
    if search:
        pattern = f"%{search}%"
        query = query.filter(
            (ImageEvidence.original_filename.ilike(pattern)) |
            (ImageEvidence.notes.ilike(pattern)) |
            (ImageEvidence.defect_category.ilike(pattern))
        )

    images = query.order_by(ImageEvidence.uploaded_at.desc()).all()
    return images

@router.post("", response_model=ImageEvidenceResponse, status_code=status.HTTP_201_CREATED)
def register_image_metadata(
    data: ImageEvidenceCreate,
    db: Session = Depends(get_db),
    user: Dict[str, Any] = Depends(verify_firebase_token)
):
    """
    Registers metadata for photographs uploaded to Cloudinary.
    """
    img_id = f"IMG-{uuid.uuid4().hex[:8].upper()}"
    img = ImageEvidence(
        image_id=img_id,
        firestore_document_id=f"image_evidence/{img_id}",
        secure_url=data.secure_url,
        public_id=data.public_id,
        original_filename=data.original_filename,
        file_size=data.file_size,
        content_type=data.content_type,
        defect_category=data.defect_category,
        associated_inspection_id=data.associated_inspection_id,
        associated_investigation_id=data.associated_investigation_id,
        notes=data.notes,
        uploaded_by=user.get("name", "Quality Engineer"),
        uploaded_at=datetime.datetime.utcnow()
    )
    db.add(img)
    db.commit()
    db.refresh(img)
    return img

@router.delete("/{image_id}")
def delete_image_evidence(
    image_id: str,
    db: Session = Depends(get_db),
    user: Dict[str, Any] = Depends(verify_firebase_token)
):
    """
    Safely removes image evidence metadata record.
    """
    img = db.query(ImageEvidence).filter(ImageEvidence.image_id == image_id).first()
    if not img:
        raise HTTPException(status_code=404, detail="Image record not found")

    db.delete(img)
    db.commit()
    return {"success": True, "message": f"Image evidence {image_id} removed successfully"}
