import json
import logging
from typing import Dict, Any, List
from rapidfuzz import fuzz
from services.ml_service import ml_predictor

from services.llm_service import call_llm_api

logger = logging.getLogger("medimind")

async def extract_symptoms_from_free_text(free_text: str) -> Dict[str, Any]:
    """
    Uses LLM with constrained prompt to map patient's natural language symptom description
    strictly into the platform's canonical 132-symptom vocabulary, while extracting
    clinical context (duration, severity, body location).
    """
    canonical_symptoms = ml_predictor.get_all_symptoms()
    symptoms_list_str = ", ".join(f'"{s}"' for s in canonical_symptoms)

    system_prompt = (
        "You are an expert clinical NLP triage engine. Your job is to analyze patient natural language descriptions "
        "and extract symptoms strictly mapped to allowed canonical medical symptom terms.\n\n"
        f"ALLOWED CANONICAL SYMPTOMS (do NOT output any symptom name outside this list):\n[{symptoms_list_str}]\n\n"
        "Guidelines:\n"
        "1. Map every symptom mentioned in the user input to the closest matching term in the allowed canonical list.\n"
        "2. If an input symptom or phrase cannot be mapped to any allowed canonical term, summarize it concisely in 'unmatched_input_notes'.\n"
        "3. Maintain a formal, professional clinical tone in 'unmatched_input_notes'. Never mirror slang or crude language.\n"
        "4. Extract clinical metadata if mentioned: 'duration' (e.g. '3 days', 'since morning'), 'severity' ('mild'|'moderate'|'severe'|'unspecified'), and 'location' (e.g. 'lower right abdomen', 'chest').\n"
        "5. Assign 'confidence': 'high' if symptoms map cleanly, 'medium' if partial/inferred, or 'low' if no symptoms match or input is vague.\n"
        "6. Return ONLY valid JSON with keys: matched_symptoms (array of strings), unmatched_input_notes (string), duration (string), severity (string), location (string), confidence (string: 'high'|'medium'|'low')."
    )

    user_prompt = f"Patient Input Text: \"{free_text}\"\n\nReturn strict JSON format only."

    llm_raw = await call_llm_api(system_prompt, user_prompt)
    
    if llm_raw:
        try:
            # Clean potential markdown JSON backticks
            clean_str = llm_raw.strip()
            if clean_str.startswith("```"):
                clean_str = clean_str.split("\n", 1)[1]
                if clean_str.endswith("```"):
                    clean_str = clean_str.rsplit("```", 1)[0]
                clean_str = clean_str.strip()
            if clean_str.startswith("json"):
                clean_str = clean_str[4:].strip()

            parsed = json.loads(clean_str)
            matched = parsed.get("matched_symptoms", [])
            # Filter strictly against canonical list
            canonical_set = set(canonical_symptoms)
            valid_matched = [s for s in matched if s in canonical_set]

            return {
                "matched_symptoms": valid_matched,
                "unmatched_input_notes": parsed.get("unmatched_input_notes", ""),
                "duration": parsed.get("duration", "unspecified"),
                "severity": parsed.get("severity", "unspecified"),
                "location": parsed.get("location", "unspecified"),
                "confidence": parsed.get("confidence", "high" if valid_matched else "low")
            }
        except Exception as e:
            logger.warning(f"Failed to parse LLM JSON extraction response: {e}")

    # Fallback keyword matching against canonical symptoms using RapidFuzz

    matched_symptoms = []
    text_lower = free_text.lower()
    for s in canonical_symptoms:
        s_lower = s.lower()
        if s_lower in text_lower:
            matched_symptoms.append(s)
        else:
            score = fuzz.partial_ratio(s_lower, text_lower)
            if score >= 88 and len(s_lower) > 3:
                matched_symptoms.append(s)


    # Limit fallback matches to top 5
    matched_symptoms = list(dict.fromkeys(matched_symptoms))[:5]
    confidence = "high" if len(matched_symptoms) >= 2 else ("medium" if matched_symptoms else "low")

    return {
        "matched_symptoms": matched_symptoms,
        "unmatched_input_notes": "Extracted via clinical keyword dictionary matching." if matched_symptoms else "Description could not be mapped to standard symptom index.",
        "duration": "unspecified",
        "severity": "unspecified",
        "location": "unspecified",
        "confidence": confidence
    }
