
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
  FileText,
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
    message: "Hired vehicle details are incomplete (Check Rent, Driver and Owner Names).",
    path: ['tripCharge'],
});

const monetaryFormSchema = z.object({
  mandiName: z.string().min(1, 'Mandi name is required'),
  moneyReceived: z.coerce.number().positive('Must be a positive number'),
  ratePerQuintal: z.coerce.number().positive('Must be a positive number'),
  date: z.date({ required_error: 'A date is required.' }),
});

const MandiSummaryReport = forwardRef<HTMLDivElement, { mandiName: string, farmers: any[], millName: string, millLocation: string }>(({ mandiName, farmers, millName, millLocation }, ref) => {
  const totalMandiQty = farmers.reduce((sum, f) => sum + f.totalQty, 0);
  return (
    <div ref={ref} className="p-10 bg-white text-black w-[1000px] mx-auto min-h-screen border shadow-sm">
      <div className="text-center mb-10 border-b-4 border-primary pb-6">
        <h1 className="text-4xl font-black uppercase text-primary mb-1">{millName}</h1>
        <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">{millLocation}</p>
        <div className="mt-6 bg-primary text-white py-2 px-8 inline-block rounded-full text-xs font-black uppercase tracking-widest">Mandi Procurement Summary</div>
      </div>
      <div className="flex justify-between items-end mb-8">
        <div><p className="text-[10px] font-black uppercase text-primary/40 tracking-widest">Mandi</p><p className="text-3xl font-black text-primary">{mandiName}</p></div>
        <div className="text-right"><p className="text-[10px] font-black uppercase text-primary/40 tracking-widest">Total Official Weight</p><p className="text-2xl font-black text-primary">{totalMandiQty.toFixed(2)} QTL</p></div>
      </div>
      <div className="rounded-3xl border border-black/10 overflow-hidden mb-12">
        <Table>
          <TableHeader className="bg-primary/5">
            <TableRow><TableHead className="py-4 pl-6 text-black font-bold uppercase text-[10px]">Farmer</TableHead><TableHead className="py-4 text-right text-black font-bold uppercase text-[10px]">Records</TableHead><TableHead className="py-4 text-right pr-6 text-black font-bold uppercase text-[10px]">Qty (Qtl)</TableHead></TableRow>
          </TableHeader>
          <TableBody>
            {farmers.map(f => (
              <TableRow key={f.id} className="border-black/5 font-medium"><TableCell className="py-4 pl-6 font-bold">{f.name}</TableCell><TableCell className="text-right text-xs opacity-60">{f.items.length}</TableCell><TableCell className="text-right font-black text-primary pr-6">{f.totalQty.toFixed(2)}</TableCell></TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
});
MandiSummaryReport.displayName = 'MandiSummaryReport';

const FarmerMandiStatement = forwardRef<HTMLDivElement, { farmer: any, millName: string, millLocation: string }>(({ farmer, millName, millLocation }, ref) => {
  return (
    <div ref={ref} className="p-10 bg-white text-black w-[1000px] mx-auto min-h-screen border shadow-sm">
      <div className="text-center mb-10 border-b-4 border-primary pb-6">
        <h1 className="text-4xl font-black uppercase text-primary mb-1">{millName}</h1>
        <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">{millLocation}</p>
        <div className="mt-6 bg-primary text-white py-2 px-8 inline-block rounded-full text-xs font-black uppercase tracking-widest">Mandi Account Statement</div>
      </div>
      <div className="flex justify-between items-end mb-8">
        <div><p className="text-[10px] font-black uppercase text-primary/40 tracking-widest">Farmer Name</p><p className="text-3xl font-black text-primary">{farmer.name}</p></div>
        <div className="text-right"><p className="text-[10px] font-black uppercase text-primary/40 tracking-widest">Consolidated Official Weight</p><p className="text-2xl font-black text-primary">{farmer.totalQty.toFixed(2)} QTL</p></div>
      </div>
      <div className="rounded-3xl border border-black/10 overflow-hidden">
        <Table>
          <TableHeader className="bg-primary/5">
            <TableRow><TableHead className="py-4 pl-6 text-black font-bold text-[10px] uppercase">Date & Details</TableHead><TableHead className="py-4 text-right text-black font-bold text-[10px] uppercase">Actual (Qtl)</TableHead><TableHead className="py-4 text-right pr-6 text-black font-bold text-[10px] uppercase">Official (Qtl)</TableHead></TableRow>
          </TableHeader>
          <TableBody>
            {farmer.items.map((item: any) => (
              <Fragment key={item.id}>
                <TableRow className="border-black/5 bg-white"><TableCell className="py-4 pl-6"><div><p className="text-xs font-bold">{format(new Date(item.date), 'dd MMM yyyy')}</p><p className="text-[10px] opacity-50">Mandi: {item.mandiName}</p></div></TableCell><TableCell className="text-xs text-right opacity-60">{item.totalPaddyReceived.toFixed(2)}</TableCell><TableCell className="text-xs text-right font-black text-primary pr-6">{item.mandiWeight.toFixed(2)}</TableCell></TableRow>
                {item.individualBagWeights && item.individualBagWeights.length > 0 && (
                  <TableRow className="border-none bg-muted/10"><TableCell colSpan={3} className="py-3 px-6"><div className="grid grid-cols-12 gap-1">{item.individualBagWeights.map((w: number, i: number) => (<div key={i} className="border border-black/5 p-1 text-center bg-white rounded"><p className="text-[7px] opacity-20 leading-none">{i+1}</p><p className="text-[9px] font-bold">{w.toFixed(1)}</p></div>))}</div></TableCell></TableRow>
                )}
              </Fragment>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
});
FarmerMandiStatement.displayName = 'FarmerMandiStatement';

export function PaddyLifted() {
  const { paddyLiftedItems, addPaddyLifted, updatePaddyLifted, deletePaddyLifted, targetAllocations } = useMandiData();
  const { addVehicle, addTrip } = useVehicleData();
  const { labourers, addGroupWorkEntry } = useLabourData();
  const { addPurchase, deletePurchase } = useStockData();
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

  const physicalForm = useForm<z.infer<typeof physicalFormSchema>>({
    resolver: zodResolver(physicalFormSchema),
    defaultValues: { mandiName: '', farmerName: '', vehicleType: 'farmer', destination: 'Mill', totalPaddyReceived: 0, mandiWeight: 0, date: new Date(), calculationMethod: 'uniform', tokenNumber: '', description: '', vehicleNumber: '', driverName: '', ownerName: '', tripCharge: 0, source: '', numberOfLabours: 0, labourerIds: [], labourCharge: 0, labourWageType: 'total_amount', individualBagWeights: [], privateExcessQty: 0, privateExcessRate: 0 }
  });

  const { fields, replace } = useFieldArray({ control: physicalForm.control, name: "labourerIds" });
  const monetaryForm = useForm<z.infer<typeof monetaryFormSchema>>({
    resolver: zodResolver(monetaryFormSchema),
    defaultValues: { mandiName: '', moneyReceived: 0, ratePerQuintal: 0, date: new Date() }
  });
  
  const numberOfLabours = physicalForm.watch('numberOfLabours');
  const vehicleType = physicalForm.watch('vehicleType');
  const watchedBagWeights = physicalForm.watch('individualBagWeights');

  useEffect(() => {
    const targetCount = Math.max(0, parseInt(String(numberOfLabours || 0)));
    const currentValues = physicalForm.getValues('labourerIds') || [];
    if (fields.length !== targetCount) {
      replace(Array.from({ length: targetCount }, (_, i) => currentValues[i] || { value: '' }));
    }
  }, [numberOfLabours, replace, physicalForm, fields.length]);

  const uniqueMandis = useMemo(() => [...new Set((targetAllocations || []).map(a => a.mandiName).filter(Boolean))], [targetAllocations]);

  const farmerAggregates = useMemo(() => {
    const map: Record<string, { id: string; name: string; items: PaddyLiftedType[]; totalQty: number }> = {};
    const filtered = selectedMandi === 'All' ? paddyLiftedItems : paddyLiftedItems.filter(i => i.mandiName === selectedMandi);
    filtered.forEach(item => {
      const k = item.farmerName.trim();
      if (!map[k]) map[k] = { id: k.toLowerCase().replace(/\s+/g, '-'), name: k, items: [], totalQty: 0 };
      map[k].items.push(item);
      map[k].totalQty += (Number(item.mandiWeight) || 0);
    });
    return Object.values(map).sort((a,b) => a.name.localeCompare(b.name));
  }, [paddyLiftedItems, selectedMandi]);

  const resetForm = () => {
    setShowPhysicalForm(false); setShowMonetaryForm(false); setEditingItem(null);
    physicalForm.reset({ mandiName: '', farmerName: '', vehicleType: 'farmer', destination: 'Mill', totalPaddyReceived: 0, mandiWeight: 0, date: new Date(), calculationMethod: 'uniform', tokenNumber: '', description: '', vehicleNumber: '', driverName: '', ownerName: '', tripCharge: 0, source: '', numberOfLabours: 0, labourerIds: [], labourCharge: 0, labourWageType: 'total_amount', individualBagWeights: [], privateExcessQty: 0, privateExcessRate: 0 });
    monetaryForm.reset({ mandiName: '', moneyReceived: 0, ratePerQuintal: 0, date: new Date() });
  };

  function onPhysicalSubmit(values: z.infer<typeof physicalFormSchema>) {
    const lIds = values.labourerIds.map(l => l.value).filter(Boolean);
    const sub = { ...values, labourerIds: lIds, entryType: 'physical' as const };
    let entryId = editingItem?.id || Date.now().toString();
    
    if (editingItem) { 
        updatePaddyLifted(editingItem.id, sub); 
        toast({ title: 'Updated' }); 
    } else { 
        addPaddyLifted({ ...sub, id: entryId }); 
        toast({ title: 'Recorded' }); 
    }

    // MANDI-PRIVATE SYNC ENGINE
    const excessId = `excess-${entryId}`;
    if (sub.privateExcessQty > 0) {
        addPurchase({ 
            id: excessId, 
            farmerName: sub.farmerName, 
            itemType: 'paddy', 
            quantity: sub.privateExcessQty, 
            rate: sub.privateExcessRate, 
            date: sub.date, 
            description: `Mandi Excess: ${sub.mandiName}`, 
            isMandiExcess: true, 
            mandiTokenNo: sub.tokenNumber, 
            vehicleType: 'farmer', 
            individualBagWeights: sub.individualBagWeights 
        });
    } else {
        deletePurchase(excessId);
    }

    if (sub.vehicleType === 'hired' && sub.vehicleNumber && sub.tripCharge) {
      const vId = addVehicle({ vehicleNumber: sub.vehicleNumber, driverName: sub.driverName || '', ownerName: sub.ownerName || '', rentType: 'per_trip', rentAmount: 0 });
      if (vId) addTrip(vId, { source: sub.source || sub.mandiName, destination: sub.destination || 'Mill', quantity: sub.totalPaddyReceived, tripCharge: sub.tripCharge });
    }
    if (lIds.length > 0 && sub.labourCharge > 0) addGroupWorkEntry(lIds, sub.labourCharge, `Paddy: ${sub.mandiName}`, sub.totalPaddyReceived);
    resetForm();
  }

  function onMonetarySubmit(values: z.infer<typeof monetaryFormSchema>) {
    const qtl = values.moneyReceived / values.ratePerQuintal;
    const sub = { mandiName: values.mandiName, farmerName: 'Monetary Entry', moneyReceived: values.moneyReceived, ratePerQuintal: values.ratePerQuintal, totalPaddyReceived: qtl, mandiWeight: qtl, date: values.date, entryType: 'monetary' as const };
    if (editingItem) updatePaddyLifted(editingItem.id, sub); else addPaddyLifted(sub);
    resetForm();
  }

  const handleEdit = (item: PaddyLiftedType) => {
    setEditingItem(item);
    if (item.entryType === 'monetary') { setShowMonetaryForm(true); monetaryForm.reset({ mandiName: item.mandiName, moneyReceived: item.moneyReceived || 0, ratePerQuintal: item.ratePerQuintal || 0, date: new Date(item.date) }); }
    else { setShowPhysicalForm(true); physicalForm.reset({ ...item, date: new Date(item.date), labourerIds: (item.labourerIds || []).map(id => ({ value: id })), numberOfLabours: item.labourerIds?.length || 0 }); }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <Fragment>
      <div className="absolute -left-[9999px] top-auto pointer-events-none" aria-hidden="true">
        <div id="mandi-report-pdf"><MandiSummaryReport mandiName={selectedMandi} farmers={farmerAggregates} millName={selectedMill?.name || ''} millLocation={selectedMill?.location || ''} /></div>
        {farmerAggregates.map(f => (<div key={f.id} id={`stmt-${f.id}`}><FarmerMandiStatement farmer={f} millName={selectedMill?.name || ''} millLocation={selectedMill?.location || ''} /></div>))}
      </div>
      
      <div className="space-y-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <Select value={selectedMandi} onValueChange={setSelectedMandi}>
                <SelectTrigger className="w-[200px] rounded-xl"><SelectValue placeholder="All Mandis" /></SelectTrigger>
                <SelectContent><SelectItem value="All">All Mandis</SelectItem>{uniqueMandis.map(m => <SelectItem key={m} value={m}>{m}</SelectItem>)}</SelectContent>
            </Select>
            <Button variant="outline" className="rounded-xl" onClick={() => downloadPdf('mandi-report-pdf', `Mandi_Report_${selectedMandi}`)}>
                <FileText className="mr-2 h-4 w-4" /> Mandi Report (PDF)
            </Button>
          </div>
          <div className="flex gap-3">
            <Button onClick={() => { resetForm(); setShowPhysicalForm(true); }} className="rounded-xl" disabled={uniqueMandis.length === 0}><PlusCircle className="mr-2 h-4 w-4" /> Farmer Arrival</Button>
            {isAdmin && <Button onClick={() => { resetForm(); setShowMonetaryForm(true); }} variant="secondary" className="rounded-xl" disabled={uniqueMandis.length === 0}><CalendarIcon className="mr-2 h-4 w-4" /> Monetary</Button>}
          </div>
        </div>

        {(showPhysicalForm || showMonetaryForm) && (
          <Card className="rounded-3xl shadow-xl overflow-hidden border-primary/10">
            <CardHeader className="bg-primary/5 flex flex-row items-center justify-between">
                <CardTitle className="text-lg">{editingItem ? 'Edit Entry' : 'New Entry'}</CardTitle>
                <Button variant="ghost" size="icon" onClick={resetForm} className="rounded-full"><X className="h-5 w-5" /></Button>
            </CardHeader>
            <CardContent className="pt-6">
              {showPhysicalForm ? (
                <Form {...physicalForm}>
                  <form onSubmit={physicalForm.handleSubmit(onPhysicalSubmit)} className="space-y-8">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        <FormField control={physicalForm.control} name="mandiName" render={({ field }) => (<FormItem><FormLabel>Mandi</FormLabel><Select onValueChange={field.onChange} value={field.value}><FormControl><SelectTrigger className="rounded-xl"><SelectValue placeholder="Select..." /></SelectTrigger></FormControl><SelectContent>{uniqueMandis.map(m => <SelectItem key={m} value={m}>{m}</SelectItem>)}</SelectContent></Select></FormItem>)} />
                        <FormField control={physicalForm.control} name="farmerName" render={({ field }) => (<FormItem><FormLabel>Farmer</FormLabel><FormControl><Input placeholder="Name" {...field} className="rounded-xl" /></FormControl></FormItem>)} />
                        <FormField control={physicalForm.control} name="date" render={({ field }) => (<FormItem className="flex flex-col"><FormLabel>Date</FormLabel><Popover open={isPhysicalCalendarOpen} onOpenChange={setIsPhysicalCalendarOpen}><PopoverTrigger asChild><FormControl><Button variant="outline" className="rounded-xl text-left">{field.value ? format(field.value, "PPP") : 'Pick date'}<CalendarIcon className="ml-auto h-4 w-4 opacity-50" /></Button></FormControl></PopoverTrigger><PopoverContent className="w-auto p-0"><Calendar mode="single" selected={field.value} onSelect={(d) => { if(d) field.onChange(d); setIsPhysicalCalendarOpen(false); }} initialFocus /></PopoverContent></Popover></FormItem>)} />
                        <FormField control={physicalForm.control} name="totalPaddyReceived" render={({ field }) => (<FormItem><FormLabel>Actual Qty (Qtl)</FormLabel><div className="flex gap-2"><FormControl><Input type="number" step="0.01" {...field} className="rounded-xl" /></FormControl><Button type="button" variant="outline" size="icon" onClick={() => setCalculatorOpen(true)} className="rounded-xl"><Calculator className="h-4 w-4" /></Button></div></FormItem>)} />
                        <FormField control={physicalForm.control} name="mandiWeight" render={({ field }) => (<FormItem><FormLabel>Official Mandi Qty (Qtl)</FormLabel><FormControl><Input type="number" step="0.01" {...field} className="rounded-xl bg-primary/5 font-bold" /></FormControl></FormItem>)} />
                        <FormField control={physicalForm.control} name="tokenNumber" render={({ field }) => (<FormItem><FormLabel>Token No.</FormLabel><FormControl><Input {...field} className="rounded-xl" /></FormControl></FormItem>)} />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-accent/5 p-6 rounded-2xl border border-accent/20">
                        <div className="space-y-1"><h3 className="font-bold text-accent-foreground text-sm uppercase">Private Excess (Auto-Sync)</h3><p className="text-[10px] opacity-60">Quantities above target will be pushed to Private section.</p></div>
                        <div className="grid grid-cols-2 gap-4">
                            <FormField control={physicalForm.control} name="privateExcessQty" render={({ field }) => (<FormItem><FormLabel>Excess Qtl</FormLabel><FormControl><Input type="number" step="0.01" {...field} className="rounded-xl border-accent/30" /></FormControl></FormItem>)} />
                            <FormField control={physicalForm.control} name="privateExcessRate" render={({ field }) => (<FormItem><FormLabel>Rate (₹/Qtl)</FormLabel><FormControl><Input type="number" step="0.01" {...field} className="rounded-xl border-accent/30" /></FormControl></FormItem>)} />
                        </div>
                    </div>
                    <div className="space-y-4">
                        <h3 className="text-sm font-bold opacity-50 flex items-center gap-2"><Car className="h-4 w-4" /> Logistics & Hired Rent</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                            <FormField control={physicalForm.control} name="vehicleType" render={({ field }) => (<FormItem><FormLabel>Ownership</FormLabel><Select onValueChange={field.onChange} value={field.value}><FormControl><SelectTrigger className="rounded-xl"><SelectValue /></SelectTrigger></FormControl><SelectContent><SelectItem value="farmer">Farmer's</SelectItem><SelectItem value="own">Own</SelectItem><SelectItem value="hired">Hired</SelectItem></SelectContent></Select></FormItem>)} />
                            {vehicleType === 'hired' && (
                                <Fragment>
                                    <FormField control={physicalForm.control} name="vehicleNumber" render={({ field }) => (<FormItem><FormLabel>Vehicle No.</FormLabel><FormControl><Input {...field} className="rounded-xl" /></FormControl></FormItem>)} />
                                    <FormField control={physicalForm.control} name="driverName" render={({ field }) => (<FormItem><FormLabel>Driver</FormLabel><FormControl><Input {...field} className="rounded-xl" /></FormControl></FormItem>)} />
                                    <FormField control={physicalForm.control} name="ownerName" render={({ field }) => (<FormItem><FormLabel>Owner</FormLabel><FormControl><Input {...field} className="rounded-xl" /></FormControl></FormItem>)} />
                                    <FormField control={physicalForm.control} name="tripCharge" render={({ field }) => (<FormItem><FormLabel>Rent (₹)</FormLabel><FormControl><Input type="number" step="10" className="rounded-xl" {...field} /></FormControl><FormMessage /></FormItem>)} />
                                </Fragment>
                            )}
                        </div>
                    </div>
                    <Button type="submit" className="w-full py-8 rounded-2xl font-bold text-lg">{editingItem ? 'Update Arrival' : 'Confirm Arrival'}</Button>
                  </form>
                </Form>
              ) : (
                <Form {...monetaryForm}>
                    <form onSubmit={monetaryForm.handleSubmit(onMonetarySubmit)} className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 items-end">
                            <FormField control={monetaryForm.control} name="mandiName" render={({ field }) => (<FormItem><FormLabel>Mandi</FormLabel><Select onValueChange={field.onChange} value={field.value}><FormControl><SelectTrigger className="rounded-xl"><SelectValue /></SelectTrigger></FormControl><SelectContent>{uniqueMandis.map(m => <SelectItem key={m} value={m}>{m}</SelectItem>)}</SelectContent></Select></FormItem>)} />
                            <FormField control={monetaryForm.control} name="moneyReceived" render={({ field }) => (<FormItem><FormLabel>Cash Received (₹)</FormLabel><FormControl><Input type="number" step="0.01" {...field} className="rounded-xl" /></FormControl></FormItem>)} />
                            <FormField control={monetaryForm.control} name="ratePerQuintal" render={({ field }) => (<FormItem><FormLabel>Standard Rate (₹/Qtl)</FormLabel><FormControl><Input type="number" step="0.01" {...field} className="rounded-xl" /></FormControl></FormItem>)} />
                            <Button type="submit" className="rounded-xl h-10 font-bold">Save Monetary Entry</Button>
                        </div>
                    </form>
                </Form>
              )}
            </CardContent>
          </Card>
        )}

        <div className="space-y-4">
          {farmerAggregates.map(f => (
            <Collapsible key={f.id} open={openFarmerLedgers[f.id]} onOpenChange={(o) => setOpenFarmerLedgers(p => ({...p, [f.id]: o}))} className="border rounded-3xl bg-white overflow-hidden shadow-sm">
              <div className="flex items-center justify-between p-4 hover:bg-primary/5 transition-colors">
                <CollapsibleTrigger className="flex items-center gap-3 flex-grow text-left cursor-pointer">
                    {openFarmerLedgers[f.id] ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                    <div className="bg-primary/5 p-2 rounded-xl"><UserIcon className="h-5 w-5 text-primary" /></div>
                    <div><p className="font-bold text-primary">{f.name}</p><p className="text-[10px] uppercase opacity-60">{f.items.length} Deliveries</p></div>
                </CollapsibleTrigger>
                <div className="flex items-center gap-4">
                    <p className="text-sm font-black text-primary">{f.totalQty.toFixed(2)} Qtl</p>
                    <Button variant="outline" size="sm" onClick={(e) => { e.stopPropagation(); downloadPdf(`stmt-${f.id}`, `Statement_${f.name.replace(/\s+/g, '_')}`); }} className="rounded-xl h-9">Statement</Button>
                </div>
              </div>
              <CollapsibleContent className="bg-muted/30 p-4 overflow-x-auto">
                <Table>
                    <TableHeader><TableRow><TableHead>Date</TableHead><TableHead>Mandi</TableHead><TableHead className="text-right">Actual</TableHead><TableHead className="text-right">Official</TableHead><TableHead className="text-right">Actions</TableHead></TableRow></TableHeader>
                    <TableBody>
                        {f.items.map(item => (
                            <TableRow key={item.id}>
                                <TableCell className="text-xs">{format(new Date(item.date), 'dd MMM yy')}</TableCell>
                                <TableCell className="text-xs font-bold">{item.mandiName}</TableCell>
                                <TableCell className="text-xs text-right opacity-60">{item.totalPaddyReceived.toFixed(2)}</TableCell>
                                <TableCell className="text-xs text-right font-black text-primary">{item.mandiWeight.toFixed(2)}</TableCell>
                                <TableCell className="text-right">
                                    <div className="flex gap-2 justify-end">
                                        <Button variant="ghost" size="icon" onClick={() => handleEdit(item)} className="h-7 w-7"><Edit className="h-3.5 w-3.5" /></Button>
                                        <Button variant="ghost" size="icon" onClick={() => deletePaddyLifted(item.id)} className="h-7 w-7 text-destructive"><Trash2 className="h-3.5 w-3.5" /></Button>
                                    </div>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
              </CollapsibleContent>
            </Collapsible>
          ))}
          {farmerAggregates.length === 0 && <div className="text-center p-12 bg-white rounded-3xl border border-dashed opacity-50 italic">No arrivals found for {selectedMandi}.</div>}
        </div>
      </div>

      <Dialog open={isCalculatorOpen} onOpenChange={setCalculatorOpen}>
        <BagWeightCalculator onConfirm={(v) => { physicalForm.setValue('totalPaddyReceived', v.grossQuintals); physicalForm.setValue('mandiWeight', v.netQuintals); physicalForm.setValue('individualBagWeights', v.bagWeights); physicalForm.setValue('calculationMethod', v.method); setCalculatorOpen(false); }} onCancel={() => setCalculatorOpen(false)} initialBagWeights={watchedBagWeights} />
      </Dialog>
    </Fragment>
  );
}
