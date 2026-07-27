from fastapi import APIRouter
from models import FAQQuery, FAQResponse
from services.faq_service import faq_engine

router = APIRouter(prefix="/faq", tags=["Medical FAQ Assistant"])

@router.post("/ask", response_model=FAQResponse)
async def ask_faq_assistant(query_in: FAQQuery):
    result = faq_engine.search(query_in.query)
    return FAQResponse(
        answer=result["answer"],
        sources=result["sources"],
        disclaimer=result["disclaimer"]
    )
