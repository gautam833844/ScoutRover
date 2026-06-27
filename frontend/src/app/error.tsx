'use client';

import React, { useEffect } from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';
import { Button } from '@/components/ui';
import Link from 'next/link';

export default function ErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Unhandled client-side error:', error);
  }, [error]);

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-6 text-center text-white">
      <div className="w-20 h-20 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center mb-6 animate-pulse">
        <AlertTriangle className="w-10 h-10 text-red-500" />
      </div>
      
      <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight mb-2">
        Something went wrong
      </h1>
      
      <p className="text-sm text-slate-400 max-w-md mb-8 leading-relaxed">
        An unexpected application error occurred. We have logged this issue.
      </p>

      <div className="flex flex-col sm:flex-row gap-3 justify-center items-center">
        <Button
          variant="primary"
          onClick={() => reset()}
          icon={<RefreshCw className="w-4 h-4" />}
        >
          Try Again
        </Button>
        <Link href="/">
          <Button variant="secondary" icon={<Home className="w-4 h-4" />}>
            Back to Home
          </Button>
        </Link>
      </div>
    </div>
  );
}
