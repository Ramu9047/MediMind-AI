# MediMind AI - Clinical Healthcare Coordination Platform

> **CRITICAL MEDICAL DISCLAIMER (NON-NEGOTIABLE):**
> **MediMind AI provides educational information only and is not a substitute for professional medical advice, diagnosis, or treatment. Always consult a qualified healthcare provider.**
>
> All symptom predictions are statistical pattern correlations paired with explanatory language (*"this pattern is commonly associated with X — this is not a diagnosis"*). Medicine suggestions are strictly labeled as *"educational reference only, not a prescription"*. All data in this repository is synthetic seed/demo data for portfolio demonstration.

---

## 📌 Product Vision & Positioning

**One-line Positioning:**
*An AI-assisted healthcare coordination platform connecting patients, doctors, and labs — from symptom check to lab result, in one place.*

**The Core Problem Solved:**
Academic medical AI projects frequently build isolated, single-feature tools (e.g. a standalone symptom classifier or an isolated doctor booking portal). **MediMind AI** rebuilds and connects these concepts into one coherent, end-to-end user journey:

```
[Patient Inputs Symptoms] ➔ [ML Classifier + LLM Plain-Language Explanation] ➔ [Direct Appointment / Lab Order] ➔ [Doctor Consultation with AI Context] ➔ [Lab Processing & PDF Upload] ➔ [AI Report Summary in Patient Medical Timeline]
```

---

## 👤 User Personas

| Persona | Role | Key Goal in MediMind AI |
| :--- | :--- | :--- |
| **Sarah Connor** | **Patient** | Evaluate multi-symptom concerns with AI explanations, book doctors/labs, track vitals and medical history timeline. |
| **Dr. Marcus Vance** | **Doctor** | View assigned patient roster, inspect appointment queue, review patient history alongside AI pre-assessment predictions. |
| **Alex Rivera** | **Lab Tech** | Receive diagnostic test orders, update sample status (Requested ➔ Sample Collected ➔ Processing ➔ Completed), upload report PDFs for AI summarization. |
| **SysAdmin** | **System Admin** | Monitor aggregate platform usage, verify JWT/rate-limiting security hardening, inspect operational audit logs. |

---

## 🗺️ Information Architecture / Sitemap

```
MediMind AI
├── / (Landing Page - Light-mode-first Clinical Aesthetic, Hero, 4-Step Journey, Quick Role Logins, Signature ECG Pulse Dividers)
├── /auth
│   ├── /login (Email/Password Login + Quick Demo Buttons)
│   └── /signup (Account Creation with Role Selection)
├── /patient
│   ├── /symptom-checker (41-Disease Classifier + LLM Clinical Explanation + Circular Risk Ring + Direct Booking CTA)
│   ├── /dashboard (Vitals Cards, Weekly BP & Glucose Trend Chart, Active Orders)
│   ├── /appointments (Doctor Consultation Booking & Status Tracker)
│   ├── /lab-tests (Diagnostic Lab Ordering & AI Report Summaries)
│   └── /history (Integrated Chronological Medical History Timeline)
├── /doctor
│   ├── /dashboard (Consultation Queue & Patient Roster)
│   └── /patient/[id] (Full Patient Record, Vitals, AI Predictions & Timeline)
├── /lab
│   └── /dashboard (Lab Test Queue, Sample Status Workflow, Report PDF Upload & AI Summary)
├── /faq (RAG Assistant - Medical Knowledge Base Search with Citation Snippets)
└── /admin
    └── /dashboard (Security Hardening Checklist & Operational Audit Logs)
```

---

## ✨ Features Built

- **Symptom Checker & ML Classifier**: Reimplemented 41-disease classifier mapping 132 symptoms, trained on standard medical dataset.
- **LLM Clinical Reasoner**: Converts raw classifier match scores into reassuring plain-language clinical narratives via Groq / OpenAI.
- **Specialist Auto-Recommendation**: Maps predicted condition patterns to medical specialist types (e.g. GERD ➔ Gastroenterologist, Hypertension ➔ Cardiologist).
- **Direct Appointment & Lab Booking**: One-click booking from prediction results directly pre-filling doctor consultations and lab orders.
- **Lab OCR & AI Summarizer**: PDF report text extraction and LLM plain-language interpretation flagging abnormal values.
- **Unified Medical Timeline**: Chronological feed connecting predictions, doctor visits, and lab report results into a single patient timeline.
- **Medical FAQ Assistant**: RAG search engine over a curated medical knowledge base with visible source snippets.
- **Hardened Security Architecture**: Environment-based secret verification, bcrypt password hashing, JWT authentication, rate-limiting, and strict RBAC role middleware.
- **Calm Clinical Visual Identity**: Light-mode-first design system (`#F7F9F8` canvas, `#0F9B8E` healing teal, `#F97362` warm coral accent), animated ECG pulse line motif, and `JetBrains Mono` precision cues.

---

## 🗄️ MongoDB Unified Schema Design

### `users` Collection
```json
{
  "_id": "pat_demo_01",
  "email": "patient@medimind.ai",
  "name": "Sarah Connor",
  "role": "patient", // "patient" | "doctor" | "lab" | "admin"
  "hashed_password": "$2b$12$...",
  "specialization": "Gastroenterologist & Internal Medicine", // Optional for Doctor role
  "created_at": "2026-07-26T11:00:00Z"
}
```

### `patients` Collection
```json
{
  "_id": "prof_demo_01",
  "user_id": "pat_demo_01",
  "age": 34,
  "gender": "Female",
  "blood_type": "A+",
  "vitals": {
    "blood_pressure_sys": 118,
    "blood_pressure_dia": 78,
    "heart_rate": 74,
    "glucose_mg_dl": 92,
    "bmi": 22.1,
    "weight_kg": 62.0,
    "height_cm": 167.0
  },
  "medical_history": ["Mild Acid Reflux (2025)"]
}
```

### `predictions` Collection
```json
{
  "_id": "pred_demo_01",
  "patient_id": "pat_demo_01",
  "symptoms": ["stomach_pain", "acidity"],
  "predicted_disease": "GERD",
  "confidence_score": 0.88,
  "confidence_percentage": "88.0%",
  "risk_level": "Moderate",
  "recommended_specialist": "Gastroenterologist",
  "description": "GERD occurs when stomach acid flows back into the esophagus.",
  "precautions": ["Avoid spicy foods", "Do not lie down immediately after meals"],
  "medications_educational": ["Omeprazole (educational reference only)"],
  "diet_recommendations": ["High-fiber foods", "Non-citrus fruits"],
  "workout_recommendations": ["Light post-meal walking"],
  "llm_explanation": "Based on reported stomach pain...",
  "disclaimer": "MediMind AI provides educational information only...",
  "created_at": "2026-07-26T11:00:00Z"
}
```

### `appointments` Collection
```json
{
  "_id": "appt_demo_01",
  "patient_id": "pat_demo_01",
  "patient_name": "Sarah Connor",
  "doctor_id": "doc_demo_01",
  "doctor_name": "Dr. Marcus Vance",
  "appointment_date": "2026-07-28",
  "appointment_time": "10:30 AM",
  "reason": "Follow-up consultation for heartburn",
  "status": "Confirmed", // "Pending" | "Confirmed" | "Completed" | "Cancelled"
  "prediction_summary": {
    "predicted_disease": "GERD",
    "risk_level": "Moderate"
  },
  "created_at": "2026-07-26T11:00:00Z"
}
```

### `lab_tests` Collection
```json
{
  "_id": "labtest_demo_01",
  "patient_id": "pat_demo_01",
  "patient_name": "Sarah Connor",
  "test_name": "Comprehensive Metabolic Panel",
  "status": "Completed", // "Requested" | "Sample Collected" | "Processing" | "Completed"
  "notes": "Fast for 8 hours",
  "report_file_name": "Sarah_Connor_Lab_Report.pdf",
  "extracted_text": "Fasting Blood Glucose: 92 mg/dL...",
  "ai_summary": "All metabolic markers within normal adult ranges.",
  "abnormal_flags": ["No abnormal biomarker elevations detected."],
  "created_at": "2026-07-26T11:00:00Z"
}
```

### `timeline` Collection
```json
{
  "_id": "tl_01",
  "patient_id": "pat_demo_01",
  "event_type": "Symptom Check", // "Symptom Check" | "Doctor Appointment" | "Lab Test" | "Report Analysis"
  "title": "AI Symptom Check: GERD",
  "description": "Symptoms evaluated: stomach pain, acidity.",
  "status_badge": "Completed",
  "timestamp": "2026-07-26T11:00:00Z"
}
```

---

## 🔌 API Endpoints Summary

### Auth (`/api/v1/auth`)
- `POST /signup`: Register new user with role.
- `POST /login`: Authenticate email/password, return JWT token.
- `GET /me`: Get current authenticated user profile.

### Symptom Prediction (`/api/v1/predictions`)
- `GET /symptoms`: List 132 selectable symptoms from ML model dataset.
- `POST /check`: Run ML symptom classification + LLM explanation synthesis.
- `GET /history`: Get patient prediction history.

### Appointments (`/api/v1/appointments`)
- `GET /doctors`: List available physicians for booking.
- `POST /book`: Patient submits appointment request.
- `GET /my`: Get user appointments (Patient view or Doctor queue).
- `PUT /{appt_id}/status`: Doctor updates consultation status.

### Lab Tests (`/api/v1/labs`)
- `POST /book`: Patient orders diagnostic lab test.
- `GET /my`: Get lab test queue.
- `PUT /{test_id}/status`: Lab tech updates sample status workflow.
- `POST /{test_id}/upload-report`: Upload report PDF/Image for AI text extraction & summarization.

### Patient Record (`/api/v1/patient`)
- `GET /timeline`: Integrated medical history timeline feed.
- `GET /vitals`: Get patient vitals metrics.
- `PUT /vitals`: Update patient vitals metrics.
- `GET /all`: Doctor view of assigned patient roster.
- `GET /{patient_id}/record`: Doctor view of full patient record.

### Medical FAQ Assistant (`/api/v1/faq`)
- `POST /ask`: Query grounded medical knowledge base with citation snippets.

### Admin (`/api/v1/admin`)
- `GET /metrics`: View security metrics and audit logs (Admin RBAC restricted).

---

## 🎨 Design System & Tokens

- **Light-Mode-First Canvas**: Soft off-white (`#F7F9F8`), mist teal (`#EAF6F3`), mist coral (`#FDF3EF`).
- **Primary Accent**: Healing Teal (`#0F9B8E` / `#0B7A70` hover) for primary buttons, active navigation, and positive states.
- **Urgent Action Accent**: Warm Coral (`#F97362`) for urgent consultation CTAs and high-priority alerts.
- **Dark Mode Support**: Deep teal-charcoal background (`#0B1615`) and surface panel (`#12211F`).
- **Typography**: Display headings in `Sora`, body text in `Inter`, and precision clinical data points in `JetBrains Mono`.
- **Signature Motif**: Animated SVG ECG heartbeat trace sweep line separating sections and animating during LLM reasoning.

---

## 🛠️ Stack & Folder Structure

```
MediMind-AI/
├── backend/
│   ├── data/ (Training.csv, description.csv, precautions_df.csv, medications.csv, etc.)
│   ├── services/
│   │   ├── ml_service.py (41-disease classifier & specialist mapper)
│   │   ├── llm_service.py (Groq/OpenAI client + clinical narrative fallback)
│   │   ├── report_service.py (PDF OCR & report summarizer)
│   │   └── faq_service.py (TF-IDF Cosine Similarity RAG engine)
│   ├── routes/ (auth_routes, prediction_routes, appointment_routes, lab_routes, patient_routes, faq_routes, admin_routes)
│   ├── config.py
│   ├── database.py
│   ├── models.py
│   ├── auth.py
│   ├── seed_data.py
│   ├── main.py
│   └── requirements.txt
└── frontend/
    ├── src/
    │   ├── app/
    │   │   ├── auth/ (login, signup)
    │   │   ├── patient/ (symptom-checker, dashboard, appointments, lab-tests, history)
    │   │   ├── doctor/ (dashboard, patient/[id])
    │   │   ├── lab/ (dashboard)
    │   │   ├── faq/ (page)
    │   │   ├── admin/ (dashboard)
    │   │   ├── layout.tsx
    │   │   ├── page.tsx
    │   │   └── globals.css
    │   ├── components/ (DisclaimerBanner, ECGPulseLine, Navbar, Footer)
    │   ├── context/ (AuthContext, ThemeContext)
    │   └── lib/ (api.ts)
    ├── package.json
    ├── tailwind.config.js
    └── next.config.js
```

---

## 🚀 Local Quickstart & Setup Instructions

### 1. Environment Configuration
Copy `.env.example` templates to create local configuration files:

```bash
# Backend environment setup
cp backend/.env.example backend/.env

# Frontend environment setup
cp frontend/.env.example frontend/.env
```

### 2. Backend Setup (FastAPI)
```bash
cd backend

# Create virtual environment
python -m venv venv
# Windows:
.\venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Start FastAPI dev server (auto-seeds demo database on startup)
python main.py
```
*Backend runs on `http://127.0.0.1:8000`. Interactive docs at `http://127.0.0.1:8000/docs`.*

### 3. Frontend Setup (Next.js 14)
```bash
cd frontend

# Install Node dependencies
npm install

# Start Next.js dev server
npm run dev
```
*Frontend runs on `http://localhost:3000`.*

---

## 🔑 Demo Account Personas

Demo accounts are pre-seeded in the database for testing user workflows:

| Role | Email | Configured Password Note | Pre-seeded Context |
| :--- | :--- | :--- | :--- |
| **Patient** | `patient@medimind.ai` | See local `.env` file | Sarah Connor, GERD AI check, appointment request, lab report. |
| **Doctor** | `doctor@medimind.ai` | See local `.env` file | Dr. Marcus Vance (Gastroenterology), consultation queue. |
| **Lab Tech** | `lab@medimind.ai` | See local `.env` file | Alex Rivera (Apex MedLab), test queue & PDF report upload. |
| **Admin** | `admin@medimind.ai` | See local `.env` file (`ADMIN_PASSWORD`) | SysAdmin, security metrics & audit logs. |

---

## 📦 Showcase Descriptions

### GitHub One-Line Description
> An AI-assisted healthcare coordination platform built with Next.js 14, FastAPI, and MongoDB that seamlessly connects patient symptom checking, LLM explanations, doctor appointments, and lab report AI summaries into a unified timeline.

### LinkedIn / Resume Description (2-3 Sentences)
> Built **MediMind AI**, a full-stack healthcare coordination platform connecting patients, doctors, and diagnostic labs in a single unified product. Integrated a 41-disease ML symptom classifier with LLM natural language explanations, automated PDF lab report summarization, and RAG medical FAQ search over a Next.js 14, FastAPI, and MongoDB architecture. Hardened with JWT authentication, bcrypt password hashing, role-based access control, and strict persistent medical disclaimers.

---

## 🔮 Future Roadmap (Intentionally Deferred)

To keep this portfolio rebuild focused on high-quality core coordination, the following items were deliberately deferred for future iterations:
- Voice input / speech-to-text integration for symptom reporting.
- Commercial billing, payment gateway processing, and enterprise subscription tiers.
- HIPAA compliance certification claims (maintained security best practices without claiming formal regulatory compliance).
- Multi-vector database cluster deployment (Pinecone / ChromaDB).
