'use client';

import React from 'react';
import { Eye, TrendingUp, Key, UserCheck } from 'lucide-react';
import { FounderStats } from '@/lib/founder.api';

interface StatCardsProps {
  stats: FounderStats | null;
  loading?: boolean;
}

export function StatCards({ stats, loading }: StatCardsProps) {
  if (loading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="animate-pulse bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 h-28"
          />
        ))}
      </div>
    );
  }

  const items = [
    {
      title: 'Profile Views',
      value: stats?.profileViews ?? 0,
      subtext: 'Potential investor views',
      icon: Eye,
      iconColor: 'text-blue-600 dark:text-blue-400',
      bgColor: 'bg-blue-50 dark:bg-blue-950/40',
      badge: null,
    },
    {
      title: 'Startup Views',
      value: stats?.startupViews ?? 0,
      subtext: 'Total pitch impressions',
      icon: TrendingUp,
      iconColor: 'text-emerald-600 dark:text-emerald-400',
      bgColor: 'bg-emerald-50 dark:bg-emerald-950/40',
      badge: null,
    },
    {
      title: 'Access Requests',
      value: stats?.accessRequests.total ?? 0,
      subtext: 'Pitch & financials access',
      icon: Key,
      iconColor: 'text-amber-600 dark:text-amber-400',
      bgColor: 'bg-amber-50 dark:bg-amber-950/40',
      badge:
        stats?.accessRequests?.pending && stats.accessRequests.pending > 0
          ? `${stats.accessRequests.pending} pending`
          : null,
    },
    {
      title: 'Connection Requests',
      value: stats?.connectionRequests.total ?? 0,
      subtext: 'Direct founder links',
      icon: UserCheck,
      iconColor: 'text-purple-600 dark:text-purple-400',
      bgColor: 'bg-purple-50 dark:bg-purple-950/40',
      badge:
        stats?.connectionRequests?.pending && stats.connectionRequests.pending > 0
          ? `${stats.connectionRequests.pending} pending`
          : null,
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
      {items.map((item) => {
        const Icon = item.icon;
        return (
          <div
            key={item.title}
            className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-xs hover:border-blue-300 dark:hover:border-blue-700 transition-colors"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                {item.title}
              </span>
              <div className={`p-2 rounded-lg ${item.bgColor} ${item.iconColor}`}>
                <Icon className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-2xl font-bold text-slate-900 dark:text-white" data-testid={`stat-${item.title.toLowerCase().replace(/\s+/g, '-')}`}>
                {item.value}
              </span>
              {item.badge && (
                <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300">
                  {item.badge}
                </span>
              )}
            </div>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{item.subtext}</p>
          </div>
        );
      })}
    </div>
  );
}

