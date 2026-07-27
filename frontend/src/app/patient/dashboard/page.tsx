'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { fetchApi } from '@/lib/api';
import Link from 'next/link';
import {
  Activity,
  Heart,
  Droplets,
  Scale,
  CalendarCheck,
  FlaskConical,
  Edit3,
} from 'lucide-react';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';

const SAMPLE_VITALS_TREND = [
  { day: 'Mon', bp_sys: 122, bp_dia: 82, glucose: 98 },
  { day: 'Tue', bp_sys: 120, bp_dia: 80, glucose: 95 },
  { day: 'Wed', bp_sys: 118, bp_dia: 78, glucose: 92 },
  { day: 'Thu', bp_sys: 119, bp_dia: 79, glucose: 94 },
  { day: 'Fri', bp_sys: 117, bp_dia: 77, glucose: 90 },
  { day: 'Sat', bp_sys: 121, bp_dia: 81, glucose: 96 },
  { day: 'Sun', bp_sys: 118, bp_dia: 78, glucose: 92 },
];

export default function PatientDashboardPage() {
  const { user } = useAuth();
  const [vitals, setVitals] = useState<any>({
    blood_pressure_sys: 118,
    blood_pressure_dia: 78,
    heart_rate: 74,
    glucose_mg_dl: 92,
    bmi: 22.1,
    weight_kg: 62.0,
    height_cm: 167.0
  });

  const [appointments, setAppointments] = useState<any[]>([]);
  const [labTests, setLabTests] = useState<any[]>([]);
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState<any>(vitals);

  useEffect(() => {
    fetchApi('/patient/vitals').then((data) => {
      if (data) {
        setVitals(data);
        setEditForm(data);
      }
    }).catch(() => {});

    fetchApi('/appointments/my').then((data) => setAppointments(data || [])).catch(() => {});
    fetchApi('/labs/my').then((data) => setLabTests(data || [])).catch(() => {});
  }, []);

  const handleSaveVitals = async () => {
    try {
      await fetchApi('/patient/vitals', {
        method: 'PUT',
        body: JSON.stringify(editForm),
      });
      setVitals(editForm);
      setIsEditing(false);
    } catch (err) {
      alert('Failed to update vitals');
    }
  };

  return (
    <div className="space-y-8 py-4 animate-card-rise">
      
      {/* Welcome Banner */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-6 rounded-3xl bg-gradient-to-r from-mistTeal via-white to-bgLight dark:from-darkSurface dark:to-darkBg border border-slate-200 dark:border-slate-800 shadow-sm">
        <div>
          <h1 className="text-2xl sm:text-3xl font-heading font-extrabold text-ink dark:text-white">
            Welcome back, <span className="text-tealPrimary">{user?.name || 'Patient'}</span>
          </h1>
          <p className="text-xs sm:text-sm text-inkMuted dark:text-slate-300 mt-1">
            Personal Health Dashboard — Real-time vitals, medical timeline, and appointment status.
          </p>
        </div>
        <Link
          href="/patient/symptom-checker"
          className="btn-teal text-xs py-2.5 px-4 flex items-center gap-1.5 shadow-sm"
        >
          <Activity className="w-4 h-4" />
          <span>New Symptom Check</span>
        </Link>
      </div>

      {/* VITALS CARDS GRID */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Blood Pressure */}
        <div className="clinical-card p-5 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono font-semibold uppercase text-inkMuted">Blood Pressure</span>
            <Activity className="w-5 h-5 text-tealPrimary" />
          </div>
          <div className="text-2xl font-mono font-bold text-ink dark:text-white">
            {vitals.blood_pressure_sys}/{vitals.blood_pressure_dia} <span className="text-xs font-normal text-inkMuted">mmHg</span>
          </div>
          <span className="inline-block px-2 py-0.5 rounded-md bg-teal-500/10 text-tealPrimary dark:text-teal-400 text-[10px] font-mono font-semibold">
            Optimal Range
          </span>
        </div>

        {/* Heart Rate */}
        <div className="clinical-card p-5 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono font-semibold uppercase text-inkMuted">Heart Rate</span>
            <Heart className="w-5 h-5 text-coralWarm animate-pulse" />
          </div>
          <div className="text-2xl font-mono font-bold text-ink dark:text-white">
            {vitals.heart_rate} <span className="text-xs font-normal text-inkMuted">bpm</span>
          </div>
          <span className="inline-block px-2 py-0.5 rounded-md bg-teal-500/10 text-tealPrimary dark:text-teal-400 text-[10px] font-mono font-semibold">
            Normal Resting Rate
          </span>
        </div>

        {/* Blood Glucose */}
        <div className="clinical-card p-5 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono font-semibold uppercase text-inkMuted">Fasting Glucose</span>
            <Droplets className="w-5 h-5 text-tealPrimary" />
          </div>
          <div className="text-2xl font-mono font-bold text-ink dark:text-white">
            {vitals.glucose_mg_dl} <span className="text-xs font-normal text-inkMuted">mg/dL</span>
          </div>
          <span className="inline-block px-2 py-0.5 rounded-md bg-teal-500/10 text-tealPrimary dark:text-teal-400 text-[10px] font-mono font-semibold">
            Normal Fasting Level
          </span>
        </div>

        {/* BMI */}
        <div className="clinical-card p-5 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono font-semibold uppercase text-inkMuted">Body Mass Index</span>
            <Scale className="w-5 h-5 text-purple-600 dark:text-purple-400" />
          </div>
          <div className="text-2xl font-mono font-bold text-ink dark:text-white">
            {vitals.bmi} <span className="text-xs font-normal text-inkMuted">kg/m²</span>
          </div>
          <span className="inline-block px-2 py-0.5 rounded-md bg-teal-500/10 text-tealPrimary dark:text-teal-400 text-[10px] font-mono font-semibold">
            Healthy Weight Index
          </span>
        </div>

      </div>

      {/* VITALS TREND CHART & UPDATE MODAL */}
      <div className="clinical-card p-6 md:p-8 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-heading font-bold text-ink dark:text-white">Weekly Vitals & Glucose Trend</h3>
            <p className="text-xs text-inkMuted">Systemic systolic blood pressure & fasting glucose tracking</p>
          </div>
          <button
            onClick={() => setIsEditing(!isEditing)}
            className="btn-outline text-xs py-1.5 px-3 flex items-center gap-1.5"
          >
            <Edit3 className="w-3.5 h-3.5" />
            <span>Update Vitals</span>
          </button>
        </div>

        {/* Edit Form Drawer */}
        {isEditing && (
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-[10px] font-mono font-semibold uppercase text-inkMuted mb-1">Systolic BP (mmHg)</label>
              <input
                type="number"
                value={editForm.blood_pressure_sys}
                onChange={(e) => setEditForm({ ...editForm, blood_pressure_sys: parseInt(e.target.value) })}
                className="w-full p-2 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-xs text-ink dark:text-white"
              />
            </div>
            <div>
              <label className="block text-[10px] font-mono font-semibold uppercase text-inkMuted mb-1">Diastolic BP (mmHg)</label>
              <input
                type="number"
                value={editForm.blood_pressure_dia}
                onChange={(e) => setEditForm({ ...editForm, blood_pressure_dia: parseInt(e.target.value) })}
                className="w-full p-2 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-xs text-ink dark:text-white"
              />
            </div>
            <div>
              <label className="block text-[10px] font-mono font-semibold uppercase text-inkMuted mb-1">Fasting Glucose (mg/dL)</label>
              <input
                type="number"
                value={editForm.glucose_mg_dl}
                onChange={(e) => setEditForm({ ...editForm, glucose_mg_dl: parseInt(e.target.value) })}
                className="w-full p-2 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-xs text-ink dark:text-white"
              />
            </div>
            <div className="sm:col-span-3 flex justify-end gap-2 pt-2">
              <button
                onClick={() => setIsEditing(false)}
                className="btn-outline text-xs py-1.5 px-3"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveVitals}
                className="btn-teal text-xs py-1.5 px-4"
              >
                Save Changes
              </button>
            </div>
          </div>
        )}

        <div className="h-64 w-full pt-4">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={SAMPLE_VITALS_TREND}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="day" stroke="#5B6B68" fontSize={12} />
              <YAxis stroke="#5B6B68" fontSize={12} />
              <Tooltip
                contentStyle={{ backgroundColor: '#ffffff', borderColor: '#e2e8f0', borderRadius: '12px', fontSize: '12px', color: '#16211F' }}
              />
              <Line type="monotone" dataKey="bp_sys" stroke="#0F9B8E" strokeWidth={2.5} name="Systolic BP" />
              <Line type="monotone" dataKey="glucose" stroke="#F97362" strokeWidth={2.5} name="Glucose (mg/dL)" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* APPOINTMENTS & LAB TESTS SUMMARY */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Appointments Queue */}
        <div className="clinical-card p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-heading font-bold text-ink dark:text-white flex items-center gap-2">
              <CalendarCheck className="w-5 h-5 text-tealPrimary" />
              <span>Upcoming Appointments</span>
            </h3>
            <Link href="/patient/appointments" className="text-xs text-tealPrimary hover:underline font-semibold">
              View All
            </Link>
          </div>

          <div className="space-y-3">
            {appointments.length > 0 ? (
              appointments.map((appt) => (
                <div key={appt.id} className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-heading font-semibold text-ink dark:text-white">{appt.doctor_name}</span>
                    <span className="px-2 py-0.5 rounded-full bg-teal-500/10 text-tealPrimary dark:text-teal-400 text-[10px] font-mono font-semibold border border-teal-500/30">
                      {appt.status}
                    </span>
                  </div>
                  <p className="text-xs text-inkMuted">{appt.appointment_date} at {appt.appointment_time}</p>
                  <p className="text-[11px] text-inkMuted italic">Reason: {appt.reason}</p>
                </div>
              ))
            ) : (
              <p className="text-xs text-inkMuted italic py-4">No active appointment bookings.</p>
            )}
          </div>
        </div>

        {/* Lab Tests Queue */}
        <div className="clinical-card p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-heading font-bold text-ink dark:text-white flex items-center gap-2">
              <FlaskConical className="w-5 h-5 text-purple-600 dark:text-purple-400" />
              <span>Diagnostic Lab Orders</span>
            </h3>
            <Link href="/patient/lab-tests" className="text-xs text-purple-600 dark:text-purple-400 hover:underline font-semibold">
              View Reports
            </Link>
          </div>

          <div className="space-y-3">
            {labTests.length > 0 ? (
              labTests.map((lab) => (
                <div key={lab.id} className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-heading font-semibold text-ink dark:text-white">{lab.test_name}</span>
                    <span className="px-2 py-0.5 rounded-full bg-purple-500/10 text-purple-600 dark:text-purple-400 text-[10px] font-mono font-semibold border border-purple-500/30">
                      {lab.status}
                    </span>
                  </div>
                  {lab.ai_summary && (
                    <p className="text-[11px] text-inkMuted line-clamp-2 mt-1">
                      <strong>AI Summary:</strong> {lab.ai_summary}
                    </p>
                  )}
                </div>
              ))
            ) : (
              <p className="text-xs text-inkMuted italic py-4">No recent lab test orders.</p>
            )}
          </div>
        </div>

      </div>

    </div>
  );
}
