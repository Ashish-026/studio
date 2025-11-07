'use client';

import { useState, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useMandiData } from '@/context/mandi-context';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { format } from 'date-fns';
import { PlusCircle } from 'lucide-react';

const processingSchema = z.object({
    paddyUsed: z.coerce.number().positive('Paddy quantity must be positive'),
    riceYield: z.coerce.number().positive('Rice yield must be positive'),
    branYield: z.coerce.number().min(0, 'Cannot be negative'),
    brokenRiceYield: z.coerce.number().min(0, 'Cannot be negative'),
});

export function MandiProcessing() {
  const { paddyLiftedItems, processingHistory, addProcessing } = useMandiData();
  const { toast } = useToast();
  const [showForm, setShowForm] = useState(false);

  const processingForm = useForm<z.infer<typeof processingSchema>>({
    resolver: zodResolver(processingSchema),
    defaultValues: { paddyUsed: 0, riceYield: 0, branYield: 0, brokenRiceYield: 0 }
  });

  const availablePaddy = useMemo(() => {
    const totalLifted = paddyLiftedItems.reduce((sum, item) => sum + item.totalPaddyReceived, 0);
    const totalUsed = processingHistory.reduce((sum, item) => sum + item.paddyUsed, 0);
    return totalLifted - totalUsed;
  }, [paddyLiftedItems, processingHistory]);

  const formatNumber = (num: number) => new Intl.NumberFormat('en-IN', { maximumFractionDigits: 2 }).format(num);

  function onProcessingSubmit(values: z.infer<typeof processingSchema>) {
    if(values.paddyUsed > availablePaddy) {
        processingForm.setError('paddyUsed', { message: `Exceeds available paddy stock of ${formatNumber(availablePaddy)} Qtl` });
        return;
    }
    addProcessing(values);
    toast({ title: 'Success!', description: 'Processing has been recorded and stock updated.' });
    processingForm.reset();
    setShowForm(false);
  }

  return (
    <Card>
        <CardHeader>
          <div className="flex justify-between items-start">
            <div>
              <CardTitle>Paddy Processing</CardTitle>
              <CardDescription>Record paddy processing activities and view history.</CardDescription>
            </div>
            <Button onClick={() => setShowForm(!showForm)} size="sm">
              <PlusCircle className="mr-2 h-4 w-4" />
              {showForm ? 'Cancel' : 'Add Processing Entry'}
            </Button>
          </div>
          <div className="pt-2">
            <p className="text-sm font-medium">
                Available Paddy for Processing: 
                <span className="text-primary font-bold"> {formatNumber(availablePaddy)} Qtl</span>
            </p>
        </div>
        </CardHeader>
        <CardContent className="space-y-6">
        {showForm && (
            <Card className="bg-muted/50">
              <CardHeader>
                <CardTitle>New Processing Entry</CardTitle>
                <CardDescription>Convert paddy into rice and other byproducts.</CardDescription>
              </CardHeader>
              <CardContent>
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
              </CardContent>
            </Card>
        )}
        
        <div>
            <h3 className="text-lg font-semibold mb-2">Processing History</h3>
             <div className="border rounded-lg">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Date</TableHead>
                            <TableHead>Paddy Used (Qtl)</TableHead>
                            <TableHead>Rice Yield (Qtl)</TableHead>
                            <TableHead>Bran Yield (Qtl)</TableHead>
                            <TableHead>Broken Rice (Qtl)</TableHead>
                            <TableHead className="text-right">Yield (%)</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {processingHistory.length === 0 ? (
                            <TableRow><TableCell colSpan={6} className="text-center h-24">No processing history.</TableCell></TableRow>
                        ) : (
                            [...processingHistory].sort((a, b) => b.date.getTime() - a.date.getTime()).map(p => (
                                <TableRow key={p.id}>
                                    <TableCell>{format(p.date, 'dd MMM yyyy')}</TableCell>
                                    <TableCell>{formatNumber(p.paddyUsed)}</TableCell>
                                    <TableCell>{formatNumber(p.riceYield)}</TableCell>
                                    <TableCell>{formatNumber(p.branYield)}</TableCell>
                                    <TableCell>{formatNumber(p.brokenRiceYield)}</TableCell>
                                    <TableCell className="text-right font-medium">{formatNumber(p.yieldPercentage)}%</TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>
        </div>
      </CardContent>
    </Card>
  );
}
