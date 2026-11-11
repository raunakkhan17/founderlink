'use client';

import React from 'react';
import Link from 'next/link';
import { Bookmark, Send, ExternalLink, Eye, DollarSign, Percent, Building2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Startup } from '@/lib/founder.api';

interface StartupCardProps {
  startup: Startup;
  isSaved?: boolean;
  onToggleSave?: (startupId: string) => void;
  onConnect?: (startup: Startup) => void;
}

export function StartupCard({
  startup,
  isSaved = false,
  onToggleSave,
  onConnect,
}: StartupCardProps) {
  const founder = (startup as any).founderId;

  const getStageBadgeColor = (stage: string) => {
    switch (stage) {
      case 'growth':
        return 'bg-purple-100 text-purple-800 dark:bg-purple-950/60 dark:text-purple-300';
      case 'seed':
        return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300';
      case 'mvp':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300';
      default:
        return 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300';
    }
  };

  return (
    <div
      className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-xs hover:border-emerald-300 dark:hover:border-emerald-700 transition-all flex flex-col justify-between"
      data-testid={`startup-card-${startup._id}`}
    >
      <div>
        {/* Card Header: Avatar, Name, Stage & Industry, Bookmark */}
        <div className="flex items-start justify-between gap-4 mb-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-700 text-white font-extrabold text-lg flex items-center justify-center shrink-0 shadow-xs">
              {startup.name.charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <Link
                  href={`/dashboard/investor/startups/${startup._id}`}
                  className="font-bold text-lg text-slate-900 dark:text-white hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors truncate"
                >
                  {startup.name}
                </Link>
              </div>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-medium">
                  {startup.industry}
                </span>
                <span className={`text-xs px-2 py-0.5 rounded-full font-semibold capitalize ${getStageBadgeColor(startup.stage)}`}>
                  {startup.stage.replace('_', ' ')}
                </span>
              </div>
            </div>
          </div>

          {/* Bookmark / Watchlist Button */}
          <button
            type="button"
            onClick={() => onToggleSave?.(startup._id)}
            data-testid={`save-btn-${startup._id}`}
            aria-label={isSaved ? 'Remove from Watchlist' : 'Save to Watchlist'}
            className={`p-2 rounded-xl border transition-all ${
              isSaved
                ? 'bg-amber-50 border-amber-200 text-amber-600 dark:bg-amber-950/40 dark:border-amber-800 dark:text-amber-300'
                : 'border-slate-200 dark:border-slate-800 text-slate-400 hover:text-slate-700 hover:border-slate-300 dark:hover:text-slate-200'
            }`}
          >
            <Bookmark className={`w-4 h-4 ${isSaved ? 'fill-current' : ''}`} />
          </button>
        </div>

        {/* Tagline */}
        <p className="text-sm font-medium text-slate-700 dark:text-slate-200 mb-3 line-clamp-2">
          {startup.tagline}
        </p>

        {/* Problem / Solution Excerpt */}
        {startup.problem && (
          <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 mb-4 bg-slate-50 dark:bg-slate-800/40 p-2.5 rounded-xl border border-slate-100 dark:border-slate-800/60">
            <span className="font-semibold text-slate-700 dark:text-slate-300">Problem: </span>
            {startup.problem}
          </p>
        )}

        {/* Deal Metrics Highlights */}
        <div className="grid grid-cols-3 gap-2 py-3 border-y border-slate-100 dark:border-slate-800 text-center mb-4">
          <div className="p-2 rounded-lg bg-slate-50 dark:bg-slate-800/40">
            <span className="text-[10px] uppercase font-semibold text-slate-400 tracking-wider block">Ask</span>
            <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">
              {startup.fundingAsk ? `$${(startup.fundingAsk / 1000).toLocaleString()}k` : 'Not Raising'}
            </span>
          </div>
          <div className="p-2 rounded-lg bg-slate-50 dark:bg-slate-800/40">
            <span className="text-[10px] uppercase font-semibold text-slate-400 tracking-wider block">Equity</span>
            <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
              {startup.equityOffered ? `${startup.equityOffered}%` : 'N/A'}
            </span>
          </div>
          <div className="p-2 rounded-lg bg-slate-50 dark:bg-slate-800/40">
            <span className="text-[10px] uppercase font-semibold text-slate-400 tracking-wider block">Views</span>
            <span className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center justify-center gap-1">
              <Eye className="w-3 h-3 text-slate-400" />
              {startup.viewsCount || 0}
            </span>
          </div>
        </div>

        {/* Founder Info */}
        {founder && (
          <div className="flex items-center gap-2 mb-4 text-xs text-slate-500">
            <div className="w-5 h-5 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden flex items-center justify-center text-[10px] font-bold">
              {founder.avatarUrl ? (
                <img src={founder.avatarUrl} alt={founder.name} className="w-full h-full object-cover" />
              ) : (
                founder.name?.charAt(0) || 'F'
              )}
            </div>
            <span className="font-medium text-slate-700 dark:text-slate-300">{founder.name}</span>
            {founder.headline && <span className="text-slate-400 truncate">• {founder.headline}</span>}
          </div>
        )}
      </div>

      {/* Card Actions: View Deal & Connect */}
      <div className="flex items-center gap-2 pt-2">
        <Link
          href={`/dashboard/investor/startups/${startup._id}`}
          className="flex-1"
        >
          <Button
            variant="outline"
            size="sm"
            className="w-full text-xs font-medium border-slate-200 dark:border-slate-800 flex items-center justify-center gap-1.5"
          >
            <span>View Pitch</span>
            <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
          </Button>
        </Link>

        <Button
          size="sm"
          onClick={() => onConnect?.(startup)}
          data-testid={`connect-btn-${startup._id}`}
          className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-medium flex items-center gap-1.5 px-3.5"
        >
          <Send className="w-3.5 h-3.5" />
          <span>Connect</span>
        </Button>
      </div>
    </div>
  );
}

