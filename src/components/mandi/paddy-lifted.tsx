'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useMandiData } from '@/context/mandi-context';
import { useVehicleData } from '@/context/vehicle-context';
import { useLabourData } from '@/context/labour-context';
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
  User as UserIcon
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
import { Label } from '@/components/ui/label';
import { format, isValid } from 'date-fns';
import { BagWeightCalculator } from './bag-weight-calculator';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { cn } from '@/lib/utils';
import { PaddyLiftingSlip } from './paddy-lifting-slip';
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
      map[key].totalQty += item.mandiWeight;
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
    if (fields.length === targetCount) return;
    
    const currentValues = physicalForm.getValues('labourerIds') || [];
    const nextFields = Array.from({ length: targetCount }, (_, i) => currentValues[i] || { value: '' });
    replace(nextFields);
  }, [numberOfLabours, replace, physicalForm, fields.length]);

  const cancelForm = () => {
    setShowPhysicalForm(false);
    setShowMonetaryForm(false);
    physicalForm.reset();
    monetaryForm.reset();
  };

  function onPhysicalSubmit(values: z.infer<typeof physicalFormSchema>) {
    const labourerIds = values.labourerIds.map(l => l.value).filter(Boolean);
    const submissionValues = { 
        ...values, 
        labourerIds, 
        entryType: 'physical' as const 
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
    toast({ title: 'Success!', description: 'Monetary entry saved.' });
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

  const handleCalculatorConfirm = (vals: { grossQuintals: number; netQuintals: number; bagWeights: number[]; method: any }) => {
    physicalForm.setValue('totalPaddyReceived', vals.grossQuintals);
    physicalForm.setValue('mandiWeight', vals.netQuintals);
    physicalForm.setValue('individualBagWeights', vals.bagWeights);
    physicalForm.setValue('calculationMethod', vals.method);
    setCalculatorOpen(false);
  };

  return (
    <div className="space-y-8">
      <Card className="border-none shadow-none bg-transparent">
        <CardHeader className="px-0 pt-0">
          <div className="flex justify-between items-start mb-6">
            <div>
              <CardTitle className="text-2xl font-bold font-headline text-primary">Procurement Records</CardTitle>
              <CardDescription>Pure volume tracking for physical arrivals and monetary conversions.</CardDescription>
            </div>
             <Button variant="outline" size="sm" onClick={() => downloadPdf('paddy-lifted-table', 'paddy-lifted-summary')} className="rounded-xl border-primary/20">
                <DownloadIcon className="mr-2 h-4 w-4" /> Export Summary PDF
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
                    <CalendarIcon className="mr-2 h-4 w-4" /> Monetary Record
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
                            <FormLabel>Actual Quantity (Qtl)</FormLabel>
                              <div className="flex items-center gap-2">
                                <FormControl><Input type="number" step="0.01" {...field} className="rounded-xl h-12" /></FormControl>
                                <Button type="button" variant="outline" size="icon" onClick={() => setCalculatorOpen(true)} className="h-12 w-12 rounded-xl border-primary/20"><Calculator className="h-5 w-5 text-primary" /></Button>
                              </div>
                            <FormMessage />
                          </FormItem>
                        )} />
                        <FormField control={physicalForm.control} name="mandiWeight" render={({ field }) => (
                          <FormItem>
                            <FormLabel>Standard Mandi Weight (Qtl)</FormLabel>
                            <FormControl><Input type="number" step="0.01" {...field} className="rounded-xl h-12 bg-primary/5 border-primary/20 font-bold text-primary" /></FormControl>
                            <FormMessage />
                          </FormItem>
                        )} />
                        <FormField control={physicalForm.control} name="tokenNumber" render={({ field }) => (
                            <FormItem><FormLabel>Token Number</FormLabel><FormControl><Input {...field} className="rounded-xl h-12" /></FormControl></FormItem>
                        )} />
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
                                      <FormItem><FormLabel>Rent (₹)</FormLabel><FormControl><Input type="number" step="10" className="rounded-xl" {...field} /></FormControl></FormItem>
                                  )} />
                              </>
                             )}
                          </div>
                      </div>

                      <div className="space-y-6">
                          <h3 className="text-md font-bold flex items-center gap-2 text-primary opacity-80"><Users className="h-5 w-5" /> Labour Selection</h3>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                              <FormField control={physicalForm.control} name="numberOfLabours" render={({ field }) => (
                                  <FormItem><FormLabel>Number of Workers</FormLabel><FormControl><Input type="number" {...field} className="rounded-xl" /></FormControl></FormItem>
                              )} />
                              <FormField control={physicalForm.control} name="labourCharge" render={({ field }) => (
                                  <FormItem><FormLabel>Total Loading Wage (₹)</FormLabel><FormControl><Input type="number" step="10" {...field} className="rounded-xl" /></FormControl></FormItem>
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
                          <FormItem><FormLabel>Cash Received (₹)</FormLabel><FormControl><Input type="number" step="0.01" {...field} className="rounded-xl h-12" /></FormControl></FormItem>
                        )} />
                        <FormField control={monetaryForm.control} name="ratePerQuintal" render={({ field }) => (
                          <FormItem><FormLabel>Rate Applied (₹/Qtl)</FormLabel><FormControl><Input type="number" step="0.01" {...field} className="rounded-xl h-12" /></FormControl></FormItem>
                        )} />
                        <Button type="submit" className="bg-primary hover:bg-primary/90 h-12 rounded-xl font-bold">Save Cash Entry</Button>
                      </div>
                    </form>
                  </Form>
                )}
              </CardContent>
            </Card>
          )}

          <div id="paddy-lifted-table" className="space-y-4">
              <h3 className="text-lg font-bold text-primary uppercase tracking-widest px-2">Farmer Arrival Ledgers</h3>
              <div className="border border-primary/5 rounded-3xl overflow-hidden shadow-sm bg-white">
                {farmerAggregates.map((farmer) => (
                  <Collapsible 
                    key={farmer.id} 
                    open={openFarmerLedgers[farmer.id]} 
                    onOpenChange={(isOpen) => setOpenFarmerLedgers(prev => ({...prev, [farmer.id]: isOpen}))}
                    className="border-b last:border-b-0 border-primary/5"
                  >
                    <div className="flex items-center justify-between p-4 hover:bg-primary/5 transition-colors group">
                      <CollapsibleTrigger className="flex items-center gap-3 flex-grow text-left cursor-pointer">
                        {openFarmerLedgers[farmer.id] ? <ChevronDown className="h-4 w-4 text-primary" /> : <ChevronRight className="h-4 w-4 text-muted-foreground" />}
                        <div className="bg-primary/5 p-2 rounded-xl group-hover:bg-primary/10 transition-colors">
                          <UserIcon className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <p className="font-bold text-primary">{farmer.name}</p>
                          <p className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider">{farmer.items.length} Arrival Records</p>
                        </div>
                      </CollapsibleTrigger>
                      <div className="text-right">
                        <p className="text-sm font-black text-primary">{farmer.totalQty.toFixed(2)} Qtl</p>
                        <p className="text-[10px] text-muted-foreground font-bold uppercase">Total Official Wt</p>
                      </div>
                    </div>
                    <CollapsibleContent className="bg-muted/30">
                      <div className="p-4 overflow-x-auto">
                        <Table>
                          <TableHeader>
                            <TableRow className="border-primary/5">
                              <TableHead className="text-[10px] font-bold uppercase">Date</TableHead>
                              <TableHead className="text-[10px] font-bold uppercase">Mandi</TableHead>
                              <TableHead className="text-[10px] font-bold uppercase text-right">Actual (Qtl)</TableHead>
                              <TableHead className="text-[10px] font-bold uppercase text-right">Standard (Qtl)</TableHead>
                              <TableHead className="text-[10px] font-bold uppercase text-right">Actions</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {farmer.items.map(item => (
                              <React.Fragment key={item.id}>
                                <TableRow className="border-primary/5 hover:bg-primary/5 transition-colors">
                                  <TableCell className="text-xs font-medium">{format(new Date(item.date), 'dd MMM yy')}</TableCell>
                                  <TableCell className="text-xs font-bold text-primary">{item.mandiName}</TableCell>
                                  <TableCell className="text-xs text-right opacity-60">{item.totalPaddyReceived.toFixed(2)}</TableCell>
                                  <TableCell className="text-xs text-right font-black text-primary">{item.mandiWeight.toFixed(2)}</TableCell>
                                  <TableCell className="text-right">
                                    <div className="flex gap-2 justify-end">
                                      <Button variant="ghost" size="icon" onClick={() => handleDownloadSlip(item)} className="h-7 w-7 rounded-lg hover:text-primary">
                                        <DownloadIcon className="h-3.5 w-3.5" />
                                      </Button>
                                      <Button variant="ghost" size="icon" onClick={() => handleDeleteClick(item.id)} className="h-7 w-7 rounded-lg hover:text-destructive">
                                        <Trash2 className="h-3.5 w-3.5" />
                                      </Button>
                                    </div>
                                    <div className="absolute -left-[9999px] top-auto pointer-events-none" aria-hidden="true">
                                      <div id={`slip-${item.id}`}>
                                        <PaddyLiftingSlip entry={item} millName={selectedMill?.name || 'Mandi Monitor'} millLocation={selectedMill?.location || 'Facility'} />
                                      </div>
                                    </div>
                                  </TableCell>
                                </TableRow>
                              </React.Fragment>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    </CollapsibleContent>
                  </Collapsible>
                ))}
                {farmerAggregates.length === 0 && (
                  <div className="p-12 text-center text-muted-foreground italic">No procurement records found. Click "Farmer Arrival" to start.</div>
                )}
              </div>
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
    </div>
  );
}