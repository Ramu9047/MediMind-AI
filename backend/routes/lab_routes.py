import uuid
from datetime import datetime, timezone
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File
from models import LabTestCreate, LabTestResponse, LabTestStatus, UserRole
from auth import get_current_user, require_role
from database import get_database
from services.report_service import process_lab_report_file
from services.audit_service import log_audit_event

router = APIRouter(prefix="/labs", tags=["Lab Tests & Diagnostic Reports"])

@router.post("/book", response_model=LabTestResponse)
async def book_lab_test(
    test_in: LabTestCreate,
    current_user: dict = Depends(require_role([UserRole.PATIENT]))
):
    db = get_database()
    test_id = f"labtest_{uuid.uuid4().hex[:10]}"

    test_doc = {
        "_id": test_id,
        "patient_id": current_user["_id"],
        "patient_name": current_user["name"],
        "test_name": test_in.test_name,
        "status": LabTestStatus.REQUESTED,
        "notes": test_in.notes,
        "created_at": datetime.now(timezone.utc),
        "updated_at": datetime.now(timezone.utc)
    }

    await db["lab_tests"].insert_one(test_doc)

    # Insert into timeline
    await db["timeline"].insert_one({
        "_id": str(uuid.uuid4()),
        "patient_id": current_user["_id"],
        "event_type": "Lab Test",
        "title": f"Lab Test Requested: {test_in.test_name}",
        "description": f"Order initiated for {test_in.test_name}. Status: Requested.",
        "status_badge": LabTestStatus.REQUESTED,
        "timestamp": datetime.now(timezone.utc)
    })

    await log_audit_event(
        action="LAB_TEST_ORDERED",
        user_email=current_user["email"],
        role=current_user["role"],
        status_code=201,
        details={"test_id": test_id, "test_name": test_in.test_name}
    )

    return LabTestResponse(
        id=test_id,
        patient_id=current_user["_id"],
        patient_name=current_user["name"],
        test_name=test_in.test_name,
        status=LabTestStatus.REQUESTED,
        notes=test_in.notes,
        created_at=test_doc["created_at"],
        updated_at=test_doc["updated_at"]
    )

@router.get("/my")
async def get_my_lab_tests(current_user: dict = Depends(get_current_user)):
    db = get_database()
    role = current_user.get("role")
    if role == UserRole.LAB or role == UserRole.ADMIN:
        tests = await db["lab_tests"].find({}).to_list(length=100)
    else:
        tests = await db["lab_tests"].find({"patient_id": current_user["_id"]}).to_list(length=100)

    result = []
    for t in tests:
        result.append(LabTestResponse(
            id=t["_id"],
            patient_id=t["patient_id"],
            patient_name=t.get("patient_name", "Patient"),
            test_name=t["test_name"],
            status=t.get("status", LabTestStatus.REQUESTED),
            notes=t.get("notes", ""),
            report_file_name=t.get("report_file_name"),
            extracted_text=t.get("extracted_text"),
            ai_summary=t.get("ai_summary"),
            abnormal_flags=t.get("abnormal_flags", []),
            created_at=t.get("created_at", datetime.now(timezone.utc)),
            updated_at=t.get("updated_at", datetime.now(timezone.utc))
        ))
    return result

@router.put("/{test_id}/status")
async def update_lab_status(
    test_id: str,
    new_status: str,
    current_user: dict = Depends(require_role([UserRole.LAB, UserRole.ADMIN]))
):
    db = get_database()
    valid_statuses = [
        LabTestStatus.REQUESTED,
        LabTestStatus.SAMPLE_COLLECTED,
        LabTestStatus.PROCESSING,
        LabTestStatus.COMPLETED,
        LabTestStatus.EXTRACTION_FAILED
    ]
    if new_status not in valid_statuses:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=f"Invalid lab status '{new_status}'. Must be one of: {', '.join(valid_statuses)}"
        )

    test = await db["lab_tests"].find_one({"_id": test_id})
    if not test:
        raise HTTPException(status_code=404, detail="Lab test not found")

    if current_user.get("role") == UserRole.LAB and test.get("assigned_lab_id"):
        if test["assigned_lab_id"] != current_user["_id"]:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Access forbidden: You can only update lab test orders assigned to your laboratory."
            )

    await db["lab_tests"].update_one(
        {"_id": test_id},
        {"$set": {"status": new_status, "updated_at": datetime.now(timezone.utc)}}
    )

    await log_audit_event(
        action="LAB_TEST_STATUS_UPDATED",
        user_email=current_user["email"],
        role=current_user["role"],
        status_code=200,
        details={"test_id": test_id, "new_status": new_status}
    )

    return {"message": f"Lab test status updated to {new_status}"}


@router.post("/{test_id}/upload-report")
async def upload_lab_report(
    test_id: str,
    file: UploadFile = File(...),
    current_user: dict = Depends(require_role([UserRole.LAB, UserRole.ADMIN]))
):
    db = get_database()
    test = await db["lab_tests"].find_one({"_id": test_id})
    if not test:
        raise HTTPException(status_code=404, detail="Lab test order not found")

    if current_user.get("role") == UserRole.LAB and test.get("assigned_lab_id"):
        if test["assigned_lab_id"] != current_user["_id"]:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Access forbidden: You can only upload reports for lab tests assigned to your laboratory."
            )

    ALLOWED_EXTENSIONS = {".pdf", ".png", ".jpg", ".jpeg", ".webp"}
    MAX_FILE_SIZE = 10 * 1024 * 1024  # 10MB

    file_ext = "." + file.filename.lower().split(".")[-1] if "." in file.filename else ""
    if file_ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Unsupported file format '{file_ext}'. Allowed formats are PDF, PNG, JPG, JPEG, and WEBP."
        )

    file_bytes = await file.read()
    if len(file_bytes) > MAX_FILE_SIZE:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"File size ({len(file_bytes) / (1024*1024):.1f}MB) exceeds the 10MB maximum limit."
        )

    # Run report extraction and AI interpretation

    report_analysis = await process_lab_report_file(file_bytes, file.filename)

    if report_analysis.get("extraction_failed"):
        update_payload = {
            "status": "ExtractionFailed",
            "report_file_name": file.filename,
            "extracted_text": "",
            "ai_summary": None,
            "abnormal_flags": [],
            "updated_at": datetime.now(timezone.utc)
        }
        await db["lab_tests"].update_one({"_id": test_id}, {"$set": update_payload})

        await log_audit_event(
            action="LAB_REPORT_EXTRACTION_FAILED",
            user_email=current_user["email"],
            role=current_user["role"],
            status_code=422,
            details={"test_id": test_id, "file_name": file.filename, "reason": report_analysis["message"]}
        )

        return {
            "message": report_analysis["message"],
            "analysis": report_analysis
        }

    update_payload = {
        "status": LabTestStatus.COMPLETED,
        "report_file_name": file.filename,
        "extracted_text": report_analysis["extracted_text"],
        "ai_summary": report_analysis["ai_summary"],
        "abnormal_flags": report_analysis["abnormal_flags"],
        "updated_at": datetime.now(timezone.utc)
    }

    await db["lab_tests"].update_one({"_id": test_id}, {"$set": update_payload})

    # Add timeline record for lab report analysis
    await db["timeline"].insert_one({
        "_id": str(uuid.uuid4()),
        "patient_id": test["patient_id"],
        "event_type": "Report Analysis",
        "title": f"Lab Report Published: {test['test_name']}",
        "description": f"Report '{file.filename}' processed with AI summary: {report_analysis['ai_summary'][:120]}...",
        "status_badge": "Completed",
        "timestamp": datetime.now(timezone.utc),
        "details": {
            "test_id": test_id,
            "abnormal_flags": report_analysis["abnormal_flags"]
        }
    })

    await log_audit_event(
        action="LAB_REPORT_PUBLISHED",
        user_email=current_user["email"],
        role=current_user["role"],
        status_code=200,
        details={"test_id": test_id, "file_name": file.filename}
    )

    return {
        "message": "Lab report uploaded and analyzed successfully",
        "analysis": report_analysis
    }

