'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useVehicleData } from '@/context/vehicle-context';
import { useAuth } from '@/hooks/use-auth';
import { Banknote, Car, Scale } from 'lucide-react';
import { useMemo } from 'react';

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

  const formatCurrency = (num: number) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(num);

  if (!isAdmin) {
    return null;
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Rent Due</CardTitle>
          <Banknote className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{formatCurrency(summary.totalRent)}</div>
          <p className="text-xs text-muted-foreground">Total accumulated rent for all vehicles.</p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Rent Paid</CardTitle>
          <Banknote className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{formatCurrency(summary.totalPaid)}</div>
          <p className="text-xs text-muted-foreground">Total amount paid for vehicle rents.</p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Outstanding Balance</CardTitle>
          <Scale className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-destructive">{formatCurrency(summary.balance)}</div>
          <p className="text-xs text-muted-foreground">Total rent balance to be paid.</p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Vehicles</CardTitle>
          <Car className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{summary.totalVehicles}</div>
          <p className="text-xs text-muted-foreground">Number of unique vehicles registered.</p>
        </CardContent>
      </Card>
    </div>
  );
}
