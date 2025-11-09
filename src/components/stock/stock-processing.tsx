'use client';

import { useState, useMemo } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useStockData } from '@/context/stock-context';
import { useLabourData } from '@/context/labour-context';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { format } from 'date-fns';
import { PlusCircle, Users } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Separator } from '../ui/separator';

const labourDetailsSchema = z.object({
  numberOfLabours: z.coerce.number().min(0).default(0),
  labourerIds: z.array(z.object({ value: z.string().min(1, "Please select a labourer.") })).default([]),
  labourWageType: z.enum(['per_item', 'total_amount']).default('total_amount'),
  labourCharge: z.coerce.number().min(0).default(0),
});

const paddyProcessingSchema = z.object({
    source: z.enum(['private'], { required_error: 'Stock source is required' }),
    paddyUsed: z.coerce.number().positive('Paddy quantity must be positive'),
    riceYield: z.coerce.number().positive('Rice yield must be positive'),
    branYield: z.coerce.number().min(0, 'Cannot be negative'),
    brokenRiceYield: z.coerce.number().min(0, 'Cannot be negative'),
}).merge(labourDetailsSchema);

const riceProcessingSchema = z.object({
    source: z.enum(['private'], { required_error: 'Stock source is required' }),
    riceUsed: z.coerce.number().positive('Rice quantity must be positive'),
    finalRiceYield: z.coerce.number().positive('Final rice yield must be positive'),
    brokenRiceYield: z.coerce.number().min(0, 'Cannot be negative'),
}).merge(labourDetailsSchema);

export function StockProcessing() {
  const { privateStock, processingHistory, addProcessingResult } = useStockData();
  const { labourers, addGroupWorkEntry } = useLabourData();
  const { toast } = useToast();
  const [showForm, setShowForm] = useState(false);

  const paddyProcessingForm = useForm<z.infer<typeof paddyProcessingSchema>>({
    resolver: zodResolver(paddyProcessingSchema),
    defaultValues: { source: 'private', paddyUsed: 0, riceYield: 0, branYield: 0, brokenRiceYield: 0, numberOfLabours: 0, labourerIds: [], labourCharge: 0, labourWageType: 'total_amount' }
  });

  const riceProcessingForm = useForm<z.infer<typeof riceProcessingSchema>>({
    resolver: zodResolver(riceProcessingSchema),
    defaultValues: { source: 'private', riceUsed: 0, finalRiceYield: 0, brokenRiceYield: 0, numberOfLabours: 0, labourerIds: [], labourCharge: 0, labourWageType: 'total_amount' }
  });

  const { fields: paddyFields, append: paddyAppend, remove: paddyRemove } = useFieldArray({ control: paddyProcessingForm.control, name: "labourerIds" });
  const { fields: riceFields, append: riceAppend, remove: riceRemove } = useFieldArray({ control: riceProcessingForm.control, name: "labourerIds" });
  
  const paddyNumberOfLabours = paddyProcessingForm.watch('numberOfLabours');
  const selectedPaddyLabourerIds = paddyProcessingForm.watch('labourerIds').map(l => l.value);
  
  const riceNumberOfLabours = riceProcessingForm.watch('numberOfLabours');
  const selectedRiceLabourerIds = riceProcessingForm.watch('labourerIds').map(l => l.value);

  useMemo(() => {
    const currentCount = paddyFields.length;
    if (paddyNumberOfLabours > currentCount) {
        for(let i = currentCount; i < paddyNumberOfLabours; i++) paddyAppend({ value: '' });
    } else if (paddyNumberOfLabours < currentCount) {
        for(let i = currentCount; i > paddyNumberOfLabours; i--) paddyRemove(i-1);
    }
  }, [paddyNumberOfLabours, paddyFields.length, paddyAppend, paddyRemove]);

  useMemo(() => {
    const currentCount = riceFields.length;
    if (riceNumberOfLabours > currentCount) {
        for(let i = currentCount; i < riceNumberOfLabours; i++) riceAppend({ value: '' });
    } else if (riceNumberOfLabours < currentCount) {
        for(let i = currentCount; i > riceNumberOfLabours; i--) riceRemove(i-1);
    }
  }, [riceNumberOfLabours, riceFields.length, riceAppend, riceRemove]);

  const formatNumber = (num: number) => new Intl.NumberFormat('en-IN', { maximumFractionDigits: 2 }).format(num);

  function onPaddyProcessingSubmit(values: z.infer<typeof paddyProcessingSchema>) {
    const stockSource = privateStock;
    if(values.paddyUsed > stockSource.paddy) {
        paddyProcessingForm.setError('paddyUsed', { message: `Exceeds available paddy stock of ${formatNumber(stockSource.paddy)} Qtl from ${values.source}` });
        return;
    }

    const labourerIds = values.labourerIds.map(l => l.value).filter(Boolean);
    const submissionValues = { ...values, labourerIds };

    addProcessingResult({ ...submissionValues, type: 'paddy' });
    toast({ title: 'Success!', description: 'Paddy processing has been recorded and stock updated.' });

    if (labourerIds.length > 0 && submissionValues.labourCharge > 0) {
        addGroupWorkEntry(labourerIds, submissionValues.labourCharge, `Private stock processing (Paddy)`, submissionValues.paddyUsed);
        toast({ title: 'Labour Updated', description: 'Work entry added to Labour Register.' });
    }

    paddyProcessingForm.reset();
    setShowForm(false);
  }

  function onRiceProcessingSubmit(values: z.infer<typeof riceProcessingSchema>) {
    const stockSource = privateStock;
    if (values.riceUsed > stockSource.rice) {
        riceProcessingForm.setError('riceUsed', { message: `Exceeds available rice stock of ${formatNumber(stockSource.rice)} Qtl from ${values.source}` });
        return;
    }

    const labourerIds = values.labourerIds.map(l => l.value).filter(Boolean);
    const submissionValues = { ...values, labourerIds };

    addProcessingResult({ 
        ...submissionValues, 
        type: 'rice',
        paddyUsed: 0,
        riceYield: values.finalRiceYield,
        branYield: 0,
     });
    toast({ title: 'Success!', description: 'Rice processing has been recorded and stock updated.' });

    if (labourerIds.length > 0 && submissionValues.labourCharge > 0) {
        addGroupWorkEntry(labourerIds, submissionValues.labourCharge, 'Private stock processing (Rice)', submissionValues.riceUsed);
        toast({ title: 'Labour Updated', description: 'Work entry added to Labour Register.' });
    }

    riceProcessingForm.reset();
    setShowForm(false);
  }

  return (
    <Card>
        <CardHeader>
          <div className="flex justify-between items-start">
            <div>
              <CardTitle>Stock Processing</CardTitle>
              <CardDescription>Record processing activities and view history.</CardDescription>
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
                <CardDescription>Convert stock into other products.</CardDescription>
              </CardHeader>
              <CardContent>
                <Tabs defaultValue="paddy">
                    <TabsList className="grid w-full grid-cols-2">
                        <TabsTrigger value="paddy">Paddy Processing</TabsTrigger>
                        <TabsTrigger value="rice">Rice Processing</TabsTrigger>
                    </TabsList>
                    <TabsContent value="paddy" className="pt-4">
                        <Form {...paddyProcessingForm}>
                        <form onSubmit={paddyProcessingForm.handleSubmit(onPaddyProcessingSubmit)} className="space-y-6">
                            <FormField control={paddyProcessingForm.control} name="source" render={({ field }) => (
                                <FormItem><FormLabel>Stock Source</FormLabel><Select onValueChange={field.onChange} defaultValue={field.value}><FormControl><SelectTrigger><SelectValue placeholder="Select a source..." /></SelectTrigger></FormControl><SelectContent><SelectItem value="private">Private</SelectItem></SelectContent></Select><FormMessage /></FormItem>
                            )} />
                            <FormField control={paddyProcessingForm.control} name="paddyUsed" render={({ field }) => (
                                <FormItem><FormLabel>Paddy to Process (Qtl)</FormLabel><FormControl><Input type="number" step="0.01" placeholder="e.g., 100" {...field} /></FormControl><FormMessage /></FormItem>
                            )} />
                            <p className="font-medium text-sm">Enter Yields (in Quintals):</p>
                            <div className="grid grid-cols-3 gap-4">
                                <FormField control={paddyProcessingForm.control} name="riceYield" render={({ field }) => (
                                    <FormItem><FormLabel>Rice</FormLabel><FormControl><Input type="number" step="0.01" {...field} /></FormControl><FormMessage /></FormItem>
                                )} />
                                <FormField control={paddyProcessingForm.control} name="branYield" render={({ field }) => (
                                    <FormItem><FormLabel>Bran</FormLabel><FormControl><Input type="number" step="0.01" {...field} /></FormControl><FormMessage /></FormItem>
                                )} />
                                <FormField control={paddyProcessingForm.control} name="brokenRiceYield" render={({ field }) => (
                                    <FormItem><FormLabel>Broken Rice</FormLabel><FormControl><Input type="number" step="0.01" {...field} /></FormControl><FormMessage /></FormItem>
                                )} />
                            </div>

                            <Separator />

                            <div>
                                <h3 className="text-md font-medium mb-4 flex items-center gap-2"><Users className="h-5 w-5" /> Labour Details</h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <FormField control={paddyProcessingForm.control} name="numberOfLabours" render={({ field }) => (
                                        <FormItem><FormLabel>Number of Labours</FormLabel><FormControl><Input type="number" {...field} /></FormControl><FormMessage /></FormItem>
                                    )} />
                                    <FormField control={paddyProcessingForm.control} name="labourCharge" render={({ field }) => (
                                        <FormItem><FormLabel>Total Labour Charge (₹)</FormLabel><FormControl><Input type="number" step="10" placeholder="e.g., 500" {...field} /></FormControl><FormMessage /></FormItem>
                                    )} />
                                </div>
                                {paddyFields.map((field, index) => (
                                <FormField
                                    key={field.id}
                                    control={paddyProcessingForm.control}
                                    name={`labourerIds.${index}.value`}
                                    render={({ field }) => (
                                        <FormItem className="mt-4">
                                        <FormLabel>Labourer {index + 1}</FormLabel>
                                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                                            <FormControl><SelectTrigger><SelectValue placeholder="Select a labourer" /></SelectTrigger></FormControl>
                                            <SelectContent>
                                                <SelectItem value="none">None</SelectItem>
                                                {labourers
                                                    .filter(l => !selectedPaddyLabourerIds.includes(l.id) || l.id === field.value)
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
                            <Button type="submit" className="w-full bg-accent hover:bg-accent/90">Record Paddy Processing</Button>
                        </form>
                        </Form>
                    </TabsContent>
                    <TabsContent value="rice" className="pt-4">
                        <Form {...riceProcessingForm}>
                        <form onSubmit={riceProcessingForm.handleSubmit(onRiceProcessingSubmit)} className="space-y-6">
                            <FormField control={riceProcessingForm.control} name="source" render={({ field }) => (
                                <FormItem><FormLabel>Stock Source</FormLabel><Select onValueChange={field.onChange} defaultValue={field.value}><FormControl><SelectTrigger><SelectValue placeholder="Select a source..." /></SelectTrigger></FormControl><SelectContent><SelectItem value="private">Private</SelectItem></SelectContent></Select><FormMessage /></FormItem>
                            )} />
                            <FormField control={riceProcessingForm.control} name="riceUsed" render={({ field }) => (
                                <FormItem><FormLabel>Rice to Re-process (Qtl)</FormLabel><FormControl><Input type="number" step="0.01" placeholder="e.g., 50" {...field} /></FormControl><FormMessage /></FormItem>
                            )} />
                            <p className="font-medium text-sm">Enter Yields (in Quintals):</p>
                            <div className="grid grid-cols-2 gap-4">
                                <FormField control={riceProcessingForm.control} name="finalRiceYield" render={({ field }) => (
                                    <FormItem><FormLabel>Final Rice</FormLabel><FormControl><Input type="number" step="0.01" {...field} /></FormControl><FormMessage /></FormItem>
                                )} />
                                <FormField control={riceProcessingForm.control} name="brokenRiceYield" render={({ field }) => (
                                    <FormItem><FormLabel>Broken Rice</FormLabel><FormControl><Input type="number" step="0.01" {...field} /></FormControl><FormMessage /></FormItem>
                                )} />
                            </div>

                            <Separator />
                            
                            <div>
                                <h3 className="text-md font-medium mb-4 flex items-center gap-2"><Users className="h-5 w-5" /> Labour Details</h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <FormField control={riceProcessingForm.control} name="numberOfLabours" render={({ field }) => (
                                        <FormItem><FormLabel>Number of Labours</FormLabel><FormControl><Input type="number" {...field} /></FormControl><FormMessage /></FormItem>
                                    )} />
                                    <FormField control={riceProcessingForm.control} name="labourCharge" render={({ field }) => (
                                        <FormItem><FormLabel>Total Labour Charge (₹)</FormLabel><FormControl><Input type="number" step="10" placeholder="e.g., 300" {...field} /></FormControl><FormMessage /></FormItem>
                                    )} />
                                </div>
                                {riceFields.map((field, index) => (
                                    <FormField
                                        key={field.id}
                                        control={riceProcessingForm.control}
                                        name={`labourerIds.${index}.value`}
                                        render={({ field }) => (
                                            <FormItem className="mt-4">
                                            <FormLabel>Labourer {index + 1}</FormLabel>
                                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                                                <FormControl><SelectTrigger><SelectValue placeholder="Select a labourer" /></SelectTrigger></FormControl>
                                                <SelectContent>
                                                    <SelectItem value="none">None</SelectItem>
                                                    {labourers
                                                        .filter(l => !selectedRiceLabourerIds.includes(l.id) || l.id === field.value)
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
                            <Button type="submit" className="w-full bg-accent hover:bg-accent/90">Record Rice Processing</Button>
                        </form>
                        </Form>
                    </TabsContent>
                </Tabs>
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
                            <TableHead>Type</TableHead>
                            <TableHead>Source</TableHead>
                            <TableHead>Input Used (Qtl)</TableHead>
                            <TableHead>Rice Yield (Qtl)</TableHead>
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
                                    <TableCell className='capitalize'>{p.type || 'paddy'}</TableCell>
                                    <TableCell className='capitalize'>{p.source}</TableCell>
                                    <TableCell>
                                        {p.type === 'rice' ? `${formatNumber(p.riceUsed || 0)} (Rice)` : `${formatNumber(p.paddyUsed)} (Paddy)`}
                                    </TableCell>
                                    <TableCell>{formatNumber(p.riceYield)}</TableCell>
                                    <TableCell className="text-right font-medium">{p.type !== 'rice' ? `${formatNumber(p.yieldPercentage)}%` : '-'}</TableCell>
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
