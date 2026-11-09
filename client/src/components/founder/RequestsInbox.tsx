'use client';

import React, { useState, useEffect } from 'react';
import {
  Inbox,
  ShieldCheck,
  UserCheck,
  Check,
  X,
  Mail,
  FileText,
  Clock,
  Building,
  AlertCircle,
  Loader2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  AccessRequestItem,
  ConnectionItem,
  getAccessRequests,
  updateAccessRequest,
  getConnectionRequests,
  updateConnectionRequest,
} from '@/lib/founder.api';

interface RequestsInboxProps {
  onStatusChange?: () => void;
}

export function RequestsInbox({ onStatusChange }: RequestsInboxProps) {
  const [activeTab, setActiveTab] = useState<'access' | 'connection'>('access');
  const [accessRequests, setAccessRequests] = useState<AccessRequestItem[]>([]);
  const [connections, setConnections] = useState<ConnectionItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const loadRequests = async () => {
    try {
      setLoading(true);
      setError(null);
      const [accRes, connRes] = await Promise.all([
        getAccessRequests(),
        getConnectionRequests(),
      ]);

      if (accRes.success && accRes.data) {
        setAccessRequests(accRes.data);
      }
      if (connRes.success && connRes.data) {
        setConnections(connRes.data);
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to load inbox requests');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRequests();
  }, []);

  const handleAccessAction = async (id: string, status: 'approved' | 'rejected') => {
    try {
      setUpdatingId(id);
      const res = await updateAccessRequest(id, status);
      if (res.success) {
        setAccessRequests((prev) =>
          prev.map((r) => (r._id === id ? { ...r, status } : r))
        );
        onStatusChange?.();
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : `Failed to ${status} access request`);
    } finally {
      setUpdatingId(null);
    }
  };

  const handleConnectionAction = async (id: string, status: 'accepted' | 'declined') => {
    try {
      setUpdatingId(id);
      const res = await updateConnectionRequest(id, status);
      if (res.success) {
        setConnections((prev) =>
          prev.map((c) => (c._id === id ? { ...c, status } : c))
        );
        onStatusChange?.();
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : `Failed to ${status} connection`);
    } finally {
      setUpdatingId(null);
    }
  };

  const pendingAccessCount = accessRequests.filter((r) => r.status === 'pending').length;
  const pendingConnCount = connections.filter((c) => c.status === 'pending').length;

  const formatDate = (dateStr: string) => {
    try {
      return new Date(dateStr).toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
      });
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 shadow-xs">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-slate-800">
        <div className="flex items-center gap-2">
          <Inbox className="w-5 h-5 text-blue-600" />
          <h3 className="font-semibold text-slate-900 dark:text-white text-base">Requests Inbox</h3>
        </div>

        {/* Tabs */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setActiveTab('access')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              activeTab === 'access'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Document Access</span>
            {pendingAccessCount > 0 && (
              <span
                data-testid="pending-access-badge"
                className={`ml-1 px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                  activeTab === 'access' ? 'bg-white text-blue-600' : 'bg-blue-100 text-blue-700'
                }`}
              >
                {pendingAccessCount}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('connection')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              activeTab === 'connection'
                ? 'bg-purple-600 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <UserCheck className="w-3.5 h-3.5" />
            <span>Investor Connections</span>
            {pendingConnCount > 0 && (
              <span
                data-testid="pending-conn-badge"
                className={`ml-1 px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                  activeTab === 'connection' ? 'bg-white text-purple-600' : 'bg-purple-100 text-purple-700'
                }`}
              >
                {pendingConnCount}
              </span>
            )}
          </button>
        </div>
      </div>

      {error && (
        <div className="mt-4 p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 dark:bg-rose-950/40 dark:border-rose-900/50 dark:text-rose-300 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Tab 1: Access Requests */}
      {activeTab === 'access' && (
        <div className="mt-4">
          {loading ? (
            <div className="space-y-3">
              {[1, 2].map((i) => (
                <div key={i} className="h-16 bg-slate-100 dark:bg-slate-800 rounded-lg animate-pulse" />
              ))}
            </div>
          ) : accessRequests.length === 0 ? (
            <div className="text-center py-10 text-xs text-slate-400">
              No document access requests found.
            </div>
          ) : (
            <div className="divide-y divide-slate-100 dark:divide-slate-800 border border-slate-100 dark:border-slate-800 rounded-xl overflow-hidden">
              {accessRequests.map((req) => (
                <div
                  key={req._id}
                  className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white dark:bg-slate-900 hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors"
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-slate-900 dark:text-white">
                        {req.investorId?.name || 'Investor'}
                      </span>
                      <span className="text-xs text-slate-400 flex items-center gap-1">
                        <Mail className="w-3 h-3" />
                        {req.investorId?.email}
                      </span>
                    </div>

                    <div className="flex items-center gap-3 text-xs text-slate-500 mt-1">
                      <span className="flex items-center gap-1">
                        <Building className="w-3.5 h-3.5 text-slate-400" />
                        {req.startupId?.name || 'Your Startup'}
                      </span>
                      <span>•</span>
                      <span className="flex items-center gap-1 text-blue-600 font-medium">
                        <FileText className="w-3.5 h-3.5" />
                        {req.documentId?.title || 'Document'}
                      </span>
                      <span>•</span>
                      <span className="flex items-center gap-1 text-slate-400">
                        <Clock className="w-3 h-3" />
                        {formatDate(req.createdAt)}
                      </span>
                    </div>
                  </div>

                  {/* Actions or Status Badge */}
                  <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                    {req.status === 'pending' ? (
                      <>
                        <Button
                          size="sm"
                          disabled={updatingId === req._id}
                          onClick={() => handleAccessAction(req._id, 'approved')}
                          data-testid={`approve-access-${req._id}`}
                          className="bg-emerald-600 hover:bg-emerald-700 text-white h-7 px-3 text-xs flex items-center gap-1"
                        >
                          {updatingId === req._id ? (
                            <Loader2 className="w-3 h-3 animate-spin" />
                          ) : (
                            <Check className="w-3 h-3" />
                          )}
                          Approve
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={updatingId === req._id}
                          onClick={() => handleAccessAction(req._id, 'rejected')}
                          data-testid={`reject-access-${req._id}`}
                          className="text-rose-600 border-rose-200 hover:bg-rose-50 dark:hover:bg-rose-950/40 h-7 px-3 text-xs flex items-center gap-1"
                        >
                          <X className="w-3 h-3" />
                          Reject
                        </Button>
                      </>
                    ) : (
                      <span
                        className={`text-xs font-semibold px-2.5 py-1 rounded-full capitalize ${
                          req.status === 'approved'
                            ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
                            : 'bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300'
                        }`}
                      >
                        {req.status}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tab 2: Connection Requests */}
      {activeTab === 'connection' && (
        <div className="mt-4">
          {loading ? (
            <div className="space-y-3">
              {[1, 2].map((i) => (
                <div key={i} className="h-16 bg-slate-100 dark:bg-slate-800 rounded-lg animate-pulse" />
              ))}
            </div>
          ) : connections.length === 0 ? (
            <div className="text-center py-10 text-xs text-slate-400">
              No investor connection requests yet.
            </div>
          ) : (
            <div className="divide-y divide-slate-100 dark:divide-slate-800 border border-slate-100 dark:border-slate-800 rounded-xl overflow-hidden">
              {connections.map((conn) => (
                <div
                  key={conn._id}
                  className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white dark:bg-slate-900 hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors"
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-slate-900 dark:text-white">
                        {conn.investorId?.name || 'Investor'}
                      </span>
                      <span className="text-xs text-slate-400 flex items-center gap-1">
                        <Mail className="w-3 h-3" />
                        {conn.investorId?.email}
                      </span>
                    </div>

                    <div className="flex items-center gap-3 text-xs text-slate-500 mt-1">
                      <span className="flex items-center gap-1 font-medium text-slate-700 dark:text-slate-300">
                        <Building className="w-3.5 h-3.5 text-slate-400" />
                        {conn.startupId?.name || 'Your Startup'}
                      </span>
                      <span>•</span>
                      <span className="flex items-center gap-1 text-slate-400">
                        <Clock className="w-3 h-3" />
                        {formatDate(conn.createdAt)}
                      </span>
                    </div>

                    {conn.message && (
                      <p className="text-xs italic text-slate-600 dark:text-slate-300 mt-2 bg-slate-50 dark:bg-slate-800/50 p-2 rounded-lg border border-slate-100 dark:border-slate-800">
                        &quot;{conn.message}&quot;
                      </p>
                    )}
                  </div>

                  {/* Actions or Status Badge */}
                  <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                    {conn.status === 'pending' ? (
                      <>
                        <Button
                          size="sm"
                          disabled={updatingId === conn._id}
                          onClick={() => handleConnectionAction(conn._id, 'accepted')}
                          data-testid={`accept-conn-${conn._id}`}
                          className="bg-purple-600 hover:bg-purple-700 text-white h-7 px-3 text-xs flex items-center gap-1"
                        >
                          {updatingId === conn._id ? (
                            <Loader2 className="w-3 h-3 animate-spin" />
                          ) : (
                            <Check className="w-3 h-3" />
                          )}
                          Accept
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={updatingId === conn._id}
                          onClick={() => handleConnectionAction(conn._id, 'declined')}
                          data-testid={`decline-conn-${conn._id}`}
                          className="text-rose-600 border-rose-200 hover:bg-rose-50 dark:hover:bg-rose-950/40 h-7 px-3 text-xs flex items-center gap-1"
                        >
                          <X className="w-3 h-3" />
                          Decline
                        </Button>
                      </>
                    ) : (
                      <span
                        className={`text-xs font-semibold px-2.5 py-1 rounded-full capitalize ${
                          conn.status === 'accepted'
                            ? 'bg-purple-100 text-purple-800 dark:bg-purple-950/60 dark:text-purple-300'
                            : 'bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300'
                        }`}
                      >
                        {conn.status}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

