'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { usePrivateData } from '@/context/private-context';
import { Building, Users, Wallet } from 'lucide-react';
import { useMemo } from 'react';

export function PrivateSummaryCards() {
  const { purchases } = usePrivateData();

  const summary = useMemo(() => {
    const totalPaddyPurchased = purchases
      .filter(p => p.itemType === 'paddy')
      .reduce((acc, item) => acc + item.quantity, 0);
    const totalRicePurchased = purchases
      .filter(p => p.itemType === 'rice')
      .reduce((acc, item) => acc + item.quantity, 0);
    const uniqueMandis = new Set(purchases.map(p => p.mandiName)).size;
    const uniqueFarmers = new Set(purchases.map(p => p.farmerName)).size;

    return {
      totalPaddyPurchased,
      totalRicePurchased,
      uniqueMandis,
      uniqueFarmers
    };
  }, [purchases]);

  const formatNumber = (num: number) => new Intl.NumberFormat('en-IN').format(num);

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Paddy Purchased (Quintals)</CardTitle>
          <Wallet className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{formatNumber(summary.totalPaddyPurchased)}</div>
          <p className="text-xs text-muted-foreground">Total paddy purchased from private mandis.</p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Rice Purchased (Quintals)</CardTitle>
          <Wallet className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{formatNumber(summary.totalRicePurchased)}</div>
          <p className="text-xs text-muted-foreground">Total rice purchased from private mandis.</p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Active Mandis</CardTitle>
          <Building className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{summary.uniqueMandis}</div>
          <p className="text-xs text-muted-foreground">Number of unique private mandis.</p>
        </CardContent>
      </Card>
       <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Farmers</CardTitle>
          <Users className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{summary.uniqueFarmers}</div>
          <p className="text-xs text-muted-foreground">Number of unique farmers.</p>
        </CardContent>
      </Card>
    </div>
  );
}
