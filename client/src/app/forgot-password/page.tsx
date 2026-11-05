'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { apiRequest } from '@/lib/api';
import { Button } from '@/components/ui/button';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [resetLink, setResetLink] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    try {
      setLoading(true);
      const res = await apiRequest<{ resetLink: string }>('/auth/forgot-password', {
        method: 'POST',
        body: JSON.stringify({ email }),
      });
      setSubmitted(true);
      if (res.data?.resetLink) {
        setResetLink(res.data.resetLink);
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Something went wrong. Please try again.';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col justify-center items-center bg-slate-50 dark:bg-slate-950 px-4 py-12">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2 mb-2">
            <div className="h-9 w-9 rounded-lg bg-blue-600 flex items-center justify-center text-white font-bold text-xl">
              F
            </div>
            <span className="font-bold text-2xl tracking-tight text-blue-600 dark:text-blue-400">
              FounderLink
            </span>
          </Link>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100 mt-2">
            Forgot Password?
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Reset your password and regain access to FounderLink
          </p>
        </div>

        <div className="bg-white dark:bg-slate-900 shadow-sm border border-slate-200 dark:border-slate-800 rounded-2xl p-8">
          {error && (
            <div className="mb-6 p-4 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-sm">
              {error}
            </div>
          )}

          {submitted ? (
            <div className="text-center space-y-4 py-4">
              <div className="h-12 w-12 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center mx-auto text-2xl">
                ✉
              </div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">
                Instructions Dispatched
              </h2>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                If an account exists with <span className="font-medium text-slate-900 dark:text-slate-200">{email}</span>, you will receive a password reset link.
              </p>

              {resetLink && (
                <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg text-left text-xs text-blue-800 break-all">
                  <p className="font-semibold mb-1">Development Reset Link:</p>
                  <Link href={resetLink} className="underline text-blue-600 hover:text-blue-800">
                    {resetLink}
                  </Link>
                </div>
              )}

              <div className="pt-4">
                <Link href="/login">
                  <Button variant="outline" className="w-full">
                    Return to Sign In
                  </Button>
                </Link>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Email Address
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@company.com"
                  className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600"
                />
              </div>

              <Button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg text-sm"
              >
                {loading ? 'Sending link...' : 'Send Reset Link'}
              </Button>

              <div className="text-center pt-2">
                <Link href="/login" className="text-xs text-blue-600 hover:underline font-semibold">
                  Back to Sign In
                </Link>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
