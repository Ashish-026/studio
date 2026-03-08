'use client';

import { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { AlertTriangle, RefreshCcw, LogIn } from 'lucide-react';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Application Error:', error);
  }, [error]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-4 text-center bg-destructive/5">
      <div className="bg-destructive/10 p-6 rounded-full mb-6">
        <AlertTriangle className="h-16 w-16 text-destructive" />
      </div>
      <h1 className="text-3xl font-bold font-headline mb-2 text-destructive">System Reset Needed</h1>
      <p className="text-muted-foreground max-w-md mb-8">
        The app encountered a minor memory glitch. Please try refreshing or return to the login portal.
      </p>
      <div className="flex gap-4">
        <Button onClick={() => reset()} variant="default" size="lg" className="rounded-xl">
          <RefreshCcw className="mr-2 h-5 w-5" />
          Try Refresh
        </Button>
        <Button onClick={() => window.location.href = '/'} variant="outline" size="lg" className="rounded-xl">
          <LogIn className="mr-2 h-5 w-5" />
          Back to Portal
        </Button>
      </div>
    </div>
  );
}
