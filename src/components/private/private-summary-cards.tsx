'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { usePrivateData } from '@/context/private-context';
import { Wallet, CircleDollarSign } from 'lucide-react';
import { useMemo } from 'react';

export function PrivateSummaryCards() {
  const { entries } = usePrivateData();

  const summary = useMemo(() => {
    const totalQuantity = entries.reduce((acc, item) => acc + item.quantityReceived, 0);
    const totalAmount = entries.reduce((acc, item) => acc + item.amountPaid, 0);

    return {
      totalQuantity,
      totalAmount,
    };
  }, [entries]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 2,
    }).format(amount);
  }

  const formatNumber = (num: number) => new Intl.NumberFormat('en-IN').format(num);

  return (
    <div className="grid gap-4 md:grid-cols-2">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Quantity Received (Quintals)</CardTitle>
          <Wallet className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{formatNumber(summary.totalQuantity)}</div>
          <p className="text-xs text-muted-foreground">Total quantity from private purchases.</p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Amount Paid</CardTitle>
          <CircleDollarSign className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{formatCurrency(summary.totalAmount)}</div>
          <p className="text-xs text-muted-foreground">Total amount paid for private purchases.</p>
        </CardContent>
      </Card>
    </div>
  );
}
