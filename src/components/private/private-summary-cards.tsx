
'use client';

import { useMemo } from 'react';
import { useStockData } from '@/context/stock-context';
import { useAuth } from '@/hooks/use-auth';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { ArrowDown, ArrowUp, Banknote, Scale, TrendingUp, PieChart as PieChartIcon } from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip as RechartsTooltip, 
  ResponsiveContainer, 
  Cell,
  PieChart,
  Pie
} from 'recharts';

export function PrivateSummaryCards() {
  const { purchases, sales } = useStockData();
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

  const commerceData = useMemo(() => [
    { name: 'Purchases', value: summary.totalPurchaseAmount, color: 'hsl(var(--primary))' },
    { name: 'Sales', value: summary.totalSaleAmount, color: 'hsl(var(--accent))' }
  ], [summary]);

  const financialMix = useMemo(() => [
    { name: 'Payables', value: Math.max(0, summary.totalPayable), color: '#ef4444' },
    { name: 'Receivables', value: Math.max(0, summary.totalReceivable), color: '#22c55e' }
  ], [summary]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(amount);
  };
  
  if (!isAdmin) return null;

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="shadow-md border-none">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-bold opacity-60">Total Purchases</CardTitle>
            <ArrowDown className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-black text-primary">{formatCurrency(summary.totalPurchaseAmount)}</div>
          </CardContent>
        </Card>
        <Card className="shadow-md border-none">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-bold opacity-60">Total Sales</CardTitle>
            <ArrowUp className="h-4 w-4 text-accent-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-black text-accent-foreground">{formatCurrency(summary.totalSaleAmount)}</div>
          </CardContent>
        </Card>
        <Card className="shadow-md border-none">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-bold opacity-60">To be Paid</CardTitle>
            <Scale className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-black text-destructive">{formatCurrency(summary.totalPayable)}</div>
          </CardContent>
        </Card>
        <Card className="shadow-md border-none">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-bold opacity-60">To be Received</CardTitle>
            <Banknote className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-black text-green-600">{formatCurrency(summary.totalReceivable)}</div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="shadow-xl border-primary/5 rounded-3xl overflow-hidden bg-white/50 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-primary" />
              Commerce Pulse
            </CardTitle>
            <CardDescription>Visual comparison of procurement vs sales value</CardDescription>
          </CardHeader>
          <CardContent className="h-[250px] pt-4">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={commerceData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.1} />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fontWeight: 600 }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10 }} />
                <RechartsTooltip formatter={(val: number) => formatCurrency(val)} contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }} />
                <Bar dataKey="value" radius={[6, 6, 0, 0]} barSize={60}>
                  {commerceData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="shadow-xl border-primary/5 rounded-3xl overflow-hidden bg-white/50 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <PieChartIcon className="h-5 w-5 text-primary" />
              Outstanding Mix
            </CardTitle>
            <CardDescription>Distribution of current financial liabilities</CardDescription>
          </CardHeader>
          <CardContent className="h-[250px] flex items-center justify-center">
            {summary.totalPayable + summary.totalReceivable > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={financialMix}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={8}
                    dataKey="value"
                  >
                    {financialMix.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <RechartsTooltip formatter={(val: number) => formatCurrency(val)} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="italic text-muted-foreground text-sm">No outstanding balances to display.</div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
