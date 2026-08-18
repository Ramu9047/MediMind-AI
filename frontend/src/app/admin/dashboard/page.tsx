'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { fetchApi } from '@/lib/api';
import { ShieldAlert, ShieldCheck, Lock, Activity, Users, FileText, CalendarCheck, UserPlus, Stethoscope, FlaskConical } from 'lucide-react';

import ProtectedRoute from '@/components/ProtectedRoute';

export default function AdminDashboardPage() {
  const { user } = useAuth();
  const [metrics, setMetrics] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Staff provisioning state
  const [staffName, setStaffName] = useState('');
  const [staffEmail, setStaffEmail] = useState('');
  const [staffPassword, setStaffPassword] = useState('');
  const [staffRole, setStaffRole] = useState<'doctor' | 'lab' | 'admin'>('doctor');
  const [staffSpec, setStaffSpec] = useState('');
  const [staffMsg, setStaffMsg] = useState('');
  const [staffErr, setStaffErr] = useState('');
  const [staffLoading, setStaffLoading] = useState(false);

  const fetchMetrics = () => {
    fetchApi('/admin/metrics')
      .then((data) => setMetrics(data))
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchMetrics();
  }, []);

  const handleCreateStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    setStaffMsg('');
    setStaffErr('');
    setStaffLoading(true);

    try {
      const res = await fetchApi('/admin/create-staff', {
        method: 'POST',
        body: JSON.stringify({
          name: staffName,
          email: staffEmail,
          password: staffPassword,
          role: staffRole,
          specialization: staffRole === 'doctor' ? staffSpec : undefined,
        }),
      });
      setStaffMsg(res.message || 'Staff account provisioned successfully!');
      setStaffName('');
      setStaffEmail('');
      setStaffPassword('');
      fetchMetrics();
    } catch (err: any) {
      setStaffErr(err.message || 'Failed to provision staff account.');
    } finally {
      setStaffLoading(false);
    }
  };

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
    <ProtectedRoute allowedRoles={['admin']}>
    <div className="space-y-8 py-4 max-w-5xl mx-auto animate-card-rise">
      
      {/* Admin Header */}
      <div className="p-6 rounded-3xl bg-gradient-to-r from-mistTeal via-white to-bgLight dark:from-darkSurface dark:to-darkBg border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between">
        <div>
          <span className="text-xs font-mono font-semibold text-amberWarn uppercase tracking-wider">System Administration & Audit</span>
          <h1 className="text-2xl sm:text-3xl font-heading font-extrabold text-ink dark:text-white">
            MediMind <span className="text-amberWarn">Security Dashboard</span>
          </h1>
          <p className="text-xs text-inkMuted mt-0.5">Aggregate usage metrics, staff provisioning, and audit logs.</p>
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
          <span>Public Registration Restricted to Patients</span>
        </div>
        <div className="flex items-center gap-2 text-ink dark:text-amber-300">
          <ShieldCheck className="w-4 h-4 text-tealPrimary shrink-0" />
          <span>Admin-Only Staff Account Provisioning</span>
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

      {/* PROVISION STAFF ACCOUNT FORM SECTION */}
      <div className="clinical-card p-6 space-y-4">
        <h3 className="text-base font-heading font-bold text-ink dark:text-white flex items-center gap-2">
          <UserPlus className="w-5 h-5 text-tealPrimary" />
          <span>Provision Official Medical Staff Account</span>
        </h3>

        {staffMsg && (
          <div className="p-3 rounded-xl bg-teal-500/10 border border-teal-500/30 text-tealPrimary dark:text-teal-400 text-xs font-medium">
            {staffMsg}
          </div>
        )}

        {staffErr && (
          <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-dangerRed text-xs font-medium">
            {staffErr}
          </div>
        )}

        <form onSubmit={handleCreateStaff} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-mono font-semibold uppercase text-inkMuted mb-1">Staff Full Name</label>
            <input
              type="text"
              required
              value={staffName}
              onChange={(e) => setStaffName(e.target.value)}
              placeholder="e.g. Dr. Alexander Fleming"
              className="w-full p-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-ink dark:text-white focus:outline-none focus:border-tealPrimary"
            />
          </div>

          <div>
            <label className="block text-xs font-mono font-semibold uppercase text-inkMuted mb-1">Staff Email Address</label>
            <input
              type="email"
              required
              value={staffEmail}
              onChange={(e) => setStaffEmail(e.target.value)}
              placeholder="staff@medimind.ai"
              className="w-full p-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-ink dark:text-white focus:outline-none focus:border-tealPrimary"
            />
          </div>

          <div>
            <label className="block text-xs font-mono font-semibold uppercase text-inkMuted mb-1">Temporary Password</label>
            <input
              type="password"
              required
              value={staffPassword}
              onChange={(e) => setStaffPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full p-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-ink dark:text-white focus:outline-none focus:border-tealPrimary"
            />
          </div>

          <div>
            <label className="block text-xs font-mono font-semibold uppercase text-inkMuted mb-1">Assigned Role</label>
            <select
              value={staffRole}
              onChange={(e) => setStaffRole(e.target.value as any)}
              className="w-full p-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-ink dark:text-white focus:outline-none focus:border-tealPrimary"
            >
              <option value="doctor">Doctor (Physician Portal)</option>
              <option value="lab">Lab Technician (Laboratory Portal)</option>
              <option value="admin">System Administrator</option>
            </select>
          </div>

          {staffRole === 'doctor' && (
            <div className="sm:col-span-2">
              <label className="block text-xs font-mono font-semibold uppercase text-inkMuted mb-1">Specialization / Department</label>
              <input
                type="text"
                value={staffSpec}
                onChange={(e) => setStaffSpec(e.target.value)}
                placeholder="e.g. Cardiology & Internal Medicine"
                className="w-full p-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-ink dark:text-white focus:outline-none focus:border-tealPrimary"
              />
            </div>
          )}

          <div className="sm:col-span-2 pt-2">
            <button
              type="submit"
              disabled={staffLoading}
              className="btn-teal py-2.5 px-6 text-xs font-semibold shadow-md"
            >
              {staffLoading ? 'Provisioning Staff Credentials...' : 'Provision Staff Account'}
            </button>
          </div>
        </form>
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
    </ProtectedRoute>
  );
}
