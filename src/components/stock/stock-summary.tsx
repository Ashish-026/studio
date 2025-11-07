'use client';

import { useStockData } from '@/context/stock-context';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Wheat, Sprout, Package, Upload } from 'lucide-react';
import { PrivateSummaryCards } from '../private/private-summary-cards';
import { Button } from '../ui/button';
import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '../ui/form';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Input } from '../ui/input';
import { useToast } from '@/hooks/use-toast';


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
    <div className="space-y-8">
        <PrivateSummaryCards />
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Paddy Stock</CardTitle>
                <Wheat className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
                <div className="text-2xl font-bold">{formatNumber(totalStock.paddy)} Qtl</div>
                <p className="text-xs text-muted-foreground">Combined private paddy stock.</p>
            </CardContent>
            </Card>
            <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Rice Stock</CardTitle>
                <Sprout className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
                <div className="text-2xl font-bold">{formatNumber(totalStock.rice)} Qtl</div>
                <p className="text-xs text-muted-foreground">Total available rice stock.</p>
            </CardContent>
            </Card>
            <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Bran Stock</CardTitle>
                <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
                <div className="text-2xl font-bold">{formatNumber(totalStock.bran)} Qtl</div>
                <p className="text-xs text-muted-foreground">From all processing sources.</p>
            </CardContent>
            </Card>
            <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Broken Rice Stock</CardTitle>
                <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
                <div className="text-2xl font-bold">{formatNumber(totalStock.brokenRice)} Qtl</div>
                <p className="text-xs text-muted-foreground">From all processing sources.</p>
            </CardContent>
            </Card>
        </div>

        <Card>
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                    <CardTitle>Stock Breakdown</CardTitle>
                    <CardDescription>Available stock quantities from different sources.</CardDescription>
                </div>
                 <Button onClick={() => setTransferDialogOpen(true)} size="sm" variant="outline">
                    <Upload className="mr-2 h-4 w-4" />
                    Transfer to Mandi
                </Button>
              </div>
            </CardHeader>
            <CardContent>
                <div className="border rounded-lg">
                    <Table>
                    <TableHeader>
                        <TableRow>
                        <TableHead>Source</TableHead>
                        <TableHead className="text-right">Paddy (Qtl)</TableHead>
                        <TableHead className="text-right">Rice (Qtl)</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        <TableRow>
                        <TableCell className="font-medium">Private</TableCell>
                        <TableCell className="text-right">{formatNumber(privateStock.paddy)}</TableCell>
                        <TableCell className="text-right">{formatNumber(privateStock.rice)}</TableCell>
                        </TableRow>
                    </TableBody>
                    <tfoot className="border-t bg-muted/20">
                        <TableRow className="font-bold">
                            <TableCell>Total Available</TableCell>
                            <TableCell className="text-right">{formatNumber(totalStock.paddy)}</TableCell>
                            <TableCell className="text-right">{formatNumber(totalStock.rice)}</TableCell>
                        </TableRow>
                    </tfoot>
                    </Table>
                </div>
            </CardContent>
        </Card>
        <Dialog open={isTransferDialogOpen} onOpenChange={setTransferDialogOpen}>
          <DialogContent>
              <DialogHeader>
                  <DialogTitle>Transfer Rice to Mandi</DialogTitle>
              </DialogHeader>
              <Form {...transferForm}>
                  <form onSubmit={transferForm.handleSubmit(onTransferSubmit)} className="space-y-4">
                      <FormField control={transferForm.control} name="quantity" render={({ field }) => (
                          <FormItem><FormLabel>Quantity to Transfer (Qtl)</FormLabel><FormControl><Input type="number" step="0.01" placeholder="Enter quantity" {...field} /></FormControl><FormMessage /></FormItem>
                      )} />
                      <Button type="submit" className="w-full bg-accent hover:bg-accent/90">Confirm Transfer</Button>
                  </form>
              </Form>
          </DialogContent>
      </Dialog>
    </div>
  );
}
