'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { fetchApi } from '@/lib/api';
import { Clock, Activity, Stethoscope, FlaskConical, FileText } from 'lucide-react';

export default function MedicalHistoryPage() {
  const { user } = useAuth();
  const [timeline, setTimeline] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchApi('/patient/timeline')
      .then((data) => setTimeline(data || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const getEventIcon = (eventType: string) => {
    switch (eventType) {
      case 'Symptom Check':
        return <Activity className="w-4 h-4 text-tealPrimary" />;
      case 'Doctor Appointment':
        return <Stethoscope className="w-4 h-4 text-tealPrimary" />;
      case 'Lab Test':
        return <FlaskConical className="w-4 h-4 text-purple-600 dark:text-purple-400" />;
      case 'Report Analysis':
        return <FileText className="w-4 h-4 text-purple-600 dark:text-purple-400" />;
      default:
        return <Clock className="w-4 h-4 text-inkMuted" />;
    }
  };

  return (
    <div className="space-y-8 max-w-3xl mx-auto py-4 animate-card-rise">
      <div className="space-y-2 text-center">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-teal-500/10 border border-teal-500/30 text-tealPrimary dark:text-teal-400 text-xs font-mono font-semibold uppercase tracking-wider">
          <Clock className="w-3.5 h-3.5" />
          <span>Unified Patient Health Feed</span>
        </div>
        <h1 className="text-3xl font-heading font-extrabold text-ink dark:text-white">Medical History Timeline</h1>
        <p className="text-sm text-inkMuted">
          A continuous, integrated chronological record of your symptom checks, doctor visits, and lab report results.
        </p>
      </div>

      {loading ? (
        <div className="text-center py-12 text-xs text-inkMuted">Loading timeline...</div>
      ) : timeline.length > 0 ? (
        <div className="relative border-l-2 border-slate-200 dark:border-slate-800 ml-4 space-y-8 pl-6">
          {timeline.map((item) => (
            <div key={item._id || item.id} className="relative group">
              {/* Timeline Icon Node */}
              <div className="absolute -left-[35px] top-1 w-8 h-8 rounded-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 flex items-center justify-center shadow-sm">
                {getEventIcon(item.event_type)}
              </div>

              {/* Event Content Card */}
              <div className="clinical-card p-5 space-y-2 group-hover:border-tealPrimary/40 transition-colors">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="text-[11px] font-mono font-semibold text-tealPrimary uppercase tracking-wider">
                    {item.event_type}
                  </span>
                  <span className="text-[11px] text-inkMuted">
                    {item.timestamp ? new Date(item.timestamp).toLocaleString() : 'Recent'}
                  </span>
                </div>

                <h3 className="text-base font-heading font-bold text-ink dark:text-white">{item.title}</h3>
                <p className="text-xs text-inkMuted leading-relaxed">{item.description}</p>

                {item.status_badge && (
                  <span className="inline-block px-2.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-900 text-inkMuted text-[10px] font-mono font-semibold border border-slate-200 dark:border-slate-800 mt-1">
                    Status: {item.status_badge}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="clinical-card p-12 text-center text-xs text-inkMuted">
          No medical history timeline entries recorded yet.
        </div>
      )}
    </div>
  );
}
