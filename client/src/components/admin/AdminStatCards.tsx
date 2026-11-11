'use client';

import React from 'react';
import { Users, Building2, UserCheck, Video, Clock, CheckCircle2, ShieldAlert } from 'lucide-react';
import { AdminStats } from '@/lib/admin.api';

interface AdminStatCardsProps {
  stats: AdminStats | null;
  loading?: boolean;
}

export function AdminStatCards({ stats, loading }: AdminStatCardsProps) {
  if (loading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-28 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 animate-pulse" />
        ))}
      </div>
    );
  }

  const items = [
    {
      title: 'Total Users',
      value: stats?.users.total ?? 0,
      subtext: `${stats?.users.founders ?? 0} Founders • ${stats?.users.investors ?? 0} Investors`,
      icon: Users,
      badge: stats?.users.pending ? `${stats.users.pending} Pending KYC` : null,
      iconBg: 'bg-purple-50 text-purple-600 dark:bg-purple-950/40 dark:text-purple-400',
    },
    {
      title: 'Startup Pitches',
      value: stats?.startups.total ?? 0,
      subtext: `${stats?.startups.approved ?? 0} Live • ${stats?.startups.rejected ?? 0} Rejected`,
      icon: Building2,
      badge: stats?.startups.pending ? `${stats.startups.pending} Pending Review` : null,
      iconBg: 'bg-blue-50 text-blue-600 dark:bg-blue-950/40 dark:text-blue-400',
    },
    {
      title: 'Active Connections',
      value: stats?.connections.total ?? 0,
      subtext: 'Investor-to-Founder intros',
      icon: UserCheck,
      badge: null,
      iconBg: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400',
    },
    {
      title: 'Scheduled Meetings',
      value: stats?.meetings.active ?? 0,
      subtext: 'Live Jitsi pitch video calls',
      icon: Video,
      badge: null,
      iconBg: 'bg-amber-50 text-amber-600 dark:bg-amber-950/40 dark:text-amber-400',
    },
  ];

  // Visual Breakdown Chart (Proportional user & startup distribution)
  const totalUsersCount = Math.max(1, stats?.users.total || 1);
  const founderPct = Math.round(((stats?.users.founders || 0) / totalUsersCount) * 100);
  const investorPct = Math.round(((stats?.users.investors || 0) / totalUsersCount) * 100);
  const adminPct = Math.max(0, 100 - founderPct - investorPct);

  return (
    <div className="space-y-6 mb-8">
      {/* 4 Primary Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {items.map((item) => {
          const Icon = item.icon;
          return (
            <div
              key={item.title}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs hover:border-purple-300 dark:hover:border-purple-700 transition-colors"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  {item.title}
                </span>
                <div className={`p-2 rounded-xl ${item.iconBg}`}>
                  <Icon className="w-4 h-4" />
                </div>
              </div>

              <div className="mt-3 flex items-baseline gap-2">
                <span className="text-2xl font-black text-slate-900 dark:text-white" data-testid={`admin-stat-${item.title.toLowerCase().replace(/\s+/g, '-')}`}>
                  {item.value}
                </span>
                {item.badge && (
                  <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300">
                    {item.badge}
                  </span>
                )}
              </div>
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{item.subtext}</p>
            </div>
          );
        })}
      </div>

      {/* Visual Platform Distribution Bar Chart */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs">
        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-2">
          Platform Ecosystem Distribution
        </h4>
        <div className="w-full h-3 rounded-full bg-slate-100 dark:bg-slate-800 flex overflow-hidden">
          <div style={{ width: `${founderPct}%` }} className="bg-blue-600 h-full" title={`Founders: ${founderPct}%`} />
          <div style={{ width: `${investorPct}%` }} className="bg-emerald-600 h-full" title={`Investors: ${investorPct}%`} />
          <div style={{ width: `${adminPct}%` }} className="bg-purple-600 h-full" title={`Admins: ${adminPct}%`} />
        </div>
        <div className="flex items-center justify-between text-[11px] text-slate-500 mt-2">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-blue-600 inline-block" />
            <span>Founders ({founderPct}%)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-600 inline-block" />
            <span>Investors ({investorPct}%)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-purple-600 inline-block" />
            <span>Admins ({adminPct}%)</span>
          </div>
        </div>
      </div>
    </div>
  );
}

