import asyncio
import uuid
from datetime import datetime, timedelta, timezone
from database import connect_to_mongo, get_database
from auth import get_password_hash
from config import settings

async def seed():
    await connect_to_mongo()
    db = get_database()

    # Clear existing demo collections
    for coll_name in ["users", "patients", "predictions", "appointments", "lab_tests", "timeline", "audit_logs"]:
        coll = db[coll_name]
        if hasattr(coll, "delete_many"):
            await coll.delete_many({})
        elif hasattr(coll, "docs"):
            coll.docs = []

    # 1. Users
    pwd_user = get_password_hash("password123")
    pwd_admin = get_password_hash(settings.ADMIN_PASSWORD)

    patient_id = "pat_demo_01"
    doctor_id = "doc_demo_01"
    lab_id = "lab_demo_01"
    admin_id = "adm_demo_01"

    users = [
        {
            "_id": patient_id,
            "email": "patient@medimind.ai",
            "name": "Sarah Connor",
            "role": "patient",
            "hashed_password": pwd_user,
            "created_at": datetime.now(timezone.utc) - timedelta(days=10)
        },
        {
            "_id": doctor_id,
            "email": "doctor@medimind.ai",
            "name": "Dr. Marcus Vance",
            "role": "doctor",
            "specialization": "Gastroenterologist & Internal Medicine",
            "hashed_password": pwd_user,
            "created_at": datetime.now(timezone.utc) - timedelta(days=20)
        },
        {
            "_id": lab_id,
            "email": "lab@medimind.ai",
            "name": "Alex Rivera (Apex Labs)",
            "role": "lab",
            "hashed_password": pwd_user,
            "created_at": datetime.now(timezone.utc) - timedelta(days=20)
        },
        {
            "_id": admin_id,
            "email": settings.ADMIN_EMAIL,
            "name": "MediMind System Admin",
            "role": "admin",
            "hashed_password": pwd_admin,
            "created_at": datetime.now(timezone.utc) - timedelta(days=30)
        }
    ]

    for u in users:
        await db["users"].insert_one(u)

    # 2. Patient Profile
    patient_profile = {
        "_id": "prof_demo_01",
        "user_id": patient_id,
        "age": 34,
        "gender": "Female",
        "blood_type": "A+",
        "vitals": {
            "blood_pressure_sys": 118,
            "blood_pressure_dia": 78,
            "heart_rate": 74,
            "glucose_mg_dl": 92,
            "bmi": 22.1,
            "weight_kg": 62.0,
            "height_cm": 167.0
        },
        "medical_history": ["Mild Acid Reflux (2025)", "Seasonal Rhinitis"]
    }
    await db["patients"].insert_one(patient_profile)

    # 3. AI Prediction Record
    pred_id = "pred_demo_01"
    prediction = {
        "_id": pred_id,
        "patient_id": patient_id,
        "symptoms": ["stomach_pain", "acidity", "vomiting"],
        "predicted_disease": "GERD",
        "confidence_score": 0.88,
        "confidence_percentage": "88.0%",
        "risk_level": "Moderate",
        "recommended_specialist": "Gastroenterologist",
        "description": "GERD (Gastroesophageal Reflux Disease) occurs when stomach acid flows back into the esophagus.",
        "precautions": ["Avoid spicy and greasy foods", "Do not lie down immediately after meals", "Maintain healthy weight"],
        "medications_educational": ["Omeprazole (educational reference)", "Antacids (educational reference)"],
        "diet_recommendations": ["High-fiber foods", "Non-citrus fruits", "Oatmeal and lean proteins"],
        "workout_recommendations": ["Light walking after meals", "Upright post-meal posture"],
        "llm_explanation": "Based on reported stomach pain and acidity, the AI classifier identified strong correlation with GERD. This statistical pattern match warrants consultation with a Gastroenterologist to rule out peptic ulcers or esophagitis.",
        "disclaimer": "MediMind AI provides educational information only and is not a substitute for professional medical advice, diagnosis, or treatment. Always consult a qualified healthcare provider.",
        "created_at": datetime.now(timezone.utc) - timedelta(days=2)
    }
    await db["predictions"].insert_one(prediction)

    # 4. Appointment
    appt_id = "appt_demo_01"
    appointment = {
        "_id": appt_id,
        "patient_id": patient_id,
        "patient_name": "Sarah Connor",
        "doctor_id": doctor_id,
        "doctor_name": "Dr. Marcus Vance",
        "appointment_date": "2026-07-28",
        "appointment_time": "10:30 AM",
        "reason": "Follow-up consultation for upper abdominal discomfort and heartburn.",
        "status": "Confirmed",
        "prediction_summary": {
            "predicted_disease": "GERD",
            "risk_level": "Moderate",
            "symptoms": ["stomach_pain", "acidity", "vomiting"]
        },
        "created_at": datetime.now(timezone.utc) - timedelta(days=2)
    }
    await db["appointments"].insert_one(appointment)

    # 5. Lab Test Order
    lab_test_id = "labtest_demo_01"
    lab_test = {
        "_id": lab_test_id,
        "patient_id": patient_id,
        "patient_name": "Sarah Connor",
        "test_name": "Comprehensive Metabolic & Endoscopy Panel",
        "status": "Completed",
        "notes": "Fast for 8 hours prior to blood draw.",
        "report_file_name": "Sarah_Connor_Lab_Report_2026.pdf",
        "extracted_text": "LABORATORY DIAGNOSTICS REPORT\nFasting Blood Glucose: 92 mg/dL (Reference: 70-99)\nHemoglobin: 13.5 g/dL (Reference: 12.0-15.5)\nHelicobacter Pylori Antigen: Negative\nSerum Gastrin: 65 pg/mL (Normal)",
        "ai_summary": "All primary metabolic and gastrointestinal biomarkers fall within normal adult reference intervals. H. Pylori antigen test is negative.",
        "abnormal_flags": ["No abnormal biomarker elevations detected."],
        "created_at": datetime.now(timezone.utc) - timedelta(days=1),
        "updated_at": datetime.now(timezone.utc) - timedelta(hours=4)
    }
    await db["lab_tests"].insert_one(lab_test)

    # 6. Timeline Records
    timeline_entries = [
        {
            "_id": "tl_01",
            "patient_id": patient_id,
            "event_type": "Symptom Check",
            "title": "AI Symptom Check: GERD",
            "description": "Symptoms evaluated: stomach pain, acidity, vomiting. AI suggested consultation with a Gastroenterologist.",
            "status_badge": "Completed",
            "timestamp": datetime.now(timezone.utc) - timedelta(days=2)
        },
        {
            "_id": "tl_02",
            "patient_id": patient_id,
            "event_type": "Doctor Appointment",
            "title": "Appointment Scheduled: Dr. Marcus Vance",
            "description": "Confirmed for 2026-07-28 at 10:30 AM (Gastroenterology).",
            "status_badge": "Confirmed",
            "timestamp": datetime.now(timezone.utc) - timedelta(days=2)
        },
        {
            "_id": "tl_03",
            "patient_id": patient_id,
            "event_type": "Report Analysis",
            "title": "Lab Report Published: Comprehensive Panel",
            "description": "Result uploaded by Apex Labs. AI summary: All markers within normal limits.",
            "status_badge": "Completed",
            "timestamp": datetime.now(timezone.utc) - timedelta(hours=4)
        }
    ]
    for tl in timeline_entries:
        await db["timeline"].insert_one(tl)

    print("MediMind AI database seeded successfully with realistic demo data.")

if __name__ == "__main__":
    asyncio.run(seed())
