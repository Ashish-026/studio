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
import { Plus, Trash2, Scale } from 'lucide-react';
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

interface BagWeightCalculatorProps {
    onConfirm: (values: { grossQuintals: number; netQuintals: number; netWeightKg: number; bagWeights: number[] }) => void;
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

    const { fields, append, remove } = useFieldArray({
        control: bagByBagForm.control,
        name: "bags"
    });

    const watchedUniformValues = uniformForm.watch();
    const watchedBagByBagValues = bagByBagForm.watch();

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
            // Simulate weights for storage if needed, or leave empty
            bagWeights = Array(numberOfBags || 0).fill(weightPerBag || 0);
        } else {
            const { bags, consideredWeight, weightPerBag, deduction } = watchedBagByBagValues;
            bagWeights = (bags || []).map(b => parseFloat(String(b.weight)) || 0).filter(w => w > 0);
            grossWeightKg = bagWeights.reduce((acc, w) => acc + w, 0);
            deductionKg = parseFloat(String(deduction || 0));
            // Logic: (Total Gross / Reference Base) * Standard
            mandiWeightKg = (grossWeightKg / (weightPerBag || 78)) * (consideredWeight || 75);
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
    }, [activeTab, watchedUniformValues, watchedBagByBagValues]);

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
            bagWeights: summary.bagWeights
        });
    }

    const addNewBag = () => {
        append({ weight: 0 });
    };

    return (
        <DialogContent className="max-w-3xl rounded-3xl overflow-hidden p-0 border-none shadow-2xl">
            <DialogHeader className="bg-primary p-6 text-white">
                <DialogTitle className="text-xl flex items-center gap-2">
                    <Scale className="h-6 w-6" />
                    Paddy Weight Standardization
                </DialogTitle>
                <DialogDescription className="text-white/70">Enter individual bag weights or use averages for official Mandi calculations.</DialogDescription>
            </DialogHeader>
            <div className="p-6">
                <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
                    <TabsList className="grid w-full grid-cols-2 bg-muted/50 p-1 rounded-xl">
                        <TabsTrigger value="uniform" className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm">Average Mode (Quick)</TabsTrigger>
                        <TabsTrigger value="bag-by-bag" className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm">Bag-by-Bag (Detailed)</TabsTrigger>
                    </TabsList>
                    
                    <TabsContent value="uniform" className="mt-0">
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
                                            <FormItem><FormLabel>Mandi FAQ (kg)</FormLabel><FormControl><Input type="number" step="0.1" {...field} className="rounded-xl h-12" /></FormControl><FormMessage /></FormItem>
                                        )} />
                                    </div>
                                    <FormField control={uniformForm.control} name="deduction" render={({ field }) => (
                                        <FormItem><FormLabel>Extra Deduction (kg)</FormLabel><FormControl><Input type="number" step="0.1" placeholder="0" {...field} className="rounded-xl h-12" /></FormControl><FormMessage /></FormItem>
                                    )} />
                                </div>
                                <div className="space-y-4 rounded-3xl border border-primary/10 bg-primary/5 p-6 h-fit">
                                    <h3 className="text-lg font-bold text-primary">Calculation Result</h3>
                                    <div className="space-y-3 text-sm">
                                        <div className="flex justify-between font-medium"><span className="text-muted-foreground">Gross Weight</span><span>{summary.grossWeightKg.toFixed(2)} kg</span></div>
                                        <div className="flex justify-between text-destructive font-medium"><span className="text-destructive/80">Deduction</span><span>- {summary.deductionKg.toFixed(2)} kg</span></div>
                                        <Separator className="bg-primary/10" />
                                        <div className="flex justify-between font-bold"><span className="text-primary/70">Mandi Final Wt</span><span className="text-primary">{summary.mandiWeightKg.toFixed(2)} kg</span></div>
                                        <div className="pt-4">
                                            <Badge variant="secondary" className="w-full justify-between py-3 text-md rounded-2xl bg-primary text-white border-none shadow-lg">
                                                <span className="opacity-80">Official Mandi Qtl:</span>
                                                <span className="font-black text-xl">{summary.netQuintals.toFixed(4)}</span>
                                            </Badge>
                                        </div>
                                    </div>
                                </div>
                            </form>
                        </Form>
                    </TabsContent>

                    <TabsContent value="bag-by-bag" className="mt-0">
                        <Form {...bagByBagForm}>
                            <form className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <div className="space-y-4">
                                    <div className="flex items-center justify-between">
                                        <FormLabel className="text-primary font-bold">List of Bag Weights (kg)</FormLabel>
                                        <Badge variant="outline" className="rounded-md border-primary/20 text-primary">{fields.length} Bags Added</Badge>
                                    </div>
                                    
                                    <ScrollArea className="h-[280px] w-full rounded-xl border border-primary/10 bg-muted/20 p-4" ref={scrollRef}>
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
                                            <Plus className="mr-2 h-4 w-4" /> Add Next Bag
                                        </Button>
                                    </ScrollArea>

                                    <div className="grid grid-cols-2 gap-4">
                                        <FormField control={bagByBagForm.control} name="weightPerBag" render={({ field }) => (
                                            <FormItem><FormLabel>Reference (e.g. 78)</FormLabel><FormControl><Input type="number" step="0.1" {...field} className="rounded-xl" /></FormControl></FormItem>
                                        )} />
                                        <FormField control={bagByBagForm.control} name="consideredWeight" render={({ field }) => (
                                            <FormItem><FormLabel>Target (e.g. 75)</FormLabel><FormControl><Input type="number" step="0.1" {...field} className="rounded-xl" /></FormControl></FormItem>
                                        )} />
                                    </div>
                                </div>

                                <div className="space-y-4 rounded-3xl border border-primary/10 bg-primary/5 p-6 h-fit">
                                    <h3 className="text-lg font-bold text-primary">Calculation Summary</h3>
                                    <div className="space-y-3 text-sm">
                                        <div className="flex justify-between font-medium"><span className="text-muted-foreground">Total Measured Sum</span><span>{summary.grossWeightKg.toFixed(2)} kg</span></div>
                                        <div className="flex justify-between font-medium"><span className="text-muted-foreground">Bag Count</span><span>{summary.bagWeights.length}</span></div>
                                        <Separator className="bg-primary/10" />
                                        <div className="flex justify-between font-bold text-primary"><span>Official Mandi Wt</span><span className="text-lg">{summary.mandiWeightKg.toFixed(2)} kg</span></div>
                                        <div className="pt-4">
                                            <Badge variant="secondary" className="w-full justify-between py-3 text-md rounded-2xl bg-primary text-white border-none shadow-lg">
                                                <span className="opacity-80">Mandi Quintals:</span>
                                                <span className="font-black text-xl">{summary.netQuintals.toFixed(4)}</span>
                                            </Badge>
                                        </div>
                                    </div>
                                </div>
                            </form>
                        </Form>
                    </TabsContent>
                </Tabs>
            </div>
           
            <DialogFooter className="bg-muted/30 p-6 flex flex-col md:flex-row gap-4">
                <p className="text-[10px] text-muted-foreground italic max-w-xs">Formula: (Total Actual / Reference) * Target Standard. All decimals are preserved for accuracy.</p>
                <div className="flex-1" />
                <Button type="button" variant="ghost" onClick={onCancel} className="rounded-xl">Cancel</Button>
                <Button type="button" onClick={handleConfirm} className="rounded-xl bg-primary text-white font-bold px-10 h-14 shadow-xl shadow-primary/20 hover:scale-105 transition-transform">Apply to Record</Button>
            </DialogFooter>
        </DialogContent>
    );
}
