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

  const rolesKey = allowedRoles ? allowedRoles.join(',') : '';
  const isAuthorized = Boolean(user && (!allowedRoles || allowedRoles.includes(user.role)));

  useEffect(() => {
    if (!loading) {
      if (!user) {
        router.replace('/auth/login');
      } else if (allowedRoles && !allowedRoles.includes(user.role)) {
        const target = user.role === 'doctor' ? '/doctor/dashboard'
                     : user.role === 'patient' ? '/patient/dashboard'
                     : user.role === 'lab' ? '/lab/dashboard'
                     : user.role === 'admin' ? '/admin/dashboard'
                     : '/';
        router.replace(target);
      }
    }
  }, [user, loading, rolesKey, router]);

  if (loading || !isAuthorized) {
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
