'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useLabourData } from '@/context/labour-context';
import { PlusCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { format } from 'date-fns';

const dailyFormSchema = z.object({
  name: z.string().min(1, "Labourer's name is required"),
  activity: z.string().min(1, 'Activity is required'),
  hoursWorked: z.coerce.number().positive('Must be a positive number'),
  dailyRate: z.coerce.number().positive('Daily rate must be positive'),
});

const itemRateFormSchema = z.object({
  name: z.string().min(1, "Labourer's name is required"),
  itemName: z.string().min(1, 'Item name is required'),
  quantity: z.coerce.number().positive('Quantity must be positive'),
  ratePerItem: z.coerce.number().positive('Rate per item must be positive'),
});

export function LabourRecords() {
  const { records, addRecord } = useLabourData();
  const { toast } = useToast();
  const [showForm, setShowForm] = useState(false);

  const dailyForm = useForm<z.infer<typeof dailyFormSchema>>({
    resolver: zodResolver(dailyFormSchema),
    defaultValues: { name: '', activity: '' },
  });

  const itemRateForm = useForm<z.infer<typeof itemRateFormSchema>>({
    resolver: zodResolver(itemRateFormSchema),
    defaultValues: { name: '', itemName: '' },
  });

  function onDailySubmit(values: z.infer<typeof dailyFormSchema>) {
    addRecord({ ...values, entryType: 'daily' });
    toast({
      title: 'Success!',
      description: 'Daily labour record has been added.',
    });
    dailyForm.reset();
    setShowForm(false);
  }

  function onItemRateSubmit(values: z.infer<typeof itemRateFormSchema>) {
    addRecord({ ...values, entryType: 'item_rate' });
    toast({
      title: 'Success!',
      description: 'Item rate record has been added.',
    });
    itemRateForm.reset();
    setShowForm(false);
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
    }).format(amount);
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-start">
          <div>
            <CardTitle>Labour Records</CardTitle>
            <CardDescription>View and manage labour activity records.</CardDescription>
          </div>
          <Button onClick={() => setShowForm(!showForm)} size="sm">
            <PlusCircle className="mr-2 h-4 w-4" />
            {showForm ? 'Cancel' : 'Add Record'}
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {showForm && (
          <Card className="bg-muted/50">
             <CardHeader>
                <CardTitle>New Labour Record</CardTitle>
            </CardHeader>
            <CardContent>
                <Tabs defaultValue="daily">
                    <TabsList className="grid w-full grid-cols-2">
                        <TabsTrigger value="daily">Daily Labour</TabsTrigger>
                        <TabsTrigger value="item_rate">Item Rate</TabsTrigger>
                    </TabsList>
                    <TabsContent value="daily" className="pt-4">
                        <Form {...dailyForm}>
                            <form onSubmit={dailyForm.handleSubmit(onDailySubmit)} className="grid grid-cols-1 md:grid-cols-2 gap-4 items-end">
                                <FormField control={dailyForm.control} name="name" render={({ field }) => (
                                    <FormItem><FormLabel>Labourer Name</FormLabel><FormControl><Input placeholder="e.g., Manoj Kumar" {...field} /></FormControl><FormMessage /></FormItem>
                                )} />
                                <FormField control={dailyForm.control} name="activity" render={({ field }) => (
                                    <FormItem><FormLabel>Activity</FormLabel><FormControl><Input placeholder="e.g., Loading, Cleaning" {...field} /></FormControl><FormMessage /></FormItem>
                                )} />
                                <FormField control={dailyForm.control} name="hoursWorked" render={({ field }) => (
                                    <FormItem><FormLabel>Hours Worked</FormLabel><FormControl><Input type="number" step="0.5" placeholder="8" {...field} /></FormControl><FormMessage /></FormItem>
                                )} />
                                <FormField control={dailyForm.control} name="dailyRate" render={({ field }) => (
                                    <FormItem><FormLabel>Daily Rate (for 8 hrs)</FormLabel><FormControl><Input type="number" step="10" placeholder="500" {...field} /></FormControl><FormMessage /></FormItem>
                                )} />
                                <Button type="submit" className="w-full md:w-auto md:col-span-full bg-accent hover:bg-accent/90">Add Daily Record</Button>
                            </form>
                        </Form>
                    </TabsContent>
                    <TabsContent value="item_rate" className="pt-4">
                        <Form {...itemRateForm}>
                            <form onSubmit={itemRateForm.handleSubmit(onItemRateSubmit)} className="grid grid-cols-1 md:grid-cols-2 gap-4 items-end">
                                <FormField control={itemRateForm.control} name="name" render={({ field }) => (
                                    <FormItem><FormLabel>Labourer Name</FormLabel><FormControl><Input placeholder="e.g., Rakesh Sharma" {...field} /></FormControl><FormMessage /></FormItem>
                                )} />
                                <FormField control={itemRateForm.control} name="itemName" render={({ field }) => (
                                    <FormItem><FormLabel>Item Name</FormLabel><FormControl><Input placeholder="e.g., Paddy Bags" {...field} /></FormControl><FormMessage /></FormItem>
                                )} />
                                <FormField control={itemRateForm.control} name="quantity" render={({ field }) => (
                                    <FormItem><FormLabel>Quantity</FormLabel><FormControl><Input type="number" placeholder="200" {...field} /></FormControl><FormMessage /></FormItem>
                                )} />
                                <FormField control={itemRateForm.control} name="ratePerItem" render={({ field }) => (
                                    <FormItem><FormLabel>Rate per Item (₹)</FormLabel><FormControl><Input type="number" step="0.01" placeholder="2.5" {...field} /></FormControl><FormMessage /></FormItem>
                                )} />
                                <Button type="submit" className="w-full md:w-auto md:col-span-full bg-accent hover:bg-accent/90">Add Item Rate Record</Button>
                            </form>
                        </Form>
                    </TabsContent>
                </Tabs>
            </CardContent>
          </Card>
        )}

        <div>
            <h3 className="text-lg font-semibold mb-2">Activity History</h3>
            <div className="border rounded-lg">
                <Table>
                <TableHeader>
                    <TableRow>
                    <TableHead>Labourer Name</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Details</TableHead>
                    <TableHead className="text-right">Wage (₹)</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {records.length === 0 && (
                        <TableRow><TableCell colSpan={5} className="text-center">No records found.</TableCell></TableRow>
                    )}
                    {records.sort((a,b) => b.date.getTime() - a.date.getTime()).map((item) => (
                    <TableRow key={item.id}>
                        <TableCell className="font-medium">{item.name}</TableCell>
                        <TableCell>{format(item.date, 'dd MMM yyyy')}</TableCell>
                        <TableCell className="capitalize">{item.entryType.replace('_', ' ')}</TableCell>
                        <TableCell>
                            {item.entryType === 'daily' 
                                ? `${item.activity} - ${item.hoursWorked} hrs @ ${formatCurrency(item.dailyRate!)}/day`
                                : `${item.quantity} x ${item.itemName} @ ${formatCurrency(item.ratePerItem!)}/item`
                            }
                        </TableCell>
                        <TableCell className="text-right font-semibold">{formatCurrency(item.wage)}</TableCell>
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
