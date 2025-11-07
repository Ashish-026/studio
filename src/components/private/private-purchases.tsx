'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { usePrivateData } from '@/context/private-context';
import { PlusCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';

const formSchema = z.object({
  mandiName: z.string().min(1, 'Mandi name is required'),
  itemType: z.enum(['paddy', 'rice'], { required_error: 'Item type is required' }),
  farmerName: z.string().min(1, 'Farmer name is required'),
  quantity: z.coerce.number().positive('Must be a positive number'),
  rate: z.coerce.number().positive('Must be a positive number'),
  amountPaid: z.coerce.number().min(0, 'Cannot be negative'),
});

export function PrivatePurchases() {
  const { purchases, addPurchase } = usePrivateData();
  const { toast } = useToast();
  const [showForm, setShowForm] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      mandiName: '',
      farmerName: '',
    },
  });

  function onSubmit(values: z.infer<typeof formSchema>) {
    addPurchase(values);
    toast({
      title: 'Success!',
      description: 'Private purchase record has been added.',
    });
    form.reset();
    setShowForm(false);
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 2,
    }).format(amount);
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-start">
          <div>
            <CardTitle>Private Purchase Records</CardTitle>
            <CardDescription>View and manage paddy/rice purchases from private mandis.</CardDescription>
          </div>
          <Button onClick={() => setShowForm(!showForm)} size="sm">
            <PlusCircle className="mr-2 h-4 w-4" />
            {showForm ? 'Cancel' : 'Add Entry'}
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {showForm && (
          <Card className="bg-muted/50">
             <CardHeader>
                <CardTitle>New Private Purchase</CardTitle>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 items-end">
                  <FormField control={form.control} name="mandiName" render={({ field }) => (
                    <FormItem><FormLabel>Mandi Name</FormLabel><FormControl><Input placeholder="e.g., Private Mandi A" {...field} /></FormControl><FormMessage /></FormItem>
                  )} />
                  <FormField control={form.control} name="farmerName" render={({ field }) => (
                    <FormItem><FormLabel>Farmer Name</FormLabel><FormControl><Input placeholder="e.g., Gopal Verma" {...field} /></FormControl><FormMessage /></FormItem>
                  )} />
                  <FormField control={form.control} name="itemType" render={({ field }) => (
                     <FormItem>
                        <FormLabel>Item</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger><SelectValue placeholder="Select item type" /></SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="paddy">Paddy</SelectItem>
                            <SelectItem value="rice">Rice</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                  )} />
                  <FormField control={form.control} name="quantity" render={({ field }) => (
                    <FormItem><FormLabel>Quantity (Qtl)</FormLabel><FormControl><Input type="number" step="0.01" placeholder="150" {...field} /></FormControl><FormMessage /></FormItem>
                  )} />
                   <FormField control={form.control} name="rate" render={({ field }) => (
                    <FormItem><FormLabel>Rate per Qtl (₹)</FormLabel><FormControl><Input type="number" step="0.01" placeholder="2200" {...field} /></FormControl><FormMessage /></FormItem>
                  )} />
                   <FormField control={form.control} name="amountPaid" render={({ field }) => (
                    <FormItem><FormLabel>Amount Paid (₹)</FormLabel><FormControl><Input type="number" step="0.01" placeholder="300000" {...field} /></FormControl><FormMessage /></FormItem>
                  )} />
                  <Button type="submit" className="w-full md:w-auto md:col-span-full bg-accent hover:bg-accent/90">Add Purchase</Button>
                </form>
              </Form>
            </CardContent>
          </Card>
        )}

        <div>
            <h3 className="text-lg font-semibold mb-2">Purchase History</h3>
            <div className="border rounded-lg">
                <Table>
                <TableHeader>
                    <TableRow>
                    <TableHead>Mandi</TableHead>
                    <TableHead>Farmer</TableHead>
                    <TableHead>Item</TableHead>
                    <TableHead className="text-right">Quantity (Qtl)</TableHead>
                    <TableHead className="text-right">Rate (₹/Qtl)</TableHead>
                    <TableHead className="text-right">Total (₹)</TableHead>
                    <TableHead className="text-right">Paid (₹)</TableHead>
                    <TableHead className="text-right">Balance (₹)</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {purchases.length === 0 && (
                        <TableRow><TableCell colSpan={8} className="text-center">No purchases recorded yet.</TableCell></TableRow>
                    )}
                    {purchases.map((item) => (
                    <TableRow key={item.id}>
                        <TableCell className="font-medium">{item.mandiName}</TableCell>
                        <TableCell>{item.farmerName}</TableCell>
                        <TableCell className="capitalize">{item.itemType}</TableCell>
                        <TableCell className="text-right">{item.quantity.toLocaleString('en-IN')}</TableCell>
                        <TableCell className="text-right">{formatCurrency(item.rate)}</TableCell>
                        <TableCell className="text-right font-medium">{formatCurrency(item.totalAmount)}</TableCell>
                        <TableCell className="text-right">{formatCurrency(item.amountPaid)}</TableCell>
                        <TableCell className={`text-right font-semibold ${item.balance > 0 ? 'text-destructive' : ''}`}>{formatCurrency(item.balance)}</TableCell>
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
