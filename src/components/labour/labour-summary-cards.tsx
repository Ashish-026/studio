'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useLabourData } from '@/context/labour-context';
import { useAuth } from '@/hooks/use-auth';
import { Banknote, Users, Scale } from 'lucide-react';
import { useMemo } from 'react';

export function LabourSummaryCards() {
  const { labourers } = useLabourData();
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';

  const summary = useMemo(() => {
    const totalWages = labourers.reduce((acc, item) => acc + item.totalWages, 0);
    const totalPaid = labourers.reduce((acc, item) => acc + item.totalPaid, 0);
    const balance = totalWages - totalPaid;
    const totalLabourers = labourers.length;

    return {
      totalWages,
      totalPaid,
      balance,
      totalLabourers
    };
  }, [labourers]);

  const formatCurrency = (num: number) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(num);

  if (!isAdmin) {
    return null;
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Wages Earned</CardTitle>
          <Banknote className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{formatCurrency(summary.totalWages)}</div>
          <p className="text-xs text-muted-foreground">Total wages accumulated by labourers.</p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Payments Made</CardTitle>
          <Banknote className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{formatCurrency(summary.totalPaid)}</div>
          <p className="text-xs text-muted-foreground">Total amount paid to labourers.</p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Outstanding Balance</CardTitle>
          <Scale className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-destructive">{formatCurrency(summary.balance)}</div>
          <p className="text-xs text-muted-foreground">Total balance to be paid.</p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Labourers</CardTitle>
          <Users className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{summary.totalLabourers}</div>
          <p className="text-xs text-muted-foreground">Number of unique labourers.</p>
        </CardContent>
      </Card>
    </div>
  );
}
