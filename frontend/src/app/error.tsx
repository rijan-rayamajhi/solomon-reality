'use client';

import { useEffect } from 'react';
import Link from 'next/link';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-[#f8f9fb] flex items-center justify-center px-4">
      <div className="text-center max-w-md">
        <h1 className="text-6xl font-display font-bold mb-4">
          <span className="text-error">Error</span>
        </h1>
        <h2 className="text-3xl font-display font-bold mb-4 text-text-primary">
          Something went wrong
        </h2>
        <p className="text-text-secondary mb-8">
          {error.message || 'An unexpected error occurred'}
        </p>
        <div className="flex gap-4 justify-center">
          <button onClick={reset} className="btn-primary">
            Try Again
          </button>
          <Link href="/" className="btn-secondary">
            Go Home
          </Link>
        </div>
      </div>
    </div>
  );
}

