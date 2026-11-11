'use client';

import React, { useState } from 'react';
import { Send, X, AlertCircle, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { sendConnectionRequest } from '@/lib/investor.api';
import { Startup } from '@/lib/founder.api';

interface ConnectModalProps {
  startup: Startup;
  onClose: () => void;
  onSuccess?: () => void;
}

export function ConnectModal({ startup, onClose, onSuccess }: ConnectModalProps) {
  const [message, setMessage] = useState(
    `Hi! I came across ${startup.name} on FounderLink and I am very impressed by your progress. I'd love to connect and learn more about your current round.`
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);

  const founder = (startup as any).founderId;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      setError(null);
      const res = await sendConnectionRequest(startup._id, message);
      if (res.success) {
        setSent(true);
        setTimeout(() => {
          onSuccess?.();
          onClose();
        }, 1500);
      } else {
        throw new Error(res.message || 'Failed to send connection request');
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred while connecting');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in">
      <div className="relative w-full max-w-lg rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 shadow-2xl">
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 p-1 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white font-extrabold flex items-center justify-center text-base shrink-0">
            {startup.name.charAt(0).toUpperCase()}
          </div>
          <div>
            <h3 className="font-bold text-base text-slate-900 dark:text-white">
              Connect with {startup.name}
            </h3>
            <p className="text-xs text-slate-500">
              Founder: {founder?.name || 'Venture Founder'}
            </p>
          </div>
        </div>

        {sent ? (
          <div className="py-8 text-center space-y-2 animate-in fade-in">
            <CheckCircle2 className="w-12 h-12 text-emerald-600 mx-auto" />
            <h4 className="font-bold text-slate-900 dark:text-white">Connection Request Sent!</h4>
            <p className="text-xs text-slate-500">
              The founder will be notified and you will receive access upon acceptance.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 dark:bg-rose-950/40 dark:border-rose-900/50 dark:text-rose-300 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Personalized Intro Note (Optional)
              </label>
              <textarea
                rows={4}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Write a brief note introducing yourself and your investment focus..."
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
              <p className="text-[11px] text-slate-400 mt-1">
                Founders are 3x more likely to accept requests that include personalized deal context.
              </p>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <Button type="button" variant="outline" size="sm" onClick={onClose} disabled={loading}>
                Cancel
              </Button>
              <Button
                type="submit"
                size="sm"
                disabled={loading}
                className="bg-emerald-600 hover:bg-emerald-700 text-white flex items-center gap-1.5 text-xs font-medium"
              >
                <Send className="w-3.5 h-3.5" />
                <span>{loading ? 'Sending...' : 'Send Request'}</span>
              </Button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

