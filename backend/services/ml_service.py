import os
import ast
import joblib
import pandas as pd
import numpy as np
from sklearn.ensemble import RandomForestClassifier
from sklearn.tree import DecisionTreeClassifier
import logging
from rapidfuzz import fuzz


logger = logging.getLogger("medimind")

SPECIALIST_MAPPING = {
    'fungal infection': 'Dermatologist',
    'allergy': 'Allergist / Immunologist',
    'gerd': 'Gastroenterologist',
    'chronic cholestasis': 'Hepatologist / Gastroenterologist',
    'drug reaction': 'Dermatologist / Allergist',
    'peptic ulcer disease': 'Gastroenterologist',
    'peptic ulcer diseae': 'Gastroenterologist',
    'aids': 'Infectious Disease Specialist',
    'diabetes': 'Endocrinologist',
    'diabetes ': 'Endocrinologist',
    'gastroenteritis': 'Gastroenterologist',
    'bronchial asthma': 'Pulmonologist',
    'hypertension': 'Cardiologist',
    'hypertension ': 'Cardiologist',
    'migraine': 'Neurologist',
    'cervical spondylosis': 'Orthopedic Specialist / Neurologist',
    'paralysis (brain hemorrhage)': 'Neurologist',
    'jaundice': 'Hepatologist / Gastroenterologist',
    'malaria': 'Infectious Disease Specialist',
    'chicken pox': 'Pediatrician / General Physician',
    'dengue': 'Infectious Disease Specialist',
    'typhoid': 'Internal Medicine / Infectious Disease',
    'hepatitis a': 'Hepatologist',
    'hepatitis b': 'Hepatologist',
    'hepatitis c': 'Hepatologist',
    'hepatitis d': 'Hepatologist',
    'hepatitis e': 'Hepatologist',
    'alcoholic hepatitis': 'Hepatologist',
    'tuberculosis': 'Pulmonologist',
    'common cold': 'General Physician',
    'pneumonia': 'Pulmonologist',
    'dimorphic hemmorhoids(piles)': 'General Surgeon / Proctologist',
    'dimorphic hemorrhoids(piles)': 'General Surgeon / Proctologist',
    'heart attack': 'Cardiologist (Emergency)',
    'varicose veins': 'Vascular Surgeon',
    'hypothyroidism': 'Endocrinologist',
    'hyperthyroidism': 'Endocrinologist',
    'hypoglycemia': 'Endocrinologist',
    'osteoarthritis': 'Orthopedic Specialist',
    'osteoarthristis': 'Orthopedic Specialist',
    'arthritis': 'Rheumatologist',
    '(vertigo) paroymsal  positional vertigo': 'ENT Specialist / Neurologist',
    '(vertigo) paroxysmal positional vertigo': 'ENT Specialist / Neurologist',
    'acne': 'Dermatologist',
    'urinary tract infection': 'Urologist',
    'psoriasis': 'Dermatologist',
    'impetigo': 'Dermatologist'
}

class DiseasePredictor:
    def __init__(self, data_dir: str):
        self.data_dir = data_dir
        self.model = None
        self.symptoms_dict = {}
        self.diseases_list = {}
        self.description_df = None
        self.precautions_df = None
        self.medications_df = None
        self.diets_df = None
        self.workout_df = None
        self.is_loaded = False
        self._load_data_and_train()

    def _load_data_and_train(self):
        try:
            training_path = os.path.join(self.data_dir, "Training.csv")
            if not os.path.exists(training_path):
                logger.warning(f"Training dataset not found at {training_path}")
                return

            df = pd.read_csv(training_path)
            X = df.iloc[:, :-1]
            y = df.iloc[:, -1]

            # Build feature dictionary
            symptoms = list(X.columns)
            self.symptoms_dict = {symptom.strip(): idx for idx, symptom in enumerate(symptoms)}
            
            # Build target classes
            unique_diseases = np.unique(y)
            self.diseases_list = {idx: dis for idx, dis in enumerate(unique_diseases)}

            # Load or train model using joblib serialization
            model_path = os.path.join(self.data_dir, "model.joblib")
            if os.path.exists(model_path):
                self.model = joblib.load(model_path)
                logger.info(f"Loaded pre-trained RandomForest model from {model_path}")
            else:
                self.model = RandomForestClassifier(n_estimators=100, random_state=42)
                self.model.fit(X, y)
                joblib.dump(self.model, model_path)
                logger.info(f"Trained & cached RandomForest model to {model_path}")

            # Load helper CSV metadata
            self.description_df = pd.read_csv(os.path.join(self.data_dir, "description.csv"))
            self.precautions_df = pd.read_csv(os.path.join(self.data_dir, "precautions_df.csv"))
            self.medications_df = pd.read_csv(os.path.join(self.data_dir, "medications.csv"))
            self.diets_df = pd.read_csv(os.path.join(self.data_dir, "diets.csv"))
            self.workout_df = pd.read_csv(os.path.join(self.data_dir, "workout_df.csv"))

            self.is_loaded = True
            logger.info(f"DiseasePredictor initialized with {len(symptoms)} symptoms and {len(unique_diseases)} diseases.")
        except Exception as e:
            logger.error(f"Failed to train ML model: {e}")

    def get_all_symptoms(self):
        return sorted([s.replace("_", " ").title() for s in self.symptoms_dict.keys()])

    def predict(self, user_symptoms: list):
        if not self.is_loaded or not self.model:
            return self._fallback_prediction(user_symptoms)

        input_vector = np.zeros(len(self.symptoms_dict))


        matched_symptoms = []

        for sym in user_symptoms:
            sym_clean = sym.lower().strip().replace(" ", "_")
            if sym_clean in self.symptoms_dict:
                input_vector[self.symptoms_dict[sym_clean]] = 1
                matched_symptoms.append(sym)
            else:
                # RapidFuzz similarity match (> 85 threshold)
                best_match = None
                best_score = 0
                for key, idx in self.symptoms_dict.items():
                    score = fuzz.ratio(sym_clean, key)
                    if score > best_score:
                        best_score = score
                        best_match = (key, idx)

                if best_match and best_score >= 85:
                    key, idx = best_match
                    input_vector[idx] = 1
                    matched_symptoms.append(key.replace("_", " "))


        if sum(input_vector) == 0:
            return {
                "classification_status": "no_match",
                "predicted_disease": "Unclassified Pattern",
                "confidence_score": 0.0,
                "confidence_percentage": "0.0%",
                "risk_level": "Low",
                "recommended_specialist": "General Physician / Primary Care",
                "description": "Your submitted symptoms could not be matched to a known clinical disease pattern in our classifier database. Please consult a licensed physician for clinical evaluation.",
                "precautions": ["Consult a primary care physician", "Monitor for new or worsening symptoms", "Seek immediate emergency care if experiencing chest pain, shortness of breath, or severe pain"],
                "medications_educational": ["No specific medication recommendation without professional evaluation"],
                "diet_recommendations": ["Maintain hydration", "Eat balanced nutritional meals"],
                "workout_recommendations": ["Avoid strenuous activity until clinically evaluated"],
                "matched_symptoms": []
            }
        else:
            probs = self.model.predict_proba([input_vector])[0]
            max_idx = np.argmax(probs)
            disease_name = self.model.classes_[max_idx]
            confidence = probs[max_idx]

        # Extract details from CSV dataframes
        desc = "No specific description available."
        if self.description_df is not None:
            match = self.description_df[self.description_df['Disease'].str.strip().str.lower() == disease_name.strip().lower()]
            if not match.empty:
                desc = match['Description'].values[0]

        precautions = []
        if self.precautions_df is not None:
            match = self.precautions_df[self.precautions_df['Disease'].str.strip().str.lower() == disease_name.strip().lower()]
            if not match.empty:
                row = match.iloc[0]
                for col in ['Precaution_1', 'Precaution_2', 'Precaution_3', 'Precaution_4']:
                    if col in row and pd.notna(row[col]):
                        precautions.append(str(row[col]).capitalize())

        medications = []
        if self.medications_df is not None:
            match = self.medications_df[self.medications_df['Disease'].str.strip().str.lower() == disease_name.strip().lower()]
            if not match.empty:
                med_raw = match['Medication'].values[0]
                try:
                    medications = ast.literal_eval(med_raw) if isinstance(med_raw, str) and med_raw.startswith('[') else [med_raw]
                except Exception:
                    medications = [med_raw]

        diets = []
        if self.diets_df is not None:
            match = self.diets_df[self.diets_df['Disease'].str.strip().str.lower() == disease_name.strip().lower()]
            if not match.empty:
                diet_raw = match['Diet'].values[0]
                try:
                    diets = ast.literal_eval(diet_raw) if isinstance(diet_raw, str) and diet_raw.startswith('[') else [diet_raw]
                except Exception:
                    diets = [diet_raw]

        workout = []
        if self.workout_df is not None:
            match = self.workout_df[self.workout_df['disease'].str.strip().str.lower() == disease_name.strip().lower()]
            if not match.empty:
                workout = match['workout'].tolist()

        high_danger_diseases = [
            'heart attack', 'pneumonia', 'paralysis (brain hemorrhage)', 
            'tuberculosis', 'dengue', 'aids', 'hepatitis b', 'hepatitis c'
        ]

        disease_clean = disease_name.strip().lower()
        if any(hd in disease_clean for hd in high_danger_diseases):
            risk_level = "High"
        elif confidence > 0.75:
            risk_level = "Moderate"
        else:
            risk_level = "Low"


        return {
            "classification_status": "classified",
            "predicted_disease": disease_name.strip(),
            "confidence_score": float(confidence),
            "confidence_percentage": f"{confidence * 100:.1f}%",
            "risk_level": risk_level,
            "recommended_specialist": specialist,
            "description": desc,
            "precautions": precautions or ["Maintain rest and hydration", "Consult a physician"],
            "medications_educational": medications or ["Consult a doctor for appropriate medication"],
            "diet_recommendations": diets or ["Balanced diet, stay hydrated"],
            "workout_recommendations": workout or ["Mild walking if comfortable"],
            "matched_symptoms": matched_symptoms
        }

    def _fallback_prediction(self, user_symptoms: list):
        return {
            "classification_status": "no_match",
            "predicted_disease": "Unclassified Pattern",
            "confidence_score": 0.0,
            "confidence_percentage": "0.0%",
            "risk_level": "Low",
            "recommended_specialist": "General Physician",
            "description": "Disease classification model is currently offline. Please consult a healthcare provider for evaluation.",
            "precautions": ["Consult a physician", "Monitor symptoms"],
            "medications_educational": ["Consult a doctor for appropriate guidance"],
            "diet_recommendations": ["Stay hydrated"],
            "workout_recommendations": ["Rest until evaluated"],
            "matched_symptoms": user_symptoms
        }


# Singleton instance initialized with relative backend/data path
DATA_PATH = os.path.join(os.path.dirname(os.path.dirname(__file__)), "data")
ml_predictor = DiseasePredictor(DATA_PATH)
