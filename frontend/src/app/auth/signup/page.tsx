'use client';

import React, { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Lock, Mail, User, Activity, Stethoscope, FlaskConical, ShieldAlert } from 'lucide-react';

export default function SignupPage() {
  const { signup } = useAuth();
  const router = useRouter();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<'patient' | 'doctor' | 'lab' | 'admin'>('patient');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await signup(name, email, role, password);
      if (role === 'patient') router.push('/patient/symptom-checker');
      else if (role === 'doctor') router.push('/doctor/dashboard');
      else if (role === 'lab') router.push('/lab/dashboard');
      else router.push('/admin/dashboard');
    } catch (err: any) {
      setError(err.message || 'Signup failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto py-12 space-y-6">
      <div className="text-center space-y-2">
        <div className="inline-flex w-12 h-12 rounded-2xl bg-gradient-to-tr from-cyan-500 to-indigo-600 p-0.5 items-center justify-center shadow-lg shadow-cyan-500/20 mb-2">
          <Activity className="w-6 h-6 text-white" />
        </div>
        <h1 className="text-2xl font-bold text-white">Create your MediMind AI Account</h1>
        <p className="text-sm text-slate-400">Join the unified healthcare coordination ecosystem</p>
      </div>

      <div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-6">
        {error && (
          <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">Full Name</label>
            <div className="relative">
              <User className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Dr. Jane Doe / John Smith"
                className="w-full pl-9 pr-4 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-sm text-white focus:outline-none focus:border-cyan-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">Email Address</label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@example.com"
                className="w-full pl-9 pr-4 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-sm text-white focus:outline-none focus:border-cyan-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">Password</label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-9 pr-4 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-sm text-white focus:outline-none focus:border-cyan-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">Select User Role</label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setRole('patient')}
                className={`p-2.5 rounded-xl border text-xs font-medium flex items-center gap-2 transition-all ${
                  role === 'patient'
                    ? 'bg-cyan-500/20 border-cyan-500 text-cyan-300'
                    : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                <User className="w-4 h-4 text-cyan-400" />
                <span>Patient</span>
              </button>

              <button
                type="button"
                onClick={() => setRole('doctor')}
                className={`p-2.5 rounded-xl border text-xs font-medium flex items-center gap-2 transition-all ${
                  role === 'doctor'
                    ? 'bg-indigo-500/20 border-indigo-500 text-indigo-300'
                    : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                <Stethoscope className="w-4 h-4 text-indigo-400" />
                <span>Doctor</span>
              </button>

              <button
                type="button"
                onClick={() => setRole('lab')}
                className={`p-2.5 rounded-xl border text-xs font-medium flex items-center gap-2 transition-all ${
                  role === 'lab'
                    ? 'bg-emerald-500/20 border-emerald-500 text-emerald-300'
                    : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                <FlaskConical className="w-4 h-4 text-emerald-400" />
                <span>Lab Tech</span>
              </button>

              <button
                type="button"
                onClick={() => setRole('admin')}
                className={`p-2.5 rounded-xl border text-xs font-medium flex items-center gap-2 transition-all ${
                  role === 'admin'
                    ? 'bg-purple-500/20 border-purple-500 text-purple-300'
                    : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                <ShieldAlert className="w-4 h-4 text-purple-400" />
                <span>Admin</span>
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-white font-semibold text-sm shadow-md shadow-cyan-500/20 transition-all mt-2"
          >
            {loading ? 'Creating Account...' : 'Create Account'}
          </button>
        </form>
      </div>

      <p className="text-center text-xs text-slate-500">
        Already registered?{' '}
        <Link href="/auth/login" className="text-cyan-400 hover:underline font-semibold">
          Log in
        </Link>
      </p>
    </div>
  );
}
