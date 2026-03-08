'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useMemo, useState } from 'react';
import { Separator } from '../ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Badge } from '../ui/badge';

const uniformBagSchema = z.object({
    numberOfBags: z.coerce.number().int().min(1, "Must have at least one bag."),
    weightPerBag: z.coerce.number().positive("Actual weight per bag must be positive."),
    consideredWeight: z.coerce.number().positive("Mandi standard weight must be positive."),
    deduction: z.coerce.number().min(0).default(0),
});

const nonUniformBagSchema = z.object({
    bags: z.array(z.object({ weight: z.coerce.number().positive("Weight must be positive.") })).min(1, "Add at least one bag."),
    consideredWeight: z.coerce.number().positive("Mandi standard weight per bag must be positive."),
    weightPerBag: z.coerce.number().positive("Base bag weight for ratio must be positive."),
    deduction: z.coerce.number().min(0).default(0),
});

interface BagWeightCalculatorProps {
    onConfirm: (values: { grossQuintals: number; netQuintals: number; netWeightKg: number }) => void;
    onCancel: () => void;
}

export function BagWeightCalculator({ onConfirm, onCancel }: BagWeightCalculatorProps) {
    const [activeTab, setActiveTab] = useState('uniform');

    const uniformForm = useForm<z.infer<typeof uniformBagSchema>>({
        resolver: zodResolver(uniformBagSchema),
        defaultValues: { numberOfBags: 0, weightPerBag: 78, consideredWeight: 75, deduction: 0 },
    });

    const nonUniformForm = useForm<z.infer<typeof nonUniformBagSchema>>({
        resolver: zodResolver(nonUniformBagSchema),
        defaultValues: { bags: [{ weight: 0 }], consideredWeight: 75, weightPerBag: 78, deduction: 0 },
    });

    const watchedUniformValues = uniformForm.watch();
    const watchedNonUniformValues = nonUniformForm.watch();

    const summary = useMemo(() => {
        let grossWeightKg = 0;
        let deductionKg = 0;
        let mandiWeightKg = 0;

        if (activeTab === 'uniform') {
            const { numberOfBags, weightPerBag, consideredWeight, deduction } = watchedUniformValues;
            grossWeightKg = (numberOfBags || 0) * (weightPerBag || 0);
            deductionKg = parseFloat(String(deduction || 0));
            // Official Mandi Logic: (Total Actual / Actual Bag Weight) * Standard Weight
            mandiWeightKg = (numberOfBags || 0) * (consideredWeight || 0);
        } else {
            const { bags, consideredWeight, weightPerBag, deduction } = watchedNonUniformValues;
            grossWeightKg = (bags || []).reduce((acc, bag) => acc + (parseFloat(String(bag.weight)) || 0), 0);
            deductionKg = parseFloat(String(deduction || 0));
            // Non-uniform ratio: (Total Gross / Base Weight) * Standard Weight
            mandiWeightKg = (grossWeightKg / (weightPerBag || 1)) * (consideredWeight || 0);
        }

        const netWeightKg = grossWeightKg - deductionKg;
        const grossQuintals = grossWeightKg > 0 ? grossWeightKg / 100 : 0;
        const netQuintals = mandiWeightKg > 0 ? mandiWeightKg / 100 : 0;
        
        return {
            grossWeightKg,
            deductionKg,
            netWeightKg,
            mandiWeightKg,
            grossQuintals,
            netQuintals,
        };
    }, [activeTab, watchedUniformValues, watchedNonUniformValues]);
    
    function handleConfirm() {
        onConfirm({ 
            grossQuintals: summary.grossQuintals, 
            netQuintals: summary.netQuintals, 
            netWeightKg: summary.netWeightKg 
        });
    }

    return (
        <DialogContent className="max-w-2xl rounded-3xl overflow-hidden p-0 border-none shadow-2xl">
            <DialogHeader className="bg-primary p-6 text-white">
                <DialogTitle className="text-xl">Paddy Weight Standardization</DialogTitle>
                <DialogDescription className="text-white/70">Apply deductions and Mandi FAQ weight factors (e.g. 78kg considered 75kg).</DialogDescription>
            </DialogHeader>
            <div className="p-6">
                <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
                    <TabsList className="grid w-full grid-cols-2 bg-muted/50 p-1 rounded-xl">
                        <TabsTrigger value="uniform" className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm">Uniform Bags</TabsTrigger>
                        <TabsTrigger value="non-uniform" className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm">Direct Weight/Kanta</TabsTrigger>
                    </TabsList>
                    
                    <TabsContent value="uniform" className="mt-0">
                        <Form {...uniformForm}>
                            <form className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <div className="space-y-4">
                                    <FormField control={uniformForm.control} name="numberOfBags" render={({ field }) => (
                                        <FormItem><FormLabel>Number of Bags</FormLabel><FormControl><Input type="number" placeholder="e.g., 200" {...field} className="rounded-xl" /></FormControl><FormMessage /></FormItem>
                                    )} />
                                    <div className="grid grid-cols-2 gap-4">
                                        <FormField control={uniformForm.control} name="weightPerBag" render={({ field }) => (
                                            <FormItem><FormLabel>Actual Bag Wt (kg)</FormLabel><FormControl><Input type="number" step="0.1" {...field} className="rounded-xl" /></FormControl><FormMessage /></FormItem>
                                        )} />
                                        <FormField control={uniformForm.control} name="consideredWeight" render={({ field }) => (
                                            <FormItem><FormLabel>Mandi FAQ Wt (kg)</FormLabel><FormControl><Input type="number" step="0.1" {...field} className="rounded-xl" /></FormControl><FormMessage /></FormItem>
                                        )} />
                                    </div>
                                    <FormField control={uniformForm.control} name="deduction" render={({ field }) => (
                                        <FormItem><FormLabel>Total Extra Deduction (kg)</FormLabel><FormControl><Input type="number" step="0.1" placeholder="0" {...field} className="rounded-xl" /></FormControl><FormMessage /></FormItem>
                                    )} />
                                </div>
                                <div className="space-y-4 rounded-3xl border border-primary/10 bg-primary/5 p-6 h-fit">
                                    <h3 className="text-lg font-bold text-primary flex items-center gap-2">Calculation Result</h3>
                                    <div className="space-y-3 text-sm">
                                        <div className="flex justify-between font-medium"><span className="text-muted-foreground">Gross Actual Weight</span><span>{summary.grossWeightKg.toFixed(2)} kg</span></div>
                                        <div className="flex justify-between text-destructive font-medium"><span className="text-destructive/80">Deduction applied</span><span>- {summary.deductionKg.toFixed(2)} kg</span></div>
                                        <Separator className="bg-primary/10" />
                                        <div className="flex justify-between font-bold"><span className="text-primary/70">Mandi Considered Wt</span><span className="text-primary">{summary.mandiWeightKg.toFixed(2)} kg</span></div>
                                        <div className="pt-2">
                                            <Badge variant="secondary" className="w-full justify-between py-2 text-md rounded-xl bg-primary text-white border-none">
                                                <span>Final Mandi Qtl:</span>
                                                <span className="font-black">{summary.netQuintals.toFixed(4)}</span>
                                            </Badge>
                                        </div>
                                    </div>
                                </div>
                            </form>
                        </Form>
                    </TabsContent>

                    <TabsContent value="non-uniform" className="mt-0">
                        <Form {...nonUniformForm}>
                            <form className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <div className="space-y-4">
                                    <div className="p-4 bg-muted/30 rounded-xl space-y-4">
                                        <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Weight Bridge Factor</p>
                                        <div className="grid grid-cols-2 gap-4">
                                            <FormField control={nonUniformForm.control} name="weightPerBag" render={({ field }) => (
                                                <FormItem><FormLabel>Avg Actual (kg)</FormLabel><FormControl><Input type="number" step="0.1" {...field} className="rounded-xl" /></FormControl></FormItem>
                                            )} />
                                            <FormField control={nonUniformForm.control} name="consideredWeight" render={({ field }) => (
                                                <FormItem><FormLabel>Mandi Target (kg)</FormLabel><FormControl><Input type="number" step="0.1" {...field} className="rounded-xl" /></FormControl></FormItem>
                                            )} />
                                        </div>
                                    </div>
                                    <FormField control={nonUniformForm.control} name="bags.0.weight" render={({ field }) => (
                                        <FormItem><FormLabel>Total Bridge Weight (kg)</FormLabel><FormControl><Input type="number" step="0.1" placeholder="Enter total weight" {...field} className="rounded-xl" /></FormControl><FormMessage /></FormItem>
                                    )} />
                                    <FormField control={nonUniformForm.control} name="deduction" render={({ field }) => (
                                        <FormItem><FormLabel>Deduction (kg)</FormLabel><FormControl><Input type="number" step="0.1" placeholder="0" {...field} className="rounded-xl" /></FormControl><FormMessage /></FormItem>
                                    )} />
                                </div>
                                <div className="space-y-4 rounded-3xl border border-primary/10 bg-primary/5 p-6 h-fit">
                                    <h3 className="text-lg font-bold text-primary">Calculation Result</h3>
                                    <div className="space-y-3 text-sm">
                                        <div className="flex justify-between font-medium"><span className="text-muted-foreground">Actual Net Bridge</span><span>{summary.grossWeightKg.toFixed(2)} kg</span></div>
                                        <Separator className="bg-primary/10" />
                                        <div className="flex justify-between font-bold text-primary"><span>Official Mandi Qtl</span><span className="text-lg">{summary.netQuintals.toFixed(4)}</span></div>
                                    </div>
                                </div>
                            </form>
                        </Form>
                    </TabsContent>
                </Tabs>
            </div>
           
            <DialogFooter className="bg-muted/30 p-6">
                <Button type="button" variant="ghost" onClick={onCancel} className="rounded-xl">Cancel</Button>
                <Button type="button" onClick={handleConfirm} className="rounded-xl bg-primary text-white font-bold px-8 shadow-lg shadow-primary/20">Apply to Entry</Button>
            </DialogFooter>
        </DialogContent>
    );
}
