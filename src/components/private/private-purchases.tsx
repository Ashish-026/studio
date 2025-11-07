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

const formSchema = z.object({
  mandiName: z.string().min(1, 'Mandi name is required'),
  farmerName: z.string().min(1, 'Farmer name is required'),
  paddyAmount: z.coerce.number().positive('Must be a positive number'),
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

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-start">
          <div>
            <CardTitle>Private Purchase Records</CardTitle>
            <CardDescription>View and manage paddy purchases from private mandis.</CardDescription>
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
                <form onSubmit={form.handleSubmit(onSubmit)} className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
                  <FormField control={form.control} name="mandiName" render={({ field }) => (
                    <FormItem><FormLabel>Mandi Name</FormLabel><FormControl><Input placeholder="e.g., Private Mandi A" {...field} /></FormControl><FormMessage /></FormItem>
                  )} />
                  <FormField control={form.control} name="farmerName" render={({ field }) => (
                    <FormItem><FormLabel>Farmer Name</FormLabel><FormControl><Input placeholder="e.g., Gopal Verma" {...field} /></FormControl><FormMessage /></FormItem>
                  )} />
                  <FormField control={form.control} name="paddyAmount" render={({ field }) => (
                    <FormItem><FormLabel>Paddy Amount (Qtl)</FormLabel><FormControl><Input type="number" step="0.01" placeholder="150" {...field} /></FormControl><FormMessage /></FormItem>
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
                    <TableHead>Mandi Name</TableHead>
                    <TableHead>Farmer Name</TableHead>
                    <TableHead className="text-right">Paddy Amount (Qtl)</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {purchases.length === 0 && (
                        <TableRow><TableCell colSpan={3} className="text-center">No purchases recorded yet.</TableCell></TableRow>
                    )}
                    {purchases.map((item) => (
                    <TableRow key={item.id}>
                        <TableCell className="font-medium">{item.mandiName}</TableCell>
                        <TableCell>{item.farmerName}</TableCell>
                        <TableCell className="text-right">{item.paddyAmount.toLocaleString('en-IN')}</TableCell>
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
