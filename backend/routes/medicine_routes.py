from typing import List
from fastapi import APIRouter, Depends, HTTPException, status, Query
from models import (
    MedicineSearchResponse, MedicineSearchItem,
    MedicineDetailResponse, MedicineInteractionRequest,
    MedicineInteractionResponse, PairwiseInteraction, UserRole
)
from auth import get_current_user, require_role
from services.medicine_service import (
    search_rxnorm_medicines,
    get_medicine_details_by_rxcui,
    get_medicines_by_condition,
    check_medicine_interactions
)

router = APIRouter(prefix="/medicines", tags=["Medicine Information Hub"])

@router.get("/search", response_model=MedicineSearchResponse)
async def search_medicines(
    q: str = Query(..., min_length=1),
    current_user: dict = Depends(require_role([UserRole.PATIENT, UserRole.DOCTOR, UserRole.ADMIN]))
):
    results = await search_rxnorm_medicines(q)
    items = [MedicineSearchItem(**r) for r in results]
    return MedicineSearchResponse(query=q, results=items)

@router.get("/by-condition")
async def lookup_by_condition(
    condition: str = Query(..., min_length=1),
    current_user: dict = Depends(require_role([UserRole.PATIENT, UserRole.DOCTOR, UserRole.ADMIN]))
):
    results = await get_medicines_by_condition(condition)
    return {"condition": condition, "associated_medications": results}

@router.get("/{rxcui}", response_model=MedicineDetailResponse)
async def get_medicine_detail(
    rxcui: str,
    current_user: dict = Depends(require_role([UserRole.PATIENT, UserRole.DOCTOR, UserRole.ADMIN]))
):
    dt = await get_medicine_details_by_rxcui(rxcui)
    if not dt:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"No openFDA label found with an exact RxCUI match for '{rxcui}'."
        )

    return MedicineDetailResponse(
        rxcui=dt["rxcui"],
        generic_name=dt["generic_name"],
        brand_names=dt.get("brand_names", []),
        drug_class=dt.get("drug_class", "Pharmacological Agent"),
        indications=dt.get("indications", "Consult a physician."),
        dosage_and_administration=dt.get("dosage_and_administration", "Follow physician guidelines."),
        is_prescription_required=dt.get("is_prescription_required", True),
        match_type=dt.get("match_type", "exact_ingredient"),
        is_combination_product=dt.get("is_combination_product", False),
        combination_notice=dt.get("combination_notice"),
        common_side_effects=dt.get("common_side_effects", []),
        contraindications=dt.get("contraindications", []),
        warnings_and_precautions=dt.get("warnings_and_precautions", []),
        storage_notes=dt.get("storage_notes", "Store at room temperature."),
        source_citation=dt.get("source_citation", "RxNorm & openFDA"),
        disclaimer=dt.get("disclaimer", "Educational Demo Only")
    )


@router.post("/interactions", response_model=MedicineInteractionResponse)
async def check_interactions(
    req: MedicineInteractionRequest,
    current_user: dict = Depends(require_role([UserRole.PATIENT, UserRole.DOCTOR, UserRole.ADMIN]))
):
    if len(req.rxcuis) < 2:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="At least 2 RxCUIs are required to perform a pairwise drug interaction check."
        )
    if len(req.rxcuis) > 10:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Maximum of 10 RxCUIs permitted per interaction request."
        )


    pairwise_list = await check_medicine_interactions(req.rxcuis)
    items = [PairwiseInteraction(**p) for p in pairwise_list]

    return MedicineInteractionResponse(
        rxcuis=req.rxcuis,
        interactions=items
    )
