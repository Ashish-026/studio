'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Calendar } from 'lucide-react';
import { useKmsYear } from '@/hooks/use-kms-year';
import { Skeleton } from '@/components/ui/skeleton';
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from '@/components/ui/select';

export default function SelectKmsYearPage() {
  const { availableKmsYears, selectKmsYear, loading } = useKmsYear();
  const [selectedYear, setSelectedYear] = useState<string | null>(null);

  const handleSelectYear = () => {
    if (selectedYear) {
      selectKmsYear(selectedYear);
      // Hard refresh navigation to ensure the Dashboard environment is initialized cleanly
      window.location.href = '/dashboard';
    }
  };

  if (loading) {
      return (
        <div className="flex min-h-screen flex-col items-center justify-center p-4 bg-background">
            <Card className="w-full max-w-md">
                <CardHeader>
                    <CardTitle>Loading Season...</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <Skeleton className="h-10 w-full" />
                    <Skeleton className="h-10 w-full" />
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
                <Calendar className="h-10 w-10 text-primary" />
            </div>
          </div>
          <CardTitle className="text-2xl font-headline text-primary">Select KMS Year</CardTitle>
          <CardDescription>Choose the Kharif Marketing Season to work with.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
            <Select onValueChange={setSelectedYear} value={selectedYear || ''}>
              <SelectTrigger className="w-full h-12">
                <SelectValue placeholder="Select a marketing season..." />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  <SelectLabel>Available KMS Years</SelectLabel>
                  {availableKmsYears && availableKmsYears.map((year: string) => (
                    <SelectItem key={year} value={year}>
                      {year}
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
            <Button
                size="lg"
                className="w-full bg-primary py-6 rounded-xl font-semibold shadow-lg"
                onClick={handleSelectYear}
                disabled={!selectedYear}
            >
                Continue to Dashboard
            </Button>
        </CardContent>
      </Card>
    </div>
  );
}
