
'use client';

import { useState, useEffect, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useAuth } from '@/hooks/use-auth';
import { useMandiData } from '@/context/mandi-context';
import { format } from 'date-fns';
import { Calendar as CalendarIcon, PlusCircle, Download, Edit, MapPin, LayoutGrid, List } from 'lucide-react';
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';


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
  
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const [isEditCalendarOpen, setIsEditCalendarOpen] = useState(false);

  // AUTOMATIC SUMMATION LOGIC:
  // Detects multiple entries for the same Mandi name and combines their totals.
  const consolidatedTargets = useMemo(() => {
    const map = new Map<string, { total: number; idNumber: string }>();
    (targetAllocations || []).forEach(t => {
      const mandiKey = t.mandiName.trim();
      const existing = map.get(mandiKey) || { total: 0, idNumber: t.mandiIdNumber || 'N/A' };
      existing.total += Number(t.target) || 0;
      if (t.mandiIdNumber && (existing.idNumber === 'N/A' || !existing.idNumber)) {
        existing.idNumber = t.mandiIdNumber;
      }
      map.set(mandiKey, existing);
    });
    return Array.from(map.entries()).map(([name, data]) => ({
      name,
      total: data.total,
      idNumber: data.idNumber
    })).sort((a, b) => a.name.localeCompare(b.name));
  }, [targetAllocations]);

  const uniqueMandis = useMemo(() => {
    return consolidatedTargets.map(t => t.name);
  }, [consolidatedTargets]);

  const filteredAllocations = useMemo(() => {
    const sortedAllocations = [...(targetAllocations || [])].sort((a, b) => b.date.getTime() - a.date.getTime());
    if (!selectedMandi) return [];
    return sortedAllocations.filter(item => item.mandiName.trim() === selectedMandi.trim());
  }, [targetAllocations, selectedMandi]);

  const totalTargetForSelection = filteredAllocations.reduce((sum, item) => sum + (Number(item.target) || 0), 0);

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
      toast({ title: 'Success!', description: 'Target record updated.' });
    } else {
      addTarget(values);
      toast({ title: 'Target Added', description: `Target for ${values.mandiName} has been recorded.` });
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
                <CardTitle className="text-2xl font-bold font-headline text-primary">Target Management</CardTitle>
                <CardDescription>Manage official allocations. Entries for the same Mandi are summed automatically.</CardDescription>
            </div>
            <div className="flex gap-2">
                {isAdmin && (
                    <Button onClick={() => { setEditingTarget(null); setShowForm(!showForm); }} size="sm" className="rounded-xl shadow-md">
                        <PlusCircle className="mr-2 h-4 w-4" />
                        {showForm ? 'Cancel' : 'New Allotment'}
                    </Button>
                )}
            </div>
        </div>

        {isAdmin && showForm && (
          <Card className="bg-white border-primary/10 shadow-xl rounded-3xl overflow-hidden animate-in fade-in slide-in-from-top-4 duration-300 mb-8">
            <CardHeader className="bg-primary/5 border-b border-primary/10">
                <CardTitle className="text-lg">New Allotment Entry</CardTitle>
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
                                    setIsCalendarOpen(false);
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
                    <FormControl><Input type="number" placeholder="5000" {...field} onFocus={(e) => e.target.select()} className="rounded-xl h-12" /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <Button type="submit" className="lg:col-span-4 bg-primary hover:bg-primary/90 h-12 rounded-xl font-bold shadow-lg shadow-primary/20">Add Record</Button>
              </form>
            </Form>
            </CardContent>
          </Card>
        )}

        <Tabs defaultValue="consolidated" className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-6 rounded-xl bg-primary/5 p-1 h-12">
                <TabsTrigger value="consolidated" className="rounded-lg data-[state=active]:bg-white data-[state=active]:text-primary data-[state=active]:shadow-sm">
                    <LayoutGrid className="mr-2 h-4 w-4" /> Consolidated Ledger
                </TabsTrigger>
                <TabsTrigger value="history" className="rounded-lg data-[state=active]:bg-white data-[state=active]:text-primary data-[state=active]:shadow-sm">
                    <List className="mr-2 h-4 w-4" /> Individual Log
                </TabsTrigger>
            </TabsList>

            <TabsContent value="consolidated">
                <div id="consolidated-targets-table" className="bg-white border border-primary/5 rounded-3xl overflow-hidden shadow-sm">
                    <Table>
                        <TableHeader className="bg-muted/30">
                            <TableRow className="border-none">
                                <TableHead className="font-bold py-4 pl-6">Mandi Name</TableHead>
                                <TableHead className="font-bold py-4">Official ID</TableHead>
                                <TableHead className="text-right font-bold py-4 pr-6">Total Summed Target (Qtl)</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {consolidatedTargets.length === 0 ? (
                                <TableRow><TableCell colSpan={3} className="text-center h-32 opacity-50 italic">No targets recorded yet.</TableCell></TableRow>
                            ) : consolidatedTargets.map((item) => (
                                <TableRow key={item.name} className="hover:bg-primary/5 transition-colors border-primary/5">
                                    <TableCell className="font-bold text-primary pl-6">{item.name}</TableCell>
                                    <TableCell className="text-xs font-medium opacity-60">{item.idNumber}</TableCell>
                                    <TableCell className="text-right pr-6 font-black text-primary text-lg">
                                        {item.total.toLocaleString('en-IN')}
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>
            </TabsContent>

            <TabsContent value="history">
                <div className="space-y-6">
                    <div className="flex flex-wrap gap-3">
                        {uniqueMandis.map((mandi) => (
                            <Button
                                key={mandi}
                                variant={selectedMandi === mandi ? "default" : "outline"}
                                className={cn(
                                    "h-14 px-6 rounded-2xl transition-all border-primary/10 shadow-sm",
                                    selectedMandi === mandi ? "bg-primary text-white scale-105" : "bg-white hover:bg-primary/5"
                                )}
                                onClick={() => setSelectedMandi(selectedMandi === mandi ? null : mandi)}
                            >
                                <MapPin className={cn("mr-2 h-4 w-4", selectedMandi === mandi ? "text-white" : "text-primary/40")} />
                                <div className="flex flex-col items-start">
                                    <span className="font-bold">{mandi}</span>
                                    <span className="text-[10px] uppercase opacity-70">Details</span>
                                </div>
                            </Button>
                        ))}
                    </div>

                    {selectedMandi && (
                        <div id="target-allotment-table" className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
                                <h3 className="text-xl font-bold font-headline flex items-center gap-2 text-primary">
                                    <Badge variant="secondary" className="px-3 py-1 rounded-lg text-lg bg-primary/10 text-primary border-none">{selectedMandi}</Badge>
                                    Entry Log
                                </h3>
                                <Button variant="outline" size="sm" onClick={() => downloadPdf('target-allotment-table-content', `targets-${selectedMandi.toLowerCase()}`)} className="rounded-xl border-primary/20 hover:bg-primary/5">
                                    <Download className="mr-2 h-4 w-4" />
                                    Export History PDF
                                </Button>
                            </div>
                            
                            <div id="target-allotment-table-content" className="bg-white border border-primary/5 rounded-3xl overflow-hidden shadow-sm">
                                <Table>
                                    <TableHeader className="bg-muted/30">
                                        <TableRow className="border-none">
                                            <TableHead className="font-bold py-4 pl-6">Date</TableHead>
                                            <TableHead className="font-bold py-4">ID Number</TableHead>
                                            <TableHead className="text-right font-bold py-4">Individual Target (Qtl)</TableHead>
                                            {isAdmin && <TableHead className="text-right font-bold py-4 pr-6">Actions</TableHead>}
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {filteredAllocations.map((item) => (
                                        <TableRow key={item.id} className="hover:bg-primary/5 transition-colors border-primary/5">
                                            <TableCell className="pl-6">{format(item.date, 'dd MMM yyyy')}</TableCell>
                                            <TableCell className="text-xs font-medium opacity-60">{item.mandiIdNumber || 'N/A'}</TableCell>
                                            <TableCell className="text-right font-bold text-primary">{item.target.toLocaleString('en-IN')}</TableCell>
                                            {isAdmin && (
                                            <TableCell className="text-right pr-6">
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
                                            <TableCell colSpan={2} className="font-bold text-primary py-4 pl-6">TOTAL FOR {selectedMandi.toUpperCase()}</TableCell>
                                            <TableCell className="text-right font-black text-primary text-lg py-4">
                                                {totalTargetForSelection.toLocaleString('en-IN')} Qtl
                                            </TableCell>
                                            {isAdmin && <TableCell className="pr-6" />}
                                        </TableRow>
                                    </tfoot>
                                </Table>
                            </div>
                        </div>
                    )}
                </div>
            </TabsContent>
        </Tabs>
      </CardHeader>
    </Card>

    <Dialog open={isEditDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="rounded-3xl border-none p-0 overflow-hidden shadow-2xl">
            <DialogHeader className="p-6 bg-primary text-white">
                <DialogTitle className="text-xl">Edit Allotment Entry</DialogTitle>
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
                        <FormLabel>Date</FormLabel>
                        <Popover open={isEditCalendarOpen} onOpenChange={setIsEditCalendarOpen}>
                            <PopoverTrigger asChild>
                            <FormControl>
                                <Button variant={"outline"} className={cn("w-full h-12 rounded-xl pl-3 text-left font-normal border-input", !field.value && "text-muted-foreground")}>
                                {field.value ? format(field.value, "PPP") : <span>Pick date</span>}
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
                                        setIsEditCalendarOpen(false);
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
                        <FormControl><Input type="number" {...field} onFocus={(e) => e.target.select()} className="rounded-xl h-12" /></FormControl>
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
