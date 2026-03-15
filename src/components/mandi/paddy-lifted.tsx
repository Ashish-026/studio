
'use client';

import React, { useState, useMemo, useEffect, forwardRef, Fragment } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useMandiData } from '@/context/mandi-context';
import { useVehicleData } from '@/context/vehicle-context';
import { useLabourData } from '@/context/labour-context';
import { useStockData } from '@/context/stock-context';
import { useMill } from '@/hooks/use-mill';
import { 
  PlusCircle, 
  Trash2, 
  Car, 
  Users, 
  Calculator, 
  Calendar as CalendarIcon, 
  X, 
  Download as DownloadIcon,
  ChevronRight,
  ChevronDown,
  User as UserIcon,
  Edit,
} from 'lucide-react';
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
import { format, isValid } from 'date-fns';
import { BagWeightCalculator } from './bag-weight-calculator';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Dialog } from '@/components/ui/dialog';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';

const labourDetailsSchema = z.object({
  numberOfLabours: z.coerce.number().min(0).default(0),
  labourerIds: z.array(z.object({ value: z.string() })).default([]),
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
  description: z.string().optional(),
  vehicleType: z.enum(['farmer', 'own', 'hired'], { required_error: 'Vehicle type is required' }),
  vehicleNumber: z.string().optional(),
  driverName: z.string().optional(),
  ownerName: z.string().optional(),
  tripCharge: z.coerce.number().optional(),
  source: z.string().optional(),
  destination: z.string().optional(),
  individualBagWeights: z.array(z.number()).optional(),
  privateExcessQty: z.coerce.number().min(0).default(0),
  privateExcessRate: z.coerce.number().min(0).default(0),
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

const FarmerMandiStatement = forwardRef<HTMLDivElement, { farmer: any, millName: string, millLocation: string }>(({ farmer, millName, millLocation }, ref) => {
  return (
    <div ref={ref} className="p-10 bg-white text-black w-[1000px] mx-auto min-h-screen border shadow-sm">
      <div className="text-center mb-10 border-b-4 border-primary pb-6">
        <h1 className="text-4xl font-black uppercase text-primary tracking-tighter mb-1">{millName}</h1>
        <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">{millLocation}</p>
        <div className="mt-6 bg-primary text-white py-2 px-8 inline-block rounded-full text-xs font-black uppercase tracking-widest">
          Mandi Procurement Account Statement
        </div>
      </div>

      <div className="flex justify-between items-end mb-8">
        <div className="space-y-1">
          <p className="text-[10px] font-black uppercase text-primary/40 tracking-widest">Farmer / Supplier Name</p>
          <p className="text-3xl font-black text-primary">{farmer.name}</p>
        </div>
        <div className="text-right space-y-1">
          <p className="text-[10px] font-black uppercase text-primary/40 tracking-widest">Account Summary</p>
          <p className="text-2xl font-black text-primary">{farmer.totalQty.toFixed(2)} <span className="text-sm opacity-60">QTL</span></p>
          <p className="text-[10px] font-bold opacity-60 uppercase">Total Procurement Records: {farmer.items.length}</p>
        </div>
      </div>

      <div className="rounded-3xl border border-black/10 overflow-hidden mb-12">
        <Table>
          <TableHeader className="bg-primary/5">
            <TableRow className="border-black/10">
              <TableHead className="text-black font-black uppercase text-[10px] py-4 pl-6">Procurement Details</TableHead>
              <TableHead className="text-black font-black uppercase text-[10px] py-4 text-right">Actual Qty (Qtl)</TableHead>
              <TableHead className="text-black font-black uppercase text-[10px] py-4 text-right pr-6">Official weight (Qtl)</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {farmer.items.sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime()).map((item: any) => (
              <Fragment key={item.id}>
                <TableRow className="border-black/5 bg-white font-medium">
                  <TableCell className="py-4 pl-6">
                    <div className="space-y-1">
                      <p className="text-xs font-bold">{format(new Date(item.date), 'dd MMMM yyyy')}</p>
                      <p className="text-[10px] opacity-60">Mandi: {item.mandiName} | Token: {item.tokenNumber || 'N/A'}</p>
                    </div>
                  </TableCell>
                  <TableCell className="text-xs text-right opacity-60">{parseFloat(String(item.totalPaddyReceived)).toFixed(2)}</TableCell>
                  <TableCell className="text-xs text-right font-black text-primary pr-6">{parseFloat(String(item.mandiWeight)).toFixed(2)}</TableCell>
                </TableRow>
                {item.individualBagWeights && item.individualBagWeights.length > 0 && (
                  <TableRow className="border-none bg-muted/10">
                    <TableCell colSpan={3} className="py-3 px-6">
                      <div className="space-y-2">
                        <p className="text-[8px] font-black uppercase opacity-40 tracking-widest">Individual Bag Weights (KG)</p>
                        <div className="grid grid-cols-12 gap-1">
                          {item.individualBagWeights.map((w: number, i: number) => (
                            <div key={i} className="border border-black/10 p-1 text-center bg-white rounded">
                              <p className="text-[7px] opacity-30 leading-none mb-0.5">{i + 1}</p>
                              <p className="text-[9px] font-bold">{w.toFixed(1)}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    </TableCell>
                  </TableRow>
                )}
              </Fragment>
            ))}
          </TableBody>
          <tfoot className="bg-primary/5 border-t-2 border-primary/20">
            <TableRow>
              <TableCell className="pl-6 py-6 font-black text-primary uppercase tracking-widest">Consolidated Official Total</TableCell>
              <TableCell colSpan={2} className="text-right pr-6 py-6 font-black text-3xl text-primary">{farmer.totalQty.toFixed(2)} <span className="text-xs opacity-60">Qtl</span></TableCell>
            </TableRow>
          </tfoot>
        </Table>
      </div>

      <div className="mt-32 flex justify-between border-t border-black/10 pt-8">
        <div className="text-center">
          <div className="w-48 border-b-2 border-black mb-2"></div>
          <p className="text-[10px] font-black uppercase text-primary/60">Farmer Signature</p>
        </div>
        <div className="text-center">
          <div className="w-48 border-b-2 border-black mb-2"></div>
          <p className="text-[10px] font-black uppercase text-primary/60">For {millName}</p>
        </div>
      </div>
      
      <div className="mt-auto pt-20 text-[8px] text-center font-bold opacity-30 uppercase tracking-[0.3em]">
        Computer Generated Statement • Managed via Mandi Monitor Engine
      </div>
    </div>
  );
});
FarmerMandiStatement.displayName = 'FarmerMandiStatement';

export function PaddyLifted() {
  const { paddyLiftedItems, addPaddyLifted, updatePaddyLifted, deletePaddyLifted, targetAllocations } = useMandiData();
  const { addVehicle, addTrip } = useVehicleData();
  const { labourers, addGroupWorkEntry } = useLabourData();
  const { addPurchase } = useStockData();
  const { selectedMill } = useMill();
  const { toast } = useToast();
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';
  
  const [showPhysicalForm, setShowPhysicalForm] = useState(false);
  const [showMonetaryForm, setShowMonetaryForm] = useState(false);
  const [isCalculatorOpen, setCalculatorOpen] = useState(false);
  const [selectedMandi, setSelectedMandi] = useState('All');
  const [isPhysicalCalendarOpen, setIsPhysicalCalendarOpen] = useState(false);
  const [openFarmerLedgers, setOpenFarmerLedgers] = useState<Record<string, boolean>>({});
  const [editingItem, setEditingItem] = useState<PaddyLiftedType | null>(null);

  const uniqueMandis = useMemo(() => {
    const mandiNames = (targetAllocations || []).map((allocation) => allocation.mandiName);
    return [...new Set(mandiNames.filter(Boolean))];
  }, [targetAllocations]);

  const farmerAggregates = useMemo(() => {
    const map: Record<string, { id: string; name: string; items: PaddyLiftedType[]; totalQty: number }> = {};
    (paddyLiftedItems || []).forEach(item => {
      const key = item.farmerName.trim();
      if (!map[key]) {
        map[key] = { id: key.toLowerCase().replace(/\s+/g, '-'), name: key, items: [], totalQty: 0 };
      }
      map[key].items.push(item);
      map[key].totalQty += (Number(item.mandiWeight) || 0);
    });
    return Object.values(map).sort((a,b) => a.name.localeCompare(b.name));
  }, [paddyLiftedItems]);

  const physicalForm = useForm<z.infer<typeof physicalFormSchema>>({
    resolver: zodResolver(physicalFormSchema),
    defaultValues: {
        mandiName: '', farmerName: '', vehicleType: 'farmer', destination: 'Mill',
        totalPaddyReceived: 0, mandiWeight: 0, date: new Date(), calculationMethod: 'uniform',
        tokenNumber: '', description: '', vehicleNumber: '', driverName: '',
        ownerName: '', tripCharge: 0, source: '', numberOfLabours: 0,
        labourerIds: [], labourCharge: 0, labourWageType: 'total_amount', individualBagWeights: [],
        privateExcessQty: 0, privateExcessRate: 0,
    },
  });

  const { fields, replace } = useFieldArray({ control: physicalForm.control, name: "labourerIds" });

  const monetaryForm = useForm<z.infer<typeof monetaryFormSchema>>({
    resolver: zodResolver(monetaryFormSchema),
    defaultValues: { mandiName: '', moneyReceived: 0, ratePerQuintal: 0, date: new Date() },
  });
  
  const numberOfLabours = physicalForm.watch('numberOfLabours');
  const vehicleType = physicalForm.watch('vehicleType');
  const watchedBagWeights = physicalForm.watch('individualBagWeights');

  useEffect(() => {
    const targetCount = Math.max(0, parseInt(String(numberOfLabours || 0)));
    const currentValues = physicalForm.getValues('labourerIds') || [];
    if (fields.length !== targetCount) {
      const nextFields = Array.from({ length: targetCount }, (_, i) => currentValues[i] || { value: '' });
      replace(nextFields);
    }
  }, [numberOfLabours, replace, physicalForm, fields.length]);

  const cancelForm = () => {
    setShowPhysicalForm(false);
    setShowMonetaryForm(false);
    setEditingItem(null);
    physicalForm.reset({
        mandiName: '', farmerName: '', vehicleType: 'farmer', destination: 'Mill',
        totalPaddyReceived: 0, mandiWeight: 0, date: new Date(), calculationMethod: 'uniform',
        tokenNumber: '', description: '', vehicleNumber: '', driverName: '',
        ownerName: '', tripCharge: 0, source: '', numberOfLabours: 0,
        labourerIds: [], labourCharge: 0, labourWageType: 'total_amount', individualBagWeights: [],
        privateExcessQty: 0, privateExcessRate: 0,
    });
    monetaryForm.reset({ mandiName: '', moneyReceived: 0, ratePerQuintal: 0, date: new Date() });
  };

  function onPhysicalSubmit(values: z.infer<typeof physicalFormSchema>) {
    const labourerIds = values.labourerIds.map(l => l.value).filter(Boolean);
    const submissionValues = { ...values, labourerIds, entryType: 'physical' as const };

    let mandiEntryId = editingItem?.id;

    if (editingItem) {
        updatePaddyLifted(editingItem.id, submissionValues);
        toast({ title: 'Record Updated', description: 'Changes saved.' });
    } else {
        const newEntry = addPaddyLifted(submissionValues);
        mandiEntryId = newEntry.id;
        toast({ title: 'Success!', description: 'Arrival recorded.' });
    }

    if (submissionValues.privateExcessQty && submissionValues.privateExcessQty > 0) {
        addPurchase({
            id: `excess-${mandiEntryId}`,
            farmerName: submissionValues.farmerName,
            itemType: 'paddy',
            quantity: submissionValues.privateExcessQty,
            rate: submissionValues.privateExcessRate || 0,
            date: submissionValues.date,
            description: `Mandi Excess from ${submissionValues.mandiName}`,
            isMandiExcess: true,
            mandiTokenNo: submissionValues.tokenNumber,
            vehicleType: 'farmer',
            individualBagWeights: submissionValues.individualBagWeights,
        });
    }

    if (submissionValues.vehicleType === 'hired' && submissionValues.vehicleNumber && submissionValues.tripCharge) {
      const vId = addVehicle({ vehicleNumber: submissionValues.vehicleNumber, driverName: submissionValues.driverName || '', ownerName: submissionValues.ownerName || '', rentType: 'per_trip', rentAmount: 0 });
      if (vId) addTrip(vId, { source: submissionValues.source || submissionValues.mandiName, destination: submissionValues.destination || 'Mill', quantity: submissionValues.totalPaddyReceived, tripCharge: submissionValues.tripCharge });
    }

    if (labourerIds.length > 0 && submissionValues.labourCharge > 0) {
      addGroupWorkEntry(labourerIds, submissionValues.labourCharge, `Paddy lifting: ${submissionValues.mandiName}`, submissionValues.totalPaddyReceived);
    }
    cancelForm();
  }

  function onMonetarySubmit(values: z.infer<typeof monetaryFormSchema>) {
    const equivalentQuintal = values.moneyReceived / values.ratePerQuintal;
    const submissionValues = {
      mandiName: values.mandiName, farmerName: `Monetary Entry`, moneyReceived: values.moneyReceived, ratePerQuintal: values.ratePerQuintal,
      totalPaddyReceived: equivalentQuintal, mandiWeight: equivalentQuintal, date: values.date, entryType: 'monetary' as const,
    };
    if (editingItem) {
        updatePaddyLifted(editingItem.id, submissionValues);
    } else {
        addPaddyLifted(submissionValues);
    }
    cancelForm();
  }

  const handleEditClick = (item: PaddyLiftedType) => {
    setEditingItem(item);
    if (item.entryType === 'monetary') {
        setShowMonetaryForm(true);
        monetaryForm.reset({ mandiName: item.mandiName, moneyReceived: item.moneyReceived || 0, ratePerQuintal: item.ratePerQuintal || 0, date: new Date(item.date) });
    } else {
        setShowPhysicalForm(true);
        physicalForm.reset({ ...item, date: new Date(item.date), labourerIds: (item.labourerIds || []).map(id => ({ value: id })), numberOfLabours: item.labourerIds?.length || 0 });
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleCalculatorConfirm = (v: any) => {
    physicalForm.setValue('totalPaddyReceived', v.grossQuintals);
    physicalForm.setValue('mandiWeight', v.netQuintals);
    physicalForm.setValue('individualBagWeights', v.bagWeights);
    physicalForm.setValue('calculationMethod', v.method);
    setCalculatorOpen(false);
  };

  const handleDownloadStatement = (e: React.MouseEvent, farmer: any) => {
    e.stopPropagation();
    const fileName = `Mandi_Statement_${farmer.name.replace(/\s+/g, '_')}_${format(new Date(), 'yyyyMMdd')}`;
    downloadPdf(`printable-mandi-statement-${farmer.id}`, fileName);
  };

  return (
    <div className="space-y-8">
      <Card className="border-none shadow-none bg-transparent">
        <CardHeader className="px-0 pt-0">
          <div className="flex justify-between items-start mb-6">
            <div>
              <CardTitle className="text-2xl font-bold font-headline text-primary">Procurement Records</CardTitle>
              <CardDescription>Volume tracking for physical arrivals and monetary records.</CardDescription>
            </div>
          </div>
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div className="flex items-center gap-4">
                <Select value={selectedMandi} onValueChange={setSelectedMandi}>
                  <SelectTrigger className="w-[240px] rounded-xl">
                    <SelectValue placeholder="All Mandis" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="All">All Mandis</SelectItem>
                    {uniqueMandis.map(m => <SelectItem key={m} value={m}>{m}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex gap-3">
                <Button onClick={() => { cancelForm(); setShowPhysicalForm(true); }} className="rounded-xl shadow-lg" disabled={uniqueMandis.length === 0}><PlusCircle className="mr-2 h-4 w-4" /> Farmer Arrival</Button>
                {isAdmin && <Button onClick={() => { cancelForm(); setShowMonetaryForm(true); }} variant="secondary" className="rounded-xl shadow-md" disabled={uniqueMandis.length === 0}><CalendarIcon className="mr-2 h-4 w-4" /> Monetary Record</Button>}
              </div>
          </div>
        </CardHeader>
        <CardContent className="px-0 space-y-8">
          {(showPhysicalForm || showMonetaryForm) && (
            <Card className="bg-white border-primary/10 shadow-2xl rounded-3xl overflow-hidden animate-in zoom-in-95 duration-300">
              <CardHeader className="bg-primary/5 border-b border-primary/10 flex flex-row items-center justify-between">
                  <div><CardTitle className="text-lg font-bold text-primary">{editingItem ? 'Edit Record' : 'New Entry'}</CardTitle></div>
                  <Button variant="ghost" size="icon" onClick={cancelForm} className="rounded-full"><X className="h-5 w-5" /></Button>
              </CardHeader>
              <CardContent className="pt-6">
                {showPhysicalForm ? (
                  <Form {...physicalForm}>
                    <form onSubmit={physicalForm.handleSubmit(onPhysicalSubmit)} className="space-y-8">
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 items-start">
                        <FormField control={physicalForm.control} name="mandiName" render={({ field }) => (
                            <FormItem><FormLabel>Mandi Source</FormLabel><Select onValueChange={field.onChange} value={field.value}><FormControl><SelectTrigger className="rounded-xl h-12"><SelectValue placeholder="Select mandi..." /></SelectTrigger></FormControl><SelectContent>{uniqueMandis.map(m => <SelectItem key={m} value={m}>{m}</SelectItem>)}</SelectContent></Select></FormItem>
                        )} />
                        <FormField control={physicalForm.control} name="farmerName" render={({ field }) => (
                          <FormItem><FormLabel>Farmer Name</FormLabel><FormControl><Input placeholder="Full Name" {...field} className="rounded-xl h-12" /></FormControl></FormItem>
                        )} />
                        <FormField control={physicalForm.control} name="date" render={({ field }) => (
                          <FormItem className="flex flex-col"><FormLabel>Date</FormLabel><Popover open={isPhysicalCalendarOpen} onOpenChange={setIsPhysicalCalendarOpen}><PopoverTrigger asChild><FormControl><Button variant="outline" className="h-12 rounded-xl text-left font-normal">{field.value ? format(field.value, "PPP") : <span>Pick date</span>}<CalendarIcon className="ml-auto h-4 w-4 opacity-50" /></Button></FormControl></PopoverTrigger><PopoverContent className="w-auto p-0" align="start"><Calendar mode="single" selected={field.value} onSelect={(d) => { if(d) field.onChange(d); setIsPhysicalCalendarOpen(false); }} initialFocus /></PopoverContent></Popover></FormItem>
                        )} />
                         <FormField control={physicalForm.control} name="totalPaddyReceived" render={({ field }) => (
                          <FormItem><FormLabel>Actual Qty (Qtl)</FormLabel><div className="flex items-center gap-2"><FormControl><Input type="number" step="0.01" {...field} className="rounded-xl h-12" /></FormControl><Button type="button" variant="outline" size="icon" onClick={() => setCalculatorOpen(true)} className="h-12 w-12 rounded-xl"><Calculator className="h-5 w-5" /></Button></div></FormItem>
                        )} />
                        <FormField control={physicalForm.control} name="mandiWeight" render={({ field }) => (
                          <FormItem><FormLabel>Standard Mandi Weight (Qtl)</FormLabel><FormControl><Input type="number" step="0.01" {...field} className="rounded-xl h-12 bg-primary/5 font-bold" /></FormControl></FormItem>
                        )} />
                        <FormField control={physicalForm.control} name="tokenNumber" render={({ field }) => (<FormItem><FormLabel>Token Number</FormLabel><FormControl><Input {...field} className="rounded-xl h-12" /></FormControl></FormItem>)} />
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 items-start">
                          <FormField control={physicalForm.control} name="privateExcessQty" render={({ field }) => (<FormItem><FormLabel>Excess Qtl</FormLabel><FormControl><Input type="number" step="0.01" {...field} className="rounded-xl border-accent/30" /></FormControl></FormItem>)} />
                          <FormField control={physicalForm.control} name="privateExcessRate" render={({ field }) => (<FormItem><FormLabel>Excess Rate (₹)</FormLabel><FormControl><Input type="number" step="0.01" {...field} className="rounded-xl border-accent/30" /></FormControl></FormItem>)} />
                      </div>
                      <div className="space-y-6">
                          <h3 className="text-md font-bold flex items-center gap-2 opacity-80"><Car className="h-5 w-5" /> Logistics</h3>
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 items-start">
                             <FormField control={physicalForm.control} name="vehicleType" render={({ field }) => (<FormItem><FormLabel>Ownership</FormLabel><Select onValueChange={field.onChange} value={field.value}><FormControl><SelectTrigger className="rounded-xl"><SelectValue placeholder="Select type..." /></SelectTrigger></FormControl><SelectContent><SelectItem value="farmer">Farmer's Vehicle</SelectItem><SelectItem value="own">Own Vehicle</SelectItem><SelectItem value="hired">Hired Vehicle</SelectItem></SelectContent></Select></FormItem>)} />
                             {vehicleType === 'hired' && (
                              <Fragment>
                                  <FormField control={physicalForm.control} name="vehicleNumber" render={({ field }) => (<FormItem><FormLabel>Vehicle No.</FormLabel><FormControl><Input {...field} className="rounded-xl" /></FormControl></FormItem>)} />
                                  <FormField control={physicalForm.control} name="driverName" render={({ field }) => (<FormItem><FormLabel>Driver Name</FormLabel><FormControl><Input {...field} className="rounded-xl" /></FormControl></FormItem>)} />
                                  <FormField control={physicalForm.control} name="ownerName" render={({ field }) => (<FormItem><FormLabel>Owner Name</FormLabel><FormControl><Input {...field} className="rounded-xl" /></FormControl></FormItem>)} />
                                  <FormField control={physicalForm.control} name="tripCharge" render={({ field }) => (<FormItem><FormLabel>Rent (₹)</FormLabel><FormControl><Input type="number" step="10" className="rounded-xl" {...field} /></FormControl></FormItem>)} />
                              </Fragment>
                             )}
                          </div>
                      </div>
                      <Button type="submit" className="w-full bg-primary py-8 rounded-2xl font-bold text-lg">{editingItem ? 'Save Changes' : 'Confirm Arrival'}</Button>
                    </form>
                  </Form>
                ) : (
                  <Form {...monetaryForm}>
                    <form onSubmit={monetaryForm.handleSubmit(onMonetarySubmit)} className="space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 items-end">
                        <FormField control={monetaryForm.control} name="mandiName" render={({ field }) => (
                          <FormItem><FormLabel>Mandi</FormLabel><Select onValueChange={field.onChange} value={field.value}><FormControl><SelectTrigger className="rounded-xl"><SelectValue placeholder="Select mandi..." /></SelectTrigger></FormControl><SelectContent>{uniqueMandis.map(m => <SelectItem key={m} value={m}>{m}</SelectItem>)}</SelectContent></Select></FormItem>
                        )} />
                        <FormField control={monetaryForm.control} name="moneyReceived" render={({ field }) => (
                          <FormItem><FormLabel>Cash (₹)</FormLabel><FormControl><Input type="number" step="0.01" {...field} className="rounded-xl h-12" /></FormControl></FormItem>
                        )} />
                        <FormField control={monetaryForm.control} name="ratePerQuintal" render={({ field }) => (
                          <FormItem><FormLabel>Rate (₹/Qtl)</FormLabel><FormControl><Input type="number" step="0.01" {...field} className="rounded-xl h-12" /></FormControl></FormItem>
                        )} />
                        <Button type="submit" className="bg-primary h-12 rounded-xl font-bold">Save Record</Button>
                      </div>
                    </form>
                  </Form>
                )}
              </CardContent>
            </Card>
          )}

          <div id="paddy-lifted-table" className="space-y-4">
              {farmerAggregates.map((farmer) => (
                <Collapsible key={farmer.id} open={openFarmerLedgers[farmer.id]} onOpenChange={(o) => setOpenFarmerLedgers(prev => ({...prev, [farmer.id]: o}))} className="border rounded-3xl bg-white overflow-hidden mb-2">
                  <div className="flex items-center justify-between p-4 hover:bg-primary/5 transition-colors">
                    <CollapsibleTrigger className="flex items-center gap-3 flex-grow text-left">
                      {openFarmerLedgers[farmer.id] ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                      <div className="bg-primary/5 p-2 rounded-xl"><UserIcon className="h-5 w-5 text-primary" /></div>
                      <div><p className="font-bold text-primary">{farmer.name}</p><p className="text-[10px] uppercase opacity-60">{farmer.items.length} Records</p></div>
                    </CollapsibleTrigger>
                    <div className="flex items-center gap-4">
                      <div className="text-right mr-2"><p className="text-sm font-black text-primary">{farmer.totalQty.toFixed(2)} Qtl</p></div>
                      <Button variant="outline" size="sm" onClick={(e) => handleDownloadStatement(e, farmer)} className="rounded-xl border-primary/20 h-9">
                        <DownloadIcon className="mr-2 h-4 w-4" /> Statement
                      </Button>
                    </div>
                  </div>
                  <CollapsibleContent className="bg-muted/30">
                    <div className="p-4 overflow-x-auto">
                      <div className="absolute -left-[9999px] top-auto" aria-hidden="true">
                        <div id={`printable-mandi-statement-${farmer.id}`}>
                          <FarmerMandiStatement 
                            farmer={farmer} 
                            millName={selectedMill?.name || 'Mandi Monitor'} 
                            millLocation={selectedMill?.location || 'Operational Unit'} 
                          />
                        </div>
                      </div>
                      <Table>
                        <TableHeader><TableRow><TableHead>Date</TableHead><TableHead>Mandi</TableHead><TableHead className="text-right">Actual</TableHead><TableHead className="text-right">Official</TableHead><TableHead className="text-right">Actions</TableHead></TableRow></TableHeader>
                        <TableBody>{farmer.items.map(item => (
                          <TableRow key={item.id}>
                            <TableCell className="text-xs">{format(new Date(item.date), 'dd MMM yy')}</TableCell>
                            <TableCell className="text-xs font-bold">{item.mandiName}</TableCell>
                            <TableCell className="text-xs text-right opacity-60">{parseFloat(String(item.totalPaddyReceived)).toFixed(2)}</TableCell>
                            <TableCell className="text-xs text-right font-black text-primary">{parseFloat(String(item.mandiWeight)).toFixed(2)}</TableCell>
                            <TableCell className="text-right"><div className="flex gap-2 justify-end">
                              <Button variant="ghost" size="icon" onClick={() => handleEditClick(item)} className="h-7 w-7 rounded-lg"><Edit className="h-3.5 w-3.5" /></Button>
                              <Button variant="ghost" size="icon" onClick={() => deletePaddyLifted(item.id)} className="h-7 w-7 text-destructive"><Trash2 className="h-3.5 w-3.5" /></Button>
                            </div></TableCell>
                          </TableRow>
                        ))}</TableBody>
                      </Table>
                    </div>
                  </CollapsibleContent>
                </Collapsible>
              ))}
          </div>
        </CardContent>
      </Card>
      <Dialog open={isCalculatorOpen} onOpenChange={setCalculatorOpen}><BagWeightCalculator onConfirm={handleCalculatorConfirm} onCancel={() => setCalculatorOpen(false)} initialBagWeights={watchedBagWeights} /></Dialog>
    </div>
  );
}
