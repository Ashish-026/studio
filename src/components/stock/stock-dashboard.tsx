'use client';

import { useStockData } from '@/context/stock-context';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Warehouse, Wheat, Sprout } from 'lucide-react';

export function StockDashboard() {
  const { oscscStock, privateStock, totalStock } = useStockData();

  const formatNumber = (num: number) => new Intl.NumberFormat('en-IN', { maximumFractionDigits: 2 }).format(num);

  return (
    <div className="space-y-8">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Paddy Stock</CardTitle>
            <Wheat className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatNumber(totalStock.paddy)} Qtl</div>
            <p className="text-xs text-muted-foreground">Combined OSCSC and private paddy stock.</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Rice Stock</CardTitle>
            <Sprout className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatNumber(totalStock.rice)} Qtl</div>
            <p className="text-xs text-muted-foreground">Total available private rice stock.</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Stock Value (Est.)</CardTitle>
            <Warehouse className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">N/A</div>
            <p className="text-xs text-muted-foreground">Value estimation coming soon.</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Stock Breakdown</CardTitle>
          <CardDescription>Available stock quantities from different sources.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Source</TableHead>
                  <TableHead className="text-right">Paddy (Quintals)</TableHead>
                  <TableHead className="text-right">Rice (Quintals)</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow>
                  <TableCell className="font-medium">OSCSC</TableCell>
                  <TableCell className="text-right">{formatNumber(oscscStock.paddy)}</TableCell>
                  <TableCell className="text-right">{formatNumber(oscscStock.rice)}</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-medium">Private</TableCell>
                  <TableCell className="text-right">{formatNumber(privateStock.paddy)}</TableCell>
                  <TableCell className="text-right">{formatNumber(privateStock.rice)}</TableCell>
                </TableRow>
              </TableBody>
              <tfoot className="border-t">
                <TableRow className="font-bold text-lg">
                    <TableCell>Total Stock</TableCell>
                    <TableCell className="text-right">{formatNumber(totalStock.paddy)}</TableCell>
                    <TableCell className="text-right">{formatNumber(totalStock.rice)}</TableCell>
                </TableRow>
              </tfoot>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
