'use client';

import { useState, useMemo, useEffect } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useMandiData } from '@/context/mandi-context';
import { useVehicleData } from '@/context/vehicle-context';
import { useLabourData } from '@/context/labour-context';
import { PlusCircle, DollarSign, Download, Edit, Car, Users } from 'lucide-react';
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
    message: "Vehicle number, driver, owner, and a positive trip charge are required for hired vehicles.",
    path: ['tripCharge'],
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
  const { toast } = useToast();
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';
  const [showPhysicalForm, setShowPhysicalForm] = useState(false);
  const [showMonetaryForm, setShowMonetaryForm] = useState(false);
  const [editingEntry, setEditingEntry] = useState<PaddyLiftedType | null>(null);
  const [isEditDialogOpen, setEditDialogOpen] = useState(false);
  const [selectedMandi, setSelectedMandi] = useState('All');

  const uniqueMandis = useMemo(() => {
    const mandiNames = targetAllocations.map((allocation) => allocation.mandiName);
    return [...new Set(mandiNames)];
  }, [targetAllocations]);

  const filteredItems = useMemo(() => {
    if (selectedMandi === 'All') {
      return paddyLiftedItems;
    }
    return paddyLiftedItems.filter(item => item.mandiName === selectedMandi);
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


  const monetaryForm = useForm<z.infer<typeof monetaryFormSchema>>({
    resolver: zodResolver(monetaryFormSchema),
    defaultValues: { mandiName: '', moneyReceived: 0, ratePerQuintal: 0, date: new Date() },
  });
  
  const vehicleType = physicalForm.watch('vehicleType');
  const mandiNameValue = physicalForm.watch('mandiName');

  useEffect(() => {
    if (mandiNameValue) {
      physicalForm.setValue('source', mandiNameValue);
    }
  }, [mandiNameValue, physicalForm]);


  useEffect(() => {
    if (editingEntry) {
      if (editingEntry.entryType === 'monetary') {
        monetaryForm.reset({
          mandiName: editingEntry.mandiName,
          moneyReceived: editingEntry.moneyReceived,
          ratePerQuintal: editingEntry.ratePerQuintal,
          date: editingEntry.date,
        });
      } else {
        physicalForm.reset({
          mandiName: editingEntry.mandiName,
          farmerName: editingEntry.farmerName,
          totalPaddyReceived: editingEntry.totalPaddyReceived,
          mandiWeight: editingEntry.mandiWeight,
          date: editingEntry.date,
          vehicleType: editingEntry.vehicleType || 'farmer',
          vehicleNumber: editingEntry.vehicleNumber || '',
          driverName: editingEntry.driverName || '',
          ownerName: editingEntry.ownerName || '',
          tripCharge: editingEntry.tripCharge || 0,
          source: editingEntry.source || editingEntry.mandiName,
          destination: editingEntry.destination || 'Mill',
          numberOfLabours: editingEntry.labourerIds?.length || 0,
          labourerIds: editingEntry.labourerIds?.map(id => ({ value: id })) || [],
          labourCharge: editingEntry.labourCharge || 0,
        });
      }
    } else {
      physicalForm.reset({
          mandiName: '',
          farmerName: '',
          vehicleType: 'farmer',
          destination: 'Mill',
          totalPaddyReceived: 0,
          mandiWeight: 0,
          date: new Date(),
          vehicleNumber: '',
          driverName: '',
          ownerName: '',
          tripCharge: 0,
          source: '',
          numberOfLabours: 0,
          labourerIds: [],
          labourCharge: 0,
          labourWageType: 'total_amount',
      });
      monetaryForm.reset({ mandiName: '', moneyReceived: 0, ratePerQuintal: 0, date: new Date() });
    }
  }, [editingEntry, physicalForm, monetaryForm])

  function onPhysicalSubmit(values: z.infer<typeof physicalFormSchema>) {
    const labourerIds = values.labourerIds.map(l => l.value).filter(Boolean);
    const submissionValues = { ...values, labourerIds };

    if (editingEntry) {
      updatePaddyLifted(editingEntry.id, { ...editingEntry, ...submissionValues });
      toast({ title: 'Success!', description: 'Paddy lifting record has been updated.' });
    } else {
      addPaddyLifted({ ...submissionValues, entryType: 'physical' });
      toast({ title: 'Success!', description: 'Physical paddy lifting record has been added.' });

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
            toast({ title: 'Vehicle Updated', description: `Trip for ${submissionValues.vehicleNumber} has been added to Vehicle Register.` });
        }
      }

      if (labourerIds.length > 0 && submissionValues.labourCharge > 0) {
        addGroupWorkEntry(labourerIds, submissionValues.labourCharge, `Paddy lifting from ${submissionValues.mandiName}`, submissionValues.totalPaddyReceived);
        toast({ title: 'Labour Updated', description: 'Work entry added to Labour Register.' });
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
      toast({ title: 'Success!', description: 'Monetary lifting record has been updated.' });
    } else {
      addPaddyLifted(newEntryData);
      toast({ title: 'Success!', description: 'Monetary paddy lifting record has been added.' });
    }
    
    monetaryForm.reset();
    setShowMonetaryForm(false);
    setEditDialogOpen(false);
    setEditingEntry(null);
  }

  const handleTogglePhysicalForm = () => {
    setShowPhysicalForm(!showPhysicalForm);
    setShowMonetaryForm(false);
  };

  const handleToggleMonetaryForm = () => {
    setShowMonetaryForm(!showMonetaryForm);
    setShowPhysicalForm(false);
  };

  const handleEditClick = (entry: PaddyLiftedType) => {
    setEditingEntry(entry);
    setEditDialogOpen(true);
  };

  const getVehicleDetails = (item: PaddyLiftedType) => {
    if (!item.vehicleType || item.vehicleType === 'farmer') return "Farmer's Vehicle";
    if (item.vehicleType === 'own') return 'Own Vehicle';
    if (item.vehicleType === 'hired') {
      return `${item.ownerName} (${item.vehicleNumber})`;
    }
    return 'N/A';
  };


  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex justify-between items-start">
            <div>
              <CardTitle>Paddy Lifting Records</CardTitle>
              <CardDescription>View and manage paddy lifting entries from various mandis.</CardDescription>
            </div>
             <Button variant="outline" size="sm" onClick={() => downloadPdf('paddy-lifted-table', 'paddy-lifted-summary')}>
                <Download className="mr-2 h-4 w-4" />
                Download PDF
            </Button>
          </div>
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 pt-4">
              <div className="flex items-center gap-4">
                <Label htmlFor="mandi-filter" className="text-sm font-medium">Filter by Mandi:</Label>
                <Select value={selectedMandi} onValueChange={setSelectedMandi}>
                  <SelectTrigger className="w-[280px]" id="mandi-filter">
                    <SelectValue placeholder="Select a mandi" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      <SelectLabel>Mandis</SelectLabel>
                      <SelectItem value="All">All Mandis</SelectItem>
                      {uniqueMandis.map((mandi) => (
                        <SelectItem key={mandi} value={mandi}>{mandi}</SelectItem>
                      ))}
                    </SelectGroup>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex gap-2">
                <Button onClick={handleTogglePhysicalForm} size="sm" disabled={uniqueMandis.length === 0}>
                  <PlusCircle className="mr-2 h-4 w-4" />
                  {showPhysicalForm ? 'Cancel' : 'Add Physical Entry'}
                </Button>
                {isAdmin && (
                  <Button onClick={handleToggleMonetaryForm} size="sm" variant="secondary" disabled={uniqueMandis.length === 0}>
                    <DollarSign className="mr-2 h-4 w-4" />
                    {showMonetaryForm ? 'Cancel' : 'Add Monetary Entry'}
                  </Button>
                )}
              </div>
          </div>
          {uniqueMandis.length === 0 && !showPhysicalForm && !showMonetaryForm && (
              <p className="text-sm text-muted-foreground pt-2">Please add a target allotment before adding a paddy lifting entry.</p>
          )}
        </CardHeader>
        <CardContent className="space-y-6">
          {showPhysicalForm && (
            <Card className="bg-muted/50">
              <CardHeader>
                  <CardTitle>New Physical Paddy Lifting Entry</CardTitle>
              </CardHeader>
              <CardContent>
                <Form {...physicalForm}>
                  <form onSubmit={physicalForm.handleSubmit(onPhysicalSubmit)} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 items-start">
                      <FormField
                        control={physicalForm.control}
                        name="mandiName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Mandi Name</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger><SelectValue placeholder="Select a mandi" /></SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {uniqueMandis.map((mandi) => ( <SelectItem key={mandi} value={mandi}>{mandi}</SelectItem> ))}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField control={physicalForm.control} name="farmerName" render={({ field }) => (
                        <FormItem><FormLabel>Farmer Name</FormLabel><FormControl><Input placeholder="e.g., Ramesh Patel" {...field} /></FormControl><FormMessage /></FormItem>
                      )} />
                      <FormField control={physicalForm.control} name="totalPaddyReceived" render={({ field }) => (
                        <FormItem><FormLabel>Paddy Received (Qtl)</FormLabel><FormControl><Input type="number" step="0.01" placeholder="120" {...field} /></FormControl><FormMessage /></FormItem>
                      )} />
                      <FormField control={physicalForm.control} name="mandiWeight" render={({ field }) => (
                        <FormItem><FormLabel>Mandi Weight (Qtl)</FormLabel><FormControl><Input type="number" step="0.01" placeholder="118.5" {...field} /></FormControl><FormMessage /></FormItem>
                      )} />
                    </div>

                    <Separator />
                    
                    <div>
                        <h3 className="text-md font-medium mb-4 flex items-center gap-2"><Car className="h-5 w-5" /> Vehicle Details</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 items-start">
                           <FormField
                                control={physicalForm.control}
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
                                <FormField control={physicalForm.control} name="vehicleNumber" render={({ field }) => (
                                    <FormItem><FormLabel>Vehicle Number</FormLabel><FormControl><Input placeholder="OD01AB1234" {...field} /></FormControl><FormMessage /></FormItem>
                                )} />
                                 <FormField control={physicalForm.control} name="driverName" render={({ field }) => (
                                    <FormItem><FormLabel>Driver Name</FormLabel><FormControl><Input placeholder="Suresh" {...field} /></FormControl><FormMessage /></FormItem>
                                )} />
                                <FormField control={physicalForm.control} name="ownerName" render={({ field }) => (
                                    <FormItem><FormLabel>Owner/Agency</FormLabel><FormControl><Input placeholder="Gupta Transports" {...field} /></FormControl><FormMessage /></FormItem>
                                )} />
                                <FormField control={physicalForm.control} name="tripCharge" render={({ field }) => (
                                    <FormItem><FormLabel>Trip Charge (₹)</FormLabel><FormControl><Input type="number" step="10" placeholder="2500" {...field} /></FormControl><FormMessage /></FormItem>
                                )} />
                                <FormField control={physicalForm.control} name="source" render={({ field }) => (
                                    <FormItem><FormLabel>Source</FormLabel><FormControl><Input placeholder="Source location" {...field} /></FormControl><FormMessage /></FormItem>
                                )} />
                                <FormField control={physicalForm.control} name="destination" render={({ field }) => (
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
                            <FormField control={physicalForm.control} name="numberOfLabours" render={({ field }) => (
                                <FormItem><FormLabel>Number of Labours</FormLabel><FormControl><Input type="number" {...field} /></FormControl><FormMessage /></FormItem>
                            )} />
                            <FormField control={physicalForm.control} name="labourCharge" render={({ field }) => (
                                <FormItem><FormLabel>Total Labour Charge (₹)</FormLabel><FormControl><Input type="number" step="10" placeholder="e.g., 800" {...field} /></FormControl><FormMessage /></FormItem>
                            )} />
                        </div>
                         {fields.map((field, index) => (
                           <FormField
                            key={field.id}
                            control={physicalForm.control}
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


                    <Button type="submit" className="w-full md:w-auto bg-accent hover:bg-accent/90">Add Entry</Button>
                  </form>
                </Form>
              </CardContent>
            </Card>
          )}

          {isAdmin && showMonetaryForm && (
              <Card className="bg-muted/50">
                  <CardHeader>
                      <CardTitle>New Monetary Paddy Lifting Entry</CardTitle>
                      <CardDescription>Enter money received to auto-calculate equivalent quintals.</CardDescription>
                  </CardHeader>
                  <CardContent>
                  <Form {...monetaryForm}>
                      <form onSubmit={monetaryForm.handleSubmit(onMonetarySubmit)} className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
                      <FormField
                          control={monetaryForm.control}
                          name="mandiName"
                          render={({ field }) => (
                          <FormItem>
                              <FormLabel>Mandi Name</FormLabel>
                              <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                  <SelectTrigger><SelectValue placeholder="Select a mandi" /></SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                  {uniqueMandis.map((mandi) => ( <SelectItem key={mandi} value={mandi}>{mandi}</SelectItem> ))}
                              </SelectContent>
                              </Select>
                              <FormMessage />
                          </FormItem>
                          )}
                      />
                      <FormField control={monetaryForm.control} name="moneyReceived" render={({ field }) => (
                          <FormItem><FormLabel>Money Received (₹)</FormLabel><FormControl><Input type="number" step="0.01" placeholder="250000" {...field} /></FormControl><FormMessage /></FormItem>
                      )} />
                      <FormField control={monetaryForm.control} name="ratePerQuintal" render={({ field }) => (
                          <FormItem><FormLabel>Rate per Quintal (₹)</FormLabel><FormControl><Input type="number" step="0.01" placeholder="2200" {...field} /></FormControl><FormMessage /></FormItem>
                      )} />
                      <Button type="submit" className="w-full md:w-auto md:col-span-full bg-accent hover:bg-accent/90">Add Monetary Entry</Button>
                      </form>
                  </Form>
                  </CardContent>
              </Card>
          )}

          <div id="paddy-lifted-table">
              <div>
                  <h3 className="text-lg font-semibold mb-2">Physical Lifting History</h3>
                  <div className="border rounded-lg">
                      <Table>
                      <TableHeader>
                          <TableRow>
                          <TableHead>Date</TableHead>
                          <TableHead>Mandi Name</TableHead>
                          <TableHead>Farmer Name</TableHead>
                          <TableHead>Paddy Received (Qtl)</TableHead>
                           <TableHead>Vehicle Details</TableHead>
                          <TableHead className="text-right">Mandi Weight (Qtl)</TableHead>
                          {isAdmin && <TableHead className="text-right">Actions</TableHead>}
                          </TableRow>
                      </TableHeader>
                      <TableBody>
                          {physicalEntries.length === 0 && (
                              <TableRow><TableCell colSpan={isAdmin ? 7 : 6} className="text-center">No physical paddy lifted yet.</TableCell></TableRow>
                          )}
                          {physicalEntries.map((item) => (
                          <TableRow key={item.id}>
                              <TableCell>{format(item.date, 'dd MMM yyyy')}</TableCell>
                              <TableCell className="font-medium">{item.mandiName}</TableCell>
                              <TableCell>{item.farmerName}</TableCell>
                              <TableCell>{item.totalPaddyReceived.toLocaleString('en-IN', { maximumFractionDigits: 2 })}</TableCell>
                               <TableCell className="break-words">{getVehicleDetails(item)}</TableCell>
                              <TableCell className="text-right">{item.mandiWeight.toLocaleString('en-IN', { maximumFractionDigits: 2 })}</TableCell>
                              {isAdmin && (
                                <TableCell className="text-right">
                                  <Button variant="ghost" size="sm" onClick={() => handleEditClick(item)}>
                                    <Edit className="h-4 w-4" />
                                  </Button>
                                </TableCell>
                              )}
                          </TableRow>
                          ))}
                      </TableBody>
                      </Table>
                  </div>
              </div>

              {isAdmin && (
              <div>
                  <Separator className="my-6" />
                  <h3 className="text-lg font-semibold mb-2">Monetary Lifting History</h3>
                  <div className="border rounded-lg">
                      <Table>
                      <TableHeader>
                          <TableRow>
                          <TableHead>Date</TableHead>
                          <TableHead>Mandi Name</TableHead>
                          <TableHead>Money Received (₹)</TableHead>
                          <TableHead>Rate per Quintal (₹)</TableHead>
                          <TableHead className="text-right">Equivalent Paddy (Qtl)</TableHead>
                          <TableHead className="text-right">Actions</TableHead>
                          </TableRow>
                      </TableHeader>
                      <TableBody>
                          {monetaryEntries.length === 0 && (
                              <TableRow><TableCell colSpan={6} className="text-center">No monetary entries recorded yet.</TableCell></TableRow>
                          )}
                          {monetaryEntries.map((item) => (
                          <TableRow key={item.id}>
                              <TableCell>{format(item.date, 'dd MMM yyyy')}</TableCell>
                              <TableCell className="font-medium">{item.mandiName}</TableCell>
                              <TableCell>₹{item.moneyReceived?.toLocaleString('en-IN', { maximumFractionDigits: 2 })}</TableCell>
                              <TableCell>₹{item.ratePerQuintal?.toLocaleString('en-IN', { maximumFractionDigits: 2 })}</TableCell>
                              <TableCell className="text-right font-medium">{item.totalPaddyReceived.toLocaleString('en-IN', { maximumFractionDigits: 2 })}</TableCell>
                              <TableCell className="text-right">
                                <Button variant="ghost" size="sm" onClick={() => handleEditClick(item)}>
                                  <Edit className="h-4 w-4" />
                                </Button>
                              </TableCell>
                          </TableRow>
                          ))}
                      </TableBody>
                      </Table>
                  </div>
              </div>
              )}
          </div>
        </CardContent>
      </Card>
      <Dialog open={isEditDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent>
            <DialogHeader>
                <DialogTitle>Edit {editingEntry?.entryType === 'monetary' ? 'Monetary' : 'Physical'} Lifting Entry</DialogTitle>
            </DialogHeader>
            {editingEntry?.entryType === 'monetary' ? (
                <Form {...monetaryForm}>
                    <form onSubmit={monetaryForm.handleSubmit(onMonetarySubmit)} className="space-y-4">
                        <FormField
                            control={monetaryForm.control}
                            name="mandiName"
                            render={({ field }) => (
                            <FormItem>
                                <FormLabel>Mandi Name</FormLabel>
                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl>
                                    <SelectTrigger><SelectValue placeholder="Select a mandi" /></SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                    {uniqueMandis.map((mandi) => ( <SelectItem key={mandi} value={mandi}>{mandi}</SelectItem> ))}
                                </SelectContent>
                                </Select>
                                <FormMessage />
                            </FormItem>
                            )}
                        />
                        <FormField control={monetaryForm.control} name="moneyReceived" render={({ field }) => (
                            <FormItem><FormLabel>Money Received (₹)</FormLabel><FormControl><Input type="number" step="0.01" {...field} /></FormControl><FormMessage /></FormItem>
                        )} />
                        <FormField control={monetaryForm.control} name="ratePerQuintal" render={({ field }) => (
                            <FormItem><FormLabel>Rate per Quintal (₹)</FormLabel><FormControl><Input type="number" step="0.01" {...field} /></FormControl><FormMessage /></FormItem>
                        )} />
                        <Button type="submit" className="w-full bg-accent hover:bg-accent/90">Save Changes</Button>
                    </form>
                </Form>
            ) : (
                <Form {...physicalForm}>
                    <form onSubmit={physicalForm.handleSubmit(onPhysicalSubmit)} className="space-y-4">
                        <FormField
                            control={physicalForm.control}
                            name="mandiName"
                            render={({ field }) => (
                                <FormItem>
                                <FormLabel>Mandi Name</FormLabel>
                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                    <FormControl>
                                    <SelectTrigger><SelectValue placeholder="Select a mandi" /></SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                    {uniqueMandis.map((mandi) => ( <SelectItem key={mandi} value={mandi}>{mandi}</SelectItem> ))}
                                    </SelectContent>
                                </Select>
                                <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField control={physicalForm.control} name="farmerName" render={({ field }) => (
                            <FormItem><FormLabel>Farmer Name</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                        )} />
                        <FormField control={physicalForm.control} name="totalPaddyReceived" render={({ field }) => (
                            <FormItem><FormLabel>Paddy Received (Qtl)</FormLabel><FormControl><Input type="number" step="0.01" {...field} /></FormControl><FormMessage /></FormItem>
                        )} />
                        <FormField control={physicalForm.control} name="mandiWeight" render={({ field }) => (
                            <FormItem><FormLabel>Mandi Weight (Qtl)</FormLabel><FormControl><Input type="number" step="0.01" {...field} /></FormControl><FormMessage /></FormItem>
                        )} />
                        <Button type="submit" className="w-full bg-accent hover:bg-accent/90">Save Changes</Button>
                    </form>
                </Form>
            )}
        </DialogContent>
      </Dialog>
    </>
  );
}
