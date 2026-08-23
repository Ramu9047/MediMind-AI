'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useSearchParams } from 'next/navigation';
import { fetchApi } from '@/lib/api';
import { Stethoscope, Calendar, Clock, Lock, CheckCircle2 } from 'lucide-react';
import ProtectedRoute from '@/components/ProtectedRoute';

const CLINICAL_TIME_SLOTS = [
  '09:00 AM', '09:30 AM', '10:00 AM', '10:30 AM',
  '11:00 AM', '11:30 AM', '02:00 PM', '02:30 PM',
  '03:00 PM', '03:30 PM', '04:00 PM', '04:30 PM'
];

const getLocalDateStr = () => {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const isSlotPassedToday = (slotTime: string, selectedDate: string) => {
  const today = getLocalDateStr();
  if (selectedDate < today) return true;
  if (selectedDate > today) return false;

  const now = new Date();
  const [timePart, modifier] = slotTime.split(' ');
  let [hours, minutes] = timePart.split(':').map(Number);
  if (modifier === 'PM' && hours < 12) hours += 12;
  if (modifier === 'AM' && hours === 12) hours = 0;

  const slotDate = new Date();
  slotDate.setHours(hours, minutes, 0, 0);

  return slotDate < now;
};

function AppointmentsContent() {
  const searchParams = useSearchParams();
  const predId = searchParams.get('pred_id');
  const specialistParam = searchParams.get('specialist');

  const todayStr = getLocalDateStr();

  const [doctors, setDoctors] = useState<any[]>([]);
  const [myAppointments, setMyAppointments] = useState<any[]>([]);
  const [selectedDoctor, setSelectedDoctor] = useState<any>(null);
  const [date, setDate] = useState(todayStr);
  const [time, setTime] = useState('');
  const [bookedSlots, setBookedSlots] = useState<string[]>([]);
  const [reason, setReason] = useState(
    specialistParam ? `Consultation regarding AI prediction for ${specialistParam}` : ''
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

  // Fetch booked slots whenever selectedDoctor or date changes
  useEffect(() => {
    if (selectedDoctor?.id && date) {
      fetchApi(`/appointments/booked-slots?doctor_id=${selectedDoctor.id}&date=${date}`)
        .then((data) => {
          setBookedSlots(data.booked_slots || []);
        })
        .catch(() => setBookedSlots([]));
    }
  }, [selectedDoctor, date]);

  const handleBook = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDoctor) return;
    if (!time) {
      setMessage('Please select an available time slot.');
      return;
    }
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
      setBookedSlots([...bookedSlots, time]);
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
        <div className="md:col-span-6 clinical-card p-6 space-y-4">
          <h3 className="text-base font-heading font-bold text-ink dark:text-white flex items-center gap-2">
            <Stethoscope className="w-5 h-5 text-tealPrimary" />
            <span>Book Consultation</span>
          </h3>

          {message && (
            <div className={`p-3 rounded-xl text-xs font-medium ${
              message.includes('successfully')
                ? 'bg-teal-500/10 border border-teal-500/30 text-tealPrimary dark:text-teal-400'
                : 'bg-rose-500/10 border border-rose-500/30 text-dangerRed'
            }`}>
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
                  setTime('');
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
                min={todayStr}
                value={date}
                onChange={(e) => {
                  setDate(e.target.value);
                  setTime('');
                }}
                className="w-full p-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-ink dark:text-white focus:outline-none focus:border-tealPrimary"
              />
            </div>

            {/* DYNAMIC TIME SLOT PICKER GRID */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-mono font-semibold text-inkMuted uppercase">Select Available Time Slot</label>
                <span className="text-[10px] text-inkMuted font-mono">
                  {bookedSlots.length} Booked / {CLINICAL_TIME_SLOTS.length - bookedSlots.length} Free
                </span>
              </div>

              <div className="grid grid-cols-3 gap-2">
                {CLINICAL_TIME_SLOTS.map((slot) => {
                  const isBooked = bookedSlots.includes(slot);
                  const isPassed = isSlotPassedToday(slot, date);
                  const isDisabled = isBooked || isPassed;
                  const isSelected = time === slot;

                  if (isDisabled) {
                    return (
                      <div
                        key={slot}
                        className="p-2 rounded-xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-[11px] font-mono text-slate-400 dark:text-slate-600 flex items-center justify-between opacity-75 cursor-not-allowed"
                        title={isPassed ? "This time slot has passed" : "This slot is already booked"}
                      >
                        <span>{slot}</span>
                        <Lock className="w-3 h-3 text-rose-500 shrink-0" />
                      </div>
                    );
                  }

                  return (
                    <button
                      type="button"
                      key={slot}
                      onClick={() => setTime(slot)}
                      className={`p-2 rounded-xl text-[11px] font-mono font-semibold transition-all flex items-center justify-between ${
                        isSelected
                          ? 'bg-tealPrimary text-white shadow-sm border border-tealDeep'
                          : 'bg-mistTeal dark:bg-slate-800 text-tealPrimary border border-tealPrimary/20 hover:bg-tealPrimary hover:text-white'
                      }`}
                    >
                      <span>{slot}</span>
                      {isSelected && <CheckCircle2 className="w-3 h-3" />}
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <label className="block text-xs font-mono font-semibold text-inkMuted uppercase mb-1">Reason for Visit</label>
              <textarea
                rows={3}
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Describe your health concern or symptoms..."
                className="w-full p-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-ink dark:text-white focus:outline-none focus:border-tealPrimary"
              />
            </div>

            <button
              type="submit"
              disabled={loading || !time}
              className="w-full btn-teal py-3 font-semibold text-xs shadow-md disabled:opacity-50"
            >
              {loading ? 'Submitting Request...' : time ? `Confirm Request for ${time}` : 'Select a Time Slot to Proceed'}
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
    <ProtectedRoute allowedRoles={['patient']}>
      <Suspense fallback={<div className="text-center py-12 text-xs text-inkMuted">Loading appointments...</div>}>
        <AppointmentsContent />
      </Suspense>
    </ProtectedRoute>
  );
}
