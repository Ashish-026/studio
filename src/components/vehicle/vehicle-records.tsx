'use client';

import { useState, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useVehicleData } from '@/context/vehicle-context';
import { PlusCircle, ChevronDown, ChevronRight, Receipt, Car, MapPin, Building } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '../ui/collapsible';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';

const vehicleSchema = z.object({
  vehicleNumber: z.string().min(1, "Vehicle number is required"),
  driverName: z.string().min(1, "Driver's name is required"),
  ownerName: z.string().min(1, "Owner's name is required"),
  rentType: z.enum(['daily', 'monthly', 'per_trip']),
  rentAmount: z.coerce.number().min(0, 'Rent amount must be non-negative'),
}).refine(data => data.rentType === 'per_trip' || data.rentAmount > 0, {
  message: 'Rent amount must be positive for daily or monthly types.',
  path: ['rentAmount'],
});

const paymentFormSchema = z.object({
    amount: z.coerce.number().positive('Payment amount must be positive'),
});

const tripFormSchema = z.object({
  source: z.string().min(1, 'Source is required'),
  destination: z.string().min(1, 'Destination is required'),
  tripCharge: z.coerce.number().positive('Trip charge must be positive'),
});

export function VehicleRecords() {
  const { vehicles, addVehicle, addRentPayment, addTrip } = useVehicleData();
  const { toast } = useToast();
  const [showAddVehicleForm, setShowAddVehicleForm] = useState(false);
  const [openOwnerCollapsibles, setOpenOwnerCollapsibles] = useState<Record<string, boolean>>({});
  const [openVehicleCollapsibles, setOpenVehicleCollapsibles] = useState<Record<string, boolean>>({});
  const [isPaymentDialogOpen, setPaymentDialogOpen] = useState(false);
  const [selectedVehicle, setSelectedVehicle] = useState<string | null>(null);

  const vehicleForm = useForm<z.infer<typeof vehicleSchema>>({
    resolver: zodResolver(vehicleSchema),
    defaultValues: { vehicleNumber: '', driverName: '', ownerName: '', rentType: 'monthly', rentAmount: 0 },
  });

  const paymentForm = useForm<z.infer<typeof paymentFormSchema>>({
    resolver: zodResolver(paymentFormSchema),
    defaultValues: { amount: 0 },
  });
  
  const tripForm = useForm<z.infer<typeof tripFormSchema>>({
    resolver: zodResolver(tripFormSchema),
    defaultValues: { source: '', destination: '', tripCharge: 0 },
  });

  const rentType = vehicleForm.watch('rentType');
  
  const ownerAggregates = useMemo(() => {
    const owners: Record<string, { id: string, name: string, vehicles: any[] }> = {};
    vehicles.forEach(v => {
      if (!owners[v.ownerName]) {
        owners[v.ownerName] = { id: v.ownerName.replace(/\s+/g, '-').toLowerCase(), name: v.ownerName, vehicles: [] };
      }
      owners[v.ownerName].vehicles.push(v);
    });
    return Object.values(owners).sort((a,b) => a.name.localeCompare(b.name));
  }, [vehicles]);


  function onVehicleSubmit(values: z.infer<typeof vehicleSchema>) {
    addVehicle(values);
    toast({ title: 'Success!', description: `Vehicle ${values.vehicleNumber} has been added.` });
    vehicleForm.reset();
    setShowAddVehicleForm(false);
  }

  function onPaymentSubmit(values: z.infer<typeof paymentFormSchema>) {
    if (selectedVehicle) {
      addRentPayment(selectedVehicle, values.amount);
      toast({ title: 'Success!', description: 'Rent payment has been recorded.' });
      paymentForm.reset();
      setPaymentDialogOpen(false);
      setSelectedVehicle(null);
    }
  }

  function onTripSubmit(vehicleId: string, values: z.infer<typeof tripFormSchema>) {
    addTrip(vehicleId, values);
    toast({ title: 'Success!', description: 'Trip has been added.' });
    tripForm.reset();
  }

  const handlePaymentClick = (vehicleId: string) => {
    setSelectedVehicle(vehicleId);
    setPaymentDialogOpen(true);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', minimumFractionDigits: 2 }).format(amount);
  };

  const handleAddNewVehicleClick = (ownerName?: string) => {
    setShowAddVehicleForm(true);
    if(ownerName) {
      vehicleForm.setValue('ownerName', ownerName);
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex justify-between items-start">
            <div>
              <CardTitle>Vehicle Records</CardTitle>
              <CardDescription>View and manage vehicle and rent payment details grouped by owner.</CardDescription>
            </div>
            <Button onClick={() => handleAddNewVehicleClick()} size="sm">
              <PlusCircle className="mr-2 h-4 w-4" />
              {showAddVehicleForm ? 'Cancel' : 'Add Vehicle'}
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {showAddVehicleForm && (
            <Card className="bg-muted/50">
              <CardHeader><CardTitle>New Vehicle</CardTitle></CardHeader>
              <CardContent>
                <Form {...vehicleForm}>
                    <form onSubmit={vehicleForm.handleSubmit(onVehicleSubmit)} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 items-end">
                        <FormField control={vehicleForm.control} name="ownerName" render={({ field }) => (
                           <FormItem><FormLabel>Owner/Agency Name</FormLabel><FormControl><Input placeholder="e.g., Gupta Transports" {...field} /></FormControl><FormMessage /></FormItem>
                        )} />
                        <FormField control={vehicleForm.control} name="vehicleNumber" render={({ field }) => (
                            <FormItem><FormLabel>Vehicle Number</FormLabel><FormControl><Input placeholder="e.g., OD01AB1234" {...field} /></FormControl><FormMessage /></FormItem>
                        )} />
                        <FormField control={vehicleForm.control} name="driverName" render={({ field }) => (
                           <FormItem><FormLabel>Driver Name</FormLabel><FormControl><Input placeholder="e.g., Suresh Gupta" {...field} /></FormControl><FormMessage /></FormItem>
                        )} />
                         <FormField control={vehicleForm.control} name="rentType" render={({ field }) => (
                            <FormItem>
                                <FormLabel>Rent Type</FormLabel>
                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                    <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                                    <SelectContent>
                                        <SelectItem value="daily">Daily</SelectItem>
                                        <SelectItem value="monthly">Monthly</SelectItem>
                                        <SelectItem value="per_trip">Per Trip</SelectItem>
                                    </SelectContent>
                                </Select>
                                <FormMessage />
                            </FormItem>
                         )} />
                        {rentType !== 'per_trip' && (
                            <FormField control={vehicleForm.control} name="rentAmount" render={({ field }) => (
                            <FormItem><FormLabel>Rent Amount (₹)</FormLabel><FormControl><Input type="number" placeholder="30000" {...field} /></FormControl><FormMessage /></FormItem>
                            )} />
                        )}
                        <Button type="submit" className="w-full md:w-auto lg:col-span-full bg-accent hover:bg-accent/90">Add Vehicle</Button>
                    </form>
                </Form>
              </CardContent>
            </Card>
          )}

          <div>
            <h3 className="text-lg font-semibold mb-2">Vehicle Owner Accounts</h3>
            <div className="border rounded-lg">
                {ownerAggregates.map(owner => (
                    <Collapsible 
                        key={owner.id}
                        open={openOwnerCollapsibles[owner.id] || false}
                        onOpenChange={(isOpen) => setOpenOwnerCollapsibles(prev => ({...prev, [owner.id]: isOpen}))}
                        className="border-b last:border-b-0"
                    >
                        <CollapsibleTrigger className="w-full p-4 flex items-center justify-between hover:bg-muted/50 transition-colors">
                           <div className="flex items-center gap-2">
                                {openOwnerCollapsibles[owner.id] ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                                <Building className="h-5 w-5 text-muted-foreground" />
                                <span className="font-medium">{owner.name}</span>
                            </div>
                            <Button size="sm" variant="outline" onClick={(e) => { e.stopPropagation(); handleAddNewVehicleClick(owner.name)}}>
                                <PlusCircle className="mr-2 h-4 w-4" /> Add Vehicle
                            </Button>
                        </CollapsibleTrigger>
                        <CollapsibleContent className="bg-slate-50 dark:bg-slate-900/50">
                            <div className="p-4 space-y-4">
                                {owner.vehicles.sort((a,b) => a.vehicleNumber.localeCompare(b.vehicleNumber)).map(v => (
                                    <Collapsible 
                                        key={v.id}
                                        open={openVehicleCollapsibles[v.id] || false}
                                        onOpenChange={(isOpen) => setOpenVehicleCollapsibles(prev => ({...prev, [v.id]: isOpen}))}
                                        className="border rounded-lg"
                                    >
                                        <CollapsibleTrigger className="w-full p-4 flex items-center justify-between bg-card hover:bg-muted/50 transition-colors">
                                            <div className="flex items-center gap-3">
                                                {openVehicleCollapsibles[v.id] ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                                                <Car className="h-5 w-5 text-primary" />
                                                <div>
                                                    <div className="font-medium">{v.vehicleNumber}</div>
                                                    <div className="text-sm text-muted-foreground">{v.driverName}</div>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-4">
                                                <div className="text-right">
                                                    <div className="font-semibold text-destructive">{formatCurrency(v.balance)}</div>
                                                    <div className="text-xs text-muted-foreground">Balance</div>
                                                </div>
                                                <Button size="sm" variant="secondary" onClick={(e) => { e.stopPropagation(); handlePaymentClick(v.id); }}>
                                                    <Receipt className="mr-2 h-4 w-4" /> Pay
                                                </Button>
                                            </div>
                                        </CollapsibleTrigger>
                                        <CollapsibleContent className="p-4 space-y-6">
                                            <div>
                                                <h4 className="font-semibold mb-2 flex items-center gap-2"><Car className="h-4 w-4" /> Vehicle Details</h4>
                                                <div className="text-sm space-y-1">
                                                    <p><span className="font-medium">Rent Type:</span> <span className='capitalize'>{v.rentType.replace('_', ' ')}</span></p>
                                                    {v.rentType !== 'per_trip' && <p><span className="font-medium">Rent Amount:</span> {formatCurrency(v.rentAmount)}</p>}
                                                    <p><span className="font-medium">Total Rent Due:</span> {formatCurrency(v.totalRent)}</p>
                                                    <p><span className="font-medium">Total Paid:</span> {formatCurrency(v.totalPaid)}</p>
                                                </div>
                                            </div>
                                            
                                            {v.rentType === 'per_trip' && (
                                                <Card>
                                                    <CardHeader><CardTitle className="text-lg">Add New Trip</CardTitle></CardHeader>
                                                    <CardContent>
                                                        <Form {...tripForm}>
                                                            <form onSubmit={tripForm.handleSubmit((values) => onTripSubmit(v.id, values))} className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
                                                                <FormField control={tripForm.control} name="source" render={({ field }) => (
                                                                    <FormItem><FormLabel>Source</FormLabel><FormControl><Input placeholder="e.g., Bargarh" {...field} /></FormControl><FormMessage /></FormItem>
                                                                )} />
                                                                <FormField control={tripForm.control} name="destination" render={({ field }) => (
                                                                    <FormItem><FormLabel>Destination</FormLabel><FormControl><Input placeholder="e.g., Sambalpur" {...field} /></FormControl><FormMessage /></FormItem>
                                                                )} />
                                                                <FormField control={tripForm.control} name="tripCharge" render={({ field }) => (
                                                                    <FormItem><FormLabel>Trip Charge (₹)</FormLabel><FormControl><Input type="number" step="10" placeholder="2500" {...field} /></FormControl><FormMessage /></FormItem>
                                                                )} />
                                                                <Button type="submit" className="w-full md:w-auto md:col-span-full bg-accent hover:bg-accent/90">Add Trip</Button>
                                                            </form>
                                                        </Form>
                                                    </CardContent>
                                                </Card>
                                            )}

                                            {v.rentType === 'per_trip' && (
                                                <div>
                                                    <h4 className="font-semibold mb-2 flex items-center gap-2"><MapPin className="h-4 w-4" /> Trip History</h4>
                                                    {v.trips.length > 0 ? (
                                                    <Table>
                                                        <TableHeader><TableRow><TableHead>Date</TableHead><TableHead>Source</TableHead><TableHead>Destination</TableHead><TableHead className="text-right">Charge (₹)</TableHead></TableRow></TableHeader>
                                                        <TableBody>
                                                            {[...v.trips].sort((a: any, b: any) => b.date.getTime() - a.date.getTime()).map((t: any) => (
                                                                <TableRow key={t.id}>
                                                                    <TableCell>{format(t.date, 'dd MMM yyyy')}</TableCell>
                                                                    <TableCell>{t.source}</TableCell>
                                                                    <TableCell>{t.destination}</TableCell>
                                                                    <TableCell className="text-right">{formatCurrency(t.tripCharge)}</TableCell>
                                                                </TableRow>
                                                            ))}
                                                        </TableBody>
                                                    </Table>
                                                    ) : <p className="text-sm text-muted-foreground">No trips recorded.</p>}
                                                </div>
                                            )}

                                            <div>
                                                <h4 className="font-semibold mb-2 flex items-center gap-2"><Receipt className="h-4 w-4" /> Rent Payment History</h4>
                                                {v.payments.length > 0 ? (
                                                <Table>
                                                    <TableHeader><TableRow><TableHead>Date</TableHead><TableHead className="text-right">Amount Paid (₹)</TableHead></TableRow></TableHeader>
                                                    <TableBody>
                                                        {[...v.payments].sort((a: any,b: any) => b.date.getTime() - a.date.getTime()).map((p: any) => (
                                                            <TableRow key={p.id}>
                                                                <TableCell>{format(p.date, 'dd MMM yyyy, hh:mm a')}</TableCell>
                                                                <TableCell className="text-right">{formatCurrency(p.amount)}</TableCell>
                                                            </TableRow>
                                                        ))}
                                                    </TableBody>
                                                </Table>
                                                ) : <p className="text-sm text-muted-foreground">No rent payments recorded.</p>}
                                            </div>
                                        </CollapsibleContent>
                                    </Collapsible>
                                ))}
                            </div>
                        </CollapsibleContent>
                    </Collapsible>
                ))}
                {ownerAggregates.length === 0 && (
                    <div className="p-4 text-center text-muted-foreground">No vehicle records found. Add one to get started.</div>
                )}
            </div>
          </div>
        </CardContent>
      </Card>
      
      <Dialog open={isPaymentDialogOpen} onOpenChange={setPaymentDialogOpen}>
          <DialogContent>
              <DialogHeader>
                  <DialogTitle>Record Rent Payment</DialogTitle>
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
    </>
  );
}
