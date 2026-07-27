'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useSearchParams } from 'next/navigation';
import { fetchApi } from '@/lib/api';
import { FlaskConical, FileText, CheckCircle2, AlertTriangle } from 'lucide-react';

function LabTestsContent() {
  const searchParams = useSearchParams();
  const testNameParam = searchParams.get('test_name');

  const [testName, setTestName] = useState(testNameParam || 'Comprehensive Metabolic & Lipid Panel');
  const [notes, setNotes] = useState('Fasting for 8 hours prior to sample collection.');
  const [myLabTests, setMyLabTests] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    fetchApi('/labs/my')
      .then((data) => setMyLabTests(data || []))
      .catch(() => {});
  }, []);

  const handleBook = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');
    try {
      const res = await fetchApi('/labs/book', {
        method: 'POST',
        body: JSON.stringify({ test_name: testName, notes }),
      });
      setMessage('Lab test order submitted successfully!');
      setMyLabTests([res, ...myLabTests]);
    } catch (err: any) {
      setMessage(err.message || 'Failed to order lab test');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8 max-w-4xl mx-auto py-4 animate-card-rise">
      <div className="space-y-2 text-center">
        <h1 className="text-3xl font-heading font-extrabold text-ink dark:text-white">Diagnostic Lab Orders & AI Reports</h1>
        <p className="text-sm text-inkMuted">Order lab tests and inspect AI-analyzed reports with plain-language summaries</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
        
        {/* Order Form */}
        <div className="md:col-span-5 clinical-card p-6 space-y-4">
          <h3 className="text-base font-heading font-bold text-ink dark:text-white flex items-center gap-2">
            <FlaskConical className="w-5 h-5 text-purple-600 dark:text-purple-400" />
            <span>Order Diagnostic Test</span>
          </h3>

          {message && (
            <div className="p-3 rounded-xl bg-teal-500/10 border border-teal-500/30 text-tealPrimary dark:text-teal-400 text-xs font-medium">
              {message}
            </div>
          )}

          <form onSubmit={handleBook} className="space-y-4">
            <div>
              <label className="block text-xs font-mono font-semibold text-inkMuted uppercase mb-1">Test Name</label>
              <input
                type="text"
                required
                value={testName}
                onChange={(e) => setTestName(e.target.value)}
                className="w-full p-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-ink dark:text-white focus:outline-none focus:border-tealPrimary"
              />
            </div>

            <div>
              <label className="block text-xs font-mono font-semibold text-inkMuted uppercase mb-1">Clinical / Patient Notes</label>
              <textarea
                rows={3}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full p-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-ink dark:text-white focus:outline-none focus:border-tealPrimary"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full btn-teal py-3 font-semibold text-xs shadow-md"
            >
              {loading ? 'Submitting Order...' : 'Submit Lab Order'}
            </button>
          </form>
        </div>

        {/* Lab Orders Queue & Reports */}
        <div className="md:col-span-7 space-y-4">
          <h3 className="text-base font-heading font-bold text-ink dark:text-white flex items-center gap-2">
            <FileText className="w-5 h-5 text-tealPrimary" />
            <span>Lab Test Status & Summaries</span>
          </h3>

          <div className="space-y-4">
            {myLabTests.length > 0 ? (
              myLabTests.map((lab) => (
                <div key={lab.id} className="clinical-card p-5 space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-sm font-heading font-bold text-ink dark:text-white">{lab.test_name}</h4>
                      <p className="text-xs text-inkMuted">Order ID: {lab.id.slice(0, 8)}</p>
                    </div>
                    <span className="px-2.5 py-1 rounded-full bg-purple-500/10 text-purple-600 dark:text-purple-400 text-xs font-mono font-semibold border border-purple-500/30">
                      {lab.status}
                    </span>
                  </div>

                  {/* Sample Status Workflow Tracker */}
                  <div className="flex items-center justify-between py-2 border-y border-slate-200 dark:border-slate-800 text-[11px] text-inkMuted">
                    <span className={lab.status === 'Requested' ? 'text-tealPrimary font-bold' : ''}>Requested</span>
                    <span>→</span>
                    <span className={lab.status === 'Sample Collected' ? 'text-tealPrimary font-bold' : ''}>Sample Collected</span>
                    <span>→</span>
                    <span className={lab.status === 'Processing' ? 'text-tealPrimary font-bold' : ''}>Processing</span>
                    <span>→</span>
                    <span className={lab.status === 'Completed' ? 'text-tealPrimary font-bold' : ''}>Completed</span>
                  </div>

                  {lab.ai_summary ? (
                    <div className="space-y-2 pt-1">
                      <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs space-y-1">
                        <span className="font-bold text-tealPrimary dark:text-teal-400 flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5" /> AI Plain-Language Report Summary:
                        </span>
                        <p className="text-ink dark:text-slate-300 leading-relaxed">{lab.ai_summary}</p>
                      </div>

                      {lab.abnormal_flags && lab.abnormal_flags.length > 0 && (
                        <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-xs text-amber-700 dark:text-amber-300 space-y-1">
                          <span className="font-bold text-amberWarn flex items-center gap-1">
                            <AlertTriangle className="w-3.5 h-3.5" /> Flagged Biomarkers:
                          </span>
                          <ul className="list-disc list-inside space-y-0.5">
                            {lab.abnormal_flags.map((flag: string, idx: number) => (
                              <li key={idx}>{flag}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  ) : (
                    <p className="text-xs text-inkMuted italic">
                      Awaiting report upload by laboratory technician. Status: {lab.status}
                    </p>
                  )}
                </div>
              ))
            ) : (
              <div className="clinical-card p-8 text-center text-xs text-inkMuted">
                No active lab orders found.
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}

export default function PatientLabTestsPage() {
  return (
    <Suspense fallback={<div className="text-center py-12 text-xs text-inkMuted">Loading lab orders...</div>}>
      <LabTestsContent />
    </Suspense>
  );
}
