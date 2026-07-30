'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { fetchApi } from '@/lib/api';
import {
  Activity,
  Sparkles,
  Stethoscope,
  FlaskConical,
  AlertTriangle,
  CheckCircle2,
  Calendar,
  Search,
  RotateCcw,
  Info,
} from 'lucide-react';
import ECGPulseLine from '@/components/ECGPulseLine';

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

  const [selectedSymptoms, setSelectedSymptoms] = useState<string[]>(['stomach_pain', 'acidity']);
  const [searchTerm, setSearchTerm] = useState('');
  const [prediction, setPrediction] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const filteredSymptoms = ALL_SYMPTOMS.filter(s =>
    s.toLowerCase().replace(/_/g, ' ').includes(searchTerm.toLowerCase())
  );

  const toggleSymptom = (sym: string) => {
    if (selectedSymptoms.includes(sym)) {
      setSelectedSymptoms(selectedSymptoms.filter(s => s !== sym));
    } else {
      setSelectedSymptoms([...selectedSymptoms, sym]);
    }
  };

  const handleEvaluate = async () => {
    if (selectedSymptoms.length === 0) {
      setError('Please select at least one symptom for ML pattern analysis.');
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
    <div className="space-y-8 py-2 animate-card-rise">
      {/* HEADER */}
      <div className="space-y-2">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-tealPrimary/10 border border-tealPrimary/20 text-tealPrimary text-xs font-semibold font-mono tracking-tight">
          <Activity className="w-3.5 h-3.5" />
          <span>41-DISEASE ML CLASSIFIER + LLM REASONER</span>
        </div>
        <h1 className="text-3xl font-heading font-extrabold text-ink dark:text-white">Clinical Symptom Evaluator</h1>
        <p className="text-sm text-inkMuted max-w-2xl">
          Select reported symptoms below to run statistical Random Forest classification paired with LLM plain-language clinical reasoning.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* LEFT COLUMN: SYMPTOM SELECTOR */}
        <div className="lg:col-span-5 clinical-card p-6 space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="font-heading font-bold text-lg text-ink dark:text-white flex items-center gap-2">
              <span>Select Symptoms</span>
              <span className="font-mono text-xs px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-tealPrimary font-semibold">
                {selectedSymptoms.length}
              </span>
            </h2>
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

          {/* Selected Chips */}
          <div className="min-h-[50px] p-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 flex flex-wrap gap-1.5">
            {selectedSymptoms.length === 0 ? (
              <span className="text-xs text-inkMuted italic">No symptoms selected. Pick from the list below.</span>
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

          {/* Search Input */}
          <div className="relative">
            <Search className="w-4 h-4 text-inkMuted absolute left-3 top-3" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search 132 medical symptoms..."
              className="w-full pl-9 pr-4 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-sm text-ink dark:text-white focus:outline-none focus:border-tealPrimary"
            />
          </div>

          {/* Scrollable Symptom List */}
          <div className="h-64 overflow-y-auto pr-1 space-y-1 divide-y divide-slate-100 dark:divide-slate-800/50">
            {filteredSymptoms.map(sym => {
              const isSelected = selectedSymptoms.includes(sym);
              return (
                <div
                  key={sym}
                  onClick={() => toggleSymptom(sym)}
                  className={`py-2 px-3 rounded-lg text-xs font-medium cursor-pointer transition-colors flex items-center justify-between capitalize ${
                    isSelected
                      ? 'bg-mistTeal dark:bg-slate-800 text-tealPrimary font-semibold'
                      : 'hover:bg-slate-50 dark:hover:bg-slate-800/40 text-inkMuted'
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

          {error && (
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-dangerRed text-xs font-medium">
              {error}
            </div>
          )}

          <button
            onClick={handleEvaluate}
            disabled={loading}
            className="w-full btn-teal py-3 flex items-center justify-center gap-2 text-sm shadow-md"
          >
            <Sparkles className="w-4 h-4" />
            <span>{loading ? 'Evaluating with AI...' : 'Evaluate Symptoms with AI'}</span>
          </button>
        </div>

        {/* RIGHT COLUMN: PREDICTION & LLM REASONING RESULTS */}
        <div className="lg:col-span-7 space-y-6">
          {/* LOADING STATE WITH SIGNATURE ECG PULSE LINE */}
          {loading && (
            <div className="clinical-card p-12 text-center space-y-6 animate-card-rise">
              <div className="space-y-2">
                <h3 className="font-heading font-bold text-lg text-ink dark:text-white">Analyzing Symptom Pattern</h3>
                <p className="text-xs text-inkMuted font-mono">Running Random Forest Classifier & Synthesizing LLM Explanation...</p>
              </div>

              {/* Signature ECG Pulse Line Loader Motif */}
              <ECGPulseLine variant="loader" color="teal" />
            </div>
          )}

          {/* INITIAL EMPTY STATE */}
          {!loading && !prediction && (
            <div className="clinical-card p-12 text-center space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-mistTeal text-tealPrimary flex items-center justify-center mx-auto">
                <Activity className="w-6 h-6" />
              </div>
              <h3 className="font-heading font-bold text-lg text-ink dark:text-white">Ready for Clinical Evaluation</h3>
              <p className="text-xs text-inkMuted max-w-md mx-auto leading-relaxed">
                Select your observed symptoms on the left and click "Evaluate Symptoms with AI". The platform will analyze pattern similarity against 41 disease profiles.
              </p>
            </div>
          )}

          {/* EVALUATION RESULTS CARD */}
          {!loading && prediction && (
            <div className="clinical-card p-6 md:p-8 space-y-6 animate-card-rise border-tealPrimary/30">
              {/* TOP HEADER: DISEASE & CONFIDENCE RING */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 border-b border-slate-200 dark:border-slate-800">
                <div>
                  <div className="font-mono text-[11px] uppercase tracking-wider text-inkMuted font-semibold">STATISTICAL PATTERN MATCH</div>
                  <h2 className="text-2xl font-heading font-extrabold text-ink dark:text-white mt-1">
                    {prediction.predicted_disease}
                  </h2>
                </div>

                {/* Circular Confidence Ring */}
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
                        strokeDashoffset={163 - (163 * (prediction.confidence || 50)) / 100}
                        strokeLinecap="round"
                      />
                    </svg>
                    <span className="absolute font-mono text-xs font-bold text-ink dark:text-white">
                      {(prediction.confidence || 50).toFixed(0)}%
                    </span>
                  </div>
                  <div>
                    {getRiskBadge(prediction.risk_level)}
                    <div className="text-[11px] font-mono text-inkMuted mt-1">
                      Score: <span className="text-tealPrimary font-semibold">{(prediction.confidence || 50).toFixed(1)}%</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* MANDATORY EDUCATIONAL NON-DIAGNOSIS WARNING BANNER */}
              <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-900 dark:text-amber-200 text-xs flex items-start gap-3">
                <AlertTriangle className="w-4 h-4 text-amberWarn shrink-0 mt-0.5" />
                <div className="leading-relaxed">
                  <strong className="font-semibold block mb-0.5">Educational Statistical Match:</strong>
                  This pattern match ({prediction.confidence?.toFixed(1)}%) is commonly associated with <strong>{prediction.predicted_disease}</strong>. This is an educational reference, not a confirmed diagnosis.
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
                  {prediction.explanation}
                </div>
              </div>

              {/* PRECAUTIONS & MEDICATION REFERENCE GRID */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                {/* Precautions */}
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

                {/* Medication Reference */}
                <div className="p-4 rounded-xl bg-white dark:bg-darkSurface border border-slate-200 dark:border-slate-800 space-y-2">
                  <h5 className="font-heading font-semibold text-xs text-ink dark:text-white flex items-center gap-1.5">
                    <Info className="w-3.5 h-3.5 text-coralWarm" />
                    <span>Medication Reference</span>
                  </h5>
                  <p className="text-[10px] text-inkMuted italic mb-1">Educational reference only, not a prescription</p>
                  <ul className="text-xs text-inkMuted space-y-1 list-disc list-inside font-mono">
                    {prediction.medications?.map((m: string, idx: number) => (
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
  );
}
