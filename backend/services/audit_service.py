import uuid
from datetime import datetime, timezone
from typing import Optional, Dict, Any
import logging
from database import get_database

logger = logging.getLogger("medimind")

from fastapi import Request

async def log_audit_event(
    action: str,
    user_email: str,
    role: str = "system",
    status_code: int = 200,
    details: Optional[Dict[str, Any]] = None,
    ip_address: Optional[str] = None,
    request: Optional[Request] = None
):
    """
    Persists structured security audit events to the audit_events collection.
    """
    try:
        db = get_database()

        client_ip = ip_address
        if not client_ip and request:
            if request.headers.get("x-forwarded-for"):
                client_ip = request.headers.get("x-forwarded-for").split(",")[0].strip()
            elif request.client and request.client.host:
                client_ip = request.client.host
        if not client_ip:
            client_ip = "127.0.0.1"

        event_doc = {
            "_id": str(uuid.uuid4()),
            "action": action,
            "user_email": user_email,
            "role": role,
            "status_code": status_code,
            "details": details or {},
            "ip_address": client_ip,
            "timestamp": datetime.now(timezone.utc)
        }
        await db["audit_events"].insert_one(event_doc)
        # Also maintain backwards compatibility with audit_logs
        await db["audit_logs"].insert_one({
            "_id": event_doc["_id"],
            "action": action,
            "user_email": user_email,
            "role": role,
            "timestamp": event_doc["timestamp"]
        })
    except Exception as e:
        logger.error(f"Failed to log audit event '{action}': {e}")

