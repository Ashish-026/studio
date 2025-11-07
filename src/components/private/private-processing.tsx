'use client';

import { useState, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { usePrivateData } from '@/context/private-context';
import { PlusCircle, Factory } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { format } from 'date-fns';

const processingFormSchema = z.object({
  purchaseId: z.string().min(1, 'A paddy purchase batch is required'),
  riceProduced: z.coerce.number().positive('Rice produced must be a positive number'),
  brokenRice: z.coerce.number().min(0, 'Cannot be negative'),
  bran: z.coerce.number().min(0, 'Cannot be negative'),
});

export function PrivateProcessing() {
  const { purchases, processingResults, addProcessingResult } = usePrivateData();
  const { toast } = useToast();
  const [showForm, setShowForm] = useState(false);

  const paddyPurchases = useMemo(() => {
    return purchases.filter(p => p.itemType === 'paddy');
  }, [purchases]);

  const processingForm = useForm<z.infer<typeof processingFormSchema>>({
    resolver: zodResolver(processingFormSchema),
    defaultValues: {
      purchaseId: '',
      riceProduced: 0,
      brokenRice: 0,
      bran: 0,
    },
  });
  
  const selectedPurchaseId = processingForm.watch('purchaseId');
  const selectedPurchase = useMemo(() => {
      return paddyPurchases.find(p => p.id === selectedPurchaseId);
  }, [selectedPurchaseId, paddyPurchases]);

  function onProcessingSubmit(values: z.infer<typeof processingFormSchema>) {
    const purchase = paddyPurchases.find(p => p.id === values.purchaseId);
    if (!purchase) {
        toast({
            variant: "destructive",
            title: "Error!",
            description: "Selected purchase not found.",
        });
        return;
    }

    addProcessingResult({
        ...values,
        paddyQuantity: purchase.quantity,
    });
    toast({
      title: 'Success!',
      description: 'New processing result has been recorded.',
    });
    processingForm.reset();
    setShowForm(false);
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-start">
          <div>
            <CardTitle>Processing Records</CardTitle>
            <CardDescription>Record the conversion of paddy to rice and other byproducts.</CardDescription>
          </div>
          <Button onClick={() => setShowForm(!showForm)} size="sm" disabled={paddyPurchases.length === 0}>
            <PlusCircle className="mr-2 h-4 w-4" />
            {showForm ? 'Cancel' : 'Add New Process'}
          </Button>
        </div>
        {paddyPurchases.length === 0 && !showForm && (
            <p className="text-sm text-muted-foreground pt-2">Please add a paddy purchase before recording a process.</p>
        )}
      </CardHeader>
      <CardContent className="space-y-6">
        {showForm && (
          <Card className="bg-muted/50">
            <CardHeader>
              <CardTitle>New Processing Entry</CardTitle>
              <CardDescription>Select a paddy batch and enter the output quantities.</CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...processingForm}>
                <form onSubmit={processingForm.handleSubmit(onProcessingSubmit)} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 items-start">
                    <FormField
                        control={processingForm.control}
                        name="purchaseId"
                        render={({ field }) => (
                            <FormItem className="lg:col-span-2">
                                <FormLabel>Paddy Purchase Batch</FormLabel>
                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                    <FormControl>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select a paddy purchase..." />
                                        </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                        {paddyPurchases.map(p => (
                                            <SelectItem key={p.id} value={p.id}>
                                                {format(p.date, 'dd MMM yyyy')} - {p.farmerName} ({p.quantity} Qtl)
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                    {selectedPurchase && (
                        <div className="lg:col-span-2 p-3 bg-background rounded-md text-sm">
                            <h4 className="font-semibold mb-1">Selected Batch Details</h4>
                            <p><strong>Paddy Input:</strong> {selectedPurchase.quantity} Quintals</p>
                            <p><strong>Farmer:</strong> {selectedPurchase.farmerName}</p>
                            <p><strong>Date:</strong> {format(selectedPurchase.date, 'PPP')}</p>
                        </div>
                    )}
                  
                  <FormField control={processingForm.control} name="riceProduced" render={({ field }) => (
                    <FormItem><FormLabel>Rice Produced (Qtl)</FormLabel><FormControl><Input type="number" step="0.01" {...field} /></FormControl><FormMessage /></FormItem>
                  )} />
                  <FormField control={processingForm.control} name="brokenRice" render={({ field }) => (
                    <FormItem><FormLabel>Broken Rice (Qtl)</FormLabel><FormControl><Input type="number" step="0.01" {...field} /></FormControl><FormMessage /></FormItem>
                  )} />
                  <FormField control={processingForm.control} name="bran" render={({ field }) => (
                    <FormItem><FormLabel>Bran (Qtl)</FormLabel><FormControl><Input type="number" step="0.01" {...field} /></FormControl><FormMessage /></FormItem>
                  )} />
                  
                  <Button type="submit" className="w-full md:w-auto md:col-span-full bg-accent hover:bg-accent/90">Add Processing Entry</Button>
                </form>
              </Form>
            </CardContent>
          </Card>
        )}

        <div>
          <h3 className="text-lg font-semibold mb-2 flex items-center gap-2"><Factory className="h-5 w-5" /> Processing History</h3>
          <div className="border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Paddy Input (Qtl)</TableHead>
                  <TableHead>Rice Produced (Qtl)</TableHead>
                  <TableHead>Broken Rice (Qtl)</TableHead>
                  <TableHead>Bran (Qtl)</TableHead>
                  <TableHead className="text-right">Yield (%)</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {processingResults.length === 0 && (
                  <TableRow><TableCell colSpan={6} className="text-center">No processing records found.</TableCell></TableRow>
                )}
                {processingResults.map((result) => (
                  <TableRow key={result.id}>
                    <TableCell>{format(result.date, 'dd MMM yyyy')}</TableCell>
                    <TableCell>{result.paddyQuantity.toLocaleString('en-IN')}</TableCell>
                    <TableCell>{result.riceProduced.toLocaleString('en-IN')}</TableCell>
                    <TableCell>{result.brokenRice.toLocaleString('en-IN')}</TableCell>
                    <TableCell>{result.bran.toLocaleString('en-IN')}</TableCell>
                    <TableCell className="text-right font-medium">{result.yieldPercentage.toFixed(2)}%</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
