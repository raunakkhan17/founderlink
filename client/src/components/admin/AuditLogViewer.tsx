'use client';

import React, { useState, useEffect } from 'react';
import {
  FileText,
  Filter,
  Calendar,
  Clock,
  User,
  Activity,
  Loader2,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { AdminAuditLog, getAdminAuditLogs } from '@/lib/admin.api';

export function AuditLogViewer() {
  const [logs, setLogs] = useState<AdminAuditLog[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);

  const [actionFilter, setActionFilter] = useState('all');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const loadLogs = async () => {
    try {
      setLoading(true);
      const res = await getAdminAuditLogs({
        action: actionFilter,
        startDate: startDate || undefined,
        endDate: endDate || undefined,
        page,
        limit: 15,
      });

      if (res.success && res.data) {
        setLogs(res.data.auditLogs);
        setTotal(res.data.total);
        setTotalPages(res.data.totalPages);
      }
    } catch (err) {
      console.error('Failed to load audit logs:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLogs();
  }, [actionFilter, page]);

  const handleFilterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    loadLogs();
  };

  const getActionBadgeClass = (action: string) => {
    if (action.includes('approved')) {
      return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300';
    }
    if (action.includes('rejected') || action.includes('suspended') || action.includes('delete')) {
      return 'bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300';
    }
    return 'bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300';
  };

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-xs space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-slate-800">
        <div>
          <h3 className="font-bold text-base text-slate-900 dark:text-white flex items-center gap-2">
            <Activity className="w-4 h-4 text-purple-600" />
            Platform Audit Trail &amp; Compliance Logs
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Immutable log of user approvals, rejections, document views, and security events.
          </p>
        </div>

        <span className="text-xs font-semibold text-slate-500">
          Total Events: {total}
        </span>
      </div>

      {/* Filter Controls */}
      <form onSubmit={handleFilterSubmit} className="flex flex-wrap items-center gap-2">
        <select
          value={actionFilter}
          onChange={(e) => {
            setActionFilter(e.target.value);
            setPage(1);
          }}
          className="px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800"
        >
          <option value="all">All Actions</option>
          <option value="user_verification_approved">User Verification Approved</option>
          <option value="user_verification_rejected">User Verification Rejected</option>
          <option value="startup_approved">Startup Approved</option>
          <option value="startup_rejected">Startup Rejected</option>
          <option value="user_suspended">User Suspended</option>
          <option value="user_reactivated">User Reactivated</option>
          <option value="document_view">Document Access / View</option>
          <option value="startup_view">Startup Page View</option>
        </select>

        <div className="flex items-center gap-1.5 text-xs text-slate-500">
          <span>From</span>
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="px-2.5 py-1.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
          />
        </div>

        <div className="flex items-center gap-1.5 text-xs text-slate-500">
          <span>To</span>
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="px-2.5 py-1.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
          />
        </div>

        <Button type="submit" size="sm" className="bg-purple-600 hover:bg-purple-700 text-white text-xs">
          Filter Logs
        </Button>
      </form>

      {/* Log Feed Table */}
      <div className="border border-slate-100 dark:border-slate-800 rounded-xl overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 border-b border-slate-100 dark:border-slate-800">
            <tr>
              <th className="py-3 px-4 font-semibold">Timestamp</th>
              <th className="py-3 px-4 font-semibold">Actor / User</th>
              <th className="py-3 px-4 font-semibold">Action</th>
              <th className="py-3 px-4 font-semibold">Target Entity</th>
              <th className="py-3 px-4 font-semibold">IP Address</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {loading ? (
              <tr>
                <td colSpan={5} className="py-8 text-center text-slate-400">
                  <Loader2 className="w-5 h-5 animate-spin mx-auto mb-1 text-purple-600" />
                  Loading audit logs...
                </td>
              </tr>
            ) : logs.length === 0 ? (
              <tr>
                <td colSpan={5} className="py-8 text-center text-slate-400">
                  No audit log entries matching filters.
                </td>
              </tr>
            ) : (
              logs.map((log) => (
                <tr key={log._id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition-colors">
                  <td className="py-3 px-4 text-slate-500 whitespace-nowrap">
                    {new Date(log.createdAt).toLocaleString()}
                  </td>
                  <td className="py-3 px-4">
                    {log.userId ? (
                      <div>
                        <div className="font-bold text-slate-900 dark:text-white">{log.userId.name}</div>
                        <div className="text-[10px] text-slate-400">{log.userId.email} ({log.userId.role})</div>
                      </div>
                    ) : (
                      <span className="text-slate-400 italic">System / Unauthenticated</span>
                    )}
                  </td>
                  <td className="py-3 px-4">
                    <span className={`inline-flex text-[11px] font-semibold px-2.5 py-0.5 rounded-full capitalize ${getActionBadgeClass(log.action)}`}>
                      {log.action.replace(/_/g, ' ')}
                    </span>
                  </td>
                  <td className="py-3 px-4 capitalize font-medium text-slate-700 dark:text-slate-300">
                    {log.targetType} {log.targetId ? `(#${String(log.targetId).slice(-6)})` : ''}
                  </td>
                  <td className="py-3 px-4 text-slate-400 font-mono text-[11px]">
                    {log.ip || '—'}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between pt-2">
          <span className="text-xs text-slate-500">
            Page {page} of {totalPages}
          </span>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="xs"
              disabled={page <= 1}
              onClick={() => setPage(page - 1)}
            >
              <ChevronLeft className="w-3 h-3 mr-1" /> Previous
            </Button>
            <Button
              variant="outline"
              size="xs"
              disabled={page >= totalPages}
              onClick={() => setPage(page + 1)}
            >
              Next <ChevronRight className="w-3 h-3 ml-1" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

