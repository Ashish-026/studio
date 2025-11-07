'use client';

import { useState, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useOSCSCData } from '@/context/oscsc-context';
import { PlusCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const formSchema = z.object({
  mandiName: z.string().min(1, 'Mandi name is required'),
  farmerName: z.string().min(1, 'Farmer name is required'),
  totalPaddyReceived: z.coerce.number().positive('Must be a positive number'),
  mandiWeight: z.coerce.number().positive('Must be a positive number'),
});

export function PaddyLifted() {
  const { paddyLiftedItems, addPaddyLifted, targetAllocations } = useOSCSCData();
  const { toast } = useToast();
  const [showForm, setShowForm] = useState(false);

  const uniqueMandis = useMemo(() => {
    const mandiNames = targetAllocations.map((allocation) => allocation.mandiName);
    return [...new Set(mandiNames)];
  }, [targetAllocations]);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      mandiName: '',
      farmerName: '',
    },
  });

  function onSubmit(values: z.infer<typeof formSchema>) {
    addPaddyLifted(values);
    toast({
      title: 'Success!',
      description: 'Paddy lifting record has been added.',
    });
    form.reset();
    setShowForm(false);
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-start">
          <div>
            <CardTitle>Paddy Lifting Records</CardTitle>
            <CardDescription>View and manage paddy lifting entries from various mandis.</CardDescription>
          </div>
          <Button onClick={() => setShowForm(!showForm)} size="sm" disabled={uniqueMandis.length === 0}>
            <PlusCircle className="mr-2 h-4 w-4" />
            {showForm ? 'Cancel' : 'Add Entry'}
          </Button>
        </div>
        {uniqueMandis.length === 0 && !showForm && (
            <p className="text-sm text-muted-foreground pt-2">Please add a target allotment before adding a paddy lifting entry.</p>
        )}
      </CardHeader>
      <CardContent className="space-y-6">
        {showForm && (
          <Card className="bg-muted/50">
             <CardHeader>
                <CardTitle>New Paddy Lifting Entry</CardTitle>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 items-end">
                  <FormField
                    control={form.control}
                    name="mandiName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Mandi Name</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select a mandi" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {uniqueMandis.map((mandi) => (
                              <SelectItem key={mandi} value={mandi}>
                                {mandi}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField control={form.control} name="farmerName" render={({ field }) => (
                    <FormItem><FormLabel>Farmer Name</FormLabel><FormControl><Input placeholder="e.g., Ramesh Patel" {...field} /></FormControl><FormMessage /></FormItem>
                  )} />
                  <FormField control={form.control} name="totalPaddyReceived" render={({ field }) => (
                    <FormItem><FormLabel>Paddy Received (Qtl)</FormLabel><FormControl><Input type="number" step="0.01" placeholder="120" {...field} /></FormControl><FormMessage /></FormItem>
                  )} />
                  <FormField control={form.control} name="mandiWeight" render={({ field }) => (
                    <FormItem><FormLabel>Mandi Weight (Qtl)</FormLabel><FormControl><Input type="number" step="0.01" placeholder="118.5" {...field} /></FormControl><FormMessage /></FormItem>
                  )} />
                  <Button type="submit" className="w-full md:w-auto md:col-span-full bg-accent hover:bg-accent/90">Add Entry</Button>
                </form>
              </Form>
            </CardContent>
          </Card>
        )}

        <div>
            <h3 className="text-lg font-semibold mb-2">Lifting History</h3>
            <div className="border rounded-lg">
                <Table>
                <TableHeader>
                    <TableRow>
                    <TableHead>Mandi Name</TableHead>
                    <TableHead>Farmer Name</TableHead>
                    <TableHead>Paddy Received (Qtl)</TableHead>
                    <TableHead className="text-right">Mandi Weight (Qtl)</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {paddyLiftedItems.length === 0 && (
                        <TableRow><TableCell colSpan={4} className="text-center">No paddy lifted yet.</TableCell></TableRow>
                    )}
                    {paddyLiftedItems.map((item) => (
                    <TableRow key={item.id}>
                        <TableCell className="font-medium">{item.mandiName}</TableCell>
                        <TableCell>{item.farmerName}</TableCell>
                        <TableCell>{item.totalPaddyReceived.toLocaleString('en-IN')}</TableCell>
                        <TableCell className="text-right">{item.mandiWeight.toLocaleString('en-IN')}</TableCell>
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
