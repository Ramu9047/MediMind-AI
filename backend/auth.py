import bcrypt
from datetime import datetime, timedelta, timezone
from typing import Optional
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from jose import JWTError, jwt
from config import settings
from database import get_database

from fastapi import Request

oauth2_scheme = OAuth2PasswordBearer(tokenUrl=f"{settings.API_V1_STR}/auth/login", auto_error=False)

def verify_password(plain_password: str, hashed_password: str) -> bool:
    try:
        return bcrypt.checkpw(plain_password.encode('utf-8'), hashed_password.encode('utf-8'))
    except Exception:
        return False

def get_password_hash(password: str) -> str:
    pwd_bytes = password.encode('utf-8')[:72]
    salt = bcrypt.gensalt(12)
    return bcrypt.hashpw(pwd_bytes, salt).decode('utf-8')

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.now(timezone.utc) + expires_delta
    else:
        expire = datetime.now(timezone.utc) + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)
    return encoded_jwt

async def get_current_user(request: Request, token_header: Optional[str] = Depends(oauth2_scheme)):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    
    token = token_header
    if not token and request and request.cookies.get("access_token"):
        cookie_val = request.cookies.get("access_token")
        if cookie_val.startswith("Bearer "):
            token = cookie_val.split(" ", 1)[1]
        else:
            token = cookie_val

    if not token:
        from services.audit_service import log_audit_event
        await log_audit_event("AUTH_UNAUTHORIZED", "unknown", role="anonymous", status_code=401, details={"reason": "No access token provided in header or cookie"}, request=request)
        raise credentials_exception

    user_email = "unknown"
    user_id = None
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        user_id = payload.get("sub")
        user_email = payload.get("email") or user_id or "unknown"
        if user_id is None:
            from services.audit_service import log_audit_event
            await log_audit_event("AUTH_UNAUTHORIZED", "unknown", role="anonymous", status_code=401, details={"reason": "Missing subject in token"}, request=request)
            raise credentials_exception
    except JWTError as e:
        from services.audit_service import log_audit_event
        await log_audit_event("AUTH_UNAUTHORIZED", "unknown", role="anonymous", status_code=401, details={"reason": str(e)}, request=request)
        raise credentials_exception

    db = get_database()
    user = await db["users"].find_one({"_id": user_id})
    if user is None:
        from services.audit_service import log_audit_event
        await log_audit_event("AUTH_UNAUTHORIZED", user_email, role="unknown", status_code=401, details={"user_id": user_id, "reason": "User session expired or account not found in database"}, request=request)
        raise credentials_exception
    return user

def require_role(allowed_roles: list):
    async def role_checker(request: Request, current_user: dict = Depends(get_current_user)):
        if current_user.get("role") not in allowed_roles:
            from services.audit_service import log_audit_event
            await log_audit_event(
                "AUTH_FORBIDDEN",
                current_user.get("email", "unknown"),
                role=current_user.get("role", "unknown"),
                status_code=403,
                details={"allowed_roles": allowed_roles, "user_role": current_user.get("role")},
                request=request
            )
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Access forbidden: User role '{current_user.get('role')}' is not authorized. Allowed roles: {allowed_roles}"
            )
        return current_user
    return role_checker
