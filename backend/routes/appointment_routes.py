import uuid
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, status
from models import AppointmentCreate, AppointmentResponse, AppointmentStatus, UserRole
from auth import get_current_user, require_role
from database import get_database

router = APIRouter(prefix="/appointments", tags=["Appointments"])

@router.get("/doctors")
async def list_available_doctors():
    db = get_database()
    doctors = await db["users"].find({"role": UserRole.DOCTOR}).to_list(length=50)
    result = []
    for doc in doctors:
        result.append({
            "id": doc["_id"],
            "name": doc["name"],
            "specialization": doc.get("specialization", "General Physician"),
            "email": doc["email"]
        })
    return result

@router.get("/booked-slots")
async def get_booked_slots(doctor_id: str, date: str):
    db = get_database()
    appts = await db["appointments"].find({
        "doctor_id": doctor_id,
        "appointment_date": date,
        "status": {"$ne": "Cancelled"}
    }).to_list(length=100)
    
    booked = [a["appointment_time"] for a in appts if a.get("appointment_time")]
    return {"doctor_id": doctor_id, "date": date, "booked_slots": booked}

@router.post("/book", response_model=AppointmentResponse)
async def book_appointment(
    appt_in: AppointmentCreate,
    current_user: dict = Depends(require_role([UserRole.PATIENT]))
):
    # Validate date is not in the past
    try:
        appt_date_obj = datetime.strptime(appt_in.appointment_date, "%Y-%m-%d").date()
        today_date = datetime.now(timezone.utc).date()
        if appt_date_obj < today_date:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Cannot book appointments for past dates. Preferred date '{appt_in.appointment_date}' is before today's date ({today_date})."
            )
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid date format. Preferred date must be in YYYY-MM-DD format."
        )

    db = get_database()

    # Conflict check: verify if the time slot is already taken for this doctor
    existing_booking = await db["appointments"].find_one({
        "doctor_id": appt_in.doctor_id,
        "appointment_date": appt_in.appointment_date,
        "appointment_time": appt_in.appointment_time,
        "status": {"$ne": "Cancelled"}
    })
    if existing_booking:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"The time slot '{appt_in.appointment_time}' on {appt_in.appointment_date} is already booked for Dr. {appt_in.doctor_name}. Please choose another available time slot."
        )

    appt_id = str(uuid.uuid4())

    prediction_summary = None
    if appt_in.prediction_id:
        pred = await db["predictions"].find_one({"_id": appt_in.prediction_id})
        if pred:
            prediction_summary = {
                "predicted_disease": pred.get("predicted_disease"),
                "risk_level": pred.get("risk_level"),
                "llm_explanation": pred.get("llm_explanation"),
                "symptoms": pred.get("symptoms", [])
            }

    appt_doc = {
        "_id": appt_id,
        "patient_id": current_user["_id"],
        "patient_name": current_user["name"],
        "doctor_id": appt_in.doctor_id,
        "doctor_name": appt_in.doctor_name,
        "appointment_date": appt_in.appointment_date,
        "appointment_time": appt_in.appointment_time,
        "reason": appt_in.reason,
        "status": AppointmentStatus.PENDING,
        "prediction_summary": prediction_summary,
        "created_at": datetime.now(timezone.utc)
    }

    await db["appointments"].insert_one(appt_doc)

    # Insert into timeline
    await db["timeline"].insert_one({
        "_id": str(uuid.uuid4()),
        "patient_id": current_user["_id"],
        "event_type": "Doctor Appointment",
        "title": f"Appointment Booked: Dr. {appt_in.doctor_name}",
        "description": f"Scheduled for {appt_in.appointment_date} at {appt_in.appointment_time}. Reason: {appt_in.reason}",
        "status_badge": AppointmentStatus.PENDING,
        "timestamp": datetime.now(timezone.utc)
    })

    return AppointmentResponse(
        id=appt_id,
        patient_id=current_user["_id"],
        patient_name=current_user["name"],
        doctor_id=appt_in.doctor_id,
        doctor_name=appt_in.doctor_name,
        appointment_date=appt_in.appointment_date,
        appointment_time=appt_in.appointment_time,
        reason=appt_in.reason,
        status=AppointmentStatus.PENDING,
        prediction_summary=prediction_summary,
        created_at=appt_doc["created_at"]
    )

@router.get("/my")
async def get_my_appointments(current_user: dict = Depends(get_current_user)):
    db = get_database()
    role = current_user.get("role")
    if role == UserRole.DOCTOR:
        appts = await db["appointments"].find({"doctor_id": current_user["_id"]}).to_list(length=100)
    else:
        appts = await db["appointments"].find({"patient_id": current_user["_id"]}).to_list(length=100)
    
    today_date = datetime.now(timezone.utc).date()
    result = []
    for a in appts:
        status_val = a.get("status", AppointmentStatus.PENDING)
        # Check if appointment date has passed relative to today's date
        try:
            d_obj = datetime.strptime(a["appointment_date"], "%Y-%m-%d").date()
            if d_obj < today_date and status_val in [AppointmentStatus.PENDING, AppointmentStatus.CONFIRMED]:
                status_val = AppointmentStatus.PAST
        except ValueError:
            pass

        result.append(AppointmentResponse(
            id=a["_id"],
            patient_id=a["patient_id"],
            patient_name=a.get("patient_name", "Patient"),
            doctor_id=a["doctor_id"],
            doctor_name=a.get("doctor_name", "Doctor"),
            appointment_date=a["appointment_date"],
            appointment_time=a["appointment_time"],
            reason=a["reason"],
            status=status_val,
            prediction_summary=a.get("prediction_summary"),
            created_at=a.get("created_at", datetime.now(timezone.utc))
        ))
    return result

@router.put("/{appt_id}/status")
async def update_appointment_status(
    appt_id: str,
    status_val: str,
    current_user: dict = Depends(require_role([UserRole.DOCTOR, UserRole.ADMIN]))
):
    db = get_database()
    valid_statuses = [
        AppointmentStatus.PENDING,
        AppointmentStatus.CONFIRMED,
        AppointmentStatus.COMPLETED,
        AppointmentStatus.CANCELLED,
        AppointmentStatus.PAST
    ]
    if status_val not in valid_statuses:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=f"Invalid appointment status '{status_val}'. Must be one of: {', '.join(valid_statuses)}"
        )

    appt = await db["appointments"].find_one({"_id": appt_id})
    if not appt:
        raise HTTPException(status_code=404, detail="Appointment not found")

    if current_user.get("role") == UserRole.DOCTOR and appt.get("doctor_id") != current_user["_id"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access forbidden: You can only update status for appointments assigned to you."
        )

    await db["appointments"].update_one({"_id": appt_id}, {"$set": {"status": status_val}})
    return {"message": f"Appointment status updated to {status_val}"}


