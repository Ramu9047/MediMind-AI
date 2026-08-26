import uuid
from datetime import datetime, timezone
import math
from fastapi import APIRouter, Depends, HTTPException, status, Query
from models import AdminMetrics, StaffCreate, UserRole, AuditEventPaginatedResponse, AuditEventItem
from auth import get_current_user, get_password_hash, require_role
from database import get_database
from services.audit_service import log_audit_event

router = APIRouter(prefix="/admin", tags=["Admin System Management"])

@router.get("/metrics", response_model=AdminMetrics)
async def get_admin_metrics(current_user: dict = Depends(require_role([UserRole.ADMIN]))):
    db = get_database()
    
    total_users = await db["users"].count_documents({})
    total_patients = await db["users"].count_documents({"role": UserRole.PATIENT})
    total_doctors = await db["users"].count_documents({"role": UserRole.DOCTOR})
    total_labs = await db["users"].count_documents({"role": UserRole.LAB})
    
    total_symptom_checks = await db["predictions"].count_documents({})
    total_appointments = await db["appointments"].count_documents({})
    total_lab_tests = await db["lab_tests"].count_documents({})
    
    audit_docs = await db["audit_events"].find({}).to_list(length=20)
    audit_logs = []
    for log in audit_docs:
        audit_logs.append({
            "action": log.get("action", "SYSTEM_EVENT"),
            "user": log.get("user_email", "System"),
            "timestamp": str(log.get("timestamp", datetime.now(timezone.utc).isoformat()))
        })

    return AdminMetrics(
        total_users=total_users,
        total_patients=total_patients,
        total_doctors=total_doctors,
        total_labs=total_labs,
        total_symptom_checks=total_symptom_checks,
        total_appointments=total_appointments,
        total_lab_tests=total_lab_tests,
        system_status="Operational (Hardened)",
        security_audits=audit_logs
    )


@router.get("/audit-events", response_model=AuditEventPaginatedResponse)
async def get_audit_events(
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    current_user: dict = Depends(require_role([UserRole.ADMIN]))
):
    db = get_database()
    total_docs = await db["audit_events"].count_documents({})
    
    # Calculate pagination
    all_events = await db["audit_events"].find({}).to_list(length=1000)
    # Sort descending by timestamp
    all_events.sort(key=lambda x: str(x.get("timestamp", "")), reverse=True)
    
    start_idx = (page - 1) * limit
    end_idx = start_idx + limit
    page_docs = all_events[start_idx:end_idx]

    formatted_events = []
    for d in page_docs:
        ts = d.get("timestamp")
        ts_str = ts.isoformat() if isinstance(ts, datetime) else str(ts)
        formatted_events.append(AuditEventItem(
            id=d.get("_id", str(uuid.uuid4())),
            action=d.get("action", "EVENT"),
            user_email=d.get("user_email", "unknown"),
            role=d.get("role", "system"),
            status_code=d.get("status_code", 200),
            details=d.get("details", {}),
            timestamp=ts_str
        ))

    total_pages = math.ceil(total_docs / limit) if total_docs > 0 else 1

    return AuditEventPaginatedResponse(
        total=total_docs,
        page=page,
        limit=limit,
        total_pages=total_pages,
        events=formatted_events
    )

@router.post("/create-staff", status_code=status.HTTP_201_CREATED)
async def create_staff_account(
    staff_in: StaffCreate,
    current_user: dict = Depends(require_role([UserRole.ADMIN]))
):
    if staff_in.role.lower() not in [UserRole.DOCTOR, UserRole.LAB]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Staff provisioning via web UI is restricted to Doctor and Lab Technician roles. System Administrator accounts must be seeded via environment configuration."
        )

    db = get_database()
    existing = await db["users"].find_one({"email": staff_in.email.lower()})
    if existing:
        await log_audit_event(
            action="STAFF_PROVISIONING_FAILED",
            user_email=current_user["email"],
            role=current_user["role"],
            status_code=400,
            details={"attempted_email": staff_in.email.lower(), "reason": "Account already exists"}
        )
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="An account with this email address already exists."
        )

    user_id = str(uuid.uuid4())
    hashed_pwd = get_password_hash(staff_in.password)

    user_doc = {
        "_id": user_id,
        "email": staff_in.email.lower(),
        "name": staff_in.name,
        "role": staff_in.role.lower(),
        "hashed_password": hashed_pwd,
        "must_reset_password": True,  # Temporary password forces change on first login
        "created_at": datetime.now(timezone.utc)
    }
    if staff_in.role.lower() == UserRole.DOCTOR:
        user_doc["specialization"] = staff_in.specialization or "General Physician"

    await db["users"].insert_one(user_doc)

    await log_audit_event(
        action=f"STAFF_PROVISIONED_{staff_in.role.upper()}",
        user_email=current_user["email"],
        role=current_user["role"],
        status_code=201,
        details={
            "provisioned_user_id": user_id,
            "provisioned_email": staff_in.email.lower(),
            "provisioned_role": staff_in.role.lower(),
            "must_reset_password": True
        }
    )

    return {
        "message": f"Staff account created successfully for {staff_in.name} ({staff_in.role}). User flagged for mandatory password change on first login.",
        "user_id": user_id,
        "must_reset_password": True
    }
