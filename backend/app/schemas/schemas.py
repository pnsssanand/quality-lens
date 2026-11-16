from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field
import datetime

# --- Authentication Schemas ---
class UserProfile(BaseModel):
    uid: str
    email: str
    name: Optional[str] = "Quality Engineer"
    is_anonymous: bool = False
    role: str = "engineer"

# --- Import & Validation Schemas ---
class ValidationErrorDetail(BaseModel):
    row_number: int
    field: str
    invalid_value: Any
    reason: str

class ValidationReport(BaseModel):
    filename: str
    total_records: int
    valid_records_count: int
    invalid_records_count: int
    duplicate_records_count: int
    errors: List[ValidationErrorDetail] = []
    missing_value_summary: Dict[str, int] = {}
    is_valid_for_import: bool
    preview_records: List[Dict[str, Any]] = []

class ImportCommitRequest(BaseModel):
    import_id: str
    filename: str
    valid_records: List[Dict[str, Any]]

class ImportSummary(BaseModel):
    import_id: str
    filename: str
    total_records: int
    valid_records: int
    invalid_records: int
    status: str
    created_at: datetime.datetime
    uploaded_by: Optional[str] = None

# --- Inspection & Defect Schemas ---
class DefectCreate(BaseModel):
    defect_category: str
    defect_description: Optional[str] = None
    severity: str = "Medium"
    image_url: Optional[str] = None

class DefectResponse(BaseModel):
    id: int
    inspection_id: int
    defect_category: str
    defect_description: Optional[str]
    severity: str
    image_url: Optional[str]
    created_at: datetime.datetime

    class Config:
        from_attributes = True

class InspectionCreate(BaseModel):
    inspection_id: str
    inspection_date: datetime.datetime
    product_id: str
    product_name: str
    production_line: str
    machine_id: str
    shift: str
    units_inspected: int
    defective_units: int
    units_passed_first_inspection: Optional[int] = None
    defect_category: Optional[str] = None
    defect_description: Optional[str] = None
    severity: Optional[str] = None
    inspection_status: str = "PASSED"

class InspectionResponse(BaseModel):
    id: int
    inspection_id: str
    inspection_date: datetime.datetime
    product_name: Optional[str] = None
    production_line: Optional[str] = None
    machine_id: Optional[str] = None
    shift: str
    units_inspected: int
    defective_units: int
    units_passed_first_inspection: int
    defect_rate: float
    inspection_status: str
    defects: List[DefectResponse] = []

    class Config:
        from_attributes = True

# --- Investigation Schemas ---
class WhyStepSchema(BaseModel):
    step_number: int # 1 to 5
    question: str
    answer: str
    evidence: Optional[str] = None
    notes: Optional[str] = None

class InvestigationCreate(BaseModel):
    defect_category: str
    product_name: Optional[str] = None
    production_line: Optional[str] = None
    machine_id: Optional[str] = None
    problem_description: str
    severity: str = "Medium"
    investigation_owner: str
    observed_evidence: Optional[str] = None
    suspected_factors: Optional[str] = None
    root_cause_hypothesis: Optional[str] = None
    verified_root_cause: Optional[str] = None
    verification_method: Optional[str] = None
    corrective_action: Optional[str] = None
    preventive_action: Optional[str] = None
    why_steps: List[WhyStepSchema] = []

class InvestigationUpdate(BaseModel):
    investigation_status: Optional[str] = None
    severity: Optional[str] = None
    investigation_owner: Optional[str] = None
    observed_evidence: Optional[str] = None
    suspected_factors: Optional[str] = None
    root_cause_hypothesis: Optional[str] = None
    verified_root_cause: Optional[str] = None
    verification_method: Optional[str] = None
    corrective_action: Optional[str] = None
    preventive_action: Optional[str] = None
    review_date: Optional[datetime.datetime] = None
    date_closed: Optional[datetime.datetime] = None
    why_steps: Optional[List[WhyStepSchema]] = None

class InvestigationResponse(BaseModel):
    id: int
    investigation_reference: str
    defect_category: str
    product_name: Optional[str]
    production_line: Optional[str]
    machine_id: Optional[str]
    problem_description: str
    severity: str
    investigation_owner: str
    investigation_status: str
    observed_evidence: Optional[str]
    suspected_factors: Optional[str]
    root_cause_hypothesis: Optional[str]
    verified_root_cause: Optional[str]
    verification_method: Optional[str]
    corrective_action: Optional[str]
    preventive_action: Optional[str]
    date_opened: datetime.datetime
    review_date: Optional[datetime.datetime]
    date_closed: Optional[datetime.datetime]
    why_steps: List[WhyStepSchema] = []

    class Config:
        from_attributes = True

# --- Analytics Schemas ---
class KPISummary(BaseModel):
    total_inspected_units: int
    total_defective_units: int
    overall_defect_rate: float # percentage
    first_pass_yield: float # percentage
    fpy_available: bool = True
    total_inspections: int
    number_of_defect_categories: int
    open_investigations: int
    threshold_status: str # NORMAL, WARNING, CRITICAL
    assumptions_note: str

class ParetoItem(BaseModel):
    category: str
    defect_count: int
    percentage: float # percentage contribution
    cumulative_percentage: float
    is_vital_few: bool # within 80%

class ParetoAnalysisResponse(BaseModel):
    items: List[ParetoItem]
    total_defects: int
    vital_few_categories: List[str]
    cumulative_80_threshold: float = 80.0
    methodology_note: str

class DefectTrendPoint(BaseModel):
    period: str # YYYY-MM-DD or week/month
    inspected_units: int
    defective_units: int
    defect_rate: float
    defect_count: int

class DefectTrendResponse(BaseModel):
    grouping: str # daily, weekly, monthly
    points: List[DefectTrendPoint]

class LineComparisonItem(BaseModel):
    production_line: str
    inspected_units: int
    defective_units: int
    defect_rate: float
    status: str # NORMAL, WARNING, CRITICAL

class MachinePerformanceItem(BaseModel):
    machine_id: str
    machine_name: str
    production_line: str
    inspected_units: int
    defective_units: int
    defect_rate: float
    top_defect_category: Optional[str]
    status: str # NORMAL, WARNING, CRITICAL
    alert: bool

class AnomalyItem(BaseModel):
    date: str
    entity_type: str # line or machine
    entity_id: str
    metric: str
    observed_value: float
    expected_threshold: float
    severity: str
    description: str

# --- Monitoring & Threshold Schemas ---
class QualityThresholdConfig(BaseModel):
    normal_max: float = Field(2.0, ge=0.0, le=100.0)
    warning_max: float = Field(5.0, ge=0.0, le=100.0)

# --- Image Evidence Schemas ---
class ImageEvidenceCreate(BaseModel):
    secure_url: str
    public_id: str
    original_filename: str
    file_size: int
    content_type: str
    defect_category: Optional[str] = None
    associated_inspection_id: Optional[str] = None
    associated_investigation_id: Optional[str] = None
    notes: Optional[str] = None

class ImageEvidenceResponse(BaseModel):
    id: int
    image_id: str
    secure_url: str
    public_id: str
    original_filename: str
    file_size: int
    content_type: str
    defect_category: Optional[str]
    associated_inspection_id: Optional[str]
    associated_investigation_id: Optional[str]
    notes: Optional[str]
    uploaded_by: Optional[str]
    uploaded_at: datetime.datetime

    class Config:
        from_attributes = True

# --- Reports Schemas ---
class ReportGenerateRequest(BaseModel):
    title: str = "Quality Engineering Analytics & Root Cause Report"
    start_date: Optional[str] = None
    end_date: Optional[str] = None
    product_name: Optional[str] = None
    production_line: Optional[str] = None
    machine_id: Optional[str] = None
    defect_category: Optional[str] = None
    include_pareto: bool = True
    include_investigations: bool = True
    export_format: str = "pdf" # pdf or csv
