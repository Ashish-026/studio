'use client';

import { useState, useMemo, useEffect } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useMandiData } from '@/context/mandi-context';
import { useVehicleData } from '@/context/vehicle-context';
import { useLabourData } from '@/context/labour-context';
import { useStockData } from '@/context/stock-context';
import { PlusCircle, DollarSign, Download, Edit, Car, Users, Calculator, Calendar as CalendarIcon, Info, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAuth } from '@/hooks/use-auth';
import { Separator } from '@/components/ui/separator';
import { downloadPdf } from '@/lib/pdf-utils';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog';
import type { PaddyLifted as PaddyLiftedType } from '@/lib/types';
import { Label } from '../ui/label';
import { format } from 'date-fns';
import { BagWeightCalculator } from './bag-weight-calculator';
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover';
import { Calendar } from '../ui/calendar';
import { cn } from '@/lib/utils';
import { Switch } from '../ui/switch';
import { Textarea } from '../ui/textarea';

const labourDetailsSchema = z.object({
  numberOfLabours: z.coerce.number().min(0).default(0),
  labourerIds: z.array(z.object({ value: z.string().min(1, "Please select a labourer.") })).default([]),
  labourWageType: z.enum(['per_item', 'total_amount']).default('total_amount'),
  labourCharge: z.coerce.number().min(0).default(0),
});

const physicalFormSchema = z.object({
  mandiName: z.string().min(1, 'Mandi name is required'),
  farmerName: z.string().min(1, 'Farmer name is required'),
  totalPaddyReceived: z.coerce.number().positive('Must be a positive number'),
  mandiWeight: z.coerce.number().positive('Must be a positive number'),
  date: z.date({ required_error: 'A date is required.' }),
  tokenNumber: z.string().optional(),
  mandiTokenLimit: z.coerce.number().optional(),
  isPrivateOverflow: z.boolean().default(false),
  privateOverflowRate: z.coerce.number().optional(),
  description: z.string().optional(),
  vehicleType: z.enum(['farmer', 'own', 'hired'], { required_error: 'Vehicle type is required' }),
  vehicleNumber: z.string().optional(),
  driverName: z.string().optional(),
  ownerName: z.string().optional(),
  tripCharge: z.coerce.number().optional(),
  source: z.string().optional(),
  destination: z.string().optional(),
}).merge(labourDetailsSchema).refine(data => {
    if (data.vehicleType === 'hired') {
        return !!data.vehicleNumber && !!data.driverName && !!data.ownerName && data.tripCharge !== undefined && data.tripCharge > 0;
    }
    return true;
}, {
    message: "Hired vehicle details are incomplete.",
    path: ['tripCharge'],
}).refine(data => {
    if (data.isPrivateOverflow) {
        return !!data.mandiTokenLimit && !!data.privateOverflowRate && data.mandiTokenLimit < data.mandiWeight;
    }
    return true;
}, {
    message: "Overflow requires a token limit and rate. Limit must be less than weight.",
    path: ['privateOverflowRate'],
});

const monetaryFormSchema = z.object({
  mandiName: z.string().min(1, 'Mandi name is required'),
  moneyReceived: z.coerce.number().positive('Must be a positive number'),
  ratePerQuintal: z.coerce.number().positive('Must be a positive number'),
  date: z.date({ required_error: 'A date is required.' }),
});


export function PaddyLifted() {
  const { paddyLiftedItems, addPaddyLifted, updatePaddyLifted, targetAllocations } = useMandiData();
  const { addVehicle, addTrip } = useVehicleData();
  const { addGroupWorkEntry, labourers } = useLabourData();
  const { addPurchase } = useStockData();
  const { toast } = useToast();
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';
  const [showPhysicalForm, setShowPhysicalForm] = useState(false);
  const [showMonetaryForm, setShowMonetaryForm] = useState(false);
  const [editingEntry, setEditingEntry] = useState<PaddyLiftedType | null>(null);
  const [isEditDialogOpen, setEditDialogOpen] = useState(false);
  const [isCalculatorOpen, setCalculatorOpen] = useState(false);
  const [selectedMandi, setSelectedMandi] = useState('All');

  const [isPhysicalCalendarOpen, setIsPhysicalCalendarOpen] = useState(false);
  const [isMonetaryCalendarOpen, setIsMonetaryCalendarOpen] = useState(false);
  const [isEditCalendarOpen, setIsEditCalendarOpen] = useState(false);

  const uniqueMandis = useMemo(() => {
    const mandiNames = (targetAllocations || []).map((allocation) => allocation.mandiName);
    return [...new Set(mandiNames)];
  }, [targetAllocations]);

  const filteredItems = useMemo(() => {
    return (paddyLiftedItems || []).filter(item => selectedMandi === 'All' || item.mandiName === selectedMandi);
  }, [paddyLiftedItems, selectedMandi]);
  
  const physicalEntries = useMemo(() => 
    filteredItems.filter(item => item.entryType === 'physical' || !item.entryType).sort((a,b) => b.date.getTime() - a.date.getTime()), 
  [filteredItems]);

  const monetaryEntries = useMemo(() => 
    filteredItems.filter(item => item.entryType === 'monetary').sort((a,b) => b.date.getTime() - a.date.getTime()), 
  [filteredItems]);

  const physicalForm = useForm<z.infer<typeof physicalFormSchema>>({
    resolver: zodResolver(physicalFormSchema),
    defaultValues: {
        mandiName: '',
        farmerName: '',
        vehicleType: 'farmer',
        destination: 'Mill',
        totalPaddyReceived: 0,
        mandiWeight: 0,
        date: new Date(),
        isPrivateOverflow: false,
        privateOverflowRate: 0,
        mandiTokenLimit: 0,
        tokenNumber: '',
        description: '',
        vehicleNumber: '',
        driverName: '',
        ownerName: '',
        tripCharge: 0,
        source: '',
        numberOfLabours: 0,
        labourerIds: [],
        labourCharge: 0,
        labourWageType: 'total_amount',
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: physicalForm.control,
    name: "labourerIds"
  });

  const numberOfLabours = physicalForm.watch('numberOfLabours');
  const selectedLabourerIds = physicalForm.watch('labourerIds').map(l => l.value);
  const isOverflowEnabled = physicalForm.watch('isPrivateOverflow');
  const mandiWeight = physicalForm.watch('mandiWeight');
  const tokenLimit = physicalForm.watch('mandiTokenLimit');

  const overflowQuantity = useMemo(() => {
    if (mandiWeight > 0 && tokenLimit > 0) {
        return Math.max(0, mandiWeight - tokenLimit);
    }
    return 0;
  }, [mandiWeight, tokenLimit]);

  useEffect(() => {
    const currentCount = fields.length;
    if (numberOfLabours > currentCount) {
        for(let i = currentCount; i < numberOfLabours; i++) append({ value: '' });
    } else if (numberOfLabours < currentCount) {
        for(let i = currentCount; i > numberOfLabours; i--) remove(i-1);
    }
  }, [numberOfLabours, fields.length, append, remove]);

  const monetaryForm = useForm<z.infer<typeof monetaryFormSchema>>({
    resolver: zodResolver(monetaryFormSchema),
    defaultValues: { mandiName: '', moneyReceived: 0, ratePerQuintal: 0, date: new Date() },
  });
  
  const vehicleType = physicalForm.watch('vehicleType');
  const mandiNameValue = physicalForm.watch('mandiName');

  useEffect(() => {
    if (mandiNameValue) physicalForm.setValue('source', mandiNameValue);
  }, [mandiNameValue, physicalForm]);

  function onPhysicalSubmit(values: z.infer<typeof physicalFormSchema>) {
    const labourerIds = values.labourerIds.map(l => l.value).filter(Boolean);
    
    // Handle split entry logic
    let finalMandiWeight = values.mandiWeight;
    let actualOverflow = 0;

    if (values.isPrivateOverflow && values.mandiTokenLimit && values.mandiTokenLimit < values.mandiWeight) {
        finalMandiWeight = values.mandiTokenLimit;
        actualOverflow = values.mandiWeight - values.mandiTokenLimit;
        
        // Automated Private Purchase
        addPurchase({
            farmerName: values.farmerName,
            itemType: 'paddy',
            quantity: actualOverflow,
            rate: values.privateOverflowRate || 0,
            initialPayment: 0,
            description: `Overflow from Mandi Token ${values.tokenNumber || 'N/A'}. Total weight was ${values.mandiWeight} Qtl.`,
            vehicleType: values.vehicleType,
            vehicleNumber: values.vehicleNumber,
            driverName: values.driverName,
            ownerName: values.ownerName,
            tripCharge: 0, // Trip charge already handled by Mandi lifting
            source: values.source,
            destination: values.destination,
            labourerIds: [], // Labour already handled
            labourCharge: 0
        });
        toast({ title: 'Private Entry Created', description: `${actualOverflow.toFixed(2)} Qtl moved to Private Register.` });
    }

    const submissionValues = { 
        ...values, 
        mandiWeight: finalMandiWeight,
        privateOverflowQty: actualOverflow,
        labourerIds, 
        entryType: 'physical' as const 
    };

    if (editingEntry) {
      updatePaddyLifted(editingEntry.id, { ...editingEntry, ...submissionValues });
      toast({ title: 'Success!', description: 'Paddy lifting record updated.' });
    } else {
      addPaddyLifted(submissionValues);
      toast({ title: 'Success!', description: 'Physical paddy lifting added.' });

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
                source: submissionValues.source || submissionValues.mandiName,
                destination: submissionValues.destination || 'Mill',
                quantity: submissionValues.totalPaddyReceived,
                tripCharge: submissionValues.tripCharge,
            });
        }
      }

      if (labourerIds.length > 0 && submissionValues.labourCharge > 0) {
        addGroupWorkEntry(labourerIds, submissionValues.labourCharge, `Paddy lifting: ${submissionValues.mandiName}`, submissionValues.totalPaddyReceived);
      }
    }
    physicalForm.reset();
    setShowPhysicalForm(false);
    setEditDialogOpen(false);
    setEditingEntry(null);
  }

  function onMonetarySubmit(values: z.infer<typeof monetaryFormSchema>) {
    const equivalentQuintal = values.moneyReceived / values.ratePerQuintal;
    const newEntryData = {
      mandiName: values.mandiName,
      farmerName: `Monetary Entry`,
      moneyReceived: values.moneyReceived,
      ratePerQuintal: values.ratePerQuintal,
      totalPaddyReceived: equivalentQuintal,
      mandiWeight: 0, 
      date: values.date,
      entryType: 'monetary' as const,
    };
    
    if (editingEntry) {
      updatePaddyLifted(editingEntry.id, { ...editingEntry, ...newEntryData });
    } else {
      addPaddyLifted(newEntryData);
    }
    
    monetaryForm.reset();
    setShowMonetaryForm(false);
    setEditDialogOpen(false);
    setEditingEntry(null);
  }

  const handleEditClick = (entry: PaddyLiftedType) => {
    setEditingEntry(entry);
    setEditDialogOpen(true);
  };

  const handleCalculatorConfirm = (vals: { grossQuintals: number; netQuintals: number; netWeightKg: number }) => {
    physicalForm.setValue('totalPaddyReceived', vals.grossQuintals);
    physicalForm.setValue('mandiWeight', vals.netQuintals);
    setCalculatorOpen(false);
  };

  return (
    <>
      <Card className="border-none shadow-none bg-transparent">
        <CardHeader className="px-0 pt-0">
          <div className="flex justify-between items-start mb-6">
            <div>
              <CardTitle className="text-2xl font-bold font-headline text-primary">Paddy Lifting Records</CardTitle>
              <CardDescription>Procurement from Mandis with automated FAQ weight factors and Token management.</CardDescription>
            </div>
             <Button variant="outline" size="sm" onClick={() => downloadPdf('paddy-lifted-table', 'paddy-lifted-summary')} className="rounded-xl border-primary/20">
                <Download className="mr-2 h-4 w-4" />
                Export PDF
            </Button>
          </div>
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div className="flex items-center gap-4">
                <Label htmlFor="mandi-filter" className="text-sm font-semibold uppercase tracking-tighter opacity-60">Filter Mandi:</Label>
                <Select value={selectedMandi} onValueChange={setSelectedMandi}>
                  <SelectTrigger className="w-[240px] rounded-xl border-primary/10 shadow-sm" id="mandi-filter">
                    <SelectValue placeholder="All Mandis" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="All">All Mandis</SelectItem>
                    {uniqueMandis.map((mandi) => ( <SelectItem key={mandi} value={mandi}>{mandi}</SelectItem> ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex gap-3">
                <Button onClick={() => setShowPhysicalForm(!showPhysicalForm)} className="rounded-xl shadow-lg shadow-primary/10" disabled={uniqueMandis.length === 0}>
                  <PlusCircle className="mr-2 h-4 w-4" />
                  {showPhysicalForm ? 'Cancel' : 'Physical Lifting'}
                </Button>
                {isAdmin && (
                  <Button onClick={() => setShowMonetaryForm(!showMonetaryForm)} variant="secondary" className="rounded-xl shadow-md" disabled={uniqueMandis.length === 0}>
                    <DollarSign className="mr-2 h-4 w-4" />
                    {showMonetaryForm ? 'Cancel' : 'Monetary'}
                  </Button>
                )}
              </div>
          </div>
        </CardHeader>
        <CardContent className="px-0 space-y-8">
          {showPhysicalForm && (
            <Card className="bg-white border-primary/10 shadow-2xl rounded-3xl overflow-hidden animate-in zoom-in-95 duration-300">
              <CardHeader className="bg-primary/5 border-b border-primary/10 pb-4">
                  <CardTitle className="text-lg font-bold text-primary">New Paddy Arrival Entry</CardTitle>
                  <CardDescription>Enter procurement details. Use calculator for 78->75 standardized weights.</CardDescription>
              </CardHeader>
              <CardContent className="pt-6">
                <Form {...physicalForm}>
                  <form onSubmit={physicalForm.handleSubmit(onPhysicalSubmit)} className="space-y-8">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 items-start">
                      <FormField control={physicalForm.control} name="mandiName" render={({ field }) => (
                          <FormItem><FormLabel>Mandi Source</FormLabel><Select onValueChange={field.onChange} defaultValue={field.value}><FormControl><SelectTrigger className="rounded-xl h-12"><SelectValue placeholder="Select mandi..." /></SelectTrigger></FormControl><SelectContent>{uniqueMandis.map((mandi) => ( <SelectItem key={mandi} value={mandi}>{mandi}</SelectItem> ))}</SelectContent></Select><FormMessage /></FormItem>
                      )} />
                      <FormField control={physicalForm.control} name="farmerName" render={({ field }) => (
                        <FormItem><FormLabel>Farmer Name</FormLabel><FormControl><Input placeholder="e.g., Rajesh Kumar" {...field} className="rounded-xl h-12" /></FormControl><FormMessage /></FormItem>
                      )} />
                      <FormField control={physicalForm.control} name="date" render={({ field }) => (
                        <FormItem className="flex flex-col">
                          <FormLabel>Arrival Date</FormLabel>
                          <Popover open={isPhysicalCalendarOpen} onOpenChange={setIsPhysicalCalendarOpen}>
                            <PopoverTrigger asChild><FormControl><Button variant={"outline"} className={cn("h-12 rounded-xl pl-3 text-left font-normal border-input", !field.value && "text-muted-foreground")}>{field.value ? format(field.value, "PPP") : <span>Pick date</span>}<CalendarIcon className="ml-auto h-4 w-4 opacity-50" /></Button></FormControl></PopoverTrigger>
                            <PopoverContent className="w-auto p-0 rounded-2xl overflow-hidden" align="start"><Calendar mode="single" selected={field.value} onSelect={(date) => { field.onChange(date); setIsPhysicalCalendarOpen(false); }} initialFocus /></PopoverContent>
                          </Popover>
                          <FormMessage />
                        </FormItem>
                      )} />
                       <FormField control={physicalForm.control} name="totalPaddyReceived" render={({ field }) => (
                        <FormItem>
                          <FormLabel>Total Gross (Actual Qtl)</FormLabel>
                            <div className="flex items-center gap-2">
                              <FormControl><Input type="number" step="0.01" placeholder="0.00" {...field} className="rounded-xl h-12" /></FormControl>
                              <Button type="button" variant="outline" size="icon" onClick={() => setCalculatorOpen(true)} className="h-12 w-12 rounded-xl border-primary/20 hover:bg-primary/5"><Calculator className="h-5 w-5 text-primary" /></Button>
                            </div>
                          <FormMessage />
                        </FormItem>
                      )} />
                      <FormField control={physicalForm.control} name="mandiWeight" render={({ field }) => (
                        <FormItem><FormLabel>FAQ Standard (Mandi Qtl)</FormLabel><FormControl><Input type="number" step="0.01" placeholder="0.00" {...field} className="rounded-xl h-12 bg-primary/5 border-primary/20 font-bold text-primary" /></FormControl><FormMessage /></FormItem>
                      )} />
                    </div>

                    <div className="bg-muted/30 p-6 rounded-3xl border border-primary/5 space-y-6">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2 text-primary font-bold"><Info className="h-5 w-5" /> Token & Overflow Management</div>
                            <div className="flex items-center gap-3">
                                <span className="text-sm font-medium opacity-70">Excess to Private Register?</span>
                                <FormField control={physicalForm.control} name="isPrivateOverflow" render={({ field }) => (
                                    <Switch checked={field.value} onCheckedChange={field.onChange} />
                                )} />
                            </div>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 items-end">
                            <FormField control={physicalForm.control} name="tokenNumber" render={({ field }) => (
                                <FormItem><FormLabel>Token Number</FormLabel><FormControl><Input placeholder="Token ID" {...field} className="rounded-xl" /></FormControl></FormItem>
                            )} />
                            <FormField control={physicalForm.control} name="mandiTokenLimit" render={({ field }) => (
                                <FormItem><FormLabel>Mandi Token Limit (Qtl)</FormLabel><FormControl><Input type="number" step="0.01" placeholder="Token Quantity" {...field} className="rounded-xl" /></FormControl></FormItem>
                            )} />
                            {isOverflowEnabled && (
                                <>
                                    <FormItem>
                                        <FormLabel>Calculated Excess (Qtl)</FormLabel>
                                        <div className="h-10 flex items-center px-3 bg-destructive/10 text-destructive rounded-xl font-bold text-sm">
                                            {overflowQuantity.toFixed(2)} Qtl
                                        </div>
                                    </FormItem>
                                    <FormField control={physicalForm.control} name="privateOverflowRate" render={({ field }) => (
                                        <FormItem><FormLabel>Private Rate (₹/Qtl)</FormLabel><FormControl><Input type="number" step="0.01" placeholder="Rate for excess" {...field} className="rounded-xl" /></FormControl></FormItem>
                                    )} />
                                </>
                            )}
                        </div>
                        {isOverflowEnabled && overflowQuantity > 0 && (
                            <div className="flex items-center gap-2 text-xs font-medium text-destructive bg-white/50 p-3 rounded-xl border border-destructive/10">
                                <ArrowRight className="h-3 w-3" />
                                <span>On submission, <strong>{tokenLimit} Qtl</strong> will be registered here, and <strong>{overflowQuantity.toFixed(2)} Qtl</strong> will automatically appear in Private Register.</span>
                            </div>
                        )}
                    </div>

                    <Separator className="opacity-50" />
                    
                    <div className="space-y-6">
                        <h3 className="text-md font-bold flex items-center gap-2 text-primary opacity-80"><Car className="h-5 w-5" /> Logistics & Transport</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 items-start">
                           <FormField control={physicalForm.control} name="vehicleType" render={({ field }) => (
                                <FormItem><FormLabel>Vehicle Ownership</FormLabel><Select onValueChange={field.onChange} defaultValue={field.value}><FormControl><SelectTrigger className="rounded-xl"><SelectValue/></SelectTrigger></FormControl><SelectContent><SelectItem value="farmer">Farmer's Vehicle</SelectItem><SelectItem value="own">Own Vehicle</SelectItem><SelectItem value="hired">Hired Vehicle</SelectItem></SelectContent></Select><FormMessage /></FormItem>
                           )} />
                           {vehicleType === 'hired' && (
                            <>
                                <FormField control={physicalForm.control} name="vehicleNumber" render={({ field }) => (
                                    <FormItem><FormLabel>Vehicle Number</FormLabel><FormControl><Input placeholder="OD01AB1234" {...field} className="rounded-xl" /></FormControl></FormItem>
                                )} />
                                <FormField control={physicalForm.control} name="ownerName" render={({ field }) => (
                                    <FormItem><FormLabel>Agency/Owner</FormLabel><FormControl><Input placeholder="Agency Name" {...field} className="rounded-xl" /></FormControl></FormItem>
                                )} />
                                <FormField control={physicalForm.control} name="tripCharge" render={({ field }) => (
                                    <FormItem><FormLabel>Rent/Trip Charge (₹)</FormLabel><FormControl><Input type="number" step="10" placeholder="0" {...field} className="rounded-xl" /></FormControl></FormItem>
                                )} />
                            </>
                           )}
                        </div>
                    </div>

                    <Separator className="opacity-50" />

                    <div className="space-y-6">
                        <h3 className="text-md font-bold flex items-center gap-2 text-primary opacity-80"><Users className="h-5 w-5" /> Labour Allocation</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <FormField control={physicalForm.control} name="numberOfLabours" render={({ field }) => (
                                <FormItem><FormLabel>Crews/Persons</FormLabel><FormControl><Input type="number" {...field} className="rounded-xl" /></FormControl></FormItem>
                            )} />
                            <FormField control={physicalForm.control} name="labourCharge" render={({ field }) => (
                                <FormItem><FormLabel>Total Unloading Fee (₹)</FormLabel><FormControl><Input type="number" step="10" placeholder="0" {...field} className="rounded-xl" /></FormControl></FormItem>
                            )} />
                        </div>
                         <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {fields.map((field, index) => (
                            <FormField key={field.id} control={physicalForm.control} name={`labourerIds.${index}.value`} render={({ field }) => (
                                <FormItem><Select onValueChange={field.onChange} defaultValue={field.value}><FormControl><SelectTrigger className="rounded-xl"><SelectValue placeholder={`Select Labourer ${index + 1}`} /></SelectTrigger></FormControl><SelectContent>{(labourers || []).map((l) => ( <SelectItem key={l.id} value={l.id}>{l.name}</SelectItem> ))}</SelectContent></Select><FormMessage /></FormItem>
                            )} />
                            ))}
                        </div>
                    </div>

                    <Button type="submit" className="w-full bg-primary hover:bg-primary/90 h-14 rounded-2xl font-bold text-lg shadow-xl shadow-primary/20">Record Procurement Arrival</Button>
                  </form>
                </Form>
              </CardContent>
            </Card>
          )}

          <div id="paddy-lifted-table" className="bg-white border border-primary/5 rounded-3xl overflow-hidden shadow-sm">
              <div className="p-6 border-b border-primary/5">
                  <h3 className="text-lg font-bold text-primary">Physical Procurement History</h3>
              </div>
              <Table>
                  <TableHeader className="bg-muted/30">
                      <TableRow className="border-none">
                          <TableHead className="font-bold py-4">Date</TableHead>
                          <TableHead className="font-bold py-4">Mandi Source</TableHead>
                          <TableHead className="font-bold py-4">Farmer / Token</TableHead>
                          <TableHead className="font-bold py-4">Actual (Qtl)</TableHead>
                          <TableHead className="text-right font-bold py-4">Mandi FAQ (Qtl)</TableHead>
                          {isAdmin && <TableHead className="text-right font-bold py-4">Actions</TableHead>}
                      </TableRow>
                  </TableHeader>
                  <TableBody>
                      {physicalEntries.length === 0 && (
                          <TableRow><TableCell colSpan={isAdmin ? 6 : 5} className="text-center h-32 opacity-50 italic">No procurement records found.</TableCell></TableRow>
                      )}
                      {physicalEntries.map((item) => (
                      <TableRow key={item.id} className="hover:bg-primary/5 transition-colors">
                          <TableCell className="text-xs">{format(item.date, 'dd MMM yyyy')}</TableCell>
                          <TableCell className="font-bold text-primary">{item.mandiName}</TableCell>
                          <TableCell>
                              <div className="flex flex-col">
                                  <span className="font-medium">{item.farmerName}</span>
                                  {item.tokenNumber && <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-widest">TOKEN: {item.tokenNumber}</span>}
                              </div>
                          </TableCell>
                          <TableCell className="text-xs">{item.totalPaddyReceived.toLocaleString('en-IN', { maximumFractionDigits: 2 })}</TableCell>
                          <TableCell className="text-right font-black text-primary">{item.mandiWeight.toLocaleString('en-IN', { maximumFractionDigits: 2 })}</TableCell>
                          {isAdmin && (
                            <TableCell className="text-right">
                              <Button variant="ghost" size="icon" onClick={() => handleEditClick(item)} className="rounded-lg hover:text-primary hover:bg-primary/10">
                                <Edit className="h-4 w-4" />
                              </Button>
                            </TableCell>
                          )}
                      </TableRow>
                      ))}
                  </TableBody>
              </Table>
          </div>
        </CardContent>
      </Card>
      
      <Dialog open={isCalculatorOpen} onOpenChange={setCalculatorOpen}>
        <BagWeightCalculator onConfirm={handleCalculatorConfirm} onCancel={() => setCalculatorOpen(false)} />
      </Dialog>
      
      <Dialog open={isEditDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="rounded-3xl border-none p-6">
            <DialogHeader><DialogTitle>Edit Lifting Entry</DialogTitle></DialogHeader>
            <Form {...(editingEntry?.entryType === 'monetary' ? monetaryForm : physicalForm)}>
                <form onSubmit={(editingEntry?.entryType === 'monetary' ? monetaryForm : physicalForm).handleSubmit(editingEntry?.entryType === 'monetary' ? onMonetarySubmit as any : onPhysicalSubmit as any)} className="space-y-4">
                    <FormField control={(editingEntry?.entryType === 'monetary' ? monetaryForm : physicalForm).control} name="mandiWeight" render={({ field }) => (
                        <FormItem><FormLabel>Mandi Weight (Qtl)</FormLabel><FormControl><Input type="number" step="0.01" {...field} className="rounded-xl" /></FormControl><FormMessage /></FormItem>
                    )} />
                    <Button type="submit" className="w-full bg-primary text-white h-12 rounded-xl font-bold">Save Updates</Button>
                </form>
            </Form>
        </DialogContent>
      </Dialog>
    </>
  );
}
