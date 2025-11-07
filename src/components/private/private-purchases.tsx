'use client';

import { useState, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { usePrivateData } from '@/context/private-context';
import { PlusCircle, ChevronDown, ChevronRight, Receipt } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { format } from 'date-fns';

const purchaseFormSchema = z.object({
  farmerName: z.string().min(1, 'Farmer name is required'),
  itemType: z.enum(['paddy', 'rice']),
  quantity: z.coerce.number().positive('Quantity must be a positive number'),
  rate: z.coerce.number().positive('Rate must be a positive number'),
  initialPayment: z.coerce.number().min(0, 'Initial payment cannot be negative'),
  description: z.string().optional(),
});

const paymentFormSchema = z.object({
  amount: z.coerce.number().positive('Payment amount must be positive'),
});

export function PrivatePurchases() {
  const { purchases, addPurchase, addPayment } = usePrivateData();
  const { toast } = useToast();
  const [showForm, setShowForm] = useState(false);
  const [openFarmerCollapsibles, setOpenFarmerCollapsibles] = useState<Record<string, boolean>>({});
  const [isPaymentDialogOpen, setPaymentDialogOpen] = useState(false);
  const [selectedPurchase, setSelectedPurchase] = useState<string | null>(null);

  const purchaseForm = useForm<z.infer<typeof purchaseFormSchema>>({
    resolver: zodResolver(purchaseFormSchema),
    defaultValues: {
      farmerName: '',
      itemType: 'paddy',
      quantity: 0,
      rate: 0,
      initialPayment: 0,
      description: '',
    },
  });

  const paymentForm = useForm<z.infer<typeof paymentFormSchema>>({
    resolver: zodResolver(paymentFormSchema),
    defaultValues: { amount: 0 },
  });

  const farmerAggregates = useMemo(() => {
    const farmers: Record<string, { id: string, name: string, purchases: any[] }> = {};
    purchases.forEach(p => {
      if (!farmers[p.farmerName]) {
        // Use a consistent ID for the farmer group based on the name
        farmers[p.farmerName] = { id: p.farmerName.replace(/\s+/g, '-'), name: p.farmerName, purchases: [] };
      }
      farmers[p.farmerName].purchases.push(p);
    });
    return Object.values(farmers);
  }, [purchases]);

  function onPurchaseSubmit(values: z.infer<typeof purchaseFormSchema>) {
    addPurchase(values);
    toast({
      title: 'Success!',
      description: 'New private purchase has been recorded.',
    });
    purchaseForm.reset();
    setShowForm(false);
  }

  function onPaymentSubmit(values: z.infer<typeof paymentFormSchema>) {
    if (selectedPurchase) {
      addPayment(selectedPurchase, values.amount);
      toast({
        title: 'Success!',
        description: 'Payment has been recorded.',
      });
      paymentForm.reset();
      setPaymentDialogOpen(false);
      setSelectedPurchase(null);
    }
  }

  const handlePaymentClick = (purchaseId: string) => {
    setSelectedPurchase(purchaseId);
    setPaymentDialogOpen(true);
  };
  
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 2,
    }).format(amount);
  }

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex justify-between items-start">
            <div>
              <CardTitle>Private Purchase Records</CardTitle>
              <CardDescription>Add and view private purchase records.</CardDescription>
            </div>
            <Button onClick={() => setShowForm(!showForm)} size="sm">
              <PlusCircle className="mr-2 h-4 w-4" />
              {showForm ? 'Cancel' : 'Add New Purchase'}
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
                <Form {...purchaseForm}>
                  <form onSubmit={purchaseForm.handleSubmit(onPurchaseSubmit)} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 items-start">
                    <FormField control={purchaseForm.control} name="farmerName" render={({ field }) => (
                      <FormItem><FormLabel>Farmer Name</FormLabel><FormControl><Input placeholder="e.g., Gopal Verma" {...field} /></FormControl><FormMessage /></FormItem>
                    )} />
                    <FormField control={purchaseForm.control} name="itemType" render={({ field }) => (
                      <FormItem>
                        <FormLabel>Item Type</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl><SelectTrigger><SelectValue placeholder="Select item type" /></SelectTrigger></FormControl>
                          <SelectContent>
                            <SelectItem value="paddy">Paddy</SelectItem>
                            <SelectItem value="rice">Rice</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )} />
                    <FormField control={purchaseForm.control} name="quantity" render={({ field }) => (
                      <FormItem><FormLabel>Quantity (Qtl)</FormLabel><FormControl><Input type="number" step="0.01" placeholder="150" {...field} /></FormControl><FormMessage /></FormItem>
                    )} />
                    <FormField control={purchaseForm.control} name="rate" render={({ field }) => (
                      <FormItem><FormLabel>Rate (₹ per Qtl)</FormLabel><FormControl><Input type="number" step="0.01" placeholder="2000" {...field} /></FormControl><FormMessage /></FormItem>
                    )} />
                    <FormField control={purchaseForm.control} name="initialPayment" render={({ field }) => (
                      <FormItem><FormLabel>Initial Amount Paid (₹)</FormLabel><FormControl><Input type="number" step="0.01" placeholder="50000" {...field} /></FormControl><FormMessage /></FormItem>
                    )} />
                    <FormField control={purchaseForm.control} name="description" render={({ field }) => (
                      <FormItem className="lg:col-span-3"><FormLabel>Description (Optional)</FormLabel><FormControl><Textarea placeholder="Add any notes for this purchase..." {...field} /></FormControl><FormMessage /></FormItem>
                    )} />
                    <Button type="submit" className="w-full md:w-auto md:col-span-full bg-accent hover:bg-accent/90">Add Purchase</Button>
                  </form>
                </Form>
              </CardContent>
            </Card>
          )}

          <div>
            <h3 className="text-lg font-semibold mb-2">Farmer Purchase History</h3>
            <div className="border rounded-lg">
                {farmerAggregates.map(farmer => (
                    <Collapsible 
                        key={farmer.id}
                        open={openFarmerCollapsibles[farmer.id] || false}
                        onOpenChange={(isOpen) => setOpenFarmerCollapsibles(prev => ({...prev, [farmer.id]: isOpen}))}
                        className="border-b last:border-b-0"
                    >
                        <CollapsibleTrigger className="w-full p-4 flex items-center justify-between hover:bg-muted/50 transition-colors">
                            <div className="flex items-center gap-2">
                                {openFarmerCollapsibles[farmer.id] ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                                <span className="font-medium">{farmer.name}</span>
                            </div>
                            <Button size="sm" variant="outline" onClick={(e) => { e.stopPropagation(); purchaseForm.setValue('farmerName', farmer.name); setShowForm(true); window.scrollTo({top: 0, behavior: 'smooth'}); }}>
                                <PlusCircle className="mr-2 h-4 w-4" /> Add Purchase
                            </Button>
                        </CollapsibleTrigger>
                        <CollapsibleContent>
                            <div className="px-4 pb-4">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Date</TableHead>
                                            <TableHead>Type</TableHead>
                                            <TableHead>Description</TableHead>
                                            <TableHead className="text-right">Qty (Qtl)</TableHead>
                                            <TableHead className="text-right">Rate (₹)</TableHead>
                                            <TableHead className="text-right">Total (₹)</TableHead>
                                            <TableHead className="text-right">Paid (₹)</TableHead>
                                            <TableHead className="text-right">Balance (₹)</TableHead>
                                            <TableHead className="text-right">Actions</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {farmer.purchases.map((p: any) => (
                                             <Collapsible key={p.id} asChild>
                                                <>
                                                    <TableRow>
                                                        <TableCell>{format(p.date, 'dd MMM yyyy')}</TableCell>
                                                        <TableCell className="capitalize">{p.itemType}</TableCell>
                                                        <TableCell className="max-w-[200px] truncate">{p.description || '-'}</TableCell>
                                                        <TableCell className="text-right">{p.quantity.toLocaleString('en-IN')}</TableCell>
                                                        <TableCell className="text-right">{formatCurrency(p.rate)}</TableCell>
                                                        <TableCell className="text-right">{formatCurrency(p.totalAmount)}</TableCell>
                                                        <TableCell className="text-right">{formatCurrency(p.amountPaid)}</TableCell>
                                                        <TableCell className={`text-right font-semibold ${p.balance < 0 ? 'text-green-600' : p.balance > 0 ? 'text-destructive' : ''}`}>
                                                            {p.balance < 0 ? `${formatCurrency(Math.abs(p.balance))} (Adv)` : formatCurrency(p.balance)}
                                                        </TableCell>
                                                        <TableCell className="text-right">
                                                            <div className="flex gap-2 justify-end">
                                                                <Button size="sm" variant="secondary" onClick={() => handlePaymentClick(p.id)}>Pay</Button>
                                                                <CollapsibleTrigger asChild>
                                                                    <Button size="sm" variant="ghost"><Receipt className="h-4 w-4" /></Button>
                                                                </CollapsibleTrigger>
                                                            </div>
                                                        </TableCell>
                                                    </TableRow>
                                                    <CollapsibleContent asChild>
                                                        <tr className="bg-muted/50">
                                                            <TableCell colSpan={9} className="p-0">
                                                                <div className="p-4">
                                                                    <h4 className="font-semibold mb-2">Payment History</h4>
                                                                    {p.payments.length > 0 ? (
                                                                        <Table>
                                                                            <TableHeader><TableRow><TableHead>Date</TableHead><TableHead className="text-right">Amount (₹)</TableHead></TableRow></TableHeader>
                                                                            <TableBody>
                                                                                {[...p.payments].sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime()).map((payment: any) => (
                                                                                    <TableRow key={payment.id}>
                                                                                        <TableCell>{format(payment.date, 'dd MMM yyyy, hh:mm a')}</TableCell>
                                                                                        <TableCell className="text-right">{formatCurrency(payment.amount)}</TableCell>
                                                                                    </TableRow>
                                                                                ))}
                                                                            </TableBody>
                                                                        </Table>
                                                                    ) : <p className="text-sm text-muted-foreground">No payments recorded for this purchase yet.</p>}
                                                                </div>
                                                            </TableCell>
                                                        </tr>
                                                    </CollapsibleContent>
                                                </>
                                            </Collapsible>
                                        ))}
                                    </TableBody>
                                </Table>
                            </div>
                        </CollapsibleContent>
                    </Collapsible>
                ))}
                {farmerAggregates.length === 0 && (
                    <div className="p-4 text-center text-muted-foreground">No purchase records found.</div>
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
