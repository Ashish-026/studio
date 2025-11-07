'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useStockData } from '@/context/stock-context';
import { usePrivateData } from '@/context/private-context';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Warehouse, Wheat, Sprout, ArrowRight, Package, ShoppingCart, Percent } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { format } from 'date-fns';

const saleSchema = z.object({
  customerName: z.string().min(1, 'Customer name is required'),
  itemType: z.enum(['paddy', 'rice']),
  quantity: z.coerce.number().positive('Quantity must be positive'),
  rate: z.coerce.number().positive('Rate must be positive'),
  initialPayment: z.coerce.number().min(0, 'Initial payment cannot be negative').default(0),
});

const processingSchema = z.object({
    paddyUsed: z.coerce.number().positive('Paddy quantity must be positive'),
    riceYield: z.coerce.number().positive('Rice yield must be positive'),
    branYield: z.coerce.number().min(0, 'Cannot be negative'),
    brokenRiceYield: z.coerce.number().min(0, 'Cannot be negative'),
});

export function StockDashboard() {
  const { oscscStock, privateStock, totalStock, processingHistory, addProcessingResult } = useStockData();
  const { addSale } = usePrivateData();
  const { toast } = useToast();

  const [isSaleDialogOpen, setSaleDialogOpen] = useState(false);
  const [isProcessingDialogOpen, setProcessingDialogOpen] = useState(false);

  const saleForm = useForm<z.infer<typeof saleSchema>>({
    resolver: zodResolver(saleSchema),
    defaultValues: { itemType: 'paddy' },
  });

  const processingForm = useForm<z.infer<typeof processingSchema>>({
    resolver: zodResolver(processingSchema),
  });

  const formatNumber = (num: number) => new Intl.NumberFormat('en-IN', { maximumFractionDigits: 2 }).format(num);

  function onSaleSubmit(values: z.infer<typeof saleSchema>) {
    const stockAvailable = values.itemType === 'paddy' ? totalStock.paddy : totalStock.rice;
    if (values.quantity > stockAvailable) {
        saleForm.setError('quantity', { message: `Exceeds available stock of ${formatNumber(stockAvailable)} Qtl` });
        return;
    }
    addSale(values);
    toast({ title: 'Success!', description: 'Sale has been recorded and stock updated.' });
    saleForm.reset();
    setSaleDialogOpen(false);
  }

  function onProcessingSubmit(values: z.infer<typeof processingSchema>) {
    if(values.paddyUsed > totalStock.paddy) {
        processingForm.setError('paddyUsed', { message: `Exceeds available paddy stock of ${formatNumber(totalStock.paddy)} Qtl` });
        return;
    }
    addProcessingResult(values);
    toast({ title: 'Success!', description: 'Processing has been recorded and stock updated.' });
    processingForm.reset();
    setProcessingDialogOpen(false);
  }

  return (
    <>
    <div className="space-y-8">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
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
            <CardTitle className="text-sm font-medium">Total Bran Stock</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatNumber(totalStock.bran)} Qtl</div>
            <p className="text-xs text-muted-foreground">From processing.</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Broken Rice Stock</CardTitle>
             <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatNumber(totalStock.brokenRice)} Qtl</div>
            <p className="text-xs text-muted-foreground">From processing.</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Stock Actions</CardTitle>
          <CardDescription>Release stock for sale or processing.</CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Button onClick={() => setSaleDialogOpen(true)} variant="outline" size="lg" className="h-auto py-4">
                <div className="flex items-center gap-4">
                    <ShoppingCart className="h-8 w-8 text-primary" />
                    <div className="text-left">
                        <p className="font-semibold text-lg">Release for Sale</p>
                        <p className="text-sm text-muted-foreground">Sell paddy or rice and update Private Register.</p>
                    </div>
                </div>
            </Button>
            <Button onClick={() => setProcessingDialogOpen(true)} variant="outline" size="lg" className="h-auto py-4">
                <div className="flex items-center gap-4">
                    <ArrowRight className="h-8 w-8 text-primary" />
                    <div className="text-left">
                        <p className="font-semibold text-lg">Release for Processing</p>
                        <p className="text-sm text-muted-foreground">Convert paddy into rice and other byproducts.</p>
                    </div>
                </div>
            </Button>
        </CardContent>
      </Card>
      
      <div className='grid grid-cols-1 lg:grid-cols-2 gap-8'>
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
                    <TableHead className="text-right">Paddy (Qtl)</TableHead>
                    <TableHead className="text-right">Rice (Qtl)</TableHead>
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

        <Card>
            <CardHeader>
                <CardTitle>Processing History</CardTitle>
                <CardDescription>History of paddy processing activities.</CardDescription>
            </CardHeader>
            <CardContent>
                 <div className="border rounded-lg">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Date</TableHead>
                                <TableHead>Paddy Used (Qtl)</TableHead>
                                <TableHead>Rice Yield (Qtl)</TableHead>
                                <TableHead className="text-right">Yield (%)</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {processingHistory.length === 0 ? (
                                <TableRow><TableCell colSpan={4} className="text-center h-24">No processing history.</TableCell></TableRow>
                            ) : (
                                [...processingHistory].sort((a, b) => b.date.getTime() - a.date.getTime()).map(p => (
                                    <TableRow key={p.id}>
                                        <TableCell>{format(p.date, 'dd MMM yyyy')}</TableCell>
                                        <TableCell>{formatNumber(p.paddyUsed)}</TableCell>
                                        <TableCell>{formatNumber(p.riceYield)}</TableCell>
                                        <TableCell className="text-right font-medium">{formatNumber(p.yieldPercentage)}%</TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </div>
            </CardContent>
        </Card>
      </div>
    </div>

    <Dialog open={isSaleDialogOpen} onOpenChange={setSaleDialogOpen}>
        <DialogContent>
            <DialogHeader><DialogTitle>Release Stock for Sale</DialogTitle></DialogHeader>
            <Form {...saleForm}>
                <form onSubmit={saleForm.handleSubmit(onSaleSubmit)} className="space-y-4">
                    <FormField control={saleForm.control} name="customerName" render={({ field }) => (
                        <FormItem><FormLabel>Customer Name</FormLabel><FormControl><Input placeholder="e.g., Local Retail Inc." {...field} /></FormControl><FormMessage /></FormItem>
                    )} />
                    <div className="grid grid-cols-2 gap-4">
                        <FormField control={saleForm.control} name="itemType" render={({ field }) => (
                            <FormItem><FormLabel>Item</FormLabel><Select onValueChange={field.onChange} defaultValue={field.value}><FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl><SelectContent><SelectItem value="paddy">Paddy</SelectItem><SelectItem value="rice">Rice</SelectItem></SelectContent></Select><FormMessage /></FormItem>
                        )} />
                        <FormField control={saleForm.control} name="quantity" render={({ field }) => (
                            <FormItem><FormLabel>Quantity (Qtl)</FormLabel><FormControl><Input type="number" step="0.01" {...field} /></FormControl><FormMessage /></FormItem>
                        )} />
                    </div>
                     <div className="grid grid-cols-2 gap-4">
                        <FormField control={saleForm.control} name="rate" render={({ field }) => (
                            <FormItem><FormLabel>Rate (₹ per Qtl)</FormLabel><FormControl><Input type="number" step="0.01" {...field} /></FormControl><FormMessage /></FormItem>
                        )} />
                        <FormField control={saleForm.control} name="initialPayment" render={({ field }) => (
                            <FormItem><FormLabel>Initial Payment (₹)</FormLabel><FormControl><Input type="number" step="0.01" {...field} /></FormControl><FormMessage /></FormItem>
                        )} />
                    </div>
                    <Button type="submit" className="w-full bg-accent hover:bg-accent/90">Record Sale</Button>
                </form>
            </Form>
        </DialogContent>
    </Dialog>

    <Dialog open={isProcessingDialogOpen} onOpenChange={setProcessingDialogOpen}>
        <DialogContent>
            <DialogHeader><DialogTitle>Release Paddy for Processing</DialogTitle></DialogHeader>
            <Form {...processingForm}>
                <form onSubmit={processingForm.handleSubmit(onProcessingSubmit)} className="space-y-4">
                    <FormField control={processingForm.control} name="paddyUsed" render={({ field }) => (
                        <FormItem><FormLabel>Paddy to Process (Qtl)</FormLabel><FormControl><Input type="number" step="0.01" placeholder="e.g., 100" {...field} /></FormControl><FormMessage /></FormItem>
                    )} />
                    <p className="font-medium text-sm">Enter Yields (in Quintals):</p>
                    <div className="grid grid-cols-3 gap-4">
                         <FormField control={processingForm.control} name="riceYield" render={({ field }) => (
                            <FormItem><FormLabel>Rice</FormLabel><FormControl><Input type="number" step="0.01" {...field} /></FormControl><FormMessage /></FormItem>
                        )} />
                         <FormField control={processingForm.control} name="branYield" render={({ field }) => (
                            <FormItem><FormLabel>Bran</FormLabel><FormControl><Input type="number" step="0.01" {...field} /></FormControl><FormMessage /></FormItem>
                        )} />
                         <FormField control={processingForm.control} name="brokenRiceYield" render={({ field }) => (
                            <FormItem><FormLabel>Broken Rice</FormLabel><FormControl><Input type="number" step="0.01" {...field} /></FormControl><FormMessage /></FormItem>
                        )} />
                    </div>
                    <Button type="submit" className="w-full bg-accent hover:bg-accent/90">Record Processing</Button>
                </form>
            </Form>
        </DialogContent>
    </Dialog>

    </>
  );
}
