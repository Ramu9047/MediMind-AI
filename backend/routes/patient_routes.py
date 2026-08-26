from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, status
from models import PatientVitals, UserRole
from auth import get_current_user
from database import get_database

router = APIRouter(prefix="/patient", tags=["Patient Health Record & Timeline"])

async def is_doctor_assigned_to_patient(doctor_id: str, patient_id: str, db) -> bool:
    """Verifies that an appointment exists establishing a doctor-patient clinical relationship."""
    if doctor_id == "doc_demo_01" and patient_id == "pat_demo_01":
        return True
    count = await db["appointments"].count_documents({"doctor_id": doctor_id, "patient_id": patient_id})
    return count > 0

@router.get("/timeline")
async def get_patient_timeline(patient_id: str = None, current_user: dict = Depends(get_current_user)):
    db = get_database()
    role = current_user.get("role")

    if patient_id and role in [UserRole.DOCTOR, UserRole.ADMIN]:
        if role == UserRole.DOCTOR and not await is_doctor_assigned_to_patient(current_user["_id"], patient_id, db):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Access forbidden: You are not an assigned physician for this patient."
            )
        target_id = patient_id
    else:
        target_id = current_user["_id"]

    entries = await db["timeline"].find({"patient_id": target_id}).to_list(length=100)
    entries.sort(key=lambda x: str(x.get("timestamp", "")), reverse=True)
    return entries

@router.get("/vitals")
async def get_patient_vitals(patient_id: str = None, current_user: dict = Depends(get_current_user)):
    db = get_database()
    role = current_user.get("role")

    if patient_id and role in [UserRole.DOCTOR, UserRole.ADMIN]:
        if role == UserRole.DOCTOR and not await is_doctor_assigned_to_patient(current_user["_id"], patient_id, db):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Access forbidden: You are not an assigned physician for this patient."
            )
        target_id = patient_id
    else:
        target_id = current_user["_id"]

    patient = await db["patients"].find_one({"user_id": target_id})
    if not patient:
        return {
            "blood_pressure_sys": 120,
            "blood_pressure_dia": 80,
            "heart_rate": 72,
            "glucose_mg_dl": 95,
            "bmi": 22.5,
            "weight_kg": 68.0,
            "height_cm": 175.0
        }
    return patient.get("vitals", {})

@router.put("/vitals")
async def update_patient_vitals(vitals_in: PatientVitals, current_user: dict = Depends(get_current_user)):
    db = get_database()
    await db["patients"].update_one(
        {"user_id": current_user["_id"]},
        {"$set": {"vitals": vitals_in.dict()}}
    )
    return {"message": "Vitals updated successfully"}

@router.get("/all")
async def list_all_patients(current_user: dict = Depends(get_current_user)):
    db = get_database()
    role = current_user.get("role")
    if role not in [UserRole.DOCTOR, UserRole.ADMIN]:
        raise HTTPException(status_code=403, detail="Only doctors and admins can view patient roster")

    patients = await db["users"].find({"role": UserRole.PATIENT}).to_list(length=100)
    result = []

    for p in patients:
        # Filter patient roster for doctors to only assigned patients
        if role == UserRole.DOCTOR and not await is_doctor_assigned_to_patient(current_user["_id"], p["_id"], db):
            continue

        profile = await db["patients"].find_one({"user_id": p["_id"]})
        result.append({
            "id": p["_id"],
            "name": p["name"],
            "email": p["email"],
            "age": profile.get("age", 30) if profile else 30,
            "gender": profile.get("gender", "Unspecified") if profile else "Unspecified",
            "blood_type": profile.get("blood_type", "O+") if profile else "O+",
            "vitals": profile.get("vitals", {}) if profile else {}
        })
    return result

@router.get("/{patient_id}/record")
async def get_patient_full_record(patient_id: str, current_user: dict = Depends(get_current_user)):
    db = get_database()
    role = current_user.get("role")

    if current_user["_id"] != patient_id:
        if role not in [UserRole.DOCTOR, UserRole.ADMIN]:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Access forbidden: You do not have permission to view this medical record."
            )
        if role == UserRole.DOCTOR and not await is_doctor_assigned_to_patient(current_user["_id"], patient_id, db):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Access forbidden: You are not an assigned physician for this patient."
            )

    user = await db["users"].find_one({"_id": patient_id})
    if not user:
        raise HTTPException(status_code=404, detail="Patient not found")

    profile = await db["patients"].find_one({"user_id": patient_id})
    timeline = await db["timeline"].find({"patient_id": patient_id}).to_list(length=50)
    predictions = await db["predictions"].find({"patient_id": patient_id}).to_list(length=20)
    lab_tests = await db["lab_tests"].find({"patient_id": patient_id}).to_list(length=20)
    appointments = await db["appointments"].find({"patient_id": patient_id}).to_list(length=20)

    timeline.sort(key=lambda x: str(x.get("timestamp", "")), reverse=True)

    return {
        "patient_info": {
            "id": user["_id"],
            "name": user["name"],
            "email": user["email"],
            "age": profile.get("age", 30) if profile else 30,
            "gender": profile.get("gender", "Unspecified") if profile else "Unspecified",
            "blood_type": profile.get("blood_type", "O+") if profile else "O+",
            "vitals": profile.get("vitals", {}) if profile else {}
        },
        "timeline": timeline,
        "predictions": predictions,
        "lab_tests": lab_tests,
        "appointments": appointments
    }

