import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-[#f8f9fb] flex items-center justify-center px-4">
      <div className="text-center max-w-md">
        <h1 className="text-6xl font-display font-bold mb-4">
          <span className="text-accent-primary">404</span>
        </h1>
        <h2 className="text-3xl font-display font-bold mb-4 text-text-primary">
          Page Not Found
        </h2>
        <p className="text-text-secondary mb-8">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <div className="flex gap-4 justify-center">
          <Link href="/" className="btn-primary">
            Go Home
          </Link>
          <Link href="/properties" className="btn-secondary">
            Browse Properties
          </Link>
        </div>
      </div>
    </div>
  );
}

