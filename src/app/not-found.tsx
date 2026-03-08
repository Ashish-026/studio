'use client';

import { Button } from '@/components/ui/button';
import { Factory as MillIcon, Home } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-4 text-center bg-background">
      <div className="bg-primary/10 p-6 rounded-full mb-6">
        <MillIcon className="h-16 w-16 text-primary" />
      </div>
      <h1 className="text-4xl font-bold font-headline mb-2 text-primary">Redirecting...</h1>
      <p className="text-muted-foreground max-w-md mb-8">
        It looks like you've landed on a sub-page. To ensure the app works offline and without 404 errors, 
        we manage everything on the main portal link.
      </p>
      <Button onClick={() => window.location.href = '/'} size="lg" className="rounded-xl">
        <Home className="mr-2 h-5 w-5" />
        Return to App Portal
      </Button>
    </div>
  );
}
