'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Calendar } from 'lucide-react';
import { useKmsYear } from '@/hooks/use-kms-year';
import { Skeleton } from '@/components/ui/skeleton';
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from '@/components/ui/select';

export default function SelectKmsYearPage() {
  const { availableKmsYears, selectKmsYear, loading } = useKmsYear();
  const [selectedYear, setSelectedYear] = useState<string | null>(null);
  const router = useRouter();

  const handleSelectYear = () => {
    if (selectedYear) {
      selectKmsYear(selectedYear);
      router.push('/dashboard');
    }
  };

  if (loading) {
      return <div className="flex min-h-screen flex-col items-center justify-center p-4 bg-background">
          <Card className="w-full max-w-md">
              <CardHeader>
                  <CardTitle>Select KMS Year</CardTitle>
                  <CardDescription>Choose the marketing season.</CardDescription>
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
            <Calendar className="h-10 w-10 text-primary" />
          </div>
          <CardTitle className="text-2xl font-headline">Select KMS Year</CardTitle>
          <CardDescription>Choose the Kharif Marketing Season to work with.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
            <Select onValueChange={setSelectedYear} value={selectedYear || ''}>
              <SelectTrigger className="w-full">
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
                className="w-full"
                onClick={handleSelectYear}
                disabled={!selectedYear}
            >
                Continue
            </Button>
        </CardContent>
      </Card>
    </div>
  );
}
