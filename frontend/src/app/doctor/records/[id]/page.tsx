'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { fetchApi } from '@/lib/api';
import { Activity, FlaskConical, ArrowLeft, User, FileText, CheckCircle2 } from 'lucide-react';
import ProtectedRoute from '@/components/ProtectedRoute';
import FormattedMarkdown from '@/components/FormattedMarkdown';

export default function DoctorPatientRecordPage() {
  const params = useParams();
  const router = useRouter();
  const patientId = params.id as string;

  const [record, setRecord] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string>('');

  useEffect(() => {
    if (patientId) {
      setLoading(true);
      fetchApi(`/patient/${patientId}/record`)
        .then((data) => {
          setRecord(data);
          setErrorMsg('');
        })
        .catch((err) => {
          console.error("Error loading patient record:", err);
          setErrorMsg(err.message || 'Unable to retrieve patient record.');
        })
        .finally(() => setLoading(false));
    }
  }, [patientId]);

  return (
    <ProtectedRoute allowedRoles={['doctor', 'admin']}>
      <div className="space-y-8 max-w-5xl mx-auto py-4 animate-card-rise">
        {/* Back Link Header */}
        <div className="flex items-center justify-between">
          <button
            onClick={() => router.back()}
            className="btn-outline text-xs py-1.5 px-3 flex items-center gap-1.5"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Physician Workspace</span>
          </button>
          <span className="text-xs font-mono text-inkMuted">
            RECORD ID: <span className="text-tealPrimary font-semibold">{patientId}</span>
          </span>
        </div>

        {loading ? (
          <div className="clinical-card p-12 text-center space-y-3">
            <Activity className="w-8 h-8 text-tealPrimary animate-spin mx-auto" />
            <p className="text-xs text-inkMuted">Loading comprehensive clinical record...</p>
          </div>
        ) : errorMsg || !record ? (
          <div className="clinical-card p-8 text-center space-y-4">
            <div className="w-12 h-12 rounded-full bg-amber-500/10 text-amberWarn flex items-center justify-center mx-auto">
              <User className="w-6 h-6" />
            </div>
            <div className="space-y-1 max-w-md mx-auto">
              <h3 className="text-base font-heading font-bold text-ink dark:text-white">
                Patient Medical Record Unavailable
              </h3>
              <p className="text-xs text-inkMuted leading-relaxed">
                {errorMsg || 'No record found or you do not have permission to access this patient profile.'}
              </p>
            </div>
            <div className="flex justify-center gap-3 pt-2">
              <button
                onClick={() => router.push('/doctor/dashboard')}
                className="btn-teal text-xs py-2 px-4"
              >
                Go to Consult Queue
              </button>
              <button
                onClick={() => router.push('/doctor/timeline')}
                className="btn-outline text-xs py-2 px-4"
              >
                View Patient Timeline
              </button>
            </div>
          </div>
        ) : (
          <>
            {/* Patient Demographics & Vitals Header */}
            <div className="p-6 rounded-3xl bg-gradient-to-r from-mistTeal via-white to-bgLight dark:from-darkSurface dark:to-darkBg border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-2xl bg-teal-500/20 border border-teal-500/30 text-tealPrimary font-heading flex items-center justify-center text-xl font-bold">
                    {record.patient_info?.name?.charAt(0) || 'P'}
                  </div>
                  <div>
                    <h1 className="text-2xl font-heading font-extrabold text-ink dark:text-white">
                      {record.patient_info?.name || 'Patient Record'}
                    </h1>
                    <p className="text-xs text-inkMuted">
                      Email: {record.patient_info?.email || 'N/A'} | Age: {record.patient_info?.age || 30} | Gender: {record.patient_info?.gender || 'Unspecified'} | Blood Type: {record.patient_info?.blood_type || 'O+'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Vitals Summary Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
                <div className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs">
                  <span className="block text-[10px] uppercase text-inkMuted font-mono font-semibold">Blood Pressure</span>
                  <span className="font-mono font-bold text-ink dark:text-white">
                    {record.patient_info?.vitals?.blood_pressure_sys || 120}/{record.patient_info?.vitals?.blood_pressure_dia || 80} mmHg
                  </span>
                </div>
                <div className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs">
                  <span className="block text-[10px] uppercase text-inkMuted font-mono font-semibold">Heart Rate</span>
                  <span className="font-mono font-bold text-ink dark:text-white">
                    {record.patient_info?.vitals?.heart_rate || 72} bpm
                  </span>
                </div>
                <div className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs">
                  <span className="block text-[10px] uppercase text-inkMuted font-mono font-semibold">Glucose</span>
                  <span className="font-mono font-bold text-ink dark:text-white">
                    {record.patient_info?.vitals?.glucose_mg_dl || 95} mg/dL
                  </span>
                </div>
                <div className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs">
                  <span className="block text-[10px] uppercase text-inkMuted font-mono font-semibold">BMI Index</span>
                  <span className="font-mono font-bold text-ink dark:text-white">
                    {record.patient_info?.vitals?.bmi || 22.4} kg/m²
                  </span>
                </div>
              </div>
            </div>

            {/* AI Predictions History & LLM Explanations */}
            <div className="space-y-4">
              <h3 className="text-base font-heading font-bold text-ink dark:text-white flex items-center gap-2">
                <Activity className="w-5 h-5 text-tealPrimary" />
                <span>AI-Assisted Symptom Evaluations ({record.predictions?.length || 0})</span>
              </h3>

              <div className="space-y-4">
                {record.predictions && record.predictions.length > 0 ? (
                  record.predictions.map((pred: any) => (
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
                        <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs space-y-1">
                          <span className="font-bold text-tealPrimary font-mono flex items-center gap-1 mb-1">
                            <FileText className="w-3.5 h-3.5" /> AI Clinical Assessment Note:
                          </span>
                          <FormattedMarkdown content={pred.llm_explanation} />
                        </div>
                      )}
                    </div>
                  ))
                ) : (
                  <div className="clinical-card p-6 text-center text-xs text-inkMuted">
                    No AI symptom evaluations logged for this patient.
                  </div>
                )}
              </div>
            </div>

            {/* Lab Tests & Diagnostic Summaries */}
            <div className="space-y-4">
              <h3 className="text-base font-heading font-bold text-ink dark:text-white flex items-center gap-2">
                <FlaskConical className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                <span>Diagnostic Reports &amp; AI Lab Summaries ({record.lab_tests?.length || 0})</span>
              </h3>

              <div className="space-y-3">
                {record.lab_tests && record.lab_tests.length > 0 ? (
                  record.lab_tests.map((lab: any) => (
                    <div key={lab._id || lab.id} className="clinical-card p-5 space-y-2">
                      <div className="flex items-center justify-between">
                        <h4 className="text-sm font-heading font-bold text-ink dark:text-white">{lab.test_name}</h4>
                        <span className="px-2.5 py-0.5 rounded-full bg-purple-500/10 text-purple-600 dark:text-purple-400 text-xs font-mono font-semibold border border-purple-500/30">
                          {lab.status}
                        </span>
                      </div>
                      {lab.ai_summary && (
                        <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs space-y-1 mt-2">
                          <span className="font-bold text-tealPrimary font-mono flex items-center gap-1 mb-1">
                            <CheckCircle2 className="w-3.5 h-3.5" /> AI Report Summary:
                          </span>
                          <FormattedMarkdown content={lab.ai_summary} />
                        </div>
                      )}
                    </div>
                  ))
                ) : (
                  <div className="clinical-card p-6 text-center text-xs text-inkMuted">
                    No diagnostic lab reports recorded for this patient.
                  </div>
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </ProtectedRoute>
  );
}
