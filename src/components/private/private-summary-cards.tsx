'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { usePrivateData } from '@/context/private-context';
import { Wallet, CircleDollarSign, Coins } from 'lucide-react';
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

    const totalBalance = purchases.reduce((acc, p) => acc + p.balance, 0);
    const balanceToBePaid = purchases
      .filter(p => p.balance > 0)
      .reduce((acc, p) => acc + p.balance, 0);
    const advancePaid = purchases
      .filter(p => p.balance < 0)
      .reduce((acc, p) => acc + Math.abs(p.balance), 0);

    return {
      totalPaddyPurchased,
      totalRicePurchased,
      balanceToBePaid,
      advancePaid
    };
  }, [purchases]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 2,
    }).format(amount);
  }

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
          <CardTitle className="text-sm font-medium">Total Balance to be Paid</CardTitle>
          <CircleDollarSign className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-destructive">{formatCurrency(summary.balanceToBePaid)}</div>
          <p className="text-xs text-muted-foreground">Total outstanding amount to all farmers.</p>
        </CardContent>
      </Card>
       <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Advance Paid</CardTitle>
          <Coins className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-green-600">{formatCurrency(summary.advancePaid)}</div>
          <p className="text-xs text-muted-foreground">Total advance paid out to all farmers.</p>
        </CardContent>
      </Card>
    </div>
  );
}
