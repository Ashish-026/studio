'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useLabourData } from '@/context/labour-context';
import { PlusCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';

const formSchema = z.object({
  name: z.string().min(1, "Labourer's name is required"),
  activity: z.string().min(1, 'Activity is required'),
  hoursWorked: z.coerce.number().positive('Must be a positive number'),
});

export function LabourRecords() {
  const { records, addRecord } = useLabourData();
  const { toast } = useToast();
  const [showForm, setShowForm] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      activity: '',
    },
  });

  function onSubmit(values: z.infer<typeof formSchema>) {
    addRecord(values);
    toast({
      title: 'Success!',
      description: 'Labour record has been added.',
    });
    form.reset();
    setShowForm(false);
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-start">
          <div>
            <CardTitle>Labour Records</CardTitle>
            <CardDescription>View and manage labour activity records.</CardDescription>
          </div>
          <Button onClick={() => setShowForm(!showForm)} size="sm">
            <PlusCircle className="mr-2 h-4 w-4" />
            {showForm ? 'Cancel' : 'Add Record'}
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {showForm && (
          <Card className="bg-muted/50">
             <CardHeader>
                <CardTitle>New Labour Record</CardTitle>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
                  <FormField control={form.control} name="name" render={({ field }) => (
                    <FormItem><FormLabel>Labourer Name</FormLabel><FormControl><Input placeholder="e.g., Manoj Kumar" {...field} /></FormControl><FormMessage /></FormItem>
                  )} />
                  <FormField control={form.control} name="activity" render={({ field }) => (
                    <FormItem><FormLabel>Activity</FormLabel><FormControl><Input placeholder="e.g., Loading, Cleaning" {...field} /></FormControl><FormMessage /></FormItem>
                  )} />
                  <FormField control={form.control} name="hoursWorked" render={({ field }) => (
                    <FormItem><FormLabel>Hours Worked</FormLabel><FormControl><Input type="number" step="0.5" placeholder="8" {...field} /></FormControl><FormMessage /></FormItem>
                  )} />
                  <Button type="submit" className="w-full md:w-auto md:col-span-full bg-accent hover:bg-accent/90">Add Record</Button>
                </form>
              </Form>
            </CardContent>
          </Card>
        )}

        <div>
            <h3 className="text-lg font-semibold mb-2">Activity History</h3>
            <div className="border rounded-lg">
                <Table>
                <TableHeader>
                    <TableRow>
                    <TableHead>Labourer Name</TableHead>
                    <TableHead>Activity</TableHead>
                    <TableHead className="text-right">Hours Worked</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {records.length === 0 && (
                        <TableRow><TableCell colSpan={3} className="text-center">No records found.</TableCell></TableRow>
                    )}
                    {records.map((item) => (
                    <TableRow key={item.id}>
                        <TableCell className="font-medium">{item.name}</TableCell>
                        <TableCell>{item.activity}</TableCell>
                        <TableCell className="text-right">{item.hoursWorked.toLocaleString('en-IN')}</TableCell>
                    </TableRow>
                    ))}
                </TableBody>
                </Table>
            </div>
        </div>
      </CardContent>
    </Card>
  );
}
