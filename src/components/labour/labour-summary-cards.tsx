'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useLabourData } from '@/context/labour-context';
import { Clock, Users, Wrench } from 'lucide-react';
import { useMemo } from 'react';

export function LabourSummaryCards() {
  const { records } = useLabourData();

  const summary = useMemo(() => {
    const totalHours = records.reduce((acc, item) => acc + item.hoursWorked, 0);
    const totalLabourers = new Set(records.map(r => r.name)).size;
    const uniqueActivities = new Set(records.map(r => r.activity)).size;

    return {
      totalHours,
      totalLabourers,
      uniqueActivities
    };
  }, [records]);

  const formatNumber = (num: number) => new Intl.NumberFormat('en-IN').format(num);

  return (
    <div className="grid gap-4 md:grid-cols-3">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Hours Worked</CardTitle>
          <Clock className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{formatNumber(summary.totalHours)}</div>
          <p className="text-xs text-muted-foreground">Total man-hours recorded.</p>
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
