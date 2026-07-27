'use client';

import React from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import {
  Activity,
  Stethoscope,
  FlaskConical,
  ShieldCheck,
  ArrowRight,
  Sparkles,
  FileText,
  Clock,
  CheckCircle2,
  Lock,
  ChevronRight,
  Database,
  Search,
} from 'lucide-react';
import ECGPulseLine from '@/components/ECGPulseLine';

export default function LandingPage() {
  const { user, quickLogin } = useAuth();
  const router = useRouter();

  const handleRoleQuickLogin = async (role: 'patient' | 'doctor' | 'lab' | 'admin') => {
    if (role === 'admin') {
      router.push('/auth/login');
      return;
    }
    try {
      await quickLogin(role);
      if (role === 'patient') router.push('/patient/symptom-checker');
      else if (role === 'doctor') router.push('/doctor/dashboard');
      else if (role === 'lab') router.push('/lab/dashboard');
    } catch (e) {
      router.push('/auth/login');
    }
  };

  return (
    <div className="space-y-16 py-4 animate-card-rise">
      {/* HERO SECTION */}
      <section className="relative rounded-3xl p-8 md:p-12 bg-gradient-to-br from-mistTeal via-white to-bgLight dark:from-darkSurface dark:via-darkBg dark:to-darkSurface border border-slate-200/80 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="max-w-3xl space-y-6 relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-tealPrimary/10 border border-tealPrimary/20 text-tealPrimary text-xs font-semibold font-mono tracking-tight">
            <Activity className="w-3.5 h-3.5" />
            <span>CLINICAL HEALTHCARE COORDINATION ENGINE</span>
          </div>

          <h1 className="text-3xl md:text-5xl font-heading font-extrabold text-ink dark:text-white leading-tight">
            One Unified Platform from <br />
            <span className="text-tealPrimary">Symptom Check</span> to <span className="text-tealDeep">Lab Result</span>.
          </h1>

          <p className="text-base text-inkMuted dark:text-slate-300 leading-relaxed font-normal">
            MediMind AI bridges the disconnect between statistical machine learning predictions, physician consultations, and diagnostic labs. Patients receive AI-evaluated symptom insights, book consultations directly, and view plain-language lab report summaries in a single timeline.
          </p>

          <div className="flex flex-wrap items-center gap-4 pt-2">
            <Link href="/patient/symptom-checker" className="btn-teal flex items-center gap-2 text-sm">
              <span>Launch Symptom Evaluator</span>
              <ArrowRight className="w-4 h-4" />
            </Link>

            <Link href="/patient/appointments" className="btn-coral flex items-center gap-2 text-sm">
              <span>Book Consultation</span>
            </Link>

            <Link href="/faq" className="btn-outline flex items-center gap-2 text-sm">
              <Search className="w-4 h-4" />
              <span>Medical FAQ Engine</span>
            </Link>
          </div>

          {/* Precision Badges */}
          <div className="pt-4 grid grid-cols-1 sm:grid-cols-3 gap-3 border-t border-slate-200/80 dark:border-slate-800 text-xs font-mono text-inkMuted">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-tealPrimary shrink-0" />
              <span>FastAPI + MongoDB Atlas</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-tealPrimary shrink-0" />
              <span>41-Disease ML Random Forest</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-tealPrimary shrink-0" />
              <span>LLM Plain-Language Reasoner</span>
            </div>
          </div>
        </div>
      </section>

      {/* SIGNATURE MOTIF: ANIMATED ECG PULSE LINE DIVIDER */}
      <ECGPulseLine variant="divider" color="teal" />

      {/* QUICK ROLE DEMO LOGINS */}
      <section className="space-y-6">
        <div className="text-center max-w-xl mx-auto space-y-2">
          <h2 className="text-2xl font-heading font-bold text-ink dark:text-white">Explore Role Portals</h2>
          <p className="text-sm text-inkMuted">Experience the complete healthcare journey across all 4 user roles with instant demo access.</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Patient */}
          <div className="clinical-card p-6 space-y-4 flex flex-col justify-between hover:-translate-y-1">
            <div className="space-y-3">
              <div className="w-10 h-10 rounded-xl bg-tealPrimary/10 text-tealPrimary flex items-center justify-center">
                <Activity className="w-5 h-5" />
              </div>
              <h3 className="font-heading font-bold text-lg text-ink dark:text-white">Patient Portal</h3>
              <p className="text-xs text-inkMuted leading-relaxed">
                Run 41-disease ML classification, view vitals trend charts, book appointments, and access lab summaries.
              </p>
            </div>
            <button
              onClick={() => handleRoleQuickLogin('patient')}
              className="w-full py-2.5 rounded-xl bg-mistTeal dark:bg-slate-800 text-tealPrimary font-semibold text-xs flex items-center justify-center gap-1.5 hover:bg-tealPrimary hover:text-white transition-all"
            >
              <span>Demo Patient Portal</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Doctor */}
          <div className="clinical-card p-6 space-y-4 flex flex-col justify-between hover:-translate-y-1">
            <div className="space-y-3">
              <div className="w-10 h-10 rounded-xl bg-tealPrimary/10 text-tealPrimary flex items-center justify-center">
                <Stethoscope className="w-5 h-5" />
              </div>
              <h3 className="font-heading font-bold text-lg text-ink dark:text-white">Physician Queue</h3>
              <p className="text-xs text-inkMuted leading-relaxed">
                Review patient consultation requests, inspect symptom prediction history, and add clinical notes.
              </p>
            </div>
            <button
              onClick={() => handleRoleQuickLogin('doctor')}
              className="w-full py-2.5 rounded-xl bg-mistTeal dark:bg-slate-800 text-tealPrimary font-semibold text-xs flex items-center justify-center gap-1.5 hover:bg-tealPrimary hover:text-white transition-all"
            >
              <span>Demo Doctor Portal</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Lab Tech */}
          <div className="clinical-card p-6 space-y-4 flex flex-col justify-between hover:-translate-y-1">
            <div className="space-y-3">
              <div className="w-10 h-10 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center">
                <FlaskConical className="w-5 h-5" />
              </div>
              <h3 className="font-heading font-bold text-lg text-ink dark:text-white">Diagnostic Lab</h3>
              <p className="text-xs text-inkMuted leading-relaxed">
                Manage test sample status, upload PDF reports, and trigger automatic LLM report summarization.
              </p>
            </div>
            <button
              onClick={() => handleRoleQuickLogin('lab')}
              className="w-full py-2.5 rounded-xl bg-purple-50 dark:bg-slate-800 text-purple-600 dark:text-purple-400 font-semibold text-xs flex items-center justify-center gap-1.5 hover:bg-purple-600 hover:text-white transition-all"
            >
              <span>Demo Lab Portal</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Admin */}
          <div className="clinical-card p-6 space-y-4 flex flex-col justify-between hover:-translate-y-1">
            <div className="space-y-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amberWarn flex items-center justify-center">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <h3 className="font-heading font-bold text-lg text-ink dark:text-white">Admin Security</h3>
              <p className="text-xs text-inkMuted leading-relaxed">
                Monitor system metrics, review audit security trail events, and verify environment security state.
              </p>
            </div>
            <button
              onClick={() => handleRoleQuickLogin('admin')}
              className="w-full py-2.5 rounded-xl bg-amber-50 dark:bg-slate-800 text-amberWarn font-semibold text-xs flex items-center justify-center gap-1.5 hover:bg-amberWarn hover:text-white transition-all"
            >
              <span>Admin Security Portal</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </section>

      {/* SECOND ECG DIVIDER */}
      <ECGPulseLine variant="divider" color="coral" />

      {/* END-TO-END WORKFLOW DIAGRAM */}
      <section className="space-y-8">
        <div className="text-center max-w-2xl mx-auto space-y-2">
          <h2 className="text-2xl font-heading font-bold text-ink dark:text-white">Connected End-to-End Clinical Journey</h2>
          <p className="text-sm text-inkMuted">A seamless flow connecting symptom evaluation, physician consultation, diagnostic testing, and unified timeline history.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 relative">
          <div className="clinical-card p-5 space-y-3 bg-white dark:bg-darkSurface">
            <div className="font-mono text-xs text-tealPrimary font-semibold">STEP 01</div>
            <h4 className="font-heading font-bold text-base text-ink dark:text-white">Symptom Evaluation</h4>
            <p className="text-xs text-inkMuted leading-relaxed">
              Patient selects symptoms from 132 indicators. Random Forest evaluates similarity across 41 diseases.
            </p>
          </div>

          <div className="clinical-card p-5 space-y-3 bg-white dark:bg-darkSurface">
            <div className="font-mono text-xs text-tealPrimary font-semibold">STEP 02</div>
            <h4 className="font-heading font-bold text-base text-ink dark:text-white">LLM Explanation</h4>
            <p className="text-xs text-inkMuted leading-relaxed">
              Generates non-diagnostic clinical reasoning, precautions, and recommends matching medical specialists.
            </p>
          </div>

          <div className="clinical-card p-5 space-y-3 bg-white dark:bg-darkSurface">
            <div className="font-mono text-xs text-tealPrimary font-semibold">STEP 03</div>
            <h4 className="font-heading font-bold text-base text-ink dark:text-white">Doctor & Lab Order</h4>
            <p className="text-xs text-inkMuted leading-relaxed">
              Patient books consultation or lab test directly from prediction results. Doctor inspects full context.
            </p>
          </div>

          <div className="clinical-card p-5 space-y-3 bg-white dark:bg-darkSurface">
            <div className="font-mono text-xs text-tealPrimary font-semibold">STEP 04</div>
            <h4 className="font-heading font-bold text-base text-ink dark:text-white">Unified Timeline</h4>
            <p className="text-xs text-inkMuted leading-relaxed">
              Lab uploads report; AI summarizes metrics; everything consolidates into the patient's medical history timeline.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
