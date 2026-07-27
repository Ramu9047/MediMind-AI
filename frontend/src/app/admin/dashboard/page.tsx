'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { fetchApi } from '@/lib/api';
import { ShieldAlert, ShieldCheck, Lock, Activity, Users, FileText, CalendarCheck } from 'lucide-react';

export default function AdminDashboardPage() {
  const { user } = useAuth();
  const [metrics, setMetrics] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchApi('/admin/metrics')
      .then((data) => setMetrics(data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return <div className="text-center py-12 text-xs text-inkMuted">Loading system security & audit metrics...</div>;
  }

  if (!metrics) {
    return (
      <div className="clinical-card p-8 text-center text-xs text-rose-600 border border-rose-500/30">
        Access Denied: Admin privileges required to view security metrics.
      </div>
    );
  }

  return (
    <div className="space-y-8 py-4 max-w-5xl mx-auto animate-card-rise">
      
      {/* Admin Header */}
      <div className="p-6 rounded-3xl bg-gradient-to-r from-mistTeal via-white to-bgLight dark:from-darkSurface dark:to-darkBg border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between">
        <div>
          <span className="text-xs font-mono font-semibold text-amberWarn uppercase tracking-wider">System Administration & Audit</span>
          <h1 className="text-2xl sm:text-3xl font-heading font-extrabold text-ink dark:text-white">
            MediMind <span className="text-amberWarn">Security Dashboard</span>
          </h1>
          <p className="text-xs text-inkMuted mt-0.5">Aggregate usage metrics, system hardening audit logs, and access controls.</p>
        </div>
        <ShieldAlert className="w-10 h-10 text-amberWarn hidden sm:block" />
      </div>

      {/* HARDENING CHECKLIST BADGES */}
      <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs font-mono">
        <div className="flex items-center gap-2 text-ink dark:text-amber-300">
          <ShieldCheck className="w-4 h-4 text-tealPrimary shrink-0" />
          <span>Env-Based JWT Secret Verification</span>
        </div>
        <div className="flex items-center gap-2 text-ink dark:text-amber-300">
          <ShieldCheck className="w-4 h-4 text-tealPrimary shrink-0" />
          <span>Rate-Limited Auth Handlers</span>
        </div>
        <div className="flex items-center gap-2 text-ink dark:text-amber-300">
          <ShieldCheck className="w-4 h-4 text-tealPrimary shrink-0" />
          <span>Strict RBAC Middleware Scoping</span>
        </div>
      </div>

      {/* METRICS METRIC CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        <div className="clinical-card p-5 space-y-1">
          <span className="text-xs font-mono font-semibold uppercase text-inkMuted">Total Registered Users</span>
          <div className="text-2xl font-mono font-bold text-ink dark:text-white flex items-center gap-2">
            <Users className="w-5 h-5 text-tealPrimary" />
            <span>{metrics.total_users}</span>
          </div>
          <p className="text-[10px] text-inkMuted">Patients: {metrics.total_patients} | Doctors: {metrics.total_doctors} | Labs: {metrics.total_labs}</p>
        </div>

        <div className="clinical-card p-5 space-y-1">
          <span className="text-xs font-mono font-semibold uppercase text-inkMuted">AI Symptom Checks</span>
          <div className="text-2xl font-mono font-bold text-ink dark:text-white flex items-center gap-2">
            <Activity className="w-5 h-5 text-tealPrimary" />
            <span>{metrics.total_symptom_checks}</span>
          </div>
          <p className="text-[10px] text-inkMuted">41-Disease ML model runs</p>
        </div>

        <div className="clinical-card p-5 space-y-1">
          <span className="text-xs font-mono font-semibold uppercase text-inkMuted">Appointments Scheduled</span>
          <div className="text-2xl font-mono font-bold text-ink dark:text-white flex items-center gap-2">
            <CalendarCheck className="w-5 h-5 text-tealPrimary" />
            <span>{metrics.total_appointments}</span>
          </div>
          <p className="text-[10px] text-inkMuted">Doctor consultations</p>
        </div>

        <div className="clinical-card p-5 space-y-1">
          <span className="text-xs font-mono font-semibold uppercase text-inkMuted">Lab Diagnostic Tests</span>
          <div className="text-2xl font-mono font-bold text-ink dark:text-white flex items-center gap-2">
            <FileText className="w-5 h-5 text-purple-600 dark:text-purple-400" />
            <span>{metrics.total_lab_tests}</span>
          </div>
          <p className="text-[10px] text-inkMuted">Reports uploaded & AI summarized</p>
        </div>

      </div>

      {/* SECURITY AUDIT LOG TABLE */}
      <div className="clinical-card p-6 space-y-4">
        <h3 className="text-base font-heading font-bold text-ink dark:text-white flex items-center gap-2">
          <Lock className="w-5 h-5 text-amberWarn" />
          <span>Security Audit Trail & Operational Events</span>
        </h3>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-ink dark:text-slate-300">
            <thead className="bg-slate-100 dark:bg-slate-900 text-inkMuted uppercase text-[10px] font-mono tracking-wider">
              <tr>
                <th className="p-3 rounded-l-xl">Action Event</th>
                <th className="p-3">User / Identity</th>
                <th className="p-3 rounded-r-xl">Timestamp</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
              {metrics.security_audits.map((log: any, idx: number) => (
                <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-slate-900/40">
                  <td className="p-3 font-mono font-semibold text-tealPrimary">{log.action}</td>
                  <td className="p-3 text-ink dark:text-slate-300">{log.user}</td>
                  <td className="p-3 text-inkMuted">{new Date(log.timestamp).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}
