'use client';

import React, { useState, useEffect } from 'react';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { StartupCard } from '@/components/investor/StartupCard';
import { FilterSidebar } from '@/components/investor/FilterSidebar';
import { ConnectModal } from '@/components/investor/ConnectModal';
import { InvestorProfileModal } from '@/components/investor/InvestorProfileModal';
import {
  browseStartups,
  getSavedStartups,
  getMyInvestorRequests,
  saveStartup,
  unsaveStartup,
  BrowseFilterParams,
  InvestorRequestsResponse,
} from '@/lib/investor.api';
import { Startup } from '@/lib/founder.api';
import {
  Search,
  Bookmark,
  Send,
  SlidersHorizontal,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
  Building2,
  UserCheck,
  Briefcase,
  Sparkles,
  Inbox,
  Clock,
  CheckCircle2,
  XCircle,
} from 'lucide-react';

export default function InvestorDashboardPage() {
  const { user, logout } = useAuth();

  // Navigation state
  const [activeTab, setActiveTab] = useState<'feed' | 'saved' | 'requests'>('feed');

  // Feed & filter state
  const [startups, setStartups] = useState<Startup[]>([]);
  const [totalStartups, setTotalStartups] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(true);

  const [filters, setFilters] = useState<BrowseFilterParams>({
    search: '',
    industry: 'all',
    stage: 'all',
    minFunding: '',
    maxFunding: '',
    sort: 'recent',
    page: 1,
    limit: 9,
  });

  const [searchInput, setSearchInput] = useState('');

  // Watchlist state
  const [savedStartups, setSavedStartups] = useState<Startup[]>([]);
  const [savedIds, setSavedIds] = useState<Set<string>>(new Set());

  // Requests state
  const [requestsData, setRequestsData] = useState<InvestorRequestsResponse>({
    accessRequests: [],
    connections: [],
  });
  const [requestsTab, setRequestsTab] = useState<'access' | 'connections'>('access');

  // Modal state
  const [selectedStartupForConnect, setSelectedStartupForConnect] = useState<Startup | null>(null);
  const [showProfileModal, setShowProfileModal] = useState(false);

  // 1. Fetch startups feed
  const loadFeed = async () => {
    try {
      setLoading(true);
      const res = await browseStartups(filters);
      if (res.success && res.data) {
        setStartups(res.data.startups);
        setTotalStartups(res.data.total);
        setTotalPages(res.data.totalPages);
        setCurrentPage(res.data.page);
      }
    } catch (err) {
      console.error('Failed to load deals feed:', err);
    } finally {
      setLoading(false);
    }
  };

  // 2. Fetch watchlist
  const loadWatchlist = async () => {
    try {
      const res = await getSavedStartups();
      if (res.success && res.data) {
        setSavedStartups(res.data.savedStartups);
        setSavedIds(new Set(res.data.savedStartups.map((s) => s._id)));
      }
    } catch (err) {
      console.error('Failed to load watchlist:', err);
    }
  };

  // 3. Fetch requests
  const loadRequests = async () => {
    try {
      const res = await getMyInvestorRequests();
      if (res.success && res.data) {
        setRequestsData(res.data);
      }
    } catch (err) {
      console.error('Failed to load requests:', err);
    }
  };

  useEffect(() => {
    loadFeed();
  }, [filters]);

  useEffect(() => {
    loadWatchlist();
    loadRequests();
  }, []);

  const handleFilterChange = (updated: Partial<BrowseFilterParams>) => {
    setFilters((prev) => ({ ...prev, ...updated }));
  };

  const handleResetFilters = () => {
    setSearchInput('');
    setFilters({
      search: '',
      industry: 'all',
      stage: 'all',
      minFunding: '',
      maxFunding: '',
      sort: 'recent',
      page: 1,
      limit: 9,
    });
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFilters((prev) => ({ ...prev, search: searchInput.trim(), page: 1 }));
  };

  const handleToggleSave = async (startupId: string) => {
    const isCurrentlySaved = savedIds.has(startupId);
    try {
      if (isCurrentlySaved) {
        await unsaveStartup(startupId);
        setSavedIds((prev) => {
          const next = new Set(prev);
          next.delete(startupId);
          return next;
        });
        setSavedStartups((prev) => prev.filter((s) => s._id !== startupId));
      } else {
        await saveStartup(startupId);
        setSavedIds((prev) => new Set([...Array.from(prev), startupId]));
        loadWatchlist();
      }
    } catch (err) {
      console.error('Error toggling save:', err);
    }
  };

  return (
    <ProtectedRoute allowedRoles={['investor']}>
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100">
        {/* Navigation Header */}
        <header className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 sticky top-0 z-30">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-xl bg-emerald-600 flex items-center justify-center text-white font-black text-lg shadow-xs">
                F
              </div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-xl text-emerald-600 tracking-tight">FounderLink</span>
                <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 font-semibold">
                  Investor Portal
                </span>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowProfileModal(true)}
                className="text-xs flex items-center gap-1.5"
              >
                <Briefcase className="w-3.5 h-3.5" />
                <span>My Mandate</span>
              </Button>

              <div className="hidden sm:block text-right">
                <div className="text-xs font-bold leading-tight">{user?.name}</div>
                <div className="text-[11px] text-slate-400">{user?.email}</div>
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
          {/* Top Banner */}
          <div className="bg-gradient-to-r from-emerald-600 to-teal-800 rounded-2xl p-6 sm:p-8 text-white mb-8 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-6">
            <div>
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-white/20 text-white text-xs font-semibold mb-2">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Verified Deal Flow</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
                Welcome, {user?.name || 'Investor'}!
              </h1>
              <p className="text-emerald-100 text-xs sm:text-sm mt-1 max-w-xl">
                Browse vetted startups, review secured pitch decks, and connect directly with high-growth founders.
              </p>
            </div>

            <div className="flex items-center gap-2 self-start sm:self-center">
              <Button
                onClick={() => setActiveTab('saved')}
                className="bg-white/10 hover:bg-white/20 text-white text-xs border border-white/20 px-3.5 py-2 rounded-xl flex items-center gap-1.5"
              >
                <Bookmark className="w-3.5 h-3.5" />
                <span>Watchlist ({savedIds.size})</span>
              </Button>
              <Button
                onClick={() => setActiveTab('requests')}
                className="bg-white text-emerald-800 hover:bg-emerald-50 text-xs font-semibold px-4 py-2 rounded-xl flex items-center gap-1.5"
              >
                <Inbox className="w-3.5 h-3.5" />
                <span>My Requests</span>
              </Button>
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="flex border-b border-slate-200 dark:border-slate-800 mb-8 space-x-6">
            <button
              onClick={() => setActiveTab('feed')}
              className={`pb-3 text-sm font-semibold flex items-center gap-2 border-b-2 transition-all ${
                activeTab === 'feed'
                  ? 'border-emerald-600 text-emerald-600'
                  : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              <Building2 className="w-4 h-4" />
              Explore Deals ({totalStartups})
            </button>
            <button
              onClick={() => setActiveTab('saved')}
              className={`pb-3 text-sm font-semibold flex items-center gap-2 border-b-2 transition-all ${
                activeTab === 'saved'
                  ? 'border-emerald-600 text-emerald-600'
                  : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              <Bookmark className="w-4 h-4" />
              Saved Watchlist ({savedIds.size})
            </button>
            <button
              onClick={() => setActiveTab('requests')}
              className={`pb-3 text-sm font-semibold flex items-center gap-2 border-b-2 transition-all ${
                activeTab === 'requests'
                  ? 'border-emerald-600 text-emerald-600'
                  : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              <Inbox className="w-4 h-4" />
              My Requests ({requestsData.accessRequests.length + requestsData.connections.length})
            </button>
          </div>

          {/* TAB 1: EXPLORE DEALS FEED */}
          {activeTab === 'feed' && (
            <div className="space-y-6">
              {/* Top Search Bar */}
              <form onSubmit={handleSearchSubmit} className="flex gap-2">
                <div className="relative flex-1">
                  <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search startups by name, industry, problem, or technology..."
                    value={searchInput}
                    onChange={(e) => setSearchInput(e.target.value)}
                    data-testid="feed-search-input"
                    className="w-full pl-10 pr-4 py-2.5 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 shadow-xs"
                  />
                </div>
                <Button type="submit" size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs px-5">
                  Search
                </Button>
              </form>

              {/* Feed Body: Sidebar Filters + Cards Grid */}
              <div className="flex flex-col lg:flex-row gap-8 items-start">
                {/* Left Sidebar Filters */}
                <FilterSidebar
                  filters={filters}
                  onChange={handleFilterChange}
                  onReset={handleResetFilters}
                />

                {/* Right Area: Startup Cards Grid */}
                <div className="flex-1 w-full space-y-6">
                  {loading ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {[1, 2, 3, 4, 5, 6].map((i) => (
                        <div
                          key={i}
                          className="h-72 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 animate-pulse p-6"
                        />
                      ))}
                    </div>
                  ) : startups.length === 0 ? (
                    <div className="p-12 text-center bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-3">
                      <Building2 className="w-12 h-12 text-slate-300 dark:text-slate-700 mx-auto" />
                      <h3 className="font-bold text-base text-slate-800 dark:text-slate-200">
                        No approved startups found
                      </h3>
                      <p className="text-xs text-slate-400 max-w-sm mx-auto">
                        Try loosening your filter criteria or clearing the search terms to discover more startups.
                      </p>
                      <Button variant="outline" size="sm" onClick={handleResetFilters} className="text-xs">
                        Clear All Filters
                      </Button>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                      {startups.map((st) => (
                        <StartupCard
                          key={st._id}
                          startup={st}
                          isSaved={savedIds.has(st._id)}
                          onToggleSave={handleToggleSave}
                          onConnect={(s) => setSelectedStartupForConnect(s)}
                        />
                      ))}
                    </div>
                  )}

                  {/* Pagination Controls */}
                  {totalPages > 1 && (
                    <div className="flex items-center justify-between pt-6 border-t border-slate-200 dark:border-slate-800">
                      <span className="text-xs text-slate-500">
                        Page {currentPage} of {totalPages} ({totalStartups} deals)
                      </span>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          disabled={currentPage <= 1}
                          onClick={() => handleFilterChange({ page: currentPage - 1 })}
                          className="text-xs flex items-center gap-1"
                        >
                          <ChevronLeft className="w-3.5 h-3.5" /> Previous
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          disabled={currentPage >= totalPages}
                          onClick={() => handleFilterChange({ page: currentPage + 1 })}
                          className="text-xs flex items-center gap-1"
                        >
                          Next <ChevronRight className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: SAVED STARTUPS (WATCHLIST) */}
          {activeTab === 'saved' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-bold text-slate-900 dark:text-white">Saved Startups Watchlist</h2>
                  <p className="text-xs text-slate-500">Track and monitor bookmarked ventures for future diligence</p>
                </div>
              </div>

              {savedStartups.length === 0 ? (
                <div className="p-12 text-center bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-3">
                  <Bookmark className="w-12 h-12 text-slate-300 dark:text-slate-700 mx-auto" />
                  <h3 className="font-bold text-base text-slate-800 dark:text-slate-200">
                    Your watchlist is empty
                  </h3>
                  <p className="text-xs text-slate-400 max-w-sm mx-auto">
                    Click the bookmark icon on any startup in the deals feed to save it here for later.
                  </p>
                  <Button size="sm" onClick={() => setActiveTab('feed')} className="bg-emerald-600 text-white text-xs">
                    Explore Deals Feed
                  </Button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {savedStartups.map((st) => (
                    <StartupCard
                      key={st._id}
                      startup={st}
                      isSaved={true}
                      onToggleSave={handleToggleSave}
                      onConnect={(s) => setSelectedStartupForConnect(s)}
                    />
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 3: MY REQUESTS (ACCESS & CONNECTIONS) */}
          {activeTab === 'requests' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-bold text-slate-900 dark:text-white">My Investor Requests</h2>
                  <p className="text-xs text-slate-500">Track confidential document access requests and founder connection statuses</p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setRequestsTab('access')}
                    className={`px-3 py-1.5 text-xs font-semibold rounded-xl transition-all ${
                      requestsTab === 'access'
                        ? 'bg-emerald-600 text-white shadow-xs'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                    }`}
                  >
                    Document Access ({requestsData.accessRequests.length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setRequestsTab('connections')}
                    className={`px-3 py-1.5 text-xs font-semibold rounded-xl transition-all ${
                      requestsTab === 'connections'
                        ? 'bg-emerald-600 text-white shadow-xs'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                    }`}
                  >
                    Founder Connections ({requestsData.connections.length})
                  </button>
                </div>
              </div>

              {/* Sub-tab 1: Document Access Requests */}
              {requestsTab === 'access' && (
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-xs">
                  {requestsData.accessRequests.length === 0 ? (
                    <div className="p-12 text-center text-xs text-slate-400">
                      You haven&apos;t submitted any document access requests yet.
                    </div>
                  ) : (
                    <div className="divide-y divide-slate-100 dark:divide-slate-800">
                      {requestsData.accessRequests.map((req) => (
                        <div key={req._id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                          <div>
                            <div className="flex items-center gap-2">
                              <h4 className="font-bold text-sm text-slate-900 dark:text-white">
                                {req.documentId?.title || 'Document'}
                              </h4>
                              <span className="text-xs text-slate-400">
                                • {req.startupId?.name || 'Startup'}
                              </span>
                            </div>
                            <p className="text-xs text-slate-500 mt-0.5">
                              Requested on {new Date(req.createdAt).toLocaleDateString()}
                            </p>
                          </div>

                          <div className="flex items-center gap-2 self-end sm:self-center">
                            {req.status === 'approved' && (
                              <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300">
                                <CheckCircle2 className="w-3.5 h-3.5" /> Approved
                              </span>
                            )}
                            {req.status === 'pending' && (
                              <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300">
                                <Clock className="w-3.5 h-3.5" /> Pending Approval
                              </span>
                            )}
                            {req.status === 'rejected' && (
                              <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300">
                                <XCircle className="w-3.5 h-3.5" /> Rejected
                              </span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Sub-tab 2: Connection Requests */}
              {requestsTab === 'connections' && (
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-xs">
                  {requestsData.connections.length === 0 ? (
                    <div className="p-12 text-center text-xs text-slate-400">
                      You haven&apos;t sent any connection requests to founders yet.
                    </div>
                  ) : (
                    <div className="divide-y divide-slate-100 dark:divide-slate-800">
                      {requestsData.connections.map((conn) => (
                        <div key={conn._id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                          <div>
                            <div className="flex items-center gap-2">
                              <h4 className="font-bold text-sm text-slate-900 dark:text-white">
                                {conn.startupId?.name || 'Startup'}
                              </h4>
                              <span className="text-xs text-slate-400">
                                • Founder: {conn.founderId?.name}
                              </span>
                            </div>
                            {conn.message && (
                              <p className="text-xs text-slate-600 dark:text-slate-300 italic mt-1 bg-slate-50 dark:bg-slate-800/40 p-2 rounded-lg">
                                &quot;{conn.message}&quot;
                              </p>
                            )}
                          </div>

                          <div className="flex items-center gap-2 self-end sm:self-center">
                            {conn.status === 'accepted' && (
                              <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300">
                                <CheckCircle2 className="w-3.5 h-3.5" /> Connected
                              </span>
                            )}
                            {conn.status === 'pending' && (
                              <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300">
                                <Clock className="w-3.5 h-3.5" /> Pending Acceptance
                              </span>
                            )}
                            {conn.status === 'declined' && (
                              <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300">
                                <XCircle className="w-3.5 h-3.5" /> Declined
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
          )}
        </main>

        {/* Connect Modal */}
        {selectedStartupForConnect && (
          <ConnectModal
            startup={selectedStartupForConnect}
            onClose={() => setSelectedStartupForConnect(null)}
            onSuccess={() => {
              loadRequests();
            }}
          />
        )}

        {/* Profile Mandate Modal */}
        {showProfileModal && (
          <InvestorProfileModal
            onClose={() => setShowProfileModal(false)}
            onSuccess={() => {}}
          />
        )}
      </div>
    </ProtectedRoute>
  );
}
