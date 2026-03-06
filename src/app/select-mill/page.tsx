'use client';

import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useMill } from '@/hooks/use-mill';
import { Factory, ChevronRight } from 'lucide-react';
import type { Mill } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';

export default function SelectMillPage() {
  const { mills, selectMill, loading } = useMill();
  const router = useRouter();

  const handleSelectMill = (millId: string) => {
    selectMill(millId);
    // Use hard navigation to ensure the next route is registered correctly
    window.location.href = '/select-kms-year';
  };

  if (loading) {
      return (
        <div className="flex min-h-screen flex-col items-center justify-center p-4 bg-background">
            <Card className="w-full max-w-md">
                <CardHeader>
                    <CardTitle>Loading Mills...</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <Skeleton className="h-12 w-full" />
                    <Skeleton className="h-12 w-full" />
                </CardContent>
            </Card>
        </div>
      );
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-4 bg-muted/20">
      <Card className="w-full max-w-md shadow-lg border-none">
        <CardHeader className="text-center">
          <div className="flex justify-center items-center mb-4">
            <div className="bg-primary/10 p-3 rounded-full">
                <Factory className="h-10 w-10 text-primary" />
            </div>
          </div>
          <CardTitle className="text-2xl font-headline text-primary">Select a Mill</CardTitle>
          <CardDescription>Choose your current operational location to continue.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col space-y-4">
            {mills && mills.map((mill: Mill) => (
              <Button
                key={mill.id}
                variant="outline"
                size="lg"
                className="w-full justify-between text-base h-16 px-6 border-primary/10 hover:border-primary/30 hover:bg-primary/5 rounded-xl transition-all"
                onClick={() => handleSelectMill(mill.id)}
              >
                <div className="flex flex-col items-start">
                    <span className="font-bold">{mill.name}</span>
                    <span className="text-xs text-muted-foreground">{mill.location}</span>
                </div>
                <ChevronRight className="h-5 w-5 text-primary/40" />
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
