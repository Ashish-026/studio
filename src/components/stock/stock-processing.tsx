'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useStockData } from '@/context/stock-context';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { format } from 'date-fns';
import { PlusCircle } from 'lucide-react';

const processingSchema = z.object({
    source: z.enum(['oscsc', 'private'], { required_error: 'Stock source is required' }),
    paddyUsed: z.coerce.number().positive('Paddy quantity must be positive'),
    riceYield: z.coerce.number().positive('Rice yield must be positive'),
    branYield: z.coerce.number().min(0, 'Cannot be negative'),
    brokenRiceYield: z.coerce.number().min(0, 'Cannot be negative'),
});

export function StockProcessing() {
  const { oscscStock, privateStock, processingHistory, addProcessingResult } = useStockData();
  const { toast } = useToast();
  const [showForm, setShowForm] = useState(false);

  const processingForm = useForm<z.infer<typeof processingSchema>>({
    resolver: zodResolver(processingSchema),
  });

  const formatNumber = (num: number) => new Intl.NumberFormat('en-IN', { maximumFractionDigits: 2 }).format(num);

  function onProcessingSubmit(values: z.infer<typeof processingSchema>) {
    const stockSource = values.source === 'oscsc' ? oscscStock : privateStock;
    if(values.paddyUsed > stockSource.paddy) {
        processingForm.setError('paddyUsed', { message: `Exceeds available paddy stock of ${formatNumber(stockSource.paddy)} Qtl from ${values.source}` });
        return;
    }
    addProcessingResult(values);
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
                       <FormField control={processingForm.control} name="source" render={({ field }) => (
                          <FormItem><FormLabel>Stock Source</FormLabel><Select onValueChange={field.onChange} defaultValue={field.value}><FormControl><SelectTrigger><SelectValue placeholder="Select a source..." /></SelectTrigger></FormControl><SelectContent><SelectItem value="oscsc">OSCSC</SelectItem><SelectItem value="private">Private</SelectItem></SelectContent></Select><FormMessage /></FormItem>
                      )} />
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
                            <TableHead>Source</TableHead>
                            <TableHead>Paddy Used (Qtl)</TableHead>
                            <TableHead>Rice Yield (Qtl)</TableHead>
                            <TableHead className="text-right">Yield (%)</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {processingHistory.length === 0 ? (
                            <TableRow><TableCell colSpan={5} className="text-center h-24">No processing history.</TableCell></TableRow>
                        ) : (
                            [...processingHistory].sort((a, b) => b.date.getTime() - a.date.getTime()).map(p => (
                                <TableRow key={p.id}>
                                    <TableCell>{format(p.date, 'dd MMM yyyy')}</TableCell>
                                    <TableCell className='capitalize'>{p.source}</TableCell>
                                    <TableCell>{formatNumber(p.paddyUsed)}</TableCell>
                                    <TableCell>{formatNumber(p.riceYield)}</TableCell>
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
