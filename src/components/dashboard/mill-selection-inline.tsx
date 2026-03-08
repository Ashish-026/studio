'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useMill } from '@/hooks/use-mill';
import { Factory, ChevronRight } from 'lucide-react';
import type { Mill } from '@/lib/types';

export function MillSelectionInline() {
  const { mills, selectMill } = useMill();

  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-4 bg-muted/20">
      <Card className="w-full max-w-md shadow-2xl border-none">
        <CardHeader className="text-center">
          <div className="flex justify-center items-center mb-4">
            <div className="bg-primary/10 p-4 rounded-3xl">
                <Factory className="h-12 w-12 text-primary" />
            </div>
          </div>
          <CardTitle className="text-3xl font-headline text-primary">Select a Mill</CardTitle>
          <CardDescription className="text-base">Choose your current operational location.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col space-y-4">
            {mills && mills.map((mill: Mill) => (
              <Button
                key={mill.id}
                variant="outline"
                size="lg"
                className="w-full justify-between text-left h-20 px-6 border-primary/10 hover:border-primary/30 hover:bg-primary/5 rounded-2xl transition-all group"
                onClick={() => selectMill(mill.id)}
              >
                <div className="flex flex-col items-start">
                    <span className="font-bold text-lg text-primary">{mill.name}</span>
                    <span className="text-xs text-muted-foreground uppercase tracking-widest">{mill.location}</span>
                </div>
                <ChevronRight className="h-6 w-6 text-primary/20 group-hover:text-primary transition-colors" />
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
