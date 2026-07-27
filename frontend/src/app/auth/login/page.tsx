'use client';

import React, { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Lock, Mail, Activity, ArrowRight, ShieldCheck } from 'lucide-react';

export default function LoginPage() {
  const { login, quickLogin } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(email, password);
      if (email.includes('admin')) {
        router.push('/admin/dashboard');
      } else {
        router.push('/patient/symptom-checker');
      }
    } catch (err: any) {
      setError(err.message || 'Invalid credentials');
    } finally {
      setLoading(false);
    }
  };

  const handleQuick = async (role: 'patient' | 'doctor' | 'lab' | 'admin') => {
    setError('');
    if (role === 'admin') {
      setEmail('admin@medimind.ai');
      setPassword('');
      setError('Please enter your server-configured admin password from .env');
      return;
    }
    setLoading(true);
    try {
      await quickLogin(role);
      if (role === 'patient') router.push('/patient/symptom-checker');
      else if (role === 'doctor') router.push('/doctor/dashboard');
      else if (role === 'lab') router.push('/lab/dashboard');
    } catch (err: any) {
      setError(err.message || 'Quick login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto py-12 space-y-6 animate-card-rise">
      <div className="text-center space-y-2">
        <div className="inline-flex w-12 h-12 rounded-2xl bg-tealPrimary text-white items-center justify-center shadow-md mb-2">
          <Activity className="w-6 h-6 stroke-[2.5]" />
        </div>
        <h1 className="text-2xl font-heading font-extrabold text-ink dark:text-white">Log in to MediMind AI</h1>
        <p className="text-xs text-inkMuted">Access your clinical timeline, physician queue, or lab portal</p>
      </div>

      <div className="clinical-card p-6 md:p-8 space-y-6">
        {error && (
          <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-900 dark:text-amber-200 text-xs font-medium">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-mono font-semibold text-inkMuted uppercase tracking-wider mb-1">Email Address</label>
            <div className="relative">
              <Mail className="w-4 h-4 text-inkMuted absolute left-3 top-3" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@example.com"
                className="w-full pl-9 pr-4 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-sm text-ink dark:text-white focus:outline-none focus:border-tealPrimary font-sans"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-mono font-semibold text-inkMuted uppercase tracking-wider mb-1">Password</label>
            <div className="relative">
              <Lock className="w-4 h-4 text-inkMuted absolute left-3 top-3" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-9 pr-4 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-sm text-ink dark:text-white focus:outline-none focus:border-tealPrimary font-sans"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full btn-teal py-3 text-sm shadow-md"
          >
            {loading ? 'Authenticating...' : 'Sign In'}
          </button>
        </form>

        <div className="relative border-t border-slate-200 dark:border-slate-800 pt-4">
          <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-white dark:bg-darkSurface px-3 text-[11px] font-mono font-semibold text-inkMuted uppercase tracking-wider">
            Quick Demo Logins
          </span>

          <div className="grid grid-cols-2 gap-2 pt-2">
            <button
              onClick={() => handleQuick('patient')}
              className="px-3 py-2 rounded-xl bg-mistTeal dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700 text-xs text-tealPrimary font-medium text-left flex items-center justify-between hover:bg-tealPrimary hover:text-white transition-all"
            >
              <span>Patient Demo</span>
              <ArrowRight className="w-3 h-3" />
            </button>
            <button
              onClick={() => handleQuick('doctor')}
              className="px-3 py-2 rounded-xl bg-mistTeal dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700 text-xs text-tealPrimary font-medium text-left flex items-center justify-between hover:bg-tealPrimary hover:text-white transition-all"
            >
              <span>Doctor Demo</span>
              <ArrowRight className="w-3 h-3" />
            </button>
            <button
              onClick={() => handleQuick('lab')}
              className="px-3 py-2 rounded-xl bg-purple-50 dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700 text-xs text-purple-600 dark:text-purple-400 font-medium text-left flex items-center justify-between hover:bg-purple-600 hover:text-white transition-all"
            >
              <span>Lab Tech Demo</span>
              <ArrowRight className="w-3 h-3" />
            </button>
            <button
              onClick={() => handleQuick('admin')}
              className="px-3 py-2 rounded-xl bg-amber-50 dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700 text-xs text-amberWarn font-medium text-left flex items-center justify-between hover:bg-amberWarn hover:text-white transition-all"
            >
              <span>Admin Login</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
