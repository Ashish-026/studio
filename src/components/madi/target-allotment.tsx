'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useAuth } from '@/hooks/use-auth';
import { useMadiData } from '@/context/madi-context';
import { format } from 'date-fns';
import { Calendar as CalendarIcon, PlusCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { useToast } from '@/hooks/use-toast';

const formSchema = z.object({
  mandiName: z.string().min(1, 'Mandi name is required'),
  date: z.date({ required_error: 'A date is required.' }),
  target: z.coerce.number().min(1, 'Target must be at least 1'),
});

export function TargetAllotment() {
  const { user } = useAuth();
  const { targetAllocations, addTarget } = useMadiData();
  const { toast } = useToast();
  const isAdmin = user?.role === 'admin';
  const [showForm, setShowForm] = useState(false);

  const totalTarget = targetAllocations.reduce((sum, item) => sum + item.target, 0);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: { mandiName: '', target: 0 },
  });

  function onSubmit(values: z.infer<typeof formSchema>) {
    addTarget(values);
    toast({
      title: 'Success!',
      description: 'New target has been allotted.',
    });
    form.reset();
    setShowForm(false);
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-start">
            <div>
                <CardTitle>Target Allotment Details</CardTitle>
                <CardDescription>View and manage mandi-wise target allocations. Only admins can add new targets.</CardDescription>
            </div>
            {isAdmin && (
                <Button onClick={() => setShowForm(!showForm)} size="sm">
                    <PlusCircle className="mr-2 h-4 w-4" />
                    {showForm ? 'Cancel' : 'Add Target'}
                </Button>
            )}
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {isAdmin && showForm && (
          <Card className="bg-muted/50">
            <CardHeader>
                <CardTitle>New Target Allocation</CardTitle>
            </CardHeader>
            <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                <FormField control={form.control} name="mandiName" render={({ field }) => (
                  <FormItem className="md:col-span-2">
                    <FormLabel>Mandi Name</FormLabel>
                    <FormControl><Input placeholder="e.g., Bargarh Main" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="date" render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Date</FormLabel>
                    <Popover>
                        <PopoverTrigger asChild>
                        <FormControl>
                            <Button variant={"outline"} className={cn("pl-3 text-left font-normal", !field.value && "text-muted-foreground")}>
                            {field.value ? format(field.value, "PPP") : <span>Pick a date</span>}
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                            </Button>
                        </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                            <Calendar mode="single" selected={field.value} onSelect={field.onChange} disabled={(date) => date > new Date() || date < new Date("1900-01-01")} initialFocus />
                        </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="target" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Target (Quintals)</FormLabel>
                    <FormControl><Input type="number" placeholder="5000" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <Button type="submit" className="w-full md:w-auto md:col-start-4 bg-accent hover:bg-accent/90">Add Allocation</Button>
              </form>
            </Form>
            </CardContent>
          </Card>
        )}
        <div>
            <h3 className="text-lg font-semibold mb-2">Allocation History</h3>
            <div className="border rounded-lg">
                <Table>
                    <TableHeader>
                        <TableRow>
                        <TableHead>Mandi Name</TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead className="text-right">Target (Quintals)</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {targetAllocations.length === 0 && (
                            <TableRow><TableCell colSpan={3} className="text-center">No targets allotted yet.</TableCell></TableRow>
                        )}
                        {targetAllocations.sort((a, b) => b.date.getTime() - a.date.getTime()).map((item) => (
                        <TableRow key={item.id}>
                            <TableCell className="font-medium">{item.mandiName}</TableCell>
                            <TableCell>{format(item.date, 'dd MMM yyyy')}</TableCell>
                            <TableCell className="text-right">{item.target.toLocaleString('en-IN')}</TableCell>
                        </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>
             <div className="text-right font-bold text-lg mt-4 pr-4">
                Total Allotted: {totalTarget.toLocaleString('en-IN')} Quintals
            </div>
        </div>
      </CardContent>
    </Card>
  );
}
