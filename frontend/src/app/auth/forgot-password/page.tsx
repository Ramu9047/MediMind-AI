'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { fetchApi } from '@/lib/api';
import { Mail, KeyRound, Lock, Eye, EyeOff, ShieldAlert, CheckCircle2, ArrowLeft, ShieldCheck } from 'lucide-react';
import MediMindLogo from '@/components/MediMindLogo';

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [step, setStep] = useState<1 | 2>(1);
  const [email, setEmail] = useState('');
  const [resetCode, setResetCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [generatedCodeNotice, setGeneratedCodeNotice] = useState<string | null>(null);
  const [isStaffNotice, setIsStaffNotice] = useState(false);

  const handleRequestCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await fetchApi('/auth/forgot-password/request', {
        method: 'POST',
        body: JSON.stringify({ email: email.trim() }),
      });

      if (res.reset_code) {
        setResetCode(res.reset_code);
        setGeneratedCodeNotice(res.reset_code);
      }
      if (res.is_staff) {
        setIsStaffNotice(true);
      }

      setSuccessMsg('A 6-digit verification reset code has been issued.');
      setStep(2);
    } catch (err: any) {
      setError(err.message || 'Failed to process request. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (newPassword !== confirmPassword) {
      setError('New passwords do not match.');
      return;
    }

    if (newPassword.length < 8) {
      setError('Password must be at least 8 characters long.');
      return;
    }

    setLoading(true);
    try {
      const res = await fetchApi('/auth/forgot-password/reset', {
        method: 'POST',
        body: JSON.stringify({
          email: email.trim(),
          reset_code: resetCode.trim(),
          new_password: newPassword,
        }),
      });

      setSuccessMsg(res.message || 'Password reset successfully!');
      setTimeout(() => {
        router.push('/auth/login');
      }, 1500);
    } catch (err: any) {
      setError(err.message || 'Failed to reset password. Please check your reset code.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto py-12 space-y-6 animate-card-rise">
      <div className="text-center space-y-3 flex flex-col items-center">
        <MediMindLogo size="lg" showSubtitle={false} />
        <h1 className="text-xl font-heading font-extrabold text-ink dark:text-white">Account Password Recovery</h1>
        <p className="text-xs text-inkMuted max-w-sm">
          Reset your password securely to regain access to your MediMind AI clinical workspace.
        </p>
      </div>

      <div className="clinical-card p-6 md:p-8 space-y-6">
        {error && (
          <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-600 dark:text-rose-400 text-xs font-medium flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {successMsg && (
          <div className="p-3.5 rounded-xl bg-teal-500/10 border border-teal-500/30 text-tealPrimary dark:text-teal-400 text-xs font-semibold flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        {step === 1 ? (
          <form onSubmit={handleRequestCode} className="space-y-4">
            <div>
              <label className="block text-xs font-mono font-semibold text-inkMuted uppercase tracking-wider mb-1">
                Registered Email Address
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-inkMuted absolute left-3 top-3" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="patient@medimind.ai"
                  className="w-full pl-9 pr-4 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-sm text-ink dark:text-white focus:outline-none focus:border-tealPrimary font-sans"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full btn-teal py-3 text-sm shadow-md flex items-center justify-center gap-2 font-semibold"
            >
              {loading ? 'Requesting Reset Code...' : 'Request Password Reset Code'}
            </button>
          </form>
        ) : (
          <form onSubmit={handleResetPassword} className="space-y-4">
            {generatedCodeNotice && (
              <div className="p-3 rounded-xl bg-sky-500/10 border border-sky-500/30 text-sky-800 dark:text-sky-300 text-xs space-y-1">
                <div className="font-semibold flex items-center gap-1.5 text-sky-600 dark:text-sky-400 font-mono text-[11px] uppercase">
                  <KeyRound className="w-3.5 h-3.5" /> Demo Reset Verification Code:
                </div>
                <div className="font-mono text-base font-bold tracking-widest text-sky-900 dark:text-sky-200">
                  {generatedCodeNotice}
                </div>
                <p className="text-[11px] text-inkMuted">
                  Code auto-filled for testing. Enter code and set your new password below.
                </p>
              </div>
            )}

            {isStaffNotice && (
              <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-900 dark:text-amber-200 text-xs space-y-1">
                <div className="font-semibold flex items-center gap-1.5 text-amber-600 dark:text-amber-400 font-mono text-[11px] uppercase">
                  <ShieldCheck className="w-3.5 h-3.5" /> Staff Notice:
                </div>
                <p className="text-[11px] text-inkMuted">
                  You are resetting a staff account password (Doctor/Lab Tech/Admin). You can also request a temporary password re-assignment from System Administration.
                </p>
              </div>
            )}

            <div>
              <label className="block text-xs font-mono font-semibold text-inkMuted uppercase tracking-wider mb-1">
                6-Digit Reset Code
              </label>
              <div className="relative">
                <KeyRound className="w-4 h-4 text-inkMuted absolute left-3 top-3" />
                <input
                  type="text"
                  required
                  maxLength={6}
                  value={resetCode}
                  onChange={(e) => setResetCode(e.target.value)}
                  placeholder="123456"
                  className="w-full pl-9 pr-4 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-sm font-mono text-ink dark:text-white focus:outline-none focus:border-tealPrimary tracking-widest"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-mono font-semibold text-inkMuted uppercase tracking-wider mb-1">
                New Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-inkMuted absolute left-3 top-3" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="At least 8 characters..."
                  className="w-full pl-9 pr-10 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-sm text-ink dark:text-white focus:outline-none focus:border-tealPrimary"
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

            <div>
              <label className="block text-xs font-mono font-semibold text-inkMuted uppercase tracking-wider mb-1">
                Confirm New Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-inkMuted absolute left-3 top-3" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Re-enter new password..."
                  className="w-full pl-9 pr-4 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-sm text-ink dark:text-white focus:outline-none focus:border-tealPrimary"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full btn-teal py-3 text-sm shadow-md font-semibold"
            >
              {loading ? 'Updating Password...' : 'Save New Password & Continue'}
            </button>

            <button
              type="button"
              onClick={() => {
                setStep(1);
                setError('');
                setSuccessMsg('');
              }}
              className="w-full text-center text-xs text-inkMuted hover:text-tealPrimary transition-colors py-1 flex items-center justify-center gap-1"
            >
              <ArrowLeft className="w-3.5 h-3.5" /> Back to email request
            </button>
          </form>
        )}
      </div>

      <p className="text-center text-xs text-inkMuted">
        Remembered your password?{' '}
        <Link href="/auth/login" className="text-tealPrimary hover:underline font-semibold">
          Return to Sign In
        </Link>
      </p>
    </div>
  );
}
