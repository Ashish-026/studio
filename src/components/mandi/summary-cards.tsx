'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useMandiData } from '@/context/mandi-context';
import { useAuth } from '@/hooks/use-auth';
import { Scale, Target, Tractor, Warehouse, Sprout, Package } from 'lucide-react';
import { useMemo } from 'react';

export function SummaryCards() {
  const { targetAllocations, paddyLiftedItems, availableRiceForSupply, totalRiceFromProcessing } = useMandiData();
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';

  const summary = useMemo(() => {
    const targetAllotted = targetAllocations.reduce((acc, item) => acc + item.target, 0);
    // Official Weight sum calculation
    const totalPaddyLifted = paddyLiftedItems.reduce((acc, item) => acc + (Number(item.mandiWeight) || 0), 0);
    const balanceToBeLifted = targetAllotted - totalPaddyLifted;
    
    return {
      targetAllotted,
      totalPaddyLifted,
      balanceToBeLifted,
    };
  }, [targetAllocations, paddyLiftedItems]);

  const formatNumber = (num: number) => new Intl.NumberFormat('en-IN', { maximumFractionDigits: 2 }).format(num);

  return (
    <div className={`grid gap-4 md:grid-cols-2 ${isAdmin ? 'lg:grid-cols-5' : 'lg:grid-cols-3'}`}>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Target Allotted (Qtl)</CardTitle>
          <Target className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{formatNumber(summary.targetAllotted)}</div>
          <p className="text-xs text-muted-foreground">Total target set for lifting.</p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Paddy Lifted (Qtl)</CardTitle>
          <Tractor className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{formatNumber(summary.totalPaddyLifted)}</div>
          <p className="text-xs text-muted-foreground">Sum of official mandi weights.</p>
        </CardContent>
      </Card>
      {isAdmin && (
        <>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Balance to Lift (Qtl)</CardTitle>
              <Scale className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatNumber(summary.balanceToBeLifted)}</div>
              <p className="text-xs text-muted-foreground">Remaining target to be achieved.</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Rice Produced (Qtl)</CardTitle>
              <Sprout className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatNumber(totalRiceFromProcessing)}</div>
              <p className="text-xs text-muted-foreground">From processed paddy.</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Available Rice Stock (Qtl)</CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatNumber(availableRiceForSupply)}</div>
              <p className="text-xs text-muted-foreground">Ready for supply.</p>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
