'use client';

import React, { useState, useMemo, useEffect, forwardRef } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useStockData } from '@/context/stock-context';
import { useVehicleData } from '@/context/vehicle-context';
import { useLabourData } from '@/context/labour-context';
import { PlusCircle, ChevronDown, ChevronRight, Download, Car, Users, User as UserIcon, Calculator, Info } from 'lucide-react';
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
  // Tracking fields
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
    message: "Vehicle number, driver, owner, and a positive trip charge are required for hired vehicles.",
    path: ['tripCharge'],
});

const paymentFormSchema = z.object({
  amount: z.coerce.number().positive('Payment amount must be positive'),
});


const FarmerPurchaseTable = forwardRef<HTMLDivElement, { farmer: { id: string; name: string; purchases: any[] } }>(({ farmer }, ref) => {
    
    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-IN', {
          style: 'currency',
          currency: 'INR',
          minimumFractionDigits: 2,
        }).format(amount);
    }
    
    const getVehicleDetails = (purchase: PrivatePurchase) => {
        if (!purchase.vehicleType || purchase.vehicleType === 'farmer') return "Farmer's Vehicle";
        if (purchase.vehicleType === 'own') return 'Own Vehicle';
        if (purchase.vehicleType === 'hired') {
          return `${purchase.ownerName} (${purchase.vehicleNumber})`;
        }
        return 'N/A';
    };

    return (
        <div ref={ref} className="p-8 bg-white text-black min-h-screen">
            <div className="text-center mb-8 border-b-2 pb-4">
                <h3 className="text-3xl font-black uppercase tracking-widest text-primary">Mill Account Statement</h3>
                <p className="text-xl font-bold mt-2">Farmer: {farmer.name}</p>
            </div>

            <div className="mb-10 p-6 bg-primary/5 rounded-3xl border border-primary/10">
                <h4 className="font-black text-lg uppercase mb-4 text-primary opacity-70">Summary Account</h4>
                <div className="grid grid-cols-3 gap-8">
                    <div>
                        <p className="text-[10px] font-bold uppercase opacity-50">Total Purchases</p>
                        <p className="text-2xl font-black">{farmer.purchases.length}</p>
                    </div>
                    <div>
                        <p className="text-[10px] font-bold uppercase opacity-50">Total Value</p>
                        <p className="text-2xl font-black">{formatCurrency(farmer.purchases.reduce((acc, p) => acc + p.totalAmount, 0))}</p>
                    </div>
                    <div>
                        <p className="text-[10px] font-bold uppercase opacity-50">Outstanding Balance</p>
                        <p className={`text-2xl font-black ${farmer.totalBalance > 0 ? 'text-destructive' : 'text-green-600'}`}>
                            {formatCurrency(farmer.totalBalance)}
                        </p>
                    </div>
                </div>
            </div>

            <div className="space-y-12">
                {farmer.purchases.map((p: PrivatePurchase) => (
                    <div key={p.id} className="border-2 border-black/5 rounded-3xl overflow-hidden">
                        <div className="bg-black/5 p-4 flex justify-between items-center">
                            <div className="flex gap-4 items-center">
                                <span className="bg-primary text-white text-[10px] font-black px-3 py-1 rounded-full uppercase">Purchase Record</span>
                                <span className="text-xs font-bold font-mono">ID: #{p.id.slice(-6)}</span>
                            </div>
                            <span className="text-sm font-black">{format(p.date, 'dd MMM yyyy')}</span>
                        </div>
                        
                        <div className="p-6">
                            <div className="grid grid-cols-4 gap-6 mb-8">
                                <div><p className="text-[10px] font-bold uppercase opacity-40">Item Type</p><p className="font-black capitalize">{p.itemType}</p></div>
                                <div><p className="text-[10px] font-bold uppercase opacity-40">Net Quantity</p><p className="font-black">{p.quantity.toFixed(4)} Qtl</p></div>
                                <div><p className="text-[10px] font-bold uppercase opacity-40">Rate</p><p className="font-black">{formatCurrency(p.rate)} / Qtl</p></div>
                                <div><p className="text-[10px] font-bold uppercase opacity-40">Total Value</p><p className="font-black text-primary">{formatCurrency(p.totalAmount)}</p></div>
                            </div>

                            <div className="grid grid-cols-2 gap-12 mb-8 items-start">
                                <div className="space-y-4">
                                    <div className="bg-muted/30 p-4 rounded-2xl border border-black/5">
                                        <h5 className="text-[10px] font-black uppercase mb-2 opacity-60">Weight Details</h5>
                                        <div className="space-y-1 text-xs">
                                            <div className="flex justify-between"><span>Gross Weight:</span><span className="font-bold">{p.grossWeightKg?.toLocaleString() || (p.quantity * 100).toLocaleString()} kg</span></div>
                                            <div className="flex justify-between text-destructive"><span>Quality Deduction:</span><span className="font-bold">- {p.deductionKg?.toFixed(2) || '0.00'} kg</span></div>
                                            <div className="border-t mt-1 pt-1 flex justify-between font-black"><span>Final Net:</span><span>{(p.quantity * 100).toLocaleString()} kg</span></div>
                                        </div>
                                    </div>
                                    <div className="text-xs">
                                        <p className="opacity-50 font-bold uppercase text-[10px]">Logistics</p>
                                        <p className="font-bold">{getVehicleDetails(p)}</p>
                                    </div>
                                </div>

                                {p.individualBagWeights && p.individualBagWeights.length > 0 && (
                                    <div className="bg-primary/5 p-4 rounded-2xl border border-primary/10">
                                        <h5 className="text-[10px] font-black uppercase mb-3 text-primary opacity-60">Per Bag Weights (kg)</h5>
                                        <div className="grid grid-cols-6 gap-1 text-[10px]">
                                            {p.individualBagWeights.map((w, idx) => (
                                                <div key={idx} className="border bg-white text-center p-1 rounded font-bold">
                                                    {w.toFixed(1)}
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>

                            {p.payments.length > 0 && (
                                <div className="mt-6 border-t pt-4">
                                    <h5 className="text-[10px] font-black uppercase mb-3 opacity-60">Payment History</h5>
                                    <div className="space-y-2">
                                        {p.payments.map((pmt) => (
                                            <div key={pmt.id} className="flex justify-between text-xs bg-muted/20 p-2 rounded-lg">
                                                <span>{format(pmt.date, 'dd MMM yyyy, hh:mm a')}</span>
                                                <span className="font-black text-green-700">{formatCurrency(pmt.amount)}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                ))}
            </div>

            <div className="mt-20 pt-8 border-t text-[10px] text-muted-foreground italic text-center uppercase tracking-widest">
                Computer Generated Official Statement • Mandi Monitor Management System
            </div>
        </div>
    );
});
FarmerPurchaseTable.displayName = 'FarmerPurchaseTable';


export function PrivatePurchases() {
  const { purchases, addPurchase, addPayment } = useStockData();
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
      farmerName: '',
      itemType: 'paddy',
      quantity: 0,
      rate: 0,
      initialPayment: 0,
      description: '',
      vehicleType: 'farmer',
      destination: 'Mill',
      vehicleNumber: '',
      driverName: '',
      ownerName: '',
      tripCharge: 0,
      source: '',
      numberOfLabours: 0,
      labourerIds: [],
      labourCharge: 0,
      labourWageType: 'total_amount',
      calculationMethod: 'uniform',
      deductionKg: 0,
      grossWeightKg: 0,
      individualBagWeights: [],
    },
  });
  
  const { fields, append, remove } = useFieldArray({
    control: purchaseForm.control,
    name: "labourerIds"
  });

  const numberOfLabours = purchaseForm.watch('numberOfLabours');
  const selectedLabourerIds = purchaseForm.watch('labourerIds').map(l => l.value);

  useMemo(() => {
    const currentCount = fields.length;
    if (numberOfLabours > currentCount) {
        for(let i = currentCount; i < numberOfLabours; i++) {
            append({ value: '' });
        }
    } else if (numberOfLabours < currentCount) {
        for(let i = currentCount; i > numberOfLabours; i--) {
            remove(i-1);
        }
    }
  }, [numberOfLabours, fields.length, append, remove]);


  const paymentForm = useForm<z.infer<typeof paymentFormSchema>>({
    resolver: zodResolver(paymentFormSchema),
    defaultValues: { amount: 0 },
  });

  const vehicleType = purchaseForm.watch('vehicleType');
  const farmerNameValue = purchaseForm.watch('farmerName');

  useEffect(() => {
    if (farmerNameValue) {
        purchaseForm.setValue('source', farmerNameValue);
    }
  }, [farmerNameValue, purchaseForm]);

  const farmerAggregates = useMemo(() => {
    const farmers: Record<string, { id: string, name: string, purchases: any[], totalBalance: number }> = {};
    if (purchases) {
      purchases.forEach(p => {
        if (!farmers[p.farmerName]) {
          // Use a consistent ID for the farmer group based on the name
          farmers[p.farmerName] = { id: p.farmerName.replace(/\s+/g, '-'), name: p.farmerName, purchases: [], totalBalance: 0 };
        }
        farmers[p.farmerName].purchases.push(p);
      });

      Object.values(farmers).forEach(farmer => {
          farmer.totalBalance = farmer.purchases.reduce((acc, purchase) => acc + purchase.balance, 0);
      });
    }

    return Object.values(farmers);
  }, [purchases]);

  function onPurchaseSubmit(values: z.infer<typeof purchaseFormSchema>) {
    const labourerIds = values.labourerIds.map(l => l.value).filter(Boolean);
    const submissionValues = { ...values, labourerIds };

    addPurchase(submissionValues);
    toast({
      title: 'Success!',
      description: 'New private purchase has been recorded.',
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
                source: submissionValues.source || submissionValues.farmerName, 
                destination: submissionValues.destination || 'Mill',
                quantity: submissionValues.quantity,
                tripCharge: submissionValues.tripCharge,
            });
            toast({ title: 'Vehicle Updated', description: `Trip for ${submissionValues.vehicleNumber} has been added to Vehicle Register.` });
        }
    }
    
    if (labourerIds.length > 0 && submissionValues.labourCharge > 0) {
        addGroupWorkEntry(labourerIds, submissionValues.labourCharge, `Unloading ${submissionValues.itemType} from ${submissionValues.farmerName}`, submissionValues.quantity);
        toast({ title: 'Labour Updated', description: 'Work entry added to Labour Register.' });
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

  const handlePaymentClick = (e: React.MouseEvent, purchaseId: string) => {
    e.stopPropagation();
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

  const handleDownload = (farmerId: string, farmerName: string) => {
    downloadPdf(`printable-purchases-${farmerId}`, `purchase-summary-${farmerName.toLowerCase().replace(/\s+/g, '-')}`);
  }
  
  const handleCalculatorConfirm = (values: { 
    netQuintals: number; 
    grossWeightKg: number; 
    deductionKg: number; 
    bagWeights: number[]; 
    method: any 
  }) => {
    purchaseForm.setValue('quantity', values.netQuintals);
    purchaseForm.setValue('grossWeightKg', values.grossWeightKg);
    purchaseForm.setValue('deductionKg', values.deductionKg);
    purchaseForm.setValue('individualBagWeights', values.bagWeights);
    purchaseForm.setValue('calculationMethod', values.method);
    setCalculatorOpen(false);
  };

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
                      <div className="flex items-center gap-2 pt-8">
                        <Button type="button" variant="outline" onClick={() => setCalculatorOpen(true)}>
                          <Calculator className="mr-2 h-4 w-4" /> Calculator
                        </Button>
                      </div>
                      <FormField control={purchaseForm.control} name="quantity" render={({ field }) => (
                        <FormItem>
                          <FormLabel>Net Quantity (Qtl)</FormLabel>
                            <FormControl>
                              <Input type="number" step="0.01" placeholder="150" {...field} className="bg-primary/5 font-bold text-primary" />
                            </FormControl>
                          <FormMessage />
                        </FormItem>
                      )} />
                      <FormField control={purchaseForm.control} name="rate" render={({ field }) => (
                        <FormItem><FormLabel>Rate (₹ per Qtl)</FormLabel><FormControl><Input type="number" step="0.01" placeholder="2000" {...field} /></FormControl><FormMessage /></FormItem>
                      )} />
                      <FormField control={purchaseForm.control} name="initialPayment" render={({ field }) => (
                        <FormItem><FormLabel>Initial Amount Paid (₹)</FormLabel><FormControl><Input type="number" step="0.01" placeholder="50000" {...field} /></FormControl><FormMessage /></FormItem>
                      )} />
                    </div>
                    
                    <div className="bg-white p-4 rounded-xl border border-primary/10 grid grid-cols-3 gap-4">
                        <div className="flex items-center gap-2">
                            <Info className="h-4 w-4 text-muted-foreground" />
                            <span className="text-xs">Method: <span className="font-bold capitalize">{purchaseForm.watch('calculationMethod') || 'Manual'}</span></span>
                        </div>
                        <div className="text-xs">Gross: <span className="font-bold">{purchaseForm.watch('grossWeightKg')?.toLocaleString() || '0'} kg</span></div>
                        <div className="text-xs text-destructive">Deduction: <span className="font-bold">{purchaseForm.watch('deductionKg')?.toFixed(2) || '0.00'} kg</span></div>
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
                                <FormField control={purchaseForm.control} name="source" render={({ field }) => (
                                    <FormItem><FormLabel>Source</FormLabel><FormControl><Input placeholder="Source location" {...field} /></FormControl><FormMessage /></FormItem>
                                )} />
                                <FormField control={purchaseForm.control} name="destination" render={({ field }) => (
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
                            <FormField control={purchaseForm.control} name="numberOfLabours" render={({ field }) => (
                                <FormItem><FormLabel>Number of Labours</FormLabel><FormControl><Input type="number" {...field} /></FormControl><FormMessage /></FormItem>
                            )} />
                            <FormField control={purchaseForm.control} name="labourCharge" render={({ field }) => (
                                <FormItem><FormLabel>Total Labour Charge (₹)</FormLabel><FormControl><Input type="number" step="10" placeholder="e.g., 400" {...field} /></FormControl><FormMessage /></FormItem>
                            )} />
                        </div>
                        {fields.map((field, index) => (
                           <FormField
                            key={field.id}
                            control={purchaseForm.control}
                            name={`labourerIds.${index}.value`}
                            render={({ field }) => (
                                <FormItem className="mt-4">
                                <FormLabel>Labourer {index + 1}</FormLabel>
                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                    <FormControl><SelectTrigger><SelectValue placeholder="Select a labourer" /></SelectTrigger></FormControl>
                                    <SelectContent>
                                    {labourers
                                        .filter(l => !selectedLabourerIds.includes(l.id) || l.id === field.value)
                                        .map((l) => (
                                        <SelectItem key={l.id} value={l.id}>{l.name}</SelectItem>
                                    ))}
                                    </SelectContent>
                                </Select>
                                <FormMessage />
                                </FormItem>
                            )}
                            />
                        ))}
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
                        <div className="flex flex-col md:flex-row w-full p-4 items-start md:items-center justify-between hover:bg-muted/50 transition-colors gap-4">
                            <CollapsibleTrigger className="flex items-center gap-3 flex-grow cursor-pointer text-left">
                                {openFarmerCollapsibles[farmer.id] ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                                <UserIcon className="h-5 w-5 text-muted-foreground" />
                                <div className="flex-1">
                                    <span className="font-medium">{farmer.name}</span>
                                    <div className="text-sm">
                                        <span className="text-muted-foreground">Balance: </span>
                                        <span className={`font-semibold ${farmer.totalBalance < 0 ? 'text-green-600' : farmer.totalBalance > 0 ? 'text-destructive' : ''}`}>
                                            {formatCurrency(Math.abs(farmer.totalBalance))}
                                            {farmer.totalBalance < 0 ? ' (Adv)' : farmer.totalBalance > 0 ? ' (Payable)' : ''}
                                        </span>
                                    </div>
                                </div>
                            </CollapsibleTrigger>
                             <div className="flex items-center gap-2 self-end md:self-center ml-auto pl-8 md:pl-0">
                                <Button size="sm" variant="outline" onClick={(e) => { e.stopPropagation(); handleDownload(farmer.id, farmer.name); }}>
                                    <Download className="mr-2 h-4 w-4" /> PDF
                                </Button>
                                <Button size="sm" variant="outline" onClick={(e) => { e.stopPropagation(); purchaseForm.setValue('farmerName', farmer.name); setShowForm(true); window.scrollTo({top: 0, behavior: 'smooth'}); }}>
                                    <PlusCircle className="mr-2 h-4 w-4" /> Purchase
                                </Button>
                            </div>
                        </div>
                        <CollapsibleContent className="bg-slate-50 dark:bg-slate-900/50">
                            <div className="absolute -left-[9999px] top-auto">
                                <div id={`printable-purchases-${farmer.id}`}>
                                    <FarmerPurchaseTable farmer={farmer} />
                                </div>
                            </div>
                            <div className="p-4 space-y-4">
                               {farmer.purchases.length > 0 ? (
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead>Date</TableHead>
                                                <TableHead>Item</TableHead>
                                                <TableHead>Method</TableHead>
                                                <TableHead className="text-right">Deduction (kg)</TableHead>
                                                <TableHead className="text-right">Total (₹)</TableHead>
                                                <TableHead className="text-right">Balance (₹)</TableHead>
                                                <TableHead className="text-right">Actions</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {farmer.purchases.map((p: PrivatePurchase) => (
                                                <TableRow key={p.id}>
                                                    <TableCell>{format(p.date, 'dd MMM yyyy')}</TableCell>
                                                    <TableCell className="capitalize">{p.itemType}</TableCell>
                                                    <TableCell>
                                                        <Badge variant="outline" className="capitalize text-[10px]">
                                                            {p.calculationMethod || 'manual'}
                                                        </Badge>
                                                    </TableCell>
                                                    <TableCell className="text-right font-medium text-destructive">
                                                        {p.deductionKg ? `-${p.deductionKg.toFixed(2)}` : '0.00'}
                                                    </TableCell>
                                                    <TableCell className="text-right">{formatCurrency(p.totalAmount)}</TableCell>
                                                    <TableCell className={`text-right font-semibold ${p.balance < 0 ? 'text-green-600' : p.balance > 0 ? 'text-destructive' : ''}`}>
                                                        {p.balance < 0 ? `${formatCurrency(Math.abs(p.balance))} (Adv)` : formatCurrency(p.balance)}
                                                    </TableCell>
                                                    <TableCell className="text-right">
                                                        <Button size="sm" variant="secondary" onClick={(e) => handlePaymentClick(e, p.id)}>Pay</Button>
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                               ) : (
                                <p className="text-sm text-center text-muted-foreground">No purchases from this farmer.</p>
                               )}
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
      <Dialog open={isCalculatorOpen} onOpenChange={setCalculatorOpen}>
        <BagWeightCalculator 
            onConfirm={handleCalculatorConfirm} 
            onCancel={() => setCalculatorOpen(false)} 
            isPrivate={true}
        />
      </Dialog>
    </>
  );
}
