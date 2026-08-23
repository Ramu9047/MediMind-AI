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

class UserResponse(UserBase):
    id: str
    specialization: Optional[str] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
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

# --- Appointment Booking Models ---
class AppointmentStatus:
    PENDING = "Pending"
    CONFIRMED = "Confirmed"
    COMPLETED = "Completed"
    CANCELLED = "Cancelled"

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

# --- Admin Dashboard Metrics & Staff Provisioning ---
class StaffCreate(BaseModel):
    name: str
    email: EmailStr
    password: str
    role: str  # "doctor" | "lab" | "admin"
    specialization: Optional[str] = None

class AdminMetrics(BaseModel):
    total_users: int
    total_patients: int
    total_doctors: int
    total_labs: int
    total_symptom_checks: int
    total_appointments: int
    total_lab_tests: int
    system_status: str = "Operational"
    security_audits: List[Dict[str, str]]
