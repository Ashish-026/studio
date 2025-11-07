'use client';

import { useState, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useLabourData } from '@/context/labour-context';
import { PlusCircle, ChevronDown, ChevronRight, Receipt, Briefcase } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { format } from 'date-fns';
import { Textarea } from '../ui/textarea';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '../ui/collapsible';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog';

const labourerSchema = z.object({
  labourerName: z.string().min(1, "Labourer's name is required"),
});

const dailyWorkSchema = z.object({
  description: z.string().min(1, 'Description is required'),
  activity: z.string().min(1, 'Activity is required'),
  dailyRate: z.coerce.number().positive('Daily rate must be positive'),
});

const itemRateWorkSchema = z.object({
  description: z.string().min(1, 'Description is required'),
  itemName: z.string().min(1, 'Item name is required'),
  quantity: z.coerce.number().positive('Quantity must be positive'),
  ratePerItem: z.coerce.number().positive('Rate per item must be positive'),
});

const paymentFormSchema = z.object({
    amount: z.coerce.number().positive('Payment amount must be positive'),
});

export function LabourRecords() {
  const { labourers, addWorkEntry, addPayment, addLabourer } = useLabourData();
  const { toast } = useToast();
  const [showAddLabourerForm, setShowAddLabourerForm] = useState(false);
  const [openLabourerCollapsibles, setOpenLabourerCollapsibles] = useState<Record<string, boolean>>({});
  const [isPaymentDialogOpen, setPaymentDialogOpen] = useState(false);
  const [selectedLabourer, setSelectedLabourer] = useState<string | null>(null);

  const labourerForm = useForm<z.infer<typeof labourerSchema>>({
    resolver: zodResolver(labourerSchema),
    defaultValues: { labourerName: ''},
  });

  const dailyWorkForm = useForm<z.infer<typeof dailyWorkSchema>>({
    resolver: zodResolver(dailyWorkSchema),
    defaultValues: { description: '', activity: '' },
  });

  const itemRateWorkForm = useForm<z.infer<typeof itemRateWorkSchema>>({
    resolver: zodResolver(itemRateWorkSchema),
    defaultValues: { description: '', itemName: '' },
  });

  const paymentForm = useForm<z.infer<typeof paymentFormSchema>>({
    resolver: zodResolver(paymentFormSchema),
    defaultValues: { amount: 0 },
  });

  const sortedLabourers = useMemo(() => {
    return [...labourers].sort((a,b) => a.name.localeCompare(b.name));
  }, [labourers]);

  function onLabourerSubmit(values: z.infer<typeof labourerSchema>) {
    addLabourer(values.labourerName);
    toast({ title: 'Success!', description: `${values.labourerName} has been added.` });
    labourerForm.reset();
    setShowAddLabourerForm(false);
  }

  function onDailyWorkSubmit(labourerName: string, values: z.infer<typeof dailyWorkSchema>) {
    addWorkEntry(labourerName, { ...values, entryType: 'daily' });
    toast({ title: 'Success!', description: 'Daily work record has been added.' });
    dailyWorkForm.reset();
  }

  function onItemRateWorkSubmit(labourerName: string, values: z.infer<typeof itemRateWorkSchema>) {
    addWorkEntry(labourerName, { ...values, entryType: 'item_rate' });
    toast({ title: 'Success!', description: 'Item rate work record has been added.' });
    itemRateWorkForm.reset();
  }

  function onPaymentSubmit(values: z.infer<typeof paymentFormSchema>) {
    if (selectedLabourer) {
      addPayment(selectedLabourer, values.amount);
      toast({ title: 'Success!', description: 'Payment has been recorded.' });
      paymentForm.reset();
      setPaymentDialogOpen(false);
      setSelectedLabourer(null);
    }
  }

  const handlePaymentClick = (labourerId: string) => {
    setSelectedLabourer(labourerId);
    setPaymentDialogOpen(true);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', minimumFractionDigits: 2 }).format(amount);
  };

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex justify-between items-start">
            <div>
              <CardTitle>Labour Records</CardTitle>
              <CardDescription>View and manage labourer work and payment details.</CardDescription>
            </div>
            <Button onClick={() => setShowAddLabourerForm(!showAddLabourerForm)} size="sm">
              <PlusCircle className="mr-2 h-4 w-4" />
              {showAddLabourerForm ? 'Cancel' : 'Add Labourer'}
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {showAddLabourerForm && (
            <Card className="bg-muted/50">
              <CardHeader><CardTitle>New Labourer</CardTitle></CardHeader>
              <CardContent>
                <Form {...labourerForm}>
                    <form onSubmit={labourerForm.handleSubmit(onLabourerSubmit)} className="flex items-end gap-4">
                        <FormField control={labourerForm.control} name="labourerName" render={({ field }) => (
                            <FormItem className="flex-grow"><FormLabel>Labourer Name</FormLabel><FormControl><Input placeholder="e.g., Manoj Kumar" {...field} /></FormControl><FormMessage /></FormItem>
                        )} />
                        <Button type="submit" className="bg-accent hover:bg-accent/90">Add Labourer</Button>
                    </form>
                </Form>
              </CardContent>
            </Card>
          )}

          <div>
            <h3 className="text-lg font-semibold mb-2">Labourer Accounts</h3>
            <div className="border rounded-lg">
                {sortedLabourers.map(l => (
                    <Collapsible 
                        key={l.id}
                        open={openLabourerCollapsibles[l.id] || false}
                        onOpenChange={(isOpen) => setOpenLabourerCollapsibles(prev => ({...prev, [l.id]: isOpen}))}
                        className="border-b last:border-b-0"
                    >
                        <CollapsibleTrigger className="w-full p-4 flex items-center justify-between hover:bg-muted/50 transition-colors">
                            <div className="flex items-center gap-2">
                                {openLabourerCollapsibles[l.id] ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                                <span className="font-medium">{l.name}</span>
                            </div>
                            <div className="flex items-center gap-4">
                                <div className="text-right">
                                    <div className="font-semibold">{formatCurrency(l.balance)}</div>
                                    <div className="text-xs text-muted-foreground">Balance</div>
                                </div>
                                <Button size="sm" variant="secondary" onClick={(e) => { e.stopPropagation(); handlePaymentClick(l.id); }}>
                                    <Receipt className="mr-2 h-4 w-4" /> Pay
                                </Button>
                            </div>
                        </CollapsibleTrigger>
                        <CollapsibleContent className="bg-slate-50 dark:bg-slate-900/50">
                            <div className="p-4 space-y-6">
                                <Card>
                                    <CardHeader><CardTitle className="text-lg">Add New Work Entry</CardTitle></CardHeader>
                                    <CardContent>
                                        <Tabs defaultValue="daily">
                                            <TabsList className="grid w-full grid-cols-2">
                                                <TabsTrigger value="daily">Daily Work</TabsTrigger>
                                                <TabsTrigger value="item_rate">Item Rate Work</TabsTrigger>
                                            </TabsList>
                                            <TabsContent value="daily" className="pt-4">
                                                <Form {...dailyWorkForm}>
                                                <form onSubmit={dailyWorkForm.handleSubmit((values) => onDailyWorkSubmit(l.name, values))} className="grid grid-cols-1 md:grid-cols-2 gap-4 items-start">
                                                    <FormField control={dailyWorkForm.control} name="activity" render={({ field }) => (
                                                        <FormItem><FormLabel>Activity</FormLabel><FormControl><Input placeholder="e.g., Loading, Cleaning" {...field} /></FormControl><FormMessage /></FormItem>
                                                    )} />
                                                    <FormField control={dailyWorkForm.control} name="dailyRate" render={({ field }) => (
                                                        <FormItem><FormLabel>Daily Rate (₹)</FormLabel><FormControl><Input type="number" step="10" placeholder="500" {...field} /></FormControl><FormMessage /></FormItem>
                                                    )} />
                                                    <FormField control={dailyWorkForm.control} name="description" render={({ field }) => (
                                                        <FormItem className="md:col-span-2"><FormLabel>Description</FormLabel><FormControl><Textarea placeholder="Describe the work done..." {...field} /></FormControl><FormMessage /></FormItem>
                                                    )} />
                                                    <Button type="submit" className="w-full md:w-auto md:col-span-full bg-accent hover:bg-accent/90">Add Daily Work</Button>
                                                </form>
                                                </Form>
                                            </TabsContent>
                                            <TabsContent value="item_rate" className="pt-4">
                                                <Form {...itemRateWorkForm}>
                                                    <form onSubmit={itemRateWorkForm.handleSubmit((values) => onItemRateWorkSubmit(l.name, values))} className="grid grid-cols-1 md:grid-cols-2 gap-4 items-start">
                                                        <FormField control={itemRateWorkForm.control} name="itemName" render={({ field }) => (
                                                            <FormItem><FormLabel>Item Name</FormLabel><FormControl><Input placeholder="e.g., Paddy Bags" {...field} /></FormControl><FormMessage /></FormItem>
                                                        )} />
                                                        <FormField control={itemRateWorkForm.control} name="quantity" render={({ field }) => (
                                                            <FormItem><FormLabel>Quantity</FormLabel><FormControl><Input type="number" placeholder="200" {...field} /></FormControl><FormMessage /></FormItem>
                                                        )} />
                                                        <FormField control={itemRateWorkForm.control} name="ratePerItem" render={({ field }) => (
                                                            <FormItem><FormLabel>Rate per Item (₹)</FormLabel><FormControl><Input type="number" step="0.01" placeholder="2.5" {...field} /></FormControl><FormMessage /></FormItem>
                                                        )} />
                                                        <FormField control={itemRateWorkForm.control} name="description" render={({ field }) => (
                                                            <FormItem className="md:col-span-2"><FormLabel>Description</FormLabel><FormControl><Textarea placeholder="Describe the work done..." {...field} /></FormControl><FormMessage /></FormItem>
                                                        )} />
                                                        <Button type="submit" className="w-full md:w-auto md:col-span-full bg-accent hover:bg-accent/90">Add Item Rate Work</Button>
                                                    </form>
                                                </Form>
                                            </TabsContent>
                                        </Tabs>
                                    </CardContent>
                                </Card>

                                <div>
                                    <h4 className="font-semibold mb-2 flex items-center gap-2"><Briefcase className="h-4 w-4" /> Work History</h4>
                                    {l.workEntries.length > 0 ? (
                                    <Table>
                                        <TableHeader><TableRow><TableHead>Date</TableHead><TableHead>Description</TableHead><TableHead>Details</TableHead><TableHead className="text-right">Wage (₹)</TableHead></TableRow></TableHeader>
                                        <TableBody>
                                            {[...l.workEntries].sort((a, b) => b.date.getTime() - a.date.getTime()).map(w => (
                                                <TableRow key={w.id}>
                                                    <TableCell>{format(w.date, 'dd MMM yyyy')}</TableCell>
                                                    <TableCell>{w.description}</TableCell>
                                                    <TableCell>
                                                        {w.entryType === 'daily' 
                                                            ? `${w.activity} @ ${formatCurrency(w.dailyRate!)}/day`
                                                            : `${w.quantity} x ${w.itemName} @ ${formatCurrency(w.ratePerItem!)}/item`
                                                        }
                                                    </TableCell>
                                                    <TableCell className="text-right">{formatCurrency(w.wage)}</TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                     ) : <p className="text-sm text-muted-foreground">No work entries recorded.</p>}
                                </div>
                                <div>
                                    <h4 className="font-semibold mb-2 flex items-center gap-2"><Receipt className="h-4 w-4" /> Payment History</h4>
                                     {l.payments.length > 0 ? (
                                    <Table>
                                        <TableHeader><TableRow><TableHead>Date</TableHead><TableHead className="text-right">Amount (₹)</TableHead></TableRow></TableHeader>
                                        <TableBody>
                                            {[...l.payments].sort((a,b) => b.date.getTime() - a.date.getTime()).map(p => (
                                                <TableRow key={p.id}>
                                                    <TableCell>{format(p.date, 'dd MMM yyyy, hh:mm a')}</TableCell>
                                                    <TableCell className="text-right">{formatCurrency(p.amount)}</TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                     ) : <p className="text-sm text-muted-foreground">No payments recorded.</p>}
                                </div>
                            </div>
                        </CollapsibleContent>
                    </Collapsible>
                ))}
                {sortedLabourers.length === 0 && (
                    <div className="p-4 text-center text-muted-foreground">No labourer records found. Add one to get started.</div>
                )}
            </div>
          </div>
        </CardContent>
      </Card>
      
      <Dialog open={isPaymentDialogOpen} onOpenChange={setPaymentDialogOpen}>
          <DialogContent>
              <DialogHeader>
                  <DialogTitle>Make a Payment</DialogTitle>
              </DialogHeader>
              <Form {...paymentForm}>
                  <form onSubmit={paymentForm.handleSubmit(onPaymentSubmit)} className="space-y-4">
                      <FormField control={paymentForm.control} name="amount" render={({ field }) => (
                          <FormItem><FormLabel>Payment Amount (₹)</FormLabel><FormControl><Input type="number" step="0.01" placeholder="Enter amount" {...field} /></FormControl><FormMessage /></FormItem>
                      )} />
                      <Button type="submit" className="w-full bg-accent hover:bg-accent/90">Record Payment</Button>
                  </form>
              </Form>
          </DialogContent>
      </Dialog>
    </>
  );
}
