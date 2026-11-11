'use client';

import React, { useState } from 'react';
import {
  FileText,
  Lock,
  Unlock,
  Key,
  ShieldCheck,
  Download,
  Loader2,
  Clock,
  AlertCircle,
  ExternalLink,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { StartupDocument } from '@/lib/founder.api';
import { getDocumentAccess, requestDocumentAccess } from '@/lib/investor.api';

interface DocumentAccessRowProps {
  document: StartupDocument;
  hasApprovedAccess?: boolean;
  hasPendingAccess?: boolean;
  hasAcceptedConnection?: boolean;
  onRequestSuccess?: () => void;
}

export function DocumentAccessRow({
  document,
  hasApprovedAccess = false,
  hasPendingAccess = false,
  hasAcceptedConnection = false,
  onRequestSuccess,
}: DocumentAccessRowProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pendingState, setPendingState] = useState(hasPendingAccess);

  // Determine canOpen based on access rules:
  // public: always openable
  // locked: approved request needed
  // approved_only: approved request or accepted connection needed
  const isAccessible =
    document.accessLevel === 'public' ||
    hasApprovedAccess ||
    (document.accessLevel === 'approved_only' && hasAcceptedConnection);

  const handleOpenDocument = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await getDocumentAccess(document._id);
      if (res.success && res.data?.signedUrl) {
        window.open(res.data.signedUrl, '_blank', 'noopener,noreferrer');
      } else {
        throw new Error(res.message || 'Failed to generate signed document URL');
      }
    } catch (err: any) {
      setError(err.message || 'Access denied');
    } finally {
      setLoading(false);
    }
  };

  const handleRequestAccess = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await requestDocumentAccess(document._id);
      if (res.success) {
        setPendingState(true);
        onRequestSuccess?.();
      } else {
        throw new Error(res.message || 'Failed to submit access request');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to request access');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs hover:border-slate-300 transition-colors"
      data-testid={`doc-row-${document._id}`}
    >
      <div className="flex items-center gap-3 min-w-0">
        <div
          className={`p-2.5 rounded-xl shrink-0 ${
            isAccessible
              ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400'
              : document.accessLevel === 'approved_only'
              ? 'bg-purple-50 text-purple-600 dark:bg-purple-950/40 dark:text-purple-400'
              : 'bg-amber-50 text-amber-600 dark:bg-amber-950/40 dark:text-amber-400'
          }`}
        >
          {isAccessible ? (
            <FileText className="w-5 h-5" />
          ) : (
            <Lock className="w-5 h-5" />
          )}
        </div>

        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <h4 className="text-sm font-bold text-slate-900 dark:text-white truncate">
              {document.title}
            </h4>

            {/* Access badge */}
            {document.accessLevel === 'public' && (
              <span className="text-[10px] px-2 py-0.5 rounded-full font-semibold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 flex items-center gap-1">
                <Unlock className="w-2.5 h-2.5" /> Public
              </span>
            )}
            {document.accessLevel === 'locked' && (
              <span className="text-[10px] px-2 py-0.5 rounded-full font-semibold bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 flex items-center gap-1">
                <Lock className="w-2.5 h-2.5" /> Locked
              </span>
            )}
            {document.accessLevel === 'approved_only' && (
              <span className="text-[10px] px-2 py-0.5 rounded-full font-semibold bg-purple-100 text-purple-800 dark:bg-purple-950/60 dark:text-purple-300 flex items-center gap-1">
                <ShieldCheck className="w-2.5 h-2.5" /> Approved Only
              </span>
            )}
          </div>

          <p className="text-xs text-slate-400 mt-0.5 capitalize">
            {document.type.replace('_', ' ')}
          </p>

          {error && <p className="text-[11px] text-rose-500 mt-1">{error}</p>}
        </div>
      </div>

      {/* Action Button */}
      <div className="shrink-0 self-end sm:self-center">
        {isAccessible ? (
          <Button
            size="sm"
            onClick={handleOpenDocument}
            disabled={loading}
            data-testid={`open-doc-btn-${document._id}`}
            className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-medium flex items-center gap-1.5"
          >
            {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <ExternalLink className="w-3.5 h-3.5" />}
            <span>Open Document</span>
          </Button>
        ) : pendingState ? (
          <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-xl bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
            <Clock className="w-3.5 h-3.5 animate-pulse" />
            <span>Access Pending</span>
          </span>
        ) : (
          <Button
            size="sm"
            variant="outline"
            onClick={handleRequestAccess}
            disabled={loading}
            data-testid={`request-doc-btn-${document._id}`}
            className="text-xs font-medium border-slate-300 dark:border-slate-700 hover:border-emerald-500 hover:text-emerald-600 flex items-center gap-1.5"
          >
            {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Key className="w-3.5 h-3.5" />}
            <span>Request Access</span>
          </Button>
        )}
      </div>
    </div>
  );
}

