'use client';

import React from 'react';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';

export default function InvestorDashboardPage() {
  const { user, logout } = useAuth();

  return (
    <ProtectedRoute allowedRoles={['investor']}>
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
        <header className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-lg bg-emerald-600 flex items-center justify-center text-white font-bold">
              F
            </div>
            <span className="font-bold text-xl text-emerald-600">FounderLink</span>
            <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 font-semibold ml-2">
              Investor Portal
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
              Welcome, {user?.name}! 💼
            </h1>
            <p className="text-sm text-slate-500 mt-1">
              Explore curated deal flow, request pitch deck access, and connect directly with founders.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl">
              <h3 className="font-semibold text-slate-900 dark:text-slate-100 mb-1">Deal Flow Feed</h3>
              <p className="text-xs text-slate-500 mb-4">Discover verified early-stage startups</p>
              <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white">Explore Deals</Button>
            </div>
            <div className="p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl">
              <h3 className="font-semibold text-slate-900 dark:text-slate-100 mb-1">Access Requests</h3>
              <p className="text-xs text-slate-500 mb-4">Track confidential document authorizations</p>
              <Button size="sm" variant="outline">My Requests</Button>
            </div>
            <div className="p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl">
              <h3 className="font-semibold text-slate-900 dark:text-slate-100 mb-1">Scheduled Meetings</h3>
              <p className="text-xs text-slate-500 mb-4">Upcoming Jitsi video pitch calls</p>
              <Button size="sm" variant="outline">Meeting Calendar</Button>
            </div>
          </div>
        </main>
      </div>
    </ProtectedRoute>
  );
}

