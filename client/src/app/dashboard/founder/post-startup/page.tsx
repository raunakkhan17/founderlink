'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { StartupForm } from '@/components/founder/StartupForm';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function PostStartupPage() {
  const router = useRouter();

  return (
    <ProtectedRoute allowedRoles={['founder']}>
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 py-10 px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto">
          <div className="mb-6">
            <Link
              href="/dashboard/founder"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              Back to Dashboard
            </Link>
          </div>

          <StartupForm
            onSuccess={() => {
              router.push('/dashboard/founder');
            }}
            onCancel={() => {
              router.push('/dashboard/founder');
            }}
          />
        </div>
      </div>
    </ProtectedRoute>
  );
}

