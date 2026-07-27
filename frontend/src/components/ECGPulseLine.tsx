'use client';

import React from 'react';

interface ECGPulseLineProps {
  variant?: 'divider' | 'loader' | 'ring';
  color?: 'teal' | 'coral' | 'amber';
  height?: number;
  className?: string;
}

export default function ECGPulseLine({
  variant = 'divider',
  color = 'teal',
  height = 40,
  className = '',
}: ECGPulseLineProps) {
  const strokeColorMap = {
    teal: '#0F9B8E',
    coral: '#F97362',
    amber: '#F5A623',
  };

  const stroke = strokeColorMap[color] || strokeColorMap.teal;

  if (variant === 'divider') {
    return (
      <div className={`w-full overflow-hidden py-4 flex items-center justify-center opacity-85 ${className}`}>
        <svg
          viewBox="0 0 1200 40"
          className="w-full h-10 max-w-6xl"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Subtle baseline track */}
          <line
            x1="0"
            y1="20"
            x2="1200"
            y2="20"
            stroke={stroke}
            strokeOpacity="0.15"
            strokeWidth="1.5"
          />
          {/* Animated sweep line with ECG heartbeat spikes */}
          <path
            d="M 0 20 L 400 20 L 415 20 L 422 8 L 430 32 L 438 2 L 446 38 L 452 20 L 460 20 L 750 20 L 765 20 L 772 8 L 780 32 L 788 2 L 796 38 L 802 20 L 810 20 L 1200 20"
            stroke={stroke}
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="animate-ecg-sweep"
          />
        </svg>
      </div>
    );
  }

  if (variant === 'loader') {
    return (
      <div className={`flex items-center justify-center w-full ${className}`}>
        <svg
          viewBox="0 0 300 40"
          className="w-full h-10 max-w-xs"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <line
            x1="0"
            y1="20"
            x2="300"
            y2="20"
            stroke={stroke}
            strokeOpacity="0.2"
            strokeWidth="1.5"
          />
          <path
            d="M 0 20 L 100 20 L 110 20 L 116 8 L 122 32 L 128 4 L 134 36 L 140 20 L 148 20 L 300 20"
            stroke={stroke}
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="animate-pulse-loading"
          />
        </svg>
      </div>
    );
  }

  // Ring variant for circular risk/confidence meter
  return (
    <svg
      viewBox="0 0 100 24"
      className={`w-16 h-6 ${className}`}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M 0 12 L 35 12 L 40 4 L 45 20 L 50 1 L 55 23 L 60 12 L 100 12"
        stroke={stroke}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="animate-pulse-loading"
      />
    </svg>
  );
}
