'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { fetchApi } from '@/lib/api';
import Link from 'next/link';
import { Stethoscope, User, Calendar, Activity, ArrowRight } from 'lucide-react';

export default function DoctorDashboardPage() {
  const { user } = useAuth();
  const [patients, setPatients] = useState<any[]>([]);
  const [appointments, setAppointments] = useState<any[]>([]);

  useEffect(() => {
    fetchApi('/patient/all').then((data) => setPatients(data || [])).catch(() => {});
    fetchApi('/appointments/my').then((data) => setAppointments(data || [])).catch(() => {});
  }, []);

  const handleUpdateStatus = async (apptId: string, newStatus: string) => {
    try {
      await fetchApi(`/appointments/${apptId}/status?status_val=${newStatus}`, { method: 'PUT' });
      setAppointments(appointments.map((a) => (a.id === apptId ? { ...a, status: newStatus } : a)));
    } catch (err) {
      alert('Failed to update status');
    }
  };

  return (
    <div className="space-y-8 py-4 animate-card-rise">
      {/* Header */}
      <div className="p-6 rounded-3xl bg-gradient-to-r from-mistTeal via-white to-bgLight dark:from-darkSurface dark:to-darkBg border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between">
        <div>
          <span className="text-xs font-mono font-semibold text-tealPrimary uppercase tracking-wider">Physician Clinical Portal</span>
          <h1 className="text-2xl sm:text-3xl font-heading font-extrabold text-ink dark:text-white">
            Welcome, <span className="text-tealPrimary">{user?.name || 'Doctor'}</span>
          </h1>
          <p className="text-xs text-inkMuted mt-0.5">Specialization: {user?.specialization || 'Gastroenterology & Internal Medicine'}</p>
        </div>
        <Stethoscope className="w-10 h-10 text-tealPrimary hidden sm:block" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Appointments Queue */}
        <div className="lg:col-span-7 space-y-4">
          <h3 className="text-base font-heading font-bold text-ink dark:text-white flex items-center gap-2">
            <Calendar className="w-5 h-5 text-tealPrimary" />
            <span>Consultation Queue ({appointments.length})</span>
          </h3>

          <div className="space-y-4">
            {appointments.length > 0 ? (
              appointments.map((appt) => (
                <div key={appt.id} className="clinical-card p-5 space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-sm font-heading font-bold text-ink dark:text-white">{appt.patient_name}</h4>
                      <p className="text-xs text-inkMuted">{appt.appointment_date} at {appt.appointment_time}</p>
                    </div>
                    <span className="px-2.5 py-1 rounded-full bg-teal-500/10 text-tealPrimary dark:text-teal-400 text-xs font-mono font-semibold border border-teal-500/30">
                      {appt.status}
                    </span>
                  </div>

                  <p className="text-xs text-ink dark:text-slate-200">
                    <strong>Chief Complaint:</strong> {appt.reason}
                  </p>

                  {/* AI Prediction Context */}
                  {appt.prediction_summary && (
                    <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs space-y-1">
                      <span className="font-bold text-tealPrimary dark:text-teal-400 flex items-center gap-1">
                        <Activity className="w-3.5 h-3.5" /> AI Pre-Assessment Prediction:
                      </span>
                      <p className="text-inkMuted">
                        Pattern: <strong>{appt.prediction_summary.predicted_disease}</strong> ({appt.prediction_summary.risk_level} Risk)
                      </p>
                    </div>
                  )}

                  <div className="pt-2 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between">
                    <Link
                      href={`/doctor/patient/${appt.patient_id}`}
                      className="text-xs text-tealPrimary hover:underline flex items-center gap-1 font-semibold"
                    >
                      <span>View Complete Patient History</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Link>

                    <div className="flex items-center gap-2">
                      {appt.status !== 'Confirmed' && (
                        <button
                          onClick={() => handleUpdateStatus(appt.id, 'Confirmed')}
                          className="btn-teal text-[11px] py-1 px-2.5"
                        >
                          Confirm
                        </button>
                      )}
                      {appt.status !== 'Completed' && (
                        <button
                          onClick={() => handleUpdateStatus(appt.id, 'Completed')}
                          className="btn-outline text-[11px] py-1 px-2.5"
                        >
                          Complete
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="clinical-card p-8 text-center text-xs text-inkMuted">
                No active consultation requests in queue.
              </div>
            )}
          </div>
        </div>

        {/* Patient Roster */}
        <div className="lg:col-span-5 space-y-4">
          <h3 className="text-base font-heading font-bold text-ink dark:text-white flex items-center gap-2">
            <User className="w-5 h-5 text-tealPrimary" />
            <span>Assigned Patient Roster</span>
          </h3>

          <div className="space-y-3">
            {patients.map((pat) => (
              <div key={pat.id} className="clinical-card p-4 flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-heading font-bold text-ink dark:text-white">{pat.name}</h4>
                  <p className="text-xs text-inkMuted">Age: {pat.age} | Blood: {pat.blood_type}</p>
                </div>
                <Link
                  href={`/doctor/patient/${pat.id}`}
                  className="btn-outline text-xs py-1.5 px-3"
                >
                  View Record
                </Link>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}
