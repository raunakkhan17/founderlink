'use client';

import React from 'react';
import { Filter, RotateCcw, Search, DollarSign, Layers, Tag } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { BrowseFilterParams } from '@/lib/investor.api';

interface FilterSidebarProps {
  filters: BrowseFilterParams;
  onChange: (updated: Partial<BrowseFilterParams>) => void;
  onReset: () => void;
}

const INDUSTRIES = [
  'all',
  'SaaS',
  'Fintech',
  'Healthtech',
  'AI / ML',
  'CleanTech',
  'E-commerce',
  'Edtech',
  'Cybersecurity',
  'Hardware',
  'Other',
];

const STAGES = [
  { value: 'all', label: 'All Stages' },
  { value: 'idea', label: 'Idea Stage' },
  { value: 'mvp', label: 'MVP' },
  { value: 'seed', label: 'Seed' },
  { value: 'growth', label: 'Growth' },
];

export function FilterSidebar({ filters, onChange, onReset }: FilterSidebarProps) {
  return (
    <aside className="w-full lg:w-64 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-emerald-600" />
          <h3 className="font-bold text-sm text-slate-900 dark:text-white">Filters & Sort</h3>
        </div>
        <button
          type="button"
          onClick={onReset}
          className="text-xs text-slate-400 hover:text-emerald-600 flex items-center gap-1 transition-colors"
          title="Reset all filters"
        >
          <RotateCcw className="w-3 h-3" />
          <span>Reset</span>
        </button>
      </div>

      {/* Sort By */}
      <div>
        <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
          Sort Deals By
        </label>
        <select
          value={filters.sort || 'recent'}
          onChange={(e) => onChange({ sort: e.target.value, page: 1 })}
          data-testid="filter-sort-select"
          className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
        >
          <option value="recent">Newest Pitches</option>
          <option value="views">Most Viewed Deals</option>
          <option value="funding_desc">Funding Ask: High to Low</option>
          <option value="funding_asc">Funding Ask: Low to High</option>
        </select>
      </div>

      {/* Industry Filter */}
      <div>
        <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2 flex items-center gap-1.5">
          <Tag className="w-3.5 h-3.5 text-slate-400" />
          Industry
        </label>
        <select
          value={filters.industry || 'all'}
          onChange={(e) => onChange({ industry: e.target.value, page: 1 })}
          data-testid="filter-industry-select"
          className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
        >
          {INDUSTRIES.map((ind) => (
            <option key={ind} value={ind}>
              {ind === 'all' ? 'All Industries' : ind}
            </option>
          ))}
        </select>
      </div>

      {/* Stage Filter */}
      <div>
        <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2 flex items-center gap-1.5">
          <Layers className="w-3.5 h-3.5 text-slate-400" />
          Startup Stage
        </label>
        <div className="space-y-1.5">
          {STAGES.map((s) => (
            <label
              key={s.value}
              className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-300 cursor-pointer hover:text-emerald-600"
            >
              <input
                type="radio"
                name="stageFilter"
                value={s.value}
                checked={(filters.stage || 'all') === s.value}
                onChange={() => onChange({ stage: s.value, page: 1 })}
                className="text-emerald-600 focus:ring-emerald-500 h-3.5 w-3.5"
              />
              <span>{s.label}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Funding Ask Range */}
      <div>
        <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2 flex items-center gap-1.5">
          <DollarSign className="w-3.5 h-3.5 text-slate-400" />
          Target Ask ($ USD)
        </label>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <span className="text-[10px] text-slate-400 block mb-0.5">Min ($)</span>
            <input
              type="number"
              placeholder="0"
              value={filters.minFunding || ''}
              onChange={(e) => onChange({ minFunding: e.target.value, page: 1 })}
              data-testid="filter-min-funding"
              className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
            />
          </div>
          <div>
            <span className="text-[10px] text-slate-400 block mb-0.5">Max ($)</span>
            <input
              type="number"
              placeholder="5M+"
              value={filters.maxFunding || ''}
              onChange={(e) => onChange({ maxFunding: e.target.value, page: 1 })}
              data-testid="filter-max-funding"
              className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
            />
          </div>
        </div>
      </div>
    </aside>
  );
}

