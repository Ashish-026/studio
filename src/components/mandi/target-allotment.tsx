'use client';

import { useState, useEffect, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useAuth } from '@/hooks/use-auth';
import { useMandiData } from '@/context/mandi-context';
import { format } from 'date-fns';
import { Calendar as CalendarIcon, PlusCircle, Download, Edit, MapPin } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { useToast } from '@/hooks/use-toast';
import { downloadPdf } from '@/lib/pdf-utils';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog';
import type { TargetAllocation as TargetAllocationType } from '@/lib/types';
import { Label } from '../ui/label';
import { Badge } from '../ui/badge';


const formSchema = z.object({
  mandiName: z.string().min(1, 'Mandi name is required'),
  mandiIdNumber: z.string().optional(),
  date: z.date({ required_error: 'A date is required.' }),
  target: z.coerce.number().min(1, 'Target must be at least 1'),
});

export function TargetAllotment() {
  const { user } = useAuth();
  const { targetAllocations, addTarget, updateTarget } = useMandiData();
  const { toast } = useToast();
  const isAdmin = user?.role === 'admin';
  const [showForm, setShowForm] = useState(false);
  const [editingTarget, setEditingTarget] = useState<TargetAllocationType | null>(null);
  const [isEditDialogOpen, setEditDialogOpen] = useState(false);
  const [selectedMandi, setSelectedMandi] = useState<string | null>(null);
  
  // State for auto-closing date pickers
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const [isEditCalendarOpen, setIsEditCalendarOpen] = useState(false);

  const uniqueMandis = useMemo(() => {
    const mandiNames = targetAllocations.map((allocation) => allocation.mandiName);
    return [...new Set(mandiNames)].sort((a,b) => a.localeCompare(b));
  }, [targetAllocations]);

  const filteredAllocations = useMemo(() => {
    const sortedAllocations = [...targetAllocations].sort((a, b) => b.date.getTime() - a.date.getTime());
    if (!selectedMandi) return [];
    return sortedAllocations.filter(item => item.mandiName === selectedMandi);
  }, [targetAllocations, selectedMandi]);

  const totalTarget = filteredAllocations.reduce((sum, item) => sum + item.target, 0);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: { mandiName: '', mandiIdNumber: '', target: 0, date: new Date() },
  });

  useEffect(() => {
    if (editingTarget) {
      form.reset({
        mandiName: editingTarget.mandiName,
        mandiIdNumber: editingTarget.mandiIdNumber || '',
        date: new Date(editingTarget.date),
        target: editingTarget.target,
      });
    } else {
      form.reset({ mandiName: '', mandiIdNumber: '', target: 0, date: new Date() });
    }
  }, [editingTarget, form]);

  function onSubmit(values: z.infer<typeof formSchema>) {
    if (editingTarget) {
      updateTarget(editingTarget.id, values);
      toast({ title: 'Success!', description: 'Target has been updated.' });
    } else {
      addTarget(values);
      toast({ title: 'Success!', description: 'New target has been allotted.' });
    }
    
    form.reset();
    setShowForm(false);
    setEditDialogOpen(false);
    setEditingTarget(null);
  }

  const handleEditClick = (target: TargetAllocationType) => {
    setEditingTarget(target);
    setEditDialogOpen(true);
  }

  return (
    <>
    <Card className="border-none shadow-none bg-transparent">
      <CardHeader className="px-0 pt-0">
        <div className="flex justify-between items-start mb-6">
            <div>
                <CardTitle className="text-2xl font-bold font-headline text-primary">Target Allotment</CardTitle>
                <CardDescription>Select a Mandi to view targets or add a new allocation.</CardDescription>
            </div>
            <div className="flex gap-2">
                {isAdmin && (
                    <Button onClick={() => { setEditingTarget(null); setShowForm(!showForm); }} size="sm" className="rounded-xl shadow-md">
                        <PlusCircle className="mr-2 h-4 w-4" />
                        {showForm ? 'Cancel' : 'Add New Target'}
                    </Button>
                )}
            </div>
        </div>

        <div className="space-y-4">
            <Label className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Select Mandi to View Details</Label>
            <div className="flex flex-wrap gap-3">
                {uniqueMandis.length === 0 ? (
                    <p className="text-sm text-muted-foreground italic">No mandis registered yet. Add a target to begin.</p>
                ) : (
                    uniqueMandis.map((mandi) => (
                        <Button
                            key={mandi}
                            variant={selectedMandi === mandi ? "default" : "outline"}
                            className={cn(
                                "h-14 px-6 rounded-2xl transition-all border-primary/10 shadow-sm hover:shadow-md",
                                selectedMandi === mandi ? "bg-primary text-white scale-105" : "bg-white hover:bg-primary/5 hover:border-primary/30"
                            )}
                            onClick={() => setSelectedMandi(selectedMandi === mandi ? null : mandi)}
                        >
                            <MapPin className={cn("mr-2 h-4 w-4", selectedMandi === mandi ? "text-white" : "text-primary/40")} />
                            <div className="flex flex-col items-start">
                                <span className="font-bold">{mandi}</span>
                                <span className="text-[10px] uppercase opacity-70">View History</span>
                            </div>
                        </Button>
                    ))
                )}
            </div>
        </div>
      </CardHeader>
      
      <CardContent className="px-0 space-y-8">
        {isAdmin && showForm && (
          <Card className="bg-white border-primary/10 shadow-xl rounded-3xl overflow-hidden animate-in fade-in slide-in-from-top-4 duration-300">
            <CardHeader className="bg-primary/5 border-b border-primary/10">
                <CardTitle className="text-lg">New Target Allocation</CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 items-end">
                <FormField control={form.control} name="mandiName" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Mandi Name</FormLabel>
                    <FormControl><Input placeholder="e.g., Bargarh Main" {...field} className="rounded-xl h-12" /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="mandiIdNumber" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Mandi ID Number</FormLabel>
                    <FormControl><Input placeholder="e.g., M-12345" {...field} className="rounded-xl h-12" /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="date" render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Allocation Date</FormLabel>
                    <Popover open={isCalendarOpen} onOpenChange={setIsCalendarOpen}>
                        <PopoverTrigger asChild>
                        <FormControl>
                            <Button variant={"outline"} className={cn("h-12 rounded-xl pl-3 text-left font-normal border-input", !field.value && "text-muted-foreground")}>
                            {field.value ? format(field.value, "PPP") : <span>Pick a date</span>}
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                            </Button>
                        </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                            <Calendar 
                                mode="single" 
                                selected={field.value} 
                                onSelect={(date) => {
                                    field.onChange(date);
                                    setIsCalendarOpen(false); // AUTO-CLOSE ON SELECT
                                }} 
                                disabled={(date) => date > new Date() || date < new Date("1900-01-01")} 
                                initialFocus 
                            />
                        </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="target" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Target (Quintals)</FormLabel>
                    <FormControl><Input type="number" placeholder="5000" {...field} className="rounded-xl h-12" /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <Button type="submit" className="lg:col-span-4 bg-primary hover:bg-primary/90 h-12 rounded-xl font-bold shadow-lg shadow-primary/20">Add Allocation</Button>
              </form>
            </Form>
            </CardContent>
          </Card>
        )}

        {selectedMandi && (
            <div id="target-allotment-table" className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
                    <h3 className="text-xl font-bold font-headline flex items-center gap-2 text-primary">
                        <Badge variant="secondary" className="px-3 py-1 rounded-lg text-lg bg-primary/10 text-primary border-none">{selectedMandi}</Badge>
                        Allocation History
                    </h3>
                    <Button variant="outline" size="sm" onClick={() => downloadPdf('target-allotment-table-content', `targets-${selectedMandi.toLowerCase()}`)} className="rounded-xl border-primary/20 hover:bg-primary/5">
                        <Download className="mr-2 h-4 w-4" />
                        Export to PDF
                    </Button>
                </div>
                
                <div id="target-allotment-table-content" className="bg-white border border-primary/5 rounded-3xl overflow-hidden shadow-sm">
                    <Table>
                        <TableHeader className="bg-muted/30">
                            <TableRow className="border-none">
                                <TableHead className="font-bold py-4">Mandi ID</TableHead>
                                <TableHead className="font-bold py-4">Date</TableHead>
                                <TableHead className="text-right font-bold py-4">Target (Quintals)</TableHead>
                                {isAdmin && <TableHead className="text-right font-bold py-4">Actions</TableHead>}
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {filteredAllocations.map((item) => (
                            <TableRow key={item.id} className="hover:bg-primary/5 transition-colors">
                                <TableCell className="font-medium">{item.mandiIdNumber || 'N/A'}</TableCell>
                                <TableCell>{format(item.date, 'dd MMM yyyy')}</TableCell>
                                <TableCell className="text-right font-bold text-primary">{item.target.toLocaleString('en-IN')}</TableCell>
                                {isAdmin && (
                                <TableCell className="text-right">
                                    <Button variant="ghost" size="icon" onClick={() => handleEditClick(item)} className="rounded-lg hover:text-primary hover:bg-primary/10">
                                    <Edit className="h-4 w-4" />
                                    </Button>
                                </TableCell>
                                )}
                            </TableRow>
                            ))}
                        </TableBody>
                        <tfoot className="bg-primary/5 border-t border-primary/10">
                            <TableRow>
                                <TableCell colSpan={2} className="font-bold text-primary py-4">TOTAL ALLOTTED TARGET</TableCell>
                                <TableCell className="text-right font-black text-primary text-lg py-4">
                                    {totalTarget.toLocaleString('en-IN')} Qtl
                                </TableCell>
                                {isAdmin && <TableCell />}
                            </TableRow>
                        </tfoot>
                    </Table>
                </div>
            </div>
        )}
      </CardContent>
    </Card>

    <Dialog open={isEditDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="rounded-3xl border-none p-0 overflow-hidden shadow-2xl">
            <DialogHeader className="p-6 bg-primary text-white">
                <DialogTitle className="text-xl">Edit Target Allocation</DialogTitle>
            </DialogHeader>
            <div className="p-6">
                <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                    <FormField control={form.control} name="mandiName" render={({ field }) => (
                    <FormItem>
                        <FormLabel>Mandi Name</FormLabel>
                        <FormControl><Input {...field} className="rounded-xl h-12" /></FormControl>
                        <FormMessage />
                    </FormItem>
                    )} />
                    <FormField control={form.control} name="mandiIdNumber" render={({ field }) => (
                    <FormItem>
                        <FormLabel>Mandi ID Number</FormLabel>
                        <FormControl><Input {...field} className="rounded-xl h-12" /></FormControl>
                        <FormMessage />
                    </FormItem>
                    )} />
                    <FormField control={form.control} name="date" render={({ field }) => (
                    <FormItem className="flex flex-col">
                        <FormLabel>Allocation Date</FormLabel>
                        <Popover open={isEditCalendarOpen} onOpenChange={setIsEditCalendarOpen}>
                            <PopoverTrigger asChild>
                            <FormControl>
                                <Button variant={"outline"} className={cn("w-full h-12 rounded-xl pl-3 text-left font-normal border-input", !field.value && "text-muted-foreground")}>
                                {field.value ? format(field.value, "PPP") : <span>Pick a date</span>}
                                <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                </Button>
                            </FormControl>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0" align="start">
                                <Calendar 
                                    mode="single" 
                                    selected={field.value} 
                                    onSelect={(date) => {
                                        field.onChange(date);
                                        setIsEditCalendarOpen(false); // AUTO-CLOSE ON SELECT
                                    }} 
                                    initialFocus 
                                />
                            </PopoverContent>
                        </Popover>
                        <FormMessage />
                    </FormItem>
                    )} />
                    <FormField control={form.control} name="target" render={({ field }) => (
                    <FormItem>
                        <FormLabel>Target (Quintals)</FormLabel>
                        <FormControl><Input type="number" {...field} className="rounded-xl h-12" /></FormControl>
                        <FormMessage />
                    </FormItem>
                    )} />
                    <Button type="submit" className="w-full bg-accent hover:bg-accent/90 text-accent-foreground h-12 rounded-xl font-bold text-lg shadow-lg shadow-accent/20">Save Changes</Button>
                </form>
                </Form>
            </div>
        </DialogContent>
    </Dialog>
    </>
  );
}
