'use client';

import React, { useState, useEffect, useRef } from 'react';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { StatCards } from '@/components/founder/StatCards';
import { RecentActivity } from '@/components/founder/RecentActivity';
import { StartupForm } from '@/components/founder/StartupForm';
import { DocumentManager } from '@/components/founder/DocumentManager';
import { RequestsInbox } from '@/components/founder/RequestsInbox';
import {
  FounderStats,
  Startup,
  getFounderStats,
  getStartups,
  deleteStartup,
  uploadAvatar,
} from '@/lib/founder.api';
import {
  Plus,
  Building2,
  FolderLock,
  Inbox,
  Sparkles,
  Camera,
  Trash2,
  ExternalLink,
  Clock,
  CheckCircle2,
  AlertCircle,
  X,
} from 'lucide-react';

export default function FounderDashboardPage() {
  const { user, logout } = useAuth();
  const [stats, setStats] = useState<FounderStats | null>(null);
  const [startups, setStartups] = useState<Startup[]>([]);
  const [selectedStartupId, setSelectedStartupId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [showPostModal, setShowPostModal] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'startups' | 'vault' | 'inbox'>('overview');
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [userAvatar, setUserAvatar] = useState<string | null>(user?.avatarUrl || null);

  const avatarInputRef = useRef<HTMLInputElement>(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [statsRes, startupsRes] = await Promise.all([
        getFounderStats(),
        getStartups(),
      ]);

      if (statsRes.success && statsRes.data) {
        setStats(statsRes.data);
      }
      if (startupsRes.success && startupsRes.data) {
        setStartups(startupsRes.data);
        if (startupsRes.data.length > 0 && !selectedStartupId) {
          setSelectedStartupId(startupsRes.data[0]._id);
        }
      }
    } catch (err) {
      console.error('Error fetching founder dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      try {
        setAvatarUploading(true);
        const formData = new FormData();
        formData.append('avatar', file);
        const res = await uploadAvatar(formData);
        if (res.success && res.data?.avatarUrl) {
          setUserAvatar(res.data.avatarUrl);
        }
      } catch (err) {
        console.error('Failed to upload avatar:', err);
      } finally {
        setAvatarUploading(false);
      }
    }
  };

  const handleDeleteStartup = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete startup "${name}"?`)) return;
    try {
      const res = await deleteStartup(id);
      if (res.success) {
        setStartups((prev) => prev.filter((s) => s._id !== id));
        if (selectedStartupId === id) {
          setSelectedStartupId(startups.find((s) => s._id !== id)?._id || null);
        }
      }
    } catch (err) {
      console.error('Failed to delete startup:', err);
    }
  };

  const selectedStartup = startups.find((s) => s._id === selectedStartupId) || startups[0];

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'approved':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300">
            <CheckCircle2 className="w-3 h-3" /> Approved
          </span>
        );
      case 'pending':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300">
            <Clock className="w-3 h-3" /> Pending Review
          </span>
        );
      case 'rejected':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300">
            <AlertCircle className="w-3 h-3" /> Rejected
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-300">
            Draft
          </span>
        );
    }
  };

  return (
    <ProtectedRoute allowedRoles={['founder']}>
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100">
        {/* Navigation Header */}
        <header className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 sticky top-0 z-30">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-xl bg-blue-600 flex items-center justify-center text-white font-black text-lg shadow-xs">
                F
              </div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-xl text-blue-600 tracking-tight">FounderLink</span>
                <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-blue-100 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 font-semibold">
                  Founder Hub
                </span>
              </div>
            </div>

            <div className="flex items-center gap-4">
              {/* Profile & Avatar */}
              <div className="flex items-center gap-2.5">
                <div className="relative group cursor-pointer" onClick={() => avatarInputRef.current?.click()}>
                  <div className="w-9 h-9 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden flex items-center justify-center text-xs font-bold text-slate-600 dark:text-slate-200 border border-slate-300 dark:border-slate-600">
                    {userAvatar ? (
                      <img src={userAvatar} alt={user?.name} className="w-full h-full object-cover" />
                    ) : (
                      user?.name?.charAt(0).toUpperCase() || 'F'
                    )}
                  </div>
                  <div className="absolute inset-0 rounded-full bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity text-white">
                    <Camera className="w-3.5 h-3.5" />
                  </div>
                  <input
                    ref={avatarInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleAvatarChange}
                    className="hidden"
                  />
                </div>
                <div className="hidden sm:block text-left">
                  <div className="text-xs font-bold leading-tight">{user?.name}</div>
                  <div className="text-[11px] text-slate-400">{user?.email}</div>
                </div>
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

        {/* Dashboard Main Container */}
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Top Banner / Call To Action */}
          <div className="bg-gradient-to-r from-blue-600 to-indigo-700 rounded-2xl p-6 sm:p-8 text-white mb-8 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-6">
            <div>
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-white/20 text-white text-xs font-semibold mb-2">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Founder Control Center</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
                Welcome back, {user?.name || 'Founder'}!
              </h1>
              <p className="text-blue-100 text-xs sm:text-sm mt-1 max-w-xl">
                Track pitch performance, share secured decks, and review investor connection requests.
              </p>
            </div>

            <Button
              onClick={() => setShowPostModal(true)}
              className="bg-white text-blue-700 hover:bg-blue-50 font-semibold px-5 py-2.5 rounded-xl shadow-xs flex items-center gap-2 self-start sm:self-center shrink-0 text-sm"
            >
              <Plus className="w-4 h-4" />
              Post Your Startup
            </Button>
          </div>

          {/* 1. Stat Cards */}
          <StatCards stats={stats} loading={loading} />

          {/* Navigation Tabs */}
          <div className="flex border-b border-slate-200 dark:border-slate-800 mb-8 space-x-6">
            <button
              onClick={() => setActiveTab('overview')}
              className={`pb-3 text-sm font-semibold flex items-center gap-2 border-b-2 transition-all ${
                activeTab === 'overview'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              <Building2 className="w-4 h-4" />
              Dashboard Overview
            </button>
            <button
              onClick={() => setActiveTab('startups')}
              className={`pb-3 text-sm font-semibold flex items-center gap-2 border-b-2 transition-all ${
                activeTab === 'startups'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              <Building2 className="w-4 h-4" />
              My Startups ({startups.length})
            </button>
            <button
              onClick={() => setActiveTab('vault')}
              className={`pb-3 text-sm font-semibold flex items-center gap-2 border-b-2 transition-all ${
                activeTab === 'vault'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              <FolderLock className="w-4 h-4" />
              Document Vault
            </button>
            <button
              onClick={() => setActiveTab('inbox')}
              className={`pb-3 text-sm font-semibold flex items-center gap-2 border-b-2 transition-all ${
                activeTab === 'inbox'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              <Inbox className="w-4 h-4" />
              Requests Inbox
            </button>
          </div>

          {/* TAB 1: OVERVIEW */}
          {activeTab === 'overview' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Left Column (Startups preview & Document Vault) */}
              <div className="lg:col-span-2 space-y-8">
                {/* My Startups Quick List */}
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 shadow-xs">
                  <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
                    <div>
                      <h3 className="font-semibold text-slate-900 dark:text-white text-base">Your Active Ventures</h3>
                      <p className="text-xs text-slate-500">Live and pending startup listings</p>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setShowPostModal(true)}
                      className="text-xs flex items-center gap-1"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      Add Startup
                    </Button>
                  </div>

                  <div className="mt-4 space-y-3">
                    {startups.length === 0 ? (
                      <div className="text-center py-10 border border-dashed border-slate-200 dark:border-slate-800 rounded-xl">
                        <Building2 className="w-10 h-10 text-slate-300 dark:text-slate-700 mx-auto mb-2" />
                        <h4 className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                          No startups posted yet
                        </h4>
                        <p className="text-xs text-slate-400 mt-1 mb-4">
                          Post your venture profile to start connecting with verified investors.
                        </p>
                        <Button
                          size="sm"
                          onClick={() => setShowPostModal(true)}
                          className="bg-blue-600 text-white text-xs"
                        >
                          Post Your First Startup
                        </Button>
                      </div>
                    ) : (
                      startups.map((st) => (
                        <div
                          key={st._id}
                          className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-blue-300 dark:hover:border-blue-700 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                        >
                          <div>
                            <div className="flex items-center gap-2">
                              <h4 className="font-bold text-slate-900 dark:text-white text-base">
                                {st.name}
                              </h4>
                              {getStatusBadge(st.status)}
                            </div>
                            <p className="text-xs text-slate-500 mt-0.5 line-clamp-1">{st.tagline}</p>
                            <div className="flex items-center gap-3 text-xs text-slate-400 mt-2">
                              <span className="capitalize">{st.industry}</span>
                              <span>•</span>
                              <span className="capitalize">{st.stage.replace('_', ' ')}</span>
                              {st.fundingAsk ? (
                                <>
                                  <span>•</span>
                                  <span className="text-emerald-600 font-semibold">
                                    Raising ${st.fundingAsk.toLocaleString()}
                                  </span>
                                </>
                              ) : null}
                            </div>
                          </div>

                          <div className="flex items-center gap-2 shrink-0">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                setSelectedStartupId(st._id);
                                setActiveTab('vault');
                              }}
                              className="text-xs flex items-center gap-1.5"
                            >
                              <FolderLock className="w-3.5 h-3.5" />
                              Vault
                            </Button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                {/* Vault Preview if startup exists */}
                {selectedStartup && (
                  <DocumentManager
                    startupId={selectedStartup._id}
                    startupName={selectedStartup.name}
                  />
                )}
              </div>

              {/* Right Column (Inbox & Activity) */}
              <div className="space-y-8">
                <RequestsInbox onStatusChange={fetchData} />
                <RecentActivity activities={stats?.recentActivity} loading={loading} />
              </div>
            </div>
          )}

          {/* TAB 2: MY STARTUPS FULL LIST */}
          {activeTab === 'startups' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-bold text-slate-900 dark:text-white">Startups Portfolio</h2>
                  <p className="text-xs text-slate-500">Manage and monitor all your venture submissions</p>
                </div>
                <Button
                  onClick={() => setShowPostModal(true)}
                  className="bg-blue-600 text-white text-xs flex items-center gap-1.5"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Post New Startup
                </Button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {startups.map((st) => (
                  <div
                    key={st._id}
                    className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 shadow-xs flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-center justify-between gap-2 mb-2">
                        <h3 className="font-bold text-lg text-slate-900 dark:text-white">{st.name}</h3>
                        {getStatusBadge(st.status)}
                      </div>
                      <p className="text-xs text-slate-600 dark:text-slate-400 mb-4">{st.tagline}</p>

                      <div className="space-y-2 text-xs text-slate-500 border-t border-slate-100 dark:border-slate-800 pt-3">
                        <div className="flex justify-between">
                          <span className="font-medium text-slate-400">Industry:</span>
                          <span className="font-semibold text-slate-700 dark:text-slate-300">{st.industry}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="font-medium text-slate-400">Stage:</span>
                          <span className="font-semibold text-slate-700 dark:text-slate-300 capitalize">
                            {st.stage.replace('_', ' ')}
                          </span>
                        </div>
                        {st.fundingAsk ? (
                          <div className="flex justify-between">
                            <span className="font-medium text-slate-400">Ask:</span>
                            <span className="font-semibold text-emerald-600">
                              ${st.fundingAsk.toLocaleString()}
                              {st.equityOffered ? ` (${st.equityOffered}% equity)` : ''}
                            </span>
                          </div>
                        ) : null}
                        <div className="flex justify-between">
                          <span className="font-medium text-slate-400">Views:</span>
                          <span className="font-semibold text-slate-700 dark:text-slate-300">
                            {st.viewsCount || 0}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-4 mt-4 border-t border-slate-100 dark:border-slate-800">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setSelectedStartupId(st._id);
                          setActiveTab('vault');
                        }}
                        className="text-xs flex items-center gap-1.5"
                      >
                        <FolderLock className="w-3.5 h-3.5" />
                        Manage Vault
                      </Button>

                      <button
                        type="button"
                        onClick={() => handleDeleteStartup(st._id, st.name)}
                        className="p-1.5 text-slate-400 hover:text-rose-600 transition-colors"
                        title="Delete startup"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 3: DOCUMENT VAULT */}
          {activeTab === 'vault' && (
            <div className="space-y-6">
              {startups.length > 1 && (
                <div className="flex items-center gap-3">
                  <label className="text-xs font-semibold text-slate-600 dark:text-slate-400">
                    Select Startup:
                  </label>
                  <select
                    value={selectedStartupId || ''}
                    onChange={(e) => setSelectedStartupId(e.target.value)}
                    className="px-3 py-1.5 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900"
                  >
                    {startups.map((st) => (
                      <option key={st._id} value={st._id}>
                        {st.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {selectedStartup ? (
                <DocumentManager
                  startupId={selectedStartup._id}
                  startupName={selectedStartup.name}
                />
              ) : (
                <div className="p-8 text-center text-sm text-slate-400 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800">
                  Please post a startup first before uploading documents.
                </div>
              )}
            </div>
          )}

          {/* TAB 4: REQUESTS INBOX */}
          {activeTab === 'inbox' && (
            <div className="space-y-6">
              <RequestsInbox onStatusChange={fetchData} />
            </div>
          )}
        </main>

        {/* Modal: Multi-Step "Post Your Startup" Form */}
        {showPostModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in">
            <div className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl bg-white dark:bg-slate-900 shadow-2xl">
              <button
                type="button"
                onClick={() => setShowPostModal(false)}
                className="absolute top-5 right-5 p-1 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 z-10"
              >
                <X className="w-5 h-5" />
              </button>

              <StartupForm
                onSuccess={(newStartup) => {
                  setShowPostModal(false);
                  setStartups((prev) => [newStartup, ...prev]);
                  setSelectedStartupId(newStartup._id);
                  fetchData();
                }}
                onCancel={() => setShowPostModal(false)}
              />
            </div>
          </div>
        )}
      </div>
    </ProtectedRoute>
  );
}
