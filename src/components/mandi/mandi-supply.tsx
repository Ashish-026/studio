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
import { PlusCircle, Calendar as CalendarIcon } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover';
import { Calendar } from '../ui/calendar';
import { cn } from '@/lib/utils';
import { Textarea } from '../ui/textarea';

const supplySchema = z.object({
    date: z.date({ required_error: 'A date is required.' }),
    lotNumber: z.string().min(1, 'Lot number is required'),
    godownDetails: z.string().min(1, 'Godown details are required'),
    quantity: z.coerce.number().positive('Quantity must be positive'),
});

export function MandiSupply() {
  const { processingHistory, stockReleases, addStockRelease } = useMandiData();
  const { toast } = useToast();
  const [showForm, setShowForm] = useState(false);

  const supplyForm = useForm<z.infer<typeof supplySchema>>({
    resolver: zodResolver(supplySchema),
    defaultValues: { lotNumber: '', godownDetails: '' },
  });

  const availableRiceStock = useMemo(() => {
    const totalRiceYield = processingHistory.reduce((sum, item) => sum + item.riceYield, 0);
    const totalRiceSupplied = stockReleases.reduce((sum, item) => sum + item.quantity, 0);
    return totalRiceYield - totalRiceSupplied;
  }, [processingHistory, stockReleases]);

  const formatNumber = (num: number) => new Intl.NumberFormat('en-IN', { maximumFractionDigits: 2 }).format(num);

  function onSupplySubmit(values: z.infer<typeof supplySchema>) {
    if(values.quantity > availableRiceStock) {
        supplyForm.setError('quantity', { message: `Exceeds available rice stock of ${formatNumber(availableRiceStock)} Qtl` });
        return;
    }
    addStockRelease(values);
    toast({ title: 'Success!', description: 'Rice supply has been recorded.' });
    supplyForm.reset();
    setShowForm(false);
  }

  return (
    <Card>
        <CardHeader>
          <div className="flex justify-between items-start">
            <div>
              <CardTitle>Rice Supply</CardTitle>
              <CardDescription>Record rice released for supply from processed stock.</CardDescription>
            </div>
            <Button onClick={() => setShowForm(!showForm)} size="sm">
              <PlusCircle className="mr-2 h-4 w-4" />
              {showForm ? 'Cancel' : 'Add Supply Entry'}
            </Button>
          </div>
           <div className="pt-2">
            <p className="text-sm font-medium">
                Available Rice for Supply: 
                <span className="text-primary font-bold"> {formatNumber(availableRiceStock)} Qtl</span>
            </p>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
        {showForm && (
            <Card className="bg-muted/50">
              <CardHeader>
                <CardTitle>New Supply Entry</CardTitle>
                <CardDescription>Release rice stock for supply.</CardDescription>
              </CardHeader>
              <CardContent>
                <Form {...supplyForm}>
                  <form onSubmit={supplyForm.handleSubmit(onSupplySubmit)} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 items-start">
                        <FormField control={supplyForm.control} name="date" render={({ field }) => (
                            <FormItem className="flex flex-col"><FormLabel>Supply Date</FormLabel><Popover><PopoverTrigger asChild><FormControl>
                                <Button variant={"outline"} className={cn("pl-3 text-left font-normal", !field.value && "text-muted-foreground")}>
                                    {field.value ? format(field.value, "PPP") : <span>Pick a date</span>}
                                    <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                </Button>
                            </FormControl></PopoverTrigger><PopoverContent className="w-auto p-0" align="start">
                                <Calendar mode="single" selected={field.value} onSelect={field.onChange} initialFocus />
                            </PopoverContent></Popover><FormMessage /></FormItem>
                        )} />
                        <FormField control={supplyForm.control} name="lotNumber" render={({ field }) => (
                            <FormItem><FormLabel>Lot Number</FormLabel><FormControl><Input placeholder="e.g., LOT-001" {...field} /></FormControl><FormMessage /></FormItem>
                        )} />
                         <FormField control={supplyForm.control} name="quantity" render={({ field }) => (
                            <FormItem><FormLabel>Quantity (Qtl)</FormLabel><FormControl><Input type="number" step="0.01" {...field} /></FormControl><FormMessage /></FormItem>
                        )} />
                    </div>
                     <FormField control={supplyForm.control} name="godownDetails" render={({ field }) => (
                        <FormItem><FormLabel>Godown Details</FormLabel><FormControl><Textarea placeholder="e.g., Central Godown, Bay 4" {...field} /></FormControl><FormMessage /></FormItem>
                    )} />
                    <Button type="submit" className="w-full md:w-auto bg-accent hover:bg-accent/90">Record Supply</Button>
                  </form>
                </Form>
              </CardContent>
            </Card>
        )}
        
        <div>
            <h3 className="text-lg font-semibold mb-2">Supply History</h3>
             <div className="border rounded-lg">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Date</TableHead>
                            <TableHead>Lot Number</TableHead>
                            <TableHead>Godown Details</TableHead>
                            <TableHead className="text-right">Quantity (Qtl)</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {stockReleases.length === 0 ? (
                            <TableRow><TableCell colSpan={4} className="text-center h-24">No supply history.</TableCell></TableRow>
                        ) : (
                            [...stockReleases].sort((a, b) => b.date.getTime() - a.date.getTime()).map(s => (
                                <TableRow key={s.id}>
                                    <TableCell>{format(s.date, 'dd MMM yyyy')}</TableCell>
                                    <TableCell>{s.lotNumber}</TableCell>
                                    <TableCell>{s.godownDetails}</TableCell>
                                    <TableCell className="text-right font-medium">{formatNumber(s.quantity)}</TableCell>
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
