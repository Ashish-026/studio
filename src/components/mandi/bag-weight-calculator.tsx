'use client';

import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { PlusCircle, Trash2 } from 'lucide-react';
import { useMemo } from 'react';
import { ScrollArea } from '../ui/scroll-area';
import { Separator } from '../ui/separator';

const bagWeightSchema = z.object({
    bags: z.array(z.object({ weight: z.coerce.number().min(0, 'Weight must be non-negative') })).min(1, "At least one bag is required."),
    deduction: z.coerce.number().min(0).default(0),
});

interface BagWeightCalculatorProps {
    onConfirm: (netQuintals: number) => void;
    onCancel: () => void;
}

export function BagWeightCalculator({ onConfirm, onCancel }: BagWeightCalculatorProps) {
    const form = useForm<z.infer<typeof bagWeightSchema>>({
        resolver: zodResolver(bagWeightSchema),
        defaultValues: {
            bags: [{ weight: 0 }],
            deduction: 0,
        },
    });

    const { fields, append, remove } = useFieldArray({
        control: form.control,
        name: 'bags',
    });

    const watchedBags = form.watch('bags');
    const watchedDeduction = form.watch('deduction');

    const summary = useMemo(() => {
        const totalBags = watchedBags.length;
        const grossWeightKg = watchedBags.reduce((acc, bag) => acc + (bag.weight || 0), 0);
        const deductionKg = watchedDeduction || 0;
        const netWeightKg = grossWeightKg - deductionKg;
        const netQuintals = netWeightKg / 100;

        return {
            totalBags,
            grossWeightKg,
            deductionKg,
            netWeightKg,
            netQuintals,
        };
    }, [watchedBags, watchedDeduction]);
    
    function onSubmit(values: z.infer<typeof bagWeightSchema>) {
        onConfirm(summary.netQuintals);
    }

    return (
        <DialogContent className="max-w-4xl">
            <DialogHeader>
                <DialogTitle>Bag Weight Calculator</DialogTitle>
                <DialogDescription>Enter individual bag weights in kilograms (kg) to calculate the total quantity in quintals (Qtl).</DialogDescription>
            </DialogHeader>
            <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-4">
                        <div className="flex justify-between items-center">
                            <h3 className="text-lg font-medium">Bag Weights (kg)</h3>
                            <Button type="button" size="sm" onClick={() => append({ weight: 0 })}>
                                <PlusCircle className="mr-2 h-4 w-4" /> Add Bag
                            </Button>
                        </div>
                        <ScrollArea className="h-72 w-full rounded-md border p-4">
                            <div className="space-y-4">
                                {fields.map((field, index) => (
                                    <FormField
                                        key={field.id}
                                        control={form.control}
                                        name={`bags.${index}.weight`}
                                        render={({ field }) => (
                                            <FormItem>
                                                <div className="flex items-center gap-2">
                                                    <FormLabel className="w-20">Bag {index + 1}</FormLabel>
                                                    <FormControl>
                                                        <Input type="number" step="0.1" {...field} />
                                                    </FormControl>
                                                    <Button type="button" variant="ghost" size="icon" onClick={() => remove(index)}>
                                                        <Trash2 className="h-4 w-4 text-destructive" />
                                                    </Button>
                                                </div>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                ))}
                                {fields.length === 0 && (
                                    <p className="text-center text-muted-foreground">Add a bag to get started.</p>
                                )}
                            </div>
                        </ScrollArea>
                    </div>

                    <div className="space-y-6">
                        <FormField
                            control={form.control}
                            name="deduction"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Deduction (kg)</FormLabel>
                                    <FormControl>
                                        <Input type="number" step="0.1" placeholder="e.g., 5.5" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <Separator />
                        <div className="space-y-2 rounded-lg border bg-muted/50 p-4">
                            <h3 className="text-lg font-medium">Summary</h3>
                            <div className="flex justify-between text-sm">
                                <span className="text-muted-foreground">Total Bags</span>
                                <span>{summary.totalBags}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="text-muted-foreground">Gross Weight</span>
                                <span>{summary.grossWeightKg.toFixed(2)} kg</span>
                            </div>
                             <div className="flex justify-between text-sm text-destructive">
                                <span className="text-destructive/80">Deduction</span>
                                <span>- {summary.deductionKg.toFixed(2)} kg</span>
                            </div>
                            <Separator />
                            <div className="flex justify-between font-bold text-md">
                                <span>Net Weight</span>
                                <span>{summary.netWeightKg.toFixed(2)} kg</span>
                            </div>
                            <div className="flex justify-between font-bold text-lg text-primary pt-2">
                                <span>Net Quantity</span>
                                <span>{summary.netQuintals.toFixed(4)} Qtl</span>
                            </div>
                        </div>
                    </div>
                </form>
            </Form>
            <DialogFooter>
                <Button type="button" variant="outline" onClick={onCancel}>Cancel</Button>
                <Button type="button" onClick={form.handleSubmit(onSubmit)}>Confirm & Update Quantity</Button>
            </DialogFooter>
        </DialogContent>
    );
}