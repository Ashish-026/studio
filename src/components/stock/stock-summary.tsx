
'use client';

import { useStockData } from '@/context/stock-context';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Wheat, Sprout, Package, Upload, LayoutGrid } from 'lucide-react';
import { PrivateSummaryCards } from '../private/private-summary-cards';
import { Button } from '../ui/button';
import { useState, useMemo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '../ui/form';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Input } from '../ui/input';
import { useToast } from '@/hooks/use-toast';
import { 
  PieChart, 
  Pie, 
  Cell, 
  ResponsiveContainer, 
  Tooltip as RechartsTooltip,
  Legend
} from 'recharts';

const transferSchema = z.object({
  quantity: z.coerce.number().positive('Quantity must be positive'),
});

export function StockSummary() {
  const { privateStock, totalStock, transferRiceToMandi } = useStockData();
  const [isTransferDialogOpen, setTransferDialogOpen] = useState(false);
  const { toast } = useToast();

  const transferForm = useForm<z.infer<typeof transferSchema>>({
    resolver: zodResolver(transferSchema),
    defaultValues: { quantity: 0 },
  });

  const formatNumber = (num: number) => new Intl.NumberFormat('en-IN', { maximumFractionDigits: 2 }).format(num);

  const stockChartData = useMemo(() => [
    { name: 'Paddy', value: Math.max(0, totalStock.paddy), color: 'hsl(var(--primary))' },
    { name: 'Rice', value: Math.max(0, totalStock.rice), color: 'hsl(var(--accent))' },
    { name: 'Bran', value: Math.max(0, totalStock.bran), color: '#d97706' },
    { name: 'Broken', value: Math.max(0, totalStock.brokenRice), color: '#4b5563' },
  ], [totalStock]);

  function onTransferSubmit(values: z.infer<typeof transferSchema>) {
    if (values.quantity > privateStock.rice) {
        transferForm.setError('quantity', { message: `Exceeds available private rice stock of ${formatNumber(privateStock.rice)} Qtl` });
        return;
    }
    transferRiceToMandi(values.quantity);
    toast({ title: 'Success!', description: 'Rice has been transferred to mandi stock.' });
    transferForm.reset();
    setTransferDialogOpen(false);
  }

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card className="shadow-md border-none bg-primary/5">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-bold opacity-60 uppercase">Total Paddy</CardTitle>
                  <Wheat className="h-4 w-4 text-primary" />
              </CardHeader>
              <CardContent>
                  <div className="text-2xl font-black text-primary">{formatNumber(totalStock.paddy)} Qtl</div>
              </CardContent>
            </Card>
            <Card className="shadow-md border-none bg-accent/5">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-bold opacity-60 uppercase">Total Rice</CardTitle>
                  <Sprout className="h-4 w-4 text-accent-foreground" />
              </CardHeader>
              <CardContent>
                  <div className="text-2xl font-black text-accent-foreground">{formatNumber(totalStock.rice)} Qtl</div>
              </CardContent>
            </Card>
            <Card className="shadow-md border-none bg-muted/30">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-bold opacity-60 uppercase">Total Bran</CardTitle>
                  <Package className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                  <div className="text-2xl font-black text-muted-foreground">{formatNumber(totalStock.bran)} Qtl</div>
              </CardContent>
            </Card>
            <Card className="shadow-md border-none bg-muted/30">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-bold opacity-60 uppercase">Broken Rice</CardTitle>
                  <Package className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                  <div className="text-2xl font-black text-muted-foreground">{formatNumber(totalStock.brokenRice)} Qtl</div>
              </CardContent>
            </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="lg:col-span-1 shadow-xl border-primary/5 rounded-3xl overflow-hidden bg-white/50 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <LayoutGrid className="h-5 w-5 text-primary" />
                Inventory Distribution
              </CardTitle>
              <CardDescription>Mix of primary and byproducts</CardDescription>
            </CardHeader>
            <CardContent className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={stockChartData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={90}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {stockChartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <RechartsTooltip formatter={(val: number) => `${val.toFixed(2)} Qtl`} />
                  <Legend verticalAlign="bottom" iconType="circle" />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card className="lg:col-span-2 shadow-xl border-primary/5 rounded-3xl overflow-hidden">
            <CardHeader className="bg-primary/5 border-b border-primary/5">
              <div className="flex justify-between items-center">
                <div>
                    <CardTitle className="text-lg font-bold text-primary uppercase tracking-widest">Available Ledger</CardTitle>
                    <CardDescription>Live breakdown of operational stock sources.</CardDescription>
                </div>
                 <Button onClick={() => setTransferDialogOpen(true)} size="sm" variant="outline" className="rounded-xl border-primary/20 bg-white">
                    <Upload className="mr-2 h-4 w-4" />
                    Internal Transfer
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-0">
                <Table>
                  <TableHeader className="bg-muted/30">
                      <TableRow className="border-none">
                        <TableHead className="font-bold py-4 pl-6">Stock Source</TableHead>
                        <TableHead className="text-right font-bold py-4">Paddy (Qtl)</TableHead>
                        <TableHead className="text-right font-bold py-4 pr-6">Rice (Qtl)</TableHead>
                      </TableRow>
                  </TableHeader>
                  <TableBody>
                      <TableRow className="hover:bg-primary/5 transition-colors border-primary/5">
                        <TableCell className="font-bold text-primary pl-6">Private Holdings</TableCell>
                        <TableCell className="text-right font-medium">{formatNumber(privateStock.paddy)}</TableCell>
                        <TableCell className="text-right font-medium pr-6">{formatNumber(privateStock.rice)}</TableCell>
                      </TableRow>
                  </TableBody>
                  <tfoot className="border-t bg-primary/5">
                      <TableRow className="font-black text-primary">
                          <TableCell className="pl-6 py-4">CONSOLIDATED TOTAL</TableCell>
                          <TableCell className="text-right py-4">{formatNumber(totalStock.paddy)}</TableCell>
                          <TableCell className="text-right pr-6 py-4">{formatNumber(totalStock.rice)}</TableCell>
                      </TableRow>
                  </tfoot>
                </Table>
            </CardContent>
          </Card>
        </div>

        <Dialog open={isTransferDialogOpen} onOpenChange={setTransferDialogOpen}>
          <DialogContent className="rounded-3xl border-none">
              <DialogHeader>
                  <DialogTitle>Transfer Rice to Mandi Stock</DialogTitle>
              </DialogHeader>
              <Form {...transferForm}>
                  <form onSubmit={transferForm.handleSubmit(onTransferSubmit)} className="space-y-4">
                      <FormField control={transferForm.control} name="quantity" render={({ field }) => (
                          <FormItem><FormLabel>Quantity to Transfer (Qtl)</FormLabel><FormControl><Input type="number" step="0.01" placeholder="Enter quantity" {...field} className="rounded-xl h-12" /></FormControl><FormMessage /></FormItem>
                      )} />
                      <Button type="submit" className="w-full bg-primary text-white font-bold h-12 rounded-xl">Confirm Transfer</Button>
                  </form>
              </Form>
          </DialogContent>
      </Dialog>
    </div>
  );
}
