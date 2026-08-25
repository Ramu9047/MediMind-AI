'use client';

import React, { useState } from 'react';
import { AlertCircle, ChevronDown, ChevronUp } from 'lucide-react';

export default function DisclaimerBanner() {
  const [expanded, setExpanded] = useState(false);

  return (
    <aside aria-label="Educational Disclaimer" className="bg-amber-500/10 dark:bg-amber-500/15 border-b border-amber-500/25 px-4 py-1.5 text-xs text-amber-900 dark:text-amber-200 font-medium transition-all">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0 flex-1">
          <AlertCircle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
          <p className="truncate text-xs">
            <strong className="font-semibold uppercase tracking-wider text-[11px] mr-1">Educational Demo Only:</strong>
            {expanded ? (
              <span>
                MediMind AI provides statistical educational information only and is not a substitute for professional medical advice, diagnosis, or treatment. Medicine reference data is sourced from FDA/RxNorm public databases and does not constitute a prescription. Always consult a licensed healthcare provider.
              </span>
            ) : (
              <span className="text-amber-800/90 dark:text-amber-300/90">
                MediMind AI provides statistical educational information only and is not a substitute for professional medical advice, diagnosis, or treatment.
              </span>
            )}
          </p>
        </div>
        <button
          onClick={() => setExpanded(!expanded)}
          className="shrink-0 text-[11px] font-mono font-semibold underline underline-offset-2 hover:text-amber-950 dark:hover:text-white flex items-center gap-0.5 px-2 py-0.5 rounded focus:outline-none focus:ring-1 focus:ring-amber-500"
          aria-expanded={expanded}
          aria-label={expanded ? "Hide full educational disclaimer" : "Show full educational disclaimer"}
        >
          <span>{expanded ? 'Hide Details' : 'Details'}</span>
          {expanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
        </button>
      </div>
    </aside>
  );
}
