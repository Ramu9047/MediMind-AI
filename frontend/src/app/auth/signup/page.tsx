'use client';

import React, { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Lock, Mail, User, Activity, ShieldCheck, UserCheck } from 'lucide-react';

export default function SignupPage() {
  const { user, signup } = useAuth();
  const router = useRouter();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  React.useEffect(() => {
    if (user) {
      router.replace('/patient/dashboard');
    }
  }, [user, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await signup(name, email, 'patient', password);
      window.location.href = '/patient/symptom-checker';
    } catch (err: any) {
      setError(err.message || 'Signup failed');
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto py-12 space-y-6 animate-card-rise">
      <div className="text-center space-y-2">
        <div className="inline-flex w-12 h-12 rounded-2xl bg-tealPrimary text-white items-center justify-center shadow-md mb-2">
          <UserCheck className="w-6 h-6" />
        </div>
        <h1 className="text-2xl font-heading font-extrabold text-ink dark:text-white">Patient Account Registration</h1>
        <p className="text-xs text-inkMuted max-w-sm mx-auto">
          Create your personal MediMind AI patient profile to access symptom checks, health vitals, and doctor consultations.
        </p>
      </div>

      <div className="clinical-card p-6 md:p-8 space-y-6">
        {error && (
          <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-dangerRed text-xs font-medium">
            {error}
          </div>
        )}

        {/* Notice for Staff Accounts */}
        <div className="p-3 rounded-xl bg-mistTeal dark:bg-slate-900 border border-tealPrimary/20 text-xs text-inkMuted space-y-1">
          <div className="font-semibold text-tealPrimary dark:text-teal-400 flex items-center gap-1.5 font-mono text-[11px] uppercase">
            <ShieldCheck className="w-3.5 h-3.5" /> Staff Account Notice:
          </div>
          <p className="text-[11px] leading-relaxed">
            Official medical staff accounts (Doctors, Lab Technicians) are provisioned directly by System Administration.
          </p>
        </div>

        <form onSubmit={handleSubmit} autoComplete="off" className="space-y-4">
          <div>
            <label className="block text-xs font-mono font-semibold text-inkMuted uppercase mb-1">Full Name</label>
            <div className="relative">
              <User className="w-4 h-4 text-inkMuted absolute left-3 top-3" />
              <input
                type="text"
                required
                autoComplete="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Sarah Connor"
                className="w-full pl-9 pr-4 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-ink dark:text-white focus:outline-none focus:border-tealPrimary"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-mono font-semibold text-inkMuted uppercase mb-1">Email Address</label>
            <div className="relative">
              <Mail className="w-4 h-4 text-inkMuted absolute left-3 top-3" />
              <input
                type="email"
                required
                autoComplete="off"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="patient@example.com"
                className="w-full pl-9 pr-4 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-ink dark:text-white focus:outline-none focus:border-tealPrimary"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-mono font-semibold text-inkMuted uppercase mb-1">Password</label>
            <div className="relative">
              <Lock className="w-4 h-4 text-inkMuted absolute left-3 top-3" />
              <input
                type="password"
                required
                autoComplete="new-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-9 pr-4 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-ink dark:text-white focus:outline-none focus:border-tealPrimary"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full btn-teal py-3 text-xs font-semibold shadow-md mt-2"
          >
            {loading ? 'Creating Patient Account...' : 'Create Patient Account'}
          </button>
        </form>
      </div>

      <p className="text-center text-xs text-inkMuted">
        Already have an account?{' '}
        <Link href="/auth/login" className="text-tealPrimary hover:underline font-semibold">
          Log in
        </Link>
      </p>
    </div>
  );
}
