import httpx
import logging
import re
from typing import Dict, Any, List, Optional
from datetime import datetime, timezone
from database import get_database

logger = logging.getLogger("medimind")

RXNORM_BASE_URL = "https://rxnav.nlm.nih.gov/REST"
OPENFDA_BASE_URL = "https://api.fda.gov/drug/label.json"

CONDITION_DRUG_MAP = {
    "gerd": [
        {"rxcui": "283742", "generic_name": "Omeprazole", "class": "Proton Pump Inhibitors (PPIs)", "brand": "Prilosec"},
        {"rxcui": "1546356", "generic_name": "Famotidine", "class": "H2 Receptor Antagonists", "brand": "Pepcid"}
    ],
    "peptic ulcer disease": [
        {"rxcui": "283742", "generic_name": "Omeprazole", "class": "Proton Pump Inhibitors (PPIs)", "brand": "Prilosec"},
        {"rxcui": "1546356", "generic_name": "Famotidine", "class": "H2 Receptor Antagonists", "brand": "Pepcid"}
    ],
    "hypertension": [
        {"rxcui": "29046", "generic_name": "Lisinopril", "class": "ACE Inhibitors", "brand": "Zestril"},
        {"rxcui": "197361", "generic_name": "Amlodipine", "class": "Calcium Channel Blockers", "brand": "Norvasc"}
    ],
    "diabetes": [
        {"rxcui": "6809", "generic_name": "Metformin", "class": "Biguanides", "brand": "Glucophage"}
    ],
    "bronchial asthma": [
        {"rxcui": "435", "generic_name": "Albuterol", "class": "Beta-2 Adrenergic Agonists", "brand": "ProAir HFA"},
        {"rxcui": "41126", "generic_name": "Fluticasone", "class": "Corticosteroids", "brand": "Flovent"}
    ],
    "common cold": [
        {"rxcui": "8814", "generic_name": "Pseudoephedrine", "class": "Decongestants", "brand": "Sudafed"},
        {"rxcui": "161", "generic_name": "Acetaminophen", "class": "Analgesics / Antipyretics", "brand": "Tylenol"}
    ],
    "pneumonia": [
        {"rxcui": "723", "generic_name": "Amoxicillin", "class": "Penicillin Antibiotics", "brand": "Amoxil"},
        {"rxcui": "18631", "generic_name": "Azithromycin", "class": "Macrolide Antibiotics", "brand": "Zithromax"}
    ],
    "migraine": [
        {"rxcui": "37418", "generic_name": "Sumatriptan", "class": "Serotonin (5-HT1) Agonists", "brand": "Imitrex"},
        {"rxcui": "161", "generic_name": "Acetaminophen", "class": "Analgesics", "brand": "Tylenol"}
    ],
    "urinary tract infection": [
        {"rxcui": "7454", "generic_name": "Nitrofurantoin", "class": "Urinary Tract Antiseptics", "brand": "Macrobid"},
        {"rxcui": "2551", "generic_name": "Ciprofloxacin", "class": "Fluoroquinolones", "brand": "Cipro"}
    ],
    "acne": [
        {"rxcui": "1350", "generic_name": "Benzoyl Peroxide", "class": "Topical Acne Agents", "brand": "Clearasil"},
        {"rxcui": "3640", "generic_name": "Doxycycline", "class": "Tetracycline Antibiotics", "brand": "Vibramycin"}
    ]
}


async def search_rxnorm_medicines(query: str) -> List[Dict[str, Any]]:
    """Searches RxNorm API for medicine name autocomplete & RxCUI resolution with caching."""
    clean_query = query.strip().lower()
    if not clean_query:
        return []

    db = get_database()
    cached = await db["medicine_cache"].find_one({"_id": f"search_{clean_query}"})
    if cached and "results" in cached:
        return cached["results"]

    results = []
    if clean_query.isdigit():
        direct_props = await resolve_rxnorm_properties(clean_query)
        if direct_props and direct_props.get("name"):
            name = direct_props["name"]
            is_brand = "brand" in name.lower() or " / " in name
            results.append({
                "rxcui": str(clean_query),
                "name": name,
                "synonym": None,
                "term_type": direct_props.get("tty", "BN" if is_brand else "IN"),
                "is_brand": is_brand
            })

    try:
        async with httpx.AsyncClient(timeout=8.0) as client:

            resp = await client.get(
                f"{RXNORM_BASE_URL}/approximateTerm.json",
                params={"term": clean_query, "maxEntries": 12}
            )
            if resp.status_code == 200:
                data = resp.json()
                candidates = data.get("approximateGroup", {}).get("candidate", [])
                seen_rxcuis = set()
                for c in candidates:
                    rxcui = c.get("rxcui")
                    name = c.get("name")
                    if rxcui and name and rxcui not in seen_rxcuis:
                        seen_rxcuis.add(rxcui)
                        is_brand = "brand" in name.lower() or " / " in name
                        results.append({
                            "rxcui": str(rxcui),
                            "name": name,
                            "synonym": c.get("synonym"),
                            "term_type": c.get("tty", "BN" if is_brand else "IN"),
                            "is_brand": is_brand
                        })
    except Exception as e:
        logger.warning(f"RxNorm API search failed for '{query}': {e}")

    if not results:
        for cond, drugs in CONDITION_DRUG_MAP.items():
            for d in drugs:
                if clean_query in d["generic_name"].lower() or clean_query in d["brand"].lower():
                    results.append({
                        "rxcui": d["rxcui"],
                        "name": f"{d['generic_name']} ({d['brand']})",
                        "synonym": d["brand"],
                        "term_type": "IN",
                        "is_brand": False
                    })

    try:
        await db["medicine_cache"].update_one(
            {"_id": f"search_{clean_query}"},
            {"$set": {"query": clean_query, "results": results, "cached_at": datetime.now(timezone.utc)}},
            upsert=True
        )
    except Exception:
        pass

    return results

async def resolve_rxnorm_properties(rxcui: str) -> Optional[Dict[str, Any]]:
    """Resolves official RxNorm properties (name, tty) for a given RxCUI."""
    clean_rxcui = rxcui.strip()
    try:
        async with httpx.AsyncClient(timeout=8.0) as client:
            resp = await client.get(f"{RXNORM_BASE_URL}/rxcui/{clean_rxcui}/properties.json")
            if resp.status_code == 200:
                props = resp.json().get("properties", {})
                if props.get("name"):
                    return props
    except Exception as e:
        logger.warning(f"RxNorm lookup failed for RxCUI {clean_rxcui}: {e}")
    return None

def evaluate_label_matches(results: List[Dict[str, Any]], clean_substance: str) -> tuple[Optional[Dict[str, Any]], str]:
    """
    Scans openFDA results list for clean_substance:
    - Priority 1: Exact single-ingredient label match (no 'and', '/', '+') -> match_type='exact_ingredient'
    - Priority 2: Combination product label match containing clean_substance -> match_type='combination_product'
    """
    exact_single_match = None
    combination_match = None

    for res in results:
        openfda = res.get("openfda", {})
        gen_names = openfda.get("generic_name", [])
        if not gen_names:
            continue

        raw_gen = gen_names[0].strip().lower()
        is_combination = any(marker in raw_gen for marker in [" and ", " / ", " + ", " with ", " & "])
        words = re.findall(r'[a-z]+', raw_gen)

        if not is_combination:
            if clean_substance in words or raw_gen == clean_substance or clean_substance in raw_gen:
                if not exact_single_match:
                    exact_single_match = (res, "exact_ingredient")
        else:
            if clean_substance in words or clean_substance in raw_gen:
                if not combination_match:
                    combination_match = (res, "combination_product")

    if exact_single_match:
        return exact_single_match
    if combination_match:
        return combination_match

    return (None, "no_match")

async def fetch_verified_openfda_label(clean_rxcui: str, rxnorm_name: str) -> tuple[Optional[Dict[str, Any]], str]:
    """
    Fetches raw drug label from openFDA with strict single-ingredient vs combination product categorization:
    1. Direct search by openfda.rxcui == clean_rxcui -> 'exact_ingredient'
    2. Scan up to 15 results for openfda.generic_name to find single-ingredient vs combination label match.
    """
    # 1. Direct openfda.rxcui search
    url_rxc = f'{OPENFDA_BASE_URL}?search=openfda.rxcui:"{clean_rxcui}"&limit=1'
    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            resp = await client.get(url_rxc)
            if resp.status_code == 200:
                results = resp.json().get("results", [])
                if results:
                    label = results[0]
                    if clean_rxcui in label.get("openfda", {}).get("rxcui", []):
                        gen_names = label.get("openfda", {}).get("generic_name", [])
                        raw_gen = gen_names[0].strip().lower() if gen_names else ""
                        is_combo = any(marker in raw_gen for marker in [" and ", " / ", " + ", " with ", " & "]) or any(marker in rxnorm_name.lower() for marker in [" and ", " / ", " + ", " with ", " & "])
                        match_type = "combination_product" if is_combo else "exact_ingredient"
                        return label, match_type

    except Exception as e:
        logger.warning(f"Direct openfda.rxcui lookup failed for {clean_rxcui}: {e}")

    # 2. Scanned ingredient search (limit=15)
    clean_substance = re.sub(r'\d+.*', '', rxnorm_name).replace('/', ' ').strip().lower().split()[0]
    if not clean_substance:
        return None, "no_match"

    url_name = f'{OPENFDA_BASE_URL}?search=openfda.generic_name:"{clean_substance}"&limit=15'
    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            resp = await client.get(url_name)
            if resp.status_code == 200:
                results = resp.json().get("results", [])
                if results:
                    matched_label, match_type = evaluate_label_matches(results, clean_substance)
                    if matched_label:
                        return matched_label, match_type
    except Exception as e:
        logger.warning(f"openFDA generic_name lookup failed for {clean_substance}: {e}")

    return None, "no_match"

async def get_medicine_details_by_rxcui(rxcui: str) -> Optional[Dict[str, Any]]:
    """
    Fetches drug details combining NLM RxNorm concept resolution and openFDA label verification with caching.
    Returns None if the RxCUI is invalid or has no openFDA label match.
    """
    clean_rxcui = rxcui.strip()
    db = get_database()

    # Check cache
    cached = await db["medicine_cache"].find_one({"_id": f"detail_{clean_rxcui}"})
    if cached and "generic_name" in cached and cached.get("is_verified_match") is True:
        return cached

    # 1. Resolve RxNorm properties
    rx_props = await resolve_rxnorm_properties(clean_rxcui)
    if not rx_props:
        return None

    rxnorm_name = rx_props["name"]

    # 2. Fetch verified openFDA label & match type
    fda_label, match_type = await fetch_verified_openfda_label(clean_rxcui, rxnorm_name)
    if not fda_label:
        return None

    openfda = fda_label.get("openfda", {})
    generic_name = openfda.get("generic_name", [rxnorm_name])[0].title()
    brand_names = [b.title() for b in openfda.get("brand_name", [])]
    
    classes = openfda.get("pharm_class_cs", []) + openfda.get("pharm_class_epc", [])
    drug_class = classes[0] if classes else "Pharmacological Agent"

    is_rx = True
    product_type = openfda.get("product_type", ["HUMAN PRESCRIPTION DRUG"])
    if any("OTC" in pt for pt in product_type):
        is_rx = False

    is_combination_product = (match_type == "combination_product")

    indications = fda_label.get("indications_and_usage", ["Consult physician for labeled indications."])[0]
    dosage_text = fda_label.get("dosage_and_administration", ["Refer to prescribing physician or package label instructions."])[0]

    side_effects = []
    if fda_label.get("adverse_reactions"):
        adv = fda_label["adverse_reactions"][0]
        side_effects = [line.strip() for line in adv.split("\n") if len(line.strip()) > 10][:5]

    contraindications = [fda_label.get("contraindications", ["Hypersensitivity to active ingredient."])[0][:300]]
    warnings = [(fda_label.get("warnings") or fda_label.get("warnings_and_cautions") or ["Use with caution."])[0][:400]]
    storage = fda_label.get("storage_and_handling", ["Store at controlled room temperature 20°C to 25°C."])[0]

    result = {
        "_id": f"detail_{clean_rxcui}",
        "rxcui": clean_rxcui,
        "generic_name": generic_name,
        "brand_names": list(dict.fromkeys(brand_names)),
        "drug_class": drug_class,
        "indications": indications,
        "dosage_and_administration": dosage_text,
        "is_prescription_required": is_rx,
        "is_verified_match": True,
        "match_type": match_type,  # 'exact_ingredient' | 'combination_product'
        "is_combination_product": is_combination_product,
        "combination_notice": f"Combination Medication Notice: This FDA drug label reference is for a combination formulation ({generic_name}). Dosing, side effects, and warnings reflect the combination formulation." if is_combination_product else None,
        "rxnorm_concept_name": rxnorm_name,
        "openfda_matched_rxcuis": openfda.get("rxcui", []),
        "common_side_effects": side_effects or ["Nausea", "Headache", "Dizziness", "Gastrointestinal upset"],
        "contraindications": contraindications,
        "warnings_and_precautions": warnings,
        "storage_notes": storage,
        "source_citation": "US National Library of Medicine (RxNorm) & openFDA Drug Labeling API",
        "disclaimer": "Educational Demo Only — medicine information is for reference and does not constitute a medical prescription.",
        "cached_at": datetime.now(timezone.utc)
    }

    try:
        await db["medicine_cache"].update_one(
            {"_id": f"detail_{clean_rxcui}"},
            {"$set": result},
            upsert=True
        )
    except Exception:
        pass

    return result

async def get_medicines_by_condition(condition: str) -> List[Dict[str, Any]]:
    """Returns associated drug classes and specific RxCUIs for a given disease/condition."""
    clean_cond = condition.strip().lower()
    matched_drugs = []

    for cond_key, drugs in CONDITION_DRUG_MAP.items():
        if clean_cond in cond_key or cond_key in clean_cond:
            matched_drugs.extend(drugs)

    return matched_drugs


async def check_medicine_interactions(rxcuis: List[str]) -> List[Dict[str, Any]]:
    """
    Cross-references openFDA drug label warnings and precautions sections pairwise for 2+ RxCUIs.
    Strictly grounds output in retrieved openFDA label text. Returns 'No Specific FDA Warning Documented'
    if no specific warning text is present in the retrieved openFDA labels.
    """
    if len(rxcuis) < 2:
        return []

    interactions = []
    drug_details = []
    for rxcui in rxcuis:
        dt = await get_medicine_details_by_rxcui(rxcui)
        if dt:
            drug_details.append(dt)

    for i in range(len(drug_details)):
        for j in range(i + 1, len(drug_details)):
            d1 = drug_details[i]
            d2 = drug_details[j]

            # Search retrieved openFDA warnings for cross-mentions
            w1 = " ".join(d1.get("warnings_and_precautions", [])) + " " + " ".join(d1.get("contraindications", []))
            w2 = " ".join(d2.get("warnings_and_precautions", [])) + " " + " ".join(d2.get("contraindications", []))

            d1_name_lower = d1["generic_name"].lower().split()[0]
            d2_name_lower = d2["generic_name"].lower().split()[0]

            has_grounded_mention = (d2_name_lower in w1.lower()) or (d1_name_lower in w2.lower())

            if has_grounded_mention:
                severity = "High Warning"
                snippet = w1 if d2_name_lower in w1.lower() else w2
                desc = f"Retrieved openFDA Drug Label Warning: {snippet[:350]}..."
            else:
                severity = "No Specific FDA Warning Documented"
                desc = (
                    f"No specific pairwise drug-drug interaction warning was recorded in the retrieved openFDA drug labels "
                    f"for {d1['generic_name']} ({d1['drug_class']}) and {d2['generic_name']} ({d2['drug_class']}). "
                    f"Always consult a licensed pharmacist or physician for a comprehensive clinical interaction evaluation."
                )

            interactions.append({
                "rxcui1": d1["rxcui"],
                "drug1_name": d1["generic_name"],
                "rxcui2": d2["rxcui"],
                "drug2_name": d2["generic_name"],
                "severity": severity,
                "description": desc,
                "is_grounded_in_openfda_label": has_grounded_mention,
                "source_citation": "openFDA Official Drug Label Warnings & Precautions Sections"
            })

    return interactions

