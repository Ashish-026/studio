'use client';

import React, { useState, useMemo, useEffect } from 'react';
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';

const labourDetailsSchema = z.object({
  numberOfLabours: z.coerce.number().min(0).default(0),
  labourerIds: z.array(z.object({ value: z.string() })).default([]),
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
    defaultValues: { 
      paddyUsed: 0, 
      riceYield: 0, 
      branYield: 0, 
      brokenRiceYield: 0, 
      numberOfLabours: 0, 
      labourerIds: [], 
      labourCharge: 0, 
      labourWageType: 'total_amount' 
    }
  });
  
  const { fields, replace } = useFieldArray({
    control: processingForm.control,
    name: "labourerIds"
  });

  const numberOfLabours = processingForm.watch('numberOfLabours');
  const selectedLabourerIds = (processingForm.watch('labourerIds') || []).map(l => l.value);

  useEffect(() => {
    const targetCount = Math.max(0, parseInt(String(numberOfLabours || 0)));
    const currentValues = processingForm.getValues('labourerIds') || [];
    if (fields.length !== targetCount) {
      const nextFields = Array.from({ length: targetCount }, (_, i) => currentValues[i] || { value: '' });
      replace(nextFields);
    }
  }, [numberOfLabours, replace, processingForm, fields.length]);


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
    <div className="space-y-6">
      <Card className="border-none shadow-none bg-transparent">
          <CardHeader className="px-0 pt-0">
            <div className="flex justify-between items-start">
              <div>
                <CardTitle className="text-2xl font-bold font-headline text-primary">Paddy Processing</CardTitle>
                <CardDescription>Convert procurement stock into rice and byproducts.</CardDescription>
              </div>
              <Button onClick={() => setShowForm(!showForm)} size="sm" className="rounded-xl shadow-md">
                <PlusCircle className="mr-2 h-4 w-4" />
                {showForm ? 'Cancel' : 'New Entry'}
              </Button>
            </div>
            <div className="pt-2">
              <Badge variant="secondary" className="rounded-lg px-3 py-1 bg-primary/10 text-primary border-none">
                  Available for Processing: {formatNumber(availablePaddy)} Qtl
              </Badge>
          </div>
          </CardHeader>
          <CardContent className="px-0 space-y-6">
          {showForm && (
              <Card className="bg-white border-primary/10 shadow-2xl rounded-3xl overflow-hidden animate-in fade-in slide-in-from-top-4 duration-300">
                <CardHeader className="bg-primary/5 border-b border-primary/10">
                  <CardTitle className="text-lg">New Processing Record</CardTitle>
                </CardHeader>
                <CardContent className="pt-6">
                  <Form {...processingForm}>
                    <form onSubmit={processingForm.handleSubmit(onProcessingSubmit)} className="space-y-6">
                        <FormField control={processingForm.control} name="paddyUsed" render={({ field }) => (
                            <FormItem><FormLabel>Paddy to Process (Qtl)</FormLabel><FormControl><Input type="number" step="0.01" {...field} className="rounded-xl h-12" /></FormControl><FormMessage /></FormItem>
                        )} />
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                             <FormField control={processingForm.control} name="riceYield" render={({ field }) => (
                                <FormItem><FormLabel>Rice Yield</FormLabel><FormControl><Input type="number" step="0.01" {...field} className="rounded-xl" /></FormControl><FormMessage /></FormItem>
                            )} />
                             <FormField control={processingForm.control} name="branYield" render={({ field }) => (
                                <FormItem><FormLabel>Bran</FormLabel><FormControl><Input type="number" step="0.01" {...field} className="rounded-xl" /></FormControl><FormMessage /></FormItem>
                            )} />
                             <FormField control={processingForm.control} name="brokenRiceYield" render={({ field }) => (
                                <FormItem><FormLabel>Broken Rice</FormLabel><FormControl><Input type="number" step="0.01" {...field} className="rounded-xl" /></FormControl><FormMessage /></FormItem>
                            )} />
                        </div>

                        <Separator className="opacity-50" />

                        <div className="space-y-6">
                          <h3 className="text-md font-bold flex items-center gap-2 text-primary opacity-80"><Users className="h-5 w-5" /> Labour Selection</h3>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                              <FormField control={processingForm.control} name="numberOfLabours" render={({ field }) => (
                                  <FormItem><FormLabel>Number of Workers</FormLabel><FormControl><Input type="number" {...field} className="rounded-xl" /></FormControl></FormItem>
                              )} />
                              <FormField control={processingForm.control} name="labourCharge" render={({ field }) => (
                                  <FormItem><FormLabel>Total Processing Wage (₹)</FormLabel><FormControl><Input type="number" step="10" {...field} className="rounded-xl" /></FormControl></FormItem>
                              )} />
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                              {fields.map((field, index) => (
                                 <FormField
                                  key={field.id}
                                  control={processingForm.control}
                                  name={`labourerIds.${index}.value`}
                                  render={({ field }) => (
                                      <FormItem>
                                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                                          <FormControl><SelectTrigger className="rounded-xl"><SelectValue placeholder="Select worker..." /></SelectTrigger></FormControl>
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
                        </div>
                        <Button type="submit" className="w-full bg-primary hover:bg-primary/90 h-14 rounded-2xl font-bold text-lg shadow-xl shadow-primary/20">Record Processing</Button>
                    </form>
                  </Form>
                </CardContent>
              </Card>
          )}
          
          <div className="bg-white border border-primary/5 rounded-3xl overflow-hidden shadow-sm">
              <div className="p-6 border-b border-primary/5 bg-primary/5">
                  <h3 className="text-lg font-bold text-primary uppercase tracking-widest">Processing History</h3>
              </div>
              <Table>
                  <TableHeader className="bg-muted/30">
                      <TableRow className="border-none">
                          <TableHead className="font-bold py-4 pl-6">Date</TableHead>
                          <TableHead className="text-right font-bold py-4">Paddy Used (Qtl)</TableHead>
                          <TableHead className="text-right font-bold py-4">Rice Yield (Qtl)</TableHead>
                          <TableHead className="text-right font-bold py-4 pr-6">Yield (%)</TableHead>
                      </TableRow>
                  </TableHeader>
                  <TableBody>
                      {(processingHistory || []).length === 0 ? (
                          <TableRow><TableCell colSpan={4} className="text-center h-32 opacity-50 italic">No processing records found.</TableCell></TableRow>
                      ) : (
                          [...processingHistory].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).map(p => (
                              <TableRow key={p.id} className="hover:bg-primary/5 transition-colors">
                                  <TableCell className="pl-6">{format(new Date(p.date), 'dd MMM yyyy')}</TableCell>
                                  <TableCell className="text-right font-medium">{formatNumber(p.paddyUsed)}</TableCell>
                                  <TableCell className="text-right font-bold text-primary">{formatNumber(p.riceYield)}</TableCell>
                                  <TableCell className="text-right pr-6 font-black text-primary">{formatNumber(p.yieldPercentage)}%</TableCell>
                              </TableRow>
                          ))
                      )}
                  </TableBody>
              </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}