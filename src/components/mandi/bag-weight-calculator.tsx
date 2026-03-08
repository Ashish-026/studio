'use client';

import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useMemo, useState, useRef, useEffect } from 'react';
import { Separator } from '../ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Badge } from '../ui/badge';
import { Plus, Trash2, Scale, Truck } from 'lucide-react';
import { ScrollArea } from '../ui/scroll-area';

const uniformBagSchema = z.object({
    numberOfBags: z.coerce.number().int().min(1, "Must have at least one bag."),
    weightPerBag: z.coerce.number().positive("Actual weight per bag must be positive."),
    consideredWeight: z.coerce.number().positive("Mandi standard weight must be positive."),
    deduction: z.coerce.number().min(0).default(0),
});

const bagByBagSchema = z.object({
    bags: z.array(z.object({ weight: z.coerce.number().positive("Weight must be positive.") })).min(1, "Add at least one bag."),
    consideredWeight: z.coerce.number().positive("Mandi standard weight per bag must be positive."),
    weightPerBag: z.coerce.number().positive("Base weight for ratio (e.g. 78)"),
    deduction: z.coerce.number().min(0).default(0),
});

const weighbridgeSchema = z.object({
    grossWeightTotal: z.coerce.number().positive("Total gross weight must be positive."),
    weightPerBag: z.coerce.number().positive("Reference weight (e.g. 78)"),
    consideredWeight: z.coerce.number().positive("Target weight (e.g. 75)"),
    deduction: z.coerce.number().min(0).default(0),
});

interface BagWeightCalculatorProps {
    onConfirm: (values: { grossQuintals: number; netQuintals: number; netWeightKg: number; bagWeights: number[]; method: 'uniform' | 'bag-by-bag' | 'weighbridge' }) => void;
    onCancel: () => void;
}

export function BagWeightCalculator({ onConfirm, onCancel }: BagWeightCalculatorProps) {
    const [activeTab, setActiveTab] = useState('uniform');
    const scrollRef = useRef<HTMLDivElement>(null);

    const uniformForm = useForm<z.infer<typeof uniformBagSchema>>({
        resolver: zodResolver(uniformBagSchema),
        defaultValues: { numberOfBags: 0, weightPerBag: 78, consideredWeight: 75, deduction: 0 },
    });

    const bagByBagForm = useForm<z.infer<typeof bagByBagSchema>>({
        resolver: zodResolver(bagByBagSchema),
        defaultValues: { bags: [{ weight: 0 }], consideredWeight: 75, weightPerBag: 78, deduction: 0 },
    });

    const weighbridgeForm = useForm<z.infer<typeof weighbridgeSchema>>({
        resolver: zodResolver(weighbridgeSchema),
        defaultValues: { grossWeightTotal: 0, weightPerBag: 78, consideredWeight: 75, deduction: 0 },
    });

    const { fields, append, remove } = useFieldArray({
        control: bagByBagForm.control,
        name: "bags"
    });

    const watchedUniformValues = uniformForm.watch();
    const watchedBagByBagValues = bagByBagForm.watch();
    const watchedWeighbridgeValues = weighbridgeForm.watch();

    const summary = useMemo(() => {
        let grossWeightKg = 0;
        let deductionKg = 0;
        let mandiWeightKg = 0;
        let bagWeights: number[] = [];

        if (activeTab === 'uniform') {
            const { numberOfBags, weightPerBag, consideredWeight, deduction } = watchedUniformValues;
            grossWeightKg = (numberOfBags || 0) * (weightPerBag || 0);
            deductionKg = parseFloat(String(deduction || 0));
            mandiWeightKg = (numberOfBags || 0) * (consideredWeight || 0);
            bagWeights = Array(numberOfBags || 0).fill(weightPerBag || 0);
        } else if (activeTab === 'bag-by-bag') {
            const { bags, consideredWeight, weightPerBag, deduction } = watchedBagByBagValues;
            bagWeights = (bags || []).map(b => parseFloat(String(b.weight)) || 0).filter(w => w > 0);
            grossWeightKg = bagWeights.reduce((acc, w) => acc + w, 0);
            deductionKg = parseFloat(String(deduction || 0));
            mandiWeightKg = (grossWeightKg / (weightPerBag || 78)) * (consideredWeight || 75);
        } else {
            const { grossWeightTotal, weightPerBag, consideredWeight, deduction } = watchedWeighbridgeValues;
            grossWeightKg = parseFloat(String(grossWeightTotal || 0));
            deductionKg = parseFloat(String(deduction || 0));
            mandiWeightKg = (grossWeightKg / (weightPerBag || 78)) * (consideredWeight || 75);
            bagWeights = [];
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
            bagWeights
        };
    }, [activeTab, watchedUniformValues, watchedBagByBagValues, watchedWeighbridgeValues]);

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [fields.length]);
    
    function handleConfirm() {
        onConfirm({ 
            grossQuintals: summary.grossQuintals, 
            netQuintals: summary.netQuintals, 
            netWeightKg: summary.netWeightKg,
            bagWeights: summary.bagWeights,
            method: activeTab as any
        });
    }

    const addNewBag = () => {
        append({ weight: 0 });
    };

    return (
        <DialogContent className="max-w-4xl max-h-[95vh] flex flex-col rounded-3xl overflow-hidden p-0 border-none shadow-2xl">
            <DialogHeader className="bg-primary p-6 text-white shrink-0">
                <DialogTitle className="text-2xl flex items-center gap-2">
                    <Scale className="h-7 w-7" />
                    Paddy Weight Calculator
                </DialogTitle>
                <DialogDescription className="text-white/70 font-medium">Select your calculation method for standardized Mandi weights.</DialogDescription>
            </DialogHeader>
            
            <div className="flex-1 overflow-y-auto p-6 scrollbar-thin">
                <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
                    <TabsList className="grid w-full grid-cols-3 bg-muted/50 p-1 rounded-xl h-12">
                        <TabsTrigger value="uniform" className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm">Average (Uniform)</TabsTrigger>
                        <TabsTrigger value="bag-by-bag" className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm">Bag-by-Bag</TabsTrigger>
                        <TabsTrigger value="weighbridge" className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm">Weighbridge</TabsTrigger>
                    </TabsList>
                    
                    <TabsContent value="uniform" className="mt-0 outline-none">
                        <Form {...uniformForm}>
                            <form className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <div className="space-y-4">
                                    <FormField control={uniformForm.control} name="numberOfBags" render={({ field }) => (
                                        <FormItem><FormLabel>Total Bag Count</FormLabel><FormControl><Input type="number" placeholder="e.g., 200" {...field} className="rounded-xl h-12" /></FormControl><FormMessage /></FormItem>
                                    )} />
                                    <div className="grid grid-cols-2 gap-4">
                                        <FormField control={uniformForm.control} name="weightPerBag" render={({ field }) => (
                                            <FormItem><FormLabel>Actual Avg (kg)</FormLabel><FormControl><Input type="number" step="0.1" {...field} className="rounded-xl h-12" /></FormControl><FormMessage /></FormItem>
                                        )} />
                                        <FormField control={uniformForm.control} name="consideredWeight" render={({ field }) => (
                                            <FormItem><FormLabel>Mandi Standard (kg)</FormLabel><FormControl><Input type="number" step="0.1" {...field} className="rounded-xl h-12" /></FormControl><FormMessage /></FormItem>
                                        )} />
                                    </div>
                                    <FormField control={uniformForm.control} name="deduction" render={({ field }) => (
                                        <FormItem><FormLabel>Extra Deduction (kg)</FormLabel><FormControl><Input type="number" step="0.1" placeholder="0" {...field} className="rounded-xl h-12" /></FormControl><FormMessage /></FormItem>
                                    )} />
                                </div>
                                <CalculationResult summary={summary} />
                            </form>
                        </Form>
                    </TabsContent>

                    <TabsContent value="bag-by-bag" className="mt-0 outline-none">
                        <Form {...bagByBagForm}>
                            <form className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <div className="space-y-4">
                                    <div className="flex items-center justify-between">
                                        <FormLabel className="text-primary font-bold">List of Bag Weights (kg)</FormLabel>
                                        <Badge variant="secondary" className="rounded-md bg-primary/10 text-primary">{fields.length} Bags Added</Badge>
                                    </div>
                                    
                                    <ScrollArea className="h-[320px] w-full rounded-xl border border-primary/10 bg-muted/20 p-4" ref={scrollRef}>
                                        <div className="grid grid-cols-2 gap-3">
                                            {fields.map((field, index) => (
                                                <div key={field.id} className="flex items-center gap-2 group">
                                                    <span className="text-[10px] font-bold opacity-40 w-4">{index + 1}</span>
                                                    <FormField
                                                        control={bagByBagForm.control}
                                                        name={`bags.${index}.weight`}
                                                        render={({ field }) => (
                                                            <FormControl>
                                                                <Input 
                                                                    type="number" 
                                                                    step="0.1" 
                                                                    {...field} 
                                                                    className="h-10 rounded-lg text-center font-bold border-primary/5 focus:border-primary/30"
                                                                    onKeyDown={(e) => {
                                                                        if (e.key === 'Enter') {
                                                                            e.preventDefault();
                                                                            addNewBag();
                                                                        }
                                                                    }}
                                                                    autoFocus={index === fields.length - 1}
                                                                />
                                                            </FormControl>
                                                        )}
                                                    />
                                                    <Button 
                                                        type="button" 
                                                        variant="ghost" 
                                                        size="icon" 
                                                        className="h-8 w-8 text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
                                                        onClick={() => remove(index)}
                                                    >
                                                        <Trash2 className="h-3 w-3" />
                                                    </Button>
                                                </div>
                                            ))}
                                        </div>
                                        <Button 
                                            type="button" 
                                            variant="outline" 
                                            className="w-full mt-4 border-dashed border-primary/30 text-primary hover:bg-primary/5 h-12 rounded-xl"
                                            onClick={addNewBag}
                                        >
                                            <Plus className="mr-2 h-4 w-4" /> Add Next Bag (Enter)
                                        </Button>
                                    </ScrollArea>

                                    <div className="grid grid-cols-2 gap-4">
                                        <FormField control={bagByBagForm.control} name="weightPerBag" render={({ field }) => (
                                            <FormItem><FormLabel>Ref (78kg)</FormLabel><FormControl><Input type="number" step="0.1" {...field} className="rounded-xl h-10" /></FormControl></FormItem>
                                        )} />
                                        <FormField control={bagByBagForm.control} name="consideredWeight" render={({ field }) => (
                                            <FormItem><FormLabel>Target (75kg)</FormLabel><FormControl><Input type="number" step="0.1" {...field} className="rounded-xl h-10" /></FormControl></FormItem>
                                        )} />
                                    </div>
                                </div>
                                <CalculationResult summary={summary} />
                            </form>
                        </Form>
                    </TabsContent>

                    <TabsContent value="weighbridge" className="mt-0 outline-none">
                        <Form {...weighbridgeForm}>
                            <form className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <div className="space-y-6">
                                    <div className="p-4 rounded-2xl bg-primary/5 border border-primary/10 flex items-center gap-4">
                                        <Truck className="h-8 w-8 text-primary opacity-40" />
                                        <p className="text-xs text-muted-foreground italic leading-relaxed">Use this mode for direct weighbridge readings. Standardization applies automatically based on the Reference/Target ratio.</p>
                                    </div>
                                    
                                    <FormField control={weighbridgeForm.control} name="grossWeightTotal" render={({ field }) => (
                                        <FormItem><FormLabel className="text-lg font-bold text-primary">Total Gross Bridge Weight (kg)</FormLabel><FormControl><Input type="number" step="0.1" placeholder="e.g., 15600" {...field} className="rounded-2xl h-16 text-2xl font-black text-primary border-primary/20 bg-white" /></FormControl><FormMessage /></FormItem>
                                    )} />

                                    <div className="grid grid-cols-2 gap-4">
                                        <FormField control={weighbridgeForm.control} name="weightPerBag" render={({ field }) => (
                                            <FormItem><FormLabel>Reference (e.g. 78)</FormLabel><FormControl><Input type="number" step="0.1" {...field} className="rounded-xl" /></FormControl></FormItem>
                                        )} />
                                        <FormField control={weighbridgeForm.control} name="consideredWeight" render={({ field }) => (
                                            <FormItem><FormLabel>Target (e.g. 75)</FormLabel><FormControl><Input type="number" step="0.1" {...field} className="rounded-xl" /></FormControl></FormItem>
                                        )} />
                                    </div>
                                    
                                    <FormField control={weighbridgeForm.control} name="deduction" render={({ field }) => (
                                        <FormItem><FormLabel>Manual Deduction (kg)</FormLabel><FormControl><Input type="number" step="0.1" placeholder="0" {...field} className="rounded-xl" /></FormControl></FormItem>
                                    )} />
                                </div>
                                <CalculationResult summary={summary} />
                            </form>
                        </Form>
                    </TabsContent>
                </Tabs>
            </div>
           
            <DialogFooter className="bg-muted/30 p-6 border-t flex flex-col md:flex-row items-center gap-4 shrink-0">
                <p className="text-[10px] text-muted-foreground italic max-w-xs text-center md:text-left">Formula: (Total Actual / Reference) * Target. All decimals preserved for mill accuracy.</p>
                <div className="hidden md:flex flex-1" />
                <div className="flex w-full md:w-auto gap-3">
                    <Button type="button" variant="outline" onClick={onCancel} className="flex-1 md:flex-none rounded-xl h-14 px-8 border-primary/20 font-semibold">Cancel</Button>
                    <Button 
                        type="button" 
                        onClick={handleConfirm} 
                        className="flex-1 md:flex-none rounded-xl bg-primary text-white font-black px-12 h-14 shadow-xl shadow-primary/20 hover:scale-[1.02] transition-all"
                    >
                        Apply to Record
                    </Button>
                </div>
            </DialogFooter>
        </DialogContent>
    );
}

function CalculationResult({ summary }: { summary: any }) {
    return (
        <div className="space-y-4 rounded-3xl border border-primary/10 bg-primary/5 p-6 h-fit shadow-inner sticky top-0">
            <h3 className="text-lg font-bold text-primary flex items-center gap-2">
                <Scale className="h-5 w-5" />
                Live Summary
            </h3>
            <div className="space-y-3 text-sm">
                <div className="flex justify-between font-medium"><span className="text-muted-foreground">Gross Weight</span><span className="font-bold">{summary.grossWeightKg.toLocaleString()} kg</span></div>
                <div className="flex justify-between text-destructive font-medium"><span className="text-destructive/80">Manual Deduction</span><span className="font-bold">- {summary.deductionKg.toFixed(2)} kg</span></div>
                <Separator className="bg-primary/10" />
                <div className="flex justify-between font-bold"><span className="text-primary/70">Standardized Mandi Wt</span><span className="text-primary text-lg">{summary.mandiWeightKg.toLocaleString()} kg</span></div>
                <div className="pt-4">
                    <Badge variant="secondary" className="w-full flex-col items-center py-4 rounded-2xl bg-primary text-white border-none shadow-lg gap-1">
                        <span className="opacity-70 text-[10px] uppercase font-bold tracking-widest">Final Mandi Quantity</span>
                        <div className="flex items-baseline gap-1">
                            <span className="font-black text-3xl">{summary.netQuintals.toFixed(4)}</span>
                            <span className="text-xs opacity-60">Qtl</span>
                        </div>
                    </Badge>
                </div>
            </div>
        </div>
    );
}
