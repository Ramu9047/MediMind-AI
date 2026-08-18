import uuid
from datetime import datetime
from fastapi import APIRouter, HTTPException, status, Depends
from models import UserCreate, UserLogin, Token, UserResponse
from auth import get_password_hash, verify_password, create_access_token, get_current_user
from database import get_database

router = APIRouter(prefix="/auth", tags=["Authentication"])

@router.post("/signup", response_model=Token, status_code=status.HTTP_201_CREATED)
async def signup(user_in: UserCreate):
    db = get_database()

    # Public registration is strictly restricted to Patient accounts
    if user_in.role and user_in.role.lower() != "patient":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Public registration is restricted to Patient accounts. Doctor, Lab Tech, and Admin accounts must be provisioned by a System Administrator."
        )

    user_role = "patient"

    existing_user = await db["users"].find_one({"email": user_in.email.lower()})
    if existing_user:
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
        "created_at": datetime.utcnow()
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

    # Log audit event
    await db["audit_logs"].insert_one({
        "_id": str(uuid.uuid4()),
        "action": "PATIENT_PUBLIC_SIGNUP",
        "user_email": user_in.email,
        "role": user_role,
        "timestamp": datetime.utcnow()
    })

    token = create_access_token({"sub": user_id, "role": user_role})
    user_resp = UserResponse(id=user_id, email=user_in.email, name=user_in.name, role=user_role)
    return Token(access_token=token, token_type="bearer", user=user_resp)

@router.post("/login", response_model=Token)
async def login(credentials: UserLogin):
    db = get_database()
    user = await db["users"].find_one({"email": credentials.email.lower()})
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password"
        )

    if not verify_password(credentials.password, user.get("hashed_password", "")):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password"
        )

    token = create_access_token({"sub": user["_id"], "role": user["role"]})
    user_resp = UserResponse(
        id=user["_id"],
        email=user["email"],
        name=user["name"],
        role=user["role"],
        specialization=user.get("specialization")
    )
    return Token(access_token=token, token_type="bearer", user=user_resp)

@router.get("/me", response_model=UserResponse)
async def get_me(current_user: dict = Depends(get_current_user)):
    return UserResponse(
        id=current_user["_id"],
        email=current_user["email"],
        name=current_user["name"],
        role=current_user["role"],
        specialization=current_user.get("specialization")
    )
