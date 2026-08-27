'use client';

import React from 'react';

interface MediMindLogoProps {
  size?: 'sm' | 'md' | 'lg';
  showSubtitle?: boolean;
}

export default function MediMindLogo({ size = 'md', showSubtitle = true }: MediMindLogoProps) {
  const containerSize = size === 'sm' ? 'w-8 h-8' : size === 'lg' ? 'w-12 h-12' : 'w-10 h-10';
  const titleSize = size === 'sm' ? 'text-base' : size === 'lg' ? 'text-2xl' : 'text-lg';

  return (
    <div className="flex items-center gap-3 group shrink-0">
      <div className={`${containerSize} relative flex items-center justify-center shrink-0`}>
        {/* Soft Background Backlight */}
        <div className="absolute inset-0 rounded-full bg-teal-400/20 blur-sm group-hover:bg-teal-400/40 transition-all pointer-events-none" />

        <img
          src="/medimind-logo.svg"
          alt="MediMind AI Logo"
          className="w-full h-full object-contain relative z-10 filter drop-shadow-sm transition-transform duration-300 group-hover:scale-105"
        />
      </div>

      <div>
        <div className={`font-heading font-extrabold ${titleSize} text-ink dark:text-white tracking-tight flex items-center gap-1.5 leading-none`}>
          <span>MediMind</span>
          <span className="bg-gradient-to-r from-teal-500 to-cyan-500 text-white shadow-xs px-2 py-0.5 rounded-lg text-xs font-mono font-bold tracking-wider uppercase">
            AI
          </span>
        </div>
        {showSubtitle && (
          <p className="hidden xl:block text-[9.5px] text-inkMuted uppercase tracking-wider font-semibold font-mono mt-1">
            Clinical Coordination
          </p>
        )}
      </div>
    </div>
  );
}
