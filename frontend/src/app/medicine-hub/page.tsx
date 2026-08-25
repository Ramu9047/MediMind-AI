'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { fetchApi } from '@/lib/api';
import { Pill, Search, Stethoscope, AlertTriangle, ExternalLink, ShieldCheck, ChevronRight, Activity, Info } from 'lucide-react';

import ProtectedRoute from '@/components/ProtectedRoute';

const POPULAR_CONDITIONS = [
  'GERD', 'Hypertension', 'Diabetes', 'Bronchial Asthma', 'Common Cold', 'Pneumonia', 'Migraine', 'Urinary Tract Infection', 'Acne'
];

function MedicineHubSearchContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const initialCondition = searchParams.get('condition') || '';

  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [searching, setSearching] = useState(false);

  const [selectedCondition, setSelectedCondition] = useState(initialCondition);
  const [conditionMeds, setConditionMeds] = useState<any[]>([]);
  const [conditionLoading, setConditionLoading] = useState(false);

  // Interaction Checker Widget state
  const [rxcui1, setRxcui1] = useState('283742'); // Omeprazole
  const [rxcui2, setRxcui2] = useState('5640');   // Ibuprofen
  const [interactionResult, setInteractionResult] = useState<any>(null);
  const [checkingInteractions, setCheckingInteractions] = useState(false);

  // Autocomplete search handler
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }
    const delayDebounce = setTimeout(() => {
      setSearching(true);
      fetchApi(`/medicines/search?q=${encodeURIComponent(searchQuery.trim())}`)
        .then((data) => setSearchResults(data.results || []))
        .catch(() => setSearchResults([]))
        .finally(() => setSearching(false));
    }, 300);

    return () => clearTimeout(delayDebounce);
  }, [searchQuery]);

  // Condition lookup handler
  useEffect(() => {
    if (!selectedCondition) return;
    setConditionLoading(true);
    fetchApi(`/medicines/by-condition?condition=${encodeURIComponent(selectedCondition)}`)
      .then((data) => setConditionMeds(data.associated_medications || []))
      .catch(() => setConditionMeds([]))
      .finally(() => setConditionLoading(false));
  }, [selectedCondition]);

  const handleCheckInteractions = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rxcui1 || !rxcui2) return;
    setCheckingInteractions(true);
    try {
      const res = await fetchApi('/medicines/interactions', {
        method: 'POST',
        body: JSON.stringify({ rxcuis: [rxcui1, rxcui2] }),
      });
      setInteractionResult(res);
    } catch (err: any) {
      setInteractionResult({ error: err.message || 'Interaction check failed' });
    } finally {
      setCheckingInteractions(false);
    }
  };

  return (
    <div className="space-y-8 max-w-5xl mx-auto py-4 animate-card-rise">
      {/* Header */}
      <div className="space-y-2 text-center">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/30 text-blue-600 dark:text-blue-400 text-xs font-mono font-semibold uppercase tracking-wider">
          <Pill className="w-3.5 h-3.5" />
          <span>RxNorm & openFDA Drug Reference Engine</span>
        </div>
        <h1 className="text-3xl font-heading font-extrabold text-ink dark:text-white">Medicine Information Hub</h1>
        <p className="text-sm text-inkMuted max-w-2xl mx-auto">
          Search canonical RxNorm medicines, inspect FDA-labeled dosages and precautions, or check pairwise drug interactions.
        </p>
      </div>

      {/* Main Search Bar */}
      <div className="clinical-card p-6 space-y-4 shadow-lg border-blue-500/20">
        <label className="block text-xs font-mono font-bold text-inkMuted uppercase">Search RxNorm Medicine Database</label>
        <div className="relative">
          <Search className="w-5 h-5 text-inkMuted absolute left-4 top-3.5" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Type generic or brand name (e.g. Omeprazole, Lisinopril, Metformin)..."
            className="w-full pl-12 pr-4 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-sm text-ink dark:text-white focus:outline-none focus:border-blue-500 shadow-sm"
          />
        </div>

        {/* Autocomplete Results Dropdown */}
        {searching ? (
          <div className="p-4 text-xs text-inkMuted italic font-mono">Searching RxNorm catalog...</div>
        ) : searchResults.length > 0 ? (
          <div className="divide-y divide-slate-100 dark:divide-slate-800 max-h-64 overflow-y-auto rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
            {searchResults.map((item) => (
              <div
                key={item.rxcui}
                onClick={() => router.push(`/medicine-hub/${item.rxcui}`)}
                className="p-3 hover:bg-slate-50 dark:hover:bg-slate-800/60 cursor-pointer flex items-center justify-between transition-colors"
              >
                <div>
                  <div className="font-heading font-bold text-xs text-ink dark:text-white">{item.name}</div>
                  <div className="text-[10px] font-mono text-inkMuted">RxCUI: {item.rxcui} {item.is_brand ? '(Brand)' : '(Generic)'}</div>
                </div>
                <ChevronRight className="w-4 h-4 text-blue-500" />
              </div>
            ))}
          </div>
        ) : searchQuery.trim() ? (
          <div className="p-4 text-xs text-inkMuted italic">No direct RxNorm matches found for "{searchQuery}".</div>
        ) : null}
      </div>

      {/* Grid: Condition Reverse Lookup & Interaction Checker */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
        
        {/* Condition Reverse Lookup */}
        <div className="md:col-span-7 clinical-card p-6 space-y-4">
          <h3 className="font-heading font-bold text-base text-ink dark:text-white flex items-center gap-2">
            <Stethoscope className="w-5 h-5 text-tealPrimary" />
            <span>Browse Associated Medications by Condition</span>
          </h3>

          <div className="flex flex-wrap gap-1.5">
            {POPULAR_CONDITIONS.map((cond) => (
              <button
                key={cond}
                onClick={() => setSelectedCondition(cond)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all border ${
                  selectedCondition.toLowerCase() === cond.toLowerCase()
                    ? 'bg-tealPrimary text-white border-tealDeep shadow-xs'
                    : 'bg-slate-100 dark:bg-slate-800 text-inkMuted hover:text-ink dark:hover:text-white border-transparent'
                }`}
              >
                {cond}
              </button>
            ))}
          </div>

          {selectedCondition && (
            <div className="pt-2 space-y-3">
              <div className="text-xs font-mono font-bold text-inkMuted uppercase">
                Associated Drug Classes for <span className="text-tealPrimary">{selectedCondition}</span>:
              </div>

              {conditionLoading ? (
                <div className="text-xs text-inkMuted italic font-mono py-4">Fetching condition classes...</div>
              ) : conditionMeds.length > 0 ? (
                <div className="space-y-2">
                  {conditionMeds.map((med, idx) => (
                    <div
                      key={idx}
                      onClick={() => router.push(`/medicine-hub/${med.rxcui}`)}
                      className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-tealPrimary/50 cursor-pointer flex items-center justify-between transition-colors"
                    >
                      <div>
                        <div className="font-heading font-bold text-xs text-ink dark:text-white">
                          {med.generic_name} <span className="text-inkMuted font-normal">({med.brand})</span>
                        </div>
                        <div className="text-[11px] font-mono text-tealPrimary font-medium mt-0.5">{med.class}</div>
                      </div>
                      <div className="flex items-center gap-1 text-xs font-mono font-semibold text-blue-500">
                        <span>Inspect Label</span>
                        <ChevronRight className="w-4 h-4" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-xs text-inkMuted italic">No associated drug classes mapped for this condition.</div>
              )}
            </div>
          )}
        </div>

        {/* Pairwise Drug Interaction Checker Widget */}
        <div className="md:col-span-5 clinical-card p-6 space-y-4">
          <h3 className="font-heading font-bold text-base text-ink dark:text-white flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-amberWarn" />
            <span>Drug Interaction Checker</span>
          </h3>

          <p className="text-xs text-inkMuted leading-relaxed">
            Enter 2 RxCUIs to cross-reference openFDA pairwise interaction warnings.
          </p>

          {/* INTERACTION CHECKER SPECIFIC DISCLAIMER BANNER */}
          <div className="p-3 rounded-xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-[11px] text-inkMuted space-y-1">
            <div className="flex items-center gap-1.5 font-semibold text-amberWarn">
              <Info className="w-3.5 h-3.5 shrink-0" />
              <span>Interaction Check Disclaimer</span>
            </div>
            <p className="leading-relaxed text-[10.5px]">
              Results are derived directly from official openFDA drug label warnings &amp; precautions sections rather than a multi-drug clinical interaction database. Always consult a licensed pharmacist or physician before making medication decisions.
            </p>
          </div>


          <form onSubmit={handleCheckInteractions} className="space-y-3">
            <div>
              <label className="block text-[10px] font-mono font-semibold text-inkMuted uppercase mb-1">RxCUI #1 (e.g. 283742 - Omeprazole)</label>
              <input
                type="text"
                required
                value={rxcui1}
                onChange={(e) => setRxcui1(e.target.value)}
                className="w-full p-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-mono text-ink dark:text-white"
              />
            </div>

            <div>
              <label className="block text-[10px] font-mono font-semibold text-inkMuted uppercase mb-1">RxCUI #2 (e.g. 5640 - Ibuprofen)</label>
              <input
                type="text"
                required
                value={rxcui2}
                onChange={(e) => setRxcui2(e.target.value)}
                className="w-full p-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-mono text-ink dark:text-white"
              />
            </div>

            <button
              type="submit"
              disabled={checkingInteractions}
              className="w-full btn-teal py-2.5 text-xs font-semibold shadow-sm"
            >
              {checkingInteractions ? 'Evaluating Interactions...' : 'Check Pairwise Interactions'}
            </button>
          </form>

          {interactionResult && (
            <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-xs space-y-2">
              <span className="font-mono font-bold text-amberWarn block uppercase text-[10px]">Interaction Evaluation:</span>
              {interactionResult.interactions?.length > 0 ? (
                interactionResult.interactions.map((it: any, idx: number) => (
                  <div key={idx} className="space-y-1">
                    <div className="font-bold text-ink dark:text-white">{it.drug1_name} + {it.drug2_name}</div>
                    <p className="text-inkMuted text-[11px] leading-relaxed">{it.description}</p>
                  </div>
                ))
              ) : (
                <p className="text-inkMuted italic">{interactionResult.error || 'No severe pairwise interaction flag detected.'}</p>
              )}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}

export default function MedicineHubPage() {
  return (
    <ProtectedRoute allowedRoles={['patient', 'doctor', 'admin']}>
      <Suspense fallback={<div className="text-center py-12 text-xs text-inkMuted">Loading Medicine Hub...</div>}>
        <MedicineHubSearchContent />
      </Suspense>
    </ProtectedRoute>
  );
}
