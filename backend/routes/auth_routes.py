import uuid
from datetime import datetime, timezone
from fastapi import APIRouter, HTTPException, status, Depends
from models import UserCreate, UserLogin, Token, UserResponse, PasswordResetRequest
from auth import get_password_hash, verify_password, create_access_token, get_current_user
from database import get_database
from services.audit_service import log_audit_event

router = APIRouter(prefix="/auth", tags=["Authentication"])

@router.post("/signup", response_model=Token, status_code=status.HTTP_201_CREATED)
async def signup(user_in: UserCreate):
    db = get_database()

    # Public registration is strictly restricted to Patient accounts
    if user_in.role and user_in.role.lower() != "patient":
        await log_audit_event(
            action="SIGNUP_BLOCKED_NON_PATIENT",
            user_email=user_in.email.lower(),
            role=user_in.role,
            status_code=400,
            details={"attempted_role": user_in.role}
        )
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Public registration is restricted to Patient accounts. Doctor, Lab Tech, and Admin accounts must be provisioned by a System Administrator."
        )

    user_role = "patient"

    existing_user = await db["users"].find_one({"email": user_in.email.lower()})
    if existing_user:
        await log_audit_event(
            action="SIGNUP_DUPLICATE_EMAIL",
            user_email=user_in.email.lower(),
            role=user_role,
            status_code=400,
            details={"reason": "Email already registered"}
        )
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="An account with this email address already exists."
        )

    user_id = str(uuid.uuid4())
    hashed_pwd = get_password_hash(user_in.password)

    user_doc = {
        "_id": user_id,
        "email": user_in.email.lower(),
        "name": user_in.name,
        "role": user_role,
        "hashed_password": hashed_pwd,
        "must_reset_password": False,
        "created_at": datetime.now(timezone.utc)
    }

    await db["users"].insert_one(user_doc)

    # Initialize patient profile
    profile_doc = {
        "_id": str(uuid.uuid4()),
        "user_id": user_id,
        "age": 32,
        "gender": "Other",
        "blood_type": "O+",
        "vitals": {
            "blood_pressure_sys": 120,
            "blood_pressure_dia": 80,
            "heart_rate": 72,
            "glucose_mg_dl": 95,
            "bmi": 22.5,
            "weight_kg": 68.0,
            "height_cm": 175.0
        },
        "medical_history": ["New Patient Registration"]
    }
    await db["patients"].insert_one(profile_doc)

    await log_audit_event(
        action="PATIENT_PUBLIC_SIGNUP",
        user_email=user_in.email.lower(),
        role=user_role,
        status_code=201,
        details={"user_id": user_id}
    )

    token = create_access_token({"sub": user_id, "role": user_role})
    user_resp = UserResponse(
        id=user_id,
        email=user_in.email.lower(),
        name=user_in.name,
        role=user_role,
        must_reset_password=False
    )
    return Token(access_token=token, token_type="bearer", must_reset_password=False, user=user_resp)

@router.post("/login", response_model=Token)
async def login(credentials: UserLogin):
    db = get_database()
    email_clean = credentials.email.lower()
    user = await db["users"].find_one({"email": email_clean})

    if not user or not verify_password(credentials.password, user.get("hashed_password", "")):
        await log_audit_event(
            action="LOGIN_FAILED",
            user_email=email_clean,
            role="unknown",
            status_code=401,
            details={"email_attempted": email_clean, "reason": "Invalid credentials"}
        )
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password"
        )

    must_reset = bool(user.get("must_reset_password", False))

    await log_audit_event(
        action="LOGIN_SUCCESS",
        user_email=email_clean,
        role=user["role"],
        status_code=200,
        details={"user_id": user["_id"], "must_reset_password": must_reset}
    )

    token = create_access_token({"sub": user["_id"], "role": user["role"]})
    user_resp = UserResponse(
        id=user["_id"],
        email=user["email"],
        name=user["name"],
        role=user["role"],
        specialization=user.get("specialization"),
        must_reset_password=must_reset
    )
    return Token(access_token=token, token_type="bearer", must_reset_password=must_reset, user=user_resp)

@router.post("/reset-password")
async def reset_password(
    reset_in: PasswordResetRequest,
    current_user: dict = Depends(get_current_user)
):
    db = get_database()
    if not verify_password(reset_in.current_password, current_user.get("hashed_password", "")):
        await log_audit_event(
            action="PASSWORD_RESET_FAILED",
            user_email=current_user["email"],
            role=current_user["role"],
            status_code=400,
            details={"reason": "Incorrect current password"}
        )
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Current password entered is incorrect."
        )

    new_hashed = get_password_hash(reset_in.new_password)
    await db["users"].update_one(
        {"_id": current_user["_id"]},
        {"$set": {"hashed_password": new_hashed, "must_reset_password": False}}
    )

    await log_audit_event(
        action="PASSWORD_RESET_SUCCESS",
        user_email=current_user["email"],
        role=current_user["role"],
        status_code=200,
        details={"user_id": current_user["_id"]}
    )

    return {"message": "Password updated successfully. Forced reset flag cleared."}

@router.get("/me", response_model=UserResponse)
async def get_me(current_user: dict = Depends(get_current_user)):
    return UserResponse(
        id=current_user["_id"],
        email=current_user["email"],
        name=current_user["name"],
        role=current_user["role"],
        specialization=current_user.get("specialization"),
        must_reset_password=current_user.get("must_reset_password", False)
    )
