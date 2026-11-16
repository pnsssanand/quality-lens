import csv
import io
import re
import datetime
from typing import List, Dict, Any, Tuple, Optional
from app.schemas.schemas import ValidationReport, ValidationErrorDetail

REQUIRED_COLUMNS = [
    "inspection_id",
    "inspection_date",
    "product_id",
    "product_name",
    "production_line",
    "machine_id",
    "shift",
    "units_inspected",
    "defective_units",
    "defect_category",
    "defect_description",
    "severity",
    "inspection_status"
]

APPROVED_DEFECT_CATEGORIES = [
    "Surface Scratch",
    "Dimensional Deviation",
    "Material Crack",
    "Assembly Misalignment",
    "Contamination",
    "Electrical Failure",
    "Missing Component",
    "Packaging Damage",
    "None",
    ""
]

APPROVED_SEVERITIES = ["Low", "Medium", "High", "Critical", "None", ""]
APPROVED_SHIFTS = ["Shift 1", "Shift 2", "Shift 3", "Morning", "Evening", "Night"]
APPROVED_STATUSES = ["PASSED", "FAILED", "REWORK"]

class CSVInspectionValidator:
    """
    Validates engineering inspection dataset CSV according to engineering quality criteria.
    Reports all syntax, type, range, constraint, and duplicate errors.
    """
    
    @staticmethod
    def parse_date(date_str: str) -> Optional[datetime.datetime]:
        if not date_str or not str(date_str).strip():
            return None
        clean_str = str(date_str).strip()
        formats = [
            "%Y-%m-%d",
            "%Y-%m-%d %H:%M:%S",
            "%Y/%m/%d",
            "%d-%m-%Y",
            "%d/%m/%Y",
            "%Y-%m-%dT%H:%M:%S",
            "%Y-%m-%dT%H:%M:%SZ"
        ]
        for fmt in formats:
            try:
                return datetime.datetime.strptime(clean_str, fmt)
            except ValueError:
                continue
        return None

    @classmethod
    def validate_csv_content(
        cls, 
        content_bytes: bytes, 
        filename: str = "dataset.csv",
        existing_inspection_ids: Optional[set] = None
    ) -> Tuple[ValidationReport, List[Dict[str, Any]], List[Dict[str, Any]]]:
        """
        Parses and validates CSV content.
        Returns:
            - ValidationReport
            - valid_records (list of dicts)
            - invalid_records (list of dicts with their errors)
        """
        if existing_inspection_ids is None:
            existing_inspection_ids = set()

        try:
            text = content_bytes.decode("utf-8-sig")
        except UnicodeDecodeError:
            try:
                text = content_bytes.decode("latin-1")
            except Exception as e:
                return (
                    ValidationReport(
                        filename=filename,
                        total_records=0,
                        valid_records_count=0,
                        invalid_records_count=0,
                        duplicate_records_count=0,
                        errors=[ValidationErrorDetail(
                            row_number=0,
                            field="file",
                            invalid_value="",
                            reason=f"File encoding not recognized. Please use UTF-8 CSV: {str(e)}"
                        )],
                        is_valid_for_import=False
                    ),
                    [],
                    []
                )

        reader = csv.DictReader(io.StringIO(text))
        if not reader.fieldnames:
            return (
                ValidationReport(
                    filename=filename,
                    total_records=0,
                    valid_records_count=0,
                    invalid_records_count=0,
                    duplicate_records_count=0,
                    errors=[ValidationErrorDetail(
                        row_number=1,
                        field="headers",
                        invalid_value="",
                        reason="CSV file is empty or missing headers"
                    )],
                    is_valid_for_import=False
                ),
                [],
                []
            )

        # Normalize fieldnames
        actual_headers = [h.strip() for h in reader.fieldnames if h]
        missing_columns = [col for col in REQUIRED_COLUMNS if col not in actual_headers]
        
        errors: List[ValidationErrorDetail] = []
        if missing_columns:
            errors.append(ValidationErrorDetail(
                row_number=1,
                field="headers",
                invalid_value=", ".join(actual_headers),
                reason=f"Missing required columns: {', '.join(missing_columns)}"
            ))
            return (
                ValidationReport(
                    filename=filename,
                    total_records=0,
                    valid_records_count=0,
                    invalid_records_count=0,
                    duplicate_records_count=0,
                    errors=errors,
                    missing_value_summary={col: 1 for col in missing_columns},
                    is_valid_for_import=False
                ),
                [],
                []
            )

        total_records = 0
        valid_records: List[Dict[str, Any]] = []
        invalid_records: List[Dict[str, Any]] = []
        seen_in_file_ids = set()
        duplicate_count = 0
        missing_counts = {col: 0 for col in REQUIRED_COLUMNS}

        for row_idx, row in enumerate(reader, start=2): # line 1 is header
            total_records += 1
            row_errors: List[ValidationErrorDetail] = []
            cleaned_row: Dict[str, Any] = {}

            # Check missing values
            for col in REQUIRED_COLUMNS:
                val = row.get(col, "")
                if val is None or str(val).strip() == "":
                    # some columns are conditionally optional
                    if col not in ["defect_description", "defect_category", "severity"]:
                        missing_counts[col] += 1
                        row_errors.append(ValidationErrorDetail(
                            row_number=row_idx,
                            field=col,
                            invalid_value=val,
                            reason=f"Field '{col}' is required and cannot be empty"
                        ))

            # Inspection ID validation & duplicate detection
            insp_id = str(row.get("inspection_id", "")).strip()
            if not insp_id:
                row_errors.append(ValidationErrorDetail(
                    row_number=row_idx,
                    field="inspection_id",
                    invalid_value=insp_id,
                    reason="Inspection ID cannot be empty"
                ))
            elif insp_id in seen_in_file_ids:
                duplicate_count += 1
                row_errors.append(ValidationErrorDetail(
                    row_number=row_idx,
                    field="inspection_id",
                    invalid_value=insp_id,
                    reason=f"Duplicate inspection_id '{insp_id}' detected within this file"
                ))
            elif insp_id in existing_inspection_ids:
                duplicate_count += 1
                row_errors.append(ValidationErrorDetail(
                    row_number=row_idx,
                    field="inspection_id",
                    invalid_value=insp_id,
                    reason=f"Inspection ID '{insp_id}' already exists in database"
                ))
            else:
                seen_in_file_ids.add(insp_id)
            cleaned_row["inspection_id"] = insp_id

            # Inspection Date validation
            date_str = str(row.get("inspection_date", "")).strip()
            parsed_date = cls.parse_date(date_str)
            if not parsed_date:
                row_errors.append(ValidationErrorDetail(
                    row_number=row_idx,
                    field="inspection_date",
                    invalid_value=date_str,
                    reason="Invalid date format. Expected YYYY-MM-DD or ISO 8601"
                ))
            else:
                cleaned_row["inspection_date"] = parsed_date

            # Product & Line validation
            prod_id = str(row.get("product_id", "")).strip()
            prod_name = str(row.get("product_name", "")).strip()
            line = str(row.get("production_line", "")).strip()
            mch_id = str(row.get("machine_id", "")).strip()

            if not prod_id:
                row_errors.append(ValidationErrorDetail(
                    row_number=row_idx, field="product_id", invalid_value=prod_id,
                    reason="Product ID cannot be empty"
                ))
            if not line:
                row_errors.append(ValidationErrorDetail(
                    row_number=row_idx, field="production_line", invalid_value=line,
                    reason="Production line cannot be empty"
                ))
            if not mch_id:
                row_errors.append(ValidationErrorDetail(
                    row_number=row_idx, field="machine_id", invalid_value=mch_id,
                    reason="Machine ID cannot be empty"
                ))

            cleaned_row["product_id"] = prod_id
            cleaned_row["product_name"] = prod_name or prod_id
            cleaned_row["production_line"] = line
            cleaned_row["machine_id"] = mch_id

            # Shift validation
            shift_val = str(row.get("shift", "")).strip()
            cleaned_row["shift"] = shift_val if shift_val in APPROVED_SHIFTS else "Shift 1"

            # Numerical validation: units_inspected & defective_units
            units_raw = str(row.get("units_inspected", "")).strip()
            defective_raw = str(row.get("defective_units", "")).strip()

            units_val = 0
            defective_val = 0

            try:
                units_val = int(units_raw)
                if units_val <= 0:
                    row_errors.append(ValidationErrorDetail(
                        row_number=row_idx, field="units_inspected", invalid_value=units_raw,
                        reason="Units inspected must be a positive integer greater than 0"
                    ))
            except ValueError:
                row_errors.append(ValidationErrorDetail(
                    row_number=row_idx, field="units_inspected", invalid_value=units_raw,
                    reason=f"Units inspected '{units_raw}' is not a valid integer"
                ))

            try:
                defective_val = int(defective_raw)
                if defective_val < 0:
                    row_errors.append(ValidationErrorDetail(
                        row_number=row_idx, field="defective_units", invalid_value=defective_raw,
                        reason="Defective units cannot be negative"
                    ))
            except ValueError:
                row_errors.append(ValidationErrorDetail(
                    row_number=row_idx, field="defective_units", invalid_value=defective_raw,
                    reason=f"Defective units '{defective_raw}' is not a valid integer"
                ))

            if units_val > 0 and defective_val > units_val:
                row_errors.append(ValidationErrorDetail(
                    row_number=row_idx, field="defective_units", invalid_value=defective_val,
                    reason=f"Defective units ({defective_val}) cannot exceed units inspected ({units_val})"
                ))

            cleaned_row["units_inspected"] = units_val
            cleaned_row["defective_units"] = defective_val

            # Units passed first inspection calculation (for First Pass Yield)
            passed_first = units_val - defective_val
            cleaned_row["units_passed_first_inspection"] = max(0, passed_first)

            # Defect category & severity validation
            cat_val = str(row.get("defect_category", "")).strip()
            sev_val = str(row.get("severity", "")).strip()
            desc_val = str(row.get("defect_description", "")).strip()

            if defective_val > 0:
                if not cat_val or cat_val == "None":
                    row_errors.append(ValidationErrorDetail(
                        row_number=row_idx, field="defect_category", invalid_value=cat_val,
                        reason="Defect category is required when defective units > 0"
                    ))
                elif cat_val not in APPROVED_DEFECT_CATEGORIES:
                    # Non-standard category warning/error
                    row_errors.append(ValidationErrorDetail(
                        row_number=row_idx, field="defect_category", invalid_value=cat_val,
                        reason=f"Defect category '{cat_val}' is not in approved list ({', '.join(APPROVED_DEFECT_CATEGORIES[:5])}...)"
                    ))
                
                if not sev_val or sev_val == "None":
                    sev_val = "Medium"
                elif sev_val not in APPROVED_SEVERITIES:
                    row_errors.append(ValidationErrorDetail(
                        row_number=row_idx, field="severity", invalid_value=sev_val,
                        reason=f"Severity '{sev_val}' must be one of: {', '.join(APPROVED_SEVERITIES)}"
                    ))
            else:
                cat_val = "None"
                sev_val = "None"

            cleaned_row["defect_category"] = cat_val
            cleaned_row["defect_description"] = desc_val
            cleaned_row["severity"] = sev_val

            # Status validation
            status_val = str(row.get("inspection_status", "")).strip().upper()
            if status_val not in APPROVED_STATUSES:
                status_val = "FAILED" if defective_val > 0 else "PASSED"
            cleaned_row["inspection_status"] = status_val

            if row_errors:
                errors.extend(row_errors)
                cleaned_row["_errors"] = [e.reason for e in row_errors]
                invalid_records.append(cleaned_row)
            else:
                valid_records.append(cleaned_row)

        preview_records = []
        for r in (valid_records[:5] + invalid_records[:5])[:8]:
            p = dict(r)
            if "inspection_date" in p and isinstance(p["inspection_date"], datetime.datetime):
                p["inspection_date"] = p["inspection_date"].strftime("%Y-%m-%d")
            preview_records.append(p)

        report = ValidationReport(
            filename=filename,
            total_records=total_records,
            valid_records_count=len(valid_records),
            invalid_records_count=len(invalid_records),
            duplicate_records_count=duplicate_count,
            errors=errors[:100], # return first 100 errors for response compactness
            missing_value_summary=missing_counts,
            is_valid_for_import=(len(valid_records) > 0),
            preview_records=preview_records
        )

        return report, valid_records, invalid_records

    @staticmethod
    def get_template_csv() -> str:
        """Returns standard CSV template content"""
        output = io.StringIO()
        writer = csv.writer(output)
        writer.writerow(REQUIRED_COLUMNS)
        writer.writerow([
            "INSP-2026-0001",
            "2026-03-01",
            "PRD-A100",
            "Precision Microcontroller Hub",
            "Line Alpha",
            "MCH-01",
            "Shift 1",
            "500",
            "8",
            "Surface Scratch",
            "Fine micro-scratches on casing edge",
            "Low",
            "PASSED"
        ])
        writer.writerow([
            "INSP-2026-0002",
            "2026-03-01",
            "PRD-B200",
            "Industrial Signal Transceiver",
            "Line Beta",
            "MCH-04",
            "Shift 2",
            "450",
            "0",
            "None",
            "",
            "None",
            "PASSED"
        ])
        return output.getvalue()
