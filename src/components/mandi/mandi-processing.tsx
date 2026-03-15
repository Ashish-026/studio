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
    defaultValues: { paddyUsed: 0, riceYield: 0, branYield: 0, brokenRiceYield: 0, numberOfLabours: 0, labourerIds: [], labourCharge: 0, labourWageType: 'total_amount' }
  });
  
  const { fields, replace } = useFieldArray({ control: processingForm.control, name: "labourerIds" });
  const numberOfLabours = processingForm.watch('numberOfLabours');

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

  function onProcessingSubmit(values: z.infer<typeof processingSchema>) {
    if(values.paddyUsed > availablePaddy) {
        toast({ title: "Insufficient Stock", variant: "destructive" });
        return;
    }
    const lIds = values.labourerIds.map(l => l.value).filter(Boolean);
    addMandiProcessing({ ...values, labourerIds: lIds });
    if (lIds.length > 0 && values.labourCharge > 0) addGroupWorkEntry(lIds, values.labourCharge, 'Mandi processing', values.paddyUsed);
    processingForm.reset();
    setShowForm(false);
  }

  return (
    <div className="space-y-6">
      <Card className="border-none shadow-none bg-transparent">
          <CardHeader className="px-0 pt-0">
            <div className="flex justify-between items-start">
              <div><CardTitle className="text-2xl font-bold text-primary">Paddy Processing</CardTitle></div>
              <Button onClick={() => setShowForm(!showForm)} size="sm" className="rounded-xl shadow-md"><PlusCircle className="mr-2 h-4 w-4" />{showForm ? 'Cancel' : 'New Entry'}</Button>
            </div>
            <div className="pt-2"><Badge variant="secondary" className="rounded-lg bg-primary/10 text-primary">Available: {availablePaddy.toFixed(2)} Qtl</Badge></div>
          </CardHeader>
          <CardContent className="px-0 space-y-6">
          {showForm && (
              <Card className="bg-white border-primary/10 shadow-2xl rounded-3xl overflow-hidden">
                <CardHeader className="bg-primary/5 border-b border-primary/10"><CardTitle className="text-lg">New Record</CardTitle></CardHeader>
                <CardContent className="pt-6">
                  <Form {...processingForm}><form onSubmit={processingForm.handleSubmit(onProcessingSubmit)} className="space-y-6">
                        <FormField control={processingForm.control} name="paddyUsed" render={({ field }) => (<FormItem><FormLabel>Paddy Used (Qtl)</FormLabel><FormControl><Input type="number" step="0.01" {...field} className="rounded-xl h-12" /></FormControl></FormItem>)} />
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                             <FormField control={processingForm.control} name="riceYield" render={({ field }) => (<FormItem><FormLabel>Rice Yield</FormLabel><FormControl><Input type="number" step="0.01" {...field} className="rounded-xl" /></FormControl></FormItem>)} />
                             <FormField control={processingForm.control} name="branYield" render={({ field }) => (<FormItem><FormLabel>Bran</FormLabel><FormControl><Input type="number" step="0.01" {...field} className="rounded-xl" /></FormControl></FormItem>)} />
                             <FormField control={processingForm.control} name="brokenRiceYield" render={({ field }) => (<FormItem><FormLabel>Broken Rice</FormLabel><FormControl><Input type="number" step="0.01" {...field} className="rounded-xl" /></FormControl></FormItem>)} />
                        </div>
                        <Separator />
                        <div className="space-y-6">
                          <h3 className="text-md font-bold flex items-center gap-2 opacity-80"><Users className="h-5 w-5" /> Labour</h3>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6"><FormField control={processingForm.control} name="numberOfLabours" render={({ field }) => (<FormItem><FormLabel>Workers</FormLabel><FormControl><Input type="number" {...field} className="rounded-xl" /></FormControl></FormItem>)} /><FormField control={processingForm.control} name="labourCharge" render={({ field }) => (<FormItem><FormLabel>Total Wage (₹)</FormLabel><FormControl><Input type="number" step="10" {...field} className="rounded-xl" /></FormControl></FormItem>)} /></div>
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">{fields.map((f, i) => (<FormField key={f.id} control={processingForm.control} name={`labourerIds.${i}.value`} render={({ field }) => (<FormItem><Select onValueChange={field.onChange} value={field.value}><FormControl><SelectTrigger className="rounded-xl"><SelectValue placeholder="Select worker..." /></SelectTrigger></FormControl><SelectContent>{labourers.map(l => <SelectItem key={l.id} value={l.id}>{l.name}</SelectItem>)}</SelectContent></Select></FormItem>)} />))}</div>
                        </div>
                        <Button type="submit" className="w-full bg-primary h-14 rounded-2xl font-bold shadow-xl">Record Processing</Button>
                    </form></Form>
                </CardContent>
              </Card>
          )}
          <div className="bg-white border border-primary/5 rounded-3xl overflow-hidden shadow-sm">
              <Table><TableHeader className="bg-muted/30"><TableRow><TableHead className="pl-6">Date</TableHead><TableHead className="text-right">Paddy (Qtl)</TableHead><TableHead className="text-right">Rice (Qtl)</TableHead><TableHead className="text-right pr-6">Yield (%)</TableHead></TableRow></TableHeader><TableBody>{processingHistory.length === 0 ? (<TableRow><TableCell colSpan={4} className="text-center h-32 opacity-50">No history.</TableCell></TableRow>) : ([...processingHistory].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).map(p => (<TableRow key={p.id} className="hover:bg-primary/5"><TableCell className="pl-6">{format(new Date(p.date), 'dd MMM yyyy')}</TableCell><TableCell className="text-right">{p.paddyUsed.toFixed(2)}</TableCell><TableCell className="text-right font-bold text-primary">{p.riceYield.toFixed(2)}</TableCell><TableCell className="text-right pr-6 font-black text-primary">{p.yieldPercentage.toFixed(2)}%</TableCell></TableRow>)))}</TableBody></Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
