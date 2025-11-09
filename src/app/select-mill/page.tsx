'use client';

import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useMill } from '@/hooks/use-mill';
import { Factory } from 'lucide-react';
import type { Mill } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';

export default function SelectMillPage() {
  const { mills, selectMill, loading } = useMill();
  const router = useRouter();

  const handleSelectMill = (millId: string) => {
    selectMill(millId);
    router.push('/dashboard');
  };

  if (loading) {
      return <div className="flex min-h-screen flex-col items-center justify-center p-4 bg-background">
          <Card className="w-full max-w-md">
              <CardHeader>
                  <CardTitle>Select a Mill</CardTitle>
                  <CardDescription>Choose your operational location.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-10 w-full" />
              </CardContent>
          </Card>
      </div>
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-4 bg-muted/20">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center items-center mb-4">
            <Factory className="h-10 w-10 text-primary" />
          </div>
          <CardTitle className="text-2xl font-headline">Select a Mill</CardTitle>
          <CardDescription>Choose your current operational location to continue.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col space-y-4">
            {mills.map((mill: Mill) => (
              <Button
                key={mill.id}
                variant="outline"
                size="lg"
                className="w-full justify-start text-base"
                onClick={() => handleSelectMill(mill.id)}
              >
                {mill.name} - <span className="text-muted-foreground ml-2">{mill.location}</span>
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
