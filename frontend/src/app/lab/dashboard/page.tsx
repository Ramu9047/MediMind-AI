'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { fetchApi } from '@/lib/api';
import { FlaskConical, Upload, CheckCircle2, Clock } from 'lucide-react';

export default function LabDashboardPage() {
  const { user } = useAuth();
  const [labTests, setLabTests] = useState<any[]>([]);
  const [selectedTest, setSelectedTest] = useState<any>(null);
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    fetchApi('/labs/my').then((data) => setLabTests(data || [])).catch(() => {});
  }, []);

  const handleStatusChange = async (testId: string, status: string) => {
    try {
      await fetchApi(`/labs/${testId}/status?new_status=${encodeURIComponent(status)}`, { method: 'PUT' });
      setLabTests(labTests.map((t) => (t.id === testId ? { ...t, status } : t)));
    } catch (err) {
      alert('Failed to update status');
    }
  };

  const handleUploadReport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTest || !file) return;
    setUploading(true);
    setMessage('');

    const formData = new FormData();
    formData.append('file', file);

    try {
      await fetchApi(`/labs/${selectedTest.id}/upload-report`, {
        method: 'POST',
        body: formData,
      });
      setMessage('Lab report uploaded & AI summarized successfully!');
      fetchApi('/labs/my').then((data) => setLabTests(data || []));
      setSelectedTest(null);
      setFile(null);
    } catch (err: any) {
      setMessage(err.message || 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-8 py-4 max-w-5xl mx-auto animate-card-rise">
      
      {/* Header */}
      <div className="p-6 rounded-3xl bg-gradient-to-r from-mistTeal via-white to-bgLight dark:from-darkSurface dark:to-darkBg border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between">
        <div>
          <span className="text-xs font-mono font-semibold text-purple-600 dark:text-purple-400 uppercase tracking-wider">Diagnostic Laboratory Portal</span>
          <h1 className="text-2xl sm:text-3xl font-heading font-extrabold text-ink dark:text-white">
            Welcome, <span className="text-purple-600 dark:text-purple-400">{user?.name || 'Lab Technician'}</span>
          </h1>
          <p className="text-xs text-inkMuted mt-0.5">Manage test orders, update sample status, and publish AI-summarized reports.</p>
        </div>
        <FlaskConical className="w-10 h-10 text-purple-600 dark:text-purple-400 hidden sm:block" />
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Test Orders Queue */}
        <div className="lg:col-span-7 space-y-4">
          <h3 className="text-base font-heading font-bold text-ink dark:text-white flex items-center gap-2">
            <Clock className="w-5 h-5 text-purple-600 dark:text-purple-400" />
            <span>Active Laboratory Orders Queue ({labTests.length})</span>
          </h3>

          <div className="space-y-4">
            {labTests.map((t) => (
              <div key={t.id} className="clinical-card p-5 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-sm font-heading font-bold text-ink dark:text-white">{t.test_name}</h4>
                    <p className="text-xs text-inkMuted">Patient: {t.patient_name} (ID: {t.patient_id.slice(0, 8)})</p>
                  </div>
                  <span className="px-2.5 py-1 rounded-full bg-purple-500/10 text-purple-600 dark:text-purple-400 text-xs font-mono font-semibold border border-purple-500/30">
                    {t.status}
                  </span>
                </div>

                {t.notes && <p className="text-xs text-inkMuted italic">Notes: {t.notes}</p>}

                {/* Sample Status Workflow Control */}
                <div className="pt-2 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between gap-2 flex-wrap text-xs">
                  <span className="text-inkMuted font-semibold font-mono">Update Status:</span>
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => handleStatusChange(t.id, 'Sample Collected')}
                      className={`px-2 py-1 rounded text-[11px] font-mono font-semibold ${t.status === 'Sample Collected' ? 'btn-teal' : 'btn-outline'}`}
                    >
                      Sample Collected
                    </button>
                    <button
                      onClick={() => handleStatusChange(t.id, 'Processing')}
                      className={`px-2 py-1 rounded text-[11px] font-mono font-semibold ${t.status === 'Processing' ? 'btn-teal' : 'btn-outline'}`}
                    >
                      Processing
                    </button>
                  </div>
                </div>

                <div className="pt-2 flex items-center justify-between">
                  <button
                    onClick={() => setSelectedTest(t)}
                    className="btn-teal text-xs py-1.5 px-3 flex items-center gap-1.5"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    <span>Upload Report PDF & AI Analyze</span>
                  </button>

                  {t.ai_summary && (
                    <span className="text-[11px] text-tealPrimary dark:text-teal-400 font-mono font-semibold flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Published
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Upload Modal / Form */}
        <div className="lg:col-span-5">
          {selectedTest ? (
            <div className="clinical-card p-6 space-y-4">
              <h3 className="text-base font-heading font-bold text-ink dark:text-white flex items-center gap-2">
                <Upload className="w-5 h-5 text-tealPrimary" />
                <span>Upload Report Document</span>
              </h3>

              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs space-y-1">
                <span className="text-inkMuted block font-mono font-semibold">Target Order:</span>
                <span className="text-ink dark:text-white font-bold block">{selectedTest.test_name}</span>
                <span className="text-inkMuted block">Patient: {selectedTest.patient_name}</span>
              </div>

              {message && (
                <div className="p-3 rounded-xl bg-teal-500/10 border border-teal-500/30 text-tealPrimary dark:text-teal-400 text-xs font-medium">
                  {message}
                </div>
              )}

              <form onSubmit={handleUploadReport} className="space-y-4">
                <div>
                  <label className="block text-xs font-mono font-semibold text-inkMuted uppercase mb-1">Select Report PDF or Document</label>
                  <input
                    type="file"
                    accept=".pdf,.txt,.doc"
                    onChange={(e) => setFile(e.target.files?.[0] || null)}
                    className="w-full text-xs text-inkMuted file:mr-3 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-tealPrimary file:text-white hover:file:bg-tealDeep"
                  />
                </div>

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setSelectedTest(null)}
                    className="w-1/3 btn-outline text-xs py-2.5"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={uploading || !file}
                    className="w-2/3 btn-teal text-xs py-2.5 font-semibold"
                  >
                    {uploading ? 'Analyzing Report...' : 'Process & Publish Report'}
                  </button>
                </div>
              </form>
            </div>
          ) : (
            <div className="clinical-card p-8 text-center space-y-3 text-xs text-inkMuted">
              <Upload className="w-8 h-8 text-inkMuted mx-auto" />
              <p>Select any test order from the queue to upload a diagnostic report PDF and trigger instant AI OCR summarization.</p>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
