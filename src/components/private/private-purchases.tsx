'use client';

import React, { useState, useMemo, useEffect, forwardRef, Fragment } from 'react';
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
  Calculator, 
  Trash2, 
  CreditCard,
  Receipt,
  Ticket
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { format } from 'date-fns';
import { downloadPdf } from '@/lib/pdf-utils';
import { Separator } from '../ui/separator';
import type { PrivatePurchase, Payment } from '@/lib/types';
import { BagWeightCalculator } from '../mandi/bag-weight-calculator';
import { Badge } from '../ui/badge';
import { Checkbox } from '../ui/checkbox';

const labourDetailsSchema = z.object({
  numberOfLabours: z.coerce.number().min(0).default(0),
  labourerIds: z.array(z.object({ value: z.string().min(1, "Please select a labourer.") })).default([]),
  labourWageType: z.enum(['per_item', 'total_amount']).default('total_amount'),
  labourCharge: z.coerce.number().min(0).default(0),
});

const purchaseFormSchema = z.object({
  farmerName: z.string().min(1, 'Farmer name is required'),
  itemType: z.enum(['paddy', 'rice']),
  quantity: z.coerce.number().positive('Quantity must be a positive number'),
  rate: z.coerce.number().positive('Rate must be a positive number'),
  initialPayment: z.coerce.number().min(0, 'Initial payment cannot be negative').default(0),
  description: z.string().optional(),
  isMandiExcess: z.boolean().default(false),
  mandiTokenNo: z.string().optional(),
  vehicleType: z.enum(['farmer', 'own', 'hired'], { required_error: 'Vehicle type is required' }),
  vehicleNumber: z.string().optional(),
  driverName: z.string().optional(),
  ownerName: z.string().optional(),
  tripCharge: z.coerce.number().optional(),
  source: z.string().optional(),
  destination: z.string().optional(),
  calculationMethod: z.enum(['uniform', 'bag-by-bag', 'weighbridge']).optional(),
  deductionKg: z.coerce.number().optional(),
  grossWeightKg: z.coerce.number().optional(),
  individualBagWeights: z.array(z.number()).optional(),
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

const FarmerPurchaseTable = forwardRef<HTMLDivElement, { farmer: { id: string; name: string; purchases: any[]; totalBalance: number; allPayments: Payment[] } }>(({ farmer }, ref) => {
    return (
        <div ref={ref} className="p-10 bg-white text-black min-h-screen w-[1000px] mx-auto border shadow-sm">
            <div className="text-center mb-10 border-b-4 border-primary pb-6">
                <h3 className="text-4xl font-black uppercase tracking-tighter text-primary">Private Account Statement</h3>
                <p className="text-sm font-bold mt-2 opacity-60 uppercase tracking-widest text-muted-foreground">Detailed Purchase & Payment Log</p>
            </div>
            
            <div className="mb-12 p-8 bg-primary/5 rounded-[40px] border border-primary/10">
                <div className="grid grid-cols-2 gap-12">
                    <div>
                        <p className="text-[10px] font-black uppercase opacity-40 tracking-[0.2em] mb-1">Farmer / Supplier</p>
                        <p className="text-3xl font-black text-primary">{farmer.name}</p>
                    </div>
                    <div className="text-right">
                        <p className="text-[10px] font-black uppercase opacity-40 tracking-[0.2em] mb-1">Current Account Status</p>
                        <p className={`text-3xl font-black ${farmer.totalBalance > 0 ? 'text-destructive' : 'text-green-600'}`}>
                            {formatCurrency(Math.abs(farmer.totalBalance))}
                            <span className="text-sm ml-2 opacity-60">{farmer.totalBalance > 0 ? '(PAYABLE)' : '(ADVANCE)'}</span>
                        </p>
                    </div>
                </div>
            </div>

            <div className="space-y-12">
                <div className="space-y-4">
                    <h4 className="text-xs font-black border-l-4 border-primary pl-3 uppercase tracking-widest text-primary/60">Purchase History</h4>
                    <Table className="border border-black/10 rounded-3xl overflow-hidden">
                        <TableHeader className="bg-primary/5">
                            <TableRow className="border-black/10">
                                <TableHead className="text-black font-black uppercase text-[10px] py-4">Date</TableHead>
                                <TableHead className="text-black font-black uppercase text-[10px] py-4">Item Details</TableHead>
                                <TableHead className="text-black font-black uppercase text-[10px] py-4 text-right">Quantity (Qtl)</TableHead>
                                <TableHead className="text-black font-black uppercase text-[10px] py-4 text-right">Rate (₹/Qtl)</TableHead>
                                <TableHead className="text-black font-black uppercase text-[10px] py-4 text-right">Total Amount</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {farmer.purchases.map((p: PrivatePurchase) => (
                                <TableRow key={p.id} className="border-black/5">
                                    <TableCell className="text-xs font-medium">{format(new Date(p.date), 'dd MMM yyyy')}</TableCell>
                                    <TableCell className="text-xs">
                                        <div className="flex items-center gap-2 font-bold capitalize">
                                            {p.itemType}
                                            {p.isMandiExcess && <Badge variant="outline" className="text-[8px] h-4 bg-accent/10 border-accent/30 text-accent-foreground">EXCESS</Badge>}
                                        </div>
                                        {p.mandiTokenNo && <p className="text-[8px] opacity-50 font-bold">TOKEN: {p.mandiTokenNo}</p>}
                                    </TableCell>
                                    <TableCell className="text-xs text-right font-medium">{p.quantity.toFixed(2)}</TableCell>
                                    <TableCell className="text-xs text-right opacity-60">{formatCurrency(p.rate)}</TableCell>
                                    <TableCell className="text-xs text-right font-black text-primary">{formatCurrency(p.totalAmount)}</TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>

                <div className="space-y-4">
                    <h4 className="text-xs font-black border-l-4 border-green-600 pl-3 uppercase tracking-widest text-green-600/60">Payment History</h4>
                    <Table className="border border-black/10 rounded-3xl overflow-hidden">
                        <TableHeader className="bg-green-50">
                            <TableRow className="border-black/10">
                                <TableHead className="text-black font-black uppercase text-[10px] py-4">Payment Date & Time</TableHead>
                                <TableHead className="text-black font-black uppercase text-[10px] py-4">Mode / Reference</TableHead>
                                <TableHead className="text-black font-black uppercase text-[10px] py-4 text-right">Amount Paid (₹)</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {farmer.allPayments.length === 0 ? (
                                <TableRow><TableCell colSpan={3} className="text-center py-10 opacity-40 italic text-xs">No payments recorded for this account.</TableCell></TableRow>
                            ) : farmer.allPayments.map(pay => (
                                <TableRow key={pay.id} className="border-black/5">
                                    <TableCell className="text-xs font-medium">{format(new Date(pay.date), 'dd MMM yyyy, hh:mm a')}</TableCell>
                                    <TableCell className="text-xs opacity-60 italic">{pay.note || 'Account Payment'}</TableCell>
                                    <TableCell className="text-xs text-right font-black text-green-600">{formatCurrency(pay.amount)}</TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>
            </div>

            <div className="mt-32 flex justify-between border-t border-black/10 pt-8">
                <div className="text-center">
                    <div className="w-48 border-b-2 border-black mb-2"></div>
                    <p className="text-[10px] font-black uppercase text-primary/60">Farmer Signature</p>
                </div>
                <div className="text-center">
                    <div className="w-48 border-b-2 border-black mb-2"></div>
                    <p className="text-[10px] font-black uppercase text-primary/60">Mill Authority</p>
                </div>
            </div>
        </div>
    );
});
FarmerPurchaseTable.displayName = 'FarmerPurchaseTable';

export function PrivatePurchases() {
  const { purchases, addPurchase, deletePurchase, addFarmerPaymentByName } = useStockData();
  const { addVehicle, addTrip } = useVehicleData();
  const { labourers, addGroupWorkEntry } = useLabourData();
  const { toast } = useToast();
  
  const [showForm, setShowForm] = useState(false);
  const [openFarmerCollapsibles, setOpenFarmerCollapsibles] = useState<Record<string, boolean>>({});
  const [isCalculatorOpen, setCalculatorOpen] = useState(false);
  const [isPayDialogOpen, setPayDialogOpen] = useState(false);
  const [selectedFarmerForPay, setSelectedFarmerForPay] = useState<string | null>(null);

  const purchaseForm = useForm<z.infer<typeof purchaseFormSchema>>({
    resolver: zodResolver(purchaseFormSchema),
    defaultValues: {
      farmerName: '', itemType: 'paddy', quantity: 0, rate: 0, initialPayment: 0,
      description: '', vehicleType: 'farmer', destination: 'Mill', vehicleNumber: '',
      driverName: '', ownerName: '', tripCharge: 0, source: '', isMandiExcess: false, mandiTokenNo: '',
      numberOfLabours: 0, labourerIds: [], labourCharge: 0, labourWageType: 'total_amount',
      calculationMethod: 'uniform', deductionKg: 0, grossWeightKg: 0, individualBagWeights: [],
    },
  });

  const payForm = useForm<z.infer<typeof paymentFormSchema>>({
    resolver: zodResolver(paymentFormSchema),
    defaultValues: { amount: 0 },
  });
  
  const { fields, replace } = useFieldArray({ control: purchaseForm.control, name: "labourerIds" });
  const numberOfLabours = purchaseForm.watch('numberOfLabours');

  useEffect(() => {
    const targetCount = Math.max(0, parseInt(String(numberOfLabours || 0)));
    const currentValues = purchaseForm.getValues('labourerIds') || [];
    if (fields.length !== targetCount) {
      const nextFields = Array.from({ length: targetCount }, (_, i) => currentValues[i] || { value: '' });
      replace(nextFields);
    }
  }, [numberOfLabours, replace, purchaseForm, fields.length]);

  const vehicleType = purchaseForm.watch('vehicleType');
  const isMandiExcess = purchaseForm.watch('isMandiExcess');

  const farmerAggregates = useMemo(() => {
    const farmers: Record<string, { id: string, name: string, purchases: any[], totalBalance: number, allPayments: Payment[] }> = {};
    (purchases || []).forEach(p => {
      if (!farmers[p.farmerName]) {
        farmers[p.farmerName] = { id: p.farmerName.replace(/\s+/g, '-').toLowerCase(), name: p.farmerName, purchases: [], totalBalance: 0, allPayments: [] };
      }
      farmers[p.farmerName].purchases.push(p);
      farmers[p.farmerName].allPayments.push(...(p.payments || []));
    });
    Object.values(farmers).forEach(f => {
        f.totalBalance = f.purchases.reduce((acc, p) => acc + p.balance, 0);
        f.allPayments.sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    });
    return Object.values(farmers).sort((a, b) => a.name.localeCompare(b.name));
  }, [purchases]);

  function onPurchaseSubmit(values: z.infer<typeof purchaseFormSchema>) {
    const labourerIds = values.labourerIds.map(l => l.value).filter(Boolean);
    addPurchase({ ...values, labourerIds });
    toast({ title: 'Success!', description: 'Purchase recorded.' });

    if (values.vehicleType === 'hired' && values.vehicleNumber && values.tripCharge) {
        const vId = addVehicle({ vehicleNumber: values.vehicleNumber, driverName: values.driverName || '', ownerName: values.ownerName || '', rentType: 'per_trip', rentAmount: 0 });
        if (vId) addTrip(vId, { source: values.source || values.farmerName, destination: values.destination || 'Mill', quantity: values.quantity, tripCharge: values.tripCharge });
    }
    if (labourerIds.length > 0 && values.labourCharge > 0) addGroupWorkEntry(labourerIds, values.labourCharge, `Private Purchase: ${values.farmerName}`, values.quantity);
    
    purchaseForm.reset();
    setShowForm(false);
  }

  function onPaySubmit(values: z.infer<typeof paymentFormSchema>) {
    if (selectedFarmerForPay) {
        addFarmerPaymentByName(selectedFarmerForPay, values.amount);
        toast({ title: 'Payment Recorded', description: `${formatCurrency(values.amount)} paid to ${selectedFarmerForPay}.` });
        payForm.reset();
        setPayDialogOpen(false);
        setSelectedFarmerForPay(null);
    }
  }

  const handlePayClick = (e: React.MouseEvent, farmerName: string) => {
    e.stopPropagation();
    setSelectedFarmerForPay(farmerName);
    setPayDialogOpen(true);
  };

  const handleCalculatorConfirm = (v: { netQuintals: number; grossWeightKg: number; deductionKg: number; bagWeights: number[]; method: any }) => {
    purchaseForm.setValue('quantity', v.netQuintals);
    purchaseForm.setValue('grossWeightKg', v.grossWeightKg);
    purchaseForm.setValue('deductionKg', v.deductionKg);
    purchaseForm.setValue('individualBagWeights', v.bagWeights);
    purchaseForm.setValue('calculationMethod', v.method);
    setCalculatorOpen(false);
  };

  return (
    <Fragment>
      <Card className="border-none shadow-none bg-transparent">
        <CardHeader className="px-0 pt-0">
          <div className="flex justify-between items-start mb-6">
            <div><CardTitle className="text-2xl font-bold text-primary">Private Purchases</CardTitle><CardDescription>Track farmer purchases, payments, and Mandi excess arrivals.</CardDescription></div>
            <Button onClick={() => setShowForm(!showForm)} className="rounded-xl shadow-lg">
                <PlusCircle className="mr-2 h-4 w-4" />
                {showForm ? 'Cancel' : 'New Purchase'}
            </Button>
          </div>
        </CardHeader>
        <CardContent className="px-0 space-y-6">
          {showForm && (
            <Card className="bg-white border-primary/10 shadow-2xl rounded-3xl overflow-hidden animate-in zoom-in-95 duration-300">
              <CardHeader className="bg-primary/5 border-b border-primary/10"><CardTitle>Record Farmer Arrival</CardTitle></CardHeader>
              <CardContent className="pt-6">
                <Form {...purchaseForm}>
                  <form onSubmit={purchaseForm.handleSubmit(onPurchaseSubmit)} className="space-y-8">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 items-start">
                      <FormField control={purchaseForm.control} name="farmerName" render={({ field }) => (
                        <FormItem><FormLabel>Farmer Name</FormLabel><FormControl><Input placeholder="Full Name" {...field} className="h-12 rounded-xl" /></FormControl></FormItem>
                      )} />
                      
                      <div className="flex items-center space-x-2 pt-8">
                        <FormField control={purchaseForm.control} name="isMandiExcess" render={({ field }) => (
                            <FormItem className="flex flex-row items-center space-x-3 space-y-0 rounded-xl border p-3 shadow-sm bg-muted/20">
                                <FormControl><Checkbox checked={field.value} onCheckedChange={field.onChange} /></FormControl>
                                <div className="space-y-1 leading-none">
                                    <FormLabel className="text-sm font-bold flex items-center gap-2"><Ticket className="h-3 w-3" /> Mandi Token Excess</FormLabel>
                                </div>
                            </FormItem>
                        )} />
                      </div>

                      {isMandiExcess && (
                        <FormField control={purchaseForm.control} name="mandiTokenNo" render={({ field }) => (
                            <FormItem><FormLabel>Token Reference</FormLabel><FormControl><Input placeholder="e.g., T-1234" {...field} className="h-12 rounded-xl border-accent/30" /></FormControl></FormItem>
                        )} />
                      )}

                      <div className="pt-8"><Button type="button" variant="outline" onClick={() => setCalculatorOpen(true)} className="w-full h-12 rounded-xl border-dashed border-primary/30"><Calculator className="mr-2 h-4 w-4" /> Open Weight Calculator</Button></div>
                      
                      <FormField control={purchaseForm.control} name="quantity" render={({ field }) => (
                        <FormItem><FormLabel>Final Net Qtl</FormLabel><FormControl><Input type="number" step="0.01" {...field} className="h-12 rounded-xl bg-primary/5 font-black text-primary text-lg" /></FormControl></FormItem>
                      )} />
                      
                      <FormField control={purchaseForm.control} name="rate" render={({ field }) => (
                        <FormItem><FormLabel>Agreed Rate (₹/Qtl)</FormLabel><FormControl><Input type="number" step="0.01" {...field} className="h-12 rounded-xl" /></FormControl></FormItem>
                      )} />
                      
                      <FormField control={purchaseForm.control} name="initialPayment" render={({ field }) => (
                        <FormItem><FormLabel>Advance/Immediate Paid (₹)</FormLabel><FormControl><Input type="number" step="0.01" {...field} className="h-12 rounded-xl" /></FormControl></FormItem>
                      )} />
                    </div>
                    <Button type="submit" className="w-full bg-primary py-8 rounded-2xl text-xl font-bold shadow-xl shadow-primary/20">Save Purchase Record</Button>
                  </form>
                </Form>
              </CardContent>
            </Card>
          )}

          <div className="space-y-4">
            <h3 className="text-lg font-bold text-primary uppercase tracking-widest px-2">Farmer Ledgers</h3>
            <div className="border border-primary/5 rounded-3xl overflow-hidden shadow-sm bg-white">
                {farmerAggregates.map(farmer => (
                    <Collapsible key={farmer.id} open={openFarmerCollapsibles[farmer.id]} onOpenChange={(o) => setOpenFarmerCollapsibles(p => ({...p, [farmer.id]: o}))} className="border-b last:border-b-0 border-primary/5">
                        <div className="flex w-full p-4 items-center justify-between hover:bg-primary/5 transition-colors group">
                            <CollapsibleTrigger className="flex items-center gap-3 flex-grow text-left cursor-pointer">
                                {openFarmerCollapsibles[farmer.id] ? <ChevronDown className="h-4 w-4 text-primary" /> : <ChevronRight className="h-4 w-4" />}
                                <div className="bg-primary/5 p-2 rounded-xl">
                                    <UserIcon className="h-5 w-5 text-primary" />
                                </div>
                                <div className="flex-1">
                                    <span className="font-bold text-primary">{farmer.name}</span>
                                    <div className="flex items-center gap-2 text-[10px] uppercase font-bold opacity-60">
                                        <span>{farmer.purchases.length} Records</span>
                                        <Separator orientation="vertical" className="h-2" />
                                        <span className={farmer.totalBalance > 0 ? 'text-destructive' : 'text-green-600'}>
                                            {farmer.totalBalance > 0 ? 'Payable' : 'Advance'}: {formatCurrency(Math.abs(farmer.totalBalance))}
                                        </span>
                                    </div>
                                </div>
                            </CollapsibleTrigger>
                            <div className="flex items-center gap-2">
                                <Button size="sm" variant="outline" onClick={(e) => handlePayClick(e, farmer.name)} className="h-9 rounded-xl border-primary/20 hover:bg-primary/5 text-primary font-bold">
                                    <CreditCard className="mr-2 h-4 w-4" /> Pay
                                </Button>
                                <Button size="sm" variant="ghost" onClick={(e) => { e.stopPropagation(); downloadPdf(`printable-purchases-${farmer.id}`, `Statement_${farmer.name.replace(/\s+/g, '_')}`); }} className="h-9 w-9 rounded-xl hover:text-primary">
                                    <Download className="h-4 w-4" />
                                </Button>
                            </div>
                        </div>
                        <CollapsibleContent className="bg-muted/30">
                            <div className="p-4 space-y-6">
                                <div className="absolute -left-[9999px] top-auto"><div id={`printable-purchases-${farmer.id}`}><FarmerPurchaseTable farmer={farmer} /></div></div>
                                
                                <div className="space-y-2">
                                    <h4 className="text-xs font-bold text-primary uppercase opacity-60 tracking-widest flex items-center gap-2"><Receipt className="h-3 w-3" /> Recent History</h4>
                                    <Table className="bg-white rounded-2xl overflow-hidden shadow-sm">
                                        <TableHeader className="bg-muted/50">
                                            <TableRow className="border-none">
                                                <TableHead className="text-[10px] font-bold uppercase py-3">Date</TableHead>
                                                <TableHead className="text-[10px] font-bold uppercase py-3">Details</TableHead>
                                                <TableHead className="text-[10px] font-bold uppercase py-3 text-right">Qty (Qtl)</TableHead>
                                                <TableHead className="text-[10px] font-bold uppercase py-3 text-right">Total (₹)</TableHead>
                                                <TableHead className="text-[10px] font-bold uppercase py-3 text-right">Balance</TableHead>
                                                <TableHead className="text-[10px] font-bold uppercase py-3 text-right">Actions</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {farmer.purchases.map(p => (
                                                <TableRow key={p.id} className="border-primary/5 hover:bg-primary/5 transition-colors">
                                                    <TableCell className="text-xs font-medium">{format(new Date(p.date), 'dd MMM yy')}</TableCell>
                                                    <TableCell className="text-xs">
                                                        <div className="flex flex-col">
                                                            <span className="capitalize font-bold text-primary">{p.itemType}</span>
                                                            {p.isMandiExcess && <span className="text-[8px] font-black text-accent-foreground bg-accent/20 px-1 rounded w-fit uppercase">Excess Token: {p.mandiTokenNo || 'N/A'}</span>}
                                                        </div>
                                                    </TableCell>
                                                    <TableCell className="text-xs text-right font-medium">{p.quantity.toFixed(2)}</TableCell>
                                                    <TableCell className="text-xs text-right font-black text-primary">{formatCurrency(p.totalAmount)}</TableCell>
                                                    <TableCell className="text-xs text-right">
                                                        <Badge variant="outline" className={`font-black text-[9px] ${p.balance > 0 ? 'bg-destructive/5 text-destructive border-destructive/20' : 'bg-green-500/5 text-green-700 border-green-200'}`}>
                                                            {p.balance > 0 ? formatCurrency(p.balance) : 'SETTLED'}
                                                        </Badge>
                                                    </TableCell>
                                                    <TableCell className="text-right"><Button variant="ghost" size="icon" onClick={() => deletePurchase(p.id)} className="h-7 w-7 text-destructive/40 hover:text-destructive"><Trash2 className="h-3.5 w-3.5" /></Button></TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </div>

                                {farmer.allPayments.length > 0 && (
                                    <div className="space-y-2">
                                        <h4 className="text-xs font-bold text-primary uppercase opacity-60 tracking-widest flex items-center gap-2"><CreditCard className="h-3 w-3" /> Account Payments</h4>
                                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                                            {farmer.allPayments.map((pay, i) => (
                                                <div key={pay.id} className="bg-white p-3 rounded-xl border border-primary/5 flex justify-between items-center shadow-sm">
                                                    <div>
                                                        <p className="text-[10px] font-bold text-primary/60">{format(new Date(pay.date), 'dd MMM yy, hh:mm a')}</p>
                                                        <p className="text-[8px] text-muted-foreground italic">{pay.note || 'Account Payment'}</p>
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
                {farmerAggregates.length === 0 && (
                    <div className="p-12 text-center text-muted-foreground italic">No purchase history. Click "New Purchase" to record arrival.</div>
                )}
            </div>
          </div>
        </CardContent>
      </Card>
      
      <Dialog open={isCalculatorOpen} onOpenChange={setCalculatorOpen}>
        <BagWeightCalculator onConfirm={handleCalculatorConfirm} onCancel={() => setCalculatorOpen(false)} isPrivate={true} />
      </Dialog>

      <Dialog open={isPayDialogOpen} onOpenChange={setPayDialogOpen}>
          <DialogContent className="rounded-3xl border-none">
              <DialogHeader>
                  <DialogTitle className="text-xl font-bold text-primary">Record Farmer Payment</DialogTitle>
                  <CardDescription>Enter amount to pay {selectedFarmerForPay}. This will be applied to the oldest unpaid purchase.</CardDescription>
              </DialogHeader>
              <Form {...payForm}>
                  <form onSubmit={payForm.handleSubmit(onPaySubmit)} className="space-y-6 pt-4">
                      <FormField control={payForm.control} name="amount" render={({ field }) => (
                          <FormItem>
                              <FormLabel>Payment Amount (₹)</FormLabel>
                              <FormControl><Input type="number" step="0.01" placeholder="Enter amount" {...field} className="h-14 rounded-2xl text-2xl font-black text-primary" autoFocus /></FormControl>
                              <FormMessage />
                          </FormItem>
                      )} />
                      <Button type="submit" className="w-full bg-primary h-14 rounded-2xl font-bold text-lg shadow-xl shadow-primary/20">Confirm Payment</Button>
                  </form>
              </Form>
          </DialogContent>
      </Dialog>
    </Fragment>
  );
}
