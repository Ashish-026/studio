'use client';

import { useState, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useMandiData } from '@/context/mandi-context';
import { useVehicleData } from '@/context/vehicle-context';
import { useLabourData } from '@/context/labour-context';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { format } from 'date-fns';
import { PlusCircle, Calendar as CalendarIcon, Car, Users } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover';
import { Calendar } from '../ui/calendar';
import { cn } from '@/lib/utils';
import { Textarea } from '../ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Separator } from '../ui/separator';

const supplySchema = z.object({
    date: z.date({ required_error: 'A date is required.' }),
    lotNumber: z.string().min(1, 'Lot number is required'),
    godownDetails: z.string().min(1, 'Godown details are required'),
    quantity: z.coerce.number().positive('Quantity must be positive'),
    vehicleType: z.enum(['own', 'hired'], { required_error: 'Vehicle type is required' }),
    vehicleNumber: z.string().optional(),
    driverName: z.string().optional(),
    ownerName: z.string().optional(),
    tripCharge: z.coerce.number().optional(),
    source: z.string().optional(),
    destination: z.string().optional(),
    labourerId: z.string().optional(),
    labourCharge: z.coerce.number().optional(),
}).refine(data => {
    if (data.vehicleType === 'hired') {
        return !!data.vehicleNumber && !!data.driverName && !!data.ownerName && data.tripCharge !== undefined && data.tripCharge > 0;
    }
    return true;
}, {
    message: "Vehicle number, driver, owner, and a positive trip charge are required for hired vehicles.",
    path: ['tripCharge'],
});

export function MandiSupply() {
  const { availableRiceForSupply, stockReleases, addStockRelease } = useMandiData();
  const { addVehicle, addTrip } = useVehicleData();
  const { labourers, addWorkEntry } = useLabourData();
  const { toast } = useToast();
  const [showForm, setShowForm] = useState(false);

  const supplyForm = useForm<z.infer<typeof supplySchema>>({
    resolver: zodResolver(supplySchema),
    defaultValues: { lotNumber: '', godownDetails: '', vehicleType: 'own', source: 'Mill' },
  });

  const vehicleType = supplyForm.watch('vehicleType');
  const godownDetailsValue = supplyForm.watch('godownDetails');
  
  useMemo(() => {
    if (godownDetailsValue) {
      supplyForm.setValue('destination', godownDetailsValue);
    }
  }, [godownDetailsValue, supplyForm]);

  const formatNumber = (num: number) => new Intl.NumberFormat('en-IN', { maximumFractionDigits: 2 }).format(num);

  function onSupplySubmit(values: z.infer<typeof supplySchema>) {
    if(values.quantity > availableRiceForSupply) {
        supplyForm.setError('quantity', { message: `Exceeds available rice stock of ${formatNumber(availableRiceForSupply)} Qtl` });
        return;
    }
    
    addStockRelease(values);
    toast({ title: 'Success!', description: 'Rice supply has been recorded.' });

    if (values.vehicleType === 'hired' && values.vehicleNumber && values.tripCharge) {
        const vehicleId = addVehicle({
            vehicleNumber: values.vehicleNumber,
            driverName: values.driverName || '',
            ownerName: values.ownerName || '',
            rentType: 'per_trip',
            rentAmount: 0,
        });

        if (vehicleId) {
            addTrip(vehicleId, {
                source: values.source || 'Mill', 
                destination: values.destination || values.godownDetails,
                quantity: values.quantity,
                tripCharge: values.tripCharge,
            });
            toast({ title: 'Vehicle Updated', description: `Trip for ${values.vehicleNumber} has been added to Vehicle Register.` });
        }
    }
    
    if (values.labourerId && values.labourCharge) {
        addWorkEntry(values.labourerId, {
            description: `Rice supply to ${values.godownDetails}`,
            entryType: 'item_rate',
            itemName: 'Rice supplied',
            quantity: values.quantity,
            ratePerItem: values.labourCharge / values.quantity,
        });
        toast({ title: 'Labour Updated', description: 'Work entry added to Labour Register.' });
    }

    supplyForm.reset();
    setShowForm(false);
  }

  return (
    <Card>
        <CardHeader>
          <div className="flex justify-between items-start">
            <div>
              <CardTitle>Rice Supply</CardTitle>
              <CardDescription>Record rice released for supply from processed stock.</CardDescription>
            </div>
            <Button onClick={() => setShowForm(!showForm)} size="sm">
              <PlusCircle className="mr-2 h-4 w-4" />
              {showForm ? 'Cancel' : 'Add Supply Entry'}
            </Button>
          </div>
           <div className="pt-2">
            <p className="text-sm font-medium">
                Available Rice for Supply: 
                <span className="text-primary font-bold"> {formatNumber(availableRiceForSupply)} Qtl</span>
            </p>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
        {showForm && (
            <Card className="bg-muted/50">
              <CardHeader>
                <CardTitle>New Supply Entry</CardTitle>
                <CardDescription>Release rice stock for supply.</CardDescription>
              </CardHeader>
              <CardContent>
                <Form {...supplyForm}>
                  <form onSubmit={supplyForm.handleSubmit(onSupplySubmit)} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 items-start">
                        <FormField control={supplyForm.control} name="date" render={({ field }) => (
                            <FormItem className="flex flex-col"><FormLabel>Supply Date</FormLabel><Popover><PopoverTrigger asChild><FormControl>
                                <Button variant={"outline"} className={cn("pl-3 text-left font-normal", !field.value && "text-muted-foreground")}>
                                    {field.value ? format(field.value, "PPP") : <span>Pick a date</span>}
                                    <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                </Button>
                            </FormControl></PopoverTrigger><PopoverContent className="w-auto p-0" align="start">
                                <Calendar mode="single" selected={field.value} onSelect={field.onChange} initialFocus />
                            </PopoverContent></Popover><FormMessage /></FormItem>
                        )} />
                        <FormField control={supplyForm.control} name="lotNumber" render={({ field }) => (
                            <FormItem><FormLabel>Lot Number</FormLabel><FormControl><Input placeholder="e.g., LOT-001" {...field} /></FormControl><FormMessage /></FormItem>
                        )} />
                         <FormField control={supplyForm.control} name="quantity" render={({ field }) => (
                            <FormItem><FormLabel>Quantity (Qtl)</FormLabel><FormControl><Input type="number" step="0.01" {...field} /></FormControl><FormMessage /></FormItem>
                        )} />
                    </div>
                     <FormField control={supplyForm.control} name="godownDetails" render={({ field }) => (
                        <FormItem><FormLabel>Godown Details</FormLabel><FormControl><Textarea placeholder="e.g., Central Godown, Bay 4" {...field} /></FormControl><FormMessage /></FormItem>
                    )} />

                    <Separator />

                    <div>
                        <h3 className="text-md font-medium mb-4 flex items-center gap-2"><Car className="h-5 w-5" /> Vehicle Details</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 items-start">
                           <FormField
                                control={supplyForm.control}
                                name="vehicleType"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Vehicle Type</FormLabel>
                                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                                            <FormControl><SelectTrigger><SelectValue/></SelectTrigger></FormControl>
                                            <SelectContent>
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
                                <FormField control={supplyForm.control} name="vehicleNumber" render={({ field }) => (
                                    <FormItem><FormLabel>Vehicle Number</FormLabel><FormControl><Input placeholder="OD01AB1234" {...field} /></FormControl><FormMessage /></FormItem>
                                )} />
                                 <FormField control={supplyForm.control} name="driverName" render={({ field }) => (
                                    <FormItem><FormLabel>Driver Name</FormLabel><FormControl><Input placeholder="Suresh" {...field} /></FormControl><FormMessage /></FormItem>
                                )} />
                                <FormField control={supplyForm.control} name="ownerName" render={({ field }) => (
                                    <FormItem><FormLabel>Owner/Agency</FormLabel><FormControl><Input placeholder="Gupta Transports" {...field} /></FormControl><FormMessage /></FormItem>
                                )} />
                                <FormField control={supplyForm.control} name="tripCharge" render={({ field }) => (
                                    <FormItem><FormLabel>Trip Charge (₹)</FormLabel><FormControl><Input type="number" step="10" placeholder="2500" {...field} /></FormControl><FormMessage /></FormItem>
                                )} />
                                <FormField control={supplyForm.control} name="source" render={({ field }) => (
                                    <FormItem><FormLabel>Source</FormLabel><FormControl><Input placeholder="Source location" {...field} /></FormControl><FormMessage /></FormItem>
                                )} />
                                <FormField control={supplyForm.control} name="destination" render={({ field }) => (
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
                            <FormField
                                control={supplyForm.control}
                                name="labourerId"
                                render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Assign Labourer (Optional)</FormLabel>
                                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                                    <FormControl><SelectTrigger><SelectValue placeholder="Select a labourer" /></SelectTrigger></FormControl>
                                    <SelectContent>
                                        <SelectItem value="">None</SelectItem>
                                        {labourers.map((l) => (
                                        <SelectItem key={l.id} value={l.id}>{l.name}</SelectItem>
                                        ))}
                                    </SelectContent>
                                    </Select>
                                    <FormMessage />
                                </FormItem>
                                )}
                            />
                            <FormField control={supplyForm.control} name="labourCharge" render={({ field }) => (
                                <FormItem><FormLabel>Total Labour Charge (₹)</FormLabel><FormControl><Input type="number" step="10" placeholder="e.g., 600" {...field} /></FormControl><FormMessage /></FormItem>
                            )} />
                        </div>
                    </div>


                    <Button type="submit" className="w-full md:w-auto bg-accent hover:bg-accent/90">Record Supply</Button>
                  </form>
                </Form>
              </CardContent>
            </Card>
        )}
        
        <div>
            <h3 className="text-lg font-semibold mb-2">Supply History</h3>
             <div className="border rounded-lg">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Date</TableHead>
                            <TableHead>Lot Number</TableHead>
                            <TableHead>Godown Details</TableHead>
                            <TableHead>Vehicle</TableHead>
                            <TableHead className="text-right">Quantity (Qtl)</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {stockReleases.length === 0 ? (
                            <TableRow><TableCell colSpan={5} className="text-center h-24">No supply history.</TableCell></TableRow>
                        ) : (
                            [...stockReleases].sort((a, b) => b.date.getTime() - a.date.getTime()).map(s => (
                                <TableRow key={s.id}>
                                    <TableCell>{format(s.date, 'dd MMM yyyy')}</TableCell>
                                    <TableCell>{s.lotNumber}</TableCell>
                                    <TableCell>{s.godownDetails}</TableCell>
                                    <TableCell>
                                        {s.vehicleNumber ? (
                                            <div className="flex flex-col">
                                                <span className="font-medium">{s.vehicleNumber}</span>
                                                <span className="text-xs capitalize text-muted-foreground">{s.vehicleType} Vehicle</span>
                                            </div>
                                        ) : (
                                            <span className="capitalize">{s.vehicleType} Vehicle</span>
                                        )}
                                    </TableCell>
                                    <TableCell className="text-right font-medium">{formatNumber(s.quantity)}</TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>
        </div>
      </CardContent>
    </Card>
  );
}
