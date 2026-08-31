'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export interface User {
  id: string;
  name: string;
  email: string;
  role: 'patient' | 'doctor' | 'lab' | 'admin';
  specialization?: string;
  must_reset_password?: boolean;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<User>;
  signup: (name: string, email: string, role: string, password?: string) => Promise<void>;
  logout: () => void;
  quickLogin: (role: 'patient' | 'doctor' | 'lab' | 'admin') => Promise<void>;
  clearResetPasswordFlag: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const router = useRouter();

  useEffect(() => {
    const savedUser = localStorage.getItem('medimind_user');
    if (savedUser) {
      try {
        const parsed = JSON.parse(savedUser);
        setUser(parsed);
        if (parsed.must_reset_password) {
          router.push('/auth/reset-password');
        }
      } catch (e) {
        console.error("Failed to parse stored user", e);
      }
    }
    setLoading(false);
  }, []);

  const login = async (email: string, password: string) => {
    const res = await fetch('/api/v1/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
      credentials: 'include',
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.detail || 'Login failed');
    }
    const data = await res.json();
    setUser(data.user);
    localStorage.setItem('medimind_user', JSON.stringify(data.user));
    if (data.access_token) {
      localStorage.setItem('medimind_token', data.access_token);
    }

    if (data.user?.must_reset_password || data.must_reset_password) {
      router.push('/auth/reset-password');
    }
    return data.user;
  };

  const signup = async (name: string, email: string, role: string, password: string = 'password123') => {
    const res = await fetch('/api/v1/auth/signup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, role, password }),
      credentials: 'include',
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.detail || 'Signup failed');
    }
    const data = await res.json();
    setUser(data.user);
    localStorage.setItem('medimind_user', JSON.stringify(data.user));
    if (data.access_token) {
      localStorage.setItem('medimind_token', data.access_token);
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('medimind_user');
    localStorage.removeItem('medimind_token');
    router.push('/auth/login');
  };


  const clearResetPasswordFlag = () => {
    if (user) {
      const updated = { ...user, must_reset_password: false };
      setUser(updated);
      localStorage.setItem('medimind_user', JSON.stringify(updated));
    }
  };

  const quickLogin = async (role: 'patient' | 'doctor' | 'lab' | 'admin') => {
    const emailMap = {
      patient: 'patient@medimind.ai',
      doctor: 'doctor@medimind.ai',
      lab: 'lab@medimind.ai',
      admin: 'admin@medimind.ai',
    };
    if (role === 'admin') {
      throw new Error("Admin authentication requires entering your env-configured password on the login form.");
    }
    await login(emailMap[role], 'password123');
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, signup, logout, quickLogin, clearResetPasswordFlag }}>

      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
