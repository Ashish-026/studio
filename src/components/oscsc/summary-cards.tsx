'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useOSCSCData } from '@/context/oscsc-context';
import { Scale, Target, Tractor, Warehouse } from 'lucide-react';
import { useMemo } from 'react';

export function SummaryCards() {
  const { targetAllocations, paddyLiftedItems } = useOSCSCData();

  const summary = useMemo(() => {
    const targetAllotted = targetAllocations.reduce((acc, item) => acc + item.target, 0);
    
    const physicalPaddyLifted = paddyLiftedItems
      .filter(item => item.entryType === 'physical' || !item.entryType)
      .reduce((acc, item) => acc + item.totalPaddyReceived, 0);

    const nonPhysicallyLifted = paddyLiftedItems
      .filter(item => item.entryType === 'monetary')
      .reduce((acc, item) => acc + item.totalPaddyReceived, 0);
      
    const totalPaddyLifted = physicalPaddyLifted + nonPhysicallyLifted;
    const balanceToBeLifted = targetAllotted - totalPaddyLifted;

    return {
      targetAllotted,
      physicalPaddyLifted,
      balanceToBeLifted,
      nonPhysicallyLifted,
    };
  }, [targetAllocations, paddyLiftedItems]);

  const formatNumber = (num: number) => new Intl.NumberFormat('en-IN').format(num);

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Target Allotted (Quintals)</CardTitle>
          <Target className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{formatNumber(summary.targetAllotted)}</div>
          <p className="text-xs text-muted-foreground">Total target set for lifting.</p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Physical Paddy Lifted (Quintals)</CardTitle>
          <Tractor className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{formatNumber(summary.physicalPaddyLifted)}</div>
          <p className="text-xs text-muted-foreground">Total paddy physically received.</p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Balance to be Lifted (Quintals)</CardTitle>
          <Scale className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{formatNumber(summary.balanceToBeLifted)}</div>
          <p className="text-xs text-muted-foreground">Remaining target to be achieved.</p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Monetary Paddy Lifted (Quintals)</CardTitle>
          <Warehouse className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{formatNumber(summary.nonPhysicallyLifted)}</div>
          <p className="text-xs text-muted-foreground">Paddy equivalent from monetary entries.</p>
        </CardContent>
      </Card>
    </div>
  );
}
