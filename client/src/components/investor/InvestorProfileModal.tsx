'use client';

import React, { useState, useEffect } from 'react';
import { X, Check, Plus, Trash2, User, DollarSign, Tag, Briefcase } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { getInvestorProfile, updateInvestorProfile, InvestorUser } from '@/lib/investor.api';

interface InvestorProfileModalProps {
  onClose: () => void;
  onSuccess?: () => void;
}

const COMMON_INTERESTS = [
  'CleanTech',
  'AI / ML',
  'SaaS',
  'Fintech',
  'Healthtech',
  'Cybersecurity',
  'E-commerce',
  'Hardware',
  'Edtech',
  'Web3',
];

export function InvestorProfileModal({ onClose, onSuccess }: InvestorProfileModalProps) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [headline, setHeadline] = useState('');
  const [bio, setBio] = useState('');
  const [location, setLocation] = useState('');
  const [interests, setInterests] = useState<string[]>([]);
  const [newInterestInput, setNewInterestInput] = useState('');
  const [ticketMin, setTicketMin] = useState<string>('');
  const [ticketMax, setTicketMax] = useState<string>('');
  const [pastInvestments, setPastInvestments] = useState<string[]>([]);
  const [newPastInvestment, setNewPastInvestment] = useState('');

  useEffect(() => {
    async function load() {
      try {
        setLoading(true);
        const res = await getInvestorProfile();
        if (res.success && res.data?.user) {
          const u = res.data.user;
          setHeadline(u.headline || '');
          setBio(u.bio || '');
          setLocation(u.location || '');
          setInterests(u.investorProfile?.interests || []);
          setTicketMin(u.investorProfile?.ticketMin ? String(u.investorProfile.ticketMin) : '');
          setTicketMax(u.investorProfile?.ticketMax ? String(u.investorProfile.ticketMax) : '');
          setPastInvestments(u.investorProfile?.pastInvestments || []);
        }
      } catch (err: any) {
        setError(err.message || 'Failed to load profile');
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const handleToggleInterest = (tag: string) => {
    if (interests.includes(tag)) {
      setInterests(interests.filter((i) => i !== tag));
    } else {
      setInterests([...interests, tag]);
    }
  };

  const handleAddCustomInterest = () => {
    const trimmed = newInterestInput.trim();
    if (trimmed && !interests.includes(trimmed)) {
      setInterests([...interests, trimmed]);
      setNewInterestInput('');
    }
  };

  const handleAddPastInvestment = () => {
    const trimmed = newPastInvestment.trim();
    if (trimmed && !pastInvestments.includes(trimmed)) {
      setPastInvestments([...pastInvestments, trimmed]);
      setNewPastInvestment('');
    }
  };

  const handleRemovePastInvestment = (index: number) => {
    setPastInvestments(pastInvestments.filter((_, i) => i !== index));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSaving(true);
      setError(null);
      const res = await updateInvestorProfile({
        headline,
        bio,
        location,
        interests,
        ticketMin: ticketMin ? Number(ticketMin) : undefined,
        ticketMax: ticketMax ? Number(ticketMax) : undefined,
        pastInvestments,
      });

      if (res.success) {
        onSuccess?.();
        onClose();
      } else {
        throw new Error(res.message || 'Failed to update profile');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to save profile');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in">
      <div className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 shadow-2xl">
        <button
          type="button"
          onClick={onClose}
          className="absolute top-5 right-5 p-1 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
        >
          <X className="w-5 h-5" />
        </button>

        <h3 className="font-extrabold text-xl text-slate-900 dark:text-white mb-1">
          Investor Profile & Mandate
        </h3>
        <p className="text-xs text-slate-500 mb-6">
          Customize your investment thesis, check size range, and portfolio to attract ideal pitch matches.
        </p>

        {error && (
          <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs">
            {error}
          </div>
        )}

        {loading ? (
          <div className="py-12 text-center text-xs text-slate-400">Loading profile...</div>
        ) : (
          <form onSubmit={handleSave} className="space-y-6">
            {/* Headline & Location */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                  Professional Headline
                </label>
                <input
                  type="text"
                  placeholder="e.g. Angel Investor & Ex-Founder"
                  value={headline}
                  onChange={(e) => setHeadline(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                  Location
                </label>
                <input
                  type="text"
                  placeholder="e.g. San Francisco, CA"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
                />
              </div>
            </div>

            {/* Bio / Thesis */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                Investment Thesis & Bio
              </label>
              <textarea
                rows={3}
                placeholder="Share your investment background, sweet spot stage, and how you help founders..."
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
              />
            </div>

            {/* Check Size Range */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                <DollarSign className="w-3.5 h-3.5 text-emerald-600" />
                Typical Check / Ticket Size ($ USD)
              </label>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="text-[10px] text-slate-400 block mb-0.5">Min Ticket ($)</span>
                  <input
                    type="number"
                    placeholder="25000"
                    value={ticketMin}
                    onChange={(e) => setTicketMin(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
                  />
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block mb-0.5">Max Ticket ($)</span>
                  <input
                    type="number"
                    placeholder="250000"
                    value={ticketMax}
                    onChange={(e) => setTicketMax(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
                  />
                </div>
              </div>
            </div>

            {/* Industry Interests */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                <Tag className="w-3.5 h-3.5 text-emerald-600" />
                Sectors & Interests
              </label>
              <div className="flex flex-wrap gap-2 mb-3">
                {COMMON_INTERESTS.map((tag) => {
                  const isSelected = interests.includes(tag);
                  return (
                    <button
                      key={tag}
                      type="button"
                      onClick={() => handleToggleInterest(tag)}
                      className={`text-xs px-3 py-1 rounded-full font-medium transition-all ${
                        isSelected
                          ? 'bg-emerald-600 text-white shadow-xs'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
                      }`}
                    >
                      {tag}
                    </button>
                  );
                })}
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="text"
                  placeholder="Add custom sector (e.g. BioTech)..."
                  value={newInterestInput}
                  onChange={(e) => setNewInterestInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddCustomInterest();
                    }
                  }}
                  className="flex-1 px-3 py-1.5 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
                />
                <Button type="button" variant="outline" size="sm" onClick={handleAddCustomInterest} className="text-xs">
                  <Plus className="w-3 h-3 mr-1" /> Add
                </Button>
              </div>
            </div>

            {/* Past Investments */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                <Briefcase className="w-3.5 h-3.5 text-emerald-600" />
                Portfolio & Past Investments
              </label>

              <div className="space-y-2 mb-3">
                {pastInvestments.map((inv, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between p-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 text-xs"
                  >
                    <span className="font-medium text-slate-800 dark:text-slate-200">{inv}</span>
                    <button
                      type="button"
                      onClick={() => handleRemovePastInvestment(idx)}
                      className="text-slate-400 hover:text-rose-600"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="text"
                  placeholder="Company name or angel deal (e.g. Stripe, Airbnb)..."
                  value={newPastInvestment}
                  onChange={(e) => setNewPastInvestment(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddPastInvestment();
                    }
                  }}
                  className="flex-1 px-3 py-1.5 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
                />
                <Button type="button" variant="outline" size="sm" onClick={handleAddPastInvestment} className="text-xs">
                  <Plus className="w-3 h-3 mr-1" /> Add
                </Button>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="flex justify-end gap-2 pt-4 border-t border-slate-100 dark:border-slate-800">
              <Button type="button" variant="outline" size="sm" onClick={onClose} disabled={saving}>
                Cancel
              </Button>
              <Button
                type="submit"
                size="sm"
                disabled={saving}
                className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold px-4"
              >
                {saving ? 'Saving...' : 'Save Mandate'}
              </Button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

