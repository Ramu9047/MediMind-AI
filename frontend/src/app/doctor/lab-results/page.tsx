'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { fetchApi } from '@/lib/api';
import ProtectedRoute from '@/components/ProtectedRoute';
import FormattedMarkdown from '@/components/FormattedMarkdown';
import { FlaskConical, FileText, CheckCircle2, AlertTriangle, User } from 'lucide-react';

export default function DoctorLabResultsPage() {
  const { user } = useAuth();
  const [labTests, setLabTests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterPatient, setFilterPatient] = useState<string>('ALL');

  useEffect(() => {
    fetchApi('/labs/my')
      .then((data) => setLabTests(data || []))
      .catch(() => setLabTests([]))
      .finally(() => setLoading(false));
  }, []);

  // Unique patient list from lab tests
  const uniquePatients = Array.from(
    new Set(labTests.map((lab) => lab.patient_name).filter(Boolean))
  );

  const filteredTests = filterPatient === 'ALL'
    ? labTests
    : labTests.filter((lab) => lab.patient_name === filterPatient);

  return (
    <ProtectedRoute allowedRoles={['doctor', 'admin']}>
      <div className="space-y-8 max-w-6xl mx-auto py-4 animate-card-rise">
        {/* Banner & Patient Filter */}
        <div className="p-6 rounded-3xl bg-gradient-to-r from-mistTeal via-white to-bgLight dark:from-darkSurface dark:to-darkBg border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <span className="text-xs font-mono font-semibold text-purple-600 dark:text-purple-400 uppercase tracking-wider">
              Physician Diagnostic Portal
            </span>
            <h1 className="text-2xl sm:text-3xl font-heading font-extrabold text-ink dark:text-white">
              Assigned Patient Diagnostic Lab Reports
            </h1>
            <p className="text-xs text-inkMuted mt-1">
              Inspect diagnostic test results, AI plain-language summaries, and flagged abnormal biomarkers across assigned patients.
            </p>
          </div>

          {/* Filter by Patient */}
          <div className="w-full md:w-64 shrink-0">
            <label className="block text-[10px] font-mono font-semibold uppercase text-inkMuted mb-1 flex items-center gap-1">
              <User className="w-3.5 h-3.5 text-purple-600" /> Filter by Patient
            </label>
            <select
              value={filterPatient}
              onChange={(e) => setFilterPatient(e.target.value)}
              className="w-full p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs font-medium text-ink dark:text-white focus:outline-none focus:border-purple-500 shadow-xs"
            >
              <option value="ALL">All Assigned Patients ({labTests.length})</option>
              {uniquePatients.map((name) => (
                <option key={name} value={name}>
                  {name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Diagnostic Lab Reports Feed */}
        {loading ? (
          <div className="clinical-card p-12 text-center text-xs text-inkMuted flex flex-col items-center justify-center space-y-2">
            <FlaskConical className="w-6 h-6 text-purple-600 animate-spin" />
            <span>Retrieving diagnostic lab reports...</span>
          </div>
        ) : filteredTests.length > 0 ? (
          <div className="space-y-4">
            {filteredTests.map((lab) => (
              <div key={lab.id} className="clinical-card p-6 space-y-4">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-base font-heading font-bold text-ink dark:text-white">{lab.test_name}</h3>
                      <span className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-[11px] font-mono font-bold text-tealPrimary border border-slate-200 dark:border-slate-700">
                        Patient: {lab.patient_name}
                      </span>
                    </div>
                    <p className="text-xs text-inkMuted font-mono mt-0.5">Order ID: {lab.id}</p>
                  </div>

                  <span className="px-3 py-1 rounded-full bg-purple-500/10 text-purple-600 dark:text-purple-400 text-xs font-mono font-semibold border border-purple-500/30">
                    {lab.status}
                  </span>
                </div>

                {lab.notes && (
                  <p className="text-xs text-ink dark:text-slate-200 italic bg-slate-50 dark:bg-slate-900/60 p-3 rounded-xl border border-slate-200 dark:border-slate-800">
                    <strong>Clinical Notes / Instructions:</strong> {lab.notes}
                  </p>
                )}

                {/* Report File & AI Summaries */}
                {lab.ai_summary ? (
                  <div className="space-y-3 pt-2">
                    <div className="p-4 rounded-2xl bg-teal-500/5 border border-teal-500/20 text-xs space-y-1.5">
                      <span className="font-bold text-tealPrimary dark:text-teal-400 flex items-center gap-1.5">
                        <CheckCircle2 className="w-4 h-4" /> AI Plain-Language Report Executive Summary:
                      </span>
                      <FormattedMarkdown content={lab.ai_summary} />
                    </div>

                    {lab.abnormal_flags && lab.abnormal_flags.length > 0 && (
                      <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-xs text-amber-800 dark:text-amber-300 space-y-1.5">
                        <span className="font-bold text-amberWarn flex items-center gap-1.5">
                          <AlertTriangle className="w-4 h-4" /> Flagged Biomarkers & Abnormal Value Indicators:
                        </span>
                        <ul className="list-disc list-inside space-y-1 pl-1">
                          {lab.abnormal_flags.map((flag: string, idx: number) => (
                            <li key={idx} className="font-mono">{flag}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900 text-xs text-inkMuted italic">
                    Awaiting laboratory analysis / report upload from laboratory technician. Current Status: <strong>{lab.status}</strong>
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="clinical-card p-12 text-center text-xs text-inkMuted">
            No diagnostic lab test reports found for the selected filter.
          </div>
        )}
      </div>
    </ProtectedRoute>
  );
}
