export const MOCK_SUMMARY = {
  total_inspected_units: 1200,
  total_defective_units: 40,
  overall_defect_rate: 3.33,
  first_pass_yield: 96.67,
  fpy_available: true,
  total_inspections: 120,
  number_of_defect_categories: 8,
  open_investigations: 2,
  threshold_status: "WARNING",
  assumptions_note: "FPY assumes units passing first inspection equals inspected minus defective units."
};

export const MOCK_TRENDS_WEEKLY = {
  grouping: "weekly",
  points: [
    { period: "2026-W14", inspected_units: 180, defective_units: 5, defect_rate: 2.78, defect_count: 5 },
    { period: "2026-W15", inspected_units: 210, defective_units: 6, defect_rate: 2.86, defect_count: 6 },
    { period: "2026-W16", inspected_units: 195, defective_units: 8, defect_rate: 4.10, defect_count: 8 },
    { period: "2026-W17", inspected_units: 220, defective_units: 7, defect_rate: 3.18, defect_count: 7 },
    { period: "2026-W18", inspected_units: 205, defective_units: 6, defect_rate: 2.93, defect_count: 6 },
    { period: "2026-W19", inspected_units: 190, defective_units: 8, defect_rate: 4.21, defect_count: 8 }
  ]
};

export const MOCK_PARETO = {
  items: [
    { category: "Surface Scratch", defect_count: 15, percentage: 37.5, cumulative_percentage: 37.5, is_vital_few: true },
    { category: "Dimensional Deviation", defect_count: 10, percentage: 25.0, cumulative_percentage: 62.5, is_vital_few: true },
    { category: "Material Crack", defect_count: 6, percentage: 15.0, cumulative_percentage: 77.5, is_vital_few: true },
    { category: "Assembly Misalignment", defect_count: 4, percentage: 10.0, cumulative_percentage: 87.5, is_vital_few: true },
    { category: "Contamination", defect_count: 2, percentage: 5.0, cumulative_percentage: 92.5, is_vital_few: false },
    { category: "Electrical Failure", defect_count: 1, percentage: 2.5, cumulative_percentage: 95.0, is_vital_few: false },
    { category: "Missing Component", defect_count: 1, percentage: 2.5, cumulative_percentage: 97.5, is_vital_few: false },
    { category: "Packaging Damage", defect_count: 1, percentage: 2.5, cumulative_percentage: 100.0, is_vital_few: false }
  ],
  total_defects: 40,
  vital_few_categories: ["Surface Scratch", "Dimensional Deviation", "Material Crack", "Assembly Misalignment"],
  cumulative_80_threshold: 80.0,
  methodology_note: "Pareto analysis ranks failure modes by frequency. Categories up to 80% represent the Vital Few."
};

export const MOCK_LINE_COMPARISON = [
  { production_line: "Line Alpha", inspected_units: 320, defective_units: 8, defect_rate: 2.50, status: "WARNING" },
  { production_line: "Line Beta", inspected_units: 310, defective_units: 15, defect_rate: 4.84, status: "WARNING" },
  { production_line: "Line Gamma", inspected_units: 290, defective_units: 11, defect_rate: 3.79, status: "WARNING" },
  { production_line: "Line Delta", inspected_units: 280, defective_units: 6, defect_rate: 2.14, status: "WARNING" }
];

export const MOCK_FILTER_OPTIONS = {
  products: [
    "PRD-A100 Precision Microcontroller Hub",
    "PRD-B200 Industrial Signal Transceiver",
    "PRD-C300 Edge AI Sensor Node",
    "PRD-D400 Automotive Power Inverter",
    "PRD-E500 High-Speed Optical Gateway"
  ],
  production_lines: ["Line Alpha", "Line Beta", "Line Gamma", "Line Delta"],
  machines: ["MCH-01", "MCH-02", "MCH-03", "MCH-04", "MCH-05", "MCH-06", "MCH-07", "MCH-08"],
  shifts: ["Shift 1", "Shift 2", "Shift 3"],
  defect_categories: [
    "Surface Scratch",
    "Dimensional Deviation",
    "Material Crack",
    "Assembly Misalignment",
    "Contamination",
    "Electrical Failure",
    "Missing Component",
    "Packaging Damage"
  ]
};

export const MOCK_INVESTIGATIONS = [
  {
    id: 1,
    investigation_reference: "INV-2026-0042",
    defect_category: "Assembly Misalignment",
    product_name: "Industrial Signal Transceiver",
    production_line: "Line Beta",
    machine_id: "MCH-04",
    problem_description: "Recurrent 1.2° pin offset on connector headers during Shift 3 pick-and-place operation.",
    severity: "Medium",
    investigation_owner: "Senior Quality Analyst",
    investigation_status: "Corrective Action In Progress",
    observed_evidence: "High rejection rate at optical inspection station; visual verification shows robotic clamp wear.",
    suspected_factors: "Thermal expansion of pneumatic arm after 8 hours continuous running and worn guide bushings.",
    root_cause_hypothesis: "Pneumatic suction head calibration drifting due to loose mounting screw on axis 2.",
    verified_root_cause: "Fatigued mechanical coupling bracket on pneumatic head caused 0.4mm micro-play under load.",
    verification_method: "High-speed camera tracking & dial indicator vibration measurement under production load.",
    corrective_action: "Replaced pneumatic clamp bracket with hardened steel grade fastener and torqued to 8.5 Nm.",
    preventive_action: "Added 200-hour preventive torque inspection check to shift hand-over digital checklist.",
    date_opened: "2026-05-14T09:00:00Z",
    why_steps: [
      { step_number: 1, question: "Why did the pin connector fail automated optical alignment check?", answer: "The header pins were seated 1.2 degrees askew relative to PCB solder pads.", evidence: "Station AOI camera capture log #8821", notes: "Observed across 18 sequential boards" },
      { step_number: 2, question: "Why were the pins seated askew by the insertion gripper?", answer: "The vacuum pick-and-place head exhibited lateral oscillation during placement.", evidence: "Laser micrometer reading showed 0.4mm horizontal deviation", notes: "No deviation noticed during manual dry run" },
      { step_number: 3, question: "Why did the pick-and-place head oscillate during placement stroke?", answer: "The guide bracket connecting the actuator to the axis rod had excessive mechanical clearance.", evidence: "Physical inspection found noticeable play when manually deflected", notes: "Bracket had been in continuous service for 14 months" },
      { step_number: 4, question: "Why was mechanical clearance allowed to develop beyond engineering tolerance?", answer: "The standard aluminum bracket fatigued under cyclic stress at high acceleration.", evidence: "Metallurgical cross-section indicated fatigue striations at bolt interface", notes: "Aluminum alloy 6061 rated below operational shear requirement" },
      { step_number: 5, question: "Why was the bracket specified in aluminum without cyclic fatigue life threshold?", answer: "Original machine procurement specification lacked dynamic load fatigue endurance requirement for custom tooling brackets.", evidence: "Procurement standard P-904 reviewed", notes: "Engineering change notice ECN-881 filed to mandate steel components for dynamic fixtures" }
    ]
  },
  {
    id: 2,
    investigation_reference: "INV-2026-0043",
    defect_category: "Surface Scratch",
    product_name: "Precision Microcontroller Hub",
    production_line: "Line Alpha",
    machine_id: "MCH-01",
    problem_description: "Surface scuff marks on anodized aluminum top cover.",
    severity: "Low",
    investigation_owner: "Lead Manufacturing Engineer",
    investigation_status: "Open",
    observed_evidence: "Scratches occur at output transfer conveyor guide rails.",
    suspected_factors: "Accumulation of metallic burrs on nylon side guides.",
    root_cause_hypothesis: "Side guide railing friction against finished housing during transfer.",
    date_opened: "2026-05-20T10:00:00Z",
    why_steps: [
      { step_number: 1, question: "Why did scuff marks appear on housing?", answer: "Frictional contact with conveyor side rails.", evidence: "Surface profilometer scan", notes: "" },
      { step_number: 2, question: "Why was friction excessive on the rail?", answer: "Nylon guide rail wear strips detached.", evidence: "Physical inspection of transfer zone", notes: "" },
      { step_number: 3, question: "Why did wear strips detach?", answer: "Fastener adhesive degraded under cleaning solvent.", evidence: "Chemical compatibility sheet", notes: "" },
      { step_number: 4, question: "Why was aggressive solvent used?", answer: "Maintenance used unapproved solvent batch.", evidence: "Stockroom requisition audit", notes: "" },
      { step_number: 5, question: "Why was unapproved solvent available?", answer: "Solvent barcoding not integrated into inventory checkout system.", evidence: "ERP gap assessment", notes: "" }
    ]
  }
];

export const MOCK_MONITORING = {
  thresholds: { normal_max: 2.0, warning_max: 5.0 },
  total_monitored_stations: 8,
  critical_alerts_count: 1,
  warning_alerts_count: 4,
  stations: [
    { machine_id: "MCH-01", machine_name: "Assembly Station MCH-01", production_line: "Line Alpha", units_inspected: 160, defective_units: 3, defect_rate: 1.88, status: "NORMAL", alert: false, top_defect_category: "Surface Scratch", last_updated: "2026-11-17 08:00 UTC" },
    { machine_id: "MCH-02", machine_name: "Assembly Station MCH-02", production_line: "Line Alpha", units_inspected: 160, defective_units: 5, defect_rate: 3.12, status: "WARNING", alert: false, top_defect_category: "Dimensional Deviation", last_updated: "2026-11-17 08:00 UTC" },
    { machine_id: "MCH-03", machine_name: "Assembly Station MCH-03", production_line: "Line Beta", units_inspected: 150, defective_units: 4, defect_rate: 2.67, status: "WARNING", alert: false, top_defect_category: "Material Crack", last_updated: "2026-11-17 08:00 UTC" },
    { machine_id: "MCH-04", machine_name: "Assembly Station MCH-04", production_line: "Line Beta", units_inspected: 160, defective_units: 11, defect_rate: 6.88, status: "CRITICAL", alert: true, top_defect_category: "Assembly Misalignment", last_updated: "2026-11-17 08:00 UTC" },
    { machine_id: "MCH-05", machine_name: "Assembly Station MCH-05", production_line: "Line Gamma", units_inspected: 145, defective_units: 5, defect_rate: 3.45, status: "WARNING", alert: false, top_defect_category: "Contamination", last_updated: "2026-11-17 08:00 UTC" },
    { machine_id: "MCH-06", machine_name: "Assembly Station MCH-06", production_line: "Line Gamma", units_inspected: 145, defective_units: 6, defect_rate: 4.14, status: "WARNING", alert: false, top_defect_category: "Dimensional Deviation", last_updated: "2026-11-17 08:00 UTC" },
    { machine_id: "MCH-07", machine_name: "Assembly Station MCH-07", production_line: "Line Delta", units_inspected: 140, defective_units: 2, defect_rate: 1.43, status: "NORMAL", alert: false, top_defect_category: "Surface Scratch", last_updated: "2026-11-17 08:00 UTC" },
    { machine_id: "MCH-08", machine_name: "Assembly Station MCH-08", production_line: "Line Delta", units_inspected: 140, defective_units: 4, defect_rate: 2.86, status: "WARNING", alert: false, top_defect_category: "Electrical Failure", last_updated: "2026-11-17 08:00 UTC" }
  ]
};

export const MOCK_IMAGES = [
  {
    image_id: "IMG-2026-001",
    secure_url: "https://images.unsplash.com/photo-1581092335397-9583fe92d232?auto=format&fit=crop&w=800&q=80",
    public_id: "qualitylens/defects/sample_scratch_evidence",
    original_filename: "housing_surface_scratch_macro.jpg",
    file_size: 245890,
    content_type: "image/jpeg",
    defect_category: "Surface Scratch",
    associated_inspection_id: "INSP-2026-00001",
    associated_investigation_id: "INV-2026-0043",
    notes: "Macro capture of 0.3mm micro-scratch across matte anodized finish.",
    uploaded_by: "Quality Assurance Tech",
    uploaded_at: "2026-05-18T10:00:00Z"
  },
  {
    image_id: "IMG-2026-002",
    secure_url: "https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=800&q=80",
    public_id: "qualitylens/defects/sample_misalignment_evidence",
    original_filename: "connector_pin_offset_aoi.png",
    file_size: 412300,
    content_type: "image/png",
    defect_category: "Assembly Misalignment",
    associated_inspection_id: "INSP-2026-00018",
    associated_investigation_id: "INV-2026-0042",
    notes: "AOI camera 1.2-degree pin deviation flag on J2 header.",
    uploaded_by: "Senior Quality Analyst",
    uploaded_at: "2026-05-14T11:30:00Z"
  }
];

export const MOCK_IMPORTS_HISTORY = [
  {
    import_id: "IMP-SYNTHETIC-001",
    filename: "sample_quality_data.csv",
    total_records: 1200,
    valid_records: 1200,
    invalid_records: 0,
    status: "COMPLETED",
    created_at: "2026-11-16T13:00:00Z",
    uploaded_by: "Lead Quality Engineer"
  }
];
