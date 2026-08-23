from fastapi import APIRouter, Depends, HTTPException, status
from models import SymptomNLPExtractRequest, SymptomNLPExtractResponse
from auth import get_current_user
from services.nlp_symptom_service import extract_symptoms_from_free_text

router = APIRouter(prefix="/symptom-nlp", tags=["Symptom NLP Extraction"])

@router.post("/extract", response_model=SymptomNLPExtractResponse)
async def extract_symptoms(
    req: SymptomNLPExtractRequest,
    current_user: dict = Depends(get_current_user)
):
    if not req.free_text or not req.free_text.strip():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Free-text description cannot be empty."
        )

    result = await extract_symptoms_from_free_text(req.free_text)
    
    return SymptomNLPExtractResponse(
        matched_symptoms=result["matched_symptoms"],
        unmatched_input_notes=result["unmatched_input_notes"],
        duration=result["duration"],
        severity=result["severity"],
        location=result["location"],
        confidence=result["confidence"]
    )
