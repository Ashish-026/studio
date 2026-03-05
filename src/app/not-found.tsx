'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Factory as MillIcon, Home } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-4 text-center bg-background">
      <div className="bg-primary/10 p-6 rounded-full mb-6">
        <MillIcon className="h-16 w-16 text-primary" />
      </div>
      <h1 className="text-4xl font-bold font-headline mb-2 text-primary">Page Not Found</h1>
      <p className="text-muted-foreground max-w-md mb-8">
        The page you are looking for might have been moved or is temporarily unavailable. 
        Let's get you back to your mill management dashboard.
      </p>
      <Button asChild size="lg" className="rounded-xl">
        <Link href="/dashboard">
          <Home className="mr-2 h-5 w-5" />
          Back to Dashboard
        </Link>
      </Button>
    </div>
  );
}
