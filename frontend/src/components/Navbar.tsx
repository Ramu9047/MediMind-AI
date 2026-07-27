'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';
import {
  Activity,
  Stethoscope,
  FlaskConical,
  ShieldCheck,
  UserCheck,
  LogOut,
  Sun,
  Moon,
  HelpCircle,
  Clock,
  Calendar,
} from 'lucide-react';

export default function Navbar() {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();

  const getRoleBadge = () => {
    if (!user) return null;
    switch (user.role) {
      case 'doctor':
        return <span className="bg-teal-500/10 text-tealPrimary dark:text-teal-400 border border-teal-500/30 px-2 py-0.5 rounded-full text-[11px] font-mono uppercase tracking-wider font-semibold flex items-center gap-1"><Stethoscope className="w-3 h-3" /> Doctor</span>;
      case 'lab':
        return <span className="bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/30 px-2 py-0.5 rounded-full text-[11px] font-mono uppercase tracking-wider font-semibold flex items-center gap-1"><FlaskConical className="w-3 h-3" /> Lab Tech</span>;
      case 'admin':
        return <span className="bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/30 px-2 py-0.5 rounded-full text-[11px] font-mono uppercase tracking-wider font-semibold flex items-center gap-1"><ShieldCheck className="w-3 h-3" /> Admin</span>;
      default:
        return <span className="bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border border-cyan-500/30 px-2 py-0.5 rounded-full text-[11px] font-mono uppercase tracking-wider font-semibold flex items-center gap-1"><UserCheck className="w-3 h-3" /> Patient</span>;
    }
  };

  return (
    <header className="sticky top-0 z-40 bg-white/90 dark:bg-darkSurface/90 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="w-9 h-9 rounded-xl bg-tealPrimary flex items-center justify-center text-white shadow-sm transition-transform group-hover:scale-105">
            <Activity className="w-5 h-5 stroke-[2.5]" />
          </div>
          <div>
            <div className="font-heading font-bold text-lg text-ink dark:text-white tracking-tight flex items-center gap-1.5">
              MediMind <span className="text-tealPrimary font-normal text-sm">AI</span>
            </div>
            <p className="text-[10px] text-inkMuted uppercase tracking-wider font-medium font-sans">Clinical Coordination</p>
          </div>
        </Link>

        {/* Dynamic Navigation */}
        <nav className="hidden md:flex items-center gap-1 text-sm font-medium">
          <Link
            href="/"
            className={`px-3 py-1.5 rounded-lg transition-colors ${
              pathname === '/'
                ? 'bg-mistTeal dark:bg-slate-800 text-tealPrimary dark:text-teal-400 font-semibold'
                : 'text-inkMuted hover:text-ink dark:hover:text-white'
            }`}
          >
            Overview
          </Link>

          <Link
            href="/patient/symptom-checker"
            className={`px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5 ${
              pathname.includes('/symptom-checker')
                ? 'bg-mistTeal dark:bg-slate-800 text-tealPrimary dark:text-teal-400 font-semibold'
                : 'text-inkMuted hover:text-ink dark:hover:text-white'
            }`}
          >
            <Activity className="w-4 h-4 text-tealPrimary" />
            <span>Symptom Evaluator</span>
          </Link>

          {user && (
            <>
              {user.role === 'patient' && (
                <>
                  <Link
                    href="/patient/dashboard"
                    className={`px-3 py-1.5 rounded-lg transition-colors ${
                      pathname === '/patient/dashboard'
                        ? 'bg-mistTeal dark:bg-slate-800 text-tealPrimary dark:text-teal-400 font-semibold'
                        : 'text-inkMuted hover:text-ink dark:hover:text-white'
                    }`}
                  >
                    Vitals & Portal
                  </Link>
                  <Link
                    href="/patient/appointments"
                    className={`px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1 ${
                      pathname === '/patient/appointments'
                        ? 'bg-mistTeal dark:bg-slate-800 text-tealPrimary dark:text-teal-400 font-semibold'
                        : 'text-inkMuted hover:text-ink dark:hover:text-white'
                    }`}
                  >
                    <Calendar className="w-3.5 h-3.5" />
                    <span>Appointments</span>
                  </Link>
                </>
              )}

              {user.role === 'doctor' && (
                <Link
                  href="/doctor/dashboard"
                  className={`px-3 py-1.5 rounded-lg transition-colors ${
                    pathname.includes('/doctor')
                      ? 'bg-mistTeal dark:bg-slate-800 text-tealPrimary dark:text-teal-400 font-semibold'
                      : 'text-inkMuted hover:text-ink dark:hover:text-white'
                  }`}
                >
                  Doctor Consult Queue
                </Link>
              )}

              {user.role === 'lab' && (
                <Link
                  href="/lab/dashboard"
                  className={`px-3 py-1.5 rounded-lg transition-colors ${
                    pathname.includes('/lab')
                      ? 'bg-mistTeal dark:bg-slate-800 text-tealPrimary dark:text-teal-400 font-semibold'
                      : 'text-inkMuted hover:text-ink dark:hover:text-white'
                  }`}
                >
                  Lab Diagnostic Portal
                </Link>
              )}

              {user.role === 'admin' && (
                <Link
                  href="/admin/dashboard"
                  className={`px-3 py-1.5 rounded-lg transition-colors ${
                    pathname.includes('/admin')
                      ? 'bg-mistTeal dark:bg-slate-800 text-tealPrimary dark:text-teal-400 font-semibold'
                      : 'text-inkMuted hover:text-ink dark:hover:text-white'
                  }`}
                >
                  Admin Security
                </Link>
              )}
            </>
          )}

          <Link
            href="/faq"
            className={`px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1 ${
              pathname === '/faq'
                ? 'bg-mistTeal dark:bg-slate-800 text-tealPrimary dark:text-teal-400 font-semibold'
                : 'text-inkMuted hover:text-ink dark:hover:text-white'
            }`}
          >
            <HelpCircle className="w-3.5 h-3.5" />
            <span>FAQ Engine</span>
          </Link>
        </nav>

        {/* Right Actions: Theme Toggle & User Info */}
        <div className="flex items-center gap-3">
          {/* Light / Dark Mode Toggle */}
          <button
            onClick={toggleTheme}
            className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-inkMuted hover:text-tealPrimary dark:hover:text-teal-400 transition-colors"
            title="Toggle Light / Dark Mode"
          >
            {theme === 'dark' ? <Sun className="w-4 h-4 text-amberWarn" /> : <Moon className="w-4 h-4 text-slate-600" />}
          </button>

          {user ? (
            <div className="flex items-center gap-3 pl-2 border-l border-slate-200 dark:border-slate-800">
              <div className="hidden sm:block text-right">
                <div className="text-xs font-semibold text-ink dark:text-white leading-tight">{user.name}</div>
                <div className="mt-0.5">{getRoleBadge()}</div>
              </div>
              <button
                onClick={logout}
                className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-rose-500/10 text-slate-500 hover:text-dangerRed transition-colors"
                title="Log Out"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Link href="/auth/login" className="btn-outline text-xs py-2 px-3">
                Sign In
              </Link>
              <Link href="/auth/signup" className="btn-teal text-xs py-2 px-3">
                Get Started
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
