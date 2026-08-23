# MediMind AI - Redesign & Hardening Changelog (`CHANGELOG_REDESIGN.md`)

This document records all bug fixes, architectural enhancements, and new feature additions implemented during the full codebase rebuild and hardening session.

---

## SECTION 1 — Bug Fixes & Security Hardening

### 1.1 Appointment Slot Booking Lock Logic & Available Slot Counter
- **Files Modified**:
  - `frontend/src/app/patient/appointments/page.tsx`: Fixed `isSlotPassedToday` logic so past dates return `true`, future dates return `false`, and today compares slot time against current local time; preserved counter logic (`bookedSlots.length` Booked / `12 - bookedSlots.length` Free).
  - `backend/routes/appointment_routes.py`: Added date validation rejecting past preferred dates and invalid date string formats with HTTP 400.

### 1.2 Lab Order ID Truncation Fix
- **Files Modified**:
  - `backend/routes/lab_routes.py`: Updated lab order ID generation to format as `labtest_<uuid_hex_10>` (e.g. `labtest_9f2a81c01a`) so the prefix and unique suffix are persisted together in MongoDB.
  - `frontend/src/app/patient/lab-tests/page.tsx`: Removed `.slice(0, 8)` string clipping so the full unique order ID is displayed in the UI.

### 1.3 Medical History Timeline Timestamps
- **Files Modified**:
  - `backend/routes/prediction_routes.py`: Updated symptom check timeline recording to use `datetime.now(timezone.utc)` at event time.
  - `backend/routes/appointment_routes.py`: Updated appointment booking timeline recording to use `datetime.now(timezone.utc)` at event time.
  - `backend/routes/lab_routes.py`: Updated lab test booking and report publish timeline recording to use `datetime.now(timezone.utc)` at event time.
  - `backend/routes/patient_routes.py`: Ensured timeline API sorts entries strictly descending by ISO timestamp.

### 1.4 Past Appointment Date Validation & Status Categorization
- **Files Modified**:
  - `backend/routes/appointment_routes.py`: Added check in `/appointments/book` rejecting booking dates earlier than today's date with HTTP 400; updated `/appointments/my` to automatically re-categorize past-dated appointments as `Past`.

### 1.5 Security Audit Logging (`audit_events` Collection) & Admin Credential Rotation
- **Files Created / Modified**:
  - `backend/services/audit_service.py` [NEW]: Created structured logging helper inserting security events into the dedicated `audit_events` MongoDB collection.
  - `backend/auth.py`: Updated `get_current_user` and `require_role` to log 401 unauthorized and 403 forbidden security events.
  - `backend/routes/auth_routes.py`: Added audit logging for login success, login failure (with email attempted), and patient signup.
  - `backend/routes/admin_routes.py`: Added audit logging for staff provisioning and exposed paginated endpoint `GET /api/admin/audit-events?page=1&limit=20`.
  - `frontend/src/app/admin/dashboard/page.tsx`: Updated Admin Security Dashboard to render a real paginated table of per-user audit events.
  - `backend/.env`: Rotated admin credentials to a cryptographically secure 24-character secret.

### 1.6 Temporary Staff Password Forced Change Flow
- **Files Created / Modified**:
  - `backend/routes/admin_routes.py`: Flagged newly provisioned staff accounts (`doctor`, `lab`) with `must_reset_password: True`.
  - `backend/routes/auth_routes.py`: Returned `must_reset_password: True` in `/auth/login` token response and added `POST /api/auth/reset-password` endpoint.
  - `frontend/src/context/AuthContext.tsx`: Added `must_reset_password` detection and automatic router redirection to `/auth/reset-password`.
  - `frontend/src/app/auth/reset-password/page.tsx` [NEW]: Created forced password reset form for staff with temporary credentials.

---

## SECTION 2 — Symptom Evaluator: Free-Text NLP Intake

### 2.1 & 2.2 Free-Text Front Door & Backend Extraction Endpoint
- **Files Created / Modified**:
  - `backend/services/nlp_symptom_service.py` [NEW]: Created NLP symptom extractor utilizing Groq/OpenAI LLM constrained to the canonical 132-symptom vocabulary, extracting matched symptoms, duration, severity, location, and confidence score while maintaining professional clinical tone.
  - `backend/routes/symptom_nlp_routes.py` [NEW]: Exposed `POST /api/symptom-nlp/extract` endpoint.
  - `backend/main.py`: Registered `symptom_nlp_routes.router`.

### 2.3, 2.4, & 2.5 Frontend Flow & Tone Requirement
- **Files Modified**:
  - `frontend/src/app/patient/symptom-checker/page.tsx`: Redesigned interface with primary free-text textarea, "Extract Symptoms with AI" button, interactive matched symptom tags with add/remove/correct capability, confirmation step before ML classifier submission, and secondary manual checklist fallback. Added "Commonly associated medication classes" CTA linking to Medicine Hub.

---

## SECTION 3 — Medicine Information Hub (Hardened Module)

### 3.1 2-Stage RxNorm to openFDA Verified Resolution & Single-Ingredient Match Prioritization
- **Files Modified**:
  - `backend/services/medicine_service.py`: Rebuilt resolution pipeline:
    1. Resolves NLM RxNorm concept properties (`name`, `tty`) first.
    2. Queries openFDA scanning up to 15 results.
    3. Prioritizes single-ingredient exact matches (`match_type: "exact_ingredient"`).
    4. Categorizes multi-ingredient products cleanly (`match_type: "combination_product"`, `is_combination_product: True`).
    5. Returns HTTP 404 when no valid label match exists.
  - `backend/models.py`: Added `match_type`, `is_combination_product`, and `combination_notice` to `MedicineDetailResponse`.
  - `backend/routes/medicine_routes.py`: Added HTTP 404 exception handling when no exact/verified openFDA label match exists.

### 3.2 Interaction Checker Grounding & UI Disclaimer
- **Files Modified**:
  - `backend/services/medicine_service.py`: Updated `check_medicine_interactions` to strictly inspect retrieved openFDA label warnings & precautions sections. Returns `"severity": "No Specific FDA Warning Documented"` if no specific warning text is present in retrieved openFDA labels.
  - `frontend/src/app/medicine-hub/page.tsx`: Added explicit Interaction Check Disclaimer Banner directly inside the Interaction Checker Widget explaining that results are synthesized from openFDA drug label warnings rather than a multi-drug clinical database.
  - `frontend/src/app/medicine-hub/[rxcui]/page.tsx`: Added Combination Medication Notice Banner rendering when `is_combination_product` is `True`.

---

## SECTION 4 — Cross-Cutting Requirements & Testing

### 4.1 Sitewide Educational Disclaimer Update
- **File Modified**:
  - `frontend/src/components/DisclaimerBanner.tsx`: Updated banner copy to state that medicine reference data is sourced from FDA/RxNorm public databases and does not constitute a prescription.

### 4.2 Automated Testing Suite (13 Verbose Test Functions)
- **File Created / Modified**:
  - `backend/tests/test_suite.py`: Created 13 explicit, individual unit test functions covering appointment date validation, timeline UTC ordering, 5 NLP symptom inputs, RxNorm autocomplete, openFDA exact match verification, condition reverse lookup, and pairwise interaction checking.

### 4.3 Documentation Update
- **File Modified**:
  - `README.md`: Updated with NLP extraction layer, 2-stage Medicine Hub architecture, audit logging schema, and setup instructions.

### 4.4 Markdown Changelog
- **File Created**:
  - `CHANGELOG_REDESIGN.md`: Maintained this comprehensive changelog file.
