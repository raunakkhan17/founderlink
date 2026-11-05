'use client';

import React, { useEffect, useState, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { apiRequest } from '@/lib/api';
import { Button } from '@/components/ui/button';

function VerifyEmailContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get('token');
  const registered = searchParams.get('registered');
  const pending = searchParams.get('pending');
  const approval = searchParams.get('approval');

  const [loading, setLoading] = useState(Boolean(token));
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!token) return;

    let isMounted = true;
    apiRequest(`/auth/verify-email?token=${token}`)
      .then(() => {
        if (isMounted) setSuccess(true);
      })
      .catch((err: unknown) => {
        if (isMounted) {
          const message = err instanceof Error ? err.message : 'Verification token is invalid or expired.';
          setError(message);
        }
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [token]);

  return (
    <div className="min-h-screen flex flex-col justify-center items-center bg-slate-50 dark:bg-slate-950 px-4 py-12">
      <div className="w-full max-w-md bg-white dark:bg-slate-900 shadow-sm border border-slate-200 dark:border-slate-800 rounded-2xl p-8 text-center">
        <Link href="/" className="inline-flex items-center gap-2 mb-6">
          <div className="h-9 w-9 rounded-lg bg-blue-600 flex items-center justify-center text-white font-bold text-xl">
            F
          </div>
          <span className="font-bold text-2xl tracking-tight text-blue-600 dark:text-blue-400">
            FounderLink
          </span>
        </Link>

        {loading && (
          <div className="py-8">
            <div className="h-10 w-10 animate-spin rounded-full border-4 border-blue-600 border-t-transparent mx-auto mb-4" />
            <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">
              Verifying your email...
            </h2>
            <p className="text-sm text-slate-500 mt-1">Please wait a moment.</p>
          </div>
        )}

        {success && (
          <div className="py-6 space-y-4">
            <div className="h-12 w-12 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto text-2xl">
              ✓
            </div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">
              Email Verified Successfully!
            </h2>
            <p className="text-sm text-slate-600 dark:text-slate-400">
              Your email has been verified. Your account is now submitted for administrator approval. You will be notified once reviewed.
            </p>
            <div className="pt-2">
              <Link href="/login">
                <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white">
                  Continue to Sign In
                </Button>
              </Link>
            </div>
          </div>
        )}

        {error && (
          <div className="py-6 space-y-4">
            <div className="h-12 w-12 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mx-auto text-2xl">
              ✕
            </div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">
              Verification Failed
            </h2>
            <p className="text-sm text-rose-600">{error}</p>
            <div className="pt-2">
              <Link href="/login">
                <Button variant="outline" className="w-full">
                  Back to Sign In
                </Button>
              </Link>
            </div>
          </div>
        )}

        {!token && (registered || pending || approval) && (
          <div className="py-6 space-y-4">
            <div className="h-12 w-12 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center mx-auto text-2xl">
              ✉
            </div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">
              {approval ? 'Account Under Review' : 'Check Your Inbox'}
            </h2>
            <p className="text-sm text-slate-600 dark:text-slate-400">
              {approval
                ? 'Your email is verified, but your account is pending admin verification. You will be able to access the platform once approved.'
                : 'We have dispatched a verification email. Click the verification link inside to verify your email address.'}
            </p>
            <div className="pt-2">
              <Link href="/login">
                <Button variant="outline" className="w-full">
                  Return to Sign In
                </Button>
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-slate-50">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
        </div>
      }
    >
      <VerifyEmailContent />
    </Suspense>
  );
}
