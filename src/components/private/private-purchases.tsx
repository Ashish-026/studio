'use client';

import { useState, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useStockData } from '@/context/stock-context';
import { useVehicleData } from '@/context/vehicle-context';
import { PlusCircle, ChevronDown, ChevronRight, Receipt, Download, Car } from 'lucide-react';
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
import { downloadPdf } from '@/lib/pdf-utils';
import { Separator } from '../ui/separator';

const purchaseFormSchema = z.object({
  farmerName: z.string().min(1, 'Farmer name is required'),
  itemType: z.enum(['paddy', 'rice']),
  quantity: z.coerce.number().positive('Quantity must be a positive number'),
  rate: z.coerce.number().positive('Rate must be a positive number'),
  initialPayment: z.coerce.number().min(0, 'Initial payment cannot be negative'),
  description: z.string().optional(),
  vehicleType: z.enum(['farmer', 'own', 'hired'], { required_error: 'Vehicle type is required' }),
  vehicleNumber: z.string().optional(),
  driverName: z.string().optional(),
  ownerName: z.string().optional(),
  tripCharge: z.coerce.number().optional(),
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

export function PrivatePurchases() {
  const { purchases, addPurchase, addPayment } = useStockData();
  const { addVehicle, addTrip } = useVehicleData();
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
      vehicleType: 'farmer',
    },
  });

  const paymentForm = useForm<z.infer<typeof paymentFormSchema>>({
    resolver: zodResolver(paymentFormSchema),
    defaultValues: { amount: 0 },
  });

  const vehicleType = purchaseForm.watch('vehicleType');

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

    if (values.vehicleType === 'hired' && values.vehicleNumber && values.tripCharge) {
        const vehicleId = addVehicle({
            vehicleNumber: values.vehicleNumber,
            driverName: values.driverName || '',
            ownerName: values.ownerName || '',
            rentType: 'per_trip',
            rentAmount: 0,
        });

        if (vehicleId) {
            addTrip(vehicleId, {
                source: values.farmerName, 
                destination: 'Mill',
                quantity: values.quantity,
                tripCharge: values.tripCharge,
            });
            toast({ title: 'Vehicle Updated', description: `Trip for ${values.vehicleNumber} has been added to Vehicle Register.` });
        }
      }

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
                  <form onSubmit={purchaseForm.handleSubmit(onPurchaseSubmit)} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 items-start">
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
                    </div>
                    <FormField control={purchaseForm.control} name="description" render={({ field }) => (
                        <FormItem><FormLabel>Description (Optional)</FormLabel><FormControl><Textarea placeholder="Add any notes for this purchase..." {...field} /></FormControl><FormMessage /></FormItem>
                      )} />
                    
                    <Separator />

                    <div>
                        <h3 className="text-md font-medium mb-4 flex items-center gap-2"><Car className="h-5 w-5" /> Vehicle Details</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 items-start">
                           <FormField
                                control={purchaseForm.control}
                                name="vehicleType"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Vehicle Type</FormLabel>
                                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                                            <FormControl><SelectTrigger><SelectValue/></SelectTrigger></FormControl>
                                            <SelectContent>
                                                <SelectItem value="farmer">Farmer's Vehicle</SelectItem>
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
                                <FormField control={purchaseForm.control} name="vehicleNumber" render={({ field }) => (
                                    <FormItem><FormLabel>Vehicle Number</FormLabel><FormControl><Input placeholder="OD01AB1234" {...field} /></FormControl><FormMessage /></FormItem>
                                )} />
                                 <FormField control={purchaseForm.control} name="driverName" render={({ field }) => (
                                    <FormItem><FormLabel>Driver Name</FormLabel><FormControl><Input placeholder="Suresh" {...field} /></FormControl><FormMessage /></FormItem>
                                )} />
                                <FormField control={purchaseForm.control} name="ownerName" render={({ field }) => (
                                    <FormItem><FormLabel>Owner/Agency</FormLabel><FormControl><Input placeholder="Gupta Transports" {...field} /></FormControl><FormMessage /></FormItem>
                                )} />
                                <FormField control={purchaseForm.control} name="tripCharge" render={({ field }) => (
                                    <FormItem><FormLabel>Trip Charge (₹)</FormLabel><FormControl><Input type="number" step="10" placeholder="2500" {...field} /></FormControl><FormMessage /></FormItem>
                                )} />
                            </>
                           )}
                        </div>
                    </div>


                    <Button type="submit" className="w-full md:w-auto bg-accent hover:bg-accent/90">Add Purchase</Button>
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
                            <div className="flex items-center gap-2">
                                <Button size="sm" variant="outline" onClick={(e) => { e.stopPropagation(); downloadPdf(`farmer-summary-${farmer.id}`, `purchase-summary-${farmer.name.toLowerCase().replace(/\s+/g, '-')}`) }}>
                                    <Download className="mr-2 h-4 w-4" /> PDF
                                </Button>
                                <Button size="sm" variant="outline" onClick={(e) => { e.stopPropagation(); purchaseForm.setValue('farmerName', farmer.name); setShowForm(true); window.scrollTo({top: 0, behavior: 'smooth'}); }}>
                                    <PlusCircle className="mr-2 h-4 w-4" /> Add Purchase
                                </Button>
                            </div>
                        </CollapsibleTrigger>
                        <CollapsibleContent>
                            <div className="px-4 pb-4" id={`farmer-summary-${farmer.id}`}>
                                <h4 className="font-semibold text-md my-2">Purchase Details for {farmer.name}</h4>
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Date</TableHead>
                                            <TableHead>Type</TableHead>
                                            <TableHead>Vehicle Type</TableHead>
                                            <TableHead>Rent(₹)</TableHead>
                                            <TableHead className="text-right">Qty (Qtl)</TableHead>
                                            <TableHead className="text-right">Rate (₹)</TableHead>
                                            <TableHead className="text-right">Total (₹)</TableHead>
                                            <TableHead className="text-right">Paid (₹)</TableHead>
                                            <TableHead className="text-right">Balance (₹)</TableHead>
                                            <TableHead className="text-right print:hidden">Actions</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {farmer.purchases.map((p: any) => (
                                             <Collapsible key={p.id} asChild>
                                                <>
                                                    <TableRow>
                                                        <TableCell>{format(p.date, 'dd MMM yyyy')}</TableCell>
                                                        <TableCell className="capitalize">{p.itemType}</TableCell>
                                                        <TableCell className="capitalize">{p.vehicleType?.replace('_', ' ') || 'N/A'}</TableCell>
                                                        <TableCell>{p.tripCharge ? formatCurrency(p.tripCharge) : '-'}</TableCell>
                                                        <TableCell className="text-right">{p.quantity.toLocaleString('en-IN')}</TableCell>
                                                        <TableCell className="text-right">{formatCurrency(p.rate)}</TableCell>
                                                        <TableCell className="text-right">{formatCurrency(p.totalAmount)}</TableCell>
                                                        <TableCell className="text-right">{formatCurrency(p.amountPaid)}</TableCell>
                                                        <TableCell className={`text-right font-semibold ${p.balance < 0 ? 'text-green-600' : p.balance > 0 ? 'text-destructive' : ''}`}>
                                                            {p.balance < 0 ? `${formatCurrency(Math.abs(p.balance))} (Adv)` : formatCurrency(p.balance)}
                                                        </TableCell>
                                                        <TableCell className="text-right print:hidden">
                                                            <div className="flex gap-2 justify-end">
                                                                <Button size="sm" variant="secondary" onClick={() => handlePaymentClick(p.id)}>Pay</Button>
                                                                <CollapsibleTrigger asChild>
                                                                    <Button size="sm" variant="ghost"><Receipt className="h-4 w-4" /></Button>
                                                                </CollapsibleTrigger>
                                                            </div>
                                                        </TableCell>
                                                    </TableRow>
                                                    <CollapsibleContent asChild>
                                                        <tr className="bg-muted/50 print:hidden">
                                                            <TableCell colSpan={10} className="p-0">
                                                                <div className="p-4">
                                                                    <h4 className="font-semibold mb-2">Payment History for Purchase on {format(p.date, 'dd MMM yyyy')}</h4>
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
