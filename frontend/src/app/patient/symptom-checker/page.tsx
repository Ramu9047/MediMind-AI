'use client';

import React, { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { fetchApi } from '@/lib/api';
import {
  Activity,
  Sparkles,
  Stethoscope,
  AlertTriangle,
  CheckCircle2,
  Search,
  RotateCcw,
  Info,
  MessageSquareText,
  Pill,
  ExternalLink,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import ECGPulseLine from '@/components/ECGPulseLine';
import ProtectedRoute from '@/components/ProtectedRoute';

const ALL_SYMPTOMS = [
  'itching', 'skin_rash', 'nodal_skin_eruptions', 'continuous_sneezing', 'shivering', 'chills',
  'joint_pain', 'stomach_pain', 'acidity', 'ulcers_on_tongue', 'muscle_wasting', 'vomiting',
  'burning_micturition', 'spotting_urination', 'fatigue', 'weight_gain', 'anxiety',
  'cold_hands_and_feets', 'mood_swings', 'weight_loss', 'restlessness', 'lethargy',
  'patches_in_throat', 'irregular_sugar_level', 'cough', 'high_fever', 'sunken_eyes',
  'breathlessness', 'sweating', 'dehydration', 'indigestion', 'headache', 'yellowish_skin',
  'dark_urine', 'nausea', 'loss_of_appetite', 'pain_behind_the_eyes', 'back_pain',
  'constipation', 'abdominal_pain', 'diarrhoea', 'mild_fever', 'yellow_urine',
  'yellowing_of_eyes', 'acute_liver_failure', 'fluid_overload', 'swelling_of_stomach',
  'swelled_lymph_nodes', 'malaise', 'blurred_and_distorted_vision', 'phlegm',
  'throat_irritation', 'redness_of_eyes', 'sinus_pressure', 'runny_nose', 'congestion',
  'chest_pain', 'weakness_in_limbs', 'fast_heart_rate', 'pain_during_bowel_movements',
  'pain_in_anal_region', 'bloody_stool', 'irritation_in_anus', 'neck_pain', 'dizziness',
  'cramps', 'bruising', 'obesity', 'swollen_legs', 'swollen_blood_vessels',
  'puffy_face_and_eyes', 'enlarged_thyroid', 'brittle_nails', 'swollen_extremeties',
  'excessive_hunger', 'extra_marital_contacts', 'drying_and_tingling_lips',
  'slurred_speech', 'knee_pain', 'hip_joint_pain', 'muscle_weakness', 'stiff_neck',
  'swelling_joints', 'movement_stiffness', 'spinning_movements', 'loss_of_balance',
  'unsteadiness', 'weakness_of_one_body_side', 'loss_of_smell', 'bladder_discomfort',
  'foul_smell_of_urine', 'continuous_feel_of_urine', 'passage_of_gases', 'internal_itching',
  'toxic_look_(typhos)', 'depression', 'irritability', 'muscle_pain', 'altered_sensorium',
  'red_spots_over_body', 'belly_pain', 'abnormal_menstruation', 'dischromic_patches',
  'watering_from_eyes', 'increased_appetite', 'polyuria', 'family_history', 'mucoid_sputum',
  'rusty_sputum', 'lack_of_concentration', 'visual_disturbances', 'receiving_blood_transfusion',
  'receiving_unsterile_injections', 'coma', 'stomach_bleeding', 'distention_of_abdomen',
  'history_of_alcohol_consumption', 'blood_in_sputum', 'prominent_veins_on_calf',
  'palpitations', 'painful_walking', 'pus_filled_blisters', 'blackheads', 'scurring',
  'skin_peeling', 'silver_like_dusting', 'small_dents_in_nails', 'inflammatory_nails',
  'blister', 'red_sore_around_nose', 'yellow_crust_ooze'
];

export default function SymptomCheckerPage() {
  const { user } = useAuth();
  const router = useRouter();

  // Free-text NLP intake states
  const [freeText, setFreeText] = useState('');
  const [nlpExtracting, setNlpExtracting] = useState(false);
  const [nlpMeta, setNlpMeta] = useState<any>(null);
  const [nlpMessage, setNlpMessage] = useState('');

  // Symptom selection & evaluation states
  const [selectedSymptoms, setSelectedSymptoms] = useState<string[]>([]);
  const [showManualPicker, setShowManualPicker] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [prediction, setPrediction] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const filteredSymptoms = ALL_SYMPTOMS.filter(s =>
    s.toLowerCase().replace(/_/g, ' ').includes(searchTerm.toLowerCase())
  );

  const toggleSymptom = (sym: string) => {
    const clean = sym.toLowerCase().replace(/\s+/g, '_');
    if (selectedSymptoms.includes(clean)) {
      setSelectedSymptoms(selectedSymptoms.filter(s => s !== clean));
    } else {
      setSelectedSymptoms([...selectedSymptoms, clean]);
    }
  };

  // Step 1: Run LLM NLP Symptom Extraction
  const handleExtractNLP = async () => {
    if (!freeText.trim()) {
      setNlpMessage('Please describe what you are feeling in your own words.');
      return;
    }
    setNlpExtracting(true);
    setNlpMessage('');
    setNlpMeta(null);

    try {
      const res = await fetchApi<any>('/symptom-nlp/extract', {
        method: 'POST',
        body: JSON.stringify({ free_text: freeText }),
      });

      setNlpMeta(res);

      if (res.matched_symptoms && res.matched_symptoms.length > 0) {
        // Map extracted symptom labels to canonical underscores
        const mapped = res.matched_symptoms.map((s: string) => s.toLowerCase().replace(/\s+/g, '_'));
        setSelectedSymptoms(Array.from(new Set([...selectedSymptoms, ...mapped])));
        setNlpMessage(`We detected: ${res.matched_symptoms.join(', ')} from your description.`);
      } else {
        setNlpMessage(
          "We couldn't match your description to a tracked symptom. You can pick symptoms manually below, or this may describe something outside our current 41-condition model — please consult a doctor for anything persistent or severe."
        );
        setShowManualPicker(true);
      }
    } catch (err: any) {
      setNlpMessage('Symptom extraction failed. You can select symptoms manually below.');
      setShowManualPicker(true);
    } finally {
      setNlpExtracting(false);
    }
  };

  // Step 2: Run ML Random Forest Classifier Prediction
  const handleEvaluate = async () => {
    if (selectedSymptoms.length === 0) {
      setError('Please extract or select at least one symptom for AI pattern evaluation.');
      return;
    }
    setError('');
    setLoading(true);
    setPrediction(null);

    try {
      const res = await fetchApi<any>('/predictions/check', {
        method: 'POST',
        body: JSON.stringify({ symptoms: selectedSymptoms }),
      });
      setPrediction(res);
    } catch (err: any) {
      setError(err.message || 'Evaluation failed. Please ensure backend is online.');
    } finally {
      setLoading(false);
    }
  };

  const getRiskColor = (level: string) => {
    switch (level?.toLowerCase()) {
      case 'high': return '#E1483D';
      case 'moderate': return '#F5A623';
      default: return '#0F9B8E';
    }
  };

  const getRiskBadge = (level: string) => {
    switch (level?.toLowerCase()) {
      case 'high':
        return <span className="bg-rose-500/10 text-dangerRed border border-rose-500/30 px-2.5 py-0.5 rounded-full text-xs font-mono uppercase font-semibold">High Risk</span>;
      case 'moderate':
        return <span className="bg-amber-500/10 text-amberWarn border border-amber-500/30 px-2.5 py-0.5 rounded-full text-xs font-mono uppercase font-semibold">Moderate Risk</span>;
      default:
        return <span className="bg-teal-500/10 text-tealPrimary border border-teal-500/30 px-2.5 py-0.5 rounded-full text-xs font-mono uppercase font-semibold">Low Risk</span>;
    }
  };

  return (
    <ProtectedRoute allowedRoles={['patient']}>
    <div className="space-y-8 py-2 animate-card-rise">
      {/* HEADER */}
      <div className="space-y-2">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-tealPrimary/10 border border-tealPrimary/20 text-tealPrimary text-xs font-semibold font-mono tracking-tight">
          <Sparkles className="w-3.5 h-3.5" />
          <span>FREE-TEXT NLP INTAKE + 41-DISEASE ML CLASSIFIER</span>
        </div>
        <h1 className="text-3xl font-heading font-extrabold text-ink dark:text-white">Clinical Symptom Evaluator</h1>
        <p className="text-sm text-inkMuted max-w-2xl">
          Describe what you are feeling in plain sentences below. Our AI extracts clinical symptoms, maps them to canonical terms, and evaluates them with a Random Forest model.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* LEFT COLUMN: FREE-TEXT NLP INTAKE & SYMPTOM CONFIRMATION */}
        <div className="lg:col-span-5 clinical-card p-6 space-y-6">
          <h2 className="font-heading font-bold text-lg text-ink dark:text-white flex items-center gap-2">
            <MessageSquareText className="w-5 h-5 text-tealPrimary" />
            <span>Describe Your Symptoms</span>
          </h2>

          {/* Textarea Input */}
          <div className="space-y-2">
            <label className="block text-xs font-mono font-semibold text-inkMuted uppercase">
              Free-Text Description
            </label>
            <textarea
              rows={4}
              value={freeText}
              onChange={(e) => setFreeText(e.target.value)}
              placeholder="e.g., I've had a sharp pain in my lower right abdomen since this morning and I feel nauseous..."
              className="w-full p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-ink dark:text-white focus:outline-none focus:border-tealPrimary leading-relaxed"
            />
            <button
              onClick={handleExtractNLP}
              disabled={nlpExtracting || !freeText.trim()}
              className="w-full btn-outline py-2.5 flex items-center justify-center gap-2 text-xs font-semibold disabled:opacity-50"
            >
              <Sparkles className="w-4 h-4 text-tealPrimary" />
              <span>{nlpExtracting ? 'Extracting Symptoms with AI...' : 'Extract Symptoms from Text'}</span>
            </button>
          </div>

          {/* NLP Message / Extraction Status */}
          {nlpMessage && (
            <div className={`p-3 rounded-xl text-xs leading-relaxed ${
              nlpMessage.includes('We detected')
                ? 'bg-teal-500/10 border border-teal-500/30 text-tealPrimary dark:text-teal-400 font-medium'
                : 'bg-amber-500/10 border border-amber-500/30 text-amber-800 dark:text-amber-300'
            }`}>
              {nlpMessage}
            </div>
          )}

          {/* Extracted Clinical Metadata Context */}
          {nlpMeta && (nlpMeta.duration !== 'unspecified' || nlpMeta.severity !== 'unspecified' || nlpMeta.location !== 'unspecified') && (
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs space-y-1 font-mono">
              <span className="text-tealPrimary font-bold block mb-1">Clinical Context Extracted:</span>
              {nlpMeta.duration !== 'unspecified' && <p>Duration: <span className="text-ink dark:text-white">{nlpMeta.duration}</span></p>}
              {nlpMeta.severity !== 'unspecified' && <p>Severity: <span className="text-ink dark:text-white">{nlpMeta.severity}</span></p>}
              {nlpMeta.location !== 'unspecified' && <p>Location: <span className="text-ink dark:text-white">{nlpMeta.location}</span></p>}
            </div>
          )}

          {/* CONFIRMED SYMPTOMS CHIPS STEP */}
          <div className="space-y-2 pt-2 border-t border-slate-200 dark:border-slate-800">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono font-bold text-ink dark:text-white uppercase flex items-center gap-1.5">
                <span>Confirmed Symptoms for Evaluation</span>
                <span className="px-2 py-0.5 rounded-full bg-tealPrimary text-white text-[10px] font-bold">
                  {selectedSymptoms.length}
                </span>
              </span>
              {selectedSymptoms.length > 0 && (
                <button
                  onClick={() => setSelectedSymptoms([])}
                  className="text-xs text-inkMuted hover:text-dangerRed flex items-center gap-1 transition-colors"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>Reset</span>
                </button>
              )}
            </div>

            <div className="min-h-[50px] p-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex flex-wrap gap-1.5">
              {selectedSymptoms.length === 0 ? (
                <span className="text-xs text-inkMuted italic">No symptoms selected yet. Describe feelings above or select manually below.</span>
              ) : (
                selectedSymptoms.map(sym => (
                  <span
                    key={sym}
                    onClick={() => toggleSymptom(sym)}
                    className="px-2.5 py-1 rounded-lg bg-tealPrimary text-white text-xs font-medium cursor-pointer hover:bg-tealDeep transition-colors flex items-center gap-1"
                  >
                    <span>{sym.replace(/_/g, ' ')}</span>
                    <span className="text-[10px] font-bold">×</span>
                  </span>
                ))
              )}
            </div>
          </div>

          {/* TOGGLE SECONDARY MANUAL CHECKLIST */}
          <div className="pt-2">
            <button
              onClick={() => setShowManualPicker(!showManualPicker)}
              className="text-xs font-mono font-semibold text-tealPrimary hover:underline flex items-center gap-1"
            >
              <span>{showManualPicker ? 'Hide manual symptom checklist' : 'Or select symptoms manually'}</span>
              {showManualPicker ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </button>

            {showManualPicker && (
              <div className="mt-3 space-y-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                <div className="relative">
                  <Search className="w-4 h-4 text-inkMuted absolute left-3 top-2.5" />
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Search 132 medical symptoms..."
                    className="w-full pl-9 pr-4 py-2 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-ink dark:text-white focus:outline-none focus:border-tealPrimary"
                  />
                </div>

                <div className="h-48 overflow-y-auto pr-1 space-y-1 divide-y divide-slate-100 dark:divide-slate-800/50">
                  {filteredSymptoms.map(sym => {
                    const clean = sym.toLowerCase().replace(/\s+/g, '_');
                    const isSelected = selectedSymptoms.includes(clean);
                    return (
                      <div
                        key={sym}
                        onClick={() => toggleSymptom(sym)}
                        className={`py-1.5 px-2.5 rounded-lg text-xs font-medium cursor-pointer transition-colors flex items-center justify-between capitalize ${
                          isSelected
                            ? 'bg-mistTeal dark:bg-slate-800 text-tealPrimary font-semibold'
                            : 'hover:bg-slate-100 dark:hover:bg-slate-800/40 text-inkMuted'
                        }`}
                      >
                        <span>{sym.replace(/_/g, ' ')}</span>
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => {}}
                          className="accent-tealPrimary rounded w-3.5 h-3.5"
                        />
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {error && (
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-dangerRed text-xs font-medium">
              {error}
            </div>
          )}

          {/* FINAL SUBMIT BUTTON */}
          <button
            onClick={handleEvaluate}
            disabled={loading || selectedSymptoms.length === 0}
            className="w-full btn-teal py-3 flex items-center justify-center gap-2 text-sm shadow-md disabled:opacity-50"
          >
            <Activity className="w-4 h-4" />
            <span>{loading ? 'Evaluating Classifier...' : `Confirm & Evaluate ${selectedSymptoms.length} Symptoms`}</span>
          </button>
        </div>

        {/* RIGHT COLUMN: PREDICTION & LLM REASONING RESULTS */}
        <div className="lg:col-span-7 space-y-6">
          {loading && (
            <div className="clinical-card p-12 text-center space-y-6 animate-card-rise">
              <div className="space-y-2">
                <h3 className="font-heading font-bold text-lg text-ink dark:text-white">Analyzing Symptom Pattern</h3>
                <p className="text-xs text-inkMuted font-mono">Running Random Forest Classifier & Synthesizing LLM Narrative...</p>
              </div>
              <ECGPulseLine variant="loader" color="teal" />
            </div>
          )}

          {!loading && !prediction && (
            <div className="clinical-card p-12 text-center space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-mistTeal text-tealPrimary flex items-center justify-center mx-auto">
                <Activity className="w-6 h-6" />
              </div>
              <h3 className="font-heading font-bold text-lg text-ink dark:text-white">Ready for AI Evaluation</h3>
              <p className="text-xs text-inkMuted max-w-md mx-auto leading-relaxed">
                Describe your symptoms in plain language on the left. Once symptoms are detected and confirmed, click "Confirm & Evaluate" to view statistical disease matches and clinical guidance.
              </p>
            </div>
          )}

          {!loading && prediction && (
            <div className="clinical-card p-6 md:p-8 space-y-6 animate-card-rise border-tealPrimary/30">
              {/* HEADER: DISEASE & CONFIDENCE RING */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 border-b border-slate-200 dark:border-slate-800">
                <div>
                  <div className="font-mono text-[11px] uppercase tracking-wider text-inkMuted font-semibold">STATISTICAL PATTERN MATCH</div>
                  <h2 className="text-2xl font-heading font-extrabold text-ink dark:text-white mt-1">
                    {prediction.predicted_disease}
                  </h2>
                </div>

                <div className="flex items-center gap-4">
                  <div className="relative w-16 h-16 flex items-center justify-center">
                    <svg className="w-16 h-16 risk-ring">
                      <circle cx="32" cy="32" r="26" stroke="#E2E8F0" strokeWidth="4" fill="transparent" />
                      <circle
                        cx="32"
                        cy="32"
                        r="26"
                        stroke={getRiskColor(prediction.risk_level)}
                        strokeWidth="4"
                        fill="transparent"
                        strokeDasharray={163}
                        strokeDashoffset={163 - (163 * ((prediction.confidence_score ? prediction.confidence_score * 100 : 50))) / 100}
                        strokeLinecap="round"
                      />
                    </svg>
                    <span className="absolute font-mono text-xs font-bold text-ink dark:text-white">
                      {prediction.confidence_percentage || `${(prediction.confidence_score * 100).toFixed(0)}%`}
                    </span>
                  </div>
                  <div>
                    {getRiskBadge(prediction.risk_level)}
                    <div className="text-[11px] font-mono text-inkMuted mt-1">
                      Score: <span className="text-tealPrimary font-semibold">{prediction.confidence_percentage || `${(prediction.confidence_score * 100).toFixed(1)}%`}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* MANDATORY EDUCATIONAL BANNER */}
              <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-900 dark:text-amber-200 text-xs flex items-start gap-3">
                <AlertTriangle className="w-4 h-4 text-amberWarn shrink-0 mt-0.5" />
                <div className="leading-relaxed">
                  <strong className="font-semibold block mb-0.5">Educational Statistical Match Only:</strong>
                  This pattern match ({prediction.confidence_percentage || `${(prediction.confidence_score * 100).toFixed(1)}%`}) is associated with <strong>{prediction.predicted_disease}</strong>. This is an educational reference, not a confirmed diagnosis.
                </div>
              </div>

              {/* RECOMMENDED SPECIALIST & APPOINTMENT BOOKING */}
              <div className="p-4 rounded-xl bg-mistTeal dark:bg-slate-900 border border-tealPrimary/20 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-tealPrimary text-white flex items-center justify-center">
                    <Stethoscope className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-[11px] uppercase font-mono text-inkMuted">Recommended Specialist</div>
                    <div className="font-heading font-bold text-sm text-ink dark:text-white">
                      {prediction.recommended_specialist}
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => router.push(`/patient/appointments?specialist=${encodeURIComponent(prediction.recommended_specialist)}`)}
                  className="btn-teal text-xs py-2 px-4 shadow-sm"
                >
                  Book Specialist Consultation
                </button>
              </div>

              {/* AI CLINICAL EXPLANATION PANEL */}
              <div className="space-y-3 pt-2">
                <h4 className="font-heading font-bold text-sm text-ink dark:text-white flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-tealPrimary" />
                  <span>AI Clinical Explanation</span>
                </h4>
                <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs text-ink dark:text-slate-200 leading-relaxed space-y-2 whitespace-pre-line">
                  {prediction.llm_explanation || prediction.explanation}
                </div>
              </div>

              {/* COMMONLY ASSOCIATED MEDICATION CLASSES -> MEDICINE HUB REVERSE LOOKUP */}
              <div className="p-4 rounded-xl bg-blue-500/10 border border-blue-500/30 space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="font-heading font-bold text-xs text-blue-700 dark:text-blue-300 flex items-center gap-2">
                    <Pill className="w-4 h-4 text-blue-500" />
                    <span>Commonly Associated Medication Classes</span>
                  </h4>
                  <span className="text-[10px] font-mono text-blue-600 dark:text-blue-400">FDA / RxNorm Reference</span>
                </div>
                <p className="text-xs text-inkMuted leading-relaxed">
                  Explore standard FDA drug classes commonly referenced for {prediction.predicted_disease}. Informational only — not a prescription.
                </p>
                <button
                  onClick={() => router.push(`/medicine-hub?condition=${encodeURIComponent(prediction.predicted_disease)}`)}
                  className="btn-outline text-xs py-2 px-3 border-blue-500/40 text-blue-600 dark:text-blue-300 hover:bg-blue-500/10 flex items-center gap-1.5"
                >
                  <span>Explore Associated Medicines in Medicine Hub</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* PRECAUTIONS & MEDICATION REFERENCE GRID */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                <div className="p-4 rounded-xl bg-white dark:bg-darkSurface border border-slate-200 dark:border-slate-800 space-y-2">
                  <h5 className="font-heading font-semibold text-xs text-ink dark:text-white flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-tealPrimary" />
                    <span>Recommended Precautions</span>
                  </h5>
                  <ul className="text-xs text-inkMuted space-y-1 list-disc list-inside">
                    {prediction.precautions?.map((p: string, idx: number) => (
                      <li key={idx} className="capitalize">{p}</li>
                    ))}
                  </ul>
                </div>

                <div className="p-4 rounded-xl bg-white dark:bg-darkSurface border border-slate-200 dark:border-slate-800 space-y-2">
                  <h5 className="font-heading font-semibold text-xs text-ink dark:text-white flex items-center gap-1.5">
                    <Info className="w-3.5 h-3.5 text-amberWarn" />
                    <span>Medication Reference</span>
                  </h5>
                  <p className="text-[10px] text-inkMuted italic mb-1">Educational reference only, not a prescription</p>
                  <ul className="text-xs text-inkMuted space-y-1 list-disc list-inside font-mono">
                    {(prediction.medications_educational || prediction.medications)?.map((m: string, idx: number) => (
                      <li key={idx}>{m}</li>
                    ))}
                  </ul>
                </div>
              </div>

            </div>
          )}
        </div>
      </div>
    </div>
    </ProtectedRoute>
  );
}
