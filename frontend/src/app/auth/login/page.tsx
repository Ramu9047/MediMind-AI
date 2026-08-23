'use client';

import React, { useState } from 'react';

import { useAuth } from '@/context/AuthContext';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Lock, Mail, Activity } from 'lucide-react';

export default function LoginPage() {

  const { login } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const isExpired = searchParams?.get('expired') === 'true';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const loggedUser = await login(email, password);
      const role = loggedUser?.role || (email.includes('admin') ? 'admin' : email.includes('doctor') ? 'doctor' : email.includes('lab') ? 'lab' : 'patient');
      if (role === 'admin') {
        router.push('/admin/dashboard');
      } else if (role === 'doctor') {
        router.push('/doctor/dashboard');
      } else if (role === 'lab') {
        router.push('/lab/dashboard');
      } else {
        router.push('/patient/dashboard');
      }
    } catch (err: any) {
      setError(err.message || 'Invalid credentials');
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
        {isExpired && (
          <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-900 dark:text-amber-200 text-xs font-medium flex items-center gap-2">
            <Activity className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
            <span>Your session has expired. Please log in again to continue.</span>
          </div>
        )}

        {error && (

          <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-900 dark:text-amber-200 text-xs font-medium">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} autoComplete="off" className="space-y-4">
          <div>
            <label className="block text-xs font-mono font-semibold text-inkMuted uppercase tracking-wider mb-1">Email Address</label>
            <div className="relative">
              <Mail className="w-4 h-4 text-inkMuted absolute left-3 top-3" />
              <input
                type="email"
                required
                autoComplete="username"
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
                autoComplete="current-password"
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
      </div>

      <p className="text-center text-xs text-inkMuted">
        Don&apos;t have a patient account?{' '}
        <Link href="/auth/signup" className="text-tealPrimary hover:underline font-semibold">
          Register Patient Account
        </Link>
      </p>
    </div>
  );
}
