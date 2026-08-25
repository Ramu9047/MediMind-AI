'use client';

import React, { useState, useEffect, useRef } from 'react';
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
  Pill,
  FolderKanban,
  ChevronDown,
  Menu,
  X,
  LayoutDashboard,
} from 'lucide-react';

export default function Navbar() {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();

  const [recordsOpen, setRecordsOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const mobileMenuRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setRecordsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Close menus on Escape key
  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setRecordsOpen(false);
        setMobileOpen(false);
      }
    }
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Close mobile menu on route change
  useEffect(() => {
    setMobileOpen(false);
    setRecordsOpen(false);
  }, [pathname]);

  const getRoleBadge = () => {
    if (!user) return null;
    switch (user.role) {
      case 'doctor':
        return (
          <span className="bg-teal-500/10 text-tealPrimary dark:text-teal-400 border border-teal-500/30 px-1.5 py-0.5 rounded-md text-[10px] font-mono uppercase tracking-wider font-semibold flex items-center gap-1">
            <Stethoscope className="w-3 h-3 shrink-0" /> Doctor
          </span>
        );
      case 'lab':
        return (
          <span className="bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/30 px-1.5 py-0.5 rounded-md text-[10px] font-mono uppercase tracking-wider font-semibold flex items-center gap-1">
            <FlaskConical className="w-3 h-3 shrink-0" /> Lab Tech
          </span>
        );
      case 'admin':
        return (
          <span className="bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/30 px-1.5 py-0.5 rounded-md text-[10px] font-mono uppercase tracking-wider font-semibold flex items-center gap-1">
            <ShieldCheck className="w-3 h-3 shrink-0" /> Admin
          </span>
        );
      default:
        return (
          <span className="bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border border-cyan-500/30 px-1.5 py-0.5 rounded-md text-[10px] font-mono uppercase tracking-wider font-semibold flex items-center gap-1">
            <UserCheck className="w-3 h-3 shrink-0" /> Patient
          </span>
        );
    }
  };

  const getInitials = (name: string) => {
    if (!name) return 'U';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  const handleDropdownKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      setRecordsOpen(prev => !prev);
    }
  };

  // Role-based links configuration
  const role = user?.role || 'visitor';

  const isPatientOrVisitor = !user || role === 'patient';
  const isDoctor = role === 'doctor';
  const isLab = role === 'lab';
  const isAdmin = role === 'admin';

  // Check if any link inside records dropdown is active
  const isRecordsActive =
    pathname === '/patient/dashboard' ||
    pathname === '/patient/lab-tests' ||
    pathname === '/patient/history' ||
    pathname === '/faq';

  return (
    <header className="sticky top-0 z-40 bg-white/95 dark:bg-darkSurface/95 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">

        {/* Logo Block */}
        <Link href="/" className="flex items-center gap-2.5 group shrink-0">
          <div className="w-9 h-9 rounded-xl bg-tealPrimary flex items-center justify-center text-white shadow-sm transition-transform group-hover:scale-105">
            <Activity className="w-5 h-5 stroke-[2.5]" />
          </div>
          <div>
            <div className="font-heading font-bold text-base sm:text-lg text-ink dark:text-white tracking-tight flex items-center gap-1">
              MediMind <span className="text-tealPrimary font-normal text-xs sm:text-sm">AI</span>
            </div>
            <p className="hidden xl:block text-[9.5px] text-inkMuted uppercase tracking-wider font-medium font-sans">Clinical Coordination</p>
          </div>
        </Link>

        {/* Desktop Grouped Navigation (>= 900px) */}
        <nav className="hidden min-[900px]:flex items-center gap-1.5 text-xs font-medium" aria-label="Desktop Navigation">

          {/* Overview Link */}
          <Link
            href="/"
            className={`px-3 py-1.5 rounded-xl transition-all flex items-center gap-1.5 ${
              pathname === '/'
                ? 'bg-mistTeal dark:bg-slate-800 text-tealPrimary dark:text-teal-400 font-bold shadow-xs'
                : 'text-inkMuted hover:text-ink dark:hover:text-white'
            }`}
          >
            <LayoutDashboard className="w-3.5 h-3.5" />
            <span>Overview</span>
          </Link>

          {/* Patient Primary Items */}
          {isPatientOrVisitor && (
            <>
              <Link
                href="/patient/symptom-checker"
                className={`px-3 py-1.5 rounded-xl transition-all flex items-center gap-1.5 ${
                  pathname.includes('/symptom-checker')
                    ? 'bg-mistTeal dark:bg-slate-800 text-tealPrimary dark:text-teal-400 font-bold shadow-xs'
                    : 'text-inkMuted hover:text-ink dark:hover:text-white'
                }`}
              >
                <Activity className="w-3.5 h-3.5 text-tealPrimary" />
                <span>Symptom Evaluator</span>
              </Link>

              <Link
                href="/medicine-hub"
                className={`px-3 py-1.5 rounded-xl transition-all flex items-center gap-1.5 ${
                  pathname.includes('/medicine-hub')
                    ? 'bg-mistTeal dark:bg-slate-800 text-tealPrimary dark:text-teal-400 font-bold shadow-xs'
                    : 'text-inkMuted hover:text-ink dark:hover:text-white'
                }`}
              >
                <Pill className="w-3.5 h-3.5 text-blue-500" />
                <span>Medicine Hub</span>
              </Link>

              {user && (
                <Link
                  href="/patient/appointments"
                  className={`px-3 py-1.5 rounded-xl transition-all flex items-center gap-1.5 ${
                    pathname === '/patient/appointments'
                      ? 'bg-mistTeal dark:bg-slate-800 text-tealPrimary dark:text-teal-400 font-bold shadow-xs'
                      : 'text-inkMuted hover:text-ink dark:hover:text-white'
                  }`}
                >
                  <Calendar className="w-3.5 h-3.5" />
                  <span>Appointments</span>
                </Link>
              )}
            </>
          )}

          {/* Doctor Primary Items */}
          {isDoctor && (
            <>
              <Link
                href="/doctor/dashboard"
                className={`px-3 py-1.5 rounded-xl transition-all flex items-center gap-1.5 ${
                  pathname.includes('/doctor')
                    ? 'bg-mistTeal dark:bg-slate-800 text-tealPrimary dark:text-teal-400 font-bold shadow-xs'
                    : 'text-inkMuted hover:text-ink dark:hover:text-white'
                }`}
              >
                <Stethoscope className="w-3.5 h-3.5 text-tealPrimary" />
                <span>Physician Consult Queue</span>
              </Link>

              <Link
                href="/medicine-hub"
                className={`px-3 py-1.5 rounded-xl transition-all flex items-center gap-1.5 ${
                  pathname.includes('/medicine-hub')
                    ? 'bg-mistTeal dark:bg-slate-800 text-tealPrimary dark:text-teal-400 font-bold shadow-xs'
                    : 'text-inkMuted hover:text-ink dark:hover:text-white'
                }`}
              >
                <Pill className="w-3.5 h-3.5 text-blue-500" />
                <span>Medicine Hub</span>
              </Link>
            </>
          )}

          {/* Lab Tech Primary Items */}
          {isLab && (
            <Link
              href="/lab/dashboard"
              className={`px-3 py-1.5 rounded-xl transition-all flex items-center gap-1.5 ${
                pathname.includes('/lab')
                  ? 'bg-purple-500/10 text-purple-600 dark:text-purple-400 font-bold shadow-xs'
                  : 'text-inkMuted hover:text-ink dark:hover:text-white'
              }`}
            >
              <FlaskConical className="w-3.5 h-3.5 text-purple-600" />
              <span>Lab Portal</span>
            </Link>
          )}

          {/* Admin Primary Items */}
          {isAdmin && (
            <>
              <Link
                href="/admin/dashboard"
                className={`px-3 py-1.5 rounded-xl transition-all flex items-center gap-1.5 ${
                  pathname.includes('/admin')
                    ? 'bg-amber-500/10 text-amberWarn font-bold shadow-xs'
                    : 'text-inkMuted hover:text-ink dark:hover:text-white'
                }`}
              >
                <ShieldCheck className="w-3.5 h-3.5 text-amberWarn" />
                <span>Admin Portal</span>
              </Link>

              <Link
                href="/medicine-hub"
                className={`px-3 py-1.5 rounded-xl transition-all flex items-center gap-1.5 ${
                  pathname.includes('/medicine-hub')
                    ? 'bg-mistTeal dark:bg-slate-800 text-tealPrimary dark:text-teal-400 font-bold shadow-xs'
                    : 'text-inkMuted hover:text-ink dark:hover:text-white'
                }`}
              >
                <Pill className="w-3.5 h-3.5 text-blue-500" />
                <span>Medicine Hub</span>
              </Link>
            </>
          )}

          {/* Records Grouped Dropdown Trigger */}
          <div className="relative" ref={dropdownRef}>
            <button
              type="button"
              onClick={() => setRecordsOpen(prev => !prev)}
              onKeyDown={handleDropdownKeyDown}
              aria-expanded={recordsOpen}
              aria-haspopup="true"
              className={`px-3 py-1.5 rounded-xl transition-all flex items-center gap-1.5 focus:outline-none focus:ring-2 focus:ring-tealPrimary/30 ${
                isRecordsActive || recordsOpen
                  ? 'bg-slate-100 dark:bg-slate-800 text-ink dark:text-white font-bold'
                  : 'text-inkMuted hover:text-ink dark:hover:text-white'
              }`}
            >
              <FolderKanban className="w-3.5 h-3.5 text-tealPrimary" />
              <span>Records</span>
              <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${recordsOpen ? 'rotate-180' : ''}`} />
            </button>

            {/* Dropdown Menu Panel */}
            {recordsOpen && (
              <div
                className="absolute right-0 mt-2 w-56 bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-800 py-2 z-50 animate-card-rise"
                role="menu"
                aria-orientation="vertical"
              >
                {isPatientOrVisitor && user && (
                  <>
                    <Link
                      href="/patient/dashboard"
                      role="menuitem"
                      onClick={() => setRecordsOpen(false)}
                      className={`flex items-center gap-2.5 px-4 py-2 text-xs hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors ${
                        pathname === '/patient/dashboard' ? 'text-tealPrimary font-bold bg-teal-500/5' : 'text-ink dark:text-slate-200'
                      }`}
                    >
                      <Activity className="w-4 h-4 text-tealPrimary shrink-0" />
                      <span>Vitals &amp; Timeline</span>
                    </Link>

                    <Link
                      href="/patient/lab-tests"
                      role="menuitem"
                      onClick={() => setRecordsOpen(false)}
                      className={`flex items-center gap-2.5 px-4 py-2 text-xs hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors ${
                        pathname === '/patient/lab-tests' ? 'text-tealPrimary font-bold bg-teal-500/5' : 'text-ink dark:text-slate-200'
                      }`}
                    >
                      <FlaskConical className="w-4 h-4 text-purple-500 shrink-0" />
                      <span>Lab Orders</span>
                    </Link>

                    <Link
                      href="/patient/history"
                      role="menuitem"
                      onClick={() => setRecordsOpen(false)}
                      className={`flex items-center gap-2.5 px-4 py-2 text-xs hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors ${
                        pathname === '/patient/history' ? 'text-tealPrimary font-bold bg-teal-500/5' : 'text-ink dark:text-slate-200'
                      }`}
                    >
                      <Clock className="w-4 h-4 text-amber-500 shrink-0" />
                      <span>Medical History</span>
                    </Link>
                  </>
                )}

                {isDoctor && (
                  <>
                    <Link
                      href="/patient/dashboard"
                      role="menuitem"
                      onClick={() => setRecordsOpen(false)}
                      className="flex items-center gap-2.5 px-4 py-2 text-xs text-ink dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800/60"
                    >
                      <Activity className="w-4 h-4 text-tealPrimary shrink-0" />
                      <span>Patient Timeline Review</span>
                    </Link>

                    <Link
                      href="/patient/lab-tests"
                      role="menuitem"
                      onClick={() => setRecordsOpen(false)}
                      className="flex items-center gap-2.5 px-4 py-2 text-xs text-ink dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800/60"
                    >
                      <FlaskConical className="w-4 h-4 text-purple-500 shrink-0" />
                      <span>Diagnostic Lab Results</span>
                    </Link>
                  </>
                )}

                <div className="my-1 border-t border-slate-100 dark:border-slate-800" />

                <Link
                  href="/faq"
                  role="menuitem"
                  onClick={() => setRecordsOpen(false)}
                  className={`flex items-center gap-2.5 px-4 py-2 text-xs hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors ${
                    pathname === '/faq' ? 'text-tealPrimary font-bold bg-teal-500/5' : 'text-ink dark:text-slate-200'
                  }`}
                >
                  <HelpCircle className="w-4 h-4 text-blue-500 shrink-0" />
                  <span>FAQ Engine</span>
                </Link>
              </div>
            )}
          </div>
        </nav>

        {/* Right Header Actions & Hamburger Trigger */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          {/* Light / Dark Mode Toggle */}
          <button
            onClick={toggleTheme}
            className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-inkMuted hover:text-tealPrimary dark:hover:text-teal-400 transition-colors"
            title="Toggle Light / Dark Mode"
            aria-label="Toggle theme"
          >
            {theme === 'dark' ? <Sun className="w-4 h-4 text-amberWarn" /> : <Moon className="w-4 h-4 text-slate-600" />}
          </button>

          {/* User Widget */}
          {user ? (
            <div className="flex items-center gap-2 pl-2 border-l border-slate-200 dark:border-slate-800">
              <div className="w-7 h-7 rounded-full bg-tealPrimary/15 text-tealPrimary font-mono font-bold text-xs flex items-center justify-center shrink-0 border border-tealPrimary/30">
                {getInitials(user.name)}
              </div>

              <div className="hidden min-[1000px]:block text-left max-w-[130px]">
                <div className="text-xs font-semibold text-ink dark:text-white truncate leading-tight">{user.name}</div>
                <div className="mt-0.5">{getRoleBadge()}</div>
              </div>

              <button
                onClick={logout}
                className="p-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-rose-500/10 text-slate-500 hover:text-dangerRed transition-colors"
                title="Log Out"
                aria-label="Log out"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-1.5 sm:gap-2">
              <Link href="/auth/login" className="btn-outline text-xs py-1.5 px-2.5">
                Sign In
              </Link>
              <Link href="/auth/signup" className="btn-teal text-xs py-1.5 px-2.5">
                Get Started
              </Link>
            </div>
          )}

          {/* Hamburger Menu Trigger Button (< 900px) */}
          <button
            type="button"
            onClick={() => setMobileOpen(prev => !prev)}
            className="min-[900px]:hidden p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-ink dark:text-white hover:text-tealPrimary transition-colors focus:outline-none focus:ring-2 focus:ring-tealPrimary/40"
            aria-expanded={mobileOpen}
            aria-label={mobileOpen ? "Close menu" : "Open menu"}
          >
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Full-Width Mobile Slide-Down Panel (< 900px) */}
      {mobileOpen && (
        <div
          ref={mobileMenuRef}
          className="min-[900px]:hidden border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-4 py-4 space-y-5 animate-card-rise shadow-2xl"
        >
          {/* User Header in Mobile Panel */}
          {user && (
            <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/60">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-full bg-tealPrimary text-white font-mono font-bold text-xs flex items-center justify-center">
                  {getInitials(user.name)}
                </div>
                <div>
                  <div className="text-xs font-bold text-ink dark:text-white">{user.name}</div>
                  <div className="mt-0.5">{getRoleBadge()}</div>
                </div>
              </div>

              <button
                onClick={logout}
                className="text-xs font-mono font-semibold text-rose-500 hover:underline flex items-center gap-1"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Log Out</span>
              </button>
            </div>
          )}

          {/* Primary Navigation Section */}
          <div className="space-y-1">
            <div className="text-[10px] font-mono font-bold uppercase tracking-wider text-inkMuted px-2 mb-1.5">
              Primary Actions
            </div>

            <Link
              href="/"
              onClick={() => setMobileOpen(false)}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-medium transition-colors ${
                pathname === '/' ? 'bg-mistTeal dark:bg-slate-800 text-tealPrimary font-bold' : 'text-ink dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              <LayoutDashboard className="w-4 h-4 text-tealPrimary" />
              <span>Overview</span>
            </Link>

            {isPatientOrVisitor && (
              <>
                <Link
                  href="/patient/symptom-checker"
                  onClick={() => setMobileOpen(false)}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-medium transition-colors ${
                    pathname.includes('/symptom-checker') ? 'bg-mistTeal dark:bg-slate-800 text-tealPrimary font-bold' : 'text-ink dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                >
                  <Activity className="w-4 h-4 text-tealPrimary" />
                  <span>Symptom Evaluator</span>
                </Link>

                <Link
                  href="/medicine-hub"
                  onClick={() => setMobileOpen(false)}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-medium transition-colors ${
                    pathname.includes('/medicine-hub') ? 'bg-mistTeal dark:bg-slate-800 text-tealPrimary font-bold' : 'text-ink dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                >
                  <Pill className="w-4 h-4 text-blue-500" />
                  <span>Medicine Hub</span>
                </Link>

                {user && (
                  <Link
                    href="/patient/appointments"
                    onClick={() => setMobileOpen(false)}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-medium transition-colors ${
                      pathname === '/patient/appointments' ? 'bg-mistTeal dark:bg-slate-800 text-tealPrimary font-bold' : 'text-ink dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800'
                    }`}
                  >
                    <Calendar className="w-4 h-4 text-tealPrimary" />
                    <span>Appointments</span>
                  </Link>
                )}
              </>
            )}

            {isDoctor && (
              <>
                <Link
                  href="/doctor/dashboard"
                  onClick={() => setMobileOpen(false)}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-medium transition-colors ${
                    pathname.includes('/doctor') ? 'bg-mistTeal dark:bg-slate-800 text-tealPrimary font-bold' : 'text-ink dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                >
                  <Stethoscope className="w-4 h-4 text-tealPrimary" />
                  <span>Physician Consult Queue</span>
                </Link>

                <Link
                  href="/medicine-hub"
                  onClick={() => setMobileOpen(false)}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-medium transition-colors ${
                    pathname.includes('/medicine-hub') ? 'bg-mistTeal dark:bg-slate-800 text-tealPrimary font-bold' : 'text-ink dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                >
                  <Pill className="w-4 h-4 text-blue-500" />
                  <span>Medicine Hub</span>
                </Link>
              </>
            )}

            {isLab && (
              <Link
                href="/lab/dashboard"
                onClick={() => setMobileOpen(false)}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-medium transition-colors ${
                  pathname.includes('/lab') ? 'bg-purple-500/10 text-purple-600 font-bold' : 'text-ink dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                <FlaskConical className="w-4 h-4 text-purple-600" />
                <span>Lab Diagnostic Portal</span>
              </Link>
            )}

            {isAdmin && (
              <>
                <Link
                  href="/admin/dashboard"
                  onClick={() => setMobileOpen(false)}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-medium transition-colors ${
                    pathname.includes('/admin') ? 'bg-amber-500/10 text-amberWarn font-bold' : 'text-ink dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                >
                  <ShieldCheck className="w-4 h-4 text-amberWarn" />
                  <span>Admin Security &amp; Staff Provisioning</span>
                </Link>

                <Link
                  href="/medicine-hub"
                  onClick={() => setMobileOpen(false)}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-medium transition-colors ${
                    pathname.includes('/medicine-hub') ? 'bg-mistTeal dark:bg-slate-800 text-tealPrimary font-bold' : 'text-ink dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                >
                  <Pill className="w-4 h-4 text-blue-500" />
                  <span>Medicine Hub</span>
                </Link>
              </>
            )}
          </div>

          {/* Records & Reference Section */}
          <div className="space-y-1 pt-2 border-t border-slate-100 dark:border-slate-800">
            <div className="text-[10px] font-mono font-bold uppercase tracking-wider text-inkMuted px-2 mb-1.5">
              Records &amp; Reference
            </div>

            {isPatientOrVisitor && user && (
              <>
                <Link
                  href="/patient/dashboard"
                  onClick={() => setMobileOpen(false)}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-medium transition-colors ${
                    pathname === '/patient/dashboard' ? 'bg-mistTeal dark:bg-slate-800 text-tealPrimary font-bold' : 'text-ink dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                >
                  <Activity className="w-4 h-4 text-tealPrimary" />
                  <span>Vitals &amp; Timeline</span>
                </Link>

                <Link
                  href="/patient/lab-tests"
                  onClick={() => setMobileOpen(false)}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-medium transition-colors ${
                    pathname === '/patient/lab-tests' ? 'bg-mistTeal dark:bg-slate-800 text-tealPrimary font-bold' : 'text-ink dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                >
                  <FlaskConical className="w-4 h-4 text-purple-500" />
                  <span>Lab Orders</span>
                </Link>

                <Link
                  href="/patient/history"
                  onClick={() => setMobileOpen(false)}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-medium transition-colors ${
                    pathname === '/patient/history' ? 'bg-mistTeal dark:bg-slate-800 text-tealPrimary font-bold' : 'text-ink dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                >
                  <Clock className="w-4 h-4 text-amber-500" />
                  <span>Medical History</span>
                </Link>
              </>
            )}

            {isDoctor && (
              <>
                <Link
                  href="/patient/dashboard"
                  onClick={() => setMobileOpen(false)}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs text-ink dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 font-medium"
                >
                  <Activity className="w-4 h-4 text-tealPrimary" />
                  <span>Patient Timeline Review</span>
                </Link>

                <Link
                  href="/patient/lab-tests"
                  onClick={() => setMobileOpen(false)}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs text-ink dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 font-medium"
                >
                  <FlaskConical className="w-4 h-4 text-purple-500" />
                  <span>Diagnostic Lab Results</span>
                </Link>
              </>
            )}

            <Link
              href="/faq"
              onClick={() => setMobileOpen(false)}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-medium transition-colors ${
                pathname === '/faq' ? 'bg-mistTeal dark:bg-slate-800 text-tealPrimary font-bold' : 'text-ink dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              <HelpCircle className="w-4 h-4 text-blue-500" />
              <span>FAQ Engine</span>
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
