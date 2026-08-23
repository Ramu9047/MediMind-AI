'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { fetchApi } from '@/lib/api';
import { Pill, ShieldAlert, CheckCircle2, AlertTriangle, ArrowLeft, Info, FileText } from 'lucide-react';
import ProtectedRoute from '@/components/ProtectedRoute';

export default function MedicineDetailPage() {
  const params = useParams();
  const router = useRouter();
  const rxcui = params.rxcui as string;

  const [detail, setDetail] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!rxcui) return;
    setLoading(true);
    fetchApi(`/medicines/${rxcui}`)
      .then((data) => setDetail(data))
      .catch((err) => setError(err.message || 'Failed to fetch drug details'))
      .finally(() => setLoading(false));
  }, [rxcui]);

  return (
    <ProtectedRoute allowedRoles={['patient', 'doctor', 'admin']}>
      <div className="max-w-4xl mx-auto py-6 space-y-6 animate-card-rise">
        {/* Back Button */}
        <button
          onClick={() => router.back()}
          className="inline-flex items-center gap-1.5 text-xs font-mono font-semibold text-inkMuted hover:text-tealPrimary transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Medicine Hub Search</span>
        </button>

        {loading ? (
          <div className="clinical-card p-12 text-center text-xs text-inkMuted">
            Fetching RxNorm & openFDA drug label details for RxCUI {rxcui}...
          </div>
        ) : error ? (
          <div className="clinical-card p-8 text-center text-xs text-rose-600 dark:text-rose-400">
            {error}
          </div>
        ) : detail ? (
          <div className="clinical-card p-6 md:p-8 space-y-6 border-blue-500/20 shadow-lg">
            
            {/* Header Block */}
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 pb-6 border-b border-slate-200 dark:border-slate-800">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs text-blue-500 font-bold uppercase tracking-wider">RxCUI: {detail.rxcui}</span>
                  <span className="text-xs text-inkMuted font-mono">• {detail.drug_class}</span>
                </div>
                <h1 className="text-3xl font-heading font-extrabold text-ink dark:text-white">
                  {detail.generic_name}
                </h1>
                {detail.brand_names && detail.brand_names.length > 0 && (
                  <p className="text-xs text-inkMuted font-medium">
                    Common Brand Names: <span className="text-ink dark:text-slate-200 font-semibold">{detail.brand_names.join(', ')}</span>
                  </p>
                )}
              </div>

              {/* Rx vs OTC Banner */}
              <div>
                {detail.is_prescription_required ? (
                  <div className="px-3 py-1.5 rounded-full bg-rose-500/10 border border-rose-500/30 text-dangerRed text-xs font-mono font-bold flex items-center gap-1.5 shadow-xs">
                    <ShieldAlert className="w-4 h-4" />
                    <span>Prescription Required</span>
                  </div>
                ) : (
                  <div className="px-3 py-1.5 rounded-full bg-teal-500/10 border border-teal-500/30 text-tealPrimary text-xs font-mono font-bold flex items-center gap-1.5 shadow-xs">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Over-The-Counter (OTC)</span>
                  </div>
                )}
              </div>
            </div>

            {/* PRESCRIPTION WARNING BANNER */}
            {detail.is_prescription_required && (
              <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-900 dark:text-amber-200 text-xs flex items-start gap-3">
                <AlertTriangle className="w-4 h-4 text-amberWarn shrink-0 mt-0.5" />
                <div className="leading-relaxed font-medium">
                  <strong>Prescription required:</strong> Do not take or adjust dosages of this medication without a doctor's explicit guidance and prescription.
                </div>
              </div>
            )}

            {/* COMBINATION PRODUCT NOTICE BANNER */}
            {detail.is_combination_product && (
              <div className="p-4 rounded-xl bg-purple-500/10 border border-purple-500/30 text-purple-900 dark:text-purple-200 text-xs flex items-start gap-3">
                <Info className="w-4 h-4 text-purple-600 dark:text-purple-400 shrink-0 mt-0.5" />
                <div className="leading-relaxed font-medium">
                  <strong>Combination Formulation Notice:</strong> This openFDA drug label reference is for a combination medication ({detail.generic_name}). Dosing, side effects, and contraindications reflect the combination formulation.
                </div>
              </div>
            )}


            {/* DOSAGE & ADMINISTRATION SECTION */}
            <div className="p-5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-2">
              <h3 className="font-heading font-bold text-sm text-ink dark:text-white flex items-center gap-2">
                <FileText className="w-4 h-4 text-blue-500" />
                <span>Standard Labeled Dosage & Administration</span>
              </h3>
              <p className="text-[11px] font-mono font-semibold text-amberWarn">
                Standard labeled dosage — not a personalized prescription.
              </p>
              <p className="text-xs text-ink dark:text-slate-300 leading-relaxed whitespace-pre-line">
                {detail.dosage_and_administration}
              </p>
            </div>

            {/* INDICATIONS & USAGE */}
            <div className="space-y-2">
              <h3 className="font-heading font-bold text-sm text-ink dark:text-white flex items-center gap-2">
                <Info className="w-4 h-4 text-tealPrimary" />
                <span>Indications & Usage</span>
              </h3>
              <p className="text-xs text-inkMuted leading-relaxed whitespace-pre-line">
                {detail.indications}
              </p>
            </div>

            {/* SIDE EFFECTS & CONTRAINDICATIONS GRID */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              
              {/* Side Effects */}
              <div className="p-4 rounded-xl bg-white dark:bg-darkSurface border border-slate-200 dark:border-slate-800 space-y-2">
                <h4 className="font-heading font-bold text-xs text-ink dark:text-white">Common Side Effects</h4>
                <ul className="text-xs text-inkMuted space-y-1 list-disc list-inside">
                  {detail.common_side_effects?.map((se: string, idx: number) => (
                    <li key={idx}>{se}</li>
                  ))}
                </ul>
              </div>

              {/* Contraindications */}
              <div className="p-4 rounded-xl bg-white dark:bg-darkSurface border border-slate-200 dark:border-slate-800 space-y-2">
                <h4 className="font-heading font-bold text-xs text-ink dark:text-white">Contraindications & Warnings</h4>
                <ul className="text-xs text-inkMuted space-y-1 list-disc list-inside">
                  {detail.contraindications?.map((ci: string, idx: number) => (
                    <li key={idx}>{ci}</li>
                  ))}
                </ul>
              </div>

            </div>

            {/* STORAGE & CITATION */}
            <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between text-[11px] text-inkMuted font-mono gap-2">
              <span>Storage: {detail.storage_notes}</span>
              <span className="text-tealPrimary font-semibold">Source: {detail.source_citation}</span>
            </div>

          </div>
        ) : null}
      </div>
    </ProtectedRoute>
  );
}
