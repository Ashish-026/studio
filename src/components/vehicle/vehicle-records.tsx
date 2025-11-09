'use client';

import { useState, useMemo, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useVehicleData } from '@/context/vehicle-context';
import { ChevronDown, ChevronRight, Receipt, Car, MapPin, Building, Edit } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '../ui/collapsible';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog';
import type { VehicleTrip } from '@/lib/types';

const paymentFormSchema = z.object({
    amount: z.coerce.number().positive('Payment amount must be positive'),
});

const tripFormSchema = z.object({
    tripCharge: z.coerce.number().positive('Trip charge must be a positive number'),
});

export function VehicleRecords() {
  const { vehicles, addRentPayment, updateTrip } = useVehicleData();
  const { toast } = useToast();
  const [openOwnerCollapsibles, setOpenOwnerCollapsibles] = useState<Record<string, boolean>>({});
  const [openVehicleCollapsibles, setOpenVehicleCollapsibles] = useState<Record<string, boolean>>({});
  const [isPaymentDialogOpen, setPaymentDialogOpen] = useState(false);
  const [isTripDialogOpen, setTripDialogOpen] = useState(false);
  const [selectedVehicle, setSelectedVehicle] = useState<string | null>(null);
  const [selectedTrip, setSelectedTrip] = useState<VehicleTrip | null>(null);

  const paymentForm = useForm<z.infer<typeof paymentFormSchema>>({
    resolver: zodResolver(paymentFormSchema),
    defaultValues: { amount: 0 },
  });

  const tripForm = useForm<z.infer<typeof tripFormSchema>>({
    resolver: zodResolver(tripFormSchema),
  });

  useEffect(() => {
    if (selectedTrip) {
      tripForm.reset({ tripCharge: selectedTrip.tripCharge });
    }
  }, [selectedTrip, tripForm]);

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


  function onPaymentSubmit(values: z.infer<typeof paymentFormSchema>) {
    if (selectedVehicle) {
      addRentPayment(selectedVehicle, values.amount);
      toast({ title: 'Success!', description: 'Rent payment has been recorded.' });
      paymentForm.reset();
      setPaymentDialogOpen(false);
      setSelectedVehicle(null);
    }
  }

  function onTripSubmit(values: z.infer<typeof tripFormSchema>) {
    if (selectedVehicle && selectedTrip) {
        updateTrip(selectedVehicle, selectedTrip.id, { ...selectedTrip, ...values });
        toast({ title: 'Success!', description: 'Trip charge has been updated.' });
        tripForm.reset();
        setTripDialogOpen(false);
        setSelectedVehicle(null);
        setSelectedTrip(null);
    }
  }

  const handlePaymentClick = (e: React.MouseEvent, vehicleId: string) => {
    e.stopPropagation();
    setSelectedVehicle(vehicleId);
    setPaymentDialogOpen(true);
  };
  
  const handleTripEditClick = (e: React.MouseEvent, vehicleId: string, trip: VehicleTrip) => {
    e.stopPropagation();
    setSelectedVehicle(vehicleId);
    setSelectedTrip(trip);
    setTripDialogOpen(true);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', minimumFractionDigits: 2 }).format(amount);
  };

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex justify-between items-start">
            <div>
              <CardTitle>Vehicle Records</CardTitle>
              <CardDescription>View and manage vehicle rent payment details grouped by owner.</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
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
                                        <div className="w-full p-4 flex items-center justify-between bg-card hover:bg-muted/50 transition-colors">
                                            <CollapsibleTrigger asChild>
                                                <div className="flex items-center gap-3 flex-grow cursor-pointer">
                                                    {openVehicleCollapsibles[v.id] ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                                                    <Car className="h-5 w-5 text-primary" />
                                                    <div>
                                                        <div className="font-medium">{v.vehicleNumber}</div>
                                                        <div className="text-sm text-muted-foreground">{v.driverName}</div>
                                                    </div>
                                                </div>
                                            </CollapsibleTrigger>
                                            <div className="flex items-center gap-4">
                                                <div className="text-right">
                                                    <div className="font-semibold text-destructive">{formatCurrency(v.balance)}</div>
                                                    <div className="text-xs text-muted-foreground">Balance</div>
                                                </div>
                                                <Button size="sm" variant="secondary" onClick={(e) => handlePaymentClick(e, v.id)}>
                                                    <Receipt className="mr-2 h-4 w-4" /> Pay
                                                </Button>
                                            </div>
                                        </div>
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
                                                <div>
                                                    <h4 className="font-semibold mb-2 flex items-center gap-2"><MapPin className="h-4 w-4" /> Trip History</h4>
                                                    {v.trips.length > 0 ? (
                                                    <Table>
                                                        <TableHeader><TableRow><TableHead>Date</TableHead><TableHead>Source</TableHead><TableHead>Destination</TableHead><TableHead>Quantity (Qtl)</TableHead><TableHead className="text-right">Charge (₹)</TableHead><TableHead className="text-right">Actions</TableHead></TableRow></TableHeader>
                                                        <TableBody>
                                                            {[...v.trips].sort((a: any, b: any) => b.date.getTime() - a.date.getTime()).map((t: any) => (
                                                                <TableRow key={t.id}>
                                                                    <TableCell>{format(t.date, 'dd MMM yyyy')}</TableCell>
                                                                    <TableCell>{t.source}</TableCell>
                                                                    <TableCell>{t.destination}</TableCell>
                                                                    <TableCell>{t.quantity.toLocaleString('en-IN')}</TableCell>
                                                                    <TableCell className="text-right">{formatCurrency(t.tripCharge)}</TableCell>
                                                                    <TableCell className="text-right">
                                                                        <Button variant="ghost" size="icon" onClick={(e) => handleTripEditClick(e, v.id, t)}>
                                                                            <Edit className="h-4 w-4" />
                                                                        </Button>
                                                                    </TableCell>
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
                    <div className="p-4 text-center text-muted-foreground">Vehicle data from other registers will appear here.</div>
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

      <Dialog open={isTripDialogOpen} onOpenChange={setTripDialogOpen}>
          <DialogContent>
              <DialogHeader>
                  <DialogTitle>Edit Trip Charge</DialogTitle>
              </DialogHeader>
              <Form {...tripForm}>
                  <form onSubmit={tripForm.handleSubmit(onTripSubmit)} className="space-y-4">
                      <FormField control={tripForm.control} name="tripCharge" render={({ field }) => (
                          <FormItem><FormLabel>Trip Charge (₹)</FormLabel><FormControl><Input type="number" step="0.01" placeholder="Enter new charge" {...field} /></FormControl><FormMessage /></FormItem>
                      )} />
                      <Button type="submit" className="w-full bg-accent hover:bg-accent/90">Save Changes</Button>
                  </form>
              </Form>
          </DialogContent>
      </Dialog>
    </>
  );
}
