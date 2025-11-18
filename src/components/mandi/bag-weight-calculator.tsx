
'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useMemo } from 'react';
import { Separator } from '../ui/separator';

const bagWeightSchema = z.object({
    numberOfBags: z.coerce.number().int().min(1, "Must have at least one bag."),
    weightPerBag: z.coerce.number().positive("Weight per bag must be positive."),
    pricePerBag: z.coerce.number().positive("Price per bag must be positive."),
    deduction: z.coerce.number().min(0).default(0),
});

interface BagWeightCalculatorProps {
    onConfirm: (netQuintals: number, ratePerQuintal: number) => void;
    onCancel: () => void;
}

export function BagWeightCalculator({ onConfirm, onCancel }: BagWeightCalculatorProps) {
    const form = useForm<z.infer<typeof bagWeightSchema>>({
        resolver: zodResolver(bagWeightSchema),
        defaultValues: {
            numberOfBags: 0,
            weightPerBag: 0,
            pricePerBag: 0,
            deduction: 0,
        },
    });

    const watchedValues = form.watch();

    const summary = useMemo(() => {
        const { numberOfBags, weightPerBag, pricePerBag, deduction } = watchedValues;
        
        const grossWeightKg = (numberOfBags || 0) * (weightPerBag || 0);
        const deductionKg = deduction || 0;
        const netWeightKg = grossWeightKg - deductionKg;
        const netQuintals = netWeightKg > 0 ? netWeightKg / 100 : 0;
        
        const totalPrice = (numberOfBags || 0) * (pricePerBag || 0);
        const ratePerQuintal = netQuintals > 0 ? totalPrice / netQuintals : 0;

        return {
            totalBags: numberOfBags || 0,
            grossWeightKg,
            deductionKg,
            netWeightKg,
            netQuintals,
            totalPrice,
            ratePerQuintal
        };
    }, [watchedValues]);
    
    function onSubmit(values: z.infer<typeof bagWeightSchema>) {
        onConfirm(summary.netQuintals, summary.ratePerQuintal);
    }

    return (
        <DialogContent className="max-w-2xl">
            <DialogHeader>
                <DialogTitle>Bag Weight &amp; Price Calculator</DialogTitle>
                <DialogDescription>Calculate total quantity and rate per quintal from bag details.</DialogDescription>
            </DialogHeader>
            <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-4">
                        <FormField
                            control={form.control}
                            name="numberOfBags"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Number of Bags</FormLabel>
                                    <FormControl>
                                        <Input type="number" placeholder="e.g., 200" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                         <FormField
                            control={form.control}
                            name="weightPerBag"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Weight per Bag (kg)</FormLabel>
                                    <FormControl>
                                        <Input type="number" step="0.1" placeholder="e.g., 75" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                         <FormField
                            control={form.control}
                            name="pricePerBag"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Price per Bag (₹)</FormLabel>
                                    <FormControl>
                                        <Input type="number" step="0.01" placeholder="e.g., 150" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="deduction"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Total Deduction (kg)</FormLabel>
                                    <FormControl>
                                        <Input type="number" step="0.1" placeholder="e.g., 5.5" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                    </div>

                    <div className="space-y-4 rounded-lg border bg-muted/50 p-4">
                        <h3 className="text-lg font-medium">Summary</h3>
                        <div className="space-y-2 text-sm">
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">Gross Weight</span>
                                <span>{summary.grossWeightKg.toFixed(2)} kg</span>
                            </div>
                             <div className="flex justify-between text-destructive">
                                <span className="text-destructive/80">Deduction</span>
                                <span>- {summary.deductionKg.toFixed(2)} kg</span>
                            </div>
                            <Separator />
                            <div className="flex justify-between font-bold">
                                <span>Net Weight</span>
                                <span>{summary.netWeightKg.toFixed(2)} kg</span>
                            </div>
                            <div className="flex justify-between font-bold text-primary">
                                <span>Net Quantity</span>
                                <span>{summary.netQuintals.toFixed(4)} Qtl</span>
                            </div>
                        </div>

                        <Separator />
                        <div className="space-y-2 text-sm">
                             <div className="flex justify-between font-bold">
                                <span>Total Price</span>
                                <span>₹{summary.totalPrice.toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between font-bold text-accent">
                                <span>Rate per Quintal</span>
                                <span>₹{summary.ratePerQuintal.toFixed(2)}</span>
                            </div>
                        </div>
                    </div>
                </form>
            </Form>
            <DialogFooter>
                <Button type="button" variant="outline" onClick={onCancel}>Cancel</Button>
                <Button type="button" onClick={form.handleSubmit(onSubmit)}>Confirm & Update Form</Button>
            </DialogFooter>
        </DialogContent>
    );
}
