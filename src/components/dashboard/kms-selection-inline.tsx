'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Calendar, ArrowLeft } from 'lucide-react';
import { useKmsYear } from '@/hooks/use-kms-year';
import { useMill } from '@/hooks/use-mill';
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from '@/components/ui/select';

export function KmsSelectionInline() {
  const { availableKmsYears, selectKmsYear } = useKmsYear();
  const { selectedMill, selectMill } = useMill();
  const [selectedYear, setSelectedYear] = useState<string | null>(null);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-4 bg-muted/20">
      <Card className="w-full max-w-md shadow-2xl border-none">
        <CardHeader className="text-center relative">
          <Button 
            variant="ghost" 
            size="icon" 
            className="absolute left-4 top-4 text-muted-foreground hover:text-primary"
            onClick={() => selectMill('')} // Reset mill to go back
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex justify-center items-center mb-4">
            <div className="bg-primary/10 p-4 rounded-3xl">
                <Calendar className="h-12 w-12 text-primary" />
            </div>
          </div>
          <CardTitle className="text-3xl font-headline text-primary">Marketing Season</CardTitle>
          <CardDescription className="text-base font-medium text-primary/60">
            {selectedMill?.name}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
            <Select onValueChange={setSelectedYear} value={selectedYear || ''}>
              <SelectTrigger className="w-full h-14 text-lg rounded-xl border-primary/20">
                <SelectValue placeholder="Select KMS Year..." />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  <SelectLabel>Available Seasons</SelectLabel>
                  {availableKmsYears && availableKmsYears.map((year: string) => (
                    <SelectItem key={year} value={year} className="py-3">
                      KMS {year}
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
            <Button
                size="lg"
                className="w-full bg-primary py-8 rounded-2xl text-lg font-bold shadow-xl hover:scale-[1.02] transition-transform"
                onClick={() => selectedYear && selectKmsYear(selectedYear)}
                disabled={!selectedYear}
            >
                Confirm & Open Dashboard
            </Button>
        </CardContent>
      </Card>
    </div>
  );
}
