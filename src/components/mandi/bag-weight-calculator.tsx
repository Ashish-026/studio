
'use client';

import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useMemo, useState } from 'react';
import { Separator } from '../ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Trash } from 'lucide-react';

const uniformBagSchema = z.object({
    numberOfBags: z.coerce.number().int().min(1, "Must have at least one bag."),
    weightPerBag: z.coerce.number().positive("Weight per bag must be positive."),
    pricePerBag: z.coerce.number().positive("Price per bag must be positive."),
    deduction: z.coerce.number().min(0).default(0),
});

const nonUniformBagSchema = z.object({
    bags: z.array(z.object({ weight: z.coerce.number().positive("Weight must be positive.") })).min(1, "Add at least one bag."),
    deduction: z.coerce.number().min(0).default(0),
});

interface BagWeightCalculatorProps {
    onConfirm: (netQuintals: number, ratePerQuintal: number) => void;
    onCancel: () => void;
}

export function BagWeightCalculator({ onConfirm, onCancel }: BagWeightCalculatorProps) {
    const [activeTab, setActiveTab] = useState('uniform');

    const uniformForm = useForm<z.infer<typeof uniformBagSchema>>({
        resolver: zodResolver(uniformBagSchema),
        defaultValues: { numberOfBags: 0, weightPerBag: 0, pricePerBag: 0, deduction: 0 },
    });

    const nonUniformForm = useForm<z.infer<typeof nonUniformBagSchema>>({
        resolver: zodResolver(nonUniformBagSchema),
        defaultValues: { bags: [{ weight: 0 }], deduction: 0 },
    });

    const { fields: nonUniformFields, append, remove } = useFieldArray({
        control: nonUniformForm.control,
        name: "bags"
    });

    const watchedUniformValues = uniformForm.watch();
    const watchedNonUniformValues = nonUniformForm.watch();

    const summary = useMemo(() => {
        let grossWeightKg = 0;
        let deductionKg = 0;
        let totalPrice = 0;

        if (activeTab === 'uniform') {
            const { numberOfBags, weightPerBag, pricePerBag, deduction } = watchedUniformValues;
            grossWeightKg = (numberOfBags || 0) * (weightPerBag || 0);
            totalPrice = (numberOfBags || 0) * (pricePerBag || 0);
            deductionKg = parseFloat(String(deduction || 0));
        } else {
            const { bags, deduction } = watchedNonUniformValues;
            grossWeightKg = (bags || []).reduce((acc, bag) => acc + (parseFloat(String(bag.weight)) || 0), 0);
            deductionKg = parseFloat(String(deduction || 0));
        }

        const netWeightKg = grossWeightKg - deductionKg;
        const netQuintals = netWeightKg > 0 ? netWeightKg / 100 : 0;
        
        const ratePerQuintal = activeTab === 'uniform' && netQuintals > 0 ? totalPrice / netQuintals : 0;

        return {
            grossWeightKg,
            deductionKg,
            netWeightKg,
            netQuintals,
            totalPrice,
            ratePerQuintal
        };
    }, [activeTab, watchedUniformValues, watchedNonUniformValues]);
    
    function handleConfirm() {
        onConfirm(summary.netQuintals, summary.ratePerQuintal);
    }

    return (
        <DialogContent className="max-w-2xl">
            <DialogHeader>
                <DialogTitle>Bag Weight & Price Calculator</DialogTitle>
                <DialogDescription>Calculate total quantity and rate from bag details.</DialogDescription>
            </DialogHeader>
            <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="uniform">Uniform Bags</TabsTrigger>
                    <TabsTrigger value="non-uniform">Non-Uniform Bags</TabsTrigger>
                </TabsList>
                <TabsContent value="uniform" className="pt-4">
                     <Form {...uniformForm}>
                        <form className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div className="space-y-4">
                                <FormField control={uniformForm.control} name="numberOfBags" render={({ field }) => (
                                    <FormItem><FormLabel>Number of Bags</FormLabel><FormControl><Input type="number" placeholder="e.g., 200" {...field} /></FormControl><FormMessage /></FormItem>
                                )} />
                                <FormField control={uniformForm.control} name="weightPerBag" render={({ field }) => (
                                    <FormItem><FormLabel>Weight per Bag (kg)</FormLabel><FormControl><Input type="number" step="0.1" placeholder="e.g., 75" {...field} /></FormControl><FormMessage /></FormItem>
                                )} />
                                <FormField control={uniformForm.control} name="pricePerBag" render={({ field }) => (
                                    <FormItem><FormLabel>Price per Bag (₹)</FormLabel><FormControl><Input type="number" step="0.01" placeholder="e.g., 150" {...field} /></FormControl><FormMessage /></FormItem>
                                )} />
                                <FormField control={uniformForm.control} name="deduction" render={({ field }) => (
                                    <FormItem><FormLabel>Total Deduction (kg)</FormLabel><FormControl><Input type="number" step="0.1" placeholder="e.g., 5.5" {...field} /></FormControl><FormMessage /></FormItem>
                                )} />
                            </div>
                             <div className="space-y-4 rounded-lg border bg-muted/50 p-4">
                                <h3 className="text-lg font-medium">Summary</h3>
                                <div className="space-y-2 text-sm">
                                    <div className="flex justify-between"><span className="text-muted-foreground">Gross Weight</span><span>{summary.grossWeightKg.toFixed(2)} kg</span></div>
                                    <div className="flex justify-between text-destructive"><span className="text-destructive/80">Deduction</span><span>- {summary.deductionKg.toFixed(2)} kg</span></div>
                                    <Separator />
                                    <div className="flex justify-between font-bold"><span >Net Weight</span><span>{summary.netWeightKg.toFixed(2)} kg</span></div>
                                    <div className="flex justify-between font-bold text-primary"><span >Net Quantity</span><span>{summary.netQuintals.toFixed(4)} Qtl</span></div>
                                </div>
                                <Separator />
                                <div className="space-y-2 text-sm">
                                    <div className="flex justify-between font-bold"><span >Total Price</span><span>₹{summary.totalPrice.toFixed(2)}</span></div>
                                    <div className="flex justify-between font-bold text-accent"><span >Rate per Quintal</span><span>₹{summary.ratePerQuintal.toFixed(2)}</span></div>
                                </div>
                            </div>
                        </form>
                    </Form>
                </TabsContent>
                <TabsContent value="non-uniform" className="pt-4">
                     <Form {...nonUniformForm}>
                        <form className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div className="space-y-4">
                                <div className="max-h-60 overflow-y-auto space-y-2 pr-2">
                                {nonUniformFields.map((field, index) => (
                                    <FormField key={field.id} control={nonUniformForm.control} name={`bags.${index}.weight`} render={({ field }) => (
                                        <FormItem>
                                            <div className="flex items-center gap-2">
                                                <FormLabel className="w-20">Bag {index + 1}</FormLabel>
                                                <FormControl><Input type="number" step="0.1" placeholder="Weight in kg" {...field} /></FormControl>
                                                <Button type="button" variant="ghost" size="icon" onClick={() => remove(index)}><Trash className="h-4 w-4 text-destructive" /></Button>
                                            </div>
                                            <FormMessage />
                                        </FormItem>
                                    )} />
                                ))}
                                </div>
                                <Button type="button" variant="outline" onClick={() => append({ weight: 0 })}>Add Bag</Button>
                                <FormField control={nonUniformForm.control} name="deduction" render={({ field }) => (
                                    <FormItem><FormLabel>Total Deduction (kg)</FormLabel><FormControl><Input type="number" step="0.1" placeholder="e.g., 5.5" {...field} /></FormControl><FormMessage /></FormItem>
                                )} />
                            </div>
                            <div className="space-y-4 rounded-lg border bg-muted/50 p-4">
                                <h3 className="text-lg font-medium">Summary</h3>
                                <div className="space-y-2 text-sm">
                                    <div className="flex justify-between"><span className="text-muted-foreground">Gross Weight</span><span>{summary.grossWeightKg.toFixed(2)} kg</span></div>
                                    <div className="flex justify-between text-destructive"><span className="text-destructive/80">Deduction</span><span>- {summary.deductionKg.toFixed(2)} kg</span></div>
                                    <Separator />
                                    <div className="flex justify-between font-bold"><span >Net Weight</span><span>{summary.netWeightKg.toFixed(2)} kg</span></div>
                                    <div className="flex justify-between font-bold text-primary"><span >Net Quantity</span><span>{summary.netQuintals.toFixed(4)} Qtl</span></div>
                                </div>
                            </div>
                        </form>
                    </Form>
                </TabsContent>
            </Tabs>
           
            <DialogFooter>
                <Button type="button" variant="outline" onClick={onCancel}>Cancel</Button>
                <Button type="button" onClick={handleConfirm}>Confirm & Update Form</Button>
            </DialogFooter>
        </DialogContent>
    );
}
