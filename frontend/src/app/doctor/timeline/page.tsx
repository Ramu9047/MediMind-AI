'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { fetchApi } from '@/lib/api';
import ProtectedRoute from '@/components/ProtectedRoute';
import FormattedMarkdown from '@/components/FormattedMarkdown';
import { Activity, Clock, Heart, Droplets, Scale, User, FileText } from 'lucide-react';

export default function DoctorTimelinePage() {
  const { user } = useAuth();
  const [patients, setPatients] = useState<any[]>([]);
  const [selectedPatientId, setSelectedPatientId] = useState<string>('');
  const [patientRecord, setPatientRecord] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Fetch assigned patient roster
  useEffect(() => {
    fetchApi('/patient/all')
      .then((data) => {
        if (data && data.length > 0) {
          setPatients(data);
          setSelectedPatientId(data[0].id);
        } else {
          setLoading(false);
        }
      })
      .catch(() => setLoading(false));
  }, []);

  // Fetch detailed record for selected patient
  useEffect(() => {
    if (selectedPatientId) {
      setLoading(true);
      fetchApi(`/patient/${selectedPatientId}/record`)
        .then((data) => setPatientRecord(data))
        .catch(() => setPatientRecord(null))
        .finally(() => setLoading(false));
    }
  }, [selectedPatientId]);

  return (
    <ProtectedRoute allowedRoles={['doctor', 'admin']}>
      <div className="space-y-8 max-w-6xl mx-auto py-4 animate-card-rise">
        {/* Banner & Patient Selector */}
        <div className="p-6 rounded-3xl bg-gradient-to-r from-mistTeal via-white to-bgLight dark:from-darkSurface dark:to-darkBg border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <span className="text-xs font-mono font-semibold text-tealPrimary uppercase tracking-wider">
              Physician Clinical Portal
            </span>
            <h1 className="text-2xl sm:text-3xl font-heading font-extrabold text-ink dark:text-white">
              Patient Timeline &amp; History Review
            </h1>
            <p className="text-xs text-inkMuted mt-1">
              Select an assigned patient to inspect their comprehensive AI evaluation timeline and vitals history.
            </p>
          </div>

          {/* Patient Selector Dropdown */}
          <div className="w-full md:w-72 shrink-0">
            <label className="block text-[10px] font-mono font-semibold uppercase text-inkMuted mb-1 flex items-center gap-1">
              <User className="w-3.5 h-3.5 text-tealPrimary" /> Select Assigned Patient
            </label>
            <select
              value={selectedPatientId}
              onChange={(e) => setSelectedPatientId(e.target.value)}
              className="w-full p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs font-medium text-ink dark:text-white focus:outline-none focus:border-tealPrimary shadow-xs"
            >
              {patients.length > 0 ? (
                patients.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} (Age: {p.age} | Blood: {p.blood_type})
                  </option>
                ))
              ) : (
                <option value="">No Assigned Patients</option>
              )}
            </select>
          </div>
        </div>

        {loading ? (
          <div className="clinical-card p-12 text-center text-xs text-inkMuted flex flex-col items-center justify-center space-y-2">
            <Activity className="w-6 h-6 text-tealPrimary animate-spin" />
            <span>Loading patient timeline and clinical data...</span>
          </div>
        ) : patientRecord ? (
          <div className="space-y-8">
            {/* Vitals Summary Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="clinical-card p-4 space-y-1">
                <div className="flex items-center justify-between text-xs text-inkMuted font-mono">
                  <span>BLOOD PRESSURE</span>
                  <Activity className="w-4 h-4 text-tealPrimary" />
                </div>
                <div className="text-lg font-mono font-bold text-ink dark:text-white">
                  {patientRecord.patient_info?.vitals?.blood_pressure_sys || 120}/
                  {patientRecord.patient_info?.vitals?.blood_pressure_dia || 80} <span className="text-xs font-normal text-inkMuted">mmHg</span>
                </div>
              </div>

              <div className="clinical-card p-4 space-y-1">
                <div className="flex items-center justify-between text-xs text-inkMuted font-mono">
                  <span>HEART RATE</span>
                  <Heart className="w-4 h-4 text-coralWarm" />
                </div>
                <div className="text-lg font-mono font-bold text-ink dark:text-white">
                  {patientRecord.patient_info?.vitals?.heart_rate || 72} <span className="text-xs font-normal text-inkMuted">bpm</span>
                </div>
              </div>

              <div className="clinical-card p-4 space-y-1">
                <div className="flex items-center justify-between text-xs text-inkMuted font-mono">
                  <span>FASTING GLUCOSE</span>
                  <Droplets className="w-4 h-4 text-tealPrimary" />
                </div>
                <div className="text-lg font-mono font-bold text-ink dark:text-white">
                  {patientRecord.patient_info?.vitals?.glucose_mg_dl || 95} <span className="text-xs font-normal text-inkMuted">mg/dL</span>
                </div>
              </div>

              <div className="clinical-card p-4 space-y-1">
                <div className="flex items-center justify-between text-xs text-inkMuted font-mono">
                  <span>BMI INDEX</span>
                  <Scale className="w-4 h-4 text-purple-500" />
                </div>
                <div className="text-lg font-mono font-bold text-ink dark:text-white">
                  {patientRecord.patient_info?.vitals?.bmi || 22.5} <span className="text-xs font-normal text-inkMuted">kg/m²</span>
                </div>
              </div>
            </div>

            {/* AI Evaluations & Symptom Predictions Timeline */}
            <div className="space-y-4">
              <h3 className="text-base font-heading font-bold text-ink dark:text-white flex items-center gap-2">
                <Activity className="w-5 h-5 text-tealPrimary" />
                <span>AI Symptom Pre-Assessment Timeline ({patientRecord.predictions?.length || 0})</span>
              </h3>

              <div className="space-y-4">
                {patientRecord.predictions && patientRecord.predictions.length > 0 ? (
                  patientRecord.predictions.map((pred: any) => (
                    <div key={pred._id || pred.id} className="clinical-card p-5 space-y-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="text-sm font-heading font-bold text-ink dark:text-white">{pred.predicted_disease}</h4>
                          <p className="text-xs text-inkMuted">Reported Symptoms: {pred.symptoms?.join(', ')}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className={`badge-risk-${pred.risk_level?.toLowerCase()}`}>
                            Risk: {pred.risk_level}
                          </span>
                          <span className="bg-teal-500/10 text-tealPrimary dark:text-teal-400 text-xs font-mono font-semibold px-2 py-0.5 rounded-full border border-teal-500/30">
                            Confidence: {pred.confidence_percentage}
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

            {/* Medical Timeline Feed */}
            <div className="space-y-4">
              <h3 className="text-base font-heading font-bold text-ink dark:text-white flex items-center gap-2">
                <Clock className="w-5 h-5 text-amber-500" />
                <span>Patient Medical Events Feed</span>
              </h3>

              <div className="space-y-3">
                {patientRecord.timeline && patientRecord.timeline.length > 0 ? (
                  patientRecord.timeline.map((event: any) => (
                    <div key={event._id || event.id} className="clinical-card p-4 flex items-start justify-between gap-4">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-heading font-bold text-ink dark:text-white">{event.title}</span>
                          <span className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-[10px] font-mono text-inkMuted border border-slate-200 dark:border-slate-700">
                            {event.event_type}
                          </span>
                        </div>
                        <p className="text-xs text-inkMuted">{event.description}</p>
                      </div>
                      <span className="text-[10px] font-mono text-inkMuted shrink-0">
                        {event.timestamp ? new Date(event.timestamp).toLocaleDateString() : ''}
                      </span>
                    </div>
                  ))
                ) : (
                  <div className="clinical-card p-6 text-center text-xs text-inkMuted">
                    No timeline events recorded.
                  </div>
                )}
              </div>
            </div>
          </div>
        ) : (
          <div className="clinical-card p-12 text-center text-xs text-inkMuted">
            No active patient record selected or patient not found in assigned roster.
          </div>
        )}
      </div>
    </ProtectedRoute>
  );
}
