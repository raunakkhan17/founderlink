'use client';

import React from 'react';
import { Activity, Clock, ShieldCheck, UserPlus, Rocket } from 'lucide-react';
import { FounderStats } from '@/lib/founder.api';

interface RecentActivityProps {
  activities?: FounderStats['recentActivity'];
  loading?: boolean;
}

export function RecentActivity({ activities = [], loading }: RecentActivityProps) {
  if (loading) {
    return (
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 animate-pulse">
        <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-1/4 mb-4" />
        <div className="space-y-3">
          <div className="h-10 bg-slate-100 dark:bg-slate-800/50 rounded" />
          <div className="h-10 bg-slate-100 dark:bg-slate-800/50 rounded" />
        </div>
      </div>
    );
  }

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'access_request':
        return <ShieldCheck className="w-4 h-4 text-amber-600 dark:text-amber-400" />;
      case 'connection':
        return <UserPlus className="w-4 h-4 text-purple-600 dark:text-purple-400" />;
      default:
        return <Rocket className="w-4 h-4 text-blue-600 dark:text-blue-400" />;
    }
  };

  const formatActivityDate = (dateStr: string) => {
    try {
      const date = new Date(dateStr);
      return date.toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 shadow-xs">
      <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
        <div className="flex items-center gap-2">
          <Activity className="w-4 h-4 text-blue-600" />
          <h3 className="font-semibold text-slate-900 dark:text-white text-sm">Recent Activity</h3>
        </div>
        <span className="text-xs text-slate-500">{activities.length} updates</span>
      </div>

      {activities.length === 0 ? (
        <div className="py-8 text-center text-slate-500 dark:text-slate-400 text-sm">
          No recent activity yet. Share your pitch to start receiving views and requests!
        </div>
      ) : (
        <div className="divide-y divide-slate-100 dark:divide-slate-800 mt-2">
          {activities.map((act) => (
            <div key={act.id} className="py-3 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3 min-w-0">
                <div className="p-2 rounded-full bg-slate-100 dark:bg-slate-800 shrink-0">
                  {getActivityIcon(act.type)}
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-medium text-slate-900 dark:text-slate-100 truncate">
                    {act.title}
                  </p>
                  <div className="flex items-center gap-1 text-[11px] text-slate-400 mt-0.5">
                    <Clock className="w-3 h-3" />
                    <span>{formatActivityDate(act.date)}</span>
                  </div>
                </div>
              </div>

              {act.status && (
                <span
                  className={`text-[11px] font-medium px-2 py-0.5 rounded-full capitalize shrink-0 ${
                    act.status === 'approved' || act.status === 'accepted'
                      ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
                      : act.status === 'rejected' || act.status === 'declined'
                      ? 'bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300'
                      : 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300'
                  }`}
                >
                  {act.status}
                </span>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

