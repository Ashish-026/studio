'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useStockData } from '@/context/stock-context';
import { useVehicleData } from '@/context/vehicle-context';
import { useLabourData } from '@/context/labour-context';
import { 
  PlusCircle, 
  ChevronDown, 
  ChevronRight, 
  Download, 
  Car, 
  Users, 
  User as UserIcon, 
  Trash2,
  Banknote,
  Receipt,
  CreditCard
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { format } from 'date-fns';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';

const labourDetailsSchema = z.object({
  numberOfLabours: z.coerce.number().min(0).default(0),
  labourerIds: z.array(z.object({ value: z.string().min(1, "Please select a labourer.") })).default([]),
  labourWageType: z.enum(['per_item', 'total_amount']).default('total_amount'),
  labourCharge: z.coerce.number().min(0).default(0),
});

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
}).merge(labourDetailsSchema).refine(data => {
    if (data.vehicleType === 'hired') {
        return !!data.vehicleNumber && !!data.driverName && !!data.ownerName && data.tripCharge !== undefined && data.tripCharge > 0;
    }
    return true;
}, {
    message: "Hired vehicle details are incomplete.",
    path: ['tripCharge'],
});

const paymentFormSchema = z.object({
    amount: z.coerce.number().positive('Amount must be positive'),
});

const formatCurrency = (amount: number) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', minimumFractionDigits: 2 }).format(amount);

export function PrivateSales() {
  const { sales, addSale, deleteSale, privateStock, addCustomerPaymentByName } = useStockData();
  const { addVehicle, addTrip } = useVehicleData();
  const { labourers, addGroupWorkEntry } = useLabourData();
  const { toast } = useToast();
  
  const [showForm, setShowForm] = useState(false);
  const [openCustomerCollapsibles, setOpenCustomerCollapsibles] = useState<Record<string, boolean>>({});
  const [isPayDialogOpen, setPayDialogOpen] = useState(false);
  const [selectedCustomerForPay, setSelectedCustomerForPay] = useState<string | null>(null);

  const saleForm = useForm<z.infer<typeof saleFormSchema>>({
    resolver: zodResolver(saleFormSchema),
    defaultValues: {
      source: 'private', customerName: '', itemType: 'rice', quantity: 0, rate: 0, initialPayment: 0,
      description: '', vehicleType: 'customer', sourceLocation: 'Mill', vehicleNumber: '',
      driverName: '', ownerName: '', tripCharge: 0, destination: '',
      numberOfLabours: 0, labourerIds: [], labourCharge: 0, labourWageType: 'total_amount',
    },
  });

  const payForm = useForm<z.infer<typeof paymentFormSchema>>({
    resolver: zodResolver(paymentFormSchema),
    defaultValues: { amount: 0 },
  });

  const { fields, replace } = useFieldArray({ control: saleForm.control, name: "labourerIds" });
  const numberOfLabours = saleForm.watch('numberOfLabours');

  useEffect(() => {
    const targetCount = Math.max(0, parseInt(String(numberOfLabours || 0)));
    if (fields.length === targetCount) return;
    const currentValues = saleForm.getValues('labourerIds') || [];
    const nextFields = Array.from({ length: targetCount }, (_, i) => currentValues[i] || { value: '' });
    replace(nextFields);
  }, [numberOfLabours, replace, saleForm, fields.length]);

  const customerAggregates = useMemo(() => {
    const customers: Record<string, { id: string, name: string, sales: any[], totalBalance: number, allPayments: any[] }> = {};
    (sales || []).forEach(s => {
      if (!customers[s.customerName]) {
        customers[s.customerName] = { id: s.customerName.replace(/\s+/g, '-').toLowerCase(), name: s.customerName, sales: [], totalBalance: 0, allPayments: [] };
      }
      customers[s.customerName].sales.push(s);
      customers[s.customerName].allPayments.push(...(s.payments || []));
    });
    Object.values(customers).forEach(c => {
        c.totalBalance = c.sales.reduce((acc, s) => acc + s.balance, 0);
        c.allPayments.sort((a,b) => b.date.getTime() - a.date.getTime());
    });
    return Object.values(customers).sort((a,b) => a.name.localeCompare(b.name));
  }, [sales]);

  function onSaleSubmit(values: z.infer<typeof saleFormSchema>) {
    const stockAvailable = values.itemType === 'paddy' ? privateStock.paddy : privateStock.rice;
    if (values.quantity > stockAvailable) {
        saleForm.setError('quantity', { message: `Only ${stockAvailable.toFixed(2)} Qtl available.` });
        return;
    }
    const labourerIds = values.labourerIds.map(l => l.value).filter(Boolean);
    addSale({ ...values, labourerIds });
    toast({ title: 'Success!', description: 'Sale recorded.' });

    if (values.vehicleType === 'hired' && values.vehicleNumber && values.tripCharge) {
        const vId = addVehicle({ vehicleNumber: values.vehicleNumber, driverName: values.driverName || '', ownerName: values.ownerName || '', rentType: 'per_trip', rentAmount: 0 });
        if (vId) addTrip(vId, { source: values.sourceLocation || 'Mill', destination: values.destination || values.customerName, quantity: values.quantity, tripCharge: values.tripCharge });
    }
    if (labourerIds.length > 0 && values.labourCharge > 0) addGroupWorkEntry(labourerIds, values.labourCharge, `Sale: ${values.customerName}`, values.quantity);
    
    saleForm.reset();
    setShowForm(false);
  }

  function onPaySubmit(values: z.infer<typeof paymentFormSchema>) {
    if (selectedCustomerForPay) {
        addCustomerPaymentByName(selectedCustomerForPay, values.amount);
        toast({ title: 'Payment Received', description: `${formatCurrency(values.amount)} received from ${selectedCustomerForPay}.` });
        payForm.reset();
        setPayDialogOpen(false);
        setSelectedCustomerForPay(null);
    }
  }

  const handlePayClick = (e: React.MouseEvent, customerName: string) => {
    e.stopPropagation();
    setSelectedCustomerForPay(customerName);
    setPayDialogOpen(true);
  };

  return (
    <>
      <Card className="border-none shadow-none bg-transparent">
        <CardHeader className="px-0 pt-0">
          <div className="flex justify-between items-start mb-6">
            <div><CardTitle className="text-2xl font-bold text-primary">Private Sales</CardTitle><CardDescription>Track customer sales, collections, and outstanding receivables.</CardDescription></div>
            <Button onClick={() => setShowForm(!showForm)} className="rounded-xl shadow-lg"><PlusCircle className="mr-2 h-4 w-4" />{showForm ? 'Cancel' : 'New Sale'}</Button>
          </div>
        </CardHeader>
        <CardContent className="px-0 space-y-6">
          {showForm && (
            <Card className="bg-white border-primary/10 shadow-2xl rounded-3xl overflow-hidden animate-in zoom-in-95 duration-300">
              <CardHeader className="bg-primary/5 border-b border-primary/10"><CardTitle>New Sale Entry</CardTitle></CardHeader>
              <CardContent className="pt-6">
                <Form {...saleForm}><form onSubmit={saleForm.handleSubmit(onSaleSubmit)} className="space-y-8">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 items-start">
                      <FormField control={saleForm.control} name="customerName" render={({ field }) => (
                        <FormItem><FormLabel>Customer Name</FormLabel><FormControl><Input placeholder="Full Name" {...field} className="h-12 rounded-xl" /></FormControl></FormItem>
                      )} />
                      <FormField control={saleForm.control} name="itemType" render={({ field }) => (
                        <FormItem><FormLabel>Item</FormLabel><Select onValueChange={field.onChange} defaultValue={field.value}><FormControl><SelectTrigger className="h-12 rounded-xl"><SelectValue/></SelectTrigger></FormControl><SelectContent><SelectItem value="rice">Rice</SelectItem><SelectItem value="paddy">Paddy</SelectItem></SelectContent></Select></FormItem>
                      )} />
                      <FormField control={saleForm.control} name="quantity" render={({ field }) => (
                        <FormItem><FormLabel>Quantity (Qtl)</FormLabel><FormControl><Input type="number" step="0.01" {...field} className="h-12 rounded-xl bg-primary/5 font-bold" /></FormControl></FormItem>
                      )} />
                      <FormField control={saleForm.control} name="rate" render={({ field }) => (
                        <FormItem><FormLabel>Sale Rate (₹/Qtl)</FormLabel><FormControl><Input type="number" step="0.01" {...field} className="h-12 rounded-xl" /></FormControl></FormItem>
                      )} />
                      <FormField control={saleForm.control} name="initialPayment" render={({ field }) => (
                        <FormItem><FormLabel>Immediate Received (₹)</FormLabel><FormControl><Input type="number" step="0.01" {...field} className="h-12 rounded-xl" /></FormControl></FormItem>
                      )} />
                    </div>
                    <Button type="submit" className="w-full bg-primary py-8 rounded-2xl text-xl font-bold shadow-xl shadow-primary/20">Record Sale</Button>
                </form></Form>
              </CardContent>
            </Card>
          )}

          <div className="space-y-4">
            <h3 className="text-lg font-bold text-primary uppercase tracking-widest px-2">Customer Ledgers</h3>
            <div className="border border-primary/5 rounded-3xl overflow-hidden shadow-sm bg-white">
                {customerAggregates.map(customer => (
                    <Collapsible key={customer.id} open={openCustomerCollapsibles[customer.id]} onOpenChange={(o) => setOpenCustomerCollapsibles(p => ({...p, [customer.id]: o}))} className="border-b last:border-b-0 border-primary/5">
                        <div className="flex w-full p-4 items-center justify-between hover:bg-primary/5 transition-colors group">
                            <CollapsibleTrigger className="flex items-center gap-3 flex-grow text-left cursor-pointer">
                                {openCustomerCollapsibles[customer.id] ? <ChevronDown className="h-4 w-4 text-primary" /> : <ChevronRight className="h-4 w-4 text-muted-foreground" />}
                                <div className="bg-primary/5 p-2 rounded-xl">
                                    <UserIcon className="h-5 w-5 text-primary" />
                                </div>
                                <div className="flex-1">
                                    <span className="font-bold text-primary">{customer.name}</span>
                                    <div className="flex items-center gap-2 text-[10px] uppercase font-bold opacity-60">
                                        <span>{customer.sales.length} Records</span>
                                        <Separator orientation="vertical" className="h-2" />
                                        <span className={customer.totalBalance > 0 ? 'text-green-600' : 'text-muted-foreground'}>
                                            Receivable: {formatCurrency(Math.max(0, customer.totalBalance))}
                                        </span>
                                    </div>
                                </div>
                            </CollapsibleTrigger>
                            <div className="flex items-center gap-2">
                                <Button size="sm" variant="outline" onClick={(e) => handlePayClick(e, customer.name)} className="h-9 rounded-xl border-primary/20 hover:bg-primary/5 text-primary font-bold">
                                    <Banknote className="mr-2 h-4 w-4" /> Collect
                                </Button>
                            </div>
                        </div>
                        <CollapsibleContent className="bg-muted/30">
                            <div className="p-4 space-y-6">
                                <div className="space-y-2">
                                    <h4 className="text-xs font-bold text-primary uppercase opacity-60 tracking-widest flex items-center gap-2"><Receipt className="h-3 w-3" /> Sale History</h4>
                                    <Table className="bg-white rounded-2xl overflow-hidden shadow-sm">
                                        <TableHeader className="bg-muted/50">
                                            <TableRow className="border-none">
                                                <TableHead className="text-[10px] font-bold uppercase py-3">Date</TableHead>
                                                <TableHead className="text-[10px] font-bold uppercase py-3">Item</TableHead>
                                                <TableHead className="text-[10px] font-bold uppercase py-3 text-right">Qty (Qtl)</TableHead>
                                                <TableHead className="text-[10px] font-bold uppercase py-3 text-right">Value (₹)</TableHead>
                                                <TableHead className="text-[10px] font-bold uppercase py-3 text-right">Balance</TableHead>
                                                <TableHead className="text-[10px] font-bold uppercase py-3 text-right">Actions</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {customer.sales.map(s => (
                                                <TableRow key={s.id} className="border-primary/5 hover:bg-primary/5 transition-colors">
                                                    <TableCell className="text-xs font-medium">{format(s.date, 'dd MMM yy')}</TableCell>
                                                    <TableCell className="text-xs capitalize font-bold text-primary">{s.itemType}</TableCell>
                                                    <TableCell className="text-xs text-right font-medium">{s.quantity.toFixed(2)}</TableCell>
                                                    <TableCell className="text-xs text-right font-black text-primary">{formatCurrency(s.totalAmount)}</TableCell>
                                                    <TableCell className="text-xs text-right">
                                                        <Badge variant="outline" className={`font-black text-[9px] ${s.balance > 0 ? 'bg-green-500/5 text-green-700 border-green-200' : 'bg-muted/50 text-muted-foreground'}`}>
                                                            {s.balance > 0 ? formatCurrency(s.balance) : 'SETTLED'}
                                                        </Badge>
                                                    </TableCell>
                                                    <TableCell className="text-right"><Button variant="ghost" size="icon" onClick={() => deleteSale(s.id)} className="h-7 w-7 text-destructive/40 hover:text-destructive"><Trash2 className="h-3.5 w-3.5" /></Button></TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </div>

                                {customer.allPayments.length > 0 && (
                                    <div className="space-y-2">
                                        <h4 className="text-xs font-bold text-primary uppercase opacity-60 tracking-widest flex items-center gap-2"><CreditCard className="h-3 w-3" /> Collection History</h4>
                                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                                            {customer.allPayments.map((pay, i) => (
                                                <div key={pay.id} className="bg-white p-3 rounded-xl border border-primary/5 flex justify-between items-center shadow-sm">
                                                    <div>
                                                        <p className="text-[10px] font-bold text-primary/60">{format(pay.date, 'dd MMM yy, hh:mm a')}</p>
                                                        <p className="text-[8px] text-muted-foreground italic">{pay.note || 'Collection'}</p>
                                                    </div>
                                                    <p className="font-black text-green-600 text-sm">{formatCurrency(pay.amount)}</p>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </CollapsibleContent>
                    </Collapsible>
                ))}
                {customerAggregates.length === 0 && (
                    <div className="p-12 text-center text-muted-foreground italic">No sale records found.</div>
                )}
            </div>
          </div>
        </CardContent>
      </Card>

      <Dialog open={isPayDialogOpen} onOpenChange={setPayDialogOpen}>
          <DialogContent className="rounded-3xl border-none">
              <DialogHeader>
                  <DialogTitle className="text-xl font-bold text-primary">Collect Customer Payment</DialogTitle>
                  <CardDescription>Enter amount received from {selectedCustomerForPay}.</CardDescription>
              </DialogHeader>
              <Form {...payForm}>
                  <form onSubmit={payForm.handleSubmit(onPaySubmit)} className="space-y-6 pt-4">
                      <FormField control={payForm.control} name="amount" render={({ field }) => (
                          <FormItem>
                              <FormLabel>Collection Amount (₹)</FormLabel>
                              <FormControl><Input type="number" step="0.01" placeholder="Enter amount" {...field} className="h-14 rounded-2xl text-2xl font-black text-primary" autoFocus /></FormControl>
                              <FormMessage />
                          </FormItem>
                      )} />
                      <Button type="submit" className="w-full bg-primary h-14 rounded-2xl font-bold text-lg shadow-xl shadow-primary/20">Confirm Collection</Button>
                  </form>
              </Form>
          </DialogContent>
      </Dialog>
    </>
  );
}
