import uuid
import datetime
from typing import List, Optional, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from app.database.session import get_db
from app.core.security import verify_firebase_token
from app.models.models import Investigation, InvestigationWhyStep
from app.schemas.schemas import (
    InvestigationCreate,
    InvestigationUpdate,
    InvestigationResponse,
    WhyStepSchema
)

router = APIRouter(prefix="/investigations", tags=["Root Cause Investigations"])

STANDARD_WHYS_QUESTIONS = [
    "Why 1: Why did the physical defect or failure mode manifest during processing?",
    "Why 2: Why did that operational or equipment condition occur at that specific station?",
    "Why 3: Why did the underlying manufacturing process or fixture allow this deviation?",
    "Why 4: Why was that process weakness, tooling tolerance, or inspection gap present?",
    "Why 5: What deeper quality system, supplier control, or operational management factor contributed?"
]

@router.get("", response_model=List[InvestigationResponse])
def list_investigations(
    status_filter: Optional[str] = Query(None, alias="status"),
    defect_category: Optional[str] = Query(None),
    production_line: Optional[str] = Query(None),
    db: Session = Depends(get_db),
    user: Dict[str, Any] = Depends(verify_firebase_token)
):
    """
    Lists engineering root cause investigations with optional filtering.
    """
    query = db.query(Investigation)
    if status_filter and status_filter != "ALL":
        query = query.filter(Investigation.investigation_status == status_filter)
    if defect_category and defect_category != "ALL":
        query = query.filter(Investigation.defect_category == defect_category)
    if production_line and production_line != "ALL":
        query = query.filter(Investigation.production_line == production_line)

    invs = query.order_by(Investigation.updated_at.desc()).all()
    results = []
    for inv in invs:
        steps = [
            WhyStepSchema(
                step_number=s.step_number,
                question=s.question,
                answer=s.answer,
                evidence=s.evidence,
                notes=s.notes
            )
            for s in sorted(inv.why_steps, key=lambda x: x.step_number)
        ]
        results.append(InvestigationResponse(
            id=inv.id,
            investigation_reference=inv.investigation_reference,
            defect_category=inv.defect_category,
            product_name=inv.product_name,
            production_line=inv.production_line,
            machine_id=inv.machine_id,
            problem_description=inv.problem_description,
            severity=inv.severity,
            investigation_owner=inv.investigation_owner,
            investigation_status=inv.investigation_status,
            observed_evidence=inv.observed_evidence,
            suspected_factors=inv.suspected_factors,
            root_cause_hypothesis=inv.root_cause_hypothesis,
            verified_root_cause=inv.verified_root_cause,
            verification_method=inv.verification_method,
            corrective_action=inv.corrective_action,
            preventive_action=inv.preventive_action,
            date_opened=inv.date_opened,
            review_date=inv.review_date,
            date_closed=inv.date_closed,
            why_steps=steps
        ))
    return results

@router.post("", response_model=InvestigationResponse, status_code=status.HTTP_201_CREATED)
def create_investigation(
    data: InvestigationCreate,
    db: Session = Depends(get_db),
    user: Dict[str, Any] = Depends(verify_firebase_token)
):
    """
    Initiates a new root cause investigation record and pre-populates 5 Whys steps.
    """
    ref = f"INV-2026-{uuid.uuid4().hex[:4].upper()}"
    inv = Investigation(
        investigation_reference=ref,
        firestore_document_id=f"investigations/{ref}",
        defect_category=data.defect_category,
        product_name=data.product_name,
        production_line=data.production_line,
        machine_id=data.machine_id,
        problem_description=data.problem_description,
        severity=data.severity,
        investigation_owner=data.investigation_owner or user.get("name", "Quality Engineer"),
        investigation_status="Open",
        observed_evidence=data.observed_evidence,
        suspected_factors=data.suspected_factors,
        root_cause_hypothesis=data.root_cause_hypothesis,
        verified_root_cause=data.verified_root_cause,
        verification_method=data.verification_method,
        corrective_action=data.corrective_action,
        preventive_action=data.preventive_action,
        date_opened=datetime.datetime.utcnow()
    )
    db.add(inv)
    db.flush()

    # Pre-populate or insert supplied 5 Whys steps
    why_steps_to_add = data.why_steps if data.why_steps else [
        WhyStepSchema(step_number=i+1, question=q, answer="", evidence="", notes="")
        for i, q in enumerate(STANDARD_WHYS_QUESTIONS)
    ]

    created_steps = []
    for step in why_steps_to_add:
        w_obj = InvestigationWhyStep(
            investigation_id=inv.id,
            step_number=step.step_number,
            question=step.question,
            answer=step.answer,
            evidence=step.evidence,
            notes=step.notes
        )
        db.add(w_obj)
        created_steps.append(step)

    db.commit()
    db.refresh(inv)

    return InvestigationResponse(
        id=inv.id,
        investigation_reference=inv.investigation_reference,
        defect_category=inv.defect_category,
        product_name=inv.product_name,
        production_line=inv.production_line,
        machine_id=inv.machine_id,
        problem_description=inv.problem_description,
        severity=inv.severity,
        investigation_owner=inv.investigation_owner,
        investigation_status=inv.investigation_status,
        observed_evidence=inv.observed_evidence,
        suspected_factors=inv.suspected_factors,
        root_cause_hypothesis=inv.root_cause_hypothesis,
        verified_root_cause=inv.verified_root_cause,
        verification_method=inv.verification_method,
        corrective_action=inv.corrective_action,
        preventive_action=inv.preventive_action,
        date_opened=inv.date_opened,
        review_date=inv.review_date,
        date_closed=inv.date_closed,
        why_steps=created_steps
    )

@router.get("/{investigation_id}", response_model=InvestigationResponse)
def get_investigation(
    investigation_id: int,
    db: Session = Depends(get_db),
    user: Dict[str, Any] = Depends(verify_firebase_token)
):
    """
    Fetches full investigation dossier including complete 5 Whys sequence and action status.
    """
    inv = db.query(Investigation).filter(Investigation.id == investigation_id).first()
    if not inv:
        raise HTTPException(status_code=404, detail="Investigation not found")

    steps = [
        WhyStepSchema(
            step_number=s.step_number,
            question=s.question,
            answer=s.answer,
            evidence=s.evidence,
            notes=s.notes
        )
        for s in sorted(inv.why_steps, key=lambda x: x.step_number)
    ]

    return InvestigationResponse(
        id=inv.id,
        investigation_reference=inv.investigation_reference,
        defect_category=inv.defect_category,
        product_name=inv.product_name,
        production_line=inv.production_line,
        machine_id=inv.machine_id,
        problem_description=inv.problem_description,
        severity=inv.severity,
        investigation_owner=inv.investigation_owner,
        investigation_status=inv.investigation_status,
        observed_evidence=inv.observed_evidence,
        suspected_factors=inv.suspected_factors,
        root_cause_hypothesis=inv.root_cause_hypothesis,
        verified_root_cause=inv.verified_root_cause,
        verification_method=inv.verification_method,
        corrective_action=inv.corrective_action,
        preventive_action=inv.preventive_action,
        date_opened=inv.date_opened,
        review_date=inv.review_date,
        date_closed=inv.date_closed,
        why_steps=steps
    )

@router.put("/{investigation_id}", response_model=InvestigationResponse)
def update_investigation(
    investigation_id: int,
    data: InvestigationUpdate,
    db: Session = Depends(get_db),
    user: Dict[str, Any] = Depends(verify_firebase_token)
):
    """
    Updates investigation status, hypotheses, verified root cause, corrective and preventive actions.
    """
    inv = db.query(Investigation).filter(Investigation.id == investigation_id).first()
    if not inv:
        raise HTTPException(status_code=404, detail="Investigation not found")

    if data.investigation_status is not None:
        inv.investigation_status = data.investigation_status
        if data.investigation_status == "Closed" and not inv.date_closed:
            inv.date_closed = datetime.datetime.utcnow()
    if data.severity is not None:
        inv.severity = data.severity
    if data.investigation_owner is not None:
        inv.investigation_owner = data.investigation_owner
    if data.observed_evidence is not None:
        inv.observed_evidence = data.observed_evidence
    if data.suspected_factors is not None:
        inv.suspected_factors = data.suspected_factors
    if data.root_cause_hypothesis is not None:
        inv.root_cause_hypothesis = data.root_cause_hypothesis
    if data.verified_root_cause is not None:
        inv.verified_root_cause = data.verified_root_cause
    if data.verification_method is not None:
        inv.verification_method = data.verification_method
    if data.corrective_action is not None:
        inv.corrective_action = data.corrective_action
    if data.preventive_action is not None:
        inv.preventive_action = data.preventive_action
    if data.review_date is not None:
        inv.review_date = data.review_date

    # Update Why steps if supplied
    if data.why_steps is not None:
        existing_step_map = {s.step_number: s for s in inv.why_steps}
        for ws in data.why_steps:
            if ws.step_number in existing_step_map:
                s_obj = existing_step_map[ws.step_number]
                s_obj.question = ws.question
                s_obj.answer = ws.answer
                s_obj.evidence = ws.evidence
                s_obj.notes = ws.notes
            else:
                s_obj = InvestigationWhyStep(
                    investigation_id=inv.id,
                    step_number=ws.step_number,
                    question=ws.question,
                    answer=ws.answer,
                    evidence=ws.evidence,
                    notes=ws.notes
                )
                db.add(s_obj)

    inv.updated_at = datetime.datetime.utcnow()
    db.commit()
    db.refresh(inv)

    steps = [
        WhyStepSchema(
            step_number=s.step_number,
            question=s.question,
            answer=s.answer,
            evidence=s.evidence,
            notes=s.notes
        )
        for s in sorted(inv.why_steps, key=lambda x: x.step_number)
    ]

    return InvestigationResponse(
        id=inv.id,
        investigation_reference=inv.investigation_reference,
        defect_category=inv.defect_category,
        product_name=inv.product_name,
        production_line=inv.production_line,
        machine_id=inv.machine_id,
        problem_description=inv.problem_description,
        severity=inv.severity,
        investigation_owner=inv.investigation_owner,
        investigation_status=inv.investigation_status,
        observed_evidence=inv.observed_evidence,
        suspected_factors=inv.suspected_factors,
        root_cause_hypothesis=inv.root_cause_hypothesis,
        verified_root_cause=inv.verified_root_cause,
        verification_method=inv.verification_method,
        corrective_action=inv.corrective_action,
        preventive_action=inv.preventive_action,
        date_opened=inv.date_opened,
        review_date=inv.review_date,
        date_closed=inv.date_closed,
        why_steps=steps
    )
