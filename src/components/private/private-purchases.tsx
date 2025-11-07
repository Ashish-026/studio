'use client';

import { useState, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { usePrivateData } from '@/context/private-context';
import { PlusCircle, Wallet, ChevronDown, ChevronUp, Briefcase } from 'lucide-react';
import { format } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from '@/components/ui/dialog';
import type { PrivatePurchase } from '@/lib/types';
import { Badge } from '../ui/badge';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';

const formSchema = z.object({
  mandiName: z.string().min(1, 'Mandi name is required'),
  itemType: z.enum(['paddy', 'rice'], { required_error: 'Item type is required' }),
  farmerName: z.string().min(1, 'Farmer name is required'),
  quantity: z.coerce.number().positive('Must be a positive number'),
  rate: z.coerce.number().positive('Must be a positive number'),
  amountPaid: z.coerce.number().min(0, 'Cannot be negative'),
  description: z.string().optional(),
});

const paymentSchema = z.object({
    paymentAmount: z.coerce.number().positive('Payment amount must be positive.'),
});

export function PrivatePurchases() {
  const { purchases, addPurchase, addPayment } = usePrivateData();
  const { toast } = useToast();
  const [showForm, setShowForm] = useState(false);
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);
  const [selectedPurchase, setSelectedPurchase] = useState<PrivatePurchase | null>(null);
  const [openPurchase, setOpenPurchase] = useState<string | null>(null);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      mandiName: '',
      farmerName: '',
      amountPaid: 0,
      description: '',
    },
  });

  const paymentForm = useForm<z.infer<typeof paymentSchema>>({
    resolver: zodResolver(paymentSchema),
  });
  
  const farmers = useMemo(() => {
    const farmerMap = new Map<string, PrivatePurchase[]>();
    purchases.forEach(p => {
        const existing = farmerMap.get(p.farmerName) || [];
        farmerMap.set(p.farmerName, [...existing, p]);
    });
    return Array.from(farmerMap.entries()).map(([name, purchases]) => ({
      name,
      purchases,
      totalBalance: purchases.reduce((sum, p) => sum + p.balance, 0),
    }));
  }, [purchases]);

  function onSubmit(values: z.infer<typeof formSchema>) {
    addPurchase(values);
    toast({
      title: 'Success!',
      description: 'Private purchase record has been added.',
    });
    form.reset();
    setShowForm(false);
  }

  function handleAddNewPurchase(farmerName?: string) {
    form.reset({
        mandiName: '',
        farmerName: farmerName || '',
        amountPaid: 0,
        description: '',
    });
    setShowForm(true);
  }

  function handleOpenPaymentDialog(purchase: PrivatePurchase) {
    setSelectedPurchase(purchase);
    paymentForm.reset();
    setPaymentDialogOpen(true);
  }

  function onPaymentSubmit(values: z.infer<typeof paymentSchema>) {
    if (!selectedPurchase) return;

    addPayment(selectedPurchase.id, values.paymentAmount);
    toast({
      title: 'Payment Added',
      description: `Payment of ${formatCurrency(values.paymentAmount)} for ${selectedPurchase.farmerName} has been recorded.`,
    });
    setPaymentDialogOpen(false);
    setSelectedPurchase(null);
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 2,
    }).format(amount);
  }

  const togglePurchaseRow = (id: string) => {
    setOpenPurchase(openPurchase === id ? null : id);
  };

  return (
    <>
    <Card>
      <CardHeader>
        <div className="flex justify-between items-start">
          <div>
            <CardTitle>Private Purchase Records</CardTitle>
            <CardDescription>View and manage paddy/rice purchases from private mandis, grouped by farmer.</CardDescription>
          </div>
          <Button onClick={() => handleAddNewPurchase()} size="sm">
            <PlusCircle className="mr-2 h-4 w-4" />
            {showForm ? 'Cancel' : 'Add New Entry'}
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
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
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
                            <FormItem><FormLabel>Initial Amount Paid (₹)</FormLabel><FormControl><Input type="number" step="0.01" placeholder="0" {...field} /></FormControl><FormMessage /></FormItem>
                        )} />
                    </div>
                     <FormField control={form.control} name="description" render={({ field }) => (
                        <FormItem><FormLabel>Description</FormLabel><FormControl><Textarea placeholder="Add a short description..." {...field} /></FormControl><FormMessage /></FormItem>
                    )} />
                    <div className="flex gap-2">
                        <Button type="submit" className="bg-accent hover:bg-accent/90">Add Purchase</Button>
                        <Button type="button" variant="ghost" onClick={() => setShowForm(false)}>Cancel</Button>
                    </div>
                </form>
              </Form>
            </CardContent>
          </Card>
        )}

        <div>
            <h3 className="text-lg font-semibold mb-2">Farmer Accounts</h3>
             {farmers.length === 0 && !showForm && (
                <p className="text-center text-muted-foreground py-4">No purchases recorded yet.</p>
            )}
            <Accordion type="single" collapsible className="w-full">
              {farmers.map(farmer => (
                <AccordionItem value={farmer.name} key={farmer.name}>
                  <AccordionTrigger>
                    <div className="flex justify-between w-full pr-4">
                        <div className="flex items-center gap-2">
                            <Briefcase className="h-5 w-5 text-primary" />
                            <span className="font-semibold text-lg">{farmer.name}</span>
                        </div>
                        <div className='text-right'>
                            <div className="text-sm">Total Balance</div>
                             {farmer.totalBalance > 0 ? (
                                <span className="text-destructive font-semibold">{formatCurrency(farmer.totalBalance)}</span>
                            ) : farmer.totalBalance < 0 ? (
                                <Badge variant="secondary" className="text-green-600 border-green-600/50 font-semibold">
                                    {formatCurrency(Math.abs(farmer.totalBalance))} Advance
                                </Badge>
                            ) : (
                                <span className="text-green-600 font-semibold">{formatCurrency(0)}</span>
                            )}
                        </div>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="p-2 bg-muted/30">
                    <div className="flex justify-end mb-2">
                        <Button size="sm" variant="outline" onClick={() => handleAddNewPurchase(farmer.name)}>
                            <PlusCircle className="h-4 w-4 mr-2" /> Add New Purchase for {farmer.name}
                        </Button>
                    </div>
                    <div className="border rounded-lg">
                        <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="w-[50px]"></TableHead>
                                <TableHead>Description</TableHead>
                                <TableHead>Item</TableHead>
                                <TableHead className="text-right">Total (₹)</TableHead>
                                <TableHead className="text-right">Paid (₹)</TableHead>
                                <TableHead className="text-right">Balance / Advance (₹)</TableHead>
                                <TableHead className="text-center">Action</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {farmer.purchases.map((item) => (
                            <Collapsible asChild key={item.id} open={openPurchase === item.id} onOpenChange={() => togglePurchaseRow(item.id)}>
                                <>
                                <TableRow className="cursor-pointer bg-background" onClick={() => togglePurchaseRow(item.id)}>
                                    <TableCell>
                                        <CollapsibleTrigger asChild>
                                            <Button variant="ghost" size="sm" className="w-9 p-0">
                                                {openPurchase === item.id ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                                                <span className="sr-only">Toggle</span>
                                            </Button>
                                        </CollapsibleTrigger>
                                    </TableCell>
                                    <TableCell className="max-w-[200px] truncate">{item.description || '-'}<br/><span className="text-xs text-muted-foreground">{item.mandiName}</span></TableCell>
                                    <TableCell className="capitalize">{item.itemType} ({item.quantity.toLocaleString('en-IN')} Qtl)</TableCell>
                                    <TableCell className="text-right font-medium">{formatCurrency(item.totalAmount)}</TableCell>
                                    <TableCell className="text-right">{formatCurrency(item.amountPaid)}</TableCell>
                                    <TableCell className="text-right font-semibold">
                                        {item.balance > 0 ? (
                                            <span className="text-destructive">{formatCurrency(item.balance)}</span>
                                        ) : item.balance < 0 ? (
                                            <Badge variant="secondary" className="text-green-600 border-green-600/50">
                                                {formatCurrency(Math.abs(item.balance))} Advance
                                            </Badge>
                                        ) : (
                                            <span className="text-green-600">{formatCurrency(0)}</span>
                                        )}
                                    </TableCell>
                                    <TableCell className="text-center" onClick={(e) => e.stopPropagation()}>
                                        <Button variant="outline" size="sm" onClick={() => handleOpenPaymentDialog(item)}>
                                            <Wallet className="mr-2 h-4 w-4" />
                                            Pay
                                        </Button>
                                    </TableCell>
                                </TableRow>
                                <CollapsibleContent asChild>
                                <TableRow className="bg-muted/50 hover:bg-muted/50">
                                        <TableCell colSpan={7} className="p-0">
                                            <div className="p-4">
                                                <h4 className="font-semibold mb-2">Payment History for Purchase on {format(item.payments[0]?.date || new Date(), 'dd MMM yyyy')}</h4>
                                                {item.payments.length > 0 ? (
                                                    <Table>
                                                        <TableHeader>
                                                            <TableRow>
                                                                <TableHead>Date</TableHead>
                                                                <TableHead className="text-right">Amount Paid (₹)</TableHead>
                                                            </TableRow>
                                                        </TableHeader>
                                                        <TableBody>
                                                            {item.payments.map(payment => (
                                                                <TableRow key={payment.id}>
                                                                    <TableCell>{format(payment.date, 'dd MMM yyyy, p')}</TableCell>
                                                                    <TableCell className="text-right">{formatCurrency(payment.amount)}</TableCell>
                                                                </TableRow>
                                                            ))}
                                                        </TableBody>
                                                    </Table>
                                                ) : (
                                                    <p className="text-sm text-muted-foreground text-center py-2">No payments recorded for this purchase yet.</p>
                                                )}
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                </CollapsibleContent>
                                </>
                            </Collapsible>
                            ))}
                        </TableBody>
                        </Table>
                    </div>
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
        </div>
      </CardContent>
    </Card>
    
    <Dialog open={paymentDialogOpen} onOpenChange={setPaymentDialogOpen}>
        <DialogContent>
            <DialogHeader>
                <DialogTitle>Make a Payment</DialogTitle>
                <DialogDescription>
                    Record a new payment for <span className="font-semibold">{selectedPurchase?.farmerName}</span>.
                    <br />
                     {selectedPurchase && selectedPurchase.balance > 0 ? (
                        <>Outstanding Balance for this purchase: <span className="font-semibold">{formatCurrency(selectedPurchase.balance)}</span></>
                    ) : selectedPurchase && selectedPurchase.balance < 0 ? (
                        <>Current Advance on this purchase: <span className="font-semibold">{formatCurrency(Math.abs(selectedPurchase.balance))}</span></>
                    ) : (
                        "This purchase is fully settled."
                    )}
                </DialogDescription>
            </DialogHeader>
            <Form {...paymentForm}>
                <form onSubmit={paymentForm.handleSubmit(onPaymentSubmit)} className="space-y-4">
                    <FormField
                        control={paymentForm.control}
                        name="paymentAmount"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Payment Amount (₹)</FormLabel>
                                <FormControl>
                                    <Input type="number" step="0.01" placeholder="Enter amount to pay" {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                    <DialogFooter>
                        <DialogClose asChild>
                            <Button type="button" variant="secondary">Cancel</Button>
                        </DialogClose>
                        <Button type="submit">Record Payment</Button>
                    </DialogFooter>
                </form>
            </Form>
        </DialogContent>
    </Dialog>
    </>
  );
}
