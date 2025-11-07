'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { usePrivateData } from '@/context/private-context';
import { Wallet, CircleDollarSign, Scale, Banknote } from 'lucide-react';
import { useMemo } from 'react';

export function PrivateSummaryCards() {
  const { purchases } = usePrivateData();

  const summary = useMemo(() => {
    let totalPaddy = 0;
    let totalRice = 0;
    let totalBalance = 0;
    let totalAdvance = 0;

    purchases.forEach(p => {
        if(p.itemType === 'paddy') totalPaddy += p.quantity;
        if(p.itemType === 'rice') totalRice += p.quantity;
        
        if (p.balance > 0) {
            totalBalance += p.balance;
        } else if (p.balance < 0) {
            totalAdvance += Math.abs(p.balance);
        }
    });

    return { totalPaddy, totalRice, totalBalance, totalAdvance };
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
          <CardTitle className="text-sm font-medium">Total Paddy Purchased (Qtl)</CardTitle>
          <Wallet className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{formatNumber(summary.totalPaddy)}</div>
          <p className="text-xs text-muted-foreground">Total paddy from private purchases.</p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Rice Purchased (Qtl)</CardTitle>
          <Scale className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{formatNumber(summary.totalRice)}</div>
          <p className="text-xs text-muted-foreground">Total rice from private purchases.</p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Balance to be Paid</CardTitle>
          <CircleDollarSign className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{formatCurrency(summary.totalBalance)}</div>
          <p className="text-xs text-muted-foreground">Total outstanding amount to farmers.</p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Advance Paid</CardTitle>
          <Banknote className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{formatCurrency(summary.totalAdvance)}</div>
          <p className="text-xs text-muted-foreground">Total advance amount paid to farmers.</p>
        </CardContent>
      </Card>
    </div>
  );
}
