'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { apiRequest, ApiResponse } from '@/lib/api';

export type UserRole = 'founder' | 'investor' | 'admin';
export type VerificationStatus = 'pending' | 'approved' | 'rejected';

export interface User {
  _id: string;
  name: string;
  email: string;
  role: UserRole;
  isEmailVerified: boolean;
  verificationStatus: VerificationStatus;
  isSuspended: boolean;
  headline?: string;
  avatarUrl?: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  accessToken: string | null;
  login: (email: string, password: string) => Promise<User>;
  register: (data: {
    name: string;
    email: string;
    password: string;
    role: 'founder' | 'investor';
  }) => Promise<ApiResponse<unknown>>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
  getDashboardUrl: (role?: UserRole) => string;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const getDashboardUrl = (role?: UserRole): string => {
    const targetRole = role || user?.role;
    switch (targetRole) {
      case 'founder':
        return '/dashboard/founder';
      case 'investor':
        return '/dashboard/investor';
      case 'admin':
        return '/dashboard/admin';
      default:
        return '/login';
    }
  };

  const refreshUser = async () => {
    try {
      const res = await apiRequest<{ user: User }>('/auth/me');
      if (res.data?.user) {
        setUser(res.data.user);
      }
    } catch {
      setUser(null);
      setAccessToken(null);
      if (typeof window !== 'undefined') {
        localStorage.removeItem('accessToken');
      }
    }
  };

  useEffect(() => {
    const initAuth = async () => {
      const storedToken = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null;
      if (storedToken) {
        setAccessToken(storedToken);
        await refreshUser();
      } else {
        try {
          const res = await apiRequest<{ accessToken: string }>('/auth/refresh', { method: 'POST' });
          if (res.data?.accessToken) {
            localStorage.setItem('accessToken', res.data.accessToken);
            setAccessToken(res.data.accessToken);
            await refreshUser();
          }
        } catch {
          // No active session
        }
      }
      setLoading(false);
    };

    initAuth();
  }, []);

  const login = async (email: string, password: string): Promise<User> => {
    const res = await apiRequest<{ user: User; accessToken: string }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });

    const loggedInUser = res.data!.user;
    const token = res.data!.accessToken;

    setUser(loggedInUser);
    setAccessToken(token);
    if (typeof window !== 'undefined') {
      localStorage.setItem('accessToken', token);
    }

    return loggedInUser;
  };

  const register = async (data: {
    name: string;
    email: string;
    password: string;
    role: 'founder' | 'investor';
  }): Promise<ApiResponse<unknown>> => {
    return await apiRequest('/auth/register', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  };

  const logout = async () => {
    try {
      await apiRequest('/auth/logout', { method: 'POST' });
    } finally {
      setUser(null);
      setAccessToken(null);
      if (typeof window !== 'undefined') {
        localStorage.removeItem('accessToken');
      }
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        accessToken,
        login,
        register,
        logout,
        refreshUser,
        getDashboardUrl,
      }}
    >
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
