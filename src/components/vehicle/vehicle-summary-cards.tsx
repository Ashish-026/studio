
'use client';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useVehicleData } from '@/context/vehicle-context';
import { useAuth } from '@/hooks/use-auth';
import { Banknote, Car, Scale, Truck } from 'lucide-react';
import { useMemo } from 'react';
import { 
  PieChart, 
  Pie, 
  Cell, 
  ResponsiveContainer, 
  Tooltip as RechartsTooltip,
  Legend
} from 'recharts';

export function VehicleSummaryCards() {
  const { vehicles } = useVehicleData();
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';

  const summary = useMemo(() => {
    const totalRent = vehicles.reduce((acc, v) => acc + v.totalRent, 0);
    const totalPaid = vehicles.reduce((acc, v) => acc + v.totalPaid, 0);
    const balance = totalRent - totalPaid;
    const totalVehicles = vehicles.length;

    return {
      totalRent,
      totalPaid,
      balance,
      totalVehicles
    };
  }, [vehicles]);

  const financialData = useMemo(() => [
    { name: 'Rent Paid', value: summary.totalPaid, color: 'hsl(var(--primary))' },
    { name: 'Balance Due', value: Math.max(0, summary.balance), color: '#ef4444' }
  ], [summary]);

  const formatCurrency = (num: number) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(num);

  if (!isAdmin) return null;

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="shadow-md border-none">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-bold opacity-60">Total Liability</CardTitle>
            <Banknote className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-black text-primary">{formatCurrency(summary.totalRent)}</div>
          </CardContent>
        </Card>
        <Card className="shadow-md border-none">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-bold opacity-60">Total Paid</CardTitle>
            <Truck className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-black text-primary">{formatCurrency(summary.totalPaid)}</div>
          </CardContent>
        </Card>
        <Card className="shadow-md border-none">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-bold opacity-60">Outstanding</CardTitle>
            <Scale className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-black text-destructive">{formatCurrency(summary.balance)}</div>
          </CardContent>
        </Card>
        <Card className="shadow-md border-none">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-bold opacity-60">Active Fleet</CardTitle>
            <Car className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-black">{summary.totalVehicles}</div>
          </CardContent>
        </Card>
      </div>

      <Card className="shadow-xl border-primary/5 rounded-3xl overflow-hidden bg-white/50 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Scale className="h-5 w-5 text-primary" />
            Rent Payment Status
          </CardTitle>
          <CardDescription>Overall breakdown of logistics financial health</CardDescription>
        </CardHeader>
        <CardContent className="h-[250px] flex items-center justify-center">
          {summary.totalRent > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={financialData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={85}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {financialData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <RechartsTooltip formatter={(val: number) => formatCurrency(val)} />
                <Legend verticalAlign="bottom" iconType="circle" />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="italic text-muted-foreground text-sm">No vehicle rent data to display.</div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
