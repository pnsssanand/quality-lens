# QualityLens – Firebase Firestore Document Store Schema

## 1. Firestore Collection Architecture

Firebase Firestore serves as the application's primary reactive document store. It holds user profiles, operational preferences, inspection events, investigation records (with nested 5 Whys subcollections), and Cloudinary photographic evidence metadata.

### Collection Hierarchy:

```
users/{userId}
  ├── preferences/{preferenceId}

inspections/{inspectionId}

defects/{defectId}

investigations/{investigationId}
  ├── why_steps/{stepId}
  └── activity/{activityId}

quality_thresholds/{thresholdId}

image_evidence/{imageId}

data_imports/{importId}

reports/{reportId}
```

---

## 2. Document Data Specifications

### `users/{userId}`
```json
{
  "uid": "usr_9482103984",
  "email": "quality.engineer@example.com",
  "name": "Quality Engineer Demo",
  "role": "engineer",
  "department": "Manufacturing QA",
  "created_at": "2026-04-01T08:00:00Z"
}
```

### `inspections/{inspectionId}`
```json
{
  "inspection_id": "INSP-2026-00042",
  "inspection_date": "2026-05-12T14:30:00Z",
  "product_id": "PRD-B200",
  "product_name": "Industrial Signal Transceiver",
  "production_line": "Line Beta",
  "machine_id": "MCH-04",
  "shift": "Shift 3",
  "units_inspected": 500,
  "defective_units": 18,
  "units_passed_first_inspection": 482,
  "defect_category": "Assembly Misalignment",
  "inspection_status": "REWORK",
  "source_import_id": "IMP-SYNTHETIC-001",
  "created_at": "2026-05-12T15:00:00Z"
}
```

### `investigations/{investigationId}`
```json
{
  "investigation_reference": "INV-2026-0042",
  "defect_category": "Assembly Misalignment",
  "product_name": "Industrial Signal Transceiver",
  "production_line": "Line Beta",
  "machine_id": "MCH-04",
  "problem_description": "1.2 degree pin offset on connector headers during Shift 3 pick-and-place operation.",
  "severity": "Medium",
  "investigation_owner": "Senior Quality Analyst",
  "investigation_status": "Corrective Action In Progress",
  "observed_evidence": "Rejection spikes at AOI station; visual check shows robotic clamp wear.",
  "suspected_factors": "Thermal expansion of pneumatic arm after 8 hours continuous running.",
  "root_cause_hypothesis": "Pneumatic suction head calibration drifting due to mechanical wear.",
  "verified_root_cause": "Fatigued mechanical coupling bracket on pneumatic head caused 0.4mm micro-play under load.",
  "verification_method": "High-speed camera tracking & dial indicator vibration measurement under production load.",
  "corrective_action": "Replaced pneumatic clamp bracket with hardened steel grade fastener and torqued to 8.5 Nm.",
  "preventive_action": "Added 200-hour preventive torque inspection check to shift hand-over digital checklist.",
  "date_opened": "2026-05-14T09:00:00Z",
  "review_date": "2026-06-01T09:00:00Z",
  "created_at": "2026-05-14T09:00:00Z",
  "updated_at": "2026-05-20T11:00:00Z"
}
```

### Subcollection: `investigations/{investigationId}/why_steps/{stepId}`
```json
{
  "step_number": 1,
  "question": "Why did the pin connector fail automated optical alignment check?",
  "answer": "The header pins were seated 1.2 degrees askew relative to PCB solder pads.",
  "evidence": "Station AOI camera capture log #8821",
  "notes": "Observed across 18 sequential boards",
  "created_at": "2026-05-14T10:00:00Z"
}
```

### `image_evidence/{imageId}`
```json
{
  "image_id": "IMG-2026-002",
  "secure_url": "https://res.cloudinary.com/dlvjvskje/image/upload/v1710000000/qualitylens/defects/sample_misalignment_evidence.png",
  "public_id": "qualitylens/defects/sample_misalignment_evidence",
  "original_filename": "connector_pin_offset_aoi.png",
  "file_size": 412300,
  "content_type": "image/png",
  "defect_category": "Assembly Misalignment",
  "associated_inspection_id": "INSP-2026-00018",
  "associated_investigation_id": "INV-2026-0042",
  "notes": "AOI camera 1.2-degree pin deviation flag on J2 header.",
  "uploaded_by": "Senior Quality Analyst",
  "uploaded_at": "2026-05-14T10:30:00Z"
}
```

---

## 3. Recommended Firestore Security Rules

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    // User profile permissions
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    
    // Inspection and Defect records: read by authenticated engineers, write by verified engineers
    match /inspections/{inspectionId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && request.auth.token.role in ['engineer', 'admin'];
    }
    
    match /defects/{defectId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null;
    }
    
    // Investigations and nested 5 Whys subcollections
    match /investigations/{investigationId} {
      allow read: if request.auth != null;
      allow create, update: if request.auth != null;
      
      match /why_steps/{stepId} {
        allow read, write: if request.auth != null;
      }
      match /activity/{activityId} {
        allow read, write: if request.auth != null;
      }
    }
    
    // Quality thresholds
    match /quality_thresholds/{thresholdId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && request.auth.token.role in ['admin', 'lead_engineer'];
    }
    
    // Image evidence metadata
    match /image_evidence/{imageId} {
      allow read: if request.auth != null;
      allow create, delete: if request.auth != null;
    }
  }
}
```
