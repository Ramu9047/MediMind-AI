'use client';

import React, { useState, Suspense } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Lock, Mail, Activity, Eye, EyeOff } from 'lucide-react';
import MediMindLogo from '@/components/MediMindLogo';

function LoginFormContent() {
  const { user, login } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const isExpired = searchParams?.get('expired') === 'true';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Instant redirect if already logged in
  React.useEffect(() => {
    if (user) {
      const target = user.role === 'admin' ? '/admin/dashboard'
                   : user.role === 'doctor' ? '/doctor/dashboard'
                   : user.role === 'lab' ? '/lab/dashboard'
                   : '/patient/dashboard';
      router.replace(target);
    }
  }, [user, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const loggedUser = await login(email, password);
      const role = loggedUser?.role || (email.includes('admin') ? 'admin' : email.includes('doctor') ? 'doctor' : email.includes('lab') ? 'lab' : 'patient');
      const target = role === 'admin' ? '/admin/dashboard'
                   : role === 'doctor' ? '/doctor/dashboard'
                   : role === 'lab' ? '/lab/dashboard'
                   : '/patient/dashboard';
      window.location.href = target;
    } catch (err: any) {
      setError(err.message || 'Invalid credentials');
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto py-12 space-y-6 animate-card-rise">
      <div className="text-center space-y-3 flex flex-col items-center">
        <MediMindLogo size="lg" showSubtitle={false} />
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
            <div className="flex items-center justify-between mb-1">
              <label className="block text-xs font-mono font-semibold text-inkMuted uppercase tracking-wider">Password</label>
              <Link href="/auth/forgot-password" className="text-xs text-tealPrimary hover:underline font-semibold">
                Forgot password?
              </Link>
            </div>
            <div className="relative">
              <Lock className="w-4 h-4 text-inkMuted absolute left-3 top-3" />
              <input
                type={showPassword ? 'text' : 'password'}
                required
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-9 pr-10 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-sm text-ink dark:text-white focus:outline-none focus:border-tealPrimary font-sans"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-3 text-inkMuted hover:text-ink dark:hover:text-white transition-colors"
                title={showPassword ? 'Hide password' : 'Show password'}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
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

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="text-center py-12 text-xs text-inkMuted">Loading authentication...</div>}>
      <LoginFormContent />
    </Suspense>
  );
}

