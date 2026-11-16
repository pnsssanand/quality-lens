import csv
import random
import datetime
from pathlib import Path

random.seed(42)

OUT_DIR = Path("sample_data")
OUT_DIR.mkdir(parents=True, exist_ok=True)

PRODUCTS = [
    ("PRD-A100", "Precision Microcontroller Hub"),
    ("PRD-B200", "Industrial Signal Transceiver"),
    ("PRD-C300", "Edge AI Sensor Node"),
    ("PRD-D400", "Automotive Power Inverter"),
    ("PRD-E500", "High-Speed Optical Gateway"),
]

LINES = [
    ("Line Alpha", ["MCH-01", "MCH-02"]),
    ("Line Beta", ["MCH-03", "MCH-04"]),
    ("Line Gamma", ["MCH-05", "MCH-06"]),
    ("Line Delta", ["MCH-07", "MCH-08"]),
]

SHIFTS = ["Shift 1", "Shift 2", "Shift 3"]

# Weighted failure modes to produce realistic Pareto curve (vital few ~80%)
DEFECT_WEIGHTS = [
    ("Surface Scratch", 0.38, "Fine micro-abrasions along outer enclosure surface", "Low"),
    ("Dimensional Deviation", 0.24, "Tolerance exceeded by +0.08mm on mounting bezel", "Medium"),
    ("Material Crack", 0.14, "Stress fracture observed near corner fastener hole", "High"),
    ("Assembly Misalignment", 0.10, "Pin connector misaligned by 1.2 degrees", "Medium"),
    ("Contamination", 0.06, "Particulate residue detected on optical lens", "Medium"),
    ("Electrical Failure", 0.04, "Short circuit flagged during high-voltage flash test", "High"),
    ("Missing Component", 0.02, "M2 lock washer absent from sub-assembly", "Medium"),
    ("Packaging Damage", 0.02, "ESD protective blister tray compromised", "Low")
]

DEFECT_CATS = [d[0] for d in DEFECT_WEIGHTS]
DEFECT_PROBS = [d[1] for d in DEFECT_WEIGHTS]
DEFECT_DESCS = {d[0]: d[2] for d in DEFECT_WEIGHTS}
DEFECT_SEVS = {d[0]: d[3] for d in DEFECT_WEIGHTS}

def generate_valid_dataset(count=1200):
    start_date = datetime.date(2026, 4, 1)
    rows = []

    for i in range(1, count + 1):
        insp_id = f"INSP-2026-{i:05d}"
        day_offset = random.randint(0, 180) # 6 months
        insp_date = start_date + datetime.timedelta(days=day_offset)
        
        prod_id, prod_name = random.choice(PRODUCTS)
        line_name, machines = random.choice(LINES)
        machine_id = random.choice(machines)
        shift = random.choice(SHIFTS)
        
        units_inspected = random.choice([250, 400, 500, 750, 1000])

        # Realistic defect distribution: ~70% zero defect, 30% has defects
        # Machine MCH-04 has slightly higher defect likelihood to reflect realistic manufacturing variation
        is_troubled_machine = (machine_id == "MCH-04")
        defect_chance = 0.45 if is_troubled_machine else 0.28
        has_defect = random.random() < defect_chance

        if has_defect:
            defect_rate_pct = random.uniform(0.5, 6.5) if not is_troubled_machine else random.uniform(3.0, 9.5)
            defective_units = max(1, int((defect_rate_pct / 100.0) * units_inspected))
            defect_category = random.choices(DEFECT_CATS, weights=DEFECT_PROBS, k=1)[0]
            defect_description = DEFECT_DESCS[defect_category]
            severity = DEFECT_SEVS[defect_category]
            inspection_status = "REWORK" if severity in ["Low", "Medium"] and random.random() < 0.5 else "FAILED"
        else:
            defective_units = 0
            defect_category = "None"
            defect_description = ""
            severity = "None"
            inspection_status = "PASSED"

        rows.append([
            insp_id,
            insp_date.isoformat(),
            prod_id,
            prod_name,
            line_name,
            machine_id,
            shift,
            units_inspected,
            defective_units,
            defect_category,
            defect_description,
            severity,
            inspection_status
        ])

    csv_file = OUT_DIR / "sample_quality_data.csv"
    with open(csv_file, "w", newline="", encoding="utf-8") as f:
        writer = csv.writer(f)
        writer.writerow([
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
        ])
        writer.writerows(rows)
    print(f"Generated {len(rows)} valid synthetic records in {csv_file}")

def generate_invalid_dataset():
    """Generates deliberately corrupted records to test and verify the validation engine"""
    rows = [
        ["INSP-TEST-001", "2026-06-01", "PRD-A100", "Precision Hub", "Line Alpha", "MCH-01", "Shift 1", "500", "800", "Surface Scratch", "Defective units exceed inspected", "Low", "FAILED"],
        ["INSP-TEST-002", "INVALID_DATE_FORMAT", "PRD-A100", "Precision Hub", "Line Alpha", "MCH-01", "Shift 1", "500", "5", "Surface Scratch", "Corrupted date format", "Low", "FAILED"],
        ["INSP-TEST-003", "2026-06-02", "PRD-B200", "Industrial Transceiver", "Line Beta", "MCH-03", "Shift 2", "-50", "0", "None", "Negative inspected units", "None", "PASSED"],
        ["INSP-TEST-004", "2026-06-03", "", "Industrial Transceiver", "Line Beta", "MCH-03", "Shift 2", "500", "0", "None", "Missing product id", "None", "PASSED"],
        ["INSP-TEST-005", "2026-06-04", "PRD-C300", "Edge AI Node", "Line Gamma", "MCH-05", "Shift 3", "400", "12", "Fake Unknown Failure Mode", "Invalid unapproved defect category", "ExtremeCatastrophic", "FAILED"],
        ["INSP-TEST-001", "2026-06-05", "PRD-D400", "Automotive Inverter", "Line Delta", "MCH-07", "Shift 1", "600", "4", "Material Crack", "Duplicate inspection ID (same as row 1)", "High", "FAILED"]
    ]

    csv_file = OUT_DIR / "invalid_quality_data.csv"
    with open(csv_file, "w", newline="", encoding="utf-8") as f:
        writer = csv.writer(f)
        writer.writerow([
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
        ])
        writer.writerows(rows)
    print(f"Generated {len(rows)} invalid test records in {csv_file}")

if __name__ == "__main__":
    generate_valid_dataset(1200)
    generate_invalid_dataset()
