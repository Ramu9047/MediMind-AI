'use client';

import React, { useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { Activity } from 'lucide-react';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: Array<'patient' | 'doctor' | 'lab' | 'admin'>;
}

export default function ProtectedRoute({ children, allowedRoles }: ProtectedRouteProps) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading) {
      if (!user) {
        router.push('/auth/login');
      } else if (allowedRoles && !allowedRoles.includes(user.role)) {
        if (user.role === 'doctor') router.push('/doctor/dashboard');
        else if (user.role === 'patient') router.push('/patient/dashboard');
        else if (user.role === 'lab') router.push('/lab/dashboard');
        else if (user.role === 'admin') router.push('/admin/dashboard');
        else router.push('/');
      }
    }
  }, [user, loading, allowedRoles, router]);

  if (loading || !user || (allowedRoles && !allowedRoles.includes(user.role))) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center space-y-4 text-center">
        <div className="w-12 h-12 rounded-2xl bg-mistTeal dark:bg-slate-800 text-tealPrimary flex items-center justify-center animate-pulse">
          <Activity className="w-6 h-6" />
        </div>
        <p className="text-xs font-mono text-inkMuted">Verifying clinical portal authorization...</p>
      </div>
    );
  }

  return <>{children}</>;
}
