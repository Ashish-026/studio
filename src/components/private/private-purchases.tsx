
'use client';

import React, { useState, useMemo, useEffect, forwardRef } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useStockData } from '@/context/stock-context';
import { useVehicleData } from '@/context/vehicle-context';
import { useLabourData } from '@/context/labour-context';
import { PlusCircle, ChevronDown, ChevronRight, Download, Car, Users, User as UserIcon, Calculator, Info, Trash2 } from 'lucide-react';
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
import type { PrivatePurchase, Payment } from '@/lib/types';
import { BagWeightCalculator } from '../mandi/bag-weight-calculator';
import { Badge } from '../ui/badge';


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
  amount: z.coerce.number().positive('Payment amount must be positive'),
});


const FarmerPurchaseTable = forwardRef<HTMLDivElement, { farmer: { id: string; name: string; purchases: any[]; totalBalance: number } }>(({ farmer }, ref) => {
    const formatCurrency = (amount: number) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', minimumFractionDigits: 2 }).format(amount);
    
    const getVehicleDetails = (purchase: PrivatePurchase) => {
        if (!purchase.vehicleType || purchase.vehicleType === 'farmer') return "Farmer's Vehicle";
        if (purchase.vehicleType === 'own') return 'Own Vehicle';
        if (purchase.vehicleType === 'hired') return `${purchase.ownerName} (${purchase.vehicleNumber})`;
        return 'N/A';
    };

    return (
        <div ref={ref} className="p-8 bg-white text-black min-h-screen">
            <div className="text-center mb-8 border-b-2 pb-4">
                <h3 className="text-3xl font-black uppercase tracking-widest text-primary">Mill Account Statement</h3>
                <p className="text-xl font-bold mt-2">Farmer: {farmer.name}</p>
            </div>
            <div className="mb-10 p-6 bg-primary/5 rounded-3xl border border-primary/10">
                <div className="grid grid-cols-3 gap-8 text-center">
                    <div><p className="text-[10px] font-bold uppercase opacity-50">Total Purchases</p><p className="text-2xl font-black">{farmer.purchases.length}</p></div>
                    <div><p className="text-[10px] font-bold uppercase opacity-50">Total Value</p><p className="text-2xl font-black">{formatCurrency(farmer.purchases.reduce((acc, p) => acc + p.totalAmount, 0))}</p></div>
                    <div><p className="text-[10px] font-bold uppercase opacity-50">Outstanding Balance</p><p className={`text-2xl font-black ${farmer.totalBalance > 0 ? 'text-destructive' : 'text-green-600'}`}>{formatCurrency(farmer.totalBalance)}</p></div>
                </div>
            </div>
            <div className="space-y-8">
                {farmer.purchases.map((p: PrivatePurchase) => (
                    <div key={p.id} className="border border-black/5 rounded-2xl overflow-hidden p-4">
                        <div className="flex justify-between mb-4"><span className="font-bold">Record Date: {format(p.date, 'dd MMM yyyy')}</span><span className="font-mono text-xs opacity-50">ID: #{p.id.slice(-6)}</span></div>
                        <div className="grid grid-cols-4 gap-4 text-xs">
                            <div><p className="font-bold opacity-50">Type</p><p className="capitalize font-black">{p.itemType}</p></div>
                            <div><p className="font-bold opacity-50">Qty</p><p className="font-black">{p.quantity.toFixed(4)} Qtl</p></div>
                            <div><p className="font-bold opacity-50">Rate</p><p className="font-black">{formatCurrency(p.rate)}</p></div>
                            <div><p className="font-bold opacity-50">Total</p><p className="font-black text-primary">{formatCurrency(p.totalAmount)}</p></div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
});
FarmerPurchaseTable.displayName = 'FarmerPurchaseTable';


export function PrivatePurchases() {
  const { purchases, addPurchase, deletePurchase, addPayment } = useStockData();
  const { addVehicle, addTrip } = useVehicleData();
  const { labourers, addGroupWorkEntry } = useLabourData();
  const { toast } = useToast();
  const [showForm, setShowForm] = useState(false);
  const [openFarmerCollapsibles, setOpenFarmerCollapsibles] = useState<Record<string, boolean>>({});
  const [isPaymentDialogOpen, setPaymentDialogOpen] = useState(false);
  const [selectedPurchase, setSelectedPurchase] = useState<string | null>(null);
  const [isCalculatorOpen, setCalculatorOpen] = useState(false);

  const purchaseForm = useForm<z.infer<typeof purchaseFormSchema>>({
    resolver: zodResolver(purchaseFormSchema),
    defaultValues: {
      farmerName: '', itemType: 'paddy', quantity: 0, rate: 0, initialPayment: 0,
      description: '', vehicleType: 'farmer', destination: 'Mill', vehicleNumber: '',
      driverName: '', ownerName: '', tripCharge: 0, source: '',
      numberOfLabours: 0, labourerIds: [], labourCharge: 0, labourWageType: 'total_amount',
      calculationMethod: 'uniform', deductionKg: 0, grossWeightKg: 0, individualBagWeights: [],
    },
  });
  
  const { fields, append, remove } = useFieldArray({ control: purchaseForm.control, name: "labourerIds" });
  const numberOfLabours = purchaseForm.watch('numberOfLabours');
  const selectedLabourerIds = purchaseForm.watch('labourerIds').map(l => l.value);

  // HARDENED LOOP PROTECTION
  useEffect(() => {
    const target = Math.max(0, parseInt(String(numberOfLabours || 0)));
    const current = fields.length;
    if (target === current) return;
    if (target > current) {
      append(Array(target - current).fill({ value: '' }));
    } else {
      for (let i = 0; i < (current - target); i++) remove(current - 1 - i);
    }
  }, [numberOfLabours, fields.length, append, remove]);

  const paymentForm = useForm<z.infer<typeof paymentFormSchema>>({ resolver: zodResolver(paymentFormSchema), defaultValues: { amount: 0 } });
  const vehicleType = purchaseForm.watch('vehicleType');
  const farmerNameValue = purchaseForm.watch('farmerName');

  useEffect(() => { if (farmerNameValue) purchaseForm.setValue('source', farmerNameValue); }, [farmerNameValue, purchaseForm]);

  const farmerAggregates = useMemo(() => {
    const farmers: Record<string, { id: string, name: string, purchases: any[], totalBalance: number }> = {};
    (purchases || []).forEach(p => {
      if (!farmers[p.farmerName]) {
        farmers[p.farmerName] = { id: p.farmerName.replace(/\s+/g, '-').toLowerCase(), name: p.farmerName, purchases: [], totalBalance: 0 };
      }
      farmers[p.farmerName].purchases.push(p);
    });
    Object.values(farmers).forEach(f => f.totalBalance = f.purchases.reduce((acc, p) => acc + p.balance, 0));
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

  const handleDelete = (id: string) => {
    deletePurchase(id);
    toast({ title: 'Deleted', description: 'Purchase record removed.' });
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
    <>
      <Card>
        <CardHeader>
          <div className="flex justify-between items-start">
            <div><CardTitle>Private Purchase Records</CardTitle><CardDescription>Add and view private purchase history.</CardDescription></div>
            <Button onClick={() => setShowForm(!showForm)} size="sm"><PlusCircle className="mr-2 h-4 w-4" />{showForm ? 'Cancel' : 'Add New Purchase'}</Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {showForm && (
            <Card className="bg-muted/50">
              <CardHeader><CardTitle>New Private Purchase</CardTitle></CardHeader>
              <CardContent>
                <Form {...purchaseForm}><form onSubmit={purchaseForm.handleSubmit(onPurchaseSubmit)} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 items-start">
                      <FormField control={purchaseForm.control} name="farmerName" render={({ field }) => (
                        <FormItem><FormLabel>Farmer Name</FormLabel><FormControl><Input placeholder="Full Name" {...field} /></FormControl><FormMessage /></FormItem>
                      )} />
                      <FormField control={purchaseForm.control} name="itemType" render={({ field }) => (
                        <FormItem><FormLabel>Item Type</FormLabel><Select onValueChange={field.onChange} defaultValue={field.value}><FormControl><SelectTrigger><SelectValue/></SelectTrigger></FormControl><SelectContent><SelectItem value="paddy">Paddy</SelectItem><SelectItem value="rice">Rice</SelectItem></SelectContent></Select></FormItem>
                      )} />
                      <div className="pt-8"><Button type="button" variant="outline" onClick={() => setCalculatorOpen(true)} className="w-full"><Calculator className="mr-2 h-4 w-4" /> Calculator</Button></div>
                      <FormField control={purchaseForm.control} name="quantity" render={({ field }) => (
                        <FormItem><FormLabel>Net Quantity (Qtl)</FormLabel><FormControl><Input type="number" step="0.01" {...field} onFocus={(e) => e.target.select()} className="bg-primary/5 font-bold" /></FormControl></FormItem>
                      )} />
                      <FormField control={purchaseForm.control} name="rate" render={({ field }) => (
                        <FormItem><FormLabel>Rate (₹/Qtl)</FormLabel><FormControl><Input type="number" step="0.01" {...field} onFocus={(e) => e.target.select()} /></FormControl></FormItem>
                      )} />
                      <FormField control={purchaseForm.control} name="initialPayment" render={({ field }) => (
                        <FormItem><FormLabel>Initial Paid (₹)</FormLabel><FormControl><Input type="number" step="0.01" {...field} onFocus={(e) => e.target.select()} /></FormControl></FormItem>
                      )} />
                    </div>
                    <Button type="submit" className="w-full bg-primary text-white">Save Purchase</Button>
                </form></Form>
              </CardContent>
            </Card>
          )}

          <div className="render-optimized">
            <div className="border rounded-lg">
                {farmerAggregates.map(farmer => (
                    <Collapsible key={farmer.id} open={openFarmerCollapsibles[farmer.id]} onOpenChange={(o) => setOpenFarmerCollapsibles(p => ({...p, [farmer.id]: o}))} className="border-b last:border-b-0">
                        <div className="flex w-full p-4 items-center justify-between hover:bg-muted/50 transition-colors">
                            <CollapsibleTrigger className="flex items-center gap-3 flex-grow text-left">
                                {openFarmerCollapsibles[farmer.id] ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                                <UserIcon className="h-5 w-5 text-muted-foreground" />
                                <div><span className="font-bold">{farmer.name}</span><p className="text-xs text-muted-foreground">Balance: {new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(farmer.totalBalance)}</p></div>
                            </CollapsibleTrigger>
                            <div className="flex gap-2">
                                <Button size="sm" variant="outline" onClick={(e) => { e.stopPropagation(); handleDownload(farmer.id, farmer.name); }}><Download className="h-4 w-4" /></Button>
                            </div>
                        </div>
                        <CollapsibleContent className="p-4 space-y-4 bg-slate-50">
                            <div className="absolute -left-[9999px] top-auto"><div id={`printable-purchases-${farmer.id}`}><FarmerPurchaseTable farmer={farmer} /></div></div>
                            <Table>
                                <TableHeader><TableRow><TableHead>Date</TableHead><TableHead>Qty</TableHead><TableHead className="text-right">Total</TableHead><TableHead className="text-right">Actions</TableHead></TableRow></TableHeader>
                                <TableBody>
                                    {farmer.purchases.map(p => (
                                        <TableRow key={p.id}>
                                            <TableCell>{format(p.date, 'dd MMM yy')}</TableCell>
                                            <TableCell>{p.quantity.toFixed(2)} Qtl</TableCell>
                                            <TableCell className="text-right font-bold">{new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(p.totalAmount)}</TableCell>
                                            <TableCell className="text-right"><Button variant="ghost" size="icon" onClick={() => handleDelete(p.id)} className="text-destructive"><Trash2 className="h-4 w-4" /></Button></TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </CollapsibleContent>
                    </Collapsible>
                ))}
            </div>
          </div>
        </CardContent>
      </Card>
      
      <Dialog open={isCalculatorOpen} onOpenChange={setCalculatorOpen}>
        <BagWeightCalculator onConfirm={handleCalculatorConfirm} onCancel={() => setCalculatorOpen(false)} isPrivate={true} />
      </Dialog>
    </>
  );
}
