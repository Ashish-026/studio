'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useLabourData } from '@/context/labour-context';
import { Banknote, Users, Wrench } from 'lucide-react';
import { useMemo } from 'react';

export function LabourSummaryCards() {
  const { records } = useLabourData();

  const summary = useMemo(() => {
    const totalWages = records.reduce((acc, item) => acc + item.wage, 0);
    const totalLabourers = new Set(records.map(r => r.name)).size;
    const dailyActivities = new Set(records.filter(r => r.entryType === 'daily').map(r => r.activity)).size;
    const itemRateActivities = new Set(records.filter(r => r.entryType === 'item_rate').map(r => r.itemName)).size;
    const uniqueActivities = dailyActivities + itemRateActivities;

    return {
      totalWages,
      totalLabourers,
      uniqueActivities
    };
  }, [records]);

  const formatCurrency = (num: number) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(num);

  return (
    <div className="grid gap-4 md:grid-cols-3">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Wages Paid</CardTitle>
          <Banknote className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{formatCurrency(summary.totalWages)}</div>
          <p className="text-xs text-muted-foreground">Total amount paid to labour.</p>
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
       <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Types of Activities</CardTitle>
          <Wrench className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{summary.uniqueActivities}</div>
          <p className="text-xs text-muted-foreground">Number of unique job activities.</p>
        </CardContent>
      </Card>
    </div>
  );
}
