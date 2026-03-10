'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useStockData } from '@/context/stock-context';
import { useVehicleData } from '@/context/vehicle-context';
import { useLabourData } from '@/context/labour-context';
import { PlusCircle, ChevronDown, ChevronRight, Download, Car, Users, User as UserIcon, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { format } from 'date-fns';

const labourDetailsSchema = z.object({
  numberOfLabours: z.coerce.number().min(0).default(0),
  labourerIds: z.array(z.object({ value: z.string().min(1, "Please select a labourer.") })).default([]),
  labourWageType: z.enum(['per_item', 'total_amount']).default('total_amount'),
  labourCharge: z.coerce.number().min(0).default(0),
});

const saleFormSchema = z.object({
  source: z.enum(['private'], { required_error: 'Stock source is required' }),
  customerName: z.string().min(1, 'Customer name is required'),
  itemType: z.enum(['paddy', 'rice']),
  quantity: z.coerce.number().positive('Quantity must be positive'),
  rate: z.coerce.number().positive('Rate must be positive'),
  initialPayment: z.coerce.number().min(0, 'Initial payment cannot be negative').default(0),
  description: z.string().optional(),
  vehicleType: z.enum(['customer', 'own', 'hired'], { required_error: 'Vehicle type is required' }),
  vehicleNumber: z.string().optional(),
  driverName: z.string().optional(),
  ownerName: z.string().optional(),
  tripCharge: z.coerce.number().optional(),
  sourceLocation: z.string().optional(),
  destination: z.string().optional(),
}).merge(labourDetailsSchema).refine(data => {
    if (data.vehicleType === 'hired') {
        return !!data.vehicleNumber && !!data.driverName && !!data.ownerName && data.tripCharge !== undefined && data.tripCharge > 0;
    }
    return true;
}, {
    message: "Hired vehicle details are incomplete.",
    path: ['tripCharge'],
});

export function PrivateSales() {
  const { sales, addSale, deleteSale, privateStock } = useStockData();
  const { addVehicle, addTrip } = useVehicleData();
  const { labourers, addGroupWorkEntry } = useLabourData();
  const { toast } = useToast();
  const [showForm, setShowForm] = useState(false);
  const [openCustomerCollapsibles, setOpenCustomerCollapsibles] = useState<Record<string, boolean>>({});

  const saleForm = useForm<z.infer<typeof saleFormSchema>>({
    resolver: zodResolver(saleFormSchema),
    defaultValues: {
      source: 'private', customerName: '', itemType: 'rice', quantity: 0, rate: 0, initialPayment: 0,
      description: '', vehicleType: 'customer', sourceLocation: 'Mill', vehicleNumber: '',
      driverName: '', ownerName: '', tripCharge: 0, destination: '',
      numberOfLabours: 0, labourerIds: [], labourCharge: 0, labourWageType: 'total_amount',
    },
  });

  const { fields, replace } = useFieldArray({ control: saleForm.control, name: "labourerIds" });
  const numberOfLabours = saleForm.watch('numberOfLabours');

  // Hardened worker selection logic using 'replace' to prevent loops
  useEffect(() => {
    const targetCount = Math.max(0, parseInt(String(numberOfLabours || 0)));
    if (fields.length === targetCount) return;

    const currentValues = saleForm.getValues('labourerIds') || [];
    const nextFields = Array.from({ length: targetCount }, (_, i) => currentValues[i] || { value: '' });
    replace(nextFields);
  }, [numberOfLabours, replace, saleForm]);

  const customerAggregates = useMemo(() => {
    const customers: Record<string, { id: string, name: string, sales: any[], totalBalance: number }> = {};
    (sales || []).forEach(s => {
      if (!customers[s.customerName]) {
        customers[s.customerName] = { id: s.customerName.replace(/\s+/g, '-').toLowerCase(), name: s.customerName, sales: [], totalBalance: 0 };
      }
      customers[s.customerName].sales.push(s);
    });
    Object.values(customers).forEach(c => c.totalBalance = c.sales.reduce((acc, s) => acc + s.balance, 0));
    return Object.values(customers).sort((a,b) => a.name.localeCompare(b.name));
  }, [sales]);

  function onSaleSubmit(values: z.infer<typeof saleFormSchema>) {
    const stockAvailable = values.itemType === 'paddy' ? privateStock.paddy : privateStock.rice;
    if (values.quantity > stockAvailable) {
        saleForm.setError('quantity', { message: `Only ${stockAvailable.toFixed(2)} Qtl available.` });
        return;
    }
    const labourerIds = values.labourerIds.map(l => l.value).filter(Boolean);
    addSale({ ...values, labourerIds });
    toast({ title: 'Success!', description: 'Sale recorded.' });

    if (values.vehicleType === 'hired' && values.vehicleNumber && values.tripCharge) {
        const vId = addVehicle({ vehicleNumber: values.vehicleNumber, driverName: values.driverName || '', ownerName: values.ownerName || '', rentType: 'per_trip', rentAmount: 0 });
        if (vId) addTrip(vId, { source: values.sourceLocation || 'Mill', destination: values.destination || values.customerName, quantity: values.quantity, tripCharge: values.tripCharge });
    }
    if (labourerIds.length > 0 && values.labourCharge > 0) addGroupWorkEntry(labourerIds, values.labourCharge, `Sale: ${values.customerName}`, values.quantity);
    
    saleForm.reset({
        customerName: '', itemType: 'rice', quantity: 0, rate: 0, initialPayment: 0,
        description: '', vehicleType: 'customer', sourceLocation: 'Mill', vehicleNumber: '',
        driverName: '', ownerName: '', tripCharge: 0, destination: '',
        numberOfLabours: 0, labourerIds: [], labourCharge: 0, labourWageType: 'total_amount',
    });
    setShowForm(false);
  }

  const handleDelete = (id: string) => {
    deleteSale(id);
    toast({ title: 'Deleted', description: 'Sale record removed.' });
  };

  const handleInputFocus = (e: React.FocusEvent<HTMLInputElement>) => { e.target.select(); };

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-start">
          <div><CardTitle>Private Sales</CardTitle><CardDescription>Fresh entries with Delete option enabled.</CardDescription></div>
          <Button onClick={() => setShowForm(!showForm)} size="sm"><PlusCircle className="mr-2 h-4 w-4" />{showForm ? 'Cancel' : 'New Sale'}</Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {showForm && (
          <Card className="bg-muted/50">
            <CardHeader><CardTitle>New Sale</CardTitle></CardHeader>
            <CardContent>
              <Form {...saleForm}><form onSubmit={saleForm.handleSubmit(onSaleSubmit)} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 items-start">
                    <FormField control={saleForm.control} name="customerName" render={({ field }) => (
                      <FormItem><FormLabel>Customer</FormLabel><FormControl><Input placeholder="Full Name" {...field} /></FormControl></FormItem>
                    )} />
                    <FormField control={saleForm.control} name="quantity" render={({ field }) => (
                      <FormItem><FormLabel>Quantity (Qtl)</FormLabel><FormControl><Input type="number" step="0.01" {...field} onFocus={handleInputFocus} /></FormControl></FormItem>
                    )} />
                    <FormField control={saleForm.control} name="rate" render={({ field }) => (
                      <FormItem><FormLabel>Rate (₹/Qtl)</FormLabel><FormControl><Input type="number" step="0.01" {...field} onFocus={handleInputFocus} /></FormControl></FormItem>
                    )} />
                    <FormField control={saleForm.control} name="initialPayment" render={({ field }) => (
                      <FormItem><FormLabel>Paid (₹)</FormLabel><FormControl><Input type="number" step="0.01" {...field} onFocus={handleInputFocus} /></FormControl></FormItem>
                    )} />
                  </div>
                  <Button type="submit" className="w-full bg-primary text-white">Save Sale</Button>
              </form></Form>
            </CardContent>
          </Card>
        )}

        <div className="border rounded-lg">
            {customerAggregates.map(customer => (
                <Collapsible key={customer.id} open={openCustomerCollapsibles[customer.id]} onOpenChange={(o) => setOpenCustomerCollapsibles(p => ({...p, [customer.id]: o}))} className="border-b last:border-b-0">
                    <div className="flex w-full p-4 items-center justify-between hover:bg-muted/50 transition-colors">
                        <CollapsibleTrigger className="flex items-center gap-3 flex-grow text-left">
                            {openCustomerCollapsibles[customer.id] ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                            <UserIcon className="h-5 w-5 text-muted-foreground" />
                            <div><span className="font-bold">{customer.name}</span><p className="text-xs opacity-60">Bal: {new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(customer.totalBalance)}</p></div>
                        </CollapsibleTrigger>
                    </div>
                    <CollapsibleContent className="p-4 bg-slate-50">
                        <Table>
                            <TableHeader><TableRow><TableHead>Date</TableHead><TableHead>Qty</TableHead><TableHead className="text-right">Total</TableHead><TableHead className="text-right">Actions</TableHead></TableRow></TableHeader>
                            <TableBody>
                                {customer.sales.map(s => (
                                    <TableRow key={s.id}>
                                        <TableCell>{format(s.date, 'dd MMM yy')}</TableCell>
                                        <TableCell>{s.quantity.toFixed(2)} Qtl</TableCell>
                                        <TableCell className="text-right font-bold">{new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(s.totalAmount)}</TableCell>
                                        <TableCell className="text-right"><Button variant="ghost" size="icon" onClick={() => handleDelete(s.id)} className="text-destructive"><Trash2 className="h-4 w-4" /></Button></TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </CollapsibleContent>
                </Collapsible>
            ))}
        </div>
      </CardContent>
    </Card>
  );
}
