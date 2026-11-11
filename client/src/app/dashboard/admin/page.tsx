'use client';

import React, { useState, useEffect } from 'react';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { AdminStatCards } from '@/components/admin/AdminStatCards';
import { VerificationQueue } from '@/components/admin/VerificationQueue';
import { UserManagementTable } from '@/components/admin/UserManagementTable';
import { AuditLogViewer } from '@/components/admin/AuditLogViewer';
import { AdminStats, getAdminStats } from '@/lib/admin.api';
import {
  Shield,
  Clock,
  Users,
  Activity,
  Sparkles,
  BarChart3,
  RefreshCw,
} from 'lucide-react';

export default function AdminDashboardPage() {
  const { user, logout } = useAuth();
  const [activeTab, setActiveTab] = useState<'overview' | 'queue' | 'users' | 'audit'>('overview');
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(true);

  const loadStats = async () => {
    try {
      setLoading(true);
      const res = await getAdminStats();
      if (res.success && res.data) {
        setStats(res.data);
      }
    } catch (err) {
      console.error('Failed to load admin stats:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStats();
  }, []);

  return (
    <ProtectedRoute allowedRoles={['admin']}>
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100">
        {/* Navigation Header */}
        <header className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 sticky top-0 z-30">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-xl bg-purple-600 flex items-center justify-center text-white font-black text-lg shadow-xs">
                F
              </div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-xl text-purple-600 tracking-tight">FounderLink</span>
                <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-purple-100 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 font-semibold">
                  Admin Console
                </span>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                size="sm"
                onClick={loadStats}
                className="text-xs flex items-center gap-1.5"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Refresh</span>
              </Button>

              <div className="hidden sm:block text-right">
                <div className="text-xs font-bold leading-tight">{user?.name}</div>
                <div className="text-[11px] text-slate-400">{user?.email}</div>
              </div>

              <Button
                variant="outline"
                size="sm"
                onClick={logout}
                className="text-xs border-slate-200 dark:border-slate-800"
              >
                Sign Out
              </Button>
            </div>
          </div>
        </header>

        {/* Dashboard Main Content */}
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
          {/* Top Banner */}
          <div className="bg-gradient-to-r from-purple-700 to-indigo-900 rounded-3xl p-6 sm:p-8 text-white shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-6">
            <div>
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-white/20 text-white text-xs font-semibold mb-2">
                <Shield className="w-3.5 h-3.5" />
                <span>Platform Governance &amp; Security</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
                Super Admin Center
              </h1>
              <p className="text-purple-100 text-xs sm:text-sm mt-1 max-w-xl">
                Review pending accreditation &amp; startup pitches, enforce compliance, and inspect platform metrics.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <Button
                onClick={() => setActiveTab('queue')}
                className="bg-white text-purple-800 hover:bg-purple-50 text-xs font-bold px-4 py-2.5 rounded-xl flex items-center gap-1.5"
              >
                <Clock className="w-4 h-4" />
                <span>Verification Queue</span>
              </Button>
            </div>
          </div>

          {/* Stat Cards & Ecosystem Breakdown */}
          <AdminStatCards stats={stats} loading={loading} />

          {/* Navigation Tabs */}
          <div className="flex border-b border-slate-200 dark:border-slate-800 space-x-6">
            <button
              onClick={() => setActiveTab('overview')}
              className={`pb-3 text-sm font-semibold flex items-center gap-2 border-b-2 transition-all ${
                activeTab === 'overview'
                  ? 'border-purple-600 text-purple-600'
                  : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              <BarChart3 className="w-4 h-4" />
              Overview
            </button>
            <button
              onClick={() => setActiveTab('queue')}
              className={`pb-3 text-sm font-semibold flex items-center gap-2 border-b-2 transition-all ${
                activeTab === 'queue'
                  ? 'border-purple-600 text-purple-600'
                  : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              <Clock className="w-4 h-4" />
              Verification Queue
              {(stats?.users.pending || 0) + (stats?.startups.pending || 0) > 0 && (
                <span className="text-[10px] px-1.5 py-0.2 rounded-full font-bold bg-amber-100 text-amber-800">
                  {(stats?.users.pending || 0) + (stats?.startups.pending || 0)}
                </span>
              )}
            </button>
            <button
              onClick={() => setActiveTab('users')}
              className={`pb-3 text-sm font-semibold flex items-center gap-2 border-b-2 transition-all ${
                activeTab === 'users'
                  ? 'border-purple-600 text-purple-600'
                  : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              <Users className="w-4 h-4" />
              User Directory
            </button>
            <button
              onClick={() => setActiveTab('audit')}
              className={`pb-3 text-sm font-semibold flex items-center gap-2 border-b-2 transition-all ${
                activeTab === 'audit'
                  ? 'border-purple-600 text-purple-600'
                  : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              <Activity className="w-4 h-4" />
              Audit Logs
            </button>
          </div>

          {/* TAB 1: OVERVIEW */}
          {activeTab === 'overview' && (
            <div className="space-y-8">
              <VerificationQueue onQueueUpdated={loadStats} />
              <UserManagementTable />
            </div>
          )}

          {/* TAB 2: VERIFICATION QUEUE */}
          {activeTab === 'queue' && (
            <div>
              <VerificationQueue onQueueUpdated={loadStats} />
            </div>
          )}

          {/* TAB 3: USER MANAGEMENT */}
          {activeTab === 'users' && (
            <div>
              <UserManagementTable />
            </div>
          )}

          {/* TAB 4: AUDIT LOGS */}
          {activeTab === 'audit' && (
            <div>
              <AuditLogViewer />
            </div>
          )}
        </main>
      </div>
    </ProtectedRoute>
  );
}
