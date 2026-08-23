from datetime import datetime, timezone
from typing import List, Optional, Any, Dict
from pydantic import BaseModel, EmailStr, Field

# --- User & Auth Models ---
class UserRole:
    PATIENT = "patient"
    DOCTOR = "doctor"
    LAB = "lab"
    ADMIN = "admin"

class UserBase(BaseModel):
    email: EmailStr
    name: str
    role: str = UserRole.PATIENT

class UserCreate(UserBase):
    password: str

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class PasswordResetRequest(BaseModel):
    current_password: str
    new_password: str

class UserResponse(UserBase):
    id: str
    specialization: Optional[str] = None
    must_reset_password: bool = False
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    must_reset_password: bool = False
    user: UserResponse

# --- Patient Health Vitals ---
class PatientVitals(BaseModel):
    blood_pressure_sys: Optional[int] = 120
    blood_pressure_dia: Optional[int] = 80
    heart_rate: Optional[int] = 72
    glucose_mg_dl: Optional[int] = 95
    bmi: Optional[float] = 22.5
    weight_kg: Optional[float] = 68.0
    height_cm: Optional[float] = 175.0

class PatientProfile(BaseModel):
    user_id: str
    age: Optional[int] = 30
    gender: Optional[str] = "Unspecified"
    blood_type: Optional[str] = "O+"
    vitals: PatientVitals = Field(default_factory=PatientVitals)
    medical_history: List[str] = []

# --- Symptom Checker & ML Models ---
class SymptomInput(BaseModel):
    symptoms: List[str]
    duration_days: Optional[int] = 3
    additional_notes: Optional[str] = ""

class PredictionResult(BaseModel):
    id: Optional[str] = None
    patient_id: Optional[str] = None
    symptoms: List[str]
    predicted_disease: str
    confidence_score: float
    confidence_percentage: str
    risk_level: str  # Low, Moderate, High
    recommended_specialist: str
    description: str
    precautions: List[str]
    medications_educational: List[str]
    diet_recommendations: List[str]
    workout_recommendations: List[str]
    llm_explanation: str
    disclaimer: str
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

# --- Symptom NLP Extraction Models ---
class SymptomNLPExtractRequest(BaseModel):
    free_text: str

class SymptomNLPExtractResponse(BaseModel):
    matched_symptoms: List[str]
    unmatched_input_notes: Optional[str] = ""
    duration: Optional[str] = ""
    severity: Optional[str] = ""
    location: Optional[str] = ""
    confidence: str = "medium"  # high | medium | low
    disclaimer: str = "Educational Demo Only — extracted symptoms should be verified with a healthcare provider."

# --- Appointment Booking Models ---
class AppointmentStatus:
    PENDING = "Pending"
    CONFIRMED = "Confirmed"
    COMPLETED = "Completed"
    CANCELLED = "Cancelled"
    PAST = "Past"

class AppointmentCreate(BaseModel):
    doctor_id: str
    doctor_name: str
    appointment_date: str
    appointment_time: str
    reason: str
    prediction_id: Optional[str] = None

class AppointmentResponse(BaseModel):
    id: str
    patient_id: str
    patient_name: str
    doctor_id: str
    doctor_name: str
    appointment_date: str
    appointment_time: str
    reason: str
    status: str = AppointmentStatus.PENDING
    prediction_summary: Optional[Dict[str, Any]] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

# --- Lab Test & Report Models ---
class LabTestStatus:
    REQUESTED = "Requested"
    SAMPLE_COLLECTED = "Sample Collected"
    PROCESSING = "Processing"
    COMPLETED = "Completed"

class LabTestCreate(BaseModel):
    test_name: str
    notes: Optional[str] = ""

class LabTestResponse(BaseModel):
    id: str
    patient_id: str
    patient_name: str
    test_name: str
    status: str = LabTestStatus.REQUESTED
    notes: Optional[str] = ""
    report_file_name: Optional[str] = None
    extracted_text: Optional[str] = None
    ai_summary: Optional[str] = None
    abnormal_flags: List[str] = []
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

# --- Medical Timeline Entry ---
class TimelineEntry(BaseModel):
    id: str
    patient_id: str
    event_type: str  # "Symptom Check", "Doctor Appointment", "Lab Test", "Report Analysis"
    title: str
    description: str
    status_badge: str
    timestamp: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    details: Optional[Dict[str, Any]] = None

# --- FAQ Assistant Models ---
class FAQQuery(BaseModel):
    query: str

class FAQResponse(BaseModel):
    answer: str
    sources: List[Dict[str, str]]
    disclaimer: str

# --- Admin Dashboard Metrics, Audit & Staff Provisioning ---
class StaffCreate(BaseModel):
    name: str
    email: EmailStr
    password: str
    role: str  # "doctor" | "lab" | "admin"
    specialization: Optional[str] = None

class AuditEventItem(BaseModel):
    id: str
    action: str
    user_email: str
    role: str
    status_code: int
    details: Dict[str, Any] = {}
    timestamp: str

class AuditEventPaginatedResponse(BaseModel):
    total: int
    page: int
    limit: int
    total_pages: int
    events: List[AuditEventItem]

class AdminMetrics(BaseModel):
    total_users: int
    total_patients: int
    total_doctors: int
    total_labs: int
    total_symptom_checks: int
    total_appointments: int
    total_lab_tests: int
    system_status: str = "Operational (Hardened)"
    security_audits: List[Dict[str, str]]

# --- Medicine Information Hub Models ---
class MedicineSearchItem(BaseModel):
    rxcui: str
    name: str
    synonym: Optional[str] = None
    term_type: Optional[str] = None
    is_brand: bool = False

class MedicineSearchResponse(BaseModel):
    query: str
    results: List[MedicineSearchItem]

class MedicineDetailResponse(BaseModel):
    rxcui: str
    generic_name: str
    brand_names: List[str] = []
    drug_class: Optional[str] = "Pharmacological Agent"
    indications: str = "No specific indication text on label."
    dosage_and_administration: str = "Refer to prescribing physician or label instructions."
    is_prescription_required: bool = True
    match_type: Optional[str] = "exact_ingredient"
    is_combination_product: bool = False
    combination_notice: Optional[str] = None
    common_side_effects: List[str] = []
    contraindications: List[str] = []
    warnings_and_precautions: List[str] = []
    storage_notes: str = "Store at room temperature."
    source_citation: str = "US National Library of Medicine (RxNorm) & openFDA Drug Labeling API"
    disclaimer: str = "Educational Demo Only — medicine information is for reference and does not constitute a medical prescription."


class MedicineInteractionRequest(BaseModel):
    rxcuis: List[str]

class PairwiseInteraction(BaseModel):
    rxcui1: str
    drug1_name: str
    rxcui2: str
    drug2_name: str
    severity: str = "Moderate"
    description: str
    source_citation: str = "openFDA Drug Interactions & Warnings Dataset"

class MedicineInteractionResponse(BaseModel):
    rxcuis: List[str]
    interactions: List[PairwiseInteraction]
    disclaimer: str = "Educational Demo Only — interaction warnings are informational and do not replace professional pharmacist review."
