'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth, UserRole } from '@/context/AuthContext';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: UserRole[];
  requireApproval?: boolean;
}

export function ProtectedRoute({
  children,
  allowedRoles,
  requireApproval = true,
}: ProtectedRouteProps) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading) {
      if (!user) {
        router.push('/login');
        return;
      }

      if (allowedRoles && !allowedRoles.includes(user.role)) {
        if (user.role === 'founder') router.push('/dashboard/founder');
        else if (user.role === 'investor') router.push('/dashboard/investor');
        else if (user.role === 'admin') router.push('/dashboard/admin');
        else router.push('/');
        return;
      }

      if (!user.isEmailVerified) {
        router.push('/verify-email?pending=true');
        return;
      }

      if (requireApproval && user.role !== 'admin' && user.verificationStatus !== 'approved') {
        router.push('/verify-email?approval=pending');
        return;
      }
    }
  }, [user, loading, allowedRoles, requireApproval, router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
          <p className="text-sm text-slate-500 font-medium">Checking authentication...</p>
        </div>
      </div>
    );
  }

  if (!user) return null;

  return <>{children}</>;
}
