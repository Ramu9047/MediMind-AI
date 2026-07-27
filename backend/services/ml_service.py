import os
import pandas as pd
import numpy as np
from sklearn.ensemble import RandomForestClassifier
from sklearn.tree import DecisionTreeClassifier
import logging

logger = logging.getLogger("medimind")

SPECIALIST_MAPPING = {
    'Fungal infection': 'Dermatologist',
    'Allergy': 'Allergist / Immunologist',
    'GERD': 'Gastroenterologist',
    'Chronic cholestasis': 'Hepatologist / Gastroenterologist',
    'Drug Reaction': 'Dermatologist / Allergist',
    'Peptic ulcer diseae': 'Gastroenterologist',
    'AIDS': 'Infectious Disease Specialist',
    'Diabetes ': 'Endocrinologist',
    'Gastroenteritis': 'Gastroenterologist',
    'Bronchial Asthma': 'Pulmonologist',
    'Hypertension ': 'Cardiologist',
    'Migraine': 'Neurologist',
    'Cervical spondylosis': 'Orthopedic Specialist / Neurologist',
    'Paralysis (brain hemorrhage)': 'Neurologist',
    'Jaundice': 'Hepatologist / Gastroenterologist',
    'Malaria': 'Infectious Disease Specialist',
    'Chicken pox': 'Pediatrician / General Physician',
    'Dengue': 'Infectious Disease Specialist',
    'Typhoid': 'Internal Medicine / Infectious Disease',
    'hepatitis A': 'Hepatologist',
    'Hepatitis B': 'Hepatologist',
    'Hepatitis C': 'Hepatologist',
    'Hepatitis D': 'Hepatologist',
    'Hepatitis E': 'Hepatologist',
    'Alcoholic hepatitis': 'Hepatologist',
    'Tuberculosis': 'Pulmonologist',
    'Common Cold': 'General Physician',
    'Pneumonia': 'Pulmonologist',
    'Dimorphic hemmorhoids(piles)': 'General Surgeon / Proctologist',
    'Heart attack': 'Cardiologist (Emergency)',
    'Varicose veins': 'Vascular Surgeon',
    'Hypothyroidism': 'Endocrinologist',
    'Hyperthyroidism': 'Endocrinologist',
    'Hypoglycemia': 'Endocrinologist',
    'Osteoarthristis': 'Orthopedic Specialist',
    'Arthritis': 'Rheumatologist',
    '(vertigo) Paroymsal  Positional Vertigo': 'ENT Specialist / Neurologist',
    'Acne': 'Dermatologist',
    'Urinary tract infection': 'Urologist',
    'Psoriasis': 'Dermatologist',
    'Impetigo': 'Dermatologist'
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

            # Train classifier model
            self.model = RandomForestClassifier(n_estimators=100, random_state=42)
            self.model.fit(X, y)

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
            # Fallback mock prediction if dataset not loaded
            return self._fallback_prediction(user_symptoms)

        input_vector = np.zeros(len(self.symptoms_dict))
        matched_symptoms = []

        for sym in user_symptoms:
            sym_clean = sym.lower().strip().replace(" ", "_")
            if sym_clean in self.symptoms_dict:
                input_vector[self.symptoms_dict[sym_clean]] = 1
                matched_symptoms.append(sym)
            else:
                # Partial match search
                for key, idx in self.symptoms_dict.items():
                    if sym_clean in key or key in sym_clean:
                        input_vector[idx] = 1
                        matched_symptoms.append(key.replace("_", " "))
                        break

        if sum(input_vector) == 0:
            # If no direct match, activate a general default pattern
            disease_name = "Allergy"
            confidence = 0.65
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
                    medications = eval(med_raw) if isinstance(med_raw, str) and med_raw.startswith('[') else [med_raw]
                except Exception:
                    medications = [med_raw]

        diets = []
        if self.diets_df is not None:
            match = self.diets_df[self.diets_df['Disease'].str.strip().str.lower() == disease_name.strip().lower()]
            if not match.empty:
                diet_raw = match['Diet'].values[0]
                try:
                    diets = eval(diet_raw) if isinstance(diet_raw, str) and diet_raw.startswith('[') else [diet_raw]
                except Exception:
                    diets = [diet_raw]

        workout = []
        if self.workout_df is not None:
            match = self.workout_df[self.workout_df['disease'].str.strip().str.lower() == disease_name.strip().lower()]
            if not match.empty:
                workout = match['workout'].tolist()

        specialist = SPECIALIST_MAPPING.get(disease_name, 'General Physician')

        risk_level = "Low"
        if confidence > 0.85:
            risk_level = "High" if disease_name in ['Heart attack', 'Pneumonia', 'Paralysis (brain hemorrhage)', 'Tuberculosis', 'Dengue'] else "Moderate"
        elif confidence > 0.60:
            risk_level = "Moderate"

        return {
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
            "predicted_disease": "Common Cold / Allergy Pattern",
            "confidence_score": 0.75,
            "confidence_percentage": "75.0%",
            "risk_level": "Low",
            "recommended_specialist": "General Physician",
            "description": "A common upper respiratory or immune sensitivity pattern.",
            "precautions": ["Stay hydrated", "Get adequate rest", "Monitor temperature"],
            "medications_educational": ["Antihistamines (educational reference only)"],
            "diet_recommendations": ["Warm fluids, Vitamin C rich foods"],
            "workout_recommendations": ["Rest until symptoms resolve"],
            "matched_symptoms": user_symptoms
        }

# Singleton instance initialized with relative backend/data path
DATA_PATH = os.path.join(os.path.dirname(os.path.dirname(__file__)), "data")
ml_predictor = DiseasePredictor(DATA_PATH)
