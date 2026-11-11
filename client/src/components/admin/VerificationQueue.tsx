'use client';

import React, { useState, useEffect } from 'react';
import {
  CheckCircle2,
  XCircle,
  Clock,
  User,
  Building2,
  AlertCircle,
  Loader2,
  DollarSign,
  Layers,
  ChevronRight,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  AdminUser,
  getPendingUsers,
  reviewUser,
  getPendingStartups,
  reviewStartup,
} from '@/lib/admin.api';
import { Startup } from '@/lib/founder.api';

interface VerificationQueueProps {
  onQueueUpdated?: () => void;
}

export function VerificationQueue({ onQueueUpdated }: VerificationQueueProps) {
  const [activeTab, setActiveTab] = useState<'users' | 'startups'>('users');
  const [pendingUsers, setPendingUsers] = useState<AdminUser[]>([]);
  const [pendingStartups, setPendingStartups] = useState<Startup[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Reject with reason modal state
  const [rejectItem, setRejectItem] = useState<{ id: string; type: 'user' | 'startup'; name: string } | null>(null);
  const [rejectReason, setRejectReason] = useState('');

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [usersRes, startupsRes] = await Promise.all([
        getPendingUsers(),
        getPendingStartups(),
      ]);

      if (usersRes.success && usersRes.data) {
        setPendingUsers(usersRes.data.users);
      }
      if (startupsRes.success && startupsRes.data) {
        setPendingStartups(startupsRes.data.startups);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load verification queue');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleApproveUser = async (id: string) => {
    try {
      setActionLoadingId(id);
      const res = await reviewUser(id, 'approved');
      if (res.success) {
        setPendingUsers((prev) => prev.filter((u) => u._id !== id));
        onQueueUpdated?.();
      }
    } catch (err: any) {
      setError(err.message || 'Failed to approve user');
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleApproveStartup = async (id: string) => {
    try {
      setActionLoadingId(id);
      const res = await reviewStartup(id, 'approved');
      if (res.success) {
        setPendingStartups((prev) => prev.filter((s) => s._id !== id));
        onQueueUpdated?.();
      }
    } catch (err: any) {
      setError(err.message || 'Failed to approve startup');
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleConfirmReject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rejectItem) return;

    try {
      setActionLoadingId(rejectItem.id);
      if (rejectItem.type === 'user') {
        const res = await reviewUser(rejectItem.id, 'rejected', rejectReason);
        if (res.success) {
          setPendingUsers((prev) => prev.filter((u) => u._id !== rejectItem.id));
        }
      } else {
        const res = await reviewStartup(rejectItem.id, 'rejected', rejectReason);
        if (res.success) {
          setPendingStartups((prev) => prev.filter((s) => s._id !== rejectItem.id));
        }
      }
      setRejectItem(null);
      setRejectReason('');
      onQueueUpdated?.();
    } catch (err: any) {
      setError(err.message || 'Failed to reject item');
    } finally {
      setActionLoadingId(null);
    }
  };

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-xs">
      {/* Header and Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-slate-800">
        <div>
          <h3 className="font-bold text-base text-slate-900 dark:text-white flex items-center gap-2">
            <Clock className="w-4 h-4 text-purple-600" />
            Verification &amp; Review Queue
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Audit user applications and review new venture submissions before public marketplace release.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setActiveTab('users')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-xl transition-all flex items-center gap-1.5 ${
              activeTab === 'users'
                ? 'bg-purple-600 text-white shadow-xs'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
            }`}
          >
            <User className="w-3.5 h-3.5" />
            <span>Pending Users</span>
            {pendingUsers.length > 0 && (
              <span className="ml-1 px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-white text-purple-600">
                {pendingUsers.length}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('startups')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-xl transition-all flex items-center gap-1.5 ${
              activeTab === 'startups'
                ? 'bg-purple-600 text-white shadow-xs'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
            }`}
          >
            <Building2 className="w-3.5 h-3.5" />
            <span>Pending Startups</span>
            {pendingStartups.length > 0 && (
              <span className="ml-1 px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-white text-purple-600">
                {pendingStartups.length}
              </span>
            )}
          </button>
        </div>
      </div>

      {error && (
        <div className="mt-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* TAB 1: PENDING USERS */}
      {activeTab === 'users' && (
        <div className="mt-4">
          {loading ? (
            <div className="space-y-3">
              {[1, 2].map((i) => (
                <div key={i} className="h-16 rounded-xl bg-slate-100 dark:bg-slate-800 animate-pulse" />
              ))}
            </div>
          ) : pendingUsers.length === 0 ? (
            <div className="py-12 text-center text-xs text-slate-400">
              No pending user accounts awaiting verification.
            </div>
          ) : (
            <div className="divide-y divide-slate-100 dark:divide-slate-800 border border-slate-100 dark:border-slate-800 rounded-xl overflow-hidden">
              {pendingUsers.map((u) => (
                <div
                  key={u._id}
                  className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-full bg-purple-100 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 font-bold flex items-center justify-center shrink-0 text-sm">
                      {u.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm text-slate-900 dark:text-white truncate">
                          {u.name}
                        </span>
                        <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                          {u.role}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5">{u.email}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                    <Button
                      size="sm"
                      onClick={() => handleApproveUser(u._id)}
                      disabled={actionLoadingId === u._id}
                      data-testid={`approve-user-${u._id}`}
                      className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs h-7 px-3 flex items-center gap-1"
                    >
                      {actionLoadingId === u._id ? (
                        <Loader2 className="w-3 h-3 animate-spin" />
                      ) : (
                        <CheckCircle2 className="w-3 h-3" />
                      )}
                      <span>Approve</span>
                    </Button>

                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setRejectItem({ id: u._id, type: 'user', name: u.name })}
                      disabled={actionLoadingId === u._id}
                      data-testid={`reject-user-${u._id}`}
                      className="text-rose-600 border-rose-200 hover:bg-rose-50 text-xs h-7 px-3 flex items-center gap-1"
                    >
                      <XCircle className="w-3 h-3" />
                      <span>Reject</span>
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: PENDING STARTUPS */}
      {activeTab === 'startups' && (
        <div className="mt-4">
          {loading ? (
            <div className="space-y-3">
              {[1, 2].map((i) => (
                <div key={i} className="h-20 rounded-xl bg-slate-100 dark:bg-slate-800 animate-pulse" />
              ))}
            </div>
          ) : pendingStartups.length === 0 ? (
            <div className="py-12 text-center text-xs text-slate-400">
              No pending startup pitches awaiting review.
            </div>
          ) : (
            <div className="space-y-4">
              {pendingStartups.map((st) => (
                <div
                  key={st._id}
                  className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/40 dark:bg-slate-800/30 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                >
                  <div className="space-y-2 min-w-0">
                    <div className="flex items-center gap-2">
                      <h4 className="font-bold text-base text-slate-900 dark:text-white">
                        {st.name}
                      </h4>
                      <span className="text-xs px-2 py-0.5 rounded-full font-semibold bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300">
                        {st.industry}
                      </span>
                      <span className="text-xs px-2 py-0.5 rounded-full font-semibold bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 capitalize">
                        {st.stage}
                      </span>
                    </div>

                    <p className="text-xs font-medium text-slate-600 dark:text-slate-300">
                      {st.tagline}
                    </p>

                    <div className="text-xs text-slate-500 space-y-1 bg-white dark:bg-slate-900 p-3 rounded-xl border border-slate-100 dark:border-slate-800">
                      <p><span className="font-semibold text-slate-700 dark:text-slate-300">Problem:</span> {st.problem}</p>
                      <p><span className="font-semibold text-slate-700 dark:text-slate-300">Solution:</span> {st.solution}</p>
                      {st.fundingAsk && (
                        <p className="text-emerald-600 font-bold">
                          Ask: ${st.fundingAsk.toLocaleString()} {st.equityOffered ? `(${st.equityOffered}% equity)` : ''}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                    <Button
                      size="sm"
                      onClick={() => handleApproveStartup(st._id)}
                      disabled={actionLoadingId === st._id}
                      data-testid={`approve-startup-${st._id}`}
                      className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs h-8 px-4 flex items-center gap-1.5"
                    >
                      {actionLoadingId === st._id ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <CheckCircle2 className="w-3.5 h-3.5" />
                      )}
                      <span>Approve Pitch</span>
                    </Button>

                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setRejectItem({ id: st._id, type: 'startup', name: st.name })}
                      disabled={actionLoadingId === st._id}
                      data-testid={`reject-startup-${st._id}`}
                      className="text-rose-600 border-rose-200 hover:bg-rose-50 text-xs h-8 px-3 flex items-center gap-1.5"
                    >
                      <XCircle className="w-3.5 h-3.5" />
                      <span>Reject</span>
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Reject With Reason Modal */}
      {rejectItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in">
          <div className="relative w-full max-w-md rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 shadow-2xl">
            <h4 className="font-bold text-base text-slate-900 dark:text-white mb-1">
              Reject {rejectItem.type === 'user' ? 'User' : 'Startup'}: {rejectItem.name}
            </h4>
            <p className="text-xs text-slate-500 mb-4">
              Provide feedback or justification. This reason will be automatically emailed/notified to the applicant.
            </p>

            <form onSubmit={handleConfirmReject} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Rejection Reason / Guidance
                </label>
                <textarea
                  rows={3}
                  required
                  placeholder="e.g. Incomplete verification documents, unaccredited status, or insufficient market traction details."
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-rose-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2">
                <Button type="button" variant="outline" size="sm" onClick={() => setRejectItem(null)}>
                  Cancel
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  className="bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold"
                >
                  Confirm Rejection
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

