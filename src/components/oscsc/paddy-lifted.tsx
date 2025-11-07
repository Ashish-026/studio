'use client';

import { useState, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useOSCSCData } from '@/context/oscsc-context';
import { PlusCircle, DollarSign } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAuth } from '@/hooks/use-auth';
import { Badge } from '@/components/ui/badge';

const physicalFormSchema = z.object({
  mandiName: z.string().min(1, 'Mandi name is required'),
  farmerName: z.string().min(1, 'Farmer name is required'),
  totalPaddyReceived: z.coerce.number().positive('Must be a positive number'),
  mandiWeight: z.coerce.number().positive('Must be a positive number'),
});

const monetaryFormSchema = z.object({
  mandiName: z.string().min(1, 'Mandi name is required'),
  moneyReceived: z.coerce.number().positive('Must be a positive number'),
  ratePerQuintal: z.coerce.number().positive('Must be a positive number'),
});


export function PaddyLifted() {
  const { paddyLiftedItems, addPaddyLifted, targetAllocations } = useOSCSCData();
  const { toast } = useToast();
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';
  const [showPhysicalForm, setShowPhysicalForm] = useState(false);
  const [showMonetaryForm, setShowMonetaryForm] = useState(false);

  const uniqueMandis = useMemo(() => {
    const mandiNames = targetAllocations.map((allocation) => allocation.mandiName);
    return [...new Set(mandiNames)];
  }, [targetAllocations]);

  const physicalForm = useForm<z.infer<typeof physicalFormSchema>>({
    resolver: zodResolver(physicalFormSchema),
    defaultValues: { mandiName: '', farmerName: '' },
  });

  const monetaryForm = useForm<z.infer<typeof monetaryFormSchema>>({
    resolver: zodResolver(monetaryFormSchema),
    defaultValues: { mandiName: '' },
  });

  function onPhysicalSubmit(values: z.infer<typeof physicalFormSchema>) {
    addPaddyLifted({ ...values, entryType: 'physical' });
    toast({
      title: 'Success!',
      description: 'Physical paddy lifting record has been added.',
    });
    physicalForm.reset();
    setShowPhysicalForm(false);
  }

  function onMonetarySubmit(values: z.infer<typeof monetaryFormSchema>) {
    const equivalentQuintal = values.moneyReceived / values.ratePerQuintal;
    addPaddyLifted({
      mandiName: values.mandiName,
      farmerName: `Monetary Entry (₹${values.moneyReceived.toLocaleString('en-IN')})`,
      totalPaddyReceived: equivalentQuintal,
      mandiWeight: equivalentQuintal, // Assuming mandi weight is same as received for this entry type
      entryType: 'monetary',
    });
    toast({
      title: 'Success!',
      description: 'Monetary paddy lifting record has been added.',
    });
    monetaryForm.reset();
    setShowMonetaryForm(false);
  }

  const handleTogglePhysicalForm = () => {
    setShowPhysicalForm(!showPhysicalForm);
    setShowMonetaryForm(false);
  };

  const handleToggleMonetaryForm = () => {
    setShowMonetaryForm(!showMonetaryForm);
    setShowPhysicalForm(false);
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-start">
          <div>
            <CardTitle>Paddy Lifting Records</CardTitle>
            <CardDescription>View and manage paddy lifting entries from various mandis.</CardDescription>
          </div>
          <div className="flex gap-2">
            <Button onClick={handleTogglePhysicalForm} size="sm" disabled={uniqueMandis.length === 0}>
              <PlusCircle className="mr-2 h-4 w-4" />
              {showPhysicalForm ? 'Cancel' : 'Add Physical Entry'}
            </Button>
            {isAdmin && (
              <Button onClick={handleToggleMonetaryForm} size="sm" variant="secondary" disabled={uniqueMandis.length === 0}>
                <DollarSign className="mr-2 h-4 w-4" />
                {showMonetaryForm ? 'Cancel' : 'Add Monetary Entry'}
              </Button>
            )}
          </div>
        </div>
        {uniqueMandis.length === 0 && !showPhysicalForm && !showMonetaryForm && (
            <p className="text-sm text-muted-foreground pt-2">Please add a target allotment before adding a paddy lifting entry.</p>
        )}
      </CardHeader>
      <CardContent className="space-y-6">
        {showPhysicalForm && (
          <Card className="bg-muted/50">
             <CardHeader>
                <CardTitle>New Physical Paddy Lifting Entry</CardTitle>
            </CardHeader>
            <CardContent>
              <Form {...physicalForm}>
                <form onSubmit={physicalForm.handleSubmit(onPhysicalSubmit)} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 items-end">
                  <FormField
                    control={physicalForm.control}
                    name="mandiName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Mandi Name</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger><SelectValue placeholder="Select a mandi" /></SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {uniqueMandis.map((mandi) => ( <SelectItem key={mandi} value={mandi}>{mandi}</SelectItem> ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField control={physicalForm.control} name="farmerName" render={({ field }) => (
                    <FormItem><FormLabel>Farmer Name</FormLabel><FormControl><Input placeholder="e.g., Ramesh Patel" {...field} /></FormControl><FormMessage /></FormItem>
                  )} />
                  <FormField control={physicalForm.control} name="totalPaddyReceived" render={({ field }) => (
                    <FormItem><FormLabel>Paddy Received (Qtl)</FormLabel><FormControl><Input type="number" step="0.01" placeholder="120" {...field} /></FormControl><FormMessage /></FormItem>
                  )} />
                  <FormField control={physicalForm.control} name="mandiWeight" render={({ field }) => (
                    <FormItem><FormLabel>Mandi Weight (Qtl)</FormLabel><FormControl><Input type="number" step="0.01" placeholder="118.5" {...field} /></FormControl><FormMessage /></FormItem>
                  )} />
                  <Button type="submit" className="w-full md:w-auto md:col-span-full bg-accent hover:bg-accent/90">Add Entry</Button>
                </form>
              </Form>
            </CardContent>
          </Card>
        )}

        {isAdmin && showMonetaryForm && (
            <Card className="bg-muted/50">
                <CardHeader>
                    <CardTitle>New Monetary Paddy Lifting Entry</CardTitle>
                    <CardDescription>Enter money received to auto-calculate equivalent quintals.</CardDescription>
                </CardHeader>
                <CardContent>
                <Form {...monetaryForm}>
                    <form onSubmit={monetaryForm.handleSubmit(onMonetarySubmit)} className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
                    <FormField
                        control={monetaryForm.control}
                        name="mandiName"
                        render={({ field }) => (
                        <FormItem>
                            <FormLabel>Mandi Name</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                                <SelectTrigger><SelectValue placeholder="Select a mandi" /></SelectTrigger>
                            </FormControl>
                            <SelectContent>
                                {uniqueMandis.map((mandi) => ( <SelectItem key={mandi} value={mandi}>{mandi}</SelectItem> ))}
                            </SelectContent>
                            </Select>
                            <FormMessage />
                        </FormItem>
                        )}
                    />
                    <FormField control={monetaryForm.control} name="moneyReceived" render={({ field }) => (
                        <FormItem><FormLabel>Money Received (₹)</FormLabel><FormControl><Input type="number" step="0.01" placeholder="250000" {...field} /></FormControl><FormMessage /></FormItem>
                    )} />
                    <FormField control={monetaryForm.control} name="ratePerQuintal" render={({ field }) => (
                        <FormItem><FormLabel>Rate per Quintal (₹)</FormLabel><FormControl><Input type="number" step="0.01" placeholder="2200" {...field} /></FormControl><FormMessage /></FormItem>
                    )} />
                    <Button type="submit" className="w-full md:w-auto md:col-span-full bg-accent hover:bg-accent/90">Add Monetary Entry</Button>
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
                    <TableHead>Farmer/Entry Details</TableHead>
                    <TableHead>Paddy Received (Qtl)</TableHead>
                    <TableHead>Mandi Weight (Qtl)</TableHead>
                    <TableHead className="text-right">Entry Type</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {paddyLiftedItems.length === 0 && (
                        <TableRow><TableCell colSpan={5} className="text-center">No paddy lifted yet.</TableCell></TableRow>
                    )}
                    {paddyLiftedItems.map((item) => (
                    <TableRow key={item.id}>
                        <TableCell className="font-medium">{item.mandiName}</TableCell>
                        <TableCell>{item.farmerName}</TableCell>
                        <TableCell>{item.totalPaddyReceived.toLocaleString('en-IN', { maximumFractionDigits: 2 })}</TableCell>
                        <TableCell>{item.mandiWeight.toLocaleString('en-IN', { maximumFractionDigits: 2 })}</TableCell>
                        <TableCell className="text-right">
                          <Badge variant={item.entryType === 'monetary' ? 'secondary' : 'outline'} className="capitalize">
                            {item.entryType || 'physical'}
                          </Badge>
                        </TableCell>
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
