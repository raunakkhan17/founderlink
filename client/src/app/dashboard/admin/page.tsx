'use client';

import React from 'react';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';

export default function AdminDashboardPage() {
  const { user, logout } = useAuth();

  return (
    <ProtectedRoute allowedRoles={['admin']}>
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
        <header className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-lg bg-purple-600 flex items-center justify-center text-white font-bold">
              F
            </div>
            <span className="font-bold text-xl text-purple-600">FounderLink</span>
            <span className="text-xs px-2 py-0.5 rounded-full bg-purple-100 text-purple-700 font-semibold ml-2">
              Super Admin Console
            </span>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
              {user?.name} ({user?.email})
            </span>
            <Button variant="outline" size="sm" onClick={logout}>
              Sign Out
            </Button>
          </div>
        </header>

        <main className="max-w-6xl mx-auto px-6 py-10">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-8 mb-6 shadow-sm">
            <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
              Platform Administration 🛡️
            </h1>
            <p className="text-sm text-slate-500 mt-1">
              Approve/reject founder and investor accounts, moderate startup pitches, and inspect audit logs.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl">
              <h3 className="font-semibold text-slate-900 dark:text-slate-100 mb-1">User Verification Queue</h3>
              <p className="text-xs text-slate-500 mb-4">Review KYC &amp; accreditation requests</p>
              <Button size="sm" className="bg-purple-600 hover:bg-purple-700 text-white">Review Users</Button>
            </div>
            <div className="p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl">
              <h3 className="font-semibold text-slate-900 dark:text-slate-100 mb-1">Pitch Moderation</h3>
              <p className="text-xs text-slate-500 mb-4">Pending startup submissions</p>
              <Button size="sm" variant="outline">Approve Pitches</Button>
            </div>
            <div className="p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl">
              <h3 className="font-semibold text-slate-900 dark:text-slate-100 mb-1">Audit Logs</h3>
              <p className="text-xs text-slate-500 mb-4">Inspect security actions and access events</p>
              <Button size="sm" variant="outline">View Audit Logs</Button>
            </div>
          </div>
        </main>
      </div>
    </ProtectedRoute>
  );
}

