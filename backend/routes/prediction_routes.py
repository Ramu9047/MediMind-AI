import uuid
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, status
from models import SymptomInput, PredictionResult
from services.ml_service import ml_predictor
from services.llm_service import generate_prediction_explanation
from auth import get_current_user
from database import get_database
from config import settings

router = APIRouter(prefix="/predictions", tags=["Symptom Checker & AI Prediction"])

@router.get("/symptoms")
async def list_available_symptoms():
    symptoms = ml_predictor.get_all_symptoms()
    return {"symptoms": symptoms}

@router.post("/check", response_model=PredictionResult)
async def check_symptoms(symptom_in: SymptomInput, current_user: dict = Depends(get_current_user)):
    if not symptom_in.symptoms:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="At least one symptom must be selected for analysis."
        )

    # 1. Run ML prediction classifier
    raw_pred = ml_predictor.predict(symptom_in.symptoms)

    # 2. Synthesize LLM natural language explanation (absorbed technique)
    llm_explanation = await generate_prediction_explanation(raw_pred, symptom_in.symptoms)

    pred_id = str(uuid.uuid4())
    patient_id = current_user["_id"]

    result = PredictionResult(
        id=pred_id,
        patient_id=patient_id,
        symptoms=symptom_in.symptoms,
        predicted_disease=raw_pred["predicted_disease"],
        confidence_score=raw_pred["confidence_score"],
        confidence_percentage=raw_pred["confidence_percentage"],
        risk_level=raw_pred["risk_level"],
        recommended_specialist=raw_pred["recommended_specialist"],
        description=raw_pred["description"],
        precautions=raw_pred["precautions"],
        medications_educational=raw_pred["medications_educational"],
        diet_recommendations=raw_pred["diet_recommendations"],
        workout_recommendations=raw_pred["workout_recommendations"],
        llm_explanation=llm_explanation,
        disclaimer=settings.MEDICAL_DISCLAIMER,
        created_at=datetime.utcnow()
    )

    db = get_database()
    # Save prediction doc
    await db["predictions"].insert_one(result.dict())

    # Add entry to patient medical timeline
    timeline_entry = {
        "_id": str(uuid.uuid4()),
        "patient_id": patient_id,
        "event_type": "Symptom Check",
        "title": f"AI Symptom Check: {raw_pred['predicted_disease']}",
        "description": f"Symptoms evaluated: {', '.join(symptom_in.symptoms)}. AI suggested consultation with a {raw_pred['recommended_specialist']}.",
        "status_badge": "Completed",
        "timestamp": datetime.utcnow(),
        "details": {"prediction_id": pred_id, "risk_level": raw_pred["risk_level"]}
    }
    await db["timeline"].insert_one(timeline_entry)

    return result

@router.get("/history")
async def get_patient_prediction_history(current_user: dict = Depends(get_current_user)):
    db = get_database()
    preds = await db["predictions"].find({"patient_id": current_user["_id"]}).to_list(length=50)
    return preds
