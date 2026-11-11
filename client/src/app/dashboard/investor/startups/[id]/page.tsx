'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { Button } from '@/components/ui/button';
import { DocumentAccessRow } from '@/components/investor/DocumentAccessRow';
import { ConnectModal } from '@/components/investor/ConnectModal';
import {
  getStartupDetails,
  saveStartup,
  unsaveStartup,
  getSavedStartups,
  getMyInvestorRequests,
} from '@/lib/investor.api';
import { Startup, StartupDocument } from '@/lib/founder.api';
import {
  ArrowLeft,
  Bookmark,
  Send,
  Eye,
  Building2,
  Users,
  FileText,
  DollarSign,
  Briefcase,
  AlertCircle,
  ExternalLink,
  Target,
  Sparkles,
} from 'lucide-react';

export default function StartupDetailPage() {
  const params = useParams();
  const router = useRouter();
  const startupId = params?.id as string;

  const [startup, setStartup] = useState<Startup | null>(null);
  const [documents, setDocuments] = useState<StartupDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [isSaved, setIsSaved] = useState(false);
  const [showConnectModal, setShowConnectModal] = useState(false);

  // Approved and pending access IDs
  const [approvedDocIds, setApprovedDocIds] = useState<Set<string>>(new Set());
  const [pendingDocIds, setPendingDocIds] = useState<Set<string>>(new Set());
  const [hasAcceptedConnection, setHasAcceptedConnection] = useState(false);

  const loadData = async () => {
    if (!startupId) return;
    try {
      setLoading(true);
      setError(null);

      const [detailRes, savedRes, requestsRes] = await Promise.all([
        getStartupDetails(startupId),
        getSavedStartups(),
        getMyInvestorRequests(),
      ]);

      if (detailRes.success && detailRes.data) {
        setStartup(detailRes.data.startup);
        setDocuments(detailRes.data.documents || []);
      } else {
        throw new Error(detailRes.message || 'Failed to load startup details');
      }

      if (savedRes.success && savedRes.data) {
        setIsSaved(savedRes.data.savedStartups.some((s) => s._id === startupId));
      }

      if (requestsRes.success && requestsRes.data) {
        const approved = new Set<string>();
        const pending = new Set<string>();

        requestsRes.data.accessRequests.forEach((req) => {
          const docId = (req.documentId as any)?._id || req.documentId;
          if (req.status === 'approved') approved.add(String(docId));
          if (req.status === 'pending') pending.add(String(docId));
        });

        setApprovedDocIds(approved);
        setPendingDocIds(pending);

        const acceptedConn = requestsRes.data.connections.some(
          (c) =>
            ((c.startupId as any)?._id || c.startupId) === startupId &&
            c.status === 'accepted'
        );
        setHasAcceptedConnection(acceptedConn);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load startup');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [startupId]);

  const handleToggleSave = async () => {
    try {
      if (isSaved) {
        await unsaveStartup(startupId);
        setIsSaved(false);
      } else {
        await saveStartup(startupId);
        setIsSaved(true);
      }
    } catch (err) {
      console.error('Failed to toggle save:', err);
    }
  };

  const founder = (startup as any)?.founderId;

  return (
    <ProtectedRoute allowedRoles={['investor']}>
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-5xl mx-auto space-y-6">
          {/* Back Navigation */}
          <div>
            <Link
              href="/dashboard/investor"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to Deals Feed</span>
            </Link>
          </div>

          {error && (
            <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {loading ? (
            <div className="space-y-6">
              <div className="h-64 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 animate-pulse" />
              <div className="h-96 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 animate-pulse" />
            </div>
          ) : startup ? (
            <>
              {/* Header Hero Card */}
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 shadow-xs">
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-6">
                  <div className="flex items-start gap-4">
                    <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-700 text-white font-black text-2xl flex items-center justify-center shrink-0 shadow-md">
                      {startup.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <div className="flex items-center gap-3">
                        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white">
                          {startup.name}
                        </h1>
                        <span className="text-xs px-2.5 py-0.5 rounded-full font-semibold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 capitalize">
                          {startup.stage.replace('_', ' ')}
                        </span>
                      </div>
                      <p className="text-sm font-medium text-slate-600 dark:text-slate-300 mt-1 max-w-2xl">
                        {startup.tagline}
                      </p>

                      <div className="flex flex-wrap items-center gap-3 text-xs text-slate-400 mt-3">
                        <span className="font-semibold text-slate-700 dark:text-slate-300">
                          {startup.industry}
                        </span>
                        <span>•</span>
                        <span className="flex items-center gap-1">
                          <Eye className="w-3.5 h-3.5" />
                          {startup.viewsCount || 0} pitch views
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Actions: Save & Connect */}
                  <div className="flex items-center gap-2 self-start sm:self-auto shrink-0">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleToggleSave}
                      className={`text-xs flex items-center gap-1.5 ${
                        isSaved ? 'text-amber-600 border-amber-300 bg-amber-50 dark:bg-amber-950/30' : ''
                      }`}
                    >
                      <Bookmark className={`w-3.5 h-3.5 ${isSaved ? 'fill-current' : ''}`} />
                      <span>{isSaved ? 'Saved' : 'Watchlist'}</span>
                    </Button>

                    <Button
                      size="sm"
                      onClick={() => setShowConnectModal(true)}
                      className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold flex items-center gap-1.5 px-4"
                    >
                      <Send className="w-3.5 h-3.5" />
                      <span>Connect with Founder</span>
                    </Button>
                  </div>
                </div>

                {/* Founder Info Snippet */}
                {founder && (
                  <div className="mt-6 pt-6 border-t border-slate-100 dark:border-slate-800 flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden flex items-center justify-center font-bold text-xs">
                      {founder.avatarUrl ? (
                        <img src={founder.avatarUrl} alt={founder.name} className="w-full h-full object-cover" />
                      ) : (
                        founder.name?.charAt(0) || 'F'
                      )}
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-slate-900 dark:text-white">
                        {founder.name}
                      </h4>
                      <p className="text-[11px] text-slate-400">{founder.headline || 'Founder & CEO'}</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Deal Overview Metrics */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs">
                  <span className="text-[11px] uppercase tracking-wider font-semibold text-slate-400 block mb-1">
                    Funding Target / Ask
                  </span>
                  <span className="text-2xl font-black text-emerald-600 dark:text-emerald-400">
                    {startup.fundingAsk ? `$${startup.fundingAsk.toLocaleString()}` : 'Not Specified'}
                  </span>
                </div>
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs">
                  <span className="text-[11px] uppercase tracking-wider font-semibold text-slate-400 block mb-1">
                    Target Equity Offered
                  </span>
                  <span className="text-2xl font-black text-slate-900 dark:text-white">
                    {startup.equityOffered ? `${startup.equityOffered}%` : 'Negotiable'}
                  </span>
                </div>
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs">
                  <span className="text-[11px] uppercase tracking-wider font-semibold text-slate-400 block mb-1">
                    Market Stage
                  </span>
                  <span className="text-2xl font-black text-slate-900 dark:text-white capitalize">
                    {startup.stage.replace('_', ' ')}
                  </span>
                </div>
              </div>

              {/* Problem & Solution Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-xs space-y-2">
                  <div className="flex items-center gap-2 text-rose-600 dark:text-rose-400">
                    <Target className="w-4 h-4" />
                    <h3 className="font-bold text-sm uppercase tracking-wider">The Problem</h3>
                  </div>
                  <p className="text-xs sm:text-sm text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-wrap">
                    {startup.problem || 'No problem statement provided.'}
                  </p>
                </div>

                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-xs space-y-2">
                  <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400">
                    <Sparkles className="w-4 h-4" />
                    <h3 className="font-bold text-sm uppercase tracking-wider">The Solution</h3>
                  </div>
                  <p className="text-xs sm:text-sm text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-wrap">
                    {startup.solution || 'No solution description provided.'}
                  </p>
                </div>
              </div>

              {/* Target Market Opportunity */}
              {startup.marketSize && (
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-xs space-y-2">
                  <h3 className="font-bold text-sm text-slate-900 dark:text-white uppercase tracking-wider">
                    Market Size & TAM
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-700 dark:text-slate-300">
                    {startup.marketSize}
                  </p>
                </div>
              )}

              {/* Core Team Members */}
              {startup.team && startup.team.length > 0 && (
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-xs space-y-4">
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4 text-emerald-600" />
                    <h3 className="font-bold text-base text-slate-900 dark:text-white">Founding Team</h3>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                    {startup.team.map((member, idx) => (
                      <div
                        key={idx}
                        className="p-4 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40"
                      >
                        <h4 className="font-bold text-xs text-slate-900 dark:text-white">{member.name}</h4>
                        <p className="text-[11px] text-slate-500">{member.role}</p>
                        {member.linkedinUrl && (
                          <a
                            href={member.linkedinUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1 text-[11px] text-blue-600 hover:underline mt-2"
                          >
                            <span>LinkedIn Profile</span>
                            <ExternalLink className="w-2.5 h-2.5" />
                          </a>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Documents & Vault Section */}
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-xs space-y-4">
                <div>
                  <h3 className="font-bold text-base text-slate-900 dark:text-white">
                    Investor Documents & Diligence Room
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Public decks can be viewed immediately. Confidential models and cap tables require founder authorization.
                  </p>
                </div>

                {documents.length === 0 ? (
                  <div className="p-8 text-center text-xs text-slate-400 border border-dashed border-slate-200 dark:border-slate-800 rounded-xl">
                    No documents uploaded by founder yet.
                  </div>
                ) : (
                  <div className="space-y-3">
                    {documents.map((doc) => (
                      <DocumentAccessRow
                        key={doc._id}
                        document={doc}
                        hasApprovedAccess={approvedDocIds.has(doc._id)}
                        hasPendingAccess={pendingDocIds.has(doc._id)}
                        hasAcceptedConnection={hasAcceptedConnection}
                        onRequestSuccess={loadData}
                      />
                    ))}
                  </div>
                )}
              </div>
            </>
          ) : null}
        </div>

        {/* Connect Modal */}
        {showConnectModal && startup && (
          <ConnectModal
            startup={startup}
            onClose={() => setShowConnectModal(false)}
            onSuccess={loadData}
          />
        )}
      </div>
    </ProtectedRoute>
  );
}

