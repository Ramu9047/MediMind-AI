'use client';

import React from 'react';
import { AlertCircle } from 'lucide-react';

export default function DisclaimerBanner() {
  return (
    <div className="bg-amber-500/10 dark:bg-amber-500/15 border-b border-amber-500/25 px-4 py-2.5 text-xs text-amber-900 dark:text-amber-200 font-medium">
      <div className="max-w-7xl mx-auto flex items-center justify-center gap-2 text-center">
        <AlertCircle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
        <span>
          <strong className="font-semibold uppercase tracking-wider text-[11px] mr-1">Educational Demo Only:</strong>
          MediMind AI provides statistical educational information only and is not a substitute for professional medical advice, diagnosis, or treatment. Medicine reference data is sourced from FDA/RxNorm public databases and does not constitute a prescription. Always consult a licensed healthcare provider.
        </span>
      </div>
    </div>
  );
}
