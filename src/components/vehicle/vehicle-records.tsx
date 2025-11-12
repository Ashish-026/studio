'use client';

import React, { useState, useMemo, useEffect, forwardRef } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useVehicleData } from '@/context/vehicle-context';
import { ChevronDown, ChevronRight, Receipt, Car, MapPin, Building, Edit, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '../ui/collapsible';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog';
import type { Vehicle, VehicleTrip } from '@/lib/types';
import { downloadPdf } from '@/lib/pdf-utils';
import { Separator } from '../ui/separator';

const paymentFormSchema = z.object({
    amount: z.coerce.number().positive('Payment amount must be positive'),
});

const tripFormSchema = z.object({
    tripCharge: z.coerce.number().positive('Trip charge must be a positive number'),
});

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', minimumFractionDigits: 2 }).format(amount);
};

const OwnerVehicleDetails = forwardRef<HTMLDivElement, { owner: { id: string, name: string, vehicles: Vehicle[] } }>(({ owner }, ref) => {
  const ownerTotalBalance = owner.vehicles.reduce((acc, v) => acc + v.balance, 0);

  return (
    <div ref={ref} className="p-4 bg-white">
      <h3 className="text-xl font-bold mb-2">Statement for {owner.name}</h3>
      <p className="text-lg mb-4">Total Outstanding Balance: <span className="font-bold">{formatCurrency(ownerTotalBalance)}</span></p>
      <Separator className="my-4" />
      {owner.vehicles.map((v) => (
        <div key={v.id} className="mb-8">
            <h4 className="text-lg font-semibold mb-2">Vehicle: {v.vehicleNumber} ({v.driverName})</h4>
            <div className="grid grid-cols-3 gap-4 mb-4 text-sm">
                <div className="border p-2 rounded-md"><span className="font-semibold">Total Rent:</span> {formatCurrency(v.totalRent)}</div>
                <div className="border p-2 rounded-md"><span className="font-semibold">Total Paid:</span> {formatCurrency(v.totalPaid)}</div>
                <div className="border p-2 rounded-md"><span className="font-semibold">Balance:</span> {formatCurrency(v.balance)}</div>
            </div>

            {v.rentType === 'per_trip' && v.trips.length > 0 && (
                <div>
                    <h5 className="font-semibold text-md mt-4 mb-2">Trip History</h5>
                    <Table>
                        <TableHeader><TableRow><TableHead>Date</TableHead><TableHead>Source</TableHead><TableHead>Destination</TableHead><TableHead>Qty (Qtl)</TableHead><TableHead className="text-right">Charge (₹)</TableHead></TableRow></TableHeader>
                        <TableBody>
                            {[...v.trips].sort((a, b) => b.date.getTime() - a.date.getTime()).map(t => (
                                <TableRow key={t.id}>
                                    <TableCell>{format(t.date, 'dd MMM yyyy')}</TableCell>
                                    <TableCell>{t.source}</TableCell>
                                    <TableCell>{t.destination}</TableCell>
                                    <TableCell>{t.quantity.toLocaleString('en-IN')}</TableCell>
                                    <TableCell className="text-right">{formatCurrency(t.tripCharge)}</TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>
            )}

            {v.payments.length > 0 && (
                 <div>
                    <h5 className="font-semibold text-md mt-4 mb-2">Rent Payment History</h5>
                    <Table>
                        <TableHeader><TableRow><TableHead>Date</TableHead><TableHead className="text-right">Amount (₹)</TableHead></TableRow></TableHeader>
                        <TableBody>
                            {[...v.payments].sort((a, b) => b.date.getTime() - a.date.getTime()).map(p => (
                                <TableRow key={p.id}>
                                    <TableCell>{format(p.date, 'dd MMM yyyy, hh:mm a')}</TableCell>
                                    <TableCell className="text-right">{formatCurrency(p.amount)}</TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>
            )}
            <Separator className="mt-6"/>
        </div>
      ))}
    </div>
  );
});
OwnerVehicleDetails.displayName = 'OwnerVehicleDetails';

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
    const owners: Record<string, { id: string, name: string, vehicles: Vehicle[] }> = {};
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

  const handleDownload = (e: React.MouseEvent, ownerId: string, ownerName: string) => {
    e.stopPropagation();
    downloadPdf(`printable-owner-record-${ownerId}`, `vehicle-summary-${ownerName.toLowerCase().replace(/\s+/g, '-')}`);
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
                {ownerAggregates.length === 0 ? (
                    <div className="p-4 text-center text-muted-foreground">Vehicle data from other registers will appear here.</div>
                ) : ownerAggregates.map(owner => (
                    <div key={owner.id} className="border-b last:border-b-0">
                        <div className="absolute -left-[9999px] top-auto" aria-hidden="true">
                            <div id={`printable-owner-record-${owner.id}`}>
                                <OwnerVehicleDetails owner={owner} />
                            </div>
                        </div>
                        <Collapsible 
                            open={openOwnerCollapsibles[owner.id] || false}
                            onOpenChange={(isOpen) => setOpenOwnerCollapsibles(prev => ({...prev, [owner.id]: isOpen}))}
                        >
                            <div className="flex flex-col md:flex-row w-full p-4 items-start md:items-center justify-between hover:bg-muted/50 transition-colors gap-4">
                            <CollapsibleTrigger className="flex items-center gap-3 flex-grow cursor-pointer text-left">
                                {openOwnerCollapsibles[owner.id] ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                                <Building className="h-5 w-5 text-muted-foreground" />
                                <span className="font-medium">{owner.name}</span>
                            </CollapsibleTrigger>
                            <div className="flex items-center gap-2 self-end md:self-center ml-auto pl-8 md:pl-0">
                                <Button size="sm" variant="outline" onClick={(e) => handleDownload(e, owner.id, owner.name)}>
                                    <Download className="mr-2 h-4 w-4" /> PDF
                                </Button>
                            </div>
                            </div>
                            <CollapsibleContent className="bg-slate-50 dark:bg-slate-900/50">
                                <div className="p-4 space-y-4">
                                    {owner.vehicles.sort((a,b) => a.vehicleNumber.localeCompare(b.vehicleNumber)).map(v => (
                                        <Collapsible 
                                            key={v.id}
                                            open={openVehicleCollapsibles[v.id] || false}
                                            onOpenChange={(isOpen) => setOpenVehicleCollapsibles(prev => ({...prev, [v.id]: isOpen}))}
                                            className="border rounded-lg"
                                        >
                                            <div className="w-full p-4 flex flex-col md:flex-row items-start md:items-center justify-between bg-card hover:bg-muted/50 transition-colors gap-4">
                                            <CollapsibleTrigger className="flex items-center gap-3 flex-grow cursor-pointer text-left">
                                                {openVehicleCollapsibles[v.id] ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                                                <Car className="h-5 w-5 text-primary" />
                                                <div>
                                                    <div className="font-medium">{v.vehicleNumber}</div>
                                                    <div className="text-sm text-muted-foreground">{v.driverName}</div>
                                                </div>
                                            </CollapsibleTrigger>
                                            <div className="flex items-center gap-4 self-end md:self-center ml-auto pl-8 md:pl-0">
                                                <div className="text-right">
                                                    <div className={`font-semibold ${v.balance > 0 ? 'text-destructive' : ''}`}>{formatCurrency(v.balance)}</div>
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
                                                                {[...v.trips].sort((a, b) => b.date.getTime() - a.date.getTime()).map((t) => (
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
                                                            {[...v.payments].sort((a,b) => b.date.getTime() - a.date.getTime()).map(p => (
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
                    </div>
                ))}
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
