'use client';

import { useState, useMemo, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useStockData } from '@/context/stock-context';
import { useVehicleData } from '@/context/vehicle-context';
import { useLabourData } from '@/context/labour-context';
import { PlusCircle, ChevronDown, ChevronRight, Receipt, Car, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { format } from 'date-fns';
import { Separator } from '../ui/separator';
import type { PrivateSale } from '@/lib/types';

const saleFormSchema = z.object({
  source: z.enum(['private'], { required_error: 'Stock source is required' }),
  customerName: z.string().min(1, 'Customer name is required'),
  itemType: z.enum(['paddy', 'rice']),
  quantity: z.coerce.number().positive('Quantity must be positive'),
  rate: z.coerce.number().positive('Rate must be positive'),
  initialPayment: z.coerce.number().min(0, 'Initial payment cannot be negative').default(0),
  description: z.string().optional(),
  vehicleType: z.enum(['customer', 'own', 'hired'], { required_error: 'Vehicle type is required' }),
  vehicleNumber: z.string().optional(),
  driverName: z.string().optional(),
  ownerName: z.string().optional(),
  tripCharge: z.coerce.number().optional(),
  sourceLocation: z.string().optional(),
  destination: z.string().optional(),
  labourerId: z.string().optional(),
  labourCharge: z.coerce.number().optional(),
}).refine(data => {
    if (data.vehicleType === 'hired') {
        return !!data.vehicleNumber && !!data.driverName && !!data.ownerName && data.tripCharge !== undefined && data.tripCharge > 0;
    }
    return true;
}, {
    message: "Vehicle number, driver, owner, and a positive trip charge are required for hired vehicles.",
    path: ['tripCharge'],
});

const paymentFormSchema = z.object({
  amount: z.coerce.number().positive('Payment amount must be positive'),
});

export function PrivateSales() {
  const { sales, addSale, addSalePayment, privateStock } = useStockData();
  const { addVehicle, addTrip } = useVehicleData();
  const { labourers, addWorkEntry } = useLabourData();
  const { toast } = useToast();
  const [showForm, setShowForm] = useState(false);
  const [openCustomerCollapsibles, setOpenCustomerCollapsibles] = useState<Record<string, boolean>>({});
  const [isPaymentDialogOpen, setPaymentDialogOpen] = useState(false);
  const [selectedSale, setSelectedSale] = useState<string | null>(null);

  const saleForm = useForm<z.infer<typeof saleFormSchema>>({
    resolver: zodResolver(saleFormSchema),
    defaultValues: {
      source: 'private',
      customerName: '',
      itemType: 'paddy',
      quantity: 0,
      rate: 0,
      initialPayment: 0,
      description: '',
      vehicleType: 'customer',
      sourceLocation: 'Mill'
    },
  });

  const paymentForm = useForm<z.infer<typeof paymentFormSchema>>({
    resolver: zodResolver(paymentFormSchema),
    defaultValues: { amount: 0 },
  });

  const vehicleType = saleForm.watch('vehicleType');
  const customerNameValue = saleForm.watch('customerName');

  useEffect(() => {
    if (customerNameValue) {
      saleForm.setValue('destination', customerNameValue);
    }
  }, [customerNameValue, saleForm]);


  const customerAggregates = useMemo(() => {
    const customers: Record<string, { id: string, name: string, sales: any[] }> = {};
    sales.forEach(s => {
      if (!customers[s.customerName]) {
        customers[s.customerName] = { id: s.customerName.replace(/\s+/g, '-'), name: s.customerName, sales: [] };
      }
      customers[s.customerName].sales.push(s);
    });
    return Object.values(customers);
  }, [sales]);

  function onSaleSubmit(values: z.infer<typeof saleFormSchema>) {
    const stockSource = privateStock;
    const stockAvailable = values.itemType === 'paddy' ? stockSource.paddy : stockSource.rice;
    
    if (values.quantity > stockAvailable) {
        saleForm.setError('quantity', { message: `Exceeds available stock of ${stockAvailable.toLocaleString()} Qtl` });
        return;
    }
    
    const labourerId = values.labourerId === "none" ? undefined : values.labourerId;
    const submissionValues = { ...values, labourerId, source: values.sourceLocation };


    addSale(submissionValues);
    toast({
      title: 'Success!',
      description: 'New private sale has been recorded.',
    });

    if (submissionValues.vehicleType === 'hired' && submissionValues.vehicleNumber && submissionValues.tripCharge) {
        const vehicleId = addVehicle({
            vehicleNumber: submissionValues.vehicleNumber,
            driverName: submissionValues.driverName || '',
            ownerName: submissionValues.ownerName || '',
            rentType: 'per_trip',
            rentAmount: 0,
        });

        if (vehicleId) {
            addTrip(vehicleId, {
                source: submissionValues.source || 'Mill', 
                destination: submissionValues.destination || submissionValues.customerName,
                quantity: submissionValues.quantity,
                tripCharge: submissionValues.tripCharge,
            });
            toast({ title: 'Vehicle Updated', description: `Trip for ${submissionValues.vehicleNumber} has been added to Vehicle Register.` });
        }
    }

    if (submissionValues.labourerId && submissionValues.labourCharge) {
        addWorkEntry(submissionValues.labourerId, {
            description: `Loading ${submissionValues.itemType} for ${submissionValues.customerName}`,
            entryType: 'item_rate',
            itemName: `${submissionValues.itemType} loaded`,
            quantity: submissionValues.quantity,
            ratePerItem: submissionValues.labourCharge / submissionValues.quantity,
        });
        toast({ title: 'Labour Updated', description: 'Work entry added to Labour Register.' });
    }

    saleForm.reset();
    setShowForm(false);
  }

  function onPaymentSubmit(values: z.infer<typeof paymentFormSchema>) {
    if (selectedSale) {
      addSalePayment(selectedSale, values.amount);
      toast({
        title: 'Success!',
        description: 'Payment has been recorded.',
      });
      paymentForm.reset();
      setPaymentDialogOpen(false);
      setSelectedSale(null);
    }
  }

  const handlePaymentClick = (saleId: string) => {
    setSelectedSale(saleId);
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
              <CardTitle>Private Sale Records</CardTitle>
              <CardDescription>Add and view private sale records.</CardDescription>
            </div>
            <Button onClick={() => setShowForm(!showForm)} size="sm">
              <PlusCircle className="mr-2 h-4 w-4" />
              {showForm ? 'Cancel' : 'Add New Sale'}
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {showForm && (
            <Card className="bg-muted/50">
              <CardHeader>
                <CardTitle>New Private Sale</CardTitle>
              </CardHeader>
              <CardContent>
                <Form {...saleForm}>
                  <form onSubmit={saleForm.handleSubmit(onSaleSubmit)} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 items-start">
                      <FormField control={saleForm.control} name="source" render={({ field }) => (
                          <FormItem><FormLabel>Stock Source</FormLabel><Select onValueChange={field.onChange} defaultValue={field.value}><FormControl><SelectTrigger><SelectValue placeholder="Select a source..." /></SelectTrigger></FormControl><SelectContent><SelectItem value="private">Private</SelectItem></SelectContent></Select><FormMessage /></FormItem>
                      )} />
                      <FormField control={saleForm.control} name="customerName" render={({ field }) => (
                        <FormItem><FormLabel>Customer Name</FormLabel><FormControl><Input placeholder="e.g., Local Mill Corp" {...field} /></FormControl><FormMessage /></FormItem>
                      )} />
                      <FormField control={saleForm.control} name="itemType" render={({ field }) => (
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
                      <FormField control={saleForm.control} name="quantity" render={({ field }) => (
                        <FormItem><FormLabel>Quantity (Qtl)</FormLabel><FormControl><Input type="number" step="0.01" placeholder="100" {...field} /></FormControl><FormMessage /></FormItem>
                      )} />
                      <FormField control={saleForm.control} name="rate" render={({ field }) => (
                        <FormItem><FormLabel>Rate (₹ per Qtl)</FormLabel><FormControl><Input type="number" step="0.01" placeholder="2100" {...field} /></FormControl><FormMessage /></FormItem>
                      )} />
                      <FormField control={saleForm.control} name="initialPayment" render={({ field }) => (
                        <FormItem><FormLabel>Initial Amount Received (₹)</FormLabel><FormControl><Input type="number" step="0.01" placeholder="50000" {...field} /></FormControl><FormMessage /></FormItem>
                      )} />
                      </div>
                      <FormField control={saleForm.control} name="description" render={({ field }) => (
                        <FormItem><FormLabel>Description (Optional)</FormLabel><FormControl><Textarea placeholder="Add any notes for this sale..." {...field} /></FormControl><FormMessage /></FormItem>
                      )} />
                    
                      <Separator />

                      <div>
                        <h3 className="text-md font-medium mb-4 flex items-center gap-2"><Car className="h-5 w-5" /> Vehicle Details</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 items-start">
                           <FormField
                                control={saleForm.control}
                                name="vehicleType"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Vehicle Type</FormLabel>
                                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                                            <FormControl><SelectTrigger><SelectValue/></SelectTrigger></FormControl>
                                            <SelectContent>
                                                <SelectItem value="customer">Customer's Vehicle</SelectItem>
                                                <SelectItem value="own">Own Vehicle</SelectItem>
                                                <SelectItem value="hired">Hired Vehicle</SelectItem>
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )}
                           />
                           {vehicleType === 'hired' && (
                            <>
                                <FormField control={saleForm.control} name="vehicleNumber" render={({ field }) => (
                                    <FormItem><FormLabel>Vehicle Number</FormLabel><FormControl><Input placeholder="OD01AB1234" {...field} /></FormControl><FormMessage /></FormItem>
                                )} />
                                 <FormField control={saleForm.control} name="driverName" render={({ field }) => (
                                    <FormItem><FormLabel>Driver Name</FormLabel><FormControl><Input placeholder="Suresh" {...field} /></FormControl><FormMessage /></FormItem>
                                )} />
                                <FormField control={saleForm.control} name="ownerName" render={({ field }) => (
                                    <FormItem><FormLabel>Owner/Agency</FormLabel><FormControl><Input placeholder="Gupta Transports" {...field} /></FormControl><FormMessage /></FormItem>
                                )} />
                                <FormField control={saleForm.control} name="tripCharge" render={({ field }) => (
                                    <FormItem><FormLabel>Trip Charge (₹)</FormLabel><FormControl><Input type="number" step="10" placeholder="2500" {...field} /></FormControl><FormMessage /></FormItem>
                                )} />
                                <FormField control={saleForm.control} name="sourceLocation" render={({ field }) => (
                                    <FormItem><FormLabel>Source</FormLabel><FormControl><Input placeholder="Source location" {...field} /></FormControl><FormMessage /></FormItem>
                                )} />
                                <FormField control={saleForm.control} name="destination" render={({ field }) => (
                                    <FormItem><FormLabel>Destination</FormLabel><FormControl><Input placeholder="Destination location" {...field} /></FormControl><FormMessage /></FormItem>
                                )} />
                            </>
                           )}
                        </div>
                      </div>

                      <Separator />

                      <div>
                          <h3 className="text-md font-medium mb-4 flex items-center gap-2"><Users className="h-5 w-5" /> Labour Details</h3>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <FormField
                                  control={saleForm.control}
                                  name="labourerId"
                                  render={({ field }) => (
                                  <FormItem>
                                      <FormLabel>Assign Labourer (Optional)</FormLabel>
                                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                                      <FormControl><SelectTrigger><SelectValue placeholder="Select a labourer" /></SelectTrigger></FormControl>
                                      <SelectContent>
                                          <SelectItem value="none">None</SelectItem>
                                          {labourers.map((l) => (
                                          <SelectItem key={l.id} value={l.id}>{l.name}</SelectItem>
                                          ))}
                                      </SelectContent>
                                      </Select>
                                      <FormMessage />
                                  </FormItem>
                                  )}
                              />
                              <FormField control={saleForm.control} name="labourCharge" render={({ field }) => (
                                  <FormItem><FormLabel>Total Labour Charge (₹)</FormLabel><FormControl><Input type="number" step="10" placeholder="e.g., 250" {...field} /></FormControl><FormMessage /></FormItem>
                              )} />
                          </div>
                      </div>

                    <Button type="submit" className="w-full md:w-auto bg-accent hover:bg-accent/90">Add Sale</Button>
                  </form>
                </Form>
              </CardContent>
            </Card>
          )}

          <div>
            <h3 className="text-lg font-semibold mb-2">Customer Sale History</h3>
            <div className="border rounded-lg">
                {customerAggregates.map(customer => (
                    <Collapsible 
                        key={customer.id}
                        open={openCustomerCollapsibles[customer.id] || false}
                        onOpenChange={(isOpen) => setOpenCustomerCollapsibles(prev => ({...prev, [customer.id]: isOpen}))}
                        className="border-b last:border-b-0"
                    >
                        <CollapsibleTrigger className="w-full p-4 flex items-center justify-between hover:bg-muted/50 transition-colors">
                            <div className="flex items-center gap-2">
                                {openCustomerCollapsibles[customer.id] ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                                <span className="font-medium">{customer.name}</span>
                            </div>
                            <Button size="sm" variant="outline" onClick={(e) => { e.stopPropagation(); saleForm.setValue('customerName', customer.name); setShowForm(true); window.scrollTo({top: 0, behavior: 'smooth'}); }}>
                                <PlusCircle className="mr-2 h-4 w-4" /> Add Sale
                            </Button>
                        </CollapsibleTrigger>
                        <CollapsibleContent>
                            <div className="px-4 pb-4">
                                <h4 className="font-semibold text-md my-2">Sale Details</h4>
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Date</TableHead>
                                            <TableHead>Type</TableHead>
                                            <TableHead>Vehicle Type</TableHead>
                                            <TableHead>Rent (₹)</TableHead>
                                            <TableHead className="text-right">Qty (Qtl)</TableHead>
                                            <TableHead className="text-right">Rate (₹)</TableHead>
                                            <TableHead className="text-right">Total (₹)</TableHead>
                                            <TableHead className="text-right">Received (₹)</TableHead>
                                            <TableHead className="text-right">Balance (₹)</TableHead>
                                            <TableHead className="text-right">Actions</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {customer.sales.map((s: PrivateSale) => (
                                             <Collapsible key={s.id} asChild>
                                                <>
                                                    <TableRow>
                                                        <TableCell>{format(s.date, 'dd MMM yyyy')}</TableCell>
                                                        <TableCell className="capitalize">{s.itemType}</TableCell>
                                                        <TableCell className="capitalize">{s.vehicleType?.replace('_', ' ') || 'N/A'}</TableCell>
                                                        <TableCell>{s.tripCharge ? formatCurrency(s.tripCharge) : '-'}</TableCell>
                                                        <TableCell className="text-right">{s.quantity.toLocaleString('en-IN')}</TableCell>
                                                        <TableCell className="text-right">{formatCurrency(s.rate)}</TableCell>
                                                        <TableCell className="text-right">{formatCurrency(s.totalAmount)}</TableCell>
                                                        <TableCell className="text-right">{formatCurrency(s.amountReceived)}</TableCell>
                                                        <TableCell className={`text-right font-semibold ${s.balance < 0 ? 'text-green-600' : s.balance > 0 ? 'text-destructive' : ''}`}>
                                                            {s.balance < 0 ? `${formatCurrency(Math.abs(s.balance))} (Credit)` : formatCurrency(s.balance)}
                                                        </TableCell>
                                                        <TableCell className="text-right">
                                                            <div className="flex gap-2 justify-end">
                                                                <Button size="sm" variant="secondary" onClick={() => handlePaymentClick(s.id)}>Receive</Button>
                                                                <CollapsibleTrigger asChild>
                                                                    <Button size="sm" variant="ghost"><Receipt className="h-4 w-4" /></Button>
                                                                </CollapsibleTrigger>
                                                            </div>
                                                        </TableCell>
                                                    </TableRow>
                                                    <CollapsibleContent asChild>
                                                        <tr className="bg-muted/50">
                                                            <TableCell colSpan={10} className="p-0">
                                                                <div className="p-4">
                                                                    <h4 className="font-semibold mb-2">Payment History for Sale on {format(s.date, 'dd MMM yyyy')}</h4>
                                                                    {s.payments.length > 0 ? (
                                                                        <Table>
                                                                            <TableHeader><TableRow><TableHead>Date</TableHead><TableHead className="text-right">Amount (₹)</TableHead></TableRow></TableHeader>
                                                                            <TableBody>
                                                                                {[...s.payments].sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime()).map((payment: any) => (
                                                                                    <TableRow key={payment.id}>
                                                                                        <TableCell>{format(payment.date, 'dd MMM yyyy, hh:mm a')}</TableCell>
                                                                                        <TableCell className="text-right">{formatCurrency(payment.amount)}</TableCell>
                                                                                    </TableRow>
                                                                                ))}
                                                                            </TableBody>
                                                                        </Table>
                                                                    ) : <p className="text-sm text-muted-foreground">No payments received for this sale yet.</p>}
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
                {customerAggregates.length === 0 && (
                    <div className="p-4 text-center text-muted-foreground">No sale records found.</div>
                )}
            </div>
          </div>
        </CardContent>
      </Card>
      
      <Dialog open={isPaymentDialogOpen} onOpenChange={setPaymentDialogOpen}>
          <DialogContent>
              <DialogHeader>
                  <DialogTitle>Receive a Payment</DialogTitle>
              </DialogHeader>
              <Form {...paymentForm}>
                  <form onSubmit={paymentForm.handleSubmit(onPaymentSubmit)} className="space-y-4">
                      <FormField control={paymentForm.control} name="amount" render={({ field }) => (
                          <FormItem><FormLabel>Payment Amount Received (₹)</FormLabel><FormControl><Input type="number" step="0.01" placeholder="Enter amount" {...field} /></FormControl><FormMessage /></FormItem>
                      )} />
                      <Button type="submit" className="w-full bg-accent hover:bg-accent/90">Record Payment</Button>
                  </form>
              </Form>
          </DialogContent>
      </Dialog>
    </>
  );
}

    