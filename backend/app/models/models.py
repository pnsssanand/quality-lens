import datetime
from sqlalchemy import (
    Column, Integer, String, Float, DateTime, ForeignKey, Text, Index, UniqueConstraint
)
from sqlalchemy.orm import relationship
from app.database.session import Base

class Product(Base):
    __tablename__ = "products"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    firestore_document_id = Column(String(128), unique=True, index=True, nullable=True)
    product_id = Column(String(64), unique=True, index=True, nullable=False)
    product_name = Column(String(128), nullable=False)
    description = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow, nullable=False)

    inspections = relationship("Inspection", back_populates="product")

class ProductionLine(Base):
    __tablename__ = "production_lines"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    firestore_document_id = Column(String(128), unique=True, index=True, nullable=True)
    line_name = Column(String(64), unique=True, index=True, nullable=False)
    location = Column(String(128), nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow, nullable=False)

    machines = relationship("Machine", back_populates="production_line")
    inspections = relationship("Inspection", back_populates="production_line")

class Machine(Base):
    __tablename__ = "machines"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    firestore_document_id = Column(String(128), unique=True, index=True, nullable=True)
    machine_id = Column(String(64), unique=True, index=True, nullable=False)
    machine_name = Column(String(128), nullable=False)
    production_line_id = Column(Integer, ForeignKey("production_lines.id", ondelete="SET NULL"), nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow, nullable=False)

    production_line = relationship("ProductionLine", back_populates="machines")
    inspections = relationship("Inspection", back_populates="machine")

class DataImport(Base):
    __tablename__ = "data_imports"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    firestore_document_id = Column(String(128), unique=True, index=True, nullable=True)
    import_id = Column(String(64), unique=True, index=True, nullable=False)
    filename = Column(String(256), nullable=False)
    total_records = Column(Integer, default=0)
    valid_records = Column(Integer, default=0)
    invalid_records = Column(Integer, default=0)
    duplicate_records = Column(Integer, default=0)
    status = Column(String(32), default="COMPLETED") # COMPLETED, FAILED, PENDING
    uploaded_by = Column(String(128), nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow, nullable=False)

    inspections = relationship("Inspection", back_populates="source_import")

class Inspection(Base):
    __tablename__ = "inspections"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    firestore_document_id = Column(String(128), unique=True, index=True, nullable=True)
    inspection_id = Column(String(64), unique=True, index=True, nullable=False)
    inspection_date = Column(DateTime, index=True, nullable=False)
    product_id = Column(Integer, ForeignKey("products.id", ondelete="CASCADE"), nullable=True)
    production_line_id = Column(Integer, ForeignKey("production_lines.id", ondelete="SET NULL"), nullable=True)
    machine_id = Column(Integer, ForeignKey("machines.id", ondelete="SET NULL"), nullable=True)
    shift = Column(String(32), index=True, nullable=False) # Shift 1, Shift 2, Shift 3
    units_inspected = Column(Integer, nullable=False)
    defective_units = Column(Integer, nullable=False)
    units_passed_first_inspection = Column(Integer, nullable=False)
    inspection_status = Column(String(32), nullable=False, default="PASSED") # PASSED, FAILED, REWORK
    source_import_id = Column(Integer, ForeignKey("data_imports.id", ondelete="SET NULL"), nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow, nullable=False)

    product = relationship("Product", back_populates="inspections")
    production_line = relationship("ProductionLine", back_populates="inspections")
    machine = relationship("Machine", back_populates="inspections")
    source_import = relationship("DataImport", back_populates="inspections")
    defects = relationship("Defect", back_populates="inspection", cascade="all, delete-orphan")

    __table_args__ = (
        Index("idx_inspection_date_line", "inspection_date", "production_line_id"),
        Index("idx_inspection_date_prod", "inspection_date", "product_id"),
    )

class Defect(Base):
    __tablename__ = "defects"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    firestore_document_id = Column(String(128), unique=True, index=True, nullable=True)
    inspection_id = Column(Integer, ForeignKey("inspections.id", ondelete="CASCADE"), nullable=False)
    defect_category = Column(String(64), index=True, nullable=False)
    defect_description = Column(Text, nullable=True)
    severity = Column(String(32), index=True, nullable=False) # Low, Medium, High, Critical
    image_url = Column(String(512), nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow, nullable=False)

    inspection = relationship("Inspection", back_populates="defects")
    investigations = relationship("Investigation", back_populates="defect")

class Investigation(Base):
    __tablename__ = "investigations"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    firestore_document_id = Column(String(128), unique=True, index=True, nullable=True)
    investigation_reference = Column(String(64), unique=True, index=True, nullable=False)
    defect_id = Column(Integer, ForeignKey("defects.id", ondelete="SET NULL"), nullable=True)
    product_name = Column(String(128), nullable=True)
    production_line = Column(String(64), nullable=True)
    machine_id = Column(String(64), nullable=True)
    defect_category = Column(String(64), nullable=False)
    problem_description = Column(Text, nullable=False)
    severity = Column(String(32), default="Medium", nullable=False)
    investigation_owner = Column(String(128), nullable=False)
    investigation_status = Column(String(64), default="Open", index=True, nullable=False)
    observed_evidence = Column(Text, nullable=True)
    suspected_factors = Column(Text, nullable=True)
    root_cause_hypothesis = Column(Text, nullable=True)
    verified_root_cause = Column(Text, nullable=True)
    verification_method = Column(Text, nullable=True)
    corrective_action = Column(Text, nullable=True)
    preventive_action = Column(Text, nullable=True)
    date_opened = Column(DateTime, default=datetime.datetime.utcnow, nullable=False)
    review_date = Column(DateTime, nullable=True)
    date_closed = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow, nullable=False)

    defect = relationship("Defect", back_populates="investigations")
    why_steps = relationship("InvestigationWhyStep", back_populates="investigation", cascade="all, delete-orphan")

class InvestigationWhyStep(Base):
    __tablename__ = "investigation_why_steps"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    investigation_id = Column(Integer, ForeignKey("investigations.id", ondelete="CASCADE"), nullable=False)
    step_number = Column(Integer, nullable=False) # 1 to 5
    question = Column(Text, nullable=False)
    answer = Column(Text, nullable=False)
    evidence = Column(Text, nullable=True)
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow, nullable=False)

    investigation = relationship("Investigation", back_populates="why_steps")

class QualityThreshold(Base):
    __tablename__ = "quality_thresholds"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    firestore_document_id = Column(String(128), unique=True, index=True, nullable=True)
    threshold_id = Column(String(64), unique=True, index=True, nullable=False)
    scope = Column(String(32), default="GLOBAL") # GLOBAL, LINE, MACHINE
    target_identifier = Column(String(64), default="ALL")
    normal_max = Column(Float, default=2.0, nullable=False)
    warning_max = Column(Float, default=5.0, nullable=False)
    updated_by = Column(String(128), nullable=True)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow, nullable=False)

class SyncLog(Base):
    __tablename__ = "sync_logs"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    firestore_document_id = Column(String(128), nullable=True)
    collection_name = Column(String(64), nullable=False)
    sync_status = Column(String(32), nullable=False) # SUCCESS, FAILED, RETRY
    error_message = Column(Text, nullable=True)
    synced_at = Column(DateTime, default=datetime.datetime.utcnow, nullable=False)

class ImageEvidence(Base):
    __tablename__ = "image_evidences"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    firestore_document_id = Column(String(128), unique=True, index=True, nullable=True)
    image_id = Column(String(64), unique=True, index=True, nullable=False)
    secure_url = Column(String(512), nullable=False)
    public_id = Column(String(256), nullable=False)
    original_filename = Column(String(256), nullable=False)
    content_type = Column(String(64), nullable=False)
    file_size = Column(Integer, nullable=False)
    defect_category = Column(String(64), nullable=True)
    associated_inspection_id = Column(String(64), nullable=True)
    associated_defect_id = Column(String(64), nullable=True)
    associated_investigation_id = Column(String(64), nullable=True)
    notes = Column(Text, nullable=True)
    uploaded_by = Column(String(128), nullable=True)
    uploaded_at = Column(DateTime, default=datetime.datetime.utcnow, nullable=False)
