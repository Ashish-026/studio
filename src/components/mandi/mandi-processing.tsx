
'use client';

import { useState, useMemo, useEffect } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useMandiData } from '@/context/mandi-context';
import { useLabourData } from '@/context/labour-context';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { format } from 'date-fns';
import { PlusCircle, Users } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Separator } from '../ui/separator';

const labourDetailsSchema = z.object({
  numberOfLabours: z.coerce.number().min(0).default(0),
  labourerIds: z.array(z.object({ value: z.string().min(1, "Please select a labourer.") })).default([]),
  labourWageType: z.enum(['per_item', 'total_amount']).default('total_amount'),
  labourCharge: z.coerce.number().min(0).default(0),
});

const processingSchema = z.object({
    paddyUsed: z.coerce.number().positive('Paddy quantity must be positive'),
    riceYield: z.coerce.number().positive('Rice yield must be positive'),
    branYield: z.coerce.number().min(0, 'Cannot be negative'),
    brokenRiceYield: z.coerce.number().min(0, 'Cannot be negative'),
}).merge(labourDetailsSchema);

export function MandiProcessing() {
  const { paddyLiftedItems, processingHistory, addMandiProcessing } = useMandiData();
  const { labourers, addGroupWorkEntry } = useLabourData();
  const { toast } = useToast();
  const [showForm, setShowForm] = useState(false);

  const processingForm = useForm<z.infer<typeof processingSchema>>({
    resolver: zodResolver(processingSchema),
    defaultValues: { paddyUsed: 0, riceYield: 0, branYield: 0, brokenRiceYield: 0, numberOfLabours: 0, labourerIds: [], labourCharge: 0, labourWageType: 'total_amount' }
  });
  
  const { fields, append, remove } = useFieldArray({
    control: processingForm.control,
    name: "labourerIds"
  });

  const numberOfLabours = processingForm.watch('numberOfLabours');
  const selectedLabourerIds = processingForm.watch('labourerIds').map(l => l.value);

  // HARDENED FIELD MANAGEMENT: Uses a single processing step to prevent infinite loops
  useEffect(() => {
    const targetCount = parseInt(String(numberOfLabours || 0));
    const currentCount = fields.length;
    
    if (targetCount === currentCount) return;

    if (targetCount > currentCount) {
      const diff = targetCount - currentCount;
      for (let i = 0; i < diff; i++) {
        append({ value: '' });
      }
    } else {
      const diff = currentCount - targetCount;
      for (let i = 0; i < diff; i++) {
        remove(currentCount - 1 - i);
      }
    }
  }, [numberOfLabours, fields.length, append, remove]);


  const availablePaddy = useMemo(() => {
    const totalLifted = (paddyLiftedItems || []).reduce((sum, item) => sum + (Number(item.totalPaddyReceived) || 0), 0);
    const totalUsed = (processingHistory || []).reduce((sum, item) => sum + (Number(item.paddyUsed) || 0), 0);
    return totalLifted - totalUsed;
  }, [paddyLiftedItems, processingHistory]);

  const formatNumber = (num: number) => new Intl.NumberFormat('en-IN', { maximumFractionDigits: 2 }).format(num);

  function onProcessingSubmit(values: z.infer<typeof processingSchema>) {
    if(values.paddyUsed > availablePaddy) {
        processingForm.setError('paddyUsed', { message: `Exceeds available paddy stock of ${formatNumber(availablePaddy)} Qtl` });
        return;
    }
    
    const labourerIds = values.labourerIds.map(l => l.value).filter(Boolean);
    const submissionValues = { ...values, labourerIds };

    addMandiProcessing(submissionValues);
    toast({ title: 'Success!', description: 'Processing has been recorded.' });

    if (labourerIds.length > 0 && values.labourCharge > 0) {
        addGroupWorkEntry(labourerIds, values.labourCharge, 'Mandi paddy processing', values.paddyUsed);
    }

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
              </CardHeader>
              <CardContent>
                <Form {...processingForm}>
                  <form onSubmit={processingForm.handleSubmit(onProcessingSubmit)} className="space-y-6">
                      <FormField control={processingForm.control} name="paddyUsed" render={({ field }) => (
                          <FormItem><FormLabel>Paddy to Process (Qtl)</FormLabel><FormControl><Input type="number" step="0.01" {...field} onFocus={(e) => e.target.select()} /></FormControl><FormMessage /></FormItem>
                      )} />
                      <div className="grid grid-cols-3 gap-4">
                           <FormField control={processingForm.control} name="riceYield" render={({ field }) => (
                              <FormItem><FormLabel>Rice Yield</FormLabel><FormControl><Input type="number" step="0.01" {...field} onFocus={(e) => e.target.select()} /></FormControl><FormMessage /></FormItem>
                          )} />
                           <FormField control={processingForm.control} name="branYield" render={({ field }) => (
                              <FormItem><FormLabel>Bran</FormLabel><FormControl><Input type="number" step="0.01" {...field} onFocus={(e) => e.target.select()} /></FormControl><FormMessage /></FormItem>
                          )} />
                           <FormField control={processingForm.control} name="brokenRiceYield" render={({ field }) => (
                              <FormItem><FormLabel>Broken Rice</FormLabel><FormControl><Input type="number" step="0.01" {...field} onFocus={(e) => e.target.select()} /></FormControl><FormMessage /></FormItem>
                          )} />
                      </div>

                      <Separator />

                      <div>
                        <h3 className="text-md font-medium mb-4 flex items-center gap-2"><Users className="h-5 w-5" /> Labour Details</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <FormField control={processingForm.control} name="numberOfLabours" render={({ field }) => (
                                <FormItem><FormLabel>Number of Labours</FormLabel><FormControl><Input type="number" {...field} onFocus={(e) => e.target.select()} /></FormControl><FormMessage /></FormItem>
                            )} />
                            <FormField control={processingForm.control} name="labourCharge" render={({ field }) => (
                                <FormItem><FormLabel>Total Labour Charge (₹)</FormLabel><FormControl><Input type="number" step="10" {...field} onFocus={(e) => e.target.select()} /></FormControl><FormMessage /></FormItem>
                            )} />
                        </div>
                        {fields.map((field, index) => (
                           <FormField
                            key={field.id}
                            control={processingForm.control}
                            name={`labourerIds.${index}.value`}
                            render={({ field }) => (
                                <FormItem className="mt-4">
                                <FormLabel>Labourer {index + 1}</FormLabel>
                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                    <FormControl><SelectTrigger><SelectValue placeholder="Select a labourer" /></SelectTrigger></FormControl>
                                    <SelectContent>
                                    {(labourers || [])
                                        .filter(l => !selectedLabourerIds.includes(l.id) || l.id === field.value)
                                        .map((l) => (
                                        <SelectItem key={l.id} value={l.id}>{l.name}</SelectItem>
                                    ))}
                                    </SelectContent>
                                </Select>
                                <FormMessage />
                                </FormItem>
                            )}
                            />
                        ))}
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
                            <TableHead className="text-right">Yield (%)</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {(processingHistory || []).length === 0 ? (
                            <TableRow><TableCell colSpan={4} className="text-center h-24">No processing history.</TableCell></TableRow>
                        ) : (
                            [...processingHistory].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).map(p => (
                                <TableRow key={p.id}>
                                    <TableCell>{format(new Date(p.date), 'dd MMM yyyy')}</TableCell>
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
