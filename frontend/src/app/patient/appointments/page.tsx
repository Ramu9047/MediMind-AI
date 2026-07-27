'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useSearchParams } from 'next/navigation';
import { fetchApi } from '@/lib/api';
import { Stethoscope, Calendar } from 'lucide-react';

function AppointmentsContent() {
  const searchParams = useSearchParams();
  const predId = searchParams.get('pred_id');
  const specialistParam = searchParams.get('specialist');

  const [doctors, setDoctors] = useState<any[]>([]);
  const [myAppointments, setMyAppointments] = useState<any[]>([]);
  const [selectedDoctor, setSelectedDoctor] = useState<any>(null);
  const [date, setDate] = useState('2026-07-28');
  const [time, setTime] = useState('10:30 AM');
  const [reason, setReason] = useState(
    specialistParam ? `Consultation regarding AI prediction for ${specialistParam}` : 'General consultation'
  );

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    fetchApi('/appointments/doctors')
      .then((data) => {
        setDoctors(data || []);
        if (data && data.length > 0) setSelectedDoctor(data[0]);
      })
      .catch(() => {});

    fetchApi('/appointments/my')
      .then((data) => setMyAppointments(data || []))
      .catch(() => {});
  }, []);

  const handleBook = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDoctor) return;
    setLoading(true);
    setMessage('');
    try {
      const res = await fetchApi('/appointments/book', {
        method: 'POST',
        body: JSON.stringify({
          doctor_id: selectedDoctor.id,
          doctor_name: selectedDoctor.name,
          appointment_date: date,
          appointment_time: time,
          reason,
          prediction_id: predId || null,
        }),
      });
      setMessage('Appointment request submitted successfully!');
      setMyAppointments([res, ...myAppointments]);
    } catch (err: any) {
      setMessage(err.message || 'Failed to book appointment');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8 max-w-4xl mx-auto py-4 animate-card-rise">
      <div className="space-y-2 text-center">
        <h1 className="text-3xl font-heading font-extrabold text-ink dark:text-white">Doctor Appointments</h1>
        <p className="text-sm text-inkMuted">Book consultations directly linked to your AI predictions and medical history</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
        
        {/* Booking Form */}
        <div className="md:col-span-5 clinical-card p-6 space-y-4">
          <h3 className="text-base font-heading font-bold text-ink dark:text-white flex items-center gap-2">
            <Stethoscope className="w-5 h-5 text-tealPrimary" />
            <span>Book Consultation</span>
          </h3>

          {message && (
            <div className="p-3 rounded-xl bg-teal-500/10 border border-teal-500/30 text-tealPrimary dark:text-teal-400 text-xs font-medium">
              {message}
            </div>
          )}

          <form onSubmit={handleBook} className="space-y-4">
            <div>
              <label className="block text-xs font-mono font-semibold text-inkMuted uppercase mb-1">Select Physician</label>
              <select
                value={selectedDoctor?.id || ''}
                onChange={(e) => {
                  const doc = doctors.find((d) => d.id === e.target.value);
                  setSelectedDoctor(doc);
                }}
                className="w-full p-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-ink dark:text-white focus:outline-none focus:border-tealPrimary"
              >
                {doctors.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name} ({d.specialization})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-mono font-semibold text-inkMuted uppercase mb-1">Preferred Date</label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full p-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-ink dark:text-white focus:outline-none focus:border-tealPrimary"
              />
            </div>

            <div>
              <label className="block text-xs font-mono font-semibold text-inkMuted uppercase mb-1">Preferred Time</label>
              <input
                type="text"
                value={time}
                onChange={(e) => setTime(e.target.value)}
                placeholder="e.g. 10:30 AM"
                className="w-full p-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-ink dark:text-white focus:outline-none focus:border-tealPrimary"
              />
            </div>

            <div>
              <label className="block text-xs font-mono font-semibold text-inkMuted uppercase mb-1">Reason for Visit</label>
              <textarea
                rows={3}
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                className="w-full p-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-ink dark:text-white focus:outline-none focus:border-tealPrimary"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full btn-teal py-3 font-semibold text-xs shadow-md"
            >
              {loading ? 'Submitting Request...' : 'Confirm Appointment Request'}
            </button>
          </form>
        </div>

        {/* Existing Appointments List */}
        <div className="md:col-span-7 space-y-4">
          <h3 className="text-base font-heading font-bold text-ink dark:text-white flex items-center gap-2">
            <Calendar className="w-5 h-5 text-tealPrimary" />
            <span>My Appointment History</span>
          </h3>

          <div className="space-y-3">
            {myAppointments.length > 0 ? (
              myAppointments.map((appt) => (
                <div key={appt.id} className="clinical-card p-5 space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-sm font-heading font-bold text-ink dark:text-white">{appt.doctor_name}</h4>
                      <p className="text-xs text-inkMuted">{appt.appointment_date} at {appt.appointment_time}</p>
                    </div>
                    <span className="px-2.5 py-1 rounded-full bg-teal-500/10 text-tealPrimary dark:text-teal-400 text-xs font-mono font-semibold border border-teal-500/30">
                      {appt.status}
                    </span>
                  </div>

                  <p className="text-xs text-ink dark:text-slate-200">
                    <strong>Chief Complaint:</strong> {appt.reason}
                  </p>

                  {appt.prediction_summary && (
                    <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs text-inkMuted space-y-1">
                      <span className="font-mono font-semibold text-tealPrimary">Linked AI Prediction:</span>
                      <p>Matched Pattern: {appt.prediction_summary.predicted_disease} ({appt.prediction_summary.risk_level} Risk)</p>
                    </div>
                  )}
                </div>
              ))
            ) : (
              <div className="clinical-card p-8 text-center text-xs text-inkMuted">
                No appointments booked yet.
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}

export default function PatientAppointmentsPage() {
  return (
    <Suspense fallback={<div className="text-center py-12 text-xs text-inkMuted">Loading appointments...</div>}>
      <AppointmentsContent />
    </Suspense>
  );
}
