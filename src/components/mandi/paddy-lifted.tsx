
'use client';

import { useState, useMemo, useEffect } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useMandiData } from '@/context/mandi-context';
import { useVehicleData } from '@/context/vehicle-context';
import { useLabourData } from '@/context/labour-context';
import { useStockData as useMainStockData } from '@/context/stock-context';
import { useMill } from '@/hooks/use-mill';
import { PlusCircle, DollarSign, Trash2, Car, Users, Calculator, Calendar as CalendarIcon, Info, FileText, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAuth } from '@/hooks/use-auth';
import { Separator } from '@/components/ui/separator';
import { downloadPdf } from '@/lib/pdf-utils';
import type { PaddyLifted as PaddyLiftedType } from '@/lib/types';
import { Label } from '../ui/label';
import { format, isValid } from 'date-fns';
import { BagWeightCalculator } from './bag-weight-calculator';
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover';
import { Calendar } from '../ui/calendar';
import { cn } from '@/lib/utils';
import { Switch } from '../ui/switch';
import { PaddyLiftingSlip } from './paddy-lifting-slip';
import { Badge } from '../ui/badge';
import { Dialog } from '@/components/ui/dialog';

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
  calculationMethod: z.enum(['uniform', 'bag-by-bag', 'weighbridge']).default('uniform'),
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

const monetaryFormSchema = z.object({
  mandiName: z.string().min(1, 'Mandi name is required'),
  moneyReceived: z.coerce.number().positive('Must be a positive number'),
  ratePerQuintal: z.coerce.number().positive('Must be a positive number'),
  date: z.date({ required_error: 'A date is required.' }),
});

export function PaddyLifted() {
  const { paddyLiftedItems, addPaddyLifted, deletePaddyLifted, targetAllocations } = useMandiData();
  const { addVehicle, addTrip } = useVehicleData();
  const { labourers, addGroupWorkEntry } = useLabourData();
  const { addPurchase } = useMainStockData();
  const { selectedMill } = useMill();
  const { toast } = useToast();
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';
  const [showPhysicalForm, setShowPhysicalForm] = useState(false);
  const [showMonetaryForm, setShowMonetaryForm] = useState(false);
  const [isCalculatorOpen, setCalculatorOpen] = useState(false);
  const [selectedMandi, setSelectedMandi] = useState('All');
  const [isPhysicalCalendarOpen, setIsPhysicalCalendarOpen] = useState(false);

  const uniqueMandis = useMemo(() => {
    const mandiNames = (targetAllocations || []).map((allocation) => allocation.mandiName);
    return [...new Set(mandiNames.filter(Boolean))];
  }, [targetAllocations]);

  const physicalEntries = useMemo(() => 
    (paddyLiftedItems || [])
      .filter(item => selectedMandi === 'All' || item.mandiName === selectedMandi)
      .filter(item => item.entryType === 'physical' || !item.entryType)
      .sort((a,b) => {
        const dateA = new Date(a.date).getTime() || 0;
        const dateB = new Date(b.date).getTime() || 0;
        return dateB - dateA;
      }), 
  [paddyLiftedItems, selectedMandi]);

  const physicalForm = useForm<z.infer<typeof physicalFormSchema>>({
    resolver: zodResolver(physicalFormSchema),
    defaultValues: {
        mandiName: '', farmerName: '', vehicleType: 'farmer', destination: 'Mill',
        totalPaddyReceived: 0, mandiWeight: 0, date: new Date(), calculationMethod: 'uniform',
        isPrivateOverflow: false, privateOverflowRate: 0, mandiTokenLimit: 0,
        tokenNumber: '', description: '', vehicleNumber: '', driverName: '',
        ownerName: '', tripCharge: 0, source: '', numberOfLabours: 0,
        labourerIds: [], labourCharge: 0, labourWageType: 'total_amount', individualBagWeights: [],
    },
  });

  const { fields, append, remove } = useFieldArray({ control: physicalForm.control, name: "labourerIds" });

  const monetaryForm = useForm<z.infer<typeof monetaryFormSchema>>({
    resolver: zodResolver(monetaryFormSchema),
    defaultValues: { mandiName: '', moneyReceived: 0, ratePerQuintal: 0, date: new Date() },
  });
  
  const numberOfLabours = physicalForm.watch('numberOfLabours');
  const mandiWeight = physicalForm.watch('mandiWeight');
  const tokenLimit = physicalForm.watch('mandiTokenLimit');
  const isOverflowEnabled = physicalForm.watch('isPrivateOverflow');
  const vehicleType = physicalForm.watch('vehicleType');
  const watchedBagWeights = physicalForm.watch('individualBagWeights');

  // Hardened loop protection for labour selection
  useEffect(() => {
    const target = Math.max(0, parseInt(String(numberOfLabours || 0)));
    const current = fields.length;
    if (target === current) return;
    if (target > current) {
      append(Array(target - current).fill({ value: '' }));
    } else {
      for (let i = current; i > target; i--) remove(i - 1);
    }
  }, [numberOfLabours, fields.length, append, remove]);

  const overflowQuantity = useMemo(() => {
    const mw = parseFloat(String(mandiWeight || 0));
    const tl = parseFloat(String(tokenLimit || 0));
    if (mw > 0 && tl > 0) return Math.max(0, mw - tl);
    return 0;
  }, [mandiWeight, tokenLimit]);

  function onPhysicalSubmit(values: z.infer<typeof physicalFormSchema>) {
    const labourerIds = values.labourerIds.map(l => l.value).filter(Boolean);
    let finalMandiWeight = values.mandiWeight;
    let actualOverflow = 0;

    if (values.isPrivateOverflow && values.mandiTokenLimit && values.mandiTokenLimit < values.mandiWeight) {
        finalMandiWeight = values.mandiTokenLimit;
        actualOverflow = values.mandiWeight - values.mandiTokenLimit;
        
        addPurchase({
            farmerName: values.farmerName, itemType: 'paddy', quantity: actualOverflow,
            rate: values.privateOverflowRate || 0, initialPayment: 0,
            description: `Overflow from Mandi Token ${values.tokenNumber || 'N/A'}.`,
            vehicleType: values.vehicleType, vehicleNumber: values.vehicleNumber,
            driverName: values.driverName, ownerName: values.ownerName, tripCharge: 0,
            source: values.source, destination: values.destination, labourerIds: [], labourCharge: 0
        });
    }

    const submissionValues = { 
        ...values, mandiWeight: finalMandiWeight, privateOverflowQty: actualOverflow,
        labourerIds, entryType: 'physical' as const 
    };

    addPaddyLifted(submissionValues);
    toast({ title: 'Success!', description: 'Arrival recorded.' });

    if (submissionValues.vehicleType === 'hired' && submissionValues.vehicleNumber && submissionValues.tripCharge) {
      const vehicleId = addVehicle({
          vehicleNumber: submissionValues.vehicleNumber, driverName: submissionValues.driverName || '',
          ownerName: submissionValues.ownerName || '', rentType: 'per_trip', rentAmount: 0,
      });
      if (vehicleId) {
          addTrip(vehicleId, {
              source: submissionValues.source || submissionValues.mandiName,
              destination: submissionValues.destination || 'Mill',
              quantity: submissionValues.totalPaddyReceived, tripCharge: submissionValues.tripCharge,
          });
      }
    }

    if (labourerIds.length > 0 && submissionValues.labourCharge > 0) {
      addGroupWorkEntry(labourerIds, submissionValues.labourCharge, `Paddy lifting: ${submissionValues.mandiName}`, submissionValues.totalPaddyReceived);
    }
    cancelForm();
  }

  function onMonetarySubmit(values: z.infer<typeof monetaryFormSchema>) {
    const equivalentQuintal = values.moneyReceived / values.ratePerQuintal;
    const newEntryData = {
      mandiName: values.mandiName, farmerName: `Monetary Entry`,
      moneyReceived: values.moneyReceived, ratePerQuintal: values.ratePerQuintal,
      totalPaddyReceived: equivalentQuintal, mandiWeight: 0, date: values.date, entryType: 'monetary' as const,
    };
    
    addPaddyLifted(newEntryData);
    cancelForm();
  }

  const handleDeleteClick = (id: string) => {
    deletePaddyLifted(id);
    toast({ title: 'Deleted', description: 'Record has been removed.' });
  };

  const handleDownloadSlip = (item: PaddyLiftedType) => {
    const fileName = `slip-${item.farmerName.toLowerCase().replace(/\s+/g, '-')}-${item.id.slice(-4)}`;
    downloadPdf(`slip-${item.id}`, fileName);
  };

  const cancelForm = () => {
    setShowPhysicalForm(false);
    setShowMonetaryForm(false);
    physicalForm.reset({
        mandiName: '', farmerName: '', vehicleType: 'farmer', destination: 'Mill',
        totalPaddyReceived: 0, mandiWeight: 0, date: new Date(), calculationMethod: 'uniform',
        isPrivateOverflow: false, privateOverflowRate: 0, mandiTokenLimit: 0,
        tokenNumber: '', description: '', vehicleNumber: '', driverName: '',
        ownerName: '', tripCharge: 0, source: '', numberOfLabours: 0,
        labourerIds: [], labourCharge: 0, labourWageType: 'total_amount', individualBagWeights: [],
    });
    monetaryForm.reset();
  };

  const handleCalculatorConfirm = (vals: { grossQuintals: number; netQuintals: number; netWeightKg: number; bagWeights: number[]; method: any }) => {
    physicalForm.setValue('totalPaddyReceived', vals.grossQuintals);
    physicalForm.setValue('mandiWeight', vals.netQuintals);
    physicalForm.setValue('individualBagWeights', vals.bagWeights);
    physicalForm.setValue('calculationMethod', vals.method);
    setCalculatorOpen(false);
  };

  const handleInputFocus = (e: React.FocusEvent<HTMLInputElement>) => {
    e.target.select();
  };

  return (
    <>
      <Card className="border-none shadow-none bg-transparent">
        <CardHeader className="px-0 pt-0">
          <div className="flex justify-between items-start mb-6">
            <div>
              <CardTitle className="text-2xl font-bold font-headline text-primary">Procurement Records</CardTitle>
              <CardDescription>Fresh entries enabled. Deduction applies before standardization.</CardDescription>
            </div>
             <Button variant="outline" size="sm" onClick={() => downloadPdf('paddy-lifted-table', 'paddy-lifted-summary')} className="rounded-xl border-primary/20">
                <Download className="mr-2 h-4 w-4" /> Export Summary PDF
            </Button>
          </div>
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div className="flex items-center gap-4">
                <Label className="text-sm font-semibold uppercase tracking-tighter opacity-60">Filter:</Label>
                <Select value={selectedMandi} onValueChange={setSelectedMandi}>
                  <SelectTrigger className="w-[240px] rounded-xl border-primary/10 shadow-sm"><SelectValue placeholder="All Mandis" /></SelectTrigger>
                  <SelectContent><SelectItem value="All">All Mandis</SelectItem>{uniqueMandis.map((mandi) => ( <SelectItem key={mandi} value={mandi}>{mandi}</SelectItem> ))}</SelectContent>
                </Select>
              </div>
              <div className="flex gap-3">
                <Button onClick={() => { cancelForm(); setShowPhysicalForm(true); }} className="rounded-xl shadow-lg shadow-primary/10" disabled={uniqueMandis.length === 0}>
                  <PlusCircle className="mr-2 h-4 w-4" /> Farmer Arrival
                </Button>
                {isAdmin && (
                  <Button onClick={() => { cancelForm(); setShowMonetaryForm(true); }} variant="secondary" className="rounded-xl shadow-md" disabled={uniqueMandis.length === 0}>
                    <DollarSign className="mr-2 h-4 w-4" /> Monetary
                  </Button>
                )}
              </div>
          </div>
        </CardHeader>
        <CardContent className="px-0 space-y-8">
          {(showPhysicalForm || showMonetaryForm) && (
            <Card className="bg-white border-primary/10 shadow-2xl rounded-3xl overflow-hidden animate-in zoom-in-95 duration-300">
              <CardHeader className="bg-primary/5 border-b border-primary/10 pb-4 flex flex-row items-center justify-between">
                  <div>
                    <CardTitle className="text-lg font-bold text-primary">New Entry</CardTitle>
                    <CardDescription>{showPhysicalForm ? 'Physical Arrival Form' : 'Monetary Record Form'}</CardDescription>
                  </div>
                  <Button variant="ghost" size="icon" onClick={cancelForm} className="rounded-full"><X className="h-5 w-5" /></Button>
              </CardHeader>
              <CardContent className="pt-6">
                {showPhysicalForm ? (
                  <Form {...physicalForm}>
                    <form onSubmit={physicalForm.handleSubmit(onPhysicalSubmit)} className="space-y-8">
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 items-start">
                        <FormField control={physicalForm.control} name="mandiName" render={({ field }) => (
                            <FormItem>
                              <FormLabel>Mandi Source</FormLabel>
                              <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl><SelectTrigger className="rounded-xl h-12"><SelectValue placeholder="Select mandi..." /></SelectTrigger></FormControl>
                                <SelectContent>{uniqueMandis.map((mandi) => ( <SelectItem key={mandi} value={mandi}>{mandi}</SelectItem> ))}</SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                        )} />
                        <FormField control={physicalForm.control} name="farmerName" render={({ field }) => (
                          <FormItem><FormLabel>Farmer Name</FormLabel><FormControl><Input placeholder="Full Name" {...field} className="rounded-xl h-12" /></FormControl><FormMessage /></FormItem>
                        )} />
                        <FormField control={physicalForm.control} name="date" render={({ field }) => (
                          <FormItem className="flex flex-col">
                            <FormLabel>Date & Time</FormLabel>
                            <Popover open={isPhysicalCalendarOpen} onOpenChange={setIsPhysicalCalendarOpen}>
                              <PopoverTrigger asChild>
                                <FormControl><Button variant={"outline"} className={cn("h-12 rounded-xl pl-3 text-left font-normal border-input", !field.value && "text-muted-foreground")}>{field.value ? format(field.value, "PPP") : <span>Pick date</span>}<CalendarIcon className="ml-auto h-4 w-4 opacity-50" /></Button></FormControl>
                              </PopoverTrigger>
                              <PopoverContent className="w-auto p-0 rounded-2xl overflow-hidden" align="start"><Calendar mode="single" selected={field.value} onSelect={(date) => { field.onChange(date); setIsPhysicalCalendarOpen(false); }} initialFocus /></PopoverContent>
                            </Popover>
                            <FormMessage />
                          </FormItem>
                        )} />
                         <FormField control={physicalForm.control} name="totalPaddyReceived" render={({ field }) => (
                          <FormItem>
                            <FormLabel>Total Weight (Actual Qtl)</FormLabel>
                              <div className="flex items-center gap-2">
                                <FormControl><Input type="number" step="0.01" {...field} onFocus={handleInputFocus} className="rounded-xl h-12" /></FormControl>
                                <Button type="button" variant="outline" size="icon" onClick={() => setCalculatorOpen(true)} className="h-12 w-12 rounded-xl border-primary/20"><Calculator className="h-5 w-5 text-primary" /></Button>
                              </div>
                            <FormMessage />
                          </FormItem>
                        )} />
                        <FormField control={physicalForm.control} name="mandiWeight" render={({ field }) => (
                          <FormItem>
                            <FormLabel>Considered Mandi Qtl (FAQ)</FormLabel>
                            <FormControl><Input type="number" step="0.01" {...field} onFocus={handleInputFocus} className="rounded-xl h-12 bg-primary/5 border-primary/20 font-bold text-primary" /></FormControl>
                            <FormMessage />
                          </FormItem>
                        )} />
                      </div>

                      <div className="bg-muted/30 p-6 rounded-3xl border border-primary/5 space-y-6">
                          <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2 text-primary font-bold"><Info className="h-5 w-5" /> Token & Overflow Management</div>
                              <div className="flex items-center gap-3">
                                  <span className="text-sm font-medium opacity-70">Excess to Private?</span>
                                  <FormField control={physicalForm.control} name="isPrivateOverflow" render={({ field }) => (
                                      <Switch checked={field.value} onCheckedChange={field.onChange} />
                                  )} />
                              </div>
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 items-end">
                              <FormField control={physicalForm.control} name="tokenNumber" render={({ field }) => (
                                  <FormItem><FormLabel>Token Number</FormLabel><FormControl><Input {...field} className="rounded-xl" /></FormControl></FormItem>
                              )} />
                              <FormField control={physicalForm.control} name="mandiTokenLimit" render={({ field }) => (
                                  <FormItem><FormLabel>Mandi Token Limit (Qtl)</FormLabel><FormControl><Input type="number" step="0.01" {...field} onFocus={handleInputFocus} className="rounded-xl" /></FormControl></FormItem>
                              )} />
                              {isOverflowEnabled && (
                                  <>
                                      <FormItem><FormLabel>Excess (Qtl)</FormLabel><div className="h-10 flex items-center px-3 bg-destructive/10 text-destructive rounded-xl font-bold text-sm">{overflowQuantity.toFixed(2)} Qtl</div></FormItem>
                                      <FormField control={physicalForm.control} name="privateOverflowRate" render={({ field }) => (
                                          <FormItem><FormLabel>Private Rate (₹/Qtl)</FormLabel><FormControl><Input type="number" step="0.01" {...field} onFocus={handleInputFocus} className="rounded-xl" /></FormControl></FormItem>
                                      )} />
                                  </>
                              )}
                          </div>
                      </div>

                      <Separator className="opacity-50" />
                      
                      <div className="space-y-6">
                          <h3 className="text-md font-bold flex items-center gap-2 text-primary opacity-80"><Car className="h-5 w-5" /> Logistics</h3>
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 items-start">
                             <FormField control={physicalForm.control} name="vehicleType" render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>Ownership</FormLabel>
                                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                                      <FormControl><SelectTrigger className="rounded-xl"><SelectValue/></SelectTrigger></FormControl>
                                      <SelectContent><SelectItem value="farmer">Farmer's Vehicle</SelectItem><SelectItem value="own">Own Vehicle</SelectItem><SelectItem value="hired">Hired Vehicle</SelectItem></SelectContent>
                                    </Select>
                                    <FormMessage />
                                  </FormItem>
                             )} />
                             {vehicleType === 'hired' && (
                              <>
                                  <FormField control={physicalForm.control} name="vehicleNumber" render={({ field }) => (
                                      <FormItem><FormLabel>Vehicle No.</FormLabel><FormControl><Input {...field} className="rounded-xl" /></FormControl></FormItem>
                                  )} />
                                  <FormField control={physicalForm.control} name="tripCharge" render={({ field }) => (
                                      <FormItem><FormLabel>Rent (₹)</FormLabel><FormControl><Input type="number" step="10" {...field} onFocus={handleInputFocus} className="rounded-xl" /></FormControl></FormItem>
                                  )} />
                              </>
                             )}
                          </div>
                      </div>

                      <div className="space-y-6">
                          <h3 className="text-md font-bold flex items-center gap-2 text-primary opacity-80"><Users className="h-5 w-5" /> Labour Selection</h3>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                              <FormField control={physicalForm.control} name="numberOfLabours" render={({ field }) => (
                                  <FormItem><FormLabel>Number of Workers</FormLabel><FormControl><Input type="number" {...field} onFocus={handleInputFocus} className="rounded-xl" /></FormControl></FormItem>
                              )} />
                              <FormField control={physicalForm.control} name="labourCharge" render={({ field }) => (
                                  <FormItem><FormLabel>Total Loading Wage (₹)</FormLabel><FormControl><Input type="number" step="10" {...field} onFocus={handleInputFocus} className="rounded-xl" /></FormControl></FormItem>
                              )} />
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                              {fields.map((field, index) => (
                                  <FormField key={field.id} control={physicalForm.control} name={`labourerIds.${index}.value`} render={({ field }) => (
                                      <FormItem>
                                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                                              <FormControl><SelectTrigger className="rounded-xl"><SelectValue placeholder="Select worker..." /></SelectTrigger></FormControl>
                                              <SelectContent>{(labourers || []).map(l => <SelectItem key={l.id} value={l.id}>{l.name}</SelectItem>)}</SelectContent>
                                          </Select>
                                      </FormItem>
                                  )} />
                              ))}
                          </div>
                      </div>

                      <Button type="submit" className="w-full bg-primary hover:bg-primary/90 h-14 rounded-2xl font-bold text-lg shadow-xl shadow-primary/20">
                        Confirm Procurement Arrival
                      </Button>
                    </form>
                  </Form>
                ) : (
                  <Form {...monetaryForm}>
                    <form onSubmit={monetaryForm.handleSubmit(onMonetarySubmit)} className="space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 items-end">
                        <FormField control={monetaryForm.control} name="mandiName" render={({ field }) => (
                          <FormItem><FormLabel>Mandi</FormLabel><Select onValueChange={field.onChange} defaultValue={field.value}><FormControl><SelectTrigger className="rounded-xl h-12"><SelectValue placeholder="Select mandi..." /></SelectTrigger></FormControl><SelectContent>{uniqueMandis.map(m => <SelectItem key={m} value={m}>{m}</SelectItem>)}</SelectContent></Select></FormItem>
                        )} />
                        <FormField control={monetaryForm.control} name="moneyReceived" render={({ field }) => (
                          <FormItem><FormLabel>Cash Received (₹)</FormLabel><FormControl><Input type="number" step="0.01" {...field} onFocus={handleInputFocus} className="rounded-xl h-12" /></FormControl></FormItem>
                        )} />
                        <FormField control={monetaryForm.control} name="ratePerQuintal" render={({ field }) => (
                          <FormItem><FormLabel>Rate Applied (₹/Qtl)</FormLabel><FormControl><Input type="number" step="0.01" {...field} onFocus={handleInputFocus} className="rounded-xl h-12" /></FormControl></FormItem>
                        )} />
                        <Button type="submit" className="bg-primary hover:bg-primary/90 h-12 rounded-xl font-bold">Save Cash Entry</Button>
                      </div>
                    </form>
                  </Form>
                )}
              </CardContent>
            </Card>
          )}

          <div id="paddy-lifted-table" className="bg-white border border-primary/5 rounded-3xl overflow-hidden shadow-sm">
              <div className="p-6 border-b border-primary/5 bg-primary/5">
                  <h3 className="text-lg font-bold text-primary uppercase tracking-widest">Arrival History & Detailed Slips</h3>
              </div>
              <Table>
                  <TableHeader className="bg-muted/30">
                      <TableRow className="border-none">
                          <TableHead className="font-bold py-4">RECORD ID</TableHead>
                          <TableHead className="font-bold py-4">Date</TableHead>
                          <TableHead className="font-bold py-4">Farmer / Source</TableHead>
                          <TableHead className="text-right font-bold py-4">Mandi FAQ (Qtl)</TableHead>
                          <TableHead className="text-right font-bold py-4">Actions</TableHead>
                      </TableRow>
                  </TableHeader>
                  <TableBody>
                      {physicalEntries.length === 0 ? (
                          <TableRow><TableCell colSpan={5} className="text-center h-32 opacity-50 italic">No procurement records found.</TableCell></TableRow>
                      ) : (
                        physicalEntries.map((item) => (
                          <TableRow key={item.id} className="hover:bg-primary/5 transition-colors">
                              <TableCell className="font-mono text-[10px] text-muted-foreground">#{item.id.slice(-6)}</TableCell>
                              <TableCell className="text-xs">{isValid(new Date(item.date)) ? format(new Date(item.date), 'dd MMM yy') : 'N/A'}</TableCell>
                              <TableCell>
                                  <div className="flex flex-col">
                                      <span className="font-bold text-primary">{item.farmerName}</span>
                                      <span className="text-[10px] uppercase font-medium opacity-60">{item.mandiName} {item.tokenNumber && `| TOKEN: ${item.tokenNumber}`}</span>
                                  </div>
                              </TableCell>
                              <TableCell className="text-right font-black text-primary">{Number(item.mandiWeight).toLocaleString('en-IN', { maximumFractionDigits: 2 })}</TableCell>
                              <TableCell className="text-right">
                                <div className="flex gap-2 justify-end">
                                    <Button variant="outline" size="sm" onClick={() => handleDownloadSlip(item)} className="rounded-lg h-8 px-2 border-primary/20 hover:bg-primary/5 hover:text-primary">
                                        <FileText className="h-3.5 w-3.5 mr-1" /> Slip
                                    </Button>
                                    <Button variant="ghost" size="icon" onClick={() => handleDeleteClick(item.id)} className="h-8 w-8 rounded-lg hover:text-destructive hover:bg-destructive/10">
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                </div>
                                <div className="absolute -left-[9999px] top-auto pointer-events-none" aria-hidden="true">
                                    <div id={`slip-${item.id}`}>
                                        <PaddyLiftingSlip entry={item} millName={selectedMill?.name || 'Mandi Monitor'} millLocation={selectedMill?.location || 'Facility'} />
                                    </div>
                                </div>
                              </TableCell>
                          </TableRow>
                        ))
                      )}
                  </TableBody>
              </Table>
          </div>
        </CardContent>
      </Card>
      
      <Dialog open={isCalculatorOpen} onOpenChange={setCalculatorOpen}>
        <BagWeightCalculator 
          onConfirm={handleCalculatorConfirm} 
          onCancel={() => setCalculatorOpen(false)} 
          initialBagWeights={watchedBagWeights}
        />
      </Dialog>
    </>
  );
}
