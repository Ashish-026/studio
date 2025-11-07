'use client';

import { useMemo } from 'react';
import { usePrivateData } from '@/context/private-context';
import { useAuth } from '@/hooks/use-auth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowDown, ArrowUp, Banknote, Scale } from 'lucide-react';

export function PrivateSummaryCards() {
  const { purchases, sales } = usePrivateData();
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';

  const summary = useMemo(() => {
    const totalPayable = purchases.reduce((acc, p) => acc + p.balance, 0);
    const totalReceivable = sales.reduce((acc, s) => acc + s.balance, 0);
    const totalPurchaseAmount = purchases.reduce((acc,p) => acc + p.totalAmount, 0);
    const totalSaleAmount = sales.reduce((acc,s) => acc + s.totalAmount, 0);

    return {
      totalPayable,
      totalReceivable,
      totalPurchaseAmount,
      totalSaleAmount
    };
  }, [purchases, sales]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 2,
    }).format(amount);
  };
  
  if (!isAdmin) {
    return null;
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
       <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Purchases</CardTitle>
          <ArrowDown className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{formatCurrency(summary.totalPurchaseAmount)}</div>
          <p className="text-xs text-muted-foreground">Total value of all purchases.</p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Sales</CardTitle>
          <ArrowUp className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{formatCurrency(summary.totalSaleAmount)}</div>
          <p className="text-xs text-muted-foreground">Total value of all sales.</p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Balance to be Paid (Payable)</CardTitle>
          <Scale className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-destructive">{formatCurrency(summary.totalPayable)}</div>
          <p className="text-xs text-muted-foreground">Total outstanding balance to farmers.</p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Balance to be Received (Receivable)</CardTitle>
          <Banknote className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-green-600">{formatCurrency(summary.totalReceivable)}</div>
          <p className="text-xs text-muted-foreground">Total outstanding balance from customers.</p>
        </CardContent>
      </Card>
    </div>
  );
}
