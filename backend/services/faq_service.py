import re
import numpy as np
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
from config import settings

# Curated Medical Knowledge Base for honest RAG pattern demonstration
MEDICAL_KNOWLEDGE_BASE = [
    {
        "id": "kb_01",
        "title": "Understanding High Blood Pressure (Hypertension)",
        "content": "Hypertension is a chronic medical condition where systemic arterial pressure is persistently elevated. A reading above 130/80 mmHg is considered stage 1 hypertension. Management includes sodium restriction, regular aerobic exercise, stress reduction, and prescribed antihypertensive medications.",
        "category": "Cardiovascular Health",
        "source": "MediMind Clinical Guidelines - Cardiovascular Reference"
    },
    {
        "id": "kb_02",
        "title": "Managing Type 2 Diabetes & Blood Sugar",
        "content": "Type 2 diabetes affects how your body processes blood sugar (glucose). Fasting blood sugar levels of 126 mg/dL or higher on two separate tests indicate diabetes. Primary lifestyle modifications focus on a low glycemic index diet, regular physical activity, monitoring HbA1c levels every 3-6 months, and medication adherence.",
        "category": "Endocrinology",
        "source": "MediMind Clinical Guidelines - Diabetes Care Manual"
    },
    {
        "id": "kb_03",
        "title": "Common Cold vs Influenza (Flu) Symptoms",
        "content": "While both are viral respiratory illnesses, flu symptoms occur abruptly and are more severe, including high fever, body chills, extreme fatigue, and chest discomfort. Common colds usually develop gradually with runny nose, sore throat, and mild fever. Rest, hydration, and fever reducers help manage cold symptoms.",
        "category": "General Medicine",
        "source": "MediMind Clinical Guidelines - Respiratory Infections"
    },
    {
        "id": "kb_04",
        "title": "Gastroesophageal Reflux Disease (GERD) Relief",
        "content": "GERD occurs when stomach acid frequently flows back into the esophagus, causing heartburn and regurgitation. Dietary recommendations involve avoiding spicy foods, citrus, caffeine, late-night meals, and elevating the head of the bed during sleep.",
        "category": "Gastroenterology",
        "source": "MediMind Clinical Guidelines - Gastrointestinal Health"
    },
    {
        "id": "kb_05",
        "title": "Importance of Routine Diagnostic Lab Tests",
        "content": "Routine blood panels such as Complete Blood Count (CBC), Comprehensive Metabolic Panel (CMP), and Lipid Profiles help detect early signs of metabolic disorders, anemia, kidney/liver dysfunctions, and infection before clinical symptoms manifest.",
        "category": "Laboratory Diagnostics",
        "source": "MediMind Clinical Guidelines - Laboratory Interpretation Guide"
    },
    {
        "id": "kb_06",
        "title": "Migraine Headache Triggers & Care",
        "content": "Migraines are intense neurological headaches often accompanied by nausea, aura, and light sensitivity. Common triggers include stress, erratic sleep schedules, dehydration, aged cheeses, and hormonal fluctuations. Resting in a dark, quiet room with cold compresses provides symptomatic relief.",
        "category": "Neurology",
        "source": "MediMind Clinical Guidelines - Neurological Health"
    }
]

class MedicalFAQEngine:
    def __init__(self):
        self.kb = MEDICAL_KNOWLEDGE_BASE
        self.vectorizer = TfidfVectorizer(stop_words='english')
        self.corpus_texts = [f"{item['title']} {item['content']}" for item in self.kb]
        self.tfidf_matrix = self.vectorizer.fit_transform(self.corpus_texts)

    def search(self, query: str, top_k: int = 2) -> dict:
        query_vec = self.vectorizer.transform([query])
        similarities = cosine_similarity(query_vec, self.tfidf_matrix).flatten()
        top_indices = np.argsort(similarities)[::-1][:top_k]

        sources = []
        best_contents = []

        for idx in top_indices:
            score = float(similarities[idx])
            if score > 0.05:  # Minimum relevance threshold
                item = self.kb[idx]
                sources.append({
                    "title": item["title"],
                    "category": item["category"],
                    "source": item["source"],
                    "snippet": item["content"][:160] + "...",
                    "relevance_score": f"{score * 100:.1f}%"
                })
                best_contents.append(f"**{item['title']}**:\n{item['content']}")

        if not best_contents:
            answer = (
                "I couldn't find a direct match in our verified medical knowledge base for your specific query. "
                "For non-diagnostic general health questions, please consult a qualified doctor or browse our specialty directories."
            )
            sources = [{
                "title": "MediMind General Health FAQ",
                "category": "General Health",
                "source": "MediMind Clinical Core Knowledge Base",
                "snippet": "General clinical guidance repository.",
                "relevance_score": "N/A"
            }]
        else:
            answer = "\n\n".join(best_contents)

        return {
            "answer": answer,
            "sources": sources,
            "disclaimer": settings.MEDICAL_DISCLAIMER
        }

faq_engine = MedicalFAQEngine()
