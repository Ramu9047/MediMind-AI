'use client';

import React from 'react';
import Link from 'next/link';
import { Activity, ShieldCheck, Heart, Sparkles } from 'lucide-react';
import ECGPulseLine from './ECGPulseLine';

export default function Footer() {
  return (
    <footer className="border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-darkSurface transition-colors mt-16">
      {/* Animated ECG Pulse Divider above footer */}
      <ECGPulseLine variant="divider" color="teal" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="space-y-3 md:col-span-1">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-tealPrimary flex items-center justify-center text-white">
                <Activity className="w-4 h-4" />
              </div>
              <span className="font-heading font-bold text-base text-ink dark:text-white">MediMind AI</span>
            </div>
            <p className="text-xs text-inkMuted leading-relaxed">
              Clinical healthcare coordination platform bridging statistical ML predictions, physician consultations, and lab diagnostics.
            </p>
          </div>

          {/* Quick Nav */}
          <div>
            <h4 className="font-heading font-semibold text-xs text-ink dark:text-white uppercase tracking-wider mb-3">Clinical Modules</h4>
            <ul className="space-y-2 text-xs text-inkMuted">
              <li>
                <Link href="/patient/symptom-checker" className="hover:text-tealPrimary transition-colors">
                  Symptom Evaluator & ML Model
                </Link>
              </li>
              <li>
                <Link href="/patient/dashboard" className="hover:text-tealPrimary transition-colors">
                  Patient Health Timeline
                </Link>
              </li>
              <li>
                <Link href="/doctor/dashboard" className="hover:text-tealPrimary transition-colors">
                  Physician Consultation Queue
                </Link>
              </li>
              <li>
                <Link href="/lab/dashboard" className="hover:text-tealPrimary transition-colors">
                  Diagnostic Lab Workflows
                </Link>
              </li>
            </ul>
          </div>

          {/* Precision Stack & Standards */}
          <div>
            <h4 className="font-heading font-semibold text-xs text-ink dark:text-white uppercase tracking-wider mb-3">System Precision</h4>
            <ul className="space-y-2 text-xs text-inkMuted font-mono">
              <li className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-tealPrimary"></span>
                <span>FastAPI + MongoDB Atlas</span>
              </li>
              <li className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-tealPrimary"></span>
                <span>41-Disease ML Random Forest</span>
              </li>
              <li className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-tealPrimary"></span>
                <span>LLM Clinical Reasoning</span>
              </li>
              <li className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-amberWarn"></span>
                <span>Audit Security Logs</span>
              </li>
            </ul>
          </div>

          {/* Disclaimer Note */}
          <div>
            <h4 className="font-heading font-semibold text-xs text-ink dark:text-white uppercase tracking-wider mb-3">Notice & Verification</h4>
            <p className="text-xs text-inkMuted leading-relaxed">
              Designed for clinical presentation and portfolio showcase. All diagnostic recommendations are for educational demonstration.
            </p>
          </div>
        </div>

        <div className="mt-8 pt-6 border-t border-slate-200 dark:border-slate-800/60 flex flex-col sm:flex-row items-center justify-between text-xs text-inkMuted gap-4">
          <p>© {new Date().getFullYear()} MediMind AI Platform. Built with clinical precision.</p>
          <div className="flex items-center gap-4">
            <span className="font-mono text-[11px] text-tealPrimary font-medium">v1.2.0-clinical</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
