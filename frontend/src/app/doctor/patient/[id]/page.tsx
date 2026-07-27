'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { fetchApi } from '@/lib/api';
import { Activity, FlaskConical } from 'lucide-react';

export default function DoctorPatientRecordPage() {
  const params = useParams();
  const patientId = params.id as string;

  const [record, setRecord] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (patientId) {
      fetchApi(`/patient/${patientId}/record`)
        .then((data) => setRecord(data))
        .catch(() => {})
        .finally(() => setLoading(false));
    }
  }, [patientId]);

  if (loading) {
    return <div className="text-center py-12 text-xs text-inkMuted">Loading comprehensive patient record...</div>;
  }

  if (!record) {
    return <div className="text-center py-12 text-xs text-inkMuted">Patient record not found.</div>;
  }

  const { patient_info, timeline, predictions, lab_tests } = record;

  return (
    <div className="space-y-8 max-w-5xl mx-auto py-4 animate-card-rise">
      
      {/* Patient Demographics & Vitals Header */}
      <div className="p-6 rounded-3xl bg-gradient-to-r from-mistTeal via-white to-bgLight dark:from-darkSurface dark:to-darkBg border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-teal-500/20 border border-teal-500/30 text-tealPrimary font-heading flex items-center justify-center text-xl font-bold">
              {patient_info.name.charAt(0)}
            </div>
            <div>
              <h1 className="text-2xl font-heading font-extrabold text-ink dark:text-white">{patient_info.name}</h1>
              <p className="text-xs text-inkMuted">
                Email: {patient_info.email} | Age: {patient_info.age} | Gender: {patient_info.gender} | Blood Type: {patient_info.blood_type}
              </p>
            </div>
          </div>
        </div>

        {/* Vitals Summary Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
          <div className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs">
            <span className="block text-[10px] uppercase text-inkMuted font-mono font-semibold">Blood Pressure</span>
            <span className="font-mono font-bold text-ink dark:text-white">{patient_info.vitals.blood_pressure_sys}/{patient_info.vitals.blood_pressure_dia} mmHg</span>
          </div>
          <div className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs">
            <span className="block text-[10px] uppercase text-inkMuted font-mono font-semibold">Heart Rate</span>
            <span className="font-mono font-bold text-ink dark:text-white">{patient_info.vitals.heart_rate} bpm</span>
          </div>
          <div className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs">
            <span className="block text-[10px] uppercase text-inkMuted font-mono font-semibold">Glucose</span>
            <span className="font-mono font-bold text-ink dark:text-white">{patient_info.vitals.glucose_mg_dl} mg/dL</span>
          </div>
          <div className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs">
            <span className="block text-[10px] uppercase text-inkMuted font-mono font-semibold">BMI Index</span>
            <span className="font-mono font-bold text-ink dark:text-white">{patient_info.vitals.bmi} kg/m²</span>
          </div>
        </div>
      </div>

      {/* AI Predictions History & LLM Explanations */}
      <div className="space-y-4">
        <h3 className="text-base font-heading font-bold text-ink dark:text-white flex items-center gap-2">
          <Activity className="w-5 h-5 text-tealPrimary" />
          <span>AI-Assisted Symptom Evaluations ({predictions.length})</span>
        </h3>

        <div className="space-y-4">
          {predictions.map((pred: any) => (
            <div key={pred._id || pred.id} className="clinical-card p-5 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-heading font-bold text-ink dark:text-white">{pred.predicted_disease}</h4>
                  <p className="text-xs text-inkMuted">Symptoms: {pred.symptoms?.join(', ')}</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`badge-risk-${pred.risk_level?.toLowerCase()}`}>
                    Risk: {pred.risk_level}
                  </span>
                  <span className="bg-teal-500/10 text-tealPrimary dark:text-teal-400 text-xs font-mono font-semibold px-2 py-0.5 rounded-full border border-teal-500/30">
                    Match: {pred.confidence_percentage}
                  </span>
                </div>
              </div>

              {pred.llm_explanation && (
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs text-inkMuted space-y-1">
                  <span className="font-bold text-tealPrimary font-mono">AI Clinical Narrative:</span>
                  <p className="whitespace-pre-line leading-relaxed text-ink dark:text-slate-300">{pred.llm_explanation}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Lab Tests & Diagnostic Summaries */}
      <div className="space-y-4">
        <h3 className="text-base font-heading font-bold text-ink dark:text-white flex items-center gap-2">
          <FlaskConical className="w-5 h-5 text-purple-600 dark:text-purple-400" />
          <span>Diagnostic Reports & AI Lab Summaries</span>
        </h3>

        <div className="space-y-3">
          {lab_tests.map((lab: any) => (
            <div key={lab._id || lab.id} className="clinical-card p-5 space-y-2">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-heading font-bold text-ink dark:text-white">{lab.test_name}</h4>
                <span className="px-2.5 py-0.5 rounded-full bg-purple-500/10 text-purple-600 dark:text-purple-400 text-xs font-mono font-semibold border border-purple-500/30">
                  {lab.status}
                </span>
              </div>
              {lab.ai_summary && (
                <p className="text-xs text-inkMuted">
                  <strong>AI Summary:</strong> {lab.ai_summary}
                </p>
              )}
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}
