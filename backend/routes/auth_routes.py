import uuid
import secrets
from datetime import datetime, timezone
from fastapi import APIRouter, HTTPException, status, Depends, Request, Response
from slowapi import Limiter
from slowapi.util import get_remote_address
from models import UserCreate, UserLogin, Token, UserResponse, PasswordResetRequest, ForgotPasswordRequest, ForgotPasswordReset
from auth import get_password_hash, verify_password, create_access_token, get_current_user
from database import get_database
from services.audit_service import log_audit_event

limiter = Limiter(key_func=get_remote_address)
router = APIRouter(prefix="/auth", tags=["Authentication"])


@router.post("/signup", response_model=Token, status_code=status.HTTP_201_CREATED)
@limiter.limit("5/minute")
async def signup(request: Request, response: Response, user_in: UserCreate):


    db = get_database()

    # Public registration is strictly restricted to Patient accounts
    if user_in.role and user_in.role.lower() != "patient":
        await log_audit_event(
            action="SIGNUP_BLOCKED_NON_PATIENT",
            user_email=user_in.email.lower(),
            role=user_in.role,
            status_code=400,
            details={"attempted_role": user_in.role},
            request=request
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
            details={"reason": "Email already registered"},
            request=request
        )
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email address is already registered."
        )

    user_id = f"pat_{uuid.uuid4().hex[:10]}"
    hashed_pwd = get_password_hash(user_in.password)

    user_doc = {
        "_id": user_id,
        "email": user_in.email.lower(),
        "name": user_in.name,
        "hashed_password": hashed_pwd,
        "role": user_role,
        "must_reset_password": False,
        "created_at": datetime.now(timezone.utc)
    }

    await db["users"].insert_one(user_doc)

    await db["patients"].insert_one({
        "_id": user_id,
        "name": user_in.name,
        "email": user_in.email.lower(),
        "created_at": datetime.now(timezone.utc)
    })

    await log_audit_event(
        action="PATIENT_PUBLIC_SIGNUP",
        user_email=user_in.email.lower(),
        role=user_role,
        status_code=201,
        details={"user_id": user_id},
        request=request
    )

    token = create_access_token({"sub": user_id, "email": user_in.email.lower(), "role": user_role})
    response.set_cookie(
        key="access_token",
        value=f"Bearer {token}",
        httponly=True,
        samesite="lax",
        max_age=7200
    )
    user_resp = UserResponse(
        id=user_id,
        email=user_in.email.lower(),
        name=user_in.name,
        role=user_role,
        must_reset_password=False
    )
    return Token(access_token=token, token_type="bearer", must_reset_password=False, user=user_resp)

@router.post("/login", response_model=Token)
@limiter.limit("10/minute")
async def login(request: Request, response: Response, credentials: UserLogin):

    db = get_database()
    email_clean = credentials.email.lower()
    user = await db["users"].find_one({"email": email_clean})

    if not user or not verify_password(credentials.password, user.get("hashed_password", "")):
        await log_audit_event(
            action="LOGIN_FAILED",
            user_email=email_clean,
            role="unknown",
            status_code=401,
            details={"email_attempted": email_clean, "reason": "Invalid credentials"},
            request=request
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
        details={"user_id": user["_id"], "must_reset_password": must_reset},
        request=request
    )

    token = create_access_token({"sub": user["_id"], "email": user["email"], "role": user["role"]})
    response.set_cookie(
        key="access_token",
        value=f"Bearer {token}",
        httponly=True,
        samesite="lax",
        max_age=7200
    )

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
    request: Request,
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
            details={"reason": "Incorrect current password"},
            request=request
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
        details={"user_id": current_user["_id"]},
        request=request
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

@router.post("/forgot-password/request")
@limiter.limit("5/minute")
async def forgot_password_request(request: Request, body: ForgotPasswordRequest):
    db = get_database()
    email_clean = body.email.lower()
    user = await db["users"].find_one({"email": email_clean})

    if not user:
        # Generic response for security to prevent user enumeration
        return {
            "message": "If an account with that email exists, a password reset code has been generated.",
            "reset_code": None
        }

    # Generate 6-digit reset code
    reset_code = f"{secrets.randbelow(900000) + 100000}"
    await db["users"].update_one(
        {"_id": user["_id"]},
        {"$set": {
            "reset_code": reset_code,
            "reset_code_created_at": datetime.now(timezone.utc)
        }}
    )

    await log_audit_event(
        action="FORGOT_PASSWORD_REQUESTED",
        user_email=email_clean,
        role=user.get("role", "patient"),
        status_code=200,
        details={"user_id": user["_id"]},
        request=request
    )

    return {
        "message": "A 6-digit password reset code has been generated.",
        "reset_code": reset_code,
        "is_staff": user.get("role") in ["doctor", "lab", "admin"]
    }

@router.post("/forgot-password/reset")
@limiter.limit("5/minute")
async def forgot_password_reset(request: Request, body: ForgotPasswordReset):
    db = get_database()
    email_clean = body.email.lower()
    user = await db["users"].find_one({"email": email_clean})

    if not user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid email or reset code."
        )

    stored_code = user.get("reset_code")
    if not stored_code or stored_code != body.reset_code.strip():
        await log_audit_event(
            action="FORGOT_PASSWORD_FAILED",
            user_email=email_clean,
            role=user.get("role", "unknown"),
            status_code=400,
            details={"reason": "Invalid or expired reset code"},
            request=request
        )
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid or expired reset code."
        )

    new_hashed = get_password_hash(body.new_password)
    await db["users"].update_one(
        {"_id": user["_id"]},
        {
            "$set": {
                "hashed_password": new_hashed,
                "must_reset_password": False
            },
            "$unset": {
                "reset_code": "",
                "reset_code_created_at": ""
            }
        }
    )

    await log_audit_event(
        action="FORGOT_PASSWORD_SUCCESS",
        user_email=email_clean,
        role=user.get("role", "patient"),
        status_code=200,
        details={"user_id": user["_id"]},
        request=request
    )

    return {"message": "Password reset successfully. You can now log in with your new password."}

